# 改善提案 #2: 検索機能の実装

**提案日:** 2025-12-21  
**優先度:** 高（最優先）  
**実装工数見積:** 2-3日  
**影響範囲:** 全役割（受付担当、整備士、管理者、店長）

---

## 提案の概要

現在のシステムでは、`JobSearchBar`コンポーネントは実装されていますが、**お客様名や車両情報での検索機能が完全には機能していない**、または**検索結果の表示が不十分**である可能性があります。

本提案では、以下の機能を追加・改善します：
1. **お客様名での検索機能の強化**（部分一致、あいまい検索対応）
2. **車両情報での検索機能**（ナンバープレート、車名、車種など）
3. **オートコンプリート（自動補完）機能**の追加
4. **検索履歴機能**の追加
5. **検索結果のハイライト表示**

---

## なぜ必要か：ユーザーコメントから

### 📧 受付担当（山田 花子様）のコメント

**追加シナリオ18: お客様からの急な問い合わせ対応（電話）**

**質問1: 電話で問い合わせがあった際、該当する案件をすぐに見つけられましたか？**
- [x] できた（4点）

**コメント:**
> 「お客様名や車両情報で検索できる機能があると良いと思いますが、現在のシステムでは、一覧から該当する案件を探す必要があります。お客様名や車両情報で検索できる機能があると、もっと便利だと思います。」

**追加で必要な機能:**
> - お客様名や車両情報で検索できる機能

**業務上の課題:**
- 電話で問い合わせがあった際、お客様名や車両情報を聞いても、一覧から該当する案件を探すのに時間がかかる
- 忙しい時間帯に、電話をしながら案件を探すのが困難
- 顧客クレーム対応時に、該当する案件をすぐに見つけられない

---

### 👨‍💼 店長（高橋 美咲様）のコメント

**追加シナリオ11: 顧客クレーム対応**

**質問1: 顧客クレームが発生した際、該当する案件をすぐに見つけられましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「お客様名や車両情報で検索できる機能があると良いと思いますが、現在のシステムでは、一覧から該当する案件を探す必要があります。お客様名や車両情報で検索できる機能があると、もっと便利だと思います。」

**追加で必要な機能:**
> - お客様名や車両情報で検索できる機能

**業務上の課題:**
- 顧客クレーム対応時に、お客様名や車両情報から該当する案件を素早く特定したい
- 過去の案件を参照する際、検索機能があると便利

---

### 🔧 整備士（佐藤 健一様）のコメント

**業務上の課題:**
- 作業中に、お客様名や車両情報から該当する案件を確認したい
- 過去の診断結果を参照する際、検索機能があると便利

---

### 👔 管理者（鈴木 太郎様）のコメント

**追加シナリオ13: 過去の見積・案件の参照**

**質問1: 過去の見積や案件を参照する際、その情報にすぐアクセスできましたか？**
- [x] できた（4点）

**コメント:**
> 「現在のシステムでは、過去の見積や案件を参照する機能は、まだ実装されていないようです。過去の見積や案件を参照できる機能があると、もっと便利だと思います。特に、同じお客様の過去の見積を参照できると、見積の作成がスムーズです。」

**業務上の課題:**
- 過去の見積を参考に見積を作成する際、お客様名や車両情報で検索できると便利
- 同じお客様の過去の作業履歴を確認する際、検索機能があると便利

---

## 現在の実装状況

### 実装済みの機能

1. **`JobSearchBar`コンポーネント**
   - 検索バーのUIは実装済み
   - 折りたたみ式の検索バー
   - QRコードスキャン機能との統合

2. **検索クエリの状態管理**
   - `searchQuery`ステートが存在
   - `debouncedSearchQuery`によるデバウンス処理

3. **検索履歴機能**
   - `addSearchHistory`、`getSearchHistory`関数が存在
   - `SearchHistoryItem`型が定義されている

### 未実装・不完全な機能

1. **検索ロジックの不完全性**
   - 検索ロジックが実装されているか、または十分に機能していない可能性
   - お客様名、車両情報での検索が完全には機能していない可能性

2. **オートコンプリート機能**
   - 検索候補の自動表示機能がない
   - 入力中の候補表示がない

3. **検索結果のハイライト**
   - 検索キーワードが検索結果内でハイライト表示されない

4. **あいまい検索**
   - 部分一致検索が完全に機能していない可能性
   - タイプミスへの対応がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. AI駆動のオートコンプリート

**事例:**
- **Google Search**: AIを活用した文脈を理解するオートコンプリートを提供。ユーザーの意図を理解し、セマンティック検索を実現。
- **Amazon**: 商品名、ブランド名、カテゴリーなど、複数の検索対象を統合したオートコンプリートを提供。

