import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Check, CheckCircle2, Plus, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  BottomNav,
  Card,
  Button,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  Input,
  Textarea,
  Calendar23,
  Calendar,
  CalendarDayButton,
  Alert,
  AlertDescription,
  AlertTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../components';
import { ProgressRing } from '../components/feature/ProgressRing';
import { useTaskStore } from '../lib/stores/stores';
import { formatDateYMD, calculateStreak, calculateMonthlyPunches, formatElapsedTime, calculateTaskPoints } from '../lib/helpers/helpers';
import { FLAG_LABELS, FLAG_PRIORITIES } from '../lib/constants/constants';
import type { PunchChartProps, TaskRingProps, FlagLabel, FlagPriority } from '../lib/types/types';
import contactService from '../services/contact.service';
import { addUserPoints, tickTask, createTask, updateTask, togglePunch } from '../services/flag.service';


/**
 * 打卡进度环形图组件
 * @param monthlyPunches 本月打卡天数
 */
const PunchChart = ({ monthlyPunches }: PunchChartProps) => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (
    <ProgressRing
      current={monthlyPunches}
      total={daysInMonth}
      size={56}
      color="hsl(var(--chart-2))"
      labelTop={String(monthlyPunches)}
      labelBottom="本月"
    />
  );
};

/**
 * 任务进度环组件
 * @param count 当前完成数
 * @param total 总数
 */
const TaskRing = ({ count = 0, total = 1 }: TaskRingProps) => (
  <ProgressRing
    current={count}
    total={total}
    size={44}
    color="hsl(var(--chart-1))"
    showLabel={true}
  />
);


