"use client";

/**
 * ボトムシート方式 項目リストコンポーネント
 * 
 * 特徴:
 * - 自動スクロール機能（次の項目へ）
 * - セクション終了時の自動遷移
 * - 項目の参照管理（refs）
 * - 自動進行機能（次の項目のボトムシートを自動で開く）
 */

import { useRef, useCallback, useMemo, useState } from "react";
import { InspectionBottomSheetItemCard } from "./inspection-bottom-sheet-item-card";
import { InspectionItemRedesign, InspectionStatus, InspectionMeasurements } from "@/types/inspection-redesign";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";

// =============================================================================
// Props
// =============================================================================

interface InspectionBottomSheetListProps {
  /** 検査項目リスト */
  items: InspectionItemRedesign[];
  /** ステータス変更ハンドラ */
  onStatusChange: (itemId: string, status: InspectionStatus, skipAutoAdvance?: boolean) => void;
  /** 写真追加ハンドラ */
  onPhotoAdd?: (itemId: string, file: File) => Promise<void>;
  /** 写真削除ハンドラ */
  onPhotoDelete?: (itemId: string, index: number) => void;
  /** 動画追加ハンドラ */
  onVideoAdd?: (itemId: string, file: File) => Promise<void>;
  /** 動画削除ハンドラ */
  onVideoDelete?: (itemId: string, index: number) => void;
  /** 次のセクションへ遷移するハンドラ */
  onNextSection?: () => void;
  /** 現在のセクション名 */
  currentSection?: string;
  /** 総セクション数 */
  totalSections?: number;
  /** 無効化 */
  disabled?: boolean;
  /** アクティブカテゴリ */
  activeCategory?: string;
  /** 測定値データ */
  measurements?: InspectionMeasurements;
  /** 測定値変更ハンドラ */
  onMeasurementsChange?: (measurements: InspectionMeasurements) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ボトムシート方式の項目リスト
 * 
 * 自動スクロール機能付きで、次の項目へスムーズに移動します
 * セクション終了時は自動で次のセクションへ遷移します
 */
export function InspectionBottomSheetList({
  items,
  onStatusChange,
  onPhotoAdd,
  onPhotoDelete,
  onVideoAdd,
  onVideoDelete,
  onNextSection,
  currentSection,
  totalSections,
  disabled = false,
  activeCategory,
  measurements = {},
  onMeasurementsChange,
}: InspectionBottomSheetListProps) {
  // 各項目のrefを管理
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // 自動で開く次の項目のID（自動進行機能）
  const [nextItemIdToAutoOpen, setNextItemIdToAutoOpen] = useState<string | null>(null);

  // 項目のrefを設定
  const setItemRef = useCallback((itemId: string, element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(itemId, element);
    } else {
      itemRefs.current.delete(itemId);
    }
  }, []);

  // 残り項目数を計算
  const remainingItems = useMemo(() => {
    return items.filter((item) => item.status === "none").length;
  }, [items]);

  // 次の項目へスクロール
  const scrollToNext = useCallback(
    (currentItemId: string) => {
      const currentIndex = items.findIndex((item) => item.id === currentItemId);
      if (currentIndex === -1) {
        return;
      }

      // 次の未完了項目を探す
      let nextIndex = currentIndex + 1;
      while (nextIndex < items.length && items[nextIndex].status !== "none") {
        nextIndex++;
      }

      // 次の未完了項目が見つかった場合
      if (nextIndex < items.length) {
        const nextItem = items[nextIndex];
        const nextElement = itemRefs.current.get(nextItem.id);

        if (nextElement) {
          // スムーズにスクロール（次の項目の位置へ）
          setTimeout(() => {
            nextElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            
            // スクロール完了後に次の項目のボトムシートを自動で開く（自動進行機能）
            setTimeout(() => {
              setNextItemIdToAutoOpen(nextItem.id);
            }, 200); // スクロールアニメーション完了後
          }, 150); // ボトムシートが閉じるアニメーション後に実行
        }
      } else {
        // セクション内の全項目が完了した場合
        // 次のセクションへ自動遷移
        if (onNextSection) {
          setTimeout(() => {
            triggerHapticFeedback("success");
            onNextSection();
          }, 300);
        }
      }
    },
    [items, onNextSection]
  );

  // ステータス変更ハンドラ（スクロール機能付き）
  const handleStatusChange = useCallback(
    (itemId: string, status: InspectionStatus, skipAutoAdvance?: boolean) => {
      onStatusChange(itemId, status);
      // 自動進行をスキップしない場合のみ次の項目へスクロール
      if (!skipAutoAdvance) {
        scrollToNext(itemId);
      }
    },
    [onStatusChange, scrollToNext]
  );

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          ref={(el) => setItemRef(item.id, el)}
          data-item-id={item.id}
          data-item-index={index}
        >
          <InspectionBottomSheetItemCard
            item={item}
            onStatusChange={handleStatusChange}
            onPhotoAdd={onPhotoAdd}
            onPhotoDelete={onPhotoDelete}
            onVideoAdd={onVideoAdd}
            onVideoDelete={onVideoDelete}
            remainingItems={remainingItems - (item.status === "none" ? 1 : 0)}
            currentSection={currentSection}
            totalSections={totalSections}
            disabled={disabled}
            shouldAutoOpen={nextItemIdToAutoOpen === item.id}
            onAutoOpenComplete={() => setNextItemIdToAutoOpen(null)}
            measurements={measurements}
            onMeasurementsChange={onMeasurementsChange}
          />
        </div>
      ))}
    </div>
  );
}

