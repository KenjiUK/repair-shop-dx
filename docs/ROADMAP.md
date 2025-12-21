# 実装ロードマップ

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 2.0
- **対象**: システム制約を考慮した実装優先順位
- **前提**: 基幹システム（スマートカーディーラー）制約、複数作業管理、マスタデータ同期を考慮

---

## Pre-Phase 0: 実装前確認（必須）

**目的**: 実装開始前に、Zoho CRM管理者・基幹システム担当者への確認を完了させ、データクレンジングを実施する

**確認事項**:

1. **Zoho CRM管理者への確認**
   - CustomModule2（入庫管理）に新規カスタムフィールドを追加可能か
   - フィールド名の命名規則（`field_service_kinds` 形式で追加可能か、それとも `field23`, `field24` などの連番形式か）
   - 追加に必要な権限・手順
   - `field5`（工程ステージ）PickListの選択肢一覧（実際のZoho CRMで使用されている選択肢を確認）
   - Multi-Lineフィールドの実際のサイズ制限（64KB制限の確認）
   - Uploadフィールド（`field12`）の制限（ファイル数、サイズ上限）
   - 既存フィールド（`field`, `field4-22`, `ID_BookingId`等）の実在確認とデータ型の確認

2. **基幹システム（スマートカーディーラー）担当者への確認**
   - CSV/Excel出力フォーマット（カラム名、データ形式、エンコーディング）
   - 顧客IDフォーマット（K1001形式か、それ以外か）
   - 出力頻度・タイミング（毎日朝の何時頃か）
   - 出力先フォルダの指定方法

3. **データクレンジング実施**
   - 基幹システムの顧客IDとZoho CRMの`ID1`（顧客ID）のフォーマット統一
   - 不一致データの洗い出しと修正
   - データクレンジング完了報告書の作成

**成果物**:
- Zoho CRM管理者からの回答書（フィールド追加可否、PickList選択肢一覧、制限事項）
- 基幹システム担当者からの回答書（CSV/Excelフォーマット、顧客IDフォーマット、出力タイミング）
- データクレンジング完了報告書（不一致データの修正結果）

**実装期間の目安**: 1-2週間（確認事項の回答待ち時間を含む）

---

## Zoho CRM側の追加フィールドとアプリ以外での設定情報

**重要**: 本システムを動作させるためには、Zoho CRM側での設定が必要です。アプリ開発とは別に、Zoho CRM管理者が実施する必要があります。

### Zoho CRM側の設定項目

#### 1. 新規追加フィールド（CustomModule2: 入庫管理）

以下の3つのフィールドをZoho CRMのCustomModule2（入庫管理）に追加する必要があります。

| **フィールド名（表示名）** | **API名** | **データ型** | **必須設定** |
| --- | --- | --- | --- |
| 実施作業リスト | `field_service_kinds` | Multi-Select | 選択肢: 車検, 12ヵ月点検, エンジンオイル交換, タイヤ交換・ローテーション, その他のメンテナンス, 故障診断, 修理・整備, チューニング・パーツ取付, コーティング, 板金・塗装, レストア, その他 |
| ワークオーダー詳細 | `field_work_orders` | Multi-Line | 最大文字数: 65535文字（64KB制限） |
| 基幹システム連携ID | `field_base_system_id` | Text | 最大文字数: 255文字 |

**追加手順（Zoho CRM管理者向け）**:
1. Zoho CRMにログインし、設定（Settings）→ カスタマイズ（Customization）→ モジュール（Modules）に移動
2. 「入庫管理」（CustomModule2）を選択
3. 「フィールド」（Fields）→ 「フィールドを追加」（Add Field）をクリック
4. 上記の3つのフィールドを順次追加
   - **注意**: API名が `field_service_kinds`, `field_work_orders`, `field_base_system_id` として設定されるか確認（連番形式の場合は、実際のAPI名をアプリ開発者に通知）
5. 各フィールドの設定を完了（表示名、データ型、選択肢など）

#### 2. 既存フィールドの確認事項

**CustomModule2（入庫管理）**:
- `field5`（工程ステージ）: PickList型。選択肢を確認し、アプリ側の`JobStage` enumと一致させること
- `field4`（顧客名）: Lookup型。顧客モジュール（Contacts）への参照が正しく設定されていること
- `field6`（車両ID）: Lookup型。車両モジュール（CustomModule1）への参照が正しく設定されていること
- `field19`（お客様共有フォルダ）: URL型。Google DriveフォルダのURLを保存するために使用

**Contacts（顧客）モジュール**:
- `ID1`（顧客ID）: Text型。基幹システム（スマートカーディーラー）の顧客ID（例: K1001）が格納されていること
- `Business_Messaging_Line_Id`（LINE ID）: Text型。LINE連携時にアプリから書き込むため、編集可能であること

**CustomModule1（車両）モジュール**:
- `Name`（車両ID）: Text型。基幹システムの車両IDが格納されていること

### Googleスプレッドシートの設定

#### 1. マスタデータ用スプレッドシート

- **スプレッドシート名**: `整備工場DX_マスタデータ`（任意の名前で可）
- **シート名**: `車両マスタ`, `顧客マスタ`
- **アクセス権限**: アプリと同じGoogleアカウントで共有設定（読み取り専用で可）
- **カラム名**: 日本語カラム名を使用（例: `車両ID`, `登録番号`, `顧客ID`, `氏名`）

#### 2. スマートタグ管理用スプレッドシート

- **スプレッドシート名**: `スマートタグ管理`（任意の名前で可）
- **シート名**: `Tags`, `Sessions`
- **アクセス権限**: アプリと同じGoogleアカウントで共有設定（読み書き可能）
- **初期データ**: Tagsシートに物理タグのマスタデータ（タグID: "01"～"20", QRコード, ステータス: "available"）を事前登録

**Tagsシートのカラム構成**:
| カラム名 | データ型 | 説明 |
| --- | --- | --- |
| タグID | Text | 物理タグID（"01", "02", ..., "20"） |
| QRコード | Text | QRコードの値 |
| ステータス | Text | タグの状態（available, in_use, closed） |
| 作成日時 | DateTime | 作成日時 |
| 更新日時 | DateTime | 更新日時 |

**Sessionsシートのカラム構成**:
| カラム名 | データ型 | 説明 |
| --- | --- | --- |
| セッションID | Text | セッションID（UUID形式） |
| タグID | Text | TagsシートのタグIDへの参照 |
| Job ID | Text | Zoho CRM CustomModule2.id |
| 紐付け日時 | DateTime | タグとJobを紐付けた日時 |
| 解除日時 | DateTime | タグとJobの紐付けを解除した日時 |
| ステータス | Text | セッション状態（active, closed） |
| 作成日時 | DateTime | 作成日時 |
| 更新日時 | DateTime | 更新日時 |

### Google Driveのフォルダ構造

以下のフォルダ構造を事前に作成してください。

```
/repair-shop-dx/
  /master-data/          # マスタデータCSV/Excelのアップロード先
  /customers/            # 顧客別フォルダ
    /{customerId}_{customerName}/
      /vehicles/          # 車両フォルダ
        /{vehicleId}_{vehicleName}/
          /documents/     # 車両関連書類
            shaken_{vehicleId}_{日付}.pdf  # 車検証（最新版）
            shaken_history/  # 車検証履歴
          /jobs/          # 来店履歴（Job）
            /{jobDate}_{jobId}/
              /wo-{workOrderId}/
                diagnosis.json
                estimate.json
                work.json
                /photos/
                /videos/
              invoice.pdf  # 統合請求書（Job全体）
  /blog-photos/          # ブログ用写真フォルダ
    /by-date/            # 日付別
    /by-service/          # 作業種類別
    /by-vehicle-type/     # 車種別
    /before-after/        # Before/After別
```

**フォルダ共有設定**:
- `/repair-shop-dx/`: アプリと同じGoogleアカウントで共有設定（読み書き可能）
- `/repair-shop-dx/master-data/`: 事務員がCSV/Excelをアップロードできるよう共有設定
- `/repair-shop-dx/customers/`: アプリのみ（読み書き可能、アプリが自動生成）
- `/repair-shop-dx/blog-photos/`: ブログ担当者、アプリ（読み書き可能、ブログ担当者が参照）

### GAS（Google Apps Script）の設定

- **スクリプト名**: `マスタデータ同期GAS`（任意の名前で可）
- **トリガー設定**: Time-driven（5分ごと）またはonChangeイベント
- **監視フォルダ**: Google Driveの所定フォルダ（例: `/repair-shop-dx/master-data/`）
- **エラー通知**: Gmail通知先の設定

---

## Phase 0: 基盤システム連携の実装（必須）

**前提条件**: Pre-Phase 0の確認事項が全て完了していること

**目的**: 基幹システム（スマートカーディーラー）との連携基盤を構築

**実装項目**:
1. **Zoho CRMの拡張（条件付き）**
   - **条件**: Zoho CRM管理者からフィールド追加可能の確認が取れている場合
   - `field_service_kinds`（Multi-Select）の追加
   - `field_work_orders`（Multi-Line JSON）の追加
   - `field_base_system_id`（Text）の追加
   - 既存Jobレコードへの移行スクリプト
   - **代替案**: フィールド追加が不可能な場合、Google Drive JSON管理方式を採用
     - Google Driveにワークオーダー詳細JSONファイルを保存
     - Zoho CRMの`field19`（お客様共有フォルダ）にJSONファイルのURLを保存
     - アプリ側でJSONファイルを読み込み・更新するロジックを実装
     - データ容量制限の回避（写真・動画は別途Google Driveに保存、JSONにはURLのみ保存）

2. **Google Sheets連携（マスタデータ同期）**
   - 車両マスタの読み込みAPI実装（日本語カラム名対応）
   - 顧客マスタの読み込みAPI実装（日本語カラム名対応）
   - マスタデータのキャッシュ機能（SWR、TTL 1時間）
   - データクレンジング後のフォーマット検証
   - **⚠️ 重要制約**: アプリからGoogle Sheets（マスタデータ）への**追加・編集・削除は絶対にしない**。読み取り専用として実装すること。

3. **Google Drive連携（ファイル保存）**
   - フォルダ構造の自動生成（顧客→車両→Jobの階層）
   - 写真・動画・PDFのアップロード機能
   - ファイル命名規則の実装（「invoice」「seikyu」「請求書」を含む）
   - ファイル検索・取得機能
   - 車検証の管理（車両フォルダの`/documents/`に保存、最新版と履歴の管理）
   - ブログ用写真の管理（複数の分類フォルダに自動コピー）

4. **GAS（Google Apps Script）の実装**
   - **トリガー設定**
     - Time-drivenトリガー: 5分ごとに所定フォルダを監視
     - またはonChangeイベント: Google Driveフォルダの変更を検知
   - **CSV/Excelファイルの検知機能**
     - 所定フォルダ（Google Drive）の監視
     - ファイル名パターンマッチング（例: `車両マスタ_*.csv`, `顧客マスタ_*.xlsx`）
   - **ファイル形式検証**
     - CSV: UTF-8/Shift-JISエンコーディングの自動検出
     - Excel: `.xlsx`（推奨）、`.xls`（レガシー対応）
     - ファイル形式不正時のエラー通知
   - **エンコーディング処理**
     - Shift-JIS → UTF-8変換（必要に応じて）
     - 文字化け防止のためのエンコーディング検出
   - **CSV/Excel → Google Sheets変換機能**
     - 日本語カラム名の保持
     - データ型の適切な変換（数値、日付、文字列）
     - 既存シートの更新（全件置換または差分更新）
   - **エラーハンドリングと通知機能**
     - Gmail通知: エラー発生時に担当者へメール送信
     - Google Sheetsログ: エラーログを専用シートに記録（日時、ファイル名、エラー内容）
     - リトライ処理: 一時的なエラー時の自動リトライ（最大3回）

5. **スマートタグ管理システム構築（Googleスプレッドシート）**
   - **Googleスプレッドシートの作成**
     - スプレッドシート名: `スマートタグ管理`
     - Tagsシートの作成（カラム: タグID, QRコード, ステータス, 作成日時, 更新日時）
     - Sessionsシートの作成（カラム: セッションID, タグID, Job ID, 紐付け日時, 解除日時, ステータス, 作成日時, 更新日時）
     - 初期データの登録（TagsシートにタグID "01"～"20"を事前登録）
   - **Google Sheets API連携の実装**
     - Tagsシートの読み込み・更新API
     - Sessionsシートの読み込み・作成・更新API
     - 排他制御の実装（SWRキャッシュと楽観的更新を組み合わせ）
   - **タグライフサイクル管理の実装**
     - タグ紐付け処理: 既存のactiveセッションをclosedに更新してから新規セッションを作成
     - タグ解放処理: セッションをclosedに更新し、タグのstatusをavailableに更新
     - エラーハンドリング: 同時編集エラー時のリトライ処理

**成果物**:
- Zoho CRM拡張フィールドの設定完了（または代替案の実装完了）
- マスタデータ同期の動作確認
- ファイル保存機能の動作確認
- スマートタグ管理システム（Googleスプレッドシート）の動作確認

---

## Phase 1: 共通基盤と複数作業管理の実装

**前提条件**: Phase 0が完了し、Zoho CRMフィールド追加（または代替案）が完了していること

**目的**: すべての入庫区分で使用する共通機能と複数作業管理機能を実装

**実装項目**:
1. **共通UI/UXコンポーネントライブラリの実装**
   - `AppHeader`（ヘッダーコンポーネント）
   - `JobCard`（ジョブカードコンポーネント）
   - `TodaySummaryCard`（本日のサマリーカード）
   - `StatusBadge`（ステータスバッジ）
   - `Button`、`Input`、`Select`、`Tabs`などの基本UIコンポーネント
   - `PhotoCaptureButton`（写真撮影ボタン）
   - `VideoCaptureButton`（動画撮影ボタン）
   - `AudioInputButton`（音声入力ボタン）
   - `OBDDiagnosticResultSection`（OBD診断結果セクション、12ヶ月点検専用）
   - `OptionMenuSelector`（オプションメニュー選択、12ヶ月点検専用）

2. **統一データモデルの実装（複数作業管理対応）**
   - `BaseJob`インターフェースの実装
   - `WorkOrder`インターフェースの実装
   - 入庫区分別の拡張モデル（`VehicleInspectionWorkOrder`、`TwelveMonthInspectionWorkOrder`など）
   - データ変換ロジック（Zoho CRM ↔ アプリ内データモデル）

3. **API設計の統一実装（ワークオーダーCRUD）**
   - `GET /api/jobs/{id}/work-orders`（ワークオーダー一覧取得）
   - `POST /api/jobs/{id}/work-orders`（ワークオーダー作成）
   - `GET /api/jobs/{id}/work-orders/{workOrderId}`（ワークオーダー詳細取得）
   - `PATCH /api/jobs/{id}/work-orders/{workOrderId}`（ワークオーダー更新）
   - `DELETE /api/jobs/{id}/work-orders/{workOrderId}`（ワークオーダー削除）

4. **複数作業管理機能の実装（作業追加、作業選択UI）**
   - 「作業を追加」ボタンとモーダル
   - 作業選択タブまたはドロップダウンUI
   - 作業ごとのステータス管理
   - 作業ごとのデータ分離（診断・見積・作業情報）

5. **エラーハンドリングの統一実装**
   - 統一エラーレスポンス形式
   - エラーログ機能
   - ユーザー向けエラーメッセージ表示

6. **オフライン対応基盤の実装**
   - ローカルストレージ/IndexedDBによるデータ永続化
   - オフライン状態の検知と視覚的フィードバック（オフラインバナー）
   - 同期状態インジケーター（同期済み/同期中/未同期/エラー）
   - オンライン復帰時の自動同期処理
   - コンフリクト解決UI
   - 未アップロードファイルのキュー管理

7. **セキュリティ基盤の実装**
   - 認証基盤（セッションベース認証、将来のJWT対応準備）
   - ロールベースアクセス制御（admin/front/mechanic/customer）
   - CSRFトークン検証
   - ファイルアップロードバリデーション（拡張子、MIMEタイプ、サイズ）

8. **効果測定基盤の実装**
   - 利用統計の自動収集（ページビュー、アクション完了、エラー発生）
   - API応答時間の計測
   - 画面表示時間の計測

9. **Zoho API制約対応の実装**
   - **Lookupフィールド更新時の参照先レコードID検証**
     - `field4`（顧客名Lookup）、`field6`（車両ID Lookup）更新時に参照先レコードIDの存在確認
     - 存在しないレコードID指定時のエラーハンドリング
   - **APIレート制限対策**
     - SWRキャッシュによるAPI呼び出し回数の削減
     - バッチ処理による複数更新のまとめ処理
     - レート制限超過時（429エラー）の自動リトライ（指数バックオフ）
   - **エラーハンドリング（リトライ戦略、フィールド不存在時のフォールバック）**
     - 400エラー（不正リクエスト）: ユーザー向けエラーメッセージ表示
     - 404エラー（フィールド不存在）: 代替フィールドへのフォールバック、またはGoogle Drive JSON管理方式への切り替え
     - 500エラー（サーバーエラー）: 自動リトライ（最大3回、指数バックオフ）
     - エラーログの記録（日時、エラー内容、リクエスト内容）

