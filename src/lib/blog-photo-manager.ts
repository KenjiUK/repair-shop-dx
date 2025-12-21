/**
 * ブログ用写真管理機能
 * 
 * 作業完了写真をブログ用に分類・コピー・リネームする機能
 */

import { DriveFile, DriveFolder } from "@/types";
import { getOrCreateFolder, uploadFile, copyFile, getOrCreateRootFolder, getFileById, getOrCreateWorkOrderFolder, getWorkJsonContent, updateWorkJsonContent } from "./google-drive";
import { fetchJobById } from "./api";

// =============================================================================
// Constants
// =============================================================================

/**
 * ブログ用公開済みフラグのキー
 */
const BLOG_PUBLISHED_FLAG_KEY = "blogPublished";

// =============================================================================
// Types
// =============================================================================

/**
 * ブログ用写真の分類フォルダパス
 */
export type BlogPhotoCategory =
  | "by-date" // 日付別
  | "by-service" // 作業種類別
  | "by-vehicle-type" // 車種別
  | "before-after"; // Before/After別

/**
 * ブログ用写真コピーリクエスト
 */
export interface BlogPhotoCopyRequest {
  /** 元のファイルID */
  sourceFileId: string;
  /** 元のファイル名 */
  sourceFileName: string;
  /** 新しいファイル名 */
  newFileName: string;
  /** コピー先フォルダID */
  targetFolderId: string;
}

/**
 * ブログ用写真コピーレスポンス
 */
export interface BlogPhotoCopyResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * ブログ用写真公開リクエスト
 */
export interface BlogPhotoPublishRequest {
  /** Job ID */
  jobId: string;
  /** WorkOrder ID（オプション、指定されない場合は最初のワークオーダーを使用） */
  workOrderId?: string;
  /** 選択された写真のファイルIDリスト */
  photoFileIds: string[];
  /** 車両情報 */
  vehicle: {
    name: string;
    manufacturer?: string; // メーカー（例: "トヨタ"）
  };
  /** 作業種類 */
  serviceKind: string;
  /** 作業日（YYYYMMDD形式） */
  workDate: string;
  /** Before/Afterの種類（オプション） */
  beforeAfterType?: "before" | "after" | "both";
}

/**
 * ブログ用写真公開レスポンス
 */
