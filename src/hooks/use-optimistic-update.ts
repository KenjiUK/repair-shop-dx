/**
 * オプティミスティックUI更新フック
 * 
 * SWRと組み合わせて、即座にUIを更新し、その後サーバーと同期する
 */

import { useCallback } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

// =============================================================================
// Types
// =============================================================================

/**
 * オプティミスティック更新オプション
 */
export interface OptimisticUpdateOptions<T> {
  /** キャッシュキー */
  cacheKey: string;
  /** 更新関数（サーバーに送信） */
  updateFn: (data: T) => Promise<T>;
  /** 楽観的更新データ（即座にUIに反映） */
  optimisticData: T | ((currentData: T | undefined) => T);
  /** ロールバック用の元データ */
  rollbackData?: T | ((currentData: T | undefined) => T);
  /** 成功メッセージ */
  successMessage?: string;
  /** エラーメッセージ */
  errorMessage?: string;
  /** 成功時のコールバック */
  onSuccess?: (data: T) => void;
  /** エラー時のコールバック */
  onError?: (error: Error) => void;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * オプティミスティックUI更新フック
 * 
 * @example
 * ```tsx
 * const { mutate } = useOptimisticUpdate();
 * 
 * await mutate({
 *   cacheKey: `/api/jobs/${jobId}`,
 *   updateFn: (data) => updateJob(jobId, data),
 *   optimisticData: { ...currentData, status: "作業待ち" },
 *   successMessage: "ステータスを更新しました",
 * });
 * ```
 */
export function useOptimisticUpdate() {
  const { mutate, cache } = useSWRConfig();

  const optimisticMutate = useCallback(
    async <T,>(options: OptimisticUpdateOptions<T>): Promise<T | undefined> => {
      const {
        cacheKey,
        updateFn,
        optimisticData,
        rollbackData,
        successMessage,
        errorMessage,
        onSuccess,
        onError,
      } = options;

      // 現在のキャッシュデータを取得
      const currentData = cache.get(cacheKey)?.data as T | undefined;

      // 楽観的更新データを計算
      const newData =
        typeof optimisticData === "function"
          ? (optimisticData as (currentData: T | undefined) => T)(currentData)
          : optimisticData;

      // 即座にUIを更新（楽観的更新）
      await mutate(cacheKey, newData, {
        optimisticData: newData,
        rollbackOnError: true,
        populateCache: false, // サーバーからの応答で上書きするため
      });

      try {
        // サーバーに更新を送信
        const serverData = await updateFn(newData);

        // サーバーからの応答でキャッシュを更新
        await mutate(cacheKey, serverData, {
          revalidate: false, // 既に最新データなので再検証不要
        });

        // 成功メッセージ
        if (successMessage) {
          toast.success(successMessage);
        }

        // 成功コールバック
        if (onSuccess) {
          onSuccess(serverData);
        }

        return serverData;
      } catch (error) {
        // エラー時はロールバック
        const rollback =
          rollbackData !== undefined
            ? typeof rollbackData === "function"
              ? rollbackData(currentData)
              : rollbackData
            : currentData;

        await mutate(cacheKey, rollback, {
          revalidate: true, // エラー時は再検証して最新データを取得
        });

        // エラーメッセージ
        const errorMsg =
          errorMessage ||
          (error instanceof Error ? error.message : "更新に失敗しました");
        toast.error(errorMsg);

        // エラーコールバック
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMsg));
        }

        throw error;
      }
    },
    [mutate, cache]
  );

  return { mutate: optimisticMutate };
}















