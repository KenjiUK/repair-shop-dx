# Gmailエイリアスからのメール送信ガイド

**作成日:** 2024年  
**目的:** Gmailエイリアスからのメール送信方法と送信履歴の管理について

---

## 質問への回答

### Q1: 会社の指定したGmailのメールアドレス（エイリアスで作る予定）から送付できますか？

**A: はい、可能です。ただし、送信方法によって実装が異なります。**

---

## Gmailエイリアスとは？

**Gmailエイリアス**は、同じGmailアカウントで複数のメールアドレスを使用できる機能です。

**例:**
- メインアカウント: `info@yourdomain.com`
- エイリアス: `noreply@yourdomain.com`、`support@yourdomain.com` など

**メリット:**
- 1つのGmailアカウントで複数のメールアドレスを管理できる
- 送信者名を用途に応じて使い分けられる
- 受信トレイは1つにまとまる

---

## 送信方法の比較

### 方法1: SMTP経由（nodemailer使用）

**実装方法:**
```typescript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // メインアカウント（例: info@yourdomain.com）
    pass: process.env.SMTP_PASSWORD, // アプリパスワード
  },
});

// エイリアスを指定
await transporter.sendMail({
  from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`, // エイリアス
  to: options.to,
  subject: options.subject,
  html: options.html,
});
```

**環境変数の設定:**
```env
SMTP_USER=info@yourdomain.com  # メインアカウント（認証用）
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # アプリパスワード
SMTP_FROM_EMAIL=noreply@yourdomain.com  # エイリアス（送信者として表示）
SMTP_FROM_NAME=Your Shop Name
```

**注意点:**
- ⚠️ **Gmailの制限**: SMTP経由の場合、Gmailは認証されたアカウント（`SMTP_USER`）のメールアドレスを送信者として設定する可能性があります
- ✅ **解決策**: Gmail APIを使用することで、エイリアスを確実に指定できます

---

### 方法2: Gmail API経由（推奨）

**実装方法:**
```typescript
// Gmail APIを使用（既存の実装を参照）
const gmail = google.gmail({ version: "v1", auth });

// エイリアスを指定してメールを送信
const rawMessage = [
  `From: ${fromEmail}`, // エイリアス（例: noreply@yourdomain.com）
  `To: ${body.to}`,
  `Subject: ${body.subject}`,
  "Content-Type: text/html; charset=utf-8",
  "",
  body.htmlBody,
].join("\n");

await gmail.users.messages.send({
  userId: "me",
  requestBody: {
    raw: encodedMessage,
  },
});
```

**メリット:**
- ✅ **エイリアスを確実に指定できる**
- ✅ **送信履歴がGmailの「送信済み」フォルダに自動保存される**
- ✅ **Gmailの機能をフル活用できる**

**環境変数の設定:**
```env
GMAIL_CLIENT_EMAIL=your-service-account@yourproject.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GMAIL_USER_EMAIL=info@yourdomain.com  # メインアカウント（権限委譲用）
```

**エイリアスの指定:**
```typescript
// エイリアスを環境変数で指定
const FROM_EMAIL = process.env.GMAIL_FROM_EMAIL || process.env.GMAIL_USER_EMAIL;
// 例: GMAIL_FROM_EMAIL=noreply@yourdomain.com
```

---

## Q2: 送信履歴はGmailの送信ボックスなどに残りますか？

**A: はい、残ります。送信方法に関わらず、Gmailの「送信済み」フォルダに自動保存されます。**

### 送信履歴の保存方法

#### 1. SMTP経由の場合

**動作:**
- GmailのSMTPサーバー（`smtp.gmail.com`）を使用する場合
- 送信したメールは**自動的に「送信済み」フォルダに保存**されます
- 追加の設定は不要です

**確認方法:**
- GmailのWebインターフェースで「送信済み」フォルダを確認
- メールクライアント（Outlook、Thunderbirdなど）で同期確認

---

#### 2. Gmail API経由の場合

**動作:**
- Gmail APIを使用する場合も、送信したメールは**自動的に「送信済み」フォルダに保存**されます
- `gmail.users.messages.send` APIを使用すると、送信したメールが自動的に保存されます

**確認方法:**
- GmailのWebインターフェースで「送信済み」フォルダを確認
- 送信履歴をAPI経由で取得することも可能（`gmail.users.messages.list`）

---

## 実装例

### エイリアス対応のメール送信関数

```typescript
// src/lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // メインアカウント（認証用）
    pass: process.env.SMTP_PASSWORD, // アプリパスワード
  },
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string; // エイリアス（オプション）
  fromName?: string; // 送信者名（オプション）
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // エイリアスを指定（指定がない場合は環境変数から取得）
    const fromEmail = options.fromEmail || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = options.fromName || process.env.SMTP_FROM_NAME || "Your Shop Name";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`, // エイリアスを指定
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

---

### Gmail APIを使用する場合（推奨）

```typescript
// src/lib/email-gmail-api.ts
import { google } from "googleapis";

