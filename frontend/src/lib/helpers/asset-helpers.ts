// 导入所有头像图片
import avatar1 from '../../assets/head/screenshot_20251114_131601.png';
import avatar2 from '../../assets/head/screenshot_20251114_131629.png';
import avatar3 from '../../assets/head/screenshot_20251114_131937.png';
import avatar4 from '../../assets/head/screenshot_20251114_131951.png';
import avatar5 from '../../assets/head/screenshot_20251114_132014.png';
import avatar6 from '../../assets/head/screenshot_20251114_133459.png';
import avatar7 from '../../assets/head/微信图片_20251115203432_32_227.jpg';
import avatar8 from '../../assets/head/微信图片_20251115203433_33_227.jpg';
import avatar9 from '../../assets/head/微信图片_20251115203434_34_227.jpg';
import avatar10 from '../../assets/head/微信图片_20251115203434_35_227.jpg';
import avatar11 from '../../assets/head/微信图片_20251115203435_36_227.jpg';
import avatar12 from '../../assets/head/微信图片_20251115203436_37_227.jpg';
import avatar13 from '../../assets/head/微信图片_20251116131024_45_227.jpg';
import avatar14 from '../../assets/head/微信图片_20251116131024_46_227.jpg';
import avatar15 from '../../assets/head/微信图片_20251116131025_47_227.jpg';
import avatar16 from '../../assets/head/微信图片_20251116131026_48_227.jpg';
import avatar17 from '../../assets/head/微信图片_20251116131027_49_227.jpg';
import avatar18 from '../../assets/head/微信图片_20251116131028_50_227.jpg';
import avatar19 from '../../assets/head/微信图片_20251116131029_51_227.jpg';
import avatar20 from '../../assets/head/微信图片_20251116131030_52_227.jpg';
import avatar21 from '../../assets/head/微信图片_20251116131031_53_227.jpg';
import avatar22 from '../../assets/head/微信图片_20251117235910_62_227.jpg';
import avatar23 from '../../assets/head/微信图片_20251117235910_63_227.jpg';
import avatar24 from '../../assets/head/微信图片_20251117235911_64_227.jpg';
import avatar25 from '../../assets/head/微信图片_20251117235912_65_227.jpg';
import avatar26 from '../../assets/head/微信图片_20251117235913_66_227.jpg';
import avatar27 from '../../assets/head/微信图片_20251117235914_67_227.jpg';
import avatar28 from '../../assets/head/微信图片_20251117235915_68_227.jpg';
import avatar29 from '../../assets/head/微信图片_20251117235916_69_227.jpg';
import avatar30 from '../../assets/head/微信图片_20251117235917_71_227.jpg';
import avatar31 from '../../assets/head/微信图片_20251118000147_72_227.jpg';
import avatar32 from '../../assets/head/微信图片_20251118000148_74_227.jpg';

// 前端本地头像数组（共32个头像，索引0-31对应头像1-32）
export const AVATAR_FILES = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
  avatar11,
  avatar12,
  avatar13,
  avatar14,
  avatar15,
  avatar16,
  avatar17,
  avatar18,
  avatar19,
  avatar20,
  avatar21,
  avatar22,
  avatar23,
  avatar24,
  avatar25,
  avatar26,
  avatar27,
  avatar28,
  avatar29,
  avatar30,
  avatar31,
  avatar32,
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
 * @returns 完整的头像URL（导入的图片资源）
 */
export function getAvatarUrl(avatarPath: string | undefined): string {
  if (!avatarPath) return '';
  // 如果是 /api/avatar/:id 格式，返回对应的导入头像
  const apiAvatarMatch = avatarPath.match(/^\/api\/avatar\/(\d+)$/);
  if (apiAvatarMatch) {
    const index = parseInt(apiAvatarMatch[1], 10);
    if (index >= 1 && index <= AVATAR_FILES.length) {
      return AVATAR_FILES[index - 1];
    }
    // 索引无效，使用默认头像
    return AVATAR_FILES[0];
  }
  // 如果已经是导入的资源，直接返回
  return avatarPath;
}
