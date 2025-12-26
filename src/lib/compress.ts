/**
 * 画像圧縮ユーティリティ
 * 
 * 仕様書「Phase 2-2」に基づき、クライアントサイドで画像を圧縮する。
 * - 目標サイズ: 500KB以下
 * - 最大解像度: 1920px
 */

import imageCompression from "browser-image-compression";

/**
 * 画像を3:2のアスペクト比に変換（中央トリミング）
 * 
 * @param file - 元の画像ファイル
 * @returns 3:2アスペクト比に変換された画像ファイル
 */
export async function convertToAspectRatio32(file: File): Promise<File> {
  try {
    const imageDataUrl = await getImagePreviewUrl(file);
    const image = await loadImage(imageDataUrl);

    // 3:2のアスペクト比を計算
    const targetAspectRatio = 3 / 2;
    const imageAspectRatio = image.width / image.height;

    let cropWidth: number;
    let cropHeight: number;
    let cropX = 0;
    let cropY = 0;

    if (imageAspectRatio > targetAspectRatio) {
      // 元画像がより横長の場合、幅を基準に高さを計算
      cropWidth = image.width;
      cropHeight = image.width / targetAspectRatio;
      // 中央に配置（上下をトリミング）
      cropY = (image.height - cropHeight) / 2;
    } else {
      // 元画像がより縦長の場合、高さを基準に幅を計算
      cropHeight = image.height;
      cropWidth = image.height * targetAspectRatio;
      // 中央に配置（左右をトリミング）
      cropX = (image.width - cropWidth) / 2;
    }

    // Canvasを作成してトリミング
    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context could not be created");
    }

    // 元画像を中央トリミングして描画
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    // CanvasをBlobに変換
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }
          const croppedFile = new File([blob], file.name, {
            type: "image/jpeg",
          });
          resolve(croppedFile);
        },
        "image/jpeg",
        0.95
      );
    });
  } catch (error) {
    console.error("アスペクト比変換エラー:", error);
    // エラーが発生した場合は元のファイルを返す
    return file;
  }
}

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
 * 画像ファイルをリネームする（非推奨）
 * 
 * @deprecated この関数は非推奨です。代わりに `generateInternalPhotoFileName` を使用してください。
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
  // 簡易的なフォーマット（後方互換性のため維持）
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

/**
 * 画像にウォーターマーク（ロゴ）を合成
 * 仕様書「Phase 2-2」に基づき、画像の右下に会社ロゴの透かしを追加
 * 
 * @param file - 元の画像ファイル
 * @param logoPath - ロゴ画像のパス（デフォルト: /YMWORKS-logo.png）
 * @param options - オプション設定
 * @returns ウォーターマーク付きの画像ファイル
 */
export async function addWatermark(
  file: File,
  logoPath: string = "/YMWORKS-logo.png",
  options: {
    opacity?: number; // 透明度（0-1、デフォルト: 0.7）
    size?: number; // ロゴサイズ（元画像の幅に対する割合、デフォルト: 0.15 = 15%）
    padding?: number; // 右下からの余白（px、デフォルト: 20）
  } = {}
): Promise<File> {
  const { opacity = 0.7, size = 0.15, padding = 20 } = options;

  try {
    // 元画像を読み込み
    const imageDataUrl = await getImagePreviewUrl(file);
    const image = await loadImage(imageDataUrl);

    // ロゴ画像を読み込み
    const logoImage = await loadLogoImage(logoPath);

    // Canvasを作成
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context could not be created");
    }

    // 元画像を描画
    ctx.drawImage(image, 0, 0);

    // ロゴのサイズを計算（元画像の幅に対する割合）
    const logoWidth = Math.max(image.width * size, 100); // 最小100px
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

    // ロゴの配置位置（右下）
    const logoX = canvas.width - logoWidth - padding;
    const logoY = canvas.height - logoHeight - padding;

    // 透明度を設定してロゴを描画
    ctx.globalAlpha = opacity;
    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0; // 透明度をリセット

    // CanvasをBlobに変換
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }
          const watermarkedFile = new File([blob], file.name, {
            type: "image/jpeg",
          });
          resolve(watermarkedFile);
        },
        "image/jpeg",
        0.95 // JPEG品質（0-1）
      );
    });
  } catch (error) {
    console.error("ウォーターマーク合成エラー:", error);
    // エラーが発生した場合は元のファイルを返す
    return file;
  }
}

/**
 * 画像URLからImageオブジェクトを読み込む（ヘルパー関数）
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * ロゴ画像を読み込む（ヘルパー関数）
 */
function loadLogoImage(logoPath: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (error) => {
      console.error("ロゴ画像の読み込みに失敗しました:", logoPath, error);
      // ロゴ読み込み失敗時は透明な1x1画像を返す
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    };
    img.src = logoPath;
  });
}

/**
 * 画像ファイルを端末のローカルストレージに保存
 * File System Access API（Chrome系）またはダウンロード方式で保存
 * 
 * @param file - 保存する画像ファイル
 * @param fileName - ファイル名（省略時はfile.nameを使用）
 * @returns 保存成功時true、失敗時false
 */
export async function saveImageToLocal(file: File, fileName?: string): Promise<boolean> {
  try {
    const saveFileName = fileName || file.name;

    // File System Access API（Chrome系ブラウザ）をサポートしている場合
    if ("showSaveFilePicker" in window) {
      try {
        const windowWithFileSystem = window as Window & {
          showSaveFilePicker?: (options: {
            suggestedName?: string;
            types?: Array<{
              description?: string;
              accept?: Record<string, string[]>;
            }>;
          }) => Promise<FileSystemFileHandle>;
        };
        const fileHandle = await windowWithFileSystem.showSaveFilePicker!({
          suggestedName: saveFileName,
          types: [
            {
              description: "画像ファイル",
              accept: {
                "image/jpeg": [".jpg", ".jpeg"],
                "image/png": [".png"],
              },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
        return true;
      } catch (error: any) {
        // ユーザーがキャンセルした場合など
        if (error.name === "AbortError") {
          return false;
        }
        // その他のエラーはダウンロード方式にフォールバック
        console.warn("File System Access API failed, falling back to download:", error);
      }
    }

    // フォールバック: ダウンロード方式（すべてのブラウザで動作）
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = saveFileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("ローカル保存エラー:", error);
    return false;
  }
}