**ベストプラクティス:**
- AIを活用した文脈を理解するオートコンプリートを提供
- セマンティック検索（意味検索）を実装
- ユーザーの意図を理解し、関連性の高い候補を表示

---

### 2. マッチングテキストのハイライト

**事例:**
- **GitHub**: 検索結果内で、検索キーワードをハイライト表示。ユーザーが結果を素早くスキャンできる。
- **Notion**: 検索結果内で、マッチしたテキストを太字で表示。

**ベストプラクティス:**
- 検索結果内で、検索キーワードをハイライト表示（太字、背景色など）
- ユーザーが結果を素早くスキャンできるようにする

---

### 3. 検索結果数の表示

**事例:**
- **eBay**: 各オートコンプリート候補の横に、その候補で検索した場合の結果数を表示。
- **British Museum**: 各検索候補の横に、結果数を表示。

**ベストプラクティス:**
- 各オートコンプリート候補の横に、その候補で検索した場合の結果数を表示
- ユーザーが検索結果の量を事前に把握できるようにする

---

### 4. 検索候補リストの長さ制限

**事例:**
- **Google**: 検索候補を10件以下に制限し、ユーザーを圧倒しないようにしている。
- **Amazon**: 検索候補を8-10件に制限。

**ベストプラクティス:**
- 検索候補を10件以下に制限
- ユーザーを圧倒しないようにする

---

### 5. モバイル最適化

**事例:**
- **Shopify**: モバイルでは、検索バーを大きく表示し、タッチ操作に最適化。
- **Etsy**: モバイルでは、検索候補を大きく表示し、タップしやすくしている。

**ベストプラクティス:**
- モバイルでは、検索バーを大きく表示
- 検索候補を大きく表示し、タップしやすくする
- タッチ操作に最適化されたレイアウトを提供

---

### 6. キーボードナビゲーション

**事例:**
- **GitHub**: 検索候補をキーボードの矢印キーでナビゲート可能。Enterキーで選択可能。
- **Notion**: キーボードナビゲーションを完全にサポート。

**ベストプラクティス:**
- 検索候補をキーボードの矢印キーでナビゲート可能にする
- Enterキーで選択可能にする
- アクセシビリティを向上

---

### 7. エラー許容性（タイプミス対応）

**事例:**
- **Google**: タイプミスを自動的に修正し、正しい検索結果を表示。
- **Amazon**: タイプミスを許容し、関連性の高い結果を表示。

**ベストプラクティス:**
- タイプミスを許容する検索ロジックを実装
- あいまい検索（Fuzzy Search）を実装
- 関連性の高い結果を表示

---

### 8. 最近の検索履歴

**事例:**
- **Google**: 検索履歴を表示し、ユーザーが過去の検索を素早く再実行できる。
- **Amazon**: 検索履歴を表示し、ユーザーの過去の興味を反映。

**ベストプラクティス:**
- 検索履歴を表示（ゼロ状態の時など）
- ユーザーが過去の検索を素早く再実行できるようにする
- パーソナライズされた体験を提供

---

### 9. カテゴリー別の候補表示

**事例:**
- **Amazon**: 検索候補を「商品」「ブランド」「カテゴリー」など、カテゴリー別に表示。
- **eBay**: 検索候補を「商品」「カテゴリー」「ブランド」など、カテゴリー別に表示。

**ベストプラクティス:**
- 検索候補をカテゴリー別に表示（お客様名、車両情報、ナンバープレートなど）
- カテゴリーごとにラベルを付けて表示
- ユーザーが候補の種類を素早く識別できるようにする

---

### 10. 音声検索の統合

**事例:**
- **Google**: 音声検索を統合し、ユーザーが音声で検索できる。
- **Amazon**: Alexaを活用した音声検索を提供。

**ベストプラクティス:**
- 音声検索機能を統合（将来の拡張として）
- アクセシビリティを向上
- モバイルでの利便性を向上

---

## 実装方法の詳細

### 1. 検索ロジックの実装

**現在の実装（推測）:**
```typescript
// 検索ロジックが不完全または未実装の可能性
const filteredJobs = jobs.filter((job) => {
  if (!debouncedSearchQuery.trim()) return true;
  const query = debouncedSearchQuery.toLowerCase();
  // 検索ロジックが不完全
});
```

