import { api } from './apiClient';
import type { FlagLabel, FlagPriority } from '../lib/types/types';
import { calculateTaskCompletionPoints } from '../lib/helpers/points-system';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedFlag {
  title: string;
  detail: string;
  total: number;
  label: FlagLabel;
  priority: FlagPriority;
  points: number;
  dailyLimit: number;  // 每日完成次数限制
  startDate: string;   // 开始日期
  endDate: string;     // 结束日期
  isRecurring: boolean; // 是否为循环任务
}

export interface StudyPlan {
  goal: string;
  background?: string;
  difficulty: Difficulty;
  description: string;
  phases: string[];  // 学习阶段描述
  flags: GeneratedFlag[];
}

/**
 * 根据文本内容自动推测标签
 */
function inferLabel(text: string): FlagLabel {
  // 学习类关键词（优先级最高）
  if (/学习|阅读|教程|课程|书籍|复习|预习|笔记|理论|知识|掌握|练习|作业/.test(text)) return 1;
  
  // 工作类关键词
  if (/工作|项目|任务|开发|编程|代码|实现|构建|部署|测试|调试|职场/.test(text)) return 2;
  
  // 健康类关键词
  if (/锻炼|运动|健身|跑步|瑜伽|健康|休息|睡眠|饮食|体能/.test(text)) return 3;
  
  // 兴趣类关键词
  if (/兴趣|爱好|娱乐|游戏|电影|音乐|绘画|摄影|旅游/.test(text)) return 4;
  
  // 社交类关键词
  if (/社交|朋友|聚会|活动|交流|分享|讨论|合作|团队/.test(text)) return 5;
  
  return 1; // 默认学习类
}

/**
 * 计算任务的时间安排
 */
function calculateTaskSchedule(
  difficulty: Difficulty,
  priority: FlagPriority,
  taskIndex: number,
  baseTotal: number
): {
  startDate: string;
  endDate: string;
  dailyLimit: number;
  isRecurring: boolean;
} {
  const now = new Date();
  const startDate = new Date(now);
  
  // 根据任务顺序设置开始日期（前面的任务先开始）
  startDate.setDate(startDate.getDate() + Math.floor(taskIndex / 3));
  
  // 根据难度和优先级计算持续天数
  let durationDays: number;
  
  // 基础天数
  const baseDays = {
    easy: 7,    // 简单：1周
    medium: 14, // 中等：2周
    hard: 21,   // 困难：3周
  }[difficulty];
  
  // 优先级调整（急切的任务时间更短，不急的更长）
  const priorityMultiplier = {
    1: 0.7,  // 急切：缩短30%
    2: 0.85, // 较急：缩短15%
    3: 1.0,  // 一般：标准
    4: 1.3,  // 不急：延长30%
  }[priority];
  
  durationDays = Math.round(baseDays * priorityMultiplier);
  
  // 确保至少3天
  durationDays = Math.max(3, durationDays);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  
  // 每日完成次数限制（根据总次数和天数计算）
  const dailyLimit = Math.max(1, Math.ceil(baseTotal / durationDays));
  
  // 判断是否为循环任务（不急的任务且total较小的设为循环）
  const isRecurring = priority === 4 && baseTotal <= 5;
  
  return {
    startDate: startDate.toISOString(),
    endDate: isRecurring ? '' : endDate.toISOString(), // 循环任务无结束日期
    dailyLimit,
    isRecurring,
  };
}

/**
 * 根据文本内容推测优先级
 */
function inferPriority(text: string, index: number, total: number): FlagPriority {
  // 包含紧急关键词 - 急切(1)
  if (/紧急|重要|必须|关键|核心|基础|入门|第一/.test(text)) return 1;
  
  // 包含较急关键词 - 较急(2)
  if (/尽快|优先|重点|主要|深入/.test(text)) return 2;
  
  // 包含不急关键词 - 不急(4)
  if (/扩展|选修|进阶|高级|拓展/.test(text)) return 4;
  
  // 根据任务位置判断
  if (index < total * 0.3) return 1; // 前30%任务为急切
  if (index < total * 0.6) return 2; // 30-60%为较急
  if (index > total * 0.8) return 4; // 后20%为不急
  
  return 3; // 默认一般
}

/**
 * 调用AI生成学习计划和flag
 */
