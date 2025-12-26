# 共通コンポーネントライブラリ仕様書

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **対象**: すべての入庫区分で使用する共通UI/UXコンポーネント
- **設計方針**: 世界最高のUI/UX、ITコンサルの目線での推奨を元に設計

---

## 1. コンポーネント分類

### 1-1. レイアウトコンポーネント

#### PageLayout
**用途**: すべてのページの基本レイアウト

**Props**:
```typescript
interface PageLayoutProps {
  title: string;
  mechanicName?: string;
  backHref?: string;
  children: React.ReactNode;
}
```

**実装例**:
```typescript
<PageLayout 
  title="田中様 BMW X3 車検診断"
  mechanicName="中村"
  backHref="/"
>
  {/* メインコンテンツ */}
</PageLayout>
```

#### VehicleInfoCard
**用途**: 車両情報の表示（自動入力済み・編集不可）

**Props**:
```typescript
interface VehicleInfoCardProps {
  vehicle: {
    licensePlate: string;
    chassisNumber: string;
    firstRegistration: string;
  };
}
```

**実装例**:
```typescript
<VehicleInfoCard 
  vehicle={{
    licensePlate: "堺 330 す 1669",
    chassisNumber: "VF3CUHNZTHY061316",
    firstRegistration: "H29.10"
  }}
/>
```

#### SectionCard
**用途**: セクションを区切るカード

**Props**:
```typescript
interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
```

**実装例**:
```typescript
<SectionCard title="診断項目" icon={<Activity />}>
  {/* 診断項目のコンテンツ */}
</SectionCard>
```

### 1-2. フォームコンポーネント

#### FormField
**用途**: フォームフィールドのラッパー

**Props**:
```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
}
```

**実装例**:
```typescript
<FormField 
  label="走行距離" 
  required 
  error={errors.mileage}
>
  <Input 
    type="number" 
    value={mileage} 
    onChange={(e) => setMileage(e.target.value)}
  />
</FormField>
```

#### PhotoCaptureButton
**用途**: 写真撮影ボタン

**Props**:
```typescript
interface PhotoCaptureButtonProps {
  label: string;
  photos: Photo[];
  onCapture: (file: File) => void;
  onRemove: (photoId: string) => void;
  required?: boolean;
  disabled?: boolean;
}
```

**実装例**:
```typescript
<PhotoCaptureButton
  label="Before写真"
  photos={beforePhotos}
  onCapture={handleCapture}
  onRemove={handleRemove}
  required
/>
```

#### VideoCaptureButton
**用途**: 動画撮影ボタン

**Props**:
```typescript
interface VideoCaptureButtonProps {
  label: string;
  videos: Video[];
  onCapture: (file: File) => void;
  onRemove: (videoId: string) => void;
  disabled?: boolean;
  /** 最大録画時間（秒） */
  maxDuration?: number;
  /** 必須かどうか */
  required?: boolean;
}
```

**実装例**:
```typescript
<VideoCaptureButton
  label="動画を撮影"
  videos={videos}
  onCapture={handleVideoCapture}
  onRemove={handleVideoRemove}
  maxDuration={15} // 車検・12ヶ月点検: 最大15秒
  required={false} // 板金・塗装のBefore動画: required={true}
/>
```

**入庫区分別の要件**:
- **車検・12ヶ月点検**: 不具合項目のみ、最大15秒、任意
- **故障診断**: ケースバイケース、任意
- **板金・塗装**: Before動画撮影必須、After動画撮影必須
- **その他**: 動画撮影不要

### 1-3. 表示コンポーネント

#### ProgressBar
**用途**: 進捗状況の表示

**Props**:
```typescript
interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}
```

**実装例**:
```typescript
<ProgressBar 
  current={15} 
  total={20} 
  label="エンジン・ルーム点検"
/>
```

#### StatusBadge
**用途**: ステータスの表示

**Props**:
```typescript
interface StatusBadgeProps {
  status: "正常" | "注意" | "要交換" | "要修理" | "要カスタム";
  variant?: "default" | "success" | "warning" | "error";
}
```

**実装例**:
```typescript
<StatusBadge status="正常" variant="success" />
```

#### ItemCard
**用途**: 項目カード（検査項目、見積項目など）

**Props**:
```typescript
interface ItemCardProps {
  title: string;
  status?: string;
  photos?: Photo[];
  comment?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}
```

