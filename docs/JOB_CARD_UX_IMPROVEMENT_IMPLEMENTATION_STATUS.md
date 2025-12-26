# ジョブカードUI/UX改善 - 実装状況

**作成日:** 2025-01-XX
**ステータス:** ✅ **完了**

---

## 実装完了項目

### 1. アクションボタンのサイズ階層化 ✅

**確認結果:**
- プライマリアクション（`priority === "high"`）: `h-12`（既に実装済み）
- セカンダリアクション（`priority === "medium"`）: `h-10`（既に実装済み）

**実装場所:**
- `src/components/features/job-card.tsx`
  - 行594-628: プライマリアクション（`h-12`）
  - 行629-645: セカンダリアクション（`h-10`）

**実装内容:**
- `getActionConfig`関数で`priority`フィールドを設定
- プライマリアクション: `priority: "high"` → `h-12`
- セカンダリアクション: `priority: "medium"` → `h-10`

---

### 2. 緊急度インジケーター（左側の色付きバー） ✅

**実装内容:**
- 緊急度が高い場合、カードの左側に色付きバーを表示
- 緊急度の判定ロジックを実装
- 視覚的に緊急度を表現

**実装場所:**
- `src/components/features/job-card.tsx`
  - 行390-420: 緊急度判定関数（`getUrgencyLevel`）
  - 行425-429: Cardコンポーネントに緊急度スタイルを追加
  - 行430-440: 緊急度インジケーター（左側の色付きバー）

**緊急度の判定ロジック:**
- **高緊急度（`high`）**: 2時間以上経過 → 赤色バー（`border-l-red-500`, `bg-red-500`）
- **中緊急度（`medium`）**: 1時間以上経過 → オレンジ色バー（`border-l-orange-500`, `bg-orange-500`）
- **通常**: 1時間未満 → インジケーターなし

**判定対象ステータス:**
- `入庫待ち`: `field22`（入庫予定日時）から経過時間を計算
- `見積作成待ち`: `field22`（入庫日時）から経過時間を計算
- `作業待ち`: `field22`（入庫日時）から経過時間を計算

**UI実装:**
- カードの左側に4pxの色付きバー（`border-l-4`）
- 絶対位置で左側に1px幅のバー（`w-1`）
- 緊急度に応じた色分け

---

### 3. ステータスバッジの色分け ✅

**確認結果:**
- 既に実装済み（`getStatusBadgeStyle`関数）

**実装場所:**
- `src/components/features/job-card.tsx`
  - 行56-73: `getStatusBadgeStyle`関数
  - 行507-516: ステータスバッジの表示

**色分けルール:**
- **緊急・要対応（赤系）**: `bg-red-50 text-red-700 border-red-200`
  - 入庫待ち、見積作成待ち、一時帰宅中、再入庫待ち、作業待ち
- **進行中（青系）**: `bg-blue-50 text-blue-700 border-blue-200`
  - 入庫済み
- **待機中（黄系）**: `bg-yellow-50 text-yellow-700 border-yellow-200`
  - 見積提示済み
- **完了（グレー系）**: `bg-gray-50 text-gray-500 border-gray-200`
  - 出庫済み

---

## 実装結果

### 完了した機能

1. ✅ **アクションボタンのサイズ階層化**
   - プライマリアクション: `h-12`（既に実装済み）
   - セカンダリアクション: `h-10`（既に実装済み）

2. ✅ **緊急度インジケーター**
   - 左側の色付きバーを実装
   - 緊急度判定ロジックを実装
   - 視覚的に緊急度を表現

3. ✅ **ステータスバッジの色分け**
   - 既に実装済み（確認のみ）

---

## UI構成（改善後）

```
[Card（緊急度インジケーター付き）]
  - [左側の色付きバー]（緊急度が高い場合のみ）
  - [CardHeader]
    - [第1階層: 最重要情報]
      - 顧客名
      - ステータスバッジ（色分け）
      - プライマリアクションボタン（h-12）
    - [第2階層: 重要情報]
      - 車両情報
      - 入庫区分・時間・タグ
  - [CardContent]
    - [第3階層: 詳細情報（折りたたみ可能）]
      - お客様入力情報
      - 作業指示
      - 変更申請
```

---

## 技術的な詳細

### 変更されたファイル

- `src/components/features/job-card.tsx`
  - 緊急度判定関数の追加（`getUrgencyLevel`）
  - 緊急度インジケーターの追加（左側の色付きバー）

### 緊急度判定ロジック

```typescript
const getUrgencyLevel = (): "high" | "medium" | "low" | null => {
  const now = new Date();
  let targetTime: Date | null = null;

  switch (job.field5) {
    case "入庫待ち":
      targetTime = job.field22 ? new Date(job.field22) : null;
      break;
    case "見積作成待ち":
    case "作業待ち":
      targetTime = job.field22 ? new Date(job.field22) : null;
      break;
    default:
      return null;
  }

  if (!targetTime) return null;

  const hoursElapsed = (now.getTime() - targetTime.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed >= 2) return "high"; // 2時間以上経過
  if (hoursElapsed >= 1) return "medium"; // 1時間以上経過
  return null; // 1時間未満は通常
};
```

### CSSクラス

```css
/* 緊急度インジケーター（カードの左側） */
.border-l-4: 左側に4pxのボーダー
.border-l-red-500: 高緊急度（赤）
.border-l-orange-500: 中緊急度（オレンジ）

/* 緊急度インジケーター（絶対位置のバー） */
.absolute: 絶対位置
.left-0: 左端
.top-0: 上端
.bottom-0: 下端
.w-1: 幅1px（4px）
.bg-red-500: 高緊急度（赤）
.bg-orange-500: 中緊急度（オレンジ）
```

---

## テスト推奨事項

1. **アクションボタンのサイズ階層化のテスト**
   - プライマリアクションが`h-12`であることを確認
   - セカンダリアクションが`h-10`であることを確認
   - ボタンの視覚的階層が明確であることを確認

2. **緊急度インジケーターのテスト**
   - 入庫待ちが2時間以上経過している場合、赤色バーが表示されることを確認
   - 入庫待ちが1時間以上経過している場合、オレンジ色バーが表示されることを確認
   - 1時間未満の場合、インジケーターが表示されないことを確認
   - 見積作成待ち、作業待ちでも同様に動作することを確認

3. **ステータスバッジの色分けのテスト**
   - 各ステータスで適切な色が表示されることを確認
   - 視覚的に緊急度が分かりやすいことを確認

4. **レスポンシブデザインのテスト**
   - モバイル、タブレット、デスクトップでの表示を確認
   - 緊急度インジケーターが適切に表示されることを確認

---

## 次のステップ

ジョブカードUI/UX改善が完了しました。次は他の改善項目に進みます。

**参照:**
- `docs/JOB_CARD_UX_REVIEW_AND_IMPROVEMENT_PROPOSAL.md` - ジョブカードUI/UXレビューと改善提案
- `docs/IMPLEMENTATION_ROADMAP.md` - 実装ロードマップ







