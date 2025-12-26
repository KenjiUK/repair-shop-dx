# ステータス色の統一ルール

## 📋 概要

ステータス（入庫待ち、作業待ちなど）の色は、**セマンティックカラーシステム**に基づいて統一されています。
これは、入庫区分のカテゴリー色システムとは**別の色体系**です。

---

## 🎨 セマンティックカラーシステム

### 色の分類ルール

ステータスは、作業の進行状況と緊急度に応じて以下の色に分類されています：

| 色 | 意味 | 該当するステータス |
|-----|------|----------------|
| **Blue (青)** | 進行中・待機中 | 入庫待ち、入庫済み |
| **Orange (オレンジ)** | 注意が必要・作業待ち | 診断待ち、作業待ち、部品発注待ち |
| **Amber (アンバー)** | 承認待ち・保留（外部依存） | お客様承認待ち、部品調達待ち |
| **Indigo (インディゴ)** | 情報・管理業務 | 見積作成待ち |
| **Green (緑)** | 完了・成功 | 引渡待ち |
| **Slate (グレー)** | 完了・非アクティブ | 出庫済み |
| **Red (赤)** | 緊急・待機中（⚠️ 要確認） | 入庫待ち、見積作成待ち、作業待ち（一部の実装で使用） |

### ステータス別の色定義

```typescript
// 推奨: セマンティックカラーシステム（today-summary-card.tsx）
const statusConfig = {
  入庫待ち: {
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
  },
  診断待ち（入庫済み）: {
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
  },
  見積作成待ち: {
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200", // ⚠️ border-indigo-300に統一すべき
  },
  お客様承認待ち（見積提示済み）: {
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
  },
  作業待ち: {
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
  },
  引渡待ち（出庫待ち）: {
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
  },
  部品調達待ち: {
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
  },
  部品発注待ち: {
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
  },
  出庫済み: {
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
  },
};
```

---

## ⚠️ 現在の問題点

### 不整合1: 複数の色定義が存在

**`today-summary-card.tsx`（推奨）:**
- 入庫待ち: Blue
- 診断待ち: Orange
- 見積作成待ち: Indigo
- お客様承認待ち: Amber
- 作業待ち: Orange
- 引渡待ち: Green

**`job-card.tsx`（不整合）:**
- 入庫待ち: **Red** ❌
- 見積作成待ち: **Red** ❌
- 作業待ち: **Red** ❌
- 入庫済み: Blue ✅
- 見積提示済み: Amber ✅
- 出庫済み: Slate ✅

### 不整合2: フィルター部分の色

**`page.tsx`（フィルター）:**
- 入庫待ち: Blue ✅
- 診断待ち: Orange ✅
- 見積作成待ち: Indigo ✅
- お客様承認待ち: Amber ✅
- 作業待ち: Orange ✅
- 引渡待ち: Green ✅
- 部品調達待ち: Amber ✅
- 部品発注待ち: Orange ✅

---

## ✅ 推奨される統一ルール

### ステータス色の統一定義

```typescript
// 統一されたステータス色定義
const statusColorConfig = {
  // Blue: 進行中・待機中
  "入庫待ち": {
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    icon: Clock,
  },
  "入庫済み": {
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    icon: Activity,
  },
  
  // Orange: 注意が必要・作業待ち
  "診断待ち": {
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    icon: Activity,
  },
  "作業待ち": {
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    icon: Wrench,
  },
  "部品発注待ち": {
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    icon: ShoppingCart,
  },
  
  // Indigo: 情報・管理業務
  "見積作成待ち": {
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300", // border-indigo-200 → border-indigo-300に統一
    icon: FileText,
  },
  
  // Amber: 承認待ち・保留（外部依存）
  "見積提示済み": {
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    icon: UserCheck,
  },
  "部品調達待ち": {
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    icon: Package,
  },
  
  // Green: 完了・成功
  "出庫待ち": {
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    icon: Car,
  },
  
  // Slate: 完了・非アクティブ
  "出庫済み": {
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    icon: CheckCircle2,
  },
};
```

