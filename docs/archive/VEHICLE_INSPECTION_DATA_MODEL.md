# 車検（法定24ヶ月点検）データモデル設計書

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **対象**: 車検（法定24ヶ月点検）のデータ構造とAPI設計

---

## 1. データモデル概要

### 1-1. エンティティ関係図

```
ZohoJob (CustomModule2)
  ├── InspectionData (診断データ)
  │   ├── InspectionItem[] (検査項目)
  │   ├── Measurements (測定値)
  │   ├── ReplacedParts[] (交換部品)
  │   └── OtherItems (その他)
  ├── VehicleInfo (車両情報) ← Google Sheets「【DB】車両マスタ」
  ├── LegalFees (法定費用) ← Google Sheets「車両_同期用」
  └── PDF (分解整備記録簿) → Google Drive
```

---

## 2. データ構造定義

### 2-1. InspectionItem（検査項目）

```typescript
/**
 * 検査項目
 */
interface InspectionItem {
  /** 項目ID（一意） */
  id: string;
  
  /** カテゴリ */
  category: InspectionCategory;
  
  /** サブカテゴリ（例: "パワー・ステアリング"） */
  subCategory: string;
  
  /** 項目名（例: "ベルトの緩み、損傷"） */
  itemName: string;
  
  /** 状態 */
  status: InspectionStatus | null;
  
  /** 測定値（該当する場合） */
  measurement?: number;
  
  /** 写真URLの配列 */
  photos: string[];
  
  /** コメント */
  comment?: string;
  
  /** 省略規則（☆: 1年5,000km以下、★: 2年10,000km以下） */
  skipRule?: "☆" | "★";
  
  /** 法定項目かどうか */
  isRequired: boolean;
  
  /** 作成日時 */
  createdAt: string;
  
  /** 更新日時 */
  updatedAt: string;
}

/**
 * カテゴリ（車検用）
 * PDFテンプレート（24か月点検用テンプレート.pdf）に基づく
 */
type InspectionCategory =
  | "エンジン・ルーム点検"
  | "室内点検"
  | "足廻り点検"
  | "下廻り点検"
  | "外廻り点検"
  | "日常点検";

/**
 * 車検の場合のカテゴリ一覧
 * PDFテンプレートに基づき、6つのカテゴリ全てが必要
 */
const VEHICLE_INSPECTION_CATEGORIES: InspectionCategory[] = [
  "エンジン・ルーム点検",  // デフォルト選択
  "室内点検",
  "足廻り点検",
  "下廻り点検",
  "外廻り点検",
  "日常点検",
];

/**
 * 状態
 */
type InspectionStatus =
  | "正常"      // OK
  | "注意"      // Warning
  | "要交換"    // Bad
  | "調整"      // Adjust
  | "清掃"      // Clean
  | "省略"      // Skip
  | "該当なし";  // N/A
```

### 2-2. Measurements（測定値）

```typescript
/**
 * 測定値
 */
interface Measurements {
  /** CO濃度（アイドリング時、%） */
  co: number | null;
  
  /** HC濃度（アイドリング時、ppm） */
  hc: number | null;
  
  /** タイヤの溝の深さ（1.6mm以上） */
  tireDepth: {
    前輪左: number | null;
    前輪右: number | null;
    後輪左: number | null;
    後輪右: number | null;
  };
  
  /** ブレーキ・パッド、ライニングの厚さ（mm） */
  brakePadThickness: {
    前輪左: number | null;
    前輪右: number | null;
    後輪左: number | null;
    後輪右: number | null;
  };
  
  /** 測定値の写真URL */
  photos: {
    coHc?: string[];           // CO・HC濃度測定の写真
    tireDepth?: string[];      // タイヤ溝深さ測定の写真
    brakePad?: string[];       // ブレーキパッド測定の写真
  };
}
```

### 2-3. DiagnosisPart（診断時の交換部品）

