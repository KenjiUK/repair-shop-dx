# サマリーカード色使いレビュー（2025年ベストプラクティス）

## 現状の問題点

### 1. **色の意味の一貫性がない**
- **同じ色が異なる意味で使用**:
  - `blue-600`: 「入庫待ち」（ステータス）と「車検」「12ヵ月点検」（カテゴリー）
  - `orange-600`: 「診断待ち」（ステータス）と「修理・整備」（カテゴリー）
  - `purple-600`: 「見積作成待ち」（ステータス）と「タイヤ」「レストア」（カテゴリー）

### 2. **警告色の区別が不明確**
- 「お客様承認待ち」: `yellow-600`（警告色）
- 「診断待ち」: `orange-600`（注意色）
- 色覚多様性ユーザーにとって区別が困難

### 3. **デザインシステムの色トークンが未定義**
- Tailwindの標準色を直接使用
- 意味的な色の定義がない
- 保守性・一貫性に問題

### 4. **カラーユニバーサルデザインの考慮不足**
- 色だけに依存している部分がある
- アイコンとテキストの組み合わせは良いが、色の意味が統一されていない

## 業界ベストプラクティス（2025年）

### セマンティックカラーシステム
1. **ステータス色（Status Colors）**:
   - 🔵 **Blue**: 情報・進行中・アクティブ
   - 🟠 **Orange**: 警告・注意が必要
   - 🔴 **Red**: エラー・緊急・危険
   - 🟡 **Yellow/Amber**: 承認待ち・保留
   - 🟢 **Green**: 完了・成功
   - ⚪ **Gray**: 非アクティブ・無効

2. **カテゴリー色（Category Colors）**:
   - ステータス色とは別体系
   - 視覚的な区別のため、異なる色相を使用
   - ただし、ステータス色と混同しないよう注意

### アクセシビリティ要件
- **WCAG 2.1 AA準拠**: コントラスト比4.5:1以上
- **色だけに依存しない**: アイコン・テキスト・形状の組み合わせ
- **カラーユニバーサルデザイン**: 色覚多様性に対応

## 改善提案

### 提案1: ステータス色の統一（最重要）

```typescript
// ステータス専用の色システム
const STATUS_COLORS = {
  // 進行中・アクティブ
  pending: {
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    semantic: "進行中・待機中"
  },
  // 注意・警告（診断・修理など）
  attention: {
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    semantic: "注意が必要"
  },
  // 承認待ち・保留（外部依存）
  approval: {
    color: "text-amber-600", // yellowより明確
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    semantic: "承認待ち・保留"
  },
  // 完了・成功
  complete: {
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    semantic: "完了・成功"
  },
  // 緊急・エラー
  critical: {
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    semantic: "緊急・エラー"
  },
  // 情報・管理業務
  info: {
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    semantic: "情報・管理業務"
  }
} as const;
```

### 提案2: カテゴリー色の体系化

```typescript
// 入庫区分（カテゴリー）専用の色システム
const CATEGORY_COLORS = {
  // 点検系（青系）
  inspection: {
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    semantic: "点検・検査"
  },
  // メンテナンス系（緑系）
  maintenance: {
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    semantic: "メンテナンス"
  },
  // 修理系（オレンジ系）
  repair: {
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    semantic: "修理・整備"
  },
  // 診断系（赤系）
  diagnosis: {
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    semantic: "診断・トラブル"
  },
  // カスタマイズ系（紫系）
  customization: {
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    semantic: "カスタマイズ・特殊作業"
  },
  // その他（グレー系）
  other: {
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    semantic: "その他"
  }
} as const;
```

### 提案3: マッピングの改善

#### 本日の状況（ステータス）
- 入庫待ち → `STATUS_COLORS.pending` (Blue)
- 診断待ち → `STATUS_COLORS.attention` (Orange)
- 見積作成待ち → `STATUS_COLORS.info` (Indigo)
- **お客様承認待ち → `STATUS_COLORS.approval` (Amber)** ← 明確に区別
- 作業待ち → `STATUS_COLORS.attention` (Orange)
- 引渡待ち → `STATUS_COLORS.complete` (Green)

#### 入庫区分別（カテゴリー）
- 車検・12ヵ月点検 → `CATEGORY_COLORS.inspection` (Cyan)
- エンジンオイル交換 → `CATEGORY_COLORS.maintenance` (Emerald)
- タイヤ交換・ローテーション → `CATEGORY_COLORS.maintenance` (Emerald)
- その他のメンテナンス → `CATEGORY_COLORS.maintenance` (Emerald)
- 故障診断 → `CATEGORY_COLORS.diagnosis` (Rose)
- 修理・整備 → `CATEGORY_COLORS.repair` (Orange)
- チューニング・パーツ取付 → `CATEGORY_COLORS.customization` (Violet)
- コーティング → `CATEGORY_COLORS.customization` (Violet)
- 板金・塗装 → `CATEGORY_COLORS.repair` (Orange)
- レストア → `CATEGORY_COLORS.customization` (Violet)
- その他 → `CATEGORY_COLORS.other` (Slate)

## 実装方針

1. **デザイントークンの定義**: `tailwind.config.js`にカスタムカラーを定義
2. **色の意味の明確化**: ステータス色とカテゴリー色を分離
3. **アクセシビリティ強化**: コントラスト比の検証と改善
4. **一貫性の確保**: 同じ意味には常に同じ色を使用

## 次のステップ

この改善提案を実装しますか？





