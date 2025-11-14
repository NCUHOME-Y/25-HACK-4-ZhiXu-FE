import { api } from './apiClient';
import type { FlagLabel, FlagPriority } from '../lib/types/types';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedFlag {
  title: string;
  detail: string;
  total: number;
  label: FlagLabel;
  priority: FlagPriority;
  points: number; // 该Flag的积分值
}

export interface StudyPlan {
  goal: string;
  difficulty: Difficulty;
  description: string;
  flags: GeneratedFlag[];
}

/**
 * 根据难度、任务量和优先级计算Flag积分
 */
export function calculateFlagPoints(
  difficulty: Difficulty,
  total: number,
  priority: FlagPriority
): number {
  // 基础分数：根据难度
  const basePoints: Record<Difficulty, number> = {
    easy: 10,
    medium: 20,
    hard: 35,
  };
  
  // 任务量系数：总数越多，积分越高
  const volumeMultiplier = 1 + Math.log10(total);
  
  // 优先级系数：优先级越高（数字越小），积分越高
  const priorityMultiplier: Record<FlagPriority, number> = {
    1: 1.5,  // 急切
    2: 1.3,  // 较急
    3: 1.1,  // 一般
    4: 1.0,  // 不急
  };
  
  const points = Math.round(
    basePoints[difficulty] * volumeMultiplier * priorityMultiplier[priority]
  );
  
  return points;
}

/**
 * 调用后端 AI API 生成学习计划
 */
export async function generateStudyPlan(
  goal: string,
  difficulty: Difficulty
): Promise<StudyPlan> {
  // 将前端 difficulty 映射到后端的难度分数
  const difficultyMap: Record<Difficulty, number> = {
    easy: 50,
    medium: 150,
    hard: 200,
  };

  const response = await api.post<{
    success: boolean;
    flag: string;
    difficulty: number;
    plan: string;
    error?: string;
  }>('/api/ai/generate-plan', {
    flag: goal,
    preferences: difficultyMap[difficulty],
  });

  if (!response.success) {
    throw new Error(response.error || '生成学习计划失败');
  }

  // 根据难度生成描述
  const descriptions: Record<Difficulty, string> = {
    easy: '循序渐进，轻松达成目标。建议每天花费30-45分钟，持续3-4周完成。',
    medium: '稳步前进，平衡挑战与成长。建议每天花费1-1.5小时，持续4-6周完成。',
    hard: '全力冲刺，突破自我极限。建议每天花费2-3小时，持续6-8周完成。',
  };

  return {
    goal: response.flag,
    difficulty,
    description: descriptions[difficulty],
    flags: [], // 后端返回的 plan 是文本,前端暂时返回空数组
  };
}



