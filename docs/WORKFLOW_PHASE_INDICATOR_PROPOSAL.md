# ワークフロー・フェーズ表示提案書

**作成日**: 2025-01-XX  
**目的**: 診断画面・作業画面などで現在のフェーズ（Phase）を明確に表示する提案

---

## 📋 現状分析

### 問題点

1. **フロー型だがどこにいるか不明**
   - 診断画面（Phase 2）にいるのか、作業画面（Phase 5）にいるのか分からない
   - 全体のワークフローの中で現在位置が不明確
   - 次に何をすべきか分からない

2. **ヘッダーにフロー表示がない**
   - `AppHeader`には`rightArea`プロパティがあるが、診断ページで使用されていない
   - コメントには「フェーズバッジやステータスバッジなど」とあるが実装されていない

### 業務フロー（Phase別）

| Phase | 名称 | 担当者 | 主な画面 | 目的 |
|-------|------|--------|---------|------|
| **Phase 0** | 事前チェックイン | 顧客 | `/customer/pre-checkin/[id]` | 来店前の情報入力 |
| **Phase 1** | 受付 | 受付スタッフ | `/` (TOPページ) | 来店確認、タグ紐付け |
| **Phase 2** | 診断 | メカニック | `/mechanic/diagnosis/[id]` | 車両診断、写真撮影 |
| **Phase 3** | 見積作成 | 事務員・管理者 | `/admin/estimate/[id]` | 見積もり作成 |
| **Phase 4** | 顧客承認 | 顧客 | `/customer/approval/[id]` | 見積もり承認・却下 |
| **Phase 5** | 作業 | メカニック | `/mechanic/work/[id]` | 作業実施、写真撮影 |
| **Phase 6** | 報告 | 顧客 | `/customer/report/[id]` | 作業完了報告の確認 |

---

## 🎯 提案内容

### 提案1: ヘッダーにステップインジケーターを表示（推奨）

**目的**: 現在のフェーズを明確に表示し、全体のワークフローを可視化

**実装場所**: `AppHeader`の`rightArea`プロパティを使用

**UIデザイン**:

```
┌─────────────────────────────────────────────────────────┐
│ [←] 受入点検（車検）診断    [Phase 2/6] [●][○][○][○][○][○] │
└─────────────────────────────────────────────────────────┘
```

**詳細**:
- **左側**: ページタイトル（既存）
- **右側**: ステップインジケーター
  - 現在のフェーズ番号（例: "Phase 2/6"）
  - 6つのフェーズをドット（●/○）で表示
  - 現在のフェーズを●（アクティブ）、完了したフェーズを●（グレー）、未完了のフェーズを○（グレー）で表示

**モバイル表示**:
- 画面幅が狭い場合は、フェーズ番号のみ表示（"Phase 2/6"）
- タップで詳細を表示（モーダルまたはツールチップ）

### 提案2: ステップインジケーターコンポーネントの作成

**コンポーネント名**: `WorkflowPhaseIndicator`

**Props**:
```typescript
interface WorkflowPhaseIndicatorProps {
  /** 現在のフェーズ（0-6） */
  currentPhase: number;
  /** 完了したフェーズのリスト（例: [0, 1]） */
  completedPhases?: number[];
  /** スキップするフェーズのリスト（例: [3, 4] - 追加見積もりがない場合） */
  skippedPhases?: number[];
  /** モバイル表示モード（デフォルト: false） */
  mobileMode?: boolean;
  /** クリック時のハンドラ（詳細表示用） */
  onClick?: () => void;
}
```

**フェーズラベル**:
```typescript
const PHASE_LABELS = {
  0: "事前チェックイン",
  1: "受付",
  2: "診断",
  3: "見積",
  4: "承認",
  5: "作業",
  6: "報告",
};
```

**表示ロジック**:
- **アクティブフェーズ**: 現在のフェーズを●（青）で表示
- **完了フェーズ**: 完了したフェーズを●（グレー）で表示
- **未完了フェーズ**: 未完了のフェーズを○（グレー）で表示
- **スキップフェーズ**: スキップするフェーズを○（点線）で表示

