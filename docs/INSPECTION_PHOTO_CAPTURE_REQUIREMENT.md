# 24ヶ月点検・12ヶ月点検 写真撮影機能要件

**作成日**: 2025-01-XX  
**目的**: 点検項目ごとの写真撮影機能の実装要件

---

## 1. 背景

現在の24ヶ月点検・12ヶ月点検の再設計画面（`inspection-redesign-test`）には、写真撮影機能が実装されていません。

しかし、このWEBアプリは最終的にお客さんに写真や動画を見せる機能があり、診断画面や作業画面では既に写真撮影機能が実装されています。

**重要**: 点検結果を顧客に提示する際、写真・動画は重要な証跡となります。特に異常が見つかった項目については、写真・動画による記録が必須です。

---

## 2. 既存の写真撮影機能

### 2-1. 診断画面の実装

**ファイル**: `src/app/mechanic/diagnosis/[id]/page.tsx`

**機能**:
- `PhotoCaptureButton`コンポーネント
- 画像圧縮（`browser-image-compression`、500KB以下）
- Google Driveへのアップロード
- プレビュー表示

**実装例**:
```typescript
function PhotoCaptureButton({
  position,
  label,
  photoData,
  onCapture,
  disabled,
}: {
  position: PhotoPosition;
  label: string;
  photoData: PhotoData;
  onCapture: (position: PhotoPosition, file: File) => void;
  disabled?: boolean;
}) {
  // カメラアクセス、画像圧縮、アップロード処理
}
```

---

## 3. データモデル

### 3-1. InspectionItemRedesign

**ファイル**: `src/types/inspection-redesign.ts`

```typescript
export interface InspectionItemRedesign {
  id: string;
  label: string;
  category: InspectionCategory12Month | InspectionCategory24Month;
  status: InspectionStatus;
  // ...
  photoUrls?: string[];  // ✅ 写真URL配列（既に定義済み）
  videoUrl?: string;      // ✅ 動画URL（既に定義済み）
  comment?: string;
}
```

**結論**: ✅ **データモデルは既に写真・動画に対応済み**

---

## 4. 実装要件

### 4-1. UI要件

#### 4-1-1. 写真撮影ボタンの配置

**配置場所**: `InspectionBottomSheetItemCard`内

**表示方法**:
1. 項目カード内に小さなカメラアイコンボタンを配置
2. または、`InspectionStatusBottomSheet`内に「写真を撮影」ボタンを追加

**推奨**: 項目カード内にカメラアイコンボタンを配置（診断画面と同様）

#### 4-1-2. 写真プレビュー

**機能**:
- 写真撮影後、項目カード内にサムネイルを表示
- タップで拡大表示
- 削除ボタンで写真を削除

#### 4-1-3. 複数写真の対応

**要件**: 1つの項目に複数の写真を撮影可能

**実装**: `photoUrls: string[]`配列に追加していく

---

### 4-2. 機能要件

#### 4-2-1. 画像圧縮

**要件**: 
- クライアントサイドで500KB以下に圧縮
- `browser-image-compression`ライブラリを使用

**実装**: `src/lib/compress.ts`の`compressImage`関数を再利用

#### 4-2-2. Google Driveへのアップロード

**要件**:
- 写真はGoogle Driveにアップロード
- 保存先: `.../[JobID]/[WorkOrderID]/diagnosis/photos/[ItemID]/`

**実装**: `src/lib/google-drive.ts`の`uploadFile`関数を再利用

#### 4-2-3. 動画撮影（オプション）

**要件**: 
- 必要に応じて動画撮影も可能にする
- 診断画面と同様の実装

**優先度**: 中（まずは写真撮影を実装）

---

### 4-3. 実装ファイル

#### 新規作成または修正が必要なファイル

1. **`src/components/features/inspection-bottom-sheet-item-card.tsx`**（修正）
   - 写真撮影ボタンを追加
   - 写真プレビューを表示
   - 写真削除機能を追加

2. **`src/components/features/inspection-photo-manager.tsx`**（新規作成、オプション）
   - 写真管理専用コンポーネント
   - 診断画面の`PhotoManager`を参考に実装

3. **`src/app/mechanic/inspection-redesign-test/page.tsx`**（修正）
   - 写真アップロード処理を追加
   - 写真URLを`InspectionItemRedesign.photoUrls`に保存

---

## 5. 実装手順

### Phase 1: 写真撮影ボタンの追加

1. `InspectionBottomSheetItemCard`にカメラアイコンボタンを追加
2. ボタンクリック時にカメラを起動
3. 撮影後、画像圧縮処理を実行

### Phase 2: アップロード処理

1. 圧縮後の画像をGoogle Driveにアップロード
2. アップロードURLを`InspectionItemRedesign.photoUrls`に追加
3. 状態を更新してUIに反映

### Phase 3: プレビュー・削除機能

1. 写真サムネイルを項目カード内に表示
2. タップで拡大表示（ダイアログ）
3. 削除ボタンで写真を削除（Google Driveからも削除）

### Phase 4: 動画撮影（オプション）

1. 診断画面の動画撮影機能を参考に実装
2. `InspectionItemRedesign.videoUrl`に保存

---

## 6. 参考実装

### 診断画面の写真撮影

**ファイル**: `src/app/mechanic/diagnosis/[id]/page.tsx`

**主要な処理**:
- `PhotoCaptureButton`コンポーネント（行351-436）
- `handlePhotoCapture`関数（写真撮影処理）
- `compressImage`関数による画像圧縮
- `uploadFile`関数によるGoogle Driveアップロード

### 画像圧縮

**ファイル**: `src/lib/compress.ts`

```typescript
export async function compressImage(file: File): Promise<File> {
  // browser-image-compressionを使用して500KB以下に圧縮
}
```

### Google Driveアップロード

**ファイル**: `src/lib/google-drive.ts`

```typescript
export async function uploadFile(
  file: File,
  folderId: string,
  fileName: string
): Promise<ApiResponse<{ fileId: string; webViewLink: string }>> {
  // Google Drive APIを使用してファイルをアップロード
}
```

---

## 7. 優先度

### 高（必須）

1. ✅ **写真撮影機能**: 顧客への提示に必要
2. ✅ **写真プレビュー**: 撮影した写真の確認
3. ✅ **写真削除機能**: 誤って撮影した写真の削除

### 中（推奨）

4. ⚠️ **動画撮影機能**: 必要に応じて追加
5. ⚠️ **複数写真の管理**: 1つの項目に複数の写真を撮影可能にする

---

## 8. まとめ

**現状**: 24ヶ月点検・12ヶ月点検の再設計画面には写真撮影機能が未実装

**要件**: 診断画面と同様の写真撮影機能を追加する必要がある

**データモデル**: 既に対応済み（`InspectionItemRedesign.photoUrls`）

**実装**: 診断画面の`PhotoCaptureButton`を参考に、`InspectionBottomSheetItemCard`に写真撮影機能を追加

**優先度**: **高** - 顧客への提示機能として必須





