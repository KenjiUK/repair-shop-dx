"use client";

import { useEffect, useRef } from "react";
import { trackTiming } from "@/lib/analytics";

/**
 * ページ表示時間計測フック
 *
 * ページの読み込み時間を自動的に計測
 */
export function usePageTiming(screenId: string) {
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // 開始時間を記録
    startTimeRef.current = performance.now();

    // ページ読み込み完了時に計測
    const handleLoad = () => {
      if (startTimeRef.current !== null) {
        const duration = performance.now() - startTimeRef.current;
        trackTiming(screenId, "page_load", duration, window.location.pathname);
      }
    };

    // DOMContentLoadedイベントで計測
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, [screenId]);
}
















