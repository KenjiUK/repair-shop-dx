# 改善提案 #1: フィルター機能の強化

**提案日:** 2025-12-21  
**優先度:** 高（最優先）  
**実装工数見積:** 2-3日  
**影響範囲:** 全役割（受付担当、整備士、管理者、店長）

---

## 提案の概要

現在のシステムでは、ステータス別（入庫待ち、診断待ちなど）や入庫区分別（車検、12ヵ月点検など）のフィルター機能は実装されていますが、**緊急案件**や**重要顧客**で絞り込む機能がありません。また、複数のフィルターを同時に適用することもできません。

本提案では、以下の機能を追加します：
1. **緊急案件だけをフィルターで表示する機能**
2. **重要顧客だけをフィルターで表示する機能**
3. **複数のフィルターを同時に適用できる機能**（例：緊急案件かつ重要顧客、緊急案件かつ入庫待ちなど）

---

## なぜ必要か：ユーザーコメントから

### 📧 受付担当（山田 花子様）のコメント

**改善してほしい点:**
> 「緊急案件が多い時、一覧が長くなってスクロールが必要になるので、緊急案件だけをフィルターで表示できる機能があると良いと思います。」

**追加で必要な機能:**
> - 緊急案件だけをフィルターで表示する機能
> - 重要顧客だけをフィルターで表示する機能
> - 複数のフィルターを同時に適用できる機能（例：緊急案件かつ重要顧客）

**業務上の課題:**
- 朝の忙しい時間帯に、緊急案件を素早く見つける必要がある
- 重要顧客の案件を優先的に確認したいが、一覧から探すのに時間がかかる
- 複数の条件（例：緊急案件で、かつ重要顧客）で絞り込みたいが、現在は不可能

---

### 👨‍💼 店長（高橋 美咲様）のコメント

**改善してほしい点:**
> 「緊急案件が多い時、一覧が長くなってスクロールが必要になるので、緊急案件だけをフィルターで表示できる機能があると良いと思います。」

**追加で必要な機能:**
> - 緊急案件だけをフィルターで表示する機能
> - 重要顧客だけをフィルターで表示する機能
> - 複数のフィルターを同時に適用できる機能（例：緊急案件かつ重要顧客）

**業務上の課題:**
- リソース配分の判断時に、緊急案件だけを確認したい
- 重要顧客の案件を優先的に確認して、スタッフに指示を出したい
- 複数の条件で絞り込むことで、より効率的に業務を進めたい

---

### 🔧 整備士（佐藤 健一様）のコメント

**業務上の課題:**
- 緊急案件を優先的に診断したいが、一覧から探すのに時間がかかる
- 重要顧客の案件を丁寧に対応したいが、見つけるのに手間がかかる

---

### 👔 管理者（鈴木 太郎様）のコメント

**業務上の課題:**
- 見積作成待ちの案件の中から、緊急案件を優先的に確認したい
- 重要顧客の案件を優先的に見積を作成したい

---

## 現在の実装状況

### 実装済みのフィルター機能

1. **ステータス別フィルター**（`TodaySummaryCard`）
   - 入庫待ち、診断待ち、見積作成待ち、お客様承認待ち、作業待ち、引渡待ち
   - 再入庫予定
   - 単一選択のみ（複数のステータスを同時に選択不可）

2. **入庫区分別フィルター**（`ServiceKindSummaryCard`）
   - 車検、12ヵ月点検、エンジンオイル交換、タイヤ交換・ローテーション、故障診断、修理・整備、チューニング、パーツ取付、コーティング、レストア、その他
   - 単一選択のみ（複数の入庫区分を同時に選択不可）

3. **フィルターの視覚的フィードバック**
   - 選択されたフィルターは青く強調表示
   - 「すべて」ボタン選択時、他のボタンは視覚的に無効化（`opacity-50`）

### 未実装の機能

1. **緊急案件フィルター**
   - 緊急度インジケータ（赤い縦バー）が表示されている案件でフィルターできない

