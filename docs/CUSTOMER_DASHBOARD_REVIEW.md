# 顧客ダッシュボード実装レビュー

**レビュー日:** 2025年1月  
**対象:** `src/app/customer/dashboard/page.tsx`  
**基準:** `docs/PAGE_SPECIFICATION.md` (Section 12: 顧客ダッシュボード)

---

## 0. スコープに関する注意事項

### 0-1. 元のスコープでの位置づけ

**重要:** 顧客ダッシュボードは、元々のスコープでは**将来実装予定**の機能でした。

**参照:**
- `docs/ROADMAP_IMPLEMENTATION_STATUS.md` - Phase 5: 高度な機能の実装
  - **実装状況:** ⚠️ **未実装**
  - **顧客ポータル機能:**
    - 顧客向けダッシュボード
    - 作業進捗の確認機能
    - 見積もりの確認・承認機能
    - 請求書の確認・ダウンロード機能

### 0-2. 現在の実装状況

**実装済み:**
- `src/app/customer/dashboard/page.tsx` が存在し、基本的な機能が実装されている
- `docs/PAGE_SPECIFICATION.md` に Section 12 として記載されている

**推測:**
- 実装が先に進んでしまった可能性
- または、PAGE_SPECIFICATION.mdに追加されたが、ROADMAP_IMPLEMENTATION_STATUS.mdが更新されていない可能性

### 0-3. レビューの目的

本レビューは、**既に実装されている**顧客ダッシュボードについて、PAGE_SPECIFICATION.mdの仕様との整合性を確認することを目的としています。

**注意:** 元のスコープでは将来実装予定だったため、実装の優先度や完成度については、プロジェクトの方針に従って判断する必要があります。

---

## 1. 実装状況の概要

### 1-1. 実装済み機能

✅ **マジックリンク認証**: URLパラメータまたはマジックリンクトークンから顧客IDを取得  
✅ **サマリーカード**: 進行中、見積待ち、完了の3つのカードを表示  
✅ **タブ表示**: すべて、見積待ち、作業中、出庫待ち、完了の5つのタブ  
✅ **案件一覧**: `CustomerJobCard`コンポーネントで案件を表示  
✅ **進捗バー**: 各案件の進捗率を表示  
✅ **アクションボタン**: 見積確認、作業完了報告確認、詳細確認のボタン  
✅ **ローディング状態**: Skeletonコンポーネントでローディング表示  
✅ **エラーハンドリング**: エラー状態の表示

---

## 2. 仕様との差異

### 2-1. サマリーカードのステータス判定

**仕様（PAGE_SPECIFICATION.md）:**
- 進行中案件数: `field5` = `作業待ち`
- 見積待ち案件数: `field5` = `見積作成待ち`
- 完了案件数: `field5` = `出庫済み`

**現在の実装:**
- 進行中: `statusCounts["作業中"]` - **仕様と異なる**
- 見積待ち: `statusCounts["見積提示済み"]` - **仕様と異なる**
- 完了: `statusCounts["出庫済み"]` - **仕様通り**

**問題点:**
1. 進行中案件数の判定が`作業待ち`ではなく`作業中`を参照している
2. 見積待ち案件数の判定が`見積作成待ち`ではなく`見積提示済み`を参照している

**推奨修正:**
```typescript
// 進行中: 作業待ち、作業中、出庫待ちを含める
const inProgressCount = jobs?.filter(job => 
  job.field5 === "作業待ち" || 
  job.field5 === "作業中" || 
  job.field5 === "出庫待ち"
).length || 0;

// 見積待ち: 見積作成待ち、見積提示済みを含める
const estimatePendingCount = jobs?.filter(job => 
  job.field5 === "見積作成待ち" || 
  job.field5 === "見積提示済み"
).length || 0;
```

---

### 2-2. タブ表示の構成

**仕様（PAGE_SPECIFICATION.md）:**
- すべて
- 進行中
- 見積待ち
- 完了

**現在の実装:**
- すべて
- 見積待ち（`見積提示済み`）
- 作業中
- 出庫待ち（**仕様にない**）
- 完了（`出庫済み`）

**問題点:**
1. 仕様には「出庫待ち」タブがない
2. 「進行中」タブが「作業中」になっている
3. タブの値と`field5`の直接比較が不適切（複数のステータスをまとめる必要がある）

