# 改善提案 #13: リソース配分機能の強化

**提案日:** 2025-12-21  
**優先度:** 中（リソース配分の最適化）  
**実装工数見積:** 4-5日  
**影響範囲:** 店長

---

## 提案の概要

現在のシステムでは、店長が手動で整備士に作業を割り当てる必要があります。作業内容と各整備士のスキルレベルを照合し、適切なスタッフを自動的に提案する機能を追加することで、リソース配分が最適化されます。

本提案では、以下の機能を追加します：
1. **作業内容と各整備士のスキルレベルを照合する機能**
2. **適切なスタッフを自動的に提案する機能**
3. **店長が承認することで、自動的に割り当てる機能**
4. **提案理由の表示機能**（透明性の向上）

---

## なぜ必要か：ユーザーコメントから

### 👨‍💼 店長（高橋 美咲様）のコメント

**追加シナリオ18: スタッフのスキルレベルに応じた作業割り当て**

**質問1: スタッフのスキルレベルに応じた作業割り当ての判断が容易でしたか？**
- [x] 容易だった（4点）

**コメント:**
> 「整備士別」サマリーカードで、各整備士の作業量を確認できますが、各整備士のスキルレベルを確認する機能はまだないようです。各整備士のスキルレベルを確認できる機能があると、もっと便利だと思います。

**質問2: 作業内容に応じた適切なスタッフへの割り当てがスムーズに行えましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「各案件のジョブカードから、作業内容が確認できるので、作業内容に応じた適切なスタッフへの割り当てがスムーズに行えます。特に、作業内容が分かるので、どのスタッフに割り当てるか判断できます。」

**追加で必要な機能:**
> - 各整備士のスキルレベルを確認できる機能
> - 作業内容に応じた適切なスタッフへの自動割り当て機能

**業務上の課題:**
- 各整備士のスキルレベルを確認して、適切なスタッフに作業を割り当てたい
- 作業内容に応じた適切なスタッフへの自動割り当て機能があると便利
- リソース配分の判断を最適化したい

---

## 現在の実装状況

### 実装済みの機能

1. **整備士割り当て機能**
   - 整備士を手動で割り当てる機能が実装済み
   - `MechanicSelectDialog`で整備士を選択可能

2. **作業内容の表示**
   - ジョブカードから、作業内容を確認可能

### 未実装の機能

1. **スキルレベル管理**
   - 各整備士のスキルレベルを記録・表示する機能がない

2. **自動割り当て提案**
   - 作業内容と各整備士のスキルレベルを照合する機能がない
   - 適切なスタッフを自動的に提案する機能がない

3. **提案理由の表示**
   - なぜそのスタッフが提案されたかの理由を表示する機能がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. 人間-AIコラボレーション

**事例:**
- **Asana**: AIがコラボレーターとして機能し、ユーザーがAI生成のタスク割り当てを確認、カスタマイズ、上書きできる。
- **Monday.com**: 重要な決定において人間の判断を維持。

**ベストプラクティス:**
- AIがコラボレーターとして機能し、ユーザーがAI生成のタスク割り当てを確認、カスタマイズ、上書きできる
- 重要な決定において人間の判断を維持
- ユーザーが最終的な決定をコントロールできる

---

### 2. 透明性と説明可能性

**事例:**
- **Salesforce**: AIシステムがタスク割り当ての決定をどのように行うかを明確に伝達。スキルレベル、可用性、過去のパフォーマンスなどの考慮要因に関する洞察を提供。
- **Zendesk**: 信頼を構築し、情報に基づいた意思決定を促進。

**ベストプラクティス:**
- AIシステムがタスク割り当ての決定をどのように行うかを明確に伝達
- スキルレベル、可用性、過去のパフォーマンスなどの考慮要因に関する洞察を提供
- 信頼を構築し、情報に基づいた意思決定を促進

---

### 3. 適応的ユーザーインターフェース（AUI）

**事例:**
- **Notion**: 個々のユーザーのニーズと好みに適応するインターフェースを実装。パーソナライズされた人間のフィードバックを統合する強化学習技術を組み込む。
- **Figma**: システムが学習し、時間の経過とともに改善し、より応答性が高く、ユーザー中心のタスク割り当てにつながる。

**ベストプラクティス:**
- 個々のユーザーのニーズと好みに適応するインターフェースを実装
- パーソナライズされた人間のフィードバックを統合する強化学習技術を組み込む
- システムが学習し、時間の経過とともに改善

---

### 4. 倫理的考慮とバイアス軽減

**事例:**
- **GitHub**: AIアルゴリズムを定期的に監査し、タスク割り当てのバイアスを検出・防止。
- **Jira**: 多様なトレーニングデータを使用し、ユーザーがバイアスのある結果を報告・修正するメカニズムを確立。

