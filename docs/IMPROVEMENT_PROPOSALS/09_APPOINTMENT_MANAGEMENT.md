# 改善提案 #9: 予約変更・キャンセル機能の実装

**提案日:** 2025-12-21  
**優先度:** 中（受付業務の効率化）  
**実装工数見積:** 2-3日  
**影響範囲:** 受付担当

---

## 提案の概要

現在のシステムでは、予約変更やキャンセルの処理は、Zoho CRM側で行う必要があります。お客様から電話で「予約を変更したい」と言われた時に、すぐにアプリ内で対応できないことが課題です。

本提案では、以下の機能を追加します：
1. **アプリ内から直接予約変更ができる機能**
2. **アプリ内から直接キャンセルができる機能**
3. **キャンセルした案件を確認できる機能**（フィルターなど）
4. **予約変更履歴の記録機能**

---

## なぜ必要か：ユーザーコメントから

### 📧 受付担当（山田 花子様）のコメント

**追加シナリオ10: 急な予約変更・キャンセルの対応**

**質問1: 予約変更やキャンセルの処理がスムーズに行えましたか？**
- [x] できた（4点）

**コメント:**
> 「現在のシステムでは、予約変更やキャンセルの処理は、Zoho CRM側で行う必要があるようです。アプリ内から直接予約変更やキャンセルができる機能があると、もっと便利だと思います。特に、お客様から電話で「予約を変更したい」と言われた時に、すぐにアプリ内で対応できると良いです。」

**質問2: キャンセルした案件が一覧から適切に除外されましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「キャンセルした案件は、ステータスが更新されると、一覧から適切に除外されるようです。ただ、キャンセルした案件を確認できる機能（フィルターなど）があると、過去の履歴を確認できて便利だと思います。」

**追加で必要な機能:**
> - アプリ内から直接予約変更やキャンセルができる機能
> - キャンセルした案件を確認できる機能（フィルターなど）

**業務上の課題:**
- お客様から電話で「予約を変更したい」と言われた時に、すぐにアプリ内で対応したい
- キャンセルした案件の履歴を確認したい
- Zoho CRM側で処理する必要があり、手間がかかる

---

## 現在の実装状況

### 実装済みの機能

1. **案件管理機能**
   - 案件のステータスを管理できる機能が実装済み
   - 案件の一覧表示機能が実装済み

2. **フィルター機能**
   - ステータス別のフィルター機能が実装済み

### 未実装の機能

1. **予約変更機能**
   - アプリ内から直接予約を変更する機能がない
   - 予約時間の変更機能がない

2. **キャンセル機能**
   - アプリ内から直接キャンセルする機能がない
   - キャンセル理由を記録する機能がない

3. **キャンセル案件のフィルター**
   - キャンセルした案件をフィルターで表示する機能がない

4. **予約変更履歴**
   - 予約変更の履歴を記録する機能がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. 予約プロセスの簡素化

**事例:**
- **Calendly**: 予約プロセスを最小限のステップに簡素化。明確な進捗インジケーターを実装。
- **Acuity Scheduling**: 予約変更・キャンセルを簡単に操作できるUIを提供。

**ベストプラクティス:**
- 予約プロセスを最小限のステップに簡素化
- 明確な進捗インジケーターを実装
- 予約変更・キャンセルを簡単に操作できるUIを提供

---

### 2. モバイルユーザビリティの向上

**事例:**
- **Square Appointments**: モバイルデバイスに最適化されたインターフェースを提供。タッチ操作に最適化された大きなタップ領域を提供。
- **Mindbody**: モバイルファーストのアプローチで、予約変更・キャンセル機能を提供。

**ベストプラクティス:**
- モバイルデバイスに最適化されたインターフェースを提供
- タッチ操作に最適化された大きなタップ領域を提供
- モバイルファーストのアプローチを採用

---

### 3. リアルタイム可用性の提供

**事例:**
- **Calendly**: リアルタイムのカレンダー統合を実装し、二重予約を防止。
- **Acuity Scheduling**: リアルタイムの可用性を表示し、正確なスケジューリングオプションを提供。

**ベストプラクティス:**
- リアルタイムのカレンダー統合を実装し、二重予約を防止
- リアルタイムの可用性を表示
- 即座の確認を提供

