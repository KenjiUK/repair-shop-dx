# データアーキテクチャ検証レポート

## 調査日
2025-01-XX

## 調査目的
ユーザー提供の「0. データアーキテクチャ & API定義」情報が、現在のシステム実装と一致しているか確認。

---

## 1. システム役割とデータ権限 (0-1)

### ✅ 完全一致

| 項目 | 仕様書 | 実装状況 | 確認結果 |
|------|--------|----------|----------|
| 基幹システム | スマートカーディーラー（The Truth、No Access） | ✅ 実装なし（CSV/Excel経由） | 一致 |
| Google Sheets | Mirror（Read Only） | ✅ `src/lib/google-sheets.ts` で読み取り専用実装 | 一致 |
| Zoho CRM | Transaction（Read/Write） | ✅ `src/lib/api.ts` で実装 | 一致 |
| Google Drive | Storage（Read/Write） | ✅ `src/lib/google-drive.ts` で実装 | 一致 |

**確認箇所**:
- `SPECIFICATION.md` の 0-1 セクション
- `src/lib/google-sheets.ts` のコメントに「⚠️ 重要制約: 読み取り専用」
- `src/types/index.ts` の型定義

---

## 2. Zoho CRM モジュール・フィールド・APIマッピング (0-2)

### 2-1. 入庫管理 (CustomModule2)

#### ✅ 完全一致

| 項目名 | API名（仕様書） | API名（実装） | 確認結果 |
|--------|-----------------|---------------|----------|
| 入庫日時 | field22 | field22 | ✅ 一致 |
| 工程ステージ | field5 | field5 | ✅ 一致 |
| 顧客名 | field4 | field4 | ✅ 一致 |
| 車両ID | field6 | field6 | ✅ 一致 |
| 作業指示書 | field | field | ✅ 一致 |
| 詳細情報 | field7 | field7 | ✅ 一致 |
| 走行距離 | field10 | field10 | ✅ 一致 |
| 作業内容 | field13 | field13 | ✅ 一致 |
| 作業内容一覧 | field14（使用しない） | field14（使用しない、コメントのみ） | ✅ 一致 |
| お客様共有フォルダ | field19 | field19 | ✅ 一致 |
| 予約ID | ID_BookingId | ID_BookingId | ✅ 一致 |
| 関連ファイル | field12 | field12 | ✅ 一致 |

**確認箇所**:
- `src/types/index.ts` の `ZohoJob` インターフェース
- 実装では `field14` は使用されておらず、コメントに「使用禁止」と記載

### 2-2. 顧客 (Contacts)

#### ✅ 完全一致

| 項目名 | API名（仕様書） | API名（実装） | 確認結果 |
|--------|-----------------|---------------|----------|
| 顧客ID | ID1 | ID1 | ✅ 一致 |
| 氏名 | Last_Name, First_Name | Last_Name, First_Name | ✅ 一致 |
| LINE ID | Business_Messaging_Line_Id | Business_Messaging_Line_Id | ✅ 一致 |
| メール同意 | Email_Opt_Out | Email_Opt_Out | ✅ 一致 |
| 誕生日 | Date_of_Birth | Date_of_Birth | ✅ 一致 |
| 住所 | Mailing_Street, field4 | Mailing_Street, field4, field6 | ✅ 一致（field6も実装あり） |
| 電話番号 | Phone, Mobile | Phone, Mobile | ✅ 一致 |
| 備考 | Description | Description | ✅ 一致 |
| 予約時連絡先 | Booking_Phone_Temp | Booking_Phone_Temp | ✅ 一致 |

**確認箇所**:
- `src/types/index.ts` の `ZohoCustomer` インターフェース
- `src/lib/customer-update.ts` で住所・電話番号の直接更新制約が実装されている

**実装の追加事項**:
- 住所フィールドは `Mailing_Street`, `field4`, `field6` の3つが実装されている（仕様書では `Mailing_Street`, `field4` のみ記載）

### 2-3. 車両 (CustomModule1)

#### ✅ 完全一致

| 項目名 | API名（仕様書） | API名（実装） | 確認結果 |
|--------|-----------------|---------------|----------|
| 車両ID | Name | Name | ✅ 一致 |
| 登録番号連結 | field44 | field44 | ✅ 一致 |
| 顧客ID | ID1 | ID1 | ✅ 一致 |
| 車検有効期限 | field7 | field7 | ✅ 一致 |

**確認箇所**:
- `src/types/index.ts` の `ZohoVehicle` インターフェース

### 2-4. その他利用モジュール

#### ✅ 仕様書と一致（実装では参照のみ）

仕様書に記載されたモジュール（商談、予約、予定、タスク）は、現時点ではアプリから直接参照されていない。

---

## 3. データの同期フロー (0-3)

### 3-1. マスタデータの流れ（下り：Smart Car Dealer → App）

#### ✅ 完全一致

