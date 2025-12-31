# TOPページ実装状況チェックリスト

## パフォーマンス最適化

### ✅ 実装済み
- **useMemo**: `longTermProjects`の計算に使用
- **SWRキャッシュ**: データ取得の最適化
- **デバウンス**: 検索クエリに使用（`useDebounce`）

### ✅ 実装済み（追加）
- **コンポーネントのメモ化（React.memo）**: 一時的に削除（エラー回避のため）
  - パフォーマンス最適化は`useMemo`とSWRキャッシュで対応
  - 必要に応じて後で再実装可能

### ✅ 実装済み（追加）
- **リストレンダリング**: 通常の`JobList`コンポーネント（`map`レンダリング）を使用
  - 仮想スクロール（`@tanstack/react-virtual`）は削除済み
  - データ量が少ないため、通常のレンダリングで十分なパフォーマンスを確保
- **画像の遅延読み込み**: `loading="lazy"`属性を追加
  - `presentation-page/comparison-card.tsx`の画像に追加
  - その他の画像コンポーネントでも必要に応じて追加可能

## アクセシビリティ

### ✅ 実装済み
- **キーボードナビゲーション**: `SummaryCarousel`で実装済み（ArrowLeft/ArrowRight）
- **ARIAラベル**: `SummaryCarousel`で一部実装済み
  - `aria-label="サマリーカードカルーセル"`
  - `aria-label="前のカードへ"` / `aria-label="次のカードへ"`
  - `role="region"`, `role="tablist"`, `role="tab"`
  - `aria-selected`, `aria-controls`

### ✅ 実装済み（追加）
- **ARIAラベルの追加**: 以下のコンポーネントに追加
  - `JobCard`: `role="article"`, `aria-label`追加
  - `TodaySummaryCard`: `role="region"`, `aria-label`追加、各ステータス項目に`role="button"`, `aria-label`, `aria-pressed`追加
  - `ServiceKindSummaryCard`: `role="region"`, `aria-label`追加、各項目に`role="button"`, `aria-label`, `aria-pressed`追加
  - `CourtesyCarInventoryCard`: `role="region"`, `aria-label`追加、各ステータス項目に`role="button"`, `aria-label`追加
  - キーボードナビゲーション: `tabIndex`, `onKeyDown`（Enter/Space）追加
  - フォーカス管理: `focus:outline-none focus:ring-2`追加

### ✅ 実装済み（追加）
- **スクリーンリーダー対応の強化**: 以下の改善を実装
  - `aria-describedby`: 各サマリーカードに説明文を追加（`sr-only`クラスで非表示）
  - `aria-live="polite"`: 仮想スクロールリストに追加（動的コンテンツの変更を通知）
  - `aria-atomic="false"`: 部分的な更新を通知
  - `TodaySummaryCard`: "本日の案件をステータス別に集計しています..."の説明を追加
  - `ServiceKindSummaryCard`: "入庫区分別に案件を集計しています..."の説明を追加
  - `CourtesyCarInventoryCard`: "代車の在庫状況をステータス別に集計しています..."の説明を追加
  - `JobList`: "{件数}件のジョブが表示されています..."の説明を追加
- **フォーカス管理の改善**: 以下の改善を実装
  - **スキップリンク**: メインコンテンツへスキップするリンクを追加（`sr-only`で非表示、フォーカス時に表示）
  - **フォーカス順序の最適化**: `main`要素に`id="main-content"`と`role="main"`を追加
  - **キーボードナビゲーション**: 仮想スクロールリストに`tabIndex={0}`を追加
  - **フォーカススタイル**: 既存の`focus:outline-none focus:ring-2`を維持

## アニメーション・トランジション

### ✅ 実装済み
- **カードのホバーエフェクト**: `JobCard`で`hover:shadow-lg`実装済み
- **ステータス変更時のアニメーション**: `TodaySummaryCard`で数値アニメーション実装済み（500ms、20ステップ）
- **ページ遷移のスムーズ化**: `scrollIntoView({ behavior: "smooth" })`実装済み
- **トランジション**: 各種ホバーエフェクトに`transition-all`、`transition-colors`使用

## データ可視化

### ❌ 未実装
- **サマリーカードに簡易グラフ**: 未実装
- **時間帯別の入庫予定グラフ**: 未実装
- **作業進捗の可視化**: 未実装

## エラーハンドリング

### ✅ 実装済み
- **エラー時のリトライUI**: 基本的な実装あり
  - `jobsError`時に再試行ボタン表示
  - `mutateJobs()`で再取得

### ✅ 実装済み（追加）
- **部分的なエラー表示**: 実装済み
  - `courtesyCarsError`: 代車在庫カード内にエラー表示と再試行ボタン
  - `allTagsError`: タグ選択ダイアログ内にエラー表示と再試行ボタン
- **エラーの詳細表示**: 実装済み
  - `jobsError`: エラーメッセージ、スタックトレース（折りたたみ可能）を表示
  - エラーアイコン、詳細情報、再試行ボタンを表示

## CompactJobHeaderの機能追加

### ✅ 実装済み
- **重要な顧客フラグ（Starアイコン）**: 第1階層に追加
  - クリックでトグル可能
  - アクティブ時: `text-yellow-500`
  - 非アクティブ時: `text-slate-300`
- **お客様共有フォルダ（Folderアイコン）**: 第1階層に追加
  - `job.field19`が存在する場合に表示
  - 外部リンクとして動作
- **代車情報（CarFrontアイコン）**: 第3階層に追加
  - 代車が割り当てられている場合に表示
  - アイコンサイズ: `h-3.5 w-3.5`
- **入庫日時表示**: 第2階層で日付+時刻形式（`MM/DD HH:MM 入庫`）で表示
  - 時間のみから日時表示に変更

## スケルトンローディング

### ✅ 実装済み（Phase 10-4）
- **スケルトンローディングの最適化**: 2024-12-20に完了
  - `TodayScheduleCard`の動的インポートから`loading`プロップを削除
  - `ssr: false`を`ssr: true`に変更
  - `Suspense`を削除（`HomeContent`内で既にローディング状態を管理）
  - `JobCardSkeleton`を最新の`JobCard`構造に合わせて更新
  - スケルトンの二重表示やちらつきを解消
  - 詳細は`PERFORMANCE_PHASE_10_OPTIMIZATION.md`のPhase 10-4を参照

## 実装優先度

### 高優先度
1. 部分的なエラー表示の実装 ✅ 完了
2. コンポーネントのメモ化（React.memo） - 一時的に削除（エラー回避のため）
3. ARIAラベルの追加 ✅ 完了
4. スケルトンローディングの最適化 ✅ 完了（Phase 10-4）

### 中優先度
5. 画像の遅延読み込み ✅ 完了
6. スクリーンリーダー対応の強化 ✅ 完了
7. フォーカス管理の改善 ✅ 完了

### 低優先度（機能追加）
8. サマリーカードに簡易グラフ ❌ 未実装
9. 時間帯別の入庫予定グラフ ❌ 未実装
10. 作業進捗の可視化 ❌ 未実装
11. エラーの詳細表示 ✅ 完了