**ベストプラクティス:**
- AIアルゴリズムを定期的に監査し、タスク割り当てのバイアスを検出・防止
- 多様なトレーニングデータを使用
- ユーザーがバイアスのある結果を報告・修正するメカニズムを確立

---

### 5. ユーザーのエンパワーメントとコントロール

**事例:**
- **Asana**: ユーザーが設定をカスタマイズし、タスクの優先順位を調整し、AI生成の割り当てに関するフィードバックを提供できるシステムを設計。
- **Monday.com**: コントロールとエンゲージメントの感覚を育み、全体的なユーザー満足度を向上。

**ベストプラクティス:**
- ユーザーが設定をカスタマイズし、タスクの優先順位を調整し、AI生成の割り当てに関するフィードバックを提供できるシステムを設計
- コントロールとエンゲージメントの感覚を育む
- 全体的なユーザー満足度を向上

---

### 6. 継続的な学習と改善

**事例:**
- **Notion**: AIシステムとユーザーの両方が進化できる継続的な学習のメカニズムを組み込む。
- **Figma**: ユーザーがAIの学習プロセスを導き、組織のニーズが変化してもタスク割り当てが関連性と効果を維持するようにする。

**ベストプラクティス:**
- AIシステムとユーザーの両方が進化できる継続的な学習のメカニズムを組み込む
- ユーザーがAIの学習プロセスを導く
- 組織のニーズが変化してもタスク割り当てが関連性と効果を維持

---

## 実装方法の詳細

### 1. スキルマッチングアルゴリズム

**実装方法:**
```typescript
// 作業内容と整備士のスキルレベルを照合
interface SkillMatch {
  mechanicId: string;
  mechanicName: string;
  matchScore: number;              // マッチングスコア（0-100）
  reasons: string[];                // 提案理由
  workload: number;                 // 現在の作業負荷
  availability: "high" | "medium" | "low"; // 可用性
}

function findBestMechanicMatch(
  job: ZohoJob,
  mechanics: MechanicSkill[]
): SkillMatch[] {
  const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  
  return mechanics.map((mechanic) => {
    let matchScore = 0;
    const reasons: string[] = [];
    
    // スキルレベルの照合
    serviceKinds.forEach((serviceKind) => {
      const skill = mechanic.skills.find((s) => s.category === getSkillCategory(serviceKind));
      if (skill) {
        matchScore += skill.level;
        if (skill.level >= 80) {
          reasons.push(`${serviceKind}のスキルレベルが高い（${skill.level}%）`);
        }
      }
    });
    
    // 作業負荷の考慮
    const workloadFactor = mechanic.workload === "low" ? 1.2 : mechanic.workload === "medium" ? 1.0 : 0.8;
    matchScore *= workloadFactor;
    
    if (mechanic.workload === "low") {
      reasons.push("作業負荷が低い");
    }
    
    // 可用性の考慮
    if (mechanic.availability === "high") {
      reasons.push("可用性が高い");
    }
    
    return {
      mechanicId: mechanic.mechanicId,
      mechanicName: mechanic.mechanicName,
      matchScore: Math.round(matchScore),
      reasons,
      workload: mechanic.currentJobCount,
      availability: mechanic.availability,
    };
  }).sort((a, b) => b.matchScore - a.matchScore); // スコアの高い順にソート
}
```

---

### 2. 自動割り当て提案UI

**実装方法:**
```tsx
// 自動割り当て提案ダイアログ
<Dialog open={isAutoAssignDialogOpen} onOpenChange={setIsAutoAssignDialogOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>整備士の自動割り当て提案</DialogTitle>
      <DialogDescription>
        {selectedJob?.field4?.name}様 - {selectedJob?.field6?.name}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* 作業内容の表示 */}
      <div>
        <Label>作業内容</Label>
        <div className="text-sm text-slate-600 mt-1">
          {selectedJob?.field_service_kinds?.join(", ") || selectedJob?.serviceKind}
        </div>
      </div>
      
      {/* 提案された整備士リスト */}
      <div>
        <Label>提案された整備士</Label>
        <div className="space-y-2 mt-2">
          {suggestedMechanics.map((match, index) => (
            <Card
              key={match.mechanicId}
              className={cn(
                "cursor-pointer transition-all",
                index === 0 && "border-blue-500 bg-blue-50"
              )}
              onClick={() => setSelectedMechanic(match)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{match.mechanicName}</div>
                    <div className="text-sm text-slate-500 mt-1">
                      マッチングスコア: {match.matchScore}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      現在の作業負荷: {match.workload}件
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-medium text-slate-600">提案理由:</div>
                      <ul className="text-xs text-slate-500 list-disc list-inside mt-1">
                        {match.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {index === 0 && (
                    <Badge variant="default" className="ml-2">
                      最適
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsAutoAssignDialogOpen(false)}>
          キャンセル
        </Button>
        <Button
          onClick={() => handleAutoAssignConfirm(suggestedMechanics[0])}
          disabled={!selectedMechanic}
        >
          {selectedMechanic ? `${selectedMechanic.mechanicName}に割り当て` : "整備士を選択"}
        </Button>
      </DialogFooter>
    </div>
  </DialogContent>
</Dialog>
```

