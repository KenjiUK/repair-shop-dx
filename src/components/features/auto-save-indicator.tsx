"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutoSaveIndicatorProps {
  /** 保存ステータス */
  status: AutoSaveStatus;
  /** 最後に保存した時刻（オプション） */
  lastSavedAt?: Date;
  /** エラーメッセージ（エラー時） */
  errorMessage?: string;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 自動保存インジケーター
 * 
 * フォーム入力などの自動保存状態を表示するコンポーネント
 */
export function AutoSaveIndicator({
  status,
  lastSavedAt,
  errorMessage,
  className,
}: AutoSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  // 保存完了時に一時的に表示
  useEffect(() => {
    if (status === "saved") {
      setShowSaved(true);
      const timer = setTimeout(() => {
        setShowSaved(false);
      }, 2000); // 2秒後に非表示
      return () => clearTimeout(timer);
    }
  }, [status]);

  // 非表示（idle）の場合は何も表示しない
  if (status === "idle" && !showSaved) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case "saving":
        return {
          icon: Loader2,
          text: "保存中...",
          className: "text-blue-600",
          iconClassName: "animate-spin",
        };
      case "saved":
        return {
          icon: CheckCircle2,
          text: lastSavedAt
            ? `保存済み ${formatTime(lastSavedAt)}`
            : "保存済み",
          className: "text-green-600",
          iconClassName: "",
        };
      case "error":
        return {
          icon: AlertCircle,
          text: errorMessage || "保存に失敗しました",
          className: "text-red-600",
          iconClassName: "",
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs transition-opacity",
        status === "saved" && !showSaved && "opacity-0",
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", config.iconClassName)} />
      <span className={cn("font-medium", config.className)}>{config.text}</span>
    </div>
  );
}

/**
 * 時刻をフォーマット（HH:MM形式）
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}















