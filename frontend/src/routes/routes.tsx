import type { RouteObject } from 'react-router-dom';
import AuthPage from '../pages/auth';
import ErrorPage from '../pages/error';
import FlagPage from '../pages/flag';
import AIPage from '../pages/ai';
import DataPage from '../pages/data';
import ContactPage from '../pages/contact';
import MinePage from '../pages/mine';
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
    path: '/error',
    element: <ErrorPage />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
];
