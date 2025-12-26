/**
 * 承認待ち案件のフォローアップ機能ユーティリティ
 * 改善提案 #11: 承認待ち案件のフォローアップ機能の強化
 */

import { ZohoJob } from "@/types";

/**
 * 承認待ち期間を計算（日数）
 */
export function getPendingApprovalDays(job: ZohoJob): number {
  // 見積提示済みでない場合は0を返す
  if (job.field5 !== "見積提示済み") return 0;

  // 見積提出日時を取得（estimateSubmittedAtまたはfield22または見積作成日時）
  const jobWithEstimateDates = job as ZohoJob & {
    estimateSubmittedAt?: string;
    estimateCreatedAt?: string;
    createdAt?: string;
  };
  const submittedAt =
    jobWithEstimateDates.estimateSubmittedAt ||
    job.field22 ||
    jobWithEstimateDates.estimateCreatedAt ||
    jobWithEstimateDates.createdAt;

  if (!submittedAt) return 0;

  try {
    const submittedDate = new Date(submittedAt);
    const now = new Date();
    const diffTime = now.getTime() - submittedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  } catch {
    return 0;
  }
}

/**
 * 長期化している承認待ち案件かどうかを判定
 * @param job ジョブ
 * @param thresholdDays 閾値（デフォルト: 設定値から取得、設定値がない場合は3日）
 */
export function isLongPendingApproval(
  job: ZohoJob,
  thresholdDays?: number
): boolean {
  if (job.field5 !== "見積提示済み") return false;

  // 閾値が指定されていない場合は設定値から取得
  let finalThresholdDays = thresholdDays;
  if (finalThresholdDays === undefined) {
    try {
      const { getNumericalMasterConfig } = require("@/lib/numerical-master-config");
      const config = getNumericalMasterConfig();
      finalThresholdDays = config.thresholds.longPendingApprovalDays;
    } catch {
      finalThresholdDays = 3; // フォールバック
    }
  }

  const pendingDays = getPendingApprovalDays(job);
  return pendingDays >= (finalThresholdDays ?? 3);
}




