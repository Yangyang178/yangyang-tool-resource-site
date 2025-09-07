#!/bin/bash

# 生产环境一键部署脚本
# 使用方法: ./production-deploy.sh <domain> <email>

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查参数
if [ $# -lt 1 ]; then
    log_error "请提供域名参数"
    echo "使用方法: $0 <domain> [email]"
    echo "示例: $0 example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}
PROJECT_DIR=$(pwd)

log_info "开始生产环境部署"
log_info "域名: $DOMAIN"
log_info "邮箱: $EMAIL"
log_info "项目目录: $PROJECT_DIR"

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查操作系统
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        log_error "此脚本仅支持Linux系统"
        exit 1
    fi
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，正在安装..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        log_success "Docker安装完成"
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，正在安装..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose安装完成"
    fi
    
    # 检查端口占用
    if sudo netstat -tlnp | grep -q ":80 "; then
        log_warning "端口80已被占用，请检查是否有其他Web服务运行"
    fi
    
    if sudo netstat -tlnp | grep -q ":443 "; then
        log_warning "端口443已被占用，请检查是否有其他HTTPS服务运行"
    fi
    
    log_success "系统要求检查完成"
}

# 配置防火墙
setup_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        sudo ufw --force enable
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        log_success "UFW防火墙配置完成"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        log_success "Firewalld防火墙配置完成"
    else
        log_warning "未检测到防火墙，请手动配置"
    fi
}

# 创建项目目录结构
setup_directories() {
    log_info "创建项目目录结构..."
    
    mkdir -p {
        ssl,
        certbot/{www,conf},
        backups,
        logs,
        backend/data,
        backend/uploads
    }
    
    # 设置权限
    chmod 755 ssl certbot backend/data backend/uploads
    chmod 644 ssl/* 2>/dev/null || true
    
    log_success "目录结构创建完成"
}

# 配置环境变量
setup_environment() {
    log_info "配置环境变量..."
    
    # 生成JWT密钥
    JWT_SECRET=$(openssl rand -base64 32)
    
    # 更新.env文件
    cp .env.production .env
    sed -i "s/your-domain.com/$DOMAIN/g" .env
    sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" .env
    sed -i "s/https:\/\/your-domain.com/https:\/\/$DOMAIN/g" .env
    
    log_success "环境变量配置完成"
}

# 更新Nginx配置
update_nginx_config() {
    log_info "更新Nginx配置..."
    
    # 更新域名
    sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/default.conf
    
    log_success "Nginx配置更新完成"
}

# 验证域名解析
verify_dns() {
    log_info "验证域名解析..."
    
    # 获取服务器IP
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)
    
    # 检查域名解析
    DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
    WWW_IP=$(dig +short www.$DOMAIN | tail -n1)
    
    if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        log_error "域名 $DOMAIN 解析IP ($DOMAIN_IP) 与服务器IP ($SERVER_IP) 不匹配"
        log_error "请检查DNS配置，确保A记录指向正确的服务器IP"
        exit 1
    fi
    
    if [ "$WWW_IP" != "$SERVER_IP" ]; then
        log_warning "www.$DOMAIN 解析可能有问题"
    fi
    
    log_success "域名解析验证通过"
}

# 获取SSL证书
setup_ssl() {
    log_info "配置SSL证书..."
    
    # 停止可能占用80端口的服务
    docker-compose down 2>/dev/null || true
    
    # 创建临时Nginx配置
    cat > nginx/conf.d/temp.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'SSL setup in progress...';
        add_header Content-Type text/plain;
    }
}
EOF
    
    # 启动临时Nginx
    cat > docker-compose.temp.yml << EOF
version: '3.8'
services:
  nginx-temp:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/www:/var/www/certbot:ro
EOF
    
    docker-compose -f docker-compose.temp.yml up -d
    sleep 5
    
    # 获取证书
    docker run --rm \
        -v "$PROJECT_DIR/certbot/conf:/etc/letsencrypt" \
        -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
        certbot/certbot \
        certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"
    
    if [ $? -eq 0 ]; then
        # 复制证书
        cp "certbot/conf/live/$DOMAIN/fullchain.pem" ssl/
        cp "certbot/conf/live/$DOMAIN/privkey.pem" ssl/
        chmod 644 ssl/fullchain.pem
        chmod 600 ssl/privkey.pem
        
        log_success "SSL证书获取成功"
    else
        log_error "SSL证书获取失败"
        docker-compose -f docker-compose.temp.yml down
        rm -f docker-compose.temp.yml nginx/conf.d/temp.conf
        exit 1
    fi
    
    # 清理临时配置
    docker-compose -f docker-compose.temp.yml down
    rm -f docker-compose.temp.yml nginx/conf.d/temp.conf
}

# 部署应用
deploy_application() {
    log_info "部署应用..."
    
    # 构建并启动服务
    docker-compose build --no-cache
    docker-compose up -d
    
    # 等待服务启动
    sleep 30
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_success "应用部署成功"
    else
        log_error "应用部署失败"
        docker-compose logs
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务完全启动
    sleep 10
    
    # 检查HTTP
    if curl -f -s http://localhost/health > /dev/null; then
        log_success "HTTP服务正常"
    else
        log_warning "HTTP服务检查失败"
    fi
    
    # 检查HTTPS
    if curl -f -s https://$DOMAIN/health > /dev/null; then
        log_success "HTTPS服务正常"
    else
        log_warning "HTTPS服务检查失败"
    fi
    
    # 检查API
    if curl -f -s https://$DOMAIN/api/health > /dev/null; then
        log_success "API服务正常"
    else
        log_warning "API服务检查失败"
    fi
}

# 设置自动续期
setup_auto_renewal() {
    log_info "设置SSL证书自动续期..."
    
    # 创建续期脚本
    cat > scripts/renew-ssl.sh << 'EOF'
#!/bin/bash
docker run --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot renew --quiet

if [ $? -eq 0 ]; then
    # 复制新证书
    cp "certbot/conf/live/*/fullchain.pem" ssl/ 2>/dev/null || true
    cp "certbot/conf/live/*/privkey.pem" ssl/ 2>/dev/null || true
    
    # 重新加载Nginx
    docker-compose exec nginx nginx -s reload
    
    echo "$(date): SSL证书续期成功" >> logs/ssl-renewal.log
else
    echo "$(date): SSL证书续期失败" >> logs/ssl-renewal.log
fi
EOF
    
    chmod +x scripts/renew-ssl.sh
    
    # 添加到crontab
    (crontab -l 2>/dev/null; echo "0 12 * * * $PROJECT_DIR/scripts/renew-ssl.sh") | crontab -
    
    log_success "自动续期设置完成"
}