### 色の意味

1. **Blue (青)**: 進行中・待機中
   - 入庫待ち、入庫済み（診断待ち）
   - 作業が開始される前の状態

2. **Orange (オレンジ)**: 注意が必要・作業待ち
   - 診断待ち、作業待ち、部品発注待ち
   - 作業が必要な状態

3. **Amber (アンバー)**: 承認待ち・保留（外部依存）
   - 見積提示済み（お客様承認待ち）、部品調達待ち
   - 外部の承認や到着を待っている状態

4. **Indigo (インディゴ)**: 情報・管理業務
   - 見積作成待ち
   - 管理業務が必要な状態

5. **Green (緑)**: 完了・成功
   - 出庫待ち（引渡待ち）
   - 作業が完了し、引渡し待ちの状態

6. **Slate (グレー)**: 完了・非アクティブ
   - 出庫済み
   - すべての作業が完了した状態

---

## 🔧 修正が必要な箇所

### 1. `job-card.tsx` の `getStatusBadgeStyle` 関数

**現在:**
```typescript
case "入庫待ち":
case "見積作成待ち":
case "作業待ち":
  return "bg-red-50 text-red-700 border-red-300"; // ❌ Red
```

**修正後:**
```typescript
case "入庫待ち":
  return "bg-blue-50 text-blue-700 border-blue-300"; // ✅ Blue
case "見積作成待ち":
  return "bg-indigo-50 text-indigo-600 border-indigo-300"; // ✅ Indigo
case "作業待ち":
  return "bg-orange-50 text-orange-700 border-orange-300"; // ✅ Orange
```

### 2. 他のコンポーネント

以下のファイルでも同様の修正が必要：
- `src/app/mechanic/work/[id]/page.tsx`
- `src/app/admin/estimate/[id]/page.tsx`
- `src/app/mechanic/diagnosis/[id]/page.tsx`
- `src/components/features/historical-job-dialog.tsx`
- `src/components/layout/compact-job-header.tsx`

### 3. `today-summary-card.tsx` の border-indigo-200

**現在:**
```typescript
borderColor: "border-indigo-200", // ❌ 視認性が低い
```

**修正後:**
```typescript
borderColor: "border-indigo-300", // ✅ 視認性向上
```

---

## 📝 実装例

### 統一されたステータスバッジスタイル関数

```typescript
function getStatusBadgeStyle(status: string): string {
  const statusColorConfig: Record<string, string> = {
    "入庫待ち": "bg-blue-50 text-blue-700 border-blue-300",
    "入庫済み": "bg-blue-50 text-blue-700 border-blue-300",
    "見積作成待ち": "bg-indigo-50 text-indigo-600 border-indigo-300",
    "見積提示済み": "bg-amber-50 text-amber-700 border-amber-300",
    "作業待ち": "bg-orange-50 text-orange-700 border-orange-300",
    "出庫待ち": "bg-green-50 text-green-700 border-green-300",
    "出庫済み": "bg-slate-50 text-slate-700 border-slate-300",
    "部品調達待ち": "bg-amber-50 text-amber-700 border-amber-300",
    "部品発注待ち": "bg-orange-50 text-orange-700 border-orange-300",
  };
  
  return statusColorConfig[status] || "bg-slate-100 text-slate-700 border-slate-300";
}
```

---

## 🎯 優先度

- **優先度: 高** - 一貫性の確保とユーザビリティ向上のため
- **影響範囲**: 約10箇所のファイル
- **実装期間**: 1-2時間

---

## 📚 参考

- `src/components/features/today-summary-card.tsx` - 推奨実装
- `src/components/features/job-card.tsx` - 修正が必要
- `src/app/page.tsx` - フィルター部分（既に統一されている）



