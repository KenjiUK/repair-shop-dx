"use client";

/**
 * 12ヶ月点検・24ヶ月点検 再設計版 ヘッダーコンポーネント
 * 
 * 再設計仕様書: docs/INSPECTION_DIAGNOSIS_PAGE_REDESIGN.md
 */

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  InspectionItemRedesign,
  InspectionStatus,
} from "@/types/inspection-redesign";
import {
  calculateProgress,
  getAbnormalItems,
} from "@/lib/inspection-items-redesign";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface InspectionRedesignHeaderProps {
  /** 検査項目リスト */
  items: InspectionItemRedesign[];
  /** 車両名 */
  vehicleName?: string;
  /** ナンバープレート */
  licensePlate?: string;
  /** 顧客名 */
  customerName?: string;
  /** 点検タイプ */
  type: "12month" | "24month";
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 点検診断画面のヘッダーコンポーネント
 * 
 * 表示内容:
 * - 車両情報（車両名、ナンバープレート、顧客名）
 * - 進捗バー（完了項目数 / 全項目数）
 * - 要整備リストのバッジ（異常項目がある場合のみ）
 */
export function InspectionRedesignHeader({
  items,
  vehicleName,
  licensePlate,
  customerName,
  type,
  className,
}: InspectionRedesignHeaderProps) {
  // 進捗を計算（12ヶ月点検は全項目、24ヶ月点検は必須項目のみ）
  const progress = useMemo(() => calculateProgress(items, type), [items, type]);
  
  // 異常項目（交換、調整、修理が必要な項目）を取得
  const abnormalItems = useMemo(() => getAbnormalItems(items), [items]);
  
  // 点検タイプの表示名
  const typeLabel = type === "12month" ? "12ヶ月点検" : "24ヶ月点検（車検）";

  return (
    <div
      className={cn(
        "bg-white border-b border-slate-200 px-4 py-4 space-y-3",
        className
      )}
    >
      {/* 車両情報 */}
      <div className="space-y-1">
        {vehicleName && (
          <h2 className="text-lg font-semibold text-slate-900">
            {vehicleName}
          </h2>
        )}
        <div className="flex items-center gap-3 text-base text-slate-700">
          {licensePlate && (
            <span className="font-medium">{licensePlate}</span>
          )}
          {customerName && (
            <>
              {licensePlate && <span className="text-slate-400">/</span>}
              <span>{customerName}</span>
            </>
          )}
          {typeLabel && (
            <>
              {(licensePlate || customerName) && (
                <span className="text-slate-400">/</span>
              )}
              <Badge variant="outline" className="text-base px-2 py-0.5">
                {typeLabel}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* 進捗バー */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-base text-slate-700">
            進捗:{" "}
            <span className="font-semibold text-slate-900 tabular-nums">
              {progress.completed}
            </span>
            {" / "}
            <span className="font-semibold text-slate-900 tabular-nums">
              {progress.total}
            </span>
            {" 項目"}
          </span>
          <span className="text-base font-semibold text-slate-900 tabular-nums">
            {Math.round(progress.percentage)}%
          </span>
        </div>
        <Progress
          value={progress.percentage}
          className="h-3"
          indicatorClassName={cn(
            progress.percentage === 100
              ? "bg-green-500"
              : progress.percentage >= 80
              ? "bg-blue-500"
              : progress.percentage >= 50
              ? "bg-amber-500"
              : "bg-red-500"
          )}
        />
      </div>

      {/* 要整備リスト（異常項目がある場合のみ表示） */}
      {abnormalItems.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <span className="text-base text-slate-700">
            要整備項目:
          </span>
          <Badge
            variant="destructive"
            className="text-base px-2.5 py-1 font-semibold"
          >
            {abnormalItems.length}件
          </Badge>
        </div>
      )}

      {/* 完了時のお知らせ */}
      {progress.completed === progress.total && progress.total > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <span className="text-base font-medium text-green-700">
            全ての項目の点検が完了しました
          </span>
        </div>
      )}
    </div>
  );
}

