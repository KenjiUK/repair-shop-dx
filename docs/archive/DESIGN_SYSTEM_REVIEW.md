# DESIGN_SYSTEM.md レビュー結果

**レビュー日**: 2025-01-XX  
**対象**: `docs/DESIGN_SYSTEM.md` と実際の実装の比較

---

## 1. 実装とドキュメントの不一致

### 1-1. テキストサイズの使用状況

**ドキュメントの記載:**
- `text-xs` (12px) と `text-sm` (14px) は使用禁止（視認性が低すぎる）
- 推奨: `text-base` (16px) 以上

**実際の実装:**
- ❌ `text-xs` が使用されている箇所:
  - `src/components/features/job-search-bar.tsx`: バッジ内の件数表示（`text-xs`）
  - `src/app/page.tsx`: フィルターボタン内の件数表示（`text-xs`）
  
- ❌ `text-sm` が使用されている箇所:
  - `src/components/features/job-search-bar.tsx`: 「最近の検索」ラベル（`text-sm`）
  - その他複数箇所で使用

**推奨対応:**
- すべて `text-base` (16px) に統一する
- 特にバッジ内のテキストは `text-base` を使用

### 1-2. アイコンサイズの使用状況

**ドキュメントの記載:**
- `h-3 w-3` (12px) や `size-3` (12px) の使用は禁止
- 最小サイズ: `h-4 w-4` (16px) 以上

**実際の実装:**
- ✅ ほとんどの箇所で `h-4 w-4` 以上を使用（良好）
- ⚠️ `h-3.5 w-3.5` (14px) は使用されているが、ドキュメントでは許可されている

**推奨対応:**
- `h-3.5 w-3.5` の使用は継続可（ドキュメントに明記されているため）

### 1-3. バッジのテキストサイズ

**ドキュメントの記載:**
- バッジのテキストサイズは `text-base` (16px) 以上を使用
- `text-xs` (12px) や `text-sm` (14px) は禁止

**実際の実装:**
- ❌ 一部のバッジで `text-xs` が使用されている
- ✅ 詳細情報バッジでは `text-base` を使用（正しい）

**推奨対応:**
- すべてのバッジのテキストサイズを `text-base` に統一

---

## 2. ドキュメントに記載されていない実装

### 2-1. Sheet（サイドパネル）コンポーネント

**実装状況:**
- `src/components/ui/sheet.tsx` が存在
- 使用箇所:
  - `src/components/features/courtesy-car-inventory-card.tsx`
  - `src/components/features/vehicle-detail-dialog.tsx`
  - `src/components/features/courtesy-car-list-dialog.tsx`

**ドキュメントの記載:**
- ❌ Sheetコンポーネントに関する記載がない

**推奨追加内容:**
```markdown
## 21. Sheet（サイドパネル）

### 21-1. Sheet基本スタイル

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
```

### 2-2. スケルトン（ローディング）コンポーネント

**実装状況:**
- `src/components/ui/skeleton.tsx` が存在
- 使用箇所: 複数のページで使用

**ドキュメントの記載:**
- ❌ スケルトンコンポーネントに関する記載がない

**推奨追加内容:**
```markdown
## 22. スケルトン（ローディング状態）

### 22-1. Skeleton基本スタイル

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
```

### 2-3. Dialog（ダイアログ）の詳細仕様

**実装状況:**
- `src/components/ui/dialog.tsx` が存在
- デフォルトスタイルが実装されている

**ドキュメントの記載:**
- ⚠️ Dialogの基本スタイルは記載されているが、詳細な仕様が不足

**推奨追加内容:**
```markdown
## 23. Dialog（ダイアログ）の詳細仕様

### 23-1. DialogContentのデフォルトスタイル

**実装されているスタイル:**
- 最大幅: `max-w-[calc(100%-2rem)]` (モバイル), `sm:max-w-lg` (PC)
- パディング: `p-6` (24px)
- 角丸: `rounded-lg` (8px)
- シャドウ: `shadow-lg`
- アニメーション: `fade-in-0`, `zoom-in-95`

### 23-2. DialogTitleのデフォルトスタイル

- フォントサイズ: `text-lg` (18px)
- フォントウェイト: `font-semibold` (600)
- 行の高さ: `leading-none`

### 23-3. DialogDescriptionのデフォルトスタイル

- フォントサイズ: `text-base` (16px)
- 色: `text-muted-foreground`

### 23-4. DialogCloseボタン

- 位置: `absolute top-4 right-4`
- アイコンサイズ: `size-4` (16px)
- 透明度: `opacity-70` → `hover:opacity-100`
```

### 2-4. 検索バーのスタイル

**実装状況:**
- `src/components/features/job-search-bar.tsx` が存在
- オートコンプリート機能あり

**ドキュメントの記載:**
- ❌ 検索バーのスタイル仕様が記載されていない

**推奨追加内容:**
```markdown
## 24. 検索バー

### 24-1. 検索バーの基本スタイル

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
```

---

## 3. 明示的に定められていないもの

### 3-1. エラー表示のスタイル

**実装状況:**
- `src/components/features/error-message.tsx` が存在
- Alertコンポーネントを使用

**ドキュメントの記載:**
- ⚠️ Alertの基本スタイルは記載されているが、エラー表示の具体的な使い方が不足

**推奨追加内容:**
```markdown
## 25. エラー表示

### 25-1. エラーメッセージのスタイル

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
```

