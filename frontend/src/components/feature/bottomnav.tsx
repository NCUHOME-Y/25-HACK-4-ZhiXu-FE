import { useNavigate, useLocation } from 'react-router-dom';
import { Flag, Bot, BarChart3, MessageSquare, User } from 'lucide-react';
import { cn } from '../../lib/helpers/helpers';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/flag', label: '圭表', icon: Flag },
    { path: '/ai', label: '太傅', icon: Bot },
    { path: '/data', label: '璇历', icon: BarChart3 },
    { path: '/contact', label: '翰林', icon: MessageSquare },
    { path: '/mine', label: '素札', icon: User },
  ];

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/60 bg-white/95 backdrop-blur-xl shadow-xl shadow-gray-900/5'>
      <div className='safe-area-inset-bottom flex h-16 items-center justify-around px-2'>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 mx-1 transition-all duration-500 hover:scale-105 active:scale-95 transform',
                isActive
                  ? 'text-blue-600 bg-blue-50 shadow-lg border border-blue-200/50 scale-110'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50/50 scale-100'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 transition-all duration-300 group-hover:scale-110',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-xs font-medium transition-all duration-300',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
