import { NextRequest, NextResponse } from "next/server";
import { TagSheetRow, ApiResponse, TagStatus } from "@/types";

/**
 * スマートタグ管理 API - Tagsシート操作
 *
 * GET /api/smart-tags/tags - 全タグを取得
 * GET /api/smart-tags/tags?status={status} - ステータスでフィルタ
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
    if (!tagId) continue; // タグIDが空の行はスキップ

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status") as TagStatus | null;

    // Google Sheetsからデータを取得
    const range = `${SHEET_NAME}!A:Z`;
    const rows = await fetchFromGoogleSheets(range);

    // データをパース
    let tags = parseTagsSheet(rows);

    // ステータスフィルタを適用
    if (statusFilter) {
      tags = tags.filter((tag) => tag.ステータス === statusFilter);
    }

    const response: ApiResponse<TagSheetRow[]> = {
      success: true,
      data: tags,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] スマートタグ取得エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "タグの取得に失敗しました",
      "TAGS_FETCH_ERROR",
      500
    );
  }
}

















