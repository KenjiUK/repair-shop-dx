import useSWR from "swr";
import { WorkOrder, ApiResponse } from "@/types";

const WORK_ORDERS_API_BASE_URL = "/api/jobs";

/**
 * SWR設定
 */
const swrConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5 * 60 * 1000, // 5分
  focusThrottleInterval: 5 * 60 * 1000, // 5分
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

/**
 * ワークオーダー一覧を取得するフック
 */
export function useWorkOrders(jobId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<WorkOrder[]>>(
    jobId ? `${WORK_ORDERS_API_BASE_URL}/${jobId}/work-orders` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch work orders: ${response.statusText}`);
      }
      return response.json();
    },
    swrConfig
  );

  return {
    workOrders: data?.success ? data.data : [],
    isLoading,
    isError: error,
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
















