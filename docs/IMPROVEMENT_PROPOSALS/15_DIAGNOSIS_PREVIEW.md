# 改善提案 #15: 診断結果のプレビュー機能

**提案日:** 2025-12-21  
**優先度:** 低（利便性の向上）  
**実装工数見積:** 1-2日  
**影響範囲:** 整備士

---

## 提案の概要

現在のシステムでは、診断結果を保存する前に、入力内容を確認する機能がありません。診断結果を保存する前に、プレビュー画面で入力内容を確認できる機能を追加することで、入力ミスを削減し、診断結果の品質を向上させます。

本提案では、以下の機能を追加します：
1. **診断結果を保存する前に、プレビュー画面を表示する機能**
2. **プレビュー画面から直接編集できる機能**
3. **プレビュー画面での確認項目の表示**

---

## なぜ必要か：ユーザーコメントから

### 🔧 整備士（佐藤 健一様）のコメント

**改善してほしい点:**
> 「診断結果を保存する前に、入力内容を確認できるプレビュー機能があると良いと思います。」

**追加で必要な機能:**
> - 診断結果のプレビュー機能

**業務上の課題:**
- 診断結果を保存する前に、入力内容を確認したい
- 入力ミスを削減したい
- 診断結果の品質を向上させたい

---

## 現在の実装状況

### 実装済みの機能

1. **診断結果の入力画面**
   - 診断結果を記録できる機能が実装済み
   - 項目ごとに記録可能

2. **診断結果の保存機能**
   - 診断結果を保存できる機能が実装済み

### 未実装の機能

1. **プレビュー機能**
   - 診断結果を保存する前に、プレビュー画面を表示する機能がない

2. **プレビュー画面からの編集**
   - プレビュー画面から直接編集する機能がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. 明確でアクセス可能なプレビューオプション

**事例:**
- **Google Forms**: プレビュー機能を目立つ位置に表示し、簡単にアクセス可能。「送信前にプレビュー」などの明確なラベルを使用。
- **Typeform**: プレビュー機能を明確に表示。

**ベストプラクティス:**
- プレビュー機能を目立つ位置に表示し、簡単にアクセス可能にする
- 「送信前にプレビュー」などの明確なラベルを使用
- ユーザーを効果的に導く

---

### 2. 一貫したデザインとレイアウト

**事例:**
- **Notion**: プレビューページが最終送信形式を反映し、データがどのように表示されるかの真の表現を提供。
- **Figma**: デザインの一貫性を維持し、ユーザーが不一致やエラーを識別できるようにする。

**ベストプラクティス:**
- プレビューページが最終送信形式を反映
- データがどのように表示されるかの真の表現を提供
- デザインの一貫性を維持

---

### 3. 編集可能なセクションのハイライト

**事例:**
- **Google Forms**: ユーザーがプレビューページから直接入力を編集できる。各セクションの隣に「編集」ボタンを組み込む。
- **Typeform**: プレビューから離れることなく、迅速な修正を可能にする。

**ベストプラクティス:**
- ユーザーがプレビューページから直接入力を編集できる
- 各セクションの隣に「編集」ボタンを組み込む
- プレビューから離れることなく、迅速な修正を可能にする

---

### 4. フィードバックのためのマイクロインタラクション

**事例:**
- **Notion**: 変更をハイライトしたり、編集が保存されたときにチェックマークを表示したりするなど、微妙なアニメーションや視覚的手がかりを統合。
- **Figma**: マイクロインタラクションにより、ユーザーのエンゲージメントを向上し、即座のフィードバックを提供。

**ベストプラクティス:**
- 変更をハイライトしたり、編集が保存されたときにチェックマークを表示したりするなど、微妙なアニメーションや視覚的手がかりを統合
- ユーザーのエンゲージメントを向上
- 即座のフィードバックを提供

---

### 5. モバイルレスポンシブ

**事例:**
- **Google Forms**: プレビュー機能を完全にレスポンシブに設計し、さまざまな画面サイズと向きに対応。
- **Typeform**: モバイルデバイスでは、単一列レイアウトがより効果的。

**ベストプラクティス:**
- プレビュー機能を完全にレスポンシブに設計
- さまざまな画面サイズと向きに対応
- モバイルデバイスでは、単一列レイアウトを採用

---

### 6. AI駆動のパーソナライゼーション

**事例:**
- **Notion**: AIを活用して、ユーザーの行動と好みに基づいてプレビュー体験を調整。
- **Figma**: AIが修正を提案したり、潜在的なエラーをハイライトしたりする。

**ベストプラクティス:**
- AIを活用して、ユーザーの行動と好みに基づいてプレビュー体験を調整
- AIが修正を提案したり、潜在的なエラーをハイライトしたりする
- 送信の精度を向上

