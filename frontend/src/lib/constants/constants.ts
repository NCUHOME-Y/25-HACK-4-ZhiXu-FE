// 环境变量
export const ENV = {
  // 支持两种变量：优先使用 VITE_API_BASE_URL（包含 /api 路径），
  // 否则使用 VITE_API_BASE 并追加 `/api`，最后回退到本地默认值。
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/api` : "http://localhost:8080/api"),
  APP_NAME: import.meta.env.VITE_APP_NAME || "App",
  DEBUG: import.meta.env.VITE_DEBUG === "true",
} as const;

// API 端点
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${ENV.API_BASE_URL}/auth/login`,
    LOGOUT: `${ENV.API_BASE_URL}/auth/logout`,
    REGISTER: `${ENV.API_BASE_URL}/auth/register`,
    REFRESH: `${ENV.API_BASE_URL}/auth/refresh`,
  },
  USER: {
    PROFILE: `${ENV.API_BASE_URL}/user/profile`,
    UPDATE: `${ENV.API_BASE_URL}/user/update`,
  },
  PUNCH: {
    TOGGLE: `${ENV.API_BASE_URL}/punch/toggle`,
    LIST: `${ENV.API_BASE_URL}/punch/list`,
    MONTHLY: `${ENV.API_BASE_URL}/punch/monthly`,
  },
  TASK: {
    LIST: `${ENV.API_BASE_URL}/task/list`,
    CREATE: `${ENV.API_BASE_URL}/task/create`,
    UPDATE: (id: string) => `${ENV.API_BASE_URL}/task/${id}`,
    DELETE: (id: string) => `${ENV.API_BASE_URL}/task/${id}`,
    TICK: (id: string) => `${ENV.API_BASE_URL}/task/${id}/tick`,
  },
  STUDY: {
    START: `${ENV.API_BASE_URL}/study/start`,
    STOP: `${ENV.API_BASE_URL}/study/stop`,
    RECORD: `${ENV.API_BASE_URL}/study/record`,
  },
} as const;

// 本地存储键
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_INFO: "userInfo",
  THEME: "theme",
} as const;

// 路由常量
export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  FLAG: "/flag",
} as const;

// 错误配置
import { AlertCircle, ServerCrash, ShieldAlert, Wifi } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FlagLabel, FlagPriority } from "../types/types";

// Flag 标签配置
export const FLAG_LABELS: Record<FlagLabel, { name: string; color: string }> = {
  1: { name: '学习提升', color: '#2563eb' }, // 蓝色
  2: { name: '健康运动', color: '#10b981' }, // 绿色
  3: { name: '工作效率', color: '#f59e0b' }, // 黄色
  4: { name: '兴趣爱好', color: '#8b5cf6' }, // 紫色
  5: { name: '生活习惯', color: '#ef4444' }, // 红色
} as const;

// Flag 优先级配置 (数字越小优先级越高)
export const FLAG_PRIORITIES: Record<FlagPriority, string> = {
  4: '不急',
  3: '一般',
  2: '较急',
  1: '急切',
} as const;

export interface ErrorConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  actionText?: string;
  actionPath?: string;
}

export type ErrorType = 401 | 404 | 500 | 'network';

export const ERROR_CONFIG: Record<ErrorType, ErrorConfig> = {
  401: {
    icon: ShieldAlert,
    title: "未授权",
    description: "您需要登录才能访问",
    color: "text-yellow-500",
    actionText: "去登录",
    actionPath: "/auth",
  },
  404: {
    icon: AlertCircle,
    title: "页面未找到",
    description: "抱歉，您访问的页面不存在",
    color: "text-blue-500",
  },
  500: {
    icon: ServerCrash,
    title: "服务器错误",
    description: "服务器遇到了问题，请稍后再试",
    color: "text-red-600",
  },
  network: {
    icon: Wifi,
    title: "网络错误",
    description: "无法连接到服务器，请检查网络连接",
    color: "text-slate-500",
  },
} as const;

// ========== 分页配置 ==========
// 社交页面每页帖子数量
export const POSTS_PER_PAGE = 15;

// ========== 用户头像预设 ==========
// 所有预设头像必须从 assets/head 目录中选择
export const PRESET_AVATARS = [
  '/assets/head/screenshot_20251114_131601.png',
  '/assets/head/screenshot_20251114_131629.png',
  '/assets/head/screenshot_20251114_131937.png',
  '/assets/head/screenshot_20251114_131951.png',
  '/assets/head/screenshot_20251114_132014.png',
  '/assets/head/screenshot_20251114_133459.png',
  '/assets/head/微信图片_20251115203432_32_227.jpg',
  '/assets/head/微信图片_20251115203433_33_227.jpg',
  '/assets/head/微信图片_20251115203434_34_227.jpg',
  '/assets/head/微信图片_20251115203434_35_227.jpg',
  '/assets/head/微信图片_20251115203435_36_227.jpg',
  '/assets/head/微信图片_20251115203436_37_227.jpg',
  '/assets/head/微信图片_20251116131024_45_227.jpg',
  '/assets/head/微信图片_20251116131024_46_227.jpg',
  '/assets/head/微信图片_20251116131025_47_227.jpg',
  '/assets/head/微信图片_20251116131026_48_227.jpg',
  '/assets/head/微信图片_20251116131027_49_227.jpg',
  '/assets/head/微信图片_20251116131028_50_227.jpg',
  '/assets/head/微信图片_20251116131029_51_227.jpg',
  '/assets/head/微信图片_20251116131030_52_227.jpg',
  '/assets/head/微信图片_20251116131031_53_227.jpg',
] as const;

// 默认头像索引（如果用户没有设置头像）
export const DEFAULT_AVATAR_INDEX = 0;
