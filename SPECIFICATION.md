# 整備工場DXプラットフォーム：開発仕様書 (v3.0 Final)

**Project Name:** Repair Shop DX Platform (YM Works Edition)
**Tech Stack:** Next.js (App Router), Tailwind/Shadcn, Vercel
**External Systems:** Zoho CRM (The Truth), Google Sheets (Master Cache), Google Drive (Storage)
**Infrastructure:** No additional license costs (Free Tier / Existing Plans optimization)

## 0. データアーキテクチャ & API定義 (The Truth)
本システムは、**「スマートカーディーラー（基幹システム）」を絶対的な正（Master）**とし、ZohoとWebアプリが連携する構成とする。

### 0-1. システム役割とデータ権限 (Master Definition)
| システム | 具体名 | 役割 | データ権限 (App側) | 備考 |
| :--- | :--- | :--- | :--- | :--- |
| **基幹システム** | スマートカーディーラー | **The Truth (絶対正)** | **No Access** | 顧客・車両・売上の最終保管場所。API連携せず、CSV/Excel経由で連携する（MVP）。 |
| **マスタ参照用** | Google Sheets | Mirror (鏡) | Read Only | スマートカーディーラーから毎日出力されるデータを格納。アプリはここを見て車両検索する。 |
| **CRM** | Zoho CRM | Transaction | Read / Write | 顧客対応、予約、進捗ステータス管理、アプリ用データハブ。 |
| **ストレージ** | Google Drive | Storage | Read / Write | 写真、動画、PDF（スマートカーディーラーから出力した請求書等）。<br>※**重要:** 画像はクライアント側で圧縮保存する（容量対策）。 |
| **アプリ** | **新アプリ (Next.js)** | UI / UX | Read / Write | 顧客および現場スタッフ（フロント・整備士）の操作画面。社内指示書もここから入力可能。 |

### 0-2. Zoho CRM モジュール・フィールド・APIマッピング
**【重要】** 開発時は以下のAPI名を使用すること。（提供リスト準拠）

#### A. 入庫管理 (`CustomModule2`)
本システムのメイン。案件(Job)を管理する。
*   **Key ID:** `id` (Record ID)
*   **検索キー:** `field22` (入庫日時), `field4` (顧客名Lookup), `field6` (車両ID Lookup)

| 項目名 | API名 | データ型 | 用途・ロジック |
| :--- | :--- | :--- | :--- |
| 入庫日時 | `field22` | DateTime | Phase 0/1: 「今日」のデータを取得するクエリに使用。 |
| 工程ステージ | `field5` | PickList | ステータス管理（入庫済み / 見積作成待ち / 作業待ち / 出庫待ち / 出庫済み）。 |
| 顧客名 | `field4` | Lookup | 顧客モジュール(`Contacts`)への参照。 |
| 車両ID | `field6` | Lookup | 車両モジュール(`CustomModule1`)への参照。 |
| **作業指示書** | **`field`** | **Multi-Line** | **Phase 0: 社内からの申し送り事項（CRM直接入力またはアプリ入力）。アプリで「⚠」アイコンを表示。** |
| 詳細情報 | `field7` | Multi-Line | Phase 0: 顧客が事前入力した不具合・問診内容をここに追記。 |
| 走行距離 | `field10` | Number | Phase 0: 顧客入力値 / Phase 2: メカニック入力値。 |
| **作業内容** | **`field13`** | **Multi-Line** | **Phase 4/5: 顧客承認済みの見積もり明細（テキスト）をここに書き込む。**<br>※`field14`(一覧)は選択リスト型のため使用しない。 |
| 作業内容一覧 | `field14` | Multi-Select | ※使用しない（APIエラー回避のため）。 |
| お客様共有フォルダ | `field19` | URL | Phase 2: 作成したGoogle DriveフォルダのURLを書き戻す。 |
| 予約ID | `ID_BookingId` | Text | Zoho Bookingsとの紐付け用。 |
| 関連ファイル | `field12` | Upload | 車検証画像などを格納。 |

