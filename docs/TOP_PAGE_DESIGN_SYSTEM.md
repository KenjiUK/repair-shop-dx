# TOPページ UI/UX デザインシステム

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **対象**: TOPページ（`src/app/page.tsx`）のデザインシステム
- **目的**: TOPページのUI/UXを標準化し、他のページにも適用するためのベースライン

---

## 1. 情報階層（レイヤー構造）

### 1-1. ページ全体の階層

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
┌─────────────────────────────────────┐
│ フッター                             │
└─────────────────────────────────────┘
```

### 1-2. ジョブカードの情報階層

**第1階層（最重要情報）**:
- 顧客名アイコン（`h-5 w-5 text-slate-500`）
- 顧客名（`text-lg font-semibold text-slate-900`）
- 重要な顧客フラグ（Starアイコン `h-5 w-5`、黄色 `text-yellow-500`）
- お客様共有フォルダ（Folderアイコン `h-5 w-5 text-slate-500`）
- ステータスバッジ（`text-xs px-2.5 py-0.5`）

**第2階層（重要情報）**:
- 車両情報アイコン（`h-4 w-4 text-slate-500`）
- 車両情報（`text-base font-medium text-slate-900`）
- 走行距離（`text-sm text-slate-700`）
- 入庫区分バッジ（アイコン `h-3.5 w-3.5` + テキスト `text-xs`）
- 入庫日時（アイコン `h-4 w-4 text-slate-500` + テキスト `text-sm text-slate-700`）
- タグ（アイコン `h-3.5 w-3.5 text-slate-500` + テキスト `text-sm text-slate-600`）
- 代車（アイコン `h-3.5 w-3.5 text-slate-500` + テキスト `text-sm text-slate-600`）
- 担当整備士（アイコン `h-3.5 w-3.5 text-slate-500` + テキスト `text-sm text-slate-600`）

**第3階層（詳細情報）**:
- 詳細情報折りたたみボタン（ChevronDownアイコン `h-4 w-4`）
- 詳細情報バッジ（お客様入力情報、作業指示、変更申請あり、承認済み作業内容）
  - アイコン: `h-3.5 w-3.5`
  - テキスト: `text-xs font-medium px-2.5 py-1`
  - 色: ブルー系（お客様入力情報、承認済み作業内容）、アンバー系（作業指示、変更申請）

**第4階層（アクション）**:
- プライマリアクションボタン（PC: `h-12`、モバイル: `h-10`）
  - アイコン: `h-5 w-5 text-white`（PC）または `h-4 w-4 text-white`（モバイル）
  - ステージ別の色: Slate/Blue/Orange/Emerald/Violet

---

## 2. アイコンサイズ体系

### 2-1. 標準アイコンサイズ

| 用途 | サイズ | Tailwindクラス | 実装例 | 色 |
|------|--------|----------------|--------|-----|
| **カードタイトルアイコン** | 20px | `h-5 w-5` | セクションタイトル | `text-slate-600` |
| **第1階層アイコン** | 20px | `h-5 w-5` | 顧客名アイコン（User）、重要な顧客フラグ（Star）、共有フォルダ（Folder） | `text-slate-500`（User, Folder）<br>`text-yellow-500`（Star、アクティブ時）<br>`text-slate-300`（Star、非アクティブ時） |
| **第2階層アイコン（主要）** | 16px | `h-4 w-4` | 車両情報（Car）、入庫日時（Clock） | `text-slate-500` |
| **第2階層アイコン（補助）** | 14px | `h-3.5 w-3.5` | タグ（Tag）、代車（CarFront）、担当整備士（Wrench） | `text-slate-500` |
| **入庫区分バッジ内アイコン** | 14px | `h-3.5 w-3.5` | 入庫区分バッジ内のアイコン | カテゴリー別色（Cyan/Emerald/Orange/Rose/Violet） |
| **第3階層アイコン** | 16px | `h-4 w-4` | 詳細情報折りたたみ（ChevronDown） | `text-slate-600` |
| **詳細情報バッジ内アイコン** | 14px | `h-3.5 w-3.5` | お客様入力情報（MessageSquare）、作業指示（Clipboard）、変更申請（Bell）、承認済み作業（Wrench） | バッジの背景色に応じた白（`text-white`）または色付き |
| **サマリーカードタイトルアイコン** | 16px | `h-4 w-4` | サマリーカードタイトル内の円形背景内アイコン | `text-white`（背景: `bg-slate-600`） |
| **サマリーカードステータスアイコン** | 16px | `h-4 w-4` | ステータス項目のアイコン | ステータス別色（Blue/Orange/Indigo/Amber/Green） |
| **検索バーアイコン** | 20px | `h-5 w-5` | 検索アイコン（Search） | `text-slate-500` |
| **検索バー補助アイコン** | 16px | `h-4 w-4` | QRスキャン（QrCode）、クリア（X） | `text-slate-500` |
| **プライマリアクションボタンアイコン（PC）** | 20px | `h-5 w-5` | プライマリアクションボタン内アイコン | `text-white` |
| **プライマリアクションボタンアイコン（モバイル）** | 16px | `h-4 w-4` | モバイル用プライマリアクションボタン内アイコン | `text-white` |

### 2-2. アイコンカラー体系（詳細）

| カテゴリー | 用途 | カラー | Tailwindクラス | 実装例 |
|-----------|------|--------|----------------|--------|
| **デフォルト情報アイコン** | 一般的な情報表示 | Slate 500 | `text-slate-500` | User, Car, Clock, Tag, Folder, CarFront, Wrench |
| **重要な顧客フラグ（アクティブ）** | Starアイコン（マーク済み） | Yellow 500 | `text-yellow-500 hover:text-yellow-600` | 重要な顧客としてマーク済み |
| **重要な顧客フラグ（非アクティブ）** | Starアイコン（未マーク） | Slate 300 | `text-slate-300 hover:text-yellow-400` | 未マーク状態 |
| **クリック可能アイコン** | リンク・ボタン | Slate 500 → Blue 600 | `text-slate-500 hover:text-blue-600` | Folderアイコン、クリック可能な車両情報 |
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
| **詳細情報バッジ内アイコン** | お客様入力情報 | 白 | `text-white`（背景: `bg-blue-600`） | MessageSquare（円形背景内） |
| | 作業指示・変更申請 | 白 | `text-white`（背景: `bg-amber-600`） | Clipboard, Bell（円形背景内） |
| | 承認済み作業内容 | 白 | `text-white`（背景: `bg-blue-600`） | Wrench（円形背景内） |
| **アクションボタン内アイコン** | プライマリアクション | 白 | `text-white` | すべてのプライマリアクションボタン内アイコン |
| **セクションタイトルアイコン** | サマリー・車両一覧 | Slate 600 | `text-slate-600` | BarChart3, FileText |

### 2-3. アイコン使用ルール

- **一貫性**: 同じ意味のアイコンは同じサイズ・色を使用
- **shrink-0**: すべてのアイコンに`shrink-0`を設定（縮小防止）
- **アクセシビリティ**: 装飾的アイコンには`aria-hidden="true"`を設定

---

## 3. タイポグラフィ（文字サイズ体系）

### 3-1. 文字サイズ階層

| 階層 | 用途 | サイズ | Tailwindクラス | フォントウェイト | 色 | 実装例 |
|------|------|--------|----------------|------------------|-----|--------|
| **H1** | ページタイトル | 24px | `text-2xl` | `font-bold` | `text-slate-900` | ページメインタイトル（現在未使用） |
| **H2** | セクションタイトル | 20px | `text-xl` | `font-bold` | `text-slate-900` | 「サマリー」「車両一覧」 |
| **H3** | カードタイトル | 18px | `text-lg` | `font-semibold` | `text-slate-900` | ジョブカードの顧客名、サマリーカードタイトル |
| **Body Large** | 重要情報 | 16px | `text-base` | `font-medium` | `text-slate-900` | 車両情報（クリック可能時は`hover:text-blue-600`） |
| **Body** | 本文 | 16px | `text-base` | `font-normal` | `text-slate-700` | 一般的な本文 |
| **Body Small（主要）** | 補助情報 | 14px | `text-sm` | `font-medium` | `text-slate-700` | 入庫日時 |
| **Body Small（補助）** | 補助情報 | 14px | `text-sm` | `font-normal` | `text-slate-600` | タグ、代車、担当整備士、連絡先情報 |
| **Caption** | ラベル・バッジ | 12px | `text-xs` | `font-medium` | 状況に応じた色 | ステータスバッジ、入庫区分バッジ、詳細情報バッジ |
| **Number Large（優先度1）** | 最重要数値 | 20px | `text-xl` | `font-bold` | `text-slate-900` | サマリーカードの件数（入庫待ち、診断待ち） |
| **Number Medium（優先度2-3）** | 通常数値 | 18px | `text-lg` | `font-bold` | `text-slate-900` | サマリーカードの件数（その他のステータス） |

### 3-2. 文字カラー体系

| 用途 | カラー | Tailwindクラス | 説明 |
|------|--------|----------------|------|
| **最重要テキスト** | Slate 900 | `text-slate-900` | 顧客名、車両情報、セクションタイトル |
| **重要テキスト** | Slate 700 | `text-slate-700` | 走行距離、時間、タグ、代車、担当整備士 |
| **補助テキスト** | Slate 600 | `text-slate-600` | 連絡先情報、補助的な情報 |
| **弱いテキスト** | Slate 500 | `text-slate-500` | ラベル、メタ情報 |
| **無効テキスト** | Slate 400 | `text-slate-400` | 無効な状態、プレースホルダー |
| **リンクテキスト** | Blue 600 | `text-blue-600` | クリック可能なリンク、ホバー時 |

### 3-3. フォントウェイト体系

| 用途 | ウェイト | Tailwindクラス | 実装例 |
|------|----------|----------------|--------|
| **見出し** | Semibold (600) | `font-semibold` | カードタイトル、セクションタイトル |
| **重要情報** | Medium (500) | `font-medium` | 車両情報、ラベル |
| **本文** | Normal (400) | `font-normal` | 一般的な本文（デフォルト） |
| **数値** | Bold (700) | `font-bold` | 件数、重要数値 |

---

## 4. カラーシステム

### 4-1. セマンティックカラー（ステータス用）

**2025年ベストプラクティス: セマンティックカラーシステム**

| ステータス | 色 | テキスト | 背景 | ボーダー | 意味 |
|-----------|-----|----------|------|---------|------|
| **入庫待ち** | Blue | `text-blue-600` | `bg-blue-50` | `border-blue-200` | 進行中・待機中 |
| **診断待ち** | Orange | `text-orange-600` | `bg-orange-50` | `border-orange-200` | 注意が必要 |
| **見積作成待ち** | Indigo | `text-indigo-600` | `bg-indigo-50` | `border-indigo-200` | 情報・管理業務 |
| **お客様承認待ち** | Amber | `text-amber-600` | `bg-amber-50` | `border-amber-200` | 承認待ち・保留（外部依存） |
| **作業待ち** | Orange | `text-orange-600` | `bg-orange-50` | `border-orange-200` | 注意が必要 |
| **引渡待ち** | Green | `text-green-600` | `bg-green-50` | `border-green-200` | 完了・成功 |

### 4-2. カテゴリーカラー（入庫区分用）

**カテゴリー色システム（ステータス色とは分離）**

| カテゴリー | 色 | テキスト | 背景 | 意味 |
|-----------|-----|----------|------|------|
| **点検・検査系** | Cyan | `text-cyan-600` | `bg-cyan-50` | 車検、12ヵ月点検 |
| **メンテナンス系** | Emerald | `text-emerald-600` | `bg-emerald-50` | エンジンオイル交換、タイヤ、その他メンテナンス |
| **修理・整備系** | Orange | `text-orange-600` | `bg-orange-50` | 修理・整備、板金・塗装 |
| **診断・トラブル系** | Rose | `text-rose-600` | `bg-rose-50` | 故障診断 |
| **カスタマイズ・特殊作業系** | Violet | `text-violet-600` | `bg-violet-50` | チューニング、コーティング、レストア |
| **その他** | Slate | `text-slate-600` | `bg-slate-50` | その他 |

### 4-3. アクションボタンカラー

| アクション | 色 | 背景 | ホバー | アイコン色 | ボタン高さ | 意味 |
|-----------|-----|------|--------|-----------|-----------|------|
| **受付を開始** | Slate | `bg-slate-600` | `hover:bg-slate-700` | `text-white` | PC: `h-12`<br>モバイル: `h-10` | 初期状態（入庫待ち） |
| **診断を開始** | Blue | `bg-blue-600` | `hover:bg-blue-700` | `text-white` | PC: `h-12`<br>モバイル: `h-10` | 診断開始（入庫済み） |
| **見積を開始** | Orange | `bg-orange-600` | `hover:bg-orange-700` | `text-white` | PC: `h-10`<br>モバイル: `h-10` | 見積作成（見積作成待ち） |
| **作業を開始** | Emerald | `bg-emerald-600` | `hover:bg-emerald-700` | `text-white` | PC: `h-12`<br>モバイル: `h-10` | 作業開始（作業待ち） |
| **引渡しを開始** | Violet | `bg-violet-600` | `hover:bg-violet-700` | `text-white` | PC: `h-10`<br>モバイル: `h-10` | 引渡し（出庫待ち） |

### 4-4. バッジカラー

| バッジタイプ | 背景 | テキスト | ボーダー | 実装例 |
|------------|------|----------|---------|--------|
| **ステータスバッジ** | 状況に応じた色 | 状況に応じた色 | 状況に応じた色 | 入庫待ち、診断待ちなど |
| **入庫区分バッジ** | `bg-slate-100` | `text-slate-700` | `border-slate-300` | 車検、12ヵ月点検など |
| **件数バッジ** | `bg-slate-100` | `text-slate-700` | `border-slate-300` | サマリーカードの件数 |
| **タグバッジ** | `bg-slate-100` | `text-slate-700` | `border-slate-300` | タグID表示 |

---

## 5. スペーシング体系

### 5-1. セクション間スペーシング

| 用途 | スペーシング | Tailwindクラス | 実装例 |
|------|------------|----------------|--------|
| **セクション間** | 24px | `mb-6` | サマリーセクションと車両一覧セクションの間 |
| **カード間** | 16px | `space-y-4` | ジョブカードリスト |
| **カード内要素間** | 6px | `space-y-1.5` | ジョブカード内の第2階層要素 |

### 5-2. 要素間スペーシング（Gap）

| 用途 | スペーシング | Tailwindクラス | モバイル対応 | 実装例 |
|------|------------|----------------|-------------|--------|
| **カードタイトル内** | 8px | `gap-2` | - | 顧客名とアイコンの間 |
| **第2階層要素** | 8px | `gap-2` | `sm:gap-3` | 入庫区分、時間、タグ |
| **補助情報** | 6px | `gap-1.5` | `sm:gap-2` | 代車、担当整備士、連絡先 |
| **バッジ内** | 6px | `gap-1.5` | - | 入庫区分バッジ内のアイコンとテキスト |

### 5-3. パディング体系

| 用途 | パディング | Tailwindクラス | 実装例 |
|------|----------|----------------|--------|
| **カードヘッダー** | 12px (下) | `pb-3` | ジョブカード、サマリーカード |
| **カードコンテンツ** | 16px | `p-4` | カード内コンテンツ |
| **バッジ** | 10px (横) / 4px (縦) | `px-2.5 py-0.5` | ステータスバッジ |
| **バッジ（大きめ）** | 10px (横) / 4px (縦) | `px-2.5 py-1` | 入庫区分バッジ、件数バッジ |
| **ボタン** | 16px (横) / 10px (縦) | `px-4 py-2.5` | プライマリアクションボタン |

---

## 6. バッジデザイン体系

### 6-1. バッジサイズ

| バッジタイプ | サイズ | Tailwindクラス | 角丸 | 実装例 |
|------------|--------|----------------|------|--------|
| **ステータスバッジ** | Small | `text-xs px-2.5 py-0.5` | `rounded-full` | ジョブカードのステータス |
| **入庫区分バッジ** | Medium | `text-xs px-2.5 py-1` | `rounded-full` | 入庫区分表示 |
| **件数バッジ** | Medium | `text-xs px-2.5 py-1` | `rounded-full` | サマリーカードの件数 |

### 6-2. バッジスタイル

**ステータスバッジ**:
```typescript
<Badge 
  variant="outline" 
  className="text-xs font-medium px-2.5 py-0.5 rounded-full {statusColor}"
