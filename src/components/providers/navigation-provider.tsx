"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ページ遷移時のFOUC対策プロバイダー
 * ページ遷移時にbodyにdata属性を設定して、古いコンテンツを非表示にする
 */
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // ページ遷移開始時にbodyにdata属性を設定
    const handleRouteChangeStart = () => {
      document.body.setAttribute("data-navigating", "true");
    };

    // ページ遷移完了時にdata属性を削除
    const handleRouteChangeComplete = () => {
      // 少し遅延させてからdata属性を削除（新しいコンテンツが表示されるまで）
      setTimeout(() => {
        document.body.removeAttribute("data-navigating");
        document.body.removeAttribute("data-loading");
      }, 50);
    };

    // パス名が変更された時に処理を実行
    handleRouteChangeComplete();

    // クリーンアップ
    return () => {
      document.body.removeAttribute("data-navigating");
      document.body.removeAttribute("data-loading");
    };
  }, [pathname]);

  return <>{children}</>;
}





