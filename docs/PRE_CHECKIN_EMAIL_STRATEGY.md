# 事前チェックイン用メール送信戦略

**作成日:** 2024年
**目的:** 事前チェックイン用メール送信の最適な実装方法の検討

---

## 現在の状況

### 既存の通知方法

1. **LINE通知（主な方法）**
   - `sendLineNotification` を使用
   - マジックリンクを動的に生成してLINE通知に含める
   - 見積送付、作業完了などで使用

2. **メール送信**
   - 現在未実装
   - 事前チェックイン用に必要

### ユーザー環境

- Google Workspace有料版でGmailを使用
- Zoho CRMを使用

---

## 選択肢の比較

### 1. Zoho CRMの自動メール機能

**メリット:**
- 設定が簡単（CRM内で完結）
- CRMと統合されている
- 追加の実装が不要

**デメリット:**
- **マジックリンクの動的生成が難しい**
  - 事前チェックイン用のマジックリンクは、ジョブごとに動的に生成する必要がある
  - Zoho CRMの自動メールでは、テンプレートに固定URLを埋め込むことはできるが、動的なマジックリンク生成は困難
- カスタマイズ性が低い
- メールテンプレートの柔軟性が低い

**結論:** ❌ **推奨しない**
- マジックリンクを動的に生成する必要があるため、Zoho CRMの自動メールでは実現が困難

---

### 2. Webアプリからの送信（Gmail API使用）

**メリット:**
- ✅ **マジックリンクを動的に生成できる**
  - 既存のLINE通知パターンと統一できる
  - ジョブごとに動的にマジックリンクを生成してメールに含める
- 柔軟性が高い
- 既存のGoogle Workspaceアカウントを使用
- メール送信履歴を管理できる

**デメリット:**
- 実装が必要
- Gmail APIの設定が必要（OAuth2認証）
- Google WorkspaceのAPI制限を考慮する必要がある

**実装内容:**
- Gmail APIを使用してメール送信
- マジックリンクを動的に生成してメール本文に含める
- メールテンプレートを管理

**結論:** ✅ **推奨（高機能が必要な場合）**

---

### 3. Webアプリからの送信（SMTP使用）

**メリット:**
- ✅ **マジックリンクを動的に生成できる**
- Gmail APIより実装が簡単
- 既存のGmailアカウントを使用
- 環境変数で設定可能

**デメリット:**
- 実装が必要
- SMTP認証情報の管理が必要
- Google Workspaceのセキュリティ設定が必要（アプリパスワードなど）

**実装内容:**
- `nodemailer` などのライブラリを使用
- SMTP経由でメール送信
- マジックリンクを動的に生成してメール本文に含める

**結論:** ✅ **推奨（シンプルな実装）**

---

## 推奨実装方法

### **推奨: Webアプリからの送信（SMTP使用）**

**理由:**
1. **マジックリンクの動的生成が必須**
   - 事前チェックイン用のマジックリンクは、ジョブごとに動的に生成する必要がある
   - Zoho CRMの自動メールでは実現が困難

2. **既存パターンとの統一**
   - LINE通知と同じパターンで実装できる
   - マジックリンク生成ロジックを再利用できる

3. **実装の簡潔性**
   - SMTPはGmail APIより実装が簡単
   - 環境変数で設定可能

4. **Google Workspaceとの親和性**
   - 既存のGmailアカウントを使用
   - アプリパスワードで認証可能

---

## 実装方針

### 1. メール送信ライブラリの選択

**推奨: `nodemailer`**

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 2. 環境変数の設定

```env
# .env.local
# Gmail SMTP設定（アプリパスワードを使用）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # 16桁のアプリパスワード（スペースなしまたはスペースあり）
SMTP_FROM_NAME=Your Shop Name

# 注意: このファイルはGitにコミットしないでください
# .gitignore に .env.local が含まれていることを確認してください
```

**アプリパスワードの形式:**
- 16桁の文字列（例: `abcd efgh ijkl mnop`）
- スペースは含めても含めなくても動作します

### 3. 実装場所

**新規作成:**
- `src/lib/email.ts` - メール送信クライアント
- `src/lib/email-templates.ts` - メールテンプレート
- `src/app/api/email/send/route.ts` - メール送信API Route

**拡張:**
- `src/lib/line-api.ts` - マジックリンク生成（既存）
- `src/lib/api.ts` - メール送信関数の追加

### 4. メール送信フロー

