# フィルターと並び替え機能のレビューと改善提案

**作成日:** 2025-01-XX  
**対象:** トップページ（`/`）のフィルターと並び替え機能  
**背景:** JOBカードの形式が変更され、複合作業管理（WorkOrder）が導入されたため、フィルターと並び替えのロジックを見直す必要がある

---

## 1. 現状の実装確認

### 1-1. フィルター機能（`src/lib/filter-utils.ts`）

#### ✅ 既に対応済み
- **入庫区分フィルター**: `field_service_kinds`に対応済み（複合作業対応）
- **整備士フィルター**: WorkOrderの整備士もチェック済み（複合作業対応）

#### ⚠️ 改善が必要
- **ステータスフィルター**: `job.field5`（ジョブ全体のステータス）のみでフィルタリング
  - 複合作業の場合、各WorkOrderが異なるステータスを持つ可能性がある
  - 例: 車検（診断中）+ 板金（外注調整中）の場合、ジョブ全体のステータスは「診断中」だが、板金作業は「外注調整中」

### 1-2. 並び替え機能（`src/app/page.tsx`）

#### ✅ 既に対応済み
- **入庫時間順**: `field22`（入庫日時）で並び替え
- **予約時間順**: 予約時間で並び替え
- **ステータス順**: ステータスの優先順位で並び替え

#### ⚠️ 改善が必要
- **複合作業の並び替え**: 各WorkOrderの開始時間や進捗状況を考慮していない
- **優先度計算**: 複合作業の場合、優先度の計算方法を再検討する必要がある

---

## 2. 問題点の詳細分析

### 2-1. ステータスフィルターの問題

**現状:**
```typescript
// 現在の実装（filter-utils.ts:91-99）
if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
  const hasMatchingStatus = filters.status.some((status) => {
    return job.field5 === status; // ジョブ全体のステータスのみチェック
  });
  if (!hasMatchingStatus) return false;
}
```

**問題点:**
1. 複合作業の場合、`job.field5`は「最も進んでいるWorkOrderのステータス」または「最も遅れているWorkOrderのステータス」を反映している可能性がある
2. 例: 車検（診断中）+ 板金（外注調整中）の場合
   - ユーザーが「外注調整中」でフィルタリングしても、ジョブ全体のステータスが「診断中」のため、このジョブが表示されない
   - ユーザーが「診断中」でフィルタリングすると、板金作業の存在が分からない

**影響:**
- 複合作業の一部のステータスでフィルタリングできない
- 外注作業の進捗を追跡しにくい

### 2-2. 並び替えの問題

**現状:**
```typescript
// 現在の実装（page.tsx:925-940）
switch (sortOption) {
  case "arrivalTime":
    // 入庫時間順（古い順）
    const timeA = a.job.field22 ? new Date(a.job.field22).getTime() : 0;
    const timeB = b.job.field22 ? new Date(b.job.field22).getTime() : 0;
    return timeA - timeB;
  // ...
}
```

**問題点:**
1. 複合作業の場合、各WorkOrderの開始時間を考慮していない
2. 例: 車検（10:00開始）+ 板金（14:00開始）の場合
   - 入庫時間は同じだが、板金作業の開始時間が遅い
   - ユーザーは「最も早く開始された作業」または「最も遅く開始された作業」で並び替えたい可能性がある

**影響:**
- 複合作業の作業開始時間を考慮した並び替えができない
- 作業の進捗状況を考慮した並び替えができない

### 2-3. 優先度計算の問題

**現状:**
```typescript
// 現在の実装（page.tsx:891-911）
const getJobPriority = (job: ZohoJob): number => {
  let priority = 0;
  // 緊急対応案件は優先度高
  if (job.isUrgent || job.field7?.includes("【緊急対応】")) {
    priority += 20;
  }
  // 受付メモあり
  if (job.field) priority += 10;
  // 事前入力あり
  if (job.field7 && !job.field7.includes("【緊急対応】")) priority += 5;
  return priority;
};
```

**問題点:**
1. 複合作業の場合、各WorkOrderの進捗状況を考慮していない
2. 例: 車検（完了）+ 板金（外注調整中）の場合
   - 車検は完了しているが、板金が遅れている
   - 優先度計算で「遅れているWorkOrder」を考慮すべき

**影響:**
- 複合作業の一部が遅れている場合、優先度が適切に反映されない

---

## 3. 改善提案

### 3-1. ステータスフィルターの改善

**提案A: WorkOrderのステータスも考慮する（推奨）**

