/**
 * 画像圧縮ユーティリティ
 * 
 * 仕様書「Phase 2-2」に基づき、クライアントサイドで画像を圧縮する。
 * - 目標サイズ: 500KB以下
 * - 最大解像度: 1920px
 */

import imageCompression from "browser-image-compression";

/**
 * 画像ファイルを圧縮する
 * 
 * @param file - 元の画像ファイル
 * @returns 圧縮後の画像ファイル
 * 
 * @example
 * const compressedFile = await compressImage(originalFile);
 * console.log(`圧縮後サイズ: ${compressedFile.size / 1024} KB`);
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5, // 500KB以下
    maxWidthOrHeight: 1920, // 最大幅/高さ
    useWebWorker: true, // WebWorkerを使用（UIブロッキング防止）
    fileType: "image/jpeg" as const, // JPEG形式で出力
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    console.log(`圧縮完了: ${file.name}`);
    console.log(`元サイズ: ${(file.size / 1024).toFixed(1)} KB`);
    console.log(`圧縮後: ${(compressedFile.size / 1024).toFixed(1)} KB`);
    console.log(`圧縮率: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);
    
    return compressedFile;
  } catch (error) {
    console.error("画像圧縮エラー:", error);
    throw error;
  }
}

/**
 * 画像ファイルをリネームする
 * フォーマット: {位置}_{日付}_{車両ID}.jpg
 * 
 * @param file - 画像ファイル
 * @param position - 撮影位置 (front/rear/left/right/detail)
 * @param vehicleId - 車両ID
 * @returns リネームされたファイル
 */
export function renameImageFile(
  file: File,
  position: string,
  vehicleId: string
): File {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
  const newFileName = `${position}_${dateStr}_${vehicleId}.jpg`;
  
  return new File([file], newFileName, { type: file.type });
}

/**
 * 画像ファイルからプレビュー用のData URLを生成
 * 
 * @param file - 画像ファイル
 * @returns Data URL (base64)
 */
export function getImagePreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

