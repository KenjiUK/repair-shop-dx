# 必要な環境変数一覧

## Google Sheets / Google Drive 関連（今回修正した部分）

### 必須

```env
# Service Account JSON（JSON文字列として設定）
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'

# マスタデータスプレッドシートID
GOOGLE_SHEETS_MASTER_DATA_ID=your-spreadsheet-id-here
```

### オプション

```env
# クライアント側でも使用（google-sheets.tsで使用）
NEXT_PUBLIC_GOOGLE_SHEETS_MASTER_DATA_ID=your-spreadsheet-id-here

# フォールバック用アクセストークン（GOOGLE_SERVICE_ACCOUNT_JSONがない場合のみ）
GOOGLE_DRIVE_ACCESS_TOKEN=your-access-token-here
```

## その他の環境変数（既存）

### 認証関連

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth
AUTH_SECRET=your-generated-secret-key
# または
NEXTAUTH_SECRET=your-generated-secret-key
NEXTAUTH_URL=https://repair-shop-dx.vercel.app
```

### Gmail送信関連

```env
GMAIL_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
GMAIL_USER_EMAIL=your-email@gmail.com
```

### LINE通知関連

```env
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
GOOGLE_SHEETS_LINE_HISTORY_ID=your-spreadsheet-id-here
```

### Gemini API関連

```env
GEMINI_API_KEY=your-gemini-api-key
```

### フィードバック機能関連

```env
NEXT_PUBLIC_ENABLE_FEEDBACK=true
NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID=your-spreadsheet-id-here
GOOGLE_SHEETS_FEEDBACK_SHEET_NAME=フィードバック
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/...
```

### スマートタグ関連

```env
GOOGLE_SHEETS_SMART_TAGS_ID=your-spreadsheet-id-here
```

### 旧API Key方式（まだ使用されている箇所あり）

```env
GOOGLE_SHEETS_API_KEY=your-api-key-here
```

## 確認方法

以下のコマンドで、現在設定されている環境変数を確認できます：

```bash
# ローカル環境
cat .env.local | grep GOOGLE

# Vercel環境
vercel env ls
```

## 注意点

1. **`GOOGLE_SERVICE_ACCOUNT_JSON` と `GOOGLE_SERVICE_ACCOUNT_KEY`**
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: 新しく追加した環境変数（Google Sheets/Drive用）
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: フィードバック機能用（旧名称）
   - 両方設定する必要がある場合があります

2. **`GOOGLE_SHEETS_MASTER_DATA_ID` と `NEXT_PUBLIC_GOOGLE_SHEETS_MASTER_DATA_ID`**
   - `GOOGLE_SHEETS_MASTER_DATA_ID`: サーバー側（API Routes）で使用
   - `NEXT_PUBLIC_GOOGLE_SHEETS_MASTER_DATA_ID`: クライアント側でも使用
   - 通常は同じ値を設定します

3. **`GOOGLE_SHEETS_API_KEY`**
   - 旧API Key方式で使用
   - Service Account認証を使用する場合は不要ですが、一部のコードでまだ使用されています








