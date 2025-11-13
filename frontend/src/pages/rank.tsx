import { useState } from 'react';
import { ArrowLeft, Trophy, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav, Card, Avatar, AvatarImage, AvatarFallback, Button } from "../components";

// 排行榜用户数据
interface RankUser {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  completedFlags: number;
  streak: number;
}

const mockRankUsers: RankUser[] = [
  { id: '1', rank: 1, name: '学霸小王', completedFlags: 156, streak: 45 },
  { id: '2', rank: 2, name: '自律达人', completedFlags: 142, streak: 38 },
  { id: '3', rank: 3, name: '目标大师', completedFlags: 138, streak: 32 },
  { id: '4', rank: 4, name: '时间管理者', completedFlags: 125, streak: 28 },
  { id: '5', rank: 5, name: '习惯养成家', completedFlags: 118, streak: 25 },
  { id: '6', rank: 6, name: '效率专家', completedFlags: 105, streak: 22 },
  { id: '7', rank: 7, name: '坚持者', completedFlags: 98, streak: 19 },
  { id: '8', rank: 8, name: '计划达人', completedFlags: 92, streak: 17 },
];

export default function RankPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'completed' | 'streak' | 'points'>('completed');

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-orange-500';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-400';
    if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-700';
    return 'bg-slate-100';
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">排行榜</h1>
        </div>
      </nav>

      <div className="flex-1 pb-20 pt-14 px-4">
        {/* Tab 切换 */}
        <section className="mb-4">
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={activeTab === 'completed' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setActiveTab('completed')}
            >
              总完成数
            </Button>
            <Button
              variant={activeTab === 'streak' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setActiveTab('streak')}
            >
              连续天数
            </Button>
            <Button
              variant={activeTab === 'points' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setActiveTab('points')}
            >
              总积分
            </Button>
          </div>
        </section>

        {/* 排行榜列表 */}
        <section className="space-y-3">
          {mockRankUsers.map((user) => (
            <Card key={user.id} className="p-4 flex items-center gap-4">
              {/* 排名标识 */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                user.rank <= 3 ? getMedalColor(user.rank) + ' text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {getMedalIcon(user.rank)}
              </div>

              {/* 用户头像 */}
              <Avatar className="h-14 w-14">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>

              {/* 用户信息 */}
              <div className="flex-1">
                <div className="font-semibold text-base mb-1">{user.name}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    {user.completedFlags} 完成flag
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    {user.streak}天连续
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
