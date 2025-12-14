import { api } from './apiClient';
import type { User } from '../lib/types/types';

class AuthService {
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return false;
    }
    
    // 基本的token格式验证（JWT通常是三部分用.分隔）
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Token格式无效，清除token');
      localStorage.removeItem('auth_token');
      return false;
    }
    
    return true;
  }

  /** 获取当前用户信息 */
  async getCurrentUser(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }
    try {
      const response = await api.get<{ user: { user_id: number; name: string; email: string } }>('/api/getUser');
      return {
        id: String(response.user.user_id),
        name: response.user.name,
        phone: response.user.email,
      };
    } catch (error: unknown) {
      // 401 错误会被 apiClient 拦截器处理,这里只处理其他错误
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status !== 401) {
        console.error('获取用户信息失败:', error);
      }
      return null;
    }
  }

  /** 用户登录 */
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

  /** 用户注册 */
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

  /** 发送邮箱验证码 */
  async sendEmailCode(email: string): Promise<{ success: boolean; message: string; waitSeconds?: number }> {
    try {
      await api.post('/api/sendEmailCode', { email });
      return { success: true, message: '验证码已发送' };
    } catch (error) {
      console.error('发送验证码失败:', error);
      // 获取后端返回的具体错误信息
      let errorMessage = '发送失败，请重试';
      let waitSeconds: number | undefined;
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string; wait_seconds?: number; message?: string } } };
        
        // 处理429错误（频率限制）
        if (axiosError.response?.status === 429) {
          waitSeconds = axiosError.response.data?.wait_seconds;
          errorMessage = axiosError.response.data?.message || `发送过于频繁，请等待${waitSeconds}秒后重试`;
        } else {
          errorMessage = axiosError.response?.data?.error || errorMessage;
        }
      }
      return { success: false, message: errorMessage, waitSeconds };
    }
  }

  /** 忘记密码 - 通过邮箱验证码重置 */
  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      await api.post('/api/forgetcode', { email, code, new_password: newPassword });
      return { success: true, message: '密码重置成功' };
    } catch (error) {
      console.error('密码重置失败:', error);
      // 获取后端返回的具体错误信息
      let errorMessage = '重置失败，请检查验证码';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        errorMessage = axiosError.response?.data?.error || errorMessage;
      }
      return { success: false, message: errorMessage };
    }
  }

  /** 验证码登录 */
  async loginWithOTP(email: string, code: string): Promise<{ user: User; token: string }> {
    const response = await api.post<{ token: string; user_id: number; name: string; email: string }>(
      '/api/loginWithOTP',
      { email, code }
    );
    
    const user: User = {
      id: String(response.user_id),
      name: response.name,
      phone: response.email,
    };
    
    localStorage.setItem('auth_token', response.token);
    return { user, token: response.token };
  }

  /** 验证邮箱 */
  async verifyEmail(email: string, code: string): Promise<{ user: User; token: string }> {
    const response = await api.post<{ 
      success: boolean; 
      token: string; 
      user_id: number; 
      name: string; 
      email: string 
    }>('/api/verifyEmail', { email, code });
    
    const user: User = {
      id: String(response.user_id),
      name: response.name,
      phone: response.email,
    };
    
    localStorage.setItem('auth_token', response.token);
    return { user, token: response.token };
  }

  /** 完成注册 */
  async completeRegistration(data: { name: string; email: string; password: string; code: string }): Promise<{ user: User; token: string }> {
    const response = await api.post<{ 
      token: string; 
      user_id: number; 
      name: string; 
      email: string 
    }>('/api/completeRegistration', data);
    
    const user: User = {
      id: String(response.user_id),
      name: response.name,
      phone: response.email,
    };
    
    localStorage.setItem('auth_token', response.token);
    return { user, token: response.token };
  }
}

export const authService = new AuthService();
export default authService;
