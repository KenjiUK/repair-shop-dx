/**
 * Next.js Middleware
 * 
 * /dashboard 以下のルートを保護
 * 未ログインの場合は /login にリダイレクト
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isDashboardPath = nextUrl.pathname.startsWith("/dashboard");

  // /dashboard 以下のパスにアクセスしようとしている場合
  if (isDashboardPath) {
    // 未ログインの場合は /login にリダイレクト
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl.origin);
      // 元のURLをクエリパラメータとして保存
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ログインページにアクセスしている場合、既にログイン済みなら /dashboard にリダイレクト
  if (nextUrl.pathname === "/login" && isLoggedIn) {
    const callbackUrl = nextUrl.searchParams.get("callbackUrl") || "/dashboard";
    return NextResponse.redirect(new URL(callbackUrl, nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * 以下のパスのみ middleware を実行
     * - /dashboard (およびそのサブパス)
     * - /login
     */
    "/dashboard/:path*",
    "/login",
  ],
};




