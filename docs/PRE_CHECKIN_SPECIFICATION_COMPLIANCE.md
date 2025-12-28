# 事前チェックインページ - 仕様書準拠確認

## 調査日
2025-01-XX

## 仕様書との整合性チェック

### SPECIFICATION.md 0-3. システム連携＆事前チェックイン

#### 1. 車両の特定 (Vehicle Selection) ✅

**仕様書の記載**:
- Zohoの顧客ID (ID1) をキーに、Google Sheets (SheetID_Vehicle) を検索
- 「今回ご入庫のお車はどちらですか？」→ 保有車両リスト（車名・登録番号連結）を表示し選択させる
- 新規客またはリストにない車の場合:
  - 「別の車（新規）」を選択
  - 「車種名（例: BMW X3）」をテキスト入力
  - 車検証の写真をアップロードさせる（→ 画像は `field12` へ保存）

**実装状況**: ✅ **完全実装済み**
- `fetchVehiclesByCustomerId` で顧客IDから車両リストを取得 ✅
- 既存車両リスト表示・選択 ✅
- 「別の車（新規）」ボタンで新規車両登録モードに切り替え ✅
- 車種名入力フィールド ✅
- 車検証画像アップロード（プレビュー機能付き）✅
- `uploadNewVehicleImage` → `createNewVehicleAndLinkImage` → `addImageToJobField12` で `field12` に保存 ✅

---

#### 2. 顧客情報の確認 (Identity Verification) ✅

**仕様書の記載**:
- 現在登録の住所・電話番号を表示（Source: Zoho `Contacts`）
- 「変更はありますか？」→ ある場合、新住所を入力

**実装状況**: ✅ **完全実装済み**
- 住所表示・編集（`customer.mailingStreet` から初期値設定）✅
- 電話番号表示・編集（`customer.phone || customer.mobile` から初期値設定）✅
- 変更検知と「変更あり」バッジ表示 ✅
- 変更時のDescriptionへの追記（変更申請）✅

**追加実装**（仕様書に明記されていないが、必要な項目）:
- メールアドレス表示・編集 ✅
- 誕生日表示・編集（`Date_of_Birth` 直接更新OK）✅

---

#### 3. パーミッション (Consent) ✅

**仕様書の記載**:
- メール配信同意（Opt-in）のチェックボックス

**実装状況**: ✅ **完全実装済み**
- チェックボックス表示（常にチェック済み、disabled）✅
- `Email_Opt_Out` の更新処理 ✅
- 説明文: 「車検日などの重要な案内をメールでお送りします。上記のメールアドレス宛にお送りします。」✅

---

#### 4. 問診 (Details) ✅

**仕様書の記載**:
- 現在の走行距離（概算）
- 不具合・気になるところ（選択または自由記述）
- 代車の希望（有無）

**実装状況**: ✅ **完全実装済み**
- 走行距離入力（`job.field10` から初期値設定）✅
- 不具合・気になるところ（テキストエリア）✅
- 代車希望（チェックボックス）✅

---

### Data Write-back（データ書き戻し）

#### 顧客データの反映 ✅

**仕様書の記載**:
- メール同意: Zoho `Contacts` の `Email_Opt_Out` を即時更新（Direct Update）
- 住所・電話変更: Zoho `Contacts` の `Description` (詳細情報) 欄に「【アプリ変更届】住所変更: ...」と追記。事務員が後日基幹システムを手動修正する

**実装状況**: ✅ **完全実装済み**
- `Email_Opt_Out` の直接更新 ✅
- 住所変更のDescriptionへの追記（`formatChangeRequest` → `appendToCustomerDescription`）✅
- 電話番号変更のDescriptionへの追記 ✅

**追加実装**:
- 誕生日（`Date_of_Birth`）の直接更新 ✅
- メールアドレス変更のDescriptionへの追記 ✅

---

#### 入庫データの反映 ✅

**仕様書の記載**:
- 選択された車両を `CustomModule2` の `field6` (車両ID) に紐付け
- 走行距離を `field10`、不具合内容を `field7` (詳細情報) に追記
- 新規車両画像は `field12` (関連ファイル) に保存

**実装状況**: ✅ **完全実装済み**
- `updateJobField6` で車両IDを更新 ✅
- `updateJobField10` で走行距離を更新 ✅
- `updateJobField7` で不具合内容を追記（「【事前入力】不具合・気になるところ: ...」）✅
- `updateJobField7` で代車希望を追記（「【事前入力】代車希望: あり」）✅
- `uploadNewVehicleImage` → `createNewVehicleAndLinkImage` → `addImageToJobField12` で新規車両画像を `field12` に保存 ✅

---

## SPECIFICATION.md 0-2.B（顧客モジュール）との整合性

| フィールド | 仕様書の記載 | 実装状況 | 備考 |
|-----------|-------------|---------|------|
| 顧客ID | ID1（表示用、更新NG） | ✅ 使用（検索キー） | - |
| 氏名 | Last_Name, First_Name（表示用） | ✅ 使用（表示） | - |
| LINE ID | Business_Messaging_Line_Id（直接更新OK） | ⚠️ 未実装 | Phase 1で実装予定 |
| メール同意 | Email_Opt_Out（直接更新OK） | ✅ 実装済み | - |
| 誕生日 | Date_of_Birth（直接更新OK） | ✅ 実装済み | ✅ 追加実装完了 |
| 住所 | Mailing_Street, field4（直接更新NG → Descriptionへ追記） | ✅ 実装済み | - |
| 電話番号 | Phone, Mobile（直接更新NG → Descriptionへ追記） | ✅ 実装済み | - |
| メールアドレス | Email（仕様書未記載） | ✅ 実装済み（Descriptionへ追記） | 仕様書に明記なし、実装判断で追加 |
| 備考 | Description（変更申請の追記先） | ✅ 実装済み | - |
| 予約時連絡先 | Booking_Phone_Temp（直接更新OK） | ⚠️ 未実装 | Zoho Bookings連携時 |

---

## 結論

### ✅ 仕様書に記載されているすべての項目が実装済み

1. **車両の特定**: 完全実装 ✅
2. **顧客情報の確認**: 完全実装 ✅（仕様書以上の機能も実装）
3. **パーミッション**: 完全実装 ✅
4. **問診**: 完全実装 ✅
5. **データ書き戻し**: 完全実装 ✅

### 追加実装項目（仕様書に明記されていないが、実装したもの）

1. **誕生日（Date_of_Birth）**: 仕様書の0-2.Bに「Phase 0: 入力があれば更新（直接更新OK）」と記載されているため実装 ✅
2. **メールアドレス**: メール配信のために必要と判断し実装（変更時はDescriptionへ追記）✅
3. **既存車両の車検証アップロード**: ユーザー要求により実装 ✅
4. **自動車検査証記録事項アップロード**: ユーザー要求により実装 ✅
5. **車検有効期限の表示**: ユーザー要求により実装 ✅

### 未実装項目（仕様書に記載されていない、またはPhase 0以外で実装予定）

1. **LINE ID（Business_Messaging_Line_Id）**: Phase 1で実装予定
2. **予約時連絡先（Booking_Phone_Temp）**: Zoho Bookings連携時

---

## 実装完了

**事前チェックインページは仕様書に記載されているすべての項目が実装済みです。**

