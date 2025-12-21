/**
 * その他のメンテナンス系：メニュー設定マスタ
 *
 * 各メンテナンスメニューの設定を定義
 */

// =============================================================================
// 型定義
// =============================================================================

/**
 * メンテナンスメニュー種別
 */
export type MaintenanceType =
  | "バッテリー交換"
  | "ブレーキフルード交換"
  | "エアフィルター交換"
  | "クーラント交換"
  | "スパークプラグ交換"
  | "ベルト類交換"
  | "ワイパー交換"
  | "ブレーキパッド交換"
  | "ブレーキローター交換"
  | "オイルフィルター交換"
  | "キャビンフィルター交換"
  | "ラジエーターキャップ交換";

/**
 * 検査項目
 */
export interface MaintenanceInspectionItem {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** カテゴリ */
  category: string;
  /** 必須か */
  required: boolean;
}

/**
 * 測定値フィールド
 */
export interface MaintenanceMeasurementField {
  /** フィールドID */
  id: string;
  /** フィールド名 */
  name: string;
  /** 単位 */
  unit: string;
  /** 必須か */
  required: boolean;
}

/**
 * メンテナンスメニュー設定
 */
export interface MaintenanceMenuConfig {
  /** メニュー名 */
  name: MaintenanceType;
  /** 所要時間（分） */
  duration: number;
  /** 検査項目 */
  inspectionItems: Omit<MaintenanceInspectionItem, "required">[];
  /** 測定値フィールド */
  measurementFields: Omit<MaintenanceMeasurementField, "required">[];
  /** 写真撮影が必要か */
  requiresPhoto: boolean;
  /** 部品が必要か */
  requiresParts: boolean;
}

// =============================================================================
// メニュー設定マスタ
// =============================================================================

/**
 * メンテナンスメニュー設定マスタ
 */
