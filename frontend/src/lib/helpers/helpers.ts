// 日期格式化
export const formatDate = (date: Date | string, format = 'YYYY-MM-DD HH:mm:ss'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// 格式化日期为 YYYY-MM-DD
export const formatDateYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// 计算连续打卡天数
export const calculateStreak = (punchedDates: string[]): number => {
  let n = 0;
  const cursor = new Date();
  while (true) {
    const curStr = formatDateYMD(cursor);
    if (punchedDates.includes(curStr)) {
      n++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return n;
};

// 计算本月已打卡天数
export const calculateMonthlyPunches = (punchedDates: string[]): number => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return punchedDates.filter(dateStr => {
    const date = new Date(dateStr);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
};

// 格式化学习计时（秒转 MM:SS）
export const formatElapsedTime = (seconds: number): { minutes: string; seconds: string } => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return { minutes: m, seconds: s };
};

// 验证邮箱格式
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 验证手机号格式（中国大陆）
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 防抖函数
export const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// 节流函数
export const throttle = <T extends (...args: never[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 深拷贝对象
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// 生成随机 ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// 安全的数字范围限制
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// 延迟执行（Promise 版本）
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
