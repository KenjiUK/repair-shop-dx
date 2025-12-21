"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { compressImage, getImagePreviewUrl } from "@/lib/compress";
import { fetchJobById, saveDiagnosis, updateJobStatus, assignMechanic, fetchCustomerById, fetchAllCourtesyCars } from "@/lib/api";
import { uploadFile, getOrCreateWorkOrderFolder } from "@/lib/google-drive";
import { markChangeRequestCompleted } from "@/lib/customer-update";
import { getCurrentMechanicName } from "@/lib/auth";
import { MechanicSelectDialog } from "@/components/features/mechanic-select-dialog";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { DiagnosisStatus, ZohoJob } from "@/types";
import {
  Camera,
  Car,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Send,
  Loader2,
  AlertOctagon,
  MessageSquare,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { CompactJobHeader } from "@/components/layout/compact-job-header";
import { User, FileText } from "lucide-react";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ISO8601の日時文字列から時刻を抽出 (HH:MM形式)
 */
function formatTime(isoString: string): string {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

/**
 * ステータスバッジのスタイルを取得
 */
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case "入庫待ち":
    case "見積作成待ち":
    case "作業待ち":
      return "bg-red-50 text-red-700 border-red-200";
    case "入庫済み":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "見積提示済み":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "出庫済み":
      return "bg-gray-50 text-gray-500 border-gray-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}
import { InspectionDiagnosisView } from "@/components/features/inspection-diagnosis-view";
import { VideoData } from "@/components/features/video-capture-button";
import { VEHICLE_INSPECTION_ITEMS, InspectionItem } from "@/lib/inspection-items";
import { ServiceKind } from "@/types";
import { TrafficLightStatus } from "@/components/features/traffic-light-button";
import { PhotoData as PhotoDataType } from "@/components/features/photo-capture-button";
import { OBDDiagnosticResultSection, OBDDiagnosticResult } from "@/components/features/obd-diagnostic-result-section";
import { FaultDiagnosisView } from "@/components/features/fault-diagnosis-view";
import { Symptom, FaultDiagnosisData } from "@/lib/fault-diagnosis-types";
import { ErrorLampInfo } from "@/lib/error-lamp-types";
import { parseErrorLampInfoFromField7 } from "@/lib/error-lamp-parser";
import { AudioInputButton, AudioData } from "@/components/features/audio-input-button";
import { useWorkOrders, updateWorkOrder } from "@/hooks/use-work-orders";
import { WorkOrderSelector } from "@/components/features/work-order-selector";
import { AddWorkOrderDialog } from "@/components/features/add-work-order-dialog";
import { hasChangeRequests } from "@/lib/customer-description-append";
import { TireInspectionView } from "@/components/features/tire-inspection-view";
import {
  TireInspectionItem,
  getInitialTireInspectionItems,
  TireTreadDepth,
  TirePressure,
  RecommendedPressure,
} from "@/lib/tire-inspection-items";
import {
  EngineOilInspectionItem,
  getInitialEngineOilInspectionItems,
} from "@/lib/engine-oil-inspection-items";
import { EngineOilInspectionView } from "@/components/features/engine-oil-inspection-view";
import { MaintenanceMenuSelector } from "@/components/features/maintenance-menu-selector";
import {
  MaintenanceInspectionView,
  MaintenanceInspectionItemState,
  getInitialMaintenanceInspectionItems,
} from "@/components/features/maintenance-inspection-view";
import {
  MaintenanceType,
  getMaintenanceMenuConfig,
} from "@/lib/maintenance-menu-config";
import { TuningPartsTypeSelector } from "@/components/features/tuning-parts-type-selector";
import {
  TuningPartsInspectionView,
  TuningPartsInspectionItem,
  getInitialTuningPartsInspectionItems,
} from "@/components/features/tuning-parts-inspection-view";
import { TuningPartsType } from "@/lib/tuning-parts-config";
import {
  CoatingInspectionView,
  BodyConditionCheck,
  getInitialBodyConditionChecks,
  ExistingCoatingInfo,
} from "@/components/features/coating-inspection-view";
import {
  BodyPaintDiagnosisView,
  DamageLocation,
  createInitialDamageLocation,
  VendorEstimate,
} from "@/components/features/body-paint-diagnosis-view";
import { OrderMethod } from "@/lib/body-paint-config";
import {
  RestoreDiagnosisView,
  ConditionCheck,
  RestoreLocation,
  createInitialConditionCheck,
  createInitialRestoreLocation,
} from "@/components/features/restore-diagnosis-view";
import {
  OtherServiceDiagnosisView,
  CustomDiagnosisItem,
  createInitialCustomDiagnosisItem,
} from "@/components/features/other-service-diagnosis-view";

// =============================================================================
// Types
// =============================================================================

type PhotoPosition = "front" | "rear" | "left" | "right";

interface PhotoData {
  position: PhotoPosition;
  file: File | null;
  previewUrl: string | null;
  isCompressing: boolean;
}

interface CheckItem {
  id: string;
  name: string;
  category: string;
  status: DiagnosisStatus;
}

// =============================================================================
// SWR Fetcher
// =============================================================================

async function jobFetcher(jobId: string): Promise<ZohoJob> {
  const result = await fetchJobById(jobId);
  if (!result.success) {
    throw new Error(result.error?.message ?? "案件の取得に失敗しました");
  }
  return result.data!;
}

// =============================================================================
// Initial Data
// =============================================================================

const initialCheckItems: CheckItem[] = [
  { id: "tire-front", name: "タイヤ（前輪）", category: "足回り", status: "unchecked" },
  { id: "tire-rear", name: "タイヤ（後輪）", category: "足回り", status: "unchecked" },
  { id: "brake-pad", name: "ブレーキパッド", category: "ブレーキ", status: "unchecked" },
  { id: "brake-disc", name: "ブレーキディスク", category: "ブレーキ", status: "unchecked" },
  { id: "engine-oil", name: "エンジンオイル", category: "エンジン", status: "unchecked" },
  { id: "oil-filter", name: "オイルフィルター", category: "エンジン", status: "unchecked" },
  { id: "battery", name: "バッテリー", category: "電装", status: "unchecked" },
  { id: "wiper", name: "ワイパーゴム", category: "外装", status: "unchecked" },
  { id: "light", name: "ライト類", category: "電装", status: "unchecked" },
  { id: "coolant", name: "冷却水", category: "エンジン", status: "unchecked" },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 車両情報から表示用の車両名を抽出
 */
function extractVehicleName(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "車両未登録";
  // "BMW X3 / 品川 300 あ 1234" から "BMW X3" を抽出
  const parts = vehicleInfo.split(" / ");
  return parts[0] || vehicleInfo;
}

/**
 * 車両情報からナンバープレートを抽出
 */
function extractLicensePlate(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "";
  // "BMW X3 / 品川 300 あ 1234" から "品川 300 あ 1234" を抽出
  const parts = vehicleInfo.split(" / ");
  return parts[1] || "";
}

// =============================================================================
// Components
// =============================================================================

/**
 * 撮影ボタンコンポーネント
 */
function PhotoCaptureButton({
  position,
  label,
  photoData,
  onCapture,
  disabled,
}: {
  position: PhotoPosition;
  label: string;
  photoData: PhotoData;
  onCapture: (position: PhotoPosition, file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(position, file);
    }
    e.target.value = "";
  };

  const hasPhoto = !!photoData.previewUrl;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={photoData.isCompressing || disabled}
        className={cn(
          "w-full h-24 rounded-xl border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center gap-1",
          "active:scale-95",
          hasPhoto
            ? "border-green-500 bg-green-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
          (photoData.isCompressing || disabled) && "opacity-50 cursor-wait"
        )}
      >
        {photoData.isCompressing ? (
          <div className="flex flex-col items-center gap-1">
            <div className="animate-spin h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full" />
            <span className="text-xs text-slate-500">圧縮中...</span>
          </div>
        ) : hasPhoto ? (
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-green-700">{label}</span>
            <span className="text-xs text-green-600">撮影済み ✓</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Camera className="h-6 w-6 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">📸 {label}</span>
          </div>
        )}
      </button>

      {hasPhoto && (
        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-md">
          <img
            src={photoData.previewUrl!}
            alt={label}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

/**
 * 信号機ボタンコンポーネント
 */
function TrafficLightButton({
  status,
  currentStatus,
  onClick,
  disabled,
}: {
  status: DiagnosisStatus;
  currentStatus: DiagnosisStatus;
  onClick: () => void;
  disabled?: boolean;
}) {
  const isSelected = currentStatus === status;

  const config = {
    green: {
      icon: CheckCircle2,
      label: "OK",
      bgActive: "bg-green-500",
      bgInactive: "bg-green-100 hover:bg-green-200",
      textActive: "text-white",
      textInactive: "text-green-700",
    },
    yellow: {
      icon: AlertCircle,
      label: "注意",
      bgActive: "bg-yellow-500",
      bgInactive: "bg-yellow-100 hover:bg-yellow-200",
      textActive: "text-white",
      textInactive: "text-yellow-700",
    },
    red: {
      icon: XCircle,
      label: "要交換",
      bgActive: "bg-red-500",
      bgInactive: "bg-red-100 hover:bg-red-200",
      textActive: "text-white",
      textInactive: "text-red-700",
    },
    unchecked: {
      icon: AlertCircle,
      label: "",
      bgActive: "",
      bgInactive: "",
      textActive: "",
      textInactive: "",
    },
  };

  if (status === "unchecked") return null;

  const { icon: Icon, label, bgActive, bgInactive, textActive, textInactive } = config[status];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 h-12 rounded-lg transition-all active:scale-95",
        "flex items-center justify-center gap-1",
        isSelected ? bgActive : bgInactive,
        isSelected ? textActive : textInactive,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

/**
 * チェック項目コンポーネント
 */
function CheckItemRow({
  item,
  onStatusChange,
  disabled,
}: {
  item: CheckItem;
  onStatusChange: (id: string, status: DiagnosisStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">{item.name}</p>
        <p className="text-xs text-slate-500">{item.category}</p>
      </div>
      <div className="flex gap-1">
        <TrafficLightButton
          status="green"
          currentStatus={item.status}
          onClick={() => onStatusChange(item.id, "green")}
          disabled={disabled}
        />
        <TrafficLightButton
          status="yellow"
          currentStatus={item.status}
          onClick={() => onStatusChange(item.id, "yellow")}
          disabled={disabled}
        />
        <TrafficLightButton
          status="red"
          currentStatus={item.status}
          onClick={() => onStatusChange(item.id, "red")}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/**
 * ヘッダースケルトン
 */
function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <Skeleton className="h-4 w-32 mb-2" />
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-12 w-full mt-2" />
      </div>
    </header>
  );
}

/**
 * エラー表示
 */
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <AlertOctagon className="h-12 w-12 mx-auto text-red-500 mb-4 shrink-0" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">エラー</h2>
          <p className="text-slate-600 mb-4">{message}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link href="/">トップへ戻る</Link>
            </Button>
            <Button onClick={onRetry}>再試行</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function DiagnosisPage() {
  const router = useRouter();
  // Next.js 16対応: paramsをuseMemoでラップして列挙を防止
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = useMemo(() => (params?.id ?? "") as string, [params]);
  
  // URLパラメータからworkOrderIdを取得
  const workOrderId = useMemo(() => {
    const woId = searchParams?.get("workOrderId");
    return woId || null;
  }, [searchParams]);

  // SWRでジョブデータを取得
  const {
    data: job,
    error: jobError,
    isLoading: isJobLoading,
    mutate: mutateJob,
  } = useSWR(jobId ? `job-${jobId}` : null, () => jobFetcher(jobId), {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 0, // キャッシュを無効化
  });

  // ワークオーダーを取得
  const { workOrders, isLoading: isLoadingWorkOrders, mutate: mutateWorkOrders } = useWorkOrders(jobId);

  // 顧客情報を取得（変更申請チェック用）
  const customerId = job?.field4?.id;
  const { data: customerData } = useSWR(
    customerId ? `customer-${customerId}` : null,
    async () => {
      if (!customerId) return null;
      const result = await fetchCustomerById(customerId);
      return result.success ? result.data : null;
    }
  );
  
  // 代車情報を取得
  const {
    data: courtesyCarsResponse,
  } = useSWR("courtesy-cars", async () => {
    const result = await fetchAllCourtesyCars();
    return result.success ? result.data : [];
  });
  const courtesyCars = courtesyCarsResponse || [];
  
  // 変更申請があるかチェック
  const hasChangeRequest = customerData ? hasChangeRequests(customerData.Description) : false;
  
  // 変更対応完了処理中フラグ
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);
  
  /**
   * 変更対応完了処理
   */
  const handleMarkChangeRequestCompleted = async () => {
    if (!customerId || !customerData) return;

    setIsMarkingCompleted(true);
    try {
      const result = await markChangeRequestCompleted(customerId);
      if (result.success) {
        toast.success("変更申請を対応完了としてマークしました");
        // 顧客データを再取得（SWRキャッシュをクリア）
        window.location.reload();
      } else {
        toast.error("対応完了処理に失敗しました", {
          description: result.error?.message,
        });
      }
    } catch (error) {
      console.error("変更対応完了エラー:", error);
      toast.error("対応完了処理に失敗しました");
    } finally {
      setIsMarkingCompleted(false);
    }
  };

  // 選択中のワークオーダーを取得
  const selectedWorkOrder = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return null;
    if (workOrderId) {
      return workOrders.find((wo) => wo.id === workOrderId) || workOrders[0];
    }
    return workOrders[0]; // デフォルトは最初のワークオーダー
  }, [workOrders, workOrderId]);

  // サービス種類を判定
  const serviceKinds = useMemo(() => {
    if (!job) return [];
    return job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  }, [job]);

  const isInspection = useMemo(() => {
    return serviceKinds.includes("車検" as ServiceKind) || serviceKinds.includes("12ヵ月点検" as ServiceKind);
  }, [serviceKinds]);
  const is12MonthInspection = useMemo(() => {
    return serviceKinds.includes("12ヵ月点検" as ServiceKind);
  }, [serviceKinds]);
  const isEngineOilChange = useMemo(() => {
    return serviceKinds.includes("エンジンオイル交換" as ServiceKind);
  }, [serviceKinds]);
  const isTireReplacement = useMemo(() => {
    return serviceKinds.includes("タイヤ交換・ローテーション" as ServiceKind);
  }, [serviceKinds]);
  const isMaintenance = useMemo(() => {
    return serviceKinds.includes("その他のメンテナンス" as ServiceKind);
  }, [serviceKinds]);
  const isTuningParts = useMemo(() => {
    return (
      serviceKinds.includes("チューニング" as ServiceKind) ||
      serviceKinds.includes("パーツ取付" as ServiceKind)
    );
  }, [serviceKinds]);
  const isCoating = useMemo(() => {
    return serviceKinds.includes("コーティング" as ServiceKind);
  }, [serviceKinds]);
  const isBodyPaint = useMemo(() => {
    return serviceKinds.includes("板金・塗装" as ServiceKind);
  }, [serviceKinds]);
  const isRestore = useMemo(() => {
    return serviceKinds.includes("レストア" as ServiceKind);
  }, [serviceKinds]);
  const isOther = useMemo(() => {
    return serviceKinds.includes("その他" as ServiceKind);
  }, [serviceKinds]);
  const isFaultDiagnosis = useMemo(() => {
    return serviceKinds.includes("故障診断" as ServiceKind);
  }, [serviceKinds]);
  const isRepair = useMemo(() => {
    return serviceKinds.includes("修理・整備" as ServiceKind);
  }, [serviceKinds]);

  // 入庫区分に基づいてflowTypeを決定
  const flowType = useMemo(() => {
    if (isFaultDiagnosis) return "FAULT" as const;
    if (isRepair) return "REPAIR" as const;
    if (isInspection) return "INSPECTION" as const;
    if (isTuningParts) return "TUNING" as const;
    if (isCoating) return "COATING" as const;
    if (isBodyPaint) return "BODY_PAINT" as const;
    if (isRestore) return "RESTORE" as const;
    return "OTHER" as const;
  }, [isFaultDiagnosis, isRepair, isInspection, isTuningParts, isCoating, isBodyPaint, isRestore]);

  // エラーランプ情報をfield7から取得（故障診断の場合のみ）
  const errorLampInfo = useMemo(() => {
    if (!isFaultDiagnosis || !job?.field7) return undefined;
    return parseErrorLampInfoFromField7(job.field7);
  }, [isFaultDiagnosis, job?.field7]);

  // 作業追加ダイアログの状態管理
  const [isAddWorkOrderDialogOpen, setIsAddWorkOrderDialogOpen] = useState(false);

  // 写真データの状態管理
  const [photos, setPhotos] = useState<Record<PhotoPosition, PhotoData>>({
    front: { position: "front", file: null, previewUrl: null, isCompressing: false },
    rear: { position: "rear", file: null, previewUrl: null, isCompressing: false },
    left: { position: "left", file: null, previewUrl: null, isCompressing: false },
    right: { position: "right", file: null, previewUrl: null, isCompressing: false },
  });

  // チェックリストの状態管理
  const [checkItems, setCheckItems] = useState<CheckItem[]>(initialCheckItems);

  // 車検用の検査項目状態管理
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>(
    VEHICLE_INSPECTION_ITEMS.map((item) => ({
      ...item,
      status: item.status || "unchecked",
    }))
  );
  const [inspectionPhotoData, setInspectionPhotoData] = useState<
    Record<string, PhotoDataType>
  >({});
  const [inspectionVideoData, setInspectionVideoData] = useState<
    Record<string, VideoData>
  >({});

  // OBD診断結果の状態管理（12ヵ月点検の場合）
  const [obdDiagnosticResult, setObdDiagnosticResult] = useState<OBDDiagnosticResult | undefined>();

  // 診断機結果の状態管理（修理・整備の場合）
  const [repairDiagnosticToolResult, setRepairDiagnosticToolResult] = useState<OBDDiagnosticResult | undefined>();

  // エンジンオイル交換用の簡易検査項目の状態管理
  const [engineOilInspectionItems, setEngineOilInspectionItems] = useState<EngineOilInspectionItem[]>(
    getInitialEngineOilInspectionItems()
  );
  const [engineOilPhotoData, setEngineOilPhotoData] = useState<
    Record<string, PhotoDataType>
  >({});

  // タイヤ交換・ローテーション用の状態管理
  const [tireInspectionItems, setTireInspectionItems] = useState<TireInspectionItem[]>(
    getInitialTireInspectionItems()
  );
  const [tirePhotoData, setTirePhotoData] = useState<Record<string, PhotoDataType>>({});
  const [tireTreadDepth, setTireTreadDepth] = useState<TireTreadDepth>({
    frontLeft: null,
    frontRight: null,
    rearLeft: null,
    rearRight: null,
  });
  const [tirePressure, setTirePressure] = useState<TirePressure>({
    frontLeft: null,
    frontRight: null,
    rearLeft: null,
    rearRight: null,
  });
  const [recommendedPressure, setRecommendedPressure] = useState<RecommendedPressure>({
    front: null,
    rear: null,
  });

  // その他のメンテナンス用の状態管理
  const [selectedMaintenanceMenu, setSelectedMaintenanceMenu] = useState<MaintenanceType | null>(null);
  const [maintenanceInspectionItems, setMaintenanceInspectionItems] = useState<MaintenanceInspectionItemState[]>([]);
  const [maintenancePhotoData, setMaintenancePhotoData] = useState<Record<string, PhotoDataType>>({});
  const [maintenanceMeasurements, setMaintenanceMeasurements] = useState<Record<string, number | null>>({});

  // チューニング・パーツ取付用の状態管理
  const [selectedTuningPartsType, setSelectedTuningPartsType] = useState<"チューニング" | "パーツ取り付け" | null>(null);
  const [tuningPartsCustomDescription, setTuningPartsCustomDescription] = useState<string>("");
  const [tuningPartsInspectionItems, setTuningPartsInspectionItems] = useState<
    import("@/components/features/tuning-parts-inspection-view").TuningPartsInspectionItem[]
  >([]);
  const [tuningPartsPhotoData, setTuningPartsPhotoData] = useState<Record<string, PhotoDataType>>({});

  // コーティング用の状態管理
  const [coatingBodyConditions, setCoatingBodyConditions] = useState<BodyConditionCheck[]>(
    getInitialBodyConditionChecks()
  );
  const [coatingPhotoData, setCoatingPhotoData] = useState<Record<string, PhotoDataType>>({});
  const [coatingExistingCoating, setCoatingExistingCoating] = useState<ExistingCoatingInfo>({});

  // 板金・塗装用の状態管理
  const [bodyPaintDamageLocations, setBodyPaintDamageLocations] = useState<
    import("@/components/features/body-paint-diagnosis-view").DamageLocation[]
  >([]);
  const [bodyPaintPhotoData, setBodyPaintPhotoData] = useState<Record<string, PhotoDataType>>({});
  const [bodyPaintVideoData, setBodyPaintVideoData] = useState<Record<string, VideoData>>({});
  const [bodyPaintEstimateRequestMethod, setBodyPaintEstimateRequestMethod] = useState<
    import("@/lib/body-paint-config").OrderMethod | null
  >(null);
  const [bodyPaintVendorEstimate, setBodyPaintVendorEstimate] = useState<
    import("@/components/features/body-paint-diagnosis-view").VendorEstimate | null
  >(null);
  const [bodyPaintComments, setBodyPaintComments] = useState<string>("");

  // レストア用の状態管理
  const [restoreType, setRestoreType] = useState<
    import("@/lib/restore-config").RestoreType | null
  >(null);
  const [restoreConditionChecks, setRestoreConditionChecks] = useState<
    import("@/components/features/restore-diagnosis-view").ConditionCheck[]
  >([]);
  const [restoreLocations, setRestoreLocations] = useState<
    import("@/components/features/restore-diagnosis-view").RestoreLocation[]
  >([]);
  const [restorePhotoData, setRestorePhotoData] = useState<Record<string, PhotoDataType>>({});
  const [restoreComments, setRestoreComments] = useState<string>("");

  // その他用の状態管理
  const [otherDiagnosisItems, setOtherDiagnosisItems] = useState<
    import("@/components/features/other-service-diagnosis-view").CustomDiagnosisItem[]
  >([]);
  const [otherPhotoData, setOtherPhotoData] = useState<Record<string, PhotoDataType>>({});
  const [otherComments, setOtherComments] = useState<string>("");


  // 故障診断用の状態管理
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [faultDiagnosticToolResult, setFaultDiagnosticToolResult] = useState<OBDDiagnosticResult | undefined>();
  const [faultVideoDataMap, setFaultVideoDataMap] = useState<Record<string, VideoData>>({});
  const [faultAudioData, setFaultAudioData] = useState<AudioData | undefined>();
  const [faultNotes, setFaultNotes] = useState("");

  // 送信中フラグ
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 整備士選択モーダルの状態
  // 仕様書3-1, 3-2: 整備士が自分のスマホで案件を選んで診断画面を開いた時点で整備士を記録
  const [isMechanicDialogOpen, setIsMechanicDialogOpen] = useState(false);
  const [isAssigningMechanic, setIsAssigningMechanic] = useState(false);

  // 診断画面を開いた時点で、整備士を選択させる（仕様書3-1, 3-2参照）
  // 仕様書: 整備士が自分のスマホで案件を選んで診断画面を開いた時点で整備士を記録
  useEffect(() => {
    if (!job) return;
    
    // 既に割り当て済みならスキップ
    if (job.assignedMechanic) return;

    // 必ず選択ダイアログを表示（自動割り当てはしない）
    // 整備士名がlocalStorageに保存されている場合でも、毎回選択させる
    setIsMechanicDialogOpen(true);
  }, [job, jobId]);

  /**
   * 整備士選択時のハンドラ
   * 整備士を割り当てる（仕様書3-1, 3-2参照）
   */
  const handleMechanicSelect = async (mechanicName: string) => {
    if (!job) return;

    setIsAssigningMechanic(true);

    try {
      const result = await assignMechanic(jobId, mechanicName);

      if (result.success) {
        // 暫定: localStorageに保存（実際の認証システム実装時に削除）
        // ただし、診断画面での自動割り当てには使用しない
        // トップページでの整備士選択時のみ使用
        localStorage.setItem("currentMechanic", mechanicName);
        
        // SWRのキャッシュを更新
        await mutateJob();

        setIsMechanicDialogOpen(false);
      } else {
        toast.error("整備士の割り当てに失敗しました", {
          description: result.error?.message,
        });
      }
    } catch (error) {
      console.error("Mechanic assignment error:", error);
      toast.error("エラーが発生しました");
    } finally {
      setIsAssigningMechanic(false);
    }
  };

  /**
   * 整備士選択ダイアログを閉じる
   */
  const handleMechanicDialogClose = (open: boolean) => {
    if (isAssigningMechanic) return; // 処理中は閉じない
    setIsMechanicDialogOpen(open);
    // キャンセルされた場合、前のページに戻る
    if (!open && !job?.assignedMechanic) {
      router.push("/");
    }
  };

  /**
   * 写真撮影ハンドラ
   */
  const handlePhotoCapture = async (position: PhotoPosition, file: File) => {
    setPhotos((prev) => ({
      ...prev,
      [position]: { ...prev[position], isCompressing: true },
    }));

    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setPhotos((prev) => ({
        ...prev,
        [position]: {
          position,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      toast.success(`${position === "front" ? "前" : position === "rear" ? "後" : position === "left" ? "左" : "右"}の写真を撮影しました`);
    } catch (error) {
      console.error("写真処理エラー:", error);
      setPhotos((prev) => ({
        ...prev,
        [position]: { ...prev[position], isCompressing: false },
      }));
      toast.error("写真の処理に失敗しました");
    }
  };

  /**
   * チェック項目ステータス変更ハンドラ
   */
  const handleStatusChange = (itemId: string, status: DiagnosisStatus) => {
    setCheckItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status } : item
      )
    );
  };

  /**
   * 車検用：検査項目ステータス変更ハンドラ
   */
  const handleInspectionStatusChange = (
    itemId: string,
    status: TrafficLightStatus
  ) => {
    setInspectionItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status } : item
      )
    );
  };

  /**
   * 車検用：測定値変更ハンドラ
   */
  const handleInspectionMeasurementChange = (
    itemId: string,
    value: number
  ) => {
    setInspectionItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, measurementValue: value } : item
      )
    );
  };

  /**
   * 車検用：写真撮影ハンドラ
   */
  const handleInspectionPhotoCapture = async (
    itemId: string,
    file: File
  ) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setInspectionPhotoData((prev) => ({
        ...prev,
        [itemId]: {
          position: itemId,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      // 検査項目に写真URLを追加
      setInspectionItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                photoUrls: [...(item.photoUrls || []), previewUrl],
              }
            : item
        )
      );

      toast.success("写真を撮影しました");
    } catch (error) {
      console.error("写真処理エラー:", error);
      toast.error("写真の処理に失敗しました");
    }
  };

  /**
   * 車検用：動画撮影ハンドラ
   */
  const handleInspectionVideoCapture = async (
    itemId: string,
    file: File
  ) => {
    try {
      // 動画のプレビューURLを生成（簡易実装）
      const previewUrl = URL.createObjectURL(file);

      setInspectionVideoData((prev) => ({
        ...prev,
        [itemId]: {
          position: itemId,
          file,
          previewUrl,
          isProcessing: false,
        },
      }));

      // 検査項目に動画URLを追加
      setInspectionItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, videoUrl: previewUrl } : item
        )
      );

      toast.success("動画を撮影しました");
    } catch (error) {
      console.error("動画処理エラー:", error);
      toast.error("動画の処理に失敗しました");
    }
  };

  /**
   * 車検用：コメント変更ハンドラ
   */
  const handleInspectionCommentChange = (itemId: string, comment: string) => {
    setInspectionItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, comment } : item
      )
    );
  };

  /**
   * 12ヵ月点検用：OBD診断結果PDFアップロードハンドラ
   */
  const handleOBDDiagnosticUpload = async (file: File) => {
    if (!job || !selectedWorkOrder?.id) {
      toast.error("ジョブ情報またはワークオーダー情報が不足しています");
      return;
    }

    try {
      // 顧客情報と車両情報を取得
      const customerId = (job.field4 as any)?.ID1 || (job.field4 as any)?.id || "";
      const customerName = (job.field4 as any)?.Last_Name || (job.field4 as any)?.name || "顧客";
      const vehicleId = (job.field6 as any)?.Name || (job.field6 as any)?.id || "";
      const vehicleName = (job.field6 as any)?.Name || "車両";
      const jobDate = job.field22 ? new Date(job.field22).toISOString().split("T")[0].replace(/-/g, "") : new Date().toISOString().split("T")[0].replace(/-/g, "");

      // ワークオーダーフォルダを取得または作成
      const workOrderFolder = await getOrCreateWorkOrderFolder(
        customerId,
        customerName,
        vehicleId,
        vehicleName,
        jobId,
        jobDate,
        selectedWorkOrder.id
      );

      // PDFファイルをアップロード
      const uploadedFile = await uploadFile({
        fileName: `obd-diagnostic-${Date.now()}.pdf`,
        mimeType: "application/pdf",
        fileData: file,
        parentFolderId: workOrderFolder.id,
      });

      setObdDiagnosticResult({
        fileId: uploadedFile.id,
        fileName: file.name,
        fileUrl: uploadedFile.webViewLink || uploadedFile.webContentLink || "",
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
      });

      toast.success("OBD診断結果PDFをアップロードしました");
    } catch (error) {
      console.error("OBD診断結果アップロードエラー:", error);
      toast.error("アップロードに失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
      throw error;
    }
  };

  /**
   * 12ヵ月点検用：OBD診断結果削除ハンドラ
   */
  const handleOBDDiagnosticRemove = () => {
    setObdDiagnosticResult(undefined);
    toast.success("OBD診断結果を削除しました");
  };

  /**
   * 修理・整備用：診断機結果PDFアップロードハンドラ
   */
  const handleRepairDiagnosticToolUpload = async (file: File) => {
    if (!job || !selectedWorkOrder?.id) {
      toast.error("ジョブ情報またはワークオーダー情報が不足しています");
      return;
    }

    try {
      // 顧客情報と車両情報を取得
      const customerId = (job.field4 as any)?.ID1 || (job.field4 as any)?.id || "";
      const customerName = (job.field4 as any)?.Last_Name || (job.field4 as any)?.name || "顧客";
      const vehicleId = (job.field6 as any)?.Name || (job.field6 as any)?.id || "";
      const vehicleName = (job.field6 as any)?.Name || "車両";
      const jobDate = job.field22 ? new Date(job.field22).toISOString().split("T")[0].replace(/-/g, "") : new Date().toISOString().split("T")[0].replace(/-/g, "");

      // ワークオーダーフォルダを取得または作成
      const workOrderFolder = await getOrCreateWorkOrderFolder(
        customerId,
        customerName,
        vehicleId,
        vehicleName,
        jobId,
        jobDate,
        selectedWorkOrder.id
      );

      // PDFファイルをアップロード
      const uploadedFile = await uploadFile({
        fileName: `repair-diagnostic-${Date.now()}.pdf`,
        mimeType: "application/pdf",
        fileData: file,
        parentFolderId: workOrderFolder.id,
      });

      setRepairDiagnosticToolResult({
        fileId: uploadedFile.id,
        fileName: file.name,
        fileUrl: uploadedFile.webViewLink || uploadedFile.webContentLink || "",
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
      });

      toast.success("診断機結果PDFをアップロードしました");
    } catch (error) {
      console.error("診断機結果アップロードエラー:", error);
      toast.error("アップロードに失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
      throw error;
    }
  };

  /**
   * 修理・整備用：診断機結果削除ハンドラ
   */
  const handleRepairDiagnosticToolRemove = () => {
    setRepairDiagnosticToolResult(undefined);
    toast.success("診断機結果を削除しました");
  };

  /**
   * エンジンオイル交換用：状態変更ハンドラ
   */
  const handleEngineOilStatusChange = (itemId: string, status: EngineOilInspectionItem["status"]) => {
    setEngineOilInspectionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  /**
   * エンジンオイル交換用：写真撮影ハンドラ
   */
  const handleEngineOilPhotoCapture = async (itemId: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setEngineOilPhotoData((prev) => ({
        ...prev,
        [itemId]: {
          position: itemId,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      setEngineOilInspectionItems((prev) =>
        prev.map((item) => ({
          ...item,
          photoUrls: item.id === itemId ? [previewUrl] : item.photoUrls,
        }))
      );

      toast.success("写真を撮影しました");
    } catch (error) {
      console.error("写真処理エラー:", error);
      toast.error("写真の処理に失敗しました");
    }
  };

  /**
   * エンジンオイル交換用：コメント変更ハンドラ
   */
  const handleEngineOilCommentChange = (itemId: string, comment: string) => {
    setEngineOilInspectionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, comment } : item))
    );
  };

  /**
   * タイヤ交換・ローテーション用：状態変更ハンドラ
   */
  const handleTireStatusChange = (itemId: string, status: TireInspectionItem["status"]) => {
    setTireInspectionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  /**
   * タイヤ交換・ローテーション用：写真撮影ハンドラ
   */
  const handleTirePhotoCapture = async (itemId: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setTirePhotoData((prev) => ({
        ...prev,
        [itemId]: {
          position: itemId,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      setTireInspectionItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                photoUrls: [...(item.photoUrls || []), previewUrl],
              }
            : item
        )
      );

      toast.success("写真を撮影しました", {
        description: `${(compressedFile.size / 1024).toFixed(0)}KB に圧縮済み`,
      });
    } catch (error) {
      console.error("写真撮影エラー:", error);
      toast.error("写真の撮影に失敗しました");
    }
  };

  /**
   * タイヤ交換・ローテーション用：コメント変更ハンドラ
   */
  const handleTireCommentChange = (itemId: string, comment: string) => {
    setTireInspectionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, comment } : item))
    );
  };

  /**
   * その他のメンテナンス用：メニュー選択変更ハンドラ
   */
  const handleMaintenanceMenuChange = (menu: MaintenanceType | null) => {
    setSelectedMaintenanceMenu(menu);
    if (menu) {
      const menuConfig = getMaintenanceMenuConfig(menu);
      if (menuConfig) {
        setMaintenanceInspectionItems(getInitialMaintenanceInspectionItems(menuConfig));
        setMaintenanceMeasurements({});
      }
    } else {
      setMaintenanceInspectionItems([]);
      setMaintenanceMeasurements({});
    }
  };

  /**
   * その他のメンテナンス用：状態変更ハンドラ
   */
  const handleMaintenanceStatusChange = (itemId: string, status: MaintenanceInspectionItemState["status"]) => {
    setMaintenanceInspectionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  /**
   * その他のメンテナンス用：写真撮影ハンドラ
   */
  const handleMaintenancePhotoCapture = async (itemId: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setMaintenancePhotoData((prev) => ({
        ...prev,
        [itemId]: {
          position: itemId,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      setMaintenanceInspectionItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                photoUrls: [...(item.photoUrls || []), previewUrl],
              }
            : item
        )
      );

      toast.success("写真を撮影しました", {
        description: `${(compressedFile.size / 1024).toFixed(0)}KB に圧縮済み`,
      });
    } catch (error) {
      console.error("写真撮影エラー:", error);
      toast.error("写真の撮影に失敗しました");
    }
  };

  /**
   * その他のメンテナンス用：コメント変更ハンドラ
   */
  const handleMaintenanceCommentChange = (itemId: string, comment: string) => {
    setMaintenanceInspectionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, comment } : item))
    );
  };

  /**
   * チューニング・パーツ取付用：種類選択変更ハンドラ
   */
  const handleTuningPartsTypeChange = (type: TuningPartsType | null) => {
    setSelectedTuningPartsType(type);
    if (type) {
      setTuningPartsInspectionItems(
        getInitialTuningPartsInspectionItems(type, tuningPartsCustomDescription)
      );
    } else {
      setTuningPartsInspectionItems([]);
    }
  };

  /**
   * チューニング・パーツ取付用：カスタム内容変更ハンドラ
   */
  const handleTuningPartsCustomDescriptionChange = (description: string) => {
    setTuningPartsCustomDescription(description);
    // カスタム内容が変更されたら、検査項目を再生成
    if (selectedTuningPartsType) {
      setTuningPartsInspectionItems(
        getInitialTuningPartsInspectionItems(selectedTuningPartsType, description)
      );
    }
  };

  /**
   * チューニング・パーツ取付用：状態変更ハンドラ
   */
  const handleTuningPartsStatusChange = (
    itemId: string,
    status: TuningPartsInspectionItem["status"]
  ) => {
    setTuningPartsInspectionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  /**
   * チューニング・パーツ取付用：写真撮影ハンドラ
   */
  const handleTuningPartsPhotoCapture = async (itemId: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setTuningPartsPhotoData((prev) => ({
        ...prev,
        [itemId]: {
          position: itemId,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      setTuningPartsInspectionItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                photoUrls: [...(item.photoUrls || []), previewUrl],
              }
            : item
        )
      );

      toast.success("写真を撮影しました", {
        description: `${(compressedFile.size / 1024).toFixed(0)}KB に圧縮済み`,
      });
    } catch (error) {
      console.error("写真撮影エラー:", error);
      toast.error("写真の撮影に失敗しました");
    }
  };

  /**
   * チューニング・パーツ取付用：コメント変更ハンドラ
   */
  const handleTuningPartsCommentChange = (itemId: string, comment: string) => {
    setTuningPartsInspectionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, comment } : item))
    );
  };

  /**
   * コーティング用：車体状態変更ハンドラ
   */
  const handleCoatingBodyConditionChange = (
    itemId: string,
    condition: BodyConditionCheck["condition"]
  ) => {
    setCoatingBodyConditions((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, condition } : item))
    );
  };

  /**
   * コーティング用：写真撮影ハンドラ
   */
  const handleCoatingPhotoCapture = async (itemId: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setCoatingPhotoData((prev) => ({
        ...prev,
        [itemId]: {
          position: itemId,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      // 車体状態確認項目の写真URLを更新
      if (itemId !== "existing-coating") {
        setCoatingBodyConditions((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  photoUrls: [...(item.photoUrls || []), previewUrl],
                }
              : item
          )
        );
      } else {
        // 既存コーティングの写真URLを更新
        setCoatingExistingCoating((prev) => ({
          ...prev,
          photoUrls: [...(prev.photoUrls || []), previewUrl],
        }));
      }

      toast.success("写真を撮影しました", {
        description: `${(compressedFile.size / 1024).toFixed(0)}KB に圧縮済み`,
      });
    } catch (error) {
      console.error("写真撮影エラー:", error);
      toast.error("写真の撮影に失敗しました");
    }
  };

  /**
   * コーティング用：コメント変更ハンドラ
   */
  const handleCoatingCommentChange = (itemId: string, comment: string) => {
    setCoatingBodyConditions((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, comment } : item))
    );
  };

  /**
   * 板金・塗装用：損傷箇所追加ハンドラ
   */
  const handleBodyPaintAddDamageLocation = () => {
    const newLocation = createInitialDamageLocation();
    setBodyPaintDamageLocations((prev) => [...prev, newLocation]);
  };

  /**
   * 板金・塗装用：損傷箇所削除ハンドラ
   */
  const handleBodyPaintRemoveDamageLocation = (id: string) => {
    setBodyPaintDamageLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  /**
   * 板金・塗装用：損傷箇所変更ハンドラ
   */
  const handleBodyPaintDamageLocationChange = (
    id: string,
    location: Partial<DamageLocation>
  ) => {
    setBodyPaintDamageLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, ...location } : loc))
    );
  };

  /**
   * 板金・塗装用：写真撮影ハンドラ
   */
  const handleBodyPaintPhotoCapture = async (locationId: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setBodyPaintPhotoData((prev) => ({
        ...prev,
        [locationId]: {
          position: locationId,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      setBodyPaintDamageLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId
            ? {
                ...loc,
                photoUrls: [...(loc.photoUrls || []), previewUrl],
              }
            : loc
        )
      );

      toast.success("写真を撮影しました");
    } catch (error) {
      console.error("写真撮影エラー:", error);
      toast.error("写真の撮影に失敗しました");
    }
  };

  /**
   * 板金・塗装用：動画撮影ハンドラ
   */
  const handleBodyPaintVideoCapture = async (locationId: string, file: File) => {
    try {
      const previewUrl = URL.createObjectURL(file);

      setBodyPaintVideoData((prev) => ({
        ...prev,
        [locationId]: {
          position: locationId,
          file,
          previewUrl,
          isProcessing: false,
        },
      }));

      setBodyPaintDamageLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId
            ? {
                ...loc,
                videoUrl: previewUrl,
              }
            : loc
        )
      );

      toast.success("動画を撮影しました");
    } catch (error) {
      console.error("動画撮影エラー:", error);
      toast.error("動画の撮影に失敗しました");
    }
  };

  /**
   * レストア用：現状確認結果追加ハンドラ
   */
  const handleRestoreAddConditionCheck = () => {
    const newCheck = createInitialConditionCheck();
    setRestoreConditionChecks((prev) => [...prev, newCheck]);
  };

  /**
   * レストア用：現状確認結果削除ハンドラ
   */
  const handleRestoreRemoveConditionCheck = (id: string) => {
    setRestoreConditionChecks((prev) => prev.filter((check) => check.id !== id));
  };

  /**
   * レストア用：現状確認結果変更ハンドラ
   */
  const handleRestoreConditionCheckChange = (
    id: string,
    check: Partial<ConditionCheck>
  ) => {
    setRestoreConditionChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...check } : c))
    );
  };

  /**
   * レストア用：修復箇所追加ハンドラ
   */
  const handleRestoreAddRestoreLocation = () => {
    const newLocation = createInitialRestoreLocation();
    setRestoreLocations((prev) => [...prev, newLocation]);
  };

  /**
   * レストア用：修復箇所削除ハンドラ
   */
  const handleRestoreRemoveRestoreLocation = (id: string) => {
    setRestoreLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  /**
   * レストア用：修復箇所変更ハンドラ
   */
  const handleRestoreRestoreLocationChange = (
    id: string,
    location: Partial<RestoreLocation>
  ) => {
    setRestoreLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, ...location } : loc))
    );
  };

  /**
   * レストア用：写真撮影ハンドラ
   */
  const handleRestorePhotoCapture = async (itemId: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setRestorePhotoData((prev) => ({
        ...prev,
        [itemId]: {
          position: itemId,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      // 現状確認結果または修復箇所の写真URLを更新
      const conditionCheck = restoreConditionChecks.find((c) => c.id === itemId);
      if (conditionCheck) {
        setRestoreConditionChecks((prev) =>
          prev.map((c) =>
            c.id === itemId
              ? {
                  ...c,
                  photoUrls: [...(c.photoUrls || []), previewUrl],
                }
              : c
          )
        );
      } else {
        const restoreLocation = restoreLocations.find((loc) => loc.id === itemId);
        if (restoreLocation) {
          setRestoreLocations((prev) =>
            prev.map((loc) =>
              loc.id === itemId
                ? {
                    ...loc,
                    photoUrls: [...(loc.photoUrls || []), previewUrl],
                  }
                : loc
            )
          );
        }
      }

      toast.success("写真を撮影しました");
    } catch (error) {
      console.error("写真撮影エラー:", error);
      toast.error("写真の撮影に失敗しました");
    }
  };

  /**
   * その他用：診断項目追加ハンドラ
   */
  const handleOtherAddDiagnosisItem = () => {
    const newItem = createInitialCustomDiagnosisItem();
    setOtherDiagnosisItems((prev) => [...prev, newItem]);
  };

  /**
   * その他用：診断項目削除ハンドラ
   */
  const handleOtherRemoveDiagnosisItem = (id: string) => {
    setOtherDiagnosisItems((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * その他用：診断項目変更ハンドラ
   */
  const handleOtherDiagnosisItemChange = (
    id: string,
    item: Partial<CustomDiagnosisItem>
  ) => {
    setOtherDiagnosisItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...item } : i))
    );
  };

  /**
   * その他用：写真撮影ハンドラ
   */
  const handleOtherPhotoCapture = async (itemId: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setOtherPhotoData((prev) => ({
        ...prev,
        [itemId]: {
          position: itemId,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      setOtherDiagnosisItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                photoUrls: [...(item.photoUrls || []), previewUrl],
              }
            : item
        )
      );

      toast.success("写真を撮影しました");
    } catch (error) {
      console.error("写真撮影エラー:", error);
      toast.error("写真の撮影に失敗しました");
    }
  };

  /**
   * 故障診断用：診断機結果PDFアップロードハンドラ
   */
  const handleFaultDiagnosticToolUpload = async (file: File) => {
    if (!job || !selectedWorkOrder?.id) {
      toast.error("ジョブ情報またはワークオーダー情報が不足しています");
      return;
    }

    try {
      // 顧客情報と車両情報を取得
      const customerId = (job.field4 as any)?.ID1 || (job.field4 as any)?.id || "";
      const customerName = (job.field4 as any)?.Last_Name || (job.field4 as any)?.name || "顧客";
      const vehicleId = (job.field6 as any)?.Name || (job.field6 as any)?.id || "";
      const vehicleName = (job.field6 as any)?.Name || "車両";
      const jobDate = job.field22 ? new Date(job.field22).toISOString().split("T")[0].replace(/-/g, "") : new Date().toISOString().split("T")[0].replace(/-/g, "");

      // ワークオーダーフォルダを取得または作成
      const workOrderFolder = await getOrCreateWorkOrderFolder(
        customerId,
        customerName,
        vehicleId,
        vehicleName,
        jobId,
        jobDate,
        selectedWorkOrder.id
      );

      // PDFファイルをアップロード
      const uploadedFile = await uploadFile({
        fileName: `fault-diagnostic-${Date.now()}.pdf`,
        mimeType: "application/pdf",
        fileData: file,
        parentFolderId: workOrderFolder.id,
      });

      setFaultDiagnosticToolResult({
        fileId: uploadedFile.id,
        fileName: file.name,
        fileUrl: uploadedFile.webViewLink || uploadedFile.webContentLink || "",
        uploadedAt: new Date().toISOString(),
        status: "uploaded",
      });

      toast.success("診断機結果PDFをアップロードしました");
    } catch (error) {
      console.error("診断機結果アップロードエラー:", error);
      toast.error("アップロードに失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
      throw error;
    }
  };

  /**
   * 故障診断用：診断機結果削除ハンドラ
   */
  const handleFaultDiagnosticToolRemove = () => {
    setFaultDiagnosticToolResult(undefined);
    toast.success("診断機結果を削除しました");
  };

  /**
   * 故障診断用：診断機結果変更ハンドラ（OBDDiagnosticResultSection用）
   */
  const handleFaultDiagnosticToolChange = (result: OBDDiagnosticResult | undefined) => {
    setFaultDiagnosticToolResult(result);
  };

  /**
   * 故障診断用：動画撮影ハンドラ
   */
  const handleFaultVideoCapture = async (position: string, file: File) => {
    try {
      const previewUrl = URL.createObjectURL(file);

      setFaultVideoDataMap((prev) => ({
        ...prev,
        [position]: {
          position,
          file,
          previewUrl,
          isProcessing: false,
        },
      }));

      toast.success("動画を撮影しました");
    } catch (error) {
      console.error("動画処理エラー:", error);
      toast.error("動画の処理に失敗しました");
    }
  };

  /**
   * 故障診断用：音声録音ハンドラ
   */
  const handleFaultAudioCapture = async (audioBlob: Blob) => {
    try {
      // BlobをFileに変換
      const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: audioBlob.type });
      const audioUrl = URL.createObjectURL(audioBlob);

      setFaultAudioData({
        position: "fault",
        file: audioBlob,
        audioUrl,
        isProcessing: false,
      });

      toast.success("音声を録音しました");
    } catch (error) {
      console.error("音声処理エラー:", error);
      toast.error("音声の処理に失敗しました");
    }
  };

  /**
   * 故障診断用：音声削除ハンドラ
   */
  const handleFaultAudioRemove = () => {
    setFaultAudioData(undefined);
    toast.success("音声を削除しました");
  };

  /**
   * 診断完了ハンドラ
   */
  const handleComplete = async () => {
    if (!job) return;

    setIsSubmitting(true);

    try {
      // サービス種類は既にコンポーネントレベルで定義済み

      // 写真データを整形
      const photoData = Object.values(photos)
        .filter((p) => p.file)
        .map((p) => ({
          position: p.position,
          url: p.previewUrl || "", // 実際はアップロード後のURLになる
        }));

      // 診断データを整形
      let diagnosisData;
      
      if (isInspection) {
        // 車検・12ヵ月点検用の診断データ
        diagnosisData = {
          items: inspectionItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            status: (item.status === "adjust" || item.status === "clean" || item.status === "skip" || item.status === "not_applicable")
              ? "unchecked" as DiagnosisStatus
              : item.status as DiagnosisStatus,
            comment: item.comment || null,
            measurementValue: item.measurementValue,
            evidencePhotoUrls: item.photoUrls || [],
            evidenceVideoUrl: item.videoUrl || null,
          })),
          photos: photoData,
        };
      } else if (isEngineOilChange) {
        // エンジンオイル交換用の診断データ
        diagnosisData = {
          items: engineOilInspectionItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: "engine_oil",
            status: (item.status === "ok" ? "green" : item.status === "attention" ? "yellow" : item.status === "replace" ? "red" : "unchecked") as DiagnosisStatus,
            comment: item.comment || null,
            evidencePhotoUrls: item.photoUrls || [],
            evidenceVideoUrl: null,
          })),
          photos: photoData,
        };
      } else if (isTireReplacement) {
        // タイヤ交換・ローテーション用の診断データ
        diagnosisData = {
          items: tireInspectionItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            status: (item.status === "ok" ? "green" : item.status === "attention" ? "yellow" : item.status === "replace" ? "red" : "unchecked") as DiagnosisStatus,
            comment: item.comment || null,
            evidencePhotoUrls: item.photoUrls || [],
            evidenceVideoUrl: null,
            measurementValue: item.category === "tire" && item.id === "tire-1"
              ? JSON.stringify(tireTreadDepth)
              : item.category === "pressure" && item.id === "pressure-1"
              ? JSON.stringify(tirePressure)
              : null,
          })),
          photos: photoData,
        };
      } else if (isMaintenance) {
        // その他のメンテナンス用の診断データ
        if (!selectedMaintenanceMenu) {
          toast.error("メンテナンスメニューを選択してください");
          setIsSubmitting(false);
          return;
        }
        diagnosisData = {
          items: maintenanceInspectionItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            status: (item.status === "ok" ? "green" : item.status === "attention" ? "yellow" : item.status === "replace" ? "red" : "unchecked") as DiagnosisStatus,
            comment: item.comment || null,
            evidencePhotoUrls: item.photoUrls || [],
            evidenceVideoUrl: null,
            measurementValue: Object.keys(maintenanceMeasurements).length > 0
              ? JSON.stringify(maintenanceMeasurements)
              : null,
          })),
          photos: photoData,
        };
      } else if (isTuningParts) {
        // チューニング・パーツ取付用の診断データ
        if (!selectedTuningPartsType) {
          toast.error("種類を選択してください");
          setIsSubmitting(false);
          return;
        }
        diagnosisData = {
          items: tuningPartsInspectionItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            status: (item.status === "ok" ? "green" : item.status === "attention" ? "yellow" : item.status === "replace" ? "red" : "unchecked") as DiagnosisStatus,
            comment: item.comment || null,
            evidencePhotoUrls: item.photoUrls || [],
            evidenceVideoUrl: null,
          })),
          photos: photoData,
        };
      } else if (isCoating) {
        // コーティング用の診断データ
        diagnosisData = {
          items: coatingBodyConditions.map((item) => ({
            id: item.id,
            name: item.location,
            category: "body_condition",
            status: (item.condition === "良好" ? "green" : item.condition === "軽微な傷" || item.condition === "汚れあり" ? "yellow" : item.condition === "深刻な傷" ? "red" : "unchecked") as DiagnosisStatus,
            comment: item.comment || null,
            evidencePhotoUrls: item.photoUrls || [],
            evidenceVideoUrl: null,
          })),
          photos: photoData,
        };
      } else if (isBodyPaint) {
        // 板金・塗装用の診断データ
        if (bodyPaintDamageLocations.length === 0) {
          toast.error("損傷箇所を1つ以上追加してください");
          setIsSubmitting(false);
          return;
        }
        diagnosisData = {
          items: bodyPaintDamageLocations.map((damage) => ({
            id: damage.id,
            name: `${damage.location} - ${damage.type} - ${damage.severity}`,
            category: "damage",
            status: (damage.severity === "軽微" ? "yellow" : damage.severity === "中程度" ? "orange" : "red") as DiagnosisStatus,
            comment: damage.comment || null,
            evidencePhotoUrls: damage.photoUrls || [],
            evidenceVideoUrl: damage.videoUrl || null,
          })),
          photos: photoData,
        };
      } else if (isRestore) {
        // レストア用の診断データ
        if (!restoreType) {
          toast.error("レストアの種類を選択してください");
          setIsSubmitting(false);
          return;
        }
        if (restoreLocations.length === 0) {
          toast.error("修復箇所を1つ以上追加してください");
          setIsSubmitting(false);
          return;
        }
        diagnosisData = {
          items: [
            ...restoreConditionChecks.map((check) => ({
              id: check.id,
              name: `${check.location} - ${check.condition}`,
              category: "condition",
              status: (check.condition === "良好" ? "green" : check.condition === "軽微な劣化" ? "yellow" : check.condition === "中程度の劣化" ? "orange" : "red") as DiagnosisStatus,
              comment: check.comment || null,
              evidencePhotoUrls: check.photoUrls || [],
              evidenceVideoUrl: null,
            })),
            ...restoreLocations.map((location) => ({
              id: location.id,
              name: `${location.location} - ${location.restoreType} - ${location.severity}`,
              category: "restore",
              status: (location.severity === "軽微" ? "yellow" : location.severity === "中程度" ? "orange" : "red") as DiagnosisStatus,
              comment: location.comment || null,
              evidencePhotoUrls: location.photoUrls || [],
              evidenceVideoUrl: null,
            })),
          ],
          photos: photoData,
        };
      } else if (isOther) {
        // その他用の診断データ
        diagnosisData = {
          items: otherDiagnosisItems.map((item) => ({
            id: item.id,
            name: item.name || "未入力",
            category: "custom",
            status: (item.condition ? "yellow" : "unchecked") as DiagnosisStatus,
            comment: item.comment || null,
            evidencePhotoUrls: item.photoUrls || [],
            evidenceVideoUrl: null,
          })),
          photos: photoData,
        };
      } else if (isFaultDiagnosis) {
        // 故障診断用の診断データ
        // エラーランプ情報は受付時に保存されているため、ここでは参照のみ
        diagnosisData = {
          items: selectedSymptoms.map((symptom) => ({
            id: symptom.id,
            name: symptom.name,
            category: symptom.category,
            status: "red" as DiagnosisStatus, // 症状は基本的に「要対応」
            comment: null,
            evidencePhotoUrls: [],
            evidenceVideoUrl: null,
          })),
          photos: photoData,
        };
      } else {
        // その他の診断用の診断データ（既存のロジック）
        diagnosisData = {
          items: checkItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            status: item.status,
            comment: null,
            evidencePhotoUrls: [],
            evidenceVideoUrl: null,
          })),
          photos: photoData,
        };
      }

      // ハプティックフィードバック（診断完了時）
      triggerHapticFeedback("medium");

      // 診断結果を保存（workOrderIdを含める）
      if (selectedWorkOrder?.id) {
        // 複数作業管理対応：診断データを選択中のワークオーダーに保存
        const updateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
          diagnosis: diagnosisData,
          status: "見積作成待ち",
        });
        
        if (!updateResult.success) {
          throw new Error(updateResult.error?.message || "診断の保存に失敗しました");
        }
        
        // ワークオーダーリストを再取得
        await mutateWorkOrders();
      } else {
        // 単一作業の場合：既存のsaveDiagnosisを使用
        const saveResult = await saveDiagnosis(jobId, {
          items: diagnosisData.items || [],
          photos: diagnosisData.photos,
          mileage: job.field10 || undefined,
        });
        
        if (!saveResult.success) {
          throw new Error(saveResult.error?.message || "診断の保存に失敗しました");
        }
        
        // ステータスを更新
        const statusResult = await updateJobStatus(jobId, "見積作成待ち");
        
        if (!statusResult.success) {
          throw new Error(statusResult.error?.message || "ステータスの更新に失敗しました");
        }
      }
      // 複数作業管理の場合、Job全体のステータスは更新しない（各ワークオーダーのステータスで管理）
      // ただし、すべてのワークオーダーが「見積作成待ち」以上になった場合は、Job全体のステータスも更新
      // 更新後のワークオーダーリストを取得して確認（mutateWorkOrdersで再取得済み）

      // 診断完了のLINE通知を送信
      try {
        const customer = await fetchCustomerById(job.field4?.id || "");
        if (customer.success && customer.data?.lineUserId) {
          const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
          const serviceKind = serviceKinds.length > 0 ? serviceKinds[0] : "その他";
          
          await sendLineNotification({
            lineUserId: customer.data.lineUserId,
            type: "diagnosis_complete",
            jobId,
            data: {
              customerName: job.field4?.name || "お客様",
              vehicleName: job.field6?.name || "車両",
              licensePlate: job.field6?.name ? job.field6.name.split(" / ")[1] || undefined : undefined,
              serviceKind,
            },
          });
        }
      } catch (error) {
        console.warn("LINE通知送信エラー（診断完了）:", error);
        // LINE通知の失敗は診断完了処理を止めない
      }

      // 成功
      triggerHapticFeedback("success"); // 成功時のハプティックフィードバック
      toast.success("診断完了", {
        description: "フロントへ送信しました",
      });

      // トップページへ遷移
      router.push("/");
    } catch (error) {
      console.error("診断完了エラー:", error);
      triggerHapticFeedback("error"); // エラー時のハプティックフィードバック
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "診断の送信に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // エラー状態
  if (jobError) {
    return (
      <ErrorDisplay
        message={jobError.message || "案件が見つかりません"}
        onRetry={() => mutateJob()}
      />
    );
  }

  // ローディング状態
  if (isJobLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <HeaderSkeleton />
        <main className="max-w-2xl mx-auto px-4 py-4 pb-32">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-12 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // データがない場合
  if (!job) {
    return (
      <ErrorDisplay
        message="案件が見つかりません"
        onRetry={() => mutateJob()}
      />
    );
  }

  // 車両情報を抽出
  const vehicleName = extractVehicleName(job.field6?.name);
  const licensePlate = extractLicensePlate(job.field6?.name);
  const tagId = job.tagId || "---";
  const details = job.field7 || job.details;
  const workOrder = job.field || job.workOrder;
  
  // ヘッダー表示用の変数
  const customerName = job.field4?.name || "未登録";
  
  // 現在の作業名を取得（選択中のワークオーダーから、またはserviceKindsから）
  const currentWorkOrderName = selectedWorkOrder?.serviceKind || (serviceKinds.length > 0 ? serviceKinds[0] : "診断");
  
  const diagnosisTitle = isInspection
    ? "車検診断"
    : isEngineOilChange
    ? "エンジンオイル交換診断"
    : isTireReplacement
    ? "タイヤ交換・ローテーション診断"
    : isMaintenance
    ? "その他のメンテナンス診断"
    : isTuningParts
    ? "チューニング・パーツ取付診断"
    : isCoating
    ? "コーティング診断"
    : isBodyPaint
    ? "板金・塗装診断"
    : isRestore
    ? "レストア診断"
    : isOther
    ? "その他診断"
    : isFaultDiagnosis
    ? "故障診断"
    : isRepair
    ? "修理・整備診断"
    : "診断";
  
  const serviceLabel = serviceKinds.length > 0 ? serviceKinds.join("、") : undefined;

  /**
   * ワークオーダー選択変更ハンドラ
   */
  const handleWorkOrderSelect = (woId: string | null) => {
    if (!woId) return;
    // URLパラメータを更新してワークオーダーを切り替え
    const url = new URL(window.location.href);
    url.searchParams.set("workOrderId", woId);
    router.push(url.pathname + url.search);
  };

  /**
   * 作業追加成功時のハンドラ
   */
  const handleAddWorkOrderSuccess = () => {
    mutateWorkOrders();
    mutateJob();
  };

  // 統計情報
  const photoCount = Object.values(photos).filter((p) => p.file).length;
  const checkedCount = checkItems.filter((item) => item.status !== "unchecked").length;
  const redCount = checkItems.filter((item) => item.status === "red").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <AppHeader maxWidthClassName="max-w-2xl">
        {/* ページタイトル */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-slate-600 shrink-0" />
            {diagnosisTitle}
          </h1>
        </div>
        
        {/* 案件情報（JobCardの情報階層に基づく） */}
        <CompactJobHeader
          job={job}
          customerName={customerName}
          vehicleName={vehicleName}
          licensePlate={licensePlate}
          tagId={tagId !== "---" ? tagId : undefined}
          serviceKind={serviceKinds.length > 0 ? serviceKinds[0] : undefined}
          currentWorkOrderName={currentWorkOrderName}
          assignedMechanic={job.assignedMechanic}
          backHref="/"
          courtesyCars={courtesyCars}
        />
        
        {/* アラート表示 */}
        {details && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-2 text-sm text-blue-700 flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="h-3 w-3 text-white shrink-0" />
            </div>
            <span className="break-words">{details}</span>
          </div>
        )}
        {/* 変更申請ありアイコン（Phase 3: マスタデータ同期） */}
        {hasChangeRequest && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
                  <Bell className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-medium text-amber-700">変更申請あり</span>
              </div>
              <Button
                onClick={handleMarkChangeRequestCompleted}
                disabled={isMarkingCompleted}
                variant="outline"
                size="sm"
                className="h-7 text-xs bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                {isMarkingCompleted ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin shrink-0" />
                    処理中...
                  </>
                ) : (
                  "対応完了"
                )}
              </Button>
            </div>
            <p className="text-xs text-amber-700">
              顧客情報の変更申請があります。対応完了後、基幹システムを更新してください。
            </p>
          </div>
        )}
        {workOrder && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-2 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4 inline mr-1 shrink-0" />
            <span className="break-words">{workOrder}</span>
          </div>
        )}
      </AppHeader>

      {/* ワークオーダー選択UI（複数作業がある場合のみ表示） */}
      {workOrders && workOrders.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mb-4">
          <WorkOrderSelector
            workOrders={workOrders}
            selectedWorkOrderId={selectedWorkOrder?.id || null}
            onSelect={handleWorkOrderSelect}
            onAddWorkOrder={() => setIsAddWorkOrderDialogOpen(true)}
            showAddButton={true}
          />
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {/* 撮影セクション */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Camera className="h-5 w-5 shrink-0" />
                外観撮影
              </span>
              <Badge variant={photoCount === 4 ? "default" : "secondary"} className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {photoCount}/4
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <PhotoCaptureButton
                position="front"
                label="前"
                photoData={photos.front}
                onCapture={handlePhotoCapture}
                disabled={isSubmitting}
              />
              <PhotoCaptureButton
                position="rear"
                label="後"
                photoData={photos.rear}
                onCapture={handlePhotoCapture}
                disabled={isSubmitting}
              />
              <PhotoCaptureButton
                position="left"
                label="左"
                photoData={photos.left}
                onCapture={handlePhotoCapture}
                disabled={isSubmitting}
              />
              <PhotoCaptureButton
                position="right"
                label="右"
                photoData={photos.right}
                onCapture={handlePhotoCapture}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* OBD診断結果セクション（12ヵ月点検の場合のみ） */}
        {is12MonthInspection && (
          <OBDDiagnosticResultSection
            result={obdDiagnosticResult}
            onUpload={handleOBDDiagnosticUpload}
            onRemove={handleOBDDiagnosticRemove}
            disabled={isSubmitting}
            className="mb-4"
          />
        )}

        {/* 診断機結果セクション（修理・整備の場合のみ） */}
        {isRepair && (
          <OBDDiagnosticResultSection
            result={repairDiagnosticToolResult}
            onUpload={handleRepairDiagnosticToolUpload}
            onRemove={handleRepairDiagnosticToolRemove}
            disabled={isSubmitting}
            className="mb-4"
          />
        )}

        {/* 診断チェックリスト */}
        {isInspection ? (
          <InspectionDiagnosisView
            items={inspectionItems}
            onStatusChange={handleInspectionStatusChange}
            onMeasurementChange={handleInspectionMeasurementChange}
            onPhotoCapture={handleInspectionPhotoCapture}
            onVideoCapture={handleInspectionVideoCapture}
            onCommentChange={handleInspectionCommentChange}
            photoDataMap={inspectionPhotoData}
            videoDataMap={inspectionVideoData}
            disabled={isSubmitting}
          />
        ) : isEngineOilChange ? (
          <EngineOilInspectionView
            items={engineOilInspectionItems}
            onStatusChange={handleEngineOilStatusChange}
            onPhotoCapture={handleEngineOilPhotoCapture}
            onCommentChange={handleEngineOilCommentChange}
            photoDataMap={engineOilPhotoData}
            disabled={isSubmitting}
          />
        ) : isTireReplacement ? (
          <TireInspectionView
            items={tireInspectionItems}
            onStatusChange={handleTireStatusChange}
            onPhotoCapture={handleTirePhotoCapture}
            onCommentChange={handleTireCommentChange}
            photoDataMap={tirePhotoData}
            treadDepth={tireTreadDepth}
            onTreadDepthChange={setTireTreadDepth}
            pressure={tirePressure}
            onPressureChange={setTirePressure}
            recommendedPressure={recommendedPressure}
            disabled={isSubmitting}
          />
        ) : isMaintenance ? (
          <div className="space-y-4">
            <MaintenanceMenuSelector
              selectedMenu={selectedMaintenanceMenu}
              onMenuChange={handleMaintenanceMenuChange}
              disabled={isSubmitting}
              required={true}
            />
            <MaintenanceInspectionView
              selectedMenu={selectedMaintenanceMenu}
              inspectionItems={maintenanceInspectionItems}
              onStatusChange={handleMaintenanceStatusChange}
              onPhotoCapture={handleMaintenancePhotoCapture}
              onCommentChange={handleMaintenanceCommentChange}
              photoDataMap={maintenancePhotoData}
              measurements={maintenanceMeasurements}
              onMeasurementChange={(fieldId, value) => {
                setMaintenanceMeasurements((prev) => ({
                  ...prev,
                  [fieldId]: value,
                }));
              }}
              disabled={isSubmitting}
            />
          </div>
        ) : isTuningParts ? (
          <div className="space-y-4">
            <TuningPartsTypeSelector
              selectedType={selectedTuningPartsType}
              onTypeChange={handleTuningPartsTypeChange}
              disabled={isSubmitting}
              required={true}
            />
            <TuningPartsInspectionView
              selectedType={selectedTuningPartsType}
              customDescription={tuningPartsCustomDescription}
              onCustomDescriptionChange={handleTuningPartsCustomDescriptionChange}
              inspectionItems={tuningPartsInspectionItems}
              onStatusChange={handleTuningPartsStatusChange}
              onPhotoCapture={handleTuningPartsPhotoCapture}
              onCommentChange={handleTuningPartsCommentChange}
              photoDataMap={tuningPartsPhotoData}
              disabled={isSubmitting}
            />
          </div>
        ) : isCoating ? (
          <CoatingInspectionView
            bodyConditions={coatingBodyConditions}
            onBodyConditionChange={handleCoatingBodyConditionChange}
            onPhotoCapture={handleCoatingPhotoCapture}
            onCommentChange={handleCoatingCommentChange}
            photoDataMap={coatingPhotoData}
            existingCoating={coatingExistingCoating}
            onExistingCoatingChange={setCoatingExistingCoating}
            disabled={isSubmitting}
          />
        ) : isBodyPaint ? (
          <BodyPaintDiagnosisView
            damageLocations={bodyPaintDamageLocations}
            onAddDamageLocation={handleBodyPaintAddDamageLocation}
            onRemoveDamageLocation={handleBodyPaintRemoveDamageLocation}
            onDamageLocationChange={handleBodyPaintDamageLocationChange}
            onPhotoCapture={handleBodyPaintPhotoCapture}
            onVideoCapture={handleBodyPaintVideoCapture}
            photoDataMap={bodyPaintPhotoData}
            videoDataMap={bodyPaintVideoData}
            estimateRequestMethod={bodyPaintEstimateRequestMethod}
            onEstimateRequestMethodChange={setBodyPaintEstimateRequestMethod}
            vendorEstimate={bodyPaintVendorEstimate}
            onVendorEstimateChange={setBodyPaintVendorEstimate}
            comments={bodyPaintComments}
            onCommentsChange={setBodyPaintComments}
            disabled={isSubmitting}
          />
        ) : isRestore ? (
          <RestoreDiagnosisView
            restoreType={restoreType}
            onRestoreTypeChange={setRestoreType}
            conditionChecks={restoreConditionChecks}
            onAddConditionCheck={handleRestoreAddConditionCheck}
            onRemoveConditionCheck={handleRestoreRemoveConditionCheck}
            onConditionCheckChange={handleRestoreConditionCheckChange}
            restoreLocations={restoreLocations}
            onAddRestoreLocation={handleRestoreAddRestoreLocation}
            onRemoveRestoreLocation={handleRestoreRemoveRestoreLocation}
            onRestoreLocationChange={handleRestoreRestoreLocationChange}
            onPhotoCapture={handleRestorePhotoCapture}
            photoDataMap={restorePhotoData}
            comments={restoreComments}
            onCommentsChange={setRestoreComments}
            disabled={isSubmitting}
          />
        ) : isOther ? (
          <OtherServiceDiagnosisView
            diagnosisItems={otherDiagnosisItems}
            onAddDiagnosisItem={handleOtherAddDiagnosisItem}
            onRemoveDiagnosisItem={handleOtherRemoveDiagnosisItem}
            onDiagnosisItemChange={handleOtherDiagnosisItemChange}
            onPhotoCapture={handleOtherPhotoCapture}
            photoDataMap={otherPhotoData}
            comments={otherComments}
            onCommentsChange={setOtherComments}
            disabled={isSubmitting}
          />
        ) : isFaultDiagnosis ? (
          <FaultDiagnosisView
            selectedSymptoms={selectedSymptoms}
            onSymptomChange={setSelectedSymptoms}
            diagnosticToolResult={faultDiagnosticToolResult}
            onDiagnosticToolChange={handleFaultDiagnosticToolChange}
            videoDataMap={faultVideoDataMap}
            onVideoCapture={handleFaultVideoCapture}
            audioData={faultAudioData}
            onAudioCapture={handleFaultAudioCapture}
            onAudioRemove={handleFaultAudioRemove}
            errorLampInfo={errorLampInfo}
            notes={faultNotes}
            onNotesChange={setFaultNotes}
            disabled={isSubmitting}
          />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
                <span>🔍 診断チェックリスト</span>
                <div className="flex gap-2">
                  {redCount > 0 && (
                    <Badge variant="destructive" className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">{redCount}件 要交換</Badge>
                  )}
                  <Badge variant={checkedCount === checkItems.length ? "default" : "secondary"} className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                    {checkedCount}/{checkItems.length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {checkItems.map((item) => (
                  <CheckItemRow
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* 完了ボタン（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleComplete}
            size="lg"
            className="w-full h-12 text-base font-semibold gap-2 bg-orange-600 hover:bg-orange-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 shrink-0" />
                診断完了（フロントへ送信）
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 整備士選択ダイアログ（診断画面を開いた時点で表示） */}
      <MechanicSelectDialog
        open={isMechanicDialogOpen}
        onOpenChange={handleMechanicDialogClose}
        isLoading={false}
        isProcessing={isAssigningMechanic}
        onSelect={handleMechanicSelect}
      />

      {/* 作業追加ダイアログ */}
      <AddWorkOrderDialog
        open={isAddWorkOrderDialogOpen}
        onOpenChange={setIsAddWorkOrderDialogOpen}
        job={job}
        existingServiceKinds={workOrders?.map((wo) => wo.serviceKind as ServiceKind) || serviceKinds}
        onSuccess={handleAddWorkOrderSuccess}
      />
    </div>
  );
}
