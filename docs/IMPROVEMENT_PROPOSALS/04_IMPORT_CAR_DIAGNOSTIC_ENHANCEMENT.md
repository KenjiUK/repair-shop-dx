# 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化

**提案日:** 2025-12-21  
**優先度:** 高（輸入車整備工場特有の重要な機能）  
**実装工数見積:** 4-5日  
**影響範囲:** 整備士、管理者

---

## 提案の概要

輸入車整備工場では、OBD診断、メーカーへの問い合わせ、レストア作業、品質管理など、特有の業務があります。現在のシステムでは、これらの情報をコメント欄などに記録する必要があり、管理が困難です。

本提案では、以下の機能を追加します：
1. **OBD診断結果やエラーコードを専用の項目として記録できる機能**
2. **メーカーへの問い合わせを専用の項目として記録できる機能**
3. **部品の発注待ち状況を専用のステータスとして管理できる機能**（改善提案 #3 と連携）
4. **レストア作業の進捗率を専用の項目として記録できる機能**
5. **品質管理・最終検査の検査項目をチェックリスト形式で記録できる機能**

---

## なぜ必要か：ユーザーコメントから

### 🔧 整備士（佐藤 健一様）のコメント

**追加シナリオ15: 輸入車特有のOBD診断・エラーコード確認**

**質問1: OBD診断結果やエラーコードを記録できましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「診断結果の入力画面で、エラーコードやOBD診断結果を記録できます。特に、写真や動画も一緒に記録できるので、後で確認する際にも役立ちます。ただ、エラーコードを専用の項目として記録できる機能があると、もっと便利だと思います。」

**追加で必要な機能:**
> - OBD診断結果やエラーコードを専用の項目として記録できる機能

**業務上の課題:**
- 輸入車の場合、OBD診断が頻繁に行われる
- エラーコードを専用の項目として記録したいが、現在はコメント欄に記録する必要がある
- エラーコードから原因を特定する際、専用の項目があると便利

---

**追加シナリオ16: メーカーへの問い合わせが必要な場合**

**質問1: メーカーへの問い合わせ内容を記録できましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「診断結果の入力画面で、コメント欄にメーカーへの問い合わせ内容を記録できます。ただ、メーカーへの問い合わせを専用の項目として記録できる機能があると、もっと便利だと思います。特に、問い合わせ結果も記録できると、後で確認しやすいです。」

**追加で必要な機能:**
> - メーカーへの問い合わせを専用の項目として記録できる機能
> - メーカーからの回答を記録できる機能

**業務上の課題:**
- 輸入車の場合、メーカーへの問い合わせが頻繁に行われる
- 問い合わせ内容と回答を専用の項目として記録したい
- 問い合わせ履歴を管理したい

---

**追加シナリオ20: レストア作業（長期プロジェクト）**

**質問1: レストア作業の進捗を記録できましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「作業画面で、レストア作業の進捗を記録できます。特に、写真や動画も一緒に記録できるので、進捗の確認もしやすいです。ただ、レストア作業の進捗率を専用の項目として記録できる機能があると、もっと便利だと思います。」

**追加で必要な機能:**
> - レストア作業の進捗率を専用の項目として記録できる機能

**業務上の課題:**
- レストア作業は長期プロジェクトになることが多い
- 進捗率を専用の項目として記録したい
> - 各工程の進捗を記録したい

---

**追加シナリオ21: 品質管理・最終検査**

**質問1: 品質管理・最終検査の記録がスムーズに行えましたか？**
- [x] 非常にできた（5点）

**コメント:**
> 「作業画面で、品質管理・最終検査の記録ができます。特に、検査項目をチェックリスト形式で記録できる機能があると、もっと便利だと思います。」

**追加で必要な機能:**
> - 品質管理・最終検査の検査項目をチェックリスト形式で記録できる機能

