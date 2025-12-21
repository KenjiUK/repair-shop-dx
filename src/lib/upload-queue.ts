/**
 * ファイルアップロードキュー管理
 *
 * オフライン中にアップロードできなかったファイルをキューに保存し、
 * オンライン復帰時に自動的にアップロード
 */

import {
  saveToIndexedDB,
  getFromIndexedDB,
  getAllFromIndexedDB,
  deleteFromIndexedDB,
  STORE_NAMES,
} from "./offline-storage";

// =============================================================================
// アップロードキューエントリ型定義
// =============================================================================

/**
 * アップロードキューエントリ
 */
export interface UploadQueueEntry {
  /** キューID */
  id: string;
  /** ファイル名 */
  fileName: string;
  /** ファイルタイプ（MIME type） */
  fileType: string;
  /** ファイルサイズ（バイト） */
  fileSize: number;
  /** ファイルデータ（Blob） */
  fileData: Blob;
  /** アップロード先URL */
  uploadUrl: string;
  /** アップロード先フォルダID（Google Drive等） */
  folderId?: string;
  /** メタデータ（追加情報） */
  metadata?: Record<string, unknown>;
  /** ステータス */
  status: "pending" | "uploading" | "completed" | "failed";
  /** エラーメッセージ（失敗時） */
  error?: string;
  /** 作成日時 */
  createdAt: string; // ISO 8601
  /** 更新日時 */
  updatedAt: string; // ISO 8601
  /** リトライ回数 */
  retryCount: number;
}

// =============================================================================
// アップロードキュー管理
// =============================================================================

/**
 * ファイルをアップロードキューに追加
 */
export async function addToUploadQueue(
  file: File | Blob,
  options: {
    uploadUrl: string;
    folderId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<string> {
  const entryId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const entry: UploadQueueEntry = {
    id: entryId,
    fileName: file instanceof File ? file.name : `file-${entryId}`,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    fileData: file,
    uploadUrl: options.uploadUrl,
    folderId: options.folderId,
    metadata: options.metadata,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    retryCount: 0,
  };

  await saveToIndexedDB(STORE_NAMES.FILES, entry);
  return entryId;
}

/**
 * アップロードキューから取得（pendingのみ）
 */
export async function getPendingUploadQueue(): Promise<UploadQueueEntry[]> {
  const allEntries = await getAllFromIndexedDB<UploadQueueEntry>(STORE_NAMES.FILES);
  return allEntries.filter((entry) => entry.status === "pending");
}

/**
 * アップロードキューエントリを取得
 */
export async function getUploadQueueEntry(id: string): Promise<UploadQueueEntry | null> {
  return await getFromIndexedDB<UploadQueueEntry>(STORE_NAMES.FILES, id);
}

/**
 * アップロードキューエントリのステータスを更新
 */
export async function updateUploadQueueStatus(
  id: string,
  status: UploadQueueEntry["status"],
  error?: string
): Promise<void> {
  const entry = await getFromIndexedDB<UploadQueueEntry>(STORE_NAMES.FILES, id);
  if (!entry) return;

  entry.status = status;
  entry.updatedAt = new Date().toISOString();
  if (error) {
    entry.error = error;
  }
  if (status === "uploading") {
    entry.retryCount = (entry.retryCount || 0) + 1;
  }

  await saveToIndexedDB(STORE_NAMES.FILES, entry);
}

/**
 * アップロードキューエントリを削除（完了またはキャンセル時）
 */
export async function removeFromUploadQueue(id: string): Promise<void> {
  await deleteFromIndexedDB(STORE_NAMES.FILES, id);
}

/**
 * アップロードキューをクリア（完了済みのみ）
 */
export async function clearCompletedUploadQueue(): Promise<void> {
  const allEntries = await getAllFromIndexedDB<UploadQueueEntry>(STORE_NAMES.FILES);
  const completedEntries = allEntries.filter((entry) => entry.status === "completed");

  for (const entry of completedEntries) {
    await deleteFromIndexedDB(STORE_NAMES.FILES, entry.id);
  }
}

// =============================================================================
// アップロード処理
// =============================================================================

/**
 * ファイルをアップロード
 */
export async function uploadFile(entry: UploadQueueEntry): Promise<void> {
  // ステータスを「アップロード中」に更新
  await updateUploadQueueStatus(entry.id, "uploading");

  try {
    // FormDataを作成
    const formData = new FormData();
    formData.append("file", entry.fileData, entry.fileName);
    if (entry.folderId) {
      formData.append("folderId", entry.folderId);
    }
    if (entry.metadata) {
      formData.append("metadata", JSON.stringify(entry.metadata));
    }

    // アップロード実行
    const response = await fetch(entry.uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`アップロードに失敗しました: ${response.statusText}`);
    }

    // ステータスを「完了」に更新
    await updateUploadQueueStatus(entry.id, "completed");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await updateUploadQueueStatus(entry.id, "failed", errorMessage);
    throw error;
  }
}

/**
 * アップロードキューを処理（pendingのエントリを順次アップロード）
 */
export async function processUploadQueue(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ entry: UploadQueueEntry; error: string }>;
}> {
  const pendingEntries = await getPendingUploadQueue();
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ entry: UploadQueueEntry; error: string }>,
  };

  for (const entry of pendingEntries) {
    try {
      await uploadFile(entry);
      results.success++;
    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.errors.push({ entry, error: errorMessage });
    }
  }

  return results;
}
















