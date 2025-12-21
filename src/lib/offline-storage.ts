/**
 * オフラインストレージ管理
 *
 * IndexedDBとLocalStorageを使用したデータ永続化
 * - IndexedDB: 大容量データ（ファイル、画像、診断データ等）
 * - LocalStorage: 小容量データ（設定、キュー情報等）
 */

// =============================================================================
// IndexedDB管理
// =============================================================================

const DB_NAME = "repair-shop-dx";
const DB_VERSION = 1;

/**
 * IndexedDBストア名
 */
export const STORE_NAMES = {
  /** ジョブデータ */
  JOBS: "jobs",
  /** ワークオーダーデータ */
  WORK_ORDERS: "work_orders",
  /** 診断データ */
  DIAGNOSIS: "diagnosis",
  /** 見積データ */
  ESTIMATES: "estimates",
  /** 作業データ */
  WORK: "work",
  /** ファイルデータ（Blob） */
  FILES: "files",
  /** 同期キュー */
  SYNC_QUEUE: "sync_queue",
} as const;

/**
 * IndexedDBデータベースを開く
 */
export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("IndexedDBのオープンに失敗しました"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // ストアを作成
      if (!db.objectStoreNames.contains(STORE_NAMES.JOBS)) {
        db.createObjectStore(STORE_NAMES.JOBS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.WORK_ORDERS)) {
        db.createObjectStore(STORE_NAMES.WORK_ORDERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.DIAGNOSIS)) {
        db.createObjectStore(STORE_NAMES.DIAGNOSIS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.ESTIMATES)) {
        db.createObjectStore(STORE_NAMES.ESTIMATES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.WORK)) {
        db.createObjectStore(STORE_NAMES.WORK, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.FILES)) {
        db.createObjectStore(STORE_NAMES.FILES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.SYNC_QUEUE)) {
        const syncQueueStore = db.createObjectStore(STORE_NAMES.SYNC_QUEUE, {
          keyPath: "id",
          autoIncrement: true,
        });
        syncQueueStore.createIndex("timestamp", "timestamp", { unique: false });
        syncQueueStore.createIndex("status", "status", { unique: false });
      }
    };
  });
}

/**
 * IndexedDBにデータを保存
 */
export async function saveToIndexedDB<T extends { id: string }>(
  storeName: string,
  data: T
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("データの保存に失敗しました"));
  });
}

/**
 * IndexedDBからデータを取得
 */
export async function getFromIndexedDB<T extends { id: string }>(
  storeName: string,
  id: string
): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => {
      reject(new Error("データの取得に失敗しました"));
    };
  });
}

/**
 * IndexedDBから全データを取得
 */
export async function getAllFromIndexedDB<T extends { id: string }>(
  storeName: string
): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => {
      reject(new Error("データの取得に失敗しました"));
    };
  });
}

/**
 * IndexedDBからデータを削除
 */
export async function deleteFromIndexedDB(
  storeName: string,
  id: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("データの削除に失敗しました"));
  });
}

/**
 * IndexedDBストアをクリア
 */
export async function clearIndexedDBStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("ストアのクリアに失敗しました"));
  });
}

// =============================================================================
// LocalStorage管理
// =============================================================================

/**
 * LocalStorageにデータを保存
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("LocalStorageへの保存に失敗しました:", error);
  }
}

/**
 * LocalStorageからデータを取得
 */
export function getFromLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("LocalStorageからの取得に失敗しました:", error);
    return null;
  }
}

/**
 * LocalStorageからデータを削除
 */
export function removeFromLocalStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("LocalStorageからの削除に失敗しました:", error);
  }
}

/**
 * LocalStorageのキー一覧を取得
 */
export function getLocalStorageKeys(): string[] {
  if (typeof window === "undefined") return [];
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

// =============================================================================
// 同期キュー管理
// =============================================================================

/**
 * 同期キューエントリ
 */
export interface SyncQueueEntry {
  /** キューID（自動生成） */
  id?: number;
  /** 操作タイプ */
  type: "create" | "update" | "delete";
  /** ストア名 */
  storeName: string;
  /** データID */
  dataId: string;
  /** データ（更新・作成時） */
  data?: unknown;
  /** ステータス */
  status: "pending" | "syncing" | "synced" | "error";
  /** エラーメッセージ（エラー時） */
  error?: string;
  /** 作成日時 */
  timestamp: string; // ISO 8601
  /** リトライ回数 */
  retryCount: number;
}

/**
 * 同期キューに追加
 * 最適化: 重複チェック、優先度の設定
 */
export async function addToSyncQueue(
  entry: Omit<SyncQueueEntry, "id" | "timestamp" | "retryCount">,
  options?: {
    /** 重複チェックをスキップするか（デフォルト: false） */
    skipDuplicateCheck?: boolean;
  }
): Promise<void> {
  const { skipDuplicateCheck = false } = options || {};

  // 重複チェック（同じデータIDとタイプのpendingエントリが既に存在する場合は追加しない）
  if (!skipDuplicateCheck) {
    const existingEntries = await getPendingSyncQueue();
    const duplicate = existingEntries.find(
      (e) => e.storeName === entry.storeName && e.dataId === entry.dataId && e.type === entry.type
    );
    if (duplicate) {
      console.log("[Sync Queue] 重複エントリをスキップ:", entry.dataId);
      return;
    }
  }

  const queueEntry: SyncQueueEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    retryCount: 0,
  };
  await saveToIndexedDB(STORE_NAMES.SYNC_QUEUE, queueEntry as SyncQueueEntry & { id: string });
}

/**
 * 同期キューから取得（pendingのみ）
 */
export async function getPendingSyncQueue(): Promise<SyncQueueEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAMES.SYNC_QUEUE], "readonly");
    const store = transaction.objectStore(STORE_NAMES.SYNC_QUEUE);
    const index = store.index("status");
    const request = index.getAll("pending");

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => {
      reject(new Error("同期キューの取得に失敗しました"));
    };
  });
}

/**
 * 同期キューのステータスを更新
 */
export async function updateSyncQueueStatus(
  id: number,
  status: SyncQueueEntry["status"],
  error?: string
): Promise<void> {
  const entry = await getFromIndexedDB<SyncQueueEntry & { id: number }>(
    STORE_NAMES.SYNC_QUEUE,
    id.toString()
  );
  if (!entry) return;

  entry.status = status;
  if (error) entry.error = error;
  if (status === "syncing") {
    entry.retryCount = (entry.retryCount || 0) + 1;
  }
  entry.updatedAt = new Date().toISOString();

  await saveToIndexedDB(STORE_NAMES.SYNC_QUEUE, entry as SyncQueueEntry & { id: string });
}











