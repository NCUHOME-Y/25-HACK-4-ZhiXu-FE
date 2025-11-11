import { useMemo, useState, useEffect } from "react";
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
} from "../components";
import { ProgressRing } from "../components/feature/ProgressRing";
import { useTaskStore } from "../lib/stores/stores";
import { formatDateYMD, calculateStreak, calculateMonthlyPunches, formatElapsedTime } from "../lib/helpers/helpers";
import { useStudyTimer } from "../lib/hooks/hooks";
import { Plus, Pencil, Check, CheckCircle2 } from "lucide-react";
import type { PunchChartProps, TaskRingProps } from "../lib/types/types";
import { toast } from "sonner";

// ==================== 页面常量 ====================
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

// ==================== 页面级组件 ====================
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
      size={44} // 放大任务模块的环形进度条
      color="hsl(var(--chart-1))"
      showLabel={true}
    />
  );
};

// 打卡页面
export default function FlagPage() {
  // ======= 全局状态（Zustand Store） =======
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

  // ======= 页面本地状态 =======
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", detail: "", total: 1 });
  const [showError, setShowError] = useState(false);

  // ======= 自定义 Hooks =======
  // 学习计时器自动管理
  useStudyTimer(studying, increaseDailyElapsed);

  // Alert 显示状态管理
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertHiding, setAlertHiding] = useState(false);

  // Alert 自动消失 - 先添加消失动画类，再隐藏
  useEffect(() => {
    if (showError && !alertVisible) {
      setAlertVisible(true);
      setAlertHiding(false);
    } else if (!showError && alertVisible) {
      setAlertHiding(true);
      // 等待动画完成后隐藏
      const timer = setTimeout(() => {
        setAlertVisible(false);
        setAlertHiding(false);
      }, 300); // 动画时间
      return () => clearTimeout(timer);
    }
  }, [showError, alertVisible]);

  // 2秒后开始隐藏Alert
  useEffect(() => {
    if (alertVisible && !alertHiding) {
      const timer = setTimeout(() => {
        setShowError(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [alertVisible, alertHiding]);

  // ======= 计算属性 =======
  const streak = useMemo(() => calculateStreak(punchedDates), [punchedDates]);
  const monthlyPunches = useMemo(() => calculateMonthlyPunches(punchedDates), [punchedDates]);
  
  // 格式化每日累计时长为 HH:MM:SS
  const formatDailyTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  
  // 格式化本次学习时长
  const formatSessionTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      // 超过1小时显示 HH:MM:SS 缩小字号
      return {
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        isLong: true
      };
    } else {
      // 不足1小时显示 MM:SS
      return {
        time: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        isLong: false
      };
    }
  };
  
  const { minutes, seconds } = formatElapsedTime(sessionElapsed);
  const todayStr = useMemo(() => formatDateYMD(new Date()), []);
  const isPunchedToday = punchedDates.includes(todayStr);
  
  // 任务排序：未完成在前，完成的灰化并在后
  const orderedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [tasks]);

  // 任务完成统计
  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

  // ======= 事件处理器 =======
  // 任务记次
  const handleTickTask = (taskId: string) => {
    tickTaskInStore(taskId);
    // TODO: 接入后端 await tickTask(taskId)
  };

  // 保存任务（新建或编辑）
  const handleSaveTask = () => {
    if (!newTask.title.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    
    if (editingTaskId) {
      // 编辑模式 - 保存旧值用于撤销
      const oldTask = tasks.find(t => t.id === editingTaskId);
      updateTaskInStore(editingTaskId, newTask);
      
      toast.success("flag已更新", {
        action: oldTask ? {
          label: "撤销",
          onClick: () => {
            updateTaskInStore(editingTaskId, {
              title: oldTask.title,
              detail: oldTask.detail || "",
              total: oldTask.total || 1
            });
            toast.success("已撤销更新");
          }
        } : undefined
      });
      // TODO: 接入后端 await updateTask(editingTaskId, newTask)
    } else {
      // 新建模式 - 先创建,保存ID用于撤销
      const created = { id: String(Date.now()), ...newTask, count: 0, completed: false };
      addTask(created);
      
      toast.success("flag已创建", {
        action: {
          label: "撤销",
          onClick: () => {
            useTaskStore.getState().deleteTask(created.id);
            toast.success("已撤销创建");
          }
        }
      });
      // TODO: 接入后端 await createTask(newTask)
    }
    
    closeDrawer();
  };

  // 关闭抽屉并重置状态
  const closeDrawer = () => {
    setNewTask({ title: "", detail: "", total: 1 });
    setEditingTaskId(null);
    setShowError(false);
    setOpenDrawer(false);
  };

  // 开始编辑任务
  const startEditTask = (task: (typeof tasks)[0]) => {
    setEditingTaskId(task.id);
    setNewTask({ title: task.title, detail: task.detail || "", total: task.total || 1 });
    setOpenDrawer(true);
  };

  // 切换今日打卡状态
  const togglePunchToday = () => {
    togglePunchTodayInStore();
    // TODO: 接入后端 await togglePunch(formatDateYMD(new Date()))
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 错误提示 - 从屏幕下方飞到上方 */}
      {alertVisible && (
  <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[9999] w-11/12 max-w-md">
          <Alert variant="destructive" className={alertHiding ? 'alert-hide' : ''}>
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>flag概述不能为空</AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="flex-1 pb-24 px-4 space-y-4">
        {/* 顶部日历（中文版，自定义打卡样式） */}
        <section className="pt-3 -mx-4">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            className="w-full rounded-none border-0 border-y border-slate-200 shadow-none dark:border-slate-800"
            formatters={{
              formatMonthDropdown: (date) => date.toLocaleString("zh-CN", { month: "long" }),
              formatCaption: (date) => `${date.getFullYear()}年 ${date.toLocaleString("zh-CN", { month: "long" })}`,
              formatWeekdayName: (date) => WEEKDAY_NAMES[date.getDay()],
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
                    className={`relative ${isPastUnpunched ? "text-slate-400" : "text-black"} cursor-default pointer-events-none`}
                  >
                    <span>{children}</span>
                    {isPunched && <span className="absolute left-1 right-1 bottom-1 h-[3px] rounded bg-yellow-400" />}
                  </CalendarDayButton>
                );
              },
            }}
          />
        </section>

        {/* 打卡三模块（1/4 + 1/2 + 1/4 布局） - 固定高度 */}
        <section className="grid grid-cols-4 gap-3 -mx-4 h-24">
          {/* 模块1：打卡状态 (1/4宽度) */}
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

          {/* 模块2：坚持显示 (1/2宽度) - 透明背景无边框 */}
          <div className="col-span-2 px-2 py-2 flex flex-col justify-center gap-2 bg-transparent rounded-lg">
            {/* 第一行：已连续坚持 + 环形进度图 + 今日累计学习时长 */}
            <div className="w-full flex items-center justify-between">
              <div className="text-xs text-muted-foreground text-center leading-tight">已连续<br />坚持</div>
              <div className="flex-shrink-0">
                <PunchChart monthlyPunches={monthlyPunches} />
              </div>
              <div className="text-xs text-muted-foreground text-center leading-tight">今日累计<br />学习时长</div>
            </div>
            
            {/* 第二行：数据展示 */}
            <div className="w-full flex items-center justify-between px-1">
              <div className="text-base font-bold">{streak}天</div>
              <div className="text-base font-bold tabular-nums">
                {formatDailyTime(dailyElapsed)}
              </div>
            </div>
          </div>

          {/* 模块3：学习计时 (1/4宽度) */}
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

        {/* 今日flag标题与完成数 */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-base font-semibold">今日flag</h2>
          <div className="text-sm text-muted-foreground">
            {completedCount}/{tasks.length} 完成
          </div>
        </div>

        {/* flag列表 */}
        <section className="space-y-2">
          {orderedTasks.map((t) => {
            const isDone = !!t.completed;
            return (
              <Card key={t.id} className={`p-3 ${isDone ? "opacity-60 grayscale" : ""}`}>
                <div className="flex items-center gap-3">
                  <TaskRing count={t.count} total={t.total} />
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-medium truncate">{t.title}</div>
                    {t.detail && <div className="text-xs text-muted-foreground truncate">{t.detail}</div>}
                    <div className="text-xs text-muted-foreground">{isDone ? "已完成" : "未完成"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-8 w-8" 
                      onClick={() => !isDone && startEditTask(t)}
                      disabled={isDone}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => !isDone && handleTickTask(t.id)}
                      disabled={isDone}
                      title="记一次"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      </div>

      {/* 浮动新增按钮 */}
      <Button
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setOpenDrawer(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Drawer：新建flag */}
      <Drawer open={openDrawer} onOpenChange={(isOpen) => !isOpen && closeDrawer()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingTaskId ? "编辑flag" : "新建flag"}</DrawerTitle>
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
