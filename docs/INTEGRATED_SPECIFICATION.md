# 統合仕様書：整備工場DXプラットフォーム

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 2.0
- **対象**: すべての入庫区分を統合したシステム仕様
- **設計方針**: 世界最高のUI/UX、ITコンサルの目線での推奨を元に設計
- **ステータス**: 統合仕様書

---

## 1. システム概要

### 1-1. システムの目的

整備工場DXプラットフォームは、12種類の入庫区分を統合管理し、受付から診断・見積・作業・引渡までの一連のワークフローをサポートするWebアプリケーションです。

### 1-2. 対象入庫区分

1. **車検**（法定24ヶ月点検）
2. **12ヵ月点検**（法定12ヶ月点検）
3. **エンジンオイル交換**
4. **タイヤ交換・ローテーション**
5. **その他のメンテナンス**（12種類のメンテナンス系サービスを統合）
6. **故障診断**
7. **修理・整備**
8. **チューニング・パーツ取付**
9. **コーティング**
10. **板金・塗装**
11. **レストア**
12. **その他**（汎用的な業務）

### 1-3. 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS 4
- **UI Library**: shadcn/ui (Radix UI)
- **State Management**: SWR (data fetching)
- **External Systems**:
  - Zoho CRM (Transaction Hub)
  - Google Sheets (Master Data Cache)
  - Google Drive (File Storage)
  - Google Apps Script (GAS) - マスタデータ同期（CSV/Excel → Google Sheets）

**重要: データアクセス制約**:
- **Zoho CRM**: アクセス可能。ただし、**マスタデータ（顧客・車両）の追加・編集・削除は絶対にしない**。CustomModule2（入庫管理）への更新のみ許可。
- **Google Sheets（マスタデータ）**: 読み取り専用。**追加・編集・削除は絶対にしない**。マスタデータの更新は基幹システム（スマートカーディーラー）からのCSV/Excel経由のみ。

---

## 2. システムアーキテクチャ統合

### 2-1. 基幹システム制約

**原則**: 基幹システム（スマートカーディーラー）は「The Truth（絶対正）」として維持

**維持すべき機能（変更不可）**:
- 帳票系業務: 各種帳票の作成・管理
- 請求書管理: 請求書の作成・確定・発行
- 顧客マスタ管理: 顧客情報の登録・更新・管理
- 車両マスタ管理: 車両情報の登録・更新・管理
- 売上管理: 売上データの最終保管場所

**データ連携方法（MVP）**:
- **下り（基幹 → アプリ）**: CSV/Excel経由でGoogle Sheetsに展開
- **上り（アプリ → 基幹）**: Zoho CRMの`Description`に追記、事務員が手動で基幹システムを更新

**⚠️ 重要: マスタデータ保護制約**:
- **Google Sheets（マスタデータ）**: アプリから**追加・編集・削除は絶対にしない**。読み取り専用として扱う。
- **Zoho CRM（マスタデータモジュール）**: 
  - Contacts（顧客）モジュール: 許可されたフィールドのみ更新可能（LINE ID、メール同意、誕生日など）。顧客の追加・削除は禁止。
  - CustomModule1（車両）モジュール: **追加・編集・削除は絶対にしない**。読み取り専用として扱う。
- **マスタデータの更新**: 基幹システム（スマートカーディーラー）からのCSV/Excel経由のみ。

### 2-2. Zoho CRM拡張設計

**入庫管理（CustomModule2）の拡張**:

| **項目名** | **API名** | **データ型** | **用途・ロジック** |
| --- | --- | --- | --- |
| 入庫日時 | field22 | DateTime | 入庫日時 |
| 工程ステージ | field5 | PickList | ステータス管理（**注意**: 実際のZoho CRM PickListの選択肢を確認すること。元の仕様書では「入庫済み / 見積作成待ち / 作業待ち / 出庫待ち / 出庫済み」と記載） |
| 顧客名 | field4 | Lookup | 顧客モジュール(Contacts)への参照 |
| 車両ID | field6 | Lookup | 車両モジュール(CustomModule1)への参照 |
| **実施作業リスト** | **field_service_kinds** | **Multi-Select** | **実施する作業のリスト（車検、オイル交換、コーティングなど）** ※新規追加フィールド |
| **ワークオーダー詳細** | **field_work_orders** | **Multi-Line (JSON)** | **各作業の詳細情報（診断・見積・作業情報）をJSON形式で保存** ※新規追加フィールド |
| **基幹システム連携ID** | **field_base_system_id** | **Text** | **基幹システムの入庫IDまたは伝票番号（請求書統合用）** ※新規追加フィールド |
| 詳細情報 | field7 | Multi-Line | 顧客が事前入力した不具合・問診内容 |
| 走行距離 | field10 | Number | 走行距離 |
| 作業指示書 | field | Multi-Line | 社内からの申し送り事項（CRM直接入力またはアプリ入力）。アプリで「⚠作業指示あり」アイコンを表示 |
| 作業内容 | field13 | Multi-Line | 顧客承認済みの見積もり明細（テキスト） |
| 作業内容一覧 | field14 | Multi-Select | **※使用しない（APIエラー回避のため）** |
| 関連ファイル | field12 | Upload | 車検証画像のURLを格納（実際のファイルは車両フォルダの`/documents/`に保存） |
| お客様共有フォルダ | field19 | URL | 作成したGoogle DriveフォルダのURLを書き戻す |
| 予約ID | ID_BookingId | Text | Zoho Bookingsとの紐付け用 |

**注意事項**:
- `field14`（作業内容一覧）はMulti-Select型のため、自由入力を含む見積もりの保存には不向き。テキスト型の`field13`（作業内容）を使用すること。
- `field`（作業指示書）に値が存在する場合、アプリの受付・診断画面に「⚠作業指示あり」アイコンを表示し、スタッフに注意を促す。

#### 2-2-1. 新規フィールド追加の前提条件と代替案

**重要**: `field_service_kinds`, `field_work_orders`, `field_base_system_id` は新規追加フィールドです。実装前に以下を確認してください。

**前提条件**:
1. **Zoho CRM管理者による確認事項**:
   - CustomModule2（入庫管理）に新規カスタムフィールドを追加可能か
   - フィールド名の命名規則（`field_service_kinds` 形式で追加可能か、それとも `field23`, `field24` などの連番形式か）
   - 追加に必要な権限・手順
   - Multi-Lineフィールドの実際のサイズ制限（64KB制限の確認）

2. **既存フィールドの再利用可能性**:
   - `field14`（作業内容一覧、Multi-Select）は「使用しない」とされているが、これを再利用できないか検討
   - 未使用の既存フィールド（`field8`, `field9`, `field11`, `field15-18`, `field20-21`など）を活用できないか検討

**代替案（新規フィールド追加が不可能な場合）**:

**案1: 既存フィールドの組み合わせ利用**
- `field13`（作業内容）にJSON形式で全ワークオーダー情報を保存
- ただし、`field13`は既に「顧客承認済みの見積もり明細」として使用されているため、用途が競合

**案2: Google Drive JSONファイルでの管理**
- ワークオーダー詳細をGoogle DriveのJSONファイルとして保存
- Zoho CRMには `field19`（お客様共有フォルダ）のURLのみ保存
- アプリ側でGoogle Drive API経由でJSONを取得・更新

**案3: 別モジュール（CustomModule3）の作成**
- ワークオーダー専用のCustomModule3を作成
- CustomModule2との関連はLookupフィールドで管理

**推奨**: 実装前にZoho CRM管理者と協議し、新規フィールド追加の可否を確認すること。追加不可能な場合は、案2（Google Drive JSON管理）を採用する。

**ワークオーダー詳細（JSON形式）**:
```json
{
  "workOrders": [
    {
      "id": "wo-001",
      "serviceKind": "車検",
      "status": "完了",
      "diagnosis": { ... },
      "estimate": { ... },
      "work": { ... },
      "baseSystemItemId": "INV-2025-001-1",
      "cost": 134750
    }
  ],
  "totalCost": 145310,
  "baseSystemInvoiceId": "INV-2025-001"
}
```

#### 2-2-1. JSONフィールドサイズ制限とデータ分離戦略

**リスク**: Zoho CRMのMulti-Lineフィールドには容量制限（約64KB）があり、写真・動画・詳細コメントを含む全データをJSON形式で保存すると制限を超過する可能性がある。

**対策: データ分離戦略**

| データ種別 | 保存先 | `field_work_orders`に保存する内容 |
| --- | --- | --- |
| ワークオーダー基本情報 | Zoho CRM | ID、入庫区分、ステータス、費用 |
| 写真・動画 | Google Drive | URLのみ（例: `drive.google.com/file/d/xxx`） |
| 診断詳細（検査項目100件以上） | Google Drive (JSON) | JSONファイルのURL |
| 見積詳細（部品リスト） | Google Drive (JSON) | JSONファイルのURL |
| コメント（長文） | Google Drive (TXT) | 先頭100文字 + ファイルURL |

**最適化されたJSON構造**:
```json
{
  "workOrders": [
    {
      "id": "wo-001",
      "serviceKind": "車検",
      "status": "完了",
      "diagnosisUrl": "https://drive.google.com/file/d/xxx/diagnosis.json",
      "estimateUrl": "https://drive.google.com/file/d/xxx/estimate.json",
      "workUrl": "https://drive.google.com/file/d/xxx/work.json",
      "photosCount": 15,
      "videosCount": 2,
      "baseSystemItemId": "INV-2025-001-1",
      "cost": 134750,
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "totalCost": 145310,
  "baseSystemInvoiceId": "INV-2025-001",
  "detailsVersion": "2.0"
}
```

**Google Drive上のディレクトリ構造**:
```
/repair-shop-dx/
  /customers/
    /{customerId}_{customerName}/
      /vehicles/
        /{vehicleId}_{vehicleName}/
          /documents/
            shaken_{vehicleId}_{日付}.pdf  # 車検証（最新版）
            shaken_history/  # 車検証履歴
          /jobs/
            /{jobDate}_{jobId}/
              /wo-001/
                diagnosis.json      # 診断詳細（検査項目、測定値）
                estimate.json       # 見積詳細（部品リスト、工賃）
                work.json           # 作業詳細（作業記録、時間）
                /photos/
                  before_001.jpg
                  after_001.jpg
                /videos/
                  diagnosis_001.mp4
              invoice.pdf  # 統合請求書（Job全体）
  /blog-photos/  # ブログ用写真フォルダ
    /by-date/
    /by-service/
    /by-vehicle-type/
    /before-after/
```

**容量見積もり**:
| 項目 | 見積もりサイズ | 備考 |
| --- | --- | --- |
| ワークオーダー1件（URLのみ） | 約500バイト | 基本情報 + URL参照 |
| ワークオーダー5件（最大想定） | 約2.5KB | 複数作業管理 |
| メタ情報 | 約500バイト | 合計金額、請求書ID等 |
| **合計** | **約3KB** | 64KB制限に対して十分な余裕 |

**実装時の注意点**:
1. **詳細データの遅延読み込み**: 画面表示時にGoogle DriveからJSONを非同期取得
2. **キャッシュ戦略**: SWRでGoogle Drive JSONをキャッシュ（stale-while-revalidate）
3. **一括保存の最適化**: 診断完了時に一括でJSONをアップロード
4. **バージョン管理**: `detailsVersion`で構造変更時の後方互換性を確保

#### 2-2-2. 顧客 (Contacts) モジュール

顧客情報。アプリからの差分更新対象。

**⚠️ 重要制約**: 
- **マスタデータ（顧客・車両）の追加・編集・削除は絶対にしない**
- アプリからZoho CRMのContactsモジュールへの直接更新は、許可されたフィールドのみ（LINE ID、メール同意、誕生日など）
- 住所・電話番号などの直接更新NGフィールドは、`Description`への追記のみ

- **Key ID:** `id` (Record ID), `ID1` (顧客ID - 基幹連携用)

| **項目名** | **API名** | **データ型** | **用途・ロジック** | **更新権限** |
| --- | --- | --- | --- | --- |
| 顧客ID | ID1 | Text | 最重要キー。スプレッドシート（マスタ）との突合に使用。基幹ID（例: K1001）が格納されている前提 | Read Only |
| 氏名 | Last_Name, First_Name | Text | 表示用 | Read Only |
| LINE ID | Business_Messaging_Line_Id | Text | LINE連携時にアプリから書き込む | **直接更新OK** |
| メール同意 | Email_Opt_Out | Boolean | 事前チェックインで同意なら `false` に更新 | **直接更新OK** |
| 誕生日 | Date_of_Birth | Date | 入力があれば更新 | **直接更新OK** |
| 住所 | Mailing_Street, field4, field6 | Text | Mailing_Street(町名・番地), field4(番地), field6(建物名等) | **直接更新NG** → `Description`へ追記のみ |
| 電話番号 | Phone, Mobile | Text | 電話番号、携帯番号 | **直接更新NG** → `Description`へ追記のみ |
| 備考 | Description | Multi-Line | アプリからの「住所・電話変更依頼」をここに追記 | **追記のみ** |
| 予約時連絡先 | Booking_Phone_Temp | Text | Bookingsからの電話番号一時保存用（上書き防止） | **直接更新OK** |

