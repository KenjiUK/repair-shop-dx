# ヘッダーとレイアウト実装ガイド

**最終更新日**: 2025-01-XX  
**バージョン**: 1.0  
**目的**: ヘッダーの高さ管理とコンテンツの余白設定に関する実装詳細とトラブルシューティング

---

## 目次

1. [概要](#概要)
2. [実装の基本原則](#実装の基本原則)
3. [ヘッダーの高さ管理](#ヘッダーの高さ管理)
4. [コンテンツの余白設定](#コンテンツの余白設定)
5. [よくある問題と解決策](#よくある問題と解決策)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概要

このアプリケーションでは、`position: fixed`のヘッダーを使用しており、ヘッダーの高さが動的に変わる可能性があります（整備士の追加、展開/縮小など）。コンテンツがヘッダーの下に隠れないように、適切な余白を設定する必要があります。

### 重要な原則

1. **スクロール位置の調整は行わない**: ヘッダーの高さが変わっても、`window.scrollBy`などでスクロール位置を調整してはいけません。これが無限ループの原因になります。
2. **CSS変数で高さを管理**: ヘッダーの高さはCSS変数`--header-height`で管理し、コンテンツの`padding-top`に使用します。
3. **レイアウトシフトを防止**: `useLayoutEffect`を使用してレンダリング前に高さを更新します。

---

## 実装の基本原則

### 1. ヘッダーの実装

ヘッダーは`position: fixed`で固定されています：

```typescript
// src/components/layout/app-header.tsx
<header
  ref={headerRef}
  className={cn(
    "fixed top-0 left-0 right-0 z-[40] bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300",
    isSidebarOpen && "ml-64",
  )}
>
```

### 2. 高さの測定とCSS変数の設定

ヘッダーの高さは`useLayoutEffect`と`ResizeObserver`で測定し、CSS変数として設定します：

```typescript
// src/components/layout/app-header.tsx
useLayoutEffect(() => {
  if (!headerRef.current) return;

  const updateHeight = () => {
    if (headerRef.current) {
      const currentHeight = headerRef.current.offsetHeight;
      // CSS変数を設定（コンテンツのパディングに使用）
      // useLayoutEffect内なので同期的に更新してレイアウトシフトを防止
      document.documentElement.style.setProperty('--header-height', `${currentHeight}px`);
    }
  };

  // 初回測定（レンダリング前に即座に実行）
  updateHeight();

  // ResizeObserverで高さの変化を監視
  const resizeObserver = new ResizeObserver(() => {
    // useLayoutEffect内なので同期的に更新
    updateHeight();
  });
  resizeObserver.observe(headerRef.current);

  return () => {
    resizeObserver.disconnect();
  };
}, [isHeaderExpanded, children]);
```

**重要なポイント:**
- `useLayoutEffect`を使用することで、レンダリング前に高さを更新できます
- `ResizeObserver`で高さの変化を監視し、自動的にCSS変数を更新します
- **スクロール位置の調整は行いません**（`window.scrollBy`などは使用しない）

### 3. 初期値の設定

CSS変数の初期値は`globals.css`で設定します：

```css
/* src/app/globals.css */
html {
  --header-height: 176px; /* 初期値、AppHeaderで動的に更新される */
  scrollbar-gutter: stable; /* スクロールバーの幅を確保してレイアウトシフトを防止 */
}
```

---

## コンテンツの余白設定

### 1. 基本パターン

すべてのページの`main`要素で、以下のように`padding-top`を設定します：

```typescript
<main 
  className="max-w-4xl mx-auto px-4 py-6" 
  style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}
>
```

**説明:**
- `var(--header-height, 176px)`: ヘッダーの高さ（初期値176px）
- `+ 1.5rem`: デザインシステムのセクション間スペーシング（24px）

### 2. ページ別の設定

#### TOPページ

```typescript
// src/app/page.tsx
<main 
  id="main-content" 
  className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full" 
  style={{ paddingTop: 'calc(var(--header-height, 80px) + 1.5rem)' }}
>
```

**注意:** TOPページのヘッダーは小さいため、初期値は80pxです。

#### 下層ページ（診断、作業、見積など）

```typescript
// src/app/mechanic/diagnosis/[id]/page.tsx
<main 
  className="max-w-4xl mx-auto px-4 py-6 pb-32" 
  style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}
>
```

**注意:** 下層ページのヘッダーは大きいため、初期値は176pxです。

### 3. 実装例

すべてのページで同じパターンを使用します：

```typescript
// 診断ページ
<main className="max-w-4xl mx-auto px-4 py-6 pb-32" 
  style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>

// 作業ページ
<main className="max-w-4xl mx-auto px-4 py-6" 
  style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>

// 見積ページ
<main className="max-w-7xl mx-auto px-4 py-6" 
  style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>

// 報告ページ
<main className="max-w-5xl mx-auto px-4 py-6" 
  style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
```

---

## よくある問題と解決策

### 問題1: ヘッダーとコンテンツが重なる

**症状:** ページを読み込んだ時や、ヘッダーの高さが変わった時に、コンテンツがヘッダーの下に隠れる

**原因:**
- `main`要素に`padding-top`が設定されていない
- CSS変数`--header-height`が正しく更新されていない

**解決策:**
1. `main`要素に`style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}`を追加
2. ヘッダーの高さ測定が正しく動作しているか確認（`useLayoutEffect`と`ResizeObserver`）

### 問題2: 無限ループでヘッダーが展開/縮小を繰り返す

**症状:** スクロール時にヘッダーが展開と縮小を無限に繰り返す

**原因:**
- ヘッダーの高さ変更時に`window.scrollBy`でスクロール位置を調整している
- スクロール位置の調整がスクロールイベントを発火させ、それがまた状態を変える

**解決策:**
- **`window.scrollBy`によるスクロール位置調整を削除**
- ヘッダーの高さが変わっても、スクロール位置は調整しない
- コンテンツの`padding-top`のみを更新する

### 問題3: モーダルを閉じた後にコンテンツがカクカクずれる

**症状:** 整備士を選択するモーダルを閉じた後、コンテンツが下右にカクカクずれる

**原因:**
- モーダルを閉じた直後にデータが更新され、ヘッダーの高さが変わる
- レイアウトシフトが発生している

**解決策:**
1. `useLayoutEffect`を使用してレンダリング前に高さを更新
2. モーダルを先に閉じてから、`requestAnimationFrame`でデータを更新：

```typescript
// モーダルを先に閉じてからデータを更新（レイアウトシフトを防止）
setIsMechanicDialogOpen(false);

// 次のフレームでデータを更新（モーダルが完全に閉じた後）
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    mutateJob();
  });
});
```

### 問題4: スクロールバーが2つ表示される

**症状:** 画面の高さを低くすると、右側にスクロールバーが2つ表示される

**原因:**
- `html`と`body`に`overflow-y: auto`が設定されている
- レイアウトコンテナにも`overflow-auto`が設定されている

**解決策:**
```css
/* src/app/globals.css */
html {
  overflow-x: hidden;
  /* overflow-yは設定しない（window.scrollYと競合するため） */
  scrollbar-gutter: stable; /* スクロールバーの幅を確保 */
}

body {
  overflow-x: hidden;
  /* overflow-yは設定しない（window.scrollYと競合するため） */
}
```

---

## トラブルシューティング

### チェックリスト

問題が発生した場合、以下を確認してください：

1. **ヘッダーの高さ測定**
   - [ ] `app-header.tsx`で`useLayoutEffect`を使用しているか
   - [ ] `ResizeObserver`が正しく設定されているか
   - [ ] CSS変数`--header-height`が更新されているか（開発者ツールで確認）

2. **コンテンツの余白**
   - [ ] すべての`main`要素に`padding-top`が設定されているか
   - [ ] `padding-top`の値が`calc(var(--header-height, 176px) + 1.5rem)`になっているか
   - [ ] 初期値（176pxまたは80px）が適切か

3. **スクロール位置の調整**
   - [ ] `window.scrollBy`を使用していないか
   - [ ] スクロール位置を調整するコードがないか

4. **モーダル後の処理**
   - [ ] モーダルを閉じた後に`requestAnimationFrame`でデータを更新しているか
   - [ ] レイアウトシフトが発生していないか

### デバッグ方法

1. **CSS変数の確認**
   ```javascript
   // ブラウザのコンソールで実行
   getComputedStyle(document.documentElement).getPropertyValue('--header-height')
   ```

2. **ヘッダーの高さの確認**
   ```javascript
   // ブラウザのコンソールで実行
   document.querySelector('header').offsetHeight
   ```

3. **レイアウトシフトの確認**
   - Chrome DevToolsのPerformanceタブで「Layout Shift」を確認
   - レイアウトシフトが発生している場合は、`useLayoutEffect`の使用を確認

---

## 実装ファイル一覧

### 主要ファイル

- `src/components/layout/app-header.tsx`: ヘッダーコンポーネントと高さ測定
- `src/app/globals.css`: CSS変数の初期値設定
- `src/app/page.tsx`: TOPページの実装例
- `src/app/mechanic/diagnosis/[id]/page.tsx`: 診断ページの実装例
- `src/app/mechanic/work/[id]/page.tsx`: 作業ページの実装例
- `src/app/admin/estimate/[id]/page.tsx`: 見積ページの実装例
- `src/app/presentation/[id]/page.tsx`: 報告ページの実装例

### 関連ファイル

- `src/components/layout/app-header-collapse-v2.ts`: ヘッダーの展開/縮小ロジック
- `src/components/layout/app-layout-client.tsx`: レイアウトコンテナ

---

## まとめ

### 重要なポイント

1. **スクロール位置の調整は行わない**: `window.scrollBy`は使用しない
2. **CSS変数で高さを管理**: `--header-height`を使用
3. **useLayoutEffectを使用**: レンダリング前に高さを更新
4. **すべてのページで同じパターン**: `padding-top: calc(var(--header-height, 176px) + 1.5rem)`
5. **モーダル後の処理**: `requestAnimationFrame`でデータを更新

### 将来の変更時の注意点

- ヘッダーの構造を変更する場合は、高さ測定ロジックを確認
- 新しいページを追加する場合は、`main`要素に`padding-top`を設定
- スクロール位置を調整する必要がある場合は、このドキュメントを再確認

---

**更新履歴:**
- 2025-01-XX: 初版作成（無限ループ問題の解決、モーダル後のレイアウトシフト問題の解決）






