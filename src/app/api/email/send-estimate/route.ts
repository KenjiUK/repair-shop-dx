/**
 * 見積もりメール送信API Route
 * 
 * POST /api/email/send-estimate
 */

import { NextRequest, NextResponse } from "next/server";
import { EstimateEmailRequest, EmailSendResponse } from "@/lib/email-api";
import { fetchCustomerById } from "@/lib/api";
import { generateMagicLink } from "@/lib/line-api";
import { sendEmail } from "@/lib/email-api";

/**
 * 見積もりメールのHTML本文を生成
 */
function createEstimateEmailHtml(
  customerName: string,
  vehicleName: string,
  estimateUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>お見積もりのご案内</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #1a1a1a; margin-top: 0;">お見積もりのご案内</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
    <p style="font-size: 16px; margin-bottom: 16px;">
      ${customerName}様
    </p>
    
    <p style="font-size: 16px; margin-bottom: 16px;">
      いつもお世話になっております。ワイエムワークスです。
    </p>
    
    <p style="font-size: 16px; margin-bottom: 16px;">
      ${vehicleName}のお見積もりが完成いたしました。
    </p>
    
    <p style="font-size: 16px; margin-bottom: 24px;">
      以下のリンクから、お見積もり内容をご確認いただけます。
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${estimateUrl}" 
         style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        お見積もりを確認する
      </a>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 14px; color: #666; margin-bottom: 8px;">
        <strong>ご注意:</strong>
      </p>
      <ul style="font-size: 14px; color: #666; margin: 0; padding-left: 20px;">
        <li>このリンクは7日間有効です</li>
        <li>お見積もり内容を確認後、作業内容の承認をお願いいたします</li>
        <li>ご不明な点がございましたら、お気軽にお問い合わせください</li>
      </ul>
    </div>
  </div>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
    <p style="font-size: 12px; color: #999; margin: 0;">
      このメールは自動送信されています。返信はできません。<br>
      お問い合わせは、お電話またはお店まで直接ご連絡ください。
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 見積もりメールのプレーンテキスト本文を生成
 */
function createEstimateEmailText(
  customerName: string,
  vehicleName: string,
  estimateUrl: string
): string {
  return `
${customerName}様

いつもお世話になっております。ワイエムワークスです。

${vehicleName}のお見積もりが完成いたしました。

以下のリンクから、お見積もり内容をご確認いただけます。

${estimateUrl}

【ご注意】
・このリンクは7日間有効です
・お見積もり内容を確認後、作業内容の承認をお願いいたします
・ご不明な点がございましたら、お気軽にお問い合わせください

このメールは自動送信されています。返信はできません。
お問い合わせは、お電話またはお店まで直接ご連絡ください。
  `.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: EstimateEmailRequest = await request.json();

    // バリデーション
    if (!body.customerId || !body.jobId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "必須パラメータが不足しています（customerId, jobIdは必須です）",
          },
        } as EmailSendResponse,
        { status: 400 }
      );
    }

    // 顧客情報を取得
    const customerResult = await fetchCustomerById(body.customerId);
    if (!customerResult.success || !customerResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CUSTOMER_NOT_FOUND",
            message: "顧客情報の取得に失敗しました",
          },
        } as EmailSendResponse,
        { status: 404 }
      );
    }

    const customer = customerResult.data;
    const customerName = (customer as any).Full_Name || customer.Last_Name || "お客様";
    // TODO: Remove as any once type definition propagation is resolved.
    const customerEmail = (customer as any).Email || (customer as any).Secondary_Email;

    // メールアドレスがない場合
    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EMAIL_NOT_FOUND",
            message: "顧客のメールアドレスが見つかりません",
          },
        } as EmailSendResponse,
        { status: 400 }
      );
    }

    // 見積もりページのURLを取得（generateMagicLinkを使用）
    let estimateUrl = body.estimateUrl;

    // estimateUrlが指定されていない場合は、マジックリンクを生成
    if (!estimateUrl) {
      const magicLinkResult = await generateMagicLink({
        jobId: body.jobId,
        workOrderId: body.workOrderId,
        expiresIn: 7 * 24 * 60 * 60, // 7日間
      });

      if (!magicLinkResult.success || !magicLinkResult.url) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MAGIC_LINK_ERROR",
              message: "見積もりページのURL生成に失敗しました",
            },
          } as EmailSendResponse,
          { status: 500 }
        );
      }

      estimateUrl = magicLinkResult.url;
    }

    // 車両名を取得（簡易的に顧客名から推測、実際にはjobから取得すべき）
    const vehicleName = "お車"; // TODO: jobから車両情報を取得

    // メール本文を生成
    const htmlBody = createEstimateEmailHtml(customerName, vehicleName, estimateUrl);
    const textBody = createEstimateEmailText(customerName, vehicleName, estimateUrl);

    // メールを送信
    const emailResult = await sendEmail({
      to: customerEmail,
      subject: `【ワイエムワークス】${vehicleName}のお見積もりが完成しました`,
      htmlBody,
      textBody,
      jobId: body.jobId,
    });

    if (!emailResult.success) {
      return NextResponse.json(emailResult, { status: 500 });
    }

    return NextResponse.json(emailResult);
  } catch (error) {
    console.error("見積もりメール送信エラー:", error);
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




