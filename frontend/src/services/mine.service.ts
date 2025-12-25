import { api } from './apiClient';
import type { User } from '../lib/types/types';

/** 个人中心服务 */

/** 获取用户个人信息 */
export const getUserProfile = () =>
  api.get<User>('/user/profile');

/** 更新用户个人信息 */
export const updateUserProfile = async (data: Partial<User> & { originalNickname?: string }) => {
  if (data.nickname && data.nickname !== data.originalNickname) {
    try {
      await api.put('/api/updateUsername', { new_name: data.nickname });
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userObj.name = data.nickname;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
    } catch (error) {
      console.error('[updateUserProfile] 更新用户名失败', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown; status?: number } };
        
        console.error('后端响应状态码:', axiosError.response?.status);
        
        const responseData = axiosError.response?.data;
        
        if (typeof responseData === 'string' && (
          responseData.toLowerCase().includes('<!doctype html>') || 
          responseData.includes('<html') ||
          responseData.includes('<body>')
        )) {
          console.error('后端API未正确配置，返回了HTML页面而不是JSON');
          console.error('HTML响应预览:', responseData.substring(0, 200) + '...');
          throw new Error('服务器配置错误，请联系管理员（API路由未正确配置）');
        }
        
        console.error('后端响应完整数据:', JSON.stringify(responseData, null, 2));
        
        if (responseData && typeof responseData === 'object') {
          const errorData = responseData as { error?: string; message?: string };
          const errorMsg = errorData.error || errorData.message;
          
          console.error('提取的后端错误信息:', errorMsg);
          
          if (errorMsg) {
            throw new Error(`更新用户名失败: ${errorMsg}`);
          }
        }
      }
      
      console.warn('无法提取后端错误信息，使用通用错误');
      throw new Error('更新用户名失败，请稍后重试');
    }
  }
  
  if (data.avatar && /^\d+$/.test(data.avatar)) {
    try {
      const number = parseInt(data.avatar);
      // 使用统一的switchAvatar服务
      const { switchAvatar } = await import('./set.service');
      await switchAvatar(number);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userObj.avatar = `/api/avatar/${number}`;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
    } catch {
      throw new Error('更新头像失败');
    }
  }
  
  // bio字段后端暂不支持
  
  return data as User;
};

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
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');

  return { success: true };
}

// 获取用户成就/徽章系统
// 后端返回格式: { message: string, achievements: Array<{id, name, description, isUnlocked}> }
export const getUserAchievements = async (): Promise<{ achievements: Array<{ id: number; name: string; description: string; isUnlocked: boolean }> }> => {
  try {
    const response = await api.get<{ message: string; achievements: Array<{ id: number; name: string; description: string; isUnlocked: boolean }> }>('/api/getUserAchievement');
    
    // 后端返回的就是正确格式的数组
    if (response.achievements && Array.isArray(response.achievements)) {
      return { achievements: response.achievements };
    }
    
    // 如果格式不对，返回空数组
    console.warn('成就数据格式不正确', response);
    return { achievements: [] };
  } catch (error) {
    console.error('获取成就失败:', error);
    // 返回默认空数组
    return { achievements: [] };
  }
};
