/** Flag 相关服务 */

import type { Task, StudyRecord } from "../lib/types/types";

// 后端返回的 flag 扩展字段
export interface BackendFlag extends Task {
  start_time?: string;
  end_time?: string;
  is_public?: boolean;
}

export interface CreateTaskPayload {
  title: string;
  detail?: string;
  total?: number;
  dateRange?: unknown;
  reminderTime?: string;
  enableNotification?: boolean;
}

/** 获取已打卡日期列表 */
export async function fetchPunchDates(): Promise<string[]> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ date: string }[]>('/api/getDakaRecords');
  if (!response || !Array.isArray(response)) {
    return [];
  }
  return response.map(record => record.date);
}

/** 切换今日打卡状态 */
export async function togglePunch(date: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.put('/api/updateDaka', { date });
  return true;
}

/** 获取任务列表 */
export async function fetchTasks(): Promise<Task[]> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ flags: Task[] }>('/api/getUserFlags');
  
  // 映射后端字段到前端字段
  const flags = (response.flags || []).map(flag => {
    const backendFlag = flag as BackendFlag & { enable_notification?: boolean; reminder_time?: string };
    const mapped = {
      ...flag,
      startDate: backendFlag.start_time && backendFlag.start_time !== '0001-01-01T00:00:00Z' ? backendFlag.start_time : '',
      endDate: backendFlag.end_time && backendFlag.end_time !== '0001-01-01T00:00:00Z' ? backendFlag.end_time : '',
      isPublic: backendFlag.is_public ?? flag.isPublic ?? false,  // 确保从后端正确读取 is_public
      enableNotification: backendFlag.enable_notification ?? flag.enableNotification ?? false,  // 映射 enable_notification
      reminderTime: backendFlag.reminder_time ?? flag.reminderTime ?? '12:00'  // 映射 reminder_time
    };
    
    return mapped;
  });
  return flags;
}

/** 创建任务 */
export async function createTask(payload: CreateTaskPayload & {
  label?: number | string;
  priority?: number;
  points?: number;
  dailyLimit?: number;     // 每日完成次数限制
  startDate?: string;      // 开始日期
  endDate?: string;        // 结束日期
  isRecurring?: boolean;   // 是否循环任务
}): Promise<Task> {
  const { api } = await import('./apiClient');
  
  // 统一转换label为数字类型（1-5）
  let labelNum: number;
  if (typeof payload.label === 'number') {
    labelNum = payload.label;
  } else if (typeof payload.label === 'string') {
    labelNum = parseInt(payload.label) || 1;
  } else {
    labelNum = 1; // 默认为学习类
  }
  
  // 确保label在有效范围内
  if (labelNum < 1 || labelNum > 5) {
    console.warn(`Invalid label: ${labelNum}, defaulting to 1`);
    labelNum = 1;
  }
  
  // 确保priority在有效范围内
  const priorityNum = payload.priority && payload.priority >= 1 && payload.priority <= 4 
    ? payload.priority 
    : 3; // 默认为一般
  
  // 前后端字段已统一，直接发送
  // 日期格式转换：YYYY-MM-DD -> RFC3339 (如果有值)
  let startTimeISO = '';
  let endTimeISO = '';
  
  if (payload.startDate) {
    const startDate = new Date(payload.startDate);
    startDate.setHours(0, 0, 0, 0);
    startTimeISO = startDate.toISOString();
  }
  
  if (payload.endDate) {
    const endDate = new Date(payload.endDate);
    endDate.setHours(23, 59, 59, 999);
    endTimeISO = endDate.toISOString();
  }
  
  const backendPayload = {
    title: payload.title || '未命名任务',
    detail: payload.detail || '',
    is_public: false,
    label: labelNum,
    priority: priorityNum,
    total: payload.total && payload.total > 0 ? payload.total : 1, // 每日所需完成次数
    points: payload.points || 0,
    daily_limit: payload.dailyLimit || 1,
    is_recurring: payload.isRecurring || false,
    start_time: startTimeISO,
    end_time: endTimeISO,
    reminder_time: payload.reminderTime || '12:00',
    enable_notification: payload.enableNotification || false,
  };
  
  try {
    const response = await api.post<{ flag: Task }>('/api/addFlag', backendPayload);
    return response.flag;
  } catch (error) {
    console.error('❌ 创建Flag失败:', error);
    throw error;
  }
}

