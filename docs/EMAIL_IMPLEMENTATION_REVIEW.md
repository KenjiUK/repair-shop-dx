# メール送信実装レビュー

**作成日:** 2024年  
**目的:** 提案されたGmail APIメール送信実装のレビュー

---

## 提案内容の概要

### 要件
- Gmail APIを使用したメール送信ユーティリティ
- Service Account + Domain Wide Delegation
- エイリアス送信（From: service@ymworks.com, Reply-To: ymc@ymworks.com）
- 件名の形式ルール（【{purpose}】{本文件名}）
- MIMEメールを自前で組み立てる
- Base64URLエンコード

---

## レビュー結果

### ✅ 問題なく実装可能な項目

1. **Gmail APIの使用**
   - 既存の実装（`src/app/api/email/send/route.ts`）と一致
   - `googleapis`ライブラリを使用
   - `gmail.users.messages.send`を使用

2. **MIMEメールの組み立て**
   - 既存の実装と一致
   - 自前でMIME形式を組み立てる方法

3. **Base64URLエンコード**
   - 既存の実装と一致
   - RFC 2045に準拠したエンコード方法

4. **エラーハンドリング**
   - Errorをthrowする方式は問題なし
   - 既存の実装はNextResponse形式だが、ユーティリティ関数として分離する場合はthrow方式が適切

---

## ⚠️ 修正が必要な項目

### 1. Domain Wide Delegationの設定（重要）

**問題点:**
既存の実装では、JWT認証に`subject`パラメータが含まれていません。

**既存の実装:**
```typescript
const auth = new google.auth.JWT({
  email: GMAIL_CLIENT_EMAIL,
  key: GMAIL_PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/gmail.send"],
  // subjectパラメータがない
});
```

**修正が必要:**
```typescript
const auth = new google.auth.JWT({
  email: GMAIL_CLIENT_EMAIL,
  key: GMAIL_PRIVATE_KEY,
  scopes: ["https://www.googleapis.com/auth/gmail.send"],
  subject: GMAIL_USER_EMAIL, // Domain Wide Delegationに必要
});
```

**理由:**
- Domain Wide Delegationを使用する場合、`subject`パラメータで権限委譲先のユーザー（`ymc@ymworks.com`）を指定する必要があります
- これがないと、Service Accountとして認証され、ユーザーのメールボックスにアクセスできません

---

### 2. From/Reply-Toヘッダーの設定

**問題点:**
既存の実装では、From/Reply-Toヘッダーが設定されていません。

**既存の実装:**
```typescript
const rawMessage = [
  `To: ${body.to}`,
  `Subject: ${body.subject}`,
  "Content-Type: text/html; charset=utf-8",
  "",
  body.htmlBody,
].join("\n");
```

**修正が必要:**
```typescript
const rawMessage = [
  `From: "${GMAIL_FROM_NAME}" <${GMAIL_FROM_EMAIL}>`,
  `To: ${to}`,
  `Reply-To: "${GMAIL_REPLY_TO_NAME}" <${GMAIL_REPLY_TO_EMAIL}>`,
  `Subject: ${subject}`,
  "Content-Type: text/html; charset=utf-8",
  "",
  html,
].join("\n");
```

**理由:**
- Fromヘッダーでエイリアス（`service@ymworks.com`）を指定
- Reply-Toヘッダーで返信先（`ymc@ymworks.com`）を指定
- これにより、顧客が返信すると`ymc@ymworks.com`に届く

---

### 3. 件名の形式ルール

**問題点:**
既存の実装では、件名の形式ルールがありません。

**提案された実装:**
```typescript
const subject = `【${purpose}】${subjectBody}`;
```

**確認事項:**
- 件名の形式ルールは要件として明確に定義されている
- 実装は問題なし

---

### 4. MIMEメールの組み立て（改善提案）

**現在の提案:**
```typescript
const rawMessage = [
  `From: ...`,
  `To: ...`,
  `Reply-To: ...`,
  `Subject: ...`,
  "Content-Type: text/html; charset=utf-8",
  "",
  html,
].join("\n");
```

**改善提案:**
MIMEメールの組み立てをより堅牢にするため、以下の点を考慮：

1. **文字エンコーディングの明示**
   - 件名に日本語が含まれる場合、RFC 2047に準拠したエンコーディングが必要
   - 例: `Subject: =?UTF-8?B?44CQ...?=`

2. **複数行の件名の処理**
   - 件名が長い場合の折り返し処理

3. **メールアドレスの検証**
   - From/Reply-To/Toのメールアドレス形式チェック

---

## 実装上の注意点

### 1. 環境変数の設定

**必要な環境変数:**
```env
GMAIL_CLIENT_EMAIL=your-service-account@yourproject.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GMAIL_USER_EMAIL=ymc@ymworks.com  # Domain Wide Delegation用
GMAIL_FROM_EMAIL=service@ymworks.com  # エイリアス
GMAIL_FROM_NAME=ワイエムワークス
GMAIL_REPLY_TO_EMAIL=ymc@ymworks.com
GMAIL_REPLY_TO_NAME=ワイエムワークス
```

