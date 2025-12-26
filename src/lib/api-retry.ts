/**
 * APIレート制限対策
 *
 * 429エラー時の自動リトライ（指数バックオフ）
 */

import { ApiResponse } from "@/types";

// =============================================================================
// 設定
// =============================================================================

/** 最大リトライ回数 */
const MAX_RETRIES = 3;

/** 初期リトライ遅延時間（ms） */
const INITIAL_RETRY_DELAY = 1000;

/** 最大リトライ遅延時間（ms） */
const MAX_RETRY_DELAY = 10000;

// =============================================================================
// 指数バックオフ計算
// =============================================================================

/**
 * 指数バックオフの遅延時間を計算
 */
function calculateBackoffDelay(retryCount: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * 指定時間待機
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// API呼び出しラッパー（リトライ機能付き）
// =============================================================================

/**
 * API呼び出しをラップして429エラー時に自動リトライ
 */
export async function withRetry<T>(
  apiFunction: () => Promise<ApiResponse<T>>,
  options?: {
    maxRetries?: number;
    onRetry?: (retryCount: number, delay: number) => void;
  }
): Promise<ApiResponse<T>> {
  const maxRetries = options?.maxRetries ?? MAX_RETRIES;
  let lastError: ApiResponse<T> | null = null;

  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    try {
      const result = await apiFunction();

      // 429エラー（レート制限超過）の場合のみリトライ
      if (!result.success && result.error?.code === "RATE_LIMIT_EXCEEDED") {
        if (retryCount < maxRetries) {
          const delay = calculateBackoffDelay(retryCount);
          
          // リトライ前のコールバック
          if (options?.onRetry) {
            options.onRetry(retryCount + 1, delay);
          }

          console.warn(
            `[API Retry] レート制限超過。${delay}ms後にリトライします（${retryCount + 1}/${maxRetries}）`
          );

          await sleep(delay);
          lastError = result;
          continue;
        }
      }

      // 429エラー以外、またはリトライ上限に達した場合は結果を返す
      return result;
    } catch (error) {
      // 予期しないエラーの場合
      if (retryCount < maxRetries) {
        const delay = calculateBackoffDelay(retryCount);
        
        if (options?.onRetry) {
          options.onRetry(retryCount + 1, delay);
        }

        console.warn(
          `[API Retry] エラー発生。${delay}ms後にリトライします（${retryCount + 1}/${maxRetries}）`,
          error
        );

        await sleep(delay);
        continue;
      }

      // リトライ上限に達した場合はエラーを返す
      return {
        success: false,
        error: {
          code: "RETRY_EXHAUSTED",
          message: error instanceof Error ? error.message : "API呼び出しに失敗しました",
        },
      };
    }
  }

  // すべてのリトライが失敗した場合
  return (
    lastError || {
      success: false,
      error: {
        code: "RETRY_EXHAUSTED",
        message: "リトライ上限に達しました",
      },
    }
  );
}

/**
 * 429エラーかどうかを判定
 */
export function isRateLimitError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const apiError = error as { code?: string; status?: number };
    return (
      apiError.code === "RATE_LIMIT_EXCEEDED" ||
      apiError.status === 429
    );
  }
  return false;
}



