import { API_BASE } from '../../services/apiClient';

/**
 * 将相对路径的资源URL转换为绝对URL
 * @param path 资源路径，如 /assets/head/avatar.png
 * @returns 完整的资源URL
 */
export function getAssetUrl(path: string | undefined): string {
  if (!path) return '';
  
  // 如果已经是完整URL（http或https开头），直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 如果是相对路径，拼接API_BASE
  let baseUrl = API_BASE;
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  
  // 确保path以'/'开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
}

/**
 * 获取头像URL的辅助函数
 * @param avatarPath 头像路径
 * @returns 完整的头像URL
 */
export function getAvatarUrl(avatarPath: string | undefined): string {
  return getAssetUrl(avatarPath);
}
