# ワークフロー・フェーズ表示 UI/UX 改善提案書

**作成日**: 2025-01-XX  
**目的**: ワークフロー型業務アプリとして、ユーザー業務目線・現場での使用を考慮した最高のUI/UXを実現

---

## 📋 現状の課題

### 1. 視認性の問題
- **ドット表示（●/○）だけでは分かりにくい**: 何を意味するか直感的に理解できない
- **フェーズ番号だけでは情報不足**: "Phase 2/6"だけでは、現在何をしているのか、次に何をすべきか分からない
- **フェーズ名が表示されていない**: 各フェーズが何を意味するか、テキストで表示されていない

### 2. ナビゲーション機能の欠如
- **進む・戻る機能がない**: 前後のフェーズに移動できない
- **全体像の把握が困難**: 現在のフェーズが全体の中でどの位置にあるか分かりにくい

### 3. ユーザーロール別の最適化不足
- **整備士**: 診断（Phase 2）と作業（Phase 5）のみを扱うが、全体が見えない
- **サービスフロント**: 受付（Phase 1）、見積（Phase 3）を主に扱うが、全体を見たい場合もある
- **ロールに応じた表示がない**: 全員に同じ表示をしている

---

## 🎯 改善提案

### 提案1: ステップインジケーター形式への変更（推奨）

**コンセプト**: ワークフロー型業務アプリのベストプラクティスに基づく、視覚的で直感的な表示

