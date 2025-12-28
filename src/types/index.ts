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
 * 【改善提案 #3】"部品調達待ち" と "部品発注待ち" を追加しました
 */
export type JobStage =
  | '入庫待ち'       // 初期状態
  | '入庫済み'
  | '見積作成待ち'
  | '見積提示済み'   // ← これが不足していたためエラーが出ていました
  | '作業待ち'
  | '出庫待ち'
  | '出庫済み'
  | '部品調達待ち'   // 改善提案 #3: 部品調達待ち案件の管理機能
  | '部品発注待ち'   // 改善提案 #3: 部品調達待ち案件の管理機能
  | '再入庫待ち';    // 一時帰宅中の再入庫待ち状態

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
  | '板金・塗装'
  | 'その他'
  | 'その他のメンテナンス'
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

  /** 受付メモ - 受付スタッフからの申し送り事項 (⚠アイコン表示用) */
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

  /** 作業メモ - JSON形式でメモ配列を保存 */
  field26?: string | null;
  /** エイリアス */
  jobMemosField?: string | null;

  /** 予約ID - Zoho Bookingsとの紐付け用 */
  ID_BookingId: string | null;
  /** エイリアス */
  bookingId?: string | null;

  /** 2回目の予約ID（新規追加） */
  ID_BookingId_2?: string | null;
  /** エイリアス */
  bookingId2?: string | null;

  /** 1回目の入庫日時（field7に記録） */
  firstEntryDate?: string | null; // ISO8601

  /** 関連ファイル - 車検証画像など (Upload型) */
  field12: ZohoAttachment[] | null;
  /** エイリアス */
  attachments?: ZohoAttachment[] | null;

  // --- アプリ拡張フィールド ---
  /** スマートタグID (アプリ側で管理) */
  tagId?: string | null;
  /** 入庫区分 (アプリ側で管理) */
  serviceKind?: ServiceKind | null;
  /** 複数の入庫区分 (アプリ側で管理) */
  field_service_kinds?: ServiceKind[] | null;
  /** 担当整備士名 (アプリ側で管理) */
  assignedMechanic?: string | null;

  // --- 新機能拡張フィールド ---
  /** 診断料金（カスタムフィールド field23 または field7 に記録） */
  diagnosisFee?: number | null;
  /** 診断時間（概算・分）（参考情報） */
  diagnosisDuration?: number | null;
  /** 診断料金が事前に決まっているか */
  isDiagnosisFeePreDetermined?: boolean;
  /** メカニック承認済み */
  mechanicApproved?: boolean;
  /** 承認者名 */
  mechanicApprover?: string | null;
  /** 承認日時 */
  mechanicApprovedAt?: string | null; // ISO8601
  /** 作業メモ（カスタムフィールド field26 または field7 にJSON形式で記録） */
  jobMemos?: JobMemo[];
  /** メモの最終更新日時 */
  lastMemoUpdatedAt?: string | null; // ISO8601
  /** 基幹システム連携ID */
  field_base_system_id?: string | null;
  /** エイリアス */
  baseSystemId?: string | null;
  /** 部品情報（改善提案 #3: 部品調達待ち案件の管理機能） */
  /** field26にJSON形式で保存される */
  partsInfo?: PartsInfo | null;
  /** 緊急対応フラグ（シナリオパターン2: 緊急来店案件） */
  /** field7に「【緊急対応】」のプレフィックスを付けて記録 */
  isUrgent?: boolean | null;
  /** バージョン番号（競合制御用、シナリオパターン8） */
  /** 更新のたびにインクリメントされる */
  version?: number | null;
}

/**
 * Zoho Lookup 型 (参照フィールド)
 */
export interface ZohoLookup {
  /** 参照先レコードのID */
  id: string;
  /** 参照先レコードの表示名 */
  name: string;
  /** 顧客ID（基幹連携用、顧客Lookupの場合のみ） */
  ID1?: string;
  /** 姓（顧客Lookupの場合のみ） */
  Last_Name?: string;
  /** 名（顧客Lookupの場合のみ） */
  First_Name?: string;
  /** 車両ID（基幹連携用、車両Lookupの場合のみ） */
  Name?: string;
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

