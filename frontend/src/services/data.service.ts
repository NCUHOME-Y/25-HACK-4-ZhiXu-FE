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
 * 获取本月统计数据（打卡天数、缺卡天数、累计学习时长）
 */
export async function getMonthlyStats(): Promise<MonthlyStats> {
  // TODO: 接入后端 API
  // const response = await apiClient.get<ApiResponse<MonthlyStats>>('/stats/monthly');
  // if (!response.data.success || !response.data.data) {
  //   throw new Error(response.data.message || '获取月度统计失败');
  // }
  // return response.data.data;

  // 暂时返回空数据，等待后端实现
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

  // 暂时返回空数据，等待后端实现
  return {
    completedCount: 0,
    uncompletedCount: 0,
    totalCount: 0,
  };
}

/**
 * 获取学习时长趋势数据
 * @param _period 'daily' | 'weekly' | 'monthly'
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getStudyTrend(_period: 'daily' | 'weekly' | 'monthly'): Promise<StudyTrendData[]> {
  // TODO: 接入后端 API
  // const response = await apiClient.get<ApiResponse<StudyTrendData[]>>(`/stats/study-trend?period=${_period}`);
  // if (!response.data.success || !response.data.data) {
  //   throw new Error(response.data.message || '获取学习趋势失败');
  // }
  // return response.data.data;

  // 暂时返回空数据，等待后端实现
  return [];
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

  // 暂时返回空数据，等待后端实现
  return [];
}
