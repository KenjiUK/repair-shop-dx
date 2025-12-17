/**
 * 擬似データベース (Mock Database)
 * 
 * アプリ全体で共有するモックデータを定義
 * 実際のZoho CRM/Google Sheetsの代わりに使用
 */

import {
  ZohoJob,
  ZohoCustomer,
  ZohoVehicle,
  ZohoLookup,
  SmartTag,
  DiagnosisItem,
  EstimateItem,
} from "@/types";

// =============================================================================
// 顧客データ (Contacts)
// =============================================================================

export const customers: ZohoCustomer[] = [
  {
    id: "cust-001",
    ID1: "K1001",
    customerId: "K1001",
    Last_Name: "田中",
    lastName: "田中",
    First_Name: "太郎",
    firstName: "太郎",
    Business_Messaging_Line_Id: "tanaka_taro_line",
    lineId: "tanaka_taro_line",
    Email_Opt_Out: false,
    emailOptOut: false,
    Date_of_Birth: "1975-06-15",
    dateOfBirth: "1975-06-15",
    Mailing_Street: "東京都品川区東品川",
    mailingStreet: "東京都品川区東品川",
    field4: "2-3-5",
    addressNumber: "2-3-5",
    field6: "品川シーサイドビル 501",
    buildingName: "品川シーサイドビル 501",
    Phone: "03-1234-5678",
    phone: "03-1234-5678",
    Mobile: "090-1234-5678",
    mobile: "090-1234-5678",
    Description: null,
    description: null,
    Booking_Phone_Temp: null,
    bookingPhoneTemp: null,
  },
  {
    id: "cust-002",
    ID1: "K1002",
    customerId: "K1002",
    Last_Name: "佐藤",
    lastName: "佐藤",
    First_Name: "花子",
    firstName: "花子",
    Business_Messaging_Line_Id: null,
    lineId: null,
    Email_Opt_Out: false,
    emailOptOut: false,
    Date_of_Birth: "1982-03-20",
    dateOfBirth: "1982-03-20",
    Mailing_Street: "神奈川県横浜市港北区新横浜",
    mailingStreet: "神奈川県横浜市港北区新横浜",
    field4: "1-10-8",
    addressNumber: "1-10-8",
    field6: null,
    buildingName: null,
    Phone: "045-123-4567",
    phone: "045-123-4567",
    Mobile: "080-2345-6789",
    mobile: "080-2345-6789",
    Description: null,
    description: null,
    Booking_Phone_Temp: null,
    bookingPhoneTemp: null,
  },
  {
    id: "cust-003",
    ID1: "K1003",
    customerId: "K1003",
    Last_Name: "鈴木",
    lastName: "鈴木",
    First_Name: "一郎",
    firstName: "一郎",
    Business_Messaging_Line_Id: "suzuki_ichiro",
    lineId: "suzuki_ichiro",
    Email_Opt_Out: true,
    emailOptOut: true,
    Date_of_Birth: "1990-11-05",
    dateOfBirth: "1990-11-05",
    Mailing_Street: "神奈川県川崎市中原区武蔵小杉",
    mailingStreet: "神奈川県川崎市中原区武蔵小杉",
    field4: "3-2-1",
    addressNumber: "3-2-1",
    field6: "タワーマンション 1502",
    buildingName: "タワーマンション 1502",
    Phone: null,
    phone: null,
    Mobile: "070-3456-7890",
    mobile: "070-3456-7890",
    Description: null,
    description: null,
    Booking_Phone_Temp: null,
    bookingPhoneTemp: null,
  },
  {
    id: "cust-004",
    ID1: "K1004",
    customerId: "K1004",
    Last_Name: "高橋",
    lastName: "高橋",
    First_Name: "美咲",
    firstName: "美咲",
    Business_Messaging_Line_Id: null,
    lineId: null,
    Email_Opt_Out: false,
    emailOptOut: false,
    Date_of_Birth: "1988-09-12",
    dateOfBirth: "1988-09-12",
    Mailing_Street: "東京都世田谷区三軒茶屋",
    mailingStreet: "東京都世田谷区三軒茶屋",
    field4: "4-5-6",
    addressNumber: "4-5-6",
    field6: null,
    buildingName: null,
    Phone: "03-9876-5432",
    phone: "03-9876-5432",
    Mobile: "090-4567-8901",
    mobile: "090-4567-8901",
    Description: "【アプリ変更届】携帯番号を080-9999-0000に変更希望",
    description: "【アプリ変更届】携帯番号を080-9999-0000に変更希望",
    Booking_Phone_Temp: null,
    bookingPhoneTemp: null,
  },
  {
    id: "cust-005",
    ID1: "K1005",
    customerId: "K1005",
    Last_Name: "伊藤",
    lastName: "伊藤",
    First_Name: "健太",
    firstName: "健太",
    Business_Messaging_Line_Id: "ito_kenta",
    lineId: "ito_kenta",
    Email_Opt_Out: false,
    emailOptOut: false,
    Date_of_Birth: "1995-01-25",
    dateOfBirth: "1995-01-25",
    Mailing_Street: "東京都渋谷区恵比寿",
    mailingStreet: "東京都渋谷区恵比寿",
    field4: "1-2-3",
    addressNumber: "1-2-3",
    field6: "恵比寿ガーデンプレイス 802",
    buildingName: "恵比寿ガーデンプレイス 802",
    Phone: null,
    phone: null,
    Mobile: "080-5678-9012",
    mobile: "080-5678-9012",
    Description: null,
    description: null,
    Booking_Phone_Temp: null,
    bookingPhoneTemp: null,
  },
];

