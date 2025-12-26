# データモデル統合仕様書

## ドキュメント情報

- **作成日**: 2025-01-XX
- **バージョン**: 1.0
- **対象**: すべての入庫区分を統合したデータモデル
- **設計方針**: 統一データモデルをベースに、入庫区分別の拡張ポイントを定義

---

## 1. 統一データモデル

### 1-1. 基本Jobモデル

**定義**:
```typescript
/**
 * 基本Jobモデル
 * すべての入庫区分で共通の基本構造
 */
export interface BaseJob {
  /** Job ID (Zoho Record ID) */
  jobId: string;
  
  /** 入庫区分 */
  serviceKind: ServiceKind;
  
  /** 実施作業リスト（複数作業対応） */
  serviceKinds: ServiceKind[];
  
  /** 車両情報 */
  vehicle: {
    /** 車両ID */
    vehicleId: string;
    /** 走行距離 */
    mileage: number;
  };
  
  /** ステータス */
  status: JobStatus;
  
  /** ワークオーダーリスト */
  workOrders: WorkOrder[];
  
  /** 基幹システム連携ID */
  baseSystemId?: string;
  
  /** 作成日時 */
  createdAt: Date;
  
  /** 更新日時 */
  updatedAt: Date;
}
```

### 1-2. ワークオーダーモデル

**定義**:
```typescript
/**
 * ワークオーダーモデル
 * 各作業ごとの詳細情報を管理
 */
export interface WorkOrder {
  /** ワークオーダーID */
  id: string;
  
  /** 入庫区分 */
  serviceKind: ServiceKind;
  
  /** ステータス */
  status: WorkOrderStatus;
  
  /** 診断情報 */
  diagnosis?: DiagnosisData;
  
  /** 見積情報 */
  estimate?: EstimateData;
  
  /** 作業情報 */
  work?: WorkData;
  
  /** 基幹システム明細ID */
  baseSystemItemId?: string;
  
  /** 費用 */
  cost?: number;
  
  /** 作成日時 */
  createdAt: Date;
  
  /** 更新日時 */
  updatedAt: Date;
}
```

### 1-3. 共通データ型

**Jobステータス**:
```typescript
export type JobStatus =
  | "入庫待ち"
  | "診断中"
  | "見積作成待ち"
  | "顧客承認待ち"
  | "作業待ち"
  | "作業中"
  | "出庫待ち"
  | "出庫済み";
```

**ワークオーダーステータス**:
```typescript
export type WorkOrderStatus =
  | "未開始"
  | "診断中"
  | "見積作成待ち"
  | "顧客承認待ち"
  | "作業待ち"
  | "作業中"
  | "完了";
```

**入庫区分**:
```typescript
export type ServiceKind =
  | "車検"
  | "12ヵ月点検"
  | "エンジンオイル交換"
  | "タイヤ交換・ローテーション"
  | "その他のメンテナンス"
  | "故障診断"
  | "修理・整備"
  | "チューニング"
  | "パーツ取付"
  | "コーティング"
  | "板金・塗装"
  | "レストア"
  | "その他";
```

---

## 2. 共通データ構造

### 2-1. 診断データ

**定義**:
```typescript
/**
 * 診断データ（共通）
 */
export interface DiagnosisData {
  /** 診断項目の結果 */
  items?: DiagnosisItem[];
  
  /** 写真 */
  photos: Photo[];
  
  /** 動画 */
  videos?: Video[];
  
  /** コメント（整備士の所見） */
  comments: string;
  
  /** 診断日時 */
  diagnosedAt?: Date;
}
```

**診断項目**:
```typescript
export interface DiagnosisItem {
  /** 項目名 */
  name: string;
  
  /** 状態 */
  status?: string;
  
  /** 写真 */
  photo?: Photo;
  
  /** コメント */
  comment?: string;
}
```

### 2-2. 見積データ

