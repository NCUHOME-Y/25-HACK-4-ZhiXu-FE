import apiClient from './apiClient';

/** 系统设置服务 */

/** 更新通知开关状态 */
export const updateNotificationEnabled = async (enabled: boolean): Promise<void> => {
  const { api } = await import('./apiClient');
  // 该接口用于更新“学习提醒”开关（向后兼容）
  await api.put('/api/updateRemindStatus', { status: enabled });
};

/** 更新用户级 Flag 提醒开关 */
export const updateFlagNotificationEnabled = async (enabled: boolean): Promise<void> => {
  const { api } = await import('./apiClient');
  await api.put('/api/updateFlagRemindStatus', { status: enabled });
};

/** 更新通知时间 */
export const updateNotificationTime = async (hour: string, minute: string): Promise<void> => {
  const { api } = await import('./apiClient');
  await api.put('/api/updateRemindTime', { 
    time_remind: parseInt(hour), 
    min_remind: parseInt(minute) 
  });
};

/** 修改密码 */
export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  const { api } = await import('./apiClient');
  await api.put('/updatePassword', { old_password: oldPassword, new_password: newPassword });
};

/** 更新用户资料 */
export const updateProfile = async (nickname: string, bio: string, avatar: string): Promise<void> => {
  await apiClient.put('/api/settings/profile', { nickname, bio, avatar });
};

/** 切换头像 */
export const switchAvatar = async (avatarIndex: number): Promise<void> => {
  const { api } = await import('./apiClient');
  try {
    await api.post('/api/swithhead', { number: avatarIndex });
  } catch (error: unknown) {
    console.error('❌ 头像切换失败:', {
      status: (error as { response?: { status?: number } })?.response?.status,
      data: (error as { response?: { data?: unknown } })?.response?.data,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
};

export default {
  updateNotificationEnabled,
  updateFlagNotificationEnabled,
  updateNotificationTime,
  changePassword,
  updateProfile,
  switchAvatar,
};