/**
 * 自動車検査証記録事項アップロード機能
 *
 * ICタグ付き車検証の場合、自動車検査証記録事項もアップロード可能
 * 車両のdocumentsフォルダに保存
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
import { validateFile } from "./file-validation";

// =============================================================================
// 自動車検査証記録事項アップロード
// =============================================================================

/**
 * 自動車検査証記録事項をアップロード
 */
export async function uploadInspectionRecord(
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

    // ファイル名を生成（inspection_record_{vehicleId}_{日付}.{拡張子}）
    const today = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `inspection_record_${vehicleId}_${today}.${extension}`;

    // 既存の自動車検査証記録事項を履歴フォルダに移動（存在する場合）
    await archiveExistingInspectionRecord(
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
        message: error instanceof Error ? error.message : "自動車検査証記録事項のアップロードに失敗しました",
      },
    };
  }
}

/**
 * 既存の自動車検査証記録事項を履歴フォルダに移動
 */
async function archiveExistingInspectionRecord(
  documentsFolderId: string,
  vehicleId: string,
  newFileName: string
): Promise<void> {
  try {
    // 既存の自動車検査証記録事項を検索（PDFと画像の両方）
    const pdfFiles = await searchFiles({
      query: `name starts with 'inspection_record_${vehicleId}_' and mimeType='application/pdf'`,
      parentFolderId: documentsFolderId,
    });

    const imageFiles = await searchFiles({
      query: `name starts with 'inspection_record_${vehicleId}_' and mimeType contains 'image/'`,
      parentFolderId: documentsFolderId,
    });

    const existingFiles = [...pdfFiles, ...imageFiles];

    if (existingFiles.length > 0) {
      // 履歴フォルダを作成または取得
      const historyFolder = await getOrCreateFolder({
        folderName: "inspection_record_history",
        parentFolderId: documentsFolderId,
        returnExisting: true,
      });

      // 既存ファイルを履歴フォルダに移動
      for (const existingFile of existingFiles) {
        if (existingFile.parents?.includes(documentsFolderId)) {
          await moveFile(existingFile.id, historyFolder.id, {
            removeFromSource: true,
          });
        }
      }
    }
  } catch (error) {
    // 履歴移動の失敗は無視（アップロードは続行）
    console.warn("既存の自動車検査証記録事項の履歴移動に失敗しました:", error);
  }
}

/**
 * 自動車検査証記録事項ファイルを取得
 */
export async function getInspectionRecord(
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

    // 自動車検査証記録事項ファイルを検索（PDFまたは画像）
    try {
      // PDFファイルを検索
      const pdfFiles = await searchFiles({
        query: `name starts with 'inspection_record_${vehicleId}_' and mimeType='application/pdf'`,
        parentFolderId: documentsFolder.id,
      });

      // 画像ファイルを検索
      const imageFiles = await searchFiles({
        query: `name starts with 'inspection_record_${vehicleId}_' and mimeType contains 'image/'`,
        parentFolderId: documentsFolder.id,
      });

      const allFiles = [...pdfFiles, ...imageFiles];

      if (allFiles.length > 0) {
        // 最新のファイルを返す（ファイル名の日付でソート）
        const sortedFiles = allFiles.sort((a, b) => {
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
      console.warn("自動車検査証記録事項ファイルの検索に失敗しました:", error);
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
        message: error instanceof Error ? error.message : "自動車検査証記録事項の取得に失敗しました",
      },
    };
  }
}

