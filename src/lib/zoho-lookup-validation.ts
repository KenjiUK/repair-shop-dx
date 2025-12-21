/**
 * Zoho CRM Lookupフィールド検証
 *
 * Lookupフィールド更新時に参照先レコードIDの存在確認
 */

import { ApiResponse } from "@/types";
import { findCustomerMasterById, findVehicleMasterById } from "./google-sheets";

// =============================================================================
// 型定義
// =============================================================================

/**
 * Lookupフィールドの種類
 */
export type LookupFieldType = "customer" | "vehicle";

/**
 * 検証結果
 */
export interface LookupValidationResult {
  /** 検証成功かどうか */
  valid: boolean;
  /** エラーメッセージ */
  error?: string;
  /** 参照先レコードID */
  recordId?: string;
}

// =============================================================================
// 参照先レコードID検証
// =============================================================================

/**
 * 顧客レコードIDの存在確認
 */
export async function validateCustomerRecordId(
  customerId: string
): Promise<LookupValidationResult> {
  try {
    // まずGoogle Sheetsマスタデータを確認（基幹システムのマスタデータ）
    try {
      const masterCustomer = await findCustomerMasterById(customerId);
      if (masterCustomer) {
        return {
          valid: true,
          recordId: customerId,
        };
      }
    } catch (masterError) {
      // マスタデータの検索に失敗した場合は、Zoho CRM APIを確認
      console.warn("マスタデータでの顧客検証に失敗しました。Zoho CRM APIを確認します:", masterError);
    }

    // Google Sheetsマスタデータに存在しない場合、Zoho CRM APIを確認
    const response = await fetch(`/api/zoho/customers/${customerId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          valid: false,
          error: `顧客レコードが見つかりません（ID: ${customerId}）`,
        };
      }
      return {
        valid: false,
        error: `顧客レコードの検証に失敗しました（ステータス: ${response.status}）`,
      };
    }

    const data = await response.json() as ApiResponse<unknown>;
    if (!data.success) {
      return {
        valid: false,
        error: data.error?.message || "顧客レコードの検証に失敗しました",
      };
    }

    return {
      valid: true,
      recordId: customerId,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "顧客レコードの検証中にエラーが発生しました",
    };
  }
}

/**
 * 車両レコードIDの存在確認
 */
export async function validateVehicleRecordId(
  vehicleId: string
): Promise<LookupValidationResult> {
  try {
    // まずGoogle Sheetsマスタデータを確認（基幹システムのマスタデータ）
    try {
      const masterVehicle = await findVehicleMasterById(vehicleId);
      if (masterVehicle) {
        return {
          valid: true,
          recordId: vehicleId,
        };
      }
    } catch (masterError) {
      // マスタデータの検索に失敗した場合は、Zoho CRM APIを確認
      console.warn("マスタデータでの車両検証に失敗しました。Zoho CRM APIを確認します:", masterError);
    }

    // Google Sheetsマスタデータに存在しない場合、Zoho CRM APIを確認
    const response = await fetch(`/api/zoho/vehicles/${vehicleId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          valid: false,
          error: `車両レコードが見つかりません（ID: ${vehicleId}）`,
        };
      }
      return {
        valid: false,
        error: `車両レコードの検証に失敗しました（ステータス: ${response.status}）`,
      };
    }

    const data = await response.json() as ApiResponse<unknown>;
    if (!data.success) {
      return {
        valid: false,
        error: data.error?.message || "車両レコードの検証に失敗しました",
      };
    }

    return {
      valid: true,
      recordId: vehicleId,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "車両レコードの検証中にエラーが発生しました",
    };
  }
}

/**
 * Lookupフィールドの値を検証
 */
export async function validateLookupField(
  fieldType: LookupFieldType,
  recordId: string
): Promise<LookupValidationResult> {
  switch (fieldType) {
    case "customer":
      return await validateCustomerRecordId(recordId);
    case "vehicle":
      return await validateVehicleRecordId(recordId);
    default:
      return {
        valid: false,
        error: `不明なLookupフィールドタイプ: ${fieldType}`,
      };
  }
}

/**
 * 複数のLookupフィールドを一括検証
 */
export async function validateLookupFields(
  fields: Array<{ type: LookupFieldType; recordId: string }>
): Promise<Array<{ field: LookupFieldType; result: LookupValidationResult }>> {
  const results = await Promise.all(
    fields.map(async (field) => ({
      field: field.type,
      result: await validateLookupField(field.type, field.recordId),
    }))
  );

  return results;
}











