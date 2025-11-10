import { useEffect, useState } from "react";
import { 
  BottomNav, 
  Card, 
  ChartRadialText, 
  ChartAreaDefault, 
  ChartBarMultiple,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "../components";
import { getMonthlyStats, getFlagStats, getStudyTrend, getPunchTypeStats } from "../services";
import type { MonthlyStats, FlagStats } from "../lib/types/types";
import { Calendar, Clock, Flag } from "lucide-react";

/**
 * 数据统计页面
 * 展示打卡、Flag、学习时长等统计信息
 */
export default function DataPage() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [flagStats, setFlagStats] = useState<FlagStats | null>(null);
  const [studyTrendPeriod, setStudyTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [studyTrendData, setStudyTrendData] = useState<Array<{ label: string; value: number }>>([]);
  const [punchTypeData, setPunchTypeData] = useState<Array<{ category: string; value1: number; value2: number }>>([]);
  const [loading, setLoading] = useState(true);

  // 加载月度统计数据
  useEffect(() => {
    const loadMonthlyStats = async () => {
      try {
        const data = await getMonthlyStats();
        setMonthlyStats(data);
      } catch (err) {
        console.error('加载月度统计失败:', err);
        // 设置默认空数据
        setMonthlyStats({ punchedDays: 0, missedDays: 0, totalStudyTime: 0 });
      }
    };
    loadMonthlyStats();
  }, []);

  // 加载Flag统计数据
  useEffect(() => {
    const loadFlagStats = async () => {
      try {
        const data = await getFlagStats();
        setFlagStats(data);
      } catch (err) {
        console.error('加载Flag统计失败:', err);
        // 设置默认空数据
        setFlagStats({ completedCount: 0, uncompletedCount: 0, totalCount: 0 });
      }
    };
    loadFlagStats();
  }, []);

  // 加载学习趋势数据（根据选择的周期）
  useEffect(() => {
    const loadStudyTrend = async () => {
      try {
        const data = await getStudyTrend(studyTrendPeriod);
        // 转换数据格式以适配ChartAreaDefault
        const formattedData = data.map(item => ({
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

  // 加载打卡类型统计数据
  useEffect(() => {
    const loadPunchTypeStats = async () => {
      try {
        const data = await getPunchTypeStats();
        // 转换数据格式以适配ChartBarMultiple
        const formattedData = data.map(item => ({
          category: item.week,
          value1: item.active,
          value2: item.passive
        }));
        setPunchTypeData(formattedData);
        setLoading(false);
      } catch (err) {
        console.error('加载打卡类型统计失败:', err);
        setPunchTypeData([]);
        setLoading(false);
      }
    };
    loadPunchTypeStats();
  }, []);

  // 格式化学习时长（分钟转小时）
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
  };

  const getPeriodDescription = () => {
    switch (studyTrendPeriod) {
      case 'daily':
        return '最近7天';
      case 'weekly':
        return '最近5周';
      case 'monthly':
        return '最近6个月';
    }
  };

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

        {/* 模块1: 打卡统计 */}
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

        {/* 模块2: Flag完成统计 */}
        {flagStats && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Flag完成度</h2>
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <Flag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-xl font-bold">{flagStats.completedCount}</div>
                    <div className="text-xs text-muted-foreground">已完成</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <Flag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <div className="text-xl font-bold">{flagStats.uncompletedCount}</div>
                    <div className="text-xs text-muted-foreground">未完成</div>
                  </div>
                </div>
              </div>
              <ChartRadialText 
                value={flagStats.completedCount}
                total={flagStats.totalCount}
                title="Flag完成统计"
                description="本月完成情况"
                valueLabel="个Flag"
                showFooter={true}
              />
            </Card>
          </section>
        )}

        {/* 模块3: 学习时长趋势 */}
        <section>
          <h2 className="text-lg font-semibold mb-3">学习趋势</h2>
          <Card>
            <Tabs value={studyTrendPeriod} onValueChange={(v: string) => setStudyTrendPeriod(v as typeof studyTrendPeriod)} className="w-full">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">日</TabsTrigger>
                  <TabsTrigger value="weekly">周</TabsTrigger>
                  <TabsTrigger value="monthly">月</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value={studyTrendPeriod} className="mt-0">
                <ChartAreaDefault 
                  data={studyTrendData}
                  title="学习时长"
                  description={getPeriodDescription() + "的累计学习时长"}
                  valueLabel="分钟"
                  showFooter={true}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </section>

        {/* 模块4: 打卡类型对比 */}
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
