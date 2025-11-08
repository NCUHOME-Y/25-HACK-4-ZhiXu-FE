import { BottomNav } from "../components";

// 我的页面
export default function MinePage() {
  return (
    <div className="flex min-h-screen flex-col bg-(--background)">
      <div className="flex-1 pb-20">
        {/* 页面内容区域 */}
        我的
      </div>
      <BottomNav />
    </div>
  );
}
