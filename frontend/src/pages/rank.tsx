import { useState } from 'react';
import { ArrowLeft, Trophy, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Avatar, AvatarImage, AvatarFallback, Button } from "../components";

// 排行榜用户数据
interface RankUser {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  totalDays: number;      // 打卡总天数
  completedFlags: number; // 完成flag总数
  totalPoints: number;    // 总积分
}

// 模拟20个用户数据
const generateMockUsers = (): RankUser[] => {
  const names = ['学霸小王', '自律达人', '目标大师', '时间管理者', '习惯养成家', '效率专家', '坚持者', '计划达人',
    '早起鸟', '健身达人', '阅读爱好者', '代码侠客', '英语达人', '数学天才', '运动健将', '学习狂人',
    '打卡王者', '进步青年', '奋斗者', '梦想追逐者'];
  
  return names.map((name, index) => ({
    id: String(index + 1),
    rank: index + 1,
    name,
    totalDays: 200 - index * 8,
    completedFlags: 150 - index * 6,
    totalPoints: 3000 - index * 120,
  }));
};

const mockRankUsers: RankUser[] = generateMockUsers();

// 当前用户数据（模拟第25名）
const currentUser: RankUser = {
  id: 'me',
  rank: 25,
  name: '我',
  totalDays: 88,
  completedFlags: 42,
  totalPoints: 1560,
};

export default function RankPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'days' | 'flags' | 'points'>('days');

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank === 4) return '🏅';
    if (rank === 5) return '🏅';
    if (rank === 6) return '🏅';
    return rank;
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-500 shadow-lg shadow-yellow-200';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 via-gray-200 to-slate-400 shadow-lg shadow-gray-200';
    if (rank === 3) return 'bg-gradient-to-br from-amber-700 via-amber-600 to-orange-700 shadow-lg shadow-amber-300';
    if (rank <= 6) return 'bg-gradient-to-br from-orange-600 via-orange-500 to-red-600 shadow-lg shadow-orange-300';
    return 'bg-slate-100 text-slate-600';
  };

  // 根据当前tab获取排序后的用户列表
  const getSortedUsers = () => {
    const sorted = [...mockRankUsers].sort((a, b) => {
      if (activeTab === 'days') return b.totalDays - a.totalDays;
      if (activeTab === 'flags') return b.completedFlags - a.completedFlags;
      return b.totalPoints - a.totalPoints;
    });
    return sorted.map((user, index) => ({ ...user, rank: index + 1 }));
  };

  // 获取显示的数值
  const getDisplayValue = (user: RankUser) => {
    if (activeTab === 'days') return user.totalDays;
    if (activeTab === 'flags') return user.completedFlags;
    return user.totalPoints;
  };

  // 获取单位
  const getUnit = () => {
    if (activeTab === 'days') return '天';
    if (activeTab === 'flags') return '个';
    return '分';
  };

  const sortedUsers = getSortedUsers();

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

        {/* 排行榜列表 */}
        <div className="space-y-3">
          {sortedUsers.map((user) => (
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
          ))}
        </div>
      </div>

      {/* 我的排名 - 固定在底部 */}
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
    </div>
  );
}
