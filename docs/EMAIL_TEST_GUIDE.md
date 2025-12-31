# メール送信テストガイド

**作成日:** 2024年  
**目的:** Gmail APIメール送信機能のテスト方法

---

## テスト方法

### 方法1: ブラウザから直接テスト（推奨）

**手順:**
1. ブラウザで以下のURLにアクセス：
   ```
   http://localhost:3000/api/email/test?to=your-email@example.com
   ```
   - `your-email@example.com` を実際のメールアドレスに置き換えてください

2. レスポンスを確認：
   - 成功時: `{"success": true, "messageId": "...", "message": "メール送信に成功しました"}`
   - 失敗時: `{"success": false, "error": "エラーメッセージ"}`

3. メールを確認：
   - 指定したメールアドレスにメールが届いているか確認
   - 送信元: `service@ymworks.com`（エイリアス）
   - 返信先: `ymc@ymworks.com`
   - 件名: `【ご連絡】テストメール｜動作確認`

---

### 方法2: curlコマンドでテスト

**コマンド:**
```bash
curl "http://localhost:3000/api/email/test?to=your-email@example.com"
```

**レスポンス例:**
```json
{
  "success": true,
  "messageId": "18a1b2c3d4e5f6g7",
  "message": "メール送信に成功しました"
}
```

---

### 方法3: 開発者ツールのコンソールからテスト

**ブラウザの開発者ツール（F12）のコンソールで実行:**
```javascript
fetch('/api/email/test?to=your-email@example.com')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

---

## 確認事項

### 1. メールが届いているか

- ✅ 指定したメールアドレスにメールが届いているか
- ✅ 送信元が `service@ymworks.com` になっているか
- ✅ 返信先が `ymc@ymworks.com` になっているか
- ✅ 件名が `【ご連絡】テストメール｜動作確認` になっているか

### 2. Gmailの「送信済み」フォルダ

- ✅ `ymc@ymworks.com` のGmailアカウントで「送信済み」フォルダを確認
- ✅ 送信したメールが「送信済み」フォルダに保存されているか

### 3. 返信テスト

- ✅ メールに返信して、`ymc@ymworks.com` に届くか確認

---

## エラーが発生した場合

### エラー1: "GMAIL_CLIENT_EMAIL が設定されていません"

**原因:**
- 環境変数が正しく設定されていない
- `.env.local` ファイルが読み込まれていない

**解決方法:**
1. `.env.local` ファイルを確認
2. `npm run dev` を再起動
3. 環境変数が正しく設定されているか確認

---

### エラー2: "Gmail API送信エラー: ..."

**原因:**
- Domain Wide Delegationの設定が正しくない
- Service Accountの権限が不足している
- エイリアスが正しく設定されていない

**解決方法:**
1. Google Admin ConsoleでDomain Wide Delegationの設定を確認
2. Service AccountのクライアントIDが正しく登録されているか確認
3. スコープ `https://www.googleapis.com/auth/gmail.send` が設定されているか確認
4. Gmailでエイリアス（`service@ymworks.com`）が設定されているか確認

---

### エラー3: "無効なメールアドレス形式です"

**原因:**
- メールアドレスの形式が正しくない

**解決方法:**
- 正しいメールアドレス形式（例: `test@example.com`）を指定

---

## テスト用のメールアドレス

**推奨:**
- 自分のメールアドレスを使用
- テスト用のメールアドレスを使用

**注意:**
- 実際の顧客のメールアドレスには送信しないでください

---

## 次のステップ

テストが成功したら：

1. **実際の機能に統合**
   - 事前問診メール送信
   - 見積承認メール送信
   - 作業完了メール送信

2. **メールテンプレートの作成**
   - 各用途に応じたメールテンプレートを作成

3. **エラーハンドリングの強化**
   - リトライ機能
   - エラーログの記録

---

## 参照ドキュメント

- `src/lib/email/sendWithGmailApi.ts` - メール送信ユーティリティ
- `docs/EMAIL_IMPLEMENTATION_REVIEW.md` - メール送信実装レビュー
- `docs/GMAIL_ALIAS_SENDING_GUIDE.md` - Gmailエイリアスからのメール送信ガイド

---

## 更新履歴

- 2024年: 初版作成（メール送信テストガイド）

