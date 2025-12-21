# 入庫区分別統合仕様書

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **対象**: 各入庫区分の統合仕様と実装ガイド
- **設計方針**: 共通コンポーネントをベースに、入庫区分別の拡張ポイントを明確化

---

## 1. 統合アプローチ

### 1-1. 基本方針

すべての入庫区分は、共通コンポーネントをベースに実装し、必要に応じて拡張コンポーネントを使用します。

**共通コンポーネント**:
- `PageLayout`: ページレイアウト
- `VehicleInfoCard`: 車両情報表示
- `ReceptionForm`: 受付フォーム
- `DiagnosisForm`: 診断フォーム
- `EstimateForm`: 見積フォーム
- `WorkForm`: 作業フォーム
- `HandoverForm`: 引渡フォーム

**拡張コンポーネント**:
- 各入庫区分専用のコンポーネント
- 共通コンポーネントの`children`プロップで拡張

### 1-2. 実装パターン

**パターン1: 共通コンポーネントのみ使用**:
```typescript
<ReceptionForm
  vehicle={vehicle}
  mileage={mileage}
  onMileageChange={setMileage}
  onSubmit={handleSubmit}
/>
```

**パターン2: 共通コンポーネント + 拡張コンポーネント**:
```typescript
<ReceptionForm
  vehicle={vehicle}
  mileage={mileage}
  onMileageChange={setMileage}
  onSubmit={handleSubmit}
>
  <AccidentInfoSection
    accident={accident}
    onChange={setAccident}
  />
</ReceptionForm>
```

---

## 2. 各入庫区分の統合仕様

### 2-1. 車検

**フローパターン**: パターンA

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `WorkForm`: 作業画面
- `HandoverForm`: 引渡画面

**拡張コンポーネント**:
- `InspectionCategoryTabs`: 検査カテゴリのタブ切り替え
- `InspectionItemCard`: 検査項目カード
- `MeasurementInputScreen`: 測定値入力専用画面
- `LegalFeesDisplay`: 法定費用表示

**実装例**:
```typescript
// 診断画面
<DiagnosisForm
  vehicle={vehicle}
  receptionInfo={receptionInfo}
  diagnosisData={diagnosisData}
  onDiagnosisDataChange={setDiagnosisData}
  onSave={handleSave}
>
  <InspectionCategoryTabs
    categories={categories}
    selectedCategory={selectedCategory}
    onCategoryChange={setSelectedCategory}
    progress={progress}
  />
  <MeasurementInputScreen
    measurements={measurements}
    onMeasurementsChange={setMeasurements}
    onSave={handleSaveMeasurements}
  />
</DiagnosisForm>
```

### 2-2. 12ヵ月点検

**フローパターン**: パターンA

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `WorkForm`: 作業画面
- `HandoverForm`: 引渡画面

**拡張コンポーネント**:
- `InspectionCategoryTabs`: 検査カテゴリのタブ切り替え（5カテゴリ）
- `InspectionItemCard`: 検査項目カード
- `LegalFeesDisplay`: 法定費用表示（車両重量に応じて）

**実装例**:
```typescript
// 見積画面
<EstimateForm
  vehicle={vehicle}
  diagnosisData={diagnosisData}
  estimateData={estimateData}
  onEstimateDataChange={setEstimateData}
  onSubmit={handleSubmit}
>
  <LegalFeesDisplay
    vehicleWeight={vehicle.weight}
    legalFees={legalFees}
  />
</EstimateForm>
```

### 2-3. エンジンオイル交換

**フローパターン**: パターンB

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面（簡易版）
- `DiagnosisForm`: 診断画面（簡易版）
- `WorkForm`: 作業画面

**拡張コンポーネント**:
- `SimpleInspectionItems`: 簡易検査項目（3項目）

