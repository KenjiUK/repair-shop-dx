"use client";

import { useState, useMemo, useEffect } from "react";
import { InspectionItemInput } from "./inspection-item-input";
import { InspectionItem, InspectionCategory, getItemsByCategory, calculateCategoryProgress, getAllCategories, CATEGORY_DISPLAY_NAMES } from "@/lib/inspection-items";
import { TrafficLightStatus } from "./traffic-light-button";
import { PhotoData } from "./photo-capture-button";
import { VideoData } from "./video-capture-button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Settings,
  Car,
  Wrench,
  CarFront,
  CheckCircle2,
  MoreHorizontal,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface InspectionDiagnosisViewProps {
  /** 検査項目リスト */
  items: InspectionItem[];
  /** 状態変更ハンドラ */
  onStatusChange: (itemId: string, status: TrafficLightStatus) => void;
  /** 測定値変更ハンドラ */
  onMeasurementChange?: (itemId: string, value: number) => void;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (itemId: string, file: File) => void | Promise<void>;
  /** 動画撮影ハンドラ（音声認識テキスト付き） */
  onVideoCapture?: (itemId: string, file: File, transcription?: string) => void | Promise<void>;
  /** コメント変更ハンドラ */
  onCommentChange?: (itemId: string, comment: string) => void;
  /** 写真データマップ */
  photoDataMap?: Record<string, PhotoData>;
  /** 動画データマップ */
  videoDataMap?: Record<string, VideoData>;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

// カテゴリアイコンマッピング
const CATEGORY_ICON_MAP: Record<InspectionCategory, typeof Settings> = {
  engine_room: Settings,
  interior: Car,
  chassis: Wrench,
  underbody: CarFront,
  exterior: CarFront,
  daily: CheckCircle2,
  other: MoreHorizontal,
};

export function InspectionDiagnosisView({
  items,
  onStatusChange,
  onMeasurementChange,
  onPhotoCapture,
  onVideoCapture,
  onCommentChange,
  photoDataMap = {},
  videoDataMap = {},
  disabled = false,
}: InspectionDiagnosisViewProps) {
  // 全カテゴリを取得
  const categories = getAllCategories();
  
  // 開いているカテゴリを管理（最初のカテゴリのみデフォルトで開く）
  const [openCategories, setOpenCategories] = useState<Record<InspectionCategory, boolean>>(() => {
    const initial: Record<InspectionCategory, boolean> = {} as Record<InspectionCategory, boolean>;
    categories.forEach((category, index) => {
      // 最初のカテゴリのみデフォルトで開く
      initial[category] = index === 0;
    });
    return initial;
  });

  // 完了カテゴリを自動で閉じる
  useEffect(() => {
    categories.forEach((category) => {
      const progress = calculateCategoryProgress(category, items);
      const isCompleted = progress.percentage === 100;
      
      // 完了したカテゴリは自動で閉じる
      if (isCompleted) {
        setOpenCategories((prev) => {
          // 既に閉じている場合は更新しない
          if (!prev[category]) {
            return prev;
          }
          return {
            ...prev,
            [category]: false,
          };
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // カテゴリごとの項目を取得
  const getCategoryItems = (category: InspectionCategory) => {
    return getItemsByCategory(category).map((templateItem) => {
      // 既存の項目データとマージ
      const existingItem = items.find((item) => item.id === templateItem.id);
      return existingItem || templateItem;
    });
  };

  // カテゴリが未入力かどうかを判定（未チェック項目があるか）
  const hasIncompleteItems = (category: InspectionCategory) => {
    const categoryItems = getCategoryItems(category);
    return categoryItems.some((item) => item.status === "unchecked");
  };

  // カテゴリが完了しているかどうかを判定
  const isCategoryCompleted = (category: InspectionCategory) => {
    const progress = calculateCategoryProgress(category, items);
    return progress.percentage === 100;
  };

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const categoryItems = getCategoryItems(category);
        const progress = calculateCategoryProgress(category, items);
        const Icon = CATEGORY_ICON_MAP[category];
        const isOpen = openCategories[category];
        const hasIncomplete = hasIncompleteItems(category);
        const isCompleted = isCategoryCompleted(category);

        // 進捗バーの色を決定
        const progressColor = progress.percentage >= 80 
          ? "bg-green-500" 
          : progress.percentage >= 50 
          ? "bg-amber-500"
          : "bg-red-500";

        return (
          <Collapsible
            key={category}
            open={isOpen}
            onOpenChange={(open) => {
              setOpenCategories((prev) => ({
                ...prev,
                [category]: open,
              }));
            }}
          >
            <Card className="border border-slate-300 rounded-xl shadow-md">
              <CollapsibleTrigger
                className={cn(
                  "w-full px-4 py-3 hover:bg-slate-50 transition-colors",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                disabled={disabled}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className="h-5 w-5 text-slate-700 shrink-0" strokeWidth={2.5} />
                    <span className="text-base font-semibold text-slate-900 truncate">
                      {CATEGORY_DISPLAY_NAMES[category]}
                    </span>
                    {hasIncomplete && !isCompleted && (
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0" strokeWidth={2.5} aria-label="未入力項目あり" />
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0" strokeWidth={2.5} aria-label="完了" />
                    )}
                    <Badge
                      variant={isCompleted ? "default" : "secondary"}
                      className="text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                    >
                      <span className="tabular-nums">{progress.completed}</span> / <span className="tabular-nums">{progress.total}</span>
                    </Badge>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-slate-600 shrink-0 transition-transform",
                      isOpen && "transform rotate-180",
                      disabled && "opacity-50"
                    )}
                    strokeWidth={2.5}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-4">
                  {/* 進捗バー */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-base">
                      <span className="font-medium text-slate-700">
                        <span className="tabular-nums">{progress.completed}</span> / <span className="tabular-nums">{progress.total}</span>項目完了
                      </span>
                      <span className="text-slate-700 font-medium tabular-nums">{progress.percentage}%</span>
                    </div>
                    <Progress
                      value={progress.percentage}
                      className="h-2"
                      indicatorClassName={progressColor}
                    />
                  </div>

                  {/* 検査項目リスト */}
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <InspectionItemInput
                        key={item.id}
                        item={item}
                        onStatusChange={onStatusChange}
                        onMeasurementChange={onMeasurementChange}
                        onPhotoCapture={onPhotoCapture}
                        onVideoCapture={onVideoCapture}
                        onCommentChange={onCommentChange}
                        photoData={photoDataMap[item.id]}
                        videoData={videoDataMap[item.id]}
                        disabled={disabled}
                      />
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
