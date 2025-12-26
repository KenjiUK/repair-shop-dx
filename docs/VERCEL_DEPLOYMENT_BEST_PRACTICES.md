# Next.js 16 + Vercelデプロイベストプラクティス

**作成日:** 2025-12-21  
**対象バージョン:** Next.js 16.0.10, React 19.2.1  
**目的:** Vercelデプロイ時のエラーを防ぐための最新ベストプラクティス

---

## 目次

1. [useSearchParams()の正しい使用方法](#usesearchparamsの正しい使用方法)
2. [Hydrationエラーの防止](#hydrationエラーの防止)
3. [Client/Server Componentsの適切な使い分け](#clientserver-componentsの適切な使い分け)
4. [TypeScriptビルドエラーの対処](#typescriptビルドエラーの対処)
5. [環境変数の設定](#環境変数の設定)
6. [ビルド最適化](#ビルド最適化)
7. [一般的なデプロイエラーと解決策](#一般的なデプロイエラーと解決策)

---

## useSearchParams()の正しい使用方法

### 問題点

Next.js 16では、`useSearchParams()`を`Suspense`境界なしで使用すると、ページ全体がクライアント側レンダリングになり、ビルドエラーやパフォーマンスの問題が発生する可能性があります。

### ベストプラクティス

1. **必ずSuspense境界でラップする**

```tsx
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ❌ 悪い例
export default function Page() {
  const searchParams = useSearchParams();
  // ...
}

// ✅ 良い例
function PageContent() {
  const searchParams = useSearchParams();
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <PageContent />
    </Suspense>
  );
}
```

2. **useMemoで値をメモ化する**

```tsx
const searchParams = useSearchParams();
const workOrderId = useMemo(() => {
  return searchParams?.get("workOrderId") || null;
}, [searchParams]);
```

3. **フォールバックUIを適切に実装する**

```tsx
<Suspense fallback={
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
  </div>
}>
  <PageContent />
</Suspense>
```

### エラーメッセージ

- `Reading search params through useSearchParams() without a Suspense boundary will opt the entire page into client-side rendering.`
- **解決策:** コンポーネントを`Suspense`でラップする

---

## Hydrationエラーの防止

### 問題点

サーバー側でレンダリングされたHTMLとクライアント側でレンダリングされたHTMLが一致しない場合、Hydrationエラーが発生します。

### 原因となるコードパターン

1. **サーバー/クライアントで異なる値を返す関数**

```tsx
// ❌ 悪い例
function Component() {
  const mechanicName = getCurrentMechanicName(); // サーバー側ではnull、クライアント側では値が返る
  return <div>{mechanicName}</div>;
}

// ✅ 良い例
function Component() {
  const [mechanicName, setMechanicName] = useState<string | null>(null);
  
  useEffect(() => {
    setMechanicName(getCurrentMechanicName());
  }, []);
  
  return <div>{mechanicName}</div>;
}
```

2. **非決定的な値の使用**

```tsx
// ❌ 悪い例
function Component() {
  const timestamp = Date.now(); // サーバーとクライアントで異なる値
  return <div>{timestamp}</div>;
}

// ✅ 良い例
function Component() {
  const [timestamp, setTimestamp] = useState<number | null>(null);
  
  useEffect(() => {
    setTimestamp(Date.now());
  }, []);
  
  return <div>{timestamp}</div>;
}
```

3. **条件付きレンダリングでのサーバー/クライアント分岐**

```tsx
// ❌ 悪い例
function Component() {
  if (typeof window !== 'undefined') {
    return <div>クライアント側のみ</div>;
  }
  return <div>サーバー側</div>;
}

// ✅ 良い例
function Component() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div>読み込み中...</div>;
  }
  
  return <div>クライアント側のみ</div>;
}
```

### ベストプラクティス

1. **クライアント側のみで評価すべき値は`useEffect`で管理**
2. **`suppressHydrationWarning`は最小限に使用**（どうしても必要な場合のみ）
3. **サーバー/クライアントで異なる値を返す関数は`useState`と`useEffect`で管理**

### エラーメッセージ

- `Hydration failed because the server rendered HTML didn't match the client.`
- **解決策:** サーバー/クライアント間の一貫性を確保

---

## Client/Server Componentsの適切な使い分け

### Next.js 16の基本原則

- **デフォルトはServer Component**
- **Client Componentは`'use client'`ディレクティブで明示的に指定**
- **Client Componentは必要最小限に**

### Server Componentを使用すべき場合

- データフェッチング
- バックエンドリソースへの直接アクセス
- 機密情報の保持（APIキーなど）
- 大きな依存関係の削減

### Client Componentを使用すべき場合

- インタラクティブな機能（`useState`、`useEffect`、イベントハンドラー）
- ブラウザAPIの使用（`localStorage`、`window`など）
- カスタムフックの使用
- 状態管理ライブラリの使用

### ベストプラクティス

1. **ページ全体を`'use client'`にしない**

```tsx
// ❌ 悪い例
'use client';

export default function Page() {
  // ページ全体がClient Componentになる
}

// ✅ 良い例
// Server Component（デフォルト）
export default function Page() {
  return (
    <div>
      <ServerComponent />
      <ClientComponent />
    </div>
  );
}

// Client Component（必要な部分のみ）
'use client';
export function ClientComponent() {
  const [state, setState] = useState();
  // ...
}
```

2. **Client Componentをツリーの葉に配置**

```tsx
// ✅ 良い例：Client Componentが葉に配置されている
export default function Page() {
  return (
    <div>
      <ServerHeader />
      <ServerContent>
        <ClientButton /> {/* 葉に配置 */}
      </ServerContent>
    </div>
  );
}
```

3. **不要なClient Componentを削除**

- インタラクティブでないコンポーネントはServer Componentとして保持
- 状態管理が不要なコンポーネントはServer Component

---

## TypeScriptビルドエラーの対処

### ベストプラクティス

1. **`ignoreBuildErrors: true`は使用しない**

```tsx
// ❌ 悪い例
// next.config.ts
module.exports = {
  typescript: {
    ignoreBuildErrors: true, // 型安全性が損なわれる
  },
};
```

2. **型安全性を確保**

```tsx
// ❌ 悪い例
function Component({ job }: { job: ZohoJob }) {
  return <div>{job.field4.name}</div>; // job.field4がundefinedの可能性
}

// ✅ 良い例
function Component({ job }: { job: ZohoJob }) {
  const customerName = job.field4?.name ?? "未登録";
  return <div>{customerName}</div>;
}
```

3. **オプショナルチェーンの適切な使用**

```tsx
// ✅ 良い例
const customerName = job?.field4?.name ?? "未登録";
const vehicleName = job?.field6?.name ?? "車両未登録";
```

4. **型アサーションの最小限の使用**

```tsx
// ❌ 悪い例
const id = params.id as string; // 型アサーション

// ✅ 良い例
const id = useMemo(() => {
  return (params?.id ?? "") as string;
}, [params]);
```

### 一般的なTypeScriptエラー

1. **`'X' is possibly 'undefined'`**
   - **解決策:** オプショナルチェーン（`?.`）とnull合体演算子（`??`）を使用

2. **`Property 'X' does not exist on type 'Y'`**
   - **解決策:** 型定義を確認し、適切な型を使用

3. **`Block-scoped variable 'X' used before its declaration`**
   - **解決策:** 変数の宣言順序を確認し、使用前に宣言

---

## 環境変数の設定

### 環境変数の種類

1. **サーバー側のみの環境変数**
   - プレフィックスなし（例: `GOOGLE_SHEETS_MASTER_DATA_ID`）
   - サーバー側のAPI Routesでのみ使用可能

2. **クライアント側でも使用可能な環境変数**
   - `NEXT_PUBLIC_`プレフィックス（例: `NEXT_PUBLIC_GOOGLE_SHEETS_SMART_TAGS_ID`）
   - クライアント側のコードでも使用可能（ブラウザに公開される）

### ベストプラクティス

1. **機密情報はサーバー側のみ**

```tsx
// ✅ 良い例
// .env.local
GOOGLE_SHEETS_MASTER_DATA_ID=xxx
GOOGLE_DRIVE_ACCESS_TOKEN=xxx

// ❌ 悪い例
NEXT_PUBLIC_GOOGLE_DRIVE_ACCESS_TOKEN=xxx // クライアント側に公開される
```

2. **Vercelでの環境変数設定**

- Vercelダッシュボード → プロジェクト設定 → Environment Variables
- 本番環境、プレビュー環境、開発環境ごとに設定可能
- 環境変数の変更後は再デプロイが必要

3. **環境変数の検証**

```tsx
// ✅ 良い例
const spreadsheetId = process.env.GOOGLE_SHEETS_MASTER_DATA_ID;
if (!spreadsheetId) {
  throw new Error("GOOGLE_SHEETS_MASTER_DATA_ID is not set");
}
```

### 必要な環境変数（このプロジェクト）

**サーバー側（API Routesでのみ使用可能）:**

1. **Google Sheets関連**
   - `GOOGLE_SHEETS_MASTER_DATA_ID` - マスタデータスプレッドシートID（車両マスタ、顧客マスタ）
   - `GOOGLE_SHEETS_API_KEY` - Google Sheets APIキー（読み取り専用）
   - `GOOGLE_SHEETS_LINE_HISTORY_ID` - LINE通知履歴スプレッドシートID（オプション、未設定時は`GOOGLE_SHEETS_MASTER_DATA_ID`を使用）

2. **Google Drive関連**
   - `GOOGLE_DRIVE_ACCESS_TOKEN` - Google Drive APIアクセストークン（暫定実装、将来はOAuth 2.0に移行予定）

3. **LINE関連**
   - `LINE_CHANNEL_ACCESS_TOKEN` - LINE Messaging APIチャネルアクセストークン

**クライアント側（`NEXT_PUBLIC_`プレフィックスが必要）:**

1. **Google Sheets関連**
   - `NEXT_PUBLIC_GOOGLE_SHEETS_SMART_TAGS_ID` - スマートタグ管理スプレッドシートID（クライアント側でも使用）
   - `NEXT_PUBLIC_GOOGLE_SHEETS_MASTER_DATA_ID` - マスタデータスプレッドシートID（クライアント側でも使用する場合）

**注意事項:**
- `NEXT_PUBLIC_`プレフィックスが付いた環境変数はブラウザに公開されるため、機密情報は使用しない
- サーバー側のみの環境変数は`NEXT_PUBLIC_`プレフィックスを付けない

---

## ビルド最適化

### next.config.tsの最適化

```tsx
// ✅ 推奨設定
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 不要な設定は削除
  // パフォーマンス最適化はNext.jsが自動で行う
};

export default nextConfig;
```

### ビルド時間の短縮

1. **Incremental Static Regeneration (ISR)の活用**
2. **動的インポートの使用**
3. **不要な依存関係の削除**

### 依存関係の確認

- Next.js 16.0.10とReact 19.2.1の互換性を確認
- 依存関係のバージョン整合性を確認
- セキュリティ脆弱性の確認

---

## 一般的なデプロイエラーと解決策

### 1. ビルド失敗（`npm run build exited with 1`）

**原因:**
- TypeScriptエラー
- 依存関係の不足
- Node.jsバージョンの不一致

**解決策:**
- ローカルで`npm run build`を実行してエラーを確認
- `package.json`の依存関係を確認
- VercelのNode.jsバージョンを確認（`.nvmrc`ファイルで指定可能）

### 2. `useSearchParams()`エラー

**原因:**
- `Suspense`境界なしで`useSearchParams()`を使用

**解決策:**
- コンポーネントを`Suspense`でラップ
- フォールバックUIを実装

### 3. Hydrationエラー

**原因:**
- サーバー/クライアント間のHTML不一致

**解決策:**
- クライアント側のみで評価すべき値は`useEffect`で管理
- 非決定的な値の使用を避ける

### 4. 環境変数エラー

**原因:**
- 環境変数が設定されていない
- `NEXT_PUBLIC_`プレフィックスの誤用

**解決策:**
- Vercelダッシュボードで環境変数を設定
- 環境変数のプレフィックスを確認

### 5. TypeScriptエラー

**原因:**
- 型定義の不整合
- `undefined`チェックの不足

**解決策:**
- 型エラーを修正（`ignoreBuildErrors: true`は使用しない）
- オプショナルチェーンとnull合体演算子を使用

### 6. ビルド時間超過

**原因:**
- ビルド時間がVercelの制限を超える

**解決策:**
- ISRの活用
- 動的インポートの使用
- 不要なページの削除

---

## デプロイ前チェックリスト

### ビルド確認

- [ ] `npm run build`がローカルで成功する
- [ ] TypeScriptエラーがない
- [ ] ESLintエラーがない

### コード確認

- [ ] `useSearchParams()`はすべて`Suspense`境界内
- [ ] Hydrationエラーの原因となるコードがない
- [ ] Client Componentは必要最小限
- [ ] 環境変数が適切に設定されている

### 設定確認

- [ ] `next.config.ts`が最適化されている
- [ ] `tsconfig.json`の設定が適切
- [ ] 依存関係のバージョンが整合している

### Vercel設定確認

- [ ] 環境変数がVercelダッシュボードで設定されている
- [ ] Node.jsバージョンが適切
- [ ] ビルドコマンドが正しい（`npm run build`）

---

## 参考資料

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Next.js App Router Best Practices](https://nextjs.org/docs/app/building-your-application/routing)
- [React Server Components](https://react.dev/reference/rsc/server-components)

---

## 更新履歴

- 2025-12-21: 初版作成（Next.js 16.0.10、React 19.2.1対応）



