import { NextRequest, NextResponse } from "next/server";
import { DriveFile, ApiResponse } from "@/types";

/**
 * Google Drive API ファイル取得エンドポイント
 *
 * GET /api/google-drive/files/[fileId]
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return errorResponse("fileIdは必須です", "MISSING_FILE_ID", 400);
    }

    const accessToken = await getAccessToken();

    const url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return errorResponse("ファイルが見つかりません", "FILE_NOT_FOUND", 404);
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `ファイルの取得に失敗しました: ${response.statusText}`
      );
    }

    const file = await response.json();

    const driveFile: DriveFile = {
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

    const apiResponse: ApiResponse<DriveFile> = {
      success: true,
      data: driveFile,
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("[Google Drive API] ファイル取得エラー:", error);
    const message =
      error instanceof Error ? error.message : "ファイルの取得に失敗しました";
    return errorResponse(message, "FILE_GET_ERROR", 500);
  }
}

















