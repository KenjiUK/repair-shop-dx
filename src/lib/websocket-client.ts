/**
 * WebSocketクライアント
 *
 * リアルタイムデータ更新を管理
 * - ジョブステータスの変更通知
 * - ワークオーダーの更新通知
 * - 診断・見積・作業データの更新通知
 */

// =============================================================================
// 型定義
// =============================================================================

export type WebSocketEventType =
  | "job.updated"
  | "job.created"
  | "job.deleted"
  | "work_order.updated"
  | "work_order.created"
  | "diagnosis.updated"
  | "estimate.updated"
  | "work.updated"
  | "sync.required"
  | "connection.status";

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: unknown;
  timestamp: string;
}

export interface WebSocketEventHandlers {
  onJobUpdated?: (jobId: string, data: unknown) => void;
  onJobCreated?: (jobId: string, data: unknown) => void;
  onJobDeleted?: (jobId: string) => void;
  onWorkOrderUpdated?: (workOrderId: string, data: unknown) => void;
  onWorkOrderCreated?: (workOrderId: string, data: unknown) => void;
  onDiagnosisUpdated?: (jobId: string, data: unknown) => void;
  onEstimateUpdated?: (jobId: string, data: unknown) => void;
  onWorkUpdated?: (jobId: string, data: unknown) => void;
  onSyncRequired?: () => void;
  onConnectionStatus?: (isConnected: boolean) => void;
}

