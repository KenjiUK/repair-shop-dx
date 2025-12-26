# 改善提案 #3: 部品調達待ち案件の管理機能（輸入車整備工場特有）

**提案日:** 2025-12-21  
**優先度:** 高（輸入車整備工場特有の重要な機能）  
**実装工数見積:** 3-4日  
**影響範囲:** 全役割（受付担当、整備士、管理者、店長）

---

## 提案の概要

輸入車整備工場では、部品の調達に時間がかかることが多く、部品調達待ちの案件を適切に管理する必要があります。現在のシステムでは、部品調達待ちの案件を専用のステータスとして管理できず、コメント欄などに記録する必要があります。

本提案では、以下の機能を追加します：
1. **部品調達待ちの案件を専用のステータスとして管理できる機能**
2. **部品の到着予定日を記録できる機能**
3. **部品到着の通知機能**
4. **部品調達待ち案件のフィルター機能**
5. **部品調達状況の可視化**

---

## なぜ必要か：ユーザーコメントから

### 📧 受付担当（山田 花子様）のコメント

**追加シナリオ15: 輸入車特有の部品調達待ち案件の管理**

**質問1: 部品調達待ちの案件がすぐに確認できましたか？**
- [x] できた（4点）

**コメント:**
> 「輸入車の場合、部品の調達に時間がかかることが多いです。現在のシステムでは、部品調達待ちの案件を専用のステータスとして管理する機能はまだないようですが、コメント欄などに記録することで対応できます。部品調達待ちの案件を専用のステータスとして管理できる機能があると、もっと便利だと思います。特に、部品の到着予定日を記録できると、お客様への説明もしやすいです。」

**質問2: 部品到着の確認がスムーズに行えましたか？**
- [x] できた（4点）

**コメント:**
> 「部品が到着した際、その情報を記録できる機能があると良いと思います。特に、部品到着の通知機能があると、整備士や管理者にもすぐに伝わって、作業を再開しやすくなります。」

**追加で必要な機能:**
> - 部品調達待ちの案件を専用のステータスとして管理できる機能
> - 部品の到着予定日を記録できる機能
> - 部品到着の通知機能

**業務上の課題:**
- 輸入車の場合、部品の調達に時間がかかることが多く、部品調達待ちの案件を適切に管理する必要がある
- お客様から「部品はいつ到着しますか？」と聞かれた際、到着予定日をすぐに確認できない
- 部品が到着した際、整備士や管理者にすぐに伝わらない

---

### 🔧 整備士（佐藤 健一様）のコメント

**追加シナリオ17: 部品の在庫確認・発注待ち**

**質問1: 部品の在庫確認が必要な際、その情報を記録できましたか？**
- [x] できた（4点）

**コメント:**
> 「診断結果の入力画面で、コメント欄に部品の在庫確認が必要な旨を記録できます。ただ、部品の在庫確認を専用の項目として記録できる機能があると、もっと便利だと思います。特に、部品名や部品番号も記録できると、発注もしやすいです。」

**質問2: 部品の発注待ち状況がすぐに確認できましたか？**
- [x] できた（4点）

**コメント:**
> 「現在のシステムでは、部品の発注待ち状況を専用のステータスとして管理する機能はまだないようですが、コメント欄などに記録することで対応できます。部品の発注待ち状況を専用のステータスとして管理できる機能があると、もっと便利だと思います。」

**追加で必要な機能:**
> - 部品の発注待ち状況を専用のステータスとして管理できる機能
> - 部品名や部品番号を記録できる機能

**業務上の課題:**
- 部品の在庫確認や発注待ちの状況を記録する必要があるが、専用の項目がない
- 部品が到着した際、すぐに作業を再開したいが、通知がないと気づけない

---

### 👔 管理者（鈴木 太郎様）のコメント

**追加シナリオ15: 輸入車特有の部品調達待ち案件の見積調整**

**質問1: 部品調達待ちの案件の見積を調整する際、部品情報がすぐに確認できましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「診断結果に記録された部品情報は、見積作成画面でも確認できるので、見積の調整もしやすいです。ただ、部品の調達状況や到着予定日を記録できる機能があると、もっと便利だと思います。」

**追加で必要な機能:**
> - 部品の調達状況や到着予定日を記録できる機能

**業務上の課題:**
- 部品調達待ちの案件の見積を調整する際、部品の調達状況や到着予定日を確認したい
- 部品価格の変動を反映した見積の調整が必要な場合がある

---

### 👨‍💼 店長（高橋 美咲様）のコメント

**追加シナリオ15: 輸入車特有の部品調達待ち案件の管理**

**質問1: 部品調達待ちの案件がすぐに確認できましたか？**
- [x] できた（4点）

