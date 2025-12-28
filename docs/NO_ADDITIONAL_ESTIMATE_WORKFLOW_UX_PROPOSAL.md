# 追加見積もりがない場合のワークフロー UX提案

## 現状の課題

### 追加見積もりがない場合でも必要な入力項目

24ヶ月点検（車検）で追加見積もりがない場合でも、作業画面で以下の入力が必要：

1. **交換部品等**（診断画面で入力済みだが、作業画面で確認・更新が必要）
   - エンジンオイル、オイルフィルター、ワイパーゴムなど
   - 実際に交換した部品の記録

2. **測定値**（診断画面で入力済みだが、作業画面で確認・更新が必要）
   - CO/HC濃度
   - タイヤ溝深さ
   - ブレーキパッド厚さ

3. **品質管理・最終検査**（作業画面で実施）
   - ホイールナット締付トルク
   - ブレーキ効き（試運転）
   - 全灯火点灯
   - 警告灯消灯
   - 電圧・充電状態
   - ステアリング・挙動
   - 足回り異音

4. **作業メモ**（作業画面で入力）
   - 作業中の特記事項
   - 顧客へのアドバイス

5. **PDF生成**（作業画面で生成）
   - 分解整備記録簿の生成

### 問題点

- 追加見積もりがない場合、作業画面に遷移しても作業項目がないため、作業完了できない（1232-1238行目でエラー）
- しかし、上記の入力項目は作業画面で入力する必要がある
- 診断画面で入力したデータを作業画面に引き継ぐ必要がある

## 最新UIUXベストプラクティスに基づく提案

### アプローチ1: Progressive Disclosure（段階的開示）+ Bottom Sheet

**コンセプト**: 診断完了時に、必要な入力項目を段階的に開示し、Bottom Sheetで効率的に入力

#### 実装方針

1. **診断完了時の処理**:
   - 追加見積もりがないことを判定
   - 見積項目が0件であることを確認
   - **診断画面で入力したデータを自動的に作業データに引き継ぎ**
   - ステータスを「作業待ち」に更新（見積・承認をスキップ）
   - **Bottom Sheetを表示**して、必要な入力項目を確認・入力

2. **Bottom Sheetの内容**:
   - **セクション1: 交換部品等の確認**
     - 診断画面で入力した交換部品を表示
     - 実際に交換した部品をチェック
     - 追加・削除が可能
   
   - **セクション2: 測定値の確認**
     - 診断画面で入力した測定値を表示
     - 必要に応じて修正可能
   
   - **セクション3: 品質管理・最終検査**
     - チェックボックス形式で入力
     - 必須項目を明示
   
   - **セクション4: 作業メモ**
     - テキストエリアで入力
     - 任意項目

3. **完了ボタン**:
   - すべての必須項目を入力したら「完了」ボタンを有効化
   - 完了ボタンを押すと、作業データを保存して「出庫待ち」に更新

#### メリット

- **シームレスな移行**: 診断画面から作業画面への遷移が不要
- **データの引き継ぎ**: 診断画面で入力したデータを自動的に引き継ぎ
- **効率的な入力**: Bottom Sheetで必要な項目のみを表示
- **モバイル最適化**: Bottom Sheetはモバイルで使いやすい

#### デメリット

- 診断画面が複雑になる可能性
- Bottom Sheetの実装が必要

---

### アプローチ2: 作業画面への自動遷移 + データ引き継ぎ + 空状態の最適化

**コンセプト**: 作業画面に自動遷移し、診断データを引き継いで、空状態を最適化

#### 実装方針

1. **診断完了時の処理**:
   - 追加見積もりがないことを判定
   - 見積項目が0件であることを確認
   - **診断画面で入力したデータを自動的に作業データに引き継ぎ**
   - ステータスを「作業待ち」に更新（見積・承認をスキップ）
   - **作業画面に自動遷移**

2. **作業画面の空状態の最適化**:
   - 作業項目がない場合、通常のエラーではなく、**専用の空状態UIを表示**
   - **「点検完了確認」セクション**を表示:
     - 交換部品等の確認・入力
     - 測定値の確認・入力
     - 品質管理・最終検査の入力
     - 作業メモの入力
   
   - **「完了」ボタン**:
     - すべての必須項目を入力したら「完了」ボタンを有効化
     - 完了ボタンを押すと、作業データを保存して「出庫待ち」に更新

