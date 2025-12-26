# 改善提案 #12: 顧客満足度管理機能の実装

**提案日:** 2025-12-21  
**優先度:** 中（顧客満足度の向上）  
**実装工数見積:** 2-3日  
**影響範囲:** 全役割（受付担当、整備士、管理者、店長）

---

## 提案の概要

現在のシステムでは、顧客満足度をコメント欄などに記録する必要があります。顧客満足度を専用の項目として記録し、低い満足度の案件をフィルターで表示することで、顧客満足度の向上と問題の早期発見が可能になります。

本提案では、以下の機能を追加します：
1. **顧客満足度を専用の項目として記録できる機能**
2. **顧客満足度の低い案件を専用のフィルターで表示できる機能**
3. **顧客満足度の可視化機能**（グラフなど）
4. **顧客満足度の分析機能**（将来の拡張）

---

## なぜ必要か：ユーザーコメントから

### 👨‍💼 店長（高橋 美咲様）のコメント

**追加シナリオ21: 顧客満足度の管理**

**質問1: 顧客満足度の情報がすぐに確認できましたか？**
- [x] できた（4点）

**コメント:**
> 「現在のシステムでは、顧客満足度を専用の項目として記録する機能はまだないようですが、コメント欄などに記録することで対応できます。顧客満足度を専用の項目として記録できる機能があると、もっと便利だと思います。」

**質問2: 顧客満足度の低い案件への対応がスムーズに行えましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「顧客満足度の低い案件への対応は、コメント欄などに記録されている情報を確認しながら行えます。特に、顧客満足度の低い案件を専用のフィルターで表示できる機能があると、もっと便利だと思います。」

**追加で必要な機能:**
> - 顧客満足度を専用の項目として記録できる機能
> - 顧客満足度の低い案件を専用のフィルターで表示できる機能

**業務上の課題:**
- 顧客満足度を専用の項目として記録したい
- 顧客満足度の低い案件を素早く識別して、対応したい
- 顧客満足度の傾向を分析して、業務を改善したい

---

### 📧 受付担当（山田 花子様）のコメント

**業務上の課題:**
- お客様からのフィードバックを記録したい
- 顧客満足度の低い案件を優先的に対応したい

---

## 現在の実装状況

### 実装済みの機能

1. **コメント機能**
   - ジョブメモ機能で、顧客満足度の情報を記録可能
   - ただし、専用の項目ではないため、管理が困難

2. **フィルター機能**
   - ステータス別、入庫区分別のフィルター機能が実装済み

### 未実装の機能

1. **顧客満足度の専用項目**
   - 顧客満足度を記録する専用項目がない
   - 顧客満足度の評価（1-5点など）を記録する項目がない

2. **顧客満足度のフィルター**
   - 顧客満足度の低い案件をフィルターで表示する機能がない

3. **顧客満足度の可視化**
   - 顧客満足度をグラフで表示する機能がない
   - 顧客満足度の傾向を分析する機能がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. ユーザージャーニーの簡素化

**事例:**
- **Amazon**: 不要なステップを削減し、明確なナビゲーションを提供することで、ユーザーの満足度を向上。「1-Click Order」機能により、購入を迅速に完了できる。
- **Netflix**: ユーザーのインタラクションを簡素化し、満足度を向上。

**ベストプラクティス:**
- 不要なステップを削減
- 明確なナビゲーションを提供
- ユーザーの満足度を向上

---

### 2. マイクロインタラクションの実装

**事例:**
- **Spotify**: 微妙なアニメーションやフィードバックメカニズム（ボタンのリップルや成功チェックマークなど）を組み込む。
- **Notion**: マイクロインタラクションにより、インターフェースをより魅力的で直感的にする。

**ベストプラクティス:**
- 微妙なアニメーションやフィードバックメカニズムを組み込む
- ユーザーの信頼を構築し、全体的な体験を向上
- インターフェースをより魅力的で直感的にする

---

### 3. パーソナライズされたユーザー体験

**事例:**
- **Spotify**: データを活用して、コンテンツ、製品推奨、レイアウトを個々のユーザーの行動に合わせて調整。
- **Netflix**: ユーザーの行動に基づいて、パーソナライズされた推奨事項を提供。

