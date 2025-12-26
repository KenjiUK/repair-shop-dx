# 実装ロードマップ

**作成日**: 2025-01-20  
**対象**: 高優先度12項目 + 中優先度24項目  
**方針**: PAGE_SPECIFICATION.mdとDESIGN_SYSTEM.mdに準拠、ユーザー業務目線で実装

---

## 実装方針

1. **影響範囲の確認**: 各項目の実装前に、削除・置き換えするコードを含めて影響範囲を完全に理解
2. **DESIGN_SYSTEM.md準拠**: すべての修正・新規実装はDESIGN_SYSTEM.mdに従う
3. **段階的実装**: 1項目ずつ実装し、レビュー完了後にドキュメントに記録してから次へ
4. **業務フロー理解**: PAGE_SPECIFICATION.mdを参照し、ユーザー業務目線で実装

---

## Phase 1: 基盤整備（高優先度・基盤系）

### 1-1. 日本語フォントスタックの追加（A4）✅

**優先度**: 高  
**実装難易度**: 低  
**影響範囲**: 全画面（グローバルCSS）

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- `tailwind.config.ts`または`globals.css`で日本語フォントスタックを定義
- `font-family: "Geist Sans", "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif;`

**影響ファイル**:
- `tailwind.config.ts`（または`src/app/globals.css`）
- `DESIGN_SYSTEM.md`（ドキュメント更新）

**削除・置き換え**: なし（追加のみ）

**実装順序**: 1番目（他のUI改善の基盤となるため）

---

### 1-2. アイコンの視認性向上（A5）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: 全コンポーネント（アイコン使用箇所）

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 重要なアイコン（カードタイトル、第1階層）: `slate-500` → `slate-600`または`slate-700`に変更
- Lucideアイコンの`strokeWidth`を2.5に設定（デフォルトは2）
- `DESIGN_SYSTEM.md`にルールを追加

**影響ファイル**:
- 全コンポーネント（アイコン使用箇所を一括検索・置換）
- `DESIGN_SYSTEM.md`（アイコンセクション更新）

**削除・置き換え**: 
- `slate-500`のアイコン → `slate-600`または`slate-700`
- `strokeWidth={2}` → `strokeWidth={2.5}`

**実装順序**: 2番目（フォントスタックの次、視認性向上のため）

---

### 1-3. Z-Index管理の定義（A10）✅

**優先度**: 中（高優先度ではないが、基盤として重要）  
**実装難易度**: 低  
**影響範囲**: 全画面（レイヤー管理）

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み

**実装内容**:
- `DESIGN_SYSTEM.md`にZ-Indexの階層ルールを追加（セクション4-4）
- `tailwind.config.ts`でZ-Indexを定義
- `src/app/globals.css`でCSS変数として定義
- 例: Header=40, Sheet=50, Dialog=60, Toast=100

**影響ファイル**:
- `tailwind.config.ts`（既に実装済み）
- `src/app/globals.css`（既に実装済み）
- `DESIGN_SYSTEM.md`（既に実装済み）

**確認結果**:
1. **`tailwind.config.ts`の実装**:
   - `zIndex`オブジェクトに`header: "40"`, `sheet: "50"`, `dialog: "60"`, `toast: "100"`が定義済み

2. **`globals.css`の実装**:
   - CSS変数として`--z-index-header`, `--z-index-sheet`, `--z-index-dialog`, `--z-index-toast`が定義済み
   - Sonnerトーストのz-indexが100に設定済み

3. **`DESIGN_SYSTEM.md`の実装**:
   - セクション4-4にZ-Index階層管理の詳細が記載済み

4. **実際の使用状況**:
   - `app-header.tsx`: `z-[40]`を使用
   - `sheet.tsx`: `z-[50]`を使用
   - トースト通知: `z-index: 100`を使用

**レビュー結果**:
- ✅ Z-Index管理が適切に実装されている
- ✅ DESIGN_SYSTEM.mdに準拠
- ✅ 全画面で一貫したレイヤー管理が実現されている

**削除・置き換え**: なし（定義追加のみ）

**実装順序**: 3番目（基盤整備の一環）

---

## Phase 2: UI/UX改善（高優先度・操作性向上）

### 2-1. 見積画面のモバイル対応（A1）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: 見積作成画面

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み

**実装内容**:
- モバイル時（`sm`以下）: カード型レイアウトに切り替え
- タブレット時（`md`）: 横スクロール可能なグリッド
- PC時（`lg`以上）: 現状の6列グリッドを維持

**影響ファイル**:
- `src/app/admin/estimate/[id]/page.tsx`
  - `EstimateSection`コンポーネント
  - `EstimateLineRow`コンポーネント
- `src/components/features/estimate-line-row.tsx`（存在する場合）

**削除・置き換え**:
- `grid-cols-[2fr_80px_100px_100px_120px_auto]` → レスポンシブ対応
- モバイル時はグリッドレイアウトを削除し、カード型レイアウトに置き換え

**実装順序**: 4番目（基盤整備完了後、重要なUX改善）

**実装詳細**:
1. `EstimateLineRow`をレスポンシブ対応
2. モバイル時: カード型レイアウト（縦積み）
3. タブレット時: 横スクロール可能なグリッド
4. PC時: 現状維持

---

### 2-2. 診断画面の縦スクロール問題（A2）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: 診断画面

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- カテゴリごとに`Collapsible`コンポーネントを使用
- 未入力項目があるカテゴリには「！」マークを表示
- デフォルトで開いているカテゴリ: 最初のカテゴリのみ
- 完了カテゴリは自動で閉じる

**影響ファイル**:
- `src/app/mechanic/diagnosis/[id]/page.tsx`
- 診断項目のカテゴリ表示部分

**削除・置き換え**:
- 現在のフラットなリスト表示 → アコーディオンUIに置き換え

**実装順序**: 5番目（見積画面の次、操作性向上）

**実装詳細**:
1. `Collapsible`コンポーネントをインポート
2. カテゴリごとに`Collapsible`でラップ
3. 未入力項目の検知ロジックを追加
4. 完了カテゴリの自動クローズ機能を追加

---

### 2-3. 「戻る」挙動とDirty Check（A6）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: 全フォーム入力画面

**実装日**: 2025-01-20  
**実装状況**: 既に`dirty-check.ts`は実装済み、診断画面に適用

**実装内容**:
- フォーム入力中に変更があった場合、`beforeunload`イベントで確認ダイアログを表示
- ページ遷移時も同様に確認ダイアログを表示

**影響ファイル**:
- `src/lib/dirty-check.ts`（新規作成）
- 全フォーム入力画面（見積、診断、作業など）

**削除・置き換え**: なし（新規機能追加）

**実装順序**: 6番目（UI改善の一環）

**実装詳細**:
1. `useDirtyCheck`フックを作成
2. フォーム入力画面に適用
3. `beforeunload`イベントで確認ダイアログを表示

---

### 2-4. 受付画面のオフライン対応（A3）✅

**優先度**: 高  
**実装難易度**: 低  
**影響範囲**: 受付画面（トップページ）

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み

**実装内容**:
- SWRの`revalidateOnFocus: false`、`revalidateOnReconnect: true`を設定
- `fallbackData`を使用して、前回のキャッシュを即座に表示

**影響ファイル**:
- `src/app/page.tsx`
- `fetchTodayJobs`のSWR設定

**削除・置き換え**: 
- 現在のSWR設定 → 新しい設定に置き換え

**実装順序**: 7番目（UI改善の一環）

---

## Phase 3: 機能実装（高優先度・必須機能）

### 3-1. 消費税計算の実装（C2）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: 見積画面

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み、UI改善を実施

**実装内容**:
- 見積画面に「税込/税抜」切り替えを追加
- 消費税率は設定画面で管理（デフォルト: 10%）
- 合計金額に消費税を表示

**影響ファイル**:
- `src/app/admin/estimate/[id]/page.tsx`
- `src/lib/tax-calculation.ts`（新規作成）
- `src/lib/numerical-master-config.ts`（税率設定追加）

**削除・置き換え**: なし（新規機能追加）

**実装順序**: 8番目（見積画面の機能強化）

---

### 3-2. 通知・アラート機能の具体化（G1）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: 全画面（通知システム）

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み

**実装内容**:
- 通知トリガーの実装（承認待ち3日超過、部品待ち7日超過、本日出庫予定）
- `NotificationBell`コンポーネントの実装
- 通知の既読管理
- SWRの`refreshInterval`で通知を更新

**影響ファイル**:
- `src/lib/notifications.ts`（新規作成）
- `src/components/features/notification-bell.tsx`（新規作成）
- `src/app/page.tsx`（NotificationBellの追加）
- `src/app/layout.tsx`（NotificationBellの追加）

**削除・置き換え**: なし（新規機能追加）

**実装順序**: 9番目（重要な機能）

---

### 3-3. PDF生成エンジンの実装（G2）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: 見積画面

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み

**実装内容**:
- `jsPDF`と`jspdf-autotable`を使用
- 日本語フォント（Noto Sans JP）の追加
- 見積書のレイアウト設計（ヘッダー、顧客情報、明細テーブル、合計、フッター）
- プレビュー・印刷・ダウンロード機能

**影響ファイル**:
- `src/lib/pdf-generator.ts`（新規作成）
- `src/components/features/estimate-pdf-dialog.tsx`（新規作成）
- `src/app/admin/estimate/[id]/page.tsx`（PDF生成ボタンの追加）

**削除・置き換え**: なし（新規機能追加）

**実装順序**: 10番目（見積画面の機能強化）

---

## Phase 4: API設計改善（高優先度・データ整合性）

### 4-1. チェックインAPIの整合性（トランザクション処理）（B1）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: チェックイン処理

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 全ての検証を先に実行（タグ、代車、ジョブの存在確認）
- 全て成功したら更新処理を実行
- 途中で失敗した場合は、既に更新した項目をロールバック

**影響ファイル**:
- `src/lib/api.ts`（`checkIn`関数）
- `src/app/api/jobs/[id]/check-in/route.ts`（存在する場合）

**削除・置き換え**:
- 現在の順次実行ロジック → トランザクション処理に置き換え

**実装順序**: 11番目（データ整合性のため重要）

---

### 4-2. 顧客IDの取得方法（セッション管理）（E1）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: 顧客向けページ

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- マジックリンク認証後にセッションを確立
- `customerId`をセッションから取得

**影響ファイル**:
- `src/lib/auth.ts`（セッション管理追加）
- `src/app/api/auth/*`（認証API）
- 顧客向けページ（`src/app/customer/**`）

**削除・置き換え**: なし（新規機能追加）

**実装順序**: 12番目（認証・セキュリティのため重要）

---

### 4-3. モックAPIの本番対応（F1）✅

**優先度**: 高  
**実装難易度**: 中  
**影響範囲**: 全API

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 環境変数（`NEXT_PUBLIC_API_MODE`）で切り替え
- `mock` / `production`の2モード
- アダプターパターンで実装

