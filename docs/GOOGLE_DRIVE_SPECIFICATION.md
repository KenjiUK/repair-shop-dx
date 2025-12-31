# Google Drive 仕様書

## 概要

このドキュメントは、Repair Shop DXプラットフォームにおけるGoogle Driveのフォルダ構造、ファイル命名規則、および実装されている関数の仕様を定義します。

**最終更新日**: 2025年1月
**実装状況**: ✅ 実装完了

---

## 1. フォルダ構造

### 1.1 基本構造

```
repair-shop-dx/
└── customers/
    └── {customerId}_{customerName}/
        └── vehicles/
            └── {vehicleId}_{vehicleName}/
                ├── documents/
                │   ├── shaken_{vehicleId}_{日付}.pdf  (車検証 - 最新版)
                │   ├── shaken_history/  (車検証履歴)
                │   ├── inspection_record_{vehicleId}_{日付}.pdf  (自動車検査証記録事項)
                │   └── inspection_record_history/  (自動車検査証記録事項履歴)
                └── jobs/
                    └── {jobDate}_{jobId}/
                        ├── wo-{workOrderId}/
                        │   ├── 01_入庫写真/
                        │   ├── 02_証拠写真/
                        │   ├── 03_作業報告/
                        │   └── work.json
                        ├── pre-estimate.json  (事前見積データ)
                        ├── blog-photos-temp/  (ブログ用写真一時保存)
                        └── 書類/
                            └── 分解整備記録簿_{日付}_{車両名}.pdf
```

### 1.2 フォルダ命名規則

| フォルダレベル | 命名規則 | 例 |
|------------|---------|-----|
| ルートフォルダ | `repair-shop-dx` | `repair-shop-dx` |
| 顧客フォルダ | `{customerId}_{customerName}` | `K1001_田中太郎` |
| 車両フォルダ | `{vehicleId}_{vehicleName}` | `V001_BMW_X3_世田谷580た9012` |
| ジョブフォルダ | `{jobDate}_{jobId}` | `20250115_job-abc123` |
| Work Orderフォルダ | `wo-{workOrderId}` | `wo-workorder-xyz789` |
| サブフォルダ | `01_入庫写真`, `02_証拠写真`, `03_作業報告` | `01_入庫写真` |

**注意事項**:
- 顧客名と車両名は先頭に配置（検索性向上）
- 日付は`YYYYMMDD`形式（例: `20250115`）
- Work Orderフォルダには`wo-`プレフィックスを付与

### 1.3 Work Orderフォルダ内のサブフォルダ構造

Work Orderフォルダ（`wo-{workOrderId}/`）内には、以下の3つのサブフォルダが作成されます：

#### `01_入庫写真/`
- **用途**: 入庫時の4点撮影写真（前面、後面、左側面、右側面）
- **ファイル種類**: 画像ファイル（`.jpg`, `.webp`など）
- **実装状況**: ⚠️ 将来実装予定（現在は未使用）

#### `02_証拠写真/`
- **用途**: 診断時の証拠写真・動画
- **ファイル種類**: 
  - 画像ファイル（`.jpg`, `.webp`など）
  - 動画ファイル（`.mp4`など、15秒程度の短い動画）
  - PDFファイル（OBD診断結果、診断機結果、故障診断結果）
- **保存されるファイル**:
  - 診断画面で撮影した写真
  - 診断画面で撮影した動画
  - OBD診断結果PDF
  - 診断機結果PDF
  - 故障診断PDF
- **実装状況**: ✅ 実装完了

#### `03_作業報告/`
- **用途**: 作業前/作業後の写真
- **ファイル種類**: 画像ファイル（`.jpg`, `.webp`など）
- **保存されるファイル**:
  - 作業前写真（`before_`プレフィックス付き）
  - 作業後写真（`after_`プレフィックス付き）
- **実装状況**: ✅ 実装完了

---

## 2. ファイル命名規則

### 2.1 基本命名規則

すべての写真・動画・PDFファイルは、以下の統一された命名規則に従います：

```
{位置番号}_{位置名(日本語)}_{日付}_{サービス種類(日本語)}_{車種名(日本語)}.{拡張子}
```