export const MAINTENANCE_MENU_CONFIGS: Record<MaintenanceType, MaintenanceMenuConfig> = {
  "バッテリー交換": {
    name: "バッテリー交換",
    duration: 60,
    inspectionItems: [
      { id: "battery-1", name: "バッテリー電圧", category: "battery" },
      { id: "battery-2", name: "端子の状態", category: "battery" },
      { id: "battery-3", name: "充電状態", category: "battery" },
    ],
    measurementFields: [
      { id: "voltage", name: "電圧", unit: "V" },
      { id: "cca", name: "CCA", unit: "A" },
    ],
    requiresPhoto: true,
    requiresParts: true,
  },
  "ブレーキフルード交換": {
    name: "ブレーキフルード交換",
    duration: 60,
    inspectionItems: [
      { id: "brake-fluid-1", name: "フルードの色", category: "brake_fluid" },
      { id: "brake-fluid-2", name: "フルードの量", category: "brake_fluid" },
      { id: "brake-fluid-3", name: "汚れ具合", category: "brake_fluid" },
      { id: "brake-fluid-4", name: "水分含有率", category: "brake_fluid" },
    ],
    measurementFields: [
      { id: "moisture", name: "水分含有率", unit: "%" },
      { id: "boiling_point", name: "沸点", unit: "℃" },
    ],
    requiresPhoto: true,
    requiresParts: true,
  },
  "エアフィルター交換": {
    name: "エアフィルター交換",
    duration: 30,
    inspectionItems: [
      { id: "air-filter-1", name: "フィルターの汚れ具合", category: "air_filter" },
      { id: "air-filter-2", name: "目詰まり", category: "air_filter" },
    ],
    measurementFields: [],
    requiresPhoto: true,
    requiresParts: true,
  },
  "クーラント交換": {
    name: "クーラント交換",
    duration: 120,
    inspectionItems: [
      { id: "coolant-1", name: "冷却水の色", category: "coolant" },
      { id: "coolant-2", name: "冷却水の量", category: "coolant" },
      { id: "coolant-3", name: "汚れ具合", category: "coolant" },
      { id: "coolant-4", name: "凍結防止性能", category: "coolant" },
    ],
    measurementFields: [
      { id: "freezing_point", name: "凍結防止性能", unit: "℃" },
      { id: "ph", name: "pH値", unit: "" },
    ],
    requiresPhoto: true,
    requiresParts: true,
  },
  "スパークプラグ交換": {
    name: "スパークプラグ交換",
    duration: 120,
    inspectionItems: [
      { id: "spark-plug-1", name: "プラグの状態", category: "spark_plug" },
      { id: "spark-plug-2", name: "ギャップ", category: "spark_plug" },
      { id: "spark-plug-3", name: "焼け具合", category: "spark_plug" },
    ],
    measurementFields: [
      { id: "gap", name: "ギャップ", unit: "mm" },
      { id: "resistance", name: "抵抗値", unit: "Ω" },
    ],
    requiresPhoto: true,
    requiresParts: true,
  },
  "ベルト類交換": {
    name: "ベルト類交換",
    duration: 180,
    inspectionItems: [
      { id: "belt-1", name: "ベルトのひび割れ", category: "belt" },
      { id: "belt-2", name: "張り具合", category: "belt" },
      { id: "belt-3", name: "摩耗", category: "belt" },
    ],
    measurementFields: [
      { id: "tension", name: "張力", unit: "N" },
      { id: "crack_count", name: "ひび割れの本数", unit: "本" },
    ],
    requiresPhoto: true,
    requiresParts: true,
  },
  "ワイパー交換": {
    name: "ワイパー交換",
    duration: 30,
    inspectionItems: [
      { id: "wiper-1", name: "ワイパーの劣化状態", category: "wiper" },
      { id: "wiper-2", name: "拭き取り性能", category: "wiper" },
    ],
    measurementFields: [],
    requiresPhoto: true,
    requiresParts: true,
  },
  "ブレーキパッド交換": {
    name: "ブレーキパッド交換",
    duration: 120,
    inspectionItems: [
      { id: "brake-pad-1", name: "パッドの残量", category: "brake_pad" },
      { id: "brake-pad-2", name: "ローターの状態", category: "brake_pad" },
      { id: "brake-pad-3", name: "異音の有無", category: "brake_pad" },
    ],
    measurementFields: [
      { id: "pad_thickness", name: "パッド残量", unit: "mm" },
      { id: "rotor_thickness", name: "ローターの厚み", unit: "mm" },
    ],
    requiresPhoto: true,
    requiresParts: true,
  },
  "ブレーキローター交換": {
    name: "ブレーキローター交換",
    duration: 120,
    inspectionItems: [
      { id: "brake-rotor-1", name: "ローターの摩耗", category: "brake_rotor" },
      { id: "brake-rotor-2", name: "ローターの歪み", category: "brake_rotor" },
      { id: "brake-rotor-3", name: "スコアリング", category: "brake_rotor" },
    ],
    measurementFields: [
      { id: "rotor_thickness", name: "ローターの厚み", unit: "mm" },
      { id: "warp", name: "歪み", unit: "mm" },
    ],
    requiresPhoto: true,
    requiresParts: true,
  },
  "オイルフィルター交換": {
    name: "オイルフィルター交換",
    duration: 30,
    inspectionItems: [
      { id: "oil-filter-1", name: "フィルターの汚れ具合", category: "oil_filter" },
      { id: "oil-filter-2", name: "目詰まり", category: "oil_filter" },
    ],
    measurementFields: [],
    requiresPhoto: true,
    requiresParts: true,
  },
  "キャビンフィルター交換": {
    name: "キャビンフィルター交換",
    duration: 30,
    inspectionItems: [
      { id: "cabin-filter-1", name: "フィルターの汚れ具合", category: "cabin_filter" },
      { id: "cabin-filter-2", name: "目詰まり", category: "cabin_filter" },
      { id: "cabin-filter-3", name: "臭い", category: "cabin_filter" },
    ],
    measurementFields: [],
    requiresPhoto: true,
    requiresParts: true,
  },
  "ラジエーターキャップ交換": {
    name: "ラジエーターキャップ交換",
    duration: 10,
    inspectionItems: [
      { id: "radiator-cap-1", name: "キャップの劣化", category: "radiator_cap" },
      { id: "radiator-cap-2", name: "シールの状態", category: "radiator_cap" },
    ],
    measurementFields: [
      { id: "pressure", name: "圧力", unit: "kPa" },
    ],
    requiresPhoto: true,
    requiresParts: true,
  },
};

/**
 * メニュー一覧を取得
 */
export function getMaintenanceMenuList(): MaintenanceType[] {
  return Object.keys(MAINTENANCE_MENU_CONFIGS) as MaintenanceType[];
}

/**
 * メニュー設定を取得
 */
export function getMaintenanceMenuConfig(
  menuType: MaintenanceType
): MaintenanceMenuConfig | undefined {
  return MAINTENANCE_MENU_CONFIGS[menuType];
}

/**
 * メニュー名から所要時間を取得
 */
export function getMaintenanceDuration(menuType: MaintenanceType): number {
  return MAINTENANCE_MENU_CONFIGS[menuType]?.duration || 60;
}









