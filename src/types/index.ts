/**
 * Repair Shop DX Platform - Type Definitions
 * 
 * 仕様書「0-2. Zoho CRM モジュール・フィールド・APIマッピング」に準拠した型定義
 * API名と日本語エイリアスを両立
 */

// =============================================================================
// A. 入庫管理 (CustomModule2) - ZohoJob
// =============================================================================

/**
 * 工程ステージ (field5) の選択肢
 * 【修正】"入庫待ち" と "見積提示済み" を追加しました
 */
export type JobStage =
  | '入庫待ち'       // 初期状態
  | '入庫済み'
  | '見積作成待ち'
  | '見積提示済み'   // ← これが不足していたためエラーが出ていました
  | '作業待ち'
  | '出庫待ち'
  | '出庫済み';

/**
 * 入庫区分 (Service Kind)
 */
export type ServiceKind =
  | '車検'
  | '修理・整備'
  | 'レストア'
  | 'チューニング'
  | 'パーツ取付'
  | 'コーティング'
  | 'その他'
  | '12ヵ月点検'
  | 'エンジンオイル交換'
  | 'タイヤ交換・ローテーション'
  | '故障診断';

/**
 * Zoho CRM 入庫管理モジュール (CustomModule2)
 * メインの案件(Job)データ
 */
export interface ZohoJob {
  /** Record ID (Zoho内部ID) */
  id: string;

  /** 入庫日時 - Phase 0/1で「今日」のデータ取得に使用 */
  field22: string; // DateTime (ISO 8601)
  /** エイリアス */
  arrivalDateTime?: string;

  /** 工程ステージ - ステータス管理 */
  field5: JobStage;
  /** エイリアス */
  stage?: JobStage;

  /** 顧客名 - Contacts への Lookup */
  field4: ZohoLookup | null;
  /** エイリアス */
  customer?: ZohoLookup | null;

  /** 車両ID - CustomModule1 への Lookup */
  field6: ZohoLookup | null;
  /** エイリアス */
  vehicle?: ZohoLookup | null;

  /** 作業指示書 - 社内からの申し送り事項 (⚠アイコン表示用) */
  field: string | null;
  /** エイリアス */
  workOrder?: string | null;

  /** 詳細情報 - 顧客が事前入力した不具合・問診内容 */
  field7: string | null;
  /** エイリアス */
  details?: string | null;

  /** 走行距離 - 顧客入力値 / メカニック入力値 */
  field10: number | null;
  /** エイリアス */
  mileage?: number | null;

  /** 作業内容 - 顧客承認済みの見積もり明細（テキスト）
   * ※field14(一覧)は選択リスト型のため使用禁止 */
  field13: string | null;
  /** エイリアス */
  approvedWorkItems?: string | null;

  /** お客様共有フォルダ - Google DriveフォルダのURL */
  field19: string | null;
  /** エイリアス */
  customerFolderUrl?: string | null;

  /** 予約ID - Zoho Bookingsとの紐付け用 */
  ID_BookingId: string | null;
  /** エイリアス */
  bookingId?: string | null;

  /** 関連ファイル - 車検証画像など (Upload型) */
  field12: ZohoAttachment[] | null;
  /** エイリアス */
  attachments?: ZohoAttachment[] | null;

  // --- アプリ拡張フィールド ---
  /** スマートタグID (アプリ側で管理) */
  tagId?: string | null;
  /** 入庫区分 (アプリ側で管理) */
  serviceKind?: ServiceKind | null;
  /** 担当整備士名 (アプリ側で管理) */
  assignedMechanic?: string | null;
}

/**
 * Zoho Lookup 型 (参照フィールド)
 */
export interface ZohoLookup {
  /** 参照先レコードのID */
  id: string;
  /** 参照先レコードの表示名 */
  name: string;
}

/**
 * Zoho Attachment 型 (添付ファイル)
 */
export interface ZohoAttachment {
  /** ファイルID */
  id: string;
  /** ファイル名 */
  file_name: string;
  /** ダウンロードURL */
  download_url?: string;
}

// =============================================================================
// B. 顧客 (Contacts) - ZohoCustomer
// =============================================================================

/**
 * Zoho CRM 顧客モジュール (Contacts)
 * アプリからの差分更新対象
 */
export interface ZohoCustomer {
  /** Record ID (Zoho内部ID) */
  id: string;