export default function FlagPage() {
  // ========== 本地状态 ========== 
  const navigate = useNavigate();
  // Zustand 全局 store
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTaskInStore = useTaskStore((s) => s.updateTask);
  const deleteTaskInStore = useTaskStore((s) => s.deleteTask);
  const tickTaskInStore = useTaskStore((s) => s.tickTask);
  const punchedDates = useTaskStore((s) => s.punchedDates);
  const togglePunchTodayInStore = useTaskStore((s) => s.togglePunchToday);
  
  // P1修复：从后端加载任务和打卡数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 检查是否登录
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('未登录，跳过加载数据');
          return;
        }
        
        // 加载任务列表
        const { fetchTasks, fetchPunchDates } = await import('../services/flag.service');
        const [tasksData, punchData] = await Promise.all([
          fetchTasks(),
          fetchPunchDates()
        ]);
        
        console.log('加载到的任务数据:', tasksData);
        console.log('加载到的打卡数据:', punchData);
        
        // 更新store
        useTaskStore.setState({ 
          tasks: tasksData,
          punchedDates: punchData
        });
      } catch (error) {
        console.error('加载数据失败:', error);
        // 如果是401错误，可能token过期，跳转到登录页
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 401) {
            console.log('Token过期，需要重新登录');
            localStorage.removeItem('auth_token');
            navigate('/auth');
          }
        }
      }
    };
    loadData();
  }, [navigate]);
  const studying = useTaskStore((s) => s.studying);
  const dailyElapsed = useTaskStore((s) => s.dailyElapsed);
  const sessionElapsed = useTaskStore((s) => s.sessionElapsed);
  const startStudy = useTaskStore((s) => s.startStudy);
  const stopStudy = useTaskStore((s) => s.stopStudy);
  const increaseDailyElapsed = useTaskStore((s) => s.increaseDailyElapsed);

  // 本地 UI 状态
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    detail: '', 
    total: 1,
    label: 1 as FlagLabel,
    priority: 3 as FlagPriority,
    isPublic: false,
    points: 0
  });
  const [showError, setShowError] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertHiding, setAlertHiding] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ========== 副作用 ========== 
  // 错误提示动画副作用
  useEffect(() => {
    if (showError && !alertVisible) {
      setAlertVisible(true);
      setAlertHiding(false);
    } else if (!showError && alertVisible) {
      setAlertHiding(true);
      const timer = setTimeout(() => {
        setAlertVisible(false);
        setAlertHiding(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showError, alertVisible]);

  // 错误提示自动关闭副作用
  useEffect(() => {
    if (alertVisible && !alertHiding) {
      const timer = setTimeout(() => {
        setShowError(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [alertVisible, alertHiding]);

  // ========== 计算属性 ========== 
  /** 连续打卡天数 */
  const streak = useMemo(() => calculateStreak(punchedDates), [punchedDates]);
  /** 本月打卡天数 */
  const monthlyPunches = useMemo(() => calculateMonthlyPunches(punchedDates), [punchedDates]);
  /** 今日日期字符串 */
  const todayStr = useMemo(() => formatDateYMD(new Date()), []);
  /** 今日是否已打卡 */
  const isPunchedToday = punchedDates.includes(todayStr);
  /** 未完成flag列表，按优先级升序 */
  const incompleteTasks = useMemo(() =>
    tasks.filter((t) => !t.completed).sort((a, b) => (a.priority || 3) - (b.priority || 3)),
    [tasks]
  );
  /** 已完成flag列表 */
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  /** 已完成flag数量 */
  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  /** 学习计时格式化 */
  const { minutes, seconds } = formatElapsedTime(sessionElapsed);

  // ========== 工具函数 ========== 
  /**
   * 格式化每日累计时长为 HH:MM:SS
   */
  const formatDailyTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  /**
   * 格式化本次学习时长, 超过1小时返回长格式
   */
  const formatSessionTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return {
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        isLong: true
      };
    } else {
      return {
        time: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        isLong: false
      };
    }
  };

  // ========== 事件处理器 ========== 
  /**
   * 任务记次
   */
  const handleTickTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // 防止重复点击
    const button = document.activeElement as HTMLButtonElement;
    if (button) button.disabled = true;
    
    const willComplete = task.count !== undefined && task.total !== undefined && task.count + 1 >= task.total;
    
    tickTaskInStore(taskId);
    
    try {
      // 接入后端
      await tickTask(taskId);
      
      // 如果任务完成，计算并添加积分
      if (willComplete && task.points) {
        try {
          await addUserPoints(taskId, task.points);
          toast.success(`恭喜完成！获得 ${task.points} 积分 🎉`);
        } catch (error) {
          console.error('添加积分失败:', error);
        }
      }
    } catch (error) {
      console.error('更新任务失败:', error);
      toast.error('更新失败，请重试');
    } finally {
      // 恢复按钮
      if (button) button.disabled = false;
    }
  };

  /**
   * 保存任务（新建或编辑）
   */
  const handleSaveTask = async () => {
    if (!newTask.title.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    if (editingTaskId) {
      const oldTask = tasks.find(t => t.id === editingTaskId);
      const isPublicChanged = oldTask && oldTask.isPublic !== newTask.isPublic;
      
      updateTaskInStore(editingTaskId, newTask);
      
      // 处理分享/撤回逻辑
      if (isPublicChanged) {
        if (newTask.isPublic && !oldTask?.postId) {
          // 分享到社交页面
          try {
            const post = await contactService.createPostFromTask({
              id: editingTaskId,
              title: newTask.title,
              detail: newTask.detail,
              label: newTask.label,
              priority: newTask.priority
            });
            updateTaskInStore(editingTaskId, { ...newTask, postId: post.id });
            toast.success('flag已分享到翰林院论', {
              action: {
                label: '查看',
                onClick: () => navigate('/contact')
              }
            });
          } catch (error) {
            console.error('分享失败:', error);
            toast.error('分享失败，请检查网络连接');
          }
        } else if (!newTask.isPublic && oldTask?.postId) {
          // 撤回社交帖子
          try {
            await contactService.deletePost(oldTask.postId);
            updateTaskInStore(editingTaskId, { ...newTask, postId: undefined });
            toast.success('已从翰林院论撤回');
          } catch (error) {
            console.error('撤回失败:', error);
            toast.error('撤回失败，请稍后重试');
          }
        }
      }
      
      toast.success('flag已更新', {
        action: oldTask ? {
          label: '撤销',
          onClick: () => {
            updateTaskInStore(editingTaskId, {
              title: oldTask.title,
              detail: oldTask.detail || '',
              total: oldTask.total || 1,
              label: oldTask.label,
              priority: oldTask.priority,
              isPublic: oldTask.isPublic,
              postId: oldTask.postId
            });
            toast.success('已撤销更新');
          }
        } : undefined
      });
      // 接入后端
      await updateTask(editingTaskId, {
        title: newTask.title,
        detail: newTask.detail,
        label: newTask.label,
        priority: newTask.priority,
        total: newTask.total || 1,
        isPublic: newTask.isPublic
      });
    } else {
      // 如果没有设置积分，自动计算
      const points = calculateTaskPoints({
        total: newTask.total || 1,
        priority: newTask.priority || 3,
        difficulty: 'medium'
      });
      
      const created = { 
        id: String(Date.now()), 
        ...newTask,
        points, // 自动计算的积分
        count: 0, 
        completed: false 
      };
      addTask(created);
      
      // 如果设置为公开，自动分享到社交页面
      if (newTask.isPublic) {
        try {
          const post = await contactService.createPostFromTask({
            id: created.id,
            title: newTask.title,
            detail: newTask.detail,
            label: newTask.label,
            priority: newTask.priority
          });
          updateTaskInStore(created.id, { postId: post.id });
          toast.success('flag已创建并分享到翰林院论', {
            action: {
              label: '查看',
              onClick: () => navigate('/contact')
            }
          });
        } catch (error) {
          console.error('分享失败:', error);
          toast.success('flag已创建');
        }
      } else {
        toast.success('flag已创建', {
          action: {
            label: '撤销',
            onClick: () => {
              useTaskStore.getState().deleteTask(created.id);
              toast.success('已撤销创建');
            }
          }
        });
      }
      // 接入后端
      await createTask({
        title: newTask.title,
        detail: newTask.detail,
        total: newTask.total,
        label: String(newTask.label),  // 数字转字符串，service层会转换为中文名称
        priority: newTask.priority,
        points: newTask.points
      });
    }
    closeDrawer();
  };

  /**
   * 删除任务
   */
  const handleDeleteTask = async () => {
    if (!editingTaskId) return;
    const taskToDelete = tasks.find(t => t.id === editingTaskId);
    if (!taskToDelete) return;
    
    // 如果任务有关联的帖子，先删除帖子
    if (taskToDelete.postId) {
      try {
        await contactService.deletePost(taskToDelete.postId);
      } catch (error) {
        console.error('删除关联帖子失败:', error);
      }
    }
    
    deleteTaskInStore(editingTaskId);
    toast.success('flag已删除', {
      action: {
        label: '撤销',
        onClick: () => {
          addTask(taskToDelete);
          toast.success('已撤销删除');
        }
      }
    });
    // 接入后端 - 删除任务后端暂时不支持，只删除本地
    setDeleteDialogOpen(false);
    closeDrawer();
  };

  /**
   * 关闭抽屉并重置状态
   */
  const closeDrawer = () => {
    setNewTask({ 
      title: '', 
      detail: '', 
      total: 1,
      label: 1 as FlagLabel,
      priority: 3 as FlagPriority,
      isPublic: false,
      points: 0
    });
    setEditingTaskId(null);
    setShowError(false);
    setOpenDrawer(false);
  };

  /**
   * 开始编辑任务
   */
  const startEditTask = (task: (typeof tasks)[0]) => {
    setEditingTaskId(task.id);
    setNewTask({ 
      title: task.title, 
      detail: task.detail || '', 
      total: task.total || 1,
      label: task.label || 1,
      priority: task.priority || 3,
      isPublic: task.isPublic || false,
      points: task.points || 0
    });
    setOpenDrawer(true);
  };

  /**
   * 切换今日打卡状态
   */
  const togglePunchToday = async () => {
    togglePunchTodayInStore();
    // 接入后端
    try {
      await togglePunch(formatDateYMD(new Date()));
    } catch (error) {
      console.error('打卡失败:', error);
    }
  };

  // ========== 渲染 ==========
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {alertVisible && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[9999] w-11/12 max-w-md">
          <Alert variant="destructive" className={alertHiding ? 'alert-hide' : ''}>
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>flag概述不能为空</AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="flex-1 pb-24 space-y-4 px-4">
        {/* 页面标题 */}
        <div className="pt-6 pb-1 px-0">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-7 w-7 text-blue-500" />
            <h1 className="text-2xl font-bold">Flag</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">管理您的学习目标和任务</p>
        </div>

        {/* 顶部日历 */}
        <section className="pt-3">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            className="w-full rounded-xl border border-slate-200 shadow-sm"
            formatters={{
              formatMonthDropdown: (date) => date.toLocaleString('zh-CN', { month: 'long' }),
              formatCaption: (date) => `${date.getFullYear()}年 ${date.toLocaleString('zh-CN', { month: 'long' })}`,
              formatWeekdayName: (date) => ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
            }}
            components={{
              DayButton: ({ children, modifiers, day, ...props }) => {
                const dateObj = day.date;
                const dateStr = formatDateYMD(dateObj);
                const today = new Date();
                const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isPast = dateObj < startOfToday;
                const isPunched = punchedDates.includes(dateStr);
                const isPastUnpunched = isPast && !isPunched;

                return (
                  <CalendarDayButton
                    day={day}
                    modifiers={modifiers}
                    {...props}
                    className={`relative ${isPastUnpunched ? 'text-slate-400' : 'text-black'} cursor-default pointer-events-none`}
                  >
                    <span>{children}</span>
                    {isPunched && <span className="absolute left-1 right-1 bottom-1 h-[3px] rounded bg-yellow-400" />}
                  </CalendarDayButton>
                );
              },
            }}
          />
        </section>

        {/* 打卡三模块 */}
        <section className="grid grid-cols-4 gap-3 h-24">
          <Card 
            className={`col-span-1 px-2 py-3 flex flex-col items-center justify-center gap-1.5 transition-all border-transparent rounded-xl ${
              isPunchedToday ? 'shadow-none pointer-events-none cursor-default' : 'cursor-pointer active:scale-[0.98]'
            }`}
            onClick={isPunchedToday ? undefined : togglePunchToday}
          >
            <div className="text-xs font-medium text-center">每日打卡</div>
            <div className="text-sm font-semibold text-center leading-tight">
              今日<br />{isPunchedToday ? '已打卡' : '未打卡'}
            </div>
            {isPunchedToday && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
          </Card>

          <div className="col-span-2 px-2 py-2 flex flex-col justify-center gap-2 bg-white rounded-lg">
            <div className="w-full flex items-center justify-between">
              <div className="text-xs text-muted-foreground text-center leading-tight">已连续<br />坚持</div>
              <div className="flex-shrink-0">
                <PunchChart monthlyPunches={monthlyPunches} />
              </div>
              <div className="text-xs text-muted-foreground text-center leading-tight">今日累计<br />学习时长</div>
            </div>
            
            <div className="w-full flex items-center justify-between px-1">
              <div className="text-base font-bold">{streak}天</div>
              <div className="text-base font-bold tabular-nums">
                {formatDailyTime(dailyElapsed)}
              </div>
            </div>
          </div>

          <Card 
            className={`col-span-1 px-2 py-2 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-[0.98] transition-all border-transparent ${
              studying ? 'shadow-none' : ''
            }`}
            onClick={() => (studying ? stopStudy() : startStudy())}
          >
            <div className="text-xs font-medium text-center leading-tight">学习计时</div>
            {studying ? (
              <div className="text-xl font-bold tabular-nums leading-tight">{minutes}:{seconds}</div>
            ) : sessionElapsed > 0 ? (
              <>
                <div className="text-xs font-semibold leading-tight">学习中止</div>
                <div className="text-[10px] text-muted-foreground leading-tight">本次学习时长:</div>
                <div className={`font-bold tabular-nums leading-tight ${formatSessionTime(sessionElapsed).isLong ? 'text-xs' : 'text-base'}`}>
                  {formatSessionTime(sessionElapsed).time}
                </div>
              </>
            ) : (
              <div className="text-sm font-semibold leading-tight">学习开始</div>
            )}
          </Card>
        </section>

        {/* 今日flag标题 */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-base font-semibold">今日flag</h2>
          <div className="text-sm text-muted-foreground">
            {incompleteTasks.length > 0 ? `${completedCount}/${tasks.length} 完成` : '全部完成'}
          </div>
        </div>

        {/* 未完成flag列表 */}
        <section className="space-y-2">
          {incompleteTasks.length === 0 ? (
            <Empty className="border-none">
              <EmptyHeader>
                <EmptyTitle>还没有flag</EmptyTitle>
                <EmptyDescription>
                  点击下方按键创建你的flag
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button 
                  onClick={() => setOpenDrawer(true)} 
                  className="rounded-full px-8"
                >
                  <Plus />创建flag
                </Button>
                <button
                  onClick={() => navigate('/ai')}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  不知道立什么flag？点这找太傅(^▽^)
                </button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              {incompleteTasks.map((t) => (
                <Popover key={t.id}>
                  <PopoverTrigger asChild>
                    <Card className="p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-2">
                          <TaskRing count={t.count} total={t.total} />
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700 whitespace-nowrap">
                            未完成
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-lg font-medium truncate mb-1">{t.title}</div>
                          {t.detail && <div className="text-xs text-muted-foreground truncate mb-2">{t.detail}</div>}
                          <div className="flex items-center gap-2 flex-wrap">
                            {t.priority && (
                              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                                t.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                t.priority === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                t.priority === 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
                              }`}>
                                {FLAG_PRIORITIES[t.priority]}
                              </span>
                            )}
                            {t.label && (
                              <span 
                                className="inline-block px-2 py-0.5 text-xs font-medium rounded"
                                style={{ 
                                  backgroundColor: `${FLAG_LABELS[t.label].color}20`,
                                  color: FLAG_LABELS[t.label].color
                                }}
                              >
                                {FLAG_LABELS[t.label].name}
                              </span>
                            )}
                            {t.isPublic ? (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                                已分享
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                                未分享
                              </span>
                            )}
                          </div>
                        </div>
                        {/* 同一行竖直居中按钮组 */}
                        <div className="flex items-center gap-2 self-stretch" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50" 
                            onClick={() => startEditTask(t)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => handleTickTask(t.id)}
                            title="记一次"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-base mb-1">{t.title}</h4>
                        {t.detail && (
                          <p className="text-sm text-muted-foreground">{t.detail}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">进度</span>
                          <span className="font-medium">{t.count}/{t.total} 次</span>
                        </div>
                        
                        {t.priority && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">优先级</span>
                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                              t.priority === 1 ? 'bg-red-100 text-red-700' : 
                              t.priority === 2 ? 'bg-orange-100 text-orange-700' :
                              t.priority === 3 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {FLAG_PRIORITIES[t.priority]}
                            </span>
                          </div>
                        )}
                        
                        {t.label && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">类型</span>
                            <span 
                              className="inline-block px-2 py-0.5 text-xs font-medium rounded"
                              style={{ 
                                backgroundColor: `${FLAG_LABELS[t.label].color}20`,
                                color: FLAG_LABELS[t.label].color
                              }}
                            >
                              {FLAG_LABELS[t.label].name}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">分享状态</span>
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                            t.isPublic 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {t.isPublic ? '已分享' : '未分享'}
                          </span>
                        </div>
                        
                        {t.createdAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">创建时间</span>
                            <span className="text-xs">{new Date(t.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ))}
              
              <div className="flex justify-center pt-2 px-4">
                <Button 
                  onClick={() => setOpenDrawer(true)} 
                  className="rounded-full px-8 bg-blue-600 text-white hover:bg-blue-700 border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  创建flag
                </Button>
              </div>
            </>
          )}
        </section>

        {/* 已完成flag列表 */}
        {completedTasks.length > 0 && (
          <>
            <div className="flex items-center justify-between pt-6">
              <h2 className="text-base font-semibold">已完成flag</h2>
              <div className="text-sm text-muted-foreground">
                {completedTasks.length} 个
              </div>
            </div>
            
            <section className="space-y-2">
              {completedTasks.map((t) => (
                <Popover key={t.id}>
                  <PopoverTrigger asChild>
                    <Card className="p-3 opacity-60 grayscale rounded-xl cursor-pointer hover:opacity-80 transition-opacity">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-2">
                          <TaskRing count={t.count} total={t.total} />
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 whitespace-nowrap">
                            已完成
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-lg font-medium truncate mb-1">{t.title}</div>
                          {t.detail && <div className="text-xs text-muted-foreground truncate mb-2">{t.detail}</div>}
                          <div className="flex items-center gap-2 flex-wrap">
                            {t.priority && (
                              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                                t.priority === 1 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                                t.priority === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                t.priority === 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400'
                              }`}>
                                {FLAG_PRIORITIES[t.priority]}
                              </span>
                            )}
                            {t.label && (
                              <span 
                                className="inline-block px-2 py-0.5 text-xs font-medium rounded"
                                style={{ 
                                  backgroundColor: `${FLAG_LABELS[t.label].color}20`,
                                  color: FLAG_LABELS[t.label].color
                                }}
                              >
                                {FLAG_LABELS[t.label].name}
                              </span>
                            )}
                            {t.isPublic ? (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                                已分享
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                                未分享
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8 border-blue-200 text-blue-600" 
                            disabled
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            disabled
                            title="记一次"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-base mb-1">{t.title}</h4>
                        {t.detail && (
                          <p className="text-sm text-muted-foreground">{t.detail}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">进度</span>
                          <span className="font-medium text-green-600">{t.count}/{t.total} 次 (已完成)</span>
                        </div>
                        
                        {t.priority && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">优先级</span>
                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                              t.priority === 1 ? 'bg-red-100 text-red-700' : 
                              t.priority === 2 ? 'bg-orange-100 text-orange-700' :
                              t.priority === 3 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {FLAG_PRIORITIES[t.priority]}
                            </span>
                          </div>
                        )}
                        
                        {t.label && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">类型</span>
                            <span 
                              className="inline-block px-2 py-0.5 text-xs font-medium rounded"
                              style={{ 
                                backgroundColor: `${FLAG_LABELS[t.label].color}20`,
                                color: FLAG_LABELS[t.label].color
                              }}
                            >
                              {FLAG_LABELS[t.label].name}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">分享状态</span>
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                            t.isPublic 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {t.isPublic ? '已分享' : '未分享'}
                          </span>
                        </div>
                        
                        {t.createdAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">创建时间</span>
                            <span className="text-xs">{new Date(t.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ))}
            </section>
          </>
        )}
      </div>

      {/* Drawer：新建/编辑flag */}
      <Drawer open={openDrawer} onOpenChange={(isOpen) => !isOpen && closeDrawer()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingTaskId ? '编辑flag' : '新建flag'}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-3">
            <div>
              <Label htmlFor="flag-title">Flag概述</Label>
              <Input
                id="flag-title"
                placeholder="flag概述"
                value={newTask.title}
                onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="flag-detail">Flag详情（可选）</Label>
              <Textarea
                id="flag-detail"
                placeholder="flag详情（可选）"
                value={newTask.detail}
                onChange={(e) => setNewTask((s) => ({ ...s, detail: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="flag-label">类型标签</Label>
              <Select
                value={String(newTask.label)}
                onValueChange={(value: string) => setNewTask((s) => ({ ...s, label: Number(value) as FlagLabel }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="选择类型标签" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FLAG_LABELS).map(([value, { name }]) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="flag-priority">优先级</Label>
              <Select
                value={String(newTask.priority)}
                onValueChange={(value: string) => setNewTask((s) => ({ ...s, priority: Number(value) as FlagPriority }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FLAG_PRIORITIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="flag-date">选择日期</Label>
              <div className="mt-1">
                <Calendar23 />
              </div>
            </div>
            
            <div>
              <Label htmlFor="flag-total">每日完成次数</Label>
              <Input
                id="flag-total"
                type="number"
                min={1}
                value={newTask.total}
                onChange={(e) => setNewTask((s) => ({ ...s, total: Number(e.target.value || 1) }))}
                className="mt-1 [appearance:auto] [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100"
              />
            </div>

            {/* 发布到社交页面 + 寻太傅 + 删除按钮分布一行两端 */}
            <div className="flex items-center justify-between pt-2 w-full">
              <div className="flex items-center gap-2">
                <span className="relative inline-block h-4 w-4 mr-1">
                  <input
                    id="flag-public"
                    type="checkbox"
                    checked={newTask.isPublic}
                    onChange={(e) => setNewTask((s) => ({ ...s, isPublic: e.target.checked }))}
                    className="peer h-4 w-4 rounded border border-gray-300 appearance-none focus:ring-0 focus:outline-none bg-white checked:bg-blue-600 checked:border-blue-600"
                  />
                  <span
                    className="pointer-events-none absolute left-0 top-0 h-4 w-4 flex items-center justify-center"
                  >
                    {newTask.isPublic ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="16" height="16" rx="4" fill="#2563eb" />
                        <path d="M4 8.5L7 11.5L12 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : null}
                  </span>
                </span>
                <Label htmlFor="flag-public" className="cursor-pointer">
                  发布到社交页面（作为帖子分享）
                </Label>
              </div>
              <div className="flex items-center gap-2">
                {/* 寻太傅按钮 */}
                <Button
                  type="button"
                  className="h-7 px-6 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-none"
                  onClick={() => navigate('/ai')}
                >
                  寻太傅
                </Button>
                {/* 删除按钮（仅编辑时显示） */}
                {editingTaskId && (
                  <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-4 text-xs text-white bg-red-500 hover:bg-red-600 hover:text-white rounded-full"
                      >
                        删除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除这个flag吗？要不再试试坚持一下？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTask} className="bg-red-500 hover:bg-red-600 rounded-full px-8">
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSaveTask} className="rounded-full px-8">保存</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <BottomNav />
    </div>
  );
}
