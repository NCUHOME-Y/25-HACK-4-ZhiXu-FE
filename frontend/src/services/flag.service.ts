// Flag 页面相关后端 API 占位实现
// 保持全部函数轻量并带有 TODO，后续直接补真实请求即可。

import { API_ENDPOINTS } from "../lib/constants/constants";
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
 * TODO: 接入后端 GET /punch/list
 */
export async function fetchPunchDates(): Promise<string[]> {
  mockEndpoint(API_ENDPOINTS.PUNCH.LIST);
  return [];
}

/**
 * 切换今日打卡状态
 * TODO: 接入后端 POST /punch/toggle
 */
export async function togglePunch(date: string): Promise<boolean> {
  mockEndpoint(API_ENDPOINTS.PUNCH.TOGGLE, date);
  return true;
}

// ==================== 任务相关 ====================
/**
 * 获取任务列表
 * TODO: 接入后端 GET /task/list
 */
export async function fetchTasks(): Promise<Task[]> {
  mockEndpoint(API_ENDPOINTS.TASK.LIST);
  return [];
}

/**
 * 创建任务
 * TODO: 接入后端 POST /task/create
 */
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  mockEndpoint(API_ENDPOINTS.TASK.CREATE, payload);
  return {
    id: String(Date.now()),
    title: payload.title,
    detail: payload.detail,
    total: payload.total,
    count: 0,
    completed: false
  };
}

/**
 * 更新任务
 * TODO: 接入后端 PATCH /task/:id
 */
export async function updateTask(id: string, partial: Partial<CreateTaskPayload>): Promise<boolean> {
  mockEndpoint(API_ENDPOINTS.TASK.UPDATE(id), partial);
  return true;
}

/**
 * 任务记一次（增加计数）
 * TODO: 接入后端 POST /task/:id/tick
 */
export async function tickTask(id: string): Promise<boolean> {
  mockEndpoint(API_ENDPOINTS.TASK.TICK(id));
  return true;
}

// ==================== 学习计时相关 ====================
/**
 * 开始学习计时
 * TODO: 接入后端 POST /study/start
 */
export async function startStudySession(): Promise<StudyRecord> {
  mockEndpoint(API_ENDPOINTS.STUDY.START);
  return {
    id: String(Date.now()),
    userId: "local",
    startTime: new Date().toISOString(),
    duration: 0
  };
}

/**
 * 停止学习计时
 * TODO: 接入后端 POST /study/stop
 */
export async function stopStudySession(sessionId: string, duration: number): Promise<boolean> {
  mockEndpoint(API_ENDPOINTS.STUDY.STOP, sessionId, duration);
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
