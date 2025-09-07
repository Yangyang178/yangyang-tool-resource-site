import express from 'express';
import { ResourceModel, ResourceQuery } from '../models/Resource';
import { downloadResource, getDownloadUrl } from '../controllers/resourceController';

const router = express.Router();

// 获取资源列表
router.get('/', async (req, res) => {
  try {
    const query: ResourceQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
      search: req.query.search as string,
      sort_by: (req.query.sort_by as 'created_at' | 'download_count' | 'title') || 'created_at',
      sort_order: (req.query.sort_order as 'ASC' | 'DESC') || 'DESC'
    };

    const result = await ResourceModel.getResources(query);
    
    res.json({
      success: true,
      data: result.resources,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        pages: Math.ceil(result.total / query.limit!)
      }
    });
  } catch (error) {
    console.error('获取资源列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取资源列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取资源详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的资源ID'
      });
    }

    const resource = await ResourceModel.getResourceById(id);
    
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
    console.error('获取资源详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取资源详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 创建资源
router.post('/', async (req, res) => {
  try {
    const { title, description, category_id, file_type, file_size, download_url, download_password, thumbnail_url, tags } = req.body;

    // 基础验证
    if (!title || !download_url) {
      return res.status(400).json({
        success: false,
        message: '标题和下载链接为必填项'
      });
    }

    const resourceData = {
      title,
      description,
      category_id: category_id ? parseInt(category_id) : undefined,
      file_type,
      file_size: file_size ? parseInt(file_size) : undefined,
      download_url,
      download_password,
      thumbnail_url,
      tags: Array.isArray(tags) ? tags : []
    };

    const resourceId = await ResourceModel.createResource(resourceData);
    
    res.status(201).json({
      success: true,
      message: '资源创建成功',
      data: { id: resourceId }
    });
  } catch (error) {
    console.error('创建资源错误:', error);
    res.status(500).json({
      success: false,
      message: '创建资源失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 更新资源
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的资源ID'
      });
    }

    const updateData = { ...req.body };
    delete updateData.id; // 防止更新ID
    
    // 处理数字字段
    if (updateData.category_id) {
      updateData.category_id = parseInt(updateData.category_id);
    }
    if (updateData.file_size) {
      updateData.file_size = parseInt(updateData.file_size);
    }

    const success = await ResourceModel.updateResource(id, updateData);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '资源不存在或更新失败'
      });
    }

    res.json({
      success: true,
      message: '资源更新成功'
    });
  } catch (error) {
    console.error('更新资源错误:', error);
    res.status(500).json({
      success: false,
      message: '更新资源失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 删除资源 (管理员功能)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的资源ID'
      });
    }

    const success = await ResourceModel.deleteResource(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '资源不存在或删除失败'
      });
    }

    res.json({
      success: true,
      message: '资源删除成功'
    });
  } catch (error) {
    console.error('删除资源错误:', error);
    res.status(500).json({
      success: false,
      message: '删除资源失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 直接下载文件
router.get('/:id/download', downloadResource);

// 获取下载链接
router.get('/:id/download-url', getDownloadUrl);

// 预览工具
router.get('/:id/preview', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).send('<h1>错误：无效的资源ID</h1>');
    }

    // 获取资源信息
    const resource = await ResourceModel.getResourceById(id);
    if (!resource) {
      return res.status(404).send('<h1>错误：资源不存在</h1>');
    }

    // 如果是HTML文件，返回预览页面
    if (resource.file_type === 'html') {
      // 这里应该从实际存储位置读取HTML文件内容
      // 目前先返回一个示例预览页面
      const previewHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resource.title} - 工具预览</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .preview-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .preview-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .preview-title {
            margin: 0;
            color: #333;
            font-size: 24px;
        }
        .preview-description {
            margin: 8px 0 0 0;
            color: #666;
            font-size: 14px;
        }
        .preview-content {
            padding: 30px;
            text-align: center;
        }
        .preview-icon {
            font-size: 4rem;
            margin-bottom: 20px;
        }
        .download-section {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .download-btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        .download-btn:hover {
            transform: translateY(-2px);
            color: white;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="preview-header">
            <h1 class="preview-title">${resource.title}</h1>
            <p class="preview-description">${resource.description || '暂无描述'}</p>
        </div>
        <div class="preview-content">
            <div class="preview-icon">🛠️</div>
            <h2>工具预览</h2>
            <p>这是一个HTML工具的预览页面。</p>
            <p>由于安全限制，无法直接在此页面运行工具代码。</p>
            <p>请下载工具文件到本地后在浏览器中打开使用。</p>
        </div>
        <div class="download-section">
            <p>要使用此工具，请点击下方按钮下载：</p>
            <a href="${resource.download_url}" class="download-btn" target="_blank">
                📥 下载工具
            </a>
            ${resource.download_password ? `<p style="margin-top: 15px; color: #666;">提取码：<strong>${resource.download_password}</strong></p>` : ''}
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(previewHtml);
    } else {
      res.status(400).send('<h1>错误：该资源类型不支持预览</h1>');
    }
  } catch (error) {
    console.error('预览资源错误:', error);
    res.status(500).send('<h1>服务器错误：预览失败</h1>');
  }
});

// 记录下载（保留原有接口兼容性）
router.post('/:id/download', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的资源ID'
      });
    }

    // 检查资源是否存在
    const resource = await ResourceModel.getResourceById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 增加下载次数
    await ResourceModel.incrementDownloadCount(id);
    
    res.json({
      success: true,
      message: '下载记录成功',
      data: {
        download_url: `/api/resources/${id}/download`,
        download_password: resource.download_password
      }
    });
  } catch (error) {
    console.error('记录下载错误:', error);
    res.status(500).json({
      success: false,
      message: '记录下载失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取热门资源
router.get('/popular/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const resources = await ResourceModel.getPopularResources(limit);
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('获取热门资源错误:', error);
    res.status(500).json({
      success: false,
      message: '获取热门资源失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;