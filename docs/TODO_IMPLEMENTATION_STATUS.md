# TODO実装状況

**作成日:** 2025-12-21  
**目的:** TODOコメントで見つかった未実装機能の実装状況を記録

---

## 実装完了項目

### 1. 診断料金をジョブに保存するAPI ✅

**実装日:** 2025-12-21

**実装内容:**
- `src/lib/api.ts`に`updateJobDiagnosisFee`関数を追加
- 診断料金と診断時間をジョブに保存
- `field7`に診断料金情報を追記（既存の【診断料金】セクションを削除してから追加）
- 診断画面（`src/app/mechanic/diagnosis/[id]/page.tsx`）でAPIを呼び出すように修正

**変更ファイル:**
- `src/lib/api.ts` - `updateJobDiagnosisFee`関数を追加
- `src/app/mechanic/diagnosis/[id]/page.tsx` - TODOコメントを削除し、API呼び出しを実装

**実装詳細:**
```typescript
export async function updateJobDiagnosisFee(
  id: string,
  diagnosisFee: number | null,
  diagnosisDuration?: number | null
): Promise<ApiResponse<ZohoJob>>
```

**注意事項:**
- モック環境では直接ジョブオブジェクトを更新
- 実際のZoho CRM連携時は、`field23`または`field7`に記録する必要がある

---

### 2. 顧客のDescriptionに追記するAPI関数 ✅

**実装日:** 2025-12-21

**実装内容:**
- `src/lib/api.ts`に`appendToCustomerDescription`関数を追加
- 顧客のDescriptionフィールドに変更要求を追記
- 事前チェックイン画面（`src/app/customer/pre-checkin/[id]/page.tsx`）で住所・電話番号の変更申請を実装

**変更ファイル:**
- `src/lib/api.ts` - `appendToCustomerDescription`関数を追加
- `src/app/customer/pre-checkin/[id]/page.tsx` - TODOコメントを削除し、API呼び出しを実装

**実装詳細:**
```typescript
export async function appendToCustomerDescription(
  customerId: string,
  changeRequestText: string
): Promise<ApiResponse<ZohoCustomer>>
```

**使用例:**
- 住所変更申請: `formatChangeRequest("Mailing_Street", oldValue, newValue)`
- 電話番号変更申請: `formatChangeRequest("Phone", oldValue, newValue)`

**注意事項:**
- `src/lib/customer-description-append.ts`の`formatChangeRequest`関数を使用
- 変更要求は`【アプリ変更届】`フォーマットで記録される

---

### 3. 新規車両画像のアップロード機能 ✅

**実装日:** 2025-12-21

**実装内容:**
- `src/lib/new-vehicle-image-upload.ts`に`uploadNewVehicleImage`関数を追加
- 新規車両登録時の車検証画像をGoogle Driveにアップロード
- 画像を自動圧縮（500KB以下）
- アップロードしたファイルのURLを`field7`に記録（新規車両情報として）

**変更ファイル:**
- `src/lib/new-vehicle-image-upload.ts` - 新規車両画像アップロード関数を追加
- `src/app/customer/pre-checkin/[id]/page.tsx` - TODOコメントを削除し、アップロード機能を実装

**実装詳細:**
```typescript
export async function uploadNewVehicleImage(
  file: File,
  customerId: string,
  customerName: string,
  vehicleName: string
): Promise<ApiResponse<DriveFile>>
```

**保存先:**
- Google Drive: `/customers/{customerId}_{customerName}/vehicles/new_vehicles/`
- ファイル名: `new_vehicle_{日付}_{車両名}_{タイムスタンプ}.{拡張子}`
- Zoho CRM: `field7`に新規車両情報として記録（車種名、車検証画像URL）

**注意事項:**
- 新規車両の作成はZoho CRMで行う必要があるため、ここではGoogle Driveへのアップロードのみ実行
- 車両作成後、`field12`にファイルURLを設定する必要がある（将来実装予定）
- 画像は自動的に500KB以下に圧縮される

---

### 4. 新規車両作成機能（Zoho CRM連携）✅

**実装日:** 2025-12-21

