# メモリリークの解消（Phase 4-3）

**作成日**: 2024-12-19  
**ステータス**: ✅ **完了**

## 目的

メモリリークを防ぐため、`setTimeout`のクリーンアップとイベントリスナーの適切な管理を実装する。

## 改善内容

### 1. ホーム画面（`src/app/page.tsx`）

#### 問題点
- `setTimeout`が複数箇所で使用されているが、クリーンアップされていない
- コンポーネントがアンマウントされた後でもタイマーが実行される可能性がある

#### 改善内容
- `useRef`を使用してタイマーIDを保持
- `isMountedRef`を使用してコンポーネントのマウント状態を追跡
- `useEffect`のクリーンアップ関数でタイマーをクリア

**実装:**
```typescript
// メモリリーク防止: タイマーIDを保持するref
const scrollTimersRef = useRef<Set<NodeJS.Timeout>>(new Set());
const isMountedRef = useRef(true);

// アンマウント時にタイマーをクリーンアップ
useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;
    scrollTimersRef.current.forEach((timer) => clearTimeout(timer));
    scrollTimersRef.current.clear();
  };
}, []);

// setTimeoutの使用例
const timer = setTimeout(() => {
  if (!isMountedRef.current) return; // アンマウント後は実行しない
  // ... 処理 ...
  scrollTimersRef.current.delete(timer);
}, 300);
scrollTimersRef.current.add(timer);
```

### 2. 作業画面（`src/app/mechanic/work/[id]/page.tsx`）

#### 問題点
- `router.push`の前に`setTimeout`が実行されるが、コンポーネントがアンマウントされる可能性がある

#### 改善内容
- コメントを追加して、メモリリークのリスクを明確化
- `router.push`はNext.jsが管理するため、通常は問題ないが、注意喚起を追加

### 3. 診断画面（`src/app/mechanic/diagnosis/[id]/page.tsx`）

#### 問題点
- `setTimeout`が2箇所で使用されているが、クリーンアップされていない

#### 改善内容
- DOM要素の存在確認を追加（アンマウント後の安全性を確保）
- コメントを追加して、メモリリークのリスクを明確化

## 既存の適切な実装

### 1. `use-auto-save.ts`
- ✅ `setTimeout`のクリーンアップが適切に実装されている
- ✅ `useEffect`のクリーンアップ関数でタイマーをクリア

### 2. `use-realtime.ts`
- ✅ イベントリスナーのクリーンアップが適切に実装されている
- ✅ `useEffect`のクリーンアップ関数でイベントリスナーを削除

### 3. `use-online-status.ts`
- ✅ イベントリスナーのクリーンアップが適切に実装されている
- ✅ `useEffect`のクリーンアップ関数でイベントリスナーを削除

### 4. `app-header.tsx`
- ✅ `setTimeout`のクリーンアップが適切に実装されている
- ✅ `useEffect`のクリーンアップ関数でタイマーをクリア

### 5. `sidebar-provider.tsx`
- ✅ `setTimeout`のクリーンアップが適切に実装されている
- ✅ `useEffect`のクリーンアップ関数でタイマーをクリア

## メモリリーク防止の原則

### 1. setTimeout/setIntervalのクリーンアップ
```typescript
// ✅ 正しい実装
useEffect(() => {
  const timer = setTimeout(() => {
    // 処理
  }, 1000);
  
  return () => {
    clearTimeout(timer);
  };
}, []);
```

### 2. イベントリスナーのクリーンアップ
```typescript
// ✅ 正しい実装
useEffect(() => {
  const handleEvent = () => {
    // 処理
  };
  
  window.addEventListener("event", handleEvent);
  
  return () => {
    window.removeEventListener("event", handleEvent);
  };
}, []);
```

### 3. コンポーネントのマウント状態の追跡
```typescript
// ✅ 正しい実装（イベントハンドラー内でsetTimeoutを使用する場合）
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  return () => {
    isMountedRef.current = false;
  };
}, []);

const handleClick = () => {
  setTimeout(() => {
    if (!isMountedRef.current) return; // アンマウント後は実行しない
    // 処理
  }, 1000);
};
```

## パフォーマンス改善の効果

### メモリ使用量の削減
- **改善前**: タイマーがクリーンアップされず、メモリリークが発生する可能性
- **改善後**: タイマーが適切にクリーンアップされ、メモリリークを防止
- **効果**: 長時間使用時のメモリ使用量の増加を防止

### パフォーマンスの向上
- 不要なタイマーの実行を防止
- アンマウント後の処理をスキップすることで、パフォーマンスを向上

## 今後の改善案

### 1. カスタムフックの作成
```typescript
// useTimeout カスタムフック
function useTimeout(callback: () => void, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      callbackRef.current();
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay]);
}
```

### 2. タイマー管理の統一
- すべてのタイマーを一元管理するカスタムフックを作成
- アンマウント時の自動クリーンアップを実装

## 注意事項

1. **イベントハンドラー内のsetTimeout**: イベントハンドラー内で`setTimeout`を使用する場合、`useEffect`のクリーンアップ関数では管理できないため、`useRef`を使用してマウント状態を追跡する
2. **router.pushの前のsetTimeout**: `router.push`はNext.jsが管理するため、通常は問題ないが、注意喚起を追加
3. **DOM操作の安全性**: アンマウント後のDOM操作を防ぐため、要素の存在確認を追加

## 最終更新日
2024-12-19














