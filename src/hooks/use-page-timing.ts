/**
 * ページ表示時間の計測フック
 *
 * ページロードからレンダリング完了までの時間を計測
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackTiming } from "@/lib/analytics";

// =============================================================================
// カスタムフック
// =============================================================================

/**
 * ページ表示時間を計測するフック
 * 
 * @param screenId - 画面ID（例: "home", "diagnosis", "estimate"）
 * @param enabled - 計測を有効にするかどうか（デフォルト: true）
 */
export function usePageTiming(screenId: string, enabled: boolean = true) {
  const pathname = usePathname();
  const startTimeRef = useRef<number | null>(null);
  const hasTrackedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled) return;
    
    // ページ遷移時にリセット
    hasTrackedRef.current = false;
    startTimeRef.current = performance.now();

    // レンダリング完了を検知（次のフレームで実行）
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (startTimeRef.current !== null && !hasTrackedRef.current) {
          const endTime = performance.now();
          const duration = Math.round(endTime - startTimeRef.current);
          
          // 画面表示時間を記録
          trackTiming(
            screenId,
            "page_render_time",
            duration,
            pathname,
            {
              pathname,
              screenId,
            }
          );
          
          hasTrackedRef.current = true;
        }
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [pathname, screenId, enabled]);

  // データロード完了時の計測（オプション）
  const trackDataLoadComplete = (dataType?: string) => {
    if (startTimeRef.current !== null && !hasTrackedRef.current) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTimeRef.current);
      
      trackTiming(
        screenId,
        "page_data_load_time",
        duration,
        pathname,
        {
          pathname,
          screenId,
          dataType,
        }
      );
    }
  };

  return { trackDataLoadComplete };
}