**更新制約の実装**:
```typescript
// 直接更新NGフィールドのバリデーション
const FORBIDDEN_UPDATE_FIELDS = [
  'Mailing_Street', 'field4', 'field6', // 住所関連（Mailing_Street: 町名・番地, field4: 番地, field6: 建物名等）
  'Phone', 'Mobile' // 電話番号
];

// 更新時のチェック
function validateCustomerUpdate(updates: Partial<ZohoCustomer>): ValidationResult {
  for (const field of FORBIDDEN_UPDATE_FIELDS) {
    if (field in updates) {
      return {
        valid: false,
        error: `${field}は直接更新できません。Descriptionへ追記してください。`
      };
    }
  }
  return { valid: true };
}

// 住所・電話変更時の処理
function requestCustomerInfoChange(
  customerId: string,
  changes: { address?: string; phone?: string; mobile?: string }
): void {
  // Descriptionへ追記
  const changeRequest = `【アプリ変更届】${new Date().toISOString()}\n`;
  if (changes.address) changeRequest += `新住所: ${changes.address}\n`;
  if (changes.phone) changeRequest += `新電話番号: ${changes.phone}\n`;
  if (changes.mobile) changeRequest += `新携帯番号: ${changes.mobile}\n`;
  
  // Zoho CRM API: Descriptionフィールドに追記
  appendToDescription(customerId, changeRequest);
}
```

#### 2-2-3. 車両 (CustomModule1) モジュール

Zoho内の簡易車両データ。

**⚠️ 重要制約**: 
- **マスタデータ（顧客・車両）の追加・編集・削除は絶対にしない**
- アプリからZoho CRMのCustomModule1（車両）モジュールへの直接更新は行わない
- 車両情報の更新は基幹システム（スマートカーディーラー）からのCSV/Excel経由のみ

- **Key ID:** `Name` (車両ID - 基幹連携用)

| **項目名** | **API名** | **データ型** | **用途・ロジック** |
| --- | --- | --- | --- |
| 車両ID | Name | Text | 最重要キー。スプレッドシート（マスタ）との突合に使用 |
| 登録番号連結 | field44 | Text | ナンバープレート情報。検索・表示用 |
| 顧客ID | ID1 | Text | 所有者紐付け用 |
| 車検有効期限 | field7 | Date | 次回リマインド用 |

#### 2-2-4. Zoho CRM側の追加フィールドとアプリ以外での設定情報

**重要**: 本システムを動作させるためには、Zoho CRM側での設定が必要です。アプリ開発とは別に、Zoho CRM管理者が実施する必要があります。

##### 2-2-4-1. 新規追加フィールド（CustomModule2: 入庫管理）

以下の3つのフィールドをZoho CRMのCustomModule2（入庫管理）に追加する必要があります。

| **フィールド名（表示名）** | **API名** | **データ型** | **必須設定** | **説明** |
| --- | --- | --- | --- | --- |
| 実施作業リスト | `field_service_kinds` | Multi-Select | 選択肢: 車検, 12ヵ月点検, エンジンオイル交換, タイヤ交換・ローテーション, その他のメンテナンス, 故障診断, 修理・整備, チューニング・パーツ取付, コーティング, 板金・塗装, レストア, その他 | 1つのJobに対して複数の作業を実施する場合に使用 |
| ワークオーダー詳細 | `field_work_orders` | Multi-Line | 最大文字数: 65535文字（64KB制限） | 各作業の詳細情報をJSON形式で保存。写真・動画はGoogle Driveに保存し、URLのみを記録 |
| 基幹システム連携ID | `field_base_system_id` | Text | 最大文字数: 255文字 | 基幹システム（スマートカーディーラー）の入庫IDまたは伝票番号。請求書統合時に使用 |

**追加手順（Zoho CRM管理者向け）**:
1. Zoho CRMにログインし、設定（Settings）→ カスタマイズ（Customization）→ モジュール（Modules）に移動
2. 「入庫管理」（CustomModule2）を選択
3. 「フィールド」（Fields）→ 「フィールドを追加」（Add Field）をクリック
4. 上記の3つのフィールドを順次追加
   - **注意**: API名が `field_service_kinds`, `field_work_orders`, `field_base_system_id` として設定されるか確認（連番形式の場合は、実際のAPI名をアプリ開発者に通知）
5. 各フィールドの設定を完了（表示名、データ型、選択肢など）

**代替案（フィールド追加が不可能な場合）**:
- Google Drive JSON管理方式を採用（詳細は2-2-1を参照）
- アプリ側でフィールド存在チェックを実装し、存在しない場合は自動的にGoogle Drive方式に切り替え

##### 2-2-4-2. 既存フィールドの確認事項

以下の既存フィールドが正しく設定されているか確認してください。

**CustomModule2（入庫管理）**:
- `field5`（工程ステージ）: PickList型。選択肢を確認し、アプリ側の`JobStage` enumと一致させること
  - **想定される選択肢**: 入庫済み, 見積作成待ち, 作業待ち, 出庫待ち, 出庫済み
  - **注意**: 実際のZoho CRMの選択肢が異なる場合は、Zoho CRM管理者と協議して調整
- `field4`（顧客名）: Lookup型。顧客モジュール（Contacts）への参照が正しく設定されていること
- `field6`（車両ID）: Lookup型。車両モジュール（CustomModule1）への参照が正しく設定されていること
- `field19`（お客様共有フォルダ）: URL型。JobフォルダのGoogle Drive URLを保存（`/customers/{customerId}/vehicles/{vehicleId}/jobs/{jobDate}_{jobId}/`）

**Contacts（顧客）モジュール**:
- `ID1`（顧客ID）: Text型。基幹システム（スマートカーディーラー）の顧客ID（例: K1001）が格納されていること
- `Business_Messaging_Line_Id`（LINE ID）: Text型。LINE連携時にアプリから書き込むため、編集可能であること

**CustomModule1（車両）モジュール**:
- `Name`（車両ID）: Text型。基幹システムの車両IDが格納されていること

##### 2-2-4-3. Googleスプレッドシートの設定

**マスタデータ用スプレッドシート**:
- スプレッドシート名: `整備工場DX_マスタデータ`（任意の名前で可）
- シート名: `車両マスタ`, `顧客マスタ`
- アクセス権限: アプリと同じGoogleアカウントで共有設定（**読み取り専用**）
- カラム名: 日本語カラム名を使用（例: `車両ID`, `登録番号`, `顧客ID`, `氏名`）
- **⚠️ 重要制約**: アプリからGoogle Sheets（マスタデータ）への**追加・編集・削除は絶対にしない**。マスタデータの更新は基幹システム（スマートカーディーラー）からのCSV/Excel経由のみ。

**スマートタグ管理用スプレッドシート**:
- スプレッドシート名: `スマートタグ管理`（任意の名前で可）
- シート名: `Tags`, `Sessions`
- アクセス権限: アプリと同じGoogleアカウントで共有設定（読み書き可能）
- 初期データ: Tagsシートに物理タグのマスタデータ（タグID: "01"～"20", QRコード, ステータス: "available"）を事前登録

**GAS（Google Apps Script）の設定**:
- スクリプト名: `マスタデータ同期GAS`（任意の名前で可）
- トリガー設定: Time-driven（5分ごと）またはonChangeイベント
- 監視フォルダ: Google Driveの所定フォルダ（例: `/repair-shop-dx/master-data/`）
- エラー通知: Gmail通知先の設定

##### 2-2-4-4. Google Driveのフォルダ構造

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
    /by-service/         # 作業種類別
    /by-vehicle-type/    # 車種別
    /before-after/       # Before/After別
```

**フォルダ共有設定**:
- `/repair-shop-dx/`: アプリと同じGoogleアカウントで共有設定（読み書き可能）
- `/repair-shop-dx/master-data/`: 事務員がCSV/Excelをアップロードできるよう共有設定
- `/repair-shop-dx/customers/`: アプリのみ（読み書き可能、アプリが自動生成）
- `/repair-shop-dx/blog-photos/`: ブログ担当者、アプリ（読み書き可能、ブログ担当者が参照）

##### 2-2-4-5. データクレンジング要件

**Pre-Phase 0で実施必須**:
1. **顧客IDフォーマット統一**: 基幹システム（スマートカーディーラー）の顧客IDとZoho CRMの`ID1`（顧客ID）のフォーマットが一致しているか確認
   - 不一致データの洗い出しと修正
   - データクレンジング完了報告書の作成

2. **車両IDフォーマット統一**: 基幹システムの車両IDとZoho CRMの`Name`（車両ID）のフォーマットが一致しているか確認

3. **工程ステージ選択肢確認**: Zoho CRMの`field5`（工程ステージ）PickListの選択肢を確認し、アプリ側の`JobStage` enumと一致させる

### 2-3. データフローの統一

**マスタデータの流れ（下り：Smart Car Dealer → App）**:
1. Export: 事務員が毎日、スマートカーディーラーからCSV/Excelで書き出し、Driveへアップロード
   - **運用頻度**: 毎日（通常は朝の業務開始前）
   - **タイミング**: データ更新の遅延を考慮し、アプリ側では前日までのデータを参照する前提
2. Import: GAS (Google Apps Script) がファイルを検知し、Google Sheetsに上書き展開
   - **トリガー**: Google Driveの所定フォルダ（例: `/repair-shop-dx/master-data/`）へのファイルアップロードを検知
   - **処理タイミング**: ファイルアップロード後、即座に処理（または5分ごとの定期チェック）
3. Read: Webアプリ（Next.js）は、このSheetsをAPI経由で参照
   - **キャッシュ戦略**: SWRを使用し、TTL（Time To Live）を1時間に設定
   - **再検証**: フォーカス時または5分ごとに自動再検証
   - **⚠️ 重要制約**: アプリからGoogle Sheets（マスタデータ）への**追加・編集・削除は絶対にしない**。読み取り専用として扱う。

**⚠️ 実装時の注意**:
- Google Sheets APIの読み取りメソッド（`spreadsheets.values.get`など）のみ使用
- 書き込みメソッド（`spreadsheets.values.update`, `spreadsheets.batchUpdate`など）は使用しない
- マスタデータの更新は基幹システム（スマートカーディーラー）からのCSV/Excel経由のみ

**GAS（Google Apps Script）の役割**:
- ファイル検知: Google Driveの所定フォルダを監視し、CSV/Excelファイルのアップロードを検知
  - **トリガー設定**: `onEdit` または `onChange` イベント、または `Time-driven` トリガー（5分ごと）
- データ変換: CSV/Excelファイルを読み込み、Google Sheetsの形式に変換
  - **ファイル形式検証**: CSV（UTF-8, Shift-JIS）またはExcel（.xlsx, .xls）形式を検証
  - **エンコーディング処理**: Shift-JISの場合はUTF-8に変換
- 上書き展開: 既存のGoogle Sheetsシートに上書き保存（車両マスタ、顧客マスタなど）
  - **シート名**: `車両マスタ`, `顧客マスタ`（日本語カラム名を維持）
  - **ヘッダー行**: 1行目をヘッダーとして扱い、2行目以降をデータとして上書き
- エラーハンドリング: ファイル形式エラー、データ不整合の検知と通知
  - **エラー通知**: Gmail経由で管理者に通知
  - **ログ記録**: Google Sheetsの別シート（`GAS_ログ`）にエラー内容を記録

**データ更新遅延の考慮**:
- マスタデータは「毎日朝に更新」されるため、アプリ側では前日までのデータを参照する前提
- 当日中に追加・変更された顧客・車両情報は、翌朝の更新まで反映されない
- 緊急時は事務員が手動でGoogle Sheetsを更新可能（ただし、基幹システムとの整合性に注意）

**データクレンジング要件**:
- **重要**: 開発前に、基幹システムの「顧客ID（例: K1001）」とZoho CRMの「ID1」のフォーマットが完全一致しているか確認すること
- **不一致時の対応**: データクレンジング（IDフォーマット統一）を実施してから開発を開始する
- **検証方法**: Google Sheetsの`顧客ID`カラムとZoho CRMの`ID1`フィールドを突合し、不一致がないか確認

**更新データの流れ（上り：App → Smart Car Dealer）**:
1. Input: 顧客が Webアプリで情報を入力（住所変更、新規車両など）
2. Pool: WebアプリはZoho CRM (Contacts) の `Description` (詳細情報) にデータを書き込む
   - 形式: 「【アプリ変更届】新住所：...」「【新規車両】車種名：...、車検証画像：...」など
3. Update: 事務員がZohoの変更通知を見て、**手動で**スマートカーディーラーの登録情報を修正する
   - 事務員がZoho CRMのDescriptionを確認
   - スマートカーディーラーで顧客・車両情報を手動で修正・登録
   - 新アプリの管理画面で「変更対応完了」ボタンを押す（Zoho CRMのDescriptionから【アプリ変更届】の文字列を削除）

**データ不整合時の対応（Human Middleware）**:

**設計思想**: 基幹システム（スマートカーディーラー）は「The Truth（絶対正）」として維持し、自動化によるリスクを回避するため、MVPでは人間が介在する運用とする。

**Human Middlewareの役割**:
- **責任範囲**: アプリから基幹システムへのデータ更新を手動で実施
- **処理タイミング**: 手が空いた時、または夕方の業務終了前
- **処理内容**: Zoho CRMのDescription（備考欄）を確認し、基幹システムで手動修正

**不整合の検知**:
- 新アプリの管理画面に「📝変更申請あり」アイコンを表示
- Zoho CRMのDescription（備考欄）に「【アプリ変更届】」の文字列が含まれる場合に表示

**対応手順**:
1. 事務員が新アプリの管理画面で「📝変更申請あり」アイコンを確認
2. Zoho CRMの該当顧客レコードを開き、Description（備考欄）を確認
   - 例: 「【アプリ変更届】新住所：大阪市...」「【新規車両】車種名：BMW X3、車検証画像：[URL]」
3. スマートカーディーラー（基幹システム）を開き、顧客・車両情報を手動で修正・登録
   - 住所変更: 顧客マスタの住所を更新
   - 電話番号変更: 顧客マスタの電話番号を更新
   - 新規車両: 車両マスタに新規登録（車検証画像は車両フォルダの`/documents/`から参照）
4. 新アプリの管理画面で「変更対応完了」ボタンを押す
   - Zoho CRMのDescriptionから【アプリ変更届】の文字列を削除
   - 「📝変更申請あり」アイコンを消灯

**自動消込の実装**:
```typescript
async function markChangeRequestCompleted(customerId: string): Promise<void> {
  // Zoho CRMのDescriptionから【アプリ変更届】の文字列を削除
  const customer = await getZohoCustomer(customerId);
  const updatedDescription = customer.Description?.replace(
    /【アプリ変更届】.*?\n/g,
    ''
  ) || '';
  
  await updateZohoCustomer(customerId, {
    Description: updatedDescription
  });
}
```

**注意事項**:
- この手動処理は「リスク回避」のための設計であり、将来的な自動化は検討しない（基幹システムの整合性を最優先）
- 事務員の負担を軽減するため、変更申請は1日1回まとめて処理する運用を推奨

### 2-4. 複数作業管理の実装

**背景**: 1つの入庫に対して複数の作業（車検、オイル交換、コーティングなど）を管理する必要がある

**実装方法**:
- **Zoho CRM拡張**: `field_service_kinds`（Multi-Select）で実施作業リストを管理
- **ワークオーダー管理**: `field_work_orders`（Multi-Line JSON）で各作業の詳細情報を管理
- **基幹システム連携**: `field_base_system_id`（Text）で基幹システムの入庫IDまたは伝票番号を管理

**作業追加フロー**:
```
1. 入庫時: 初期の入庫区分（例：車検）でJobレコードを作成
   - field_service_kinds: ["車検"]
   - field_work_orders: [{ id: "wo-001", serviceKind: "車検", status: "診断中", ... }]

