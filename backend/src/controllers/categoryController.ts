import { Request, Response } from 'express';
import { CategoryModel } from '../models/Category';

// 移除实例化，使用静态方法

export const getCategories = async (req: Request, res: Response) => {
  try {
    const { includeCount = 'true' } = req.query;
    const categories = await CategoryModel.getCategories(includeCount === 'true');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败'
    });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await CategoryModel.getCategoryById(parseInt(id));
    
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
    console.error('获取分类详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类详情失败'
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '分类名称不能为空'
      });
    }

    const categoryId = await CategoryModel.createCategory({ name, description, icon });
    
    res.status(201).json({
      success: true,
      data: { id: categoryId },
      message: '分类创建成功'
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({
      success: false,
      message: '创建分类失败'
    });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, icon, status } = req.body;
    
    const success = await CategoryModel.updateCategory(parseInt(id), {
      name,
      description,
      icon,
      status
    });
    
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
    console.error('更新分类失败:', error);
    res.status(500).json({
      success: false,
      message: '更新分类失败'
    });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const success = await CategoryModel.deleteCategory(parseInt(id));
    
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
    console.error('删除分类失败:', error);
    res.status(500).json({
      success: false,
      message: '删除分类失败'
    });
  }
};