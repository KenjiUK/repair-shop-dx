/**
 * API応答時間計測
 *
 * Fetch APIのラッパーでAPI応答時間を自動計測
 */

import { trackTiming } from "./analytics";

// =============================================================================
// Fetch APIラッパー
// =============================================================================

/**
 * API応答時間を計測するFetch APIラッパー
 */
export async function fetchWithTiming(
  url: string,
  options: RequestInit = {},
  screenId?: string
): Promise<Response> {
  const startTime = performance.now();
  const method = options.method || "GET";

  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // アナリティクスに記録
    if (screenId) {
      trackTiming(
        screenId,
        "api_response",
        duration,
        url,
        {
          method,
          status: response.status,
          statusText: response.statusText,
        }
      );
    }

    return response;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // エラー時も計測
    if (screenId) {
      trackTiming(
        screenId,
        "api_response_error",
        duration,
        url,
        {
          method,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }

    throw error;
  }
}

// =============================================================================
// グローバルFetch APIの拡張（オプション）
// =============================================================================

/**
 * グローバルFetch APIを拡張して自動計測
 * 
 * 注意: この機能はオプションです。使用する場合は初期化時に呼び出してください。
 */
let originalFetch: typeof fetch | null = null;
let isFetchExtended = false;

/**
 * Fetch APIを拡張して自動計測を有効化
 */
export function enableAutoTiming(screenId: string): void {
  if (isFetchExtended) return;

  originalFetch = window.fetch;
  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return fetchWithTiming(url, init, screenId);
  };

  isFetchExtended = true;
}

/**
 * Fetch APIの拡張を無効化
 */
export function disableAutoTiming(): void {
  if (!isFetchExtended || !originalFetch) return;

  window.fetch = originalFetch;
  isFetchExtended = false;
}
















