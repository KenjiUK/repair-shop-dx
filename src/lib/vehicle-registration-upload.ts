/**
 * 車検証アップロード機能
 *
 * 車検証画像をGoogle Driveの車両documentsフォルダに保存
 */

import {
  getOrCreateVehicleDocumentsFolder,
  uploadFile,
  searchFiles,
  getOrCreateFolder,
  moveFile,
} from "./google-drive";
import { DriveFile } from "@/types";
import { ApiResponse } from "@/types";
import { validateFile, formatFileSize } from "./file-validation";

// =============================================================================
// 車検証アップロード
// =============================================================================

/**
 * 車検証をアップロード
 */
export async function uploadVehicleRegistration(
  file: File,
  customerId: string,
  customerName: string,
  vehicleId: string,
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

    // 車両のdocumentsフォルダを取得または作成
    const documentsFolder = await getOrCreateVehicleDocumentsFolder(
      customerId,
      customerName,
      vehicleId,
      vehicleName
    );

    // ファイル名を生成（shaken_{vehicleId}_{日付}.{拡張子}）
    const today = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `shaken_${vehicleId}_${today}.${extension}`;

    // 既存の車検証を履歴フォルダに移動（存在する場合）
    await archiveExistingRegistration(
      documentsFolder.id,
      vehicleId,
      fileName
    );

    // ファイルをアップロード
    const uploadedFile = await uploadFile({
      fileName,
      mimeType: file.type || "application/pdf",
      fileData: file,
      parentFolderId: documentsFolder.id,
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
        message: error instanceof Error ? error.message : "車検証のアップロードに失敗しました",
      },
    };
  }
}

/**
 * 既存の車検証を履歴フォルダに移動
 */
async function archiveExistingRegistration(
  documentsFolderId: string,
  vehicleId: string,
  newFileName: string
): Promise<void> {
  try {
    // 既存の車検証ファイルを検索
    const existingFiles = await searchFiles({
      query: `name starts with 'shaken_${vehicleId}_' and mimeType='application/pdf'`,
      parentFolderId: documentsFolderId,
    });

    if (existingFiles.length > 0) {
      // 履歴フォルダを取得または作成
      const historyFolder = await getOrCreateFolder({
        folderName: "shaken_history",
        parentFolderId: documentsFolderId,
        returnExisting: true,
      });

      // 既存ファイルを履歴フォルダに移動
      for (const file of existingFiles) {
        if (file.parents?.includes(documentsFolderId)) {
          await moveFile(file.id, historyFolder.id, { removeFromSource: true });
        }
      }
    }
  } catch (error) {
    // エラーが発生しても続行（新規アップロードは実行）
    console.warn("既存車検証のアーカイブに失敗しました:", error);
  }
}

/**
 * 車検証ファイルを取得
 */
export async function getVehicleRegistration(
  customerId: string,
  customerName: string,
  vehicleId: string,
  vehicleName: string
): Promise<ApiResponse<DriveFile | null>> {
  try {
    // 車両のdocumentsフォルダを取得
    const documentsFolder = await getOrCreateVehicleDocumentsFolder(
      customerId,
      customerName,
      vehicleId,
      vehicleName
    );

    // 車検証ファイルを検索（PDFまたは画像）
    // ファイル名パターン: shaken_{vehicleId}_{YYYYMMDD}.{ext}
    try {
      // PDFファイルを検索
      const pdfFiles = await searchFiles({
        query: `name starts with 'shaken_${vehicleId}_' and mimeType='application/pdf'`,
        parentFolderId: documentsFolder.id,
      });

      // 画像ファイルを検索
      const imageFiles = await searchFiles({
        query: `name starts with 'shaken_${vehicleId}_' and mimeType contains 'image/'`,
        parentFolderId: documentsFolder.id,
      });

      const allFiles = [...pdfFiles, ...imageFiles];

      if (allFiles.length > 0) {
        // 最新のファイルを返す（ファイル名の日付でソート）
        // ファイル名形式: shaken_{vehicleId}_{YYYYMMDD}.{ext}
        const sortedFiles = allFiles.sort((a, b) => {
          // ファイル名から日付部分を抽出して比較
          const dateA = a.name.match(/_(\d{8})\./)?.[1] || "";
          const dateB = b.name.match(/_(\d{8})\./)?.[1] || "";
          return dateB.localeCompare(dateA); // 降順（新しい順）
        });

        return {
          success: true,
          data: sortedFiles[0],
        };
      }
    } catch (error) {
      console.warn("車検証ファイルの検索に失敗しました:", error);
      // エラーが発生しても続行（nullを返す）
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "車検証の取得に失敗しました",
      },
    };
  }
}











