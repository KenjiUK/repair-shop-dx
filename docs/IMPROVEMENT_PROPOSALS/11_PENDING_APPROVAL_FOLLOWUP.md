# 改善提案 #11: 承認待ち案件のフォローアップ機能の強化

**提案日:** 2025-12-21  
**優先度:** 中（見積業務の効率化）  
**実装工数見積:** 2-3日  
**影響範囲:** 管理者

---

## 提案の概要

現在のシステムでは、承認待ち案件は表示されますが、承認待ちが長期化している案件を自動的に識別する機能がありません。承認待ちが長期化している案件を自動的に識別し、警告を表示することで、お客様へのフォローアップが容易になります。

本提案では、以下の機能を追加します：
1. **承認待ちが長期化している案件を自動的に識別する機能**
2. **長期化している案件に警告アイコンを表示する機能**
3. **承認待ち期間の表示機能**
4. **承認待ち案件の自動通知機能**（将来の拡張）

---

## なぜ必要か：ユーザーコメントから

### 👔 管理者（鈴木 太郎様）のコメント

**追加シナリオ20: 承認待ち案件のフォローアップ（長期化している場合）**

**質問1: 承認待ちが長期化している案件をすぐに識別できましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「本日の状況」サマリーカードで、「お客様承認待ち」の件数がすぐに確認できます。また、「お客様承認待ち」をクリックすると、承認待ちの案件だけが表示されるので、長期化している案件もすぐに識別できます。

**質問2: 承認待ちが長期化している案件への対応がスムーズに行えましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「ジョブカードをクリックすると、見積金額や提出日時などの詳細情報が確認できるので、承認待ちが長期化している案件への対応もしやすいです。特に、見積の内容も確認できるので、お客様へのフォローアップもしやすいです。」

**追加で必要な機能:**
> - 承認待ちが長期化している案件を自動的に識別する機能

**業務上の課題:**
- 承認待ちが長期化している案件を自動的に識別したい
- お客様へのフォローアップを適切なタイミングで行いたい
- 承認待ち期間を視覚的に表示したい

---

## 現在の実装状況

### 実装済みの機能

1. **承認待ち案件の表示**
   - 「本日の状況」サマリーカードで、「お客様承認待ち」の件数を表示
   - 承認待ち案件をフィルターで表示可能

2. **案件詳細の表示**
   - ジョブカードから、見積金額や提出日時などの詳細情報を確認可能

### 未実装の機能

1. **長期化案件の自動識別**
   - 承認待ちが長期化している案件を自動的に識別する機能がない
   - 承認待ち期間を計算する機能がない

2. **警告表示**
   - 長期化している案件に警告アイコンを表示する機能がない
   - 承認待ち期間を視覚的に表示する機能がない

3. **自動通知**
   - 承認待ちが長期化している案件の自動通知機能がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. ユーザーコントロールと設定の優先順位付け

**事例:**
- **Basecamp**: 「Always On」と「Work Can Wait」オプションを提供し、ユーザーが通知を受信するタイミングを選択可能。
- **Slack**: 「Focus Zones」機能により、重要な作業時間中に無関係な通知をサイレントにできる。

**ベストプラクティス:**
- ユーザーが通知設定をカスタマイズできる（頻度、タイミング、チャネル）
- オンボーディングプロセス中にこれらのオプションを統合
- ユーザーの時間を尊重し、潜在的な煩わしさを削減

---

### 2. 明確で簡潔なメッセージング

**事例:**
- **GitHub**: 通知は明確で簡潔で、ユーザーを圧倒することなく重要な情報を伝達。
- **Jira**: 通知メッセージを簡潔な言語で提供し、不要な詳細を避ける。

**ベストプラクティス:**
- 通知は明確で簡潔で、ユーザーを圧倒することなく重要な情報を伝達
- 簡潔な言語を使用し、不要な詳細を避ける
- 明確さを維持

---

### 3. エンゲージメントのためのマイクロインタラクション

**事例:**
- **Notion**: 微妙なアニメーションや視覚的な手がかりを組み込み、フィードバックを提供し、ユーザーを導く。
- **Figma**: マイクロインタラクションにより、通知をより魅力的で直感的にする。

