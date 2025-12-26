/**
 * Google Sheets API - 顧客マスタ検索（顧客ID指定）
 * 
 * GET /api/google-sheets/customers/{customerId}
 * 
 * ⚠️ 重要制約: 読み取り専用。追加・編集・削除は絶対にしない。
 */

import { NextRequest, NextResponse } from "next/server";
import { MasterCustomer } from "@/types";
import { getGoogleSheetsClient } from "@/lib/google-auth";

// =============================================================================
// 設定
// =============================================================================

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_MASTER_DATA_ID || "";
const SHEET_NAME = "顧客マスタ";

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
// Google Sheets API 呼び出し
// =============================================================================

/**
 * Google Sheetsからデータを取得（googleapisライブラリを使用）
 */
async function fetchFromGoogleSheets(range: string): Promise<string[][]> {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_MASTER_DATA_ID が設定されていません");
  }

  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
  });

  if (!response.data.values) {
    return [];
  }

  return response.data.values as string[][];
}

function parseCustomerMaster(rows: string[][]): MasterCustomer[] {
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const requiredColumns = ["顧客ID", "顧客名"];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      throw new Error(`必須カラム "${col}" が見つかりません`);
    }
  }

  const customers: MasterCustomer[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const customer: MasterCustomer = {
      顧客ID: row[headerMap["顧客ID"]] || "",
      顧客名: row[headerMap["顧客名"]] || "",
      住所連結: row[headerMap["住所連結"]] || "",
      電話番号: row[headerMap["電話番号"]] || "",
      携帯番号: row[headerMap["携帯番号"]] || "",
    };

    if (!customer.顧客ID) continue;
    customers.push(customer);
  }

  return customers;
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * GET /api/google-sheets/customers/{customerId}
 * 顧客IDで顧客マスタを検索
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!customerId) {
      return errorResponse("顧客IDが指定されていません", "INVALID_REQUEST", 400);
    }

    // Google Sheetsからデータを取得
    const range = `${SHEET_NAME}!A:Z`;
    const rows = await fetchFromGoogleSheets(range);

    // データをパース
    const customers = parseCustomerMaster(rows);

    // 顧客IDで検索
    const customer = customers.find((c) => c.顧客ID === customerId);

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `顧客ID "${customerId}" が見つかりません`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("[API] Google Sheets 顧客マスタ検索エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "顧客マスタの検索に失敗しました",
      "GOOGLE_SHEETS_ERROR",
      500
    );
  }
}

























