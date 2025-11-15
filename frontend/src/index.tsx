import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useRoutes, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './styles/globals.css'
import { routes } from './routes/routes'
import { Toaster } from './components/ui/sonner'
import { authService } from './services/auth.service'

const App = () => {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  const location = useLocation();

  // 全局路由守卫 - 在路由变化时检查认证状态
  useEffect(() => {
    const publicPaths = ['/', '/auth', '/error'];
    const currentPath = location.pathname;
    
    // 如果是公开路径，不需要检查
    if (publicPaths.includes(currentPath)) {
      return;
    }
    
    // 检查是否有有效的token
    const hasToken = authService.isAuthenticated();
    if (!hasToken) {
      console.log('[全局路由守卫] 无有效token，重定向到登录页');
      navigate('/auth', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
        <div className="w-full max-w-md">
          {element}
        </div>
      </div>
      <Toaster 
        position="top-center" 
        offset="160px"
        style={{ 
          top: '160px',
        }}
      />
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
