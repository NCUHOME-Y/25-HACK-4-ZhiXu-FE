import apiClient from './apiClient';

/**
 * 系统设置服务
 * 处理通知设置、密码修改等功能
 */

// ========== 通知设置 ==========

/**
 * 更新通知开关状态
 */
export const updateNotificationEnabled = async (enabled: boolean): Promise<void> => {
  await apiClient.put('/api/settings/notification', { enabled });
};

/**
 * 更新通知时间
 */
export const updateNotificationTime = async (hour: string, minute: string): Promise<void> => {
  await apiClient.put('/api/settings/notification-time', { hour, minute });
};

// ========== 密码管理 ==========

/**
 * 修改密码
 */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  await apiClient.put('/api/settings/password', { old_password: oldPassword, new_password: newPassword });
};

// ========== 用户资料 ==========

/**
 * 更新用户资料
 */
export const updateProfile = async (nickname: string, bio: string, avatar: string): Promise<void> => {
  await apiClient.put('/api/settings/profile', { nickname, bio, avatar });
};

export default {
  updateNotificationEnabled,
  updateNotificationTime,
  changePassword,
  updateProfile,
};