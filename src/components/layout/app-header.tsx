"use client";

import { useState, useEffect, useRef, ReactElement, isValidElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  /** 右側に表示するページ固有の内容（バッジやボタンなど） */
  rightArea?: React.ReactNode;
  /** ブランド行の下に表示する、ページ固有のサブヘッダー（タイトルやメタ情報） */
  children?: React.ReactNode;
  /** コンテナ幅の最大値（デフォルトは max-w-4xl、診断・見積などで変更可能） */
  maxWidthClassName?: string;
  /** スクロール時にロゴとブランド名を非表示にするか（デフォルト: true） */
  hideBrandOnScroll?: boolean;
  /** スクロール検知の閾値（px、デフォルト: 100） */
  scrollThreshold?: number;
  /** スクロール時に表示するカスタムコンテンツ（タイトル、バッジ、車両情報、顧客情報など） */
  scrollContent?: React.ReactNode;
}

/**
 * アプリ共通ヘッダー
 * - 左: YM Works ロゴ + 「デジタルガレージ」
 * - 右: フェーズバッジやステータスバッジなど、ページ固有の rightArea
 * - 下部: children に任意のサブヘッダーを差し込める
 * 
 * スクロール時の動作:
 * - hideBrandOnScroll=true の場合、スクロール時にロゴと「デジタルガレージ」を非表示
 * - scrollContentが指定されている場合はそれを表示、なければページタイトル（children内のh1要素）を抽出して表示
 */
export function AppHeader({
  rightArea,
  children,
  maxWidthClassName = "max-w-4xl",
  hideBrandOnScroll = true,
  scrollThreshold = 100,
  scrollContent,
}: AppHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastScrollYRef = useRef<number>(0);
  const prevIsScrolledRef = useRef<boolean>(false);

  // スクロール位置を検知
  useEffect(() => {
    if (!hideBrandOnScroll) return;
    const scrollDownThreshold = scrollThreshold;
    const scrollUpThreshold = Math.max(0, scrollThreshold - 20);

    const handleScroll = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const isScrollingDown = scrollY > lastScrollYRef.current;
        lastScrollYRef.current = scrollY;
        const threshold = isScrollingDown ? scrollDownThreshold : scrollUpThreshold;
        const newIsScrolled = scrollY > threshold;
        if (newIsScrolled !== prevIsScrolledRef.current) {
          prevIsScrolledRef.current = newIsScrolled;
          setIsScrolled(newIsScrolled);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [hideBrandOnScroll, scrollThreshold]);

  // childrenからページタイトル（h1要素）を抽出
  useEffect(() => {
    if (!hideBrandOnScroll || !children) {
      setPageTitle(null);
      return;
    }

    const extractTextFromNode = (node: React.ReactNode): string[] => {
      const texts: string[] = [];

      if (typeof node === "string" || typeof node === "number") {
        texts.push(String(node).trim());
      } else if (isValidElement(node)) {
        const props = node.props as { children?: React.ReactNode };
        if (node.type === "h1") {
          const h1Texts = extractTextFromNode(props.children);
          return h1Texts;
        }

        if (props?.children) {
          const childTexts = extractTextFromNode(props.children);
          texts.push(...childTexts);
        }
      } else if (Array.isArray(node)) {
        for (const child of node) {
          const childTexts = extractTextFromNode(child);
          texts.push(...childTexts);
        }
      }

      return texts.filter((text) => text.length > 0);
    };

    const extractTitle = (node: React.ReactNode): string | null => {
      if (isValidElement(node)) {
        const props = node.props as { children?: React.ReactNode };
        if (node.type === "h1") {
          const texts = extractTextFromNode(props.children);
          return texts.join(" ").trim() || null;
        }

        if (props?.children) {
          return extractTitle(props.children);
        }
      }

      if (Array.isArray(node)) {
        for (const child of node) {
          const title = extractTitle(child);
          if (title) return title;
        }
      }

      return null;
    };

    const title = extractTitle(children);
    setPageTitle(title);
  }, [children, hideBrandOnScroll]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300",
        isScrolled && hideBrandOnScroll && "py-1"
      )}
    >
      <div
        className={cn(
          "mx-auto px-4 transition-all duration-300",
          maxWidthClassName,
          isScrolled && hideBrandOnScroll ? "py-1" : "py-2"
        )}
      >
        {/* 通常表示: ロゴ + ブランド名 + rightArea */}
        {(!isScrolled || !hideBrandOnScroll) && (
          <div className="flex items-center justify-between gap-4">
            {/* ブランドロゴ + システム名 */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-9 w-36 sm:h-10 sm:w-44">
                <Image
                  src="/YM_WORKS_logo.png.png"
                  alt="YM Works"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
                デジタルガレージ
              </span>
            </Link>

            {rightArea && (
              <div className="flex items-center gap-2">
                {rightArea}
              </div>
            )}
          </div>
        )}

        {/* スクロール時: カスタムコンテンツまたはページタイトルを表示 */}
        {isScrolled && hideBrandOnScroll && (
          <>
            {scrollContent ? (
              scrollContent
            ) : pageTitle ? (
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {pageTitle}
                </h1>
                {rightArea && (
                  <div className="flex items-center gap-2 shrink-0">
                    {rightArea}
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}

        {/* children（ページ固有のサブヘッダー）はスクロール時も表示 */}
        {children && (!isScrolled || !hideBrandOnScroll) && (
          <div className="mt-2">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