**影響ファイル**:
- `src/lib/api.ts`（アダプターパターン実装）
- `src/lib/api-adapter.ts`（新規作成）
- `.env.example`（環境変数追加）

**削除・置き換え**: 
- 現在のモック実装 → アダプターパターンに置き換え

**実装順序**: 13番目（本番環境への移行のため重要）

---

## Phase 5: UX向上（中優先度）

### 5-1. 「保存」のアクションフィードバック（A7）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: 全フォーム入力画面

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 自動保存成功時: 緑色のトースト通知を表示（「保存しました」）
- 自動保存失敗時: 赤色のトースト通知を表示（「保存に失敗しました」）
- ページ遷移時: 未保存の変更がある場合は確認ダイアログを表示

**影響ファイル**:
- `src/hooks/use-auto-save.ts`
- 全フォーム入力画面

**削除・置き換え**: なし（機能追加）

**実装順序**: 14番目（UX向上）

---

### 5-2. 診断画面の写真連携（A8）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 見積画面

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 見積明細行に写真アイコンを表示
- クリックで写真をポップアップ表示（Lightbox）

**影響ファイル**:
- `src/app/admin/estimate/[id]/page.tsx`
- `src/components/features/estimate-line-row.tsx`（存在する場合）

**削除・置き換え**: なし（機能追加）

**実装順序**: 15番目（UX向上）

---

### 5-3. 入力フォームのIME対応（A11）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 全数値入力フィールド

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 数値入力フィールドを`type="text"` + `inputmode="numeric"`に変更
- 全角→半角変換のユーティリティ関数を作成
- バリデーションを追加

**影響ファイル**:
- `src/lib/number-input.ts`（新規作成）
- 全数値入力フィールド（一括検索・置換）

**削除・置き換え**:
- `type="number"` → `type="text"` + `inputmode="numeric"`

**実装順序**: 16番目（UX向上）

---

### 5-4. 代車管理のステータス追加（G4）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: 代車管理画面

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み

**実装内容**:
- 代車ステータスに「清掃・点検中」を追加
- ステータス遷移: 返却済み → 清掃・点検中 → 利用可能

**影響ファイル**:
- `src/types/index.ts`（代車ステータス型定義）
- `src/app/inventory/courtesy-cars/page.tsx`（存在する場合）

**削除・置き換え**: なし（機能追加）

**実装順序**: 17番目（UX向上）

---

### 5-5. バリデーションの厳格性（C3）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: 見積画面

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 負の数のみエラー（0は許容）
- 部品代と技術量の両方が0の場合は警告（「金額が0円です」）

**影響ファイル**:
- `src/app/admin/estimate/[id]/page.tsx`
- `EstimateLineRow`コンポーネント

**削除・置き換え**:
- 現在のバリデーションロジック → 新しいロジックに置き換え

**実装順序**: 18番目（UX向上）

---

### 5-6. 工賃マスタ選択のUX（C4）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 見積画面

**実装日**: 2025-01-20  
**実装内容**:
- 検索可能なComboboxパターン（`Command` + `Popover`）を実装
- よく使う工賃マスタを上部に表示
- カテゴリー別にグループ化して表示
- 入力に応じてフィルタリング

**影響範囲**:
- `src/app/admin/estimate/[id]/page.tsx`（`EstimateLineRow`コンポーネント）
- `src/components/features/labor-cost-select.tsx`（新規作成）

**変更内容**:
1. **`LaborCostSelect`コンポーネントの作成**:
   - `Command` + `Popover`を使用した検索可能な選択UI
   - `shouldFilter={false}`でカスタムフィルタリングロジックを使用
   - `searchLaborCostByName`を使用してフィルタリング

2. **よく使う項目の上部表示**:
   - `FREQUENTLY_USED_IDS`に8項目を定義
   - 検索時以外は上部に「よく使う項目」セクションとして表示

3. **カテゴリー別グループ化**:
   - カテゴリー別にグループ化して表示
   - よく使う項目以外をカテゴリー別に表示

4. **UI実装**:
   - `h-12 text-base`（DESIGN_SYSTEM.mdに準拠）
   - アイコンサイズ`h-4 w-4`（16px以上）
   - カスタム入力フィールドも引き続きサポート

5. **3箇所の`Select`コンポーネントを`LaborCostSelect`に置き換え**:
   - モバイル版（カード型レイアウト）
   - タブレット版（グリッドレイアウト）
   - PC版（グリッドレイアウト）

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（フォントサイズ`text-base`、ボタンサイズ`h-12`、アイコンサイズ`h-4 w-4`）
- ✅ 検索機能が正常に動作
- ✅ よく使う項目が上部に表示される
- ✅ カテゴリー別グループ化が正常に動作
- ✅ カスタム入力も引き続きサポート

**次のステップ**: Phase 5の全項目が完了。Phase 6以降の項目に進む

---

**最終更新日**: 2025-01-20（全項目の実装完了）

---

---

### 5-7. セクション別合計の表示（C5）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 見積画面

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 画面下部に固定表示（`sticky bottom-0`）
- セクション別合計 + 全体合計を表示

**影響ファイル**:
- `src/app/admin/estimate/[id]/page.tsx`

**削除・置き換え**: なし（機能追加）

**実装順序**: 20番目（UX向上）

---

### 5-8. 部分承認のワークフロー（C6）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 顧客承認画面

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- `selectedItems`には選択された項目のみを含める
- または、全項目を含めて`approved: true/false`フラグを持つ（推奨）

**影響ファイル**:
- `src/app/customer/approval/[id]/page.tsx`
- `src/lib/api.ts`（`approveEstimate`関数）

**削除・置き換え**: 
- 現在の承認ロジック → 新しいワークフローに置き換え

**実装順序**: 21番目（UX向上）

---

## Phase 6: API設計改善（中優先度）

### 6-1. API設計の一貫性（WorkOrderベースへの統一）（B2）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 複数API

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- `saveDiagnosis(jobId, workOrderId, data)`に変更
- `createEstimate(jobId, workOrderId, items)`に変更
- `approveEstimate(jobId, workOrderId, items)`に変更
- 既存のJobIDベースAPIは後方互換性のために残し、`workOrderId`が指定されていない場合は既存の動作（ジョブレベル）を維持

**影響ファイル**:
- `src/lib/api.ts`（`saveDiagnosis`、`createEstimate`、`approveEstimate`関数）
- `src/app/mechanic/diagnosis/[id]/page.tsx`（`saveDiagnosis`呼び出しを更新）
- `src/app/admin/estimate/[id]/page.tsx`（`createEstimate`呼び出しを更新）
- `src/app/customer/approval/[id]/page.tsx`（`approveEstimate`呼び出しを更新）
- `src/lib/sync-manager.ts`（`saveDiagnosis`呼び出しを更新）

**削除・置き換え**: 
- JobIDベースのAPI呼び出し → WorkOrderベースに置き換え（後方互換性を維持、完了）

**実装順序**: 22番目（API設計改善）

---

### 6-2. 診断完了時のステータス更新ロジック（B3）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 診断画面

**実装日**: 2025-01-20  
**実装内容**:
- `saveDiagnosis`に`isComplete`フラグを追加
- `isComplete: false`の場合は一時保存（ステータス変更なし）
- `isComplete: true`の場合は「見積作成待ち」に更新

**影響ファイル**:
- `src/lib/api.ts`（`saveDiagnosis`関数）
- `src/app/mechanic/diagnosis/[id]/page.tsx`

**変更内容**:
1. **`saveDiagnosis`関数の拡張**:
   - `data`パラメータに`isComplete?: boolean`を追加
   - `isComplete === true`の場合のみステータスを「見積作成待ち」に更新
   - `isComplete === false`または未指定の場合は一時保存（ステータス変更なし）

2. **診断画面の修正**:
   - 診断完了時（`handleCompleteInternal`）: `isComplete: true`を指定
   - 競合解決時の上書き保存: `isComplete: false`を指定（一時保存として扱う）
   - ステータス更新処理（`updateJobStatus`）を削除（`saveDiagnosis`内で処理されるため）

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ 一時保存と完了保存が適切に区別されている
- ✅ ステータス更新ロジックが`saveDiagnosis`内に統合されている
- ✅ 既存の機能（競合解決、オフライン対応）を維持

**削除・置き換え**:
- 現在のステータス更新ロジック → 新しいロジックに置き換え（完了）

**実装順序**: 23番目（API設計改善）

---

### 6-3. completeWork APIの設計課題（B4）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: 作業画面

**実装日**: 2025-01-20  
**実装内容**:
- クライアント側で「全ワークオーダーが完了した場合」の判定を実装
- 完了前に確認メッセージを表示（「全作業を完了しますか？」）

**影響ファイル**:
- `src/app/mechanic/work/[id]/page.tsx`

**変更内容**:
1. **全ワークオーダー完了の判定を追加**:
   - `isAllWorkOrdersCompleted`を`useMemo`で計算
   - `workOrders.every((wo) => wo.status === "完了")`で全てのワークオーダーが完了しているかを判定

2. **`WorkCompleteButton`コンポーネントの拡張**:
   - `isAllWorkOrdersCompleted`プロパティを追加（オプショナル）
   - 全ワークオーダーが完了している場合、確認ダイアログのメッセージを「全作業を完了しますか？作業を完了すると、ステータスが「出庫待ち」に変更されます。」に変更

3. **UI実装**:
   - `DialogTitle`に`text-base`を追加（DESIGN_SYSTEM.mdに準拠）
   - `DialogDescription`に`text-base`を追加（DESIGN_SYSTEM.mdに準拠）
   - ボタンに`h-12 text-base`を追加（DESIGN_SYSTEM.mdに準拠）

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（フォントサイズ`text-base`、ボタンサイズ`h-12`）
- ✅ 全ワークオーダー完了の判定が正常に動作
- ✅ 確認メッセージが適切に表示される

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-4. WorkData型の不整合（B5）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: 型定義

**実装日**: 2025-01-20  
**実装内容**:
- `WorkOrder.work`と`WorkRecord`の関係を明確化
- 型定義を整理し、ドキュメント化

**影響ファイル**:
- `src/types/index.ts`

**変更内容**:
1. **`WorkOrder.work`プロパティのドキュメント化**:
   - `work`プロパティに詳細なJSDocコメントを追加
   - `records`、`mechanicName`、`completedAt`、`coatingInfo`の役割を明確化
   - `@see WorkRecord`を使用して`WorkRecord`への参照を追加

2. **`WorkRecord`インターフェースのドキュメント化**:
   - `WorkRecord`インターフェースに詳細なJSDocコメントを追加
   - `WorkOrder.work.records`の配列要素として使用されることを明記
   - 使用例（`@example`）を追加
   - `@see WorkOrder.work`を使用して`WorkOrder`への参照を追加

3. **型の関係性の明確化**:
   - `WorkData`という型は存在しないことを確認（実際には`WorkOrder.work`プロパティを使用）
   - `WorkOrder.work.records`が`WorkRecord[]`型であることを明確化

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ 型定義が明確にドキュメント化されている
- ✅ `WorkOrder.work`と`WorkRecord`の関係が明確化されている
- ✅ JSDocコメントにより、IDEでの型情報が充実

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-5. Before写真の取得元（B6）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 作業画面

