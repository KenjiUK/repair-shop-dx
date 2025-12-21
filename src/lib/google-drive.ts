/**
 * Google Drive API クライアント
 *
 * ファイル保存、フォルダ作成、ファイル検索などの機能を提供
 *
 * ⚠️ 重要: マスタデータ（Google Sheets）とは異なり、
 * Google Driveは読み書き可能です。
 */

import {
  DriveFile,
  DriveFolder,
  UploadFileOptions,
  CreateFolderOptions,
  SearchFileOptions,
  FolderPath,
  ApiResponse,
} from "@/types";

const DRIVE_API_BASE_URL = "/api/google-drive";
const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

/**
 * Google Drive API エラー
 */
export class GoogleDriveError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "GoogleDriveError";
  }
}

/**
 * エラーレスポンスをパース
 */
async function parseErrorResponse(
  response: Response
): Promise<GoogleDriveError> {
  let errorData: { error?: { message?: string; code?: string } } = {};
  try {
    errorData = await response.json();
  } catch {
    // JSONパース失敗時は空オブジェクト
  }

  const message =
    errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
  const code = errorData.error?.code || `HTTP_${response.status}`;

  return new GoogleDriveError(message, code, response.status);
}

// =============================================================================
// フォルダ操作
// =============================================================================

/**
 * フォルダを作成
 */
