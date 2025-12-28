/**
 * 12ヶ月点検・24ヶ月点検 再設計版 型定義
 * 
 * 再設計仕様書: docs/INSPECTION_DIAGNOSIS_PAGE_REDESIGN.md
 */

// =============================================================================
// 検査項目の状態（記号対応）
// =============================================================================

/**
 * 検査項目の状態（記号対応）
 * 
 * PDFテンプレート（12ヶ月点検整備記録簿）の記号に対応:
 * - 'none': /（該当なし）
 * - 'specific': ○（特定整備）
 * - 'good': レ（点検良好）
 * - 'exchange': ×（交換）
 * - 'adjust': A（調整）
 * - 'tighten': T（締付）
 * - 'clean': C（清掃）
 * - 'lubricate': L（給油（水））
 * - 'repair': △（修理）
 * - 'omit': P（省略）
 */
export type InspectionStatus =
  | 'none'      // /（該当なし）
  | 'specific'  // ○（特定整備）
  | 'good'      // レ（点検良好）
  | 'exchange'  // ×（交換）
  | 'adjust'    // A（調整）
  | 'tighten'   // T（締付）
  | 'clean'     // C（清掃）
  | 'lubricate' // L（給油（水））
  | 'repair'    // △（修理）
  | 'omit';     // P（省略）

/**
 * ステータスの表示ラベル（記号）
 */
export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  none: '/',
  specific: '○',
  good: 'レ',
  exchange: '×',
  adjust: 'A',
  tighten: 'T',
  clean: 'C',
  lubricate: 'L',
  repair: '△',
  omit: 'P',
};

/**
 * ステータスの日本語ラベル
 */
export const INSPECTION_STATUS_NAMES: Record<InspectionStatus, string> = {
  none: '該当なし',
  specific: '特定整備',
  good: '点検良好',
  exchange: '交換',
  adjust: '調整',
  tighten: '締付',
  clean: '清掃',
  lubricate: '給油（水）',
  repair: '修理',
  omit: '省略',
};

/**
 * ステータスのバッジバリアント（shadcn/uiのBadge variantに対応）
 */
export const INSPECTION_STATUS_BADGE_VARIANTS: Record<InspectionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  none: 'secondary',      // グレー（該当なし）
  specific: 'default',    // 青色（特定整備）
  good: 'default',        // 緑色（点検良好）
  exchange: 'destructive', // 赤色（交換）
  adjust: 'outline',      // 黄色（調整）
  tighten: 'secondary',   // 紫色（締付）
  clean: 'secondary',     // 青色（清掃）
  lubricate: 'secondary', // 青色（給油（水））
  repair: 'outline',      // オレンジ色（修理）
  omit: 'secondary',      // グレー（省略）
};

// =============================================================================
// 検査項目カテゴリ（12ヶ月点検用）
// =============================================================================

/**
 * 12ヶ月点検のカテゴリ
 */
export type InspectionCategory12Month =
  | 'steering'    // かじ取り装置（ステアリング）
  | 'brake'       // 制動装置（ブレーキ）
  | 'running'     // 走行装置
  | 'suspension'  // 緩衝装置（サスペンション）
  | 'drivetrain'; // 動力伝達装置（ドライブトレイン）

/**
 * 12ヶ月点検のカテゴリ表示名
 */
export const INSPECTION_CATEGORY_12MONTH_LABELS: Record<InspectionCategory12Month, string> = {
  steering: 'かじ取り装置（ステアリング）',
  brake: '制動装置（ブレーキ）',
  running: '走行装置',
  suspension: '緩衝装置（サスペンション）',
  drivetrain: '動力伝達装置（ドライブトレイン）',
};

// =============================================================================
// 検査項目カテゴリ（24ヶ月点検用）
// =============================================================================

/**
 * 24ヶ月点検（車検）のカテゴリ
 */
export type InspectionCategory24Month =
  | 'engine-room' // エンジン・ルーム点検
  | 'interior'    // 室内点検
  | 'chassis'     // 足廻り点検
  | 'underbody'   // 下廻り点検
  | 'exterior'    // 外廻り点検
  | 'daily';      // 日常点検

/**
 * 24ヶ月点検のカテゴリ表示名
 */
export const INSPECTION_CATEGORY_24MONTH_LABELS: Record<InspectionCategory24Month, string> = {
  'engine-room': 'エンジン・ルーム点検',
  'interior': '室内点検',
  'chassis': '足廻り点検',
  'underbody': '下廻り点検',
  'exterior': '外廻り点検',
  'daily': '日常点検',
};

