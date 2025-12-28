"use client";

/**
 * ボトムシート方式 検査項目カードコンポーネント
 * 
 * 特徴:
 * - タップでボトムシートを開く（長押し不要）
 * - 現在のステータスをバッジで表示
 * - 完了アニメーション
 */

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  InspectionItemRedesign,
  InspectionStatus,
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_BADGE_VARIANTS,
  InspectionMeasurements,
} from "@/types/inspection-redesign";
import { InspectionStatusBottomSheet } from "./inspection-status-bottom-sheet";
import { InspectionMediaButton } from "./inspection-media-button";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { CheckCircle2, XCircle, AlertTriangle, Settings, Droplet, Wrench } from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface InspectionBottomSheetItemCardProps {
  /** 検査項目 */
  item: InspectionItemRedesign;
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
  /** 残り項目数 */
  remainingItems?: number;
  /** 現在のセクション */
  currentSection?: string;
  /** 総セクション数 */
  totalSections?: number;
  /** 無効化 */
  disabled?: boolean;
  /** 自動でボトムシートを開くか（自動進行機能） */
  shouldAutoOpen?: boolean;
  /** 自動オープン完了時のコールバック */
  onAutoOpenComplete?: () => void;
  /** 測定値データ */
  measurements?: InspectionMeasurements;
  /** 測定値変更ハンドラ */
  onMeasurementsChange?: (measurements: InspectionMeasurements) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ボトムシート方式の検査項目カード
 * 
 * タップでボトムシートを開き、ステータスを選択
 */
export function InspectionBottomSheetItemCard({
  item,
  onStatusChange,
  onPhotoAdd,
  onPhotoDelete,
  onVideoAdd,
  onVideoDelete,
  remainingItems,
  currentSection,
  totalSections,
  disabled = false,
  shouldAutoOpen = false,
  onAutoOpenComplete,
  measurements = {},
  onMeasurementsChange,
}: InspectionBottomSheetItemCardProps) {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMediaProcessing, setIsMediaProcessing] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  // 自動進行機能: shouldAutoOpenがtrueになったらボトムシートを開く
  useEffect(() => {
    if (shouldAutoOpen && !disabled && item.status === "none") {
      // 少し遅延を入れてスムーズに開く（スクロール完了後）
      const timer = setTimeout(() => {
        setIsBottomSheetOpen(true);
        triggerHapticFeedback("light");
        // コールバックを呼び出してフラグをリセット
        onAutoOpenComplete?.();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAutoOpen, disabled, item.status, onAutoOpenComplete]);

  // 完了アニメーションをリセット
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        setIsCompleted(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  // カードタップハンドラ（ボトムシートを開く）
  const handleCardTap = () => {
    if (disabled) return;

    // ハプティックフィードバック（軽い振動）
    triggerHapticFeedback("light");

    // ボトムシートを開く
    setIsBottomSheetOpen(true);
  };

  // ステータス選択ハンドラ
  const handleStatusSelect = (status: InspectionStatus) => {
    // ステータスを設定（写真撮影オプションはボトムシート内で処理）
    onStatusChange(item.id, status, false);
    setIsCompleted(true);
  };

  // 写真撮影ハンドラ
  const handlePhotoCapture = () => {
    // 自動進行をスキップ（カメラ起動中は自動進行しない）
    setIsBottomSheetOpen(false);
    // カメラを起動
    photoInputRef.current?.click();
  };

  // 動画録画ハンドラ
  const handleVideoCapture = () => {
    // 動画録画は後で実装（必要に応じて）
    setIsBottomSheetOpen(false);
  };

  // 写真撮影スキップハンドラ
  const handlePhotoSkip = () => {
    // 写真撮影をスキップ（既にステータスは設定済み）
    setIsBottomSheetOpen(false);
  };

  // 写真追加ハンドラ
  const handlePhotoAdd = async (file: File) => {
    if (!onPhotoAdd) return;
    
    setIsMediaProcessing(true);
    try {
      await onPhotoAdd(item.id, file);
    } catch (error) {
      console.error("写真追加エラー:", error);
    } finally {
      setIsMediaProcessing(false);
    }
  };

  // 写真削除ハンドラ
  const handlePhotoDelete = (index: number) => {
    if (!onPhotoDelete) return;
    onPhotoDelete(item.id, index);
  };

  // 動画追加ハンドラ
  const handleVideoAdd = async (file: File) => {
    if (!onVideoAdd) return;
    
    setIsMediaProcessing(true);
    try {
      await onVideoAdd(item.id, file);
    } catch (error) {
      console.error("動画追加エラー:", error);
    } finally {
      setIsMediaProcessing(false);
    }
  };

  // 動画削除ハンドラ
  const handleVideoDelete = (index: number) => {
    if (!onVideoDelete) return;
    onVideoDelete(item.id, index);
  };

  // ステータスのアイコンを取得
  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case "good":
        return <CheckCircle2 className="h-6 w-6" />;
      case "exchange":
        return <XCircle className="h-6 w-6" />;
      case "repair":
        return <AlertTriangle className="h-6 w-6" />;
      case "adjust":
        return <Settings className="h-6 w-6" />;
      case "lubricate":
        return <Droplet className="h-6 w-6" />;
      case "tighten":
        return <Wrench className="h-6 w-6" />;
      default:
        return null;
    }
  };

  // ステータスのバリアントを取得
  const statusVariant = INSPECTION_STATUS_BADGE_VARIANTS[item.status];
  const hasStatus = item.status !== "none";

  // 写真撮影が必要なステータスかどうか（証拠写真が必要なステータス）
  const requiresPhoto = item.status === "exchange" || 
                        item.status === "repair" || 
                        item.status === "adjust" || 
                        item.status === "tighten" || 
                        item.status === "specific";
  
  // メディアUIを表示する条件：写真/動画が必要なステータス、または既にメディアがある場合
  const shouldShowMediaUI = (onPhotoAdd || onPhotoDelete || onVideoAdd || onVideoDelete) && 
                            (requiresPhoto || 
                             (item.photoUrls && item.photoUrls.length > 0) || 
                             (item.videoUrls && item.videoUrls.length > 0));


  return (
    <>
      {/* カード全体をタップ可能に（写真エリア以外） */}
      <div
        className={cn(
          "relative rounded-lg border-2 transition-all duration-200",
          // ステータスによる背景色（デザインシステム準拠）
          item.status === "good" && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
          item.status === "exchange" && "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
          item.status === "repair" && "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
          item.status === "none" && "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        {/* タップ可能なメインエリア（項目名とステータス） */}
        <button
          type="button"
          onClick={handleCardTap}
          disabled={disabled}
          className={cn(
            "w-full min-h-[72px] p-4 flex items-center justify-between",
            "text-left cursor-pointer transition-all",
            // ホバー・アクティブ効果で「タップ可能」を視覚的に示す
            !disabled && item.status === "none" && "hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-700 dark:active:bg-slate-600",
            !disabled && item.status === "good" && "hover:bg-green-100 active:bg-green-150 dark:hover:bg-green-900/30 dark:active:bg-green-900/40",
            !disabled && item.status === "exchange" && "hover:bg-red-100 active:bg-red-150 dark:hover:bg-red-900/30 dark:active:bg-red-900/40",
            !disabled && item.status === "repair" && "hover:bg-amber-100 active:bg-amber-150 dark:hover:bg-amber-900/30 dark:active:bg-amber-900/40",
            // フォーカス効果
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
            // 角丸（カードの角丸に合わせる）
            shouldShowMediaUI ? "rounded-t-lg" : "rounded-lg"
          )}
        >
          {/* 左側: 項目名 + タップヒント */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-xl font-medium text-slate-900 dark:text-white">
              {item.label}
            </span>
          </div>

          {/* 右側: ステータス表示 */}
          <div className="ml-4 shrink-0 flex items-center gap-2">
            {hasStatus ? (
              <div className="flex items-center gap-2">
                <Badge variant={statusVariant} className="text-lg font-semibold">
                  <span className="flex items-center gap-1">
                    {getStatusIcon(item.status)}
                    {INSPECTION_STATUS_LABELS[item.status]}
                  </span>
                </Badge>
                {/* 要交換・要修理・要調整の場合、見積に追加されることを表示 */}
                {(item.status === "exchange" || item.status === "repair" || item.status === "adjust") && (
                  <span className="text-base text-blue-600 font-medium dark:text-blue-400">
                    → 見積
                  </span>
                )}
              </div>
            ) : (
              /* 未入力時のヒントテキスト + 右矢印（タップ可能であることを示す） */
              <>
                <span className="text-lg text-slate-400 dark:text-slate-500">
                  タップして入力
                </span>
                <svg
                  className="h-6 w-6 text-slate-400 dark:text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </div>
        </button>

        {/* 下段: メディア（写真・動画）撮影エリア（メディアが必要なステータス、または既にメディアがある場合のみ表示） */}
        {shouldShowMediaUI && (
          <div 
            className="px-4 pb-4 pt-3 border-t border-slate-200"
            onClick={(e) => e.stopPropagation()} // メディアエリアのタップがカードに伝播しないように
          >
            <InspectionMediaButton
              photoUrls={item.photoUrls || []}
              videoUrls={item.videoUrls || []}
              videoData={item.videoData || []}
              onPhotoAdd={handlePhotoAdd}
              onVideoAdd={onVideoAdd ? handleVideoAdd : undefined}
              onPhotoDelete={handlePhotoDelete}
              onVideoDelete={onVideoDelete ? handleVideoDelete : undefined}
              disabled={disabled}
              isProcessing={isMediaProcessing}
              photoInputRef={photoInputRef}
              maxVideoDuration={15}
            />
          </div>
        )}

        {/* 完了アニメーション（オーバーレイ） */}
        {isCompleted && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg",
              "transition-opacity duration-500 pointer-events-none",
              "animate-in fade-in zoom-in"
            )}
          >
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
        )}
      </div>

      {/* ボトムシート */}
      <InspectionStatusBottomSheet
        open={isBottomSheetOpen}
        onOpenChange={setIsBottomSheetOpen}
        itemId={item.id}
        itemLabel={item.label}
        currentStatus={item.status}
        remainingItems={remainingItems}
        currentSection={currentSection}
        totalSections={totalSections}
        onStatusSelect={handleStatusSelect}
        requiresMeasurement={item.requiresMeasurement}
        measurements={measurements}
        onMeasurementsChange={onMeasurementsChange}
        requiresPhoto={!!(onPhotoAdd || onPhotoDelete)}
        onPhotoCapture={handlePhotoCapture}
        onVideoCapture={onVideoAdd ? handleVideoCapture : undefined}
        onPhotoSkip={handlePhotoSkip}
      />

      {/* 写真撮影用のinput（非表示） */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            e.target.value = "";
            await handlePhotoAdd(file);
          }
        }}
        disabled={disabled || isMediaProcessing}
      />
    </>
  );
}

