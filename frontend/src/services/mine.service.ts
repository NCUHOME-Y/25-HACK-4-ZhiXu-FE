import apiClient from './apiClient';
import type { User } from '../lib/types/types';

/**
 * 个人中心服务
 * 处理用户个人信息、设置等相关功能（与 /user 相关的 API）
 */

/**
 * 获取用户个人信息
 */
export async function getUserProfile(): Promise<User> {
  // TODO: 接入后端 API
  const response = await apiClient.get<User>('/user/profile');
  return response.data;
}

/**
 * 更新用户个人信息
 */
export async function updateUserProfile(data: Partial<User>): Promise<User> {
  // TODO: 接入后端 API
  const response = await apiClient.put<User>('/user/profile', data);
  return response.data;
}

/**
 * 修改密码
 */
export async function changePassword(oldPassword: string, newPassword: string) {
  // TODO: 接入后端 API
  const response = await apiClient.post('/user/change-password', {
    oldPassword,
    newPassword,
  });
  return response.data;
}

/**
 * 退出登录
 */
export async function logout() {
  // TODO: 接入后端 API
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // 即使接口失败，也清除本地信息
  }

  // 清除本地存储
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');

  return { success: true };
}
