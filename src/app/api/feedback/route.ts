/**
 * フィードバック送信API
 * テスト版専用機能
 */

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

/**
 * POST /api/feedback
 * フィードバックをGoogle Sheetsに保存
 */
export async function POST(request: NextRequest) {
  // テスト版のみ有効
  if (process.env.NEXT_PUBLIC_ENABLE_FEEDBACK !== "true") {
    return NextResponse.json(
      { success: false, error: { message: "フィードバック機能は無効です" } },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      category,
      content,
      urgency,
      pathname,
      pageName,
      jobId,
      customerName,
      vehicleInfo,
      userName,
      userAgent,
      screenSize,
      screenshotUrl,
    } = body;

    // バリデーション
    if (!category || !content || !pathname || !pageName) {
      return NextResponse.json(
        { success: false, error: { message: "必須項目が不足しています" } },
        { status: 400 }
      );
    }

    // 現在の日時
    const now = new Date();
    const dateTimeStr = now.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // カテゴリの表示名を取得
    const categoryLabels: Record<string, string> = {
      bug: "バグ報告",
      uiux: "UI/UX改善提案",
      feature: "機能要望",
      question: "質問・不明点",
      positive: "良い点",
      other: "その他",
    };

    const urgencyLabels: Record<string, string> = {
      low: "低",
      medium: "中",
      high: "高",
    };

    // Google Sheets設定
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID;
    const sheetName = process.env.GOOGLE_SHEETS_FEEDBACK_SHEET_NAME || "フィードバック";
    const gasWebAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL;

    // Google Apps Script (GAS) を使う場合
    if (gasWebAppUrl) {
      try {
        const response = await fetch(gasWebAppUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category,
            content,
            urgency,
            pathname,
            pageName,
            jobId,
            customerName,
            vehicleInfo,
            userName,
            userAgent,
            screenSize,
            screenshotUrl,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || "GASへの送信に失敗しました");
        }

        console.log("[Feedback API] Feedback submitted via GAS:", {
          category,
          pageName,
          userName,
        });

        return NextResponse.json({
          success: true,
          message: "フィードバックを送信しました",
        });
      } catch (error) {
        console.error("[Feedback API] GAS error:", error);
        return NextResponse.json(
          {
            success: false,
            error: {
              message: error instanceof Error ? error.message : "フィードバックの送信に失敗しました",
            },
          },
          { status: 500 }
        );
      }
    }

    // Google Sheets API認証
    // 注意: 本番環境ではサービスアカウントキーを使用する必要があります
    // モック環境では直接書き込まず、ログに出力
    const isMockMode = !process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !spreadsheetId;

    if (isMockMode) {
      // モック環境: コンソールに出力（Vercelのログに記録されます）
      console.log("[Feedback API] Mock mode - Feedback data:", {
        dateTime: dateTimeStr,
        category: categoryLabels[category] || category,
        pathname,
        pageName,
        jobId,
        customerName,
        vehicleInfo,
        content,
        urgency: urgencyLabels[urgency] || urgency,
        userName,
        userAgent,
        screenSize,
        screenshotUrl,
      });
      
      return NextResponse.json({
        success: true,
        message: "フィードバックを送信しました（モックモード - Vercelログに記録）",
      });
    }

    // 本番環境: Google Sheets APIを使用
    let auth;
    try {
      auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
    } catch (error) {
      console.error("[Feedback API] Failed to parse service account key:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Google Sheets認証の設定に問題があります",
          },
        },
        { status: 500 }
      );
    }

    const sheets = google.sheets({ version: "v4", auth });

    // データ行を準備
    const row = [
      dateTimeStr,                                    // 日時
      categoryLabels[category] || category,          // カテゴリ
      pathname,                                       // 画面パス
      pageName,                                       // 画面名
      jobId || "",                                    // ジョブID
      customerName || "",                             // 顧客名
      vehicleInfo || "",                              // 車両情報
      content,                                        // フィードバック内容
      urgencyLabels[urgency] || urgency,              // 緊急度
      userName || "未設定",                           // ユーザー名
      userAgent || "",                                // ブラウザ
      screenSize || "",                               // 画面サイズ
      screenshotUrl || "",                            // スクリーンショットURL
    ];

    // Google Sheetsに追加
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:M`, // A列からM列まで
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [row],
        },
      });

      console.log("[Feedback API] Feedback submitted to Google Sheets:", {
        category,
        pageName,
        userName,
        spreadsheetId,
        sheetName,
      });

      return NextResponse.json({
        success: true,
        message: "フィードバックを送信しました",
      });
    } catch (sheetsError: any) {
      console.error("[Feedback API] Google Sheets error:", {
        error: sheetsError.message,
        code: sheetsError.code,
        details: sheetsError.response?.data,
      });

      // エラーの詳細を返す
      let errorMessage = "Google Sheetsへの書き込みに失敗しました";
      if (sheetsError.code === 403) {
        errorMessage = "スプレッドシートへのアクセス権限がありません。サービスアカウントに編集権限を付与してください。";
      } else if (sheetsError.code === 404) {
        errorMessage = "スプレッドシートまたはシートが見つかりません。IDとシート名を確認してください。";
      } else if (sheetsError.message) {
        errorMessage = `Google Sheetsエラー: ${sheetsError.message}`;
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: errorMessage,
            details: sheetsError.response?.data || sheetsError.message,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Feedback API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "フィードバックの送信に失敗しました",
        },
      },
      { status: 500 }
    );
  }
}

