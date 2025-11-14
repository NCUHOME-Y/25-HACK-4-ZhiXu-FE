import { api } from './apiClient';
import type { User } from '../lib/types/types';

class AuthService {
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  // P1修复：调用后端获取用户信息
  async getCurrentUser(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }
    try {
      const response = await api.get<{ username: string; phone: string; id: number }>('/api/getUser');
      return {
        id: String(response.id),
        name: response.username,
        phone: response.phone,
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  // P1修复：调用后端登录API
  async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const response = await api.post<{ token: string; user_id: number; name: string; email: string }>(
      '/api/login',
      credentials
    );
    const user: User = {
      id: String(response.user_id),
      name: response.name,
      phone: response.email,
    };
    localStorage.setItem('auth_token', response.token);
    return { user, token: response.token };
  }

  // P1修复：调用后端注册API
  async register(data: { username: string; email: string; password: string; code?: string }): Promise<{ user: User; token: string }> {
    const response = await api.post<{ token: string; user: { id: number; username: string; phone: string } }>(
      '/api/register',
      data
    );
    const user: User = {
      id: String(response.user.id),
      name: response.user.username,
      phone: response.user.phone,
    };
    localStorage.setItem('auth_token', response.token);
    return { user, token: response.token };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // P1修复：发送邮箱验证码
  async sendEmailCode(email: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.post('/api/sendEmailCode', { email });
      return { success: true, message: '验证码已发送' };
    } catch (error) {
      console.error('发送验证码失败:', error);
      return { success: false, message: '发送失败，请重试' };
    }
  }

  // P1修复：忘记密码（通过邮箱验证码重置）
  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.post('/api/forgetcode', { email, code, new_password: newPassword });
      return { success: true, message: '密码重置成功' };
    } catch (error) {
      console.error('密码重置失败:', error);
      return { success: false, message: '重置失败，请检查验证码' };
    }
  }
}

export const authService = new AuthService();
export default authService;
