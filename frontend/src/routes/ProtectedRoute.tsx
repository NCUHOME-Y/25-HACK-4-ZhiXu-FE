import { Navigate, useLocation } from 'react-router-dom';
import { useState, useLayoutEffect } from 'react';
import { authService } from '../services/auth.service';

/**
 * 路由保护组件
 * 需要登录才能访问的页面
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 使用 useLayoutEffect 在浏览器绘制前同步检查
  useLayoutEffect(() => {
    const hasToken = authService.isAuthenticated();
    if (!hasToken) {
      console.log('[ProtectedRoute] 没有token，阻止渲染并重定向');
      setShouldRedirect(true);
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }
    
    // 有token，继续异步验证
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          setShouldRedirect(false);
        } else {
          setIsAuthenticated(false);
          setShouldRedirect(true);
        }
      } catch (error) {
        console.error('[ProtectedRoute] 验证token失败:', error);
        setIsAuthenticated(false);
        setShouldRedirect(true);
        localStorage.removeItem('auth_token');
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [location.pathname]);
  
  // 如果需要重定向，立即返回Navigate，不渲染任何内容
  if (shouldRedirect) {
    return <Navigate to="/auth" replace />;
  }

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