2. 途中で作業を追加（例：オイル交換）
   - フロントスタッフまたはアドバイザーが「作業を追加」ボタンを押す
   - 作業種類を選択（オイル交換、コーティングなど）
   - field_service_kinds: ["車検", "エンジンオイル交換"]に更新
   - field_work_orders: [...既存..., { id: "wo-002", serviceKind: "エンジンオイル交換", status: "未開始", ... }]に追加

3. 各作業ごとの診断・見積・作業実施
   - 各作業ごとに独立して診断・見積・作業を実施
   - field_work_orders内の該当作業の情報を更新
```

**作業選択UI**:
- 診断・見積・作業画面に作業選択タブまたはドロップダウンを表示
- 選択された作業の情報のみを表示・編集
- 作業ごとのステータス（診断中、見積作成待ち、作業待ち、完了など）を管理

**各作業ごとのデータ管理**:
- 各ワークオーダーは独立した診断・見積・作業情報を持つ
- 診断情報: 各作業ごとの診断結果、写真・動画、コメント
- 見積情報: 各作業ごとの見積項目、金額
- 作業情報: 各作業ごとの作業記録、Before/After写真

---

## 3. 共通フローパターン

### 3-1. パターンA: 入庫→診断→見積→承認→作業

**適用入庫区分**:
- 車検
- 12ヵ月点検
- 故障診断
- 修理・整備
- チューニング・パーツ取付
- 板金・塗装
- レストア
- その他

**フロー**:
```
1. 入庫: 車両が入庫
2. 受付: フロントスタッフが受付処理
3. 診断: 整備士が診断を実施
4. 見積作成: フロントスタッフが見積もりを作成
5. 顧客承認: 顧客が見積もりを承認
6. 作業実施: 整備士が作業を実施
7. 引渡: フロントスタッフが顧客に引渡
```

### 3-2. パターンB: 事前見積→承認→入庫→診断→作業

**適用入庫区分**:
- エンジンオイル交換
- タイヤ交換・ローテーション
- その他のメンテナンス
- コーティング

**フロー**:
```
1. 事前見積: フロントスタッフが事前に見積もりを作成
2. 顧客承認: 顧客が見積もりを承認
3. 入庫: 車両が入庫
4. 受付: フロントスタッフが受付処理
5. 診断: 整備士が簡易診断を実施（必要に応じて）
6. 作業実施: 整備士が作業を実施
7. 引渡: フロントスタッフが顧客に引渡
```

### 3-3. 特殊フロー

**板金・塗装（外注管理）**:
```
1. 入庫: 車両が入庫
2. 診断: 損傷箇所の確認、Before写真・動画の撮影
3. 見積作成: 外注先からの見積もり回答を基に作成
4. 顧客承認: 顧客が見積もりを承認
5. 外注発注: 外注先に発注、車両を預ける
6. 外注作業: 外注先で作業実施（1-3カ月）
7. 引き取り: 外注先から車両を引き取る
8. 品質確認: 作業内容の確認、After写真の撮影
9. 引渡: フロントスタッフが顧客に引渡
```

**レストア（長期プロジェクト管理）**:
```
1. 入庫: 車両が入庫
2. 診断: 現状確認、修復箇所の確認、Before写真の撮影
3. 見積作成: 修復内容、部品、作業内容に基づいて作成
4. 顧客承認: 顧客が見積もりを承認
5. 作業実施: フェーズ管理（分解、診断・評価、部品発注、修復、組み立て、仕上げ、最終確認）
6. 引渡: フロントスタッフが顧客に引渡、PDF生成
```

---

## 4. 共通UI/UXコンポーネントライブラリ

### 4-1. 共通レイアウトパターン

#### 4-1-1. ページレイアウト

**基本構造**:
```
┌─────────────────────────────────────────┐
│ [←] タイトル                             │
│ 整備士: 中村（該当する場合）              │
├─────────────────────────────────────────┤
│ 📋 車両情報（自動入力済み・編集不可）     │
│ ┌─────────────────────────────────────┐ │
│ │ 登録番号: 堺 330 す 1669            │ │
│ │ 車台番号: VF3CUHNZTHY061316         │ │
│ │ 初度登録: H29.10                    │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [メインコンテンツエリア]                 │
│ （入庫区分ごとに動的に変化）              │
├─────────────────────────────────────────┤
│ [アクションボタンエリア]                 │
│ [一時保存] [完了]                        │
└─────────────────────────────────────────┘
```

#### 4-1-2. カードレイアウト

**共通カードコンポーネント**:
- セクションカード: 各セクションを区切るカード
- 項目カード: 各項目を表示するカード
- 進捗カード: 進捗状況を表示するカード

### 4-2. 共通コンポーネント

#### 4-2-1. 受付画面コンポーネント

**共通要素**:
- 車両情報表示（自動入力済み・編集不可）
- 走行距離入力
- 前回履歴表示
- 備考入力

**入庫区分別の拡張**:
- 車検: 車検証画像アップロード
- 板金・塗装: 事故案件情報、レッカー入庫、保険対応
- チューニング・パーツ取付: 種類選択（チューニング/パーツ取付）
- その他: 業務内容の種類・詳細入力

#### 4-2-2. 診断画面コンポーネント

**共通要素**:
- 車両情報表示（参照のみ）
- 受付情報表示（参照のみ）
- 診断項目入力
- 写真撮影（必要に応じて）
- コメント入力
- 一時保存・診断完了ボタン

**入庫区分別の拡張**:
- 車検・12ヵ月点検: カテゴリタブ、検査項目リスト、測定値入力、動画撮影（不具合項目のみ、最大15秒）
- エンジンオイル交換: 簡易検査項目（3項目）、動画撮影不要
- 故障診断: 症状カテゴリ、診断機利用、動画撮影（ケースバイケース、任意）、音声録音（異音カテゴリの場合）、エラーランプ管理（有無、種類）、緊急度管理（要検討、現時点ではコメント欄で明記）
- 板金・塗装: 損傷箇所確認、外注先への見積もり依頼、Before動画撮影（必須）、事故案件情報（事故か通常か、レッカー入庫、保険対応）、代車提供管理
- レストア: 現状確認、修復箇所確認、レストアの種類選択（フルレストア/部分レストア）、Before/After写真必須

#### 4-2-3. 見積画面コンポーネント

**共通要素**:
- 車両情報表示（参照のみ）
- 診断情報表示（参照のみ）
- 見積項目入力
- 見積合計表示
- 承認方法記録
- 見積もり確定ボタン

**複数作業管理対応**:
- 作業選択タブまたはドロップダウン: 実施予定の作業を選択
- 選択された作業の診断結果を表示
- 選択された作業の見積項目を入力・編集
- すべての作業の見積合計を自動計算
- 「作業を追加」ボタン: 途中で作業を追加可能

**基幹システム連携フロー**:
1. アドバイザーがWebアプリの見積作成画面を開く
2. 作業選択タブまたはドロップダウンで作業を選択
3. 選択された作業の診断結果を確認
4. **基幹システム（スマートカーディーラー）で該当作業の見積書を作成**（アドバイザーが実施）
5. **Webアプリに「品名」と「金額（税込）」を転記**（アドバイザーが実施）
6. field_work_orders内の該当作業の見積情報を更新
7. 他の作業についても同様の手順を繰り返し

**入庫区分別の拡張**:
- 車検・12ヵ月点検: 法定費用表示（自動取得）
- 12ヵ月点検: オプションメニュー機能（12ヶ月点検と同時実施で10%割引、8種類のメニュー）
- コーティング: コーティング種類選択、オプションサービス選択、同時施工割引
- 板金・塗装: 外注先からの見積もり回答表示、保険対応
- レストア: 部品リスト管理、追加作業管理、見積もり変更履歴

#### 4-2-4. 作業画面コンポーネント

**共通要素**:
- 車両情報表示（参照のみ）
- 見積もり内容表示（参照のみ）
- 作業記録入力
- Before/After写真撮影（必要に応じて）
- 作業時間記録
- 作業メモ入力
- 作業完了ボタン

**入庫区分別の拡張**:
- 車検・12ヵ月点検: 交換部品記録、測定値記録、動画撮影不要
- レストア: フェーズ管理、マイルストーン管理、進捗管理、部品取り寄せ状況
- 板金・塗装: 外注作業管理、引き取り・品質確認、After動画撮影（必須）

#### 4-2-5. 引渡画面コンポーネント

**共通要素**:
- 車両情報表示（参照のみ）
- 作業完了サマリー表示
- 実施した作業内容表示
- 引渡ボタン

**複数作業管理対応**:
- すべての完了した作業のサマリーを表示
- 各作業ごとの作業内容を表示
- 統合請求書の表示（請求書PDFがアップロード済みの場合）

**入庫区分別の拡張**:
- 車検・12ヵ月点検: PDF生成（分解整備記録簿）
- レストア: PDF生成（レストア完了報告書）、Before/After写真表示（必須）
- 板金・塗装: After写真表示（必須）、外注管理画面（外注発注、外注作業進捗管理、引き取り・品質確認）

#### 4-2-6. 請求書統合フロー

**基幹システムでの統合請求書作成**:
1. すべての作業完了: メカニックがすべての承認された作業を完了
   - field_work_orders内の各作業のステータスを「完了」に更新

2. 基幹システムで統合請求書を作成:
   - 事務員が基幹システム（スマートカーディーラー）を開く
   - field_base_system_idを参照して、基幹システムの入庫IDまたは伝票番号を確認
   - 基幹システムで、すべての完了したワークオーダーをまとめた統合請求書を作成
   - 例：車検（134,750円）+ オイル交換（10,560円）+ コーティング（50,000円）= 合計 195,310円

3. 請求書PDFをアップロード:
   - 基幹システムで作成した請求書PDFをPCに保存
   - ファイル名に「invoice」「seikyu」「請求書」のいずれかを含める（例：20251015_田中様_請求書.pdf）
   - 新アプリの管理画面から「請求書PDF登録」ボタンを押してアップロード
   - 請求書IDをfield_work_orders内のbaseSystemInvoiceIdに記録
   - 各ワークオーダーのbaseSystemItemIdも記録（基幹システムの明細ID）

4. 顧客への通知:
   - 請求書PDFがアップロードされたことを確認
   - 顧客に完了通知と請求書リンクを送信

**制約**:
- 請求書作成は基幹システムで実施（WebアプリはPDF表示のみ）
- 請求書PDFは必ずアプリ経由でアップロード（直接Google Driveに置かない）

#### 4-2-7. 顧客向け進捗通知機能

**目的**: 顧客が「今、車がどの状態か」を知りたいという期待に応え、待機ストレスを軽減する。

**通知チャネル**:

| チャネル | 対象顧客 | 実装方法 | 優先度 |
| --- | --- | --- | --- |
| LINE | LINE連携済み顧客 | LINE Messaging API | 高（Phase 2） |
| SMS | LINE未連携の顧客 | Twilio または AWS SNS | 中（Phase 3） |
| メール | フォールバック | Zoho CRM連携 | 低（既存機能） |

**通知タイミングとメッセージ**:

| イベント | 通知タイミング | メッセージ例 |
| --- | --- | --- |
| 入庫完了 | 受付完了時 | 「🚗 お預かりしました。診断を開始します」 |
| 診断完了 | 診断完了時 | 「🔍 診断が完了しました。お見積りを準備中です」 |
| 見積送付 | 見積送信時 | 「📋 お見積りをお送りしました。ご確認ください [リンク]」 |
| 作業開始 | 作業開始時 | 「🔧 作業を開始しました」 |
| 作業完了 | 作業完了時 | 「✅ 作業が完了しました。お引き取りをお待ちしております」 |
| 引き取り可能 | 請求書登録時 | 「🎉 お車の準備が整いました。ご来店をお待ちしております [請求書リンク]」 |

**LINE通知の実装**:
```typescript
interface LineNotification {
  customerId: string;
  lineUserId: string;
  templateId: string;
  variables: Record<string, string>;
}