**実装例**:
```typescript
<ItemCard
  title="パワー・ステアリング"
  status="正常"
  photos={photos}
  comment={comment}
  onEdit={handleEdit}
  onDelete={handleDelete}
>
  {/* 追加コンテンツ */}
</ItemCard>
```

### 1-4. アクションコンポーネント

#### ActionButton
**用途**: アクションボタン（診断開始、見積開始など）

**Props**:
```typescript
interface ActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
}
```

**実装例**:
```typescript
<ActionButton
  label="診断を開始"
  icon={<Activity />}
  onClick={handleStartDiagnosis}
  variant="primary"
/>
```

#### SaveButton
**用途**: 保存ボタン（一時保存、完了）

**Props**:
```typescript
interface SaveButtonProps {
  type: "draft" | "complete";
  onSave: () => void;
  disabled?: boolean;
  loading?: boolean;
}
```

**実装例**:
```typescript
<SaveButton
  type="complete"
  onSave={handleComplete}
  loading={isSaving}
/>
```

### 1-5. 入力コンポーネント

#### NumberInput
**用途**: 数値入力（走行距離、作業時間など）

**Props**:
```typescript
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  required?: boolean;
  error?: string;
}
```

**実装例**:
```typescript
<NumberInput
  label="走行距離"
  value={mileage}
  onChange={setMileage}
  unit="km"
```

#### AudioInputButton
**用途**: 音声入力ボタン（部品名の音声認識など、手が汚れている状態でも入力可能）

**Props**:
```typescript
interface AudioInputButtonProps {
  /** 音声認識結果のコールバック */
  onRecognize: (text: string) => void;
  /** 録音中のコールバック */
  onRecording?: (isRecording: boolean) => void;
  /** 最大録音時間（秒） */
  maxDuration?: number;
  /** 無効化 */
  disabled?: boolean;
  /** ローディング状態 */
  loading?: boolean;
}
```

**実装例**:
```typescript
<AudioInputButton
  onRecognize={handleVoiceRecognize}
  onRecording={setIsRecording}
  maxDuration={30}
/>
```

**技術仕様**:
- Web Speech API（ブラウザ標準）または OpenAI Whisper API を使用
- 最大録音時間: 30秒（デフォルト）
- 録音中は視覚的に表示（録音中のアイコン、タイマー）
- 音声認識結果は自動的にテキストに変換
  required
/>
```

#### TextArea
**用途**: テキストエリア（コメント、作業記録など）

**Props**:
```typescript
interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
}
```

**実装例**:
```typescript
<TextArea
  label="整備士の所見"
  value={comments}
  onChange={setComments}
  placeholder="診断結果、特記事項など"
  rows={4}
/>
```

#### Select
**用途**: セレクトボックス（状態選択、種類選択など）

**Props**:
```typescript
interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
}
```

**実装例**:
```typescript
<Select
  label="状態"
  value={status}
  onChange={setStatus}
  options={[
    { value: "正常", label: "正常" },
    { value: "注意", label: "注意" },
    { value: "要交換", label: "要交換" }
  ]}
  required
/>
```

#### CheckboxGroup
**用途**: チェックボックスグループ（複数選択）

**Props**:
```typescript
interface CheckboxGroupProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  required?: boolean;
  error?: string;
}
```

### 1-6. 表示専用コンポーネント

#### EstimateSummary
**用途**: 見積もりサマリーの表示

**Props**:
```typescript
interface EstimateSummaryProps {
  items: EstimateItem[];
  subtotal: number;
  tax: number;
  total: number;
}
```

**実装例**:
```typescript
<EstimateSummary
  items={estimateItems}
  subtotal={80000}
  tax={8000}
  total={88000}
/>
```

#### WorkOrderList
**用途**: ワークオーダーリストの表示

**Props**:
```typescript
interface WorkOrderListProps {
  workOrders: WorkOrder[];
  onSelect?: (workOrderId: string) => void;
  selectedId?: string;
}
```

**実装例**:
```typescript
<WorkOrderList
  workOrders={workOrders}
  onSelect={handleSelectWorkOrder}
  selectedId={selectedWorkOrderId}
