"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useOnlineStatus } from "./use-online-status";
import { saveToIndexedDB, addToSyncQueue, STORE_NAMES } from "@/lib/offline-storage";

/**
 * オフライン対応自動保存フック
 * 
 * 機能:
 * - Debounced自動保存（入力後一定時間経過で自動保存）
 * - 明示的な手動保存
 * - 保存状態の管理
 * - ページ離脱時の自動保存
 * - オフライン対応（IndexedDB + 同期キュー）
 */

interface UseAutoSaveWithOfflineOptions<T> {
  /** 保存するデータ */
  data: T;
  /** 保存関数（サーバーへの保存） */
  onSave: (data: T) => Promise<void> | void;
  /** 自動保存の遅延時間（ms、デフォルト: 2000ms） */
  debounceMs?: number;
  /** 自動保存を無効化するか */
  disabled?: boolean;
  /** データが変更されたかどうかを判定する関数（オプション） */
  isDirty?: (data: T) => boolean;
  /** 保存成功時のコールバック */
  onSaveSuccess?: () => void;
  /** 保存失敗時のコールバック */
  onSaveError?: (error: Error) => void;
  /** オフライン対応を有効にするか（デフォルト: true） */
  enableOffline?: boolean;
  /** IndexedDBのストア名 */
  storeName: string;
  /** データID（jobIdやworkOrderIdなど） */
  dataId: string;
  /** 同期時に使用する追加データ（workOrderIdなど） */
  syncMetadata?: Record<string, unknown>;
}

interface UseAutoSaveWithOfflineReturn {
  /** 保存状態: 'idle' | 'saving' | 'saved' | 'error' */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  /** 手動保存関数 */
  saveManually: () => Promise<void>;
  /** 未保存の変更があるか */
  hasUnsavedChanges: boolean;
  /** オフライン状態かどうか */
  isOffline: boolean;
  /** 同期待ちの件数 */
  pendingSyncCount: number;
}

/**
 * オフライン対応自動保存フック
 */
