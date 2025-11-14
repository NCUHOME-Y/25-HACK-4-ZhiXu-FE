import apiClient from './apiClient';

/**
 * 系统设置服务
 * 处理通知设置、密码修改等功能
 */

// ========== 通知设置 ==========

/**
 * 更新通知开关状态
 * P1修复：调用后端/api/updateRemindStatus
 */
export const updateNotificationEnabled = async (enabled: boolean): Promise<void> => {
  const { api } = await import('./apiClient');
  await api.put('/api/updateRemindStatus', { status: enabled });
};

/**
 * 更新通知时间
 * P1修复：调用后端/api/updateRemindTime
 */
export const updateNotificationTime = async (hour: string, minute: string): Promise<void> => {
  const { api } = await import('./apiClient');
  await api.put('/api/updateRemindTime', { 
    time_remind: parseInt(hour), 
    min_remind: parseInt(minute) 
  });
};

// ========== 密码管理 ==========

/**
 * 修改密码
 * P1修复：调用后端/updatePassword
 */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  const { api } = await import('./apiClient');
  await api.put('/updatePassword', { old_password: oldPassword, new_password: newPassword });
};

// ========== 用户资料 ==========

/**
 * 更新用户资料
 */
export const updateProfile = async (nickname: string, bio: string, avatar: string): Promise<void> => {
  await apiClient.put('/api/settings/profile', { nickname, bio, avatar });
};

// P1修复：切换头像
export const switchAvatar = async (avatarIndex: number): Promise<void> => {
  const { api } = await import('./apiClient');
  await api.post('/api/swithhead', { number: avatarIndex });
};

export default {
  updateNotificationEnabled,
  updateNotificationTime,
  changePassword,
  updateProfile,
  switchAvatar,
};