/>
```

---

## 2. 画面別共通コンポーネント

### 2-1. 受付画面コンポーネント

#### ReceptionForm
**用途**: 受付フォームの基本構造

**Props**:
```typescript
interface ReceptionFormProps {
  vehicle: Vehicle;
  mileage: number;
  onMileageChange: (mileage: number) => void;
  previousHistory?: Job[];
  notes?: string;
  onNotesChange: (notes: string) => void;
  onSubmit: () => void;
  children?: React.ReactNode; // 入庫区分別の拡張コンテンツ
}
```

**実装例**:
```typescript
<ReceptionForm
  vehicle={vehicle}
  mileage={mileage}
  onMileageChange={setMileage}
  previousHistory={previousHistory}
  notes={notes}
  onNotesChange={setNotes}
  onSubmit={handleSubmit}
>
  {/* 入庫区分別の拡張コンテンツ */}
  <AccidentInfoSection 
    accident={accident}
    onChange={setAccident}
  />
</ReceptionForm>
```

### 2-2. 診断画面コンポーネント

#### DiagnosisForm
**用途**: 診断フォームの基本構造

**Props**:
```typescript
interface DiagnosisFormProps {
  vehicle: Vehicle;
  receptionInfo: ReceptionInfo;
  diagnosisData: DiagnosisData;
  onDiagnosisDataChange: (data: DiagnosisData) => void;
  onSave: (type: "draft" | "complete") => void;
  children?: React.ReactNode; // 入庫区分別の拡張コンテンツ
}
```

**実装例**:
```typescript
<DiagnosisForm
  vehicle={vehicle}
  receptionInfo={receptionInfo}
  diagnosisData={diagnosisData}
  onDiagnosisDataChange={setDiagnosisData}
  onSave={handleSave}
>
  {/* 入庫区分別の拡張コンテンツ */}
  <InspectionCategoryTabs 
    categories={categories}
    onCategoryChange={setSelectedCategory}
  />
</DiagnosisForm>
```

### 2-3. 見積画面コンポーネント

#### EstimateForm
**用途**: 見積フォームの基本構造

**Props**:
```typescript
interface EstimateFormProps {
  vehicle: Vehicle;
  diagnosisData: DiagnosisData;
  estimateData: EstimateData;
  onEstimateDataChange: (data: EstimateData) => void;
  approvalMethod: "口頭承認" | "事前承認" | "システム承認";
  onApprovalMethodChange: (method: string) => void;
  onSubmit: () => void;
  children?: React.ReactNode; // 入庫区分別の拡張コンテンツ
}
```

**実装例**:
```typescript
<EstimateForm
  vehicle={vehicle}
  diagnosisData={diagnosisData}
  estimateData={estimateData}
  onEstimateDataChange={setEstimateData}
  approvalMethod={approvalMethod}
  onApprovalMethodChange={setApprovalMethod}
  onSubmit={handleSubmit}
>
  {/* 入庫区分別の拡張コンテンツ */}
  <LegalFeesDisplay 
    vehicleWeight={vehicle.weight}
    legalFees={legalFees}
  />
</EstimateForm>
```

### 2-4. 作業画面コンポーネント

#### WorkForm
**用途**: 作業フォームの基本構造

**Props**:
```typescript
interface WorkFormProps {
  vehicle: Vehicle;
  estimateData: EstimateData;
  workData: WorkData;
  onWorkDataChange: (data: WorkData) => void;
  onSubmit: () => void;
  children?: React.ReactNode; // 入庫区分別の拡張コンテンツ
}
```

**実装例**:
```typescript
<WorkForm
  vehicle={vehicle}
  estimateData={estimateData}
  workData={workData}
  onWorkDataChange={setWorkData}
  onSubmit={handleSubmit}
>
  {/* 入庫区分別の拡張コンテンツ */}
  <PhaseManagement 
    phases={phases}
    onPhaseChange={setSelectedPhase}
  />
</WorkForm>
```

### 2-5. 引渡画面コンポーネント

#### HandoverForm
**用途**: 引渡フォームの基本構造

**Props**:
```typescript
interface HandoverFormProps {
  vehicle: Vehicle;
  workSummary: WorkSummary;
  onSubmit: () => void;
  children?: React.ReactNode; // 入庫区分別の拡張コンテンツ
}
```

**実装例**:
```typescript
<HandoverForm
  vehicle={vehicle}
  workSummary={workSummary}
  onSubmit={handleSubmit}
>
  {/* 入庫区分別の拡張コンテンツ */}
  <PDFDownloadButton 
    pdfUrl={pdfUrl}
    fileName="分解整備記録簿.pdf"
  />
