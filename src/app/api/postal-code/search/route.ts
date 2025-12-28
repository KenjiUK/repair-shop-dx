/**
 * 郵便番号検索API Route
 * 
 * CORSエラーを回避するためのサーバーサイドプロキシ
 * GET /api/postal-code/search?zipcode=1234567
 * 
 * 使用API: 日本郵便の郵便番号データを使用したAPIサービス
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zipcode = searchParams.get("zipcode");

    if (!zipcode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PARAM",
            message: "郵便番号が指定されていません",
          },
        },
        { status: 400 }
      );
    }

    // 郵便番号を数字のみに変換
    const cleanPostalCode = zipcode.replace(/\D/g, "");
    
    // 7桁でない場合はエラー
    if (cleanPostalCode.length !== 7) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_FORMAT",
            message: "郵便番号は7桁の数字で入力してください",
          },
        },
        { status: 400 }
      );
    }

    // 日本郵便の郵便番号データを使用したAPIサービス
    // メイン: 日本郵便のCSVデータを使用した公開サービス
    const apiUrl = `https://api.zipaddress.net/?zipcode=${cleanPostalCode}`;

    // タイムアウト設定
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒でタイムアウト
    
    console.log(`[郵便番号API] 検索開始: ${cleanPostalCode}`);
    console.log(`[郵便番号API] URL: ${apiUrl}`);
    
    let response: Response;
    try {
      response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        throw new Error("リクエストがタイムアウトしました");
      }
      console.error(`[郵便番号API] fetchエラー:`, fetchError);
      throw fetchError;
    }

    console.log(`[郵便番号API] レスポンスステータス: ${response.status}`);

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
        console.error(`[郵便番号API] エラーレスポンス (${response.status}):`, errorText.substring(0, 500));
      } catch (e) {
        console.error(`[郵便番号API] エラーレスポンスの読み取りに失敗:`, e);
      }
      
      if (response.status === 500) {
        throw new Error(`郵便番号検索APIがエラーを返しました（ステータス: 500）`);
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let data;
    let responseText = "";
    try {
      responseText = await response.text();
      console.log(`[郵便番号API] レスポンスボディ（全長: ${responseText.length}）:`, responseText.substring(0, 1000));
      
      if (!responseText.trim()) {
        throw new Error("APIレスポンスが空です");
      }
      
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("[郵便番号API] JSON解析エラー:", jsonError);
      console.error("[郵便番号API] レスポンステキスト:", responseText.substring(0, 500));
      throw new Error(`APIレスポンスの解析に失敗しました: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }

    // zipaddress.net API の実際のレスポンス形式を処理
    // レスポンス形式を確認して柔軟に対応
    console.log("[郵便番号API] レスポンスデータ構造:", JSON.stringify(data, null, 2));
    
    // パターン1: zipaddress.net の形式 { code: 200, data: { pref: "...", address: "...", city: "..." } }
    // 注意: dataは配列ではなくオブジェクトの場合がある
    if (data.code === 200) {
      if (data.data) {
        // dataが配列の場合
        if (Array.isArray(data.data) && data.data.length > 0) {
          const address = data.data[0];
          const prefecture = address.pref || address.prefecture || "";
          const city = address.address || address.city || "";
          const town = address.city || address.town || "";
          
          if (prefecture || city || town) {
            console.log(`[郵便番号API] 住所取得成功（配列形式）: ${prefecture}${city}${town}`);
            return NextResponse.json({
              success: true,
              data: [{
                prefecture,
                city,
                town,
              }],
            });
          }
        } 
        // dataがオブジェクトの場合
        else if (typeof data.data === 'object' && !Array.isArray(data.data)) {
          const address = data.data;
          const prefecture = address.pref || address.prefecture || "";
          const city = address.address || address.city || "";
          const town = address.city || address.town || "";
          
          if (prefecture || city || town) {
            console.log(`[郵便番号API] 住所取得成功（オブジェクト形式）: ${prefecture}${city}${town}`);
            return NextResponse.json({
              success: true,
              data: [{
                prefecture,
                city,
                town,
              }],
            });
          }
        }
      }
    }
    
    // パターン2: zipcloud形式 { status: 200, results: [{ prefecture: "...", city: "...", town: "..." }] }
    if (data.status === 200 && data.results && Array.isArray(data.results) && data.results.length > 0) {
      const address = data.results[0];
      const prefecture = address.prefecture || address.address1 || "";
      const city = address.city || address.address2 || "";
      const town = address.town || address.address3 || "";
      
      if (prefecture || city || town) {
        console.log(`[郵便番号API] 住所取得成功（zipcloud形式）: ${prefecture}${city}${town}`);
        return NextResponse.json({
          success: true,
          data: [{
            prefecture,
            city,
            town,
          }],
        });
      }
    }
    
    // パターン3: エラーレスポンスの場合
    if (data.code && data.code !== 200) {
      const errorMessage = data.message || data.error || "郵便番号が見つかりませんでした";
      console.error(`[郵便番号API] APIエラーレスポンス (code: ${data.code}):`, errorMessage);
      throw new Error(errorMessage);
    }

    // 結果がない場合
    console.warn("[郵便番号API] 未対応のレスポンス形式:", JSON.stringify(data, null, 2).substring(0, 500));
    throw new Error("郵便番号が見つかりませんでした");
  } catch (error) {
    console.error("郵便番号検索API Route エラー:", error);
    
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("エラースタック:", error.stack);
    }
    
    let errorMessage = "郵便番号検索中にエラーが発生しました";
    if (error instanceof Error) {
      if (error.message.includes("aborted") || error.name === "AbortError") {
        errorMessage = "リクエストがタイムアウトしました。しばらく待ってから再度お試しください";
      } else if (error.message.includes("fetch") || error.message.includes("network")) {
        errorMessage = "郵便番号検索サービスに接続できませんでした。インターネット接続を確認してください";
      } else if (error.message.includes("見つかりません")) {
        errorMessage = "該当する郵便番号が見つかりませんでした";
      } else {
        errorMessage = `エラー: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

