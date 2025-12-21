/**
 * Zoho CRM API クライアント
 *
 * Lookupフィールド検証、レート制限対策、エラーハンドリングを含む
 */

import { ApiResponse } from "@/types";
import { validateLookupField, LookupFieldType } from "./zoho-lookup-validation";
import { ErrorCodes, createErrorLogEntry, logError } from "./error-handling";

// =============================================================================
// 設定
// =============================================================================

const ZOHO_API_BASE_URL = "/api/zoho";
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1秒

// =============================================================================
// レート制限対策
// =============================================================================

/**
 * 指数バックオフでリトライ
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    const result = await fn();
    
    // Responseオブジェクトの場合はステータスをチェック
    if (result instanceof Response) {
      if (result.status === 429) {
        // レート制限超過の場合はリトライ
        if (retries > 0) {
          const retryAfter = result.headers.get("Retry-After");
          const waitTime = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : delay;

          await new Promise((resolve) => setTimeout(resolve, waitTime));
          return retryWithBackoff(fn, retries - 1, delay * 2);
        }
      }
    }
    
    return result;
  } catch (error: unknown) {
    if (retries === 0) {
      throw error;
    }

    // 429エラー（レート制限超過）の場合のみリトライ
    if (error instanceof Response && error.status === 429) {
      const retryAfter = error.headers.get("Retry-After");
      const waitTime = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : delay;

      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }

    // 500エラー（サーバーエラー）の場合もリトライ
    if (error instanceof Response && error.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }

    throw error;
  }
}

// =============================================================================
// Lookupフィールド検証付き更新
// =============================================================================

/**
 * JobのLookupフィールドを更新（検証付き）
 */
