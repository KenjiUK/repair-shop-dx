/**
 * エンジンオイル交換用の簡易検査項目
 *
 * エンジンオイル交換時の簡易検査項目（3項目）を定義
 */

// =============================================================================
// 型定義
// =============================================================================

export type EngineOilInspectionStatus = "ok" | "attention" | "replace" | "unchecked";

export interface EngineOilInspectionItem {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** 状態 */
  status: EngineOilInspectionStatus;
  /** コメント */
  comment?: string;
  /** 写真URLリスト */
  photoUrls?: string[];
}

// =============================================================================
// 検査項目データ
// =============================================================================

/**
 * エンジンオイル交換用の簡易検査項目（3項目）
 */
export const ENGINE_OIL_INSPECTION_ITEMS: Omit<EngineOilInspectionItem, "status" | "comment" | "photoUrls">[] = [
  {
    id: "engine-oil-1",
    name: "エンジンオイルの状態",
  },
  {
    id: "engine-oil-2",
    name: "オイルフィルターの状態",
  },
  {
    id: "engine-oil-3",
    name: "エンジンルームの清掃状態",
  },
];

/**
 * 初期状態の検査項目を取得
 */
export function getInitialEngineOilInspectionItems(): EngineOilInspectionItem[] {
  return ENGINE_OIL_INSPECTION_ITEMS.map((item) => ({
    ...item,
    status: "unchecked" as EngineOilInspectionStatus,
    photoUrls: [],
  }));
}

/**
 * 状態の表示テキストを取得
 */
export function getEngineOilInspectionStatusText(status: EngineOilInspectionStatus): string {
  const statusTexts: Record<EngineOilInspectionStatus, string> = {
    ok: "OK",
    attention: "注意",
    replace: "要交換",
    unchecked: "未チェック",
  };
  return statusTexts[status] || status;
}















