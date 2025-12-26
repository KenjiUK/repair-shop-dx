# UIUX改善作業フロー

## ⚠️ 重要な注意事項（毎回確認）

### 1. 一括置換の禁止
- **日本語が文字化けする可能性があるため、一括置換（replace_all）は極力使用しない**
- 1箇所ずつ慎重に確認しながら修正する
- やむを得ず一括置換を使用する場合は、事前にバックアップを取る

### 2. ボタンサイズの統一チェック
- **同じような重要なアクションは同じサイズになるべき**
  - 例：「受付を開始」と「引渡しを開始」は同じサイズ（`h-12` = 48px）
  - 例：同じページ内のプライマリアクションは同じサイズ
- `priority === "high"`と`priority === "medium"`でも、同じような重要なアクションなら同じサイズに統一
- **カスタムサイズ指定（`className`内の`h-*`）を確認し、`size`プロパティに統一**

### 3. 見逃し防止チェックリスト
- [ ] 同じような機能のボタンが同じサイズか確認
- [ ] `priority`によるサイズの違いが適切か確認
- [ ] カスタムサイズ指定（`className`内の`h-*`）がないか確認
- [ ] `text-xs`（12px）が使われていないか確認（使用禁止）
- [ ] アイコンサイズが統一されているか確認

### 4. 修正前の確認手順
1. **影響範囲の特定**
   - 修正対象のコンポーネントを特定
   - 同じパターンが他にないか検索（`grep`で確認）
   - 関連するコンポーネントを確認

2. **現状の確認**
   - 現在のサイズ指定を確認
   - 同じような機能のボタンサイズを比較
   - `priority`によるサイズの違いを確認

3. **修正方針の決定**
   - どのサイズに統一するか決定（通常は`h-12` = 48px）
   - カスタムサイズ指定を削除し、`size`プロパティに統一
   - アイコンサイズも統一

4. **修正の実行**
   - 1箇所ずつ慎重に修正
   - 修正後、lintチェックを実行
   - 動作確認を実施

### 5. よくある問題パターン

#### 問題1: priorityによるサイズの違い
```tsx
// ❌ 問題: priority="high"とpriority="medium"でサイズが異なる
{actionConfig.priority === "high" ? (
  <Button size="default">受付を開始</Button> // h-12
) : actionConfig.priority === "medium" ? (
  <Button className="h-10">引渡しを開始</Button> // h-10（異なるサイズ）
) : null}

// ✅ 修正: 同じような重要なアクションは同じサイズに統一
{actionConfig.priority === "high" ? (
  <Button size="default">受付を開始</Button> // h-12
) : actionConfig.priority === "medium" ? (
  <Button size="default">引渡しを開始</Button> // h-12（統一）
) : null}
```

#### 問題2: カスタムサイズ指定の残存
```tsx
// ❌ 問題: className内にカスタムサイズ指定がある
<Button size="sm" className="h-7 text-xs">フィルター解除</Button>

// ✅ 修正: カスタムサイズ指定を削除し、sizeプロパティのみ使用
<Button size="sm">フィルター解除</Button>
```

#### 問題3: アイコンサイズの不統一
```tsx
// ❌ 問題: アイコンサイズが小さい（h-3 w-3）
<Loader2 className="h-3 w-3 animate-spin" />

// ✅ 修正: アイコンサイズを拡大（h-4 w-4以上）
<Loader2 className="h-4 w-4 animate-spin" />
```

### 6. 修正後の確認事項
- [ ] 同じような重要なアクションが同じサイズになっているか
- [ ] カスタムサイズ指定が残っていないか
- [ ] `text-xs`（12px）が使われていないか
- [ ] アイコンサイズが統一されているか
- [ ] lintエラーがないか
- [ ] 動作確認が完了しているか

---

## 実装ログ

### 2024-12-XX: Phase 1.1 ボタンサイズの拡大と統一

#### 修正完了
- [x] `src/app/page.tsx`: フィルター解除ボタン、すべてクリアボタン、SelectTrigger
- [x] `src/components/features/job-card.tsx`: 対応完了ボタン、priority="medium"のボタン（引渡しを開始）を`h-10`→`h-12`に統一（PC・モバイル両方）
- [x] `src/components/features/blog-photo-selector.tsx`: すべて選択/解除ボタン
- [x] `src/app/mechanic/diagnosis/[id]/page.tsx`: 対応完了ボタン

#### 修正内容の詳細

1. **job-card.tsx**: `priority === "medium"`のボタン（引渡しを開始）を`h-10`（40px）→`h-12`（48px）に統一
   - PC表示: 行513の`h-10`→`h-12`、アイコンサイズ`h-4 w-4`→`h-5 w-5`
   - モバイル表示: 行761の`h-10`→`h-12`、アイコンサイズ`h-4 w-4`→`h-5 w-5`
   - これにより、「受付を開始」（priority="high"）と「引渡しを開始」（priority="medium"）が同じサイズ（`h-12` = 48px）に統一された

