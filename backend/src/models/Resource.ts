import { query } from '../config/database';

// 资源接口定义
export interface Resource {
  id?: number;
  title: string;
  description?: string;
  category_id?: number;
  file_type?: string;
  file_size?: number;
  file_path?: string;
  download_url: string;
  download_password?: string;
  thumbnail_url?: string;
  download_count?: number;
  tags?: string[];
  status?: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
  category_name?: string;
  category_icon?: string;
}

// 查询参数接口
export interface ResourceQuery {
  page?: number;
  limit?: number;
  category_id?: number;
  search?: string;
  sort_by?: 'created_at' | 'download_count' | 'title';
  sort_order?: 'ASC' | 'DESC';
  status?: 'active' | 'inactive';
}

export class ResourceModel {
  // 创建索引以优化查询性能
  static async createIndexes(): Promise<void> {
    const { query } = await import('../config/database');
    
    try {
      await query(`CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_resources_category_id ON resources(category_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_resources_download_count ON resources(download_count)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_resources_title ON resources(title)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_resources_composite ON resources(status, category_id, created_at)`);
      console.log('✅ 数据库索引创建完成');
    } catch (error) {
      console.error('创建索引失败:', error);
    }
  }

  // 获取资源列表（优化版）
  static async getResources(params: ResourceQuery = {}): Promise<{ resources: Resource[], total: number }> {
    const {
      page = 1,
      limit = 20,
      category_id,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
      status = 'active'
    } = params;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE r.status = ?';
    let queryParams: any[] = [status];

    // 分类筛选
    if (category_id) {
      whereClause += ' AND r.category_id = ?';
      queryParams.push(category_id);
    }

    // 搜索功能
    if (search) {
      whereClause += ' AND (r.title LIKE ? OR r.description LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // 优化的资源列表查询（使用子查询优化性能）
    const resourcesQuery = `
      SELECT 
        r.id, r.title, r.description, r.category_id, r.file_type, 
        r.file_size, r.download_url, r.download_password, r.thumbnail_url,
        r.download_count, r.tags, r.status, r.created_at, r.updated_at,
        c.name as category_name, c.icon as category_icon
      FROM (
        SELECT id FROM resources r
        ${whereClause}
        ORDER BY r.${sort_by} ${sort_order}
        LIMIT ? OFFSET ?
      ) AS filtered_ids
      JOIN resources r ON r.id = filtered_ids.id
      LEFT JOIN categories c ON r.category_id = c.id
      ORDER BY r.${sort_by} ${sort_order}
    `;

    // 优化的计数查询（避免JOIN）
    const countQuery = `
      SELECT COUNT(*) as total
      FROM resources r
      ${whereClause.replace('LEFT JOIN categories c ON r.category_id = c.id', '')}
    `;

    try {
      const [resources, countResult] = await Promise.all([
        query(resourcesQuery, [...queryParams, limit, offset]) as Promise<any[]>,
        query(countQuery, queryParams) as Promise<any[]>
      ]);

      // 处理tags字段
      const processedResources = resources.map(resource => ({
        ...resource,
        tags: resource.tags ? JSON.parse(resource.tags) : []
      } as Resource));

      return {
        resources: processedResources,
        total: countResult[0].total
      };
    } catch (error) {
      console.error('获取资源列表失败:', error);
      throw error;
    }
  }

  // 根据ID获取资源详情
  static async getResourceById(id: number): Promise<Resource | null> {
    const sql = `
      SELECT 
        r.id, r.title, r.description, r.category_id, r.file_type, 
        r.file_size, r.download_url, r.download_password, r.thumbnail_url,
        r.download_count, r.tags, r.status, r.created_at, r.updated_at,
        c.name as category_name, c.icon as category_icon
      FROM resources r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = ? AND r.status = 'active'
    `;

    try {
      const result = await query(sql, [id]) as any[];
      if (result.length === 0) return null;

      const resource = result[0];
      return {
        ...resource,
        tags: resource.tags ? JSON.parse(resource.tags) : []
      } as Resource;
    } catch (error) {
      console.error('获取资源详情失败:', error);
      throw error;
    }
  }

  // 创建资源
  static async createResource(resource: Omit<Resource, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const sql = `
      INSERT INTO resources 
      (title, description, category_id, file_type, file_size, download_url, 
       download_password, thumbnail_url, tags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const tagsJson = resource.tags ? JSON.stringify(resource.tags) : null;

    try {
      const result = await query(sql, [
        resource.title,
        resource.description || null,
        resource.category_id || null,
        resource.file_type || null,
        resource.file_size || null,
        resource.download_url,
        resource.download_password || null,
        resource.thumbnail_url || null,
        tagsJson,
        resource.status || 'active'
      ]) as any;

      return result.lastID;
    } catch (error) {
      console.error('创建资源失败:', error);
      throw error;
    }
  }

  // 更新资源
  static async updateResource(id: number, resource: Partial<Resource>): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    // 动态构建更新字段
    Object.entries(resource).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        if (key === 'tags') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });

    if (fields.length === 0) return false;

    const sql = `UPDATE resources SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    try {
      const result = await query(sql, values) as any;
      return result.changes > 0;
    } catch (error) {
      console.error('更新资源失败:', error);
      throw error;
    }
  }

  // 删除资源 (软删除)
  static async deleteResource(id: number): Promise<boolean> {
    const sql = 'UPDATE resources SET status = "inactive" WHERE id = ?';

    try {
      const result = await query(sql, [id]) as any;
      return result.changes > 0;
    } catch (error) {
      console.error('删除资源失败:', error);
      throw error;
    }
  }

  // 增加下载次数
  static async incrementDownloadCount(id: number): Promise<boolean> {
    const sql = 'UPDATE resources SET download_count = download_count + 1 WHERE id = ?';

    try {
      const result = await query(sql, [id]) as any;
      return result.changes > 0;
    } catch (error) {
      console.error('更新下载次数失败:', error);
      throw error;
    }
  }

  // 获取热门资源
  static async getPopularResources(limit: number = 10): Promise<Resource[]> {
    const sql = `
      SELECT 
        r.id, r.title, r.description, r.category_id, r.file_type, 
        r.file_size, r.download_url, r.download_password, r.thumbnail_url,
        r.download_count, r.tags, r.status, r.created_at, r.updated_at,
        c.name as category_name, c.icon as category_icon
      FROM resources r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.status = 'active'
      ORDER BY r.download_count DESC, r.created_at DESC
      LIMIT ?
    `;

    try {
      const result = await query(sql, [limit]) as any[];
      return result.map(resource => ({
        ...resource,
        tags: resource.tags ? JSON.parse(resource.tags) : []
      } as Resource));
    } catch (error) {
      console.error('获取热门资源失败:', error);
      throw error;
    }
  }
}