**推奨修正:**
```typescript
// タブの値とステータスのマッピング
const tabStatusMap: Record<string, string[]> = {
  "すべて": [],
  "進行中": ["作業待ち", "作業中", "出庫待ち"],
  "見積待ち": ["見積作成待ち", "見積提示済み"],
  "完了": ["出庫済み"],
};

// フィルタリングロジック
const filteredJobs = useMemo(() => {
  if (!jobs) return [];
  if (selectedTab === "すべて") return jobs;
  const targetStatuses = tabStatusMap[selectedTab] || [];
  return jobs.filter((job) => targetStatuses.includes(job.field5 || ""));
}, [jobs, selectedTab]);
```

---

### 2-3. フィルタリングロジック

**現在の実装:**
```typescript
const filteredJobs = useMemo(() => {
  if (!jobs) return [];
  if (selectedTab === "すべて") return jobs;
  return jobs.filter((job) => job.field5 === selectedTab);
}, [jobs, selectedTab]);
```

**問題点:**
- タブの値（例: "見積待ち"）と`field5`（例: "見積提示済み"）を直接比較しているため、フィルタリングが機能しない

**推奨修正:**
上記の`tabStatusMap`を使用したフィルタリングロジックに修正

---

### 2-4. 顧客名の表示

**現在の実装:**
```typescript
`${customer?.data?.Last_Name || "顧客"}様のダッシュボード`
```

**問題点:**
- `Last_Name`のみを使用しているが、`First_Name`も含めた完全な顧客名を表示すべき

**推奨修正:**
```typescript
const customerName = customer?.data 
  ? `${customer.data.First_Name || ""} ${customer.data.Last_Name || ""}`.trim() || "顧客"
  : "顧客";

`${customerName}様のダッシュボード`
```

---

### 2-5. 入庫日の表示

**仕様（PAGE_SPECIFICATION.md）:**
- 入庫日（`field22`）を表示

**現在の実装:**
```typescript
{job.field22 && (
  <div className="flex items-center gap-2 text-base text-slate-700">
    <Calendar className="h-4 w-4 shrink-0" />
    <span>
      {new Date(job.field22).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </span>
  </div>
)}
```

**問題点:**
- 条件付きレンダリング（`job.field22 &&`）により、入庫日がない場合は表示されない
- 仕様では必須表示とされている可能性がある

**推奨修正:**
- 入庫日がない場合は「入庫日未設定」などの代替テキストを表示

---

## 3. デザインシステム準拠状況

### 3-1. フォントサイズ

✅ **良好**: `text-base` (16px) 以上を使用  
✅ **良好**: `text-2xl` (24px) をタイトルに使用  
✅ **良好**: `text-lg` (18px) をカードタイトルに使用

### 3-2. ボタンサイズ

✅ **良好**: `h-12` (48px) を使用

### 3-3. アイコンサイズ

✅ **良好**: `h-4 w-4` (16px) 以上を使用  
✅ **良好**: `h-5 w-5` (20px) をサマリーカードのアイコンに使用

### 3-4. カラーシステム

✅ **良好**: 適切なコントラスト比を確保

### 3-5. スペーシング

✅ **良好**: 適切なスペーシングを使用

---

## 4. 改善提案

### 4-1. 優先度: 高

#### 4-1-1. サマリーカードのステータス判定を修正

**現状:**
- 進行中: `作業中`を参照（仕様では`作業待ち`）
- 見積待ち: `見積提示済み`を参照（仕様では`見積作成待ち`）

**修正内容:**
```typescript
// サマリーカードの件数計算
const summaryCounts = useMemo(() => {
  if (!jobs) return { inProgress: 0, estimatePending: 0, completed: 0 };
  
  return {
    // 進行中: 作業待ち、作業中、出庫待ちを含める
    inProgress: jobs.filter(job => 
      job.field5 === "作業待ち" || 
      job.field5 === "作業中" || 
      job.field5 === "出庫待ち"
    ).length,
    
    // 見積待ち: 見積作成待ち、見積提示済みを含める
    estimatePending: jobs.filter(job => 
      job.field5 === "見積作成待ち" || 
      job.field5 === "見積提示済み"
    ).length,
    
    // 完了: 出庫済み
    completed: jobs.filter(job => job.field5 === "出庫済み").length,
  };
}, [jobs]);
```

