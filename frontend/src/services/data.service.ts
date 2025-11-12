// import apiClient from './apiClient';
import type {
  MonthlyStats,
  FlagStats,
  StudyTrendData,
  PunchTypeStats,
  // ApiResponse,
} from '../lib/types/types';

/**
 * 数据统计服务
 * 提供打卡、Flag、学习时长等统计数据的API接口
 */

/**
 * 获取本月统计数据(打卡天数、缺卡天数、累计学习时长)
 */
export async function getMonthlyStats(): Promise<MonthlyStats> {
  // TODO: 接入后端 API
  // const response = await apiClient.get<ApiResponse<MonthlyStats>>('/stats/monthly');
  // if (!response.data.success || !response.data.data) {
  //   throw new Error(response.data.message || '获取月度统计失败');
  // }
  // return response.data.data;

  // 默认空数据
  return {
    punchedDays: 0,
    missedDays: 0,
    totalStudyTime: 0,
  };
}

/**
 * 获取本月Flag统计（已完成、未完成数量）
 */
export async function getFlagStats(): Promise<FlagStats> {
  // TODO: 接入后端 API
  // const response = await apiClient.get<ApiResponse<FlagStats>>('/stats/flags');
  // if (!response.data.success || !response.data.data) {
  //   throw new Error(response.data.message || '获取Flag统计失败');
  // }
  // return response.data.data;

  // 默认数据 - 固定的标签结构，数量为0
  return {
    completedCount: 0,
    uncompletedCount: 0,
    totalCount: 0,
    labelStats: [
      {
        label: 1,
        labelName: '学习提升',
        completed: 0,
        total: 0,
        percentage: 0,
        color: '#2563eb' // 蓝色
      },
      {
        label: 2,
        labelName: '健康运动',
        completed: 0,
        total: 0,
        percentage: 0,
        color: '#10b981' // 绿色
      },
      {
        label: 3,
        labelName: '工作效率',
        completed: 0,
        total: 0,
        percentage: 0,
        color: '#f59e0b' // 黄色
      },
      {
        label: 4,
        labelName: '兴趣爱好',
        completed: 0,
        total: 0,
        percentage: 0,
        color: '#8b5cf6' // 紫色
      },
      {
        label: 5,
        labelName: '生活习惯',
        completed: 0,
        total: 0,
        percentage: 0,
        color: '#ef4444' // 红色
      }
    ]
  };
}

/**
 * 获取学习时长趋势数据
 * @param period 'weekly' | 'monthly' | 'yearly'
 */
export async function getStudyTrend(period: 'weekly' | 'monthly' | 'yearly'): Promise<StudyTrendData[]> {
  // TODO: 接入后端 API
  // const response = await apiClient.get<ApiResponse<StudyTrendData[]>>(`/stats/study-trend?period=${period}`);
  // if (!response.data.success || !response.data.data) {
  //   throw new Error(response.data.message || '获取学习趋势失败');
  // }
  // return response.data.data;

  // 默认空数据 - 根据周期返回对应数量的0值数据点
  if (period === 'weekly') {
    // 周: 7个数据点
    return Array.from({ length: 7 }, () => ({
      label: '',
      duration: 0
    }));
  } else if (period === 'monthly') {
    // 月: 30个数据点
    return Array.from({ length: 30 }, () => ({
      label: '',
      duration: 0
    }));
  } else {
    // 年: 180个数据点
    return Array.from({ length: 180 }, () => ({
      label: '',
      duration: 0
    }));
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
