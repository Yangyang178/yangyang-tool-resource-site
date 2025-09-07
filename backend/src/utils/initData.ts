import { query } from '../config/database';

// 初始化数据库表和测试数据
export async function initializeDatabase() {
  try {
    // 创建分类表
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建分类表索引
    await query(`CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order)`);

    // 创建资源表
    await query(`
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        file_type TEXT,
        file_size INTEGER,
        original_filename TEXT,
        file_hash TEXT,
        download_url TEXT NOT NULL,
        download_password TEXT,
        thumbnail_url TEXT,
        download_count INTEGER DEFAULT 0,
        tags TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);
    
    // 创建资源表索引
    await query(`CREATE INDEX IF NOT EXISTS idx_resources_category_id ON resources(category_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_resources_download_count ON resources(download_count)`);

    // 检查是否已有数据
    const categoryCount = await query('SELECT COUNT(*) as count FROM categories') as any[];
    const resourceCount = await query('SELECT COUNT(*) as count FROM resources') as any[];

    // 如果没有分类数据，插入测试数据
    if (categoryCount[0].count === 0) {
      const categories = [
        ['开发工具', '编程开发相关工具和软件', '🛠️', 1],
        ['设计素材', '设计相关的素材和资源', '🎨', 2],
        ['办公软件', '办公和生产力工具', '📊', 3],
        ['学习资料', '教程、文档和学习资源', '📚', 4],
        ['多媒体', '音频、视频处理工具', '🎵', 5],
        ['系统工具', '系统管理、优化相关工具', '⚙️', 6],
        ['数据分析', '数据分析、处理相关工具', '📈', 7],
        ['文件处理', '文件管理、转换相关工具', '📁', 8],
        ['文本处理', '文本编辑、处理相关工具', '📝', 9],
        ['时间日期', '时间管理、日程安排工具', '⏰', 10],
        ['生活工具', '日常生活实用工具', '🏠', 11],
        ['网络工具', '网络测试、管理相关工具', '🌐', 12],
        ['计算工具', '计算器、数学相关工具', '🧮', 13],
        ['设计创意', '设计、创意相关工具', '🎭', 14],
        ['通用工具', '其他通用实用工具', '🔧', 15]
      ];
      
      for (const category of categories) {
        await query(
          'INSERT INTO categories (name, description, icon, sort_order) VALUES (?, ?, ?, ?)',
          category
        );
      }
    }

    // 如果没有资源数据，插入测试数据
    if (resourceCount[0].count === 0) {
      const resources = [
        ['Visual Studio Code', '微软开发的免费代码编辑器，支持多种编程语言', 1, 'exe', 85000000, 'vscode-setup.exe', 'https://code.visualstudio.com/download', null, '["编辑器", "开发工具", "免费"]'],
        ['Photoshop 2024', '专业的图像编辑软件', 2, 'exe', 2500000000, 'photoshop-2024.exe', 'https://example.com/ps2024', 'abc123', '["图像编辑", "设计", "Adobe"]'],
        ['Microsoft Office 365', '微软办公套件', 3, 'exe', 3200000000, 'office365-setup.exe', 'https://example.com/office365', 'def456', '["办公", "文档", "表格"]'],
        ['React 开发教程', 'React 前端开发完整教程', 4, 'pdf', 15000000, 'react-tutorial.pdf', 'https://example.com/react-tutorial', null, '["React", "前端", "教程"]'],
        ['Audacity', '免费的音频编辑软件', 5, 'exe', 45000000, 'audacity-setup.exe', 'https://audacityteam.org/download/', null, '["音频", "编辑", "免费"]']
      ];
      
      for (const resource of resources) {
        await query(
          'INSERT INTO resources (title, description, category_id, file_type, file_size, original_filename, download_url, download_password, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          resource
        );
      }
    }

    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}