**定義**:
```typescript
/**
 * 見積データ（共通）
 */
export interface EstimateData {
  /** 見積もり項目 */
  items: EstimateItem[];
  
  /** 小計 */
  subtotal: number;
  
  /** 消費税 */
  tax: number;
  
  /** 合計金額 */
  total: number;
  
  /** 承認方法 */
  approvalMethod?: "口頭承認" | "事前承認" | "システム承認";
  
  /** 承認日時 */
  approvedAt?: Date;
  
  /** 見積作成日時 */
  createdAt?: Date;
}
```

**見積項目**:
```typescript
export interface EstimateItem {
  /** 項目名 */
  name: string;
  
  /** 数量 */
  quantity: number;
  
  /** 単価 */
  unitPrice: number;
  
  /** 金額 */
  amount: number;
  
  /** 備考 */
  note?: string;
}
```

### 2-3. 作業データ

**定義**:
```typescript
/**
 * 作業データ（共通）
 */
export interface WorkData {
  /** 作業記録 */
  workContent: string;
  
  /** Before写真 */
  beforePhotos: Photo[];
  
  /** After写真 */
  afterPhotos: Photo[];
  
  /** 作業時間 */
  workDuration: number;
  
  /** 作業メモ */
  notes: string;
  
  /** 作業完了日時 */
  completedAt?: Date;
}
```

### 2-4. 共通データ型

**写真**:
```typescript
export interface Photo {
  /** 写真ID */
  photoId: string;
  
  /** ファイルパス（Google Drive） */
  filePath: string;
  
  /** 撮影日時 */
  takenAt: Date;
  
  /** 説明 */
  description?: string;
}
```

**動画**:
```typescript
export interface Video {
  /** 動画ID */
  videoId: string;
  
  /** ファイルパス（Google Drive） */
  filePath: string;
  
  /** 撮影日時 */
  takenAt: Date;
  
  /** 説明 */
  description?: string;
}
```

**部品項目**:
```typescript
export interface PartItem {
  /** 部品名 */
  name: string;
  
  /** 数量 */
  quantity: number;
  
  /** 単価 */
  unitPrice: number;
  
  /** 金額 */
  amount: number;
  
  /** 備考 */
  note?: string;
}
```

---

## 3. 入庫区分別の拡張モデル

### 3-1. 車検

**拡張モデル**:
```typescript
export interface VehicleInspectionJob extends BaseJob {
  serviceKind: "車検";
  workOrders: VehicleInspectionWorkOrder[];
}

export interface VehicleInspectionWorkOrder extends WorkOrder {
  serviceKind: "車検";
  
  diagnosis: {
    /** 検査項目の結果 */
    inspectionResults: InspectionResult[];
    /** 測定値 */
    measurements: MeasurementData[];
    /** 写真 */
    photos: Photo[];
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** 法定費用 */
    legalFees: number;
    /** 部品リスト */
    parts: PartItem[];
    /** 工賃 */
    labor: number;
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
  };
  
  work: {
    /** 交換部品 */
    replacedParts: PartItem[];
    /** 測定値 */
    measurements: MeasurementData[];
    /** Before/After写真 */
    beforePhotos: Photo[];
    afterPhotos: Photo[];
    /** 作業時間 */
    workDuration: number;
    /** 作業メモ */
    notes: string;
  };
}
```

**検査結果**:
```typescript
export interface InspectionResult {
  /** 項目名 */
  name: string;
  /** 状態 */
  status: "OK" | "注意" | "要交換" | "調整" | "清掃";
  /** 写真 */
  photo?: Photo;
  /** コメント */
  comment?: string;
}
```

**測定値**:
```typescript
export interface MeasurementData {
  /** 測定項目名 */
  name: string;
  /** 値 */
  value: number;
  /** 単位 */
  unit: string;
  /** 写真 */
  photo?: Photo;
}
```

### 3-2. 12ヵ月点検