#### デスクトップ表示

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] 受入点検（車検）診断                                          │
│                                                                   │
│ ┌──────┬──────┬──────┬──────┬──────┐                          │
│ │ 受付  │ 診断  │ 見積  │ 作業  │ 報告  │  ← ステップバー      │
│ │  ✓   │  ●   │  ○   │  ○   │  ○   │                          │
│ └──────┴──────┴──────┴──────┴──────┘                          │
│   [←前へ] [次へ→]  ← ナビゲーションボタン                      │
└─────────────────────────────────────────────────────────────────┘
```

**要素**:
- **ステップバー**: 各フェーズを横並びで表示
  - 完了: ✓（グレー）
  - 現在: ●（青、大きく表示）
  - 未完了: ○（グレー）
  - スキップ: ─（点線）
- **フェーズ名**: 各ステップに明確な名称を表示（"受付"、"診断"、"見積"など）
- **ナビゲーションボタン**: 前後のフェーズに移動できるボタン（権限がある場合のみ）

#### モバイル表示（コンパクト）

```
┌─────────────────────────────────────┐
│ [←] 受入点検（車検）診断              │
│                                       │
│ 診断 (2/5)                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 受付 ✓  診断 ●  見積 ○  作業 ○  報告 ○ │
│ [←前へ] [次へ→]                      │
└─────────────────────────────────────┘
```

**要素**:
- **現在のフェーズ名**: "診断 (2/5)"のように表示
- **進捗バー**: 全体の進捗を視覚的に表示
- **コンパクトなステップ表示**: フェーズ名を短縮表示
- **ナビゲーションボタン**: 前後のフェーズに移動

### 提案2: ユーザーロール別の表示最適化

#### 整備士（Mechanic）向け表示

**主な業務**: 診断（Phase 2）、作業（Phase 5）

**表示内容**:
- **診断画面**: 診断と作業のみを表示（Phase 2, 5）
- **作業画面**: 診断と作業のみを表示（Phase 2, 5）
- **前後のフェーズへの移動**: 必要に応じて前後のフェーズに移動可能（権限チェック付き）

```
┌─────────────────────────────────────┐
│ 診断 (1/2)                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 診断 ●  作業 ○                       │
│ [←前へ] [次へ→]                      │
└─────────────────────────────────────┘
```

#### サービスフロント（Front）向け表示

**主な業務**: 受付（Phase 1）、見積（Phase 3）、顧客へのプレゼンテーション

**表示内容**:
- **全体表示**: 全フェーズを表示（Phase 0-6）
- **現在のフェーズを強調**: 現在作業中のフェーズをハイライト
- **前後のフェーズへの移動**: 必要に応じて前後のフェーズに移動可能

```
┌─────────────────────────────────────────────────────────────┐
│ 見積 (3/7)                                                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 事前問診 ✓  受付 ✓  診断 ✓  見積 ●  承認 ○  作業 ○  報告 ○ │
│ [←前へ] [次へ→]                                              │
└─────────────────────────────────────────────────────────────┘
```

### 提案3: インタラクティブなナビゲーション

#### クリック可能なステップ

- **完了したフェーズ**: クリックでそのフェーズのページに移動（権限がある場合）
- **現在のフェーズ**: クリックで詳細モーダルを表示
- **未完了のフェーズ**: クリックで「このフェーズはまだ完了していません」などのメッセージを表示

#### 前後ナビゲーションボタン

- **前へボタン**: 前のフェーズに移動（権限がある場合、完了している場合）
- **次へボタン**: 次のフェーズに移動（権限がある場合、現在のフェーズが完了している場合）
- **無効化**: 権限がない、または前のフェーズが完了していない場合は無効化

#### ナビゲーションの権限チェック

```typescript
// 整備士の場合
const canNavigateToPhase = (phase: number, userRole: UserRole): boolean => {
  if (userRole === "mechanic") {
    // 整備士は診断（Phase 2）と作業（Phase 5）のみアクセス可能
    return phase === 2 || phase === 5;
  }
  // サービスフロントは全フェーズにアクセス可能
  return true;
};
```

### 提案4: 視覚的な改善

#### カラーコーディング

- **完了**: グレー（`bg-slate-400`）
- **現在**: 青（`bg-blue-600`）
- **未完了**: グレーのボーダー（`border-slate-300`）
- **スキップ**: 点線のボーダー（`border-dashed`）

#### アイコンとテキストの組み合わせ

- **完了**: ✓ + "受付"（グレー）
- **現在**: ● + "診断"（青、大きく表示）
- **未完了**: ○ + "見積"（グレー）
- **スキップ**: ─ + "見積"（点線）

#### ホバー効果

- **クリック可能なステップ**: ホバー時に背景色を変更（`hover:bg-slate-100`）
- **ツールチップ**: ホバー時にフェーズの説明を表示

---

## 🔧 実装設計

### コンポーネント設計

#### `WorkflowStepIndicator`（新規コンポーネント）

```typescript
interface WorkflowStepIndicatorProps {
  /** 現在のフェーズ（0-6） */
  currentPhase: number;
  /** 完了したフェーズのリスト */
  completedPhases?: number[];
  /** スキップするフェーズのリスト */
  skippedPhases?: number[];
  /** 除外するフェーズのリスト（JOBカードに表示するため除外） */
  excludePhases?: number[];
  /** ユーザーロール */
  userRole?: UserRole;
  /** ジョブID（ナビゲーション用） */
  jobId?: string;
  /** モバイル表示モード */
  mobileMode?: boolean;
  /** ナビゲーション有効化 */
  enableNavigation?: boolean;
}
```

#### フェーズとURLのマッピング

```typescript
const PHASE_ROUTES: Record<number, (jobId: string) => string> = {
  0: (jobId) => `/customer/pre-checkin/${jobId}`,
  1: (jobId) => `/?highlight=${jobId}`, // TOPページ
  2: (jobId) => `/mechanic/diagnosis/${jobId}`,
  3: (jobId) => `/admin/estimate/${jobId}`,
  4: (jobId) => `/customer/approval/${jobId}`,
  5: (jobId) => `/mechanic/work/${jobId}`,
  6: (jobId) => `/customer/report/${jobId}`,
};
```

#### ユーザーロール別の表示フェーズ

```typescript
const getVisiblePhases = (userRole: UserRole, excludePhases: number[] = []): number[] => {
  const allPhases = [0, 1, 2, 3, 4, 5, 6];
  
  // 除外フェーズを除く
  let visible = allPhases.filter(p => !excludePhases.includes(p));
  
  // ユーザーロールに応じてフィルタリング
  if (userRole === "mechanic") {
    // 整備士は診断（Phase 2）と作業（Phase 5）のみ
    visible = visible.filter(p => p === 2 || p === 5);
  } else if (userRole === "customer") {
    // 顧客は事前問診（Phase 0）、承認（Phase 4）、報告（Phase 6）のみ
    visible = visible.filter(p => p === 0 || p === 4 || p === 6);
  }
  // サービスフロント（front）と管理者（admin）は全フェーズ表示
  
  return visible;
};
```

---

## 🎨 UI/UXデザイン詳細

### デスクトップ表示（推奨）

```
┌─────────────────────────────────────────────────────────────────────┐
│ [←] 受入点検（車検）診断                                             │
│                                                                       │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐           │
│ │   受付    │   診断    │   見積    │   作業    │   報告    │           │
│ │          │          │          │          │          │           │
│ │    ✓     │    ●     │    ○     │    ○     │    ○     │           │
│ │ 完了済み  │ 作業中    │ 未完了    │ 未完了    │ 未完了    │           │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘           │
│                                                                       │
│ [← 前へ: 受付]              [次へ: 見積 →]                            │
└─────────────────────────────────────────────────────────────────────┘
```

**要素**:
- **ステップカード**: 各フェーズをカード形式で表示
  - 高さ: `h-20`（80px、タッチターゲット48px以上）
  - 幅: 等幅（`flex-1`）
  - パディング: `p-4`
  - フォントサイズ: `text-base`（16px以上）
- **アイコン**: 完了（✓）、現在（●）、未完了（○）
- **フェーズ名**: 明確な名称を表示
- **ステータス**: "完了済み"、"作業中"、"未完了"などのテキスト
- **ナビゲーションボタン**: 前後のフェーズに移動（権限がある場合のみ）

### モバイル表示（コンパクト）

```
┌─────────────────────────────────────┐
│ [←] 受入点検（車検）診断              │
│                                       │
│ 診断 (2/5)                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                       │
│ [受付] [診断] [見積] [作業] [報告]   │
│   ✓     ●     ○     ○     ○        │
│                                       │
│ [← 前へ]        [次へ →]             │
└─────────────────────────────────────┘
```

**要素**:
- **現在のフェーズ名**: "診断 (2/5)"のように表示
- **進捗バー**: 全体の進捗を視覚的に表示
- **コンパクトなステップ表示**: フェーズ名を短縮表示、横スクロール可能
- **ナビゲーションボタン**: 前後のフェーズに移動

---

## 🚀 実装手順

### Step 1: 新しいコンポーネントの作成

**ファイル**: `src/components/features/workflow-step-indicator.tsx`

**実装内容**:
1. ステップインジケーターコンポーネントの作成
2. ユーザーロール別の表示ロジック
3. ナビゲーション機能（前後ボタン、クリック可能なステップ）
4. レスポンシブデザイン（デスクトップ・モバイル）

### Step 2: 既存コンポーネントの置き換え

**ファイル**: `src/app/mechanic/diagnosis/[id]/page.tsx`, `src/app/mechanic/work/[id]/page.tsx`

**実装内容**:
1. `WorkflowPhaseIndicator`を`WorkflowStepIndicator`に置き換え
2. ユーザーロールの取得と渡し
3. ジョブIDの取得と渡し（ナビゲーション用）

### Step 3: ナビゲーション機能の実装

**実装内容**:
1. フェーズとURLのマッピング
2. 権限チェックロジック
3. 前後ボタンの実装
4. クリック可能なステップの実装

### Step 4: ユーザーロール別の最適化

**実装内容**:
1. 整備士向けの表示（診断・作業のみ）
2. サービスフロント向けの表示（全フェーズ）
3. 顧客向けの表示（事前問診・承認・報告のみ）

---

## ✅ 実装チェックリスト

- [ ] `WorkflowStepIndicator`コンポーネントの作成
- [ ] ステップインジケーター形式のUI実装
- [ ] フェーズ名の表示
- [ ] 進捗バーの実装
- [ ] ナビゲーションボタン（前後）の実装
- [ ] クリック可能なステップの実装
- [ ] ユーザーロール別の表示ロジック
- [ ] 権限チェックロジック
- [ ] フェーズとURLのマッピング
- [ ] レスポンシブデザイン（デスクトップ・モバイル）
- [ ] 診断ページでの実装
- [ ] 作業ページでの実装
- [ ] 見積ページでの実装
- [ ] 動作確認（整備士・サービスフロント・顧客）

---

## 📚 参考資料

- **ワークフロー型業務アプリのベストプラクティス**:
  - Linear, Notion, Asanaなどのステップインジケーター
  - 進捗バーとナビゲーションの組み合わせ
  - ユーザーロール別の表示最適化

- **アクセシビリティ**:
  - タッチターゲット: 最小48px × 48px
  - コントラスト比: 4.5:1以上
  - スクリーンリーダー対応

- **パフォーマンス**:
  - 軽量な実装
  - アニメーションの最適化
  - レスポンシブデザイン

---

## 🎯 期待される効果

1. **視認性の向上**: フェーズ名を表示することで、現在の位置と次のステップが明確になる
2. **ナビゲーションの改善**: 前後のフェーズに移動できることで、業務効率が向上
3. **ユーザーロール別の最適化**: 各ユーザーの業務に合わせた表示により、使いやすさが向上
4. **全体像の把握**: サービスフロントが全体を見ることで、業務の流れを把握しやすくなる

---

## 📐 詳細実装設計

### コンポーネント構造

```typescript
// src/components/features/workflow-step-indicator.tsx

