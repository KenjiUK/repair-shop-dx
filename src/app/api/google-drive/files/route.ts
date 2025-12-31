import { NextRequest, NextResponse } from "next/server";
import { DriveFile, ApiResponse } from "@/types";
import { getGoogleAccessToken } from "@/lib/google-auth";

/**
 * Google Drive API ファイルアップロードエンドポイント
 *
 * POST /api/google-drive/files
 * Body: FormData { file: File, fileName: string, mimeType: string, parentFolderId?: string, replaceExisting?: boolean }
 */

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_API_BASE = "https://www.googleapis.com/upload/drive/v3";

function errorResponse(
  message: string,
  code: string,
  status: number = 500
): NextResponse {
  const response: ApiResponse<never> = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(response, { status });
}

/**
 * フォルダIDからdriveIdを取得（改善版）
 */
async function getDriveIdFromFolderId(folderId: string): Promise<string | null> {
  try {
    const accessToken = await getGoogleAccessToken();
    const url = `${GOOGLE_DRIVE_API_BASE}/files/${folderId}?fields=driveId&supportsAllDrives=true&includeItemsFromAllDrives=true`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "エラーレスポンスの読み取りに失敗");
      console.warn("[getDriveIdFromFolderId] フォルダ情報の取得に失敗:", {
        folderId,
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500),
      });
      return null;
    }

    const data = await response.json();
    const driveId = data.driveId || null;
    
    if (!driveId) {
      // driveIdが取得できない場合、個人ドライブのフォルダの可能性がある
      console.warn("[getDriveIdFromFolderId] driveIdが取得できませんでした（個人ドライブの可能性）:", folderId);
    }
    
    return driveId;
  } catch (error) {
    console.error("[getDriveIdFromFolderId] エラー:", error);
    return null;
  }
}

/**
 * 既存の同名ファイルを検索
 */
async function findExistingFile(
  fileName: string,
  parentFolderId?: string
): Promise<DriveFile | null> {
  const accessToken = await getGoogleAccessToken();

  let query = `name='${fileName}' and trashed=false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const files = data.files || [];

  if (files.length === 0) {
    return null;
  }

  // 最初に見つかったファイルを返す
  const file = files[0];
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size || "0",
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
    webViewLink: file.webViewLink,
    webContentLink: file.webContentLink,
    parents: file.parents,
  };
}

/**
 * 既存ファイルを削除
 */
async function deleteFile(fileId: string): Promise<void> {
  const accessToken = await getGoogleAccessToken();

  const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files/${fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `ファイルの削除に失敗しました: ${response.statusText}`
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const mimeType = formData.get("mimeType") as string;
    const parentFolderId = formData.get("parentFolderId") as string | null;
    const replaceExisting = formData.get("replaceExisting") === "true";
    const providedDriveId = formData.get("driveId") as string | null;

    if (!file || !fileName || !mimeType) {
      return errorResponse(
        "file, fileName, mimeTypeは必須です",
        "MISSING_REQUIRED_FIELDS",
        400
      );
    }

    const accessToken = await getGoogleAccessToken();

    // replaceExistingがtrueの場合は既存ファイルを削除
    if (replaceExisting) {
      const existing = await findExistingFile(
        fileName,
        parentFolderId || undefined
      );
      if (existing) {
        await deleteFile(existing.id);
      }
    }

    // driveIdを取得（優先順位: 提供されたdriveId > parentFolderIdから取得 > 環境変数）
    let driveId: string | null = null;
    
    // 1. 提供されたdriveIdを優先的に使用
    if (providedDriveId) {
      driveId = providedDriveId;
    } else if (parentFolderId) {
      // 2. parentFolderIdからdriveIdを取得
      driveId = await getDriveIdFromFolderId(parentFolderId);
      // 3. 取得できない場合、GOOGLE_DRIVE_PARENT_FOLDER_IDを試す（フォールバック）
      if (!driveId && process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID) {
        // GOOGLE_DRIVE_PARENT_FOLDER_IDが共有ドライブIDの場合、それを使用
        driveId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
      }
    }

    // ファイルメタデータを作成
    const metadata: Record<string, unknown> = {
      name: fileName,
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    // 注意: driveIdはメタデータに含めない（Google Drive APIの仕様に準拠）
    // driveIdはURLパラメータとしてのみ指定する

    // ファイルをアップロード
    const formDataForUpload = new FormData();
    formDataForUpload.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    formDataForUpload.append("file", file);

    // URLパラメータを構築
    const urlParams = new URLSearchParams({
      uploadType: "multipart",
      fields: "id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    
    // driveIdが取得できた場合、URLパラメータに追加
    if (driveId) {
      urlParams.append("driveId", driveId);
    }

    const uploadUrl = `${GOOGLE_DRIVE_UPLOAD_API_BASE}/files?${urlParams.toString()}`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formDataForUpload,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `ファイルのアップロードに失敗しました: ${response.statusText}`
      );
    }

    const uploadedFile = await response.json();

    const driveFile: DriveFile = {
      id: uploadedFile.id,
      name: uploadedFile.name,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size || "0",
      createdTime: uploadedFile.createdTime,
      modifiedTime: uploadedFile.modifiedTime,
      webViewLink: uploadedFile.webViewLink,
      webContentLink: uploadedFile.webContentLink,
      parents: uploadedFile.parents,
    };

    const apiResponse: ApiResponse<DriveFile> = {
      success: true,
      data: driveFile,
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("[Google Drive API] ファイルアップロードエラー:", error);
    const message =
      error instanceof Error ? error.message : "ファイルのアップロードに失敗しました";
    return errorResponse(message, "FILE_UPLOAD_ERROR", 500);
  }
}





















