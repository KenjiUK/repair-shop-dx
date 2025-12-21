/**
 * 通知リトライAPI Route
 * 
 * POST /api/line/retry/[notificationId]
 */

import { NextRequest, NextResponse } from "next/server";
import { LineNotificationResponse, LineNotificationRequest, NotificationHistoryEntry } from "@/lib/line-api";
import { fetchJobById } from "@/lib/api";

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
    } as LineNotificationResponse,
    { status }
  );
}

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
// 通知履歴取得・更新
// =============================================================================

/**
 * 通知履歴から通知情報を取得
 * 
 * 注意: サーバーサイドから直接Google Sheets APIを呼び出す実装
 */
async function getNotificationHistoryEntry(
  notificationId: string
): Promise<{ entry: NotificationHistoryEntry | null; rowIndex: number }> {
  try {

    if (!SPREADSHEET_ID || !API_KEY) {
      throw new Error("GOOGLE_SHEETS_LINE_HISTORY_ID または GOOGLE_SHEETS_API_KEY が設定されていません");
    }

    const range = `${SHEET_NAME}!A:Z`;
    const url = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`通知履歴の取得に失敗しました（ステータス: ${response.status}）`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length === 0) {
      return null;
    }

    // ヘッダー行を取得
    const headers = rows[0];
    const headerMap: Record<string, number> = {};
    headers.forEach((header: string, index: number) => {
      headerMap[header] = index;
    });

    // 必須カラムの確認
    const requiredColumns = ["通知ID", "Job ID", "LINE User ID", "通知種類", "送信日時", "ステータス"];
    for (const col of requiredColumns) {
      if (!(col in headerMap)) {
        throw new Error(`必須カラム "${col}" が見つかりません`);
      }
    }

    // 通知IDで検索
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const entryId = row[headerMap["通知ID"]] || "";
      if (entryId === notificationId) {
        return {
          entry: {
            id: entryId,
            jobId: row[headerMap["Job ID"]] || "",
            lineUserId: row[headerMap["LINE User ID"]] || "",
            type: (row[headerMap["通知種類"]] || "unknown") as NotificationHistoryEntry["type"],
            sentAt: row[headerMap["送信日時"]] || "",
            status: (row[headerMap["ステータス"]] || "pending") as NotificationHistoryEntry["status"],
            errorMessage: row[headerMap["エラーメッセージ"]] || undefined,
            retryCount: row[headerMap["リトライ回数"]] ? parseInt(row[headerMap["リトライ回数"]]) : undefined,
          },
          rowIndex: i + 1, // Google Sheetsの行番号は1ベース（ヘッダー行を含む）
        };
      }
    }

    return { entry: null, rowIndex: -1 };
  } catch (error) {
    console.error("通知履歴取得エラー:", error);
    return { entry: null, rowIndex: -1 };
  }
}

/**
 * 通知履歴のリトライ回数を更新
 */