interface WorkflowStepIndicatorProps {
  currentPhase: number;
  completedPhases?: number[];
  skippedPhases?: number[];
  excludePhases?: number[];
  userRole?: UserRole;
  jobId?: string;
  mobileMode?: boolean;
  enableNavigation?: boolean;
}

// フェーズラベル（短縮版とフル版）
const PHASE_LABELS_SHORT: Record<number, string> = {
  0: "事前問診",
  1: "受付",
  2: "診断",
  3: "見積",
  4: "承認",
  5: "作業",
  6: "報告",
};

const PHASE_LABELS_FULL: Record<number, string> = {
  0: "事前チェックイン",
  1: "受付",
  2: "診断",
  3: "見積作成",
  4: "見積承認",
  5: "作業",
  6: "作業完了報告",
};

// フェーズとURLのマッピング
const PHASE_ROUTES: Record<number, (jobId: string) => string> = {
  0: (jobId) => `/customer/pre-checkin/${jobId}`,
  1: (jobId) => `/?highlight=${jobId}`,
  2: (jobId) => `/mechanic/diagnosis/${jobId}`,
  3: (jobId) => `/admin/estimate/${jobId}`,
  4: (jobId) => `/customer/approval/${jobId}`,
  5: (jobId) => `/mechanic/work/${jobId}`,
  6: (jobId) => `/customer/report/${jobId}`,
};

