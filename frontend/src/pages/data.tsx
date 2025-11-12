import { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, Flag } from 'lucide-react';
import { 
  BottomNav, 
  Card, 
  ChartRadialStacked,
  setChartData,
  ChartAreaDefault, 
  ChartBarMultiple,
  ChartPieLabel,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '../components';
import { getMonthlyStats, getFlagStats, getStudyTrend, getPunchTypeStats } from '../services';
import type { MonthlyStats, FlagStats, StudyTrendData, PunchTypeStats } from '../lib/types/types';

/**
 * 数据统计页面
 * 展示打卡、Flag、学习时长等统计信息
 */
export default function DataPage() {
  // ========== 本地状态 ==========
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [flagStats, setFlagStats] = useState<FlagStats | null>(null);
  const [studyTrendPeriod, setStudyTrendPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [studyTrendData, setStudyTrendData] = useState<Array<{ label: string; value: number }>>([]);
  const [punchTypeData, setPunchTypeData] = useState<Array<{ category: string; value1: number; value2: number }>>([]);
  const [loading, setLoading] = useState(true);

  // ========== 副作用 ==========
  /**
   * 加载月度统计数据
   */
  useEffect(() => {
    const loadMonthlyStats = async () => {
      try {
        const data = await getMonthlyStats();
        setMonthlyStats(data);
        // TODO: 接入后端 await getMonthlyStats()
      } catch (err) {
        console.error('加载月度统计失败:', err);
        setMonthlyStats({ punchedDays: 0, missedDays: 0, totalStudyTime: 0 });
      }
    };
    loadMonthlyStats();
  }, []);

  /**
   * 加载Flag统计数据
   */
  useEffect(() => {
    const loadFlagStats = async () => {
      try {
        const data = await getFlagStats();
        setFlagStats(data);
        setChartData(data.completedCount, data.uncompletedCount);
        // TODO: 接入后端 await getFlagStats()
      } catch (err) {
        console.error('加载Flag统计失败:', err);
        setFlagStats({ completedCount: 0, uncompletedCount: 0, totalCount: 0, labelStats: [] });
      }
    };
    loadFlagStats();
  }, []);

  /**
   * 加载学习趋势数据（根据选择的周期）
   */
  useEffect(() => {
    const loadStudyTrend = async () => {
      try {
        const data = await getStudyTrend(studyTrendPeriod);
        const formattedData = data.map((item: StudyTrendData) => ({
          label: item.label,
          value: item.duration
        }));
        setStudyTrendData(formattedData);
        // TODO: 接入后端 await getStudyTrend(studyTrendPeriod)
      } catch (err) {
        console.error('加载学习趋势失败:', err);
        setStudyTrendData([]);
      }
    };
    loadStudyTrend();
  }, [studyTrendPeriod]);

  /**
   * 加载打卡类型统计数据
   */
  useEffect(() => {
    const loadPunchTypeStats = async () => {
      try {
        const data = await getPunchTypeStats();
        const formattedData = data.map((item: PunchTypeStats) => ({
          category: item.week,
          value1: item.active,
          value2: item.passive
        }));
        setPunchTypeData(formattedData);
        setLoading(false);
        // TODO: 接入后端 await getPunchTypeStats()
      } catch (err) {
        console.error('加载打卡类型统计失败:', err);
        setPunchTypeData([]);
        setLoading(false);
      }
    };
    loadPunchTypeStats();
  }, []);

  // ========== 计算属性 ==========
  /**
   * 格式化学习趋势数据，添加日期标签
   */
  const formattedStudyTrendData = useMemo(() => {
    return studyTrendData.map((item, index) => {
      let label = '';
      if (studyTrendPeriod === 'weekly') {
        const weekdays = ['一', '二', '三', '四', '五', '六', '七'];
        label = weekdays[index] || '';
      } else if (studyTrendPeriod === 'monthly') {
        if (index === 0 || index === 5 || index === 10 || index === 15 || index === 20 || index === 25 || index === 29) {
          label = String(index);
        }
      } else if (studyTrendPeriod === 'yearly') {
        if (index === 0 || index === 30 || index === 60 || index === 90 || index === 120 || index === 150 || index === 179) {
          label = String(index);
        }
      }
      return { ...item, label };
    });
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
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex-1 pb-24 px-4 flex items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1 pb-24 px-4 space-y-4">
        {/* 页面标题 */}
        <div className="pt-6 pb-2">
          <h1 className="text-2xl font-bold">数据统计</h1>
          <p className="text-sm text-muted-foreground mt-1">本月学习数据概览</p>
        </div>

        {/* 打卡概览 */}
        {monthlyStats && (
          <section>
            <h2 className="text-lg font-semibold mb-3">打卡概览</h2>
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{monthlyStats.punchedDays}</div>
                  <div className="text-xs text-muted-foreground mt-1">累计打卡</div>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                  <Calendar className="h-6 w-6 text-red-600 dark:text-red-400 mb-2" />
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{monthlyStats.missedDays}</div>
                  <div className="text-xs text-muted-foreground mt-1">缺卡天数</div>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
                  <Clock className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.floor(monthlyStats.totalStudyTime / 60)}</div>
                  <div className="text-xs text-muted-foreground mt-1">累计时长(h)</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
                本月累计学习 {formatStudyTime(monthlyStats.totalStudyTime)}
              </div>
            </Card>
          </section>
        )}

        {/* Flag完成度 */}
        {flagStats && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Flag完成度</h2>
            <Card className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <Flag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-lg font-bold">{flagStats.completedCount}</div>
                    <div className="text-xs text-muted-foreground">已完成</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <Flag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
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

              {/* 标签分类 */}
              {flagStats.labelStats && flagStats.labelStats.length > 0 && (
                <div className="space-y-2 border-t pt-3">
                  <h3 className="text-sm font-semibold">标签分类</h3>
                  {flagStats.labelStats.map((stat) => (
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
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
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
                  ))}
                </div>
              )}

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
        <section>
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

        {/* 打卡习惯 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">打卡习惯</h2>
          <ChartBarMultiple 
            data={punchTypeData}
            title="打卡类型对比"
            description="最近5周主动 vs 被动打卡"
            value1Label="主动打卡"
            value2Label="被动打卡"
            showFooter={true}
          />
          <div className="mt-2 text-xs text-muted-foreground px-1">
            <p>💡 主动打卡：在提醒时间前主动完成打卡</p>
            <p>⏰ 被动打卡：收到提醒后才完成打卡</p>
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
