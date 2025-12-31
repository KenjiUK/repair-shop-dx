# 24ヶ月点検PDF要件整理

**作成日**: 2025-01-XX  
**目的**: 24ヶ月点検PDFに必要な情報の取得元と実装方針の整理

---

## 1. PDFフッター情報の取得元

### 1-1. 自動車分解整備事業者の氏名又は名称及び事業場の所在地並びに認証番号

**現状**: ❌ **未実装** - システム内に保存されていない

**対応方針**:
- 環境変数または設定ファイル（`src/lib/shop-config.ts`など）で管理
- 例: `SHOP_NAME`, `SHOP_ADDRESS`, `SHOP_CERTIFICATION_NUMBER`
- または、Zoho CRMの設定モジュールから取得（将来的）

**実装優先度**: ⚠️ **必要** - 手動入力欄として実装するか、設定画面から取得するか検討が必要

---

### 1-2. 点検の年月日

**取得元**: `WorkOrder.diagnosis.createdAt` または `WorkOrder.createdAt`

**現状**: ✅ **取得可能** - WorkOrderには`createdAt`フィールドがある

**対応方針**: 
- 診断開始日時または診断データ保存日時を使用
- `new Date().toISOString()`で現在日時を取得することも可能

**実装優先度**: ✅ **自動取得可能**

---

### 1-3. 整備完了年月日

**取得元**: `WorkOrder.work.completedAt`

**現状**: ✅ **取得可能** - WorkOrder.workには`completedAt`フィールドがある

**対応方針**:
- 作業完了時に`completedAt`が設定される
- 24ヶ月点検の場合、作業完了日時を使用

**実装優先度**: ✅ **自動取得可能**

---

### 1-4. 整備主任者の氏名

**取得元**: `WorkOrder.diagnosis.mechanicName` または `WorkOrder.work.mechanicName`

**現状**: ✅ **取得可能** - WorkOrderには診断・作業担当者名が保存されている

**対応方針**:
- 診断担当者: `WorkOrder.diagnosis.mechanicName`
- 作業担当者: `WorkOrder.work.mechanicName`（作業完了時の担当者）
- どちらを使用するかは業務要件による（通常は作業担当者）

**実装優先度**: ✅ **自動取得可能**

---

### 1-5. 点検（整備）時の総走行距離

**取得元**: `WorkOrder.diagnosis.mileage` または `ZohoJob.field10`

**現状**: ✅ **取得可能** - 診断時に走行距離が入力される

**対応方針**:
- 診断時の走行距離: `WorkOrder.diagnosis.mileage`
- ジョブの走行距離: `ZohoJob.field10`（フォールバック）
- 通常は診断時の走行距離を使用

**実装優先度**: ✅ **自動取得可能**

---

## 2. 写真・動画の撮影機能

### 2-1. 現状の問題

**ユーザー指摘**: 「このWEBアプリは最終的にお客さんに写真や動画など見せるので、それが取れないとダメではないか？」

**現状の実装**: 
- ✅ 診断画面（`/mechanic/diagnosis/[id]`）には写真撮影機能がある
- ✅ 作業画面（`/mechanic/work/[id]`）にも写真撮影機能がある
- ✅ プレゼンテーション画面（`/presentation/[id]`）で顧客に写真を見せることができる

**24ヶ月点検の再設計画面**:
- ❌ **未実装** - `inspection-redesign-test`ページには写真撮影機能がない

---

### 2-2. 必要な実装

#### 2-2-1. 写真撮影機能の追加

**実装場所**: `src/components/features/inspection-redesign-item-list.tsx`（新規作成予定）または既存の`InspectionBottomSheetItemCard`

**機能要件**:
1. 各検査項目に写真撮影ボタンを追加
2. 写真はGoogle Driveにアップロード
3. `InspectionItemRedesign.photoUrls`に保存
4. 診断画面の`PhotoCaptureButton`コンポーネントを参考に実装

**参考実装**:
- `src/app/mechanic/diagnosis/[id]/page.tsx`の`PhotoCaptureButton`コンポーネント
- `src/lib/compress.ts`の画像圧縮機能
- `src/lib/google-drive.ts`のアップロード機能

#### 2-2-2. 動画撮影機能の追加（オプション）

