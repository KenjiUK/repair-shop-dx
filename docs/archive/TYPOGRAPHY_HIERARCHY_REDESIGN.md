# タイポグラフィ階層の再設計

## 情報の重要度分析

### 階層1: 最重要情報
- **顧客名**: ユーザーが最初に確認する情報
- **ステータス**: 現在の作業状態を示す最重要情報

### 階層2: 主要情報
- **車両情報**: 作業対象の車両を特定する重要な情報
- **入庫区分**: 作業の種類を示す主要情報

### 階層3: 補助情報
- **時間**: 入庫予定/入庫日時
- **タグ**: スマートタグID
- **代車**: 補助的な情報
- **担当整備士**: 補助的な情報

## 推奨タイポグラフィ階層

### 文字サイズの推奨

| 要素 | 推奨サイズ | フォントウェイト | 文字色 | 理由 |
|------|-----------|----------------|--------|------|
| 顧客名 | `text-lg` (18px) | `font-semibold` | `text-slate-900` | 最重要情報として大きく、太字 |
| ステータスバッジ | `text-xs` (12px) | `font-medium` | `text-slate-700` | バッジ内なので小さめ、控えめに |
| 車両情報 | `text-base` (16px) | `font-medium` | `text-slate-900` | 主要情報として適切なサイズ |
| 入庫区分バッジ | `text-xs` (12px) | `font-medium` | `text-slate-700` | バッジ内なので小さめ |
| 時間・タグ | `text-sm` (14px) | `font-normal` | `text-slate-700` | 補助情報として適切 |
| 代車・整備士 | `text-sm` (14px) | `font-normal` | `text-slate-600` | 補助情報として控えめに |

### 視覚的階層の原則

1. **大きさで階層を表現**
   - 最重要: `text-lg`
   - 主要: `text-base`
   - 補助: `text-sm` / `text-xs`

2. **太さで階層を表現**
   - 最重要: `font-semibold`
   - 主要: `font-medium`
   - 補助: `font-normal`

3. **色の濃淡で階層を表現**
   - 最重要: `text-slate-900`
   - 主要: `text-slate-700`
   - 補助: `text-slate-600` / `text-slate-500`

## 実装例

```tsx
{/* 顧客名とステータス - 階層1 */}
<CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
  <User className="h-5 w-5 text-slate-500 shrink-0" />
  <span className="truncate">{customerName}</span>
  <Badge 
    variant="outline" 
    className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-0.5 rounded-full"
  >
    {job.field5}
  </Badge>
</CardTitle>

{/* 車両情報 - 階層2 */}
<div className="flex items-center gap-2 mt-2 text-base font-medium text-slate-900">
  <Car className="h-4 w-4 text-slate-500 shrink-0" />
  <span className="truncate">{vehicleInfo}</span>
</div>

{/* 入庫区分、時間、タグ - 階層2/3 */}
<div className="flex items-center gap-3 mt-2 flex-wrap">
  {/* 入庫区分 - 階層2 */}
  <Badge 
    variant="outline" 
    className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full"
  >
    {getServiceKindIcon()}
    {job.serviceKind}
  </Badge>

  {/* 時間 - 階層3 */}
  <div className="flex items-center gap-1.5 text-sm text-slate-700">
    <Clock className="h-4 w-4 text-slate-500 shrink-0" />
    <span>{arrivalTime} {arrivalLabel === "入庫予定" ? "入庫予定" : "入庫"}</span>
  </div>

  {/* タグ - 階層3 */}
  {job.tagId && (
    <div className="flex items-center gap-1.5 text-sm text-slate-700">
      <Tag className="h-4 w-4 text-slate-500 shrink-0" />
      <span>タグ {job.tagId}</span>
    </div>
  )}
</div>

{/* 代車・整備士 - 階層3 */}
<div className="flex flex-wrap items-center gap-2 mt-2">
  {courtesyCar && (
    <div className="flex items-center gap-1.5 text-sm text-slate-600">
      <Car className="h-3.5 w-3.5 shrink-0" />
      <span>代車 {courtesyCar.name}</span>
    </div>
  )}
  {job.assignedMechanic && (
    <div className="flex items-center gap-1.5 text-sm text-slate-600">
      <Wrench className="h-3.5 w-3.5 shrink-0" />
      <span>{job.assignedMechanic}</span>
    </div>
  )}
</div>
```


























