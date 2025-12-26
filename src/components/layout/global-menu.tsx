"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  Car, 
  FolderKanban, 
  Settings, 
  Bell,
  Home,
  Search,
  Image
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * グローバルメニューコンポーネント
 * ヘッダーに表示されるドロップダウンメニュー
 */
export function GlobalMenu() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      label: "入庫車両管理",
      href: "/",
      icon: Home,
      description: "入庫車両管理と本日の予定",
    },
    {
      label: "履歴検索",
      href: "/jobs/history",
      icon: Search,
      description: "過去の作業記録を検索・閲覧",
    },
    {
      label: "代車管理",
      href: "/inventory/courtesy-cars",
      icon: Car,
      description: "代車の在庫状況と利用履歴",
    },
    {
      label: "長期プロジェクト管理",
      href: "/projects/long-term",
      icon: FolderKanban,
      description: "レストア・板金・塗装の進捗管理",
    },
  ];

  const adminItems = [
    {
      label: "ブログ写真管理",
      href: "/admin/blog-photos",
      icon: Image,
      description: "公開済みブログ用写真の一覧・管理",
    },
    {
      label: "数値マスター管理",
      href: "/admin/settings/numerical-masters",
      icon: Settings,
      description: "閾値・料金・時間などの設定",
    },
    {
      label: "お知らせ管理",
      href: "/admin/announcements",
      icon: Bell,
      description: "お知らせバナーの管理",
    },
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="default"
          className="h-12 px-3 shrink-0 gap-2"
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5 text-slate-700 shrink-0" />
          <span className="hidden sm:inline text-base text-slate-700 font-medium">メニュー</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-base font-semibold">
          メニュー
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* メインメニュー */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <DropdownMenuItem
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "flex items-start gap-3 px-3 py-3 cursor-pointer",
                isActive && "bg-slate-100"
              )}
            >
              <Icon className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-base font-medium",
                  isActive ? "text-slate-900" : "text-slate-700"
                )}>
                  {item.label}
                </div>
                <div className="text-base text-slate-500 mt-0.5">
                  {item.description}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        
        {/* 管理メニュー */}
        <DropdownMenuLabel className="text-base font-medium text-slate-500">
          管理
        </DropdownMenuLabel>
        {adminItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <DropdownMenuItem
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "flex items-start gap-3 px-3 py-3 cursor-pointer",
                isActive && "bg-slate-100"
              )}
            >
              <Icon className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-base font-medium",
                  isActive ? "text-slate-900" : "text-slate-700"
                )}>
                  {item.label}
                </div>
                <div className="text-base text-slate-500 mt-0.5">
                  {item.description}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