10. **顧客(Contacts)モジュール更新制約の実装**
    - **直接更新NGフィールドのバリデーション**
      - `Mailing_Street`（住所）、`Phone`（電話番号）、`Mobile`（携帯電話）などの直接更新不可フィールドの更新試行を検出
      - 更新試行時のエラーメッセージ表示
    - **Descriptionへの追記ロジック**
      - 直接更新NGフィールドの変更要求を`Description`フィールドに追記
      - 追記フォーマット: `【アプリ変更届】YYYY-MM-DD HH:mm: 項目名: 変更前 → 変更後`
    - **誤更新防止の実装**
      - 更新前にフィールドの更新権限をチェック
      - 直接更新NGフィールドへの更新リクエストを自動的に`Description`追記に変換
    - **⚠️ 重要制約**: マスタデータ（顧客・車両）の追加・編集・削除は絶対にしない。許可されたフィールドのみ更新可能。

**成果物**:
- 共通コンポーネントライブラリの完成
- 複数作業管理機能の動作確認
- APIエンドポイントの動作確認
- オフライン対応基盤の動作確認
- セキュリティ基盤の動作確認

---

## Phase 2: 主要入庫区分の実装（単一作業対応）

**前提条件**: Phase 1が完了し、共通コンポーネントライブラリと複数作業管理機能が動作確認済みであること

**目的**: 主要な入庫区分を単一作業として実装し、基本機能を動作確認

**実装項目**:
1. **車検（単一作業として実装）**
   - 受付画面（車検証画像アップロード）
   - 診断画面（カテゴリタブ、検査項目リスト、測定値入力、動画撮影）
   - 見積画面（法定費用表示、部品リストアップ、音声入力対応）
   - 作業画面（作業記録、Before/After写真）
   - 引渡画面（PDF生成：分解整備記録簿）

2. **12ヵ月点検（単一作業として実装、オプションメニュー対応）**
   - 受付画面
   - 診断画面（カテゴリタブ、検査項目リスト、測定値入力、OBD診断結果PDFアップロード）
   - 見積画面（法定費用表示、オプションメニュー機能、12ヶ月点検と同時実施で10%割引）
   - 作業画面（作業記録、Before/After写真）
   - 引渡画面（PDF生成：分解整備記録簿）

3. **エンジンオイル交換（単一作業として実装）**
   - 受付画面
   - 診断画面（簡易検査項目3項目）
   - 見積画面（部品リストアップ：基本不要、イレギュラー時のみ）
   - 作業画面（作業記録、Before/After写真）
   - 引渡画面

4. **故障診断（単一作業として実装）**
   - 受付画面（エラーランプ管理：有無、種類）
   - 診断画面（症状カテゴリ、診断機利用、動画撮影、音声録音、エラーランプ管理）
   - 見積画面（原因説明、修理方法提案、診断機結果PDF表示・ダウンロード）
   - 作業画面（作業記録、Before/After写真）
   - 引渡画面

5. **修理・整備（単一作業として実装）**
   - 受付画面
   - 診断画面（診断機結果PDFのアップロード・表示・ダウンロード管理）
   - 見積画面（部品リストアップ、音声入力対応）
   - 作業画面（作業記録、Before/After写真）
   - 引渡画面

6. **顧客向け進捗通知機能（LINE）**
   - LINE Messaging API連携の実装
   - 通知テンプレートの作成（入庫完了、診断完了、見積送付、作業完了）
   - マジックリンク生成（ログイン不要の見積確認・承認URL）
   - 通知履歴の管理
   - 配信失敗時のリトライ処理

7. **ブログ用写真の管理機能**
   - 作業完了画面に「ブログ用に公開」機能を追加
   - 写真選択UI（チェックボックスで複数選択可能）
   - 自動コピー処理（複数の分類フォルダに同時にコピー）
     - `/blog-photos/by-date/YYYYMM/YYYYMMDD/`
     - `/blog-photos/by-service/{作業種類}/`
     - `/blog-photos/by-vehicle-type/{メーカー}/`
     - `/blog-photos/before-after/{種類}/`
   - ファイル名の自動リネーム（命名規則: `{日付}_{車種}_{作業種類}_{種類}_{連番}.{拡張子}`）
   - JSONファイルに「ブログ用に公開済み」フラグを記録

8. **ローディング/フィードバックUIの実装**
   - スケルトンUIコンポーネント
   - トースト通知コンポーネント（成功/エラー/警告/情報）
   - オプティミスティックUI対応
   - ハプティックフィードバック（モバイル）
   - 自動保存インジケーター

8. **カラーユニバーサルデザイン対応**
   - 診断結果の状態表示（色+形状+アイコン+テキストの4重表現）
   - 色覚シミュレーターでの検証

**成果物**:
- 主要5入庫区分の基本機能実装完了
- 単一作業としての動作確認完了
- 顧客向けLINE通知の動作確認完了
- ブログ用写真の管理機能の動作確認完了
- アクセシビリティ対応完了

---

## Phase 3: 複数作業管理の統合

**目的**: すべての入庫区分で複数作業管理機能を統合し、基幹システム連携を本格実装

**前提条件**: Phase 2で実装した各入庫区分が単一作業として動作確認済み

**実装項目**:
1. **複数作業管理機能の統合（すべての入庫区分で対応）**
   - すべての入庫区分で「作業を追加」機能を有効化
   - すべての入庫区分で作業選択UIを実装（タブ/ドロップダウン）
   - 作業ごとのデータ分離をすべての入庫区分で実装
   - URLパラメータ `workOrderId` で対象ワークオーダーを識別
   - 画面ヘッダーに現在の作業名を表示
   - 「他の作業を表示」ボタンで同じJobの他のワークオーダーに切替可能

2. **見積作成フローの基幹システム連携実装**
   - 見積画面に「基幹システムで見積作成」ボタンを追加
   - アドバイザー向けの手順表示（基幹システムで計算 → Webアプリで転記）
   - 見積項目の転記機能（品名、金額（税込））

3. **請求書統合フローの実装**
   - 基幹システムでの統合請求書作成手順の表示
   - 請求書PDFアップロード機能（ファイル名に「invoice」「seikyu」「請求書」を含む）
   - `baseSystemInvoiceId`の記録機能
   - `baseSystemItemId`の記録機能（各ワークオーダーごと）

4. **マスタデータ同期の実装**
   - GASの実装と動作確認
   - データ不整合時の対応UI（「📝変更申請あり」アイコン表示）
   - 「変更対応完了」ボタンの実装（Zoho CRMのDescriptionから【アプリ変更届】の文字列を削除）

**成果物**:
- 複数作業管理機能の全入庫区分対応完了
- 基幹システム連携の動作確認完了

---

## Phase 4: 拡張入庫区分の実装

**目的**: 残りの入庫区分を実装し、すべての入庫区分に対応

**実装項目**:
1. **タイヤ交換・ローテーション**
   - 受付画面
   - 診断画面（簡易検査項目：タイヤの状態確認、空気圧の確認、ホイールの状態確認、測定値入力）
   - 見積画面
   - 作業画面（作業記録、Before/After写真）
   - 引渡画面

2. **その他のメンテナンス**
   - 受付画面
   - 診断画面（カスタマイズ可能な診断項目）
   - 見積画面（部品リストアップ：記録は必要だが、診断時不要）
   - 作業画面（作業記録、Before/After写真）
   - 引渡画面

3. **チューニング・パーツ取付**
   - 受付画面（種類選択：チューニング/パーツ取付）
   - 診断画面（部品取り寄せ対応）
   - 見積画面（部品リストアップ）
   - 作業画面（作業記録、Before/After写真）
   - 引渡画面

4. **コーティング**
   - 事前見積画面（コーティング種類選択、オプションサービス選択、同時施工割引、下地処理は費用に含まれる、コーティング範囲：ボディ全体が基本、ガラス面はオプション）
   - 受付画面
   - 診断画面（車体の状態確認、既存コーティングの状態確認）
   - 作業画面（作業記録、Before/After写真、乾燥プロセスの管理、メンテナンス期間：1-3年）
   - 引渡画面

5. **板金・塗装**
   - 受付画面（事故案件情報、レッカー入庫、保険対応、代車提供管理）
   - 診断画面（損傷箇所確認、外注先への見積もり依頼、Before動画撮影必須）
   - 見積画面（外注先からの見積もり回答表示、保険対応、作業期間1-3カ月の表示）
   - 外注発注画面（外注先名入力、発注方法選択：写真送付/持ち込み）
   - 外注作業管理画面（作業進捗状況表示、作業完了連絡受付）
   - 引き取り・品質確認画面（品質確認チェックリスト、After写真撮影必須）
   - 引渡画面

6. **レストア**
   - 受付画面
   - 診断画面（現状確認、修復箇所確認、レストアの種類選択：フルレストア/部分レストア、Before写真必須）
   - 見積画面（部品リスト管理、追加作業管理、見積もり変更履歴、作業期間の表示）
   - 作業画面（フェーズ管理、マイルストーン管理、進捗管理0-100%、部品取り寄せ管理、作業記録、Before/After写真必須）
   - 引渡画面（PDF生成：レストア完了報告書、Before/After写真表示必須）

7. **その他**
   - 受付画面（業務内容の種類・詳細入力）
   - 診断画面（カスタマイズ可能な診断項目）
   - 見積画面（カスタマイズ可能な見積項目）
   - 作業画面（作業記録、Before/After写真）
   - 引渡画面

**成果物**:
- すべての入庫区分の実装完了
- 全入庫区分での動作確認完了

---

## Phase 5: 高度な機能の実装

**前提条件**: Phase 4が完了し、すべての入庫区分が実装済みであること

**目的**: 長期カスタムの管理機能、ビデオコミュニケーション機能、顧客ポータル機能を実装

**実装項目**:
1. **長期カスタムの管理機能**
   - レストアのフェーズ管理機能の強化
   - 板金・塗装の外注作業進捗管理機能の強化
   - 長期プロジェクトの進捗可視化

2. **ビデオコミュニケーション機能**
   - リアルタイムビデオ通話機能
   - ビデオ録画機能
   - ビデオ共有機能

3. **顧客ポータル機能**
   - 顧客向けダッシュボード
   - 作業進捗の確認機能
   - 見積もりの確認・承認機能
   - 請求書の確認・ダウンロード機能

4. **リアルタイム同期機能の強化**
   - リアルタイム更新（ポーリング方式、WebSocketサーバーは将来実装予定）
   - オフライン対応の強化
   - データ同期の最適化

**成果物**:
- 高度な機能の実装完了
- 全機能の動作確認完了

---

## 実装優先順位の詳細

### 最優先（Phase 0-1）
- 基盤システム連携（Zoho CRM拡張、Google Sheets/Drive連携、GAS）
- 共通コンポーネントライブラリ
- 複数作業管理機能

### 高優先（Phase 2）
- 車検、12ヵ月点検、エンジンオイル交換、故障診断、修理・整備

### 中優先（Phase 3）
- 複数作業管理の統合
- 基幹システム連携（見積作成、請求書統合）

### 標準優先（Phase 4）
- タイヤ交換・ローテーション、その他のメンテナンス、チューニング・パーツ取付、コーティング、板金・塗装、レストア、その他

### 低優先（Phase 5）
- 高度な機能（長期カスタム管理、ビデオコミュニケーション、顧客ポータル、リアルタイム同期強化）

---

## 各Phaseの依存関係

```
Pre-Phase 0 (実装前確認)
  ↓
Phase 0 (基盤システム連携)
  ↓
Phase 1 (共通基盤と複数作業管理)
  ↓
Phase 2 (主要入庫区分の実装)
  ↓
Phase 3 (複数作業管理の統合)
  ↓
Phase 4 (拡張入庫区分の実装)
  ↓
Phase 5 (高度な機能の実装)
```

**注意**: 
- **Pre-Phase 0は必須**: 実装開始前にZoho CRM管理者・基幹システム担当者への確認を完了させること。確認が完了しない場合はPhase 0に進まないこと。
- **Phase 0の条件分岐**: Zoho CRMフィールド追加が不可能な場合は、代替案（Google Drive JSON管理方式）を実装すること。
- **⚠️ マスタデータ保護**: アプリからGoogle Sheets（マスタデータ）やZoho CRMのマスタデータモジュール（Contacts、CustomModule1）への追加・編集・削除は絶対にしない。実装時にバリデーションを実装すること。
- Phase 2とPhase 3は並行して実装可能（Phase 2で単一作業として実装し、Phase 3で複数作業管理を統合）
- Phase 2で実装する際に、基幹システム連携の準備（見積画面の基幹システム連携フロー表示など）を実施
- Phase 3で複数作業管理を統合する際に、基幹システム連携を本格実装（請求書統合フロー、データ不整合対応UI）

---

## 実装期間の目安

- **Pre-Phase 0**: 1-2週間（確認事項の回答待ち時間を含む）
- **Phase 0**: 2-3週間（Zoho CRMフィールド追加可否により変動。フィールド追加が不可能な場合は代替案実装に追加で1週間）
- **Phase 1**: 4-6週間
- **Phase 2**: 6-8週間
- **Phase 3**: 3-4週間
- **Phase 4**: 8-10週間
- **Phase 5**: 4-6週間

**合計**: 約28-39週間（約7-10ヶ月）

---

## リスクと対策

### リスク1: 基幹システム連携の複雑さ
**対策**: Phase 0で十分に検証し、Phase 3で本格実装

### リスク2: 複数作業管理のデータ整合性
**対策**: Phase 1で単体テストを徹底し、Phase 3で統合テストを実施

### リスク3: マスタデータ同期の不整合
**対策**: GASの実装を早期に完了し、データ不整合時の対応UIを実装

### リスク4: 入庫区分ごとの特殊要件
**対策**: Phase 2で主要入庫区分を実装し、パターンを確立してからPhase 4で拡張

### リスク5: Zoho CRMフィールド追加失敗
**影響**: `field_service_kinds`, `field_work_orders`, `field_base_system_id`が追加できない場合、複数作業管理機能が実装できない
**対策**: 
- Pre-Phase 0でZoho CRM管理者への確認を徹底
- フィールド追加が不可能な場合、Google Drive JSON管理方式を採用（Phase 0の代替案として実装）
- アプリ側で両方式に対応できるよう設計（フィールド存在チェックによる自動切り替え）

### リスク6: データクレンジング未実施
**影響**: 基幹システムの顧客IDとZoho CRMの`ID1`のフォーマット不一致により、マスタデータ同期が失敗する
**対策**: 
- Pre-Phase 0でデータクレンジングを必須実施
- データクレンジング完了報告書の作成を必須化
- GAS実装時にデータフォーマット検証を追加（不一致データの検出とエラー通知）

### リスク7: 工程ステージ選択肢不一致
**影響**: Zoho CRMの`field5`（工程ステージ）PickListの選択肢が仕様書と異なる場合、ステータス管理が正常に動作しない
**対策**: 
- Pre-Phase 0でZoho CRM管理者からPickList選択肢一覧を取得
- 取得した選択肢に基づいてアプリ側の`JobStage` enumを調整
- 選択肢が仕様と大きく異なる場合は、Zoho CRM管理者と協議して調整を依頼

### リスク8: マスタデータへの誤更新
**影響**: アプリからZoho CRMやGoogle Sheets（マスタデータ）への誤った追加・編集・削除により、基幹システムとのデータ不整合が発生
**対策**: 
- **実装時の制約を明確化**: すべてのAPI実装で、マスタデータ（顧客・車両）への追加・編集・削除を禁止
- **バリデーション実装**: 
  - Google Sheets API: 読み取り専用として実装（書き込みメソッドを呼び出さない）
  - Zoho CRM API: マスタデータモジュール（Contacts、CustomModule1）への更新を禁止するバリデーションを実装
  - 許可されたフィールドのみ更新可能（LINE ID、メール同意、誕生日など）
- **コードレビュー**: マスタデータへの更新処理がないことを確認
- **テスト**: マスタデータへの更新試行時にエラーを返すことを確認

---

## 関連ドキュメント

- [統合仕様書](./INTEGRATED_SPECIFICATION.md): システム全体の統合仕様
- [技術スタックとファイル構造仕様](./TECH_STACK_AND_FILE_STRUCTURE.md): 技術スタックとGoogle Driveのファイル構造・命名規則
- [フォルダ構造再設計提案](./FOLDER_STRUCTURE_PROPOSAL.md): Google Driveフォルダ構造の詳細設計と提案
- [システム進化計画](./SYSTEM_EVOLUTION_PLAN.md): 基幹システム制約下での設計変更方針
- [ユーザーワークフロー詳細設計 v2.0](./USER_WORKFLOW_DETAILED_DESIGN_V2.md): ユーザー別業務・システム利用詳細設計
- [共通コンポーネントライブラリ](./COMMON_COMPONENTS_LIBRARY.md): UI/UXコンポーネントの定義
- [API設計](./API_DESIGN_UNIFIED.md): 統一API設計

---

## 更新履歴

