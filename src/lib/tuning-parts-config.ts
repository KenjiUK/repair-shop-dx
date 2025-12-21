/**
 * チューニング・パーツ取付系：設定
 *
 * チューニングとパーツ取付の設定を定義
 */

// =============================================================================
// 型定義
// =============================================================================

/**
 * チューニング・パーツ取付の種類
 */
export type TuningPartsType = "チューニング" | "パーツ取り付け";

/**
 * チューニング・パーツ取付の種類設定
 */
export interface TuningPartsTypeConfig {
  /** 種類名 */
  name: TuningPartsType;
  /** 説明 */
  description: string;
  /** 検査項目のカテゴリ */
  inspectionCategories: string[];
}

// =============================================================================
// 種類設定マスタ
// =============================================================================

/**
 * チューニング・パーツ取付の種類設定マスタ
 */
export const TUNING_PARTS_TYPE_CONFIGS: Record<TuningPartsType, TuningPartsTypeConfig> = {
  チューニング: {
    name: "チューニング",
    description: "社外品などのカスタム",
    inspectionCategories: ["エンジン", "サスペンション", "エキゾースト", "その他"],
  },
  "パーツ取り付け": {
    name: "パーツ取り付け",
    description: "ナビとか純正・付属品を取り付けたり",
    inspectionCategories: ["エレクトロニクス", "外装", "内装", "その他"],
  },
};

/**
 * 種類一覧を取得
 */
export function getTuningPartsTypeList(): TuningPartsType[] {
  return Object.keys(TUNING_PARTS_TYPE_CONFIGS) as TuningPartsType[];
}

/**
 * 種類設定を取得
 */
export function getTuningPartsTypeConfig(
  type: TuningPartsType
): TuningPartsTypeConfig | undefined {
  return TUNING_PARTS_TYPE_CONFIGS[type];
}









