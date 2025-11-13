import { api } from './apiClient';

// 排行榜用户数据
export interface RankUser {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  totalDays: number;
  completedFlags: number;
  totalPoints: number;
}

const rankService = {
  /**
   * 获取排行榜列表
   * @param type 排行榜类型: 'days' | 'flags' | 'points'
   */
  getRankList: (type: 'days' | 'flags' | 'points') =>
    api.get<RankUser[]>(`/api/rank/${type}`),

  /**
   * 获取当前用户排名
   * @param type 排行榜类型: 'days' | 'flags' | 'points'
   */
  getCurrentUserRank: (type: 'days' | 'flags' | 'points') =>
    api.get<RankUser>(`/api/rank/${type}/me`)
};

export default rankService;