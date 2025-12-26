import { NextRequest, NextResponse } from "next/server";
import { DriveFile, ApiResponse } from "@/types";
import { getGoogleAccessToken } from "@/lib/google-auth";

/**
 * Google Drive API ファイルコピーエンドポイント
 *
 * POST /api/google-drive/files/[fileId]/copy
 * Body: { targetFolderId: string, newFileName?: string }
 */

const GOOGLE_DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";

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
 * ファイルをコピー
 */
async function copyFileInDrive(
  fileId: string,
  targetFolderId: string,
  newFileName?: string
): Promise<DriveFile> {
  const accessToken = await getGoogleAccessToken();

  // コピー用のメタデータを準備
  const metadata: Record<string, unknown> = {
    parents: [targetFolderId],
  };

  if (newFileName) {
    metadata.name = newFileName;
  }

  const copyUrl = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}/copy?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents`;

  const copyResponse = await fetch(copyUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!copyResponse.ok) {
    const error = await copyResponse.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `ファイルのコピーに失敗しました: ${copyResponse.statusText}`
    );
  }

  const copiedFile = await copyResponse.json();

  return {
    id: copiedFile.id,
    name: copiedFile.name,
    mimeType: copiedFile.mimeType,
    size: copiedFile.size || "0",
    createdTime: copiedFile.createdTime,
    modifiedTime: copiedFile.modifiedTime,
    webViewLink: copiedFile.webViewLink,
    webContentLink: copiedFile.webContentLink,
    parents: copiedFile.parents,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return errorResponse("fileIdは必須です", "MISSING_FILE_ID", 400);
    }

    const body = await request.json();
    const { targetFolderId, newFileName } = body;

    if (!targetFolderId) {
      return errorResponse("targetFolderIdは必須です", "MISSING_TARGET_FOLDER_ID", 400);
    }

    const copiedFile = await copyFileInDrive(fileId, targetFolderId, newFileName);

    const apiResponse: ApiResponse<DriveFile> = {
      success: true,
      data: copiedFile,
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("[Google Drive API] ファイルコピーエラー:", error);
    const message =
      error instanceof Error ? error.message : "ファイルのコピーに失敗しました";
    return errorResponse(message, "FILE_COPY_ERROR", 500);
  }
}









