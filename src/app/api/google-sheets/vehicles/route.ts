/**
 * Google Sheets API - 車両マスタ取得
 * 
 * GET /api/google-sheets/vehicles
 * GET /api/google-sheets/vehicles?customerId={customerId}
 * 
 * ⚠️ 重要制約: 読み取り専用。追加・編集・削除は絶対にしない。
 */

import { NextRequest, NextResponse } from "next/server";
import { MasterVehicle, SheetsApiResponse } from "@/types";

// =============================================================================
// 設定
// =============================================================================

/** Google Sheets API のスプレッドシートID（環境変数から取得） */
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_MASTER_DATA_ID || "";
const SHEET_NAME = "車両マスタ";
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
    },
    { status }
  );
}

// =============================================================================
// Google Sheets API 呼び出し
// =============================================================================

/**
 * Google Sheetsからデータを取得
 * 
 * ⚠️ 重要: 読み取り専用。書き込みメソッドは使用しない。
 */
async function fetchFromGoogleSheets(
  range: string
): Promise<string[][]> {
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
 * 車両マスタデータをパース
 */
function parseVehicleMaster(rows: string[][]): MasterVehicle[] {
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
  const requiredColumns = ["車両ID", "顧客ID", "登録番号連結", "車名", "型式"];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      throw new Error(`必須カラム "${col}" が見つかりません`);
    }
  }

  // データ行をパース
  const vehicles: MasterVehicle[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const vehicle: MasterVehicle = {
      車両ID: row[headerMap["車両ID"]] || "",
      顧客ID: row[headerMap["顧客ID"]] || "",
      登録番号連結: row[headerMap["登録番号連結"]] || "",
      車名: row[headerMap["車名"]] || "",
      型式: row[headerMap["型式"]] || "",
      車検有効期限: row[headerMap["車検有効期限"]] || "",
      次回点検日: row[headerMap["次回点検日"]] || "",
    };

    // 車両IDが空の場合はスキップ
    if (!vehicle.車両ID) continue;

    vehicles.push(vehicle);
  }

  return vehicles;
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * GET /api/google-sheets/vehicles
 * 車両マスタを取得
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータから顧客IDを取得
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");

    // Google Sheetsからデータを取得
    const range = `${SHEET_NAME}!A:Z`; // 全列を取得（最大Z列まで）
    const rows = await fetchFromGoogleSheets(range);

    // データをパース
    let vehicles = parseVehicleMaster(rows);

    // 顧客IDでフィルタリング（指定されている場合）
    if (customerId) {
      vehicles = vehicles.filter((v) => v.顧客ID === customerId);
    }

    // レスポンスを返す
    const response: SheetsApiResponse<MasterVehicle> = {
      data: vehicles,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response.data,
      lastUpdated: response.lastUpdated,
    });
  } catch (error) {
    console.error("[API] Google Sheets 車両マスタ取得エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "車両マスタの取得に失敗しました",
      "GOOGLE_SHEETS_ERROR",
      500
    );
  }
}

















