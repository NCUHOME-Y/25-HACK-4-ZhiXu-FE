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

// 响应拦截器 - 统一错误处理
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 服务器返回错误状态码
      const status = error.response.status;
      const message = error.response.data?.message || '';
      
      switch (status) {
        case 401:
          // 未授权，清除 token 并跳转到错误页
          localStorage.removeItem('authToken');
          window.location.href = '/error?status=401';
          break;
        case 403:
          window.location.href = `/error?status=403&message=${encodeURIComponent(message || '没有权限访问此资源')}`;
          break;
        case 404:
          window.location.href = `/error?status=404&message=${encodeURIComponent(message || '请求的资源不存在')}`;
          break;
        case 500:
          window.location.href = `/error?status=500&message=${encodeURIComponent(message || '服务器内部错误')}`;
          break;
        case 503:
          window.location.href = `/error?status=503&message=${encodeURIComponent(message || '服务暂时不可用')}`;
          break;
        default:
          console.error('请求失败:', error.response.data);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应 - 网络错误
      window.location.href = '/error?status=network&message=' + encodeURIComponent('网络错误，请检查网络连接');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
