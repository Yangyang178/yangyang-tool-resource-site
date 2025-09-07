# 数据库初始化脚本
# PowerShell脚本，用于初始化MySQL数据库

Write-Host "=== 个人资源站数据库初始化脚本 ===" -ForegroundColor Green
Write-Host ""

# 检查MySQL是否安装
if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到MySQL客户端，请先安装MySQL" -ForegroundColor Red
    Write-Host "下载地址: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Cyan
    exit 1
}

# 获取项目根目录
$projectRoot = Split-Path -Parent $PSScriptRoot
$sqlFile = Join-Path $projectRoot "database\init.sql"

Write-Host "项目根目录: $projectRoot" -ForegroundColor Cyan
Write-Host "SQL文件路径: $sqlFile" -ForegroundColor Cyan
Write-Host ""

# 检查SQL文件是否存在
if (-not (Test-Path $sqlFile)) {
    Write-Host "错误: 数据库初始化文件不存在: $sqlFile" -ForegroundColor Red
    exit 1
}

# 获取数据库连接信息
Write-Host "请输入数据库连接信息:" -ForegroundColor Yellow
$dbHost = Read-Host "数据库主机 (默认: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) {
    $dbHost = "localhost"
}

$dbPort = Read-Host "数据库端口 (默认: 3306)"
if ([string]::IsNullOrWhiteSpace($dbPort)) {
    $dbPort = "3306"
}

$dbUser = Read-Host "数据库用户名 (默认: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) {
    $dbUser = "root"
}

$dbPassword = Read-Host "数据库密码" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

$dbName = Read-Host "数据库名称 (默认: resource_station)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "resource_station"
}

Write-Host ""
Write-Host "连接信息:" -ForegroundColor Cyan
Write-Host "主机: $dbHost" -ForegroundColor White
Write-Host "端口: $dbPort" -ForegroundColor White
Write-Host "用户: $dbUser" -ForegroundColor White
Write-Host "数据库: $dbName" -ForegroundColor White
Write-Host ""

# 确认执行
$confirm = Read-Host "是否继续初始化数据库? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "操作已取消" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== 开始初始化数据库 ===" -ForegroundColor Green

try {
    # 测试数据库连接
    Write-Host "测试数据库连接..." -ForegroundColor Yellow
    $testQuery = "SELECT 1;"
    $testResult = mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPasswordPlain -e $testQuery 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "数据库连接失败:" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Red
        exit 1
    }
    
    Write-Host "数据库连接成功" -ForegroundColor Green
    
    # 创建数据库（如果不存在）
    Write-Host "创建数据库 '$dbName'..." -ForegroundColor Yellow
    $createDbQuery = "CREATE DATABASE IF NOT EXISTS ``$dbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPasswordPlain -e $createDbQuery
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "创建数据库失败" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "数据库创建成功" -ForegroundColor Green
    
    # 执行初始化SQL
    Write-Host "执行数据库初始化脚本..." -ForegroundColor Yellow
    mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPasswordPlain $dbName < $sqlFile
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "数据库初始化失败" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "数据库初始化完成" -ForegroundColor Green
    
    # 验证初始化结果
    Write-Host "验证数据库表..." -ForegroundColor Yellow
    $tablesQuery = "SHOW TABLES;"
    $tablesResult = mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPasswordPlain $dbName -e $tablesQuery
    
    Write-Host ""
    Write-Host "=== 数据库表列表 ===" -ForegroundColor Cyan
    Write-Host $tablesResult -ForegroundColor White
    
    Write-Host ""
    Write-Host "=== 数据库初始化成功 ===" -ForegroundColor Green
    Write-Host "数据库名称: $dbName" -ForegroundColor Cyan
    Write-Host "连接地址: $dbHost`:$dbPort" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "请更新项目的 .env 文件中的数据库配置:" -ForegroundColor Yellow
    Write-Host "DB_HOST=$dbHost" -ForegroundColor White
    Write-Host "DB_PORT=$dbPort" -ForegroundColor White
    Write-Host "DB_USER=$dbUser" -ForegroundColor White
    Write-Host "DB_PASSWORD=你的密码" -ForegroundColor White
    Write-Host "DB_NAME=$dbName" -ForegroundColor White
    
} catch {
    Write-Host "初始化过程中发生错误:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "数据库初始化完成！" -ForegroundColor Green