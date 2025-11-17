import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Target, Loader2, User, BookOpen, Flag } from 'lucide-react';
import { CalendarDays, Timer } from 'lucide-react';
import { toast } from 'sonner';
import {
  BottomNav,
  Card,
  Button,
  Input,
  Badge,
  Skeleton,
  Textarea,
  Separator,
} from '../components';
import { generateStudyPlan, type StudyPlan, type Difficulty } from '../services/ai.service';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { FLAG_LABELS } from '../lib/constants/constants';

// 本地存储键
const STORAGE_KEYS = {
  BACKGROUND: 'ai_user_background',
  LAST_GOAL: 'ai_last_goal',
  GENERATED_PLANS: 'ai_generated_plans',
  ADDED_FLAGS: 'ai_added_flags', // 记录已添加的flag（防止重复添加）
};

/**
 * AI助手页面(太傅)
 * 根据用户的学习背景和目标,使用AI生成个性化学习计划
 */
export default function AIPage() {
  const navigate = useNavigate();

  // ========== 本地状态 ==========
  const [background, setBackground] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<StudyPlan[]>([]);
  
  // 历史记录
  const [lastBackground, setLastBackground] = useState<string>('');
  const [lastGoal, setLastGoal] = useState<string>('');
  
  // 已添加的flag追踪（用于防止重复添加）
  const [addedFlags, setAddedFlags] = useState<Set<string>>(new Set());

  // 加载历史记录
  useEffect(() => {
    const savedBackground = localStorage.getItem(STORAGE_KEYS.BACKGROUND);
    const savedLastGoal = localStorage.getItem(STORAGE_KEYS.LAST_GOAL);
    const savedPlans = localStorage.getItem(STORAGE_KEYS.GENERATED_PLANS);
    const savedAddedFlags = localStorage.getItem(STORAGE_KEYS.ADDED_FLAGS);
    
    if (savedBackground) setLastBackground(savedBackground);
    if (savedLastGoal) setLastGoal(savedLastGoal);
    if (savedPlans) {
      try {
        setGeneratedPlans(JSON.parse(savedPlans));
      } catch (e) {
        console.error('Failed to parse saved plans:', e);
      }
    }
    if (savedAddedFlags) {
      try {
        setAddedFlags(new Set(JSON.parse(savedAddedFlags)));
      } catch (e) {
        console.error('Failed to parse added flags:', e);
      }
    }
  }, []);

  // ========== 计算属性 ==========
  /**
   * 难度配置选项
   */
  const difficulties: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: '轻松难度', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { value: 'medium', label: '适度难度', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { value: 'hard', label: '挑战难度', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  ];

  // ========== 事件处理器 ==========
  /**
   * 生成学习计划
   */
  const handleGenerate = async () => {
    if (!goal.trim()) {
      toast.error('请输入学习目标');
      return;
    }
    if (!selectedDifficulty) {
      toast.error('请选择难度');
      return;
    }

    setIsGenerating(true);
    try {
      // 保存背景和目标
      if (background.trim()) {
        localStorage.setItem(STORAGE_KEYS.BACKGROUND, background);
        setLastBackground(background);
      }
      localStorage.setItem(STORAGE_KEYS.LAST_GOAL, goal);
      setLastGoal(goal);

      // 调用AI服务生成学习计划
      const plan = await generateStudyPlan(goal, background, selectedDifficulty);
      
      // 添加到计划列表，最多保留3个
      const newPlans = [plan, ...generatedPlans].slice(0, 3);
      setGeneratedPlans(newPlans);
      localStorage.setItem(STORAGE_KEYS.GENERATED_PLANS, JSON.stringify(newPlans));
      
      toast.success('学习计划生成成功！');
    } catch (error) {
      console.error('生成学习计划失败:', error);
      toast.error('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 添加单个Flag到任务列表
   */
  const handleAddSingleFlag = async (plan: StudyPlan, flagIndex: number) => {
    const flag = plan.flags[flagIndex];
    const flagKey = `${plan.goal}_${flag.title}`;
    
    // 检查是否已添加
    if (addedFlags.has(flagKey)) {
      toast.warning('该Flag已添加过，无法重复添加');
      return;
    }

    const toastId = toast.loading(`正在添加: ${flag.title}`);
    
    try {
      const { createTask } = await import('../services/flag.service');
      
      await createTask({
        title: flag.title,
        detail: flag.detail,
        total: flag.total,
        label: flag.label,
        priority: flag.priority,
        points: flag.points,
        startDate: flag.startDate,
        endDate: flag.endDate,
      });
      
      // 标记为已添加
      const newAddedFlags = new Set(addedFlags);
      newAddedFlags.add(flagKey);
      setAddedFlags(newAddedFlags);
      localStorage.setItem(STORAGE_KEYS.ADDED_FLAGS, JSON.stringify([...newAddedFlags]));
      
      toast.dismiss(toastId);
      toast.success(`成功添加「${flag.title}」`);
    } catch (error) {
      toast.dismiss(toastId);
      console.error(`添加Flag失败 [${flag.title}]:`, error);
      toast.error('添加失败，请重试');
    }
  };

  /**
   * 将生成的Flag批量添加到任务列表
   */
  const handleAddToFlags = async (plan: StudyPlan) => {
    if (!plan.flags || plan.flags.length === 0) {
      toast.error('没有可添加的Flag');
      return;
    }

    const toastId = toast.loading(`正在添加 ${plan.flags.length} 个Flag...`);
    
    try {
      const { createTask } = await import('../services/flag.service');
      let successCount = 0;
      let totalPoints = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      const newAddedFlags = new Set(addedFlags);
      
      for (let i = 0; i < plan.flags.length; i++) {
        const flag = plan.flags[i];
        const flagKey = `${plan.goal}_${flag.title}`;
        
        // 跳过已添加的flag
        if (addedFlags.has(flagKey)) {
          skippedCount++;
          continue;
        }
        
        try {
          toast.loading(`正在添加 ${i + 1}/${plan.flags.length}: ${flag.title}`, { id: toastId });
          
          await createTask({
            title: flag.title,
            detail: flag.detail,
            total: flag.total,
            label: flag.label,
            priority: flag.priority,
            points: flag.points,
            startDate: flag.startDate,
            endDate: flag.endDate,
          });
          
          // 标记为已添加
          newAddedFlags.add(flagKey);
          successCount++;
          totalPoints += flag.points || 0;
        } catch (error) {
          console.error(`添加Flag失败 [${flag.title}]:`, error);
          errors.push(flag.title);
        }
      }
      
      // 保存已添加标记
      setAddedFlags(newAddedFlags);
      localStorage.setItem(STORAGE_KEYS.ADDED_FLAGS, JSON.stringify([...newAddedFlags]));
      
      toast.dismiss(toastId);
      
      // 构建提示信息
      if (successCount > 0 && skippedCount === 0 && errors.length === 0) {
        toast.success(`成功添加 ${successCount} 个Flag（共${totalPoints}积分）`);
      } else if (successCount > 0) {
        let message = `成功添加 ${successCount} 个Flag`;
        if (skippedCount > 0) message += `，跳过 ${skippedCount} 个已添加的`;
        if (errors.length > 0) message += `，${errors.length} 个失败`;
        toast.success(message);
      } else if (skippedCount > 0 && errors.length === 0) {
        toast.info(`全部 ${skippedCount} 个Flag已添加过`);
        return;
      } else {
        toast.error('所有Flag添加失败，请重试');
        return;
      }
      
      // 跳转到Flag页面
      setTimeout(() => {
        navigate('/flag');
      }, 1000);
    } catch (error) {
      toast.dismiss(toastId);
      console.error('批量添加Flag失败:', error);
      toast.error('添加失败，请重试');
    }
  };

  // ========== 渲染 ==========
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex-1 pb-24 space-y-4">
        {/* 页面标题 */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">太傅</h1>
                <p className="text-sm text-slate-600">输入学习目标，AI为你定制专属计划</p>
              </div>
            </div>
          </div>
        </header>

        {/* 输入区域 */}
        <section className="px-4">
          <Card className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
            {/* 头部渐变区域 */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-blue-100/50">
              <div className="space-y-6">
              {/* 个人背景输入 */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  个人学习背景
                </label>
                <Textarea
                  placeholder="输入您的学习背景，例如：大三学生、有编程基础..."
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="bg-white min-h-[80px] resize-none rounded-xl"
                />
                {/* 上次背景提示 */}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 pl-1 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    上次个人学习背景
                  </div>
                  <div className="text-xs text-muted-foreground pl-1">
                    {lastBackground ? (
                      <span>{lastBackground}</span>
                    ) : (
                      <span className="text-gray-400">还没有个人学习背景</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              {/* 学习目标输入 */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  学习目标
                </label>
                <Input
                  placeholder="输入您的学习目标..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="bg-white rounded-xl"
                />
                {/* 上次目标提示 */}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 pl-1 flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-blue-600" />
                    上次学习目标
                  </div>
                  <div className="text-xs text-muted-foreground pl-1">
                    {lastGoal ? (
                      <span>{lastGoal}</span>
                    ) : (
                      <span className="text-gray-400">还没有学习目标哦</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              {/* 难度选择 */}
              <div className="space-y-3">
                <label className="text-sm font-medium">选择难度</label>
                <div className="grid grid-cols-3 gap-3">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => setSelectedDifficulty(diff.value)}
                      className={`px-4 py-3 text-sm rounded-xl font-medium transition-all duration-200 ${
                        selectedDifficulty === diff.value
                          ? diff.color + ' ring-2 ring-offset-2 ring-blue-500 shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-50 hover:shadow-sm border border-gray-200'
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成按钮 */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !goal.trim() || !selectedDifficulty}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI生成计划
                  </>
                )}
              </Button>
            </div>
            </div>
          </Card>
        </section>

        {/* 加载状态 */}
        {isGenerating && (
          <section className="px-4">
            <h2 className="text-lg font-semibold mb-4">正在生成...</h2>
            <Card className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6 rounded-lg" />
              </div>
            </Card>
          </section>
        )}

        {/* 已生成学习计划 */}
        <section className="px-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            已生成学习计划
          </h2>
          {generatedPlans.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <Target className="h-12 w-12 text-gray-300" />
                <p className="text-muted-foreground">暂无学习计划</p>
                <p className="text-xs text-gray-400">输入目标并生成计划后将在此显示</p>
              </div>
            </Card>
          ) : (
              <div className="flex flex-col gap-4">
                {/* 只显示最近的五个学习计划 */}
                {generatedPlans.slice(0, 5).map((plan, planIndex) => {
                  return (
                  <Card key={planIndex} className="rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
                    {/* 目标信息区域 */}
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-blue-100/50">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h3 className="font-bold text-blue-900">目标: {plan.goal}</h3>
                          <Badge variant="outline" className="text-xs">
                            {difficulties.find(d => d.value === plan.difficulty)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-700 pl-7">{typeof plan.description === 'string' ? plan.description : ''}</p>
                        {plan.background && (
                          <p className="text-xs text-blue-600 pl-7">背景: {typeof plan.background === 'string' ? plan.background : ''}</p>
                        )}
                      </div>
                      {/* Accordion 折叠具体计划阶段 */}
                      {plan.phases && plan.phases.length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value={`phase-${planIndex}`}> 
                            <AccordionTrigger>
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4 text-purple-400" />
                                <span>具体计划 {plan.phases.length > 3 && `(显示前3个，共${plan.phases.length}个)`}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-0.5">
                                {plan.phases.slice(0, 3).map((phase, phaseIndex) => (
                                  <div key={phaseIndex} className="bg-white rounded-lg p-0.5 border border-purple-200/30">
                                    <div className="flex items-start gap-2">
                                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                                        {phaseIndex + 1}
                                      </div>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{typeof phase === 'string' ? phase : ''}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                      {/* 具体Flag - 作为同一模块的一部分 */}
                      <div className="mt-1 pt-0.5">
                        <Accordion type="single" collapsible>
                          <AccordionItem value={`flags-${planIndex}`}>
                            <AccordionTrigger>
                            <div className="flex items-center justify-between w-full pr-4">
                              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                                <Flag className="h-4 w-4 text-blue-600" />
                                具体Flag ({plan.flags.length}个)
                              </h4>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToFlags(plan);
                                }}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-xs h-9 text-white cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                                role="button"
                                tabIndex={0}
                              >
                                添加全部Flag
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {plan.flags.map((flag, flagIndex) => {
                                const flagKey = `${plan.goal}_${flag.title}`;
                                const isAdded = addedFlags.has(flagKey);
                                const startDate = new Date(flag.startDate);
                                const endDate = new Date(flag.endDate);
                                const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                  <div
                                    key={flagIndex}
                                    className={
                                      `p-4 rounded-xl transition-all duration-200 shadow-sm ` +
                                      (isAdded
                                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 text-green-700'
                                        : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md text-gray-800')
                                    }
                                  >
                                    <div className="space-y-3">
                                      {/* 标题和标签 */}
                                      <div className="flex items-start justify-between gap-2">
                                        <h5 className="font-semibold text-sm flex-1">
                                          {isAdded && '[已添加] '}{flag.title}
                                        </h5>
                                        <div className="flex gap-1.5 flex-shrink-0">
                                          <Badge 
                                            style={{ backgroundColor: FLAG_LABELS[flag.label].color }}
                                            className="text-xs text-white font-medium px-2.5 py-1 rounded-full"
                                          >
                                            {FLAG_LABELS[flag.label].name}
                                          </Badge>
                                          {flag.points && (
                                            <Badge className="text-xs bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 font-bold px-2.5 py-1 rounded-full border-0">
                                              {flag.points}分
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      {/* 任务详情描述 */}
                                      {flag.detail && (
                                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                                          {flag.detail}
                                        </p>
                                      )}
                                      {/* 精简信息展示 */}
                                      <div className="flex items-center gap-2 text-xs flex-wrap">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                                          <CalendarDays className="w-3.5 h-3.5" /> 每日{flag.total}次
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full font-medium">
                                          <Timer className="w-3.5 h-3.5" /> {totalDays}天
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">
                                          {flag.priority === 1 ? '急切' : flag.priority === 2 ? '较急' : flag.priority === 3 ? '一般' : '不急'}
                                        </span>
                                      </div>
                                      {/* 添加按钮 */}
                                      {!isAdded && (
                                          <div
                                            onClick={() => handleAddSingleFlag(plan, flagIndex)}
                                            className="w-full text-xs h-9 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                                            role="button"
                                            tabIndex={0}
                                          >
                                            添加到Flag
                                          </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {/* 总积分统计 */}
                            <div className="pt-4 mt-4 border-t border-gray-200/50 flex items-center justify-between bg-gray-50/50 rounded-lg p-3">
                              <span className="text-sm text-gray-600 font-medium">完成全部可获得:</span>
                              <span className="text-lg font-bold text-orange-600">
                                {plan.flags.reduce((sum, f) => sum + (f.points || 0), 0)} 积分
                              </span>
                            </div>
                          </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    </div>
                  </Card>
                  );
                })}
              </div>
            )}
          </section>
      </div>
      <BottomNav />
    </div>
  );
}
