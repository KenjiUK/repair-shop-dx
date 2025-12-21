"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface OfflineBannerProps {
  /** カスタムクラス */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function OfflineBanner({ className }: OfflineBannerProps) {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4" />
      <span>オフラインです。接続を確認してください。</span>
    </div>
  );
}

/**
 * オンライン復帰バナー（一時表示）
 */
export function OnlineBanner({ className }: OfflineBannerProps) {
  const isOnline = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isOnline && typeof window !== "undefined") {
      // オフラインからオンラインに復帰した時のみ表示
      const wasOffline = sessionStorage.getItem("was_offline") === "true";
      if (wasOffline) {
        setShowBanner(true);
        sessionStorage.removeItem("was_offline");
        // 3秒後に自動的に非表示
        setTimeout(() => setShowBanner(false), 3000);
      }
    } else if (!isOnline) {
      // オフライン状態を記録
      sessionStorage.setItem("was_offline", "true");
      setShowBanner(false);
    }
  }, [isOnline]);

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Wifi className="h-4 w-4" />
      <span>オンラインに復帰しました。同期を開始します...</span>
    </div>
  );
}
