>
  {status}
</Badge>
```

**入庫区分バッジ**:
```typescript
<Badge 
  variant="outline" 
  className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
>
  <Icon className="h-3.5 w-3.5 shrink-0 {categoryColor}" />
  <span className="whitespace-nowrap">{serviceKind}</span>
</Badge>
```

**件数バッジ**:
```typescript
<Badge 
  variant="outline" 
  className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full"
>
  {count}
</Badge>
```

---

## 7. カードデザイン体系

### 7-1. カード基本スタイル

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

### 7-2. カード内レイアウト

- **CardHeader**: `pb-3`（下パディング12px）
- **CardContent**: `pt-0`（ジョブカードの場合）、`flex-1 flex flex-col`（サマリーカードの場合）
- **要素間**: `space-y-1.5`（第2階層）、`space-y-2`（サマリーカード内）

---

## 8. モバイル対応方針

### 8-1. レスポンシブブレークポイント

| ブレークポイント | サイズ | 用途 |
|----------------|--------|------|
| **sm** | 640px以上 | タブレット・PC |
| **md** | 768px以上 | タブレット（横向き）・PC |
| **lg** | 1024px以上 | PC |

### 8-2. モバイル対応ルール

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

**ボタンサイズ**:
- プライマリアクション: モバイル `h-10`（40px）、PC `h-12`（48px）
- アイコンサイズ: モバイル `h-4 w-4`、PC `h-5 w-5`

### 8-3. タッチターゲット

- **最小サイズ**: 44x44px（iOS/Android推奨）
- **プライマリアクションボタン**: モバイル `h-10`（40px）、PC `h-12`（48px）
- **アイコンボタン**: 最小20x20px（`h-5 w-5`）、ただしクリック可能領域は十分に確保
- **重要な顧客フラグ（Star）**: アイコン `h-5 w-5`、ボタン全体は十分なタッチターゲットサイズ
- **検索バー**: `h-12`（48px）
- **バッジ**: `px-2.5 py-1`（十分なタッチターゲットサイズを確保）

---

## 9. インタラクション設計

### 9-1. ホバーエフェクト

| 要素 | ホバーエフェクト | Tailwindクラス | 実装例 |
|------|----------------|----------------|--------|
| **カード** | シャドウ拡大 | `hover:shadow-lg` | ジョブカード |
| **クリック可能な要素** | スケール拡大 | `hover:scale-[1.02]` | サマリーカードのステータス項目 |
| **アクティブ時** | スケール縮小 | `active:scale-[0.98]` | クリック時のフィードバック |
| **リンク** | 色変更 | `hover:text-blue-600` | 車両情報、連絡先情報 |

### 9-2. トランジション

- **標準**: `transition-all duration-200`
- **アニメーション**: `transition-all duration-300`
- **数値アニメーション**: 500ms、20ステップ

### 9-3. ハプティックフィードバック

- **軽い操作**: `triggerHapticFeedback("light")` - リンククリック、アイコンクリック
- **中程度の操作**: `triggerHapticFeedback("medium")` - ボタンクリック、重要な操作
- **成功**: `triggerHapticFeedback("success")` - 操作成功時
- **エラー**: `triggerHapticFeedback("error")` - エラー発生時

---

## 10. 検索バーデザイン

### 10-1. 検索バースタイル

```typescript
<Input
  className="h-12 text-base pl-10 pr-20"
  // アイコン: h-5 w-5 (Search)
  // クリアボタン: h-8 w-8 (X icon: h-4 w-4)
  // QRスキャンボタン: h-8 w-8 (QrCode icon: h-4 w-4)