// 通知テンプレート
const templates = {
  RECEPTION_COMPLETE: {
    type: "text",
    text: "🚗 {{customerName}}様\n\nお車をお預かりしました。\n車種: {{vehicleName}}\n\n診断を開始いたします。結果が出次第ご連絡いたします。",
  },
  ESTIMATE_READY: {
    type: "template",
    altText: "お見積りが完成しました",
    template: {
      type: "buttons",
      text: "📋 お見積りが完成しました\n\n合計: ¥{{totalAmount}}",
      actions: [
        { type: "uri", label: "見積を確認する", uri: "{{estimateUrl}}" },
      ],
    },
  },
  WORK_COMPLETE: {
    type: "text",
    text: "✅ {{customerName}}様\n\n{{vehicleName}}の作業が完了いたしました。\n\nご来店の際は、お気軽にお問い合わせください。\n📞 06-XXXX-XXXX",
  },
};
```

**SMS通知の実装**:
```typescript
interface SmsNotification {
  phoneNumber: string;
  message: string;
  jobId: string;
}

// SMSはテキストのみ、160文字以内
const smsTemplates = {
  RECEPTION_COMPLETE: "【YM WORKS】お車をお預かりしました。診断を開始します。",
  ESTIMATE_READY: "【YM WORKS】お見積りが完成しました。詳細: {{shortUrl}}",
  WORK_COMPLETE: "【YM WORKS】作業が完了しました。お引き取りをお待ちしております。",
};
```

**通知設定（顧客別）**:
```typescript
interface CustomerNotificationPreference {
  customerId: string;
  /** 通知を受け取るか */
  enabled: boolean;
  /** 優先チャネル */
  preferredChannel: "line" | "sms" | "email";
  /** 通知頻度（全て / 重要のみ） */
  frequency: "all" | "important_only";
}
```

**通知履歴の管理**:
- 送信日時、チャネル、メッセージ内容を記録
- 開封/クリックトラッキング（LINEのみ）
- 配信失敗時のリトライ（最大3回）

**実装フェーズ**:
- **Phase 2**: LINE通知の基本実装（見積送付、作業完了）
- **Phase 3**: SMS対応、通知設定画面
- **Phase 5**: 進捗のリアルタイム表示（顧客ポータル）

#### 4-2-8. ブログ用写真の管理機能

**目的**: ブログ担当者が記事に使用する写真を探しやすくする

**フォルダ構造**:
```
/blog-photos/
  /by-date/            # 日付別（年月→日付の階層）
    /YYYYMM/
      /YYYYMMDD/
  /by-service/         # 作業種類別（車検、オイル交換など）
    /車検/
    /12ヵ月点検/
    /オイル交換/
    ...
  /by-vehicle-type/    # 車種別（BMW、メルセデスなど）
    /BMW/
    /メルセデス/
    ...
  /before-after/       # Before/After別
    /before/
    /after/
```

**ファイル命名規則**: `{日付}_{車種}_{作業種類}_{種類}_{連番}.{拡張子}`
- 例: `20250115_BMW_X3_車検_before_001.jpg`
- 例: `20250115_BMW_X3_オイル交換_after_001.jpg`

**要素の説明**:
| **要素** | **形式** | **例** | **備考** |
| --- | --- | --- | --- |
| 日付 | `YYYYMMDD` | `20250115` | 撮影日または入庫日 |
| 車種 | `{メーカー}_{車種}` | `BMW_X3` | スペースはアンダースコアに変換 |
| 作業種類 | `{入庫区分}` | `車検`, `オイル交換`, `コーティング` | 12種類の入庫区分 |
| 種類 | `before`, `after`, `diagnosis`, `work` | `before`, `after` | 写真の種類 |
| 連番 | `{3桁連番}` | `001`, `002` | 同じ条件の写真が複数ある場合 |

**ワークフロー**:
1. **作業完了後**: アプリの作業完了画面で写真一覧を表示
2. **写真選択**: 整備士またはフロントスタッフが「ブログ用に良い写真」を選択
3. **「ブログ用に公開」ボタン**: 選択した写真にチェックを付けて公開
4. **自動コピー処理**: 
   - 元の写真は作業記録として残す（削除しない）
   - ブログ用フォルダに複数の分類でコピー:
     - `/blog-photos/by-date/YYYYMM/YYYYMMDD/`
     - `/blog-photos/by-service/{作業種類}/`
     - `/blog-photos/by-vehicle-type/{メーカー}/`
     - `/blog-photos/before-after/{種類}/`
   - ファイル名を自動的にリネーム（命名規則に従う）
5. **メタデータの記録**: JSONファイルに「ブログ用に公開済み」フラグを記録
6. **ブログ担当者が確認**: Google Driveで`/blog-photos/`フォルダにアクセスし、目的に応じて分類フォルダから写真を探す

**アプリ側の実装**:
- 作業完了画面に「ブログ用に公開」機能を追加
- 写真選択UI（チェックボックスで複数選択可能）
- 自動コピー処理（複数の分類フォルダに同時にコピー）
- ファイル名の自動リネーム（命名規則に従う）

**ブログ担当者向けの使い方**:
- **日付で探す**: `/blog-photos/by-date/202501/20250115/`
- **作業種類で探す**: `/blog-photos/by-service/車検/`
- **車種で探す**: `/blog-photos/by-vehicle-type/BMW/`
- **Before/Afterで探す**: `/blog-photos/before-after/after/`

### 4-3. 状態管理パターン

**共通状態管理**:
- Jobステータス管理: `入庫待ち` → `入庫済み` → `見積作成待ち` → `見積提示済み` → `作業待ち` → `出庫待ち` → `出庫済み`
  - **注意**: 実際のZoho CRM `field5` PickListの選択肢を確認すること。元の仕様書では「入庫済み / 見積作成待ち / 作業待ち / 出庫待ち / 出庫済み」と記載されているが、型定義（`src/types/index.ts`）では「入庫待ち」「見積提示済み」も追加されている。
  - **実装前確認**: Zoho CRM管理者に `field5` PickListの実際の選択肢一覧を確認し、存在しない選択肢を使用しないこと。
- ワークオーダーステータス管理: 各作業ごとのステータス管理（`未開始` → `診断中` → `見積作成待ち` → `顧客承認待ち` → `作業待ち` → `作業中` → `完了`）
  - **注意**: ワークオーダーステータスはアプリ側で管理し、Zoho CRMには保存しない（`field_work_orders` JSON内に含める）
- データ保存: 自動保存（30秒ごと、または項目変更時）

### 4-4. エラーハンドリングUI

**共通エラーハンドリング**:
- ネットワークエラー: オフライン時はローカルストレージに保存、オンライン時に自動同期
- 保存エラー: エラーメッセージを表示、再試行ボタンを表示
- バリデーションエラー: リアルタイムで異常値をチェック、エラーメッセージを表示

### 4-5. オフライン対応UI設計

**背景**: 工場内はWiFi環境が不安定な場合があり、整備士がピット内で作業中にネットワーク接続が途切れる可能性がある。

#### 4-5-1. オフライン状態の視覚的フィードバック

**オフラインバナー**:
```
┌─────────────────────────────────────────┐
│ ⚠️ オフライン中 - データは自動保存されます  │
└─────────────────────────────────────────┘
```
- 画面上部に固定表示（高さ: 40px、背景色: `amber-100`、テキスト色: `amber-800`）
- オンライン復帰時は自動的に非表示
- タップで詳細モーダル（未同期データ数、最終同期時刻）を表示

**同期状態インジケーター**:
| 状態 | アイコン | 色 | 説明 |
| --- | --- | --- | --- |
| 同期済み | ✓ | `green-600` | すべてのデータがサーバーと同期済み |
| 同期中 | 🔄 | `blue-600` | データを同期中（アニメーション） |
| 未同期 | ⬆️ | `amber-600` | ローカルに未送信のデータあり |
| 同期エラー | ❌ | `red-600` | 同期に失敗したデータあり |

**各入力フィールドの保存状態表示**:
```typescript
interface FieldSyncStatus {
  status: "saved" | "saving" | "pending" | "error";
  lastSavedAt?: Date;
  errorMessage?: string;
}
```

#### 4-5-2. オフラインデータ管理

**ローカルストレージ構造**:
```typescript
interface OfflineDataStore {
  /** 未同期の変更データ */
  pendingChanges: PendingChange[];
  /** キャッシュされたJobデータ */
  cachedJobs: Record<string, ZohoJob>;
  /** キャッシュされたマスタデータ */
  cachedMasterData: {
    vehicles: VehicleMaster[];
    customers: CustomerMaster[];
    lastUpdated: Date;
  };
  /** 未アップロードのファイル（Base64） */
  pendingFiles: PendingFile[];
}

interface PendingChange {
  id: string;
  resourceType: "job" | "workOrder" | "diagnosis" | "estimate" | "work";
  resourceId: string;
  operation: "create" | "update" | "delete";
  data: any;
  createdAt: Date;
  retryCount: number;
}

interface PendingFile {
  id: string;
  workOrderId: string;
  fileType: "photo" | "video" | "pdf";
  base64Data: string;
  fileName: string;
  createdAt: Date;
}
```

**ストレージ容量管理**:
- **最大容量**: 50MB（LocalStorage + IndexedDB）
- **容量警告**: 40MB超過時に警告表示
- **自動削除**: 古いキャッシュデータから順次削除（LRU方式）
- **写真/動画**: 圧縮後も10枚以上の未送信がある場合は警告

#### 4-5-3. オンライン復帰時の同期処理

**同期優先順位**:
1. **高優先**: 診断完了、見積確定、作業完了のステータス変更
2. **中優先**: 写真・動画のアップロード
3. **低優先**: 一時保存データ、コメント追加

**同期処理フロー**:
```
1. オンライン復帰を検知（navigator.onLine）
2. 未同期データの一覧を取得
3. 優先順位に従って順次同期
4. 同期進捗をトースト通知で表示
5. 全件同期完了後、成功バナーを表示
```

**同期進捗表示**:
```
┌─────────────────────────────────────────┐
│ 🔄 同期中: 5/12 件完了                    │
│ ████████░░░░░░░░░░░░ 42%                │
└─────────────────────────────────────────┘
```

#### 4-5-4. コンフリクト解決UI

**コンフリクト発生条件**:
- オフライン中に編集したデータが、他のユーザーによって既に更新されている場合

**コンフリクト解決モーダル**:
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ データの競合が発生しました                          │
├─────────────────────────────────────────────────────┤
│ 項目: 診断コメント                                    │
│                                                      │
│ ┌─────────────────┐  ┌─────────────────┐            │
│ │ あなたの変更      │  │ サーバーの最新    │            │
│ ├─────────────────┤  ├─────────────────┤            │
│ │ パッド残2mm     │  │ パッド残1.5mm   │            │
│ │ 交換推奨        │  │ 即交換必要      │            │
│ └─────────────────┘  └─────────────────┘            │
│                                                      │
│ [自分の変更を適用] [サーバーの内容を採用] [両方を保持]  │
└─────────────────────────────────────────────────────┘
```

