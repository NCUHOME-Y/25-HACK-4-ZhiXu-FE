// 必要的全局类型定义（精简版）

// 用户相关
export interface User { id: string; name: string; phone: string }

// 认证相关
export interface LoginCredentials { phone: string; password: string }
export interface RegisterData { name: string; phone: string; password: string }
export interface OTPVerifyData { phone: string; code: string }
export interface AuthResponse { token: string; user: User }

// 通用 API 响应（保持轻量）
export interface ApiResponse<T = unknown> { success: boolean; data?: T; message?: string; error?: string }

// 任务类型（全局使用）
export interface Task {
  id: string
  title: string
  detail?: string
  total?: number
  count?: number
  completed?: boolean
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

export interface FlagStats {
  completedCount: number // 已完成flag数量
  uncompletedCount: number // 未完成flag数量
  totalCount: number // 总flag数量
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

