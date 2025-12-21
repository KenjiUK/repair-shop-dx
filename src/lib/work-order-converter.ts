/**
 * ワークオーダー変換ロジック
 *
 * Zoho CRM ↔ アプリ内データモデルの相互変換
 *
 * Zoho CRMの`field_work_orders`（Multi-Line JSON）と
 * アプリ内の`WorkOrder[]`を相互変換する
 */

import { ZohoJob, WorkOrder, ServiceKind, WorkOrderStatus } from "@/types";

// =============================================================================
// Zoho CRM → アプリ内データモデル
// =============================================================================

/**
 * ZohoJobからBaseJobに変換（ワークオーダーリストを含む）
 */
export function convertZohoJobToBaseJob(zohoJob: ZohoJob): {
  job: Omit<ZohoJob, "serviceKind"> & {
    serviceKinds: ServiceKind[];
    workOrders: WorkOrder[];
    baseSystemId?: string;
  };
} {
  // field_service_kinds（Multi-Select）から実施作業リストを取得
  // 優先順位: field_service_kinds > serviceKind（後方互換性）
  let serviceKinds: ServiceKind[] = [];
  if (zohoJob.field_service_kinds && Array.isArray(zohoJob.field_service_kinds)) {
    serviceKinds = zohoJob.field_service_kinds;
  } else if (zohoJob.serviceKind) {
    // 後方互換性: 既存のserviceKindフィールドから取得
    serviceKinds = [zohoJob.serviceKind];
  }

  // field_work_orders（Multi-Line JSON）からワークオーダーリストを取得
  const workOrders = parseWorkOrdersFromZoho((zohoJob as any).field_work_orders || null);

  // field_base_system_idから基幹システム連携IDを取得
  const baseSystemId = zohoJob.field_base_system_id || undefined;

  return {
    job: {
      ...zohoJob,
      serviceKinds,
      workOrders,
      baseSystemId,
    },
  };
}

/**
 * Zoho CRMのfield_work_orders（JSON文字列）をWorkOrder[]に変換
 */
export function parseWorkOrdersFromZoho(
  workOrdersJson: string | null | undefined
): WorkOrder[] {
  if (!workOrdersJson || workOrdersJson.trim() === "") {
    return [];
  }

  try {
    const parsed = JSON.parse(workOrdersJson);
    if (!Array.isArray(parsed)) {
      console.error("field_work_ordersは配列である必要があります");
      return [];
    }

    return parsed.map((wo: any) => ({
      id: wo.id || `wo-${Date.now()}`,
      jobId: wo.jobId || "",
      serviceKind: wo.serviceKind || "その他",
      status: (wo.status || "未開始") as WorkOrderStatus,
      diagnosis: wo.diagnosis,
      estimate: wo.estimate,
      work: wo.work,
      baseSystemItemId: wo.baseSystemItemId,
      cost: wo.cost,
      createdAt: wo.createdAt || new Date().toISOString(),
      updatedAt: wo.updatedAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("ワークオーダーJSONのパースエラー:", error);
    return [];
  }
}

// =============================================================================
// アプリ内データモデル → Zoho CRM
// =============================================================================

/**
 * WorkOrder[]をZoho CRMのfield_work_orders（JSON文字列）に変換
 */
export function serializeWorkOrdersForZoho(workOrders: WorkOrder[]): string {
  try {
    return JSON.stringify(workOrders, null, 2);
  } catch (error) {
    console.error("ワークオーダーのシリアライズエラー:", error);
    return "[]";
  }
}

/**
 * BaseJobからZohoJobの更新データに変換
 */
export function convertBaseJobToZohoUpdate(
  baseJob: {
    serviceKinds: ServiceKind[];
    workOrders: WorkOrder[];
    baseSystemId?: string;
  }
): {
  field_service_kinds?: string[];
  field_work_orders?: string;
  field_base_system_id?: string;
} {
  const updates: {
    field_service_kinds?: string[];
    field_work_orders?: string;
    field_base_system_id?: string;
  } = {};

  // field_service_kinds（Multi-Select）に変換
  if (baseJob.serviceKinds && baseJob.serviceKinds.length > 0) {
    updates.field_service_kinds = baseJob.serviceKinds;
  }

  // field_work_orders（Multi-Line JSON）に変換
  if (baseJob.workOrders && baseJob.workOrders.length > 0) {
    updates.field_work_orders = serializeWorkOrdersForZoho(baseJob.workOrders);
  }

  // field_base_system_idに変換
  if (baseJob.baseSystemId) {
    updates.field_base_system_id = baseJob.baseSystemId;
  }

  return updates;
}

// =============================================================================
// ワークオーダー操作
// =============================================================================

/**
 * ワークオーダーを作成
 */
export function createWorkOrder(
  jobId: string,
  serviceKind: ServiceKind
): WorkOrder {
  const now = new Date().toISOString();
  return {
    id: `wo-${Date.now()}`,
    jobId,
    serviceKind,
    status: "未開始",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * ワークオーダーを更新
 */
export function updateWorkOrder(
  workOrder: WorkOrder,
  updates: Partial<WorkOrder>
): WorkOrder {
  return {
    ...workOrder,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * ワークオーダーを削除
 */
export function removeWorkOrder(
  workOrders: WorkOrder[],
  workOrderId: string
): WorkOrder[] {
  return workOrders.filter((wo) => wo.id !== workOrderId);
}
















