# Vercelデプロイメントチェックリスト

**プロジェクト名**: 整備工場DXプラットフォーム  
**バージョン**: 1.0.0-beta.1  
**最終更新日**: 2025-01-XX

---

## 目次

1. [Server/Client Boundaryの違反](#1-serverclient-boundaryの違反)
2. [Hydration Mismatchのリスク](#2-hydration-mismatchのリスク)
3. [データフェッチとキャッシュ](#3-データフェッチとキャッシュ)
4. [環境変数の設定](#4-環境変数の設定)
5. [画像とアセット](#5-画像とアセット)
6. [ビルド時のエラー](#6-ビルド時のエラー)
7. [APIルートとミドルウェア](#7-apiルートとミドルウェア)
8. [動的インポートとコード分割](#8-動的インポートとコード分割)
9. [メタデータとSEO](#9-メタデータとseo)
10. [フォントとスタイリング](#10-フォントとスタイリング)
11. [静的生成と動的レンダリング](#11-静的生成と動的レンダリング)
12. [エクスポートと設定](#12-エクスポートと設定)
13. [パフォーマンスと最適化](#13-パフォーマンスと最適化)
14. [セキュリティ](#14-セキュリティ)

---

## 1. Server/Client Boundaryの違反

### 1-1. シリアライズできないデータの受け渡し

- [ ] Server ComponentからClient Componentへ関数を渡していないか？
  ```typescript
  // ❌ エラー
  <ClientComponent onClick={() => {}} />
  
  // ✅ 正しい
  <ClientComponent onClick={handleClick} />
  ```

- [ ] Server ComponentからClient ComponentへDate型を直接渡していないか？
  ```typescript
  // ❌ エラー
  <ClientComponent date={new Date()} />
  
  // ✅ 正しい
  <ClientComponent date={new Date().toISOString()} />
  ```

- [ ] Server ComponentからClient Componentへクラスインスタンスを渡していないか？
  ```typescript
  // ❌ エラー
  <ClientComponent data={new MyClass()} />
  
  // ✅ 正しい
  <ClientComponent data={JSON.parse(JSON.stringify(myClassInstance))} />
  ```

- [ ] Server ComponentからClient ComponentへSymbol、undefined、BigIntを渡していないか？

### 1-2. `use client`ディレクティブの確認

- [ ] `useState`, `useEffect`, `useRouter`等のフックを使用するコンポーネントに`'use client'`が設定されているか？
  ```typescript
  // ❌ エラー
  export function MyComponent() {
    const [state, setState] = useState();
    // ...
  }
  
  // ✅ 正しい
  'use client';
  export function MyComponent() {
    const [state, setState] = useState();
    // ...
  }
  ```

- [ ] イベントハンドラー（`onClick`, `onChange`等）を使用するコンポーネントに`'use client'`が設定されているか？

- [ ] ブラウザAPI（`window`, `document`, `localStorage`等）を使用するコンポーネントに`'use client'`が設定されているか？

### 1-3. 非同期コンポーネントのインポート

- [ ] 非同期Server Component（`async`関数）をClient Componentとしてインポートしていないか？
  ```typescript
  // ❌ エラー
  'use client';
  import { AsyncServerComponent } from './server-component';
  
  // ✅ 正しい
  // Server Componentは直接インポートせず、childrenとして渡す
  ```

- [ ] Server ComponentをClient Componentに直接インポートしていないか？

---

## 2. Hydration Mismatchのリスク

### 2-1. HTMLの不正なネスト

- [ ] `<p>`タグの中に`<div>`や`<ul>`などのブロック要素がないか？
  ```typescript
  // ❌ エラー
  <p>
    <div>Content</div>
  </p>
  
  // ✅ 正しい
  <p>
    <span>Content</span>
  </p>
  ```

- [ ] `<a>`タグの中に`<a>`タグがないか？（ネストされたリンク）

- [ ] インライン要素の中にブロック要素がないか？

### 2-2. サーバーとクライアントで異なるレンダリング結果

- [ ] `Date.now()`や`Math.random()`が直接レンダリングに含まれていないか？
  ```typescript
  // ❌ エラー（サーバーとクライアントで異なる値）
  <div>{Date.now()}</div>
  
  // ✅ 正しい
  'use client';
  const [timestamp, setTimestamp] = useState(Date.now());
  ```

- [ ] `window`オブジェクトに依存したロジックが直接レンダリングに含まれていないか？
  ```typescript
  // ❌ エラー（サーバーで`window`は未定義）
  <div>{window.innerWidth}</div>
  
  // ✅ 正しい
  'use client';
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
  }, []);
  ```

- [ ] `localStorage`や`sessionStorage`に依存したロジックが直接レンダリングに含まれていないか？

- [ ] 条件付きレンダリングで、サーバーとクライアントで異なる結果にならないか？

### 2-3. 属性の不一致

- [ ] `suppressHydrationWarning`を適切に使用しているか？（必要な場合のみ）

- [ ] `dangerouslySetInnerHTML`を使用している場合、サーバーとクライアントで内容が一致するか？

---

## 3. データフェッチとキャッシュ

### 3-1. Server Actions

- [ ] Server Actions（`'use server'`）が適切に使用されているか？
  ```typescript
  // ✅ 正しい
  'use server';
  export async function myAction() {
    // ...
  }
  ```

- [ ] Server Actionsがセキュリティ上適切に保護されているか？（認証チェック等）

- [ ] Server Actionsから機密情報が漏洩していないか？

### 3-2. 動的関数の使用

- [ ] `cookies()`, `headers()`, `searchParams`の使用が意図的か？
  ```typescript
  // ⚠️ 注意: これらを使用するとページ全体が動的になる
  import { cookies } from 'next/headers';
  
  export default async function Page() {
    const cookieStore = await cookies();
    // ...
  }
  ```

- [ ] 動的関数を使用する必要がない場合は、静的生成を検討しているか？

### 3-3. キャッシュ設定

- [ ] `fetch`の`cache`オプションが適切に設定されているか？
  ```typescript
  // キャッシュする場合
  fetch(url, { cache: 'force-cache' });
  
  // キャッシュしない場合
  fetch(url, { cache: 'no-store' });
  ```

- [ ] `revalidate`が適切に設定されているか？

---

## 4. 環境変数の設定

### 4-1. 環境変数の命名

- [ ] クライアント側で使用する環境変数に`NEXT_PUBLIC_`プレフィックスが付いているか？
  ```typescript
  // ❌ エラー（クライアント側で使用できない）
  const apiKey = process.env.API_KEY;
  
  // ✅ 正しい
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  ```

- [ ] サーバー側のみで使用する環境変数に`NEXT_PUBLIC_`プレフィックスが付いていないか？（セキュリティリスク）

### 4-2. Vercelでの環境変数設定

- [ ] Vercelのダッシュボードで環境変数が正しく設定されているか？

- [ ] 本番環境、プレビュー環境、開発環境で適切な環境変数が設定されているか？

- [ ] 環境変数の値に特殊文字（改行、引用符等）が含まれている場合、適切にエスケープされているか？

### 4-3. 環境変数の参照

- [ ] ビルド時に環境変数が正しく読み込まれているか？

- [ ] ランタイムで環境変数が必要な場合、適切に設定されているか？

---

## 5. 画像とアセット

### 5-1. Next.js Imageコンポーネント

- [x] `<img>`タグの代わりに`next/image`の`Image`コンポーネントを使用しているか？ ✅ 2025-01-20完了
  ```typescript
  // ❌ 警告（パフォーマンス）
  <img src="/image.jpg" alt="Image" />
  
  // ✅ 正しい
  import Image from 'next/image';
  <Image src="/image.jpg" alt="Image" width={500} height={300} />
  ```
  **修正内容**: すべての`<img>`タグを`next/image`の`Image`コンポーネントに置き換え（5ファイル、8箇所）

- [ ] `Image`コンポーネントに`width`と`height`が設定されているか？（`fill`を使用する場合を除く）

- [ ] 外部画像を使用する場合、`next.config.js`で`images.domains`が設定されているか？

### 5-2. 画像の最適化

- [ ] 画像が適切に最適化されているか？（`browser-image-compression`等を使用）

- [ ] 画像のサイズが適切か？（500KB以下等）

- [ ] 画像のフォーマットが適切か？（WebP、AVIF等）

### 5-3. 静的アセット

- [ ] `public`フォルダ内のアセットが正しく参照されているか？

- [ ] アセットのパスが正しいか？（`/image.jpg`ではなく`./image.jpg`等）

---

## 6. ビルド時のエラー

### 6-1. TypeScriptエラー

- [ ] すべての型エラーが解決されているか？
  ```bash
  npm run build
  # または
  npx tsc --noEmit
  ```

- [ ] `any`型が使用されていないか？（`.cursorrules`で禁止）

- [ ] Props型が適切に定義されているか？

### 6-2. ESLintエラー

- [ ] すべてのESLintエラーが解決されているか？
  ```bash
  npm run lint
  ```

- [ ] 未使用の変数やimportが削除されているか？

- [x] `<img>`タグや`<a>`タグが使用されていないか？（`next/image`, `next/link`を使用） ✅ 2025-01-20完了（`<img>`タグをすべて`next/image`に置き換え）

### 6-3. 未使用のコード

- [ ] 未使用のimportが削除されているか？

- [ ] 未使用の変数や関数が削除されているか？

- [ ] 未使用のファイルが削除されているか？

---

## 7. APIルートとミドルウェア

### 7-1. APIルート

- [ ] APIルートが適切にエクスポートされているか？
  ```typescript
  // ✅ 正しい
  export async function GET(request: Request) {
    // ...
  }
  
  export async function POST(request: Request) {
    // ...
  }
  ```

- [ ] APIルートで適切なHTTPメソッドが使用されているか？

- [ ] APIルートでエラーハンドリングが適切に行われているか？

### 7-2. ミドルウェア

- [ ] `middleware.ts`が適切に設定されているか？

- [ ] ミドルウェアで無限ループが発生しないか？

- [ ] ミドルウェアで適切なパスがマッチングされているか？

### 7-3. エッジランタイム

- [ ] エッジランタイムを使用する場合、互換性のあるAPIのみを使用しているか？

- [ ] Node.js固有のAPI（`fs`, `path`等）を使用していないか？

---

## 8. 動的インポートとコード分割

### 8-1. 動的インポート

- [ ] 大きなライブラリは動的インポートを使用しているか？
  ```typescript
  // ✅ 正しい（コード分割）
  const HeavyComponent = dynamic(() => import('./HeavyComponent'));
  ```

- [ ] 動的インポートで`ssr: false`が必要な場合、適切に設定されているか？

### 8-2. コード分割

- [ ] 適切にコード分割されているか？

- [ ] 不要なコードがバンドルに含まれていないか？

---

## 9. メタデータとSEO

### 9-1. メタデータの設定

- [ ] `metadata`オブジェクトが適切に設定されているか？
  ```typescript
  // ✅ 正しい
  export const metadata = {
    title: 'Page Title',
    description: 'Page Description',
  };
  ```

- [ ] 動的メタデータが必要な場合、`generateMetadata`関数を使用しているか？

### 9-2. SEO

- [ ] `title`と`description`が適切に設定されているか？

- [ ] Open Graphメタタグが適切に設定されているか？

- [ ] 適切な`canonical`URLが設定されているか？

---

## 10. フォントとスタイリング

### 10-1. フォントの読み込み

- [ ] `next/font`を使用してフォントを読み込んでいるか？
  ```typescript
  // ✅ 正しい
  import { Inter } from 'next/font/google';
  const inter = Inter({ subsets: ['latin'] });
  ```

- [ ] フォントが適切に最適化されているか？

### 10-2. CSSとスタイリング

- [ ] Tailwind CSSが適切に設定されているか？

- [ ] グローバルCSSが適切にインポートされているか？

- [ ] CSS Modulesが適切に使用されているか？（使用する場合）

---

## 11. 静的生成と動的レンダリング

### 11-1. 静的生成

- [ ] 静的生成が可能なページは`generateStaticParams`を使用しているか？

- [ ] 静的生成でエラーが発生していないか？

### 11-2. 動的レンダリング

- [ ] 動的レンダリングが必要な場合、適切に設定されているか？

- [ ] `force-dynamic`が適切に使用されているか？

### 11-3. ISR（Incremental Static Regeneration）

- [ ] ISRが適切に設定されているか？

- [ ] `revalidate`が適切に設定されているか？

---

## 12. エクスポートと設定

### 12-1. next.config.js

- [ ] `next.config.js`が適切に設定されているか？

- [ ] 画像ドメインが適切に設定されているか？

- [ ] リダイレクトやリライトが適切に設定されているか？

### 12-2. 静的エクスポート

- [ ] 静的エクスポートを使用する場合、`output: 'export'`が設定されているか？

- [ ] 静的エクスポートで動的機能（APIルート、Server Actions等）が使用されていないか？

### 12-3. ビルド出力

- [ ] ビルドが正常に完了するか？
  ```bash
  npm run build
  ```

- [ ] ビルドエラーや警告がないか？

---

## 13. パフォーマンスと最適化

### 13-1. バンドルサイズ

- [ ] バンドルサイズが適切か？

- [ ] 不要な依存関係が含まれていないか？

- [ ] コード分割が適切に行われているか？

### 13-2. レンダリングパフォーマンス

- [ ] 不要な再レンダリングが発生していないか？

- [ ] `useMemo`や`useCallback`が適切に使用されているか？

- [ ] 重い処理が適切に最適化されているか？

### 13-3. タイムアウト

- [ ] エッジケースでタイムアウトが発生しないか？

- [ ] 重い処理が適切に非同期化されているか？

- [ ] API呼び出しに適切なタイムアウトが設定されているか？

---

## 14. セキュリティ

### 14-1. 認証と認可

- [ ] 認証が適切に実装されているか？

- [ ] 認可チェックが適切に行われているか？

- [ ] セッション管理が適切に行われているか？

### 14-2. データ保護

- [ ] 機密情報がクライアント側に露出していないか？

- [ ] 環境変数が適切に保護されているか？

- [ ] APIキーが適切に管理されているか？

### 14-3. CSRF対策

- [ ] CSRF対策が適切に実装されているか？

- [ ] Server ActionsでCSRFトークンが適切に検証されているか？

---

## 15. その他の注意事項

### 15-1. ファイルシステム

- [ ] Node.jsの`fs`モジュールをクライアント側で使用していないか？

- [ ] ファイルパスが適切に設定されているか？

### 15-2. タイムゾーン

- [ ] タイムゾーンが適切に設定されているか？（JST: Asia/Tokyo）

- [ ] 日付・時刻の表示が適切か？

### 15-3. エラーハンドリング

- [ ] エラーハンドリングが適切に実装されているか？

- [ ] エラーページ（`error.tsx`, `not-found.tsx`）が適切に設定されているか？

### 15-4. ログとデバッグ

- [ ] 本番環境でデバッグコードが残っていないか？

- [ ] `console.log`が適切に削除されているか？

---

## チェックリスト実行手順

### デプロイ前の確認

1. **ローカルビルド**
   ```bash
   npm run build
   ```
   - [ ] ビルドが正常に完了する
   - [ ] エラーや警告がない

2. **Lintチェック**
   ```bash
   npm run lint
   ```
   - [ ] Lintエラーがない
   - [ ] 未使用変数・importがない

3. **型チェック**
   ```bash
   npx tsc --noEmit
   ```
   - [ ] 型エラーがない

4. **上記チェックリストの確認**
   - [ ] すべての項目を確認
   - [ ] 問題があれば修正

### デプロイ後の確認

1. **本番環境での動作確認**
   - [ ] すべてのページが正常に表示される
   - [ ] すべての機能が正常に動作する
   - [ ] エラーが発生しない

2. **パフォーマンス確認**
   - [ ] ページ読み込み時間が適切
   - [ ] 画像が適切に最適化されている
   - [ ] バンドルサイズが適切

3. **エラーログの確認**
   - [ ] Vercelのログでエラーがない
   - [ ] ブラウザのコンソールでエラーがない

---

## よくあるエラーパターンと対処法

### エラー1: "Cannot read properties of undefined"

**原因**: サーバー側で`window`や`document`にアクセスしている

**対処法**: 
- `'use client'`ディレクティブを追加
- `useEffect`内でブラウザAPIを使用

### エラー2: "Hydration failed"

**原因**: サーバーとクライアントでレンダリング結果が異なる

**対処法**:
- `Date.now()`や`Math.random()`を直接レンダリングしない
- `useEffect`内で動的な値を設定

### エラー3: "Module not found"

**原因**: パスの誤り、または存在しないファイルをインポート

**対処法**:
- パスを確認
- ファイルが存在するか確認

### エラー4: "Environment variable is not defined"

**原因**: 環境変数が設定されていない、または`NEXT_PUBLIC_`プレフィックスがない

**対処法**:
- Vercelのダッシュボードで環境変数を設定
- クライアント側で使用する場合は`NEXT_PUBLIC_`を追加

### エラー5: "Image Optimization failed"

**原因**: 画像のパスが間違っている、または外部画像のドメインが設定されていない

**対処法**:
- `next.config.js`で`images.domains`を設定
- 画像のパスを確認

---

**最終更新**: 2025-01-20
