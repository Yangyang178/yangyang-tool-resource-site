#!/bin/bash

# 工具资源站部署脚本
# 使用方法: ./deploy.sh [环境]
# 环境: dev, staging, production

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
ENV=${1:-production}
log_info "部署环境: $ENV"

# 检查必要的工具
check_requirements() {
    log_info "检查部署环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 备份数据
backup_data() {
    log_info "备份数据..."
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份数据库
    if [ -f "./backend/database.sqlite" ]; then
        cp ./backend/database.sqlite "$BACKUP_DIR/database.sqlite"
        log_success "数据库备份完成"
    fi
    
    # 备份上传文件
    if [ -d "./backend/uploads" ]; then
        cp -r ./backend/uploads "$BACKUP_DIR/uploads"
        log_success "上传文件备份完成"
    fi
    
    log_success "数据备份完成: $BACKUP_DIR"
}

# 构建应用
build_app() {
    log_info "构建应用..."
    
    # 停止现有服务
    docker-compose down
    
    # 清理旧镜像
    docker system prune -f
    
    # 构建新镜像
    docker-compose build --no-cache
    
    log_success "应用构建完成"
}

# 部署应用
deploy_app() {
    log_info "部署应用..."
    
    # 启动服务
    docker-compose up -d
    
    # 等待服务启动
    sleep 10
    
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
    
    # 检查后端服务
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "后端服务正常"
    else
        log_warning "后端服务检查失败"
    fi
    
    # 检查前端服务
    if curl -f http://localhost > /dev/null 2>&1; then
        log_success "前端服务正常"
    else
        log_warning "前端服务检查失败"
    fi
}

# 清理旧版本
cleanup() {
    log_info "清理旧版本..."
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理旧的备份（保留最近10个）
    if [ -d "./backups" ]; then
        cd ./backups
        ls -t | tail -n +11 | xargs -r rm -rf
        cd ..
    fi
    
    log_success "清理完成"
}

# 主函数
main() {
    log_info "开始部署工具资源站..."
    
    check_requirements
    backup_data
    build_app
    deploy_app
    health_check
    cleanup
    
    log_success "部署完成！"
    log_info "访问地址: http://localhost"
    log_info "API地址: http://localhost/api"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main