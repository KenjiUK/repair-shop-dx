import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";

/**
 * CSRFトークン取得API
 *
 * GET /api/auth/csrf-token
 * クライアント側でCSRFトークンを取得するためのエンドポイント
 */

function errorResponse(
  message: string,
  code: string,
  status: number = 500
): NextResponse {
  const response: ApiResponse<never> = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(response, { status });
}

/**
 * GET /api/auth/csrf-token
 * CSRFトークンを生成して返す
 */
export async function GET(request: NextRequest) {
  try {
    // セッションから既存のトークンを取得（将来の実装）
    // 現時点では新しいトークンを生成
    const token = generateCSRFToken();

    // セッションに保存（将来の実装）
    // 現時点ではレスポンスヘッダーに含める
    const response = NextResponse.json({
      success: true,
      data: { token },
    } as ApiResponse<{ token: string }>);

    // セキュアなCookieに保存（将来の実装）
    // response.cookies.set("csrf_token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "strict",
    //   maxAge: 60 * 60 * 24, // 24時間
    // });

    return response;
  } catch (error) {
    console.error("[API] CSRFトークン生成エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "CSRFトークンの生成に失敗しました",
      "CSRF_TOKEN_ERROR",
      500
    );
  }
}

/**
 * CSRFトークンを生成
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
























