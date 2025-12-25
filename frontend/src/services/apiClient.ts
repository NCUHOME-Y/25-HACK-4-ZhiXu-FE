import axios from 'axios';
import { handleApiError } from './error.service';
import { createApiWrapper } from '../lib/helpers';

/** API 客户端配置 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL || undefined;

/** 将 http(s) 地址转换为 ws(s) 地址并拼接路径 */
export function makeWsUrl(path: string) {
  let origin = API_BASE;
  
  if (!origin || origin === '' || !origin.startsWith('http')) {
    if (typeof window !== 'undefined') {
      origin = window.location.origin;
    } else {
      origin = 'http://localhost:8080';
    }
  }
  
  if (origin.endsWith('/')) origin = origin.slice(0, -1);
  
  const wsOrigin = origin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  
  const p = path.startsWith('/') ? path : `/${path}`;
  
  return `${wsOrigin}${p}`;
}

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60秒超时，适配Railway数据库延迟高的情况
  headers: { 'Content-Type': 'application/json' },
});

/** 请求拦截器 - 添加认证 token */
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

/** 响应拦截器 - 处理错误 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    /** 401错误 - token无效或过期 */
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/auth' || currentPath === '/' || currentPath === '/start';
      
      // 如果不在认证页面,清除token并跳转
      if (!isAuthPage) {
        localStorage.removeItem('auth_token');
        // 使用 replace 避免历史记录堆积
        if (typeof window !== 'undefined') {
          window.location.replace('/auth');
        }
        return Promise.reject(error);
      }
    }
    
    handleApiError(error);
    return Promise.reject(error);
  }
);

/** 创建 API 包装器以简化 service 层代码 */
export const api = createApiWrapper(apiClient);

export default apiClient;