// =============================================================================
// 検査項目
// =============================================================================

/**
 * 検査項目（再設計版）
 */
export interface InspectionItemRedesign {
  /** 項目ID */
  id: string;
  /** 項目名（ラベル） */
  label: string;
  /** カテゴリ（12ヶ月点検用または24ヶ月点検用） */
  category: InspectionCategory12Month | InspectionCategory24Month;
  /** 法定12ヶ月点検項目かどうか（実線チェックボックス） */
  isStatutory?: boolean;
  /** 走行距離によって省略できる項目かどうか（点線チェックボックス） */
  isOmittableByMileage?: boolean;
  /** 走行距離によって省略できる項目（トヨタ指定）かどうか（グレーチェックボックス） */
  isOmittableByMileageToyota?: boolean;
  /** 現在の状態 */
  status: InspectionStatus;
  /** 備考やメモ */
  note?: string;
  /** 測定値が必要かどうか */
  requiresMeasurement?: boolean;
  /** 測定値（例: パッド残量、タイヤ溝深さ） */
  measuredValue?: number;
  /** 写真URL配列 */
  photoUrls?: string[];
  /** 動画URL配列 */
  videoUrls?: string[];
  /** 動画データ（メタデータ用） */
  videoData?: Array<{
    url: string;
    duration?: number; // 秒
    transcription?: string; // 音声認識テキスト
  }>;
  /** コメント */
  comment?: string;
}

// =============================================================================
// 測定値
// =============================================================================

/**
 * 測定値データ（12ヶ月点検・24ヶ月点検共通）
 */
export interface InspectionMeasurements {
  /** CO濃度（%） */
  co?: number;
  /** HC濃度（ppm） */
  hc?: number;
  
  /** ブレーキパッド厚さ（前輪左、mm） */
  brakeFrontLeft?: number;
  /** ブレーキパッド厚さ（前輪右、mm） */
  brakeFrontRight?: number;
  /** ブレーキパッド厚さ（後輪左、mm） */
  brakeRearLeft?: number;
  /** ブレーキパッド厚さ（後輪右、mm） */
  brakeRearRight?: number;
  
  /** タイヤ溝深さ（前輪左、mm） */
  tireFrontLeft?: number;
  /** タイヤ溝深さ（前輪右、mm） */
  tireFrontRight?: number;
  /** タイヤ溝深さ（後輪左、mm） */
  tireRearLeft?: number;
  /** タイヤ溝深さ（後輪右、mm） */
  tireRearRight?: number;
}

/**
 * 交換部品データ
 */
export interface InspectionParts {
  /** エンジンオイル（L） */
  engineOil?: number;
  /** オイルフィルター（個） */
  oilFilter?: number;
  /** LLC（ロング・ライフ・クーラント）（L） - 24ヶ月点検用 */
  llc?: number;
  /** ブレーキ・フルード（L） - 24ヶ月点検用 */
  brakeFluid?: number;
  /** ワイパーゴム（個） - 12ヶ月点検用 */
  wiperRubber?: number;
  /** クリーンエアフィルター（個） - 12ヶ月点検用 */
  airFilter?: number;
}

/**
 * テスター数値（24ヶ月点検（車検）用）
 */
export interface TestLineMeasurements {
  /** ブレーキ制動力（%） */
  brakeForce?: number;
  /** サイドスリップ（m/km） */
  sideSlip?: number;
  /** スピードメーター誤差（%） */
  speedometerError?: number;
  /** 排ガス CO濃度（%） */
  coConcentration?: number;
  /** 排ガス HC濃度（ppm） */
  hcConcentration?: number;
  /** ヘッドライト上向き（cd） */
  headlightUp?: number;
  /** ヘッドライト下向き（cd） */
  headlightDown?: number;
}

// =============================================================================
// フォームデータ
// =============================================================================

/**
 * 検査フォームデータ（再設計版）
 */
export interface InspectionFormDataRedesign {
  /** 点検タイプ */
  type: '12month' | '24month';
  /** 検査項目リスト */
  items: InspectionItemRedesign[];
  /** 測定値 */
  measurements: InspectionMeasurements;
  /** 交換部品 */
  parts: InspectionParts;
  /** テスター数値（24ヶ月点検のみ） */
  testLineMeasurements?: TestLineMeasurements;
  /** 完成検査完了日時 */
  completedAt?: string;
  /** 検査員名 */
  inspectorName?: string;
}

