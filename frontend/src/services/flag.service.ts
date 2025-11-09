// Flag 页面相关后端 API 占位实现
// 保持全部函数轻量并带有 TODO，后续直接补真实请求即可。

import type { Task } from "../lib/types/types";

export interface CreateTaskPayload {
  title: string;
  detail?: string;
  total?: number;
  dateRange?: unknown;
}

// 获取某日/范围内已打卡日期
export async function fetchPunchDates(): Promise<string[]> {
  // TODO: GET /punch/dates
  return [];
}

// 提交今日打卡
export async function togglePunch(date: string): Promise<boolean> {
  // TODO: POST /punch/toggle { date }
  void date;
  return true;
}

// 获取任务列表
export async function fetchTasks(): Promise<Task[]> {
  // TODO: GET /tasks
  return [];
}

// 创建任务
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  // TODO: POST /tasks
  return { id: String(Date.now()), title: payload.title, detail: payload.detail, total: payload.total, count: 0, completed: false };
}

// 更新任务
export async function updateTask(id: string, partial: Partial<CreateTaskPayload>): Promise<boolean> {
  // TODO: PATCH /tasks/:id
  void id;
  void partial;
  return true;
}

// 任务记一次
export async function tickTask(id: string): Promise<boolean> {
  // TODO: POST /tasks/:id/tick
  void id;
  return true;
}
