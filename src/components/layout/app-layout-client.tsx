"use client";

import { memo } from "react";
import { SidebarProvider, useSidebar } from "@/components/providers/sidebar-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

const LayoutContent = memo(({ children }: { children: React.ReactNode }) => {
  const { isOpen } = useSidebar();

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div 
        className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          // サイドバーが開いている時は常にマージンを追加（コンテンツが隠れないように）
          isOpen && "ml-64"
        )}
      >
        {children}
      </div>
    </div>
  );
});

LayoutContent.displayName = "LayoutContent";

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
}