**ベストプラクティス:**
- データを活用して、コンテンツ、製品推奨、レイアウトを個々のユーザーの行動に合わせて調整
- 理解と忠誠心の感覚を育む
- パーソナライズされた体験を提供

---

### 4. 反復的なフィードバックループの組み込み

**事例:**
- **Netflix**: 調査、ユーザビリティテスト、分析を通じて継続的にユーザーフィードバックを収集・分析。
- **Amazon**: データ駆動のフィードバックループを使用して、推奨アルゴリズムを改善。

**ベストプラクティス:**
- 調査、ユーザビリティテスト、分析を通じて継続的にユーザーフィードバックを収集・分析
- 痛みのポイントを特定し、設計の改善を通知
- データ駆動のフィードバックループを使用

---

### 5. リアルタイムフィードバックメカニズムの実装

**事例:**
- **GitHub**: ローディングインジケーター、確認メッセージ、エラー通知を通じて即座のフィードバックを提供。
- **Jira**: システムの状態についてユーザーに通知し、不確実性を削減し、信頼を向上。

**ベストプラクティス:**
- ローディングインジケーター、確認メッセージ、エラー通知を通じて即座のフィードバックを提供
- システムの状態についてユーザーに通知
- 不確実性を削減し、信頼を向上

---

## 実装方法の詳細

### 1. 顧客満足度のデータ構造

**実装方法:**
```typescript
interface CustomerSatisfaction {
  jobId: string;
  rating: number;                    // 満足度（1-5点）
  feedback: string | null;           // フィードバック内容
  category: "service" | "quality" | "price" | "communication" | "overall"; // カテゴリー
  recordedAt: string;                // 記録日時
  recordedBy: string;                // 記録者
  followUpRequired: boolean;         // フォローアップが必要か
  followUpDate: string | null;       // フォローアップ予定日
  followUpCompleted: boolean;       // フォローアップ完了フラグ
}
```

---

### 2. 顧客満足度の記録UI

**実装方法:**
```tsx
// ジョブカードに顧客満足度を表示
{job.customerSatisfaction && (
  <div className="flex items-center gap-2 mt-2">
    <Label>顧客満足度</Label>
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <Star
          key={rating}
          className={cn(
            "h-4 w-4",
            rating <= job.customerSatisfaction.rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-slate-300"
          )}
        />
      ))}
      <span className="text-sm text-slate-600 ml-1">
        {job.customerSatisfaction.rating}/5
      </span>
    </div>
    {job.customerSatisfaction.followUpRequired && (
      <Badge variant="destructive" className="text-xs">
        要フォローアップ
      </Badge>
    )}
  </div>
)}

// 顧客満足度記録ダイアログ
<Dialog open={isSatisfactionDialogOpen} onOpenChange={setIsSatisfactionDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>顧客満足度を記録</DialogTitle>
      <DialogDescription>
        {selectedJob?.field4?.name}様 - {selectedJob?.field6?.name}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>満足度評価</Label>
        <div className="flex items-center gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => setSatisfactionRating(rating)}
              className={cn(
                "transition-all",
                rating <= satisfactionRating
                  ? "text-yellow-400"
                  : "text-slate-300"
              )}
            >
              <Star className="h-8 w-8" fill={rating <= satisfactionRating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <Label>カテゴリー</Label>
        <Select
          value={satisfactionCategory}
          onValueChange={setSatisfactionCategory}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service">サービス</SelectItem>
            <SelectItem value="quality">品質</SelectItem>
            <SelectItem value="price">価格</SelectItem>
            <SelectItem value="communication">コミュニケーション</SelectItem>
            <SelectItem value="overall">総合</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>フィードバック内容</Label>
        <Textarea
          value={satisfactionFeedback}
          onChange={(e) => setSatisfactionFeedback(e.target.value)}
          placeholder="フィードバック内容を入力（任意）"
          rows={4}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Checkbox
          id="followUpRequired"
          checked={followUpRequired}
          onCheckedChange={setFollowUpRequired}
        />
        <Label htmlFor="followUpRequired" className="cursor-pointer">
          フォローアップが必要
        </Label>
      </div>
      
      {followUpRequired && (
        <div>
          <Label>フォローアップ予定日</Label>
          <Input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </div>
      )}
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsSatisfactionDialogOpen(false)}>
          キャンセル
        </Button>
        <Button onClick={handleSaveSatisfaction}>記録</Button>
      </DialogFooter>
    </div>
  </DialogContent>
</Dialog>
```