- 2025-01-XX: 初版作成（システム制約を考慮した新しいロードマップ）
- 2025-01-XX: Phase 3の詳細を明確化、関連ドキュメントへの参照を追加
- 2025-01-XX: マスタデータ保護制約を追加（Google Sheets、Zoho CRMマスタデータモジュールへの追加・編集・削除禁止）
- 2025-01-XX: Phase 0「Google Drive連携（ファイル保存）」の実装完了
  - Google Drive APIクライアントライブラリ（`src/lib/google-drive.ts`）を作成
  - Next.js API Routes（`/api/google-drive/folders`, `/api/google-drive/files`）を実装
  - フォルダ構造の自動生成機能（顧客→車両→Job階層）を実装
  - ファイルアップロード・検索・取得機能を実装
  - 請求書PDF検索、車検証管理、ブログ用写真管理機能を実装
  - ファイル移動・コピーAPIの実装完了（`src/app/api/google-drive/files/[fileId]/move/route.ts`, `src/app/api/google-drive/files/[fileId]/copy/route.ts`）
    - 車検証履歴管理での使用（既存車検証を履歴フォルダに移動）
    - ブログ用写真コピーでの使用（複数フォルダへの同時コピー）
  - **注意**: Google OAuth認証は未実装（環境変数からアクセストークンを取得する暫定実装）
- 2025-01-XX: Phase 0「スマートタグ管理システム構築（Googleスプレッドシート）」の実装完了
  - スマートタグ管理用の型定義を追加（`TagSheetRow`, `SessionSheetRow`, `TagStatus`, `SessionStatus`）
  - Google Sheets APIクライアントライブラリ（`src/lib/smart-tags.ts`）を作成
  - Next.js API Routes（`/api/smart-tags/tags`, `/api/smart-tags/sessions`）を実装
  - タグライフサイクル管理機能を実装（紐付け、解放、排他制御、リトライ処理）
  - SWRフック（`src/hooks/use-smart-tags.ts`）を実装
  - **注意**: 環境変数`GOOGLE_SHEETS_SMART_TAGS_ID`の設定が必要
- 2025-01-XX: Phase 0「GAS（Google Apps Script）の実装」の実装完了
  - GAS実装ガイドドキュメント（`docs/GAS_IMPLEMENTATION_GUIDE.md`）を作成
  - GASスクリプトテンプレート（`scripts/gas-master-data-sync.gs`）を作成
  - CSV/Excelファイル検知機能を実装（ファイル名パターンマッチング）
  - エンコーディング処理を実装（UTF-8/Shift-JIS自動検出、文字化けチェック）
  - CSV/Excel → Google Sheets変換機能を実装（日本語カラム名保持、全件置換）
  - エラーハンドリングと通知機能を実装（Gmail通知、エラーログ記録）
  - トリガー設定の実装（onChangeイベント、Time-drivenトリガー）
  - **注意**: Google Apps Scriptエディタでの手動セットアップが必要（フォルダID、スプレッドシートIDの設定）
  - **注意**: Excelファイルの読み込みはGoogle Drive APIの変換機能を使用（制限あり）
- 2025-01-XX: Phase 1「共通UI/UXコンポーネントライブラリの実装」の一部完了
  - PhotoCaptureButtonコンポーネント（`src/components/features/photo-capture-button.tsx`）を実装
    - カメラ起動、画像自動圧縮（500KB以下）、プレビュー表示、ローディング状態表示
  - VideoCaptureButtonコンポーネント（`src/components/features/video-capture-button.tsx`）を実装
    - カメラ起動、最大録画時間制限（デフォルト: 15秒）、ファイルサイズチェック（デフォルト: 10MB）
  - AudioInputButtonコンポーネント（`src/components/features/audio-input-button.tsx`）を実装
    - 音声録音（MediaRecorder API）、最大録音時間制限、録音中の視覚的フィードバック
  - OBDDiagnosticResultSectionコンポーネント（`src/components/features/obd-diagnostic-result-section.tsx`）を実装
    - OBD診断結果PDFのアップロード・表示・ダウンロード機能（12ヶ月点検専用）
  - OptionMenuSelectorコンポーネント（`src/components/features/option-menu-selector.tsx`）を実装
    - オプションメニュー選択UI、10%割引適用、割引前後価格の併記（12ヶ月点検専用）
  - オプションメニュー関連の型定義（`OptionMenuItem`）を追加
- 2025-01-XX: Phase 1「統一データモデルの実装（複数作業管理対応）」の一部完了
  - WorkOrder関連の型定義を追加（`WorkOrder`, `WorkOrderStatus`, `DiagnosisData`, `EstimateData`, `WorkData`, `BaseJob`）
  - データ変換ロジック（`src/lib/work-order-converter.ts`）を実装
    - Zoho CRM ↔ アプリ内データモデルの相互変換
    - `field_work_orders`（Multi-Line JSON）のパース・シリアライズ
    - ワークオーダーの作成・更新・削除ユーティリティ関数
  - ワークオーダーCRUD API Routesを実装
    - `GET /api/jobs/{id}/work-orders` - ワークオーダー一覧取得
    - `POST /api/jobs/{id}/work-orders` - ワークオーダー作成
    - `GET /api/jobs/{id}/work-orders/{workOrderId}` - ワークオーダー詳細取得
    - `PATCH /api/jobs/{id}/work-orders/{workOrderId}` - ワークオーダー更新
    - `DELETE /api/jobs/{id}/work-orders/{workOrderId}` - ワークオーダー削除
  - Zoho CRM APIクライアントにJob更新関数を追加（`src/lib/zoho-api-client.ts`）
    - `updateJob`関数の実装（汎用的なJob更新関数）
    - レート制限対策（指数バックオフリトライ）を含む
    - エラーハンドリングとログ記録
  - ワークオーダーCRUD APIでZoho CRM更新関数を使用するように統合
    - `POST /api/jobs/{id}/work-orders` - ワークオーダー作成時のZoho CRM更新
    - `PATCH /api/jobs/{id}/work-orders/{workOrderId}` - ワークオーダー更新時のZoho CRM更新
    - `DELETE /api/jobs/{id}/work-orders/{workOrderId}` - ワークオーダー削除時のZoho CRM更新
    - **注意**: 実際のZoho CRM APIエンドポイント（`/api/zoho/jobs/{id}`）の実装は別途必要（モック環境では動作しない）
- 2025-01-XX: Phase 1「複数作業管理機能のUI実装（作業追加、作業選択UI）」の一部完了
  - AddWorkOrderDialogコンポーネント（`src/components/features/add-work-order-dialog.tsx`）を実装
    - 作業区分選択、既存作業の重複チェック、作業追加API呼び出し
  - WorkOrderSelectorコンポーネント（`src/components/features/work-order-selector.tsx`）を実装
    - タブ形式の作業選択UI、ステータスバッジ表示、作業追加ボタン
  - useWorkOrdersフック（`src/hooks/use-work-orders.ts`）を実装
    - ワークオーダー一覧・詳細取得、作成・更新・削除関数、SWRキャッシュ管理
- 2025-01-XX: Phase 1「エラーハンドリングの統一実装」の完了
  - 統一エラーハンドリングシステム（`src/lib/error-handling.ts`）を実装
    - エラーコード定義（ErrorCodes）、エラーカテゴリ（ErrorCategory）
    - ユーザー向けエラーメッセージ定義（ErrorMessages）
    - エラーログ機能（クライアント側: ローカルストレージ、最大100件）
    - エラーハンドリングユーティリティ関数（getErrorCategory、getUserFriendlyMessage、createErrorLogEntry等）
  - サーバー側エラーハンドリング（`src/lib/server-error-handling.ts`）を実装
    - エラーレスポンス生成関数（createErrorResponse、createValidationErrorResponse等）
    - API Routeハンドラーラッパー（withErrorHandling）
    - サーバー側エラーログ記録（logServerError）
  - ユーザー向けエラーメッセージ表示コンポーネント（`src/components/features/error-message.tsx`）を実装
    - ErrorMessageコンポーネント（エラーカテゴリに応じたスタイル、閉じるボタン対応）
    - SuccessMessageコンポーネント（成功メッセージ表示）
- 2025-01-XX: Phase 1「オフライン対応基盤の実装」の一部完了
  - オフラインストレージ管理（`src/lib/offline-storage.ts`）を実装
    - IndexedDB管理（データベース作成、保存・取得・削除、ストアクリア）
    - LocalStorage管理（保存・取得・削除、キー一覧取得）
    - 同期キュー管理（追加・取得・ステータス更新）
  - オンライン/オフライン状態監視フック（`src/hooks/use-online-status.ts`）を実装
    - navigator.onLine APIを使用した状態監視
  - オフラインバナーコンポーネント（`src/components/features/offline-banner.tsx`）を実装
    - OfflineBanner（オフライン時表示）
    - OnlineBanner（オンライン復帰時一時表示）
  - 同期状態インジケーター（`src/components/features/sync-indicator.tsx`）を実装
    - 同期済み/同期中/未同期/エラーの4状態表示
    - 未同期アイテム数の表示、エラーメッセージ表示
  - 同期管理システム（`src/lib/sync-manager.ts`）を実装
    - 同期キュー処理、同期ハンドラー登録、自動同期開始/停止、手動同期
  - 自動同期フック（`src/hooks/use-auto-sync.ts`）を実装
    - オンライン復帰時の自動同期、定期的な同期処理、未同期アイテム数管理
  - コンフリクト検出システム（`src/lib/conflict-detection.ts`）を実装
    - データ間のコンフリクト検出、解決方法（ローカル優先/サーバー優先/マージ）
  - コンフリクト解決UI（`src/components/features/conflict-resolution-dialog.tsx`）を実装
    - コンフリクト情報表示、解決方法選択、データ比較表示
  - ファイルアップロードキュー管理（`src/lib/upload-queue.ts`）を実装
    - アップロードキューへの追加・取得・削除、アップロード処理、キュー処理
  - アップロードキューインジケーター（`src/components/features/upload-queue-indicator.tsx`）を実装
    - 未アップロードファイル数の表示、手動アップロード、自動アップロード（オンライン復帰時）
- 2025-01-XX: Phase 1「セキュリティ基盤の実装」の完了
  - 認証関連の型定義（`src/types/auth.ts`）を追加
    - User, Session, UserRole, LoginRequest, LoginResponse
  - 認証管理システム（`src/lib/auth.ts`）を実装
    - セッション管理（保存・取得・削除・有効性チェック）、ロールチェック、ログイン/ログアウト（モック実装）、将来のJWT対応準備
  - 認証フック（`src/hooks/use-auth.ts`）を実装
    - セッション管理、ユーザー情報取得、ログイン/ログアウト、セッション更新
  - ロールベースアクセス制御（`src/lib/rbac.ts`）を実装
    - 権限マトリックス、アクション/リソース権限チェック、ルート保護設定
  - ルートガードコンポーネント（`src/components/features/route-guard.tsx`）を実装
    - 認証チェック、ロールベースアクセス制御、未認証/未許可時のリダイレクト/エラー表示
  - CSRF対策（`src/lib/csrf.ts`）を実装
    - CSRFトークン生成・管理、Fetch APIラッパー（自動トークン追加）
  - CSRFトークン取得API（`src/app/api/auth/csrf-token/route.ts`）を実装
    - CSRFトークンの生成と返却
  - サーバー側CSRF検証（`src/lib/server-csrf.ts`）を実装
    - CSRFトークン検証、CSRF保護ミドルウェア
  - ファイルアップロードバリデーション（`src/lib/file-validation.ts`）を実装
    - 拡張子検証、MIMEタイプ検証、ファイルサイズ検証、複数ファイル検証、ファイルタイプ判定
- 2025-01-XX: Phase 1「効果測定基盤の実装」の完了
  - アナリティクスの型定義（`src/types/index.ts`）を追加
    - UsageAnalytics, PageViewEvent, ActionEvent, ErrorEvent, TimingEvent
  - アナリティクス収集ライブラリ（`src/lib/analytics.ts`）を実装
    - イベントキュー管理、バッチ送信、ページアンロード時の送信、trackPageView, trackAction, trackError, trackTiming
  - ページビュートラッキング（`src/hooks/use-page-view.ts`）を実装
    - ページ遷移時の自動記録
  - ページ表示時間計測（`src/hooks/use-page-timing.ts`）を実装
    - ページ読み込み時間の自動計測
  - アクション完了トラッキング（`src/lib/action-tracking.ts`）を実装
    - アクション名定義、trackActionSuccess, trackActionFailure、便利関数（診断完了、見積送信、見積承認、作業完了）
  - エラー発生トラッキングを統合
    - エラーハンドリングシステム（`src/lib/error-handling.ts`）の`logError`関数を拡張してアナリティクスにも記録
  - API応答時間計測（`src/lib/api-timing.ts`）を実装
    - fetchWithTiming関数、グローバルFetch APIの拡張（オプション）
  - アナリティクス送信API（`src/app/api/analytics/route.ts`）を実装
    - イベント受信、バリデーション、将来の外部サービス連携準備
- 2025-01-XX: Phase 1「Zoho API制約対応の実装」の完了
  - Lookupフィールド検証（`src/lib/zoho-lookup-validation.ts`）を実装
    - 顧客レコードID検証、車両レコードID検証、一括検証
  - Zoho APIクライアント（`src/lib/zoho-api-client.ts`）を実装
    - Lookupフィールド更新時の検証統合、指数バックオフリトライ、エラーハンドリング
  - バッチ処理（`src/lib/zoho-batch.ts`）を実装
    - 複数更新のまとめ処理、バッチキュー管理、API呼び出し回数の削減
  - エラーハンドリング（`src/lib/zoho-error-handler.ts`）を実装
    - 指数バックオフリトライ、エラーレスポンス処理、フィールド不存在時のフォールバック、Google Drive JSON管理方式へのフォールバック
- 2025-01-XX: Phase 1「顧客(Contacts)モジュール更新制約の実装」の完了
  - フィールドバリデーション（`src/lib/customer-field-validation.ts`）を実装
    - 直接更新NGフィールド定義、フィールド更新権限チェック、更新データから直接更新NGフィールドの抽出・除外
  - Description追記ロジック（`src/lib/customer-description-append.ts`）を実装
    - 変更届フォーマット（【アプリ変更届】YYYY-MM-DD HH:mm: 項目名: 変更前 → 変更後）、Descriptionへの追記、変更要求の削除・チェック
  - 顧客更新処理（`src/lib/customer-update.ts`）を実装
    - 制約チェック付き更新、誤更新防止（自動的にDescription追記に変換）、変更要求対応完了処理、変更要求チェック

---

## Phase 2: 主要入庫区分の実装（単一作業対応）

**前提条件**: Phase 1が完了し、共通コンポーネントライブラリと複数作業管理機能が動作確認済みであること

**目的**: 主要な入庫区分を単一作業として実装し、基本機能を動作確認

**実装進捗**:
- 2025-01-XX: Phase 2「車検：受付画面の拡張」の完了
  - 車検証アップロード機能（`src/lib/vehicle-registration-upload.ts`）を実装
    - 車検証ファイルのアップロード、既存車検証の履歴フォルダへの移動、車検証ファイルの取得
  - 車検証アップロードUI（`src/components/features/vehicle-registration-upload.tsx`）を実装
    - ファイル選択、プレビュー表示、アップロード処理、エラーハンドリング、アップロード完了表示
- 2025-01-XX: Phase 2「車検：診断画面の拡張」の完了
  - 検査項目データ（`src/lib/inspection-items.ts`）を実装
    - 車検用の検査項目リスト（7カテゴリ、50項目以上）、測定値定義、動画撮影要件定義
  - カテゴリタブコンポーネント（`src/components/features/inspection-category-tabs.tsx`）を実装
    - カテゴリ別タブ表示、アイコン表示、項目数表示、カテゴリ切り替え
  - 検査項目入力コンポーネント（`src/components/features/inspection-item-input.tsx`）を実装
    - 信号機ボタン（OK/注意/要交換）、測定値入力、動画撮影（不具合時のみ、最大15秒）
  - 信号機ボタンコンポーネント（`src/components/features/traffic-light-button.tsx`）を実装
    - 共通コンポーネントとして分離、サイズオプション対応
  - 車検診断ビュー（`src/components/features/inspection-diagnosis-view.tsx`）を実装
    - カテゴリタブ統合、検査項目リスト表示、状態管理
  - Progressコンポーネント（`src/components/ui/progress.tsx`）を実装
    - 進捗バー表示コンポーネント
  - 診断画面の拡張（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - サービス種類判定（車検/12ヵ月点検）、車検用UIの条件分岐表示、車検用の状態管理とハンドラ追加
- 2025-01-XX: Phase 2「車検：見積画面の拡張」の完了
  - 法定費用自動取得機能（`src/lib/legal-fees.ts`）を実装
    - Google Sheetsから車両マスタを取得して法定費用を自動計算
  - 法定費用カードコンポーネント（`src/components/features/legal-fees-card.tsx`）を実装
    - 編集不可、自動取得表示、項目別表示、合計金額表示
  - 診断結果から見積項目への変換機能（`src/lib/diagnosis-to-estimate.ts`）を実装
    - 「要交換」「注意」と判定された項目を自動的に見積項目に追加
  - 見積画面の拡張（`src/app/admin/estimate/[id]/page.tsx`）
    - サービス種類判定（車検/12ヵ月点検）、法定費用カードの条件分岐表示、診断結果から自動追加機能
