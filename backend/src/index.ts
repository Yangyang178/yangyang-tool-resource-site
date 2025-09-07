import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './utils/initData';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 性能监控中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // 记录超过1秒的慢请求
      console.warn(`⚠️ 慢请求: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});

// 中间件配置
app.use(helmet()); // 安全头
app.use(cors()); // 跨域
app.use(morgan('combined')); // 日志
app.use(express.json({ limit: '10mb' })); // JSON解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码解析

// 静态文件服务 - 提供上传文件访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
import apiRoutes from './routes/api';
app.use('/api', apiRoutes);

// 基础路由
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    message: '工具资源站 API 服务',
    version: '1.0.0',
    status: 'running'
  });
});

// 健康检查
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API路由 (待添加)
// app.use('/api/resources', resourceRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/upload', uploadRoutes);

// 404处理
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📱 API地址: http://localhost:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  
  // 初始化数据库
  try {
    await initializeDatabase();
    console.log('数据库初始化成功');
    
    // 创建性能优化索引
    const { ResourceModel } = await import('./models/Resource');
    await ResourceModel.createIndexes();
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
});

export default app;
