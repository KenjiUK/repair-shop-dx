# 整備士専用ページ（作業系・点検系）デザイン仕様

**最終更新日**: 2025-01-XX  
**対象ページ**: 整備士が使用する作業系・点検系ページ  
**設計方針**: 40歳以上ユーザー向け最適化、WCAG 2.1 AA準拠、カラーユニバーサルデザイン対応

---

## 目次

1. [対象ページ](#1-対象ページ)
2. [レイアウト構造](#2-レイアウト構造)
3. [ヘッダー仕様](#3-ヘッダー仕様)
4. [コンテンツエリア仕様](#4-コンテンツエリア仕様)
5. [デザインシステム準拠](#5-デザインシステム準拠)
6. [実装例](#6-実装例)

---

## 1. 対象ページ

### 1-1. 診断ページ

**パス**: `/mechanic/diagnosis/[id]`  
**ファイル**: `src/app/mechanic/diagnosis/[id]/page.tsx`  
**用途**: 車検・12ヵ月点検・故障診断などの診断作業

### 1-2. 作業ページ

**パス**: `/mechanic/work/[id]`  
**ファイル**: `src/app/mechanic/work/[id]/page.tsx`  
**用途**: 整備・完成検査・各種作業の実施

---

## 2. レイアウト構造

### 2-1. ページ全体の構造

```typescript
<div className="min-h-screen bg-slate-50">
  {/* AppHeader */}
  <AppHeader
    maxWidthClassName="max-w-4xl"
    collapsibleOnMobile={true}
    backHref={getBackHref(jobId)}
    hasUnsavedChanges={autoSaveHasUnsavedChanges}
    collapsedCustomerName={job.field4?.name || "未登録"}
    collapsedVehicleName={vehicleName}
    // ... その他のprops
  >
    <CompactJobHeader
      job={job}
      customerName={customerName}
      vehicleName={vehicleName}
      licensePlate={licensePlate}
      tagId={job.tagId}
      serviceKind={job.serviceKind}
      assignedMechanic={job.assignedMechanic}
      // ... その他のprops
    />
  </AppHeader>

  {/* ワークオーダー選択UI（複数作業がある場合のみ） */}
  {workOrders && workOrders.length > 0 && (
    <div className="max-w-4xl mx-auto px-4 mb-6">
      <WorkOrderSelector ... />
    </div>
  )}

  {/* メインコンテンツ */}
  <main className="max-w-4xl mx-auto px-4 py-6 pb-32" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
    {/* コンテンツ */}
  </main>

  {/* 固定フッター（診断ページのみ） */}
  <div className="fixed bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-200 p-4 shadow-lg">
    {/* アクションボタン */}
  </div>
</div>
```

### 2-2. レイアウトの特徴

- **横幅**: `max-w-4xl` (896px) - ワークフロー型UX最適化のため統一
- **背景色**: `bg-slate-50` - ページ全体と固定フッターで統一
- **スクロール**: `window`のスクロールを使用（`app-layout-client.tsx`で`overflow-visible`に設定）
- **パディング**: `px-4 py-6` - 標準的なパディング
- **下部パディング**: `pb-32` - 固定フッターの高さ分を確保

---

## 3. ヘッダー仕様

### 3-1. AppHeader設定

```typescript
<AppHeader
  maxWidthClassName="max-w-4xl"           // ヘッダーの最大幅（メインコンテンツと統一）
  collapsibleOnMobile={true}               // モバイルで折りたたみ可能
  backHref={getBackHref(jobId)}           // 戻るボタンのリンク先
  hasUnsavedChanges={autoSaveHasUnsavedChanges} // 未保存の変更があるか
  hideBrandOnScroll={true}                 // スクロール時にロゴを非表示
  scrollThreshold={30}                    // スクロール検知の閾値（30px）
  collapsedCustomerName={job.field4?.name || "未登録"}  // 縮小版ヘッダーに表示する顧客名
  collapsedVehicleName={vehicleName}      // 縮小版ヘッダーに表示する車両名
>
  <CompactJobHeader ... />
</AppHeader>
```

### 3-2. CompactJobHeader仕様

**情報階層**:

- **第1階層**: 顧客名 + 重要な顧客フラグ + お客様共有フォルダ + ステータスバッジ + 戻るボタン
- **第2階層**: 車両情報、入庫区分、時間（横並び、モバイルでは折り返し）
- **第3階層**: 現在の作業、担当整備士、代車、タグ（該当する場合のみ）

**デザイン要素**:

- **フォントサイズ**: `text-base` (16px) 以上
- **アイコンサイズ**: `h-4 w-4` (16px) 以上
- **カラー**: デザインシステムに準拠（`text-slate-900`, `text-slate-700`など）

### 3-3. スクロール時の動作

- **スクロール時**: ロゴと「デジタルガレージ」を非表示
- **縮小版ヘッダー**: 顧客名・車両名・ステータスバッジを表示
- **戻るボタン**: 常に表示（未保存の変更がある場合は確認ダイアログ）

---

## 4. コンテンツエリア仕様

### 4-1. メインコンテンツ

```typescript
<main className="max-w-4xl mx-auto px-4 py-6 pb-32" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
  {/* コンテンツ */}
</main>
```

**設定値**:

- **最大幅**: `max-w-4xl` (896px) - ヘッダーと統一
- **パディング**: `px-4 py-6` - 標準的なパディング
- **下部パディング**: `pb-32` - 固定フッターの高さ分を確保
- **上部パディング**: `paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)'` - ヘッダーの高さ分を確保

### 4-2. 固定フッター（診断ページのみ）

```typescript
<div className="fixed bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-200 p-4 shadow-lg">
  <div className="max-w-4xl mx-auto flex gap-4">
    {/* アクションボタン */}
  </div>
</div>
```

**設定値**:

- **背景色**: `bg-slate-50` - ページ全体と統一
- **最大幅**: `max-w-4xl` - メインコンテンツと統一
- **ボーダー**: `border-t border-slate-200` - 上部にボーダー
- **シャドウ**: `shadow-lg` - 浮き上がり感を演出

---

## 5. デザインシステム準拠

### 5-1. フォントサイズ

| 要素 | サイズ | Tailwindクラス | 実装例 |
|------|--------|----------------|--------|
| **ページタイトル** | 20px | `text-xl` | 作業名、診断名 |
| **セクションタイトル** | 18px | `text-lg` | カードタイトル |
| **本文** | 16px | `text-base` | 一般的なテキスト |
| **補助情報** | 16px | `text-base` | ラベル、メタ情報 |

### 5-2. ボタンサイズ

| 要素 | サイズ | Tailwindクラス | 実装例 |
|------|--------|----------------|--------|
| **主要アクション** | 48px | `h-12` | 診断完了、作業完了 |
| **補助アクション** | 48px | `h-12` | 保存、キャンセル |

### 5-3. アイコンサイズ

| 要素 | サイズ | Tailwindクラス | 実装例 |
|------|--------|----------------|--------|
| **ヘッダーアイコン** | 16px | `h-4 w-4` | CompactJobHeader内のアイコン |
| **ボタン内アイコン** | 20px | `h-5 w-5` | アクションボタン内のアイコン |
| **セクションアイコン** | 20px | `h-5 w-5` | カードタイトルのアイコン |

### 5-4. カラーシステム

| 用途 | カラー | Tailwindクラス | 実装例 |
|------|--------|----------------|--------|
| **背景** | Slate 50 | `bg-slate-50` | ページ全体、固定フッター |
| **カード背景** | White | `bg-white` | カードコンポーネント |
| **ボーダー** | Slate 300 | `border-slate-300` | カード、入力フィールド |
| **テキスト（最重要）** | Slate 900 | `text-slate-900` | 顧客名、車両名 |
| **テキスト（重要）** | Slate 700 | `text-slate-700` | 補助情報 |

---

## 6. 実装例

### 6-1. 診断ページの実装例

```typescript
export default function DiagnosisPage() {
  // ... 状態管理

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        maxWidthClassName="max-w-4xl"
        collapsibleOnMobile={true}
        backHref={getBackHref(jobId)}
        hasUnsavedChanges={autoSaveHasUnsavedChanges}
        collapsedCustomerName={job.field4?.name || "未登録"}
        collapsedVehicleName={vehicleName}
      >
        <CompactJobHeader
          job={job}
          customerName={customerName}
          vehicleName={vehicleName}
          licensePlate={licensePlate}
          tagId={job.tagId}
          serviceKind={job.serviceKind}
          assignedMechanic={job.assignedMechanic}
          courtesyCars={courtesyCars}
        />
      </AppHeader>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-32" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
        {/* 診断コンテンツ */}
      </main>

      {/* 固定フッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-50 border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Button onClick={handleSave} className="h-12 flex-1">
            保存
          </Button>
          <Button onClick={handleComplete} className="h-12 flex-1">
            診断完了
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 6-2. 作業ページの実装例

```typescript
export default function WorkPage() {
  // ... 状態管理

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        maxWidthClassName="max-w-4xl"
        collapsibleOnMobile={true}
        backHref={getBackHref(jobId)}
        hasUnsavedChanges={hasUnsavedChanges}
        collapsedCustomerName={job.field4?.name || "未登録"}
        collapsedVehicleName={vehicleName}
      >
        <CompactJobHeader
          job={job}
          customerName={customerName}
          vehicleName={vehicleName}
          licensePlate={licensePlate}
          tagId={job.tagId}
          serviceKind={job.serviceKind}
          currentWorkOrderName={workTitle}
          assignedMechanic={job.assignedMechanic}
          courtesyCars={courtesyCars}
        />
      </AppHeader>

      {/* ワークオーダー選択UI（複数作業がある場合のみ） */}
      {workOrders && workOrders.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <WorkOrderSelector
            workOrders={workOrders}
            selectedWorkOrderId={selectedWorkOrder?.id || null}
            onSelect={handleWorkOrderSelect}
            onAddWorkOrder={() => setIsAddWorkOrderDialogOpen(true)}
          />
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
        {/* 作業コンテンツ */}
      </main>
    </div>
  );
}
```

---

## 7. 重要な設計原則

### 7-1. 横幅の統一

- **すべての整備士専用ページ**: `max-w-4xl` (896px) を使用
- **ヘッダーとメインコンテンツ**: 必ず同じ横幅を指定
- **理由**: ワークフロー型UX最適化のため、一貫性を優先

### 7-2. スクロール動作

- **スクロール方式**: `window`のスクロールを使用
- **理由**: 固定フッターとの整合性、パフォーマンス向上
- **実装**: `app-layout-client.tsx`で`overflow-visible`に設定

### 7-3. ヘッダーの高さ

- **初期表示**: 約176px（`CompactJobHeader`の高さ + `AppHeader`のパディング）
- **スクロール時**: 約80px（縮小版ヘッダーの高さ）
- **実装**: `paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)'`で動的に対応

### 7-4. 固定フッター（診断ページのみ）

- **背景色**: `bg-slate-50` - ページ全体と統一
- **最大幅**: `max-w-4xl` - メインコンテンツと統一
- **下部パディング**: `pb-32` - 固定フッターの高さ分を確保

---

## 8. レスポンシブ対応

### 8-1. モバイル（< 640px）

- **ヘッダー**: 折りたたみ可能（`collapsibleOnMobile={true}`）
- **情報階層**: 第2階層・第3階層が折り返し表示
- **固定フッター**: ボタンを縦並びに変更（必要に応じて）

### 8-2. タブレット（640px - 1024px）

- **横幅**: `max-w-4xl`を維持
- **レイアウト**: デスクトップと同様

### 8-3. デスクトップ（> 1024px）

- **横幅**: `max-w-4xl`を維持（ワークフロー型UX最適化）
- **中央揃え**: `mx-auto`で中央配置

---

## 9. アクセシビリティ

### 9-1. キーボード操作

- **戻るボタン**: `Tab`キーでフォーカス可能
- **アクションボタン**: `Tab`キーで順次フォーカス
- **フォーカス表示**: `focus-visible:ring-2 focus-visible:ring-slate-900`

### 9-2. スクリーンリーダー対応

- **セマンティックHTML**: `main`, `header`, `nav`要素を使用
- **ARIA属性**: `aria-label`, `aria-current`を適切に設定
- **見出し階層**: `h1`, `h2`, `h3`を適切に使用

---

## 10. 実装チェックリスト

### 10-1. レイアウト

- [ ] `max-w-4xl`を使用（ヘッダーとメインコンテンツで統一）
- [ ] `bg-slate-50`をページ全体に適用
- [ ] `paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)'`を設定
- [ ] 固定フッターがある場合は`pb-32`を設定

### 10-2. ヘッダー

- [ ] `AppHeader`に`maxWidthClassName="max-w-4xl"`を設定
- [ ] `CompactJobHeader`を`AppHeader`の`children`に配置
- [ ] `collapsibleOnMobile={true}`を設定
- [ ] `backHref`を適切に設定
- [ ] `hasUnsavedChanges`を適切に設定

### 10-3. デザインシステム

- [ ] フォントサイズ: `text-base` (16px) 以上を使用
- [ ] ボタンサイズ: `h-12` (48px) を使用
- [ ] アイコンサイズ: `h-4 w-4` (16px) 以上を使用
- [ ] カラー: デザインシステムに準拠

---

## 11. 整備士専用ページの特別要件

### 11-1. 大きなボタン（作業用手袋着用時も操作可能）

**設計方針**: 作業用手袋を着用した状態でも確実に操作できるよう、最小タッチターゲットサイズを確保

**要件**:
- **最小ボタン高さ**: `h-12` (48px) - 標準ボタン
- **重要アクションボタン**: `h-14` (56px) または `h-16` (64px) - 診断完了、作業完了など
- **ボタン間隔**: `gap-3` (12px) 以上 - 誤操作を防ぐ
- **タッチターゲット**: 最小48px × 48px（WCAG 2.1 AA準拠）

**実装例**:
```typescript
// 標準ボタン（h-12）
<Button className="h-12 text-base">
  保存
</Button>

// 重要アクションボタン（h-14）
<Button size="lg" className="h-14 text-lg">
  診断完了
</Button>

// ボトムシート内のボタン（h-16）
<Button className="h-16 text-xl font-semibold">
  良好（レ）
</Button>
```

### 11-2. 音声入力対応

**設計方針**: 手が汚れている状態や、文字入力が困難な状況でも操作できるよう、音声入力を提供

**要件**:
- **音声入力ボタン**: `VoiceInputButton`コンポーネントを使用
- **ボタンサイズ**: `h-12` (48px) 以上
- **配置**: テキスト入力フィールドの近くに配置
- **フィードバック**: 音声入力開始・終了時にハプティックフィードバック

**実装例**:
```typescript
<div className="flex items-center gap-2">
  <Textarea
    value={memo}
    onChange={(e) => setMemo(e.target.value)}
    className="h-12 text-base"
  />
  <VoiceInputButton
    onTranscribe={(text) => setMemo(text)}
    disabled={isSubmitting}
  />
</div>
```

### 11-3. シンプルなナビゲーション

**設計方針**: 作業に集中できるよう、ナビゲーションを最小限に

**要件**:
- **ヘッダー**: `CompactJobHeader`で必要最小限の情報を表示
- **戻るボタン**: 常に表示（未保存の変更がある場合は確認ダイアログ）
- **ワークフローインジケーター**: 現在のフェーズを表示（`WorkflowStepIndicator`）
- **固定フッター**: 重要アクションのみ表示（診断完了、作業完了など）

**実装例**:
```typescript
<AppHeader
  maxWidthClassName="max-w-4xl"
  backHref={getBackHref(jobId)}
  hasUnsavedChanges={hasUnsavedChanges}
>
  <CompactJobHeader
    job={job}
    customerName={customerName}
    vehicleName={vehicleName}
    // ...
  />
</AppHeader>
```

### 11-4. ダークモード（工場内の照明環境に配慮）

**設計方針**: 工場内の照明環境（明るい場所・暗い場所）に対応できるよう、ダークモードを提供

**要件**:
- **テーマ切り替え**: ヘッダーの`ThemeToggleButton`で切り替え可能
- **コントラスト比**: WCAG 2.1 AA準拠（4.5:1以上）
- **カラーシステム**: ダークモード対応のカラーパレットを使用
- **背景色**: `dark:bg-slate-900`、`dark:bg-slate-800`
- **テキスト色**: `dark:text-white`、`dark:text-slate-300`
- **ボーダー色**: `dark:border-slate-700`

**実装例**:
```typescript
// カード
<Card className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
  <CardContent className="text-slate-900 dark:text-white">
    {/* コンテンツ */}
  </CardContent>
</Card>

// ボタン
<Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
  診断を開始
</Button>
```

---

## 12. 更新履歴

- **2025-01-XX**: 初版作成
- **2025-01-XX**: 整備士専用ページの特別要件（大きなボタン、音声入力、シンプルなナビゲーション、ダークモード）を追加

---

## 12. 関連ドキュメント

- [デザインシステム - 統合版](./DESIGN_SYSTEM.md)
- [ワークフロー型UX横幅提案](./WORKFLOW_UX_WIDTH_PROPOSAL.md)
- [コンパクト案件ヘッダーデザイン](./archive/COMPACT_JOB_HEADER_DESIGN.md)

