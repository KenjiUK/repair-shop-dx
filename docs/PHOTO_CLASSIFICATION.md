# 写真機能の分類と整理

## 概要

写真機能を整理し、社内用とブログ用を明確に分離しました。

## 写真の分類

### 1. 社内用写真（Internal Photos）

**用途**: 診断・作業記録として使用する写真

**種類**:
- `diagnosis`: 診断写真（証拠写真、不具合箇所など）
- `before`: 作業前写真
- `after`: 作業後写真
- `general`: その他の作業写真

**保存先**:
- Google Drive: `/{JobID}/wo-{workOrderId}/photos/`
- データ構造: ワークオーダーの`diagnosis.photos`または`work.records[].photos`に保存

**表示場所**:
- JOBカード（優先順位: 診断 > before > after > general）
- 診断画面
- 見積画面
- 作業画面
- レポート画面
- プレゼンテーション画面

### 2. ブログ用写真（Blog Photos）

**用途**: SNS/ブログ素材として使用する写真

**種類**: 位置（position）で分類
- `front`: 前面
- `rear`: 後面
- `left`: 左側面
- `right`: 右側面
- `engine`: エンジンルーム
- `interior`: 内装
- `damage`: 傷・凹み
- `other`: その他

**保存先**:
- 一時保存: `/{JobID}/blog-photos-temporary/`
- 公開時: `blog-photos/`配下の複数フォルダにコピー
  - `by-date/YYYYMM/YYYYMMDD/`（日付別）
  - `by-service/{作業種類}/`（作業種類別）
  - `by-vehicle-type/{メーカー}/`（車種別）
  - `before-after/{種類}/`（Before/After別）

**特徴**:
- 元の写真をコピーして保存（元の写真は作業記録として残る）
- JOBカードには表示しない
- 写真の総数にも含めない

**表示場所**:
- ブログ用写真選択画面
- レポート画面（ブログ用写真として選択可能）

## JOBカードの写真表示ロジック

### 優先順位

1. **診断写真（diagnosis）**: 診断時の証拠写真を最優先
2. **作業前写真（before）**: 作業前の状態を優先
3. **作業後写真（after）**: 作業後の状態
4. **その他の作業写真（general）**: その他の作業写真

### 注意事項

- **ブログ用写真は表示しない**: JOBカードには社内用写真のみを表示
- **写真の総数**: 診断写真と作業写真の合計のみをカウント（ブログ用写真は含めない）

## 実装ファイル

### 型定義

- `src/types/photo-types.ts`: 写真の種類と分類の型定義

### コンポーネント

- `src/components/features/job-card.tsx`: JOBカードの写真表示ロジック
- `src/components/features/blog-photo-capture-dialog.tsx`: ブログ用写真撮影ダイアログ
- `src/components/features/blog-photo-selector.tsx`: ブログ用写真選択コンポーネント

### ライブラリ

- `src/lib/blog-photo-manager.ts`: ブログ用写真の管理機能
- `src/lib/photo-position.ts`: 写真位置のマッピング定義

## 今後の改善予定

1. **保存先の統一**: Google Driveのフォルダ構造を仕様書通りに実装
2. **表示ロジックの改善**: ブログ用写真を表示するかどうかの設定を追加（オプション）








