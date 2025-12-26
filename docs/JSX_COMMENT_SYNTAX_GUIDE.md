# JSXコメント構文ガイド

## ⚠️ 重要: 作業前に必ず確認

**このエラーは頻繁に発生します。コードを書く前に必ずこのガイドを確認してください。**

---

## 🚫 よくある間違い（ビルドエラーになる）

### 1. 要素の属性内にコメントを書く

```tsx
// ❌ エラー: Parsing ecmascript source code failed
<CardTitle className="flex items-center text-xl"> {/* コメント */}
  <div>タイトル</div>
</CardTitle>
```

### 2. 要素の直後にコメントを書く

```tsx
// ❌ エラー: Parsing ecmascript source code failed
<p className="text-base">データがありません</p> {/* 空データメッセージを統一 */}
```

### 3. 自己閉じタグの直後にコメントを書く

```tsx
// ❌ エラー: Parsing ecmascript source code failed
<Icon className="h-5 w-5" /> {/* h-4 w-4 → h-5 w-5 */}
```

---

## ✅ 正しい書き方

### 1. コメントを別の行に移動

```tsx
// ✅ 正しい
<CardTitle className="flex items-center text-xl">
  {/* コメント */}
  <div>タイトル</div>
</CardTitle>
```

### 2. 要素の前または後ろに別行で配置

```tsx
// ✅ 正しい
{/* 空データメッセージを統一 */}
<p className="text-base">データがありません</p>
```

### 3. 自己閉じタグの前または後ろに別行で配置

```tsx
// ✅ 正しい
{/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
<Icon className="h-5 w-5" />
```

---

## 📋 チェックリスト（作業前に確認）

コードを書いた後、以下のチェックリストを確認してください:

- [ ] 要素の属性内に`{/* */}`コメントがないか確認
- [ ] 要素の直後に`{/* */}`コメントがないか確認（`</p> {/* */}`のような形式）
- [ ] 自己閉じタグの直後に`{/* */}`コメントがないか確認（`<Icon /> {/* */}`のような形式）
- [ ] すべてのコメントが別の行に配置されているか確認
- [ ] `npm run build`でビルドエラーが出ないか確認

---

## 🔍 エラーメッセージの見分け方

### 典型的なエラーメッセージ

```
Parsing ecmascript source code failed
Expected '</', got '{'
```

このエラーが出たら、上記のチェックリストを確認してください。

---

## 📝 実例: よくある修正パターン

### Before（エラー）

```tsx
<div className="flex items-center justify-between gap-2 p-3 rounded-md bg-slate-50 border border-slate-200"> {/* p-2 → p-3 */}
  <span>テキスト</span>
  <span>{count}</span>
</div>
```

### After（修正後）

```tsx
{/* p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大) */}
<div className="flex items-center justify-between gap-2 p-3 rounded-md bg-slate-50 border border-slate-200">
  <span>テキスト</span>
  <span>{count}</span>
</div>
```

---

## 🎯 ルール: コメントの配置場所

1. **要素の前**: 要素全体に関する説明コメント
2. **要素の内側（最初の行）**: 要素の構造に関する説明コメント
3. **要素の後ろ（別行）**: 要素に関する補足コメント

**絶対に避けるべき場所**:
- ❌ 要素の属性内
- ❌ 要素の直後（同じ行）
- ❌ 自己閉じタグの直後（同じ行）

---

## 💡 ベストプラクティス

### 1. コメントは要素の前または内側の最初に配置

```tsx
{/* カードタイトル - フォントサイズ拡大 */}
<CardTitle className="flex items-center text-xl">
  <div>タイトル</div>
</CardTitle>
```

### 2. 複数のコメントがある場合は、それぞれ別行に

```tsx
{/* p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大) */}
{/* text-lg → text-xl (40歳以上ユーザー向け、フォントサイズ拡大) */}
<div className="flex items-center p-3 text-xl">
  <span>テキスト</span>
</div>
```

### 3. 長いコメントは要素の前の別行に

```tsx
{/* 
  改善: タッチターゲットサイズ拡大（p-2 → p-3）
  40歳以上ユーザー向けのアクセシビリティ向上
*/}
<div className="p-3">
  <span>テキスト</span>
</div>
```

---

## 🚨 緊急時の対処法

ビルドエラーが発生した場合:

1. エラーメッセージの行番号を確認
2. 該当行の`{/* */}`コメントを探す
3. コメントを別の行に移動
4. `npm run build`で再確認

---

## 📚 参考: JSXコメント構文の仕様

JSXでは、コメントは以下の形式で書く必要があります:

```tsx
{/* これは正しいコメント */}
```

しかし、**配置場所**が重要です:

- ✅ 要素の外（前または後ろの別行）
- ✅ 要素の内側（最初の行）
- ❌ 要素の属性内
- ❌ 要素の直後（同じ行）

---

## ✅ 最終確認

コードをコミットする前に、必ず以下を実行:

```bash
npm run build
```

ビルドエラーが出たら、このガイドを参照して修正してください。

---

**重要**: このエラーは頻繁に発生します。作業前に必ずこのガイドを確認し、チェックリストを実行してください。






