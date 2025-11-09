import { useNavigate, useLocation } from 'react-router-dom';
import { Flag, Bot, BarChart3, MessageSquare, User } from 'lucide-react';
import { cn } from '../../lib/helpers/utils';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/flag', label: '打卡', icon: Flag },
    { path: '/ai', label: 'AI', icon: Bot },
    { path: '/data', label: '数据', icon: BarChart3 },
    { path: '/contact', label: '联系', icon: MessageSquare },
    { path: '/mine', label: '我的', icon: User },
  ];

  return (
    <nav className='fixed bottom-0 left-0 right-0 z-50 border-t border-(--border) bg-(--background) md:hidden'>
      <div className='flex h-16 items-center justify-around px-2'>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-colors',
                isActive
                  ? 'text-(--primary)'
                  : 'text-(--muted-foreground) hover:text-(--foreground)'
              )}
            >
              <Icon className='h-5 w-5' />
              <span className='text-xs font-medium'>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
