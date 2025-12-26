# Gemini API 設定ガイド

## 概要

実況解説動画の音声認識機能で使用するGemini API（無料モデル）の設定方法です。

## 1. Gemini API キーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Create API Key」をクリック
4. APIキーをコピー

## 2. 環境変数の設定

プロジェクトのルートディレクトリに `.env.local` ファイルを作成（または既存のファイルに追加）：

```bash
GEMINI_API_KEY=your_api_key_here
```

**重要**: `.env.local` ファイルは `.gitignore` に含まれているため、Gitにコミットされません。

## 3. Vercel へのデプロイ時

Vercelにデプロイする場合は、Vercelのダッシュボードで環境変数を設定してください：

1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. `GEMINI_API_KEY` を追加
3. 値を入力して保存

## 4. 使用モデル

- **モデル名**: `gemini-1.5-flash`
- **料金**: 無料（制限あり）
- **用途**: 動画の音声をテキストに変換（文字起こし）

## 5. 機能

- 動画撮影時に自動で音声認識を実行
- メカニックの実況解説をテキスト化
- 顧客承認画面で実況解説テキストを表示

## 6. トラブルシューティング

### APIキーが設定されていない場合

```
エラー: GEMINI_API_KEYが設定されていません
```

→ `.env.local` ファイルに `GEMINI_API_KEY` を追加してください。

### 音声認識が失敗する場合

- 動画ファイルに音声が含まれているか確認
- 動画ファイルの形式がサポートされているか確認（WebM形式を推奨）
- ネットワーク接続を確認




