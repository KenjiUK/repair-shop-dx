# 事前チェックインページ - 項目レビュー

## 調査日
2025-01-XX

## 現在の実装状況

### ✅ 実装済み項目

1. **車両選択**
   - 既存車両リスト表示・選択 ✅
   - 新規車両登録（車種名入力・車検証画像アップロード）✅
   - 車検証アップロード（既存車両）✅
   - 自動車検査証記録事項アップロード（ICタグ付き車検証用）✅

2. **顧客情報確認**
   - 住所表示・編集 ✅
   - 電話番号表示・編集 ✅
   - 変更検知と「変更あり」バッジ表示 ✅
   - 変更時のDescriptionへの追記（変更申請）✅

3. **メール配信同意**
   - チェックボックス表示（常にチェック済み、disabled）✅
   - Email_Opt_Outの更新処理 ✅

4. **問診**
   - 走行距離入力 ✅
   - 不具合・気になるところ（テキストエリア）✅
   - 代車希望（チェックボックス）✅

---

## ❌ 仕様書に記載されているが実装されていない項目

### 1. 誕生日（Date_of_Birth）

**仕様書の記載**:
- `SPECIFICATION.md` 70行目: 「誕生日 | Date_of_Birth | Date | Phase 0: 入力があれば更新（直接更新OK）。」
- `SPECIFICATION.md` 0-2.B（顧客モジュール）: 直接更新OKフィールドとして記載

**現在の実装**: ❌ **入力フィールドなし**

**影響**:
- 誕生日情報を事前チェックインで更新できない
- 顧客情報の完全性に欠ける

**推奨対応**:
- 日付入力フィールドを追加（任意入力）
- 入力があれば `updateCustomerWithValidation` で `Date_of_Birth` を更新

---

### 2. メールアドレス（Email）

**仕様書の記載**:
- `SPECIFICATION.md` 658行目: 「車検日などの重要な案内をメールでお送りします。メールアドレスを正確にご記入ください。」という文言が表示されている
- しかし、実際の入力フィールドは存在しない

**現在の実装**: ⚠️ **文言はあるが入力フィールドなし**

**影響**:
- 顧客がメールアドレスを入力できない
- 説明文と実際の機能が不整合

**推奨対応**:
- 選択肢A: メールアドレス入力フィールドを追加（任意入力）
- 選択肢B: 説明文を修正して、既存のメールアドレスを使用する旨を明記

**注意事項**:
- `SPECIFICATION.md` 0-2.B を見ると、`Email` フィールドは「直接更新NG」か「直接更新OK」か明記されていない
- `src/types/index.ts` を見ると、`Email` フィールドは定義されているが、更新権限の制約は不明確
- 実装前に仕様を確認する必要がある

---

## 🔍 その他の確認事項

### 顧客情報変更対応の現状

**✅ 対応済み**:
- 住所（`Mailing_Street`）: 変更検知 → Descriptionに追記
- 電話番号（`Phone`, `Mobile`）: 変更検知 → Descriptionに追記

**❓ 要確認**:
- メールアドレス（`Email`）: 変更時の対応が不明
- サブメールアドレス（`Secondary_Email`）: 変更時の対応が不明
- 誕生日（`Date_of_Birth`）: 入力フィールドがないため、変更対応も未実装

---

## 📋 仕様書との整合性チェック

### SPECIFICATION.md 0-2.B（顧客モジュール）の確認

| フィールド | 仕様書の記載 | 実装状況 | 備考 |
|-----------|-------------|---------|------|
| 顧客ID | ID1（表示用、更新NG） | ✅ 使用（検索キー） | - |
| 氏名 | Last_Name, First_Name（表示用） | ✅ 使用（表示） | - |
| LINE ID | Business_Messaging_Line_Id（直接更新OK） | ❌ 事前チェックインでは未実装 | Phase 1で実装予定？ |
| メール同意 | Email_Opt_Out（直接更新OK） | ✅ 実装済み | - |
| **誕生日** | **Date_of_Birth（直接更新OK）** | **❌ 未実装** | **要追加** |
| 住所 | Mailing_Street, field4（直接更新NG → Descriptionへ追記） | ✅ 実装済み | - |
| 電話番号 | Phone, Mobile（直接更新NG → Descriptionへ追記） | ✅ 実装済み | - |
| 備考 | Description（変更申請の追記先） | ✅ 実装済み | - |
| 予約時連絡先 | Booking_Phone_Temp（直接更新OK） | ❌ 事前チェックインでは未実装 | Zoho Bookings連携時 |

---

## 💡 推奨対応

### 優先度: 高

1. **誕生日（Date_of_Birth）の入力フィールド追加**
   - 日付入力フィールドを「お客様情報の確認」セクションに追加
   - 任意入力（入力があれば更新）
   - フォーマット: YYYY-MM-DD

### 優先度: 中

2. **メールアドレスの扱いを明確化**
   - 選択肢A: 入力フィールドを追加（仕様確認後）
   - 選択肢B: 説明文を修正して、既存のメールアドレスを使用する旨を明記

### 優先度: 低

3. **その他の確認事項**
   - メールアドレスの更新権限を仕様書で明確化
   - サブメールアドレスの扱いを確認

---

## 📝 実装提案

### 誕生日フィールドの追加実装

```typescript
// PreCheckinFormData に追加
interface PreCheckinFormData {
  // ... 既存フィールド
  dateOfBirth: string; // YYYY-MM-DD
}

// フォームに追加（「お客様情報の確認」セクション）
<div>
  <Label htmlFor="dateOfBirth" className="text-base font-medium">誕生日（任意）</Label>
  <Input
    id="dateOfBirth"
    type="date"
    value={formData.dateOfBirth}
    onChange={(e) =>
      setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
    }
    className="mt-1 h-12 text-base"
  />
  <p className="text-base text-slate-700 mt-1">お誕生日の確認・更新ができます</p>
</div>

// 送信処理に追加
if (formData.dateOfBirth && customer) {
  const { updateCustomerWithValidation } = await import("@/lib/customer-update");
  await updateCustomerWithValidation(
    customer.id,
    { Date_of_Birth: formData.dateOfBirth },
    customer
  );
}
```

---

## 結論

**現在の実装は基本的な項目は揃っているが、以下の点で改善が必要：**

1. ✅ **誕生日フィールドの追加**: 仕様書に明記されており、直接更新OKなので実装すべき
2. ⚠️ **メールアドレスの扱い**: 説明文との不整合を解消する必要がある（入力フィールド追加 or 説明文修正）
3. ✅ **顧客情報変更対応**: 住所・電話番号の変更申請は適切に実装されている


