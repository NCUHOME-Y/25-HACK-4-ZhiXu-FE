import type { RouteObject } from 'react-router-dom';
import type { ComponentType } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useState, useLayoutEffect } from 'react';
import StartPage from '../pages/start';
import AuthPage from '../pages/auth';
import ErrorPage from '../pages/error';
import FlagPage from '../pages/flag';
import AIPage from '../pages/ai';
import DataPage from '../pages/data';
import ContactPage from '../pages/contact';
import MinePage from '../pages/mine';
import RankPage from '../pages/rank';
import PublicPage from '../pages/public';
import SendPage from '../pages/send';
import ReceivePage from '../pages/receive';
import ChatRoomsPage from '../pages/chat-rooms';
import { authService } from '../services/auth.service';

/** 路由保护组件 - 需要登录才能访问 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 使用 useLayoutEffect 在浏览器绘制前同步检查
  useLayoutEffect(() => {
    const hasToken = authService.isAuthenticated();
    if (!hasToken) {
      setIsAuthenticated(false);
      setIsChecking(false);
      return;
    }
    
    // 有token，继续异步验证
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        // 网络错误或其他异常
        console.error('[ProtectedRoute] 验证失败:', error);
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [location.pathname]);
  
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

/** 受保护的路由配置 */
const protectedRoutes: Array<{ path: string; component: ComponentType }> = [
  { path: '/flag', component: FlagPage },
  { path: '/ai', component: AIPage },
  { path: '/data', component: DataPage },
  { path: '/contact', component: ContactPage },
  { path: '/mine', component: MinePage },
  { path: '/rank', component: RankPage },
  { path: '/chat-rooms', component: ChatRoomsPage },
  { path: '/public', component: PublicPage },
  { path: '/send', component: SendPage },
  { path: '/receive', component: ReceivePage },
  { path: '/comments-received', component: ReceivePage },
];

/** 应用路由配置 */
export const routes: RouteObject[] = [
  // 公开路由
  {
    path: '/',
    element: <StartPage />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  // 受保护的路由（自动包装 ProtectedRoute）
  ...protectedRoutes.map(({ path, component: Component }) => ({
    path,
    element: (
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    ),
  })),
  // 错误路由
  {
    path: '/error',
    element: <ErrorPage />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
];
