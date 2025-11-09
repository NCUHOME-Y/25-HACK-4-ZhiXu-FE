import { BottomNav, Search } from "../components";

// 联系我们页面
export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 shadow-sm backdrop-blur-sm">
        <div className="p-3">
          <Search />
        </div>
      </header>
      <div className="flex-1 pb-20">
        {/* 页面内容区域 */}
        聊天
      </div>
      <BottomNav />
    </div>
  );
}
