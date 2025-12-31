import { NextRequest, NextResponse } from "next/server";
import { WorkOrder, ApiResponse, ServiceKind, ZohoJob } from "@/types";
import { fetchJobById } from "@/lib/api";
import { parseWorkOrdersFromZoho, serializeWorkOrdersForZoho, createWorkOrder } from "@/lib/work-order-converter";
import { jobs } from "@/lib/mock-db";

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

    if (process.env.NODE_ENV === "development") {
      console.log("[API] ワークオーダーAPI GET開始:", jobId);

      // 開発環境用のサンプルデータ対応（APIルート側でも強制的に返す）
      if (jobId === "sample-shaken-001") {
        return NextResponse.json({
          success: true,
          data: [
            {
              id: "wo-sample-shaken-001",
              jobId: "sample-shaken-001",
              serviceKind: "車検",
              status: "作業待ち",
              diagnosis: {
                items: [],
                photos: [],
                startedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
              },
              estimate: { items: [] },
              work: null,
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            }
          ]
        });
      }
      if (jobId === "sample-12month-001") {
        return NextResponse.json({
          success: true,
          data: [
            {
              id: "wo-sample-12month-001",
              jobId: "sample-12month-001",
              serviceKind: "12ヵ月点検",
              status: "出庫待ち",
              diagnosis: {
                items: [],
                photos: [],
                startedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
              },
              estimate: { items: [] },
              work: {
                parts: [],
                startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                completedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              },
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            }
          ]
        });
      }
    }

    if (!jobId) {
      return errorResponse("Job IDが指定されていません", "MISSING_JOB_ID", 400);
    }

    // Zoho CRMからJobを取得
    const jobResult = await fetchJobById(jobId);

    if (process.env.NODE_ENV === "development") {
      console.log("[API] ワークオーダーAPI fetchJobById結果:", {
        jobId,
        success: jobResult.success,
        hasData: !!jobResult.data,
        error: jobResult.error,
      });
    }

    if (!jobResult.success || !jobResult.data) {
      if (process.env.NODE_ENV === "development") {
        console.error("[API] ワークオーダーAPI Job取得失敗:", {
          jobId,
          error: jobResult.error,
        });
      }
      return errorResponse(
        jobResult.error?.message || "Jobが見つかりません",
        jobResult.error?.code || "JOB_NOT_FOUND",
        404
      );
    }

    const zohoJob = jobResult.data;

    // field_work_ordersからワークオーダーリストをパース
    const jobWithWorkOrders = zohoJob as ZohoJob & { field_work_orders?: string | null };
    const workOrdersJson = jobWithWorkOrders.field_work_orders || null;

    if (process.env.NODE_ENV === "development") {
      console.log("[API] ワークオーダー取得:", {
        jobId,
        hasFieldWorkOrders: !!workOrdersJson,
        workOrdersJsonLength: workOrdersJson?.length,
        workOrdersJsonPreview: workOrdersJson?.substring(0, 200),
      });
    }

    const workOrders = parseWorkOrdersFromZoho(workOrdersJson);

    if (process.env.NODE_ENV === "development") {
      console.log("[API] パース後のワークオーダー:", {
        count: workOrders.length,
        workOrders: workOrders.map(wo => ({
          id: wo.id,
          serviceKind: wo.serviceKind,
          status: wo.status,
          hasVendor: !!wo.vendor,
          vendorName: wo.vendor?.name,
        })),
      });
    }

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
    const jobWithWorkOrders = zohoJob as ZohoJob & { field_work_orders?: string | null };
    const workOrdersJson = jobWithWorkOrders.field_work_orders || null;
    const existingWorkOrders = parseWorkOrdersFromZoho(workOrdersJson);

    // 新しいワークオーダーを作成
    const newWorkOrder = createWorkOrder(jobId, serviceKind as ServiceKind);

    // ワークオーダーリストに追加
    const updatedWorkOrders = [...existingWorkOrders, newWorkOrder];

    // field_service_kindsを更新（既存のserviceKindに新しいserviceKindを追加）
    // 優先順位: field_service_kinds > serviceKind（後方互換性）
    let existingServiceKinds: ServiceKind[] = [];
    if (zohoJob.field_service_kinds && Array.isArray(zohoJob.field_service_kinds)) {
      existingServiceKinds = zohoJob.field_service_kinds;
    } else if (zohoJob.serviceKind) {
      existingServiceKinds = [zohoJob.serviceKind];
    }
    const updatedServiceKinds = Array.from(
      new Set([...existingServiceKinds, serviceKind as ServiceKind])
    );

    // モックデータベースを直接更新
    const jobIndex = jobs.findIndex((j) => j.id === jobId);
    if (jobIndex === -1) {
      console.error("[API] Jobが見つかりません:", jobId);
      return errorResponse("Jobが見つかりません", "JOB_NOT_FOUND", 404);
    }

    // field_service_kindsとfield_work_ordersを更新
    jobs[jobIndex].field_service_kinds = updatedServiceKinds;
    (jobs[jobIndex] as ZohoJob & { field_work_orders?: string | null }).field_work_orders =
      serializeWorkOrdersForZoho(updatedWorkOrders);

    if (process.env.NODE_ENV === "development") {
      console.log("[API] ワークオーダー作成成功:", {
        jobId,
        newWorkOrderId: newWorkOrder.id,
        serviceKind: newWorkOrder.serviceKind,
        totalWorkOrders: updatedWorkOrders.length,
        updatedServiceKinds,
      });
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











