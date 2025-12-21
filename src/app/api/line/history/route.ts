/**
 * 通知履歴取得API Route
 * 
 * GET /api/line/history
 */

import { NextRequest, NextResponse } from "next/server";
import { NotificationHistoryRequest, NotificationHistoryResponse, NotificationHistoryEntry } from "@/lib/line-api";

// =============================================================================
// 設定
// =============================================================================

/** LINE通知履歴用スプレッドシートID（環境変数から取得） */
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_LINE_HISTORY_ID || process.env.GOOGLE_SHEETS_MASTER_DATA_ID || "";
const SHEET_NAME = "LINE通知履歴";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "";

/** Google Sheets API のベースURL */
const GOOGLE_SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

// =============================================================================
// エラーハンドリング
// =============================================================================

/**
 * エラーレスポンスを生成
 */
function errorResponse(
  message: string,
  code: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    } as NotificationHistoryResponse,
    { status }
  );
}

// =============================================================================
// Google Sheets API 呼び出し
// =============================================================================

/**
 * Google Sheetsからデータを取得
 */
async function fetchFromGoogleSheets(range: string): Promise<string[][]> {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_LINE_HISTORY_ID または GOOGLE_SHEETS_MASTER_DATA_ID が設定されていません");
  }

  if (!API_KEY) {
    throw new Error("GOOGLE_SHEETS_API_KEY が設定されていません");
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
 * 通知履歴データをパース
 */
function parseNotificationHistory(rows: string[][]): NotificationHistoryEntry[] {
  if (rows.length === 0) {
    return [];
  }

  // ヘッダー行を取得
  const headers = rows[0];
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  // 必須カラムの確認
  const requiredColumns = ["通知ID", "Job ID", "LINE User ID", "通知種類", "送信日時", "ステータス"];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      throw new Error(`必須カラム "${col}" が見つかりません`);
    }
  }

  // データ行をパース
  const entries: NotificationHistoryEntry[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const entry: NotificationHistoryEntry = {
      id: row[headerMap["通知ID"]] || "",
      jobId: row[headerMap["Job ID"]] || "",
      lineUserId: row[headerMap["LINE User ID"]] || "",
      type: (row[headerMap["通知種類"]] || "unknown") as NotificationHistoryEntry["type"],
      sentAt: row[headerMap["送信日時"]] || "",
      status: (row[headerMap["ステータス"]] || "pending") as NotificationHistoryEntry["status"],
      errorMessage: row[headerMap["エラーメッセージ"]] || undefined,
      retryCount: row[headerMap["リトライ回数"]] ? parseInt(row[headerMap["リトライ回数"]]) : undefined,
    };

    // 通知IDが空の場合はスキップ
    if (!entry.id) continue;

    entries.push(entry);
  }

  return entries;
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * GET /api/line/history
 * 通知履歴を取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query: NotificationHistoryRequest = {
      jobId: searchParams.get("jobId") || undefined,
      lineUserId: searchParams.get("lineUserId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20,
    };

    // Google Sheetsからデータを取得
    const range = `${SHEET_NAME}!A:Z`; // 全列を取得（最大Z列まで）
    const rows = await fetchFromGoogleSheets(range);

    // データをパース
    let entries = parseNotificationHistory(rows);

    // フィルタリング
    if (query.jobId) {
      entries = entries.filter((e) => e.jobId === query.jobId);
    }
    if (query.lineUserId) {
      entries = entries.filter((e) => e.lineUserId === query.lineUserId);
    }
    if (query.startDate) {
      const startDate = new Date(query.startDate);
      entries = entries.filter((e) => new Date(e.sentAt) >= startDate);
    }
    if (query.endDate) {
      const endDate = new Date(query.endDate);
      entries = entries.filter((e) => new Date(e.sentAt) <= endDate);
    }

    // 送信日時でソート（降順：新しい順）
    entries.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    // ページネーション
    const total = entries.length;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEntries = entries.slice(startIndex, endIndex);

    // レスポンスを返す
    const response: NotificationHistoryResponse = {
      success: true,
      entries: paginatedEntries,
      total,
      page,
      limit,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] LINE通知履歴取得エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "通知履歴の取得に失敗しました",
      "GOOGLE_SHEETS_ERROR",
      500
    );
  }
}










