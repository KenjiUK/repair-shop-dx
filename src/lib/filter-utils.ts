/**
 * フィルター機能のユーティリティ
 * 改善提案 #1: フィルター機能の強化
 */

import { ZohoJob, ServiceKind } from "@/types";
import { isImportantCustomer } from "@/lib/important-customer-flag";
import { isLongPendingApproval } from "@/lib/pending-approval-utils";
import { 
  parsePartsInfoFromField26,
  isLongPartsProcurement
} from "@/lib/parts-info-utils";
import { parseWorkOrdersFromZoho } from "@/lib/work-order-converter";

/**
 * フィルター状態の型定義（複数選択対応）
 */
export interface FilterState {
  status: string[];                 // ステータスフィルター（複数選択可能）
  serviceKind: ServiceKind[];       // 入庫区分フィルター（複数選択可能）
  mechanic: string[];               // 整備士フィルター（複数選択可能）
  isUrgent: boolean | null;         // 緊急案件フィルター（true: 緊急のみ, false: 非緊急のみ, null: すべて）
  isImportant: boolean | null;      // 重要顧客フィルター（true: 重要のみ, false: 非重要のみ, null: すべて）
  partsProcurement: "waiting" | null; // 部品調達待ちフィルター（改善提案 #3）
  longPendingApproval: boolean | null; // 長期化している承認待ち案件フィルター（改善提案 #11）
  longPartsProcurement: boolean | null; // 長期化している部品調達案件フィルター（改善提案 #3）
}

/**
 * ジョブの緊急度を判定
 */
export function getUrgencyLevel(job: ZohoJob): "high" | "medium" | null {
  const now = new Date();
  let targetTime: Date | null = null;

  // ステータスに応じて判定対象の時間を決定
  switch (job.field5) {
    case "入庫待ち":
      // 入庫予定日時（field22）を確認
      targetTime = job.field22 ? new Date(job.field22) : null;
      break;
    case "見積作成待ち":
      // 入庫日時（field22）を確認
      targetTime = job.field22 ? new Date(job.field22) : null;
      break;
    case "作業待ち":
      // 入庫日時（field22）を確認
      targetTime = job.field22 ? new Date(job.field22) : null;
      break;
    default:
      return null;
  }

  if (!targetTime) return null;

  const hoursElapsed = (now.getTime() - targetTime.getTime()) / (1000 * 60 * 60);

  // 緊急度の判定（設定値から取得）
  let highThreshold = 2; // デフォルト: 2時間
  let mediumThreshold = 1; // デフォルト: 1時間
  
  try {
    const { getNumericalMasterConfig } = require("@/lib/numerical-master-config");
    const config = getNumericalMasterConfig();
    highThreshold = config.thresholds.urgentJobHours.high;
    mediumThreshold = config.thresholds.urgentJobHours.medium;
  } catch {
    // フォールバック: デフォルト値を使用
  }

  if (hoursElapsed >= highThreshold) return "high";
  if (hoursElapsed >= mediumThreshold) return "medium";
  return null;
}

/**
 * ジョブが緊急案件かどうかを判定
 */
export function isUrgentJob(job: ZohoJob): boolean {
  const urgencyLevel = getUrgencyLevel(job);
  return urgencyLevel === "high" || urgencyLevel === "medium";
}

/**
 * フィルターを適用してジョブをフィルタリング
 */