**コメント:**
> 「輸入車の場合、部品の調達に時間がかかることが多いです。現在のシステムでは、部品調達待ちの案件を専用のステータスとして管理する機能はまだないようですが、コメント欄などに記録することで対応できます。部品調達待ちの案件を専用のステータスとして管理できる機能があると、もっと便利だと思います。特に、部品の到着予定日を記録できると、全体のスケジュール管理もしやすいです。」

**追加で必要な機能:**
> - 部品調達待ちの案件を専用のステータスとして管理できる機能
> - 部品の到着予定日を記録できる機能

**業務上の課題:**
- 部品調達待ち案件の管理が困難
- 全体のスケジュール管理の際、部品の到着予定日を確認したい

---

## 現在の実装状況

### 実装済みの機能

1. **ステータス管理**
   - 入庫待ち、診断待ち、見積作成待ち、お客様承認待ち、作業待ち、引渡待ちなどのステータスが存在
   - ステータス別のフィルター機能が実装済み

2. **コメント機能**
   - ジョブメモ機能で、部品調達待ちの情報を記録可能
   - ただし、専用の項目ではないため、管理が困難

### 未実装の機能

1. **部品調達待ちステータス**
   - 「部品調達待ち」という専用のステータスがない
   - 「部品発注待ち」という専用のステータスがない

2. **部品情報の記録**
   - 部品名、部品番号、数量などの情報を記録する専用項目がない
   - 部品の到着予定日を記録する項目がない
   - 部品の調達状況（発注済み、配送中、到着済みなど）を記録する項目がない

3. **部品到着通知機能**
   - 部品が到着した際の通知機能がない
   - 整備士や管理者への通知機能がない

4. **部品調達待ち案件のフィルター**
   - 部品調達待ち案件だけをフィルターで表示する機能がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. AI駆動のパーソナライゼーションと自動化

**事例:**
- **SAP Ariba**: AIを活用して、部品調達パターンを分析し、パーソナライズされた推奨事項を提供。自動化により、ワークフローを効率化。
- **Coupa**: AIを活用して、部品調達の最適化を提案。

**ベストプラクティス:**
- AIを活用して、部品調達パターンを分析
- パーソナライズされた推奨事項を提供
- 自動化により、ワークフローを効率化

---

### 2. データ駆動の意思決定

**事例:**
- **Oracle Procurement Cloud**: リアルタイムのデータ分析を提供し、サプライヤーのパフォーマンス指標や在庫レベルなどの実用的な洞察を提供。
- **Microsoft Dynamics 365**: 部品調達のデータを可視化し、意思決定を支援。

**ベストプラクティス:**
- リアルタイムのデータ分析を提供
- サプライヤーのパフォーマンス指標や在庫レベルなどの実用的な洞察を提供
- データを可視化し、意思決定を支援

---

### 3. モバイル最適化とレスポンシブデザイン

**事例:**
- **Zoho Inventory**: モバイルファーストのデザインを採用し、スマートフォンやタブレットで快適に操作できる。
- **TradeGecko**: モバイルで部品調達を管理できる機能を提供。

**ベストプラクティス:**
- モバイルファーストのデザインを採用
- スマートフォンやタブレットで快適に操作できる
- 外出先でも部品調達を管理できる

---

### 4. プロアクティブなエラー防止

**事例:**
- **NetSuite**: 入力検証や確認ダイアログを実装し、エラーを事前に防止。
- **Infor**: 部品調達の際、在庫不足や価格変動などの警告を表示。

**ベストプラクティス:**
- 入力検証や確認ダイアログを実装
- エラーを事前に防止
- 在庫不足や価格変動などの警告を表示

---

### 5. 通知機能の実装

**事例:**
- **Slack**: 部品到着時に、関連するチャンネルに通知を送信。
- **Microsoft Teams**: 部品調達の進捗を通知する機能を提供。

**ベストプラクティス:**
- 部品到着時に、関連するスタッフに通知を送信
- プッシュ通知、メール通知、アプリ内通知など、複数の通知方法を提供
- 通知の優先度を設定可能にする

---

### 6. ステータス管理の可視化

**事例:**
- **Trello**: カンバンボード形式で、部品調達の進捗を可視化。
- **Asana**: タイムライン形式で、部品調達のスケジュールを可視化。

**ベストプラクティス:**
- カンバンボード形式で、部品調達の進捗を可視化
- タイムライン形式で、部品調達のスケジュールを可視化
- 色分けやアイコンで、ステータスを視覚的に区別

---

## 実装方法の詳細

### 1. ステータスの追加