async function updateRetryCount(
  notificationId: string,
  rowIndex: number
): Promise<void> {
  try {
    if (!SPREADSHEET_ID || !API_KEY) {
      console.warn("GOOGLE_SHEETS_LINE_HISTORY_ID または GOOGLE_SHEETS_API_KEY が設定されていません。リトライ回数の更新をスキップします。");
      return;
    }

    // まず、現在の行データを取得してリトライ回数カラムの位置を確認
    const range = `${SHEET_NAME}!A${rowIndex}:Z${rowIndex}`;
    const getUrl = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    
    const getResponse = await fetch(getUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!getResponse.ok) {
      throw new Error(`通知履歴の取得に失敗しました（ステータス: ${getResponse.status}）`);
    }

    const getData = await getResponse.json();
    const rows = getData.values || [];
    
    if (rows.length === 0) {
      throw new Error("通知履歴の行が見つかりません");
    }

    // ヘッダー行を取得してカラム位置を確認
    const headerRange = `${SHEET_NAME}!A1:Z1`;
    const headerUrl = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(headerRange)}?key=${API_KEY}`;
    
    const headerResponse = await fetch(headerUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!headerResponse.ok) {
      throw new Error(`ヘッダー行の取得に失敗しました（ステータス: ${headerResponse.status}）`);
    }

    const headerData = await headerResponse.json();
    const headerRows = headerData.values || [];
    
    if (headerRows.length === 0) {
      throw new Error("ヘッダー行が見つかりません");
    }

    const headers = headerRows[0];
    const headerMap: Record<string, number> = {};
    headers.forEach((header: string, index: number) => {
      headerMap[header] = index;
    });

    // リトライ回数カラムの位置を確認
    if (!("リトライ回数" in headerMap)) {
      console.warn("リトライ回数カラムが見つかりません。リトライ回数の更新をスキップします。");
      return;
    }

    const retryCountColumnIndex = headerMap["リトライ回数"];
    const currentRow = rows[0];
    const currentRetryCount = currentRow[retryCountColumnIndex] 
      ? parseInt(currentRow[retryCountColumnIndex]) 
      : 0;
    const newRetryCount = currentRetryCount + 1;

    // リトライ回数を更新（該当カラムのみ更新）
    // カラム位置を文字列に変換（A=0, B=1, ..., Z=25, AA=26, ...）
    const getColumnLetter = (index: number): string => {
      let result = "";
      let num = index;
      while (num >= 0) {
        result = String.fromCharCode(65 + (num % 26)) + result;
        num = Math.floor(num / 26) - 1;
      }
      return result;
    };
    const columnLetter = getColumnLetter(retryCountColumnIndex);
    const updateRange = `${SHEET_NAME}!${columnLetter}${rowIndex}`;
    const updateUrl = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(updateRange)}?valueInputOption=RAW&key=${API_KEY}`;

    const updateResponse = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [[newRetryCount.toString()]],
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      throw new Error(
        `リトライ回数の更新に失敗しました（ステータス: ${updateResponse.status}）: ${JSON.stringify(errorData)}`
      );
    }

    console.log(`[LINE Retry] リトライ回数を更新しました: ${notificationId} → ${newRetryCount}`);
  } catch (error) {
    console.error("リトライ回数更新エラー:", error);
    // エラーが発生してもリトライ処理自体は成功として扱う（通知は送信済み）
  }
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * POST /api/line/retry/[notificationId]
 * 通知をリトライ送信
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;

    if (!notificationId) {
      return errorResponse("notificationIdは必須です", "VALIDATION_ERROR", 400);
    }

    // 通知履歴から元の通知情報を取得
    const { entry: historyEntry, rowIndex } = await getNotificationHistoryEntry(notificationId);

    if (!historyEntry) {
      return errorResponse(
        `通知履歴が見つかりません（ID: ${notificationId}）`,
        "NOT_FOUND",
        404
      );
    }

    // Job情報を取得（通知データを再構築するため）
    const jobResult = await fetchJobById(historyEntry.jobId);
    if (!jobResult.success || !jobResult.data) {
      return errorResponse(
        `Job情報が見つかりません（ID: ${historyEntry.jobId}）`,
        "JOB_NOT_FOUND",
        404
      );
    }

    const job = jobResult.data;
    const customer = job.field4;
    const vehicle = job.field6;

    // 元の通知リクエストを再構築
    const retryRequest: LineNotificationRequest = {
      lineUserId: historyEntry.lineUserId,
      type: historyEntry.type,
      jobId: historyEntry.jobId,
      data: {
        customerName: customer?.name || customer?.Last_Name || "",
        vehicleName: vehicle?.field44 || vehicle?.name || "",
        licensePlate: vehicle?.field44 || undefined,
        serviceKind: job.field_service_kinds?.[0] || "その他",
        // 通知タイプに応じて追加データを設定
        ...(historyEntry.type === "estimate" && {
          magicLinkUrl: undefined, // マジックリンクは再生成が必要な場合がある
        }),
      },
    };

    // LINE通知送信APIを呼び出して再送信
    // サーバーサイドから直接呼び出すため、内部関数を使用
    const { sendLineNotification } = await import("@/lib/line-api");
    const notifyResult = await sendLineNotification(retryRequest);

    if (!notifyResult.success) {
      return errorResponse(
        notifyResult.error?.message || "通知の再送信に失敗しました",
        notifyResult.error?.code || "RETRY_FAILED",
        400
      );
    }

    // リトライ回数を更新（通知履歴に記録）
    if (rowIndex > 0) {
      await updateRetryCount(notificationId, rowIndex);
    }

    return NextResponse.json({
      success: true,
      messageId: notifyResult.messageId || `retry-${Date.now()}`,
    } as LineNotificationResponse);
  } catch (error) {
    console.error("通知リトライエラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "内部エラーが発生しました",
      "INTERNAL_ERROR",
      500
    );
  }
}










