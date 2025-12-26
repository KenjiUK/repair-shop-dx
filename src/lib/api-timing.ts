/**
 * API応答時間の計測
 *
 * API呼び出しの応答時間を自動計測し、アナリティクスに記録
 */

import { trackTiming } from "./analytics";

// =============================================================================
// API応答時間計測ヘルパー
// =============================================================================

/**
 * API関数をラップして応答時間を計測
 */
export async function measureApiTiming<T>(
  apiFunction: () => Promise<T>,
  apiName: string,
  screenId?: string,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await apiFunction();
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    // 応答時間を記録
    trackTiming(
      screenId || "unknown",
      "api_response_time",
      duration,
      apiName,
      {
        ...metadata,
        apiName,
        status: "success",
      }
    );
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    // エラー時の応答時間も記録
    trackTiming(
      screenId || "unknown",
      "api_response_time",
      duration,
      apiName,
      {
        ...metadata,
        apiName,
        status: "error",
        errorMessage: error instanceof Error ? error.message : String(error),
      }
    );
    
    throw error;
  }
}

/**
 * API応答時間を計測（Promiseを返す関数用）
 */
export function withApiTiming<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  apiName: string,
  screenId?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T> extends Promise<infer U> ? U : never> => {
    return measureApiTiming(
      () => apiFunction(...args),
      apiName,
      screenId,
      { args: args.length }
    ) as ReturnType<T> extends Promise<infer U> ? U : never;
  }) as T;
}

/**
 * SWRのfetcher関数をラップしてAPI応答時間を計測
 */
export function withFetcherTiming<T>(
  fetcher: () => Promise<T>,
  apiName: string,
  screenId?: string
): () => Promise<T> {
  return async () => {
    return measureApiTiming(fetcher, apiName, screenId);
  };
}



