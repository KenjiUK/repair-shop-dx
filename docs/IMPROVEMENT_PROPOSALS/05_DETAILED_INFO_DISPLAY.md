# 改善提案 #5: 詳細情報の表示機能の強化（店長向け）

**提案日:** 2025-12-21  
**優先度:** 高（店長業務の効率化に不可欠）  
**実装工数見積:** 3-4日  
**影響範囲:** 店長

---

## 提案の概要

現在のシステムでは、「整備士別」サマリーカードや「長期プロジェクト」サマリーカードは実装されていますが、各整備士の作業量の詳細や、長期プロジェクトの進捗率の詳細が表示されていません。店長がリソース配分の判断を行う際、より詳細な情報が必要です。

本提案では、以下の機能を追加します：
1. **各整備士の作業量の詳細表示機能**（各整備士の詳細情報を表示するモーダル/ページ）
2. **長期プロジェクトの進捗率の詳細表示機能**（各長期プロジェクトの詳細情報を表示するモーダル/ページ）
3. **各整備士のスキルレベルを確認できる機能**
4. **作業内容に応じた適切なスタッフへの自動割り当て提案機能**（将来の拡張）

---

## なぜ必要か：ユーザーコメントから

### 👨‍💼 店長（高橋 美咲様）のコメント

**改善してほしい点:**
> 「整備士別」サマリーカードで、各整備士の作業量がもう少し詳しく表示されると良いと思います。現在は「未割り当て」が11件と表示されているだけなので、各整備士の作業量が分からないです。

> 「長期プロジェクト」サマリーカードで、進捗率の詳細（何%進んでいるか）がもう少し詳しく表示されると良いと思います。

**追加で必要な機能:**
> - 各整備士の作業量の詳細表示機能
> - 長期プロジェクトの進捗率の詳細表示機能
> - 各整備士のスキルレベルを確認できる機能
> - 作業内容に応じた適切なスタッフへの自動割り当て機能

**業務上の課題:**
- リソース配分の判断時に、各整備士の作業量を詳しく確認したい
- 各整備士のスキルレベルを確認して、適切なスタッフに作業を割り当てたい
- 長期プロジェクトの進捗を詳しく確認したい
- 作業内容に応じた適切なスタッフへの自動割り当て機能があると便利

---

### 📧 受付担当（山田 花子様）のコメント

**業務上の課題:**
- 整備士への作業割り当て時に、各整備士の作業量を確認したい

---

### 🔧 整備士（佐藤 健一様）のコメント

**業務上の課題:**
- 自分の作業量を確認したい
- 他の整備士の作業量を確認して、負荷分散を判断したい

---

## 現在の実装状況

### 実装済みの機能

1. **「整備士別」サマリーカード**（`MechanicSummaryCard`）
   - 各整備士の案件数を表示
   - 「未割り当て」の案件数も表示
   - ただし、詳細情報（各整備士の作業内容、作業時間、スキルレベルなど）は表示されない

2. **「長期プロジェクト」サマリーカード**（`LongTermProjectSummaryCard`）
   - 長期プロジェクトの件数を表示
   - 進捗率の分布（50%未満、75%以上など）を表示
   - ただし、各プロジェクトの詳細な進捗率は表示されない

### 未実装の機能

1. **各整備士の詳細情報表示**
   - 各整備士の作業量の詳細（案件数、作業時間、作業内容など）
   - 各整備士のスキルレベル
   - 各整備士の作業負荷（過負荷、適正、余裕など）

2. **長期プロジェクトの詳細情報表示**
   - 各長期プロジェクトの詳細な進捗率
   - 各工程の進捗状況
   - 予定終了日と実際の終了予測日

3. **スキルレベル管理**
   - 各整備士のスキルレベルを記録・表示する機能がない
   - 作業内容に応じた適切なスタッフへの自動割り当て機能がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. 明確性とミニマリズム

