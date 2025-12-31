/**
 * ブログ用写真管理機能
 * 
 * 作業完了写真をブログ用に分類・コピー・リネームする機能
 */

import { getOrCreateFolder, uploadFile, copyFile, getOrCreateRootFolder, getFileById, getOrCreateWorkOrderFolder, getWorkJsonContent, updateWorkJsonContent, searchFiles, getFolderById, getOrCreateJobFolder, findFolderByName } from "./google-drive";
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
 * ブログ用ファイル名を生成（英語）
 * 命名規則: {位置番号}_{位置名(英語)}_{日付}_{サービス種類(英語)}_{車種名(英語)}.{拡張子}
 * 例: 00_front_20241225_12month_inspection_Peugeot308.jpg
 */
export function generateBlogPhotoFileName(
  date: string,
  vehicleName: string,
  serviceKind: string,
  position: string, // 写真位置（英語キー: front/rear/left/right/engine/interior/damage/other）
  index: number,
  originalFileName: string
): string {
  // 拡張子を取得
  const ext = originalFileName.split(".").pop() || "jpg";
  
  // 車種名を英語化（簡易的な変換、必要に応じて拡張）
  const englishVehicleName = sanitizeForEnglishFileName(vehicleName);
  
  // 作業種類を英語化（簡易的な変換、必要に応じて拡張）
  const englishServiceKind = sanitizeForEnglishFileName(serviceKind);
  
  // 位置名は既に英語キーとして渡されることを前提
  const positionKey = position.toLowerCase();
  
  // 位置番号を2桁ゼロ埋め
  const paddedIndex = String(index).padStart(2, "0");
  
  return `${paddedIndex}_${positionKey}_${date}_${englishServiceKind}_${englishVehicleName}.${ext}`;
}

/**
 * 日本語文字列を英語ファイル名用にサニタイズ
 * 基本的には特殊文字を削除するが、将来は翻訳機能を追加することも可能
 */
