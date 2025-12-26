"use client";

import { CheckCircle2, Loader2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// 型定義
// =============================================================================

export type SyncStatus = "synced" | "syncing" | "pending" | "error";

// =============================================================================
// Props
// =============================================================================

interface SyncIndicatorProps {
  /** 同期ステータス */
  status: SyncStatus;
  /** エラーメッセージ（エラー時） */
  errorMessage?: string;
  /** 未同期アイテム数（pending時） */
  pendingCount?: number;
  /** サイズ */
  size?: "sm" | "md" | "lg";
  /** カスタムクラス */
  className?: string;
  /** クリックハンドラ（手動同期用） */
  onClick?: () => void;
}

// =============================================================================
// ステータスに応じたスタイル
// =============================================================================

function getSyncStatusStyles(status: SyncStatus) {
  switch (status) {
    case "synced":
      return {
        bg: "bg-green-50",
        border: "border-green-300",
        text: "text-green-800",
        icon: CheckCircle2,
        iconColor: "text-green-700",
        label: "同期済み",
      };
    case "syncing":
      return {
        bg: "bg-blue-50",
        border: "border-blue-300",
        text: "text-blue-800",
        icon: Loader2,
        iconColor: "text-blue-700",
        label: "同期中...",
      };
    case "pending":
      return {
        bg: "bg-amber-50",
        border: "border-amber-300",
        text: "text-amber-800",
        icon: Clock,
        iconColor: "text-amber-700",
        label: "未同期",
      };
    case "error":
      return {
        bg: "bg-red-50",
        border: "border-red-300",
        text: "text-red-800",
        icon: AlertCircle,
        iconColor: "text-red-700",
        label: "同期エラー",
      };
  }
}

// =============================================================================
// Component
// =============================================================================

export function SyncIndicator({
  status,
  errorMessage,
  pendingCount,
  size = "md",
  className,
  onClick,
}: SyncIndicatorProps) {
  const styles = getSyncStatusStyles(status);
  const Icon = styles.icon;

  const sizeClasses = {
    sm: "px-2 py-1 text-base", // text-xs → text-base (40歳以上ユーザー向け)
    md: "px-3 py-1.5 text-base", // text-sm → text-base (40歳以上ユーザー向け)
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "h-4 w-4", // h-3 w-3 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠)
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border",
        styles.bg,
        styles.border,
        styles.text,
        sizeClasses[size],
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
      role="status"
      aria-live="polite"
      aria-label={`同期状態: ${styles.label}`}
    >
      {status === "syncing" ? (
        <Icon className={cn(iconSizes[size], styles.iconColor, "animate-spin")} />
      ) : (
        <Icon className={cn(iconSizes[size], styles.iconColor)} />
      )}
      <span className="font-medium">{styles.label}</span>
      {pendingCount !== undefined && pendingCount > 0 && (
        <span className="ml-1 px-1.5 py-0.5 rounded bg-white/50 text-base font-semibold">
          {pendingCount}
        </span>
      )}
      {errorMessage && status === "error" && (
        <span className="ml-1 text-base opacity-80">({errorMessage})</span>
      )}
    </div>
  );
}
























