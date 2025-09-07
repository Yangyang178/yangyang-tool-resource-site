import { query } from '../config/database';

// 分类接口定义
export interface Category {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  status?: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
  resource_count?: number; // 该分类下的资源数量
}

export class CategoryModel {
  // 获取所有分类
  static async getCategories(includeCount: boolean = false): Promise<Category[]> {
    let sql = `
      SELECT 
        c.id, c.name, c.description, c.icon, c.sort_order, 
        c.status, c.created_at, c.updated_at
    `;

    if (includeCount) {
      sql += `, COUNT(r.id) as resource_count`;
    }

    sql += `
      FROM categories c
    `;

    if (includeCount) {
      sql += `
        LEFT JOIN resources r ON c.id = r.category_id AND r.status = 'active'
      `;
    }

    sql += `
      WHERE c.status = 'active'
    `;

    if (includeCount) {
      sql += ` GROUP BY c.id`;
    }

    sql += ` ORDER BY c.sort_order ASC, c.created_at ASC`;

    try {
      const results = await query(sql) as any[];
      return results as Category[];
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  }

  // 根据ID获取分类
  static async getCategoryById(id: number): Promise<Category | null> {
    const sql = `
      SELECT 
        c.id, c.name, c.description, c.icon, c.sort_order, 
        c.status, c.created_at, c.updated_at,
        COUNT(r.id) as resource_count
      FROM categories c
      LEFT JOIN resources r ON c.id = r.category_id AND r.status = 'active'
      WHERE c.id = ? AND c.status = 'active'
      GROUP BY c.id
    `;

    try {
      const result = await query(sql, [id]) as any[];
      return result.length > 0 ? result[0] as Category : null;
    } catch (error) {
      console.error('获取分类详情失败:', error);
      throw error;
    }
  }

  // 创建分类
  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const sql = `
      INSERT INTO categories (name, description, icon, sort_order, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      category.name,
      category.description || null,
      category.icon || null,
      category.sort_order || 0,
      category.status || 'active'
    ];

    try {
      const result = await query(sql, values) as any;
      return result.lastID;
    } catch (error) {
      console.error('创建分类失败:', error);
      throw error;
    }
  }

  // 更新分类
  static async updateCategory(id: number, category: Partial<Category>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    // 动态构建更新字段
    Object.entries(category).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    try {
      const result = await query(sql, values) as any;
      return result.changes > 0;
    } catch (error) {
      console.error('更新分类失败:', error);
      throw new Error('更新分类失败');
    }
  }

  // 删除分类 (软删除)
  static async deleteCategory(id: number): Promise<boolean> {
    // 检查是否有资源使用此分类
    const checkSql = 'SELECT COUNT(*) as count FROM resources WHERE category_id = ? AND status = "active"';
    const checkResult = await query(checkSql, [id]) as any[];
    
    if (checkResult[0].count > 0) {
      throw new Error('该分类下还有资源，无法删除');
    }

    const sql = 'UPDATE categories SET status = "inactive" WHERE id = ?';

    try {
      const result = await query(sql, [id]) as any;
       return result.changes > 0;
    } catch (error) {
      console.error('删除分类失败:', error);
      throw new Error('删除分类失败');
    }
  }

  // 检查分类名称是否存在
  static async checkNameExists(name: string, excludeId?: number): Promise<boolean> {
    let sql = 'SELECT COUNT(*) as count FROM categories WHERE name = ? AND status = "active"';
    const params: any[] = [name];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const result = await query(sql, params) as any[];
      return result[0].count > 0;
    } catch (error) {
      console.error('检查分类名称失败:', error);
      throw new Error('检查分类名称失败');
    }
  }

  // 更新分类排序
  static async updateSortOrder(updates: { id: number; sort_order: number }[]): Promise<boolean> {
    try {
      // 使用事务更新多个分类的排序
      const promises = updates.map(update => 
        query('UPDATE categories SET sort_order = ? WHERE id = ?', [update.sort_order, update.id])
      );
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('更新分类排序失败:', error);
      throw new Error('更新分类排序失败');
    }
  }

  // 获取分类统计信息
  static async getCategoryStats(): Promise<any[]> {
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.icon,
        COUNT(r.id) as resource_count,
        COALESCE(SUM(r.download_count), 0) as total_downloads,
        MAX(r.created_at) as latest_resource_date
      FROM categories c
      LEFT JOIN resources r ON c.id = r.category_id AND r.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id, c.name, c.icon
      ORDER BY resource_count DESC, c.sort_order ASC
    `;

    try {
      const result = await query(sql) as any[];
      return result;
    } catch (error) {
      console.error('获取分类统计失败:', error);
      throw new Error('获取分类统计失败');
    }
  }
}