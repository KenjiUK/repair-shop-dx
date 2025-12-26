"use client";

import { InspectionCategory, CATEGORY_DISPLAY_NAMES, calculateCategoryProgress } from "@/lib/inspection-items";
import { InspectionItem } from "@/lib/inspection-items";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Settings,
  Car,
  Wrench,
  CarFront,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";

// =============================================================================
// アイコンマッピング
// =============================================================================

const CATEGORY_ICON_MAP: Record<InspectionCategory, typeof Settings> = {
  engine_room: Settings,
  interior: Car,
  chassis: Wrench,
  underbody: CarFront,
  exterior: CarFront,
  daily: CheckCircle2,
  other: MoreHorizontal,
};

// =============================================================================
// Props
// =============================================================================

interface InspectionCategoryTabsProps {
  /** 現在選択されているカテゴリ */
  selectedCategory: InspectionCategory;
  /** カテゴリ変更ハンドラ */
  onCategoryChange: (category: InspectionCategory) => void;
  /** 検査項目リスト */
  items: InspectionItem[];
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function InspectionCategoryTabs({
  selectedCategory,
  onCategoryChange,
  items,
  disabled = false,
}: InspectionCategoryTabsProps) {
  // 全カテゴリを取得
  const categories: InspectionCategory[] = [
    "engine_room",
    "interior",
    "chassis",
    "underbody",
    "exterior",
    "daily",
  ];

  return (
    <Tabs
      value={selectedCategory}
      onValueChange={(value) => onCategoryChange(value as InspectionCategory)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-slate-100 overflow-x-auto">
        {categories.map((category) => {
          const Icon = CATEGORY_ICON_MAP[category];
          const progress = calculateCategoryProgress(category, items);
          const isCompleted = progress.percentage === 100;
          const hasIncomplete = progress.completed < progress.total;

          return (
            <TabsTrigger
              key={category}
              value={category}
              disabled={disabled}
              className={cn(
                "flex flex-col items-center gap-1.5 px-2 sm:px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm",
                "text-base font-medium",
                "min-w-0 shrink-0",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-1.5 shrink-0">
                <Icon className="h-4 w-4 shrink-0" />
                {isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-green-700 shrink-0" />
                )}
              </div>
              <span className="text-center leading-tight truncate w-full px-0.5 text-base">
                {CATEGORY_DISPLAY_NAMES[category]}
              </span>
              {hasIncomplete && !isCompleted && (
                <Badge
                  variant="outline"
                  className="h-5 min-w-5 px-1.5 text-base font-medium bg-amber-100 text-amber-700 border-amber-400 shrink-0 whitespace-nowrap"
                >
                  {progress.total - progress.completed}
                </Badge>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