---

### 4. 透明な価格とポリシー

**事例:**
- **Square Appointments**: サービス価格、予想時間、追加料金を事前に明確に表示。
- **Mindbody**: キャンセルポリシーを明確に伝達。

**ベストプラクティス:**
- サービス価格、予想時間、追加料金を事前に明確に表示
- キャンセルポリシーを明確に伝達
- ユーザーの期待を管理

---

### 5. 簡単な再スケジュールとキャンセル

**事例:**
- **Calendly**: ユーザーがアプリ内で簡単に予約を再スケジュールまたはキャンセルできる。
- **Acuity Scheduling**: 確認ダイアログを使用し、予約の詳細を要約し、確認または変更のオプションを提供。

**ベストプラクティス:**
- ユーザーがアプリ内で簡単に予約を再スケジュールまたはキャンセルできる
- 確認ダイアログを使用し、予約の詳細を要約
- 確認または変更のオプションを提供

---

### 6. タイムリーなリマインダーと通知

**事例:**
- **Calendly**: 自動リマインダーをメールまたはSMSで送信。
- **Acuity Scheduling**: 予約の変更（再スケジュールやキャンセルなど）について、ユーザーに即座に通知。

**ベストプラクティス:**
- 自動リマインダーをメールまたはSMSで送信
- 予約の変更について、ユーザーに即座に通知
- 信頼と満足度を維持

---

## 実装方法の詳細

### 1. 予約変更機能

**実装方法:**
```tsx
// ジョブカードに「予約変更」ボタンを追加
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setSelectedJob(job);
    setIsRescheduleDialogOpen(true);
  }}
  className="flex items-center gap-2"
>
  <Calendar className="h-4 w-4" />
  予約変更
</Button>

// 予約変更ダイアログ
<Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>予約を変更</DialogTitle>
      <DialogDescription>
        {selectedJob?.field4?.name}様 - {selectedJob?.field6?.name}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>現在の予約日時</Label>
        <div className="text-sm text-slate-600">
          {formatDateTime(selectedJob?.field22)}
        </div>
      </div>
      
      <div>
        <Label>新しい予約日時</Label>
        <Input
          type="datetime-local"
          value={newAppointmentDateTime}
          onChange={(e) => setNewAppointmentDateTime(e.target.value)}
        />
      </div>
      
      <div>
        <Label>変更理由</Label>
        <Textarea
          value={rescheduleReason}
          onChange={(e) => setRescheduleReason(e.target.value)}
          placeholder="変更理由を入力（任意）"
        />
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>
          キャンセル
        </Button>
        <Button onClick={handleRescheduleConfirm}>変更を確定</Button>
      </DialogFooter>
    </div>
  </DialogContent>
</Dialog>
```

---

### 2. キャンセル機能

**実装方法:**
```tsx
// ジョブカードに「キャンセル」ボタンを追加
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setSelectedJob(job);
    setIsCancelDialogOpen(true);
  }}
  className="flex items-center gap-2 text-red-600 hover:text-red-700"
>
  <X className="h-4 w-4" />
  キャンセル
</Button>

// キャンセル確認ダイアログ
<Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>予約をキャンセル</DialogTitle>
      <DialogDescription>
        {selectedJob?.field4?.name}様 - {selectedJob?.field6?.name}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>予約日時</Label>
        <div className="text-sm text-slate-600">
          {formatDateTime(selectedJob?.field22)}
        </div>
      </div>
      
      <div>
        <Label>キャンセル理由</Label>
        <Textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="キャンセル理由を入力（任意）"
        />
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>注意</AlertTitle>
        <AlertDescription>
          この操作は取り消せません。キャンセル後、この案件は「キャンセル」ステータスになります。
        </AlertDescription>
      </Alert>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
          閉じる
        </Button>
        <Button variant="destructive" onClick={handleCancelConfirm}>
          キャンセルを確定
        </Button>
      </DialogFooter>
    </div>
  </DialogContent>
</Dialog>
```

---

### 3. キャンセル案件のフィルター