// ユーザーロール別の表示フェーズ
function getVisiblePhases(userRole: UserRole, excludePhases: number[] = []): number[] {
  const allPhases = [0, 1, 2, 3, 4, 5, 6];
  let visible = allPhases.filter(p => !excludePhases.includes(p));
  
  if (userRole === "mechanic") {
    // 整備士: 診断（Phase 2）と作業（Phase 5）のみ
    visible = visible.filter(p => p === 2 || p === 5);
  } else if (userRole === "customer") {
    // 顧客: 事前問診（Phase 0）、承認（Phase 4）、報告（Phase 6）のみ
    visible = visible.filter(p => p === 0 || p === 4 || p === 6);
  }
  // サービスフロント（front）と管理者（admin）は全フェーズ表示
  
  return visible;
}

// ナビゲーション権限チェック
function canNavigateToPhase(phase: number, userRole: UserRole): boolean {
  if (userRole === "mechanic") {
    return phase === 2 || phase === 5;
  } else if (userRole === "customer") {
    return phase === 0 || phase === 4 || phase === 6;
  }
  return true; // サービスフロントと管理者は全フェーズにアクセス可能
}
```

### UIレイアウト（デスクトップ）

```tsx
// デスクトップ表示
<div className="w-full space-y-4">
  {/* ステップバー */}
  <div className="flex items-center gap-2">
    {visiblePhases.map((phase, index) => {
      const status = getPhaseStatus(phase);
      const isClickable = canNavigateToPhase(phase, userRole) && 
                         (status === "completed" || status === "active");
      
      return (
        <div key={phase} className="flex-1">
          {/* 接続線 */}
          {index > 0 && (
            <div className={cn(
              "h-0.5 mb-2",
              completedPhases.includes(visiblePhases[index - 1]) 
                ? "bg-slate-400" 
                : "bg-slate-200"
            )} />
          )}
          
          {/* ステップカード */}
          <button
            onClick={() => isClickable && handlePhaseClick(phase)}
            disabled={!isClickable}
            className={cn(
              "w-full p-4 rounded-lg border-2 transition-all",
              "min-h-[80px] flex flex-col items-center justify-center gap-2",
              status === "active" && "border-blue-600 bg-blue-50",
              status === "completed" && "border-slate-400 bg-slate-50",
              status === "pending" && "border-slate-300 bg-white",
              status === "skipped" && "border-dashed border-slate-300 bg-slate-50",
              isClickable && "cursor-pointer hover:shadow-md",
              !isClickable && "cursor-default"
            )}
          >
            {/* アイコン */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              status === "active" && "bg-blue-600 text-white",
              status === "completed" && "bg-slate-400 text-white",
              status === "pending" && "border-2 border-slate-300 bg-white",
              status === "skipped" && "border-2 border-dashed border-slate-300 bg-white"
            )}>
              {status === "completed" && <Check className="h-5 w-5" />}
              {status === "active" && <Circle className="h-5 w-5 fill-current" />}
              {status === "pending" && <Circle className="h-5 w-5" />}
              {status === "skipped" && <Minus className="h-5 w-5" />}
            </div>
            
            {/* フェーズ名 */}
            <span className={cn(
              "text-base font-semibold",
              status === "active" && "text-blue-700",
              status === "completed" && "text-slate-700",
              status === "pending" && "text-slate-500",
              status === "skipped" && "text-slate-400"
            )}>
              {PHASE_LABELS_SHORT[phase]}
            </span>
            
            {/* ステータス */}
            <span className={cn(
              "text-sm",
              status === "active" && "text-blue-600",
              status === "completed" && "text-slate-600",
              status === "pending" && "text-slate-400",
              status === "skipped" && "text-slate-300"
            )}>
              {status === "active" && "作業中"}
              {status === "completed" && "完了済み"}
              {status === "pending" && "未完了"}
              {status === "skipped" && "スキップ"}
            </span>
          </button>
        </div>
      );
    })}
  </div>
  
  {/* ナビゲーションボタン */}
  {enableNavigation && (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={handlePreviousPhase}
        disabled={!canNavigateToPrevious}
        className="h-12 text-base"
      >
        <ChevronLeft className="h-5 w-5 mr-2" />
        前へ: {previousPhaseLabel}
      </Button>
      
      <Button
        variant="outline"
        onClick={handleNextPhase}
        disabled={!canNavigateToNext}
        className="h-12 text-base"
      >
        次へ: {nextPhaseLabel}
        <ChevronRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  )}
