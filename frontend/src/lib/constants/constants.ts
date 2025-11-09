// 环境变量
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
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
