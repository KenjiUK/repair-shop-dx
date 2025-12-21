import { NextRequest, NextResponse } from "next/server";
import { DriveFolder, ApiResponse } from "@/types";

/**
 * Google Drive API フォルダ取得エンドポイント
 *
 * GET /api/google-drive/folders/[folderId]
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
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;

    if (!folderId) {
      return errorResponse("folderIdは必須です", "MISSING_FOLDER_ID", 400);
    }

    const accessToken = await getAccessToken();

    const url = `${GOOGLE_DRIVE_API_BASE}/files/${folderId}?fields=id,name,createdTime,modifiedTime,webViewLink,parents,mimeType`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return errorResponse("フォルダが見つかりません", "FOLDER_NOT_FOUND", 404);
      }
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `フォルダの取得に失敗しました: ${response.statusText}`
      );
    }

    const file = await response.json();

    // MIMEタイプがフォルダでない場合はエラー
    if (file.mimeType !== "application/vnd.google-apps.folder") {
      return errorResponse("指定されたIDはフォルダではありません", "NOT_A_FOLDER", 400);
    }

    const folder: DriveFolder = {
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      parents: file.parents,
    };

    const apiResponse: ApiResponse<DriveFolder> = {
      success: true,
      data: folder,
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("[Google Drive API] フォルダ取得エラー:", error);
    const message =
      error instanceof Error ? error.message : "フォルダの取得に失敗しました";
    return errorResponse(message, "FOLDER_GET_ERROR", 500);
  }
}

















