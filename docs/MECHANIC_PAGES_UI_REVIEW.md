# 整備士専用ページ UI/UX レビュー・改善提案

**作成日**: 2025-01-XX  
**対象ページ**: 整備士専用ページ（作業系・点検系）  
**レビュー基準**: 40歳以上ユーザー向け最適化、作業用手袋着用時も操作可能、スマホ前提

---

## 目次

1. [検査項目ボトムシート](#1-検査項目ボトムシート)
2. [作業メモのメモを追加/編集ボタン](#2-作業メモのメモを追加編集ボタン)
3. [点検の走行距離入力ボックス](#3-点検の走行距離入力ボックス)
4. [モーダル・ボトムシート全般](#4-モーダルボトムシート全般)
5. [その他の改善点](#5-その他の改善点)
6. [改善チェックリスト](#6-改善チェックリスト)

---

## 1. 検査項目ボトムシート

### 1-1. 現状

**ファイル**: `src/components/features/inspection-status-bottom-sheet.tsx`

**確認項目**:
- ✅ ボタンの高さ: `h-16` (64px) - 適切（作業用手袋着用時も操作可能）
- ✅ 文字サイズ: `text-xl` (良好ボタン), `text-base` (その他) - 適切
- ✅ カラーリング: セマンティックカラー使用 - 適切
- ❌ `SheetDescription`: `text-sm` (14px) を使用 - **修正必要**

### 1-2. 改善点

#### 問題1: SheetDescriptionの文字サイズ

**現状**:
```typescript
<SheetDescription className="text-sm text-slate-600 mt-1.5 dark:text-white">
  {remainingItems !== undefined && `残り ${remainingItems} 項目`}
  {currentSection && totalSections && ` (${currentSection} / ${totalSections})`}
</SheetDescription>
```

**問題**: `text-sm` (14px) は40歳以上ユーザー向けに小さすぎる

**修正案**:
```typescript
<SheetDescription className="text-base text-slate-700 mt-1.5 dark:text-white">
  {remainingItems !== undefined && `残り ${remainingItems} 項目`}
  {currentSection && totalSections && ` (${currentSection} / ${totalSections})`}
</SheetDescription>
```

**変更内容**:
- `text-sm` → `text-base` (14px → 16px)
- `text-slate-600` → `text-slate-700` (コントラスト向上)

---

## 2. 作業メモのメモを追加/編集ボタン

### 2-1. 現状

**ファイル**: `src/components/features/job-memo-dialog.tsx`

**確認項目**:
- ✅ メモを表示/編集ボタン: `h-12` (48px) - 適切
- ❌ ダイアログ内のアイコンボタン: `size="icon-sm"` (`h-10` / 40px) - **修正必要**
- ✅ テキストボタン: `size="default"` (`h-12` / 48px) - 適切

### 2-2. 改善点

#### 問題1: アイコンボタンのサイズ

**現状**:
```typescript
<Button
  variant="ghost"
  size="icon-sm"
  onClick={() => handleStartEdit(memo)}
  title="編集"
>
  <Edit className="h-4 w-4 shrink-0" />
</Button>
```

**問題**: `size="icon-sm"` (`h-10` / 40px) は作業用手袋着用時には小さすぎる

**修正案**:
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleStartEdit(memo)}
  title="編集"
  className="h-12 w-12"
>
  <Edit className="h-5 w-5 shrink-0" />
</Button>
```

**変更内容**:
- `size="icon-sm"` → `size="icon"` + `className="h-12 w-12"` (40px → 48px)
- アイコンサイズ: `h-4 w-4` → `h-5 w-5` (16px → 20px)

---

## 3. 点検の走行距離入力ボックス

### 3-1. 現状

**ファイル**: `src/app/mechanic/diagnosis/[id]/page.tsx`

**確認項目**:
- ✅ 通常の走行距離入力: `h-12 text-base` - 適切
- ❌ 24ヶ月点検用の走行距離入力: `h-28 text-3xl` - **大きすぎる**

### 3-2. 改善点

#### 問題1: 24ヶ月点検用の走行距離入力ボックスのサイズ

**現状**:
```typescript
<Input
  id="mileage"
  type="number"
  inputMode="numeric"
  value={mileage !== null && mileage !== undefined ? mileage.toString() : ""}
  onChange={(e) => handleMileageInputChange(e.target.value)}
  onBlur={handleMileageBlur}
  placeholder="走行距離を入力"
  disabled={isUpdatingMileage || isSubmitting}
  className="h-28 text-3xl flex-1"
/>
```

**問題**: `h-28` (112px) と `text-3xl` (30px) は大きすぎる。他の入力フィールドと統一感がない。

**修正案**:
```typescript
<Input
  id="mileage"
  type="number"
  inputMode="numeric"
  value={mileage !== null && mileage !== undefined ? mileage.toString() : ""}
  onChange={(e) => handleMileageInputChange(e.target.value)}
  onBlur={handleMileageBlur}
  placeholder="走行距離を入力"
  disabled={isUpdatingMileage || isSubmitting}
  className="h-14 text-xl flex-1"
/>
```

**変更内容**:
- `h-28` → `h-14` (112px → 56px)
- `text-3xl` → `text-xl` (30px → 20px)
- ラベルと単位のサイズも調整: `text-3xl` → `text-xl`

**完全な修正例**:
```typescript
<Card className="border-slate-200 shadow-md">
  <CardHeader className="pb-3">
    <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2 dark:text-white">
      <Gauge className="h-5 w-5 text-slate-600 shrink-0 dark:text-white" />
      点検時の総走行距離
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-3">
      <Input
        id="mileage"
        type="number"
        inputMode="numeric"
        value={mileage !== null && mileage !== undefined ? mileage.toString() : ""}
        onChange={(e) => handleMileageInputChange(e.target.value)}
        onBlur={handleMileageBlur}
        placeholder="走行距離を入力"
        disabled={isUpdatingMileage || isSubmitting}
        className="h-14 text-xl flex-1"
      />
      <span className="text-xl font-medium text-slate-700 dark:text-white">km / mi</span>
    </div>
    {mileage !== null && mileage !== undefined && (
      <p className="text-base text-slate-700 mt-2 dark:text-white">
        現在: {mileage.toLocaleString()} km / {Math.round(mileage * 0.621371).toLocaleString()} mi
      </p>
    )}
  </CardContent>
</Card>
```

---

## 4. モーダル・ボトムシート全般

### 4-1. Dialog（ダイアログ）

**ファイル**: `src/components/ui/dialog.tsx`

**確認項目**:
- ✅ パディング: `p-4 sm:p-6` - 適切
- ✅ 最大幅: `max-w-[calc(100%-1rem)] sm:max-w-lg` - 適切
- ✅ ボタンサイズ: デフォルトで`h-12` - 適切

**改善点**: なし（既に適切）

### 4-2. Sheet（ボトムシート）

**ファイル**: `src/components/ui/sheet.tsx`

**確認項目**:
- ✅ パディング: カスタム（`px-4 pt-5 pb-3`など） - 適切
- ✅ アニメーション: スムーズ - 適切
- ❌ `SheetTitle`: デフォルトで`font-semibold`のみ（サイズ指定なし） - **確認必要**

**改善点**:

#### 問題1: SheetTitleのデフォルトスタイル

**現状**:
```typescript
<SheetTitle className="text-lg font-semibold text-slate-900 leading-relaxed break-words dark:text-white">
  {itemLabel}
</SheetTitle>
```

**確認**: `text-lg` (18px) は適切。ただし、デフォルトの`SheetTitle`コンポーネントにはサイズ指定がないため、明示的に指定する必要がある。

**推奨**: 現状の実装（明示的に`text-lg`を指定）を維持。

---

## 5. その他の改善点

### 5-1. フォントサイズの統一

**問題**: 一部のコンポーネントで`text-sm` (14px) が使用されている

**対象箇所**:
- `SheetDescription`（既に修正案提示）
- その他の補助情報表示

**修正方針**: すべて`text-base` (16px) に統一

### 5-2. コントラスト比の向上

**問題**: 一部のテキストで`text-slate-600`が使用されている

**修正方針**: `text-slate-700`または`text-slate-800`に変更（コントラスト比4.5:1以上を確保）

### 5-3. アイコンサイズの統一

**問題**: 一部のアイコンで`h-4 w-4` (16px) が使用されている

**修正方針**: 可能な限り`h-5 w-5` (20px) に統一（視認性向上）

---

## 6. 改善チェックリスト

### 6-1. 検査項目ボトムシート

- [ ] `SheetDescription`の`text-sm`を`text-base`に変更
- [ ] `SheetDescription`の`text-slate-600`を`text-slate-700`に変更
- [ ] ボタンの高さが`h-16` (64px) であることを確認
- [ ] ボタンの文字サイズが`text-xl`（良好）または`text-base`（その他）であることを確認

### 6-2. 作業メモダイアログ

- [ ] アイコンボタンのサイズを`h-12 w-12` (48px) に変更
- [ ] アイコンサイズを`h-5 w-5` (20px) に変更
- [ ] テキストボタンのサイズが`h-12` (48px) であることを確認

### 6-3. 走行距離入力ボックス

- [ ] 24ヶ月点検用の入力ボックスの高さを`h-14` (56px) に変更
- [ ] 24ヶ月点検用の入力ボックスの文字サイズを`text-xl` (20px) に変更
- [ ] ラベルと単位の文字サイズを`text-xl` (20px) に変更
- [ ] 補助情報（現在の走行距離）の文字サイズを`text-base` (16px) に変更

### 6-4. モーダル・ボトムシート全般

- [ ] すべての`Dialog`内のボタンが`h-12` (48px) 以上であることを確認
- [ ] すべての`Sheet`内のボタンが`h-12` (48px) 以上であることを確認
- [ ] すべてのテキストが`text-base` (16px) 以上であることを確認
- [ ] すべてのアイコンが`h-4 w-4` (16px) 以上であることを確認

### 6-5. その他

- [ ] `text-sm` (14px) の使用箇所をすべて`text-base` (16px) に変更
- [ ] `text-slate-600`の使用箇所を`text-slate-700`または`text-slate-800`に変更
- [ ] `h-4 w-4` (16px) のアイコンを可能な限り`h-5 w-5` (20px) に変更

---

## 7. 優先度

### 最優先（即座に修正）

1. **24ヶ月点検用の走行距離入力ボックス** - 大きすぎて使いにくい
2. **作業メモダイアログのアイコンボタン** - 作業用手袋着用時には操作困難

### 高優先（次回リリースまでに修正）

3. **SheetDescriptionの文字サイズ** - 視認性向上
4. **その他の`text-sm`使用箇所** - 統一性向上

### 中優先（継続的に改善）

5. **コントラスト比の向上** - アクセシビリティ向上
6. **アイコンサイズの統一** - 視認性向上

---

## 8. 実装例

### 8-1. 検査項目ボトムシートの修正

```typescript
// 修正前
<SheetDescription className="text-sm text-slate-600 mt-1.5 dark:text-white">
  {remainingItems !== undefined && `残り ${remainingItems} 項目`}
</SheetDescription>

// 修正後
<SheetDescription className="text-base text-slate-700 mt-1.5 dark:text-white">
  {remainingItems !== undefined && `残り ${remainingItems} 項目`}
</SheetDescription>
```

### 8-2. 作業メモダイアログの修正

```typescript
// 修正前
<Button
  variant="ghost"
  size="icon-sm"
  onClick={() => handleStartEdit(memo)}
  title="編集"
>
  <Edit className="h-4 w-4 shrink-0" />
</Button>

// 修正後
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleStartEdit(memo)}
  title="編集"
  className="h-12 w-12"
>
  <Edit className="h-5 w-5 shrink-0" />
</Button>
```

### 8-3. 24ヶ月点検用の走行距離入力ボックスの修正

```typescript
// 修正前
<Input
  className="h-28 text-3xl flex-1"
  // ...
/>

// 修正後
<Input
  className="h-14 text-xl flex-1"
  // ...
/>
```

---

## 9. 更新履歴

- **2025-01-XX**: 初版作成

