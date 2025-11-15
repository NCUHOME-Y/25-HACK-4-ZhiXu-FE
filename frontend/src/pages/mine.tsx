import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, UserPen, Settings, Trophy, Flame, Target, Star, MessageSquare, User } from 'lucide-react';
import { 
  BottomNav, 
  Card, 
  Avatar, 
  AvatarImage,
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
import { updateUserProfile } from '../services/mine.service';
import { toast } from 'sonner';

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
  const [profile, setProfile] = useState({
    nickname: '知序学习者',
    bio: '每天进步一点点,成为更好的自己',
    avatar: '/src/assets/images/screenshot_20251114_131601.png'
  });
  const [nickname, setNickname] = useState(profile.nickname);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);

  // ========== 计算属性 ========== 
  /** 已完成flag数量 */
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  /** 打卡总天数 */
  const totalPunchDays = useMemo(() => punchedDates.length, [punchedDates]);
  
  /** 积分数据 - 从后端API获取 */
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<Array<{id: number; isUnlocked: boolean}>>([]);
  
  // P1修复：从后端加载用户统计数据
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('未登录，跳过加载数据');
          return;
        }
        
        const { api } = await import('../services/apiClient');
        const userData = await api.get<{ 
          user: {
            count: number; 
            daka: number; 
            month_learn_time: number;
            name: string;
            email: string;
            head_show: number;
          }
        }>('/api/getUser');
        
        console.log('我的页面-用户数据:', userData);
        
        const user = userData.user;
        setPoints(user.count || 0);
        
        // 更新用户资料（昵称和头像）
        const avatarIndex = (user.head_show && user.head_show >= 1 && user.head_show <= 6) ? user.head_show - 1 : 0;
        const avatarPath = `/src/assets/images/screenshot_20251114_${['131601', '131629', '131937', '131951', '132014', '133459'][avatarIndex]}.png`;
        
        setProfile(prev => ({
          ...prev,
          nickname: user.name || prev.nickname,
          avatar: avatarPath
        }));
        
        setNickname(user.name || '');
        setAvatar(avatarPath);
        
        // 更新store中的打卡和学习时长数据
        useTaskStore.setState({
          dailyElapsed: (user.month_learn_time || 0) * 60 // 分钟转秒
        });
        
        // 加载打卡数据
        const { fetchPunchDates } = await import('../services/flag.service');
        const punchData = await fetchPunchDates();
        console.log('我的页面-打卡数据:', punchData);
        useTaskStore.setState({ punchedDates: punchData });
        
      } catch (error) {
        console.error('加载用户统计失败:', error);
      }
    };
    loadUserStats();
  }, []);
  
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
  
  // P1修复：加载用户成就系统
  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('未登录，使用默认徽章');
          return;
        }
        
        const { getUserAchievements } = await import('../services/mine.service');
        const data = await getUserAchievements();
        console.log('成就数据:', data);
        setBadges(data.achievements || []);
      } catch (error) {
        console.error('获取成就失败:', error);
      }
    };
    loadAchievements();
  }, []);
  
  /** 已获得徽章数 */
  const achievedBadges = badges.filter(b => b.isUnlocked).length;
  const totalBadges = badges.length > 0 ? badges.length : allBadges.length;
  
  // 合并后端成就数据和前端配置
  const displayBadges = badges.length > 0 
    ? badges.map((badge, index) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        isUnlocked: badge.isUnlocked,
        icon: allBadges[index % allBadges.length]?.icon || Trophy,
        color: allBadges[index % allBadges.length]?.color || 'blue'
      }))
    : allBadges.map(badge => ({
        ...badge,
        isUnlocked: false,
        description: ''
      }));
  
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
   * 预设头像列表 - 使用图片路径
   */
  const avatarOptions = [
    '/src/assets/images/screenshot_20251114_131601.png',
    '/src/assets/images/screenshot_20251114_131629.png',
    '/src/assets/images/screenshot_20251114_131937.png',
    '/src/assets/images/screenshot_20251114_131951.png',
    '/src/assets/images/screenshot_20251114_132014.png',
    '/src/assets/images/screenshot_20251114_133459.png'
  ];

  // ========== 事件处理器 ==========
  /**
   * 保存个人资料
   */ 
  const handleSaveProfile = async () => {
    // 保存到后端
    try {
      await updateUserProfile({ 
        nickname, 
        bio, 
        avatar 
      });
      setProfile({ nickname, bio, avatar });
      setEditDialogOpen(false);
      toast.success('个人信息更新成功');
    } catch (error) {
      console.error('保存个人资料失败:', error);
      toast.error('保存个人资料失败，请重试');
    }
  };

  /**
   * 选择头像
   * P1修复：调用后端切换头像 API
   */
  const handleSelectAvatar = async (selectedAvatar: string) => {
    const avatarIndex = avatarOptions.indexOf(selectedAvatar);
    if (avatarIndex !== -1) {
      try {
        const { switchAvatar } = await import('../services/set.service');
        await switchAvatar(avatarIndex);
        setAvatar(selectedAvatar);
        setAvatarPopoverOpen(false);
      } catch (error) {
        console.error('切换头像失败:', error);
        alert('切换头像失败，请重试');
      }
    }
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
                <AvatarImage src={avatar} alt="Avatar" />
                <AvatarFallback className="text-2xl font-bold text-white bg-blue-400">知</AvatarFallback>
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
                  {/* 前3个徽章 - 始终显示 */}
                  <div className="grid grid-cols-3 gap-4">
                    {displayBadges.slice(0, 3).map((badge) => {
                      const IconComponent = badge.icon;
                      return (
                        <Popover key={badge.id}>
                          <PopoverTrigger asChild>
                            <div 
                              className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer ${getBadgeColor(badge.color, badge.isUnlocked)}`}
                            >
                              <IconComponent className={`h-8 w-8 ${getIconColor(badge.color, badge.isUnlocked)}`} />
                              <span className="text-xs text-center">{badge.isUnlocked ? badge.name : '待解锁'}</span>
                            </div>
                          </PopoverTrigger>
                          {badge.isUnlocked && badge.description && (
                            <PopoverContent>
                              <div className="space-y-2">
                                <h4 className="font-semibold">{badge.name}</h4>
                                <p className="text-sm text-muted-foreground">{badge.description}</p>
                              </div>
                            </PopoverContent>
                          )}
                        </Popover>
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
                      {displayBadges.slice(3).map((badge) => {
                        const IconComponent = badge.icon;
                        return (
                          <Popover key={badge.id}>
                            <PopoverTrigger asChild>
                              <div 
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer ${getBadgeColor(badge.color, badge.isUnlocked)}`}
                              >
                                <IconComponent className={`h-8 w-8 ${getIconColor(badge.color, badge.isUnlocked)}`} />
                                <span className="text-xs text-center">{badge.isUnlocked ? badge.name : '待解锁'}</span>
                              </div>
                            </PopoverTrigger>
                            {badge.isUnlocked && badge.description && (
                              <PopoverContent>
                                <div className="space-y-2">
                                  <h4 className="font-semibold">{badge.name}</h4>
                                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                                </div>
                              </PopoverContent>
                            )}
                          </Popover>
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
                    <button className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity flex-shrink-0">
                      <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 rounded-2xl">
                    <div className="grid grid-cols-3 gap-3">
                      {avatarOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleSelectAvatar(option)}
                          className={`h-20 w-20 rounded-full flex items-center justify-center overflow-hidden transition-all ${
                            avatar === option 
                              ? 'ring-2 ring-blue-500' 
                              : 'hover:ring-2 hover:ring-slate-300'
                          }`}
                        >
                          <img src={option} alt="Avatar option" className="h-full w-full object-cover" />
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
