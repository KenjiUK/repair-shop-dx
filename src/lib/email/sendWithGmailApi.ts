/**
 * Gmail APIを使用したメール送信ユーティリティ
 * 
 * Service Account + Domain Wide Delegationを使用
 * エイリアス送信対応（From: service@ymworks.com, Reply-To: ymc@ymworks.com）
 */

import { google } from "googleapis";

// =============================================================================
// Types
// =============================================================================

export type EmailPurpose = "見積承認" | "予約確認" | "作業完了" | "ご連絡";

export interface SendWithGmailApiParams {
  /** 宛先メールアドレス */
  to: string;
  /** 件名本文（例: ◯◯様｜BMW X5｜ご確認のお願い） */
  subjectBody: string;
  /** 目的（件名のプレフィックス） */
  purpose: EmailPurpose;
  /** 本文（HTML） */
  html: string;
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Gmail APIを使用してメールを送信
 * 
 * @param params メール送信パラメータ
 * @returns 送信されたメールのID
 * @throws Error 送信に失敗した場合
 */
export async function sendWithGmailApi(
  params: SendWithGmailApiParams
): Promise<string> {
  const { to, subjectBody, purpose, html } = params;

  // 環境変数の取得
  const GMAIL_CLIENT_EMAIL = process.env.GMAIL_CLIENT_EMAIL;
  const GMAIL_PRIVATE_KEY = process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL;
  const GMAIL_FROM_EMAIL = process.env.GMAIL_FROM_EMAIL;
  const GMAIL_FROM_NAME = process.env.GMAIL_FROM_NAME;
  const GMAIL_REPLY_TO_EMAIL = process.env.GMAIL_REPLY_TO_EMAIL;
  const GMAIL_REPLY_TO_NAME = process.env.GMAIL_REPLY_TO_NAME;

  // 必須環境変数のチェック
  if (!GMAIL_CLIENT_EMAIL) {
    throw new Error("GMAIL_CLIENT_EMAIL が設定されていません");
  }
  if (!GMAIL_PRIVATE_KEY) {
    throw new Error("GMAIL_PRIVATE_KEY が設定されていません");
  }
  if (!GMAIL_USER_EMAIL) {
    throw new Error("GMAIL_USER_EMAIL が設定されていません");
  }
  if (!GMAIL_FROM_EMAIL) {
    throw new Error("GMAIL_FROM_EMAIL が設定されていません");
  }
  if (!GMAIL_FROM_NAME) {
    throw new Error("GMAIL_FROM_NAME が設定されていません");
  }
  if (!GMAIL_REPLY_TO_EMAIL) {
    throw new Error("GMAIL_REPLY_TO_EMAIL が設定されていません");
  }
  if (!GMAIL_REPLY_TO_NAME) {
    throw new Error("GMAIL_REPLY_TO_NAME が設定されていません");
  }

  // メールアドレスの形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    throw new Error(`無効なメールアドレス形式です: ${to}`);
  }

  try {
    // JWT認証でGmail APIクライアントを作成
    // Domain Wide Delegationを使用するため、subjectパラメータを指定
    const auth = new google.auth.JWT({
      email: GMAIL_CLIENT_EMAIL,
      key: GMAIL_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
      subject: GMAIL_USER_EMAIL, // Domain Wide Delegationに必要
    });

    const gmail = google.gmail({ version: "v1", auth });

    // 件名を生成（【{purpose}】{subjectBody}）
    const subject = `【${purpose}】${subjectBody}`;

    // 件名をRFC 2047に準拠した形式でエンコード（日本語対応）
    // Gmail APIはUTF-8をサポートしているが、一部のメールクライアントで文字化けを防ぐため
    function encodeSubject(subject: string): string {
      // ASCII文字のみの場合はそのまま返す
      if (/^[\x00-\x7F]*$/.test(subject)) {
        return subject;
      }
      // 日本語を含む場合はBase64エンコード（RFC 2047形式）
      const encoded = Buffer.from(subject, "utf-8").toString("base64");
      return `=?UTF-8?B?${encoded}?=`;
    }

    const encodedSubject = encodeSubject(subject);

    // MIMEメールを組み立て
    const rawMessage = [
      `From: "${GMAIL_FROM_NAME}" <${GMAIL_FROM_EMAIL}>`,
      `To: ${to}`,
      `Reply-To: "${GMAIL_REPLY_TO_NAME}" <${GMAIL_REPLY_TO_EMAIL}>`,
      `Subject: ${encodedSubject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      html,
    ].join("\n");

    // Base64URLエンコード（RFC 2045に準拠）
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

    // メールIDを返す
    if (!response.data.id) {
      throw new Error("メール送信に成功しましたが、メールIDが取得できませんでした");
    }

    return response.data.id;
  } catch (error) {
    // エラーを再スロー（エラーメッセージを明確にする）
    if (error instanceof Error) {
      throw new Error(`Gmail API送信エラー: ${error.message}`);
    }
    throw new Error(`Gmail API送信エラー: ${String(error)}`);
  }
}

