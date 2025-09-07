# 项目构建脚本
# PowerShell脚本，用于构建前端和后端项目

Write-Host "=== 个人资源站项目构建脚本 ===" -ForegroundColor Green
Write-Host ""

# 检查Node.js是否安装
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到Node.js，请先安装Node.js" -ForegroundColor Red
    exit 1
}

# 检查npm是否安装
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到npm，请先安装npm" -ForegroundColor Red
    exit 1
}

# 获取项目根目录
$projectRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $projectRoot "frontend"
$backendPath = Join-Path $projectRoot "backend"
$distPath = Join-Path $projectRoot "dist"

Write-Host "项目根目录: $projectRoot" -ForegroundColor Cyan
Write-Host "前端目录: $frontendPath" -ForegroundColor Cyan
Write-Host "后端目录: $backendPath" -ForegroundColor Cyan
Write-Host "构建输出目录: $distPath" -ForegroundColor Cyan
Write-Host ""

# 检查目录是否存在
if (-not (Test-Path $frontendPath)) {
    Write-Host "错误: 前端目录不存在: $frontendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $backendPath)) {
    Write-Host "错误: 后端目录不存在: $backendPath" -ForegroundColor Red
    exit 1
}

# 创建构建输出目录
if (Test-Path $distPath) {
    Write-Host "清理旧的构建文件..." -ForegroundColor Yellow
    Remove-Item $distPath -Recurse -Force
}
New-Item -ItemType Directory -Path $distPath -Force | Out-Null

Write-Host "=== 开始构建项目 ===" -ForegroundColor Green
Write-Host ""

try {
    # 构建前端项目
    Write-Host "构建前端项目..." -ForegroundColor Yellow
    Set-Location $frontendPath
    
    # 安装依赖（如果需要）
    if (-not (Test-Path "node_modules")) {
        Write-Host "安装前端依赖..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "前端依赖安装失败"
        }
    }
    
    # 构建前端
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "前端构建失败"
    }
    
    # 复制前端构建文件
    $frontendDistPath = Join-Path $distPath "frontend"
    Copy-Item "dist" $frontendDistPath -Recurse -Force
    Write-Host "前端构建完成" -ForegroundColor Green
    
    Write-Host ""
    
    # 构建后端项目
    Write-Host "构建后端项目..." -ForegroundColor Yellow
    Set-Location $backendPath
    
    # 安装依赖（如果需要）
    if (-not (Test-Path "node_modules")) {
        Write-Host "安装后端依赖..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "后端依赖安装失败"
        }
    }
    
    # 构建后端
    if (Test-Path "tsconfig.json") {
        # 如果有TypeScript配置，使用tsc构建
        if (Get-Command tsc -ErrorAction SilentlyContinue) {
            tsc
        } else {
            # 使用npx tsc
            npx tsc
        }
        if ($LASTEXITCODE -ne 0) {
            throw "后端TypeScript编译失败"
        }
    }
    
    # 复制后端文件
    $backendDistPath = Join-Path $distPath "backend"
    New-Item -ItemType Directory -Path $backendDistPath -Force | Out-Null
    
    # 复制编译后的JS文件（如果存在）
    if (Test-Path "dist") {
        Copy-Item "dist\*" $backendDistPath -Recurse -Force
    } else {
        # 如果没有dist目录，复制src目录
        Copy-Item "src" $backendDistPath -Recurse -Force
    }
    
    # 复制package.json和其他必要文件
    Copy-Item "package.json" $backendDistPath -Force
    if (Test-Path "package-lock.json") {
        Copy-Item "package-lock.json" $backendDistPath -Force
    }
    
    # 复制uploads目录（如果存在）
    if (Test-Path "uploads") {
        Copy-Item "uploads" $backendDistPath -Recurse -Force
    }
    
    Write-Host "后端构建完成" -ForegroundColor Green
    
    Write-Host ""
    
    # 复制其他必要文件
    Write-Host "复制项目文件..." -ForegroundColor Yellow
    
    # 复制数据库文件
    if (Test-Path (Join-Path $projectRoot "database")) {
        Copy-Item (Join-Path $projectRoot "database") $distPath -Recurse -Force
    }
    
    # 复制README和其他文档
    if (Test-Path (Join-Path $projectRoot "README.md")) {
        Copy-Item (Join-Path $projectRoot "README.md") $distPath -Force
    }
    
    if (Test-Path (Join-Path $projectRoot ".env.example")) {
        Copy-Item (Join-Path $projectRoot ".env.example") $distPath -Force
    }
    
    # 创建部署说明文件
    $deployReadme = @"
# 部署说明

## 前端部署
1. 将 `frontend` 目录中的文件部署到Web服务器（如Nginx、Apache）
2. 配置Web服务器指向 `frontend` 目录
3. 确保API请求正确代理到后端服务

## 后端部署
1. 将 `backend` 目录上传到服务器
2. 在服务器上运行 `npm install --production` 安装生产依赖
3. 配置环境变量（参考 .env.example）
4. 初始化数据库（使用 database/init.sql）
5. 启动服务：`npm start` 或使用PM2等进程管理器

## 数据库部署
1. 创建MySQL数据库
2. 执行 `database/init.sql` 初始化表结构和数据
3. 配置后端的数据库连接信息

## 环境变量配置
复制 `.env.example` 为 `.env` 并配置以下变量：
- DB_HOST: 数据库主机
- DB_PORT: 数据库端口
- DB_USER: 数据库用户名
- DB_PASSWORD: 数据库密码
- DB_NAME: 数据库名称
- JWT_SECRET: JWT密钥
- PORT: 后端服务端口

构建时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@
    
    $deployReadme | Out-File -FilePath (Join-Path $distPath "DEPLOY.md") -Encoding UTF8
    
    Write-Host ""
    Write-Host "=== 构建完成 ===" -ForegroundColor Green
    Write-Host "构建输出目录: $distPath" -ForegroundColor Cyan
    Write-Host "前端文件: $distPath\frontend" -ForegroundColor Cyan
    Write-Host "后端文件: $distPath\backend" -ForegroundColor Cyan
    Write-Host "数据库文件: $distPath\database" -ForegroundColor Cyan
    Write-Host "部署说明: $distPath\DEPLOY.md" -ForegroundColor Cyan
    
    # 显示构建统计
    $frontendSize = (Get-ChildItem (Join-Path $distPath "frontend") -Recurse | Measure-Object -Property Length -Sum).Sum
    $backendSize = (Get-ChildItem (Join-Path $distPath "backend") -Recurse | Measure-Object -Property Length -Sum).Sum
    $totalSize = $frontendSize + $backendSize
    
    Write-Host ""
    Write-Host "构建统计:" -ForegroundColor Yellow
    Write-Host "前端大小: $([math]::Round($frontendSize/1MB, 2)) MB" -ForegroundColor White
    Write-Host "后端大小: $([math]::Round($backendSize/1MB, 2)) MB" -ForegroundColor White
    Write-Host "总大小: $([math]::Round($totalSize/1MB, 2)) MB" -ForegroundColor White
    
} catch {
    Write-Host "构建过程中发生错误:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "项目构建成功！" -ForegroundColor Green