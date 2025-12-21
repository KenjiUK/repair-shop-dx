import { NextRequest } from "next/server";
import { createErrorResponse } from "@/lib/server-error-handling";
import { ErrorCodes } from "@/lib/error-handling";
import type { RealtimeEvent } from "@/app/api/realtime/updates/route";
import { getEvents } from "@/app/api/realtime/updates/route";

// =============================================================================
// SSE接続管理
// =============================================================================

/**
 * SSE接続のコントローラー
 */
interface SSEClient {
  controller: ReadableStreamDefaultController;
  lastEventId: string | null;
}

const sseClients = new Set<SSEClient>();

/**
 * SSE接続を登録
 */
function registerSSEClient(client: SSEClient): void {
  sseClients.add(client);
}

/**
 * SSE接続を削除
 */
function unregisterSSEClient(client: SSEClient): void {
  sseClients.delete(client);
}

/**
 * すべてのSSE接続にイベントをブロードキャスト
 */
export function broadcastToSSEClients(event: RealtimeEvent): void {
  const message = `id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`;
  
  for (const client of sseClients) {
    try {
      client.controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      // 接続が閉じられている場合は削除
      console.error("[SSE] クライアントへの送信エラー:", error);
      unregisterSSEClient(client);
    }
  }
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * GET /api/realtime/stream
 * Server-Sent Events (SSE) によるリアルタイム更新ストリーム
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lastEventId = searchParams.get("lastEventId") || undefined;

    // SSEストリームを作成
    const stream = new ReadableStream({
      start(controller) {
        const client: SSEClient = {
          controller,
          lastEventId: lastEventId || null,
        };

        // クライアントを登録
        registerSSEClient(client);

        // 接続確立メッセージを送信
        const connectMessage = `: 接続が確立されました\n\n`;
        controller.enqueue(new TextEncoder().encode(connectMessage));

        // 既存のイベントを送信（lastEventId以降）
        // 注意: getEventsはタイムスタンプベースなので、イベントIDでフィルタリングする必要がある
        if (lastEventId) {
          // イベントストアから直接取得（簡易実装）
          // 本番環境では、イベントIDで検索する必要がある
          const allEvents = getEvents();
          const eventsToSend = allEvents.filter((event) => {
            // イベントIDを比較（簡易実装）
            // 実際の実装では、イベントIDの順序を考慮する必要がある
            return event.id !== lastEventId;
          });
          
          for (const event of eventsToSend) {
            const message = `id: ${event.id}\ndata: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(new TextEncoder().encode(message));
          }
        }

        // 接続が閉じられた時のクリーンアップ
        request.signal.addEventListener("abort", () => {
          unregisterSSEClient(client);
          try {
            controller.close();
          } catch (error) {
            // 既に閉じられている場合は無視
          }
        });
      },
      cancel() {
        // ストリームがキャンセルされた時の処理
        // クライアントの削除は start 内の abort イベントで処理される
      },
    });

    // SSE用のレスポンスを返す
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Nginx用の設定
      },
    });
  } catch (error) {
    console.error("[SSE Stream] エラー:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      error instanceof Error ? error.message : "SSEストリームの作成に失敗しました",
      500
    );
  }
}