**事例:**
- **Asana**: クリーンなレイアウトと十分な余白を使用し、重要なKPIを目立つ位置に配置。詳細データへのドリルダウン機能を提供。
- **Monday.com**: 情報階層を戦略的に配置し、重要な情報を最初に表示。

**ベストプラクティス:**
- クリーンなレイアウトと十分な余白を使用
- 重要なKPIを目立つ位置に配置
- 詳細データへのドリルダウン機能を提供

---

### 2. インタラクティブなデータ可視化

**事例:**
- **Tableau**: トレンドには折れ線グラフ、比較には棒グラフなど、適切なチャートタイプを選択。ドリルダウン、フィルター、動的な時間セレクターなどのインタラクティブ要素を組み込む。
- **Power BI**: リアルタイム更新とデータストーリーテリング技術を実装。

**ベストプラクティス:**
- 適切なチャートタイプを選択（折れ線グラフ、棒グラフ、円グラフなど）
- ドリルダウン、フィルター、動的な時間セレクターなどのインタラクティブ要素を組み込む
- リアルタイム更新を実装

---

### 3. 一貫性と反復

**事例:**
- **Google Analytics**: 類似要素に統一されたフォーマットを維持。可視化タイプを標準化。
- **Mixpanel**: 視覚パターンとカラースキームを繰り返し、意味を強化。

**ベストプラクティス:**
- 類似要素に統一されたフォーマットを維持
- 可視化タイプを標準化
- 視覚パターンとカラースキームを繰り返す

---

### 4. モバイル最適化とレスポンシブデザイン

**事例:**
- **Slack**: モバイルファーストのアプローチを採用し、小さな画面でも快適に操作できる。
- **Microsoft Teams**: タッチ操作に最適化された大きなタップ領域を提供。

**ベストプラクティス:**
- モバイルファーストのアプローチを採用
- タッチ操作に最適化された大きなタップ領域を提供
- 直感的なジェスチャーをサポート

---

### 5. リアルタイムコラボレーション機能

**事例:**
- **Notion**: 複数のチームメンバーが同じデータを同時に表示・操作できる。リアルタイム更新を実装。
- **Figma**: ダッシュボード内のコメント機能を統合。

**ベストプラクティス:**
- 複数のチームメンバーが同じデータを同時に表示・操作できる
- リアルタイム更新を実装
- ダッシュボード内のコメント機能を統合

---

### 6. マイクロインタラクション

**事例:**
- **Linear**: 微妙なアニメーションとレスポンシブなフィードバックメカニズムを実装。
- **Notion**: ライブデータ更新インジケーターと、フィルター表示間のスムーズなトランジションを提供。

**ベストプラクティス:**
- 微妙なアニメーションとレスポンシブなフィードバックメカニズムを実装
- ライブデータ更新インジケーターを提供
- フィルター表示間のスムーズなトランジションを提供

---

### 7. ロールベースアクセスと条件付きUI

**事例:**
- **Salesforce**: ユーザーの役割に応じて、関連する情報のみを表示。セキュリティを向上し、クラッターを削減。
- **Zendesk**: 動的なロール遷移をサポート。

**ベストプラクティス:**
- ユーザーの役割に応じて、関連する情報のみを表示
- セキュリティを向上し、クラッターを削減
- 動的なロール遷移をサポート

---

### 8. パフォーマンス最適化

**事例:**
- **Google Analytics**: ページ読み込み時間を短縮するため、ライブデータリクエストの数とサイズを削減。キャッシングを活用。
- **Mixpanel**: データ処理を効率化し、ビジュアルを軽量に保つ。

**ベストプラクティス:**
- ページ読み込み時間を短縮するため、ライブデータリクエストの数とサイズを削減
- キャッシングを活用
- データ処理を効率化し、ビジュアルを軽量に保つ

---

## 実装方法の詳細

### 1. 各整備士の詳細情報表示モーダル