```
予約確定 / 入庫前日
  ↓
マジックリンク生成（既存ロジックを再利用）
  ↓
メール送信（SMTP経由）
  ↓
顧客がメール内のリンクをクリック
  ↓
事前チェックインページにアクセス
```

---

## 送信制限と注意事項

### Gmailの送信制限

- **個人アカウント:** 24時間で最大500通
- **Google Workspaceアカウント:** 24時間で最大2,000通

**制限を超えた場合:**
- 一時的にメール送信が制限される可能性があります
- 大量送信が必要な場合は、専用のメール送信サービス（SendGrid、Mailgunなど）の検討を推奨

### セキュリティのベストプラクティス

1. **アプリパスワードの管理**
   - 環境変数（`.env.local`）に保存
   - Gitにコミットしない（`.gitignore`に追加）
   - 定期的に再生成を検討

2. **送信者アドレスの注意**
   - Gmailは認証されたアカウントのメールアドレスを送信者として設定します
   - `from`フィールドに異なるアドレスを指定しても、Gmailによって上書きされる可能性があります

3. **TLS/SSLの使用**
   - ポート587（TLS）または465（SSL）を使用
   - 暗号化通信を確実に行う

---

## 実装詳細

### 1. メール送信クライアント (`src/lib/email.ts`)

**重要:** 2024年9月30日以降、アプリパスワードまたはOAuth 2.0が必須です。

```typescript
import nodemailer from 'nodemailer';

// アプリパスワードを使用する場合（推奨：シンプル）
const transporter = nodemailer.createTransport({
  service: 'gmail', // または host: 'smtp.gmail.com'
  port: 587, // TLS用（465の場合は secure: true）
  secure: false, // TLSを使用（ポート587の場合）
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD, // アプリパスワード（16桁）
  },
});

// または、ポート465（SSL）を使用する場合
// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true, // SSLを使用
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASSWORD,
//   },
// });

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('メール送信エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'メール送信に失敗しました',
    };
  }
}
```

### 2. メールテンプレート (`src/lib/email-templates.ts`)

```typescript
export function createPreCheckinEmail(data: {
  customerName: string;
  vehicleName: string;
  serviceKind: string;
  preCheckinLink: string;
  entryDate: string;
}): { subject: string; html: string; text: string } {
  const subject = `【${data.serviceKind}】事前チェックインのお願い`;
  
  const html = `
    <div style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;">
      <h2>${data.customerName}様</h2>
      <p>お車の入庫が近づいてまいりました。</p>
      <p>事前チェックインのご入力をお願いいたします。</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
        <p><strong>車両:</strong> ${data.vehicleName}</p>
        <p><strong>作業:</strong> ${data.serviceKind}</p>
        <p><strong>入庫予定日:</strong> ${data.entryDate}</p>
      </div>
      
      <p>
        <a href="${data.preCheckinLink}" 
           style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          事前チェックインを入力する
        </a>
      </p>
      
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        このリンクは入庫日まで有効です。
      </p>
    </div>
  `;
  
  const text = `
${data.customerName}様

お車の入庫が近づいてまいりました。
事前チェックインのご入力をお願いいたします。

車両: ${data.vehicleName}
作業: ${data.serviceKind}
入庫予定日: ${data.entryDate}

以下のリンクから事前チェックインを入力してください：
${data.preCheckinLink}

このリンクは入庫日まで有効です。
  `;
  
  return { subject, html, text };
}
```

