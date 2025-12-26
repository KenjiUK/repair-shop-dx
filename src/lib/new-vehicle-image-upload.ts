/**
 * 新規車両画像アップロード機能
 *
 * 新規車両登録時の車検証画像をGoogle Driveに保存
 * 車両IDがまだ存在しないため、一時的なIDを使用して保存
 */

import {
  getOrCreateCustomerFolder,
  uploadFile,
  getOrCreateFolder,
} from "./google-drive";
import { DriveFile } from "@/types";
import { ApiResponse } from "@/types";
import { validateFile } from "./file-validation";
import { compressImage } from "./compress";

// =============================================================================
// 新規車両画像アップロード
// =============================================================================

/**
 * 新規車両の車検証画像をアップロード
 * 
 * @param file - 車検証画像ファイル
 * @param customerId - 顧客ID
 * @param customerName - 顧客名
 * @param vehicleName - 車両名（新規車両名）
 * @returns アップロードされたファイル情報
 */
export async function uploadNewVehicleImage(
  file: File,
  customerId: string,
  customerName: string,
  vehicleName: string
): Promise<ApiResponse<DriveFile>> {
  try {
    // ファイルバリデーション（画像のみ、PDFは不可）
    const validation = validateFile(file, ["image"]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: validation.error || "画像ファイルのみアップロード可能です",
        },
      };
    }

    // 画像を圧縮（500KB以下）
    const compressedFile = await compressImage(file);

    // 顧客フォルダを取得または作成
    const customerFolder = await getOrCreateCustomerFolder(
      customerId,
      customerName
    );

    // 新規車両用の一時フォルダを作成（vehicles/new_vehicles）
    const vehiclesFolder = await getOrCreateFolder({
      folderName: "vehicles",
      parentFolderId: customerFolder.id,
      returnExisting: true,
    });

    const newVehiclesFolder = await getOrCreateFolder({
      folderName: "new_vehicles",
      parentFolderId: vehiclesFolder.id,
      returnExisting: true,
    });

    // ファイル名を生成（new_vehicle_{日付}_{車両名}_{タイムスタンプ}.{拡張子}）
    const today = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
    const timestamp = Date.now();
    const extension = compressedFile.name.split(".").pop() || "jpg";
    // 車両名から特殊文字を除去してファイル名に使用
    const sanitizedVehicleName = vehicleName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "_");
    const fileName = `new_vehicle_${today}_${sanitizedVehicleName}_${timestamp}.${extension}`;

    // ファイルをアップロード
    const uploadedFile = await uploadFile({
      fileName,
      mimeType: compressedFile.type || "image/jpeg",
      fileData: compressedFile,
      parentFolderId: newVehiclesFolder.id,
    });

    return {
      success: true,
      data: uploadedFile,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: error instanceof Error ? error.message : "新規車両画像のアップロードに失敗しました",
      },
    };
  }
}



