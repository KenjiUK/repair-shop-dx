# 12ヶ月点検・24ヶ月点検 高速点検モード UI/UX提案

**作成日**: 2025-01-XX  
**目的**: 現場整備士が効率的に点検作業を行える高速点検モードの設計  
**参考**: 最新モバイルアプリのUI/UXベストプラクティス、医療・検査アプリの高速入力パターン

---

## 現状の問題点

1. **入力操作が煩雑**: 各項目ごとにボタンを選択する必要がある
2. **画面遷移が多い**: ガイドやメニューが画面を占有し、作業フローが中断される
3. **進捗が見えない**: 全体の進捗や残り項目数が分かりにくい
4. **モチベーション維持が難しい**: 単調な作業で達成感が得にくい

---

## 提案: 高速点検モード

### 1. タップ即入力・即次へ（デフォルト動作）

**基本原則**: 通常の操作は「タップ = 良好（レ）→ 自動で次へ」が最速

```typescript
// 項目カードの動作
<InspectionItemCard
  item={item}
  onTap={() => {
    // デフォルト: 良好（レ）を入力
    handleStatusChange(item.id, 'good');
    // ハプティックフィードバック
    triggerHapticFeedback();
    // 自動スクロール（次の項目へ）
    scrollToNextItem();
  }}
  onLongPress={() => {
    // 長押し: 詳細メニューを表示
    showStatusMenu(item);
  }}
/>
```

**メリット**:
- 90%以上の項目が「良好」の場合、1タップで完了
- 手の動きが最小限
- リズムが生まれ、作業速度が向上

---

### 2. 入力方法の多様化

#### 2-1. 長押しで詳細メニュー

```
通常タップ: 良好（レ） → 次へ（最速）
長押し（500ms）: 詳細メニューを展開
```

**詳細メニューのUI**:
- フローティングメニュー（項目の近くに表示）
- または画面端のクイックメニューに表示
- 全記号（○、×、A、T、C、L、△、P、／）を選択可能

#### 2-2. スワイプ操作（オプション）

```
左スワイプ: 前の項目へ
右スワイプ: 次の項目へ
上スワイプ: 良好（レ）を入力
下スワイプ: 詳細メニューを表示
```

**実装優先度**: 中（まずはタップ・長押しで実装、後で追加）

#### 2-3. 音声入力（将来の拡張）

- 手が塞がっている状況でも入力可能
- 「良好」「交換」「調整」などの音声コマンド

**実装優先度**: 低（Phase 2以降）

---

### 3. 進捗の見える化（ゲーミフィケーション風）

#### 3-1. ヘッダーの進捗表示（既存を改善）

```typescript
// ヘッダーに追加
<div className="flex items-center gap-2">
  <span className="text-base font-semibold">
    残り {remainingCount} 項目
  </span>
  <Progress value={progress.percentage} className="h-3 flex-1" />
  <span className="text-base font-semibold tabular-nums">
    {progress.completed} / {progress.total}
  </span>
</div>
```

#### 3-2. 項目カードの視覚的フィードバック

```typescript
// 完了時: 緑色にハイライト（0.5秒後にフェードアウト）
// 未完了: 通常のスタイル
<Card className={cn(
  "transition-all duration-200",
  item.status === 'good' && "bg-green-50 border-green-300",
  isProcessing && "ring-2 ring-blue-500"
)}>
  {/* 項目名 */}
  <CardContent>
    <span className="text-base font-medium">{item.label}</span>
    {/* 完了アイコン（アニメーション付き） */}
    {item.status === 'good' && (
      <CheckCircle2 className="h-5 w-5 text-green-600 animate-in fade-in zoom-in" />
    )}
  </CardContent>
</Card>
```

#### 3-3. カテゴリ完了時のフィードバック

```typescript
// カテゴリが100%完了したら:
// 1. チェックマークアニメーション
// 2. 短い音（オプション）
// 3. 次のカテゴリへの自動遷移（オプション）
if (categoryProgress.percentage === 100) {
  triggerCategoryCompleteAnimation(category);
  // 次のカテゴリに自動遷移（ユーザー設定で有効化可能）
  if (autoAdvanceToNextCategory) {
    navigateToNextCategory();
  }
}
```