**フィールド説明**:
- **位置番号**: `00`, `01`, `02`など（2桁ゼロ埋め、ソート順を保証）
- **位置名**: `前面`, `後面`, `左側面`, `ブレーキパッド`, `エンジンオイル`, `OBD診断`など（日本語）
- **日付**: `20250115` (YYYYMMDD形式)
- **サービス種類**: `12ヶ月点検`, `車検`, `コーティング`, `修理`など（日本語）
- **車種名**: `プジョー308`, `BMW_X3`, `シトロエンC3`など（日本語、特殊文字は`_`に置換）
- **拡張子**: `.jpg`, `.webp`, `.mp4`, `.pdf`など

### 2.2 ファイル名の例

#### 診断写真（`02_証拠写真/`）
```
04_ブレーキパッド_20250115_12ヶ月点検_プジョー308.jpg
05_エンジンオイル_20250115_12ヶ月点検_プジョー308.jpg
06_傷・凹み_20250115_修理_ルノーカングー.jpg
07_異音_20250115_12ヶ月点検_プジョー308.mp4
```

#### 診断PDF（`02_証拠写真/`）
```
00_OBD診断_20250115_12ヶ月点検_プジョー308.pdf
00_診断機結果_20250115_修理_BMW_X3.pdf
00_故障診断_20250115_故障診断_シトロエンC3.pdf
```

#### 作業前/作業後写真（`03_作業報告/`）
```
before_01_エンジンオイル交換_20250115_12ヶ月点検_プジョー308.jpg
after_01_エンジンオイル交換_20250115_12ヶ月点検_プジョー308.jpg
before_02_ブレーキパッド交換_20250115_12ヶ月点検_プジョー308.jpg
after_02_ブレーキパッド交換_20250115_12ヶ月点検_プジョー308.jpg
```

#### 入庫写真（`01_入庫写真/` - 将来実装）
```
00_前面_20250115_12ヶ月点検_プジョー308.jpg
01_後面_20250115_12ヶ月点検_プジョー308.jpg
02_左側面_20250115_12ヶ月点検_プジョー308.jpg
03_右側面_20250115_12ヶ月点検_プジョー308.jpg
```

### 2.3 特殊な命名規則

#### Before/After写真
- **Before写真**: `before_{位置番号}_{位置名}_{日付}_{サービス種類}_{車種名}.{拡張子}`
- **After写真**: `after_{位置番号}_{位置名}_{日付}_{サービス種類}_{車種名}.{拡張子}`

#### 同じ位置から複数枚撮影する場合
- 位置番号は同じ（例: `01_後面`）
- ファイル名の生成時に`index`パラメータを使用して連番を付与（実装内部で処理）

#### 特殊文字の処理
- ファイル名に使用できない特殊文字（`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`）は`_`に置換
- 日本語文字はそのまま保持
- 複数の連続する`_`は1つに統合
- 前後の`_`は削除

---

## 3. 実装されている関数

### 3.1 フォルダ操作関数

#### `getOrCreateWorkOrderSubFolder`
Work Orderフォルダ内のサブフォルダを取得または作成します。

```typescript
export async function getOrCreateWorkOrderSubFolder(
  workOrderFolderId: string,
  subFolderType: "01_入庫写真" | "02_証拠写真" | "03_作業報告"
): Promise<DriveFolder>
```

**使用例**:
```typescript
const subFolder = await getOrCreateWorkOrderSubFolder(
  workOrderFolder.id,
  "02_証拠写真"
);
```

#### `getPhotoSubFolderType`
写真の種類に応じて適切なサブフォルダを返します。

```typescript
export function getPhotoSubFolderType(
  photoType: "diagnosis" | "before" | "after" | "general",
  isCheckInPhoto: boolean = false
): "01_入庫写真" | "02_証拠写真" | "03_作業報告"
```

**マッピング**:
- `isCheckInPhoto === true` → `01_入庫写真`
- `photoType === "diagnosis"` → `02_証拠写真`
- `photoType === "before" | "after" | "general"` → `03_作業報告`

**使用例**:
```typescript
const subFolderType = getPhotoSubFolderType("diagnosis", false);
// 戻り値: "02_証拠写真"
```

### 3.2 ファイル名生成関数

#### `generateWorkOrderPhotoFileName`
診断写真のファイル名を生成します。