**拡張モデル**:
```typescript
export interface TwelveMonthInspectionJob extends BaseJob {
  serviceKind: "12ヵ月点検";
  workOrders: TwelveMonthInspectionWorkOrder[];
}

export interface TwelveMonthInspectionWorkOrder extends WorkOrder {
  serviceKind: "12ヵ月点検";
  
  diagnosis: {
    /** 検査項目の結果 */
    inspectionResults: InspectionResult[];
    /** 測定値 */
    measurements: MeasurementData[];
    /** 写真 */
    photos: Photo[];
    /** コメント */
    comments: string;
    /** OBD診断結果PDF URL（別システムで実施、決まったフォーマット） */
    obdDiagnosticResultPdf?: string;
  };
  
  estimate: {
    /** 法定費用（車両重量に応じて） */
    legalFees: number;
    /** 部品リスト */
    parts: PartItem[];
    /** 工賃 */
    labor: number;
    /** オプションメニュー（12ヶ月点検と同時実施で10%割引） */
    optionMenus?: OptionMenu[];
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
  };
  
  work: {
    /** 交換部品 */
    replacedParts: PartItem[];
    /** 測定値 */
    measurements: MeasurementData[];
    /** Before/After写真 */
    beforePhotos: Photo[];
    afterPhotos: Photo[];
    /** 作業時間 */
    workDuration: number;
    /** 作業メモ */
    notes: string;
  };
}

/** オプションメニュー */
export interface OptionMenu {
  /** メニューID */
  menuId: string;
  /** メニュー名 */
  name: string;
  /** 通常価格 */
  regularPrice: number;
  /** 割引価格（12ヶ月点検と同時実施で10%割引） */
  discountedPrice: number;
  /** 内容 */
  description: string;
  /** バッジ */
  badge: string;
  /** 選択済み */
  selected: boolean;
}
```

### 3-3. エンジンオイル交換

**拡張モデル**:
```typescript
export interface EngineOilChangeJob extends BaseJob {
  serviceKind: "エンジンオイル交換";
  workOrders: EngineOilChangeWorkOrder[];
}

export interface EngineOilChangeWorkOrder extends WorkOrder {
  serviceKind: "エンジンオイル交換";
  
  diagnosis: {
    /** 簡易検査項目（3項目） */
    inspectionItems: SimpleInspectionItem[];
    /** 追加部品リスト（イレギュラー用） */
    additionalParts?: PartItem[];
    /** 写真 */
    photos: Photo[];
    /** コメント */
    comments: string;
  };
  
  work: {
    /** 作業記録 */
    workContent: string;
    /** Before/After写真 */
    beforePhotos: Photo[];
    afterPhotos: Photo[];
    /** 交換部品 */
    replacedParts: PartItem[];
    /** 作業時間 */
    workDuration: number;
    /** 作業メモ */
    notes: string;
  };
}
```

### 3-4. タイヤ交換・ローテーション

**拡張モデル**:
```typescript
export interface TireReplacementRotationJob extends BaseJob {
  serviceKind: "タイヤ交換・ローテーション";
  workOrders: TireReplacementRotationWorkOrder[];
}

export interface TireReplacementRotationWorkOrder extends WorkOrder {
  serviceKind: "タイヤ交換・ローテーション";
  
  /** 種類 */
  type: "タイヤ交換" | "タイヤローテーション";
  
  diagnosis: {
    /** 簡易検査項目 */
    inspectionItems: SimpleInspectionItem[];
    /** 写真 */
    photos: Photo[];
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** 見積もり項目 */
    items: EstimateItem[];
    /** 部品リスト */
    parts: PartItem[];
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
  };
  
  work: {
    /** 作業記録 */
    workContent: string;
    /** 測定値（タイヤ溝深さ、タイヤ圧力） */
    measurements: MeasurementData[];
    /** Before/After写真 */
    beforePhotos: Photo[];
    afterPhotos: Photo[];
    /** 交換部品 */
    replacedParts: PartItem[];
    /** 作業時間 */
    workDuration: number;
    /** 作業メモ */
    notes: string;
  };
}
```

### 3-5. その他のメンテナンス

