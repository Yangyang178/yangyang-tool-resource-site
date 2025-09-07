import { Request, Response } from 'express';
import { ResourceModel } from '../models/Resource';
import path from 'path';
import fs from 'fs';

// 移除实例化，使用静态方法

export const getResources = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      category_id,
      search,
      status = 'active'
    } = req.query;

    const query = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      category_id: category_id ? parseInt(category_id as string) : undefined,
      search: search as string,
      status: status as 'active' | 'inactive'
    };

    const result = await ResourceModel.getResources(query);
    
    res.json({
      success: true,
      data: result.resources,
      pagination: {
        currentPage: query.page,
        totalPages: Math.ceil(result.total / query.limit),
        totalItems: result.total,
        itemsPerPage: query.limit
      }
    });
  } catch (error) {
    console.error('获取资源列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取资源列表失败'
    });
  }
};

export const getResourceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resource = await ResourceModel.getResourceById(parseInt(id));
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('获取资源详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取资源详情失败'
    });
  }
};

export const downloadResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id);

    if (isNaN(resourceId)) {
      return res.status(400).json({
        success: false,
        message: '无效的资源ID'
      });
    }

    const resource = await ResourceModel.getResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 构建文件路径
    if (!resource.file_path) {
      return res.status(404).json({
        success: false,
        message: '文件路径不存在'
      });
    }
    const filePath = path.join(__dirname, '../../uploads', resource.file_path);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 增加下载次数
    await ResourceModel.incrementDownloadCount(resourceId);

    // 获取文件信息
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    
    // 设置响应头
    const fileType = resource.file_type || 'application/octet-stream';
    const fileName = `${resource.title}.${fileType.split('/')[1] || 'bin'}`;
    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // 创建文件流并发送
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('文件流错误:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: '文件下载失败'
        });
      }
    });
    
  } catch (error) {
    console.error('下载资源失败:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '下载资源失败'
      });
    }
  }
};

// 获取下载链接（用于前端显示下载URL）
export const getDownloadUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id);

    if (isNaN(resourceId)) {
      return res.status(400).json({
        success: false,
        message: '无效的资源ID'
      });
    }

    const resource = await ResourceModel.getResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 返回下载链接
    res.json({
      success: true,
      data: {
        download_url: `/api/resources/${resourceId}/download`,
        filename: resource.title,
        file_size: resource.file_size,
        file_type: resource.file_type
      }
    });
  } catch (error) {
    console.error('获取下载链接失败:', error);
    res.status(500).json({
      success: false,
      message: '获取下载链接失败'
    });
  }
};

// 创建资源
export const createResource = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      category_id, 
      tags, 
      file_size, 
      file_type, 
      download_url,
      download_password,
      file_name
    } = req.body;

    // 验证必填字段
    if (!title || !description || !category_id || !download_url) {
      return res.status(400).json({
        success: false,
        message: '标题、描述、分类和下载链接为必填项'
      });
    }

    // 验证下载链接格式
    try {
      new URL(download_url);
    } catch {
      return res.status(400).json({
        success: false,
        message: '请输入有效的下载链接'
      });
    }

    const resourceData = {
      title,
      description,
      category_id: parseInt(category_id),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((tag: string) => tag.trim()) : []),
      file_size: file_size ? parseInt(file_size) : undefined,
      file_type: file_type || 'html',
      download_url,
      download_password: download_password || undefined,
      file_path: file_name || undefined,
      status: 'active' as const
    };

    const result = await ResourceModel.createResource(resourceData);

    res.status(201).json({
      success: true,
      message: '工具上传成功',
      data: { id: result }
    });
  } catch (error) {
    console.error('创建资源失败:', error);
    res.status(500).json({
      success: false,
      message: '创建资源失败'
    });
  }
};

// 更新资源
export const updateResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id);
    const { title, description, category_id, tags, status } = req.body;
    const file = req.file;

    if (isNaN(resourceId)) {
      return res.status(400).json({
        success: false,
        message: '无效的资源ID'
      });
    }

    // 检查资源是否存在
    const existingResource = await ResourceModel.getResourceById(resourceId);
    if (!existingResource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    const updateData: any = {};
    
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category_id) updateData.category_id = parseInt(category_id);
    if (tags) {
      // 处理tags字段 - 保持与ResourceModel一致的处理方式
      if (Array.isArray(tags)) {
        // 已经是数组，直接使用
        updateData.tags = tags;
      } else if (typeof tags === 'string') {
        updateData.tags = tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0);
      }
    }
    if (status) updateData.status = status;

    // 如果上传了新文件，更新文件相关信息
    if (file) {
      // 删除旧文件
      if (existingResource.download_url) {
        const oldFilePath = path.join(__dirname, '../../uploads', path.basename(existingResource.download_url));
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      updateData.download_url = `/uploads/${file.filename}`;
      updateData.file_size = file.size;
      updateData.file_type = file.mimetype || 'application/octet-stream';
    }

    await ResourceModel.updateResource(resourceId, updateData);

    res.json({
      success: true,
      message: '资源更新成功'
    });
  } catch (error) {
    console.error('更新资源失败:', error);
    res.status(500).json({
      success: false,
      message: '更新资源失败'
    });
  }
};

// 删除资源
export const deleteResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resourceId = parseInt(id);

    if (isNaN(resourceId)) {
      return res.status(400).json({
        success: false,
        message: '无效的资源ID'
      });
    }

    // 获取资源信息以删除文件
    const resource = await ResourceModel.getResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 删除文件
    if (resource.download_url) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(resource.download_url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 删除数据库记录
    await ResourceModel.deleteResource(resourceId);

    res.json({
      success: true,
      message: '资源删除成功'
    });
  } catch (error) {
    console.error('删除资源失败:', error);
    res.status(500).json({
      success: false,
      message: '删除资源失败'
    });
  }
};