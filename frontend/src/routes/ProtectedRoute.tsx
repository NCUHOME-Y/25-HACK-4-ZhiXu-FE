import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

/**
 * 路由保护组件
 * 需要登录才能访问的页面
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // 检查用户是否已登录
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    // 未登录，重定向到认证页面
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