#### B. 顧客 (`Contacts`)
顧客情報。アプリからの差分更新対象。
*   **Key ID:** `id` (Record ID), `ID1` (顧客ID - 基幹連携用)

| 項目名 | API名 | データ型 | 用途・ロジック |
| :--- | :--- | :--- | :--- |
| 顧客ID | `ID1` | Text | 最重要キー。スプレッドシート（マスタ）との突合に使用。<br>※基幹ID（例: K1001）が格納されている前提。 |
| 氏名 | `Last_Name`, `First_Name` | Text | 表示用。 |
| LINE ID | `Business_Messaging_Line_Id` | Text | Phase 1: LINE連携時にアプリから書き込む（直接更新OK）。 |
| メール同意 | `Email_Opt_Out` | Boolean | Phase 0: 事前チェックインで同意なら `false` に更新（直接更新OK）。 |
| 誕生日 | `Date_of_Birth` | Date | Phase 0: 入力があれば更新（直接更新OK）。 |
| 住所 | `Mailing_Street`, `field4` | Text | **直接更新NG**。変更がある場合は `Description` へ追記。<br>※`Mailing_Street`(町名・番地), `field4`(番地), `field6`(建物名等) |
| 電話番号 | `Phone`, `Mobile` | Text | **直接更新NG**。変更がある場合は `Description` へ追記。 |
| 備考 | `Description` | Text | アプリからの「住所・電話変更依頼」をここに追記する。 |
| **予約時連絡先** | **`Booking_Phone_Temp`** | **Text** | **(新規追加) Bookingsからの電話番号一時保存用（上書き防止）。** |

#### C. 車両 (`CustomModule1`)
Zoho内の簡易車両データ。
*   **Key ID:** `Name` (車両ID - 基幹連携用)

| 項目名 | API名 | データ型 | 用途・ロジック |
| :--- | :--- | :--- | :--- |
| 車両ID | `Name` | Text | 最重要キー。スプレッドシート（マスタ）との突合に使用。 |
| 登録番号連結 | `field44` | Text | ナンバープレート情報。検索・表示用。 |
| 顧客ID | `ID1` | Text | 所有者紐付け用。 |
| 車検有効期限 | `field7` | Date | Phase 6: 次回リマインド用。 |

#### D. その他利用モジュール
*   **商談 (`Deals`):** 新規問い合わせ管理。アプリからは参照しない（入庫管理にコンバートされたものだけ扱う）。
*   **予約 (`Appointments__s`):** Zoho Bookingsデータ。Read Only。
*   **予定 (`Events`):** カレンダー連携。
    *   `Work_Order_ID`: 作業指示書ID
    *   `field4`: 作業内容
*   **タスク (`Tasks`):** Todo管理。

### 0-3. データの同期フロー (Data Pipeline)
**A. マスタデータの流れ（下り：Smart Car Dealer → App）**
1.  **Export:** 事務員が毎日、スマートカーディーラーからCSV/Excelで書き出し、Driveへアップロード。
2.  **Import:** GAS (Google Apps Script) がファイルを検知し、Google Sheetsに上書き展開する。
3.  **Read:** Webアプリ（Next.js）は、このSheetsをAPI経由で参照し、予約時の車両特定などに利用する。
    *   **【事前タスク】:** 基幹システムの「顧客ID（例: K1001）」とZohoの「ID1」のフォーマットが完全一致しているか、開発前にデータクレンジングを行うこと。

**B. 更新データの流れ（上り：App → Smart Car Dealer）**
1.  **Input:** 顧客が Webアプリ（事前チェックイン画面） で「新住所」を入力。
2.  **Pool:** WebアプリはZoho CRM (`Contacts`) の `Description` (詳細情報) にデータを書き込む。
3.  **Update:** 事務員がZohoの変更通知を見て、**手動で**スマートカーディーラーの登録情報を修正する。
    *   ※ここを自動化するのはリスクが高いため、MVPでは人間が介在する運用とする。

