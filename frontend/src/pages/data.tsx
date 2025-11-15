import { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, Flag, TrendingUp, Trophy } from 'lucide-react';
import { 
  BottomNav, 
  Card, 
  ChartRadialStacked,
  setChartData,
  ChartAreaDefault, 
  ChartPieLabel,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '../components';
import { ProgressRing } from '../components/feature/ProgressRing';
import { getStudyTrend } from '../services';
import { useTaskStore } from '../lib/stores/stores';
import { FLAG_LABELS } from '../lib/constants/constants';
import { calculateMonthlyPunches } from '../lib/helpers/helpers';
import type { StudyTrendData, FlagLabel } from '../lib/types/types';

/**
 * 打卡进度环形图组件
 */
const PunchChart = ({ monthlyPunches }: { monthlyPunches: number }) => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return (
    <ProgressRing
      current={monthlyPunches}
      total={daysInMonth}
      size={68}
      color="hsl(var(--chart-2))"
      labelTop={String(monthlyPunches)}
      labelBottom="本月"
    />
  );
};

/**
 * 数据统计页面
 * 展示打卡、Flag、学习时长等统计信息
 */
export default function DataPage() {
  // ========== 本地状态 ========== 
  const tasks = useTaskStore((s) => s.tasks); // 任务列表
  const punchedDates = useTaskStore((s) => s.punchedDates); // 打卡日期
  const dailyElapsed = useTaskStore((s) => s.dailyElapsed); // 每日学习时长（秒）
  const [studyTrendPeriod, setStudyTrendPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly'); // 学习趋势周期
  const [studyTrendData, setStudyTrendData] = useState<Array<{ label: string; value: number }>>([]); // 学习趋势数据
  const [loading, setLoading] = useState(true); // 加载状态
  
  // 计算本月打卡天数
  const monthlyPunches = useMemo(() => calculateMonthlyPunches(punchedDates), [punchedDates]);
  
  // 计算连续打卡天数
  const streak = useMemo(() => {
    if (punchedDates.length === 0) return 0;
    const sorted = [...punchedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    for (let i = 0; i < sorted.length; i++) {
      const date = new Date(sorted[i]);
      date.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
      if (date.getTime() === expectedDate.getTime()) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [punchedDates]);

  // 格式化学习时长
  const formatDailyTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h${m}m`;
    return `${m}min`;
  };

  // P1修复：从后端加载标签统计数据和用户数据
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('未登录，跳过加载数据');
          return;
        }
        
        // 加载标签统计
        const { getFlagLabels } = await import('../services/data.service');
        const labelData = await getFlagLabels();
        console.log('标签系统统计:', labelData);
        
        // 加载任务和打卡数据
        const { fetchTasks, fetchPunchDates } = await import('../services/flag.service');
        const [tasksData, punchData] = await Promise.all([
          fetchTasks(),
          fetchPunchDates()
        ]);
        
        console.log('数据页加载到的任务:', tasksData);
        console.log('数据页加载到的打卡:', punchData);
        
        // 更新store
        useTaskStore.setState({ 
          tasks: tasksData,
          punchedDates: punchData
        });
        
        // 加载用户统计数据
        const { api } = await import('../services/apiClient');
        const userData = await api.get<{ month_learn_time: number }>('/api/getUser');
        console.log('用户学习时长:', userData.month_learn_time);
        useTaskStore.setState({
          dailyElapsed: (userData.month_learn_time || 0) * 60 // 分钟转秒
        });
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);


  // ========== 副作用 ========== 
  /**
   * 加载学习趋势数据（根据选择的周期）
   */
  useEffect(() => {
    const loadStudyTrend = async () => {
      try {
        const data = await getStudyTrend(studyTrendPeriod);
        console.log(`加载${studyTrendPeriod}学习趋势:`, data);
        const formattedData = data.map((item: StudyTrendData) => ({
          label: item.label,
          value: item.duration
        }));
        setStudyTrendData(formattedData);
      } catch (err) {
        console.error('加载学习趋势失败:', err);
        setStudyTrendData([]);
      }
    };
    loadStudyTrend();
  }, [studyTrendPeriod]);


  // ========== 计算属性 ========== 
  /**
   * 计算本月打卡统计
   */
  const calculatedMonthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    // 本月打卡天数
    const monthlyPunches = punchedDates.filter(dateStr => {
      const date = new Date(dateStr);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    // 本月缺卡天数
    const missedDays = Math.max(0, now.getDate() - monthlyPunches);
    
    // 累计打卡天数（所有打卡记录）
    const totalPunchedDays = punchedDates.length;
    
    return {
      punchedDays: totalPunchedDays, // 累计打卡天数
      monthlyPunches, // 本月打卡天数
      missedDays: missedDays,
      totalStudyTime: Math.floor(dailyElapsed / 60) // 转分钟
    };
  }, [punchedDates, dailyElapsed]);

  /**
   * 计算 Flag 统计数据
   */
  const flagStats = useMemo(() => {
    const completedCount = tasks.filter(t => t.completed).length;
    const uncompletedCount = tasks.filter(t => !t.completed).length;
    const totalCount = tasks.length;
    
    // 标签分组统计
    const labelMap = new Map<FlagLabel, { completed: number; total: number }>();
    tasks.forEach(task => {
      if (task.label) {
        const current = labelMap.get(task.label) || { completed: 0, total: 0 };
        labelMap.set(task.label, {
          completed: current.completed + (task.completed ? 1 : 0),
          total: current.total + 1
        });
      }
    });
    const labelStats = Array.from(labelMap.entries()).map(([label, stats]) => ({
      label: FLAG_LABELS[label].name,
      labelName: FLAG_LABELS[label].name,
      color: FLAG_LABELS[label].color,
      completed: stats.completed,
      total: stats.total,
      percentage: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
    }));
    // 更新图表数据
    setChartData(completedCount, uncompletedCount);
    return { completedCount, uncompletedCount, totalCount, labelStats };
  }, [tasks]);

  /**
   * 格式化学习趋势数据，选择性显示标签
   */
  const formattedStudyTrendData = useMemo(() => {
    if (studyTrendData.length === 0) return [];
    
    if (studyTrendPeriod === 'weekly') {
      // 周视图：显示所有7天的标签
      return studyTrendData;
    } else if (studyTrendPeriod === 'monthly') {
      // 月视图：只在特定位置显示标签（1、6、11、16、21、26、30天）
      return studyTrendData.map((item, index) => {
        const shouldShowLabel = [0, 5, 10, 15, 20, 25, 29].includes(index);
        return {
          ...item,
          label: shouldShowLabel ? item.label : ''
        };
      });
    } else if (studyTrendPeriod === 'yearly') {
      // 年视图：每10个数据点显示一个标签
      return studyTrendData.map((item, index) => {
        const shouldShowLabel = index % 10 === 0;
        return {
          ...item,
          label: shouldShowLabel ? item.label : ''
        };
      });
    }
    return studyTrendData;
  }, [studyTrendData, studyTrendPeriod]);

  /**
   * 饼图数据转换
   */
  const pieChartData = useMemo(() => {
    if (!flagStats?.labelStats) return [];
    return flagStats.labelStats.map(stat => ({
      browser: stat.labelName,
      visitors: stat.completed,
      fill: stat.color
    }));
  }, [flagStats]);


  // ========== 工具函数 ========== 
  /**
   * 格式化学习时长（分钟转小时）
   */
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  /**
   * 获取周期描述文本
   */
  const getPeriodDescription = () => {
    switch (studyTrendPeriod) {
      case 'weekly':
        return '最近7天';
      case 'monthly':
        return '最近30天';
      case 'yearly':
        return '最近180天';
    }
  };

  // ========== 渲染 ========== 
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="flex-1 pb-24 px-4 flex items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 pb-24 space-y-4">
        {/* 页面标题 */}
        <div className="pt-6 pb-2 px-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-blue-500" />
            <h1 className="text-2xl font-bold">璇历</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">查看学习数据和统计信息</p>
        </div>

        {/* 打卡概览 */}
        <section className="px-4">
          <h2 className="text-lg font-semibold mb-3">打卡概览</h2>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50">
                <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{calculatedMonthlyStats.punchedDays}</div>
                <div className="text-xs text-muted-foreground mt-1">累计打卡</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-red-50">
                <Calendar className="h-6 w-6 text-red-600 mb-2" />
                <div className="text-2xl font-bold text-red-600">{calculatedMonthlyStats.missedDays}</div>
                <div className="text-xs text-muted-foreground mt-1">缺卡天数</div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-green-50">
                <Clock className="h-6 w-6 text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{Math.floor(calculatedMonthlyStats.totalStudyTime / 60)}</div>
                <div className="text-xs text-muted-foreground mt-1">累计时长(h)</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
              本月累计学习 {formatStudyTime(calculatedMonthlyStats.totalStudyTime)}
            </div>
          </Card>
        </section>

        {/* 数据统计模块 - 从 Flag 页面移动过来 */}
        <section className="px-4">
          <h2 className="text-lg font-semibold mb-3">学习数据</h2>
          <Card className="p-4">
            <div className="grid grid-cols-3 gap-4">
              {/* 连续打卡 */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                <Trophy className="h-7 w-7 text-amber-600 mb-2" />
                <div className="text-xs text-muted-foreground mb-1">已连续坚持</div>
                <div className="text-3xl font-bold text-amber-600">{streak}</div>
                <div className="text-xs text-muted-foreground mt-1">天</div>
              </div>
              
              {/* 本月打卡进度 */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <Calendar className="h-7 w-7 text-blue-600 mb-2" />
                <div className="text-xs text-muted-foreground mb-2">本月打卡进度</div>
                <PunchChart monthlyPunches={monthlyPunches} />
              </div>
              
              {/* 今日学习时长 */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <Clock className="h-7 w-7 text-green-600 mb-2" />
                <div className="text-xs text-muted-foreground mb-1">今日累计学习</div>
                <div className="text-3xl font-bold text-green-600 tabular-nums">
                  {formatDailyTime(dailyElapsed)}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Flag完成度 */}
        {flagStats && (
          <section className="px-4">
            <h2 className="text-lg font-semibold mb-3">Flag完成度</h2>
            <Card className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <Flag className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-lg font-bold">{flagStats.completedCount}</div>
                    <div className="text-xs text-muted-foreground">已完成</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                  <Flag className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-lg font-bold">{flagStats.uncompletedCount}</div>
                    <div className="text-xs text-muted-foreground">未完成</div>
                  </div>
                </div>
              </div>
              
              {/* 径向图 */}
              <div className="flex flex-col items-center -my-2">
                <ChartRadialStacked />
              </div>


              {/* 标签分类：无数据时显示“无标签 0%” */}
              <div className="space-y-2 border-t pt-3">
                <h3 className="text-sm font-semibold">标签分类</h3>
                {(flagStats.labelStats && flagStats.labelStats.length > 0)
                  ? flagStats.labelStats.map((stat) => (
                      <div key={stat.label} className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stat.color }}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-medium">{stat.labelName}</span>
                            <span className="tabular-nums font-semibold" style={{ color: stat.color }}>
                              {stat.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div 
                              className="h-full transition-all"
                              style={{ 
                                width: `${stat.percentage}%`,
                                backgroundColor: stat.color
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  : (
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-300" />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium">无标签</span>
                          <span className="tabular-nums font-semibold text-slate-400">0%</span>
                        </div>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full transition-all w-0 bg-slate-400" />
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* 已完成Flag分布饼图 */}
              {pieChartData.length > 0 && (
                <div className="border-t pt-3">
                  <h3 className="text-sm font-semibold mb-1">已完成Flag分布</h3>
                  <ChartPieLabel 
                    data={pieChartData}
                    title="已完成Flag分布"
                    description="不同标签类型的完成占比"
                    showFooter={false}
                  />
                </div>
              )}
            </Card>
          </section>
        )}

        {/* 学习趋势 */}
        <section className="px-4">
          <h2 className="text-lg font-semibold mb-3">学习趋势</h2>
          <Card>
            <Tabs value={studyTrendPeriod} onValueChange={(v: string) => setStudyTrendPeriod(v as typeof studyTrendPeriod)} className="w-full">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="weekly">周</TabsTrigger>
                  <TabsTrigger value="monthly">月</TabsTrigger>
                  <TabsTrigger value="yearly">年</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value={studyTrendPeriod} className="mt-0">
                <ChartAreaDefault 
                  data={formattedStudyTrendData}
                  title="学习时长"
                  description={getPeriodDescription() + '的累计学习时长'}
                  valueLabel="分钟"
                  showFooter={true}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