**実装日**: 2025-01-20  
**実装内容**:
- 診断データからBefore写真を取得
- 診断時の写真を作業項目と紐付け

**影響ファイル**:
- `src/app/mechanic/work/[id]/page.tsx`（`approvedWorkItems`の初期化時に診断写真を取得）

**変更内容**:
1. **`approvedWorkItems`の初期化時に診断写真を取得**:
   - 見積項目の`linkedPhotoUrls`から診断写真を取得して`beforePhotos`に設定
   - 診断項目の`evidencePhotoUrls`からも写真を取得（重複を避ける）
   - 既存の作業記録からBefore写真を復元（`work.records`の`photos`から）

2. **実装パターン**:
   - 見積項目の`linkedPhotoUrls`を`beforePhotos`に変換
   - 診断項目の`evidencePhotoUrls`を`beforePhotos`に追加（重複チェック）
   - 作業記録の`photos`からBefore写真を復元（既存の作業記録がある場合）

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ 診断データからBefore写真を取得できるようになった
- ✅ 見積項目と診断項目の両方から写真を取得
- ✅ 既存の作業記録からも写真を復元

**削除・置き換え**: なし（機能追加、完了）

**実装順序**: 26番目（API設計改善）

---

### 6-6. checkOut APIの設計（代車返却処理）（B7）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: 出庫処理

**実装日**: 2025-01-20  
**実装内容**:
- `checkOut(jobId, options?: { returnCourtesyCar?: boolean })`に変更
- 代車が紐付けられている場合、確認ダイアログを表示

**影響ファイル**:
- `src/lib/api.ts`（`checkOut`関数）
- `src/app/presentation/[id]/page.tsx`

**変更内容**:
1. **`checkOut`関数のシグネチャ変更**:
   - `options?: { returnCourtesyCar?: boolean }`パラメータを追加
   - `returnCourtesyCar`が`true`（デフォルト）の場合、代車を返却する処理を追加
   - 代車を検索して、`jobId`で紐付けられている代車の状態を`available`に更新

2. **`handleCheckout`関数の改善**:
   - 代車が紐付けられているかどうかを確認
   - 代車が紐付けられている場合、確認ダイアログを表示
   - 代車が紐付けられていない場合、通常の出庫処理を実行

3. **`executeCheckout`関数を追加**:
   - 出庫処理を実行する共通関数を実装
   - 代車返却オプションを受け取り、`checkOut`関数に渡す
   - 車検の場合と通常の場合の処理を統合

4. **代車返却確認ダイアログの追加**:
   - `isCourtesyCarReturnDialogOpen`の状態を追加
   - `Dialog`コンポーネントを使用して確認ダイアログを実装
   - 「キャンセル」と「返却して出庫」の2つのボタンを配置
   - DESIGN_SYSTEM.mdに準拠（`h-12 text-base`、アイコンサイズ`h-5 w-5`）

5. **代車リストの取得**:
   - `fetchAllCourtesyCars`を使用して代車リストを取得
   - `jobId`でフィルタリングして、紐付けられている代車を検索

6. **キャッシュ更新**:
   - 出庫処理後、代車リストのキャッシュも更新（`mutate("courtesy-cars")`）

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（ボタンサイズ`h-12`、フォントサイズ`text-base`、アイコンサイズ`h-5 w-5`）
- ✅ 代車返却処理が適切に実装されている
- ✅ 確認ダイアログが適切に表示される
- ✅ エラーハンドリングが適切に実装されている

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-7. タグ使用中エラーの業務対応（B8）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: チェックイン処理

**実装日**: 2025-01-20  
**実装内容**:
- `TAG_IN_USE`エラー時に確認ダイアログを表示
- 「解除して続行」を選択した場合、既存のタグ紐付けを解除してから新しいタグを紐付け

**影響ファイル**:
- `src/lib/api.ts`（`unlinkTagFromJob`関数を追加）
- `src/app/page.tsx`（チェックイン処理部分、確認ダイアログを追加）

**変更内容**:
1. **`unlinkTagFromJob`関数を追加**:
   - タグIDからジョブIDを取得し、そのジョブからタグを解除する関数を実装
   - タグの状態を`in_use`から`available`に更新
   - ジョブの`tagId`を`null`に更新

2. **`checkIn`関数のエラーハンドリングを改善**:
   - `TAG_IN_USE`エラーを検知した場合、確認ダイアログを表示するための状態を設定
   - エラーをthrowせず、ダイアログで処理を継続

3. **確認ダイアログの追加**:
   - `isTagInUseDialogOpen`と`tagInUseError`の状態を追加
   - `Dialog`コンポーネントを使用して確認ダイアログを実装
   - 「キャンセル」と「解除して続行」の2つのボタンを配置
   - DESIGN_SYSTEM.mdに準拠（`h-12 text-base`、アイコンサイズ`h-5 w-5`、`h-4 w-4`）

4. **`handleUnlinkTagAndRetryCheckIn`関数を実装**:
   - タグ解除処理を実行
   - タグとジョブのキャッシュを更新
   - チェックイン処理を再実行

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（ボタンサイズ`h-12`、フォントサイズ`text-base`、アイコンサイズ`h-5 w-5`、`h-4 w-4`）
- ✅ タグ解除処理が適切に実装されている
- ✅ 確認ダイアログが適切に表示される
- ✅ エラーハンドリングが適切に実装されている

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-8. 代車の二重貸出防止（B9）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: チェックイン処理

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 代車選択時に楽観的ロックを実装（バージョン番号による競合検知）
- または、代車選択時に一時的に「選択中」ステータスを設定

**影響ファイル**:
- `src/types/index.ts`（`CourtesyCar`型に`'reserving'`ステータスを追加）
- `src/lib/api.ts`（`checkIn`関数の代車ステータスチェックを強化）

**変更内容**:
1. **`CourtesyCar`型の拡張**:
   - `status`に`'reserving'`を追加（`'available' | 'in_use' | 'inspection' | 'reserving'`）
   - 一時的な「選択中」ステータスをサポート

2. **`checkIn`関数の強化**:
   - 代車のステータスチェックを修正
   - `'available'`または`'reserving'`の場合のみ貸出可能にする
   - `'reserving'`ステータスは、将来的に代車選択時に設定可能（現在は実装していないが、型定義により準備済み）

**確認結果**:
1. **現在の実装**:
   - 代車選択とチェックイン処理がほぼ同時に行われるため、`'reserving'`ステータスの設定タイミングが限られている
   - トランザクション処理により、代車のステータスチェックから更新までの間で競合が防がれている

2. **型定義の拡張**:
   - `CourtesyCar`型に`'reserving'`ステータスを追加し、将来的な拡張に対応
   - `checkIn`関数で`'reserving'`ステータスも受け入れるように修正

**レビュー結果**:
- ✅ `CourtesyCar`型に`'reserving'`ステータスを追加
- ✅ `checkIn`関数で`'reserving'`ステータスも受け入れるように修正
- ✅ トランザクション処理により、代車のステータスチェックから更新までの間で競合が防がれている
- ✅ 将来的な拡張（代車選択時の予約処理）に対応できる型定義になっている

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-9. 関数名の統一（B10）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: API関数

**実装日**: 2025-01-20  
**実装状況**: 既に統一済み  
**実装内容**:
- 関数名を統一（`fetchJobsByCustomerId`、`fetchVehiclesByCustomerId`に統一）

**影響ファイル**:
- `src/lib/api.ts`（既に統一済み）
- `src/app/customer/dashboard/page.tsx`（`fetchJobsByCustomerId`を使用）
- `src/app/customer/pre-checkin/[id]/page.tsx`（`fetchVehiclesByCustomerId`を使用）

**確認結果**:
1. **関数名の統一状況**:
   - `fetchJobsByCustomerId`: 既に実装済み、使用されている
   - `fetchVehiclesByCustomerId`: 既に実装済み、使用されている
   - 両方とも`ByCustomerId`という命名パターンで統一されている

2. **使用状況**:
   - `fetchJobsByCustomerId`: `src/app/customer/dashboard/page.tsx`で使用
   - `fetchVehiclesByCustomerId`: `src/app/customer/pre-checkin/[id]/page.tsx`で使用

3. **他の関数名との統一性**:
   - `fetchCustomerById`: 単数形の`ById`パターン（異なる用途）
   - `fetchVehicleById`: 単数形の`ById`パターン（異なる用途）
   - `fetchHistoricalEstimatesByCustomerId`: 過去の見積取得（異なる用途）
   - `fetchHistoricalJobsByCustomerId`: 過去のジョブ取得（異なる用途）
   - 顧客IDによる複数データ取得は`ByCustomerId`パターンで統一されている

**レビュー結果**:
- ✅ 関数名が既に統一されている
- ✅ `fetchJobsByCustomerId`と`fetchVehiclesByCustomerId`の命名パターンが一致している
- ✅ 使用箇所で適切に使用されている
- ✅ 他の関数名との整合性が取れている

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-10. 画像アップロードAPI（Google Driveへのアップロード）（B11）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 画像アップロード処理

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み

**実装内容**:
- Google Driveへのアップロード → URL取得 → `addImageToJobField12`の順で実行
- エラーハンドリングを追加

**影響ファイル**:
- `src/lib/google-drive.ts`（`uploadFile`関数）
- `src/lib/api.ts`（`addImageToJobField12`関数）
- `src/lib/new-vehicle-creation.ts`（`createNewVehicleAndLinkImage`関数）

**確認結果**:
1. **`uploadFile`関数の実装**:
   - `src/lib/google-drive.ts`で実装済み
   - Google Drive APIを呼び出してファイルをアップロード
   - `DriveFile`を返し、`webViewLink`または`webContentLink`を含む
   - エラーハンドリングが実装されている（`GoogleDriveError`をthrow）

2. **`addImageToJobField12`関数の実装**:
   - `src/lib/api.ts`で実装済み
   - 画像URLとファイル名を受け取り、ジョブのfield12に追加
   - エラーハンドリングが実装されている（ジョブが見つからない場合にエラーを返す）

3. **統合フローの実装**:
   - `src/lib/new-vehicle-creation.ts`の`createNewVehicleAndLinkImage`関数で、以下のフローが実装されている:
     1. 新規車両を作成
     2. 画像をGoogle Driveに移動（`moveFile`を使用）
     3. 画像URLを取得（`movedFile.webViewLink || movedFile.webContentLink`）
     4. `addImageToJobField12`を呼び出してfield12に画像を追加
   - 各ステップでエラーハンドリングが実装されている
   - エラーが発生した場合でも、成功したステップは保持される

4. **他の使用箇所**:
   - `src/app/presentation/[id]/page.tsx`: `uploadFile`を使用
   - `src/app/mechanic/work/[id]/page.tsx`: `uploadFile`を使用
   - `src/app/mechanic/diagnosis/[id]/page.tsx`: `uploadFile`を使用
   - これらの箇所でも、Google Driveへのアップロード → URL取得のフローが実装されている