**C. 社内作業指示の流れ (Internal Order)**
1.  **Input:**
    *   **電話対応時:** スタッフが **Zoho CRM画面へ直接入力**。
    *   **現場対応時:** スタッフが **新アプリ** から入力。
2.  **Sync:** 入力内容は Zoho CRM `CustomModule2` の **`field` (作業指示書)** に集約される。
3.  **Output:** 新アプリの受付・診断画面に「⚠作業指示あり」アイコンとして表示される。

**D. APIレート制限対策 (Architecture)**
*   **Caching:** Next.js側で `SWR` または `TanStack Query` を使用し、マスタデータ等のAPIレスポンスを適切にキャッシュする（TTL設定）。
*   **Optimization:** 不要なポーリングを避け、Webhookや適切な再検証間隔（Revalidation）を設定する。

### 0-4. マスタデータ構造 (Smart Car Dealer出力準拠)
Google Sheetsのカラム名は、提供されたデータのヘッダー行に基づく。
*   **車両マスタ (`SheetID_Vehicle`):** 検索キー=`顧客ID`。
    *   主要カラム: `車両ID` (Key), `顧客ID`, `登録番号連結`, `車名`, `型式`, `車検有効期限`, `次回点検日`
*   **顧客マスタ (`SheetID_Customer`):** 検索キー=`顧客ID`。
    *   主要カラム: `顧客ID` (Key), `顧客名`, `住所連結`, `電話番号`, `携帯番号`

# ユーザー別業務・システム利用詳細設計

## Phase 0. 予約・事前準備（家・オフィス）詳細設計
**コンセプト：** 入り口（Web/電話/メール）はバラバラでも、最終的にZoho CRMの**「入庫管理 (`CustomModule2`)」**モジュールでデータが一本化され、それが現場アプリに同期される。

### 0-1. 新規顧客のフロー（まずは見積もりから）
*   **Step 1: 問い合わせ (Action)**
    *   HPフォーム(WP) → Zoho CRM `Deals` (商談) 自動作成。
    *   電話 → Bookings経由、または直接入力。
*   **Step 2: 商談・追跡 (System: 商談管理)**
    *   スタッフが概算見積もり提示。
*   **Step 3: 受注・予約確定 (Conversion)**
    *   金額合意後、Zoho Bookingsで予約 → `CustomModule2` (入庫管理) 自動作成。

### 0-2. 既存顧客のフロー（リピーター・車検）
*   **Step 1: きっかけ (Trigger)**
    *   Zoho Campaignsからの車検案内メール。
*   **Step 2: 予約アクション (Action)**
    *   メール内リンクから Zoho Bookings で予約。
    *   **【不整合対策（電話番号）】:**
        *   Bookingsの電話番号項目は、CRMの **「予約時連絡先 (`Booking_Phone_Temp`)」** にマッピングする。
        *   **理由:** 顧客入力による、CRM上の正しい「携帯番号 (`Mobile`)」の上書き防止。
*   **Step 3: 自動連携 (System: 入庫管理)**
    *   Bookings連携で `CustomModule2` 自動作成。

### 0-3. システム連携＆事前チェックイン
*   **Step 1: 案内受信 & アクセス**
    *   予約確定時/前日メールの「Web受付票」リンクを開く。
*   **Step 2: 車両の特定 (Vehicle Selection)**
    *   Google Sheets (車両マスタ) を検索し、保有車両リストから選択。
    *   **※新規客/リストにない場合:**
        *   **「別の車（新規）」**を選択。
        *   **「車種名（例: BMW X3）」をテキスト入力**し、車検証写真をアップロード（→ `field12`へ保存）。
*   **Step 3: 顧客情報の確認 (不整合対策)**
    *   住所・電話変更があれば入力。
    *   データは **「備考 (`Description`)」** に「【アプリ変更届】」として追記される（上書きしない）。
