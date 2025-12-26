# 改善提案 #7: テンプレート機能の実装

**提案日:** 2025-12-21  
**優先度:** 中（入力時間の短縮に貢献）  
**実装工数見積:** 3-4日  
**影響範囲:** 整備士、管理者

---

## 提案の概要

現在のシステムでは、診断結果や見積項目を毎回手動で入力する必要があります。よく使う項目（ブレーキパッド、タイヤ溝、エンジンオイル交換など）をテンプレート化することで、入力時間を大幅に短縮できます。

本提案では、以下の機能を追加します：
1. **診断結果のテンプレート機能**（よく使う項目を保存・読み込み可能）
2. **見積項目のテンプレート機能**（よく使う項目を保存・読み込み可能）
3. **テンプレートの管理機能**（テンプレートの作成・編集・削除）
4. **テンプレートの共有機能**（将来の拡張）

---

## なぜ必要か：ユーザーコメントから

### 🔧 整備士（佐藤 健一様）のコメント

**改善してほしい点:**
> 「診断結果の入力画面で、よく使う項目（ブレーキパッド、タイヤ溝など）をテンプレート化できると、もっと効率的だと思います。」

**追加で必要な機能:**
> - 診断結果のテンプレート機能（よく使う項目を保存できる）

**業務上の課題:**
- 同じような診断項目を毎回入力する必要がある
- ブレーキパッド、タイヤ溝など、よく使う項目をテンプレート化したい
- 入力時間を短縮したい

---

### 👔 管理者（鈴木 太郎様）のコメント

**改善してほしい点:**
> 「見積項目の入力画面で、よく使う項目（エンジンオイル交換、ブレーキパッド交換など）をテンプレート化できると、もっと効率的だと思います。」

**追加で必要な機能:**
> - 見積項目のテンプレート機能（よく使う項目を保存できる）

**業務上の課題:**
- 同じような見積項目を毎回入力する必要がある
- エンジンオイル交換、ブレーキパッド交換など、よく使う項目をテンプレート化したい
- 入力時間を短縮したい

---

## 現在の実装状況

### 実装済みの機能

1. **診断結果の入力画面**
   - 診断結果を記録できる機能が実装済み
   - 項目ごとに記録可能

2. **見積作成画面**
   - 見積項目を追加・編集・削除できる機能が実装済み
   - 項目ごとに記録可能

### 未実装の機能

1. **テンプレート保存機能**
   - 診断結果のテンプレートを保存する機能がない
   - 見積項目のテンプレートを保存する機能がない

2. **テンプレート読み込み機能**
   - 保存したテンプレートを読み込む機能がない
   - テンプレートから項目を追加する機能がない

3. **テンプレート管理機能**
   - テンプレートの作成・編集・削除機能がない
   - テンプレートの一覧表示機能がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. 直感的なナビゲーションと簡素化されたユーザージャーニー

**事例:**
- **Notion**: テンプレートの保存・読み込み機能を明確なアイコンとラベルで表示。最小限のステップで操作可能。
- **Airtable**: テンプレートの保存・読み込み機能を直感的なUIで提供。

**ベストプラクティス:**
- テンプレートの保存・読み込み機能を明確なアイコンとラベルで表示
- 最小限のステップで操作可能にする
- 直感的なUIを提供

---

### 2. 一貫性とミニマリストデザイン

**事例:**
- **Figma**: テンプレート機能を一貫したデザイン言語で実装。不要な要素を削除し、ユーザーがテンプレートに集中できる。
- **Canva**: ミニマリストなアプローチで、テンプレート機能を提供。

**ベストプラクティス:**
- 一貫したデザイン言語を維持
- 不要な要素を削除し、ユーザーがテンプレートに集中できるようにする
- ミニマリストなアプローチを採用

---

### 3. レスポンシブとモバイルファーストデザイン

**事例:**
- **Google Docs**: モバイルでもテンプレートの保存・読み込みが快適に操作できる。
- **Microsoft Word**: モバイルファーストのアプローチで、テンプレート機能を提供。

