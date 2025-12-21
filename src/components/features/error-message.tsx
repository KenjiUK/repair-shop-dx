"use client";

import { AlertCircle, X, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { ErrorCode, ErrorCategory, getUserFriendlyMessage } from "@/lib/error-handling";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface ErrorMessageProps {
  /** エラーコード */
  code?: ErrorCode;
  /** エラーメッセージ（カスタムメッセージ） */
  message?: string;
  /** エラーカテゴリ */
  category?: ErrorCategory;
  /** 詳細メッセージ */
  details?: string;
  /** 閉じるボタンを表示するか */
  dismissible?: boolean;
  /** 閉じるハンドラ */
  onDismiss?: () => void;
  /** サイズ */
  size?: "sm" | "md" | "lg";
  /** カスタムクラス */
  className?: string;
}

// =============================================================================
// エラーカテゴリに応じたスタイル
// =============================================================================

function getErrorStyles(category?: ErrorCategory) {
  switch (category) {
    case ErrorCategory.CLIENT_ERROR:
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: AlertTriangle,
        iconColor: "text-amber-600",
      };
    case ErrorCategory.SERVER_ERROR:
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        icon: AlertCircle,
        iconColor: "text-red-600",
      };
    case ErrorCategory.NETWORK_ERROR:
      return {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
        icon: AlertCircle,
        iconColor: "text-orange-600",
      };
    case ErrorCategory.AUTH_ERROR:
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: Info,
        iconColor: "text-blue-600",
      };
    case ErrorCategory.VALIDATION_ERROR:
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
        icon: AlertTriangle,
        iconColor: "text-amber-600",
      };
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-800",
        icon: AlertCircle,
        iconColor: "text-slate-600",
      };
  }
}

// =============================================================================
// Component
// =============================================================================

export function ErrorMessage({
  code,
  message,
  category,
  details,
  dismissible = false,
  onDismiss,
  size = "md",
  className,
}: ErrorMessageProps) {
  const displayMessage = message || (code ? getUserFriendlyMessage(code) : "エラーが発生しました");
  const styles = getErrorStyles(category);
  const Icon = styles.icon;

  const sizeClasses = {
    sm: "p-2 text-sm",
    md: "p-3 text-base",
    lg: "p-4 text-lg",
  };

  return (
    <div
      className={cn(
        "rounded-lg border",
        styles.bg,
        styles.border,
        styles.text,
        sizeClasses[size],
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", styles.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className="font-medium">{displayMessage}</p>
          {details && (
            <p className="mt-1 text-sm opacity-80">{details}</p>
          )}
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// 成功メッセージコンポーネント（エラーと対になる）
// =============================================================================

interface SuccessMessageProps {
  /** メッセージ */
  message: string;
  /** 詳細メッセージ */
  details?: string;
  /** 閉じるボタンを表示するか */
  dismissible?: boolean;
  /** 閉じるハンドラ */
  onDismiss?: () => void;
  /** サイズ */
  size?: "sm" | "md" | "lg";
  /** カスタムクラス */
  className?: string;
}

export function SuccessMessage({
  message,
  details,
  dismissible = false,
  onDismiss,
  size = "md",
  className,
}: SuccessMessageProps) {
  const sizeClasses = {
    sm: "p-2 text-sm",
    md: "p-3 text-base",
    lg: "p-4 text-lg",
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-green-50 border-green-200 text-green-800",
        sizeClasses[size],
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-green-600" />
        <div className="flex-1 min-w-0">
          <p className="font-medium">{message}</p>
          {details && (
            <p className="mt-1 text-sm opacity-80">{details}</p>
          )}
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
















