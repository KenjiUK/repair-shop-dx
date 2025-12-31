# 12ヶ月点検 UI デザインシステム準拠レビュー

**作成日**: 2025-01-XX  
**目的**: 現在の実装がデザインシステムに準拠しているかレビューし、改善提案

---

## 📋 現状の課題

### 1. 測定値記入欄がない

**12ヶ月点検のPDFテンプレートに必要な測定値:**

1. **CO・HC濃度**:
   - CO濃度（%）
   - HC濃度（ppm）

2. **ブレーキパッド、ライニングの厚さ（mm）**:
   - 前輪 左
   - 前輪 右
   - 後輪 左
   - 後輪 右

3. **タイヤの溝の深さ（mm）**:
   - 前輪 左
   - 前輪 右
   - 後輪 左
   - 後輪 右

### 2. デザインシステムの準拠状況

#### 2-1. 色使いの問題

**現在の実装:**
```typescript
// ボタンの背景色
bg-green-600  // ✅ 適切（成功: green-600）
bg-red-600    // ✅ 適切（エラー: red-600）
bg-amber-600  // ✅ 適切（警告: amber-600）
bg-blue-600   // ✅ 適切（情報: blue-600）

// アイコンの色
text-green-600  // ✅ 適切
text-red-600    // ✅ 適切
text-amber-600  // ✅ 適切
text-blue-600   // ✅ 適切

// ボーダーの色
border-green-300  // ⚠️ 少し明るすぎる（デザインシステムでは green-50/green-300 の組み合わせ）
border-red-300    // ⚠️ 少し明るすぎる
border-amber-300  // ⚠️ 少し明るすぎる
border-blue-300   // ⚠️ 少し明るすぎる

// 背景色（outline variant）
bg-green-50   // ✅ 適切（デザインシステム: green-50）
bg-red-50     // ✅ 適切（デザインシステム: red-50）
bg-amber-50   // ✅ 適切（デザインシステム: amber-50）
bg-blue-50    // ✅ 適切（デザインシステム: blue-50）

// テキストの色（outline variant）
text-green-700  // ✅ 適切（デザインシステム: green-700）
text-red-700    // ✅ 適切（デザインシステム: red-700）
text-amber-700  // ✅ 適切（デザインシステム: amber-700）
text-blue-700   // ✅ 適切（デザインシステム: blue-700）
```

**改善提案:**
- ボーダーの色は`-300`のままでも良いが、より統一感を持たせるために`-200`を検討
- または、デザインシステムの推奨パターンに従い、`border-slate-200`（標準ボーダー）を使用し、アクティブ時のみ色付きボーダーを使用

#### 2-2. カードの背景色

**現在の実装:**
```typescript
// ステータスによる背景色
item.status === "good" && "bg-green-50 border-green-300"     // ✅ 適切
item.status === "exchange" && "bg-red-50 border-red-300"     // ✅ 適切
item.status === "repair" && "bg-amber-50 border-amber-300"   // ✅ 適切
item.status === "none" && "bg-white border-slate-200"        // ✅ 適切
```

**改善提案:**
- ボーダーの色を`-300`から`-200`に変更（より控えめに）
- または、デザインシステムの推奨パターンに従い、`border-slate-300`（標準ボーダー）を使用

#### 2-3. ボタンのスタイル

**現在の実装:**
```typescript
// 良好ボタン（selected）
bg-green-600 hover:bg-green-700 text-white border-green-700

// 良好ボタン（unselected, outline）
border-green-300 text-green-700 hover:bg-green-50 border-2
```

**デザインシステムの推奨:**
- Primaryボタン: `bg-primary text-primary-foreground` (通常は`slate-900`と`white`)
- Secondaryボタン: `bg-secondary text-secondary-foreground`
- Outlineボタン: `border border-input bg-background`

**改善提案:**
- ステータスボタンは特別な用途のため、現在の色使いは維持
- ただし、ボーダーの色を`-300`から`-200`に変更（より控えめに）

---

## 🎨 改善提案

### 1. 色使いの統一

**推奨パターン:**

```typescript
// ボタン（selected）
bg-green-600 hover:bg-green-700 text-white
bg-red-600 hover:bg-red-700 text-white
bg-amber-600 hover:bg-amber-700 text-white
bg-blue-600 hover:bg-blue-700 text-white

// ボタン（unselected, outline）
border-slate-300 text-green-700 hover:bg-green-50 hover:border-green-200
border-slate-300 text-red-700 hover:bg-red-50 hover:border-red-200
border-slate-300 text-amber-700 hover:bg-amber-50 hover:border-amber-200
border-slate-300 text-blue-700 hover:bg-blue-50 hover:border-blue-200

// カードの背景色（ステータス別）
bg-green-50 border-green-200    // 良好
bg-red-50 border-red-200        // 交換
bg-amber-50 border-amber-200    // 修理
bg-white border-slate-200       // 未入力
```

### 2. 測定値入力欄の実装

**必要なコンポーネント:**
1. `InspectionMeasurementInput` コンポーネント
2. 測定値入力セクション（カード形式）
3. フォームバリデーション

**レイアウト:**
- タブの下に「測定値入力」セクションを追加
- カード形式で表示
- 12ヶ月点検の場合のみ表示

---

## 📐 実装計画

### Phase 1: 測定値入力欄の実装（優先度高）

1. **`InspectionMeasurementInput`コンポーネント作成**
   - CO・HC濃度入力フィールド
   - ブレーキパッド厚さ入力フィールド（4箇所）
   - タイヤ溝の深さ入力フィールド（4箇所）

2. **測定値入力セクションの追加**
   - テストページに追加
   - デザインシステムに準拠したスタイル

3. **データモデルの確認**
   - `InspectionMeasurements`インターフェースを確認
   - 必要に応じて拡張

### Phase 2: デザインシステムの準拠改善（優先度中）

1. **色使いの統一**
   - ボーダー色を`-300`から`-200`に変更
   - または、標準ボーダー`border-slate-300`を使用

2. **ボタンスタイルの統一**
   - outline variantのボーダー色を調整
   - hover状態の色を調整

3. **カードスタイルの統一**
   - ステータス別の背景色・ボーダー色を調整

---

## ✅ チェックリスト

- [ ] 測定値入力欄の実装
  - [ ] CO・HC濃度入力フィールド
  - [ ] ブレーキパッド厚さ入力フィールド（4箇所）
  - [ ] タイヤ溝の深さ入力フィールド（4箇所）
  - [ ] フォームバリデーション
- [ ] デザインシステム準拠の改善
  - [ ] ボーダー色の調整（`-300` → `-200`または`border-slate-300`）
  - [ ] hover状態の色調整
  - [ ] カードスタイルの統一






