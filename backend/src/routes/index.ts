import express from 'express';
import resourceRoutes from './resources';
import categoryRoutes from './categories';

const router = express.Router();

// API版本前缀
const API_VERSION = '/api/v1';

// 注册路由
router.use(`${API_VERSION}/resources`, resourceRoutes);
router.use(`${API_VERSION}/categories`, categoryRoutes);

// API根路径
router.get(API_VERSION, (req, res) => {
  res.json({
    success: true,
    message: '个人资源站 API v1.0',
    version: '1.0.0',
    endpoints: {
      resources: `${API_VERSION}/resources`,
      categories: `${API_VERSION}/categories`
    },
    documentation: {
      resources: {
        'GET /resources': '获取资源列表',
        'GET /resources/:id': '获取资源详情',
        'POST /resources': '创建资源',
        'PUT /resources/:id': '更新资源',
        'DELETE /resources/:id': '删除资源',
        'POST /resources/:id/download': '记录下载',
        'GET /resources/popular': '获取热门资源'
      },
      categories: {
        'GET /categories': '获取分类列表',
        'GET /categories/:id': '获取分类详情',
        'POST /categories': '创建分类',
        'PUT /categories/:id': '更新分类',
        'DELETE /categories/:id': '删除分类',
        'PUT /categories/sort/update': '更新分类排序',
        'GET /categories/stats/overview': '获取分类统计'
      }
    }
  });
});

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;