**実装例**:
```typescript
// 診断画面
<DiagnosisForm
  vehicle={vehicle}
  receptionInfo={receptionInfo}
  diagnosisData={diagnosisData}
  onDiagnosisDataChange={setDiagnosisData}
  onSave={handleSave}
>
  <SimpleInspectionItems
    items={inspectionItems}
    onItemsChange={setInspectionItems}
  />
</DiagnosisForm>
```

### 2-4. タイヤ交換・ローテーション

**フローパターン**: パターンB

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `WorkForm`: 作業画面

**拡張コンポーネント**:
- `TireTypeSelector`: タイヤ種類選択（交換/ローテーション）
- `MeasurementInputScreen`: 測定値入力（タイヤ溝深さ、タイヤ圧力）

**実装例**:
```typescript
// 受付画面
<ReceptionForm
  vehicle={vehicle}
  mileage={mileage}
  onMileageChange={setMileage}
  onSubmit={handleSubmit}
>
  <TireTypeSelector
    type={tireType}
    onTypeChange={setTireType}
  />
</ReceptionForm>
```

### 2-5. その他のメンテナンス

**フローパターン**: パターンB

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `WorkForm`: 作業画面

**拡張コンポーネント**:
- `MaintenanceTypeSelector`: メンテナンス種類選択
- `DynamicInspectionItems`: 動的検査項目（種類に応じて変化）

**実装例**:
```typescript
// 診断画面
<DiagnosisForm
  vehicle={vehicle}
  receptionInfo={receptionInfo}
  diagnosisData={diagnosisData}
  onDiagnosisDataChange={setDiagnosisData}
  onSave={handleSave}
>
  <MaintenanceTypeSelector
    type={maintenanceType}
    onTypeChange={setMaintenanceType}
  />
  <DynamicInspectionItems
    type={maintenanceType}
    items={inspectionItems}
    onItemsChange={setInspectionItems}
  />
</DiagnosisForm>
```

### 2-6. 故障診断

**フローパターン**: パターンA

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `WorkForm`: 作業画面（故障診断から修理・整備への移行時）

**拡張コンポーネント**:
- `SymptomCategorySelector`: 症状カテゴリ選択
- `DiagnosticToolSection`: 診断機の利用セクション
- `VideoCaptureButton`: 動画撮影ボタン
- `AudioCaptureButton`: 音声録音ボタン

**実装例**:
```typescript
// 診断画面
<DiagnosisForm
  vehicle={vehicle}
  receptionInfo={receptionInfo}
  diagnosisData={diagnosisData}
  onDiagnosisDataChange={setDiagnosisData}
  onSave={handleSave}
>
  <SymptomCategorySelector
    category={symptomCategory}
    onCategoryChange={setSymptomCategory}
  />
  <DiagnosticToolSection
    useDiagnosticTool={useDiagnosticTool}
    onUseDiagnosticToolChange={setUseDiagnosticTool}
    diagnosticToolCost={diagnosticToolCost}
    onPdfUpload={handlePdfUpload}
  />
  <VideoCaptureButton
    videos={videos}
    onCapture={handleVideoCapture}
  />
</DiagnosisForm>
```

### 2-7. 修理・整備

**フローパターン**: パターンA

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `WorkForm`: 作業画面

**拡張コンポーネント**:
- `FaultDiagnosisTransitionSection`: 故障診断からの移行セクション
- `DiagnosticToolSection`: 診断機の利用セクション
- `PartsProcurementStatus`: 部品取り寄せ状況

**実装例**:
```typescript
// 受付画面（故障診断から移行の場合）
<ReceptionForm
  vehicle={vehicle}
  mileage={mileage}
  onMileageChange={setMileage}
  onSubmit={handleSubmit}
>
  <FaultDiagnosisTransitionSection
    diagnosisJobId={diagnosisJobId}
    diagnosisResult={diagnosisResult}
  />
</ReceptionForm>
```

### 2-8. チューニング・パーツ取付

**フローパターン**: パターンA

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `WorkForm`: 作業画面

