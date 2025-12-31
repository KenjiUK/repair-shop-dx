# 12ヶ月点検 再設計版実装提案書

**作成日**: 2025-01-XX  
**目的**: 12ヶ月点検を24ヶ月点検と同じUI/UX仕様に統一する提案

---

## 📋 現状分析

### 1. 現在の実装状況

#### 24ヶ月点検（車検）
- ✅ **再設計版UI実装済み**
  - `InspectionRedesignTabs`コンポーネント使用
  - `InspectionBottomSheetList`コンポーネント使用
  - ボトムシートUIによる直感的な操作
  - 写真・動画撮影機能統合
  - 自動スクロール・自動進捗機能
  - 走行距離入力（独立セクション）
  - 追加見積内容入力セクション
  - OBD診断結果（統合セクション）
  - 1.5倍サイズ調整済み（モバイル最適化）

#### 12ヶ月点検
- ⚠️ **従来版UI使用中**
  - `InspectionDiagnosisView`コンポーネント使用
  - 古いUIパターン
  - OBD診断結果セクションが別途実装（統合されていない）
  - 追加見積内容入力セクションなし
  - 走行距離入力がヘッダー内（24ヶ月点検と異なる）

### 2. テストページの実装状況

- ✅ **12ヶ月点検・24ヶ月点検の両方に対応**
- ✅ **同じUIコンポーネントを使用**
- ✅ **再設計版UIが実装済み**
- ✅ **テストページでは既に統一されている**

---

## 🎯 提案内容

### 提案1: 12ヶ月点検を24ヶ月点検と同じUIに統一

**目的**: UI/UXの一貫性を保ち、整備士の操作効率を向上させる

**実装内容**:

1. **診断ページの条件分岐を変更**
   - 現在: `isInspection`（12ヶ月点検）で`InspectionDiagnosisView`を使用
   - 変更後: `is12MonthInspection`で24ヶ月点検と同じ再設計版UIを使用

2. **使用コンポーネントの統一**
   - `InspectionRedesignTabs`（12ヶ月点検用のカテゴリで）
   - `InspectionBottomSheetList`（ボトムシートUI）
   - `DiagnosisAdditionalEstimateSection`（追加見積内容）
   - `OBDDiagnosticUnifiedSection`（OBD診断結果統合）

3. **セクション構成の統一**
   ```
   1. 走行距離入力（独立セクション）
   2. ブログ撮影用写真（表示のみ、JOBカードから取得）
   3. 点検項目（InspectionRedesignTabs + InspectionBottomSheetList）
   4. 追加見積内容（DiagnosisAdditionalEstimateSection）
   5. OBD診断結果（OBDDiagnosticUnifiedSection）
   6. プレビュー/点検完了ボタン
   ```

4. **データ構造の統一**
   - `inspectionItemsRedesign`を使用（12ヶ月点検用の項目リスト）
   - `inspectionMeasurements`を使用（測定値）
   - `additionalEstimateRequired/Recommended/Optional`を使用（追加見積）

### 提案2: 12ヶ月点検専用の調整

**12ヶ月点検と24ヶ月点検の違い**:

1. **カテゴリ構成**
   - 12ヶ月点検: 5カテゴリ（かじ取り装置、制動装置、走行装置、緩衝装置、動力伝達装置）
   - 24ヶ月点検: 5カテゴリ（エンジン・ルーム点検、室内点検、足廻り点検、下廻り点検、外廻り点検）

2. **検査項目**
   - 12ヶ月点検: `getInspectionItems("12month")`で取得
   - 24ヶ月点検: `getInspectionItems("24month")`で取得
   - ✅ 既に`src/lib/inspection-items-redesign.ts`で実装済み

3. **進捗バーの計算**
   - 12ヶ月点検: 法定項目のみをカウント（`isStatutory: true`の項目）
   - 24ヶ月点検: 法定項目のみをカウント（日常点検は除外）
   - ✅ 既に実装済み

### 提案3: 既存機能の引き継ぎ

