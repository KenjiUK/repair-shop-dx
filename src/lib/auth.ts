/**
 * 認証管理システム
 *
 * セッションベース認証と将来のJWT対応準備
 */

import { User, Session, LoginRequest, LoginResponse, UserRole } from "@/types/auth";
import { saveToLocalStorage, getFromLocalStorage, removeFromLocalStorage } from "./offline-storage";

// =============================================================================
// セッション管理（クライアント側）
// =============================================================================

const SESSION_STORAGE_KEY = "auth_session";
const USER_STORAGE_KEY = "auth_user";

/**
 * セッションを保存
 */
export function saveSession(session: Session): void {
  saveToLocalStorage(SESSION_STORAGE_KEY, session);
  saveToLocalStorage(USER_STORAGE_KEY, session.user);
}

/**
 * セッションを取得
 */
export function getSession(): Session | null {
  return getFromLocalStorage<Session>(SESSION_STORAGE_KEY);
}

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser(): User | null {
  return getFromLocalStorage<User>(USER_STORAGE_KEY);
}

/**
 * セッションを削除（ログアウト）
 */
export function clearSession(): void {
  removeFromLocalStorage(SESSION_STORAGE_KEY);
  removeFromLocalStorage(USER_STORAGE_KEY);
}

/**
 * セッションが有効かチェック
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;

  const now = new Date();
  const expiresAt = new Date(session.expiresAt);

  return now < expiresAt;
}

// =============================================================================
// ロールチェック
// =============================================================================

/**
 * ユーザーが指定されたロールを持っているかチェック
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * ユーザーが指定されたロールのいずれかを持っているかチェック
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * 管理者権限を持っているかチェック
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, "admin");
}

/**
 * フロントスタッフ権限を持っているかチェック
 */
export function isFront(user: User | null): boolean {
  return hasRole(user, "front");
}

/**
 * 整備士権限を持っているかチェック
 */
export function isMechanic(user: User | null): boolean {
  return hasRole(user, "mechanic");
}

/**
 * 顧客権限を持っているかチェック
 */
export function isCustomer(user: User | null): boolean {
  return hasRole(user, "customer");
}

// =============================================================================
// 認証API（将来の実装用）
// =============================================================================

/**
 * ログイン（将来の実装）
 * 
 * 現時点ではモック実装
 * 実際の実装では、サーバー側の認証APIを呼び出す
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  // TODO: 実際の認証APIを呼び出す
  // const response = await fetch("/api/auth/login", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(credentials),
  // });
  // return response.json();

  // モック実装
  const mockUser: User = {
    id: "user-001",
    name: "テストユーザー",
    email: credentials.email,
    role: "admin", // デフォルトは管理者
  };

  const session: Session = {
    sessionId: `session-${Date.now()}`,
    user: mockUser,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
  };

  saveSession(session);

  return {
    session,
  };
}

/**
 * ログアウト（将来の実装）
 */
export async function logout(sessionId: string): Promise<void> {
  // TODO: サーバー側のセッションを無効化
  // await fetch("/api/auth/logout", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ sessionId }),
  // });

  clearSession();
}

/**
 * セッションを更新（将来のJWT対応用）
 */
export async function refreshSession(sessionId: string): Promise<Session | null> {
  // TODO: サーバー側でセッションを更新
  // const response = await fetch("/api/auth/refresh", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ sessionId }),
  // });
  // const data = await response.json();
  // if (data.session) {
  //   saveSession(data.session);
  //   return data.session;
  // }
  // return null;

  // モック実装: 現在のセッションを返す
  const currentSession = getSession();
  if (currentSession && isSessionValid(currentSession)) {
    return currentSession;
  }
  return null;
}

// =============================================================================
// 整備士名の取得（将来の認証システム対応）
// =============================================================================

/**
 * 現在の整備士名を取得
 * 
 * 現時点: localStorageから取得
 * 将来: 認証システムから取得（切り替え可能）
 * 
 * @returns 整備士名（取得できない場合はnull）
 */
export function getCurrentMechanicName(): string | null {
  // 将来の実装: 認証システムから取得
  // const user = getCurrentUser();
  // if (user && isMechanic(user)) {
  //   return user.name;
  // }
  // return null;

  // 現時点: localStorageから取得
  if (typeof window === "undefined") {
    return null;
  }
  
  try {
    const savedMechanic = localStorage.getItem("currentMechanic");
    return savedMechanic || null;
  } catch (error) {
    console.error("[Auth] 整備士名取得エラー:", error);
    return null;
  }
}











