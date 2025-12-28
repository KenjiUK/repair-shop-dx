import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import { createErrorResponse } from "@/lib/server-error-handling";
import { ErrorCodes } from "@/lib/error-handling";
import { fetchJobs } from "@/lib/api";
import {
  CustomerAnalyticsData,
  generateCustomerAnalyticsData,
} from "@/lib/analytics-utils";

/**
 * GET /api/analytics/customer
 * 顧客分析データを取得
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
      return createErrorResponse(
        ErrorCodes.INVALID_PARAM,
        "開始日と終了日が必要です",
        400
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return createErrorResponse(
        ErrorCodes.INVALID_PARAM,
        "無効な日付形式です",
        400
      );
    }

    // 全ジョブを取得
    const allJobsResult = await fetchJobs();
    if (!allJobsResult.success || !allJobsResult.data) {
      return createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        "ジョブの取得に失敗しました",
        500
      );
    }

    // 顧客分析データを生成
    const customerData = generateCustomerAnalyticsData(
      allJobsResult.data,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      data: customerData,
    } as ApiResponse<CustomerAnalyticsData>);
  } catch (error) {
    console.error("[Analytics Customer] エラー:", error);
    return createErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      error instanceof Error ? error.message : "顧客分析データの取得に失敗しました",
      500
    );
  }
}