```typescript
/**
 * 診断時の交換部品（見積もり用）
 */
interface DiagnosisPart {
  /** 部品名（例: "フロントブレーキパッド"） */
  itemName: string;
  
  /** カテゴリ（どの検査項目から提案されたか） */
  category: InspectionCategory;
  
  /** 関連する検査項目ID */
  relatedItemId: string;
  
  /** 推奨理由（例: "残り2mm。危険です"） */
  reason?: string;
  
  /** 緊急度 */
  urgency: "緊急" | "推奨" | "任意";
  
  /** 写真URLの配列 */
  photos: string[];
  
  /** 動画URLの配列 */
  videos: string[];
  
  /** 作成日時 */
  createdAt: string;
}
```

### 2-4. ReplacedParts（交換部品・作業完了時）

```typescript
/**
 * 交換部品（作業完了時）
 */
interface ReplacedPart {
  /** 部品名（例: "エンジン・オイル"） */
  itemName: string;
  
  /** 数量 */
  quantity: number;
  
  /** 単位（例: "l", "個", "本"） */
  unit: string;
  
  /** 作成日時 */
  createdAt: string;
}
```

### 2-5. InspectionData（診断データ全体）

```typescript
/**
 * 診断データ
 */
interface InspectionData {
  /** Job ID（Zoho CRMのCustomModule2.id） */
  jobId: string;
  
  /** 車両ID（Zoho CRMのCustomModule1.Name） */
  vehicleId: string;
  
  /** 整備主任者の氏名 */
  mechanicName: string;
  
  /** 検査項目の配列 */
  items: InspectionItem[];
  
  /** 測定値 */
  measurements: Measurements;
  
  /** 診断時の交換部品リスト（見積もり用） */
  diagnosisParts: DiagnosisPart[];
  
  /** 交換部品の配列（作業完了時） */
  replacedParts: ReplacedPart[];
  
  /** その他の点検項目等（自由記述） */
  otherItems?: string;
  
  /** 点検の年月日 */
  inspectionDate: string;
  
  /** 整備完了年月日 */
  completionDate: string | null;
  
  /** 点検(整備)時の総走行距離（km） */
  totalMileage: number;
  
  /** ステータス */
  status: InspectionStatus;
  
  /** 作成日時 */
  createdAt: string;
  
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 診断ステータス
 */
type InspectionStatus =
  | "入力中"
  | "診断完了"
  | "見積提示済み"
  | "顧客承認待ち"
  | "作業中"
  | "作業完了";
```

### 2-5. VehicleInfo（車両情報）

```typescript
/**
 * 車両情報（分解整備記録簿のヘッダー用）
 */
interface VehicleInfo {
  /** 依頼者(使用者)の氏名又は名称 */
  依頼者氏名: string;
  
  /** 車名及び型式 */
  車名及び型式: string;
  
  /** 自動車登録番号又は車両番号 */
  登録番号: string;
  
  /** 原動機の型式 */
  原動機の型式: string;
  
  /** 初度登録年又は初度検査年 */
  初度登録年: string;
  
  /** 車台番号 */
  車台番号: string;
}
```

### 2-7. LegalFees（法定費用）

```typescript
/**
 * 法定費用（Google Sheets「車両_同期用」から取得）
 */
interface LegalFees {
  /** 自動車重量税 */
  自動車重量税: number;
  
  /** 印紙代 */
  印紙代: number;
  
  /** 車検（24ヶ月） */
  "車検（24ヶ月）": number;
  
  /** 12ヶ月点検 */
  "12ヶ月点検": number;
  
  /** 代行手数料 */
  代行手数料: number;
  
  /** 自賠責保険料 */
  自賠責保険料: number;
  
  /** テスター代 */
  テスター代: number;
  
  /** 車検_法定外費用 */
  車検_法定外費用: number;
  
  /** 車検_法定費用 */
  車検_法定費用: number;
  
  /** 車検_総額 */
  車検_総額: number;
}
```

---

## 3. API設計

### 3-1. 検査項目テンプレートの取得

```typescript
/**
 * 検査項目テンプレートを取得
 */
GET /api/inspection-templates/vehicle-inspection

Response: {
  success: true;
  data: {
    categories: {
      name: InspectionCategory;
      items: Omit<InspectionItem, "status" | "measurement" | "photos" | "comment">[];
    }[];
  };
}
```

