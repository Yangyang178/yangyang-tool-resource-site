import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import * as resourceController from '../controllers/resourceController';
import { uploadSingle, handleUploadError } from '../middleware/upload';
import resourceRoutes from './resources';

const router = Router();

// 分类相关路由
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryController.getCategoryById);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// 资源相关路由 - 使用专门的资源路由文件
router.use('/resources', resourceRoutes);

export default router;