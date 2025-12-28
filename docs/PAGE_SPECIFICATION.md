# 整備工場DXプラットフォーム：ページ単位詳細設計仕様書

**Version:** 1.3  
**最終更新日:** 2025年1月  
**対象:** Repair Shop DX Platform (YM Works Edition)

## 目次

1. [概要](#概要)
2. [スタッフ向けページ](#スタッフ向けページ)
   - 1. 受付画面（トップページ）
   - 2. 診断画面
   - 3. 作業画面
   - 4. 見積作成画面
   - 5. プレゼン画面
   - 6. 長期プロジェクト画面
   - 7. 履歴検索ページ
   - 8. 業務分析ページ
   - 9. カンバンボード画面
   - 10. 代車管理画面
   - 11. ログイン画面
3. [顧客向けページ](#顧客向けページ)
   - 12. 顧客ダッシュボード
   - 13. 顧客承認画面
   - 14. 顧客報告画面
   - 15. 顧客事前チェックイン
4. [管理画面](#管理画面)
   - 16. 事前見積画面
   - 17. お知らせ管理画面
   - 18. ブログ写真管理画面
   - 19. 数値マスタ管理画面
5. [共通機能・コンポーネント](#共通機能コンポーネント)
6. [機能コンポーネント詳細](#機能コンポーネント詳細)
7. [ライブラリ関数詳細](#ライブラリ関数詳細)
8. [API関数詳細](#api関数詳細srclibapits)
9. [APIルート詳細](#apiルート詳細)
10. [特殊機能・ワークフロー](#特殊機能ワークフロー)
11. [型定義詳細](#型定義詳細)

---

## 概要

### 設計原則

- **Local First:** 開発は基本的にローカル環境 (`npm run dev`) で行うことを前提とする
- **TypeScript Strict:** `any` 禁止、Props型定義必須
- **ESLint Compliance:** 未使用変数・importの自動削除、`<img>` `<a>` 禁止（`next/image`, `next/link` を使用）
- **Client/Server Boundary:** `useState` 等を使うファイル冒頭には必ず `'use client'`
- **Design System準拠:** `docs/DESIGN_SYSTEM.md` に従い、40歳以上ユーザー向けに最適化

### 技術スタック

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (Strict mode)
- **Styling:** Tailwind CSS 4
- **UI Library:** shadcn/ui (Radix UI)
- **State Management:** SWR (data fetching), React Context
- **External Systems:**
  - Zoho CRM (Transaction Hub)
  - Google Sheets (Master Data Cache)
  - Google Drive (File Storage)

---

## スタッフ向けページ

### 1. 受付画面（トップページ）

**パス:** `/`  
**ファイル:** `src/app/page.tsx`  
**アクセス権限:** スタッフ（ログイン不要、認証は任意）

#### 1.1 目的

本日の入庫予定案件を一覧表示し、チェックイン処理、スマートタグ紐付け、整備士割り当てを行う。

#### 1.2 主要機能

##### 1.2.1 サマリーカード

- **進行中案件数:** 現在作業中の案件数（`field5` = `作業待ち`）
- **見積待ち案件数:** 見積作成待ちの案件数（`field5` = `見積作成待ち`）
- **完了案件数:** 本日完了した案件数（`field5` = `出庫済み` かつ `field22` = 今日）
- **長期化承認待ち:** 見積提示後、設定日数以上経過した案件数
- **長期化部品調達:** 部品発注後、設定日数以上経過した案件数

**データソース:**
- `fetchTodayJobs()` - Zoho CRM `CustomModule2` から本日の案件を取得
- フィルタリング: `field22` (入庫日時) = 今日

**UI要素:**
- カード: `border border-slate-300 rounded-xl shadow-md`
- 数値: `text-2xl font-bold tabular-nums`
- アイコン: `h-5 w-5 shrink-0`

##### 1.2.2 本日入出庫予定カード

**表示内容:**
- 入庫予定時間（`field22`）
- 顧客名（`field4.name`）
- 車両名（`field6.name`）
- 入庫区分（`serviceKind` または `field_service_kinds`）
- 工程ステージ（`field5`）
- スマートタグID（`tagId`）

**アラート表示:**
- 📝 **事前入力あり:** `field7` (詳細情報) に顧客入力がある場合
- ⚠ **作業指示あり:** `field` (作業指示書) に社内指示がある場合
- 🔔 **エラーロンプ点灯:** `field7` にエラーロンプ情報が記録されている場合

**アクション:**
- **チェックイン:** `checkIn()` API呼び出し → `field5` を `入庫済み` に更新
- **スマートタグ紐付け:** `fetchAvailableTags()` → タグ選択 → `tagId` を保存
- **整備士割り当て:** `assignMechanic()` → `assignedMechanic` を保存

##### 1.2.3 フィルター機能

**フィルター項目:**
- 工程ステージ（`field5`）
- 入庫区分（`serviceKind`）
- 整備士（`assignedMechanic`）
- 検索（顧客名・車両名・ナンバープレート）

**UI要素:**
- フィルターボタン: `h-12 text-base font-medium`
- バッジ: `text-base font-medium px-2.5 py-1 tabular-nums`

##### 1.2.4 お知らせバナー

**表示条件:**
- `getActiveAnnouncements()` から有効なお知らせを取得
- 有効期限（`expiresAt`）が切れていないもの
- 優先度（`priority`）順に表示

**UI要素:**
- `AnnouncementBanner` コンポーネント
- 背景色・テキスト色は設定可能

#### 1.3 データフロー

```
1. ページロード
   → fetchTodayJobs() → Zoho CRM API
   → fetchAvailableTags() → Internal DB
   → getActiveAnnouncements() → localStorage

2. チェックイン処理
   → checkIn(jobId) → Zoho CRM API (field5更新)
   → SWRキャッシュ更新

3. タグ紐付け
   → fetchAvailableTags() → タグ選択
   → tagId保存 → Internal DB
   → SWRキャッシュ更新
```

#### 1.4 状態管理

- **SWR:** `useSWR('today-jobs', fetchTodayJobs)`
- **Local State:** フィルター状態、ダイアログ開閉状態

#### 1.5 エラーハンドリング

- APIエラー時: `toast.error()` で通知
- ローディング状態: `Skeleton` コンポーネントで表示

---

### 2. 診断画面

**パス:** `/mechanic/diagnosis/[id]`  
**ファイル:** `src/app/mechanic/diagnosis/[id]/page.tsx`  
**アクセス権限:** 整備士（ログイン不要）

#### 2.1 目的

車両の診断を行い、点検項目のチェック、写真・動画撮影、診断結果の記録を行う。

#### 2.2 主要機能

##### 2.2.1 案件情報ヘッダー

**表示内容:**
- 顧客名（`field4.name`）
- 車両名（`field6.name`）
- 入庫区分（`serviceKind`）
- 工程ステージ（`field5`）
- 走行距離（`field10`）

**アラート表示:**
- 📝 **事前入力あり:** `field7` に顧客入力がある場合
- ⚠ **作業指示あり:** `field` に社内指示がある場合

##### 2.2.2 入庫区分別診断ビュー

**24ヶ月点検（車検） (`車検`):**
- **再設計版UI**: `InspectionRedesignTabs` + `InspectionBottomSheetList` コンポーネント
- **カテゴリ構成（6カテゴリ）:**
  1. エンジン・ルーム点検
  2. 室内点検
  3. 足廻り点検
  4. 下廻り点検
  5. 外廻り点検
  6. 日常点検
- **検査項目**: `getInspectionItems("24month")` で取得（`InspectionItemRedesign[]`型）
- **ステータス記号（信号機方式）**: レ（良好）、×（交換）、A（調整）、C（清掃）、T（締付）、△（修理）、/（該当なし）、P（省略）
- **測定値入力**: `InspectionMeasurements`型で管理、CO・HC濃度、ブレーキパッド厚さ（4輪）、タイヤ溝深さ（4輪）
- **交換部品入力**: `InspectionParts`型で管理、エンジンオイル、オイルフィルター、LLC、ブレーキフルード、ワイパーゴム、エアフィルター
- **完成検査時のテスター数値入力**: ブレーキ制動力、サイドスリップ、スピードメーター誤差、排ガス（CO・HC濃度）、ヘッドライト（上向き・下向き）
- **追加見積内容入力**: `DiagnosisAdditionalEstimateSection`で必須・推奨・任意の3分類で入力
  - `additionalEstimateRequired`: 必須整備項目（`EstimateLineItem[]`）
  - `additionalEstimateRecommended`: 推奨整備項目（`EstimateLineItem[]`）
  - `additionalEstimateOptional`: 任意整備項目（`EstimateLineItem[]`）
- **OBD診断結果**: `OBDDiagnosticUnifiedSection` でPDFアップロードと詳細入力を統合
  - PDFアップロード: `obdPdfResult`（`OBDDiagnosticResult`型）
  - 詳細入力: `enhancedOBDDiagnosticResult`（`EnhancedOBDDiagnosticResult`型）
- **品質検査**: `InspectionQualityCheckSection` で品質検査項目の入力（Phase 5に移動予定）
- **チェックリスト**: 入庫時・出庫時チェックリスト（`InspectionChecklistDialog`）
- **走行距離入力**: ページの最初に独立したセクションとして表示（`Card`コンポーネント）
- **自動進捗機能**: `InspectionBottomSheetList`の`onNextSection`で判定ボタン押下時に次の項目へ自動スクロール
- **完了カテゴリの自動閉じ**: カテゴリ完了時に自動で閉じる
- **診断データ保存**: `WorkOrder.diagnosis`に以下のデータを保存
  - `items`: `InspectionItemRedesign[]`（検査項目の状態）
  - `inspectionMeasurements`: `InspectionMeasurements`（測定値）
  - `inspectionParts`: `InspectionParts`（交換部品）
  - `additionalEstimateRequired`: `EstimateLineItem[]`（必須整備）
  - `additionalEstimateRecommended`: `EstimateLineItem[]`（推奨整備）
  - `additionalEstimateOptional`: `EstimateLineItem[]`（任意整備）
  - `obdPdfResult`: `OBDDiagnosticResult`（OBD診断結果PDF）
  - `enhancedOBDDiagnosticResult`: `EnhancedOBDDiagnosticResult`（OBD診断詳細）

**12ヵ月点検 (`12ヵ月点検`):**
- **従来版UI**: `InspectionDiagnosisView` コンポーネント（実装に基づく）
- **検査項目**: `VEHICLE_INSPECTION_ITEMS` から取得
- **ステータス記号（信号機方式）**: 緑（良好）、黄（注意）、赤（交換）
- **測定値入力**: CO・HC濃度、ブレーキパッド厚さ、タイヤ溝深さ
- **交換部品入力**: エンジンオイル、オイルフィルター、ワイパーゴム、エアフィルター
- **OBD診断結果**: 別システムで実施、診断結果PDFをアップロード（`OBDDiagnosticResultSection`）
- **追加見積内容入力**: 必須・推奨・任意の3分類で入力（`DiagnosisAdditionalEstimateSection`）
- **走行距離入力**: ページの最初に独立したセクションとして表示
- **PDF生成**: `public/12カ月点検テンプレート.pdf` を使用
- **追加見積もりがない場合**: 診断データから作業データに引き継ぎ、直接作業画面へ遷移

**エンジンオイル交換 (`エンジンオイル交換`):**
- `EngineOilInspectionView` コンポーネント
- オイルレベル、オイルフィルター、オイル漏れなどの点検項目

**タイヤ交換・ローテーション (`タイヤ交換・ローテーション`):**
- `TireInspectionView` コンポーネント
- タイヤ溝深さ測定（4輪）
- タイヤ空気圧測定（4輪）
- 推奨空気圧入力

**その他のメンテナンス (`その他のメンテナンス`):**
- `MaintenanceInspectionView` コンポーネント
- メンテナンスメニュー選択（`getMaintenanceMenuConfig()`）
- 選択メニューに応じた点検項目表示
- 測定値入力

**故障診断 (`故障診断`):**
- `FaultDiagnosisView` コンポーネント
- 症状カテゴリ選択（エンジン、トランスミッション、ブレーキ、サスペンション、電装、その他）
- 症状項目のチェック
- エラーロンプ情報入力（`ErrorLampInputDialog`）
- 診断ツール結果入力（OBD診断結果、エラーコード）
- 動画・音声録音
- 追加メモ

**チューニング・パーツ取付 (`チューニング`, `パーツ取付`):**
- `TuningPartsInspectionView` コンポーネント
- チューニングタイプ選択（エンジンチューニング、サスペンション、エアロパーツ、その他）
- カスタム説明入力
- 点検項目チェック

**コーティング (`コーティング`):**
- `CoatingInspectionView` コンポーネント
- 車体の状態確認（各箇所の状態選択）
- 既存コーティングの状態確認
- 写真撮影

**板金・塗装 (`板金・塗装`):**
- `BodyPaintDiagnosisView` コンポーネント
- 損傷箇所の追加・削除
- 各損傷箇所の詳細（位置、種類、深刻度、写真・動画）
- 外注先への見積もり依頼方法選択
- 外注先からの見積もり回答入力

**レストア (`レストア`):**
- `RestoreDiagnosisView` コンポーネント
- レストアの種類選択（フルレストア、部分レストア、エンジンオーバーホール、その他）
- 現状確認項目の追加・削除
- 修復箇所の追加・削除
- 各箇所の詳細（位置、状態、写真）

**その他 (`その他`):**
- `OtherServiceDiagnosisView` コンポーネント
- 診断項目の追加・削除
- 各項目の詳細（名称、状態、写真、コメント）

##### 2.2.3 OBD診断結果（統合セクション）

**OBD診断結果統合 (`OBDDiagnosticUnifiedSection`):**
- **24ヶ月点検（車検）**: PDFアップロードと詳細入力の両方をサポート
- **12ヶ月点検**: 別システムで実施、診断結果PDFをアップロード（決まったフォーマット）
- **PDFアップロード**: 診断結果PDFのアップロード・ダウンロード
- **詳細入力**: エラーコード入力（複数）、診断ツール名入力、メモ入力
- **統合表示**: PDFと詳細入力結果を1つのセクションで管理

##### 2.2.4 診断担当者選択

**機能:**
- `MechanicSelectDialog` コンポーネント
- 診断担当者を選択
- `diagnosisMechanic` を `WorkOrder.diagnosis.mechanicName` に保存

##### 2.2.5 写真・動画管理

**機能:**
- `PhotoManager` コンポーネント
- 写真のアップロード・削除
- 動画のアップロード・削除
- 画像圧縮（`browser-image-compression`、500KB以下）

**保存先:**
- Google Drive: `.../[JobID]/[WorkOrderID]/diagnosis/photos/`

##### 2.2.6 その他の機能

- **診断料金入力:** `DiagnosisFeeDialog`
  - 診断料金、診断時間（概算・分）、診断料金が事前に決まっているかのフラグ
- **一時帰宅:** `TemporaryReturnDialog`
  - 一時帰宅日時、再入庫予定日時、理由・備考
  - 一時帰宅時は `field5` を「再入庫待ち」に更新
- **作業メモ:** `JobMemoDialog`
  - メモ内容、作成者名、作成日時
  - `field26` にJSON形式で保存
- **診断プレビュー:** `DiagnosisPreviewDialog`
  - 診断結果のプレビュー表示
  - 診断項目、写真、動画、コメントの確認
- **ブログ写真撮影:** `BlogPhotoCaptureDialog`
  - ブログ用写真の撮影、カテゴリ選択、公開可否設定
- **品質検査:** `InspectionQualityCheckSection`（24ヶ月点検・12ヶ月点検）
  - 品質検査項目の入力、検査結果（合格、不合格、保留、該当なし）、検査者名、検査日時
- **追加見積内容入力:** `DiagnosisAdditionalEstimateSection`（24ヶ月点検・12ヶ月点検）
  - 必須・推奨・任意の3分類で追加見積内容を入力
  - 追加見積もりがない場合、診断データから作業データに引き継ぎ、直接作業画面へ遷移

#### 2.3 データフロー

```
1. ページロード
   → fetchJobById(jobId) → Zoho CRM API
   → useWorkOrders(jobId) → Work Orders API
   → 診断データの初期化（既存データがあれば読み込み）

2. 診断データ保存
   → buildDiagnosisData() → 診断データ構築
   → saveDiagnosis(workOrderId, diagnosisData) → Work Orders API
   → Zoho CRM field7 更新（必要に応じて）

3. 写真・動画アップロード
   → compressImage() → 画像圧縮
   → uploadFile() → Google Drive API
   → ファイルURLを診断データに保存
```

#### 2.4 状態管理

- **SWR:** `useSWR(['job', jobId], () => fetchJobById(jobId))`
- **Custom Hook:** `useWorkOrders(jobId)` - ワークオーダー管理
- **Local State:** 診断項目の状態、写真データ、フォーム入力値

#### 2.5 バリデーション

- **必須項目チェック:** 診断完了時に必須項目が入力されているか確認
- **エラーメッセージ:** `toast.error()` で通知

---

### 3. 作業画面

**パス:** `/mechanic/work/[id]`  
**ファイル:** `src/app/mechanic/work/[id]/page.tsx`  
**アクセス権限:** 整備士（ログイン不要）

#### 3.1 目的

承認された作業項目を実施し、作業完了報告、After写真撮影を行う。

#### 3.2 主要機能

##### 3.2.1 案件情報ヘッダー

**表示内容:**
- 顧客名（`field4.name`）
- 車両名（`field6.name`）
- 入庫区分（`serviceKind`）
- 工程ステージ（`field5`）

##### 3.2.2 承認済み作業項目一覧

**表示内容:**
- `ApprovedWorkItemCard` コンポーネント
- 作業項目名（`item.name`）
- 金額（`item.price`）
- Before写真（`item.beforePhotos`）
- After写真撮影ボタン
- 担当整備士選択（`onMechanicChange`）
- 完了チェックボックス

**入庫区分別の特殊表示:**

**24ヶ月点検（車検） (`車検`):**
- **受入点検データ**: Phase 2（診断画面）からの引き継ぎデータを表示
- **完成検査データ入力**: テスター数値入力（ブレーキ制動力、サイドスリップ、スピードメーター誤差、排ガス、ヘッドライト）
- **品質管理・最終検査**: `InspectionQualityCheckSection` で品質検査項目の入力
- **交換部品等**: 診断画面で入力した交換部品の確認・編集
- **整備アドバイス**: 診断画面で入力した整備アドバイスの確認・編集
- **分解整備記録簿生成**: 完成検査後にPDF生成（`public/24か月点検用テンプレート.pdf`）

**12ヶ月点検 (`12ヵ月点検`):**
- **受入点検データ**: Phase 2（診断画面）からの引き継ぎデータを表示
- **交換部品等**: 診断画面で入力した交換部品の確認・編集
- **整備アドバイス**: 診断画面で入力した整備アドバイスの確認・編集
- **測定値**: 診断画面で入力した測定値の確認（CO・HC濃度、ブレーキパッド厚さ、タイヤ溝深さ）
- **12ヶ月点検記録簿生成**: 完成検査後にPDF生成（`public/12カ月点検テンプレート.pdf`）

**板金・塗装 (`板金・塗装`):**
- `BodyPaintOutsourcingView` コンポーネント
- 外注先への見積もり依頼情報
- 外注先からの見積もり回答
- 作業完了報告

**レストア (`レストア`):**
- `RestoreWorkView` コンポーネント
- 修復箇所ごとの作業進捗
- 作業完了報告

##### 3.2.3 進捗管理

**進捗バー:**
- 完了項目数 / 全項目数
- パーセンテージ表示

**全項目完了チェック:**
- すべての項目が完了したら「全項目完了」ボタンを表示
- クリックで `completeWork()` API呼び出し

#### 3.3 データフロー

```
1. ページロード
   → fetchJobById(jobId) → Zoho CRM API
   → useWorkOrders(jobId) → Work Orders API
   → approvedWorkItems の初期化（estimate.items から）

2. 作業完了
   → buildWorkData() → 作業データ構築
   → completeWork(workOrderId, workData) → Work Orders API
   → Zoho CRM field5 を「出庫待ち」に更新
```

#### 3.4 状態管理

- **SWR:** `useSWR(['job', jobId], () => fetchJobById(jobId))`
- **Custom Hook:** `useWorkOrders(jobId)` - ワークオーダー管理
- **Local State:** 作業項目の完了状態、写真データ、担当整備士

---

### 4. 見積作成画面

**パス:** `/admin/estimate/[id]`  
**ファイル:** `src/app/admin/estimate/[id]/page.tsx`  
**アクセス権限:** 事務所スタッフ（ログイン不要）

#### 4.1 目的

診断結果を基に、見積もり項目を作成・編集し、顧客に送信する。

#### 4.2 主要機能

##### 4.2.1 案件情報ヘッダー

**表示内容:**
- 顧客名（`field4.name`）
- 車両名（`field6.name`）
- 入庫区分（`serviceKind`）
- 工程ステージ（`field5`）

##### 4.2.2 ワークオーダー選択

**機能:**
- `WorkOrderSelector` コンポーネント
- 複数のワークオーダーから選択
- 選択したワークオーダーの診断結果を表示

##### 4.2.3 見積項目管理

**項目追加:**
- 「+ 項目を追加」ボタン
- 項目名、金額、数量、優先度、写真・動画紐付け

**項目編集:**
- 項目の編集・削除
- 優先度変更（必須 / 推奨 / 任意）

**入庫区分別の自動項目追加:**

**24ヶ月点検（車検） (`車検`):**
- **法定費用の自動追加**: `LegalFeesCard` コンポーネントで法定費用を自動計算・表示
  - `getLegalFees(vehicleId)` で車両IDから法定費用を取得
  - 車検費用、自賠責保険料、自動車税を自動計算
  - Google Sheets「【DB】車両マスタ」から車両重量を取得して法定費用を算出
  - 法定費用は税込なので、合計にそのまま加算
  - `legalFees`状態で管理（`LegalFees`型）
- **診断結果からの自動項目追加**: `convertInspectionRedesignToEstimateItems()` - 診断画面で「×（交換）」「A（調整）」「△（修理）」と判定された項目を自動追加
  - 24ヶ月点検リデザイン版の判定: `diagnosis.items`の`status`が`'good'`, `'exchange'`, `'repair'`, `'adjust'`の場合
  - 問題があった項目（`exchange`, `repair`, `adjust`）のみを見積項目に変換
  - 既存の見積項目と重複チェックして追加
  - 工賃マスタ（`searchLaborCostByName()`）から技術量を自動設定
- **追加見積内容**: 診断画面で入力した追加見積内容（必須・推奨・任意）を自動表示
  - `diagnosis.additionalEstimateRequired`から必須整備項目を読み込み
  - `diagnosis.additionalEstimateRecommended`から推奨整備項目を読み込み
  - `diagnosis.additionalEstimateOptional`から任意整備項目を読み込み
  - 既存の見積項目と重複チェックして追加

**12ヵ月点検 (`12ヵ月点検`):**
- **オプションメニュー**: `OptionMenuSelector` コンポーネントで12ヶ月点検と同時実施で10%割引のオプションメニューを表示
  - `optionMenus`配列で8種類のメニューを定義（`OptionMenuItem[]`型）
  - エンジンオイル交換、クーラント交換、バッテリー交換、タイヤ交換作業、ブレーキフルード交換、ブレーキパッド交換、ミッションオイル交換、ATフルード交換作業
  - 各オプションに「12ヶ月点検と同時実施で10%割引」のバッジを表示
  - 割引前価格（`originalPrice`）と割引後価格（`discountedPrice`）を併記
  - `selectedOptionMenuIds`状態で選択されたメニューIDを管理
  - メニュー選択時に見積項目に自動追加（`handleOptionMenuSelectionChange`）
  - 同時実施サービス: `simultaneousService`プロパティで「車検」または「12ヶ月点検」を指定
- **法定費用**: 車両重量に応じて自動計算（1500kg以下: ¥26,400、5000kg以下: ¥13,200 または ¥30,800）
  - `getLegalFees(vehicleId)` で車両IDから法定費用を取得（12ヵ月点検の場合も使用）
- **診断結果からの自動項目追加**: 診断画面で「×（交換）」「A（調整）」と判定された項目を自動追加
  - 従来版の`InspectionDiagnosisView`を使用しているため、従来の処理ロジックを使用
- **追加見積内容**: 診断画面で入力した追加見積内容（必須・推奨・任意）を自動表示
  - `diagnosis.additionalEstimateRequired`から必須整備項目を読み込み
  - `diagnosis.additionalEstimateRecommended`から推奨整備項目を読み込み
  - `diagnosis.additionalEstimateOptional`から任意整備項目を読み込み

**タイヤ交換・ローテーション (`タイヤ交換・ローテーション`):**
- `addTireDiagnosisItemsToEstimate()` - タイヤ交換項目の自動追加

**メンテナンス (`その他のメンテナンス`):**
- `addMaintenanceDiagnosisItemsToEstimate()` - メンテナンス項目の自動追加

**チューニング・パーツ取付 (`チューニング`, `パーツ取付`):**
- `addTuningPartsDiagnosisItemsToEstimate()` - チューニング項目の自動追加

**コーティング (`コーティング`):**
- `addCoatingDiagnosisItemsToEstimate()` - コーティング項目の自動追加

##### 4.2.4 見積送信

**送信方法:**
- LINE通知（`sendLineNotification()`）
- メール送信（`sendEstimateEmail()`）
- マジックリンク生成（`generateMagicLink()`）

**送信先:**
- 顧客のLINE ID（`Business_Messaging_Line_Id`）
- 顧客のメールアドレス（`Email`）

##### 4.2.5 その他の機能

- **見積テンプレート:** `EstimateTemplateDialog`
- **履歴見積:** `HistoricalEstimateDialog`
- **履歴案件:** `HistoricalJobDialog`
- **見積変更履歴:** `EstimateChangeHistorySection`
- **見積プレビュー:** `EstimatePreviewDialog`
- **部品リスト:** `PartsListInput`, `PartsArrivalDialog`
- **請求書アップロード:** `InvoiceUpload`

#### 4.3 データフロー

```
1. ページロード
   → fetchJobById(jobId) → Zoho CRM API
   → useWorkOrders(jobId) → Work Orders API
   → 見積データの初期化（既存データがあれば読み込み）

2. 見積保存
   → buildEstimateData() → 見積データ構築
   → createEstimate(workOrderId, estimateData) → Work Orders API
   → Zoho CRM field5 を「見積提示済み」に更新

3. 見積送信
   → generateMagicLink() → マジックリンク生成
   → sendLineNotification() / sendEstimateEmail() → 通知送信
```

#### 4.4 状態管理

- **SWR:** `useSWR(['job', jobId], () => fetchJobById(jobId))`
- **Custom Hook:** `useWorkOrders(jobId)` - ワークオーダー管理
- **Local State:** 見積項目、送信状態、ダイアログ開閉状態

---

### 5. プレゼン画面

**パス:** `/presentation/[id]`  
**ファイル:** `src/app/presentation/[id]/page.tsx`  
**アクセス権限:** スタッフ（ログイン不要）

#### 5.1 目的

顧客への引き渡し時に、作業内容を説明するためのプレゼンテーション画面。

#### 5.2 主要機能

##### 5.2.1 Before/After比較

**表示内容:**
- `ComparisonCard` コンポーネント
- Before写真（診断時）
- After写真（作業完了後）
- 作業項目名、カテゴリ

##### 5.2.2 作業サマリー

**表示内容:**
- `WorkSummaryTab` コンポーネント
- 実施した作業項目一覧
- 各項目の金額
- 合計金額

##### 5.2.3 請求書表示

**表示内容:**
- `InvoiceTab` コンポーネント
- Google Driveから請求書PDFを検索（`searchInvoicePdf()`）
- PDF表示・ダウンロード

##### 5.2.4 出庫処理

**機能:**
- 出庫完了ボタン
- 車検の場合: `InspectionCheckoutChecklistDialog` を表示
- チェックリスト入力後、`checkOut()` API呼び出し

#### 5.3 データフロー

```
1. ページロード
   → fetchJobById(jobId) → Zoho CRM API
   → useWorkOrders(jobId) → Work Orders API
   → 作業データの読み込み

2. 出庫処理
   → checkOut(jobId) → Zoho CRM API
   → field5 を「出庫済み」に更新
   → チェックリストを field7 に保存（車検の場合）
```

---

### 6. 長期プロジェクト画面

**パス:** `/projects/long-term`  
**ファイル:** `src/app/projects/long-term/page.tsx`  
**アクセス権限:** スタッフ（ログイン不要）

#### 6.1 目的

長期にわたるプロジェクト（レストア、チューニングなど）の進捗を管理する。

#### 6.2 主要機能

##### 6.2.1 プロジェクト一覧

**表示内容:**
- `LongTermProjectCard` コンポーネント
- 顧客名、車両名
- 入庫区分（`serviceKind`）
- 工程ステージ（`field5`）
- 進捗状況（進捗バー）
- 入庫日（`field22`）

##### 6.2.2 フィルター機能

**フィルター項目:**
- 工程ステージ（`field5`）
- 入庫区分（`serviceKind`）
- 検索（顧客名・車両名）

#### 6.3 データフロー

```
1. ページロード
   → fetchLongTermProjects() → Zoho CRM API
   → field5 が「作業待ち」「出庫待ち」の案件を取得
   → 入庫日が30日以上前の案件をフィルタリング
```

---

### 7. 履歴検索ページ

**パス:** `/jobs/history`  
**ファイル:** `src/app/jobs/history/page.tsx`  
**アクセス権限:** スタッフ（ログイン不要）

#### 7.1 目的

過去の案件を検索・フィルタリングして表示する。

#### 7.2 主要機能

##### 7.2.1 検索・フィルター

**検索項目:**
- 顧客名
- 車両名
- ナンバープレート

**フィルター項目:**
- 日付範囲（開始日・終了日、クイック選択：今日、今週、今月、先月）
- 工程ステージ（`field5`）
- 入庫区分（`serviceKind`）
- 整備士（`assignedMechanic`）

##### 7.2.2 検索結果一覧

**表示内容:**
- `JobCard` コンポーネント
- 顧客名、車両名
- 入庫日（`field22`）
- 工程ステージ（`field5`）
- 入庫区分（`serviceKind`）

##### 7.2.3 ページネーション

**機能:**
- 「さらに読み込む」ボタン
- 一度に表示する件数の制限

#### 7.3 データフロー

```
1. 検索実行
   → fetchJobHistory(filters) → Zoho CRM API
   → フィルター条件に基づいて案件を取得
   → 検索結果を表示
```

---

### 8. 業務分析ページ

**パス:** `/manager/analytics`  
**ファイル:** `src/app/manager/analytics/page.tsx`  
**アクセス権限:** 管理者（ログイン不要）

#### 8.1 目的

業務量のトレンド、入庫区分別の業務量、繁忙期・閑散期の比較を分析する。

#### 8.2 主要機能

##### 8.2.1 期間選択

**選択項目:**
- 集計単位（週次、月次、四半期、年次）
- 期間（開始日・終了日、自動計算）

##### 8.2.2 業務量トレンドグラフ

**表示内容:**
- `LineChart` コンポーネント（Recharts）
- 案件数（`count`）
- 進行中（`inProgress`）
- 完了（`completed`）

##### 8.2.3 入庫区分別業務量

**表示内容:**
- `BarChart` コンポーネント（Recharts）
- 各入庫区分（`serviceKind`）の案件数

##### 8.2.4 繁忙期・閑散期の比較

**表示内容:**
- 平均案件数
- 繁忙期の週数
- 閑散期の週数
- 週次データの棒グラフ
- 平均線

#### 8.3 データフロー

```
1. ページロード
   → fetchAnalyticsData(dateRange, start, end) → Analytics API
   → 期間に応じたデータを取得
   → グラフデータを構築
```

---

### 9. カンバンボード画面

**パス:** `/manager/kanban`  
**ファイル:** `src/app/manager/kanban/page.tsx`  
**アクセス権限:** 管理者・スタッフ（ログイン不要）

#### 9.1 目的

作業指示・進捗を視覚的に管理するカンバンボード形式の画面。案件を列に分けて表示し、ドラッグ&ドロップで移動できる。

#### 9.2 主要機能

##### 9.2.1 カンバン列

**列構成:**
- **入庫待ち:** `field5 = '入庫待ち'` の案件
- **作業中:** `field5 = '入庫済み' | '見積作成待ち' | '見積提示済み' | '作業待ち'` の案件
- **出庫待ち:** `field5 = '出庫待ち'` の案件
- **完了:** `field5 = '出庫済み'` の案件

**表示内容:**
- 各列のタイトルと案件数
- `KanbanCard` コンポーネントで案件をカード形式で表示
- ドラッグ&ドロップによる列間の移動（UIのみ、ステータス更新は今後実装予定）

##### 9.2.2 技術者稼働状況

**表示内容:**
- 各技術者の稼働率（%）
- 空き時間（時間・分）
- 担当案件数
- 作業中案件数

**計算方法:**
- `calculateMechanicWorkload()` 関数で計算
- 稼働率は担当案件数と作業時間から算出

##### 9.2.3 ドラッグ&ドロップ機能

**機能:**
- `@dnd-kit/core` を使用したドラッグ&ドロップ
- `DragOverlay` でドラッグ中のカードを表示
- 列間の移動検知（現在はステータス更新機能は未実装）

#### 9.3 データフロー

```
1. ページロード
   → fetchTodayJobs() → Zoho CRM API
   → groupJobsByColumn() → 列ごとに分類
   → calculateMechanicWorkload() → 技術者稼働状況を計算

2. ドラッグ&ドロップ
   → handleDragEnd() → 列間の移動を検知
   → TODO: ステータス更新機能を実装
```

#### 9.4 状態管理

- **SWR:** `useSWR('kanban-jobs', fetchTodayJobs)`
- **Local State:** ドラッグ中のアクティブID

---

### 10. 代車管理画面

**パス:** `/inventory/courtesy-cars`  
**ファイル:** `src/app/inventory/courtesy-cars/page.tsx`  
**アクセス権限:** スタッフ（ログイン不要）

#### 10.1 目的

代車の在庫状況、使用状況を管理する。

#### 10.2 主要機能

##### 10.2.1 サマリーカード

**表示内容:**
- 総数
- 空き（`status = 'available'`）
- 使用中（`status = 'in_use'`）
- 点検中（`status = 'inspection'`）

##### 10.2.2 代車一覧

**表示内容:**
- 代車ID（`carId`）
- 代車名（`name`）
- ナンバープレート（`licensePlate`）
- ステータス（`status`）
- 現在の利用者（`jobId` から取得）

##### 10.2.3 フィルター機能

**フィルター項目:**
- ステータス（すべて、空き、使用中、点検中）

##### 10.2.4 代車詳細ダイアログ

**表示内容:**
- 代車基本情報
- 現在の利用者情報（使用中の場合）
- 車両マスタ情報（Google Sheetsから取得）
- 過去の利用履歴（今後実装予定）

#### 10.3 データフロー

```
1. ページロード
   → fetchAllCourtesyCars() → Courtesy Cars API
   → fetchTodayJobs() → Zoho CRM API
   → 代車とジョブの紐付け情報を取得

2. 車両詳細表示
   → ナンバープレートから車両マスタを検索
   → findVehicleMasterById() → Google Sheets API
   → 車両マスタ情報を表示
```

---

### 11. ログイン画面

**パス:** `/login`  
**ファイル:** `src/app/login/page.tsx`  
**アクセス権限:** 全ユーザー

#### 10.1 目的

Google OAuth認証によるログインを行う。

#### 10.2 主要機能

##### 10.2.1 Googleログイン

**機能:**
- `signIn('google')` - NextAuth.js
- `@ymworks.com` のメールアドレスのみ許可

##### 10.2.2 リダイレクト

**機能:**
- `callbackUrl` パラメータに基づいてリダイレクト
- デフォルト: `/dashboard`

#### 10.3 データフロー

```
1. ログインボタンクリック
   → signIn('google', { callbackUrl }) → NextAuth.js
   → Google OAuth認証
   → 認証成功後、callbackUrl にリダイレクト
```

---

## 顧客向けページ

### 12. 顧客ダッシュボード

**パス:** `/customer/dashboard`  
**ファイル:** `src/app/customer/dashboard/page.tsx`  
**アクセス権限:** 顧客（マジックリンク認証）

#### 11.1 目的

顧客が自分の案件の進捗状況を確認する。

#### 11.2 主要機能

##### 11.2.1 サマリーカード

**表示内容:**
- 進行中案件数（`field5` = `作業待ち`）
- 見積待ち案件数（`field5` = `見積作成待ち`）
- 完了案件数（`field5` = `出庫済み`）

##### 11.2.2 案件一覧

**表示内容:**
- `CustomerJobCard` コンポーネント
- 顧客名、車両名
- 入庫区分（`serviceKind`）アイコン
- 工程ステージ（`field5`）
- 入庫日（`field22`）

##### 11.2.3 タブ表示

**タブ:**
- すべて
- 進行中
- 見積待ち
- 完了

#### 11.3 データフロー

```
1. ページロード
   → fetchCustomerJobs(customerId) → Zoho CRM API
   → 顧客IDに基づいて案件を取得
   → 案件一覧を表示
```

---

### 13. 顧客承認画面

**パス:** `/customer/approval/[id]`  
**ファイル:** `src/app/customer/approval/[id]/page.tsx`  
**アクセス権限:** 顧客（マジックリンク認証）

#### 12.1 目的

見積もり内容を確認し、承認・却下する。

#### 12.2 主要機能

##### 12.2.1 見積項目一覧

**表示内容:**
- `EstimateItemCard` コンポーネント
- 項目名、金額、数量
- 優先度（必須 / 推奨 / 任意）
- Before写真・動画
- チェックボックス（必須項目はロック）

##### 12.2.2 セクション分け

**セクション:**
- 必須整備（`priority = 'required'`）
- 推奨整備（`priority = 'recommended'`）
- 任意整備（`priority = 'optional'`）

##### 12.2.3 リアルタイム計算

**機能:**
- 選択項目の合計金額をリアルタイム計算
- アニメーション表示

##### 12.2.4 承認処理

**機能:**
- 「この内容で作業を依頼する」ボタン
- 承認後、`updateWorkOrder()` で `estimate.approvedItems` を更新
- Zoho CRM `field5` を「作業待ち」に更新

##### 12.2.5 動画・写真表示

**機能:**
- 動画プレーヤー（診断時の動画）
- 写真ライトボックス
- 整備士のコメント表示

#### 12.3 データフロー

```
1. ページロード
   → fetchJobById(jobId) → Zoho CRM API
   → useWorkOrders(jobId) → Work Orders API
   → 見積データの読み込み

2. 承認処理
   → updateWorkOrder(workOrderId, { estimate: { approvedItems } }) → Work Orders API
   → Zoho CRM field5 を「作業待ち」に更新
   → 完了画面を表示
```

---

### 14. 顧客報告画面

**パス:** `/customer/report/[id]`  
**ファイル:** `src/app/customer/report/[id]/page.tsx`  
**アクセス権限:** 顧客（マジックリンク認証）

#### 13.1 目的

作業完了後の報告書を表示し、請求書ダウンロード、レビュー依頼を行う。

#### 13.2 主要機能

##### 13.2.1 Before/After比較

**表示内容:**
- `BeforeAfterCard` コンポーネント
- Before写真（診断時）
- After写真（作業完了後）
- 作業項目名、カテゴリ

##### 13.2.2 整備士コメント

**表示内容:**
- `MechanicCommentBubble` コンポーネント
- 整備士名、アバター
- コメント内容

##### 13.2.3 請求書ダウンロード

**機能:**
- Google Driveから請求書PDFを検索（`searchInvoicePdf()`）
- PDFダウンロードボタン

##### 13.2.4 レビュー依頼

**機能:**
- Googleレビューボタン（外部リンク）
- 顧客アンケートボタン（外部リンク）

##### 13.2.5 ブログ写真公開

**機能:**
- `BlogPhotoSelector` コンポーネント
- 公開する写真を選択
- `publishBlogPhotos()` で公開

#### 13.3 データフロー

```
1. ページロード
   → fetchJobById(jobId) → Zoho CRM API
   → useWorkOrders(jobId) → Work Orders API
   → 作業データの読み込み
   → searchInvoicePdf() → Google Drive API

2. ブログ写真公開
   → publishBlogPhotos() → Blog Photos API
   → 選択した写真を公開フォルダにコピー
```

---

### 15. 顧客事前チェックイン

**パス:** `/customer/pre-checkin/[id]`  
**ファイル:** `src/app/customer/pre-checkin/[id]/page.tsx`  
**アクセス権限:** 顧客（マジックリンク認証）

#### 14.1 目的

来店前に、車両情報、不具合内容、代車希望などを事前入力する。

#### 14.2 主要機能

##### 14.2.1 車両選択

**機能:**
- Google Sheetsから顧客の保有車両を取得
- 車両選択ドロップダウン
- 「別の車（新規）」オプション
- 新規車両の場合、車検証画像アップロード

##### 14.2.2 顧客情報確認

**表示内容:**
- 現在の住所・電話番号（Zoho CRMから取得）
- 変更がある場合、新住所・新電話番号を入力

##### 14.2.3 問診入力

**入力項目:**
- 走行距離
- 不具合・気になるところ（テキストエリア）
- エラーロンプ情報（`ErrorLampInputDialog`）

##### 14.2.4 代車希望

**機能:**
- 代車希望の有無
- 希望する代車の選択（`CourtesyCarSelectDialog`）

##### 14.2.5 メール配信同意

**機能:**
- メール配信同意チェックボックス
- 同意の場合、Zoho CRM `Email_Opt_Out` を `false` に更新

#### 14.3 データフロー

```
1. ページロード
   → fetchJobById(jobId) → Zoho CRM API
   → fetchCustomerById(customerId) → Zoho CRM API
   → fetchVehicleMaster(customerId) → Google Sheets API
   → 既存データの読み込み

2. 送信処理
   → 車両情報を field6 に保存
   → 走行距離を field10 に保存
   → 不具合内容を field7 に追記
   → 住所・電話変更を Description に追記
   → メール同意を Email_Opt_Out に更新
```

---

## 管理画面

### 16. 事前見積画面

**パス:** `/admin/pre-estimate/[id]`  
**ファイル:** `src/app/admin/pre-estimate/[id]/page.tsx`  
**アクセス権限:** 事務所スタッフ（ログイン不要）

#### 15.1 目的

コーティングなどの事前見積もりを作成し、顧客に送信する。

#### 15.2 主要機能

##### 15.2.1 コーティング事前見積

**機能:**
- `CoatingPreEstimateView` コンポーネント
- コーティングタイプ選択（ハイモースコート エッジ、ハイモースコート グロウ、ガードグレイズ）
- オプション選択（ホイールコーティング、ウィンドウ撥水、ヘッドライト研磨、インテリアクリーニング、バンパーコート、ウィンドウフィルム、幌コーティング）
- 同時施工割引率の適用
- 価格計算（数値マスタから取得）

##### 15.2.2 見積送信

**機能:**
- LINE通知（`sendLineNotification()`）
- メール送信（`sendEstimateEmail()`）
- マジックリンク生成（`generateMagicLink()`）

#### 15.3 データフロー

```
1. ページロード
   → fetchJobById(jobId) → Zoho CRM API
   → 数値マスタからコーティング価格を取得

2. 見積送信
   → 見積データを構築
   → generateMagicLink() → マジックリンク生成
   → sendLineNotification() / sendEstimateEmail() → 通知送信
```

---

### 17. お知らせ管理画面

**パス:** `/admin/announcements`  
**ファイル:** `src/app/admin/announcements/page.tsx`  
**アクセス権限:** 管理者（ログイン不要）

#### 16.1 目的

トップページに表示されるお知らせバナーを管理する。

#### 16.2 主要機能

##### 16.2.1 お知らせ一覧

**表示内容:**
- メッセージ
- 背景色、テキスト色
- 有効期限
- 優先度
- 期限切れバッジ

##### 16.2.2 お知らせ追加・編集

**入力項目:**
- メッセージ（必須）
- 背景色（選択）
- テキスト色（選択）
- 優先度（数値）
- 有効期限（日時、任意）

##### 16.2.3 プレビュー機能

**機能:**
- `AnnouncementBanner` コンポーネントでプレビュー表示

##### 16.2.4 削除機能

**機能:**
- お知らせの削除（確認ダイアログ付き）

#### 16.3 データフロー

```
1. ページロード
   → getStoredAnnouncements() → localStorage
   → お知らせ一覧を表示

2. 保存処理
   → saveStoredAnnouncements() → localStorage
   → お知らせを保存
```

---

### 18. ブログ写真管理画面

**パス:** `/admin/blog-photos`  
**ファイル:** `src/app/admin/blog-photos/page.tsx`  
**アクセス権限:** 管理者（ログイン不要）

#### 17.1 目的

公開済みのブログ用写真を一覧表示・管理する。

#### 17.2 主要機能

##### 17.2.1 統計カード

**表示内容:**
- 総数
- 日付別（`category = 'by-date'`）
- 作業種類別（`category = 'by-service'`）
- 車種別（`category = 'by-vehicle-type'`）
- Before/After（`category = 'before-after'`）

##### 17.2.2 フィルター機能

**フィルター項目:**
- カテゴリ（すべて、日付別、作業種類別、車種別、Before/After）

##### 17.2.3 写真一覧

**表示内容:**
- 写真サムネイル（グリッド表示）
- カテゴリバッジ
- Before/Afterバッジ
- ファイル名

##### 17.2.4 写真詳細ダイアログ

**表示内容:**
- 写真（拡大表示）
- ファイル名
- カテゴリ
- 撮影日（`metadata.date`）
- 車種（`metadata.vehicleName`）
- 作業種類（`metadata.serviceKind`）
- 種類（`metadata.type`）
- フォルダパス（`folderPath`）
- 作成日時（`createdTime`）

#### 17.3 データフロー

```
1. ページロード
   → fetchBlogPhotos({ category }) → Blog Photos API
   → Google Driveから公開済み写真を取得
   → 写真一覧を表示
```

---

### 19. 数値マスタ管理画面

**パス:** `/admin/settings/numerical-masters`  
**ファイル:** `src/app/admin/settings/numerical-masters/page.tsx`  
**アクセス権限:** 管理者（ログイン不要）

#### 18.1 目的

システムで使用する閾値、時間設定、料金設定、メンテナンスメニューの所要時間を管理する。

#### 18.2 主要機能

##### 18.2.1 閾値設定

**設定項目:**
- 長期化承認待ちの閾値（日数）
- 長期化部品調達の閾値（日数）
- 緊急案件の閾値（時間）
  - 高緊急度の閾値
  - 中緊急度の閾値
- タイヤ検査の閾値（mm）
  - 法定基準
  - 推奨基準

##### 18.2.2 時間設定

**設定項目:**
- 出庫予定時間の推定（時間）

##### 18.2.3 料金設定

**設定項目:**
- コーティング料金（円）
  - ハイモースコート エッジ
  - ハイモースコート グロウ
  - ガードグレイズ
- コーティングオプション料金（円）
  - ホイールコーティング（4本セット）
  - ウィンドウ撥水（フロント三面）
  - ヘッドライト研磨・クリアコート（左右2個）
  - インテリアクリーニング
  - バンパーコート（1本）
  - ウィンドウフィルム（1面）
  - 幌コーティング
- 同時施工割引率（%）

##### 18.2.4 メンテナンスメニューの所要時間

**設定項目:**
- 各メンテナンスメニューの所要時間（分）

#### 18.3 データフロー

```
1. ページロード
   → getNumericalMasterConfig() → localStorage
   → 設定値を読み込み

2. 保存処理
   → saveNumericalMasterConfig(config) → localStorage
   → 設定値を保存

3. リセット処理
   → resetNumericalMasterConfig() → localStorage
   → デフォルト値にリセット
```

---

## 共通機能・コンポーネント

### 共通UIコンポーネント

#### AppHeader

**ファイル:** `src/components/layout/app-header.tsx`

**機能:**
- アプリケーションのヘッダー
- ブランド名「デジタルガレージ」（`whitespace-nowrap` で改行防止）
- 検索バー（トップページのみ）
- ナビゲーション

#### JobCard

**ファイル:** `src/components/features/job-card.tsx`

**機能:**
- 案件カードの表示
- 顧客名、車両名、入庫区分、工程ステージ
- アラートアイコン（事前入力、作業指示、エラーロンプ）
- アクションボタン（チェックイン、診断、見積、作業）

#### CompactJobHeader

**ファイル:** `src/components/layout/compact-job-header.tsx`

**機能:**
- 診断・作業画面のコンパクトなヘッダー
- 案件情報の表示
- 戻るボタン

### 共通機能

#### 画像圧縮

**ファイル:** `src/lib/compress.ts`

**機能:**
- `browser-image-compression` を使用
- 500KB以下に圧縮
- クライアントサイドで実行

#### Google Drive連携

**ファイル:** `src/lib/google-drive.ts`

**機能:**
- フォルダ作成・取得（`getOrCreateJobFolder()`）
- ファイルアップロード（`uploadFile()`）
- ファイル検索（`searchInvoicePdf()`）

#### Zoho CRM連携

**ファイル:** `src/lib/api.ts`, `src/lib/zoho-api-client.ts`

**機能:**
- 案件取得（`fetchJobById()`）
- 案件更新（`updateJob()`）
- ステータス更新（`updateJobStatus()`）
- 顧客取得（`fetchCustomerById()`）
- 車両取得（`fetchVehicleById()`）

#### LINE通知

**ファイル:** `src/lib/line-api.ts`

**機能:**
- マジックリンク生成（`generateMagicLink()`）
- LINE通知送信（`sendLineNotification()`）

#### メール送信

**ファイル:** `src/lib/email-api.ts`

**機能:**
- 見積メール送信（`sendEstimateEmail()`）

---

## データモデル

### WorkOrder

**定義:** `src/types/index.ts`

```typescript
interface WorkOrder {
  id: string;
  serviceKind: ServiceKind;
  diagnosis: DiagnosisData;
  estimate: EstimateData;
  work: WorkData;
}
```

### DiagnosisData

```typescript
interface DiagnosisData {
  mechanicName?: string;
  items: DiagnosisItem[];
  photos: PhotoItem[];
  videos: VideoItem[];
  // 入庫区分別の詳細データ
}
```

### EstimateData

```typescript
interface EstimateData {
  items: EstimateItem[];
  total: number;
  expiresAt?: string;
}
```

### WorkData

```typescript
interface WorkData {
  mechanicName?: string;
  completedAt?: string;
  records: WorkRecord[];
}
```

### WorkRecord

```typescript
interface WorkRecord {
  id: string;
  date: string;
  content: string;
  duration: number;
  photoUrls: Array<{ type: "before" | "after"; url: string; fileId?: string }>;
  comment?: string;
  mechanicName?: string;
}
```

---

## エラーハンドリング

### 共通エラーハンドリング

- APIエラー時: `toast.error()` で通知
- ローディング状態: `Skeleton` コンポーネントで表示
- エラーバウンダリー: Next.jsのエラーハンドリングを使用

### バリデーション

- フォーム入力のバリデーション
- 必須項目チェック
- データ型チェック

---

## パフォーマンス最適化

### キャッシング

- **SWR:** データフェッチングのキャッシング
- **Revalidation:** 適切な再検証間隔の設定

### 画像最適化

- **Next.js Image:** `next/image` コンポーネントを使用
- **圧縮:** クライアントサイドで画像圧縮（500KB以下）

### コード分割

- **Dynamic Import:** 必要に応じて動的インポート
- **Lazy Loading:** コンポーネントの遅延読み込み

---

## セキュリティ

### 認証

- **NextAuth.js:** Google OAuth認証
- **マジックリンク:** 顧客向けページの認証

### データ保護

- **環境変数:** 機密情報は環境変数で管理
- **API認証:** Zoho CRM API、Google APIの認証

---

## アクセシビリティ

### WCAG 2.1 AA準拠

- **コントラスト比:** 4.5:1以上
- **タッチターゲット:** 最小48px × 48px
- **フォントサイズ:** 16px以上（`text-base`）

### キーボードナビゲーション

- **フォーカス管理:** 適切なフォーカス順序
- **ARIAラベル:** スクリーンリーダー対応

---

## レスポンシブデザイン

### ブレークポイント

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

### 対応方針

- **Mobile First:** モバイルファーストで設計
- **Flexible Layout:** グリッドレイアウトで柔軟に対応

---

## テスト

### テスト方針

- **Unit Test:** ユニットテスト（今後実装予定）
- **Integration Test:** 統合テスト（今後実装予定）
- **E2E Test:** エンドツーエンドテスト（今後実装予定）

---

## 今後の拡張予定

### 未実装機能

- 代車の利用履歴管理
- 部品調達待ち案件の詳細管理
- 動画のアプリ内埋め込み（現在は外部リンク）
- リアルタイム通知（WebSocket）
- オフライン対応（Service Worker）

---

## 更新履歴

- **2025-01:** 初版作成
- **2025-01:** 抜け漏れ補完（機能コンポーネント、ライブラリ関数、APIルート、特殊機能、型定義の詳細を追加）

---

## 機能コンポーネント詳細

### 診断関連コンポーネント

#### InspectionEntryChecklistDialog
**ファイル:** `src/components/features/inspection-entry-checklist-dialog.tsx`

**機能:**
- 車検入庫時のチェックリスト入力
- チェック項目: 車検証、自賠責、自動車税、鍵、ホイールロックナット、ETCカード、車内貴重品
- 備考入力
- チェック完了日時の記録

**データ保存:**
- `field7` にJSON形式で保存（`InspectionChecklist`型）

#### InspectionCheckoutChecklistDialog
**ファイル:** `src/components/features/inspection-checkout-checklist-dialog.tsx`

**機能:**
- 車検出庫時のチェックリスト入力
- チェック項目: 車検証、自動車検査証記録事項、自賠責、記録簿、鍵、ホイールロックナット、ETCカード抜き忘れ、ホイール増し締め
- 備考入力
- チェック完了日時の記録

#### ErrorLampInputDialog
**ファイル:** `src/components/features/error-lamp-input-dialog.tsx`

**機能:**
- エラーロンプ情報の入力
- エラーロンプの種類選択（エンジン、ABS、エアバッグ、その他）
- 点灯状況（常時点灯、点滅、消灯）
- メモ入力

**データ保存:**
- `field7` にJSON形式で保存（`ErrorLampInfo`型）

#### DiagnosisFeeDialog
**ファイル:** `src/components/features/diagnosis-fee-dialog.tsx`

**機能:**
- 診断料金の入力
- 診断時間（概算・分）の入力
- 診断料金が事前に決まっているかのフラグ

**データ保存:**
- `field23` または `field7` に保存

#### TemporaryReturnDialog
**ファイル:** `src/components/features/temporary-return-dialog.tsx`

**機能:**
- 一時帰宅の記録
- 一時帰宅日時
- 再入庫予定日時
- 理由・備考

**データ保存:**
- `field7` にJSON形式で保存（`TemporaryReturnData`型）
- `field5` を「再入庫待ち」に更新

#### JobMemoDialog
**ファイル:** `src/components/features/job-memo-dialog.tsx`

**機能:**
- 作業メモの追加・編集・削除
- メモ内容、作成者名、作成日時

**データ保存:**
- `field26` にJSON形式で保存（`JobMemo[]`型）

#### DiagnosisPreviewDialog
**ファイル:** `src/components/features/diagnosis-preview-dialog.tsx`

**機能:**
- 診断結果のプレビュー表示
- 診断項目、写真、動画、コメントの確認

### 見積関連コンポーネント

#### PartsListInput
**ファイル:** `src/components/features/parts-list-input.tsx`

**機能:**
- 部品リストの入力・編集
- 部品名、部品番号、数量、単価、発注先、発注日、到着予定日、在庫場所

**データ保存:**
- `field26` にJSON形式で保存（`PartsInfo`型）

#### PartsArrivalDialog
**ファイル:** `src/components/features/parts-arrival-dialog.tsx`

**機能:**
- 部品到着通知の送信
- 到着した部品リストの表示
- 連絡方法の選択（LINE、メール、電話）
- メッセージテンプレートの生成
- Zoho Bookings予約リンクの挿入

#### PartsInfoDialog
**ファイル:** `src/components/features/parts-info-dialog.tsx`

**機能:**
- 部品情報の詳細表示
- 部品の調達状況、到着予定日、実際の到着日
- 部品ステータスの更新

#### InvoiceUpload
**ファイル:** `src/components/features/invoice-upload.tsx`

**機能:**
- 請求書PDFのアップロード
- Google Driveへの保存
- ファイル名に「invoice」「seikyu」「請求書」を含める必要がある

#### EstimateTemplateDialog
**ファイル:** `src/components/features/estimate-template-dialog.tsx`

**機能:**
- 見積テンプレートの選択・適用
- テンプレートの作成・編集・削除

**データ保存:**
- `localStorage` に保存（`template-storage.ts`）

#### HistoricalEstimateDialog
**ファイル:** `src/components/features/historical-estimate-dialog.tsx`

**機能:**
- 過去の見積もりの参照
- 顧客・車両に基づく過去見積の検索
- 過去見積の項目を現在の見積にコピー

#### HistoricalJobDialog
**ファイル:** `src/components/features/historical-job-dialog.tsx`

**機能:**
- 過去の案件の参照
- 顧客・車両に基づく過去案件の検索
- 過去案件の情報を現在の案件にコピー

#### EstimateChangeHistorySection
**ファイル:** `src/components/features/estimate-change-history-section.tsx`

**機能:**
- 見積変更履歴の表示
- 変更依頼、変更内容、対応状況

**データ保存:**
- `localStorage` に保存（`estimate-change-storage.ts`）

#### EstimatePreviewDialog
**ファイル:** `src/components/features/estimate-preview-dialog.tsx`

**機能:**
- 見積もりのプレビュー表示
- 顧客から見える見積画面の確認

### 作業関連コンポーネント

#### ReplacementPartsRecorder
**ファイル:** `src/components/features/replacement-parts-recorder.tsx`

**機能:**
- 交換部品の記録
- 交換前・交換後の部品情報
- 交換日時、担当者

#### QualityInspectionSection
**ファイル:** `src/components/features/quality-inspection-section.tsx`

**機能:**
- 品質検査項目の入力
- 検査結果（合格、不合格、保留、該当なし）
- 検査者名、検査日時

**データ保存:**
- `WorkOrder.work.qualityInspection` に保存

#### ManufacturerInquirySection
**ファイル:** `src/components/features/manufacturer-inquiry-section.tsx`

**機能:**
- メーカー問い合わせの記録
- 問い合わせ内容、問い合わせ方法、メーカー名、担当者名
- 回答日時、回答内容

**データ保存:**
- `WorkOrder.diagnosis.manufacturerInquiry` に保存

#### RestoreProgressSection
**ファイル:** `src/components/features/restore-progress-section.tsx`

**機能:**
- レストア工程の進捗管理
- 各工程の進捗率、開始日、予定終了日、実際の終了日
- 工程ごとの備考

**データ保存:**
- `WorkOrder.work.restoreProgress` に保存

#### CoatingWorkManagement
**ファイル:** `src/components/features/coating-work-management.tsx`

**機能:**
- コーティング作業の管理
- 乾燥工程、メンテナンス期間の記録

**データ保存:**
- `WorkOrder.work.coatingInfo` に保存

### 入庫区分別見積ビュー

#### BodyPaintEstimateView
**ファイル:** `src/components/features/body-paint-estimate-view.tsx`

**機能:**
- 板金・塗装の見積項目作成
- 損傷箇所ごとの見積項目
- 外注先見積の反映

#### RestoreEstimateView
**ファイル:** `src/components/features/restore-estimate-view.tsx`

**機能:**
- レストアの見積項目作成
- 修復箇所ごとの見積項目

#### OtherServiceEstimateView
**ファイル:** `src/components/features/other-service-estimate-view.tsx`

**機能:**
- その他のサービスの見積項目作成
- 診断項目に基づく見積項目

#### FaultDiagnosisEstimateView
**ファイル:** `src/components/features/fault-diagnosis-estimate-view.tsx`

**機能:**
- 故障診断の見積項目作成
- 症状・エラーコードに基づく見積項目

### その他の機能コンポーネント

#### WorkOrderPDFGenerator
**ファイル:** `src/lib/work-order-pdf-generator.ts`

**機能:**
- 作業指示書PDFの生成
- 日本語フォント対応（Noto Sans JP）
- 基本情報、顧客からの申し送り事項、受付メモ、承認済み作業内容の表示
- 過去の作業履歴の表示（オプション）

#### VideoCallDialog
**ファイル:** `src/components/features/video-call-dialog.tsx`

**機能:**
- ビデオ通話の開始
- WebRTCシグナリング（`/api/webrtc/signal`）

#### VideoShareDialog
**ファイル:** `src/components/features/video-share-dialog.tsx`

**機能:**
- 動画の共有
- Google Driveへのアップロード
- 共有リンクの生成

#### OfflineBanner
**ファイル:** `src/components/features/offline-banner.tsx`

**機能:**
- オフライン状態の表示
- ネットワーク接続状態の監視

#### UploadQueueIndicator
**ファイル:** `src/components/features/upload-queue-indicator.tsx`

**機能:**
- アップロードキューの状態表示
- 待機中・アップロード中・完了・失敗の件数表示

#### AutoSaveIndicator
**ファイル:** `src/components/features/auto-save-indicator.tsx`

**機能:**
- 自動保存の状態表示
- 保存中・保存完了・保存失敗の表示

#### SaveStatusIndicator
**ファイル:** `src/components/features/save-status-indicator.tsx`

**機能:**
- 保存ステータスの表示
- 未保存・保存中・保存済みの表示

#### SyncIndicator
**ファイル:** `src/components/features/sync-indicator.tsx`

**機能:**
- 同期状態の表示
- 同期中・同期完了・同期失敗の表示

#### RouteGuard
**ファイル:** `src/components/features/route-guard.tsx`

**機能:**
- ルートの認証・認可チェック
- ロールベースアクセス制御（RBAC）

#### LongTermProjectDetailDialog
**ファイル:** `src/components/features/long-term-project-detail-dialog.tsx`

**機能:**
- 長期プロジェクトの詳細表示
- 進捗状況、作業記録、写真

#### CustomerDetailDialog
**ファイル:** `src/components/features/customer-detail-dialog.tsx`

**機能:**
- 顧客情報の詳細表示
- 顧客マスタ情報、過去の案件履歴

#### VehicleDetailDialog
**ファイル:** `src/components/features/vehicle-detail-dialog.tsx`

**機能:**
- 車両情報の詳細表示
- 車両マスタ情報、過去の整備履歴

#### MechanicDetailDialog
**ファイル:** `src/components/features/mechanic-detail-dialog.tsx`

**機能:**
- 整備士情報の詳細表示
- スキル情報、担当案件

#### CustomerProgressView
**ファイル:** `src/components/features/customer-progress-view.tsx`

**機能:**
- 顧客向けの進捗表示
- 工程ごとの進捗状況

#### ServiceKindSummaryCard
**ファイル:** `src/components/features/service-kind-summary-card.tsx`

**機能:**
- 入庫区分別のサマリー表示
- 各入庫区分の案件数、進捗状況

#### MechanicSummaryCard
**ファイル:** `src/components/features/mechanic-summary-card.tsx`

**機能:**
- 整備士別のサマリー表示
- 各整備士の担当案件数、進捗状況

#### UnifiedSummaryCard
**ファイル:** `src/components/features/unified-summary-card.tsx`

**機能:**
- 統合サマリーカード
- 複数の指標を一つのカードに表示

#### SummaryCarousel
**ファイル:** `src/components/features/summary-carousel.tsx`

**機能:**
- サマリーカードのカルーセル表示
- スワイプで複数のサマリーを表示

#### JobSearchBar
**ファイル:** `src/components/features/job-search-bar.tsx`

**機能:**
- 案件検索バー
- 顧客名・車両名・ナンバープレートでの検索

#### ServiceKindFilter
**ファイル:** `src/components/features/service-kind-filter.tsx`

**機能:**
- 入庫区分フィルター
- 複数選択可能

#### StatusQuickFilter
**ファイル:** `src/components/features/status-quick-filter.tsx`

**機能:**
- ステータスクイックフィルター
- よく使うステータスの組み合わせ

#### SmartTagInventoryCard
**ファイル:** `src/components/features/smart-tag-inventory-card.tsx`

**機能:**
- スマートタグ在庫の表示
- 空きタグ、使用中タグ、メンテナンス中タグの表示

#### SmartTagScanDialog
**ファイル:** `src/components/features/smart-tag-scan-dialog.tsx`

**機能:**
- スマートタグのQRコードスキャン
- タグと案件の紐付け

#### QRScanDialog
**ファイル:** `src/components/features/qr-scan-dialog.tsx`

**機能:**
- 汎用QRコードスキャン
- カメラアクセス、QRコード読み取り

#### CourtesyCarInventoryCard
**ファイル:** `src/components/features/courtesy-car-inventory-card.tsx`

**機能:**
- 代車在庫の表示
- 空き代車、使用中代車、点検中代車の表示

#### CourtesyCarListDialog
**ファイル:** `src/components/features/courtesy-car-list-dialog.tsx`

**機能:**
- 代車リストの表示
- 代車の選択

#### LegalFeesCard
**ファイル:** `src/components/features/legal-fees-card.tsx`

**機能:**
- 法定費用の表示
- 車検費用、自賠責保険料、自動車税の表示

#### OptionMenuSelector
**ファイル:** `src/components/features/option-menu-selector.tsx`

**機能:**
- オプションメニューの選択
- 12ヶ月点検用のオプションメニュー

#### WorkProgressBar
**ファイル:** `src/components/features/work-progress-bar.tsx`

**機能:**
- 作業進捗バー
- 完了項目数 / 全項目数の表示

#### TrafficLightButton
**ファイル:** `src/components/features/traffic-light-button.tsx`

**機能:**
- 信号機方式のボタン
- 緑（OK）、黄（Warning）、赤（Critical）の状態表示

#### PhotoCaptureButton
**ファイル:** `src/components/features/photo-capture-button.tsx`

**機能:**
- 写真撮影ボタン
- カメラアクセス、画像圧縮、アップロード

#### VideoCaptureButton
**ファイル:** `src/components/features/video-capture-button.tsx`

**機能:**
- 動画撮影ボタン
- カメラアクセス、動画録画、アップロード

#### AudioInputButton
**ファイル:** `src/components/features/audio-input-button.tsx`

**機能:**
- 音声入力ボタン
- マイクアクセス、音声録音、音声認識（Gemini API）

#### PhotoManager
**ファイル:** `src/components/features/photo-manager.tsx`

**機能:**
- 写真の管理
- 写真のアップロード・削除・プレビュー

#### BlogPhotoCaptureDialog
**ファイル:** `src/components/features/blog-photo-capture-dialog.tsx`

**機能:**
- ブログ用写真の撮影
- カテゴリ選択、公開可否設定

#### BlogPhotoSelector
**ファイル:** `src/components/features/blog-photo-selector.tsx`

**機能:**
- ブログ用写真の選択
- 公開する写真の選択

#### WorkOrderDialog
**ファイル:** `src/components/features/work-order-dialog.tsx`

**機能:**
- ワークオーダーの追加・編集
- 入庫区分の選択、ワークオーダーの作成

#### AddWorkOrderDialog
**ファイル:** `src/components/features/add-work-order-dialog.tsx`

**機能:**
- ワークオーダーの追加
- 入庫区分の選択

#### WorkOrderSelector
**ファイル:** `src/components/features/work-order-selector.tsx`

**機能:**
- ワークオーダーの選択
- 複数のワークオーダーから選択

---

## ライブラリ関数詳細

### ワークオーダー変換

#### work-order-converter.ts
**ファイル:** `src/lib/work-order-converter.ts`

**主要関数:**
- `convertZohoJobToBaseJob()` - ZohoJobからBaseJobに変換
- `parseWorkOrdersFromZoho()` - Zohoのfield_work_ordersからWorkOrder[]に変換
- `serializeWorkOrdersForZoho()` - WorkOrder[]をZohoのfield_work_ordersに変換
- `convertBaseJobToZohoUpdate()` - BaseJobからZoho更新データに変換
- `createWorkOrder()` - ワークオーダーを作成
- `updateWorkOrder()` - ワークオーダーを更新
- `removeWorkOrder()` - ワークオーダーを削除

### 部品管理

#### parts-info-utils.ts
**ファイル:** `src/lib/parts-info-utils.ts`

**主要関数:**
- `parsePartsInfoFromField26()` - field26から部品情報をパース
- `savePartsInfoToField26()` - field26に部品情報を保存
- `createInitialPartsInfo()` - 部品情報を初期化
- `createInitialPartItem()` - 部品項目を初期化
- `areAllPartsArrived()` - すべての部品が到着済みかどうかを判定
- `updatePartStatus()` - 部品の調達状況を更新
- `getPartsProcurementDays()` - 部品調達期間を計算
- `isLongPartsProcurement()` - 部品調達が長期化しているかどうかを判定
- `hasOverdueParts()` - 部品の到着予定日が過ぎているかどうかを判定
- `hasUpcomingPartsArrival()` - 部品の到着予定日が近づいているかどうかを判定

### オフライン対応

#### offline-storage.ts
**ファイル:** `src/lib/offline-storage.ts`

**主要関数:**
- `openDB()` - IndexedDBデータベースを開く
- `saveToIndexedDB()` - IndexedDBにデータを保存
- `getFromIndexedDB()` - IndexedDBからデータを取得
- `getAllFromIndexedDB()` - IndexedDBからすべてのデータを取得
- `deleteFromIndexedDB()` - IndexedDBからデータを削除

**ストア:**
- `JOBS` - ジョブデータ
- `WORK_ORDERS` - ワークオーダーデータ
- `DIAGNOSIS` - 診断データ
- `ESTIMATES` - 見積データ
- `WORK` - 作業データ
- `FILES` - ファイルデータ（Blob）
- `SYNC_QUEUE` - 同期キュー

#### upload-queue.ts
**ファイル:** `src/lib/upload-queue.ts`

**主要関数:**
- `addToUploadQueue()` - ファイルをアップロードキューに追加
- `getPendingUploadQueue()` - アップロードキューから取得（pendingのみ）
- `getUploadQueueEntry()` - アップロードキューエントリを取得
- `updateUploadQueueEntry()` - アップロードキューエントリを更新
- `removeUploadQueueEntry()` - アップロードキューエントリを削除
- `processUploadQueue()` - アップロードキューを処理

### リアルタイム通信

#### realtime-client.ts
**ファイル:** `src/lib/realtime-client.ts`

**主要機能:**
- Server-Sent Events (SSE) 方式でリアルタイム更新を取得
- イベントハンドラー: `onJobUpdated`, `onJobCreated`, `onJobDeleted`, `onWorkOrderUpdated`, `onWorkOrderCreated`, `onDiagnosisUpdated`, `onEstimateUpdated`, `onWorkUpdated`, `onSyncRequired`
- 自動再接続機能

#### webrtc-signaling.ts
**ファイル:** `src/lib/webrtc-signaling.ts`

**主要機能:**
- WebRTCシグナリング
- ビデオ通話のセッション管理

### 同期管理

#### sync-manager.ts
**ファイル:** `src/lib/sync-manager.ts`

**主要機能:**
- オフライン時のデータ同期
- オンライン復帰時の自動同期
- 競合解決

### PDF生成

#### work-order-pdf-generator.ts
**ファイル:** `src/lib/work-order-pdf-generator.ts`

**主要関数:**
- `generateWorkOrderPDF()` - 作業指示書PDFを生成
- 日本語フォント対応（Noto Sans JP）
- 基本情報、顧客からの申し送り事項、受付メモ、承認済み作業内容の表示

#### inspection-pdf-generator.ts
**ファイル:** `src/lib/inspection-pdf-generator.ts`

**主要関数:**
- 点検結果PDFの生成
- 点検項目、写真、コメントの表示

#### inspection-template-pdf-generator.ts
**ファイル:** `src/lib/inspection-template-pdf-generator.ts`

**主要関数:**
- 点検テンプレートPDFの生成
- 点検項目のテンプレート化

### パーサー

#### inspection-checklist-parser.ts
**ファイル:** `src/lib/inspection-checklist-parser.ts`

**主要関数:**
- `parseInspectionChecklistFromField7()` - field7から車検チェックリストをパース
- `appendInspectionChecklistToField7()` - field7に車検チェックリストを追記

#### temporary-return-parser.ts
**ファイル:** `src/lib/temporary-return-parser.ts`

**主要関数:**
- `parseTemporaryReturnFromField7()` - field7から一時帰宅情報をパース
- `appendTemporaryReturnToField7()` - field7に一時帰宅情報を追記

#### job-memo-parser.ts
**ファイル:** `src/lib/job-memo-parser.ts`

**主要関数:**
- `parseJobMemosFromField26()` - field26から作業メモをパース
- `appendJobMemoToField26()` - field26に作業メモを追記

#### error-lamp-parser.ts
**ファイル:** `src/lib/error-lamp-parser.ts`

**主要関数:**
- `parseErrorLampFromField7()` - field7からエラーロンプ情報をパース
- `appendErrorLampToField7()` - field7にエラーロンプ情報を追記

### バリデーション

#### customer-field-validation.ts
**ファイル:** `src/lib/customer-field-validation.ts`

**主要関数:**
- 顧客フィールドのバリデーション
- 必須項目チェック、データ型チェック

#### lookup-field-validation.ts
**ファイル:** `src/lib/lookup-field-validation.ts`

**主要関数:**
- ルックアップフィールドのバリデーション
- 参照先の存在確認

#### zoho-lookup-validation.ts
**ファイル:** `src/lib/zoho-lookup-validation.ts`

**主要関数:**
- Zohoルックアップフィールドのバリデーション
- 参照先の存在確認

#### file-validation.ts
**ファイル:** `src/lib/file-validation.ts`

**主要関数:**
- ファイルのバリデーション
- ファイルサイズ、MIMEタイプ、拡張子のチェック

### 顧客・車両管理

#### new-vehicle-creation.ts
**ファイル:** `src/lib/new-vehicle-creation.ts`

**主要関数:**
- 新規車両の作成
- Zoho CRMへの車両登録

#### new-vehicle-image-upload.ts
**ファイル:** `src/lib/new-vehicle-image-upload.ts`

**主要関数:**
- 新規車両の画像アップロード
- 車検証画像のアップロード

#### vehicle-registration-upload.ts
**ファイル:** `src/lib/vehicle-registration-upload.ts`

**主要関数:**
- 車検証のアップロード
- Google Driveへの保存

#### customer-description-append.ts
**ファイル:** `src/lib/customer-description-append.ts`

**主要関数:**
- 顧客のDescriptionフィールドに追記
- 住所・電話変更依頼の記録

#### customer-update.ts
**ファイル:** `src/lib/customer-update.ts`

**主要関数:**
- 顧客情報の更新
- 直接更新可能なフィールドのみ更新

### ストレージ

#### template-storage.ts
**ファイル:** `src/lib/template-storage.ts`

**主要関数:**
- テンプレートの保存・取得
- `localStorage` に保存

#### estimate-change-storage.ts
**ファイル:** `src/lib/estimate-change-storage.ts`

**主要関数:**
- 見積変更履歴の保存・取得
- `localStorage` に保存

#### pre-estimate-storage.ts
**ファイル:** `src/lib/pre-estimate-storage.ts`

**主要関数:**
- 事前見積の保存・取得
- `localStorage` に保存

#### announcement-storage.ts
**ファイル:** `src/lib/announcement-storage.ts`

**主要関数:**
- お知らせの保存・取得
- `localStorage` に保存

#### mechanic-skill-storage.ts
**ファイル:** `src/lib/mechanic-skill-storage.ts`

**主要関数:**
- 整備士スキル情報の保存・取得
- `localStorage` に保存

### ユーティリティ

#### pending-approval-utils.ts
**ファイル:** `src/lib/pending-approval-utils.ts`

**主要関数:**
- 承認待ち案件の判定
- 長期化承認待ちの判定

#### long-term-project-utils.ts
**ファイル:** `src/lib/long-term-project-utils.ts`

**主要関数:**
- 長期プロジェクトの判定
- 長期プロジェクトのフィルタリング

#### analytics-utils.ts
**ファイル:** `src/lib/analytics-utils.ts`

**主要関数:**
- 分析データの集計
- トレンド計算

#### search-utils.ts
**ファイル:** `src/lib/search-utils.ts`

**主要関数:**
- 検索機能のユーティリティ
- 全文検索、フィルタリング

#### filter-utils.ts
**ファイル:** `src/lib/filter-utils.ts`

**主要関数:**
- フィルター機能のユーティリティ
- 複数条件の組み合わせ

#### navigation-history.ts
**ファイル:** `src/lib/navigation-history.ts`

**主要関数:**
- ナビゲーション履歴の管理
- 戻るボタンの実装

#### search-history.ts
**ファイル:** `src/lib/search-history.ts`

**主要関数:**
- 検索履歴の管理
- 最近の検索の表示

#### haptic-feedback.ts
**ファイル:** `src/lib/haptic-feedback.ts`

**主要関数:**
- 触覚フィードバック
- ボタンクリック時の振動

#### action-tracking.ts
**ファイル:** `src/lib/action-tracking.ts`

**主要関数:**
- アクションの追跡
- 使用状況の分析

#### feedback-utils.ts
**ファイル:** `src/lib/feedback-utils.ts`

**主要関数:**
- フィードバック機能のユーティリティ
- フィードバックの送信

#### important-customer-flag.ts
**ファイル:** `src/lib/important-customer-flag.ts`

**主要関数:**
- 重要顧客フラグの管理
- 重要顧客の判定

### エラーハンドリング

#### error-handling.ts
**ファイル:** `src/lib/error-handling.ts`

**主要関数:**
- エラーハンドリングのユーティリティ
- エラーメッセージの表示

#### server-error-handling.ts
**ファイル:** `src/lib/server-error-handling.ts`

**主要関数:**
- サーバー側のエラーハンドリング
- エラーレスポンスの生成

#### zoho-error-handler.ts
**ファイル:** `src/lib/zoho-error-handler.ts`

**主要関数:**
- Zoho APIエラーのハンドリング
- エラーメッセージの変換

#### api-retry.ts
**ファイル:** `src/lib/api-retry.ts`

**主要関数:**
- APIリトライ機能
- 指数バックオフ

#### api-timing.ts
**ファイル:** `src/lib/api-timing.ts`

**主要関数:**
- APIタイミングの計測
- パフォーマンス分析

### 認証・セキュリティ

#### rbac.ts
**ファイル:** `src/lib/rbac.ts`

**主要関数:**
- ロールベースアクセス制御
- 権限チェック

#### csrf.ts
**ファイル:** `src/lib/csrf.ts`

**主要関数:**
- CSRFトークンの生成・検証
- クライアント側のCSRF保護

#### server-csrf.ts
**ファイル:** `src/lib/server-csrf.ts`

**主要関数:**
- サーバー側のCSRF保護
- CSRFトークンの検証

#### google-auth.ts
**ファイル:** `src/lib/google-auth.ts`

**主要関数:**
- Google認証
- OAuth 2.0 フロー

### 設定・マスタ

#### coating-config.ts
**ファイル:** `src/lib/coating-config.ts`

**主要関数:**
- コーティング設定の取得
- コーティングタイプ、オプションの定義

#### body-paint-config.ts
**ファイル:** `src/lib/body-paint-config.ts`

**主要関数:**
- 板金・塗装設定の取得
- 損傷種類、深刻度の定義

#### restore-config.ts
**ファイル:** `src/lib/restore-config.ts`

**主要関数:**
- レストア設定の取得
- レストアタイプ、工程の定義

#### tuning-parts-config.ts
**ファイル:** `src/lib/tuning-parts-config.ts`

**主要関数:**
- チューニング・パーツ取付設定の取得
- チューニングタイプの定義

#### maintenance-menu-config.ts
**ファイル:** `src/lib/maintenance-menu-config.ts`

**主要関数:**
- メンテナンスメニュー設定の取得
- メンテナンスメニューの定義

#### labor-cost-master.ts
**ファイル:** `src/lib/labor-cost-master.ts`

**主要関数:**
- 工賃マスタの取得
- 作業時間、工賃の計算

#### numerical-master-config.ts
**ファイル:** `src/lib/numerical-master-config.ts`

**主要関数:**
- 数値マスタ設定の取得・保存
- 閾値、時間設定、料金設定の管理

### その他

#### blog-photo-manager.ts
**ファイル:** `src/lib/blog-photo-manager.ts`

**主要関数:**
- ブログ写真の管理
- 公開フォルダへのコピー

#### photo-position.ts
**ファイル:** `src/lib/photo-position.ts`

**主要関数:**
- 写真位置の定義
- 撮影位置の管理

#### japanese-font.ts / japanese-font-data.ts
**ファイル:** `src/lib/japanese-font.ts`, `src/lib/japanese-font-data.ts`

**主要関数:**
- 日本語フォントの読み込み
- PDF生成時の日本語対応

#### version.ts
**ファイル:** `src/lib/version.ts`

**主要関数:**
- バージョン管理
- アプリバージョンの取得

#### zoho-batch.ts
**ファイル:** `src/lib/zoho-batch.ts`

**主要関数:**
- Zohoバッチ処理
- 複数レコードの一括更新

#### inspection-delivery.ts
**ファイル:** `src/lib/inspection-delivery.ts`

**主要関数:**
- 点検引き渡し処理
- 点検結果の顧客への送信

### API関数詳細（src/lib/api.ts）

**ファイル:** `src/lib/api.ts`  
**概要:** Zoho CRM、Google Drive、Google Sheets等の外部システムとの通信をシミュレートするモックAPI関数群。ローカル開発環境で使用。

#### 案件（Jobs）API

##### `fetchJobs()`
- **説明:** 全ジョブを取得
- **戻り値:** `ApiResponse<ZohoJob[]>`
- **データソース:** `mock-db.ts` の `jobs` 配列

##### `fetchTodayJobs()`
- **説明:** 今日のジョブを取得（`field22` = 今日）
- **戻り値:** `ApiResponse<ZohoJob[]>`
- **データソース:** `getTodayJobs()` ヘルパー関数

##### `fetchAllLongTermProjectJobs()`
- **説明:** 長期プロジェクト管理用：すべての長期プロジェクトを取得（過去30日以内 + 今日）
- **戻り値:** `ApiResponse<ZohoJob[]>`
- **データソース:** `getAllLongTermProjectJobs()` ヘルパー関数

##### `fetchJobById(id: string)`
- **説明:** ジョブ詳細を取得
- **戻り値:** `ApiResponse<ZohoJob>`
- **エラー:** `NOT_FOUND` - ジョブが見つからない場合

##### `updateJobStatus(id: string, status: JobStage)`
- **説明:** ジョブのステータスを更新（`field5` と `stage` を更新）
- **戻り値:** `ApiResponse<ZohoJob>`
- **エラー:** `NOT_FOUND` - ジョブが見つからない場合

##### `updateJobField6(id: string, vehicleId: string)`
- **説明:** ジョブのfield6（車両ID）を更新。Lookupフィールド更新時の参照先レコードID検証を実装。
- **戻り値:** `ApiResponse<ZohoJob>`
- **エラー:** 
  - `NOT_FOUND` - ジョブまたは車両が見つからない場合
  - `LOOKUP_VALIDATION_FAILED` - Lookup検証に失敗した場合

##### `updateJobField10(id: string, mileage: number)`
- **説明:** ジョブのfield10（走行距離）を更新
- **戻り値:** `ApiResponse<ZohoJob>`

##### `updateJobField7(id: string, field7: string)`
- **説明:** ジョブのfield7（詳細情報）を更新
- **戻り値:** `ApiResponse<ZohoJob>`

##### `updateJobField26(id: string, field26: string)`
- **説明:** ジョブのfield26（作業メモ）を更新。JSONパースして `jobMemos` も更新。
- **戻り値:** `ApiResponse<ZohoJob>`

##### `addJobMemo(jobId: string, memo: JobMemo)`
- **説明:** 作業メモを追加（新しいメモを先頭に追加）
- **戻り値:** `ApiResponse<ZohoJob>`

##### `updateJobMemo(jobId: string, memoId: string, content: string)`
- **説明:** 作業メモを更新
- **戻り値:** `ApiResponse<ZohoJob>`

##### `deleteJobMemo(jobId: string, memoId: string)`
- **説明:** 作業メモを削除
- **戻り値:** `ApiResponse<ZohoJob>`

##### `updateJobDiagnosisFee(id: string, diagnosisFee: number | null, diagnosisDuration?: number | null)`
- **説明:** ジョブの診断料金を更新。`field7` に診断料金情報を追記。
- **戻り値:** `ApiResponse<ZohoJob>`

##### `updateJobBaseSystemId(id: string, baseSystemId: string)`
- **説明:** ジョブの基幹システム連携IDを更新
- **戻り値:** `ApiResponse<ZohoJob>`

##### `checkIn(jobId: string, tagId: string, courtesyCarId?: string | null)`
- **説明:** チェックイン処理（タグ紐付け + ステータス更新 + 代車貸出）
- **戻り値:** `ApiResponse<{ job: ZohoJob; tag: SmartTag; car?: CourtesyCar }>`
- **エラー:**
  - `NOT_FOUND` - ジョブ、タグ、または代車が見つからない場合
  - `TAG_IN_USE` - タグが既に使用中の場合
  - `CAR_UNAVAILABLE` - 代車が利用不可の場合
- **処理内容:**
  1. タグの使用中チェック
  2. 代車の貸出処理（指定されている場合）
  3. ジョブの `tagId` と `courtesyCarId` を更新
  4. ジョブのステータスを `入庫済み` に更新
  5. タグのステータスを `in_use` に更新

##### `updateJobTag(jobId: string, newTagId: string)`
- **説明:** ジョブのタグを更新（古いタグを解放し、新しいタグを紐付け）
- **戻り値:** `ApiResponse<{ job: ZohoJob; oldTag: SmartTag; newTag: SmartTag }>`
- **エラー:**
  - `NOT_FOUND` - ジョブまたはタグが見つからない場合
  - `TAG_IN_USE` - 新しいタグが既に使用中の場合

##### `checkOut(jobId: string)`
- **説明:** チェックアウト処理（タグ解放 + ステータス更新）
- **戻り値:** `ApiResponse<ZohoJob>`
- **エラー:** `NOT_FOUND` - ジョブが見つからない場合
- **処理内容:**
  1. ジョブの `tagId` を `null` に更新
  2. タグのステータスを `available` に更新
  3. ジョブのステータスを `出庫済み` に更新

#### 診断（Diagnosis）API

##### `fetchDiagnosis(jobId: string)`
- **説明:** 診断結果を取得（モックなので固定データを返す）
- **戻り値:** `ApiResponse<DiagnosisItem[]>`

##### `saveDiagnosis(jobId: string, data: { items: DiagnosisItem[]; photos: { position: string; url: string }[]; mileage?: number })`
- **説明:** 診断結果を保存。ステータスを `見積作成待ち` に更新。
- **戻り値:** `ApiResponse<{ saved: boolean }>`
- **処理内容:**
  1. 診断データを保存（モックなのでログ出力のみ）
  2. ジョブのステータスを `見積作成待ち` に更新
  3. 走行距離を更新（指定されている場合）

#### 見積（Estimate）API

##### `fetchEstimate(jobId: string)`
- **説明:** 見積を取得（モックなので固定データを返す）
- **戻り値:** `ApiResponse<EstimateItem[]>`

##### `createEstimate(jobId: string, items: EstimateItem[])`
- **説明:** 見積を作成/保存
- **戻り値:** `ApiResponse<{ estimateId: string; items: EstimateItem[] }>`
- **処理内容:** 見積IDを生成して返す

##### `approveEstimate(jobId: string, selectedItems: EstimateItem[])`
- **説明:** 見積を承認。ステータスを `作業待ち` に更新。承認項目を `field13` にテキストで保存。
- **戻り値:** `ApiResponse<{ approved: boolean }>`
- **処理内容:**
  1. ジョブのステータスを `作業待ち` に更新
  2. 承認項目を `field13` にテキスト形式で保存

#### 顧客（Customers）API

##### `fetchCustomerById(id: string)`
- **説明:** 顧客を取得
- **戻り値:** `ApiResponse<ZohoCustomer>`
- **エラー:** `NOT_FOUND` - 顧客が見つからない場合

##### `appendToCustomerDescription(customerId: string, changeRequestText: string)`
- **説明:** 顧客のDescriptionに変更要求を追記
- **戻り値:** `ApiResponse<ZohoCustomer>`

##### `fetchCustomers()`
- **説明:** 全顧客を取得
- **戻り値:** `ApiResponse<ZohoCustomer[]>`

##### `updateCustomerDescription(customerId: string, description: string)`
- **説明:** 顧客のDescriptionを更新（変更申請対応完了時）
- **戻り値:** `ApiResponse<ZohoCustomer>`

#### 車両（Vehicles）API

##### `fetchVehicleById(id: string)`
- **説明:** 車両を取得
- **戻り値:** `ApiResponse<ZohoVehicle>`
- **エラー:** `NOT_FOUND` - 車両が見つからない場合

##### `fetchVehicles()`
- **説明:** 全車両を取得
- **戻り値:** `ApiResponse<ZohoVehicle[]>`

##### `fetchVehiclesByCustomerId(customerId: string)`
- **説明:** 顧客IDで車両を検索
- **戻り値:** `ApiResponse<ZohoVehicle[]>`

##### `createVehicle(customerId: string, vehicleName: string, licensePlate?: string | null)`
- **説明:** 新規車両を作成
- **戻り値:** `ApiResponse<ZohoVehicle>`
- **処理内容:**
  1. 車両IDを生成（`V${Date.now()}`）
  2. 新規車両レコードを作成
  3. モックデータベースに追加

##### `addImageToJobField12(jobId: string, imageUrl: string, fileName: string)`
- **説明:** Jobのfield12に画像を追加
- **戻り値:** `ApiResponse<ZohoJob>`
- **エラー:** `NOT_FOUND` - ジョブが見つからない場合

#### 履歴（History）API

##### `fetchJobsByCustomerId(customerId: string)`
- **説明:** 顧客IDでジョブを検索
- **戻り値:** `ApiResponse<ZohoJob[]>`

##### `fetchHistoricalEstimatesByCustomerId(customerId: string)`
- **説明:** 顧客IDで過去の見積を検索
- **戻り値:** `ApiResponse<HistoricalEstimate[]>`

##### `fetchHistoricalJobsByCustomerId(customerId: string)`
- **説明:** 顧客IDで過去のジョブを検索
- **戻り値:** `ApiResponse<HistoricalJob[]>`

#### スマートタグ（Smart Tags）API

##### `fetchAvailableTags()`
- **説明:** 利用可能なスマートタグを取得（`status = "available"`）
- **戻り値:** `ApiResponse<SmartTag[]>`

##### `fetchAllTags()`
- **説明:** すべてのスマートタグを取得
- **戻り値:** `ApiResponse<SmartTag[]>`

##### `fetchJobByTagId(tagId: string)`
- **説明:** タグIDでジョブを検索
- **戻り値:** `ApiResponse<ZohoJob>`
- **エラー:** `NOT_FOUND` - ジョブが見つからない場合

##### `fetchJobByQrCode(qrCode: string)`
- **説明:** QRコードでジョブを検索
- **戻り値:** `ApiResponse<ZohoJob>`
- **エラー:** `NOT_FOUND` - ジョブが見つからない場合

#### 代車（Courtesy Cars）API

##### `fetchAvailableCourtesyCars()`
- **説明:** 利用可能な代車を取得（`status = "available"`）
- **戻り値:** `ApiResponse<CourtesyCar[]>`

##### `fetchAllCourtesyCars()`
- **説明:** すべての代車を取得
- **戻り値:** `ApiResponse<CourtesyCar[]>`

##### `returnCourtesyCar(carId: string)`
- **説明:** 代車を返却（ステータスを `available` に更新）
- **戻り値:** `ApiResponse<CourtesyCar>`
- **エラー:** `NOT_FOUND` - 代車が見つからない場合

#### 分析（Analytics）API

##### `fetchAnalyticsData(startDate: string, endDate: string)`
- **説明:** 分析データを取得
- **戻り値:** `ApiResponse<AnalyticsData>`
- **パラメータ:**
  - `startDate`: 開始日（ISO8601形式）
  - `endDate`: 終了日（ISO8601形式）

#### 整備士（Mechanics）API

##### `assignMechanic(jobId: string, mechanicName: string)`
- **説明:** 整備士を割り当て
- **戻り値:** `ApiResponse<ZohoJob>`
- **エラー:** `NOT_FOUND` - ジョブが見つからない場合

#### ワークオーダー（Work Orders）API

##### `updateWorkOrder(jobId: string, workOrderId: string, updates: Partial<WorkOrder>)`
- **説明:** ワークオーダーを更新
- **戻り値:** `ApiResponse<WorkOrder>`
- **エラー:** `NOT_FOUND` - ジョブまたはワークオーダーが見つからない場合

##### `completeWork(jobId: string, workOrderId: string, workData: WorkData)`
- **説明:** 作業を完了
- **戻り値:** `ApiResponse<{ completed: boolean }>`
- **エラー:** `NOT_FOUND` - ジョブまたはワークオーダーが見つからない場合
- **処理内容:**
  1. ワークオーダーの `work` データを更新
  2. ジョブのステータスを `出庫待ち` に更新（全ワークオーダーが完了した場合）

---

## APIルート詳細

### 認証

#### `/api/auth/[...nextauth]/route.ts`
- NextAuth.jsの認証ルート
- Google OAuth認証

#### `/api/auth/csrf-token/route.ts`
- CSRFトークンの取得

### 案件・ワークオーダー

#### `/api/jobs/[id]/work-orders/route.ts`
- `GET` - ワークオーダー一覧の取得
- `POST` - ワークオーダーの作成

#### `/api/jobs/[id]/work-orders/[workOrderId]/route.ts`
- `GET` - ワークオーダーの取得
- `PUT` - ワークオーダーの更新
- `DELETE` - ワークオーダーの削除

### Google Drive

#### `/api/google-drive/folders/route.ts`
- `GET` - フォルダ一覧の取得
- `POST` - フォルダの作成

#### `/api/google-drive/folders/[folderId]/route.ts`
- `GET` - フォルダの取得
- `PUT` - フォルダの更新
- `DELETE` - フォルダの削除

#### `/api/google-drive/files/route.ts`
- `GET` - ファイル一覧の取得
- `POST` - ファイルのアップロード

#### `/api/google-drive/files/[fileId]/route.ts`
- `GET` - ファイルの取得
- `PUT` - ファイルの更新
- `DELETE` - ファイルの削除

#### `/api/google-drive/files/[fileId]/content/route.ts`
- `GET` - ファイルコンテンツの取得

#### `/api/google-drive/files/[fileId]/copy/route.ts`
- `POST` - ファイルのコピー

#### `/api/google-drive/files/[fileId]/move/route.ts`
- `POST` - ファイルの移動

#### `/api/google-drive/files/search/route.ts`
- `GET` - ファイルの検索

### Google Sheets

#### `/api/google-sheets/customers/route.ts`
- `GET` - 顧客マスタ一覧の取得

#### `/api/google-sheets/customers/[customerId]/route.ts`
- `GET` - 顧客マスタの取得

#### `/api/google-sheets/vehicles/route.ts`
- `GET` - 車両マスタ一覧の取得

#### `/api/google-sheets/vehicles/[vehicleId]/route.ts`
- `GET` - 車両マスタの取得

### LINE

#### `/api/line/magic-link/route.ts`
- `POST` - マジックリンクの生成

#### `/api/line/magic-link/[token]/customer-id/route.ts`
- `GET` - マジックリンクから顧客IDを取得

#### `/api/line/notify/route.ts`
- `POST` - LINE通知の送信

#### `/api/line/history/route.ts`
- `GET` - LINE通知履歴の取得

#### `/api/line/retry/[notificationId]/route.ts`
- `POST` - LINE通知の再送信

### メール

#### `/api/email/send/route.ts`
- `POST` - メールの送信

#### `/api/email/send-estimate/route.ts`
- `POST` - 見積メールの送信

### リアルタイム

#### `/api/realtime/stream/route.ts`
- `GET` - Server-Sent Events (SSE) ストリーム

#### `/api/realtime/updates/route.ts`
- `GET` - リアルタイム更新の取得
- `POST` - リアルタイム更新の送信

### WebRTC

#### `/api/webrtc/signal/route.ts`
- `POST` - WebRTCシグナリング

### スマートタグ

#### `/api/smart-tags/tags/route.ts`
- `GET` - スマートタグ一覧の取得
- `POST` - スマートタグの作成

#### `/api/smart-tags/tags/[tagId]/route.ts`
- `GET` - スマートタグの取得
- `PUT` - スマートタグの更新
- `DELETE` - スマートタグの削除

#### `/api/smart-tags/sessions/route.ts`
- `GET` - セッション一覧の取得
- `POST` - セッションの作成

#### `/api/smart-tags/sessions/[sessionId]/close/route.ts`
- `POST` - セッションの閉鎖

### 分析

#### `/api/analytics/route.ts`
- `GET` - 分析データの取得

### ブログ写真

#### `/api/blog-photos/route.ts`
- `GET` - ブログ写真一覧の取得
- `POST` - ブログ写真の公開

### フィードバック

#### `/api/feedback/route.ts`
- `POST` - フィードバックの送信

### 音声認識

#### `/api/gemini/transcribe/route.ts`
- `POST` - 音声の文字起こし（Gemini API）

### Zoho

#### `/api/zoho/batch/route.ts`
- `POST` - Zohoバッチ処理

#### `/api/zoho/customers/[id]/route.ts`
- `GET` - Zoho顧客の取得
- `PUT` - Zoho顧客の更新

---

## 特殊機能・ワークフロー

### 見積行の詳細仕様

**目的:** 見積作成画面で使用される見積行の詳細仕様

**ファイル:** `src/app/admin/estimate/[id]/page.tsx`  
**コンポーネント:** `EstimateLineRow`

#### 見積行の構造

見積行は以下の5列（+ 削除ボタン）で構成されます：
- 作業内容・使用部品名等、数量、単価、部品代（計算値）、技術量の5列で構成
- グリッドレイアウト: `grid-cols-[2fr_80px_100px_100px_120px_auto]`（PC時）

1. **作業内容・使用部品名等** (`name`)
   - テキスト入力フィールド
   - 必須項目
   - 最大長: 制限なし（推奨: 50文字以内）

2. **数量** (`partQuantity`)
   - 数値入力フィールド
   - 最小値: 0
   - デフォルト: 1
   - 単位: 個、本、セット等（作業内容に応じて）

3. **単価** (`partUnitPrice`)
   - 数値入力フィールド
   - 最小値: 0
   - 単位: 円
   - フォーマット: `¥{formatPrice(partUnitPrice)}`

4. **部品代** (`partQuantity * partUnitPrice`)
   - 計算フィールド（自動計算）
   - 表示のみ（編集不可）
   - フォーマット: `¥{formatPrice(partQuantity * partUnitPrice)}`

5. **技術量** (`laborCost`)
   - 工賃マスタから選択、またはカスタム入力
   - 選択可能な工賃マスタ: `LABOR_COST_MASTER` から取得
   - カスタム入力: 工賃マスタにない場合は数値入力フィールドで直接入力可能
   - 単位: 円
   - フォーマット: `¥{formatPrice(laborCost)}`

6. **削除ボタン**
   - 必須項目（`priority = "required"`）の場合は、項目が1つ以上ある場合のみ削除可能
   - 推奨項目（`priority = "recommended"`）の場合は、常に削除可能
   - 任意項目（`priority = "optional"`）の場合は、常に削除可能

#### 見積行の合計計算

各セクション（必須、推奨、任意）ごとに以下の合計を表示：

- **部品代合計:** `Σ(partQuantity * partUnitPrice)`
- **技術量合計:** `Σ(laborCost)`
- **セクション合計:** `部品代合計 + 技術量合計`

合計行の表示形式：
```
合計 | (空) | (空) | ¥{部品代合計} | ¥{技術量合計} | (削除ボタン列は空)
```
セクション合計は合計行の下に別途表示される。

#### 見積行の関連機能

##### 写真・動画の紐付け
- **写真:** `linkedPhotoId` で診断写真を紐付け可能
- **動画:** `linkedVideoId` で診断動画を紐付け可能
- **実況解説:** `transcription` で音声認識結果（実況解説テキスト）を保存可能

##### 工賃マスタ連携
- **工賃マスタ選択:** `Select` コンポーネントで `LABOR_COST_MASTER` から選択
- **カスタム入力:** 工賃マスタにない場合は、数値入力フィールドで直接入力
- **カスタム入力の表示:** 工賃マスタにない値が入力されている場合、`Select` に「カスタム」オプションが表示される

##### 見積行の追加
- **追加ボタン:** 各セクションに「項目を追加」ボタンを配置
- **追加時の初期値:**
  - `name`: 空文字列
  - `partQuantity`: 1
  - `partUnitPrice`: 0
  - `laborCost`: 0
  - `priority`: セクションの優先度に従う
  - `linkedPhotoId`: `null`
  - `linkedVideoId`: `null`
  - `transcription`: `null`

#### 見積行のバリデーション

- **必須項目チェック:**
  - `name` が空の場合は警告を表示（保存時エラー）
  - `partQuantity` が0以下の場合は警告を表示（保存時エラー）
  - `partUnitPrice` が0以下の場合は警告を表示（保存時エラー）
  - `laborCost` が0以下の場合は警告を表示（保存時エラー）

- **数値入力チェック:**
  - `partQuantity`, `partUnitPrice`, `laborCost` は数値のみ入力可能
  - 負の値は入力不可（最小値: 0）

#### 見積行のUI仕様

- **グリッドレイアウト:** `grid-cols-[2fr_80px_100px_100px_120px_auto]`
  - 作業内容: `2fr`（可変幅）
  - 数量: `80px`（固定幅）
  - 単価: `100px`（固定幅）
  - 部品代: `100px`（固定幅）
  - 技術量: `120px`（固定幅）
  - 削除ボタン: `auto`（可変幅）

- **入力フィールド:**
  - 高さ: `h-12`（40歳以上ユーザー向け最適化）
  - フォントサイズ: `text-base`
  - 数値入力: 右揃え（`text-right`）

- **合計行:**
  - 背景色: `bg-slate-50`
  - フォント: `font-bold text-base`
  - ボーダー: `border-t-2 border-slate-300`
  - 数値表示: `tabular-nums`（等幅フォント）

### 部品管理機能

**目的:** 部品調達待ち案件の管理

**主要機能:**
- 部品リストの入力・編集
- 部品の調達状況管理（未発注、発注済み、配送中、到着済み）
- 部品到着通知の自動送信
- 長期化部品調達の検知

**データ保存:**
- `field26` にJSON形式で保存（`PartsInfo`型）

**ワークフロー:**
1. 見積作成時に部品リストを入力
2. 部品を発注
3. 部品到着時に到着日を記録
4. 全部品到着時に顧客へ通知
5. 長期化部品調達の場合はアラート表示

### 車検チェックリスト機能

**目的:** 車検入庫・出庫時のチェックリスト管理

**主要機能:**
- 入庫時チェックリスト（車検証、自賠責、自動車税、鍵、ホイールロックナット、ETCカード、車内貴重品）
- 出庫時チェックリスト（車検証、自動車検査証記録事項、自賠責、記録簿、鍵、ホイールロックナット、ETCカード抜き忘れ、ホイール増し締め）
- 備考入力
- チェック完了日時の記録

**データ保存:**
- `field7` にJSON形式で保存（`InspectionChecklist`型）

### 作業指示書PDF生成機能

**目的:** メカニック向けの統合された作業指示書をPDF形式で生成

**主要機能:**
- 基本情報（顧客名、車両、入庫日時、サービス種別、担当整備士、走行距離、タグ、代車）
- 顧客からの申し送り事項
- 受付メモ（受付スタッフからの指示）
- 承認済み作業内容（作業待ち以降）
- 過去の作業履歴（オプション）

**技術:**
- jsPDFを使用
- 日本語フォント対応（Noto Sans JP）

### オフライン対応機能

**目的:** オフライン環境でもデータ入力・保存が可能

**主要機能:**
- IndexedDBによるデータ永続化
- アップロードキューの管理
- オンライン復帰時の自動同期
- オフライン状態の表示

**技術:**
- IndexedDB（大容量データ）
- LocalStorage（小容量データ）
- Service Worker（今後実装予定）

### リアルタイム通信機能

**目的:** 複数ユーザー間でのリアルタイム更新

**主要機能:**
- Server-Sent Events (SSE) 方式
- 案件更新、ワークオーダー更新、診断更新、見積更新、作業更新の通知
- 自動再接続機能

**技術:**
- Server-Sent Events (SSE)
- EventSource API

### ビデオ通話機能

**目的:** 顧客とのビデオ通話

**主要機能:**
- WebRTCによるビデオ通話
- シグナリングサーバー

**技術:**
- WebRTC
- `/api/webrtc/signal` エンドポイント

### 音声認識機能

**目的:** 手が汚れている時の音声入力

**主要機能:**
- マイクからの音声録音
- Gemini APIによる音声認識
- テキストへの変換

**技術:**
- MediaRecorder API
- Gemini API (`/api/gemini/transcribe`)

### 自動保存機能

**目的:** データの自動保存

**主要機能:**
- 入力内容の自動保存
- 保存ステータスの表示
- 保存失敗時のリトライ

### 同期管理機能

**目的:** オフライン時のデータ同期

**主要機能:**
- 同期キューの管理
- オンライン復帰時の自動同期
- 競合解決

### テンプレート機能

**目的:** よく使う項目のテンプレート化

**主要機能:**
- 診断結果テンプレート
- 見積項目テンプレート
- テンプレートの作成・編集・削除
- テンプレートの適用

**データ保存:**
- `localStorage` に保存

### 履歴参照機能

**目的:** 過去の見積・案件の参照

**主要機能:**
- 過去の見積もりの参照
- 過去の案件の参照
- 過去データの現在の見積・案件へのコピー

### 見積変更履歴機能

**目的:** 見積変更依頼の履歴管理

**主要機能:**
- 見積変更依頼の記録
- 変更内容の追跡
- 対応状況の管理

**データ保存:**
- `localStorage` に保存

### 整備士スキル管理機能

**目的:** 整備士のスキルレベル管理

**主要機能:**
- スキル項目の登録（カテゴリー、レベル、経験年数、資格・認定）
- スキルレベルの表示
- スキルに基づく案件割り当て（今後実装予定）

**データ保存:**
- `localStorage` に保存

### 重要顧客フラグ機能

**目的:** 重要顧客の識別

**主要機能:**
- 重要顧客フラグの設定
- 重要顧客の優先表示

### アクション追跡機能

**目的:** 使用状況の分析

**主要機能:**
- アクションの記録
- 使用状況の分析
- パフォーマンス計測

### フィードバック機能

**目的:** ユーザーフィードバックの収集

**主要機能:**
- フィードバックの送信
- フィードバックの管理

**API:**
- `/api/feedback`

---

## 型定義詳細

### 基本型

#### ServiceKind
```typescript
type ServiceKind =
  | '車検'
  | '修理・整備'
  | 'レストア'
  | 'チューニング'
  | 'パーツ取付'
  | 'コーティング'
  | '板金・塗装'
  | 'その他'
  | 'その他のメンテナンス'
  | '12ヵ月点検'
  | 'エンジンオイル交換'
  | 'タイヤ交換・ローテーション'
  | '故障診断';
```

#### JobStage
```typescript
type JobStage =
  | '入庫待ち'       // 初期状態
  | '入庫済み'
  | '見積作成待ち'
  | '見積提示済み'   // 見積送信後の状態
  | '作業待ち'
  | '出庫待ち'
  | '出庫済み'
  | '部品調達待ち'   // 部品調達待ち案件の管理機能
  | '部品発注待ち'   // 部品発注待ち案件の管理機能
  | '再入庫待ち';    // 一時帰宅中の再入庫待ち状態
```

### ワークオーダー関連

#### WorkOrder
```typescript
interface WorkOrder {
  id: string;
  jobId: string;
  serviceKind: ServiceKind;
  status: WorkOrderStatus;
  diagnosis?: DiagnosisData | null;
  estimate?: EstimateData | null;
  work?: WorkData | null;
  baseSystemItemId?: string | null;
  cost?: { [key: string]: unknown } | null;
  diagnosisFee?: number | null;
  diagnosisDuration?: number | null;
  isDiagnosisFeePreDetermined?: boolean;
  mechanicApproved?: boolean;
  mechanicApprover?: string | null;
  mechanicApprovedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

#### WorkRecord
```typescript
interface WorkRecord {
  time: string; // ISO8601
  content: string;
  photos?: Array<{
    type: "before" | "after";
    url: string;
    fileId?: string;
  }>;
  comment?: string;
  mechanicName?: string | null;
  completed?: boolean;
  completedAt?: string; // ISO8601
}
```

#### ApprovedWorkItem
```typescript
interface ApprovedWorkItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  priority: EstimatePriority;
  beforePhotos: string[];
  afterPhotos: string[];
  mechanicName?: string;
}
```

### 部品管理関連

#### PartsInfo
```typescript
interface PartsInfo {
  parts: PartItem[];
  expectedArrivalDate?: string | null; // ISO8601
  procurementStatus: "not_ordered" | "ordered" | "shipping" | "arrived";
  lastUpdatedAt: string; // ISO8601
}
```

#### PartItem
```typescript
interface PartItem {
  id: string;
  name: string;
  partNumber?: string | null;
  quantity: number;
  unitPrice?: number | null;
  supplier?: string | null;
  orderDate?: string | null; // ISO8601
  expectedArrivalDate?: string | null; // ISO8601
  actualArrivalDate?: string | null; // ISO8601
  status: "not_ordered" | "ordered" | "shipping" | "arrived";
  storageLocation?: string | null;
}
```

### 車検チェックリスト関連

#### InspectionChecklist
```typescript
interface InspectionChecklist {
  jobId: string;
  entryItems: {
    vehicleRegistration: boolean;
    compulsoryInsurance: boolean;
    automobileTax: boolean;
    key: boolean;
    wheelLockNut: boolean;
    etcCard: boolean;
    valuables: boolean;
  };
  checkoutItems: {
    vehicleRegistration: boolean;
    inspectionRecord: boolean;
    compulsoryInsurance: boolean;
    recordBook: boolean;
    key: boolean;
    wheelLockNut: boolean;
    etcCardRemoved: boolean;
    wheelTightening: boolean;
  };
  entryNote?: string | null;
  checkoutNote?: string | null;
  entryCheckedAt?: string | null; // ISO8601
  checkoutCheckedAt?: string | null; // ISO8601
}
```

### 作業メモ関連

#### JobMemo
```typescript
interface JobMemo {
  id: string;
  jobId: string;
  content: string;
  author: string;
  createdAt: string; // ISO8601
  updatedAt?: string | null; // ISO8601
}
```

### 一時帰宅関連

#### TemporaryReturnData
```typescript
interface TemporaryReturnData {
  jobId: string;
  returnDate: string; // ISO8601
  expectedReturnDate: string; // ISO8601
  reason?: string | null;
  note?: string | null;
}
```

### エラーロンプ関連

#### ErrorLampInfo
```typescript
interface ErrorLampInfo {
  jobId: string;
  lamps: Array<{
    type: "engine" | "abs" | "airbag" | "other";
    status: "always_on" | "blinking" | "off";
    note?: string | null;
  }>;
}
```

### OBD診断関連

#### EnhancedOBDDiagnosticResult
```typescript
interface EnhancedOBDDiagnosticResult {
  errorCodes: ErrorCode[];
  diagnosticDate: string; // ISO8601
  diagnosticTool?: string | null;
  notes?: string | null;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
}
```

#### ErrorCode
```typescript
interface ErrorCode {
  id?: string;
  code: string;
  description?: string | null;
  severity: "low" | "medium" | "high";
  status: "active" | "resolved" | "pending";
  resolution?: string | null;
  photos?: string[];
}
```

### レストア関連

#### RestoreProgress
```typescript
interface RestoreProgress {
  overallProgress: number; // 0-100
  phases: RestorePhase[];
  lastUpdatedAt: string; // ISO8601
}
```

#### RestorePhase
```typescript
interface RestorePhase {
  id: string;
  name: string;
  progress: number; // 0-100
  startDate?: string | null; // ISO8601
  expectedEndDate?: string | null; // ISO8601
  actualEndDate?: string | null; // ISO8601
  status: "not_started" | "in_progress" | "completed";
  notes?: string | null;
}
```

### 品質検査関連

#### QualityInspection
```typescript
interface QualityInspection {
  items: QualityInspectionItem[];
  inspectionDate: string; // ISO8601
  inspector: string;
  overallResult: "pass" | "fail" | "pending";
  notes?: string | null;
}
```

#### QualityInspectionItem
```typescript
interface QualityInspectionItem {
  id: string;
  name: string;
  category: string;
  result: "pass" | "fail" | "pending" | "not_applicable";
  notes?: string | null;
  photos?: string[];
}
```

### メーカー問い合わせ関連

#### ManufacturerInquiry
```typescript
interface ManufacturerInquiry {
  inquiries: InquiryItem[];
  lastUpdatedAt: string; // ISO8601
}
```

#### InquiryItem
```typescript
interface InquiryItem {
  id: string;
  inquiryDate: string; // ISO8601
  inquiryContent: string;
  inquiryMethod: "email" | "phone" | "fax" | "other";
  manufacturer: string;
  contactPerson?: string | null;
  responseDate?: string | null; // ISO8601
  responseContent?: string | null;
  status: "pending" | "responded" | "resolved";
  attachments?: string[];
}
```

### 整備士スキル関連

#### MechanicSkill
```typescript
interface MechanicSkill {
  mechanicId: string;
  mechanicName: string;
  skills: SkillItem[];
  overallLevel: number; // 0-100
  lastUpdatedAt: string; // ISO8601
}
```

#### SkillItem
```typescript
interface SkillItem {
  category: string;
  level: number; // 0-100
  experience: number;
  certifications: string[];
}
```

### テンプレート関連

#### DiagnosisTemplate
```typescript
interface DiagnosisTemplate {
  id: string;
  name: string;
  category: string | null;
  items: DiagnosisTemplateItem[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

#### EstimateTemplate
```typescript
interface EstimateTemplate {
  id: string;
  name: string;
  category: string | null;
  items: EstimateTemplateItem[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
```

### 履歴関連

#### HistoricalEstimate
```typescript
interface HistoricalEstimate {
  id: string;
  jobId: string;
  customerName: string;
  vehicleName: string;
  items: EstimateItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  submittedAt?: string | null;
}
```

#### HistoricalJob
```typescript
interface HistoricalJob {
  id: string;
  customerName: string;
  vehicleName: string;
  status: JobStage;
  createdAt: string;
  arrivalDateTime?: string | null;
}
```

### 見積変更履歴関連

#### EstimateChangeRequest
```typescript
interface EstimateChangeRequest {
  id: string;
  jobId: string;
  requestDate: string;
  requestedBy: string;
  requestType: "add" | "remove" | "modify" | "price_change";
  requestContent: string;
  originalEstimate: EstimateItem[];
  requestedEstimate: EstimateItem[];
  status: "pending" | "approved" | "rejected";
  responseDate: string | null;
  responseContent: string | null;
  handledBy: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 作業指示書PDF関連

#### WorkOrderPDFData
```typescript
interface WorkOrderPDFData {
  jobId: string;
  customerName: string;
  vehicleInfo: {
    name: string;
    licensePlate: string;
  };
  entryDate: string; // ISO8601
  workOrder: string | null;
  serviceKind: ServiceKind;
  assignedMechanic?: string | null;
  customerNotes?: string | null;
  generatedAt: string; // ISO8601
  mileage?: number | null;
  tagId?: string | null;
  courtesyCar?: {
    name: string;
    licensePlate?: string;
  } | null;
  approvedWorkItems?: string | null;
  historicalJobs?: Array<{
    date: string;
    serviceKind: string;
    summary: string;
  }> | null;
}
```

### アップロードキュー関連

#### UploadQueueEntry
```typescript
interface UploadQueueEntry {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: Blob;
  uploadUrl: string;
  folderId?: string;
  metadata?: Record<string, unknown>;
  status: "pending" | "uploading" | "completed" | "failed";
  error?: string;
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  retryCount: number;
}
```

### リアルタイム通信関連

#### RealtimeEvent
```typescript
interface RealtimeEvent {
  type: RealtimeEventType;
  jobId?: string;
  workOrderId?: string;
  data: unknown;
  timestamp: string; // ISO8601
}
```

### 使用状況分析関連

#### UsageAnalytics
```typescript
interface UsageAnalytics {
  eventType: string;
  screenId: string;
  userRole: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}
```

---

## 診断から見積への自動変換機能

### 概要

診断結果から見積項目を自動生成する機能。各入庫区分に応じて、診断結果の「要交換」「注意」などの判定を基に見積項目を追加する。

### 実装ファイル

**ファイル:** `src/lib/diagnosis-to-estimate.ts`

### 主要関数

#### convertDiagnosisToEstimateItems()
**機能:**
- 車検・12ヵ月点検の診断結果から見積項目を生成
- 「要交換（red）」「注意（yellow）」と判定された項目を抽出
- 優先度を決定（要交換=必須、注意=推奨）

#### convertTireDiagnosisToEstimateItems()
**機能:**
- タイヤ交換・ローテーションの診断結果から見積項目を生成
- 「要交換（replace）」「注意（attention）」と判定された項目を抽出

#### convertMaintenanceDiagnosisToEstimateItems()
**機能:**
- その他のメンテナンスの診断結果から見積項目を生成
- 「要交換（replace）」「注意（attention）」と判定された項目を抽出

#### convertTuningPartsDiagnosisToEstimateItems()
**機能:**
- チューニング・パーツ取付の診断結果から見積項目を生成
- 「要対応（required）」「注意（attention）」と判定された項目を抽出

#### convertCoatingDiagnosisToEstimateItems()
**機能:**
- コーティングの診断結果から見積項目を生成
- 「深刻な傷（severe）」「中程度の傷（moderate）」「軽微な傷（minor）」と判定された項目を抽出

#### addDiagnosisItemsToEstimate()
**機能:**
- 既存の見積項目リストに診断結果から生成した項目を追加
- 重複チェック（項目名で判定）

#### addTireDiagnosisItemsToEstimate()
**機能:**
- 既存の見積項目リストにタイヤ診断結果から生成した項目を追加
- 重複チェック

#### addMaintenanceDiagnosisItemsToEstimate()
**機能:**
- 既存の見積項目リストにメンテナンス診断結果から生成した項目を追加
- 重複チェック

#### addTuningPartsDiagnosisItemsToEstimate()
**機能:**
- 既存の見積項目リストにチューニング診断結果から生成した項目を追加
- 重複チェック

#### addCoatingDiagnosisItemsToEstimate()
**機能:**
- 既存の見積項目リストにコーティング診断結果から生成した項目を追加
- 重複チェック

### 使用箇所

- **見積作成画面** (`src/app/admin/estimate/[id]/page.tsx`)
  - 「診断結果から見積項目を追加」ボタンで呼び出し
  - 入庫区分に応じて適切な関数を呼び出し

---

## 工賃マスタ機能

### 概要

見積作成時に使用する工賃マスタデータ。輸入車ディーラーの最高額を初期データとして使用。

### 実装ファイル

**ファイル:** `src/lib/labor-cost-master.ts`

### データ構造

```typescript
interface LaborCostMasterItem {
  id: string;
  name: string;
  category: string;
  workPoints: string; // 標準作業点数
  workTime: string; // 作業時間
  laborCost: number; // 工賃（輸入車ディーラー - 最高額）
}
```

### カテゴリ

- **エンジン系統:** エンジンオイル交換、オイルフィルター交換、スパークプラグ交換、エアフィルター交換、エンジンチェック・診断、タイミングベルト交換、ウォーターポンプ交換、ラジエーター交換、サーモスタット交換
- **トランスミッション系統:** トランスミッションオイル交換、ATF交換、クラッチ交換、CVTオイル交換
- **ブレーキ系統:** ブレーキパッド交換、ブレーキローター交換、ブレーキフルード交換、ブレーキホース交換
- **サスペンション系統:** ショックアブソーバー交換、ストラット交換、スタビライザー交換、アライメント調整
- **電装系統:** バッテリー交換、オルタネーター交換、スターター交換、ヘッドライト交換、テールライト交換
- **その他:** エアコンフィルター交換、ワイパーブレード交換、タイヤ交換、ホイールバランス調整

### 使用箇所

- **見積作成画面** (`src/app/admin/estimate/[id]/page.tsx`)
  - 見積行の「技術量」選択時に工賃マスタから選択
  - 選択した工賃マスタの工賃を自動入力

---

## 点検項目定義

### 車検・12ヵ月点検用点検項目

**ファイル:** `src/lib/inspection-items.ts`

**カテゴリ:**
- エンジン・ルーム点検
- 室内点検
- 足廻り点検
- 下廻り点検
- 外廻り点検
- 日常点検
- その他

**項目数:** 50項目以上

**各項目の属性:**
- 項目ID、項目名、カテゴリ
- 状態（OK / Warning / Critical / Adjust / Clean / Skip / Not Applicable）
- 測定値定義（必要に応じて）
- 動画撮影が必要かどうか
- 省略規則（☆/★）

### タイヤ点検項目

**ファイル:** `src/lib/tire-inspection-items.ts`

**項目:**
- フロント左、フロント右、リア左、リア右
- 各タイヤの溝深さ、空気圧、推奨空気圧

### エンジンオイル点検項目

**ファイル:** `src/lib/engine-oil-inspection-items.ts`

**項目:**
- オイルレベル、オイルフィルター、オイル漏れ、オイル色、オイル粘度

### メンテナンスメニュー設定

**ファイル:** `src/lib/maintenance-menu-config.ts`

**機能:**
- メンテナンスメニューの定義
- 各メニューに応じた点検項目の定義

---

## 見積行の詳細仕様

### 5列形式の見積行

**列構成:**
1. **作業内容・使用部品名等** (2fr) - テキスト入力
2. **数量（部品・用品）** (80px) - 数値入力
3. **単価（部品・用品）** (100px) - 数値入力（部品代の計算に使用）
4. **技術量** (100px) - 工賃マスタから選択、またはカスタム入力
5. **小計** (120px) - 自動計算（数量 × 単価 + 技術量）
6. **アクション** (auto) - 編集・削除ボタン

### 計算ロジック

```typescript
// 部品代の計算
const partTotal = (partQuantity || 0) * (partUnitPrice || 0);

// 小計の計算
const subtotal = partTotal + laborCost;
```

### 工賃マスタとの連携

- 技術量選択時に工賃マスタから選択
- 選択した工賃マスタの工賃を自動入力
- 作業内容名が空の場合は、選択した工賃マスタの名前を設定

---

## お知らせ設定

### 概要

トップページに表示されるお知らせバナーの設定管理。

### 実装ファイル

**ファイル:** `src/lib/announcement-config.ts`

### 主要関数

#### getActiveAnnouncements()
**機能:**
- 有効なお知らせを取得
- 有効期限（`expiresAt`）が切れていないもの
- 優先度（`priority`）順にソート

#### getStoredAnnouncements()
**機能:**
- `localStorage` からお知らせ一覧を取得

#### saveStoredAnnouncements()
**機能:**
- `localStorage` にお知らせ一覧を保存

### データ構造

```typescript
interface Announcement {
  id: string;
  message: string;
  backgroundColor: string;
  textColor: string;
  priority: number;
  expiresAt?: string | null; // ISO8601
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}
```

---

## 写真位置の定義

### 概要

写真撮影時の位置を定義する。

### 実装ファイル

**ファイル:** `src/lib/photo-position.ts`

### 位置の種類

```typescript
type PhotoPosition =
  | "front"      // 前面
  | "rear"       // 後面
  | "left"       // 左
  | "right"      // 右
  | "engine"     // エンジンルーム
  | "interior"   // 室内
  | "undercarriage" // アンダーボディ
  | "dashboard"  // ダッシュボード
  | "damage";    // 損傷箇所
```

### 使用箇所

- **診断画面** - 入庫時写真の撮影位置
- **作業画面** - 作業前後の写真の撮影位置

---

## 更新履歴

- **2025-01:** 初版作成
- **2025-01:** 抜け漏れ補完（機能コンポーネント、ライブラリ関数、APIルート、特殊機能、型定義の詳細を追加）
- **2025-01:** 診断から見積への自動変換機能、工賃マスタ機能、点検項目定義、見積行の詳細仕様、お知らせ設定、写真位置の定義を追加
- **2025-01:** カンバンボード画面（`/manager/kanban`）を追加、JobStage型定義を最新化、ページ番号を再整理
- **2025-01:** 車検・12ヶ月点検のフローと内容を大幅更新
  - 再設計版UI（`InspectionRedesignTabs`, `InspectionBottomSheetList`）の詳細を追加
  - 24ヶ月点検と12ヶ月点検のカテゴリ構成の違いを明確化
  - 走行距離入力（独立セクション）、追加見積内容入力、OBD診断結果統合セクション、品質検査セクションを追加
  - 12ヶ月点検特有機能（オプションメニュー、法定費用、OBD診断結果PDFアップロード）を追加
  - 24ヶ月点検特有機能（完成検査時のテスター数値入力、チェックリスト）を追加
- **2025-01:** 実装に基づく詳細更新（Version 1.3）
  - **診断画面（24ヶ月点検）**: リデザイン版UIの詳細実装を反映
    - `InspectionItemRedesign[]`型、`InspectionMeasurements`型、`InspectionParts`型の使用を明記
    - 診断データ保存時のデータ構造を詳細化（`WorkOrder.diagnosis`の各フィールド）
    - `convertInspectionRedesignToEstimateItems()`の動作を詳細化
  - **診断画面（12ヵ月点検）**: 実装に基づき従来版UI（`InspectionDiagnosisView`）を使用することを明記
  - **見積作成画面（24ヶ月点検）**: 法定費用取得処理（`getLegalFees()`）の詳細を追加
  - **見積作成画面（12ヵ月点検）**: オプションメニューセレクター（`OptionMenuSelector`）の実装詳細を追加
    - `optionMenus`配列、`selectedOptionMenuIds`状態管理、`handleOptionMenuSelectionChange`ハンドラの詳細
    - 同時実施サービス（`simultaneousService`）の指定方法を明記

---

**End of Document**

