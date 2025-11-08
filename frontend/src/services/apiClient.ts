import axios from 'axios';

// API 基础 URL（可以根据需要修改，或从后端配置 API 获取）
const API_BASE_URL = 'http://localhost:8080/api';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 简化的错误处理
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 服务器返回错误状态码
      const status = error.response.status;
      const message = error.response.data?.message || '';
      
      // 只处理常见的关键错误
      if (status === 401) {
        // 未授权，清除 token 并跳转到登录页
        localStorage.removeItem('authToken');
        window.location.href = '/error?status=401';
      } else if (status === 404) {
        window.location.href = `/error?status=404&message=${encodeURIComponent(message || '请求的资源不存在')}`;
      } else if (status >= 500) {
        window.location.href = `/error?status=500&message=${encodeURIComponent(message || '服务器错误')}`;
      }
    } else if (error.request) {
      // 网络错误
      window.location.href = '/error?status=network';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
