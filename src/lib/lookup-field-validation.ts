/**
 * Lookupフィールド更新時の参照先レコードID検証
 *
 * field4（顧客名Lookup）、field6（車両ID Lookup）更新時に
 * 参照先レコードIDの存在を検証
 */

import { ApiResponse } from "@/types";
import { fetchCustomerById, fetchVehicleById } from "./api";

// =============================================================================
// Lookupフィールド検証
// =============================================================================

/**
 * 顧客ID（field4）の参照先レコードIDを検証
 */
export async function validateCustomerLookup(
  customerId: string
): Promise<ApiResponse<boolean>> {
  try {
    const result = await fetchCustomerById(customerId);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: "LOOKUP_VALIDATION_FAILED",
          message: `顧客ID ${customerId} が見つかりません`,
        },
      };
    }
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "LOOKUP_VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "顧客IDの検証に失敗しました",
      },
    };
  }
}

/**
 * 車両ID（field6）の参照先レコードIDを検証
 */
export async function validateVehicleLookup(
  vehicleId: string
): Promise<ApiResponse<boolean>> {
  try {
    const result = await fetchVehicleById(vehicleId);
    if (!result.success) {
      return {
        success: false,
        error: {
          code: "LOOKUP_VALIDATION_FAILED",
          message: `車両ID ${vehicleId} が見つかりません`,
        },
      };
    }
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "LOOKUP_VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "車両IDの検証に失敗しました",
      },
    };
  }
}

/**
 * Lookupフィールドの更新前に参照先レコードIDを検証
 */
export async function validateLookupField(
  fieldName: "field4" | "field6",
  recordId: string
): Promise<ApiResponse<boolean>> {
  switch (fieldName) {
    case "field4":
      return await validateCustomerLookup(recordId);
    case "field6":
      return await validateVehicleLookup(recordId);
    default:
      return {
        success: false,
        error: {
          code: "INVALID_FIELD",
          message: `無効なLookupフィールド: ${fieldName}`,
        },
      };
  }
}



