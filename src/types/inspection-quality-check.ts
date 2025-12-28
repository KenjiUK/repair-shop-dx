/**
 * 品質管理・最終検査 型定義
 * 
 * 車検用の品質管理・最終検査項目
 */

/**
 * 品質管理・最終検査項目のチェック方式
 */
export type QualityCheckMethod = 
  | 'yes_no'      // ○／×
  | 'has_not'     // 有／無
  | 'number'      // 数値
  | 'pass_review'; // 合格／要再確認

/**
 * 品質管理・最終検査項目
 */
export interface QualityCheckItem {
  /** 項目ID */
  id: string;
  /** カテゴリ */
  category: string;
  /** チェック項目名 */
  name: string;
  /** チェック方式 */
  method: QualityCheckMethod;
  /** チェック結果（○／×の場合） */
  yesNo?: boolean | null; // true: ○, false: ×, null: 未入力
  /** チェック結果（有／無の場合） */
  hasNot?: boolean | null; // true: 有, false: 無, null: 未入力
  /** チェック結果（数値の場合） */
  number?: number | null;
  /** チェック結果（合格／要再確認の場合） */
  passReview?: boolean | null; // true: 合格, false: 要再確認, null: 未入力
}

/**
 * 品質管理・最終検査データ
 */
export interface QualityCheckData {
  /** 検査項目リスト */
  items: QualityCheckItem[];
  /** 検査日時 */
  inspectionDate?: string; // ISO8601
  /** 検査者名 */
  inspector?: string;
}