```typescript
export function generateWorkOrderPhotoFileName(
  date: string,                    // YYYYMMDD形式
  vehicleName: string,             // 車種名
  serviceKind: ServiceKind | string, // サービス種類
  position: string,                // 写真位置（英語キーまたは日本語ラベル）
  index: number,                   // 位置番号（同じ位置から複数枚撮影する場合の連番）
  originalFileName: string         // 元のファイル名（拡張子取得用）
): string
```

**使用例**:
```typescript
const fileName = generateWorkOrderPhotoFileName(
  "20250115",
  "プジョー308",
  "12ヶ月点検",
  "brake-pad",  // または "ブレーキパッド"
  4,
  "photo.jpg"
);
// 戻り値: "04_ブレーキパッド_20250115_12ヶ月点検_プジョー308.jpg"
```

#### `generateWorkOrderVideoFileName`
診断動画のファイル名を生成します。

```typescript
export function generateWorkOrderVideoFileName(
  date: string,
  vehicleName: string,
  serviceKind: ServiceKind | string,
  position: string,                // 動画位置（英語キー、日本語ラベル、または診断項目名）
  index: number,
  originalFileName: string
): string
```

**使用例**:
```typescript
const fileName = generateWorkOrderVideoFileName(
  "20250115",
  "プジョー308",
  "12ヶ月点検",
  "異音",
  7,
  "video.mp4"
);
// 戻り値: "07_異音_20250115_12ヶ月点検_プジョー308.mp4"
```

#### `generateWorkOrderBeforeAfterPhotoFileName`
作業前/作業後写真のファイル名を生成します。

```typescript
export function generateWorkOrderBeforeAfterPhotoFileName(
  date: string,
  vehicleName: string,
  serviceKind: ServiceKind | string,
  position: string,                // 写真位置（英語キーまたは日本語ラベル）
  index: number,
  originalFileName: string,
  photoType: "before" | "after"   // 写真の種類
): string
```

**使用例**:
```typescript
const fileName = generateWorkOrderBeforeAfterPhotoFileName(
  "20250115",
  "プジョー308",
  "12ヶ月点検",
  "エンジンオイル交換",
  1,
  "photo.jpg",
  "after"
);
// 戻り値: "after_01_エンジンオイル交換_20250115_12ヶ月点検_プジョー308.jpg"
```

#### `generateDiagnosticPdfFileName`
診断PDFファイル名を生成します。

```typescript
export function generateDiagnosticPdfFileName(
  date: string,
  vehicleName: string,
  serviceKind: ServiceKind | string,
  diagnosticType: string,          // 診断種類（"OBD診断", "診断機結果", "故障診断"など）
  index: number,                   // 位置番号（同じ種類の診断結果が複数ある場合の連番）
  originalFileName: string
): string
```

**使用例**:
```typescript
const fileName = generateDiagnosticPdfFileName(
  "20250115",
  "プジョー308",
  "12ヶ月点検",
  "OBD診断",
  0,
  "diagnostic.pdf"
);
// 戻り値: "00_OBD診断_20250115_12ヶ月点検_プジョー308.pdf"
```

---

## 4. ファイルタイプ別の保存先

### 4.1 写真・動画ファイル

| ファイルタイプ | 保存先 | 関数 |
|------------|--------|------|
| 診断写真 | `wo-{workOrderId}/02_証拠写真/` | `getPhotoSubFolderType("diagnosis")` |
| 診断動画 | `wo-{workOrderId}/02_証拠写真/` | `getPhotoSubFolderType("diagnosis")` |
| 作業前写真 | `wo-{workOrderId}/03_作業報告/` | `getPhotoSubFolderType("before")` |
| 作業後写真 | `wo-{workOrderId}/03_作業報告/` | `getPhotoSubFolderType("after")` |
| 入庫写真 | `wo-{workOrderId}/01_入庫写真/` | `getPhotoSubFolderType("general", true)` |

### 4.2 PDFファイル

| ファイルタイプ | 保存先 | 関数 |
|------------|--------|------|
| OBD診断結果PDF | `wo-{workOrderId}/02_証拠写真/` | `getPhotoSubFolderType("diagnosis")` |
| 診断機結果PDF | `wo-{workOrderId}/02_証拠写真/` | `getPhotoSubFolderType("diagnosis")` |
| 故障診断PDF | `wo-{workOrderId}/02_証拠写真/` | `getPhotoSubFolderType("diagnosis")` |
| 分解整備記録簿PDF | `{jobDate}_{jobId}/書類/` | `getOrCreateFolder({ folderName: "書類", ... })` |
| 請求書PDF | `{jobDate}_{jobId}/` | Jobフォルダ直下 |

