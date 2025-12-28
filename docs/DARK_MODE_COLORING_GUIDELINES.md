# ダークモードカラーリングガイドライン

**作成日:** 2025-01-XX  
**目的:** アプリケーション全体でダークモードのカラーリングを一貫して適用するためのガイドライン

---

## 1. 基本方針

ダークモードでは、視認性と一貫性を保つため、以下の背景色階層を使用します：

```
ページ背景（最外層）
  ├─ レイアウト背景: slate-900 (oklch(0.145 0 0))
  ├─ メインコンテンツ背景: slate-900 (oklch(0.145 0 0))
  ├─ Cardコンポーネント: --card変数 (oklch(0.173 0 0)) ※slate-800相当
  └─ フッター: slate-800
```

---

## 2. 背景色のルール

### 2-1. ページ背景（最外層）

**レイアウトコンポーネント** (`app-layout-client.tsx`):
```tsx
className="flex-1 flex flex-col transition-all duration-300 bg-slate-50 dark:bg-slate-900"
```

**メインコンテンツ** (`min-h-screen`のdiv):
```tsx
className="min-h-screen bg-slate-50 dark:bg-slate-900"
```

### 2-2. Cardコンポーネント

**原則:** `bg-card` CSS変数のみを使用し、`dark:bg-slate-800`を明示的に指定しない

**正しい実装:**
```tsx
<Card className="border-slate-200 shadow-md dark:border-slate-700">
  {/* コンテンツ */}
</Card>
```

**誤った実装:**
```tsx
// ❌ dark:bg-slate-800を明示的に指定しない
<Card className="border-slate-200 shadow-md dark:border-slate-700 dark:bg-slate-800">
  {/* コンテンツ */}
</Card>
```

**理由:** `bg-card` CSS変数（`oklch(0.173 0 0)` = slate-800相当）が自動的に適用されるため、明示的な指定は不要で、一貫性を損なう可能性があります。

### 2-3. CSS変数の設定 (`globals.css`)

```css
.dark {
  --background: oklch(0.145 0 0);  /* slate-900相当 */
  --card: oklch(0.173 0 0);         /* slate-800相当 */
  --card-foreground: oklch(0.985 0 0); /* 白 */
  /* ... */
}
```

### 2-4. フッター

**固定フッター** (ボタンエリアなど):
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
  {/* コンテンツ */}
</div>
```

---

## 3. ボーダー色のルール

### 3-1. Cardコンポーネント

**ライトモード:**
```tsx
border-slate-200 または border-slate-300
```

**ダークモード:**
```tsx
dark:border-slate-700
```

### 3-2. 実装例

```tsx
<Card className="border border-slate-200 dark:border-slate-700">
  {/* コンテンツ */}
</Card>
```

---

## 4. テキスト色のルール

### 4-1. カード内のテキスト

**原則:** `text-card-foreground` CSS変数を使用（Cardコンポーネントで自動適用）

**明示的に指定する場合:**
```tsx
<CardTitle className="text-slate-900 dark:text-white">
  {/* タイトル */}
</CardTitle>
```

### 4-2. メインコンテンツのテキスト

**背景が`dark:bg-slate-900`の場合:**
```tsx
className="text-slate-900 dark:text-white"
```

---

## 5. 内部要素の例外ルール

### 5-1. 画像プレビュー、ボタンなど

Cardコンポーネント内部の機能的な要素（画像プレビュー、インタラクティブなボタンなど）は、以下のように明示的に`dark:bg-slate-800`を指定しても問題ありません：

```tsx
<div className="bg-slate-100 dark:bg-slate-800">
  {/* 画像プレビューなど */}
</div>

<button className="dark:bg-slate-800 dark:hover:bg-slate-700">
  {/* ボタン */}
</button>
```

**理由:** これらはCardコンポーネント自体ではなく、機能的な要素のため、視認性を確保するために適切な背景色を明示的に指定します。

---

## 6. チェックリスト

新しいページまたはコンポーネントを作成・修正する際は、以下の項目を確認してください：

- [ ] レイアウト背景に`dark:bg-slate-900`が適用されているか
- [ ] メインコンテンツ背景に`dark:bg-slate-900`が適用されているか
- [ ] Cardコンポーネントで`dark:bg-slate-800`を明示的に指定していないか（`bg-card`のみ使用）
- [ ] フッター（固定ボタンエリアなど）に`dark:bg-slate-800`が適用されているか
- [ ] ボーダーに`dark:border-slate-700`が適用されているか
- [ ] テキスト色に`dark:text-white`が適用されているか（必要に応じて）

---

## 7. 実装済みページ

- ✅ `/mechanic/diagnosis/[id]` - 診断ページ（2025-01-XX適用）

---

## 8. 適用が必要なページ（優先順位順）

1. `/customer/approval/[id]` - 顧客承認ページ
2. `/` - TOPページ（JobCardなど）
3. その他のページ

---

## 9. 関連ファイル

- `src/app/globals.css` - CSS変数の定義
- `src/components/ui/card.tsx` - Cardコンポーネントの基本実装
- `src/components/layout/app-layout-client.tsx` - レイアウトコンポーネント

---

## 10. 参考

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - デザインシステム全体のガイドライン

