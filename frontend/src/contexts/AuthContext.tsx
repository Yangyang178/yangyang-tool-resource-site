import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中的管理员token
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      // 验证token是否有效
      validateToken(adminToken);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      // 这里可以调用后端API验证token
      // 暂时使用简单的本地验证
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenData.exp > currentTime && tokenData.role === 'admin') {
        setIsAdmin(true);
      } else {
        localStorage.removeItem('admin_token');
        setIsAdmin(false);
      }
    } catch (error) {
      localStorage.removeItem('admin_token');
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      // 这里应该调用后端API验证密码
      // 暂时使用环境变量中的密码
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
      
      if (password === adminPassword) {
        // 创建一个简单的JWT token
        const payload = {
          role: 'admin',
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24小时过期
          iat: Math.floor(Date.now() / 1000)
        };
        
        const token = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' +
                     btoa(JSON.stringify(payload)) + '.' +
                     btoa('signature'); // 简化的签名
        
        localStorage.setItem('admin_token', token);
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setIsAdmin(false);
  };

  const value = {
    isAdmin,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};