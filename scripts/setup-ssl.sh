#!/bin/bash

# SSL证书设置脚本
# 使用 Let's Encrypt 获取免费SSL证书

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
if [ $# -eq 0 ]; then
    log_error "请提供域名参数"
    echo "使用方法: $0 <domain> [email]"
    echo "示例: $0 example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}

log_info "域名: $DOMAIN"
log_info "邮箱: $EMAIL"

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 创建证书目录
setup_directories() {
    log_info "创建证书目录..."
    
    mkdir -p ./ssl
    mkdir -p ./certbot/www
    mkdir -p ./certbot/conf
    
    log_success "目录创建完成"
}

# 创建临时Nginx配置
create_temp_nginx() {
    log_info "创建临时Nginx配置..."
    
    cat > ./nginx/conf.d/temp.conf << EOF
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
    
    log_success "临时配置创建完成"
}

# 启动临时Nginx
start_temp_nginx() {
    log_info "启动临时Nginx服务..."
    
    # 创建临时docker-compose文件
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
    
    log_success "临时Nginx启动完成"
}

# 获取SSL证书
obtain_certificate() {
    log_info "获取SSL证书..."
    
    docker run --rm \
        -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
        -v "$(pwd)/certbot/www:/var/www/certbot" \
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
        log_success "SSL证书获取成功"
    else
        log_error "SSL证书获取失败"
        cleanup_temp
        exit 1
    fi
}

# 复制证书到ssl目录
copy_certificates() {
    log_info "复制证书文件..."
    
    cp "./certbot/conf/live/$DOMAIN/fullchain.pem" ./ssl/
    cp "./certbot/conf/live/$DOMAIN/privkey.pem" ./ssl/
    
    # 设置正确的权限
    chmod 644 ./ssl/fullchain.pem
    chmod 600 ./ssl/privkey.pem
    
    log_success "证书复制完成"
}

# 更新Nginx配置
update_nginx_config() {
    log_info "更新Nginx配置..."
    
    # 更新域名配置
    sed -i "s/your-domain.com/$DOMAIN/g" ./nginx/conf.d/default.conf
    
    # 删除临时配置
    rm -f ./nginx/conf.d/temp.conf
    
    log_success "Nginx配置更新完成"
}

# 清理临时服务
cleanup_temp() {
    log_info "清理临时服务..."
    
    docker-compose -f docker-compose.temp.yml down 2>/dev/null || true
    rm -f docker-compose.temp.yml
    rm -f ./nginx/conf.d/temp.conf
    
    log_success "临时服务清理完成"
}

# 设置证书自动续期
setup_auto_renewal() {
    log_info "设置证书自动续期..."
    
    # 创建续期脚本
    cat > ./scripts/renew-ssl.sh << 'EOF'
#!/bin/bash
docker run --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot renew

# 重新加载Nginx
docker-compose exec nginx nginx -s reload
EOF
    
    chmod +x ./scripts/renew-ssl.sh
    
    log_success "自动续期设置完成"
    log_info "请添加以下cron任务来自动续期证书:"
    echo "0 12 * * * $(pwd)/scripts/renew-ssl.sh"
}

# 验证证书
verify_certificate() {
    log_info "验证SSL证书..."
    
    if openssl x509 -in ./ssl/fullchain.pem -text -noout | grep -q "$DOMAIN"; then
        log_success "SSL证书验证成功"
    else
        log_error "SSL证书验证失败"
        exit 1
    fi
}

# 主函数
main() {
    log_info "开始设置SSL证书..."
    
    check_dependencies
    setup_directories
    create_temp_nginx
    start_temp_nginx
    obtain_certificate
    copy_certificates
    update_nginx_config
    cleanup_temp
    setup_auto_renewal
    verify_certificate
    
    log_success "SSL证书设置完成！"
    log_info "现在可以使用HTTPS访问您的网站: https://$DOMAIN"
}

# 错误处理
trap 'log_error "SSL设置过程中发生错误"; cleanup_temp; exit 1' ERR

# 执行主函数
main