# フィードバック機能 実装計画

**作成日:** 2025-01-XX  
**ステータス:** 計画中

---

## 実装手順

### Step 1: 環境変数と設定ファイルの準備

1. `.env.local` に以下を追加：
```env
NEXT_PUBLIC_ENABLE_FEEDBACK=true
NEXT_PUBLIC_GOOGLE_SHEETS_FEEDBACK_ID=<スプレッドシートID>
GOOGLE_SHEETS_FEEDBACK_SHEET_NAME=フィードバック
```

2. Google Sheetsの準備：
   - 新しいスプレッドシートを作成
   - シート名を「フィードバック」に設定
   - 列ヘッダーを設定（仕様書参照）

### Step 2: ユーティリティ関数の実装

1. `src/lib/feedback-utils.ts` を作成
   - 画面名の自動判定関数
   - 画面情報の取得関数
   - フィードバックデータの整形関数

2. `src/lib/google-sheets-feedback.ts` を作成
   - Google Sheetsへの書き込み関数
   - APIルート経由で呼び出す

### Step 3: APIルートの実装

1. `src/app/api/feedback/route.ts` を作成
   - POSTリクエストを受け取る
   - Google Sheetsに書き込む
   - エラーハンドリング

### Step 4: UIコンポーネントの実装

1. `src/components/feedback/feedback-button.tsx`
   - フローティングボタン
   - 環境変数チェック

2. `src/components/feedback/feedback-dialog.tsx`
   - モーダルダイアログ
   - フォームの統合

3. `src/components/feedback/feedback-form.tsx`
   - カテゴリ選択
   - フィードバック内容入力
   - バリデーション

### Step 5: アプリ全体への統合

1. `src/app/layout.tsx` に `FeedbackButton` を追加
   - 環境変数チェックで条件付きレンダリング

2. 各ページで画面名を自動取得できるように設定

### Step 6: テスト

1. テスト版環境で動作確認
2. Google Sheetsへの書き込み確認
3. 本番環境で非表示になることを確認

---

## 実装時の注意点

### 1. 環境変数の扱い
- `NEXT_PUBLIC_` プレフィックスはクライアント側でも使用可能
- 本番環境では必ず `false` または未設定にする

### 2. Google Sheets API
- 既存の `googleapis` パッケージを使用
- 書き込み権限が必要（読み取り専用ではない）
- APIキーやサービスアカウントの設定が必要

### 3. パフォーマンス
- フローティングボタンは軽量に
- スクリーンショット取得はオプション
- 送信処理は非同期で、UIをブロックしない

### 4. エラーハンドリング
- Google Sheetsへの書き込み失敗時はユーザーに通知
- リトライ機能を検討

---

## 依存関係

### 新規追加が必要なパッケージ
- `html2canvas`（スクリーンショット機能用、オプション）

### 既存パッケージ
- `googleapis`（既にインストール済み）

---

## 実装工数見積

- **Step 1-2:** 0.5日（環境設定、ユーティリティ）
- **Step 3:** 0.5日（APIルート）
- **Step 4:** 1.5日（UIコンポーネント）
- **Step 5:** 0.5日（統合）
- **Step 6:** 0.5日（テスト）

**合計:** 約3.5日

---

## 次のステップ

1. 仕様書のレビューと承認
2. Google Sheetsの準備
3. 実装開始