export interface BlogPhotoPublishResponse {
  success: boolean;
  publishedFiles?: Array<{
    fileId: string;
    fileName: string;
    category: BlogPhotoCategory;
    folderPath: string;
  }>;
  error?: {
    code: string;
    message: string;
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 日付フォルダパスを生成（YYYYMM/YYYYMMDD）
 */
function generateDateFolderPath(date: string): string {
  // dateはYYYYMMDD形式を想定
  const yearMonth = date.substring(0, 6); // YYYYMM
  return `blog-photos/by-date/${yearMonth}/${date}`;
}

/**
 * 作業種類フォルダパスを生成
 */
function generateServiceFolderPath(serviceKind: string): string {
  // 作業種類名をそのまま使用（スラッシュ等の特殊文字は置換）
  const sanitized = serviceKind.replace(/[\/\\]/g, "_");
  return `blog-photos/by-service/${sanitized}`;
}

/**
 * 車種フォルダパスを生成
 */
function generateVehicleTypeFolderPath(manufacturer: string): string {
  // メーカー名をそのまま使用（スラッシュ等の特殊文字は置換）
  const sanitized = manufacturer.replace(/[\/\\]/g, "_");
  return `blog-photos/by-vehicle-type/${sanitized}`;
}

/**
 * Before/Afterフォルダパスを生成
 */
function generateBeforeAfterFolderPath(type: "before" | "after" | "both"): string {
  if (type === "both") {
    return "blog-photos/before-after/both";
  }
  return `blog-photos/before-after/${type}`;
}

/**
 * フォルダパスからフォルダIDを取得（フォルダが存在しない場合は作成）
 * @param folderPath フォルダパス（例: "blog-photos/by-date/202501/20250117"）
 * @returns フォルダID
 */
async function getFolderIdByPath(folderPath: string): Promise<string> {
  const parts = folderPath.split("/").filter(Boolean);
  let currentFolder = await getOrCreateRootFolder();

  // 各階層のフォルダを取得または作成
  for (const folderName of parts) {
    currentFolder = await getOrCreateFolder({
      folderName,
      parentFolderId: currentFolder.id,
      returnExisting: true,
    });
  }

  return currentFolder.id;
}

/**
 * ブログ用ファイル名を生成
 * 命名規則: {日付}_{車種}_{作業種類}_{種類}_{連番}.{拡張子}
 */
export function generateBlogPhotoFileName(
  date: string,
  vehicleName: string,
  serviceKind: string,
  type: "before" | "after" | "general",
  index: number,
  originalFileName: string
): string {
  // 拡張子を取得
  const ext = originalFileName.split(".").pop() || "jpg";
  
  // 車種名をサニタイズ（特殊文字を削除）
  const sanitizedVehicle = vehicleName.replace(/[\/\\:]/g, "_");
  
  // 作業種類をサニタイズ
  const sanitizedService = serviceKind.replace(/[\/\\:]/g, "_");
  
  // 種類をサニタイズ
  const sanitizedType = type === "general" ? "general" : type;
  
  // 連番を3桁ゼロ埋め
  const paddedIndex = String(index).padStart(3, "0");
  
  return `${date}_${sanitizedVehicle}_${sanitizedService}_${sanitizedType}_${paddedIndex}.${ext}`;
}

// =============================================================================
// Main Functions
// =============================================================================

/**
 * ブログ用写真をコピー（内部関数、直接使用しない）
 * 
 * @param request コピーリクエスト
 * @returns コピーレスポンス
 * @deprecated この関数は直接使用せず、copyFile関数を使用してください
 */
async function copyBlogPhoto(
  request: BlogPhotoCopyRequest
): Promise<BlogPhotoCopyResponse> {
  try {
    // Google Drive APIを使用してファイルをコピー
    const copiedFile = await copyFile(request.sourceFileId, request.targetFolderId, {
      newFileName: request.newFileName,
    });

    return {
      success: true,
      fileId: copiedFile.id,
      fileName: copiedFile.name,
    };
  } catch (error) {
    console.error("ブログ用写真コピーエラー:", error);
    return {
      success: false,
      error: {
        code: "COPY_ERROR",
        message: error instanceof Error ? error.message : "写真のコピーに失敗しました",
      },
    };
  }
}

/**
 * ブログ用写真を公開（複数フォルダにコピー）
 * 
 * @param request 公開リクエスト
 * @returns 公開レスポンス
 */
export async function publishBlogPhotos(
  request: BlogPhotoPublishRequest
): Promise<BlogPhotoPublishResponse> {
  try {
    // Google Drive APIを使用して複数フォルダにコピー

    const publishedFiles: BlogPhotoPublishResponse["publishedFiles"] = [];
    
    // 各分類フォルダにコピー
    const categories: Array<{ category: BlogPhotoCategory; path: string }> = [
      {
        category: "by-date",
        path: generateDateFolderPath(request.workDate),
      },
      {
        category: "by-service",
        path: generateServiceFolderPath(request.serviceKind),
      },
    ];

    // メーカーが指定されている場合、車種別フォルダも追加
    if (request.vehicle.manufacturer) {
      categories.push({
        category: "by-vehicle-type",
        path: generateVehicleTypeFolderPath(request.vehicle.manufacturer),
      });
    }

    // Before/Afterタイプが指定されている場合、Before/Afterフォルダも追加
    if (request.beforeAfterType) {
      categories.push({
        category: "before-after",
        path: generateBeforeAfterFolderPath(request.beforeAfterType),
      });
    }

    // 各写真を各フォルダにコピー
    for (let i = 0; i < request.photoFileIds.length; i++) {
      const photoFileId = request.photoFileIds[i];
      
      // 元のファイル情報を取得
      let originalFileName = `photo_${i + 1}.jpg`;
      try {
        const sourceFile = await getFileById(photoFileId);
        originalFileName = sourceFile.name;
      } catch (error) {
        console.warn(`ファイルID ${photoFileId} の情報取得に失敗しました:`, error);
        // エラーが発生しても続行（デフォルトのファイル名を使用）
      }
      
      // 写真の種類を判定（Before/After/General）
      // 注意: 現在の実装では、すべての写真が同じタイプとして扱われる
      // 将来的には、各写真ごとにタイプを指定できるようにする
      const photoType: "before" | "after" | "general" = 
        request.beforeAfterType === "before" ? "before" :
        request.beforeAfterType === "after" ? "after" :
        "general";

      // 新しいファイル名を生成
      const newFileName = generateBlogPhotoFileName(
        request.workDate,
        request.vehicle.name,
        request.serviceKind,
        photoType,
        i + 1,
        originalFileName
      );

      // 各カテゴリフォルダにコピー
      for (const { category, path } of categories) {
        try {
          // フォルダパスからフォルダIDを取得
          const targetFolderId = await getFolderIdByPath(path);

          // ファイルをコピー
          const copiedFile = await copyFile(photoFileId, targetFolderId, {
            newFileName,
          });

          publishedFiles.push({
            fileId: copiedFile.id,
            fileName: copiedFile.name,
            category,
            folderPath: path,
          });
        } catch (error) {
          console.error(`フォルダ "${path}" へのコピーに失敗しました:`, error);
          // エラーが発生しても続行（他のフォルダへのコピーは実行）
        }
      }
    }

    // JSONファイルに「ブログ用に公開済み」フラグを記録
    try {
      // Job情報を取得
      const jobResult = await fetchJobById(request.jobId);
      if (!jobResult.success || !jobResult.data) {
        throw new Error("Job情報の取得に失敗しました");
      }

      const job = jobResult.data;
      const customerId = job.field4?.id || "";
      const customerName = job.field4?.name || "";
      const vehicleId = job.field6?.id || "";
      const vehicleName = job.field6?.name || "";
      const jobDate = job.field22 ? new Date(job.field22).toISOString().slice(0, 10).replace(/-/g, "") : request.workDate;
      
      // WorkOrder IDを取得（指定されていない場合は最初のワークオーダーを使用）
      let workOrderId = request.workOrderId;
      // TODO: ZohoJob型にworkOrdersプロパティが追加されたら実装
      if (!workOrderId) {
        // ワークオーダーIDが取得できない場合は、jobIdを使用
        workOrderId = request.jobId;
      }

      // ワークオーダーフォルダを取得
      const workOrderFolder = await getOrCreateWorkOrderFolder(
        customerId,
        customerName,
        vehicleId,
        vehicleName,
        request.jobId,
        jobDate,
        workOrderId
      );

      // work.jsonファイルの内容を取得
      const workJsonData = await getWorkJsonContent(workOrderFolder.id);
      let workData: any = {};

      if (workJsonData) {
        try {
          workData = JSON.parse(workJsonData.content);
        } catch (parseError) {
          console.warn("work.jsonファイルのパースに失敗しました。新規作成します:", parseError);
          workData = {};
        }
      }

      // ブログ用公開済みフラグを追加/更新
      workData[BLOG_PUBLISHED_FLAG_KEY] = {
        publishedAt: new Date().toISOString(),
        photoIds: request.photoFileIds,
        publishedFiles: publishedFiles,
      };

      // work.jsonファイルを更新
      await updateWorkJsonContent(
        workOrderFolder.id,
        JSON.stringify(workData, null, 2)
      );

      console.log("ブログ用公開済みフラグを記録しました:", {
        jobId: request.jobId,
        workOrderId,
        publishedPhotoIds: request.photoFileIds,
        publishedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("ブログ用公開済みフラグの記録に失敗しました:", error);
      // エラーが発生しても続行（写真のコピーは完了しているため）
    }

    return {
      success: true,
      publishedFiles,
    };
  } catch (error) {
    console.error("ブログ用写真公開エラー:", error);
    return {
      success: false,
      error: {
        code: "PUBLISH_ERROR",
        message: error instanceof Error ? error.message : "写真の公開に失敗しました",
      },
    };
  }
}

/**
 * ブログ用公開済みフラグを取得
 * 
 * @param jobId Job ID
 * @param workOrderId WorkOrder ID（オプション、指定されない場合は最初のワークオーダーを使用）
 * @returns 公開済みフラグ情報（存在しない場合はnull）
 */
export async function getBlogPublishedFlag(
  jobId: string,
  workOrderId?: string
): Promise<{
  publishedAt: string;
  photoIds: string[];
  publishedFiles?: Array<{
    fileId: string;
    fileName: string;
    category: BlogPhotoCategory;
    folderPath: string;
  }>;
} | null> {
  try {
    // Job情報を取得
    const jobResult = await fetchJobById(jobId);
    if (!jobResult.success || !jobResult.data) {
      return null;
    }

    const job = jobResult.data;
    const customerId = job.field4?.id || "";
    const customerName = job.field4?.name || "";
    const vehicleId = job.field6?.id || "";
    const vehicleName = job.field6?.name || "";
    const jobDate = job.field22 ? new Date(job.field22).toISOString().slice(0, 10).replace(/-/g, "") : "";
    
    // WorkOrder IDを取得（指定されていない場合は最初のワークオーダーを使用）
    let targetWorkOrderId = workOrderId;
    if (!targetWorkOrderId && job.workOrders && job.workOrders.length > 0) {
      targetWorkOrderId = job.workOrders[0].id;
    }
    if (!targetWorkOrderId) {
      // ワークオーダーIDが取得できない場合は、jobIdを使用
      targetWorkOrderId = jobId;
    }

    // ワークオーダーフォルダを取得
    const workOrderFolder = await getOrCreateWorkOrderFolder(
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      jobId,
      jobDate,
      targetWorkOrderId
    );

    // work.jsonファイルの内容を取得
    const workJsonData = await getWorkJsonContent(workOrderFolder.id);
    if (!workJsonData) {
      return null;
    }

    try {
      const workData = JSON.parse(workJsonData.content);
      const blogPublished = workData[BLOG_PUBLISHED_FLAG_KEY];
      
      if (!blogPublished) {
        return null;
      }

      return {
        publishedAt: blogPublished.publishedAt,
        photoIds: blogPublished.photoIds || [],
        publishedFiles: blogPublished.publishedFiles,
      };
    } catch (parseError) {
      console.error("work.jsonファイルのパースに失敗しました:", parseError);
      return null;
    }
  } catch (error) {
    console.error("ブログ用公開済みフラグ取得エラー:", error);
    return null;
  }
}










