# フィードバック機能 - Google Sheets書き込み設定ガイド

**テスト版ローンチ用 - 確実に動作させるための手順**

---

## 🎯 目標

現場で使ってもらってフィードバックを集めるため、Google Sheetsに確実に書き込まれるように設定します。

---

## 方法1: サービスアカウントキーを使う方法（推奨）

### ステップ1: Google Cloud Consoleでサービスアカウントを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「IAMと管理」→「サービスアカウント」を開く
4. 「サービスアカウントを作成」をクリック
5. サービスアカウント名を入力（例: `feedback-service`）
6. 「作成して続行」をクリック
7. ロールは「編集者」を選択
8. 「完了」をクリック

### ステップ2: サービスアカウントキーを取得

1. 作成したサービスアカウントをクリック
2. 「キー」タブを開く
3. 「キーを追加」→「新しいキーを作成」を選択
4. キーのタイプは「JSON」を選択
5. 「作成」をクリック（JSONファイルがダウンロードされます）

**重要:** このJSONファイルは安全に保管してください。Gitにコミットしないでください。

### ステップ3: Google Sheets APIを有効化

1. 「APIとサービス」→「ライブラリ」を開く
2. 「Google Sheets API」を検索
3. 「有効にする」をクリック

### ステップ4: スプレッドシートにサービスアカウントを共有

1. フィードバック用のGoogle Sheetsを開く
2. 「共有」ボタンをクリック
3. サービスアカウントのメールアドレスを追加
   - JSONファイルの `client_email` フィールドに記載されています
   - 例: `feedback-service@your-project.iam.gserviceaccount.com`
4. 権限は「編集者」を選択
5. 「送信」をクリック

### ステップ5: Vercelの環境変数を設定

1. Vercelダッシュボード → プロジェクト → 「Settings」→「Environment Variables」
2. 以下の環境変数を追加：

```
NEXT_PUBLIC_ENABLE_FEEDBACK=true
NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID=your-spreadsheet-id-here
GOOGLE_SHEETS_FEEDBACK_SHEET_NAME=フィードバック
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

**GOOGLE_SERVICE_ACCOUNT_KEY の設定方法:**

JSONファイルの内容をそのまま1行の文字列として設定します。

**方法A: エスケープして設定**
```json
{"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}
```

**方法B: Vercel CLIで設定（推奨）**
```bash
# JSONファイルのパスを指定
vercel env add GOOGLE_SERVICE_ACCOUNT_KEY production < service-account-key.json
```

### ステップ6: スプレッドシートの準備

1. Google Sheetsで新しいスプレッドシートを作成
2. シート名を「フィードバック」に変更
3. 1行目に以下の列ヘッダーを設定：

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 日時 | カテゴリ | 画面パス | 画面名 | ジョブID | 顧客名 | 車両情報 | フィードバック内容 | 緊急度 | ユーザー名 | ブラウザ | 画面サイズ | スクリーンショットURL |

4. スプレッドシートIDをコピー（URLから取得）
   - 例: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`

### ステップ7: デプロイとテスト

1. Vercelにデプロイ
2. アプリを開いてフィードバックボタンを確認
3. テストフィードバックを送信
4. Google Sheetsにデータが追加されているか確認

---

## 方法2: Google Apps Script (GAS) を使う方法（簡単）

サービスアカウントキーの設定が面倒な場合、GASを使う方法もあります。

### ステップ1: Google Sheetsにスクリプトを追加

1. フィードバック用のGoogle Sheetsを開く
2. 「拡張機能」→「Apps Script」をクリック
3. 以下のコードを貼り付け：

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('フィードバック');
    
    // ヘッダーがない場合は作成
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '日時', 'カテゴリ', '画面パス', '画面名', 'ジョブID', 
        '顧客名', '車両情報', 'フィードバック内容', '緊急度', 
        'ユーザー名', 'ブラウザ', '画面サイズ', 'スクリーンショットURL'
      ]);
    }
    
    const data = JSON.parse(e.postData.contents);
    
    // 現在の日時
    const now = new Date();
    const dateTimeStr = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
    
    // カテゴリの表示名
    const categoryLabels = {
      bug: '🐛 バグ報告',
      uiux: '💡 UI/UX改善提案',
      feature: '✨ 機能要望',
      question: '❓ 質問・不明点',
      positive: '👍 良い点',
      other: 'その他'
    };
    
    const urgencyLabels = {
      low: '低',
      medium: '中',
      high: '高'
    };
    
    // データ行を追加
    sheet.appendRow([
      dateTimeStr,
      categoryLabels[data.category] || data.category,
      data.pathname || '',
      data.pageName || '',
      data.jobId || '',
      data.customerName || '',
      data.vehicleInfo || '',
      data.content || '',
      urgencyLabels[data.urgency] || data.urgency || '中',
      data.userName || '未設定',
      data.userAgent || '',
      data.screenSize || '',
      data.screenshotUrl || ''
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'フィードバックを送信しました'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: {
        message: error.toString()
      }
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. 「保存」をクリック
5. 「デプロイ」→「新しいデプロイ」をクリック
6. 種類で「ウェブアプリ」を選択
7. 設定：
   - 説明: 「フィードバック受信API」
   - 次のユーザーとして実行: 「自分」
   - アクセスできるユーザー: 「全員」
8. 「デプロイ」をクリック
9. **WebアプリのURLをコピー**（重要！）

### ステップ2: APIルートを修正

GASのURLを使うようにAPIルートを修正する必要があります。環境変数で切り替えられるようにします。

### ステップ3: 環境変数を設定

```
NEXT_PUBLIC_ENABLE_FEEDBACK=true
NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID=your-spreadsheet-id-here
GOOGLE_SHEETS_FEEDBACK_SHEET_NAME=フィードバック
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
```

---

## 推奨: 方法1（サービスアカウントキー）

**理由:**
- より安全（認証が確実）
- パフォーマンスが良い
- エラーハンドリングが詳細

**方法2（GAS）のメリット:**
- 設定が簡単
- サービスアカウントキーが不要
- スプレッドシートに直接スクリプトを埋め込める

---

## トラブルシューティング

### エラー: "権限がありません"

- サービスアカウントにスプレッドシートへの編集権限が付与されているか確認
- サービスアカウントのメールアドレスが正しいか確認

### エラー: "スプレッドシートが見つかりません"

- スプレッドシートIDが正しいか確認
- シート名が正しいか確認（デフォルト: "フィードバック"）

### エラー: "認証の設定に問題があります"

- サービスアカウントキーのJSON形式が正しいか確認
- 環境変数に正しく設定されているか確認

### データが書き込まれない

1. Vercelのログを確認（Functions Logs）
2. エラーメッセージを確認
3. スプレッドシートの共有設定を確認

---

## 次のステップ

1. 上記の手順に従って設定
2. テストフィードバックを送信
3. Google Sheetsにデータが追加されているか確認
4. 問題なければ、現場で使ってもらう








