import { BottomNav } from "../components";

// 数据分析页面
export default function DataPage() {
  return (
    <div className="flex min-h-screen flex-col bg-(--background)">
      <div className="flex-1 pb-20">
        {/* 页面内容区域 */}
        数据
      </div>
      <BottomNav />
    </div>
  );
}
