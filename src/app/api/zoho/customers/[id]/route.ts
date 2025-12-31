import { NextRequest, NextResponse } from "next/server";
import { fetchCustomerById, updateCustomer } from "@/lib/api";
import { ApiResponse, ZohoCustomer } from "@/types";
import { withErrorHandling } from "@/lib/server-error-handling";

/**
 * 顧客情報を取得
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ZohoCustomer>>> {
  const { id: customerId } = await params;

  if (!customerId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "顧客IDが指定されていません",
        },
      },
      { status: 400 }
    );
  }

  const result = await fetchCustomerById(customerId);

  if (!result.success) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result);
}

/**
 * 顧客情報を更新
 */
async function handlePATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ZohoCustomer>>> {
  const { id: customerId } = await params;

  if (!customerId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: "顧客IDが指定されていません",
        },
      },
      { status: 400 }
    );
  }

  const updateData = await request.json();

  console.log("[API] updateCustomer request:", {
    customerId,
    updateData,
    updateDataKeys: Object.keys(updateData),
  });

  // Zoho CRM APIで顧客情報を更新
  // ⚠️ 重要制約: 許可されたフィールドのみ更新可能（LINE ID、メール同意、誕生日など）
  // マスタデータ（顧客ID、氏名、住所、電話番号など）は更新不可
  const result = await updateCustomer(customerId, updateData);

  console.log("[API] updateCustomer result:", {
    success: result.success,
    error: result.error,
  });

  if (!result.success) {
    return NextResponse.json(result as ApiResponse<ZohoCustomer>, { status: 400 });
  }

  return NextResponse.json(result as ApiResponse<ZohoCustomer>);
}

// エラーハンドリングラッパーでラップ
export const GET = withErrorHandling(handleGET);
export const PATCH = withErrorHandling(handlePATCH);










