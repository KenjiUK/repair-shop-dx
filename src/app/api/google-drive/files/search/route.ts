import { NextRequest, NextResponse } from "next/server";
import { DriveFile, ApiResponse } from "@/types";

/**
 * Google Drive API ファイル検索エンドポイント
 *
 * GET /api/google-drive/files/search?q={query}&parentFolderId={parentFolderId}&maxResults={maxResults}&mimeType={mimeType}
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const parentFolderId = searchParams.get("parentFolderId");
    const maxResults = searchParams.get("maxResults");
    const mimeType = searchParams.get("mimeType");

    if (!query) {
      return errorResponse("検索クエリ(q)は必須です", "MISSING_QUERY", 400);
    }

    const accessToken = await getAccessToken();

    // クエリを構築
    let driveQuery = query;

    // 親フォルダIDが指定されている場合は追加
    if (parentFolderId) {
      driveQuery = `'${parentFolderId}' in parents and ${driveQuery}`;
    }

    // MIMEタイプフィルタが指定されている場合は追加
    if (mimeType) {
      driveQuery = `${driveQuery} and mimeType='${mimeType}'`;
    }

    // 削除されていないファイルのみ検索
    driveQuery = `${driveQuery} and trashed=false`;

    const params = new URLSearchParams({
      q: driveQuery,
      fields: "files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents)",
    });

    if (maxResults) {
      params.append("pageSize", maxResults);
    }

    const url = `${GOOGLE_DRIVE_API_BASE}/files?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.error?.message || `ファイルの検索に失敗しました: ${response.statusText}`
      );
    }

    const data = await response.json();
    const files = (data.files || []).map((file: unknown) => {
      const f = file as {
        id: string;
        name: string;
        mimeType: string;
        size?: string;
        createdTime: string;
        modifiedTime: string;
        webViewLink?: string;
        webContentLink?: string;
        parents?: string[];
      };

      return {
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: parseInt(f.size || "0", 10),
        createdTime: f.createdTime,
        modifiedTime: f.modifiedTime,
        webViewLink: f.webViewLink,
        webContentLink: f.webContentLink,
        parents: f.parents,
      } as DriveFile;
    });

    const apiResponse: ApiResponse<DriveFile[]> = {
      success: true,
      data: files,
    };

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("[Google Drive API] ファイル検索エラー:", error);
    const message =
      error instanceof Error ? error.message : "ファイルの検索に失敗しました";
    return errorResponse(message, "FILE_SEARCH_ERROR", 500);
  }
}

















