/**
 * 統一エラーハンドリングシステム
 *
 * エラーコード定義、エラーハンドリングユーティリティ、
 * エラーログ機能を提供
 */

import { ApiResponse } from "@/types";

// =============================================================================
// エラーコード定義
// =============================================================================

/**
 * エラーコードカテゴリ
 */
export enum ErrorCategory {
  /** クライアントエラー（400系） */
  CLIENT_ERROR = "CLIENT_ERROR",
  /** サーバーエラー（500系） */
  SERVER_ERROR = "SERVER_ERROR",
  /** ネットワークエラー */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** 認証・認可エラー */
  AUTH_ERROR = "AUTH_ERROR",
  /** バリデーションエラー */
  VALIDATION_ERROR = "VALIDATION_ERROR",
  /** 外部APIエラー（Zoho CRM、Google API等） */
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  /** データ不整合エラー */
  DATA_ERROR = "DATA_ERROR",
  /** 不明なエラー */
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * エラーコード定義
 */
export const ErrorCodes = {
  // クライアントエラー（400系）
  MISSING_PARAM: "MISSING_PARAM",
  INVALID_PARAM: "INVALID_PARAM",
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  VALIDATION_FAILED: "VALIDATION_FAILED",

  // サーバーエラー（500系）
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",

  // ネットワークエラー
  NETWORK_ERROR: "NETWORK_ERROR",
  CONNECTION_ERROR: "CONNECTION_ERROR",
  REQUEST_FAILED: "REQUEST_FAILED",

  // 認証・認可エラー
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // 外部APIエラー
  ZOHO_API_ERROR: "ZOHO_API_ERROR",
  GOOGLE_API_ERROR: "GOOGLE_API_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // データエラー
  DATA_NOT_FOUND: "DATA_NOT_FOUND",
  DATA_CONFLICT: "DATA_CONFLICT",
  DATA_INVALID: "DATA_INVALID",

  // フォールバック
  FALLBACK_TO_DRIVE: "FALLBACK_TO_DRIVE",

  // 不明なエラー
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// =============================================================================
// エラーメッセージ定義（ユーザー向け）
// =============================================================================

/**
 * エラーコードに対応するユーザー向けメッセージ
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // クライアントエラー
  MISSING_PARAM: "必要な情報が不足しています",
  INVALID_PARAM: "入力内容に誤りがあります",
  NOT_FOUND: "データが見つかりませんでした",
  ALREADY_EXISTS: "既に存在するデータです",
  VALIDATION_FAILED: "入力内容を確認してください",

  // サーバーエラー
  INTERNAL_ERROR: "サーバーでエラーが発生しました",
  DATABASE_ERROR: "データベースでエラーが発生しました",
  EXTERNAL_API_ERROR: "外部サービスでエラーが発生しました",
  TIMEOUT_ERROR: "タイムアウトが発生しました",

  // ネットワークエラー
  NETWORK_ERROR: "ネットワークエラーが発生しました",
  CONNECTION_ERROR: "接続に失敗しました",
  REQUEST_FAILED: "リクエストに失敗しました",

  // 認証・認可エラー
  UNAUTHORIZED: "認証が必要です",
  FORBIDDEN: "アクセス権限がありません",
  SESSION_EXPIRED: "セッションが期限切れです",

  // 外部APIエラー
  ZOHO_API_ERROR: "Zoho CRMでエラーが発生しました",
  GOOGLE_API_ERROR: "Google APIでエラーが発生しました",
  RATE_LIMIT_EXCEEDED: "リクエストが多すぎます。しばらく待ってから再試行してください",

  // データエラー
  DATA_NOT_FOUND: "データが見つかりませんでした",
  DATA_CONFLICT: "データの競合が発生しました",
  DATA_INVALID: "データが無効です",

  // フォールバック
  FALLBACK_TO_DRIVE: "フォールバック処理が実行されました",

  // 不明なエラー
  UNKNOWN_ERROR: "予期しないエラーが発生しました",
};

// =============================================================================
// エラーログ型定義
// =============================================================================

/**
 * エラーログエントリ
 */
export interface ErrorLogEntry {
  /** エラーID（UUID） */
  id: string;
  /** エラーコード */
  code: ErrorCode;
  /** エラーメッセージ */
  message: string;
  /** エラーの詳細（スタックトレース等） */
  details?: string;
  /** エラーカテゴリ */
  category: ErrorCategory;
  /** 発生場所（ファイル名、関数名等） */
  location?: string;
  /** リクエスト情報（URL、メソッド等） */
  request?: {
    url?: string;
    method?: string;
    body?: unknown;
  };
  /** ユーザー情報（ID、ロール等） */
  user?: {
    id?: string;
    role?: string;
  };
  /** 発生日時 */
  timestamp: string; // ISO 8601
  /** ユーザーエージェント */
  userAgent?: string;
}

// =============================================================================
// エラーハンドリングユーティリティ
// =============================================================================

/**
 * エラーコードからカテゴリを取得
 */
export function getErrorCategory(code: ErrorCode): ErrorCategory {
  if (code.startsWith("MISSING_") || code.startsWith("INVALID_") || code.startsWith("VALIDATION_")) {
    return ErrorCategory.CLIENT_ERROR;
  }
  if (code.startsWith("INTERNAL_") || code.startsWith("DATABASE_") || code.startsWith("TIMEOUT_")) {
    return ErrorCategory.SERVER_ERROR;
  }
  if (code.startsWith("NETWORK_") || code.startsWith("CONNECTION_") || code.startsWith("REQUEST_")) {
    return ErrorCategory.NETWORK_ERROR;
  }
  if (code.startsWith("UNAUTHORIZED") || code.startsWith("FORBIDDEN") || code.startsWith("SESSION_")) {
    return ErrorCategory.AUTH_ERROR;
  }
  if (code.startsWith("ZOHO_") || code.startsWith("GOOGLE_") || code.startsWith("RATE_LIMIT_")) {
    return ErrorCategory.EXTERNAL_API_ERROR;
  }
  if (code.startsWith("DATA_")) {
    return ErrorCategory.DATA_ERROR;
  }
  return ErrorCategory.UNKNOWN_ERROR;
}

/**
 * エラーコードからユーザー向けメッセージを取得
 */
export function getUserFriendlyMessage(code: ErrorCode, customMessage?: string): string {
  return customMessage || ErrorMessages[code] || ErrorMessages.UNKNOWN_ERROR;
}

/**
 * HTTPステータスコードからエラーコードを推定
 */
export function getErrorCodeFromHttpStatus(status: number): ErrorCode {
  if (status >= 400 && status < 500) {
    if (status === 400) return ErrorCodes.INVALID_PARAM;
    if (status === 401) return ErrorCodes.UNAUTHORIZED;
    if (status === 403) return ErrorCodes.FORBIDDEN;
    if (status === 404) return ErrorCodes.NOT_FOUND;
    if (status === 409) return ErrorCodes.ALREADY_EXISTS;
    if (status === 422) return ErrorCodes.VALIDATION_FAILED;
    if (status === 429) return ErrorCodes.RATE_LIMIT_EXCEEDED;
    return ErrorCodes.INVALID_PARAM; // CLIENT_ERRORが存在しないため、INVALID_PARAMを返す
  }
  if (status >= 500) {
    if (status === 503) return ErrorCodes.TIMEOUT_ERROR;
    return ErrorCodes.INTERNAL_ERROR;
  }
  return ErrorCodes.UNKNOWN_ERROR;
}

/**
 * エラーログエントリを作成
 */
export function createErrorLogEntry(
  error: Error | unknown,
  code: ErrorCode,
  context?: {
    location?: string;
    request?: ErrorLogEntry["request"];
    user?: ErrorLogEntry["user"];
  }
): ErrorLogEntry {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const category = getErrorCategory(code);

  return {
    id: crypto.randomUUID?.() || `error-${Date.now()}`,
    code,
    message: errorObj.message || getUserFriendlyMessage(code),
    details: errorObj.stack || String(error),
    category,
    location: context?.location,
    request: context?.request,
    user: context?.user,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
  };
}

// =============================================================================
// エラーログ機能
// =============================================================================

/**
 * エラーログを記録（クライアント側のみ）
 */
export function logError(entry: ErrorLogEntry): void {
  // サーバー側では実行しない
  if (typeof window === "undefined") {
    // サーバー側ではコンソールに出力のみ
    console.error("[Error Log]", entry);
    return;
  }

  // クライアント側でのみ実行
  try {
    // 全ての環境でコンソールに出力（開発者向けエラーフィードバック）
    console.error("[Error Log]", entry);

    // ローカルストレージに保存（最大100件）
    const logs = getStoredErrorLogs();
    logs.unshift(entry);
    const limitedLogs = logs.slice(0, 100); // 最新100件のみ保持
    localStorage.setItem("error_logs", JSON.stringify(limitedLogs));

    // アナリティクスにも記録
    import("./analytics").then(({ trackError }) => {
      trackError(
        entry.location || "unknown",
        entry.code,
        entry.message,
        entry.location,
        {
          category: entry.category,
          details: entry.details,
          request: entry.request,
        }
      );
    }).catch((err) => {
      console.error("Failed to track error in analytics:", err);
    });
  } catch (error) {
    console.error("Failed to store error log:", error);
  }
}

/**
 * 保存されたエラーログを取得
 */
export function getStoredErrorLogs(): ErrorLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("error_logs");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * エラーログをクリア
 */
export function clearErrorLogs(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("error_logs");
  }
}

// =============================================================================
// APIエラーハンドリング
// =============================================================================

/**
 * APIレスポンスからエラーを抽出
 */
export function extractApiError<T>(
  response: ApiResponse<T>
): { code: ErrorCode; message: string } | null {
  if (response.success || !response.error) {
    return null;
  }

  const code = (response.error.code as ErrorCode) || ErrorCodes.UNKNOWN_ERROR;
  const message = response.error.message || getUserFriendlyMessage(code);

  return { code, message };
}

/**
 * Fetch APIのエラーを処理
 */
export async function handleFetchError(
  response: Response,
  context?: { location?: string }
): Promise<ApiResponse<never>> {
  const code = getErrorCodeFromHttpStatus(response.status);
  let errorMessage = getUserFriendlyMessage(code);

  try {
    const errorData = await response.json();
    if (errorData.error?.message) {
      errorMessage = errorData.error.message;
    }
  } catch {
    // JSONパースに失敗した場合はデフォルトメッセージを使用
  }

  const errorLog = createErrorLogEntry(
    new Error(errorMessage),
    code,
    {
      location: context?.location,
      request: {
        url: response.url,
        method: "GET", // 実際のメソッドは呼び出し側で指定
      },
    }
  );

  logError(errorLog);

  return {
    success: false,
    error: {
      code,
      message: errorMessage,
    },
  };
}
