**拡張モデル**:
```typescript
export interface GeneralMaintenanceJob extends BaseJob {
  serviceKind: "その他のメンテナンス";
  workOrders: GeneralMaintenanceWorkOrder[];
}

export interface GeneralMaintenanceWorkOrder extends WorkOrder {
  serviceKind: "その他のメンテナンス";
  
  /** メンテナンス種類 */
  maintenanceType: MaintenanceType;
  
  diagnosis: {
    /** 診断項目（動的） */
    items: DiagnosisItem[];
    /** 測定値（動的） */
    measurements?: MeasurementData[];
    /** 写真 */
    photos: Photo[];
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** 見積もり項目 */
    items: EstimateItem[];
    /** 部品リスト */
    parts?: PartItem[];
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
  };
  
  work: {
    /** 作業記録 */
    workContent: string;
    /** 測定値（動的） */
    measurements?: MeasurementData[];
    /** Before/After写真 */
    beforePhotos: Photo[];
    afterPhotos: Photo[];
    /** 交換部品 */
    replacedParts?: PartItem[];
    /** 作業時間 */
    workDuration: number;
    /** 作業メモ */
    notes: string;
  };
}
```

**メンテナンス種類**:
```typescript
export type MaintenanceType =
  | "バッテリー交換"
  | "ブレーキフルード交換"
  | "エアコンフィルター交換"
  | "燃料フィルター交換"
  | "スパークプラグ交換"
  | "ベルト交換"
  | "冷却水交換"
  | "ATF交換"
  | "パワーステアリングオイル交換"
  | "ワイパー交換"
  | "電球交換"
  | "その他";
```

### 3-6. 故障診断

**拡張モデル**:
```typescript
export interface FaultDiagnosisJob extends BaseJob {
  serviceKind: "故障診断";
  workOrders: FaultDiagnosisWorkOrder[];
}

export interface FaultDiagnosisWorkOrder extends WorkOrder {
  serviceKind: "故障診断";
  
  diagnosis: {
    /** 症状カテゴリ */
    symptomCategory: SymptomCategory;
    /** 検査項目（動的） */
    inspectionItems: DiagnosisItem[];
    /** 診断機の利用 */
    useDiagnosticTool: boolean;
    /** 診断機費用 */
    diagnosticToolCost?: number;
    /** 診断機結果PDF */
    diagnosticToolResultPdf?: string;
    /** 動画 */
    videos?: Video[];
    /** 音声 */
    audio?: Audio[];
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** 見積もり項目 */
    items: EstimateItem[];
    /** 診断機費用 */
    diagnosticToolCost?: number;
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
  };
  
  /** 故障診断から修理・整備への移行 */
  transitionToRepair?: {
    /** 移行先Job ID */
    repairJobId: string;
    /** 移行日時 */
    transitionedAt: Date;
  };
}
```

**症状カテゴリ**:
```typescript
export type SymptomCategory =
  | "エンジン"
  | "トランスミッション"
  | "ブレーキ"
  | "サスペンション"
  | "電装系"
  | "エアコン"
  | "その他";
```

### 3-7. 修理・整備

**拡張モデル**:
```typescript
export interface RepairMaintenanceJob extends BaseJob {
  serviceKind: "修理・整備";
  workOrders: RepairMaintenanceWorkOrder[];
}

export interface RepairMaintenanceWorkOrder extends WorkOrder {
  serviceKind: "修理・整備";
  
  /** 故障診断からの移行 */
  fromFaultDiagnosis?: {
    /** 元の故障診断Job ID */
    diagnosisJobId: string;
    /** 診断結果 */
    diagnosisResult: string;
  };
  
  diagnosis: {
    /** 修理箇所の確認 */
    repairLocations: RepairLocation[];
    /** 関連箇所の簡易点検 */
    relatedInspections: DiagnosisItem[];
    /** 診断機の利用 */
    useDiagnosticTool: boolean;
    /** 診断機結果PDF */
    diagnosticToolResultPdf?: string;
    /** 測定値 */
    measurements?: MeasurementData[];
    /** Before写真 */
    photos: Photo[];
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** 見積もり項目 */
    items: EstimateItem[];
    /** 部品リスト */
    parts: PartItem[];
    /** 診断機費用 */
    diagnosticToolCost?: number;
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
    /** 承認方法 */
    approvalMethod: "口頭承認" | "事前承認" | "システム承認";
  };
  
  work: {
    /** 作業記録 */
    workContent: string;
    /** Before/After写真 */
    beforePhotos: Photo[];
    afterPhotos: Photo[];
    /** 交換部品 */
    replacedParts: PartItem[];
    /** 動作確認結果 */
    operationCheck: {
      checked: boolean;
      content?: string;
    };
    /** 作業時間 */
    workDuration: number;
    /** 作業メモ */
    notes: string;
  };
}
```