export async function generateStudyPlan(
  goal: string,
  background: string,
  difficulty: Difficulty
): Promise<StudyPlan> {
  // 输入验证
  const trimmedGoal = goal.trim();
  const trimmedBackground = background.trim();
  
  if (!trimmedGoal) {
    throw new Error('学习目标不能为空');
  }
  if (trimmedGoal.length < 2) {
    throw new Error('学习目标至少需要2个字符');
  }
  if (trimmedGoal.length > 200) {
    throw new Error('学习目标不能超过200个字符');
  }
  if (!/[\u4e00-\u9fa5a-zA-Z0-9]/.test(trimmedGoal)) {
    throw new Error('请输入有效的学习目标');
  }

  // 映射难度到后端参数
  const difficultyMap: Record<Difficulty, number> = {
    easy: 50,
    medium: 150,
    hard: 200,
  };

  try {
    const response = await api.post<{
      success: boolean;
      flag: string;
      difficulty: number;
      plan: string;
      error?: string;
    }>('/api/ai/generate-plan', {
      flag: trimmedGoal,
      background: trimmedBackground || undefined,
      difficulty: difficultyMap[difficulty],
    });

    if (!response.success) {
      throw new Error(response.error || '生成学习计划失败');
    }

    // 解析AI返回的学习计划和生成flag
    const { phases, flags } = parsePlanAndGenerateFlags(response.plan, difficulty);

    const descriptions: Record<Difficulty, string> = {
      easy: '循序渐进，轻松达成目标。建议每天30-45分钟，3-4周完成。',
      medium: '稳步前进，平衡挑战与成长。建议每天1-1.5小时，4-6周完成。',
      hard: '全力冲刺，突破自我极限。建议每天2-3小时，6-8周完成。',
    };

    return {
      goal: response.flag,
      background: trimmedBackground,
      difficulty,
      description: descriptions[difficulty],
      phases,
      flags,
    };
  } catch (error) {
    console.error('AI生成失败:', error);
    throw error;
  }
}

/**
 * 解析AI返回的计划文本，生成flag列表
 */
