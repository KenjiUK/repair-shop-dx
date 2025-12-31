# メール送信機能実装サマリー

**作成日:** 2024年  
**目的:** Gmail APIメール送信機能の実装完了サマリー

---

## 実装完了日

2024年12月31日

---

## 実装内容

### 1. Gmail APIメール送信ユーティリティ

**ファイル:** `src/lib/email/sendWithGmailApi.ts`

**機能:**
- Service Account + Domain Wide Delegationを使用
- エイリアス送信対応（From: service@ymworks.com, Reply-To: ymc@ymworks.com）
- 件名の形式ルール（【{purpose}】{subjectBody}）
- RFC 2047に準拠した件名エンコーディング（日本語対応）
- MIMEメールを自前で組み立て
- Base64URLエンコード

**主な特徴:**
- エラー時はErrorをthrow
- 環境変数の検証
- メールアドレスの形式チェック

---

### 2. メール送信テスト用API Route

**ファイル:** `src/app/api/email/test/route.ts`

**機能:**
- GET `/api/email/test?to=your-email@example.com`
- テスト用のメールを送信
- 送信結果をJSON形式で返す

---

### 3. QRコード仕様の見直し

**ファイル:** `src/components/features/job-card.tsx`

**変更内容:**
- 顧客向けQRコードを削除（メール/LINE通知を使用するため不要）
- 整備士向けQRコードをタグIDベースの固定QRコードに変更
- タグID（例: "0"）をQRコード化
- 入庫から出庫まで同じタグを使用
- タグは再利用可能

**ドキュメント:**
- `docs/QR_CODE_SPECIFICATION_REVIEW.md` - QRコード仕様見直しドキュメント

---

## 環境変数

`.env.local`に以下を設定：

```env
# Gmail API (Service Account + Domain Wide Delegation)
GMAIL_CLIENT_EMAIL=your-service-account@yourproject.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GMAIL_USER_EMAIL=ymc@ymworks.com
GMAIL_FROM_EMAIL=service@ymworks.com
GMAIL_FROM_NAME=ワイエムワークス
GMAIL_REPLY_TO_EMAIL=ymc@ymworks.com
GMAIL_REPLY_TO_NAME=ワイエムワークス
```

---

## 設定手順

### 1. Google Cloud Consoleでの設定

1. **Gmail APIを有効化**
   - https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project={PROJECT_ID}
   - 「有効にする」ボタンをクリック

2. **Domain Wide Delegationの設定**
   - Google Admin Consoleで設定
   - Service AccountのクライアントIDを登録
   - スコープ: `https://www.googleapis.com/auth/gmail.send`

### 2. Gmailでの設定

1. **エイリアスの設定**
   - Gmailの設定でエイリアス（`service@ymworks.com`）を追加
   - 「エイリアスとして扱います」にチェック

---

## 使用方法

### 基本的な使用方法

```typescript
import { sendWithGmailApi } from "@/lib/email/sendWithGmailApi";

try {
  const messageId = await sendWithGmailApi({
    to: "customer@example.com",
    subjectBody: "田中様｜BMW X5｜ご確認のお願い",
    purpose: "見積承認",
    html: "<p>メール本文（HTML）</p>",
  });
  console.log("メール送信成功:", messageId);
} catch (error) {
  console.error("メール送信エラー:", error);
}
```

### テスト方法

```
http://localhost:3000/api/email/test?to=your-email@example.com
```

---

## メールの構成

**送信されるメール:**
- **From（送信元）:** `service@ymworks.com`（エイリアス）
- **Reply-To（返信先）:** `ymc@ymworks.com`
- **To（宛先）:** 指定したメールアドレス
- **件名:** `【{purpose}】{subjectBody}`（RFC 2047エンコード済み）
- **本文:** HTML形式（UTF-8）

---

## 技術的な実装詳細

### 1. Domain Wide Delegation

```typescript
const auth = new google.auth.JWT({
  email: GMAIL_CLIENT_EMAIL,
  key: GMAIL_PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/gmail.send"],
  subject: GMAIL_USER_EMAIL, // Domain Wide Delegationに必要
});
```

### 2. 件名のエンコーディング

```typescript
function encodeSubject(subject: string): string {
  // ASCII文字のみの場合はそのまま返す
  if (/^[\x00-\x7F]*$/.test(subject)) {
    return subject;
  }
  // 日本語を含む場合はBase64エンコード（RFC 2047形式）
  const encoded = Buffer.from(subject, "utf-8").toString("base64");
  return `=?UTF-8?B?${encoded}?=`;
}
```

### 3. MIMEメールの組み立て

```typescript
const rawMessage = [
  `From: "${GMAIL_FROM_NAME}" <${GMAIL_FROM_EMAIL}>`,
  `To: ${to}`,
  `Reply-To: "${GMAIL_REPLY_TO_NAME}" <${GMAIL_REPLY_TO_EMAIL}>`,
  `Subject: ${encodedSubject}`,
  "Content-Type: text/html; charset=utf-8",
  "",
  html,
].join("\n");
```

### 4. Base64URLエンコード

```typescript
const encodedMessage = Buffer.from(rawMessage)
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");
```

---

## テスト結果

### 成功確認項目

- ✅ Gmail APIが有効化されている
- ✅ Domain Wide Delegationが設定されている
- ✅ エイリアス（`service@ymworks.com`）が設定されている
- ✅ メール送信が成功する
- ✅ 件名が正しく表示される（文字化けなし）
- ✅ 送信元が `service@ymworks.com` になっている
- ✅ 返信先が `ymc@ymworks.com` になっている
- ✅ Gmailの「送信済み」フォルダに保存されている

---

## 関連ドキュメント

- `docs/EMAIL_IMPLEMENTATION_REVIEW.md` - メール送信実装レビュー
- `docs/GMAIL_ALIAS_SENDING_GUIDE.md` - Gmailエイリアスからのメール送信ガイド
- `docs/EMAIL_TEST_GUIDE.md` - メール送信テストガイド
- `docs/GMAIL_API_SETUP_GUIDE.md` - Gmail API有効化ガイド
- `docs/QR_CODE_SPECIFICATION_REVIEW.md` - QRコード仕様見直しドキュメント

---

## 今後の拡張予定

1. **事前問診メール送信**
   - 予約確定時または入庫前日にメール送信
   - マジックリンクを含める

2. **見積承認メール送信**
   - 見積送付時にメール送信
   - マジックリンクを含める

3. **作業完了メール送信**
   - 作業完了時にメール送信
   - レポートリンクを含める

---

## 更新履歴

- 2024年12月31日: 初版作成（メール送信機能実装完了サマリー）

