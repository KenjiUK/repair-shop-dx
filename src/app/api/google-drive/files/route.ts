import { NextRequest, NextResponse } from "next/server";
import { DriveFile, ApiResponse } from "@/types";

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
 * Google Drive API アクセストークンを取得
 * TODO: 実際の認証実装時に実装
 */
async function getAccessToken(): Promise<string> {
  // TODO: Google OAuth認証を実装
  // 現時点では環境変数から取得（開発用）
  const token = process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("GOOGLE_DRIVE_ACCESS_TOKEN が設定されていません");
  }
  return token;
}

/**
 * 既存の同名ファイルを検索
 */
async function findExistingFile(
  fileName: string,
  parentFolderId?: string
): Promise<DriveFile | null> {
  const accessToken = await getAccessToken();

  let query = `name='${fileName}' and trashed=false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents)`;

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
    size: parseInt(file.size || "0", 10),
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
  const accessToken = await getAccessToken();

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

    if (!file || !fileName || !mimeType) {
      return errorResponse(
        "file, fileName, mimeTypeは必須です",
        "MISSING_REQUIRED_FIELDS",
        400
      );
    }

    const accessToken = await getAccessToken();

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

    // ファイルメタデータを作成
    const metadata: Record<string, unknown> = {
      name: fileName,
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    // ファイルをアップロード
    const formDataForUpload = new FormData();
    formDataForUpload.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    formDataForUpload.append("file", file);

    const uploadUrl = `${GOOGLE_DRIVE_UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents`;

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
      size: parseInt(uploadedFile.size || "0", 10),
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

















