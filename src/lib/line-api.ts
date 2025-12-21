/**
 * LINE Messaging API クライアント
 * 
 * LINE Messaging APIを使用して顧客への通知を送信するためのクライアントライブラリ
 * 
 * 参考: https://developers.line.biz/ja/reference/messaging-api/
 */

// =============================================================================
// Types
// =============================================================================

/**
 * LINE通知の種類
 */
export type LineNotificationType =
  | "check_in" // 入庫完了
  | "diagnosis_complete" // 診断完了
  | "estimate_sent" // 見積送付
  | "estimate_approved" // 見積承認
  | "work_complete"; // 作業完了

/**
 * LINE通知リクエスト
 */
export interface LineNotificationRequest {
  /** 顧客のLINE User ID */
  lineUserId: string;
  /** 通知の種類 */
  type: LineNotificationType;
  /** Job ID */
  jobId: string;
  /** 追加データ（通知タイプごとに異なる） */
  data?: Record<string, unknown>;
}

/**
 * LINE通知レスポンス
 */
export interface LineNotificationResponse {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * マジックリンク生成リクエスト
 */
export interface MagicLinkRequest {
  /** Job ID */
  jobId: string;
  /** ワークオーダーID（オプション） */
  workOrderId?: string;
  /** 有効期限（秒、デフォルト: 7日間） */
  expiresIn?: number;
}

/**
 * マジックリンク生成レスポンス
 */
export interface MagicLinkResponse {
  success: boolean;
  url?: string;
  expiresAt?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 通知履歴取得リクエスト
 */
export interface NotificationHistoryRequest {
  /** Job ID（オプション） */
  jobId?: string;
  /** 顧客のLINE User ID（オプション） */
  lineUserId?: string;
  /** 開始日時（ISO 8601） */
  startDate?: string;
  /** 終了日時（ISO 8601） */
  endDate?: string;
  /** ページ番号（デフォルト: 1） */
  page?: number;
  /** 1ページあたりの件数（デフォルト: 20） */
  limit?: number;
}

/**
 * 通知履歴エントリ
 */
export interface NotificationHistoryEntry {
  /** 通知ID */
  id: string;
  /** Job ID */
  jobId: string;
  /** 顧客のLINE User ID */
  lineUserId: string;
  /** 通知の種類 */
  type: LineNotificationType;
  /** 送信日時（ISO 8601） */
  sentAt: string;
  /** ステータス（sent, failed, pending） */
  status: "sent" | "failed" | "pending";
  /** エラーメッセージ（失敗時） */
  errorMessage?: string;
  /** リトライ回数 */
  retryCount?: number;
}

/**
 * 通知履歴レスポンス
 */
export interface NotificationHistoryResponse {
  success: boolean;
  entries?: NotificationHistoryEntry[];
  total?: number;
  page?: number;
  limit?: number;
  error?: {
    code: string;
    message: string;
  };
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * LINE通知を送信
 * 
 * @param request 通知リクエスト
 * @returns 通知レスポンス
 */
export async function sendLineNotification(
  request: LineNotificationRequest
): Promise<LineNotificationResponse> {
  try {
    // Next.js API Route経由でLINE Messaging APIを呼び出す
    const response = await fetch("/api/line/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: error.code || "UNKNOWN_ERROR",
          message: error.message || "通知の送信に失敗しました",
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error("LINE通知送信エラー:", error);
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "ネットワークエラーが発生しました",
      },
    };
  }
}

/**
 * マジックリンクを生成
 * 
 * @param request マジックリンクリクエスト
 * @returns マジックリンクレスポンス
 */
export async function generateMagicLink(
  request: MagicLinkRequest
): Promise<MagicLinkResponse> {
  try {
    // Next.js API Route経由でマジックリンクを生成
    const response = await fetch("/api/line/magic-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: error.code || "UNKNOWN_ERROR",
          message: error.message || "マジックリンクの生成に失敗しました",
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url,
      expiresAt: data.expiresAt,
    };
  } catch (error) {
    console.error("マジックリンク生成エラー:", error);
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "ネットワークエラーが発生しました",
      },
    };
  }
}

/**
 * 通知履歴を取得
 * 
 * @param request 通知履歴リクエスト
 * @returns 通知履歴レスポンス
 */
export async function getNotificationHistory(
  request: NotificationHistoryRequest = {}
): Promise<NotificationHistoryResponse> {
  try {
    // Next.js API Route経由で通知履歴を取得
    const params = new URLSearchParams();
    if (request.jobId) params.append("jobId", request.jobId);
    if (request.lineUserId) params.append("lineUserId", request.lineUserId);
    if (request.startDate) params.append("startDate", request.startDate);
    if (request.endDate) params.append("endDate", request.endDate);
    if (request.page) params.append("page", request.page.toString());
    if (request.limit) params.append("limit", request.limit.toString());

    const response = await fetch(`/api/line/history?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: error.code || "UNKNOWN_ERROR",
          message: error.message || "通知履歴の取得に失敗しました",
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      entries: data.entries,
      total: data.total,
      page: data.page,
      limit: data.limit,
    };
  } catch (error) {
    console.error("通知履歴取得エラー:", error);
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "ネットワークエラーが発生しました",
      },
    };
  }
}

/**
 * 失敗した通知をリトライ
 * 
 * @param notificationId 通知ID
 * @returns 通知レスポンス
 */
export async function retryNotification(
  notificationId: string
): Promise<LineNotificationResponse> {
  try {
    // Next.js API Route経由でリトライ処理を実行
    const response = await fetch(`/api/line/retry/${notificationId}`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          code: error.code || "UNKNOWN_ERROR",
          message: error.message || "リトライに失敗しました",
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error("通知リトライエラー:", error);
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "ネットワークエラーが発生しました",
      },
    };
  }
}

/**
 * マジックリンクトークンから顧客IDを取得
 * 
 * Google Sheetsの「マジックリンクトークン」シートから取得
 * 
 * @param token マジックリンクトークン
 * @returns 顧客ID（取得できない場合はnull）
 */
export async function getCustomerIdFromMagicLink(
  token: string
): Promise<string | null> {
  try {
    // Next.js API Route経由でマジックリンクトークンから顧客IDを取得
    const response = await fetch(`/api/line/magic-link/${token}/customer-id`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("マジックリンクトークンから顧客ID取得エラー:", error);
      return null;
    }

    const data = await response.json();
    if (data.success && data.customerId) {
      return data.customerId;
    }

    return null;
  } catch (error) {
    console.error("マジックリンクトークンから顧客ID取得エラー:", error);
    return null;
  }
}