/>
```

### 10-2. サジェストドロップダウン

- **背景**: `bg-white`
- **ボーダー**: `border border-slate-200`
- **シャドウ**: `shadow-lg`
- **最大高さ**: `max-h-80`
- **スクロール**: `overflow-y-auto`

---

## 11. サマリーカードデザイン

### 11-1. カードタイトル

```typescript
<CardTitle className="flex items-center justify-between text-lg">
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center">
      <Icon className="h-4 w-4 text-white" />
    </div>
    タイトル
  </div>
  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">
    {count}
  </Badge>
</CardTitle>
```

### 11-2. ステータス項目

```typescript
<div className="flex items-center justify-between gap-2 p-2 rounded-md transition-all duration-200">
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <Icon className="h-4 w-4 shrink-0 {color}" />
    <span className="text-sm font-medium truncate">{label}</span>
  </div>
  <span className="font-bold tabular-nums text-xl text-slate-900">
    {count}
  </span>
</div>
```

---

## 12. セクションタイトルデザイン

### 12-1. セクションタイトルスタイル

```typescript
<div className="flex items-center gap-2 mb-4">
  <Icon className="h-5 w-5 text-slate-600" />
  <h2 className="text-xl font-bold text-slate-900">セクション名</h2>
  {count && (
    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full">
      {count}件
    </Badge>
  )}