**実装方法:**
```typescript
// ステータスの定義に追加
type JobStatus = 
  | "入庫待ち"
  | "入庫済み"
  | "見積作成待ち"
  | "見積提示済み"
  | "作業待ち"
  | "出庫待ち"
  | "部品調達待ち"      // 新規追加
  | "部品発注待ち";      // 新規追加

// ステータス設定の追加
const statusConfig = {
  // ... 既存のステータス
  部品調達待ち: {
    icon: Package,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    priority: 2,
  },
  部品発注待ち: {
    icon: ShoppingCart,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    priority: 2,
  },
};
```

---

### 2. 部品情報のデータ構造

**実装方法:**
```typescript
// 部品情報の型定義
interface PartsInfo {
  parts: PartItem[];              // 部品リスト
  expectedArrivalDate: string | null; // 到着予定日
  procurementStatus: "not_ordered" | "ordered" | "shipping" | "arrived"; // 調達状況
  lastUpdatedAt: string;          // 最終更新日時
}

interface PartItem {
  id: string;                      // 部品ID
  name: string;                    // 部品名
  partNumber: string | null;       // 部品番号
  quantity: number;                // 数量
  unitPrice: number | null;        // 単価
  supplier: string | null;         // サプライヤー
  orderDate: string | null;        // 発注日
  expectedArrivalDate: string | null; // 到着予定日
  actualArrivalDate: string | null;  // 実際の到着日
  status: "not_ordered" | "ordered" | "shipping" | "arrived"; // ステータス
}
```

---

### 3. 部品情報の記録UI

