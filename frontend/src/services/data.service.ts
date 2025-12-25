import type {
  MonthlyStats,
  FlagStats,
  FlagLabel,
  StudyTimeTrend,
} from '../lib/types/types';

/** 数据统计服务 */

/** 获取本月统计数据 */
export async function getMonthlyStats(): Promise<MonthlyStats> {
  const { api } = await import('./apiClient');
  try {
    const [_dakaTotal, monthDaka, learnTime] = await Promise.all([
      api.get<{ daka_total: number }>('/api/getdakatotal'),
      api.get<{ month_daka: number }>('/api/getmonthdaka'),
      api.get<{ month_learntime: number }>('/api/getLearnTimemonly')
    ]);
    
    const punchedDays = monthDaka.month_daka || 0;
    
    return {
      punchedDays,
      missedDays: Math.max(0, new Date().getDate() - punchedDays),
      totalStudyTime: learnTime.month_learntime || 0, // 后端已修正为秒
    };
  } catch (error) {
    console.error('获取月度统计失败:', error);
    return { punchedDays: 0, missedDays: 0, totalStudyTime: 0 };
  }
}

/** 获取本月 Flag 统计 */
export async function getFlagStats(): Promise<FlagStats> {
  const { api } = await import('./apiClient');
  try {
    const [doneFlags, undoneFlags, labels] = await Promise.all([
      api.get<{ id: string; label: number }[]>('/api/getDoneFlags'),
      api.get<{ id: string; label: number }[]>('/api/getUnDoneFlags'),
      api.get<{ label: number; count: number }[]>('/api/getlabel')
    ]);
    
    const labelNames = ['学习提升', '健康运动', '工作效率', '兴趣爱好', '生活习惯'];
    const labelColors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
    
    const labelStats = labelNames.map((name, index) => {
      const label = (index + 1) as FlagLabel;
      const completed = doneFlags.filter(f => f.label === label).length;
      const total = (labels.find(l => l.label === label)?.count || 0);
      return {
        label,
        labelName: name,
        completed,
        total,
        percentage: total > 0 ? (completed / total) * 100 : 0,
        color: labelColors[index]
      };
    });
    
    return {
      completedCount: doneFlags.length,
      uncompletedCount: undoneFlags.length,
      totalCount: doneFlags.length + undoneFlags.length,
      labelStats
    };
  } catch (error) {
    console.error('获取Flag统计失败:', error);
    return {
      completedCount: 0,
      uncompletedCount: 0,
      totalCount: 0,
      labelStats: []
    };
  }
}


/** 获取标签系统 - Flag 标签分类统计 */
export async function getFlagLabels(): Promise<Array<{ label: number; count: number; name: string }>> {
  const { api } = await import('./apiClient');
  try {
    const response = await api.get<{ label: { user_id: number; life: number; study: number; work: number; like_count: number; sport: number } }>('/api/getlabel');
    const labelNames = ['生活', '学习', '工作', '喜爱', '运动'];
    
    // 将单个 label 对象转换为数组格式
    const labels = response.label;
    return [
      { label: 1, count: labels.life, name: labelNames[0] },
      { label: 2, count: labels.study, name: labelNames[1] },
      { label: 3, count: labels.work, name: labelNames[2] },
      { label: 4, count: labels.like_count, name: labelNames[3] },
      { label: 5, count: labels.sport, name: labelNames[4] }
    ];
  } catch (error) {
    console.error('获取标签系统失败:', error);
    return [];
  }
}

/**
 * 获取学习时长趋势数据（新）
 * @param period 'week' (最近7天) | 'month' (当前月份) | 'year' (最近6个月)
 * @returns 学习时长趋势数组
 */
export async function getStudyTimeTrend(period: 'week' | 'month' | 'year'): Promise<StudyTimeTrend[]> {
  const { api } = await import('./apiClient');
  try {
    let endpoint = '/api/get7daylearntime'; // 默认周(最近7天)
    if (period === 'week') {
      endpoint = '/api/get7daylearntime'; // 周：最近7天
    } else if (period === 'month') {
      endpoint = '/api/getCurrentMonthLearnTime'; // 月：当前月份
    } else if (period === 'year') {
      endpoint = '/api/getRecent6MonthsLearnTime'; // 年：最近6个月
    }
    
    const response = await api.get<{ learn_times: Array<{ id: number; user_id: number; duration: number; created_at: string }> }>(endpoint);
    
    console.log(`${period}周期原始数据:`, response);
    
    if (!response.learn_times || response.learn_times.length === 0) {
      console.log(`${period}周期无数据`);
      return [];
    }
    
    // 转换为前端需要的格式 - 直接提取日期部分，避免时区问题
    const result = response.learn_times.map((item) => {
      // created_at 格式: "2025-11-01T00:00:00+08:00" 或 "2025-11-01"
      // 直接提取YYYY-MM-DD部分，不经过Date对象
      const dateStr = item.created_at.split('T')[0]; // 取T之前的部分
      return {
        date: dateStr,
        seconds: item.duration || 0
      };
    });

    return result;
  } catch (error) {
    console.error('获取学习时长趋势失败:', error);
    return [];
  }
}
