import type { RouteObject } from 'react-router-dom';
import type { ComponentType } from 'react';
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
import { ProtectedRoute } from './ProtectedRoute';

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