// =============================================================================
// WebSocketクライアントクラス
// =============================================================================

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒
  private reconnectTimer: NodeJS.Timeout | null = null;
  private handlers: WebSocketEventHandlers = {};
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url?: string) {
    // 本番環境では環境変数から取得、開発環境ではデフォルト値を使用
    // WebSocketサーバーが実装されていない場合は、接続を試みない
    // 現時点では、ポーリング方式のリアルタイム更新APIを使用することを推奨
    this.url =
      url ||
      (typeof window !== "undefined"
        ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/ws`
        : "ws://localhost:3000/api/ws");
  }

  /**
   * WebSocket接続を開始
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    // 開発環境では、WebSocketサーバーが実装されていない可能性が高いため、
    // 接続を試みない（エラーを完全に回避）
    if (process.env.NODE_ENV === "development") {
      // 開発環境では接続を試みない
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        // 本番環境でのみログを出力
        if (process.env.NODE_ENV !== "development") {
          console.log("[WebSocket] 接続が確立されました");
        }
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.handlers.onConnectionStatus?.(true);
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("[WebSocket] メッセージのパースエラー:", error);
        }
      };

      this.ws.onerror = (error) => {
        // WebSocketのエラーイベントは詳細情報を提供しないため、接続状態を確認
        const state = this.ws?.readyState;
        // 開発環境では、WebSocketサーバーが実装されていない場合のエラーを完全に抑制
        if (process.env.NODE_ENV === "development") {
          // 開発環境では、エラーをログに記録しない（WebSocketサーバーが未実装の可能性が高い）
          // エラーイベント自体は処理するが、ログは出力しない
          this.isConnecting = false;
          return;
        }
        // 本番環境では、エラーをログに記録
        if (state === WebSocket.CONNECTING || state === WebSocket.CLOSING) {
          console.warn("[WebSocket] 接続エラー: サーバーに接続できませんでした");
        } else {
          console.warn("[WebSocket] エラーが発生しました。接続状態:", state);
        }
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.handlers.onConnectionStatus?.(false);
        this.stopHeartbeat();
        
        // 開発環境では、WebSocketサーバーが実装されていない可能性が高いため、
        // 再接続を試みない（エラーログも出力しない）
        if (process.env.NODE_ENV === "development") {
          // 開発環境では再接続を試みない
          return;
        }
        
        // 正常な切断（コード1000）の場合はログを出力しない
        if (event.code !== 1000) {
          console.log(`[WebSocket] 接続が閉じられました (コード: ${event.code}, 理由: ${event.reason || "なし"})`);
        }
        
        // サーバーが存在しない場合（コード1006）は再接続を試みない
        if (event.code !== 1006) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error("[WebSocket] 接続エラー:", error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * イベントハンドラーを登録
   */
  on(handlers: WebSocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * イベントハンドラーを削除
   */
  off(): void {
    this.handlers = {};
  }

  /**
   * メッセージを送信
   */
  send(type: WebSocketEventType, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: new Date().toISOString(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] 接続が確立されていないため、メッセージを送信できません");
    }
  }

  /**
   * 接続状態を取得
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * メッセージを処理
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case "job.updated":
        if (typeof message.payload === "object" && message.payload !== null && "id" in message.payload) {
          this.handlers.onJobUpdated?.(message.payload.id as string, message.payload);
        }
        break;
      case "job.created":
        if (typeof message.payload === "object" && message.payload !== null && "id" in message.payload) {
          this.handlers.onJobCreated?.(message.payload.id as string, message.payload);
        }
        break;
      case "job.deleted":
        if (typeof message.payload === "object" && message.payload !== null && "id" in message.payload) {
          this.handlers.onJobDeleted?.(message.payload.id as string);
        }
        break;
      case "work_order.updated":
        if (typeof message.payload === "object" && message.payload !== null && "id" in message.payload) {
          this.handlers.onWorkOrderUpdated?.(message.payload.id as string, message.payload);
        }
        break;
      case "work_order.created":
        if (typeof message.payload === "object" && message.payload !== null && "id" in message.payload) {
          this.handlers.onWorkOrderCreated?.(message.payload.id as string, message.payload);
        }
        break;
      case "diagnosis.updated":
        if (typeof message.payload === "object" && message.payload !== null && "jobId" in message.payload) {
          this.handlers.onDiagnosisUpdated?.(message.payload.jobId as string, message.payload);
        }
        break;
      case "estimate.updated":
        if (typeof message.payload === "object" && message.payload !== null && "jobId" in message.payload) {
          this.handlers.onEstimateUpdated?.(message.payload.jobId as string, message.payload);
        }
        break;
      case "work.updated":
        if (typeof message.payload === "object" && message.payload !== null && "jobId" in message.payload) {
          this.handlers.onWorkUpdated?.(message.payload.jobId as string, message.payload);
        }
        break;
      case "sync.required":
        this.handlers.onSyncRequired?.();
        break;
      default:
        console.warn("[WebSocket] 未知のメッセージタイプ:", message.type);
    }
  }

  /**
   * 再接続を試行
   */
  private attemptReconnect(): void {
    // 開発環境では再接続を試みない
    if (process.env.NODE_ENV === "development") {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("[WebSocket] 最大再接続試行回数に達しました。WebSocketサーバーが実装されていない可能性があります。");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数バックオフ

    // 本番環境では再接続を試行
    console.log(`[WebSocket] ${delay}ms後に再接続を試行します (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * ハートビートを開始（接続維持）
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send("connection.status", { ping: true });
      }
    }, 30000); // 30秒ごと
  }

  /**
   * ハートビートを停止
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// =============================================================================
// シングルトンインスタンス
// =============================================================================

let wsClientInstance: WebSocketClient | null = null;

/**
 * WebSocketクライアントのシングルトンインスタンスを取得
 */
export function getWebSocketClient(): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient();
  }
  return wsClientInstance;
}

/**
 * WebSocketクライアントを初期化（接続開始）
 */
export function initWebSocket(handlers?: WebSocketEventHandlers): WebSocketClient {
  const client = getWebSocketClient();
  if (handlers) {
    client.on(handlers);
  }
  if (typeof window !== "undefined" && navigator.onLine) {
    client.connect();
  }
  return client;
}

/**
 * WebSocketクライアントをクリーンアップ（接続切断）
 */
export function cleanupWebSocket(): void {
  if (wsClientInstance) {
    wsClientInstance.disconnect();
    wsClientInstance.off();
  }
}