function parsePlanAndGenerateFlags(planText: string, difficulty: Difficulty): {
  phases: string[];
  flags: GeneratedFlag[];
} {
  const phases: string[] = [];
  const flags: GeneratedFlag[] = [];
  
  // 按行分割
  const lines = planText.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
  
  // 根据难度设置默认参数
  const baseTotal = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15;
  
  // 根据难度设置最大flag数量
  const maxFlags = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 6 : 8;
  
  let currentPhase = '';
  let flagsInCurrentPhase: string[] = [];
  
  for (const line of lines) {
    // 识别阶段标题（如"阶段一"、"第一阶段"、"Phase 1"等）
    if (/^(阶段|第.*阶段|Phase\s*\d|步骤\s*\d|Step\s*\d)/i.test(line)) {
      // 保存上一个阶段
      if (currentPhase && !phases.includes(currentPhase)) {
        phases.push(currentPhase);
      }
      currentPhase = line;
      flagsInCurrentPhase = [];
      continue;
    }
    
    // 识别任务行（以数字、符号开头）- 修复正则表达式转义
    if (/^[\d.\-*+】)]\s*/.test(line) && line.length > 5) {
      const taskTitle = line.replace(/^[\d.\-*+】)]\s*/, '').trim();
      
      // 跳过太短的行或纯数字行
      if (taskTitle.length < 3 || /^\d+$/.test(taskTitle)) continue;
      
      flagsInCurrentPhase.push(taskTitle);
      
      // 添加flag（无论是否有阶段标题）
      const label = inferLabel(taskTitle);
      const priority = inferPriority(taskTitle, flags.length, maxFlags);
      
      // 使用新的积分系统计算
      const points = calculateTaskCompletionPoints({
        priority,
        label,
        total: baseTotal,
      });
      
      // 构建详细描述
      let detail = taskTitle;
      if (currentPhase) {
        const phaseName = currentPhase.split('\n')[0]; // 只取阶段标题，不包含描述
        detail = `${phaseName} - ${taskTitle}`;
      }
      
      // 根据难度和优先级计算日期范围
      const { startDate, endDate, dailyLimit, isRecurring } = calculateTaskSchedule(
        difficulty, 
        priority, 
        flags.length,
        baseTotal
      );
      
      flags.push({
        title: taskTitle.length > 50 ? taskTitle.substring(0, 47) + '...' : taskTitle,
        detail: detail.length > 150 ? detail.substring(0, 147) + '...' : detail,
        total: baseTotal,
        label,
        priority,
        points,
        dailyLimit,
        startDate,
        endDate,
        isRecurring,
      });
      
      // 限制flag数量
      if (flags.length >= maxFlags) break;
    } else if (currentPhase && line.length > 10 && !line.startsWith('#')) {
      // 非任务行但有内容，可能是阶段描述（排除标题）
      currentPhase += '\n' + line;
    }
  }
  
  // 保存最后一个阶段
  if (currentPhase && !phases.includes(currentPhase)) {
    phases.push(currentPhase);
  }
  
  // 如果没有识别到阶段，尝试简单分段
  if (phases.length === 0) {
    const chunks = planText.split(/\n\n+/);
    phases.push(...chunks.filter(c => c.trim().length > 10).slice(0, 3));
  }
  
  // 如果没有生成flag，尝试更灵活的解析方式
  if (flags.length === 0) {
    console.warn('未能识别任务行，尝试备用解析方式');
    
    // 尝试按句号分割
    const sentences = planText.match(/[^。！？\n]+[。！？]/g) || [];
    const validSentences = sentences
      .filter(s => s.length > 10 && s.length < 150)
      .slice(0, maxFlags);
    
    if (validSentences.length > 0) {
      validSentences.forEach((sentence, index) => {
        const cleanSentence = sentence.replace(/[。！？]/g, '').trim();
        const label = inferLabel(cleanSentence);
        const priority = inferPriority(cleanSentence, index, validSentences.length);
        
        const points = calculateTaskCompletionPoints({
          priority,
          label,
          total: baseTotal,
        });
        
        const { startDate, endDate, dailyLimit, isRecurring } = calculateTaskSchedule(
          difficulty,
          priority,
          index,
          baseTotal
        );
        
        flags.push({
          title: cleanSentence.length > 50 ? cleanSentence.substring(0, 47) + '...' : cleanSentence,
          detail: cleanSentence.length > 150 ? cleanSentence.substring(0, 147) + '...' : cleanSentence,
          total: baseTotal,
          label,
          priority,
          points,
          dailyLimit,
          startDate,
          endDate,
          isRecurring,
        });
      });
    } else {
      // 最后备用：按换行符分割
      const lineSegments = lines.filter(l => l.length > 10 && l.length < 100).slice(0, Math.max(3, Math.floor(maxFlags / 2)));
      lineSegments.forEach((segment, index) => {
        const label = inferLabel(segment);
        const priority = inferPriority(segment, index, lineSegments.length);
        
        const points = calculateTaskCompletionPoints({
          priority,
          label,
          total: baseTotal,
        });
        
        const { startDate, endDate, dailyLimit, isRecurring } = calculateTaskSchedule(
          difficulty,
          priority,
          index,
          baseTotal
        );
        
        flags.push({
          title: segment.length > 50 ? segment.substring(0, 47) + '...' : segment,
          detail: segment,
          total: baseTotal,
          label,
          priority,
          points,
          dailyLimit,
          startDate,
          endDate,
          isRecurring,
        });
      });
    }
  }
  
  // 确保至少有3个flag
  if (flags.length < 3) {
    console.warn(`只生成了${flags.length}个flag，补充默认任务`);
    const defaultTasks = [
      { title: '学习基础知识和概念', detail: '掌握核心基础知识', priority: 1 },
      { title: '完成实践练习', detail: '通过练习巩固知识', priority: 2 },
      { title: '总结复习和巩固', detail: '回顾总结学习成果', priority: 3 },
    ];
    
    for (let i = flags.length; i < Math.min(3, maxFlags); i++) {
      const task = defaultTasks[i] || defaultTasks[2];
      const { startDate, endDate, dailyLimit, isRecurring } = calculateTaskSchedule(
        difficulty,
        task.priority as FlagPriority,
        i,
        baseTotal
      );
      
      flags.push({
        title: task.title,
        detail: task.detail,
        total: baseTotal,
        label: 1,
        priority: task.priority as FlagPriority,
        points: calculateTaskCompletionPoints({
          priority: task.priority as FlagPriority,
          label: 1,
          total: baseTotal,
        }),
        dailyLimit,
        startDate,
        endDate,
        isRecurring,
      });
    }
  }
  
  return { phases, flags };
}