**実装方法:**
```tsx
// 整備士詳細情報モーダル
<Dialog open={isMechanicDetailOpen} onOpenChange={setIsMechanicDetailOpen}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{selectedMechanic}の詳細情報</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-6">
      {/* 作業量サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">作業量サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-slate-500">総案件数</div>
              <div className="text-2xl font-bold">{mechanicStats.totalJobs}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">進行中</div>
              <div className="text-2xl font-bold text-blue-600">{mechanicStats.inProgress}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">完了済み（今日）</div>
              <div className="text-2xl font-bold text-green-600">{mechanicStats.completedToday}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">作業負荷</div>
              <div className="text-2xl font-bold">
                <Badge variant={mechanicStats.workload === "high" ? "destructive" : mechanicStats.workload === "medium" ? "default" : "secondary"}>
                  {mechanicStats.workload === "high" ? "高" : mechanicStats.workload === "medium" ? "中" : "低"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* スキルレベル */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">スキルレベル</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {skillLevels.map((skill) => (
              <div key={skill.category} className="flex items-center justify-between">
                <span className="text-sm">{skill.category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{skill.level}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 担当案件リスト */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">担当案件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mechanicJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{job.field4?.name}様</div>
                  <div className="text-xs text-slate-500">{job.field6?.name}</div>
                </div>
                <Badge variant="outline">{job.field5}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </DialogContent>
</Dialog>
```

---

### 2. 長期プロジェクトの詳細情報表示モーダル

**実装方法:**
```tsx
// 長期プロジェクト詳細情報モーダル
<Dialog open={isProjectDetailOpen} onOpenChange={setIsProjectDetailOpen}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{selectedProject.field4?.name}様 - {selectedProject.field6?.name}</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-6">
      {/* 進捗率サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">進捗率サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">全体の進捗率</span>
                <span className="text-2xl font-bold">{projectProgress.overallProgress}%</span>
              </div>
              <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${projectProgress.overallProgress}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">開始日</div>
                <div className="text-sm font-medium">{formatDate(projectProgress.startDate)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">予定終了日</div>
                <div className="text-sm font-medium">{formatDate(projectProgress.expectedEndDate)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 各工程の進捗 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">各工程の進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectProgress.phases.map((phase) => (
              <div key={phase.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{phase.name}</span>
                  <Badge variant={phase.status === "completed" ? "default" : "secondary"}>
                    {phase.status === "not_started" ? "未開始" : phase.status === "in_progress" ? "進行中" : "完了"}
                  </Badge>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  進捗率: {phase.progress}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </DialogContent>
</Dialog>
```

---

### 3. スキルレベル管理機能

**データ構造:**
```typescript
interface MechanicSkill {
  mechanicId: string;
  mechanicName: string;
  skills: SkillItem[];
  overallLevel: number; // 全体のスキルレベル（0-100）
}

interface SkillItem {
  category: string;      // カテゴリー（例: "エンジン"、"ブレーキ"、"電装"）
  level: number;        // スキルレベル（0-100）
  experience: number;   // 経験年数
  certifications: string[]; // 資格・認定
}
```

