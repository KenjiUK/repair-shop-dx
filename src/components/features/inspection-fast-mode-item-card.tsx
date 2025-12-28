"use client";

/**
 * 高速点検モード用 検査項目カードコンポーネント
 * 
 * 改善提案: docs/INSPECTION_FAST_MODE_UX_PROPOSAL.md
 * 
 * 特徴:
 * - タップ = 良好（レ）→ 自動で次へ
 * - 長押し = 詳細メニュー
 * - シンプルなリスト形式
 * - ハプティックフィードバック
 */

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  InspectionItemRedesign,
  InspectionStatus,
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_NAMES,
  INSPECTION_STATUS_BADGE_VARIANTS,
} from "@/types/inspection-redesign";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  Droplet,
  Wrench,
} from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface InspectionFastModeItemCardProps {
  /** 検査項目 */
  item: InspectionItemRedesign;
  /** ステータス変更ハンドラ */
  onStatusChange: (itemId: string, status: InspectionStatus) => void;
  /** 次の項目へスクロールするハンドラ */
  onNext?: () => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 高速点検モード用の検査項目カード
 * 
 * 通常タップ: 良好（レ）を入力して自動で次へ
 * 長押し: 詳細メニュー（全ステータス選択可能）
 */
export function InspectionFastModeItemCard({
  item,
  onStatusChange,
  onNext,
  disabled = false,
}: InspectionFastModeItemCardProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 完了アニメーションをリセット
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        setIsCompleted(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  // 通常タップ: 良好（レ）を入力
  const handleTap = () => {
    if (disabled) return;

    // 良好（レ）を入力
    onStatusChange(item.id, "good");
    
    // ハプティックフィードバック（軽い振動）
    triggerHapticFeedback("light");
    
    // 完了アニメーション
    setIsCompleted(true);
    
    // 次の項目へスクロール（少し遅延を入れてアニメーションを見せる）
    setTimeout(() => {
      onNext?.();
    }, 100);
  };

  // 長押し開始
  const handleTouchStart = () => {
    if (disabled) return;

    longPressTimerRef.current = setTimeout(() => {
      // 長押し検出（500ms）
      triggerHapticFeedback("medium");
      setIsMenuOpen(true);
    }, 500);
  };

  // 長押しキャンセル
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // ステータス変更ハンドラ（メニューから）
  const handleStatusSelect = (status: InspectionStatus) => {
    onStatusChange(item.id, status);
    
    // ハプティックフィードバック（異常時はやや長め）
    if (status === "exchange" || status === "repair") {
      triggerHapticFeedback("warning");
    } else {
      triggerHapticFeedback("medium");
    }
    
    // メニューを閉じる
    setIsMenuOpen(false);
    
    // 次の項目へスクロール
    setTimeout(() => {
      onNext?.();
    }, 100);
  };

  // ステータスのアイコンを取得
  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case "good":
        return <CheckCircle2 className="h-4 w-4" />;
      case "exchange":
        return <XCircle className="h-4 w-4" />;
      case "repair":
        return <AlertTriangle className="h-4 w-4" />;
      case "adjust":
        return <Settings className="h-4 w-4" />;
      case "lubricate":
        return <Droplet className="h-4 w-4" />;
      case "tighten":
        return <Wrench className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // ステータスのバリアントを取得
  const statusVariant = INSPECTION_STATUS_BADGE_VARIANTS[item.status];
  const hasStatus = item.status !== "none";

  return (
    <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <PopoverTrigger asChild>
        <div
          ref={cardRef}
          className={cn(
            "relative flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200",
            "active:scale-[0.98] active:bg-slate-50 cursor-pointer",
            // ステータスによる背景色
            item.status === "good" && "bg-green-50 border-green-300",
            item.status === "exchange" && "bg-red-50 border-red-300",
            item.status === "repair" && "bg-amber-50 border-amber-300",
            item.status === "none" && "bg-white border-slate-200 hover:border-slate-300",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
          onClick={(e) => {
            // メニューが開いている場合は閉じるだけ
            if (isMenuOpen) {
              setIsMenuOpen(false);
              return;
            }
            // 通常のタップ処理
            handleTap();
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={(e) => {
            // マウスでも長押しを検出（右クリックは除外）
            if (e.button === 0) {
              handleTouchStart();
            }
          }}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
        >
          {/* 左側: 項目名 */}
          <div className="flex-1 min-w-0">
            <span className="text-base font-medium text-slate-900">
              {item.label}
            </span>
          </div>

          {/* 右側: ステータス表示 */}
          <div className="ml-4 shrink-0 flex items-center gap-2">
            {hasStatus && (
              <Badge variant={statusVariant} className="text-sm font-semibold">
                <span className="flex items-center gap-1">
                  {getStatusIcon(item.status)}
                  {INSPECTION_STATUS_LABELS[item.status]}
                </span>
              </Badge>
            )}
          </div>

          {/* 完了アニメーション（オーバーレイ） */}
          {isCompleted && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg",
                "transition-opacity duration-500 pointer-events-none",
                "animate-in fade-in zoom-in"
              )}
            >
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          )}

        </div>
      </PopoverTrigger>

      {/* ステータス選択メニュー（長押しで表示） */}
      <PopoverContent 
        className="w-56 p-2" 
        align="start"
        onInteractOutside={(e) => {
          // メニュー外をクリックしたら閉じる
          setIsMenuOpen(false);
        }}
      >
        <div className="px-2 py-1.5 text-sm font-semibold text-slate-700 border-b border-slate-200 mb-1">
          ステータスを選択
        </div>
        
        <div className="grid grid-cols-2 gap-1">
          {/* 良好（レ）- 最頻繁に使用 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("good")}
            className="h-10 justify-start"
          >
            <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
            <span>良好（レ）</span>
          </Button>

          {/* その他のステータス */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("exchange")}
            className="h-10 justify-start"
          >
            <XCircle className="h-4 w-4 text-red-600 mr-2" />
            <span>交換（×）</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("adjust")}
            className="h-10 justify-start"
          >
            <Settings className="h-4 w-4 text-amber-600 mr-2" />
            <span>調整（A）</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("tighten")}
            className="h-10 justify-start"
          >
            <Wrench className="h-4 w-4 text-blue-600 mr-2" />
            <span>締付（T）</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("clean")}
            className="h-10 justify-start"
          >
            <span>清掃（C）</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("lubricate")}
            className="h-10 justify-start"
          >
            <Droplet className="h-4 w-4 text-blue-600 mr-2" />
            <span>給油（L）</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("repair")}
            className="h-10 justify-start"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
            <span>修理（△）</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("specific")}
            className="h-10 justify-start"
          >
            <span>特定整備（○）</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("omit")}
            className="h-10 justify-start"
          >
            <span>省略（P）</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusSelect("none")}
            className="h-10 justify-start"
          >
            <span>該当なし（／）</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

