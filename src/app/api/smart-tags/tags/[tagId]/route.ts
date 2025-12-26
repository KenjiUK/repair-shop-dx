import { NextRequest, NextResponse } from "next/server";
import { TagSheetRow, ApiResponse, TagStatus } from "@/types";

/**
 * スマートタグ管理 API - タグID指定操作
 *
 * GET /api/smart-tags/tags/{tagId} - タグを取得
 * PATCH /api/smart-tags/tags/{tagId} - タグを更新
 */

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SMART_TAGS_ID || "";
const SHEET_NAME = "Tags";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "";
const GOOGLE_SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

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
 * Google Sheetsからデータを取得
 */
async function fetchFromGoogleSheets(range: string): Promise<string[][]> {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SMART_TAGS_ID が設定されていません");
  }

  const url = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Google Sheets API エラー: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  const data = await response.json();
  return data.values || [];
}

/**
 * Tagsシートのデータをパース
 */
function parseTagsSheet(rows: string[][]): TagSheetRow[] {
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const requiredColumns = ["タグID", "QRコード", "ステータス"];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      throw new Error(`必須カラム "${col}" が見つかりません`);
    }
  }

  const tags: TagSheetRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const tagId = row[headerMap["タグID"]] || "";
    if (!tagId) continue;

    const tag: TagSheetRow = {
      タグID: tagId,
      QRコード: row[headerMap["QRコード"]] || "",
      ステータス: (row[headerMap["ステータス"]] || "available") as TagStatus,
      作成日時: row[headerMap["作成日時"]] || new Date().toISOString(),
      更新日時: row[headerMap["更新日時"]] || new Date().toISOString(),
    };

    tags.push(tag);
  }

  return tags;
}

/**
 * タグの行番号を取得（更新用）
 */
async function findTagRowNumber(tagId: string): Promise<number | null> {
  const range = `${SHEET_NAME}!A:Z`;
  const rows = await fetchFromGoogleSheets(range);

  if (rows.length === 0) {
    return null;
  }

  const headers = rows[0];
  const tagIdColumnIndex = headers.indexOf("タグID");

  if (tagIdColumnIndex === -1) {
    return null;
  }

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][tagIdColumnIndex] === tagId) {
      return i + 1; // Google Sheetsの行番号は1始まり
    }
  }

  return null;
}

/**
 * タグを更新
 */
async function updateTagInSheet(
  tagId: string,
  updates: Partial<TagSheetRow>
): Promise<TagSheetRow> {
  const rowNumber = await findTagRowNumber(tagId);
  if (!rowNumber) {
    throw new Error(`タグID "${tagId}" が見つかりません`);
  }

  // 更新するカラムを特定
  const range = `${SHEET_NAME}!A:Z`;
  const rows = await fetchFromGoogleSheets(range);
  const headers = rows[0];
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  // 更新する値を準備
  const values: string[] = [];
  const updateColumns: string[] = [];

  if ("ステータス" in updates) {
    const colIndex = headerMap["ステータス"];
    if (colIndex !== undefined) {
      values.push(updates.ステータス || "");
      updateColumns.push(String.fromCharCode(65 + colIndex)); // A, B, C, ...
    }
  }

  // 更新日時を自動更新
  const updatedAtColIndex = headerMap["更新日時"];
  if (updatedAtColIndex !== undefined) {
    values.push(new Date().toISOString());
    updateColumns.push(String.fromCharCode(65 + updatedAtColIndex));
  }

  // Google Sheets APIで更新
  const updateUrl = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${SHEET_NAME}!${updateColumns.map((col) => `${col}${rowNumber}`).join(",")}?valueInputOption=RAW&key=${API_KEY}`;

  const updateResponse = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [values],
    }),
  });

  if (!updateResponse.ok) {
    const errorData = await updateResponse.json().catch(() => ({}));
    throw new Error(
      `Google Sheets API 更新エラー: ${updateResponse.status} ${updateResponse.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  // 更新後のデータを取得
  const updatedRows = await fetchFromGoogleSheets(range);
  const updatedTags = parseTagsSheet(updatedRows);
  const updatedTag = updatedTags.find((t) => t.タグID === tagId);

  if (!updatedTag) {
    throw new Error(`更新後のタグデータの取得に失敗しました`);
  }

  return updatedTag;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const { tagId } = await params;

    if (!tagId) {
      return errorResponse("タグIDが指定されていません", "INVALID_REQUEST", 400);
    }

    const range = `${SHEET_NAME}!A:Z`;
    const rows = await fetchFromGoogleSheets(range);
    const tags = parseTagsSheet(rows);
    const tag = tags.find((t) => t.タグID === tagId);

    if (!tag) {
      return errorResponse(
        `タグID "${tagId}" が見つかりません`,
        "TAG_NOT_FOUND",
        404
      );
    }

    const response: ApiResponse<TagSheetRow> = {
      success: true,
      data: tag,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] スマートタグ取得エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "タグの取得に失敗しました",
      "TAG_FETCH_ERROR",
      500
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tagId: string }> }
) {
  try {
    const { tagId } = await params;
    const body = await request.json();

    if (!tagId) {
      return errorResponse("タグIDが指定されていません", "INVALID_REQUEST", 400);
    }

    const updatedTag = await updateTagInSheet(tagId, body);

    const response: ApiResponse<TagSheetRow> = {
      success: true,
      data: updatedTag,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] スマートタグ更新エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "タグの更新に失敗しました",
      "TAG_UPDATE_ERROR",
      500
    );
  }
}

























