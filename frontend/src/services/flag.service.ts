// Flag 页面相关后端 API 占位实现
// 保持全部函数轻量并带有 TODO，后续直接补真实请求即可。

import type { Task, StudyRecord } from "../lib/types/types";

export interface CreateTaskPayload {
  title: string;
  detail?: string;
  total?: number;
  dateRange?: unknown;
}

// 临时占位函数 - 避免重复 void 语句
const mockEndpoint = (_endpoint: string, ..._args: unknown[]) => {};

// ==================== 打卡相关 ====================
/**
 * 获取已打卡日期列表
 * P1修复：调用后端获取打卡记录
 */
export async function fetchPunchDates(): Promise<string[]> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ date: string }[]>('/api/getDakaRecords');
  return response.map(record => record.date);
}

/**
 * 切换今日打卡状态
 * P1修复：调用后端更新打卡
 */
export async function togglePunch(date: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.put('/api/updateDaka', { date });
  return true;
}

// ==================== 任务相关 ====================
/**
 * 获取任务列表
 * P1修复：调用后端获取Flag列表（已统一字段名）
 */
export async function fetchTasks(): Promise<Task[]> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ flags: Task[] }>('/api/getUserFlags');
  return response.flags || [];
}

/**
 * 创建任务
 * P1修复：调用后端创建Flag（已统一字段名）
 */
export async function createTask(payload: CreateTaskPayload & {
  label?: string;
  priority?: number;
  points?: number;
}): Promise<Task> {
  const { api } = await import('./apiClient');
  
  // 将数字label转换为后端期望的字符串类别名称
  const labelMap: Record<string, string> = {
    '1': '生活',
    '2': '学习', 
    '3': '工作',
    '4': '兴趣',
    '5': '运动'
  };
  
  const labelName = labelMap[payload.label || '2'] || '学习';
  
  // 前后端字段已统一，直接发送
  const backendPayload = {
    title: payload.title,
    detail: payload.detail || '',
    is_public: false,
    label: labelName,
    priority: payload.priority || 1,
    total: payload.total || 1,
    points: payload.points || 0,
    start_time: new Date().toISOString(),
    end_time: payload.dateRange || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  const response = await api.post<{ flag: Task }>('/api/addFlag', backendPayload);
  return response.flag;
}

/**
 * 更新任务
 * P1修复：调用后端更新Flag隐藏状态（已统一字段名）
 */
export async function updateTask(id: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.put('/api/updateFlagHide', { id: parseInt(id) });
  return true;
}

/**
 * 任务记一次（增加计数）
 * P1修复：调用后端完成Flag（已统一字段名）
 */
export async function tickTask(id: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.put('/api/doneFlag', { id: parseInt(id) });
  return true;
}

// ==================== 学习计时相关 ====================
/**
 * 开始学习计时
 * P1修复：调用后端添加学习时长
 */
export async function startStudySession(): Promise<StudyRecord> {
  return {
    id: String(Date.now()),
    userId: "local",
    startTime: new Date().toISOString(),
    duration: 0
  };
}

/**
 * 停止学习计时
 * P1修复：调用后端记录学习时长
 */
export async function stopStudySession(_sessionId: string, duration: number): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.post('/api/addLearnTime', { duration });
  return true;
}

// ==================== 积分相关 ====================
/**
 * 完成任务后增加积分
 * TODO: 接入后端 POST /user/points
 */
export async function addUserPoints(taskId: string, points: number): Promise<{ success: boolean; totalPoints: number }> {
  mockEndpoint('/user/points', taskId, points);
  return { success: true, totalPoints: 0 };
}

/**
 * 获取用户总积分
 * TODO: 接入后端 GET /user/points
 */
export async function getUserPoints(): Promise<number> {
  return 0;
}

// P1修复：切换Flag隐藏/公开状态（分享到社交页面）
export async function toggleFlagVisibility(flagId: string, isHidden: boolean): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.put('/api/updateFlagHide', { id: flagId, is_hidden: isHidden });
  return true;
}

// P1修复：获取所有可见的Flag（社交页面显示）
export async function getVisibleFlags(): Promise<any[]> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ flags: any[] }>('/api/getflag');
  return response.flags || [];
}

// P1修复：Flag点赞
export async function likeFlag(flagId: string, likeChange: number): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.post('/api/likeFlag', { flag_id: flagId, like: likeChange });
  return true;
}

// P1修复：获取Flag点赞数
export async function getFlagLikes(flagId: string): Promise<number> {
  const { api } = await import('./apiClient');
  const response = await api.get<{ like: number }>('/api/getflaglike', {
    params: { flag_id: flagId }
  });
  return response.like || 0;
}

// P1修复：发表Flag评论
export async function commentOnFlag(flagId: string, content: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.post('/api/flagcomment', { flag_id: flagId, content });
  return true;
}

// P1修复：删除Flag评论
export async function deleteFlagComment(commentId: string): Promise<boolean> {
  const { api } = await import('./apiClient');
  await api.delete('/api/flagdeletecomment', {
    data: { flagcomment_id: commentId }
  });
  return true;
}