#### 4-1-2. タブ表示の構成を仕様に合わせる

**修正内容:**
- 「出庫待ち」タブを削除
- 「作業中」タブを「進行中」に変更
- タブの値とステータスのマッピングを実装

#### 4-1-3. フィルタリングロジックを修正

**修正内容:**
- `tabStatusMap`を使用したフィルタリングロジックに変更

---

### 4-2. 優先度: 中

#### 4-2-1. 顧客名の表示を完全な名前に変更

**修正内容:**
```typescript
const customerName = customer?.data 
  ? `${customer.data.First_Name || ""} ${customer.data.Last_Name || ""}`.trim() || "顧客"
  : "顧客";
```

#### 4-2-2. 入庫日の表示を必須にする

**修正内容:**
```typescript
<div className="flex items-center gap-2 text-base text-slate-700">
  <Calendar className="h-4 w-4 shrink-0" />
  <span>
    {job.field22 
      ? new Date(job.field22).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "入庫日未設定"}
  </span>
</div>
```

---

### 4-3. 優先度: 低

#### 4-3-1. 進捗バーの改善

**現状:**
- 進捗率は表示されているが、ステータスに応じた色分けがない

**改善提案:**
```typescript
// 進捗バーの色をステータスに応じて変更
const getProgressColor = (progress: number): string => {
  if (progress === 100) return "bg-green-600";
  if (progress >= 50) return "bg-blue-600";
  if (progress >= 20) return "bg-amber-600";
  return "bg-slate-400";
};
```

#### 4-3-2. 空状態の改善

**現状:**
- 空状態のメッセージがシンプル

**改善提案:**
- より親切なメッセージとアクションを追加
- 例: 「新しい作業を依頼する」ボタン（今後実装予定の機能へのリンク）

---

## 5. 実装チェックリスト

### 5-1. 必須修正項目

- [ ] サマリーカードのステータス判定を仕様に合わせる
- [ ] タブ表示の構成を仕様に合わせる（「出庫待ち」タブを削除、「作業中」を「進行中」に変更）
- [ ] フィルタリングロジックを修正（`tabStatusMap`を使用）

### 5-2. 推奨修正項目

- [ ] 顧客名の表示を完全な名前に変更
- [ ] 入庫日の表示を必須にする（未設定時の代替テキストを表示）

### 5-3. 改善項目

- [ ] 進捗バーの色分けを実装
- [ ] 空状態のメッセージを改善

---

## 6. まとめ

### 6-1. 実装状況

**良好な点:**
- マジックリンク認証が正しく実装されている
- デザインシステムに準拠している
- ローディング状態とエラーハンドリングが適切

**改善が必要な点:**
- サマリーカードのステータス判定が仕様と異なる
- タブ表示の構成が仕様と異なる
- フィルタリングロジックが正しく機能していない

### 6-2. 優先度

1. **高**: サマリーカードとタブ表示の仕様準拠（必須）
2. **中**: 顧客名と入庫日の表示改善（推奨）
3. **低**: 進捗バーの色分けと空状態の改善（任意）

---

## 7. 参考資料

- [PAGE_SPECIFICATION.md](./PAGE_SPECIFICATION.md) - Section 12: 顧客ダッシュボード
- [ROADMAP_IMPLEMENTATION_STATUS.md](./ROADMAP_IMPLEMENTATION_STATUS.md) - Phase 5: 高度な機能の実装（顧客ポータル機能）
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - デザインシステム仕様

---

## 8. スコープに関する推奨事項

### 8-1. ドキュメントの整合性確認

**推奨アクション:**
1. `ROADMAP_IMPLEMENTATION_STATUS.md`を更新して、顧客ダッシュボードの実装状況を反映
2. または、実装が先に進んでしまった場合は、プロジェクトの方針を確認

### 8-2. 実装の優先度

**考慮事項:**
- 元のスコープでは将来実装予定だったため、完成度や優先度について再検討が必要な可能性がある
- ただし、既に実装されているため、仕様との整合性を確認し、必要に応じて修正することを推奨

---

**End of Document**

