import { NextRequest, NextResponse } from "next/server";
import { SessionSheetRow, ApiResponse } from "@/types";

/**
 * スマートタグ管理 API - セッション閉鎖
 *
 * POST /api/smart-tags/sessions/{sessionId}/close - セッションを閉じる
 */

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SMART_TAGS_ID || "";
const SHEET_NAME = "Sessions";
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
 * Sessionsシートのデータをパース
 */
function parseSessionsSheet(rows: string[][]): SessionSheetRow[] {
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const requiredColumns = ["セッションID", "タグID", "JobID", "ステータス"];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      throw new Error(`必須カラム "${col}" が見つかりません`);
    }
  }

  const sessions: SessionSheetRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const sessionId = row[headerMap["セッションID"]] || "";
    if (!sessionId) continue;

    const session: SessionSheetRow = {
      セッションID: sessionId,
      タグID: row[headerMap["タグID"]] || "",
      JobID: row[headerMap["JobID"]] || "",
      紐付け日時: row[headerMap["紐付け日時"]] || new Date().toISOString(),
      解除日時: row[headerMap["解除日時"]] || null,
      ステータス: (row[headerMap["ステータス"]] || "active") as SessionSheetRow["ステータス"],
      作成日時: row[headerMap["作成日時"]] || new Date().toISOString(),
      更新日時: row[headerMap["更新日時"]] || new Date().toISOString(),
    };

    sessions.push(session);
  }

  return sessions;
}

/**
 * セッションの行番号を取得（更新用）
 */
async function findSessionRowNumber(sessionId: string): Promise<number | null> {
  const range = `${SHEET_NAME}!A:Z`;
  const rows = await fetchFromGoogleSheets(range);

  if (rows.length === 0) {
    return null;
  }

  const headers = rows[0];
  const sessionIdColumnIndex = headers.indexOf("セッションID");

  if (sessionIdColumnIndex === -1) {
    return null;
  }

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][sessionIdColumnIndex] === sessionId) {
      return i + 1; // Google Sheetsの行番号は1始まり
    }
  }

  return null;
}

/**
 * セッションを閉じる
 */
async function closeSessionInSheet(sessionId: string): Promise<SessionSheetRow> {
  const rowNumber = await findSessionRowNumber(sessionId);
  if (!rowNumber) {
    throw new Error(`セッションID "${sessionId}" が見つかりません`);
  }

  // 更新するカラムを特定
  const range = `${SHEET_NAME}!A:Z`;
  const rows = await fetchFromGoogleSheets(range);
  const headers = rows[0];
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const now = new Date().toISOString();

  // 更新する値を準備
  const values: string[] = [];
  const updateColumns: string[] = [];

  // ステータスをclosedに更新
  const statusColIndex = headerMap["ステータス"];
  if (statusColIndex !== undefined) {
    values.push("closed");
    updateColumns.push(String.fromCharCode(65 + statusColIndex));
  }

  // 解除日時を更新
  const unlinkedAtColIndex = headerMap["解除日時"];
  if (unlinkedAtColIndex !== undefined) {
    values.push(now);
    updateColumns.push(String.fromCharCode(65 + unlinkedAtColIndex));
  }

  // 更新日時を自動更新
  const updatedAtColIndex = headerMap["更新日時"];
  if (updatedAtColIndex !== undefined) {
    values.push(now);
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
  const updatedSessions = parseSessionsSheet(updatedRows);
  const updatedSession = updatedSessions.find((s) => s.セッションID === sessionId);

  if (!updatedSession) {
    throw new Error(`更新後のセッションデータの取得に失敗しました`);
  }

  return updatedSession;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return errorResponse(
        "セッションIDが指定されていません",
        "INVALID_REQUEST",
        400
      );
    }

    const closedSession = await closeSessionInSheet(sessionId);

    const response: ApiResponse<SessionSheetRow> = {
      success: true,
      data: closedSession,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] セッション閉鎖エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "セッションの閉鎖に失敗しました",
      "SESSION_CLOSE_ERROR",
      500
    );
  }
}

















