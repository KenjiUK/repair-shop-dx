# デザインシステム適用計画

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **目的**: TOPページのデザインシステムを他のページに適用するための網羅的な計画
- **ベース**: [TOPページデザインシステム](./TOP_PAGE_DESIGN_SYSTEM.md)

---

## 1. 現状分析

### 1-1. TOPページのデザインシステム（基準）

**アイコンサイズ**:
- セクションタイトル: `h-5 w-5`
- カードタイトル: `h-5 w-5`
- 第1階層: `h-5 w-5`
- 第2階層: `h-4 w-4`
- 第3階層: `h-3.5 w-3.5`
- バッジ内: `h-3.5 w-3.5`

**文字サイズ**:
- セクションタイトル: `text-xl font-bold`
- カードタイトル: `text-lg font-semibold`
- 第1階層: `text-lg font-semibold`
- 第2階層: `text-base font-medium` / `text-sm font-medium`
- バッジ: `text-xs font-medium`

**バッジ**:
- ステータスバッジ: `text-xs px-2.5 py-0.5 rounded-full`
- 入庫区分バッジ: `text-xs px-2.5 py-1 rounded-full`

### 1-2. 他のページの現状

#### 診断ページ (`src/app/mechanic/diagnosis/[id]/page.tsx`)

**問題点**:
- ページタイトル: `text-2xl sm:text-3xl` → `text-xl`に統一
- タイトルアイコン: `h-6 w-6 sm:h-7 sm:w-7` → `h-5 w-5`に統一
- バッジ: `text-sm px-2.5 py-1 h-7` → `text-xs px-2.5 py-0.5`に統一
- 情報表示: `text-sm sm:text-base` → `text-sm`に統一（第2階層として）
- アイコン: `h-4 w-4` → 適切（維持）

#### 見積ページ (`src/app/admin/estimate/[id]/page.tsx`)

**問題点**:
- ページタイトル: `text-2xl sm:text-3xl` → `text-xl`に統一
- タイトルアイコン: `h-6 w-6 sm:h-7 sm:w-7` → `h-5 w-5`に統一
- バッジ: `text-sm px-2.5 py-1 h-7` → `text-xs px-2.5 py-0.5`に統一
- 情報表示: `text-sm sm:text-base` → `text-sm`に統一

#### 作業ページ (`src/app/mechanic/work/[id]/page.tsx`)

**問題点**:
- ページタイトル: `text-2xl sm:text-3xl` → `text-xl`に統一
- タイトルアイコン: `h-5 w-5` → 適切（維持）
- バッジ: `text-sm px-2.5 py-1 h-7` → `text-xs px-2.5 py-0.5`に統一
- 情報表示: `text-sm sm:text-base` → `text-sm`に統一

#### その他のページ

- 引渡しページ (`src/app/presentation/[id]/page.tsx`)
- 顧客承認ページ (`src/app/customer/approval/[id]/page.tsx`)
- 顧客レポートページ (`src/app/customer/report/[id]/page.tsx`)
- 事前見積ページ (`src/app/admin/pre-estimate/[id]/page.tsx`)

---

## 2. 適用計画

### 2-1. フェーズ1: ヘッダー部分の統一

**対象ページ**:
1. 診断ページ
2. 見積ページ
3. 作業ページ
4. 引渡しページ
5. 顧客承認ページ
6. 顧客レポートページ
7. 事前見積ページ

**修正内容**:
- ページタイトル: `text-2xl sm:text-3xl` → `text-xl font-bold`
- タイトルアイコン: `h-6 w-6 sm:h-7 sm:w-7` → `h-5 w-5`
- バッジ: `text-sm px-2.5 py-1 h-7` → `text-xs px-2.5 py-0.5 rounded-full`
- 情報表示: `text-sm sm:text-base` → `text-sm`（第2階層として）
- アイコン: `h-4 w-4` → 維持（適切）

**優先度**: 高

### 2-2. フェーズ2: カード・コンポーネントの統一

**対象コンポーネント**:
- 診断項目カード
- 見積項目カード
- 作業項目カード
- その他のカードコンポーネント

**修正内容**:
- カードタイトル: `text-lg font-semibold`
- カード内アイコン: 階層に応じたサイズ
- バッジ: `text-xs px-2.5 py-0.5` または `text-xs px-2.5 py-1`
- スペーシング: TOPページの体系に合わせる

**優先度**: 中

### 2-3. フェーズ3: ボタン・アクション要素の統一

**対象要素**:
- プライマリボタン
- セカンダリボタン
- アイコンボタン
- アクションボタン