export async function createFolder(
  options: CreateFolderOptions
): Promise<DriveFolder> {
  const response = await fetch(`${DRIVE_API_BASE_URL}/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<DriveFolder> = await response.json();
  if (!result.success || !result.data) {
    throw new GoogleDriveError(
      result.error?.message || "フォルダの作成に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

/**
 * フォルダを取得（ID指定）
 */
export async function getFolderById(folderId: string): Promise<DriveFolder> {
  const response = await fetch(`${DRIVE_API_BASE_URL}/folders/${folderId}`);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<DriveFolder> = await response.json();
  if (!result.success || !result.data) {
    throw new GoogleDriveError(
      result.error?.message || "フォルダの取得に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

/**
 * フォルダを検索（名前指定）
 */
export async function findFolderByName(
  folderName: string,
  parentFolderId?: string
): Promise<DriveFolder | null> {
  const query = parentFolderId
    ? `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const response = await fetch(
    `${DRIVE_API_BASE_URL}/files/search?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<DriveFile[]> = await response.json();
  if (!result.success || !result.data) {
    throw new GoogleDriveError(
      result.error?.message || "フォルダの検索に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  const folders = result.data as unknown as DriveFolder[];
  return folders.length > 0 ? folders[0] : null;
}

/**
 * フォルダを取得または作成
 */
export async function getOrCreateFolder(
  options: CreateFolderOptions
): Promise<DriveFolder> {
  // 既存フォルダを検索
  const existing = await findFolderByName(
    options.folderName,
    options.parentFolderId
  );

  if (existing) {
    return existing;
  }

  // フォルダが存在しない場合は作成
  return createFolder(options);
}

// =============================================================================
// ファイル操作
// =============================================================================

/**
 * ファイルをアップロード
 */
export async function uploadFile(
  options: UploadFileOptions
): Promise<DriveFile> {
  const formData = new FormData();
  formData.append("fileName", options.fileName);
  formData.append("mimeType", options.mimeType);
  if (options.parentFolderId) {
    formData.append("parentFolderId", options.parentFolderId);
  }
  if (options.replaceExisting !== undefined) {
    formData.append("replaceExisting", String(options.replaceExisting));
  }

  // ファイルデータを追加
  if (options.fileData instanceof Blob || options.fileData instanceof File) {
    formData.append("file", options.fileData);
  } else {
    // Base64文字列の場合はBlobに変換
    const blob = await fetch(options.fileData).then((r) => r.blob());
    formData.append("file", blob);
  }

  const response = await fetch(`${DRIVE_API_BASE_URL}/files`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<DriveFile> = await response.json();
  if (!result.success || !result.data) {
    throw new GoogleDriveError(
      result.error?.message || "ファイルのアップロードに失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

/**
 * ファイルを取得（ID指定）
 */
export async function getFileById(fileId: string): Promise<DriveFile> {
  const response = await fetch(`${DRIVE_API_BASE_URL}/files/${fileId}`);

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<DriveFile> = await response.json();
  if (!result.success || !result.data) {
    throw new GoogleDriveError(
      result.error?.message || "ファイルの取得に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

/**
 * ファイルを検索
 */
export async function searchFiles(
  options: SearchFileOptions
): Promise<DriveFile[]> {
  let query = options.query;

  // 親フォルダIDが指定されている場合は追加
  if (options.parentFolderId) {
    query = `'${options.parentFolderId}' in parents and ${query}`;
  }

  // MIMEタイプフィルタが指定されている場合は追加
  if (options.mimeType) {
    query = `${query} and mimeType='${options.mimeType}'`;
  }

  const params = new URLSearchParams({
    q: query,
  });

  if (options.maxResults) {
    params.append("maxResults", String(options.maxResults));
  }

  const response = await fetch(
    `${DRIVE_API_BASE_URL}/files/search?${params.toString()}`
  );

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<DriveFile[]> = await response.json();
  if (!result.success || !result.data) {
    throw new GoogleDriveError(
      result.error?.message || "ファイルの検索に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

/**
 * ファイルを移動
 */
export async function moveFile(
  fileId: string,
  targetFolderId: string,
  options?: {
    /** 元のフォルダから削除するか（デフォルト: true） */
    removeFromSource?: boolean;
  }
): Promise<DriveFile> {
  const { removeFromSource = true } = options || {};

  const response = await fetch(`${DRIVE_API_BASE_URL}/files/${fileId}/move`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      targetFolderId,
      removeFromSource,
    }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<DriveFile> = await response.json();
  if (!result.success || !result.data) {
    throw new GoogleDriveError(
      result.error?.message || "ファイルの移動に失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

/**
 * ファイルをコピー
 */
export async function copyFile(
  fileId: string,
  targetFolderId: string,
  options?: {
    /** 新しいファイル名（オプション） */
    newFileName?: string;
  }
): Promise<DriveFile> {
  const { newFileName } = options || {};

  const response = await fetch(`${DRIVE_API_BASE_URL}/files/${fileId}/copy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      targetFolderId,
      newFileName,
    }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  const result: ApiResponse<DriveFile> = await response.json();
  if (!result.success || !result.data) {
    throw new GoogleDriveError(
      result.error?.message || "ファイルのコピーに失敗しました",
      result.error?.code || "UNKNOWN_ERROR"
    );
  }

  return result.data;
}

// =============================================================================
// フォルダ構造の自動生成
// =============================================================================

/**
 * ルートフォルダIDを取得または作成
 */
export async function getOrCreateRootFolder(): Promise<DriveFolder> {
  return getOrCreateFolder({
    folderName: "repair-shop-dx",
    returnExisting: true,
  });
}

/**
 * 顧客フォルダを取得または作成
 */
export async function getOrCreateCustomerFolder(
  customerId: string,
  customerName: string
): Promise<DriveFolder> {
  const rootFolder = await getOrCreateRootFolder();
  const customersFolder = await getOrCreateFolder({
    folderName: "customers",
    parentFolderId: rootFolder.id,
    returnExisting: true,
  });

  const folderName = `${customerId}_${customerName}`;
  return getOrCreateFolder({
    folderName,
    parentFolderId: customersFolder.id,
    returnExisting: true,
  });
}

/**
 * 車両フォルダを取得または作成
 */
export async function getOrCreateVehicleFolder(
  customerId: string,
  customerName: string,
  vehicleId: string,
  vehicleName: string
): Promise<DriveFolder> {
  const customerFolder = await getOrCreateCustomerFolder(
    customerId,
    customerName
  );

  const vehiclesFolder = await getOrCreateFolder({
    folderName: "vehicles",
    parentFolderId: customerFolder.id,
    returnExisting: true,
  });

  const folderName = `${vehicleId}_${vehicleName}`;
  return getOrCreateFolder({
    folderName,
    parentFolderId: vehiclesFolder.id,
    returnExisting: true,
  });
}

/**
 * Jobフォルダを取得または作成
 */
export async function getOrCreateJobFolder(
  customerId: string,
  customerName: string,
  vehicleId: string,
  vehicleName: string,
  jobId: string,
  jobDate: string // YYYYMMDD形式
): Promise<DriveFolder> {
  const vehicleFolder = await getOrCreateVehicleFolder(
    customerId,
    customerName,
    vehicleId,
    vehicleName
  );

  const jobsFolder = await getOrCreateFolder({
    folderName: "jobs",
    parentFolderId: vehicleFolder.id,
    returnExisting: true,
  });

  const folderName = `${jobDate}_${jobId}`;
  return getOrCreateFolder({
    folderName,
    parentFolderId: jobsFolder.id,
    returnExisting: true,
  });
}

/**
 * Work Orderフォルダを取得または作成
 */
export async function getOrCreateWorkOrderFolder(
  customerId: string,
  customerName: string,
  vehicleId: string,
  vehicleName: string,
  jobId: string,
  jobDate: string,
  workOrderId: string
): Promise<DriveFolder> {
  const jobFolder = await getOrCreateJobFolder(
    customerId,
    customerName,
    vehicleId,
    vehicleName,
    jobId,
    jobDate
  );

  const folderName = `wo-${workOrderId}`;
  return getOrCreateFolder({
    folderName,
    parentFolderId: jobFolder.id,
    returnExisting: true,
  });
}

/**
 * 車両のdocumentsフォルダを取得または作成
 */
export async function getOrCreateVehicleDocumentsFolder(
  customerId: string,
  customerName: string,
  vehicleId: string,
  vehicleName: string
): Promise<DriveFolder> {
  const vehicleFolder = await getOrCreateVehicleFolder(
    customerId,
    customerName,
    vehicleId,
    vehicleName
  );

  return getOrCreateFolder({
    folderName: "documents",
    parentFolderId: vehicleFolder.id,
    returnExisting: true,
  });
}

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * フォルダパスからフォルダ構造を生成
 */
export async function createFolderStructure(
  path: FolderPath
): Promise<{
  customerFolder: DriveFolder;
  vehicleFolder?: DriveFolder;
  jobFolder?: DriveFolder;
  workOrderFolder?: DriveFolder;
  documentsFolder?: DriveFolder;
}> {
  const customerFolder = await getOrCreateCustomerFolder(
    path.customerId,
    path.customerName
  );

  const result: {
    customerFolder: DriveFolder;
    vehicleFolder?: DriveFolder;
    jobFolder?: DriveFolder;
    workOrderFolder?: DriveFolder;
    documentsFolder?: DriveFolder;
  } = {
    customerFolder,
  };

  if (path.vehicleId && path.vehicleName) {
    result.vehicleFolder = await getOrCreateVehicleFolder(
      path.customerId,
      path.customerName,
      path.vehicleId,
      path.vehicleName
    );

    // documentsフォルダも作成
    result.documentsFolder = await getOrCreateVehicleDocumentsFolder(
      path.customerId,
      path.customerName,
      path.vehicleId,
      path.vehicleName
    );

    if (path.jobId && path.jobDate) {
      result.jobFolder = await getOrCreateJobFolder(
        path.customerId,
        path.customerName,
        path.vehicleId,
        path.vehicleName,
        path.jobId,
        path.jobDate
      );

      if (path.workOrderId) {
        result.workOrderFolder = await getOrCreateWorkOrderFolder(
          path.customerId,
          path.customerName,
          path.vehicleId,
          path.vehicleName,
          path.jobId,
          path.jobDate,
          path.workOrderId
        );
      }
    }
  }

  return result;
}

// =============================================================================
// 請求書PDF検索
// =============================================================================

/**
 * 請求書PDFを検索
 * ファイル名に「invoice」「seikyu」「請求書」のいずれかを含むPDFを検索
 */
export async function searchInvoicePdf(
  jobFolderId: string
): Promise<DriveFile | null> {
  // 請求書PDFの検索クエリ（部分一致）
  const queries = [
    `name contains 'invoice' and mimeType='application/pdf'`,
    `name contains 'seikyu' and mimeType='application/pdf'`,
    `name contains '請求書' and mimeType='application/pdf'`,
  ];

  for (const query of queries) {
    const files = await searchFiles({
      query,
      parentFolderId: jobFolderId,
      mimeType: "application/pdf",
      maxResults: 1,
    });

    if (files.length > 0) {
      return files[0];
    }
  }

  return null;
}

// =============================================================================
// 車検証管理
// =============================================================================

/**
 * 車検証をアップロード（最新版と履歴の管理）
 */
export async function uploadVehicleRegistrationDocument(
  customerId: string,
  customerName: string,
  vehicleId: string,
  vehicleName: string,
  file: File | Blob,
  date: string // YYYYMMDD形式
): Promise<DriveFile> {
  const documentsFolder = await getOrCreateVehicleDocumentsFolder(
    customerId,
    customerName,
    vehicleId,
    vehicleName
  );

  const fileName = `shaken_${vehicleId}_${date}.pdf`;

  // 既存の最新版を検索
  const existingFiles = await searchFiles({
    query: `name starts with 'shaken_${vehicleId}_' and mimeType='application/pdf'`,
    parentFolderId: documentsFolder.id,
  });

  // 最新版を履歴フォルダに移動
  if (existingFiles.length > 0) {
    const historyFolder = await getOrCreateFolder({
      folderName: "shaken_history",
      parentFolderId: documentsFolder.id,
      returnExisting: true,
    });

    // 既存ファイルを履歴フォルダに移動
    for (const existingFile of existingFiles) {
      if (existingFile.parents?.includes(documentsFolder.id)) {
        await moveFile(existingFile.id, historyFolder.id, { removeFromSource: true });
      }
    }
  }

  // 新しい車検証をアップロード
  const fileData = file instanceof File ? file : new File([file], fileName, { type: "application/pdf" });
  return uploadFile({
    fileName,
    mimeType: "application/pdf",
    fileData,
    parentFolderId: documentsFolder.id,
    replaceExisting: true,
  });
}

/**
 * 車検証の最新版を取得
 */
export async function getLatestVehicleRegistrationDocument(
  customerId: string,
  customerName: string,
  vehicleId: string,
  vehicleName: string
): Promise<DriveFile | null> {
  const documentsFolder = await getOrCreateVehicleDocumentsFolder(
    customerId,
    customerName,
    vehicleId,
    vehicleName
  );

  const files = await searchFiles({
    query: `name starts with 'shaken_${vehicleId}_' and mimeType='application/pdf'`,
    parentFolderId: documentsFolder.id,
  });

  if (files.length === 0) {
    return null;
  }

  // 最新のファイルを返す（modifiedTimeでソート）
  return files.sort((a, b) => {
    return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
  })[0];
}

// =============================================================================
// ブログ用写真管理
// =============================================================================

/**
 * ブログ用写真を分類フォルダにコピー
 */
export async function copyPhotoForBlog(
  sourceFileId: string,
  options: {
    date?: string; // YYYYMMDD形式
    serviceKind?: string; // 作業種類
    vehicleType?: string; // 車種（メーカー名）
    photoType?: "before" | "after"; // Before/After
  }
): Promise<DriveFile[]> {
  const rootFolder = await getOrCreateRootFolder();
  const blogPhotosFolder = await getOrCreateFolder({
    folderName: "blog-photos",
    parentFolderId: rootFolder.id,
    returnExisting: true,
  });

  const sourceFile = await getFileById(sourceFileId);
  const copiedFiles: DriveFile[] = [];

  // 日付別フォルダにコピー
  if (options.date) {
    try {
      const yearMonth = options.date.substring(0, 6); // YYYYMM
      const dateFolder = await getOrCreateFolder({
        folderName: "by-date",
        parentFolderId: blogPhotosFolder.id,
        returnExisting: true,
      });
      const yearMonthFolder = await getOrCreateFolder({
        folderName: yearMonth,
        parentFolderId: dateFolder.id,
        returnExisting: true,
      });
      const dayFolder = await getOrCreateFolder({
        folderName: options.date,
        parentFolderId: yearMonthFolder.id,
        returnExisting: true,
      });

      const copied = await copyFile(sourceFileId, dayFolder.id);
      copiedFiles.push(copied);
    } catch (error) {
      console.error("日付別フォルダへのコピーに失敗しました:", error);
      // エラーが発生しても続行（他のフォルダへのコピーは実行）
    }
  }

  // 作業種類別フォルダにコピー
  if (options.serviceKind) {
    try {
      const serviceFolder = await getOrCreateFolder({
        folderName: "by-service",
        parentFolderId: blogPhotosFolder.id,
        returnExisting: true,
      });
      const kindFolder = await getOrCreateFolder({
        folderName: options.serviceKind,
        parentFolderId: serviceFolder.id,
        returnExisting: true,
      });

      const copied = await copyFile(sourceFileId, kindFolder.id);
      copiedFiles.push(copied);
    } catch (error) {
      console.error("作業種類別フォルダへのコピーに失敗しました:", error);
      // エラーが発生しても続行（他のフォルダへのコピーは実行）
    }
  }

  // 車種別フォルダにコピー
  if (options.vehicleType) {
    try {
      const vehicleTypeFolder = await getOrCreateFolder({
        folderName: "by-vehicle-type",
        parentFolderId: blogPhotosFolder.id,
        returnExisting: true,
      });
      const makerFolder = await getOrCreateFolder({
        folderName: options.vehicleType,
        parentFolderId: vehicleTypeFolder.id,
        returnExisting: true,
      });

      const copied = await copyFile(sourceFileId, makerFolder.id);
      copiedFiles.push(copied);
    } catch (error) {
      console.error("車種別フォルダへのコピーに失敗しました:", error);
      // エラーが発生しても続行（他のフォルダへのコピーは実行）
    }
  }

  // Before/After別フォルダにコピー
  if (options.photoType) {
    try {
      const beforeAfterFolder = await getOrCreateFolder({
        folderName: "before-after",
        parentFolderId: blogPhotosFolder.id,
        returnExisting: true,
      });
      const typeFolder = await getOrCreateFolder({
        folderName: options.photoType,
        parentFolderId: beforeAfterFolder.id,
        returnExisting: true,
      });

      const copied = await copyFile(sourceFileId, typeFolder.id);
      copiedFiles.push(copied);
    } catch (error) {
      console.error("Before/After別フォルダへのコピーに失敗しました:", error);
      // エラーが発生しても続行（他のフォルダへのコピーは実行）
    }
  }

  return copiedFiles;
}

// =============================================================================
// work.jsonファイル操作
// =============================================================================

/**
 * work.jsonファイルを検索
 */
export async function findWorkJsonFile(
  workOrderFolderId: string
): Promise<DriveFile | null> {
  try {
    const files = await searchFiles({
      query: "name='work.json'",
      parentFolderId: workOrderFolderId,
      mimeType: "application/json",
      maxResults: 1,
    });

    return files.length > 0 ? files[0] : null;
  } catch (error) {
    console.error("work.jsonファイルの検索に失敗しました:", error);
    return null;
  }
}

/**
 * work.jsonファイルの内容を取得
 */
export async function getWorkJsonContent(
  workOrderFolderId: string
): Promise<{ content: string; fileId: string } | null> {
  try {
    const workJsonFile = await findWorkJsonFile(workOrderFolderId);
    if (!workJsonFile) {
      return null;
    }

    const response = await fetch(`${DRIVE_API_BASE_URL}/files/${workJsonFile.id}/content`);

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const result: ApiResponse<{ content: string }> = await response.json();
    if (!result.success || !result.data) {
      throw new GoogleDriveError(
        result.error?.message || "work.jsonファイルの内容取得に失敗しました",
        result.error?.code || "UNKNOWN_ERROR"
      );
    }

    return {
      content: result.data.content,
      fileId: workJsonFile.id,
    };
  } catch (error) {
    console.error("work.jsonファイルの内容取得に失敗しました:", error);
    return null;
  }
}

/**
 * work.jsonファイルの内容を更新
 */
export async function updateWorkJsonContent(
  workOrderFolderId: string,
  content: string
): Promise<DriveFile> {
  try {
    const workJsonFile = await findWorkJsonFile(workOrderFolderId);
    
    if (workJsonFile) {
      // 既存ファイルを更新
      const response = await fetch(`${DRIVE_API_BASE_URL}/files/${workJsonFile.id}/content`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: content }),
      });

      if (!response.ok) {
        throw await parseErrorResponse(response);
      }

      const result: ApiResponse<{ fileId: string }> = await response.json();
      if (!result.success || !result.data) {
        throw new GoogleDriveError(
          result.error?.message || "work.jsonファイルの更新に失敗しました",
          result.error?.code || "UNKNOWN_ERROR"
        );
      }

      return await getFileById(result.data.fileId);
    } else {
      // 新規ファイルを作成
      const blob = new Blob([content], { type: "application/json" });
      const file = await uploadFile({
        fileName: "work.json",
        mimeType: "application/json",
        fileData: blob,
        parentFolderId: workOrderFolderId,
      });

      return file;
    }
  } catch (error) {
    console.error("work.jsonファイルの更新に失敗しました:", error);
    throw error;
  }
}