// =============================================================================
// 車両データ (CustomModule1)
// =============================================================================

export const vehicles: ZohoVehicle[] = [
  {
    id: "veh-001",
    Name: "V001",
    vehicleId: "V001",
    field44: "品川 300 あ 1234",
    licensePlate: "品川 300 あ 1234",
    ID1: "K1001",
    customerId: "K1001",
    field7: "2025-12-15",
    inspectionExpiry: "2025-12-15",
  },
  {
    id: "veh-002",
    Name: "V002",
    vehicleId: "V002",
    field44: "横浜 500 さ 5678",
    licensePlate: "横浜 500 さ 5678",
    ID1: "K1002",
    customerId: "K1002",
    field7: "2025-06-20",
    inspectionExpiry: "2025-06-20",
  },
  {
    id: "veh-003",
    Name: "V003",
    vehicleId: "V003",
    field44: "川崎 580 た 9012",
    licensePlate: "川崎 580 た 9012",
    ID1: "K1003",
    customerId: "K1003",
    field7: "2025-01-10",
    inspectionExpiry: "2025-01-10",
  },
  {
    id: "veh-004",
    Name: "V004",
    vehicleId: "V004",
    field44: "世田谷 330 な 3456",
    licensePlate: "世田谷 330 な 3456",
    ID1: "K1004",
    customerId: "K1004",
    field7: "2025-08-30",
    inspectionExpiry: "2025-08-30",
  },
  {
    id: "veh-005",
    Name: "V005",
    vehicleId: "V005",
    field44: "渋谷 500 ま 7890",
    licensePlate: "渋谷 500 ま 7890",
    ID1: "K1005",
    customerId: "K1005",
    field7: "2025-04-15",
    inspectionExpiry: "2025-04-15",
  },
];

// =============================================================================
// 案件データ (CustomModule2) - 全ステータスを網羅
// =============================================================================

// 今日の日付を取得してISO形式に変換
const today = new Date();
const todayISO = today.toISOString();

