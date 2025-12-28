"use client";

/**
 * 12ヶ月点検・24ヶ月点検 再設計版 タブナビゲーションコンポーネント
 * 
 * 再設計仕様書: docs/INSPECTION_DIAGNOSIS_PAGE_REDESIGN.md
 */

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  InspectionItemRedesign,
  InspectionCategory12Month,
  InspectionCategory24Month,
} from "@/types/inspection-redesign";
import {
  calculateCategoryProgress,
  getInspectionCategories,
} from "@/lib/inspection-items-redesign";
import {
  INSPECTION_CATEGORY_12MONTH_LABELS,
  INSPECTION_CATEGORY_24MONTH_LABELS,
} from "@/types/inspection-redesign";

// =============================================================================
// Props
// =============================================================================

interface InspectionRedesignTabsProps {
  /** 検査項目リスト */
  items: InspectionItemRedesign[];
  /** 点検タイプ */
  type: "12month" | "24month";
  /** アクティブなカテゴリ */
  activeCategory?: string;
  /** カテゴリ変更ハンドラ */
  onCategoryChange?: (category: string) => void;
  /** カスタムクラス名 */
  className?: string;
  /** 子要素（各TabsContentの内容） */
  children?: (category: string) => React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 点検診断画面のタブナビゲーションコンポーネント
 * 
 * 12ヶ月点検: 5タブ（かじ取り装置、制動装置、走行装置、緩衝装置、動力伝達装置）
 * 24ヶ月点検: 5タブ（エンジン・ルーム、室内、足廻り、下廻り、外廻り）
 */
export function InspectionRedesignTabs({
  items,
  type,
  activeCategory,
  onCategoryChange,
  className,
  children,
}: InspectionRedesignTabsProps) {
  // カテゴリリストを取得
  const categories = useMemo(
    () => getInspectionCategories(type),
    [type]
  );

  // デフォルトのアクティブカテゴリ（最初のカテゴリ）
  const defaultCategory = categories[0];
  const [internalActiveCategory, setInternalActiveCategory] = useState(
    activeCategory || defaultCategory
  );

  // 実際のアクティブカテゴリ（propsから制御される場合と内部状態の場合）
  const currentCategory = activeCategory || internalActiveCategory;

  // カテゴリ変更ハンドラ
  const handleCategoryChange = (value: string) => {
    if (onCategoryChange) {
      onCategoryChange(value);
    } else {
      setInternalActiveCategory(value);
    }
  };

  // カテゴリごとの進捗を計算
  const getCategoryProgressData = (
    category: InspectionCategory12Month | InspectionCategory24Month
  ) => {
    return calculateCategoryProgress(category, items);
  };

  // カテゴリの表示ラベルを取得
  const getCategoryLabel = (
    category: InspectionCategory12Month | InspectionCategory24Month
  ) => {
    if (type === "12month") {
      return INSPECTION_CATEGORY_12MONTH_LABELS[category as InspectionCategory12Month];
    } else {
      return INSPECTION_CATEGORY_24MONTH_LABELS[category as InspectionCategory24Month];
    }
  };

  // タブのスタイル（gridで均等配置、40歳以上ユーザー向け最適化: h-16でタッチしやすく、手袋着用時も操作可能）
  // 背景グレーを削除し、タブ自体の視認性を向上（bg-transparentでTabsListのデフォルトbg-mutedを上書き）
  const tabsListClass = "grid w-full grid-cols-5 h-16 items-center justify-center gap-2 bg-transparent p-0 text-muted-foreground";

  return (
    <Tabs
      value={currentCategory}
      onValueChange={handleCategoryChange}
      className={cn("w-full", className)}
    >
      {/* タブセクションを目立たせるための背景ボックス */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 shadow-sm mb-4 dark:bg-slate-800 dark:border-slate-700">
        <TabsList className={cn(tabsListClass)}>
          {categories.map((category) => {
            const progress = getCategoryProgressData(category);
            const label = getCategoryLabel(category);
            const hasProgress = progress.completed > 0;
            const isCompleted = progress.percentage === 100;

            return (
              <TabsTrigger
                key={category}
                value={category}
                className={cn(
                  "text-lg font-medium h-16 rounded-lg transition-all px-3",
                  // 完了済みカテゴリのスタイル
                  isCompleted && "bg-green-50 text-green-700 hover:bg-green-100 shadow-sm dark:bg-green-900/20 dark:text-white",
                  // 未完了カテゴリのスタイル（デフォルト）
                  !isCompleted && "bg-white text-slate-700 hover:bg-slate-50 shadow-sm dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
                  // アクティブ時のスタイル
                  "data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-700",
                  // ホバー効果（アクティブでない場合）
                  "hover:shadow-md focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                )}
              >
                <span className="truncate">{label}</span>
                {hasProgress && (
                  <Badge
                    variant={isCompleted ? "default" : "secondary"}
                    className={cn(
                      "ml-1.5 text-sm font-semibold px-1.5 py-0.5",
                      isCompleted && "bg-green-600 text-white"
                    )}
                  >
                    {progress.completed}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* 各カテゴリのコンテンツ */}
      {categories.map((category) => (
        <TabsContent
          key={category}
          value={category}
          className="mt-0"
        >
          {children ? children(category) : null}
        </TabsContent>
      ))}
    </Tabs>
  );
}

