import { useMemo, useState, useEffect } from "react";
import type { CalendarDay, Modifiers } from "react-day-picker";
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
import { CircleProgress, TaskRing } from "../components/common/ProgressCircle";
import { useTaskStore } from "../lib/stores/stores";
import { formatDateYMD, calculateStreak, formatElapsedTime } from "../lib/helpers";
import { useStudyTimer } from "../lib/hooks";
import { Plus, Pencil, Check } from "lucide-react";

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
  const elapsed = useTaskStore((s) => s.elapsed);
  const startStudy = useTaskStore((s) => s.startStudy);
  const stopStudy = useTaskStore((s) => s.stopStudy);
  const increaseElapsed = useTaskStore((s) => s.increaseElapsed);

  // ======= 页面本地状态 =======
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", detail: "", total: 1 });
  const [showError, setShowError] = useState(false);

  // ======= 自定义 Hooks =======
  // 学习计时器自动管理
  useStudyTimer(studying, increaseElapsed);

  // Alert 自动消失
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  // ======= 计算属性 =======
  const streak = useMemo(() => calculateStreak(punchedDates), [punchedDates]);
  const { minutes, seconds } = formatElapsedTime(elapsed);
  
  // 任务排序：未完成在前，完成的灰化并在后
  const orderedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [tasks]);

  // ======= 事件处理器 =======
  // 任务记次
  const handleTickTask = async (taskId: string) => {
    tickTaskInStore(taskId);
    // TODO: 接入后端 await tickTask(taskId)
  };

  // 保存任务（新建或编辑）
  const handleSaveTask = async () => {
    if (!newTask.title.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    
    if (editingTaskId) {
      // 编辑模式
      updateTaskInStore(editingTaskId, newTask);
      // TODO: 接入后端 await updateTask(editingTaskId, newTask)
    } else {
      // 新建模式
      const created = { id: String(Date.now()), ...newTask, count: 0, completed: false };
      addTask(created);
      // TODO: 接入后端 await createTask(newTask)
    }
    
    setNewTask({ title: "", detail: "", total: 1 });
    setEditingTaskId(null);
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
      {/* 错误提示 - 悬浮在所有内容之上 */}
      {showError && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-11/12 max-w-md">
          <Alert variant="destructive">
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>任务概述不能为空</AlertDescription>
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
              formatMonthDropdown: (date) => {
                return date.toLocaleString("zh-CN", { month: "long" })
              },
              formatCaption: (date) => `${date.getFullYear()}年 ${date.toLocaleString("zh-CN", { month: "long" })}`,
              formatWeekdayName: (date) => {
                const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
                return weekdays[date.getDay()];
              },
            }}
            components={{
              DayButton: ({ children, modifiers, day, ...props }: { children?: React.ReactNode; modifiers: Modifiers; day: CalendarDay } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
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

        {/* 打卡双模块（两列） */}
        <section className="grid grid-cols-2 gap-3">
          {/* 模块1：打卡天数 + 环形图 */}
          <Card 
            className={`p-3 flex items-center gap-3 transition ${
              punchedDates.includes(formatDateYMD(new Date())) 
                ? 'opacity-60' 
                : 'active:scale-[0.98]'
            }`}
            onClick={punchedDates.includes(formatDateYMD(new Date())) ? undefined : togglePunchToday}
          >
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">每日打卡</div>
              <div className="text-xl font-semibold">
                {punchedDates.includes(formatDateYMD(new Date())) ? '今日已打卡' : `坚持第 ${streak} 天`}
              </div>
            </div>
            <CircleProgress value={Math.min(100, (streak / 30) * 100)} />
          </Card>

          {/* 模块2：学习计时 */}
          <Card className="p-3 flex items-center justify-between gap-3 active:scale-[0.98] transition">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">学习计时</div>
              {studying || elapsed > 0 ? (
                <div className="text-xl font-semibold tabular-nums">{minutes}:{seconds}</div>
              ) : (
                <div className="text-sm text-muted-foreground">点击开始后显示</div>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => (studying ? stopStudy() : startStudy())}
              className={studying ? "bg-red-500 hover:bg-red-500/90" : ""}
            >
              {studying ? "停止" : "开始"}
            </Button>
          </Card>
        </section>

        {/* 今日任务标题与完成数 */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-base font-semibold">今日任务</h2>
          <div className="text-sm text-muted-foreground">
            {tasks.filter((t) => t.completed).length}/{tasks.length} 完成
          </div>
        </div>

        {/* 任务列表 */}
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

      {/* Drawer：新建任务 */}
      <Drawer open={openDrawer} onOpenChange={(o) => { if (!o) { setEditingTaskId(null); setShowError(false); } setOpenDrawer(o); }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editingTaskId ? "编辑任务" : "新建任务"}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-3">
            <Input
              placeholder="任务概述"
              value={newTask.title}
              onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))}
            />
            <Textarea
              placeholder="任务详情（可选）"
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
