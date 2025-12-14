import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, UserPen, Trophy, Flame, Target, Star, MessageSquare, User, Bell, Lock, Info, LogOut, Heart, CheckCircle, Award } from 'lucide-react';
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
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Separator
} from "../components";
import { useTaskStore } from '../lib/stores/stores';
import { updateUserProfile } from '../services/mine.service';
import { useUser } from '../lib/stores/userContext';
import { getUserAchievements } from '../services/mine.service';
import { toast } from 'sonner';
import { getAvatarUrl, AVATAR_FILES } from '../lib/helpers/asset-helpers';
import { BirdMascot } from '../components/feature';
import { api } from '../services/apiClient';
import contactService from '../services/contact.service';
import { fetchPunchDates } from '../services/flag.service';
import { switchAvatar, updateNotificationEnabled, updateNotificationTime, changePassword } from '../services/set.service';
import { authService } from '../services/auth.service';

/**
 * 我的页面
 * 展示用户信息、成就、数据统计等
 */
export default function MinePage() {
  const navigate = useNavigate();
  const { updateUserProfile: updateUserContextProfile } = useUser();
  
  // ========== 本地状态 ========== 
  // Zustand 全局状态
  const tasks = useTaskStore((s) => s.tasks);
  
  // 本地UI状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [profile, setProfile] = useState({
    nickname: '知序学习者',
    bio: '每天进步一点点,成为更好的自己',
    avatar: '/api/avatar/1' // 使用后端头像API
  });
  const [nickname, setNickname] = useState(profile.nickname);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [avatarPopoverOpen, setAvatarPopoverOpen] = useState(false);

  // 修改密码状态
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 退出登录状态
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // 保存状态
  const [isSaving, setIsSaving] = useState(false);

  // 弹窗状态
  const [aboutPopoverOpen, setAboutPopoverOpen] = useState(false);
  const [teamPopoverOpen, setTeamPopoverOpen] = useState(false);

  // 消息提醒状态
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [tempNotificationHour, setTempNotificationHour] = useState('12');
  const [tempNotificationMinute, setTempNotificationMinute] = useState('00');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 计算属性
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  
  // 用户数据
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<Array<{id: number; name: string; description: string; isUnlocked: boolean}>>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  
  /**
   * 加载用户统计数据
   */
  const loadUserStats = async () => {
    try {
      if (!authService.isAuthenticated()) {
        return;
      }
      // 获取用户基本信息
      const userData = await api.get<{ 
        user: {
          count: number; 
          daka: number; 
          month_learn_time: number;
          name: string;
          email: string;
          head_show: number;
          is_remind: boolean;
          time_remind: number;
          min_remind: number;
        }
      }>('/api/getUser');
      const user = userData.user;
      setPoints(user.count || 0);
      // 使用后端head_show生成头像URL（后端提供/api/avatar/:id接口）
      const avatarPath = user.head_show ? `/api/avatar/${user.head_show}` : '';
      setProfile(prev => ({
        ...prev,
        nickname: user.name || prev.nickname,
        avatar: avatarPath
      }));
      setNickname(user.name || '');
      setAvatar(avatarPath);
      // 设置消息提醒状态
      setNotificationEnabled(user.is_remind ?? true);
      const hour = (user.time_remind ?? 12).toString().padStart(2, '0');
      const minute = (user.min_remind ?? 0).toString().padStart(2, '0');
      setTempNotificationHour(hour);
      setTempNotificationMinute(minute);
      setHasUnsavedChanges(false);
      // 🐛 修复：后端返回的 month_learn_time 已经是秒，不需要乘 60
      useTaskStore.setState({
        dailyElapsed: user.month_learn_time || 0 // 本月学习时长（秒）
      });
      
      // 获取点赞总数（静默失败）
      try {
        const likedPostIds = await contactService.getUserLikedPosts();
        setTotalLikes(likedPostIds.length);
      } catch (err) {
        console.warn('获取点赞数据失败:', err);
        setTotalLikes(0);
      }
      
      // 加载打卡数据（静默失败）
      try {
        const punchData = await fetchPunchDates();
        console.log('我的页面-打卡数据:', punchData);
        useTaskStore.setState({ punchedDates: punchData });
      } catch (err) {
        console.warn('获取打卡数据失败:', err);
      }
    } catch (error) {
      console.error('加载用户统计失败:', error);
    }
  };

  // 加载任务数据
  const loadTasks = async () => {
    try {
      if (!authService.isAuthenticated()) {
        console.log('未登录，跳过加载任务数据');
        return;
      }
      const { fetchTasks } = await import('../services/flag.service');
      const tasksData = await fetchTasks();
      console.log('我的页面-加载到的任务数据:', tasksData);
      useTaskStore.setState({ tasks: tasksData });
    } catch (error) {
      console.error('加载任务数据失败:', error);
    }
  };
  
  useEffect(() => {
    loadUserStats();
    loadTasks();
  }, []);
  
  // 所有徽章配置 - 使用useMemo以避免每次渲染都重新创建
  const allBadges = useMemo(() => [
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
    { id: 12, name: '学习狂人', icon: Star, color: 'violet' },
    { id: 13, name: '社交达人', icon: MessageSquare, color: 'rose' },
    { id: 14, name: '时间管理者', icon: Target, color: 'emerald' },
    { id: 15, name: '成就收集者', icon: Award, color: 'slate' },
  ], []);
  
  // P1修复：加载用户成就系统（支持实时刷新）
  const loadAchievementsData = useCallback(async () => {
    try {
      if (!authService.isAuthenticated()) {
        console.log('未登录，使用默认徽章');
        // 设置默认未解锁徽章
        setBadges(allBadges.map((badge, index) => ({
          id: index,
          name: badge.name,
          description: '待解锁',
          isUnlocked: false
        })));
        return;
      }
      
      const data = await getUserAchievements();
      
      // 如果后端返回空数组或无数据，使用默认未解锁徽章
      if (!data.achievements || data.achievements.length === 0) {
        setBadges(allBadges.map((badge, index) => ({
          id: index,
          name: badge.name,
          description: '待解锁',
          isUnlocked: false
        })));
      } else {
        // 后端返回了16个成就数据
        console.log(`✅ 加载了 ${data.achievements.length} 个成就`);
        setBadges(data.achievements);
      }
    } catch (error) {
      console.error('❌ 获取成就失败:', error);
      // 错误时也使用默认未解锁徽章
      setBadges(allBadges.map((badge, index) => ({
        id: index,
        name: badge.name,
        description: '待解锁',
        isUnlocked: false
      })));
    }
  }, [allBadges]);
  
  useEffect(() => {
    loadAchievementsData();
  }, [loadAchievementsData]);
  
  // 监听页面可见性，实时更新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[Mine] 页面可见，重新加载数据');
        loadUserStats();
        loadTasks();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  /** 已获得徽章数 */
  const achievedBadges = badges.filter(b => b.isUnlocked).length;
  const totalBadges = badges.length > 0 ? badges.length : allBadges.length;
  
  // 合并后端成就数据和前端配置，确保只显示16个成就
  const displayBadges = badges.length > 0 
    ? badges.slice(0, 16).map((badge, index) => ({
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
      return 'bg-slate-50 opacity-50';
    }
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50',
      green: 'bg-green-50',
      yellow: 'bg-yellow-50',
      purple: 'bg-purple-50',
      orange: 'bg-orange-50',
      red: 'bg-red-50',
      pink: 'bg-pink-50',
      indigo: 'bg-indigo-50',
      teal: 'bg-teal-50',
      cyan: 'bg-cyan-50',
      amber: 'bg-amber-50',
      lime: 'bg-lime-50',
      violet: 'bg-violet-50',
      rose: 'bg-rose-50',
      emerald: 'bg-emerald-50',
      slate: 'bg-slate-50',
    };
    return colorMap[color] || 'bg-slate-50';
  };
  
  const getIconColor = (color: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return 'text-slate-400';
    }
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      pink: 'text-pink-600',
      indigo: 'text-indigo-600',
      teal: 'text-teal-600',
      cyan: 'text-cyan-600',
      amber: 'text-amber-600',
      lime: 'text-lime-600',
      violet: 'text-violet-600',
      rose: 'text-rose-600',
      emerald: 'text-emerald-600',
      slate: 'text-slate-600',
    };
    return colorMap[color] || 'text-slate-400';
  };

  // 头像选项（1-32对应前端本地头像文件）
  const avatarOptions = AVATAR_FILES;

  // 鸟消息 - 针对mine页面的个人中心功能
  const messages = useMemo(() => {
    const hour = new Date().getHours();
    let timeKey = 'morning';
    if (hour < 6) timeKey = 'early';
    else if (hour < 12) timeKey = 'morning';
    else if (hour < 18) timeKey = 'afternoon';
    else if (hour < 22) timeKey = 'evening';
    else timeKey = 'night';
    
    const timeMessages = [
      ...(timeKey === 'early' ? [
        '这么早就来看个人中心了！',
        '早起的成就收集者！',
        '清晨的个人中心，最适合规划一天！',
        '早起的鸟儿有成就！',
      ] : []),
      ...(timeKey === 'morning' ? [
        '上午好！来看看今天的成就吧！',
        '早上是规划的好时机~',
        '个人中心等你来探索！',
        '早上好，成就收集者！',
      ] : []),
      ...(timeKey === 'afternoon' ? [
        '下午好！休息一下看看成就吧！',
        '个人中心，记录你的进步！',
        '下午茶时间，查看个人数据！',
        '成就之路，从个人中心开始！',
      ] : []),
      ...(timeKey === 'evening' ? [
        '晚上好！回顾一下今天的成就吧！',
        '个人中心，陪伴你每一天！',
        '晚上是总结的好时机~',
        '看看你又获得了哪些成就！',
      ] : []),
      ...(timeKey === 'night' ? [
        '夜深了，别忘了查看成就哦~',
        '个人中心，永不眠的学习伙伴！',
        '晚安，明天继续进步！',
        '成就收集，永无止境！',
      ] : []),
    ];
    
    const generalMessages = [
      '个人中心，记录你的每一次进步！',
      '成就系统等你来解锁！',
      '数据统计，量化你的努力！',
      '个人设置，让学习更舒适！',
      '徽章收集，证明你的坚持！',
      '积分系统，激励你的进步！',
      '个人中心，你的专属空间！',
      '成就之路，从这里开始！',
      '数据可视化，看得见的进步！',
      '个性化设置，打造专属体验！',
    ];
    
    return [...timeMessages, ...generalMessages];
  }, []);

  // ========== 事件处理器 ==========
  /**
   * 保存个人资料
   */ 
  const handleSaveProfile = async () => {
    // 防止重复提交
    if (isSaving) {
      console.log('[handleSaveProfile] 正在保存中，忽略重复点击');
      return;
    }

    setIsSaving(true);
    console.log('[handleSaveProfile] 开始保存个人资料');

    try {
      await updateUserProfile({
        nickname,
        bio,
        avatar,
        originalNickname: profile.nickname
      });
      setProfile({ nickname, bio, avatar });
      setEditDialogOpen(false);
      // 使用全局上下文统一更新并分发事件
      updateUserContextProfile({ name: nickname, avatar });
      toast.success('个人信息更新成功');
      console.log('[handleSaveProfile] 个人资料保存成功');
    } catch (error) {
      console.error('保存个人资料失败:', error);
      // 显示后端返回的具体错误消息
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('保存个人资料失败,请重试');
      }
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 选择头像
   */
  const handleSelectAvatar = async (selectedAvatar: string) => {
    // 直接本地切换头像
    const avatarIndex = AVATAR_FILES.indexOf(selectedAvatar);
    if (avatarIndex !== -1) {
      const avatarId = avatarIndex + 1;
      try {
        // 同步到后端头像索引
        await switchAvatar(avatarId);
        setAvatar(selectedAvatar);
        setProfile(prev => ({ ...prev, avatar: selectedAvatar }));
        setAvatarPopoverOpen(false);
        // 移除 loadUserStats 调用，减少不必要的网络请求
        // await loadUserStats();
        // 更新全局上下文（内部会分发 userUpdated）
        updateUserContextProfile({ avatar: selectedAvatar });
        toast.success('头像更改成功');
      } catch (error) {
        console.error('切换头像失败:', error);
        toast.error('切换头像失败，请重试');
      }
    }
  };

  /**
   * 打开用户反馈
   */
  const handleFeedback = () => {
    // 反馈链接地址从环境变量获取，默认值为正式文档
    const feedbackDocUrl = import.meta.env.VITE_FEEDBACK_URL
    window.open(feedbackDocUrl, '_blank');
  };

  /**
   * 切换消息提醒
   */
  const handleToggleNotification = async (enabled: boolean) => {
    try {
      await updateNotificationEnabled(enabled);
      setNotificationEnabled(enabled);
    } catch (error) {
      console.error('更新消息提醒状态失败:', error);
    }
  };

  /**
   * 更新提醒时间（临时状态）
   */
  const handleUpdateNotificationTime = (hour: string, minute: string) => {
    setTempNotificationHour(hour);
    setTempNotificationMinute(minute);
    setHasUnsavedChanges(true);
  };

  /**
   * 保存提醒时间设置
   */
  const handleSaveNotificationTime = async () => {
    try {
      await updateNotificationTime(tempNotificationHour, tempNotificationMinute);
      setHasUnsavedChanges(false);
      toast.success('提醒时间设置已保存');
    } catch (error) {
      console.error('保存提醒时间失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  /**
   * 修改密码
   */
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    if (newPassword.length < 6) {
      alert('密码长度至少6位');
      return;
    }
    try {
      await changePassword(oldPassword, newPassword);
      alert('密码修改成功');
      setChangePasswordDialogOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('修改密码失败:', error);
      alert('修改密码失败，请检查旧密码是否正确');
    }
  };

  /**
   * 退出登录
   */
  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('auth_token');
      setLogoutDialogOpen(false);
      navigate('/auth');
    } catch (error) {
      console.error('登出失败:', error);
      // 即使失败也清除token并跳转
      localStorage.removeItem('auth_token');
      setLogoutDialogOpen(false);
      navigate('/auth');
    }
  };

  // ========== 渲染 ========== 
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex-1 pb-24 space-y-3 max-w-2xl mx-auto w-full">
        {/* 页面标题 */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">我的</h1>
                <p className="text-sm text-slate-600">个人中心，查看成就和设置</p>
              </div>
            </div>
          </div>
        </header>

        {/* 用户信息卡片 */}
        <section className="pt-6 px-4">
          <Card className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-white shadow-lg">
                <AvatarImage src={typeof avatar === 'string' && avatar.startsWith('http') ? avatar : (typeof avatar === 'string' && avatar.startsWith('/api/avatar/') ? getAvatarUrl(avatar) : avatar)} alt="Avatar" />
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
          <h2 className="text-lg font-semibold mb-4">数据统计</h2>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200/50 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 flex flex-col items-center">
              <Heart className="h-7 w-7 mb-2 text-pink-500" />
              <div className="text-2xl font-bold text-pink-600 mb-1 text-center">{totalLikes}</div>
              <div className="text-xs text-muted-foreground text-center">获得点赞总数</div>
            </Card>
            <Card className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 flex flex-col items-center">
              <CheckCircle className="h-7 w-7 mb-2 text-green-500" />
              <div className="text-2xl font-bold text-green-600 mb-1 text-center">{completedCount}</div>
              <div className="text-xs text-muted-foreground text-center">完成flag数</div>
            </Card>
            <Card className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200 flex flex-col items-center">
              <Award className="h-7 w-7 mb-2 text-orange-500" />
              <div className="text-2xl font-bold text-orange-600 mb-1 text-center">{points}</div>
              <div className="text-xs text-muted-foreground text-center">总积分</div>
            </Card>
          </div>
        </section>

        {/* 已获得徽章 */}
        <section className="px-4 relative">
          <h2 className="text-lg font-semibold mb-4">已获得徽章 ({achievedBadges}/{totalBadges})</h2>
          {/* 小鸟绝对定位在Card上方，z-index低于Card内容 */}
          <BirdMascot position="mine" messages={messages} />
          <Card className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200" style={{position: 'relative', zIndex: 2}}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="badges" className="border-none">
                <div className="space-y-3">
                  {/* 展开/收起按钮 - 放在顶部 */}
                  <AccordionTrigger className="hover:no-underline p-0 pb-3">
                    <span className="text-sm text-blue-600">
                      查看全部徽章 ({totalBadges}个)
                    </span>
                  </AccordionTrigger>

                  {/* 前3个徽章 - 始终显示 */}
                  <div className="grid grid-cols-3 gap-4">
                    {displayBadges.slice(0, 3).map((badge) => {
                      const IconComponent = badge.icon;
                      return (
                        <Popover key={badge.id}>
                          <PopoverTrigger asChild>
                            <div 
                              className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${getBadgeColor(badge.color, badge.isUnlocked)}`}
                            >
                              <IconComponent className={`h-8 w-8 ${getIconColor(badge.color, badge.isUnlocked)}`} />
                              <span className="text-xs text-center">{badge.isUnlocked ? badge.name : '待解锁'}</span>
                            </div>
                          </PopoverTrigger>
                          {/* 无论是否解锁都弹出说明 */}
                          {badge.description && (
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

                  {/* 展开后显示的剩余徽章 */}
                  <AccordionContent>
                    <div className="grid grid-cols-3 gap-4 pt-2">
                      {displayBadges.slice(3).map((badge) => {
                        const IconComponent = badge.icon;
                        return (
                          <Popover key={badge.id}>
                            <PopoverTrigger asChild>
                              <div 
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${getBadgeColor(badge.color, badge.isUnlocked)}`}
                              >
                                <IconComponent className={`h-8 w-8 ${getIconColor(badge.color, badge.isUnlocked)}`} />
                                <span className="text-xs text-center">{badge.isUnlocked ? badge.name : '待解锁'}</span>
                              </div>
                            </PopoverTrigger>
                            {/* 无论是否解锁都弹出说明 */}
                            {badge.description && (
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

        {/* 消息提醒设置 */}
        <section className="px-4">
          <Card className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="notification" className="border-none">
                <AccordionTrigger className="hover:no-underline p-0">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-3 rounded-xl bg-green-50">
                      <Bell className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">消息提醒</h3>
                      <p className="text-xs text-muted-foreground">管理学习提醒和系统通知</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">启用消息提醒</Label>
                        <p className="text-xs text-muted-foreground">接收学习提醒和系统通知</p>
                      </div>
                      <Switch
                        checked={notificationEnabled}
                        onCheckedChange={handleToggleNotification}
                        className={
                          notificationEnabled
                            ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:shadow-lg'
                            : 'bg-gray-200 border-gray-300'
                        }
                      />
                    </div>
                    {notificationEnabled && (
                      <div className="space-y-3 pt-2 border-t border-gray-200/50">
                        <Label className="text-sm font-medium">提醒时间</Label>
                        <div className="flex gap-2">
                          <Select value={tempNotificationHour} onValueChange={(value) => handleUpdateNotificationTime(value, tempNotificationMinute)}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {Array.from({ length: 24 }, (_, i) => (
                                <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                                  {i.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-muted-foreground self-center">:</span>
                          <Select value={tempNotificationMinute} onValueChange={(value) => handleUpdateNotificationTime(tempNotificationHour, value)}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {Array.from({ length: 60 }, (_, i) => {
                                const minute = i.toString().padStart(2, '0');
                                return (
                                  <SelectItem key={minute} value={minute}>
                                    {minute}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        {hasUnsavedChanges && (
                          <div className="flex justify-end pt-2">
                            <Button 
                              size="sm" 
                              onClick={handleSaveNotificationTime}
                              className="rounded-xl px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            >
                              保存设置
                            </Button>
                          </div>
                        )}
                        
                        {/* Flag提醒列表 */}
                        <div className="space-y-2 pt-2 border-t border-gray-200/50">
                          <Label className="text-sm font-medium">开启提醒的Flag（最多5个）</Label>
                          {tasks.filter(t => t.enableNotification && !t.completed).length === 0 ? (
                            <p className="text-xs text-muted-foreground">暂无开启提醒的Flag，去圭表页面开启吧~</p>
                          ) : (
                            <div className="space-y-2">
                              {tasks.filter(t => t.enableNotification && !t.completed).map(task => (
                                <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{task.title}</p>
                                    <p className="text-xs text-muted-foreground">提醒时间：{task.reminderTime || '12:00'}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      // 跳转到flag页面进行修改
                                      navigate('/flag');
                                    }}
                                    className="text-xs px-2 h-7"
                                  >
                                    修改
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </section>

        {/* 个人信息 */}
        <section className="px-4">
          <Card 
            className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
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
            className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
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

        {/* 修改密码 */}
        <section className="px-4">
          <Card 
            className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
            onClick={() => setChangePasswordDialogOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-50">
                <Lock className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">修改密码</h3>
                <p className="text-xs text-muted-foreground">定期修改密码保护账户安全</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </section>

        {/* 关于我们 */}
        <section className="px-4">
          <Card className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-200">
            <Popover open={aboutPopoverOpen} onOpenChange={setAboutPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-3 w-full text-left hover:bg-slate-50 rounded-lg p-2 transition-all duration-200">
                  <div className="p-2 rounded-lg bg-green-50">
                    <Info className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">关于我们</h3>
                    <p className="text-xs text-muted-foreground">版本信息与协议</p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="bottom" align="start">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">版本信息</h4>
                    <p className="text-xs text-muted-foreground">知序 v1.0.0</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <button className="text-sm text-blue-600 hover:underline block">
                      用户协议
                    </button>
                    <button className="text-sm text-blue-600 hover:underline block">
                      隐私政策
                    </button>
                    <button className="text-sm text-blue-600 hover:underline block">
                      开源许可
                    </button>
                    <Popover open={teamPopoverOpen} onOpenChange={setTeamPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button className="text-sm text-blue-600 hover:underline block">
                          制作团队
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72" side="right" align="start">
                        <div className="space-y-3">
                          <h4 className="font-medium">制作团队</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="font-medium text-slate-900">前端开发</p>
                              <p className="text-slate-600">React + TypeScript</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">后端开发</p>
                              <p className="text-slate-600">Go + Gin</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">UI/UX设计</p>
                              <p className="text-slate-600">Tailwind CSS + shadcn/ui</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">项目管理</p>
                              <p className="text-slate-600">敏捷开发</p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-1">联系我们</h4>
                    <p className="text-xs text-muted-foreground">support@zhixu.com</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </Card>
        </section>

        {/* 退出登录 */}
        <section className="pb-4 px-4">
          <Button
            variant="outline"
            className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 rounded-xl"
            onClick={() => setLogoutDialogOpen(true)}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </section>
      </div>

      {/* 编辑个人信息 Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto rounded-3xl bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold text-slate-900">编辑个人信息</DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-1">
              修改您的头像、昵称和个人简介
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 头像和昵称在同一行 */}
            <div className="space-y-2">
              <Label>头像</Label>
              <div className="flex items-center gap-4">
                {/* 头像选择 - 使用居中 Dialog 替代 Popover，确保水平垂直居中 */}
                <button
                  onClick={() => setAvatarPopoverOpen(true)}
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  <img src={typeof avatar === 'string' && avatar.startsWith('http') ? avatar : (typeof avatar === 'string' && avatar.startsWith('/api/avatar/') ? getAvatarUrl(avatar) : avatar)} alt="Avatar" className="h-full w-full object-cover" />
                </button>

                <Dialog open={avatarPopoverOpen} onOpenChange={setAvatarPopoverOpen}>
                  <DialogContent className="sm:max-w-[480px] w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto rounded-3xl bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl p-6">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-bold text-slate-900">选择头像</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-4 py-2">
                      {avatarOptions.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectAvatar(option)}
                          className={`h-20 w-20 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                            avatar === option 
                              ? 'ring-3 ring-blue-500 shadow-lg scale-105' 
                              : 'hover:ring-2 hover:ring-slate-300 shadow-md'
                          }`}
                        >
                          <img src={option} alt="Avatar option" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <DialogFooter className="pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setAvatarPopoverOpen(false)} 
                        className="rounded-2xl px-6 py-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all duration-200 hover:scale-105"
                      >
                        取消
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="nickname" className="text-sm font-medium mb-2 block">昵称</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="请输入昵称"
                    className="rounded-2xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                className="rounded-2xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 pt-4">
            <Button 
              variant="outline" 
              className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl px-6 py-2 transition-all duration-200 hover:scale-105" 
              onClick={() => setEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              className="rounded-2xl px-6 py-2 bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改密码 Dialog */}
      <Dialog open={changePasswordDialogOpen} onOpenChange={setChangePasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)] rounded-3xl bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold text-slate-900">修改密码</DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-1">
              请输入旧密码和新密码。新密码长度至少6位。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">旧密码</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入旧密码"
                className="rounded-2xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                className="rounded-2xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认新密码</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="rounded-2xl border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-3 pt-4">
            <Button 
              variant="outline" 
              className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl px-6 py-2 transition-all duration-200 hover:scale-105"
              onClick={() => {
                setChangePasswordDialogOpen(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              取消
            </Button>
            <Button 
              className="rounded-2xl px-6 py-2 bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              onClick={handleChangePassword}
            >
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退出登录确认 Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="rounded-3xl max-w-[320px] mx-4 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg font-bold text-slate-900">确认退出</DialogTitle>
            <DialogDescription className="text-sm text-slate-600 mt-1">
              确定要退出登录吗？退出后需要重新登录才能使用。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-4">
            <Button 
              variant="outline" 
              className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl px-6 py-2 transition-all duration-200 hover:scale-105"
              onClick={() => setLogoutDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              variant="destructive" 
              className="rounded-2xl px-6 py-2 bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg text-white"
              onClick={handleLogout}
            >
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