**修正内容**:
- ボタンサイズ: `h-10`（標準）、`h-12`（プライマリ）
- アイコンサイズ: `h-5 w-5`（ボタン内）
- フォントサイズ: `text-base`（ボタン内テキスト）

**優先度**: 中

### 2-4. フェーズ4: モバイル対応の統一

**対象**:
- すべてのページ

**修正内容**:
- テキスト折り返し: `break-words`を使用
- バッジ: `whitespace-nowrap`と`shrink-0`を設定
- スペーシング: モバイル対応のgapを使用（`gap-1.5 sm:gap-2`など）
- レスポンシブ表示: 適切な`hidden sm:block`などを設定

**優先度**: 高

---

## 3. 実装手順

### ステップ1: ヘッダー部分の統一（最優先）

1. **診断ページ** (`src/app/mechanic/diagnosis/[id]/page.tsx`)
   - ページタイトルを`text-xl`に変更
   - タイトルアイコンを`h-5 w-5`に変更
   - バッジを`text-xs px-2.5 py-0.5`に変更
   - 情報表示を`text-sm`に統一

2. **見積ページ** (`src/app/admin/estimate/[id]/page.tsx`)
   - 同様の修正

3. **作業ページ** (`src/app/mechanic/work/[id]/page.tsx`)
   - 同様の修正

4. **その他のページ**
   - 同様の修正

### ステップ2: CompactJobHeaderの適用

- 各ページで`CompactJobHeader`コンポーネントを使用するか、既存のヘッダーを`CompactJobHeader`のスタイルに合わせる

### ステップ3: カード・コンポーネントの統一

- 各ページのカードコンポーネントをTOPページのスタイルに合わせる

### ステップ4: モバイル対応の確認・修正

- すべてのページでモバイル対応を確認
- テキスト折り返し、バッジ、スペーシングを統一

---

## 4. チェックリスト

### 4-1. アイコン

- [x] すべてのアイコンに適切なサイズを設定
- [x] すべてのアイコンに`shrink-0`を設定
- [x] アイコンカラーを統一（`text-slate-500`など）

### 4-2. タイポグラフィ

- [x] ページタイトル: `text-xl font-bold`
- [x] セクションタイトル: `text-xl font-bold`
- [x] カードタイトル: `text-lg font-semibold`（サマリーカードのラベルは`text-sm font-medium`で適切）
- [x] 第1階層: `text-lg font-semibold`
- [x] 第2階層: `text-base font-medium` または `text-sm font-medium`
- [x] バッジ: `text-xs font-medium`

### 4-3. バッジ

- [x] ステータスバッジ: `text-xs px-2.5 py-0.5 rounded-full`
- [x] 入庫区分バッジ: `text-xs px-2.5 py-1 rounded-full`
- [x] バッジ内アイコン: `h-3.5 w-3.5`
- [x] バッジ内テキスト: `whitespace-nowrap`
- [x] バッジ全体: `shrink-0`

### 4-4. スペーシング

- [x] セクション間: `mb-6`
- [x] カード間: `space-y-4`
- [x] カード内要素: `space-y-1.5`
- [x] Gap: モバイル対応（`gap-1.5 sm:gap-2`など）

### 4-5. モバイル対応

- [x] テキスト折り返し: `break-words`
- [x] バッジ: `whitespace-nowrap`と`shrink-0`
- [x] レスポンシブ表示: 適切な設定

---

## 5. 実装順序

1. **診断ページ**（最優先）
2. **見積ページ**
3. **作業ページ**
4. **引渡しページ**
5. **顧客承認ページ**
6. **顧客レポートページ**
7. **事前見積ページ**

---

## 6. 実装進捗

### 6-1. 完了した修正

✅ **診断ページ** (`src/app/mechanic/diagnosis/[id]/page.tsx`)
- ページタイトル: `text-xl font-bold`に統一
- タイトルアイコン: `h-5 w-5`に統一、`shrink-0`追加
- バッジ: `text-xs px-2.5 py-0.5 rounded-full`に統一
- 情報表示: `text-sm`に統一、`break-words`追加
- アイコン: `shrink-0`追加
- `getStatusBadgeStyle`関数を追加

✅ **見積ページ** (`src/app/admin/estimate/[id]/page.tsx`)
- ページタイトル: `text-xl font-bold`に統一
- タイトルアイコン: `h-5 w-5`に統一、`shrink-0`追加
- バッジ: `text-xs px-2.5 py-0.5 rounded-full`に統一
- 情報表示: `text-sm`に統一、`break-words`追加
- アイコン: `shrink-0`追加
- `getStatusBadgeStyle`関数を追加