/** 更新任务 */
export async function updateTask(id: string, taskData: {
  title: string;
  detail: string;
  label: number;
  priority: number;
  total: number; // 每日所需完成次数
  isPublic: boolean;
  startDate?: string;
  endDate?: string;
  reminderTime?: string;
  enableNotification?: boolean;
}): Promise<boolean> {
  const { api } = await import('./apiClient');
  
  const updatePayload = { 
    id: parseInt(id),
    title: taskData.title,
    detail: taskData.detail || '',
    label: taskData.label || 2,
    priority: taskData.priority || 3,
    total: taskData.total || 1,
    is_public: taskData.isPublic,
    start_date: taskData.startDate || '',
    end_date: taskData.endDate || '',
    reminder_time: taskData.reminderTime || '12:00',
    enable_notification: taskData.enableNotification || false
  };
  
  await api.put('/api/updateFlag', updatePayload);
  
  return true;
}

/** 删除任务 */
export async function deleteTask(id: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  try {
    await api.delete('/api/deleteFlag', {
      data: { id: parseInt(id) }
    });
    return true;
  } catch (error) {
    console.error('❌ 删除Flag失败:', error);
    throw error;
  }
}

/** 任务记一次 - 增加计数 */
export async function tickTask(id: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  try {
    await api.put('/api/doneFlag', { id: parseInt(id) });
    return true;
  } catch (error: unknown) {
    console.error('❌ Flag打卡失败:', {
      status: (error as { response?: { status?: number; data?: unknown } })?.response?.status,
      data: (error as { response?: { data?: unknown } })?.response?.data,
      message: error instanceof Error ? error.message : String(error),
      id
    });
    throw error;
  }
}

/** 开始学习计时 */
export async function startStudySession(): Promise<StudyRecord> {
  return {
    id: String(Date.now()),
    userId: "local",
    startTime: new Date().toISOString(),
    duration: 0
  };
}

/** 停止学习计时 */
export async function stopStudySession(_sessionId: string, duration: number): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.post('/api/addLearnTime', { duration });
  
  // 🔧 新增：刷新用户数据
  try {
    const { useTaskStore } = await import('../lib/stores/stores');
    const [, todayData] = await Promise.all([
      api.get<{ month_learn_time: number; count: number }>('/api/getUser'),
      api.get<{ today_learn_time: number }>('/api/getTodayLearnTime')
    ]);
    
    // 🐛 修复：后端返回的 today_learn_time 已经是秒，不需要乘 60
    const todayTime = todayData.today_learn_time || 0; // 单位：秒
    useTaskStore.setState({
      dailyElapsed: todayTime, // 直接使用，不要转换
    });
  } catch (error) {
    console.error('刷新用户数据失败:', error);
  }
  
  return true;
}

/** 添加用户积分 */
export async function addUserPoints(taskId: string, points: number): Promise<{ success: boolean; totalPoints: number }> {
  const { api } = await import('./apiClient');
  // 在外部声明以便 catch 中也能访问（用于日志）
  const pointsValue = typeof points === 'number' ? points : parseInt(String(points));
  if (isNaN(pointsValue) || pointsValue <= 0) {
    throw new Error(`无效的积分值: ${points}`);
  }

  try {
    const response = await api.put<{ message: string; count: number }>('/api/addPoints', {
      points: pointsValue
    });

    return { success: true, totalPoints: response.count || 0 };
  } catch (error: unknown) {
    // 详细的错误日志和提示
    const errorDetails = {
      status: (error as { response?: { status?: number; statusText?: string; data?: unknown } })?.response?.status,
      statusText: (error as { response?: { statusText?: string } })?.response?.statusText,
      data: (error as { response?: { data?: unknown } })?.response?.data,
      message: error instanceof Error ? error.message : String(error),
      taskId,
      points: pointsValue,
      url: '/api/addPoints',
      method: 'PUT'
    };

    console.error('❌ 添加积分失败 - 详细信息:', errorDetails);

    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 400) {
      throw new Error('参数错误：请检查积分值是否有效');
    } else if (status === 401) {
      throw new Error('未登录或登录已过期，请重新登录');
    } else if (status === 404) {
      throw new Error('接口不存在：/api/addPoints');
    } else if (status === 500) {
      throw new Error('服务器错误：积分添加失败');
    }

    throw error;
  }
}

