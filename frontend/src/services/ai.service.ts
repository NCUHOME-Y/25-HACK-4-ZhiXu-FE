import { api } from './apiClient';
import type { FlagLabel, FlagPriority } from '../lib/types/types';
import { calculateTaskCompletionPoints } from '../lib/helpers/helpers';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GeneratedFlag {
  title: string;
  detail: string;
  total: number;  // 每日所需完成次数
  label: FlagLabel;
  priority: FlagPriority;
  points: number;
  startDate: string;   // 开始日期 (ISO格式)
  endDate: string;     // 结束日期 (ISO格式，用于自动过期)
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
 * 标签定义：1-学习提升, 2-健康运动, 3-工作效率, 4-兴趣爱好, 5-生活习惯
 */
function inferLabel(text: string): FlagLabel {
  const scores: Record<FlagLabel, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  
  const learningKeywords = [
    '学习', '阅读', '教程', '课程', '书籍', '复习', '预习', '笔记', '理论', '知识', 
    '掌握', '练习', '作业', '学会', '提升', '考试', '证书', '培训', '研究', '专业',
    '技能', '能力', '英语', '数学', '语言', '算法', '框架', '编程', '代码', '开发',
    '基础', '进阶', '深入', '理解', '分析', '总结', '记忆', '背诵', '听课', '自学'
  ];
  learningKeywords.forEach(keyword => {
    if (text.includes(keyword)) scores[1] += 2;
  });
  
  const healthKeywords = [
    '锻炼', '运动', '健身', '跑步', '瑜伽', '健康', '休息', '睡眠', '饮食', '体能',
    '减肥', '增肌', '体重', '早睡', '早起', '作息', '散步', '游泳', '球类', '拉伸',
    '冥想', '放松', '养生', '保健', '营养', '卡路里', '锻练', '体质', '耐力', '力量',
    '有氧', '无氧', '热身', '恢复', '伤病', '健美', '塑形', '核心', '柔韧'
  ];
  healthKeywords.forEach(keyword => {
    if (text.includes(keyword)) scores[2] += 2;
  });
  
  const workKeywords = [
    '工作', '项目', '任务', '开发', '实现', '构建', '部署', '测试', '调试', '职场',
    '会议', '汇报', '文档', '效率', '时间管理', '计划', '安排', 'deadline', '完成',
    '交付', 'bug', '需求', '设计', '优化', '绩效', '目标', '方案', '流程', '规范',
    '协作', '沟通', '报告', '复盘', '迭代', '上线', '发布'
  ];
  workKeywords.forEach(keyword => {
    if (text.includes(keyword)) scores[3] += 2;
  });
  
  const hobbyKeywords = [
    '兴趣', '爱好', '娱乐', '游戏', '电影', '音乐', '绘画', '摄影', '旅游', '唱歌',
    '跳舞', '乐器', '手工', '收藏', '观影', '追剧', '动漫', '漫画', '小说', '创作',
    '写作', '设计', '艺术', '文学', '诗歌', '弹琴', '吉他', '钢琴', '舞蹈', '戏剧',
    '电竞', '桌游', '户外', '登山', '骑行', '露营'
  ];
  hobbyKeywords.forEach(keyword => {
    if (text.includes(keyword)) scores[4] += 2;
  });
  
  const habitKeywords = [
    '习惯', '日常', '生活', '社交', '朋友', '聚会', '活动', '交流', '分享', '讨论',
    '合作', '团队', '打卡', '坚持', '记录', '整理', '清洁', '家务', '购物', '理财',
    '存钱', '节约', '准时', '规律', '自律', '改变', '养成', '保持', '维持', '持续',
    '每日', '每天', '定时', '按时', '固定'
  ];
  habitKeywords.forEach(keyword => {
    if (text.includes(keyword)) scores[5] += 2;
  });
  
  if (/学习.*?(编程|代码|算法|框架|语言)/.test(text) || /（编程|代码|算法|框架|语言）.*?学习/.test(text)) {
    scores[1] += 3;
  }
  
  if (/早睡|早起|作息|睡眠/.test(text)) {
    scores[2] += 3;
  }
  
  let maxScore = 0;
  let bestLabel: FlagLabel = 1;
  
  ([1, 2, 3, 4, 5] as const).forEach((label) => {
    if (scores[label] > maxScore) {
      maxScore = scores[label];
      bestLabel = label;
    }
  });
  
  return bestLabel;
}

/**
 * 计算任务的时间安排
 */
/**
 * 计算任务的开始日期和结束日期
 * 根据任务序号、优先级和难度，设置合理的起始时间和持续天数
 */
function calculateTaskSchedule(
  priority: FlagPriority,
  taskIndex: number,
  difficulty: Difficulty
): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const startDate = new Date(now);
  
  const priorityDelay = {
    1: 0,
    2: 1,
    3: 2,
    4: 3,
  }[priority];
  
  // 根据任务序号错开开始时间（每3个任务错开1天）
  const indexDelay = Math.floor(taskIndex / 3);
  
  startDate.setDate(startDate.getDate() + priorityDelay + indexDelay);
  
  // 根据难度设置基础持续天数
  const baseDurationDays = {
    'easy': 3,    // 入门级：1-3天
    'medium': 10, // 进阶级：1-2周
    'hard': 40,   // 专家级：1-2月
  }[difficulty];
  
  // 根据优先级调整持续时间（急切的任务时间更紧，不急的更宽松）
  const priorityMultiplier = {
    1: 0.7,  // 急切：缩短30%
    2: 0.85, // 较急：缩短15%
    3: 1.0,  // 一般：标准
    4: 1.3,  // 不急：延长30%
  }[priority];
  
  const durationDays = Math.max(2, Math.round(baseDurationDays * priorityMultiplier));
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
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

  const difficultyMap: Record<Difficulty, number> = {
      easy: 100,
      medium: 200,
      hard: 300,
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
    }, {
      timeout: 90000, // AI生成需要更长时间，设置90秒超时
    });

    if (!response.success) {
      throw new Error(response.error || '生成学习计划失败');
    }

    const { phases, flags } = parsePlanAndGenerateFlags(response.plan, difficulty);

    const descriptions: Record<Difficulty, string> = {
        easy: '入门级：100分，建议1-3天完成，3-5个简单任务。每天30-45分钟，快速掌握基础。',
        medium: '进阶级：200分，建议1-2周完成，5-6个中等任务。每天1小时，系统提升能力。',
        hard: '专家级：300分，建议1-2月完成，6-8个高难度任务。每天2小时，深度突破自我。',
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
    console.error('AI接口异常', error);
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
  
  const lines = planText.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
  
  let baseTotal = 1, maxFlags = 5;
    if (difficulty === 'easy') {
      baseTotal = 1;  // 入门级：每天1次，轻松入门
      maxFlags = 5;   // 3-5个任务
    } else if (difficulty === 'medium') {
      baseTotal = 2;  // 进阶级：每天2次，稳步提升
      maxFlags = 6;   // 5-6个任务
    } else if (difficulty === 'hard') {
      baseTotal = 3;  // 专家级：每天3次，高强度训练
      maxFlags = 8;   // 6-8个任务，配合更长的持续时间达到300分
    }
  
  let currentPhase = '';
  let currentPhaseContent: string[] = [];  // 保存当前阶段的完整内容
  let flagsInCurrentPhase: string[] = [];
  
  for (const line of lines) {
    // 识别阶段标题（如"阶段一"、"第一阶段"、"Phase 1"等）
    if (/^(阶段|第.*阶段|Phase\s*\d|步骤\s*\d|Step\s*\d)/i.test(line)) {
      // 保存上一个阶段（包含完整内容）
      if (currentPhase && currentPhaseContent.length > 0) {
        phases.push(currentPhaseContent.join('\n'));
      }
      // 开始新阶段
      currentPhase = line;
      currentPhaseContent = [line];  // 保存阶段标题
      flagsInCurrentPhase = [];
      continue;
    }
    
    // 识别任务行（必须是"数字."或"数字)"开头，且包含"每日完成"字样）
    // 这样可以区分任务行和学习要点（学习要点只是"-"开头）
    const isTaskLine = /^\d+[.。)）]\s*.+/.test(line) && line.length > 5;
    
    // 如果在某个阶段内，保存该行内容（除了任务行）
    if (currentPhase && !isTaskLine) {
      currentPhaseContent.push(line);
    }
    
    // 处理任务行
    if (isTaskLine) {
      const taskTitle = line.replace(/^\d+[.。)）]\s*/, '').trim();
      
      // 跳过太短的行或纯数字行
      if (taskTitle.length < 3 || /^\d+$/.test(taskTitle)) continue;
      
      flagsInCurrentPhase.push(taskTitle);
      
      // 添加flag（无论是否有阶段标题）
      const label = inferLabel(taskTitle);
      const priority = inferPriority(taskTitle, flags.length, maxFlags);
      
      // 计算任务开始日期和结束日期
      const { startDate, endDate } = calculateTaskSchedule(
        priority, 
        flags.length,
        difficulty
      );
      
      // 使用新的积分系统计算
      // 对于专家级，增加持续时间的积分权重
      const durationDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      const durationBonus = difficulty === 'hard' ? Math.min(durationDays * 0.5, 20) : 0; // 专家级每天额外0.5分，最多20分
      
      const basePoints = calculateTaskCompletionPoints({
        priority,
        label,
        total: baseTotal,
      });
      
      const points = Math.round(basePoints + durationBonus);
      
      // 构建详细描述 - 保留原始任务行（包含每日完成次数）
      const originalTaskLine = line; // 保留完整的任务描述，包括（每日完成：X次）
      let detail = originalTaskLine;
      
      // 如果有阶段信息，添加阶段上下文
      if (currentPhase) {
        const phaseName = currentPhase.split('\n')[0]; // 只取阶段标题
        detail = `${phaseName}\n${originalTaskLine}`;
      }
      
      // 提取纯净的标题（用于显示）
      const cleanTitle = taskTitle.replace(/[（(]每日完成.*?[）)]/g, '').trim();
      
      flags.push({
        title: cleanTitle.length > 50 ? cleanTitle.substring(0, 47) + '...' : cleanTitle,
        detail: detail.length > 150 ? detail.substring(0, 147) + '...' : detail,
        total: baseTotal,
        label,
        priority,
        points,
        startDate,
        endDate,
      });
      
      // 限制flag数量
      if (flags.length >= maxFlags) break;
    }
  }
  
  // 保存最后一个阶段（包含完整内容）
  if (currentPhase && currentPhaseContent.length > 0) {
    phases.push(currentPhaseContent.join('\n'));
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
        
        const { startDate, endDate } = calculateTaskSchedule(
          priority,
          index,
          difficulty
        );
        
        const durationDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        const durationBonus = difficulty === 'hard' ? Math.min(durationDays * 0.5, 20) : 0;
        
        const basePoints = calculateTaskCompletionPoints({
          priority,
          label,
          total: baseTotal,
        });
        
        const points = Math.round(basePoints + durationBonus);
        
        flags.push({
          title: cleanSentence.length > 50 ? cleanSentence.substring(0, 47) + '...' : cleanSentence,
          detail: cleanSentence.length > 150 ? cleanSentence.substring(0, 147) + '...' : cleanSentence,
          total: baseTotal,
          label,
          priority,
          points,
          startDate,
          endDate,
        });
      });
    } else {
      // 最后备用：按换行符分割
      const lineSegments = lines.filter(l => l.length > 10 && l.length < 100).slice(0, Math.max(3, Math.floor(maxFlags / 2)));
      lineSegments.forEach((segment, index) => {
        const label = inferLabel(segment);
        const priority = inferPriority(segment, index, lineSegments.length);
        
        const { startDate, endDate } = calculateTaskSchedule(
          priority,
          index,
          difficulty
        );
        
        const durationDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
        const durationBonus = difficulty === 'hard' ? Math.min(durationDays * 0.5, 20) : 0;
        
        const basePoints = calculateTaskCompletionPoints({
          priority,
          label,
          total: baseTotal,
        });
        
        const points = Math.round(basePoints + durationBonus);
        
        flags.push({
          title: segment.length > 50 ? segment.substring(0, 47) + '...' : segment,
          detail: segment,
          total: baseTotal,
          label,
          priority,
          points,
          startDate,
          endDate,
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
      const { startDate, endDate } = calculateTaskSchedule(
        task.priority as FlagPriority,
        i,
        difficulty
      );
      
      const durationDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      const durationBonus = difficulty === 'hard' ? Math.min(durationDays * 0.5, 20) : 0;
      
      const basePoints = calculateTaskCompletionPoints({
        priority: task.priority as FlagPriority,
        label: 1,
        total: baseTotal,
      });
      
      const points = Math.round(basePoints + durationBonus);
      
      flags.push({
        title: task.title,
        detail: task.detail,
        total: baseTotal,
        label: 1,
        priority: task.priority as FlagPriority,
        points,
        startDate,
        endDate,
      });
    }
  }
  
  return { phases, flags };
}