---

### 3. 顧客満足度の低い案件のフィルター

**実装方法:**
```typescript
// フィルターに「顧客満足度の低い案件」を追加
const filteredJobs = useMemo(() => {
  return jobs.filter((job) => {
    // ... 既存のフィルター
    
    // 顧客満足度の低い案件のフィルター
    if (filters.lowSatisfaction === true) {
      if (!job.customerSatisfaction || job.customerSatisfaction.rating >= 3) {
        return false;
      }
    }
    
    return true;
  });
}, [jobs, filters]);
```

---

### 4. 顧客満足度の可視化

**実装方法:**
```tsx
// 顧客満足度の可視化（店長向けダッシュボード）
<Card>
  <CardHeader>
    <CardTitle>顧客満足度の傾向</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* 平均満足度 */}
      <div>
        <div className="text-sm text-slate-500">平均満足度</div>
        <div className="text-3xl font-bold">{averageSatisfaction.toFixed(1)}/5.0</div>
      </div>
      
      {/* 満足度分布 */}
      <div>
        <div className="text-sm text-slate-500 mb-2">満足度分布</div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = satisfactionDistribution[rating] || 0;
            const percentage = totalSatisfactionRecords > 0 ? (count / totalSatisfactionRecords) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center gap-2">
                <div className="w-12 text-sm">{rating}点</div>
                <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      rating >= 4 ? "bg-green-500" : rating >= 3 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-16 text-sm text-right">{count}件</div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* カテゴリー別満足度 */}
      <div>
        <div className="text-sm text-slate-500 mb-2">カテゴリー別満足度</div>
        <BarChart
          data={categorySatisfactionData}
          xKey="category"
          yKey="averageRating"
          height={200}
        />
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 期待される効果

### 業務効率の向上

1. **顧客満足度の管理**
   - 顧客満足度を専用の項目として記録できるため、管理が容易になる
   - 顧客満足度の低い案件を素早く識別できる
   - **時間短縮:** 顧客満足度の確認時間が約50%短縮（推定）

2. **問題の早期発見**
   - 顧客満足度の低い案件をフィルターで表示できるため、問題を早期に発見できる
   - フォローアップが必要な案件を優先的に対応できる

3. **データ駆動の意思決定**
   - 顧客満足度の傾向を分析して、データに基づいた意思決定が可能
   - 業務改善のポイントを特定できる

---

### 顧客満足度の向上

1. **プロアクティブな対応**
   - 顧客満足度の低い案件を素早く識別して、プロアクティブに対応できる
   - お客様へのフォローアップを適切なタイミングで行える

2. **業務の改善**
   - 顧客満足度の傾向を分析して、業務を改善できる
   - カテゴリー別の満足度を分析して、改善ポイントを特定できる

---

## 実装の優先度と理由

### 優先度: 中（顧客満足度の向上）

**理由:**

1. **顧客満足度の向上**
   - 顧客満足度の低い案件を素早く識別して、プロアクティブに対応できる
   - 顧客満足度の傾向を分析して、業務を改善できる

2. **実装の容易さ**
   - 既存の案件管理機能を拡張するだけで実装可能
   - 実装工数: 2-3日（見積）

3. **ユーザー要望**
   - 店長から、この機能の追加を要望されている
   - ただし、最優先機能ではない

---

## 実装スケジュール

### Phase 1: データ構造の定義（0.5日）
- `CustomerSatisfaction`型の定義
- 顧客満足度保存用のAPI設計

### Phase 2: 顧客満足度記録UIの実装（1日）
- 顧客満足度記録ダイアログのUI実装
- 満足度評価の入力（星評価）
- フィードバック内容の入力
- フォローアップ機能

### Phase 3: 顧客満足度表示機能の実装（0.5日）
- ジョブカードへの顧客満足度表示
- 顧客満足度の低い案件のフィルター

### Phase 4: 顧客満足度可視化機能の実装（0.5-1日）
- 顧客満足度の可視化（グラフ）
- カテゴリー別満足度の表示

**合計:** 2.5-3日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md`](../reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md) - 店長のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #12 を作成



