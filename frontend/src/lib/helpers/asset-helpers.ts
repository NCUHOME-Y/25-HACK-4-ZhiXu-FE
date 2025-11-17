import { API_BASE } from '../../services/apiClient';

// 后端头像文件名映射（1-21）
const AVATAR_FILES = [
  'screenshot_20251114_131601.png',
  'screenshot_20251114_131629.png',
  'screenshot_20251114_131937.png',
  'screenshot_20251114_131951.png',
  'screenshot_20251114_132014.png',
  'screenshot_20251114_133459.png',
  '微信图片_20251115203432_32_227.jpg',
  '微信图片_20251115203433_33_227.jpg',
  '微信图片_20251115203434_34_227.jpg',
  '微信图片_20251115203434_35_227.jpg',
  '微信图片_20251115203435_36_227.jpg',
  '微信图片_20251115203436_37_227.jpg',
  '微信图片_20251116131024_45_227.jpg',
  '微信图片_20251116131024_46_227.jpg',
  '微信图片_20251116131025_47_227.jpg',
  '微信图片_20251116131026_48_227.jpg',
  '微信图片_20251116131027_49_227.jpg',
  '微信图片_20251116131028_50_227.jpg',
  '微信图片_20251116131029_51_227.jpg',
  '微信图片_20251116131030_52_227.jpg',
  '微信图片_20251116131031_53_227.jpg',
];

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
 * @param avatarPath 头像路径或head_show索引的API路径（如 /api/avatar/1）
 * @returns 完整的头像URL
 */
export function getAvatarUrl(avatarPath: string | undefined): string {
  if (!avatarPath) return '';
  
  // 如果是 /api/avatar/:id 格式，转换为实际的头像文件路径
  const apiAvatarMatch = avatarPath.match(/^\/api\/avatar\/(\d+)$/);
  if (apiAvatarMatch) {
    const index = parseInt(apiAvatarMatch[1], 10);
    if (index >= 1 && index <= AVATAR_FILES.length) {
      const fileName = AVATAR_FILES[index - 1];
      return getAssetUrl(`/assets/head/${fileName}`);
    }
    // 索引无效，使用默认头像
    return getAssetUrl(`/assets/head/${AVATAR_FILES[0]}`);
  }
  
  return getAssetUrl(avatarPath);
}
