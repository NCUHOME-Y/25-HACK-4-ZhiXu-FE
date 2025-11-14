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
 * 注意：后端没有统一的profile更新接口，需要分别调用
 */
export const updateUserProfile = async (data: Partial<User>) => {
  // 更新用户名（逐个调用以便捕获具体错误）
  if (data.nickname) {
    try {
      await api.put('/updateUsername', { new_name: data.nickname });
    } catch (error) {
      // 如果是用户名重复错误，抛出具体错误信息
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        throw new Error(axiosError.response?.data?.error || '更新用户名失败');
      }
      throw error;
    }
  }
  
  // 更新头像（如果有avatar且是数字编号）
  if (data.avatar && /^\d+$/.test(data.avatar)) {
    try {
      await api.post('/api/swithhead', { number: parseInt(data.avatar) });
    } catch {
      throw new Error('更新头像失败');
    }
  }
  
  // TODO: bio字段后端暂不支持
  
  return data as User;
};

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

// 获取用户成就/徽章系统（后端已统一格式）
export const getUserAchievements = async (): Promise<{ achievements: Array<{ id: number; name: string; description: string; isUnlocked: boolean }> }> => {
  const response = await api.get<{ 
    achievements: Array<{ 
      id: number; 
      name: string; 
      description: string;
      isUnlocked: boolean;
    }> 
  }>('/api/getUserAchievement');
  
  return { achievements: response.achievements || [] };
};
