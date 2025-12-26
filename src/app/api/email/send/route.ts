/**
 * メール送信API Route
 * 
 * POST /api/email/send
 */

import { NextRequest, NextResponse } from "next/server";
import { EmailSendRequest, EmailSendResponse } from "@/lib/email-api";
import { google } from "googleapis";

export async function POST(request: NextRequest) {
  try {
    const body: EmailSendRequest = await request.json();

    // バリデーション
    if (!body.to || !body.subject || !body.htmlBody) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "必須パラメータが不足しています（to, subject, htmlBodyは必須です）",
          },
        } as EmailSendResponse,
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "無効なメールアドレス形式です",
          },
        } as EmailSendResponse,
        { status: 400 }
      );
    }

    // Gmail APIの認証情報が設定されているか確認
    const GMAIL_CLIENT_EMAIL = process.env.GMAIL_CLIENT_EMAIL;
    const GMAIL_PRIVATE_KEY = process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL;

    // 認証情報が設定されていない場合はモックレスポンスを返す
    if (!GMAIL_CLIENT_EMAIL || !GMAIL_PRIVATE_KEY || !GMAIL_USER_EMAIL) {
      console.warn("Gmail API credentials are not set. Using mock response.");
      console.log("メール送信（モック）:", {
        to: body.to,
        subject: body.subject,
        htmlBody: body.htmlBody.substring(0, 100) + "...",
      });

      return NextResponse.json({
        success: true,
        messageId: `mock-${Date.now()}`,
      } as EmailSendResponse);
    }

    // Gmail APIを使用してメールを送信
    try {
      // JWT認証でGmail APIクライアントを作成
      const auth = new google.auth.JWT({
        email: GMAIL_CLIENT_EMAIL,
        key: GMAIL_PRIVATE_KEY,
        scopes: ["https://www.googleapis.com/auth/gmail.send"],
      });

      const gmail = google.gmail({ version: "v1", auth });

      // メール本文をMIME形式に変換
      const rawMessage = [
        `To: ${body.to}`,
        `Subject: ${body.subject}`,
        "Content-Type: text/html; charset=utf-8",
        "",
        body.htmlBody,
      ].join("\n");

      // Base64エンコード（RFC 2045に準拠）
      const encodedMessage = Buffer.from(rawMessage)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      // メールを送信
      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      });

      return NextResponse.json({
        success: true,
        messageId: response.data.id || `gmail-${Date.now()}`,
      } as EmailSendResponse);
    } catch (gmailError) {
      console.error("Gmail API送信エラー:", gmailError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GMAIL_API_ERROR",
            message:
              gmailError instanceof Error
                ? gmailError.message
                : "Gmail API呼び出しに失敗しました",
          },
        } as EmailSendResponse,
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("メール送信エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "内部エラーが発生しました",
        },
      } as EmailSendResponse,
      { status: 500 }
    );
  }
}




