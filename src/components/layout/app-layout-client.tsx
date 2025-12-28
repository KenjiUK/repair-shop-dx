"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, useSidebar } from "@/components/providers/sidebar-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

const LayoutContent = memo(({ children }: { children: React.ReactNode }) => {
  const { isOpen, isMobile } = useSidebar();
  const pathname = usePathname();
  
  // 診断ページや作業ページではwindowのスクロールを使用するため、overflow-autoを無効化
  const isDiagnosisOrWorkPage = pathname?.includes('/mechanic/diagnosis/') || 
                                 pathname?.includes('/mechanic/work/');

  return (
    <div className={cn(
      "flex",
      // 診断ページや作業ページではmin-h-screenを使用（windowのスクロールに対応）
      isDiagnosisOrWorkPage ? "min-h-screen" : "h-screen"
    )}>
      <AppSidebar />
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 bg-slate-50 dark:bg-slate-900",
          // 診断ページや作業ページではoverflow-autoを無効化（windowのスクロールを使用）
          // その他のページでは縦スクロールのみ許可（横スクロールを防ぐ）
          // 2025年ベストプラクティス: すべてのページで横スクロールを防ぐ
          isDiagnosisOrWorkPage ? "overflow-visible overflow-x-hidden" : "overflow-y-auto overflow-x-hidden",
          // モバイル: サイドバーが開いている時は右にスライド（translateXを使用）
          // デスクトップ: サイドバーが開いている時はマージンを追加（ml-64を使用）
          isMobile && isOpen && "translate-x-[256px]",
          !isMobile && isOpen && "ml-64"
        )}
        style={{ touchAction: 'pan-y' }}
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
