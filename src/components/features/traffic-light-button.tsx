"use client";

import { CheckCircle2, AlertCircle, XCircle, Wrench, Brush, SkipForward, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiagnosisStatus } from "@/types";

// =============================================================================
// 型定義
// =============================================================================

/**
 * 信号機ボタンの状態（拡張版）
 */
export type TrafficLightStatus =
  | DiagnosisStatus // OK, 注意, 要交換, 未チェック
  | "adjust" // 調整
  | "clean" // 清掃
  | "skip" // 省略
  | "not_applicable"; // 該当なし

// =============================================================================
// Props
// =============================================================================

interface TrafficLightButtonProps {
  /** 状態 */
  status: TrafficLightStatus;
  /** 現在選択されている状態 */
  currentStatus: TrafficLightStatus;
  /** クリックハンドラ */
  onClick: () => void;
  /** 無効化 */
  disabled?: boolean;
  /** サイズ */
  size?: "sm" | "md" | "lg";
  /** 表示ラベル */
  showLabel?: boolean;
}

// =============================================================================
// 設定
// =============================================================================

/**
 * 形状タイプ（カラーユニバーサルデザイン対応）
 * 色だけに依存せず、形状でも区別できるようにする
 */
type ShapeType = "circle" | "square" | "triangle" | "diamond" | "hexagon";

const STATUS_CONFIG: Record<
  TrafficLightStatus,
  {
    icon: typeof CheckCircle2;
    label: string;
    bgActive: string;
    bgInactive: string;
    textActive: string;
    textInactive: string;
    shape: ShapeType; // カラーユニバーサルデザイン対応：形状
    borderStyle?: string; // カラーユニバーサルデザイン対応：境界線スタイル
  }
> = {
  green: {
    icon: CheckCircle2,
    label: "OK",
    bgActive: "bg-green-500",
    bgInactive: "bg-green-100 hover:bg-green-200",
    textActive: "text-white",
    textInactive: "text-green-700",
    shape: "circle", // 円形：正常状態
    borderStyle: "border-2 border-green-600",
  },
  yellow: {
    icon: AlertCircle,
    label: "注意",
    bgActive: "bg-amber-500", // yellow → amber (40歳以上ユーザー向け、統一)
    bgInactive: "bg-amber-100 hover:bg-amber-200", // yellow → amber
    textActive: "text-white",
    textInactive: "text-amber-900", // text-yellow-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
    shape: "triangle", // 三角形：注意状態
    borderStyle: "border-2 border-amber-600 border-dashed", // yellow → amber
  },
  red: {
    icon: XCircle,
    label: "要交換",
    bgActive: "bg-red-500",
    bgInactive: "bg-red-100 hover:bg-red-200",
    textActive: "text-white",
    textInactive: "text-red-700",
    shape: "square", // 四角形：要対応状態
    borderStyle: "border-2 border-red-600 border-double",
  },
  unchecked: {
    icon: AlertCircle,
    label: "",
    bgActive: "",
    bgInactive: "bg-slate-100 hover:bg-slate-200",
    textActive: "",
    textInactive: "text-slate-700", // text-slate-600 → text-slate-700 (40歳以上ユーザー向け、コントラスト向上)
    shape: "circle",
    borderStyle: "border border-slate-300 border-dotted",
  },
  adjust: {
    icon: Wrench,
    label: "調整",
    bgActive: "bg-blue-500",
    bgInactive: "bg-blue-100 hover:bg-blue-200",
    textActive: "text-white",
    textInactive: "text-blue-700",
    shape: "hexagon", // 六角形：調整
    borderStyle: "border-2 border-blue-600",
  },
  clean: {
    icon: Brush,
    label: "清掃",
    bgActive: "bg-cyan-500",
    bgInactive: "bg-cyan-100 hover:bg-cyan-200",
    textActive: "text-white",
    textInactive: "text-cyan-700",
    shape: "diamond", // ダイヤモンド形：清掃
    borderStyle: "border-2 border-cyan-600",
  },
  skip: {
    icon: SkipForward,
    label: "省略",
    bgActive: "bg-slate-500",
    bgInactive: "bg-slate-100 hover:bg-slate-200",
    textActive: "text-white",
    textInactive: "text-slate-700", // text-slate-600 → text-slate-700 (40歳以上ユーザー向け、コントラスト向上)
    shape: "circle",
    borderStyle: "border border-slate-500 border-dashed",
  },
  not_applicable: {
    icon: Minus,
    label: "該当なし",
    bgActive: "bg-slate-500",
    bgInactive: "bg-slate-100 hover:bg-slate-200",
    textActive: "text-white",
    textInactive: "text-slate-700", // text-slate-600 → text-slate-700 (40歳以上ユーザー向け、コントラスト向上)
    shape: "square",
    borderStyle: "border border-slate-500",
  },
};