**業務上の課題:**
- 品質管理・最終検査の検査項目をチェックリスト形式で記録したい
- 検査結果を専用の項目として記録したい

---

## 現在の実装状況

### 実装済みの機能

1. **診断結果の入力画面**
   - 診断結果を記録できる機能が実装済み
   - 写真・動画の撮影機能が実装済み
   - コメント欄で情報を記録可能

2. **作業記録機能**
   - 作業内容を記録できる機能が実装済み
   - 写真・動画の撮影機能が実装済み

### 未実装の機能

1. **OBD診断結果・エラーコードの専用項目**
   - OBD診断結果を記録する専用項目がない
   - エラーコードを記録する専用項目がない
   - エラーコードの説明や対処法を記録する項目がない

2. **メーカー問い合わせの専用項目**
   - メーカーへの問い合わせ内容を記録する専用項目がない
   - メーカーからの回答を記録する専用項目がない
   - 問い合わせ履歴を管理する機能がない

3. **レストア作業の進捗率記録**
   - レストア作業の進捗率を記録する専用項目がない
   - 各工程の進捗を記録する項目がない

4. **品質管理・最終検査のチェックリスト**
   - 品質管理・最終検査の検査項目をチェックリスト形式で記録する機能がない
   - 検査結果を専用の項目として記録する機能がない

---

## 最新のUI/UX事例とベストプラクティス（2024-2025）

### 1. ユーザー中心設計とロールベースアクセス

**事例:**
- **Autel MaxiSys**: プロの整備士向けに詳細な技術データを提供し、一般ユーザー向けには簡略化された情報を提供。
- **Carista**: ロールベースアクセスを実装し、ユーザーの役割に応じて情報を表示。

**ベストプラクティス:**
- プロの整備士向けに詳細な技術データを提供
- 一般ユーザー向けには簡略化された情報を提供
- ロールベースアクセスを実装

---

### 2. プログレッシブディスクロージャー（段階的開示）

**事例:**
- **Torque Pro**: 重要な情報を最初に表示し、詳細情報は必要に応じて展開できるようにしている。
- **OBD Fusion**: 情報を階層的に表示し、ユーザーが段階的に詳細を確認できる。

**ベストプラクティス:**
- 重要な情報を最初に表示
- 詳細情報は必要に応じて展開できるようにする
- 情報を階層的に表示

---

### 3. インタラクティブなビジュアル

**事例:**
- **DashCommand**: 動的なチャートやグラフを使用して、診断データを視覚的に表示。
- **OBDLink**: 視覚的なインジケーターを使用して、診断結果を表示。

**ベストプラクティス:**
- 動的なチャートやグラフを使用
- 視覚的なインジケーターを使用
- 複雑な情報を視覚的に分かりやすく表示

---

### 4. リアルタイムフィードバック

**事例:**
- **Car Scanner**: データ入力時に即座にフィードバックを提供。
- **OBD Car Doctor**: エラー発生時に即座にアラートを表示。

**ベストプラクティス:**
- データ入力時に即座にフィードバックを提供
- エラー発生時に即座にアラートを表示
- リアルタイムで情報を更新

---

### 5. チェックリスト形式の記録

**事例:**
- **Inspection Manager**: 検査項目をチェックリスト形式で記録。
- **Vehicle Inspection Pro**: 品質管理の検査項目をチェックリスト形式で記録。

**ベストプラクティス:**
- 検査項目をチェックリスト形式で記録
- 各項目に写真やコメントを添付可能にする
- 検査結果を視覚的に表示

---

## 実装方法の詳細

### 1. OBD診断結果・エラーコードの専用項目

**データ構造:**
```typescript
interface OBDDiagnosticResult {
  errorCodes: ErrorCode[];           // エラーコードリスト
  diagnosticDate: string;            // 診断日時
  diagnosticTool: string | null;     // 診断ツール名
  notes: string | null;              // 備考
}

interface ErrorCode {
  code: string;                      // エラーコード（例: "P0301"）
  description: string | null;        // エラーコードの説明
  severity: "low" | "medium" | "high"; // 重要度
  status: "active" | "resolved" | "pending"; // ステータス
  resolution: string | null;         // 対処法
  photos: string[];                  // 関連写真
}
```

