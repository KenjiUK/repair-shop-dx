import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, UsageAnalytics, PageViewEvent } from "@/types";
import { createErrorResponse } from "@/lib/server-error-handling";
import { ErrorCodes } from "@/lib/error-handling";

// =============================================================================
// 設定
// =============================================================================

/** アナリティクス用スプレッドシートID（環境変数から取得） */
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_LINE_HISTORY_ID || process.env.GOOGLE_SHEETS_MASTER_DATA_ID || "";
const SHEET_NAME = "アナリティクス";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "";
const GOOGLE_SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

// =============================================================================
// Google Sheets操作
// =============================================================================

/**
 * アナリティクスイベントをGoogle Sheetsに保存
 */
async function saveAnalyticsEvents(events: UsageAnalytics[]): Promise<void> {
  if (!SPREADSHEET_ID || !API_KEY) {
    // 環境変数が設定されていない場合は、開発環境でのみ警告を出力
    if (process.env.NODE_ENV === "development") {
      console.warn("GOOGLE_SHEETS_LINE_HISTORY_ID または GOOGLE_SHEETS_API_KEY が設定されていません。アナリティクスデータは保存されません。");
    }
    return;
  }

  // イベントをGoogle Sheets形式の行データに変換
  const baseTimestamp = Date.now();
  const rows: string[][] = events.map((event, index) => {
    // 各イベントに一意なIDを生成（タイムスタンプ + インデックス + ランダム文字列）
    const eventId = `analytics-${baseTimestamp}-${index}-${Math.random().toString(36).substring(2, 9)}`;
    const metadataJson = event.metadata ? JSON.stringify(event.metadata) : "";
    const pagePath = (event as PageViewEvent).path || "";
    const pageTitle = (event as PageViewEvent).title || "";

    return [
      eventId,                    // イベントID
      event.eventType,            // イベント種別
      event.screenId,             // 画面ID
      event.userRole,             // ユーザーロール
      event.timestamp.toString(), // タイムスタンプ
      event.duration?.toString() || "", // 所要時間（ms）
      metadataJson,               // 追加データ（JSON形式）
      pagePath,                   // ページパス（page_viewの場合）
      pageTitle,                  // ページタイトル（page_viewの場合）
    ];
  });

  // Google Sheets APIを使用して行を追加
  const range = `${SHEET_NAME}!A:I`; // イベントID、イベント種別、画面ID、ユーザーロール、タイムスタンプ、所要時間、追加データ、ページパス、ページタイトル
  const url = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: rows,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `アナリティクスデータの保存に失敗しました（ステータス: ${response.status}）`
    );
  }
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * アナリティクス送信API
 *
 * POST /api/analytics
 * クライアント側から送信されたアナリティクスイベントを受信
 */

/**
 * POST /api/analytics
 * アナリティクスイベントを受信して保存
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body as { events: UsageAnalytics[] };

    // バリデーション
    if (!Array.isArray(events) || events.length === 0) {
      return createErrorResponse(
        ErrorCodes.INVALID_PARAM,
        "イベント配列が必要です",
        400
      );
    }

    // イベント数の上限チェック
    if (events.length > 100) {
      return createErrorResponse(
        ErrorCodes.INVALID_PARAM,
        "一度に送信できるイベント数は100件までです",
        400
      );
    }

    // 各イベントをバリデーション
    for (const event of events) {
      if (!event.eventType || !event.screenId || !event.timestamp) {
        return createErrorResponse(
          ErrorCodes.INVALID_PARAM,
          "イベントに必須フィールドが不足しています",
          400
        );
      }
    }

    // Google Sheetsに保存
    try {
      await saveAnalyticsEvents(events);
    } catch (error) {
      console.error("[Analytics] Google Sheets保存エラー:", error);
      // 保存に失敗しても、開発環境ではログに出力して処理を続行
      if (process.env.NODE_ENV === "development") {
        console.log("[Analytics] イベント受信（保存失敗）:", events.length, "件");
        events.forEach((event) => {
          console.log(`  - ${event.eventType}: ${event.screenId} (${event.userRole})`);
        });
      }
      // 本番環境ではエラーを返すか、ログに記録する
      // 現時点では、保存失敗時も成功レスポンスを返す（将来の改善のため）
    }

    // 開発環境ではログに出力
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] イベント受信:", events.length, "件");
    }

    return NextResponse.json({
      success: true,
      data: {
        received: events.length,
        timestamp: new Date().toISOString(),
      },
    } as ApiResponse<{ received: number; timestamp: string }>);
  } catch (error) {
    console.error("[Analytics] エラー:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      error instanceof Error ? error.message : "アナリティクスの保存に失敗しました",
      500
    );
  }
}











