import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Lightbulb } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Button,
} from '../index';

interface TutorialStep {
  page: string;
  section: string; // 章节名称：简介、圭表、太傅、璇历、翰林、素札、总结
  title: string;
  subtitle?: string;
  description: string;
  keyPoints: { label: string; content: string }[];
  tips?: string[];
  position: 'bottom-right' | 'top-right' | 'center';
}

const SECTIONS = ['简介', '圭表', '太傅', '璇历', '翰林', '素札', '总结'];

const tutorialSteps: TutorialStep[] = [
  {
    page: '/flag',
    section: '简介',
    title: '欢迎来到知序',
    subtitle: '你的自律成长伙伴',
    description: '知序是一个帮助你养成好习惯、实现长期目标的自律社区。我们相信，持续的小进步能带来巨大的改变。',
    keyPoints: [
      { label: 'Flag 目标', content: '创建目标、每日打卡、追踪进度' },
      { label: 'AI 助手', content: '智能规划、个性化建议' },
      { label: '数据分析', content: '可视化统计、趋势追踪' },
      { label: '社区互动', content: '分享经验、互相激励' }
    ],
    tips: ['建议每天花5-10分钟记录和回顾', '坚持打卡可以获得积分和成就'],
    position: 'bottom-right'
  },
  {
    page: '/flag',
    section: '圭表',
    title: 'Flag - 目标管理',
    subtitle: '第一步：创建你的第一个flag',
    description: '圭表是你的目标管理中心。在这里，你可以创建各种类型的目标flag，设定时间周期，并通过每日打卡来追踪进度。',
    keyPoints: [
      { label: '创建目标', content: '点击下方"创建flag"按钮，填写目标' },
      { label: '设置参数', content: '选择日期、每日完成次数、积分奖励' },
      { label: '选择类型', content: '学习、运动、工作、兴趣等多种分类' },
      { label: '公开分享', content: '可选择是否公开到翰林广场' }
    ],
    tips: ['建议设定2-4周的短期目标更容易坚持', 'flag的标题或详情要具体明确，如"每天背20个单词"'],
    position: 'bottom-right'
  },
  {
    page: '/flag',
    section: '圭表',
    title: 'Flag - 每日打卡',
    subtitle: '第二步：养成打卡习惯',
    description: '创建目标后，每天完成任务后记得打卡。打卡不仅能记录你的坚持轨迹，完成flag还能获得积分奖励，但短时间内最多只能连续完成3个任务哦。',
    keyPoints: [
      { label: '打卡操作', content: '点击目标卡片，点击"打卡"按钮' },
      { label: '填写时长', content: '记录今天的学习/练习时长（分钟）' },
      { label: '积分奖励', content: '每次打卡基础获得20分，坚持就有回报' },
      { label: '连续奖励', content: '连续5天每天额外+10分，连续10天每天额外+20分' }
    ],
    tips: ['每天固定时间打卡，更容易养成习惯', '如果中途有一天忘记打卡，会影响连续天数'],
    position: 'bottom-right'
  },
  {
    page: '/flag',
    section: '圭表',
    title: 'Flag - 进度追踪',
    subtitle: '第三步：查看目标进度',
    description: '每个目标都有环形进度条和详情统计，帮助你直观了解完成情况。',
    keyPoints: [
      { label: '进度环', content: '圆环显示当前进度百分比' },
      { label: 'flag卡片', content: '显示flag的详细信息、状态和进度条' },
      { label: '类型标签', content: '表明flag的优先级、类别等' },
      { label: '完成奖励', content: '达成目标后自动发放积分' }
    ],
    tips: ['点击flag即可查看详细flag卡片', '害怕目标到期忘记，可以设置消息提醒，会每天准时提醒你哦'],
    position: 'bottom-right'
  },
  {
    page: '/flag',
    section: '圭表',
    title: 'Flag - 打卡日历',
    subtitle: '第四步：查看打卡记录',
    description: '打卡日历以可视化的方式展示你本月的打卡情况，让坚持的轨迹一目了然，每一个标记都是你努力的证明。',
    keyPoints: [
      { label: '日历视图', content: '本月每天的打卡情况清晰展示' },
      { label: '黄色标记', content: '黄线表示已完成打卡的日期' },
      { label: '绿色标记', content: '绿线表示当天有flag任务需要完成' },
      { label: '褪色日期', content: '过去的日子会变灰哦' }
    ],
    tips: ['日历上的黄色标记越多，说明你越坚持', '绿色标记提醒你今天还有任务要完成'],
    position: 'bottom-right'
  },
  {
    page: '/ai',
    section: '太傅',
    title: 'AI 太傅 - 智能规划',
    subtitle: '让AI帮你制定学习计划',
    description: 'AI太傅会根据你的背景和目标，生成详细的实现计划。无论是学习新技能、准备考试还是养成习惯，AI都能给出专业建议。',
    keyPoints: [
      { label: '填写背景', content: '介绍你的基础、可用时间等信息' },
      { label: '描述目标', content: '详细说明你想实现什么' },
      { label: '选择难度', content: '轻松、适度、挑战三档可选' },
      { label: '生成计划', content: 'AI会给出步骤化的实现路径' }
    ],
    tips: ['背景信息越详细，AI生成的计划越精准', '可以多次生成，选择最适合的方案'],
    position: 'bottom-right'
  },
  {
    page: '/ai',
    section: '太傅',
    title: 'AI 太傅 - 一键添加Flag',
    subtitle: '自动生成详细的可执行目标',
    description: '满意AI生成的计划，可以一键添加生成的具体目标到Flag列表，开始执行。',
    keyPoints: [
      { label: '查看计划', content: 'AI会列出详细的步骤和时间安排' },
      { label: '详细卡片', content: '一眼览尽执行目标信息' },
      { label: '添加Flag', content: '点击"添加到Flag"按钮保存' },
      { label: '避免重复', content: '已添加的计划会自动保存，防止重复添加' }
    ],
    tips: ['AI会将具体计划分解为多个小目标自由添加', '建议先试试轻松难度，再逐步提升'],
    position: 'bottom-right'
  },
  {
    page: '/data',
    section: '璇历',
    title: '璇历 - 数据统计',
    subtitle: '全面了解你的学习数据',
    description: '璇历页面顶部的数据统计卡片,展示你本月的整体表现和关键指标,让你一眼掌握自己的努力成果。',
    keyPoints: [
      { label: '本月概览', content: '显示本月总打卡天数、学习时长等核心数据' },
      { label: '今日数据', content: '查看今天已完成的打卡次数和学习时长' },
      { label: '时间切换', content: '支持切换周、月、年三种时间维度查看' },
      { label: '趋势对比', content: '通过数据对比了解自己的进步情况' }
    ],
    tips: ['每周查看数据统计,及时调整学习策略', '对比不同时期的数据,见证自己的成长'],
    position: 'bottom-right'
  },
  {
    page: '/data',
    section: '璇历',
    title: '璇历 - flag完成',
    subtitle: '追踪目标完成情况',
    description: 'Flag完成环形图直观展示各类型目标的分布和完成进度,帮助你了解时间和精力的分配情况。',
    keyPoints: [
      { label: '环形图展示', content: '不同颜色代表不同类型的Flag目标' },
      { label: '完成比例', content: '一眼看出每个类型的完成百分比' },
      { label: '类型分布', content: '了解自己在学习、运动、工作等方面的投入' },
      { label: '优化方向', content: '根据数据调整目标设置,保持均衡发展' }
    ],
    tips: ['建议让各类型目标保持相对均衡', '如果某类完成率低,考虑调整难度或时间分配'],
    position: 'bottom-right'
  },
  {
    page: '/data',
    section: '璇历',
    title: '璇历 - 学习视图',
    subtitle: '可视化你的学习轨迹',
    description: '学习趋势图将你的坚持过程可视化,让努力清晰可见。',
    keyPoints: [
      { label: '时间切换', content: '支持切换周、月、年三种时间维度查看' },
      { label: '学习曲线', content: '图表展示学习时长的变化趋势' },
      { label: '连续记录', content: '查看自己日日夜夜的学习时长' },
      { label: '习惯养成', content: '通过视图的填充,直观感受习惯的养成过程' }
    ],
    tips: ['持续地学习会让视图更加饱满,很有成就感', '如果发现某段时间学习时长下降,及时反思调整'],
    position: 'bottom-right'
  },
  {
    page: '/contact',
    section: '翰林',
    title: '翰林院论 - 社区广场',
    subtitle: '发现同行者，互相激励',
    description: '在社区广场，你可以看到其他用户分享的目标和进展。点赞、评论、交流经验，在这里找到志同道合的伙伴。',
    keyPoints: [
      { label: '浏览动态', content: '查看所有用户的公开帖子和Flag' },
      { label: '互动交流', content: '点赞、评论、为他人加油' },
      { label: '搜索用户', content: '查找特定用户，方便联系他人' },
      { label: '查看信息', content: '点击头像弹出资料卡片，了解TA的成就和数据' }
    ],
    tips: ['公开的Flag会自动成为帖子分享', '积极互动能结识更多朋友'],
    position: 'bottom-right'
  },
  {
    page: '/contact',
    section: '翰林',
    title: '翰林院论 - 发布动态',
    subtitle: '分享你的进步和感悟',
    description: '除了Flag自动分享，你还可以主动发布动态，记录心得、分享经验、寻求建议。',
    keyPoints: [
      { label: '创建帖子', content: '点击右下角"+"按钮发布新动态' },
      { label: '丰富内容', content: '支持文字、图片、链接等' },
      { label: '接收反馈', content: '查看评论和点赞，与社区互动' },
      { label: '管理帖子', content: '可以编辑或删除自己的帖子' }
    ],
    tips: ['分享真实的经验更容易获得共鸣', '定期回复评论能增加互动'],
    position: 'bottom-right'
  },
  {
    page: '/contact',
    section: '翰林',
    title: '翰林院论 - 社区功能',
    subtitle: '更多互动方式等你探索',
    description: '翰林院论还提供了封神榜、谈玄斋、雁书札三大特色功能，让你的社交体验更加丰富有趣。',
    keyPoints: [
      { label: '封神榜', content: '查看打卡、完成Flag、积分三个维度的排行榜，激励自己冲击榜单' },
      { label: '谈玄斋', content: '进入公共聊天室，实时畅聊交流，结识志同道合的朋友' },
      { label: '雁书札', content: '收到陌生人的私信评论，结识新的朋友' },
      { label: '一言好伙伴', content: '翰林院论里有个名叫一言的伙伴会每天分享一句激励的话' }
    ],
    tips: ['封神榜会激励你更加努力，争取上榜', '谈玄斋是结识新朋友的好地方', '雁书札里收到的新消息有邮件提醒哦'],
    position: 'bottom-right'
  },
  {
    page: '/mine',
    section: '素札',
    title: '我的 - 个人资料',
    subtitle: '展示你的个性与成就',
    description: '个人中心是你在知序的专属空间，展示你的学习成果和个性化信息，让其他用户更好地了解你。',
    keyPoints: [
      { label: '数据统计', content: '查看打卡天数、完成Flag数、总积分等关键数据' },
      { label: '徽章墙', content: '展示已解锁的成就徽章，记录你的里程碑时刻' },
      { label: '消息提醒', content: '设置每日提醒，从不忘记时间' },
      { label: '个人信息', content: '编辑资料，修改昵称、个性签名、头像等' },
    ],
    tips: ['设置个性签名让别人更了解你', '成就徽章会在达成条件后自动解锁'],
    position: 'bottom-right'
  },
  {
    page: '/mine',
    section: '素札',
    title: '我的 - 账号设置',
    subtitle: '管理你的账号与偏好',
    description: '在账号设置中，你可以管理密码、消息提醒、查看关于信息，还能随时重新观看功能简介。',
    keyPoints: [
      { label: '用户反馈', content: '有什么问题尽管点击这里来反馈哦' },
      { label: '修改密码', content: '定期更换密码，保护账号安全' },
      { label: '功能简介', content: '点击"功能简介"卡片随时回顾功能介绍' },
      { label: '关于我们', content: '可以查看版本信息和制作团队' }
    ],
    tips: ['多多反馈，帮助我们不断改进', '如果忘记某个功能怎么用，可以重看教程'],
    position: 'bottom-right'
  },
  {
    page: '/mine',
    section: '总结',
    title: '开始你的自律之旅',
    subtitle: '现在就行动起来',
    description: '知序的功能简介，告一段落。记住，自律不是一蹴而就的，而是每天进步一点点的累积。',
    keyPoints: [
      { label: '第一步', content: '前往Flag页面创建你的第一个目标' },
      { label: '第二步', content: '试试让AI助手帮你制定计划' },
      { label: '第三步', content: '查看你的第一笔学习数据' },
      { label: '第四步', content: '在社区分享你的目标，找到同行者' }
    ],
    tips: ['建议从一个小目标开始，不要贪多', '坚持21天，让打卡成为习惯', '遇到困难时，记得来社区寻找支持'],
    position: 'bottom-right'
  }
];

