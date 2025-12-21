/**
 * 車検・12ヵ月点検引渡機能
 *
 * 分解整備記録簿PDF生成、Google Drive保存、ステータス更新
 */

import { ApiResponse, DriveFile, DriveFolder } from "@/types";
import { generateInspectionRecordPDF, InspectionRecordData } from "./inspection-pdf-generator";

// InspectionRecordDataを再エクスポート
export type { InspectionRecordData };
import {
  getOrCreateJobFolder,
  getOrCreateFolder,
  uploadFile,
} from "./google-drive";

// =============================================================================
// 引渡処理
// =============================================================================

/**
 * 車検・12ヵ月点検引渡処理を実行
 *
 * @param jobId Job ID
 * @param data 分解整備記録簿データ
 * @param customerId 顧客ID
 * @param customerName 顧客名
 * @param vehicleId 車両ID
 * @param vehicleName 車両名
 * @returns 保存されたPDFファイル情報
 */
export async function completeInspectionDelivery(
  jobId: string,
  data: InspectionRecordData,
  customerId: string,
  customerName: string,
  vehicleId: string,
  vehicleName: string
): Promise<ApiResponse<DriveFile>> {
  try {
    // 1. PDFを生成
    const pdfResult = await generateInspectionRecordPDF(data);
    if (!pdfResult.success || !pdfResult.data) {
      return {
        success: false,
        error: {
          code: "PDF_GENERATION_FAILED",
          message: pdfResult.error?.message || "PDFの生成に失敗しました",
        },
      };
    }

    // 2. Jobフォルダを取得または作成
    // jobDateをYYYYMMDD形式で生成（dataに含まれている場合はそれを使用、なければ現在日付）
    const jobDate = data.inspectionDate 
      ? data.inspectionDate.replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const jobFolder = await getOrCreateJobFolder(
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      jobId,
      jobDate
    );

    // 3. 書類フォルダを取得または作成
    const documentsFolder = await getOrCreateFolder({
      folderName: "書類",
      parentFolderId: jobFolder.id,
      returnExisting: true,
    });

    // 4. ファイル名を生成（分解整備記録簿_[日付]_[車両名].pdf）
    const today = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
    const fileName = `分解整備記録簿_${today}_${vehicleName}.pdf`;

    // 5. PDFをBlobからFileに変換
    const pdfFile = new File([pdfResult.data], fileName, {
      type: "application/pdf",
    });

    // 6. Google Driveにアップロード
    const uploadedFile = await uploadFile({
      fileName,
      mimeType: "application/pdf",
      fileData: pdfFile,
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
        code: "DELIVERY_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "引渡処理に失敗しました",
      },
    };
  }
}











