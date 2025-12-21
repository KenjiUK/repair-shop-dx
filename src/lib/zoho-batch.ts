/**
 * Zoho CRM API バッチ処理
 *
 * 複数の更新をまとめて処理し、API呼び出し回数を削減
 */

import { ApiResponse } from "@/types";

// =============================================================================
// 型定義
// =============================================================================

/**
 * バッチ更新エントリ
 */
export interface BatchUpdateEntry {
  /** リソースタイプ */
  resourceType: "job" | "customer" | "vehicle";
  /** リソースID */
  resourceId: string;
  /** 更新データ */
  data: Record<string, unknown>;
}

/**
 * バッチ更新結果
 */
export interface BatchUpdateResult {
  /** 成功した更新 */
  success: Array<{ entry: BatchUpdateEntry; result: unknown }>;
  /** 失敗した更新 */
  failed: Array<{ entry: BatchUpdateEntry; error: string }>;
}

// =============================================================================
// バッチ処理キュー
// =============================================================================

let batchQueue: BatchUpdateEntry[] = [];
let batchTimer: NodeJS.Timeout | null = null;
const BATCH_DELAY = 500; // 500ms待機してからバッチ処理
const MAX_BATCH_SIZE = 10; // 最大バッチサイズ

/**
 * バッチキューに追加
 */
export function addToBatchQueue(entry: BatchUpdateEntry): Promise<ApiResponse<unknown>> {
  return new Promise((resolve, reject) => {
    batchQueue.push(entry);

    // バッチサイズに達したら即座に処理
    if (batchQueue.length >= MAX_BATCH_SIZE) {
      processBatchQueue().then(resolve).catch(reject);
      return;
    }

    // タイマーをリセット
    if (batchTimer) {
      clearTimeout(batchTimer);
    }

    batchTimer = setTimeout(() => {
      processBatchQueue().then(resolve).catch(reject);
    }, BATCH_DELAY);
  });
}

/**
 * バッチキューを処理
 */
async function processBatchQueue(): Promise<ApiResponse<unknown>> {
  if (batchQueue.length === 0) {
    return {
      success: true,
      data: { processed: 0 },
    };
  }

  const entriesToProcess = [...batchQueue];
  batchQueue = [];

  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }

  try {
    // バッチ更新を実行
    const result = await executeBatchUpdate(entriesToProcess);

    // 結果を返す
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "BATCH_ERROR",
        message: error instanceof Error ? error.message : "バッチ処理に失敗しました",
      },
    };
  }
}

/**
 * バッチ更新を実行
 * 
 * Zoho CRM APIのバッチ更新エンドポイントを呼び出す
 */
async function executeBatchUpdate(
  entries: BatchUpdateEntry[]
): Promise<BatchUpdateResult> {
  try {
    // バッチ更新エンドポイントを呼び出す
    const response = await fetch("/api/zoho/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entries }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `バッチ更新に失敗しました（ステータス: ${response.status}）`
      );
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      throw new Error("バッチ更新のレスポンスが不正です");
    }

    return data.data as BatchUpdateResult;
  } catch (error) {
    // エラーが発生した場合、すべてのエントリを失敗として扱う
    const result: BatchUpdateResult = {
      success: [],
      failed: entries.map((entry) => ({
        entry,
        error: error instanceof Error ? error.message : "バッチ処理中にエラーが発生しました",
      })),
    };
    return result;
  }
}

/**
 * バッチキューを手動で処理
 */
export async function flushBatchQueue(): Promise<ApiResponse<unknown>> {
  return await processBatchQueue();
}

/**
 * バッチキューをクリア
 */
export function clearBatchQueue(): void {
  batchQueue = [];
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
}











