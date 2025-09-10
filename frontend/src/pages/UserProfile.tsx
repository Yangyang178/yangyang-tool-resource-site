import React, { useState, useEffect } from 'react';
import '../styles/user-profile.css';

interface DownloadRecord {
  id: string;
  toolName: string;
  downloadTime: string;
  fileSize: string;
  category: string;
}

interface UserInfo {
  username: string;
  email: string;
  joinDate: string;
  totalDownloads: number;
  favoriteCategory: string;
}

const UserProfile: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    username: '用户',
    email: 'user@example.com',
    joinDate: '2024-01-01',
    totalDownloads: 0,
    favoriteCategory: '开发工具'
  });

  const [downloadHistory, setDownloadHistory] = useState<DownloadRecord[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(userInfo);

  useEffect(() => {
    // 从localStorage加载用户信息
    const savedUserInfo = localStorage.getItem('userInfo');
    if (savedUserInfo) {
      const parsed = JSON.parse(savedUserInfo);
      setUserInfo(parsed);
      setEditForm(parsed);
    }

    // 从localStorage加载下载记录
    const savedDownloads = localStorage.getItem('downloadHistory');
    if (savedDownloads) {
      setDownloadHistory(JSON.parse(savedDownloads));
    }

    // 从localStorage加载主题设置
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleSaveUserInfo = () => {
    setUserInfo(editForm);
    localStorage.setItem('userInfo', JSON.stringify(editForm));
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm(userInfo);
    setIsEditing(false);
  };

  const clearDownloadHistory = () => {
    if (window.confirm('确定要清空下载记录吗？')) {
      setDownloadHistory([]);
      localStorage.removeItem('downloadHistory');
    }
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <button className="back-btn" onClick={goBack}>
          <span className="back-icon">←</span>
          返回
        </button>
        <h1 className="profile-title">用户中心</h1>
      </div>

      <div className="profile-content">
        {/* 用户信息卡片 */}
        <div className="profile-card user-info-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="title-icon">👤</span>
              个人信息
            </h2>
            <button 
              className="edit-btn"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '取消' : '编辑'}
            </button>
          </div>
          
          <div className="user-info-content">
            {!isEditing ? (
              <div className="info-display">
                <div className="info-item">
                  <label>用户名：</label>
                  <span>{userInfo.username}</span>
                </div>
                <div className="info-item">
                  <label>邮箱：</label>
                  <span>{userInfo.email}</span>
                </div>
                <div className="info-item">
                  <label>加入时间：</label>
                  <span>{userInfo.joinDate}</span>
                </div>
                <div className="info-item">
                  <label>总下载次数：</label>
                  <span className="highlight">{downloadHistory.length}</span>
                </div>
                <div className="info-item">
                  <label>偏好分类：</label>
                  <span>{userInfo.favoriteCategory}</span>
                </div>
              </div>
            ) : (
              <div className="info-edit">
                <div className="edit-item">
                  <label>用户名：</label>
                  <input 
                    type="text" 
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  />
                </div>
                <div className="edit-item">
                  <label>邮箱：</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                <div className="edit-item">
                  <label>偏好分类：</label>
                  <select 
                    value={editForm.favoriteCategory}
                    onChange={(e) => setEditForm({...editForm, favoriteCategory: e.target.value})}
                  >
                    <option value="开发工具">开发工具</option>
                    <option value="系统工具">系统工具</option>
                    <option value="网络工具">网络工具</option>
                    <option value="多媒体工具">多媒体工具</option>
                    <option value="办公软件">办公软件</option>
                  </select>
                </div>
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSaveUserInfo}>保存</button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>取消</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 下载记录卡片 */}
        <div className="profile-card download-history-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="title-icon">📥</span>
              下载记录
            </h2>
            {downloadHistory.length > 0 && (
              <button className="clear-btn" onClick={clearDownloadHistory}>
                清空记录
              </button>
            )}
          </div>
          
          <div className="download-history-content">
            {downloadHistory.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>暂无下载记录</p>
                <span>开始下载工具后，记录将显示在这里</span>
              </div>
            ) : (
              <div className="download-list">
                {downloadHistory.map((record) => (
                  <div key={record.id} className="download-item">
                    <div className="download-info">
                      <h3 className="tool-name">{record.toolName}</h3>
                      <div className="download-meta">
                        <span className="category">{record.category}</span>
                        <span className="file-size">{record.fileSize}</span>
                        <span className="download-time">{record.downloadTime}</span>
                      </div>
                    </div>
                    <div className="download-status">
                      <span className="status-badge">已完成</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;