2. **重要顧客フィルター**
   - 重要顧客マーク（星アイコン）が表示されている案件でフィルターできない

3. **複数フィルターの同時適用**
   - ステータスと入庫区分を同時に選択できない
   - 緊急案件と重要顧客を同時に選択できない
   - 3つ以上の条件を組み合わせることができない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. 複数フィルターの同時適用パターン

**事例:**
- **Stockholm University**: ユーザーが複数のフィルターを選択してから、一度に結果を更新する方式を採用。画面のフリーズを防ぎ、スムーズな体験を提供。
- **Yale Library**: 複数のフィルターを同時に選択可能で、すべてのフィルターを一度に適用できる。

**ベストプラクティス:**
- フィルターの選択と結果の更新を分離することで、パフォーマンスを向上
- 複数のフィルターを選択できることを明確に示す（チェックボックス、タグ形式など）

---

### 2. アクティブフィルターの明確な表示

**事例:**
- **Airbnb**: 選択されたフィルターをタグ（チップ）形式で表示し、個別に削除可能
- **Amazon**: 選択されたフィルターを「選択中のフィルター」セクションに表示

**ベストプラクティス:**
- 適用されているフィルターを視覚的に明確に表示（タグ、チップ、バッジなど）
- 各フィルターを個別に削除できる機能を提供
- 「すべてクリア」ボタンで一括リセット可能

---

### 3. フィルター結果数の表示

**事例:**
- **British Museum**: 各フィルターオプションの横に、そのフィルターを適用した場合の結果数を表示
- **eBay**: 各カテゴリーの横に商品数を表示

**ベストプラクティス:**
- 各フィルターオプションの横に、適用した場合の結果数を表示
- 空の結果ページを避けるため、結果数が0の場合は視覚的に無効化

---

### 4. モバイル対応とタッチ操作

**事例:**
- **Shopify**: モバイルでは、フィルターパネルをスライドイン形式で表示
- **Etsy**: タッチ操作に最適化された大きなタップ領域を提供

**ベストプラクティス:**
- タッチ操作に適したサイズのタップ領域（最低44x44px）
- モバイルでは、フィルターパネルをオーバーレイ形式で表示
- スワイプジェスチャーでフィルターパネルを開閉可能

---

### 5. マイクロインタラクションとフィードバック

**事例:**
- **Notion**: フィルターを適用する際に、スムーズなアニメーションで結果が更新される
- **Figma**: フィルターの変更時に、即座に視覚的フィードバックを提供

**ベストプラクティス:**
- フィルターの適用時に、スムーズなトランジションアニメーションを提供
- フィルターの変更時に、即座に視覚的フィードバックを提供（色の変化、アイコンの変化など）

---

## 実装方法の詳細

### 1. フィルター状態の管理

**現在の実装:**
```typescript
// 単一のフィルター状態のみ
const [selectedStatus, setSelectedStatus] = useState<string>("すべて");
const [selectedServiceKind, setSelectedServiceKind] = useState<ServiceKind | null>(null);
```

**改善案:**
```typescript
// 複数のフィルター状態を管理
interface FilterState {
  status: string | null;           // ステータスフィルター
  serviceKind: ServiceKind | null; // 入庫区分フィルター
  isUrgent: boolean | null;         // 緊急案件フィルター（true: 緊急のみ, false: 非緊急のみ, null: すべて）
  isImportant: boolean | null;      // 重要顧客フィルター（true: 重要のみ, false: 非重要のみ, null: すべて）
}

const [filters, setFilters] = useState<FilterState>({
  status: null,
  serviceKind: null,
  isUrgent: null,
  isImportant: null,
});
```

---

### 2. フィルター適用ロジック

**現在の実装:**
```typescript
// 単一のフィルターのみ適用
const filteredJobs = useMemo(() => {
  if (selectedStatus === "すべて") return jobs;
  return jobs.filter((job) => job.field5 === selectedStatus);
}, [jobs, selectedStatus]);
```

