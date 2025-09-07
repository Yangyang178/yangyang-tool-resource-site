-- 个人资源站数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS resource_station CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE resource_station;

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '分类名称',
  description TEXT COMMENT '分类描述',
  icon VARCHAR(100) COMMENT '分类图标',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_status (status),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源分类表';

-- 资源表
CREATE TABLE IF NOT EXISTS resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT '资源标题',
  description TEXT COMMENT '资源描述',
  category_id INT COMMENT '分类ID',
  file_type VARCHAR(50) COMMENT '文件类型',
  file_size BIGINT COMMENT '文件大小(字节)',
  download_url VARCHAR(500) NOT NULL COMMENT '网盘下载链接',
  download_password VARCHAR(50) COMMENT '网盘提取码',
  thumbnail_url VARCHAR(500) COMMENT '缩略图URL',
  download_count INT DEFAULT 0 COMMENT '下载次数',
  tags JSON COMMENT '标签数组',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_download_count (download_count),
  FULLTEXT INDEX idx_title_description (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源表';

-- 用户表 (预留)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  role ENUM('admin', 'user') DEFAULT 'user' COMMENT '角色',
  avatar_url VARCHAR(500) COMMENT '头像URL',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 下载记录表 (可选)
CREATE TABLE IF NOT EXISTS download_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resource_id INT NOT NULL COMMENT '资源ID',
  user_id INT NULL COMMENT '用户ID (可为空)',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  user_agent TEXT COMMENT '用户代理',
  download_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '下载时间',
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_resource_id (resource_id),
  INDEX idx_user_id (user_id),
  INDEX idx_download_at (download_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='下载记录表';

-- 插入默认分类数据
INSERT INTO categories (name, description, icon, sort_order) VALUES
('软件工具', '各类实用软件和开发工具', 'tool', 1),
('学习资料', '编程教程、文档和学习资源', 'book', 2),
('模板素材', '网站模板、UI素材等', 'template', 3),
('代码库', '开源代码和项目示例', 'code', 4),
('其他资源', '其他有用的资源文件', 'folder', 5);

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- 插入示例资源数据
INSERT INTO resources (title, description, category_id, file_type, file_size, download_url, download_password, tags) VALUES
('VS Code 编辑器', '微软开发的免费代码编辑器，支持多种编程语言', 1, 'exe', 85000000, 'https://pan.baidu.com/s/example1', 'abc123', '["编辑器", "开发工具", "免费"]'),
('React 入门教程', '从零开始学习React框架的完整教程', 2, 'pdf', 15000000, 'https://pan.baidu.com/s/example2', 'def456', '["React", "前端", "教程"]'),
('Bootstrap 管理后台模板', '基于Bootstrap的响应式管理后台模板', 3, 'zip', 25000000, 'https://pan.baidu.com/s/example3', 'ghi789', '["Bootstrap", "模板", "后台"]');

-- 创建视图：资源详情视图
CREATE VIEW resource_details AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.file_type,
  r.file_size,
  r.download_url,
  r.download_password,
  r.thumbnail_url,
  r.download_count,
  r.tags,
  r.status,
  r.created_at,
  r.updated_at,
  c.name as category_name,
  c.icon as category_icon
FROM resources r
LEFT JOIN categories c ON r.category_id = c.id
WHERE r.status = 'active' AND (c.status = 'active' OR c.status IS NULL);

-- 创建存储过程：增加下载次数
DELIMITER //
CREATE PROCEDURE IncrementDownloadCount(IN resource_id INT)
BEGIN
  UPDATE resources 
  SET download_count = download_count + 1 
  WHERE id = resource_id AND status = 'active';
END //
DELIMITER ;

SELECT '数据库初始化完成！' as message;