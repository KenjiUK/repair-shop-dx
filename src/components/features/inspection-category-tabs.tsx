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
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-slate-100">
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
                "flex flex-col items-center gap-1 px-2 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm",
                "text-xs sm:text-sm",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                {isCompleted && (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                )}
              </div>
              <span className="text-center leading-tight">
                {CATEGORY_DISPLAY_NAMES[category]}
              </span>
              {hasIncomplete && !isCompleted && (
                <Badge
                  variant="outline"
                  className="h-5 min-w-5 px-1 text-xs bg-amber-100 text-amber-700 border-amber-300"
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
