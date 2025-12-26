/**
 * 故障診断用の型定義
 *
 * 症状カテゴリ、診断データを管理
 */

// =============================================================================
// 型定義
// =============================================================================

/**
 * 症状カテゴリ
 */
export type SymptomCategory =
  | "エンジン"
  | "トランスミッション"
  | "ブレーキ"
  | "サスペンション"
  | "電装"
  | "エアコン"
  | "異音"
  | "振動"
  | "その他";

/**
 * 症状情報
 */
export interface Symptom {
  /** 症状ID */
  id: string;
  /** 症状名 */
  name: string;
  /** カテゴリ */
  category: SymptomCategory;
  /** 説明（オプション） */
  description?: string;
}

/**
 * 診断機結果
 */
export interface DiagnosticToolResult {
  /** 診断機を使用したか */
  used: boolean;
  /** 診断機結果PDFのURL（アップロード後） */
  pdfUrl?: string;
  /** 診断機結果PDFのファイルID（Google Drive） */
  pdfFileId?: string;
  /** 診断機の種類（オプション） */
  toolType?: string;
}

/**
 * 故障診断データ
 */
export interface FaultDiagnosisData {
  /** 症状リスト */
  symptoms: Symptom[];
  /** 診断機結果 */
  diagnosticTool: DiagnosticToolResult;
  /** 動画URLリスト */
  videoUrls: string[];
  /** 動画ファイルIDリスト（Google Drive） */
  videoFileIds: string[];
  /** 音声URL */
  audioUrl?: string;
  /** 音声ファイルID（Google Drive） */
  audioFileId?: string;
  /** エラーランプ情報（受付時に入力されたもの） */
  errorLampInfo?: {
    hasErrorLamp: boolean;
    lampTypes: string[];
    otherDetails?: string;
  };
  /** 追加メモ */
  notes?: string;
}

/**
 * 症状カテゴリの表示名
 */
export const SYMPTOM_CATEGORY_DISPLAY_NAMES: Record<SymptomCategory, string> = {
  エンジン: "エンジン",
  トランスミッション: "トランスミッション",
  ブレーキ: "ブレーキ",
  サスペンション: "サスペンション",
  電装: "電装",
  エアコン: "エアコン",
  異音: "異音",
  振動: "振動",
  その他: "その他",
};

/**
 * 症状カテゴリのアイコン（lucide-react）
 */
export const SYMPTOM_CATEGORY_ICONS: Record<SymptomCategory, string> = {
  エンジン: "Zap",
  トランスミッション: "Settings",
  ブレーキ: "AlertTriangle",
  サスペンション: "Car",
  電装: "Battery",
  エアコン: "Wind",
  異音: "Volume2",
  振動: "Vibrate",
  その他: "MoreHorizontal",
};

/**
 * デフォルトの症状リスト
 */
export const DEFAULT_SYMPTOMS: Omit<Symptom, "id">[] = [
  // エンジン
  { name: "エンジンがかからない", category: "エンジン" },
  { name: "エンジンが止まる", category: "エンジン" },
  { name: "エンジンが不安定", category: "エンジン" },
  { name: "エンジンオイルの消耗が激しい", category: "エンジン" },
  { name: "エンジンから異音がする", category: "エンジン" },
  { name: "エンジンから煙が出る", category: "エンジン" },
  
  // トランスミッション
  { name: "シフトが入らない", category: "トランスミッション" },
  { name: "シフトがスムーズでない", category: "トランスミッション" },
  { name: "変速時にショックがある", category: "トランスミッション" },
  { name: "トランスミッションから異音がする", category: "トランスミッション" },
  
  // ブレーキ
  { name: "ブレーキが効かない", category: "ブレーキ" },
  { name: "ブレーキが効きすぎる", category: "ブレーキ" },
  { name: "ブレーキから異音がする", category: "ブレーキ" },
  { name: "ブレーキペダルが柔らかい", category: "ブレーキ" },
  { name: "ブレーキペダルが硬い", category: "ブレーキ" },
  
  // サスペンション
  { name: "車体が揺れる", category: "サスペンション" },
  { name: "サスペンションから異音がする", category: "サスペンション" },
  { name: "ハンドルが取られる", category: "サスペンション" },
  { name: "タイヤの偏摩耗", category: "サスペンション" },
  
  // 電装
  { name: "バッテリーが上がる", category: "電装" },
  { name: "ライトが点かない", category: "電装" },
  { name: "ワイパーが動かない", category: "電装" },
  { name: "エアバッグランプが点灯", category: "電装" },
  { name: "ABSランプが点灯", category: "電装" },
  
  // エアコン
  { name: "エアコンが効かない", category: "エアコン" },
  { name: "エアコンから異音がする", category: "エアコン" },
  { name: "エアコンから変な臭いがする", category: "エアコン" },
  
  // 異音
  { name: "走行中に異音がする", category: "異音" },
  { name: "エンジンルームから異音がする", category: "異音" },
  { name: "車体下部から異音がする", category: "異音" },
  
  // 振動
  { name: "ハンドルが振動する", category: "振動" },
  { name: "車体が振動する", category: "振動" },
  { name: "アクセルを踏むと振動する", category: "振動" },
  
  // その他
  { name: "その他", category: "その他" },
];

/**
 * カテゴリ別に症状を取得
 */
export function getSymptomsByCategory(
  symptoms: Symptom[],
  category: SymptomCategory
): Symptom[] {
  return symptoms.filter((s) => s.category === category);
}

/**
 * すべてのカテゴリを取得
 */
export function getAllSymptomCategories(): SymptomCategory[] {
  return Object.keys(SYMPTOM_CATEGORY_DISPLAY_NAMES) as SymptomCategory[];
}