function sanitizeForEnglishFileName(text: string): string {
  // 特殊文字を削除・置換
  let sanitized = text.replace(/[\/\\:*?"<>|]/g, "_");
  // 複数のアンダースコアを1つに
  sanitized = sanitized.replace(/_+/g, "_");
  // 前後のアンダースコアを削除
  sanitized = sanitized.replace(/^_+|_+$/g, "");
  return sanitized || "unknown";
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
      
      // ファイル名から位置情報を抽出（一時保存時のファイル名から）
      // 一時保存時のファイル名: blog-photo_{position}_{timestamp}.jpg
      let positionKey = "other"; // デフォルト
      const positionMatch = originalFileName.match(/blog-photo_([^_]+)_/);
      if (positionMatch && positionMatch[1]) {
        positionKey = positionMatch[1];
      }

      // 新しいファイル名を生成（英語）
      const newFileName = generateBlogPhotoFileName(
        request.workDate,
        request.vehicle.name,
        request.serviceKind,
        positionKey,
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
      let workData: Record<string, unknown> = {};

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
    // TODO: ZohoJob型にworkOrdersプロパティが追加されたら実装
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

// =============================================================================
// ブログ写真一覧取得
// =============================================================================

/**
 * ブログ写真の情報
 */
export interface BlogPhotoInfo {
  /** ファイルID */
  fileId: string;
  /** ファイル名 */
  fileName: string;
  /** ファイルURL（表示用） */
  url: string;
  /** カテゴリ */
  category: BlogPhotoCategory;
  /** フォルダパス */
  folderPath: string;
  /** 作成日時 */
  createdTime: string;
  /** ファイル名から抽出された情報 */
  metadata?: {
    /** 日付（YYYYMMDD形式） */
    date?: string;
    /** 車種名 */
    vehicleName?: string;
    /** 作業種類 */
    serviceKind?: string;
    /** Before/Afterタイプ */
    type?: "before" | "after" | "general";
  };
}

/**
 * ブログ写真一覧を取得
 * 
 * @param category カテゴリフィルター（指定しない場合はすべて）
 * @param folderPath フォルダパスフィルター（指定しない場合はすべて）
 * @returns ブログ写真一覧
 */
export async function listBlogPhotos(
  category?: BlogPhotoCategory,
  folderPath?: string
): Promise<BlogPhotoInfo[]> {
  try {
    const rootFolder = await getOrCreateRootFolder();
    const blogPhotosFolder = await getOrCreateFolder({
      folderName: "blog-photos",
      parentFolderId: rootFolder.id,
      returnExisting: true,
    });

    // フォルダパスが指定されている場合はそのフォルダを取得
    let targetFolderId = blogPhotosFolder.id;
    if (folderPath) {
      targetFolderId = await getFolderIdByPath(folderPath);
    } else if (category) {
      // カテゴリが指定されている場合は、そのカテゴリのルートフォルダを取得
      const categoryFolderMap: Record<BlogPhotoCategory, string> = {
        "by-date": "blog-photos/by-date",
        "by-service": "blog-photos/by-service",
        "by-vehicle-type": "blog-photos/by-vehicle-type",
        "before-after": "blog-photos/before-after",
      };
      targetFolderId = await getFolderIdByPath(categoryFolderMap[category]);
    }

    // 画像ファイルを検索（再帰的に）
    const photos: BlogPhotoInfo[] = [];
    await searchBlogPhotosRecursive(targetFolderId, photos);

    // ファイル名からメタデータを抽出
    return photos.map((photo) => ({
      ...photo,
      metadata: parseFileNameMetadata(photo.fileName),
    }));
  } catch (error) {
    console.error("ブログ写真一覧取得エラー:", error);
    return [];
  }
}

/**
 * ブログ写真を再帰的に検索
 */
async function searchBlogPhotosRecursive(
  folderId: string,
  photos: BlogPhotoInfo[],
  currentPath: string = ""
): Promise<void> {
  try {
    // 現在のフォルダ情報を取得
    const currentFolder = await getFolderById(folderId);
    const folderName = currentFolder.name;
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;

    // 画像ファイルを検索
    const imageFiles = await searchFiles({
      query: "trashed=false",
      parentFolderId: folderId,
      mimeType: "image/*",
    });

    // 写真情報を追加
    for (const file of imageFiles) {
      photos.push({
        fileId: file.id,
        fileName: file.name,
        url: file.webViewLink || file.webContentLink || "",
        category: inferCategoryFromPath(newPath),
        folderPath: newPath,
        createdTime: file.createdTime || new Date().toISOString(),
      });
    }

    // サブフォルダを検索
    const subfolders = await searchFiles({
      query: "trashed=false",
      parentFolderId: folderId,
      mimeType: "application/vnd.google-apps.folder",
    });

    // 再帰的に検索
    for (const folder of subfolders) {
      await searchBlogPhotosRecursive(folder.id, photos, newPath);
    }
  } catch (error) {
    console.error("ブログ写真再帰検索エラー:", error);
  }
}

/**
 * パスからカテゴリを推測
 */
function inferCategoryFromPath(folderPath: string): BlogPhotoCategory {
  if (folderPath.includes("/by-date/")) return "by-date";
  if (folderPath.includes("/by-service/")) return "by-service";
  if (folderPath.includes("/by-vehicle-type/")) return "by-vehicle-type";
  if (folderPath.includes("/before-after/")) return "before-after";
  return "by-date"; // デフォルト
}

/**
 * ファイル名からメタデータを抽出
 * 新しい命名規則: {位置番号}_{位置名(英語)}_{日付}_{サービス種類(英語)}_{車種名(英語)}.{拡張子}
 * 例: 00_front_20241225_12month_inspection_Peugeot308.jpg
 * 
 * 旧形式（後方互換性のため）: {日付}_{車種}_{作業種類}_{種類}_{連番}.{拡張子}
 */
function parseFileNameMetadata(fileName: string): BlogPhotoInfo["metadata"] {
  // 拡張子を除去
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  
  // アンダースコアで分割
  const parts = nameWithoutExt.split("_");
  
  // 新しい形式を判定: 最初の要素が数値2桁（位置番号）で、その次が位置名（英語）、その次が日付（8桁）
  if (parts.length >= 5 && /^\d{2}$/.test(parts[0]) && /^\d{8}$/.test(parts[2])) {
    // 新しい形式: {位置番号}_{位置名(英語)}_{日付}_{サービス種類(英語)}_{車種名(英語)}
    return {
      date: parts[2], // YYYYMMDD形式
      vehicleName: parts[4], // 車種名は最後
      serviceKind: parts[3], // サービス種類は車種名の前
      type: "general", // 新しい形式ではtypeは含まれない（将来拡張可能）
    };
  }
  
  // 旧形式（後方互換性）: {日付}_{車種}_{作業種類}_{種類}_{連番}
  if (parts.length >= 4 && /^\d{8}$/.test(parts[0])) {
    return {
      date: parts[0], // YYYYMMDD形式
      vehicleName: parts[1],
      serviceKind: parts[2],
      type: parts[3] === "before" || parts[3] === "after" ? parts[3] : "general",
    };
  }
  
  return undefined;
}

// =============================================================================
// 受付時のブログ用写真一時保存
// =============================================================================

/**
 * ブログ用写真を一時保存（受付時用）
 * ワークオーダーがない場合はジョブフォルダ内のblog-photos-tempフォルダに保存
 */
export async function uploadBlogPhotoTemporary(
  jobId: string,
  file: File,
  fileName?: string
): Promise<{ success: boolean; fileId?: string; error?: { code: string; message: string } }> {
  try {
    // Job情報を取得
    const jobResult = await fetchJobById(jobId);
    if (!jobResult.success || !jobResult.data) {
      return {
        success: false,
        error: {
          code: "JOB_NOT_FOUND",
          message: "Job情報の取得に失敗しました",
        },
      };
    }

    const job = jobResult.data;
    const customerId = job.field4?.id || "";
    const customerName = job.field4?.name || "";
    const vehicleId = job.field6?.id || "";
    const vehicleName = job.field6?.name || "";
    const jobDate = job.field22
      ? new Date(job.field22).toISOString().slice(0, 10).replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // ジョブフォルダを取得または作成
    const jobFolder = await getOrCreateJobFolder(
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      jobId,
      jobDate
    );

    // blog-photos-tempフォルダを取得または作成
    const tempFolder = await getOrCreateFolder({
      folderName: "blog-photos-temp",
      parentFolderId: jobFolder.id,
      returnExisting: true,
    });

    // ファイル名を生成（タイムスタンプ付き）
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalFileName = fileName || `blog-photo_${timestamp}_${file.name}`;

    // ファイルをアップロード
    const uploadedFile = await uploadFile({
      fileName: finalFileName,
      mimeType: file.type || "image/jpeg",
      fileData: file,
      parentFolderId: tempFolder.id,
    });

    return {
      success: true,
      fileId: uploadedFile.id,
    };
  } catch (error) {
    console.error("ブログ用写真一時保存エラー:", error);
    return {
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: error instanceof Error ? error.message : "写真のアップロードに失敗しました",
      },
    };
  }
}

/**
 * ジョブフォルダ内の一時保存されたブログ用写真を取得
 */
export async function listBlogPhotosFromJobFolder(jobId: string): Promise<BlogPhotoInfo[]> {
  try {
    // 開発環境でGoogle Drive APIの認証情報が設定されていない場合は空配列を返す
    // 本番環境では必ず設定されている必要がある
    if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_GOOGLE_DRIVE_ENABLED) {
      // クライアント側では環境変数を直接確認できないため、APIエンドポイントで確認
      // ここではエラーをキャッチして空配列を返す
    }

    // Job情報を取得
    const jobResult = await fetchJobById(jobId);
    if (!jobResult.success || !jobResult.data) {
      return [];
    }

    const job = jobResult.data;
    const customerId = job.field4?.id || "";
    const customerName = job.field4?.name || "";
    const vehicleId = job.field6?.id || "";
    const vehicleName = job.field6?.name || "";
    const jobDate = job.field22
      ? new Date(job.field22).toISOString().slice(0, 10).replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // ジョブフォルダを取得
    const jobFolder = await getOrCreateJobFolder(
      customerId,
      customerName,
      vehicleId,
      vehicleName,
      jobId,
      jobDate
    );

    // blog-photos-tempフォルダを検索
    const tempFolder = await findFolderByName("blog-photos-temp", jobFolder.id);
    if (!tempFolder) {
      return [];
    }

    // 画像ファイルを検索
    const imageFiles = await searchFiles({
      query: `mimeType contains 'image/' and '${tempFolder.id}' in parents and trashed=false`,
      parentFolderId: tempFolder.id,
    });

    // BlogPhotoInfo形式に変換
    return imageFiles.map((file) => ({
      fileId: file.id,
      fileName: file.name,
      url: file.webViewLink || file.webContentLink || "",
      category: "by-date" as BlogPhotoCategory, // 一時保存なのでカテゴリはby-dateとして扱う
      folderPath: `jobs/${jobDate}_${jobId}/blog-photos-temp`,
      createdTime: file.createdTime || new Date().toISOString(),
      metadata: undefined,
    }));
  } catch (error) {
    // Google Drive APIの認証エラーの場合は空配列を返す（開発環境での動作を保証）
    if (error instanceof Error && error.message.includes("GOOGLE_DRIVE_ACCESS_TOKEN")) {
      console.warn("[listBlogPhotosFromJobFolder] Google Drive API認証情報が設定されていません。開発環境では空配列を返します。");
      return [];
    }
    console.error("ジョブフォルダ内ブログ用写真取得エラー:", error);
    return [];
  }
}











