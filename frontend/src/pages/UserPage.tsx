import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import type { FC } from 'react';
import ToolDetail from '../components/ToolDetail';
import { resourceService } from '../services/resourceService';
import { categoryService } from '../services/categoryService';
import '../App.css';
import '../components/ToolDetail.css';

interface Tool {
  id: number;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  icon: string;
  url?: string;
  download_url?: string;
  download_count?: number;
  file_type?: string;
  file_size?: number;
  download_password?: string;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  count: number;
}

// 用户页面的工具卡片组件（只有下载功能）
const UserToolCard = memo<{
  tool: Tool;
  onToolClick: (tool: Tool) => void;
  onToolDownload: (tool: Tool) => void;
  getToolIcon: (tool: Tool | string) => string;
}>(({ tool, onToolClick, onToolDownload, getToolIcon }) => {

  return (
    <div className="tool-card">
      <div className="tool-header">
        <div className="tool-icon">{getToolIcon(tool)}</div>
        <div className="tool-info">
          <h3 className="tool-name">{tool.name}</h3>
          <p className="tool-description">{tool.description}</p>
        </div>
      </div>
      
      {tool.tags && tool.tags.length > 0 && (
        <div className="tool-tags">
          {tool.tags.map((tag: string, index: number) => (
            <span key={index} className="tool-tag">{tag.trim()}</span>
          ))}
        </div>
      )}
      
      <div className="tool-actions">
        <button 
          className="card-action card-action-secondary"
          onClick={(e) => {
            e.stopPropagation();
            onToolClick(tool);
          }}
          title="查看详情"
        >
          <span className="action-icon">👁️</span>
          详情
        </button>
        <button 
          className="card-action card-action-primary"
          onClick={(e) => {
            e.stopPropagation();
            onToolDownload(tool);
          }}
          title="下载工具"
        >
          <span className="action-icon">⬇️</span>
          下载
        </button>
      </div>
    </div>
  );
});

UserToolCard.displayName = 'UserToolCard';

