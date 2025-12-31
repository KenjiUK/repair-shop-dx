"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * ページ遷移時のFOUC対策プロバイダー
 * ページ遷移時にbodyにdata属性を設定して、古いコンテンツを非表示にする
 * 
 * Note: useSearchParams()は使用していない（依存配列にのみ含まれていたが実際には未使用）。
 * usePathname()のみで十分なため、Suspenseでラップする必要はない。
 * これにより、Next.js 16の静的生成時のエラーを回避できる。
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

    // 診断・作業ページかどうかを判定してbodyにdata属性を設定
    const isDiagnosisOrWorkPage = pathname?.includes("/mechanic/diagnosis/") || 
                                   pathname?.includes("/mechanic/work/");
    
    if (isDiagnosisOrWorkPage) {
      document.body.setAttribute("data-page-type", "diagnosis-or-work");
    } else {
      document.body.removeAttribute("data-page-type");
    }

    // パス名が変更された時に処理を実行
    handleRouteChangeComplete();

    // クリーンアップ
    return () => {
      document.body.removeAttribute("data-navigating");
      document.body.removeAttribute("data-loading");
      document.body.removeAttribute("data-page-type");
    };
  }, [pathname]);

  return <>{children}</>;
}





