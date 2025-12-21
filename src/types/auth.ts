/**
 * 認証関連の型定義
 */

// =============================================================================
// ユーザーロール
// =============================================================================

/**
 * ユーザーロール
 */
export type UserRole = "admin" | "front" | "mechanic" | "customer";

/**
 * ロールの表示名
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: "管理者",
  front: "フロント",
  mechanic: "整備士",
  customer: "顧客",
};

// =============================================================================
// ユーザー情報
// =============================================================================

/**
 * ユーザー情報
 */
export interface User {
  /** ユーザーID */
  id: string;
  /** ユーザー名 */
  name: string;
  /** メールアドレス */
  email: string;
  /** ロール */
  role: UserRole;
  /** アバターURL（オプション） */
  avatarUrl?: string;
}

/**
 * セッション情報
 */
export interface Session {
  /** セッションID */
  sessionId: string;
  /** ユーザー情報 */
  user: User;
  /** セッション作成日時 */
  createdAt: string; // ISO 8601
  /** セッション有効期限 */
  expiresAt: string; // ISO 8601
}

// =============================================================================
// 認証レスポンス
// =============================================================================

/**
 * ログインリクエスト
 */
export interface LoginRequest {
  /** メールアドレス */
  email: string;
  /** パスワード */
  password: string;
}

/**
 * ログインレスポンス
 */
export interface LoginResponse {
  /** セッション情報 */
  session: Session;
  /** アクセストークン（将来のJWT対応用） */
  accessToken?: string;
  /** リフレッシュトークン（将来のJWT対応用） */
  refreshToken?: string;
}

/**
 * ログアウトリクエスト
 */
export interface LogoutRequest {
  /** セッションID */
  sessionId: string;
}
















