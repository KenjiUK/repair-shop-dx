# 顧客通知システム仕様

**作成日:** 2024年
**目的:** 事前問診や作業後のレポートなど、顧客への送信方法の仕様

---

## 概要

本ドキュメントは、事前問診や作業後のレポートなど、顧客への情報送信方法をまとめています。

---

## 現在の実装状況

### 1. 見積送信

**実装場所:** `src/app/admin/estimate/[id]/page.tsx`

**送信方法:**
1. **LINE通知** (`sendLineNotification`)
   - 顧客のLINE User ID (`Business_Messaging_Line_Id`) が必要
   - 通知タイプ: `estimate_sent`
   - マジックリンクURLを含める

2. **マジックリンク** (`generateMagicLink`)
   - 有効期限: 7日間（デフォルト）
   - リンク先: `/customer/approval/[id]` - 見積承認ページ
   - トークンベースの認証

**フロー:**
```
見積作成 → マジックリンク生成 → LINE通知送信（マジックリンク含む）
→ 顧客がLINEでリンクをクリック → 見積承認ページにアクセス
```

**参照:**
- `src/lib/line-api.ts` - LINE通知API
- `src/lib/line-templates.ts` - 通知テンプレート
- `src/app/customer/approval/[id]/page.tsx` - 見積承認ページ

---

### 2. 作業後のレポート

**実装場所:** `src/app/customer/report/[id]/page.tsx`

**機能:**
- 作業内容の表示
- Before/After写真の表示
- 請求書PDFの表示
- 作業動画の表示

**送信方法:**
- 現在の実装では、マジックリンク経由でアクセス可能
- LINE通知でマジックリンクを送信する想定（実装要確認）

**参照:**
- `src/app/customer/report/[id]/page.tsx` - 作業レポートページ

---

### 3. 事前問診

**実装場所:** Phase 0（予約・事前準備）

**機能:**
- 顧客が事前に入力した不具合・問診内容を`field7`（詳細情報）に記録

**送信方法:**
- 現在の実装では、事前問診フォームへのリンクを送信する方法が明確ではない
- おそらくLINE通知またはメールでリンクを送信

---

## 通知タイプ

### 既存の通知タイプ

1. **check_in** - 入庫完了
2. **diagnosis_complete** - 診断完了
3. **estimate_sent** - 見積送付
4. **estimate_approved** - 見積承認
5. **work_complete** - 作業完了

### 新規追加が必要な通知タイプ

6. **parts_arrived** - 全部品到着（第1フェーズで追加予定）
   - 全部品到着時に顧客に連絡
   - Zoho Bookings予約リンクを含める

---

## 送信方法の選択肢

### 1. LINE通知（推奨）

**メリット:**
- 既存の実装がある
- 顧客がスマホで簡単に確認できる
- マジックリンクをクリックするだけでアクセス可能

**デメリット:**
- LINE User IDが必要
- LINE未登録の顧客には送信できない

**実装:**
- `sendLineNotification` を使用
- `generateMagicLink` でマジックリンクを生成

---

### 2. メール送信

**メリット:**
- LINE未登録の顧客にも送信可能
- 既存のメールアドレスを使用

**デメリット:**
- 現在の実装ではメール送信機能がない
- 実装が必要

**実装:**
- メール送信APIの実装が必要
- または、Zoho CRMのメール機能を使用

---

### 3. SMS送信（MVP）

**メリット:**
- 電話番号があれば送信可能
- 幅広い顧客に到達可能

**デメリット:**
- 現在の実装ではSMS送信機能がない
- 実装が必要

**実装:**
- SMS送信APIの実装が必要
- または、Zoho CRMのSMS機能を使用

---

## 全部品到着時の連絡機能

### 実装方針

**推奨:** LINE通知 + マジックリンク（既存パターンに統一）

**実装内容:**
1. 全部品到着時にマジックリンクを生成
   - リンク先: Zoho Bookings予約ページ（2回目の予約用）
   - または、カスタムページ（予約リンクを含む）

2. LINE通知を送信
   - 通知タイプ: `parts_arrived`（新規追加）
   - マジックリンクURLを含める
   - メッセージテンプレートを使用

3. フォールバック
   - LINE User IDがない場合、メールまたはSMSで送信（将来実装）

---

## 通知テンプレート

### 全部品到着通知（新規追加）

**実装場所:** `src/lib/line-templates.ts`

```typescript
/**
 * 全部品到着通知のメッセージを生成
 */
export function createPartsArrivedNotification(
  data: NotificationTemplateData & {
    bookingLink?: string; // Zoho Bookings予約リンク
  }
): LineNotificationMessage {
  const bookingLinkText = data.bookingLink
    ? `\n\n以下のリンクから、ご都合の良い日時で再入庫の予約をお願いいたします：\n${data.bookingLink}`
    : "";

  return {
    type: "text",
    text: `【${data.customerName}様】\n\nお待たせしております。\n発注していた部品が全て到着いたしました。\n\n車両: ${data.vehicleName}${data.licensePlate ? ` (${data.licensePlate})` : ""}\n作業: ${data.serviceKind}${bookingLinkText}\n\nご都合の良い日時で再入庫の予約をお願いいたします。`,
  };
}
```

---

## データ保存

### LINE User IDの取得

**実装場所:** `src/lib/api.ts`

**取得方法:**
- Zoho CRM `Contacts` モジュールから取得
- フィールド: `Business_Messaging_Line_Id` または `lineId`

**コード例:**
```typescript
const customerResult = await fetchCustomerById(customerId);
const lineUserId = customer?.Business_Messaging_Line_Id || customer?.lineId;
```

---

## 実装チェックリスト

### 第1フェーズ

- [ ] 全部品到着通知タイプを追加
  - `src/lib/line-api.ts` に `parts_arrived` を追加
  - `src/lib/line-templates.ts` にテンプレート関数を追加

- [ ] 全部品到着時の連絡機能
  - マジックリンク生成（Zoho Bookings予約リンクを含む）
  - LINE通知送信

### 将来実装（オプション）

- [ ] メール送信機能
- [ ] SMS送信機能
- [ ] 事前問診フォームへのリンク送信

---

## 参照ドキュメント

- `docs/DOUBLE_BOOKING_FLOW_UX_OPTIMIZATION.md` - 2回予約フローのUX最適化
- `docs/IMPLEMENTATION_SPECIFICATION.md` - 実装仕様書

---

## 注意事項

### LINE User IDの管理

- LINE User IDが登録されていない顧客には送信できない
- フォールバック（メール、SMS）の実装を検討

### マジックリンクの有効期限

- デフォルト: 7日間
- 全部品到着通知の場合は、予約期限に合わせて調整可能

### 通知の重複送信防止

- 同じ通知を複数回送信しないように制御
- 通知履歴を確認してから送信

---

## 更新履歴

- 2024年: 初版作成