---

### 3. ジョブカードへの自動割り当てボタン

**実装方法:**
```tsx
// ジョブカードに「自動割り当て提案」ボタンを追加
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    setSelectedJob(job);
    // 自動割り当て提案を取得
    const suggestions = findBestMechanicMatch(job, mechanicSkills);
    setSuggestedMechanics(suggestions);
    setIsAutoAssignDialogOpen(true);
  }}
  className="flex items-center gap-2"
>
  <Sparkles className="h-4 w-4" />
  自動割り当て提案
</Button>
```

---

### 4. 提案理由の表示

**実装方法:**
```tsx
// 提案理由の詳細表示
<div className="mt-2 p-2 bg-slate-50 rounded">
  <div className="text-xs font-medium text-slate-600 mb-1">提案理由の詳細:</div>
  <div className="space-y-1">
    {match.reasons.map((reason, idx) => (
      <div key={idx} className="text-xs text-slate-500 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        {reason}
      </div>
    ))}
  </div>
  
  {/* スキルレベルの詳細 */}
  <div className="mt-2">
    <div className="text-xs font-medium text-slate-600 mb-1">スキルレベル:</div>
    {serviceKinds.map((serviceKind) => {
      const skill = mechanic.skills.find((s) => s.category === getSkillCategory(serviceKind));
      if (!skill) return null;
      
      return (
        <div key={serviceKind} className="flex items-center justify-between text-xs">
          <span>{serviceKind}</span>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  skill.level >= 80 ? "bg-green-500" : skill.level >= 60 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${skill.level}%` }}
              />
            </div>
            <span className="w-10 text-right">{skill.level}%</span>
          </div>
        </div>
      );
    })}
  </div>
</div>
```

---

## 期待される効果

### 業務効率の向上

1. **リソース配分の最適化**
   - 作業内容に応じた適切なスタッフへの自動割り当てにより、リソース配分が最適化される
   - 各整備士のスキルレベルを考慮した割り当てが可能
   - **時間短縮:** 整備士割り当ての判断時間が約40%短縮（推定）

2. **作業品質の向上**
   - スキルレベルが高い整備士に適切な作業を割り当てることで、作業品質が向上
   - 作業内容に応じた適切なスタッフへの割り当てにより、ミスが削減

3. **作業負荷の均等化**
   - 各整備士の作業負荷を考慮した割り当てにより、作業負荷が均等化される
   - 過負荷の整備士を避け、適切な配分が可能

---

### ユーザー体験の向上

1. **透明性の向上**
   - 提案理由を表示することで、なぜそのスタッフが提案されたかが明確になる
   - ユーザーが提案を理解し、適切な判断が可能

2. **操作の簡素化**
   - 自動割り当て提案により、手動での判断が簡素化される
   - 店長が承認するだけで、適切なスタッフに割り当てられる

---

## 実装の優先度と理由

### 優先度: 中（リソース配分の最適化）

**理由:**

1. **リソース配分の最適化**
   - 整備士割り当ての判断時間が約40%短縮（推定）
   - 作業内容に応じた適切なスタッフへの割り当てが可能

2. **実装の複雑さ**
   - スキルマッチングアルゴリズムの実装が必要
   - スキルレベル管理機能との連携が必要
   - 実装工数: 4-5日（見積）

3. **ユーザー要望**
   - 店長から、この機能の追加を要望されている
   - ただし、最優先機能ではない

---

## 実装スケジュール

### Phase 1: スキルマッチングアルゴリズムの実装（2日）
- 作業内容と整備士のスキルレベルを照合するロジック
- マッチングスコアの計算
- 提案理由の生成

### Phase 2: 自動割り当て提案UIの実装（1.5日）
- 自動割り当て提案ダイアログのUI実装
- 提案された整備士リストの表示
- 提案理由の表示

### Phase 3: ジョブカードへの統合（0.5日）
- ジョブカードに「自動割り当て提案」ボタンを追加
- 自動割り当て機能の統合

### Phase 4: スキルレベル管理機能との連携（1日）
- スキルレベル管理機能（改善提案 #5）との連携
- スキルレベルの取得・更新機能

**合計:** 5日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md`](../reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md) - 店長のレビュー
- [`05_DETAILED_INFO_DISPLAY.md`](./05_DETAILED_INFO_DISPLAY.md) - 改善提案 #5（スキルレベル管理機能）

---

## 更新履歴

- 2025-12-21: 改善提案 #13 を作成