```typescript
// filter-utils.ts の改善案
if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
  const hasMatchingStatus = filters.status.some((status) => {
    // ジョブ全体のステータスをチェック
    if (job.field5 === status) return true;
    
    // 複合作業の場合、WorkOrderのステータスもチェック
    if (job.field_work_orders) {
      try {
        const workOrders = parseWorkOrdersFromZoho(job.field_work_orders, job.id);
        return workOrders.some((wo) => wo.status === status);
      } catch (error) {
        console.warn("WorkOrder parse error in filter:", error);
      }
    }
    
    return false;
  });
  if (!hasMatchingStatus) return false;
}
```

**メリット:**
- 複合作業の一部のステータスでフィルタリングできる
- 外注作業の進捗を追跡しやすい

**デメリット:**
- パフォーマンスへの影響（WorkOrderのパースが必要）
- ただし、既に整備士フィルターで同様の処理をしているため、影響は限定的

**提案B: フィルターオプションを追加する**

```typescript
// FilterState に追加
export interface FilterState {
  // ... 既存のフィルター
  statusFilterMode?: "job" | "workOrder" | "both"; // デフォルト: "both"
}
```

**メリット:**
- ユーザーがフィルターモードを選択できる
- 柔軟性が高い

**デメリット:**
- UIが複雑になる
- ユーザーが混乱する可能性がある

**推奨:** 提案Aを採用（シンプルで直感的）

---

### 3-2. 並び替えの改善

**提案A: WorkOrderの開始時間を考慮する（推奨）**

```typescript
// page.tsx の改善案
case "arrivalTime":
  // 入庫時間順（古い順）
  // 複合作業の場合、最も早く開始されたWorkOrderの開始時間を考慮
  const getEarliestStartTime = (job: ZohoJob): number => {
    const arrivalTime = job.field22 ? new Date(job.field22).getTime() : 0;
    
    if (job.field_work_orders) {
      try {
        const workOrders = parseWorkOrdersFromZoho(job.field_work_orders, job.id);
        const startTimes = workOrders
          .map((wo) => {
            const diagnosisStart = wo.diagnosis?.startedAt 
              ? new Date(wo.diagnosis.startedAt).getTime() 
              : null;
            const workStart = wo.work?.startedAt 
              ? new Date(wo.work.startedAt).getTime() 
              : null;
            return diagnosisStart || workStart || arrivalTime;
          })
          .filter((time) => time !== null) as number[];
        
        if (startTimes.length > 0) {
          return Math.min(...startTimes);
        }
      } catch (error) {
        console.warn("WorkOrder parse error in sort:", error);
      }
    }
    
    return arrivalTime;
  };
  
  const timeA = getEarliestStartTime(a.job);
  const timeB = getEarliestStartTime(b.job);
  return timeA - timeB;
```

**メリット:**
- 複合作業の作業開始時間を考慮した並び替えができる
- より実用的な並び替えが可能

**デメリット:**
- パフォーマンスへの影響（WorkOrderのパースが必要）
- ただし、フィルター処理と同様に、影響は限定的

**提案B: 並び替えオプションを追加する**

```typescript
// sortOption に追加
type SortOption = 
  | "arrivalTime"           // 入庫時間順（古い順）
  | "arrivalTimeDesc"       // 入庫時間順（新しい順）
  | "earliestWorkStart"     // 最も早い作業開始時間順
  | "latestWorkStart"       // 最も遅い作業開始時間順
  | "bookingTime"           // 予約時間順
  | "status";               // ステータス順
```

**メリット:**
- ユーザーが並び替え方法を選択できる
- 柔軟性が高い

**デメリット:**
- UIが複雑になる
- ユーザーが混乱する可能性がある

**推奨:** 提案Aを採用（デフォルトの並び替えを改善）

---

### 3-3. 優先度計算の改善

**提案: WorkOrderの進捗状況を考慮する**

