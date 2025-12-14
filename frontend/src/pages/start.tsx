import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import startImage from '../assets/start/start.png';
import zhixuImage from '../assets/start/zhixu.png';
import yanImage from '../assets/start/yan.png';
import leaf1 from '../assets/start/leaf1.png';
import leaf2 from '../assets/start/leaf2.png';
import leaf3 from '../assets/start/leaf3.png';
import leaf4 from '../assets/start/leaf4.png';
import leaf5 from '../assets/start/微信图片_20251117203226_58_227-removebg-preview.png';
import leaf6 from '../assets/start/微信图片_20251117203226_59_227-removebg-preview.png';
import leaf7 from '../assets/start/微信图片_20251117203227_60_227-removebg-preview.png';
import leaf8 from '../assets/start/微信图片_20251117203228_61_227-removebg-preview.png';

export default function StartPage() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      const startTime = Date.now();
      
      try {
        const token = authService.getToken();
        
        if (token) {
          // 有token，尝试验证并自动登录
          try {
            const user = await authService.getCurrentUser();
            if (user) {
              const elapsed = Date.now() - startTime;
              const remainingTime = Math.max(0, 3000 - elapsed);
              
              setTimeout(() => {
                navigate('/flag', { replace: true });
              }, remainingTime);
              return;
            }
          } catch {
            authService.logout();
          }
        }
        
        // 无token或token无效，等待3秒后跳转登录页
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 3000 - elapsed);
        
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, remainingTime);
        
      } catch (error) {
        console.error('❌ 初始化失败:', error);
        // 即使出错也要等待3秒
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, 3000 - elapsed);
        
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex flex-col items-center justify-between overflow-hidden relative">
      {/* 枫叶装饰，四角分布 */}
      {/* 枫叶装饰，四角但不贴边且避开主图 */}
      <img src={leaf1} alt="leaf1" className="absolute left-8 top-16 w-16 h-16 opacity-80 animate-fade-in" style={{zIndex:1}} />
      <img src={leaf2} alt="leaf2" className="absolute right-10 top-24 w-20 h-20 opacity-80 animate-fade-in" style={{zIndex:1}} />
      <img src={leaf3} alt="leaf3" className="absolute left-12 bottom-72 w-20 h-20 opacity-80 animate-fade-in" style={{zIndex:1}} />
      <img src={leaf4} alt="leaf4" className="absolute right-16 bottom-64 w-16 h-16 opacity-80 animate-fade-in" style={{zIndex:1}} />
      {/* 新增银杏叶装饰 */}
      <img src={leaf5} alt="leaf5" className="absolute left-1/2 top-8 transform -translate-x-1/2 w-18 h-18 opacity-80 animate-fade-in" style={{zIndex:1}} />
      <img src={leaf6} alt="leaf6" className="absolute right-8 top-1/2 transform -translate-y-1/2 w-20 h-20 opacity-80 animate-fade-in" style={{zIndex:1}} />
      <img src={leaf7} alt="leaf7" className="absolute left-8 bottom-32 w-18 h-18 opacity-80 animate-fade-in" style={{zIndex:1}} />
      <img src={leaf8} alt="leaf8" className="absolute right-1/2 bottom-40 transform translate-x-1/2 w-16 h-16 opacity-80 animate-fade-in" style={{zIndex:1}} />

      {/* 居中图片区域 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        {/* zhixu图片正中央 */}
        <img
          src={zhixuImage}
          alt="zhixu"
          className="w-3/5 h-auto object-contain mx-auto animate-fade-in"
          style={{ position: 'relative', zIndex: 2 }}
        />
        {/* yan图片紧贴zhixu下方 */}
        <img
          src={yanImage}
          alt="yan"
          className="w-3/5 h-auto object-contain mx-auto animate-fade-in mt-8"
          style={{ position: 'relative', zIndex: 1 }}
        />
        {/* 加载动画 */}
        {isChecking && (
          <div className="flex space-x-2 mt-6">
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
      </div>
      {/* start图片在屏幕中下位置 */}
      <div className="w-full mb-8 z-10">
        <img
          src={startImage}
          alt="start"
          className="w-full h-auto object-contain"
          style={{ maxHeight: '32vh' }}
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
