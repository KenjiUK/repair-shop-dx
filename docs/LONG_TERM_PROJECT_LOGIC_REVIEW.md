# 長期プロジェクトロジック見直しレビュー

## 📋 用語の定義

- **入庫案件 (ZohoJob)**: 1つの車両の入庫単位
- **作業オーダー (WorkOrder)**: 1つの作業単位（車検、板金・塗装など）

## 📋 問題の概要

複合業務（例：車検 + 板金・塗装）の場合、現在のロジックでは以下の問題が発生します：

1. **入庫案件単位の判定**: 現在、`isLongTermProject(job)`は入庫案件全体（`field_service_kinds`）に"レストア"または"板金・塗装"が含まれているかどうかで判定している
2. **複合業務の問題**: 車検 + 板金・塗装の場合、入庫案件全体が長期プロジェクトとして扱われてしまう
3. **実際の要件**: 「板金・塗装」の作業オーダーのみが長期プロジェクトであり、「車検」は通常の作業

---

## 🔍 現状のロジック分析

### 現在の実装

**`src/lib/long-term-project-utils.ts`:**

```typescript
export function isLongTermProject(job: ZohoJob): boolean {
  const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  return (
    serviceKinds.includes("レストア" as ServiceKind) ||
    serviceKinds.includes("板金・塗装" as ServiceKind)
  );
}
```

**問題点:**
- 入庫案件全体（`field_service_kinds`）で判定している
- 複合業務の場合、通常の作業（車検）も長期プロジェクトとして扱われてしまう
- 進捗データも入庫案件単位で取得している（`job.workData`）

### データ構造

**作業オーダー構造:**
```typescript
interface WorkOrder {
  id: string;
  jobId: string;
  serviceKind: ServiceKind;
  status: WorkOrderStatus;
  diagnosis?: {
    // 診断情報
  };
  estimate?: {
    // 見積情報
  };
  work?: {
    restoreWorkData?: RestoreProgress;  // レストアの場合
    bodyPaintOutsourcingInfo?: BodyPaintOutsourcingInfo;  // 板金・塗装の場合
    // その他の作業情報
  };
  vendor?: {
    // 外注先情報
  };
}
```

**進捗データの保存場所:**
- レストア: `workOrder.work.restoreWorkData`
- 板金・塗装: `workOrder.work.bodyPaintOutsourcingInfo`

---

## 🎯 正しいアプローチ

### 1. 作業オーダー単位での判定

長期プロジェクトの判定は、**作業オーダー単位**で行うべきです。

```typescript
/**
 * 作業オーダーが長期プロジェクトかどうかを判定
 */
export function isLongTermWorkOrder(workOrder: WorkOrder): boolean {
  return (
    workOrder.serviceKind === "レストア" ||
    workOrder.serviceKind === "板金・塗装"
  );
}
```

### 2. 作業オーダー単位での進捗データ抽出

進捗データも、作業オーダー単位で抽出する必要があります。

```typescript
/**
 * 作業オーダーから長期プロジェクト進捗データを抽出
 */
export function extractLongTermProgressFromWorkOrder(workOrder: WorkOrder): {
  progress: number;
  isDelayed: boolean;
  startDate?: string;
  expectedCompletionDate?: string;
  currentPhase?: string;
} | null {
  if (!isLongTermWorkOrder(workOrder)) {
    return null;
  }

  if (workOrder.serviceKind === "レストア") {
    return extractRestoreProgressFromWorkOrder(workOrder);
  } else if (workOrder.serviceKind === "板金・塗装") {
    return extractBodyPaintProgressFromWorkOrder(workOrder);
  }

  return null;
}
```

### 3. JobCardでの表示ロジック

**複合業務の場合:**
- 入庫案件全体の進捗情報セクションは表示しない
- 作業一覧内の各作業オーダーカードに、長期プロジェクトの作業オーダーのみ進捗情報を表示

**単一の長期プロジェクトの場合:**
- 入庫案件全体の進捗情報セクションを表示（現在の実装を維持）

### 4. TOPページの長期プロジェクトセクション

**複合業務の場合:**
- 長期プロジェクトの作業オーダーを持つ入庫案件を表示
- ただし、入庫案件全体ではなく、長期プロジェクトの作業オーダーのみを強調表示

---

## 📝 実装計画

### Phase 1: ロジックの見直し

1. **`long-term-project-utils.ts`の修正**
   - `isLongTermProject(job)`を`isLongTermWorkOrder(workOrder)`に変更（新規追加）
   - `extractLongTermProjectData(job)`を`extractLongTermProgressFromWorkOrder(workOrder)`に変更（新規追加）
   - 後方互換性のため、既存の関数も残す（非推奨としてマーク）

2. **進捗データ抽出の修正**
   - `extractRestoreProgressFromWorkOrder`: `workOrder.work.restoreWorkData`から進捗データを抽出（新規追加）
   - `extractBodyPaintProgressFromWorkOrder`: `workOrder.work.bodyPaintOutsourcingInfo`から進捗データを抽出（新規追加）

### Phase 2: JobCardの修正

1. **進捗情報セクションの表示条件**
   - 単一の長期プロジェクト作業オーダーの場合のみ表示
   - 複合業務の場合は、作業一覧内の各作業オーダーカードに進捗情報を表示

2. **作業一覧カードの拡張**
   - 長期プロジェクトの作業オーダーの場合、進捗バー、進捗率、開始日、予定完了日を表示
   - 遅延フラグも作業オーダー単位で表示

### Phase 3: TOPページの修正

1. **長期プロジェクトセクション**
   - 長期プロジェクトの作業オーダーを持つ入庫案件を抽出
   - 複合業務の場合、どの作業オーダーが長期プロジェクトかを明確に表示

2. **長期プロジェクト管理画面**
   - 作業オーダー単位で長期プロジェクトを管理
   - 複合業務の場合、長期プロジェクトの作業オーダーのみを表示

---

## ✅ 推奨事項

### 1. 段階的な移行

- 既存のロジックを残しつつ、新しいロジックを追加
- 後方互換性を保ちながら、段階的に移行

### 2. データ構造の確認

- 作業オーダーの`work.restoreWorkData`と`work.bodyPaintOutsourcingInfo`が正しく保存されているか確認
- 既存データとの互換性を確認

### 3. UI/UXの検討

- 複合業務の場合、どのように進捗情報を表示するか
- 作業一覧内の作業オーダーカードに進捗情報を表示する場合のレイアウト

---

## 🔄 次のステップ

1. **現状の確認**: 既存のデータ構造と作業オーダーの進捗データ保存方法を確認
2. **ロジックの修正**: 作業オーダー単位での判定と進捗データ抽出に変更
3. **UIの修正**: JobCardとTOPページの表示ロジックを修正
4. **テスト**: 複合業務のシナリオでテスト

## ✅ 実装完了

- ✅ Phase 1: ロジックの見直し（完了）
- ✅ Phase 2: JobCardの修正（完了）
- ⏳ Phase 3: TOPページの修正（未実装）

