import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Check, CheckCircle2, Plus } from 'lucide-react';
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
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '../components';
import { ProgressRing } from '../components/feature/ProgressRing';
import { useTaskStore } from '../lib/stores/stores';
import { formatDateYMD, calculateStreak, calculateMonthlyPunches, formatElapsedTime } from '../lib/helpers/helpers';
import { useStudyTimer } from '../lib/hooks/hooks';
import type { PunchChartProps, TaskRingProps } from '../lib/types/types';

/**
 * 打卡进度环形图组件
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
 */
const TaskRing = ({ count = 0, total = 1 }: TaskRingProps) => {
  return (
    <ProgressRing
      current={count}
      total={total}
      size={44}
      color="hsl(var(--chart-1))"
      showLabel={true}
    />
  );
};

export default function FlagPage() {
  // ========== 导航 ==========
  const navigate = useNavigate();
  
  // ========== Zustand 状态管理 ==========
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTaskInStore = useTaskStore((s) => s.updateTask);
  const tickTaskInStore = useTaskStore((s) => s.tickTask);
  
  const punchedDates = useTaskStore((s) => s.punchedDates);
  const togglePunchTodayInStore = useTaskStore((s) => s.togglePunchToday);
  
  const studying = useTaskStore((s) => s.studying);
  const dailyElapsed = useTaskStore((s) => s.dailyElapsed);
  const sessionElapsed = useTaskStore((s) => s.sessionElapsed);
  const startStudy = useTaskStore((s) => s.startStudy);
  const stopStudy = useTaskStore((s) => s.stopStudy);
  const increaseDailyElapsed = useTaskStore((s) => s.increaseDailyElapsed);

  // ========== 本地状态 ==========
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', detail: '', total: 1 });
  const [showError, setShowError] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertHiding, setAlertHiding] = useState(false);

  // ========== 副作用 ==========
  useStudyTimer(studying, increaseDailyElapsed);

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

  useEffect(() => {
    if (alertVisible && !alertHiding) {
      const timer = setTimeout(() => {
        setShowError(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [alertVisible, alertHiding]);

  // ========== 计算属性 ==========
  const streak = useMemo(() => calculateStreak(punchedDates), [punchedDates]);
  const monthlyPunches = useMemo(() => calculateMonthlyPunches(punchedDates), [punchedDates]);
  const todayStr = useMemo(() => formatDateYMD(new Date()), []);
  const isPunchedToday = punchedDates.includes(todayStr);
  
  const incompleteTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

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
   * 格式化本次学习时长,超过1小时返回长格式
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
  const handleTickTask = (taskId: string) => {
    tickTaskInStore(taskId);
    // TODO: 接入后端 await tickTask(taskId)
  };

  /**
   * 保存任务（新建或编辑）
   */
  const handleSaveTask = () => {
    if (!newTask.title.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    
    if (editingTaskId) {
      const oldTask = tasks.find(t => t.id === editingTaskId);
      updateTaskInStore(editingTaskId, newTask);
      
      toast.success('flag已更新', {
        action: oldTask ? {
          label: '撤销',
          onClick: () => {
            updateTaskInStore(editingTaskId, {
              title: oldTask.title,
              detail: oldTask.detail || '',
              total: oldTask.total || 1
            });
            toast.success('已撤销更新');
          }
        } : undefined
      });
      // TODO: 接入后端 await updateTask(editingTaskId, newTask)
    } else {
      const created = { id: String(Date.now()), ...newTask, count: 0, completed: false };
      addTask(created);
      
      toast.success('flag已创建', {
        action: {
          label: '撤销',
          onClick: () => {
            useTaskStore.getState().deleteTask(created.id);
            toast.success('已撤销创建');
          }
        }
      });
      // TODO: 接入后端 await createTask(newTask)
    }
    
    closeDrawer();
  };

  /**
   * 关闭抽屉并重置状态
   */
  const closeDrawer = () => {
    setNewTask({ title: '', detail: '', total: 1 });
    setEditingTaskId(null);
    setShowError(false);
    setOpenDrawer(false);
  };

  /**
   * 开始编辑任务
   */
  const startEditTask = (task: (typeof tasks)[0]) => {
    setEditingTaskId(task.id);
    setNewTask({ title: task.title, detail: task.detail || '', total: task.total || 1 });
    setOpenDrawer(true);
  };

  /**
   * 切换今日打卡状态
   */
  const togglePunchToday = () => {
    togglePunchTodayInStore();
    // TODO: 接入后端 await togglePunch(formatDateYMD(new Date()))
  };

  // ========== 渲染 ==========
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {alertVisible && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[9999] w-11/12 max-w-md">
          <Alert variant="destructive" className={alertHiding ? 'alert-hide' : ''}>
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>flag概述不能为空</AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="flex-1 pb-24 px-4 space-y-4">
        {/* 顶部日历 */}
        <section className="pt-3 -mx-4">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            className="w-full rounded-none border-0 border-y border-slate-200 shadow-none dark:border-slate-800"
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
        <section className="grid grid-cols-4 gap-3 -mx-4 h-24">
          <Card 
            className={`col-span-1 px-2 py-3 flex flex-col items-center justify-center gap-1.5 transition-all border-transparent ${
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

          <div className="col-span-2 px-2 py-2 flex flex-col justify-center gap-2 bg-transparent rounded-lg">
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
                <Card key={t.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <TaskRing count={t.count} total={t.total} />
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-medium truncate">{t.title}</div>
                      {t.detail && <div className="text-xs text-muted-foreground truncate">{t.detail}</div>}
                      <div className="text-xs text-muted-foreground">未完成</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8" 
                        onClick={() => startEditTask(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleTickTask(t.id)}
                        title="记一次"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              <div className="flex justify-center pt-2">
                <Button 
                  onClick={() => setOpenDrawer(true)} 
                  variant="outline"
                  className="rounded-full px-8"
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
                <Card key={t.id} className="p-3 opacity-60 grayscale">
                  <div className="flex items-center gap-3">
                    <TaskRing count={t.count} total={t.total} />
                    <div className="min-w-0 flex-1">
                      <div className="text-lg font-medium truncate">{t.title}</div>
                      {t.detail && <div className="text-xs text-muted-foreground truncate">{t.detail}</div>}
                      <div className="text-xs text-muted-foreground">已完成</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8" 
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
            <Input
              placeholder="flag概述"
              value={newTask.title}
              onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))}
            />
            <Textarea
              placeholder="flag详情（可选）"
              value={newTask.detail}
              onChange={(e) => setNewTask((s) => ({ ...s, detail: e.target.value }))}
            />
            <div>
              <div className="text-sm mb-1">选择日期</div>
              <Calendar23 />
            </div>
            <div>
              <div className="text-sm mb-1">总需次数</div>
              <Input
                type="number"
                min={1}
                value={newTask.total}
                onChange={(e) => setNewTask((s) => ({ ...s, total: Number(e.target.value || 1) }))}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSaveTask}>保存</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <BottomNav />
    </div>
  );
}