**12ヶ月点検で既に実装されている機能**:

1. **OBD診断結果セクション（4428行目）**
   - 現在: `OBDDiagnosticResultSection`と`EnhancedOBDDiagnosticSection`を別々に使用
   - 変更後: `OBDDiagnosticUnifiedSection`に統合（24ヶ月点検と同じ）

2. **診断完了処理**
   - 現在: `is12MonthInspection`で「点検完了」メッセージを表示
   - 変更後: 24ヶ月点検と同じ処理フローを使用
   - ✅ 既に`handleCompleteInternal`で統合済み

3. **追加見積もりがない場合の処理**
   - 24ヶ月点検: 追加見積もりがない場合、診断データを作業データに引き継ぎ、直接作業画面へ
   - 12ヶ月点検: 同じ処理を適用（`handleCompleteInternal`内の条件分岐を`is12MonthInspection`にも適用）

---

## 🔧 実装手順

### Step 1: 診断ページの条件分岐を変更

**ファイル**: `src/app/mechanic/diagnosis/[id]/page.tsx`

**変更箇所1**: 12ヶ月点検のUIを再設計版に変更（4585-4599行目付近）

```typescript
// 変更前
) : isInspection ? (
  /* 12ヶ月点検（従来版） */
  <div className="mb-4">
    <InspectionDiagnosisView
      items={inspectionItems}
      onStatusChange={handleInspectionStatusChange}
      // ...
    />
  </div>
) : isEngineOilChange ? (

// 変更後
) : is12MonthInspection ? (
  /* 12ヶ月点検（再設計版） */
  <div className="space-y-6 mb-4">
    {/* 点検時の総走行距離（ページの最初に独立したセクション） */}
    <Card className="border-slate-200 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-3xl font-semibold text-slate-900 flex items-center gap-2">
          <Gauge className="h-9 w-9 text-slate-600 shrink-0" />
          点検時の総走行距離
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 走行距離入力UI（24ヶ月点検と同じ） */}
      </CardContent>
    </Card>

    {/* 点検項目 */}
    <Card className="border-slate-200 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-3xl font-semibold flex items-center gap-2">
          <ClipboardList className="h-9 w-9 text-slate-600 shrink-0" />
          点検項目
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <InspectionRedesignTabs
          items={inspectionItemsRedesign}
          type="12month"  // 12ヶ月点検用
          activeCategory={activeInspectionCategory || undefined}
          onCategoryChange={(category) => {
            setActiveInspectionCategory(
              category as InspectionCategory12Month | InspectionCategory24Month
            );
          }}
        >
          {(category) => {
            const categoryItems = inspectionItemsRedesign.filter((item) => item.category === category);
            const categories = getInspectionCategories("12month");
            const categoryLabel = INSPECTION_CATEGORY_12MONTH_LABELS[category as InspectionCategory12Month];

            return (
              <InspectionBottomSheetList
                items={categoryItems}
                activeCategory={categoryLabel}
                onStatusChange={handleRedesignStatusChange}
                onPhotoAdd={handleRedesignPhotoAdd}
                onPhotoDelete={handleRedesignPhotoDelete}
                onVideoAdd={handleRedesignVideoAdd}
                onVideoDelete={handleRedesignVideoDelete}
                onNextSection={handleRedesignNextSection}
                currentSection={categoryLabel}
                totalSections={categories.length}
                disabled={isSubmitting}
                measurements={inspectionMeasurements}
                onMeasurementsChange={setInspectionMeasurements}
              />
            );
          }}
        </InspectionRedesignTabs>
      </CardContent>
    </Card>

    {/* 追加見積内容 */}
    <DiagnosisAdditionalEstimateSection
      requiredItems={additionalEstimateRequired}
      recommendedItems={additionalEstimateRecommended}
      optionalItems={additionalEstimateOptional}
      onRequiredItemsChange={setAdditionalEstimateRequired}
      onRecommendedItemsChange={setAdditionalEstimateRecommended}
      onOptionalItemsChange={setAdditionalEstimateOptional}
      disabled={isSubmitting}
    />

    {/* OBD診断結果（統合） */}
    <OBDDiagnosticUnifiedSection
      pdfResult={obdPdfResult}
      onPdfUpload={handleObdPdfUpload}
      onPdfRemove={handleObdPdfRemove}
      detailResult={enhancedOBDDiagnosticResult}
      onDetailChange={setEnhancedOBDDiagnosticResult}
      disabled={isSubmitting}
    />
  </div>
) : isInspection ? (
  /* その他の点検（従来版、後方互換性のため残す） */
  <div className="mb-4">
    <InspectionDiagnosisView
      items={inspectionItems}
      // ...
    />
  </div>
) : isEngineOilChange ? (
```

