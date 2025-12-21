/**
 * 顧客(Contacts)モジュール更新処理
 *
 * 誤更新防止の実装（更新権限チェック、自動変換）
 */

import { ZohoCustomer, ApiResponse } from "@/types";
import {
  hasReadOnlyFields,
  removeReadOnlyFields,
  ReadOnlyField,
} from "./customer-field-validation";
import {
  appendChangeRequestToDescription,
  hasChangeRequests,
} from "./customer-description-append";
import { ErrorCodes, createErrorLogEntry, logError } from "./error-handling";

// =============================================================================
// 顧客更新処理
// =============================================================================

/**
 * 顧客情報を更新（制約チェック付き）
 */
export async function updateCustomerWithValidation(
  customerId: string,
  updateData: Partial<ZohoCustomer>,
  currentCustomer?: ZohoCustomer
): Promise<ApiResponse<ZohoCustomer>> {
  // 直接更新NGフィールドが含まれているかチェック
  const readOnlyFields = hasReadOnlyFields(updateData);

  if (readOnlyFields.length > 0) {
    // 現在の顧客データを取得（未提供の場合）
    let customer = currentCustomer;
    if (!customer) {
      try {
        const response = await fetch(`/api/zoho/customers/${customerId}`);
        if (response.ok) {
          const data = await response.json() as ApiResponse<ZohoCustomer>;
          if (data.success) {
            customer = data.data;
          }
        }
      } catch (error) {
        // エラー時は後続処理で対応
      }
    }

    if (!customer) {
      // エラーログはクライアント側でのみ記録
      if (typeof window !== "undefined") {
        const errorEntry = createErrorLogEntry(
          new Error("顧客データの取得に失敗しました"),
          ErrorCodes.DATA_NOT_FOUND,
          {
            location: "updateCustomerWithValidation",
            request: {
              url: `/api/zoho/customers/${customerId}`,
              method: "PATCH",
              body: updateData,
            },
          }
        );
        logError(errorEntry);
      }

      return {
        success: false,
        error: {
          code: ErrorCodes.DATA_NOT_FOUND,
          message: "顧客データの取得に失敗しました",
        },
      };
    }

    // Descriptionに変更要求を追記
    const updatedDescription = appendChangeRequestToDescription(customer, updateData);

    // 直接更新NGフィールドを除外し、Descriptionを追加
    const allowedData = removeReadOnlyFields(updateData);
    allowedData.Description = updatedDescription;

    // 更新を実行
    return await updateCustomer(customerId, allowedData);
  }

  // 直接更新可能なフィールドのみの場合は通常通り更新
  return await updateCustomer(customerId, updateData);
}

/**
 * 顧客情報を更新（内部関数）
 */
async function updateCustomer(
  customerId: string,
  updateData: Partial<ZohoCustomer>
): Promise<ApiResponse<ZohoCustomer>> {
  try {
    const response = await fetch(`/api/zoho/customers/${customerId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `更新に失敗しました（ステータス: ${response.status}）`
      );
    }

    const data = await response.json();
    return data as ApiResponse<ZohoCustomer>;
  } catch (error) {
    // エラーログはクライアント側でのみ記録
    if (typeof window !== "undefined") {
      const errorEntry = createErrorLogEntry(
        error,
        ErrorCodes.EXTERNAL_API_ERROR,
        {
          location: "updateCustomer",
          request: {
            url: `/api/zoho/customers/${customerId}`,
            method: "PATCH",
            body: updateData,
          },
        }
      );
      logError(errorEntry);
    }

    return {
      success: false,
      error: {
        code: ErrorCodes.EXTERNAL_API_ERROR,
        message: error instanceof Error ? error.message : "顧客情報の更新に失敗しました",
      },
    };
  }
}

// =============================================================================
// 変更要求対応完了処理
// =============================================================================

/**
 * 変更要求を対応完了としてマーク（Descriptionから削除）
 */
export async function markChangeRequestCompleted(
  customerId: string
): Promise<ApiResponse<ZohoCustomer>> {
  try {
    // 現在の顧客データを取得
    const response = await fetch(`/api/zoho/customers/${customerId}`);
    if (!response.ok) {
      throw new Error("顧客データの取得に失敗しました");
    }

    const data = await response.json() as ApiResponse<ZohoCustomer>;
    if (!data.success) {
      throw new Error(data.error?.message || "顧客データの取得に失敗しました");
    }

    const customer = data.data;

    // Descriptionから変更要求を削除
    const { removeChangeRequestsFromDescription } = await import(
      "./customer-description-append"
    );
    if (!customer) {
      throw new Error("顧客情報が見つかりません");
    }
    const updatedDescription = removeChangeRequestsFromDescription(customer.Description);

    // Descriptionを更新
    return await updateCustomer(customerId, {
      Description: updatedDescription,
    });
  } catch (error) {
    const errorEntry = createErrorLogEntry(
      error,
      ErrorCodes.EXTERNAL_API_ERROR,
      {
        location: "markChangeRequestCompleted",
        request: {
          url: `/api/zoho/customers/${customerId}`,
          method: "PATCH",
        },
      }
    );
    logError(errorEntry);

    return {
      success: false,
      error: {
        code: ErrorCodes.EXTERNAL_API_ERROR,
        message: error instanceof Error ? error.message : "変更要求の対応完了処理に失敗しました",
      },
    };
  }
}

// =============================================================================
// 変更要求チェック
// =============================================================================

/**
 * 顧客に変更要求があるかチェック
 */
export async function checkChangeRequests(
  customerId: string
): Promise<ApiResponse<{ hasChangeRequests: boolean; changeRequestCount: number }>> {
  try {
    const response = await fetch(`/api/zoho/customers/${customerId}`);
    if (!response.ok) {
      throw new Error("顧客データの取得に失敗しました");
    }

    const data = await response.json() as ApiResponse<ZohoCustomer>;
    if (!data.success) {
      throw new Error(data.error?.message || "顧客データの取得に失敗しました");
    }

    const customer = data.data;
    if (!customer) {
      throw new Error("顧客情報が見つかりません");
    }
    const hasRequests = hasChangeRequests(customer.Description);

    // 変更要求の数をカウント
    const changeRequestCount = customer.Description
      ? (customer.Description.match(/【アプリ変更届】/g) || []).length
      : 0;

    return {
      success: true,
      data: {
        hasChangeRequests: hasRequests,
        changeRequestCount,
      },
    };
  } catch (error) {
    // エラーログはクライアント側でのみ記録
    if (typeof window !== "undefined") {
      const errorEntry = createErrorLogEntry(
        error,
        ErrorCodes.EXTERNAL_API_ERROR,
        {
          location: "checkChangeRequests",
          request: {
            url: `/api/zoho/customers/${customerId}`,
            method: "GET",
          },
        }
      );
      logError(errorEntry);
    }

    return {
      success: false,
      error: {
        code: ErrorCodes.EXTERNAL_API_ERROR,
        message: error instanceof Error ? error.message : "変更要求の確認に失敗しました",
      },
    };
  }
}
