**解決オプション**:
1. **自分の変更を適用**: ローカルの変更でサーバーを上書き
2. **サーバーの内容を採用**: ローカルの変更を破棄
3. **両方を保持**: コメントを結合して保存（タイムスタンプ付き）

**自動解決ルール**:
- **写真追加**: 両方を保持（結合）
- **ステータス変更**: サーバー側を優先（より新しいステータス）
- **測定値**: コンフリクトモーダルを表示（手動解決）

#### 4-5-5. オフラインモードでの機能制限

**オフライン時に利用可能な機能**:
- ✅ 診断項目の入力・編集
- ✅ 写真・動画の撮影（ローカル保存）
- ✅ コメント入力
- ✅ 見積項目の入力（ローカル保存）
- ✅ 作業記録の入力

**オフライン時に利用不可な機能**:
- ❌ 顧客への見積送信（LINEメッセージ）
- ❌ PDF生成・ダウンロード
- ❌ 顧客マスタ・車両マスタの検索（キャッシュ内のみ可）
- ❌ 請求書PDFのアップロード

**オフライン時の警告表示**:
```typescript
// オフライン時に利用不可な機能を実行しようとした場合
toast.warning("この機能はオンライン時のみ利用可能です。ネットワーク接続を確認してください。");
```

---

## 5. スマートタグ管理システム

### 5-1. システム概要

**目的**: 物理タグ（カラビナ付きタグ）とデジタルデータ（Zoho Job ID）を結合し、工場内での車両識別を効率化する。

**インフラ**: Googleスプレッドシートを利用（マスタデータと同じGoogle Sheets APIを使用）

### 5-2. データ構造（Googleスプレッドシート）

**Tagsシート**（物理タグのマスタ）:
| カラム名 | データ型 | 説明 |
| --- | --- | --- |
| タグID | Text | 物理タグID（"01", "02", ..., "20"） |
| QRコード | Text | QRコードの値 |
| ステータス | Text | タグの状態（available, in_use, closed） |
| 作成日時 | DateTime | 作成日時 |
| 更新日時 | DateTime | 更新日時 |

**Sessionsシート**（タグとJobの紐付け履歴）:
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

**スプレッドシートの設定**:
- スプレッドシート名: `スマートタグ管理`
- Tagsシート名: `Tags`
- Sessionsシート名: `Sessions`
- アクセス権限: アプリと同じGoogleアカウントで共有設定

### 5-3. タグのライフサイクル管理

**ステータス遷移**:
```
available → in_use → closed
```

**紐付け処理**:
```typescript
async function linkTagToJob(tagId: string, jobId: string): Promise<void> {
  // 1. 該当タグの既存アクティブセッションを全て closed に更新
  const activeSessions = await getActiveSessionsByTagId(tagId);
  for (const session of activeSessions) {
    await updateSession(session.sessionId, {
      status: 'closed',
      unlinkedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  // 2. タグのステータスを in_use に更新
  await updateTag(tagId, {
    status: 'in_use',
    updatedAt: new Date().toISOString()
  });
  
  // 3. 新しいセッションを作成
  const sessionId = generateUUID();
  await createSession({
    sessionId,
    tagId,
    jobId,
    linkedAt: new Date().toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}
```

**タグ解除処理**:
```typescript
async function unlinkTag(tagId: string): Promise<void> {
  // 1. アクティブセッションを closed に更新
  const activeSessions = await getActiveSessionsByTagId(tagId);
  for (const session of activeSessions) {
    await updateSession(session.sessionId, {
      status: 'closed',
      unlinkedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  // 2. タグのステータスを available に更新
  await updateTag(tagId, {
    status: 'available',
    updatedAt: new Date().toISOString()
  });
}
```

**注意事項**:
- Googleスプレッドシートは同時編集の制約があるため、排他制御はアプリ側で実装（SWRキャッシュと楽観的更新を組み合わせ）
- 大量の同時アクセスが発生する場合は、バッチ処理やキューイングを検討

### 5-4. タグの特定方法

**方法A（推奨）**: 画面上のタグ番号ボタンをタップ
- アプリ画面に「空いているタグ一覧（01, 02, 05...）」がボタンとして表示
- カメラ起動不要で最速

**方法B（確実）**: QRコードスキャン
- [QR Scan] ボタンを押し、タグのQRコードを読み取る
- 目視確認ミスを防ぎたい場合に使用

### 5-5. タグの再利用

**重要**: タグNo.05は「使い回し」です。同一タグが複数のJobに紐付けられる可能性があるため、セッション管理が必須です。

**排他制御**:
- 新しいJobに紐付ける際は、必ず既存のアクティブセッションを `closed` に更新
- トランザクション処理により、同時更新を防止

---

## 6. データモデル統合

### 6-1. 統一データモデル

**基本Jobモデル**:
```typescript
export interface BaseJob {
  /** Job ID */
  jobId: string;
  /** 入庫区分 */
  serviceKind: ServiceKind;
  /** 車両情報 */
  vehicle: {
    vehicleId: string;
    mileage: number;
  };
  /** ステータス */
  status: JobStatus;
  /** ワークオーダーリスト */
  workOrders: WorkOrder[];
}
```

**ワークオーダーモデル**:
```typescript
export interface WorkOrder {
  /** ワークオーダーID */
  id: string;
  /** 入庫区分 */
  serviceKind: ServiceKind;
  /** ステータス */
  status: WorkOrderStatus;
  /** 診断情報 */
  diagnosis?: DiagnosisData;
  /** 見積情報 */
  estimate?: EstimateData;
  /** 作業情報 */
  work?: WorkData;
  /** 基幹システム明細ID */
  baseSystemItemId?: string;
  /** 費用 */
  cost?: number;
}
```

### 5-2. 入庫区分別の拡張モデル

各入庫区分は、基本Jobモデルを拡張して独自のデータ構造を定義します。

**例: 車検ジョブ**:
```typescript
export interface VehicleInspectionJob extends BaseJob {
  serviceKind: "車検";
  workOrders: VehicleInspectionWorkOrder[];
}

export interface VehicleInspectionWorkOrder extends WorkOrder {
  serviceKind: "車検";
  diagnosis: {
    inspectionResults: InspectionResult[];
    measurements: MeasurementData[];
    photos: Photo[];
  };
  estimate: {
    legalFees: number;
    parts: PartItem[];
    labor: number;
    total: number;
  };
  work: {
    replacedParts: PartItem[];
    measurements: MeasurementData[];
    photos: Photo[];
  };
}
```

### 6-3. マスタデータ連携モデル

**車両マスタ**:
```typescript
export interface VehicleMaster {
  vehicleId: string;
  customerId: string;
  licensePlate: string;
  vehicleName: string;
  model: string;
  inspectionExpiry: Date;
  nextInspectionDate: Date;
  weight?: number; // 法定費用計算用
}
```

**顧客マスタ**:
```typescript
export interface CustomerMaster {
  customerId: string;
  customerName: string;
  address: string;
  phone: string;
  mobile: string;
}
```

---

## 6. Zoho CRM API制約とエラーハンドリング

### 6-1. Zoho APIの制約

#### 6-1-1. Lookupフィールドの更新方法

**制約**: `field4`（顧客名Lookup）、`field6`（車両ID Lookup）の更新は、参照先レコードIDを指定する必要がある。

**実装例**:
```typescript
// Lookupフィールドの更新
interface ZohoLookupUpdate {
  id: string;  // 参照先レコードのID（必須）
}

// 顧客名の更新
await updateZohoJob(jobId, {
  field4: { id: "cust-001", name: "田中 太郎" }  // nameは表示用、idが必須
});

// 車両IDの更新
await updateZohoJob(jobId, {
  field6: { id: "veh-001", name: "BMW X3" }  // nameは表示用、idが必須
});
```

**エラーハンドリング**:
- 参照先レコードIDが存在しない場合: `404 NOT_FOUND` エラー
- Lookupフィールドに不正な形式で更新しようとした場合: `400 BAD_REQUEST` エラー

#### 6-1-2. Multi-Lineフィールドのサイズ制限

**制約**: Zoho CRMのMulti-Lineフィールドには容量制限（約64KB）がある。

**対策**: 
- `field_work_orders`（Multi-Line JSON）には基本情報とURL参照のみ保存（詳細はGoogle Drive JSONファイル）
- 実装前にZoho CRM管理者に実際のサイズ制限を確認すること

#### 6-1-3. Uploadフィールドの制限

**制約**: `field12`（関連ファイル、Upload型）のアップロード可能なファイル数、サイズ制限。

**確認事項**:
- 1レコードあたりのアップロード可能ファイル数
- 1ファイルあたりの最大サイズ
- 対応ファイル形式（画像、PDF等）

**実装時の注意**:
- 車検証は**車両フォルダの`/documents/`に保存**（`/customers/{customerId}/vehicles/{vehicleId}/documents/shaken_{vehicleId}_{日付}.pdf`）
- 新しい車検証がアップロードされたら、既存の最新版を`shaken_history/`に移動
- Zoho CRMの`field12`（関連ファイル）には最新版のURLを保存（または参照）
- 複数ファイルが必要な場合は、Google Driveに保存し、`field19`（お客様共有フォルダ）にJobフォルダのURLを記録

#### 6-1-4. APIレート制限

**制約**: Zoho CRM APIにはレート制限がある（通常、1分あたり100リクエスト程度）。

**対策**:
- **SWRキャッシュ**: マスタデータ、Job一覧などはSWRでキャッシュし、不要なAPI呼び出しを削減
- **バッチ処理**: 複数の更新を1つのAPI呼び出しにまとめる（可能な場合）
- **リトライ戦略**: レート制限エラー（429 Too Many Requests）時は指数バックオフでリトライ

**実装例**:
```typescript
import useSWR from 'swr';

// SWRキャッシュ設定
const swrConfig = {
  revalidateOnFocus: false,  // フォーカス時の自動再検証を無効化
  revalidateOnReconnect: true,  // 再接続時のみ再検証
  dedupingInterval: 2000,  // 2秒以内の重複リクエストを統合
  refreshInterval: 0,  // ポーリングを無効化（必要に応じて設定）
};

// Job一覧の取得（キャッシュあり）
const { data: jobs, mutate } = useSWR(
  `/api/jobs?date=${today}`,
  fetcher,
  swrConfig
);
```

### 6-2. エラーハンドリング

#### 6-2-1. Zoho APIエラー時のリトライ戦略

**エラー種別と対応**:

| エラーコード | HTTPステータス | 対応方法 |
| --- | --- | --- |
| RATE_LIMIT_EXCEEDED | 429 | 指数バックオフでリトライ（最大3回） |
| INVALID_TOKEN | 401 | 認証トークンの再取得 |
| INVALID_DATA | 400 | リクエストデータの検証、エラーメッセージ表示 |
| NOT_FOUND | 404 | リソースが存在しない旨をユーザーに通知 |
| INTERNAL_ERROR | 500 | ログ記録、ユーザーにエラーメッセージ表示、手動リトライ |

**リトライ実装例**:
```typescript
async function callZohoAPIWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // レート制限エラーの場合のみリトライ
      if (error.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 指数バックオフ: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // その他のエラーは即座にthrow
      throw error;
    }
  }
  
  throw lastError;
}
```

#### 6-2-2. フィールドが存在しない場合のエラー処理

**問題**: 新規フィールド（`field_service_kinds`, `field_work_orders`, `field_base_system_id`）がZoho CRMに存在しない場合、API呼び出しが失敗する。

**対策**:
1. **実装前検証**: Zoho CRM管理者にフィールド追加を依頼し、追加完了を確認
2. **エラーハンドリング**: フィールドが存在しない場合のエラーメッセージを明確に表示
3. **フォールバック**: フィールドが存在しない場合は、代替方法（既存フィールドの組み合わせ、Google Drive JSON管理）を使用

