// 必要的全局类型定义（精简版）

// 用户相关
export interface User { 
  id: string; 
  name: string; 
  phone: string;
  nickname?: string;
  bio?: string;
  avatar?: string;
}

// 认证相关
export interface LoginCredentials { phone: string; password: string }
export interface RegisterData { name: string; phone: string; password: string }
export interface OTPVerifyData { phone: string; code: string }
export interface AuthResponse { token: string; user: User }

// 通用 API 响应（保持轻量）
export interface ApiResponse<T = unknown> { success: boolean; data?: T; message?: string; error?: string }

// Flag优先级类型
export type FlagPriority = 4 | 3 | 2 | 1; // 4:不急 3:一般 2:较急 1:急切

// Flag标签类型
export type FlagLabel = 1 | 2 | 3 | 4 | 5;

// 任务类型（全局使用）
export interface Task {
  id: string
  title: string // 对应后端 flag
  detail?: string // 对应后端 plan_content
  total?: number // 对应后端 plan_done_number
  count?: number // 对应后端 done_number
  completed?: boolean // 对应后端 had_done
  label?: FlagLabel // 类型标签 1-5
  priority?: FlagPriority // 优先级 4:不急 3:一般 2:较急 1:急切
  isPublic?: boolean // 对应后端 is_hiden 取反（是否公开到社交页面）
  postId?: string // 关联的社交帖子ID（当isPublic为true时）
  points?: number // 该任务的积分值
  agreeNumber?: number // 点赞数
  createdAt?: string // 创建时间
  startTime?: string // 计划起始时间
  endTime?: string // 计划结束时间
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
  totalStudyTime: number // 累计学习时长（分钟）
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

// 学习时长趋势数据
export interface StudyTrendData {
  label: string // 日期/周/月标签
  duration: number // 学习时长（分钟）
}

// 打卡类型统计（主动/被动）
export interface PunchTypeStats {
  week: string // 周标签
  active: number // 主动打卡次数
  passive: number // 被动打卡次数
}

// 打卡记录扩展（包含打卡类型）
export interface PunchRecordExtended extends PunchRecord {
  type: 'active' | 'passive' // 主动打卡或被动打卡
}

// ========== 社交相关类型 ==========
// 社交用户类型（联系页面使用）
export interface ContactUser {
  id: string;
  name: string;        // 映射自 API 的 userName
  avatar: string;      // 映射自 API 的 userAvatar
  message: string;     // 映射自 API 的 content
  likes: number;
  comments: ContactComment[];
  totalDays?: number;
  completedFlags?: number;
  totalPoints?: number;
}

// 评论类型（联系页面使用）
export interface ContactComment {
  id: string;
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

// 公共聊天室消息类型
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  message: string;
  time: string;
  isMe?: boolean;
}

