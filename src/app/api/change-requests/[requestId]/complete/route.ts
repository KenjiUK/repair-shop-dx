/**
 * 変更申請 対応完了API
 * 
 * PATCH /api/change-requests/[requestId]/complete
 * スプレッドシートの該当行のステータスを「対応済み」に更新
 */

import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetsWriteClient, getGoogleSheetsClient } from "@/lib/google-auth";

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
// PATCH: 変更申請を対応完了にする
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    if (!requestId) {
      return errorResponse(
        "申請IDが指定されていません",
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

    // まず、該当行を検索
    const sheetsRead = await getGoogleSheetsClient();
    const response = await sheetsRead.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:O`,
    });

    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      return errorResponse(
        "変更申請が見つかりません",
        "NOT_FOUND",
        404
      );
    }

    // ヘッダー行からインデックスを取得
    const headers = rows[0];
    const headerMap: Record<string, number> = {};
    headers.forEach((header: string, index: number) => {
      headerMap[header] = index;
    });

    const statusColIndex = headerMap["ステータス"];
    const completedAtColIndex = headerMap["対応日時"];
    const completedByColIndex = headerMap["対応者"];

    if (statusColIndex === undefined) {
      return errorResponse(
        "ステータス列が見つかりません",
        "INVALID_SHEET",
        500
      );
    }

    // 該当行を検索
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[headerMap["申請ID"]] === requestId) {
        targetRowIndex = i + 1; // スプレッドシートは1-indexed
        break;
      }
    }

    if (targetRowIndex === -1) {
      return errorResponse(
        "指定された申請IDが見つかりません",
        "NOT_FOUND",
        404
      );
    }

    // ステータスを「対応済み」に更新
    const sheetsWrite = await getGoogleSheetsWriteClient();
    
    // 対応日時を生成
    const now = new Date();
    const formattedDate = now.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Tokyo",
    });

    // ステータス列を更新（J列 = 10番目）
    const statusCol = String.fromCharCode(65 + statusColIndex); // A=65
    await sheetsWrite.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${statusCol}${targetRowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["対応済み"]],
      },
    });

    // 対応日時列を更新（K列 = 11番目）
    if (completedAtColIndex !== undefined) {
      const completedAtCol = String.fromCharCode(65 + completedAtColIndex);
      await sheetsWrite.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${completedAtCol}${targetRowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[formattedDate]],
        },
      });
    }

    // 対応者列を更新（L列 = 12番目）- 「アプリから対応完了」と記録
    if (completedByColIndex !== undefined) {
      const completedByCol = String.fromCharCode(65 + completedByColIndex);
      await sheetsWrite.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${completedByCol}${targetRowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["アプリから対応完了"]],
        },
      });
    }

    console.log(`[API] 変更申請 ${requestId} を対応完了にしました`);

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        status: "対応済み",
        completedAt: formattedDate,
      },
    });
  } catch (error) {
    console.error("[API] 変更申請対応完了エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "対応完了処理に失敗しました",
      "GOOGLE_SHEETS_ERROR",
      500
    );
  }
}


