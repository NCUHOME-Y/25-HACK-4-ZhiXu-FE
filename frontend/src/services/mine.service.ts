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
export const updateUserProfile = async (data: Partial<User> & { originalNickname?: string }) => {
  // 更新用户名(只在用户名实际改变时调用,避免重复错误导致无法只改头像)
  if (data.nickname && data.nickname !== data.originalNickname) {
    try {
      console.log('[updateUserProfile] 更新用户名:', { old: data.originalNickname, new: data.nickname });
      await api.put('/updateUsername', { new_name: data.nickname });
      console.log('[updateUserProfile] 用户名更新成功');
    } catch (error) {
      console.error('[updateUserProfile] 更新用户名失败:', error);
      // 正确处理Axios错误，提取后端返回的错误信息
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } };
        console.log('[updateUserProfile] 后端响应状态:', axiosError.response?.status);
        console.log('[updateUserProfile] 后端响应数据:', axiosError.response?.data);
        
        // 尝试提取错误信息
        const responseData = axiosError.response?.data;
        if (responseData && typeof responseData === 'object') {
          const errorData = responseData as { error?: string; message?: string };
          const errorMsg = errorData.error || errorData.message;
          if (errorMsg) {
            console.error('[updateUserProfile] 后端错误信息:', errorMsg);
            throw new Error(errorMsg);
          }
        }
      }
      // 如果无法提取具体错误信息，抛出通用错误
      throw new Error('更新用户名失败，请稍后重试');
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
// 后端返回格式: { message: string, achievements: Array<{id, name, description, isUnlocked}> }
export const getUserAchievements = async (): Promise<{ achievements: Array<{ id: number; name: string; description: string; isUnlocked: boolean }> }> => {
  try {
    const response = await api.get<{ message: string; achievements: Array<{ id: number; name: string; description: string; isUnlocked: boolean }> }>('/api/getUserAchievement');
    
    console.log('🏆 获取成就数据:', response);
    
    // 后端返回的就是正确格式的数组
    if (response.achievements && Array.isArray(response.achievements)) {
      return { achievements: response.achievements };
    }
    
    // 如果格式不对，返回空数组
    console.warn('成就数据格式不正确:', response);
    return { achievements: [] };
  } catch (error) {
    console.error('获取成就失败:', error);
    // 返回默认空数组
    return { achievements: [] };
  }
};