### 3. メール送信API Route (`src/app/api/email/send/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { createPreCheckinEmail } from '@/lib/email-templates';
import { generateMagicLink } from '@/lib/line-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, customerEmail, customerName, vehicleName, serviceKind, entryDate } = body;

    // マジックリンク生成（既存ロジックを再利用）
    const magicLinkResult = await generateMagicLink({
      jobId,
      expiresIn: 7 * 24 * 60 * 60, // 7日間
    });

    if (!magicLinkResult.success || !magicLinkResult.url) {
      return NextResponse.json(
        { success: false, error: 'マジックリンクの生成に失敗しました' },
        { status: 500 }
      );
    }

    // メールテンプレート生成
    const emailContent = createPreCheckinEmail({
      customerName,
      vehicleName,
      serviceKind,
      preCheckinLink: magicLinkResult.url.replace('/customer/approval/', '/customer/pre-checkin/'),
      entryDate,
    });

    // メール送信
    const result = await sendEmail({
      to: customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('メール送信APIエラー:', error);
    return NextResponse.json(
      { success: false, error: 'メール送信に失敗しました' },
      { status: 500 }
    );
  }
}
```

---

## Google Workspaceの設定（最新情報：2024-2025）

### ⚠️ 重要な変更点

**2024年9月30日以降、Googleは「安全性の低いアプリ」（LSA）のアクセスを完全に無効化しました。**
- ユーザー名とパスワードのみでの認証は使用不可
- **アプリパスワードまたはOAuth 2.0が必須**

### 1. アプリパスワードの生成（推奨：シンプルな実装）

**前提条件:**
- 2段階認証プロセスを有効化する必要があります

**手順:**
1. Googleアカウントにログイン
2. [セキュリティ設定](https://myaccount.google.com/security)に移動
3. **2段階認証プロセス** を有効化（まだの場合）
4. **アプリパスワード** を選択
5. 「アプリを選択」で「メール」を選択
6. 「デバイスを選択」で「その他（カスタム名）」を選択
7. 適切な名前（例: "Repair Shop DX"）を入力
8. **生成** をクリック
9. 表示された16桁のアプリパスワードを環境変数 `SMTP_PASSWORD` に設定

**注意:**
- アプリパスワードは一度しか表示されません
- 紛失した場合は再生成が必要です

### 2. OAuth 2.0認証（推奨：より安全）

**メリット:**
- より安全な認証方法
- トークンの有効期限管理が可能
- Google Workspaceのセキュリティポリシーに準拠

**デメリット:**
- 実装が複雑
- Google Cloud Consoleでの設定が必要

**実装方法:**
詳細は [Nodemailer公式ドキュメント](https://nodemailer.com/usage/using-gmail/) を参照してください。

### 3. 送信履歴について

**✅ Gmailの「送信済み」フォルダに自動保存されます**

- GmailのSMTPサーバー（`smtp.gmail.com`）を使用する場合、送信したメールは**自動的に「送信済み」フォルダに保存**されます
- これはGmailの仕様によるもので、追加の設定は不要です
- 送信履歴はGmailのWebインターフェースやメールクライアントで確認できます

**確認方法:**
- GmailのWebインターフェースで「送信済み」フォルダを確認
- メールクライアント（Outlook、Thunderbirdなど）で同期確認

---

## 実装チェックリスト

### 第1フェーズ

- [ ] Googleアカウントで2段階認証を有効化
- [ ] アプリパスワードを生成（16桁）
- [ ] 環境変数を設定（`.env.local`）
- [ ] `nodemailer` をインストール
- [ ] `src/lib/email.ts` を作成
- [ ] `src/lib/email-templates.ts` を作成
- [ ] `src/app/api/email/send/route.ts` を作成
- [ ] メール送信機能をテスト
- [ ] Gmailの「送信済み」フォルダで送信履歴を確認
- [ ] 送信制限を確認（個人: 500通/日、Workspace: 2,000通/日）

### セキュリティ確認

- [ ] アプリパスワードが正しく設定されているか確認
- [ ] 環境変数が`.env.local`に保存されているか確認（Gitにコミットされていないか）
- [ ] 送信テストでメールが正常に送信されるか確認
- [ ] Gmailの「送信済み」フォルダにメールが保存されているか確認

### 第2フェーズ（事前チェックイン実装時）

- [ ] 事前チェックイン用メール送信を統合
- [ ] マジックリンク生成ロジックを拡張
- [ ] メール送信履歴を管理（オプション）

---

## 代替案（Zoho CRMの自動メールを使用する場合）

もしZoho CRMの自動メールを使用する場合は、以下の制約があります：

1. **マジックリンクの動的生成が困難**
   - 固定URLをテンプレートに埋め込むことはできるが、ジョブごとの動的生成は困難
   - 代替案: 汎用的な事前チェックインページを作成し、顧客IDとジョブIDをクエリパラメータで渡す

2. **実装方法:**
   - Zoho CRMの自動メールテンプレートに固定URLを埋め込む
   - 例: `https://your-app.com/customer/pre-checkin?customerId={Customer_ID}&jobId={Job_ID}`
   - 事前チェックインページでクエリパラメータから顧客IDとジョブIDを取得

**結論:** この方法でも実現可能ですが、セキュリティ面でマジックリンクの方が優れています。

---

## 参照ドキュメント

- `docs/PRE_CHECKIN_STATUS.md` - 事前チェックイン実装状況
- `docs/CUSTOMER_NOTIFICATION_SYSTEM.md` - 顧客通知システム仕様
- `src/lib/line-api.ts` - LINE通知API（マジックリンク生成の参考）

---

## 更新履歴

- 2024年: 初版作成（メール送信戦略の検討）