**UI実装:**
```tsx
// スキルレベル管理セクション（店長向け管理画面）
<div className="space-y-4">
  {mechanicSkills.map((mechanic) => (
    <Card key={mechanic.mechanicId}>
      <CardHeader>
        <CardTitle className="text-base">{mechanic.mechanicName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">全体のスキルレベル</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${mechanic.overallLevel}%` }}
                />
              </div>
              <span className="text-sm font-medium w-12 text-right">{mechanic.overallLevel}%</span>
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            {mechanic.skills.map((skill) => (
              <div key={skill.category} className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-sm">{skill.category}</span>
                  <div className="text-xs text-slate-500">
                    経験: {skill.experience}年
                    {skill.certifications.length > 0 && (
                      <span className="ml-2">
                        ({skill.certifications.join(", ")})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{skill.level}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

---

### 4. サマリーカードのクリック機能

**実装方法:**
```tsx
// MechanicSummaryCardの修正
<div
  key={mechanicName}
  onClick={() => {
    setSelectedMechanic(mechanicName);
    setIsMechanicDetailOpen(true);
  }}
  className={cn(
    "flex items-center justify-between gap-2 p-2 rounded-md transition-all duration-200",
    "bg-slate-50 border border-slate-200",
    "cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:shadow-md"
  )}
>
  {/* ... 既存のコンテンツ ... */}
</div>

// LongTermProjectSummaryCardの修正
<div
  key={project.id}
  onClick={() => {
    setSelectedProject(project);
    setIsProjectDetailOpen(true);
  }}
  className={cn(
    "flex items-center justify-between gap-2 p-2 rounded-md transition-all duration-200",
    "bg-slate-50 border border-slate-200",
    "cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:shadow-md"
  )}
>
  {/* ... 既存のコンテンツ ... */}
</div>
```

---

## 期待される効果

### 業務効率の向上

1. **リソース配分の判断の効率化**
   - 各整備士の作業量の詳細を確認できるため、リソース配分の判断が容易になる
   - 各整備士のスキルレベルを確認して、適切なスタッフに作業を割り当てられる
   - **時間短縮:** リソース配分の判断時間が約40%短縮（推定）

2. **長期プロジェクトの管理の効率化**
   - 長期プロジェクトの進捗を詳しく確認できるため、管理が容易になる
   - 各工程の進捗を確認して、遅延を早期に発見できる
   - **時間短縮:** 進捗確認の時間が約50%短縮（推定）

3. **作業割り当ての最適化**
   - 作業内容に応じた適切なスタッフへの自動割り当て機能（将来の拡張）により、作業割り当てが最適化される
   - 各整備士のスキルレベルを考慮した作業割り当てが可能になる

---

### 店長業務の効率化

1. **データ駆動の意思決定**
   - 各整備士の作業量やスキルレベルをデータで確認できるため、データに基づいた意思決定が可能
   - 長期プロジェクトの進捗をデータで確認できるため、適切な判断が可能

2. **視覚的な情報表示**
   - 作業量や進捗率を視覚的に表示するため、素早く情報を把握できる
   - グラフやチャートを使用することで、情報を分かりやすく表示

---

## 実装の優先度と理由

### 優先度: 高（店長業務の効率化に不可欠）

**理由:**

1. **店長業務の効率化に不可欠**
   - 店長がリソース配分の判断を行う際、詳細な情報が必要
   - 店長から、この機能の追加を強く要望されている

2. **業務効率への直接的な影響**
   - リソース配分の判断時間が約40%短縮（推定）
   - 進捗確認の時間が約50%短縮（推定）
   - データに基づいた意思決定が可能になる

3. **実装の複雑さ**
   - モーダル/ページの実装、データ集計ロジックの実装など、やや複雑
   - 実装工数: 3-4日（見積）

---

## 実装スケジュール

### Phase 1: データ集計ロジックの実装（1日）
- 各整備士の作業量を集計するロジック
- 各整備士のスキルレベルを取得するロジック
- 長期プロジェクトの進捗を集計するロジック

### Phase 2: 各整備士の詳細情報表示モーダル（1日）
- モーダルUIの実装
- 作業量サマリーの表示
- スキルレベルの表示
- 担当案件リストの表示

### Phase 3: 長期プロジェクトの詳細情報表示モーダル（0.5日）
- モーダルUIの実装
- 進捗率サマリーの表示
- 各工程の進捗表示

### Phase 4: サマリーカードのクリック機能（0.5日）
- `MechanicSummaryCard`のクリック機能の追加
- `LongTermProjectSummaryCard`のクリック機能の追加

### Phase 5: スキルレベル管理機能（1日）
- スキルレベル管理UIの実装
- スキルレベルの記録・更新機能
- スキルレベルの表示機能

**合計:** 4日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md`](../reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md) - 店長のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #5 を作成



