/**
 * Google Sheets API - 顧客マスタ取得
 * 
 * GET /api/google-sheets/customers
 * GET /api/google-sheets/customers?customerId={customerId}
 * 
 * ⚠️ 重要制約: 読み取り専用。追加・編集・削除は絶対にしない。
 */

import { NextRequest, NextResponse } from "next/server";
import { MasterCustomer, SheetsApiResponse } from "@/types";

// =============================================================================
// 設定
// =============================================================================

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_MASTER_DATA_ID || "";
const SHEET_NAME = "顧客マスタ";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY || "";
const GOOGLE_SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

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

async function fetchFromGoogleSheets(range: string): Promise<string[][]> {
  if (!SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_MASTER_DATA_ID が設定されていません");
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
 * 顧客マスタデータをパース
 */
function parseCustomerMaster(rows: string[][]): MasterCustomer[] {
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
  const requiredColumns = ["顧客ID", "顧客名"];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      throw new Error(`必須カラム "${col}" が見つかりません`);
    }
  }

  // データ行をパース
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

    // 顧客IDが空の場合はスキップ
    if (!customer.顧客ID) continue;

    customers.push(customer);
  }

  return customers;
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * GET /api/google-sheets/customers
 * 顧客マスタを取得
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータから顧客IDを取得
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");

    // Google Sheetsからデータを取得
    const range = `${SHEET_NAME}!A:Z`; // 全列を取得
    const rows = await fetchFromGoogleSheets(range);

    // データをパース
    let customers = parseCustomerMaster(rows);

    // 顧客IDでフィルタリング（指定されている場合）
    if (customerId) {
      customers = customers.filter((c) => c.顧客ID === customerId);
    }

    // レスポンスを返す
    const response: SheetsApiResponse<MasterCustomer> = {
      data: customers,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response.data,
      lastUpdated: response.lastUpdated,
    });
  } catch (error) {
    console.error("[API] Google Sheets 顧客マスタ取得エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "顧客マスタの取得に失敗しました",
      "GOOGLE_SHEETS_ERROR",
      500
    );
  }
}

