**UI実装:**
```tsx
// OBD診断結果入力セクション
<div className="space-y-4">
  <div>
    <Label>エラーコード</Label>
    <div className="space-y-2">
      {obdDiagnosticResult.errorCodes.map((errorCode, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded">
          <Input
            value={errorCode.code}
            onChange={(e) => updateErrorCode(index, { code: e.target.value })}
            placeholder="P0301"
            className="w-24"
          />
          <Input
            value={errorCode.description || ""}
            onChange={(e) => updateErrorCode(index, { description: e.target.value })}
            placeholder="エラーコードの説明"
            className="flex-1"
          />
          <Select
            value={errorCode.severity}
            onValueChange={(value) => updateErrorCode(index, { severity: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">低</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="high">高</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeErrorCode(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() => addErrorCode()}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        エラーコードを追加
      </Button>
    </div>
  </div>
  
  <div>
    <Label>診断ツール</Label>
    <Input
      value={obdDiagnosticResult.diagnosticTool || ""}
      onChange={(e) => setOBDDiagnosticResult((prev) => ({ ...prev, diagnosticTool: e.target.value }))}
      placeholder="診断ツール名"
    />
  </div>
</div>
```

---

### 2. メーカー問い合わせの専用項目

**データ構造:**
```typescript
interface ManufacturerInquiry {
  inquiries: InquiryItem[];          // 問い合わせリスト
}

interface InquiryItem {
  id: string;
  inquiryDate: string;                // 問い合わせ日時
  inquiryContent: string;             // 問い合わせ内容
  inquiryMethod: "email" | "phone" | "fax" | "other"; // 問い合わせ方法
  manufacturer: string;               // メーカー名
  contactPerson: string | null;       // 担当者名
  responseDate: string | null;        // 回答日時
  responseContent: string | null;      // 回答内容
  status: "pending" | "responded" | "resolved"; // ステータス
  attachments: string[];              // 添付ファイル
}
```

**UI実装:**
```tsx
// メーカー問い合わせ入力セクション
<div className="space-y-4">
  {manufacturerInquiry.inquiries.map((inquiry) => (
    <Card key={inquiry.id}>
      <CardHeader>
        <CardTitle className="text-sm">
          {formatDate(inquiry.inquiryDate)} - {inquiry.manufacturer}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <Label>問い合わせ内容</Label>
          <Textarea
            value={inquiry.inquiryContent}
            onChange={(e) => updateInquiry(inquiry.id, { inquiryContent: e.target.value })}
            placeholder="問い合わせ内容を入力"
          />
        </div>
        <div>
          <Label>回答内容</Label>
          <Textarea
            value={inquiry.responseContent || ""}
            onChange={(e) => updateInquiry(inquiry.id, { responseContent: e.target.value })}
            placeholder="回答内容を入力"
            disabled={inquiry.status === "pending"}
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={inquiry.status === "responded" ? "default" : "secondary"}>
            {inquiry.status === "pending" ? "回答待ち" : inquiry.status === "responded" ? "回答済み" : "解決済み"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  ))}
  <Button
    variant="outline"
    onClick={() => addInquiry()}
    className="w-full"
  >
    <Plus className="h-4 w-4 mr-2" />
    問い合わせを追加
  </Button>
</div>
```

---

### 3. レストア作業の進捗率記録

