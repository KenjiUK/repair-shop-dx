# 動画ファイル名命名規則 - 実装提案

## 現在の実装状況

### 1. VideoCaptureButtonコンポーネント
- **ファイル**: `src/components/features/video-capture-button.tsx`
- **現在のファイル名**: `video-${position}-${Date.now()}.webm` (198行目)
- **問題点**: 写真と命名規則が統一されていない

### 2. 動画の使用箇所
- **診断時の証拠動画**: 異音などを録画（社内用）
- **保存先**: `02_証拠写真/` フォルダ（写真と同じフォルダ）
- **将来**: ブログ用動画も使用される可能性

### 3. 現在の保存処理
- 動画は撮影され、`URL.createObjectURL`でプレビューURLが生成される
- `evidenceVideoUrl`として診断データに保存される
- ただし、実際のGoogle Driveへのアップロード処理はまだ実装されていない可能性

## 写真の命名規則（参考）

### ブログ用（英語）
```
{位置番号}_{位置名(英語)}_{日付}_{サービス種類(英語)}_{車種名(英語)}.{拡張子}
例: 00_front_20241225_12month_inspection_Peugeot308.jpg
```

### 社内用（日本語）
```
{位置番号}_{位置名(日本語)}_{日付}_{サービス種類(日本語)}_{車種名(日本語)}.{拡張子}
例: 00_前面_20241225_12ヶ月点検_プジョー308.jpg
```

## 動画の命名規則提案

### 推奨: 写真と同じ形式に統一

#### 社内用（証拠動画）: 日本語
```
{位置番号}_{位置名(日本語)}_{日付}_{サービス種類(日本語)}_{車種名(日本語)}.{拡張子}
例: 07_異音_20241225_12ヶ月点検_プジョー308.webm
```

#### ブログ用: 英語（将来的に必要になる可能性）
```
{位置番号}_{位置名(英語)}_{日付}_{サービス種類(英語)}_{車種名(英語)}.{拡張子}
例: 00_front_20241225_12month_inspection_Peugeot308.webm
```

**メリット**:
- 写真と命名規則が統一され、管理しやすい
- Google Driveでの検索が容易
- ファイル名から情報が分かりやすい（日付、車種、サービス種類）

## 実装方針

### 1. 動画用ファイル名生成関数の追加

`src/lib/photo-position.ts` に以下を追加：

```typescript
/**
 * 社内用動画ファイル名を生成（日本語）
 * 命名規則: {位置番号}_{位置名(日本語)}_{日付}_{サービス種類(日本語)}_{車種名(日本語)}.{拡張子}
 * 例: 07_異音_20241225_12ヶ月点検_プジョー308.webm
 */
export function generateInternalVideoFileName(
  date: string,
  vehicleName: string,
  serviceKind: string,
  position: PhotoPositionKey | string,
  index: number,
  originalFileName: string
): string {
  // 拡張子を取得（動画の場合は.webmや.mp4）
  const ext = originalFileName.split(".").pop() || "webm";
  
  // 位置名を日本語ラベルに変換
  // 動画の場合、診断項目名（例: "異音"）がそのまま使われることもある
  const positionLabel = getPhotoPositionLabel(position as PhotoPositionKey);
  
  // 車種名・サービス種類をサニタイズ
  const sanitizedVehicle = sanitizeForJapaneseFileName(vehicleName);
  const sanitizedService = sanitizeForJapaneseFileName(serviceKind);
  
  // 位置番号を2桁ゼロ埋め
  const paddedIndex = String(index).padStart(2, "0");
  
  return `${paddedIndex}_${positionLabel}_${date}_${sanitizedService}_${sanitizedVehicle}.${ext}`;
}

/**
 * ブログ用動画ファイル名を生成（英語）
 * 命名規則: {位置番号}_{位置名(英語)}_{日付}_{サービス種類(英語)}_{車種名(英語)}.{拡張子}
 * 例: 00_front_20241225_12month_inspection_Peugeot308.webm
 */
export function generateBlogVideoFileName(
  date: string,
  vehicleName: string,
  serviceKind: string,
  position: PhotoPositionKey | string,
  index: number,
  originalFileName: string
): string {
  // 拡張子を取得
  const ext = originalFileName.split(".").pop() || "webm";
  
  // 英語化（簡易的なサニタイズ、将来的に翻訳機能を追加可能）
  const englishVehicleName = sanitizeForEnglishFileName(vehicleName);
  const englishServiceKind = sanitizeForEnglishFileName(serviceKind);
  
  // 位置名は英語キーとして扱う
  const positionKey = (position as PhotoPositionKey) || "other";
  
  // 位置番号を2桁ゼロ埋め
  const paddedIndex = String(index).padStart(2, "0");
  
  return `${paddedIndex}_${positionKey}_${date}_${englishServiceKind}_${englishVehicleName}.${ext}`;
}

/**
 * 英語ファイル名用にサニタイズ（特殊文字のみ削除・置換）
 */
function sanitizeForEnglishFileName(text: string): string {
  // 特殊文字を削除・置換
  let sanitized = text.replace(/[\/\\:*?"<>|]/g, "_");
  sanitized = sanitized.replace(/_+/g, "_");
  sanitized = sanitized.replace(/^_+|_+$/g, "");
  return sanitized || "unknown";
}
```

