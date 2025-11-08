import type { RouteObject } from 'react-router-dom';
import AuthPage from '../pages/auth';
import ErrorPage from '../pages/error';

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
    path: '/error',
    element: <ErrorPage />,
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
];