**データ構造:**
```typescript
interface RestoreProgress {
  overallProgress: number;            // 全体の進捗率（0-100）
  phases: RestorePhase[];            // 各工程の進捗
}

interface RestorePhase {
  id: string;
  name: string;                       // 工程名（例: "エンジン分解"）
  progress: number;                   // 進捗率（0-100）
  startDate: string | null;          // 開始日
  expectedEndDate: string | null;    // 予定終了日
  actualEndDate: string | null;       // 実際の終了日
  status: "not_started" | "in_progress" | "completed"; // ステータス
  notes: string | null;               // 備考
  photos: string[];                   // 関連写真
}
```

**UI実装:**
```tsx
// レストア作業進捗入力セクション
<div className="space-y-4">
  <div>
    <Label>全体の進捗率</Label>
    <div className="flex items-center gap-4">
      <Slider
        value={[restoreProgress.overallProgress]}
        onValueChange={(value) => setRestoreProgress((prev) => ({ ...prev, overallProgress: value[0] }))}
        max={100}
        step={1}
        className="flex-1"
      />
      <span className="text-2xl font-bold w-16 text-right">
        {restoreProgress.overallProgress}%
      </span>
    </div>
  </div>
  
  <div>
    <Label>各工程の進捗</Label>
    <div className="space-y-2">
      {restoreProgress.phases.map((phase) => (
        <Card key={phase.id}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{phase.name}</span>
              <Badge variant={phase.status === "completed" ? "default" : "secondary"}>
                {phase.status === "not_started" ? "未開始" : phase.status === "in_progress" ? "進行中" : "完了"}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Slider
                value={[phase.progress]}
                onValueChange={(value) => updatePhase(phase.id, { progress: value[0] })}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-lg font-bold w-12 text-right">
                {phase.progress}%
              </span>
            </div>
            {phase.expectedEndDate && (
              <div className="text-xs text-slate-500 mt-2">
                予定終了日: {formatDate(phase.expectedEndDate)}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</div>
```

---

### 4. 品質管理・最終検査のチェックリスト

**データ構造:**
```typescript
interface QualityInspection {
  inspectionDate: string;            // 検査日時
  inspector: string;                  // 検査者名
  items: InspectionItem[];           // 検査項目リスト
  overallResult: "pass" | "fail" | "pending"; // 全体結果
  notes: string | null;               // 備考
}

interface InspectionItem {
  id: string;
  category: string;                   // カテゴリー（例: "エンジン"）
  name: string;                       // 検査項目名
  result: "pass" | "fail" | "na";    // 検査結果
  notes: string | null;               // 備考
  photos: string[];                   // 関連写真
}
```

