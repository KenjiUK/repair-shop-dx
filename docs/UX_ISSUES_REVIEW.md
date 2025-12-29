# UI/UX実装レビュー - 問題点と改善案

## 発見された問題点

### 1. 無限リダイレクトの可能性 ⚠️ 重大

**問題:**
- 診断画面: 複合作業で`workOrder`パラメータがない → 選択画面にリダイレクト
- 選択画面: ワークオーダーが1つ以下 → 診断画面にリダイレクト
- **これが無限ループになる可能性がある**

**シナリオ:**
```
1. ユーザーが `/mechanic/diagnosis/test-shaken-02` に直接アクセス
2. 診断画面: workOrders.length > 1 && !workOrderId → `/select` にリダイレクト
3. 選択画面: workOrders.length <= 1 → `/mechanic/diagnosis/test-shaken-02` にリダイレクト
4. 診断画面: 再度 `/select` にリダイレクト
5. 無限ループ...
```

**原因:**
- 選択画面でのリダイレクト条件と診断画面でのリダイレクト条件が競合している
- リダイレクトの意図が明確でない

---

### 2. ジョブカードでの判定タイミングの問題 ⚠️ 重要

**問題:**
- `workOrders`は非同期で取得される
- 初回レンダリング時には`workOrders`が空配列の可能性がある
- そのため、複合作業なのに単体作業として扱われる可能性がある

**シナリオ:**
```
1. ジョブカードがレンダリングされる
2. workOrdersがまだ取得されていない（空配列）
3. finalHref = `/mechanic/diagnosis/${job.id}` （単体作業として扱われる）
4. ユーザーがクリック → 診断画面に遷移
5. 診断画面でworkOrdersが取得される → 複合作業と判明
6. 診断画面から選択画面にリダイレクト
```

**問題点:**
- ユーザーが一度診断画面を見てから選択画面にリダイレクトされる
- ユーザー体験が悪い

---

### 3. リダイレクトの意図が不明確 ⚠️ 中

**問題:**
- 診断画面でのリダイレクトは「複合作業の場合、必ず選択画面を経由する」という意図
- しかし、選択画面から来た場合もリダイレクトされる可能性がある

**改善案:**
- 選択画面から来た場合は、リダイレクトしない
- URLパラメータで「選択画面から来た」ことを示す

---

### 4. 作業画面への対応が不完全 ⚠️ 中

**問題:**
- 作業画面でも複合作業に対応する必要がある
- 現時点では作業画面の選択画面が未実装
- ジョブカードから作業画面への遷移時に、複合作業の判定がされていない

---

## 改善案

### 改善案1: リダイレクト条件の改善（推奨）

**診断画面:**
```typescript
// 選択画面から来た場合はリダイレクトしない
const fromSelect = searchParams?.get("fromSelect") === "true";

useEffect(() => {
  // 選択画面から来た場合はリダイレクトしない
  if (fromSelect) return;
  
  // 複合作業の場合、workOrderパラメータがない場合は選択画面にリダイレクト
  if (!isLoadingWorkOrders && workOrders && workOrders.length > 1 && !workOrderId) {
    router.replace(`/mechanic/diagnosis/${jobId}/select`);
  }
}, [workOrders, isLoadingWorkOrders, workOrderId, jobId, router, fromSelect]);
```

**選択画面:**
```typescript
// ワークオーダーが1つ以下の場合は診断画面にリダイレクト（fromSelectパラメータ付き）
useEffect(() => {
  if (!isLoadingWorkOrders && workOrders && workOrders.length <= 1) {
    router.replace(`/mechanic/diagnosis/${jobId}?fromSelect=true`);
  }
}, [workOrders, isLoadingWorkOrders, jobId, router]);
```

**メリット:**
- 無限ループを防げる
- リダイレクトの意図が明確になる

---

### 改善案2: ジョブカードでの判定改善

**問題:**
- `workOrders`が取得される前に判定が行われる

**改善案:**
```typescript
// ワークオーダーが取得されるまで、デフォルトのhrefを使用
const finalHref = useMemo(() => {
  if (!actionConfig.href) return actionConfig.href;
  
  // ワークオーダーが取得されていない場合は、デフォルトのhrefを使用
  if (workOrders === undefined || isLoadingWorkOrders) {
    return actionConfig.href;
  }
  
  // 診断画面への遷移の場合のみ、複合作業をチェック
  if (actionConfig.href.startsWith(`/mechanic/diagnosis/${job.id}`)) {
    // ワークオーダーが2つ以上ある場合は選択画面に遷移
    if (workOrders && workOrders.length > 1) {
      return `/mechanic/diagnosis/${job.id}/select`;
    }
  }
  
  return actionConfig.href;
}, [actionConfig.href, job.id, workOrders, isLoadingWorkOrders]);
```

**メリット:**
- ワークオーダーが取得されるまで待つ
- 正しい遷移先を決定できる

---

### 改善案3: 選択画面でのリダイレクト条件の改善

**現在:**
```typescript
// ワークオーダーが1つ以下の場合は、直接診断画面にリダイレクト
if (workOrders.length <= 1) {
  router.replace(`/mechanic/diagnosis/${jobId}`);
  return <LoadingSkeleton />;
}
```

**改善案:**
```typescript
// ワークオーダーが1つ以下の場合は、直接診断画面にリダイレクト（fromSelectパラメータ付き）
if (workOrders.length <= 1) {
  router.replace(`/mechanic/diagnosis/${jobId}?fromSelect=true`);
  return <LoadingSkeleton />;
}
```

**メリット:**
- 診断画面で再度リダイレクトされない

---

## 推奨される修正順序

1. **最優先**: 無限リダイレクトの修正（改善案1 + 改善案3）
2. **高優先度**: ジョブカードでの判定改善（改善案2）
3. **中優先度**: 作業画面への対応（将来実装）

---

## まとめ

**現在の問題:**
- 無限リダイレクトの可能性
- ジョブカードでの判定タイミングの問題
- リダイレクトの意図が不明確

**推奨される修正:**
- `fromSelect`パラメータを追加して、リダイレクトの意図を明確にする
- ジョブカードでの判定を改善して、ワークオーダーが取得されるまで待つ
- 選択画面でのリダイレクト時に`fromSelect`パラメータを付与する

