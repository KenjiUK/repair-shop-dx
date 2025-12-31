import { NextRequest, NextResponse } from "next/server";
import { CreateFolderOptions, DriveFolder, ApiResponse } from "@/types";
import { getGoogleAccessToken } from "@/lib/google-auth";

/**
 * Google Drive API フォルダ作成エンドポイント
 *
 * POST /api/google-drive/folders
 * Body: { folderName: string, parentFolderId?: string, returnExisting?: boolean }
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
 * フォルダを作成
 */
async function createFolderInDrive(
  folderName: string,
  parentFolderId?: string
): Promise<DriveFolder> {
  const accessToken = await getGoogleAccessToken();

  // フォルダメタデータを作成
  const metadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    ...(parentFolderId && { parents: [parentFolderId] }),
  };

  const response = await fetch(`${GOOGLE_DRIVE_API_BASE}/files?fields=id,name,createdTime,modifiedTime,webViewLink,parents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error?.message || `フォルダの作成に失敗しました: ${response.statusText}`
    );
  }

  const file = await response.json();

  // webViewLinkが存在しない場合は、フォルダIDからURLを構築
  // Service Accountで作成されたフォルダの場合、webViewLinkがnullの可能性がある
  const webViewLink = file.webViewLink || `https://drive.google.com/drive/folders/${file.id}`;

  return {
    id: file.id,
    name: file.name,
    createdTime: file.createdTime,
    modifiedTime: file.modifiedTime,
    webViewLink: webViewLink,
    parentId: file.parents?.[0],
  };
}

/**
 * 既存のフォルダを検索
 */
async function findExistingFolder(
  folderName: string,
  parentFolderId?: string
): Promise<DriveFolder | null> {
  const accessToken = await getGoogleAccessToken();

  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const url = `${GOOGLE_DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime,modifiedTime,webViewLink,parents)`;

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

  // 最初に見つかったフォルダを返す
  const folder = files[0];
  // webViewLinkが存在しない場合は、フォルダIDからURLを構築
  // Service Accountで作成されたフォルダの場合、webViewLinkがnullの可能性がある
  const webViewLink = folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`;

  return {
    id: folder.id,
    name: folder.name,
    createdTime: folder.createdTime,
    modifiedTime: folder.modifiedTime,
    webViewLink: webViewLink,
    parentId: folder.parents?.[0],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateFolderOptions = await request.json();

    if (!body.folderName) {
      return errorResponse("folderNameは必須です", "MISSING_FOLDER_NAME", 400);
    }

    // returnExistingがtrueの場合は既存フォルダを検索
    if (body.returnExisting) {
      const existing = await findExistingFolder(
        body.folderName,
        body.parentFolderId
      );
      if (existing) {
        const response: ApiResponse<DriveFolder> = {
          success: true,
          data: existing,
        };
        return NextResponse.json(response);
      }
    }

    // フォルダを作成
    const folder = await createFolderInDrive(
      body.folderName,
      body.parentFolderId
    );

    const response: ApiResponse<DriveFolder> = {
      success: true,
      data: folder,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Google Drive API] フォルダ作成エラー:", error);
    const message =
      error instanceof Error ? error.message : "フォルダの作成に失敗しました";
    return errorResponse(message, "FOLDER_CREATE_ERROR", 500);
  }
}





