**UI実装:**
```tsx
// 品質管理・最終検査チェックリスト
<div className="space-y-4">
  <div>
    <Label>検査者</Label>
    <Input
      value={qualityInspection.inspector}
      onChange={(e) => setQualityInspection((prev) => ({ ...prev, inspector: e.target.value }))}
      placeholder="検査者名"
    />
  </div>
  
  <div>
    <Label>検査項目</Label>
    <div className="space-y-2">
      {qualityInspection.items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
          <div className="flex-1">
            <div className="text-sm font-medium">{item.category} - {item.name}</div>
          </div>
          <Select
            value={item.result}
            onValueChange={(value) => updateInspectionItem(item.id, { result: value })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pass">合格</SelectItem>
              <SelectItem value="fail">不合格</SelectItem>
              <SelectItem value="na">該当なし</SelectItem>
            </SelectContent>
          </Select>
          {item.result === "fail" && (
            <Input
              value={item.notes || ""}
              onChange={(e) => updateInspectionItem(item.id, { notes: e.target.value })}
              placeholder="不備内容"
              className="flex-1"
            />
          )}
        </div>
      ))}
    </div>
  </div>
  
  <div>
    <Label>全体結果</Label>
    <Select
      value={qualityInspection.overallResult}
      onValueChange={(value) => setQualityInspection((prev) => ({ ...prev, overallResult: value }))}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pass">合格</SelectItem>
        <SelectItem value="fail">不合格</SelectItem>
        <SelectItem value="pending">保留</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

---

## 期待される効果

### 業務効率の向上

1. **診断記録の効率化**
   - OBD診断結果やエラーコードを専用の項目として記録できるため、管理が容易になる
   - エラーコードから原因を特定する際、専用の項目があると便利
   - **時間短縮:** 診断記録の時間が約30%短縮（推定）

2. **メーカー問い合わせの管理**
   - メーカーへの問い合わせ内容と回答を専用の項目として記録できる
   - 問い合わせ履歴を管理できる
   - **時間短縮:** 問い合わせ履歴の確認時間が約50%短縮（推定）

3. **レストア作業の進捗管理**
   - レストア作業の進捗率を専用の項目として記録できる
   - 各工程の進捗を管理できる
   - **時間短縮:** 進捗確認の時間が約40%短縮（推定）

4. **品質管理の効率化**
   - 品質管理・最終検査の検査項目をチェックリスト形式で記録できる
   - 検査結果を専用の項目として記録できる
   - **時間短縮:** 品質管理記録の時間が約35%短縮（推定）

---

### 輸入車整備工場特有の業務の効率化

1. **診断記録の標準化**
   - OBD診断結果やエラーコードを標準化された形式で記録できる
   - 過去の診断結果を参照しやすくなる

2. **メーカー問い合わせの追跡**
   - メーカーへの問い合わせ履歴を追跡できる
   - 問い合わせの回答状況を管理できる

3. **長期プロジェクトの管理**
   - レストア作業などの長期プロジェクトの進捗を管理できる
   - 各工程の進捗を可視化できる

---

## 実装の優先度と理由

### 優先度: 高（輸入車整備工場特有の重要な機能）

**理由:**

1. **輸入車整備工場特有の重要な機能**
   - 輸入車の場合、OBD診断、メーカー問い合わせ、レストア作業などが頻繁に行われる
   - 整備士から、これらの機能の追加を強く要望されている

2. **業務効率への直接的な影響**
   - 診断記録の時間が約30%短縮（推定）
   - 問い合わせ履歴の確認時間が約50%短縮（推定）
   - 進捗確認の時間が約40%短縮（推定）
   - 品質管理記録の時間が約35%短縮（推定）

3. **実装の複雑さ**
   - 複数の機能を含むため、実装がやや複雑
   - データ構造の拡張が必要
   - 実装工数: 4-5日（見積）

---

## 実装スケジュール

### Phase 1: データ構造の拡張（1日）
- `OBDDiagnosticResult`、`ErrorCode`型の定義
- `ManufacturerInquiry`、`InquiryItem`型の定義
- `RestoreProgress`、`RestorePhase`型の定義
- `QualityInspection`、`InspectionItem`型の定義
- ジョブデータにこれらの情報を追加

### Phase 2: OBD診断結果・エラーコード機能の実装（1日）
- OBD診断結果入力UIの実装
- エラーコード入力UIの実装
- エラーコードの説明・対処法の表示

### Phase 3: メーカー問い合わせ機能の実装（1日）
- メーカー問い合わせ入力UIの実装
- 問い合わせ履歴の表示
- 問い合わせステータスの管理

### Phase 4: レストア作業進捗機能の実装（0.5日）
- レストア作業進捗入力UIの実装
- 進捗率のスライダー表示
- 各工程の進捗管理

### Phase 5: 品質管理・最終検査機能の実装（0.5日）
- 品質管理チェックリストUIの実装
- 検査項目の入力
- 検査結果の表示

**合計:** 4-5日

---

## 関連ドキュメント

- [`UX_TESTING_INTEGRATED_REPORT.md`](../UX_TESTING_INTEGRATED_REPORT.md) - 統合レポート
- [`reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md`](../reviews/UX_TESTING_REVIEW_Mechanic_佐藤健一_20251221.md) - 整備士のレビュー

---

## 更新履歴

- 2025-12-21: 改善提案 #4 を作成



