# 环境变量配置指南

## 📁 配置文件说明

### 后端环境变量
- `.env` - 开发环境配置
- `.env.production` - 生产环境配置

### 前端环境变量
- `frontend/.env` - 开发环境配置
- `frontend/.env.production` - 生产环境配置

## 🔧 开发环境配置

### 后端配置 (根目录/.env)
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=resource_station
DB_USER=root
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3001
NODE_ENV=development

# 前端URL (用于CORS)
FRONTEND_URL=http://localhost:5173
```

### 前端配置 (frontend/.env)
```bash
# API配置
VITE_API_BASE_URL=http://localhost:3001

# 应用配置
VITE_APP_TITLE=个人资源站
VITE_APP_DESCRIPTION=个人资源分享平台
```

## 🌐 生产环境配置

### 重要修改项
1. **JWT_SECRET**: 使用强随机密码
2. **VITE_API_BASE_URL**: 改为实际的API域名
3. **CORS_ORIGIN**: 设置为前端域名
4. **数据库配置**: 使用生产数据库

## 🚀 部署配置

### Vercel部署（前端）
在Vercel项目设置中添加环境变量：
```
VITE_API_BASE_URL=https://your-api-domain.com
VITE_APP_TITLE=个人资源站
```

### Docker部署
使用docker-compose时，环境变量会自动加载。

## ⚠️ 安全注意事项

1. **不要提交.env文件到Git**
2. **定期更换JWT_SECRET**
3. **使用强密码**
4. **限制CORS域名**

## 🔍 故障排除

### 手机无法访问问题
- 确保VITE_API_BASE_URL使用公网可访问的地址
- 检查CORS配置是否正确
- 验证API服务是否正常运行

### 常见错误
- `CORS错误`: 检查FRONTEND_URL配置
- `API连接失败`: 检查VITE_API_BASE_URL配置
- `认证失败`: 检查JWT_SECRET配置