**改善案:**
```typescript
// 複数のフィルターを同時に適用
const filteredJobs = useMemo(() => {
  return jobs.filter((job) => {
    // ステータスフィルター
    if (filters.status && job.field5 !== filters.status) return false;
    
    // 入庫区分フィルター
    if (filters.serviceKind) {
      const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
      if (!serviceKinds.includes(filters.serviceKind)) return false;
    }
    
    // 緊急案件フィルター
    if (filters.isUrgent !== null) {
      const urgencyLevel = getUrgencyLevel(job);
      const isUrgent = urgencyLevel === "high" || urgencyLevel === "medium";
      if (filters.isUrgent !== isUrgent) return false;
    }
    
    // 重要顧客フィルター
    if (filters.isImportant !== null) {
      const isImportant = isImportantCustomer(job.field4?.id || "");
      if (filters.isImportant !== isImportant) return false;
    }
    
    return true;
  });
}, [jobs, filters]);
```

---

### 3. UIコンポーネントの追加

#### 3.1 緊急案件フィルターボタン

**配置場所:** トップページのフィルターセクション（`TodaySummaryCard`の近く）

**デザイン:**
```tsx
<Button
  variant={filters.isUrgent === true ? "default" : "outline"}
  onClick={() => {
    setFilters((prev) => ({
      ...prev,
      isUrgent: prev.isUrgent === true ? null : true,
    }));
  }}
  className={cn(
    "flex items-center gap-2",
    filters.isUrgent === true && "bg-red-500 hover:bg-red-600 text-white"
  )}
>
  <AlertCircle className="h-4 w-4" />
  緊急案件のみ
  {filters.isUrgent === true && (
    <Badge variant="secondary" className="ml-1">
      {filteredJobs.length}
    </Badge>
  )}
</Button>
```

#### 3.2 重要顧客フィルターボタン

**配置場所:** トップページのフィルターセクション（緊急案件フィルターボタンの隣）

**デザイン:**
```tsx
<Button
  variant={filters.isImportant === true ? "default" : "outline"}
  onClick={() => {
    setFilters((prev) => ({
      ...prev,
      isImportant: prev.isImportant === true ? null : true,
    }));
  }}
  className={cn(
    "flex items-center gap-2",
    filters.isImportant === true && "bg-yellow-500 hover:bg-yellow-600 text-white"
  )}
>
  <Star className="h-4 w-4 fill-yellow-400" />
  重要顧客のみ
  {filters.isImportant === true && (
    <Badge variant="secondary" className="ml-1">
      {filteredJobs.length}
    </Badge>
  )}
</Button>
```

#### 3.3 アクティブフィルターの表示（タグ形式）

**配置場所:** フィルターセクションの下、ジョブリストの上

**デザイン:**
```tsx
{filters.status && (
  <Badge
    variant="secondary"
    className="flex items-center gap-1"
    onClick={() => setFilters((prev) => ({ ...prev, status: null }))}
  >
    {getStatusLabel(filters.status)}
    <X className="h-3 w-3" />
  </Badge>
)}
{filters.serviceKind && (
  <Badge
    variant="secondary"
    className="flex items-center gap-1"
    onClick={() => setFilters((prev) => ({ ...prev, serviceKind: null }))}
  >
    {getServiceKindLabel(filters.serviceKind)}
    <X className="h-3 w-3" />
  </Badge>
)}
{filters.isUrgent === true && (
  <Badge
    variant="secondary"
    className="flex items-center gap-1 bg-red-100 text-red-700"
    onClick={() => setFilters((prev) => ({ ...prev, isUrgent: null }))}
  >
    緊急案件のみ
    <X className="h-3 w-3" />
  </Badge>
)}
{filters.isImportant === true && (
  <Badge
    variant="secondary"
    className="flex items-center gap-1 bg-yellow-100 text-yellow-700"
    onClick={() => setFilters((prev) => ({ ...prev, isImportant: null }))}
  >
    重要顧客のみ
    <X className="h-3 w-3" />
  </Badge>
)}
{Object.values(filters).some((v) => v !== null) && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setFilters({ status: null, serviceKind: null, isUrgent: null, isImportant: null })}
  >
    すべてクリア
  </Button>
)}
```

