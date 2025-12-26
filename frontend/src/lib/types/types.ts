/**
 * 全局类型定义
 */

/**
 * 用户信息
 */
export interface User { 
  id: string; 
  name: string; 
  phone: string;
  nickname?: string;
  bio?: string;
  avatar?: string;
}

/**
 * 后端 /api/getUser 返回的用户完整信息
 */
export interface UserInfoResponse {
  user_id: number;
  name: string;
  email: string;
  head_show: number;
  daka: number;
  flag_number: number;
  count: number;
  month_learn_time: number;
  is_remind?: boolean;
  is_flag_remind?: boolean;
  time_remind?: number;
  min_remind?: number;
}

/**
 * /api/getUser API 的响应类型
 */
export interface GetUserResponse {
  user: UserInfoResponse;
  id?: number;
  user_id?: number;
  username?: string;
  phone?: string;
}

/**
 * 认证相关类型
 */
export interface LoginCredentials { phone: string; password: string }
export interface RegisterData { name: string; phone: string; password: string }
export interface OTPVerifyData { phone: string; code: string }
export interface AuthResponse { token: string; user: User }

/**
 * 通用 API 响应类型
 */
export interface ApiResponse<T = unknown> { success: boolean; data?: T; message?: string; error?: string }

/**
 * Flag 优先级：4=不急, 3=一般, 2=较急, 1=急切
 */
export type FlagPriority = 4 | 3 | 2 | 1;

/**
 * Flag 标签：1=学习提升, 2=健康运动, 3=工作效率, 4=兴趣爱好, 5=生活习惯
 */
export type FlagLabel = 1 | 2 | 3 | 4 | 5;

/**
 * 任务/Flag 数据结构
 */
export interface Task {
  id: number // 修改为number，与后端保持一致
  title: string // 对应后端 flag
  detail?: string // 对应后端 plan_content
  total?: number // 对应后端 daily_total (每日所需完成次数)
  count?: number // 对应后端 done_number
  completed?: boolean // 对应后端 had_done
  label?: FlagLabel // 类型标签 1-5
  priority?: FlagPriority // 优先级 4:不急 3:一般 2:较急 1:急切
  postId?: number // 修改为number，关联的社交帖子ID（有值=已分享，无值=未分享）
  points?: number // 该任务的积分值
  likes?: number // 点赞数（对应后端likes字段）
  comments?: unknown[] // 评论列表（对应后端comments字段）
  createdAt?: string // 创建时间
  startTime?: string // 计划起始时间
  endTime?: string // 计划结束时间
  // AI生成Flag的扩展字段
  startDate?: string // Flag有效期开始日期 (YYYY-MM-DD)
  endDate?: string // Flag有效期结束日期 (YYYY-MM-DD)
  dailyLimit?: number // 每日打卡上限
  todayCount?: number // 今日已打卡次数（后端返回）
  completedAt?: string // 完成时间戳（用于排序已完成列表）
  lastTickTime?: number // 上次打卡时间戳（用于冷却检查）
  enableNotification?: boolean // 是否启用该flag的消息提醒（最多3个）
  reminderTime?: string // 该flag的提醒时间 (HH:MM 格式)
}

// 打卡相关类型
export interface PunchChartProps {
  monthlyPunches: number
}

export interface TaskRingProps {
  count?: number
  total?: number
}

// 打卡记录
export interface PunchRecord {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  createdAt: string
}

// 学习记录
export interface StudyRecord {
  id: string
  userId: string
  startTime: string
  endTime?: string
  duration: number // 秒
}

// 数据统计相关类型
export interface MonthlyStats {
  punchedDays: number // 累计打卡天数
  missedDays: number // 缺卡天数
  totalStudyTime: number // 累计学习时长（秒）
}

// 标签统计数据
export interface LabelStats {
  label: FlagLabel
  labelName: string
  completed: number    // 已完成数量
  total: number       // 总数量
  percentage: number  // 完成百分比
  color: string
}

export interface FlagStats {
  completedCount: number // 已完成flag数量
  uncompletedCount: number // 未完成flag数量
  totalCount: number // 总flag数量
  labelStats?: LabelStats[] // 按标签统计
}

// 学习时长趋势数据（新）
export interface StudyTimeTrend {
  date: string // 日期 YYYY-MM-DD
  seconds: number // 学习时长（秒）
}

// 打卡记录扩展（包含打卡类型）
export interface PunchRecordExtended extends PunchRecord {
  type: 'active' | 'passive' // 主动打卡或被动打卡
}

// ========== 社交相关类型 ==========
// 社交用户类型（联系页面使用）
export interface ContactUser {
  id: number;          // 帖子ID
  userId: string;      // 发帖人的用户ID
  name: string;        // 映射自 API 的 userName
  avatar: string;      // 映射自 API 的 userAvatar
  message: string;     // 映射自 API 的 content
  likes: number;
  comments: ContactComment[];
  totalDays?: number;
  completedFlags?: number;
  totalPoints?: number;
  createdAt?: string;  // 帖子创建时间
}

// 评论类型（联系页面使用）
export interface ContactComment {
  id: number;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  time: string;        // 映射自 API 的 createdAt
}

// 私聊消息类型
export interface PrivateMessage {
  id: string;
  message: string;
  time: string;
  isMe: boolean;
  avatar?: string;
  userName?: string;
}

// 公共谈玄斋消息类型
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  message: string;
  time: string;
  isMe?: boolean;
}

