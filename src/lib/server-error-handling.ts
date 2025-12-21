/**
 * サーバー側エラーハンドリング
 *
 * Next.js API Routesでのエラーハンドリングとログ記録
 */

import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import {
  ErrorCode,
  ErrorCodes,
  getUserFriendlyMessage,
  createErrorLogEntry,
} from "@/lib/error-handling";

// =============================================================================
// エラーレスポンス生成
// =============================================================================

/**
 * エラーレスポンスを生成
 */
export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  status: number = 500
): NextResponse<ApiResponse<never>> {
  const errorMessage = message || getUserFriendlyMessage(code);

  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message: errorMessage,
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * バリデーションエラーレスポンスを生成
 */
export function createValidationErrorResponse(
  message: string = "入力内容を確認してください"
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(ErrorCodes.VALIDATION_FAILED, message, 422);
}

/**
 * 見つからないエラーレスポンスを生成
 */
export function createNotFoundErrorResponse(
  resource: string = "データ"
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(
    ErrorCodes.NOT_FOUND,
    `${resource}が見つかりませんでした`,
    404
  );
}

/**
 * 認証エラーレスポンスを生成
 */
export function createUnauthorizedErrorResponse(
  message: string = "認証が必要です"
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(ErrorCodes.UNAUTHORIZED, message, 401);
}

/**
 * 権限エラーレスポンスを生成
 */
export function createForbiddenErrorResponse(
  message: string = "アクセス権限がありません"
): NextResponse<ApiResponse<never>> {
  return createErrorResponse(ErrorCodes.FORBIDDEN, message, 403);
}

/**
 * 外部APIエラーレスポンスを生成
 */
export function createExternalApiErrorResponse(
  service: string,
  message?: string
): NextResponse<ApiResponse<never>> {
  const errorMessage = message || `${service}でエラーが発生しました`;
  const code = service === "Zoho CRM" ? ErrorCodes.ZOHO_API_ERROR : ErrorCodes.GOOGLE_API_ERROR;
  return createErrorResponse(code, errorMessage, 502);
}

// =============================================================================
// エラーハンドリングラッパー
// =============================================================================

/**
 * API Routeハンドラーをエラーハンドリングでラップ
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("[API Error]", error);

      // エラーログを作成
      const errorLog = createErrorLogEntry(
        error,
        ErrorCodes.INTERNAL_ERROR,
        {
          location: handler.name,
        }
      );

      // エラーログを記録（サーバー側ではコンソールに出力）
      // 本番環境では外部ログサービスに送信することを推奨
      console.error("[Error Log]", JSON.stringify(errorLog, null, 2));

      // ユーザー向けエラーレスポンスを返す
      return createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "サーバーでエラーが発生しました"
      );
    }
  };
}

// =============================================================================
// エラーログ記録（サーバー側）
// =============================================================================

/**
 * サーバー側でエラーログを記録
 * 
 * 本番環境では外部ログサービス（例: Sentry, LogRocket等）に送信することを推奨
 */
export function logServerError(
  error: Error | unknown,
  code: ErrorCode,
  context?: {
    location?: string;
    request?: {
      url?: string;
      method?: string;
      body?: unknown;
    };
    user?: {
      id?: string;
      role?: string;
    };
  }
): void {
  const errorLog = createErrorLogEntry(error, code, context);

  // 開発環境ではコンソールに出力
  if (process.env.NODE_ENV === "development") {
    console.error("[Server Error Log]", JSON.stringify(errorLog, null, 2));
  }

  // 本番環境では外部ログサービスに送信
  // 例: Sentry.captureException(error, { extra: errorLog });
  // 例: LogRocket.captureException(error, { extra: errorLog });
}
















