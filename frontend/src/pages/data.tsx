import { useEffect, useState, useMemo } from 'react';
import { Calendar, Clock, Flag, TrendingUp, Trophy } from 'lucide-react';
import { 
  BottomNav, 
  Card, 
  ChartRadialStacked,
  setChartData,
  ChartPieLabel,
  StudyTimeChart,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '../components';
import { getStudyTimeTrend } from '../services/data.service';
import { useTaskStore } from '../lib/stores/stores';
import { FLAG_LABELS } from '../lib/constants/constants';
import type { FlagLabel, StudyTimeTrend } from '../lib/types/types';
import { BirdMascot } from '../components/feature';
import { fetchTasks, fetchPunchDates } from '../services/flag.service';
import { api } from '../services/apiClient';

/**
 * 数据统计页面
 * 展示打卡、Flag、学习时长等统计信息
 */
export default function DataPage() {
  // ========== 本地状态 ========== 
  const tasks = useTaskStore((s) => s.tasks); // 任务列表
  const punchedDates = useTaskStore((s) => s.punchedDates); // 打卡日期
  const dailyElapsed = useTaskStore((s) => s.dailyElapsed); // 每日学习时长（秒）
  const [loading, setLoading] = useState(true); // 加载状态
  const [todayPoints, setTodayPoints] = useState(0); // 今日获得积分
  const [studyPeriod, setStudyPeriod] = useState<'week' | 'month' | 'year'>('week'); // 学习趋势周期：周(最近7天)/月(当前月份)/年(最近6个月)
  // 新增：本月累计学习时长（秒）
  const [monthLearnTime, setMonthLearnTime] = useState(0);
  const [studyData, setStudyData] = useState<StudyTimeTrend[]>([]); // 学习趋势数据
  
  // 鸟消息
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
        '清晨看璇历，开启高效一天！',
        '璇历统计显示，早起学习效果更好~',
        '晨间数据分析，头脑清醒！',
        '早起的鸟儿，璇历更新得最早！',
      ] : []),
      ...(timeKey === 'morning' ? [
        '上午数据分析黄金时段！',
        '看看你的学习曲线在上涨吗？',
        '连续打卡数据，让人开心！',
        '积分系统在默默记录你的努力！',
      ] : []),
      ...(timeKey === 'afternoon' ? [
        '下午看看Flag完成情况吧！',
        '数据告诉你，进步看得见！',
        '坚持的痕迹，都在璇历里！',
        '学习时长稳步增长，真棒！',
      ] : []),
      ...(timeKey === 'evening' ? [
        '晚上总结璇历，明天更精彩~',
        '数据证明，你一直在进步！',
        '看看今日积分，收获满满！',
        '学习记录是最好的见证！',
      ] : []),
      ...(timeKey === 'night' ? [
        '夜深了，璇历还在为你工作~',
        '明天的数据会更好看！',
        '晚安，璇历会记录你的每一次努力！',
        '休息吧，明天继续创造好数据！',
      ] : []),
    ];
    
    const generalMessages = [
      '数据是最好的老师！',
      '你的学习轨迹清晰可见！',
      '数据分析，让进步看得见！',
      '每一次Flag完成，都是数据上的亮点！',
      '学习数据在为你加油打气~',
      '相信数据，更相信你自己！',
      '积分系统见证你的每一次坚持！',
      '数据统计，让学习更有成就感！',
    ];
    
    return [...timeMessages, ...generalMessages];
  }, []);

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



  // P1修复：从后端加载用户数据
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('未登录，跳过加载数据');
          setLoading(false);
          return;
        }
        
        // 移除 getFlagLabels 调用，该 API 一直返回 500 错误且前端没有实际使用
        // try {
        //   const labelData = await getFlagLabels();
        //   console.log('标签系统统计:', labelData);
        // } catch (err) {
        //   console.warn('加载标签统计失败，继续加载其他数据:', err);
        // }
        
        // 加载任务和打卡数据（静默失败）
        try {
          const [tasksData, punchData] = await Promise.all([
            fetchTasks().catch(err => { console.warn('获取任务失败:', err); return []; }),
            fetchPunchDates().catch(err => { console.warn('获取打卡数据失败:', err); return []; })
          ]);
          
          console.log('数据页加载到的任务:', tasksData);
          console.log('数据页加载到的打卡:', punchData);
          
          // 更新store
          useTaskStore.setState({ 
            tasks: tasksData,
            punchedDates: punchData
          });
        } catch (err) {
          console.warn('加载任务/打卡数据失败:', err);
        }
        
        // 加载用户统计数据（静默失败）
        try {
          await refreshUserData();
        } catch (err) {
          console.warn('刷新用户数据失败:', err);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        // 不弹出错误页面，只在控制台记录
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  // 🔧 新增：刷新用户数据函数
  const refreshUserData = async () => {
    try {
      const [userData, todayData, todayPointsResp] = await Promise.all([
        api.get<{ month_learn_time: number; count: number }>('/api/getUser').catch(err => {
          console.warn('获取用户数据失败:', err);
          return { month_learn_time: 0, count: 0 };
        }),
        api.get<{ today_learn_time: number }>('/api/getTodayLearnTime').catch(err => {
          console.warn('获取今日学习时长失败:', err);
          return { today_learn_time: 0 };
        }),
        api.get<{ today_points: number }>('/api/getTodayPoints').catch(err => {
          console.warn('获取今日积分失败:', err);
          return { today_points: 0 };
        })
      ]);

      console.log('用户学习时长:', userData.month_learn_time);
      console.log('今日学习时长:', todayData.today_learn_time);
      console.log('用户积分:', userData.count);
      console.log('今日获得积分:', todayPointsResp?.today_points);

      setTodayPoints(todayPointsResp?.today_points || 0);

      // 分别设置今日和月累计学习时长（后端返回的都是秒）
      const todayTime = todayData.today_learn_time || 0; // 今日学习时长（秒）
      const monthTime = userData.month_learn_time || 0; // 本月累计学习时长（秒）
      setMonthLearnTime(monthTime);
      useTaskStore.setState({
        dailyElapsed: todayTime // 今日学习时长（秒）
      });
    } catch (error) {
      console.error('刷新用户数据失败:', error);
      // 设置默认值，避免页面显示异常
      setTodayPoints(0);
      setMonthLearnTime(0);
      useTaskStore.setState({ dailyElapsed: 0 });
    }
  };

  // 🔧 已移除：不再监听任务变化自动刷新，避免频繁请求
  // 如需刷新数据，在特定操作后手动调用 refreshUserData()

  // 加载学习趋势数据
  useEffect(() => {
    const loadStudyData = async () => {
      try {
        const data = await getStudyTimeTrend(studyPeriod);
        console.log(`加载${studyPeriod}学习趋势:`, data);
        setStudyData(data);
      } catch (err) {
        console.error('加载学习趋势失败:', err);
        setStudyData([]);
      }
    };
    loadStudyData();
  }, [studyPeriod]);

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
      totalStudyTime: monthLearnTime // 本月累计学习时长（秒）
    };
  }, [punchedDates, monthLearnTime]);

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
   * 格式化学习时长（秒转小时/分钟/秒）
   */
  // 总时长显示：大于1小时显示小时，否则显示分钟
  // 累计时长和今日学习时长格式化：XhX 或 XmX
  const formatTotalHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${mins}`;
    }
    return `${mins}m`;
  };

  const formatTodayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h${mins}`;
    }
    return `${mins}m`;
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      <div className="flex-1 pb-24 space-y-4 max-w-2xl mx-auto w-full">
        {/* 页面标题 */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">璇历</h1>
                <p className="text-sm text-slate-600">查看学习数据和统计信息</p>
              </div>
            </div>
          </div>
        </header>

        {/* 本月概览 */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              本月概览
            </h2>
          </div>
          <Card className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 hover:shadow-md transition-all duration-200">
                <Calendar className="h-6 w-6 text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{calculatedMonthlyStats.punchedDays}</div>
                <div className="text-xs text-blue-700 mt-1">累计打卡</div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200/50 hover:shadow-md transition-all duration-200">
                <Calendar className="h-6 w-6 text-red-600 mb-2" />
                <div className="text-2xl font-bold text-red-600">{calculatedMonthlyStats.missedDays}</div>
                <div className="text-xs text-red-700 mt-1">缺卡天数</div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200/50 hover:shadow-md transition-all duration-200">
                <Clock className="h-6 w-6 text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{formatTotalHours(calculatedMonthlyStats.totalStudyTime)}</div>
                <div className="text-xs text-green-700 mt-1 whitespace-nowrap">累计时长({Math.floor(calculatedMonthlyStats.totalStudyTime / 3600) > 0 ? 'h' : 'm'})</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200/50 text-center text-sm text-gray-600 bg-gray-50/50 rounded-lg p-3">
              本月累计学习 {(() => {
                const hours = Math.floor(calculatedMonthlyStats.totalStudyTime / 3600);
                const mins = Math.floor((calculatedMonthlyStats.totalStudyTime % 3600) / 60);
                return `${hours}小时${mins}分钟`;
              })()}
            </div>
          </Card>
        </section>

        {/* 数据统计模块 */}
        <section className="px-4 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              今日数据
            </h2>
            {/* 鸟装饰与气泡 - 放在今日数据标题旁边 */}
            <BirdMascot position="data" messages={messages} />
          </div>
          <Card className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200 z-1">
            <div className="grid grid-cols-3 gap-2">
              {/* 连续打卡天数 */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <Calendar className="h-7 w-7 text-blue-600 mb-2" />
                <div className="text-xs text-muted-foreground mb-1">连续打卡</div>
                <div className="text-3xl font-bold text-blue-600 tabular-nums">
                  {streak}
                </div>
              </div>
              
              {/* 今日获得积分 */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                <Trophy className="h-7 w-7 text-purple-600 mb-2" />
                <div className="text-xs text-muted-foreground mb-1">今日积分</div>
                <div className="text-3xl font-bold text-purple-600 tabular-nums">
                  {todayPoints}
                </div>
              </div>
              
              {/* 今日学习时长 */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <Clock className="h-7 w-7 text-green-600 mb-2" />
                <div className="text-xs text-muted-foreground mb-1">今日学习</div>
                <div className="text-3xl font-bold text-green-600 tabular-nums">
                  {formatTodayTime(dailyElapsed)}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Flag完成度 */}
        {flagStats && (
          <section className="px-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flag className="h-5 w-5 text-blue-500" />
              Flag完成
            </h2>
            <Card className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200">
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 hover:shadow-md transition-all duration-200">
                  <Flag className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-xl font-bold text-blue-600">{flagStats.completedCount}</div>
                    <div className="text-xs text-blue-700">已完成</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200/50 hover:shadow-md transition-all duration-200">
                  <Flag className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-xl font-bold text-orange-600">{flagStats.uncompletedCount}</div>
                    <div className="text-xs text-orange-700">未完成</div>
                  </div>
                </div>
              </div>
              
              {/* 径向图 */}
              <div className="flex flex-col items-center">
                <ChartRadialStacked />
              </div>


              {/* 标签分类：无数据时显示"无标签 0%" */}
              <div className="space-y-3 border-t border-gray-200/50 pt-3">
                <h3 className="text-sm font-semibold text-gray-700">标签分类</h3>
                {Object.entries(FLAG_LABELS).map(([, labelObj]) => {
                  const stat = flagStats.labelStats?.find(l => l.labelName === labelObj.name);
                  const percentage = stat ? stat.percentage : 0;
                  return (
                    <div key={labelObj.name} className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: labelObj.color }}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium">{labelObj.name}</span>
                          <span className="tabular-nums font-semibold" style={{ color: labelObj.color }}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div 
                            className="h-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: labelObj.color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 已完成Flag分布饼图 */}
              {pieChartData.length > 0 && (
                <div className="border-t border-gray-200 pt-2">
                  <ChartPieLabel 
                    data={pieChartData}
                    title="已完成Flag分布"
                    description="不同标签类型的完成占比"
                    showFooter={false}
                  />
                </div>
              )}
            </div>
            </Card>
          </section>
        )}

        {/* 学习时长 */}
        <section className="px-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            学习时长
          </h2>
          <Card className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
            <Tabs value={studyPeriod} onValueChange={(v: string) => setStudyPeriod(v as typeof studyPeriod)} className="w-full">
              <div className="p-4 pb-2">
                <TabsList className="grid w-full grid-cols-3 h-10">
                  <TabsTrigger value="week" className="text-sm">周</TabsTrigger>
                  <TabsTrigger value="month" className="text-sm">月</TabsTrigger>
                  <TabsTrigger value="year" className="text-sm">年</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value={studyPeriod} className="mt-0 px-4 pb-4">
                <StudyTimeChart 
                  data={studyData}
                  period={studyPeriod}
                  description={`${studyPeriod === 'week' ? '最近7天' : studyPeriod === 'month' ? '当前月份' : '最近6个月'}的学习时长分布`}
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
