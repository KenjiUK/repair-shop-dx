"use client";

import { useState, useEffect, useMemo } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Notification,
  generateNotifications,
  applyReadStatus,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
} from "@/lib/notifications";
import { ZohoJob } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationBellProps {
  /** ジョブリスト */
  jobs: ZohoJob[];
  /** 通知を更新する間隔（ミリ秒、デフォルト: 60000 = 1分） */
  refreshInterval?: number;
}

/**
 * 相対時間をフォーマット（例: "3時間前"、"2日前"）
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return "たった今";
  } else if (diffMins < 60) {
    return `${diffMins}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

/**
 * 通知ベルコンポーネント
 * ヘッダーに表示され、通知を一覧表示する
 */
export function NotificationBell({ jobs, refreshInterval = 60000 }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 通知を生成
  const updateNotifications = () => {
    const rawNotifications = generateNotifications(jobs);
    const notificationsWithReadStatus = applyReadStatus(rawNotifications);
    setNotifications(notificationsWithReadStatus);
  };

  // 初期表示と定期更新
  useEffect(() => {
    updateNotifications();
    const interval = setInterval(updateNotifications, refreshInterval);
    return () => clearInterval(interval);
  }, [jobs, refreshInterval]);

  // 未読数を計算
  const unreadCount = useMemo(() => getUnreadCount(notifications), [notifications]);

  // 通知をクリック（既読にして、ジョブ詳細へ遷移）
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
      updateNotifications();
    }
    setIsOpen(false);
    router.push(`/admin/estimate/${notification.jobId}`);
  };

  // 全て既読にする
  const handleMarkAllAsRead = () => {
    const notificationIds = notifications.map((n) => n.id);
    markAllNotificationsAsRead(notificationIds);
    updateNotifications();
  };

  // 通知タイプに応じたアイコンと色を取得
  const getNotificationTypeConfig = (type: Notification["type"]) => {
    switch (type) {
      case "pending_approval_overdue":
        return {
          color: "bg-amber-100 text-amber-800 border-amber-300",
          label: "承認待ち",
        };
      case "parts_procurement_overdue":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-300",
          label: "部品待ち",
        };
      case "scheduled_departure_today":
        return {
          color: "bg-blue-100 text-blue-800 border-blue-300",
          label: "出庫予定",
        };
      default:
        return {
          color: "bg-slate-100 text-slate-800 border-slate-300",
          label: "通知",
        };
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-12 w-12"
          aria-label={`通知${unreadCount > 0 ? `（${unreadCount}件の未読）` : ""}`}
        >
          <Bell className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-base font-bold rounded-full"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-slate-900">
              通知
            </SheetTitle>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-10 text-base text-slate-700 hover:text-slate-900"
              >
                <CheckCheck className="h-4 w-4 mr-1 shrink-0" />
                全て既読
              </Button>
            )}
          </div>
          <SheetDescription className="text-base text-slate-600">
            {notifications.length === 0
              ? "通知はありません"
              : `${notifications.length}件の通知（未読: ${unreadCount}件）`}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-120px)] px-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-slate-300 mb-4 shrink-0" />
              <p className="text-base text-slate-600">通知はありません</p>
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {notifications.map((notification) => {
                const typeConfig = getNotificationTypeConfig(notification.type);
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-colors",
                      notification.read
                        ? "bg-white border-slate-200 hover:bg-slate-50"
                        : "bg-blue-50 border-blue-200 hover:bg-blue-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:rounded-lg"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-base font-medium px-2 py-0.5 shrink-0",
                              typeConfig.color
                            )}
                          >
                            {typeConfig.label}
                          </Badge>
                          {!notification.read && (
                            <span className="h-2 w-2 bg-blue-600 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-base font-semibold text-slate-900 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-base text-slate-600 mb-2">
                          {notification.description}
                        </p>
                        <p className="text-base text-slate-500">
                          {formatRelativeTime(new Date(notification.createdAt))}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markNotificationAsRead(notification.id);
                            updateNotifications();
                          }}
                          className="shrink-0 p-1 rounded hover:bg-slate-200 transition-colors"
                          aria-label="既読にする"
                        >
                          <Check className="h-4 w-4 text-slate-600" />
                        </button>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