3. **データの引き継ぎ**:
   - 診断画面で入力したデータを自動的に作業画面に引き継ぎ
   - 交換部品、測定値、品質管理データなどを表示

#### メリット

- **既存の作業画面を活用**: 作業画面の既存機能を活用できる
- **データの引き継ぎ**: 診断画面で入力したデータを自動的に引き継ぎ
- **空状態の最適化**: 作業項目がない場合でも、必要な入力ができる

#### デメリット

- 作業画面の実装変更が必要
- 空状態のUIを新規実装する必要がある

---

### アプローチ3: ハイブリッド（推奨）

**コンセプト**: 診断完了時にBottom Sheetで簡易確認、必要に応じて作業画面に遷移

#### 実装方針

1. **診断完了時の処理**:
   - 追加見積もりがないことを判定
   - 見積項目が0件であることを確認
   - **診断画面で入力したデータを自動的に作業データに引き継ぎ**
   - ステータスを「作業待ち」に更新（見積・承認をスキップ）
   - **Bottom Sheetを表示**して、簡易確認

2. **Bottom Sheetの内容（簡易版）**:
   - **「点検完了確認」**:
     - 交換部品等: 診断画面で入力した内容を表示（編集可能）
     - 測定値: 診断画面で入力した内容を表示（編集可能）
     - 品質管理・最終検査: 簡易チェック（必須項目のみ）
   
   - **「詳細入力は作業画面で」**:
     - 「作業画面で詳細を入力する」ボタンを表示
     - ボタンを押すと作業画面に遷移
   
   - **「完了」ボタン**:
     - 簡易確認のみで完了する場合は「完了」ボタンを押す
     - 完了ボタンを押すと、作業データを保存して「出庫待ち」に更新

3. **作業画面の空状態の最適化**:
   - 作業項目がない場合、**「点検完了確認」セクション**を表示
   - 診断画面で入力したデータを表示・編集可能
   - 詳細な品質管理・最終検査の入力が可能

#### メリット

- **柔軟性**: 簡易確認で完了できる場合と、詳細入力が必要な場合の両方に対応
- **データの引き継ぎ**: 診断画面で入力したデータを自動的に引き継ぎ
- **ユーザーの選択**: ユーザーが簡易確認で完了するか、詳細入力をするかを選択できる

#### デメリット

- 実装が複雑になる可能性
- 2つのUI（Bottom Sheetと作業画面）を実装する必要がある

---

## 推奨: アプローチ2（作業画面への自動遷移 + データ引き継ぎ + 空状態の最適化）

### 理由

1. **既存の作業画面を活用**: 作業画面の既存機能（交換部品、測定値、品質管理など）を活用できる
2. **データの引き継ぎ**: 診断画面で入力したデータを自動的に引き継ぎ、再入力の手間を省く
3. **空状態の最適化**: 作業項目がない場合でも、必要な入力ができる専用UIを提供
4. **一貫性**: 作業画面で統一されたUI/UXを提供できる

### 実装詳細

#### 1. 診断完了時の処理

```typescript
// 追加見積もりの有無を判定
const hasAdditionalEstimate = 
  (additionalEstimateRequired?.length || 0) > 0 ||
  (additionalEstimateRecommended?.length || 0) > 0 ||
  (additionalEstimateOptional?.length || 0) > 0;

// 24ヶ月点検の場合のみ、追加見積もりがない場合の処理を実行
if (is24MonthInspection && !hasAdditionalEstimate) {
  // 診断画面で入力したデータを自動的に作業データに引き継ぎ
  const workData = {
    // 交換部品等
    replacementParts: customPartsData.length > 0 ? customPartsData : undefined,
    // 測定値
    measurements: inspectionMeasurements || undefined,
    // 品質管理・最終検査
    qualityCheck: qualityCheckData || undefined,
    // 作業メモ
    memo: maintenanceAdvice || undefined,
  };
  
  // 作業データを保存
  await updateWorkOrder(jobId, workOrderId, {
    work: workData,
    status: "作業待ち", // 見積・承認をスキップして直接作業待ちに
  });
  
  // 作業画面に自動遷移
  const workUrl = selectedWorkOrder?.id
    ? `/mechanic/work/${jobId}?workOrderId=${selectedWorkOrder.id}`
    : `/mechanic/work/${jobId}`;
  
  toast.success("点検完了", {
    description: "作業画面で最終確認を行ってください",
    action: {
      label: "作業画面へ",
      onClick: () => {
        router.push(workUrl);
      },
    },
    duration: 5000,
  });
  
  // 3秒後に自動で作業画面へ遷移
  setTimeout(() => {
    router.push(workUrl);
  }, 3000);
} else {
  // 通常フロー: 見積作成待ち → 見積画面
  // 現在の実装を維持
}
```

