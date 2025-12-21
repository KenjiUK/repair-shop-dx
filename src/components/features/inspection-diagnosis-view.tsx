"use client";

import { useState, useMemo } from "react";
import { InspectionCategoryTabs } from "./inspection-category-tabs";
import { InspectionItemInput } from "./inspection-item-input";
import { InspectionItem, InspectionCategory, getItemsByCategory, calculateCategoryProgress } from "@/lib/inspection-items";
import { TrafficLightStatus } from "./traffic-light-button";
import { PhotoData } from "./photo-capture-button";
import { VideoData } from "./video-capture-button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
  /** 動画撮影ハンドラ */
  onVideoCapture?: (itemId: string, file: File) => void | Promise<void>;
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
  const [selectedCategory, setSelectedCategory] = useState<InspectionCategory>(
    "engine_room"
  );

  // 選択されたカテゴリの項目を取得
  const categoryItems = useMemo(() => {
    return getItemsByCategory(selectedCategory).map((templateItem) => {
      // 既存の項目データとマージ
      const existingItem = items.find((item) => item.id === templateItem.id);
      return existingItem || templateItem;
    });
  }, [selectedCategory, items]);

  // カテゴリの進捗を計算
  const progress = useMemo(() => {
    return calculateCategoryProgress(selectedCategory, items);
  }, [selectedCategory, items]);

  // 進捗バーの色を決定
  const progressColor = useMemo(() => {
    if (progress.percentage >= 80) return "bg-green-500";
    if (progress.percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  }, [progress.percentage]);

  return (
    <div className="space-y-4">
      {/* カテゴリタブ */}
      <InspectionCategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        items={items}
        disabled={disabled}
      />

      {/* 進捗バー */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                {progress.completed} / {progress.total}項目完了
              </span>
              <span className="text-slate-600">{progress.percentage}%</span>
            </div>
            <Progress
              value={progress.percentage}
              className="h-2"
              indicatorClassName={progressColor}
            />
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
