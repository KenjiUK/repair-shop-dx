/**
 * 長期プロジェクト管理ユーティリティ
 *
 * レストアと板金・塗装の長期プロジェクトの進捗データを抽出・計算する関数群
 * 
 * 【重要】用語の定義:
 * - 入庫案件 (ZohoJob): 1つの車両の入庫単位
 * - 作業オーダー (WorkOrder): 1つの作業単位（車検、板金・塗装など）
 * 
 * 長期プロジェクトの判定は作業オーダー単位で行う（複合業務対応）
 */

import { ZohoJob, ServiceKind, WorkOrder } from "@/types";
import { LongTermProjectData } from "@/components/features/long-term-project-card";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 作業オーダーが長期プロジェクトかどうかを判定
 * 
 * 【推奨】作業オーダー単位での判定（複合業務対応）
 * 
 * @param workOrder 作業オーダー
 * @returns 長期プロジェクトの場合true
 */
export function isLongTermWorkOrder(workOrder: WorkOrder): boolean {
  return (
    workOrder.serviceKind === "レストア" ||
    workOrder.serviceKind === "板金・塗装"
  );
}

/**
 * 入庫案件が長期プロジェクトを含むかどうかを判定
 * 
 * 【非推奨】入庫案件単位での判定（複合業務で問題が発生する可能性あり）
 * 後方互換性のため残すが、新しいコードでは`hasLongTermWorkOrder`を使用すること
 * 
 * @deprecated 作業オーダー単位での判定に移行予定
 * @param job 入庫案件
 * @returns 長期プロジェクトを含む場合true
 */
export function isLongTermProject(job: ZohoJob): boolean {
  const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  return (
    serviceKinds.includes("レストア" as ServiceKind) ||
    serviceKinds.includes("板金・塗装" as ServiceKind)
  );
}

/**
 * 入庫案件が長期プロジェクトの作業オーダーを含むかどうかを判定
 * 
 * 【推奨】作業オーダー単位での判定（複合業務対応）
 * 
 * @param job 入庫案件
 * @param workOrders 作業オーダー一覧（省略時はjobから取得を試みる）
 * @returns 長期プロジェクトの作業オーダーを含む場合true
 */
export function hasLongTermWorkOrder(job: ZohoJob, workOrders?: WorkOrder[]): boolean {
  // workOrdersが提供されていない場合、後方互換性のため入庫案件単位で判定
  if (!workOrders || workOrders.length === 0) {
    return isLongTermProject(job);
  }
  
  // 作業オーダー単位で判定
  return workOrders.some(wo => isLongTermWorkOrder(wo));
}

/**
 * 作業オーダーからレストアプロジェクトの進捗データを抽出
 * 
 * 【推奨】作業オーダー単位での進捗データ抽出（複合業務対応）
 * 
 * @param workOrder 作業オーダー
 * @returns 進捗データ（長期プロジェクトでない場合はnull）
 */