export const jobs: ZohoJob[] = [
  // === Phase 1: 入庫済み（本日の予約、まだチェックインしていない） ===
  {
    id: "job-001",
    field22: todayISO.replace(/T.*/, "T09:00:00+09:00"),
    arrivalDateTime: todayISO.replace(/T.*/, "T09:00:00+09:00"),
    field5: "入庫済み",
    stage: "入庫済み",
    field4: { id: "cust-001", name: "田中 太郎" } as ZohoLookup,
    customer: { id: "cust-001", name: "田中 太郎" } as ZohoLookup,
    field6: { id: "veh-001", name: "BMW X3 / 品川 300 あ 1234" } as ZohoLookup,
    vehicle: { id: "veh-001", name: "BMW X3 / 品川 300 あ 1234" } as ZohoLookup,
    field: null,
    workOrder: null,
    field7: "ブレーキから異音がする。高速道路走行時に振動を感じる。",
    details: "ブレーキから異音がする。高速道路走行時に振動を感じる。",
    field10: 45000,
    mileage: 45000,
    field13: null,
    approvedWorkItems: null,
    field19: null,
    customerFolderUrl: null,
    ID_BookingId: "booking-001",
    bookingId: "booking-001",
    field12: null,
    attachments: null,
    tagId: null,
  },

  // === Phase 1: 入庫済み（作業指示あり） ===
  {
    id: "job-002",
    field22: todayISO.replace(/T.*/, "T10:30:00+09:00"),
    arrivalDateTime: todayISO.replace(/T.*/, "T10:30:00+09:00"),
    field5: "入庫済み",
    stage: "入庫済み",
    field4: { id: "cust-002", name: "佐藤 花子" } as ZohoLookup,
    customer: { id: "cust-002", name: "佐藤 花子" } as ZohoLookup,
    field6: { id: "veh-002", name: "トヨタ プリウス / 横浜 500 さ 5678" } as ZohoLookup,
    vehicle: { id: "veh-002", name: "トヨタ プリウス / 横浜 500 さ 5678" } as ZohoLookup,
    field: "ワイパーゴム交換も併せて確認してください（電話依頼）",
    workOrder: "ワイパーゴム交換も併せて確認してください（電話依頼）",
    field7: null,
    details: null,
    field10: null,
    mileage: null,
    field13: null,
    approvedWorkItems: null,
    field19: null,
    customerFolderUrl: null,
    ID_BookingId: "booking-002",
    bookingId: "booking-002",
    field12: null,
    attachments: null,
    tagId: null,
  },

  // === Phase 2/3: 見積作成待ち（診断完了、タグ紐付け済み） ===
  {
    id: "job-003",
    field22: todayISO.replace(/T.*/, "T08:00:00+09:00"),
    arrivalDateTime: todayISO.replace(/T.*/, "T08:00:00+09:00"),
    field5: "見積作成待ち",
    stage: "見積作成待ち",
    field4: { id: "cust-003", name: "鈴木 一郎" } as ZohoLookup,
    customer: { id: "cust-003", name: "鈴木 一郎" } as ZohoLookup,
    field6: { id: "veh-003", name: "ホンダ N-BOX / 川崎 580 た 9012" } as ZohoLookup,
    vehicle: { id: "veh-003", name: "ホンダ N-BOX / 川崎 580 た 9012" } as ZohoLookup,
    field: "車検のため代車必要。コンパクトカー希望。",
    workOrder: "車検のため代車必要。コンパクトカー希望。",
    field7: "エアコンの効きが悪い気がする。車検と一緒に見てほしい。",
    details: "エアコンの効きが悪い気がする。車検と一緒に見てほしい。",
    field10: 78500,
    mileage: 78500,
    field13: null,
    approvedWorkItems: null,
    field19: "https://drive.google.com/drive/folders/xxx",
    customerFolderUrl: "https://drive.google.com/drive/folders/xxx",
    ID_BookingId: "booking-003",
    bookingId: "booking-003",
    field12: null,
    attachments: null,
    tagId: "03",
  },

  // === Phase 4/5: 作業待ち（見積承認済み、作業開始待ち） ===
  {
    id: "job-004",
    field22: todayISO.replace(/T.*/, "T07:30:00+09:00"),
    arrivalDateTime: todayISO.replace(/T.*/, "T07:30:00+09:00"),
    field5: "作業待ち",
    stage: "作業待ち",
    field4: { id: "cust-004", name: "高橋 美咲" } as ZohoLookup,
    customer: { id: "cust-004", name: "高橋 美咲" } as ZohoLookup,
    field6: { id: "veh-004", name: "メルセデス Cクラス / 世田谷 330 な 3456" } as ZohoLookup,
    vehicle: { id: "veh-004", name: "メルセデス Cクラス / 世田谷 330 な 3456" } as ZohoLookup,
    field: null,
    workOrder: null,
    field7: "定期点検希望。特に気になる点はなし。",
    details: "定期点検希望。特に気になる点はなし。",
    field10: 32000,
    mileage: 32000,
    field13: "法定12ヶ月点検: ¥15,000\nエンジンオイル交換: ¥5,500\nオイルフィルター交換: ¥2,200",
    approvedWorkItems: "法定12ヶ月点検: ¥15,000\nエンジンオイル交換: ¥5,500\nオイルフィルター交換: ¥2,200",
    field19: "https://drive.google.com/drive/folders/yyy",
    customerFolderUrl: "https://drive.google.com/drive/folders/yyy",
    ID_BookingId: "booking-004",
    bookingId: "booking-004",
    field12: null,
    attachments: null,
    tagId: "05",
  },

  // === Phase 5/6: 出庫待ち（作業完了、お客様待ち） ===
  {
    id: "job-005",
    field22: todayISO.replace(/T.*/, "T11:00:00+09:00"),
    arrivalDateTime: todayISO.replace(/T.*/, "T11:00:00+09:00"),
    field5: "出庫待ち",
    stage: "出庫待ち",
    field4: { id: "cust-005", name: "伊藤 健太" } as ZohoLookup,
    customer: { id: "cust-005", name: "伊藤 健太" } as ZohoLookup,
    field6: { id: "veh-005", name: "マツダ CX-5 / 渋谷 500 ま 7890" } as ZohoLookup,
    vehicle: { id: "veh-005", name: "マツダ CX-5 / 渋谷 500 ま 7890" } as ZohoLookup,
    field: null,
    workOrder: null,
    field7: "タイヤ交換希望（スタッドレスから夏タイヤへ）",
    details: "タイヤ交換希望（スタッドレスから夏タイヤへ）",
    field10: 55000,
    mileage: 55000,
    field13: "タイヤ履き替え（4本）: ¥4,400\nタイヤバランス調整: ¥2,200\nブレーキ点検: ¥3,300",
    approvedWorkItems: "タイヤ履き替え（4本）: ¥4,400\nタイヤバランス調整: ¥2,200\nブレーキ点検: ¥3,300",
    field19: "https://drive.google.com/drive/folders/zzz",
    customerFolderUrl: "https://drive.google.com/drive/folders/zzz",
    ID_BookingId: "booking-005",
    bookingId: "booking-005",
    field12: null,
    attachments: null,
    tagId: "07",
  },

  // === 過去データ: 出庫済み（完了済み案件） ===
  {
    id: "job-006",
    field22: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, "T10:00:00+09:00"),
    arrivalDateTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, "T10:00:00+09:00"),
    field5: "出庫済み",
    stage: "出庫済み",
    field4: { id: "cust-001", name: "田中 太郎" } as ZohoLookup,
    customer: { id: "cust-001", name: "田中 太郎" } as ZohoLookup,
    field6: { id: "veh-001", name: "BMW X3 / 品川 300 あ 1234" } as ZohoLookup,
    vehicle: { id: "veh-001", name: "BMW X3 / 品川 300 あ 1234" } as ZohoLookup,
    field: null,
    workOrder: null,
    field7: "オイル交換希望",
    details: "オイル交換希望",
    field10: 42000,
    mileage: 42000,
    field13: "エンジンオイル交換: ¥5,500\nオイルフィルター交換: ¥2,200",
    approvedWorkItems: "エンジンオイル交換: ¥5,500\nオイルフィルター交換: ¥2,200",
    field19: "https://drive.google.com/drive/folders/past",
    customerFolderUrl: "https://drive.google.com/drive/folders/past",
    ID_BookingId: "booking-006",
    bookingId: "booking-006",
    field12: null,
    attachments: null,
    tagId: null,
  },
];

