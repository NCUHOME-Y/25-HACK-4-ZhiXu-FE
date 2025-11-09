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

// ==================== 打卡相关 ====================
/**
 * 获取已打卡日期列表
 * TODO: 接入后端 GET /punch/list
 */
export async function fetchPunchDates(): Promise<string[]> {
  void API_ENDPOINTS.PUNCH.LIST;
  return [];
}

/**
 * 切换今日打卡状态
 * TODO: 接入后端 POST /punch/toggle
 */
export async function togglePunch(date: string): Promise<boolean> {
  void API_ENDPOINTS.PUNCH.TOGGLE;
  void date;
  return true;
}

// ==================== 任务相关 ====================
/**
 * 获取任务列表
 * TODO: 接入后端 GET /task/list
 */
export async function fetchTasks(): Promise<Task[]> {
  void API_ENDPOINTS.TASK.LIST;
  return [];
}

/**
 * 创建任务
 * TODO: 接入后端 POST /task/create
 */
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  void API_ENDPOINTS.TASK.CREATE;
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
  void API_ENDPOINTS.TASK.UPDATE(id);
  void partial;
  return true;
}

/**
 * 任务记一次（增加计数）
 * TODO: 接入后端 POST /task/:id/tick
 */
export async function tickTask(id: string): Promise<boolean> {
  void API_ENDPOINTS.TASK.TICK(id);
  return true;
}

// ==================== 学习计时相关 ====================
/**
 * 开始学习计时
 * TODO: 接入后端 POST /study/start
 */
export async function startStudySession(): Promise<StudyRecord> {
  void API_ENDPOINTS.STUDY.START;
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
  void API_ENDPOINTS.STUDY.STOP;
  void sessionId;
  void duration;
  return true;
}

