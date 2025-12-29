import useSWR from "swr";
import { WorkOrder, ApiResponse } from "@/types";

const WORK_ORDERS_API_BASE_URL = "/api/jobs";

/**
 * SWR設定
 * グローバル設定（swrGlobalConfig）を継承し、必要に応じて上書き
 */
const swrConfig = {
  // グローバル設定を継承（revalidateOnFocus: false, revalidateOnReconnect: trueなど）
  // 詳細ページなので、キャッシュを活用
  revalidateOnMount: true, // 初回マウント時は必ずデータを取得
  dedupingInterval: 5 * 60 * 1000, // 5分（グローバル設定と同じ）
  errorRetryCount: 3,
  errorRetryInterval: 5000, // 5秒（グローバル設定と同じ）
};

/**
 * ワークオーダー一覧を取得するフック
 */
export function useWorkOrders(jobId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<WorkOrder[]>>(
    jobId ? `${WORK_ORDERS_API_BASE_URL}/${jobId}/work-orders` : null,
    async (url: string) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[useWorkOrders] フェッチ開始:", url);
      }
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        if (process.env.NODE_ENV === "development") {
          console.error("[useWorkOrders] フェッチエラー:", {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });
        }
        // 404エラーの場合は空配列を返す（ジョブが存在しない場合）
        if (response.status === 404) {
          if (process.env.NODE_ENV === "development") {
            console.warn("[useWorkOrders] ジョブが見つかりません（404）。空配列を返します。");
          }
          return { success: true, data: [] };
        }
        throw new Error(`Failed to fetch work orders: ${response.statusText}`);
      }
      const json = await response.json();
      if (process.env.NODE_ENV === "development") {
        console.log("[useWorkOrders] フェッチ成功:", {
          success: json.success,
          dataLength: json.data?.length,
        });
      }
      return json;
    },
    {
      ...swrConfig,
      // 404エラーは再試行しない
      shouldRetryOnError: (error) => {
        if (error instanceof Error && error.message.includes("404")) {
          return false;
        }
        return true;
      },
    }
  );

  if (process.env.NODE_ENV === "development" && error) {
    console.error("[useWorkOrders] SWRエラー:", error);
  }

  return {
    workOrders: data?.success ? data.data : [],
    isLoading,
    isError: error && !(error instanceof Error && error.message.includes("404")),
    mutate,
  };
}

/**
 * ワークオーダー詳細を取得するフック
 */
export function useWorkOrder(
  jobId: string | null,
  workOrderId: string | null
) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<WorkOrder>>(
    jobId && workOrderId
      ? `${WORK_ORDERS_API_BASE_URL}/${jobId}/work-orders/${workOrderId}`
      : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch work order: ${response.statusText}`);
      }
      return response.json();
    },
    swrConfig
  );

  return {
    workOrder: data?.success ? data.data : null,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * ワークオーダーを作成する関数
 */
export async function createWorkOrder(
  jobId: string,
  serviceKind: string
): Promise<ApiResponse<WorkOrder>> {
  const response = await fetch(`${WORK_ORDERS_API_BASE_URL}/${jobId}/work-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ serviceKind }),
  });

  return response.json();
}

/**
 * ワークオーダーを更新する関数
 */
export async function updateWorkOrder(
  jobId: string,
  workOrderId: string,
  updates: Partial<WorkOrder>
): Promise<ApiResponse<WorkOrder>> {
  const response = await fetch(
    `${WORK_ORDERS_API_BASE_URL}/${jobId}/work-orders/${workOrderId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  return response.json();
}

/**
 * ワークオーダーを削除する関数
 */
export async function deleteWorkOrder(
  jobId: string,
  workOrderId: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  const response = await fetch(
    `${WORK_ORDERS_API_BASE_URL}/${jobId}/work-orders/${workOrderId}`,
    {
      method: "DELETE",
    }
  );

  return response.json();
}
