// =============================================================================
// スマートタグデータ
// =============================================================================

export const smartTags: SmartTag[] = [
  { tagId: "01", jobId: null, linkedAt: null, status: "available" },
  { tagId: "02", jobId: null, linkedAt: null, status: "available" },
  { tagId: "03", jobId: "job-003", linkedAt: todayISO, status: "in_use" },
  { tagId: "05", jobId: "job-004", linkedAt: todayISO, status: "in_use" },
  { tagId: "06", jobId: null, linkedAt: null, status: "available" },
  { tagId: "07", jobId: "job-005", linkedAt: todayISO, status: "in_use" },
  { tagId: "08", jobId: null, linkedAt: null, status: "available" },
  { tagId: "10", jobId: null, linkedAt: null, status: "available" },
];

// =============================================================================
// 診断データ（サンプル）
// =============================================================================

export const sampleDiagnosisItems: DiagnosisItem[] = [
  { id: "tire-front", name: "タイヤ（前輪）", category: "足回り", status: "yellow", comment: "溝残り3mm。次回交換推奨。", evidencePhotoUrls: [], evidenceVideoUrl: null },
  { id: "tire-rear", name: "タイヤ（後輪）", category: "足回り", status: "green", comment: null, evidencePhotoUrls: [], evidenceVideoUrl: null },
  { id: "brake-pad", name: "ブレーキパッド", category: "ブレーキ", status: "red", comment: "残量2mm。即交換必要。", evidencePhotoUrls: ["https://example.com/brake.jpg"], evidenceVideoUrl: null },
  { id: "brake-disc", name: "ブレーキディスク", category: "ブレーキ", status: "green", comment: null, evidencePhotoUrls: [], evidenceVideoUrl: null },
  { id: "engine-oil", name: "エンジンオイル", category: "エンジン", status: "yellow", comment: "やや汚れあり。交換推奨。", evidencePhotoUrls: [], evidenceVideoUrl: null },
  { id: "battery", name: "バッテリー", category: "電装", status: "green", comment: "電圧正常。", evidencePhotoUrls: [], evidenceVideoUrl: null },
  { id: "wiper", name: "ワイパーゴム", category: "外装", status: "yellow", comment: "拭きムラあり。", evidencePhotoUrls: [], evidenceVideoUrl: null },
];