**実装例**:
```typescript
async function updateWorkOrders(jobId: string, workOrders: WorkOrder[]): Promise<void> {
  try {
    await updateZohoJob(jobId, {
      field_work_orders: JSON.stringify({ workOrders })
    });
  } catch (error: any) {
    if (error.code === 'INVALID_DATA' && error.message.includes('field_work_orders')) {
      // フィールドが存在しない場合のフォールバック
      console.error('field_work_ordersが存在しません。Zoho CRM管理者にフィールド追加を依頼してください。');
      // 代替方法: Google Drive JSONファイルとして保存
      await saveWorkOrdersToDrive(jobId, workOrders);
    } else {
      throw error;
    }
  }
}
```

#### 6-2-3. Lookup参照先が存在しない場合のエラー処理

**問題**: `field4`（顧客名Lookup）、`field6`（車両ID Lookup）の参照先レコードが存在しない場合、エラーが発生する。

**対策**:
1. **事前検証**: Lookupフィールドを更新する前に、参照先レコードの存在を確認
2. **エラーメッセージ**: 「顧客が見つかりません」「車両が見つかりません」と明確に表示
3. **データ整合性**: マスタデータ（Google Sheets）とZoho CRMの整合性を定期的に確認

**実装例**:
```typescript
async function linkVehicleToJob(jobId: string, vehicleId: string): Promise<void> {
  // 1. 車両レコードの存在確認
  const vehicle = await getZohoVehicle(vehicleId);
  if (!vehicle) {
    throw new Error(`車両ID ${vehicleId} が見つかりません。Zoho CRM管理者に確認してください。`);
  }
  
  // 2. Lookupフィールドを更新
  await updateZohoJob(jobId, {
    field6: { id: vehicle.id, name: vehicle.name }
  });
}
```

---

## 7. API設計統一

### 6-1. RESTful API設計原則

**エンドポイント命名規則**:
- リソース名は複数形: `/api/jobs`, `/api/work-orders`
- ネストされたリソース: `/api/jobs/[id]/work-orders`
- アクションは動詞: `/api/jobs/[id]/check-in`, `/api/jobs/[id]/complete`

### 6-2. 統一リクエスト/レスポンス形式

**リクエスト形式**:
```typescript
// GET /api/jobs/[id]
// リクエストボディ: なし

// POST /api/jobs/[id]/reception
{
  mileage: number;
  // 入庫区分別の拡張フィールド
}
```

**レスポンス形式**:
```typescript
// 成功レスポンス
{
  success: boolean;
  data: Job | WorkOrder | ...;
}

// エラーレスポンス
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### 6-3. 統一エラーハンドリング

**エラーコード**:
- `VALIDATION_ERROR`: バリデーションエラー
- `NOT_FOUND`: リソースが見つからない
- `UNAUTHORIZED`: 認証エラー
- `FORBIDDEN`: 権限エラー
- `INTERNAL_ERROR`: 内部サーバーエラー

---

## 7. 画面遷移フロー統一

### 7-1. 共通画面遷移図

```
[TOP画面]
  ↓
[受付画面] (入庫確定)
  ↓
[診断画面] (診断完了)
  ↓
[見積画面] (見積もり確定)
  ↓
[顧客承認画面] (承認)
  ↓
[作業画面] (作業完了)
  ↓
[引渡画面] (引渡完了)
```

### 7-2. 状態遷移管理

**Jobステータス遷移（Zoho CRM field5）**:
```
入庫待ち → 入庫済み → 見積作成待ち → 見積提示済み → 作業待ち → 出庫待ち → 出庫済み
```
- **実装前確認**: 上記の選択肢が実際のZoho CRM `field5` PickListに存在するか確認すること。存在しない場合は、Zoho CRM管理者に新規選択肢の追加を依頼するか、既存の選択肢で代替する。

**ワークオーダーステータス遷移（アプリ側管理）**:
```
未開始 → 診断中 → 見積作成待ち → 顧客承認待ち → 作業待ち → 作業中 → 完了
```
- **注意**: ワークオーダーステータスはZoho CRMのPickListではなく、アプリ側で管理する（`field_work_orders` JSON内の`status`フィールド）

### 7-3. ナビゲーション設計

**共通ナビゲーション**:
- 戻るボタン: 前の画面に戻る
- ホームボタン: TOP画面に戻る
- 進捗表示: 現在のステップを表示

---

## 8. UI/UXガイドライン

### 8-1. デザインシステム

**カラーパレット**:
- プライマリ: `slate-900` (メインアクション)
- セカンダリ: `slate-600` (サブアクション)
- 成功: `green-600` (完了・承認)
- 警告: `amber-600` (注意・保留)
- エラー: `red-600` (エラー・却下)
- 情報: `blue-600` (情報表示)

**タイポグラフィ**:
- 見出し: `text-xl font-semibold` (h1), `text-lg font-medium` (h2)
- 本文: `text-base` (標準), `text-sm` (補助)
- ラベル: `text-sm font-medium`

**スペーシング**:
- セクション間: `space-y-6`
- 項目間: `space-y-4`
- コンポーネント内: `space-y-2`

### 8-2. アクセシビリティ

**WCAG 2.1 AA準拠**:
- コントラスト比: 4.5:1以上（本文）、3:1以上（UIコンポーネント）
- キーボード操作: すべての機能をキーボードで操作可能
- スクリーンリーダー: 適切なARIAラベルを設定

**カラーユニバーサルデザイン（色覚多様性対応）**:

色覚特性を持つユーザー（日本人男性の約5%、女性の約0.2%）でも正確に情報を認識できるよう、色だけに依存しない設計を採用する。

**診断結果の状態表示（信号機方式の改良）**:

| 状態 | 色 | 形状 | アイコン | テキスト |
| --- | --- | --- | --- | --- |
| 正常 | `green-600` | ● 丸 | ✓ チェック | 「正常」 |
| 注意 | `amber-600` | ▲ 三角 | ⚠ 警告 | 「注意」 |
| 要交換 | `red-600` | ■ 四角 | ✕ バツ | 「要交換」 |
| 未点検 | `gray-400` | ○ 白丸 | − ハイフン | 「未点検」 |

**実装例**:
```typescript
// StatusIndicator コンポーネント
interface StatusIndicatorProps {
  status: "正常" | "注意" | "要交換" | "未点検";
}

const statusConfig = {
  "正常": { color: "green-600", shape: "circle", icon: "✓", label: "正常" },
  "注意": { color: "amber-600", shape: "triangle", icon: "⚠", label: "注意" },
  "要交換": { color: "red-600", shape: "square", icon: "✕", label: "要交換" },
  "未点検": { color: "gray-400", shape: "circle-outline", icon: "−", label: "未点検" },
};

// 色 + 形状 + アイコン + テキストの4重表現で確実に伝達
<StatusIndicator status="要交換" />
// → 赤い四角 + ✕アイコン + 「要交換」テキスト
```

**ボタン・リンクの識別**:
- 色だけでなく下線や枠線でクリック可能であることを示す
- ホバー時は明確な視覚変化（影、拡大）を追加
- フォーカス時は2pxの黒い枠線を表示

**グラフ・チャートの配色**:
- 色だけでなくパターン（ストライプ、ドット）を併用
- 凡例には色見本と共にテキストラベルを必ず表示

**テスト方法**:
- Chromeの「色覚シミュレーター」拡張機能で検証
- 対象: P型（赤色覚異常）、D型（緑色覚異常）、T型（青色覚異常）
- 全画面でシミュレーション確認を実施

**フォントサイズの可変設定**:
- 最小フォントサイズ: 14px（高齢者・視力が弱いユーザー向け）
- ブラウザのズーム機能（200%）でもレイアウト崩れなし
- 将来実装: ユーザー設定でフォントサイズを選択可能（小・中・大）

### 8-3. パフォーマンス

**最適化方針**:
- 画像圧縮: クライアント側で500KB以下に圧縮
- データキャッシュ: SWRを使用した適切なキャッシュ戦略
- コード分割: 動的インポートによるコード分割

### 8-4. ローディング状態とフィードバックUI

**設計目的**: ユーザーがシステムの状態を常に把握でき、操作の結果を即座に認識できるようにする。

#### 8-4-1. ローディング状態の表示

**スケルトンUI（Skeleton Loading）**:
- 画面読み込み中は、実際のコンテンツと同じ形状のグレーのプレースホルダーを表示
- コンテンツが読み込まれ次第、スムーズに置換（フェードイン）

```typescript
// スケルトンコンポーネント例
<Card>
  {isLoading ? (
    <>
      <Skeleton className="h-6 w-48 mb-2" /> {/* タイトル */}
      <Skeleton className="h-4 w-32 mb-4" /> {/* サブタイトル */}
      <Skeleton className="h-20 w-full" />   {/* コンテンツ */}
    </>
  ) : (
    <ActualContent data={data} />
  )}
</Card>
```

**ローディングインジケーター種別**:

| 種別 | 用途 | 表示 |
| --- | --- | --- |
| スケルトン | 初期画面読み込み | グレーのプレースホルダー |
| スピナー | ボタン押下後の処理中 | 回転するアイコン |
| プログレスバー | ファイルアップロード | 進捗率を数値で表示 |
| オーバーレイ | 画面全体の処理中 | 半透明背景 + スピナー |

**ボタンのローディング状態**:
```typescript
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner className="mr-2 h-4 w-4 animate-spin" />
      保存中...
    </>
  ) : (
    "保存"
  )}
</Button>
```

#### 8-4-2. トースト通知（Toast Notification）

**用途**: 操作結果のフィードバックを非侵入的に表示

**種別と表示**:

| 種別 | 色 | アイコン | 表示時間 | 用途例 |
| --- | --- | --- | --- | --- |
| 成功 | `green-600` | ✓ | 3秒 | 保存完了、送信完了 |
| エラー | `red-600` | ✕ | 5秒（手動で閉じる） | 保存失敗、バリデーションエラー |
| 警告 | `amber-600` | ⚠ | 4秒 | オフライン検知、入力漏れ |
| 情報 | `blue-600` | ℹ | 3秒 | ステータス変更通知 |

**表示位置**: 画面右下（モバイル: 画面下部中央）

**実装例**:
```typescript
// 成功トースト
toast.success("診断結果を保存しました");

// エラートースト（詳細付き）
toast.error("保存に失敗しました", {
  description: "ネットワーク接続を確認してください",
  action: {
    label: "再試行",
    onClick: () => handleRetry(),
  },
});

// 進捗トースト（ファイルアップロード）
toast.loading("写真をアップロード中...", {
  id: "upload-progress",
});
// 完了時に更新
toast.success("アップロード完了", { id: "upload-progress" });
```

#### 8-4-3. オプティミスティックUI（Optimistic UI）

**用途**: 高速なユーザー体験を提供するため、サーバー応答を待たずにUIを先行更新

**適用箇所**:
- 診断項目のステータス変更（正常/注意/要交換）
- コメントの追加・編集
- チェックボックスのON/OFF

**実装例**:
```typescript
const { mutate } = useSWR(`/api/jobs/${jobId}/work-orders/${workOrderId}`);

const handleStatusChange = async (itemId: string, newStatus: string) => {
  // 1. 即座にUIを更新（オプティミスティック）
  mutate(
    (currentData) => ({
      ...currentData,
      items: currentData.items.map((item) =>
        item.id === itemId ? { ...item, status: newStatus } : item
      ),
    }),
    false // サーバー再検証を待たない
  );

  // 2. バックグラウンドでサーバーに保存
  try {
    await saveItemStatus(itemId, newStatus);
  } catch (error) {
    // 3. 失敗時はロールバック + エラー表示
    mutate(); // サーバーから再取得
    toast.error("保存に失敗しました");
  }
};
```

#### 8-4-4. ハプティックフィードバック（振動）

**用途**: モバイルデバイスでの操作確認を触覚で伝達

**対応ブラウザ**: Chrome (Android), Safari (iOS)

**適用箇所**:

| アクション | 振動パターン | 用途 |
| --- | --- | --- |
| ボタンタップ | 10ms | 軽い確認 |
| 保存完了 | 50ms | 成功フィードバック |
| エラー発生 | 50ms-30ms-50ms | 警告（3回振動） |
| 長押し確定 | 100ms | コンテキストメニュー表示 |

**実装例**:
```typescript
const haptic = {
  light: () => navigator.vibrate?.(10),
  success: () => navigator.vibrate?.(50),
  error: () => navigator.vibrate?.([50, 30, 50]),
  confirm: () => navigator.vibrate?.(100),
};

// ボタン押下時
<Button onClick={() => {
  haptic.light();
  handleSave();
}}>
  保存
