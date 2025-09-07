# 工具资源站部署指南

本文档详细介绍了工具资源站的生产环境部署流程。

## 目录

- [系统要求](#系统要求)
- [部署准备](#部署准备)
- [服务器配置](#服务器配置)
- [域名和SSL配置](#域名和ssl配置)
- [应用部署](#应用部署)
- [监控配置](#监控配置)
- [维护和更新](#维护和更新)
- [故障排除](#故障排除)

## 系统要求

### 硬件要求
- CPU: 2核心以上
- 内存: 4GB以上
- 存储: 50GB以上SSD
- 网络: 100Mbps以上带宽

### 软件要求
- 操作系统: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Docker: 20.10+
- Docker Compose: 2.0+
- Git: 2.0+

## 部署准备

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y curl wget git vim htop

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 防火墙配置

```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. 克隆项目

```bash
git clone <your-repository-url>
cd 工具资源站
```

## 服务器配置

### 1. 环境变量配置

复制并编辑生产环境配置：

```bash
cp .env.production .env
vim .env
```

修改以下关键配置：
- `DOMAIN`: 你的域名
- `JWT_SECRET`: 生成强密码
- `CORS_ORIGIN`: 你的域名

### 2. 数据库初始化

```bash
# 创建数据目录
mkdir -p ./backend/data

# 如果有现有数据库，复制到data目录
# cp /path/to/existing/database.sqlite ./backend/data/
```

## 域名和SSL配置

### 1. 域名解析

在你的域名提供商处添加以下DNS记录：

```
A    @           your-server-ip
A    www         your-server-ip
```

### 2. SSL证书获取

使用提供的脚本自动获取Let's Encrypt证书：

```bash
# 给脚本执行权限
chmod +x ./scripts/setup-ssl.sh

# 运行SSL设置脚本
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com
```

### 3. 手动SSL配置（可选）

如果自动脚本失败，可以手动配置：

```bash
# 安装certbot
sudo apt install certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*
```

## 应用部署

### 1. 使用部署脚本

```bash
# 给脚本执行权限
chmod +x ./scripts/deploy.sh

# 运行部署脚本
./scripts/deploy.sh production
```

### 2. 手动部署

如果部署脚本失败，可以手动执行：

```bash
# 构建并启动服务
docker-compose build
docker-compose up -d

# 检查服务状态
docker-compose ps
docker-compose logs
```

### 3. 验证部署

```bash
# 检查服务健康状态
curl http://localhost/health
curl http://localhost/api/health

# 检查HTTPS
curl https://your-domain.com/health
```

## 监控配置

### 1. 启动监控服务

```bash
# 启动监控栈
docker-compose -f docker-compose.monitoring.yml up -d

# 检查监控服务
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. 访问监控面板

- Grafana: http://your-server-ip:3001 (admin/admin123)
- Prometheus: http://your-server-ip:9090
- AlertManager: http://your-server-ip:9093

### 3. 配置告警

编辑 `monitoring/alertmanager.yml` 配置邮件告警：

```yaml
global:
  smtp_smarthost: 'your-smtp-server:587'
  smtp_from: 'alerts@your-domain.com'
  smtp_auth_username: 'your-email@your-domain.com'
  smtp_auth_password: 'your-email-password'
```

## 维护和更新

### 1. 数据备份

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份数据库
docker-compose exec backend cp /app/data/database.sqlite /tmp/
docker cp $(docker-compose ps -q backend):/tmp/database.sqlite "$BACKUP_DIR/"

# 备份上传文件
docker cp $(docker-compose ps -q backend):/app/uploads "$BACKUP_DIR/"

echo "备份完成: $BACKUP_DIR"
EOF

chmod +x backup.sh
```

### 2. 应用更新

```bash
# 拉取最新代码
git pull origin main

# 重新部署
./scripts/deploy.sh production
```

### 3. SSL证书续期

```bash
# 手动续期
./scripts/renew-ssl.sh

# 设置自动续期（添加到crontab）
crontab -e
# 添加以下行：
# 0 12 * * * /path/to/your/project/scripts/renew-ssl.sh
```

## 故障排除

### 1. 常见问题

#### 服务无法启动
```bash
# 查看日志
docker-compose logs

# 检查端口占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

#### SSL证书问题
```bash
# 检查证书有效性
openssl x509 -in ./ssl/fullchain.pem -text -noout

# 测试SSL连接
openssl s_client -connect your-domain.com:443
```

#### 数据库连接问题
```bash
# 检查数据库文件权限
ls -la ./backend/data/

# 进入容器检查
docker-compose exec backend sh
```

### 2. 性能优化

#### 数据库优化
```sql
-- 在SQLite中执行
PRAGMA optimize;
VACUUM;
ANALYZE;
```

#### Nginx优化
```bash
# 调整worker进程数
# 编辑 nginx/nginx.conf
worker_processes auto;
worker_connections 2048;
```

### 3. 日志管理

```bash
# 查看应用日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 清理旧日志
docker system prune -f
```

## 安全建议

1. **定期更新系统和Docker**
2. **使用强密码和JWT密钥**
3. **启用防火墙和fail2ban**
4. **定期备份数据**
5. **监控系统资源和日志**
6. **使用HTTPS和安全头**

## 联系支持

如果遇到部署问题，请：
1. 检查日志文件
2. 查看本文档的故障排除部分
3. 提交Issue到项目仓库

---

**注意**: 请根据实际情况修改配置文件中的域名、邮箱等信息。