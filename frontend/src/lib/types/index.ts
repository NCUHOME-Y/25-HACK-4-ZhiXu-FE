// 用户相关类型
export interface User {
  id: string;
  name: string;
  phone: string;
}

// 认证相关类型
export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phone: string;
  password: string;
}

export interface OTPVerifyData {
  phone: string;
  code: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 表单错误类型
export interface FormErrors {
  [key: string]: string;
}
