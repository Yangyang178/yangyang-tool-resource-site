import api from './api';
import type { ApiResponse } from './api';
import type { PaginatedResponse } from './api';

// 资源相关类型定义
export interface Resource {
  id: number;
  title: string;
  description?: string;
  category_id?: number;
  file_type?: string;
  file_size?: number;
  download_url: string;
  download_password?: string;
  thumbnail_url?: string;
  download_count?: number;
  tags?: string[];
  status?: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  category_name?: string;
  category_icon?: string;
}

export interface ResourceQueryParams {
  page?: number;
  limit?: number;
  category_id?: number;
  search?: string;
  tags?: string;
  sort_by?: 'created_at' | 'download_count' | 'title';
  sort_order?: 'asc' | 'desc';
  status?: 'active' | 'inactive';
}

export interface CreateResourceData {
  title: string;
  description?: string;
  category_id?: number;
  file_type?: string;
  file_size?: number;
  download_url: string;
  download_password?: string;
  thumbnail_url?: string;
  tags?: string[];
}

export interface UpdateResourceData {
  title?: string;
  description?: string;
  category_id?: number;
  file_type?: string;
  file_size?: number;
  download_url?: string;
  download_password?: string;
  thumbnail_url?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
}

// 资源服务类
class ResourceService {
  // 获取资源列表
  async getResources(params?: ResourceQueryParams): Promise<PaginatedResponse<Resource>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const url = `/api/resources${queryString ? `?${queryString}` : ''}`;
    
    return api.get(url);
  }

  // 获取资源详情
  async getResourceById(id: number): Promise<ApiResponse<Resource>> {
    return api.get(`/api/resources/${id}`);
  }

  // 创建资源
  async createResource(data: CreateResourceData): Promise<ApiResponse<{ id: number }>> {
    return api.post('/api/resources', data);
  }

  // 更新资源
  async updateResource(id: number, data: UpdateResourceData): Promise<ApiResponse> {
    return api.put(`/api/resources/${id}`, data);
  }

  // 删除资源
  async deleteResource(id: number): Promise<ApiResponse> {
    return api.delete(`/api/resources/${id}`);
  }

  // 记录下载
  async recordDownload(id: number): Promise<ApiResponse<{ download_url: string; download_password?: string }>> {
    return api.post(`/api/resources/${id}/download`);
  }

  // 增加下载计数
  async incrementDownloadCount(id: number): Promise<ApiResponse> {
    return api.post(`/api/resources/${id}/increment-download`);
  }

  // 获取下载链接
  async getDownloadUrl(id: number): Promise<ApiResponse<{ download_url: string; filename: string; file_size: number; file_type: string }>> {
    return api.get(`/api/resources/${id}/download-url`);
  }

  // 获取热门资源
  async getPopularResources(limit: number = 10): Promise<ApiResponse<Resource[]>> {
    return api.get(`/api/resources/popular/list?limit=${limit}`);
  }

  // 直接下载资源文件
  async downloadResource(id: number): Promise<void> {
    try {
      // 构建下载URL
      const downloadUrl = `${api.defaults.baseURL}/api/resources/${id}/download`;
      
      // 创建隐藏的下载链接
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // 触发下载
      link.click();
      
      // 清理
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('下载资源失败:', error);
      throw error;
    }
  }

  // 下载资源文件（带进度显示）
  async downloadResourceWithProgress(
    id: number, 
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      // 获取下载信息
      const urlResponse = await this.getDownloadUrl(id);
      if (!urlResponse.success || !urlResponse.data) {
        throw new Error('获取下载链接失败');
      }

      const { download_url, filename } = urlResponse.data;
      
      // 使用fetch下载文件以支持进度显示
      const response = await fetch(download_url);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        if (onProgress && total > 0) {
          onProgress((loaded / total) * 100);
        }
      }

      // 合并所有chunks
      const blob = new Blob(chunks);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('下载资源失败:', error);
      throw error;
    }
  }
}

// 导出服务实例
export { ResourceService };
export const resourceService = new ResourceService();
export default resourceService;