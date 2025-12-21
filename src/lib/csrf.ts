/**
 * CSRF（Cross-Site Request Forgery）対策
 *
 * CSRFトークンの生成と検証
 */

// =============================================================================
// CSRFトークン管理（クライアント側）
// =============================================================================

const CSRF_TOKEN_STORAGE_KEY = "csrf_token";

/**
 * CSRFトークンを生成
 */
export function generateCSRFToken(): string {
  // ランダムな32文字のトークンを生成
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * CSRFトークンを保存
 */
export function saveCSRFToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CSRF_TOKEN_STORAGE_KEY, token);
}

/**
 * CSRFトークンを取得
 */
export function getCSRFToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CSRF_TOKEN_STORAGE_KEY);
}

/**
 * CSRFトークンを削除
 */
export function clearCSRFToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
}

/**
 * CSRFトークンを初期化（取得または生成）
 */
export function initializeCSRFToken(): string {
  let token = getCSRFToken();
  if (!token) {
    token = generateCSRFToken();
    saveCSRFToken(token);
  }
  return token;
}

// =============================================================================
// リクエストヘッダーへの追加
// =============================================================================

/**
 * Fetch APIのリクエストにCSRFトークンを追加
 */
export function addCSRFTokenToHeaders(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFToken() || initializeCSRFToken();

  const headersObj = headers instanceof Headers
    ? Object.fromEntries(headers.entries())
    : Array.isArray(headers)
    ? Object.fromEntries(headers)
    : headers;

  return {
    ...headersObj,
    "X-CSRF-Token": token,
  };
}

/**
 * Fetch APIのラッパー（CSRFトークンを自動追加）
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getCSRFToken() || initializeCSRFToken();

  const headers = new Headers(options.headers);
  headers.set("X-CSRF-Token", token);

  return fetch(url, {
    ...options,
    headers,
  });
}
















