# field19（お客様共有フォルダ）の同期仕様とベストプラクティス

## 現状の問題点

### 1. `field19`の定義
- **Zoho CRMのフィールド**: `field19`（お客様共有フォルダ）
- **型定義**: `string | null`（Google DriveフォルダのURL）
- **用途**: 顧客がアクセスできるGoogle DriveフォルダのURLを保存

### 2. 現在の問題

#### 問題1: フォルダ作成時に`field19`を更新していない
- `createJobFolderAction`はフォルダを作成して`webViewLink`を返すが、Zoho CRMの`field19`を更新する処理がない
- そのため、フォルダが作成されても`field19`が`null`のまま

#### 問題2: フォルダ作成のタイミングが不明確
- ブログ用写真のアップロード時
- 車検証のアップロード時
- 受付（チェックイン）時
- 診断開始時
- 作業開始時

どのタイミングでフォルダが作成されるべきか、仕様が不明確

#### 問題3: 404エラーの原因
- `field19`に保存されているURLが正しくない、または古い
- フォルダが削除された、または移動された
- URLの形式が正しくない

## ベストプラクティス

### 1. フォルダ作成のタイミング

#### 推奨: 事前問診（オンラインチェックイン）完了時 ⭐
- **理由**: 
  - **事前問診完了時点で、顧客情報・車両情報・入庫日時が確定している**
  - **車検証のアップロードは事前問診で行われるため、その前にフォルダが存在している必要がある**
  - 以降のすべての作業（診断、見積、作業、ブログ用写真など）で同じフォルダを使用できる
  - フォルダが確実に存在するため、後続の処理でエラーが発生しない
  - 受付（チェックイン）時には既にフォルダが存在しているため、処理がスムーズ

#### 代替案: 受付（チェックイン）完了時
- 事前問診が完了していない場合のフォールバック
- 事前問診でフォルダが作成されていない場合のみ、受付完了時に作成

#### フォルダ作成の流れ

**メインフロー: 事前問診完了時**
```
1. 事前問診（オンラインチェックイン）完了
   - 車両選択完了
   - 車検証アップロード（新規車両の場合）
   ↓
2. Google DriveにJobフォルダを作成
   - パス: `/customers/{customerId}_{customerName}/vehicles/{vehicleId}_{vehicleName}/jobs/{jobDate}_{jobId}`
   ↓
3. フォルダの`webViewLink`を取得
   - 例: `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`
   ↓
4. Zoho CRMの`field19`を更新
   - `field19 = webViewLink`
   ↓
5. 以降の処理でこのフォルダを使用
   - 車検証のアップロード（既にフォルダが存在）
   - ブログ用写真のアップロード
   - 診断データの保存
   - 作業データの保存
```

**フォールバック: 受付（チェックイン）完了時**
```
1. 受付（チェックイン）完了
   - 事前問診が完了していない場合
   ↓
2. `field19`が`null`か確認
   - `field19`が既に設定されている場合はスキップ
   ↓
3. Google DriveにJobフォルダを作成
   ↓
4. Zoho CRMの`field19`を更新
```

### 2. 実装方針

#### 2-1. 事前問診完了時にフォルダを作成し、`field19`を更新 ⭐

**実装場所**: `src/app/customer/pre-checkin/[id]/page.tsx`の`handleSubmit`関数内

**処理タイミング**: フォーム送信完了時（車両選択、車検証アップロード完了後）

#### 2-2. 受付完了時にフォルダを作成し、`field19`を更新（フォールバック）

**実装場所**: `src/app/page.tsx`の`handleCourtesyCarSelect`、`handleUnlinkTagAndRetryCheckIn`、`handleMechanicSelect`の`onSuccess`コールバック

**処理タイミング**: `field19`が`null`の場合のみ実行

**処理フロー**:
```typescript
// 1. field19が既に設定されている場合はスキップ（既存フォルダを使用）
if (job.field19) {
  // 既存のURLを使用（フォルダ作成処理をスキップ）
  return;
}

// 2. フォルダを作成（既存フォルダがある場合は再利用）
const folderResult = await createJobFolderAction(
  job.id,
  jobDate,
  workOrderId,
  customerId,
  customerName,
  vehicleId,
  vehicleName
);

// 3. フォルダが作成された場合、Zoho CRMのfield19を更新
if (folderResult.success && folderResult.url) {
  await updateJobField19(job.id, folderResult.url);
}
```

