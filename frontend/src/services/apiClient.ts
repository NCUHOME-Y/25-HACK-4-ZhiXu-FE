import axios from 'axios';
import { handleApiError } from './error.service';
import { createApiWrapper } from '../lib/helpers/api-helpers';

/**
 * API 客户端配置
 * 包含请求拦截器和响应拦截器
 */
// 后端地址通过 Vite 环境变量 `VITE_API_BASE_URL` 注入
// 开发环境：undefined 使用相对路径，通过 Vite 代理转发
// 生产环境：使用 .env.production 中的完整 URL  
export const API_BASE = import.meta.env.VITE_API_BASE_URL || undefined;

/**
 * 将 http(s) 地址转换为 ws(s) 地址并拼接路径
 */
export function makeWsUrl(path: string) {
  let origin = API_BASE;
  
  // 如果 API_BASE 是空字符串或相对路径，使用当前页面的 origin
  if (!origin || origin === '' || !origin.startsWith('http')) {
    if (typeof window !== 'undefined') {
      origin = window.location.origin;
      console.log('📍 使用当前页面origin作为WebSocket地址:', origin);
    } else {
      origin = 'http://localhost:8080';
    }
  }
  
  // 移除末尾的斜杠
  if (origin.endsWith('/')) origin = origin.slice(0, -1);
  
  // 将 http(s) 协议转换为 ws(s)
  const wsOrigin = origin.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  
  // 确保 path 以 '/' 开头
  const p = path.startsWith('/') ? path : `/${path}`;
  
  const finalUrl = `${wsOrigin}${p}`;
  console.log('🔗 WebSocket URL构建完成:', {
    原始API_BASE: API_BASE,
    使用的origin: origin,
    WebSocket协议: wsOrigin,
    完整URL: finalUrl
  });
  
  return finalUrl;
}

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30秒超时，适配AI接口等需要较长响应时间的接口
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
    // 401错误:token无效或过期,立即清除并跳转
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/auth' || currentPath === '/' || currentPath === '/start';
      
      // 如果不在认证页面,清除token并跳转
      if (!isAuthPage) {
        console.log('[apiClient] 401错误,清除token并跳转到登录页');
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

// 创建 API 包装器以简化 service 层代码
export const api = createApiWrapper(apiClient);

export default apiClient;
