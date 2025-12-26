/**
 * 見積変更依頼ストレージ管理
 * 改善提案 #10: 見積変更依頼の履歴管理機能
 *
 * localStorageを使用して見積変更依頼を保存・読み込み
 */

import { EstimateChangeRequest } from "@/types";
import { getCurrentMechanicName } from "@/lib/auth";

const ESTIMATE_CHANGE_REQUESTS_KEY = "estimate-change-requests";

/**
 * 見積変更依頼を取得（ジョブIDでフィルタ）
 */
export function getEstimateChangeRequests(
  jobId: string
): EstimateChangeRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(ESTIMATE_CHANGE_REQUESTS_KEY);
    if (!stored) return [];
    const all = JSON.parse(stored) as EstimateChangeRequest[];
    return all.filter((req) => req.jobId === jobId);
  } catch (error) {
    console.error("見積変更依頼の取得エラー:", error);
    return [];
  }
}

/**
 * 見積変更依頼を保存
 */
export function saveEstimateChangeRequest(
  request: EstimateChangeRequest
): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(ESTIMATE_CHANGE_REQUESTS_KEY);
    const all: EstimateChangeRequest[] = stored ? JSON.parse(stored) : [];
    const existingIndex = all.findIndex((r) => r.id === request.id);

    if (existingIndex >= 0) {
      // 既存の依頼を更新
      all[existingIndex] = {
        ...request,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // 新しい依頼を追加
      all.push(request);
    }

    localStorage.setItem(
      ESTIMATE_CHANGE_REQUESTS_KEY,
      JSON.stringify(all)
    );
  } catch (error) {
    console.error("見積変更依頼の保存エラー:", error);
    throw error;
  }
}

/**
 * 見積変更依頼を削除
 */
export function deleteEstimateChangeRequest(requestId: string): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(ESTIMATE_CHANGE_REQUESTS_KEY);
    if (!stored) return;
    const all = JSON.parse(stored) as EstimateChangeRequest[];
    const filtered = all.filter((r) => r.id !== requestId);
    localStorage.setItem(
      ESTIMATE_CHANGE_REQUESTS_KEY,
      JSON.stringify(filtered)
    );
  } catch (error) {
    console.error("見積変更依頼の削除エラー:", error);
    throw error;
  }
}

/**
 * 変更依頼IDを生成
 */
export function generateChangeRequestId(): string {
  return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 現在のユーザー名を取得（対応者用）
 */
export function getCurrentUser(): string {
  return getCurrentMechanicName() || "システム";
}




