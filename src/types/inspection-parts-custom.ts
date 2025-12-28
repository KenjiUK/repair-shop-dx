/**
 * 交換部品（カスタム）型定義
 */

/**
 * 交換部品項目（カスタム）
 */
export interface CustomPartItem {
  /** 項目ID */
  id: string;
  /** 品目名 */
  name: string;
  /** 数量 */
  quantity: number;
}

/**
 * 交換部品データ（カスタム対応）
 */
export interface InspectionPartsCustom {
  /** カスタム品目リスト */
  customItems?: CustomPartItem[];
}