### 3-8. チューニング・パーツ取付

**拡張モデル**:
```typescript
export interface TuningPartsInstallationJob extends BaseJob {
  serviceKind: "チューニング" | "パーツ取付";
  workOrders: TuningPartsInstallationWorkOrder[];
}

export interface TuningPartsInstallationWorkOrder extends WorkOrder {
  serviceKind: "チューニング" | "パーツ取付";
  
  /** 種類 */
  type: "チューニング" | "パーツ取付";
  
  /** カスタム情報 */
  custom: {
    /** カスタム内容 */
    description: string;
  };
  
  diagnosis: {
    /** 確認項目の結果 */
    inspectionResults: InspectionResult[];
    /** Before写真 */
    beforePhotos: Photo[];
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** パーツリスト */
    parts: PartItem[];
    /** 工賃 */
    labor: number;
    /** 作業時間見積もり */
    estimatedDuration: number;
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
    /** 承認方法 */
    approvalMethod: "口頭承認" | "事前承認" | "システム承認";
  };
  
  work: {
    /** 作業記録 */
    workContent: string;
    /** Before/After写真 */
    beforePhotos: Photo[];
    afterPhotos: Photo[];
    /** 取り付けたパーツ */
    installedParts: PartItem[];
    /** 動作確認結果 */
    operationCheck: {
      checked: boolean;
      content?: string;
    };
    /** 作業時間 */
    workDuration: number;
    /** 作業メモ */
    notes: string;
  };
}
```

### 3-9. コーティング

**拡張モデル**:
```typescript
export interface CoatingJob extends BaseJob {
  serviceKind: "コーティング";
  workOrders: CoatingWorkOrder[];
}

export interface CoatingWorkOrder extends WorkOrder {
  serviceKind: "コーティング";
  
  diagnosis: {
    /** コーティング種類 */
    coatingType: CoatingType;
    /** オプションサービス */
    optionalServices: OptionalService[];
    /** 車体の状態確認 */
    bodyCondition: BodyConditionCheck;
    /** 既存コーティングの状態 */
    existingCoating?: ExistingCoatingInfo;
    /** Before写真 */
    beforePhotos: Photo[];
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** 基本コーティング費用 */
    baseCoatingCost: number;
    /** オプションサービス */
    optionalServices: OptionalServiceEstimate[];
    /** 同時施工割引 */
    simultaneousDiscount: number;
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
  };
  
  work: {
    /** 作業記録 */
    workContent: string;
    /** Before/After写真 */
    beforePhotos: Photo[];
    afterPhotos: Photo[];
    /** 使用したコーティング剤 */
    coatingMaterials: CoatingMaterial[];
    /** 作業時間 */
    workDuration: number;
    /** 作業メモ */
    notes: string;
  };
  
  /** 乾燥プロセス */
  drying: {
    /** 乾燥開始日時 */
    startedAt: Date;
    /** 予定完了日時 */
    expectedCompletionAt: Date;
    /** 実際の完了日時 */
    completedAt?: Date;
    /** ステータス */
    status: "乾燥中" | "完了";
  };
}
```

**コーティング種類**:
```typescript
export type CoatingType =
  | "ハイモースコート エッジ"
  | "ハイモースコート グロウ"
  | "ガードグレイズ";
```

**オプションサービス**:
```typescript
export interface OptionalService {
  id: string;
  name: string;
  basePrice: number;
  discountedPrice: number; // 同時施工時
  selected: boolean;
}
```

### 3-10. 板金・塗装

