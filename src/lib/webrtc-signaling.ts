/**
 * WebRTCシグナリングクライアント
 * 
 * シグナリングサーバーとの通信を管理
 */

// =============================================================================
// 型定義
// =============================================================================

export type SignalingMessageType = "offer" | "answer" | "ice-candidate" | "hangup";

export interface SignalingMessage {
  type: SignalingMessageType;
  roomId: string;
  from: string;
  to?: string;
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
}

// =============================================================================
// シグナリングクライアント
// =============================================================================

/**
 * シグナリングメッセージを送信
 */
export async function sendSignalingMessage(
  roomId: string,
  from: string,
  message: Omit<SignalingMessage, "from" | "roomId">
): Promise<void> {
  try {
    const response = await fetch("/api/webrtc/signal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "send",
        roomId,
        from,
        message: {
          ...message,
          roomId,
          from,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `シグナリングメッセージの送信に失敗しました（ステータス: ${response.status}）`
      );
    }
  } catch (error) {
    console.error("[WebRTC Signaling] 送信エラー:", error);
    throw error;
  }
}

/**
 * シグナリングメッセージを受信
 */
export async function receiveSignalingMessages(
  roomId: string,
  from?: string
): Promise<SignalingMessage[]> {
  try {
    const response = await fetch("/api/webrtc/signal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "receive",
        roomId,
        from,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `シグナリングメッセージの受信に失敗しました（ステータス: ${response.status}）`
      );
    }

    const data = await response.json();
    return data.data?.messages || [];
  } catch (error) {
    console.error("[WebRTC Signaling] 受信エラー:", error);
    throw error;
  }
}

/**
 * ルームをクリア
 */
export async function clearSignalingRoom(roomId: string): Promise<void> {
  try {
    const response = await fetch("/api/webrtc/signal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "clear",
        roomId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `ルームのクリアに失敗しました（ステータス: ${response.status}）`
      );
    }
  } catch (error) {
    console.error("[WebRTC Signaling] クリアエラー:", error);
    throw error;
  }
}