**確認事項:**
- すべての環境変数が設定されているか
- `GMAIL_PRIVATE_KEY`の改行文字（`\n`）が正しく処理されているか

---

### 2. Domain Wide Delegationの設定

**Google Admin Consoleでの設定が必要:**
1. Service AccountのクライアントIDを取得
2. Google Admin ConsoleでDomain Wide Delegationを有効化
3. スコープを設定: `https://www.googleapis.com/auth/gmail.send`

**確認事項:**
- Domain Wide Delegationが正しく設定されているか
- スコープが正しく設定されているか

---

### 3. エイリアスの設定

**Gmailでエイリアスを設定:**
1. Gmailの設定でエイリアス（`service@ymworks.com`）を追加
2. エイリアスが正しく設定されているか確認

**確認事項:**
- エイリアスが正しく設定されているか
- エイリアスから送信できるか

---

## 実装の推奨事項

### 1. 件名のエンコーディング

**日本語を含む件名の場合:**
```typescript
import { encode } from 'utf8';

function encodeSubject(subject: string): string {
  // RFC 2047に準拠したエンコーディング
  // 簡易版: Base64エンコード
  const encoded = Buffer.from(subject, 'utf-8').toString('base64');
  return `=?UTF-8?B?${encoded}?=`;
}
```

**注意:**
- Gmail APIはUTF-8をサポートしているため、通常はエンコーディング不要
- ただし、一部のメールクライアントで文字化けする可能性があるため、RFC 2047に準拠したエンコーディングを推奨

---

### 2. エラーハンドリング

**提案された実装:**
```typescript
// エラー時はErrorをthrow
if (!GMAIL_CLIENT_EMAIL || !GMAIL_PRIVATE_KEY || !GMAIL_USER_EMAIL) {
  throw new Error("Gmail API認証情報が設定されていません");
}
```

**推奨:**
- エラーメッセージを明確にする
- エラーの種類に応じて異なるエラーメッセージを返す

---

### 3. 型定義

**提案された型:**
```typescript
{
  to: string;
  subjectBody: string;
  purpose: "見積承認" | "予約確認" | "作業完了" | "ご連絡";
  html: string;
}
```

**推奨:**
- 型定義を別ファイル（`src/lib/email/types.ts`）に分離
- 再利用可能な型として定義

---

## 既存の実装との統合

### 既存のAPI Routeとの関係

**既存の実装:**
- `src/app/api/email/send/route.ts` - 汎用的なメール送信API
- `src/lib/email-api.ts` - メール送信APIクライアント

**提案された実装:**
- `src/lib/email/sendWithGmailApi.ts` - 専用のGmail API送信ユーティリティ

**統合方法:**
1. **新規ユーティリティ関数として追加**（推奨）
   - 既存のAPI Routeは維持
   - 新しいユーティリティ関数を追加
   - 必要に応じて既存のAPI Routeから呼び出す

2. **既存のAPI Routeを置き換え**
   - 既存の実装を新しい実装に置き換える
   - 既存の呼び出し元に影響がある可能性

---

## まとめ

### ✅ 実装可能

提案された実装は、以下の修正を行えば問題なく実装可能です：

1. **Domain Wide Delegationの設定**
   - JWT認証に`subject`パラメータを追加

2. **From/Reply-Toヘッダーの設定**
   - MIMEメールにFrom/Reply-Toヘッダーを追加

3. **件名の形式ルール**
   - 件名を自動生成するロジックを実装

4. **エラーハンドリング**
   - Errorをthrowする方式で実装

### ⚠️ 注意事項

1. **Domain Wide Delegationの設定が必要**
   - Google Admin Consoleでの設定が必要
   - Service AccountのクライアントIDを登録

2. **エイリアスの設定が必要**
   - Gmailでエイリアス（`service@ymworks.com`）を設定

3. **環境変数の設定**
   - すべての環境変数が正しく設定されているか確認

4. **既存の実装との統合**
   - 既存のAPI Routeとの関係を考慮
   - 必要に応じて既存の実装を更新

---

## 推奨される実装順序

1. **環境変数の設定**
   - `.env.local`に必要な環境変数を追加

2. **Domain Wide Delegationの設定**
   - Google Admin Consoleで設定

3. **エイリアスの設定**
   - Gmailでエイリアスを設定

4. **ユーティリティ関数の実装**
   - `src/lib/email/sendWithGmailApi.ts`を作成

5. **テスト**
   - メール送信のテスト
   - エイリアスからの送信確認
   - 返信先の確認

6. **既存の実装との統合**
   - 必要に応じて既存のAPI Routeを更新

---

## 参照ドキュメント

- `docs/GMAIL_ALIAS_SENDING_GUIDE.md` - Gmailエイリアスからのメール送信ガイド
- `docs/PRE_CHECKIN_EMAIL_STRATEGY.md` - 事前チェックイン用メール送信戦略
- `src/app/api/email/send/route.ts` - 既存のメール送信API実装

---

## 更新履歴

- 2024年: 初版作成（メール送信実装レビュー）

