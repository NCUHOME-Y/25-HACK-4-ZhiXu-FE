import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5173,
    proxy: {
      // 代理API请求到后端服务器
      '/api': {
        target: 'http://192.168.12.88:8080',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket代理
      '/ws': {
        target: 'ws://192.168.12.88:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
