/**
 * コンフリクト検出システム
 *
 * オフライン中に変更されたデータとサーバー側のデータの競合を検出
 */

// =============================================================================
// コンフリクト型定義
// =============================================================================

/**
 * コンフリクト情報
 */
export interface Conflict {
  /** コンフリクトID */
  id: string;
  /** データタイプ（job, work_order, diagnosis等） */
  dataType: string;
  /** データID */
  dataId: string;
  /** ローカル側のデータ */
  localData: unknown;
  /** サーバー側のデータ */
  serverData: unknown;
  /** コンフリクトが発生したフィールド */
  conflictedFields: string[];
  /** 検出日時 */
  detectedAt: string; // ISO 8601
  /** 解決済みかどうか */
  resolved: boolean;
}

/**
 * コンフリクト解決方法
 */
export type ConflictResolution = "local" | "server" | "merge";

/**
 * コンフリクト解決結果
 */
export interface ConflictResolutionResult {
  /** 解決方法 */
  resolution: ConflictResolution;
  /** 解決後のデータ */
  resolvedData: unknown;
}

// =============================================================================
// コンフリクト検出
// =============================================================================

/**
 * 2つのデータオブジェクト間のコンフリクトを検出
 */
export function detectConflicts(
  localData: Record<string, unknown>,
  serverData: Record<string, unknown>,
  dataType: string,
  dataId: string
): Conflict | null {
  const conflictedFields: string[] = [];

  // 両方のデータに存在するフィールドを比較
  const allFields = new Set([
    ...Object.keys(localData),
    ...Object.keys(serverData),
  ]);

  for (const field of allFields) {
    const localValue = localData[field];
    const serverValue = serverData[field];

    // 値が異なる場合、コンフリクトとみなす
    if (localValue !== serverValue) {
      // オブジェクトや配列の場合は深い比較が必要だが、簡易実装として文字列比較
      if (JSON.stringify(localValue) !== JSON.stringify(serverValue)) {
        conflictedFields.push(field);
      }
    }
  }

  // コンフリクトがない場合はnullを返す
  if (conflictedFields.length === 0) {
    return null;
  }

  return {
    id: `conflict-${dataType}-${dataId}-${Date.now()}`,
    dataType,
    dataId,
    localData,
    serverData,
    conflictedFields,
    detectedAt: new Date().toISOString(),
    resolved: false,
  };
}

/**
 * 複数のデータ間のコンフリクトを一括検出
 */
export function detectMultipleConflicts(
  localDataList: Array<{ id: string; data: Record<string, unknown> }>,
  serverDataList: Array<{ id: string; data: Record<string, unknown> }>,
  dataType: string
): Conflict[] {
  const conflicts: Conflict[] = [];

  // ローカルデータごとにサーバーデータと比較
  for (const localItem of localDataList) {
    const serverItem = serverDataList.find((item) => item.id === localItem.id);
    if (!serverItem) {
      // サーバーに存在しない場合は新規作成として扱う（コンフリクトではない）
      continue;
    }

    const conflict = detectConflicts(
      localItem.data,
      serverItem.data,
      dataType,
      localItem.id
    );

    if (conflict) {
      conflicts.push(conflict);
    }
  }

  return conflicts;
}

// =============================================================================
// コンフリクト解決
// =============================================================================

/**
 * コンフリクトを解決（ローカル優先）
 */
export function resolveConflictWithLocal(conflict: Conflict): ConflictResolutionResult {
  return {
    resolution: "local",
    resolvedData: conflict.localData,
  };
}

/**
 * コンフリクトを解決（サーバー優先）
 */
export function resolveConflictWithServer(conflict: Conflict): ConflictResolutionResult {
  return {
    resolution: "server",
    resolvedData: conflict.serverData,
  };
}

/**
 * コンフリクトを解決（マージ）
 */
export function resolveConflictWithMerge(
  conflict: Conflict,
  mergeStrategy: (local: unknown, server: unknown) => unknown
): ConflictResolutionResult {
  const mergedData = mergeStrategy(conflict.localData, conflict.serverData);
  return {
    resolution: "merge",
    resolvedData: mergedData,
  };
}

/**
 * デフォルトのマージ戦略（ローカルの値を優先）
 */
export function defaultMergeStrategy(local: unknown, server: unknown): unknown {
  // 簡易実装: ローカルの値を優先
  // 実際の実装では、フィールドごとに適切なマージロジックを実装
  return local;
}
