</div>
```

---

## 13. 実装チェックリスト

### 13-1. アイコン

- [ ] 適切なサイズを使用（`h-4 w-4`, `h-5 w-5`など）
- [ ] `shrink-0`を設定
- [ ] 適切な色を使用（`text-slate-500`など）
- [ ] アクセシビリティ属性を設定

### 13-2. テキスト

- [ ] 適切なサイズを使用（`text-sm`, `text-base`など）
- [ ] 適切なウェイトを使用（`font-medium`, `font-semibold`など）
- [ ] 適切な色を使用（`text-slate-900`, `text-slate-700`など）
- [ ] 長いテキストは`break-words`を使用

### 13-3. スペーシング

- [ ] モバイル対応のgapを使用（`gap-1.5 sm:gap-2`など）
- [ ] 適切なパディングを使用（`pb-3`, `px-2.5 py-1`など）
- [ ] セクション間は`mb-6`を使用

### 13-4. モバイル対応

- [ ] テキストが折り返すように設定
- [ ] バッジに`whitespace-nowrap`と`shrink-0`を設定
- [ ] レスポンシブなgapを使用
- [ ] 適切な表示/非表示を設定

---

## 14. 検索バーデザイン詳細

### 14-1. 検索バー基本仕様

**高さ**: `h-12`（48px）

**パディング**: `pl-10 pr-20`（左: 検索アイコン用、右: クリア/QRスキャンボタン用）

**テキストサイズ**: `text-base`（16px）

**アイコン**:
- 検索アイコン: `h-5 w-5 text-slate-500`（左側、`pl-10`により配置）
- QRスキャンアイコン: `h-4 w-4 text-slate-500`（右側、ボタンサイズ `h-8 w-8`）
- クリアアイコン: `h-4 w-4 text-slate-500`（右側、ボタンサイズ `h-8 w-8`）

### 14-2. サジェストドロップダウン

**背景**: `bg-white`

**ボーダー**: `border border-slate-200`

**シャドウ**: `shadow-lg`

**最大高さ**: `max-h-80`（320px）

**スクロール**: `overflow-y-auto`

**パディング**: `py-1`（項目間のスペーシング）

**項目スタイル**:
- パディング: `px-4 py-2`
- ホバー: `hover:bg-slate-50`
- テキスト: `text-sm text-slate-900`
- アイコン（検索履歴）: `h-4 w-4 text-slate-400`

---

## 15. サマリーカードデザイン詳細

### 15-1. カードタイトル

**レイアウト**: `flex items-center justify-between text-lg`

**左側（タイトル + アイコン）**:
- アイコン背景: `w-6 h-6 rounded-full bg-slate-600`
- アイコン: `h-4 w-4 text-white`
- タイトルテキスト: `text-lg`（18px）

**右側（件数バッジ）**:
- バッジ: `text-xs font-medium px-2.5 py-1 rounded-full`
- 色: `bg-slate-100 text-slate-700 border-slate-300`

### 15-2. ステータス項目

**レイアウト**: `flex items-center justify-between gap-2 p-2`

**左側（アイコン + ラベル）**:
- アイコン: `h-4 w-4 shrink-0`（ステータス別色）
- ラベル: `text-sm font-medium truncate`
  - 優先度1: `text-slate-900`
  - 優先度2-3: `text-slate-700`

**右側（件数）**:
- 優先度1: `text-xl font-bold text-slate-900 tabular-nums`（20px）
- 優先度2-3: `text-lg font-bold text-slate-900 tabular-nums`（18px）

**インタラクション**:
- ホバー: `hover:shadow-md hover:scale-[1.02]`
- アクティブ: `active:scale-[0.98]`
- 選択時: `bg-slate-100 border-2 border-slate-400 shadow-md`

---

## 16. 更新履歴

- 2025-01-XX: 初版作成（TOPページのデザインシステムをドキュメント化）
- 2025-01-XX: 全ページのヘッダー部分に適用完了（フェーズ1）
- 2025-01-XX: UI/UX詳細仕様を追加（アイコンサイズ、色、文字サイズ、モバイル対応の詳細化）

---

## 17. 関連ドキュメント

- [UI/UXガイドライン](./UI_UX_GUIDELINES.md)
- [共通コンポーネントライブラリ](./COMMON_COMPONENTS_LIBRARY.md)
- [実装ガイド](./IMPLEMENTATION_GUIDE.md)
