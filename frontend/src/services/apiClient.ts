import axios from 'axios';

//API 客户端配置,包含请求拦截器和响应拦截器
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

// 响应拦截器 - 处理各种错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 网络错误
    if (!error.response) {
      window.location.href = '/error?status=network&message=网络连接失败';
      return Promise.reject(error);
    }

    const status = error.response.status;

    // 根据状态码跳转到对应错误页面
    if (status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/error?status=401';
    } else if (status === 404) {
      window.location.href = '/error?status=404';
    } else if (status >= 500) {
      window.location.href = '/error?status=500';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
