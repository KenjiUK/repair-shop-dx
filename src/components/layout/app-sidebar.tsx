"use client";

import { useRouter, usePathname } from "next/navigation";
import { memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { 
  Home, 
  Search, 
  Car, 
  FolderKanban, 
  Image, 
  Settings, 
  Bell,
  BarChart3
} from "lucide-react";

const menuItems = [
  { label: "入庫車両管理", href: "/", icon: Home },
  { label: "履歴検索", href: "/jobs/history", icon: Search },
  { label: "代車管理", href: "/inventory/courtesy-cars", icon: Car },
  { label: "長期プロジェクト管理", href: "/projects/long-term", icon: FolderKanban },
] as const;

const adminItems = [
  { label: "作業指示・進捗管理", href: "/manager/kanban", icon: FolderKanban },
  { label: "レポート・分析", href: "/manager/analytics", icon: BarChart3 },
  { label: "ブログ写真管理", href: "/admin/blog-photos", icon: Image },
  { label: "数値マスター管理", href: "/admin/settings/numerical-masters", icon: Settings },
  { label: "お知らせ管理", href: "/admin/announcements", icon: Bell },
] as const;

/**
 * メニューアイテムコンポーネント（メモ化）
 */
const MenuItem = memo(({ 
  item, 
  isActive, 
  onNavigate 
}: { 
  item: typeof menuItems[number] | typeof adminItems[number];
  isActive: boolean;
  onNavigate: (href: string) => void;
}) => {
  const Icon = item.icon;
  
  return (
    <button
      onClick={() => onNavigate(item.href)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
        isActive 
          ? "bg-slate-900 text-white font-semibold hover:bg-slate-800" 
          : "text-slate-700 hover:bg-slate-100"
      )}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
      <span>{item.label}</span>
    </button>
  );
});

MenuItem.displayName = "MenuItem";

/**
 * アプリサイドバーコンポーネント
 * ハンバーガーメニューで開閉するナビゲーションメニュー（デスクトップ・モバイル共通）
 */
function AppSidebarComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, close, isMobile } = useSidebar();

  // ナビゲーション処理をメモ化
  const handleNavigation = useCallback((href: string) => {
    router.push(href);
    // ナビゲーション後にサイドバーを閉じる
    close();
  }, [router, close]);

  return (
    <>
      {/* オーバーレイ（デスクトップのみ: 開いている時は常に表示） */}
      {/* モバイルではオーバーレイを表示せず、メインコンテンツをスライドさせる方式 */}
      {isOpen && !isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-[39]"
          onClick={close}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={cn(
          "flex flex-col w-64 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 z-[40] transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="メインナビゲーション"
        aria-hidden={!isOpen}
      >
        <nav className="flex-1 overflow-y-auto py-4">
          {/* メインメニュー */}
          <div className="space-y-1 px-2">
            {menuItems.map((item) => (
              <MenuItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onNavigate={handleNavigation}
              />
            ))}
          </div>

          <Separator className="my-4" />

          {/* 管理メニュー */}
          <div className="space-y-1 px-2">
            {adminItems.map((item) => (
              <MenuItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onNavigate={handleNavigation}
              />
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

// コンポーネントをメモ化（propsが変更されない限り再レンダリングしない）
export const AppSidebar = memo(AppSidebarComponent);

AppSidebar.displayName = "AppSidebar";