# 创建备份脚本
setup_backup() {
    log_info "设置数据备份..."
    
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 备份数据库
if docker-compose ps | grep -q backend; then
    docker-compose exec -T backend cp /app/data/database.sqlite /tmp/backup.sqlite
    docker cp $(docker-compose ps -q backend):/tmp/backup.sqlite "$BACKUP_DIR/database.sqlite"
fi

# 备份上传文件
if [ -d "backend/uploads" ]; then
    cp -r backend/uploads "$BACKUP_DIR/"
fi

# 备份配置文件
cp .env "$BACKUP_DIR/"
cp -r nginx "$BACKUP_DIR/"

# 压缩备份
tar -czf "$BACKUP_DIR.tar.gz" -C backups "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

echo "$(date): 备份完成 - $BACKUP_DIR.tar.gz" >> logs/backup.log

# 清理旧备份（保留最近7天）
find backups -name "*.tar.gz" -mtime +7 -delete
EOF
    
    chmod +x scripts/backup.sh
    
    # 添加到crontab（每天凌晨2点备份）
    (crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_DIR/scripts/backup.sh") | crontab -
    
    log_success "备份脚本设置完成"
}

# 显示部署信息
show_deployment_info() {
    log_success "=== 部署完成 ==="
    echo
    log_info "网站访问地址:"
    echo "  HTTP:  http://$DOMAIN"
    echo "  HTTPS: https://$DOMAIN"
    echo "  API:   https://$DOMAIN/api"
    echo
    log_info "管理地址:"
    echo "  服务状态: docker-compose ps"
    echo "  查看日志: docker-compose logs -f"
    echo "  重启服务: docker-compose restart"
    echo
    log_info "证书管理:"
    echo "  手动续期: ./scripts/renew-ssl.sh"
    echo "  自动续期: 已设置每日12点检查"
    echo
    log_info "数据备份:"
    echo "  手动备份: ./scripts/backup.sh"
    echo "  自动备份: 已设置每日2点备份"
    echo
    log_warning "重要提醒:"
    echo "  1. 请妥善保管 .env 文件中的密钥"
    echo "  2. 定期检查服务运行状态"
    echo "  3. 监控磁盘空间和系统资源"
    echo "  4. 及时更新系统和Docker镜像"
    echo
}

# 主函数
main() {
    log_info "开始生产环境部署流程..."
    
    check_requirements
    setup_firewall
    setup_directories
    setup_environment
    update_nginx_config
    verify_dns
    setup_ssl
    deploy_application
    health_check
    setup_auto_renewal
    setup_backup
    show_deployment_info
    
    log_success "生产环境部署完成！"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main