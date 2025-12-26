"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * 自動保存フック
 * 
 * 機能:
 * - Debounced自動保存（入力後一定時間経過で自動保存）
 * - 明示的な手動保存
 * - 保存状態の管理
 * - ページ離脱時の自動保存
 */

interface UseAutoSaveOptions<T> {
  /** 保存するデータ */
  data: T;
  /** 保存関数 */
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
}

interface UseAutoSaveReturn {
  /** 保存状態: 'idle' | 'saving' | 'saved' | 'error' */
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  /** 手動保存関数 */
  saveManually: () => Promise<void>;
  /** 未保存の変更があるか */
  hasUnsavedChanges: boolean;
}

/**
 * 自動保存フック
 */
export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 2000,
  disabled = false,
  isDirty,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

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

  // 保存処理
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
        await onSave(dataToSave);
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
        if (isMountedRef.current) {
          setSaveStatus('error');
          setHasUnsavedChanges(true);
          const err = error instanceof Error ? error : new Error('保存に失敗しました');
          onSaveError?.(err);
        }
      }
    },
    [disabled, checkIfDirty, onSave, onSaveSuccess, onSaveError, serializeData]
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
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, disabled]);

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
  };
}

