"use client";

import { useEffect, useCallback } from "react";
import { useOnlineStatus } from "./use-online-status";
import { startAutoSync, stopAutoSync, manualSync } from "@/lib/sync-manager";
import { getPendingSyncQueue } from "@/lib/offline-storage";
import { useState } from "react";

/**
 * 自動同期フック
 *
 * オンライン復帰時に自動的に同期を開始
 * 定期的な同期処理を管理
 */
export function useAutoSync(options?: {
  /** 自動同期の間隔（ミリ秒、デフォルト: 30秒） */
  intervalMs?: number;
  /** 自動同期を有効にするか（デフォルト: true） */
  enabled?: boolean;
}) {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const { intervalMs = 30000, enabled = true } = options || {};

  // 未同期アイテム数を更新
  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await getPendingSyncQueue();
      setPendingCount(pending.length);
    } catch (error) {
      console.error("未同期アイテム数の取得に失敗しました:", error);
    }
  }, []);

  // 手動同期
  const handleManualSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error("オフライン状態では同期できません");
    }

    setIsSyncing(true);
    try {
      const result = await manualSync();
      await updatePendingCount();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, updatePendingCount]);

  // オンライン復帰時に同期を開始
  useEffect(() => {
    if (!enabled) return;

    if (isOnline) {
      // 自動同期を開始
      startAutoSync(intervalMs);

      // 未同期アイテム数を更新
      updatePendingCount();

      // 初回同期を実行（オンライン復帰時）
      const wasOffline = sessionStorage.getItem("was_offline") === "true";
      if (wasOffline) {
        sessionStorage.removeItem("was_offline");
        // オンライン復帰時は即座に同期を実行
        handleManualSync().catch((error) => {
          console.error("オンライン復帰時の同期エラー:", error);
        });
      }
    } else {
      // オフライン時は自動同期を停止
      stopAutoSync();
    }

    return () => {
      stopAutoSync();
    };
  }, [isOnline, enabled, intervalMs, updatePendingCount, handleManualSync]);

  // 定期的に未同期アイテム数を更新
  useEffect(() => {
    if (!enabled || !isOnline) return;

    const interval = setInterval(updatePendingCount, 5000); // 5秒ごと
    return () => clearInterval(interval);
  }, [enabled, isOnline, updatePendingCount]);

  return {
    /** 未同期アイテム数 */
    pendingCount,
    /** 同期中かどうか */
    isSyncing,
    /** 手動同期を実行 */
    sync: handleManualSync,
    /** 未同期アイテム数を更新 */
    refreshPendingCount: updatePendingCount,
  };
}











