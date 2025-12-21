import { NextRequest, NextResponse } from "next/server";
import { DriveFile, ApiResponse } from "@/types";

/**
 * Google Drive API ファイル移動エンドポイント
 *
 * PATCH /api/google-drive/files/[fileId]/move
 * Body: { targetFolderId: string, removeFromSource?: boolean }
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
 * Google Drive API アクセストークンを取得
 */
async function getAccessToken(): Promise<string> {
  const token = process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("GOOGLE_DRIVE_ACCESS_TOKEN が設定されていません");
  }
  return token;
}

/**
 * ファイルの親フォルダを更新（移動）
 */
async function moveFileInDrive(
  fileId: string,
  targetFolderId: string,
  removeFromSource: boolean = true
): Promise<DriveFile> {
  const accessToken = await getAccessToken();

  // 現在のファイル情報を取得（親フォルダ情報を含む）
  const getFileUrl = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents`;
  const getFileResponse = await fetch(getFileUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!getFileResponse.ok) {
    const error = await getFileResponse.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `ファイルの取得に失敗しました: ${getFileResponse.statusText}`
    );
  }

  const currentFile = await getFileResponse.json();
  const currentParents = currentFile.parents || [];

  // 親フォルダを更新
  const params = new URLSearchParams({
    addParents: targetFolderId,
    fields: "id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents",
  });

  // removeFromSourceがtrueで、現在の親フォルダがある場合のみremoveParentsを追加
  if (removeFromSource && currentParents.length > 0) {
    params.append("removeParents", currentParents.join(","));
  }

  const updateUrl = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?${params.toString()}`;

  const updateResponse = await fetch(updateUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `ファイルの移動に失敗しました: ${updateResponse.statusText}`
    );
  }

  const updatedFile = await updateResponse.json();

  return {
    id: updatedFile.id,
    name: updatedFile.name,
    mimeType: updatedFile.mimeType,
    size: parseInt(updatedFile.size || "0", 10),
    createdTime: updatedFile.createdTime,
    modifiedTime: updatedFile.modifiedTime,
    webViewLink: updatedFile.webViewLink,
    webContentLink: updatedFile.webContentLink,
    parents: updatedFile.parents,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return errorResponse("fileIdは必須です", "MISSING_FILE_ID", 400);
    }

    const body = await request.json();
    const { targetFolderId, removeFromSource = true } = body;

    if (!targetFolderId) {
      return errorResponse("targetFolderIdは必須です", "MISSING_TARGET_FOLDER_ID", 400);
    }

    const movedFile = await moveFileInDrive(fileId, targetFolderId, removeFromSource);

    const apiResponse: ApiResponse<DriveFile> = {
      success: true,
      data: movedFile,
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("[Google Drive API] ファイル移動エラー:", error);
    const message =
      error instanceof Error ? error.message : "ファイルの移動に失敗しました";
    return errorResponse(message, "FILE_MOVE_ERROR", 500);
  }
}