*   **Step 4: 問診入力 (Details)**
    *   走行距離、不具合内容を入力 → `field7` へ保存。

---

## Phase 1. 来店・受付（フロント）詳細設計
**コンセプト：** 「名前を聞いて検索する」を廃止。タブレット1タップで、アナログ（車の鍵）とデジタル（Zohoの案件データ）を結合する。

### 1-1. 来店・本人確認 (Identification)
*   **Step 1: アプリ確認**
    *   「入庫日時 = 今日」のリストを表示。
    *   **アイコン表示:**
        *   「📝事前入力あり」: 顧客による不具合入力や変更届がある場合。
        *   「⚠作業指示あり」: 社内指示（`field`）がある場合。
*   **Step 2: 接客**
    *   「田中様、お待ちしておりました」と対応し、**[Check-in]** ボタンをタップ。

### 1-2. スマートタグ紐付け (Pairing)
*   **Step 1: タグ選定**
    *   鍵に「空きスマートタグ（例: No.05）」を取り付ける。
*   **Step 2: 紐付け**
    *   アプリ画面の **[05]** ボタンをタップ（またはQRスキャン）。
*   **Step 3: リンク確立 (System)**
    *   `Tag ID: 05` ⇔ `Zoho Job ID` を紐付け。過去のセッションは `closed` に更新。

### 1-3. LINEコネクト (Connection)
*   **Action:** 店頭POPのQRからLINE友達追加、またはアカウント連携を案内。

### 1-4. 受付完了 (Complete)
*   **Action:** **[受付完了]** ボタンを押す。
*   **System:** Zohoのステータスを「入庫済み」に更新。

---

## Phase 2. 診断・撮影（ピット）詳細設計
**コンセプト：** 「汚れた手でPCを触らない」。スマホ一台で完結。

### 2-1. 車両特定 (Identification)
*   **Action:** アプリで「タグNo.05」のQRをスキャン、またはリストから選択。
*   **Display:** 「📝ブレーキ異音」「⚠ワイパー確認」等の情報をアラート表示。

### 2-2. 撮影 (Capture)
*   **Action:** ガイドに従い、前後左右を撮影。
*   **System (Client):**
    *   **【重要】圧縮処理:** ブラウザ側で画像を **300KB〜500KB程度に圧縮**。
    *   透かし合成、リネーム (`{位置}_{日付}_{車両}.jpg`) し、バックグラウンドでDriveへアップロード。

### 2-3. 診断・所見入力 (Diagnosis)
*   **Checklist:** 信号機方式（🟢緑/🟡黄/🔴赤）でタップ判定。
*   **Evidence:**
    *   [🔴] の箇所はカメラが起動し、接写。
    *   **動画 (MVP):** 異音などは動画で撮影。アプリ上では「動画リンク」として扱われる。
*   **Voice Input:** マイクボタンを押し、「パッド残2ミリ」と音声入力（Web Speech API）。

### 2-4. 診断完了・送信 (Submit)
*   **Action:** **[診断完了]** をスワイプ。フロントへ通知。

## Phase 3. 見積作成（事務所）詳細設計
**コンセプト：** 「ハイブリッド運用」。計算は基幹システム、プレゼンはWebアプリ。

### 3-1. 診断結果の確認 (Review)
*   **Action:** フロントがアプリでメカニックの写真・動画・コメントを確認。

### 3-2. 正確な計算 (Core System Calculation)
*   **Action:** 横のPCで **スマートカーディーラー（基幹）** を操作し、正確な見積書（税・工賃込み）を作成。

### 3-3. カート画面の作成 (Digital Menu Creation)
*   **App転記:** Webアプリで見積項目（松竹梅）を作成。
    *   例：「Fブレーキパッド交換」 / 「33,000円」（品名と金額のみ）