---

### 4. 既存コンポーネントの修正

#### 4.1 `TodaySummaryCard`の修正

**変更点:**
- `selectedStatus`の代わりに、`filters.status`を使用
- フィルタークリック時に、`setFilters`を呼び出す

#### 4.2 `ServiceKindSummaryCard`の修正

**変更点:**
- `selectedServiceKind`の代わりに、`filters.serviceKind`を使用
- フィルタークリック時に、`setFilters`を呼び出す

---

## 期待される効果

### 業務効率の向上

1. **緊急案件の迅速な特定**
   - 緊急案件フィルターを適用することで、緊急案件だけを素早く確認できる
   - スクロール不要で、優先順位の高い案件に集中できる
   - **時間短縮:** 緊急案件の特定時間が約50%短縮（推定）

2. **重要顧客の優先的対応**
   - 重要顧客フィルターを適用することで、重要顧客の案件だけを確認できる
   - VIPやリピーターのお客様を優先的に対応できる
   - **顧客満足度向上:** 重要顧客への対応速度が向上

3. **複数条件での絞り込み**
   - 緊急案件かつ重要顧客、緊急案件かつ入庫待ちなど、複数の条件で絞り込める
   - より効率的に業務を進められる
   - **業務効率向上:** フィルター適用による作業時間の短縮（推定20-30%）

---

### ユーザー体験の向上

1. **視覚的な明確性**
   - アクティブフィルターをタグ形式で表示することで、現在のフィルター状態が明確になる
   - 各フィルターを個別に削除できるため、柔軟にフィルターを調整できる

2. **操作の直感性**
   - フィルターボタンのクリックで、即座に結果が更新される
   - 「すべてクリア」ボタンで、一括リセットが可能

3. **モバイル対応**
   - タッチ操作に最適化された大きなタップ領域を提供
   - モバイルでも快適にフィルターを操作できる

---

## 実装の優先度と理由

### 優先度: 最優先（即座に実装すべき機能）

**理由:**

1. **全役割で高く評価されている機能の強化**
   - 受付担当、整備士、管理者、店長の全役割から、この機能の追加を要望されている
   - 現在のフィルター機能は高く評価されているが、緊急案件や重要顧客で絞り込めないことが課題

2. **業務効率への直接的な影響**
   - 緊急案件の特定時間が約50%短縮（推定）
   - 重要顧客への対応速度が向上
   - 複数条件での絞り込みにより、作業時間が20-30%短縮（推定）

3. **実装の容易さ**
   - 既存のフィルター機能の拡張であり、新規機能の追加ではない
   - 既存のコンポーネントを修正するだけで実装可能
   - 実装工数: 2-3日（見積）

4. **ユーザー満足度への直接的な影響**
   - ユーザーから明確に要望されている機能
   - 実装により、ユーザー満足度が大幅に向上する可能性が高い

---

## 実装スケジュール

### Phase 1: フィルター状態管理の実装（0.5日）
- `FilterState`インターフェースの定義
- `filters`ステートの追加
- フィルター適用ロジックの実装

### Phase 2: UIコンポーネントの追加（1日）
- 緊急案件フィルターボタンの追加
- 重要顧客フィルターボタンの追加
- アクティブフィルター表示（タグ形式）の追加
- 「すべてクリア」ボタンの追加

### Phase 3: 既存コンポーネントの修正（0.5日）
- `TodaySummaryCard`の修正
- `ServiceKindSummaryCard`の修正

### Phase 4: テストと調整（0.5-1日）
- ユニットテスト
- 統合テスト
- UI/UXの調整

**合計:** 2.5-3日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Receptionist_山田花子_20251221.md`](../reviews/UX_TESTING_REVIEW_Receptionist_山田花子_20251221.md) - 受付担当のレビュー
- [`reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md`](../reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md) - 店長のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #1 を作成



