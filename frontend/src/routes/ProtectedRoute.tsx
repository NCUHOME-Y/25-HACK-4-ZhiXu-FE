import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

/**
 * 路由保护组件
 * 需要登录才能访问的页面
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // 立即进行同步检查，没有token直接返回登录重定向
  const hasToken = authService.isAuthenticated();
  
  const [isChecking, setIsChecking] = useState(hasToken);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 如果没有token，不需要异步验证
    if (!hasToken) {
      setIsChecking(false);
      setIsAuthenticated(false);
      return;
    }

    const checkAuth = async () => {
      // 调用后端API验证token是否真实有效
      try {
        const user = await authService.getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('验证token失败:', error);
        setIsAuthenticated(false);
        // token无效，清除
        localStorage.removeItem('auth_token');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [hasToken]);

  // 显示加载状态
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">验证登录状态...</p>
        </div>
      </div>
    );
  }

  // 未登录，重定向到认证页面
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