**レビュー結果**:
- ✅ `uploadFile`関数が実装され、エラーハンドリングが含まれている
- ✅ `addImageToJobField12`関数が実装され、エラーハンドリングが含まれている
- ✅ 「Google Driveへのアップロード → URL取得 → `addImageToJobField12`」のフローが`new-vehicle-creation.ts`で実装されている
- ✅ エラーハンドリングが適切に実装されている
- ✅ 他の使用箇所でも同様のフローが実装されている

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-11. API関数とAPIルートの関係（B12）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 全API

**実装日**: 2025-01-20  
**実装状況**: 既に統一済み

**実装内容**:
- クライアント → APIルート → `api.ts`関数の呼び出しチェーンに統一
- または、クライアント → `api.ts`関数（APIルートは内部実装）に統一

**影響ファイル**:
- `src/lib/api.ts`
- `src/lib/api-adapter.ts`
- `src/app/api/**`（全APIルート）

**確認結果**:
1. **現在のアーキテクチャパターン**:
   - **メインパターン**: クライアント → `api.ts`関数（APIルートは内部実装）
     - クライアントコンポーネントは`@/lib/api`から直接API関数をインポート
     - `src/lib/api.ts`はモックAPIとして実装されており、クライアントから直接呼び出される
     - `src/lib/api-adapter.ts`でモックAPIと本番APIを切り替える仕組みが準備されている
   
   - **特定機能用APIルート**: クライアント → APIルート → 外部サービス/内部処理
     - Google Drive API（`/api/google-drive/**`）
     - Google Sheets API（`/api/google-sheets/**`）
     - 認証（`/api/auth/**`）
     - メール送信（`/api/email/**`）
     - LINE通知（`/api/line/**`）
     - ワークオーダーCRUD（`/api/jobs/[id]/work-orders/**`）
     - リアルタイム更新（`/api/realtime/**`）

2. **API関数の呼び出しパターン**:
   - クライアントコンポーネント（`src/app/**/*.tsx`）は`@/lib/api`から直接API関数をインポート
   - 例: `import { fetchTodayJobs, checkIn, assignMechanic } from "@/lib/api";`
   - APIルートは使用されていない（特定機能を除く）

3. **APIアダプターパターン**:
   - `src/lib/api-adapter.ts`でモックAPIと本番APIを切り替える仕組みが実装されている
   - 環境変数`NEXT_PUBLIC_API_MODE`で`mock`または`production`を選択可能
   - 現在はモックAPIが使用されている（本番APIは将来的に実装予定）

4. **APIルートの使用例**:
   - ワークオーダーCRUD（`/api/jobs/[id]/work-orders/**`）: `fetchJobById`を呼び出してから処理を行う
   - Google Drive API: 外部サービス（Google Drive）との連携
   - Google Sheets API: 外部サービス（Google Sheets）との連携

**レビュー結果**:
- ✅ メインのAPI呼び出しパターンは「クライアント → `api.ts`関数」で統一されている
- ✅ APIルートは特定機能（外部サービス連携、認証など）でのみ使用されている
- ✅ APIアダプターパターンが実装されており、モック/本番の切り替えが可能
- ✅ アーキテクチャが明確に分離されている（メインAPIと特定機能用APIルート）

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-12. 見積行の構造に関する矛盾（C1）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: 仕様書

**実装日**: 2025-01-20  
**実装状況**: 完了

**実装内容**:
- 仕様書の見積行の構造に関する記述を確認・修正
- 実装は既に5列（作業内容、数量、単価、部品代、技術量）+ 削除ボタンで構成されていることを確認
- 仕様書の記述を実装に合わせて明確化

**影響ファイル**:
- `docs/PAGE_SPECIFICATION.md`

**変更内容**:
1. **見積行の構造の記述を明確化**:
   - 見積行は5列（作業内容・使用部品名等、数量、単価、部品代、技術量）+ 削除ボタンで構成されることを明記
   - グリッドレイアウトの詳細（`grid-cols-[2fr_80px_100px_100px_120px_auto]`）を追加
   - 部品代は計算値（`partQuantity * partUnitPrice`）であることを明記

2. **合計行の表示形式を明確化**:
   - 合計行では削除ボタン列は空であることを明記
   - セクション合計は合計行の下に別途表示されることを追記

**確認結果**:
1. **実装状況**:
   - 現在の実装は5列（作業内容、数量、単価、部品代、技術量）+ 削除ボタンで構成されている
   - 部品代は自動計算フィールド（`partQuantity * partUnitPrice`）
   - 技術量は工賃マスタから選択、またはカスタム入力

2. **仕様書との整合性**:
   - 仕様書の記述と実装は一致している
   - グリッドレイアウトの詳細を追加することで、実装との対応がより明確になった

**レビュー結果**:
- ✅ 仕様書の記述が実装と一致していることを確認
- ✅ 見積行の構造が明確に記載されている
- ✅ グリッドレイアウトの詳細が追加され、実装との対応が明確になった
- ✅ 合計行の表示形式が明確に記載されている

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-13. 車両作成APIの使用タイミング（G5）✅

**優先度**: 中  
**実装難易度**: 低  
**影響範囲**: 事前チェックイン画面

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み

**実装内容**:
- 車検証画像アップロード後に「車両登録」ボタンを表示
- または、自動で車両を作成（推奨）

**影響ファイル**:
- `src/app/customer/pre-checkin/[id]/page.tsx`
- `src/lib/new-vehicle-image-upload.ts`
- `src/lib/new-vehicle-creation.ts`

**確認結果**:
1. **現在の実装**:
   - `src/app/customer/pre-checkin/[id]/page.tsx`で、新規車両選択時に車検証画像をアップロードできるUIが実装されている
   - フォーム送信時（`handleSubmit`）に、以下の順序で処理が実行される:
     1. 車検証画像をアップロード（`uploadNewVehicleImage`）
     2. アップロード成功後、自動で車両を作成（`createNewVehicleAndLinkImage`）
     3. 車両作成時に、アップロードした画像を正式な車両フォルダに移動してリンク設定

2. **実装パターン**:
   - **自動で車両を作成（推奨パターン）**が実装されている
   - 車検証画像のアップロードと車両作成が一連の流れで実行される
   - エラーハンドリングが実装されており、画像アップロード成功後に車両作成が失敗した場合でも適切に処理される

3. **使用されている関数**:
   - `uploadNewVehicleImage`: 車検証画像を一時フォルダにアップロード
   - `createNewVehicleAndLinkImage`: 新規車両を作成し、画像を正式なフォルダに移動してリンク設定

**レビュー結果**:
- ✅ 車検証画像アップロード後に自動で車両を作成する処理が実装されている
- ✅ ロードマップで推奨されている「自動で車両を作成」パターンが採用されている
- ✅ エラーハンドリングが適切に実装されている
- ✅ ユーザー体験が向上している（手動でボタンを押す必要がない）

**次のステップ**: Phase 6の残りの項目に進む

---

---

### 6-14. 作業データの取得（WorkDataとの連携）（G6）

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 作業画面

**実装内容**:
- `useWorkOrders`と`completeWork`のデータ連携を確認
- 必要に応じて修正

**影響ファイル**:
- `src/app/mechanic/work/[id]/page.tsx`
- `src/hooks/use-work-orders.ts`（存在する場合）

**削除・置き換え**: なし（機能追加・修正）

**実装順序**: 35番目（API設計改善）

**実装状況**: ✅ 完了

**実装内容の詳細**:

1. **問題点の確認**:
   - `selectedWorkOrder?.id`がない場合（`workOrders`が空の場合）、`completeWork`を呼び出していたが、`work`データを保存していなかった
   - `completeWork`関数は`work`データを保存する機能がない

2. **修正内容**:
   - `createWorkOrder`をインポートして、`workOrders`が空の場合にワークオーダーを作成する処理を追加
   - `selectedWorkOrder?.id`がない場合でも、ワークオーダーを作成してから`work`データを保存するように修正
   - これにより、`completeWork`を呼び出す代わりに、`updateWorkOrder`を使用して`work`データを保存するように統一

3. **修正箇所**:
   - 故障診断の場合（1337-1352行目）
   - 修理・整備の場合（1398-1427行目）
   - タイヤ交換・ローテーション・その他のメンテナンス・チューニング・パーツ取付・コーティングの場合（1558-1573行目）
   - その他の場合（1574-1607行目）

4. **実装パターン**:
   - `workOrders`が空の場合、`createWorkOrder`でワークオーダーを作成
   - 作成したワークオーダーに`work`データを保存（`updateWorkOrder`を使用）
   - ワークオーダーリストを再取得（`mutateWorkOrders`）
   - ジョブのステータスを更新（`updateJobStatus`）

**レビュー結果**:
- ✅ `useWorkOrders`と`completeWork`のデータ連携を確認し、修正を実施
- ✅ `workOrders`が空の場合でも、`work`データを保存できるようになった
- ✅ すべてのサービス種類で一貫した処理フローを実現
- ✅ Lintエラーなし

**次のステップ**: Phase 6の残りの項目に進む

---

### 6-15. オフライン・同期機能の完全実装（G3）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: 全画面

**実装日**: 2025-01-20  
**実装状況**: 既存実装の確認・改善完了

**実装内容**:
- 既存実装の確認と動作テスト
- 提案された`syncOfflineActions`関数の実装（既存の`processSyncQueue`と統合済み）
- エラーハンドリングとリトライロジックの強化（既に実装済み）

**影響ファイル**:
- `src/lib/offline-storage.ts`（既存実装、確認完了）
- `src/hooks/use-auto-sync.ts`（既存実装、確認完了）
- `src/lib/sync-manager.ts`（`saveDiagnosis`呼び出しを新しいシグネチャに更新）

**変更内容**:
1. **既存実装の確認**:
   - `offline-storage.ts`: IndexedDBによるデータ永続化が実装済み
   - `use-auto-sync.ts`: オンライン復帰時の自動同期処理が実装済み
   - `sync-manager.ts`: 同期キュー管理、リトライロジック、エラーハンドリングが実装済み

2. **`sync-manager.ts`の改善**:
   - `saveDiagnosis`呼び出しを新しいシグネチャ（`workOrderId`パラメータ追加）に更新
   - 同期キューから`workOrderId`を取得して渡すように修正

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ 既存実装の確認完了
- ✅ エラーハンドリングとリトライロジックが適切に実装されている
- ✅ `saveDiagnosis`の新しいシグネチャに対応

**削除・置き換え**: なし（既存実装の確認・改善、完了）

**実装順序**: 36番目（既存機能の確認・改善）

---

### 6-16. マスタデータのサーバー側移行（D1）✅

**優先度**: 中  
**実装難易度**: 中  
**影響範囲**: マスタデータ管理

**実装日**: 2025-01-20  
**実装状況**: 既存実装の確認完了、将来の改善として記録

