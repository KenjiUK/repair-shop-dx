/**
 * アクション完了トラッキング
 *
 * 重要なアクション（診断完了、見積送信、作業完了等）の完了を記録
 */

import { trackAction } from "./analytics";

// =============================================================================
// アクション名定義
// =============================================================================

/**
 * アクション名
 */
export const ActionNames = {
  // 受付関連
  JOB_CHECK_IN: "job_check_in",
  JOB_CHECK_OUT: "job_check_out",
  
  // 診断関連
  DIAGNOSIS_START: "diagnosis_start",
  DIAGNOSIS_COMPLETE: "diagnosis_complete",
  DIAGNOSIS_SAVE: "diagnosis_save",
  
  // 見積関連
  ESTIMATE_CREATE: "estimate_create",
  ESTIMATE_UPDATE: "estimate_update",
  ESTIMATE_SEND: "estimate_send",
  ESTIMATE_APPROVE: "estimate_approve",
  ESTIMATE_REJECT: "estimate_reject",
  
  // 作業関連
  WORK_START: "work_start",
  WORK_COMPLETE: "work_complete",
  WORK_SAVE: "work_save",
  
  // ワークオーダー関連
  WORK_ORDER_CREATE: "work_order_create",
  WORK_ORDER_UPDATE: "work_order_update",
  WORK_ORDER_DELETE: "work_order_delete",
  
  // ファイル関連
  PHOTO_UPLOAD: "photo_upload",
  VIDEO_UPLOAD: "video_upload",
  PDF_GENERATE: "pdf_generate",
  
  // その他
  CUSTOMER_APPROVAL: "customer_approval",
  REPORT_SEND: "report_send",
} as const;

export type ActionName = typeof ActionNames[keyof typeof ActionNames];

// =============================================================================
// アクション完了トラッキング関数
// =============================================================================

/**
 * アクション完了を記録（成功）
 */
export function trackActionSuccess(
  screenId: string,
  actionName: ActionName,
  resourceId?: string,
  metadata?: Record<string, unknown>
): void {
  trackAction(screenId, actionName, "success", resourceId, metadata);
}

/**
 * アクション完了を記録（失敗）
 */
export function trackActionFailure(
  screenId: string,
  actionName: ActionName,
  errorMessage: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): void {
  trackAction(
    screenId,
    actionName,
    "failure",
    resourceId,
    {
      ...metadata,
      errorMessage,
    }
  );
}

// =============================================================================
// 便利関数
// =============================================================================

/**
 * 診断完了を記録
 */
export function trackDiagnosisComplete(
  screenId: string,
  jobId: string,
  workOrderId?: string,
  metadata?: Record<string, unknown>
): void {
  trackActionSuccess(
    screenId,
    ActionNames.DIAGNOSIS_COMPLETE,
    jobId,
    {
      ...metadata,
      workOrderId,
    }
  );
}

/**
 * 見積送信を記録
 */
export function trackEstimateSend(
  screenId: string,
  jobId: string,
  estimateId: string,
  itemCount: number,
  totalAmount: number,
  metadata?: Record<string, unknown>
): void {
  trackActionSuccess(
    screenId,
    ActionNames.ESTIMATE_SEND,
    jobId,
    {
      ...metadata,
      estimateId,
      itemCount,
      totalAmount,
    }
  );
}

/**
 * 見積承認を記録
 */
export function trackEstimateApprove(
  screenId: string,
  jobId: string,
  estimateId: string,
  approvedItems: number,
  totalAmount: number,
  metadata?: Record<string, unknown>
): void {
  trackActionSuccess(
    screenId,
    ActionNames.ESTIMATE_APPROVE,
    jobId,
    {
      ...metadata,
      estimateId,
      approvedItems,
      totalAmount,
    }
  );
}

/**
 * 作業完了を記録
 */
export function trackWorkComplete(
  screenId: string,
  jobId: string,
  workOrderId?: string,
  metadata?: Record<string, unknown>
): void {
  trackActionSuccess(
    screenId,
    ActionNames.WORK_COMPLETE,
    jobId,
    {
      ...metadata,
      workOrderId,
    }
  );
}
















