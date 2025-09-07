import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AdminLogin.css';

interface AdminLoginProps {
  onLoginSuccess?: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入管理员密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(password);
      if (success) {
        setPassword('');
        onLoginSuccess?.();
      } else {
        setError('密码错误，请重试');
      }
    } catch (error) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div className="admin-login-modal" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="admin-login-header">
          <h2>管理员登录</h2>
          <p>请输入管理员密码以访问管理功能</p>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="password">管理员密码</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              disabled={loading}
              autoFocus
            />
          </div>
          
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}
          
          <div className="form-actions">
            <button
              type="submit"
              className="login-btn"
              disabled={loading || !password.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </div>
        </form>
        
        <div className="admin-login-footer">
          <p className="security-note">
            🔒 此页面仅供管理员使用，请妥善保管密码
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;