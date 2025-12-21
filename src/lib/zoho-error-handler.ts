/**
 * Zoho CRM API エラーハンドリング
 *
 * リトライ戦略、フィールド不存在時のフォールバック
 */

import { ApiResponse } from "@/types";
import { ErrorCodes, createErrorLogEntry, logError } from "./error-handling";
import { getOrCreateRootFolder, getOrCreateFolder, uploadFile } from "./google-drive";

// =============================================================================
// リトライ設定
// =============================================================================

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1秒

// =============================================================================
// リトライ戦略
// =============================================================================

/**
 * 指数バックオフでリトライ
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (retries === 0) {
      throw error;
    }

    // リトライ可能なエラーの場合のみリトライ
    if (shouldRetry(error)) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithExponentialBackoff(fn, retries - 1, delay * 2);
    }

    throw error;
  }
}

/**
 * リトライすべきエラーかどうかを判定
 */
function shouldRetry(error: unknown): boolean {
  if (error instanceof Response) {
    const status = error.status;
    // 429（レート制限）、500系（サーバーエラー）、503（サービス利用不可）はリトライ
    return status === 429 || status >= 500 || status === 503;
  }

  // ネットワークエラーもリトライ
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  return false;
}

// =============================================================================
// エラーハンドリング
// =============================================================================

/**
 * Zoho APIエラーを処理（リトライ付き）
 */
export async function handleZohoApiErrorWithRetry<T>(
  operation: () => Promise<Response>,
  context: {
    operation: string;
    url?: string;
    method?: string;
    body?: unknown;
  }
): Promise<ApiResponse<T>> {
  try {
    const response = await retryWithExponentialBackoff(operation);

    if (!response.ok) {
      return handleErrorResponse(response, context);
    }

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return handleError(error, context);
  }
}

/**
 * エラーレスポンスを処理
 */
function handleErrorResponse(
  response: Response,
  context: {
    operation: string;
    url?: string;
    method?: string;
    body?: unknown;
  }
): ApiResponse<never> {
  const status = response.status;
  let errorCode: string = ErrorCodes.UNKNOWN_ERROR;
  let errorMessage: string = "予期しないエラーが発生しました";

  if (status === 400) {
    errorCode = ErrorCodes.INVALID_PARAM;
    errorMessage = "不正なリクエストです。入力内容を確認してください";
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

  const errorEntry = createErrorLogEntry(
    new Error(`HTTP ${status}: ${errorMessage}`),
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

/**
 * エラーを処理
 */
function handleError(
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

  if (error instanceof Error) {
    errorMessage = error.message;
    
    // ネットワークエラーの場合
    if (error.message.includes("fetch") || error.message.includes("network")) {
      errorCode = ErrorCodes.NETWORK_ERROR;
      errorMessage = "ネットワークエラーが発生しました。接続を確認してください";
    }
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

// =============================================================================
// フィールド不存在時のフォールバック
// =============================================================================

/**
 * フィールド不存在時のフォールバック処理
 */
export async function handleFieldNotFound<T>(
  fieldName: string,
  fallbackOperation: () => Promise<ApiResponse<T>>,
  context: {
    operation: string;
    url?: string;
    method?: string;
  }
): Promise<ApiResponse<T>> {
  try {
    // フォールバック操作を実行
    const result = await fallbackOperation();
    
    // フォールバック成功をログに記録
    const logEntry = createErrorLogEntry(
      new Error(`フィールド ${fieldName} が存在しないため、フォールバック処理を実行しました`),
      ErrorCodes.DATA_NOT_FOUND,
      {
        location: context.operation,
        request: {
          url: context.url,
          method: context.method,
        },
      }
    );
    logError(logEntry);

    return result;
  } catch (error) {
    return handleError(error, context);
  }
}

/**
 * Google Drive JSON管理方式へのフォールバック
 */
export async function fallbackToGoogleDrive<T>(
  resourceType: string,
  resourceId: string,
  data: Record<string, unknown>,
  context: {
    operation: string;
  }
): Promise<ApiResponse<T>> {
  try {
    // Google Driveのルートフォルダを取得または作成
    const rootFolder = await getOrCreateRootFolder();

    // error-logsフォルダを取得または作成
    const errorLogsFolder = await getOrCreateFolder({
      folderName: "error-logs",
      parentFolderId: rootFolder.id,
      returnExisting: true,
    });

    // タイムスタンプを生成（YYYYMMDD-HHMMSS形式）
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("T", "-").slice(0, 15);

    // ファイル名を生成（{resourceType}-{resourceId}-{timestamp}.json）
    const fileName = `${resourceType}-${resourceId}-${timestamp}.json`;

    // JSON文字列をBlobに変換
    const jsonString = JSON.stringify(data, null, 2);
    const jsonBlob = new Blob([jsonString], { type: "application/json" });

    // JSONファイルをGoogle Driveにアップロード
    const uploadedFile = await uploadFile({
      fileName,
      fileData: jsonBlob,
      mimeType: "application/json",
      parentFolderId: errorLogsFolder.id,
      replaceExisting: false, // タイムスタンプ付きなので重複しない
      metadata: {
        resourceType,
        resourceId,
        operation: context.operation,
        timestamp: now.toISOString(),
      },
    });

    // エラーログを記録
    await logError({
      code: ErrorCodes.FALLBACK_TO_DRIVE,
      message: `Zoho CRM APIへの保存に失敗したため、Google Driveにフォールバックしました: ${uploadedFile.id}`,
      context: {
        ...context,
        fallbackFileId: uploadedFile.id,
        fallbackFileName: fileName,
      },
    });

    return {
      success: true,
      data: {
        fileId: uploadedFile.id,
        fileName: uploadedFile.name,
        folderId: errorLogsFolder.id,
      } as T,
    };
  } catch (error) {
    // エラーログ保存自体が失敗した場合もエラーを記録
    console.error("Google Driveへのフォールバック保存に失敗しました:", error);
    await logError({
      code: ErrorCodes.FALLBACK_TO_DRIVE,
      message: `Google Driveへのフォールバック保存に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      context: {
        ...context,
        originalError: error instanceof Error ? error.message : String(error),
      },
    });

    return handleError(error, context);
  }
}











