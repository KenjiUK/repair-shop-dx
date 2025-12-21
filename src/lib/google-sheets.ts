/**
 * Google Sheets API クライアント
 * 
 * マスタデータ（車両マスタ、顧客マスタ）の読み込み専用API
 * 
 * ⚠️ 重要制約: アプリからGoogle Sheets（マスタデータ）への
 * 追加・編集・削除は絶対にしない。読み取り専用として実装すること。
 * 
 * マスタデータの更新は基幹システム（スマートカーディーラー）からの
 * CSV/Excel経由のみ。
 */

import { MasterVehicle, MasterCustomer, SheetsApiResponse } from "@/types";
import { getVehicleMasterById as getMockVehicleMasterById } from "./mock-db";

// =============================================================================
// 設定
// =============================================================================

/** Google Sheets API のベースURL */
const SHEETS_API_BASE_URL = "/api/google-sheets";

/** マスタデータスプレッドシートID（環境変数から取得） */
const MASTER_DATA_SPREADSHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_MASTER_DATA_ID || "";

/** スプレッドシート名 */
const SHEET_NAMES = {
  VEHICLE: "車両マスタ",
  CUSTOMER: "顧客マスタ",
} as const;

// =============================================================================
// エラーハンドリング
// =============================================================================

/**
 * Google Sheets API エラー
 */
export class GoogleSheetsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "GoogleSheetsError";
  }
}

/**
 * エラーレスポンスを解析
 */
function parseErrorResponse(response: Response): Promise<GoogleSheetsError> {
  return response.json().then(
    (data) => {
      const errorMessage = data.error?.message || data.message || "Unknown error";
      const errorCode = data.error?.code || data.code || "UNKNOWN_ERROR";
      return new GoogleSheetsError(errorMessage, errorCode, response.status);
    },
    () => {
      return new GoogleSheetsError(
        `HTTP ${response.status}: ${response.statusText}`,
        "HTTP_ERROR",
        response.status
      );
    }
  );
}

// =============================================================================
// 車両マスタ API
// =============================================================================

/**
 * 車両マスタを取得
 * 
 * @param customerId - 顧客ID（オプション: 特定顧客の車両のみ取得）
 * @returns 車両マスタのリスト
 * 
 * ⚠️ 重要: 読み取り専用。追加・編集・削除は絶対にしない。
 */
export async function fetchVehicleMaster(
  customerId?: string
): Promise<SheetsApiResponse<MasterVehicle>> {
  try {
    const url = new URL(`${SHEETS_API_BASE_URL}/vehicles`, window.location.origin);
    if (customerId) {
      url.searchParams.set("customerId", customerId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // SWRでキャッシュ管理するため、fetchキャッシュは無効化
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const data = await response.json();
    return {
      data: data.data || [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof GoogleSheetsError) {
      throw error;
    }
    throw new GoogleSheetsError(
      `車両マスタの取得に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      "FETCH_ERROR"
    );
  }
}

/**
 * 車両IDで車両マスタを検索
 * 
 * @param vehicleId - 車両ID
 * @returns 車両マスタ（見つからない場合はnull）
 * 
 * ⚠️ 重要: 読み取り専用。追加・編集・削除は絶対にしない。
 */
export async function findVehicleMasterById(
  vehicleId: string
): Promise<MasterVehicle | null> {
  try {
    const url = new URL(`${SHEETS_API_BASE_URL}/vehicles/${encodeURIComponent(vehicleId)}`, window.location.origin);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      // APIが404を返した場合、モックデータから検索を試みる
      const mockData = getMockVehicleMasterById(vehicleId);
      if (mockData) {
        console.log("[Google Sheets] Using mock data for vehicle:", vehicleId);
        return mockData;
      }
      return null;
    }

    if (!response.ok) {
      // APIエラーの場合、モックデータから検索を試みる
      const mockData = getMockVehicleMasterById(vehicleId);
      if (mockData) {
        console.log("[Google Sheets] API error, using mock data for vehicle:", vehicleId);
        return mockData;
      }
      throw await parseErrorResponse(response);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    // ネットワークエラーなどの場合、モックデータから検索を試みる
    const mockData = getMockVehicleMasterById(vehicleId);
    if (mockData) {
      console.log("[Google Sheets] Fetch error, using mock data for vehicle:", vehicleId);
      return mockData;
    }
    
    if (error instanceof GoogleSheetsError) {
      throw error;
    }
    throw new GoogleSheetsError(
      `車両マスタの検索に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      "FETCH_ERROR"
    );
  }
}

// =============================================================================
// 顧客マスタ API
// =============================================================================

/**
 * 顧客マスタを取得
 * 
 * @param customerId - 顧客ID（オプション: 特定顧客のみ取得）
 * @returns 顧客マスタのリスト
 * 
 * ⚠️ 重要: 読み取り専用。追加・編集・削除は絶対にしない。
 */
export async function fetchCustomerMaster(
  customerId?: string
): Promise<SheetsApiResponse<MasterCustomer>> {
  try {
    const url = new URL(`${SHEETS_API_BASE_URL}/customers`, window.location.origin);
    if (customerId) {
      url.searchParams.set("customerId", customerId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const data = await response.json();
    return {
      data: data.data || [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof GoogleSheetsError) {
      throw error;
    }
    throw new GoogleSheetsError(
      `顧客マスタの取得に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      "FETCH_ERROR"
    );
  }
}

/**
 * 顧客IDで顧客マスタを検索
 * 
 * @param customerId - 顧客ID（例: K1001）
 * @returns 顧客マスタ（見つからない場合はnull）
 * 
 * ⚠️ 重要: 読み取り専用。追加・編集・削除は絶対にしない。
 */
export async function findCustomerMasterById(
  customerId: string
): Promise<MasterCustomer | null> {
  try {
    const url = new URL(`${SHEETS_API_BASE_URL}/customers/${encodeURIComponent(customerId)}`, window.location.origin);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw await parseErrorResponse(response);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    if (error instanceof GoogleSheetsError) {
      throw error;
    }
    throw new GoogleSheetsError(
      `顧客マスタの検索に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      "FETCH_ERROR"
    );
  }
}

// =============================================================================
// SWR用のキー生成関数
// =============================================================================

/**
 * SWR用のキー生成（車両マスタ）
 */
export function getVehicleMasterKey(customerId?: string): string {
  return customerId
    ? `google-sheets/vehicles?customerId=${customerId}`
    : "google-sheets/vehicles";
}

/**
 * SWR用のキー生成（顧客マスタ）
 */
export function getCustomerMasterKey(customerId?: string): string {
  return customerId
    ? `google-sheets/customers?customerId=${customerId}`
    : "google-sheets/customers";
}

/**
 * SWR用のキー生成（車両マスタ検索）
 */
export function getVehicleMasterByIdKey(vehicleId: string): string {
  return `google-sheets/vehicles/${vehicleId}`;
}

/**
 * SWR用のキー生成（顧客マスタ検索）
 */
export function getCustomerMasterByIdKey(customerId: string): string {
  return `google-sheets/customers/${customerId}`;
}

