**ベストプラクティス:**
- モバイルでもテンプレートの保存・読み込みが快適に操作できる
- モバイルファーストのアプローチを採用
- すべてのデバイスで機能するようにする

---

### 4. マイクロインタラクション

**事例:**
- **Notion**: テンプレートを保存・読み込みする際、スムーズなアニメーションでフィードバックを提供。
- **Airtable**: テンプレート操作時に、即座に視覚的フィードバックを提供。

**ベストプラクティス:**
- テンプレートを保存・読み込みする際、スムーズなアニメーションでフィードバックを提供
- 即座に視覚的フィードバックを提供
- ユーザーの操作を確認できるようにする

---

### 5. パーソナライゼーションとAI統合

**事例:**
- **Notion**: AIを活用して、ユーザーの行動に基づいてテンプレートを推奨。
- **Airtable**: AIを活用して、パーソナライズされたテンプレートを提供。

**ベストプラクティス:**
- AIを活用して、ユーザーの行動に基づいてテンプレートを推奨
- パーソナライズされたテンプレートを提供
- ユーザーの好みを学習し、関連性の高いテンプレートを表示

---

### 6. パフォーマンス最適化

**事例:**
- **Google Docs**: テンプレートの保存・読み込みを高速化。処理中に視覚的インジケーターを提供。
- **Microsoft Word**: テンプレート機能を最適化し、高速な操作を実現。

**ベストプラクティス:**
- テンプレートの保存・読み込みを高速化
- 処理中に視覚的インジケーターを提供
- 高速でレスポンシブなインターフェースを実現

---

### 7. 明確なフィードバックとエラーハンドリング

**事例:**
- **Notion**: テンプレートの保存・読み込み時に、明確なメッセージを表示。
- **Airtable**: エラー発生時に、情報豊富なエラーメッセージを提供。

**ベストプラクティス:**
- テンプレートの保存・読み込み時に、明確なメッセージを表示
- エラー発生時に、情報豊富なエラーメッセージを提供
- システムの状態をユーザーに明確に伝える

---

## 実装方法の詳細

### 1. 診断結果テンプレート機能

**データ構造:**
```typescript
interface DiagnosisTemplate {
  id: string;
  name: string;                      // テンプレート名
  category: string | null;          // カテゴリー（例: "ブレーキ"、"タイヤ"）
  items: DiagnosisTemplateItem[];   // テンプレート項目
  createdAt: string;                 // 作成日時
  updatedAt: string;                 // 更新日時
  createdBy: string;                 // 作成者
}

interface DiagnosisTemplateItem {
  type: "text" | "number" | "select" | "checkbox"; // 項目タイプ
  label: string;                     // ラベル
  value: string | number | boolean;  // デフォルト値
  options?: string[];                // 選択肢（selectタイプの場合）
}
```

**UI実装:**
```tsx
// 診断結果入力画面にテンプレート機能を追加
<div className="flex items-center gap-2 mb-4">
  <Button
    variant="outline"
    onClick={() => setIsTemplateDialogOpen(true)}
    className="flex items-center gap-2"
  >
    <FileText className="h-4 w-4" />
    テンプレートを読み込み
  </Button>
  <Button
    variant="outline"
    onClick={() => handleSaveTemplate()}
    className="flex items-center gap-2"
  >
    <Save className="h-4 w-4" />
    テンプレートを保存
  </Button>
</div>

// テンプレート読み込みダイアログ
<Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>テンプレートを読み込み</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* テンプレート検索 */}
      <Input
        value={templateSearchQuery}
        onChange={(e) => setTemplateSearchQuery(e.target.value)}
        placeholder="テンプレート名で検索"
      />
      
      {/* テンプレートリスト */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:bg-slate-50"
            onClick={() => handleLoadTemplate(template)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{template.name}</div>
                  {template.category && (
                    <div className="text-xs text-slate-500">{template.category}</div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">
                    {template.items.length}項目
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </DialogContent>
</Dialog>

// テンプレート保存ダイアログ
<Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>テンプレートを保存</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>テンプレート名</Label>
        <Input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="例: ブレーキ点検"
        />
      </div>
      <div>
        <Label>カテゴリー</Label>
        <Select value={templateCategory} onValueChange={setTemplateCategory}>
          <SelectTrigger>
            <SelectValue placeholder="カテゴリーを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="brake">ブレーキ</SelectItem>
            <SelectItem value="tire">タイヤ</SelectItem>
            <SelectItem value="engine">エンジン</SelectItem>
            <SelectItem value="electrical">電装</SelectItem>
            <SelectItem value="other">その他</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button onClick={handleSaveTemplateConfirm}>保存</Button>
      </DialogFooter>
    </div>
  </DialogContent>
</Dialog>
```