### 提案3: 診断ページでの実装

**ファイル**: `src/app/mechanic/diagnosis/[id]/page.tsx`

**実装箇所**: `AppHeader`の`rightArea`プロパティに`WorkflowPhaseIndicator`を渡す

```typescript
<AppHeader
  rightArea={
    <WorkflowPhaseIndicator
      currentPhase={2}
      completedPhases={[0, 1]} // 事前チェックイン、受付は完了
      skippedPhases={
        // 追加見積もりがない場合は見積・承認をスキップ
        hasNoAdditionalEstimate ? [3, 4] : []
      }
    />
  }
  // ... その他のprops
>
```

**完了フェーズの判定**:
- **Phase 0（事前チェックイン）**: `job.field7`に顧客入力がある場合、または`field22`（入庫日時）が設定されている場合
- **Phase 1（受付）**: `job.field5`が「入庫済み」以上の場合
- **Phase 2（診断）**: 現在のページ（診断ページ）にいる場合
- **Phase 3（見積）**: `job.field5`が「見積作成待ち」以上の場合
- **Phase 4（承認）**: `job.field5`が「顧客承認待ち」以上の場合
- **Phase 5（作業）**: `job.field5`が「作業待ち」以上の場合
- **Phase 6（報告）**: `job.field5`が「出庫待ち」以上の場合

**スキップフェーズの判定**:
- **Phase 3-4（見積・承認）**: 追加見積もりがない場合（24ヶ月点検・12ヶ月点検で`additionalEstimateRequired/Recommended/Optional`がすべて空）

### 提案4: 作業ページでの実装

**ファイル**: `src/app/mechanic/work/[id]/page.tsx`

**実装箇所**: 同様に`AppHeader`の`rightArea`に`WorkflowPhaseIndicator`を渡す

```typescript
<AppHeader
  rightArea={
    <WorkflowPhaseIndicator
      currentPhase={5}
      completedPhases={[0, 1, 2, 3, 4]} // 事前チェックイン〜承認まで完了
      skippedPhases={
        // 追加見積もりがない場合は見積・承認をスキップ
        hasNoAdditionalEstimate ? [3, 4] : []
      }
    />
  }
  // ... その他のprops
>
```

---

## 🎨 UI/UXデザイン

### デスクトップ表示

```
┌─────────────────────────────────────────────────────────────┐
│ [←] 受入点検（車検）診断    Phase 2/6  ● ● ● ○ ○ ○          │
└─────────────────────────────────────────────────────────────┘
```

**要素**:
- **フェーズ番号**: "Phase 2/6"（`text-base font-semibold`）
- **ドット表示**: 6つのドット（`flex gap-1`）
  - アクティブ: `w-2 h-2 rounded-full bg-blue-600`
  - 完了: `w-2 h-2 rounded-full bg-slate-400`
  - 未完了: `w-2 h-2 rounded-full border-2 border-slate-300 bg-transparent`
  - スキップ: `w-2 h-2 rounded-full border-2 border-dashed border-slate-300 bg-transparent`

### モバイル表示（デフォルト）

```
┌─────────────────────────────────────┐
│ [←] 受入点検（車検）診断    Phase 2/6 │
└─────────────────────────────────────┘
```

**要素**:
- **フェーズ番号のみ表示**: "Phase 2/6"（`text-sm font-semibold`）
- **タップで詳細表示**: モーダルまたはツールチップで全フェーズを表示

### モバイル表示（詳細モーダル）

```
┌─────────────────────────────────────┐
│ ワークフロー進捗              [×]   │
├─────────────────────────────────────┤
│ Phase 0: 事前チェックイン      [✓]  │
│ Phase 1: 受付                  [✓]  │
│ Phase 2: 診断                  [●]  │
│ Phase 3: 見積                  [○]  │
│ Phase 4: 承認                  [○]  │
│ Phase 5: 作業                  [○]  │
│ Phase 6: 報告                  [○]  │
└─────────────────────────────────────┘
```