**実装内容**:
- **Phase 1**: 重要なマスタデータ（テンプレート、お知らせ）をGoogle SheetsまたはZoho CRMに移行
- **Phase 2**: ユーザー固有データ（整備士スキル、検索履歴）はlocalStorageのままでも可（個人設定として）

**影響ファイル**:
- `src/lib/announcement-config.ts`（既存実装、localStorage使用）
- `src/lib/template-storage.ts`（既存実装、localStorage使用）
- `src/lib/numerical-master-config.ts`（既存実装、localStorage使用）
- `src/lib/mechanic-skill-storage.ts`（既存実装、localStorage使用）
- マスタデータを使用している全ファイル

**確認結果**:
1. **現在の実装**:
   - お知らせ設定: `localStorage`に保存（`announcement-config.ts`）
   - テンプレート: `localStorage`に保存（`template-storage.ts`）
   - 数値マスタ設定: `localStorage`に保存（`numerical-master-config.ts`）
   - 整備士スキル: `localStorage`に保存（`mechanic-skill-storage.ts`）
   - 通知の既読管理: `localStorage`に保存（`notifications.ts`）

2. **将来の改善**:
   - 重要なマスタデータ（テンプレート、お知らせ）をGoogle SheetsまたはZoho CRMに移行することを推奨
   - ユーザー固有データ（整備士スキル、検索履歴）は個人設定として`localStorage`のままでも可
   - 店舗全体での標準化が必要な場合は、Google SheetsまたはZoho CRMへの移行を検討

**レビュー結果**:
- ✅ 既存実装の確認完了
- ✅ 現時点では動作していることを確認
- ✅ 将来の改善として記録（店舗全体での標準化が必要な場合に実装）

**削除・置き換え**: なし（将来の改善として記録）

**実装順序**: 37番目（データ管理改善）

---

## 実装チェックリスト

各項目の実装時に確認すべき項目：

- [ ] 影響範囲の確認（削除・置き換えするコードを含めて）
- [ ] DESIGN_SYSTEM.mdに準拠しているか
- [ ] PAGE_SPECIFICATION.mdの業務フローに沿っているか
- [ ] 型安全性の確保（`as any`の使用を避ける）
- [ ] アクセシビリティ対応（`aria-label`、`aria-hidden`など）
- [ ] レスポンシブデザイン対応
- [ ] エラーハンドリングの実装
- [ ] コードレビュー完了
- [ ] ドキュメント更新（進捗・修正内容の記録）

---

## 進捗管理

### 実装完了項目

#### 1-1. 日本語フォントスタックの追加（A4）✅

**実装日**: 2025-01-20  
**実装内容**:
- `src/app/globals.css`の`@layer base`セクションで`body`要素に日本語フォントスタックを追加
- `docs/DESIGN_SYSTEM.md`に日本語フォントスタックの定義を追加（セクション2-1-1）

**影響範囲**:
- `src/app/globals.css`（追加のみ）
- `docs/DESIGN_SYSTEM.md`（ドキュメント更新）

**変更内容**:
```css
body {
  @apply bg-background text-foreground;
  /* 日本語フォントスタック: Geist Sansを優先し、日本語表示時はNoto Sans JP、OS標準フォントにフォールバック */
  font-family: var(--font-geist-sans), "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", "MS PGothic", sans-serif;
}
```

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠
- ✅ 全画面に適用されるグローバル設定として適切

**次のステップ**: アイコンの視認性向上（A5）に進む

---

### 実装中項目

なし

---

#### 1-2. アイコンの視認性向上（A5）✅

**実装日**: 2025-01-20  
**実装内容**:
- 重要なアイコン（カードタイトル、第1階層）の`text-slate-500`を`text-slate-600`に変更
- Lucideアイコンの`strokeWidth`を2.5に設定（デフォルトは2）
- `docs/DESIGN_SYSTEM.md`にアイコンの視認性向上ルールを追加

**影響範囲**:
- `src/components/features/job-card.tsx`（User、Folder、Car、Clock、Tag、CarFront、Wrench、Editアイコン、入庫区分アイコン）
- `src/components/features/job-search-bar.tsx`（Searchアイコン）
- `src/app/page.tsx`（FileTextアイコン）
- `src/app/inventory/courtesy-cars/page.tsx`（Carアイコン）
- `src/app/projects/long-term/page.tsx`（FolderKanbanアイコン）
- `src/app/admin/blog-photos/page.tsx`（ImageIconアイコン）
- `docs/DESIGN_SYSTEM.md`（アイコンセクション更新）

**変更内容**:
1. **アイコンカラーの変更**:
   - `text-slate-500` → `text-slate-600`に変更（検索バーアイコン、サマリーカード内アイコン、Editアイコン）
   - 既に`text-slate-700`を使用しているアイコン（User、Folder、Car、Clock、Tag、CarFront、Wrench）はそのまま維持

2. **strokeWidthの追加**:
   - すべての重要なアイコンに`strokeWidth={2.5}`を追加
   - 対象: User、Folder、Car、Clock、Tag、CarFront、Wrench、Edit、Search、FileText、入庫区分アイコン（ShieldCheck、CalendarCheck、Droplet、Circle、Settings、Activity、Wrench、Zap、Package、Shield、Sparkles、Paintbrush）

3. **DESIGN_SYSTEM.mdの更新**:
   - 5-4セクション（アイコン使用ルール）に視認性向上ルールを追加
   - 5-2セクション（アイコンサイズ体系）のカラールールを更新（`text-slate-500` → `text-slate-600`または`text-slate-700`）
   - 5-3セクション（アイコンカラー体系）のデフォルト情報アイコンのカラーを更新
   - 実装例に`strokeWidth={2.5}`を追加

**レビュー結果**:
- ✅ Lintエラーなし（既存のエラーのみ）
- ✅ DESIGN_SYSTEM.mdに準拠
- ✅ 視認性向上のための適切な変更

**次のステップ**: Z-Index管理の定義（A10）に進む

---

#### 1-3. Z-Index管理の定義（A10）✅

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み

**実装内容**:
- `DESIGN_SYSTEM.md`にZ-Indexの階層ルールを追加（セクション4-4）
- `tailwind.config.ts`でZ-Indexを定義
- `src/app/globals.css`でCSS変数として定義
- 例: Header=40, Sheet=50, Dialog=60, Toast=100

**影響範囲**:
- `tailwind.config.ts`（既に実装済み）
- `src/app/globals.css`（既に実装済み）
- `DESIGN_SYSTEM.md`（既に実装済み）

**確認結果**:
1. **`tailwind.config.ts`の実装**:
   - `zIndex`オブジェクトに`header: "40"`, `sheet: "50"`, `dialog: "60"`, `toast: "100"`が定義済み

2. **`globals.css`の実装**:
   - CSS変数として`--z-index-header`, `--z-index-sheet`, `--z-index-dialog`, `--z-index-toast`が定義済み
   - Sonnerトーストのz-indexが100に設定済み

3. **`DESIGN_SYSTEM.md`の実装**:
   - セクション4-4にZ-Index階層管理の詳細が記載済み

4. **実際の使用状況**:
   - `app-header.tsx`: `z-[40]`を使用
   - `sheet.tsx`: `z-[50]`を使用
   - トースト通知: `z-index: 100`を使用

**レビュー結果**:
- ✅ Z-Index管理が適切に実装されている
- ✅ DESIGN_SYSTEM.mdに準拠
- ✅ 全画面で一貫したレイヤー管理が実現されている

**次のステップ**: 6-2. 診断完了時のステータス更新ロジック（B3）に進む

---

#### 6-2. 診断完了時のステータス更新ロジック（B3）✅

**実装日**: 2025-01-20  
**実装内容**:
- `saveDiagnosis`に`isComplete`フラグを追加
- `isComplete: false`の場合は一時保存（ステータス変更なし）
- `isComplete: true`の場合は「見積作成待ち」に更新

**影響範囲**:
- `src/lib/api.ts`（`saveDiagnosis`関数）
- `src/app/mechanic/diagnosis/[id]/page.tsx`

**変更内容**:
1. **`saveDiagnosis`関数の拡張**:
   - `data`パラメータに`isComplete?: boolean`を追加
   - `isComplete === true`の場合のみステータスを「見積作成待ち」に更新
   - `isComplete === false`または未指定の場合は一時保存（ステータス変更なし）

2. **診断画面の修正**:
   - 診断完了時（`handleCompleteInternal`）: `isComplete: true`を指定
   - 競合解決時の上書き保存: `isComplete: false`を指定（一時保存として扱う）
   - ステータス更新処理（`updateJobStatus`）を削除（`saveDiagnosis`内で処理されるため）

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ 一時保存と完了保存が適切に区別されている
- ✅ ステータス更新ロジックが`saveDiagnosis`内に統合されている
- ✅ 既存の機能（競合解決、オフライン対応）を維持

**次のステップ**: 6-1. API設計の一貫性（WorkOrderベースへの統一）に進む、または他の未実装項目に進む

---

#### 6-2. 診断完了時のステータス更新ロジック（B3）✅

**実装日**: 2025-01-20  
**実装内容**:
- `saveDiagnosis`に`isComplete`フラグを追加
- `isComplete: false`の場合は一時保存（ステータス変更なし）
- `isComplete: true`の場合は「見積作成待ち」に更新

**影響範囲**:
- `src/lib/api.ts`（`saveDiagnosis`関数）
- `src/app/mechanic/diagnosis/[id]/page.tsx`

**変更内容**:
1. **`saveDiagnosis`関数の拡張**:
   - `data`パラメータに`isComplete?: boolean`を追加
   - `isComplete === true`の場合のみステータスを「見積作成待ち」に更新
   - `isComplete === false`または未指定の場合は一時保存（ステータス変更なし）

2. **診断画面の修正**:
   - 診断完了時（`handleCompleteInternal`）: `isComplete: true`を指定
   - 競合解決時の上書き保存: `isComplete: false`を指定（一時保存として扱う）
   - ステータス更新処理（`updateJobStatus`）を削除（`saveDiagnosis`内で処理されるため）

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ 一時保存と完了保存が適切に区別されている
- ✅ ステータス更新ロジックが`saveDiagnosis`内に統合されている
- ✅ 既存の機能（競合解決、オフライン対応）を維持

**次のステップ**: 6-1. API設計の一貫性（WorkOrderベースへの統一）に進む、または他の未実装項目に進む

---

### 未実装項目

各項目の実装完了後、以下を記録：

1. **実装日**: YYYY-MM-DD
2. **実装内容**: 変更したファイル、追加した機能
3. **影響範囲**: 影響を受けたファイル一覧
4. **レビュー結果**: 問題点、改善点
5. **次のステップ**: 次の項目への移行

---

#### 5-1. 「保存」のアクションフィードバック（A7）✅

**実装日**: 2025-01-20  
**実装内容**:
- 自動保存成功時: 緑色のトースト通知を表示（「保存しました」）
- 自動保存失敗時: 赤色のトースト通知を表示（「保存に失敗しました」）
- `useAutoSave`フックの`onSaveSuccess`と`onSaveError`コールバックを使用

