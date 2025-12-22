import { useState } from 'react';
import { ArrowLeft, Trophy, Flame, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Avatar, AvatarImage, AvatarFallback, Button, Tabs, TabsList, TabsTrigger } from "../components";

import { useEffect } from 'react';
import rankService from '../services/rank.service';
import { getAvatarUrl } from '../lib/helpers/helpers';

// 封神榜用户数据
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
 * 封神榜页面
 * 毅力榜（按累计打卡天数）、勤勉榜（按完成Flag数量）、功德榜（按持有积分）
 */
export default function RankPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'days' | 'flags' | 'points'>('days');
  const [rankUsers, setRankUsers] = useState<RankUser[]>([]);
  const [currentUser, setCurrentUser] = useState<RankUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRankData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rankData, userData] = await Promise.all([
          rankService.getRankList(activeTab),
          rankService.getCurrentUserRank(activeTab)
        ]);
        setRankUsers(rankData || []);
        setCurrentUser(userData);
      } catch {
        setError('加载封神榜数据失败，请稍后重试');
        setRankUsers([]);
        setCurrentUser(null);
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
        rankService.getRankList(activeTab).then(setRankUsers).catch(() => {});
        rankService.getCurrentUserRank(activeTab).then(setCurrentUser).catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab]);

  /** 获取排名徽章图标 */
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank === 4) return '🏅';
    if (rank === 5) return '🏅';
    if (rank === 6) return '🏅';
    return rank;
  };

  /** 获取显示的数值 */
  const getDisplayValue = (user: RankUser) => {
    if (activeTab === 'days') return user.totalDays;
    if (activeTab === 'flags') return user.completedFlags;
    return user.totalPoints;
  };

  /** 获取单位 */
  const getUnit = () => {
    if (activeTab === 'days') return '天';
    if (activeTab === 'flags') return '个';
    return '分';
  };

  // ========== 渲染 ==========
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="px-4 py-4">
          <p className="text-gray-500 text-center">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-2xl mx-auto w-full">
          <nav className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200/50 shadow-sm">
            <div className="px-4 py-4 flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-gray-100 rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">封神榜</h1>
            </div>
          </nav>
          <div className="px-4 py-8 text-center space-y-4">
            <p className="text-red-600 font-medium">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
              重新加载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto w-full">
      {/* 顶部导航 */}
      <nav className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200/50 shadow-sm">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-gray-100 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">封神榜</h1>
        </div>
      </nav>

      {/* 内容区域 */}
      <div className="flex-1 px-4 py-4 space-y-4 mb-24">
        {/* 封神榜类型切换 */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'days' | 'flags' | 'points')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-xl p-1">
            <TabsTrigger 
              value="days" 
              className="flex items-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 data-[state=active]:font-medium"
            >
              <Flame className="h-4 w-4" />
              毅力榜
            </TabsTrigger>
            <TabsTrigger 
              value="flags" 
              className="flex items-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 data-[state=active]:font-medium"
            >
              <Trophy className="h-4 w-4" />
              勤勉榜
            </TabsTrigger>
            <TabsTrigger 
              value="points" 
              className="flex items-center gap-2 py-2.5 px-4 rounded-lg transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600 data-[state=active]:font-medium"
            >
              <Sparkles className="h-4 w-4" />
              功德榜
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 榜单说明 */}
        <div className="text-center py-2">
          <p className="text-sm text-gray-600">
            {activeTab === 'days' && '按累计打卡天数排名，体现坚持与毅力'}
            {activeTab === 'flags' && '按完成Flag数量排名，体现勤奋与执行力'}
            {activeTab === 'points' && '按持有积分排名，体现贡献与价值'}
          </p>
        </div>

        {/* 封神榜列表 - 固定显示前20名 */}
        <div className="space-y-2">
          {Array.from({ length: 20 }, (_, index) => {
            const user = rankUsers[index];
            const rank = index + 1;
            
            if (!user) {
              // 占位符：没有数据时显示空白但保留排名
              return (
                <Card key={`placeholder-${rank}`} className="p-4 bg-gray-50/50 border border-gray-100 opacity-60">
                  <div className="flex items-center gap-4">
                    {/* 排名 */}
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-gray-200 text-gray-400 text-sm">
                      {rank}
                    </div>
                    {/* 占位内容 */}
                    <div className="flex-1 flex items-center gap-3">
                      <Avatar className="w-10 h-10 bg-gray-300">
                        <AvatarFallback className="text-gray-400">-</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-gray-400 text-sm">暂无数据</div>
                        <div className="text-xs text-gray-300">等待上榜</div>
                      </div>
                    </div>
                    {/* 数据 */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-300">-</div>
                      <div className="text-xs text-gray-300">{getUnit()}</div>
                    </div>
                  </div>
                </Card>
              );
            }
            
            // 有数据时正常显示
            return (
            <Card key={user.id} className={`p-4 transition-all duration-200 hover:shadow-lg ${
              user.rank <= 3
                ? 'bg-gradient-to-r from-yellow-50/80 to-amber-50/40 border-2 shadow-md'
                : 'bg-white border border-gray-100 hover:border-gray-200'
            } ${
              user.rank === 1 ? 'border-yellow-300 shadow-yellow-100' :
              user.rank === 2 ? 'border-gray-300 shadow-gray-100' :
              user.rank === 3 ? 'border-amber-400 shadow-amber-100' :
              ''
            }`}>
              <div className="flex items-center gap-4">
                {/* 排名 */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                  user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 shadow-yellow-300' :
                  user.rank === 2 ? 'bg-gradient-to-br from-gray-300 via-slate-400 to-gray-500 shadow-gray-300' :
                  user.rank === 3 ? 'bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 shadow-amber-300' :
                  user.rank <= 6 ? 'bg-gradient-to-br from-orange-500 via-red-500 to-red-600 shadow-orange-300' :
                  'bg-gray-400 shadow-gray-200'
                }`}>
                  {getMedalIcon(user.rank)}
                </div>

                {/* 用户信息 */}
                <div className="flex-1 flex items-center gap-3">
                  <Avatar className="w-10 h-10 ring-1 ring-gray-200">
                    <AvatarImage src={getAvatarUrl(user.avatar)} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                      {user.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{user.name}</div>
                    <div className="text-sm text-gray-500 truncate">
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
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 pt-3 z-10">
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center gap-4">
              {/* 排名 */}
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold bg-blue-500 text-white shadow-lg">
                {currentUser.rank}
              </div>

              {/* 用户信息 */}
              <div className="flex-1 flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-2 ring-blue-300">
                  <AvatarImage src={getAvatarUrl(currentUser.avatar)} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                    {currentUser.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-blue-900">{currentUser.name}</div>
                  <div className="text-sm text-blue-700">
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
                <div className="text-xs text-blue-500 font-medium">
                  {getUnit()}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  </div>
);
}