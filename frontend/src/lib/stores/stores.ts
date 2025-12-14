/**
 * 全局状态管理 (Zustand)
 * 管理用户认证和任务状态
 */
import { create } from "zustand";
import type { User, Task } from "../types/types";

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
	updateTask: (id: string, partial: Partial<Task>) => void;
	deleteTask: (id: string) => void;
	tickTask: (id: string) => void;
	togglePunchToday: () => void;
	startStudy: () => void;
	stopStudy: () => void;
	increaseDailyElapsed: () => void;
}

// 全局计时器ID，存储在模块作用域
let globalTimerId: number | null = null;
let autoStopTimeoutId: number | null = null; // 自动停止定时器

const fmt = (d: Date) => {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
};

// 学习计时相关localStorage键
const STUDY_START_TIME_KEY = 'study_start_time';
const STUDY_DAILY_ELAPSED_KEY = 'study_daily_elapsed';

// 获取下一天凌晨4点的毫秒数
const getNext4AM = () => {
	const now = new Date();
	const next4AM = new Date(now);
	next4AM.setDate(now.getDate() + 1);
	next4AM.setHours(4, 0, 0, 0);
	return next4AM.getTime() - now.getTime();
};

// 自动停止学习（凌晨4点，不计入时长）
const autoStopStudy = () => {
	const startTimeStr = localStorage.getItem(STUDY_START_TIME_KEY);
	if (startTimeStr) {
		localStorage.removeItem(STUDY_START_TIME_KEY);
		localStorage.removeItem(STUDY_DAILY_ELAPSED_KEY);
		
		// 清除计时器
		if (globalTimerId !== null) {
			window.clearInterval(globalTimerId);
			globalTimerId = null;
		}
		
		// 设置状态为停止
		useTaskStore.setState({ studying: false, sessionElapsed: 0 });
		
		// 设置下一个自动停止
		autoStopTimeoutId = window.setTimeout(autoStopStudy, getNext4AM());
	}
};

// 初始化自动停止定时器
const initAutoStop = () => {
	if (autoStopTimeoutId !== null) {
		window.clearTimeout(autoStopTimeoutId);
	}
	autoStopTimeoutId = window.setTimeout(autoStopStudy, getNext4AM());
};

// 恢复学习计时（页面刷新后）
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
		updateTask: (id: string, partial: Partial<Task>) => set({ tasks: get().tasks.map((t: Task) => (t.id === id ? { ...t, ...partial } : t)) }),
	deleteTask: (id: string) => set({ tasks: get().tasks.filter((t: Task) => t.id !== id) }),
	tickTask: (id: string) => set({
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