  /** 顧客ID - 基幹連携用キー (例: K1001) */
  ID1: string;
  /** エイリアス */
  customerId?: string;

  /** 姓 */
  Last_Name: string;
  /** エイリアス */
  lastName?: string;

  /** 名 */
  First_Name: string | null;
  /** エイリアス */
  firstName?: string | null;

  /** LINE ID - アプリから直接更新OK */
  Business_Messaging_Line_Id: string | null;
  /** エイリアス */
  lineId?: string | null;

  /** メール同意 - 事前チェックインで同意なら false に更新 (直接更新OK) */
  Email_Opt_Out: boolean;
  /** エイリアス */
  emailOptOut?: boolean;

  /** 誕生日 - 入力があれば更新 (直接更新OK) */
  Date_of_Birth: string | null; // Date (YYYY-MM-DD)
  /** エイリアス */
  dateOfBirth?: string | null;

  /** 住所 - 町名・番地 (直接更新NG → Descriptionへ追記) */
  Mailing_Street: string | null;
  /** エイリアス */
  mailingStreet?: string | null;

  /** 住所 - 番地 (直接更新NG) */
  field4: string | null;
  /** エイリアス */
  addressNumber?: string | null;

  /** 住所 - 建物名等 (直接更新NG) */
  field6: string | null;
  /** エイリアス */
  buildingName?: string | null;

  /** 電話番号 (直接更新NG → Descriptionへ追記) */
  Phone: string | null;
  /** エイリアス */
  phone?: string | null;

  /** 携帯番号 (直接更新NG → Descriptionへ追記) */
  Mobile: string | null;
  /** エイリアス */
  mobile?: string | null;

  /** 備考 - アプリからの「住所・電話変更依頼」をここに追記 */
  Description: string | null;
  /** エイリアス */
  description?: string | null;

  /** 予約時連絡先 - Bookingsからの電話番号一時保存用（上書き防止） */
  Booking_Phone_Temp: string | null;
  /** エイリアス */
  bookingPhoneTemp?: string | null;
}

// =============================================================================
// C. 車両 (CustomModule1) - ZohoVehicle
// =============================================================================

/**
 * Zoho CRM 車両モジュール (CustomModule1)
 * Zoho内の簡易車両データ
 */
export interface ZohoVehicle {
  /** Record ID (Zoho内部ID) */
  id: string;

  /** 車両ID - 基幹連携用キー */
  Name: string;
  /** エイリアス */
  vehicleId?: string;

  /** 登録番号連結 - ナンバープレート情報 */
  field44: string | null;
  /** エイリアス */
  licensePlate?: string | null;

  /** 顧客ID - 所有者紐付け用 */
  ID1: string | null;
  /** エイリアス */
  customerId?: string | null;

  /** 車検有効期限 - 次回リマインド用 */
  field7: string | null; // Date (YYYY-MM-DD)
  /** エイリアス */
  inspectionExpiry?: string | null;
}

// =============================================================================
// D. マスタデータ構造 (Google Sheets - Smart Car Dealer出力準拠)
// =============================================================================

/**
 * 車両マスタ (SheetID_Vehicle)
 * Google Sheetsのカラム名は基幹システム出力のヘッダー行に基づく
 */
export interface MasterVehicle {
  /** 車両ID (Key) */
  車両ID: string;
  /** 顧客ID - 検索キー */
  顧客ID: string;
  /** 登録番号連結 - ナンバープレート */
  登録番号連結: string;
  /** 車名 */
  車名: string;
  /** 型式 */
  型式: string;
  /** 車検有効期限 */
  車検有効期限: string; // Date (YYYY-MM-DD)
  /** 次回点検日 */
  次回点検日: string; // Date (YYYY-MM-DD)
}

/**
 * 顧客マスタ (SheetID_Customer)
 * Google Sheetsのカラム名は基幹システム出力のヘッダー行に基づく
 */
export interface MasterCustomer {
  /** 顧客ID (Key) */
  顧客ID: string;
  /** 顧客名 */
  顧客名: string;
  /** 住所連結 */
  住所連結: string;
  /** 電話番号 */
  電話番号: string;
  /** 携帯番号 */
  携帯番号: string;
}

// =============================================================================
// E. アプリ固有の型定義
// =============================================================================

