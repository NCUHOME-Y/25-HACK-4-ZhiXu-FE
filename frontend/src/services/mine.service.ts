import { api } from './apiClient';
import type { User } from '../lib/types/types';

/**
 * 个人中心服务
 * 处理用户个人信息、设置等相关功能（与 /user 相关的 API）
 */

/**
 * 获取用户个人信息
 */
export const getUserProfile = () =>
  api.get<User>('/user/profile');

/**
 * 更新用户个人信息
 */
export const updateUserProfile = (data: Partial<User>) =>
  api.put<User>('/user/profile', data);

/**
 * 修改密码
 */
export const changePassword = (oldPassword: string, newPassword: string) =>
  api.post('/user/change-password', {
    oldPassword,
    newPassword,
  });

/**
 * 退出登录
 */
export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // 即使接口失败，也清除本地信息
  }

  // 清除本地存储
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');

  return { success: true };
}
