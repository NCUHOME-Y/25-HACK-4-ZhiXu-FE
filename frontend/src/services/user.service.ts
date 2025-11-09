import apiClient from './apiClient';
import type { User } from '../lib/types/types';

/**
 * 用户服务
 * 提供用户资料相关功能
 */
export const userService = {
  // 获取用户资料
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/user/profile');
    return response.data;
  },

  // 更新用户资料
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/user/profile', data);
    return response.data;
  },
};
