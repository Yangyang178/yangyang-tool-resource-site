import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminLoginProps {
  onLoginSuccess?: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

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
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          navigate('/admin');
        }
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
    <div style={{
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
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        minWidth: '300px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>管理员登录</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>请输入管理员密码</p>
        
        {error && (
          <div style={{
            background: '#fee',
            color: '#c33',
            padding: '0.5rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '1rem',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <p style={{ marginTop: '1rem', fontSize: '14px', color: '#999' }}>
          默认密码: admin123
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;