</div>
```

### UIレイアウト（モバイル）

```tsx
// モバイル表示（コンパクト）
<div className="w-full space-y-3">
  {/* 現在のフェーズ表示 */}
  <div className="flex items-center justify-between">
    <div>
      <span className="text-lg font-semibold text-slate-900">
        {PHASE_LABELS_SHORT[currentPhase]}
      </span>
      <span className="text-base text-slate-600 ml-2">
        ({currentPhaseIndex + 1}/{visiblePhases.length})
      </span>
    </div>
  </div>
  
  {/* 進捗バー */}
  <Progress 
    value={(currentPhaseIndex + 1) / visiblePhases.length * 100} 
    className="h-2"
  />
  
  {/* コンパクトなステップ表示（横スクロール） */}
  <ScrollArea className="w-full">
    <div className="flex items-center gap-2 pb-2">
      {visiblePhases.map((phase) => {
        const status = getPhaseStatus(phase);
        return (
          <button
            key={phase}
            onClick={() => canNavigateToPhase(phase, userRole) && handlePhaseClick(phase)}
            className={cn(
              "px-4 py-2 rounded-lg border-2 shrink-0 transition-all",
              "min-h-[48px] flex items-center gap-2",
              status === "active" && "border-blue-600 bg-blue-50",
              status === "completed" && "border-slate-400 bg-slate-50",
              status === "pending" && "border-slate-300 bg-white",
              status === "skipped" && "border-dashed border-slate-300 bg-slate-50"
            )}
          >
            {status === "completed" && <Check className="h-4 w-4 text-slate-600" />}
            {status === "active" && <Circle className="h-4 w-4 text-blue-600 fill-blue-600" />}
            {status === "pending" && <Circle className="h-4 w-4 text-slate-300" />}
            {status === "skipped" && <Minus className="h-4 w-4 text-slate-300" />}
            <span className="text-base font-medium text-slate-700">
              {PHASE_LABELS_SHORT[phase]}
            </span>
          </button>
        );
      })}
    </div>
  </ScrollArea>
  
  {/* ナビゲーションボタン */}
  {enableNavigation && (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={handlePreviousPhase}
        disabled={!canNavigateToPrevious}
        className="flex-1 h-12 text-base"
      >
        <ChevronLeft className="h-5 w-5 mr-2" />
        前へ
      </Button>
      
      <Button
        variant="outline"
        onClick={handleNextPhase}
        disabled={!canNavigateToNext}
        className="flex-1 h-12 text-base"
      >
        次へ
        <ChevronRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  )}
