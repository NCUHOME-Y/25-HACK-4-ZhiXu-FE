import type { FlagLabel, FlagPriority } from '../lib/types/types';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedFlag {
  title: string;
  detail: string;
  total: number;
  label: FlagLabel;
  priority: FlagPriority;
}

export interface StudyPlan {
  goal: string;
  difficulty: Difficulty;
  description: string;
  flags: GeneratedFlag[];
}

/**
 * 模拟AI生成学习计划
 * TODO: 接入真实AI API
 */
export async function generateStudyPlan(
  goal: string,
  difficulty: Difficulty
): Promise<StudyPlan> {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 根据难度生成不同的计划
  const planTemplates: Record<Difficulty, { description: string; flagCount: number; totalRange: [number, number] }> = {
    easy: {
      description: '循序渐进，轻松达成目标。建议每天花费30-45分钟，持续3-4周完成。',
      flagCount: 4,
      totalRange: [7, 14],
    },
    medium: {
      description: '稳步前进，平衡挑战与成长。建议每天花费1-1.5小时，持续4-6周完成。',
      flagCount: 6,
      totalRange: [14, 21],
    },
    hard: {
      description: '全力冲刺，突破自我极限。建议每天花费2-3小时，持续6-8周完成。',
      flagCount: 8,
      totalRange: [21, 30],
    },
  };

  const template = planTemplates[difficulty];

  // 智能拆解目标为具体的Flag
  const flags = generateFlags(goal, difficulty, template.flagCount, template.totalRange);

  return {
    goal,
    difficulty,
    description: template.description,
    flags,
  };
}

/**
 * 根据目标和难度生成Flag列表
 * TODO: 调用后端AI API生成
 */
function generateFlags(
  _goal: string,
  _difficulty: Difficulty,
  _count: number,
  _totalRange: [number, number]
): GeneratedFlag[] {
  // TODO: 这里应该调用后端AI API，传入 goal 和 difficulty，返回智能生成的 flags
  // 临时返回空数组，等待后端接口接入
  return [];
}