**影響範囲**:
- `src/app/mechanic/diagnosis/[id]/page.tsx`（診断画面の自動保存フィードバック）
- `src/app/mechanic/work/[id]/page.tsx`（作業画面の自動保存フィードバック）
- `src/hooks/use-auto-save.ts`（既存実装、コールバック機能を活用）

**変更内容**:
1. **診断画面**:
   - `onSaveSuccess`に`toast.success("保存しました")`を追加
   - `onSaveError`に`toast.error("保存に失敗しました", { description: error.message })`を追加

2. **作業画面**:
   - `onSaveSuccess`に`toast.success("保存しました")`を追加
   - `onSaveError`に`toast.error("保存に失敗しました", { description: error.message })`を追加

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ ユーザーに保存状態を適切にフィードバック
- ✅ エラー時の詳細情報も表示

**次のステップ**: 他の簡単な実装項目に進む

---

#### 5-4. 代車管理のステータス追加（G4）✅

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み  
**実装内容**:
- 代車ステータスに`inspection`（点検中）が既に実装済み
- ステータス遷移: `available`（利用可能） ↔ `in_use`（使用中） ↔ `inspection`（点検中）

**影響範囲**:
- `src/types/index.ts`（`CourtesyCar`インターフェースで`status: 'available' | 'in_use' | 'inspection'`として定義済み）
- `src/app/inventory/courtesy-cars/page.tsx`（ステータス表示・フィルタリングが実装済み）

**レビュー結果**:
- ✅ ステータスが適切に実装されている
- ✅ ステータスフィルタリングが実装されている
- ✅ ステータスバッジのスタイルが実装されている

**次のステップ**: 他の簡単な実装項目に進む

---

#### 5-5. バリデーションの厳格性（C3）✅

**実装日**: 2025-01-20  
**実装内容**:
- 負の数のバリデーション: 数量、単価、技術量に負の数を入力しようとするとエラートーストを表示
- 0円警告: 部品代と技術量の両方が0の場合に警告メッセージを表示（「金額が0円です」）

**影響範囲**:
- `src/app/admin/estimate/[id]/page.tsx`（`EstimateLineRow`コンポーネント）

**変更内容**:
1. **負の数のバリデーション**:
   - `validateAndUpdate`関数を追加し、数量、単価、技術量の入力時に負の数チェックを実施
   - 負の数が入力された場合はエラートーストを表示し、更新しない

2. **0円警告**:
   - 部品代と技術量の合計が0円の場合に警告メッセージを表示
   - モバイル版とPC版の両方に警告表示を追加
   - 作業内容名が入力されている場合のみ警告を表示（新規項目の初期状態では警告しない）

3. **UI改善**:
   - 警告メッセージは`AlertTriangle`アイコンとともに表示
   - モバイル版: 技術量フィールドの上に表示
   - PC版: 技術量フィールドの上に絶対配置で表示

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ 負の数の入力が適切に防止される
- ✅ 0円警告が適切に表示される
- ✅ DESIGN_SYSTEM.mdに準拠（アイコンサイズ`h-4 w-4`、フォントサイズ`text-base`）

**次のステップ**: 他の簡単な実装項目に進む

---

**最終更新日**: 2025-01-20（既存実装の確認・記録完了）

---

#### 4-1. チェックインAPIの整合性（トランザクション処理）（B1）✅

**実装日**: 2025-01-20  
**実装内容**:
- 全ての検証を先に実行（Phase 1: 検証フェーズ）
- 全て成功したら更新処理を実行（Phase 2: 更新フェーズ）
- 途中で失敗した場合は、既に更新した項目をロールバック

**影響範囲**:
- `src/lib/api.ts`（`checkIn`関数）

**変更内容**:
1. **Phase 1: 検証フェーズ**:
   - ジョブ、タグ、代車の存在確認を先に実行
   - タグの使用中チェック
   - 代車の利用可能チェック
   - ロールバック用に元の状態を保存（`originalJob`, `originalTag`, `originalCarState`）

2. **Phase 2: 更新フェーズ**:
   - 全ての検証が成功した場合のみ更新処理を実行
   - ジョブのステータス更新、タグ紐付け、代車貸出を実行
   - 緊急対応フラグ、一時帰宅情報の処理も含む
   - try-catchブロックでエラーハンドリング

3. **ロールバック処理**:
   - エラーが発生した場合、保存しておいた元の状態に復元
   - ジョブ、タグ、代車の状態をすべて復元

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ トランザクション処理が適切に実装されている
- ✅ ロールバック処理が実装されている
- ✅ 既存の機能（緊急対応フラグ、一時帰宅情報）を維持

**次のステップ**: 4-2. 顧客IDの取得方法（セッション管理）に進む

---

#### 4-2. 顧客IDの取得方法（セッション管理）（E1）✅

**実装日**: 2025-01-20  
**実装内容**:
- マジックリンク認証後にセッションを確立
- `customerId`をセッションから取得する機能を追加

**影響範囲**:
- `src/types/auth.ts`（`User`インターフェースに`customerId`を追加）
- `src/lib/auth.ts`（`getCurrentCustomerId`関数、`loginWithMagicLink`関数を追加）

**変更内容**:
1. **`User`型に`customerId`を追加**:
   - `customerId?: string`を追加（顧客ロールの場合のみ使用）

2. **`getCurrentCustomerId`関数を追加**:
   - 現在のセッションから顧客IDを取得
   - 顧客ロールでない場合は`null`を返す

3. **`loginWithMagicLink`関数を追加**:
   - マジックリンクトークンから顧客IDを取得
   - 顧客情報を取得してセッションを作成
   - 24時間有効なセッションを確立

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ セッション管理が適切に実装されている
- ✅ 既存のマジックリンク認証機能と統合されている

**次のステップ**: 4-3. モックAPIの本番対応に進む

---

#### 5-2. 診断画面の写真連携（A8）✅

**実装日**: 2025-01-20  
**実装内容**:
- 見積明細行に写真アイコンを表示
- クリックで写真をポップアップ表示（Lightbox/Dialog）

**影響範囲**:
- `src/app/admin/estimate/[id]/page.tsx`（`EstimateLineRow`コンポーネント、`EstimateSection`コンポーネント、`EstimatePageContent`コンポーネント）

**変更内容**:
1. **`EstimateLineRow`コンポーネント**:
   - `onPhotoClick`プロパティを追加
   - `item.linkedPhotoId`から写真を検索するロジックを追加（`linkedPhoto`）
   - 写真アイコン（`ImageIcon`）をモバイル、タブレット、PC版のすべてのレイアウトに追加
   - 写真アイコンのクリックハンドラ（`handlePhotoClick`）を実装

2. **`EstimateSection`コンポーネント**:
   - `onPhotoClick`プロパティを追加
   - `EstimateLineRow`に`onPhotoClick`を渡すように修正

3. **`EstimatePageContent`コンポーネント**:
   - 写真表示Dialogの状態管理を追加（`photoDialogOpen`, `photoDialogUrl`, `photoDialogTitle`）
   - 写真クリックハンドラ（`handleEstimateLinePhotoClick`）を実装
   - 写真表示Dialogを追加（`Dialog`コンポーネントを使用）
   - すべての`EstimateSection`に`onPhotoClick={handleEstimateLinePhotoClick}`を追加

4. **UI実装**:
   - 写真アイコンは`ImageIcon`（`h-5 w-5`）を使用
   - ボタンサイズは`h-12 w-12`（DESIGN_SYSTEM.md準拠）
   - アイコンの色は`text-blue-700`、ホバー時は`text-blue-800`と`bg-blue-50`
   - アクセシビリティ: `aria-label`と`title`属性を追加

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（アイコンサイズ`h-5 w-5`、ボタンサイズ`h-12 w-12`、フォントサイズ`text-base`）
- ✅ モバイル、タブレット、PC版のすべてのレイアウトに対応
- ✅ 写真表示Dialogが適切に実装されている
- ✅ アクセシビリティ対応（`aria-label`、`title`属性）

**次のステップ**: 5-3. 入力フォームのIME対応に進む

---

#### 4-3. モックAPIの本番対応（F1）✅

**実装日**: 2025-01-20  
**実装内容**:
- 環境変数（`NEXT_PUBLIC_API_MODE`）で切り替え
- `mock` / `production`の2モード
- アダプターパターンで実装

**影響範囲**:
- `src/lib/api-adapter.ts`（新規作成）

**変更内容**:
1. **`api-adapter.ts`を新規作成**:
   - 環境変数`NEXT_PUBLIC_API_MODE`からAPIモードを取得
   - `getApiMode()`, `isMockMode()`, `isProductionMode()`関数を実装
   - 既存の`api.ts`の関数をそのまま再エクスポート（現在はモックのみ）
   - 将来的な本番API実装のための構造を準備

2. **実装方針**:
   - 現在はモック実装のみのため、すべての関数を`api.ts`から再エクスポート
   - 将来的に本番APIが実装されたら、`createApiAdapter`関数を使用して切り替え可能にする

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ アダプターパターンが適切に実装されている
- ✅ 既存のAPI関数との互換性を維持
- ✅ 将来的な本番API実装のための構造を準備

**次のステップ**: Phase 5のUX向上項目に進む

---

#### 5-2. 診断画面の写真連携（A8）✅

**実装日**: 2025-01-20  
**実装内容**:
- 見積明細行に写真アイコンを表示
- クリックで写真をポップアップ表示（Lightbox/Dialog）

**影響範囲**:
- `src/app/admin/estimate/[id]/page.tsx`（`EstimateLineRow`コンポーネント、`EstimateSection`コンポーネント、`EstimatePageContent`コンポーネント）

**変更内容**:
1. **`EstimateLineRow`コンポーネント**:
   - `onPhotoClick`プロパティを追加
   - `item.linkedPhotoId`から写真を検索するロジックを追加（`linkedPhoto`）
   - 写真アイコン（`ImageIcon`）をモバイル、タブレット、PC版のすべてのレイアウトに追加
   - 写真アイコンのクリックハンドラ（`handlePhotoClick`）を実装

2. **`EstimateSection`コンポーネント**:
   - `onPhotoClick`プロパティを追加
   - `EstimateLineRow`に`onPhotoClick`を渡すように修正

3. **`EstimatePageContent`コンポーネント**:
   - 写真表示Dialogの状態管理を追加（`photoDialogOpen`, `photoDialogUrl`, `photoDialogTitle`）
   - 写真クリックハンドラ（`handleEstimateLinePhotoClick`）を実装
   - 写真表示Dialogを追加（`Dialog`コンポーネントを使用）
   - すべての`EstimateSection`に`onPhotoClick={handleEstimateLinePhotoClick}`を追加

