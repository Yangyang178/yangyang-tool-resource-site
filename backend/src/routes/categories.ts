import express from 'express';
import { CategoryModel } from '../models/Category';

const router = express.Router();

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    const includeCount = req.query.include_count === 'true';
    const categories = await CategoryModel.getCategories(includeCount);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取分类详情
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的分类ID'
      });
    }

    const category = await CategoryModel.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: '分类不存在'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('获取分类详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类详情失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 创建分类 (管理员功能)
router.post('/', async (req, res) => {
  try {
    const { name, description, icon, sort_order } = req.body;

    // 基础验证
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称为必填项'
      });
    }

    // 检查名称是否已存在
    const nameExists = await CategoryModel.checkNameExists(name);
    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: '分类名称已存在'
      });
    }

    const categoryData = {
      name,
      description,
      icon,
      sort_order: sort_order ? parseInt(sort_order) : 0
    };

    const categoryId = await CategoryModel.createCategory(categoryData);
    
    res.status(201).json({
      success: true,
      message: '分类创建成功',
      data: { id: categoryId }
    });
  } catch (error) {
    console.error('创建分类错误:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 更新分类 (管理员功能)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的分类ID'
      });
    }

    const updateData = { ...req.body };
    delete updateData.id; // 防止更新ID
    
    // 检查名称是否已存在（排除当前分类）
    if (updateData.name) {
      const nameExists = await CategoryModel.checkNameExists(updateData.name, id);
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: '分类名称已存在'
        });
      }
    }

    // 处理数字字段
    if (updateData.sort_order) {
      updateData.sort_order = parseInt(updateData.sort_order);
    }

    const success = await CategoryModel.updateCategory(id, updateData);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '分类不存在或更新失败'
      });
    }

    res.json({
      success: true,
      message: '分类更新成功'
    });
  } catch (error) {
    console.error('更新分类错误:', error);
    res.status(500).json({
      success: false,
      message: '更新分类失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 删除分类 (管理员功能)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的分类ID'
      });
    }

    const success = await CategoryModel.deleteCategory(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '分类不存在或删除失败'
      });
    }

    res.json({
      success: true,
      message: '分类删除成功'
    });
  } catch (error) {
    console.error('删除分类错误:', error);
    
    if (error instanceof Error && error.message.includes('还有资源')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: '删除分类失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 更新分类排序 (管理员功能)
router.put('/sort/update', async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: '更新数据格式错误'
      });
    }

    // 验证更新数据格式
    for (const update of updates) {
      if (!update.id || typeof update.sort_order !== 'number') {
        return res.status(400).json({
          success: false,
          message: '更新数据格式错误，需要包含id和sort_order字段'
        });
      }
    }

    const success = await CategoryModel.updateSortOrder(updates);
    
    if (!success) {
      return res.status(500).json({
        success: false,
        message: '更新排序失败'
      });
    }

    res.json({
      success: true,
      message: '分类排序更新成功'
    });
  } catch (error) {
    console.error('更新分类排序错误:', error);
    res.status(500).json({
      success: false,
      message: '更新分类排序失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

// 获取分类统计信息
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await CategoryModel.getCategoryStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取分类统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类统计失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
});

export default router;