**実装内容:**
- `src/lib/api.ts`に`createVehicle`関数を追加（モック環境）
- `src/lib/api.ts`に`addImageToJobField12`関数を追加（field12への画像リンク設定）
- `src/lib/new-vehicle-creation.ts`に`createNewVehicleAndLinkImage`関数を追加
- 新規車両用の一時フォルダから正式な車両フォルダへ画像を移動
- 事前チェックイン画面で新規車両作成機能を統合

**変更ファイル:**
- `src/lib/api.ts` - `createVehicle`、`addImageToJobField12`関数を追加
- `src/lib/new-vehicle-creation.ts` - 新規車両作成と画像リンク設定の統合関数を追加
- `src/app/customer/pre-checkin/[id]/page.tsx` - 新規車両作成機能を統合

**実装詳細:**
```typescript
export async function createVehicle(
  customerId: string,
  vehicleName: string,
  licensePlate?: string | null
): Promise<ApiResponse<ZohoVehicle>>

export async function addImageToJobField12(
  jobId: string,
  imageUrl: string,
  fileName: string
): Promise<ApiResponse<ZohoJob>>

export async function createNewVehicleAndLinkImage(
  jobId: string,
  customerId: string,
  customerName: string,
  vehicleName: string,
  licensePlate: string | null,
  uploadedImageFileId: string,
  uploadedImageFileName: string
): Promise<ApiResponse<{ vehicle: ZohoVehicle; job: ZohoJob }>>
```

**処理フロー:**
1. 新規車両をZoho CRMに作成（モック環境ではモックデータベースに追加）
2. アップロード済みの画像を新規車両用の一時フォルダから正式な車両フォルダへ移動
3. Jobの`field6`を新規車両に更新
4. Jobの`field12`に画像URLを追加

**注意事項:**
- モック環境では直接モックデータベースを更新
- 実際のZoho CRM API連携時は、Zoho CRM APIを呼び出す必要がある
- ファイル名の変更はGoogle Drive APIで直接サポートされていないため、移動のみ実行（将来実装予定）

---

## 未実装項目（優先度順）

---

### 2. メール送信機能

**場所:** `src/app/admin/estimate/[id]/page.tsx:2047`

**実装内容:**
- 見積送付時のメール送信機能
- メールテンプレートの作成
- メール送信APIの実装（SendGrid、AWS SES等）

**優先度:** 低（LINE通知が優先）

---

### 3. Zoho Bookings予約リンク生成機能

**場所:** `src/app/admin/estimate/[id]/page.tsx:2913`

**実装内容:**
- Zoho Bookings API連携
- 予約リンクの生成機能
- 予約情報の取得・更新機能

**優先度:** 低（将来実装予定）

---

### 4. 認証APIの実装

**場所:** `src/lib/auth.ts:118, 152, 166`

**実装内容:**
- 実際の認証APIを呼び出す
- サーバー側のセッション管理
- JWT対応、リフレッシュトークン

**優先度:** 低（Phase 6で実装予定）

---

### 5. その他の型定義関連TODO

**場所:**
- `src/components/features/vehicle-detail-dialog.tsx:241` - MasterVehicle型に走行距離プロパティが追加されたら実装
- `src/components/features/customer-detail-dialog.tsx:191` - ZohoCustomer型にemailプロパティが追加されたら実装
- `src/app/customer/report/[id]/page.tsx:790` - 車検有効期限はZohoVehicleから取得する必要があります

**実装内容:**
- 型定義の拡張が必要
- Zoho CRMのフィールド追加が必要な場合がある

**優先度:** 低（型定義の拡張が必要）

---

## 次のステップ

1. ✅ **新規車両作成機能（Zoho CRM連携）** - 実装完了
2. ✅ **field12への画像リンク設定機能** - 実装完了
3. RoadmapのPhase 0-5の実装状況を確認し、未実装機能を特定して実装を進める
4. Phase 5.5（Zoho CRM実データ連携）は最後に実装予定

---

## 更新履歴

- 2025-12-21: 初版作成（診断料金保存、顧客Description追記の実装完了を記録）
- 2025-12-21: 新規車両画像のアップロード機能の実装完了を記録
- 2025-12-21: 新規車両作成機能とfield12への画像リンク設定機能の実装完了を記録



