import { NextRequest, NextResponse } from "next/server";
import { fetchJobById } from "@/lib/api";
import { ApiResponse, ZohoJob } from "@/types";
import { withErrorHandling } from "@/lib/server-error-handling";
import { jobs } from "@/lib/mock-db";

/**
 * Job情報を取得
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ZohoJob>>> {
  const { id: jobId } = await params;

  if (!jobId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Job IDが指定されていません",
        },
      },
      { status: 400 }
    );
  }

  const result = await fetchJobById(jobId);

  if (!result.success) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}

/**
 * Job情報を更新
 */
async function handlePATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ZohoJob>>> {
  const { id: jobId } = await params;

  if (!jobId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "Job IDが指定されていません",
        },
      },
      { status: 400 }
    );
  }

  const updateData = await request.json();

  // モックデータを直接更新
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Job ${jobId} が見つかりません`,
        },
      },
      { status: 404 }
    );
  }

  // 更新データを適用
  const job = jobs[jobIndex];
  Object.keys(updateData).forEach((key) => {
    if (key in job) {
      (job as any)[key] = updateData[key];
    }
  });

  // field_work_ordersの場合は、型アサーションを使用
  if (updateData.field_work_orders !== undefined) {
    (job as any).field_work_orders = updateData.field_work_orders;
  }

  // field_service_kindsの場合は、型アサーションを使用
  if (updateData.field_service_kinds !== undefined) {
    (job as any).field_service_kinds = updateData.field_service_kinds;
  }

  // field_base_system_idの場合は、型アサーションを使用
  if (updateData.field_base_system_id !== undefined) {
    (job as any).field_base_system_id = updateData.field_base_system_id;
  }

  return NextResponse.json({
    success: true,
    data: { ...job },
  });
}

// エラーハンドリングラッパーでラップ
export const GET = withErrorHandling(handleGET);
export const PATCH = withErrorHandling(handlePATCH);