export async function updateJobLookupField(
  jobId: string,
  fieldName: "field4" | "field6",
  recordId: string
): Promise<ApiResponse<unknown>> {
  // フィールドタイプを判定
  const fieldType: LookupFieldType =
    fieldName === "field4" ? "customer" : "vehicle";

  // 参照先レコードIDを検証
  const validation = await validateLookupField(fieldType, recordId);
  if (!validation.valid) {
    const errorEntry = createErrorLogEntry(
      new Error(validation.error || "Lookupフィールドの検証に失敗しました"),
      ErrorCodes.VALIDATION_FAILED,
      {
        location: "updateJobLookupField",
        request: {
          url: `${ZOHO_API_BASE_URL}/jobs/${jobId}`,
          method: "PATCH",
          body: { [fieldName]: recordId },
        },
      }
    );
    logError(errorEntry);

    return {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_FAILED,
        message: validation.error || "参照先レコードIDの検証に失敗しました",
      },
    };
  }

  // 検証成功後、更新を実行
  try {
    const response = await retryWithBackoff(async () => {
      return await fetch(`${ZOHO_API_BASE_URL}/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [fieldName]: recordId }),
      });
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `更新に失敗しました（ステータス: ${response.status}）`
      );
    }

    const data = await response.json();
    return data as ApiResponse<unknown>;
  } catch (error) {
    const errorEntry = createErrorLogEntry(
      error,
      ErrorCodes.EXTERNAL_API_ERROR,
      {
        location: "updateJobLookupField",
        request: {
          url: `${ZOHO_API_BASE_URL}/jobs/${jobId}`,
          method: "PATCH",
          body: { [fieldName]: recordId },
        },
      }
    );
    logError(errorEntry);

    return {
      success: false,
      error: {
        code: ErrorCodes.EXTERNAL_API_ERROR,
        message: error instanceof Error ? error.message : "Zoho CRM APIの呼び出しに失敗しました",
      },
    };
  }
}

// =============================================================================
// Job更新
// =============================================================================

/**
 * Jobを更新（汎用）
 * 
 * @param jobId Job ID
 * @param updateData 更新データ（ZohoJobのフィールド）
 * @returns 更新結果
 */
export async function updateJob(
  jobId: string,
  updateData: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  try {
    const response = await retryWithBackoff(async () => {
      return await fetch(`${ZOHO_API_BASE_URL}/jobs/${jobId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `更新に失敗しました（ステータス: ${response.status}）`
      );
    }

    const data = await response.json();
    return data as ApiResponse<unknown>;
  } catch (error) {
    const errorEntry = createErrorLogEntry(
      error,
      ErrorCodes.EXTERNAL_API_ERROR,
      {
        location: "updateJob",
        request: {
          url: `${ZOHO_API_BASE_URL}/jobs/${jobId}`,
          method: "PATCH",
          body: updateData,
        },
      }
    );
    logError(errorEntry);

    return {
      success: false,
      error: {
        code: ErrorCodes.EXTERNAL_API_ERROR,
        message: error instanceof Error ? error.message : "Zoho CRM APIの呼び出しに失敗しました",
      },
    };
  }
}

// =============================================================================
// Customer更新
// =============================================================================

/**
 * 顧客情報を更新
 * 
 * ⚠️ 重要制約: マスタデータ（顧客）の追加・編集・削除は絶対にしない。
 * 許可されたフィールドのみ更新可能（LINE ID、メール同意、誕生日など）。
 * 
 * @param customerId 顧客ID（Zoho CRM Record ID）
 * @param updateData 更新データ（許可されたフィールドのみ）
 * @returns 更新結果
 */
export async function updateCustomer(
  customerId: string,
  updateData: Record<string, unknown>
): Promise<ApiResponse<unknown>> {
  try {
    // 許可されたフィールドのみ更新可能
    // 仕様書によると、LINE ID、メール同意、誕生日などのフィールドのみ更新可能
    // マスタデータ（顧客ID、氏名、住所、電話番号など）は更新不可
    
    const response = await retryWithBackoff(async () => {
      return await fetch(`${ZOHO_API_BASE_URL}/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `更新に失敗しました（ステータス: ${response.status}）`
      );
    }

    const data = await response.json();
    return data as ApiResponse<unknown>;
  } catch (error) {
    const errorEntry = createErrorLogEntry(
      error,
      ErrorCodes.EXTERNAL_API_ERROR,
      {
        location: "updateCustomer",
        request: {
          url: `${ZOHO_API_BASE_URL}/customers/${customerId}`,
          method: "PATCH",
          body: updateData,
        },
      }
    );
    logError(errorEntry);

    return {
      success: false,
      error: {
        code: ErrorCodes.EXTERNAL_API_ERROR,
        message: error instanceof Error ? error.message : "Zoho CRM APIの呼び出しに失敗しました",
      },
    };
  }
}

// =============================================================================
// エラーハンドリング
// =============================================================================

/**
 * Zoho APIエラーを処理
 */
export function handleZohoApiError(
  error: unknown,
  context: {
    operation: string;
    url?: string;
    method?: string;
    body?: unknown;
  }
): ApiResponse<never> {
  let errorCode: string = ErrorCodes.UNKNOWN_ERROR;
  let errorMessage: string = "予期しないエラーが発生しました";

  if (error instanceof Response) {
    const status = error.status;

    if (status === 400) {
      errorCode = ErrorCodes.INVALID_PARAM;
      errorMessage = "不正なリクエストです";
    } else if (status === 404) {
      errorCode = ErrorCodes.NOT_FOUND;
      errorMessage = "リソースが見つかりませんでした";
    } else if (status === 429) {
      errorCode = ErrorCodes.RATE_LIMIT_EXCEEDED;
      errorMessage = "リクエストが多すぎます。しばらく待ってから再試行してください";
    } else if (status >= 500) {
      errorCode = ErrorCodes.EXTERNAL_API_ERROR;
      errorMessage = "Zoho CRMサーバーでエラーが発生しました";
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const errorEntry = createErrorLogEntry(
    error,
    errorCode as typeof ErrorCodes[keyof typeof ErrorCodes],
    {
      location: context.operation,
      request: {
        url: context.url,
        method: context.method,
        body: context.body,
      },
    }
  );
  logError(errorEntry);

  return {
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
  };
}