### 2. VideoCaptureButtonの変更（オプション）

現在、VideoCaptureButtonは一時的なファイル名（`video-${position}-${Date.now()}.webm`）を生成していますが、実際の保存時に正しいファイル名を生成するため、この一時的なファイル名はそのままで問題ありません。

### 3. 診断画面での動画保存処理

診断画面（`src/app/mechanic/diagnosis/[id]/page.tsx`）の`handleInspectionVideoCapture`や、実際のGoogle Driveアップロード処理で、ファイル名生成関数を使用します。

**実装例**:
```typescript
import { generateInternalVideoFileName } from "@/lib/photo-position";

const handleInspectionVideoCapture = async (itemId: string, file: File) => {
  try {
    // 現在の日付を取得（YYYYMMDD形式）
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    
    // ファイル名を生成
    const fileName = generateInternalVideoFileName(
      date,
      job?.field6 || "不明", // 車種名
      job?.field2 || "不明", // サービス種類
      itemId, // 位置（診断項目ID、例: "異音"）
      0, // index（動画は通常1項目1ファイル）
      file.name
    );
    
    // Google Driveにアップロード（実装が必要な場合）
    // const evidencePhotoFolder = await getOrCreateWorkOrderFolder(...);
    // const uploadedFile = await uploadFile({
    //   fileName,
    //   mimeType: file.type,
    //   fileData: file,
    //   parentFolderId: evidencePhotoFolder.id,
    // });
    
    // プレビューURLを生成
    const previewUrl = URL.createObjectURL(file);
    // ...
  } catch (error) {
    // ...
  }
};
```

## 課題と対応

### 課題1: 位置情報の取得
- **現状**: 動画の場合、診断項目ID（例: "異音"）が位置として使われる
- **対応**: `getPhotoPositionLabel`でマッピングできない場合は、そのまま使用（例: "異音"）

### 課題2: Google Driveアップロード処理
- **現状**: 動画ファイルのGoogle Driveアップロード処理はまだ実装されていない可能性
- **対応**: 実装が必要な場合は、写真と同様の処理を追加

### 課題3: ブログ用動画
- **現状**: ブログ用動画はまだ使用されていない
- **対応**: 将来的に必要になった場合、`generateBlogVideoFileName`を使用

## 実装順序

1. ✅ ファイル名生成関数の追加（`photo-position.ts`）
2. ⏳ VideoCaptureButtonの一時ファイル名はそのまま（実際の保存時に正しいファイル名を生成）
3. ⏳ 診断画面での動画保存処理を確認・修正（ファイル名生成関数を使用）
4. ⏳ Google Driveアップロード処理を確認・実装（必要に応じて）
5. ⏳ 実装後のレビューとテスト