</Button>
```

#### 8-4-5. フォームフィードバック

**リアルタイムバリデーション**:
- 入力中: 即座にバリデーション実行
- エラー時: フィールド下部に赤字でメッセージ表示
- 成功時: 緑のチェックマークを表示

**自動保存インジケーター**:
```
┌─────────────────────────────────────────┐
│ 💾 自動保存: 10秒前に保存しました          │
└─────────────────────────────────────────┘
```
- 画面下部または入力フォーム付近に控えめに表示
- 保存中は「保存中...」、完了後は「○秒前に保存しました」

---

## 9. 各入庫区分の実装ガイド

### 9-1. 車検

**フローパターン**: パターンA

**特徴**:
- 100項目以上の検査項目を6つのカテゴリに分けて入力
- 測定値入力（CO・HC濃度、タイヤ溝深さ、ブレーキパッド厚さ）
- 診断時の部品リストアップ（音声入力対応、レコメンド機能）
- 動画撮影（不具合項目のみ、最大15秒、Google Drive保存）
- 法定費用の自動取得
- PDF生成（分解整備記録簿）

**実装ポイント**:
- カテゴリタブによる検査項目の切り替え
- 進捗表示（各カテゴリの完了状況）
- 測定値入力専用画面
- 音声入力による部品名の認識（Web Speech API または OpenAI Whisper API）
- カテゴリに応じた部品レコメンド機能
- 動画撮影機能（不具合項目のみ、最大15秒）

### 9-2. 12ヵ月点検

**フローパターン**: パターンA

**特徴**:
- 5つのカテゴリに分けて入力
- 法定費用の自動取得（車両重量に応じて）
- OBD診断結果のアップロード・表示（別システムで実施、決まったフォーマットのPDF）
- オプションメニュー機能（12ヶ月点検と同時実施で10%割引、8種類のメニュー）
- 動画撮影（不具合項目のみ、最大15秒、Google Drive保存）
- 部品リストアップ: 問題があれば整備士がリストアップ（音声入力対応、レコメンド機能）
- PDF生成（分解整備記録簿）

**実装ポイント**:
- 車検と同様のカテゴリタブ構造
- 法定費用の自動計算
- OBD診断結果PDFのアップロード・表示機能（12ヶ月点検記録簿とは別管理）
- オプションメニュー選択UI（割引前価格と割引後価格の併記、バッジ表示）
- 動画撮影機能（不具合項目のみ、最大15秒）
- 部品リストアップ機能（音声入力対応、レコメンド機能）

### 9-3. エンジンオイル交換

**フローパターン**: パターンB

**特徴**:
- 簡易検査項目（3項目のみ）
- 見積もり画面・承認画面は不要（予約時に実施が確定）
- 部品リストアップ: 基本不要（イレギュラーで見つけた場合のみ）

**実装ポイント**:
- シンプルな診断画面
- 作業画面でのBefore/After写真撮影
- イレギュラー時の部品リストアップ機能（任意）

### 9-4. タイヤ交換・ローテーション

**フローパターン**: パターンB

**特徴**:
- タイヤ交換とタイヤローテーションの2種類
- 測定値入力（タイヤ溝深さ、タイヤ圧力）
- タイヤ持ち込みの場合もある
- 簡易検査項目（タイヤの状態確認、空気圧の確認、ホイールの状態確認）

**実装ポイント**:
- 種類選択（タイヤ交換/タイヤローテーション）
- 測定値入力画面（タイヤ溝深さ、空気圧）
- 簡易検査項目の入力（タイヤの状態、空気圧、ホイールの状態）

### 9-5. その他のメンテナンス

**フローパターン**: パターンB

**特徴**:
- 12種類のメンテナンス系サービスを統合
- 動的UI（選択したメンテナンス種類に応じて項目が変化）
- 部品リストアップ: 記録は必要だが、診断時の部品リストアップは不要（見積作成時に部品を選択・入力）

**実装ポイント**:
- メンテナンス種類選択
- 動的UIの実装
- 見積作成時の部品選択・入力機能

### 9-6. 故障診断

**フローパターン**: パターンA

**特徴**:
- 症状カテゴリに応じた動的検査項目
- 診断機の利用（必要に応じて）
- 動画撮影（ケースバイケース、任意、Google Drive保存）
- 音声録音（異音カテゴリの場合、音声のみ）
- 故障診断から修理・整備への移行

**実装ポイント**:
- 症状カテゴリ選択
- 診断機結果PDFの表示・ダウンロード
- 動画撮影機能（ケースバイケース、任意）
- 音声録音機能（異音カテゴリの場合、音声のみ）

### 9-7. 修理・整備

**フローパターン**: パターンA

**特徴**:
- 故障診断からの移行パターンと独立した入庫区分パターンの両方に対応
- 診断機の利用（必要に応じて）
- 診断機結果PDFのアップロード・表示・ダウンロード（診断機を使用した場合）
- 部品取り寄せ対応

**実装ポイント**:
- 故障診断からの移行処理
- 診断機結果PDF管理（アップロード・表示・ダウンロード機能）
- 部品取り寄せ状況の管理

### 9-8. チューニング・パーツ取付

**フローパターン**: パターンA

**特徴**:
- チューニングとパーツ取付は同じ入庫区分だが種類選択で区別
- 動的UI（種類選択により項目が変化）
- 部品取り寄せ対応（部品取り寄せが必要な場合は複数日にまたがる）

**実装ポイント**:
- 種類選択（チューニング/パーツ取付）
- 動的UIの実装
- 部品取り寄せ状況の管理

### 9-9. コーティング

**フローパターン**: パターンB

**特徴**:
- 3種類の基本コーティング
- 7種類のオプションサービス（同時施工で10％割引）
- 車両の寸法による金額計算
- 数日預ける（乾燥時間）

**実装ポイント**:
- コーティング種類選択
- オプションサービス選択と割引計算
- 乾燥プロセスの管理

### 9-10. 板金・塗装

**フローパターン**: パターンA（外注管理）

**特徴**:
- 自社で施工を行わず外注先に預ける
- 事故案件も多い（レッカー入庫、保険対応）
- 作業期間1-3カ月
- Before/After写真必須
- Before動画撮影（必須、損傷箇所の記録）

**実装ポイント**:
- 外注先管理（マスタ管理不要、テキスト入力）
- 外注作業進捗管理
- 事故案件情報の管理
- Before動画撮影機能（必須）

### 9-11. レストア

**フローパターン**: パターンA（長期プロジェクト管理）

**特徴**:
- 長期プロジェクト（数週間から数カ月、場合によっては数年）
- レストアの種類選択（フルレストア/部分レストア）
- フェーズ管理（7つのフェーズ）
- マイルストーン管理
- 進捗管理（0-100%）
- 部品取り寄せ管理
- Before/After写真必須
- PDF生成（レストア完了報告書）

**実装ポイント**:
- レストアの種類選択UI（フルレストア/部分レストア）
- フェーズ管理UI
- マイルストーン管理
- 進捗バー表示
- 部品取り寄せ状況と遅延アラート
- Before/After写真撮影機能（必須）

### 9-12. その他

**フローパターン**: パターンA

**特徴**:
- 汎用的な入庫区分（洗車・ワックス、名義変更代行など）
- カスタマイズ可能な診断項目・見積項目・作業項目
- 自由入力形式

**実装ポイント**:
- 柔軟なフォーム構造
- 動的な項目追加・削除

---

## 10. 実装優先順位

### Phase 1: 共通基盤の実装

1. 共通UI/UXコンポーネントライブラリの実装
2. 統一データモデルの実装
3. API設計の統一実装
4. エラーハンドリングの統一実装

### Phase 2: 主要入庫区分の実装

1. 車検
2. 12ヵ月点検
3. エンジンオイル交換
4. 故障診断
5. 修理・整備

### Phase 3: 拡張入庫区分の実装

1. タイヤ交換・ローテーション
2. その他のメンテナンス
3. チューニング・パーツ取付
4. コーティング
5. 板金・塗装
6. レストア
7. その他

---

## 11. 品質保証

### 11-1. 一貫性の確保

- すべての入庫区分で同じUI/UXパターンを使用
- データモデルの一貫性を保証
- API設計の一貫性を保証

### 11-2. 拡張性の確保

- 新しい入庫区分を追加しやすい設計
- 既存コンポーネントの拡張が容易
- データモデルの拡張が容易

### 11-3. 保守性の確保

- 明確なドキュメント
- 実装例の提供
- テスト方法の提供

### 11-4. KPI・効果測定

**導入目的**: DXシステムの導入効果を定量的に測定し、継続的な改善に活用する。

#### 11-4-1. 業務効率化指標

| 指標 | 測定方法 | 目標値（導入1年後） | 備考 |
| --- | --- | --- | --- |
| 受付時間 | 受付開始〜完了の時間 | 50%短縮（10分→5分） | タブレット入力の効果 |
| 診断記録時間 | 診断開始〜保存の時間 | 30%短縮 | 写真撮影・音声入力の効果 |
| 見積作成時間 | 診断完了〜見積送信の時間 | 40%短縮 | 転記作業の効率化 |
| 顧客承認取得時間 | 見積送信〜承認の時間 | 50%短縮（24時間→12時間） | LINE/デジタル承認の効果 |
| 作業完了報告時間 | 作業完了〜報告送信の時間 | 60%短縮 | 自動PDF生成の効果 |

#### 11-4-2. 顧客満足度指標

| 指標 | 測定方法 | 目標値（導入1年後） | 備考 |
| --- | --- | --- | --- |
| NPS（Net Promoter Score） | 作業完了後のアンケート | +30以上 | 業界平均+10 |
| 見積理解度 | アンケート（5段階評価） | 4.5以上 | 写真・動画による説明効果 |
| 待機ストレス | アンケート（5段階評価） | 4.0以上 | 進捗通知の効果 |
| リピート率 | 12ヶ月以内の再来店率 | 80%以上 | デジタル接点の効果 |

#### 11-4-3. ペーパーレス化指標

| 指標 | 測定方法 | 目標値（導入1年後） | 備考 |
| --- | --- | --- | --- |
| 紙書類削減率 | 印刷枚数の前年比 | 70%削減 | 車検証コピー、見積書印刷等 |
| デジタル承認率 | アプリ承認 / 全承認件数 | 80%以上 | 紙への署名からの移行 |
| PDF閲覧率 | PDF閲覧 / 送信件数 | 90%以上 | 顧客へのデジタル配信の浸透 |

#### 11-4-4. システム利用指標

| 指標 | 測定方法 | 目標値 | 備考 |
| --- | --- | --- | --- |
| 日次アクティブユーザー | ログイン数 | スタッフ全員 | 全員がシステムを利用 |
| 機能別利用率 | 各画面のアクセス数 | 主要機能80%以上 | 特定機能に偏らない利用 |
| エラー発生率 | エラー件数 / 操作件数 | 1%以下 | システム品質の指標 |
| オフライン発生率 | オフライン操作 / 全操作 | 5%以下 | ネットワーク環境の指標 |
| 平均応答時間 | API応答時間 | 500ms以下 | パフォーマンスの指標 |

#### 11-4-5. 測定・収集方法

**自動収集データ**:
```typescript
interface UsageAnalytics {
  /** イベント種別 */
  eventType: "page_view" | "action" | "error" | "timing";
  /** 画面ID */
  screenId: string;
  /** ユーザーロール */
  userRole: Role;
  /** タイムスタンプ */
  timestamp: Date;
  /** 所要時間（ms） */
  duration?: number;
  /** 追加データ */
  metadata?: Record<string, any>;
}
```

**収集タイミング**:
- **ページビュー**: 各画面へのアクセス時
- **アクション完了**: 診断完了、見積送信、作業完了等
- **エラー発生**: API エラー、バリデーションエラー
- **タイミング**: API応答時間、画面表示時間

**レポート出力**:
- **日次レポート**: 日別の作業件数、完了件数
- **週次レポート**: 指標のトレンド分析
- **月次レポート**: KPI達成状況、改善提案

**プライバシー配慮**:
- 個人を特定できる情報は収集しない
- 統計データとして集計して利用
- データ保持期間: 2年間

### 11-5. テスト戦略

**目的**: システムの品質を継続的に保証し、リグレッションを防止する。

#### 11-5-1. テストピラミッド

```
        /\
       /  \        E2Eテスト (10%)
      /    \       - ユーザーシナリオ全体
     /------\
    /        \     統合テスト (20%)
   /          \    - API連携、コンポーネント連携
  /------------\
 /              \  単体テスト (70%)
/                \ - 関数、コンポーネント単体
------------------
```

#### 11-5-2. 単体テスト（Unit Tests）

**対象**:
- ユーティリティ関数（日付フォーマット、金額計算、バリデーション）
- Reactコンポーネント（表示ロジック、イベントハンドリング）
- カスタムフック（useSWR wrapper、useLocalStorage）
- データ変換ロジック（Zoho CRM ↔ アプリ内データモデル）

**ツール**: Vitest + React Testing Library

**カバレッジ目標**: 80%以上

**例**:
```typescript
// src/lib/utils.test.ts
import { formatCurrency, calculateTax } from './utils';