  /** メールアドレス */
  Email: string | null;
  /** エイリアス */
  email?: string | null;

  /** サブメールアドレス */
  Secondary_Email: string | null;
  /** エイリアス */
  secondaryEmail?: string | null;

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
  status: 'available' | 'in_use' | 'inspection' | 'reserving';
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
  /** 証拠動画URL（単一、後方互換性のため保持） */
  evidenceVideoUrl?: string | null;
  /** 証拠動画URL配列（新規追加） */
  evidenceVideoUrls?: string[];
  /** 動画データ（メタデータ用） */
  videoData?: Array<{
    url: string;
    duration?: number;
    transcription?: string;
  }>;
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
  /** 顧客選択済みか（後方互換性のため残す） */
  selected: boolean;
  /** 承認済みか（部分承認のワークフロー用、selectedと併用可能） */
  approved?: boolean;
  /** 紐付け証拠写真URL */
  linkedPhotoUrls: string[];
  /** 紐付け動画URL */
  linkedVideoUrl: string | null;
  /** 実況解説テキスト（音声認識結果） */
  transcription?: string | null;
  /** 備考 */
  note: string | null;
}

/**
 * 見積明細行（PDF生成用）
 */
export interface EstimateLineItem {
  /** 項目ID */
  id: string;
  /** 品名 */
  name: string;
  /** 部品数量 */
  partQuantity: number;
  /** 部品単価 */
  partUnitPrice: number;
  /** 技術料 */
  laborCost: number;
  /** 優先度 */
  priority: EstimatePriority;
  /** 紐付け写真ID */
  linkedPhotoId: string | null;
  /** 紐付け動画ID */
  linkedVideoId: string | null;
  /** 実況解説テキスト */
  transcription: string | null;
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

/**
 * オプションメニュー項目（12ヶ月点検用）
 */
export interface OptionMenuItem {
  /** メニューID */
  id: string;
  /** メニュー名 */
  name: string;
  /** 説明 */
  description: string;
  /** 通常価格 */
  originalPrice: number;
  /** 割引後価格 */
  discountedPrice: number;
  /** バッジ情報（オプション） */
  badge?: {
    text: string;
    color: "green" | "blue" | "orange" | "red";
  };
  /** 作業時間の目安 */
  estimatedTime: string;
  /** カテゴリ */
  category: string;
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

// =============================================================================
// G. Google Drive 型定義
// =============================================================================

/**
 * Google Drive ファイル
 */
export interface DriveFile {
  /** ファイルID */
  id: string;
  /** ファイル名 */
  name: string;
  /** MIMEタイプ */
  mimeType: string;
  /** ファイルサイズ（バイト） */
  size?: string;
  /** 作成日時 */
  createdTime: string;
  /** 更新日時 */
  modifiedTime: string;
  /** Webビューリンク */
  webViewLink?: string;
  /** Webコンテンツリンク（ダウンロード用） */
  webContentLink?: string;
  /** 親フォルダIDのリスト */
  parents?: string[];
}

/**
 * Google Drive フォルダ
 */
export interface DriveFolder {
  /** フォルダID */
  id: string;
  /** フォルダ名 */
  name: string;
  /** 親フォルダID */
  parentId?: string;
  /** 作成日時 */
  createdTime?: string;
  /** 更新日時 */
  modifiedTime?: string;
}

/**
 * ファイルアップロードオプション
 */
export interface UploadFileOptions {
  /** ファイル名 */
  fileName: string;
  /** MIMEタイプ */
  mimeType: string;
  /** ファイルデータ（Blob, File, またはBase64文字列） */
  fileData: Blob | File | string;
  /** 親フォルダID */
  parentFolderId?: string;
  /** 既存ファイルを置き換えるかどうか */
  replaceExisting?: boolean;
}

/**
 * フォルダ作成オプション
 */
export interface CreateFolderOptions {
  /** フォルダ名 */
  folderName: string;
  /** 親フォルダID */
  parentFolderId?: string;
  /** 既存フォルダを返すかどうか */
  returnExisting?: boolean;
}

/**
 * ファイル検索オプション
 */
export interface SearchFileOptions {
  /** 検索クエリ */
  query: string;
  /** 親フォルダID */
  parentFolderId?: string;
  /** MIMEタイプ */
  mimeType?: string;
  /** 最大結果数 */
  maxResults?: number;
}

/**
 * フォルダパス
 */
export interface FolderPath {
  /** 顧客ID */
  customerId: string;
  /** 顧客名 */
  customerName: string;
  /** 車両ID */
  vehicleId?: string;
  /** 車両名 */
  vehicleName?: string;
  /** ジョブID */
  jobId?: string;
  /** ジョブ日付 */
  jobDate?: string;
  /** 作業指示書ID */
  workOrderId?: string;
}

/**
 * コーティング事前見積データ
 */
export interface PreEstimateData {
  /** コーティング種類 */
  coatingType: "ハイモースコート エッジ" | "ハイモースコート グロウ" | "ガードグレイズ";
  /** 基本価格 */
  basePrice: number;
  /** 選択されたオプションIDリスト */
  selectedOptions: string[];
  /** オプション合計金額 */
  optionsTotal: number;
  /** 合計金額 */
  total: number;
  /** 作成日時 */
  createdAt: string;
  /** 送信日時 */
  sentAt: string;
}

/**
 * 使用状況アナリティクスイベント
 */
export interface UsageAnalytics {
  /** イベント種別 */
  eventType: string;
  /** 画面ID */
  screenId: string;
  /** ユーザーロール */
  userRole: string;
  /** タイムスタンプ */
  timestamp: number;
  /** 所要時間（ms） */
  duration?: number;
  /** 追加データ */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// 改善提案 #6: 過去の見積・案件の参照機能
// =============================================================================

/**
 * 過去の見積データ
 */
export interface HistoricalEstimate {
  /** 見積ID */
  id: string;
  /** ジョブID */
  jobId: string;
  /** 顧客名 */
  customerName: string;
  /** 車両名 */
  vehicleName: string;
  /** 見積項目 */
  items: EstimateItem[];
  /** 合計金額 */
  totalAmount: number;
  /** ステータス */
  status: string;
  /** 作成日時 */
  createdAt: string;
  /** 見積提出日時 */
  submittedAt?: string | null;
}

/**
 * 過去の案件データ
 */
export interface HistoricalJob {
  /** ジョブID */
  id: string;
  /** 顧客名 */
  customerName: string;
  /** 車両名 */
  vehicleName: string;
  /** ステータス */
  status: JobStage;
  /** 作成日時 */
  createdAt: string;
  /** 入庫日時 */
  arrivalDateTime?: string | null;
}

// =============================================================================
// 改善提案 #7: テンプレート機能
// =============================================================================

/**
 * 診断結果テンプレート項目
 */
export interface DiagnosisTemplateItem {
  /** 項目タイプ */
  type: "text" | "number" | "select" | "checkbox";
  /** ラベル */
  label: string;
  /** デフォルト値 */
  value: string | number | boolean;
  /** 選択肢（selectタイプの場合） */
  options?: string[];
}

/**
 * 診断結果テンプレート
 */
export interface DiagnosisTemplate {
  /** テンプレートID */
  id: string;
  /** テンプレート名 */
  name: string;
  /** カテゴリー */
  category: string | null;
  /** テンプレート項目 */
  items: DiagnosisTemplateItem[];
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
  /** 作成者 */
  createdBy: string;
}

/**
 * 見積項目テンプレート項目
 */
export interface EstimateTemplateItem {
  /** 項目名 */
  name: string;
  /** 説明 */
  description: string | null;
  /** 単価 */
  price: number;
  /** 数量 */
  quantity: number;
  /** 優先度 */
  priority: EstimatePriority;
}

/**
 * 見積項目テンプレート
 */
export interface EstimateTemplate {
  /** テンプレートID */
  id: string;
  /** テンプレート名 */
  name: string;
  /** カテゴリー */
  category: string | null;
  /** テンプレート項目 */
  items: EstimateTemplateItem[];
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
  /** 作成者 */
  createdBy: string;
}

// =============================================================================
// 改善提案 #10: 見積変更依頼の履歴管理機能
// =============================================================================

/**
 * 見積変更依頼
 */
export interface EstimateChangeRequest {
  /** 変更依頼ID */
  id: string;
  /** ジョブID */
  jobId: string;
  /** 依頼日時 */
  requestDate: string;
  /** 依頼者（お客様名） */
  requestedBy: string;
  /** 依頼タイプ */
  requestType: "add" | "remove" | "modify" | "price_change";
  /** 依頼内容 */
  requestContent: string;
  /** 変更前の見積項目 */
  originalEstimate: EstimateItem[];
  /** 依頼された見積項目 */
  requestedEstimate: EstimateItem[];
  /** ステータス */
  status: "pending" | "approved" | "rejected";
  /** 対応日時 */
  responseDate: string | null;
  /** 対応内容 */
  responseContent: string | null;
  /** 対応者 */
  handledBy: string | null;
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * ページビューイベント
 */
export interface PageViewEvent extends UsageAnalytics {
  /** ページパス */
  path?: string;
  /** ページタイトル */
  title?: string;
}

/**
 * アクションイベント
 */
export interface ActionEvent extends UsageAnalytics {
  /** アクション名 */
  actionName?: string;
  /** 結果 */
  result?: string;
  /** リソースID */
  resourceId?: string;
}

/**
 * エラーイベント
 */
export interface ErrorEvent extends UsageAnalytics {
  /** エラーコード */
  errorCode?: string;
  /** エラーメッセージ */
  errorMessage?: string;
  /** 発生場所 */
  location?: string;
}

/**
 * タイミングイベント
 */
export interface TimingEvent extends UsageAnalytics {
  /** 測定項目名 */
  timingName?: string;
  /** 対象 */
  target?: string;
}

/**
 * ワークオーダーステータス
 */
export type WorkOrderStatus =
  | "未開始"
  | "診断中"
  | "見積作成待ち"
  | "顧客承認待ち"
  | "作業待ち"
  | "作業中"
  | "完了";

/**
 * スマートタグステータス
 */
export type TagStatus = "available" | "in_use" | "maintenance" | "retired";

/**
 * セッションステータス
 */
export type SessionStatus = "active" | "closed";

/**
 * スマートタグシート行（Google Sheets）
 */
export interface TagSheetRow {
  /** タグID */
  タグID: string;
  /** QRコード */
  QRコード: string;
  /** ステータス */
  ステータス: TagStatus;
  /** 作成日時 */
  作成日時: string;
  /** 更新日時 */
  更新日時: string;
}

/**
 * セッションシート行（Google Sheets）
 */
export interface SessionSheetRow {
  /** セッションID */
  セッションID: string;
  /** タグID */
  タグID: string;
  /** Job ID */
  JobID: string;
  /** 紐付け日時 */
  紐付け日時: string;
  /** 解除日時 */
  解除日時: string | null;
  /** ステータス */
  ステータス: SessionStatus;
  /** 作成日時 */
  作成日時: string;
  /** 更新日時 */
  更新日時: string;
}

/**
 * ワークオーダー
 */
export interface WorkOrder {
  /** ワークオーダーID */
  id: string;
  /** ジョブID */
  jobId: string;
  /** 入庫区分 */
  serviceKind: ServiceKind;
  /** ステータス */
  status: WorkOrderStatus;
  /** 診断データ */
  diagnosis?: {
    items?: DiagnosisItem[];
    photos?: { position: string; url: string }[];
    mileage?: number;
    /** 診断担当者名 */
    mechanicName?: string | null;
    [key: string]: unknown;
  } | null;
  /** 見積データ */
  estimate?: {
    items?: EstimateItem[];
    [key: string]: unknown;
  } | null;
  /**
   * 作業データ
   * 
   * 作業工程の記録を管理するデータ構造。
   * - `records`: 工程ごとの作業記録（`WorkRecord[]`）
   * - `mechanicName`: 全体のデフォルト担当者（後方互換性のため残す）
   * - `completedAt`: 作業完了日時
   * - `coatingInfo`: コーティング作業固有の情報
   * 
   * @see WorkRecord 作業記録の詳細定義
   */
  work?: {
    /** 作業担当者名（全体のデフォルト担当者、後方互換性のため残す） */
    mechanicName?: string;
    /** 作業完了日時 */
    completedAt?: string;
    /** コーティング作業固有の情報 */
    coatingInfo?: {
      dryingProcess?: string;
      maintenancePeriod?: string;
      [key: string]: unknown;
    };
    /**
     * 作業記録（工程ごとに担当者を記録可能）
     * 
     * 各工程の作業内容、担当者、写真、コメントなどを記録する。
     * `WorkRecord`型の配列として管理される。
     * 
     * @see WorkRecord 作業記録の詳細定義
     */
    records?: WorkRecord[];
    [key: string]: unknown;
  } | null;
  /** 基幹システム連携ID */
  baseSystemItemId?: string | null;
  /** コスト情報 */
  cost?: {
    [key: string]: unknown;
  } | null;
  /** 診断料金（カスタムフィールド field23 または field7 に記録） */
  diagnosisFee?: number | null;
  /** 診断時間（概算・分）（参考情報） */
  diagnosisDuration?: number | null;
  /** 診断料金が事前に決まっているか */
  isDiagnosisFeePreDetermined?: boolean;
  /** メカニック承認済み */
  mechanicApproved?: boolean;
  /** 承認者名 */
  mechanicApprover?: string | null;
  /** 承認日時 */
  mechanicApprovedAt?: string | null; // ISO8601
  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 作業記録（工程ごとに担当者を記録可能）
 * 
 * `WorkOrder.work.records`の配列要素として使用される。
 * 各工程の作業内容、担当者、写真、コメントなどを記録する。
 * 
 * @example
 * ```typescript
 * const workRecord: WorkRecord = {
 *   time: "2025-01-20T10:00:00Z",
 *   content: "エンジンオイル交換",
 *   mechanicName: "山田太郎",
 *   photos: [
 *     { type: "before", url: "https://...", fileId: "file123" },
 *     { type: "after", url: "https://...", fileId: "file124" }
 *   ],
 *   comment: "オイルの状態良好",
 *   completed: true,
 *   completedAt: "2025-01-20T10:30:00Z"
 * };
 * ```
 * 
 * @see WorkOrder.work WorkOrderの作業データ定義
 */
export interface WorkRecord {
  /** 記録日時 */
  time: string; // ISO8601
  /** 作業内容 */
  content: string;
  /** 写真リスト */
  photos?: Array<{
    type: "before" | "after";
    url: string;
    fileId?: string;
  }>;
  /** コメント */
  comment?: string;
  /** 担当者名（工程ごとの担当者） */
  mechanicName?: string | null;
  /** 完了フラグ */
  completed?: boolean;
  /** 完了日時 */
  completedAt?: string; // ISO8601
}

// =============================================================================
// 新機能拡張型定義
// =============================================================================

/**
 * 部品項目
 * 改善提案 #3: 部品調達待ち案件の管理機能
 */
export interface PartItem {
  /** 部品ID */
  id: string;
  /** 部品名 */
  name: string;
  /** 部品番号 */
  partNumber?: string | null;
  /** 数量 */
  quantity: number;
  /** 単価 */
  unitPrice?: number | null;
  /** サプライヤー（発注先） */
  supplier?: string | null;
  /** 発注日 */
  orderDate?: string | null; // ISO8601
  /** 到着予定日 */
  expectedArrivalDate?: string | null; // ISO8601
  /** 実際の到着日 */
  actualArrivalDate?: string | null; // ISO8601
  /** ステータス */
  status: "not_ordered" | "ordered" | "shipping" | "arrived";
  /** 在庫場所（棚番号） */
  storageLocation?: string | null; // "A-1", "B-3" など
  /** 発注先（後方互換性のため残す） */
  vendor?: string | null;
  /** 到着状況（後方互換性のため残す） */
  arrivalStatus?: "未到着" | "到着済み";
  /** 到着日時（後方互換性のため残す） */
  arrivalDate?: string | null; // ISO8601
}

/**
 * 部品情報
 * 改善提案 #3: 部品調達待ち案件の管理機能
 */
export interface PartsInfo {
  /** 部品リスト */
  parts: PartItem[];
  /** 到着予定日（全体） */
  expectedArrivalDate?: string | null; // ISO8601
  /** 調達状況 */
  procurementStatus: "not_ordered" | "ordered" | "shipping" | "arrived";
  /** 最終更新日時 */
  lastUpdatedAt: string; // ISO8601
}

/**
 * 作業メモ
 */
export interface JobMemo {
  /** メモID */
  id: string;
  /** ジョブID */
  jobId: string;
  /** メモ内容 */
  content: string;
  /** 作成者名 */
  author: string;
  /** 作成日時 */
  createdAt: string; // ISO8601
  /** 更新日時 */
  updatedAt?: string | null; // ISO8601
}

/**
 * 車検チェックリスト
 */
export interface InspectionChecklist {
  /** ジョブID */
  jobId: string;
  /** 入庫時チェック項目 */
  entryItems: {
    vehicleRegistration: boolean; // 車検証
    compulsoryInsurance: boolean; // 自賠責
    automobileTax: boolean; // 自動車税
    key: boolean; // 鍵
    wheelLockNut: boolean; // ホイールロックナット（有れば）
    etcCard: boolean; // 車内ETCカード
    valuables: boolean; // 車内貴重品
  };
  /** 出庫時チェック項目 */
  checkoutItems: {
    vehicleRegistration: boolean; // 車検証
    inspectionRecord: boolean; // 自動車検査証記録事項
    compulsoryInsurance: boolean; // 自賠責
    recordBook: boolean; // 記録簿
    key: boolean; // 鍵
    wheelLockNut: boolean; // ホイールロックナット（有れば）
    etcCardRemoved: boolean; // ETCカード抜き忘れ
    wheelTightening: boolean; // ホイール増し締め（お客様と確認）
  };
  /** 入庫時備考 */
  entryNote?: string | null;
  /** 出庫時備考 */
  checkoutNote?: string | null;
  /** 入庫時チェック完了日時 */
  entryCheckedAt?: string | null; // ISO8601
  /** 出庫時チェック完了日時 */
  checkoutCheckedAt?: string | null; // ISO8601
}

/**
 * 作業指示書PDFデータ
 */
export interface WorkOrderPDFData {
  /** ジョブID */
  jobId: string;
  /** 顧客名 */
  customerName: string;
  /** 車両情報 */
  vehicleInfo: {
    name: string; // 車名
    licensePlate: string; // ナンバープレート
  };
  /** 入庫日時 */
  entryDate: string; // ISO8601
  /** 受付メモ（旧: 作業指示内容） */
  workOrder: string | null;
  /** サービス種別 */
  serviceKind: ServiceKind;
  /** 担当整備士 */
  assignedMechanic?: string | null;
  /** 顧客からの申し送り事項 */
  customerNotes?: string | null;
  /** 生成日時 */
  generatedAt: string; // ISO8601
  /** 走行距離 */
  mileage?: number | null;
  /** スマートタグID */
  tagId?: string | null;
  /** 代車情報 */
  courtesyCar?: {
    name: string;
    licensePlate?: string;
  } | null;
  /** 承認済み作業内容（作業待ち以降） */
  approvedWorkItems?: string | null;
  /** 過去の作業履歴（オプション） */
  historicalJobs?: Array<{
    date: string;
    serviceKind: string;
    summary: string;
  }> | null;
}

// =============================================================================
// 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
// =============================================================================

/**
 * エラーコード
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 */
export interface ErrorCode {
  /** エラーコードID */
  id?: string;
  /** エラーコード（例: "P0301"） */
  code: string;
  /** エラーコードの説明 */
  description?: string | null;
  /** 重要度 */
  severity: "low" | "medium" | "high";
  /** ステータス */
  status: "active" | "resolved" | "pending";
  /** 対処法 */
  resolution?: string | null;
  /** 関連写真URL */
  photos?: string[];
}

/**
 * OBD診断結果（拡張版）
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 */
export interface EnhancedOBDDiagnosticResult {
  /** エラーコードリスト */
  errorCodes: ErrorCode[];
  /** 診断日時 */
  diagnosticDate: string; // ISO8601
  /** 診断ツール名 */
  diagnosticTool?: string | null;
  /** 備考 */
  notes?: string | null;
  /** PDFファイルID（既存の互換性のため） */
  fileId?: string;
  /** PDFファイル名（既存の互換性のため） */
  fileName?: string;
  /** PDFファイルURL（既存の互換性のため） */
  fileUrl?: string;
}

/**
 * レストア工程
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 */
export interface RestorePhase {
  /** 工程ID */
  id: string;
  /** 工程名（例: "エンジン分解"） */
  name: string;
  /** 進捗率（0-100） */
  progress: number;
  /** 開始日 */
  startDate?: string | null; // ISO8601
  /** 予定終了日 */
  expectedEndDate?: string | null; // ISO8601
  /** 実際の終了日 */
  actualEndDate?: string | null; // ISO8601
  /** ステータス */
  status: "not_started" | "in_progress" | "completed";
  /** 備考 */
  notes?: string | null;
}

/**
 * レストア作業進捗
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 */
export interface RestoreProgress {
  /** 全体の進捗率（0-100） */
  overallProgress: number;
  /** 各工程の進捗 */
  phases: RestorePhase[];
  /** 最終更新日時 */
  lastUpdatedAt: string; // ISO8601
}

/**
 * 品質検査項目
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 */
export interface QualityInspectionItem {
  /** 検査項目ID */
  id: string;
  /** 検査項目名 */
  name: string;
  /** カテゴリー */
  category: string;
  /** 検査結果 */
  result: "pass" | "fail" | "pending" | "not_applicable";
  /** 備考 */
  notes?: string | null;
  /** 関連写真URL */
  photos?: string[];
}

/**
 * 品質管理・最終検査
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 */
export interface QualityInspection {
  /** 検査項目リスト */
  items: QualityInspectionItem[];
  /** 検査日時 */
  inspectionDate: string; // ISO8601
  /** 検査者名 */
  inspector: string;
  /** 総合判定 */
  overallResult: "pass" | "fail" | "pending";
  /** 備考 */
  notes?: string | null;
}

/**
 * メーカー問い合わせ項目
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 */
export interface InquiryItem {
  /** 問い合わせID */
  id: string;
  /** 問い合わせ日時 */
  inquiryDate: string; // ISO8601
  /** 問い合わせ内容 */
  inquiryContent: string;
  /** 問い合わせ方法 */
  inquiryMethod: "email" | "phone" | "fax" | "other";
  /** メーカー名 */
  manufacturer: string;
  /** 担当者名 */
  contactPerson?: string | null;
  /** 回答日時 */
  responseDate?: string | null; // ISO8601
  /** 回答内容 */
  responseContent?: string | null;
  /** ステータス */
  status: "pending" | "responded" | "resolved";
  /** 添付ファイルURL */
  attachments?: string[];
}

/**
 * メーカー問い合わせ
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 */
export interface ManufacturerInquiry {
  /** 問い合わせリスト */
  inquiries: InquiryItem[];
  /** 最終更新日時 */
  lastUpdatedAt: string; // ISO8601
}

// =============================================================================
// 改善提案 #5: 詳細情報の表示機能の強化 - スキルレベル管理
// =============================================================================

/**
 * スキル項目
 */
export interface SkillItem {
  /** カテゴリー（例: "エンジン"、"ブレーキ"、"電装"） */
  category: string;
  /** スキルレベル（0-100） */
  level: number;
  /** 経験年数 */
  experience: number;
  /** 資格・認定 */
  certifications: string[];
}

/**
 * 整備士スキル情報
 */
export interface MechanicSkill {
  /** 整備士ID（整備士名をIDとして使用） */
  mechanicId: string;
  /** 整備士名 */
  mechanicName: string;
  /** スキル項目リスト */
  skills: SkillItem[];
  /** 全体のスキルレベル（0-100、skillsの平均値） */
  overallLevel: number;
  /** 最終更新日時 */
  lastUpdatedAt: string; // ISO8601
}

// =============================================================================
// Diagnosis Types
// =============================================================================

export type PhotoPositionKey = string;

export interface DiagnosisPhoto {
  id: string;
  position: PhotoPositionKey | string;
  label: string;
  url: string;
  previewUrl?: string;
}

export interface DiagnosisVideo {
  id: string;
  position: string;
  label: string;
  url: string;
}