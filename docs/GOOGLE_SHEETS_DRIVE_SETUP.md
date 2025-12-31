# Google Sheets / Google Drive セットアップガイド

本番環境と同じようにGoogle SheetsとGoogle Driveを使用するためのセットアップガイドです。

## 必要な環境変数

### 1. Google Service Account JSON（推奨、本番環境）

Service Account認証を使用する場合、以下の環境変数を設定してください：

```env
# Google Service Account JSON（JSON文字列として設定）
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id",...}'
```

**設定方法：**

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「認証情報」を開く
4. 「認証情報を作成」→「サービスアカウント」を選択
5. サービスアカウントを作成
6. 「キー」タブで「キーを追加」→「JSON」を選択してダウンロード
7. ダウンロードしたJSONファイルの内容を、改行を削除して1行のJSON文字列として環境変数に設定

**注意：**
- JSONファイルの内容全体を1行の文字列として設定してください
- 改行文字（`\n`）はそのまま保持してください（エスケープ不要）
- Vercelの場合は、環境変数の値として直接貼り付け可能です

### 2. Google Sheets スプレッドシートID

```env
# マスタデータスプレッドシートID
GOOGLE_SHEETS_MASTER_DATA_ID=your-spreadsheet-id-here
```

**スプレッドシートIDの取得方法：**
- Google SheetsのURLから取得：`https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
- 例：`https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
  → スプレッドシートIDは `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

**スプレッドシートの構成：**
- シート名「車両マスタ」：車両マスタデータ
- シート名「顧客マスタ」：顧客マスタデータ

**必須カラム（車両マスタ）：**
- 車両ID
- 顧客ID
- 登録番号連結
- 車名
- 型式
- 車検有効期限（オプション）
- 次回点検日（オプション）

**必須カラム（顧客マスタ）：**
- 顧客ID
- 顧客名
- 住所連結（オプション）
- 電話番号（オプション）
- 携帯番号（オプション）

### 3. フォールバック：アクセストークン（開発用のみ）

Service Account認証が使用できない場合のフォールバックとして、アクセストークンを直接設定することもできます（開発環境のみ推奨）：

```env
# アクセストークン（開発用、フォールバック）
GOOGLE_DRIVE_ACCESS_TOKEN=your-access-token-here
```

**注意：**
- アクセストークンは有効期限があるため、定期的に更新する必要があります
- 本番環境ではService Account認証を使用することを強く推奨します

## ローカル開発環境の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# Google Service Account JSON（推奨）
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# Google Sheets スプレッドシートID
GOOGLE_SHEETS_MASTER_DATA_ID=your-spreadsheet-id-here
```

## Vercel環境変数の設定

1. [Vercel ダッシュボード](https://vercel.com/dashboard)にログイン
2. プロジェクトを選択
3. Settings → Environment Variables を開く
4. 以下の環境変数を追加：
   - `GOOGLE_SERVICE_ACCOUNT_JSON`（Production, Preview, Developmentすべてに設定）
   - `GOOGLE_SHEETS_MASTER_DATA_ID`（Production, Preview, Developmentすべてに設定）

**重要：**
- 環境変数の変更後は、再デプロイが必要です
- `GOOGLE_SERVICE_ACCOUNT_JSON`は機密情報のため、適切に管理してください

## Service Accountの権限設定

Service Accountに以下の権限を付与してください：

1. **Google Sheets API**
   - スプレッドシートへの読み取り権限（読み取り専用）
   - スプレッドシートを共有：Service Accountのメールアドレスに「閲覧者」権限を付与

2. **Google Drive API**
   - 必要なフォルダへの読み書き権限
   - フォルダを共有：Service Accountのメールアドレスに「編集者」権限を付与

**Service Accountのメールアドレスの確認方法：**
- ダウンロードしたJSONファイルの`client_email`フィールドを確認

## 動作確認

環境変数を設定後、以下のコマンドで動作確認してください：

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで以下にアクセスして確認
# http://localhost:3000
```

**確認ポイント：**
- 車両マスタデータが正しく表示されるか
- 顧客マスタデータが正しく表示されるか
- Google Driveへのファイルアップロードが正常に動作するか

## トラブルシューティング

### エラー：`GOOGLE_SHEETS_MASTER_DATA_ID が設定されていません`

**原因：** 環境変数が設定されていない

**解決方法：**
- `.env.local`ファイルに`GOOGLE_SHEETS_MASTER_DATA_ID`を設定
- Vercelの場合は、環境変数を設定して再デプロイ

### エラー：`GOOGLE_SERVICE_ACCOUNT_JSON が設定されていません`

**原因：** Service Account JSONが設定されていない

**解決方法：**
- `.env.local`ファイルに`GOOGLE_SERVICE_ACCOUNT_JSON`を設定
- JSONファイルの内容を1行の文字列として設定

### エラー：`Google Sheets API エラー: 403 Forbidden`

**原因：** Service Accountにスプレッドシートへのアクセス権限がない

**解決方法：**
- Google Sheetsのスプレッドシートを開く
- 「共有」ボタンをクリック
- Service Accountのメールアドレス（JSONファイルの`client_email`）を追加
- 「閲覧者」権限を付与

### エラー：`Google Drive API エラー: 403 Forbidden`

**原因：** Service AccountにGoogle Driveフォルダへのアクセス権限がない

**解決方法：**
- Google Driveでフォルダを開く
- 「共有」ボタンをクリック
- Service Accountのメールアドレスを追加
- 「編集者」権限を付与

## 参考リンク

- [Google Sheets API ドキュメント](https://developers.google.com/sheets/api)
- [Google Drive API ドキュメント](https://developers.google.com/drive/api)
- [Service Account認証](https://cloud.google.com/docs/authentication/production)