describe('formatCurrency', () => {
  it('正しく金額をフォーマットする', () => {
    expect(formatCurrency(10000)).toBe('¥10,000');
  });
  
  it('0円を正しく表示する', () => {
    expect(formatCurrency(0)).toBe('¥0');
  });
});

describe('calculateTax', () => {
  it('10%の消費税を正しく計算する', () => {
    expect(calculateTax(10000, 0.1)).toBe(1000);
  });
});
```

#### 11-5-3. 統合テスト（Integration Tests）

**対象**:
- API Route Handlers（/api/jobs, /api/work-orders）
- 外部サービス連携（Zoho CRM API、Google Drive API）
- 複数コンポーネントの連携（フォーム送信 → API呼び出し → 状態更新）

**ツール**: Vitest + MSW (Mock Service Worker)

**例**:
```typescript
// src/app/api/jobs/[id]/route.test.ts
import { GET, PATCH } from './route';
import { createMockRequest } from '@/test/utils';

describe('GET /api/jobs/[id]', () => {
  it('Job詳細を取得できる', async () => {
    const request = createMockRequest({ params: { id: 'job-001' } });
    const response = await GET(request, { params: { id: 'job-001' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('job-001');
  });
  
  it('存在しないJobは404を返す', async () => {
    const request = createMockRequest({ params: { id: 'not-exist' } });
    const response = await GET(request, { params: { id: 'not-exist' } });
    
    expect(response.status).toBe(404);
  });
});
```

#### 11-5-4. E2Eテスト（End-to-End Tests）

**対象**:
- 主要ユーザーフロー（受付→診断→見積→承認→作業→引渡）
- クロスブラウザ動作（Chrome, Safari, Edge）
- モバイルデバイス動作（iOS Safari, Android Chrome）

**ツール**: Playwright

**優先シナリオ**:

| 優先度 | シナリオ | 対象ユーザー |
| --- | --- | --- |
| 高 | 車検の一連のフロー | フロント + 整備士 |
| 高 | 見積承認フロー | 顧客 |
| 中 | 複数作業の追加・管理 | フロント |
| 中 | オフライン時の動作 | 整備士 |
| 低 | レストアの長期管理 | フロント + 整備士 |

**例**:
```typescript
// e2e/vehicle-inspection-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('車検フロー', () => {
  test('受付から診断完了まで', async ({ page }) => {
    // 受付画面を開く
    await page.goto('/mechanic/diagnosis/job-001');
    
    // 車両情報が表示されることを確認
    await expect(page.getByText('堺 330 す 1669')).toBeVisible();
    
    // 診断項目を入力
    await page.getByRole('button', { name: '正常' }).first().click();
    
    // 診断完了ボタンを押す
    await page.getByRole('button', { name: '診断完了' }).click();
    
    // 完了メッセージを確認
    await expect(page.getByText('診断が完了しました')).toBeVisible();
  });
});
```

#### 11-5-5. テスト実行タイミング

| テスト種別 | ローカル | PR作成時 | マージ時 | デプロイ後 |
| --- | --- | --- | --- | --- |
| 単体テスト | ✅ 手動 | ✅ CI自動 | ✅ CI自動 | - |
| 統合テスト | ✅ 手動 | ✅ CI自動 | ✅ CI自動 | - |
| E2Eテスト | △ 一部 | △ 主要のみ | ✅ 全件 | ✅ スモーク |

#### 11-5-6. テストデータ管理

**モックデータ**:
- テスト用のJob、WorkOrder、Customer、Vehicleデータをfactoryパターンで生成
- シード値を固定して再現性を確保

**テスト環境**:
- **ローカル**: モックサービス（MSW）を使用
- **CI**: ステージング環境のZoho CRM（テスト用アカウント）
- **本番前**: 本番環境のコピー（匿名化データ）

---

## 12. セキュリティ設計

### 12-1. 認証・認可

**認証方式**:
- **MVP段階**: マジックリンク方式（顧客向け）、セッションベース認証（スタッフ向け）
- **将来実装**: JWT (JSON Web Token) を使用
  - トークンはHTTPヘッダーで送信: `Authorization: Bearer {token}`
  - リフレッシュトークンによるセッション延長
  - トークン有効期限: アクセストークン 1時間、リフレッシュトークン 7日間

**認可（ロールベースアクセス制御）**:

| ロール | 権限 | 対象画面 |
| --- | --- | --- |
| admin | すべての操作が可能 | 管理画面、全画面 |
| front | 受付、見積作成、引渡 | 受付画面、見積画面、引渡画面 |
| mechanic | 診断、作業実施 | 診断画面、作業画面 |
| customer | 見積承認、レポート確認 | 顧客承認画面、レポート画面 |

**権限チェック実装**:
```typescript
// ミドルウェアでの権限チェック
export function checkPermission(requiredRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !hasPermission(userRole, requiredRole)) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "権限がありません" }
      });
    }
    next();
  };
}
```

### 12-2. XSS/CSRF対策

**XSS（クロスサイトスクリプティング）対策**:
- **入力値のサニタイズ**: すべてのユーザー入力をサーバー側でサニタイズ
- **出力時のエスケープ**: ReactのJSXは自動エスケープ、`dangerouslySetInnerHTML`は使用禁止
- **Content-Security-Policy (CSP) ヘッダー**: スクリプトの実行元を制限
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  ```
- **HttpOnly Cookie**: セッションCookieはHttpOnly属性を設定

**CSRF（クロスサイトリクエストフォージェリ）対策**:
- **CSRFトークン**: すべてのPOST/PUT/PATCH/DELETEリクエストにCSRFトークンを含める
- **SameSite Cookie属性**: `SameSite=Strict`または`SameSite=Lax`を設定
- **Origin/Refererヘッダー検証**: リクエスト元を検証

```typescript
// CSRFトークン検証ミドルウェア
export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers["x-csrf-token"];
  const sessionToken = req.session?.csrfToken;
  
  if (!token || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: { code: "CSRF_ERROR", message: "不正なリクエストです" }
    });
  }
  next();
}
```

### 12-3. ファイルアップロードセキュリティ

**アップロード可能なファイル形式**:

| 種類 | 許可する拡張子 | 最大サイズ | 用途 |
| --- | --- | --- | --- |
| 画像 | .jpg, .jpeg, .png, .webp | 5MB（圧縮前）、500KB（圧縮後） | 診断写真、Before/After写真 |
| 動画 | .mp4, .mov, .webm | 100MB | 診断動画、異音録音 |
| PDF | .pdf | 10MB | 車検証、OBD診断結果、請求書 |

**バリデーション実装**:
```typescript
// ファイルアップロードバリデーション
export function validateFileUpload(file: File, allowedTypes: string[], maxSize: number): ValidationResult {
  // 1. ファイルサイズチェック
  if (file.size > maxSize) {
    return { valid: false, error: `ファイルサイズは${maxSize / 1024 / 1024}MB以下にしてください` };
  }
  
  // 2. 拡張子チェック
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedTypes.includes(`.${extension}`)) {
    return { valid: false, error: `許可されていないファイル形式です` };
  }
  
  // 3. MIMEタイプチェック（クライアント側）
  const allowedMimeTypes = getMimeTypesForExtensions(allowedTypes);
  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: `ファイル形式が不正です` };
  }
  
  // 4. マジックバイトチェック（サーバー側で実施）
  return { valid: true };
}
```

**サーバー側のセキュリティ対策**:
- **マジックバイト検証**: ファイルの先頭バイトでファイル形式を検証
- **ファイル名のサニタイズ**: 特殊文字、パストラバーサル攻撃を防止
- **保存先の分離**: アップロードファイルはWebルート外に保存
- **アンチウイルススキャン**: 大規模運用時はClamAV等を検討

### 12-4. データ保護

**機密データの取り扱い**:
- **顧客個人情報**: 氏名、住所、電話番号は暗号化保存（AES-256）
- **車両情報**: 車台番号、登録番号は平文保存（業務上必要）
- **パスワード**: bcryptによるハッシュ化（コストファクター12）

**通信の暗号化**:
- **HTTPS必須**: すべての通信はTLS 1.2以上
- **API通信**: HTTPSのみ許可、HTTP接続はリダイレクト

**ログ・監査証跡**:
```typescript
interface AuditLog {
  timestamp: Date;
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  resourceType: "Job" | "WorkOrder" | "Customer" | "Vehicle";
  resourceId: string;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress: string;
  userAgent: string;
}
```

- **保存期間**: 監査ログは5年間保存
- **アクセス制限**: 監査ログは管理者のみ閲覧可能
- **改ざん防止**: ログは追記のみ可能、削除・編集不可

### 12-5. セキュリティ運用

**脆弱性対策**:
- **依存パッケージの更新**: `npm audit`を週次で実施
- **セキュリティアップデート**: 重大な脆弱性は24時間以内に対応
- **ペネトレーションテスト**: 年1回の外部診断

**インシデント対応**:
1. **検知**: 異常なアクセスパターン、認証失敗の連続を監視
2. **封じ込め**: 不正アクセス検知時はセッション無効化
3. **復旧**: バックアップからの復旧手順を文書化
4. **報告**: 個人情報漏洩時は72時間以内に報告（GDPR/個人情報保護法準拠）

---

## 13. 更新履歴

- 2025-01-XX: 初版作成（統合仕様書）
- 2025-01-XX: 抜け漏れ確認と追加
- 2025-01-XX: マスタデータ保護制約を追加（Google Sheets、Zoho CRMマスタデータモジュールへの追加・編集・削除禁止）
  - 12ヶ月点検のOBD診断機能を追加
  - 12ヶ月点検のオプションメニュー機能を追加
  - 車検の音声入力機能を追加
  - 動画撮影機能の詳細化（各入庫区分での動画撮影要件を明確化）
  - 部品リストアップ機能の詳細化（各入庫区分での部品リストアップ要件を明確化）
  - 診断機結果PDF管理の明確化（修理・整備での診断機利用を明確化）
- 2025-01-XX: Google Driveフォルダ構造の再設計
  - 顧客→車両→Jobの階層構造に変更（業務フローと一致）
  - 車検証を車両フォルダの`/documents/`に保存（最新版と履歴の管理）
  - ブログ用写真の管理機能を追加（複数の分類フォルダに自動コピー）

---

## 13. 関連ドキュメント

### 13-1. 統合仕様書関連

- [共通コンポーネントライブラリ](./COMMON_COMPONENTS_LIBRARY.md): すべての入庫区分で使用する共通UI/UXコンポーネント
- [データモデル統合](./DATA_MODEL_INTEGRATION.md): 統一データモデルと入庫区分別の拡張モデル
- [API設計統一](./API_DESIGN_UNIFIED.md): RESTful API設計原則と統一エンドポイント設計
- [UI/UXガイドライン](./UI_UX_GUIDELINES.md): デザインシステム、アクセシビリティ、パフォーマンスガイドライン
- [入庫区分別統合仕様書](./SERVICE_KIND_INTEGRATION_GUIDE.md): 各入庫区分の統合仕様と実装ガイド
- [実装ガイド](./IMPLEMENTATION_GUIDE.md): 開発環境のセットアップ、コンポーネントの使用方法、テスト方法

### 13-2. システム設計関連

- [システム進化計画](./SYSTEM_EVOLUTION_PLAN.md): 基幹システム制約下での設計変更方針
- [ユーザーワークフロー詳細設計 v2.0](./USER_WORKFLOW_DETAILED_DESIGN_V2.md): ユーザー別業務・システム利用詳細設計（複数作業管理対応版）

### 13-3. 入庫区分別詳細設計書

- [車検 画面設計書](./VEHICLE_INSPECTION_SCREEN_DESIGN.md)
- [12ヵ月点検 画面設計書](./12MONTH_INSPECTION_SCREEN_DESIGN.md)
- [エンジンオイル交換 画面設計書](./ENGINE_OIL_CHANGE_SCREEN_DESIGN.md)
- [タイヤ交換・ローテーション 画面設計書](./TIRE_REPLACEMENT_ROTATION_SCREEN_DESIGN.md)
- [その他のメンテナンス 画面設計書](./GENERAL_MAINTENANCE_SCREEN_DESIGN.md)
- [故障診断 画面設計書](./FAULT_DIAGNOSIS_SCREEN_DESIGN.md)
- [修理・整備 画面設計書](./REPAIR_MAINTENANCE_SCREEN_DESIGN.md)
- [チューニング・パーツ取付 画面設計書](./TUNING_PARTS_INSTALLATION_SCREEN_DESIGN.md)
- [コーティング 画面設計書](./COATING_SCREEN_DESIGN.md)
- [板金・塗装 画面設計書](./BODY_PAINT_SCREEN_DESIGN.md)
- [レストア 画面設計書](./RESTORE_SCREEN_DESIGN.md)
- [その他 画面設計書](./OTHER_SERVICES_SCREEN_DESIGN.md)

