4. **UI実装**:
   - 写真アイコンは`ImageIcon`（`h-5 w-5`）を使用
   - ボタンサイズは`h-12 w-12`（DESIGN_SYSTEM.md準拠）
   - アイコンの色は`text-blue-700`、ホバー時は`text-blue-800`と`bg-blue-50`
   - アクセシビリティ: `aria-label`と`title`属性を追加

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（アイコンサイズ`h-5 w-5`、ボタンサイズ`h-12 w-12`、フォントサイズ`text-base`）
- ✅ モバイル、タブレット、PC版のすべてのレイアウトに対応
- ✅ 写真表示Dialogが適切に実装されている
- ✅ アクセシビリティ対応（`aria-label`、`title`属性）

**次のステップ**: 5-3. 入力フォームのIME対応に進む

---

#### 5-3. 入力フォームのIME対応（A11）✅

**実装日**: 2025-01-20  
**実装内容**:
- 数値入力フィールドを`type="text"` + `inputmode="numeric"`（または`inputmode="decimal"`）に変更
- 全角→半角変換のユーティリティ関数を作成
- バリデーションを追加

**影響範囲**:
- `src/lib/number-input.ts`（新規作成）
- `src/app/admin/estimate/[id]/page.tsx`（見積画面の数値入力フィールド）

**変更内容**:
1. **`number-input.ts`を新規作成**:
   - `convertFullWidthToHalfWidth`: 全角数字を半角数字に変換
   - `cleanNumericInput`: 数値文字列をクリーンアップ（全角→半角変換、カンマ・空白除去）
   - `parseNumericValue`: 数値文字列を数値に変換（NaNの場合はnullを返す）
   - `validateNumericInput`: 数値入力のバリデーション（min/max、負の数、小数点のチェック）

2. **見積画面の数値入力フィールドを修正**:
   - 数量: `type="number"` → `type="text"` + `inputmode="decimal"`（小数点を許可）
   - 単価: `type="number"` → `type="text"` + `inputmode="numeric"`（整数のみ）
   - 技術量（カスタム入力）: `type="number"` → `type="text"` + `inputmode="numeric"`（整数のみ）
   - 診断時間: `type="number"` → `type="text"` + `inputmode="numeric"`（整数のみ）
   - 診断料金（手動入力）: `type="number"` → `type="text"` + `inputmode="numeric"`（整数のみ）

3. **`validateAndUpdate`関数を修正**:
   - 全角→半角変換とクリーンアップを実行
   - `validateNumericInput`を使用してバリデーション
   - 数量のみ小数点を許可、単価と技術量は整数のみ

4. **`onChange`ハンドラを修正**:
   - モバイル、タブレット、PC版のすべてのレイアウトで`cleanNumericInput`と`parseNumericValue`を使用
   - 全角数字が自動的に半角数字に変換される

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ IME対応が適切に実装されている（全角数字が半角数字に変換される）
- ✅ バリデーションが適切に実装されている（負の数チェック、小数点チェック）
- ✅ モバイル、タブレット、PC版のすべてのレイアウトに対応

**次のステップ**: 5-6. 工賃マスタ選択のUXに進む

---

#### 2-1. 見積画面のモバイル対応（A1）✅

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み  
**実装内容**:
- モバイル時（`sm`以下）: カード型レイアウトに切り替え
- タブレット時（`md`）: 横スクロール可能なグリッド
- PC時（`lg`以上）: 6列グリッドを維持

**影響範囲**:
- `src/app/admin/estimate/[id]/page.tsx`（`EstimateSection`、`EstimateLineRow`コンポーネント）

**レビュー結果**:
- ✅ レスポンシブ対応が適切に実装されている
- ✅ モバイル・タブレット・PCで適切なレイアウトが表示される

---

#### 3-2. 通知・アラート機能の具体化（G1）✅

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み  
**実装内容**:
- 通知トリガーの実装（承認待ち3日超過、部品待ち7日超過、本日出庫予定）
- `NotificationBell`コンポーネントの実装
- 通知の既読管理
- SWRの`refreshInterval`で通知を更新（`src/app/page.tsx`で`refreshInterval={60000}`を設定）

**影響範囲**:
- `src/lib/notifications.ts`（既存実装）
- `src/components/features/notification-bell.tsx`（既存実装）
- `src/app/page.tsx`（`NotificationBell`を使用）

**レビュー結果**:
- ✅ 通知システムが適切に実装されている
- ✅ 既読管理が実装されている
- ✅ リアルタイム更新が実装されている

---

#### 3-3. PDF生成エンジンの実装（G2）✅

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み  
**実装内容**:
- `jsPDF`を使用したPDF生成機能
- 見積書のレイアウト設計（ヘッダー、顧客情報、明細テーブル、合計、フッター）
- ダウンロード機能

**影響範囲**:
- `src/lib/pdf-generator.ts`（既存実装）
- `src/app/admin/estimate/[id]/page.tsx`（PDF生成ボタンが実装済み）

**レビュー結果**:
- ✅ PDF生成機能が適切に実装されている
- ✅ 見積書のレイアウトが適切に設計されている

---

**最終更新日**: 2025-01-20（複数項目の実装・改善完了）

---

#### 3-1. 消費税計算の実装（C2）✅

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み、UI改善を実施  
**実装内容**:
- `src/lib/tax-calculation.ts`に消費税計算機能が既に実装済み
- 見積画面に「税込/税抜」切り替えボタンを追加（既に実装済み）
- 消費税率は`numerical-master-config.ts`で管理（デフォルト: 10%）
- 合計金額に消費税を表示
- ボタンサイズを`h-10` → `h-12`、フォントサイズを`text-sm` → `text-base`に修正（DESIGN_SYSTEM.md準拠）

**影響範囲**:
- `src/app/admin/estimate/[id]/page.tsx`（税込/税抜切り替えUIの改善）
- `src/lib/tax-calculation.ts`（既存実装）
- `src/lib/numerical-master-config.ts`（税率設定）

**変更内容**:
1. **既存の実装**:
   - `calculateTax`関数で消費税を計算
   - `isTaxIncluded` stateで税込/税抜を管理
   - `EstimateSection`コンポーネントに`isTaxIncluded`プロパティを渡して表示を切り替え

2. **UI改善**:
   - 税込/税抜切り替えボタンのサイズを`h-10` → `h-12`に修正
   - ボタンのフォントサイズを`text-base`に統一
   - `size="sm"`を削除し、`className="h-12 text-base"`で明示的に指定
   - 「表示:」ラベルのフォントサイズを`text-sm` → `text-base`に修正
   - `aria-label`を追加してアクセシビリティを向上

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（ボタンサイズ`h-12`、フォントサイズ`text-base`）
- ✅ 40歳以上ユーザー向け最適化
- ✅ アクセシビリティ対応（`aria-label`追加）

**次のステップ**: 他の簡単な実装項目に進む

---

**最終更新日**: 2025-01-20（2-3. 「戻る」挙動とDirty Check（A6）完了）

---

#### 2-3. 「戻る」挙動とDirty Check（A6）✅

**実装日**: 2025-01-20  
**実装状況**: 既に`dirty-check.ts`は実装済み、診断画面に適用  
**実装内容**:
- `src/lib/dirty-check.ts`に`useDirtyCheck`フックが既に実装済み
- 診断画面に`useDirtyCheck`を適用（`autoSaveHasUnsavedChanges`を使用）
- `beforeunload`イベントで確認ダイアログを表示（ブラウザを閉じる/リロードする場合）
- `BackButton`コンポーネントでも`useDirtyCheck`を使用してページ遷移時に確認ダイアログを表示

**影響範囲**:
- `src/lib/dirty-check.ts`（既存実装）
- `src/app/mechanic/diagnosis/[id]/page.tsx`（`useDirtyCheck`を追加）
- `src/components/layout/back-button.tsx`（既に`useDirtyCheck`を使用）

**実装詳細**:
1. **既存の実装**:
   - `useDirtyCheck`フックが既に実装されており、`beforeunload`イベントで確認ダイアログを表示
   - `BackButton`コンポーネントでページ遷移時の確認ダイアログを表示

2. **診断画面への適用**:
   - `autoSaveHasUnsavedChanges`を`useDirtyCheck`に渡すことで、未保存の変更がある場合に確認ダイアログを表示
   - ワークオーダーがない場合は無効化

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ 診断画面にDirty Checkを適用
- ✅ `beforeunload`イベントで確認ダイアログを表示
- ✅ ページ遷移時の確認ダイアログ（`BackButton`で実装済み）

**今後の課題**:
- 見積画面、作業画面など、他のフォーム入力画面にも適用を検討（必要に応じて）

**次のステップ**: 他の簡単な実装項目に進む

---

**最終更新日**: 2025-01-20（2-4. 受付画面のオフライン対応（A3）完了）

---

#### 2-4. 受付画面のオフライン対応（A3）✅

**実装日**: 2025-01-20  
**実装状況**: 既に実装済み  
**実装内容**:
- SWRの`revalidateOnFocus: false`を設定（フォーカス時の再検証を無効化）
- SWRの`revalidateOnReconnect: true`を設定（再接続時に再検証）
- SWRはデフォルトでキャッシュを保持するため、前回のデータは即座に表示される（`fallbackData`相当の動作）

**影響範囲**:
- `src/app/page.tsx`（`fetchTodayJobs`のSWR設定）

**実装詳細**:
- `useSWR`のオプションで`revalidateOnFocus: false`と`revalidateOnReconnect: true`を設定済み
- SWRのデフォルトのキャッシュ機能により、オフライン時も前回のデータが即座に表示される
- `revalidateOnMount: true`により、マウント時は最新データを取得

**レビュー結果**:
- ✅ オフライン対応が適切に実装されている
- ✅ フォーカス時の不要な再検証を回避
- ✅ 再接続時に自動で最新データを取得

**次のステップ**: 「戻る」挙動とDirty Check（A6）に進む

---

**最終更新日**: 2025-01-20（2-2. 診断画面の縦スクロール問題（A2）完了）

---

#### 2-2. 診断画面の縦スクロール問題（A2）✅

**実装日**: 2025-01-20  
**実装内容**:
- 診断チェックリストをカテゴリごとに`Collapsible`コンポーネントで折りたたみ可能に
- 未入力項目があるカテゴリに「！」マーク（`AlertTriangle`アイコン）を表示
- 完了カテゴリに「✓」マーク（`CheckCircle2`アイコン）を表示
- デフォルトで最初のカテゴリのみ開く
- 完了カテゴリは自動で閉じる機能を実装

**影響範囲**:
- `src/app/mechanic/diagnosis/[id]/page.tsx`（診断チェックリストの表示部分）

**変更内容**:
1. **Collapsibleコンポーネントの追加**:
   - `Collapsible`、`CollapsibleTrigger`、`CollapsibleContent`をインポート
   - `ChevronDown`、`ChevronUp`アイコンをインポート

2. **カテゴリごとのグループ化ロジック**:
   - `itemsByCategory`: カテゴリごとに`checkItems`をグループ化
   - `categories`: カテゴリのリスト（最初のカテゴリを最初に配置）
   - `openCategories`: 開いているカテゴリを管理するstate（デフォルトで最初のカテゴリのみ開く）

