# アイコン・バッジ・メッセージボックスの統一ルール

## 📋 概要

本ドキュメントは、アイコン、バッジ、メッセージボックスの一貫性を確保するための統一ルールを定義します。
**40歳以上のユーザー**（特に現場で作業する整備士・スタッフ）を主な対象としており、視認性と操作性を最優先にしています。

---

## 🎨 1. アイコンサイズの統一ルール

### 1.1 基本ルール

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

### 1.2 使用例

```tsx
// ✅ 正しい使用例
// ボタン内アイコン
<Button>
  <Key className="h-5 w-5" />
  受付を開始
</Button>

// カードタイトルアイコン（背景付き）
<div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center">
  <Calendar className="h-5 w-5 text-white" />
</div>

// リストアイテムアイコン（背景付き）
<div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
  <Car className="h-4 w-4 text-slate-700" />
</div>

// バッジ内アイコン
<Badge>
  <AlertCircle className="h-4 w-4" />
  警告
</Badge>

// ❌ 間違った使用例
<Key className="h-3 w-3" />  // 小さすぎる
<Key className="size-3" />   // 小さすぎる
```

### 1.3 アイコンカラーの統一ルール

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

---

## 🏷️ 2. バッジの統一ルール

### 2.1 バッジサイズの統一ルール

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

### 2.2 バッジバリアントの統一ルール

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

### 2.3 バッジの使用例

```tsx
// ✅ 正しい使用例
// 標準バッジ
<Badge variant="default" className="text-base px-2.5 py-1">
  入庫待ち
</Badge>

// ステータスバッジ（カスタム）
<Badge variant="outline" className="bg-green-50 text-green-900 border-green-300 text-base px-2.5 py-1">
  完了
</Badge>

// カウントバッジ（小さなバッジ）
<Badge variant="secondary" className="text-base px-2 py-0.5">
  5
</Badge>

// アイコン付きバッジ
<Badge variant="outline" className="text-base px-2.5 py-1">
  <AlertCircle className="h-4 w-4" />
  警告
</Badge>

// ❌ 間違った使用例
<Badge className="text-xs">  // 小さすぎる
<Badge className="text-sm">  // 小さすぎる
```

### 2.4 バッジの色の統一ルール

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

---

## 💬 3. メッセージボックスの統一ルール

### 3.1 メッセージボックスの種類

```typescript
// メッセージボックスの種類
export const messageBoxTypes = {
  // Alertコンポーネント（インライン通知）
  alert: "Alert",
  
  // Toast通知（一時的な通知）
  toast: "Toast",
  
  // ダイアログ（重要な確認）
  dialog: "Dialog",
};
```

### 3.2 Alert（インライン通知）の統一ルール

```tsx
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

// ステータス別のAlert
// 成功
<Alert className="bg-green-50 text-green-900 border-green-300 p-4">
  <CheckCircle2 className="h-5 w-5 text-green-900" />
  <AlertTitle className="text-base font-semibold text-green-900">
    成功
  </AlertTitle>
  <AlertDescription className="text-base text-green-900">
    処理が完了しました
  </AlertDescription>
</Alert>

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

// エラー
<Alert className="bg-red-50 text-red-900 border-red-300 p-4">
  <AlertCircle className="h-5 w-5 text-red-900" />
  <AlertTitle className="text-base font-semibold text-red-900">
    エラー
  </AlertTitle>
  <AlertDescription className="text-base text-red-900">
    エラーが発生しました
  </AlertDescription>
</Alert>

// 情報
<Alert className="bg-blue-50 text-blue-900 border-blue-300 p-4">
  <Info className="h-5 w-5 text-blue-900" />
  <AlertTitle className="text-base font-semibold text-blue-900">
    情報
  </AlertTitle>
  <AlertDescription className="text-base text-blue-900">
    お知らせがあります
  </AlertDescription>
</Alert>
```

### 3.3 Toast通知の統一ルール

```tsx
// Toast通知の統一ルール（Sonnerを使用）
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

### 3.4 メッセージボックスの色の統一ルール

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

### 3.5 メッセージボックスのタイポグラフィ統一ルール

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

---

## ✅ 4. チェックリスト

### 4.1 アイコンのチェックリスト

- [ ] アイコンサイズは `h-4 w-4` (16px) 以上を使用しているか？
- [ ] `h-3 w-3` (12px) や `size-3` (12px) を使用していないか？
- [ ] ボタン内アイコンは `h-5 w-5` (20px) を使用しているか？
- [ ] カードタイトルアイコンは背景付きで `w-6 h-6` (24px) コンテナ + `h-5 w-5` (20px) アイコンを使用しているか？
- [ ] リストアイテムアイコンは背景付きで `w-6 h-6` (24px) コンテナ + `h-4 w-4` (16px) アイコンを使用しているか？
- [ ] バッジ内アイコンは `h-4 w-4` (16px) を使用しているか？
- [ ] アイコンカラーは適切なコントラスト比（4.5:1以上）を確保しているか？

### 4.2 バッジのチェックリスト

- [ ] バッジのテキストサイズは `text-base` (16px) 以上を使用しているか？
- [ ] `text-xs` (12px) や `text-sm` (14px) を使用していないか？
- [ ] バッジのパディングは `px-2.5 py-1` 以上を使用しているか？
- [ ] ステータスバッジの色は `-900` テキスト + `-300` ボーダーを使用しているか？
- [ ] バッジ内アイコンは `h-4 w-4` (16px) を使用しているか？

### 4.3 メッセージボックスのチェックリスト

- [ ] メッセージボックスのテキストサイズは `text-base` (16px) 以上を使用しているか？
- [ ] `text-xs` (12px) や `text-sm` (14px) を使用していないか？
- [ ] メッセージボックスの色は `-900` テキスト + `-300` ボーダーを使用しているか？
- [ ] メッセージボックス内アイコンは `h-5 w-5` (20px) を使用しているか？
- [ ] メッセージボックスのパディングは `p-4` 以上を使用しているか？

---

## 📝 5. 実装例

### 5.1 アイコン + バッジの組み合わせ

```tsx
// ✅ 正しい実装例
<div className="flex items-center gap-2">
  <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center">
    <Calendar className="h-5 w-5 text-white" />
  </div>
  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base px-2.5 py-1">
    <AlertCircle className="h-4 w-4" />
    警告
  </Badge>
</div>
```

### 5.2 メッセージボックス + アイコンの組み合わせ

```tsx
// ✅ 正しい実装例
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

---

## 🎯 6. 優先度

- **優先度: 高** - 40歳以上ユーザーにとって最重要
- **影響範囲**: 全コンポーネント（約200箇所）
- **実装期間**: 2-3日

---

## 📚 7. 参考資料

- [FINAL_UIUX_IMPROVEMENT_PROPOSAL.md](./FINAL_UIUX_IMPROVEMENT_PROPOSAL.md) - UIUX改善最終提案書
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - Web Content Accessibility Guidelines



