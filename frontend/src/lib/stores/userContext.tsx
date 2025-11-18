import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';

export interface UserState {
  id: string;
  name: string;
  avatar: string; // 已规范化后的头像路径或URL
}

interface UserContextValue {
  user: UserState | null;
  setUser: (u: UserState | null) => void;
  updateUserProfile: (partial: Partial<Pick<UserState, 'name' | 'avatar'>>) => void;
  refreshFromStorage: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

// 规范化头像: 如果是 /api/avatar/:id 则保持；否则如果是纯数字或空使用默认
const normalizeAvatar = (raw: unknown): string => {
  if (!raw) return '';
  if (typeof raw === 'string') {
    if (raw.startsWith('/api/avatar/')) return raw;
    // 允许直接传数字字符串
    if (/^\d+$/.test(raw)) return `/api/avatar/${raw}`;
    return raw;
  }
  return '';
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(null);

  const refreshFromStorage = useCallback(() => {
    try {
      const str = localStorage.getItem('user');
      if (!str) { setUser(null); return; }
      const obj = JSON.parse(str);
      const normalized: UserState = {
        id: String(obj.id ?? obj.user_id ?? ''),
        name: obj.name || obj.username || '用户',
        avatar: normalizeAvatar(obj.avatar || obj.head_show || '')
      };
      setUser(normalized);
    } catch (e) {
      console.warn('[UserProvider] 解析 localStorage user 失败:', e);
    }
  }, []);

  useEffect(() => {
    refreshFromStorage();
  }, [refreshFromStorage]);

  // 监听 storage 及自定义事件，实现跨标签 / 组件实时刷新
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'user') {
        refreshFromStorage();
      }
    };
    const handleCustom = () => refreshFromStorage();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('userUpdated', handleCustom as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('userUpdated', handleCustom as EventListener);
    };
  }, [refreshFromStorage]);

  const updateUserProfile = (partial: Partial<Pick<UserState, 'name' | 'avatar'>>) => {
    setUser(prev => {
      if (!prev) return prev; // 未登录直接跳过
      const next: UserState = { ...prev, ...partial, avatar: partial.avatar ? normalizeAvatar(partial.avatar) : prev.avatar };
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const obj = JSON.parse(raw);
          obj.name = next.name;
          if (next.avatar) obj.avatar = next.avatar;
          localStorage.setItem('user', JSON.stringify(obj));
        }
      } catch (e) {
        // 静默失败：localStorage 不可用或解析失败
        console.warn('[UserProvider] 无法写入 localStorage user:', e);
      }
      // 触发自定义事件供其它监听者刷新
      window.dispatchEvent(new Event('userUpdated'));
      return next;
    });
  };

  const value: UserContextValue = {
    user,
    setUser,
    updateUserProfile,
    refreshFromStorage
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser 必须在 <UserProvider> 内使用');
  return ctx;
};