### 4.3 書類ファイル

| ファイルタイプ | 保存先 | 関数 |
|------------|--------|------|
| 車検証 | `vehicles/{vehicleId}_{vehicleName}/documents/` | `getOrCreateVehicleDocumentsFolder()` |
| 自動車検査証記録事項 | `vehicles/{vehicleId}_{vehicleName}/documents/` | `getOrCreateVehicleDocumentsFolder()` |
| 新規車両検査証記録事項 | `customers/{customerId}_{customerName}/vehicles/new_vehicles/` | `getOrCreateFolder({ folderName: "new_vehicles", ... })` |

### 4.4 JSONファイル（メタデータ）

| ファイルタイプ | 保存先 | 関数 |
|------------|--------|------|
| `work.json` | `wo-{workOrderId}/` | Work Orderフォルダ直下 |
| `pre-estimate.json` | `{jobDate}_{jobId}/` | Jobフォルダ直下 |

---

## 5. 実装例

### 5.1 診断写真のアップロード

```typescript
import { 
  getOrCreateWorkOrderFolder, 
  getOrCreateWorkOrderSubFolder, 
  getPhotoSubFolderType, 
  generateWorkOrderPhotoFileName,
  uploadFile 
} from "@/lib/google-drive";

// 1. Work Orderフォルダを取得または作成
const workOrderFolder = await getOrCreateWorkOrderFolder(
  customerId,
  customerName,
  vehicleId,
  vehicleName,
  jobId,
  jobDate,
  workOrderId
);

// 2. 証拠写真フォルダを取得または作成
const subFolderType = getPhotoSubFolderType("diagnosis", false);
const subFolder = await getOrCreateWorkOrderSubFolder(
  workOrderFolder.id,
  subFolderType
);

// 3. ファイル名を生成
const fileName = generateWorkOrderPhotoFileName(
  jobDate,
  vehicleName,
  serviceKind,
  position,
  index,
  file.name
);

// 4. ファイルをアップロード
const uploadedFile = await uploadFile({
  fileName,
  mimeType: "image/jpeg",
  fileData: compressedFile,
  parentFolderId: subFolder.id,
  driveId: subFolder.driveId,
});
```

### 5.2 作業前/作業後写真のアップロード

```typescript
// 1. Work Orderフォルダを取得または作成
const workOrderFolder = await getOrCreateWorkOrderFolder(...);

// 2. 作業報告フォルダを取得または作成
const subFolderType = getPhotoSubFolderType("before", false); // または "after"
const subFolder = await getOrCreateWorkOrderSubFolder(
  workOrderFolder.id,
  subFolderType
);

// 3. ファイル名を生成
const fileName = generateWorkOrderBeforeAfterPhotoFileName(
  jobDate,
  vehicleName,
  serviceKind,
  itemId,  // 作業項目IDを位置名として使用
  "before", // または "after"
  index,
  file.name
);

// 4. ファイルをアップロード
const uploadedFile = await uploadFile({
  fileName,
  mimeType: "image/jpeg",
  fileData: compressedFile,
  parentFolderId: subFolder.id,
  driveId: subFolder.driveId,
});
```

### 5.3 診断PDFのアップロード

```typescript
// 1. Work Orderフォルダを取得または作成
const workOrderFolder = await getOrCreateWorkOrderFolder(...);

// 2. 証拠写真フォルダを取得または作成
const subFolderType = getPhotoSubFolderType("diagnosis", false);
const subFolder = await getOrCreateWorkOrderSubFolder(
  workOrderFolder.id,
  subFolderType
);

// 3. ファイル名を生成
const fileName = generateDiagnosticPdfFileName(
  jobDate,
  vehicleName,
  serviceKind,
  "OBD診断", // または "診断機結果", "故障診断"
  0,
  file.name
);

// 4. ファイルをアップロード
const uploadedFile = await uploadFile({
  fileName,
  mimeType: "application/pdf",
  fileData: file,
  parentFolderId: subFolder.id,
  driveId: subFolder.driveId,
});
```

---

## 6. 実装ファイル一覧

### 6.1 主要な実装ファイル

