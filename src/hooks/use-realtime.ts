"use client";

import { useEffect, useRef } from "react";
import { getRealtimeClient, RealtimeEventHandlers } from "@/lib/realtime-client";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { RealtimeEventType } from "@/app/api/realtime/updates/route";

/**
 * リアルタイム更新接続を管理するフック
 *
 * 機能:
 * - オンライン時に自動SSE接続開始
 * - オフライン時に自動SSE接続停止
 * - ページがフォーカスされている時のみ接続
 * - イベントハンドラーの登録
 * - コンポーネントのアンマウント時にクリーンアップ
 */
export function useRealtime(handlers?: RealtimeEventHandlers, options?: {
  /** ポーリング間隔（ミリ秒、後方互換性のため残すが、SSEでは使用しない） */
  intervalMs?: number;
  /** リアルタイム更新を有効にするか（デフォルト: true） */
  enabled?: boolean;
}) {
  const isOnline = useOnlineStatus();
  const handlersRef = useRef<RealtimeEventHandlers | undefined>(handlers);
  const { intervalMs, enabled = true } = options || {}; // intervalMsは後方互換性のため残すが使用しない

  // ハンドラーが変更されたら更新
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (typeof window === "undefined" || !enabled) return;

    const client = getRealtimeClient();

    // ハンドラーを登録
    if (handlersRef.current) {
      client.on(handlersRef.current);
    }

    // ページがフォーカスされているかチェック
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // ページが非表示の時はSSE接続を停止
        client.stopPolling();
      } else if (isOnline) {
        // ページが表示され、オンラインの時はSSE接続を開始
        client.startPolling(intervalMs);
      }
    };

    // オンライン時にSSE接続開始（ページが表示されている場合のみ）
    if (isOnline && !document.hidden) {
      client.startPolling(intervalMs);
    } else {
      client.stopPolling();
    }

    // ページの可視性変更を監視
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // クリーンアップ
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      client.off();
      // 他のコンポーネントが使用していない場合のみSSE接続を停止
      // シングルトンなので、完全に停止すると他のコンポーネントに影響する可能性がある
      // ただし、このフックがアンマウントされた時は停止する
      client.stopPolling();
    };
  }, [isOnline, enabled, intervalMs]);

  return {
    send: async (type: RealtimeEventType, payload: unknown) => {
      const client = getRealtimeClient();
      await client.send(type, payload);
    },
  };
}