---

### 2. 見積項目テンプレート機能

**データ構造:**
```typescript
interface EstimateTemplate {
  id: string;
  name: string;                      // テンプレート名
  category: string | null;          // カテゴリー（例: "メンテナンス"、"修理"）
  items: EstimateTemplateItem[];   // テンプレート項目
  createdAt: string;                 // 作成日時
  updatedAt: string;                 // 更新日時
  createdBy: string;                 // 作成者
}

interface EstimateTemplateItem {
  name: string;                      // 項目名
  description: string | null;        // 説明
  price: number;                     // 単価
  quantity: number;                  // 数量
  category: "required" | "recommended" | "optional"; // カテゴリー
}
```

**UI実装:**
```tsx
// 見積作成画面にテンプレート機能を追加
<div className="flex items-center gap-2 mb-4">
  <Button
    variant="outline"
    onClick={() => setIsEstimateTemplateDialogOpen(true)}
    className="flex items-center gap-2"
  >
    <FileText className="h-4 w-4" />
    テンプレートを読み込み
  </Button>
  <Button
    variant="outline"
    onClick={() => handleSaveEstimateTemplate()}
    className="flex items-center gap-2"
  >
    <Save className="h-4 w-4" />
    テンプレートを保存
  </Button>
</div>

// 見積テンプレート読み込みダイアログ
<Dialog open={isEstimateTemplateDialogOpen} onOpenChange={setIsEstimateTemplateDialogOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>見積テンプレートを読み込み</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* テンプレート検索 */}
      <Input
        value={templateSearchQuery}
        onChange={(e) => setTemplateSearchQuery(e.target.value)}
        placeholder="テンプレート名で検索"
      />
      
      {/* テンプレートリスト */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredEstimateTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:bg-slate-50"
            onClick={() => handleLoadEstimateTemplate(template)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{template.name}</div>
                  {template.category && (
                    <div className="text-xs text-slate-500">{template.category}</div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">
                    {template.items.length}項目
                    {template.items.length > 0 && (
                      <span className="ml-2">
                        合計: ¥{template.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEstimateTemplate(template.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </DialogContent>
</Dialog>
```

---

### 3. テンプレートの保存機能

**実装方法:**
```typescript
// 診断結果テンプレートの保存
async function handleSaveTemplateConfirm() {
  if (!templateName.trim()) {
    toast.error("テンプレート名を入力してください");
    return;
  }
  
  // 現在の診断結果からテンプレートを作成
  const template: DiagnosisTemplate = {
    id: generateId(),
    name: templateName,
    category: templateCategory,
    items: diagnosisItems.map((item) => ({
      type: item.type,
      label: item.label,
      value: item.value,
      options: item.options,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: getCurrentUser(), // 現在のユーザー
  };
  
  // テンプレートを保存
  await saveDiagnosisTemplate(template);
  
  toast.success("テンプレートを保存しました", {
    description: template.name,
  });
  
  setIsSaveTemplateDialogOpen(false);
  setTemplateName("");
  setTemplateCategory(null);
}

// 見積テンプレートの保存
async function handleSaveEstimateTemplateConfirm() {
  if (!templateName.trim()) {
    toast.error("テンプレート名を入力してください");
    return;
  }
  
  // 現在の見積項目からテンプレートを作成
  const template: EstimateTemplate = {
    id: generateId(),
    name: templateName,
    category: templateCategory,
    items: estimateItems.map((item) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: item.quantity,
      category: item.category,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: getCurrentUser(),
  };
  
  // テンプレートを保存
  await saveEstimateTemplate(template);
  
  toast.success("見積テンプレートを保存しました", {
    description: template.name,
  });
  
  setIsSaveEstimateTemplateDialogOpen(false);
  setTemplateName("");
  setTemplateCategory(null);
}
```

