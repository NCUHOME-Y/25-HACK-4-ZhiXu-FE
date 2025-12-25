import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useRoutes, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './styles/globals.css'
import { routes } from './routes/routes'
import { UserProvider } from './lib/stores/stores'
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
      navigate('/auth', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <>
      {element}
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
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
)
