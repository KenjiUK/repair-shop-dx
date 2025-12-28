/**
 * 郵便番号検索API
 * 
 * Next.js API Route経由で郵便番号検索を実行
 * CORSエラーを回避するため、常にサーバーサイド経由で処理
 */

export interface PostalCodeResult {
  /** 都道府県 */
  prefecture: string;
  /** 市区町村 */
  city: string;
  /** 町域 */
  town: string;
}

export interface PostalCodeApiResponse {
  success: boolean;
  data?: PostalCodeResult[];
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 郵便番号から住所を検索
 * 
 * @param postalCode 郵便番号（7桁の数字、ハイフンなし）
 * @returns 郵便番号検索結果
 */
export async function searchPostalCode(
  postalCode: string
): Promise<PostalCodeApiResponse> {
  try {
    // 郵便番号を数字のみに変換（ハイフンなどを除去）
    const cleanPostalCode = postalCode.replace(/\D/g, "");
    
    // 7桁でない場合はエラー
    if (cleanPostalCode.length !== 7) {
      return {
        success: false,
        error: {
          code: "INVALID_FORMAT",
          message: "郵便番号は7桁の数字で入力してください",
        },
      };
    }

    // Next.js API Route経由で検索（CORSエラーを回避）
    const apiResponse = await fetch(
      `/api/postal-code/search?zipcode=${cleanPostalCode}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!apiResponse.ok) {
      return {
        success: false,
        error: {
          code: "API_ERROR",
          message: `郵便番号検索に失敗しました（ステータス: ${apiResponse.status}）`,
        },
      };
    }

    const apiData = await apiResponse.json();
    
    if (apiData.success) {
      return apiData;
    } else {
      return {
        success: false,
        error: {
          code: apiData.error?.code || "API_ERROR",
          message: apiData.error?.message || "郵便番号が見つかりませんでした",
        },
      };
    }
  } catch (error) {
    console.error("郵便番号検索エラー:", error);
    
    // エラーメッセージを詳細化
    let errorMessage = "郵便番号検索中にエラーが発生しました";
    if (error instanceof Error) {
      if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
        errorMessage = "ネットワークエラーが発生しました。インターネット接続を確認してください";
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: errorMessage,
      },
    };
  }
}
