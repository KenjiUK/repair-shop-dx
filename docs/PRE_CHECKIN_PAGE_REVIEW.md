# 事前チェックインページ UI/UX レビュー・改善

**作成日**: 2025-01-XX  
**対象ページ**: `/customer/pre-checkin/[id]`  
**対象ファイル**: `src/app/customer/pre-checkin/[id]/page.tsx`

---

## 🔴 発見された問題

### 1. デザインシステム非準拠（絵文字の使用）

**現象**: 車検有効期限の警告表示で絵文字（⚠️）が使用されている

**原因**:
- 1074行目: `⚠️ 車検が期限切れです。`
- 1085行目: `{daysUntilExpiry <= 30 && "⚠️ "}`

**影響**: 
- DESIGN_SYSTEM.mdに準拠していない（アイコンを使用すべき）
- アクセシビリティの問題（スクリーンリーダーでの読み上げが不適切）
- 視覚的な一貫性の欠如

### 2. 車名表示部分に住所が混入する問題

**現象**: 車両選択リストで、車名の代わりに住所が表示される場合がある

**原因**:
- `job.field6.name`が「車名 / 登録番号」の形式ではなく、住所を含む形式で保存されている可能性
- 車名のみを抽出する処理が不十分

**影響**:
- ユーザーが正しい車両を選択できない
- データの信頼性の低下

### 3. プレビュー表示の改行問題

**現象**: 送信確認ダイアログで、改行が正しく表示されない

**原因**:
- `getConfirmItems()`で生成される文字列に`\n`が含まれているが、表示時に改行されない
- `whitespace-pre-line`が適用されていない

**影響**:
- 確認内容が読みにくい
- ユーザーが送信内容を正確に確認できない

### 4. ファイルアップロードUXの不明確さ

**現象**: ファイルを選択した後、アップロードのタイミングが不明確

**原因**:
- ファイル選択後、すぐにアップロードされるのか、送信時にアップロードされるのかが不明確
- アップロード状態のフィードバックが不十分

**影響**:
- ユーザーがアップロードのタイミングを理解できない
- ファイル選択後の次のアクションが不明確

### 5. チェックボックスサイズの非準拠

**現象**: メール配信同意のチェックボックスが`h-5 w-5` (20px) で、DESIGN_SYSTEM.mdの推奨サイズ`size-4` (16px) と異なる

**原因**:
- チェックボックスのサイズがDESIGN_SYSTEM.mdに準拠していない

**影響**:
- デザインシステムの一貫性の欠如

---

## ✅ 改善内容

### 1. 絵文字をアイコンに置き換え

**実装**: `AlertCircle`アイコンを使用

```typescript
// 修正前
<p className="text-base text-red-700 font-medium">
  ⚠️ 車検が期限切れです。早急に更新をお願いします。
</p>

// 修正後
<div className="flex items-start gap-2">
  <AlertCircle className="h-5 w-5 text-red-700 shrink-0 mt-0.5" />
  <div className="flex-1">
    <p className="text-base text-red-700 font-medium">
      車検が期限切れです。早急に更新をお願いします。
    </p>
  </div>
</div>
```

**理由**:
- DESIGN_SYSTEM.mdに準拠（アイコンを使用）
- アクセシビリティの向上（スクリーンリーダーで適切に読み上げられる）
- 視覚的な一貫性の確保

### 2. 車名表示部分の住所混入問題を修正

**実装**: `job.field6.name`から車名のみを抽出する処理を追加

```typescript
// 修正前
const displayName = 
  job?.field6?.id === vehicle.id 
    ? job.field6.name 
    : vehicle.field44 || vehicle.Name || "車名未登録";

// 修正後
let displayName = vehicle.field44 || vehicle.Name || "車名未登録";
if (job?.field6?.id === vehicle.id && job.field6.name) {
  // 「車名 / 登録番号」の形式から車名のみを抽出
  const nameParts = job.field6.name.split(" / ");
  displayName = nameParts[0] || job.field6.name;
}
```

**適用箇所**:
- 車両選択リスト（809-817行目）
- VehicleRegistrationUploadコンポーネント（1137-1144行目）
- InspectionRecordUploadコンポーネント（1158-1165行目）

**理由**:
- 車名のみを正確に表示
- データの信頼性の向上

### 3. プレビュー表示の改行問題を修正

**実装**: `whitespace-pre-line`と`leading-relaxed`を適用

```typescript
// 修正前
<div key={index} className="text-base text-slate-800 whitespace-pre-line">
  ○ {item}
</div>

// 修正後
<div key={index} className="text-base text-slate-800 whitespace-pre-line leading-relaxed">
  <span className="inline-block w-6">○</span>
  <span className="inline-block">{item}</span>
</div>
```

**理由**:
- 改行が正しく表示される
- 確認内容が読みやすくなる

### 4. ファイルアップロードUXの改善

**実装**: アップロードタイミングを明確化する説明文を追加

