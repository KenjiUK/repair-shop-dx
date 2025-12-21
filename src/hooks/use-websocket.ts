"use client";

import { useEffect, useRef } from "react";
import { getWebSocketClient, WebSocketEventHandlers } from "@/lib/websocket-client";
import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * WebSocket接続を管理するフック
 *
 * 機能:
 * - オンライン時に自動接続
 * - オフライン時に自動切断
 * - イベントハンドラーの登録
 * - コンポーネントのアンマウント時にクリーンアップ
 */
export function useWebSocket(handlers?: WebSocketEventHandlers) {
  const isOnline = useOnlineStatus();
  const handlersRef = useRef<WebSocketEventHandlers | undefined>(handlers);

  // ハンドラーが変更されたら更新
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const client = getWebSocketClient();

    // ハンドラーを登録
    if (handlersRef.current) {
      client.on(handlersRef.current);
    }

    // オンライン時に接続
    if (isOnline) {
      client.connect();
    } else {
      client.disconnect();
    }

    // クリーンアップ
    return () => {
      client.off();
    };
  }, [isOnline]);

  return {
    isConnected: () => {
      const client = getWebSocketClient();
      return client.isConnected();
    },
    send: (type: Parameters<ReturnType<typeof getWebSocketClient>["send"]>[0], payload: unknown) => {
      const client = getWebSocketClient();
      client.send(type, payload);
    },
  };
}









