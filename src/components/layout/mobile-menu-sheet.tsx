"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Search, 
  Car, 
  FolderKanban, 
  Image, 
  Settings, 
  Bell 
} from "lucide-react";

const menuItems = [
  { label: "入庫車両管理", href: "/", icon: Home },
  { label: "履歴検索", href: "/jobs/history", icon: Search },
  { label: "代車管理", href: "/inventory/courtesy-cars", icon: Car },
  { label: "長期プロジェクト管理", href: "/projects/long-term", icon: FolderKanban },
];

const adminItems = [
  { label: "ブログ写真管理", href: "/admin/blog-photos", icon: Image },
  { label: "数値マスター管理", href: "/admin/settings/numerical-masters", icon: Settings },
  { label: "お知らせ管理", href: "/admin/announcements", icon: Bell },
];

/**
 * モバイル用メニューSheetコンポーネント
 * モバイル画面（md未満）で表示されるハンバーガーメニュー
 */
export function MobileMenuSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 md:hidden"
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" strokeWidth={2.5} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 z-[50]">
        <nav className="flex flex-col h-full py-4">
          {/* メインメニュー */}
          <div className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
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
            })}
          </div>

          <Separator className="my-4" />

          {/* 管理メニュー */}
          <div className="space-y-1 px-2">
            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
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
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

