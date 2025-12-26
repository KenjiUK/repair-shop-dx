/**
 * Google Sheets API - 車両マスタ検索（車両ID指定）
 * 
 * GET /api/google-sheets/vehicles/{vehicleId}
 * 
 * ⚠️ 重要制約: 読み取り専用。追加・編集・削除は絶対にしない。
 */

import { NextRequest, NextResponse } from "next/server";
import { MasterVehicle } from "@/types";
import { getGoogleSheetsClient } from "@/lib/google-auth";
import { getVehicleById } from "@/lib/mock-db";

// =============================================================================
// 設定
// =============================================================================

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_MASTER_DATA_ID || "";
const SHEET_NAME = "車両マスタ";

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

function parseVehicleMaster(rows: string[][]): MasterVehicle[] {
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const requiredColumns = ["車両ID", "顧客ID", "登録番号連結", "車名", "型式"];
  for (const col of requiredColumns) {
    if (!(col in headerMap)) {
      throw new Error(`必須カラム "${col}" が見つかりません`);
    }
  }

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

    if (!vehicle.車両ID) continue;
    vehicles.push(vehicle);
  }

  return vehicles;
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * GET /api/google-sheets/vehicles/{vehicleId}
 * 車両IDで車両マスタを検索
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const { vehicleId } = await params;
  
  try {

    if (!vehicleId) {
      return errorResponse("車両IDが指定されていません", "INVALID_REQUEST", 400);
    }

    // Google Sheetsからデータを取得
    const range = `${SHEET_NAME}!A:Z`;
    const rows = await fetchFromGoogleSheets(range);

    // データをパース
    const vehicles = parseVehicleMaster(rows);

    // 車両IDで検索
    const vehicle = vehicles.find((v) => v.車両ID === vehicleId);

    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `車両ID "${vehicleId}" が見つかりません`,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    console.error("[API] Google Sheets 車両マスタ検索エラー:", error);
    
    // フォールバック: モックデータから検索
    try {
      const { vehicleId } = await params;
      if (vehicleId) {
        const mockVehicle = getVehicleById(vehicleId);
        if (mockVehicle) {
          // ZohoVehicleをMasterVehicle形式に変換
          const masterVehicle: MasterVehicle = {
            車両ID: mockVehicle.vehicleId || mockVehicle.Name,
            顧客ID: mockVehicle.customerId || mockVehicle.ID1 || "",
            登録番号連結: mockVehicle.licensePlate || mockVehicle.field44 || "",
            車名: mockVehicle.vehicleId || mockVehicle.Name || "",
            型式: "",
            車検有効期限: mockVehicle.inspectionExpiry || mockVehicle.field7 || "",
            次回点検日: "",
          };
          
          console.log("[API] モックデータから車両マスタを返却:", vehicleId);
          return NextResponse.json({
            success: true,
            data: masterVehicle,
          });
        }
      }
    } catch (fallbackError) {
      console.error("[API] フォールバック処理エラー:", fallbackError);
    }
    
    return errorResponse(
      error instanceof Error ? error.message : "車両マスタの検索に失敗しました",
      "GOOGLE_SHEETS_ERROR",
      500
    );
  }
}

