```typescript
// page.tsx の改善案
const getJobPriority = (job: ZohoJob): number => {
  let priority = 0;
  
  // 緊急対応案件は優先度高
  if (job.isUrgent || job.field7?.includes("【緊急対応】")) {
    priority += 20;
  }
  
  // 受付メモあり
  if (job.field) priority += 10;
  
  // 事前入力あり
  if (job.field7 && !job.field7.includes("【緊急対応】")) priority += 5;
  
  // 複合作業の場合、遅れているWorkOrderを考慮
  if (job.field_work_orders) {
    try {
      const workOrders = parseWorkOrdersFromZoho(job.field_work_orders, job.id);
      const now = new Date();
      
      // 遅れているWorkOrderがある場合、優先度を上げる
      const delayedWorkOrders = workOrders.filter((wo) => {
        // 診断中で開始から2時間以上経過
        if (wo.status === "診断中" && wo.diagnosis?.startedAt) {
          const startTime = new Date(wo.diagnosis.startedAt);
          const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          return hoursElapsed >= 2;
        }
        
        // 作業中で開始から4時間以上経過
        if (wo.status === "作業中" && wo.work?.startedAt) {
          const startTime = new Date(wo.work.startedAt);
          const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          return hoursElapsed >= 4;
        }
        
        return false;
      });
      
      if (delayedWorkOrders.length > 0) {
        priority += 15; // 遅れているWorkOrderがある場合、優先度を上げる
      }
    } catch (error) {
      console.warn("WorkOrder parse error in priority:", error);
    }
  }
  
  return priority;
};
```

**メリット:**
- 複合作業の一部が遅れている場合、優先度が適切に反映される
- より実用的な優先度計算が可能

**デメリット:**
- パフォーマンスへの影響（WorkOrderのパースが必要）
- ただし、フィルター処理と同様に、影響は限定的

**推奨:** この提案を採用

---

## 4. 実装優先度

### 高優先度（必須）
1. **ステータスフィルターの改善（提案A）**
   - 複合作業の一部のステータスでフィルタリングできない問題を解決
   - 影響範囲: 中（既存の整備士フィルターと同様の処理）

### 中優先度（推奨）
2. **並び替えの改善（提案A）**
   - 複合作業の作業開始時間を考慮した並び替え
   - 影響範囲: 中（既存の並び替えロジックを拡張）

3. **優先度計算の改善**
   - 複合作業の進捗状況を考慮した優先度計算
   - 影響範囲: 中（既存の優先度計算ロジックを拡張）

### 低優先度（将来検討）
4. **フィルターオプションの追加（提案B）**
   - ユーザーがフィルターモードを選択できる
   - 影響範囲: 大（UIの変更が必要）

5. **並び替えオプションの追加（提案B）**
   - ユーザーが並び替え方法を選択できる
   - 影響範囲: 大（UIの変更が必要）

---

## 5. 実装時の注意点

### 5-1. パフォーマンス
- WorkOrderのパース処理は、既に整備士フィルターで実装済み
- パフォーマンスへの影響は限定的だが、必要に応じてメモ化を検討

### 5-2. 後方互換性
- 単一作業のジョブでも動作することを確認
- `field_work_orders`が存在しない場合のフォールバック処理を実装

### 5-3. エラーハンドリング
- WorkOrderのパースエラーが発生した場合、既存のロジック（`job.field5`）にフォールバック
- エラーログを出力して、問題を追跡可能にする

---

## 6. テスト項目

### 6-1. ステータスフィルター
- [ ] 単一作業のジョブでフィルタリングが正常に動作する
- [ ] 複合作業のジョブで、WorkOrderのステータスでフィルタリングが正常に動作する
- [ ] 複合作業のジョブで、ジョブ全体のステータスでフィルタリングが正常に動作する
- [ ] WorkOrderのパースエラーが発生した場合、既存のロジックにフォールバックする

### 6-2. 並び替え
- [ ] 単一作業のジョブで並び替えが正常に動作する
- [ ] 複合作業のジョブで、最も早い作業開始時間で並び替えが正常に動作する
- [ ] WorkOrderの開始時間が存在しない場合、入庫時間で並び替えが正常に動作する

### 6-3. 優先度計算
- [ ] 単一作業のジョブで優先度計算が正常に動作する
- [ ] 複合作業のジョブで、遅れているWorkOrderがある場合、優先度が適切に反映される
- [ ] WorkOrderのパースエラーが発生した場合、既存のロジックにフォールバックする

---

## 7. まとめ

JOBカードの形式が変更され、複合作業管理（WorkOrder）が導入されたため、フィルターと並び替えのロジックを見直す必要があります。

**推奨される改善:**
1. **ステータスフィルター**: WorkOrderのステータスも考慮する（提案A）
2. **並び替え**: WorkOrderの開始時間を考慮する（提案A）
3. **優先度計算**: WorkOrderの進捗状況を考慮する

これらの改善により、複合作業を適切にフィルタリング・並び替えできるようになり、ユーザーの作業効率が向上します。