export function Tutorial() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // 检查教程是否完成
  const isTutorialCompleted = () => {
    const userId = localStorage.getItem('currentUserId') || 'default';
    return localStorage.getItem(`tutorial_completed_${userId}`) === 'true';
  };

  // 检查教程是否激活
  const isTutorialActive = () => {
    const userId = localStorage.getItem('currentUserId') || 'default';
    return localStorage.getItem(`tutorial_active_${userId}`) === 'true';
  };

  // 设置教程激活状态
  const setTutorialActive = (active: boolean) => {
    const userId = localStorage.getItem('currentUserId') || 'default';
    if (active) {
      localStorage.setItem(`tutorial_active_${userId}`, 'true');
      localStorage.setItem(`tutorial_step_${userId}`, '0');
    } else {
      localStorage.removeItem(`tutorial_active_${userId}`);
      localStorage.removeItem(`tutorial_step_${userId}`);
    }
  };

  // 获取当前步骤索引
  const getCurrentStepIndex = () => {
    const userId = localStorage.getItem('currentUserId') || 'default';
    const savedStep = localStorage.getItem(`tutorial_step_${userId}`);
    return savedStep ? parseInt(savedStep) : 0;
  };

  // 保存当前步骤索引
  const saveCurrentStepIndex = (index: number) => {
    const userId = localStorage.getItem('currentUserId') || 'default';
    localStorage.setItem(`tutorial_step_${userId}`, index.toString());
  };

  // 初始化教程状态
  useEffect(() => {
    if (isTutorialActive() && !isTutorialCompleted()) {
      const stepIndex = getCurrentStepIndex();
      setCurrentStepIndex(stepIndex);
      
      // 检查当前页面是否匹配教程步骤
      const currentStep = tutorialSteps[stepIndex];
      if (currentStep && currentStep.page === location.pathname) {
        setIsVisible(true);
      }
    }
  }, [location.pathname]);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex < tutorialSteps.length) {
      const currentPage = tutorialSteps[currentStepIndex].page;
      const nextStep = tutorialSteps[nextIndex];
      
      setCurrentStepIndex(nextIndex);
      saveCurrentStepIndex(nextIndex);
      
      // 如果下一步在不同页面，先隐藏弹窗再跳转
      if (currentPage !== nextStep.page) {
        setIsVisible(false);
        navigate(nextStep.page);
      }
      // 如果在同一页面，保持弹窗显示，内容会自动更新
    } else {
      // 完成教程
      handleComplete();
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    
    if (prevIndex >= 0) {
      const currentPage = tutorialSteps[currentStepIndex].page;
      const prevStep = tutorialSteps[prevIndex];
      
      setCurrentStepIndex(prevIndex);
      saveCurrentStepIndex(prevIndex);
      
      // 如果上一步在不同页面，先隐藏弹窗再跳转
      if (currentPage !== prevStep.page) {
        setIsVisible(false);
        navigate(prevStep.page);
      }
      // 如果在同一页面，保持弹窗显示，内容会自动更新
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    const userId = localStorage.getItem('currentUserId') || 'default';
    localStorage.setItem(`tutorial_completed_${userId}`, 'true');
    setTutorialActive(false);
    setIsVisible(false);
  };

  // 使用索引直接获取当前步骤，而不是通过页面查找
  const currentStep = tutorialSteps[currentStepIndex];
  
  if (!isVisible || !currentStep || isTutorialCompleted() || !isTutorialActive()) {
    return null;
  }

  // 计算当前章节在7个章节中的索引
  const currentSectionIndex = SECTIONS.indexOf(currentStep.section);

  const getPositionClass = () => {
    switch (currentStep.position) {
      case 'bottom-right':
        return 'fixed bottom-20 right-4 w-80';
      case 'top-right':
        return 'fixed top-20 right-4 w-80';
      case 'center':
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80';
      default:
        return 'fixed bottom-20 right-4 w-80';
    }
  };

  return (
    <>
      {/* 全屏遮罩层 - 浅色透明 */}
      <div className="fixed inset-0 bg-black/20 z-40" />
      
      {/* 教程弹窗 */}
      <div className={`${getPositionClass()} z-50 animate-in slide-in-from-bottom-5`}>
        <Card className="p-0 shadow-2xl border-0 bg-white overflow-hidden rounded-2xl">
          {/* 头部 - 纯浅蓝色 */}
          <div className="bg-blue-100 p-3.5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-xl leading-tight text-blue-900">{currentStep.section}</h3>
                <p className="text-xs text-blue-700 mt-1.5 opacity-90">{currentStep.title}</p>
              </div>
              <button
                onClick={handleSkip}
                className="ml-2 text-blue-700/70 hover:text-blue-900 hover:bg-blue-200/70 transition-all rounded-full p-1 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* 进度条 - 7段式，更柔和的设计 */}
            <div className="mt-2.5">
              <div className="flex gap-1">
                {SECTIONS.map((section, index) => (
                  <div
                    key={section}
                    className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                      index <= currentSectionIndex ? 'bg-blue-400 shadow-sm' : 'bg-blue-100'
                    }`}
                    title={section}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 内容区域 - 更紧凑 */}
          <div className="p-3.5 pb-6 space-y-2.5 max-h-[50vh] overflow-y-auto">
            {/* 描述 */}
            <p className="text-gray-600 text-sm leading-relaxed">
              {currentStep.description}
            </p>

            {/* 关键要点 - 柔和设计 */}
            {currentStep.keyPoints.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 rounded-xl p-3 shadow-sm">
                <div className="space-y-2">
                  {currentStep.keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-snug">{point.label}</p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{point.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 小贴士 - 柔和设计 */}
            {currentStep.tips && currentStep.tips.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 rounded-xl p-2.5 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                  <h4 className="text-xs font-semibold text-amber-900">小贴士</h4>
                </div>
                <div className="space-y-1">
                  {currentStep.tips.map((tip, index) => (
                    <p key={index} className="text-xs text-amber-900/80 flex items-start gap-1.5 leading-relaxed">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span className="flex-1">{tip}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 - 紧凑设计 */}
          <div className="border-t border-gray-100 p-2.5 bg-blue-50 flex justify-between items-center">
            {currentStepIndex > 0 ? (
              <Button
                size="sm"
                onClick={handlePrevious}
                className="gap-1 bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs h-8 px-4 rounded-lg shadow-sm hover:shadow transition-all font-medium"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                上一步
              </Button>
            ) : (
              <div></div>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1 bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs h-8 px-4 rounded-lg shadow-sm hover:shadow transition-all font-medium"
            >
              {currentStepIndex === tutorialSteps.length - 1 ? '完成' : '下一步'}
              {currentStepIndex < tutorialSteps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

// 开始教程
export function startTutorial(): void {
  const userId = localStorage.getItem('currentUserId') || 'default';
  localStorage.setItem(`tutorial_active_${userId}`, 'true');
  localStorage.setItem(`tutorial_step_${userId}`, '0');
  // 不设置completed，因为教程正在进行中
  localStorage.removeItem(`tutorial_completed_${userId}`);
}

// 检查是否需要自动显示教程（新用户）
export function shouldAutoStartTutorial(): boolean {
  const userId = localStorage.getItem('currentUserId') || 'default';
  const completed = localStorage.getItem(`tutorial_completed_${userId}`);
  const active = localStorage.getItem(`tutorial_active_${userId}`);
  // 如果从未完成过教程，且教程未激活，则自动开始
  return completed !== 'true' && active !== 'true';
}

// 手动标记教程已完成
export function markTutorialCompleted(): void {
  const userId = localStorage.getItem('currentUserId') || 'default';
  localStorage.setItem(`tutorial_completed_${userId}`, 'true');
  localStorage.removeItem(`tutorial_active_${userId}`);
  localStorage.removeItem(`tutorial_step_${userId}`);
}