---

### 4. ガイドのフローティング化

#### 4-1. 画面端のクイックメニュー

```
┌─────────────────────────┐
│  ヘッダー                │
├─────────────────────────┤
│                         │
│  メインコンテンツ        │ ← 通常はここに集中
│  （項目リスト）          │
│                         │
│                    [M]  │ ← 画面右下に小さな
│                         │    メニューボタン
├─────────────────────────┤
│  フッター                │
└─────────────────────────┘
```

**メニューボタンの動作**:
- タップ: クイックメニューを展開（全記号ボタン）
- 長押し: 設定メニュー（自動進行のON/OFFなど）

#### 4-2. コンテキストメニュー（長押し時）

```typescript
// 項目を長押しした時に表示
<ContextMenu>
  <ContextMenuTrigger>
    <InspectionItemCard item={item} />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onClick={() => handleStatusChange(item.id, 'good')}>
      <CheckCircle2 className="h-4 w-4" /> 良好（レ）
    </ContextMenuItem>
    <ContextMenuItem onClick={() => handleStatusChange(item.id, 'exchange')}>
      <XCircle className="h-4 w-4" /> 交換（×）
    </ContextMenuItem>
    {/* ... 他のステータス ... */}
  </ContextMenuContent>
</ContextMenu>
```

---

### 5. 画面レイアウトの最適化

#### 5-1. シンプルな1列リスト

```typescript
// カード式ではなく、シンプルなリスト形式
<div className="space-y-2">
  {items.map((item, index) => (
    <div
      key={item.id}
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border-2",
        "transition-all duration-200",
        "active:scale-[0.98] active:bg-slate-50", // タップ時のフィードバック
        item.status === 'good' && "bg-green-50 border-green-300",
        item.status === 'none' && "bg-white border-slate-200 hover:border-slate-300"
      )}
      onClick={() => handleQuickInput(item.id)}
      onLongPress={() => handleLongPress(item)}
    >
      {/* 左側: 項目名 */}
      <div className="flex-1 min-w-0">
        <span className="text-base font-medium text-slate-900">
          {item.label}
        </span>
      </div>
      
      {/* 右側: ステータス表示（小さく、非干渉） */}
      <div className="ml-4 shrink-0">
        {item.status !== 'none' && (
          <Badge variant={getStatusVariant(item.status)} className="text-sm">
            {INSPECTION_STATUS_LABELS[item.status]}
          </Badge>
        )}
      </div>
    </div>
  ))}
</div>
```

#### 5-2. 固定ボトムナビゲーションの削除

**理由**: 
- 画面を占有する
- 親指が届きにくい位置にある
- デフォルト動作が「タップ = 良好」なら不要

**代替案**:
- 画面右下のフローティングメニューボタン（必要時のみ表示）
- または完全に削除（長押しメニューで対応）

---

### 6. フィードバックの強化

#### 6-1. ハプティックフィードバック

```typescript
// 良好（レ）入力時: 短い振動（軽い）
triggerHapticFeedback('light');

// 異常（×、△など）入力時: やや長めの振動（中）
triggerHapticFeedback('medium');

// カテゴリ完了時: 2回連続の振動（成功の感覚）
triggerHapticFeedback('success');
```

#### 6-2. 視覚的フィードバック

```typescript
// 項目入力時: チェックマークが0.5秒間表示されてフェードアウト
<div className={cn(
  "absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg",
  "transition-opacity duration-500",
  isCompleted ? "opacity-100" : "opacity-0 pointer-events-none"
)}>
  <CheckCircle2 className="h-12 w-12 text-green-600 animate-in zoom-in" />
</div>
```

#### 6-3. 音声フィードバック（オプション、設定でON/OFF可能）

```typescript
// 良好（レ）入力時: 短い「ピッ」音
// 異常入力時: やや長い「ピー」音
// カテゴリ完了時: 成功音（オプション）
playSound(item.status === 'good' ? 'success' : 'warning');
```