- 2025-01-XX: Phase 2「車検：作業画面の拡張」の完了
  - 承認された作業項目表示コンポーネント（`src/components/features/approved-work-item-card.tsx`）を実装
    - 項目名、状態（作業中/完了）、Before/After写真（複数枚可能）、コメント、完了ボタン
  - 作業進捗バーコンポーネント（`src/components/features/work-progress-bar.tsx`）を実装
    - 完了項目数/全項目数、進捗パーセンテージ、プログレスバー
  - 作業画面の拡張（`src/app/mechanic/work/[id]/page.tsx`）
    - サービス種類判定（車検/12ヵ月点検）、車検用UIの条件分岐表示、承認された作業項目の表示
- 2025-01-XX: Phase 2「車検：引渡画面（PDF生成）」の完了
  - 分解整備記録簿PDF生成機能（`src/lib/inspection-pdf-generator.ts`）を実装
    - jsPDFを使用したPDF生成、車両情報・検査項目・測定値・交換部品・整備情報の転記
  - 車検引渡機能（`src/lib/inspection-delivery.ts`）を実装
    - PDF生成、Google Drive保存、書類フォルダへの保存
  - 作業画面の完了処理を拡張（`src/app/mechanic/work/[id]/page.tsx`）
    - 車検の場合、作業完了時に分解整備記録簿PDFを生成してGoogle Driveに保存、ステータスを「出庫待ち」に更新
- 2025-01-XX: Phase 2「車検：交換部品記録機能」の完了
  - 交換部品記録UIコンポーネント（`src/components/features/replacement-parts-recorder.tsx`）を実装
    - 部品名・数量・単位の入力、追加・編集・削除機能
  - 作業画面に交換部品記録機能を統合（`src/app/mechanic/work/[id]/page.tsx`）
    - 車検の場合のみ表示、交換部品データの状態管理、PDF生成時に交換部品データを渡す
- 2025-01-XX: Phase 2「12ヵ月点検：診断画面の拡張（OBD診断結果PDFアップロード）」の完了
  - 診断画面にOBD診断結果PDFアップロード機能を統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - 12ヵ月点検の場合のみ表示、OBD診断結果PDFのアップロード・表示・削除機能、診断データにOBD診断結果を含める
- 2025-01-XX: Phase 2「12ヵ月点検：見積画面の拡張（オプションメニュー機能、10%割引）」の完了
  - 見積画面にオプションメニューセレクターを統合（`src/app/admin/estimate/[id]/page.tsx`）
    - 12ヵ月点検の場合のみ表示、8種類のオプションメニューから選択、車検と同時実施で10%割引適用、選択したメニューを見積項目に自動追加
- 2025-01-XX: Phase 2「12ヵ月点検：作業画面・引渡画面の動作確認」の完了
  - 作業画面のタイトル表示を修正（`src/app/mechanic/work/[id]/page.tsx`）
    - 12ヵ月点検の場合「12ヵ月点検作業」と表示、車検と12ヵ月点検の両方で分解整備記録簿PDF生成に対応
  - 引渡機能のコメントを更新（`src/lib/inspection-delivery.ts`）
    - 車検・12ヵ月点検の両方に対応することを明記
- 2025-01-XX: Phase 2「エンジンオイル交換：診断画面の実装（簡易検査項目3項目）」の完了
  - エンジンオイル交換用の簡易検査項目データ（`src/lib/engine-oil-inspection-items.ts`）を実装
    - 3項目（エンジンオイルの状態、オイルフィルターの状態、エンジンルームの清掃状態）を定義
  - エンジンオイル交換用の診断ビューコンポーネント（`src/components/features/engine-oil-inspection-view.tsx`）を実装
    - 信号機ボタン（OK/注意/要交換）、写真撮影、コメント入力、進捗表示
  - 診断画面にエンジンオイル交換用UIを統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - エンジンオイル交換の場合のみ表示、簡易検査項目の状態管理とハンドラ追加
- 2025-01-XX: Phase 2「エンジンオイル交換：見積画面の実装（部品リストアップ：基本不要、イレギュラー時のみ）」の完了
  - 見積画面にエンジンオイル交換用の処理を追加（`src/app/admin/estimate/[id]/page.tsx`）
    - エンジンオイル交換の場合は初期状態で見積項目を空にする、イレギュラー時のみ手動で項目追加可能、説明メッセージを表示
- 2025-01-XX: Phase 2「エンジンオイル交換：作業画面・引渡画面の動作確認」の完了
  - 作業画面のタイトル表示を修正（`src/app/mechanic/work/[id]/page.tsx`）
    - エンジンオイル交換の場合「エンジンオイル交換作業」と表示、既存の作業項目管理機能を使用（Before/After写真、作業記録）
  - 引渡画面は既存の実装で対応（ステータス更新、作業完了処理）
- 2025-01-XX: Phase 2「故障診断：受付画面の実装（エラーランプ管理）」の完了
  - エラーランプ管理用の型定義（`src/lib/error-lamp-types.ts`）を実装
    - エラーランプの有無、種類（9種類）、その他の詳細を定義
  - エラーランプ入力ダイアログコンポーネント（`src/components/features/error-lamp-input-dialog.tsx`）を実装
    - エラーランプの有無選択、種類の複数選択、その他の詳細入力
  - 受付画面にエラーランプ入力ダイアログを統合（`src/app/page.tsx`）
    - 故障診断の場合のみ表示、タグ選択後にエラーランプ情報を入力、チェックイン時にエラーランプ情報を保存
- 2025-01-XX: Phase 2「故障診断：診断画面の実装（症状カテゴリ、診断機利用、動画撮影、音声録音、エラーランプ管理）」の完了
  - 故障診断用の型定義（`src/lib/fault-diagnosis-types.ts`）を実装
    - 症状カテゴリ（9種類）、症状リスト、診断機結果、故障診断データの型定義
  - 故障診断ビューコンポーネント（`src/components/features/fault-diagnosis-view.tsx`）を実装
    - 症状カテゴリタブ、症状選択、診断機結果PDFアップロード、動画撮影、音声録音、エラーランプ情報表示、追加メモ
  - 診断画面に故障診断機能を統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - 故障診断の場合にFaultDiagnosisViewを表示、診断完了時に症状・診断機結果・動画・音声・メモを保存
- 2025-01-XX: Phase 2「故障診断：見積画面の実装（原因説明、修理方法提案、診断機結果PDF表示・ダウンロード）」の完了
  - 故障診断見積ビューコンポーネント（`src/components/features/fault-diagnosis-estimate-view.tsx`）を実装
    - 原因説明入力、修理方法提案入力、診断機結果PDF表示・ダウンロード
  - 見積画面に故障診断機能を統合（`src/app/admin/estimate/[id]/page.tsx`）
    - 故障診断の場合にFaultDiagnosisEstimateViewを表示、診断結果から診断機結果を取得、原因説明と修理方法提案を入力可能
- 2025-01-XX: Phase 2「故障診断：作業画面の実装（作業記録、Before/After写真）」の完了
  - 作業画面に故障診断機能を統合（`src/app/mechanic/work/[id]/page.tsx`）
    - 故障診断の場合に「故障診断作業」と表示、承認された作業項目に対してBefore/After写真撮影、作業記録、作業完了処理を実装
    - 承認された作業項目をワークオーダーから取得するロジックを追加
- 2025-01-XX: Phase 2「故障診断：引渡画面の実装」の完了
  - 引渡画面は既存の実装で対応（`src/app/customer/report/[id]/page.tsx`）
    - 故障診断の場合も既存の引渡画面で対応可能（Before/After写真、作業項目、整備士コメントを表示）
    - 将来的に故障診断特有の情報（原因説明、修理方法提案、診断機結果PDF）を表示する機能を追加可能
- 2025-01-XX: Phase 2「修理・整備：受付画面の実装」の完了
  - 受付画面は既存の実装で対応（`src/app/page.tsx`）
    - 修理・整備の場合も既存の受付フローで対応可能（タグ選択、代車選択）
- 2025-01-XX: Phase 2「修理・整備：診断画面の実装（診断機結果PDFのアップロード・表示・ダウンロード管理）」の完了
  - 診断画面に修理・整備機能を統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - 修理・整備の場合に「修理・整備診断」と表示、診断機結果PDFのアップロード・表示・ダウンロード機能を追加（OBDDiagnosticResultSectionを再利用）
    - 診断完了時に診断機結果PDFを保存
- 2025-01-XX: Phase 2「修理・整備：見積画面の実装（部品リストアップ、音声入力対応）」の完了
  - 部品リスト入力コンポーネント（`src/components/features/parts-list-input.tsx`）を実装
    - 部品名、数量、単価の入力、部品の追加・更新・削除、部品合計の自動計算
  - 見積画面に修理・整備機能を統合（`src/app/admin/estimate/[id]/page.tsx`）
    - 修理・整備の場合にPartsListInputとAudioInputButtonを表示、部品リストを見積項目に自動追加、音声データを保存
- 2025-01-XX: Phase 2「修理・整備：作業画面の実装（作業記録、Before/After写真）」の完了
  - 作業画面に修理・整備機能を統合（`src/app/mechanic/work/[id]/page.tsx`）
    - 修理・整備の場合に「修理・整備作業」と表示、承認された作業項目に対してBefore/After写真撮影、作業記録、作業完了処理を実装
    - 承認された作業項目をワークオーダーから取得するロジックを追加
- 2025-01-XX: Phase 2「修理・整備：引渡画面の実装」の完了
  - 引渡画面は既存の実装で対応（`src/app/customer/report/[id]/page.tsx`）
    - 修理・整備の場合も既存の引渡画面で対応可能（Before/After写真、作業項目、整備士コメントを表示）
- 2025-01-XX: Phase 2「顧客向け進捗通知機能（LINE）：LINE Messaging API連携の実装」の完了
  - LINE Messaging APIクライアントライブラリ（`src/lib/line-api.ts`）を実装
    - 通知送信、マジックリンク生成、通知履歴取得、リトライ機能
  - LINE通知テンプレート（`src/lib/line-templates.ts`）を実装
    - 入庫完了、診断完了、見積送付、見積承認、作業完了の5種類のテンプレート
  - Next.js API Routesを実装
    - `POST /api/line/notify` - 通知送信
    - `POST /api/line/magic-link` - マジックリンク生成
    - `GET /api/line/history` - 通知履歴取得
    - `POST /api/line/retry/[notificationId]` - 通知リトライ
  - 環境変数: `LINE_CHANNEL_ACCESS_TOKEN`（LINE Messaging APIのチャネルアクセストークン）
- 2025-01-XX: Phase 2「ブログ用写真の管理機能」の完了
  - ブログ用写真管理ライブラリ（`src/lib/blog-photo-manager.ts`）を実装
    - 写真コピー、複数フォルダへの同時コピー、ファイル名自動リネーム、公開済みフラグ管理
    - 分類フォルダ: 日付別、作業種類別、車種別、Before/After別
    - ファイル名命名規則: `{日付}_{車種}_{作業種類}_{種類}_{連番}.{拡張子}`
  - ブログ用写真選択UIコンポーネント（`src/components/features/blog-photo-selector.tsx`）を実装
    - チェックボックスで複数選択可能、Before/Afterバッジ表示、選択状態の視覚的フィードバック
  - 作業完了画面にブログ用写真公開機能を統合（`src/app/customer/report/[id]/page.tsx`）
    - Before/After写真からブログ用写真リストを生成、選択・公開処理、公開済みフラグの記録
- 2025-01-XX: Phase 2「ローディング/フィードバックUIの実装」の完了
  - スケルトンUIコンポーネント（`src/components/ui/skeleton.tsx`）は既に実装済み
    - 各画面（受付画面、診断画面、見積画面等）で使用中
  - トースト通知コンポーネント（`src/components/ui/sonner.tsx`）は既に実装済み
    - `sonner`ライブラリを使用、成功/エラー/警告/情報の4種類に対応、`src/app/layout.tsx`で設定済み
  - オプティミスティックUI更新フック（`src/hooks/use-optimistic-update.ts`）を実装
    - SWRと組み合わせて即座にUIを更新、サーバー同期、エラー時のロールバック機能
  - 自動保存インジケーター（`src/components/features/auto-save-indicator.tsx`）を実装
    - 保存中/保存済み/エラーの3状態を表示、最後に保存した時刻を表示
  - ハプティックフィードバック（`src/lib/haptic-feedback.ts`）を実装
    - モバイルデバイスでの触覚フィードバック、6種類の振動パターン（light/medium/heavy/success/warning/error）
- 2025-01-XX: Phase 2「カラーユニバーサルデザイン対応」の完了
  - 診断結果の状態表示を4重表現に拡張（`src/components/features/traffic-light-button.tsx`）
    - 色（背景色・テキスト色）+ 形状（円形/四角形/三角形/ダイヤモンド形/六角形）+ アイコン + テキストラベル
    - 境界線スタイル（実線/破線/二重線）も追加
    - スクリーンリーダー対応（`aria-label`に形状情報を含める、`title`属性に形状情報を追加）
  - カラーユニバーサルデザイン対応ガイド（`docs/color-universal-design-guide.md`）を作成
    - 状態表示のマッピング表、実装例、アクセシビリティ対応、色覚シミュレーターでの検証方法、ベストプラクティス
- 2025-01-XX: Phase 3「複数作業管理機能の統合：診断画面への統合」の完了
  - 診断画面に複数作業管理機能を統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - `useWorkOrders`フックを使用してワークオーダーを取得
    - URLパラメータ`workOrderId`から選択中のワークオーダーを識別（`useSearchParams`を使用）
    - `WorkOrderSelector`コンポーネントを表示（複数作業がある場合）
    - `AddWorkOrderDialog`を統合（作業追加機能）
    - 診断データ保存時に選択中のワークオーダーに保存（`updateWorkOrder`を使用）
    - 画面ヘッダーに現在の作業名を表示
    - ワークオーダー選択時にURLパラメータを更新して切り替え（`router.push`を使用）
    - 作業ごとのデータ分離を実装（診断データは各ワークオーダーの`diagnosis`フィールドに保存）
    - 複数作業管理の場合、Job全体のステータスは各ワークオーダーのステータスで管理
- 2025-01-XX: Phase 3「複数作業管理機能の統合：見積画面への統合」の完了
  - 見積画面に複数作業管理機能を統合（`src/app/admin/estimate/[id]/page.tsx`）
    - `useWorkOrders`フックを使用してワークオーダーを取得
    - URLパラメータ`workOrderId`から選択中のワークオーダーを識別（`useSearchParams`を使用）
    - `WorkOrderSelector`コンポーネントを表示（複数作業がある場合）
    - `AddWorkOrderDialog`を統合（作業追加機能）
    - 見積データ保存時に選択中のワークオーダーに保存（`updateWorkOrder`を使用）
    - 画面ヘッダーに現在の作業名を表示
    - ワークオーダー選択時にURLパラメータを更新して切り替え（`router.push`を使用）
    - 作業ごとのデータ分離を実装（見積データは各ワークオーダーの`estimate`フィールドに保存）
    - 複数作業管理の場合、Job全体のステータスは各ワークオーダーのステータスで管理
- 2025-01-XX: Phase 3「複数作業管理機能の統合：作業画面への統合」の完了
  - 作業画面に複数作業管理機能を統合（`src/app/mechanic/work/[id]/page.tsx`）
    - `useWorkOrders`フックを使用してワークオーダーを取得
    - URLパラメータ`workOrderId`から選択中のワークオーダーを識別（`useSearchParams`を使用）
    - `WorkOrderSelector`コンポーネントを表示（複数作業がある場合）
    - `AddWorkOrderDialog`を統合（作業追加機能）
    - 作業完了時に選択中のワークオーダーに保存（`updateWorkOrder`を使用）
    - 画面ヘッダーに現在の作業名を表示
    - ワークオーダー選択時にURLパラメータを更新して切り替え（`router.push`を使用）
    - 作業ごとのデータ分離を実装（作業データは各ワークオーダーの`work`フィールドに保存）
    - 複数作業管理の場合、Job全体のステータスは各ワークオーダーのステータスで管理
    - 承認された作業項目の取得ロジックを選択中のワークオーダーに対応
- 2025-01-XX: Phase 3「見積作成フローの基幹システム連携実装」の完了
  - 見積画面に基幹システム連携機能を実装（`src/app/admin/estimate/[id]/page.tsx`）
    - 「基幹システムで見積作成」ボタンを追加（基幹システム連携セクション内）
    - アドバイザー向けの手順表示（基幹システムで計算 → Webアプリで転記）
    - 見積項目の転記機能を改善（CSV形式：品名,金額（税込）に対応）
      - カンマ区切り形式のパースを実装
      - スペース区切り形式にも対応（後方互換性）
      - 金額から数値のみを抽出（カンマや円記号を除去）
    - 転記ダイアログを実装（テキストエリアで複数項目を一括入力）
    - 既存項目への追加/置き換えオプションを実装（ラジオボタンで選択）
    - 入力値のバリデーション（品名・金額の必須チェック、有効な項目数の確認）
    - 基幹システム明細ID入力機能を実装（各ワークオーダーごと）
