import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Target, Loader2, User, BookOpen, History } from 'lucide-react';
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
import { useTaskStore } from '../lib/stores/stores';
import { generateStudyPlan, type StudyPlan, type Difficulty } from '../services/ai.service';
import { FLAG_LABELS, FLAG_PRIORITIES } from '../lib/constants/constants';
import type { Task } from '../lib/types/types';

// 本地存储键
const STORAGE_KEYS = {
  BACKGROUND: 'ai_user_background',
  LAST_GOAL: 'ai_last_goal',
  GENERATED_PLANS: 'ai_generated_plans',
};

// AI助手页面
export default function AIPage() {
  const navigate = useNavigate();
  const addTask = useTaskStore((s) => s.addTask);

  // 状态管理
  const [background, setBackground] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlans, setGeneratedPlans] = useState<StudyPlan[]>([]);
  
  // 历史记录
  const [lastBackground, setLastBackground] = useState<string>('');
  const [lastGoal, setLastGoal] = useState<string>('');

  // 加载历史记录
  useEffect(() => {
    const savedBackground = localStorage.getItem(STORAGE_KEYS.BACKGROUND);
    const savedLastGoal = localStorage.getItem(STORAGE_KEYS.LAST_GOAL);
    const savedPlans = localStorage.getItem(STORAGE_KEYS.GENERATED_PLANS);
    
    if (savedBackground) setLastBackground(savedBackground);
    if (savedLastGoal) setLastGoal(savedLastGoal);
    if (savedPlans) {
      try {
        setGeneratedPlans(JSON.parse(savedPlans));
      } catch (e) {
        console.error('Failed to parse saved plans:', e);
      }
    }
  }, []);

  // 难度配置
  const difficulties: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: '轻松进度', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { value: 'medium', label: '适度难度', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { value: 'hard', label: '挑战进度', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  ];

  // 生成学习计划
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
      const plan = await generateStudyPlan(goal, selectedDifficulty);
      
      // 添加到计划列表
      const newPlans = [plan, ...generatedPlans];
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

  // 将生成的Flag添加到任务列表
  const handleAddToFlags = (plan: StudyPlan) => {
    // 批量添加Flag到全局store
    const addedTasks: Task[] = [];
    plan.flags.forEach((flag, index) => {
      const created: Task = {
        id: String(Date.now() + index),
        title: flag.title,
        detail: flag.detail,
        total: flag.total,
        count: 0,
        completed: false,
        label: flag.label,
        priority: flag.priority,
        isPublic: false,
        createdAt: new Date().toISOString(),
      };
      addTask(created);
      addedTasks.push(created);
    });

    toast.success(`已添加 ${plan.flags.length} 个Flag到列表`, {
      action: {
        label: '撤销',
        onClick: () => {
          addedTasks.forEach(task => {
            useTaskStore.getState().deleteTask(task.id);
          });
          toast.success('已撤销添加');
        }
      }
    });
    
    // 跳转到Flag页面
    setTimeout(() => {
      navigate('/flag');
    }, 800);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex-1 pb-24 px-4 space-y-5">
        {/* 页面标题 */}
        <div className="pt-6 pb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-blue-500" />
            <h1 className="text-2xl font-bold">AI智能推荐</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">输入学习目标，AI为你定制专属计划</p>
        </div>

        {/* 输入区域 */}
        <section className="space-y-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="space-y-4">
              {/* 个人背景输入 */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  个人学习背景
                </label>
                <Textarea
                  placeholder="输入您的学习背景，例如：大三学生、有编程基础..."
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="bg-white min-h-[80px] resize-none"
                />
                {/* 上次背景提示 */}
                <div className="space-y-1">
                  <div className="text-[13px] font-medium text-gray-600 pl-1 flex items-center gap-1">
                    <History className="h-3.5 w-3.5" />
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
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  学习目标
                </label>
                <Input
                  placeholder="输入您的学习目标..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="bg-white"
                />
                {/* 上次目标提示 */}
                <div className="space-y-1">
                  <div className="text-[13px] font-medium text-gray-600 pl-1 flex items-center gap-1">
                    <History className="h-3.5 w-3.5" />
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
              <div className="space-y-2">
                <label className="text-sm font-medium">选择难度</label>
                <div className="grid grid-cols-3 gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff.value}
                      onClick={() => setSelectedDifficulty(diff.value)}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                        selectedDifficulty === diff.value
                          ? diff.color + ' ring-2 ring-offset-2 ring-blue-500'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
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
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 mt-2"
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
          </Card>
        </section>

        {/* 加载状态 */}
        {isGenerating && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">正在生成...</h2>
            <Card className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </Card>
          </section>
        )}

        {/* 已生成学习计划 */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            已生成学习计划
          </h2>
          
          {generatedPlans.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <Target className="h-12 w-12 text-gray-300" />
                <p className="text-muted-foreground">暂无学习计划</p>
                <p className="text-xs text-gray-400">输入目标并生成计划后将在此显示</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {generatedPlans.map((plan, planIndex) => (
                <Card key={planIndex} className="overflow-hidden">
                  {/* 计划描述 */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-blue-900">目标: {plan.goal}</h3>
                        <Badge variant="outline" className="text-xs">
                          {difficulties.find(d => d.value === plan.difficulty)?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-700">{plan.description}</p>
                    </div>
                  </div>

                  {/* Flag列表 */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">拆解的Flag ({plan.flags.length})</h4>
                      <Button
                        onClick={() => handleAddToFlags(plan)}
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-xs h-8"
                      >
                        添加到Flag
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {plan.flags.map((flag, flagIndex) => (
                        <div key={flagIndex} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-medium text-sm flex-1">{flag.title}</h5>
                              <div className="flex gap-1 flex-shrink-0">
                                <Badge 
                                  style={{ backgroundColor: FLAG_LABELS[flag.label].color }}
                                  className="text-xs text-white"
                                >
                                  {FLAG_LABELS[flag.label].name}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {FLAG_PRIORITIES[flag.priority]}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{flag.detail}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>目标: {flag.total} 次</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