**実装方法:**
```tsx
// 部品情報入力ダイアログ
<Dialog open={isPartsDialogOpen} onOpenChange={setIsPartsDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>部品調達情報</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* 部品リスト */}
      <div>
        <Label>部品リスト</Label>
        {partsInfo.parts.map((part, index) => (
          <div key={part.id} className="flex items-center gap-2 p-2 border rounded">
            <Input
              value={part.name}
              onChange={(e) => updatePart(index, { name: e.target.value })}
              placeholder="部品名"
            />
            <Input
              value={part.partNumber || ""}
              onChange={(e) => updatePart(index, { partNumber: e.target.value })}
              placeholder="部品番号"
            />
            <Input
              type="number"
              value={part.quantity}
              onChange={(e) => updatePart(index, { quantity: parseInt(e.target.value) || 0 })}
              placeholder="数量"
            />
            <Input
              type="date"
              value={part.expectedArrivalDate || ""}
              onChange={(e) => updatePart(index, { expectedArrivalDate: e.target.value })}
              placeholder="到着予定日"
            />
            <Select
              value={part.status}
              onValueChange={(value) => updatePart(index, { status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_ordered">未発注</SelectItem>
                <SelectItem value="ordered">発注済み</SelectItem>
                <SelectItem value="shipping">配送中</SelectItem>
                <SelectItem value="arrived">到着済み</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removePart(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          onClick={() => addPart()}
          className="w-full mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          部品を追加
        </Button>
      </div>
      
      {/* 到着予定日（全体） */}
      <div>
        <Label>到着予定日（全体）</Label>
        <Input
          type="date"
          value={partsInfo.expectedArrivalDate || ""}
          onChange={(e) => setPartsInfo((prev) => ({ ...prev, expectedArrivalDate: e.target.value }))}
        />
      </div>
      
      {/* 調達状況 */}
      <div>
        <Label>調達状況</Label>
        <Select
          value={partsInfo.procurementStatus}
          onValueChange={(value) => setPartsInfo((prev) => ({ ...prev, procurementStatus: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_ordered">未発注</SelectItem>
            <SelectItem value="ordered">発注済み</SelectItem>
            <SelectItem value="shipping">配送中</SelectItem>
            <SelectItem value="arrived">到着済み</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    
    <DialogFooter>
      <Button onClick={handleSavePartsInfo}>保存</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 4. ジョブカードへの部品情報表示

**実装方法:**
```tsx
// ジョブカード内に部品情報を表示
{job.partsInfo && job.partsInfo.parts.length > 0 && (
  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
    <div className="flex items-center gap-2 mb-2">
      <Package className="h-4 w-4 text-amber-600" />
      <span className="text-sm font-medium text-amber-900">部品調達情報</span>
    </div>
    <div className="space-y-1">
      {job.partsInfo.parts.map((part) => (
        <div key={part.id} className="text-xs text-amber-800">
          {part.name} × {part.quantity}
          {part.expectedArrivalDate && (
            <span className="ml-2 text-amber-600">
              (到着予定: {formatDate(part.expectedArrivalDate)})
            </span>
          )}
        </div>
      ))}
      {job.partsInfo.expectedArrivalDate && (
        <div className="text-xs font-medium text-amber-900 mt-2">
          全体の到着予定日: {formatDate(job.partsInfo.expectedArrivalDate)}
        </div>
      )}
    </div>
  </div>
)}
```

---

### 5. 部品到着通知機能

**実装方法:**
```typescript
// 部品到着通知の送信
async function handlePartsArrived(jobId: string, partId: string) {
  // 部品のステータスを「到着済み」に更新
  const updatedJob = await updatePartStatus(jobId, partId, "arrived");
  
  // すべての部品が到着済みか確認
  const allPartsArrived = updatedJob.partsInfo.parts.every(
    (part) => part.status === "arrived"
  );
  
  if (allPartsArrived) {
    // すべての部品が到着した場合、通知を送信
    await sendNotification({
      type: "parts_arrived",
      jobId: jobId,
      message: "すべての部品が到着しました。作業を再開できます。",
      recipients: ["mechanic", "admin"], // 整備士と管理者に通知
    });
    
    // ステータスを「作業待ち」に変更（オプション）
    await updateJobStatus(jobId, "作業待ち");
  } else {
    // 一部の部品が到着した場合
    await sendNotification({
      type: "part_arrived",
      jobId: jobId,
      message: "部品が到着しました。",
      recipients: ["mechanic", "admin"],
    });
  }
}
```

---

### 6. 部品調達待ち案件のフィルター

**実装方法:**
```typescript
// フィルターに「部品調達待ち」を追加
const filteredJobs = useMemo(() => {
  return jobs.filter((job) => {
    // ... 既存のフィルター
    
    // 部品調達待ちフィルター
    if (filters.partsProcurement === "waiting") {
      if (job.field5 !== "部品調達待ち" && job.field5 !== "部品発注待ち") {
        return false;
      }
    }
    
    return true;
  });
}, [jobs, filters]);
```

---

## 期待される効果

### 業務効率の向上

1. **部品調達待ち案件の管理の効率化**
   - 部品調達待ち案件を専用のステータスとして管理できるため、管理が容易になる
   - 部品調達待ち案件だけをフィルターで表示できるため、素早く確認できる
   - **時間短縮:** 部品調達待ち案件の確認時間が約60%短縮（推定）

2. **お客様への説明の改善**
   - 部品の到着予定日を記録できるため、お客様への説明がしやすくなる
   - 部品の調達状況を視覚的に表示できるため、お客様にも分かりやすい

3. **作業再開の迅速化**
   - 部品到着時に通知が送信されるため、整備士や管理者がすぐに気づける
   - 作業を再開するタイミングを逃さない
   - **時間短縮:** 部品到着から作業再開までの時間が約50%短縮（推定）

---

### 輸入車整備工場特有の業務の効率化

1. **部品調達の可視化**
   - 部品調達の進捗を可視化できるため、全体のスケジュール管理が容易になる
   - 部品調達待ち案件の数を一目で把握できる

2. **部品情報の一元管理**
   - 部品名、部品番号、数量、到着予定日などの情報を一元管理できる
   - 部品の発注状況を追跡できる

---

## 実装の優先度と理由

### 優先度: 高（輸入車整備工場特有の重要な機能）

**理由:**

1. **輸入車整備工場特有の重要な機能**
   - 輸入車の場合、部品の調達に時間がかかることが多く、この機能は不可欠
   - 全役割から、この機能の追加を要望されている

2. **業務効率への直接的な影響**
   - 部品調達待ち案件の確認時間が約60%短縮（推定）
   - 部品到着から作業再開までの時間が約50%短縮（推定）
   - お客様への説明がしやすくなる

3. **顧客満足度への影響**
   - 部品の到着予定日を明確に伝えられるため、顧客満足度が向上
   - 部品到着時にすぐに作業を再開できるため、納期が短縮される可能性

4. **実装の複雑さ**
   - ステータスの追加、データ構造の拡張、通知機能の実装など、やや複雑
   - 実装工数: 3-4日（見積）

---

## 実装スケジュール

### Phase 1: データ構造の拡張（1日）
- `PartsInfo`、`PartItem`型の定義
- ジョブデータに部品情報を追加
- APIの拡張

### Phase 2: ステータスの追加（0.5日）
- 「部品調達待ち」「部品発注待ち」ステータスの追加
- ステータス設定の追加
- フィルター機能の拡張

### Phase 3: UIコンポーネントの実装（1.5日）
- 部品情報入力ダイアログの実装
- ジョブカードへの部品情報表示
- 部品調達待ち案件のフィルターUI

### Phase 4: 通知機能の実装（0.5-1日）
- 部品到着通知の送信機能
- 通知UIの実装
- プッシュ通知、メール通知の統合（将来の拡張）

**合計:** 3.5-4日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Receptionist_山田花子_20251221.md`](../reviews/UX_TESTING_REVIEW_Receptionist_山田花子_20251221.md) - 受付担当のレビュー
- [`reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md`](../reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md) - 整備士のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #3 を作成