- 2025-01-XX: Phase 3「請求書統合フローの実装」の確認
  - 請求書統合フロー機能を確認（`src/components/features/invoice-upload.tsx`）
    - 基幹システムでの統合請求書作成手順の表示が実装済み
    - 請求書PDFアップロード機能が実装済み（ファイル名に「invoice」「seikyu」「請求書」を含む）
    - `baseSystemInvoiceId`の記録機能が実装済み（`updateJobBaseSystemId`を使用）
    - `baseSystemItemId`の記録機能が実装済み（各ワークオーダーごと、見積画面に実装済み）
    - 見積画面に`InvoiceUpload`コンポーネントが統合済み
- 2025-01-XX: Phase 3「マスタデータ同期の実装」の確認
  - マスタデータ同期機能を確認
    - GASスクリプトが実装済み（`scripts/gas-master-data-sync.gs`）
      - CSV/Excelファイルの読み込み機能
      - Google Sheetsへの書き込み機能
      - エラーハンドリングとログ記録機能
      - メール通知機能
    - データ不整合時の対応UIが実装済み
      - 「変更申請あり」アイコン表示（`src/components/features/job-card.tsx`）
      - `hasChangeRequests`関数で変更申請の有無を判定（`src/lib/customer-description-append.ts`）
    - 「変更対応完了」ボタンが実装済み（`src/components/features/job-card.tsx`）
      - `markChangeRequestCompleted`関数で変更申請を完了としてマーク（`src/lib/customer-update.ts`）
      - Zoho CRMのDescriptionから【アプリ変更届】の文字列を削除
- 2025-01-XX: Phase 3「マスタデータ同期の実装」の確認
  - マスタデータ同期機能を確認
    - GASスクリプトが実装済み（`scripts/gas-master-data-sync.gs`）
      - CSV/Excelファイルの読み込み機能
      - Google Sheetsへの書き込み機能
      - エラーハンドリングとログ記録機能
      - メール通知機能
    - データ不整合時の対応UIが実装済み
      - 「変更申請あり」アイコン表示（`src/components/features/job-card.tsx`）
      - `hasChangeRequests`関数で変更申請の有無を判定（`src/lib/customer-description-append.ts`）
    - 「変更対応完了」ボタンが実装済み（`src/components/features/job-card.tsx`）
      - `markChangeRequestCompleted`関数で変更申請を完了としてマーク（`src/lib/customer-update.ts`）
      - Zoho CRMのDescriptionから【アプリ変更届】の文字列を削除
- 2025-01-XX: Phase 4「タイヤ交換・ローテーション：診断画面・見積画面・作業画面の実装」の完了
  - 診断画面の実装を確認（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - `TireInspectionView`コンポーネントを使用してタイヤ検査項目を表示
    - タイヤ溝深さ測定値入力機能
    - 空気圧測定値入力機能
    - 写真撮影機能
  - 見積画面の実装（`src/app/admin/estimate/[id]/page.tsx`）
    - 診断結果から見積項目への自動変換機能を追加（`addTireDiagnosisItemsToEstimate`を使用）
    - タイヤ交換・ローテーション用の診断結果から「要交換」「注意」項目を自動的に見積項目に追加
  - 作業画面の実装（`src/app/mechanic/work/[id]/page.tsx`）
    - 承認された見積項目から作業項目を生成する機能を追加
    - タイヤ交換・ローテーション用の作業完了処理を実装
    - Before/After写真撮影機能
- 2025-01-XX: Phase 4「その他のメンテナンス：診断画面・見積画面・作業画面の実装」の完了
  - 診断画面の実装を確認（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - `MaintenanceInspectionView`コンポーネントを使用してメンテナンス検査項目を表示
    - `MaintenanceMenuSelector`コンポーネントでメンテナンスメニューを選択
    - カスタマイズ可能な診断項目（12種類のメンテナンスメニューに対応）
    - 測定値入力機能
    - 写真撮影機能
  - 見積画面の実装（`src/app/admin/estimate/[id]/page.tsx`）
    - 診断結果から見積項目への自動変換機能を追加（`addMaintenanceDiagnosisItemsToEstimate`を使用）
    - その他のメンテナンス用の診断結果から「要交換」「注意」項目を自動的に見積項目に追加
    - 部品リストアップ機能（記録は必要だが、診断時不要）
  - 作業画面の実装を確認（`src/app/mechanic/work/[id]/page.tsx`）
    - 承認された見積項目から作業項目を生成する機能が実装済み
    - その他のメンテナンス用の作業完了処理が実装済み
    - Before/After写真撮影機能
- 2025-01-XX: Phase 4「チューニング・パーツ取付：診断画面・見積画面・作業画面の実装」の完了
  - 診断画面の実装を確認（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - `TuningPartsInspectionView`コンポーネントを使用してチューニング・パーツ取付検査項目を表示
    - `TuningPartsTypeSelector`コンポーネントで種類選択（チューニング/パーツ取付）
    - 部品取り寄せ対応
    - カスタム内容の説明入力機能
    - 写真撮影機能
  - 見積画面の実装（`src/app/admin/estimate/[id]/page.tsx`）
    - 診断結果から見積項目への自動変換機能を追加（`addTuningPartsDiagnosisItemsToEstimate`を使用）
    - チューニング・パーツ取付用の診断結果から「要対応」「注意」項目を自動的に見積項目に追加
    - 部品リストアップ機能
  - 作業画面の実装（`src/app/mechanic/work/[id]/page.tsx`）
    - 承認された見積項目から作業項目を生成する機能を追加
    - チューニング・パーツ取付用の作業完了処理を実装
    - Before/After写真撮影機能
- 2025-01-XX: Phase 4「コーティング：診断画面・見積画面・作業画面の実装」の完了
  - 診断画面の実装を確認（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - `CoatingInspectionView`コンポーネントを使用して車体状態確認項目を表示
    - 既存コーティングの状態確認機能
    - 写真撮影機能
  - 見積画面の実装（`src/app/admin/estimate/[id]/page.tsx`）
    - 診断結果から見積項目への自動変換機能を追加（`addCoatingDiagnosisItemsToEstimate`を使用）
    - コーティング用の診断結果から「深刻な傷」「中程度の傷」「軽微な傷」項目を自動的に見積項目に追加（下地処理が必要な場合）
  - 事前見積画面の実装完了（`src/app/admin/pre-estimate/[id]/page.tsx`）
    - コーティング種類選択（3種類：ハイモースコート エッジ、ハイモースコート グロウ、ガードグレイズ）
    - オプションサービス選択（7種類、同時施工で10％割引）
    - 見積金額の自動計算
    - 車両情報の表示（登録番号、車台番号、車両の寸法）
    - 車両マスタからの寸法情報取得
    - 顧客への送信機能（LINE通知、マジックリンク生成）
    - ステータス更新（「顧客承認待ち」）
  - 作業画面の実装完了（`src/app/mechanic/work/[id]/page.tsx`）
    - 承認された見積項目から作業項目を生成する機能を追加
    - コーティング用の作業完了処理を実装
    - Before/After写真撮影機能
    - 乾燥プロセスの管理機能の実装（`src/components/features/coating-work-management.tsx`）
      - 乾燥開始日時、乾燥完了予定日時、乾燥完了日時の管理
      - 乾燥状態の管理（未開始、乾燥中、完了）
      - 乾燥メモの入力
      - 予定完了日を過ぎた場合のアラート表示
    - メンテナンス期間（1-3年）の管理機能の実装
      - メンテナンス期間（年）の入力（1-3年）
      - 次回メンテナンス推奨日の自動計算・入力
      - メンテナンス方法の説明入力
      - 推奨日を過ぎた場合のアラート表示
    - WorkData型の拡張（`src/types/index.ts`）
      - `coatingInfo`フィールドを追加（乾燥プロセス、メンテナンス期間）
    - 作業完了時にコーティング固有情報を保存
- 2025-01-XX: Phase 4「板金・塗装：診断画面・見積画面・作業画面の実装確認」の完了
  - 診断画面の実装を確認（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - `BodyPaintDiagnosisView`コンポーネントを使用して損傷箇所確認項目を表示
    - 外注先への見積もり依頼機能
    - Before動画撮影必須機能
    - 損傷箇所の追加・削除・編集機能
  - 見積画面の実装を確認（`src/app/admin/estimate/[id]/page.tsx`）
    - `BodyPaintEstimateView`コンポーネントを使用して外注先からの見積もり回答を表示
    - 保険対応機能（保険会社名、保険承認日の入力）
    - 作業期間（1-3カ月）の表示機能
    - 外注先からの見積もり回答を表示する機能
    - 診断結果の損傷箇所情報は外注先への見積もり依頼時に使用されるため、診断結果から直接見積項目を生成する機能は不要
  - 作業画面の実装を確認（`src/app/mechanic/work/[id]/page.tsx`）
    - `BodyPaintOutsourcingView`コンポーネントを使用して外注管理機能を実装
    - 外注発注画面（外注先名入力、発注方法選択：写真送付/持ち込み）
    - 外注作業管理画面（作業進捗状況表示、作業完了連絡受付）
    - 引き取り・品質確認画面（品質確認チェックリスト、After写真撮影必須）
    - 作業記録、Before/After写真撮影機能
- 2025-01-XX: Phase 4「レストア：診断画面・見積画面・作業画面の実装確認」の完了
  - 診断画面の実装を確認（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - `RestoreDiagnosisView`コンポーネントを使用して現状確認・修復箇所確認項目を表示
    - レストアの種類選択（フルレストア/部分レストア）
    - Before写真必須機能
    - 現状確認結果の追加・削除・編集機能
    - 修復箇所の追加・削除・編集機能
  - 見積画面の実装を確認（`src/app/admin/estimate/[id]/page.tsx`）
    - `RestoreEstimateView`コンポーネントを使用して見積もり項目を表示
    - 部品リスト管理機能
    - 追加作業管理機能
    - 見積もり変更履歴機能
    - 作業期間の表示機能
    - 診断結果の修復箇所情報は見積もり項目として手動で入力するため、診断結果から直接見積項目を生成する機能は不要
  - 作業画面の実装を確認（`src/app/mechanic/work/[id]/page.tsx`）
    - `RestoreWorkView`コンポーネントを使用して作業管理機能を実装
    - フェーズ管理機能
    - マイルストーン管理機能
    - 進捗管理（0-100%）機能
    - 部品取り寄せ管理機能
    - 作業記録機能
    - Before/After写真必須機能
- 2025-01-XX: Phase 4「その他：診断画面・見積画面・作業画面の実装確認」の完了
  - 診断画面の実装を確認（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - `OtherServiceDiagnosisView`コンポーネントを使用してカスタマイズ可能な診断項目を表示
    - 診断項目の追加・削除・編集機能
    - 写真撮影機能
  - 見積画面の実装を確認（`src/app/admin/estimate/[id]/page.tsx`）
    - `OtherServiceEstimateView`コンポーネントを使用してカスタマイズ可能な見積項目を表示
    - 見積項目の追加・削除・編集機能
    - 部品リスト管理機能（必要に応じて）
    - 診断結果の診断項目情報は見積もり項目として手動で入力するため、診断結果から直接見積項目を生成する機能は不要
  - 作業画面の実装を確認（`src/app/mechanic/work/[id]/page.tsx`）
    - 既存の`WorkItemCard`コンポーネントを使用して作業記録機能を実装
    - Before/After写真撮影機能
    - 作業記録機能
- 2025-01-XX: Phase 2「車検：診断画面の拡張」の完了
  - 検査項目データ（`src/lib/inspection-items.ts`）を実装
    - 車検用の検査項目リスト（7カテゴリ、50項目以上）、測定値定義、動画撮影要件定義
  - カテゴリタブコンポーネント（`src/components/features/inspection-category-tabs.tsx`）を実装
    - カテゴリ別タブ表示、アイコン表示、項目数表示、カテゴリ切り替え
  - 検査項目入力コンポーネント（`src/components/features/inspection-item-input.tsx`）を実装
    - 信号機ボタン（OK/注意/要交換）、測定値入力、動画撮影（不具合時のみ、最大15秒）
  - 信号機ボタンコンポーネント（`src/components/features/traffic-light-button.tsx`）を実装
    - 共通コンポーネントとして分離、サイズオプション対応
  - 車検診断ビュー（`src/components/features/inspection-diagnosis-view.tsx`）を実装
    - カテゴリタブ統合、検査項目リスト表示、状態管理
  - 診断画面の拡張（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - サービス種類判定（車検/12ヵ月点検）、車検用UIの条件分岐表示
- 2025-01-XX: Phase 3「請求書統合フローの実装」の完了
  - 請求書アップロードコンポーネント（`src/components/features/invoice-upload.tsx`）を実装
    - ファイル名検証（「invoice」「seikyu」「請求書」を含む）
    - PDFファイル検証
    - Google Driveへのアップロード
    - 基幹システム連携ID入力・保存
    - 基幹システムでの統合請求書作成手順の表示
  - API関数の追加（`src/lib/api.ts`）
    - `updateJobBaseSystemId`: ジョブの基幹システム連携IDを更新
  - 見積画面への統合（`src/app/admin/estimate/[id]/page.tsx`）
    - 請求書アップロードコンポーネントを追加
    - 基幹システム連携IDの保存機能を実装
    - 基幹システム明細ID入力機能を追加（各ワークオーダーごと）
- 2025-01-XX: Phase 3「マスタデータ同期の実装」の完了
  - データ不整合時の対応UIを実装
    - JobCardコンポーネント（`src/components/features/job-card.tsx`）に「📝変更申請あり」アイコンを追加
    - 診断画面（`src/app/mechanic/diagnosis/[id]/page.tsx`）に変更申請アイコンを追加
    - 顧客情報を取得して変更申請をチェック（`hasChangeRequests`関数を使用）
  - 「変更対応完了」ボタンの実装
    - JobCardコンポーネントに変更対応完了ボタンを追加
    - 診断画面に変更対応完了ボタンを追加
    - `markChangeRequestCompleted`関数を使用してDescriptionから【アプリ変更届】を削除
  - Zoho顧客API Route（`src/app/api/zoho/customers/[id]/route.ts`）を実装
    - GET: 顧客情報を取得
    - PATCH: 顧客情報を更新
  - API関数の追加（`src/lib/api.ts`）
    - `updateCustomerById`: 顧客情報を更新
- 2025-01-XX: Phase 4「タイヤ交換・ローテーション：診断画面の実装」の完了
  - タイヤ交換・ローテーション用の検査項目データ（`src/lib/tire-inspection-items.ts`）を実装
    - 簡易検査項目（3カテゴリ：タイヤの状態確認、空気圧の確認、ホイールの状態確認）
    - 測定値定義（タイヤ溝深さ、空気圧）
    - 法定基準値・推奨基準値の定義
  - タイヤ交換・ローテーション用の診断ビューコンポーネント（`src/components/features/tire-inspection-view.tsx`）を実装
    - カテゴリ別の検査項目表示
    - 信号機ボタン（OK/注意/要交換）
    - タイヤ溝深さ測定値入力（前後左右、mm単位）
    - 空気圧測定値入力（前後左右、kPa単位）
    - 推奨空気圧との比較表示
    - 写真撮影、コメント入力
  - 診断画面にタイヤ交換・ローテーション用UIを統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - タイヤ交換・ローテーションの場合にTireInspectionViewを表示
    - 診断完了時にタイヤ検査項目、測定値（溝深さ・空気圧）を保存
- 2025-01-XX: Phase 4「タイヤ交換・ローテーション：作業画面・引渡画面の動作確認」の完了
  - 作業画面のタイトル表示を修正（`src/app/mechanic/work/[id]/page.tsx`）
    - タイヤ交換・ローテーションの場合「タイヤ交換・ローテーション作業」と表示
    - 既存の作業項目管理機能を使用（Before/After写真、作業記録）
  - 引渡画面は既存の実装で対応（ステータス更新、作業完了処理、PDF生成不要）
- 2025-01-XX: Phase 4「その他のメンテナンス：実装」の完了
  - メニュー設定マスタの実装（`src/lib/maintenance-menu-config.ts`）
    - 12種類のメンテナンスメニュー（バッテリー交換、ブレーキフルード交換など）の設定
    - 各メニューの検査項目、測定値フィールド、所要時間、写真・部品の必要性を定義
  - メニュー選択UIコンポーネントの実装（`src/components/features/maintenance-menu-selector.tsx`）
    - メニュー選択ドロップダウン
    - 選択されたメニューの情報表示（所要時間、検査項目数、測定値数など）
  - メンテナンス診断ビューコンポーネントの実装（`src/components/features/maintenance-inspection-view.tsx`）
    - メニューに応じた検査項目の動的表示（カテゴリ別）
    - 信号機ボタン（OK/注意/要交換）
    - メニューに応じた測定値入力フィールドの動的表示
    - 写真撮影、コメント入力
  - 診断画面への統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - その他のメンテナンスの場合にメニュー選択UIと診断ビューを表示
    - 診断完了時にメンテナンスメニュー、検査項目、測定値を保存
  - 作業画面のタイトル表示を修正（`src/app/mechanic/work/[id]/page.tsx`）
    - その他のメンテナンスの場合「その他のメンテナンス作業」と表示
    - 既存の作業項目管理機能を使用（Before/After写真、作業記録）
  - ServiceKind型に「その他のメンテナンス」を追加（`src/types/index.ts`）
