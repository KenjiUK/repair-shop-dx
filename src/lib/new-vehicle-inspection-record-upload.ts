/**
 * 新規車両の自動車検査証記録事項アップロード機能
 *
 * 新規車両登録時の自動車検査証記録事項をGoogle Driveに保存
 * 車両IDがまだ存在しないため、new_vehiclesフォルダに保存
 */

import {
  getOrCreateCustomerFolder,
  uploadFile,
  getOrCreateFolder,
} from "./google-drive";
import { DriveFile } from "@/types";
import { ApiResponse } from "@/types";
import { validateFile } from "./file-validation";

// =============================================================================
// 新規車両の自動車検査証記録事項アップロード
// =============================================================================

/**
 * 新規車両の自動車検査証記録事項をアップロード
 * 
 * @param file - 自動車検査証記録事項ファイル
 * @param customerId - 顧客ID
 * @param customerName - 顧客名
 * @param vehicleName - 車両名（新規車両名）
 * @returns アップロードされたファイル情報
 */
export async function uploadNewVehicleInspectionRecord(
  file: File,
  customerId: string,
  customerName: string,
  vehicleName: string
): Promise<ApiResponse<DriveFile>> {
  try {
    // ファイルバリデーション（PDFまたは画像）
    const validation = validateFile(file, ["image", "pdf"]);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: validation.error || "ファイルの形式が不正です",
        },
      };
    }

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

    // ファイル名を生成（inspection_record_new_{日付}_{車両名}_{タイムスタンプ}.{拡張子}）
    const today = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    // 車両名から特殊文字を除去してファイル名に使用
    const sanitizedVehicleName = vehicleName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "_");
    const fileName = `inspection_record_new_${today}_${sanitizedVehicleName}_${timestamp}.${extension}`;

    // ファイルをアップロード
    const uploadedFile = await uploadFile({
      fileName,
      mimeType: file.type || "application/pdf",
      fileData: file,
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
        message: error instanceof Error ? error.message : "自動車検査証記録事項のアップロードに失敗しました",
      },
    };
  }
}