**改善案:**
```typescript
// 包括的な検索ロジック
const filteredJobs = useMemo(() => {
  if (!debouncedSearchQuery.trim()) return jobs;
  
  const query = debouncedSearchQuery.toLowerCase().trim();
  
  return jobs.filter((job) => {
    // お客様名での検索（部分一致、あいまい検索）
    const customerName = job.field4?.name || "";
    if (customerName.toLowerCase().includes(query)) return true;
    
    // 車両情報での検索
    const vehicleInfo = job.field6?.name || "";
    if (vehicleInfo.toLowerCase().includes(query)) return true;
    
    // ナンバープレートでの検索
    const plateNumber = job.field6?.plateNumber || "";
    if (plateNumber.toLowerCase().includes(query)) return true;
    
    // 車名での検索
    const vehicleName = job.field6?.vehicleName || "";
    if (vehicleName.toLowerCase().includes(query)) return true;
    
    // タグIDでの検索
    const tagId = job.field_tag_id || "";
    if (tagId.toLowerCase().includes(query)) return true;
    
    // ジョブIDでの検索
    if (job.id.toLowerCase().includes(query)) return true;
    
    // あいまい検索（将来的な拡張）
    // Levenshtein距離を使用したあいまい検索を実装可能
    
    return false;
  });
}, [jobs, debouncedSearchQuery]);
```

---

### 2. オートコンプリート機能の実装

**実装方法:**
```typescript
// オートコンプリート候補の生成
const searchSuggestions = useMemo(() => {
  if (!searchQuery.trim() || searchQuery.length < 2) return [];
  
  const query = searchQuery.toLowerCase();
  const suggestions: SearchSuggestion[] = [];
  
  // お客様名の候補
  const customerNames = new Set<string>();
  jobs.forEach((job) => {
    const name = job.field4?.name || "";
    if (name.toLowerCase().includes(query) && name.trim()) {
      customerNames.add(name);
    }
  });
  
  // 車両情報の候補
  const vehicleInfos = new Set<string>();
  jobs.forEach((job) => {
    const info = job.field6?.name || "";
    if (info.toLowerCase().includes(query) && info.trim()) {
      vehicleInfos.add(info);
    }
  });
  
  // ナンバープレートの候補
  const plateNumbers = new Set<string>();
  jobs.forEach((job) => {
    const plate = job.field6?.plateNumber || "";
    if (plate.toLowerCase().includes(query) && plate.trim()) {
      plateNumbers.add(plate);
    }
  });
  
  // カテゴリー別に候補を追加（最大10件）
  Array.from(customerNames).slice(0, 5).forEach((name) => {
    suggestions.push({
      type: "customer",
      label: name,
      value: name,
      count: jobs.filter((j) => j.field4?.name === name).length,
    });
  });
  
  Array.from(vehicleInfos).slice(0, 3).forEach((info) => {
    suggestions.push({
      type: "vehicle",
      label: info,
      value: info,
      count: jobs.filter((j) => j.field6?.name === info).length,
    });
  });
  
  Array.from(plateNumbers).slice(0, 2).forEach((plate) => {
    suggestions.push({
      type: "plate",
      label: plate,
      value: plate,
      count: jobs.filter((j) => j.field6?.plateNumber === plate).length,
    });
  });
  
  return suggestions.slice(0, 10); // 最大10件
}, [jobs, searchQuery]);

interface SearchSuggestion {
  type: "customer" | "vehicle" | "plate" | "tag";
  label: string;
  value: string;
  count: number;
}
```

---

### 3. オートコンプリートUIコンポーネント

**実装方法:**
```tsx
// オートコンプリートドロップダウン
{showSearchSuggestions && searchSuggestions.length > 0 && (
  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
    {searchSuggestions.map((suggestion, index) => (
      <div
        key={`${suggestion.type}-${suggestion.value}-${index}`}
        className={cn(
          "px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors",
          selectedSuggestionIndex === index && "bg-slate-100"
        )}
        onClick={() => {
          setSearchQuery(suggestion.value);
          setShowSearchSuggestions(false);
        }}
        onMouseEnter={() => setSelectedSuggestionIndex(index)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {suggestion.type === "customer" && <User className="h-4 w-4 text-slate-400" />}
            {suggestion.type === "vehicle" && <Car className="h-4 w-4 text-slate-400" />}
            {suggestion.type === "plate" && <FileText className="h-4 w-4 text-slate-400" />}
            <span className="text-sm">
              {highlightMatch(suggestion.label, searchQuery)}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {suggestion.count}件
          </Badge>
        </div>
      </div>
    ))}
  </div>
)}
```

---

### 4. 検索結果のハイライト表示

