/**
 * LINE通知送信API Route
 * 
 * POST /api/line/notify
 */

import { NextRequest, NextResponse } from "next/server";
import { LineNotificationRequest, LineNotificationResponse } from "@/lib/line-api";
import { createNotificationMessage } from "@/lib/line-templates";

export async function POST(request: NextRequest) {
  try {
    const body: LineNotificationRequest = await request.json();

    // バリデーション
    if (!body.lineUserId || !body.type || !body.jobId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "必須パラメータが不足しています",
          },
        } as LineNotificationResponse,
        { status: 400 }
      );
    }

    // LINE Messaging APIを使用して通知を送信
    // 環境変数が設定されていない場合はモックレスポンスを返す
    const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      console.warn("LINE_CHANNEL_ACCESS_TOKEN is not set. Using mock response.");
      
      // モックレスポンス
      // カスタムメッセージがある場合はそれを使用、なければテンプレートを使用
      let message;
      if (body.type === "parts_arrived" && body.data?.message) {
        // 全部品到着通知でカスタムメッセージが指定されている場合
        message = {
          type: "text" as const,
          text: body.data.message as string,
        };
      } else {
        message = createNotificationMessage(body.type, {
          customerName: body.data?.customerName as string || "顧客名",
          vehicleName: body.data?.vehicleName as string || "車両名",
          licensePlate: body.data?.licensePlate as string | undefined,
          serviceKind: body.data?.serviceKind as string || "作業種類",
          jobId: body.jobId,
          magicLinkUrl: body.data?.magicLinkUrl as string | undefined,
          bookingLink: body.data?.bookingLink as string | undefined,
          additionalData: body.data,
        });
      }

      console.log("LINE通知（モック）:", {
        lineUserId: body.lineUserId,
        type: body.type,
        message: message.text,
      });

      return NextResponse.json({
        success: true,
        messageId: `mock-${Date.now()}`,
      } as LineNotificationResponse);
    }

    // 実際のLINE Messaging API呼び出し
    // 参考: https://developers.line.biz/ja/reference/messaging-api/#send-push-message
    // カスタムメッセージがある場合はそれを使用、なければテンプレートを使用
    let message;
    if (body.type === "parts_arrived" && body.data?.message) {
      // 全部品到着通知でカスタムメッセージが指定されている場合
      message = {
        type: "text" as const,
        text: body.data.message as string,
      };
    } else {
      message = createNotificationMessage(body.type, {
        customerName: body.data?.customerName as string || "顧客名",
        vehicleName: body.data?.vehicleName as string || "車両名",
        licensePlate: body.data?.licensePlate as string | undefined,
        serviceKind: body.data?.serviceKind as string || "作業種類",
        jobId: body.jobId,
        magicLinkUrl: body.data?.magicLinkUrl as string | undefined,
        bookingLink: body.data?.bookingLink as string | undefined,
        additionalData: body.data,
      });
    }

    const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: body.lineUserId,
        messages: [message],
      }),
    });

    if (!lineResponse.ok) {
      const error = await lineResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.message || "LINE_API_ERROR",
            message: error.message || "LINE Messaging API呼び出しに失敗しました",
          },
        } as LineNotificationResponse,
        { status: lineResponse.status }
      );
    }

    const lineData = await lineResponse.json();
    return NextResponse.json({
      success: true,
      messageId: lineData.sentMessages?.[0]?.id || `line-${Date.now()}`,
    } as LineNotificationResponse);
  } catch (error) {
    console.error("LINE通知送信エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "内部エラーが発生しました",
        },
      } as LineNotificationResponse,
      { status: 500 }
    );
  }
}










