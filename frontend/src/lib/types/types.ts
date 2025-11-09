// 必要的全局类型定义（精简版）

// 用户相关
export interface User { id: string; name: string; phone: string }

// 认证相关
export interface LoginCredentials { phone: string; password: string }
export interface RegisterData { name: string; phone: string; password: string }
export interface OTPVerifyData { phone: string; code: string }
export interface AuthResponse { token: string; user: User }

// 通用 API 响应（保持轻量）
export interface ApiResponse<T = unknown> { success: boolean; data?: T; message?: string; error?: string }

// 任务类型（全局使用）
export interface Task {
  id: string
  title: string
  detail?: string
  total?: number
  count?: number
  completed?: boolean
}
