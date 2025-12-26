/**
 * 新規車両作成機能
 *
 * 新規車両をZoho CRMに作成し、アップロードした画像をfield12にリンク設定
 * 新規車両用の一時フォルダから正式な車両フォルダへ画像を移動
 */

import { createVehicle, addImageToJobField12, updateJobField6, fetchJobById } from "./api";
import {
  getOrCreateVehicleDocumentsFolder,
  moveFile,
} from "./google-drive";
import { ApiResponse, ZohoVehicle, ZohoJob } from "@/types";

// =============================================================================
// 新規車両作成と画像移動
// =============================================================================

/**
 * 新規車両を作成し、アップロードした画像を正式なフォルダに移動してfield12にリンク設定
 * 
 * @param jobId - ジョブID
 * @param customerId - 顧客ID
 * @param customerName - 顧客名
 * @param vehicleName - 車両名
 * @param licensePlate - 登録番号（オプション）
 * @param uploadedImageFileId - アップロード済みの画像ファイルID（新規車両用の一時フォルダ内）
 * @param uploadedImageFileName - アップロード済みの画像ファイル名
 * @returns 作成された車両情報と更新されたジョブ情報
 */
export async function createNewVehicleAndLinkImage(
  jobId: string,
  customerId: string,
  customerName: string,
  vehicleName: string,
  licensePlate: string | null,
  uploadedImageFileId: string,
  uploadedImageFileName: string
): Promise<ApiResponse<{ vehicle: ZohoVehicle; job: ZohoJob }>> {
  try {
    // 1. 新規車両を作成
    const vehicleResult = await createVehicle(customerId, vehicleName, licensePlate);
    if (!vehicleResult.success || !vehicleResult.data) {
      return {
        success: false,
        error: {
          code: "VEHICLE_CREATION_FAILED",
          message: vehicleResult.error?.message || "新規車両の作成に失敗しました",
        },
      };
    }

    const newVehicle = vehicleResult.data;

    // 2. 新規車両用の一時フォルダから正式な車両フォルダへ画像を移動
    const documentsFolder = await getOrCreateVehicleDocumentsFolder(
      customerId,
      customerName,
      newVehicle.Name,
      vehicleName
    );

    // ファイルを正式な車両フォルダに移動
    const movedFile = await moveFile(uploadedImageFileId, documentsFolder.id, {
      removeFromSource: true,
    });

    // ファイル名を正式な形式に変更（shaken_{vehicleId}_{日付}.{拡張子}）
    const today = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
    const extension = uploadedImageFileName.split(".").pop() || "jpg";
    const newFileName = `shaken_${newVehicle.Name}_${today}.${extension}`;

    // 注意: ファイル名の変更はGoogle Drive APIで直接サポートされていないため、
    // ここでは移動のみ実行。ファイル名の変更は将来実装予定。

    // 3. Jobのfield6を新規車両に更新
    const updateField6Result = await updateJobField6(jobId, newVehicle.id);
    if (!updateField6Result.success) {
      console.warn("[NewVehicle] field6の更新に失敗:", updateField6Result.error);
      // 車両作成は成功しているため、続行
    }

    // 4. Jobのfield12に画像を追加
    const imageUrl = movedFile.webViewLink || movedFile.webContentLink || "";
    if (imageUrl) {
      const addImageResult = await addImageToJobField12(jobId, imageUrl, newFileName);
      if (!addImageResult.success) {
        console.warn("[NewVehicle] field12への画像追加に失敗:", addImageResult.error);
        // 車両作成と画像移動は成功しているため、続行
      }
    }

    // ジョブ情報を取得
    const jobResult = await fetchJobById(jobId);
    const updatedJob = updateField6Result.data || jobResult.data;

    return {
      success: true,
      data: {
        vehicle: newVehicle,
        job: updatedJob!,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "VEHICLE_CREATION_ERROR",
        message: error instanceof Error ? error.message : "新規車両の作成に失敗しました",
      },
    };
  }
}



