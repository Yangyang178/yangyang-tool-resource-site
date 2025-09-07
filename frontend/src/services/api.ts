import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页响应类型
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 错误响应类型
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
}

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    // 统一错误处理
    const errorResponse: ErrorResponse = {
      success: false,
      error: error.message || '请求失败',
      message: (error.response?.data as any)?.message || error.message,
      details: error.response?.data,
    };

    // 根据状态码处理不同错误
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并跳转登录
          localStorage.removeItem('auth_token');
          errorResponse.error = '未授权访问';
          break;
        case 403:
          errorResponse.error = '权限不足';
          break;
        case 404:
          errorResponse.error = '资源不存在';
          break;
        case 500:
          errorResponse.error = '服务器内部错误';
          break;
        default:
          errorResponse.error = `请求失败 (${error.response.status})`;
      }
    } else if (error.request) {
      errorResponse.error = '网络连接失败';
    }

    return Promise.reject(errorResponse);
  }
);

// 导出API实例和类型
export default api;
export { api };