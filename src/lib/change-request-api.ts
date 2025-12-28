/**
 * 変更申請ログ クライアントAPI
 * 
 * スプレッドシートへの変更申請追記・取得用API
 */

import {
  ChangeRequestData,
  toSmartCarDealerFieldName,
} from "./change-request-mapping";


// =============================================================================
// API呼び出し
// =============================================================================

/**
 * 変更申請をスプレッドシートに追記
 * 
 * @param requests 変更申請データの配列
 * @returns 成功時は追記件数、失敗時はエラー
 */
export async function submitChangeRequests(
  requests: ChangeRequestData[]
): Promise<{ success: boolean; addedCount?: number; error?: string }> {
  try {
    const response = await fetch("/api/change-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error?.message || "変更申請の記録に失敗しました",
      };
    }

    return {
      success: true,
      addedCount: data.data.addedCount,
    };
  } catch (error) {
    console.error("[変更申請API] エラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "変更申請の記録に失敗しました",
    };
  }
}

/**
 * 開発用サンプルデータ
 */
const SAMPLE_CHANGE_REQUESTS: ChangeRequestLogEntry[] = [
  {
    申請ID: "CR-2025-SAMPLE1",
    申請日時: "2025/01/15 10:30:00",
    顧客ID: "K2344",
    顧客名: "小泉 隆宏",
    対象マスタ: "顧客",
    車両ID: "",
    変更項目: "携帯番号",
    変更前: "090-1234-5678",
    変更後: "080-9999-8888",
    ステータス: "未対応",
    対応日時: "",
    対応者: "",
    備考: "",
    ジョブID: "job-001",
    申請元: "事前チェックイン",
  },
  {
    申請ID: "CR-2025-SAMPLE2",
    申請日時: "2025/01/15 10:30:00",
    顧客ID: "K2344",
    顧客名: "小泉 隆宏",
    対象マスタ: "顧客",
    車両ID: "",
    変更項目: "住所",
    変更前: "静岡県磐田市中泉3039-17 ブライトタウン磐田中泉901号室",
    変更後: "静岡県浜松市中央区田町230-15 浜松タワー1501号室",
    ステータス: "未対応",
    対応日時: "",
    対応者: "",
    備考: "",
    ジョブID: "job-001",
    申請元: "事前チェックイン",
  },
  {
    申請ID: "CR-2025-SAMPLE3",
    申請日時: "2025/01/15 10:30:00",
    顧客ID: "K2344",
    顧客名: "小泉 隆宏",
    対象マスタ: "顧客",
    車両ID: "",
    変更項目: "メールアドレス",
    変更前: "koizumi@example.com",
    変更後: "koizumi.new@example.com",
    ステータス: "未対応",
    対応日時: "",
    対応者: "",
    備考: "",
    ジョブID: "job-001",
    申請元: "事前チェックイン",
  },
];

/**
 * 未対応の変更申請を取得
 * 
 * @param customerId 顧客IDでフィルタリング（オプション）
 * @returns 変更申請の配列
 */
