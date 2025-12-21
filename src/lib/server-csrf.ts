/**
 * サーバー側CSRF検証
 *
 * Next.js API RoutesでのCSRFトークン検証
 */

import { NextRequest } from "next/server";
import { ErrorCodes } from "./error-handling";

/**
 * CSRFトークンを検証
 */
export function validateCSRFToken(
  request: NextRequest,
  expectedToken?: string
): { valid: boolean; error?: string } {
  // リクエストヘッダーからCSRFトークンを取得
  const requestToken = request.headers.get("X-CSRF-Token");

  if (!requestToken) {
    return {
      valid: false,
      error: "CSRFトークンが含まれていません",
    };
  }

  // セッションから期待されるトークンを取得（将来の実装）
  // 現時点では、expectedTokenが提供されている場合はそれと比較
  if (expectedToken && requestToken !== expectedToken) {
    return {
      valid: false,
      error: "CSRFトークンが一致しません",
    };
  }

  // トークンの形式を検証（32文字の16進数）
  if (!/^[0-9a-f]{32}$/i.test(requestToken)) {
    return {
      valid: false,
      error: "CSRFトークンの形式が不正です",
    };
  }

  return { valid: true };
}

/**
 * CSRFトークン検証ミドルウェア
 * 
 * API Routeハンドラーで使用
 */
export function withCSRFProtection<T extends unknown[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  options?: {
    /** 期待されるトークン（オプション） */
    expectedToken?: string;
    /** 検証をスキップする条件 */
    skipValidation?: (request: NextRequest) => boolean;
  }
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    // スキップ条件をチェック
    if (options?.skipValidation?.(request)) {
      return handler(request, ...args);
    }

    // GETリクエストは通常CSRF保護不要（ただし、状態変更を行うGETは保護が必要）
    if (request.method === "GET") {
      return handler(request, ...args);
    }

    // CSRFトークンを検証
    const validation = validateCSRFToken(request, options?.expectedToken);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: ErrorCodes.FORBIDDEN,
            message: validation.error || "CSRFトークンの検証に失敗しました",
          },
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return handler(request, ...args) as ReturnType<typeof handler>;
  };
}
















