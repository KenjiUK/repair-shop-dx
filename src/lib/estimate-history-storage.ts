/**
 * 見積履歴ストレージ管理
 * 
 * localStorageを使用して見積履歴を保存・読み込み
 */

import { EstimateLineItem } from "@/types";
import type { EstimateVersion } from "@/components/features/estimate-history-diff-section";

const ESTIMATE_HISTORY_KEY = "estimate-history";

/**
 * 見積履歴を取得（ジョブIDとワークオーダーIDでフィルタ）
 */
export function getEstimateHistory(
  jobId: string,
  workOrderId?: string
): EstimateVersion[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(ESTIMATE_HISTORY_KEY);
    if (!stored) return [];
    const all = JSON.parse(stored) as Array<EstimateVersion & { jobId: string; workOrderId?: string }>;
    return all
      .filter((h) => h.jobId === jobId && (!workOrderId || h.workOrderId === workOrderId))
      .map(({ jobId: _, workOrderId: __, ...version }) => version)
      .sort((a, b) => a.version - b.version);
  } catch (error) {
    console.error("見積履歴の取得エラー:", error);
    return [];
  }
}

/**
 * 見積履歴を保存
 */
export function saveEstimateHistory(
  jobId: string,
  workOrderId: string | undefined,
  version: EstimateVersion
): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(ESTIMATE_HISTORY_KEY);
    const all: Array<EstimateVersion & { jobId: string; workOrderId?: string }> = stored
      ? JSON.parse(stored)
      : [];

    // 同じジョブID・ワークオーダーID・バージョンの履歴が既に存在する場合は更新
    const existingIndex = all.findIndex(
      (h) =>
        h.jobId === jobId &&
        h.workOrderId === workOrderId &&
        h.version === version.version
    );

    const historyWithMeta = {
      ...version,
      jobId,
      workOrderId,
    };

    if (existingIndex >= 0) {
      all[existingIndex] = historyWithMeta;
    } else {
      all.push(historyWithMeta);
    }

    localStorage.setItem(ESTIMATE_HISTORY_KEY, JSON.stringify(all));
  } catch (error) {
    console.error("見積履歴の保存エラー:", error);
    throw error;
  }
}

/**
 * 見積履歴を削除
 */
export function deleteEstimateHistory(
  jobId: string,
  workOrderId: string | undefined,
  version: number
): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(ESTIMATE_HISTORY_KEY);
    if (!stored) return;
    const all = JSON.parse(stored) as Array<
      EstimateVersion & { jobId: string; workOrderId?: string }
    >;
    const filtered = all.filter(
      (h) =>
        !(
          h.jobId === jobId &&
          h.workOrderId === workOrderId &&
          h.version === version
        )
    );
    localStorage.setItem(ESTIMATE_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("見積履歴の削除エラー:", error);
    throw error;
  }
}

/**
 * 次のバージョン番号を取得
 */
export function getNextVersionNumber(
  jobId: string,
  workOrderId?: string
): number {
  const history = getEstimateHistory(jobId, workOrderId);
  if (history.length === 0) return 1;
  return Math.max(...history.map((h) => h.version)) + 1;
}

/**
 * バージョンラベルを生成
 */
export function generateVersionLabel(version: number, context: "事前" | "受入れ" | "作業中"): string {
  return `v${version}（${context}）`;
}

