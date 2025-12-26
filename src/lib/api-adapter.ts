/**
 * APIアダプター
 * 
 * 環境変数（NEXT_PUBLIC_API_MODE）に基づいて、モックAPIと本番APIを切り替える
 * 
 * 使用例:
 *   - 開発環境: NEXT_PUBLIC_API_MODE=mock
 *   - 本番環境: NEXT_PUBLIC_API_MODE=production
 */

import { ApiResponse } from "@/types";
import * as mockApi from "./api";
// 本番APIは将来的に実装（現在はモックAPIを使用）
// import * as productionApi from "./api-production";

// =============================================================================
// 設定
// =============================================================================

/**
 * APIモード（環境変数から取得）
 */
export type ApiMode = "mock" | "production";

const API_MODE: ApiMode = (process.env.NEXT_PUBLIC_API_MODE as ApiMode) || "mock";

/**
 * 現在のAPIモードを取得
 */
export function getApiMode(): ApiMode {
  return API_MODE;
}

/**
 * モックモードかどうか
 */
export function isMockMode(): boolean {
  return API_MODE === "mock";
}

/**
 * 本番モードかどうか
 */
export function isProductionMode(): boolean {
  return API_MODE === "production";
}

// =============================================================================
// API関数のエクスポート（アダプターパターン）
// =============================================================================

/**
 * API関数をモックと本番で切り替えるラッパー関数
 * 
 * 現在の実装:
 *   - モックモード: 既存のapi.tsの関数を使用
 *   - 本番モード: 将来的にapi-production.tsを実装（現在はモックAPIを使用）
 */
function createApiAdapter<T extends (...args: any[]) => Promise<any>>(
  mockFn: T,
  productionFn?: T
): T {
  return (async (...args: any[]) => {
    if (API_MODE === "production" && productionFn) {
      return productionFn(...args);
    }
    return mockFn(...args);
  }) as T;
}

// =============================================================================
// エクスポート（既存のapi.tsの関数をそのまま再エクスポート）
// =============================================================================

// 注意: 現在はモック実装のみのため、すべての関数をそのまま再エクスポート
// 将来的に本番APIが実装されたら、createApiAdapterを使用して切り替え可能にする

export * from "./api";

// =============================================================================
// 将来的な本番API実装のための型定義
// =============================================================================

/**
 * 本番APIの実装例（コメントアウト）
 * 
 * 将来的にapi-production.tsを実装する際の参考用
 */
/*
// api-production.tsの例
export async function fetchTodayJobs(): Promise<ApiResponse<ZohoJob[]>> {
  const response = await fetch("/api/zoho/jobs/today", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // 認証ヘッダーなど
    },
  });
  
  if (!response.ok) {
    return {
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: `HTTP ${response.status}: ${response.statusText}`,
      },
    };
  }
  
  const data = await response.json();
  return {
    success: true,
    data: data.jobs || [],
  };
}
*/

