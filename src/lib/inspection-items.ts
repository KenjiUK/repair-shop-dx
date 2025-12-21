/**
 * 車検・12ヵ月点検用の検査項目データ
 *
 * PDFテンプレート（24か月点検用テンプレート.pdf）に基づく検査項目定義
 */

import { DiagnosisStatus } from "@/types";

// =============================================================================
// 型定義
// =============================================================================

/**
 * 検査項目カテゴリ
 */
export type InspectionCategory =
  | "engine_room" // エンジン・ルーム点検
  | "interior" // 室内点検
  | "chassis" // 足廻り点検
  | "underbody" // 下廻り点検
  | "exterior" // 外廻り点検
  | "daily" // 日常点検
  | "other"; // その他

/**
 * カテゴリの表示名
 */
export const CATEGORY_DISPLAY_NAMES: Record<InspectionCategory, string> = {
  engine_room: "エンジン・ルーム点検",
  interior: "室内点検",
  chassis: "足廻り点検",
  underbody: "下廻り点検",
  exterior: "外廻り点検",
  daily: "日常点検",
  other: "その他",
};

/**
 * カテゴリのアイコン（Lucideアイコン名）
 */
export const CATEGORY_ICONS: Record<InspectionCategory, string> = {
  engine_room: "Settings",
  interior: "Car",
  chassis: "Wrench",
  underbody: "CarFront",
  exterior: "CarFront",
  daily: "CheckCircle2",
  other: "MoreHorizontal",
};

/**
 * 検査項目の状態（信号機方式 + 追加オプション）
 */
export type InspectionItemStatus =
  | DiagnosisStatus // OK, 注意, 要交換, 未チェック
  | "adjust" // 調整
  | "clean" // 清掃
  | "skip" // 省略
  | "not_applicable"; // 該当なし

/**
 * 測定値の種類
 */
export type MeasurementType =
  | "thickness" // 厚み（mm）
  | "pressure" // 圧力（kPa）
  | "voltage" // 電圧（V）
  | "temperature" // 温度（℃）
  | "distance" // 距離（mm）
  | "angle" // 角度（度）
  | "percentage" // パーセンテージ（%）
  | "custom"; // カスタム

/**
 * 測定値定義
 */
export interface MeasurementDefinition {
  /** 測定値の種類 */
  type: MeasurementType;
  /** 単位 */
  unit: string;
  /** 最小値 */
  min?: number;
  /** 最大値 */
  max?: number;
  /** 推奨値 */
  recommended?: number;
  /** 警告閾値 */
  warningThreshold?: number;
  /** 交換閾値 */
  replacementThreshold?: number;
}

/**
 * 検査項目
 */
export interface InspectionItem {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** カテゴリ */
  category: InspectionCategory;
  /** 現在の状態 */
  status: InspectionItemStatus;
  /** 測定値定義（測定が必要な場合） */
  measurement?: MeasurementDefinition;
  /** 動画撮影が必要かどうか（不具合時のみ） */
  requiresVideo?: boolean;
  /** 動画の最大長（秒） */
  maxVideoDuration?: number;
  /** 省略規則（該当する場合: ☆/★） */
  skipRule?: "☆" | "★";
  /** コメント */
  comment?: string;
  /** 写真URL（複数可） */
  photoUrls?: string[];
  /** 動画URL */
  videoUrl?: string;
  /** 測定値 */
  measurementValue?: number;
}

// =============================================================================
// 車検用の検査項目リスト
// =============================================================================

/**
 * 車検用の検査項目リスト（7カテゴリ、50項目以上）
 */