---

### 7. 明確な確認メッセージ

**事例:**
- **Google Forms**: 最終送信後、送信が成功したことを明確に示す確認メッセージを表示。
- **Typeform**: 送信日と入力情報の要約を含む詳細を提供。

**ベストプラクティス:**
- 最終送信後、送信が成功したことを明確に示す確認メッセージを表示
- 送信日と入力情報の要約を含む詳細を提供
- ユーザー参照用の情報を提供

---

## 実装方法の詳細

### 1. プレビュー画面の実装

**実装方法:**
```tsx
// 診断結果保存前にプレビューボタンを追加
<Button
  variant="outline"
  onClick={() => setIsPreviewOpen(true)}
  className="flex items-center gap-2"
>
  <Eye className="h-4 w-4" />
  プレビュー
</Button>

// 診断結果プレビューダイアログ
<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>診断結果のプレビュー</DialogTitle>
      <DialogDescription>
        保存前に内容を確認してください
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-6">
      {/* お客様情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">お客様情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-slate-500">お客様名:</span>
              <span className="ml-2 font-medium">{job.field4?.name}</span>
            </div>
            <div>
              <span className="text-sm text-slate-500">車両情報:</span>
              <span className="ml-2 font-medium">{job.field6?.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 診断結果 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">診断結果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {diagnosisItems.map((item, index) => (
              <div key={index} className="p-3 border rounded">
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-slate-600 mt-1">{item.value}</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditFromPreview(index)}
                  className="mt-2"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  編集
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 写真 */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">写真 ({photos.length}枚)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo.previewUrl}
                  alt={`写真 ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
        閉じる
      </Button>
      <Button onClick={handleSaveFromPreview}>
        保存
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 2. プレビュー画面からの編集

**実装方法:**
```tsx
// プレビュー画面から編集
function handleEditFromPreview(itemIndex: number) {
  // プレビューを閉じて、該当項目を編集
  setIsPreviewOpen(false);
  
  // 該当項目にスクロール
  const itemElement = document.getElementById(`diagnosis-item-${itemIndex}`);
  if (itemElement) {
    itemElement.scrollIntoView({ behavior: "smooth", block: "center" });
    itemElement.focus();
  }
}
```

---

### 3. 確認項目の表示

**実装方法:**
```tsx
// プレビュー画面に確認項目を表示
<div className="space-y-2">
  <div className="text-sm font-medium text-slate-700">確認項目:</div>
  <div className="space-y-1">
    {diagnosisItems.length > 0 && (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>診断項目が入力されています</span>
      </div>
    )}
    {photos.length > 0 && (
      <div className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>写真が添付されています ({photos.length}枚)</span>
      </div>
    )}
    {diagnosisItems.length === 0 && (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <AlertCircle className="h-4 w-4" />
        <span>診断項目が入力されていません</span>
      </div>
    )}
  </div>
</div>
```

---

## 期待される効果

### 業務効率の向上

1. **入力ミスの削減**
   - 診断結果を保存する前に、プレビュー画面で確認できるため、入力ミスが削減される
   - 診断結果の品質が向上
   - **時間短縮:** 入力ミスの修正時間が約40%短縮（推定）

2. **診断結果の品質向上**
   - プレビュー画面で確認することで、診断結果の品質が向上
   - お客様への説明時に、正確な情報を提供できる

---

### ユーザー体験の向上

1. **操作の簡素化**
   - プレビュー画面から直接編集できるため、操作が簡素化される
   - 確認項目を表示することで、入力漏れを防止

2. **信頼性の向上**
   - 保存前に内容を確認できるため、ユーザーの信頼性が向上
   - 入力ミスを削減することで、システムへの信頼が向上

---

## 実装の優先度と理由

### 優先度: 低（利便性の向上）

**理由:**

1. **利便性の向上**
   - 入力ミスの修正時間が約40%短縮（推定）
   - 診断結果の品質が向上

2. **実装の容易さ**
   - 既存の診断結果入力画面を拡張するだけで実装可能
   - 実装工数: 1-2日（見積）

3. **ユーザー要望**
   - 整備士から、この機能の追加を要望されている
   - ただし、最優先機能ではない

---

## 実装スケジュール

### Phase 1: プレビュー画面の実装（1日）
- プレビューダイアログのUI実装
- 診断結果の表示
- 写真の表示
- 確認項目の表示

### Phase 2: プレビュー画面からの編集機能（0.5日）
- プレビュー画面から編集ボタンの実装
- 該当項目へのスクロール機能

### Phase 3: 保存機能の統合（0.5日）
- プレビュー画面からの保存機能
- 保存確認メッセージ

**合計:** 2日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md`](../reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md) - 整備士のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #15 を作成