**ベストプラクティス:**
- 微妙なアニメーションや視覚的な手がかりを組み込み、フィードバックを提供
- ユーザーを導く
- 通知をより魅力的で直感的にする

---

### 4. アクセシビリティの設計

**事例:**
- **GitHub**: 高コントラストの色、読みやすいフォント、画像の代替テキストを提供。
- **Jira**: WCAGガイドラインに従い、包括的な体験を作成。

**ベストプラクティス:**
- 高コントラストの色、読みやすいフォント、画像の代替テキストを提供
- WCAGガイドラインに従う
- 包括的な体験を作成

---

### 5. 通知の過負荷を避ける

**事例:**
- **Slack**: 「Focus Zones」機能により、重要な作業時間中に無関係な通知をサイレントにできる。
- **Basecamp**: 通知の頻度と関連性に注意を払い、ユーザーを圧倒しないようにする。

**ベストプラクティス:**
- 通知の頻度と関連性に注意を払い、ユーザーを圧倒しないようにする
- 通知の過負荷は、ユーザーの不満と離脱につながる可能性がある
- 関連性の高い通知のみを送信

---

### 6. スヌーズまたは一時停止オプションの提供

**事例:**
- **Slack**: ユーザーが通知を一時的に無効にしたり、「Do Not Disturb」期間を設定したりできる。
- **Basecamp**: この柔軟性により、ユーザーの時間を尊重し、潜在的な煩わしさを削減。

**ベストプラクティス:**
- ユーザーが通知を一時的に無効にしたり、「Do Not Disturb」期間を設定したりできる
- この柔軟性により、ユーザーの時間を尊重
- 潜在的な煩わしさを削減

---

### 7. タイムリーで文脈に応じた配信

**事例:**
- **GitHub**: 適切なタイミングと関連する文脈で通知を送信し、ユーザーのエンゲージメントの可能性を高める。
- **Jira**: オフ時間中は、重要な場合を除き、アラートを送信しない。

**ベストプラクティス:**
- 適切なタイミングと関連する文脈で通知を送信
- ユーザーのエンゲージメントの可能性を高める
- オフ時間中は、重要な場合を除き、アラートを送信しない

---

## 実装方法の詳細

### 1. 承認待ち期間の計算

**実装方法:**
```typescript
// 承認待ち期間を計算
function getPendingApprovalDays(job: ZohoJob): number {
  // 見積提出日時を取得（field22または見積作成日時）
  const submittedAt = job.estimateSubmittedAt || job.estimateCreatedAt;
  if (!submittedAt) return 0;
  
  const submittedDate = new Date(submittedAt);
  const now = new Date();
  const diffTime = now.getTime() - submittedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

// 長期化している案件を識別
function isLongPendingApproval(job: ZohoJob): boolean {
  if (job.field5 !== "見積提示済み") return false;
  
  const pendingDays = getPendingApprovalDays(job);
  return pendingDays >= 3; // 3日以上経過している場合
}
```

---

### 2. 警告アイコンの表示

**実装方法:**
```tsx
// ジョブカードに警告アイコンを表示
{isLongPendingApproval(job) && (
  <div className="absolute top-2 right-2">
    <Tooltip>
      <TooltipTrigger>
        <AlertCircle className="h-5 w-5 text-red-500" />
      </TooltipTrigger>
      <TooltipContent>
        <p>承認待ちが{getPendingApprovalDays(job)}日経過しています</p>
      </TooltipContent>
    </Tooltip>
  </div>
)}

// 承認待ち期間の表示
{job.field5 === "見積提示済み" && (
  <div className="flex items-center gap-2 text-xs text-slate-500">
    <Clock className="h-3 w-3" />
    <span>
      承認待ち: {getPendingApprovalDays(job)}日
      {isLongPendingApproval(job) && (
        <span className="ml-1 text-red-600 font-medium">（要フォローアップ）</span>
      )}
    </span>
  </div>
)}
```

---

### 3. 長期化案件のフィルター

