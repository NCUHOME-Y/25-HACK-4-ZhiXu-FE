/**
 * 全局状态管理
 * 包含Zustand状态管理和React Context
 */
import { create } from "zustand";
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import type { User, Task } from "../types/types";

// ==================== User Context (React Context) ====================

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
        id: String(obj.id ?? obj.userId ?? ''),
        name: obj.name || obj.username || '',
        avatar: normalizeAvatar(obj.avatar || obj.headShow || '')
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

// ==================== Zustand Stores ====================

/**
 * 认证状态管理
 */
interface AuthState {
	user: User | null;
	token: string | null;
	setAuth: (payload: { user: User; token: string }) => void;
	clear: () => void;
}
export const useAuthStore = create<AuthState>((set: (partial: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)) => void) => ({
	user: null,
	token: null,
	setAuth: ({ user, token }) => set({ user, token }),
	clear: () => set({ user: null, token: null }),
}));

/**
 * 任务状态管理
 * 包含任务、打卡、学习计时功能
 */
interface TaskState {
	tasks: Task[];
	punchedDates: string[]; // YYYY-MM-DD
	dailyElapsed: number; // 每日累计学习时长（秒）
	sessionElapsed: number; // 本次学习时长（秒）
	studying: boolean;
	addTask: (task: Task) => void;
	updateTask: (id: number, partial: Partial<Task>) => void;
	deleteTask: (id: number) => void;
	tickTask: (id: number) => void;
	togglePunchToday: () => void;
	startStudy: () => void;
	stopStudy: () => void;
	increaseDailyElapsed: () => void;
}

let globalTimerId: number | null = null;
let autoStopTimeoutId: number | null = null;

const fmt = (d: Date) => {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
};

const STUDY_START_TIME_KEY = 'study_start_time';
const STUDY_DAILY_ELAPSED_KEY = 'study_daily_elapsed';

const getNext4AM = () => {
	const now = new Date();
	const next4AM = new Date(now);
	next4AM.setHours(4, 0, 0, 0);
	
	if (next4AM.getTime() <= now.getTime()) {
		next4AM.setDate(now.getDate() + 1);
	}
	
	return next4AM.getTime() - now.getTime();
};

const autoStopStudy = async () => {
	const startTimeStr = localStorage.getItem(STUDY_START_TIME_KEY);
	if (startTimeStr) {
		const currentState = useTaskStore.getState();
		const session = currentState.sessionElapsed;
		
		if (session > 0) {
			try {
				const { stopStudySession } = await import('../../services/flag.service');
				await stopStudySession('', session);
			} catch (error) {
				console.error('[autoStopStudy] 保存学习时长失败:', error);
			}
		}
		
		localStorage.removeItem(STUDY_START_TIME_KEY);
		localStorage.removeItem(STUDY_DAILY_ELAPSED_KEY);
		
		if (globalTimerId !== null) {
			window.clearInterval(globalTimerId);
			globalTimerId = null;
		}
		
		useTaskStore.setState({ studying: false, sessionElapsed: 0 });
		
		autoStopTimeoutId = window.setTimeout(autoStopStudy, getNext4AM());
	}
};

const initAutoStop = () => {
	if (autoStopTimeoutId !== null) {
		window.clearTimeout(autoStopTimeoutId);
	}
	const delay = getNext4AM();
	autoStopTimeoutId = window.setTimeout(autoStopStudy, delay);
};

const getInitialStudyState = () => {
	const startTimeStr = localStorage.getItem(STUDY_START_TIME_KEY);
	const dailyElapsedStr = localStorage.getItem(STUDY_DAILY_ELAPSED_KEY);
	
	if (startTimeStr && dailyElapsedStr) {
		const startTime = parseInt(startTimeStr);
		const savedDailyElapsed = parseInt(dailyElapsedStr);
		const now = Date.now();
		const elapsedSinceStart = Math.floor((now - startTime) / 1000);
		
		return {
			studying: true,
			dailyElapsed: savedDailyElapsed,
			sessionElapsed: elapsedSinceStart
		};
	}
	return {
		studying: false,
		dailyElapsed: 0,
		sessionElapsed: 0
	};
};

