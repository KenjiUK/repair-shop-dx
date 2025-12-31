/**
 * 変更申請ログ API
 * 
 * POST /api/change-requests - 変更申請をスプレッドシートに追記
 * GET /api/change-requests - 未対応の変更申請を取得
 * 
 * スプレッドシート: 「変更申請ログ」タブ
 */

import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetsClient, getGoogleSheetsWriteClient } from "@/lib/google-auth";
import {
  ChangeRequestData,
  toSpreadsheetRow,
} from "@/lib/change-request-mapping";

// =============================================================================
// 設定
// =============================================================================

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_MASTER_DATA_ID || "";
const SHEET_NAME = "変更申請ログ";

// =============================================================================
// エラーハンドリング
// =============================================================================

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
// POST: 変更申請を追記
// =============================================================================

/**
 * POST /api/change-requests
 * 変更申請をスプレッドシートに追記
 * 
 * Request Body:
 * {
 *   requests: ChangeRequestData[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requests } = body as { requests: ChangeRequestData[] };

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return errorResponse(
        "変更申請データが指定されていません",
        "INVALID_REQUEST",
        400
      );
    }

    if (!SPREADSHEET_ID) {
      return errorResponse(
        "GOOGLE_SHEETS_MASTER_DATA_ID が設定されていません",
        "CONFIG_ERROR",
        500
      );
    }

    // スプレッドシートに追記するデータを作成
    const rows = requests.map((req) => toSpreadsheetRow(req));

    // Google Sheets APIで追記
    const sheets = await getGoogleSheetsWriteClient();
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:O`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: rows,
      },
    });

    console.log(`[API] 変更申請ログに ${rows.length} 件追記しました`);

    return NextResponse.json({
      success: true,
      data: {
        addedCount: rows.length,
        message: `${rows.length}件の変更申請を記録しました`,
      },
    });
  } catch (error) {
    console.error("[API] 変更申請ログ追記エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "変更申請の記録に失敗しました",
      "GOOGLE_SHEETS_ERROR",
      500
    );
  }
}

// =============================================================================
// GET: 未対応の変更申請を取得
// =============================================================================

/**
 * GET /api/change-requests
 * 未対応の変更申請を取得
 * 
 * Query Parameters:
 * - customerId: 顧客IDでフィルタリング（オプション）
 * - status: ステータスでフィルタリング（デフォルト: 未対応）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status") || "未対応";

    if (!SPREADSHEET_ID) {
      return errorResponse(
        "GOOGLE_SHEETS_MASTER_DATA_ID が設定されていません",
        "CONFIG_ERROR",
        500
      );
    }

    // Google Sheetsからデータを取得
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:O`,
    });

    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      // ヘッダー行のみ
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    // ヘッダー行
    const headers = rows[0];
    const headerMap: Record<string, number> = {};
    headers.forEach((header: string, index: number) => {
      headerMap[header] = index;
    });

    // データ行をパース
    const changeRequests = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rowStatus = row[headerMap["ステータス"]] || "";
      const rowCustomerId = row[headerMap["顧客ID"]] || "";

      // フィルタリング
      if (status && rowStatus !== status) continue;
      if (customerId && rowCustomerId !== customerId) continue;

      changeRequests.push({
        申請ID: row[headerMap["申請ID"]] || "",
        申請日時: row[headerMap["申請日時"]] || "",
        顧客ID: rowCustomerId,
        顧客名: row[headerMap["顧客名"]] || "",
        対象マスタ: row[headerMap["対象マスタ"]] || "",
        車両ID: row[headerMap["車両ID"]] || "",
        変更項目: row[headerMap["変更項目"]] || "",
        変更前: row[headerMap["変更前"]] || "",
        変更後: row[headerMap["変更後"]] || "",
        ステータス: rowStatus,
        対応日時: row[headerMap["対応日時"]] || "",
        対応者: row[headerMap["対応者"]] || "",
        備考: row[headerMap["備考"]] || "",
        ジョブID: row[headerMap["ジョブID"]] || "",
        申請元: row[headerMap["申請元"]] || "",
      });
    }

    return NextResponse.json({
      success: true,
      data: changeRequests,
      count: changeRequests.length,
    });
  } catch (error) {
    console.error("[API] 変更申請ログ取得エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "変更申請の取得に失敗しました",
      "GOOGLE_SHEETS_ERROR",
      500
    );
  }
}