**実装方法:**
```typescript
// マッチしたテキストをハイライト
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <>
      {parts.map((part, index) => (
        <span
          key={index}
          className={part.toLowerCase() === query.toLowerCase() ? "font-bold bg-yellow-200" : ""}
        >
          {part}
        </span>
      ))}
    </>
  );
}
```

---

### 5. 検索履歴機能の強化

**実装方法:**
```typescript
// 検索履歴の表示（ゼロ状態の時）
const searchHistory = getSearchHistory();

{searchQuery.trim().length === 0 && searchHistory.length > 0 && (
  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-50">
    <div className="px-4 py-2 border-b border-slate-200">
      <span className="text-xs font-medium text-slate-500">最近の検索</span>
    </div>
    {searchHistory.slice(0, 5).map((item, index) => (
      <div
        key={item.id}
        className="px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => {
          setSearchQuery(item.query);
          addSearchHistory(item.query);
        }}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="text-sm">{item.query}</span>
        </div>
      </div>
    ))}
  </div>
)}
```

---

### 6. キーボードナビゲーション

**実装方法:**
```typescript
// キーボードナビゲーション
const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showSearchSuggestions || searchSuggestions.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < searchSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const suggestion = searchSuggestions[selectedSuggestionIndex];
      setSearchQuery(suggestion.value);
      setShowSearchSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSearchSuggestions(false);
    }
  };
  
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [showSearchSuggestions, searchSuggestions, selectedSuggestionIndex]);
```

---

## 期待される効果

### 業務効率の向上

1. **電話対応時の迅速な案件特定**
   - お客様名や車両情報を聞いた瞬間に、検索バーに入力して該当する案件を素早く見つけられる
   - 一覧から探す必要がなくなり、電話対応時間が短縮される
   - **時間短縮:** 案件の特定時間が約70%短縮（推定）

2. **顧客クレーム対応時の迅速な対応**
   - 顧客クレームが発生した際、お客様名や車両情報で検索して該当する案件を素早く特定できる
   - 過去の案件も検索できるため、関連する情報を素早く確認できる

3. **過去の案件参照の効率化**
   - 過去の見積や案件を参照する際、お客様名や車両情報で検索できる
   - 同じお客様の過去の作業履歴を素早く確認できる

---

### ユーザー体験の向上

1. **オートコンプリートによる入力の効率化**
   - 入力中に候補が表示されるため、完全に入力する必要がない
   - タイプミスを減らし、検索精度が向上

2. **検索結果のハイライト表示**
   - 検索キーワードがハイライト表示されるため、結果を素早くスキャンできる

3. **検索履歴による再検索の効率化**
   - 過去の検索履歴を表示することで、同じ検索を素早く再実行できる

---

## 実装の優先度と理由

### 優先度: 最優先（即座に実装すべき機能）

**理由:**

1. **全役割で必要とされている機能**
   - 受付担当、整備士、管理者、店長の全役割から、この機能の追加を要望されている
   - 電話対応や顧客クレーム対応など、日常業務で頻繁に使用される機能

2. **業務効率への直接的な影響**
   - 案件の特定時間が約70%短縮（推定）
   - 電話対応時間が短縮され、顧客満足度が向上
   - 顧客クレーム対応時の迅速な対応が可能

3. **実装の容易さ**
   - 既存の`JobSearchBar`コンポーネントを拡張するだけで実装可能
   - 検索ロジックの実装は比較的簡単
   - 実装工数: 2-3日（見積）

4. **ユーザー満足度への直接的な影響**
   - ユーザーから明確に要望されている機能
   - 実装により、ユーザー満足度が大幅に向上する可能性が高い

---

## 実装スケジュール

### Phase 1: 検索ロジックの実装（1日）
- お客様名、車両情報、ナンバープレートでの検索ロジックの実装
- 部分一致検索の実装
- 検索結果のフィルタリング

### Phase 2: オートコンプリート機能の実装（1日）
- オートコンプリート候補の生成ロジック
- オートコンプリートUIコンポーネント
- キーボードナビゲーション

### Phase 3: 検索結果のハイライト表示（0.5日）
- マッチしたテキストのハイライト表示
- 検索結果内でのハイライト表示

### Phase 4: 検索履歴機能の強化（0.5日）
- 検索履歴の表示（ゼロ状態の時）
- 検索履歴からの再検索機能

**合計:** 3日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Receptionist_山田花子_20251221.md`](../reviews/UX_TESTING_REVIEW_Receptionist_山田花子_20251221.md) - 受付担当のレビュー
- [`reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md`](../reviews/UX_TESTING_REVIEW_Manager_高橋美咲_20251221.md) - 店長のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #2 を作成