**変更箇所2**: OBD診断結果セクションの削除（4428-4445行目付近）

```typescript
// 削除: 12ヶ月点検専用のOBD診断結果セクション（再設計版UIに統合されるため）
// {is12MonthInspection && (
//   <>
//     <OBDDiagnosticResultSection ... />
//     <EnhancedOBDDiagnosticSection ... />
//   </>
// )}
```

**変更箇所3**: 追加見積もりがない場合の処理を12ヶ月点検にも適用

```typescript
// handleCompleteInternal内（3232行目付近）
// 24ヶ月点検で追加見積もりがない場合の処理
if ((is24MonthInspection || is12MonthInspection) && selectedWorkOrder?.id) {
  // 追加見積もりの有無を判定
  const hasAdditionalEstimate =
    (additionalEstimateRequired?.length || 0) > 0 ||
    (additionalEstimateRecommended?.length || 0) > 0 ||
    (additionalEstimateOptional?.length || 0) > 0;

  if (!hasAdditionalEstimate) {
    // 追加見積もりがない場合、診断データから作業データに引き継ぎ
    // ...（24ヶ月点検と同じ処理）
  }
}
```

### Step 2: 状態管理の追加

**必要な状態変数**（24ヶ月点検と同じ）:

```typescript
// 12ヶ月点検用の再設計版状態管理
const [inspectionItemsRedesign, setInspectionItemsRedesign] = useState<InspectionItemRedesign[]>(() => {
  if (is12MonthInspection) {
    return getInspectionItems("12month");
  }
  return [];
});

const [activeInspectionCategory, setActiveInspectionCategory] = useState<
  InspectionCategory12Month | InspectionCategory24Month | undefined
>(undefined);

const [inspectionMeasurements, setInspectionMeasurements] = useState<InspectionMeasurements>({});

// 追加見積内容
const [additionalEstimateRequired, setAdditionalEstimateRequired] = useState<EstimateLineItem[]>([]);
const [additionalEstimateRecommended, setAdditionalEstimateRecommended] = useState<EstimateLineItem[]>([]);
const [additionalEstimateOptional, setAdditionalEstimateOptional] = useState<EstimateLineItem[]>([]);
```

### Step 3: ハンドラ関数の追加

**必要なハンドラ関数**（24ヶ月点検と同じ）:

```typescript
// ステータス変更ハンドラ
const handleRedesignStatusChange = (itemId: string, status: InspectionStatus) => {
  setInspectionItemsRedesign((prev) =>
    prev.map((item) => (item.id === itemId ? { ...item, status } : item))
  );
};

// 写真追加/削除ハンドラ
const handleRedesignPhotoAdd = async (itemId: string, file: File) => { /* ... */ };
const handleRedesignPhotoDelete = (itemId: string, index: number) => { /* ... */ };

// 動画追加/削除ハンドラ
const handleRedesignVideoAdd = async (itemId: string, file: File) => { /* ... */ };
const handleRedesignVideoDelete = (itemId: string, index: number) => { /* ... */ };

// 次のセクションへ遷移
const handleRedesignNextSection = () => { /* ... */ };
```

### Step 4: データ保存処理の更新

**`handleCompleteInternal`内で12ヶ月点検のデータを保存**:

