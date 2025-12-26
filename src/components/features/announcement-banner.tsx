/**
 * お知らせバナーコンポーネント
 * 全画面幅で表示される重要な告知バナー
 * 2024-2025 UI/UXベストプラクティス準拠
 */

"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AnnouncementBannerProps {
  /** お知らせID（localStorageのキーとして使用） */
  id: string;
  /** お知らせメッセージ */
  message: string;
  /** バナーの背景色（デフォルト: ティール） */
  backgroundColor?: string;
  /** テキストの色（デフォルト: 白） */
  textColor?: string;
  /** 表示するかどうか（外部から制御可能） */
  show?: boolean;
  /** 閉じた時のコールバック */
  onClose?: () => void;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * お知らせバナー
 * - 全画面幅で表示
 * - ×ボタンで閉じられる
 * - localStorageで閉じた状態を保存
 * - スムーズなアニメーション
 */
export function AnnouncementBanner({
  id,
  message,
  backgroundColor = "bg-teal-500",
  textColor = "text-white",
  show: externalShow,
  onClose,
  className,
}: AnnouncementBannerProps) {
  // localStorageから閉じた状態を確認（初期値として計算）
  const getInitialVisibility = () => {
    if (externalShow !== undefined) {
      return externalShow;
    }
    const storageKey = `announcement-banner-${id}-closed`;
    const isClosed = localStorage.getItem(storageKey) === "true";
    return !isClosed;
  };

  const [isVisible, setIsVisible] = useState(getInitialVisibility);
  const [isClosing, setIsClosing] = useState(false);

  // externalShowが変更された場合のみ更新
  useEffect(() => {
    if (externalShow !== undefined) {
      setIsVisible(externalShow);
    }
  }, [externalShow]);

  // 閉じる処理
  const handleClose = () => {
    setIsClosing(true);
    
    // アニメーション後に非表示
    setTimeout(() => {
      setIsVisible(false);
      
      // localStorageに保存
      const storageKey = `announcement-banner-${id}-closed`;
      localStorage.setItem(storageKey, "true");
      
      // コールバック実行
      onClose?.();
    }, 300); // アニメーション時間に合わせる
  };

  // 表示されない場合は何も返さない
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "w-full sticky top-0 z-30",
        backgroundColor,
        textColor,
        "transition-all duration-300 ease-in-out",
        isClosing ? "opacity-0 -translate-y-full max-h-0 overflow-hidden py-0" : "opacity-100 translate-y-0",
        className
      )}
      role="banner"
      aria-label="お知らせ"
      aria-live="polite"
    >
      <div className="w-full px-4 py-1.5 sm:py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 relative">
          {/* メッセージ - Phase 2: フォントサイズとコントラストの最適化（40歳以上ユーザー向け） */}
          <p className="text-base sm:text-lg font-semibold text-center flex-1 px-8 sm:px-10 leading-relaxed">
            {message}
          </p>

          {/* 閉じるボタン - Phase 2: タッチターゲットサイズ確保（40歳以上ユーザー向け） */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className={cn(
              "absolute right-0 sm:right-4 h-12 w-12 shrink-0", // h-8 w-8 → h-12 w-12 (最小タッチターゲット48px)
              "hover:bg-white/20 active:bg-white/30",
              "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none",
              "transition-colors duration-200",
              textColor
            )}
            aria-label="お知らせを閉じる"
            tabIndex={0}
          >
            <X className="h-5 w-5" /> {/* h-4 w-4 → h-5 w-5 (アイコンサイズ拡大) */}
          </Button>
        </div>
      </div>
    </div>
  );
}