**既存フォルダの再利用**:
- `getOrCreateJobFolder`は`returnExisting: true`を使用しているため、既存のフォルダがある場合は自動的に再利用される
- **顧客フォルダ**: 既存顧客の場合は既に存在しているので、再利用される
- **車両フォルダ**: 既存車両の場合は既に存在しているので、再利用される
- **Jobフォルダ**: `{jobDate}_{jobId}`形式なので、来店ごとに異なる。既存の場合は再利用、存在しない場合は新規作成

#### 2-2. `updateJobField19`関数の実装

**実装場所**: `src/lib/api.ts`または`src/lib/zoho-api-client.ts`

```typescript
/**
 * Jobのfield19（お客様共有フォルダURL）を更新
 */
export async function updateJobField19(
  jobId: string,
  folderUrl: string
): Promise<ApiResponse<ZohoJob>> {
  // Zoho CRM APIを呼び出してfield19を更新
  // 実装はZoho CRM APIの仕様に従う
}
```

#### 2-3. 既存フォルダの確認と再利用

**既存顧客・既存車両の場合**:
- **顧客フォルダ**: 既存顧客の場合は既に存在しているので、`getOrCreateCustomerFolder`が既存フォルダを返す
- **車両フォルダ**: 既存車両の場合は既に存在しているので、`getOrCreateVehicleFolder`が既存フォルダを返す
- **Jobフォルダ**: `{jobDate}_{jobId}`形式なので、来店ごとに異なる。既存の場合は再利用、存在しない場合は新規作成

**`field19`が既に設定されている場合**:
- `field19`が既に設定されている場合は、フォルダ作成処理をスキップ（既存のURLを使用）
- フォルダが削除された場合など、URLが無効な場合は別途対応が必要

**実装例**:
```typescript
// field19が既に設定されている場合は、フォルダ作成をスキップ
if (job.field19) {
  // 既存のURLを使用（フォルダ作成処理をスキップ）
  // 注意: URLが無効な場合の検証は別途実装が必要
  return;
}

// field19が設定されていない場合のみ、フォルダを作成して更新
// 既存フォルダがある場合は自動的に再利用される
const folderResult = await createJobFolderAction(
  job.id,
  jobDate,
  workOrderId,
  customerId,
  customerName,
  vehicleId,
  vehicleName
);

if (folderResult.success && folderResult.url) {
  await updateJobField19(job.id, folderResult.url);
}
```

### 3. エラーハンドリング

#### 3-1. フォルダ作成失敗時
- エラーログを記録
- ユーザーに通知（トーストメッセージ）
- 処理は続行（フォルダがなくても他の処理は可能）

#### 3-2. `field19`更新失敗時
- エラーログを記録
- ユーザーに通知（トーストメッセージ）
- フォルダは作成されているため、後で手動で`field19`を更新可能

#### 3-3. 404エラーの対処
- `field19`のURLが正しいか確認
- フォルダが存在するか確認（Google Drive APIで検証）
- フォルダが存在しない場合、再作成して`field19`を更新

### 4. 既存データの移行

#### 4-1. `field19`が`null`の既存Job
- 受付完了時にフォルダを作成して`field19`を更新
- または、バッチ処理で一括更新

#### 4-2. `field19`に不正なURLが保存されている既存Job
- フォルダの存在確認
- 存在しない場合、再作成して`field19`を更新

## 実装チェックリスト

### Phase 1: 基本実装
- [ ] `updateJobField19`関数を実装
- [ ] 受付完了時にフォルダを作成し、`field19`を更新する処理を追加
- [ ] エラーハンドリングを実装

### Phase 2: 既存データの対応
- [ ] `field19`が`null`の既存Jobのフォルダを作成
- [ ] `field19`に不正なURLが保存されている既存Jobの修正

### Phase 3: エラー対応
- [ ] 404エラー時の自動修復機能
- [ ] フォルダ存在確認機能

## 注意事項

### 1. URLの形式
- Google DriveのURLは以下の形式:
  - `https://drive.google.com/drive/folders/{folderId}`
  - `https://drive.google.com/drive/u/0/folders/{folderId}`

### 2. フォルダの共有設定
- フォルダは顧客がアクセスできるように共有設定が必要
- 共有設定はGoogle Drive APIで実装

### 3. パフォーマンス
- フォルダ作成は非同期処理として実装
- ユーザーの操作をブロックしない

### 4. セキュリティ
- フォルダの共有設定は適切に管理
- 顧客情報の漏洩を防ぐ

## 参考資料

- `docs/FOLDER_STRUCTURE_PROPOSAL.md`: フォルダ構造の詳細
- `docs/GOOGLE_DRIVE_FOLDER_STRUCTURE.md`: 現在の実装状況
- `src/lib/google-drive.ts`: Google Drive APIの実装
- `src/app/actions/drive.ts`: フォルダ作成アクション