### 3-2. 車両情報の取得

```typescript
/**
 * 車両情報を取得（Google Sheets「【DB】車両マスタ」から）
 */
GET /api/vehicles/:vehicleId

Response: {
  success: true;
  data: VehicleInfo;
}
```

### 3-3. 法定費用の取得

```typescript
/**
 * 法定費用を取得（Google Sheets「車両_同期用」から）
 */
GET /api/vehicles/:vehicleId/legal-fees

Response: {
  success: true;
  data: LegalFees;
}
```

### 3-4. 診断データの保存

```typescript
/**
 * 診断データを保存（一時保存）
 */
POST /api/jobs/:jobId/inspection

Request: {
  items: InspectionItem[];
  measurements: Measurements;
  replacedParts?: ReplacedPart[];
  otherItems?: string;
  inspectionDate: string;
  totalMileage: number;
  status: "入力中" | "診断完了";
}

Response: {
  success: boolean;
  data: InspectionData;
  error?: {
    code: string;
    message: string;
  };
}
```

### 3-5. 診断データの取得

```typescript
/**
 * 診断データを取得
 */
GET /api/jobs/:jobId/inspection

Response: {
  success: true;
  data: InspectionData;
}
```

### 3-6. 写真のアップロード

```typescript
/**
 * 写真をアップロード
 */
POST /api/jobs/:jobId/inspection/photos

Request: FormData {
  file: File;
  itemId?: string;  // 検査項目ID（該当する場合）
  type: "item" | "measurement" | "before" | "after";
}

Response: {
  success: boolean;
  data: {
    url: string;  // Google DriveのURL
    thumbnailUrl?: string;  // サムネイルURL
  };
}
```

### 3-6-1. 動画のアップロード

```typescript
/**
 * 動画をアップロード
 */
POST /api/jobs/:jobId/inspection/videos

Request: FormData {
  file: File;  // 最大15秒、最大50MB
  itemId?: string;  // 検査項目ID（該当する場合）
  type: "item" | "measurement" | "before" | "after";
}

Response: {
  success: boolean;
  data: {
    url: string;  // Google DriveのURL
    thumbnailUrl?: string;  // サムネイルURL（動画の最初のフレーム）
    duration: number;  // 動画の長さ（秒）
  };
}
```

### 3-6-2. 部品レコメンドの取得

```typescript
/**
 * カテゴリに応じた部品レコメンドを取得
 */
GET /api/parts/recommendations?category={category}

Response: {
  success: true;
  data: {
    parts: {
      name: string;
      category: InspectionCategory;
      commonReasons: string[];  // よくある交換理由
    }[];
  };
}
```

### 3-6-3. 音声入力による部品名の認識

```typescript
/**
 * 音声入力をテキストに変換（部品名認識）
 */
POST /api/parts/speech-to-text

Request: {
  audio: Blob;  // 音声データ
  category?: InspectionCategory;  // カテゴリ（文脈を考慮）
}

Response: {
  success: boolean;
  data: {
    text: string;  // 認識されたテキスト
    suggestions: string[];  // 部品名の候補（マッチした場合）
  };
}
```

### 3-7. PDF生成

```typescript
/**
 * 分解整備記録簿（PDF）を生成
 */
POST /api/jobs/:jobId/inspection/pdf

Response: {
  success: boolean;
  data: {
    pdfUrl: string;  // Google DriveのURL
  };
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 4. データ保存先

### 4-1. Zoho CRM

**CustomModule2（入庫管理）**:
- `field7` (詳細情報): 診断結果のJSONを保存
- `field10` (走行距離): 点検(整備)時の総走行距離
- `field13` (作業内容): 顧客承認済みの作業項目
- `field19` (お客様共有フォルダ): Google DriveフォルダのURL
- `field5` (工程ステージ): ステータス管理

### 4-2. Google Drive

**フォルダ構造**:
```
Drive/
  └── 車両写真/
      └── [年]/
          └── [月]/
              └── [日付]_[顧客名]_[車両]_[ナンバー]/
                  ├── 01_入庫写真/
                  ├── 02_証拠写真/
                  ├── 03_作業報告/
                  └── 00_書類/
                      └── 分解整備記録簿_[日付]_[車両名].pdf
