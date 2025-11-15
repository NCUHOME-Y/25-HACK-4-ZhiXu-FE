import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import startImage from '../assets/start.png';

/**
 * 开屏动画页面
 * - 展示品牌形象（至少2秒）
 * - 自动检测token并尝试登录
 * - 有token则直接进入主页，无token则进入登录页
 */
export default function StartPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      const startTime = Date.now();
      
      try {
        // 检查本地是否有token
        const token = authService.getToken();
        console.log('🔍 检查本地token:', token ? '存在' : '不存在');
        
        if (token) {
          // 有token，尝试验证并自动登录
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              console.log('✅ Token有效，自动登录成功:', user.name);
              
              // 确保至少显示2秒开屏页面
              const elapsed = Date.now() - startTime;
              const remainingTime = Math.max(0, 2000 - elapsed);
              
              setTimeout(() => {
                navigate('/flag', { replace: true });
              }, remainingTime);
              return;
            }
          } catch {
            console.log('❌ Token验证失败，清除token');
            authService.logout();
          }
        }
        
        // 无token或token无效，等待2秒后跳转登录页
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsed);
        
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, remainingTime);
        
      } catch (error) {
        console.error('❌ 初始化失败:', error);
        // 即使出错也要等待2秒
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 2000 - elapsed);
        
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, remainingTime);
      } finally {
        setIsChecking(false);
      }
    };

    initApp();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex flex-col items-center justify-between overflow-hidden">
        {/* 顶部Logo和标题区域 */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-4">
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-500 via-red-400 to-orange-600 bg-clip-text text-transparent drop-shadow-lg">
            知序
          </h1>
          <p className="text-xl text-orange-600 font-medium">知往观来，序理成章</p>
        </div>
        
        {/* 加载动画 */}
        {isChecking && (
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
      {/* 底部吉祥物图片 */}
      <div className="w-full">
        <img 
          src={startImage}
          alt="知序吉祥物"
          className="w-full h-auto object-cover object-bottom"
          style={{ maxHeight: '40vh' }}
        />
      </div>

      {/* 自定义动画样式 */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
