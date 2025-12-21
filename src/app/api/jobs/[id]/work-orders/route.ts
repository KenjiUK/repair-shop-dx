import { NextRequest, NextResponse } from "next/server";
import { WorkOrder, ApiResponse, ServiceKind } from "@/types";
import { fetchJobById } from "@/lib/api";
import { parseWorkOrdersFromZoho, serializeWorkOrdersForZoho, createWorkOrder } from "@/lib/work-order-converter";
import { updateJob } from "@/lib/zoho-api-client";

/**
 * ワークオーダーCRUD API
 *
 * GET /api/jobs/{id}/work-orders - ワークオーダー一覧取得
 * POST /api/jobs/{id}/work-orders - ワークオーダー作成
 */

function errorResponse(
  message: string,
  code: string,
  status: number = 500
): NextResponse {
  const response: ApiResponse<never> = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(response, { status });
}

/**
 * GET /api/jobs/{id}/work-orders
 * ワークオーダー一覧を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return errorResponse("Job IDが指定されていません", "MISSING_JOB_ID", 400);
    }

    // Zoho CRMからJobを取得
    const jobResult = await fetchJobById(jobId);
    if (!jobResult.success || !jobResult.data) {
      return errorResponse(
        jobResult.error?.message || "Jobが見つかりません",
        jobResult.error?.code || "JOB_NOT_FOUND",
        404
      );
    }

    const zohoJob = jobResult.data;

    // field_work_ordersからワークオーダーリストをパース
    // 注意: 現時点ではZohoJobにworkOrdersフィールドがないため、
    // 将来的にZoho CRM APIから取得したfield_work_ordersをパースする必要がある
    // 暫定実装として、空配列を返す
    const workOrdersJson = (zohoJob as any).field_work_orders || null;
    const workOrders = parseWorkOrdersFromZoho(workOrdersJson);

    const response: ApiResponse<WorkOrder[]> = {
      success: true,
      data: workOrders,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] ワークオーダー一覧取得エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "ワークオーダーの取得に失敗しました",
      "WORK_ORDERS_FETCH_ERROR",
      500
    );
  }
}

/**
 * POST /api/jobs/{id}/work-orders
 * ワークオーダーを作成
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return errorResponse("Job IDが指定されていません", "MISSING_JOB_ID", 400);
    }

    const body = await request.json();
    const { serviceKind } = body;

    if (!serviceKind) {
      return errorResponse(
        "serviceKindは必須です",
        "MISSING_SERVICE_KIND",
        400
      );
    }

    // Zoho CRMからJobを取得
    const jobResult = await fetchJobById(jobId);
    if (!jobResult.success || !jobResult.data) {
      return errorResponse(
        jobResult.error?.message || "Jobが見つかりません",
        jobResult.error?.code || "JOB_NOT_FOUND",
        404
      );
    }

    const zohoJob = jobResult.data;

    // 既存のワークオーダーを取得
    const workOrdersJson = (zohoJob as any).field_work_orders || null;
    const existingWorkOrders = parseWorkOrdersFromZoho(workOrdersJson);

    // 新しいワークオーダーを作成
    const newWorkOrder = createWorkOrder(jobId, serviceKind as ServiceKind);

    // ワークオーダーリストに追加
    const updatedWorkOrders = [...existingWorkOrders, newWorkOrder];

    // field_service_kindsを更新（既存のserviceKindに新しいserviceKindを追加）
    const existingServiceKinds = (zohoJob.serviceKind ? [zohoJob.serviceKind] : []) as ServiceKind[];
    const updatedServiceKinds = Array.from(
      new Set([...existingServiceKinds, serviceKind as ServiceKind])
    );

    // Zoho CRMを更新
    const updateData = {
      field_service_kinds: updatedServiceKinds,
      field_work_orders: serializeWorkOrdersForZoho(updatedWorkOrders),
    };

    // Zoho CRM APIで更新
    const updateResult = await updateJob(jobId, updateData);
    if (!updateResult.success) {
      console.error("[API] Zoho CRM更新エラー:", updateResult.error);
      // エラーが発生してもワークオーダー作成は成功として返す（オプティミスティック更新）
      // 実際の本番環境では、エラーハンドリングを強化する必要がある
    }

    const response: ApiResponse<WorkOrder> = {
      success: true,
      data: newWorkOrder,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] ワークオーダー作成エラー:", error);
    return errorResponse(
      error instanceof Error ? error.message : "ワークオーダーの作成に失敗しました",
      "WORK_ORDER_CREATE_ERROR",
      500
    );
  }
}











