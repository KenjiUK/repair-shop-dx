# 本日入出庫予定カードの色設定ルール

## 📋 概要

「本日入出庫予定」カードにおける、アイコンとラベルの色設定を定義します。

---

## 🎨 色設定一覧

### 1. 入庫アイコン（ArrowDownCircle）

| 状態 | アイコン色 | 説明 |
|------|-----------|------|
| **通常時** | `text-blue-900` | 予定通りに入庫予定 |
| **遅延時** | `text-red-900` | 予定時刻を過ぎている（警告） |

**実装:**
```tsx
<ArrowDownCircle className={cn("h-5 w-5", isDelayed ? "text-red-900" : "text-blue-900")} />
```

---

### 2. 出庫アイコン（ArrowUpCircle）

| 状態 | アイコン色 | 説明 |
|------|-----------|------|
| **通常時** | `text-green-900` | 予定通りに出庫予定 |
| **遅延時** | `text-amber-900` | 予定時刻を過ぎている（警告） |

**実装:**
```tsx
<ArrowUpCircle className={cn("h-5 w-5", isDelayed ? "text-amber-900" : "text-green-900")} />
```

---

### 3. 入庫ラベル（Badge）

| 状態 | 背景色 | テキスト色 | ボーダー色 | 説明 |
|------|--------|-----------|-----------|------|
| **通常時** | `bg-blue-100` | `text-blue-900` | `border-blue-300` | 予定通りに入庫予定 |
| **遅延時** | `bg-red-100` | `text-red-900` | `border-red-300` | 予定時刻を過ぎている（警告） |

**実装:**
```tsx
<Badge 
  variant="outline" 
  className={cn(
    "text-base font-medium px-2 py-0.5",
    isDelayed
      ? "bg-red-100 text-red-900 border-red-300"
      : "bg-blue-100 text-blue-900 border-blue-300"
  )}
>
  入庫
</Badge>
```

---

### 4. 出庫ラベル（Badge）

| 状態 | 背景色 | テキスト色 | ボーダー色 | 説明 |
|------|--------|-----------|-----------|------|
| **通常時** | `bg-green-100` | `text-green-900` | `border-green-300` | 予定通りに出庫予定 |
| **遅延時** | `bg-amber-100` | `text-amber-900` | `border-amber-300` | 予定時刻を過ぎている（警告） |

**実装:**
```tsx
<Badge 
  variant="outline" 
  className={cn(
    "text-base font-medium px-2 py-0.5",
    isDelayed
      ? "bg-amber-100 text-amber-900 border-amber-300"
      : "bg-green-100 text-green-900 border-green-300"
  )}
>
  出庫
</Badge>
```

---

## 🎯 色の意味

### セマンティックカラーシステム

- **Blue（青）**: 入庫予定（通常時）
  - 進行中・待機中の状態を表現
  - 入庫は「始まり」を意味するため、Blueを使用

- **Green（緑）**: 出庫予定（通常時）
  - 完了・成功を表現
  - 出庫は「完了」を意味するため、Greenを使用

- **Red（赤）**: 入庫遅延（警告）
  - エラー・緊急を表現
  - 入庫遅延は緊急度が高いため、Redを使用

- **Amber（琥珀色）**: 出庫遅延（警告）
  - 注意・警告を表現
  - 出庫遅延は注意喚起が必要だが、入庫遅延ほど緊急ではないため、Amberを使用

---

## 📝 変更履歴

### 2026-01-XX: アイコン背景の削除

- **変更前**: アイコンに円形背景（`bg-*-100`）を適用
- **変更後**: アイコンの背景を削除し、アイコン色のみで表現
- **理由**: UIの簡素化と視認性の向上

---

## 🔍 関連ファイル

- `src/components/features/today-schedule-card.tsx`: 本日入出庫予定カードの実装
- `docs/SCHEDULE_CARD_COLOR_REVIEW.md`: カード全体の色設定レビュー