- 2025-01-XX: Phase 4「チューニング・パーツ取付：実装」の完了
  - 種類設定マスタの実装（`src/lib/tuning-parts-config.ts`）
    - チューニングとパーツ取り付けの種類設定
    - 各種類の説明、検査カテゴリを定義
  - 種類選択UIコンポーネントの実装（`src/components/features/tuning-parts-type-selector.tsx`）
    - ラジオボタンによる種類選択（チューニング/パーツ取り付け）
    - 選択された種類の情報表示
  - チューニング・パーツ取付診断ビューコンポーネントの実装（`src/components/features/tuning-parts-inspection-view.tsx`）
    - カスタム内容の説明入力
    - 種類に応じた検査項目の動的表示（カテゴリ別）
    - 信号機ボタン（OK/注意/要対応）
    - Before写真撮影、コメント入力
  - 診断画面への統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - チューニング・パーツ取付の場合に種類選択UIと診断ビューを表示
    - 診断完了時に種類、カスタム内容、検査項目を保存
  - 作業画面のタイトル表示を修正（`src/app/mechanic/work/[id]/page.tsx`）
    - チューニング・パーツ取付の場合「チューニング・パーツ取付作業」と表示
    - 既存の作業項目管理機能を使用（Before/After写真、作業記録）
  - ServiceKind型に「チューニング・パーツ取付」を追加（`src/types/index.ts`）
- 2025-01-XX: Phase 4「コーティング：実装」の完了
  - コーティング設定マスタの実装（`src/lib/coating-config.ts`）
    - コーティング種類（ハイモースコート エッジ、ハイモースコート グロウ、ガードグレイズ）の設定
    - オプションサービス（7種類）の設定、同時施工で10％割引
    - 金額計算関数（同時施工判定、オプション合計計算）
  - 事前見積画面コンポーネントの実装（`src/components/features/coating-pre-estimate-view.tsx`）
    - コーティング種類選択（ラジオボタン）
    - オプションサービス選択（チェックボックス、同時施工で10％割引を自動適用）
    - 見積金額の自動計算と表示
    - 見積送信ボタン
  - コーティング診断ビューコンポーネントの実装（`src/components/features/coating-inspection-view.tsx`）
    - 車体の状態確認（11箇所：ボンネット、バンパー、ドア、トランク、ルーフ、フェンダーなど）
    - 状態選択（良好、軽微な傷、中程度の傷、深刻な傷、汚れあり、コーティング残存）
    - Before写真撮影、コメント入力
    - 既存コーティングの状態確認（種類、施工日、状態、写真）
  - 診断画面への統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - コーティングの場合に診断ビューを表示
    - 診断完了時に車体状態確認結果、既存コーティング情報を保存
  - 作業画面のタイトル表示を修正（`src/app/mechanic/work/[id]/page.tsx`）
    - コーティングの場合「コーティング作業」と表示
    - 既存の作業項目管理機能を使用（Before/After写真、作業記録、乾燥プロセスの管理は将来実装）
  - ServiceKind型に「コーティング」を追加（`src/types/index.ts`）
- 2025-01-XX: Phase 4「板金・塗装：診断画面の実装」の完了
  - 板金・塗装設定マスタの実装（`src/lib/body-paint-config.ts`）
    - 車体部位、損傷の種類・程度、外注先への発注方法、作業進捗状況、事故の程度・種類を定義
  - 板金・塗装診断ビューコンポーネントの実装（`src/components/features/body-paint-diagnosis-view.tsx`）
    - 損傷箇所の追加・削除・編集（部位、損傷の種類・程度）
    - Before写真撮影（必須）
    - Before動画撮影（必須）
    - 外注先への見積もり依頼方法選択（写真送付/持ち込み）
    - 外注先からの見積もり回答入力（外注先名、見積もり内容、見積金額、回答日、備考）
    - コメント入力（整備士の所見）
  - 診断画面への統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - 板金・塗装の場合に診断ビューを表示
    - 診断完了時に損傷箇所、外注先への見積もり依頼方法、外注先からの見積もり回答、コメントを保存
  - 作業画面のタイトル表示を修正（`src/app/mechanic/work/[id]/page.tsx`）
    - 板金・塗装の場合「板金・塗装作業」と表示
    - 既存の作業項目管理機能を使用（Before/After写真、作業記録）
  - ServiceKind型に「板金・塗装」を追加（`src/types/index.ts`）
- 2025-01-XX: Phase 4「板金・塗装：外注発注画面・外注作業管理画面・引き取り・品質確認画面の実装」の完了
  - 板金・塗装外注管理ビューコンポーネントの実装（`src/components/features/body-paint-outsourcing-view.tsx`）
    - 外注発注セクション（外注先名入力、発注方法選択：写真送付/持ち込み、発注ボタン）
    - 外注作業管理セクション（作業進捗状況表示、作業期間表示、作業完了連絡受付ボタン、引き取りボタン）
    - 引き取り・品質確認セクション（品質確認チェックリスト、After写真撮影（必須）、コメント入力、品質確認完了ボタン）
  - 作業画面への統合（`src/app/mechanic/work/[id]/page.tsx`）
    - 板金・塗装の場合に外注管理ビューを表示
    - 外注情報、品質確認データの状態管理
    - 写真撮影、発注、作業完了連絡、引き取り、品質確認完了の各ハンドラ実装
- 2025-01-XX: Phase 4「レストア：診断画面の実装」の完了
  - レストア設定マスタの実装（`src/lib/restore-config.ts`）
    - レストアの種類、修復内容・程度、現状確認の状態、作業フェーズ、部品の取り寄せ状況、車体部位を定義
    - フェーズ管理のヘルパー関数（順序取得、次のフェーズ、前のフェーズ）
  - レストア診断ビューコンポーネントの実装（`src/components/features/restore-diagnosis-view.tsx`）
    - レストアの種類選択（フルレストア/部分レストア/その他）
    - 現状確認の追加・削除・編集（箇所、状態、写真（任意）、コメント）
    - 修復箇所の追加・削除・編集（部位、修復内容、修復の程度、Before写真（必須）、コメント）
    - コメント入力（整備士の所見）
  - 診断画面への統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - レストアの場合に診断ビューを表示
    - 診断完了時にレストアの種類、現状確認結果、修復箇所、コメントを保存
  - 作業画面のタイトル表示を修正（`src/app/mechanic/work/[id]/page.tsx`）
    - レストアの場合「レストア作業」と表示
  - ServiceKind型に「レストア」を追加（`src/types/index.ts`）
- 2025-01-XX: Phase 4「レストア：見積画面の実装」の完了
  - レストア見積ビューコンポーネントの実装（`src/components/features/restore-estimate-view.tsx`）
    - 見積もり項目の追加・削除・編集（数量・単価・金額の自動計算、合計金額表示）
    - 部品リスト管理（部品名、数量、単価、取り寄せ状況、到着予定日、実際の到着日、遅延アラート、備考）
    - 追加作業管理（追加作業内容、追加費用、承認日時、実施日時、備考）
    - 見積もりの変更履歴表示（変更日時、変更内容、変更前後の金額、変更理由）
    - 作業期間入力（かなり長期の表示）
    - 合計金額の自動計算（見積もり項目 + 部品 + 追加作業）
  - 見積画面への統合（`src/app/admin/estimate/[id]/page.tsx`）
    - レストアの場合に見積ビューを表示
    - 見積送信時にレストアの見積もり項目、部品リスト、追加作業を保存
- 2025-01-XX: Phase 4「レストア：作業画面の実装」の完了
  - レストア作業ビューコンポーネントの実装（`src/components/features/restore-work-view.tsx`）
    - 全体進捗表示（0-100%、マイルストーン完了数）
    - フェーズ管理（7つのフェーズ：分解、診断・評価、部品発注、修復、組み立て、仕上げ、最終確認）
    - フェーズ選択タブ（各フェーズの状態表示）
    - フェーズごとの状態管理（未開始、作業中、完了、保留）
    - フェーズごとの進捗管理（0-100%）
    - フェーズごとの作業記録（作業日、作業内容、作業時間、作業中の写真、コメント）
    - 部品の取り寄せ状況表示（部品の状態、到着予定日、実際の到着日、遅延アラート）
    - 作業メモ入力
  - 作業画面への統合（`src/app/mechanic/work/[id]/page.tsx`）
    - レストアの場合に作業ビューを表示
    - 作業データの状態管理
    - 写真撮影、作業記録の各ハンドラ実装
- 2025-01-XX: Phase 4「その他：診断画面の実装」の完了
  - その他診断ビューコンポーネントの実装（`src/components/features/other-service-diagnosis-view.tsx`）
    - カスタマイズ可能な診断項目の追加・削除・編集（項目名、状態、写真（任意）、コメント）
    - コメント入力（整備士の所見）
  - 診断画面への統合（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - その他の場合に診断ビューを表示
    - 診断完了時にカスタム診断項目、コメントを保存
  - 作業画面のタイトル表示を修正（`src/app/mechanic/work/[id]/page.tsx`）
    - その他の場合「その他作業」と表示
- 2025-01-XX: Phase 4「その他：見積画面の実装」の完了
  - その他見積ビューコンポーネントの実装（`src/components/features/other-service-estimate-view.tsx`）
    - カスタマイズ可能な見積項目の追加・削除・編集（項目名、数量、単価、金額の自動計算、備考）
    - 部品リスト管理（必要に応じて追加、部品名、数量、単価）
    - 合計金額の自動計算（見積もり項目 + 部品）
  - 見積画面への統合（`src/app/admin/estimate/[id]/page.tsx`）
    - その他の場合に見積ビューを表示
    - 見積送信時にその他の見積もり項目、部品リストを保存
- 2025-01-XX: Phase 4「その他：作業画面の実装」の完了
  - 作業画面の確認（`src/app/mechanic/work/[id]/page.tsx`）
    - その他の場合、既存の作業項目管理機能を使用（作業記録、Before/After写真）
    - 作業画面のタイトル表示を修正（その他の場合「その他作業」と表示）
    - 既存のWorkItemCardコンポーネントを使用して作業記録と写真撮影を管理
- 2025-01-XX: Phase 5「長期カスタムの管理機能：レストアのフェーズ管理機能の強化」の完了
  - フェーズ間の依存関係管理機能の実装（`src/lib/restore-config.ts`）
    - `canStartPhase`関数：前のフェーズが完了しているかチェック
    - `calculatePhaseExpectedDate`関数：フェーズの予定日を計算
  - フェーズ状態変更時の依存関係チェック（`src/components/features/restore-work-view.tsx`）
    - 前のフェーズが完了していない場合、次のフェーズを開始できないように制御
    - フェーズ完了時に次のフェーズの予定開始日を自動設定
    - 遅延チェック機能（予定完了日を過ぎた場合にアラート表示）
  - UIの強化
    - 遅延アラート表示（予定完了日を過ぎたフェーズに警告表示）
    - 依存関係の警告表示（前のフェーズが完了していない場合に警告表示）
    - フェーズタブに遅延アイコンとブロックアイコンを表示
    - 日付情報の表示（開始日、完了日、予定開始日、予定完了日）
- 2025-01-XX: Phase 5「長期カスタムの管理機能：板金・塗装の外注作業進捗管理機能の強化」の完了
  - 外注作業進捗管理機能の強化（`src/components/features/body-paint-outsourcing-view.tsx`）
    - 進捗率の計算と表示（0-100%）：発注済み25%、作業中50%、作業完了75%、引き取り済み100%
    - プログレスバーによる進捗の可視化
    - 遅延アラート機能（予定完了日を過ぎた場合に警告表示）
    - 日付情報の表示（発注日、預け日、作業完了日、予定完了日）
    - 発注時に予定完了日を自動設定（発注日 + 作業期間）
    - 作業完了・引き取り時に進捗率を自動更新
- 2025-01-XX: Phase 5「長期カスタムの管理機能：長期プロジェクトの進捗可視化」の完了
  - 長期プロジェクトカードコンポーネントの実装（`src/components/features/long-term-project-card.tsx`）
    - 進捗率の表示（0-100%）
    - プログレスバーによる進捗の可視化
    - 遅延プロジェクトのハイライト（赤枠・背景色）
    - 現在のフェーズ/ステータス表示
    - 開始日・予定完了日の表示
    - 詳細画面へのリンク
  - 長期プロジェクトデータ抽出ユーティリティの実装（`src/lib/long-term-project-utils.ts`）
    - レストアプロジェクトの進捗データ抽出（フェーズ管理から）
    - 板金・塗装プロジェクトの進捗データ抽出（外注作業進捗から）
    - 遅延チェック機能
  - トップページへの統合（`src/app/page.tsx`）
    - 長期プロジェクトセクションの追加
    - 長期プロジェクト一覧の表示（グリッドレイアウト）
    - 遅延プロジェクトの強調表示
- 2025-01-XX: Phase 5「顧客ポータル機能：顧客向けダッシュボードの実装」の完了
  - 顧客向けダッシュボードページの実装（`src/app/customer/dashboard/page.tsx`）
    - 顧客情報の表示
    - サマリーカード（進行中、見積待ち、完了の件数表示）
    - ステータスタブによるフィルタリング（すべて、見積待ち、作業中、出庫待ち、完了）
    - ジョブカードの表示（サービス種類、車両情報、進捗バー、ステータス、アクションボタン）
    - 見積もり確認、作業完了報告確認へのリンク
    - 進捗率の自動計算（ステータスに基づく）
  - 顧客ジョブ一覧取得APIの実装（`src/lib/api.ts`）
    - `fetchJobsByCustomerId`関数の実装
    - 顧客ID（ID1）または顧客レコードID（id）でジョブを検索
    - 日付順（新しい順）でソート
    - 顧客ダッシュボードでの実装完了（モックから実装へ移行）
  - Google Driveファイル移動・コピーAPIの実装完了
    - ファイル移動API（`PATCH /api/google-drive/files/[fileId]/move`）
    - ファイルコピーAPI（`POST /api/google-drive/files/[fileId]/copy`）
    - `moveFile`、`copyFile`クライアント関数の実装（`src/lib/google-drive.ts`）
    - 車検証履歴管理での使用（既存車検証を履歴フォルダに移動）
    - ブログ用写真コピーでの使用（複数フォルダへの同時コピー）
    - フォルダパスからフォルダIDを取得する機能（`getFolderIdByPath`）
- 2025-01-XX: Phase 4「板金・塗装：見積画面の実装」の完了
  - 板金・塗装見積ビューコンポーネントの実装（`src/components/features/body-paint-estimate-view.tsx`）
    - 外注先からの見積もり回答表示（外注先名、見積もり内容、見積金額、回答日、備考）
    - 自社見積もり作成（見積もり項目の追加・削除・編集、数量・単価・金額の自動計算、合計金額表示）
    - 作業期間選択（1-3カ月）
    - 保険対応チェックボックスと保険会社名入力
    - 保険対応時の注意事項表示
  - 見積画面への統合（`src/app/admin/estimate/[id]/page.tsx`）
    - 板金・塗装の場合に見積ビューを表示
    - 診断データから外注先の見積もり回答を取得して表示
    - 見積送信時に板金・塗装の見積もり項目を保存
- 2025-01-XX: Phase 5「顧客ポータル機能：作業進捗の確認機能の実装」の完了
  - 顧客進捗ビューコンポーネントの実装（`src/components/features/customer-progress-view.tsx`）
    - 進捗率の表示（0-100%）
    - プログレスバーによる進捗の可視化
    - ステップリストの表示（入庫、診断、見積もり、承認、作業、引渡）
    - 各ステップの状態表示（完了、現在、待機中）
    - 現在のフェーズ/作業内容の表示
    - 開始日・予定完了日の表示
  - レポート画面への統合（`src/app/customer/report/[id]/page.tsx`）
    - 作業進捗セクションの追加
    - ジョブデータから進捗情報を自動抽出・表示
- 2025-01-XX: Phase 5「顧客ポータル機能：見積もりの確認・承認機能の強化」の完了
  - 見積承認画面の強化（`src/app/customer/approval/[id]/page.tsx`）
    - 有効期限チェック機能（有効期限切れの場合は承認不可）
    - 有効期限切れバッジの表示
    - 承認時のトースト通知
    - 項目未選択時のバリデーション（少なくとも1つの項目を選択）
    - 承認ボタンの無効化（有効期限切れまたは項目未選択時）
- 2025-01-XX: Phase 5「顧客ポータル機能：請求書の確認・ダウンロード機能の実装」の完了
  - レポート画面への請求書機能の追加（`src/app/customer/report/[id]/page.tsx`）
    - 請求書PDF表示機能（Google Driveから請求書PDFを取得して表示）
    - 請求書PDFダウンロード機能（PDFファイルをダウンロード）
    - トースト通知によるフィードバック
    - エラーハンドリング
