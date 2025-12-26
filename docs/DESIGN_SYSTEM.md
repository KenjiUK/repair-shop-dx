# デザインシステム - 統合版

**最終更新日**: 2025-01-XX  
**バージョン**: 2.0  
**対象**: 全画面・全コンポーネント  
**設計方針**: 40歳以上ユーザー向けに最適化、WCAG 2.1 AA準拠、カラーユニバーサルデザイン対応

---

## 目次

1. [カラーパレット](#1-カラーパレット)
2. [タイポグラフィ](#2-タイポグラフィ)
3. [スペーシング](#3-スペーシング)
4. [ボーダーとシャドウ](#4-ボーダーとシャドウ)
   - [4-4. Z-Index管理](#4-4-z-index管理)
5. [アイコン](#5-アイコン)
6. [ボタン](#6-ボタン)
7. [フォーム要素](#7-フォーム要素)
   - [7-5. 見積行のUI仕様](#7-5-見積行のui仕様)
8. [バッジ](#8-バッジ)
9. [カード](#9-カード)
10. [カラーシステム](#10-カラーシステム)
11. [レスポンシブデザイン](#11-レスポンシブデザイン)
12. [メッセージボックス（Alert/Toast/Dialog）](#12-メッセージボックスalerttoastdialog)
13. [アクセシビリティ](#13-アクセシビリティ)
14. [ヘッダー・ナビゲーション](#14-ヘッダーナビゲーション)
15. [アニメーション](#15-アニメーション)
16. [TOPページの詳細デザインシステム](#16-toppageの詳細デザインシステム)
17. [実装チェックリスト](#17-実装チェックリスト)
18. [禁止事項と置き換え方法](#18-禁止事項と置き換え方法)
19. [Sheet（サイドパネル）](#19-sheetサイドパネル)
20. [スケルトン（ローディング状態）](#20-スケルトンローディング状態)
21. [Dialog（ダイアログ）の詳細仕様](#21-dialogダイアログの詳細仕様)
22. [検索バー](#22-検索バー)
23. [エラー表示](#23-エラー表示)
24. [ローディング状態](#24-ローディング状態)
25. [トースト通知の詳細仕様](#25-トースト通知の詳細仕様)
26. [フォームバリデーション](#26-フォームバリデーション)
27. [業務フローとユーザーロール](#27-業務フローとユーザーロール)
28. [文言（ラベル・メッセージ）の統一ルール](#28-文言ラベルメッセージの統一ルール)
29. [音声入力](#29-音声入力)
30. [Avatar（アバター）](#30-avatarアバター)
31. [Progress（プログレスバー）](#31-progressプログレスバー)
32. [Tabs（タブ）](#32-tabsタブ)
33. [Separator（区切り線）](#33-separator区切り線)
34. [ScrollArea（スクロール領域）](#34-scrollareaスクロール領域)
35. [DropdownMenu（ドロップダウンメニュー）](#35-dropdownmenuドロップダウンメニュー)
36. [AlertDialog（確認ダイアログ）](#36-alertdialog確認ダイアログ)
37. [Collapsible（折りたたみ）](#37-collapsible折りたたみ)
38. [RadioGroup（ラジオボタン）](#38-radiogroupラジオボタン)
39. [Slider（スライダー）](#39-sliderスライダー)
40. [更新履歴](#40-更新履歴)
41. [統合元ドキュメント（アーカイブ済み）](#41-統合元ドキュメントアーカイブ済み)
42. [関連ドキュメント](#42-関連ドキュメント)

---

## 1. カラーパレット

### 1-1. ベースカラー（Slate）

**テキスト用**:
- `slate-900` (#0f172a): 最重要テキスト（顧客名、セクションタイトル、数値）
- `slate-700` (#334155): 重要テキスト（走行距離、時間、タグ）
- `slate-600` (#475569): 補助テキスト（連絡先情報、補助的な情報）
- `slate-500` (#64748b): 弱いテキスト（ラベル、メタ情報、アイコン）
- `slate-400` (#94a3b8): 無効テキスト（無効な状態、プレースホルダー）
- `slate-300` (#cbd5e1): ボーダー、区切り線、非アクティブな要素
- `slate-200` (#e2e8f0): 薄いボーダー
- `slate-100` (#f1f5f9): カード背景、バッジ背景
- `slate-50` (#f8fafc): セクション背景

**背景用**:
- `white` (#ffffff): メイン背景
- `slate-50` (#f8fafc): セクション背景
- `slate-100` (#f1f5f9): カード背景、バッジ背景

### 1-2. セマンティックカラー

**成功（Green）**:
- `green-600` (#16a34a): 成功アクション、完了状態
- `green-50` (#f0fdf4): 成功背景
- `green-700` (#15803d): 成功テキスト（濃い）

**警告（Amber）**:
- `amber-600` (#d97706): 警告アクション、保留状態
- `amber-50` (#fffbeb): 警告背景
- `amber-700` (#b45309): 警告テキスト（濃い）
- `amber-900` (#78350f): 警告テキスト（最濃、コントラスト向上用）

**エラー（Red）**:
- `red-600` (#dc2626): エラーアクション、削除
- `red-50` (#fef2f2): エラー背景
- `red-700` (#b91c1c): エラーテキスト（濃い）

**情報（Blue）**:
- `blue-600` (#2563eb): 情報表示、リンク
- `blue-50` (#eff6ff): 情報背景
- `blue-700` (#1d4ed8): 情報テキスト（濃い）

**プライマリ（Primary）**:
- `primary` (Tailwind設定値): メインアクション（通常は`slate-900`相当）
- `primary-foreground`: プライマリテキスト（通常は`white`）

### 1-3. カテゴリーカラー（入庫区分用）

**点検・検査系（Cyan）**:
- `cyan-600` (#0891b2): 車検、12ヵ月点検
- `cyan-50` (#cffafe): 背景

**メンテナンス系（Emerald）**:
- `emerald-600` (#059669): エンジンオイル交換、タイヤ交換・ローテーション
- `emerald-50` (#ecfdf5): 背景

**修理・整備系（Orange）**:
- `orange-600` (#ea580c): 修理・整備、板金・塗装
- `orange-700` (#c2410c): テキスト（濃い）
- `orange-50` (#fff7ed): 背景

**診断・トラブル系（Rose）**:
- `rose-600` (#e11d48): 故障診断
- `rose-50` (#fff1f2): 背景

**カスタマイズ・特殊作業系（Violet）**:
- `violet-600` (#9333ea): チューニング、パーツ取付、コーティング、レストア、板金・塗装
- `violet-50` (#f5f3ff): 背景

### 1-4. ステータスカラー（作業進行状況用）

| ステータス | テキスト | 背景 | ボーダー | 意味 |
|-----------|---------|------|---------|------|
| **入庫待ち** | `text-blue-700` | `bg-blue-50` | `border-blue-300` | 進行中・待機中 |
| **入庫済み** | `text-blue-700` | `bg-blue-50` | `border-blue-300` | 診断待ち |
| **診断待ち** | `text-orange-700` | `bg-orange-50` | `border-orange-300` | 注意が必要 |
| **見積作成待ち** | `text-indigo-600` | `bg-indigo-50` | `border-indigo-300` | 情報・管理業務 |
| **お客様承認待ち** | `text-amber-700` | `bg-amber-50` | `border-amber-300` | 承認待ち・保留 |
| **作業待ち** | `text-orange-700` | `bg-orange-50` | `border-orange-300` | 注意が必要 |
| **部品調達待ち** | `text-amber-700` | `bg-amber-50` | `border-amber-300` | 承認待ち・保留 |
| **部品発注待ち** | `text-orange-700` | `bg-orange-50` | `border-orange-300` | 注意が必要 |
| **引渡待ち** | `text-green-700` | `bg-green-50` | `border-green-300` | 完了・成功 |
| **出庫済み** | `text-slate-700` | `bg-slate-50` | `border-slate-300` | 完了・非アクティブ |

### 1-5. コントラスト比

**WCAG 2.1 AA準拠**:
- 本文テキスト: 4.5:1以上
- UIコンポーネント: 3:1以上
- 大きなテキスト（18pt以上）: 3:1以上

**推奨組み合わせ**:
- `slate-900` on `white`: 19.56:1 ✅
- `slate-700` on `white`: 12.63:1 ✅
- `blue-700` on `blue-50`: 4.51:1 ✅
- `amber-900` on `amber-50`: 7.12:1 ✅（40歳以上ユーザー向け、コントラスト向上）

---

## 2. タイポグラフィ

### 2-1. フォントファミリー

- **サンセリフ**: Geist Sans（デフォルト、Next.js標準）
- **モノスペース**: Geist Mono（コード表示用）

#### 2-1-1. 日本語フォントスタック

日本語表示の一貫性を確保するため、以下のフォントスタックを定義：

```css
font-family: var(--font-geist-sans), "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", "MS PGothic", sans-serif;
```

**フォント優先順位**:
1. **Geist Sans** (`var(--font-geist-sans)`) - 欧文・数字の表示に最適
2. **Noto Sans JP** - 日本語表示に最適（Google Fonts）
3. **Hiragino Kaku Gothic ProN** - macOS標準フォント
4. **Hiragino Sans** - macOS標準フォント（新しいバージョン）
5. **Meiryo** - Windows標準フォント
6. **MS PGothic** - Windows標準フォント（旧バージョン）
7. **sans-serif** - システムデフォルト

**実装場所**:
- `src/app/globals.css`の`@layer base`セクションで`body`要素に適用

**注意事項**:
- Geist Sansは欧文フォントのため、日本語表示時は自動的にフォールバックフォントが使用される
- 日本語の視認性を向上させるため、OS標準フォントを優先的に使用

### 2-2. フォントサイズ階層

| 階層 | 用途 | サイズ | Tailwindクラス | フォントウェイト | 色 | 実装例 |
|------|------|--------|----------------|------------------|-----|--------|
| **H1** | ページタイトル | 24px | `text-2xl` | `font-bold` | `text-slate-900` | ページメインタイトル |
| **H2** | セクションタイトル | 20px | `text-xl` | `font-bold` | `text-slate-900` | 「サマリー」「車両一覧」 |
| **H3** | カードタイトル | 18px | `text-lg` | `font-semibold` | `text-slate-900` | ジョブカードの顧客名、サマリーカードタイトル |
| **Body Large** | 重要情報 | 16px | `text-base` | `font-medium` | `text-slate-900` | 車両情報（クリック可能時は`hover:text-blue-600`） |
| **Body** | 本文 | 16px | `text-base` | `font-normal` | `text-slate-700` | 一般的な本文 |
| **Body Small（主要）** | 補助情報 | 14px | `text-sm` | `font-medium` | `text-slate-700` | 入庫日時 |
| **Body Small（補助）** | 補助情報 | 14px | `text-sm` | `font-normal` | `text-slate-600` | タグ、代車、担当整備士、連絡先情報（最小限の使用） |
| **Caption（非推奨）** | ラベル・バッジ | 12px | `text-xs` | `font-medium` | 状況に応じた色 | ⚠️ **40歳以上ユーザー向け最適化のため非推奨。`text-base` (16px) を使用すること** |
| **Number Large（優先度1）** | 最重要数値 | 20px | `text-xl` | `font-bold` | `text-slate-900` | サマリーカードの件数（入庫待ち、診断待ち） |
| **Number Medium（優先度2-3）** | 通常数値 | 18px | `text-lg` | `font-bold` | `text-slate-900` | サマリーカードの件数（その他のステータス） |

### 2-3. フォントウェイト

| 用途 | ウェイト | Tailwindクラス | 実装例 |
|------|----------|----------------|--------|
| **見出し** | Semibold (600) | `font-semibold` | カードタイトル、セクションタイトル |
| **重要情報** | Medium (500) | `font-medium` | 車両情報、ラベル |
| **本文** | Normal (400) | `font-normal` | 一般的な本文（デフォルト） |
| **数値** | Bold (700) | `font-bold` | 件数、重要数値 |

### 2-4. 文字カラー体系

| 用途 | カラー | Tailwindクラス | 説明 |
|------|--------|----------------|------|
| **最重要テキスト** | Slate 900 | `text-slate-900` | 顧客名、車両情報、セクションタイトル |
| **重要テキスト** | Slate 700 | `text-slate-700` | 走行距離、時間、タグ、代車、担当整備士 |
| **補助テキスト** | Slate 600 | `text-slate-600` | 連絡先情報、補助的な情報 |
| **弱いテキスト** | Slate 500 | `text-slate-500` | ラベル、メタ情報 |
| **無効テキスト** | Slate 400 | `text-slate-400` | 無効な状態、プレースホルダー |
| **リンクテキスト** | Blue 600 | `text-blue-600` | クリック可能なリンク、ホバー時 |

### 2-5. 行の高さ（Line Height）

**40歳以上ユーザー向け最適化**: 可読性を向上させるため、適切な行の高さを設定

| 要素 | Line Height | Tailwindクラス | 実装例 |
|------|-------------|----------------|--------|
| **見出し（H1-H3）** | 1.3-1.4 | `leading-tight` または `leading-snug` | `text-2xl font-bold leading-tight` |
| **本文** | 1.5-1.6 | `leading-normal`（デフォルト） | `text-base leading-normal` |
| **リスト** | 1.6 | `leading-relaxed` | `text-base leading-relaxed` |

**実装例:**
```typescript
// 見出し（行の高さを調整）
<h1 className="text-2xl font-bold text-slate-900 leading-tight">
  田中様 BMW X3 車検診断
</h1>

// 本文（デフォルトの行の高さ）
<p className="text-base text-slate-700 leading-normal">
  診断結果、特記事項など
</p>

// リスト（行の高さを広げる）
<ul className="text-base leading-relaxed">
  <li>項目1</li>
  <li>項目2</li>
</ul>
```

### 2-6. 文字間隔（Letter Spacing）

**用途別の文字間隔設定:**

| 要素 | Letter Spacing | Tailwindクラス | 説明 |
|------|----------------|----------------|------|
| **見出し** | -0.025em | `tracking-tight` | 見出しの視認性向上 |
| **本文** | 0em | デフォルト | 標準的な文字間隔 |
| **大文字** | 0.025em | `tracking-wide` | 大文字の視認性向上 |

**実装例:**
```typescript
// 見出し（文字間隔を詰める）
<h1 className="text-2xl font-bold text-slate-900 tracking-tight">
  田中様 BMW X3 車検診断
</h1>

// 本文（デフォルトの文字間隔）
<p className="text-base text-slate-700">
  診断結果、特記事項など
</p>
```

### 2-7. 実装例

```typescript
// ページタイトル
<h1 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
  田中様 BMW X3 車検診断
</h1>

// セクションタイトル
<h2 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
  診断項目
</h2>

// カードタイトル（顧客名）
<h3 className="text-lg font-semibold text-slate-900 leading-snug">
  田中太郎
</h3>

// 重要情報（車両情報）
<p className="text-base font-medium text-slate-900 leading-normal">
  BMW X3
</p>

// 本文
<p className="text-base text-slate-700 leading-normal">
  診断結果、特記事項など
</p>

// 補助情報
<span className="text-sm text-slate-600 leading-normal">
  タグ情報
</span>

// 数値（サマリーカード）
<span className="text-xl font-bold text-slate-900 tabular-nums leading-normal">
  12
</span>
```

---

## 3. スペーシング

### 3-1. セクション間スペーシング

| 用途 | スペーシング | Tailwindクラス | 実装例 |
|------|------------|----------------|--------|
| **セクション間** | 24px | `space-y-6` または `mb-6` | サマリーセクションと車両一覧セクションの間 |
| **カード間** | 16px | `space-y-4` | ジョブカードリスト |
| **カード内要素間** | 6px | `space-y-1.5` | ジョブカード内の第2階層要素 |

### 3-2. 要素間スペーシング（Gap）

| 用途 | スペーシング | Tailwindクラス | モバイル対応 | 実装例 |
|------|------------|----------------|-------------|--------|
| **カードタイトル内** | 8px | `gap-2` | - | 顧客名とアイコンの間 |
| **第2階層要素** | 8px (モバイル) / 12px (PC) | `gap-2 sm:gap-3` | レスポンシブ | 入庫区分、時間、タグ |
| **補助情報** | 6px (モバイル) / 8px (PC) | `gap-1.5 sm:gap-2` | レスポンシブ | 代車、担当整備士、連絡先 |
| **バッジ内** | 6px | `gap-1.5` | - | 入庫区分バッジ内のアイコンとテキスト |

### 3-3. パディング体系

| 用途 | パディング | Tailwindクラス | 実装例 |
|------|----------|----------------|--------|
| **カードヘッダー** | 12px (下) | `pb-3` | ジョブカード、サマリーカード |
| **カードコンテンツ** | 16px | `p-4` | カード内コンテンツ |
| **バッジ** | 10px (横) / 4px (縦) | `px-2.5 py-0.5` | ステータスバッジ |
| **バッジ（大きめ）** | 10px (横) / 4px (縦) | `px-2.5 py-1` | 入庫区分バッジ、件数バッジ |
| **ボタン（デフォルト）** | 16px (横) / 8px (縦) | `px-4 py-2` | プライマリアクションボタン |
| **入力フィールド** | 12px (横) / 8px (縦) | `px-3 py-2` | Input、Textarea |

---

## 4. ボーダーとシャドウ

### 4-1. ボーダー

| 用途 | 太さ | Tailwindクラス | 色 | 実装例 |
|------|------|----------------|-----|--------|
| **標準ボーダー** | 1px | `border` | `border-slate-300` | カード、入力フィールド |
| **強調ボーダー** | 2px | `border-2` | `border-slate-900` | 選択状態のカード |
| **薄いボーダー** | 1px | `border` | `border-slate-200` | セクション区切り |
| **角丸（中）** | - | `rounded-md` | - | 入力フィールド、ボタン |
| **角丸（大）** | - | `rounded-lg` | - | カード |
| **角丸（特大）** | - | `rounded-xl` | - | カード（一部） |
| **完全な角丸** | - | `rounded-full` | - | バッジ、アイコンボタン |

### 4-2. シャドウ

| 用途 | シャドウ | Tailwindクラス | 実装例 |
|------|---------|----------------|--------|
| **標準シャドウ** | 小 | `shadow` または `shadow-xs` | カード、入力フィールド |
| **中程度のシャドウ** | 中 | `shadow-md` | カード（ホバー前） |
| **大きなシャドウ** | 大 | `shadow-lg` | カード（ホバー時）、ドロップダウン |

### 4-3. 実装例

```typescript
// カード
<Card className="border border-slate-300 rounded-xl shadow-md hover:shadow-lg">
  ...
</Card>

// ボタン
<Button className="border-2 border-slate-900 rounded-md">
  保存
</Button>

// 入力フィールド
<Input className="border border-slate-300 rounded-md shadow-xs" />
```

---

## 4-4. Z-Index管理

### 4-4-1. Z-Index階層ルール

**40歳以上ユーザー向け最適化のため、レイヤーを明確に定義**

レイヤーの重なり順序を明確にし、UIコンポーネントが適切に表示されるようZ-Indexを階層化します。

| レイヤー | Z-Index値 | 用途 | Tailwindクラス | 実装例 |
|---------|-----------|------|----------------|--------|
| **Header（ヘッダー）** | 40 | アプリヘッダー（AppHeader） | `z-[40]` | ページ上部の固定ヘッダー |
| **Sheet（サイドパネル）** | 50 | サイドパネル（Sheet） | `z-[50]` | モバイル向けサイドパネル、フィルター |
| **Dialog（ダイアログ）** | 60 | モーダルダイアログ（Dialog） | `z-[60]` | 確認ダイアログ、フォームダイアログ |
| **Toast（トースト通知）** | 100 | トースト通知（Toast） | `z-[100]` | 成功・エラー・警告などの通知 |

### 4-4-2. Z-Indexの定義場所

**Tailwind CSS v4対応:**
- `src/app/globals.css`の`@theme`ディレクティブ内でCSS変数として定義
- `tailwind.config.ts`でも定義（後方互換性のため）

**定義内容:**
```css
@theme inline {
  /* Z-Index階層管理（DESIGN_SYSTEM.mdに準拠） */
  --z-index-header: 40;      /* ヘッダー（AppHeader） */
  --z-index-sheet: 50;       /* サイドパネル（Sheet） */
  --z-index-dialog: 60;      /* ダイアログ（Dialog） */
  --z-index-toast: 100;      /* トースト通知（Toast） */
}
```

### 4-4-3. Z-Index使用ルール

**基本ルール:**
- **階層を守る**: 定義された階層に従い、適切なZ-Index値を使用する
- **カスタム値の使用**: 新しいレイヤーを追加する場合は、既存の階層との競合を避ける
- **コンポーネント別の統一**: 同じ種類のコンポーネントは同じZ-Index値を使用する

**実装例:**
```typescript
// ✅ 正しい使用例
// ヘッダー
<header className="sticky z-[40] ...">
  ...
</header>

// サイドパネル
<SheetContent className="z-[50] ...">
  ...
</SheetContent>

// ダイアログ
<DialogContent className="z-[60] ...">
  ...
</DialogContent>

// トースト通知（globals.cssで設定）
[data-sonner-toaster] {
  z-index: 100 !important;
}
```

**注意事項:**
- 各レイヤー間には十分な間隔（10以上）を確保し、将来的な拡張に対応できるようにする
- 特別な用途（開発ツールなど）で高いZ-Indexが必要な場合は、1000以上を使用する（例: `z-[9999]`）

---

## 5. アイコン

### 5-1. アイコンライブラリ

**lucide-react**を使用（Next.js標準）

```typescript
import { 
  Activity, 
  Camera, 
  FileText, 
  Wrench,
  CheckCircle2,
  AlertCircle,
  User,
  Car,
  Clock,
} from "lucide-react";
```

### 5-2. アイコンサイズ体系

| 用途 | サイズ | Tailwindクラス | 実装例 | 色 |
|------|--------|----------------|--------|-----|
| **カードタイトルアイコン** | 20px | `h-5 w-5` | セクションタイトル | `text-slate-600` |
| **第1階層アイコン** | 20px | `h-5 w-5` | 顧客名アイコン（User）、重要な顧客フラグ（Star）、共有フォルダ（Folder） | `text-slate-600`または`text-slate-700`（User, Folder）<br>`text-yellow-500`（Star、アクティブ時）<br>`text-slate-300`（Star、非アクティブ時） |
| **第2階層アイコン（主要）** | 16px | `h-4 w-4` | 車両情報（Car）、入庫日時（Clock） | `text-slate-600`または`text-slate-700` |
| **第2階層アイコン（補助）** | 14px | `h-3.5 w-3.5` | タグ（Tag）、代車（CarFront）、担当整備士（Wrench） | `text-slate-600`または`text-slate-700` ⚠️ **推奨: `h-4 w-4` (16px)** |
| **入庫区分バッジ内アイコン** | 14px | `h-3.5 w-3.5` | 入庫区分バッジ内のアイコン | カテゴリー別色（Cyan/Emerald/Orange/Rose/Violet） ⚠️ **推奨: `h-4 w-4` (16px)** |
| **第3階層アイコン** | 16px | `h-4 w-4` | 詳細情報折りたたみ（ChevronDown） | `text-slate-600` |
| **詳細情報バッジ内アイコン** | 14px | `h-3.5 w-3.5` | お客様入力情報（MessageSquare）、作業指示（Clipboard）、変更申請（Bell）、承認済み作業（Wrench） | バッジの背景色に応じた白（`text-white`）または色付き ⚠️ **推奨: `h-4 w-4` (16px)** |
| **サマリーカードタイトルアイコン** | 16px | `h-4 w-4` | サマリーカードタイトル内の円形背景内アイコン | `text-white`（背景: `bg-slate-600`） |
| **サマリーカードステータスアイコン** | 16px | `h-4 w-4` | ステータス項目のアイコン | ステータス別色（Blue/Orange/Indigo/Amber/Green） |
| **検索バーアイコン** | 20px | `h-5 w-5` | 検索アイコン（Search） | `text-slate-600` |
| **検索バー補助アイコン** | 16px | `h-4 w-4` | QRスキャン（QrCode）、クリア（X） | `text-slate-600` |
| **プライマリアクションボタンアイコン（PC）** | 20px | `h-5 w-5` | プライマリアクションボタン内アイコン | `text-white` |
| **プライマリアクションボタンアイコン（モバイル）** | 16px | `h-4 w-4` | モバイル用プライマリアクションボタン内アイコン | `text-white` |
| **ボタン内アイコン（デフォルト）** | 20px | `size-5` | 通常のボタン内アイコン | ボタンのテキスト色に応じる |

### 5-3. アイコンカラー体系

| カテゴリー | 用途 | カラー | Tailwindクラス | 実装例 |
|-----------|------|--------|----------------|--------|
| **デフォルト情報アイコン** | 一般的な情報表示 | Slate 600/700 | `text-slate-600`または`text-slate-700` | User, Car, Clock, Tag, Folder, CarFront, Wrench（視認性向上のため`text-slate-500`は推奨しない） |
| **重要な顧客フラグ（アクティブ）** | Starアイコン（マーク済み） | Yellow 500 | `text-yellow-500 hover:text-yellow-600` | 重要な顧客としてマーク済み |
| **重要な顧客フラグ（非アクティブ）** | Starアイコン（未マーク） | Slate 300 | `text-slate-300 hover:text-yellow-400` | 未マーク状態 |
| **クリック可能アイコン** | リンク・ボタン | Slate 600/700 → Blue 600 | `text-slate-600 hover:text-blue-600`または`text-slate-700 hover:text-blue-600` | Folderアイコン、クリック可能な車両情報 |
| **入庫区分カテゴリー色** | 点検・検査系 | Cyan 600 | `text-cyan-600` | ShieldCheck, CalendarCheck（車検、12ヵ月点検） |
| | メンテナンス系 | Emerald 600 | `text-emerald-600` | Droplet, Circle, Wrench（エンジンオイル交換、タイヤ、その他メンテナンス） |
| | 修理・整備系 | Orange 600 | `text-orange-600` | Wrench, Paintbrush（修理・整備、板金・塗装） |
| | 診断・トラブル系 | Rose 600 | `text-rose-600` | Activity（故障診断） |
| | カスタマイズ・特殊作業系 | Violet 600 | `text-violet-600` | Sparkles, Zap, Package, Shield（レストア、チューニング、パーツ取付、コーティング） |
| **ステータスカラー** | 入庫待ち | Blue 600 | `text-blue-600` | Clockアイコン |
| | 診断待ち | Orange 600 | `text-orange-600` | Activityアイコン |
| | 見積作成待ち | Indigo 600 | `text-indigo-600` | FileTextアイコン |
| | お客様承認待ち | Amber 600 | `text-amber-600` | UserCheckアイコン |
| | 作業待ち | Orange 600 | `text-orange-600` | Wrenchアイコン |
| | 引渡待ち | Green 600 | `text-green-600` | Carアイコン |
| **アクションボタン内アイコン** | プライマリアクション | 白 | `text-white` | すべてのプライマリアクションボタン内アイコン |
| **セクションタイトルアイコン** | サマリー・車両一覧 | Slate 600 | `text-slate-600` | BarChart3, FileText |

### 5-4. アイコン使用ルール（詳細）

**基本ルール:**
- **一貫性**: 同じ意味のアイコンは同じサイズ・色を使用
- **shrink-0**: すべてのアイコンに`shrink-0`を設定（縮小防止）
- **アクセシビリティ**: 装飾的アイコンには`aria-hidden="true"`を設定
- **アクションアイコン**: クリック可能なアイコンには`aria-label`を設定
- **視認性向上**: 重要なアイコン（カードタイトル、第1階層）には`strokeWidth={2.5}`を設定（デフォルトは2）

**40歳以上ユーザー向けの最適化:**
- **最小サイズ**: `h-4 w-4` (16px) 以上を使用
- **禁止事項**: `h-3 w-3` (12px) や `size-3` (12px) の使用は禁止（視認性が低すぎる）
- **視認性向上**: 重要なアイコンの`strokeWidth`を2.5に設定（より太い線で視認性が向上）
- **カラー**: 重要なアイコン（カードタイトル、第1階層）は`text-slate-600`または`text-slate-700`を使用（`text-slate-500`は視認性が低いため推奨しない）

**アイコンサイズの詳細ルール:**

```typescript
// ⚠️ 40歳以上ユーザー向け: アイコンサイズを拡大
export const iconSizes = {
  // ボタン内アイコン（標準）
  button: "h-5 w-5",        // 20px - ボタン内のアイコン（size-4→size-5に拡大）
  
  // カードタイトル・セクションタイトルアイコン
  title: "h-5 w-5",        // 20px - カードタイトルやセクションタイトルのアイコン
  
  // 背景付きアイコン（カードタイトルなど）
  titleWithBg: {
    container: "w-6 h-6",  // 24px - 背景円のサイズ
    icon: "h-5 w-5",       // 20px - アイコン自体のサイズ
  },
  
  // リストアイテム内アイコン
  listItem: {
    container: "w-6 h-6 rounded-full",  // 24px - 背景円のサイズ
    icon: "h-4 w-4",                     // 16px - アイコン自体のサイズ
  },
  
  // バッジ内アイコン
  badge: "h-4 w-4",       // 16px - バッジ内のアイコン（size-3→size-4に拡大）
  
  // 大きなアイコン・アラート
  large: "h-6 w-6",       // 24px - 大きなアイコンやアラート用
  
  // 超大型アイコン（重要アクション）
  xl: "h-7 w-7",          // 28px - 最重要アクション用
  
  // ❌ size-3 (12px), h-3 w-3 (12px) は使用禁止（視認性が低すぎる）
};
```

**アイコンカラーの統一ルール:**

```typescript
// アイコンカラーの統一ルール
export const iconColors = {
  // デフォルト（テキストと同じ色）
  default: "text-slate-700",      // 通常のアイコン
  
  // 白背景上のアイコン
  onWhite: "text-slate-700",      // 白背景上のアイコン
  
  // 色付き背景上のアイコン
  onPrimary: "text-white",        // プライマリ色背景上のアイコン
  onSecondary: "text-white",      // セカンダリ色背景上のアイコン
  
  // ステータスカラー
  success: "text-green-900",     // 成功
  warning: "text-amber-900",      // 警告
  error: "text-red-900",          // エラー
  info: "text-blue-900",          // 情報
  
  // 無効状態
  disabled: "text-slate-400",     // 無効状態のアイコン
  
  // ホバー状態
  hover: "hover:text-blue-700",   // ホバー時のアイコン色
};
```

**アイコン一貫性（ページ間の統一）:**

| 機能 | 統一アイコン | 使用場所 |
|------|------------|---------|
| **診断** | `Activity` | TOPページ（診断を開始ボタン）、診断ページ（タイトル） |
| **見積** | `Calculator` | TOPページ（見積を開始ボタン）、見積ページ（タイトル） |
| **作業** | `Wrench` | TOPページ（作業を開始ボタン）、作業ページ（タイトル） |
| **引き渡し** | `Car` | TOPページ（引渡しを開始ボタン）、引き渡しページ（タイトル） |

**実装例:**
```typescript
// ✅ 正しい使用例
// ボタン内アイコン（視認性向上：strokeWidth={2.5}を追加）
<Button>
  <Key className="h-5 w-5" strokeWidth={2.5} />
  受付を開始
</Button>

// カードタイトルアイコン（背景付き、視認性向上：strokeWidth={2.5}を追加）
<div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center">
  <Calendar className="h-5 w-5 text-white" strokeWidth={2.5} />
</div>

// リストアイテムアイコン（背景付き、視認性向上：strokeWidth={2.5}を追加）
<div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
  <Car className="h-4 w-4 text-slate-700" strokeWidth={2.5} />
</div>

// バッジ内アイコン（視認性向上：strokeWidth={2.5}を追加）
<Badge>
  <AlertCircle className="h-4 w-4" strokeWidth={2.5} />
  警告
</Badge>

// ❌ 間違った使用例
<Key className="h-3 w-3" />  // 小さすぎる
<Key className="size-3" />   // 小さすぎる
```

### 5-5. 実装例

```typescript
// プライマリアクションボタン（PC、視認性向上：strokeWidth={2.5}を追加）
<Button className="bg-blue-600 text-white h-12">
  <Activity className="h-5 w-5 shrink-0" strokeWidth={2.5} />
  診断を開始
</Button>

// 第2階層アイコン（視認性向上：strokeWidth={2.5}を追加）
<div className="flex items-center gap-1.5">
  <Car className="h-4 w-4 text-slate-700 shrink-0" strokeWidth={2.5} />
  <span>BMW X3</span>
</div>

// バッジ内アイコン（視認性向上：strokeWidth={2.5}を追加）
<Badge>
  <ShieldCheck className="h-4 w-4 text-cyan-600 shrink-0" strokeWidth={2.5} />
  車検
</Badge>

// 装飾的アイコン（スクリーンリーダー用）
<Activity className="h-5 w-5 text-slate-600" aria-hidden="true" strokeWidth={2.5} />
```

---

## 6. ボタン

### 6-1. ボタンサイズ

**40歳以上ユーザー向けに最適化**: 最小タッチターゲットサイズ48px (h-12) を確保

| サイズ | 高さ | Tailwindクラス | 用途 | パディング |
|--------|------|----------------|------|----------|
| **default** | 48px | `h-12` | 標準ボタン（推奨） | `px-4 py-2`（アイコンあり: `px-3`） |
| **sm** | 40px | `h-10` | 小さいボタン（デスクトップのみ、最小限の使用） | `px-3`（アイコンあり: `px-2.5`） |
| **lg** | 56px | `h-14` | 大きいボタン（重要アクション用） | `px-6`（アイコンあり: `px-4`） |
| **icon** | 48px × 48px | `size-12` | アイコンボタン（標準） | - |
| **icon-sm** | 40px × 40px | `size-10` | アイコンボタン（小） | - |
| **icon-lg** | 56px × 56px | `size-14` | アイコンボタン（大） | - |

### 6-2. ボタンバリアント

| バリアント | 背景 | テキスト | ホバー | Tailwindクラス | 用途 |
|-----------|------|---------|--------|----------------|------|
| **default** | `bg-primary` | `text-primary-foreground` | `hover:bg-primary/90` | `variant="default"` | メインアクション |
| **destructive** | `bg-destructive` | `text-white` | `hover:bg-destructive/90` | `variant="destructive"` | 削除、危険なアクション |
| **outline** | `border` + `bg-background` | `text-foreground` | `hover:bg-accent` | `variant="outline"` | セカンダリアクション |
| **secondary** | `bg-secondary` | `text-secondary-foreground` | `hover:bg-secondary/80` | `variant="secondary"` | 補助アクション |
| **ghost** | 透明 | `text-foreground` | `hover:bg-accent` | `variant="ghost"` | 控えめなアクション |
| **link** | 透明 | `text-primary` | `hover:underline` | `variant="link"` | リンクスタイル |

### 6-3. アクションボタン（ステージ別）

| ステージ | ラベル | アイコン | 背景色 | ホバー色 | ボタン高さ | 意味 |
|---------|--------|---------|--------|---------|-----------|------|
| **入庫待ち** | 受付を開始 | Key | `bg-slate-600` | `hover:bg-slate-700` | `h-12` | 初期状態 |
| **入庫済み** | 診断を開始 | Activity | `bg-blue-600` | `hover:bg-blue-700` | `h-12` | 診断開始 |
| **見積作成待ち** | 見積を開始 | FileText | `bg-orange-600` | `hover:bg-orange-700` | `h-12` | 見積作成 |
| **作業待ち** | 作業を開始 | Wrench | `bg-emerald-600` | `hover:bg-emerald-700` | `h-12` | 作業開始 |
| **出庫待ち** | 引渡しを開始 | Car | `bg-violet-600` | `hover:bg-violet-700` | `h-12` ⚠️ **推奨** | 引渡し（既存実装: `h-10`） |

### 6-4. ボタンのテキストとアイコン

- **テキストサイズ**: `text-base` (16px)
- **フォントウェイト**: `font-medium` (500)
- **アイコンサイズ**: `size-5` (20px) - デフォルト（Buttonコンポーネント内で自動設定）
- **アイコン色**: ボタンのテキスト色に応じる（通常は`text-white`）

### 6-5. 実装例

```typescript
// プライマリボタン
<Button className="bg-slate-900 text-white hover:bg-slate-800">
  診断を開始
</Button>

// セカンダリボタン
<Button variant="outline" className="border-slate-300">
  キャンセル
</Button>

// アイコンボタン
<Button className="bg-slate-900 text-white hover:bg-slate-800">
  <Activity className="h-5 w-5" />
  診断を開始
</Button>

// アクションボタン（ステージ別）
<Button className="bg-blue-600 text-white hover:bg-blue-700 h-12">
  <Activity className="h-5 w-5" />
  診断を開始
</Button>

// 大きいボタン（重要アクション）
<Button size="lg" className="bg-green-600 text-white hover:bg-green-700">
  この内容で作業を依頼する
</Button>
```

---

## 7. フォーム要素

### 7-1. 入力フィールド（Input）

**40歳以上ユーザー向けに最適化**: 高さ48px、テキストサイズ16px

| プロパティ | 値 | Tailwindクラス | 説明 |
|-----------|-----|----------------|------|
| **高さ** | 48px | `h-12` | 最小タッチターゲットサイズ確保 |
| **パディング** | 12px (横) / 8px (縦) | `px-3 py-2` | - |
| **テキストサイズ** | 16px | `text-base` | 読みやすさを重視 |
| **ボーダー** | 1px | `border border-slate-300` | - |
| **角丸** | 6px | `rounded-md` | - |
| **シャドウ** | 小 | `shadow-xs` | - |
| **フォーカスリング** | 3px | `focus-visible:ring-[3px]` | アクセシビリティ向上 |

**実装例**:
```typescript
<Input 
  type="text" 
  placeholder="走行距離を入力"
  className="w-full"
/>
```

### 7-2. テキストエリア（Textarea）

**40歳以上ユーザー向けに最適化**: 最小高さ64px、テキストサイズ16px

| プロパティ | 値 | Tailwindクラス | 説明 |
|-----------|-----|----------------|------|
| **最小高さ** | 64px | `min-h-16` | - |
| **パディング** | 12px (横) / 8px (縦) | `px-3 py-2` | - |
| **テキストサイズ** | 16px | `text-base` | 読みやすさを重視 |
| **ボーダー** | 1px | `border border-slate-300` | - |
| **角丸** | 6px | `rounded-md` | - |
| **シャドウ** | 小 | `shadow-xs` | - |
| **フォーカスリング** | 3px | `focus-visible:ring-[3px]` | アクセシビリティ向上 |

**実装例**:
```typescript
<Textarea
  placeholder="コメントを入力"
  rows={4}
  className="w-full"
/>
```

### 7-3. チェックボックス（Checkbox）

**40歳以上ユーザー向けに最適化**: サイズ16px

| プロパティ | 値 | Tailwindクラス | 説明 |
|-----------|-----|----------------|------|
| **サイズ** | 16px × 16px | `size-4` | 最小タッチターゲットサイズ確保 |
| **アイコンサイズ** | 16px | `size-4` | CheckIcon |
| **角丸** | 4px | `rounded-[4px]` | - |
| **ボーダー** | 1px | `border border-slate-300` | - |
| **チェック時背景** | Primary | `data-[state=checked]:bg-primary` | - |
| **フォーカスリング** | 3px | `focus-visible:ring-[3px]` | アクセシビリティ向上 |

**実装例**:
```typescript
<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
/>
```

### 7-4. セレクト（Select）

**40歳以上ユーザー向けに最適化**: デフォルト高さ48px、テキストサイズ16px

| サイズ | 高さ | Tailwindクラス | 用途 |
|--------|------|----------------|------|
| **default** | 48px | `h-12` | 標準セレクト（推奨） |
| **sm** | 40px | `h-10` | 小さいセレクト（デスクトップのみ） |

| プロパティ | 値 | Tailwindクラス | 説明 |
|-----------|-----|----------------|------|
| **テキストサイズ** | 16px | `text-base` | 読みやすさを重視 |
| **パディング** | 12px (横) / 8px (縦) | `px-3 py-2` | - |
| **ボーダー** | 1px | `border border-slate-300` | - |
| **角丸** | 6px | `rounded-md` | - |
| **アイコンサイズ** | 16px | `size-4` | ChevronDown |
| **フォーカスリング** | 3px | `focus-visible:ring-[3px]` | アクセシビリティ向上 |

**実装例**:
```typescript
<Select>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="選択してください" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">オプション1</SelectItem>
    <SelectItem value="option2">オプション2</SelectItem>
  </SelectContent>
</Select>
```

### 7-5. フォームフィールドのレイアウト

**推奨レイアウト**:
```typescript
<div className="space-y-2">
  <Label htmlFor="field-name" className="text-base font-medium text-slate-900">
    フィールド名
    {required && <span className="text-red-600 ml-1">*</span>}
  </Label>
  <Input
    id="field-name"
    type="text"
    className="w-full"
    aria-required={required}
    aria-invalid={!!error}
  />
  {error && (
    <p className="text-sm text-red-600" role="alert">
      {error}
    </p>
  )}
</div>
```

---

## 7-5. 見積行のUI仕様

### 7-5-1. 見積行の5列形式

見積作成画面で使用される見積行は、以下の5列（+ 削除ボタン）で構成されます：

**グリッドレイアウト:**
```typescript
<div className="grid grid-cols-[2fr_80px_100px_100px_120px_auto] gap-2 items-center">
  {/* 作業内容・使用部品名等 (2fr) */}
  {/* 数量 (80px) */}
  {/* 単価 (100px) */}
  {/* 部品代 (100px) */}
  {/* 技術量 (120px) */}
  {/* 削除ボタン (auto) */}
</div>
```

### 7-5-2. 各列の仕様

#### 作業内容・使用部品名等（1列目）

- **幅**: `2fr`（可変幅、残りのスペースを占める）
- **入力フィールド**: `Input` コンポーネント
- **サイズ**: `h-12 text-base`（40歳以上ユーザー向け最適化）
- **必須項目**: 空の場合は警告を表示

```typescript
<Input
  type="text"
  value={item.name}
  onChange={(e) => onUpdate(item.id, { name: e.target.value })}
  className="h-12 text-base"
  placeholder="作業内容・使用部品名等"
  aria-required="true"
/>
```

#### 数量（2列目）

- **幅**: `80px`（固定幅）
- **入力フィールド**: `Input` コンポーネント（`type="number"`）
- **サイズ**: `h-12 text-base`
- **配置**: 右揃え（`text-right`）
- **最小値**: 0
- **デフォルト値**: 1

```typescript
<Input
  type="number"
  min="0"
  value={item.partQuantity || ""}
  onChange={(e) => onUpdate(item.id, { partQuantity: parseInt(e.target.value) || 0 })}
  className="h-12 text-base text-right"
  placeholder="0"
  aria-required="true"
/>
```

#### 単価（3列目）

- **幅**: `100px`（固定幅）
- **入力フィールド**: `Input` コンポーネント（`type="number"`）
- **サイズ**: `h-12 text-base`
- **配置**: 右揃え（`text-right`）
- **最小値**: 0
- **単位**: 円

```typescript
<Input
  type="number"
  min="0"
  value={item.partUnitPrice || ""}
  onChange={(e) => onUpdate(item.id, { partUnitPrice: parseInt(e.target.value) || 0 })}
  className="h-12 text-base text-right"
  placeholder="0"
  aria-required="true"
/>
```

#### 部品代（4列目）

- **幅**: `100px`（固定幅）
- **表示**: 計算フィールド（自動計算、編集不可）
- **サイズ**: `text-base`
- **配置**: 右揃え（`text-right`）
- **計算式**: `数量 × 単価`
- **フォーマット**: `¥{formatPrice(partQuantity * partUnitPrice)}`

```typescript
<div className="text-right text-base font-medium tabular-nums">
  ¥{formatPrice(item.partQuantity * item.partUnitPrice)}
</div>
```

#### 技術量（5列目）

- **幅**: `120px`（固定幅）
- **入力**: `Select` コンポーネント（工賃マスタから選択）または `Input` コンポーネント（カスタム入力）
- **サイズ**: `h-12 text-base`
- **配置**: 右揃え（`text-right`）
- **最小値**: 0
- **単位**: 円

**工賃マスタ選択:**
```typescript
<Select
  value={selectedLaborCostItem?.id || "none"}
  onValueChange={(value) => {
    if (value === "none") {
      onUpdate(item.id, { laborCost: 0 });
    } else if (value === "custom") {
      // カスタム入力はそのまま
    } else {
      const masterItem = LABOR_COST_MASTER.find((m) => m.id === value);
      if (masterItem) {
        onUpdate(item.id, { laborCost: masterItem.laborCost });
      }
    }
  }}
>
  <SelectTrigger className="h-12 text-base">
    <SelectValue placeholder="技術量" />
  </SelectTrigger>
  <SelectContent className="max-h-[300px]">
    <SelectItem value="none">なし</SelectItem>
    {LABOR_COST_MASTER.map((master) => (
      <SelectItem key={master.id} value={master.id}>
        {master.name} (¥{formatPrice(master.laborCost)})
      </SelectItem>
    ))}
    {selectedLaborCostItem && !LABOR_COST_MASTER.find((m) => m.laborCost === item.laborCost) && (
      <SelectItem value="custom">
        カスタム (¥{formatPrice(item.laborCost)})
      </SelectItem>
    )}
  </SelectContent>
</Select>
```

**カスタム入力（工賃マスタにない場合）:**
```typescript
<Input
  type="number"
  min="0"
  value={item.laborCost || ""}
  onChange={(e) => onUpdate(item.id, { laborCost: parseInt(e.target.value) || 0 })}
  className="h-12 text-base text-right"
  placeholder="技術量"
  aria-required="true"
/>
```

#### 削除ボタン（6列目）

- **幅**: `auto`（可変幅）
- **ボタン**: `Button` コンポーネント（`variant="ghost"`, `size="icon"`）
- **サイズ**: `h-12 w-12`（40歳以上ユーザー向け最適化）
- **アイコン**: `Trash2`（`h-5 w-5`）
- **削除制限**: 必須項目（`priority = "required"`）の場合は、項目が1つ以上ある場合のみ削除可能

```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => onDelete(item.id)}
  disabled={!canDelete}
  className="h-12 w-12 text-slate-700 hover:text-red-600"
>
  <Trash2 className="h-5 w-5" />
</Button>
```

### 7-5-3. 合計行の仕様

各セクション（必須、推奨、任意）ごとに合計行を表示します：

**レイアウト:**
```typescript
<div className="grid grid-cols-[2fr_80px_100px_100px_120px_auto] gap-2 items-center py-3 border-t-2 border-slate-300 font-bold text-base bg-slate-50 rounded-md mt-2">
  <div className="text-slate-900">合計</div>
  <div></div>
  <div></div>
  <div className="text-right text-slate-900 tabular-nums">¥{formatPrice(partTotal)}</div>
  <div className="text-right text-slate-900 tabular-nums">¥{formatPrice(laborTotal)}</div>
  <div className="text-right text-slate-900 tabular-nums">¥{formatPrice(sectionTotal)}</div>
</div>
```

**スタイル:**
- **背景色**: `bg-slate-50`
- **ボーダー**: `border-t-2 border-slate-300`（上部に2pxのボーダー）
- **フォント**: `font-bold text-base`
- **数値表示**: `tabular-nums`（等幅フォントで数値の揃えを改善）
- **パディング**: `py-3`（上下に12pxのパディング）
- **マージン**: `mt-2`（上部に8pxのマージン）

### 7-5-4. 見積行の追加ボタン

各セクションに「項目を追加」ボタンを配置します：

```typescript
<Button
  variant="ghost"
  onClick={onAdd}
  className="w-full justify-start text-slate-700 hover:text-slate-900 h-12 text-base font-medium"
>
  <Plus className="h-5 w-5 mr-1 shrink-0" />
  項目を追加
</Button>
```

**スタイル:**
- **サイズ**: `h-12 text-base font-medium`（40歳以上ユーザー向け最適化）
- **アイコン**: `Plus`（`h-5 w-5`）
- **配置**: 左揃え（`justify-start`）

### 7-5-5. バリデーション

見積行のバリデーションルール：

- **作業内容**: 空の場合は警告を表示（保存時エラー）
- **数量**: 0以下の場合は警告を表示（保存時エラー）
- **単価**: 0以下の場合は警告を表示（保存時エラー）
- **技術量**: 0以下の場合は警告を表示（保存時エラー）

**エラー表示:**
```typescript
{error && (
  <p className="text-base text-red-600 mt-1" role="alert">
    {error}
  </p>
)}
```

### 7-5-6. 写真・動画の紐付け

見積行に写真・動画を紐付け可能です：

- **写真**: `linkedPhotoId` で診断写真を紐付け
- **動画**: `linkedVideoId` で診断動画を紐付け
- **実況解説**: `transcription` で音声認識結果（実況解説テキスト）を保存

### 7-5-7. 40歳以上ユーザー向け最適化

- **入力フィールド**: すべて `h-12` (48px) を使用
- **フォントサイズ**: すべて `text-base` (16px) を使用
- **ボタン**: すべて `h-12` (48px) を使用
- **アイコン**: 最小 `h-4 w-4` (16px) を使用
- **数値表示**: `tabular-nums` で等幅フォントを使用（数値の揃えを改善）
- **タッチターゲット**: 最小48px × 48pxを確保

---

## 8. バッジ

### 8-1. バッジサイズ

⚠️ **40歳以上ユーザー向け最適化**: すべてのバッジで`text-base` (16px) を使用すること。以下の表は既存実装の参考用です。

| バッジタイプ | サイズ | Tailwindクラス | 角丸 | 実装例 | 推奨サイズ |
|------------|--------|----------------|------|--------|----------|
| **ステータスバッジ** | Small | `text-xs px-2.5 py-0.5` | `rounded-full` | ジョブカードのステータス | ⚠️ `text-base px-2.5 py-1` に変更推奨 |
| **入庫区分バッジ** | Medium | `text-xs px-2.5 py-1` | `rounded-full` | 入庫区分表示 | ⚠️ `text-base px-2.5 py-1` に変更推奨 |
| **件数バッジ** | Medium | `text-xs px-2.5 py-1` | `rounded-full` | サマリーカードの件数 | ⚠️ `text-base px-2.5 py-1` に変更推奨 |
| **詳細情報バッジ** | Medium | `text-xs px-2.5 py-1` | `rounded-md` | お客様入力情報、作業指示 | ⚠️ `text-base px-2.5 py-1` に変更推奨 |

### 8-2. バッジスタイル

**ステータスバッジ（推奨）**:
```typescript
<Badge
  variant="outline"
  className="text-base font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border-blue-300"
>
  入庫待ち
</Badge>
```

**ステータスバッジ（既存実装 - 非推奨）**:
```typescript
// ⚠️ 40歳以上ユーザー向け最適化のため非推奨
<Badge
  variant="outline"
  className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border-blue-300"
>
  入庫待ち
</Badge>
```

**入庫区分バッジ（推奨）**:
```typescript
<Badge
  variant="outline"
  className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
>
  <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-600" />
  <span className="whitespace-nowrap">車検</span>
</Badge>
```

**入庫区分バッジ（既存実装 - 非推奨）**:
```typescript
// ⚠️ 40歳以上ユーザー向け最適化のため非推奨
<Badge
  variant="outline"
  className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
>
  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
  <span className="whitespace-nowrap">車検</span>
</Badge>
```

**件数バッジ（推奨）**:
```typescript
<Badge
  variant="outline"
  className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full"
>
  12件
</Badge>
```

**詳細情報バッジ（推奨）**:
```typescript
<Badge
  className="bg-blue-50 text-blue-900 border-blue-400 text-base font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5"
>
  <MessageSquare className="h-4 w-4 text-white shrink-0" />
  <span>お客様入力情報</span>
</Badge>
```

### 8-3. バッジサイズの統一ルール

**40歳以上ユーザー向けに最適化**: テキストサイズは16px以上、パディングは適切に確保

```typescript
// バッジサイズの統一ルール
export const badgeSizes = {
  // 標準バッジ（推奨）
  default: "px-2.5 py-1 text-base",  // 標準サイズ、テキスト16px
  
  // 小さなバッジ（カウント表示など）
  sm: "px-2 py-0.5 text-base",        // 小さなバッジ、テキスト16px
  
  // 大きなバッジ（重要情報）
  lg: "px-3 py-1.5 text-base",        // 大きなバッジ、テキスト16px
  
  // ❌ text-xs (12px), text-sm (14px) は使用禁止（視認性が低すぎる）
};
```

### 8-4. バッジバリアントの統一ルール

```typescript
// バッジバリアントの統一ルール
export const badgeVariants = {
  // プライマリ（デフォルト）
  default: "bg-primary text-primary-foreground",
  
  // セカンダリ（補助情報）
  secondary: "bg-secondary text-secondary-foreground",
  
  // 破壊的（エラー・警告）
  destructive: "bg-destructive text-white",
  
  // アウトライン（軽量な強調）
  outline: "border text-foreground",
  
  // ステータスカラー（カスタム）
  success: "bg-green-50 text-green-900 border-green-300",
  warning: "bg-amber-50 text-amber-900 border-amber-300",
  error: "bg-red-50 text-red-900 border-red-300",
  info: "bg-blue-50 text-blue-900 border-blue-300",
  
  // ニュートラル（軽量な情報）
  neutral: "bg-slate-100 text-slate-700 border-slate-300",
};
```

### 8-5. バッジの色の統一ルール（コントラスト比4.5:1以上を確保）

```typescript
// バッジの色の統一ルール（コントラスト比4.5:1以上を確保）
export const badgeColorRules = {
  // 背景色とテキスト色の組み合わせ
  success: {
    bg: "bg-green-50",
    text: "text-green-900",      // text-green-800→text-green-900（コントラスト向上）
    border: "border-green-300",  // border-green-200→border-green-300（視認性向上）
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-900",      // text-amber-800→text-amber-900（コントラスト向上）
    border: "border-amber-300",  // border-amber-200→border-amber-300（視認性向上）
  },
  error: {
    bg: "bg-red-50",
    text: "text-red-900",        // text-red-800→text-red-900（コントラスト向上）
    border: "border-red-300",    // border-red-200→border-red-300（視認性向上）
  },
  info: {
    bg: "bg-blue-50",
    text: "text-blue-900",       // text-blue-800→text-blue-900（コントラスト向上）
    border: "border-blue-300",  // border-blue-200→border-blue-300（視認性向上）
  },
  neutral: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
  },
};
```

### 8-6. 見積ページバッジ色（優先度別）

| 優先度 | 背景色 | テキスト色 | 意味 |
|--------|--------|-----------|------|
| **必須整備** | `bg-red-600` | `text-white` | 必須・緊急 |
| **推奨整備** | `bg-blue-600` | `text-white` | 推奨・情報 |
| **任意整備** | `bg-slate-500` | `text-white` | 任意・選択可能 |

**色の意味:**
- **赤（必須整備）**: 「必須」「重要」「緊急」を表現
- **青（推奨整備）**: 「推奨」「情報」「提案」を表現
- **グレー（任意整備）**: 「任意」「選択可能」「低優先度」を表現

### 8-7. バッジ使用ルール

- **shrink-0**: すべてのバッジに`shrink-0`を設定（縮小防止）
- **whitespace-nowrap**: バッジ内テキストに`whitespace-nowrap`を設定（改行防止）
- **アイコン**: バッジ内アイコンは`h-4 w-4`（16px、`h-3.5 w-3.5`は14pxで使用可能）、`shrink-0`を設定
- **テキストサイズ**: `text-base` (16px) 以上を使用（`text-xs` (12px) や `text-sm` (14px) は禁止）

---

## 9. カード

### 9-1. カード基本スタイル

**ジョブカード**:
```typescript
<Card className="transition-all shadow-md hover:shadow-lg border-slate-200">
  <CardHeader className="pb-3">
    {/* 第1階層 */}
  </CardHeader>
  <CardContent className="pt-0">
    {/* 第2階層以降 */}
  </CardContent>
</Card>
```

**サマリーカード**:
```typescript
<Card className="h-full flex flex-col">
  <CardHeader className="pb-3">
    <CardTitle className="flex items-center justify-between text-lg">
      {/* タイトル + アイコン + 件数バッジ */}
    </CardTitle>
  </CardHeader>
  <CardContent className="flex-1 flex flex-col">
    <div className="space-y-2 flex-1">
      {/* ステータス項目 */}
    </div>
  </CardContent>
</Card>
```

### 9-2. カード内レイアウト

- **CardHeader**: `pb-3`（下パディング12px）
- **CardContent**: `pt-0`（ジョブカードの場合）、`flex-1 flex flex-col`（サマリーカードの場合）
- **要素間**: `space-y-1.5`（第2階層）、`space-y-2`（サマリーカード内）

### 9-3. サマリーカードレイアウト（ベストプラクティス）

**推奨実装: Flexbox横スクロール + `items-start`**

```typescript
<div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
  <div className="flex gap-4 items-start">
    {/* 各カード */}
    <Card className="border-slate-200 shadow-md min-w-[280px] flex-shrink-0">
      {/* カード内容 */}
    </Card>
  </div>
</div>
```

**重要なポイント:**
1. **`items-start`**: 各カードが独立した高さを持つ（展開時に他のカードに影響しない）
2. **`flex-shrink-0`**: カードが縮小しないようにする
3. **`min-w-[280px]`**: カードの最小幅を固定
4. **`overflow-x-auto`**: 横スクロール可能にする

**メリット:**
- ✅ 各カードが完全に独立して動作
- ✅ 展開時に他のカードに影響しない
- ✅ 実装が簡単
- ✅ パフォーマンスが良い
- ✅ ブラウザサポートが完璧
- ✅ 40歳以上ユーザーにとって分かりやすい

### 9-4. 本日入出庫予定カードの色設定

**入庫アイコン（ArrowDownCircle）:**
- 通常時: `text-blue-900`
- 遅延時: `text-red-900`（予定時刻を過ぎている）

**出庫アイコン（ArrowUpCircle）:**
- 通常時: `text-green-900`
- 遅延時: `text-amber-900`（予定時刻を過ぎている）

**入庫ラベル（Badge）:**
- 通常時: `bg-blue-100 text-blue-900 border-blue-300`
- 遅延時: `bg-red-100 text-red-900 border-red-300`

**出庫ラベル（Badge）:**
- 通常時: `bg-green-100 text-green-900 border-green-300`
- 遅延時: `bg-amber-100 text-amber-900 border-amber-300`

**色の意味:**
- **Blue（青）**: 入庫予定（通常時）- 進行中・待機中の状態を表現
- **Green（緑）**: 出庫予定（通常時）- 完了・成功を表現
- **Red（赤）**: 入庫遅延（警告）- エラー・緊急を表現
- **Amber（琥珀色）**: 出庫遅延（警告）- 注意・警告を表現

### 9-5. コンパクトジョブヘッダー（下層ページ用）

**情報階層:**
- **第1階層**: 顧客名 + 重要な顧客フラグ + お客様共有フォルダ + ステータスバッジ + 戻るボタン
- **第2階層**: 車両情報、入庫区分、入庫日時（横並び、モバイルでは折り返し）
- **第3階層**: 現在の作業、担当整備士、代車、タグ（該当する場合のみ）

**アイコンサイズ:**
- 第1階層（User）: `h-4 w-4` (16px)
- 第1階層（Star/Folder）: `h-5 w-5` (20px)
- 第2階層: `h-4 w-4` (16px)
- 第3階層: `h-3.5 w-3.5` (14px)

**文字サイズ:**
- 第1階層: `text-sm sm:text-base` (14px/16px) - モバイルでは`text-sm`、PCでは`text-base`を使用
- 第2階層: `text-sm` (14px) - ⚠️ **推奨: 可能な限り`text-base` (16px) を使用**
- 第3階層: `text-sm` (14px) - ⚠️ **推奨: 可能な限り`text-base` (16px) を使用**

**スペーシング:**
- 階層間: `space-y-1.5` (6px)
- 要素間（第2階層）: `gap-1.5 sm:gap-2` (6px/8px)
- 要素間（第3階層）: `gap-1.5 sm:gap-2` (6px/8px)

---

## 10. カラーシステム

### 10-1. ステータス色（作業進行状況）

詳細は[1-4. ステータスカラー](#1-4-ステータスカラー作業進行状況用)を参照。

**ステータス色の統一ルール（セマンティックカラーシステム）:**

| 色 | 意味 | 該当するステータス |
|-----|------|----------------|
| **Blue (青)** | 進行中・待機中 | 入庫待ち、入庫済み |
| **Orange (オレンジ)** | 注意が必要・作業待ち | 診断待ち、作業待ち、部品発注待ち |
| **Indigo (インディゴ)** | 情報・管理業務 | 見積作成待ち |
| **Amber (アンバー)** | 承認待ち・保留（外部依存） | お客様承認待ち、部品調達待ち |
| **Green (緑)** | 完了・成功 | 引渡待ち |
| **Slate (グレー)** | 完了・非アクティブ | 出庫済み |

**統一されたステータスバッジスタイル関数:**
```typescript
function getStatusBadgeStyle(status: string): string {
  const statusColorConfig: Record<string, string> = {
    "入庫待ち": "bg-blue-50 text-blue-700 border-blue-300",
    "入庫済み": "bg-blue-50 text-blue-700 border-blue-300",
    "見積作成待ち": "bg-indigo-50 text-indigo-600 border-indigo-300",
    "見積提示済み": "bg-amber-50 text-amber-700 border-amber-300",
    "作業待ち": "bg-orange-50 text-orange-700 border-orange-300",
    "出庫待ち": "bg-green-50 text-green-700 border-green-300",
    "出庫済み": "bg-slate-50 text-slate-700 border-slate-300",
    "部品調達待ち": "bg-amber-50 text-amber-700 border-amber-300",
    "部品発注待ち": "bg-orange-50 text-orange-700 border-orange-300",
  };
  
  return statusColorConfig[status] || "bg-slate-100 text-slate-700 border-slate-300";
}
```

### 10-2. カテゴリー色（入庫区分）

詳細は[1-3. カテゴリーカラー](#1-3-カテゴリーカラー入庫区分用)を参照。

**カテゴリー色システム（作業の性質に応じた分類）:**

| カテゴリー | 色 | 意味 | 該当する入庫区分 |
|-----------|-----|------|----------------|
| **点検・検査系** | Cyan (青緑) | 定期点検や検査作業 | 車検、12ヵ月点検 |
| **メンテナンス系** | Emerald (緑) | 日常的なメンテナンス作業 | エンジンオイル交換、タイヤ交換・ローテーション |
| **修理・整備系** | Orange (オレンジ) | 故障や不具合の修理 | 修理・整備 |
| **診断・トラブル系** | Rose (ローズ) | 故障診断やトラブル調査 | 故障診断 |
| **カスタマイズ・特殊作業系** | Violet (紫) | カスタマイズや特殊な作業 | チューニング、パーツ取付、コーティング、レストア、板金・塗装 |
| **その他** | Slate (グレー) | 上記に該当しない作業 | その他、その他のメンテナンス |

**注意事項:**
- **ステータス色とは別の色体系**: ステータス色（作業の進行状況）とカテゴリー色（作業の性質）は別物
- **同じ色が複数の入庫区分で使われる理由**: 同じカテゴリーに属する入庫区分は同じ色を使用（視覚的なグループ化）
- **色の意味を明確にする**: コメントで色の意味を明記（既に実装済み）

### 10-3. アクションボタン色（ステージ別）

詳細は[6-3. アクションボタン](#6-3-アクションボタンステージ別)を参照。

**アクションボタンの統一ルール:**
- **アイコン色**: すべてのアクションボタンのアイコンは`text-white`（白）で統一
- **ボタンの背景色**: ステージに応じて異なる色を使用（背景色でステージを視覚的に区別）

**ステージ別のアクション詳細:**

| ステージ | ラベル | アイコン | アイコン色 | ボタン背景色 | ホバー色 | ボタン高さ | 優先度 |
|---------|--------|---------|-----------|------------|---------|-----------|--------|
| 入庫待ち | 受付を開始 | Key | `text-white` | `bg-slate-600` | `hover:bg-slate-700` | `h-12` | high |
| 入庫済み | 診断を開始 | Activity | `text-white` | `bg-blue-600` | `hover:bg-blue-700` | `h-12` | high |
| 見積作成待ち | 見積を開始 | FileText | `text-white` | `bg-orange-600` | `hover:bg-orange-700` | `h-12` | high |
| 作業待ち | 作業を開始 | Wrench | `text-white` | `bg-emerald-600` | `hover:bg-emerald-700` | `h-12` | high |
| 出庫待ち | 引渡しを開始 | Car | `text-white` | `bg-violet-600` | `hover:bg-violet-700` | `h-12` ⚠️ **推奨**（既存実装: `h-10`） | medium |

**注意事項:**
- **見積作成待ちのアイコン**: TOPページでは`FileText`、見積ページでは`Calculator`が使用される（機能の意味が異なるため）

### 10-4. カラーユニバーサルデザイン

診断結果の状態表示は、**色だけに依存せず、以下の4つの要素で表現**します：

1. **色（Color）**: 背景色とテキスト色
2. **形状（Shape）**: ボタンの形状（円形、四角形、三角形など）
3. **アイコン（Icon）**: 視覚的なアイコン
4. **テキスト（Text）**: ラベルテキスト

| 状態 | 色 | 形状 | アイコン | テキスト | 境界線スタイル |
| --- | --- | --- | --- | --- | --- |
| OK（正常） | 緑 | 円形（circle） | CheckCircle2 | "OK" | 実線（border-2） |
| 注意 | 黄 | 三角形（triangle） | AlertCircle | "注意" | 破線（border-dashed） |
| 要交換 | 赤 | 四角形（square） | XCircle | "要交換" | 二重線（border-double） |
| 調整 | 青 | 六角形（hexagon） | Wrench | "調整" | 実線（border-2） |
| 清掃 | シアン | ダイヤモンド形（diamond） | Brush | "清掃" | 実線（border-2） |
| 省略 | グレー | 円形（circle） | SkipForward | "省略" | 破線（border-dashed） |
| 該当なし | グレー | 四角形（square） | Minus | "該当なし" | 実線（border） |

---

## 11. レスポンシブデザイン

### 11-1. ブレークポイント

| ブレークポイント | サイズ | 用途 |
|----------------|--------|------|
| **sm** | 640px以上 | タブレット・PC |
| **md** | 768px以上 | タブレット（横向き）・PC |
| **lg** | 1024px以上 | PC |
| **xl** | 1280px以上 | 大画面PC |

### 11-2. モバイルファースト設計

**実装例**:
```typescript
// モバイル: 1列、デスクトップ: 2列
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Card>...</Card>
  <Card>...</Card>
</div>

// モバイル: 非表示、デスクトップ: 表示
<div className="hidden md:block">
  <Sidebar />
</div>

// レスポンシブなgap
<div className="flex gap-2 sm:gap-3">
  ...
</div>
```

### 11-3. タッチターゲットサイズ

**40歳以上ユーザー向け**:
- **最小サイズ**: 44x44px（iOS/Android推奨）
- **推奨サイズ**: 48x48px（`h-12`）
- **ボタン**: デフォルト `h-12` (48px)
- **入力フィールド**: `h-12` (48px)
- **アイコンボタン**: `size-12` (48px × 48px)

### 11-4. モバイル対応ルール

**テキスト折り返し**:
- 長いテキストは`break-words`を使用（`truncate`は使用しない、ただし顧客名など一部では`truncate`を使用）
- バッジ内テキストは`whitespace-nowrap`で改行防止
- バッジ全体に`shrink-0`を設定
- カード内の要素には`min-w-0`を設定してフレックスアイテムの縮小を許可

**スペーシング調整**:
- 第2階層要素: モバイル `gap-2`、PC `sm:gap-3`
- 補助情報（タグ、代車、整備士）: モバイル `gap-1.5`、PC `sm:gap-2`
- セクション間: `mb-6`（モバイル・PC共通）

**表示/非表示**:
- モバイルで非表示: `hidden sm:block`または`hidden sm:flex`（例: PC用プライマリアクションボタン）
- PCで非表示: `sm:hidden`（例: モバイル用プライマリアクションボタン）

**レイアウト**:
- フレックスボックス: `flex-wrap`で折り返し対応（例: 第2階層要素、第3階層要素）
- グリッド: `grid-cols-1 md:grid-cols-2`（例: 長期プロジェクトセクション）
- サマリーカード: 横スクロールカルーセル（モバイル: `w-[calc(100vw-3rem)]`、PC: `w-[320px]`）

### 11-5. スマートフォン対応の詳細

**画面サイズ別の対応:**

| 画面サイズ | 幅 | 対応内容 |
|-----------|-----|---------|
| **スマートフォン（小）** | 〜375px | 最小幅を考慮したレイアウト、テキストサイズ16px以上 |
| **スマートフォン（標準）** | 375px〜640px | 標準的なモバイルレイアウト |
| **タブレット（縦）** | 640px〜768px | 2列レイアウトの開始 |
| **タブレット（横）・PC** | 768px以上 | フルレイアウト、サイドバー表示可能 |

**タッチ操作の最適化:**
- **タッチターゲット**: 最小48px × 48px（`h-12`）
- **タッチ間隔**: 要素間は最低8px（`gap-2`）
- **スワイプ操作**: 横スクロール可能な要素（サマリーカード、画像ギャラリー）
- **長押し**: コンテキストメニュー（必要に応じて）

**パフォーマンス最適化:**
- **画像の遅延読み込み**: `next/image`の`loading="lazy"`を使用
- **スクロール最適化**: `overflow-x-auto`で横スクロール、`overflow-y-auto`で縦スクロール
- **アニメーションの軽量化**: `transform`と`opacity`のみを使用（GPU加速）

### 11-6. コンテナの最大幅（Max-Width）の選択基準

**デスクトップでのページコンテナの最大幅設定:**

| 横幅クラス | 実サイズ | 文字数（日本語、16px想定） | 用途 | 適用ページ例 |
|-----------|---------|---------------------------|------|-------------|
| `max-w-4xl` | 896px | 約56文字 | **ワークフローページ（標準・推奨）** | TOPページ、診断ページ、作業ページ、引渡しページ、顧客承認ページ、顧客レポートページ、履歴ページ、代車管理ページ |
| `max-w-7xl` | 1280px | 約80文字 | 大きなデータ表示ページ（テーブル、分析） | 見積作成ページ、業務分析ページ、お知らせ管理ページ |

**選択基準（ワークフロー型UX最適化）:**

1. **ワークフローページ（推奨）** → `max-w-4xl` (896px)
   - **一貫性を優先**: すべてのワークフローページで統一的な横幅を使用
   - カード一覧表示、フォーム入力、詳細情報表示など、すべてのワークフローページに適用
   - 画面遷移時の視覚的な不連続性を最小限に抑える
   - 可読性と情報量のバランスが良い（約56文字）

2. **大きなデータ表示ページ** → `max-w-7xl` (1280px)
   - テーブル形式のデータ
   - 複数のグラフやデータを並べて表示
   - 横スクロールを避けたい
   - **例外**: 管理ページ（見積作成、業務分析など）のみ適用

**実装パターン:**

```typescript
// 標準的なページ（max-w-4xl）
<main className="max-w-4xl mx-auto px-4 py-6">
  {/* コンテンツ */}
</main>

// AppHeaderとの統一
<AppHeader maxWidthClassName="max-w-4xl" />
<main className="max-w-4xl mx-auto px-4 py-6">
  {/* コンテンツ */}
</main>

// ワークフローページ（max-w-4xl - 推奨）
<AppHeader maxWidthClassName="max-w-4xl" />
<main className="max-w-4xl mx-auto px-4 py-6">
  {/* フォームや詳細情報 */}
</main>

// 大きなデータ表示ページ（max-w-7xl）
<main className="max-w-7xl mx-auto px-4 py-6">
  {/* テーブルやグラフ */}
</main>
```

**注意事項:**
- `AppHeader`の`maxWidthClassName`プロパティと`main`要素の`max-w-*`クラスは必ず統一する
- モバイル（< 640px）では`max-w-*`は効果を持たず、`w-full px-4`が適用される
- パディングは`px-4`（16px）を標準とする
- **ワークフロー型UX**: すべてのワークフローページで`max-w-4xl`を使用し、一貫性を保つ（詳細は`docs/WORKFLOW_UX_WIDTH_PROPOSAL.md`を参照）

**実装例:**
```typescript
// レスポンシブなレイアウト
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
</div>

// タッチ操作に最適化されたボタン
<Button className="h-12 min-w-[48px] touch-manipulation">
  タップ
</Button>

// 横スクロール可能なリスト
<div className="overflow-x-auto pb-2 scrollbar-hide">
  <div className="flex gap-4">
    <Card className="min-w-[280px]">...</Card>
  </div>
</div>
```

### 11-7. レスポンシブ対応の詳細ガイドライン

**ブレークポイントの使用方針:**

| 画面サイズ | ブレークポイント | 対応内容 | 実装例 |
|-----------|----------------|---------|--------|
| **モバイル** | < 640px | 全幅を使用（`w-full px-4`） | `w-full px-4` |
| **タブレット** | 640px - 1024px | 適切な最大幅を設定（`max-w-4xl mx-auto px-4`） | `max-w-4xl mx-auto px-4` |
| **デスクトップ** | > 1024px | 最大幅を設定し、中央揃え（`max-w-4xl mx-auto px-4`） | `max-w-4xl mx-auto px-4` |

**フォントサイズのレスポンシブ対応:**

- **モバイル**: `text-base` (16px) を基本として使用
- **デスクトップ**: モバイルと同じサイズを使用（一貫性のため）
- **例外**: 見出しなど、画面サイズに応じて調整が必要な場合は `text-lg sm:text-xl` などを使用

**実装例:**
```typescript
// 見出しのレスポンシブ対応
<h1 className="text-xl sm:text-2xl font-bold text-slate-900">
  ページタイトル
</h1>

// 本文（モバイル・デスクトップ共通）
<p className="text-base text-slate-700">
  本文テキスト
</p>
```

**スペーシングのレスポンシブ対応:**

| 要素 | モバイル | デスクトップ | 実装例 |
|------|---------|------------|--------|
| **要素間のgap** | `gap-2` (8px) | `sm:gap-3` (12px) | `gap-2 sm:gap-3` |
| **セクション間** | `space-y-4` (16px) | `sm:space-y-6` (24px) | `space-y-4 sm:space-y-6` |
| **パディング** | `px-4` (16px) | `sm:px-6` (24px) | `px-4 sm:px-6` |

**実装例:**
```typescript
// レスポンシブなgap
<div className="flex gap-2 sm:gap-3">
  <Badge>タグ1</Badge>
  <Badge>タグ2</Badge>
</div>

// レスポンシブなセクション間スペーシング
<div className="space-y-4 sm:space-y-6">
  <Card>...</Card>
  <Card>...</Card>
</div>

// レスポンシブなパディング
<main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
  {/* コンテンツ */}
</main>
```

**コンテナ幅の選択基準（詳細）:**

新しいページを追加する際は、以下の判断基準に基づいて適切な横幅を選択します：

1. **標準的なリスト表示ページ** → `max-w-4xl` (896px)
   - カード一覧表示
   - 情報の閲覧が中心
   - 複数の情報を比較する必要がある

2. **フォーカスが必要なページ** → `max-w-2xl` (672px)
   - フォーム入力
   - 詳細情報の表示
   - 集中して作業する必要がある

3. **大きなデータ表示ページ** → `max-w-7xl` (1280px)
   - テーブル形式のデータ
   - 複数のグラフやデータを並べて表示
   - 横スクロールを避けたい

**注意事項:**
- `max-w-lg` (512px) はデスクトップでは狭すぎるため、使用を避ける
- `max-w-5xl` (1024px) は統一性の観点から、可能な限り`max-w-4xl`に統一する
- モバイル（< 640px）では`max-w-*`は効果を持たず、`w-full px-4`が適用される

---

## 12. メッセージボックス（Alert/Toast/Dialog）

### 12-1. Alert（インライン通知）

**統一ルール:**
```typescript
// Alertコンポーネントの統一ルール
<Alert variant="default" className="p-4">
  <AlertCircle className="h-5 w-5" />
  <AlertTitle className="text-base font-semibold">
    タイトル
  </AlertTitle>
  <AlertDescription className="text-base">
    メッセージ内容
  </AlertDescription>
</Alert>
```

**ステータス別のAlert:**

| ステータス | 背景色 | テキスト色 | ボーダー色 | アイコン色 |
|-----------|--------|-----------|-----------|-----------|
| **成功** | `bg-green-50` | `text-green-900` | `border-green-300` | `text-green-900` |
| **警告** | `bg-amber-50` | `text-amber-900` | `border-amber-300` | `text-amber-900` |
| **エラー** | `bg-red-50` | `text-red-900` | `border-red-300` | `text-red-900` |
| **情報** | `bg-blue-50` | `text-blue-900` | `border-blue-300` | `text-blue-900` |

**実装例:**
```typescript
// 警告
<Alert className="bg-amber-50 text-amber-900 border-amber-300 p-4">
  <AlertTriangle className="h-5 w-5 text-amber-900" />
  <AlertTitle className="text-base font-semibold text-amber-900">
    警告
  </AlertTitle>
  <AlertDescription className="text-base text-amber-900">
    注意が必要です
  </AlertDescription>
</Alert>
```

### 12-2. Toast通知（一時的な通知）

**統一ルール（Sonnerを使用）:**
```typescript
import { toast } from "sonner";

// 成功
toast.success("処理が完了しました", {
  description: "詳細情報があればここに表示",
});

// 警告
toast.warning("注意が必要です", {
  description: "詳細情報があればここに表示",
});

// エラー
toast.error("エラーが発生しました", {
  description: "詳細情報があればここに表示",
});

// 情報
toast.info("お知らせがあります", {
  description: "詳細情報があればここに表示",
});

// ローディング
toast.loading("処理中...", {
  description: "詳細情報があればここに表示",
});
```

### 12-3. メッセージボックスのタイポグラフィ統一ルール

```typescript
// メッセージボックスのタイポグラフィ統一ルール
export const messageBoxTypography = {
  // タイトル
  title: "text-base font-semibold",  // 16px、太字
  
  // 説明文
  description: "text-base",          // 16px、通常
  
  // ❌ text-xs (12px), text-sm (14px) は使用禁止（視認性が低すぎる）
};
```

### 12-4. メッセージボックスの色の統一ルール（コントラスト比4.5:1以上を確保）

```typescript
// メッセージボックスの色の統一ルール（コントラスト比4.5:1以上を確保）
export const messageBoxColorRules = {
  success: {
    bg: "bg-green-50",
    text: "text-green-900",      // text-green-800→text-green-900（コントラスト向上）
    border: "border-green-300",  // border-green-200→border-green-300（視認性向上）
    icon: "text-green-900",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-900",      // text-amber-800→text-amber-900（コントラスト向上）
    border: "border-amber-300",  // border-amber-200→border-amber-300（視認性向上）
    icon: "text-amber-900",
  },
  error: {
    bg: "bg-red-50",
    text: "text-red-900",        // text-red-800→text-red-900（コントラスト向上）
    border: "border-red-300",    // border-red-200→border-red-300（視認性向上）
    icon: "text-red-900",
  },
  info: {
    bg: "bg-blue-50",
    text: "text-blue-900",       // text-blue-800→text-blue-900（コントラスト向上）
    border: "border-blue-300",   // border-blue-200→border-blue-300（視認性向上）
    icon: "text-blue-900",
  },
};
```

## 13. アクセシビリティ

### 13-1. WCAG 2.1 AA準拠

**コントラスト比**:
- 本文テキスト: 4.5:1以上
- UIコンポーネント: 3:1以上

**キーボード操作**:
- すべての機能をキーボードで操作可能
- フォーカスインジケーターを明確に表示（`focus-visible:ring-[3px]`）
- Tab順序が論理的

**スクリーンリーダー**:
- 適切なARIAラベルを設定
- セマンティックHTMLを使用
- 画像にalt属性を設定

### 12-2. 実装例

**ARIAラベル**:
```typescript
<button
  aria-label="診断を開始"
  className="bg-slate-900 text-white"
>
  <Activity className="h-5 w-5" aria-hidden="true" />
  診断を開始
</button>
```

**フォーカス管理**:
```typescript
<Input
  className="focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
  aria-required="true"
  aria-invalid={!!errors.mileage}
/>
```

### 13-2. フォーカス状態の詳細定義

**標準的なフォーカスリング:**
- **リング幅**: 2px（`ring-2`）
- **リング色**: `ring-blue-600`（情報表示）または`ring-slate-900`（標準）
- **オフセット**: 2px（`ring-offset-2`）
- **Tailwindクラス**: `focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2`

**ボタンのフォーカス状態:**
```typescript
<Button className="focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
  ボタン
</Button>
```

**入力フィールドのフォーカス状態:**
```typescript
<Input
  className="focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600"
  aria-required="true"
/>
```

**リンクのフォーカス状態:**
```typescript
<a
  href="/page"
  className="focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
>
  リンクテキスト
</a>
```

**キーボードナビゲーション:**
- すべてのインタラクティブ要素はキーボードでアクセス可能であること
- Tab順序が論理的であること（視覚的な順序と一致）
- モーダルやダイアログはフォーカストラップを実装すること（`Dialog`コンポーネントが自動的に実装）

**エラー状態**:
```typescript
<Input
  aria-invalid="true"
  aria-describedby="error-message"
  className="aria-invalid:border-red-600 aria-invalid:ring-red-600/20"
/>
<span id="error-message" className="text-base text-red-600" role="alert">
  {error}
</span>
```

### 13-3. ARIA属性の使用ガイドライン

**装飾的なアイコン:**
- 装飾的なアイコンには `aria-hidden="true"` を設定
- スクリーンリーダーで読み上げる必要がないアイコンに使用

**実装例:**
```typescript
// 装飾的なアイコン
<Activity className="h-5 w-5 text-slate-600" aria-hidden="true" />
```

**インタラクティブな要素:**
- インタラクティブな要素には適切な `aria-label` を設定
- テキストラベルがない場合に使用

**実装例:**
```typescript
// アイコンボタン（テキストラベルなし）
<Button
  variant="ghost"
  size="icon"
  aria-label="削除"
  onClick={handleDelete}
>
  <Trash2 className="h-5 w-5" />
</Button>

// クリック可能なアイコン
<Folder
  className="h-5 w-5 text-slate-600 hover:text-blue-600 cursor-pointer"
  aria-label="お客様共有フォルダを開く"
  onClick={handleOpenFolder}
/>
```

**フォーム要素:**
- フォーム要素には `aria-required` や `aria-invalid` を設定
- エラーメッセージには `aria-describedby` で関連付け

**実装例:**
```typescript
// 必須フィールド
<Input
  id="customer-name"
  type="text"
  aria-required="true"
  aria-invalid={!!errors.customerName}
  aria-describedby={errors.customerName ? "customer-name-error" : undefined}
/>
{errors.customerName && (
  <span id="customer-name-error" className="text-base text-red-600" role="alert">
    {errors.customerName}
  </span>
)}
```

**ランドマーク:**
- セマンティックHTMLを使用（`<header>`, `<main>`, `<nav>`, `<footer>`など）
- 必要に応じて `role` 属性を使用

**実装例:**
```typescript
// セマンティックHTML
<header>
  <AppHeader />
</header>
<main>
  {/* メインコンテンツ */}
</main>
<footer>
  {/* フッター */}
</footer>
```

**モーダル・ダイアログ:**
- モーダルやダイアログには適切な `aria-labelledby` と `aria-describedby` を設定
- `Dialog`コンポーネントが自動的に実装

**実装例:**
```typescript
<Dialog>
  <DialogContent aria-labelledby="dialog-title" aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle id="dialog-title">確認</DialogTitle>
      <DialogDescription id="dialog-description">
        この操作を実行しますか？
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### 13-4. カラーユニバーサルデザイン

- **色だけに依存しない**: 形状、アイコン、テキストを組み合わせる
- **コントラスト比の確保**: テキストと背景のコントラスト比は4.5:1以上
- **一貫性の維持**: 同じ状態は常に同じ形状・アイコン・色を使用

---

## 14. ヘッダー・ナビゲーション

### 14-1. モバイルヘッダーのスクロール動作

**推奨実装: スクロール方向ベースの展開/縮小**

**動作:**
- **下スクロール時**: ヘッダーを最小化（戻るボタン + ページタイトル + ステータスバッジのみ）
- **上スクロール時**: ヘッダーを展開（顧客情報、車両情報など詳細を表示）
- **スクロール停止時**: 3秒後に自動的に最小化（オプション）

**メリット:**
- ✅ コンテンツエリアを最大化
- ✅ 必要な時に情報を確認可能
- ✅ 直感的な操作（上スクロール = 情報を確認したい）
- ✅ 業界標準のパターン

**実装例:**
```typescript
// スクロール方向を検知
const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(null);
const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

// 下スクロール時: 最小化
// 上スクロール時: 展開
// トップ付近: 常に展開
```

**スクロール閾値:**
- **下スクロール時**: 15px以上で縮小
- **上スクロール時**: 30px以上で展開（より安定した動作のため）

## 15. アニメーション

### 15-1. トランジション

| 用途 | トランジション | Tailwindクラス | 説明 |
|------|---------------|----------------|------|
| **標準** | すべてのプロパティ、200ms | `transition-all duration-200` | カード、ボタンなど一般的な要素 |
| **アニメーション** | すべてのプロパティ、300ms | `transition-all duration-300` | より滑らかなアニメーションが必要な要素 |
| **色のみ** | 色のみ、200ms | `transition-colors duration-200` | 色の変更のみ（パフォーマンス最適化） |
| **スケール** | スケールのみ、200ms | `transition-transform duration-200` | スケール変更のみ |

### 15-2. ホバーエフェクト

| 要素 | ホバーエフェクト | Tailwindクラス | 実装例 |
|------|----------------|----------------|--------|
| **カード** | シャドウ拡大 | `hover:shadow-lg` | ジョブカード |
| **クリック可能な要素** | スケール拡大 | `hover:scale-[1.02]` | サマリーカードのステータス項目 |
| **アクティブ時** | スケール縮小 | `active:scale-[0.98]` | クリック時のフィードバック |
| **リンク** | 色変更 | `hover:text-blue-600` | 車両情報、連絡先情報 |
| **ボタン** | 背景色変更 | `hover:bg-slate-800` | プライマリボタン |
| **バッジ（詳細情報）** | 背景色変更 | `hover:bg-blue-100` (お客様入力情報), `hover:bg-amber-100` (作業指示) | 詳細情報バッジ |
| **アイコン** | 色変更 | `hover:text-blue-600` | クリック可能なアイコン |
| **入力フィールド** | ボーダー強調 | `hover:border-slate-400` | Input、Textarea |
| **タブ** | 背景色変更 | `hover:bg-slate-100` | タブ要素 |

### 15-3. フォーカス状態

| 要素 | フォーカスエフェクト | Tailwindクラス | 実装例 |
|------|---------------------|----------------|--------|
| **入力フィールド** | リング表示 | `focus-visible:ring-[3px] focus-visible:ring-slate-900` | Input、Textarea |
| **ボタン** | リング表示 | `focus-visible:ring-2 focus-visible:ring-offset-2` | すべてのボタン |
| **リンク** | アンダーライン | `focus-visible:underline` | テキストリンク |

### 15-4. 無効状態

| 要素 | 無効状態のスタイル | Tailwindクラス | 実装例 |
|------|-------------------|----------------|--------|
| **ボタン** | 透明度・カーソル変更 | `disabled:opacity-50 disabled:cursor-not-allowed` | すべてのボタン |
| **入力フィールド** | 背景色・カーソル変更 | `disabled:bg-slate-100 disabled:cursor-not-allowed` | Input、Textarea |
| **テキスト** | 色変更 | `text-slate-400` | 無効なテキスト |
| **アイコン** | 色変更 | `text-slate-400` | 無効なアイコン |

### 15-5. 実装例

```typescript
// ボタン（ホバー・アクティブ・無効状態）
<Button 
  className="transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
  disabled={isLoading}
>
  クリック
</Button>

// カード（ホバーエフェクト）
<Card className="transition-all hover:shadow-lg">
  ...
</Card>

// リンク（ホバー・フォーカス）
<a className="transition-colors hover:text-blue-600 focus-visible:underline">
  リンクテキスト
</a>

// 入力フィールド（フォーカス・無効状態）
<Input 
  className="transition-all focus-visible:ring-[3px] focus-visible:ring-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed"
  disabled={isDisabled}
/>
```

### 15-6. アニメーションの詳細ルール

**トランジションの適用原則:**
- **すべてのインタラクティブ要素**: `transition-all` または `transition-colors` を適用
- **ホバー可能な要素**: 必ずホバー状態を定義
- **クリック可能な要素**: `active:` 状態を定義（視覚的フィードバック）
- **フォーカス可能な要素**: `focus-visible:` 状態を定義（アクセシビリティ）

**アニメーションの速度:**
- **即座の反応が必要**: 200ms（ボタン、リンク）
- **滑らかな動き**: 300ms（カード、モーダル）
- **遅延を感じさせない**: 500ms以下を推奨

---

## 16. TOPページの詳細デザインシステム

### 16-1. 情報階層（レイヤー構造）

**ページ全体の階層:**
```
┌─────────────────────────────────────┐
│ AppHeader (Sticky)                  │
│ - ロゴ + ブランド名                  │
│ - 日時（PCのみ）                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ メインコンテンツ (max-w-4xl)         │
│ ┌─────────────────────────────────┐ │
│ │ サマリーセクション                │ │
│ │ - セクションタイトル              │ │
│ │ - サマリーカード（カルーセル）    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 車両一覧セクション                │ │
│ │ - セクションタイトル + 件数       │ │
│ │ - 検索バー                        │ │
│ │ - ジョブカードリスト              │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 長期プロジェクトセクション        │ │
│ │ - セクションタイトル + 件数       │ │
│ │ - プロジェクトカードグリッド      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 16-2. ジョブカードの情報階層

**第1階層（最重要情報）**:
- 顧客名アイコン（`h-5 w-5 text-slate-500`）
- 顧客名（`text-lg font-semibold text-slate-900`）
- 重要な顧客フラグ（Starアイコン `h-5 w-5`、黄色 `text-yellow-500`）
- お客様共有フォルダ（Folderアイコン `h-5 w-5 text-slate-500`）
- ステータスバッジ（⚠️ 推奨: `text-base px-2.5 py-1`、既存実装: `text-xs px-2.5 py-0.5`）

**第2階層（重要情報）**:
- 車両情報アイコン（`h-4 w-4 text-slate-500`）
- 車両情報（`text-base font-medium text-slate-900`）
- 走行距離（`text-sm text-slate-700` - 最小限の使用）
- 入庫区分バッジ（⚠️ 推奨: アイコン `h-4 w-4` + テキスト `text-base`、既存実装: アイコン `h-3.5 w-3.5` + テキスト `text-xs`）
- 入庫日時（アイコン `h-4 w-4 text-slate-500` + テキスト `text-sm text-slate-700` - 最小限の使用）
- タグ（⚠️ 推奨: アイコン `h-4 w-4` + テキスト `text-base`、既存実装: アイコン `h-3.5 w-3.5` + テキスト `text-sm`）
- 代車（⚠️ 推奨: アイコン `h-4 w-4` + テキスト `text-base`、既存実装: アイコン `h-3.5 w-3.5` + テキスト `text-sm`）
- 担当整備士（⚠️ 推奨: アイコン `h-4 w-4` + テキスト `text-base`、既存実装: アイコン `h-3.5 w-3.5` + テキスト `text-sm`）

**第3階層（詳細情報）**:
- 詳細情報折りたたみボタン（ChevronDownアイコン `h-4 w-4`）
- 詳細情報バッジ（お客様入力情報、作業指示、変更申請あり、承認済み作業内容）
  - ⚠️ 推奨: アイコン `h-4 w-4` + テキスト `text-base font-medium px-2.5 py-1`
  - 既存実装: アイコン `h-3.5 w-3.5` + テキスト `text-xs font-medium px-2.5 py-1`
  - 色: ブルー系（お客様入力情報、承認済み作業内容）、アンバー系（作業指示、変更申請）

**第4階層（アクション）**:
- プライマリアクションボタン（⚠️ 推奨: PC/モバイル共通 `h-12`、既存実装: PC `h-12`、モバイル `h-10`）
  - アイコン: `h-5 w-5 text-white`（PC）または `h-4 w-4 text-white`（モバイル）
  - ステージ別の色: Slate/Blue/Orange/Emerald/Violet

### 16-3. サマリーカードレイアウト

**推奨構造（Flexbox横スクロール）:**
```typescript
<div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
  <div className="flex gap-4 items-start">
    {/* 各カード */}
    <Card className="border-slate-200 shadow-md min-w-[280px] flex-shrink-0">
      {/* カード内容 */}
    </Card>
  </div>
</div>
```

**重要なポイント:**
1. **`items-start`**: 各カードが独立した高さを持つ
2. **`flex-shrink-0`**: カードが縮小しないようにする
3. **`min-w-[280px]`**: カードの最小幅を固定
4. **`overflow-x-auto`**: 横スクロール可能にする

## 17. 実装チェックリスト

### 17-1. アイコン

- [ ] すべてのアイコンで`h-4 w-4` (16px) 以上を使用しているか
- [ ] 適切なサイズを使用（`h-4 w-4`, `h-5 w-5`など）
- [ ] `shrink-0`を設定
- [ ] 適切な色を使用（`text-slate-500`など）
- [ ] アクセシビリティ属性を設定（`aria-hidden="true"`または`aria-label`）
- [ ] `h-3 w-3` (12px) や `size-3` (12px) を使用していない（禁止）

### 17-2. テキスト

- [ ] 適切なサイズを使用（`text-base`以上を推奨）
- [ ] `text-xs` (12px) を使用していない（禁止）
- [ ] `text-sm` (14px) は最小限の使用（可能な限り`text-base`を使用）
- [ ] 適切なウェイトを使用（`font-medium`, `font-semibold`など）
- [ ] 適切な色を使用（`text-slate-900`, `text-slate-700`など）
- [ ] 長いテキストは`break-words`を使用

### 17-3. バッジ

- [ ] すべてのバッジで`text-base` (16px) を使用しているか
- [ ] `text-xs` (12px) を使用していない（禁止）
- [ ] `whitespace-nowrap`と`shrink-0`を設定
- [ ] 適切なパディングを使用（`px-2.5 py-1`など）

### 17-4. スペーシング

- [ ] モバイル対応のgapを使用（`gap-1.5 sm:gap-2`など）
- [ ] 適切なパディングを使用（`pb-3`, `px-2.5 py-1`など）
- [ ] セクション間は`mb-6`を使用

### 17-5. ボタン

- [ ] デフォルトサイズは`h-12`（48px）を使用
- [ ] すべてのボタンで`h-12` (48px) を使用しているか
- [ ] 適切なバリアントを使用（`variant="default"`, `variant="outline"`など）
- [ ] アクセシビリティ属性を設定（`aria-label`など）

### 17-6. フォーム要素

- [ ] 入力フィールドは`h-12`（48px）を使用
- [ ] すべての入力フィールドで`h-12` (48px) を使用しているか
- [ ] テキストサイズは`text-base`（16px）を使用
- [ ] エラー状態を適切に表示（`aria-invalid`, `aria-describedby`など）

### 17-7. モバイル対応

- [ ] テキストが折り返すように設定
- [ ] バッジに`whitespace-nowrap`と`shrink-0`を設定
- [ ] レスポンシブなgapを使用
- [ ] 適切な表示/非表示を設定

### 17-8. アクセシビリティ

- [ ] すべてのインタラクティブ要素に適切な`aria-label`が設定されているか
- [ ] すべてのフォーム要素に適切な`aria-required`, `aria-invalid`が設定されているか
- [ ] すべてのエラーメッセージに`role="alert"`が設定されているか
- [ ] すべての機能をキーボードで操作可能か

### 17-9. カラー

- [ ] すべてのテキストと背景のコントラスト比が4.5:1以上か
- [ ] ステータスバッジの色が統一されているか
- [ ] 入庫区分バッジの色が統一されているか

### 17-10. その他のUIコンポーネント

- [ ] Avatarコンポーネントで適切なサイズ（`size-10`以上）を使用しているか
- [ ] Progressコンポーネントで適切なコントラスト比を確保しているか
- [ ] Tabsコンポーネントで`text-base` (16px) を使用しているか
- [ ] DropdownMenuコンポーネントで可能な限り`text-base` (16px) を使用しているか
- [ ] AlertDialogコンポーネントでボタンサイズ`h-12` (48px) を使用しているか
- [ ] RadioGroupコンポーネントでラベルに`text-base` (16px) を使用しているか
- [ ] Sliderコンポーネントで適切なタッチターゲットサイズを確保しているか

---

## 18. 禁止事項と置き換え方法

### 18-1. テキストサイズの禁止事項

**禁止されているクラスと推奨される置き換え方法:**

| 禁止クラス | サイズ | 推奨置き換え | 理由 |
|-----------|--------|------------|------|
| `text-xs` | 12px | `text-base` (16px) | 視認性が低すぎる（40歳以上ユーザー向け最適化） |
| `text-sm` | 14px | `text-base` (16px) | 可能な限り`text-base`を使用（最小限の使用は可） |

**実装例:**
```typescript
// ❌ 禁止
<Badge className="text-xs">件数</Badge>
<span className="text-sm">補助情報</span>

// ✅ 推奨
<Badge className="text-base">件数</Badge>
<span className="text-base">補助情報</span>
```

### 18-2. アイコンサイズの禁止事項

**禁止されているクラスと推奨される置き換え方法:**

| 禁止クラス | サイズ | 推奨置き換え | 理由 |
|-----------|--------|------------|------|
| `h-3 w-3` | 12px | `h-4 w-4` (16px) | 視認性が低すぎる |
| `size-3` | 12px | `size-4` (16px) または `h-4 w-4` | 視認性が低すぎる |

**実装例:**
```typescript
// ❌ 禁止
<Icon className="h-3 w-3" />
<Icon className="size-3" />

// ✅ 推奨
<Icon className="h-4 w-4" />
<Icon className="size-4" />
```

### 18-3. バッジのテキストサイズ

**統一ルール:**
- すべてのバッジで`text-base` (16px) を使用
- `text-xs` (12px) は使用禁止
- `text-sm` (14px) は使用禁止（可能な限り`text-base`を使用）

**実装例:**
```typescript
// ❌ 禁止
<Badge className="text-xs px-2.5 py-0.5">ステータス</Badge>

// ✅ 推奨
<Badge className="text-base px-2.5 py-1">ステータス</Badge>
```

---

## 19. Sheet（サイドパネル）

### 19-1. Sheet基本スタイル

**用途**: モバイル向けのサイドパネル表示（フィルター、詳細情報など）

**実装例:**
```typescript
<Sheet>
  <SheetTrigger>開く</SheetTrigger>
  <SheetContent side="right" className="w-3/4 sm:max-w-sm">
    <SheetHeader>
      <SheetTitle>タイトル</SheetTitle>
    </SheetHeader>
    {/* コンテンツ */}
  </SheetContent>
</Sheet>
```

**サイドの選択:**
- `side="right"`: 右側からスライド（デフォルト）
- `side="left"`: 左側からスライド
- `side="top"`: 上からスライド
- `side="bottom"`: 下からスライド

**レスポンシブ:**
- モバイル: `w-3/4` (画面幅の75%)
- PC: `sm:max-w-sm` (最大384px)

**アニメーション:**
- 開く: `slide-in-from-right` (右から)
- 閉じる: `slide-out-to-right` (右へ)
- デュレーション: 開く 500ms、閉じる 300ms

---

## 20. スケルトン（ローディング状態）

### 20-1. Skeleton基本スタイル

**用途**: データ読み込み中のプレースホルダー表示

**実装例:**
```typescript
<Skeleton className="h-6 w-32" />  // テキスト用
<Skeleton className="h-16 w-full" />  // カード用
```

**スタイル:**
- 背景色: `bg-accent` (自動的に適切な色が適用される)
- アニメーション: `animate-pulse` (自動適用)
- 角丸: `rounded-md` (自動適用)

**サイズ:**
- テキスト: `h-6 w-32` (24px × 128px)
- カード: `h-16 w-full` (64px × 全幅)
- カスタム: 用途に応じて調整

---

## 21. Dialog（ダイアログ）の詳細仕様

### 21-1. DialogContentのデフォルトスタイル

**実装されているスタイル:**
- 最大幅: `max-w-[calc(100%-2rem)]` (モバイル), `sm:max-w-lg` (PC)
- パディング: `p-6` (24px)
- 角丸: `rounded-lg` (8px)
- シャドウ: `shadow-lg`
- アニメーション: `fade-in-0`, `zoom-in-95`
- 位置: 画面中央 (`top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]`)

### 21-2. DialogTitleのデフォルトスタイル

- フォントサイズ: `text-lg` (18px)
- フォントウェイト: `font-semibold` (600)
- 行の高さ: `leading-none`

### 21-3. DialogDescriptionのデフォルトスタイル

- フォントサイズ: `text-base` (16px)
- 色: `text-muted-foreground`

### 21-4. DialogCloseボタン

- 位置: `absolute top-4 right-4`
- アイコンサイズ: `size-4` (16px)
- 透明度: `opacity-70` → `hover:opacity-100`
- フォーカスリング: `focus:ring-2 focus:ring-offset-2`

### 21-5. Dialog内のボタンサイズ

**DialogFooter内のボタン:**
- プライマリボタン: `h-12` (48px) - デフォルト
- セカンダリボタン: `h-12` (48px) - デフォルト
- テキストサイズ: `text-base` (16px)
- パディング: `px-4 py-2` (横16px、縦8px)

**実装例:**
```typescript
<DialogFooter className="flex items-center justify-end gap-3 pt-4 border-t">
  <Button variant="outline" className="h-12">
    キャンセル
  </Button>
  <Button className="h-12 bg-orange-600 hover:bg-orange-700 text-white">
    保存する
  </Button>
</DialogFooter>
```

**ボタンの状態:**
- 通常: デフォルトのスタイル
- ホバー: `hover:bg-{color}-700` (プライマリボタン), `hover:bg-accent` (セカンダリボタン)
- 無効: `disabled:opacity-50 disabled:cursor-not-allowed`
- ローディング: アイコン `h-4 w-4` (16px) + テキスト「保存中...」

---

## 22. 検索バー

### 22-1. 検索バーの基本スタイル

**Input要素:**
- 高さ: `h-12` (48px)
- パディング: `pl-10` (左側にアイコン用のスペース)
- アイコン: `h-5 w-5` (20px), `text-slate-500`
- 位置: `absolute left-3 top-1/2 -translate-y-1/2`

**オートコンプリート候補:**
- 背景: `bg-white`
- シャドウ: `shadow-lg`
- 角丸: `rounded-md`
- 最大高さ: `max-h-96` (スクロール可能)
- パディング: `p-2`

**候補アイテム:**
- パディング: `px-3 py-2`
- ホバー: `hover:bg-slate-100`
- 選択時: `bg-blue-50`
- フォントサイズ: `text-base` (16px)
- テキスト色: `text-slate-900` (デフォルト)

**キーボードショートカット:**
- `Cmd/Ctrl + K`: 検索バーにフォーカス
- `ArrowDown/ArrowUp`: 候補を移動
- `Enter`: 候補を選択
- `Escape`: 候補を閉じる

---

## 23. エラー表示

### 23-1. エラーメッセージのスタイル

**Alertコンポーネントを使用:**
```typescript
<Alert className="bg-red-50 text-red-900 border-red-300 p-4">
  <AlertCircle className="h-5 w-5 text-red-900" />
  <AlertTitle className="text-base font-semibold text-red-900">
    エラー
  </AlertTitle>
  <AlertDescription className="text-base text-red-900">
    エラーメッセージ
  </AlertDescription>
</Alert>
```

**インラインエラー:**
- テキストサイズ: `text-base` (16px)
- 色: `text-red-600`
- 位置: 入力フィールドの下
- ロール: `role="alert"`

---

## 24. ローディング状態

### 24-1. ローディングアイコン

**Loader2アイコン:**
- サイズ: `h-5 w-5` (20px)
- アニメーション: `animate-spin`
- 色: ボタン内では `text-white`、その他は `text-slate-600`

**実装例:**
```typescript
<Loader2 className="h-5 w-5 animate-spin" />
```

### 24-2. ボタン内のローディング表示

```typescript
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      処理中...
    </>
  ) : (
    "保存"
  )}
</Button>
```

---

## 25. トースト通知の詳細仕様

### 25-1. トーストのカスタマイズ

**アクションボタン付き:**
```typescript
toast.error("エラーが発生しました", {
  description: "詳細情報",
  action: {
    label: "再試行",
    onClick: () => handleRetry(),
  },
  duration: 10000,  // 10秒間表示
});
```

**位置:**
- デフォルト: 画面下部中央
- カスタマイズ可能（Toasterコンポーネントで設定）

**表示時間:**
- 成功: 3秒（デフォルト）
- エラー: 10秒（推奨）
- 警告: 5秒（推奨）
- 情報: 5秒（推奨）

---

## 26. フォームバリデーション

### 26-1. エラー状態のInput

```typescript
<Input
  className={cn(
    "w-full",
    error && "border-red-600 ring-red-600/20"
  )}
  aria-invalid={!!error}
  aria-describedby={error ? "error-message" : undefined}
/>
{error && (
  <span id="error-message" className="text-base text-red-600 mt-1" role="alert">
    {error}
  </span>
)}
```

### 26-2. 必須フィールドの表示

```typescript
<Label htmlFor="field-name" className="text-base font-medium text-slate-900">
  フィールド名
  <span className="text-red-600 ml-1">*</span>
</Label>
```

---

## 27. 業務フローとユーザーロール

### 27-1. 業務フロー（Phase別）

本システムは以下の6つのPhaseで構成されています：

| Phase | 名称 | 担当者 | 主な画面 | 目的 |
|-------|------|--------|---------|------|
| **Phase 0** | 事前チェックイン | 顧客 | `/customer/pre-checkin/[id]` | 来店前の情報入力 |
| **Phase 1** | 受付 | 受付スタッフ | `/` (TOPページ) | 来店確認、タグ紐付け |
| **Phase 2** | 診断 | メカニック | `/mechanic/diagnosis/[id]` | 車両診断、写真撮影 |
| **Phase 3** | 見積作成 | 事務員・管理者 | `/admin/estimate/[id]` | 見積もり作成 |
| **Phase 4** | 顧客承認 | 顧客 | `/customer/approval/[id]` | 見積もり承認・却下 |
| **Phase 5** | 作業 | メカニック | `/mechanic/work/[id]` | 作業実施、写真撮影 |
| **Phase 6** | 報告 | 顧客 | `/customer/report/[id]` | 作業完了報告の確認 |

### 27-2. ユーザーロール別のUI/UX要件

**受付スタッフ（フロント）:**
- **主な操作**: 受付開始、タグ紐付け、LINE連携
- **UI要件**: 
  - タブレット操作を前提（タッチターゲット48px以上）
  - 1タップで主要操作が完了
  - 事前入力情報の視覚的な強調表示（📝アイコン）
  - 作業指示の視覚的な強調表示（⚠アイコン）

**メカニック（整備士）:**
- **主な操作**: 診断入力、写真撮影、作業記録
- **UI要件**:
  - スマートフォン操作を前提（片手操作可能）
  - 汚れた手でも操作可能（音声入力対応）
  - 写真撮影が簡単（カメラボタンが大きく、明確）
  - 作業指示の確認が容易（⚠アイコン、詳細情報バッジ）

**事務員・管理者:**
- **主な操作**: 見積作成、データ確認、管理業務
- **UI要件**:
  - PC操作を前提（マウス操作、キーボードショートカット）
  - 大量データの一覧表示
  - 詳細情報の確認（ダイアログ、モーダル）

**顧客:**
- **主な操作**: 事前入力、見積承認、報告確認
- **UI要件**:
  - スマートフォン操作を前提
  - わかりやすい説明文
  - 大きなボタン（承認ボタンなど）
  - 視覚的なフィードバック（アニメーション、トースト通知）

### 27-3. Phase別のUI/UXパターン

**Phase 0（事前チェックイン）:**
- **レイアウト**: カード形式のセクション分け
- **入力フィールド**: 大きなサイズ（`h-12`）、明確なラベル
- **バリデーション**: リアルタイム表示
- **送信ボタン**: 大きく、明確（`h-14`推奨）

**Phase 1（受付）:**
- **レイアウト**: カードリスト、横スクロール可能なサマリー
- **アクションボタン**: ステータス別の色分け
- **アラート表示**: 事前入力あり（📝）、作業指示あり（⚠）

**Phase 2（診断）:**
- **レイアウト**: コンパクトヘッダー、セクション分け
- **写真撮影**: 大きなカメラボタン、9ポジション撮影
- **診断入力**: トラフィックライトボタン（色・形状・アイコン・テキスト）

**Phase 3（見積作成）:**
- **レイアウト**: 2カラム（診断結果ビュー、見積項目）
- **テーブル**: 5列構成、技術量選択
- **プレビュー**: モーダル表示

**Phase 4（顧客承認）:**
- **レイアウト**: 大きな合計金額表示
- **セクション**: 必須整備（固定ON）、推奨整備（デフォルトON）、任意整備（デフォルトOFF）
- **リアルタイム計算**: アニメーション付き

**Phase 5（作業）:**
- **レイアウト**: 承認済み作業項目リスト
- **チェックボックス**: 大きなサイズ（`size-4`以上）
- **証拠撮影**: 大きなカメラボタン

**Phase 6（報告）:**
- **レイアウト**: Before/After写真比較
- **PDF表示**: 大きなボタン
- **動画共有**: 大きなボタン

---

## 28. 文言（ラベル・メッセージ）の統一ルール

### 28-1. ボタンのラベル

**アクションボタン（Phase別）:**
- Phase 1: 「受付を開始」
- Phase 2: 「診断を開始」
- Phase 3: 「見積を開始」
- Phase 4: 「この内容で作業を依頼する」
- Phase 5: 「作業を開始」
- Phase 6: 「引渡しを開始」

**共通ボタン:**
- 「保存する」/「保存中...」（ローディング時）
- 「キャンセル」
- 「閉じる」
- 「戻る」

### 28-2. ステータスバッジの文言

| ステータス | 表示文言 |
|-----------|---------|
| 入庫待ち | 「入庫待ち」 |
| 入庫済み | 「入庫済み」 |
| 診断待ち | 「診断待ち」 |
| 見積作成待ち | 「見積作成待ち」 |
| お客様承認待ち | 「お客様承認待ち」 |
| 作業待ち | 「作業待ち」 |
| 引渡待ち | 「引渡待ち」 |
| 出庫済み | 「出庫済み」 |

### 28-3. バッジの文言

**詳細情報バッジ:**
- 「お客様入力情報」（📝アイコン）
- 「作業指示」（⚠アイコン）
- 「変更申請あり」（🔔アイコン）
- 「承認済み作業内容」（🔧アイコン）

**入庫区分バッジ:**
- 「車検」
- 「12ヵ月点検」
- 「エンジンオイル交換」
- 「タイヤ交換・ローテーション」
- 「修理・整備」
- 「故障診断」
- 「レストア」
- 「板金・塗装」
- 「その他」

### 28-4. エラーメッセージの文言

**フォームバリデーション:**
- 「この項目は必須です」
- 「正しい形式で入力してください」
- 「数値を入力してください」
- 「最大{数値}文字まで入力できます」

**システムエラー:**
- 「エラーが発生しました」
- 「保存に失敗しました」
- 「データの取得に失敗しました」
- 「ネットワークエラーが発生しました」

### 28-5. 成功メッセージの文言

- 「保存しました」
- 「更新しました」
- 「送信しました」
- 「処理が完了しました」

### 28-6. 確認メッセージの文言

- 「この操作を実行しますか？」
- 「削除してもよろしいですか？」
- 「変更を破棄しますか？」

### 28-7. プレースホルダーの文言

**入力フィールド:**
- 「走行距離を入力」（数値型）
- 「コメントを入力」（テキストエリア）
- 「顧客名・車名・ナンバー・タグIDで検索」（検索バー）
- 「例：山田太郎」（記入者名）

**説明文:**
- 「この内容は作業指示書PDFに含まれます」（受付メモ）
- 「メカニックが詳細を確認したい場合に連絡先として使用されます」（記入者名）

---

## 29. 音声入力

### 29-1. 音声入力のUXガイドライン

**目的**: 手が汚れている状態でも入力可能にする（整備士の作業環境を考慮）

**使用場面**: 部品名の入力、コメント入力など

**最大録音時間**: 30秒（デフォルト）

**視覚的フィードバック**: 録音中はアイコンとタイマーを表示

**音声認識**: Web Speech API（ブラウザ標準）または OpenAI Whisper API を使用

**エラーハンドリング**: 音声認識に失敗した場合は、手動入力に切り替え可能

**実装例:**
```typescript
<AudioInputButton
  onRecognize={(text) => {
    setPartName(text);
    toast.success("音声認識が完了しました");
  }}
  onRecording={(isRecording) => {
    setIsRecording(isRecording);
  }}
  maxDuration={30}
/>
```

**UXのベストプラクティス:**
- 録音ボタンは大きく表示（タッチしやすい）
- 録音中は明確な視覚的フィードバック（アニメーション、タイマー）
- 音声認識結果は確認可能（編集可能）
- 音声認識に失敗した場合、手動入力に簡単に切り替え可能

---

## 30. Avatar（アバター）

### 30-1. Avatar基本スタイル

**用途**: ユーザーアイコン、整備士アイコンなどの表示

**実装例:**
```typescript
<Avatar className="size-10">
  <AvatarImage src="/avatar.jpg" alt="整備士名" />
  <AvatarFallback>中村</AvatarFallback>
</Avatar>
```

**サイズ:**
- デフォルト: `size-8` (32px × 32px)
- 推奨: `size-10` (40px × 40px) 以上（40歳以上ユーザー向け）
- 大きなサイズ: `size-12` (48px × 48px)

**スタイル:**
- 形状: `rounded-full` (円形)
- 背景: `bg-muted` (フォールバック時)
- オーバーフロー: `overflow-hidden`

**アクセシビリティ:**
- `alt`属性を必ず設定
- フォールバックテキストは2文字以内を推奨

---

## 31. Progress（プログレスバー）

### 31-1. Progress基本スタイル

**用途**: 作業進捗、アップロード進捗などの表示

**実装例:**
```typescript
<Progress value={75} max={100} />
```

**スタイル:**
- 高さ: `h-2` (8px)
- 背景: `bg-slate-200`
- インジケーター: `bg-slate-600` (デフォルト)
- 角丸: `rounded-full`
- トランジション: `transition-all duration-300 ease-in-out`

**カスタマイズ:**
```typescript
<Progress 
  value={50} 
  max={100}
  indicatorClassName="bg-blue-600" 
/>
```

**40歳以上ユーザー向け:**
- 高さは`h-2` (8px) で十分視認可能
- 色のコントラスト比は4.5:1以上を確保

---

## 32. Tabs（タブ）

### 32-1. Tabs基本スタイル

**用途**: カテゴリ分け、診断項目の切り替えなど

**実装例:**
```typescript
<Tabs defaultValue="category1">
  <TabsList>
    <TabsTrigger value="category1">カテゴリ1</TabsTrigger>
    <TabsTrigger value="category2">カテゴリ2</TabsTrigger>
  </TabsList>
  <TabsContent value="category1">コンテンツ1</TabsContent>
  <TabsContent value="category2">コンテンツ2</TabsContent>
</Tabs>
```

**TabsListスタイル:**
- 高さ: `h-9` (36px) - ⚠️ **40歳以上ユーザー向け推奨: `h-12` (48px)**
- 背景: `bg-muted`
- 角丸: `rounded-lg`
- パディング: `p-[3px]`

**TabsTriggerスタイル:**
- 高さ: `h-[calc(100%-1px)]` (TabsList内で調整) - ⚠️ **40歳以上ユーザー向け推奨: TabsListを`h-12`に変更**
- フォントサイズ: `text-base` (16px)
- フォントウェイト: `font-medium`
- パディング: `px-2 py-1` - ⚠️ **40歳以上ユーザー向け推奨: `px-3 py-2`で最小48px高さを確保**
- アクティブ時: `bg-background`, `shadow-sm`
- フォーカス: `focus-visible:ring-[3px]`

**40歳以上ユーザー向け:**
- フォントサイズは`text-base` (16px) を使用
- TabsListの高さは`h-12` (48px) を推奨
- TabsTriggerのパディングは`px-3 py-2`で最小48px高さを確保

---

## 33. Separator（区切り線）

### 33-1. Separator基本スタイル

**用途**: セクションの区切り、リスト項目の区切りなど

**実装例:**
```typescript
<Separator orientation="horizontal" />
<Separator orientation="vertical" />
```

**スタイル:**
- 水平: `h-px w-full`
- 垂直: `h-full w-px`
- 色: `bg-border`
- 装飾的: `decorative={true}` (デフォルト)

**使用場面:**
- カード内のセクション区切り
- リスト項目の区切り
- フォーム内のセクション区切り

---

## 34. ScrollArea（スクロール領域）

### 34-1. ScrollArea基本スタイル

**用途**: カスタムスクロールバーの表示、スクロール可能な領域

**実装例:**
```typescript
<ScrollArea className="h-[200px]">
  <div className="space-y-4">
    {/* コンテンツ */}
  </div>
</ScrollArea>
```

**スタイル:**
- スクロールバー幅: `w-2.5` (10px)
- スクロールバー高さ: `h-2.5` (水平時)
- スクロールバー色: `bg-border`
- サム（つまみ）: `rounded-full`

**40歳以上ユーザー向け:**
- スクロールバーは十分なサイズ（10px）で視認可能
- タッチ操作でも操作しやすい

---

## 35. DropdownMenu（ドロップダウンメニュー）

### 35-1. DropdownMenu基本スタイル

**用途**: コンテキストメニュー、アクションメニューなど

**実装例:**
```typescript
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="outline">メニュー</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>項目1</DropdownMenuItem>
    <DropdownMenuItem>項目2</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">削除</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**DropdownMenuContentスタイル:**
- 最小幅: `min-w-[8rem]` (128px)
- パディング: `p-1`
- 角丸: `rounded-md`
- シャドウ: `shadow-md`
- アニメーション: `fade-in-0`, `zoom-in-95`

**DropdownMenuItemスタイル:**
- フォントサイズ: `text-sm` (14px) - **注意: 可能な限り`text-base`を使用**
- パディング: `px-2 py-1.5`
- アイコンサイズ: `size-4` (16px)
- ホバー: `focus:bg-accent`
- 破壊的アクション: `variant="destructive"` → `text-destructive`

**40歳以上ユーザー向け:**
- メニュー項目のフォントサイズは可能な限り`text-base` (16px) を使用
- タッチターゲットは十分なサイズ（`py-1.5`で最小48px高さを推奨）

---

## 36. AlertDialog（確認ダイアログ）

### 36-1. AlertDialog基本スタイル

**用途**: 削除確認、重要な操作の確認など

**実装例:**
```typescript
<AlertDialog>
  <AlertDialogTrigger>
    <Button variant="destructive">削除</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>削除の確認</AlertDialogTitle>
      <AlertDialogDescription>
        この操作は取り消せません。本当に削除しますか？
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>キャンセル</AlertDialogCancel>
      <AlertDialogAction>削除する</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**AlertDialogContentスタイル:**
- 最大幅: `max-w-[calc(100%-2rem)]` (モバイル), `sm:max-w-lg` (PC)
- パディング: `p-6` (24px)
- 角丸: `rounded-lg`
- シャドウ: `shadow-lg`
- 位置: 画面中央

**AlertDialogTitleスタイル:**
- フォントサイズ: `text-lg` (18px)
- フォントウェイト: `font-semibold`

**AlertDialogDescriptionスタイル:**
- フォントサイズ: `text-base` (16px)
- 色: `text-muted-foreground`

**AlertDialogFooterスタイル:**
- レイアウト: `flex-col-reverse sm:flex-row sm:justify-end`
- ギャップ: `gap-2`

**AlertDialogAction/AlertDialogCancelスタイル:**
- ボタンサイズ: `h-12` (48px) - デフォルトのButtonコンポーネントを使用

**40歳以上ユーザー向け:**
- タイトルは`text-lg` (18px)、説明文は`text-base` (16px) を使用
- ボタンは`h-12` (48px) で十分なタッチターゲットサイズを確保

---

## 37. Collapsible（折りたたみ）

### 37-1. Collapsible基本スタイル

**用途**: 詳細情報の表示/非表示、アコーディオンなど

**実装例:**
```typescript
<Collapsible>
  <CollapsibleTrigger>
    <Button variant="ghost">詳細を表示</Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="p-4">
      {/* コンテンツ */}
    </div>
  </CollapsibleContent>
</Collapsible>
```

**スタイル:**
- アニメーション: Radix UIのデフォルトアニメーションを使用
- トランジション: `transition-all duration-200`

**40歳以上ユーザー向け:**
- トリガーボタンは`h-12` (48px) を使用
- コンテンツ内のテキストは`text-base` (16px) 以上を使用

---

## 38. RadioGroup（ラジオボタン）

### 38-1. RadioGroup基本スタイル

**用途**: 単一選択、オプション選択など

**実装例:**
```typescript
<RadioGroup defaultValue="option1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1" className="text-base">オプション1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="option2" />
    <Label htmlFor="option2" className="text-base">オプション2</Label>
  </div>
</RadioGroup>
```

**RadioGroupスタイル:**
- ギャップ: `gap-3` (12px)

**RadioGroupItemスタイル:**
- サイズ: `size-4` (16px × 16px)
- 形状: `rounded-full` (円形)
- ボーダー: `border-2`
- フォーカス: `focus-visible:ring-[3px]`
- エラー状態: `aria-invalid:border-destructive`

**40歳以上ユーザー向け:**
- ラジオボタンは`size-4` (16px) で十分視認可能
- ラベルは`text-base` (16px) を使用
- 項目間のスペースは`gap-3` (12px) 以上を確保

---

## 39. Slider（スライダー）

### 39-1. Slider基本スタイル

**用途**: 数値入力、範囲選択など

**実装例:**
```typescript
<Slider 
  defaultValue={[50]} 
  max={100} 
  step={1}
  className="w-full"
/>
```

**スタイル:**
- トラック高さ: `h-2` (8px)
- トラック背景: `bg-slate-200`
- レンジ背景: `bg-slate-600`
- サムサイズ: `h-5 w-5` (20px × 20px)
- サム形状: `rounded-full`
- サムボーダー: `border-2 border-slate-600`
- フォーカス: `focus-visible:ring-2 focus-visible:ring-slate-600`

**40歳以上ユーザー向け:**
- サムは`h-5 w-5` (20px) で十分なタッチターゲットサイズ
- トラックは`h-2` (8px) で視認可能
- コントラスト比は4.5:1以上を確保

---

## 40. 更新履歴

- **2025-01-XX**: 初版作成（統合版）
- **2025-01-XX**: 40歳以上ユーザー向け最適化（ボタン・入力フィールドのサイズ拡大）
- **2025-01-XX**: カラーユニバーサルデザイン対応追加
- **2025-01-XX**: 全デザイン関連ドキュメントを統合
  - アイコン・バッジ・メッセージボックスの詳細ルールを追加
  - カラー関連の詳細ルール（ステータス、入庫区分、アクションボタン）を追加
  - レイアウト関連のベストプラクティスを追加
  - TOPページの詳細デザインシステムを追加
  - コンパクトジョブヘッダーのデザイン仕様を追加
- **2025-01-XX**: 最終統合版
  - Sheet（サイドパネル）コンポーネントの仕様を追加
  - スケルトン（ローディング）コンポーネントの仕様を追加
  - 検索バーのスタイル仕様を追加
  - Dialogの詳細仕様を追加（Dialog内のボタンサイズを含む）
  - エラー表示、ローディング状態、トースト通知、フォームバリデーションの仕様を追加
  - 音声入力のUXガイドラインを追加
  - 禁止事項と置き換え方法のセクションを追加
  - 実装チェックリストを拡充（アクセシビリティ、カラーの確認項目を追加）
- **2025-01-XX**: UI/UXレビュー対応版
  - スマートフォン対応の詳細セクションを追加（11-5）
  - アニメーションの詳細ルールを拡充（15-6）
  - ホバー・フォーカス・無効状態の詳細を追加（15-2, 15-3, 15-4）
  - 業務フローとユーザーロールのセクションを追加（27）
  - 文言（ラベル・メッセージ）の統一ルールを追加（28）
  - Dialog内のボタンサイズの詳細を追加（21-5）
- **2025-01-XX**: 未記載コンポーネント追加版
  - Avatar（アバター）コンポーネントの仕様を追加（30）
  - Progress（プログレスバー）コンポーネントの仕様を追加（31）
  - Tabs（タブ）コンポーネントの仕様を追加（32）
  - Separator（区切り線）コンポーネントの仕様を追加（33）
  - ScrollArea（スクロール領域）コンポーネントの仕様を追加（34）
  - DropdownMenu（ドロップダウンメニュー）コンポーネントの仕様を追加（35）
  - AlertDialog（確認ダイアログ）コンポーネントの仕様を追加（36）
  - Collapsible（折りたたみ）コンポーネントの仕様を追加（37）
  - RadioGroup（ラジオボタン）コンポーネントの仕様を追加（38）
  - Slider（スライダー）コンポーネントの仕様を追加（39）
- **2025-01-XX**: 一貫性チェック・修正版
  - フォントサイズの矛盾を解消（`text-xs`は非推奨、`text-sm`は最小限の使用と明記）
  - バッジのテキストサイズの矛盾を解消（既存実装と推奨実装を明確に区別）
  - アイコンサイズの矛盾を解消（`h-3.5 w-3.5`は既存実装、`h-4 w-4`を推奨と明記）
  - ボタンサイズの矛盾を解消（`h-10`は既存実装、`h-12`を推奨と明記）
  - TabsListの高さの推奨事項を追加（`h-12`を推奨）
- **2025-01-XX**: 見積行UI仕様追加版
  - 見積行の5列形式の詳細UI仕様を追加（セクション7-5）
  - グリッドレイアウト、入力フィールドサイズ、合計行の仕様を追加
  - 工賃マスタ連携、写真・動画紐付けのUI仕様を追加
  - 40歳以上ユーザー向け最適化の観点を追加
- **2025-01-XX**: デザインシステム評価レポート対応版
  - タイポグラフィの詳細仕様を追加（行の高さ、文字間隔）（セクション2-5, 2-6）
  - レスポンシブ対応ガイドラインを拡充（ブレークポイントの使用方針、フォントサイズ・スペーシングのレスポンシブ対応）（セクション11-7）
  - アクセシビリティガイドラインを拡充（ARIA属性の使用ガイドライン）（セクション13-3）
  - エラーメッセージのフォントサイズを`text-sm`から`text-base`に統一（視認性向上）

---

## 41. 統合元ドキュメント（アーカイブ済み）

以下のドキュメントは本統合版に統合され、`docs/archive/`に移動されました：

### デザインシステム関連
- `ICON_BADGE_MESSAGE_BOX_RULES.md` - アイコン・バッジ・メッセージボックスの統一ルール
- `TODAY_SCHEDULE_CARD_COLOR_RULES.md` - 本日入出庫予定カードの色設定ルール
- `ESTIMATE_BADGE_COLOR_PROPOSAL.md` - 見積ページバッジ色の改善提案
- `STATUS_COLOR_RULES.md` - ステータス色の統一ルール
- `SERVICE_KIND_COLOR_RULES.md` - 入庫区分別アイコンの色ルール
- `ACTION_BUTTON_COLOR_RULES.md` - アクションボタンの色ルール
- `SUMMARY_CARDS_LAYOUT_BEST_PRACTICES.md` - サマリーカードレイアウトベストプラクティス
- `ICON_CONSISTENCY_ANALYSIS.md` - アイコン一貫性分析と改善提案
- `COMPACT_JOB_HEADER_DESIGN.md` - CompactJobHeaderデザイン仕様
- `TOP_PAGE_DESIGN_SYSTEM.md` - TOPページUI/UXデザインシステム
- `SCHEDULE_CARD_COLOR_REVIEW.md` - スケジュールカードの色設定レビュー
- `MOBILE_HEADER_IMPROVEMENT_PROPOSAL.md` - モバイルヘッダー改善提案
- `SUMMARY_CARDS_LAYOUT_PROPOSAL.md` - サマリーカードレイアウト改善提案
- `SUMMARY_CARDS_UI_PATTERN_PROPOSAL.md` - サマリーカード「その他」セクションのUIパターン提案

### UI/UXガイドライン関連
- `UI_UX_GUIDELINES.md` - UI/UXガイドライン（本統合版に統合）
- `color-universal-design-guide.md` - カラーユニバーサルデザイン対応ガイド（本統合版に統合）
- `DESIGN_SYSTEM_APPLICATION_PLAN.md` - デザインシステム適用計画
- `DESIGN_SYSTEM_APPLICATION_SUMMARY.md` - デザインシステム適用サマリー
- `DESIGN_SYSTEM_REVIEW.md` - デザインシステムレビュー結果（本統合版に統合）
  - 禁止事項と置き換え方法のセクションを追加
  - 実装チェックリストを拡充（アクセシビリティ、カラーの確認項目を追加）

---

## 42. 関連ドキュメント

- [UIチェックリスト](./UIチェックリスト.md) - UIチェック用チェックリスト
- [SPECIFICATION.md](../SPECIFICATION.md) - 機能仕様書