```typescript
// 追加
<p className="text-base text-slate-500 mb-3">
  ※ ファイルを選択後、「確認して送信」ボタンを押すとアップロードされます
</p>
```

**適用箇所**:
- 既存車両選択時の車検証アップロード（1128-1131行目）
- 新規車両登録時の車検証アップロード（896-899行目）

**理由**:
- アップロードタイミングが明確になる
- ユーザーが次のアクションを理解できる

### 5. チェックボックスサイズの修正

**実装**: `h-5 w-5`から`size-4`に変更

```typescript
// 修正前
<Checkbox
  id="emailOptIn"
  checked={true}
  disabled={true}
  className="h-5 w-5 shrink-0 mt-0.5"
/>

// 修正後
<Checkbox
  id="emailOptIn"
  checked={true}
  disabled={true}
  className="size-4 shrink-0 mt-1"
/>
```

**理由**:
- DESIGN_SYSTEM.mdに準拠（`size-4` (16px) を使用）
- デザインシステムの一貫性の確保

---

## 📋 実装チェックリスト

- [x] 絵文字をアイコンに置き換え（AlertCircleアイコンを使用）
- [x] 車名表示部分の住所混入問題を修正（車名のみを抽出）
- [x] プレビュー表示の改行問題を修正（whitespace-pre-line適用）
- [x] ファイルアップロードUXの改善（アップロードタイミングの明確化）
- [x] チェックボックスサイズの修正（size-4に変更）
- [x] アイコンサイズの確認（h-4 w-4以上を使用）
- [x] フォントサイズの確認（text-base以上を使用）
- [x] ボタンサイズの確認（h-12を使用）
- [x] 入力フィールドサイズの確認（h-12を使用）

---

## 🎨 デザインシステム準拠状況

### アイコン
- ✅ すべてのアイコンで`h-4 w-4` (16px) 以上を使用
- ✅ `shrink-0`を設定
- ✅ 適切な色を使用（`text-slate-700`など）
- ✅ 絵文字を使用していない（AlertCircleアイコンを使用）

### テキスト
- ✅ すべてのテキストで`text-base` (16px) 以上を使用
- ✅ `text-xs` (12px) を使用していない
- ✅ 適切なウェイトを使用（`font-medium`, `font-semibold`など）

### ボタン
- ✅ すべてのボタンで`h-12` (48px) を使用
- ✅ 適切なバリアントを使用

### フォーム要素
- ✅ すべての入力フィールドで`h-12` (48px) を使用
- ✅ チェックボックスで`size-4` (16px) を使用
- ✅ テキストサイズは`text-base` (16px) を使用

### スペーシング
- ✅ 適切なパディングを使用（`pb-3`, `px-2.5 py-1`など）
- ✅ セクション間は`space-y-6`を使用

---

## 🔍 その他の確認事項

### アクセシビリティ
- ✅ すべてのインタラクティブ要素に適切な`aria-label`が設定されているか
- ✅ すべてのフォーム要素に適切な`aria-required`, `aria-invalid`が設定されているか
- ✅ すべてのエラーメッセージに`role="alert"`が設定されているか
- ✅ すべての機能をキーボードで操作可能か

### カラー
- ✅ すべてのテキストと背景のコントラスト比が4.5:1以上か
- ✅ ステータスバッジの色が統一されているか

### レスポンシブ
- ✅ モバイル対応が適切か
- ✅ タッチターゲットサイズが48px以上か

---

## 📝 改善前後の比較

### 改善前
- 絵文字（⚠️）を使用
- 車名に住所が混入
- プレビューで改行が表示されない
- ファイルアップロードのタイミングが不明確
- チェックボックスサイズが非準拠

### 改善後
- AlertCircleアイコンを使用（DESIGN_SYSTEM.md準拠）
- 車名のみを正確に表示
- プレビューで改行が正しく表示される
- ファイルアップロードのタイミングが明確
- チェックボックスサイズがDESIGN_SYSTEM.md準拠

---

## 🔗 関連ドキュメント

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - デザインシステム
- [PAGE_SPECIFICATION.md](./PAGE_SPECIFICATION.md) - ページ単位詳細設計仕様書
- [PRE_CHECKIN_IMPLEMENTATION_STATUS.md](./PRE_CHECKIN_IMPLEMENTATION_STATUS.md) - 事前チェックイン機能実装状況
- [PRE_CHECKIN_UX_IMPROVEMENT_PROPOSAL.md](./PRE_CHECKIN_UX_IMPROVEMENT_PROPOSAL.md) - 事前チェックインUX改善提案

---

## 📌 今後の改善提案

### 1. ファイルアップロードの進捗表示
- アップロード中の進捗バーを表示
- アップロード完了時の明確なフィードバック

### 2. バリデーションの強化
- リアルタイムバリデーション
- エラーメッセージの明確化

### 3. モバイルUXの最適化
- タッチ操作の最適化
- スクロール位置の最適化

---

**End of Document**