// =============================================================================
// 見積データ（サンプル）
// =============================================================================

export const sampleEstimateItems: EstimateItem[] = [
  { id: "est-1", name: "法定12ヶ月点検", price: 15000, priority: "required", selected: true, linkedPhotoUrls: [], linkedVideoUrl: null, note: null },
  { id: "est-2", name: "エンジンオイル交換", price: 5500, priority: "required", selected: true, linkedPhotoUrls: [], linkedVideoUrl: null, note: "前回交換から5,000km経過" },
  { id: "est-3", name: "Fブレーキパッド交換", price: 33000, priority: "recommended", selected: true, linkedPhotoUrls: ["https://example.com/brake.jpg"], linkedVideoUrl: null, note: "残量2mm。安全のため交換推奨。" },
  { id: "est-4", name: "タイヤローテーション", price: 3300, priority: "recommended", selected: true, linkedPhotoUrls: [], linkedVideoUrl: null, note: "前輪の偏摩耗防止" },
  { id: "est-5", name: "ワイパーゴム交換", price: 2200, priority: "recommended", selected: false, linkedPhotoUrls: [], linkedVideoUrl: null, note: "拭きムラ発生中" },
  { id: "est-6", name: "エアコンフィルター交換", price: 4400, priority: "optional", selected: false, linkedPhotoUrls: [], linkedVideoUrl: null, note: "花粉シーズン前の交換推奨" },
];

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 顧客IDから顧客データを取得
 */
export function getCustomerById(customerId: string): ZohoCustomer | undefined {
  return customers.find((c) => c.id === customerId || c.ID1 === customerId);
}

/**
 * 車両IDから車両データを取得
 */
export function getVehicleById(vehicleId: string): ZohoVehicle | undefined {
  return vehicles.find((v) => v.id === vehicleId || v.Name === vehicleId);
}

/**
 * ジョブIDからジョブデータを取得
 */
export function getJobById(jobId: string): ZohoJob | undefined {
  return jobs.find((j) => j.id === jobId);
}

/**
 * 利用可能なタグを取得
 */
export function getAvailableTags(): SmartTag[] {
  return smartTags.filter((t) => t.status === "available");
}

/**
 * 今日の案件を取得
 */
export function getTodayJobs(): ZohoJob[] {
  const todayStr = new Date().toISOString().split("T")[0];
  return jobs.filter((j) => j.field22.startsWith(todayStr));
}

