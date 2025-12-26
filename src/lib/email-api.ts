/**
 * メール送信APIクライアント
 * 
 * Gmail APIまたはNodemailerを使用して顧客へのメール通知を送信するためのクライアントライブラリ
 */

// =============================================================================
// Types
// =============================================================================

/**
 * メール送信リクエスト
 */
export interface EmailSendRequest {
  /** 宛先メールアドレス */
  to: string;
  /** 件名 */
  subject: string;
  /** 本文（HTML） */
  htmlBody: string;
  /** 本文（プレーンテキスト、オプション） */
  textBody?: string;
  /** Job ID（オプション、ログ記録用） */
  jobId?: string;
}

/**
 * メール送信レスポンス
 */
export interface EmailSendResponse {
  success: boolean;
  messageId?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 見積メール送信リクエスト
 */
export interface EstimateEmailRequest {
  /** 顧客ID（Zoho Contacts） */
  customerId: string;
  /** Job ID */
  jobId: string;
  /** ワークオーダーID（オプション） */
  workOrderId?: string;
  /** 見積もりページのURL */
  estimateUrl: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * メールを送信
 * 
 * @param request メール送信リクエスト
 * @returns メール送信レスポンス
 */
export async function sendEmail(
  request: EmailSendRequest
): Promise<EmailSendResponse> {
  try {
    // Next.js API Route経由でメールを送信
    const response = await fetch("/api/email/send", {
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
          message: error.message || "メールの送信に失敗しました",
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error("メール送信エラー:", error);
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
 * 見積もりメールを送信
 * 
 * @param request 見積メール送信リクエスト
 * @returns メール送信レスポンス
 */
export async function sendEstimateEmail(
  request: EstimateEmailRequest
): Promise<EmailSendResponse> {
  try {
    // Next.js API Route経由で見積もりメールを送信
    const response = await fetch("/api/email/send-estimate", {
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
          message: error.message || "見積もりメールの送信に失敗しました",
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    console.error("見積もりメール送信エラー:", error);
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "ネットワークエラーが発生しました",
      },
    };
  }
}




