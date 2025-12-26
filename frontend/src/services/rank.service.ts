import { api } from './apiClient';
import type { GetUserResponse } from '../lib/types/types';

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
  '/assets/head/微信图片_20251117235910_62_227.jpg',
  '/assets/head/微信图片_20251117235910_63_227.jpg',
  '/assets/head/微信图片_20251117235911_64_227.jpg',
  '/assets/head/微信图片_20251117235912_65_227.jpg',
  '/assets/head/微信图片_20251117235913_66_227.jpg',
  '/assets/head/微信图片_20251117235914_67_227.jpg',
  '/assets/head/微信图片_20251117235915_68_227.jpg',
  '/assets/head/微信图片_20251117235916_69_227.jpg',
  '/assets/head/微信图片_20251117235917_71_227.jpg',
  '/assets/head/微信图片_20251118000147_72_227.jpg',
  '/assets/head/微信图片_20251118000148_74_227.jpg',
];

export interface RankUser {
  userId: number;
  rank: number;
  name: string;
  headShow?: number;
  daka?: number;           // 总打卡数
  flagNumber?: number;    // 完成flag数量
  count?: number;          // 积分
  monthLearnTime?: number;
}

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
   * 获取封神榜列表
   * @param type 封神榜类型: 'days' | 'flags' | 'points'
   */
  getRankList: async (type: 'days' | 'flags' | 'points'): Promise<FrontendRankUser[]> => {
    try {
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
      if (!response.data || !Array.isArray(response.data)) {
        console.error('封神榜数据格式错误:', response);
        return [];
      }
      
      return response.data.map((user, index) => ({
        id: user.userId.toString(),
        rank: index + 1,
        name: user.name,
        avatar: user.headShow ? `/api/avatar/${user.headShow}` : undefined,
        totalDays: user.daka || 0,
        completedFlags: user.flagNumber || 0,
        totalPoints: user.count || 0
      }));
    } catch (error) {
      console.error('获取封神榜列表失败:', error);
      return [];
    }
  },

  /**
   * 获取当前用户排名
   * @param type 封神榜类型: 'days' | 'flags' | 'points'
   */
  getCurrentUserRank: async (type: 'days' | 'flags' | 'points'): Promise<FrontendRankUser | null> => {
    try {
      // 获取当前用户信息
      const userResponse = await api.get<GetUserResponse>('/api/getUser');
      
      // 后端返回的数据结构是 { user: {...} }
      const user = userResponse.user;
      if (!user || !user.userId) {
        console.error('用户信息无效', userResponse);
        return null;
      }
      
      // 获取封神榜列表来计算排名
      const rankList = await rankService.getRankList(type);
      const currentUserRank = rankList.find(u => u.id === user.userId.toString());
      
      if (currentUserRank) {
        return currentUserRank;
      }
      
      // 如果不在前 20 名，手动构造数据
      return {
        id: user.userId.toString(),
        rank: rankList.length + 1,
        name: user.name,
        avatar: user.headShow && user.headShow >= 1 && user.headShow <= PRESET_AVATARS.length ? PRESET_AVATARS[user.headShow - 1] : undefined,
        totalDays: user.daka || 0,
        completedFlags: user.flagNumber || 0,
        totalPoints: user.count || 0
      };
    } catch (error) {
      console.error('获取当前用户排名失败:', error);
      return null;
    }
  }
};

export default rankService;