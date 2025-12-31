/**
 * メール送信テスト用API Route
 * 
 * GET /api/email/test?to=test@example.com
 * 
 * テスト用のメールを送信します
 */

import { NextRequest, NextResponse } from "next/server";
import { sendWithGmailApi } from "@/lib/email/sendWithGmailApi";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const to = searchParams.get("to");

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error: "toパラメータが必要です。例: /api/email/test?to=your-email@example.com",
          note: "toパラメータは「宛先（送信先）」のメールアドレスです。送信元（service@ymworks.com）ではありません。",
        },
        { status: 400 }
      );
    }

    // テスト用のメールを送信
    const messageId = await sendWithGmailApi({
      to,
      subjectBody: "テストメール｜動作確認",
      purpose: "ご連絡",
      html: `
        <div style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif; padding: 20px;">
          <h2>テストメール</h2>
          <p>これはGmail APIメール送信のテストメールです。</p>
          <p>このメールが届いていれば、メール送信機能が正常に動作しています。</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            送信日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      messageId,
      message: "メール送信に成功しました",
      details: {
        from: process.env.GMAIL_FROM_EMAIL || "service@ymworks.com",
        replyTo: process.env.GMAIL_REPLY_TO_EMAIL || "ymc@ymworks.com",
        to,
        subject: "【ご連絡】テストメール｜動作確認",
      },
    });
  } catch (error) {
    console.error("メール送信テストエラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "メール送信に失敗しました",
      },
      { status: 500 }
    );
  }
}

