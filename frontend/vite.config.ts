import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 使用 .env 文件中的 VITE_API_BASE_URL
  const env = loadEnv(mode, process.cwd(), '');
  // 开发环境默认使用腾讯云服务器
  const apiBase = env.VITE_API_BASE_URL || 'http://139.199.157.76:8080';
  const wsBase = apiBase.replace(/^http/, 'ws');

  return {
    plugins: [react()],
    build: {
      minify: false, // 保留console.log以便调试
      rollupOptions: {
        output: {
          // 确保不移除console.log
          intro: '',
        },
      },
      // 明确配置esbuild保留console.log
      esbuild: {
        drop: [],
        pure: [],
      },
    },
    server: {
      host: '0.0.0.0', // 允许外部访问
      port: 5173,
      proxy: {
        // 代理API请求到后端服务器
        '/api': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
        // WebSocket代理
        '/ws': {
          target: wsBase,
          ws: true,
          changeOrigin: true,
        },
        // 代理静态资源（头像等）到后端
        '/assets': {
          target: apiBase,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