/**
 * スマートタグ
 * 物理タグとZoho Job IDの紐付け
 */
export interface SmartTag {
  /** タグID (例: "01", "02", ..., "20") */
  tagId: string;
  /** 紐付け中のJob ID (null = 空きタグ) */
  jobId: string | null;
  /** 紐付け日時 */
  linkedAt: string | null; // DateTime (ISO 8601)
  /** ステータス */
  status: 'available' | 'in_use' | 'closed';
}

/**
 * 代車（レンタカー）
 * 顧客への貸出用車両
 */
export interface CourtesyCar {
  /** 代車ID (例: "CAR-001", "CAR-002") */
  carId: string;
  /** 車名 */
  name: string;
  /** ナンバープレート */
  licensePlate: string | null;
  /** 紐付け中のJob ID (null = 空き) */
  jobId: string | null;
  /** 貸出開始日時 */
  rentedAt: string | null; // DateTime (ISO 8601)
  /** ステータス */
  status: 'available' | 'in_use' | 'inspection';
}

/**
 * 診断チェック項目
 * 信号機方式（🟢緑/🟡黄/🔴赤）
 */
export type DiagnosisStatus = 'green' | 'yellow' | 'red' | 'unchecked';

export interface DiagnosisItem {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** カテゴリ */
  category: string;
  /** 診断結果 */
  status: DiagnosisStatus;
  /** コメント・所見 */
  comment: string | null;
  /** 証拠写真URL */
  evidencePhotoUrls: string[];
  /** 証拠動画URL */
  evidenceVideoUrl: string | null;
}

/**
 * 見積項目 (松竹梅方式)
 */
export type EstimatePriority = 'required' | 'recommended' | 'optional';

export interface EstimateItem {
  /** 項目ID */
  id: string;
  /** 品名 */
  name: string;
  /** 金額 (税込) */
  price: number;
  /** 優先度: 松(required) / 竹(recommended) / 梅(optional) */
  priority: EstimatePriority;
  /** 顧客選択済みか */
  selected: boolean;
  /** 紐付け証拠写真URL */
  linkedPhotoUrls: string[];
  /** 紐付け動画URL */
  linkedVideoUrl: string | null;
  /** 備考 */
  note: string | null;
}

/**
 * 顧客向け見積ページ
 */
export interface CustomerEstimate {
  /** 見積ID (一意なURL生成用) */
  estimateId: string;
  /** Job ID */
  jobId: string;
  /** 顧客名 */
  customerName: string;
  /** 車両情報 */
  vehicleInfo: string;
  /** 見積項目リスト */
  items: EstimateItem[];
  /** 作成日時 */
  createdAt: string; // DateTime (ISO 8601)
  /** 有効期限 */
  expiresAt: string | null; // DateTime (ISO 8601)
  /** ステータス */
  status: 'pending' | 'approved' | 'expired';
}

/**
 * アップロード画像
 * クライアント側で500KB以下に圧縮
 */
export interface UploadImage {
  /** 一時ファイルID */
  tempId: string;
  /** ファイル名 (リネーム後: {位置}_{日付}_{車両}.jpg) */
  fileName: string;
  /** 圧縮後のBlob/File */
  file: File;
  /** プレビュー用URL */
  previewUrl: string;
  /** 撮影位置 */
  position: 'front' | 'rear' | 'left' | 'right' | 'detail' | 'other';
  /** アップロード状態 */
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
  /** アップロード先URL (Drive) */
  uploadedUrl: string | null;
}

/**
 * 整備士
 */
export interface Mechanic {
  /** 整備士ID */
  id: string;
  /** 整備士名 */
  name: string;
}

// =============================================================================
// F. API レスポンス型
// =============================================================================

/**
 * Zoho API レスポンス (一般)
 */
export interface ZohoApiResponse<T> {
  data: T[];
  info?: {
    per_page: number;
    count: number;
    page: number;
    more_records: boolean;
  };
}

/**
 * Zoho API エラーレスポンス
 */
export interface ZohoApiError {
  code: string;
  message: string;
  details: Record<string, unknown>;
  status: 'error';
}

/**
 * Google Sheets API レスポンス
 */
export interface SheetsApiResponse<T> {
  data: T[];
  lastUpdated: string; // DateTime (ISO 8601)
}

/**
 * アプリ API 共通レスポンス
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}