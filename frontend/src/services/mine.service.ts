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

// 获取用户成就/徽章系统
// 后端返回格式: {徽章名称: 0或1 }，0=未解锁，1=已解锁
export const getUserAchievements = async (): Promise<{ achievements: Array<{ id: number; name: string; description: string; isUnlocked: boolean }> }> => {
  try {
    const response = await api.get<Record<string, number>>('/api/getUserAchievement');
    
    // 徽章名称映射
    const badgeNames = [
      '新手启程', '坚持不懈', '任务大师', '目标达成', '学习之星',
      '效率达人', '专注大师', '早起鸟', '夜猫子', '完美主义', '全能选手', '待解锁'
    ];
    
    // 转换后端数据格式
    const achievements = Object.entries(response).map(([name, status], index) => ({
      id: index,
      name: badgeNames[index] || name,
      description: `${name}成就`,
      isUnlocked: status === 1
    }));
    
    return { achievements };
  } catch (error) {
    console.error('获取成就失败:', error);
    // 返回默认空数组
    return { achievements: [] };
  }
};
