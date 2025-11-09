// 从环境变量读取（Vite 以 VITE_ 前缀注入）
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
} as const;

// 本地存储键
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_INFO: "userInfo",
  THEME: "theme",
} as const;

// 路由常量（可按需扩展）
export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  FLAG: "/flag",
} as const;
