/**
 * ヘッダーの縮小機能を管理するカスタムフック（ベストプラクティス実装）
 * スクロール方向を検知して安定した動作を実現
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function useHeaderCollapseV2(
  isTopPage: boolean,
  collapsibleOnMobile: boolean
) {
  const pathname = usePathname();
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  
  // スクロール位置と方向を追跡
  const lastScrollYRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHeaderExpandedRef = useRef<boolean>(true);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // トップページまたは折りたたみ無効の場合は何もしない
    if (isTopPage || !collapsibleOnMobile) {
      setIsHeaderExpanded(true);
      isHeaderExpandedRef.current = true;
      return;
    }

    // 診断ページや作業ページではwindowのスクロールを使用
    const useWindowScroll = pathname?.includes('/mechanic/diagnosis/') || pathname?.includes('/mechanic/work/');

    const handleScroll = () => {
      // requestAnimationFrameで最適化
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const scrollY = useWindowScroll ? window.scrollY : (document.querySelector('.overflow-auto')?.scrollTop || 0);
        const lastScrollY = lastScrollYRef.current;
        
        // スクロール方向を判定（下方向: true, 上方向: false）
        const isScrollingDown = scrollY > lastScrollY;
        const scrollDelta = Math.abs(scrollY - lastScrollY);
        
        // 小さなスクロール移動は無視（3px以下）
        if (scrollDelta < 3) {
          lastScrollYRef.current = scrollY;
          rafIdRef.current = null;
          return;
        }

        const currentState = isHeaderExpandedRef.current;
        
        // ベストプラクティス: スクロール方向と位置の両方を考慮
        // トップ付近（30px以下）では常に展開
        if (scrollY <= 30) {
          if (!currentState) {
            setIsHeaderExpanded(true);
            isHeaderExpandedRef.current = true;
          }
        }
        // 下方向にスクロールして100px以上の場合、縮小
        else if (isScrollingDown && scrollY >= 100 && currentState) {
          setIsHeaderExpanded(false);
          isHeaderExpandedRef.current = false;
        }
        // 上方向にスクロールして50px以下の場合、展開
        else if (!isScrollingDown && scrollY <= 50 && !currentState) {
          setIsHeaderExpanded(true);
          isHeaderExpandedRef.current = true;
        }
        // その他の場合は現在の状態を維持（ヒステリシス効果）

        lastScrollYRef.current = scrollY;
        rafIdRef.current = null;
      });
    };

    const scrollableElement = useWindowScroll ? window : (document.querySelector('.overflow-auto') || window);
    scrollableElement.addEventListener("scroll", handleScroll, { passive: true });

    // 初期スクロール位置を設定
    const initialScrollY = useWindowScroll ? window.scrollY : (document.querySelector('.overflow-auto')?.scrollTop || 0);
    lastScrollYRef.current = initialScrollY;
    
    // 初期状態を設定
    if (initialScrollY <= 30) {
      setIsHeaderExpanded(true);
      isHeaderExpandedRef.current = true;
    } else if (initialScrollY >= 100) {
      setIsHeaderExpanded(false);
      isHeaderExpandedRef.current = false;
    }

    return () => {
      scrollableElement.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isTopPage, collapsibleOnMobile, pathname]);

  return isHeaderExpanded;
}