**拡張コンポーネント**:
- `TypeSelector`: 種類選択（チューニング/パーツ取付）
- `CustomInspectionItems`: カスタム確認項目

**実装例**:
```typescript
// 受付画面
<ReceptionForm
  vehicle={vehicle}
  mileage={mileage}
  onMileageChange={setMileage}
  onSubmit={handleSubmit}
>
  <TypeSelector
    type={type}
    onTypeChange={setType}
    options={[
      { value: "チューニング", label: "チューニング" },
      { value: "パーツ取付", label: "パーツ取付" }
    ]}
  />
</ReceptionForm>
```

### 2-9. コーティング

**フローパターン**: パターンB

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面（事前見積済み）
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面（事前見積）
- `WorkForm`: 作業画面
- `HandoverForm`: 引渡画面

**拡張コンポーネント**:
- `CoatingTypeSelector`: コーティング種類選択
- `OptionalServicesSelector`: オプションサービス選択
- `BodyConditionCheck`: 車体の状態確認
- `DryingProcessSection`: 乾燥プロセス管理

**実装例**:
```typescript
// 見積画面（事前見積）
<EstimateForm
  vehicle={vehicle}
  diagnosisData={diagnosisData}
  estimateData={estimateData}
  onEstimateDataChange={setEstimateData}
  onSubmit={handleSubmit}
>
  <CoatingTypeSelector
    types={coatingTypes}
    selectedType={selectedType}
    onTypeChange={setSelectedType}
    vehicleDimensions={vehicleDimensions}
    pricing={pricing}
  />
  <OptionalServicesSelector
    services={optionalServices}
    selectedServices={selectedServices}
    onServicesChange={setSelectedServices}
    simultaneousDiscount={0.1}
  />
</EstimateForm>
```

### 2-10. 板金・塗装

**フローパターン**: パターンA（外注管理）

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `HandoverForm`: 引渡画面

**拡張コンポーネント**:
- `AccidentInfoSection`: 事故案件情報
- `DamageLocationSection`: 損傷箇所確認
- `VendorEstimateSection`: 外注先からの見積もり回答
- `OutsourcingProgressSection`: 外注作業進捗管理
- `QualityCheckSection`: 品質確認

**実装例**:
```typescript
// 受付画面
<ReceptionForm
  vehicle={vehicle}
  mileage={mileage}
  onMileageChange={setMileage}
  onSubmit={handleSubmit}
>
  <AccidentInfoSection
    accident={accident}
    onChange={setAccident}
  />
</ReceptionForm>

// 診断画面
<DiagnosisForm
  vehicle={vehicle}
  receptionInfo={receptionInfo}
  diagnosisData={diagnosisData}
  onDiagnosisDataChange={setDiagnosisData}
  onSave={handleSave}
>
  <DamageLocationSection
    locations={damageLocations}
    onLocationsChange={setDamageLocations}
  />
  <VendorEstimateSection
    vendorEstimate={vendorEstimate}
    onVendorEstimateChange={setVendorEstimate}
  />
</DiagnosisForm>
```

### 2-11. レストア

**フローパターン**: パターンA（長期プロジェクト管理）

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `WorkForm`: 作業画面
- `HandoverForm`: 引渡画面

**拡張コンポーネント**:
- `RestoreTypeSelector`: レストアの種類選択
- `ConditionCheckSection`: 現状確認
- `RestoreLocationSection`: 修復箇所確認
- `PhaseManagement`: フェーズ管理
- `PartsProcurementStatus`: 部品取り寄せ状況
- `AdditionalWorkSection`: 追加作業管理
- `EstimateChangeHistory`: 見積もり変更履歴