| ファイル | 説明 |
|---------|------|
| `src/lib/google-drive.ts` | Google Drive APIクライアント、フォルダ操作、ファイル名生成関数 |
| `src/lib/photo-position.ts` | 写真位置のマッピング、ファイル名生成の内部実装 |
| `src/app/mechanic/diagnosis/[id]/page.tsx` | 診断画面（写真・PDFアップロード処理） |
| `src/app/mechanic/work/[id]/page.tsx` | 作業画面（作業前/作業後写真アップロード処理） |

### 6.2 使用されている関数

**フォルダ操作**:
- `getOrCreateWorkOrderFolder()` - Work Orderフォルダの取得または作成
- `getOrCreateWorkOrderSubFolder()` - Work Orderフォルダ内のサブフォルダの取得または作成
- `getPhotoSubFolderType()` - 写真の種類に応じたサブフォルダの判定

**ファイル名生成**:
- `generateWorkOrderPhotoFileName()` - 診断写真のファイル名生成
- `generateWorkOrderVideoFileName()` - 診断動画のファイル名生成
- `generateWorkOrderBeforeAfterPhotoFileName()` - 作業前/作業後写真のファイル名生成
- `generateDiagnosticPdfFileName()` - 診断PDFのファイル名生成

**内部関数**（`photo-position.ts`）:
- `generateInternalPhotoFileName()` - 社内用写真のファイル名生成（内部実装）
- `generateInternalVideoFileName()` - 社内用動画のファイル名生成（内部実装）
- `sanitizeForJapaneseFileName()` - 日本語ファイル名用のサニタイズ

---

## 7. 注意事項

### 7.1 共有ドライブの使用

- 本システムはGoogle Driveの**共有ドライブ（Shared Drive）**を使用します
- 環境変数`GOOGLE_DRIVE_PARENT_FOLDER_ID`に共有ドライブのIDを設定してください
- すべてのフォルダ・ファイルは共有ドライブ内に作成されます

### 7.2 権限管理

- Service Accountを使用してGoogle Drive APIにアクセスします
- 新規作成されたフォルダには、`GOOGLE_DRIVE_USER_EMAIL`で指定されたユーザーに「編集者」権限が自動的に付与されます

### 7.3 ファイル名の文字エンコーディング

- ファイル名はUTF-8エンコーディングで保存されます
- 日本語文字はそのまま使用可能です
- 特殊文字（`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`）は自動的に`_`に置換されます

### 7.4 ファイルサイズ制限

- **画像ファイル**: アップロード前に500KB以下に圧縮（`browser-image-compression`を使用）
- **動画ファイル**: 最大15秒、最大10MB（MVP仕様）
- **PDFファイル**: 特に制限なし（Google Driveの制限に従う）

### 7.5 エラーハンドリング

- Google Drive APIのエラーは、開発環境では空配列を返すか、`null`を返すことでアプリケーションのクラッシュを防ぎます
- 本番環境では適切なエラーログを記録し、ユーザーに通知します

---

## 8. 実装状況

### 8.1 入庫写真の実装

- ⚠️ **将来実装予定**: `01_入庫写真/`フォルダへの保存機能
- 入庫時の4点撮影（前面、後面、左側面、右側面）の自動アップロード

### 8.2 レストア・板金・塗装の写真アップロード

- ✅ **実装完了** (2025年1月): レストアと板金・塗装の作業写真は撮影時に即座に`03_作業報告/`フォルダにアップロードされます
  - **レストア**: 作業中の写真は`photoType: "general"`として保存
  - **板金・塗装**: 品質確認用のAfter写真は`photoType: "after"`として保存
  - ファイル名は`generateWorkOrderBeforeAfterPhotoFileName`関数を使用して生成
  - アップロード後、`fileId`と`url`が状態に保存され、作業データに反映されます

---

## 9. 変更履歴

| 日付 | 変更内容 |
|------|---------|
| 2025-01 | 初版作成。Work Orderフォルダ内のサブフォルダ構造、ファイル命名規則、実装関数の仕様を定義 |

---

## 10. 参考資料

- `docs/GOOGLE_DRIVE_FOLDER_STRUCTURE.md` - フォルダ構造の詳細（提案段階の内容も含む）
- `docs/FOLDER_STRUCTURE_PROPOSAL.md` - フォルダ構造の再設計提案
- `src/lib/google-drive.ts` - 実装コード

