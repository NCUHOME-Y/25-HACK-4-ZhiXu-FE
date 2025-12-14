/** 积分系统 - 简单公平的打卡和任务积分计算 */

// ========== 积分规则配置 ==========

/** 基础积分 */
export const BASE_POINTS = {
  DAILY_PUNCH: 10,        // 每日打卡基础积分
  TASK_CREATE: 5,         // 创建任务奖励
  TASK_COMPLETE: 15,      // 完成任务基础积分
  CONTINUOUS_BONUS: 5,    // 连续打卡奖励（每7天）
} as const;

/** 打卡限制 */
export const PUNCH_LIMITS = {
  MAX_PER_DAY: 1,         // 每天最多打卡1次（简化）
  MIN_INTERVAL_HOURS: 20, // 最小间隔20小时（防止刷新后立即打卡）
} as const;

/** 任务难度系数 */
export const DIFFICULTY_MULTIPLIER = {
  1: 1.0,  // 简单（优先级4-低）
  2: 1.3,  // 中等（优先级3-一般）
  3: 1.6,  // 困难（优先级2-较急）
  4: 2.0,  // 挑战（优先级1-急切）
} as const;

/** 任务类型系数 */
export const TASK_TYPE_MULTIPLIER = {
  1: 1.2,  // 学习类
  2: 1.3,  // 工作类
  3: 1.5,  // 健康类
  4: 1.0,  // 兴趣类
  5: 1.1,  // 社交类
} as const;

// ========== 积分计算函数 ==========

/**
 * 计算每日打卡积分
 * @param consecutiveDays 连续打卡天数
 * @returns 积分
 */
export function calculateDailyPunchPoints(consecutiveDays: number): number {
  let points = BASE_POINTS.DAILY_PUNCH;
  
  // 连续打卡奖励：每满7天额外+5分
  const weekBonus = Math.floor(consecutiveDays / 7) * BASE_POINTS.CONTINUOUS_BONUS;
  points += weekBonus;
  
  // 最高限制：避免积分过度膨胀
  return Math.min(points, 30);
}

/**
 * 计算任务完成积分
 * @param params 任务参数
 * @returns 积分
 */
export function calculateTaskCompletionPoints(params: {
  priority: 1 | 2 | 3 | 4;  // 优先级
  label: 1 | 2 | 3 | 4 | 5; // 任务类型
  total: number;             // 任务总次数
}): number {
  const { priority, label, total } = params;
  
  // 基础积分
  let points = BASE_POINTS.TASK_COMPLETE;
  
  // 难度系数（根据优先级）
  const difficultyKey = priority as keyof typeof DIFFICULTY_MULTIPLIER;
  points *= DIFFICULTY_MULTIPLIER[difficultyKey];
  
  // 任务类型系数
  const typeKey = label as keyof typeof TASK_TYPE_MULTIPLIER;
  points *= TASK_TYPE_MULTIPLIER[typeKey];
  
  // 任务量系数：total越大，稍微增加积分（避免拆分任务刷分）
  const volumeMultiplier = 1 + Math.log10(total) * 0.2;
  points *= volumeMultiplier;
  
  // 四舍五入
  return Math.round(points);
}

/**
 * 验证打卡是否有效
 * @param lastPunchTime 上次打卡时间（毫秒）
 * @param now 当前时间（毫秒）
 * @returns {valid: boolean, message?: string}
 */
export function validatePunch(lastPunchTime: number, now: number = Date.now()): {
  valid: boolean;
  message?: string;
} {
  if (!lastPunchTime) {
    return { valid: true };
  }
  
  const hoursSinceLastPunch = (now - lastPunchTime) / (1000 * 60 * 60);
  
  // 检查是否在最小间隔内
  if (hoursSinceLastPunch < PUNCH_LIMITS.MIN_INTERVAL_HOURS) {
    const hoursLeft = Math.ceil(PUNCH_LIMITS.MIN_INTERVAL_HOURS - hoursSinceLastPunch);
    return {
      valid: false,
      message: `请等待${hoursLeft}小时后再打卡`
    };
  }
  
  return { valid: true };
}

/**
 * 计算连续打卡天数
 * @param punchDates 打卡日期数组（格式：YYYY-MM-DD）
 * @returns 连续天数
 */
export function calculateStreakDays(punchDates: string[]): number {
  if (!punchDates || punchDates.length === 0) return 0;
  
  // 排序（最新日期在前）
  const sorted = [...punchDates].sort().reverse();
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sorted.length; i++) {
    const checkDate = new Date(sorted[i]);
    checkDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    
    if (checkDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// ========== 积分展示和格式化 ==========

/**
 * 格式化积分显示
 * @param points 积分
 * @returns 格式化字符串
 */
export function formatPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return String(points);
}

/**
 * 获取积分等级称号
 * @param totalPoints 总积分
 * @returns 等级称号
 */
export function getPointsRank(totalPoints: number): {
  rank: string;
  minPoints: number;
  maxPoints: number;
} {
  const ranks = [
    { rank: '学习新人', minPoints: 0, maxPoints: 99 },
    { rank: '努力学者', minPoints: 100, maxPoints: 299 },
    { rank: '坚持达人', minPoints: 300, maxPoints: 599 },
    { rank: '学霸精英', minPoints: 600, maxPoints: 999 },
    { rank: '知识大师', minPoints: 1000, maxPoints: 1999 },
    { rank: '传奇导师', minPoints: 2000, maxPoints: Infinity },
  ];
  
  return ranks.find(r => totalPoints >= r.minPoints && totalPoints <= r.maxPoints) || ranks[0];
}