export async function fetchPendingChangeRequests(
  customerId?: string
): Promise<{ success: boolean; data?: ChangeRequestLogEntry[]; error?: string }> {
  try {
    const url = new URL("/api/change-requests", window.location.origin);
    url.searchParams.set("status", "未対応");
    if (customerId) {
      url.searchParams.set("customerId", customerId);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // 開発環境でAPIエラー時はサンプルデータを返す
      if (process.env.NODE_ENV === "development") {
        console.log("[変更申請API] 開発環境: サンプルデータを使用");
        return {
          success: true,
          data: SAMPLE_CHANGE_REQUESTS,
        };
      }
      return {
        success: false,
        error: data.error?.message || "変更申請の取得に失敗しました",
      };
    }

    // データがない場合、開発環境ではサンプルデータを返す
    if (process.env.NODE_ENV === "development" && (!data.data || data.data.length === 0)) {
      console.log("[変更申請API] 開発環境: データなし、サンプルデータを使用");
      return {
        success: true,
        data: SAMPLE_CHANGE_REQUESTS,
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("[変更申請API] エラー:", error);
    
    // 開発環境でエラー時はサンプルデータを返す
    if (process.env.NODE_ENV === "development") {
      console.log("[変更申請API] 開発環境: エラー発生、サンプルデータを使用");
      return {
        success: true,
        data: SAMPLE_CHANGE_REQUESTS,
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "変更申請の取得に失敗しました",
    };
  }
}

/**
 * 未対応の変更申請があるかチェック
 * 
 * @param customerId 顧客ID（スマートカーディーラーのID）
 * @returns 未対応の変更申請があるかどうか
 */
export async function hasPendingChangeRequests(
  customerId: string
): Promise<boolean> {
  try {
    const result = await fetchPendingChangeRequests(customerId);
    return result.success && result.data && result.data.length > 0;
  } catch {
    return false;
  }
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 変更申請ログエントリの型
 */
export interface ChangeRequestLogEntry {
  申請ID: string;
  申請日時: string;
  顧客ID: string;
  顧客名: string;
  対象マスタ: string;
  車両ID: string;
  変更項目: string;
  変更前: string;
  変更後: string;
  ステータス: string;
  対応日時: string;
  対応者: string;
  備考: string;
  ジョブID: string;
  申請元: string;
}

/**
 * フォームデータから変更申請データを生成
 * 
 * @param params パラメータ
 * @returns 変更申請データの配列
 */
export function createChangeRequestsFromForm(params: {
  customerId: string;
  customerName: string;
  jobId?: string;
  source: string;
  changes: Array<{
    fieldName: string;
    oldValue: string | null | undefined;
    newValue: string | null | undefined;
    masterType?: "customer" | "vehicle";
    vehicleId?: string;
  }>;
}): ChangeRequestData[] {
  const { customerId, customerName, jobId, source, changes } = params;

  return changes
    .filter((change) => {
      // 変更がある場合のみ
      const oldVal = change.oldValue || "";
      const newVal = change.newValue || "";
      return newVal && newVal !== oldVal;
    })
    .map((change) => {
      const masterType = change.masterType || "customer";
      const smartCarDealerFieldName = toSmartCarDealerFieldName(
        change.fieldName,
        masterType
      );

      return {
        customerId,
        customerName,
        masterType: masterType === "customer" ? "顧客" : "車両",
        vehicleId: change.vehicleId,
        fieldName: smartCarDealerFieldName,
        oldValue: change.oldValue || "（未設定）",
        newValue: change.newValue || "",
        jobId,
        source,
      } as ChangeRequestData;
    });
}

/**
 * スプレッドシートのURLを生成
 * 
 * @returns スプレッドシートURL
 */
export function getChangeRequestSpreadsheetUrl(): string {
  const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_MASTER_DATA_ID || "";
  if (!spreadsheetId) {
    return "";
  }
  // 「変更申請ログ」タブを開く（gid=0はデフォルト、実際のgidはスプレッドシートから取得）
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`;
}

/**
 * 変更申請を対応完了にする
 * 
 * @param requestIds 対応完了にする申請IDの配列
 * @returns 成功/失敗
 */
export async function markChangeRequestsCompleted(
  requestIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // 開発環境でサンプルデータの場合はモック成功を返す
    if (process.env.NODE_ENV === "development") {
      const isSampleData = requestIds.some((id) => id.includes("SAMPLE"));
      if (isSampleData) {
        console.log("[変更申請API] 開発環境: サンプルデータの対応完了（モック）");
        return { success: true };
      }
    }

    // 各申請IDに対して対応完了処理を実行
    const results = await Promise.all(
      requestIds.map(async (requestId) => {
        const response = await fetch(`/api/change-requests/${requestId}/complete`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        });
        return response.ok;
      })
    );

    const allSuccess = results.every((r) => r);
    
    if (!allSuccess) {
      return {
        success: false,
        error: "一部の変更申請の対応完了に失敗しました",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[変更申請API] 対応完了エラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "対応完了処理に失敗しました",
    };
  }
}
