import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, UserPen, Settings, Trophy, Flame, Target, Star, MessageSquare, User } from 'lucide-react';
import { 
  BottomNav, 
  Card, 
  Avatar, 
  AvatarFallback,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Popover,
  PopoverContent,
  PopoverTrigger
} from "../components";
import { useTaskStore } from '../lib/stores/stores';

/**
 * 我的页面
 * 展示用户信息、成就、数据统计等
 */
export default function MinePage() {
  const navigate = useNavigate();
  
  // ========== 本地状态 ========== 
  // Zustand 全局状态
  const tasks = useTaskStore((s) => s.tasks);
  const punchedDates = useTaskStore((s) => s.punchedDates);
  
  // 本地UI状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [nickname, setNickname] = useState('知序学习者');
  const [bio, setBio] = useState('每天进步一点点，成为更好的自己');
  const [avatar, setAvatar] = useState('知');
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);

  // ========== 计算属性 ========== 
  /** 已完成flag数量 */
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  /** 打卡总天数 */
  const totalPunchDays = useMemo(() => punchedDates.length, [punchedDates]);
  
  /** 积分数据 - 从后端API获取 */
  const [points, _setPoints] = useState(0);
  const [badges, _setBadges] = useState<Array<{id: number; isUnlocked: boolean}>>([]);
  
  /** 已获得徽章数 */
  const achievedBadges = badges.filter(b => b.isUnlocked).length;
  const totalBadges = badges.length;
  
  // 所有徽章配置
  const allBadges = [
    { id: 0, name: '首次完成', icon: Trophy, color: 'blue' },
    { id: 1, name: '7天连卡', icon: Flame, color: 'green' },
    { id: 2, name: '任务大师', icon: Trophy, color: 'yellow' },
    { id: 3, name: '目标达成', icon: Target, color: 'purple' },
    { id: 4, name: '学习之星', icon: Star, color: 'orange' },
    { id: 5, name: '坚持不懈', icon: Trophy, color: 'red' },
    { id: 6, name: '效率达人', icon: Target, color: 'pink' },
    { id: 7, name: '专注大师', icon: Star, color: 'indigo' },
    { id: 8, name: '早起鸟', icon: Trophy, color: 'teal' },
    { id: 9, name: '夜猫子', icon: Star, color: 'cyan' },
    { id: 10, name: '完美主义', icon: Target, color: 'amber' },
    { id: 11, name: '全能选手', icon: Trophy, color: 'lime' },
  ];
  
  // 获取徽章的颜色类名
  const getBadgeColor = (color: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return 'bg-slate-50 dark:bg-slate-900/30 opacity-50';
    }
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 dark:bg-blue-950/30',
      green: 'bg-green-50 dark:bg-green-950/30',
      yellow: 'bg-yellow-50 dark:bg-yellow-950/30',
      purple: 'bg-purple-50 dark:bg-purple-950/30',
      orange: 'bg-orange-50 dark:bg-orange-950/30',
      red: 'bg-red-50 dark:bg-red-950/30',
      pink: 'bg-pink-50 dark:bg-pink-950/30',
      indigo: 'bg-indigo-50 dark:bg-indigo-950/30',
      teal: 'bg-teal-50 dark:bg-teal-950/30',
      cyan: 'bg-cyan-50 dark:bg-cyan-950/30',
      amber: 'bg-amber-50 dark:bg-amber-950/30',
      lime: 'bg-lime-50 dark:bg-lime-950/30',
    };
    return colorMap[color] || 'bg-slate-50';
  };
  
  const getIconColor = (color: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return 'text-slate-400';
    }
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600 dark:text-blue-400',
      green: 'text-green-600 dark:text-green-400',
      yellow: 'text-yellow-600 dark:text-yellow-400',
      purple: 'text-purple-600 dark:text-purple-400',
      orange: 'text-orange-600 dark:text-orange-400',
      red: 'text-red-600 dark:text-red-400',
      pink: 'text-pink-600 dark:text-pink-400',
      indigo: 'text-indigo-600 dark:text-indigo-400',
      teal: 'text-teal-600 dark:text-teal-400',
      cyan: 'text-cyan-600 dark:text-cyan-400',
      amber: 'text-amber-600 dark:text-amber-400',
      lime: 'text-lime-600 dark:text-lime-400',
    };
    return colorMap[color] || 'text-slate-400';
  };

  /**
   * 预设头像列表
   */
  const avatarOptions = ['知', '序', '学', '习', '者', '🎓', '📚', '✨'];

  // ========== 事件处理器 ==========
  /**
   * 保存个人资料
   */ 
  const handleSaveProfile = () => {
    // TODO: 保存到后端
    setEditDialogOpen(false);
  };

  /**
   * 选择头像
   */
  const handleSelectAvatar = (selectedAvatar: string) => {
    setAvatar(selectedAvatar);
    setAvatarPopoverOpen(false);
  };

  /**
   * 打开用户反馈
   */
  const handleFeedback = () => {
    // 腾讯文档反馈链接 - TODO: 替换为实际的腾讯文档链接
    const feedbackDocUrl = 'https://docs.qq.com/form/page/YOUR_FORM_ID';
    window.open(feedbackDocUrl, '_blank');
  };

  // ========== 渲染 ========== 
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 pb-24 space-y-4">
        {/* 页面标题 */}
        <div className="pt-6 pb-1 px-4">
          <div className="flex items-center gap-2">
            <User className="h-7 w-7 text-blue-500" />
            <h1 className="text-2xl font-bold">我的</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">个人中心，查看成就和设置</p>
        </div>

        {/* 用户信息卡片 */}
        <section className="pt-6 px-4">
          <Card className="p-4 rounded-xl">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600">
                <AvatarFallback className="text-2xl font-bold text-white bg-blue-400">{avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{nickname}</h2>
                <p className="text-sm text-muted-foreground mt-1">{bio}</p>
              </div>
            </div>
          </Card>
        </section>

        {/* 数据统计（压缩版） */}
        <section className="px-4">
          <h2 className="text-lg font-semibold mb-3">数据统计</h2>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 rounded-xl bg-blue-50 border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-1">{totalPunchDays}</div>
              <div className="text-xs text-muted-foreground">打卡总天数</div>
            </Card>
            <Card className="p-4 rounded-xl bg-green-50 border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-1">{completedCount}</div>
              <div className="text-xs text-muted-foreground">完成flag数</div>
            </Card>
            <Card className="p-4 rounded-xl bg-orange-50 border-orange-200">
              <div className="text-2xl font-bold text-orange-600 mb-1">{points}</div>
              <div className="text-xs text-muted-foreground">总积分</div>
            </Card>
          </div>
        </section>

        {/* 已获得徽章 */}
        <section className="px-4">
          <h2 className="text-lg font-semibold mb-3">已获得徽章 ({achievedBadges}/{totalBadges})</h2>
          <Card className="p-4 rounded-xl bg-white">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="badges" className="border-none">
                <div className="space-y-3">
                  {/* 前3个已获得的徽章 - 始终显示 */}
                  <div className="grid grid-cols-3 gap-4">
                    {allBadges.slice(0, 3).map((badge) => {
                      const badgeData = badges.find(b => b.id === badge.id);
                      const isUnlocked = badgeData?.isUnlocked || false;
                      const IconComponent = badge.icon;
                      return (
                        <div 
                          key={badge.id}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl ${getBadgeColor(badge.color, isUnlocked)}`}
                        >
                          <IconComponent className={`h-8 w-8 ${getIconColor(badge.color, isUnlocked)}`} />
                          <span className="text-xs text-center">{isUnlocked ? badge.name : '待解锁'}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 展开/收起按钮 */}
                  <AccordionTrigger className="hover:no-underline p-0 pt-2">
                    <span className="text-sm text-blue-600">
                      查看全部徽章
                    </span>
                  </AccordionTrigger>

                  {/* 展开后显示的剩余徽章 */}
                  <AccordionContent>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      {allBadges.slice(3).map((badge) => {
                        const badgeData = badges.find(b => b.id === badge.id);
                        const isUnlocked = badgeData?.isUnlocked || false;
                        const IconComponent = badge.icon;
                        return (
                          <div 
                            key={badge.id}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl ${getBadgeColor(badge.color, isUnlocked)}`}
                          >
                            <IconComponent className={`h-8 w-8 ${getIconColor(badge.color, isUnlocked)}`} />
                            <span className="text-xs text-center">{isUnlocked ? badge.name : '待解锁'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </div>
              </AccordionItem>
            </Accordion>
          </Card>
        </section>

        {/* 个人信息 */}
        <section className="px-4">
          <Card 
            className="p-4 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setEditDialogOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50">
                <UserPen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">个人信息</h3>
                <p className="text-xs text-muted-foreground">编辑头像、昵称、个人简介</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </section>

        {/* 用户反馈 */}
        <section className="px-4">
          <Card 
            className="p-4 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
            onClick={handleFeedback}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-50">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">用户反馈</h3>
                <p className="text-xs text-muted-foreground">向我们提出建议或报告问题</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </section>

        {/* 系统设置 */}
        <section className="pb-4 px-4">
          <Card 
            className="p-4 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate('/set')}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-50">
                <Settings className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">系统设置</h3>
                <p className="text-xs text-muted-foreground">通知、主题、隐私设置</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </section>
      </div>

      {/* 编辑个人信息 Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>编辑个人信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 头像和昵称在同一行 */}
            <div className="space-y-2">
              <Label>头像</Label>
              <div className="flex items-center gap-4">
                <Popover open={avatarPopoverOpen} onOpenChange={setAvatarPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white hover:opacity-90 transition-opacity flex-shrink-0">
                      {avatar}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 rounded-2xl">
                    <div className="grid grid-cols-4 gap-3">
                      {avatarOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleSelectAvatar(option)}
                          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
                            avatar === option 
                              ? 'bg-blue-100 dark:bg-blue-950 ring-2 ring-blue-500' 
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <div className="text-2xl font-bold">{option}</div>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="nickname" className="text-sm font-medium mb-2 block">昵称</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="请输入昵称"
                  />
                </div>
              </div>
            </div>

            {/* 个人简介 */}
            <div className="space-y-2">
              <Label htmlFor="bio">个人简介</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="请输入个人简介"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full px-6 py-2" 
              onClick={() => setEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              className="rounded-full px-6 py-2" 
              onClick={handleSaveProfile}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