/** 获取用户总积分 */
export async function getUserPoints(): Promise<number> {
  try {
    const { api } = await import('./apiClient');
    const response = await api.get<{ points: number }>('/api/getPoints');
    return response.points || 0;
  } catch (error) {
    console.error('获取积分失败:', error);
    return 0;
  }
}

/** 切换 Flag 隐藏/公开状态 */
export async function toggleFlagVisibility(flagId: string, _isHidden: boolean): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.put('/api/updateFlagHide', { id: parseInt(flagId) });
  return true;
}

/** 获取所有可见的 Flag */
export async function getVisibleFlags(): Promise<BackendFlag[]> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ flags: BackendFlag[] }>('/api/getflag');
  return response.flags || [];
}

/** Flag 点赞 */
export async function likeFlag(flagId: string, likeChange: number): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.post('/api/likeFlag', { flag_id: flagId, like: likeChange });
  return true;
}

/** 获取 Flag 点赞数 */
export async function getFlagLikes(flagId: string): Promise<number> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ like: number }>('/api/getflaglike', {
    params: { flag_id: flagId }
  });
  return response.like || 0;
}

/** 发表 Flag 评论 */
export async function commentOnFlag(flagId: string, content: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.post('/api/flagcomment', { flag_id: flagId, content });
  return true;
}

/** 删除 Flag 评论 */
export async function deleteFlagComment(commentId: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.delete('/api/flagdeletecomment', {
    data: { flagcomment_id: commentId }
  });
  return true;
}

/** 获取有日期的 flag - 用于日历高亮 */
export async function fetchFlagsWithDates(): Promise<Task[]> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ flags: BackendFlag[] }>('/api/flags/with-dates');
  // 映射后端字段到前端字段
  const flags = (response.flags || []).map(flag => ({
    ...flag,
    startDate: (flag as BackendFlag).start_time && (flag as BackendFlag).start_time !== '0001-01-01T00:00:00Z' ? (flag as BackendFlag).start_time : '',
    endDate: (flag as BackendFlag).end_time && (flag as BackendFlag).end_time !== '0001-01-01T00:00:00Z' ? (flag as BackendFlag).end_time : '',
  }));
  return flags;
}

/** 获取预设 flag - 未到起始日期 */
export async function fetchPresetFlags(): Promise<Task[]> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ flags: BackendFlag[] }>('/api/flags/preset');
  // 映射后端字段到前端字段
  const flags = (response.flags || []).map(flag => ({
    ...flag,
    startDate: (flag as BackendFlag).start_time && (flag as BackendFlag).start_time !== '0001-01-01T00:00:00Z' ? (flag as BackendFlag).start_time : '',
    endDate: (flag as BackendFlag).end_time && (flag as BackendFlag).end_time !== '0001-01-01T00:00:00Z' ? (flag as BackendFlag).end_time : '',
  }));
  return flags;
}

/** 获取过期 flag */
export async function fetchExpiredFlags(): Promise<Task[]> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ flags: BackendFlag[] }>('/api/flags/expired');
  // 映射后端字段到前端字段
  const flags = (response.flags || []).map(flag => ({
    ...flag,
    startDate: (flag as BackendFlag).start_time && (flag as BackendFlag).start_time !== '0001-01-01T00:00:00Z' ? (flag as BackendFlag).start_time : '',
    endDate: (flag as BackendFlag).end_time && (flag as BackendFlag).end_time !== '0001-01-01T00:00:00Z' ? (flag as BackendFlag).end_time : '',
  }));
  return flags;
}

/** 切换 flag 提醒状态 - 最多 5 个 */
export async function toggleFlagNotification(flagId: string, enableNotification: boolean): Promise<{ success: boolean; enable_notification: boolean }> {
  const { api } = await import('./apiClient');
  const response = await api.post<{ success: boolean; enable_notification: boolean }>('/api/toggleFlagNotification', {
    flag_id: parseInt(flagId),
    enable_notification: enableNotification
  });
  return response;
}