- 2025-01-XX: Phase 5「ビデオコミュニケーション機能：リアルタイムビデオ通話機能の実装」の完了
  - ビデオ通話ダイアログコンポーネントの実装（`src/components/features/video-call-dialog.tsx`）
    - WebRTCを使用したリアルタイムビデオ通話（簡易実装）
    - カメラ・マイクのON/OFF切り替え
    - 通話終了機能
    - 接続状態の表示（接続中、接続済み、エラー）
    - ローカルビデオとリモートビデオの表示
  - レポート画面への統合（`src/app/customer/report/[id]/page.tsx`）
    - ビデオ通話セクションの追加
    - ビデオ通話開始ボタン
    - 顧客と整備士のビデオ通話機能
- 2025-01-XX: Phase 5「ビデオコミュニケーション機能：ビデオ録画機能の強化とビデオ共有機能の実装」の完了
  - ビデオ録画機能の強化（`src/components/features/video-capture-button.tsx`）
    - リアルタイム録画機能の追加（MediaRecorder API使用）
    - 録画時間の表示（経過時間/最大時間）
    - 録画中の視覚的フィードバック（アニメーション）
    - 録画時間の自動制限（maxDuration）
    - ファイル選択モードとリアルタイム録画モードの両対応
  - ビデオ共有機能の実装（`src/components/features/video-share-dialog.tsx`）
    - ビデオURLの表示とコピー機能
    - ブラウザで開く機能
    - LINEで共有する機能
    - ビデオプレビューの表示
- 2025-01-XX: Phase 5「リアルタイム同期機能の強化」の完了
  - WebSocketクライアントの実装（`src/lib/websocket-client.ts`）
    - リアルタイムデータ更新の管理（ジョブ、ワークオーダー、診断、見積、作業データ）
    - 自動再接続機能（指数バックオフ）
    - ハートビート機能（接続維持）
    - イベントハンドラーの登録・削除
  - WebSocketフックの実装（`src/hooks/use-websocket.ts`）
    - オンライン時に自動接続、オフライン時に自動切断
    - イベントハンドラーの管理
    - コンポーネントのアンマウント時のクリーンアップ
  - トップページへの統合（`src/app/page.tsx`）
    - WebSocket接続によるリアルタイム更新
    - SWRキャッシュの自動再検証
  - オフライン対応の強化
    - 同期キューの最適化（`src/lib/sync-manager.ts`）
      - バッチ処理による並列同期
      - 優先度に基づくソート（リトライ回数、作成日時）
      - リトライ可能なエラーの判定と自動リトライ
      - リトライ回数の上限設定
    - 同期キューの重複チェック（`src/lib/offline-storage.ts`）
      - 重複エントリの自動スキップ
    - 自動同期の改善（`src/hooks/use-auto-sync.ts`）
      - オンライン復帰時の即座同期
  - UI統合
    - オフライン/オンラインバナーの表示
    - 同期インジケーターの表示（同期状態、未同期アイテム数、手動同期ボタン）
    - トップページへの統合（`src/app/page.tsx`）
      - 同期インジケーターの表示位置の調整
- 2025-01-XX: Phase 2「見積画面：サービス種類固有情報の保存機能の実装」の完了
  - EstimateData型の拡張（`src/types/index.ts`）
    - 故障診断固有情報（原因説明、修理方法提案、診断機結果PDF）を追加
    - 修理・整備固有情報（音声データ）を追加
    - 板金・塗装固有情報（作業期間、保険対応情報）を追加
    - レストア固有情報（作業期間、見積もり変更履歴）を追加
  - 見積画面の保存処理を拡張（`src/app/admin/estimate/[id]/page.tsx`）
    - 各サービス種類固有の情報をEstimateDataに保存する処理を実装
    - 複数作業管理対応：選択中のワークオーダーに保存
    - 単一作業対応：createEstimate関数を使用
  - 既存の見積データ読み込み処理を実装
    - 選択中のワークオーダーから見積データを読み込み
    - 各サービス種類固有の情報を復元
  - 既存の請求書PDF取得機能を実装
    - searchInvoicePdf関数を使用してJobフォルダから請求書PDFを検索
    - InvoiceUploadコンポーネントに既存の請求書PDFを渡して表示
- 2025-01-XX: Phase 2「診断画面：診断結果PDFのGoogle Driveアップロード機能の実装」の完了
  - OBD診断結果PDFのアップロード機能を実装（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - 12ヵ月点検用：`handleOBDDiagnosticUpload`関数を実装
    - ワークオーダーフォルダを取得または作成してPDFをアップロード
    - アップロードされたファイルのIDとURLを取得して状態に保存
  - 診断機結果PDFのアップロード機能を実装（修理・整備用）
    - `handleRepairDiagnosticToolUpload`関数を実装
    - ワークオーダーフォルダを取得または作成してPDFをアップロード
    - アップロードされたファイルのIDとURLを取得して状態に保存
  - 故障診断の診断機結果PDFのアップロード機能を実装
    - `handleFaultDiagnosticToolUpload`関数を実装
    - ワークオーダーフォルダを取得または作成してPDFをアップロード
    - アップロードされたファイルのIDとURLを取得して状態に保存
  - Google Drive APIクライアントのインポートを追加
    - `uploadFile`、`getOrCreateWorkOrderFolder`をインポート
- 2025-01-XX: Phase 2「顧客承認画面：実データ連携の実装」の完了
  - 見積データの取得機能を実装（`src/app/customer/approval/[id]/page.tsx`）
    - JobデータとWorkOrderデータから見積情報を取得
    - 見積データをEstimateLineItem形式に変換して表示
    - ローディング状態とエラー状態の表示を実装
  - 承認API連携の実装
    - `approveEstimate`関数を使用して承認処理を実行
    - 承認成功時の完了画面表示
    - エラーハンドリングとユーザーフィードバック
  - EstimateData型の拡張（`src/types/index.ts`）
    - `expiresAt`フィールドを追加（見積有効期限）
  - 顧客情報と車両情報の表示
    - Jobデータから顧客名、車両名、ナンバープレートを取得して表示
- 2025-01-XX: Phase 2「顧客レポート画面：実データ連携の実装」の完了
  - 実際のJobデータとWorkOrderデータの取得機能を実装（`src/app/customer/report/[id]/page.tsx`）
    - Jobデータから顧客情報、車両情報を取得
    - WorkOrderデータから作業データ、見積データを取得
    - ローディング状態とエラー状態の表示を実装
  - Before/After写真の表示機能を実装
    - WorkOrderのwork.recordsから写真データを取得
    - Before/After写真を分類して表示
  - 作業項目リストの表示機能を実装
    - WorkOrderのestimate.itemsから作業項目を取得して表示
    - 合計金額を自動計算
  - 整備士コメントの表示機能を実装
    - WorkOrderのwork.recordsから整備士コメントを取得
    - 整備士名をWorkOrderまたはJobから取得
  - 請求書PDF取得機能を実装
    - `searchInvoicePdf`関数を使用してJobフォルダから請求書PDFを検索
    - 請求書PDFのURLを取得して表示
    - 請求書がない場合の適切なメッセージ表示
  - 次回車検予定の表示機能を実装
    - Jobの車両データから車検有効期限を取得して表示
- 2025-01-XX: Phase 2「見積画面：LINE通知連携の実装」の完了
  - 見積送付時のLINE通知機能を実装（`src/app/admin/estimate/[id]/page.tsx`）
    - マジックリンク生成機能を実装（`generateMagicLink`関数を使用）
    - LINE通知送信機能を実装（`sendLineNotification`関数を使用）
    - 顧客のLINE User IDを取得（Jobの顧客データから）
    - 通知テンプレートデータの準備（顧客名、車両名、ナンバープレート、作業種類、マジックリンクURL）
    - エラーハンドリングを実装（LINE通知失敗時も見積保存は成功として扱う）
    - 適切なユーザーフィードバックを実装（成功/警告メッセージ）
- 2025-01-XX: Phase 2「ローディング/フィードバックUIの実装：オプティミスティックUIとハプティックフィードバック」の完了
  - オプティミスティックUI対応を実装（`src/app/page.tsx`）
    - チェックイン処理にオプティミスティックUIを適用（即座にUIを更新し、その後サーバーと同期）
    - 整備士割り当て処理にオプティミスティックUIを適用
    - `useOptimisticUpdate`フックを使用して実装
    - エラー時のロールバック処理を実装
  - ハプティックフィードバック（モバイル）を実装
    - チェックイン処理に適用（`src/app/page.tsx`）
    - 整備士割り当て処理に適用（`src/app/page.tsx`）
    - 変更申請対応完了処理に適用（`src/components/features/job-card.tsx`）
    - 診断完了処理に適用（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - 成功/エラー/警告時の適切な振動パターンを実装
- 2025-01-XX: Phase 2「カラーユニバーサルデザイン対応：診断結果の4重表現」の確認
  - `TrafficLightButton`コンポーネントに既に実装済みの機能を確認
    - 色+形状+アイコン+テキストの4重表現が実装済み
    - 形状タイプ（circle, square, triangle, diamond, hexagon）が実装済み
    - 境界線スタイル（solid, dashed, double, dotted）が実装済み
    - アクセシビリティ対応（aria-label, title属性）が実装済み
- 2025-01-XX: Phase 2「顧客向け進捗通知機能（LINE）：入庫完了・診断完了・作業完了通知の実装」の完了
  - 入庫完了通知を実装（`src/app/page.tsx`）
    - チェックイン処理成功時にLINE通知を送信
    - 顧客のLINE User IDを取得して通知を送信
    - 通知失敗時もチェックイン処理は継続
  - 診断完了通知を実装（`src/app/mechanic/diagnosis/[id]/page.tsx`）
    - 診断完了処理成功時にLINE通知を送信
    - 顧客のLINE User IDを取得して通知を送信
    - 通知失敗時も診断完了処理は継続
  - 作業完了通知を実装（`src/app/mechanic/work/[id]/page.tsx`）
    - 作業完了処理成功時にLINE通知を送信
    - 顧客のLINE User IDを取得して通知を送信
    - 通知失敗時も作業完了処理は継続
- 2025-01-XX: Phase 2「ブログ用写真の管理機能：実データ連携の実装」の完了
  - 写真のファイルID取得機能を実装（`src/app/customer/report/[id]/page.tsx`）
    - WorkOrderのwork.recordsから写真のファイルIDを取得
    - ブログ用写真リストにfileIdを設定
    - ファイルIDがない写真は公開対象から除外
  - 元のファイル名取得機能を実装（`src/lib/blog-photo-manager.ts`）
    - `getFileById`関数を使用して元のファイル名を取得
    - ファイル名取得失敗時はデフォルト名を使用して続行
  - ファイルコピー処理の改善
    - `copyFile`関数を直接使用してファイルをコピー
    - 各分類フォルダへのコピー処理を実装
    - エラーハンドリングを実装（一部のフォルダへのコピー失敗時も続行）
- 2025-01-XX: `copyPhotoForBlog`関数の実装完了（`src/lib/google-drive.ts`）
  - 日付別、作業種類別、車種別、Before/After別フォルダへのコピー機能を実装
  - エラーハンドリングを追加（一部のフォルダへのコピー失敗時も続行）
  - すべてのTODOコメントを削除し、実装を完了
- 2025-01-XX: ブログ用写真公開フラグのwork.jsonファイルへの保存・取得機能の実装完了
  - ファイル内容読み書きAPIエンドポイントの実装（`src/app/api/google-drive/files/[fileId]/content/route.ts`）
    - GET: ファイル内容を取得
    - PUT: ファイル内容を更新
  - work.jsonファイル操作関数の実装（`src/lib/google-drive.ts`）
    - `findWorkJsonFile`: work.jsonファイルを検索
    - `getWorkJsonContent`: work.jsonファイルの内容を取得
    - `updateWorkJsonContent`: work.jsonファイルの内容を更新
  - ブログ用写真公開フラグの保存・取得機能の実装（`src/lib/blog-photo-manager.ts`）
    - `publishBlogPhotos`関数でwork.jsonファイルに公開フラグを保存
    - `getBlogPublishedFlag`関数でwork.jsonファイルから公開フラグを取得
    - Job情報からワークオーダーフォルダを特定する機能を実装
- 2025-01-XX: 車検証ファイル検索機能の実装完了（`src/lib/vehicle-registration-upload.ts`）
  - `getVehicleRegistration`関数で車検証ファイルを検索する機能を実装
    - PDFファイルと画像ファイルの両方を検索
    - ファイル名パターン: `shaken_{vehicleId}_{YYYYMMDD}.{ext}`
    - 最新のファイルを返す（ファイル名の日付でソート）
    - エラーハンドリングを実装（検索失敗時もnullを返して続行）
- 2025-01-XX: 法定費用計算の車両マスタ取得機能の実装完了（`src/lib/legal-fees.ts`）
  - `getLegalFees`関数でGoogle Sheets APIから車両マスタを取得する機能を実装
    - `findVehicleMasterById`関数を使用して車両マスタを取得
    - 車両が見つからない場合のエラーハンドリング
    - 法定費用の計算ロジック（将来的には車両の重量・排気量情報に基づく計算を実装可能）
    - 合計金額の自動計算
- 2025-01-XX: Zoho CRM Lookup検証のGoogle Sheetsマスタデータ連携機能の実装完了（`src/lib/zoho-lookup-validation.ts`）
  - `validateCustomerRecordId`関数でGoogle Sheetsマスタデータを優先的に確認する機能を実装
    - `findCustomerMasterById`関数を使用して顧客マスタを確認
    - マスタデータに存在しない場合、Zoho CRM APIを確認（フォールバック）
    - エラーハンドリングを実装（マスタデータ検索失敗時もZoho CRM APIを確認）
  - `validateVehicleRecordId`関数でGoogle Sheetsマスタデータを優先的に確認する機能を実装
    - `findVehicleMasterById`関数を使用して車両マスタを確認
    - マスタデータに存在しない場合、Zoho CRM APIを確認（フォールバック）
    - エラーハンドリングを実装（マスタデータ検索失敗時もZoho CRM APIを確認）
- 2025-01-XX: Zoho CRMエラーログのGoogle Drive保存機能の実装完了（`src/lib/zoho-error-handler.ts`）
  - `fallbackToGoogleDrive`関数でGoogle DriveにJSONファイルとしてエラーログを保存する機能を実装
    - ルートフォルダを取得または作成
    - `error-logs`フォルダを取得または作成
    - JSON文字列をBlobに変換して`uploadFile`関数でアップロード
    - ファイル名形式: `{resourceType}-{resourceId}-{timestamp}.json`
    - タイムスタンプ形式: `YYYYMMDD-HHMMSS`
    - エラーログを記録（`logError`関数を使用）
    - エラーハンドリングを実装（フォールバック保存失敗時もエラーを記録）
- 2025-01-XX: LINE通知履歴のGoogle Sheets取得機能の実装完了（`src/app/api/line/history/route.ts`）
  - Google Sheets APIを使用して通知履歴を取得する機能を実装
    - LINE通知履歴用スプレッドシートIDを環境変数から取得（`GOOGLE_SHEETS_LINE_HISTORY_ID`または`GOOGLE_SHEETS_MASTER_DATA_ID`）
    - シート名: `LINE通知履歴`
    - カラム構成: 通知ID、Job ID、LINE User ID、通知種類、送信日時、ステータス、エラーメッセージ、リトライ回数
    - フィルタリング機能（jobId、lineUserId、日付範囲）を実装
    - ページネーション機能を実装
    - 送信日時でソート（降順：新しい順）
    - エラーハンドリングを実装
- 2025-01-XX: Zoho CRM顧客情報更新APIの実装完了（`src/lib/zoho-api-client.ts`、`src/app/api/zoho/customers/[id]/route.ts`）
  - `updateCustomer`関数を`zoho-api-client.ts`に追加
    - Zoho CRM APIを使用して顧客情報を更新する機能を実装
    - レート制限対策（指数バックオフリトライ）を実装
    - エラーハンドリングを実装
    - 制約: 許可されたフィールドのみ更新可能（LINE ID、メール同意、誕生日など）。マスタデータ（顧客ID、氏名、住所、電話番号など）は更新不可
  - `PATCH /api/zoho/customers/[id]`で`updateCustomer`関数を使用するように変更
    - モック実装から実際のZoho CRM API呼び出しに変更
    - エラーハンドリングを実装
- 2025-01-XX: LINE通知リトライ機能の実装完了（`src/app/api/line/retry/[notificationId]/route.ts`）
  - 通知履歴から元の通知情報を取得する機能を実装
    - Google Sheets APIから直接通知履歴を取得
    - 通知IDで通知履歴エントリを検索
    - エラーハンドリングを実装（通知履歴が見つからない場合の処理）
  - Job情報を取得して通知データを再構築する機能を実装
    - `fetchJobById`関数を使用してJob情報を取得
    - 顧客情報と車両情報を取得
    - 元の通知リクエストを再構築（通知タイプ、Job ID、LINE User ID、追加データ）
  - LINE通知送信APIを呼び出して再送信する機能を実装
    - `sendLineNotification`関数を使用して再送信
    - エラーハンドリングを実装（再送信失敗時の処理）
  - リトライ回数の更新機能の実装（`src/app/api/line/retry/[notificationId]/route.ts`）
    - `updateRetryCount`関数を実装してGoogle Sheets APIを使用してリトライ回数を更新
    - 通知履歴シートから通知IDで行を特定
    - リトライ回数カラムの位置を動的に取得
    - 現在のリトライ回数を取得してインクリメント
    - Google Sheets APIの`values.update`メソッドを使用して該当カラムのみ更新
    - カラム位置を文字列に変換する関数を実装（A=0, B=1, ..., Z=25, AA=26, ...）
    - エラーハンドリングを実装（更新失敗時もリトライ処理自体は成功として扱う）