const SIZE_CONFIG = {
  sm: {
    height: "h-10", // h-8 (32px) → h-10 (40px) (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠。デスクトップのみ、最小限の使用)
    iconSize: "h-4 w-4", // h-3 w-3 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠)
    textSize: "text-base", // text-xs → text-base (40歳以上ユーザー向け)
  },
  md: {
    height: "h-12",
    iconSize: "h-4 w-4",
    textSize: "text-base", // text-xs → text-base (40歳以上ユーザー向け)
  },
  lg: {
    height: "h-16",
    iconSize: "h-5 w-5",
    textSize: "text-base", // text-sm → text-base (40歳以上ユーザー向け)
  },
};

// =============================================================================
// Component
// =============================================================================

export function TrafficLightButton({
  status,
  currentStatus,
  onClick,
  disabled = false,
  size = "md",
  showLabel = true,
}: TrafficLightButtonProps) {
  // 未チェック状態は表示しない（オプション）
  if (status === "unchecked") {
    return null;
  }

  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const isSelected = currentStatus === status;
  const {
    icon: Icon,
    label,
    bgActive,
    bgInactive,
    textActive,
    textInactive,
    shape,
    borderStyle,
  } = config;

  // 形状に応じた角丸クラスを取得（カラーユニバーサルデザイン対応）
  const getShapeClass = (shapeType: ShapeType): string => {
    switch (shapeType) {
      case "circle":
        return "rounded-full"; // 完全な円形
      case "square":
        return "rounded-sm"; // 角が少し丸い四角形
      case "triangle":
        return "rounded-t-lg"; // 上部が丸い三角形風
      case "diamond":
        return "rounded-sm rotate-45"; // ダイヤモンド形（回転）
      case "hexagon":
        return "rounded-lg"; // 六角形風（角丸）
      default:
        return "rounded-lg";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 transition-all active:scale-95",
        "flex items-center justify-center gap-1",
        sizeConfig.height,
        getShapeClass(shape), // カラーユニバーサルデザイン対応：形状
        isSelected ? bgActive : bgInactive,
        isSelected ? textActive : textInactive,
        borderStyle, // カラーユニバーサルデザイン対応：境界線
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && !isSelected && "hover:opacity-80"
      )}
      aria-label={`${label}（${getShapeDescription(shape)}）`} // スクリーンリーダー用に形状も説明
      aria-pressed={isSelected}
      title={`${label} - 形状: ${getShapeDescription(shape)}`} // ツールチップに形状情報を追加
    >
      <Icon className={sizeConfig.iconSize} aria-hidden="true" />
      {showLabel && label && (
        <span className={cn("font-medium", sizeConfig.textSize)}>{label}</span>
      )}
    </button>
  );
}

/**
 * 形状の説明を取得（アクセシビリティ対応）
 */
function getShapeDescription(shape: ShapeType): string {
  switch (shape) {
    case "circle":
      return "円形";
    case "square":
      return "四角形";
    case "triangle":
      return "三角形";
    case "diamond":
      return "ダイヤモンド形";
    case "hexagon":
      return "六角形";
    default:
      return "";
  }
}

/**
 * 信号機ボタングループ
 * 複数の状態ボタンを横並びに表示
 */
interface TrafficLightButtonGroupProps {
  /** 現在選択されている状態 */
  currentStatus: TrafficLightStatus;
  /** 状態変更ハンドラ */
  onStatusChange: (status: TrafficLightStatus) => void;
  /** 表示する状態のリスト */
  availableStatuses?: TrafficLightStatus[];
  /** 無効化 */
  disabled?: boolean;
  /** サイズ */
  size?: "sm" | "md" | "lg";
  /** 表示ラベル */
  showLabel?: boolean;
}

export function TrafficLightButtonGroup({
  currentStatus,
  onStatusChange,
  availableStatuses = ["green", "yellow", "red"],
  disabled = false,
  size = "md",
  showLabel = true,
}: TrafficLightButtonGroupProps) {
  return (
    <div className="flex gap-2">
      {availableStatuses.map((status) => (
        <TrafficLightButton
          key={status}
          status={status}
          currentStatus={currentStatus}
          onClick={() => onStatusChange(status)}
          disabled={disabled}
          size={size}
          showLabel={showLabel}
        />
      ))}
    </div>
  );
}