export function extractRestoreProgressFromWorkOrder(workOrder: WorkOrder): {
  progress: number;
  isDelayed: boolean;
  startDate?: string;
  expectedCompletionDate?: string;
  currentPhase?: string;
} | null {
  if (workOrder.serviceKind !== "レストア") {
    return null;
  }

  // work.restoreWorkDataから進捗情報を取得
  const workData = workOrder.work as {
    restoreWorkData?: {
      overallProgress?: number;
      phases?: Array<{
        name?: string;
        status?: string;
        startDate?: string;
        expectedEndDate?: string;
      }>;
    };
    [key: string]: unknown;
  } | null | undefined;

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
  const currentPhase = phases.find((p) => p.status === "作業中")?.name || 
                       phases.find((p) => p.status === "未開始")?.name ||
                       phases[phases.length - 1]?.name;

  // 開始日を取得（最初のフェーズの開始日）
  const startDate = phases.find((p) => p.startDate)?.startDate;

  // 予定完了日を取得（フェーズのexpectedEndDateから、またはestimateから計算）
  let expectedCompletionDate: string | undefined;
  const latestPhase = phases
    .filter((p) => p.expectedEndDate)
    .sort((a, b) => (b.expectedEndDate || "").localeCompare(a.expectedEndDate || ""))[0];
  
  if (latestPhase?.expectedEndDate) {
    expectedCompletionDate = latestPhase.expectedEndDate;
  } else if (startDate && workOrder.estimate) {
    // estimateから作業期間を取得して計算
    const estimateData = workOrder.estimate as {
      restoreEstimateData?: {
        workDuration?: number;
      };
      [key: string]: unknown;
    };
    const workDuration = estimateData?.restoreEstimateData?.workDuration;
    if (workDuration) {
      const start = new Date(startDate);
      // workDurationは月単位の想定
      start.setMonth(start.getMonth() + (workDuration || 0));
      expectedCompletionDate = start.toISOString();
    }
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
 * 入庫案件からレストアプロジェクトの進捗データを抽出
 * 
 * 【非推奨】入庫案件単位での進捗データ抽出（複合業務で問題が発生する可能性あり）
 * 後方互換性のため残すが、新しいコードでは`extractRestoreProgressFromWorkOrder`を使用すること
 * 
 * @deprecated 作業オーダー単位での抽出に移行予定
 */
function extractRestoreProgress(job: ZohoJob): {
  progress: number;
  isDelayed: boolean;
  startDate?: string;
  expectedCompletionDate?: string;
  currentPhase?: string;
} {
  // workDataから進捗情報を取得（JSON形式で保存されている想定）
  const jobWithWorkData = job as ZohoJob & {
    workData?: {
      restoreWorkData?: {
        overallProgress?: number;
        phases?: Array<{
          name?: string;
          status?: string;
          startDate?: string;
        }>;
      };
    };
  };
  const workData = jobWithWorkData.workData;
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
  const currentPhase = phases.find((p) => p.status === "作業中")?.name || 
                       phases.find((p) => p.status === "未開始")?.name ||
                       phases[phases.length - 1]?.name;

  // 開始日を取得（最初のフェーズの開始日）
  const startDate = phases.find((p) => p.startDate)?.startDate;

  // 予定完了日を取得（estimateDataから作業期間を計算）
  const jobWithEstimateData = job as ZohoJob & {
    estimateData?: {
      restoreEstimateData?: {
        workDuration?: number;
      };
    };
  };
  const estimateData = jobWithEstimateData.estimateData;
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
 * 作業オーダーから板金・塗装プロジェクトの進捗データを抽出
 * 
 * 【推奨】作業オーダー単位での進捗データ抽出（複合業務対応）
 * 
 * @param workOrder 作業オーダー
 * @returns 進捗データ（長期プロジェクトでない場合はnull）
 */
export function extractBodyPaintProgressFromWorkOrder(workOrder: WorkOrder): {
  progress: number;
  isDelayed: boolean;
  startDate?: string;
  expectedCompletionDate?: string;
  currentPhase?: string;
} | null {
  if (workOrder.serviceKind !== "板金・塗装") {
    return null;
  }

  // work.bodyPaintOutsourcingInfoから進捗情報を取得
  const workData = workOrder.work as {
    bodyPaintOutsourcingInfo?: {
      progress?: string;
      progressPercentage?: number;
      isDelayed?: boolean;
      orderDate?: string;
      expectedCompletionDate?: string;
      currentPhase?: string;
    };
    [key: string]: unknown;
  } | null | undefined;

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
 * 入庫案件から板金・塗装プロジェクトの進捗データを抽出
 * 
 * 【非推奨】入庫案件単位での進捗データ抽出（複合業務で問題が発生する可能性あり）
 * 後方互換性のため残すが、新しいコードでは`extractBodyPaintProgressFromWorkOrder`を使用すること
 * 
 * @deprecated 作業オーダー単位での抽出に移行予定
 */
function extractBodyPaintProgress(job: ZohoJob): {
  progress: number;
  isDelayed: boolean;
  startDate?: string;
  expectedCompletionDate?: string;
  currentPhase?: string;
} {
  // workDataから進捗情報を取得
  const jobWithWorkData = job as ZohoJob & {
    workData?: {
      bodyPaintOutsourcingInfo?: {
        progress?: string;
        progressPercentage?: number;
        isDelayed?: boolean;
        orderDate?: string;
        expectedCompletionDate?: string;
        currentPhase?: string;
      };
    };
  };
  const workData = jobWithWorkData.workData;
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
 * 作業オーダーから長期プロジェクト進捗データを抽出
 * 
 * 【推奨】作業オーダー単位での進捗データ抽出（複合業務対応）
 * 
 * @param workOrder 作業オーダー
 * @returns 進捗データ（長期プロジェクトでない場合はnull）
 */
export function extractLongTermProgressFromWorkOrder(workOrder: WorkOrder): {
  progress: number;
  isDelayed: boolean;
  startDate?: string;
  expectedCompletionDate?: string;
  currentPhase?: string;
} | null {
  if (!isLongTermWorkOrder(workOrder)) {
    return null;
  }

  if (workOrder.serviceKind === "レストア") {
    return extractRestoreProgressFromWorkOrder(workOrder);
  } else if (workOrder.serviceKind === "板金・塗装") {
    return extractBodyPaintProgressFromWorkOrder(workOrder);
  }

  return null;
}

/**
 * 入庫案件から長期プロジェクトデータを抽出
 * 
 * 【非推奨】入庫案件単位での抽出（複合業務で問題が発生する可能性あり）
 * 後方互換性のため残すが、新しいコードでは作業オーダー単位での抽出を使用すること
 * 
 * @deprecated 作業オーダー単位での抽出に移行予定
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