// 获取初始状态
const initialStudyState = getInitialStudyState();

export const useTaskStore = create<TaskState>(
	(
		set: (partial: Partial<TaskState> | ((state: TaskState) => Partial<TaskState>)) => void,
		get: () => TaskState
	) => ({
	tasks: [],
	punchedDates: [],
	dailyElapsed: initialStudyState.dailyElapsed,
	sessionElapsed: initialStudyState.sessionElapsed,
	studying: initialStudyState.studying,
	addTask: (task: Task) => set({ tasks: [task, ...get().tasks] }),
		updateTask: (id: number, partial: Partial<Task>) => set({ tasks: get().tasks.map((t: Task) => (t.id === id ? { ...t, ...partial } : t)) }),
	deleteTask: (id: number) => set({ tasks: get().tasks.filter((t: Task) => t.id !== id) }),
	tickTask: (id: number) => set({
		tasks: get().tasks.map((t: Task) => {
			if (t.id !== id) return t;
			const total = t.total ?? 1;
			const next = (t.count ?? 0) + 1;
			const done = next >= total;
			return { ...t, count: next, completed: done };
		}),
	}),
	togglePunchToday: () => {
		const today = fmt(new Date());
		const cur = get().punchedDates;
			set({ punchedDates: cur.includes(today) ? cur.filter((d: string) => d !== today) : [...cur, today] });
	},
	startStudy: () => {
		// 如果已经有计时器在运行，先清除
		if (globalTimerId !== null) {
			window.clearInterval(globalTimerId);
		}
		
		const now = Date.now();
		
		// 保存到localStorage
		localStorage.setItem(STUDY_START_TIME_KEY, now.toString());
		localStorage.setItem(STUDY_DAILY_ELAPSED_KEY, get().dailyElapsed.toString());
		
		// 启动全局计时器
		globalTimerId = window.setInterval(() => {
			const state = get();
			if (state.studying) {
				set({ 
					dailyElapsed: state.dailyElapsed + 1,
					sessionElapsed: state.sessionElapsed + 1
				});
			}
		}, 1000);
		
		set({ studying: true, sessionElapsed: 0 });
	},
	stopStudy: async () => {
		// 清除localStorage
		localStorage.removeItem(STUDY_START_TIME_KEY);
		localStorage.removeItem(STUDY_DAILY_ELAPSED_KEY);
		
		// 清除全局计时器
		if (globalTimerId !== null) {
			window.clearInterval(globalTimerId);
			globalTimerId = null;
		}
		
		const session = get().sessionElapsed;
		
		if (session <= 0) {
			console.warn('⚠️ [学习计时] session时长≤0，跳过保存');
		}
		
		set({ 
			studying: false,
			dailyElapsed: get().dailyElapsed + session
		});
		
		// 将学习时长保存到后端
		if (session > 0) {
			try {
				const { stopStudySession } = await import('../../services/flag.service');
				await stopStudySession('', session);
			} catch (error) {
				console.error('保存学习时长失败:', error);
			}
		} else {
			console.warn('⚠️ [学习计时] session时长≤0，跳过保存');
		}
	},
	increaseDailyElapsed: () => set({ 
		dailyElapsed: get().dailyElapsed + 1,
		sessionElapsed: get().sessionElapsed + 1
	}),
	})
	);

// 恢复计时器（如果需要）
if (initialStudyState.studying) {
	globalTimerId = window.setInterval(() => {
		const state = useTaskStore.getState();
		if (state.studying) {
			useTaskStore.setState({ 
				dailyElapsed: state.dailyElapsed + 1,
				sessionElapsed: state.sessionElapsed + 1
			});
		}
	}, 1000);
}

// 初始化自动停止定时器
initAutoStop();
