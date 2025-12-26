# Vercelデプロイ時のフィードバック機能セットアップ

**テスト版デプロイ用ガイド**

---

## ✅ Vercelで動作するか？

**はい、動作します！** ただし、以下の設定が必要です。

---

## 1. 必要な環境変数の設定

Vercelのダッシュボードで以下の環境変数を設定してください：

### 必須環境変数

```
NEXT_PUBLIC_ENABLE_FEEDBACK=true
NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID=your-spreadsheet-id-here
GOOGLE_SHEETS_FEEDBACK_SHEET_NAME=フィードバック
```

### Google Sheetsに書き込む場合（推奨）

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**注意:** `GOOGLE_SERVICE_ACCOUNT_KEY` は、JSONファイルの内容をそのまま文字列として設定してください。

---

## 2. 環境変数の設定手順

### 2.1 Vercelダッシュボードで設定

1. Vercelのプロジェクトページを開く
2. 「Settings」→「Environment Variables」を開く
3. 以下の環境変数を追加：

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_ENABLE_FEEDBACK` | `true` | Production, Preview, Development |
| `NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID` | スプレッドシートID | Production, Preview, Development |
| `GOOGLE_SHEETS_FEEDBACK_SHEET_NAME` | `フィードバック` | Production, Preview, Development |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | JSON文字列 | Production, Preview, Development |

### 2.2 サービスアカウントキーの設定方法

1. Google Cloud Consoleでサービスアカウントキー（JSON）をダウンロード
2. JSONファイルを開く
3. 内容をコピー
4. Vercelの環境変数 `GOOGLE_SERVICE_ACCOUNT_KEY` に貼り付け
   - **重要:** 改行を含めず、1行の文字列として設定
   - または、JSONをエスケープして設定

**例:**
```json
{"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}
```

---

## 3. 動作モード

### 3.1 モックモード（サービスアカウントキーなし）

`GOOGLE_SERVICE_ACCOUNT_KEY` が設定されていない場合：
- ✅ フィードバックボタンは表示されます
- ✅ フィードバックを送信できます
- ⚠️ Google Sheetsには書き込まれません
- ✅ Vercelのログ（Functions Logs）に記録されます

**Vercelログの確認方法:**
1. Vercelダッシュボード → プロジェクト → 「Deployments」
2. 最新のデプロイメントをクリック
3. 「Functions」タブを開く
4. `/api/feedback` のログを確認

### 3.2 本番モード（サービスアカウントキーあり）

`GOOGLE_SERVICE_ACCOUNT_KEY` が設定されている場合：
- ✅ フィードバックボタンは表示されます
- ✅ フィードバックを送信できます
- ✅ Google Sheetsに自動保存されます
- ✅ Vercelのログにも記録されます

---

## 4. Google Sheetsの準備

### 4.1 スプレッドシートの作成

1. Google Sheetsで新しいスプレッドシートを作成
2. シート名を「フィードバック」に変更
3. 1行目に列ヘッダーを設定（詳細は `FEEDBACK_SYSTEM_SETUP.md` を参照）

### 4.2 サービスアカウントへの共有

1. スプレッドシートの「共有」をクリック
2. サービスアカウントのメールアドレス（`client_email`）を追加
3. 権限は「編集者」を選択
4. 「送信」をクリック

**サービスアカウントのメールアドレス:**
- JSONファイルの `client_email` フィールドに記載されています
- 例: `feedback-service@your-project.iam.gserviceaccount.com`

---

## 5. デプロイ後の確認

### 5.1 フィードバックボタンの表示確認

1. デプロイされたアプリを開く
2. 画面右下にフィードバックボタン（💬アイコン）が表示されることを確認

### 5.2 フィードバック送信のテスト

1. フィードバックボタンをクリック
2. カテゴリを選択
3. フィードバック内容を入力
4. 「送信」をクリック
5. 成功メッセージが表示されることを確認

### 5.3 Google Sheetsへの書き込み確認

1. Google Sheetsを開く
2. 新しい行が追加されていることを確認
3. データが正しく記録されていることを確認

### 5.4 エラーが発生した場合

**Vercelログの確認:**
1. Vercelダッシュボード → プロジェクト → 「Deployments」
2. 最新のデプロイメント → 「Functions」タブ
3. `/api/feedback` のログを確認

**よくあるエラー:**

| エラー | 原因 | 解決方法 |
|--------|------|----------|
| 「フィードバック機能は無効です」 | `NEXT_PUBLIC_ENABLE_FEEDBACK` が `true` になっていない | 環境変数を確認 |
| 「Google Sheets設定が不足しています」 | スプレッドシートIDが設定されていない | `NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID` を確認 |
| 「権限がありません」 | サービスアカウントにスプレッドシートへのアクセス権限がない | スプレッドシートの共有設定を確認 |
| 「認証の設定に問題があります」 | サービスアカウントキーの形式が正しくない | JSONの形式を確認 |

---

## 6. 本番環境へのデプロイ時の注意

**⚠️ 重要: 本番環境ではフィードバック機能を無効化してください**

本番環境用の環境変数設定：

```
NEXT_PUBLIC_ENABLE_FEEDBACK=false
```

または、環境変数を未設定にしてください。

---

## 7. トラブルシューティング

### 7.1 環境変数が反映されない

1. デプロイを再実行（環境変数を変更した後は再デプロイが必要）
2. 「Settings」→「Environment Variables」で環境変数が正しく設定されているか確認
3. 環境（Production/Preview/Development）が正しいか確認

### 7.2 サービスアカウントキーの形式

JSONファイルの内容をそのまま文字列として設定する必要があります。

**正しい形式:**
```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

**間違った形式:**
```
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'  # シングルクォートは不要
```

### 7.3 Vercelのログに記録されない

- モックモードの場合、Vercelの「Functions Logs」に記録されます
- ログが表示されない場合は、デプロイメントを再実行してください

---

## 8. まとめ

✅ **Vercelで動作します**
- 環境変数を正しく設定すれば、そのまま動作します
- サービスアカウントキーがない場合でも、モックモードで動作します（ログに記録）
- サービスアカウントキーを設定すれば、Google Sheetsに自動保存されます

**次のステップ:**
1. 環境変数を設定
2. Google Sheetsを準備
3. デプロイ
4. 動作確認








