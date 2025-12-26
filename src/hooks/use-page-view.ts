"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

/**
 * ページビュートラッキングフック
 *
 * ページ遷移時に自動的にページビューを記録
 */
export function usePageView(screenId: string, title?: string) {
  const pathname = usePathname();

  useEffect(() => {
    // ページタイトルを取得（指定がない場合）
    const pageTitle = title || (typeof document !== "undefined" ? document.title : undefined);

    // ページビューを記録
    trackPageView(screenId, pathname, pageTitle);
  }, [pathname, screenId, title]);
}
