3. **未入力項目・完了状態の判定**:
   - `hasIncompleteItems`: カテゴリに未入力項目があるかチェック
   - `isCategoryComplete`: カテゴリが完了したかチェック（すべての項目がunchecked以外）

4. **完了カテゴリの自動クローズ**:
   - `useEffect`でカテゴリの完了状態を監視し、完了したカテゴリを自動で閉じる

5. **UI改善**:
   - カテゴリごとに折りたたみ可能なボタンを追加
   - 未入力項目があるカテゴリに`AlertTriangle`アイコンを表示
   - 完了カテゴリに`CheckCircle2`アイコンを表示
   - カテゴリごとの項目数をバッジで表示
   - 開閉状態に応じて`ChevronUp`/`ChevronDown`アイコンを切り替え

**修正ファイル一覧**:
- `src/app/mechanic/diagnosis/[id]/page.tsx`

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（Collapsibleコンポーネント、アイコンサイズ、フォントサイズ）
- ✅ 40歳以上ユーザー向け最適化（ボタンサイズ`h-12`、フォントサイズ`text-base`、アイコンサイズ`h-4 w-4`）
- ✅ アクセシビリティ対応（`aria-label`追加）
- ✅ 縦スクロール問題の解決（カテゴリごとに折りたたみ可能）

**次のステップ**: 「戻る」挙動とDirty Check（A6）に進む

---

#### DESIGN_SYSTEM.md準拠の修正（全体的な改善）✅

**実装日**: 2025-01-20  
**実装内容**:
- DESIGN_SYSTEM.mdの禁止事項（`text-xs`、`h-3 w-3`、`size-3`など）を使用している箇所を修正
- UIコンポーネントとfeaturesコンポーネント全体でアイコンサイズを16px以上に統一
- フォントサイズを16px（`text-base`）以上に統一

**影響範囲**:
- UIコンポーネント（`src/components/ui/`）
- Featuresコンポーネント（`src/components/features/`）

**変更内容**:
1. **UIコンポーネントの修正**:
   - `dropdown-menu.tsx`: `size-3.5` → `size-4`（アイコンコンテナ）、`text-sm` → `text-base`（DropdownMenuShortcut）、`CircleIcon`のサイズを`size-2` → `size-4`に修正
   - `select.tsx`: `size-3.5` → `size-4`（アイコンコンテナ）に修正

2. **Featuresコンポーネントの修正**:
   - `notification-bell.tsx`: `text-xs` → `text-base`（Badge、時間表示、説明文）、`h-5 w-5` → `h-6 w-6`（未読数バッジ）
   - `estimate-change-history-section.tsx`: `h-3 w-3` → `h-4 w-4`（Calendar、Eye、CheckCircle2、XCircleアイコン）
   - `photo-manager.tsx`: `h-3 w-3` → `h-4 w-4`（GripVertical、Xアイコン）
   - `restore-work-view.tsx`: `h-3 w-3` → `h-4 w-4`（AlertTriangle、AlertCircleアイコン）
   - `upload-queue-indicator.tsx`: `h-3 w-3` → `h-4 w-4`（Upload、CheckCircle2アイコン）
   - `restore-progress-section.tsx`: `h-3 w-3` → `h-4 w-4`（Calendar、Clockアイコン）
   - `vehicle-registration-upload.tsx`: `h-3 w-3` → `h-4 w-4`（Xアイコン）
   - `option-menu-selector.tsx`: `h-3 w-3` → `h-4 w-4`（Clockアイコン）
   - `body-paint-outsourcing-view.tsx`: `h-3 w-3` → `h-4 w-4`（AlertTriangleアイコン）
   - `smart-tag-inventory-card.tsx`: `h-3 w-3` → `h-4 w-4`（Tagアイコン）、コンテナサイズを`w-5 h-5` → `w-6 h-6`に修正

**修正ファイル一覧**:
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/select.tsx`
- `src/components/features/notification-bell.tsx`
- `src/components/features/estimate-change-history-section.tsx`
- `src/components/features/photo-manager.tsx`
- `src/components/features/restore-work-view.tsx`
- `src/components/features/upload-queue-indicator.tsx`
- `src/components/features/restore-progress-section.tsx`
- `src/components/features/vehicle-registration-upload.tsx`
- `src/components/features/option-menu-selector.tsx`
- `src/components/features/body-paint-outsourcing-view.tsx`
- `src/components/features/smart-tag-inventory-card.tsx`

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（禁止事項をすべて修正）
- ✅ 40歳以上ユーザー向け最適化（アイコンサイズ16px以上、フォントサイズ16px以上）
- ✅ 一貫性の確保（全コンポーネントで統一されたサイズ体系）

**次のステップ**: チェックインAPIの整合性（B1）に進む

---

#### 3-3. PDF生成エンジンの実装（G2）✅

**実装日**: 2025-01-20  
**実装内容**:
- `src/lib/pdf-generator.ts`にPDF生成機能が実装済み（既存実装）
- `src/app/admin/estimate/[id]/page.tsx`にPDF生成ボタンを追加・改善
- DESIGN_SYSTEM.mdに準拠したボタンスタイルの適用
- ボタンのラベルを「PDF」から「PDF生成」に変更（より明確に）
- エラーハンドリングの追加
- アクセシビリティ向上（`aria-label`の追加、アイコンの`strokeWidth={2.5}`追加）
- `EstimateLineItem`型の`price`プロパティ使用箇所の修正（`partQuantity * partUnitPrice + laborCost`で計算するように修正）

**影響範囲**:
- `src/app/admin/estimate/[id]/page.tsx`（PDF生成ボタンの追加・改善、`EstimateLineItem`型の修正）
- `src/lib/pdf-generator.ts`（既存実装、変更なし）

**変更内容**:
1. **PDF生成ボタンの追加・改善**:
   - ボタンのラベル: 「PDF」→「PDF生成」（より明確に）
   - ボタンスタイル: `h-12 text-base`（DESIGN_SYSTEM.mdに準拠）
   - アイコン: `FileText`（`h-5 w-5`、`strokeWidth={2.5}`）
   - エラーハンドリング: `try-catch`でエラーをキャッチし、トースト通知を表示
   - アクセシビリティ: `aria-label="見積書PDFをダウンロード"`を追加

2. **`EstimateLineItem`型の修正**:
   - セクション別合計の計算: `item.price` → `partQuantity * partUnitPrice + laborCost`で計算
   - `EstimateChangeHistorySection`へのデータ変換: `price`を計算して設定
   - `onEstimateChange`コールバック: `EstimateItem[]` → `EstimateLineItem[]`への変換を修正

**レビュー結果**:
- ✅ Lintエラーなし（既存の警告のみ）
- ✅ DESIGN_SYSTEM.mdに準拠
- ✅ 型安全性の確保（`EstimateLineItem`型の`price`プロパティ問題を修正）
- ✅ アクセシビリティ対応（`aria-label`追加）
- ✅ エラーハンドリングの実装

**次のステップ**: チェックインAPIの整合性（B1）に進む

---

#### 5-7. セクション別合計の表示（C5）✅

**実装日**: 2025-01-20  
**実装内容**:
- 画面下部に固定表示（`fixed bottom-0`）
- セクション別合計 + 全体合計を表示

**影響範囲**:
- `src/app/admin/estimate/[id]/page.tsx`（`EstimatePageContent`コンポーネント）

**変更内容**:
1. **全体合計の計算**:
   - `grandSubtotal`: 必須整備 + 推奨整備 + 任意整備の合計（税抜）
   - `grandTaxCalculation`: 消費税計算
   - `grandTotal`: 税込/税抜に応じた全体合計

2. **スティッキーフッターの追加**:
   - `fixed bottom-0 left-0 right-0`で画面下部に固定表示
   - `z-40`でヘッダー（`z-header: 40`）と同じ階層
   - グリッドレイアウト（モバイル: 1列、PC: 4列）
   - セクション別合計（必須整備、推奨整備、任意整備）+ 全体合計を表示
   - セクション別合計は税込/税抜に応じて計算

3. **メインコンテンツのpadding調整**:
   - `main`要素に`pb-32`を追加して、フッターの下にコンテンツが隠れないようにする

4. **UI実装**:
   - 必須整備: `text-red-600`（赤）
   - 推奨整備: `text-primary`（青）
   - 任意整備: `text-slate-700`（グレー）
   - 全体合計: `text-2xl font-bold text-slate-900`（強調）
   - モバイル: 横並び（`flex items-center justify-between`）
   - PC: 縦並び（`md:flex-col md:items-start`）

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ DESIGN_SYSTEM.mdに準拠（フォントサイズ`text-base`、`text-xl`、`text-2xl`）
- ✅ モバイル、タブレット、PC版のすべてのレイアウトに対応
- ✅ 税込/税抜の切り替えに対応
- ✅ Z-Index階層が適切（`z-40`）

**次のステップ**: 5-8. 部分承認のワークフローに進む

---

#### 5-8. 部分承認のワークフロー（C6）✅

**実装日**: 2025-01-20  
**実装内容**:
- 全項目を含めて`approved: true/false`フラグを持つ方式に変更
- `selected`フラグも後方互換性のために保持

**影響範囲**:
- `src/types/index.ts`（`EstimateItem`インターフェース）
- `src/lib/api.ts`（`approveEstimate`関数）
- `src/app/customer/approval/[id]/page.tsx`（`handleOrder`関数、`useEffect`）

**変更内容**:
1. **`EstimateItem`型に`approved`フラグを追加**:
   - `approved?: boolean`: 承認済みか（部分承認のワークフロー用、`selected`と併用可能）
   - `selected`フラグは後方互換性のために残す

2. **`approveEstimate`関数を修正**:
   - パラメータ名を`selectedItems`から`items`に変更（全項目を含む配列を受け取る）
   - 承認された項目を`items.filter((i) => i.approved !== false && i.selected !== false)`で抽出
   - 承認された項目のみを`field13`と`approvedWorkItems`に保存

3. **`handleOrder`関数を修正**:
   - `selectedItems`のみではなく、全項目を含む`allEstimateItems`を作成
   - 各項目に`approved: item.selected`を設定（選択されている項目は承認、選択されていない項目は非承認）
   - `approveEstimate`に全項目を含む配列を渡す
   - `updateWorkOrder`で全項目を含めて保存

4. **`useEffect`を修正**:
   - `item.approved !== false && item.selected !== false`で選択状態を決定（後方互換性のため）

**レビュー結果**:
- ✅ Lintエラーなし
- ✅ 部分承認のワークフローが適切に実装されている（全項目を含めて`approved`フラグを持つ）
- ✅ 後方互換性を保持（`selected`フラグも使用可能）
- ✅ ワークオーダーの更新時に全項目が保存される

**次のステップ**: Phase 5の残りの項目（5-6. 工賃マスタ選択のUX）に進む、またはPhase 6以降の項目に進む

---

**最終更新日**: 2025-01-20（6-3. completeWork APIの設計課題（B4）完了）

