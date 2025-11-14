import type { RouteObject } from 'react-router-dom';
import AuthPage from '../pages/auth';
import ErrorPage from '../pages/error';
import FlagPage from '../pages/flag';
import AIPage from '../pages/ai';
import DataPage from '../pages/data';
import ContactPage from '../pages/contact';
import MinePage from '../pages/mine';
import SetPage from '../pages/set';
import RankPage from '../pages/rank';
import PublicPage from '../pages/public';
import PrivatePage from '../pages/private';
import ChatRoomsPage from '../pages/chat-rooms';
import { ProtectedRoute } from './ProtectedRoute';

// 应用路由配置
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AuthPage />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/flag',
    element: (
      <ProtectedRoute>
        <FlagPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/ai',
    element: (
      <ProtectedRoute>
        <AIPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/data',
    element: (
      <ProtectedRoute>
        <DataPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/contact',
    element: (
      <ProtectedRoute>
        <ContactPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/mine',
    element: (
      <ProtectedRoute>
        <MinePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/set',
    element: (
      <ProtectedRoute>
        <SetPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/rank',
    element: (
      <ProtectedRoute>
        <RankPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/chat-rooms',
    element: (
      <ProtectedRoute>
        <ChatRoomsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/public',
    element: (
      <ProtectedRoute>
        <PublicPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/private',
    element: (
      <ProtectedRoute>
        <PrivatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/error',
    element: <ErrorPage />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
];