```

**ファイル命名規則**:
- 分解整備記録簿: `分解整備記録簿_[日付]_[車両名].pdf`
- 写真: `[位置番号]_[位置名]_[日付]_[サービス名]_[車両名].jpg`

### 4-3. Google Sheets

**「【DB】車両マスタ」**:
- 車両情報の取得

**「車両_同期用」**:
- 法定費用の取得

### 4-4. ローカルストレージ（オフライン対応）

**IndexedDB**:
- 診断データの一時保存
- 写真の一時保存
- オンライン復帰時に自動同期

---

## 5. データ整合性

### 5-1. バリデーション

#### 検査項目のバリデーション

```typescript
function validateInspectionItem(item: InspectionItem): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 必須項目のチェック
  if (!item.status && !item.skipRule) {
    errors.push({
      field: "status",
      message: "状態を選択してください",
    });
  }
  
  // 測定値の範囲チェック
  if (item.measurement !== undefined) {
    // タイヤ溝深さ: 1.6mm以上
    if (item.itemName.includes("タイヤ") && item.measurement < 1.6) {
      errors.push({
        field: "measurement",
        message: "タイヤの溝の深さは1.6mm以上である必要があります",
      });
    }
  }
  
  return errors;
}
```

#### 測定値のバリデーション

```typescript
function validateMeasurements(measurements: Measurements): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // CO濃度: 0-100%
  if (measurements.co !== null && (measurements.co < 0 || measurements.co > 100)) {
    errors.push({
      field: "co",
      message: "CO濃度は0-100%の範囲で入力してください",
    });
  }
  
  // HC濃度: 0-10000ppm
  if (measurements.hc !== null && (measurements.hc < 0 || measurements.hc > 10000)) {
    errors.push({
      field: "hc",
      message: "HC濃度は0-10000ppmの範囲で入力してください",
    });
  }
  
  // タイヤ溝深さ: 1.6mm以上
  Object.entries(measurements.tireDepth).forEach(([position, depth]) => {
    if (depth !== null && depth < 1.6) {
      errors.push({
        field: `tireDepth.${position}`,
        message: `${position}のタイヤ溝深さは1.6mm以上である必要があります`,
      });
    }
  });
  
  return errors;
}
```

### 5-2. データ同期

#### オフライン時のデータ保存

```typescript
// IndexedDBに保存
async function saveInspectionDataOffline(data: InspectionData): Promise<void> {
  const db = await openDB("repair-shop-dx", 1);
  await db.put("inspections", data, data.jobId);
}

// オンライン復帰時に同期
async function syncInspectionData(jobId: string): Promise<void> {
  const db = await openDB("repair-shop-dx", 1);
  const data = await db.get("inspections", jobId);
  
  if (data) {
    // APIに送信
    await fetch(`/api/jobs/${jobId}/inspection`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    // 同期成功後、ローカルデータを削除
    await db.delete("inspections", jobId);
  }
}
```

---

## 6. エラーハンドリング

### 6-1. エラーコード定義

```typescript
enum InspectionErrorCode {
  VEHICLE_NOT_FOUND = "VEHICLE_NOT_FOUND",
  LEGAL_FEES_NOT_FOUND = "LEGAL_FEES_NOT_FOUND",
  INVALID_MEASUREMENT = "INVALID_MEASUREMENT",
  REQUIRED_ITEM_MISSING = "REQUIRED_ITEM_MISSING",
  PDF_GENERATION_FAILED = "PDF_GENERATION_FAILED",
  PHOTO_UPLOAD_FAILED = "PHOTO_UPLOAD_FAILED",
  OFFLINE_SAVE_FAILED = "OFFLINE_SAVE_FAILED",
}
```

### 6-2. エラーレスポンス形式

```typescript
interface ApiError {
  success: false;
  error: {
    code: InspectionErrorCode;
    message: string;
    details?: Record<string, any>;
  };
}
```

---

## 更新履歴

- 2025-01-XX: 初版作成
- 2025-01-XX: 動画機能と診断時の部品リストアップ機能を追加



























