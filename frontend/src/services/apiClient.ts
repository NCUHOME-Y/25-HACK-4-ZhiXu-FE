import axios from 'axios';
import { handleApiError } from './error.service';
import { createApiWrapper } from '../lib/helpers/api-helpers';

/**
 * API 客户端配置
 * 包含请求拦截器和响应拦截器
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器 - 添加认证 token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器 - 使用error.service处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    handleApiError(error);
    return Promise.reject(error);
  }
);

// 创建 API 包装器以简化 service 层代码
export const api = createApiWrapper(apiClient);

export default apiClient;
