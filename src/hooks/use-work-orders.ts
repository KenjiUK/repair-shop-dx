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
      
      try {
        const response = await fetch(url);
        
        // レスポンスのステータスとステータステキストを先に取得
        const status = response.status;
        const statusText = response.statusText;
        
        if (!response.ok) {
          let errorText = "";
          let errorJson: unknown = null;
          
          try {
            // レスポンスボディをクローンして読み取る（一度しか読み取れないため）
            const clonedResponse = response.clone();
            errorText = await clonedResponse.text();
            
            // JSONとしてパースを試みる
            if (errorText && errorText.trim()) {
              try {
                errorJson = JSON.parse(errorText);
              } catch (parseError) {
                // JSONでない場合はそのまま使用
                if (process.env.NODE_ENV === "development") {
                  console.warn("[useWorkOrders] エラーレスポンスのJSONパースに失敗:", parseError);
                }
              }
            }
          } catch (readError) {
            // テキスト取得に失敗した場合
            const errorMessage = readError instanceof Error ? readError.message : String(readError);
            errorText = `Failed to read error response: ${errorMessage}`;
            if (process.env.NODE_ENV === "development") {
              console.warn("[useWorkOrders] エラーレスポンスの読み取りに失敗:", readError);
            }
          }
          
          // 404エラーの場合は空配列を返す（ジョブが存在しない場合）
          if (status === 404) {
            if (process.env.NODE_ENV === "development") {
              console.warn("[useWorkOrders] ジョブが見つかりません（404）。空配列を返します。", {
                url,
                status,
                statusText: statusText || "(empty)",
              });
            }
            return { success: true, data: [] };
          }
          
          // 詳細なエラーログを出力
          const errorInfo: Record<string, unknown> = {
            url,
            status,
            statusText: statusText || "(empty)",
            hasErrorText: !!errorText,
            errorTextLength: errorText?.length || 0,
          };
          
          if (errorText) {
            errorInfo.errorText = errorText.substring(0, 500); // 最初の500文字のみ
          }
          
          if (errorJson) {
            errorInfo.errorJson = errorJson;
          }
          
          if (process.env.NODE_ENV === "development") {
            console.error("[useWorkOrders] フェッチエラー:", JSON.stringify(errorInfo, null, 2));
          }
          
          // エラーメッセージを構築
          const errorMessage = errorJson && typeof errorJson === "object" && "error" in errorJson
            ? (errorJson.error as { message?: string })?.message || statusText
            : errorText || statusText || `HTTP ${status}`;
          
          throw new Error(`Failed to fetch work orders (${status}): ${errorMessage}`);
        }
        
        const json = await response.json();
        
        if (process.env.NODE_ENV === "development") {
          console.log("[useWorkOrders] フェッチ成功:", {
            url,
            success: json.success,
            dataLength: json.data?.length,
          });
        }
        
        return json;
      } catch (error) {
        // fetch自体が失敗した場合（ネットワークエラーなど）
        if (process.env.NODE_ENV === "development") {
          console.error("[useWorkOrders] フェッチ例外:", {
            url,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
        throw error;
      }
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
    console.error("[useWorkOrders] SWRエラー:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error,
      error: error,
    });
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
























