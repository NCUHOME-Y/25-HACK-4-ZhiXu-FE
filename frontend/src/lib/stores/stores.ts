// 全局状态管理（Zustand）
import { create } from "zustand";
import type { User, Task } from "../types/types";

// Auth Store：保存当前用户与 token
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

// Task Store：任务与打卡、学习计时（可渐进扩展）
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
const fmt = (d: Date) => {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
};
export const useTaskStore = create<TaskState>(
	(
		set: (partial: Partial<TaskState> | ((state: TaskState) => Partial<TaskState>)) => void,
		get: () => TaskState
	) => ({
	tasks: [],
	punchedDates: [],
	dailyElapsed: 0,
	sessionElapsed: 0,
	studying: false,
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
	startStudy: () => set({ studying: true, sessionElapsed: 0 }),
	stopStudy: () => {
		const session = get().sessionElapsed;
		set({ 
			studying: false,
			dailyElapsed: get().dailyElapsed + session
		});
	},
	increaseDailyElapsed: () => set({ 
		dailyElapsed: get().dailyElapsed + 1,
		sessionElapsed: get().sessionElapsed + 1
	}),
	})
	);