</HandoverForm>
```

---

## 3. 入庫区分別拡張コンポーネント

### 3-1. 車検・12ヵ月点検

#### InspectionCategoryTabs
**用途**: 検査カテゴリのタブ切り替え

**Props**:
```typescript
interface InspectionCategoryTabsProps {
  categories: InspectionCategory[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  progress: Record<string, { current: number; total: number }>;
}
```

#### InspectionItemCard
**用途**: 検査項目カード

**Props**:
```typescript
interface InspectionItemCardProps {
  item: InspectionItem;
  onStatusChange: (status: InspectionStatus) => void;
  onPhotoAdd: (file: File) => void;
  onCommentChange: (comment: string) => void;
}
```

#### MeasurementInputScreen
**用途**: 測定値入力専用画面

**Props**:
```typescript
interface MeasurementInputScreenProps {
  measurements: MeasurementData[];
  onMeasurementsChange: (measurements: MeasurementData[]) => void;
  onSave: () => void;
}
```

#### OBDDiagnosticResultSection
**用途**: OBD診断結果のアップロード・表示（12ヶ月点検専用）

**Props**:
```typescript
interface OBDDiagnosticResultSectionProps {
  /** OBD診断結果PDF URL */
  obdDiagnosticResultPdf?: string;
  /** PDFアップロード */
  onPdfUpload: (file: File) => void;
  /** PDF削除 */
  onPdfDelete: () => void;
  /** PDF表示 */
  onPdfView: () => void;
}
```

**実装例**:
```typescript
<OBDDiagnosticResultSection
  obdDiagnosticResultPdf={diagnosis.obdDiagnosticResultPdf}
  onPdfUpload={handleOBDDiagnosticResultUpload}
  onPdfDelete={handleOBDDiagnosticResultDelete}
  onPdfView={handleOBDDiagnosticResultView}
/>
```

#### OptionMenuSelector
**用途**: オプションメニューの選択（12ヶ月点検専用、同時実施で10%割引）

**Props**:
```typescript
interface OptionMenuSelectorProps {
  /** オプションメニューリスト */
  optionMenus: OptionMenu[];
  /** 選択済みメニューID */
  selectedMenuIds: string[];
  /** メニュー選択変更 */
  onMenuSelectionChange: (menuIds: string[]) => void;
}
```

**実装例**:
```typescript
<OptionMenuSelector
  optionMenus={optionMenus}
  selectedMenuIds={estimate.optionMenus?.filter(m => m.selected).map(m => m.menuId) || []}
  onMenuSelectionChange={handleOptionMenuSelectionChange}
/>
```

### 3-2. 故障診断

#### SymptomCategorySelector
**用途**: 症状カテゴリの選択

**Props**:
```typescript
interface SymptomCategorySelectorProps {
  categories: SymptomCategory[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}
```

#### DiagnosticToolSection
**用途**: 診断機の利用セクション

**Props**:
```typescript
interface DiagnosticToolSectionProps {
  useDiagnosticTool: boolean;
  onUseDiagnosticToolChange: (use: boolean) => void;
  diagnosticToolCost: number;
  diagnosticToolResultPdf?: string;
  onPdfUpload: (file: File) => void;
}
```

### 3-3. レストア

#### PhaseManagement
**用途**: フェーズ管理

**Props**:
```typescript
interface PhaseManagementProps {
  phases: WorkPhase[];
  selectedPhase: string;
  onPhaseChange: (phaseId: string) => void;
  overallProgress: number;
  milestones: Milestone[];
}
```

#### PartsProcurementStatus
**用途**: 部品取り寄せ状況の表示

**Props**:
```typescript
interface PartsProcurementStatusProps {
  parts: PartItem[];
  onPartStatusChange: (partId: string, status: PartStatus) => void;
}
```

### 3-4. 板金・塗装

#### AccidentInfoSection
**用途**: 事故案件情報の入力

**Props**:
```typescript
interface AccidentInfoSectionProps {
  accident: AccidentInfo;
  onChange: (accident: AccidentInfo) => void;
}
```

#### OutsourcingProgressSection
**用途**: 外注作業進捗の管理

**Props**:
```typescript
interface OutsourcingProgressSectionProps {
  outsourcing: OutsourcingInfo;
  onProgressUpdate: (progress: OutsourcingProgress) => void;
}
```

### 3-5. コーティング

#### CoatingTypeSelector
**用途**: コーティング種類の選択

**Props**:
```typescript
interface CoatingTypeSelectorProps {
  types: CoatingType[];
  selectedType: string;
  onTypeChange: (typeId: string) => void;
  vehicleDimensions: VehicleDimensions;
  pricing: PricingInfo;
}
```

#### OptionalServicesSelector
**用途**: オプションサービスの選択

**Props**:
```typescript
interface OptionalServicesSelectorProps {
  services: OptionalService[];
  selectedServices: string[];
  onServicesChange: (serviceIds: string[]) => void;
  simultaneousDiscount: number; // 10%
}
```

---

## 4. コンポーネント使用ガイドライン

### 4-1. コンポーネントの選択

**基本原則**:
- 共通コンポーネントを優先的に使用
- 入庫区分別の拡張が必要な場合は、共通コンポーネントを拡張
- 新しいコンポーネントを作成する前に、既存コンポーネントで対応可能か確認

### 4-2. スタイリング

**原則**:
- Tailwind CSSを使用
- shadcn/uiのコンポーネントをベースにする
- カスタムスタイルは最小限に抑える

**例**:
```typescript
// Good: Tailwind CSSを使用
<div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg">

// Bad: インラインスタイルを使用
<div style={{ display: 'flex', padding: '16px' }}>
```

### 4-3. 状態管理

**原則**:
- ローカル状態は`useState`を使用
- サーバー状態は`SWR`を使用
- グローバル状態は`React Context`を使用（必要最小限）

**例**:
```typescript
// ローカル状態
const [mileage, setMileage] = useState<number>(0);

// サーバー状態
const { data: job, mutate } = useSWR(`/api/jobs/${jobId}`, fetcher);
```

### 4-4. エラーハンドリング

**原則**:
- フォームバリデーションはリアルタイムで実施
- エラーメッセージは明確に表示
- ネットワークエラーは自動リトライ

**例**:
```typescript
<FormField 
  label="走行距離" 
  required 
  error={errors.mileage}
  helpText="現在の走行距離を入力してください"
>
  <NumberInput
    value={mileage}
    onChange={setMileage}
    min={0}
    max={999999}
  />
</FormField>
```

---

## 5. コンポーネント実装例

### 5-1. 受付画面の実装例

```typescript
import { ReceptionForm } from "@/components/common/reception-form";
import { AccidentInfoSection } from "@/components/features/body-paint/accident-info-section";

export function BodyPaintReceptionPage({ jobId }: { jobId: string }) {
  const { data: job } = useSWR(`/api/jobs/${jobId}`, fetcher);
  const [mileage, setMileage] = useState(job?.mileage || 0);
  const [accident, setAccident] = useState<AccidentInfo>({
    isAccident: false,
    isTowTruck: false,
    hasInsurance: false,
  });

  const handleSubmit = async () => {
    await saveReceptionData({
      mileage,
      accident,
    });
  };

  return (
    <ReceptionForm
      vehicle={job.vehicle}
      mileage={mileage}
      onMileageChange={setMileage}
      previousHistory={previousHistory}
      onSubmit={handleSubmit}
    >
      <AccidentInfoSection
        accident={accident}
        onChange={setAccident}
      />
    </ReceptionForm>
  );
}
```

### 5-2. 診断画面の実装例

```typescript
import { DiagnosisForm } from "@/components/common/diagnosis-form";
import { InspectionCategoryTabs } from "@/components/features/inspection/inspection-category-tabs";

export function VehicleInspectionDiagnosisPage({ jobId }: { jobId: string }) {
  const { data: job } = useSWR(`/api/jobs/${jobId}`, fetcher);
  const [selectedCategory, setSelectedCategory] = useState("engine");
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData>({
    inspectionResults: [],
    measurements: [],
    photos: [],
  });

  const handleSave = async (type: "draft" | "complete") => {
    await saveDiagnosisData(diagnosisData, type);
  };

  return (
    <DiagnosisForm
      vehicle={job.vehicle}
      receptionInfo={job.reception}
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
    </DiagnosisForm>
  );
}
```

---

## 6. 更新履歴

- 2025-01-XX: 初版作成

---

## 7. 関連ドキュメント

- [統合仕様書](./INTEGRATED_SPECIFICATION.md)
- [UI/UXガイドライン](./UI_UX_GUIDELINES.md)
- [実装ガイド](./IMPLEMENTATION_GUIDE.md)

