**実装例**:
```typescript
// 診断画面
<DiagnosisForm
  vehicle={vehicle}
  receptionInfo={receptionInfo}
  diagnosisData={diagnosisData}
  onDiagnosisDataChange={setDiagnosisData}
  onSave={handleSave}
>
  <RestoreTypeSelector
    type={restoreType}
    onTypeChange={setRestoreType}
  />
  <ConditionCheckSection
    conditions={conditions}
    onConditionsChange={setConditions}
  />
  <RestoreLocationSection
    locations={restoreLocations}
    onLocationsChange={setRestoreLocations}
  />
</DiagnosisForm>

// 作業画面
<WorkForm
  vehicle={vehicle}
  estimateData={estimateData}
  workData={workData}
  onWorkDataChange={setWorkData}
  onSubmit={handleSubmit}
>
  <PhaseManagement
    phases={phases}
    selectedPhase={selectedPhase}
    onPhaseChange={setSelectedPhase}
    overallProgress={overallProgress}
    milestones={milestones}
  />
  <PartsProcurementStatus
    parts={parts}
    onPartStatusChange={handlePartStatusChange}
  />
</WorkForm>
```

### 2-12. その他

**フローパターン**: パターンA

**共通コンポーネント使用**:
- `ReceptionForm`: 受付画面
- `DiagnosisForm`: 診断画面
- `EstimateForm`: 見積画面
- `WorkForm`: 作業画面
- `HandoverForm`: 引渡画面

**拡張コンポーネント**:
- `ServiceContentInput`: 業務内容入力（自由入力）
- `CustomDiagnosisItems`: カスタム診断項目（動的）
- `CustomEstimateItems`: カスタム見積項目（動的）

**実装例**:
```typescript
// 受付画面
<ReceptionForm
  vehicle={vehicle}
  mileage={mileage}
  onMileageChange={setMileage}
  onSubmit={handleSubmit}
>
  <ServiceContentInput
    serviceContent={serviceContent}
    onChange={setServiceContent}
  />
</ReceptionForm>
```

---

## 3. 拡張ポイント

### 3-1. 共通コンポーネントの拡張

**childrenプロップを使用**:
```typescript
<ReceptionForm {...commonProps}>
  {/* 入庫区分別の拡張コンテンツ */}
  <CustomSection />
</ReceptionForm>
```

### 3-2. データモデルの拡張

**型の拡張**:
```typescript
interface CustomWorkOrder extends WorkOrder {
  serviceKind: "カスタム";
  customData: {
    // カスタムフィールド
  };
}
```

### 3-3. APIの拡張

**エンドポイントの拡張**:
```typescript
// 共通エンドポイント
POST /api/jobs/{id}/work-orders/{workOrderId}/diagnosis

// 拡張エンドポイント（必要に応じて）
POST /api/jobs/{id}/work-orders/{workOrderId}/custom-action
```

---

## 4. 実装チェックリスト

### 4-1. 共通コンポーネントの使用

- [ ] `PageLayout`を使用
- [ ] `VehicleInfoCard`を使用
- [ ] 適切な共通フォームコンポーネントを使用
- [ ] 共通スタイルガイドラインに準拠

### 4-2. 拡張コンポーネントの実装

- [ ] 入庫区分専用の拡張コンポーネントを実装
- [ ] 共通コンポーネントの`children`で拡張
- [ ] 拡張コンポーネントは再利用可能に設計

### 4-3. データモデルの実装

- [ ] 統一データモデルを拡張
- [ ] 型安全性を確保
- [ ] バリデーションを実装

### 4-4. APIの実装

- [ ] 統一API設計に準拠
- [ ] エラーハンドリングを実装
- [ ] 適切なHTTPステータスコードを使用

---

## 5. 更新履歴

- 2025-01-XX: 初版作成

---

## 6. 関連ドキュメント

- [統合仕様書](./INTEGRATED_SPECIFICATION.md)
- [共通コンポーネントライブラリ](./COMMON_COMPONENTS_LIBRARY.md)
- [データモデル統合](./DATA_MODEL_INTEGRATION.md)
- [API設計統一](./API_DESIGN_UNIFIED.md)
- [UI/UXガイドライン](./UI_UX_GUIDELINES.md)
- [実装ガイド](./IMPLEMENTATION_GUIDE.md)

