export function useAutoSaveWithOffline<T>({
  data,
  onSave,
  debounceMs = 2000,
  disabled = false,
  isDirty,
  onSaveSuccess,
  onSaveError,
  enableOffline = true,
  storeName,
  dataId,
  syncMetadata = {},
}: UseAutoSaveWithOfflineOptions<T>): UseAutoSaveWithOfflineReturn {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const isOnline = useOnlineStatus();

  // データのシリアライズ（変更検知用）
  const serializeData = useCallback((data: T): string => {
    try {
      return JSON.stringify(data);
    } catch {
      return String(data);
    }
  }, []);

  // データが変更されたかどうかを判定
  const checkIfDirty = useCallback(
    (currentData: T): boolean => {
      if (isDirty) {
        return isDirty(currentData);
      }
      const currentSerialized = serializeData(currentData);
      return currentSerialized !== lastSavedDataRef.current;
    },
    [isDirty, serializeData]
  );

  // IndexedDBに保存（オフライン対応）
  const saveToLocal = useCallback(async (dataToSave: T) => {
    if (!enableOffline) return;

    try {
      const dataForStorage = {
        id: dataId,
        data: dataToSave,
        timestamp: new Date().toISOString(),
        ...syncMetadata,
      };
      await saveToIndexedDB(storeName, dataForStorage);
    } catch (error) {
      console.error("[AutoSave] IndexedDBへの保存に失敗しました:", error);
    }
  }, [enableOffline, storeName, dataId, syncMetadata]);

  // 同期キューに追加（オフライン時）
  const addToSync = useCallback(async (dataToSave: T) => {
    if (!enableOffline) return;

    try {
      await addToSyncQueue({
        type: "update",
        storeName,
        dataId,
        data: {
          ...dataToSave,
          ...syncMetadata,
        },
        status: "pending",
      });
    } catch (error) {
      console.error("[AutoSave] 同期キューへの追加に失敗しました:", error);
    }
  }, [enableOffline, storeName, dataId, syncMetadata]);

  // 保存処理（オンライン/オフライン対応）
  const performSave = useCallback(
    async (dataToSave: T) => {
      if (disabled || !isMountedRef.current) return;

      // 変更がない場合は保存しない
      if (!checkIfDirty(dataToSave)) {
        setSaveStatus('idle');
        setHasUnsavedChanges(false);
        return;
      }

      setSaveStatus('saving');
      setHasUnsavedChanges(true);

      try {
        // 1. まずIndexedDBに保存（常に成功）
        await saveToLocal(dataToSave);

        // 2. オンライン時はサーバーに保存
        if (isOnline) {
          try {
            await onSave(dataToSave);
            // 成功したら同期キューから削除（既に追加されていた場合）
            // 注意: 実際の削除処理は同期マネージャーで行う
            if (isMountedRef.current) {
              lastSavedDataRef.current = serializeData(dataToSave);
              setSaveStatus('saved');
              setHasUnsavedChanges(false);
              onSaveSuccess?.();

              // 保存成功後、3秒後に'idle'に戻す
              setTimeout(() => {
                if (isMountedRef.current) {
                  setSaveStatus((prevStatus) => (prevStatus === 'saved' ? 'idle' : prevStatus));
                }
              }, 3000);
            }
          } catch (error) {
            // サーバー保存失敗時は同期キューに追加
            await addToSync(dataToSave);
            throw error;
          }
        } else {
          // オフライン時は同期キューに追加
          await addToSync(dataToSave);
          if (isMountedRef.current) {
            lastSavedDataRef.current = serializeData(dataToSave);
            setSaveStatus('saved');
            setHasUnsavedChanges(false);
            onSaveSuccess?.();

            // 保存成功後、3秒後に'idle'に戻す
            setTimeout(() => {
              if (isMountedRef.current) {
                setSaveStatus((prevStatus) => (prevStatus === 'saved' ? 'idle' : prevStatus));
              }
            }, 3000);
          }
        }
      } catch (error) {
        if (isMountedRef.current) {
          setSaveStatus('error');
          setHasUnsavedChanges(true);
          const err = error instanceof Error ? error : new Error('保存に失敗しました');
          onSaveError?.(err);
        }
      }
    },
    [disabled, checkIfDirty, onSave, onSaveSuccess, onSaveError, serializeData, isOnline, saveToLocal, addToSync]
  );

  // 手動保存
  const saveManually = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await performSave(data);
  }, [data, performSave]);

  // 自動保存（Debounced）
  useEffect(() => {
    if (disabled || !isMountedRef.current) return;

    // 既存のタイマーをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 変更があるかチェック
    const isDirty = checkIfDirty(data);
    if (!isDirty) {
      // 次のレンダリングサイクルで状態を更新
      if (hasUnsavedChanges) {
        const updateTimer = setTimeout(() => {
          setHasUnsavedChanges(false);
        }, 0);
        return () => clearTimeout(updateTimer);
      }
      return;
    }

    if (!hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }

    // Debounce: 指定時間経過後に自動保存
    saveTimeoutRef.current = setTimeout(() => {
      performSave(data);
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, debounceMs, disabled, checkIfDirty, performSave, hasUnsavedChanges]);

  // ページ離脱時の自動保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !disabled) {
        // 同期的な保存を試みる（localStorage等）
        // 注意: 非同期処理は実行されない可能性があるため、同期的な処理のみ
        try {
          // IndexedDBへの保存は非同期のため、同期的に保存できない
          // 代わりに、localStorageに一時保存
          const dataToSave = serializeData(data);
          localStorage.setItem(`draft_${storeName}_${dataId}`, dataToSave);
        } catch (error) {
          console.error("[AutoSave] ページ離脱時の保存に失敗しました:", error);
        }
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, disabled, data, serializeData, storeName, dataId]);

  // 同期待ち件数を更新
  useEffect(() => {
    if (!enableOffline) return;

    const updatePendingCount = async () => {
      try {
        const { getPendingSyncQueue } = await import("@/lib/offline-storage");
        const pending = await getPendingSyncQueue();
        const relevantPending = pending.filter(
          (entry) => entry.storeName === storeName && entry.dataId === dataId
        );
        setPendingSyncCount(relevantPending.length);
      } catch (error) {
        console.error("[AutoSave] 同期待ち件数の取得に失敗しました:", error);
      }
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // 5秒ごと
    return () => clearInterval(interval);
  }, [enableOffline, storeName, dataId]);

  // アンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    saveManually,
    hasUnsavedChanges,
    isOffline: !isOnline,
    pendingSyncCount,
  };
}