2. **work/[id]/page.tsx**: 撮影ボタン・完了ボタンのサイズ統一
   - 問題: `size="sm"`（`h-10` = 40px）を使っているのに、`className`で`h-12`を指定していた（矛盾）
   - 修正: `size="sm"`→`size="default"`に変更し、`className`内の`h-12`を削除
   - 撮影ボタン: `size="default"`（`h-12` = 48px）に統一、アイコンサイズは`h-5 w-5`のまま
   - 完了ボタン: `size="default"`（`h-12` = 48px）に統一、アイコンサイズ`h-4 w-4`→`h-5 w-5`
   - これにより、重要なアクションボタンが同じサイズ（`h-12` = 48px）に統一された

3. **job-memo-dialog.tsx**: 保存・キャンセルボタン、編集・削除ボタンのサイズ統一
   - 問題: 保存・キャンセルボタンが`size="sm"`（`h-10` = 40px）で、他のダイアログの保存ボタン（`h-12` = 48px）と異なる
   - 修正: 保存・キャンセルボタンを`size="sm"`→`size="default"`に変更
   - 編集・削除ボタン: `size="sm"` + `className="h-7 w-7"`（28px）→`size="icon-sm"`（40px）に変更
   - アイコンサイズ: `h-3.5 w-3.5`→`h-4 w-4`
   - これにより、ダイアログ内の保存ボタンが同じサイズ（`h-12` = 48px）に統一された

4. **invoice-upload.tsx**: アイコンボタンのサイズ統一
   - 問題: `size="sm"`（`h-10` = 40px）を使っているのに、`className="h-8"`（32px）を指定していた（矛盾）
   - 修正: `size="sm"`→`size="icon-sm"`（40px）に変更し、`className`内の`h-8`を削除
   - これにより、アイコンボタンが適切なサイズ（40px）に統一された

5. **vehicle-registration-upload.tsx**: ボタンサイズ統一
   - 問題: `size="sm"`（`h-10` = 40px）を使っているのに、`className="h-7"`（28px）を指定していた（矛盾）
   - 修正: `className`内の`h-7`を削除し、`size="sm"`（40px）のみを使用
   - これにより、ボタンサイズが統一された

6. **courtesy-car-select-dialog.tsx, mechanic-select-dialog.tsx**: 選択ボタンのサイズ統一
   - 問題: `size="lg"`（`h-14` = 56px）を使っているのに、`className`で`h-20`（80px）や`h-16`（64px）を指定していた（矛盾）
   - 修正: `size`プロパティを削除し、`className`のみでサイズを指定（特別なレイアウトが必要なため）
   - これにより、`size`プロパティと`className`の矛盾が解消された

7. **SelectTriggerのサイズ統一**: すべてのSelectTriggerを`h-12`（48px）に統一
   - 修正ファイル:
     - `src/app/mechanic/diagnosis/[id]/page.tsx`: `h-9`→`h-12`
     - `src/app/admin/estimate/[id]/page.tsx`: `h-9`→`h-12`（2箇所）
     - `src/app/admin/announcements/page.tsx`: `h-9`→`h-12`（2箇所）
     - `src/components/features/diagnosis-fee-dialog.tsx`: `h-9`→`h-12`
     - `src/components/features/quality-inspection-section.tsx`: `h-8`→`h-12`、`h-9`→`h-12`（2箇所、`text-xs`も削除）
     - `src/components/features/restore-progress-section.tsx`: `h-9`→`h-12`
     - `src/components/features/restore-work-view.tsx`: `h-9`→`h-12`
     - `src/components/features/restore-estimate-view.tsx`: `h-9`→`h-12`
     - `src/components/features/restore-diagnosis-view.tsx`: `h-9`→`h-12`（5箇所）
     - `src/components/features/body-paint-outsourcing-view.tsx`: `h-9`→`h-12`、`h-8`→`h-12`（`text-xs`も削除）
     - `src/components/features/body-paint-estimate-view.tsx`: `h-9`→`h-12`
     - `src/components/features/body-paint-diagnosis-view.tsx`: `h-9`→`h-12`（4箇所）
   - これにより、すべてのSelectTriggerが同じサイズ（`h-12` = 48px）に統一された

8. **Inputコンポーネントのデフォルトサイズ変更**: `h-9`（36px）→`h-12`（48px）
   - 修正: `src/components/ui/input.tsx`のデフォルトクラスを`h-9`→`h-12`に変更、`py-1`→`py-2`に変更
   - これにより、すべてのInputコンポーネントが48px（`h-12`）になる

