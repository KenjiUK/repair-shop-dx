/**
 * Zoho CRM API バッチ更新エンドポイント
 * 
 * POST /api/zoho/batch
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import { BatchUpdateEntry, BatchUpdateResult } from "@/lib/zoho-batch";
import { updateJob, updateCustomer } from "@/lib/zoho-api-client";
import { ErrorCodes, createErrorLogEntry, logError } from "@/lib/error-handling";
import { withErrorHandling } from "@/lib/server-error-handling";

// =============================================================================
// エラーハンドリング
// =============================================================================

/**
 * エラーレスポンスを生成
 */
function errorResponse(
  message: string,
  code: string,
  status: number = 500
): NextResponse<ApiResponse<BatchUpdateResult>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    } as ApiResponse<never>,
    { status }
  );
}

// =============================================================================
// API Route Handler
// =============================================================================

/**
 * POST /api/zoho/batch
 * バッチ更新を実行
 */
async function handlePOST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BatchUpdateResult>>> {
  try {
    const body = await request.json();
    const entries: BatchUpdateEntry[] = body.entries || [];

    if (!Array.isArray(entries) || entries.length === 0) {
      return errorResponse(
        "entriesは必須で、配列形式である必要があります",
        "VALIDATION_ERROR",
        400
      );
    }

    // 最大バッチサイズをチェック
    const MAX_BATCH_SIZE = 100; // Zoho CRM APIの制限に合わせて調整
    if (entries.length > MAX_BATCH_SIZE) {
      return errorResponse(
        `バッチサイズが大きすぎます（最大: ${MAX_BATCH_SIZE}件）`,
        "VALIDATION_ERROR",
        400
      );
    }

    // バッチ更新を実行
    const result: BatchUpdateResult = {
      success: [],
      failed: [],
    };

    // リソースタイプごとにグループ化
    const grouped = entries.reduce(
      (acc, entry) => {
        if (!acc[entry.resourceType]) {
          acc[entry.resourceType] = [];
        }
        acc[entry.resourceType].push(entry);
        return acc;
      },
      {} as Record<string, BatchUpdateEntry[]>
    );

    // 各リソースタイプごとに処理
    for (const [resourceType, typeEntries] of Object.entries(grouped)) {
      for (const entry of typeEntries) {
        try {
          let updateResult: ApiResponse<unknown>;

          // リソースタイプに応じて適切な更新関数を呼び出す
          switch (entry.resourceType) {
            case "job":
              updateResult = await updateJob(entry.resourceId, entry.data);
              break;
            case "customer":
              updateResult = await updateCustomer(entry.resourceId, entry.data);
              break;
            case "vehicle":
              // 車両の更新は現在サポートされていない（マスタデータのため）
              result.failed.push({
                entry,
                error: "車両の更新はサポートされていません（マスタデータのため）",
              });
              continue;
            default:
              result.failed.push({
                entry,
                error: `不明なリソースタイプ: ${entry.resourceType}`,
              });
              continue;
          }

          if (updateResult.success) {
            result.success.push({
              entry,
              result: updateResult.data,
            });
          } else {
            result.failed.push({
              entry,
              error: updateResult.error?.message || "更新に失敗しました",
            });
          }
        } catch (error) {
          const errorEntry = createErrorLogEntry(
            error,
            ErrorCodes.EXTERNAL_API_ERROR,
            {
              location: "handlePOST (batch update)",
              request: {
                url: entry.resourceId,
                method: "PUT",
                body: entry.data,
              },
            }
          );
          logError(errorEntry);

          result.failed.push({
            entry,
            error: error instanceof Error ? error.message : "更新中にエラーが発生しました",
          });
        }
      }
    }

    // 結果を返す
    return NextResponse.json({
      success: true,
      data: result,
    } as ApiResponse<BatchUpdateResult>);
  } catch (error) {
    console.error("バッチ更新エラー:", error);
    const errorEntry = createErrorLogEntry(
      error,
      ErrorCodes.UNKNOWN_ERROR,
      {
        location: "handlePOST (batch update)",
      }
    );
    logError(errorEntry);

    return errorResponse(
      error instanceof Error ? error.message : "内部エラーが発生しました",
      "INTERNAL_ERROR",
      500
    );
  }
}

// エラーハンドリングラッパーでラップ
export const POST = withErrorHandling(handlePOST);