**拡張モデル**:
```typescript
export interface BodyPaintJob extends BaseJob {
  serviceKind: "板金・塗装";
  workOrders: BodyPaintWorkOrder[];
}

export interface BodyPaintWorkOrder extends WorkOrder {
  serviceKind: "板金・塗装";
  
  /** 事故案件情報 */
  accident: {
    /** 事故案件かどうか */
    isAccident: boolean;
    /** レッカー入庫かどうか */
    isTowTruck: boolean;
    /** 保険対応の有無 */
    hasInsurance: boolean;
    /** 保険会社名 */
    insuranceCompany?: string;
    /** 事故の程度 */
    severity?: "軽微" | "中程度" | "深刻" | "全損";
    /** 事故の種類 */
    type?: "追突" | "出会い頭" | "側面衝突" | "単独事故" | "その他";
  };
  
  diagnosis: {
    /** 損傷箇所 */
    damageLocations: DamageLocation[];
    /** Before写真 */
    beforePhotos: Photo[];
    /** Before動画 */
    beforeVideos: Video[];
    /** 外注先への見積もり依頼方法 */
    estimateRequestMethod: "写真送付" | "持ち込み";
    /** 外注先名 */
    estimateRequestVendorName?: string;
    /** 外注先からの見積もり回答 */
    vendorEstimate?: VendorEstimate;
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** 見積もり項目 */
    items: EstimateItem[];
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
    /** 作業期間（月） */
    workDuration: number;
    /** 保険承認状況 */
    insuranceApproval?: {
      status: "承認済み" | "承認待ち";
      approvedAt?: Date;
    };
  };
  
  /** 外注情報 */
  outsourcing: {
    /** 外注先名 */
    vendorName: string;
    /** 発注日時 */
    orderDate?: Date;
    /** 発注方法 */
    orderMethod: "写真送付" | "持ち込み";
    /** 預け日時 */
    deliveryDate?: Date;
    /** 作業進捗状況 */
    progress: "発注済み" | "作業中" | "作業完了" | "引き取り済み";
    /** 作業完了日時 */
    completionDate?: Date;
    /** 引き取り日時 */
    pickupDate?: Date;
    /** 進捗メモ */
    progressNotes?: string[];
  };
  
  /** 品質確認情報 */
  qualityCheck: {
    /** 品質確認結果 */
    result?: "合格" | "要修正" | "返品";
    /** 確認項目 */
    checkItems?: QualityCheckItem[];
    /** After写真（必須） */
    afterPhotos: Photo[];
    /** コメント */
    comments?: string;
  };
}
```

### 3-11. レストア

**拡張モデル**:
```typescript
export interface RestoreJob extends BaseJob {
  serviceKind: "レストア";
  workOrders: RestoreWorkOrder[];
}

export interface RestoreWorkOrder extends WorkOrder {
  serviceKind: "レストア";
  
  diagnosis: {
    /** レストアの種類 */
    restoreType: "フルレストア" | "部分レストア" | "その他";
    /** 現状確認結果 */
    currentCondition: ConditionCheck[];
    /** 修復箇所 */
    restoreLocations: RestoreLocation[];
    /** Before写真 */
    beforePhotos: Photo[];
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** 見積もり項目 */
    items: EstimateItem[];
    /** 部品リスト */
    parts: PartItem[];
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
    /** 作業期間 */
    workDuration: string;
    /** 追加作業リスト */
    additionalWork: AdditionalWorkItem[];
    /** 見積もりの変更履歴 */
    changeHistory: EstimateChange[];
  };
  
  work: {
    /** フェーズ管理 */
    phases: WorkPhase[];
    /** 実施した作業の記録 */
    workRecords: WorkRecord[];
    /** 作業中の写真 */
    progressPhotos: Photo[];
    /** 使用した部品 */
    usedParts: PartItem[];
    /** 総作業時間 */
    totalWorkDuration: number;
    /** 作業メモ */
    notes: string;
    /** 作業進捗 */
    progress: number; // 0-100%
    /** 追加作業の記録 */
    additionalWorkRecords: WorkRecord[];
    /** 作業期間の延長記録 */
    extensionHistory: WorkExtension[];
  };
  
  handover: {
    /** After写真（必須） */
    afterPhotos: Photo[];
    /** 引渡日時 */
    handoverDate?: Date;
    /** 説明事項 */
    notes?: string;
  };
}
```

