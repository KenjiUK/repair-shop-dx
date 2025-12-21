import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/server-error-handling";
import { ErrorCodes } from "@/lib/error-handling";

// =============================================================================
// 型定義
// =============================================================================

/**
 * シグナリングメッセージの種類
 */
type SignalingMessageType = "offer" | "answer" | "ice-candidate" | "hangup";

/**
 * シグナリングメッセージ
 */
interface SignalingMessage {
  type: SignalingMessageType;
  roomId: string;
  from: string; // 送信者のID
  to?: string; // 受信者のID（オプション）
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
}

// =============================================================================
// インメモリストレージ（簡易実装）
// =============================================================================

/**
 * シグナリングメッセージの一時ストレージ
 * 本番環境では、Redisやデータベースを使用することを推奨
 */
const signalingStore = new Map<string, SignalingMessage[]>();

/**
 * メッセージを保存
 */
function saveMessage(roomId: string, message: SignalingMessage): void {
  if (!signalingStore.has(roomId)) {
    signalingStore.set(roomId, []);
  }
  const messages = signalingStore.get(roomId)!;
  messages.push(message);
  
  // メッセージ数が100を超えた場合、古いメッセージを削除
  if (messages.length > 100) {
    messages.shift();
  }
}

/**
 * メッセージを取得
 */
function getMessages(roomId: string, from?: string): SignalingMessage[] {
  const messages = signalingStore.get(roomId) || [];
  if (from) {
    // 特定の送信者からのメッセージを除外
    return messages.filter((msg) => msg.from !== from);
  }
  return messages;
}

/**
 * ルームのメッセージをクリア
 */
function clearRoom(roomId: string): void {
  signalingStore.delete(roomId);
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * POST /api/webrtc/signal
 * シグナリングメッセージを送信・受信
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomId, from, message } = body as {
      action: "send" | "receive" | "clear";
      roomId: string;
      from?: string;
      message?: SignalingMessage;
    };

    // バリデーション
    if (!action || !roomId) {
      return createErrorResponse(
        ErrorCodes.INVALID_PARAM,
        "action と roomId が必要です",
        400
      );
    }

    switch (action) {
      case "send":
        if (!message || !from) {
          return createErrorResponse(
            ErrorCodes.INVALID_PARAM,
            "send アクションには message と from が必要です",
            400
          );
        }
        saveMessage(roomId, { ...message, from });
        return NextResponse.json({
          success: true,
          data: { sent: true },
        });

      case "receive":
        const messages = getMessages(roomId, from);
        return NextResponse.json({
          success: true,
          data: { messages },
        });

      case "clear":
        clearRoom(roomId);
        return NextResponse.json({
          success: true,
          data: { cleared: true },
        });

      default:
        return createErrorResponse(
          ErrorCodes.INVALID_PARAM,
          "無効なアクションです",
          400
        );
    }
  } catch (error) {
    console.error("[WebRTC Signal] エラー:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      error instanceof Error ? error.message : "シグナリング処理に失敗しました",
      500
    );
  }
}