*   **証拠紐付け:**
    *   メカニックが撮った写真をドラッグ＆ドロップで項目に紐付け。
    *   動画がある場合は「動画リンクボタン」を紐付け。

### 3-4. 送信 (Send to Customer)
*   **Action:** **[LINEで送信]** ボタンを押す。
*   **System:** 一意なURLを発行し送信。Zohoステータスを「見積提示済み」に更新。

---

## Phase 4. 承認（顧客体験）詳細設計
**コンセプト：** Amazonのように、自分の車の整備内容をスマホで選び、ポチッと注文する。

### 4-1. アクセス・認証
*   **Action:** LINE/メールのリンクから見積画面を開く（ログイン不要）。

### 4-2. 選択・検討 (Shopping Experience)
*   **Display:** 松（必須・ロック）、竹（推奨・デフォルトON）、梅（任意・デフォルトOFF）の構成。
*   **Evidence:** 写真タップで拡大表示（Lightbox）。動画ボタンタップで別タブ再生。

### 4-3. 注文確定 (Checkout)
*   **Action:** 内容を調整し、**[この内容で作業を依頼する]** をタップ。
*   **Data Sync:**
    *   承認された項目リスト（テキスト）を Zoho `CustomModule2.field13` に保存。
    *   ステータスを「作業待ち」に更新。

---

## Phase 5. 作業・出庫（完了）詳細設計
**コンセプト：** 「やったことの証拠を残す」。そして出庫時はタブレットでプレゼン。

### 5-1. 作業指示の確認 (Work Order)
*   **Display:** メカニックのスマホに「承認された項目」のみ表示される（未承認項目は非表示）。

### 5-2. 作業実施・証拠撮影 (Execution)
*   **Action:** 部品交換後、**[証拠撮影]** ボタンで「新品と旧品」を並べて撮影（自動圧縮）。

### 5-3. 作業完了・請求確定 (Invoice)
*   **Mechanic:** **[作業完了]** をスワイプ。
*   **Front/Admin:**
    1.  基幹システムで請求書を確定・発行。
    2.  PDFとして保存（ファイル名: `田中様_請求書.pdf` 等、"請求書"を含める）。
    3.  新アプリ管理画面から **[請求書PDF登録]** ボタンでアップロード。
    4.  **[完了通知送信]** ボタンを押す。

### 5-4. 来店・対面説明 (Handover)
*   **Action:** 来店した顧客に、アプリでBefore/After写真を見せて説明。
*   **Payment:** 基幹システムで精算。

### 5-5. 出庫・タグ解除 (Unlink)
*   **Action:** 鍵からタグを外し、アプリで **[出庫完了]** をタップ。
*   **System:** タグ紐付け解除、Zohoステータスを「出庫済み」に更新。

---

## Phase 6. アフターフォロー詳細設計
**コンセプト：** 整備データが顧客の資産になる。

### 6-1. レポート送信 (Digital Handover)
*   **Trigger:** 出庫完了時、LINE/メールで「デジタル整備手帳」のリンクを自動送信。

### 6-2. デジタル整備手帳の閲覧
*   **Display:**
    *   Before/Afterの写真ギャラリー。
    *   **請求書PDF表示:** ファイル名に「invoice」「seikyu」「請求書」を含むPDFを検知して表示。
    *   メカニックからのコメント。

### 6-3. 次回リマインド (Retention)
*   **System:** 今回のデータを元にZoho CRM（車検日など）を更新。
*   **Automation:** 1ヶ月後の調子伺い、1年後の点検案内を自動化。

### 6-4. 情報不整合の修正 (Human Middleware)
*   **Action:** 事務またはフロントが、Zoho CRMの備考欄（`Description`）を確認。
*   **Fix:** 「【アプリ変更届】」の記載があれば、**スマートカーディーラー（基幹）** のマスタを手動修正する。
*   **Finish:** アプリ上の **[変更対応完了]** ボタンを押し、備考欄をクリアする。

