"use client";

import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCarouselProps {
  children: ReactNode[];
  className?: string;
}

/**
 * サマリーカード用カルーセル（矢印・インジケーター付き）
 * 2025年ベストプラクティス: CSS Scroll Snap + Intersection Observer + パフォーマンス最適化
 */
export function SummaryCarousel({ children, className }: SummaryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [needsScroll, setNeedsScroll] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalCards = children.length;

  // スクロール状態を更新（パフォーマンス最適化: requestAnimationFrame使用）
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    // スクロールが必要かどうかを判定
    const needsScrollValue = scrollWidth > clientWidth + 1;
    setNeedsScroll(needsScrollValue);

    // スクロール可能な範囲を計算
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const threshold = 1;
    
    setCanScrollLeft(scrollLeft > threshold);
    setCanScrollRight(scrollLeft < maxScroll - threshold);
  }, []);

  // Intersection Observerで現在表示されているカードを検出（2025年ベストプラクティス）
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || totalCards === 0) return;

    // 既存のObserverをクリーンアップ
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observerOptions: IntersectionObserverInit = {
      root: container,
      rootMargin: "0px",
      threshold: [0.5, 0.75], // 50%と75%の閾値でより正確に検出
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      // 最も多く表示されているカードを選択
      let maxIntersectionRatio = 0;
      let mostVisibleIndex = 0;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = cardRefs.current.findIndex((card) => card === entry.target);
          if (index !== -1 && entry.intersectionRatio > maxIntersectionRatio) {
            maxIntersectionRatio = entry.intersectionRatio;
            mostVisibleIndex = index;
          }
        }
      });

      if (maxIntersectionRatio > 0) {
        setCurrentIndex(mostVisibleIndex);
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    observerRef.current = observer;

    // すべてのカードを監視
    cardRefs.current.forEach((card) => {
      if (card) {
        observer.observe(card);
      }
    });

    // スクロールイベント（requestAnimationFrameで最適化）
    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      
      rafIdRef.current = requestAnimationFrame(() => {
        updateScrollState();
        rafIdRef.current = null;
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateScrollState);
    
    // 初期状態を設定
    const timeoutId = setTimeout(() => {
      updateScrollState();
    }, 150);

    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollState);
      clearTimeout(timeoutId);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [totalCards, updateScrollState]);

  // カードにスクロール（scrollIntoView - 2025年ベストプラクティス）
  const scrollToCard = useCallback((index: number) => {
    const card = cardRefs.current[index];
    const container = scrollContainerRef.current;
    if (!card || !container) return;

    // スクロール中フラグを設定
    setIsScrolling(true);

    // 既存のタイムアウトをクリア
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // scrollIntoViewを使用（ブラウザネイティブ、CSS Scroll Snapと連動）
    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start", // 左端にスナップ（CSS snap-startと連動）
    });

    // スクロール完了を検出（500ms後に解除、smooth scrollの最大時間を考慮）
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      // スクロール状態を再更新
      updateScrollState();
    }, 500);
  }, [updateScrollState]);

  // 前のカードへ（currentIndexに依存せず、直接スクロール位置から計算）
  const scrollPrev = useCallback(() => {
    if (isScrolling) return; // スクロール中は無視
    
    const container = scrollContainerRef.current;
    if (!container) return;

    // 現在のスクロール位置から、前のカードのインデックスを計算
    const scrollLeft = container.scrollLeft;
    const cardWidth = cardRefs.current[0]?.offsetWidth || 320;
    const gap = 12; // gap-3 = 0.75rem = 12px
    const cardWidthWithGap = cardWidth + gap;
    
    // 現在表示されているカードのインデックスを推定
    const estimatedIndex = Math.round(scrollLeft / cardWidthWithGap);
    const targetIndex = Math.max(0, estimatedIndex - 1);
    
    scrollToCard(targetIndex);
  }, [isScrolling, scrollToCard]);

  // 次のカードへ（currentIndexに依存せず、直接スクロール位置から計算）
  const scrollNext = useCallback(() => {
    if (isScrolling) return; // スクロール中は無視
    
    const container = scrollContainerRef.current;
    if (!container) return;

    // 現在のスクロール位置から、次のカードのインデックスを計算
    const scrollLeft = container.scrollLeft;
    const cardWidth = cardRefs.current[0]?.offsetWidth || 320;
    const gap = 12; // gap-3 = 0.75rem = 12px
    const cardWidthWithGap = cardWidth + gap;
    
    // 現在表示されているカードのインデックスを推定
    const estimatedIndex = Math.round(scrollLeft / cardWidthWithGap);
    const targetIndex = Math.min(totalCards - 1, estimatedIndex + 1);
    
    scrollToCard(targetIndex);
  }, [isScrolling, totalCards, scrollToCard]);

  // キーボードナビゲーション（アクセシビリティ）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // フォーカスが入力フィールドにある場合は無視
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scrollPrev, scrollNext]);

  if (totalCards === 0) return null;

  return (
    <div className={cn("relative", className)}>
      {/* 左矢印ボタン */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          disabled={isScrolling}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border-slate-200 hover:bg-white hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="前のカードへ"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </Button>
      )}

      {/* カルーセルコンテナ（CSS Scroll Snap活用） */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide scroll-smooth"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollPaddingLeft: "1rem", // 左端の余白
          scrollPaddingRight: "1rem", // 右端の余白
        }}
        role="region"
        aria-label="サマリーカードカルーセル"
        aria-live="polite"
      >
        {children.map((child, index) => (
          <div
            key={index}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className="flex-shrink-0 w-[calc(100vw-3rem)] sm:w-[320px] snap-start"
            role="group"
            aria-label={`カード ${index + 1} / ${totalCards}`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* 右矢印ボタン */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          disabled={isScrolling}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border-slate-200 hover:bg-white hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="次のカードへ"
        >
          <ChevronRight className="h-5 w-5 text-slate-700" />
        </Button>
      )}

      {/* インジケータードット（スクロールが必要な場合のみ表示） */}
      {totalCards > 1 && needsScroll && (
        <div 
          className="flex items-center justify-center gap-1.5 mt-4"
          role="tablist"
          aria-label="カードナビゲーション"
        >
          {Array.from({ length: totalCards }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              role="tab"
              aria-selected={index === currentIndex}
              aria-controls={`card-${index}`}
              className={cn(
                "h-2 rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                index === currentIndex
                  ? "w-8 bg-slate-900"
                  : "w-2 bg-slate-300 hover:bg-slate-500"
              )}
              aria-label={`カード ${index + 1}へ移動`}
            />
          ))}
        </div>
      )}
    </div>
  );
}





