
// 前端本地头像文件名映射（1-21）
export const AVATAR_FILES = [
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
 * 获取前端本地资源URL
 * @param path 资源路径，如 /assets/head/avatar.png
 * @returns 完整的资源URL
 */
export function getAssetUrl(path: string | undefined): string {
  if (!path) return '';
  // 如果已经是完整URL（http或https开头），直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // 直接返回相对路径，Vite会自动处理 public 或 src/assets 静态资源
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * 获取头像URL的辅助函数
 * @param avatarPath 头像路径或head_show索引的API路径（如 /api/avatar/1）
 * @returns 完整的头像URL
 */
export function getAvatarUrl(avatarPath: string | undefined): string {
  if (!avatarPath) return '';
  // 如果是 /api/avatar/:id 格式，转换为前端本地头像文件路径
  const apiAvatarMatch = avatarPath.match(/^\/api\/avatar\/(\d+)$/);
  if (apiAvatarMatch) {
    const index = parseInt(apiAvatarMatch[1], 10);
    if (index >= 1 && index <= AVATAR_FILES.length) {
      const fileName = AVATAR_FILES[index - 1];
      return getAssetUrl(`/src/assets/head/${fileName}`);
    }
    // 索引无效，使用默认头像
    return getAssetUrl(`/src/assets/head/${AVATAR_FILES[0]}`);
  }
  return getAssetUrl(avatarPath);
}
