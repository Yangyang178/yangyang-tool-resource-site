# 个人资源站项目

一个现代化的个人资源分享平台，支持资源上传、分类管理和下载统计。

## 项目结构

```
个人资源站/
├── frontend/          # 前端React应用
├── backend/           # 后端Node.js应用
├── database/          # 数据库相关文件
├── docs/              # 项目文档
├── scripts/           # 部署和工具脚本
└── README.md          # 项目说明
```

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design UI组件库
- Vite 构建工具
- Axios HTTP客户端

### 后端
- Node.js + Express
- MySQL 数据库
- Prisma ORM
- JWT 身份验证

## 开发环境要求

- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

## 快速开始

### 方式一：使用自动化脚本（推荐）

```powershell
# 1. 初始化数据库
.\scripts\init-db.ps1

# 2. 启动开发环境
.\scripts\dev.ps1
```

### 方式二：手动启动

#### 1. 安装依赖

```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

#### 2. 配置数据库

1. 创建MySQL数据库
2. 复制 `.env.example` 为 `.env` 并配置数据库连接信息
3. 执行 `database/init.sql` 初始化数据库表结构

#### 3. 启动服务

```bash
# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

## 开发脚本

项目提供了以下PowerShell脚本来简化开发流程：

- `scripts/dev.ps1` - 启动开发环境（同时启动前后端服务）
- `scripts/init-db.ps1` - 初始化数据库
- `scripts/build.ps1` - 构建生产版本

### 使用脚本的优势

- 自动检查依赖和环境
- 同时管理前后端服务
- 提供详细的状态信息
- 简化数据库初始化流程
- 一键构建部署包

## 功能特性

- ✅ 资源展示和分类浏览
- ✅ 资源搜索和筛选
- ✅ 管理员资源上传
- ✅ 网盘链接下载
- ✅ 下载统计
- ✅ 响应式设计
- 🚧 用户注册登录 (计划中)
- 🚧 资源评论评分 (计划中)

## 部署

详细部署说明请参考 [部署文档](docs/deployment.md)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License