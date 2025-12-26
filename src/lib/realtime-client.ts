/**
 * リアルタイム更新クライアント
 * 
 * Server-Sent Events (SSE) 方式でリアルタイム更新を取得
 */

// =============================================================================
// 型定義
// =============================================================================

import type { RealtimeEvent, RealtimeEventType } from "@/app/api/realtime/updates/route";

export interface RealtimeEventHandlers {
  onJobUpdated?: (jobId: string, data: unknown) => void;
  onJobCreated?: (jobId: string, data: unknown) => void;
  onJobDeleted?: (jobId: string) => void;
  onWorkOrderUpdated?: (workOrderId: string, data: unknown) => void;
  onWorkOrderCreated?: (workOrderId: string, data: unknown) => void;
  onDiagnosisUpdated?: (jobId: string, data: unknown) => void;
  onEstimateUpdated?: (jobId: string, data: unknown) => void;
  onWorkUpdated?: (jobId: string, data: unknown) => void;
  onSyncRequired?: () => void;
}

// =============================================================================
// リアルタイム更新クライアントクラス
// =============================================================================

class RealtimeClient {
  private eventSource: EventSource | null = null;
  private handlers: RealtimeEventHandlers = {};
  private lastEventId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;

  /**
   * SSE接続を開始
   * 
   * 注意: intervalMs パラメータは後方互換性のため残すが、SSEでは使用しない
   */
  startPolling(intervalMs?: number): void {
    // intervalMs パラメータは後方互換性のため残すが、SSEでは使用しない
    if (this.eventSource?.readyState === EventSource.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.connect();
  }

  /**
   * SSE接続を確立
   */
  private connect(): void {
    // オフライン状態の場合は接続を試みない
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.log("[SSE] オフライン状態のため接続をスキップします");
      this.isConnecting = false;
      return;
    }

    try {
      const url = `/api/realtime/stream${this.lastEventId ? `?lastEventId=${encodeURIComponent(this.lastEventId)}` : ""}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log("[SSE] 接続が確立されました");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          this.handleEvent(realtimeEvent);
          
          // 最後に受信したイベントIDを保存（再接続時に使用）
          if (event.lastEventId) {
            this.lastEventId = event.lastEventId;
          }
        } catch (error) {
          console.error("[SSE] メッセージのパースエラー:", error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error("[SSE] 接続エラー:", error);
        this.isConnecting = false;
        
        // オフライン状態の場合は再接続を試みない
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          console.log("[SSE] オフライン状態のため再接続をスキップします");
          return;
        }
        
        // 接続が閉じられた場合は再接続を試行
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error("[SSE] 接続エラー:", error);
      this.isConnecting = false;
      
      // オフライン状態の場合は再接続を試みない
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        console.log("[SSE] オフライン状態のため再接続をスキップします");
        return;
      }
      
      this.attemptReconnect();
    }
  }

  /**
   * SSE接続を停止
   */
  stopPolling(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnecting = false;
    // 再接続試行回数をリセット（オフライン復帰時に正常に再接続できるように）
    this.reconnectAttempts = 0;
  }

  /**
   * 再接続を試行
   */
  private attemptReconnect(): void {
    // オフライン状態の場合は再接続を試みない
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      console.log("[SSE] オフライン状態のため再接続をスキップします");
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("[SSE] 最大再接続試行回数に達しました");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数バックオフ

    console.log(`[SSE] ${delay}ms後に再接続を試行します (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      // タイマー実行時にもオフライン状態をチェック
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        console.log("[SSE] オフライン状態のため再接続をスキップします");
        this.reconnectAttempts = 0; // リセットして次回の再接続に備える
        return;
      }
      this.connect();
    }, delay);
  }

  /**
   * イベントを処理
   */
  private handleEvent(event: RealtimeEvent): void {
    switch (event.type) {
      case "job.updated":
        if (typeof event.payload === "object" && event.payload !== null && "id" in event.payload) {
          this.handlers.onJobUpdated?.(event.payload.id as string, event.payload);
        }
        break;
      case "job.created":
        if (typeof event.payload === "object" && event.payload !== null && "id" in event.payload) {
          this.handlers.onJobCreated?.(event.payload.id as string, event.payload);
        }
        break;
      case "job.deleted":
        if (typeof event.payload === "object" && event.payload !== null && "id" in event.payload) {
          this.handlers.onJobDeleted?.(event.payload.id as string);
        }
        break;
      case "work_order.updated":
        if (typeof event.payload === "object" && event.payload !== null && "id" in event.payload) {
          this.handlers.onWorkOrderUpdated?.(event.payload.id as string, event.payload);
        }
        break;
      case "work_order.created":
        if (typeof event.payload === "object" && event.payload !== null && "id" in event.payload) {
          this.handlers.onWorkOrderCreated?.(event.payload.id as string, event.payload);
        }
        break;
      case "diagnosis.updated":
        if (typeof event.payload === "object" && event.payload !== null && "jobId" in event.payload) {
          this.handlers.onDiagnosisUpdated?.(event.payload.jobId as string, event.payload);
        }
        break;
      case "estimate.updated":
        if (typeof event.payload === "object" && event.payload !== null && "jobId" in event.payload) {
          this.handlers.onEstimateUpdated?.(event.payload.jobId as string, event.payload);
        }
        break;
      case "work.updated":
        if (typeof event.payload === "object" && event.payload !== null && "jobId" in event.payload) {
          this.handlers.onWorkUpdated?.(event.payload.jobId as string, event.payload);
        }
        break;
      case "sync.required":
        this.handlers.onSyncRequired?.();
        break;
      default:
        console.warn("[SSE] 未知のイベントタイプ:", event.type);
    }
  }

  /**
   * イベントハンドラーを登録
   */
  on(handlers: RealtimeEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * イベントハンドラーを削除
   */
  off(): void {
    this.handlers = {};
  }

  /**
   * イベントを送信（ブロードキャスト）
   */
  async send(type: RealtimeEventType, payload: unknown): Promise<void> {
    try {
      const response = await fetch("/api/realtime/updates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, payload }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `リアルタイム更新の送信に失敗しました（ステータス: ${response.status}）`
        );
      }
    } catch (error) {
      console.error("[SSE] 送信エラー:", error);
      throw error;
    }
  }
}

// =============================================================================
// シングルトンインスタンス
// =============================================================================

let realtimeClientInstance: RealtimeClient | null = null;

/**
 * リアルタイム更新クライアントのシングルトンインスタンスを取得
 */
export function getRealtimeClient(): RealtimeClient {
  if (!realtimeClientInstance) {
    realtimeClientInstance = new RealtimeClient();
  }
  return realtimeClientInstance;
}

/**
 * リアルタイム更新クライアントを初期化（SSE接続開始）
 */
export function initRealtime(handlers?: RealtimeEventHandlers, intervalMs?: number): RealtimeClient {
  const client = getRealtimeClient();
  if (handlers) {
    client.on(handlers);
  }
  if (typeof window !== "undefined" && navigator.onLine) {
    client.startPolling(intervalMs);
  }
  return client;
}

/**
 * リアルタイム更新クライアントをクリーンアップ（SSE接続停止）
 */
export function cleanupRealtime(): void {
  if (realtimeClientInstance) {
    realtimeClientInstance.stopPolling();
    realtimeClientInstance.off();
  }
}





