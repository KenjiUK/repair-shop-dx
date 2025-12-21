# 整備工場DXプラットフォーム (Repair Shop DX Platform)

**YM Works Edition**

自動車整備工場向けの業務管理Webアプリケーション。顧客と現場スタッフ（フロント・整備士）が利用する、受付から診断・見積・作業・報告までの一連のワークフローをサポートします。

## 技術スタック

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS 4
- **UI Library:** shadcn/ui (Radix UI)
- **State Management:** SWR (data fetching)
- **External Systems:**
  - Zoho CRM (Transaction Hub)
  - Google Sheets (Master Data Cache)
  - Google Drive (File Storage)

## 主要機能

### スタッフ向け画面

- **受付画面** (`/`): 本日の入庫予定案件一覧、チェックイン処理、スマートタグ紐付け
- **診断画面** (`/mechanic/diagnosis/[id]`): 症状メモ、分解整備記録簿入力、作業項目提案、写真・動画撮影
- **見積作成画面** (`/admin/estimate/[id]`): 診断結果を基にした見積作成・編集
- **作業画面** (`/mechanic/work/[id]`): 作業実施、After写真撮影、完了報告

### 顧客向け画面

- **プレゼン画面** (`/presentation/[id]`): 診断結果・見積内容の提示
- **承認画面** (`/customer/approval/[id]`): 見積承認・却下
- **レポート画面** (`/customer/report/[id]`): 作業完了報告書の確認

## セットアップ

### 前提条件

- Node.js 20以上
- npm / yarn / pnpm / bun

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### ビルド

```bash
# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

### リント

```bash
npm run lint
```

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router ページ
│   ├── page.tsx           # TOP (受付画面)
│   ├── mechanic/          # 整備士向け画面
│   ├── admin/             # 事務所向け画面
│   └── customer/          # 顧客向け画面
├── components/
│   ├── features/          # 機能コンポーネント
│   └── ui/                # UI基本コンポーネント (shadcn/ui)
├── lib/
│   ├── api.ts             # APIクライアント (Zoho CRM連携)
│   ├── compress.ts        # 画像圧縮ユーティリティ
│   └── utils.ts           # 汎用ユーティリティ
└── types/
    └── index.ts           # TypeScript型定義
```

## 開発ガイドライン

詳細な仕様は [`SPECIFICATION.md`](./SPECIFICATION.md) を参照してください。

### 重要な制約

- **画像圧縮:** アップロード画像はクライアントサイドで500KB以下に圧縮必須
- **Zoho API:** 見積内容は `field13` (複数行テキスト) に保存。`field14`は使用禁止
- **音声入力:** Web Speech APIを使用（ブラウザネイティブ）
- **タイムゾーン:** システムはすべて日本時間（JST: Asia/Tokyo）で動作します

## ライセンス

Private
