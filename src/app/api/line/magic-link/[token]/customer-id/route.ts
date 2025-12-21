/**
 * マジックリンクトークンから顧客IDを取得API Route
 * 
 * GET /api/line/magic-link/[token]/customer-id
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchJobById } from "@/lib/api";

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
    },
    { status }
  );
}

// =============================================================================
// Google Sheets操作
// =============================================================================

/**
 * マジックリンクトークンからJob IDを取得
 */
async function getJobIdFromToken(token: string): Promise<string | null> {
  if (!SPREADSHEET_ID || !API_KEY) {
    throw new Error("GOOGLE_SHEETS_LINE_HISTORY_ID または GOOGLE_SHEETS_API_KEY が設定されていません");
  }

  // Google Sheets APIを使用してトークンを検索
  const range = `${SHEET_NAME}!A:F`; // トークン、Job ID、Work Order ID、有効期限、作成日時、使用済みフラグ
  const url = `${GOOGLE_SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `マジックリンクトークンの取得に失敗しました（ステータス: ${response.status}）`
    );
  }

  const data = await response.json();
  const rows = data.values || [];

  // トークンで検索（最初の列がトークン）
  for (const row of rows) {
    if (row[0] === token) {
      // 有効期限をチェック
      const expiresAt = row[3];
      if (expiresAt && new Date(expiresAt) < new Date()) {
        // 有効期限切れ
        return null;
      }

      // 使用済みフラグをチェック
      const used = row[5] === "true";
      if (used) {
        // 既に使用済み
        return null;
      }

      // Job IDを返す（2番目の列）
      return row[1] || null;
    }
  }

  return null;
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * GET /api/line/magic-link/[token]/customer-id
 * マジックリンクトークンから顧客IDを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // バリデーション
    if (!token) {
      return errorResponse("トークンは必須です", "VALIDATION_ERROR", 400);
    }

    // トークンからJob IDを取得
    const jobId = await getJobIdFromToken(token);
    if (!jobId) {
      return errorResponse("有効なマジックリンクトークンが見つかりません", "TOKEN_NOT_FOUND", 404);
    }

    // Job IDからJobデータを取得
    const job = await fetchJobById(jobId);
    if (!job) {
      return errorResponse("ジョブが見つかりません", "JOB_NOT_FOUND", 404);
    }

    // 顧客IDを取得（field4.idまたはfield4.nameから顧客IDを抽出）
    const customer = job.field4;
    if (!customer) {
      return errorResponse("顧客情報が見つかりません", "CUSTOMER_NOT_FOUND", 404);
    }

    // 顧客IDを返す（field4.idが顧客レコードID、field4.nameから顧客IDを抽出する必要がある場合もある）
    // 注意: 実際の実装では、顧客レコードIDから顧客ID（ID1）を取得する必要がある
    // ここでは、顧客レコードIDを返す（将来的には顧客ID（ID1）を取得する実装に変更）
    const customerId = customer.id || null;

    if (!customerId) {
      return errorResponse("顧客IDが見つかりません", "CUSTOMER_ID_NOT_FOUND", 404);
    }

    return NextResponse.json({
      success: true,
      customerId,
    });
  } catch (error) {
    console.error("マジックリンクトークンから顧客ID取得エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "内部エラーが発生しました",
      "INTERNAL_ERROR",
      500
    );
  }
}





