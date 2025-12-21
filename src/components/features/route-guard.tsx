"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { canAccessRoute, ROUTE_GUARDS } from "@/lib/rbac";
import { ErrorMessage } from "./error-message";
import { ErrorCategory } from "@/lib/error-handling";

// =============================================================================
// Props
// =============================================================================

interface RouteGuardProps {
  /** 子要素 */
  children: React.ReactNode;
  /** 許可されたロール（オプション、指定がない場合はROUTE_GUARDSを使用） */
  allowedRoles?: string[];
  /** リダイレクト先（未許可時） */
  redirectTo?: string;
}

// =============================================================================
// Component
// =============================================================================

export function RouteGuard({
  children,
  allowedRoles,
  redirectTo,
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // 認証されていない場合はログインページへリダイレクト
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    // カスタムロール指定がある場合はそれを使用、なければROUTE_GUARDSを使用
    const guard = allowedRoles
      ? { allowedRoles: allowedRoles as any, redirectTo }
      : ROUTE_GUARDS[pathname] || Object.entries(ROUTE_GUARDS).find(([path]) =>
          pathname.startsWith(path)
        )?.[1];

    if (guard) {
      const hasAccess = guard.allowedRoles.includes(user.role);
      if (!hasAccess) {
        // アクセス権限がない場合はリダイレクトまたはエラー表示
        if (guard.redirectTo) {
          router.push(guard.redirectTo);
        } else {
          // リダイレクト先が指定されていない場合はエラー表示
          // （この場合はchildrenを表示せず、エラーメッセージを表示）
        }
      }
    }
  }, [isLoading, isAuthenticated, user, pathname, router, allowedRoles, redirectTo]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証されていない
  if (!isAuthenticated || !user) {
    return null; // リダイレクト処理中
  }

  // アクセス権限チェック
  const hasAccess = allowedRoles
    ? allowedRoles.includes(user.role)
    : canAccessRoute(user, pathname);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            code="FORBIDDEN"
            message="このページにアクセスする権限がありません"
            category={ErrorCategory.AUTH_ERROR}
            size="lg"
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
















