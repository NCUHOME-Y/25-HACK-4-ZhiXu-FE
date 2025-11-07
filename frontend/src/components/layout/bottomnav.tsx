// components/MobileBottomNav.tsx
"use client";

import { Home, Search, User, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "../../lib/utils"; // 确保引入了 cn 工具函数

export function MobileBottomNav() {
  const navItems = [
    { value: "home", label: "首页", icon: Home },
    { value: "search", label: "发现", icon: Search },
    { value: "profile", label: "我的", icon: User },
    { value: "settings", label: "设置", icon: Settings },
  ];

  return (
    <Tabs defaultValue="home" className="block md:hidden">
      {/* 这里是内容区域。
        每个 TabsContent 对应一个导航项。
        为了避免底部导航栏遮挡内容，我们在内容底部添加了 padding。
      */}
      <TabsContent value="home" className="pb-20">
        <div className="p-4">
          <h2 className="text-xl font-bold">首页内容</h2>
          <p>这里是首页的滚动内容...</p>
        </div>
      </TabsContent>
      <TabsContent value="search" className="pb-20">
        <div className="p-4">
          <h2 className="text-xl font-bold">发现内容</h2>
          <p>这里是发现页面的内容...</p>
        </div>
      </TabsContent>
      <TabsContent value="profile" className="pb-20">
        <div className="p-4">
          <h2 className="text-xl font-bold">我的内容</h2>
          <p>这里是“我的”页面的内容...</p>
        </div>
      </TabsContent>
      <TabsContent value="settings" className="pb-20">
        <div className="p-4">
          <h2 className="text-xl font-bold">设置内容</h2>
          <p>这里是设置页面的内容...</p>
        </div>
      </TabsContent>

      {/* 这是底部的导航栏
      */}
      <TabsList className="fixed bottom-0 flex h-16 w-full rounded-t-lg bg-background p-0">
        {navItems.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            className={cn(
              "flex h-full flex-1 flex-col gap-1 rounded-none p-2",
              "data-[state=active]:bg-muted data-[state=active]:text-primary"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}