- 2025-01-XX: Zoho CRM APIバッチ更新エンドポイントの実装完了（`src/app/api/zoho/batch/route.ts`、`src/lib/zoho-batch.ts`）
  - `POST /api/zoho/batch`エンドポイントを実装
    - 複数の更新リクエストをまとめて処理する機能を実装
    - 最大バッチサイズのチェック（100件）
    - リソースタイプごとにグループ化して処理
    - JobとCustomerの更新をサポート（Vehicleはマスタデータのため更新不可）
    - エラーハンドリングを実装（個別エントリの失敗も含む）
  - `executeBatchUpdate`関数を実装（`src/lib/zoho-batch.ts`）
    - バッチ更新エンドポイントを呼び出す機能を実装
    - エラーハンドリングを実装（エラー時はすべてのエントリを失敗として扱う）
    - TODOコメントを削除
- 2025-01-XX: LINEマジックリンクトークンのGoogle Sheets保存機能の実装完了（`src/app/api/line/magic-link/route.ts`）
  - マジックリンクトークンをGoogle Sheetsに保存する機能を実装
    - シート名: "マジックリンクトークン"
    - カラム構成: トークン、Job ID、Work Order ID、有効期限、作成日時、使用済みフラグ
    - Google Sheets APIを使用して行を追加
    - エラーハンドリングを実装（保存失敗時もURLは生成して返す）
    - TODOコメントを削除
- 2025-01-XX: LINE API関数のTODOコメントクリーンアップ完了（`src/lib/line-api.ts`、`src/app/api/line/notify/route.ts`）
  - `sendLineNotification`関数のTODOコメントを削除（既に実装済み）
  - `generateMagicLink`関数のTODOコメントを削除（既に実装済み）
  - `getNotificationHistory`関数のTODOコメントを削除（既に実装済み）
  - `retryNotification`関数のTODOコメントを削除（既に実装済み）
  - `POST /api/line/notify`のTODOコメントを更新（既にLINE Messaging APIを実装済み）
- 2025-01-XX: エラーランプ情報のcheckIn API統合完了（`src/lib/api.ts`、`src/app/page.tsx`）
  - `checkIn`関数にエラーランプ情報パラメータを追加
    - エラーランプ情報がある場合、Zoho CRMの`field7`（詳細情報）フィールドに追記
    - フォーマット: 【エラーランプ情報】、エラーランプの種類、その他の詳細
    - 既存の詳細情報がある場合は改行で区切って追加
  - `handleCourtesyCarSelect`関数でエラーランプ情報を`checkIn`関数に渡すように変更
    - TODOコメントを削除
    - エラーランプ情報を`checkIn`関数の引数として渡す
- 2025-01-XX: 診断画面でのエラーランプ情報取得・flowType決定機能の実装完了（`src/app/mechanic/diagnosis/[id]/page.tsx`、`src/lib/error-lamp-parser.ts`）
  - エラーランプ情報パーサーの実装（`src/lib/error-lamp-parser.ts`）
    - `parseErrorLampInfoFromField7`関数を実装
    - Zoho CRMの`field7`（詳細情報）からエラーランプ情報を抽出
    - フォーマット: 【エラーランプ情報】セクションからエラーランプの種類とその他の詳細を抽出
    - 正規表現を使用してセクションを検索し、エラーランプの種類とその他の詳細を抽出
  - 診断画面でのエラーランプ情報取得機能を実装
    - `field7`からエラーランプ情報を取得（故障診断の場合のみ）
    - `useMemo`を使用してエラーランプ情報を取得
    - `FaultDiagnosisView`にエラーランプ情報を渡す
    - TODOコメントを削除
  - 入庫区分に基づくflowType決定機能を実装
    - 入庫区分（serviceKinds）に基づいてflowTypeを決定
    - `useMemo`を使用してflowTypeを計算
    - 故障診断: "FAULT"、修理・整備: "REPAIR"、車検/12ヵ月点検: "INSPECTION"、チューニング・パーツ取付: "TUNING"、コーティング: "COATING"、板金・塗装: "BODY_PAINT"、レストア: "RESTORE"、その他: "OTHER"
    - TODOコメントを削除
- 2025-01-XX: アナリティクスデータのGoogle Sheets保存機能の実装完了（`src/app/api/analytics/route.ts`）
  - アナリティクスイベントをGoogle Sheetsに保存する機能を実装
    - シート名: "アナリティクス"
    - カラム構成: イベントID、イベント種別、画面ID、ユーザーロール、タイムスタンプ、所要時間、追加データ（JSON形式）、ページパス、ページタイトル
    - Google Sheets APIを使用して行を追加（`append`メソッド）
    - イベントIDを自動生成（`analytics-{timestamp}-{random}`形式）
    - エラーハンドリングを実装（保存失敗時も開発環境ではログに出力して処理を続行）
    - 環境変数が設定されていない場合は警告を出力（開発環境のみ）
    - TODOコメントを削除
- 2025-01-XX: Phase 5「ビデオコミュニケーション機能：シグナリングサーバー実装」の完了
  - WebRTCシグナリングAPI Routeの実装（`src/app/api/webrtc/signal/route.ts`）
    - シグナリングメッセージの送信・受信・クリア機能を実装
    - インメモリストレージを使用した簡易実装（本番環境ではRedisやデータベースを推奨）
    - メッセージタイプ: offer、answer、ice-candidate、hangup
    - ルームベースのメッセージ管理
  - WebRTCシグナリングクライアントの実装（`src/lib/webrtc-signaling.ts`）
    - シグナリングメッセージの送信・受信・クリア関数を実装
    - HTTP API経由のシグナリング通信
  - ビデオ通話コンポーネントのWebRTC統合（`src/components/features/video-call-dialog.tsx`）
    - WebRTC PeerConnectionの実装
    - STUNサーバーを使用したNAT越え
    - オファー/アンサー/ICE候補の交換
    - シグナリングメッセージのポーリング（1秒ごと）
    - 接続状態の管理とエラーハンドリング
    - リモートストリームの処理
    - TODOコメントを削除
- 2025-01-XX: Phase 5「リアルタイム同期機能の強化：ポーリング方式の実装」の完了
  - リアルタイム更新API Routeの実装（`src/app/api/realtime/updates/route.ts`）
    - GET: リアルタイム更新イベントを取得（ポーリング方式）
    - POST: リアルタイム更新イベントを送信（ブロードキャスト）
    - インメモリストレージを使用した簡易実装（本番環境ではRedisやデータベースを推奨）
    - イベントタイプ: job.updated、job.created、job.deleted、work_order.updated、work_order.created、diagnosis.updated、estimate.updated、work.updated、sync.required
    - タイムスタンプベースのフィルタリング（sinceパラメータ）
  - リアルタイム更新クライアントの実装（`src/lib/realtime-client.ts`）
    - ポーリング方式でリアルタイム更新を取得
    - イベントハンドラーの登録・削除
    - イベントの送信（ブロードキャスト）
    - 自動ポーリング機能（デフォルト: 2秒ごと）
  - リアルタイム更新フックの実装（`src/hooks/use-realtime.ts`）
    - オンライン時に自動ポーリング開始
    - オフライン時に自動ポーリング停止
    - イベントハンドラーの登録
    - コンポーネントのアンマウント時にクリーンアップ
  - トップページへの統合（`src/app/page.tsx`）
    - `useWebSocket`から`useRealtime`に変更
    - ジョブ更新・作成・同期要求のイベントハンドラーを実装
    - SWRキャッシュの再検証を実装
- 2025-01-XX: Phase 5「リアルタイム同期機能の強化：ポーリング方式からServer-Sent Events (SSE)方式への移行」の完了
  - SSEストリームAPI Routeの実装（`src/app/api/realtime/stream/route.ts`）
    - Server-Sent Events (SSE) によるリアルタイム更新ストリーム
    - ReadableStreamを使用したSSEストリームの作成
    - SSE接続の管理（登録・削除・ブロードキャスト）
    - 再接続時のイベントIDベースの履歴取得（lastEventIdパラメータ）
    - 接続が閉じられた時のクリーンアップ処理
    - 適切なSSE用HTTPヘッダーの設定（Content-Type: text/event-stream, Cache-Control, Connection: keep-alive）
  - リアルタイム更新クライアントのSSE対応（`src/lib/realtime-client.ts`）
    - ポーリング方式からSSE方式に移行
    - EventSource APIを使用したSSE接続の確立
    - 自動再接続機能（指数バックオフ）
    - イベントIDベースの履歴管理（lastEventId）
    - イベントハンドラーの登録・削除
    - イベントの送信（ブロードキャスト）機能は維持
  - リアルタイム更新フックのSSE対応（`src/hooks/use-realtime.ts`）
    - コメントをSSE方式に更新
    - ページ可視性の監視（ページが非表示の時はSSE接続を停止）
    - オンライン時に自動SSE接続開始、オフライン時に自動SSE接続停止
    - コンポーネントのアンマウント時にクリーンアップ
  - イベントブロードキャスト機能のSSE対応（`src/app/api/realtime/updates/route.ts`）
    - `broadcastEvent`関数をSSE対応に変更
    - 動的インポートを使用してSSEストリームAPIから`broadcastToSSEClients`を呼び出し
    - 循環依存を回避する実装
    - ポーリング方式との後方互換性を維持
  - トップページへの統合（`src/app/page.tsx`）
    - コメントをSSE方式に更新
    - `intervalMs`パラメータは後方互換性のため残すが、SSEでは使用しない
- 2025-01-XX: Phase 5「ビデオコミュニケーション機能：ビデオ共有機能のレポート画面への統合」の完了
  - レポート画面へのビデオ共有機能の統合（`src/app/customer/report/[id]/page.tsx`）
    - 作業動画リストの生成（診断データから動画を取得）
    - 作業動画セクションの追加（動画がある場合のみ表示）
    - 動画プレーヤーの表示（controls付き）
    - 動画共有ボタンの追加（各動画ごと）
    - `VideoShareDialog`の統合（動画URLの表示、コピー、LINE共有、ブラウザで開く）
    - 動画がない場合はセクションを非表示
- 2025-01-XX: Phase 4「コーティング：事前見積画面の実装」の完了
  - 事前見積画面の実装（`src/app/admin/pre-estimate/[id]/page.tsx`）
    - コーティング種類選択（3種類：ハイモースコート エッジ、ハイモースコート グロウ、ガードグレイズ）
    - オプションサービス選択（7種類、同時施工で10％割引）
    - 見積金額の自動計算
    - 車両情報の表示（登録番号、車台番号、車両の寸法）
    - 車両マスタからの寸法情報取得（`findVehicleMasterById`を使用）
    - 顧客への送信機能（LINE通知、マジックリンク生成）
    - ステータス更新（「顧客承認待ち」）
    - `CoatingPreEstimateView`コンポーネントの統合
- 2025-01-XX: Phase 4「コーティング：作業画面の拡張（乾燥プロセス管理・メンテナンス期間管理）」の完了
  - コーティング作業管理コンポーネントの実装（`src/components/features/coating-work-management.tsx`）
    - 乾燥プロセス管理機能
      - 乾燥開始日時、乾燥完了予定日時、乾燥完了日時の管理
      - 乾燥状態の管理（未開始、乾燥中、完了）
      - 乾燥メモの入力
      - 予定完了日を過ぎた場合のアラート表示
    - メンテナンス期間（1-3年）の管理機能
      - メンテナンス期間（年）の入力（1-3年）
      - 次回メンテナンス推奨日の自動計算・入力
      - メンテナンス方法の説明入力
      - 推奨日を過ぎた場合のアラート表示
  - WorkData型の拡張（`src/types/index.ts`）
    - `coatingInfo`フィールドを追加（乾燥プロセス、メンテナンス期間）
  - 作業画面への統合（`src/app/mechanic/work/[id]/page.tsx`）
    - コーティングの場合に`CoatingWorkManagement`コンポーネントを表示
    - 既存データの読み込み（選択中のワークオーダーから）
    - 作業完了時にコーティング固有情報を保存
- 2025-01-XX: 未完成機能の完了計画の実装
  - Phase 1「コーティング事前見積データの保存機能」の完了
    - 事前見積データの型定義を追加（`src/types/index.ts`）
    - 事前見積データの保存機能ライブラリを作成（`src/lib/pre-estimate-storage.ts`）
    - 事前見積画面への統合（`src/app/admin/pre-estimate/[id]/page.tsx`）
      - 見積送信時に事前見積データをGoogle Driveに保存
      - ページ読み込み時に既存の事前見積データを読み込んで復元
  - Phase 2「整備士名の自動取得の改善」の完了
    - 認証ヘルパー関数を追加（`src/lib/auth.ts`）
      - `getCurrentMechanicName()`関数を実装（将来の認証システムに対応）
    - 診断画面の修正（`src/app/mechanic/diagnosis/[id]/page.tsx`）
      - `getCurrentMechanicName()`を使用して整備士名を取得
      - localStorageへの直接アクセスを削除
  - Phase 3「顧客ダッシュボードの顧客ID取得」の完了
    - マジックリンクからの顧客ID取得機能を実装（`src/lib/line-api.ts`）
      - `getCustomerIdFromMagicLink()`関数を追加
    - マジックリンクトークンから顧客IDを取得するAPI Routeを実装（`src/app/api/line/magic-link/[token]/customer-id/route.ts`）
    - 顧客ダッシュボードの修正（`src/app/customer/dashboard/page.tsx`）
      - URLパラメータ`customerId`から取得
      - マジックリンクトークンから顧客IDを取得する機能を追加
      - 認証システム実装時の切り替えを容易にする
  - Phase 4「ロードマップの更新」の完了
    - Phase 5.5「Zoho CRM実データ連携（将来実装予定）」セクションを追加
    - 未完成機能の実装状況を更新

---

## Phase 5.5: Zoho CRM実データ連携（将来実装予定）

**目的**: モック実装から実際のZoho CRM API連携への置き換え

**実装項目**:
1. **Zoho CRM API連携の実装**
   - モック実装から実際のZoho CRM API呼び出しへの置き換え
   - 読み込み専用実装の計画（書き込みは将来実装予定）
   - API認証の実装（OAuth 2.0）
   - レート制限対策の実装
   - エラーハンドリングの強化

2. **データ同期の実装**
   - Zoho CRMとアプリ間のデータ同期
   - データ不整合時の対応機能
   - バッチ処理による効率的なデータ取得

**技術検討事項**:
- Zoho CRM APIの認証方式（OAuth 2.0）
- レート制限対策（指数バックオフ、リトライ戦略）
- データ同期の頻度とタイミング
- エラーハンドリングとログ記録

**実装期間の目安**: 4-6週間（API連携の実装とテスト）

**注意事項**:
- 現在の実装では、モックデータを使用
- 実際のZoho CRM API連携は、Zoho CRM管理者との調整が必要
- 読み込み専用実装から開始し、書き込み機能は段階的に実装

---

## Phase 6: リリース後の将来機能（将来実装予定）

**目的**: リリース後の機能拡張として、顧客認証システムとセキュリティ強化を実装

**実装項目**:
1. **顧客認証システム**
   - 認証ライブラリの選定と導入（Better Auth、NextAuth、またはカスタム実装）
   - 顧客ログイン画面の実装
   - 認証方式の選択（メール/パスワード、マジックリンク、OAuth等）
   - 顧客アカウント管理機能（パスワードリセット、プロフィール編集）
   - 顧客ポータルへのRoute Guard適用
   - セッション管理の強化（JWT対応、リフレッシュトークン）

2. **セキュリティ強化**
   - 顧客データへのアクセス制御
   - ジョブIDベースのURL共有方式との併用検討
   - 二要素認証（2FA）の検討
   - セキュリティ監査ログ

3. **顧客ポータル機能の拡張**
   - 認証済み顧客向けの追加機能（履歴閲覧、お気に入り車両管理等）
   - 顧客ダッシュボードの認証統合

**技術検討事項**:
- Better Auth vs NextAuth vs カスタム実装の比較検討
- 認証方式の選定（メール/パスワード、マジックリンク、OAuth等）
- 既存のセッションベース認証システムとの統合方法
- 顧客データのプライバシー保護

**実装期間の目安**: 4-6週間（認証ライブラリの選定と実装）

**注意事項**:
- 現在の実装では、顧客ポータルはURL共有方式（認証なし）で動作
- 認証システム導入時は、既存の顧客ポータル機能との互換性を確保すること
- セキュリティ要件に応じて、段階的な実装を検討すること