**作業フェーズ**:
```typescript
export interface WorkPhase {
  /** フェーズID */
  id: string;
  /** フェーズ名 */
  name: "分解" | "診断・評価" | "部品発注" | "修復" | "組み立て" | "仕上げ" | "最終確認";
  /** フェーズの順序 */
  order: number;
  /** フェーズの状態 */
  status: "未開始" | "作業中" | "完了" | "保留";
  /** フェーズの開始日 */
  startDate?: Date;
  /** フェーズの完了日 */
  completionDate?: Date;
  /** フェーズの進捗 */
  progress: number; // 0-100%
  /** フェーズの作業記録 */
  workRecords: WorkRecord[];
  /** フェーズで使用した部品 */
  usedParts: PartItem[];
  /** マイルストーン */
  isMilestone: boolean;
}
```

### 3-12. その他

**拡張モデル**:
```typescript
export interface OtherServiceJob extends BaseJob {
  serviceKind: "その他";
  workOrders: OtherServiceWorkOrder[];
}

export interface OtherServiceWorkOrder extends WorkOrder {
  serviceKind: "その他";
  
  /** 業務内容 */
  serviceContent: {
    /** 業務内容の種類 */
    type: string;
    /** 業務内容の詳細 */
    description: string;
  };
  
  diagnosis: {
    /** 診断項目（カスタマイズ可能） */
    items: CustomDiagnosisItem[];
    /** 診断写真 */
    photos: Photo[];
    /** コメント */
    comments: string;
  };
  
  estimate: {
    /** 見積もり項目（カスタマイズ可能） */
    items: EstimateItem[];
    /** 部品リスト（必要に応じて） */
    parts?: PartItem[];
    /** 小計 */
    subtotal: number;
    /** 消費税 */
    tax: number;
    /** 合計 */
    total: number;
  };
  
  work: {
    /** 作業内容（自由入力） */
    workContent: string;
    /** 作業写真 */
    photos: Photo[];
    /** 使用した部品（必要に応じて） */
    usedParts?: PartItem[];
    /** 作業時間 */
    workDuration: number;
    /** 作業メモ */
    notes: string;
  };
}
```

---

## 4. Zoho CRM連携モデル

### 4-1. Zoho Jobモデル

**定義**:
```typescript
export interface ZohoJob {
  /** Record ID */
  id: string;
  
  /** 入庫日時 */
  field22: string; // DateTime
  
  /** 工程ステージ */
  field5: JobStage;
  
  /** 顧客名 */
  field4: ZohoLookup | null;
  
  /** 車両ID */
  field6: ZohoLookup | null;
  
  /** 作業指示書 */
  field: string | null;
  
  /** 詳細情報 */
  field7: string | null;
  
  /** 走行距離 */
  field10: number | null;
  
  /** 作業内容 */
  field13: string | null;
  
  /** お客様共有フォルダ */
  field19: string | null;
  
  /** 実施作業リスト（拡張） */
  field_service_kinds?: ServiceKind[];
  
  /** ワークオーダー詳細（拡張） */
  field_work_orders?: string; // JSON string
  
  /** 基幹システム連携ID（拡張） */
  field_base_system_id?: string;
  
  /** アプリ拡張フィールド */
  tagId?: string | null;
  serviceKind?: ServiceKind | null;
  assignedMechanic?: string | null;
}
```

### 4-2. ワークオーダーJSON形式

**Zoho CRM保存形式**:
```json
{
  "workOrders": [
    {
      "id": "wo-001",
      "serviceKind": "車検",
      "status": "完了",
      "diagnosis": { ... },
      "estimate": { ... },
      "work": { ... },
      "baseSystemItemId": "INV-2025-001-1",
      "cost": 134750
    }
  ],
  "totalCost": 145310,
  "baseSystemInvoiceId": "INV-2025-001"
}
```