**実装場所**: 診断画面と同様に、必要に応じて動画撮影ボタンを追加

**機能要件**:
1. 検査項目ごとに動画撮影が可能
2. 動画はGoogle Driveにアップロード
3. `InspectionItemRedesign.videoUrl`に保存

**参考実装**:
- 診断画面の動画撮影機能（実装確認が必要）

---

### 2-3. データモデルの確認

**`InspectionItemRedesign`インターフェース** (`src/types/inspection-redesign.ts`):
```typescript
export interface InspectionItemRedesign {
  id: string;
  label: string;
  category: InspectionCategory12Month | InspectionCategory24Month;
  status: InspectionStatus;
  requiresMeasurement?: boolean;
  isStatutory?: boolean;
  isOmittableByMileage?: boolean;
  isOmittableByMileageToyota?: boolean;
  comment?: string;
  photoUrls?: string[];  // ✅ 写真URL配列（既に定義済み）
  videoUrl?: string;      // ✅ 動画URL（既に定義済み）
  measurementValue?: number;
}
```

**結論**: ✅ **データモデルは既に写真・動画に対応済み**

---

## 3. 実装優先度

### 優先度高（PDF生成に必要）

1. ✅ **走行距離**: 自動取得可能（`WorkOrder.diagnosis.mileage`）
2. ✅ **点検年月日**: 自動取得可能（`WorkOrder.createdAt`）
3. ✅ **整備完了年月日**: 自動取得可能（`WorkOrder.work.completedAt`）
4. ✅ **整備主任者の氏名**: 自動取得可能（`WorkOrder.work.mechanicName`）
5. ⚠️ **自動車分解整備事業者情報**: 未実装 - 設定から取得または手動入力

### 優先度中（顧客への提示に必要）

6. ⚠️ **写真撮影機能**: 24ヶ月点検再設計画面に追加が必要
7. ⚠️ **動画撮影機能**: 必要に応じて追加（オプション）

---

## 4. 実装方針

### 4-1. 写真撮影機能の統合

**方針**: 
1. 診断画面の`PhotoCaptureButton`コンポーネントを再利用
2. `InspectionBottomSheetItemCard`に写真撮影ボタンを追加
3. 写真撮影後、`InspectionItemRedesign.photoUrls`を更新

**実装ファイル**:
- `src/components/features/inspection-bottom-sheet-item-card.tsx`（修正）
- `src/components/features/inspection-photo-capture-button.tsx`（新規作成または既存の`PhotoCaptureButton`を再利用）

### 4-2. 自動車分解整備事業者情報の管理

**方針A**: 環境変数で管理（推奨）
```typescript
// src/lib/shop-config.ts
export const SHOP_CONFIG = {
  name: process.env.NEXT_PUBLIC_SHOP_NAME || "整備工場名",
  address: process.env.NEXT_PUBLIC_SHOP_ADDRESS || "住所",
  certificationNumber: process.env.NEXT_PUBLIC_SHOP_CERTIFICATION_NUMBER || "認証番号",
};
```

**方針B**: 設定画面で管理（将来的）
- 管理者画面から設定を変更可能にする
- localStorageまたはZoho CRMの設定モジュールに保存

**推奨**: まずは環境変数で実装し、将来的に設定画面を追加

---

## 5. 次のステップ

1. ✅ 写真撮影機能を24ヶ月点検再設計画面に追加
2. ⚠️ 自動車分解整備事業者情報の取得方法を決定（環境変数 vs 設定画面）
3. ✅ PDF生成時に自動取得可能な情報を自動入力
4. ⚠️ 手動入力が必要な情報（事業者情報）は設定画面または環境変数から取得

---

## まとめ

**自動取得可能な情報**:
- ✅ 点検年月日（`WorkOrder.createdAt`）
- ✅ 整備完了年月日（`WorkOrder.work.completedAt`）
- ✅ 整備主任者の氏名（`WorkOrder.work.mechanicName`）
- ✅ 総走行距離（`WorkOrder.diagnosis.mileage`）

**要実装・要設定**:
- ⚠️ 自動車分解整備事業者情報（環境変数または設定画面）
- ⚠️ 写真撮影機能（24ヶ月点検再設計画面に追加）
- ⚠️ 動画撮影機能（必要に応じて追加）