</div>
```

### ナビゲーションロジック

```typescript
// 前のフェーズに移動
const handlePreviousPhase = () => {
  const currentIndex = visiblePhases.indexOf(currentPhase);
  if (currentIndex > 0) {
    const previousPhase = visiblePhases[currentIndex - 1];
    if (canNavigateToPhase(previousPhase, userRole) && jobId) {
      router.push(PHASE_ROUTES[previousPhase](jobId));
    }
  }
};

// 次のフェーズに移動
const handleNextPhase = () => {
  const currentIndex = visiblePhases.indexOf(currentPhase);
  if (currentIndex < visiblePhases.length - 1) {
    const nextPhase = visiblePhases[currentIndex + 1];
    // 次のフェーズに移動するには、現在のフェーズが完了している必要がある
    if (canNavigateToPhase(nextPhase, userRole) && 
        completedPhases.includes(currentPhase) && 
        jobId) {
      router.push(PHASE_ROUTES[nextPhase](jobId));
    }
  }
};

// 特定のフェーズに移動
const handlePhaseClick = (phase: number) => {
  if (canNavigateToPhase(phase, userRole) && jobId) {
    router.push(PHASE_ROUTES[phase](jobId));
  } else {
    toast.info("このフェーズにアクセスする権限がありません");
  }
};
```

---

## 🔍 ベストプラクティス参考

### 1. Linear（プロジェクト管理ツール）
- **ステップインジケーター**: 各ステップをカード形式で表示
- **進捗バー**: 全体の進捗を視覚的に表示
- **クリック可能なステップ**: 完了したステップをクリックで詳細表示

### 2. Notion（ドキュメントツール）
- **シンプルなステップ表示**: フェーズ名とアイコンの組み合わせ
- **ホバー効果**: ホバー時に詳細情報を表示
- **レスポンシブデザイン**: モバイルではコンパクト表示

### 3. Asana（タスク管理ツール）
- **視覚的な進捗表示**: 各ステップの状態を明確に表示
- **ナビゲーション**: 前後のステップに移動可能
- **ユーザーロール別の表示**: 権限に応じて表示を変更

---

## 🎨 デザインシステム準拠

### カラー
- **完了**: `bg-slate-400`（グレー）
- **現在**: `bg-blue-600`（青、Primaryカラー）
- **未完了**: `border-slate-300`（グレーのボーダー）
- **スキップ**: `border-dashed border-slate-300`（点線のボーダー）

### フォントサイズ
- **フェーズ名**: `text-base`（16px以上）
- **ステータス**: `text-sm`（14px、最小限）
- **ナビゲーションボタン**: `text-base`（16px以上）

### タッチターゲット
- **ステップカード**: `min-h-[80px]`（80px、タッチターゲット48px以上）
- **ナビゲーションボタン**: `h-12`（48px、タッチターゲット48px以上）
- **モバイルステップ**: `min-h-[48px]`（48px、タッチターゲット48px以上）

---

## 🚀 実装優先度

**高**: ユーザーが現在の位置と次のステップを把握できない問題は、業務効率に直接影響するため、優先的に実装すべき

**推奨実装順序**:
1. `WorkflowStepIndicator`コンポーネントの作成（Step 1）
2. 診断ページ・作業ページでの実装（Step 2）
3. ナビゲーション機能の実装（Step 3）
4. ユーザーロール別の最適化（Step 4）
5. 動作確認とバグ修正

