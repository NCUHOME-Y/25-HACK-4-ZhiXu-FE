import { useState } from 'react';
import { ArrowLeft, Trophy, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Avatar, AvatarImage, AvatarFallback, Button } from "../components";

import { useEffect } from 'react';
import rankService from '../services/rank.service';

// 排行榜用户数据
interface RankUser {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  totalDays: number;
  completedFlags: number;
  totalPoints: number;
}

/**
 * 排行榜页面
 * 展示打卡总天数、完成Flag数、积分总数三个维度的排行榜
 */
export default function RankPage() {
  const navigate = useNavigate();

  // ========== 本地状态 ==========
  const [activeTab, setActiveTab] = useState<'days' | 'flags' | 'points'>('days');
  const [rankUsers, setRankUsers] = useState<RankUser[]>([]);
  const [currentUser, setCurrentUser] = useState<RankUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ========== 副作用 ==========
  useEffect(() => {
    const loadRankData = async () => {
      setLoading(true);
      try {
        const [rankData, userData] = await Promise.all([
          rankService.getRankList(activeTab),
          rankService.getCurrentUserRank(activeTab)
        ]);
        setRankUsers(rankData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('加载排行榜数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadRankData();
  }, [activeTab]);

  // 监听页面可见性，页面显示时重新加载数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 页面变为可见时，重新加载排行榜数据
        rankService.getRankList(activeTab).then(setRankUsers).catch(console.error);
        rankService.getCurrentUserRank(activeTab).then(setCurrentUser).catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab]);

  // ========== 工具函数 ==========
  /**
   * 获取排名徽章图标
   */
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank === 4) return '🏅';
    if (rank === 5) return '🏅';
    if (rank === 6) return '🏅';
    return rank;
  };

  /**
   * 获取排名徽章颜色
   */
  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-500 shadow-lg shadow-yellow-200';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 via-gray-200 to-slate-400 shadow-lg shadow-gray-200';
    if (rank === 3) return 'bg-gradient-to-br from-amber-700 via-amber-600 to-orange-700 shadow-lg shadow-amber-300';
    if (rank <= 6) return 'bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 shadow-lg shadow-orange-300';
    return 'bg-slate-100 text-slate-600';
  };

  /**
   * 获取显示的数值
   */
  const getDisplayValue = (user: RankUser) => {
    if (activeTab === 'days') return user.totalDays;
    if (activeTab === 'flags') return user.completedFlags;
    return user.totalPoints;
  };

  /**
   * 获取单位
   */
  const getUnit = () => {
    if (activeTab === 'days') return '天';
    if (activeTab === 'flags') return '个';
    return '分';
  };

  // ========== 渲染 ==========
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="px-4 py-4">
          <p className="text-muted-foreground text-center">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 顶部导航 */}
      <nav className="bg-white sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">排行榜</h1>
        </div>
      </nav>

      {/* 内容区域 */}
      <div className="flex-1 px-4 py-4 space-y-4 mb-20">
        {/* 排行榜类型切换 */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'days' ? 'default' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => setActiveTab('days')}
          >
            <Flame className="h-4 w-4" />
            打卡总天数
          </Button>
          <Button
            variant={activeTab === 'flags' ? 'default' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => setActiveTab('flags')}
          >
            <Trophy className="h-4 w-4" />
            完成Flag数
          </Button>
          <Button
            variant={activeTab === 'points' ? 'default' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => setActiveTab('points')}
          >
            ✨
            积分总数
          </Button>
        </div>

        {/* 排行榜列表 - 固定显示前20名 */}
        <div className="space-y-3">
          {Array.from({ length: 20 }, (_, index) => {
            const user = rankUsers[index];
            const rank = index + 1;
            
            if (!user) {
              // 占位符：没有数据时显示空白但保留排名
              return (
                <Card key={`placeholder-${rank}`} className="p-4 bg-gray-50 opacity-40">
                  <div className="flex items-center gap-4">
                    {/* 排名 */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-gray-200 text-gray-400">
                      {rank}
                    </div>
                    {/* 占位内容 */}
                    <div className="flex-1 flex items-center gap-3">
                      <Avatar className="w-10 h-10 bg-gray-300">
                        <AvatarFallback>-</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-400">暂无数据</div>
                        <div className="text-sm text-gray-300">等待上榜</div>
                      </div>
                    </div>
                    {/* 数据 */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-300">-</div>
                      <div className="text-xs text-gray-300">{getUnit()}</div>
                    </div>
                  </div>
                </Card>
              );
            }
            
            // 有数据时正常显示
            return (
            <Card key={user.id} className={`p-4 ${user.rank <= 6 ? 'border-2 bg-gradient-to-br from-white to-slate-50' : ''} ${user.rank === 1 ? 'border-yellow-300' : user.rank === 2 ? 'border-gray-300' : user.rank === 3 ? 'border-amber-600' : user.rank <= 6 ? 'border-orange-500' : ''}`}>
              <div className="flex items-center gap-4">
                {/* 排名 */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${getMedalColor(user.rank)}`}>
                  {getMedalIcon(user.rank)}
                </div>

                {/* 用户信息 */}
                <div className="flex-1 flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-slate-500">
                      {activeTab === 'days' && `打卡 ${user.totalDays} 天`}
                      {activeTab === 'flags' && `完成 ${user.completedFlags} 个Flag`}
                      {activeTab === 'points' && `获得 ${user.totalPoints} 积分`}
                    </div>
                  </div>
                </div>

                {/* 数据 */}
                <div className="text-right">
                  <div className={`font-bold ${user.rank <= 3 ? 'text-3xl' : 'text-2xl'} ${user.rank === 1 ? 'text-yellow-600' : user.rank === 2 ? 'text-gray-600' : user.rank === 3 ? 'text-amber-700' : user.rank <= 6 ? 'text-orange-600' : 'text-blue-600'}`}>
                    {getDisplayValue(user)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {getUnit()}
                  </div>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      </div>

      {/* 我的排名 - 固定在底部 */}
      {currentUser && (
        <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-4 z-10">
          <Card className="p-4 border-2 border-blue-500 shadow-lg">
            <div className="flex items-center gap-4">
              {/* 排名 */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-blue-100 text-blue-600">
                {currentUser.rank}
              </div>

              {/* 用户信息 */}
              <div className="flex-1 flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-blue-500">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback>{currentUser.name}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-blue-600">{currentUser.name}</div>
                  <div className="text-sm text-slate-500">
                    {activeTab === 'days' && `打卡 ${currentUser.totalDays} 天`}
                    {activeTab === 'flags' && `完成 ${currentUser.completedFlags} 个Flag`}
                    {activeTab === 'points' && `获得 ${currentUser.totalPoints} 积分`}
                  </div>
                </div>
              </div>

              {/* 数据 */}
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {getDisplayValue(currentUser)}
                </div>
                <div className="text-xs text-slate-400">
                  {getUnit()}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
