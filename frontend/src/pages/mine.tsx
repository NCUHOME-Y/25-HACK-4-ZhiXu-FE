import { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPen, Trophy, Flame, Target, Star, MessageSquare, User, Bell, Lock, Info, LogOut, Heart, CheckCircle, Award, BookOpen } from 'lucide-react'; // 移除未使用的 ChevronRight
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
import { useUser } from '../lib/stores/stores';
import { getUserAchievements } from '../services/mine.service';
import { toast } from 'sonner';
import { getAvatarUrl, AVATAR_FILES } from '../lib/helpers/helpers';
import { BirdMascot, Tutorial, startTutorial, shouldAutoStartTutorial } from '../components';
import { api } from '../services/apiClient';
import contactService from '../services/contact.service';
import { fetchPunchDates } from '../services/flag.service';
import { switchAvatar, updateNotificationEnabled, updateNotificationTime, updateFlagNotificationEnabled, changePassword } from '../services/mine.service';
import { authService } from '../services/auth.service';

// PWA BeforeInstallPromptEvent 类型定义
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * 我的页面
 * 展示用户信息、成就、数据统计等
 */
export default function MinePage() {
  const navigate = useNavigate();
  const { updateUserProfile: updateUserContextProfile } = useUser();
  
  const tasks = useTaskStore((s) => s.tasks);
  
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

  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [aboutPopoverOpen, setAboutPopoverOpen] = useState(false);
  const [teamPopoverOpen, setTeamPopoverOpen] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [tempNotificationHour, setTempNotificationHour] = useState('12');
  const [tempNotificationMinute, setTempNotificationMinute] = useState('00');
  const [flagNotificationEnabled, setFlagNotificationEnabled] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 累计完成Flag总数（从后端flag_number字段获取）
  const [completedCount, setCompletedCount] = useState(0);
  
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<Array<{id: number; name: string; description: string; isUnlocked: boolean}>>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  
  /** 加载用户统计数据 */
  const loadUserStats = useCallback(async () => {
    try {
      if (!authService.isAuthenticated()) {
        return;
      }
      // 获取用户基本信息
      const userData = await api.get<{ 
        user: {
          count: number; 
          daka: number; 
          monthLearnTime: number;
          name: string;
          email: string;
          headShow: number;
          isStudyRemind?: boolean;
          isFlagRemind?: boolean;
          studyRemindHour?: number;
          studyRemindMin?: number;
          flagNumber: number;
        }
      }>('/api/getUser');
      const user = userData.user;
      setPoints(user.count || 0);
      setCompletedCount(user.flagNumber || 0);
      // 使用后端headShow生成头像URL（后端提供/api/avatar/:id接口）
      const avatarPath = user.headShow ? `/api/avatar/${user.headShow}` : '';
      setProfile(prev => ({
        ...prev,
        nickname: user.name || prev.nickname,
        avatar: avatarPath
      }));
      setNickname(user.name || '');
      setAvatar(avatarPath);
      // 学习提醒总开关
      setNotificationEnabled(user.isStudyRemind ?? false);
      // Flag 提醒状态（后端可能返回 isFlagRemind）
      setFlagNotificationEnabled(user.isFlagRemind ?? false);
      const hour = (user.studyRemindHour ?? 12).toString().padStart(2, '0');
      const minute = (user.studyRemindMin ?? 0).toString().padStart(2, '0');
      setTempNotificationHour(hour);
      setTempNotificationMinute(minute);
      setHasUnsavedChanges(false);
      
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
      
      // 检查是否需要自动启动教程（仅新用户，积分0）
      if ((user.count || 0) === 0 && shouldAutoStartTutorial()) {
        setTimeout(() => startTutorial(), 500);
      }
    } catch (error) {
      console.error('加载用户统计失败:', error);
    }
  }, [setPoints, setProfile, setNickname, setAvatar, setNotificationEnabled, setFlagNotificationEnabled, setTempNotificationHour, setTempNotificationMinute, setHasUnsavedChanges, setTotalLikes]);

  // 加载任务数据并同步Flag提醒状态
  const loadTasks = useCallback(async () => {
    try {
      if (!authService.isAuthenticated()) {
        return;
      }
      const { fetchTasks } = await import('../services/flag.service');
      const tasksData = await fetchTasks();
      useTaskStore.setState({ tasks: tasksData });
    } catch (error) {
      console.error('加载任务数据失败:', error);
    }
  }, []);
  
  useEffect(() => {
    loadUserStats();
    loadTasks();
  }, [loadUserStats, loadTasks]);
  
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
  
  // PWA 安装事件监听
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      const installEvent = e as BeforeInstallPromptEvent;
      // 阻止默认的安装提示
      installEvent.preventDefault();
      // 保存事件，以便稍后触发
      setDeferredPrompt(installEvent);
    };

    const handleAppInstalled = () => {
      // 安装成功后隐藏按钮
      setDeferredPrompt(null);
      toast.success('知序已成功安装到您的设备！');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      // setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  
  // 监听页面可见性，实时更新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserStats();
        loadTasks();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadUserStats, loadTasks]);
  
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
        '个人中心，永不眠的自律助手！',
        '晚安，明天继续进步！',
        '成就收集，永无止境！',
      ] : []),
    ];
    
    const generalMessages = [
      '个人中心，记录你的每一次进步！',
      '成就系统等你来解锁！',
      '数据统计，量化你的努力！',
      '个人设置，让自律更舒适！',
      '徽章收集，证明你的坚持！',
      '积分系统，激励你的进步！',
      '个人中心，你的专属空间！',
      '成就之路，从这里开始！',
      '数据可视化，看得见的进步！',
      '个性化设置，打造专属体验！',
    ];
    
    return [...timeMessages, ...generalMessages];
  }, []);

  /** 保存个人资料 */
  const handleSaveProfile = async () => {
    // 防止重复提交
    if (isSaving) {
      return;
    }

    setIsSaving(true);

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

  /** 选择头像 */
  const handleSelectAvatar = async (selectedAvatar: string) => {
    // 直接本地切换头像
    const avatarIndex = AVATAR_FILES.indexOf(selectedAvatar);
    if (avatarIndex !== -1) {
      const avatarId = avatarIndex + 1;
      try {
        // 同步到后端头像索引
        await switchAvatar(avatarId);
        // 使用API路径统一头像表示
        const avatarPath = `/api/avatar/${avatarId}`;
        setAvatar(avatarPath);
        setProfile(prev => ({ ...prev, avatar: avatarPath }));
        setAvatarPopoverOpen(false);
        // 更新全局上下文（内部会分发 userUpdated）
        updateUserContextProfile({ avatar: avatarPath });
        // 重新加载用户数据以确保一致性
        await loadUserStats();
        toast.success('头像更改成功');
      } catch (error) {
        console.error('切换头像失败:', error);
        toast.error('切换头像失败，请重试');
      }
    }
  };

  /** 打开用户反馈 */
  const handleFeedback = () => {
    // 反馈链接地址从环境变量获取，默认值为正式文档
    const feedbackDocUrl = import.meta.env.VITE_FEEDBACK_URL
    window.open(feedbackDocUrl, '_blank');
  };

  /** 切换消息提醒 */
  const handleToggleNotification = async (enabled: boolean) => {
    try {
      await updateNotificationEnabled(enabled);
      setNotificationEnabled(enabled);
    } catch {
      // 忽略错误
    }
  };

  /** 切换 Flag 提醒（只控制用户是否接收 Flag 级别的提醒） */
  const handleToggleFlagNotification = async (enabled: boolean) => {
    try {
      await updateFlagNotificationEnabled(enabled);
      setFlagNotificationEnabled(enabled);
    } catch {
      // 忽略错误
    }
  };

  /** 更新提醒时间（临时状态）*/
  const handleUpdateNotificationTime = (hour: string, minute: string) => {
    setTempNotificationHour(hour);
    setTempNotificationMinute(minute);
    setHasUnsavedChanges(true);
  };

  /** 保存提醒时间设置 */
  const handleSaveNotificationTime = async () => {
    try {
      await updateNotificationTime(tempNotificationHour, tempNotificationMinute);
      setHasUnsavedChanges(false);
      toast.success('提醒时间设置已保存（邮件可能在垃圾箱）');
    } catch (error) {
      console.error('保存提醒时间失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  /** 验证密码强度 */
  const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: '密码长度至少需要8个字符' };
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    
    const typeCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (typeCount < 3) {
      return { valid: false, message: '密码必须包含大写字母、小写字母、数字、特殊符号中的至少三种' };
    }
    
    return { valid: true, message: '' };
  };

  /** 修改密码 */
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      alert(validation.message);
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

  /** 退出登录 */
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

  /** 安装 PWA 应用 */
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      try {
        // 自动显示安装提示
        await deferredPrompt.prompt();
        
        // 等待用户响应
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          toast.success('正在安装知序应用...');
        }
        
        // 清除 prompt，因为它只能使用一次
        setDeferredPrompt(null);
      } catch (error) {
        console.error('安装失败:', error);
        toast.error('安装失败，请稍后重试');
      }
    } else {
      // 检测浏览器类型并给出具体指引
      const userAgent = navigator.userAgent.toLowerCase();
      let installGuide = '';
      
      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        // Chrome 浏览器
        installGuide = '点击地址栏右侧的 ⊕ 图标或点击右上角 ⋮ 或浏览器菜单→ 安装知序或添加到主页';
      } else if (userAgent.includes('edg')) {
        // Edge 浏览器
        installGuide = '点击地址栏右侧的 ⊕ 图标或点击右上角 ⋯ 或浏览器菜单 → 应用 → 将此站点作为应用安装或添加到主页';
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        // Safari 浏览器
        installGuide = '点击底部分享按钮或浏览器菜单→ 添加到主屏幕或安装应用';
      } else if (userAgent.includes('firefox')) {
        // Firefox 浏览器
        installGuide = '点击地址栏的 ⊕ 图标或点击右上角 ≡ 或浏览器菜单→ 安装或添加到主页';
      } else {
        // 其他浏览器
        installGuide = '请使用浏览器菜单中的"安装应用"或"添加到主屏幕"功能';
      }
      
      toast.info(installGuide, {
        duration: 5000,
      });
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
                <AvatarImage src={getAvatarUrl(avatar)} alt="Avatar" />
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
                      <p className="text-xs text-muted-foreground">管理学习提醒和系统通知（邮件可能在垃圾箱）</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {/* 学习提醒（用户级） */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">学习提醒</Label>
                        <p className="text-xs text-muted-foreground">接收每日学习的邮件提醒</p>
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
                              保存学习提醒时间
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flag 提醒（用户是否允许接收 Flag 级别提醒） */}
                    <div className="pt-2 border-t border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Flag 提醒</Label>
                          <p className="text-xs text-muted-foreground">允许接收您开启的 Flag 的邮件提醒（由每个 Flag 单独设置时间）</p>
                        </div>
                        <Switch
                          checked={flagNotificationEnabled}
                          onCheckedChange={handleToggleFlagNotification}
                          className={
                            flagNotificationEnabled
                              ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:shadow-lg'
                              : 'bg-gray-200 border-gray-300'
                          }
                        />
                      </div>

                      {flagNotificationEnabled ? (
                        <div className="space-y-2 pt-4">
                          <Label className="text-sm font-medium">已开启提醒的 Flag（最多5个）</Label>
                          {tasks.filter(t => t.enableNotification && !t.completed).length === 0 ? (
                            <p className="text-xs text-muted-foreground">暂无开启提醒的 Flag，去 Flag 页面为任务开启提醒吧~</p>
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
                                    onClick={() => navigate('/flag')}
                                    className="text-xs px-2 h-7"
                                  >
                                    修改
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pt-3">
                          <p className="text-xs text-muted-foreground">当前未开启 Flag 提醒，启用后您将收到由每个 Flag 单独设置的提醒邮件。</p>
                        </div>
                      )}
                    </div>
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
            </div>
          </Card>
        </section>

        {/* 功能简介 */}
        <section className="px-4">
          <Card 
            className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
            onClick={() => {
              startTutorial();
              navigate('/flag');
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-50">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">功能简介</h3>
                <p className="text-xs text-muted-foreground">查看完整的功能介绍</p>
              </div>
            </div>
          </Card>
        </section>

        {/* 安装应用 */}
        <section className="px-4">
          <Card 
            className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer active:scale-[0.98]"
            onClick={handleInstallPWA}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">安装知序应用</h3>
                <p className="text-xs text-muted-foreground">添加到主屏幕，快速启动</p>
              </div>
            </div>
          </Card>
        </section>

        {/* 关于我们 */}
        <section className="px-4">
          <Card className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-200">
            <Popover open={aboutPopoverOpen} onOpenChange={setAboutPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-3 w-full text-left transition-all duration-200">
                  <div className="p-3 rounded-xl bg-green-50">
                    <Info className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">关于我们</h3>
                    <p className="text-xs text-muted-foreground">版本信息与协议</p>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80" side="bottom" align="start">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">版本信息</h4>
                    <p className="text-xs text-muted-foreground">知序 v1.2.2</p>
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
                              <p className="font-medium text-slate-900">研发</p>
                              <p className="text-slate-600">林方魁、吕宇轩</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">运营</p>
                              <p className="text-slate-600">赖心怡、温小蒙</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">设计</p>
                              <p className="text-slate-600">张渝旋</p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">产品</p>
                              <p className="text-slate-600">张清泽</p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
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
                  <img src={getAvatarUrl(avatar)} alt="Avatar" className="h-full w-full object-cover" />
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
              请输入旧密码和新密码。新密码至少需要8个字符，且包含大写字母、小写字母、数字、特殊符号中的至少三种。
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
                placeholder="请输入新密码（至少8位，含3种字符类型）"
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

      {/* 功能简介 - 自动管理显示 */}
      <Tutorial />

      <BottomNav />
    </div>
  );
}
