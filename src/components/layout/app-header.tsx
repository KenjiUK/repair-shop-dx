"use client";

import { useState, useEffect, useRef, ReactElement, isValidElement, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BackButton } from "./back-button";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobSearchBar } from "@/components/features/job-search-bar";
import { ZohoJob } from "@/types";

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
  /** TOPページかどうか（デフォルト: パスから自動判定） */
  isTopPage?: boolean;
  /** 戻るボタンのリンク先（デフォルト: "/"、トップページ以外でのみ有効） */
  backHref?: string;
  /** 未保存の変更があるかどうか（戻るボタンの確認ダイアログ用） */
  hasUnsavedChanges?: boolean;
  /** 最小化時に表示するステータスバッジ（トップページ以外で使用） */
  statusBadge?: React.ReactNode;
  /** モバイルでヘッダーを折りたたみ可能にするか（デフォルト: true、トップページ以外のみ） */
  collapsibleOnMobile?: boolean;
  /** 検索クエリ（TOPページのみ） */
  searchQuery?: string;
  /** 検索クエリの更新ハンドラ（TOPページのみ） */
  onSearchChange?: (value: string) => void;
  /** 検索候補用のジョブリスト（TOPページのみ） */
  searchJobs?: ZohoJob[];
  /** QRスキャンボタンのクリックハンドラ（TOPページのみ） */
  onScanClick?: () => void;
  /** 検索候補選択ハンドラ（TOPページのみ） */
  onSuggestionSelect?: (suggestion: { value: string; type: string; label: string; count: number }) => void;
  /** ページタイトル（トップページ以外で使用） */
  pageTitle?: string;
  /** ページタイトルアイコン（トップページ以外で使用） */
  pageTitleIcon?: React.ReactNode;
}

/**
 * サイドバートグルボタンコンポーネント
 * デスクトップ・モバイル共通で表示
 */
const SidebarToggleButton = memo(() => {
  const { toggle, isOpen } = useSidebar();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-12 w-12 shrink-0"
      onClick={toggle}
      aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={isOpen}
    >
      <Menu className="h-5 w-5" strokeWidth={2.5} />
    </Button>
  );
});

