import React from 'react';
import './ToolDetail.css';

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

interface ToolDetailProps {
  tool: Tool | null;
  visible: boolean;
  onClose: () => void;
  onDownload: (tool: Tool) => void;
}

const ToolDetail: React.FC<ToolDetailProps> = ({ tool, visible, onClose, onDownload }) => {
  if (!tool) return null;

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '未知大小';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '未知时间';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    onDownload(tool);
  };

  const handlePreview = () => {
    // 创建预览页面URL，通过后端API获取工具内容
    if (tool.id) {
      const previewUrl = `http://localhost:3001/api/resources/${tool.id}/preview`;
      window.open(previewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>工具详情</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="tool-detail-content">
          {/* 工具头部信息 */}
          <div className="tool-header">
            <div className="tool-icon-large">
              {tool.icon}
            </div>
            <div className="tool-info">
              <h2 className="tool-title">{tool.name}</h2>
              <div className="tool-meta">
                <span className="category-tag">{tool.category}</span>
                <span className="download-count">
                  📥 {tool.download_count || 0} 次下载
                </span>
                <span className="file-type">
                  📄 {tool.file_type || 'HTML'}
                </span>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* 工具描述 */}
          <div className="tool-description">
            <h4>工具描述</h4>
            <p>{tool.description || '暂无描述信息'}</p>
          </div>

          {/* 工具标签 */}
          {tool.tags && tool.tags.length > 0 && (
            <div className="tool-tags-section">
              <h4>标签</h4>
              <div className="tags-container">
                {tool.tags.map((tag: string, index: number) => (
                  <span key={index} className="tag">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="divider"></div>

          {/* 工具详细信息 */}
          <div className="tool-details">
            <h4>详细信息</h4>
            <div className="details-grid">
              <div className="detail-item">
                <span className="label">文件大小:</span>
                <span className="value">{formatFileSize(tool.file_size)}</span>
              </div>
              <div className="detail-item">
                <span className="label">文件类型:</span>
                <span className="value">{tool.file_type || 'HTML'}</span>
              </div>
              <div className="detail-item">
                <span className="label">上传时间:</span>
                <span className="value">{formatDate(tool.created_at)}</span>
              </div>
              <div className="detail-item">
                <span className="label">更新时间:</span>
                <span className="value">{formatDate(tool.updated_at)}</span>
              </div>
              {tool.download_password && (
                <div className="detail-item full-width">
                  <span className="label">提取码:</span>
                  <span className="value code">{tool.download_password}</span>
                </div>
              )}
            </div>
          </div>

          <div className="divider"></div>

          {/* 操作按钮 */}
          <div className="tool-actions">
            <button className="btn btn-primary" onClick={handleDownload}>
              📥 下载工具
            </button>
            <button className="btn btn-secondary" onClick={handlePreview}>
              👁️ 在线预览
            </button>
          </div>

          {/* 使用说明 */}
          <div className="tool-usage">
            <h4>使用说明</h4>
            <div className="usage-content">
              <div className="usage-section">
                <strong>下载步骤：</strong>
                <ol>
                  <li>点击"下载工具"按钮</li>
                  <li>跳转到网盘链接页面</li>
                  <li>{tool.download_password ? `输入提取码：${tool.download_password}` : '直接下载文件'}</li>
                  <li>下载完成后，在浏览器中打开HTML文件即可使用</li>
                </ol>
              </div>
              <div className="usage-section">
                <strong>注意事项：</strong>
                <ul>
                  <li>请确保浏览器支持HTML5和JavaScript</li>
                  <li>某些工具可能需要网络连接才能正常使用</li>
                  <li>如遇到问题，请检查浏览器控制台错误信息</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetail;