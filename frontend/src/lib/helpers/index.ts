/**
 * 统一的工具函数库 - 整合了所有helpers、积分系统、资源管理、API辅助等功能
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

// 导入所有头像图片
import avatar1 from '../../assets/head/screenshot_20251114_131601.png';
import avatar2 from '../../assets/head/screenshot_20251114_131629.png';
import avatar3 from '../../assets/head/screenshot_20251114_131937.png';
import avatar4 from '../../assets/head/screenshot_20251114_131951.png';
import avatar5 from '../../assets/head/screenshot_20251114_132014.png';
import avatar6 from '../../assets/head/screenshot_20251114_133459.png';
import avatar7 from '../../assets/head/微信图片_20251115203432_32_227.jpg';
import avatar8 from '../../assets/head/微信图片_20251115203433_33_227.jpg';
import avatar9 from '../../assets/head/微信图片_20251115203434_34_227.jpg';
import avatar10 from '../../assets/head/微信图片_20251115203434_35_227.jpg';
import avatar11 from '../../assets/head/微信图片_20251115203435_36_227.jpg';
import avatar12 from '../../assets/head/微信图片_20251115203436_37_227.jpg';
import avatar13 from '../../assets/head/微信图片_20251116131024_45_227.jpg';
import avatar14 from '../../assets/head/微信图片_20251116131024_46_227.jpg';
import avatar15 from '../../assets/head/微信图片_20251116131025_47_227.jpg';
import avatar16 from '../../assets/head/微信图片_20251116131026_48_227.jpg';
import avatar17 from '../../assets/head/微信图片_20251116131027_49_227.jpg';
import avatar18 from '../../assets/head/微信图片_20251116131028_50_227.jpg';
import avatar19 from '../../assets/head/微信图片_20251116131029_51_227.jpg';
import avatar20 from '../../assets/head/微信图片_20251116131030_52_227.jpg';
import avatar21 from '../../assets/head/微信图片_20251116131031_53_227.jpg';
import avatar22 from '../../assets/head/微信图片_20251117235910_62_227.jpg';
import avatar23 from '../../assets/head/微信图片_20251117235910_63_227.jpg';
import avatar24 from '../../assets/head/微信图片_20251117235911_64_227.jpg';
import avatar25 from '../../assets/head/微信图片_20251117235912_65_227.jpg';
import avatar26 from '../../assets/head/微信图片_20251117235913_66_227.jpg';
import avatar27 from '../../assets/head/微信图片_20251117235914_67_227.jpg';
import avatar28 from '../../assets/head/微信图片_20251117235915_68_227.jpg';
import avatar29 from '../../assets/head/微信图片_20251117235916_69_227.jpg';
import avatar30 from '../../assets/head/微信图片_20251117235917_71_227.jpg';
import avatar31 from '../../assets/head/微信图片_20251118000147_72_227.jpg';
import avatar32 from '../../assets/head/微信图片_20251118000148_74_227.jpg';

export const AVATAR_FILES = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8, avatar9, avatar10, avatar11, avatar12, avatar13, avatar14, avatar15, avatar16, avatar17, avatar18, avatar19, avatar20, avatar21, avatar22, avatar23, avatar24, avatar25, avatar26, avatar27, avatar28, avatar29, avatar30, avatar31, avatar32];
export const BASE_POINTS = { DAILY_PUNCH: 10, TASK_CREATE: 5, TASK_COMPLETE: 15, CONTINUOUS_BONUS: 5 } as const;
export const PUNCH_LIMITS = { MAX_PER_DAY: 1, MIN_INTERVAL_HOURS: 20 } as const;
export const DIFFICULTY_MULTIPLIER = { 1: 1.0, 2: 1.3, 3: 1.6, 4: 2.0 } as const;
export const TASK_TYPE_MULTIPLIER = { 1: 1.2, 2: 1.3, 3: 1.5, 4: 1.0, 5: 1.1 } as const;

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const formatDate = (date: Date | string, format = 'YYYY-MM-DD HH:mm:ss'): string => { const d = typeof date === 'string' ? new Date(date) : date; const year = d.getFullYear(); const month = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const hours = String(d.getHours()).padStart(2, '0'); const minutes = String(d.getMinutes()).padStart(2, '0'); const seconds = String(d.getSeconds()).padStart(2, '0'); return format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day).replace('HH', hours).replace('mm', minutes).replace('ss', seconds); };
export const formatDateYMD = (date: Date): string => { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, "0"); const d = String(date.getDate()).padStart(2, "0"); return `${y}-${m}-${d}`; };
export const calculateMonthlyPunches = (punchedDates: string[]): number => { const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear(); return punchedDates.filter(dateStr => { const date = new Date(dateStr); return date.getMonth() === currentMonth && date.getFullYear() === currentYear; }).length; };
export const formatElapsedTime = (seconds: number): { minutes: string; seconds: string } => { const m = Math.floor(seconds / 60).toString().padStart(2, "0"); const s = (seconds % 60).toString().padStart(2, "0"); return { minutes: m, seconds: s }; };
export const formatDurationHMS = (seconds: number): string => { const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; };
export const formatDurationShort = (seconds: number): string => { const hours = Math.floor(seconds / 3600); const mins = Math.floor((seconds % 3600) / 60); if (hours > 0) { return `${hours}h${mins}`; } return `${mins}m`; };
export const formatDurationFlexible = (seconds: number): { time: string; isLong: boolean } => { const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60; if (h > 0) { return { time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, isLong: true }; } else { return { time: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, isLong: false }; } };
export const formatTimeAgo = (dateString: string): string => { const date = new Date(dateString); const now = new Date(); const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000); if (diffInSeconds < 60) { return '刚刚'; } else if (diffInSeconds < 3600) { const minutes = Math.floor(diffInSeconds / 60); return `${minutes}分钟前`; } else if (diffInSeconds < 86400) { const hours = Math.floor(diffInSeconds / 3600); return `${hours}小时前`; } else if (diffInSeconds < 2592000) { const days = Math.floor(diffInSeconds / 86400); return `${days}天前`; } else if (diffInSeconds < 31536000) { const months = Math.floor(diffInSeconds / 2592000); return `${months}个月前`; } else { const years = Math.floor(diffInSeconds / 31536000); return `${years}年前`; } };
export const isValidEmail = (email: string): boolean => { const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return emailRegex.test(email); };
export const isValidPhone = (phone: string): boolean => { const phoneRegex = /^1[3-9]\d{9}$/; return phoneRegex.test(phone); };
export const debounce = <T extends (...args: never[]) => unknown>(func: T, delay: number): ((...args: Parameters<T>) => void) => { let timeoutId: ReturnType<typeof setTimeout>; return (...args: Parameters<T>) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => func(...args), delay); }; };
export const throttle = <T extends (...args: never[]) => unknown>(func: T, limit: number): ((...args: Parameters<T>) => void) => { let inThrottle: boolean; return (...args: Parameters<T>) => { if (!inThrottle) { func(...args); inThrottle = true; setTimeout(() => (inThrottle = false), limit); } }; };
export const deepClone = <T>(obj: T): T => { return JSON.parse(JSON.stringify(obj)); };
export const generateId = (): string => { return Math.random().toString(36).substring(2) + Date.now().toString(36); };
export const clamp = (value: number, min: number, max: number): number => { return Math.min(Math.max(value, min), max); };
export const formatFileSize = (bytes: number): string => { if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]; };
export const sleep = (ms: number): Promise<void> => { return new Promise(resolve => setTimeout(resolve, ms)); };
export const scrollToBottom = (ref: React.RefObject<HTMLDivElement | null>) => { ref.current?.scrollIntoView({ behavior: 'smooth' }); };
export function getAssetUrl(path: string | undefined): string { if (!path) return ''; if (path.startsWith('http://') || path.startsWith('https://')) { return path; } return path.startsWith('/') ? path : `/${path}`; }
export function getAvatarUrl(avatarPath: string | undefined): string { if (!avatarPath) return ''; const apiAvatarMatch = avatarPath.match(/^\/api\/avatar\/(\d+)$/); if (apiAvatarMatch) { const index = parseInt(apiAvatarMatch[1], 10); if (index >= 1 && index <= AVATAR_FILES.length) { return AVATAR_FILES[index - 1]; } return AVATAR_FILES[0]; } return avatarPath; }
export const adaptPostToUser = (post: { id: number | string; user_id?: number; userName?: string; user_name?: string; userAvatar?: string; user_avatar?: string; content: string; like?: number; likes?: number; comments?: Array<{ id: number | string; user_id?: number; userId?: string; userName?: string; user_name?: string; userAvatar?: string; user_avatar?: string; content: string; created_at?: string; createdAt?: string; }>; created_at?: string; createdAt?: string; }): import('../types/types').ContactUser => ({ id: String(post.id || '0'), userId: String(post.user_id || '0'), name: post.userName || post.user_name || '用户', avatar: getAvatarUrl(post.userAvatar || post.user_avatar || ''), message: (post.content && post.content.trim()) ? post.content : ' ', likes: post.likes || post.like || 0, comments: (post.comments || []).map(c => ({ id: String(c.id || '0'), userId: String(c.userId || c.user_id || '0'), userName: c.userName || c.user_name || '用户', userAvatar: getAvatarUrl(c.userAvatar || c.user_avatar || ''), content: c.content || '', time: formatTimeAgo(c.createdAt || c.created_at || new Date().toISOString()) })), totalDays: 0, completedFlags: 0, totalPoints: 0, createdAt: post.createdAt || post.created_at || new Date().toISOString() });
export function calculateDailyPunchPoints(consecutiveDays: number): number { let points = BASE_POINTS.DAILY_PUNCH; const weekBonus = Math.floor(consecutiveDays / 7) * BASE_POINTS.CONTINUOUS_BONUS; points += weekBonus; return Math.min(points, 30); }
export function calculateTaskCompletionPoints(params: { priority: 1 | 2 | 3 | 4; label: 1 | 2 | 3 | 4 | 5; total: number; }): number { const { priority, label, total } = params; let points = BASE_POINTS.TASK_COMPLETE; const difficultyKey = priority as keyof typeof DIFFICULTY_MULTIPLIER; points *= DIFFICULTY_MULTIPLIER[difficultyKey]; const typeKey = label as keyof typeof TASK_TYPE_MULTIPLIER; points *= TASK_TYPE_MULTIPLIER[typeKey]; const volumeMultiplier = 1 + Math.log10(total) * 0.2; points *= volumeMultiplier; return Math.round(points); }
export function validatePunch(lastPunchTime: number, now: number = Date.now()): { valid: boolean; message?: string; } { if (!lastPunchTime) { return { valid: true }; } const hoursSinceLastPunch = (now - lastPunchTime) / (1000 * 60 * 60); if (hoursSinceLastPunch < PUNCH_LIMITS.MIN_INTERVAL_HOURS) { const hoursLeft = Math.ceil(PUNCH_LIMITS.MIN_INTERVAL_HOURS - hoursSinceLastPunch); return { valid: false, message: `请等待${hoursLeft}小时后再打卡` }; } return { valid: true }; }
export function calculateStreakDays(punchDates: string[]): number { if (!punchDates || punchDates.length === 0) return 0; const sorted = [...punchDates].sort().reverse(); let streak = 0; const today = new Date(); today.setHours(0, 0, 0, 0); for (let i = 0; i < sorted.length; i++) { const checkDate = new Date(sorted[i]); checkDate.setHours(0, 0, 0, 0); const expectedDate = new Date(today); expectedDate.setDate(today.getDate() - i); expectedDate.setHours(0, 0, 0, 0); if (checkDate.getTime() === expectedDate.getTime()) { streak++; } else { break; } } return streak; }
export { calculateStreakDays as calculateStreak, calculateTaskCompletionPoints as calculateTaskPoints };
export function formatPoints(points: number): string { if (points >= 1000) { return `${(points / 1000).toFixed(1)}k`; } return String(points); }
export function getPointsRank(totalPoints: number): { rank: string; minPoints: number; maxPoints: number; } { const ranks = [{ rank: '学习新人', minPoints: 0, maxPoints: 99 }, { rank: '努力学者', minPoints: 100, maxPoints: 299 }, { rank: '坚持达人', minPoints: 300, maxPoints: 599 }, { rank: '学霸精英', minPoints: 600, maxPoints: 999 }, { rank: '知识大师', minPoints: 1000, maxPoints: 1999 }, { rank: '传奇导师', minPoints: 2000, maxPoints: Infinity }]; return ranks.find(r => totalPoints >= r.minPoints && totalPoints <= r.maxPoints) || ranks[0]; }
export function createApiWrapper(client: AxiosInstance) { return { async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> { const response = await client.get<T>(url, config); return response.data; }, async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> { const response = await client.post<T>(url, data, config); return response.data; }, async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> { const response = await client.put<T>(url, data, config); return response.data; }, async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> { const response = await client.delete<T>(url, config); return response.data; }, async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> { const response = await client.patch<T>(url, data, config); return response.data; } }; }
export async function withErrorHandling<T>(fn: () => Promise<T>, errorMessage = '操作失败'): Promise<T> { try { return await fn(); } catch (error) { console.error(errorMessage, error); throw error; } }
export async function batchOperation<T, R>(items: T[], operation: (item: T) => Promise<R>, onProgress?: (completed: number, total: number) => void): Promise<R[]> { const results: R[] = []; for (let i = 0; i < items.length; i++) { const result = await operation(items[i]); results.push(result); onProgress?.(i + 1, items.length); } return results; }
export async function retry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> { let lastError: Error | null = null; for (let i = 0; i < maxRetries; i++) { try { return await fn(); } catch (error) { lastError = error as Error; if (i < maxRetries - 1) { await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); } } } throw lastError; }