SidebarToggleButton.displayName = "SidebarToggleButton";

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
  maxWidthClassName = "max-w-5xl",
  hideBrandOnScroll = true,
  scrollThreshold = 100,
  scrollContent,
  isTopPage: isTopPageProp,
  backHref = "/",
  hasUnsavedChanges = false,
  statusBadge,
  collapsibleOnMobile = true,
  searchQuery = "",
  onSearchChange,
  searchJobs = [],
  onScanClick,
  onSuggestionSelect,
  pageTitle: pageTitleProp,
  pageTitleIcon: pageTitleIconProp,
}: AppHeaderProps) {
  const pathname = usePathname();
  // TOPページかどうかを判定（パスが"/"の場合、または明示的に指定された場合）
  const isTopPage = isTopPageProp ?? pathname === "/";
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [pageTitle, setPageTitle] = useState<string | null>(pageTitleProp || null);
  const [pageTitleIcon, setPageTitleIcon] = useState<React.ReactNode | null>(pageTitleIconProp || null);
  const headerRef = useRef<HTMLElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastScrollYRef = useRef<number>(0);
  const prevIsScrolledRef = useRef<boolean>(false);
  
  // モバイルヘッダーの展開/縮小状態（トップページ以外のみ）
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
  const scrollDirectionRef = useRef<"up" | "down" | null>(null);
  const lastScrollYForCollapseRef = useRef<number>(0);
  const collapseRafIdRef = useRef<number | null>(null);
  const accumulatedDeltaRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);


  // スクロール位置を検知（TOPページ用）
  useEffect(() => {
    if (!hideBrandOnScroll || !isTopPage) return;
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
  }, [hideBrandOnScroll, scrollThreshold, isTopPage]);

  // モバイルヘッダーの展開/縮小制御（トップページ以外のみ）
  useEffect(() => {
    if (isTopPage || !collapsibleOnMobile) return;

    // 初期スクロール位置を設定
    lastScrollYForCollapseRef.current = window.scrollY;
    accumulatedDeltaRef.current = 0;
    lastUpdateTimeRef.current = 0;
    
    // 方向別の閾値（上スクロール時の閾値を大きくして、より安定した動作を実現）
    const scrollThresholdDown = 15; // 下スクロール: 15px累積（すぐに縮小して画面スペースを確保）
    const scrollThresholdUp = 30; // 上スクロール: 30px累積（より確実な上スクロール意図を検知、ちらつき防止）
    const topThreshold = 150; // トップ付近の判定（ヒステリシス用）
    const minUpdateInterval = 100; // 最小更新間隔（ms）

    const handleScroll = () => {
      if (collapseRafIdRef.current !== null) {
        cancelAnimationFrame(collapseRafIdRef.current);
      }
      collapseRafIdRef.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDelta = currentScrollY - lastScrollYForCollapseRef.current;
        const now = Date.now();
        
        // 最小更新間隔をチェック
        if (now - lastUpdateTimeRef.current < minUpdateInterval) {
          lastScrollYForCollapseRef.current = currentScrollY;
          return;
        }
        
        // トップ付近（150px未満）では常に展開（ヒステリシス効果）
        if (currentScrollY < topThreshold) {
          setIsHeaderExpanded((prev) => {
            if (!prev) {
              setScrollDirection(null);
              scrollDirectionRef.current = null;
              accumulatedDeltaRef.current = 0;
              lastUpdateTimeRef.current = now;
              return true;
            }
            return prev;
          });
          lastScrollYForCollapseRef.current = currentScrollY;
          return;
        }
        
        // スクロール方向を累積して判定（より安定した検知）
        accumulatedDeltaRef.current += scrollDelta;
        
        // 方向に応じて適切な閾値を選択
        const currentThreshold = accumulatedDeltaRef.current > 0 
          ? scrollThresholdDown  // 下スクロール時
          : scrollThresholdUp;   // 上スクロール時
        
        // 累積デルタが閾値を超えた場合のみ方向を判定
        if (Math.abs(accumulatedDeltaRef.current) >= currentThreshold) {
          const newDirection = accumulatedDeltaRef.current > 0 ? "down" : "up";
          
          // 方向が変わった時のみ状態を更新
          if (newDirection !== scrollDirectionRef.current) {
            scrollDirectionRef.current = newDirection;
            setScrollDirection(newDirection);
            
            // 下スクロール: 縮小、上スクロール: 展開
            const shouldExpand = newDirection === "up";
            setIsHeaderExpanded((prev) => {
              if (prev !== shouldExpand) {
                accumulatedDeltaRef.current = 0; // リセット
                lastUpdateTimeRef.current = now;
                return shouldExpand;
              }
              return prev;
            });
          } else {
            // 同じ方向の場合は累積デルタをリセット（連続スクロールを検知）
            accumulatedDeltaRef.current = 0;
          }
        }
        
        lastScrollYForCollapseRef.current = currentScrollY;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (collapseRafIdRef.current !== null) {
        cancelAnimationFrame(collapseRafIdRef.current);
      }
    };
  }, [isTopPage, collapsibleOnMobile]);

  // childrenからページタイトル（h1要素）とアイコンを抽出（TOPページ以外でも使用）
  // propsでpageTitleが指定されている場合はそれを使用
  useEffect(() => {
    if (pageTitleProp) {
      // 次のレンダリングサイクルで状態を更新
      const updateTimer = setTimeout(() => {
        setPageTitle(pageTitleProp);
        setPageTitleIcon(pageTitleIconProp || null);
      }, 0);
      return () => clearTimeout(updateTimer);
    }
    
    if (!children) {
      setPageTitle(null);
      setPageTitleIcon(null);
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

    const extractIconFromNode = (node: React.ReactNode): React.ReactNode | null => {
      if (isValidElement(node)) {
        const props = node.props as { children?: React.ReactNode; className?: string };
        // lucide-reactのアイコンコンポーネントを検出
        // アイコンは通常、classNameに "h-" や "w-" を含むSVG要素
        if (
          typeof node.type === "function" &&
          props.className &&
          (props.className.includes("h-") || props.className.includes("w-") || 
           typeof props.className === "string" && props.className.match(/\b(h-\d+|w-\d+)\b/))
        ) {
          // アイコン要素を複製して返す（元の要素を保持）
          return node;
        }

        // 子要素を再帰的に探索
        if (props?.children) {
          if (Array.isArray(props.children)) {
            for (const child of props.children) {
              const icon = extractIconFromNode(child);
              if (icon) return icon;
            }
          } else {
            const icon = extractIconFromNode(props.children);
            if (icon) return icon;
          }
        }
      } else if (Array.isArray(node)) {
        for (const child of node) {
          const icon = extractIconFromNode(child);
          if (icon) return icon;
        }
      }

      return null;
    };

    const extractTitleAndIcon = (node: React.ReactNode): { title: string | null; icon: React.ReactNode | null } => {
      if (isValidElement(node)) {
        const props = node.props as { children?: React.ReactNode; className?: string };
        if (node.type === "h1") {
          const texts = extractTextFromNode(props.children);
          const title = texts.join(" ").trim() || null;
          
          // h1要素の直接の子要素からアイコンを探す
          let icon: React.ReactNode | null = null;
          if (props.children) {
            const findIcon = (node: React.ReactNode): React.ReactNode | null => {
              if (isValidElement(node)) {
                const nodeProps = node.props as { className?: string; children?: React.ReactNode };
                // lucide-reactのアイコンは通常、classNameに "h-" や "w-" を含む
                if (
                  nodeProps.className &&
                  typeof nodeProps.className === "string" &&
                  (nodeProps.className.includes("h-") || nodeProps.className.includes("w-"))
                ) {
                  return node;
                }
                // 子要素を再帰的に探索
                if (nodeProps.children) {
                  if (Array.isArray(nodeProps.children)) {
                    for (const child of nodeProps.children) {
                      const found = findIcon(child);
                      if (found) return found;
                    }
                  } else {
                    return findIcon(nodeProps.children);
                  }
                }
              } else if (Array.isArray(node)) {
                for (const child of node) {
                  const found = findIcon(child);
                  if (found) return found;
                }
              }
              return null;
            };
            
            icon = findIcon(props.children);
          }
          
          return { title, icon };
        }

        if (props?.children) {
          return extractTitleAndIcon(props.children);
        }
      }

      if (Array.isArray(node)) {
        for (const child of node) {
          const result = extractTitleAndIcon(child);
          if (result.title || result.icon) return result;
        }
      }

      return { title: null, icon: null };
    };

    const { title, icon } = extractTitleAndIcon(children);
    setPageTitle(title);
    setPageTitleIcon(icon);
  }, [children, pageTitleProp, pageTitleIconProp]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky z-[40] bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300",
        // お知らせバナーの有無に応じてtop位置を調整
        "top-0",
        // TOPページ以外では常にコンパクトな高さ
        !isTopPage && "py-2",
        isTopPage && isScrolled && hideBrandOnScroll && "py-1"
      )}
    >
      <div
        className={cn(
          "mx-auto px-4 transition-all duration-300",
          maxWidthClassName,
          // TOPページ以外では常にコンパクト
          !isTopPage ? "py-0" : isScrolled && hideBrandOnScroll ? "py-1" : "py-2"
        )}
      >
        {/* TOPページ: 通常のロゴ + ブランド名 + 日時表示 */}
        {isTopPage && (
          <>
            {/* 通常表示: ロゴ + ブランド名 + rightArea */}
            {(!isScrolled || !hideBrandOnScroll) && (
              <div className="flex items-center gap-4">
                {/* 左側: メニューボタン + ロゴ + ブランド名 + 日時 */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* メニューボタン（全画面サイズ） */}
                  <SidebarToggleButton />
                  
                  {/* ブランドロゴ + システム名 */}
                  <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
                    {/* 縦型ロゴ（モバイル用） */}
                    <div className="relative h-8 w-8 sm:hidden shrink-0">
                      <Image
                        src="/YMWORKS-logo-vertical.png"
                        alt="YMWORKS"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    {/* 横長ロゴ（PC用） */}
                    <div className="relative h-7 w-28 sm:h-8 sm:w-32 hidden sm:block shrink-0">
                      <Image
                        src="/YMWORKS-logo.png"
                        alt="YMWORKS"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    {/* テキスト（モバイル・PC両方で表示） */}
                    <span className="text-base font-semibold text-slate-900 tracking-tight leading-tight whitespace-nowrap shrink-0">
                      デジタルガレージ
                    </span>
                  </Link>
                  
                </div>

                {/* 中央エリア: 検索バー（TOPページのみ） */}
                {isTopPage && onSearchChange && (
                  <div className="flex-1 max-w-2xl mx-4 hidden sm:block">
                    <JobSearchBar
                      value={searchQuery}
                      onChange={onSearchChange}
                      placeholder="顧客名・車名・ナンバー・タグIDで検索"
                      onScanClick={onScanClick}
                      jobs={searchJobs}
                      onSuggestionSelect={onSuggestionSelect}
                    />
                  </div>
                )}

                {/* 右側エリア: rightArea */}
                <div className="flex items-center gap-2 sm:gap-4 ml-auto">
                  {/* モバイル: 検索バー（TOPページのみ） */}
                  {isTopPage && onSearchChange && (
                    <div className="sm:hidden flex-1 min-w-0 max-w-[200px]">
                      <JobSearchBar
                        value={searchQuery}
                        onChange={onSearchChange}
                        placeholder="検索..."
                        onScanClick={onScanClick}
                        jobs={searchJobs}
                        onSuggestionSelect={onSuggestionSelect}
                      />
                    </div>
                  )}

                  {rightArea && (
                    <div className="flex items-center gap-2 shrink-0">
                      {rightArea}
                    </div>
                  )}
                </div>
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
                    <div className="flex items-center gap-4">
                      {/* 中央エリア: 検索バー（TOPページのみ、スクロール時も表示） */}
                      {isTopPage && onSearchChange && (
                        <div className="flex-1 max-w-xl mx-4 hidden sm:block">
                          <JobSearchBar
                            value={searchQuery}
                            onChange={onSearchChange}
                            placeholder="顧客名・車名・ナンバー・タグIDで検索"
                            onScanClick={onScanClick}
                            jobs={searchJobs}
                            onSuggestionSelect={onSuggestionSelect}
                          />
                        </div>
                      )}
                      
                      {/* モバイル: 検索バー（TOPページのみ） */}
                      {isTopPage && onSearchChange && (
                        <div className="sm:hidden flex-1 min-w-0 max-w-[200px]">
                          <JobSearchBar
                            value={searchQuery}
                            onChange={onSearchChange}
                            placeholder="検索..."
                            onScanClick={onScanClick}
                            jobs={searchJobs}
                            onSuggestionSelect={onSuggestionSelect}
                          />
                        </div>
                      )}
                      
                      {rightArea && (
                        <div className="flex items-center gap-2 shrink-0">
                          {rightArea}
                        </div>
                      )}
                    </div>
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
          </>
        )}

        {/* TOPページ以外: コンパクトなヘッダー（戻るボタン + children） */}
        {!isTopPage && (
          <div className="relative transition-all duration-300 ease-in-out">
            {isHeaderExpanded ? (
              /* 展開時: フル情報 */
              <div className="py-2">
                {/* 左上に戻るボタンを表示 */}
                <div className="mb-2">
                  <BackButton href={backHref} hasUnsavedChanges={hasUnsavedChanges} />
                </div>
                {children && <div>{children}</div>}
              </div>
            ) : (
              /* 最小化時: 戻るボタン + ページタイトル（アイコン付き） + ステータスバッジ */
              <div className="py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <BackButton href={backHref} hasUnsavedChanges={hasUnsavedChanges} />
                  {pageTitle && (
                    <h1 className="text-base font-semibold text-slate-900 truncate flex items-center gap-2">
                      {pageTitleIcon && (
                        <span className="shrink-0 text-slate-700">
                          {pageTitleIcon}
                        </span>
                      )}
                      <span className="truncate">{pageTitle}</span>
                    </h1>
                  )}
                </div>
                {statusBadge && (
                  <div className="shrink-0">
                    {statusBadge}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
