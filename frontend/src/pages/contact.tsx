import { BottomNav, Search } from "../components";

// 联系我们页面
export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Search />
      <div className="flex-1 pb-20 pt-16">
        {/* 页面内容区域 */}
        聊天
      </div>
      <BottomNav />
    </div>
  );
}
