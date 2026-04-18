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
    title: '欢迎使用知序',
    subtitle: '从小目标开始构建长期习惯',
    description: '知序把长期目标拆成可执行的小任务（Flag），并结合每日打卡、学习时长与数据可视化，帮助你看见持续进步。下面的步骤会带你熟悉常用页面与关键操作。',
    keyPoints: [
      { label: '创建 Flag', content: '在「Flag」页面点击“创建 Flag”填写目标、周期与提醒' },
      { label: '每日打卡', content: '完成任务后在卡片上点击“打卡”，可填写本次时长或简短备注' },
      { label: 'AI 助手', content: '在「AI」页面输入目标，AI 会生成阶段化计划并提供“一键添加到 Flag”按钮' },
      { label: '数据与社区', content: '在「璇历」查看趋势，在「翰林」分享与获取反馈' }
    ],
    tips: ['建议从 7–14 天的小目标开始，每天 5–30 分钟更容易坚持', '把目标写得具体、可量化（例如：每天背 20 个单词）'],
    position: 'bottom-right'
  },
  {
    page: '/flag',
    section: '圭表',
    title: '创建你的第一个 Flag',
    subtitle: '把大目标拆成可执行的小任务',
    description: '点击「创建 Flag」，填写标题（简洁）、规则（如何判定完成）、每日次数与起止日期。推荐先从 7–14 天、每天 1 次的小目标开始，便于建立连续性。',
    keyPoints: [
      { label: '标题与规则', content: '用一句话说明“何为完成”，例如：完成 20 个单词的默写' },
      { label: '周期与次数', content: '设置开始/结束日期与每日完成次数（默认 1）' },
      { label: '提醒设置', content: '设置推送/本地提醒时间，帮助形成习惯' },
      { label: '公开选项', content: '选择是否分享到「翰林」社区以获取同行鼓励' }
    ],
    tips: ['把规则写清楚，避免歧义；若担心中断，把目标拆短以降低成本'],
    position: 'bottom-right'
  },
  {
    page: '/flag',
    section: '圭表',
    title: '每日打卡与积分',
    subtitle: '记录并获得即时反馈',
    description: '打卡会调用后端接口更新进度并同步到日历。成功后会显示本次获得的积分与连续奖励进度；若提交失败（网络/鉴权），会提示错误并可重试。',
    keyPoints: [
      { label: '操作路径', content: '在 Flag 列表或卡片点“打卡”；若需填时长/备注，确认后提交' },
      { label: '积分与连续奖励', content: '系统基于打卡记录计算积分并支持连续天数加成' },
      { label: '可视化', content: '打卡会在日历上标记，并在 Flag 详情中更新环形进度' },
      { label: '故障处理', content: '若提示登录或网络异常，检查账号状态后重试；失败不会破坏本地数据' }
    ],
    tips: ['保持固定时间打卡（例如每天睡前）更容易形成习惯', '连续性比单次强度更重要，优先保证连胜'] ,
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
    title: 'AI 太傅 - 生成可执行计划',
    subtitle: '用自然语言描述目标，AI 输出阶段化方案',
    description: '在「AI」页面输入目标、现状与可用时间并选择难度，系统会调用后端 AI 接口生成分步计划。客户端会尝试把文本解析为若干子任务并给出建议的起止日期与预计积分，最终由你审核并确认添加为 Flag。',
    keyPoints: [
      { label: '输入示例', content: '写清期望成果、可投入时间、已有基础，例如：“3 个月内达到 CET-6，周学习 6 小时”' },
      { label: '难度调整', content: '选择“轻松/适度/挑战”影响任务粒度与时长' },
      { label: '解析与预览', content: 'AI 生成后会给出分解的步骤（可编辑）并支持预览再添加' },
      { label: '添加到 Flag', content: '确认后点击“一键添加到 Flag”，系统会逐条创建对应 Flag' }
    ],
    tips: ['详细背景能显著提升计划质量', '若生成过长，先筛选核心步骤再添加'] ,
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
    title: '学习计时 - 开始与提交',
    subtitle: '记录专注时长并计入统计',
    description: '在学习页面点击“开始学习”按钮进入计时，会话结束后点击停止并提交本次时长。提交成功后时长会计入今日/本月统计；若上传失败会自动重试并提示您重试或稍后再试。',
    keyPoints: [
      { label: '开始/停止', content: '点击“开始学习”进入计时，完成后点击“停止并提交”' },
      { label: '上报与积分', content: '提交后会将秒级时长上报到服务器，并可能触发与 Flag 的计时关联与积分奖励' },
      { label: '失败处理', content: '上传失败将尝试重试，若多次失败请检查网络并重试提交' },
      { label: '查看统计', content: '在“璇历”查看今日/本月学习时长与趋势' }
    ],
    tips: ['若需把计时计入某个 Flag，请在开始前在 Flag 详情或计时面板关联该 Flag', '遇到上传问题先保持页面不要刷新，等待重试或手动重新提交'],
    position: 'bottom-right'
  },
  {
    page: '/data',
    section: '璇历',
    title: '璇历 - 读懂你的数据',
    subtitle: '用数据支持你的行为优化',
    description: '“璇历”提供打卡天数、学习时长、完成率等多维数据。优先观察趋势而非单日波动：识别高效期、低谷期并据此调整频率或难度。',
    keyPoints: [
      { label: '多维概览', content: '查看本月累计、缺卡与不同 Flag 类型的完成分布' },
      { label: '趋势分析', content: '切换周/月/年，观察学习时长和完成率的变化' },
      { label: '任务分布', content: '通过环形图看到不同类型目标的时间分配' },
      { label: '复盘建议', content: '每周复盘一次：记录原因、调整计划、设立下周目标' }
    ],
    tips: ['关注持续性，而不是短期峰值', '根据数据降低高失败率目标的难度或频率'],
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
    title: '谈玄斋 - 实时聊天与私信',
    subtitle: '进入聊天室与私聊，保持互动',
    description: '在翰林中可进入“谈玄斋”进行实时聊天或使用“雁书札”发送私信。聊天室为实时交互，需稳定网络；私信与未读消息会在个人中心显示未读计数。',
    keyPoints: [
      { label: '进入聊天室', content: '点击“谈玄斋”进入公共聊天室，参与实时讨论' },
      { label: '私信与未读', content: '收到私信会在“我的”页面显示未读提示，点击即可查看' },
      { label: '网络与连接', content: '聊天室基于实时连接，若无法进入请检查网络或稍后重试' },
      { label: '礼貌与规范', content: '请遵守社区规则，文明交流，避免发布违规内容' }
    ],
    tips: ['聊天室需要稳定网络，若多次连接失败请检查网络或重启应用', '未读消息会在个人中心展示小红点，方便及时处理'],
    position: 'bottom-right'
  },
  {
    page: '/contact',
    section: '翰林',
    title: '翰林院论 - 社区与分享',
    subtitle: '分享、学习与建立互助关系',
    description: '在「翰林」你可以发布进展、查看他人经验、参与讨论。公开的 Flag 会成为帖子，方便他人点赞与评论。互动采用乐观更新，若网络失败会提示并回滚。',
    keyPoints: [
      { label: '发布与分享', content: '点击“+”发布动态或选择将 Flag 设为公开分享到社区' },
      { label: '互动机制', content: '点赞/评论立即反馈（乐观更新），失败时会恢复并提示错误' },
      { label: '发现与搜索', content: '可按用户/标签搜索并关注你感兴趣的人' },
      { label: '隐私', content: '公开后他人可查看并互动，私密 Flag 不会出现在社区' }
    ],
    tips: ['分享具体成果更易获得实用建议', '回应评论能增加互动与影响力'],
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
    title: '通知与提醒 - 权限与排查',
    subtitle: '确保你能收到学习与 Flag 提醒',
    description: '通知需要浏览器/设备权限与个人中心的提醒设置同时开启。若未收到提醒，请检查浏览器通知权限、个人中心提醒开关和提醒时间设置。',
    keyPoints: [
      { label: '权限检查', content: '在浏览器或系统设置里允许站点通知权限' },
      { label: '个人中心设置', content: '进入“我的”→提醒设置，确认学习提醒与 Flag 提醒已开启并设置了时间' },
      { label: '故障排查', content: '若仍未收到，请检查网络、浏览器是否阻止弹窗或 PWA 推送权限' },
      { label: '后端推送', content: '若后端未配置推送服务，浏览器本地提醒仍可按本地计时触发' }
    ],
    tips: ['首次使用时系统会请求通知权限，请选择“允许”以接收提醒', '移动端请在系统设置中检查应用通知权限'],
    position: 'bottom-right'
  },
  {
    page: '/mine',
    section: '素札',
    title: '我的 - 管理你的账号与成就',
    subtitle: '个人中心：设置、成就与重看教程',
    description: '个人中心可查看与编辑个人资料、徽章与积分，管理消息提醒，并在“功能简介”内随时重看本教程或单独章节。设置变更会同步到服务器并返回保存结果。',
    keyPoints: [
      { label: '资料与头像', content: '修改昵称/签名/头像并保存，更新会同步到社区' },
      { label: '徽章与积分', content: '查看已解锁成就与累计积分，成就由后端判定' },
      { label: '提醒管理', content: '设置或关闭学习/Flag 提醒时间' },
      { label: '重看教程', content: '在“功能简介”卡片中随时重看本教程' }
    ],
    tips: ['保存失败请检查网络或重新登录', '需重看教程时，进入“功能简介”卡片点击“重看教程”即可'] ,
    position: 'bottom-right'
  },
  {
    page: '/mine',
    section: '素札',
    title: '我的 - 账号设置',
    subtitle: '管理你的账号与偏好',
    description: '在账号设置中，你可以安装应用、管理密码、消息提醒、查看关于信息，还能随时重新观看功能简介。',
    keyPoints: [
      { label: '用户反馈', content: '有什么问题尽管点击这里来反馈哦' },
      { label: '修改密码', content: '定期更换密码，保护账号安全' },
      { label: '功能简介', content: '点击"功能简介"卡片随时回顾功能介绍' },
      { label: '安装应用', content: '点击安装卡片将知序添加到桌面，享受原生体验' },
      { label: '关于我们', content: '可以查看版本信息和制作团队' }
    ],
    tips: ['多多反馈，帮助我们不断改进', '如果忘记某个功能怎么用，可以重看教程'],
    position: 'bottom-right'
  },
  {
    page: '/mine',
    section: '总结',
    title: '开始你的自律之旅',
    subtitle: '把今天的小步子连成长期的进步',
    description: '恭喜你完成快速上手。建议立即创建第一个小目标、尝试用 AI 生成计划并开始每日打卡。每周复盘数据并根据趋势调整计划。',
    keyPoints: [
      { label: '立刻行动', content: '前往「Flag」创建第一个小目标并开启提醒' },
      { label: '借助 AI', content: '在「AI」页面生成计划并将可执行步骤添加为 Flag' },
      { label: '每天记录', content: '坚持打卡并在「璇历」观察长期趋势' },
      { label: '分享互动', content: '把进展分享到「翰林」从社区获得支持' }
    ],
    tips: ['从容易坚持的小目标开始，逐步增加挑战', '每周复盘并调整计划，保持长期可持续性'],
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