#### 2. 作業画面の空状態の最適化

```typescript
// 作業項目がない場合の専用UI
if (isInspection && approvedWorkItems.length === 0) {
  return (
    <div className="space-y-6">
      {/* 点検完了確認セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            点検完了確認
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 交換部品等の確認 */}
          <div>
            <Label className="text-base font-medium">交換部品等</Label>
            <ReplacementPartsInput
              parts={replacementParts}
              onChange={setReplacementParts}
              // 診断画面で入力したデータを初期値として設定
              initialData={workData?.replacementParts}
            />
          </div>
          
          {/* 測定値の確認 */}
          <div>
            <Label className="text-base font-medium">測定値</Label>
            <MeasurementsInput
              measurements={measurements}
              onChange={setMeasurements}
              // 診断画面で入力したデータを初期値として設定
              initialData={workData?.measurements}
            />
          </div>
          
          {/* 品質管理・最終検査 */}
          <div>
            <Label className="text-base font-medium">品質管理・最終検査</Label>
            <QualityCheckInput
              data={qualityCheckData}
              onChange={setQualityCheckData}
              // 診断画面で入力したデータを初期値として設定
              initialData={workData?.qualityCheck}
            />
          </div>
          
          {/* 作業メモ */}
          <div>
            <Label className="text-base font-medium">作業メモ</Label>
            <Textarea
              value={workMemo}
              onChange={(e) => setWorkMemo(e.target.value)}
              placeholder="作業中の特記事項を入力してください"
              // 診断画面で入力したデータを初期値として設定
              defaultValue={workData?.memo}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 完了ボタン */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        <Button
          onClick={handleComplete}
          disabled={!isAllRequiredFieldsFilled}
          className="w-full h-12 text-base"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          点検完了
        </Button>
      </div>
    </div>
  );
}
```

#### 3. 完了処理

```typescript
const handleComplete = async () => {
  // 作業データを保存
  const workData = {
    replacementParts,
    measurements,
    qualityCheck: qualityCheckData,
    memo: workMemo,
    completedAt: new Date().toISOString(),
  };
  
  await updateWorkOrder(jobId, workOrderId, {
    work: workData,
    status: "出庫待ち", // 作業完了して出庫待ちに
  });
  
  // PDF生成（分解整備記録簿）
  await generateInspectionPDF({
    jobId,
    workOrderId,
    inspectionData: diagnosisData,
    workData,
  });
  
  toast.success("点検完了", {
    description: "分解整備記録簿を生成しました",
  });
};
```

---

## UI/UXのベストプラクティス

### 1. Progressive Disclosure（段階的開示）

- **必須項目を最初に表示**: 品質管理・最終検査の必須項目を最初に表示
- **任意項目を折りたたみ**: 作業メモなど任意項目は折りたたみ可能にする

### 2. データの可視化

- **診断画面で入力したデータを明示**: 「診断時に入力済み」などのバッジを表示
- **変更履歴の表示**: 診断画面で入力した値と作業画面で入力した値を比較表示

### 3. バリデーション

- **リアルタイムバリデーション**: 入力内容に対してリアルタイムでエラーチェック
- **必須項目の明示**: 必須項目を視覚的に明示（赤いアスタリスクなど）

### 4. モバイル最適化

- **タッチターゲットの最適化**: ボタンや入力フィールドを48px以上に設定
- **スクロール可能なレイアウト**: 長いフォームでもスクロールで全ての項目にアクセス可能

### 5. フィードバック

- **保存状態の表示**: 自動保存の状態を表示
- **完了時の確認**: 完了ボタンを押す前に確認ダイアログを表示

---

## 実装優先度

- **優先度**: 高
- **実装難易度**: 中
- **影響範囲**: 診断画面、作業画面

---

## 次のステップ

1. **ユーザー確認**: アプローチ2（推奨）を採用するか確認
2. **実装**: 
   - 診断完了時のデータ引き継ぎ処理を実装
   - 作業画面の空状態UIを実装
   - 完了処理を実装
3. **テスト**: 追加見積もりがない場合のワークフローをテスト
4. **ドキュメント更新**: ワークフロー仕様書を更新




