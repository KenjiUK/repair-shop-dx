/**
 * ロールベースアクセス制御（RBAC）
 *
 * ユーザーロールに基づいたアクセス制御
 */

import { User, UserRole } from "@/types/auth";

// =============================================================================
// 権限定義
// =============================================================================

/**
 * アクション（操作）の種類
 */
export type Action =
  | "view_jobs"
  | "create_job"
  | "update_job"
  | "delete_job"
  | "view_diagnosis"
  | "create_diagnosis"
  | "update_diagnosis"
  | "view_estimate"
  | "create_estimate"
  | "update_estimate"
  | "approve_estimate"
  | "view_work"
  | "create_work"
  | "update_work"
  | "view_customers"
  | "update_customers"
  | "view_vehicles"
  | "update_vehicles"
  | "view_reports"
  | "manage_settings"
  | "manage_users";

/**
 * リソース（対象）の種類
 */
export type Resource =
  | "jobs"
  | "diagnosis"
  | "estimates"
  | "work"
  | "customers"
  | "vehicles"
  | "reports"
  | "settings"
  | "users";

/**
 * ロールごとの権限マトリックス
 */
const PERMISSIONS: Record<UserRole, Action[]> = {
  admin: [
    // 管理者: すべての権限
    "view_jobs",
    "create_job",
    "update_job",
    "delete_job",
    "view_diagnosis",
    "create_diagnosis",
    "update_diagnosis",
    "view_estimate",
    "create_estimate",
    "update_estimate",
    "approve_estimate",
    "view_work",
    "create_work",
    "update_work",
    "view_customers",
    "update_customers",
    "view_vehicles",
    "update_vehicles",
    "view_reports",
    "manage_settings",
    "manage_users",
  ],
  front: [
    // フロント: 受付・見積・顧客管理
    "view_jobs",
    "create_job",
    "update_job",
    "view_diagnosis",
    "view_estimate",
    "create_estimate",
    "update_estimate",
    "view_work",
    "view_customers",
    "update_customers",
    "view_vehicles",
    "view_reports",
  ],
  mechanic: [
    // 整備士: 診断・作業
    "view_jobs",
    "view_diagnosis",
    "create_diagnosis",
    "update_diagnosis",
    "view_estimate",
    "view_work",
    "create_work",
    "update_work",
    "view_customers",
    "view_vehicles",
  ],
  customer: [
    // 顧客: 自分の情報のみ閲覧・承認
    "view_jobs", // 自分のJobのみ
    "view_diagnosis", // 自分のJobの診断のみ
    "view_estimate", // 自分のJobの見積のみ
    "approve_estimate", // 自分のJobの見積承認
    "view_work", // 自分のJobの作業のみ
  ],
};

// =============================================================================
// 権限チェック
// =============================================================================

/**
 * ユーザーが指定されたアクションを実行できるかチェック
 */
export function canPerformAction(user: User | null, action: Action): boolean {
  if (!user) return false;

  const userPermissions = PERMISSIONS[user.role] || [];
  return userPermissions.includes(action);
}

/**
 * ユーザーが指定されたリソースにアクセスできるかチェック
 */
export function canAccessResource(user: User | null, resource: Resource, action?: Action): boolean {
  if (!user) return false;

  // リソースとアクションのマッピング
  const resourceActionMap: Record<Resource, Action[]> = {
    jobs: ["view_jobs", "create_job", "update_job", "delete_job"],
    diagnosis: ["view_diagnosis", "create_diagnosis", "update_diagnosis"],
    estimates: ["view_estimate", "create_estimate", "update_estimate", "approve_estimate"],
    work: ["view_work", "create_work", "update_work"],
    customers: ["view_customers", "update_customers"],
    vehicles: ["view_vehicles", "update_vehicles"],
    reports: ["view_reports"],
    settings: ["manage_settings"],
    users: ["manage_users"],
  };

  const allowedActions = resourceActionMap[resource] || [];

  if (action) {
    // 特定のアクションをチェック
    return canPerformAction(user, action);
  }

  // リソースへのアクセス権限があるかチェック（いずれかのアクションが許可されている）
  return allowedActions.some((a) => canPerformAction(user, a));
}

/**
 * 複数のアクションのいずれかを実行できるかチェック
 */
export function canPerformAnyAction(user: User | null, actions: Action[]): boolean {
  return actions.some((action) => canPerformAction(user, action));
}

/**
 * すべてのアクションを実行できるかチェック
 */
export function canPerformAllActions(user: User | null, actions: Action[]): boolean {
  return actions.every((action) => canPerformAction(user, action));
}

// =============================================================================
// ページ/ルート保護
// =============================================================================

/**
 * ページアクセス制御の設定
 */
export interface RouteGuard {
  /** 許可されたロール */
  allowedRoles: UserRole[];
  /** リダイレクト先（未許可時） */
  redirectTo?: string;
}

/**
 * ルートごとのアクセス制御設定
 */
export const ROUTE_GUARDS: Record<string, RouteGuard> = {
  "/": { allowedRoles: ["admin", "front", "mechanic"] },
  "/mechanic": { allowedRoles: ["admin", "mechanic"], redirectTo: "/" },
  "/admin": { allowedRoles: ["admin", "front"], redirectTo: "/" },
  "/customer": { allowedRoles: ["customer"], redirectTo: "/" },
};

/**
 * ユーザーが指定されたルートにアクセスできるかチェック
 */
export function canAccessRoute(user: User | null, route: string): boolean {
  if (!user) return false;

  // ルートガードを検索（完全一致または前方一致）
  const guard = ROUTE_GUARDS[route] || Object.entries(ROUTE_GUARDS).find(([path]) =>
    route.startsWith(path)
  )?.[1];

  if (!guard) {
    // ガードが定義されていない場合は許可
    return true;
  }

  return guard.allowedRoles.includes(user.role);
}
















