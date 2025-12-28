# ワークフローインジケーター再設計提案

**作成日**: 2025-01-XX  
**目的**: JOBカードと下層ページのワークフロー表示を最適化

---

## 📋 現状の課題

1. **JOBカードにPhaseバッジが表示されている**: Phase 0（事前問診）とPhase 4（見積承認）のバッジが表示されているが、ステータスラベル（「作業待ち」など）で既に分かるため冗長
2. **下層ページの戻るボタンとの兼ね合い**: 下層ページには戻るボタンがあり、ワークフローインジケーターとの配置を考慮する必要がある

---

## 🎯 再設計案

### 1. JOBカードの改善

**変更内容**:
- Phase 0とPhase 4のバッジを削除
- ステータスラベルに現在のフェーズ情報を追加（例：「作業待ち（Phase 5）」）

**実装方法**:
```typescript
/**
 * ステータス（field5）から現在のフェーズ番号を取得
 */
function getCurrentPhaseFromStatus(status: string | undefined, hasAdditionalEstimate: boolean = true): number | null {
  if (!status) return null;
  
  switch (status) {
    case "入庫待ち":
      return 1; // Phase 1: 受付
    case "入庫済み":
      return 2; // Phase 2: 診断
    case "見積作成待ち":
      return 3; // Phase 3: 見積
    case "見積提示済み":
      return 4; // Phase 4: 承認
    case "作業待ち":
      return 5; // Phase 5: 作業
    case "出庫待ち":
    case "出庫済み":
      return 6; // Phase 6: 報告
    default:
      return null;
  }
}

/**
 * ステータスラベルにフェーズ情報を追加
 */
function getStatusLabelWithPhase(status: string, phase: number | null): string {
  if (phase === null) return status;
  return `${status}（Phase ${phase}）`;
}
```

### 2. 下層ページのヘッダー配置

**現在の配置**:
- 左側: 戻るボタン
- 右側: ワークフローインジケーター（`rightArea`）

**改善案**:
- 戻るボタンとワークフローインジケーターは別々の場所にあるため、競合しない
- ワークフローインジケーターはコンパクトな表示を維持（現在の実装で問題なし）

---

## 🔧 実装手順

### Step 1: JOBカードからPhaseバッジを削除

**ファイル**: `src/components/features/job-card.tsx`

**変更内容**:
- Phase 0とPhase 4のバッジ表示を削除
- ステータスラベルにフェーズ情報を追加

### Step 2: ステータスからフェーズを取得する関数を追加

**ファイル**: `src/components/features/job-card.tsx`

**実装内容**:
- `getCurrentPhaseFromStatus`関数を追加
- ステータスラベルにフェーズ情報を追加

### Step 3: 下層ページのワークフローインジケーターを確認

**確認内容**:
- 戻るボタンとワークフローインジケーターが競合していないか確認
- 必要に応じてレイアウトを調整

---

## ✅ 実装チェックリスト

- [ ] JOBカードからPhase 0バッジを削除
- [ ] JOBカードからPhase 4バッジを削除
- [ ] ステータスからフェーズを取得する関数を追加
- [ ] ステータスラベルにフェーズ情報を追加
- [ ] 下層ページのヘッダーレイアウトを確認
- [ ] 動作確認