export const VEHICLE_INSPECTION_ITEMS: InspectionItem[] = [
  // =============================================================================
  // エンジン・ルーム点検
  // =============================================================================
  {
    id: "engine-room-001",
    name: "パワー・ステアリング",
    category: "engine_room",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "engine-room-002",
    name: "冷却装置",
    category: "engine_room",
    status: "unchecked",
    measurement: {
      type: "pressure",
      unit: "kPa",
      min: 80,
      max: 150,
      recommended: 120,
      warningThreshold: 100,
      replacementThreshold: 80,
    },
  },
  {
    id: "engine-room-003",
    name: "エンジンオイル",
    category: "engine_room",
    status: "unchecked",
    measurement: {
      type: "percentage",
      unit: "%",
      min: 0,
      max: 100,
      recommended: 80,
      warningThreshold: 50,
      replacementThreshold: 30,
    },
  },
  {
    id: "engine-room-004",
    name: "オイルフィルター",
    category: "engine_room",
    status: "unchecked",
  },
  {
    id: "engine-room-005",
    name: "エンジンベルト",
    category: "engine_room",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "engine-room-006",
    name: "バッテリー",
    category: "engine_room",
    status: "unchecked",
    measurement: {
      type: "voltage",
      unit: "V",
      min: 11.5,
      max: 14.5,
      recommended: 12.6,
      warningThreshold: 12.0,
      replacementThreshold: 11.5,
    },
  },
  {
    id: "engine-room-007",
    name: "エアクリーナー",
    category: "engine_room",
    status: "unchecked",
  },
  {
    id: "engine-room-008",
    name: "燃料装置",
    category: "engine_room",
    status: "unchecked",
  },
  {
    id: "engine-room-009",
    name: "点火プラグ",
    category: "engine_room",
    status: "unchecked",
  },
  {
    id: "engine-room-010",
    name: "点火コイル",
    category: "engine_room",
    status: "unchecked",
  },
  {
    id: "engine-room-011",
    name: "エンジン本体",
    category: "engine_room",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "engine-room-012",
    name: "排気装置",
    category: "engine_room",
    status: "unchecked",
  },
  {
    id: "engine-room-013",
    name: "オイル漏れ",
    category: "engine_room",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "engine-room-014",
    name: "冷却水漏れ",
    category: "engine_room",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "engine-room-015",
    name: "燃料漏れ",
    category: "engine_room",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },

  // =============================================================================
  // 室内点検
  // =============================================================================
  {
    id: "interior-001",
    name: "シートベルト",
    category: "interior",
    status: "unchecked",
  },
  {
    id: "interior-002",
    name: "エアバッグ",
    category: "interior",
    status: "unchecked",
  },
  {
    id: "interior-003",
    name: "ワイパー",
    category: "interior",
    status: "unchecked",
    measurement: {
      type: "thickness",
      unit: "mm",
      min: 0,
      max: 10,
      recommended: 5,
      warningThreshold: 3,
      replacementThreshold: 1,
    },
  },
  {
    id: "interior-004",
    name: "ワイシャー液",
    category: "interior",
    status: "unchecked",
  },
  {
    id: "interior-005",
    name: "室内灯",
    category: "interior",
    status: "unchecked",
  },
  {
    id: "interior-006",
    name: "エアコン",
    category: "interior",
    status: "unchecked",
    measurement: {
      type: "temperature",
      unit: "℃",
      min: 0,
      max: 30,
      recommended: 5,
      warningThreshold: 10,
      replacementThreshold: 15,
    },
  },
  {
    id: "interior-007",
    name: "オーディオ",
    category: "interior",
    status: "unchecked",
  },
  {
    id: "interior-008",
    name: "ナビゲーション",
    category: "interior",
    status: "unchecked",
  },

  // =============================================================================
  // 足廻り点検
  // =============================================================================
  {
    id: "chassis-001",
    name: "フロントブレーキパッド",
    category: "chassis",
    status: "unchecked",
    measurement: {
      type: "thickness",
      unit: "mm",
      min: 0,
      max: 20,
      recommended: 10,
      warningThreshold: 5,
      replacementThreshold: 2,
    },
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "chassis-002",
    name: "リヤブレーキパッド",
    category: "chassis",
    status: "unchecked",
    measurement: {
      type: "thickness",
      unit: "mm",
      min: 0,
      max: 20,
      recommended: 10,
      warningThreshold: 5,
      replacementThreshold: 2,
    },
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "chassis-003",
    name: "フロントブレーキディスク",
    category: "chassis",
    status: "unchecked",
    measurement: {
      type: "thickness",
      unit: "mm",
      min: 0,
      max: 30,
      recommended: 25,
      warningThreshold: 20,
      replacementThreshold: 18,
    },
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "chassis-004",
    name: "リヤブレーキディスク",
    category: "chassis",
    status: "unchecked",
    measurement: {
      type: "thickness",
      unit: "mm",
      min: 0,
      max: 30,
      recommended: 25,
      warningThreshold: 20,
      replacementThreshold: 18,
    },
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "chassis-005",
    name: "ブレーキホース",
    category: "chassis",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "chassis-006",
    name: "ブレーキフルード",
    category: "chassis",
    status: "unchecked",
    measurement: {
      type: "percentage",
      unit: "%",
      min: 0,
      max: 100,
      recommended: 80,
      warningThreshold: 50,
      replacementThreshold: 30,
    },
  },
  {
    id: "chassis-007",
    name: "タイヤ（フロント）",
    category: "chassis",
    status: "unchecked",
    measurement: {
      type: "thickness",
      unit: "mm",
      min: 0,
      max: 20,
      recommended: 8,
      warningThreshold: 3,
      replacementThreshold: 1.6,
    },
  },
  {
    id: "chassis-008",
    name: "タイヤ（リヤ）",
    category: "chassis",
    status: "unchecked",
    measurement: {
      type: "thickness",
      unit: "mm",
      min: 0,
      max: 20,
      recommended: 8,
      warningThreshold: 3,
      replacementThreshold: 1.6,
    },
  },
  {
    id: "chassis-009",
    name: "タイヤ空気圧（フロント）",
    category: "chassis",
    status: "unchecked",
    measurement: {
      type: "pressure",
      unit: "kPa",
      min: 150,
      max: 300,
      recommended: 220,
      warningThreshold: 200,
      replacementThreshold: 180,
    },
  },
  {
    id: "chassis-010",
    name: "タイヤ空気圧（リヤ）",
    category: "chassis",
    status: "unchecked",
    measurement: {
      type: "pressure",
      unit: "kPa",
      min: 150,
      max: 300,
      recommended: 220,
      warningThreshold: 200,
      replacementThreshold: 180,
    },
  },
  {
    id: "chassis-011",
    name: "サスペンション（フロント）",
    category: "chassis",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "chassis-012",
    name: "サスペンション（リヤ）",
    category: "chassis",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "chassis-013",
    name: "ステアリング",
    category: "chassis",
    status: "unchecked",
  },
  {
    id: "chassis-014",
    name: "ドライブシャフト",
    category: "chassis",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },

  // =============================================================================
  // 下廻り点検
  // =============================================================================
  {
    id: "underbody-001",
    name: "オイルパン",
    category: "underbody",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "underbody-002",
    name: "トランスミッション",
    category: "underbody",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "underbody-003",
    name: "デファレンシャル",
    category: "underbody",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "underbody-004",
    name: "排気管",
    category: "underbody",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "underbody-005",
    name: "マフラー",
    category: "underbody",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "underbody-006",
    name: "燃料タンク",
    category: "underbody",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "underbody-007",
    name: "フレーム",
    category: "underbody",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },
  {
    id: "underbody-008",
    name: "ボディ下部",
    category: "underbody",
    status: "unchecked",
    requiresVideo: true,
    maxVideoDuration: 15,
  },

  // =============================================================================
  // 外廻り点検
  // =============================================================================
  {
    id: "exterior-001",
    name: "ヘッドライト",
    category: "exterior",
    status: "unchecked",
  },
  {
    id: "exterior-002",
    name: "テールライト",
    category: "exterior",
    status: "unchecked",
  },
  {
    id: "exterior-003",
    name: "ウインカー",
    category: "exterior",
    status: "unchecked",
  },
  {
    id: "exterior-004",
    name: "フォグライト",
    category: "exterior",
    status: "unchecked",
  },
  {
    id: "exterior-005",
    name: "バンパー",
    category: "exterior",
    status: "unchecked",
  },
  {
    id: "exterior-006",
    name: "ドア",
    category: "exterior",
    status: "unchecked",
  },
  {
    id: "exterior-007",
    name: "ウィンドウ",
    category: "exterior",
    status: "unchecked",
  },
  {
    id: "exterior-008",
    name: "ミラー",
    category: "exterior",
    status: "unchecked",
  },
  {
    id: "exterior-009",
    name: "ボディ",
    category: "exterior",
    status: "unchecked",
  },

  // =============================================================================
  // 日常点検
  // =============================================================================
  {
    id: "daily-001",
    name: "エンジンオイルレベル",
    category: "daily",
    status: "unchecked",
  },
  {
    id: "daily-002",
    name: "冷却水レベル",
    category: "daily",
    status: "unchecked",
  },
  {
    id: "daily-003",
    name: "ワイシャー液レベル",
    category: "daily",
    status: "unchecked",
  },
  {
    id: "daily-004",
    name: "バッテリー液レベル",
    category: "daily",
    status: "unchecked",
  },
  {
    id: "daily-005",
    name: "ブレーキフルードレベル",
    category: "daily",
    status: "unchecked",
  },
  {
    id: "daily-006",
    name: "タイヤ空気圧",
    category: "daily",
    status: "unchecked",
  },
  {
    id: "daily-007",
    name: "タイヤ溝",
    category: "daily",
    status: "unchecked",
  },
  {
    id: "daily-008",
    name: "ライト類",
    category: "daily",
    status: "unchecked",
  },
];

/**
 * カテゴリごとの検査項目を取得
 */
export function getItemsByCategory(
  category: InspectionCategory
): InspectionItem[] {
  return VEHICLE_INSPECTION_ITEMS.filter((item) => item.category === category);
}

/**
 * 全カテゴリのリストを取得
 */
export function getAllCategories(): InspectionCategory[] {
  return Array.from(
    new Set(VEHICLE_INSPECTION_ITEMS.map((item) => item.category))
  ) as InspectionCategory[];
}

/**
 * カテゴリごとの進捗を計算
 */
export function calculateCategoryProgress(
  category: InspectionCategory,
  items: InspectionItem[]
): {
  total: number;
  completed: number;
  percentage: number;
} {
  const categoryItems = items.filter((item) => item.category === category);
  const total = categoryItems.length;
  const completed = categoryItems.filter(
    (item) => item.status !== "unchecked"
  ).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}
