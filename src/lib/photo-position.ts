/**
 * 写真位置のマッピング定義
 * 
 * ブログ用・レポート用で統一して使用する位置名のマッピング
 */

/**
 * 写真位置のキー（英語）
 */
export type PhotoPositionKey = "front" | "rear" | "left" | "right" | "engine" | "interior" | "damage" | "other";

/**
 * 写真位置のマッピング（英語キー → 日本語ラベル）
 */
export const PHOTO_POSITION_MAP: Record<PhotoPositionKey, string> = {
  front: "前面",
  rear: "後面",
  left: "左側面",
  right: "右側面",
  engine: "エンジンルーム",
  interior: "内装",
  damage: "傷・凹み",
  other: "その他",
};

/**
 * 写真位置の日本語ラベルを取得
 */
export function getPhotoPositionLabel(position: PhotoPositionKey | string): string {
  return PHOTO_POSITION_MAP[position as PhotoPositionKey] || position;
}

/**
 * 写真位置の英語キーを取得（日本語ラベルから逆引き）
 * @deprecated 現在使用されていません
 */
export function getPhotoPositionKey(label: string): PhotoPositionKey | string {
  const entry = Object.entries(PHOTO_POSITION_MAP).find(([, value]) => value === label);
  return entry ? (entry[0] as PhotoPositionKey) : label;
}

/**
 * ブログ用写真の位置定義（撮影時に使用）
 */
export const BLOG_PHOTO_POSITIONS: Array<{ position: PhotoPositionKey; label: string }> = [
  { position: "front", label: PHOTO_POSITION_MAP.front },
  { position: "rear", label: PHOTO_POSITION_MAP.rear },
  { position: "left", label: PHOTO_POSITION_MAP.left },
  { position: "right", label: PHOTO_POSITION_MAP.right },
  { position: "engine", label: PHOTO_POSITION_MAP.engine },
  { position: "interior", label: PHOTO_POSITION_MAP.interior },
  { position: "damage", label: PHOTO_POSITION_MAP.damage },
  { position: "other", label: PHOTO_POSITION_MAP.other },
];

/**
 * 入庫時写真の位置定義（基本的な4方向）
 */
export const INTAKE_PHOTO_POSITIONS: Array<{ position: PhotoPositionKey; label: string }> = [
  { position: "front", label: PHOTO_POSITION_MAP.front },
  { position: "rear", label: PHOTO_POSITION_MAP.rear },
  { position: "left", label: PHOTO_POSITION_MAP.left },
  { position: "right", label: PHOTO_POSITION_MAP.right },
];

/**
 * 社内用ファイル名を生成（日本語）
 * 命名規則: {位置番号}_{位置名(日本語)}_{日付}_{サービス種類(日本語)}_{車種名(日本語)}.{拡張子}
 * 例: 00_前面_20241225_12ヶ月点検_プジョー308.jpg
 */
export function generateInternalPhotoFileName(
  date: string,
  vehicleName: string,
  serviceKind: string,
  position: PhotoPositionKey | string, // 写真位置（英語キーまたは日本語ラベル）
  index: number,
  originalFileName: string
): string {
  // 拡張子を取得
  const ext = originalFileName.split(".").pop() || "jpg";
  
  // 位置名を日本語ラベルに変換（英語キーの場合は日本語に、既に日本語の場合はそのまま）
  const positionLabel = getPhotoPositionLabel(position as PhotoPositionKey);
  
  // 車種名をサニタイズ（特殊文字を削除、日本語はそのまま）
  const sanitizedVehicle = sanitizeForJapaneseFileName(vehicleName);
  
  // 作業種類をサニタイズ（特殊文字を削除、日本語はそのまま）
  const sanitizedService = sanitizeForJapaneseFileName(serviceKind);
  
  // 位置番号を2桁ゼロ埋め
  const paddedIndex = String(index).padStart(2, "0");
  
  return `${paddedIndex}_${positionLabel}_${date}_${sanitizedService}_${sanitizedVehicle}.${ext}`;
}

/**
 * 日本語ファイル名用にサニタイズ（特殊文字のみ削除・置換、日本語はそのまま）
 */
export function sanitizeForJapaneseFileName(text: string): string {
  // 特殊文字を削除・置換（日本語文字はそのまま）
  let sanitized = text.replace(/[\/\\:*?"<>|]/g, "_");
  // 複数のアンダースコアを1つに
  sanitized = sanitized.replace(/_+/g, "_");
  // 前後のアンダースコアを削除
  sanitized = sanitized.replace(/^_+|_+$/g, "");
  return sanitized || "不明";
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

/**
 * 社内用動画ファイル名を生成（日本語）
 * 命名規則: {位置番号}_{位置名(日本語)}_{日付}_{サービス種類(日本語)}_{車種名(日本語)}.{拡張子}
 * 例: 07_異音_20241225_12ヶ月点検_プジョー308.webm
 */
export function generateInternalVideoFileName(
  date: string,
  vehicleName: string,
  serviceKind: string,
  position: PhotoPositionKey | string, // 動画位置（英語キー、日本語ラベル、または診断項目名）
  index: number,
  originalFileName: string
): string {
  // 拡張子を取得（動画の場合は.webmや.mp4）
  const ext = originalFileName.split(".").pop() || "webm";
  
  // 位置名を日本語ラベルに変換
  // 動画の場合、診断項目名（例: "異音"）がそのまま使われることもある
  // getPhotoPositionLabelでマッピングできない場合は、そのまま使用
  let positionLabel: string;
  if (PHOTO_POSITION_MAP[position as PhotoPositionKey]) {
    positionLabel = getPhotoPositionLabel(position as PhotoPositionKey);
  } else {
    // 既に日本語ラベルの場合、そのまま使用（サニタイズのみ）
    positionLabel = sanitizeForJapaneseFileName(position);
  }
  
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
  position: PhotoPositionKey | string, // 動画位置（英語キーまたは診断項目名）
  index: number,
  originalFileName: string
): string {
  // 拡張子を取得
  const ext = originalFileName.split(".").pop() || "webm";
  
  // 位置名を英語キーに変換
  // PhotoPositionKeyにマッピングできる場合は英語キーを使用
  // そうでない場合はサニタイズした位置名を使用
  let positionKey: string;
  if (PHOTO_POSITION_MAP[position as PhotoPositionKey]) {
    positionKey = position as PhotoPositionKey;
  } else {
    // 診断項目名などの場合は、英語化（簡易的なサニタイズ）
    positionKey = sanitizeForEnglishFileName(position);
  }
  
  // 英語化（簡易的なサニタイズ、将来的に翻訳機能を追加可能）
  const englishVehicleName = sanitizeForEnglishFileName(vehicleName);
  const englishServiceKind = sanitizeForEnglishFileName(serviceKind);
  
  // 位置番号を2桁ゼロ埋め
  const paddedIndex = String(index).padStart(2, "0");
  
  return `${paddedIndex}_${positionKey}_${date}_${englishServiceKind}_${englishVehicleName}.${ext}`;
}

