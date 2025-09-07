# 开发环境启动脚本
# PowerShell脚本，用于同时启动前端和后端服务

Write-Host "=== 个人资源站开发环境启动脚本 ===" -ForegroundColor Green
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

Write-Host "项目根目录: $projectRoot" -ForegroundColor Cyan
Write-Host "前端目录: $frontendPath" -ForegroundColor Cyan
Write-Host "后端目录: $backendPath" -ForegroundColor Cyan
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

# 检查依赖是否已安装
$frontendNodeModules = Join-Path $frontendPath "node_modules"
$backendNodeModules = Join-Path $backendPath "node_modules"

if (-not (Test-Path $frontendNodeModules)) {
    Write-Host "前端依赖未安装，正在安装..." -ForegroundColor Yellow
    Set-Location $frontendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "前端依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path $backendNodeModules)) {
    Write-Host "后端依赖未安装，正在安装..." -ForegroundColor Yellow
    Set-Location $backendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "后端依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host "=== 启动开发服务器 ===" -ForegroundColor Green
Write-Host ""

# 启动后端服务器（后台运行）
Write-Host "启动后端服务器..." -ForegroundColor Yellow
Set-Location $backendPath
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $backendPath

# 等待后端启动
Start-Sleep -Seconds 3

# 启动前端服务器（后台运行）
Write-Host "启动前端服务器..." -ForegroundColor Yellow
Set-Location $frontendPath
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $frontendPath

# 等待前端启动
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=== 开发服务器已启动 ===" -ForegroundColor Green
Write-Host "前端地址: http://localhost:5173" -ForegroundColor Cyan
Write-Host "后端地址: http://localhost:3001" -ForegroundColor Cyan
Write-Host "API文档: http://localhost:3001/api/v1" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止所有服务器" -ForegroundColor Yellow
Write-Host ""

# 等待用户中断
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # 检查作业状态
        if ($backendJob.State -eq "Failed" -or $backendJob.State -eq "Stopped") {
            Write-Host "后端服务器已停止" -ForegroundColor Red
            break
        }
        
        if ($frontendJob.State -eq "Failed" -or $frontendJob.State -eq "Stopped") {
            Write-Host "前端服务器已停止" -ForegroundColor Red
            break
        }
    }
}
finally {
    Write-Host ""
    Write-Host "正在停止服务器..." -ForegroundColor Yellow
    
    # 停止作业
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    
    # 移除作业
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    
    Write-Host "所有服务器已停止" -ForegroundColor Green
}