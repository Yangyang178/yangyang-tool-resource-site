import api from './api';
import type { ApiResponse } from './api';

// 分类相关类型定义
export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  resource_count?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  status?: 'active' | 'inactive';
}

export interface CategoryStats {
  total_categories: number;
  active_categories: number;
  total_resources: number;
  categories_with_resources: number;
}

export interface SortUpdateItem {
  id: number;
  sort_order: number;
}

// 分类服务类
class CategoryService {
  // 获取分类列表
  async getCategories(includeCount: boolean = false): Promise<ApiResponse<Category[]>> {
    const url = `/api/categories${includeCount ? '?include_count=true' : ''}`;
    return api.get(url);
  }

  // 获取分类详情
  async getCategoryById(id: number): Promise<ApiResponse<Category>> {
    return api.get(`/api/categories/${id}`);
  }

  // 创建分类
  async createCategory(data: CreateCategoryData): Promise<ApiResponse<{ id: number }>> {
    return api.post('/api/categories', data);
  }

  // 更新分类
  async updateCategory(id: number, data: UpdateCategoryData): Promise<ApiResponse> {
    return api.put(`/api/categories/${id}`, data);
  }

  // 删除分类
  async deleteCategory(id: number): Promise<ApiResponse> {
    return api.delete(`/api/categories/${id}`);
  }

  // 更新分类排序
  async updateSortOrder(updates: SortUpdateItem[]): Promise<ApiResponse> {
    return api.put('/api/categories/sort/update', { updates });
  }

  // 获取分类统计信息
  async getCategoryStats(): Promise<ApiResponse<CategoryStats>> {
    return api.get('/api/categories/stats/overview');
  }

  // 获取活跃分类（用于下拉选择等）
  async getActiveCategories(): Promise<ApiResponse<Category[]>> {
    const response = await this.getCategories(true);
    if (response.success && response.data) {
      // 过滤出活跃的分类并按排序字段排序
      const activeCategories = response.data
        .filter(category => category.status === 'active')
        .sort((a, b) => a.sort_order - b.sort_order);
      
      return {
        ...response,
        data: activeCategories
      };
    }
    return response;
  }

  // 批量更新分类排序（拖拽排序后使用）
  async batchUpdateSortOrder(categories: Category[]): Promise<ApiResponse> {
    const updates = categories.map((category, index) => ({
      id: category.id,
      sort_order: index + 1
    }));
    
    return this.updateSortOrder(updates);
  }

  // 检查分类名称是否可用
  async checkNameAvailable(name: string, excludeId?: number): Promise<boolean> {
    try {
      const response = await this.getCategories();
      if (response.success && response.data) {
        const existingCategory = response.data.find(category => 
          category.name.toLowerCase() === name.toLowerCase() && 
          category.id !== excludeId
        );
        return !existingCategory;
      }
      return true;
    } catch (error) {
      console.error('检查分类名称可用性失败:', error);
      return false;
    }
  }

  // 获取分类选项（用于表单选择）
  async getCategoryOptions(): Promise<{ value: number; label: string; disabled?: boolean }[]> {
    try {
      const response = await this.getActiveCategories();
      if (response.success && response.data) {
        return response.data.map(category => ({
          value: category.id,
          label: category.name,
          disabled: category.status !== 'active'
        }));
      }
      return [];
    } catch (error) {
      console.error('获取分类选项失败:', error);
      return [];
    }
  }
}

// 导出服务实例
export { CategoryService };
export const categoryService = new CategoryService();
export default categoryService;