**要素**:
- **モーダルタイトル**: "ワークフロー進捗"
- **フェーズリスト**: 各フェーズのラベルとステータス
  - 完了: [✓]（`text-green-600`）
  - アクティブ: [●]（`text-blue-600`）
  - 未完了: [○]（`text-slate-400`）
  - スキップ: [─]（`text-slate-300`、点線）

---

## 🔧 実装手順

### Step 1: ステップインジケーターコンポーネントの作成

**ファイル**: `src/components/features/workflow-phase-indicator.tsx`

**実装内容**:
1. `WorkflowPhaseIndicator`コンポーネントを作成
2. フェーズラベルの定義
3. ドット表示のロジック
4. モバイル表示の切り替え
5. モーダル表示（モバイル用）

### Step 2: 診断ページでの実装

**ファイル**: `src/app/mechanic/diagnosis/[id]/page.tsx`

**実装内容**:
1. `WorkflowPhaseIndicator`をインポート
2. 完了フェーズの判定ロジックを追加
3. スキップフェーズの判定ロジックを追加（追加見積もりがない場合）
4. `AppHeader`の`rightArea`に`WorkflowPhaseIndicator`を渡す

### Step 3: 作業ページでの実装

**ファイル**: `src/app/mechanic/work/[id]/page.tsx`

**実装内容**:
1. `WorkflowPhaseIndicator`をインポート
2. 完了フェーズの判定ロジックを追加
3. スキップフェーズの判定ロジックを追加（追加見積もりがない場合）
4. `AppHeader`の`rightArea`に`WorkflowPhaseIndicator`を渡す

### Step 4: その他のページでの実装

**対象ページ**:
- 見積ページ（`/admin/estimate/[id]`）: Phase 3
- 顧客承認ページ（`/customer/approval/[id]`）: Phase 4
- 顧客報告ページ（`/customer/report/[id]`）: Phase 6

---

## ✅ 実装チェックリスト

- [ ] `WorkflowPhaseIndicator`コンポーネントを作成
- [ ] フェーズラベルの定義
- [ ] ドット表示のロジック（アクティブ、完了、未完了、スキップ）
- [ ] モバイル表示の切り替え
- [ ] モーダル表示（モバイル用）
- [ ] 診断ページでの実装
- [ ] 作業ページでの実装
- [ ] 見積ページでの実装
- [ ] 顧客承認ページでの実装
- [ ] 顧客報告ページでの実装
- [ ] 完了フェーズの判定ロジック
- [ ] スキップフェーズの判定ロジック（追加見積もりがない場合）
- [ ] 動作確認（デスクトップ・モバイル）

---

## 🎨 デザインシステム準拠

### カラー

- **アクティブフェーズ**: `bg-blue-600`（`DESIGN_SYSTEM.md`のPrimaryカラー）
- **完了フェーズ**: `bg-slate-400`（グレー）
- **未完了フェーズ**: `border-slate-300`（グレーのボーダー）
- **スキップフェーズ**: `border-slate-300 border-dashed`（点線のボーダー）

### フォントサイズ

- **デスクトップ**: `text-base`（16px以上、`DESIGN_SYSTEM.md`準拠）
- **モバイル**: `text-sm`（14px、最小限）

### タッチターゲット

- **ドット**: `w-2 h-2`（8px × 8px、モバイルでは`w-3 h-3`に拡大）
- **フェーズ番号**: タップ可能な領域を確保（`min-h-[48px]`）

---

## 📚 参考資料

- `docs/DESIGN_SYSTEM.md`: デザインシステム（カラー、フォントサイズ、タッチターゲット）
- `docs/PAGE_SPECIFICATION.md`: ページ仕様（Phase別の詳細）
- `src/components/layout/app-header.tsx`: ヘッダーコンポーネント（`rightArea`プロパティ）

---

## 🚀 実装優先度

**高**: ユーザーが現在のフェーズを把握できない問題は、業務効率に直接影響するため、優先的に実装すべき

**推奨実装順序**:
1. `WorkflowPhaseIndicator`コンポーネントの作成（Step 1）
2. 診断ページでの実装（Step 2）
3. 作業ページでの実装（Step 3）
4. その他のページでの実装（Step 4）
5. 動作確認とバグ修正




