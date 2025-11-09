import type { User } from '../lib/types/types';

class AuthService {
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.isAuthenticated()) {
      return {
        id: '1',
        name: 'Demo User',
        phone: '13800138000',
      };
    }
    return null;
  }

  async login(credentials: { username: string; password: string }): Promise<{ user: User; token: string }> {
    const mockToken = 'mock_jwt_token_' + Date.now();
    const mockUser: User = {
      id: '1',
      name: credentials.username,
      phone: '13800138000',
    };
    localStorage.setItem('auth_token', mockToken);
    return { user: mockUser, token: mockToken };
  }

  async register(data: { username: string; email: string; password: string }): Promise<{ user: User; token: string }> {
    const mockToken = 'mock_jwt_token_' + Date.now();
    const mockUser: User = {
      id: String(Date.now()),
      name: data.username,
      phone: '13800138000',
    };
    localStorage.setItem('auth_token', mockToken);
    return { user: mockUser, token: mockToken };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();
export default authService;
