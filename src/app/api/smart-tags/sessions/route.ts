import { NextRequest, NextResponse } from "next/server";
import { SessionSheetRow, ApiResponse, SessionStatus } from "@/types";

/**
 * UUIDを生成（Node.js 14.17.0以降のcrypto.randomUUIDを使用）
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック: 簡易UUID生成
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * スマートタグ管理 API - Sessionsシート操作
 *
 * GET /api/smart-tags/sessions - 全セッションを取得
 * GET /api/smart-tags/sessions?status={status}&tagId={tagId}&jobId={jobId} - フィルタ
 * POST /api/smart-tags/sessions - セッションを作成
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
    if (!sessionId) continue; // セッションIDが空の行はスキップ

    const session: SessionSheetRow = {
      セッションID: sessionId,
      タグID: row[headerMap["タグID"]] || "",
      JobID: row[headerMap["JobID"]] || "",
      紐付け日時: row[headerMap["紐付け日時"]] || new Date().toISOString(),
      解除日時: row[headerMap["解除日時"]] || null,
      ステータス: (row[headerMap["ステータス"]] || "active") as SessionStatus,
      作成日時: row[headerMap["作成日時"]] || new Date().toISOString(),
      更新日時: row[headerMap["更新日時"]] || new Date().toISOString(),
    };

    sessions.push(session);
  }

  return sessions;
}

/**
 * セッションを追加
 */
async function appendSessionToSheet(
  session: Omit<SessionSheetRow, "セッションID" | "作成日時" | "更新日時">
): Promise<SessionSheetRow> {
  const range = `${SHEET_NAME}!A:Z`;
  const rows = await fetchFromGoogleSheets(range);

  if (rows.length === 0) {
    throw new Error("Sessionsシートのヘッダーが見つかりません");
  }

  const headers = rows[0];
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const now = new Date().toISOString();
  const sessionId = generateUUID();

  // 新しい行のデータを準備
  const newRow: string[] = new Array(headers.length).fill("");
  newRow[headerMap["セッションID"]] = sessionId;
  newRow[headerMap["タグID"]] = session.タグID;
  newRow[headerMap["JobID"]] = session.JobID;
  newRow[headerMap["紐付け日時"]] = session.紐付け日時;
  newRow[headerMap["解除日時"]] = session.解除日時 || "";
  newRow[headerMap["ステータス"]] = session.ステータス;
  newRow[headerMap["作成日時"]] = now;
  newRow[headerMap["更新日時"]] = now;

  // Google Sheets APIで追加
  const appendUrl = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:append?valueInputOption=RAW&key=${API_KEY}`;

  const appendResponse = await fetch(appendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [newRow],
    }),
  });

  if (!appendResponse.ok) {
    const errorData = await appendResponse.json().catch(() => ({}));
    throw new Error(
      `Google Sheets API 追加エラー: ${appendResponse.status} ${appendResponse.statusText} - ${JSON.stringify(errorData)}`
    );
  }

  return {
    セッションID: sessionId,
    タグID: session.タグID,
    JobID: session.JobID,
    紐付け日時: session.紐付け日時,
    解除日時: session.解除日時,
    ステータス: session.ステータス,
    作成日時: now,
    更新日時: now,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status") as SessionStatus | null;
    const tagIdFilter = searchParams.get("tagId");
    const jobIdFilter = searchParams.get("jobId");

    // Google Sheetsからデータを取得
    const range = `${SHEET_NAME}!A:Z`;
    const rows = await fetchFromGoogleSheets(range);

    // データをパース
    let sessions = parseSessionsSheet(rows);

    // フィルタを適用
    if (statusFilter) {
      sessions = sessions.filter((s) => s.ステータス === statusFilter);
    }
    if (tagIdFilter) {
      sessions = sessions.filter((s) => s.タグID === tagIdFilter);
    }
    if (jobIdFilter) {
      sessions = sessions.filter((s) => s.JobID === jobIdFilter);
    }

    const response: ApiResponse<SessionSheetRow[]> = {
      success: true,
      data: sessions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] セッション取得エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "セッションの取得に失敗しました",
      "SESSIONS_FETCH_ERROR",
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { タグID, JobID } = body;

    if (!タグID || !JobID) {
      return errorResponse(
        "タグIDとJobIDは必須です",
        "MISSING_REQUIRED_FIELDS",
        400
      );
    }

    const now = new Date().toISOString();
    const newSession = await appendSessionToSheet({
      タグID,
      JobID,
      紐付け日時: now,
      解除日時: null,
      ステータス: "active",
    });

    const response: ApiResponse<SessionSheetRow> = {
      success: true,
      data: newSession,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] セッション作成エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "セッションの作成に失敗しました",
      "SESSION_CREATE_ERROR",
      500
    );
  }
}

















