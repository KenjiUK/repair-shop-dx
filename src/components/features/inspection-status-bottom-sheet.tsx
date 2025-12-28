"use client";

/**
 * 検査ステータス選択用 ボトムシートコンポーネント
 * 
 * 画面下部から選択肢が表示されるボトムシート
 * iOS Action Sheet / Android Bottom Sheet パターン
 */

import { useState, useEffect } from "react";
import { InspectionStatus, INSPECTION_STATUS_LABELS, InspectionMeasurements } from "@/types/inspection-redesign";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  Droplet,
  Wrench,
  Circle,
  Camera,
  Video,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InspectionMeasurementInputInline } from "./inspection-measurement-input-inline";

// =============================================================================
// Props
// =============================================================================

interface InspectionStatusBottomSheetProps {
  /** 開閉状態 */
  open: boolean;
  /** 開閉ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** 現在の項目ID */
  itemId?: string;
  /** 現在の項目名 */
  itemLabel: string;
  /** 現在のステータス */
  currentStatus: InspectionStatus;
  /** 残り項目数 */
  remainingItems?: number;
  /** 現在のセクション */
  currentSection?: string;
  /** 総セクション数 */
  totalSections?: number;
  /** ステータス選択ハンドラ */
  onStatusSelect: (status: InspectionStatus) => void;
  /** 測定値が必要かどうか */
  requiresMeasurement?: boolean;
  /** 現在の測定値データ */
  measurements?: InspectionMeasurements;
  /** 測定値変更ハンドラ */
  onMeasurementsChange?: (measurements: InspectionMeasurements) => void;
  /** 写真撮影が必要なステータスかどうか */
  requiresPhoto?: boolean;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: () => void;
  /** 動画録画ハンドラ */
  onVideoCapture?: () => void;
  /** 写真撮影をスキップするハンドラ */
  onPhotoSkip?: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 検査ステータス選択用ボトムシート
 * 
 * 特徴:
 * - 画面下部からスライドアップ
 * - 良好（レ）ボタンを大きく、目立つように配置
 * - その他の選択肢を2列グリッドで配置
 * - タップで即座に開く（長押し不要）
 */
export function InspectionStatusBottomSheet({
  open,
  onOpenChange,
  itemId,
  itemLabel,
  currentStatus,
  remainingItems,
  currentSection,
  totalSections,
  onStatusSelect,
  requiresMeasurement = false,
  measurements = {},
  onMeasurementsChange,
  requiresPhoto = false,
  onPhotoCapture,
  onVideoCapture,
  onPhotoSkip,
}: InspectionStatusBottomSheetProps) {
  const [selectedStatus, setSelectedStatus] = useState<InspectionStatus | null>(null);
  const [showMeasurementInput, setShowMeasurementInput] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  // ボトムシートが閉じられたときに状態をリセット
  useEffect(() => {
    if (!open) {
      setSelectedStatus(null);
      setShowMeasurementInput(false);
      setShowPhotoOptions(false);
    }
  }, [open]);

  // ステータス選択ハンドラ
  const handleStatusSelect = (status: InspectionStatus) => {
    // ハプティックフィードバック（異常時は長め）
    if (status === "exchange" || status === "repair") {
      triggerHapticFeedback("warning");
    } else if (status === "good") {
      triggerHapticFeedback("success");
    } else {
      triggerHapticFeedback("medium");
    }

    // 写真が必要なステータスかどうか
    const needsPhoto = status === "exchange" || 
                       status === "repair" || 
                       status === "adjust" || 
                       status === "tighten" || 
                       status === "specific";

    // 写真が必要で、写真撮影ハンドラがある場合は写真撮影オプションを表示
    if (needsPhoto && requiresPhoto && (onPhotoCapture || onVideoCapture || onPhotoSkip)) {
      setSelectedStatus(status);
      setShowPhotoOptions(true);
    } else if (requiresMeasurement && onMeasurementsChange) {
      // 測定値が必要な場合は、測定値入力UIを表示
      setSelectedStatus(status);
      setShowMeasurementInput(true);
    } else {
      // 測定値不要の場合はそのままステータスを設定
      onStatusSelect(status);
      onOpenChange(false);
    }
  };

  // 写真撮影ハンドラ
  const handlePhotoCapture = () => {
    if (selectedStatus) {
      onStatusSelect(selectedStatus);
      onPhotoCapture?.();
      setSelectedStatus(null);
      setShowPhotoOptions(false);
      onOpenChange(false);
    }
  };

  // 動画録画ハンドラ
  const handleVideoCapture = () => {
    if (selectedStatus) {
      onStatusSelect(selectedStatus);
      onVideoCapture?.();
      setSelectedStatus(null);
      setShowPhotoOptions(false);
      onOpenChange(false);
    }
  };

  // 写真撮影スキップハンドラ
  const handlePhotoSkip = () => {
    if (selectedStatus) {
      onStatusSelect(selectedStatus);
      onPhotoSkip?.();
      setSelectedStatus(null);
      setShowPhotoOptions(false);
      onOpenChange(false);
    }
  };

  // 測定値確定ハンドラ
  const handleMeasurementConfirm = () => {
    if (selectedStatus) {
      onStatusSelect(selectedStatus);
      setSelectedStatus(null);
      setShowMeasurementInput(false);
      onOpenChange(false);
    }
  };

  // 測定値キャンセルハンドラ
  const handleMeasurementCancel = () => {
    setSelectedStatus(null);
    setShowMeasurementInput(false);
  };

  // ステータスのアイコンを取得（ボタンのテキスト色に従うため、色指定なし）
  const getStatusIcon = (status: InspectionStatus, className?: string) => {
    const iconClassName = className || "h-6 w-6";
    switch (status) {
      case "good":
        return <CheckCircle2 className={iconClassName} />;
      case "exchange":
        return <XCircle className={iconClassName} />;
      case "repair":
        return <AlertTriangle className={iconClassName} />;
      case "adjust":
        return <Settings className={iconClassName} />;
      case "lubricate":
        return <Droplet className={iconClassName} />;
      case "tighten":
        return <Wrench className={iconClassName} />;
      case "specific":
        return <Circle className={iconClassName} />;
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] p-0 rounded-t-2xl dark:bg-slate-900 dark:border-slate-700">
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          <SheetTitle className="text-lg font-semibold text-slate-900 leading-relaxed break-words dark:text-white">
            {itemLabel}
          </SheetTitle>
          {(remainingItems !== undefined || currentSection) && (
            <SheetDescription className="text-base text-slate-700 mt-1.5 dark:text-white">
              {remainingItems !== undefined && `残り ${remainingItems} 項目`}
              {currentSection && totalSections && ` (${currentSection} / ${totalSections})`}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="px-4 py-4 pb-6 space-y-3 dark:bg-slate-900">
          {/* 写真撮影オプション（ステータス選択後） */}
          {showPhotoOptions && (
            <div className="space-y-3">
              <div className="text-base font-medium text-slate-900 dark:text-white">
                証拠写真を撮影しますか？
              </div>
              
              {/* 写真を撮影 - プライマリアクション（青系：情報・アクション） */}
              {onPhotoCapture && (
                <Button
                  type="button"
                  onClick={handlePhotoCapture}
                  className="w-full h-16 text-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="h-6 w-6 mr-2 shrink-0" />
                  写真を撮影
                </Button>
              )}

              {/* 動画を録画・スキップ - 動的グリッド（動画がない場合は1列） */}
              <div className={cn(
                "grid gap-3",
                onVideoCapture ? "grid-cols-2" : "grid-cols-1"
              )}>
                {onVideoCapture && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVideoCapture}
                    className="h-16 text-base font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                  >
                    <Video className="h-6 w-6 mr-2 shrink-0" />
                    動画を録画
                  </Button>
                )}
                
                {onPhotoSkip && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePhotoSkip}
                    className="h-16 text-base font-semibold border-2 border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                  >
                    <SkipForward className="h-6 w-6 mr-2 shrink-0" />
                    スキップ
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 測定値入力UI（ステータス選択後） */}
          {showMeasurementInput && requiresMeasurement && itemId && onMeasurementsChange && (
            <InspectionMeasurementInputInline
              itemId={itemId}
              itemLabel={itemLabel}
              measurements={measurements}
              onMeasurementsChange={onMeasurementsChange}
              onConfirm={handleMeasurementConfirm}
              onCancel={handleMeasurementCancel}
            />
          )}

          {/* ステータス選択ボタン（測定値入力・写真撮影オプション表示中は非表示） */}
          {!showMeasurementInput && !showPhotoOptions && (
            <>
              {/* 良好（レ）- 最頻繁に使用するため大きく表示 */}
              <Button
            variant={currentStatus === "good" ? "default" : "outline"}
            onClick={() => handleStatusSelect("good")}
            className={cn(
              "w-full h-16 text-xl font-semibold",
              currentStatus === "good"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "border-2 border-slate-300 text-green-700 hover:bg-green-50 hover:border-green-300 dark:border-slate-600 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:border-green-700"
            )}
          >
            <span className="flex items-center justify-center gap-2.5">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              良好（レ）
            </span>
          </Button>

          {/* その他のステータス - 2列グリッド */}
          <div className="grid grid-cols-2 gap-4">
            {/* 交換（×） */}
            <Button
              variant={currentStatus === "exchange" ? "default" : "outline"}
              onClick={() => handleStatusSelect("exchange")}
              className={cn(
                "h-16 text-base font-semibold",
                currentStatus === "exchange"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "border-2 border-slate-300 text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-slate-600 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:border-red-700"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {getStatusIcon("exchange", "h-6 w-6 shrink-0")}
                交換（×）
              </span>
            </Button>

            {/* 調整（A） */}
            <Button
              variant={currentStatus === "adjust" ? "default" : "outline"}
              onClick={() => handleStatusSelect("adjust")}
              className={cn(
                "h-16 text-base font-semibold",
                currentStatus === "adjust"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "border-2 border-slate-300 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {getStatusIcon("adjust", "h-6 w-6")}
                調整（A）
              </span>
            </Button>

            {/* 締付（T） */}
            <Button
              variant={currentStatus === "tighten" ? "default" : "outline"}
              onClick={() => handleStatusSelect("tighten")}
              className={cn(
                "h-16 text-base font-semibold",
                currentStatus === "tighten"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-2 border-slate-300 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {getStatusIcon("tighten", "h-6 w-6")}
                締付（T）
              </span>
            </Button>

            {/* 清掃（C） */}
            <Button
              variant={currentStatus === "clean" ? "default" : "outline"}
              onClick={() => handleStatusSelect("clean")}
              className={cn(
                "h-16 text-base font-semibold",
                currentStatus === "clean"
                  ? "bg-slate-600 hover:bg-slate-700 text-white"
                  : "border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 dark:hover:border-slate-500"
              )}
            >
              <span className="text-base">清掃（C）</span>
            </Button>

            {/* 給油（L） */}
            <Button
              variant={currentStatus === "lubricate" ? "default" : "outline"}
              onClick={() => handleStatusSelect("lubricate")}
              className={cn(
                "h-16 text-base font-semibold",
                currentStatus === "lubricate"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-2 border-slate-300 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {getStatusIcon("lubricate", "h-6 w-6")}
                給油（L）
              </span>
            </Button>

            {/* 修理（△） */}
            <Button
              variant={currentStatus === "repair" ? "default" : "outline"}
              onClick={() => handleStatusSelect("repair")}
              className={cn(
                "h-16 text-base font-semibold",
                currentStatus === "repair"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "border-2 border-slate-300 text-amber-700 hover:bg-amber-50 hover:border-amber-300"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {getStatusIcon("repair", "h-6 w-6")}
                修理（△）
              </span>
            </Button>

            {/* 特定整備（○） */}
            <Button
              variant={currentStatus === "specific" ? "default" : "outline"}
              onClick={() => handleStatusSelect("specific")}
              className={cn(
                "h-16 text-base font-semibold",
                currentStatus === "specific"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "border-2 border-slate-300 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {getStatusIcon("specific", "h-6 w-6")}
                特定整備（○）
              </span>
            </Button>

            {/* 省略（P） */}
            <Button
              variant={currentStatus === "omit" ? "default" : "outline"}
              onClick={() => handleStatusSelect("omit")}
              className={cn(
                "h-16 text-base font-semibold",
                currentStatus === "omit"
                  ? "bg-slate-600 hover:bg-slate-700 text-white"
                  : "border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 dark:hover:border-slate-500"
              )}
            >
              <span className="text-base">省略（P）</span>
            </Button>

            {/* 該当なし（／） */}
            <Button
              variant={currentStatus === "none" ? "default" : "outline"}
              onClick={() => handleStatusSelect("none")}
              className={cn(
                "h-16 text-base font-semibold",
                currentStatus === "none"
                  ? "bg-slate-600 hover:bg-slate-700 text-white"
                  : "border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800 dark:hover:border-slate-500"
              )}
            >
              <span className="text-base">該当なし（／）</span>
            </Button>
          </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