---

### 7. 実装優先順位

#### Phase 1: コア機能（最優先）

1. ✅ **タップ = 良好（レ）→ 自動スクロール**
   - 実装難易度: 低
   - 効果: 高

2. ✅ **長押しで詳細メニュー**
   - 実装難易度: 中
   - 効果: 高

3. ✅ **進捗表示の改善（残り項目数）**
   - 実装難易度: 低
   - 効果: 中

4. ✅ **ハプティックフィードバック**
   - 実装難易度: 低（既存実装あり）
   - 効果: 中

#### Phase 2: 強化機能

5. **スワイプ操作**
   - 実装難易度: 中
   - 効果: 中

6. **視覚的フィードバック（アニメーション）**
   - 実装難易度: 中
   - 効果: 中

7. **固定ボトムナビゲーションの削除**
   - 実装難易度: 低
   - 効果: 高（画面スペースの確保）

#### Phase 3: 拡張機能

8. **音声入力**
   - 実装難易度: 高
   - 効果: 中（手が塞がっている場合に有用）

9. **自動カテゴリ遷移**
   - 実装難易度: 低
   - 効果: 低（ユーザー設定で有効化可能）

---

## 画面レイアウト（改善版）

```
┌─────────────────────────────────────┐
│ ヘッダー（車両情報、進捗バー）        │
│ 残り 15 項目  [==========] 75%      │
├─────────────────────────────────────┤
│ タブ: [かじ取り] [制動] [走行] ...  │
├─────────────────────────────────────┤
│                                     │
│  □ パワーステアリングのベルト...    │ ← タップ = レ
│  ✓ パワーステアリングのオイル...    │ ← 完了済み（緑）
│  □ ブレーキ液の量...                │ ← タップ = レ
│                                     │
│                              [M]    │ ← 右下メニュー
│                                     │
└─────────────────────────────────────┘
```

**改善点**:
1. シンプルなリスト形式（カード不要）
2. タップ領域が広い（行全体）
3. ステータス表示は最小限（右側に小さく）
4. 固定ボトムナビゲーションなし
5. 画面右下に小さなメニューボタン（必要時のみ）

---

## ユーザーフロー（改善版）

### 正常時（90%以上のケース）

```
1. 項目をタップ
   ↓
2. 良好（レ）が自動入力
   ↓
3. ハプティックフィードバック（軽い振動）
   ↓
4. チェックマークが0.5秒表示
   ↓
5. 自動で次の項目にスクロール
   ↓
6. 繰り返し
```

**所要時間**: 約1-2秒/項目

### 異常時（10%以下のケース）

```
1. 項目を長押し（500ms）
   ↓
2. コンテキストメニューが表示
   ↓
3. 必要なステータスを選択（×、△など）
   ↓
4. メニューが自動的に閉じる
   ↓
5. 自動で次の項目にスクロール
```

**所要時間**: 約3-4秒/項目

---

## 業界ベストプラクティスとの整合

### ✅ 採用したベストプラクティス

1. **ワンタップ操作**: 最も頻繁な操作（良好）を1タップで完了
2. **プログレッシブディスクロージャー**: 詳細オプションは長押しで表示
3. **即座のフィードバック**: ハプティック、視覚的フィードバックで即座に確認
4. **進捗の可視化**: ゲーミフィケーション風の進捗表示でモチベーション維持
5. **エラー防止**: 長押しでの詳細メニューにより、誤操作を防止

### ❌ 避けたアンチパターン

1. **過剰な確認ダイアログ**: 通常操作（良好）では確認不要
2. **画面遷移の多用**: メニューはフローティングで表示
3. **小さなタップ領域**: 行全体をタップ可能に
4. **情報の過剰表示**: 必要最小限の情報のみ表示

---

## 次のステップ

1. **プロトタイプの作成**: Phase 1の機能を実装
2. **ユーザーテスト**: 実際の整備士に試用してもらう
3. **フィードバックの収集**: 改善点を特定
4. **反復的改善**: フィードバックを反映して改善






