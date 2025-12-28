"use client";

/**
 * 高速点検モード用 項目リストコンポーネント
 * 
 * 改善提案: docs/INSPECTION_FAST_MODE_UX_PROPOSAL.md
 * 
 * 特徴:
 * - 自動スクロール機能（次の項目へ）
 * - 項目の参照管理（refs）
 * - スムーズなスクロールアニメーション
 */

import { useRef, useEffect, useCallback } from "react";
import { InspectionFastModeItemCard } from "./inspection-fast-mode-item-card";
import { InspectionItemRedesign, InspectionStatus } from "@/types/inspection-redesign";

// =============================================================================
// Props
// =============================================================================

interface InspectionFastModeListProps {
  /** 検査項目リスト */
  items: InspectionItemRedesign[];
  /** ステータス変更ハンドラ */
  onStatusChange: (itemId: string, status: InspectionStatus) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 高速点検モード用の項目リスト
 * 
 * 自動スクロール機能付きで、次の項目へスムーズに移動します
 */
export function InspectionFastModeList({
  items,
  onStatusChange,
  disabled = false,
}: InspectionFastModeListProps) {
  // 各項目のrefを管理
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 項目のrefを設定
  const setItemRef = useCallback((itemId: string, element: HTMLDivElement | null) => {
    if (element) {
      itemRefs.current.set(itemId, element);
    } else {
      itemRefs.current.delete(itemId);
    }
  }, []);

  // 次の項目へスクロール
  const scrollToNext = useCallback((currentItemId: string) => {
    const currentIndex = items.findIndex((item) => item.id === currentItemId);
    if (currentIndex === -1 || currentIndex >= items.length - 1) {
      // 最後の項目の場合はスクロールしない
      return;
    }

    const nextItem = items[currentIndex + 1];
    const nextElement = itemRefs.current.get(nextItem.id);

    if (nextElement) {
      // スムーズにスクロール（次の項目の位置へ）
      nextElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [items]);

  // ステータス変更ハンドラ（スクロール機能付き）
  const handleStatusChange = useCallback(
    (itemId: string, status: InspectionStatus) => {
      onStatusChange(itemId, status);
      // 次の項目へスクロール
      scrollToNext(itemId);
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
          <InspectionFastModeItemCard
            item={item}
            onStatusChange={handleStatusChange}
            onNext={() => scrollToNext(item.id)}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}





