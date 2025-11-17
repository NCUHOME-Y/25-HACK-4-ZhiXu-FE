import { api } from './apiClient';

// 预设头像列表
const PRESET_AVATARS = [
  '/assets/head/screenshot_20251114_131601.png',
  '/assets/head/screenshot_20251114_131629.png',
  '/assets/head/screenshot_20251114_131937.png',
  '/assets/head/screenshot_20251114_131951.png',
  '/assets/head/screenshot_20251114_132014.png',
  '/assets/head/screenshot_20251114_133459.png',
  '/assets/head/微信图片_20251115203432_32_227.jpg',
  '/assets/head/微信图片_20251115203433_33_227.jpg',
  '/assets/head/微信图片_20251115203434_34_227.jpg',
  '/assets/head/微信图片_20251115203434_35_227.jpg',
  '/assets/head/微信图片_20251115203435_36_227.jpg',
  '/assets/head/微信图片_20251115203436_37_227.jpg',
  '/assets/head/微信图片_20251116131024_45_227.jpg',
  '/assets/head/微信图片_20251116131024_46_227.jpg',
  '/assets/head/微信图片_20251116131025_47_227.jpg',
  '/assets/head/微信图片_20251116131026_48_227.jpg',
  '/assets/head/微信图片_20251116131027_49_227.jpg',
  '/assets/head/微信图片_20251116131028_50_227.jpg',
  '/assets/head/微信图片_20251116131029_51_227.jpg',
  '/assets/head/微信图片_20251116131030_52_227.jpg',
  '/assets/head/微信图片_20251116131031_53_227.jpg',
];

// 排行榜用户数据
export interface RankUser {
  user_id: number;
  rank: number;
  name: string;
  head_show?: number;
  daka?: number;           // 总打卡数
  flag_number?: number;    // 完成flag数量
  count?: number;          // 积分
  month_learn_time?: number; // 月学习时长
}

// 后端返回的用户数据需要转换为前端格式
interface FrontendRankUser {
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
  getRankList: async (type: 'days' | 'flags' | 'points'): Promise<FrontendRankUser[]> => {
    // 根据类型选择对应的后端 API
    let endpoint = '';
    if (type === 'days') {
      endpoint = '/api/dakaRanking';
    } else if (type === 'flags') {
      endpoint = '/api/getUseflagrRank';
    } else {
      endpoint = '/api/countranking';
    }
    
    const response = await api.get<{ data: RankUser[] }>(endpoint);
    
    // 转换为前端格式，使用全局 PRESET_AVATARS
    return response.data.map((user, index) => ({
      id: user.user_id.toString(),
      rank: index + 1,
      name: user.name,
      avatar: user.head_show ? `/api/avatar/${user.head_show}` : undefined,
      totalDays: user.daka || 0,
      completedFlags: user.flag_number || 0,
      totalPoints: user.count || 0
    }));
  },

  /**
   * 获取当前用户排名
   * @param type 排行榜类型: 'days' | 'flags' | 'points'
   */
  getCurrentUserRank: async (type: 'days' | 'flags' | 'points'): Promise<FrontendRankUser | null> => {
    try {
      // 获取当前用户信息
      const userResponse = await api.get<{ user: { user_id: number; name: string; email: string; head_show: number; daka: number; flag_number: number; count: number; month_learn_time: number } }>('/api/getUser');
      
      // 后端返回的数据结构是 { user: {...} }
      const user = userResponse.user;
      if (!user || !user.user_id) {
        console.error('用户信息无效', userResponse);
        return null;
      }
      
      // 获取排行榜列表来计算排名
      const rankList = await rankService.getRankList(type);
      const currentUserRank = rankList.find(u => u.id === user.user_id.toString());
      
      if (currentUserRank) {
        return currentUserRank;
      }
      
      // 如果不在前 20 名，手动构造数据
      return {
        id: user.user_id.toString(),
        rank: rankList.length + 1,
        name: user.name,
        avatar: user.head_show && user.head_show >= 1 && user.head_show <= PRESET_AVATARS.length ? PRESET_AVATARS[user.head_show - 1] : undefined,
        totalDays: user.daka || 0,
        completedFlags: user.flag_number || 0,
        totalPoints: user.count || 0
      };
    } catch (error) {
      console.error('获取当前用户排名失败:', error);
      return null;
    }
  }
};

export default rankService;