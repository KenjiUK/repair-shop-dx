/**
 * コーティング系：設定
 *
 * コーティングの種類とオプションサービスの設定を定義
 */

// =============================================================================
// 型定義
// =============================================================================

/**
 * コーティングの種類
 */
export type CoatingType = "ハイモースコート エッジ" | "ハイモースコート グロウ" | "ガードグレイズ";

/**
 * コーティングオプションID
 */
export type CoatingOptionId =
  | "wheel-coating"
  | "window-water-repellent"
  | "headlight-polish"
  | "interior-cleaning"
  | "bumper-coat"
  | "window-film"
  | "convertible-top-coating";

/**
 * コーティングの種類設定
 */
export interface CoatingTypeConfig {
  /** 種類名 */
  name: CoatingType;
  /** 参考価格（最小値、車両の寸法によって変動） */
  basePrice: number;
  /** 説明 */
  description?: string;
}

/**
 * コーティングオプション設定
 */
export interface CoatingOptionConfig {
  /** オプションID */
  id: CoatingOptionId;
  /** オプション名 */
  name: string;
  /** 通常価格 */
  regularPrice: number;
  /** 同時施工価格（10％割引） */
  simultaneousPrice: number;
  /** 説明 */
  description?: string;
}

// =============================================================================
// コーティング種類設定マスタ
// =============================================================================

/**
 * コーティングの種類設定マスタ
 */
export const COATING_TYPE_CONFIGS: Record<CoatingType, CoatingTypeConfig> = {
  "ハイモースコート エッジ": {
    name: "ハイモースコート エッジ",
    basePrice: 88000,
    description: "参考価格 ¥88,000～（車両の寸法によって金額が変動）",
  },
  "ハイモースコート グロウ": {
    name: "ハイモースコート グロウ",
    basePrice: 88000,
    description: "参考価格 ¥88,000～（車両の寸法によって金額が変動）",
  },
  "ガードグレイズ": {
    name: "ガードグレイズ",
    basePrice: 81400,
    description: "¥81,400～（車両の寸法によって金額が変動）",
  },
};

// =============================================================================
// オプションサービス設定マスタ
// =============================================================================

/**
 * コーティングオプション設定マスタ
 */
export const COATING_OPTION_CONFIGS: Record<CoatingOptionId, CoatingOptionConfig> = {
  "wheel-coating": {
    id: "wheel-coating",
    name: "ホイールコーティング（4本セット）",
    regularPrice: 26400,
    simultaneousPrice: 23760, // 10%割引
    description: "4本セット",
  },
  "window-water-repellent": {
    id: "window-water-repellent",
    name: "ウィンドウ撥水（フロント三面）",
    regularPrice: 25000,
    simultaneousPrice: 22500, // 10%割引
    description: "フロント三面",
  },
  "headlight-polish": {
    id: "headlight-polish",
    name: "ヘッドライト研磨・クリアコート（左右2個）",
    regularPrice: 66000,
    simultaneousPrice: 59400, // 10%割引
    description: "左右2個",
  },
  "interior-cleaning": {
    id: "interior-cleaning",
    name: "インテリアクリーニング",
    regularPrice: 39000,
    simultaneousPrice: 35100, // 10%割引
    description: "車内クリーニング",
  },
  "bumper-coat": {
    id: "bumper-coat",
    name: "バンパーコート（1本）",
    regularPrice: 15000,
    simultaneousPrice: 13500, // 10%割引
    description: "1本",
  },
  "window-film": {
    id: "window-film",
    name: "ウィンドウフィルム（1面、前面・前側面不可）",
    regularPrice: 24000,
    simultaneousPrice: 21600, // 10%割引
    description: "1面（前面・前側面不可）",
  },
  "convertible-top-coating": {
    id: "convertible-top-coating",
    name: "幌コーティング",
    regularPrice: 48000,
    simultaneousPrice: 43200, // 10%割引
    description: "コンバーチブルトップのコーティング",
  },
};

/**
 * コーティング種類一覧を取得
 */
export function getCoatingTypeList(): CoatingType[] {
  return Object.keys(COATING_TYPE_CONFIGS) as CoatingType[];
}

/**
 * コーティング種類設定を取得
 */
export function getCoatingTypeConfig(
  type: CoatingType
): CoatingTypeConfig | undefined {
  return COATING_TYPE_CONFIGS[type];
}

/**
 * オプション一覧を取得
 */
export function getCoatingOptionList(): CoatingOptionConfig[] {
  return Object.values(COATING_OPTION_CONFIGS);
}

/**
 * オプション設定を取得
 */
export function getCoatingOptionConfig(
  optionId: CoatingOptionId
): CoatingOptionConfig | undefined {
  return COATING_OPTION_CONFIGS[optionId];
}

/**
 * 同時施工の場合のオプション価格を計算
 */
export function calculateOptionPrice(
  optionId: CoatingOptionId,
  isSimultaneous: boolean
): number {
  const config = getCoatingOptionConfig(optionId);
  if (!config) return 0;
  return isSimultaneous ? config.simultaneousPrice : config.regularPrice;
}

/**
 * 選択されたオプションの合計金額を計算
 */
export function calculateOptionsTotal(
  selectedOptionIds: CoatingOptionId[],
  isSimultaneous: boolean
): number {
  return selectedOptionIds.reduce((total, optionId) => {
    return total + calculateOptionPrice(optionId, isSimultaneous);
  }, 0);
}









