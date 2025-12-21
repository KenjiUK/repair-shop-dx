import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/server-error-handling";
import { ErrorCodes } from "@/lib/error-handling";

// =============================================================================
// 型定義
// =============================================================================

/**
 * リアルタイム更新イベントの種類
 */
export type RealtimeEventType =
  | "job.updated"
  | "job.created"
  | "job.deleted"
  | "work_order.updated"
  | "work_order.created"
  | "diagnosis.updated"
  | "estimate.updated"
  | "work.updated"
  | "sync.required";

/**
 * リアルタイム更新イベント
 */
export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: unknown;
  timestamp: string;
  id: string; // イベントID（重複チェック用）
}

// =============================================================================
// インメモリストレージ（簡易実装）
// =============================================================================

/**
 * リアルタイム更新イベントの一時ストレージ
 * 本番環境では、Redisやデータベースを使用することを推奨
 */
const eventStore = new Map<string, RealtimeEvent[]>();

/**
 * イベントを保存
 */
function saveEvent(event: RealtimeEvent): void {
  const key = "global"; // グローバルイベントストア（将来はルーム別に分割可能）
  if (!eventStore.has(key)) {
    eventStore.set(key, []);
  }
  const events = eventStore.get(key)!;
  events.push(event);
  
  // イベント数が1000を超えた場合、古いイベントを削除
  if (events.length > 1000) {
    events.shift();
  }
}

/**
 * イベントを取得（指定されたタイムスタンプ以降のイベント）
 */
export function getEvents(since?: string): RealtimeEvent[] {
  const key = "global";
  const events = eventStore.get(key) || [];
  
  if (!since) {
    // タイムスタンプが指定されていない場合は、直近100件を返す
    return events.slice(-100);
  }
  
  // 指定されたタイムスタンプ以降のイベントを返す
  return events.filter((event) => event.timestamp > since);
}

/**
 * イベントをブロードキャスト（すべてのクライアントに通知）
 * SSE接続とポーリング方式の両方に対応
 */
export function broadcastEvent(type: RealtimeEventType, payload: unknown): void {
  const event: RealtimeEvent = {
    type,
    payload,
    timestamp: new Date().toISOString(),
    id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
  saveEvent(event);
  
  // SSE接続にイベントを送信（動的インポートで循環依存を回避）
  import("@/app/api/realtime/stream/route")
    .then((module) => {
      module.broadcastToSSEClients(event);
    })
    .catch((error) => {
      // SSEストリームAPIが利用できない場合は無視（ポーリング方式のみ使用）
      console.warn("[Realtime] SSEブロードキャストに失敗しました（ポーリング方式のみ使用）:", error);
    });
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * GET /api/realtime/updates
 * リアルタイム更新イベントを取得（ポーリング方式）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const since = searchParams.get("since") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // バリデーション
    if (limit < 1 || limit > 1000) {
      return createErrorResponse(
        ErrorCodes.INVALID_PARAM,
        "limit は 1 から 1000 の間である必要があります",
        400
      );
    }

    // イベントを取得
    let events = getEvents(since);
    
    // リミットを適用
    if (events.length > limit) {
      events = events.slice(-limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        events,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Realtime Updates] エラー:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      error instanceof Error ? error.message : "リアルタイム更新の取得に失敗しました",
      500
    );
  }
}

/**
 * POST /api/realtime/updates
 * リアルタイム更新イベントを送信（ブロードキャスト）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = body as {
      type: RealtimeEventType;
      payload: unknown;
    };

    // バリデーション
    if (!type) {
      return createErrorResponse(
        ErrorCodes.INVALID_PARAM,
        "type が必要です",
        400
      );
    }

    // イベントをブロードキャスト
    broadcastEvent(type, payload);

    return NextResponse.json({
      success: true,
      data: {
        broadcasted: true,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Realtime Updates] エラー:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      error instanceof Error ? error.message : "リアルタイム更新の送信に失敗しました",
      500
    );
  }
}





