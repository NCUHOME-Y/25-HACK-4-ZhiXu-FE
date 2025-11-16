import axios from 'axios';
import { handleApiError } from './error.service';
import { createApiWrapper } from '../lib/helpers/api-helpers';

/**
 * API 客户端配置
 * 包含请求拦截器和响应拦截器
 */
// 后端地址通过 Vite 环境变量 `VITE_API_BASE_URL` 注入，回退到本地开发默认值
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

/**
 * 将 http(s) 地址转换为 ws(s) 地址并拼接路径
 */
export function makeWsUrl(path: string) {
  let origin = API_BASE;
  if (origin.endsWith('/')) origin = origin.slice(0, -1);
  // http -> ws, https -> wss
  origin = origin.replace(/^http/, 'ws');
  return `${origin}${path}`;
}

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30秒超时，适配AI接口的长时间响应
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
