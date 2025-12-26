# チェックイン時のトーストメッセージレビュー

## 問題点

チェックイン時にトーストメッセージが2つ表示される。

## 原因

`src/app/page.tsx` の `handleCourtesyCarSelect` 関数で：

1. **435行目**: `optimisticMutate` の `successMessage: "チェックイン完了"` でトーストを表示
2. **443-445行目**: `onSuccess` コールバック内で `toast.success("チェックイン完了", ...)` を表示

`use-optimistic-update.ts` の実装（125-126行目）では、`successMessage` が指定されている場合、自動的に `toast.success(successMessage)` を表示します。さらに、`onSuccess` コールバック（130-132行目）も実行されるため、2つのトーストが表示されます。

## 現在の実装

```typescript
await optimisticMutate({
  // ...
  successMessage: "チェックイン完了",  // ← 1つ目のトースト
  errorMessage: "チェックインに失敗しました",
  onSuccess: () => {
    // ...
    toast.success("チェックイン完了", {  // ← 2つ目のトースト
      description: `${selectedJob.field4?.name}様 → タグ ${selectedTagId}${carInfo}${lampInfo}`,
    });
  },
});
```

## 解決策

### 推奨: `successMessage` を削除

理由:
- `onSuccess` 内のトーストには詳細情報（顧客名、タグID、代車情報、エラーランプ情報）が含まれている
- より有用な情報をユーザーに提供できる
- 重複を避けられる

### 修正後の実装

```typescript
await optimisticMutate({
  // ...
  // successMessage: "チェックイン完了",  // ← 削除
  errorMessage: "チェックインに失敗しました",
  onSuccess: () => {
    // ...
    toast.success("チェックイン完了", {
      description: `${selectedJob.field4?.name}様 → タグ ${selectedTagId}${carInfo}${lampInfo}`,
    });
  },
});
```

## その他の確認事項

### トーストメッセージの内容

現在の `onSuccess` 内のトースト:
- **タイトル**: "チェックイン完了"
- **説明**: `${顧客名}様 → タグ ${タグID}${代車情報}${エラーランプ情報}`

### 改善提案

1. **タイトルをより具体的に**: "入庫処理が完了しました"
2. **説明を整理**: 
   - 顧客名とタグIDは必須
   - 代車情報とエラーランプ情報は該当する場合のみ表示

### タイミング

- **表示タイミング**: チェックイン処理が成功した直後（`onSuccess` コールバック内）
- **表示条件**: チェックイン処理が成功した場合のみ

## まとめ

- `successMessage` を削除して、`onSuccess` 内の詳細なトーストのみを表示
- トーストメッセージの内容とタイミングは適切
- 重複表示の問題を解決








