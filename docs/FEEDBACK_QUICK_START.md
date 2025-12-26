# フィードバック機能 - クイックスタートガイド

**現場で使ってもらうための最短セットアップ手順**

---

## 🚀 最短5分で設定完了

### ステップ1: Google Sheetsを準備（2分）

1. [Google Sheets](https://sheets.google.com) で新しいスプレッドシートを作成
2. シート名を「フィードバック」に変更
3. 1行目に以下の列を設定：

```
日時 | カテゴリ | 画面パス | 画面名 | ジョブID | 顧客名 | 車両情報 | フィードバック内容 | 緊急度 | ユーザー名 | ブラウザ | 画面サイズ | スクリーンショットURL
```

4. スプレッドシートIDをコピー（URLから取得）
   - URL例: `https://docs.google.com/spreadsheets/d/1ABC123.../edit`
   - `1ABC123...` の部分がIDです

### ステップ2: Google Apps Scriptを設定（3分）

**この方法が最も簡単です！サービスアカウントキーは不要です。**

1. 同じスプレッドシートで「拡張機能」→「Apps Script」をクリック
2. 以下のコードを貼り付け：

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

3. 「保存」をクリック（💾アイコン）
4. 「デプロイ」→「新しいデプロイ」をクリック
5. 歯車アイコン（⚙️）をクリックして「ウェブアプリ」を選択
6. 設定：
   - 説明: 「フィードバック受信API」
   - 次のユーザーとして実行: 「自分」
   - アクセスできるユーザー: **「全員」**（重要！）
7. 「デプロイ」をクリック
8. **「WebアプリのURL」をコピー**（重要！）
   - 例: `https://script.google.com/macros/s/AKfycby.../exec`

### ステップ3: Vercelの環境変数を設定（1分）

Vercelダッシュボードで以下を設定：

```
NEXT_PUBLIC_ENABLE_FEEDBACK=true
NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID=1ABC123...（ステップ1で取得したID）
GOOGLE_SHEETS_FEEDBACK_SHEET_NAME=フィードバック
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec（ステップ2で取得したURL）
```

### ステップ4: デプロイとテスト

1. Vercelにデプロイ
2. アプリを開く
3. 画面右下のフィードバックボタン（💬）をクリック
4. テストフィードバックを送信
5. Google Sheetsにデータが追加されているか確認 ✅

---

## ✅ 動作確認チェックリスト

- [ ] フィードバックボタンが表示される
- [ ] フィードバックを送信できる
- [ ] Google Sheetsにデータが追加される
- [ ] エラーメッセージが表示されない

---

## 🆘 うまくいかない場合

### フィードバックボタンが表示されない

- `NEXT_PUBLIC_ENABLE_FEEDBACK=true` が設定されているか確認
- デプロイを再実行

### 送信に失敗する

- Vercelのログ（Functions Logs）を確認
- GASのURLが正しいか確認
- GASの「アクセスできるユーザー」が「全員」になっているか確認

### Google Sheetsに書き込まれない

- GASのスクリプトが正しく保存・デプロイされているか確認
- シート名が「フィードバック」になっているか確認
- GASの実行ログを確認（「実行」→「実行ログを表示」）

---

## 📝 次のステップ

1. 上記の手順で動作確認
2. 問題なければ、現場で使ってもらう
3. フィードバックを定期的に確認して対応

---

## 💡 補足: サービスアカウントキーを使う方法

GASの方法がうまくいかない場合、サービスアカウントキーを使う方法もあります。
詳細は [`FEEDBACK_GOOGLE_SHEETS_SETUP.md`](./FEEDBACK_GOOGLE_SHEETS_SETUP.md) を参照してください。








