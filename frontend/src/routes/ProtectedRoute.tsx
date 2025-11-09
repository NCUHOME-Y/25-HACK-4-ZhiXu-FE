import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

/**
 * 路由保护组件
 * 需要登录才能访问的页面
 *
 * 开发模式：设置 localStorage['dev_skip_auth'] = 'true' 可绕过认证
 * 在浏览器控制台输入：localStorage.setItem('dev_skip_auth', 'true')
 * 恢复认证：localStorage.removeItem('dev_skip_auth')
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // 开发模式：检查是否跳过认证
  const skipAuth = localStorage.getItem('dev_skip_auth') === 'true';

  // 检查用户是否已登录
  const isAuthenticated = authService.isAuthenticated();

  // 开发模式下可以绕过认证
  if (!isAuthenticated && !skipAuth) {
    // 未登录且未开启开发模式，重定向到认证页面
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
