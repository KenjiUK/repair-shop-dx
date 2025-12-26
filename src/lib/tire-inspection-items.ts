/**
 * タイヤ交換・ローテーション用の簡易検査項目
 *
 * タイヤ交換・ローテーション時の簡易検査項目（3カテゴリ）と測定値を定義
 */

// =============================================================================
// 型定義
// =============================================================================

export type TireInspectionStatus = "ok" | "attention" | "replace" | "unchecked";

export interface TireInspectionItem {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** カテゴリ */
  category: "tire" | "pressure" | "wheel";
  /** 状態 */
  status: TireInspectionStatus;
  /** コメント */
  comment?: string;
  /** 写真URLリスト */
  photoUrls?: string[];
}

/**
 * タイヤ溝深さ測定値（前後左右）
 */
export interface TireTreadDepth {
  /** 前左 */
  frontLeft: number | null; // mm
  /** 前右 */
  frontRight: number | null; // mm
  /** 後左 */
  rearLeft: number | null; // mm
  /** 後右 */
  rearRight: number | null; // mm
}

/**
 * 空気圧測定値（前後左右）
 */
export interface TirePressure {
  /** 前左 */
  frontLeft: number | null; // kPa
  /** 前右 */
  frontRight: number | null; // kPa
  /** 後左 */
  rearLeft: number | null; // kPa
  /** 後右 */
  rearRight: number | null; // kPa
}

/**
 * 推奨空気圧（車両情報から取得）
 */
export interface RecommendedPressure {
  /** 前輪推奨空気圧 */
  front: number | null; // kPa
  /** 後輪推奨空気圧 */
  rear: number | null; // kPa
}

// =============================================================================
// 検査項目データ
// =============================================================================

/**
 * タイヤ交換・ローテーション用の簡易検査項目（3カテゴリ）
 */
export const TIRE_INSPECTION_ITEMS: Omit<TireInspectionItem, "status" | "comment" | "photoUrls">[] = [
  // カテゴリ1: タイヤの状態確認
  {
    id: "tire-1",
    name: "タイヤの溝の深さ",
    category: "tire",
  },
  {
    id: "tire-2",
    name: "タイヤの摩耗状態",
    category: "tire",
  },
  {
    id: "tire-3",
    name: "タイヤの損傷",
    category: "tire",
  },
  {
    id: "tire-4",
    name: "タイヤの製造年（DOT表示）",
    category: "tire",
  },
  // カテゴリ2: 空気圧の確認
  {
    id: "pressure-1",
    name: "前後左右の空気圧",
    category: "pressure",
  },
  {
    id: "pressure-2",
    name: "推奨空気圧との比較",
    category: "pressure",
  },
  {
    id: "pressure-3",
    name: "空気圧の均一性",
    category: "pressure",
  },
  // カテゴリ3: ホイールの状態確認
  {
    id: "wheel-1",
    name: "ホイールの損傷",
    category: "wheel",
  },
  {
    id: "wheel-2",
    name: "ホイールナットの緩み",
    category: "wheel",
  },
  {
    id: "wheel-3",
    name: "ホイールバランスの状態",
    category: "wheel",
  },
];

/**
 * 初期状態の検査項目を取得
 */
export function getInitialTireInspectionItems(): TireInspectionItem[] {
  return TIRE_INSPECTION_ITEMS.map((item) => ({
    ...item,
    status: "unchecked" as TireInspectionStatus,
    photoUrls: [],
  }));
}

/**
 * 状態の表示テキストを取得
 */
export function getTireInspectionStatusText(status: TireInspectionStatus): string {
  const statusTexts: Record<TireInspectionStatus, string> = {
    ok: "OK",
    attention: "注意",
    replace: "要交換",
    unchecked: "未チェック",
  };
  return statusTexts[status] || status;
}

/**
 * カテゴリの表示名を取得
 */
export function getTireInspectionCategoryName(category: TireInspectionItem["category"]): string {
  const categoryNames: Record<TireInspectionItem["category"], string> = {
    tire: "タイヤの状態確認",
    pressure: "空気圧の確認",
    wheel: "ホイールの状態確認",
  };
  return categoryNames[category] || category;
}

/**
 * 法定基準値（タイヤ溝深さ）
 * 設定値から取得、設定値がない場合はデフォルト値を使用
 */
export function getLegalTreadDepthThreshold(): number {
  try {
    const { getNumericalMasterConfig } = require("@/lib/numerical-master-config");
    const config = getNumericalMasterConfig();
    return config.thresholds.tireInspection.legalThreshold;
  } catch {
    return 1.6; // フォールバック: デフォルト値
  }
}

/**
 * 推奨基準値（タイヤ溝深さ）
 * 設定値から取得、設定値がない場合はデフォルト値を使用
 */
export function getRecommendedTreadDepthThreshold(): number {
  try {
    const { getNumericalMasterConfig } = require("@/lib/numerical-master-config");
    const config = getNumericalMasterConfig();
    return config.thresholds.tireInspection.recommendedThreshold;
  } catch {
    return 3.0; // フォールバック: デフォルト値
  }
}

/**
 * 法定基準値（タイヤ溝深さ）
 * @deprecated getLegalTreadDepthThreshold() を使用してください
 */
export const LEGAL_TREAD_DEPTH_THRESHOLD = 1.6; // mm

/**
 * 推奨基準値（タイヤ溝深さ）
 * @deprecated getRecommendedTreadDepthThreshold() を使用してください
 */
export const RECOMMENDED_TREAD_DEPTH_THRESHOLD = 3.0; // mm