export function applyFilters(jobs: ZohoJob[], filters: FilterState): ZohoJob[] {
  return jobs.filter((job) => {
    // ステータスフィルター（複数選択対応）
    // 後方互換性のため、nullチェックを追加
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      const hasMatchingStatus = filters.status.some((status) => {
        // 再入庫予定の特別処理
        if (status === "再入庫予定") {
          const hasSecondBooking = !!job.ID_BookingId_2 || !!job.bookingId2;
          return job.field5 === "見積提示済み" && hasSecondBooking;
        }
        
        // ジョブ全体のステータスをチェック
        if (job.field5 === status) return true;
        
        // 複合作業の場合、WorkOrderのステータスもチェック
        if (job.field_work_orders) {
          try {
            const workOrders = parseWorkOrdersFromZoho(job.field_work_orders);
            const hasMatchingWorkOrderStatus = workOrders.some((wo) => wo.status === status);
            if (hasMatchingWorkOrderStatus) return true;
          } catch (error) {
            // パースエラーの場合はjob.field5のみで判定（既存の動作を維持）
            console.warn("WorkOrder parse error in status filter:", error);
          }
        }
        
        return false;
      });
      if (!hasMatchingStatus) return false;
    }
    
    // 入庫区分フィルター（複数選択対応）
    // 後方互換性のため、nullチェックを追加
    if (filters.serviceKind && Array.isArray(filters.serviceKind) && filters.serviceKind.length > 0) {
      const jobServiceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
      const hasMatchingServiceKind = filters.serviceKind.some((kind) =>
        jobServiceKinds.includes(kind)
      );
      if (!hasMatchingServiceKind) return false;
    }
    
    // 整備士フィルター（複数選択対応）
    // 後方互換性のため、nullチェックを追加
    if (filters.mechanic && Array.isArray(filters.mechanic) && filters.mechanic.length > 0) {
      // 複合業務の場合、workOrderごとに整備士が異なる可能性がある
      // まず、job.assignedMechanicをチェック
      const jobMechanic = job.assignedMechanic || "未割り当て";
      let hasMatchingMechanic = filters.mechanic.includes(jobMechanic);
      
      // workOrderがある場合、workOrderの整備士もチェック
      if (!hasMatchingMechanic && job.field_work_orders) {
        try {
          const workOrders = parseWorkOrdersFromZoho(job.field_work_orders);
          hasMatchingMechanic = workOrders.some((wo) => {
            const woMechanic = wo.diagnosis?.mechanicName || wo.work?.mechanicName || jobMechanic;
            return filters.mechanic!.includes(woMechanic);
          });
        } catch (error) {
          // パースエラーの場合はjob.assignedMechanicのみで判定
          console.warn("WorkOrder parse error in filter:", error);
        }
      }
      
      if (!hasMatchingMechanic) return false;
    }
    
    // 緊急案件フィルター
    if (filters.isUrgent !== null) {
      const isUrgent = isUrgentJob(job);
      if (filters.isUrgent !== isUrgent) return false;
    }
    
    // 重要顧客フィルター
    if (filters.isImportant !== null) {
      const customerId = job.field4?.id || "";
      const isImportant = isImportantCustomer(customerId);
      if (filters.isImportant !== isImportant) return false;
    }
    
    // 部品調達待ちフィルター（改善提案 #3）
    if (filters.partsProcurement === "waiting") {
      if (job.field5 !== "部品調達待ち" && job.field5 !== "部品発注待ち") {
        return false;
      }
    }
    
    // 長期化している承認待ち案件フィルター（改善提案 #11）
    if (filters.longPendingApproval === true) {
      if (!isLongPendingApproval(job)) {
        return false;
      }
    }
    
    // 長期化している部品調達案件フィルター（改善提案 #3）
    // ステータスに関係なく、partsInfoの存在と日数で判定
    // 長期プロジェクト（レストア・板金・塗装）でも部品調達が長期化している場合を検出
    if (filters.longPartsProcurement === true) {
      const partsInfo = parsePartsInfoFromField26(job.field26);
      if (!isLongPartsProcurement(partsInfo)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * アクティブなフィルターの数を取得
 */
export function getActiveFilterCount(filters: FilterState): number {
  let count = 0;
  // 後方互換性のため、nullチェックを追加
  if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) count++;
  if (filters.serviceKind && Array.isArray(filters.serviceKind) && filters.serviceKind.length > 0) count++;
  if (filters.mechanic && Array.isArray(filters.mechanic) && filters.mechanic.length > 0) count++;
  if (filters.isUrgent !== null) count++;
  if (filters.isImportant !== null) count++;
  if (filters.partsProcurement !== null) count++;
  if (filters.longPendingApproval === true) count++;
  if (filters.longPartsProcurement === true) count++;
  return count;
}

/**
 * すべてのフィルターをリセット
 */
export function resetFilters(): FilterState {
  return {
    status: [],
    serviceKind: [],
    mechanic: [],
    isUrgent: null,
    isImportant: null,
    partsProcurement: null,
    longPendingApproval: null,
    longPartsProcurement: null,
  };
}


