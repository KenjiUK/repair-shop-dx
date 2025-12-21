/**
 * マジックリンク生成API Route
 * 
 * POST /api/line/magic-link
 */

import { NextRequest, NextResponse } from "next/server";
import { MagicLinkRequest, MagicLinkResponse } from "@/lib/line-api";
import crypto from "crypto";

// =============================================================================
// 設定
// =============================================================================

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_LINE_HISTORY_ID || process.env.GOOGLE_SHEETS_MASTER_DATA_ID || "";
const SHEET_NAME = "マジックリンクトークン";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "";
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
    } as MagicLinkResponse,
    { status }
  );
}

// =============================================================================
// Google Sheets操作
// =============================================================================

/**
 * マジックリンクトークンをGoogle Sheetsに保存
 */
async function saveMagicLinkToken(
  token: string,
  jobId: string,
  workOrderId: string | undefined,
  expiresAt: string
): Promise<void> {
  if (!SPREADSHEET_ID || !API_KEY) {
    throw new Error("GOOGLE_SHEETS_LINE_HISTORY_ID または GOOGLE_SHEETS_API_KEY が設定されていません");
  }

  // シートが存在するか確認し、存在しない場合は作成
  // 注意: 実際の実装では、シートの存在確認と作成処理が必要ですが、
  // ここでは既存のシートに追加する前提で実装します

  // 新しい行を追加
  const now = new Date().toISOString();
  const row = [
    token,           // トークン
    jobId,           // Job ID
    workOrderId || "", // Work Order ID
    expiresAt,       // 有効期限
    now,             // 作成日時
    "false",         // 使用済みフラグ
  ];

  // Google Sheets APIを使用して行を追加
  const range = `${SHEET_NAME}!A:F`; // トークン、Job ID、Work Order ID、有効期限、作成日時、使用済みフラグ
  const url = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&key=${API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [row],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `マジックリンクトークンの保存に失敗しました（ステータス: ${response.status}）`
    );
  }
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * POST /api/line/magic-link
 * マジックリンクを生成
 */
export async function POST(request: NextRequest) {
  try {
    const body: MagicLinkRequest = await request.json();

    // バリデーション
    if (!body.jobId) {
      return errorResponse("jobIdは必須です", "VALIDATION_ERROR", 400);
    }

    // トークンを生成（ランダムな文字列）
    const token = crypto.randomBytes(32).toString("hex");
    const expiresIn = body.expiresIn || 7 * 24 * 60 * 60; // デフォルト: 7日間
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // トークンをGoogle Sheetsに保存
    try {
      await saveMagicLinkToken(token, body.jobId, body.workOrderId, expiresAt);
    } catch (error) {
      console.error("マジックリンクトークンの保存エラー:", error);
      // トークンの保存に失敗しても、マジックリンクURLは生成して返す
      // （既存の動作を維持するため）
      console.warn("マジックリンクトークンの保存に失敗しましたが、URLは生成します:", error);
    }

    // マジックリンクURLを生成
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const path = body.workOrderId
      ? `/customer/approval/${body.jobId}?workOrderId=${body.workOrderId}&token=${token}`
      : `/customer/approval/${body.jobId}?token=${token}`;
    const url = `${baseUrl}${path}`;

    return NextResponse.json({
      success: true,
      url,
      expiresAt,
    } as MagicLinkResponse);
  } catch (error) {
    console.error("マジックリンク生成エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "内部エラーが発生しました",
      "INTERNAL_ERROR",
      500
    );
  }
}










