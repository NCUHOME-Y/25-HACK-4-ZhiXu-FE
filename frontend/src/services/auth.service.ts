import apiClient from './apiClient';
import type { AuthResponse } from '../lib/types';

//认证服务
//提供用户登录、注册、OTP验证等功能

export const authService = {
  // 用户登录
  login: async (phone: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { phone, password });
    localStorage.setItem('authToken', response.data.token);
    return response.data;
  },

  // 用户注册
  register: async (name: string, phone: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', { name, phone, password });
    localStorage.setItem('authToken', response.data.token);
    return response.data;
  },

  // 发送OTP验证码
  sendOTP: async (phone: string): Promise<void> => {
    await apiClient.post('/auth/send-otp', { phone });
  },

  // 验证OTP验证码
  verifyOTP: async (phone: string, code: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', { phone, code });
    localStorage.setItem('authToken', response.data.token);
    return response.data;
  },

  // 用户登出
  logout: (): void => {
    localStorage.removeItem('authToken');
  },

  // 检查用户是否已认证
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('authToken');
  },
};
