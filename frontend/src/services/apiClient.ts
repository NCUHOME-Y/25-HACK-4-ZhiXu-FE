import axios from 'axios';
import { handleApiError } from './error.service';
import { createApiWrapper } from '../lib/helpers/api-helpers';

/**
 * API 客户端配置
 * 包含请求拦截器和响应拦截器
 */
const apiClient = axios.create({
  baseURL:'http://192.168.12.88:8080',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器 - 添加认证 token
apiClient.interceptors.request.use(
  (config) => {
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

// 响应拦截器 - 使用error.service处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401错误：token无效或过期，立即清除并跳转
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // 如果不在认证页面，清除token并跳转
      if (currentPath !== '/auth' && currentPath !== '/') {
        console.log('[apiClient] 401错误，清除token并跳转到登录页');
        localStorage.removeItem('auth_token');
        window.location.href = '/auth';
        return Promise.reject(error);
      }
    }
    
    handleApiError(error);
    return Promise.reject(error);
  }
);

// 创建 API 包装器以简化 service 层代码
export const api = createApiWrapper(apiClient);

export default apiClient;