---

### 4. テンプレートの読み込み機能

**実装方法:**
```typescript
// 診断結果テンプレートの読み込み
function handleLoadTemplate(template: DiagnosisTemplate) {
  // テンプレートの項目を現在の診断結果に追加
  template.items.forEach((item) => {
    addDiagnosisItem({
      type: item.type,
      label: item.label,
      value: item.value,
      options: item.options,
    });
  });
  
  toast.success("テンプレートを読み込みました", {
    description: template.name,
  });
  
  setIsTemplateDialogOpen(false);
}

// 見積テンプレートの読み込み
function handleLoadEstimateTemplate(template: EstimateTemplate) {
  // テンプレートの項目を現在の見積に追加
  template.items.forEach((item) => {
    addEstimateItem({
      name: item.name,
      description: item.description,
      price: item.price,
      quantity: item.quantity,
      category: item.category,
    });
  });
  
  toast.success("見積テンプレートを読み込みました", {
    description: template.name,
  });
  
  setIsEstimateTemplateDialogOpen(false);
}
```

---

## 期待される効果

### 業務効率の向上

1. **入力時間の短縮**
   - よく使う項目をテンプレート化することで、入力時間が大幅に短縮される
   - テンプレートから項目を読み込むことで、手動入力が不要になる
   - **時間短縮:** 診断結果の入力時間が約40%短縮（推定）
   - **時間短縮:** 見積作成時間が約35%短縮（推定）

2. **入力ミスの削減**
   - テンプレートを使用することで、入力ミスが削減される
   - 標準化された項目を使用することで、品質が向上

3. **業務の標準化**
   - テンプレートを使用することで、業務が標準化される
   - 新人スタッフでも、テンプレートを使用して適切な記録ができる

---

### ユーザー体験の向上

1. **操作の簡素化**
   - テンプレートの保存・読み込みが簡単に操作できる
   - 直感的なUIにより、迷わずに操作できる

2. **パーソナライゼーション**
   - ユーザーが独自のテンプレートを作成できる
   - よく使う項目をテンプレート化することで、個人の作業スタイルに合わせられる

---

## 実装の優先度と理由

### 優先度: 中（入力時間の短縮に貢献）

**理由:**

1. **入力時間の短縮に貢献**
   - 診断結果の入力時間が約40%短縮（推定）
   - 見積作成時間が約35%短縮（推定）
   - 業務効率が大幅に向上

2. **実装の複雑さ**
   - テンプレートの保存・読み込み機能の実装が必要
   - テンプレート管理機能の実装が必要
   - 実装工数: 3-4日（見積）

3. **ユーザー要望**
   - 整備士と管理者から、この機能の追加を要望されている
   - ただし、最優先機能ではない

---

## 実装スケジュール

### Phase 1: データ構造の定義（0.5日）
- `DiagnosisTemplate`、`DiagnosisTemplateItem`型の定義
- `EstimateTemplate`、`EstimateTemplateItem`型の定義
- テンプレート保存用のAPI設計

### Phase 2: 診断結果テンプレート機能の実装（1.5日）
- テンプレート保存機能の実装
- テンプレート読み込み機能の実装
- テンプレート管理UIの実装

### Phase 3: 見積テンプレート機能の実装（1.5日）
- テンプレート保存機能の実装
- テンプレート読み込み機能の実装
- テンプレート管理UIの実装

### Phase 4: テンプレート管理機能の実装（0.5日）
- テンプレートの編集・削除機能
- テンプレートの検索・フィルタリング機能

**合計:** 4日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md`](../reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md) - 整備士のレビュー
- [`reviews/UX_TESTING_REVIEW_Admin_鈴木太郎_20251221.md`](../reviews/UX_TESTING_REVIEW_Admin_鈴木太郎_20251221.md) - 管理者のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #7 を作成