**実装方法:**
```typescript
// フィルターに「長期化している承認待ち案件」を追加
const filteredJobs = useMemo(() => {
  return jobs.filter((job) => {
    // ... 既存のフィルター
    
    // 長期化している承認待ち案件のフィルター
    if (filters.longPendingApproval === true) {
      if (!isLongPendingApproval(job)) {
        return false;
      }
    }
    
    return true;
  });
}, [jobs, filters]);
```

---

### 4. 長期化案件の一覧表示

**実装方法:**
```tsx
// 長期化している承認待ち案件の一覧表示
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center gap-2">
      <AlertCircle className="h-5 w-5 text-red-500" />
      長期化している承認待ち案件
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      {longPendingApprovalJobs.map((job) => (
        <Card
          key={job.id}
          className="border-red-200 bg-red-50"
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{job.field4?.name}様</div>
                <div className="text-sm text-slate-500">{job.field6?.name}</div>
                <div className="text-xs text-red-600 mt-1">
                  承認待ち: {getPendingApprovalDays(job)}日
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">¥{job.estimateTotal?.toLocaleString()}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFollowUp(job)}
                >
                  フォローアップ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </CardContent>
</Card>
```

---

### 5. 自動通知機能（将来の拡張）

**実装方法:**
```typescript
// 承認待ちが長期化している案件の自動通知
async function checkLongPendingApprovals() {
  const jobs = await fetchPendingApprovalJobs();
  
  jobs.forEach((job) => {
    if (isLongPendingApproval(job)) {
      // 通知を送信
      await sendNotification({
        type: "long_pending_approval",
        jobId: job.id,
        message: `${job.field4?.name}様の見積が承認待ちで${getPendingApprovalDays(job)}日経過しています。`,
        recipients: ["admin"],
      });
    }
  });
}

// 定期的にチェック（例: 1時間ごと）
setInterval(checkLongPendingApprovals, 60 * 60 * 1000);
```

---

## 期待される効果

### 業務効率の向上

1. **承認待ち案件の迅速な識別**
   - 承認待ちが長期化している案件を自動的に識別できるため、素早く対応できる
   - 警告アイコンにより、視覚的に識別しやすい
   - **時間短縮:** 長期化案件の識別時間が約60%短縮（推定）

2. **お客様へのフォローアップの改善**
   - 承認待ち期間を表示することで、適切なタイミングでフォローアップできる
   - 長期化している案件を優先的に対応できる

3. **データ駆動の意思決定**
   - 承認待ち期間のデータを分析して、データに基づいた意思決定が可能
   - 承認待ちが長期化する傾向を把握できる

---

### ユーザー体験の向上

1. **視覚的な明確性**
   - 警告アイコンにより、長期化している案件を視覚的に識別できる
   - 承認待ち期間を表示することで、状況を素早く把握できる

2. **プロアクティブな対応**
   - 自動的に長期化案件を識別することで、プロアクティブに対応できる
   - お客様へのフォローアップを適切なタイミングで行える

---

## 実装の優先度と理由

### 優先度: 中（見積業務の効率化）

**理由:**

1. **見積業務の効率化**
   - 長期化案件の識別時間が約60%短縮（推定）
   - お客様へのフォローアップが適切なタイミングで行える

2. **実装の容易さ**
   - 既存の案件管理機能を拡張するだけで実装可能
   - 実装工数: 2-3日（見積）

3. **ユーザー要望**
   - 管理者から、この機能の追加を要望されている
   - ただし、最優先機能ではない

---

## 実装スケジュール

### Phase 1: 承認待ち期間の計算ロジック（0.5日）
- 承認待ち期間を計算する関数の実装
- 長期化案件を識別する関数の実装

### Phase 2: 警告アイコンの表示（0.5日）
- ジョブカードに警告アイコンを表示
- 承認待ち期間の表示

### Phase 3: 長期化案件のフィルター（0.5日）
- 長期化案件のフィルター機能
- フィルターUIの実装

### Phase 4: 長期化案件の一覧表示（0.5-1日）
- 長期化案件の一覧表示UI
- フォローアップ機能

**合計:** 2-3日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Admin_鈴木太郎_20251221.md`](../reviews/UX_TESTING_REVIEW_Admin_鈴木太郎_20251221.md) - 管理者のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #11 を作成