### 3-2. ローディング状態の表示

**実装状況:**
- `Loader2` アイコンを使用
- 複数の箇所で使用されている

**ドキュメントの記載:**
- ❌ ローディング状態の表示方法が記載されていない

**推奨追加内容:**
```markdown
## 26. ローディング状態

### 26-1. ローディングアイコン

**Loader2アイコン:**
- サイズ: `h-5 w-5` (20px)
- アニメーション: `animate-spin`
- 色: ボタン内では `text-white`、その他は `text-slate-600`

**実装例:**
```typescript
<Loader2 className="h-5 w-5 animate-spin" />
```

### 26-2. ボタン内のローディング表示

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
```

### 3-3. トースト通知の詳細仕様

**実装状況:**
- Sonnerライブラリを使用
- `toast.success`, `toast.error` など

**ドキュメントの記載:**
- ⚠️ 基本的な使い方は記載されているが、詳細なカスタマイズ方法が不足

**推奨追加内容:**
```markdown
## 27. トースト通知の詳細仕様

### 27-1. トーストのカスタマイズ

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
```

### 3-4. フォームバリデーションの表示

**実装状況:**
- 複数のフォームでバリデーションが実装されている

**ドキュメントの記載:**
- ❌ フォームバリデーションの表示方法が記載されていない

**推奨追加内容:**
```markdown
## 28. フォームバリデーション

### 28-1. エラー状態のInput

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

### 28-2. 必須フィールドの表示

```typescript
<Label htmlFor="field-name" className="text-base font-medium text-slate-900">
  フィールド名
  <span className="text-red-600 ml-1">*</span>
</Label>
```
```

---

## 4. ドキュメントの改善提案

### 4-1. 実装例の追加

**現状:**
- 基本的な実装例は記載されているが、実際のコンポーネントの実装例が不足

**推奨:**
- 主要コンポーネント（JobCard, SummaryCardなど）の実装例を追加
- 実際のコードスニペットを引用

### 4-2. 禁止事項の明確化

**現状:**
- `text-xs` と `text-sm` の禁止は記載されているが、具体的な置き換え方法が不足

**推奨:**
- 禁止されているクラスと推奨される置き換え方法を表形式で明記
- 例: `text-xs` → `text-base`, `h-3 w-3` → `h-4 w-4`

### 4-3. コンポーネント別のスタイルガイド

**現状:**
- 全体的なスタイルガイドはあるが、コンポーネント別の詳細が不足

**推奨:**
- 主要コンポーネント（JobCard, SummaryCard, Dialog, Sheetなど）ごとのスタイルガイドを追加
- 各コンポーネントの必須スタイル、推奨スタイル、禁止スタイルを明記

### 4-4. レスポンシブデザインの詳細

**現状:**
- 基本的なブレークポイントは記載されているが、コンポーネント別のレスポンシブ対応が不足

**推奨:**
- 各コンポーネントのモバイル/PCでの表示の違いを明記
- 例: JobCardのモバイル表示、SummaryCardの横スクロールなど

---

## 5. 実装で確認すべき項目

### 5-1. 一貫性の確認

- [ ] すべてのバッジで `text-base` を使用しているか
- [ ] すべてのアイコンで `h-4 w-4` 以上を使用しているか
- [ ] すべてのボタンで `h-12` (48px) を使用しているか
- [ ] すべての入力フィールドで `h-12` (48px) を使用しているか

### 5-2. アクセシビリティの確認

- [ ] すべてのインタラクティブ要素に適切な `aria-label` が設定されているか
- [ ] すべてのフォーム要素に適切な `aria-required`, `aria-invalid` が設定されているか
- [ ] すべてのエラーメッセージに `role="alert"` が設定されているか

### 5-3. カラーの確認

- [ ] すべてのテキストと背景のコントラスト比が4.5:1以上か
- [ ] ステータスバッジの色が統一されているか
- [ ] 入庫区分バッジの色が統一されているか

---

## 6. まとめ

### 6-1. 優先度の高い改善項目

1. **text-xs と text-sm の置き換え** (高優先度)
   - すべての `text-xs` を `text-base` に置き換え
   - すべての `text-sm` を `text-base` に置き換え（必要に応じて）

2. **Sheetコンポーネントのドキュメント追加** (中優先度)
   - Sheetの基本スタイルと使い方を追加

3. **スケルトンコンポーネントのドキュメント追加** (中優先度)
   - スケルトンの基本スタイルと使い方を追加

4. **検索バーのドキュメント追加** (中優先度)
   - 検索バーのスタイルとオートコンプリート機能を追加

### 6-2. 優先度の低い改善項目

1. **実装例の追加** (低優先度)
   - 主要コンポーネントの実装例を追加

2. **コンポーネント別スタイルガイド** (低優先度)
   - 各コンポーネントの詳細なスタイルガイドを追加

---

## 7. 次のステップ

1. **実装の修正**
   - `text-xs` と `text-sm` を `text-base` に置き換え
   - バッジのテキストサイズを統一

2. **ドキュメントの更新**
   - Sheet、Skeleton、検索バーの仕様を追加
   - エラー表示、ローディング状態の仕様を追加
   - 実装例を追加

3. **レビューの継続**
   - 定期的に実装とドキュメントを比較
   - 新しいコンポーネント追加時にドキュメントも更新