| ステップ | 仕様書 | 実装状況 | 確認結果 |
|----------|--------|----------|----------|
| Export | 事務員が毎日CSV/Excelで書き出し | - | 手動運用（実装範囲外） |
| Import | GASがファイルを検知してGoogle Sheetsに展開 | ✅ `scripts/gas-master-data-sync.gs` で実装 | 一致 |
| Read | WebアプリがSheetsをAPI経由で参照 | ✅ `src/lib/google-sheets.ts` で実装 | 一致 |

**確認箇所**:
- `scripts/gas-master-data-sync.gs` でGAS実装を確認
- `src/app/api/google-sheets/vehicles/route.ts` でGoogle Sheets API実装を確認
- `src/hooks/use-master-data.ts` でSWRキャッシュを使用

### 3-2. 更新データの流れ（上り：App → Smart Car Dealer）

#### ✅ 完全一致

| ステップ | 仕様書 | 実装状況 | 確認結果 |
|----------|--------|----------|----------|
| Input | 顧客がWebアプリで新住所を入力 | ✅ `src/app/customer/pre-checkin/[id]/page.tsx` で実装 | 一致 |
| Pool | Zoho CRM (Contacts) の `Description` に書き込む | ✅ `src/lib/customer-description-append.ts` で実装 | 一致 |
| Update | 事務員が手動で基幹システムを更新 | - | 手動運用（実装範囲外） |

**確認箇所**:
- `src/app/customer/pre-checkin/[id]/page.tsx` の168-195行目で住所・電話番号変更を `Description` に追記
- `src/lib/customer-update.ts` で直接更新NGフィールドのバリデーション実装

### 3-3. APIレート制限対策

#### ✅ 完全一致

| 項目 | 仕様書 | 実装状況 | 確認結果 |
|------|--------|----------|----------|
| Caching | SWRまたはTanStack Query使用 | ✅ `src/hooks/use-master-data.ts` でSWR使用 | 一致 |
| Optimization | 不要なポーリングを避ける | ✅ SWRの `revalidateOnFocus`, `dedupingInterval` 設定 | 一致 |

**確認箇所**:
- `src/hooks/use-master-data.ts` の27-35行目でSWR設定を確認

---

## 4. マスタデータ構造 (0-4)

### 4-1. 車両マスタ (SheetID_Vehicle)

#### ✅ 完全一致

| カラム名（仕様書） | カラム名（実装） | 確認結果 |
|---------------------|------------------|----------|
| 車両ID (Key) | 車両ID | ✅ 一致 |
| 顧客ID | 顧客ID | ✅ 一致 |
| 登録番号連結 | 登録番号連結 | ✅ 一致 |
| 車名 | 車名 | ✅ 一致 |
| 型式 | 型式 | ✅ 一致 |
| 車検有効期限 | 車検有効期限 | ✅ 一致 |
| 次回点検日 | 次回点検日 | ✅ 一致 |

**確認箇所**:
- `src/types/index.ts` の `MasterVehicle` インターフェース（325-340行目）
- `src/app/api/google-sheets/vehicles/route.ts` の `parseVehicleMaster` 関数（78-121行目）

### 4-2. 顧客マスタ (SheetID_Customer)

#### ✅ 完全一致

| カラム名（仕様書） | カラム名（実装） | 確認結果 |
|---------------------|------------------|----------|
| 顧客ID (Key) | 顧客ID | ✅ 一致 |
| 顧客名 | 顧客名 | ✅ 一致 |
| 住所連結 | 住所連結 | ✅ 一致 |
| 電話番号 | 電話番号 | ✅ 一致 |
| 携帯番号 | 携帯番号 | ✅ 一致 |

**確認箇所**:
- `src/types/index.ts` の `MasterCustomer` インターフェース（346-357行目）
- `src/app/api/google-sheets/customers/route.ts` の `parseCustomerMaster` 関数（70-111行目）

---

## 5. 総合評価

### ✅ 検証結果：**完全一致**

ユーザー提供の「0. データアーキテクチャ & API定義」情報は、現在のシステム実装と**完全に一致**しています。

### 確認されたポイント

1. **システム役割とデータ権限**: すべて一致
2. **Zoho CRMフィールドマッピング**: すべて一致（住所フィールドの追加実装あり）
3. **データ同期フロー**: すべて一致
4. **マスタデータ構造**: すべて一致

### 実装の追加事項（仕様書に明記されていないが実装されているもの）

1. **顧客モジュールの住所フィールド**:
   - 仕様書: `Mailing_Street`, `field4`
   - 実装: `Mailing_Street`, `field4`, `field6`（建物名等）
   - 備考: `field6` も実装されているが、仕様書には記載なし

### 注意事項

1. **field14（作業内容一覧）**: 仕様書通り使用禁止。実装でも使用されていない。
2. **Google Sheets**: 読み取り専用制約が実装されている（`src/lib/google-sheets.ts` のコメントに明記）。
3. **住所・電話番号の直接更新制約**: `src/lib/customer-update.ts` でバリデーション実装済み。

---

## 6. 結論

**ユーザー提供の情報は現在の実装と完全に一致しています。** システムは仕様書通りに実装されており、データアーキテクチャの整合性が保たれています。


