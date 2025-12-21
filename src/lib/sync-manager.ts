/**
 * 同期管理システム
 *
 * オンライン復帰時の自動同期処理を管理
 * 同期キューから順次処理を実行
 */

import {
  getPendingSyncQueue,
  updateSyncQueueStatus,
  SyncQueueEntry,
  STORE_NAMES,
} from "./offline-storage";
import { ErrorCodes } from "./error-handling";

// =============================================================================
// 同期処理の型定義
// =============================================================================

/**
 * 同期処理関数の型
 */
type SyncHandler = (entry: SyncQueueEntry) => Promise<void>;

/**
 * ストア名ごとの同期ハンドラー
 */
const syncHandlers: Record<string, SyncHandler> = {
  // 各ストアごとの同期処理を実装
  // 例: [STORE_NAMES.JOBS]: async (entry) => { ... }
};

// =============================================================================
// 同期処理
// =============================================================================

/**
 * 同期キューエントリを処理
 * 最適化: エラーハンドリングの強化、リトライロジックの改善
 */
async function processSyncEntry(entry: SyncQueueEntry): Promise<void> {
  try {
    // ステータスを「同期中」に更新
    if (entry.id) {
      await updateSyncQueueStatus(entry.id, "syncing");
    }

    // ストア名に応じた同期処理を実行
    const handler = syncHandlers[entry.storeName];
    if (!handler) {
      throw new Error(`ストア "${entry.storeName}" の同期ハンドラーが登録されていません`);
    }

    await handler(entry);

    // ステータスを「同期済み」に更新
    if (entry.id) {
      await updateSyncQueueStatus(entry.id, "synced");
    }
  } catch (error) {
    // エラーを記録（リトライ可能なエラーの場合はpendingに戻す）
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRetryable = isRetryableError(error);
    const retryCount = entry.retryCount || 0;
    
    if (entry.id) {
      if (isRetryable && retryCount < 3) {
        // リトライ可能なエラーの場合はpendingに戻す
        await updateSyncQueueStatus(entry.id, "pending", errorMessage);
      } else {
        // リトライ不可能または上限に達した場合はerrorにする
        await updateSyncQueueStatus(entry.id, "error", errorMessage);
      }
    }
    throw error;
  }
}

/**
 * リトライ可能なエラーかどうかを判定
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // ネットワークエラー、タイムアウトエラーはリトライ可能
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /503/i, // Service Unavailable
      /502/i, // Bad Gateway
      /504/i, // Gateway Timeout
    ];
    
    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }
  return false;
}

/**
 * 同期キューを処理（pendingのエントリを順次処理）
 * 最適化: 優先度に基づいてソート、バッチ処理、リトライ制限
 */
export async function processSyncQueue(options?: {
  /** バッチサイズ（同時処理数、デフォルト: 5） */
  batchSize?: number;
  /** 最大リトライ回数（デフォルト: 3） */
  maxRetries?: number;
}): Promise<{
  success: number;
  failed: number;
  errors: Array<{ entry: SyncQueueEntry; error: string }>;
}> {
  const { batchSize = 5, maxRetries = 3 } = options || {};
  const pendingEntries = await getPendingSyncQueue();
  
  if (pendingEntries.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  // 優先度に基づいてソート（作成日時の古い順、リトライ回数の少ない順）
  const sortedEntries = pendingEntries.sort((a, b) => {
    // リトライ回数が少ないものを優先
    const aRetry = a.retryCount || 0;
    const bRetry = b.retryCount || 0;
    if (aRetry !== bRetry) {
      return aRetry - bRetry;
    }
    // 作成日時が古いものを優先
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  // リトライ回数が上限を超えているエントリを除外
  const validEntries = sortedEntries.filter((entry) => (entry.retryCount || 0) < maxRetries);

  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ entry: SyncQueueEntry; error: string }>,
  };

  // バッチ処理
  for (let i = 0; i < validEntries.length; i += batchSize) {
    const batch = validEntries.slice(i, i + batchSize);
    
    // バッチ内のエントリを並列処理
    const batchResults = await Promise.allSettled(
      batch.map((entry) => processSyncEntry(entry))
    );

    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.success++;
      } else {
        results.failed++;
        const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);
        results.errors.push({ entry: batch[index], error: errorMessage });
      }
    });
  }

  return results;
}

/**
 * 同期ハンドラーを登録
 */
export function registerSyncHandler(storeName: string, handler: SyncHandler): void {
  syncHandlers[storeName] = handler;
}

// =============================================================================
// 自動同期管理
// =============================================================================

let syncIntervalId: NodeJS.Timeout | null = null;
let isSyncing = false;

/**
 * 自動同期を開始
 */
export function startAutoSync(intervalMs: number = 30000): void {
  if (syncIntervalId) {
    stopAutoSync();
  }

  syncIntervalId = setInterval(async () => {
    if (isSyncing) return;
    if (typeof window === "undefined" || !navigator.onLine) return;

    isSyncing = true;
    try {
      await processSyncQueue({ batchSize: 5, maxRetries: 3 });
    } catch (error) {
      console.error("[Sync Manager] 自動同期エラー:", error);
    } finally {
      isSyncing = false;
    }
  }, intervalMs);
}

/**
 * 自動同期を停止
 */
export function stopAutoSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

/**
 * 手動同期を実行
 */
export async function manualSync(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ entry: SyncQueueEntry; error: string }>;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    throw new Error("オフライン状態では同期できません");
  }

  if (isSyncing) {
    throw new Error("既に同期処理が実行中です");
  }

  isSyncing = true;
  try {
    return await processSyncQueue({ batchSize: 5, maxRetries: 3 });
  } finally {
    isSyncing = false;
  }
}











