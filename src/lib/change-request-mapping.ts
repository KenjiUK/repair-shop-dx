/**
 * 変更申請項目マッピング
 * 
 * アプリ内の項目名 → スマートカーディーラーの項目名へのマッピング
 */

// =============================================================================
// 顧客マスタ項目マッピング
// =============================================================================

/**
 * 顧客マスタの項目マッピング
 * key: アプリ内のフィールド名
 * value: スマートカーディーラーの項目名
 */
export const CUSTOMER_FIELD_MAPPING: Record<string, string> = {
  // 基本情報
  Last_Name: "顧客名",
  First_Name: "顧客名",
  customerName: "顧客名",
  ふりがな: "ふりがな",
  
  // 連絡先
  Phone: "電話番号",
  phone: "電話番号",
  Mobile: "携帯番号",
  mobile: "携帯番号",
  Email: "メールアドレス",
  email: "メールアドレス",
  FAX: "FAX",
  
  // 住所
  Mailing_Street: "住所",
  address: "住所",
  postalCode: "〒表示",
  field4: "丁目",
  addressNumber: "丁目",
  field6: "番地",
  buildingName: "建物名等",
  
  // その他
  Date_of_Birth: "生年月日",
  dateOfBirth: "生年月日",
} as const;

// =============================================================================
// 車両マスタ項目マッピング
// =============================================================================

/**
 * 車両マスタの項目マッピング
 * key: アプリ内のフィールド名
 * value: スマートカーディーラーの項目名
 */
export const VEHICLE_FIELD_MAPPING: Record<string, string> = {
  // 基本情報
  vehicleName: "車名",
  field44: "車名",
  maker: "メーカー",
  grade: "グレード",
  
  // 登録情報
  licensePlate: "登録番号連結",
  field24: "登録番号連結",
  vehicleType: "型式",
  chassisNumber: "車台番号",
  
  // 走行情報
  mileage: "走行距離",
  field10: "走行距離",
  
  // 車検情報
  inspectionExpiry: "車検有効期限",
  nextInspectionDate: "次回点検日",
} as const;

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * アプリの項目名をスマートカーディーラーの項目名に変換
 * 
 * @param fieldName アプリ内のフィールド名
 * @param masterType マスタ種別（'customer' | 'vehicle'）
 * @returns スマートカーディーラーの項目名
 */
export function toSmartCarDealerFieldName(
  fieldName: string,
  masterType: "customer" | "vehicle"
): string {
  const mapping = masterType === "customer" 
    ? CUSTOMER_FIELD_MAPPING 
    : VEHICLE_FIELD_MAPPING;
  
  return mapping[fieldName] || fieldName;
}

/**
 * 変更申請のデータ構造
 */
export interface ChangeRequestData {
  /** 顧客ID（スマートカーディーラーの顧客ID） */
  customerId: string;
  /** 顧客名 */
  customerName: string;
  /** 対象マスタ */
  masterType: "顧客" | "車両";
  /** 車両ID（車両変更の場合） */
  vehicleId?: string;
  /** 変更項目（スマートカーディーラーの項目名） */
  fieldName: string;
  /** 変更前の値 */
  oldValue: string;
  /** 変更後の値 */
  newValue: string;
  /** ジョブID（参照用） */
  jobId?: string;
  /** 申請元 */
  source: string;
}

/**
 * 変更申請ログの行データ
 */
export interface ChangeRequestLogRow {
  申請ID: string;
  申請日時: string;
  顧客ID: string;
  顧客名: string;
  対象マスタ: string;
  車両ID: string;
  変更項目: string;
  変更前: string;
  変更後: string;
  ステータス: string;
  対応日時: string;
  対応者: string;
  備考: string;
  ジョブID: string;
  申請元: string;
}

/**
 * 申請IDを生成
 */
export function generateChangeRequestId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = now.getTime().toString(36).toUpperCase();
  return `CR-${year}-${timestamp}`;
}

/**
 * 変更申請データをスプレッドシート行に変換
 */
export function toSpreadsheetRow(data: ChangeRequestData): string[] {
  const now = new Date();
  const formattedDate = now.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  return [
    generateChangeRequestId(),      // A: 申請ID
    formattedDate,                  // B: 申請日時
    data.customerId,                // C: 顧客ID
    data.customerName,              // D: 顧客名
    data.masterType,                // E: 対象マスタ
    data.vehicleId || "",           // F: 車両ID
    data.fieldName,                 // G: 変更項目
    data.oldValue,                  // H: 変更前
    data.newValue,                  // I: 変更後
    "未対応",                        // J: ステータス
    "",                             // K: 対応日時
    "",                             // L: 対応者
    "",                             // M: 備考
    data.jobId || "",               // N: ジョブID
    data.source,                    // O: 申請元
  ];
}