export async function sendEmailWithGmailAPI(options: {
  to: string;
  subject: string;
  html: string;
  fromEmail?: string; // エイリアス（オプション）
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const GMAIL_CLIENT_EMAIL = process.env.GMAIL_CLIENT_EMAIL;
    const GMAIL_PRIVATE_KEY = process.env.GMAIL_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL;

    if (!GMAIL_CLIENT_EMAIL || !GMAIL_PRIVATE_KEY || !GMAIL_USER_EMAIL) {
      throw new Error("Gmail API認証情報が設定されていません");
    }

    // JWT認証でGmail APIクライアントを作成
    const auth = new google.auth.JWT({
      email: GMAIL_CLIENT_EMAIL,
      key: GMAIL_PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
      subject: GMAIL_USER_EMAIL, // 権限委譲先のメールアドレス
    });

    const gmail = google.gmail({ version: "v1", auth });

    // エイリアスを指定（指定がない場合は環境変数から取得）
    const fromEmail = options.fromEmail || process.env.GMAIL_FROM_EMAIL || GMAIL_USER_EMAIL;

    // メール本文をMIME形式に変換
    const rawMessage = [
      `From: ${fromEmail}`, // エイリアスを指定
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      options.html,
    ].join("\n");

    // Base64エンコード
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // メールを送信（自動的に「送信済み」フォルダに保存される）
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      success: true,
      messageId: response.data.id || `gmail-${Date.now()}`,
    };
  } catch (error) {
    console.error("Gmail API送信エラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gmail API呼び出しに失敗しました",
    };
  }
}
```

---

## Gmailエイリアスの設定方法

### 1. Gmailでエイリアスを設定

1. **Gmailにログイン**
2. **設定を開く**（右上の歯車アイコン → 「すべての設定を表示」）
3. **「アカウントとインポート」タブ**をクリック
4. **「名前」セクション**で「他のメールアドレスを追加」をクリック
5. **エイリアス情報を入力**
   - **名前**: 送信時に表示される名前（例: "Your Shop Name"）
   - **メールアドレス**: エイリアス（例: `noreply@yourdomain.com`）
6. **「エイリアスとして扱います」にチェック**を入れる
7. **「次のステップ」**をクリック
8. **確認メールを受信**して確認手続きを完了

### 2. Google Workspaceの場合

**Google Workspace管理者が設定:**
1. **Google Admin Console**にログイン
2. **「ユーザー」** → **「エイリアス」**を選択
3. **エイリアスを追加**（例: `noreply@yourdomain.com`）
4. **対象ユーザーを選択**（例: `info@yourdomain.com`）

---

## 環境変数の設定例

### SMTP経由の場合

```env
# .env.local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@yourdomain.com  # メインアカウント（認証用）
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # アプリパスワード
SMTP_FROM_EMAIL=noreply@yourdomain.com  # エイリアス（送信者として表示）
SMTP_FROM_NAME=Your Shop Name
```

### Gmail API経由の場合（推奨）

```env
# .env.local
GMAIL_CLIENT_EMAIL=your-service-account@yourproject.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GMAIL_USER_EMAIL=info@yourdomain.com  # メインアカウント（権限委譲用）
GMAIL_FROM_EMAIL=noreply@yourdomain.com  # エイリアス（送信者として表示）
GMAIL_FROM_NAME=Your Shop Name
```

---

## まとめ

### Q1: エイリアスから送付できますか？

**A: はい、可能です。**

**推奨方法:**
- ✅ **Gmail API経由**（エイリアスを確実に指定できる）
- ⚠️ **SMTP経由**（Gmailの制限により、エイリアスが反映されない可能性がある）

### Q2: 送信履歴は残りますか？

**A: はい、残ります。**

**送信方法に関わらず:**
- ✅ **Gmailの「送信済み」フォルダに自動保存**されます
- ✅ **追加の設定は不要**です
- ✅ **GmailのWebインターフェースで確認**できます

---

## 参照ドキュメント

- `docs/PRE_CHECKIN_EMAIL_STRATEGY.md` - 事前チェックイン用メール送信戦略
- `src/app/api/email/send/route.ts` - メール送信API（Gmail API使用の実装例）
- `src/lib/email-api.ts` - メール送信API（型定義）

---

## 更新履歴

- 2024年: 初版作成（Gmailエイリアスからのメール送信ガイド）