**実装方法:**
```typescript
// ステータスに「キャンセル」を追加
type JobStatus = 
  | "入庫待ち"
  | "入庫済み"
  | "見積作成待ち"
  | "見積提示済み"
  | "作業待ち"
  | "出庫待ち"
  | "キャンセル"; // 新規追加

// フィルターに「キャンセル」を追加
const filteredJobs = useMemo(() => {
  return jobs.filter((job) => {
    // ... 既存のフィルター
    
    // キャンセル案件のフィルター
    if (filters.showCancelled === false && job.field5 === "キャンセル") {
      return false;
    }
    
    return true;
  });
}, [jobs, filters]);
```

---

### 4. 予約変更履歴の記録

**実装方法:**
```typescript
// 予約変更履歴のデータ構造
interface AppointmentChangeHistory {
  id: string;
  jobId: string;
  changeType: "reschedule" | "cancel"; // 変更タイプ
  oldDateTime: string | null;          // 変更前の日時
  newDateTime: string | null;          // 変更後の日時
  reason: string | null;               // 変更理由
  changedBy: string;                   // 変更者
  changedAt: string;                   // 変更日時
}

// 予約変更履歴を記録
async function handleRescheduleConfirm() {
  // 予約変更履歴を記録
  const history: AppointmentChangeHistory = {
    id: generateId(),
    jobId: selectedJob.id,
    changeType: "reschedule",
    oldDateTime: selectedJob.field22,
    newDateTime: newAppointmentDateTime,
    reason: rescheduleReason,
    changedBy: getCurrentUser(),
    changedAt: new Date().toISOString(),
  };
  
  await saveAppointmentChangeHistory(history);
  
  // 案件の予約日時を更新
  await updateJobField22(selectedJob.id, newAppointmentDateTime);
  
  toast.success("予約を変更しました", {
    description: `${formatDateTime(selectedJob.field22)} → ${formatDateTime(newAppointmentDateTime)}`,
  });
  
  setIsRescheduleDialogOpen(false);
  setNewAppointmentDateTime("");
  setRescheduleReason("");
}
```

---

## 期待される効果

### 業務効率の向上

1. **電話対応時の迅速な対応**
   - お客様から電話で「予約を変更したい」と言われた時に、すぐにアプリ内で対応できる
   - Zoho CRM側で処理する必要がなくなり、手間が削減される
   - **時間短縮:** 予約変更の処理時間が約50%短縮（推定）

2. **キャンセル案件の管理**
   - キャンセルした案件をフィルターで表示できるため、過去の履歴を確認できる
   - キャンセル理由を記録できるため、分析が可能

3. **予約変更履歴の管理**
   - 予約変更の履歴を記録できるため、変更の経緯を追跡できる
   - お客様への説明時に、変更履歴を参照できる

---

### ユーザー体験の向上

1. **操作の簡素化**
   - 予約変更・キャンセルが簡単に操作できる
   - 確認ダイアログにより、誤操作を防止

2. **透明性の向上**
   - 予約変更・キャンセルの理由を記録できる
   - 変更履歴を確認できる

---

## 実装の優先度と理由

### 優先度: 中（受付業務の効率化）

**理由:**

1. **受付業務の効率化**
   - 予約変更の処理時間が約50%短縮（推定）
   - お客様からの電話対応時に、すぐにアプリ内で対応できる

2. **実装の容易さ**
   - 既存の案件管理機能を拡張するだけで実装可能
   - 実装工数: 2-3日（見積）

3. **ユーザー要望**
   - 受付担当から、この機能の追加を要望されている
   - ただし、最優先機能ではない

---

## 実装スケジュール

### Phase 1: ステータスの追加（0.5日）
- 「キャンセル」ステータスの追加
- ステータス設定の追加

### Phase 2: 予約変更機能の実装（1日）
- 予約変更ダイアログの実装
- 予約日時の更新機能
- 予約変更履歴の記録機能

### Phase 3: キャンセル機能の実装（0.5日）
- キャンセル確認ダイアログの実装
- キャンセル処理機能
- キャンセル理由の記録機能

### Phase 4: キャンセル案件のフィルター（0.5日）
- キャンセル案件のフィルター機能
- フィルターUIの実装

**合計:** 2.5-3日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Receptionist_山田花子_20251221.md`](../reviews/UX_TESTING_REVIEW_Receptionist_山田花子_20251221.md) - 受付担当のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #9 を作成



