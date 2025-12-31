# Gmail API有効化ガイド

**作成日:** 2024年  
**目的:** Gmail APIの有効化手順

---

## エラーメッセージ

```
Gmail API has not been used in project 542188869396 before or it is disabled. 
Enable it by visiting https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=542188869396
```

---

## 解決方法

### 手順1: Google Cloud ConsoleでGmail APIを有効化

1. **エラーメッセージ内のリンクにアクセス**
   - または、以下のURLにアクセス：
     ```
     https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=542188869396
     ```

2. **Gmail APIを有効化**
   - 「有効にする」または「Enable」ボタンをクリック
   - APIが有効化されるまで数分かかる場合があります

3. **有効化の確認**
   - 「APIが有効になりました」というメッセージが表示される
   - または、API一覧で「Gmail API」のステータスが「有効」になっていることを確認

---

### 手順2: 代替方法（Google Cloud Consoleから直接）

1. **Google Cloud Consoleにアクセス**
   - https://console.cloud.google.com/

2. **プロジェクトを選択**
   - プロジェクトID: `542188869396`
   - または、プロジェクト名で検索

3. **APIとサービス > ライブラリ** に移動
   - 左側のメニューから「APIとサービス」→「ライブラリ」を選択

4. **Gmail APIを検索**
   - 検索バーで「Gmail API」と入力
   - 「Gmail API」を選択

5. **Gmail APIを有効化**
   - 「有効にする」または「Enable」ボタンをクリック

---

### 手順3: 有効化後の確認

1. **数分待つ**
   - APIが有効化されてから、システムに反映されるまで数分かかる場合があります

2. **再度テスト**
   - ブラウザで以下のURLにアクセス：
     ```
     http://localhost:3000/api/email/test?to=your-email@example.com
     ```

3. **成功を確認**
   - レスポンス: `{"success": true, "messageId": "...", "message": "メール送信に成功しました"}`
   - メールが届いているか確認

---

## 必要な権限

### Service Accountの権限

**Domain Wide Delegationを使用する場合:**
1. **Google Admin Console**で設定が必要
2. Service AccountのクライアントIDを登録
3. スコープ: `https://www.googleapis.com/auth/gmail.send`

**設定手順:**
1. Google Admin Consoleにアクセス
2. 「セキュリティ」→「API制御」→「ドメイン全体の委任」を選択
3. Service AccountのクライアントIDを追加
4. スコープ: `https://www.googleapis.com/auth/gmail.send` を設定

---

## トラブルシューティング

### 問題1: APIを有効化してもエラーが続く

**解決方法:**
1. 数分待ってから再度試す（APIの反映に時間がかかる場合がある）
2. Google Cloud ConsoleでAPIが正しく有効化されているか確認
3. プロジェクトが正しく選択されているか確認

---

### 問題2: 権限エラーが発生する

**エラーメッセージ例:**
```
Insufficient Permission
```

**解決方法:**
1. Domain Wide Delegationの設定を確認
2. Service AccountのクライアントIDが正しく登録されているか確認
3. スコープが正しく設定されているか確認

---

### 問題3: エイリアスからの送信ができない

**解決方法:**
1. Gmailでエイリアス（`service@ymworks.com`）が設定されているか確認
2. エイリアスが正しく設定されているか確認
3. Fromヘッダーにエイリアスが指定されているか確認

---

## 確認チェックリスト

- [ ] Google Cloud ConsoleでGmail APIが有効化されている
- [ ] Domain Wide Delegationが設定されている
- [ ] Service AccountのクライアントIDが登録されている
- [ ] スコープ `https://www.googleapis.com/auth/gmail.send` が設定されている
- [ ] Gmailでエイリアス（`service@ymworks.com`）が設定されている
- [ ] 環境変数が正しく設定されている
- [ ] `npm run dev` を再起動した

---

## 参照ドキュメント

- `docs/EMAIL_IMPLEMENTATION_REVIEW.md` - メール送信実装レビュー
- `docs/GMAIL_ALIAS_SENDING_GUIDE.md` - Gmailエイリアスからのメール送信ガイド
- `docs/EMAIL_TEST_GUIDE.md` - メール送信テストガイド

---

## 更新履歴

- 2024年: 初版作成（Gmail API有効化ガイド）