---

## 5. マスタデータ連携モデル

### 5-1. 車両マスタ

**定義**:
```typescript
export interface VehicleMaster {
  /** 車両ID */
  車両ID: string;
  
  /** 顧客ID */
  顧客ID: string;
  
  /** 登録番号連結 */
  登録番号連結: string;
  
  /** 車名 */
  車名: string;
  
  /** 型式 */
  型式: string;
  
  /** 車検有効期限 */
  車検有効期限: string; // Date (YYYY-MM-DD)
  
  /** 次回点検日 */
  次回点検日: string; // Date (YYYY-MM-DD)
  
  /** 車両重量（法定費用計算用） */
  車両重量?: number;
}
```

### 5-2. 顧客マスタ

**定義**:
```typescript
export interface CustomerMaster {
  /** 顧客ID */
  顧客ID: string;
  
  /** 顧客名 */
  顧客名: string;
  
  /** 住所連結 */
  住所連結: string;
  
  /** 電話番号 */
  電話番号: string;
  
  /** 携帯番号 */
  携帯番号: string;
}
```

---

## 6. データ変換ロジック

### 6-1. Zoho Job → BaseJob変換

**変換関数**:
```typescript
function convertZohoJobToBaseJob(zohoJob: ZohoJob): BaseJob {
  const workOrders = zohoJob.field_work_orders
    ? JSON.parse(zohoJob.field_work_orders).workOrders
    : [];
  
  return {
    jobId: zohoJob.id,
    serviceKind: zohoJob.serviceKind || "その他",
    serviceKinds: zohoJob.field_service_kinds || [zohoJob.serviceKind || "その他"],
    vehicle: {
      vehicleId: zohoJob.field6?.id || "",
      mileage: zohoJob.field10 || 0,
    },
    status: convertJobStageToStatus(zohoJob.field5),
    workOrders: workOrders.map(convertWorkOrder),
    baseSystemId: zohoJob.field_base_system_id,
    createdAt: new Date(zohoJob.field22),
    updatedAt: new Date(),
  };
}
```

### 6-2. BaseJob → Zoho Job変換

**変換関数**:
```typescript
function convertBaseJobToZohoJob(baseJob: BaseJob): Partial<ZohoJob> {
  return {
    field_service_kinds: baseJob.serviceKinds,
    field_work_orders: JSON.stringify({
      workOrders: baseJob.workOrders,
      totalCost: calculateTotalCost(baseJob.workOrders),
      baseSystemInvoiceId: baseJob.workOrders[0]?.baseSystemItemId,
    }),
    field_base_system_id: baseJob.baseSystemId,
    serviceKind: baseJob.serviceKind,
  };
}
```

---

## 7. データバリデーション

### 7-1. 共通バリデーション

**Jobバリデーション**:
```typescript
function validateJob(job: BaseJob): ValidationResult {
  const errors: string[] = [];
  
  if (!job.vehicle.vehicleId) {
    errors.push("車両IDは必須です");
  }
  
  if (job.vehicle.mileage < 0) {
    errors.push("走行距離は0以上である必要があります");
  }
  
  if (job.workOrders.length === 0) {
    errors.push("ワークオーダーは最低1つ必要です");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 7-2. 入庫区分別バリデーション

**車検バリデーション**:
```typescript
function validateVehicleInspectionWorkOrder(
  workOrder: VehicleInspectionWorkOrder
): ValidationResult {
  const errors: string[] = [];
  
  if (workOrder.diagnosis.inspectionResults.length === 0) {
    errors.push("検査項目は最低1つ必要です");
  }
  
  if (workOrder.estimate.legalFees <= 0) {
    errors.push("法定費用は0より大きい必要があります");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## 8. 更新履歴

- 2025-01-XX: 初版作成

---

## 9. 関連ドキュメント

- [統合仕様書](./INTEGRATED_SPECIFICATION.md)
- [API設計統一](./API_DESIGN_UNIFIED.md)
- [実装ガイド](./IMPLEMENTATION_GUIDE.md)

































