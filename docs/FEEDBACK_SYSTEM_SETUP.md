# フィードバック機能 セットアップガイド

**テスト版専用機能**

---

## 1. Google Sheetsの準備

### 1.1 スプレッドシートの作成

1. Google Sheetsで新しいスプレッドシートを作成
2. シート名を「フィードバック」に変更（または任意の名前）
3. スプレッドシートIDをコピー（URLから取得）
   - 例: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
   - `{SPREADSHEET_ID}` の部分をコピー

### 1.2 列ヘッダーの設定

スプレッドシートの1行目に以下の列ヘッダーを設定：

| 列 | ヘッダー名 | 説明 |
|----|-----------|------|
| A | 日時 | 送信日時 |
| B | カテゴリ | フィードバックの種類 |
| C | 画面パス | 現在の画面パス |
| D | 画面名 | 画面名（自動判定） |
| E | ジョブID | ジョブID（該当する場合） |
| F | 顧客名 | 顧客名（該当する場合） |
| G | 車両情報 | 車両情報（該当する場合） |
| H | フィードバック内容 | ユーザー入力内容 |
| I | 緊急度 | 緊急度（低/中/高） |
| J | ユーザー名 | ユーザー名 |
| K | ブラウザ | User Agent |
| L | 画面サイズ | 画面サイズ |
| M | スクリーンショットURL | スクリーンショット（あれば） |

### 1.3 共有設定

1. スプレッドシートの「共有」をクリック
2. サービスアカウントのメールアドレスに「編集者」権限を付与
   - サービスアカウントのメールアドレスは、Google Cloud Consoleで確認できます

---

## 2. Google Cloud Consoleの設定

### 2.1 サービスアカウントの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「IAMと管理」→「サービスアカウント」を開く
4. 「サービスアカウントを作成」をクリック
5. サービスアカウント名を入力（例: `feedback-service`）
6. 「作成して続行」をクリック
7. ロールは「編集者」を選択（または最小権限で「Google Sheets API」の権限）
8. 「完了」をクリック

### 2.2 キーの作成

1. 作成したサービスアカウントをクリック
2. 「キー」タブを開く
3. 「キーを追加」→「新しいキーを作成」を選択
4. キーのタイプは「JSON」を選択
5. 「作成」をクリック（JSONファイルがダウンロードされます）

### 2.3 APIの有効化

1. 「APIとサービス」→「ライブラリ」を開く
2. 「Google Sheets API」を検索
3. 「有効にする」をクリック

---

## 3. 環境変数の設定

### 3.1 ローカル開発環境

1. `.env.local.example` をコピーして `.env.local` を作成
2. 以下の環境変数を設定：

```env
# フィードバック機能を有効化
NEXT_PUBLIC_ENABLE_FEEDBACK=true

# Google Sheets スプレッドシートID
NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID=your-spreadsheet-id-here

# シート名（デフォルト: "フィードバック"）
GOOGLE_SHEETS_FEEDBACK_SHEET_NAME=フィードバック

# サービスアカウントキー（JSON形式の文字列）
# 注意: JSONファイルの内容をそのまま文字列として設定
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
```

### 3.2 Vercel（本番環境）

**⚠️ 重要: 本番環境では `NEXT_PUBLIC_ENABLE_FEEDBACK` を `false` に設定するか、未設定にしてください。**

1. Vercelのプロジェクト設定を開く
2. 「Settings」→「Environment Variables」を開く
3. 以下の環境変数を追加：

```
NEXT_PUBLIC_ENABLE_FEEDBACK=false  # 本番環境では false
NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID=your-spreadsheet-id
GOOGLE_SHEETS_FEEDBACK_SHEET_NAME=フィードバック
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

---

## 4. 動作確認

### 4.1 ローカル環境での確認

1. 開発サーバーを起動：
```bash
npm run dev
```

2. ブラウザでアプリを開く
3. 画面右下にフィードバックボタンが表示されることを確認
4. ボタンをクリックしてフィードバックを送信
5. Google Sheetsにデータが追加されることを確認

### 4.2 エラーが発生した場合

- **「フィードバック機能は無効です」**: `NEXT_PUBLIC_ENABLE_FEEDBACK` が `true` になっているか確認
- **「Google Sheets設定が不足しています」**: スプレッドシートIDが正しく設定されているか確認
- **「権限がありません」**: サービスアカウントにスプレッドシートへの編集権限が付与されているか確認
- **「APIが有効になっていません」**: Google Sheets APIが有効になっているか確認

---

## 5. 本番環境へのデプロイ時の注意

1. **必ず `NEXT_PUBLIC_ENABLE_FEEDBACK=false` に設定**
2. 環境変数が正しく設定されているか確認
3. デプロイ後にフィードバックボタンが表示されないことを確認

---

## 6. トラブルシューティング

### 6.1 サービスアカウントキーの形式

JSONファイルの内容をそのまま文字列として設定する必要があります。エスケープが必要な場合：

```bash
# JSONファイルの内容をエスケープして設定
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
```

### 6.2 スプレッドシートIDの確認

スプレッドシートのURLからIDを確認：
- URL形式: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
- `{SPREADSHEET_ID}` の部分がIDです

### 6.3 シート名の確認

スプレッドシート内のシート名（タブ名）を確認し、環境変数 `GOOGLE_SHEETS_FEEDBACK_SHEET_NAME` と一致させてください。

---

## 7. セキュリティに関する注意

- サービスアカウントキーは機密情報です。Gitにコミットしないでください
- `.env.local` は `.gitignore` に含まれていることを確認
- Vercelの環境変数は暗号化されて保存されます
- 本番環境では最小権限の原則に従い、必要最小限の権限のみを付与してください