```typescript
// 診断データの構築（12ヶ月点検・24ヶ月点検共通）
if (is12MonthInspection || is24MonthInspection) {
  const diagnosisData = {
    items: inspectionItemsRedesign.map((item) => ({
      id: item.id,
      name: item.label,
      status: item.status,
      photoUrls: item.photoUrls || [],
      videoUrls: item.videoUrls || [],
      videoData: item.videoData || [],
      comment: item.comment,
    })),
    measurements: inspectionMeasurements,
    additionalEstimateRequired,
    additionalEstimateRecommended,
    additionalEstimateOptional,
    // ...
  };
  // 保存処理...
}
```

---

## ✅ 実装チェックリスト

- [ ] 診断ページの条件分岐を変更（`is12MonthInspection`で再設計版UIを使用）
- [ ] 12ヶ月点検用の状態管理を追加（`inspectionItemsRedesign`, `activeInspectionCategory`など）
- [ ] ハンドラ関数を追加（`handleRedesignStatusChange`など）
- [ ] OBD診断結果セクションを統合（`OBDDiagnosticUnifiedSection`を使用）
- [ ] 追加見積内容セクションを追加（`DiagnosisAdditionalEstimateSection`）
- [ ] 追加見積もりがない場合の処理を12ヶ月点検にも適用
- [ ] データ保存処理を更新（`handleCompleteInternal`）
- [ ] データ読み込み処理を追加（`selectedWorkOrder?.diagnosis`から復元）
- [ ] プレビューダイアログを更新（12ヶ月点検のデータを表示）
- [ ] 動作確認（12ヶ月点検のテストページと本番ページ）

---

## 🎨 UI/UXの統一

### 統一される要素

1. **ボトムシートUI**: 項目選択時の操作感
2. **自動スクロール**: 項目入力後の自動遷移
3. **写真・動画撮影**: 統合されたメディアキャプチャ
4. **進捗バー**: 法定項目のみをカウント
5. **追加見積内容**: 必須・推奨・任意の3分類
6. **OBD診断結果**: PDFアップロードと詳細入力の統合
7. **ボタンサイズ**: 1.5倍サイズ（モバイル最適化）

### 12ヶ月点検と24ヶ月点検の違い（維持される要素）

1. **カテゴリ構成**: 5カテゴリの内容が異なる
2. **検査項目**: 項目リストが異なる（`getInspectionItems("12month")` vs `getInspectionItems("24month")`）
3. **進捗バーの計算**: カテゴリは異なるが、計算ロジックは同じ

---

## 📝 注意事項

1. **後方互換性**: `isInspection`の条件分岐は残す（他の点検タイプで使用される可能性があるため）
2. **データ移行**: 既存の12ヶ月点検データは`InspectionDiagnosisView`形式で保存されている可能性があるため、読み込み時に変換処理が必要
3. **テスト**: 12ヶ月点検のテストページ（`/mechanic/inspection-redesign-test`）で動作確認済みだが、本番ページでの動作確認が必要

---

## 🚀 実装優先度

**高**: UI/UXの統一により、整備士の操作効率が向上し、学習コストが削減される

**推奨実装順序**:
1. 診断ページの条件分岐変更（Step 1）
2. 状態管理とハンドラ関数の追加（Step 2-3）
3. データ保存・読み込み処理の更新（Step 4）
4. 動作確認とバグ修正

---

## 📚 参考資料

- `src/app/mechanic/inspection-redesign-test/page.tsx`: テストページ（12ヶ月点検・24ヶ月点検の両方に対応）
- `src/app/mechanic/diagnosis/[id]/page.tsx`: 診断ページ（24ヶ月点検の再設計版実装）
- `src/lib/inspection-items-redesign.ts`: 検査項目リスト（12ヶ月点検・24ヶ月点検の両方に対応）
- `docs/24MONTH_INSPECTION_COMPLETENESS_CHECK.md`: 24ヶ月点検の実装完了度チェック





