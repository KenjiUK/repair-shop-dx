/**
 * 長期プロジェクト管理ユーティリティ
 *
 * レストアと板金・塗装の長期プロジェクトの進捗データを抽出・計算する関数群
 */

import { ZohoJob, ServiceKind } from "@/types";
import { LongTermProjectData } from "@/components/features/long-term-project-card";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ジョブが長期プロジェクトかどうかを判定
 */
export function isLongTermProject(job: ZohoJob): boolean {
  const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  return (
    serviceKinds.includes("レストア" as ServiceKind) ||
    serviceKinds.includes("板金・塗装" as ServiceKind)
  );
}

/**
 * レストアプロジェクトの進捗データを抽出
 */
function extractRestoreProgress(job: ZohoJob): {
  progress: number;
  isDelayed: boolean;
  startDate?: string;
  expectedCompletionDate?: string;
  currentPhase?: string;
} {
  // workDataから進捗情報を取得（JSON形式で保存されている想定）
  const workData = (job as any).workData;
  if (!workData || !workData.restoreWorkData) {
    return {
      progress: 0,
      isDelayed: false,
    };
  }

  const restoreWorkData = workData.restoreWorkData;
  const overallProgress = restoreWorkData.overallProgress || 0;
  const phases = restoreWorkData.phases || [];

  // 現在のフェーズを取得（作業中の最初のフェーズ）
  const currentPhase = phases.find((p: any) => p.status === "作業中")?.name || 
                       phases.find((p: any) => p.status === "未開始")?.name ||
                       phases[phases.length - 1]?.name;

  // 開始日を取得（最初のフェーズの開始日）
  const startDate = phases.find((p: any) => p.startDate)?.startDate;

  // 予定完了日を取得（estimateDataから作業期間を計算）
  const estimateData = (job as any).estimateData;
  const workDuration = estimateData?.restoreEstimateData?.workDuration;
  let expectedCompletionDate: string | undefined;
  if (startDate && workDuration) {
    const start = new Date(startDate);
    // workDurationは月単位の想定
    start.setMonth(start.getMonth() + (workDuration || 0));
    expectedCompletionDate = start.toISOString();
  }

  // 遅延チェック
  const isDelayed = expectedCompletionDate
    ? new Date() > new Date(expectedCompletionDate) && overallProgress < 100
    : false;

  return {
    progress: overallProgress,
    isDelayed,
    startDate,
    expectedCompletionDate,
    currentPhase,
  };
}

/**
 * 板金・塗装プロジェクトの進捗データを抽出
 */
function extractBodyPaintProgress(job: ZohoJob): {
  progress: number;
  isDelayed: boolean;
  startDate?: string;
  expectedCompletionDate?: string;
  currentPhase?: string;
} {
  // workDataから進捗情報を取得
  const workData = (job as any).workData;
  if (!workData || !workData.bodyPaintOutsourcingInfo) {
    return {
      progress: 0,
      isDelayed: false,
    };
  }

  const outsourcingInfo = workData.bodyPaintOutsourcingInfo;
  const progressPercentage = outsourcingInfo.progressPercentage || 0;
  const progress = outsourcingInfo.progress || "発注済み";
  const isDelayed = outsourcingInfo.isDelayed || false;

  // 現在のステータスを表示用に変換
  const currentPhaseMap: Record<string, string> = {
    発注済み: "発注済み",
    作業中: "作業中",
    作業完了: "作業完了",
    引き取り済み: "引き取り済み",
  };
  const currentPhase = currentPhaseMap[progress] || progress;

  return {
    progress: progressPercentage,
    isDelayed,
    startDate: outsourcingInfo.orderDate,
    expectedCompletionDate: outsourcingInfo.expectedCompletionDate,
    currentPhase,
  };
}

/**
 * ジョブから長期プロジェクトデータを抽出
 */
export function extractLongTermProjectData(job: ZohoJob): LongTermProjectData | null {
  if (!isLongTermProject(job)) {
    return null;
  }

  const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  const isRestore = serviceKinds.includes("レストア" as ServiceKind);
  const isBodyPaint = serviceKinds.includes("板金・塗装" as ServiceKind);

  let progressData: {
    progress: number;
    isDelayed: boolean;
    startDate?: string;
    expectedCompletionDate?: string;
    currentPhase?: string;
  };

  if (isRestore) {
    progressData = extractRestoreProgress(job);
  } else if (isBodyPaint) {
    progressData = extractBodyPaintProgress(job);
  } else {
    return null;
  }

  // 車両情報を抽出
  const vehicleInfo = typeof job.field6 === "string" ? job.field6 : (job.field6?.name || "");
  const vehicleParts = vehicleInfo ? vehicleInfo.split(" / ") : [];
  const vehicleName = vehicleParts[0] || "車両未登録";
  const licensePlate = vehicleParts[1] || undefined;

  return {
    jobId: job.id,
    customerName: job.field4?.name || "顧客未登録",
    vehicleName,
    licensePlate,
    serviceKind: (isRestore ? "レストア" : "板金・塗装") as ServiceKind,
    progress: progressData.progress,
    isDelayed: progressData.isDelayed,
    startDate: progressData.startDate,
    expectedCompletionDate: progressData.expectedCompletionDate,
    currentPhase: progressData.currentPhase,
    job,
  };
}

/**
 * 全ジョブから長期プロジェクトを抽出
 */
export function extractLongTermProjects(jobs: ZohoJob[]): LongTermProjectData[] {
  return jobs
    .map((job) => extractLongTermProjectData(job))
    .filter((project): project is LongTermProjectData => project !== null);
}