✅ **作業ページ** (`src/app/mechanic/work/[id]/page.tsx`)
- ページタイトル: `text-xl font-bold`に統一
- タイトルアイコン: `h-5 w-5`に統一、`shrink-0`追加
- バッジ: `text-xs px-2.5 py-0.5 rounded-full`に統一
- 情報表示: `text-sm`に統一、`break-words`追加
- アイコン: `shrink-0`追加
- `getStatusBadgeStyle`関数を追加

✅ **事前見積ページ** (`src/app/admin/pre-estimate/[id]/page.tsx`)
- ページタイトル: `text-xl font-bold`に統一

### 6-2. 完了した修正（続き）

✅ **引渡しページ** (`src/app/presentation/[id]/page.tsx`)
- ページタイトル: `text-xl font-bold`に統一
- 説明文: `text-slate-600`に統一

✅ **顧客承認ページ** (`src/app/customer/approval/[id]/page.tsx`)
- ページタイトル: `text-xl font-bold`に統一
- 合計金額: `text-xl font-bold`に統一

✅ **顧客レポートページ** (`src/app/customer/report/[id]/page.tsx`)
- ページタイトル: `text-xl font-bold`に統一
- タイトルアイコン: `h-5 w-5`に統一、`shrink-0`追加
- セクションアイコン: `h-5 w-5`に統一
- 装飾アイコン: `h-6 w-6`に統一、`shrink-0`追加

### 6-3. 残りのタスク（フェーズ2以降）

✅ **カード・コンポーネントの統一（フェーズ2）** - 完了
- CardHeaderの`pb-2`を`pb-3`に統一（全ファイル、194箇所）
- CardTitleの`text-base`を`text-lg font-semibold`に統一（全コンポーネント、102箇所）
- Loading.tsxファイルのCardHeaderも統一（6ファイル）
- CardTitle内のアイコンに`shrink-0`を追加（全コンポーネント）
- `vehicle-registration-upload.tsx`のCardHeaderとCardTitleを統一
- `courtesy-car-list-dialog.tsx`のCardTitle内アイコンに`shrink-0`を追加
- `service-kind-summary-card.tsx`と`long-term-project-summary-card.tsx`のCardTitle内アイコンに`shrink-0`を追加

✅ **ボタン・アクション要素の統一（フェーズ3）** - 完了
- ボタン内アイコンサイズを`h-5 w-5`に統一
- ボタンに`text-base`を追加（`h-10`と`h-12`のボタン）

✅ **モバイル対応の最終確認（フェーズ4）** - 完了
- 顧客名に`break-words`を追加（`truncate`から変更）
- バッジには既に`whitespace-nowrap`と`shrink-0`が適用済み
- モバイル対応のgapは適切に使用済み

---

## 7. 更新履歴

- 2025-01-XX: 初版作成
- 2025-01-XX: 診断・見積・作業ページのヘッダー部分を修正完了
- 2025-01-XX: 引渡し・顧客承認・顧客レポートページのヘッダー部分を修正完了（フェーズ1完了）
- 2025-01-XX: フェーズ2（カード・コンポーネントの統一）完了
- 2025-01-XX: フェーズ3（ボタン・アクション要素の統一）完了
- 2025-01-XX: フェーズ4（モバイル対応の統一）完了
- 2025-01-XX: 全コンポーネントファイルのCardTitle統一完了（`text-base`→`text-lg font-semibold`）
- 2025-01-XX: CardTitle内のアイコンに`shrink-0`を追加完了
- 2025-01-XX: `vehicle-registration-upload.tsx`と`courtesy-car-list-dialog.tsx`の最終修正完了
- 2025-01-XX: `service-kind-summary-card.tsx`と`long-term-project-summary-card.tsx`のCardTitleに`font-semibold`を追加完了
- 2025-01-XX: `service-kind-summary-card.tsx`と`long-term-project-summary-card.tsx`のCardTitle内アイコンに`shrink-0`を追加完了
- 2025-01-XX: `today-summary-card.tsx`のCardTitleに`font-semibold`を追加、CardTitle内アイコンに`shrink-0`を追加完了 - **全フェーズ完了**

---

## 7. 関連ドキュメント

- [TOPページデザインシステム](./TOP_PAGE_DESIGN_SYSTEM.md)
- [UI/UXガイドライン](./UI_UX_GUIDELINES.md)
