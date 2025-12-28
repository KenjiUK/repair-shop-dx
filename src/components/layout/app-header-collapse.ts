/**
 * ヘッダーの縮小機能を管理するカスタムフック
 * ベストプラクティスに基づいたシンプルな実装
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function useHeaderCollapse(
  isTopPage: boolean,
  collapsibleOnMobile: boolean
) {
  const pathname = usePathname();
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  
  // スクロール位置と方向を追跡
  const lastScrollYRef = useRef<number>(0);
  const lastDirectionRef = useRef<"up" | "down" | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHeaderExpandedRef = useRef<boolean>(true);
  const lastStateChangeTimeRef = useRef<number>(0);
  
  // 状態をrefと同期
  useEffect(() => {
    isHeaderExpandedRef.current = isHeaderExpanded;
  }, [isHeaderExpanded]);

  useEffect(() => {
    // トップページまたは折りたたみ無効の場合は何もしない
    if (isTopPage || !collapsibleOnMobile) {
      setIsHeaderExpanded(true);
      return;
    }

    // スクロール可能な要素を取得
    const getScrollableElement = (): Element | Window => {
      // 診断ページや作業ページでは常にwindowのスクロールを使用
      if (pathname?.includes('/mechanic/diagnosis/') || pathname?.includes('/mechanic/work/')) {
        return window;
      }
      // その他のページでは、overflow-autoの親要素を探す
      const scrollableDiv = document.querySelector('.overflow-auto');
      if (scrollableDiv) {
        const computedStyle = window.getComputedStyle(scrollableDiv);
        const hasOverflow = computedStyle.overflow === 'auto' || computedStyle.overflowY === 'auto';
        if (hasOverflow && scrollableDiv.scrollHeight > scrollableDiv.clientHeight) {
          return scrollableDiv;
        }
      }
      // 見つからない場合やスクロール不可能な場合はwindowを使用
      return window;
    };

    const scrollableElement = getScrollableElement();
    const isWindow = scrollableElement === window;

    // スクロール位置を取得
    const getScrollY = (): number => {
      if (isWindow) {
        return window.scrollY || 0;
      } else {
        return (scrollableElement as Element).scrollTop || 0;
      }
    };

    // スクロールハンドラー（安定した実装）
    const handleScroll = () => {
      // タイムアウトをクリア
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // デバウンス: 150ms後に実行（頻繁な切り替えを防ぐ）
      timeoutRef.current = setTimeout(() => {
        const now = Date.now();
        const currentScrollY = getScrollY();
        const scrollDelta = currentScrollY - lastScrollYRef.current;

        // 状態変更の間隔が短すぎる場合は無視（200ms未満）
        if (now - lastStateChangeTimeRef.current < 200) {
          lastScrollYRef.current = currentScrollY;
          return;
        }

        // トップ付近（50px以下）では常に展開
        if (currentScrollY <= 50) {
          if (!isHeaderExpandedRef.current) {
            setIsHeaderExpanded(true);
            lastStateChangeTimeRef.current = now;
          }
          lastScrollYRef.current = currentScrollY;
          lastDirectionRef.current = null;
          return;
        }

        // スクロール変化量が小さすぎる場合は無視（10px未満）
        if (Math.abs(scrollDelta) < 10) {
          lastScrollYRef.current = currentScrollY;
          return;
        }

        // スクロール方向を判定
        const currentDirection: "up" | "down" = scrollDelta > 0 ? "down" : "up";

        // 下スクロール：100px以上で縮小
        if (currentDirection === "down" && currentScrollY >= 100) {
          if (isHeaderExpandedRef.current) {
            setIsHeaderExpanded(false);
            lastStateChangeTimeRef.current = now;
          }
        }
        // 上スクロール：前回が下スクロールだった場合のみ展開（ヒステリシス）
        else if (currentDirection === "up" && lastDirectionRef.current === "down") {
          if (!isHeaderExpandedRef.current) {
            setIsHeaderExpanded(true);
            lastStateChangeTimeRef.current = now;
          }
        }

        lastScrollYRef.current = currentScrollY;
        lastDirectionRef.current = currentDirection;
      }, 150);
    };

    // イベントリスナーを追加
    scrollableElement.addEventListener("scroll", handleScroll, { passive: true });

    // 初期スクロール位置を設定
    lastScrollYRef.current = getScrollY();

    // クリーンアップ
    return () => {
      scrollableElement.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isTopPage, collapsibleOnMobile, pathname]);

  return isHeaderExpanded;
}
