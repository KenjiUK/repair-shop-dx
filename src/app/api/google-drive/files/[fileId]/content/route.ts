import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import { getGoogleAccessToken } from "@/lib/google-auth";

/**
 * Google Drive API ファイル内容取得・更新エンドポイント
 *
 * GET /api/google-drive/files/[fileId]/content - ファイル内容を取得
 * PUT /api/google-drive/files/[fileId]/content - ファイル内容を更新
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
 * ファイル内容を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return errorResponse("fileIdは必須です", "MISSING_FILE_ID", 400);
    }

    const accessToken = await getGoogleAccessToken();

    // ファイルの内容を取得（alt=mediaパラメータを使用）
    const url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`;

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
        error.error?.message || `ファイル内容の取得に失敗しました: ${response.statusText}`
      );
    }

    // テキストとして取得
    const content = await response.text();

    const apiResponse: ApiResponse<{ content: string }> = {
      success: true,
      data: { content },
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("[Google Drive API] ファイル内容取得エラー:", error);
    const message =
      error instanceof Error ? error.message : "ファイル内容の取得に失敗しました";
    return errorResponse(message, "FILE_CONTENT_GET_ERROR", 500);
  }
}

/**
 * ファイル内容を更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return errorResponse("fileIdは必須です", "MISSING_FILE_ID", 400);
    }

    const body = await request.json();
    const { content } = body;

    if (typeof content !== "string") {
      return errorResponse("contentは文字列である必要があります", "INVALID_CONTENT", 400);
    }

    const accessToken = await getGoogleAccessToken();

    // ファイルの内容を更新（uploadType=mediaを使用）
    // 注意: リクエストボディはJSONではなく、ファイルの内容そのものである必要があります
    const url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?uploadType=media`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: content,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `ファイル内容の更新に失敗しました: ${response.statusText}`
      );
    }

    const updatedFile = await response.json();

    const apiResponse: ApiResponse<{ fileId: string }> = {
      success: true,
      data: { fileId: updatedFile.id },
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("[Google Drive API] ファイル内容更新エラー:", error);
    const message =
      error instanceof Error ? error.message : "ファイル内容の更新に失敗しました";
    return errorResponse(message, "FILE_CONTENT_UPDATE_ERROR", 500);
  }
}







