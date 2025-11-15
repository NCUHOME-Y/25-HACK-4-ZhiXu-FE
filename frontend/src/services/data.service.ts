// import apiClient from './apiClient';
import type {
  MonthlyStats,
  FlagStats,
  StudyTrendData,
  PunchTypeStats,
  FlagLabel,
  // ApiResponse,
} from '../lib/types/types';

/**
 * 数据统计服务
 * 提供打卡、Flag、学习时长等统计数据的API接口
 */

/**
 * 获取本月统计数据(打卡天数、缺卡天数、累计学习时长)
 * P1修复：调用后端获取月度统计
 */
export async function getMonthlyStats(): Promise<MonthlyStats> {
  const { api } = await import('./apiClient');
  try {
    const [dakaTotal, monthDaka, learnTime] = await Promise.all([
      api.get<{ daka_total: number }>('/api/getdakatotal'),
      api.get<{ month_daka: number }>('/api/getmonthdaka'),
      api.get<{ month_learntime: number }>('/api/getLearnTimemonly')
    ]);
    
    const punchedDays = monthDaka.month_daka || 0;
    
    return {
      punchedDays,
      missedDays: Math.max(0, new Date().getDate() - punchedDays),
      totalStudyTime: learnTime.month_learntime || 0,
    };
  } catch (error) {
    console.error('获取月度统计失败:', error);
    return { punchedDays: 0, missedDays: 0, totalStudyTime: 0 };
  }
}

/**
 * 获取本月Flag统计（已完成、未完成数量）
 * P1修复：调用后端获取Flag统计
 */
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

/**
 * 获取学习时长趋势数据
 * P1修复：调用后端获取学习时长趋势
 * @param period 'weekly' | 'monthly' | 'yearly'
 */
export async function getStudyTrend(period: 'weekly' | 'monthly' | 'yearly'): Promise<StudyTrendData[]> {
  const { api } = await import('./apiClient');
  try {
    let endpoint = '/api/get7daylearntime';
    if (period === 'monthly') {
      endpoint = '/api/getLearnTimemonth';
    } else if (period === 'yearly') {
      endpoint = '/api/getLearnTime180days';
    }
    
    const response = await api.get<{ learn_times: Array<{ id: number; user_id: number; duration: number; created_at: string }> }>(endpoint);
    
    // 后端返回的是 LearnTime 模型数组，包含 created_at 字段
    if (!response.learn_times || response.learn_times.length === 0) {
      return [];
    }
    
    return response.learn_times.map((item, index) => {
      // 格式化日期标签
      const date = new Date(item.created_at);
      let label = '';
      
      if (period === 'weekly') {
        // 周视图：显示星期几
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        label = weekdays[date.getDay()];
      } else if (period === 'monthly') {
        // 月视图：显示日期
        label = `${date.getDate()}日`;
      } else {
        // 年视图：显示月-日
        label = `${date.getMonth() + 1}-${date.getDate()}`;
      }
      
      return {
        label,
        duration: item.duration || 0
      };
    });
  } catch (error) {
    console.error('获取学习趋势失败:', error);
    return [];
  }
}

/**
 * 获取打卡类型统计（主动/被动打卡对比）
 * 返回最近5周的数据
 */
export async function getPunchTypeStats(): Promise<PunchTypeStats[]> {
  // TODO: 接入后端 API
  // const response = await apiClient.get<ApiResponse<PunchTypeStats[]>>('/stats/punch-type');
  // if (!response.data.success || !response.data.data) {
  //   throw new Error(response.data.message || '获取打卡类型统计失败');
  // }
  // return response.data.data;

  // 默认空数据 - 5周的空数据
  return [
    { week: '第1周', active: 0, passive: 0 },
    { week: '第2周', active: 0, passive: 0 },
    { week: '第3周', active: 0, passive: 0 },
    { week: '第4周', active: 0, passive: 0 },
    { week: '第5周', active: 0, passive: 0 }
  ];
}

// P1修复:获取标签系统(Flag标签分类统计)
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