const UserPage: FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [toolDetailVisible, setToolDetailVisible] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [visibleToolsCount, setVisibleToolsCount] = useState(12);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 并行加载分类和资源数据
      const [categoriesResponse, resourcesResponse] = await Promise.all([
        categoryService.getCategories(true),
        resourceService.getResources({ limit: 100 })
      ]);
      
      // 处理分类数据
      let formattedCategories: Category[] = [{ id: 0, name: '全部', icon: '📁', count: 0 }];
      if (categoriesResponse.success && categoriesResponse.data) {
        const apiCategories = categoriesResponse.data;
        formattedCategories = [
          { id: 0, name: '全部', icon: '📁', count: resourcesResponse.data?.length || 0 },
          ...apiCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || '📁',
            count: cat.resource_count || 0
          }))
        ];
      }
      setCategories(formattedCategories);
      
      // 处理工具数据
      let formattedTools: Tool[] = [];
      if (resourcesResponse.success && resourcesResponse.data) {
        formattedTools = resourcesResponse.data.map(resource => ({
          id: resource.id!,
          name: resource.title,
          description: resource.description || '',
          category: resource.category_name || '其他',
          tags: Array.isArray(resource.tags) ? resource.tags : (resource.tags ? [resource.tags] : []),
          icon: getToolIcon({ name: resource.title, category: resource.category_name || '', file_type: resource.file_type } as Tool),
          url: resource.download_url,
          download_url: resource.download_url,
          download_count: resource.download_count,
          file_type: resource.file_type,
          file_size: resource.file_size,
          download_password: resource.download_password,
          created_at: resource.created_at,
          updated_at: resource.updated_at
        }));
      }
      setTools(formattedTools);
    } catch (error) {
      console.error('加载数据失败:', error);
      // 设置默认值以防止错误
      setTools([]);
      setCategories([{ id: 0, name: '全部', icon: '📁', count: 0 }]);
    } finally {
      setLoading(false);
    }
  };
  
  // 根据工具名称、分类和文件类型获取图标
  const getToolIcon = (tool: Tool | string): string => {
    if (typeof tool === 'string') {
      return '🔧';
    }
    const name = tool.name?.toLowerCase() || '';
    const category = tool.category?.toLowerCase() || '';
    const fileType = tool.file_type?.toLowerCase() || '';
    
    // 根据工具名称匹配
    if (name.includes('visual studio code') || name.includes('vscode')) return '💻';
    if (name.includes('photoshop') || name.includes('ps')) return '🎨';
    if (name.includes('office') || name.includes('word') || name.includes('excel')) return '📊';
    if (name.includes('chrome') || name.includes('firefox') || name.includes('browser')) return '🌐';
    if (name.includes('git') || name.includes('github')) return '🔧';
    if (name.includes('node') || name.includes('npm')) return '⚡';
    if (name.includes('react') || name.includes('vue') || name.includes('angular')) return '⚛️';
    if (name.includes('python')) return '🐍';
    if (name.includes('java')) return '☕';
    if (name.includes('docker')) return '🐳';
    if (name.includes('mysql') || name.includes('database')) return '🗄️';
    if (name.includes('redis')) return '🔴';
    if (name.includes('nginx')) return '🌐';
    if (name.includes('webpack') || name.includes('vite')) return '📦';
    if (name.includes('typescript')) return '🔷';
    if (name.includes('sass') || name.includes('scss')) return '💄';
    if (name.includes('figma') || name.includes('sketch')) return '🎨';
    if (name.includes('postman')) return '📮';
    if (name.includes('slack') || name.includes('discord')) return '💬';
    if (name.includes('zoom') || name.includes('teams')) return '📹';
    if (name.includes('calculator')) return '🧮';
    if (name.includes('calendar')) return '📅';
    if (name.includes('note') || name.includes('markdown')) return '📝';
    if (name.includes('pdf')) return '📄';
    if (name.includes('zip') || name.includes('rar')) return '📦';
    if (name.includes('video') || name.includes('movie')) return '🎬';
    if (name.includes('audio') || name.includes('music')) return '🎵';
    if (name.includes('image') || name.includes('photo')) return '🖼️';
    if (name.includes('game')) return '🎮';
    if (name.includes('security') || name.includes('antivirus')) return '🛡️';
    if (name.includes('backup')) return '💾';
    if (name.includes('monitor') || name.includes('system')) return '⚙️';
    if (name.includes('network')) return '🌐';
    if (name.includes('terminal') || name.includes('cmd')) return '💻';
    if (name.includes('editor') || name.includes('ide')) return '📝';
    if (name.includes('compiler')) return '⚙️';
    if (name.includes('server')) return '🖥️';
    if (name.includes('api')) return '🔌';
    if (name.includes('test') || name.includes('debug')) return '🐛';
    if (name.includes('deploy')) return '🚀';
    if (name.includes('analytics')) return '📈';
    if (name.includes('chart') || name.includes('graph')) return '📊';
    if (name.includes('mail') || name.includes('email')) return '📧';
    if (name.includes('file') || name.includes('folder')) return '📁';
    if (name.includes('search')) return '🔍';
    if (name.includes('download')) return '⬇️';
    if (name.includes('upload')) return '⬆️';
    if (name.includes('sync')) return '🔄';
    if (name.includes('cloud')) return '☁️';
    if (name.includes('mobile') || name.includes('app')) return '📱';
    if (name.includes('web')) return '🌐';
    if (name.includes('desktop')) return '🖥️';
    
    // 根据分类匹配
    if (category.includes('开发') || category.includes('development')) return '🛠️';
    if (category.includes('设计') || category.includes('design')) return '🎨';
    if (category.includes('办公') || category.includes('office')) return '📊';
    if (category.includes('学习') || category.includes('education')) return '📚';
    if (category.includes('多媒体') || category.includes('media')) return '🎵';
    if (category.includes('系统') || category.includes('system')) return '⚙️';
    if (category.includes('数据') || category.includes('data')) return '📈';
    if (category.includes('文件') || category.includes('file')) return '📁';
    if (category.includes('文本') || category.includes('text')) return '📝';
    if (category.includes('时间') || category.includes('time')) return '⏰';
    if (category.includes('生活') || category.includes('life')) return '🏠';
    if (category.includes('网络') || category.includes('network')) return '🌐';
    if (category.includes('计算') || category.includes('calculator')) return '🧮';
    if (category.includes('创意') || category.includes('creative')) return '🎭';
    if (category.includes('通用') || category.includes('general')) return '🔧';
    
    // 根据文件类型匹配
    if (fileType.includes('html')) return '🌐';
    if (fileType.includes('javascript') || fileType.includes('js')) return '⚡';
    if (fileType.includes('css')) return '🎨';
    if (fileType.includes('python') || fileType.includes('py')) return '🐍';
    if (fileType.includes('java')) return '☕';
    if (fileType.includes('cpp') || fileType.includes('c++')) return '⚙️';
    if (fileType.includes('php')) return '🐘';
    if (fileType.includes('ruby')) return '💎';
    if (fileType.includes('go')) return '🐹';
    if (fileType.includes('rust')) return '🦀';
    if (fileType.includes('swift')) return '🦉';
    if (fileType.includes('kotlin')) return '🎯';
    if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpg')) return '🖼️';
    if (fileType.includes('video') || fileType.includes('mp4') || fileType.includes('avi')) return '🎬';
    if (fileType.includes('audio') || fileType.includes('mp3') || fileType.includes('wav')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('doc') || fileType.includes('docx')) return '📝';
    if (fileType.includes('xls') || fileType.includes('xlsx')) return '📊';
    if (fileType.includes('ppt') || fileType.includes('pptx')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '📦';
    if (fileType.includes('exe') || fileType.includes('msi')) return '⚙️';
    if (fileType.includes('apk')) return '📱';
    if (fileType.includes('dmg')) return '🍎';
    if (fileType.includes('deb') || fileType.includes('rpm')) return '🐧';
    
    // 默认图标
    return '🔧';
  };

  useEffect(() => {
    loadData();
  }, []);

  // 搜索建议
  const updateSearchSuggestions = useCallback((term: string) => {
    if (!term.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions = new Set<string>();
    tools.forEach(tool => {
      if (tool.name.toLowerCase().includes(term.toLowerCase())) {
        suggestions.add(tool.name);
      }
      tool.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(term.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    setSearchSuggestions(Array.from(suggestions).slice(0, 5));
  }, [tools]);

  useEffect(() => {
    updateSearchSuggestions(searchTerm);
  }, [searchTerm, updateSearchSuggestions]);

  const handleSearchFocus = () => {
    setShowSuggestions(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesCategory = selectedCategory === 0 || tool.category === categories.find(c => c.id === selectedCategory)?.name;
      const matchesSearch = !debouncedSearchTerm || 
        tool.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        tool.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [tools, selectedCategory, debouncedSearchTerm, categories]);

  const visibleTools = useMemo(() => {
    return filteredTools.slice(0, visibleToolsCount);
  }, [filteredTools, visibleToolsCount]);

  const loadMoreTools = () => {
    setVisibleToolsCount(prev => prev + 12);
  };

  const handleToolClick = (tool: Tool) => {
    setSelectedTool(tool);
    setToolDetailVisible(true);
  };

  const handleToolDownload = async (tool: Tool) => {
    try {
      if (tool.download_url) {
        window.open(tool.download_url, '_blank');
        await resourceService.incrementDownloadCount(tool.id);
        setTools(prevTools => 
          prevTools.map(t => 
            t.id === tool.id 
              ? { ...t, download_count: (t.download_count || 0) + 1 }
              : t
          )
        );
      }
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            ☰
          </button>
          <h1 className="app-title">杨扬AI资源站</h1>
        </div>
        
        <div className="header-center">
          <div className="search-container">
            <div className="search-wrapper">
              <div className="search-icon-wrapper">
                <i className="fas fa-search search-icon"></i>
              </div>
              <input
                type="text"
                placeholder="搜索工具、标签..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="search-clear"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="search-suggestions">
                {searchSuggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="search-suggestion"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          >
            <span className="theme-icon">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="categories">
            <h3>分类</h3>
            <ul className="category-list">
              {categories.map(category => (
                <li key={category.id}>
                  <button
                    className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                    <span className="category-count">({category.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="main-content">
          {filteredTools.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>未找到相关工具</h3>
              <p>尝试调整搜索条件或选择其他分类</p>
            </div>
          ) : (
            <>
              <div className="tools-header">
                <div className="header-left">
                  <h2>工具列表 ({filteredTools.length})</h2>
                </div>
                <div className="header-right">
                  <div className="card-size-controller">
                    <span className="controller-label">卡片大小</span>
                    <div className="size-buttons">
                      <button 
                        className={`size-btn ${cardSize === 'small' ? 'active' : ''}`}
                        onClick={() => setCardSize('small')}
                        title="小卡片"
                      >
                        ⚪
                      </button>
                      <button 
                        className={`size-btn ${cardSize === 'medium' ? 'active' : ''}`}
                        onClick={() => setCardSize('medium')}
                        title="中等卡片"
                      >
                        ⚫
                      </button>
                      <button 
                        className={`size-btn ${cardSize === 'large' ? 'active' : ''}`}
                        onClick={() => setCardSize('large')}
                        title="大卡片"
                      >
                        ⬛
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`tools-grid card-size-${cardSize}`}>
                {visibleTools.map(tool => (
                  <UserToolCard
                    key={tool.id}
                    tool={tool}
                    onToolClick={handleToolClick}
                    onToolDownload={handleToolDownload}
                    getToolIcon={getToolIcon}
                  />
                ))}
              </div>
              {visibleToolsCount < filteredTools.length && (
                <div className="load-more-container">
                  <button className="load-more-btn" onClick={loadMoreTools}>
                    加载更多 ({filteredTools.length - visibleToolsCount} 个剩余)
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* 用户模式提示信息 */}
          <div className="user-mode-tip">
            <p>🎉 欢迎使用杨扬AI资源站！您可以浏览和下载各种实用工具。</p>
          </div>
        </main>
      </div>
      
      <ToolDetail
        tool={selectedTool}
        visible={toolDetailVisible}
        onClose={() => {
          setToolDetailVisible(false);
          setSelectedTool(null);
        }}
        onDownload={handleToolDownload}
      />
    </div>
  );
};

export default UserPage;