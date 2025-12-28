"use client";

// Note: クライアントコンポーネントはデフォルトで動的レンダリングされるため、force-dynamicは不要

import { useState, useRef, useEffect, useMemo, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import useSWR, { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { compressImage, getImagePreviewUrl } from "@/lib/compress";
import Image from "next/image";
import { fetchJobById, saveDiagnosis, updateJobStatus, assignMechanic, fetchCustomerById, fetchAllCourtesyCars, updateJobField7, updateJobField10 } from "@/lib/api";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { saveToIndexedDB, addToSyncQueue, STORE_NAMES } from "@/lib/offline-storage";
import { uploadFile, getOrCreateWorkOrderFolder } from "@/lib/google-drive";
import { getCurrentMechanicName } from "@/lib/auth";
import { setNavigationHistory, getPageTypeFromPath, saveCurrentPath } from "@/lib/navigation-history";
import { PhotoManager, PhotoItem } from "@/components/features/photo-manager";
import { ConflictResolutionDialog } from "@/components/features/conflict-resolution-dialog";

// ダイアログコンポーネントを動的インポート（コード分割）
const MechanicSelectDialog = dynamic(
  () => import("@/components/features/mechanic-select-dialog").then(mod => ({ default: mod.MechanicSelectDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const DiagnosisFeeDialog = dynamic(
  () => import("@/components/features/diagnosis-fee-dialog").then(mod => ({ default: mod.DiagnosisFeeDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const TemporaryReturnDialog = dynamic(
  () => import("@/components/features/temporary-return-dialog").then(mod => ({ default: mod.TemporaryReturnDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const JobMemoDialog = dynamic(
  () => import("@/components/features/job-memo-dialog").then(mod => ({ default: mod.JobMemoDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const DiagnosisPreviewDialog = dynamic(
  () => import("@/components/features/diagnosis-preview-dialog").then(mod => ({ default: mod.DiagnosisPreviewDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

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
  Notebook,
  NotebookPen,
  Eye,
  Search,
  Home,
  Calendar,
  Clock,
  Calculator,
  ChevronDown,
  ChevronUp,
  Gauge,
  Lightbulb,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { CompactJobHeader } from "@/components/layout/compact-job-header";
import { OfflineBanner, OnlineBanner } from "@/components/features/offline-banner";
import { User, FileText, Printer, Activity } from "lucide-react";
import { generateWorkOrderPDF, createWorkOrderPDFDataFromJob } from "@/lib/work-order-pdf-generator";

// 24ヶ月点検（車検）用コンポーネント
import { InspectionRedesignTabs } from "@/components/features/inspection-redesign-tabs";
import { InspectionBottomSheetList } from "@/components/features/inspection-bottom-sheet-list";
import { OBDDiagnosticUnifiedSection, OBDDiagnosticResult as OBDDiagnosticResultUnified } from "@/components/features/obd-diagnostic-unified-section";
import { InspectionQualityCheckSection } from "@/components/features/inspection-quality-check-section";
import { DiagnosisAdditionalEstimateSection } from "@/components/features/diagnosis-additional-estimate-section";
import { Textarea } from "@/components/ui/textarea";
import { getInspectionItems, getInspectionCategories } from "@/lib/inspection-items-redesign";
import {
  InspectionItemRedesign,
  InspectionStatus as InspectionStatusRedesign,
  InspectionCategory12Month,
  InspectionCategory24Month,
  InspectionMeasurements,
  InspectionParts,
  INSPECTION_CATEGORY_12MONTH_LABELS,
  INSPECTION_CATEGORY_24MONTH_LABELS,
} from "@/types/inspection-redesign";
import { QualityCheckData } from "@/types/inspection-quality-check";
import { CustomPartItem } from "@/types/inspection-parts-custom";
import { EstimateLineItem, EstimatePriority } from "@/types";

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
/**
 * ステータスバッジのスタイルを取得
 * セマンティックカラーシステムに基づく統一ルール
 */
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case "入庫待ち":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "入庫済み":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "見積作成待ち":
      return "bg-indigo-50 text-indigo-600 border-indigo-300";
    case "見積提示済み":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "作業待ち":
      return "bg-orange-50 text-orange-700 border-orange-300";
    case "出庫待ち":
      return "bg-green-50 text-green-700 border-green-300";
    case "出庫済み":
      return "bg-slate-50 text-slate-700 border-slate-300";
    case "部品調達待ち":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "部品発注待ち":
      return "bg-orange-50 text-orange-700 border-orange-300";
    case "入庫済み":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "見積提示済み":
      return "bg-amber-50 text-amber-900 border-amber-300"; // yellow → amber, text-amber-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
    case "出庫済み":
      return "bg-slate-50 text-slate-700 border-slate-300"; // text-slate-600 → text-slate-700, border-slate-200 → border-slate-300 (40歳以上ユーザー向け、コントラスト向上)
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
import { EnhancedOBDDiagnosticSection } from "@/components/features/enhanced-obd-diagnostic-section";
import { EnhancedOBDDiagnosticResult, RestoreProgress, QualityInspection, ManufacturerInquiry } from "@/types";
import { RestoreProgressSection } from "@/components/features/restore-progress-section";
import { QualityInspectionSection } from "@/components/features/quality-inspection-section";
import { ManufacturerInquirySection } from "@/components/features/manufacturer-inquiry-section";
import { FaultDiagnosisView } from "@/components/features/fault-diagnosis-view";
import { Symptom, FaultDiagnosisData } from "@/lib/fault-diagnosis-types";
import { ErrorLampInfo } from "@/lib/error-lamp-types";
import { parseErrorLampInfoFromField7 } from "@/lib/error-lamp-parser";
import { appendTemporaryReturnInfoToField7, parseTemporaryReturnInfoFromField7 } from "@/lib/temporary-return-parser";
import { parseJobMemosFromField26 } from "@/lib/job-memo-parser";
import { AudioInputButton, AudioData } from "@/components/features/audio-input-button";
import { useWorkOrders, updateWorkOrder } from "@/hooks/use-work-orders";
import { WorkOrderSelector } from "@/components/features/work-order-selector";
import { AddWorkOrderDialog } from "@/components/features/add-work-order-dialog";
import { useAutoSave } from "@/hooks/use-auto-save";
import { SaveStatusIndicator } from "@/components/features/save-status-indicator";
import { TireInspectionView } from "@/components/features/tire-inspection-view";
import { usePageTiming } from "@/hooks/use-page-timing";
import { useDirtyCheck } from "@/lib/dirty-check";
import { withFetcherTiming } from "@/lib/api-timing";
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

// 写真撮影位置の定義（名称統一）
type PhotoPosition =
  | "front"        // 前（外観）
  | "rear"         // 後（外観）
  | "left"         // 左（外観）
  | "right"        // 右（外観）
  | "engine"       // エンジンルーム
  | "interior"     // 室内・内装
  | "undercarriage" // 下回り・足回り
  | "dashboard"    // ダッシュボード
  | "damage";      // 損傷箇所

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

/**
 * ジョブ取得フェッチャー（API応答時間計測付き）
 */
const jobFetcherWithTiming = (jobId: string) =>
  withFetcherTiming(() => jobFetcher(jobId), "fetchJobById", "diagnosis");

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
            : "border-slate-300 bg-slate-50 hover:border-slate-500 hover:bg-slate-100",
          (photoData.isCompressing || disabled) && "opacity-50 cursor-wait"
        )}
      >
        {photoData.isCompressing ? (
          <div className="flex flex-col items-center gap-1">
            <div className="animate-spin h-6 w-6 border-2 border-slate-500 border-t-transparent rounded-full" />
            <span className="text-base text-slate-700">圧縮中...</span>
          </div>
        ) : hasPhoto ? (
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-6 w-6 text-green-700" />
            <span className="text-base font-medium text-green-800">{label}</span>
            <span className="text-base text-green-700">撮影済み ✓</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Camera className="h-6 w-6 text-slate-700" />
            <span className="text-base font-medium text-slate-800">{label}</span>
          </div>
        )}
      </button>

      {hasPhoto && (
        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-md">
          <Image
            src={photoData.previewUrl!}
            alt={label}
            fill
            className="object-cover"
            sizes="48px"
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
      bgActive: "bg-amber-500", // yellow → amber (40歳以上ユーザー向け、統一)
      bgInactive: "bg-amber-100 hover:bg-amber-200", // yellow → amber
      textActive: "text-white",
      textInactive: "text-amber-900", // text-yellow-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
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
      aria-label={label || `${status}を選択`}
      aria-pressed={isSelected}
    >
      <Icon className="h-5 w-5 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
      <span className="text-base font-medium">{label}</span>
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
    <div id={`diagnosis-item-${item.id}`} className="flex items-center gap-2 sm:gap-3 py-3" role="row" aria-label={`診断項目: ${item.name}`}>
      <div className="flex-1 min-w-0" role="gridcell">
        <p className="text-base font-medium text-slate-800 truncate">{item.name}</p>
        <p className="text-base text-slate-700">{item.category}</p>
      </div>
      <div className="flex gap-1" role="group" aria-label={`${item.name}の状態を選択`}>
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
 * 実際のAppHeaderのレイアウトに合わせて構造を統一
 */
function HeaderSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[40] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="mb-2">
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </header>
  );
}

/**
 * エラー表示
 */
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" role="alert">
        <CardContent className="py-8 text-center">
          <AlertOctagon className="h-12 w-12 mx-auto text-red-600 mb-4 shrink-0" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">エラー</h2>
          <p className="text-slate-700 mb-4">{message}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link href="/" aria-label="トップページへ戻る">トップへ戻る</Link>
            </Button>
            <Button onClick={onRetry} aria-label="再試行">再試行</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

function DiagnosisPageContent() {
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

  // ページ表示時間の計測
  usePageTiming("diagnosis", true);

  // SWRでジョブデータを取得（API応答時間を計測）
  const {
    data: job,
    error: jobError,
    isLoading: isJobLoading,
    mutate: mutateJob,
  } = useSWR(jobId ? `job-${jobId}` : null, jobId ? jobFetcherWithTiming(jobId) : null, {
    // グローバル設定を使用（swrGlobalConfig）
    // 初回アクセス時は必ずデータを取得する
    revalidateOnMount: true,
    // その他の設定はグローバル設定を継承
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
    },
    {
      // グローバル設定を使用（swrGlobalConfig）
      // 顧客情報は頻繁に変更されないため、キャッシュを活用
      revalidateOnMount: false, // キャッシュがあれば再検証しない
      // その他の設定はグローバル設定を継承
    }
  );

  // 代車情報を取得（グローバルキャッシュを活用）
  const {
    data: courtesyCarsResponse,
  } = useSWR("courtesy-cars", async () => {
    const result = await fetchAllCourtesyCars();
    return result.success ? result.data : [];
  }, {
    // グローバル設定を使用（swrGlobalConfig）
    // 代車情報は頻繁に変更されないため、キャッシュを活用
    revalidateOnMount: false, // キャッシュがあれば再検証しない
    // その他の設定はグローバル設定を継承
  });
  const courtesyCars = courtesyCarsResponse || [];

  // オンライン状態を監視
  const isOnline = useOnlineStatus();

  // 常連顧客かどうか（簡易判定：顧客データが存在する場合は常連とみなす）
  const isRegularCustomer = !!customerData;

  // PDF生成中フラグ
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  /**
   * 作業指示書PDF出力
   */
  const handlePrintWorkOrder = async () => {
    if (!job) return;

    setIsGeneratingPDF(true);
    triggerHapticFeedback("medium");

    try {
      // 代車情報を取得（配列チェックを追加）
      const courtesyCar = Array.isArray(courtesyCars) ? courtesyCars.find(car => car.jobId === job.id) : undefined;

      // ジョブ情報からPDFデータを生成（新しい情報を含める）
      const pdfData = await createWorkOrderPDFDataFromJob({
        ...job,
        field10: job.field10 || null,
        tagId: job.tagId || null,
        field13: job.field13 || null,
        courtesyCar: courtesyCar ? {
          name: courtesyCar.name,
          licensePlate: courtesyCar.licensePlate || undefined,
        } : null,
      });
      if (!pdfData) {
        toast.error("PDFデータの生成に失敗しました");
        return;
      }

      // PDFを生成
      const result = await generateWorkOrderPDF(pdfData);
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || "PDF生成に失敗しました");
      }

      // PDFをプレビュー表示（新しいタブで開く）
      const url = URL.createObjectURL(result.data);
      window.open(url, "_blank");
      
      // URLは自動的にクリーンアップされる（ブラウザがタブを閉じた時）
      // 念のため、少し遅延してからrevoke（タブが開くのを待つ）
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      triggerHapticFeedback("success");
      toast.success("作業指示書PDFをプレビュー表示しました");
    } catch (error) {
      console.error("PDF生成エラー:", error);
      triggerHapticFeedback("error");
      toast.error("PDF生成に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
    } finally {
      setIsGeneratingPDF(false);
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

  // 選択中のワークオーダーのサービス種類を優先（複数作業管理の場合）
  const primaryServiceKind = useMemo(() => {
    if (selectedWorkOrder?.serviceKind) {
      return selectedWorkOrder.serviceKind as ServiceKind;
    }
    // ワークオーダーがない場合、serviceKindsの最初のものを使用
    return serviceKinds.length > 0 ? (serviceKinds[0] as ServiceKind) : undefined;
  }, [selectedWorkOrder, serviceKinds]);


  const isInspection = useMemo(() => {
    // 選択中のワークオーダーのサービス種類を優先
    if (primaryServiceKind) {
      return primaryServiceKind === "車検" || primaryServiceKind === "12ヵ月点検";
    }
    // フォールバック：serviceKindsから判定
    return serviceKinds.includes("車検" as ServiceKind) || serviceKinds.includes("12ヵ月点検" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const is12MonthInspection = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "12ヵ月点検";
    }
    return serviceKinds.includes("12ヵ月点検" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  
  // 24ヶ月点検（車検）フラグ
  const is24MonthInspection = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "車検";
    }
    return serviceKinds.includes("車検" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  
  const isEngineOilChange = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "エンジンオイル交換";
    }
    return serviceKinds.includes("エンジンオイル交換" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isTireReplacement = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "タイヤ交換・ローテーション";
    }
    return serviceKinds.includes("タイヤ交換・ローテーション" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isMaintenance = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "その他のメンテナンス";
    }
    return serviceKinds.includes("その他のメンテナンス" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isTuningParts = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "チューニング" || primaryServiceKind === "パーツ取付";
    }
    return (
      serviceKinds.includes("チューニング" as ServiceKind) ||
      serviceKinds.includes("パーツ取付" as ServiceKind)
    );
  }, [primaryServiceKind, serviceKinds]);
  const isCoating = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "コーティング";
    }
    return serviceKinds.includes("コーティング" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isBodyPaint = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "板金・塗装";
    }
    return serviceKinds.includes("板金・塗装" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isRestore = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "レストア";
    }
    return serviceKinds.includes("レストア" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isOther = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "その他";
    }
    return serviceKinds.includes("その他" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isFaultDiagnosis = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "故障診断";
    }
    return serviceKinds.includes("故障診断" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isRepair = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "修理・整備";
    }
    return serviceKinds.includes("修理・整備" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);

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

  // 写真位置のラベル定義（名称統一）
  const photoPositionLabels: Record<PhotoPosition, string> = {
    front: "前（外観）",
    rear: "後（外観）",
    left: "左（外観）",
    right: "右（外観）",
    engine: "エンジンルーム",
    interior: "室内・内装",
    undercarriage: "下回り・足回り",
    dashboard: "ダッシュボード",
    damage: "損傷箇所",
  };

  // 写真データの状態管理（全位置を初期化）
  const [photos, setPhotos] = useState<Record<PhotoPosition, PhotoData>>({
    front: { position: "front", file: null, previewUrl: null, isCompressing: false },
    rear: { position: "rear", file: null, previewUrl: null, isCompressing: false },
    left: { position: "left", file: null, previewUrl: null, isCompressing: false },
    right: { position: "right", file: null, previewUrl: null, isCompressing: false },
    engine: { position: "engine", file: null, previewUrl: null, isCompressing: false },
    interior: { position: "interior", file: null, previewUrl: null, isCompressing: false },
    undercarriage: { position: "undercarriage", file: null, previewUrl: null, isCompressing: false },
    dashboard: { position: "dashboard", file: null, previewUrl: null, isCompressing: false },
    damage: { position: "damage", file: null, previewUrl: null, isCompressing: false },
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

  // 拡張OBD診断結果の状態管理（改善提案 #4）
  const [enhancedOBDDiagnosticResult, setEnhancedOBDDiagnosticResult] = useState<EnhancedOBDDiagnosticResult | null>(null);

  // =============================================================================
  // 24ヶ月点検（車検）リデザイン版の状態管理
  // =============================================================================
  const [inspectionItemsRedesign, setInspectionItemsRedesign] = useState<InspectionItemRedesign[]>(() =>
    getInspectionItems("24month")
  );
  const [activeInspectionCategory, setActiveInspectionCategory] = useState<
    InspectionCategory12Month | InspectionCategory24Month | undefined
  >(undefined);
  const [inspectionMeasurements, setInspectionMeasurements] = useState<InspectionMeasurements>({});
  const [inspectionPartsData, setInspectionPartsData] = useState<InspectionParts>({});
  const [customPartsData, setCustomPartsData] = useState<CustomPartItem[]>([]);
  const [obdPdfResult, setObdPdfResult] = useState<OBDDiagnosticResult | undefined>();
  const [qualityCheckData, setQualityCheckData] = useState<QualityCheckData | null>(null);
  const [workMemo, setWorkMemo] = useState<string>("");
  const [maintenanceAdvice, setMaintenanceAdvice] = useState<string>("");
  
  // 追加見積項目の状態管理（必須整備・推奨整備・任意整備）
  const [additionalEstimateRequired, setAdditionalEstimateRequired] = useState<EstimateLineItem[]>([]);
  const [additionalEstimateRecommended, setAdditionalEstimateRecommended] = useState<EstimateLineItem[]>([]);
  const [additionalEstimateOptional, setAdditionalEstimateOptional] = useState<EstimateLineItem[]>([]);

  // レストア作業進捗の状態管理（改善提案 #4）
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null);

  // 品質管理・最終検査の状態管理（改善提案 #4）
  const [qualityInspection, setQualityInspection] = useState<QualityInspection | null>(null);

  // メーカー問い合わせの状態管理（改善提案 #4）
  const [manufacturerInquiry, setManufacturerInquiry] = useState<ManufacturerInquiry | null>(null);

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

  // 走行距離の状態管理
  const [mileage, setMileage] = useState<number | null>(null);
  const [isUpdatingMileage, setIsUpdatingMileage] = useState(false);

  // 故障診断用の状態管理
  const [selectedSymptoms, setSelectedSymptoms] = useState<Symptom[]>([]);
  const [faultDiagnosticToolResult, setFaultDiagnosticToolResult] = useState<OBDDiagnosticResult | undefined>();
  const [faultVideoDataMap, setFaultVideoDataMap] = useState<Record<string, VideoData>>({});
  const [faultAudioData, setFaultAudioData] = useState<AudioData | undefined>();
  const [faultNotes, setFaultNotes] = useState("");

  // 送信中フラグ
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<{ currentVersion: number; submittedVersion: number } | null>(null);

  // 診断料金入力ダイアログの状態
  const [isDiagnosisFeeDialogOpen, setIsDiagnosisFeeDialogOpen] = useState(false);
  const [diagnosisFee, setDiagnosisFee] = useState<number | null>(null);
  const [diagnosisDuration, setDiagnosisDuration] = useState<number | null>(null);

  // 診断担当者の状態管理
  const [diagnosisMechanic, setDiagnosisMechanic] = useState<string>("");

  // 作業メモダイアログの状態
  const [isJobMemoDialogOpen, setIsJobMemoDialogOpen] = useState(false);

  // 診断結果プレビューダイアログの状態（改善提案 #15）
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // 一時帰宅/入庫選択ダイアログの状態
  const [isTemporaryReturnDialogOpen, setIsTemporaryReturnDialogOpen] = useState(false);

  // 一時帰宅情報の状態
  const [isTemporaryReturn, setIsTemporaryReturn] = useState<boolean | null>(null);
  const [reentryDateTime, setReentryDateTime] = useState<string | null>(null);

  // jobデータから一時帰宅情報を初期化
  useEffect(() => {
    if (job?.field7) {
      const parsedReentryDateTime = parseTemporaryReturnInfoFromField7(job.field7);
      setReentryDateTime(parsedReentryDateTime);
      setIsTemporaryReturn(parsedReentryDateTime !== null);
    } else {
      setReentryDateTime(null);
      setIsTemporaryReturn(null);
    }
  }, [job?.field7]);

  // ジョブデータから走行距離を初期化
  useEffect(() => {
    if (job?.field10 !== undefined && job.field10 !== null) {
      setMileage(job.field10);
    } else {
      setMileage(null);
    }
  }, [job?.field10]);

  /**
   * 走行距離入力ハンドラ（ローカル状態のみ更新）
   */
  const handleMileageInputChange = (value: string) => {
    if (value === "") {
      setMileage(null);
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setMileage(numValue);
      }
    }
  };

  /**
   * 走行距離更新ハンドラ（API呼び出し）
   */
  const handleMileageBlur = async () => {
    if (!jobId) return;
    
    // 値が変更された場合のみAPIを呼び出す
    if (mileage !== null && mileage !== undefined && mileage !== job?.field10) {
      setIsUpdatingMileage(true);
      try {
        const result = await updateJobField10(jobId, mileage);
        if (result.success) {
          await mutateJob();
          toast.success("走行距離を更新しました");
        } else {
          toast.error("走行距離の更新に失敗しました", {
            description: result.error?.message,
          });
          // エラー時は元の値に戻す
          setMileage(job?.field10 || null);
        }
      } catch (error) {
        console.error("走行距離更新エラー:", error);
        toast.error("走行距離の更新に失敗しました");
        // エラー時は元の値に戻す
        setMileage(job?.field10 || null);
      } finally {
        setIsUpdatingMileage(false);
      }
    }
  };

  // 診断データの読み込み（selectedWorkOrderから復元）
  useEffect(() => {
    if (!selectedWorkOrder?.diagnosis) {
      // 診断データがない場合は初期化
      setEnhancedOBDDiagnosticResult(null);
      setRestoreProgress(null);
      // 写真データも初期化
      setPhotos({
        front: { position: "front", file: null, previewUrl: null, isCompressing: false },
        rear: { position: "rear", file: null, previewUrl: null, isCompressing: false },
        left: { position: "left", file: null, previewUrl: null, isCompressing: false },
        right: { position: "right", file: null, previewUrl: null, isCompressing: false },
        engine: { position: "engine", file: null, previewUrl: null, isCompressing: false },
        interior: { position: "interior", file: null, previewUrl: null, isCompressing: false },
        undercarriage: { position: "undercarriage", file: null, previewUrl: null, isCompressing: false },
        dashboard: { position: "dashboard", file: null, previewUrl: null, isCompressing: false },
        damage: { position: "damage", file: null, previewUrl: null, isCompressing: false },
      });
      return;
    }

    const diagnosis = selectedWorkOrder.diagnosis;

    // 写真データを復元
    if (diagnosis.photos && Array.isArray(diagnosis.photos)) {
      const restoredPhotos: Record<PhotoPosition, PhotoData> = {
        front: { position: "front", file: null, previewUrl: null, isCompressing: false },
        rear: { position: "rear", file: null, previewUrl: null, isCompressing: false },
        left: { position: "left", file: null, previewUrl: null, isCompressing: false },
        right: { position: "right", file: null, previewUrl: null, isCompressing: false },
        engine: { position: "engine", file: null, previewUrl: null, isCompressing: false },
        interior: { position: "interior", file: null, previewUrl: null, isCompressing: false },
        undercarriage: { position: "undercarriage", file: null, previewUrl: null, isCompressing: false },
        dashboard: { position: "dashboard", file: null, previewUrl: null, isCompressing: false },
        damage: { position: "damage", file: null, previewUrl: null, isCompressing: false },
      };

      // 保存された写真データを復元
      diagnosis.photos.forEach((photo: { position: string; url: string }) => {
        const position = photo.position as PhotoPosition;
        if (position && restoredPhotos[position] !== undefined) {
          restoredPhotos[position] = {
            position,
            file: null, // ファイルは復元できないためnull
            previewUrl: photo.url,
            isCompressing: false,
          };
        }
      });

      setPhotos(restoredPhotos);
    } else {
      // 写真データがない場合は初期化
      setPhotos({
        front: { position: "front", file: null, previewUrl: null, isCompressing: false },
        rear: { position: "rear", file: null, previewUrl: null, isCompressing: false },
        left: { position: "left", file: null, previewUrl: null, isCompressing: false },
        right: { position: "right", file: null, previewUrl: null, isCompressing: false },
        engine: { position: "engine", file: null, previewUrl: null, isCompressing: false },
        interior: { position: "interior", file: null, previewUrl: null, isCompressing: false },
        undercarriage: { position: "undercarriage", file: null, previewUrl: null, isCompressing: false },
        dashboard: { position: "dashboard", file: null, previewUrl: null, isCompressing: false },
        damage: { position: "damage", file: null, previewUrl: null, isCompressing: false },
      });
    }

    // enhancedOBDDiagnosticResultを復元
    if (diagnosis.enhancedOBDDiagnosticResult) {
      setEnhancedOBDDiagnosticResult(diagnosis.enhancedOBDDiagnosticResult as EnhancedOBDDiagnosticResult);
    } else {
      setEnhancedOBDDiagnosticResult(null);
    }

    // restoreProgressを復元
    if (diagnosis.restoreProgress) {
      setRestoreProgress(diagnosis.restoreProgress as RestoreProgress);
    } else {
      setRestoreProgress(null);
    }

    // qualityInspectionを復元
    if (diagnosis.qualityInspection) {
      setQualityInspection(diagnosis.qualityInspection as QualityInspection);
    } else {
      setQualityInspection(null);
    }

    // manufacturerInquiryを復元
    if (diagnosis.manufacturerInquiry) {
      setManufacturerInquiry(diagnosis.manufacturerInquiry as ManufacturerInquiry);
    } else {
      setManufacturerInquiry(null);
    }

    // 追加見積項目を復元（24ヶ月点検の場合のみ）
    if (is24MonthInspection) {
      const diagnosisAny = diagnosis as any;
      
      // 必須整備項目を復元
      if (diagnosisAny.additionalEstimateRequired && Array.isArray(diagnosisAny.additionalEstimateRequired)) {
        setAdditionalEstimateRequired(diagnosisAny.additionalEstimateRequired as EstimateLineItem[]);
      } else {
        setAdditionalEstimateRequired([]);
      }

      // 推奨整備項目を復元
      if (diagnosisAny.additionalEstimateRecommended && Array.isArray(diagnosisAny.additionalEstimateRecommended)) {
        setAdditionalEstimateRecommended(diagnosisAny.additionalEstimateRecommended as EstimateLineItem[]);
      } else {
        setAdditionalEstimateRecommended([]);
      }

      // 任意整備項目を復元
      if (diagnosisAny.additionalEstimateOptional && Array.isArray(diagnosisAny.additionalEstimateOptional)) {
        setAdditionalEstimateOptional(diagnosisAny.additionalEstimateOptional as EstimateLineItem[]);
      } else {
        setAdditionalEstimateOptional([]);
      }
    } else {
      // 24ヶ月点検以外の場合は初期化
      setAdditionalEstimateRequired([]);
      setAdditionalEstimateRecommended([]);
      setAdditionalEstimateOptional([]);
    }

    // 診断担当者を復元
    if (diagnosis.mechanicName) {
      setDiagnosisMechanic(diagnosis.mechanicName);
    } else {
      // 既存のジョブの担当整備士を初期値として使用
      setDiagnosisMechanic(job?.assignedMechanic || "");
    }

    // 24ヶ月点検リデザイン版：inspectionItemsRedesignを復元
    if (is24MonthInspection && diagnosis.items && Array.isArray(diagnosis.items)) {
      const diagnosisAny = diagnosis as any;
      const initialItems = getInspectionItems("24month");
      
      const restoredItems = initialItems.map((initialItem) => {
        const savedItem = diagnosis.items?.find((item: any) => item.id === initialItem.id);
        if (savedItem) {
          return {
            ...initialItem,
            status: (savedItem.status as InspectionItemRedesign['status']) || initialItem.status,
            comment: savedItem.comment || initialItem.comment,
            photoUrls: savedItem.evidencePhotoUrls || initialItem.photoUrls || [],
            videoUrls: savedItem.evidenceVideoUrls || initialItem.videoUrls || [],
            videoData: savedItem.videoData || initialItem.videoData || [],
          };
        }
        return initialItem;
      });
      
      setInspectionItemsRedesign(restoredItems);
    }
  }, [selectedWorkOrder?.diagnosis, job?.assignedMechanic, is24MonthInspection]);

  // URL.createObjectURLで生成したURLのクリーンアップ
  useEffect(() => {
    return () => {
      // 写真のプレビューURLをクリーンアップ（inspectionPhotoDataも含む）
      Object.values(photos).forEach((photo) => {
        if (photo.previewUrl && photo.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
      Object.values(inspectionPhotoData).forEach((photo) => {
        if (photo.previewUrl && photo.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
      // 動画のプレビューURLをクリーンアップ
      Object.values(inspectionVideoData).forEach((video) => {
        if (video.previewUrl && video.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(video.previewUrl);
        }
      });
      Object.values(bodyPaintVideoData).forEach((video) => {
        if (video.previewUrl && video.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(video.previewUrl);
        }
      });
      Object.values(faultVideoDataMap).forEach((video) => {
        if (video.previewUrl && video.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(video.previewUrl);
        }
      });
      // 音声のURLをクリーンアップ
      if (faultAudioData?.audioUrl && faultAudioData.audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(faultAudioData.audioUrl);
      }
      // OBD診断結果のファイルURLをクリーンアップ
      if (obdDiagnosticResult?.fileUrl && obdDiagnosticResult.fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(obdDiagnosticResult.fileUrl);
      }
    };
  }, [photos, inspectionPhotoData, inspectionVideoData, bodyPaintVideoData, faultVideoDataMap, faultAudioData, obdDiagnosticResult]);

  // 診断完了後のアクション（診断料金入力後、一時帰宅/入庫選択後に実行）
  const [pendingCompleteAction, setPendingCompleteAction] = useState<(() => void) | null>(null);
  const [pendingTemporaryReturnAction, setPendingTemporaryReturnAction] = useState<(() => void) | null>(null);

  // 整備士選択モーダルの状態
  // 仕様書3-1, 3-2: 整備士が自分のスマホで案件を選んで診断画面を開いた時点で整備士を記録
  const [isMechanicDialogOpen, setIsMechanicDialogOpen] = useState(false);
  const [isAssigningMechanic, setIsAssigningMechanic] = useState(false);

  // ナビゲーション履歴を記録（ページ表示時に実行）
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname + window.location.search;
    const currentPathname = window.location.pathname;

    // 前回保存されたパスを取得（sessionStorageから）
    let previousPath: string | null = null;
    try {
      previousPath = sessionStorage.getItem("repair-shop-current-path");
    } catch (error) {
      console.error("[Diagnosis] Failed to get previous path from sessionStorage:", error);
    }

    // リファラー（遷移元）を取得（フォールバック用）
    const referrer = document.referrer;

    // 前回保存されたパスがある場合、それを優先して使用
    if (previousPath && previousPath !== currentPath) {
      try {
        const previousUrl = new URL(previousPath, window.location.origin);
        const previousPathname = previousUrl.pathname;
        const referrerType = getPageTypeFromPath(previousPathname);
        
        // 履歴を記録（前の画面のパスとタイプを記録）
        setNavigationHistory(previousPath, referrerType);
        
        if (process.env.NODE_ENV === "development") {
          console.log("[Diagnosis] Navigation history saved from sessionStorage:", { previousPath, referrerType });
        }
      } catch (error) {
        console.error("[Diagnosis] Failed to parse previous path:", error);
        // エラーが発生した場合は、document.referrerを使用
        previousPath = null;
      }
    }

    // 前回保存されたパスがない場合、document.referrerを使用（フォールバック）
    if (!previousPath && referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const currentOrigin = window.location.origin;

        // 同じオリジンのみ記録（外部サイトからの遷移は無視）
        if (referrerUrl.origin === currentOrigin) {
          const referrerPath = referrerUrl.pathname + referrerUrl.search;
          const referrerType = getPageTypeFromPath(referrerUrl.pathname);

          // 現在のページと同じページへの遷移は記録しない（リロードなど）
          if (referrerPath !== currentPath) {
            // 履歴を記録（前の画面のパスとタイプを記録）
            setNavigationHistory(referrerPath, referrerType);
            
            if (process.env.NODE_ENV === "development") {
              console.log("[Diagnosis] Navigation history saved from referrer:", { referrerPath, referrerType });
            }
          } else {
            // 同じページへの遷移（リロードなど）は履歴を保持
            // 既存の履歴があればそのまま使用
          }
        }
      } catch (error) {
        console.error("[Diagnosis] Failed to record navigation history from referrer:", error);
      }
    }

    // 現在のパスを保存（次回のページ読み込み時に使用）
    saveCurrentPath(currentPathname, window.location.search);
  }, []);

  // ページ読み込み時にスクロール位置をトップにリセット
  useEffect(() => {
    if (typeof window !== "undefined") {
      // ページ読み込み時にスクロール位置をトップにリセット
      window.scrollTo(0, 0);
    }
  }, []);

  // 診断画面を開いた時点で、整備士を選択させる（仕様書3-1, 3-2参照）
  // 仕様書: 整備士が自分のスマホで案件を選んで診断画面を開いた時点で整備士を記録
  useEffect(() => {
    if (!job) return;

    // 既に割り当て済みならスキップ
    if (job.assignedMechanic) return;

    // モーダルが開く前にスクロール位置を保存
    if (typeof window !== "undefined") {
      const scrollY = window.scrollY;
      sessionStorage.setItem("mechanic-dialog-scroll-y", scrollY.toString());
    }

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

        // データを更新
        await mutateJob();
        
        // モーダルを閉じる（handleMechanicDialogCloseでスクロール位置が復元される）
        setIsMechanicDialogOpen(false);
        
        toast.success(`${mechanicName}さんを担当に設定しました`);
      } else {
        toast.error("整備士の割り当てに失敗しました", {
          description: result.error?.message,
        });
        // エラー時はスクロール位置の保存を削除
        sessionStorage.removeItem("mechanic-dialog-scroll-y");
      }
    } catch (error) {
      console.error("Mechanic assignment error:", error);
      toast.error("エラーが発生しました");
      // エラー時はスクロール位置の保存を削除
      sessionStorage.removeItem("mechanic-dialog-scroll-y");
    } finally {
      setIsAssigningMechanic(false);
    }
  };

  /**
   * 整備士選択ダイアログを閉じる
   * モーダルを選ばずに閉じても、そのまま続けられるようにする
   * 保存時にはエラーチェックで進めないようにする
   */
  const handleMechanicDialogClose = (open: boolean) => {
    if (isAssigningMechanic) return; // 処理中は閉じない
    setIsMechanicDialogOpen(open);
    
    // ダイアログが閉じた時、スクロール位置を復元
    if (!open && typeof window !== "undefined") {
      const savedScrollY = sessionStorage.getItem("mechanic-dialog-scroll-y");
      if (savedScrollY) {
        // レイアウトの更新を待ってからスクロール位置を復元
        // 複数のフレームを待つことで、データ更新によるレイアウト変更を確実に待つ
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, parseInt(savedScrollY, 10));
            sessionStorage.removeItem("mechanic-dialog-scroll-y");
          });
        });
      }
    }
    // モーダルを閉じても前のページに戻らない（続けられるようにする）
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

  // =============================================================================
  // 24ヶ月点検（車検）リデザイン版のハンドラ
  // =============================================================================
  
  /**
   * 24ヶ月点検リデザイン版：ステータス変更ハンドラ
   */
  const handleRedesignStatusChange = (itemId: string, status: InspectionStatusRedesign, skipAutoAdvance?: boolean) => {
    setInspectionItemsRedesign((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  // 点検項目の状態が「exchange」または「repair」の場合、自動的に「必須整備」に追加
  useEffect(() => {
    if (!is24MonthInspection) {
      // 24ヶ月点検以外の場合は初期化
      setAdditionalEstimateRequired([]);
      return;
    }

    // 「exchange」または「repair」の項目を抽出
    const exchangeOrRepairItems = inspectionItemsRedesign.filter(
      (item) => item.status === "exchange" || item.status === "repair"
    );

    // 現在の「必須整備」項目を更新
    setAdditionalEstimateRequired((prev) => {
      // 現在の「必須整備」項目のIDセットを作成
      const currentRequiredIds = new Set(
        prev.map((item) => item.id.replace("required-", ""))
      );

      // 新しく追加すべき項目
      const itemsToAdd = exchangeOrRepairItems.filter(
        (item) => !currentRequiredIds.has(item.id)
      );

      // 削除すべき項目（「exchange」または「repair」以外の状態に変更された項目）
      const itemsToKeep = prev.filter((item) => {
        const itemId = item.id.replace("required-", "");
        const inspectionItem = inspectionItemsRedesign.find((i) => i.id === itemId);
        return inspectionItem && (inspectionItem.status === "exchange" || inspectionItem.status === "repair");
      });

      // 追加する項目を作成
      const newRequiredItems: EstimateLineItem[] = itemsToAdd.map((item) => ({
        id: `required-${item.id}`,
        name: item.label,
        partQuantity: 1,
        partUnitPrice: 0,
        laborCost: 0,
        priority: "required",
        linkedPhotoId: null,
        linkedVideoId: null,
        transcription: null,
      }));

      return [...itemsToKeep, ...newRequiredItems];
    });
  }, [inspectionItemsRedesign, is24MonthInspection]);

  /**
   * 24ヶ月点検リデザイン版：写真追加ハンドラ
   */
  const handleRedesignPhotoAdd = async (itemId: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);
      setInspectionItemsRedesign((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, photoUrls: [...(item.photoUrls || []), previewUrl] }
            : item
        )
      );
      toast.success("写真を追加しました");
    } catch (error) {
      console.error("写真追加エラー:", error);
      toast.error("写真の追加に失敗しました");
    }
  };

  /**
   * 24ヶ月点検リデザイン版：写真削除ハンドラ
   */
  const handleRedesignPhotoDelete = (itemId: string, index: number) => {
    setInspectionItemsRedesign((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              photoUrls: (item.photoUrls || []).filter((_, i) => i !== index),
            }
          : item
      )
    );
    toast.success("写真を削除しました");
  };

  /**
   * 24ヶ月点検リデザイン版：動画追加ハンドラ
   */
  const handleRedesignVideoAdd = async (itemId: string, file: File) => {
    try {
      // 動画のプレビューURLを生成（Blob URLを使用）
      const previewUrl = URL.createObjectURL(file);
      
      // 動画の長さを取得（可能な場合）
      const video = document.createElement("video");
      video.src = previewUrl;
      let duration: number | undefined;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          duration = video.duration;
          resolve();
        };
        video.onerror = () => resolve();
        // タイムアウト（5秒）
        setTimeout(() => resolve(), 5000);
      });

      setInspectionItemsRedesign((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                videoUrls: [...(item.videoUrls || []), previewUrl],
                videoData: [
                  ...(item.videoData || []),
                  {
                    url: previewUrl,
                    duration,
                  },
                ],
              }
            : item
        )
      );
      toast.success("動画を追加しました");
    } catch (error) {
      console.error("動画追加エラー:", error);
      toast.error("動画の追加に失敗しました");
    }
  };

  /**
   * 24ヶ月点検リデザイン版：動画削除ハンドラ
   */
  const handleRedesignVideoDelete = (itemId: string, index: number) => {
    setInspectionItemsRedesign((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          // Blob URLを解放
          const videoUrl = item.videoUrls?.[index];
          if (videoUrl && videoUrl.startsWith("blob:")) {
            URL.revokeObjectURL(videoUrl);
          }
          
          return {
            ...item,
            videoUrls: (item.videoUrls || []).filter((_, i) => i !== index),
            videoData: (item.videoData || []).filter((_, i) => i !== index),
          };
        }
        return item;
      })
    );
    toast.success("動画を削除しました");
  };

  /**
   * 24ヶ月点検リデザイン版：次のセクションへ遷移
   */
  const handleRedesignNextSection = () => {
    if (!activeInspectionCategory) return;
    const categories = getInspectionCategories("24month");
    const currentIndex = categories.indexOf(activeInspectionCategory);
    if (currentIndex >= 0 && currentIndex < categories.length - 1) {
      setActiveInspectionCategory(categories[currentIndex + 1] as InspectionCategory24Month);
    }
  };

  /**
   * 24ヶ月点検リデザイン版：OBD PDFアップロード
   */
  const handleObdPdfUpload = async (file: File) => {
    setObdPdfResult({
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      status: "uploaded",
    });
    toast.success("OBD診断結果をアップロードしました");
  };

  /**
   * 24ヶ月点検リデザイン版：OBD PDF削除
   */
  const handleObdPdfRemove = () => {
    setObdPdfResult(undefined);
    toast.success("OBD診断結果を削除しました");
  };

  // 24ヶ月点検用の初期カテゴリ設定
  useEffect(() => {
    if (is24MonthInspection && !activeInspectionCategory) {
      const categories = getInspectionCategories("24month");
      if (categories[0]) {
        setActiveInspectionCategory(categories[0] as InspectionCategory24Month);
      }
    }
  }, [is24MonthInspection, activeInspectionCategory]);

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
   * 車検用：動画撮影ハンドラ（音声認識対応）
   */
  const handleInspectionVideoCapture = async (
    itemId: string,
    file: File,
    transcription?: string
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
          transcription: transcription || undefined,
        },
      }));

      // 検査項目に動画URLと実況解説テキストを追加
      setInspectionItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
              ...item,
              videoUrl: previewUrl,
              comment: transcription || item.comment, // 音声認識テキストがあればコメントに設定
            }
            : item
        )
      );

      if (transcription) {
        toast.success("動画を撮影しました（実況解説を文字起こし済み）");
      } else {
        toast.success("動画を撮影しました");
      }
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
      const customerId = job.field4?.ID1 || job.field4?.id || "";
      const customerName = job.field4?.Last_Name || job.field4?.name || "顧客";
      const vehicleId = job.field6?.Name || job.field6?.id || "";
      const vehicleName = job.field6?.Name || job.field6?.name || "車両";
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
      const customerId = job.field4?.ID1 || job.field4?.id || "";
      const customerName = job.field4?.Last_Name || job.field4?.name || "顧客";
      const vehicleId = job.field6?.Name || job.field6?.id || "";
      const vehicleName = job.field6?.Name || job.field6?.name || "車両";
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
   * 板金・塗装用：動画撮影ハンドラ（音声認識対応）
   */
  const handleBodyPaintVideoCapture = async (
    locationId: string,
    file: File,
    transcription?: string
  ) => {
    try {
      const previewUrl = URL.createObjectURL(file);

      setBodyPaintVideoData((prev) => ({
        ...prev,
        [locationId]: {
          position: locationId,
          file,
          previewUrl,
          isProcessing: false,
          transcription: transcription || undefined,
        },
      }));

      setBodyPaintDamageLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId
            ? {
              ...loc,
              videoUrl: previewUrl,
              comment: transcription || loc.comment, // 音声認識テキストがあればコメントに設定
            }
            : loc
        )
      );

      if (transcription) {
        toast.success("動画を撮影しました（実況解説を文字起こし済み）");
      } else {
        toast.success("動画を撮影しました");
      }
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
      const customerId = job.field4?.ID1 || job.field4?.id || "";
      const customerName = job.field4?.Last_Name || job.field4?.name || "顧客";
      const vehicleId = job.field6?.Name || job.field6?.id || "";
      const vehicleName = job.field6?.Name || job.field6?.name || "車両";
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
   * 故障診断用：動画撮影ハンドラ（音声認識対応）
   */
  const handleFaultVideoCapture = async (
    position: string,
    file: File,
    transcription?: string
  ) => {
    try {
      const previewUrl = URL.createObjectURL(file);

      setFaultVideoDataMap((prev) => ({
        ...prev,
        [position]: {
          position,
          file,
          previewUrl,
          isProcessing: false,
          transcription: transcription || undefined,
        },
      }));

      if (transcription) {
        toast.success("動画を撮影しました（実況解説を文字起こし済み）");
      } else {
        toast.success("動画を撮影しました");
      }
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
   * プレビューダイアログを開く（改善提案 #15）
   */
  const handleOpenPreview = () => {
    setIsPreviewDialogOpen(true);
  };

  /**
   * プレビューから編集（改善提案 #15）
   */
  const handleEditFromPreview = (itemIndex: number) => {
    // 診断項目のIDを取得（inspectionItemsまたはcheckItemsから）
    let targetItemId: string | null = null;

    if (isInspection && inspectionItems.length > itemIndex) {
      targetItemId = inspectionItems[itemIndex].id;
    } else if (!isInspection && checkItems.length > itemIndex) {
      targetItemId = checkItems[itemIndex].id;
    }

    if (targetItemId) {
      const itemElement = document.getElementById(`diagnosis-item-${targetItemId}`);
      if (itemElement) {
        itemElement.scrollIntoView({ behavior: "smooth", block: "center" });
        // 少し遅延させてからフォーカス（視覚的なフィードバック）
        // メモリリーク防止: タイマーIDを保持（この関数はイベントハンドラー内で実行されるため、クリーンアップは不要）
        // ただし、コンポーネントがアンマウントされた場合の安全性を確保するため、DOM要素の存在確認を追加
        setTimeout(() => {
          const element = document.getElementById(`diagnosis-item-${targetItemId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    }
  };

  /**
   * プレビューから保存（改善提案 #15）
   */
  const handleSaveFromPreview = () => {
    setIsPreviewDialogOpen(false);
    handleComplete();
  };

  /**
   * 現在の診断データを構築する関数（途中保存用）
   */
  const buildDiagnosisData = useCallback((): any => {
    if (!job) return null;

    // 写真データを整形
    const photoData = Object.values(photos)
      .filter((p) => p.file)
      .map((p) => ({
        position: p.position,
        url: p.previewUrl || "",
      }));

    // 診断データを整形
    let diagnosisData: any;

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
        mechanicName: diagnosisMechanic || undefined,
        enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
        qualityInspection: qualityInspection || undefined,
        manufacturerInquiry: manufacturerInquiry || undefined,
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
        mechanicName: diagnosisMechanic || undefined,
        enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
        qualityInspection: qualityInspection || undefined,
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
        mechanicName: diagnosisMechanic || undefined,
        enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
        manufacturerInquiry: manufacturerInquiry || undefined,
      };
    } else if (isMaintenance) {
      // その他のメンテナンス用の診断データ
      if (!selectedMaintenanceMenu) {
        return null;
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
        mechanicName: diagnosisMechanic || undefined,
        qualityInspection: qualityInspection || undefined,
      };
    } else if (isTuningParts) {
      // チューニング・パーツ取付用の診断データ
      if (!selectedTuningPartsType) {
        return null;
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
        mechanicName: diagnosisMechanic || undefined,
        enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
        qualityInspection: qualityInspection || undefined,
        manufacturerInquiry: manufacturerInquiry || undefined,
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
        mechanicName: diagnosisMechanic || undefined,
      };
    } else if (isBodyPaint) {
      // 板金・塗装用の診断データ
      if (bodyPaintDamageLocations.length === 0) {
        return null;
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
        mechanicName: diagnosisMechanic || undefined,
        qualityInspection: qualityInspection || undefined,
        manufacturerInquiry: manufacturerInquiry || undefined,
      };
    } else if (isRestore) {
      // レストア用の診断データ
      if (!restoreType || restoreLocations.length === 0) {
        return null;
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
        mechanicName: diagnosisMechanic || undefined,
        enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
        restoreProgress: restoreProgress || undefined,
        qualityInspection: qualityInspection || undefined,
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
        mechanicName: diagnosisMechanic || undefined,
        enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
        qualityInspection: qualityInspection || undefined,
      };
    } else if (isFaultDiagnosis) {
      // 故障診断用の診断データ
      diagnosisData = {
        items: selectedSymptoms.map((symptom) => ({
          id: symptom.id,
          name: symptom.name,
          category: symptom.category,
          status: "red" as DiagnosisStatus,
          comment: null,
          evidencePhotoUrls: [],
          evidenceVideoUrl: null,
        })),
        photos: photoData,
        mechanicName: diagnosisMechanic || undefined,
        enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
        qualityInspection: qualityInspection || undefined,
        manufacturerInquiry: manufacturerInquiry || undefined,
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
        mechanicName: diagnosisMechanic || undefined,
        enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
      };
    }

    return diagnosisData;
  }, [
    job,
    photos,
    isInspection,
    inspectionItems,
    enhancedOBDDiagnosticResult,
    qualityInspection,
    manufacturerInquiry,
    isEngineOilChange,
    engineOilInspectionItems,
    isTireReplacement,
    tireInspectionItems,
    tireTreadDepth,
    tirePressure,
    isMaintenance,
    selectedMaintenanceMenu,
    maintenanceInspectionItems,
    maintenanceMeasurements,
    isTuningParts,
    selectedTuningPartsType,
    tuningPartsInspectionItems,
    isCoating,
    coatingBodyConditions,
    isBodyPaint,
    bodyPaintDamageLocations,
    isRestore,
    restoreType,
    restoreLocations,
    restoreConditionChecks,
    restoreProgress,
    isOther,
    otherDiagnosisItems,
    isFaultDiagnosis,
    selectedSymptoms,
    checkItems,
    diagnosisMechanic,
  ]);

  /**
   * 診断データを下書き保存する関数
   */
  const saveDraftDiagnosis = useCallback(async (diagnosisData: any) => {
    if (!job || !diagnosisData) return;

    // ワークオーダーがある場合は、ワークオーダーに保存
    if (selectedWorkOrder?.id) {
      const updateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
        diagnosis: diagnosisData,
        // ステータスは変更しない（下書き保存）
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error?.message || "下書き保存に失敗しました");
      }

      // ワークオーダーリストを再取得
      await mutateWorkOrders();
    }
    // 単一作業の場合は、下書き保存しない（既存のsaveDiagnosisを使用）
    // 理由: 単一作業の場合は、診断完了時にのみ保存する仕様
  }, [job, jobId, selectedWorkOrder?.id, mutateWorkOrders]);

  /**
   * 自動保存フック
   * 診断データのスナップショットを作成し、変更を検知して自動保存
   */
  const diagnosisDataSnapshot = useMemo(() => {
    return buildDiagnosisData();
  }, [
    job,
    photos,
    isInspection,
    inspectionItems,
    enhancedOBDDiagnosticResult,
    qualityInspection,
    manufacturerInquiry,
    isEngineOilChange,
    engineOilInspectionItems,
    isTireReplacement,
    tireInspectionItems,
    tireTreadDepth,
    tirePressure,
    isMaintenance,
    selectedMaintenanceMenu,
    maintenanceInspectionItems,
    maintenanceMeasurements,
    isTuningParts,
    selectedTuningPartsType,
    tuningPartsInspectionItems,
    isCoating,
    coatingBodyConditions,
    isBodyPaint,
    bodyPaintDamageLocations,
    isRestore,
    restoreType,
    restoreLocations,
    restoreConditionChecks,
    restoreProgress,
    isOther,
    otherDiagnosisItems,
    isFaultDiagnosis,
    selectedSymptoms,
    checkItems,
  ]);

  const { saveStatus, saveManually, hasUnsavedChanges: autoSaveHasUnsavedChanges } = useAutoSave({
    data: diagnosisDataSnapshot,
    onSave: saveDraftDiagnosis,
    debounceMs: 2000,
    disabled: !selectedWorkOrder?.id || !job, // ワークオーダーがない場合は無効化
    onSaveSuccess: () => {
      // 保存成功時のトースト通知
      toast.success("保存しました");
    },
    onSaveError: (error) => {
      console.error("診断データの下書き保存エラー:", error);
      // 保存失敗時のトースト通知
      toast.error("保存に失敗しました", {
        description: error.message || "エラーが発生しました",
      });
    },
  });

  // Dirty Check（未保存変更の検知）
  useDirtyCheck(autoSaveHasUnsavedChanges, {
    message: "入力中の内容が保存されていません。このまま移動しますか？",
    disabled: !selectedWorkOrder?.id || !job, // ワークオーダーがない場合は無効化
  });

  /**
   * 診断完了ハンドラ（直接内部処理を実行）
   */
  const handleComplete = () => {
    if (!job) return;

    // セクションで入力された値をそのまま使用して内部処理を実行
    handleCompleteInternal();
  };

  /**
   * 診断完了処理（内部処理）
   */
  const handleCompleteInternal = async () => {
    if (!job) return;

    // エラーチェック：整備士が割り当てられているか確認
    if (!job.assignedMechanic) {
      const actionLabel = is24MonthInspection || is12MonthInspection ? "点検" : "診断";
      toast.error("担当整備士を選択してください", {
        description: `${actionLabel}を完了するには、担当整備士の選択が必要です`,
        action: {
          label: "整備士を選択",
          onClick: () => {
            setIsMechanicDialogOpen(true);
          },
        },
      });
      return;
    }

    // エラーチェック：車検・12ヵ月点検の場合、必須項目が入力されているか確認
    if (is24MonthInspection) {
      // 24ヶ月点検リデザイン版
      const completedItems = inspectionItemsRedesign.filter(
        (item) => item.status !== "none"
      );
      if (completedItems.length === 0) {
        toast.error("点検項目を入力してください", {
          description: "少なくとも1つの項目の状態を選択してください",
        });
        return;
      }
    } else if (isInspection) {
      // 従来の12ヵ月点検
      const completedItems = inspectionItems.filter(
        (item) => item.status !== "unchecked"
      );
      if (completedItems.length === 0) {
        toast.error("診断項目を入力してください", {
          description: "少なくとも1つの項目の状態を選択してください",
        });
        return;
      }
    }

    // エラーチェック：その他のメンテナンスの場合、メニューが選択されているか確認
    if (isMaintenance && !selectedMaintenanceMenu) {
      toast.error("メンテナンスメニューを選択してください");
      return;
    }

    // エラーチェック：チューニング・パーツ取付の場合、種類が選択されているか確認
    if (isTuningParts && !selectedTuningPartsType) {
      toast.error("種類を選択してください");
      return;
    }

    // エラーチェック：板金・塗装の場合、損傷箇所が追加されているか確認
    if (isBodyPaint && bodyPaintDamageLocations.length === 0) {
      toast.error("損傷箇所を1つ以上追加してください");
      return;
    }

    // エラーチェック：レストアの場合、種類と修復箇所が設定されているか確認
    if (isRestore) {
      if (!restoreType) {
        toast.error("レストアの種類を選択してください");
        return;
      }
      if (restoreLocations.length === 0) {
        toast.error("修復箇所を1つ以上追加してください");
        return;
      }
    }

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
      let diagnosisData: any;

      if (is24MonthInspection) {
        // 24ヶ月点検（車検）リデザイン版の診断データ
        diagnosisData = {
          items: inspectionItemsRedesign.map((item) => ({
            id: item.id,
            name: item.label,
            category: item.category,
            status: item.status,
            comment: item.comment || null,
            evidencePhotoUrls: item.photoUrls || [],
            evidenceVideoUrls: item.videoUrls || [],
            videoData: item.videoData || [],
          })),
          photos: photoData,
          // 24ヶ月点検専用データ
          inspectionMeasurements: inspectionMeasurements || undefined,
          inspectionParts: inspectionPartsData || undefined,
          customParts: customPartsData.length > 0 ? customPartsData : undefined,
          qualityCheckData: qualityCheckData || undefined,
          maintenanceAdvice: maintenanceAdvice || undefined,
          obdPdfResult: obdPdfResult || undefined,
          // 拡張OBD診断結果を追加
          enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
          // 追加見積項目
          additionalEstimateRequired: additionalEstimateRequired.length > 0 ? additionalEstimateRequired : undefined,
          additionalEstimateRecommended: additionalEstimateRecommended.length > 0 ? additionalEstimateRecommended : undefined,
          additionalEstimateOptional: additionalEstimateOptional.length > 0 ? additionalEstimateOptional : undefined,
        };
      } else if (isInspection) {
        // 従来の12ヵ月点検用の診断データ
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
          // 拡張OBD診断結果を追加（改善提案 #4）
          enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
          // 品質管理・最終検査を追加（改善提案 #4）
          qualityInspection: qualityInspection || undefined,
          // メーカー問い合わせを追加（改善提案 #4）
          manufacturerInquiry: manufacturerInquiry || undefined,
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
          // 拡張OBD診断結果を追加（改善提案 #4）
          enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
          // 品質管理・最終検査を追加（改善提案 #4）
          qualityInspection: qualityInspection || undefined,
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
          // 拡張OBD診断結果を追加（改善提案 #4）
          enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
          // メーカー問い合わせを追加（改善提案 #4）
          manufacturerInquiry: manufacturerInquiry || undefined,
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
          // 品質管理・最終検査を追加（改善提案 #4）
          qualityInspection: qualityInspection || undefined,
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
          // 拡張OBD診断結果を追加（改善提案 #4）
          enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
          // 品質管理・最終検査を追加（改善提案 #4）
          qualityInspection: qualityInspection || undefined,
          // メーカー問い合わせを追加（改善提案 #4）
          manufacturerInquiry: manufacturerInquiry || undefined,
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
          // 品質管理・最終検査を追加（改善提案 #4）
          qualityInspection: qualityInspection || undefined,
          // メーカー問い合わせを追加（改善提案 #4）
          manufacturerInquiry: manufacturerInquiry || undefined,
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
          // 拡張OBD診断結果を追加（改善提案 #4）
          enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
          // レストア作業進捗を追加（改善提案 #4）
          restoreProgress: restoreProgress || undefined,
          // 品質管理・最終検査を追加（改善提案 #4）
          qualityInspection: qualityInspection || undefined,
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
          // 拡張OBD診断結果を追加（改善提案 #4）
          enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
          // 品質管理・最終検査を追加（改善提案 #4）
          qualityInspection: qualityInspection || undefined,
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
          // 拡張OBD診断結果を追加（改善提案 #4）
          enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
          // 品質管理・最終検査を追加（改善提案 #4）
          qualityInspection: qualityInspection || undefined,
          // メーカー問い合わせを追加（改善提案 #4）
          manufacturerInquiry: manufacturerInquiry || undefined,
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
          // 拡張OBD診断結果を追加（改善提案 #4）
          enhancedOBDDiagnosticResult: enhancedOBDDiagnosticResult || undefined,
        };
      }

      // ハプティックフィードバック（診断完了時）
      triggerHapticFeedback("medium");

      // 一時帰宅情報をfield7に保存（複数作業管理の場合も）
      if (isTemporaryReturn !== null) {
        if (isTemporaryReturn && reentryDateTime) {
          const updatedField7 = appendTemporaryReturnInfoToField7(job?.field7, reentryDateTime);
          await updateJobField7(jobId, updatedField7);
        } else if (isTemporaryReturn === false) {
          // 入庫の場合、一時帰宅情報を削除
          const updatedField7 = appendTemporaryReturnInfoToField7(job?.field7, null);
          await updateJobField7(jobId, updatedField7);
        }
      }

      // 診断結果を保存（workOrderIdを含める）
      if (selectedWorkOrder?.id) {
        // 複数作業管理対応：診断データを選択中のワークオーダーに保存
        const updateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
          diagnosis: diagnosisData,
          status: "見積作成待ち",
          // 診断料金情報も保存
          diagnosisFee: diagnosisFee,
          diagnosisDuration: diagnosisDuration,
        });

        if (!updateResult.success) {
          throw new Error(updateResult.error?.message || "診断の保存に失敗しました");
        }

        // ワークオーダーリストを再取得
        await mutateWorkOrders();
      } else {
        // 単一作業の場合：既存のsaveDiagnosisを使用
        // オフライン対応: オフライン時はローカルに保存して同期キューに追加
        if (!isOnline) {
          // オフライン時: ローカルに保存
          const diagnosisDataForStorage = {
            id: `diagnosis-${jobId}-${Date.now()}`,
            jobId,
            data: {
              items: diagnosisData.items || [],
              photos: diagnosisData.photos,
              mileage: mileage !== null && mileage !== undefined ? mileage : undefined, // 更新された走行距離を反映
              version: job.version || null,
              enhancedOBDDiagnosticResult: diagnosisData.enhancedOBDDiagnosticResult || undefined,
              qualityInspection: diagnosisData.qualityInspection || undefined,
              manufacturerInquiry: diagnosisData.manufacturerInquiry || undefined,
            },
            timestamp: new Date().toISOString(),
          };

          // IndexedDBに保存
          await saveToIndexedDB(STORE_NAMES.DIAGNOSIS, diagnosisDataForStorage);

          // 同期キューに追加
          await addToSyncQueue({
            type: "update",
            storeName: STORE_NAMES.DIAGNOSIS,
            dataId: jobId,
            data: diagnosisDataForStorage.data,
            status: "pending",
          });

          toast.success("診断データをローカルに保存しました", {
            description: "オンライン復帰時に自動的に同期されます",
          });

          // オフライン時はここで処理を終了（ステータス更新や通知はスキップ）
          triggerHapticFeedback("success");
          setIsSubmitting(false);
          return;
        }

        // オンライン時: 通常の保存処理（診断完了時はisComplete: trueを指定）
        // 単一作業の場合、workOrderIdはundefined（後方互換性）
        const saveResult = await saveDiagnosis(jobId, undefined, {
          items: diagnosisData.items || [],
          photos: diagnosisData.photos,
          mileage: mileage !== null && mileage !== undefined ? mileage : undefined, // 更新された走行距離を反映
          version: job.version || null, // 競合制御用バージョン番号
          enhancedOBDDiagnosticResult: diagnosisData.enhancedOBDDiagnosticResult || undefined,
          qualityInspection: diagnosisData.qualityInspection || undefined,
          manufacturerInquiry: diagnosisData.manufacturerInquiry || undefined,
          isComplete: true, // 診断完了フラグ（ステータスを「見積作成待ち」に更新）
        });

        if (!saveResult.success) {
          // 競合エラーの場合、特別な処理
          if (saveResult.error?.code === "CONFLICT") {
            throw new Error(saveResult.error?.message || "データが他のユーザーによって更新されています。ページを再読み込みして最新のデータを取得してください。");
          }
          throw new Error(saveResult.error?.message || "診断の保存に失敗しました");
        }

        // バージョン番号を更新
        if (saveResult.data?.version) {
          await mutateJob();
        }

        // ステータス更新はsaveDiagnosis内で処理されるため、ここでは不要

        // 診断料金をジョブに保存（単一作業の場合）
        if (diagnosisFee !== null || diagnosisDuration !== null) {
          const { updateJobDiagnosisFee } = await import("@/lib/api");
          const feeResult = await updateJobDiagnosisFee(jobId, diagnosisFee, diagnosisDuration);
          if (!feeResult.success) {
            console.error("[Diagnosis] 診断料金の保存に失敗:", feeResult.error);
            // 診断料金の保存失敗は警告のみ（診断完了処理は継続）
            toast.warning("診断料金の保存に失敗しました", {
              description: feeResult.error?.message,
            });
          }
        }
      }
      // 複数作業管理の場合、Job全体のステータスは更新しない（各ワークオーダーのステータスで管理）
      // ただし、すべてのワークオーダーが「見積作成待ち」以上になった場合は、Job全体のステータスも更新
      // 更新後のワークオーダーリストを取得して確認（mutateWorkOrdersで再取得済み）

      // 24ヶ月点検で追加見積もりがない場合の処理
      if (is24MonthInspection && selectedWorkOrder?.id) {
        // 追加見積もりの有無を判定
        const hasAdditionalEstimate = 
          (additionalEstimateRequired?.length || 0) > 0 ||
          (additionalEstimateRecommended?.length || 0) > 0 ||
          (additionalEstimateOptional?.length || 0) > 0;

        if (!hasAdditionalEstimate) {
          // 追加見積もりがない場合、診断データから作業データに引き継ぎ
          // 診断画面で入力したデータを自動的に作業データに引き継ぎ
          const workData: any = {
            // 交換部品等（診断画面で入力したcustomPartsを引き継ぎ）
            replacementParts: customPartsData.length > 0 ? customPartsData : undefined,
            // 測定値（診断画面で入力したinspectionMeasurementsを引き継ぎ）
            measurements: inspectionMeasurements || undefined,
            // 品質管理・最終検査（診断画面で入力したqualityCheckDataを引き継ぎ）
            qualityCheck: qualityCheckData || undefined,
            // 作業メモ（診断画面で入力したmaintenanceAdviceを引き継ぎ）
            memo: maintenanceAdvice || undefined,
            // 診断データへの参照（作業画面で使用）
            diagnosisData: diagnosisData,
          };

          // 作業データを保存し、ステータスを「作業待ち」に更新
          const workUpdateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
            work: workData,
            status: "作業待ち", // 見積・承認をスキップして直接作業待ちに
          });

          if (!workUpdateResult.success) {
            throw new Error(workUpdateResult.error?.message || "作業データの保存に失敗しました");
          }

          // ワークオーダーリストを再取得
          await mutateWorkOrders();

          // 成功
          triggerHapticFeedback("success");

          // 作業画面へのURLを生成
          const workUrl = `/mechanic/work/${jobId}?workOrderId=${selectedWorkOrder.id}`;

          // 点検完了メッセージを表示
          toast.success("点検完了", {
            id: "diagnosis-complete-no-estimate",
            description: "追加見積もりがないため、作業画面で最終確認を行ってください",
            action: {
              label: "作業画面へ",
              onClick: () => {
                router.push(workUrl);
              },
            },
            duration: 5000,
          });

          // 作業画面への遷移時に履歴を記録
          const workUrlObj = new URL(workUrl, window.location.origin);
          setNavigationHistory(workUrlObj.pathname + workUrlObj.search, "diagnosis");

          // 3秒後に自動で作業画面へ遷移
          setTimeout(() => {
            router.push(workUrl);
          }, 3000);

          // 処理を終了（見積画面への遷移処理をスキップ）
          setIsSubmitting(false);
          return;
        }
      }

      // 診断完了のLINE通知を送信
      try {
        const customer = await fetchCustomerById(job.field4?.id || "");
        if (customer.success && customer.data?.Business_Messaging_Line_Id) {
          const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
          const serviceKind = serviceKinds.length > 0 ? serviceKinds[0] : "その他";

          const { sendLineNotification } = await import("@/lib/line-api");
          await sendLineNotification({
            lineUserId: customer.data.Business_Messaging_Line_Id || "",
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

      // 見積画面へのURLを生成（複数作業管理対応）
      const estimateUrl = selectedWorkOrder?.id
        ? `/admin/estimate/${jobId}?workOrderId=${selectedWorkOrder.id}`
        : `/admin/estimate/${jobId}`;

      // 受入点検の場合は「点検完了」、その他は「診断完了」
      const successMessage = is24MonthInspection || is12MonthInspection ? "点検完了" : "診断完了";
      toast.success(successMessage, {
        id: "diagnosis-complete",
        description: "見積画面に移動しますか？",
        action: {
          label: "見積画面へ",
          onClick: () => {
            router.push(estimateUrl);
          },
        },
        duration: 5000,
      });

      // 見積画面への遷移時に履歴を記録
      const estimateUrlObj = new URL(estimateUrl, window.location.origin);
      setNavigationHistory(estimateUrlObj.pathname + estimateUrlObj.search, "diagnosis");

      // 3秒後に自動で見積画面へ遷移（オプション）
      // メモリリーク防止: タイマーIDを保持（この関数はイベントハンドラー内で実行されるため、クリーンアップは不要）
      // ただし、router.pushはNext.jsが管理するため、通常は問題ない
      setTimeout(() => {
        router.push(estimateUrl);
      }, 3000);
    } catch (error) {
      const errorLabel = is24MonthInspection || is12MonthInspection ? "点検" : "診断";
      console.error(`${errorLabel}完了エラー:`, error);
      triggerHapticFeedback("error"); // エラー時のハプティックフィードバック
      const errorMessage = error instanceof Error ? error.message : `${errorLabel}の送信に失敗しました`;
      toast.error(`${errorLabel}の送信に失敗しました`, {
        id: "diagnosis-error",
        description: errorMessage,
        action: {
          label: "再試行",
          onClick: () => {
            handleComplete();
          },
        },
        duration: 10000, // リトライボタンを表示するため、表示時間を延長
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 車両情報を抽出（すべてのHooksを早期リターンの前に配置）
  const vehicleName = useMemo(() => {
    if (!job?.field6?.name) return "車両未登録";
    return extractVehicleName(job.field6.name);
  }, [job?.field6?.name]);

  const licensePlate = useMemo(() => {
    if (!job?.field6?.name) return "";
    return extractLicensePlate(job.field6.name);
  }, [job?.field6?.name]);

  const tagId = useMemo(() => {
    return job?.tagId || "---";
  }, [job?.tagId]);

  // 事前入力情報を抽出（field7に「【事前入力】」が含まれている行のみ）
  const preInputDetails = useMemo(() => {
    if (!job?.field7) return null;
    const lines = job.field7.split("\n");
    const preInputLines = lines.filter(line => line.includes("【事前入力】"));
    return preInputLines.length > 0 ? preInputLines.join("\n") : null;
  }, [job?.field7]);

  // detailsとworkOrderも早期リターンの前に配置（jobがundefinedでも安全）
  const details = useMemo(() => {
    return job?.field7 || job?.details || "";
  }, [job?.field7, job?.details]);

  const workOrder = useMemo(() => {
    return job?.field || job?.workOrder || "";
  }, [job?.field, job?.workOrder]);

  // カテゴリごとにグループ化（すべてのHooksを早期リターンの前に配置）
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, CheckItem[]> = {};
    checkItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [checkItems]);

  // カテゴリのリスト（順序を保持）
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    checkItems.forEach((item) => {
      categorySet.add(item.category);
    });
    // 最初のカテゴリを最初に配置
    const firstCategory = checkItems.length > 0 ? checkItems[0].category : null;
    const otherCategories = Array.from(categorySet).filter((cat) => cat !== firstCategory);
    return firstCategory ? [firstCategory, ...otherCategories] : Array.from(categorySet);
  }, [checkItems]);

  // カテゴリの開閉状態を管理（初期値は関数として渡す）
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => {
    // 初期値は関数として計算（初回レンダリング時のみ実行）
    // categoriesはまだ計算されていない可能性があるため、空のSetから開始
    return new Set<string>();
  });

  // カテゴリが完了したかチェック（すべての項目がunchecked以外）
  const isCategoryComplete = useCallback((category: string) => {
    const items = itemsByCategory[category] || [];
    return items.length > 0 && items.every((item) => item.status !== "unchecked");
  }, [itemsByCategory]);

  // カテゴリに未入力項目があるかチェック
  const hasIncompleteItems = useCallback((category: string) => {
    const items = itemsByCategory[category] || [];
    return items.some((item) => item.status === "unchecked");
  }, [itemsByCategory]);

  // カテゴリが初めて計算されたときに、最初のカテゴリを開く
  useEffect(() => {
    if (categories.length > 0) {
      setOpenCategories((prev) => {
        // 既に何か開いている場合は何もしない
        if (prev.size > 0) return prev;
        // 最初のカテゴリを開く
        return new Set([categories[0]]);
      });
    }
  }, [categories]);

  // 完了カテゴリを自動で閉じる
  useEffect(() => {
    // openCategoriesを直接依存配列に含めると無限ループになる可能性があるため、
    // 関数形式でsetOpenCategoriesを使用
    categories.forEach((category) => {
      if (isCategoryComplete(category)) {
        setOpenCategories((prev) => {
          // 既に閉じている場合は何もしない
          if (!prev.has(category)) return prev;
          const next = new Set(prev);
          next.delete(category);
          return next;
        });
      }
    });
  }, [categories, isCategoryComplete]); // openCategoriesを依存配列から削除

  // カテゴリの開閉を切り替える
  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // ワークフロー・フェーズ表示用の判定（条件分岐の前に配置 - Hooksの順序を保つため）
  // 完了フェーズの判定
  const completedPhases = useMemo(() => {
    if (!job) return [];
    const phases: number[] = [];
    
    // Phase 0（事前チェックイン）: field7に顧客入力がある場合、またはfield22（入庫日時）が設定されている場合
    if (job.field7 || job.field22) {
      phases.push(0);
    }
    
    // Phase 1（受付）: field5が「入庫済み」以上の場合
    if (job.field5 && (job.field5 === "入庫済み" || job.field5 === "見積作成待ち" || job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "出庫待ち" || job.field5 === "出庫済み")) {
      phases.push(1);
    }
    
    // Phase 2（診断）: 現在のページ（診断ページ）にいる場合、完了はしない（アクティブ）
    
    // Phase 3（見積）: field5が「見積作成待ち」以上の場合
    if (job.field5 && (job.field5 === "見積作成待ち" || job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "出庫待ち" || job.field5 === "出庫済み")) {
      phases.push(3);
    }
    
    // Phase 4（承認）: field5が「見積提示済み」以上の場合（見積提示済みは顧客承認待ちの状態）
    if (job.field5 && (job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "出庫待ち" || job.field5 === "出庫済み")) {
      phases.push(4);
    }
    
    // Phase 5（作業）: field5が「作業待ち」以上の場合
    if (job.field5 && (job.field5 === "作業待ち" || job.field5 === "出庫待ち" || job.field5 === "出庫済み")) {
      phases.push(5);
    }
    
    // Phase 6（報告）: field5が「出庫待ち」以上の場合
    if (job.field5 && (job.field5 === "出庫待ち" || job.field5 === "出庫済み")) {
      phases.push(6);
    }
    
    return phases;
  }, [job]);

  // エラー状態（すべてのHooksの後に配置）
  if (jobError) {
    return (
      <ErrorDisplay
        message={jobError.message || "案件が見つかりません"}
        onRetry={() => mutateJob()}
      />
    );
  }

  // ローディング状態（すべてのHooksの後に配置）
  if (isJobLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <HeaderSkeleton />
        <main className="max-w-4xl mx-auto px-4 py-6 pb-32" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
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

  // データがない場合（すべてのHooksの後に配置）
  if (!job) {
    return (
      <ErrorDisplay
        message="案件が見つかりません"
        onRetry={() => mutateJob()}
      />
    );
  }

  // 以下はjobが存在することが確定した後に使用（Hooksではない通常の変数）

  // ヘッダー表示用の変数
  const customerName = job.field4?.name || "未登録";

  // 現在の作業名を取得（選択中のワークオーダーから、またはserviceKindsから）
  const currentWorkOrderName = selectedWorkOrder?.serviceKind || (serviceKinds.length > 0 ? serviceKinds[0] : "診断");

  // 車検・12ヵ月点検の場合は「受入点検」と表示（コンセプトに基づく）
  const diagnosisTitle = is24MonthInspection
    ? "受入点検（車検）"
    : is12MonthInspection
      ? "受入点検（12ヵ月点検）"
      : isInspection
        ? "受入点検"
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

  // 統計情報（Hooksではない通常の変数）
  const photoCount = Object.values(photos).filter((p) => p.file).length;
  const totalPhotoPositions = Object.keys(photoPositionLabels).length; // 全写真位置の数
  const checkedCount = checkItems.filter((item) => item.status !== "unchecked").length;
  const redCount = checkItems.filter((item) => item.status === "red").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
      {/* オフライン/オンラインバナー */}
      <OfflineBanner />
      <OnlineBanner />

      {/* ヘッダー */}
      <AppHeader
        maxWidthClassName="max-w-4xl"
        collapsibleOnMobile={true}
        backHref="/"
        hasUnsavedChanges={autoSaveHasUnsavedChanges}
        collapsedCustomerName={job.field4?.name || "未登録"}
        collapsedVehicleName={vehicleName}
        collapsedLicensePlate={licensePlate}
        pageTitle={diagnosisTitle}
        pageTitleIcon={<Activity className="h-5 w-5 text-slate-700 shrink-0" />}
      >
        {/* ページタイトル */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 dark:text-white">
            <Activity className="h-5 w-5 text-slate-700 shrink-0 dark:text-white" />
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
          assignedMechanic={job.assignedMechanic || undefined}
          courtesyCars={courtesyCars}
        />

        {/* 走行距離入力欄（24ヶ月点検以外 - 24ヶ月点検は専用セクションで入力） */}
        {!is24MonthInspection && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <Label htmlFor="mileage-input" className="text-base font-medium text-slate-700 flex items-center gap-2 mb-2 dark:text-white">
              <Gauge className="h-4 w-4 text-slate-600 shrink-0 dark:text-white" />
              走行距離
            </Label>
            <Input
              id="mileage-input"
              type="number"
              inputMode="numeric"
              value={mileage !== null && mileage !== undefined ? mileage.toString() : ""}
              onChange={(e) => handleMileageInputChange(e.target.value)}
              onBlur={handleMileageBlur}
              placeholder="走行距離を入力"
              disabled={isUpdatingMileage || isSubmitting}
              className="h-12 text-base"
            />
            {mileage !== null && mileage !== undefined && (
              <p className="mt-1 text-base text-slate-700 dark:text-white">現在: {mileage.toLocaleString()} km / {Math.round(mileage * 0.621371).toLocaleString()} mi</p>
            )}
          </div>
        )}

        {/* お客様入力情報・変更申請あり・受付メモ */}
        <div className="space-y-3 mt-3">
          {preInputDetails && (
            <div className="bg-blue-50 border border-blue-400 rounded-md p-3 text-base dark:bg-slate-800 dark:border-blue-400 dark:text-white">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="font-medium text-blue-900 dark:text-white">お客様入力情報（事前チェックイン）</p>
              </div>
              <p className="text-blue-900 whitespace-pre-wrap break-words dark:text-white">{preInputDetails}</p>
            </div>
          )}
          {workOrder && (
            <div className="bg-amber-50 border border-amber-400 rounded-md p-3 text-base dark:bg-slate-800 dark:border-amber-400 dark:text-white">
              <div className="flex items-center gap-2 mb-2">
                <NotebookPen className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="font-medium text-amber-900 dark:text-white">受付メモ</p>
              </div>
              <p className="text-amber-900 break-words dark:text-white">{workOrder}</p>
            </div>
          )}

        </div>
      </AppHeader>

      {/* ワークオーダー選択UI（複数作業がある場合のみ表示） */}
      {workOrders && workOrders.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-6">
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
        <main className="max-w-4xl mx-auto px-4 py-6 pb-32 overflow-x-hidden" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)', touchAction: 'pan-y' }}>
        
        {/* 一時帰宅/入庫選択セクション（24ヶ月点検以外） */}
        {!is24MonthInspection && (
          <Card className="mb-4 border border-slate-300 rounded-xl shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Home className="h-5 w-5 text-orange-700 shrink-0" />
                診断後の処理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-medium">処理方法</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer" onClick={() => !isSubmitting && setIsTemporaryReturn(true)}>
                    <input
                      type="radio"
                      checked={isTemporaryReturn === true}
                      onChange={() => !isSubmitting && setIsTemporaryReturn(true)}
                      disabled={isSubmitting}
                      className="h-5 w-5 text-blue-700"
                    />
                    <Label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-blue-700 shrink-0" />
                        <div>
                          <div className="font-medium text-base">一時帰宅</div>
                          <div className="text-base text-slate-700">顧客が車を持ち帰り、後日再入庫</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer" onClick={() => !isSubmitting && setIsTemporaryReturn(false)}>
                    <input
                      type="radio"
                      checked={isTemporaryReturn === false}
                      onChange={() => !isSubmitting && setIsTemporaryReturn(false)}
                      disabled={isSubmitting}
                      className="h-4 w-4 text-green-700"
                    />
                    <Label className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-green-700 shrink-0" />
                        <div>
                          <div className="font-medium text-base">入庫</div>
                          <div className="text-base text-slate-700">車をそのまま入庫</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </div>
              </div>

              {/* 再入庫予定日時（一時帰宅の場合のみ表示） */}
              {isTemporaryReturn === true && (
                <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-300">
                  <Label className="text-base font-medium text-blue-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    再入庫予定日時
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="reentry-date" className="text-base text-blue-900">
                        日付
                      </Label>
                      <Input
                        id="reentry-date"
                        type="date"
                        value={reentryDateTime ? new Date(reentryDateTime).toISOString().split("T")[0] : ""}
                        onChange={(e) => {
                          const date = e.target.value;
                          const time = reentryDateTime ? new Date(reentryDateTime).toTimeString().slice(0, 5) : "10:00";
                          if (date) {
                            const dateTime = new Date(`${date}T${time}:00`);
                            setReentryDateTime(dateTime.toISOString());
                          } else {
                            setReentryDateTime(null);
                          }
                        }}
                        className="h-12 bg-white"
                        disabled={isSubmitting}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="reentry-time" className="text-base text-blue-900 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 shrink-0" />
                        時刻
                      </Label>
                      <Input
                        id="reentry-time"
                        type="time"
                        value={reentryDateTime ? new Date(reentryDateTime).toTimeString().slice(0, 5) : "10:00"}
                        onChange={(e) => {
                          const time = e.target.value;
                          const date = reentryDateTime ? new Date(reentryDateTime).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
                          if (time) {
                            const dateTime = new Date(`${date}T${time}:00`);
                            setReentryDateTime(dateTime.toISOString());
                          }
                        }}
                        className="h-12 bg-white"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 撮影セクション（24ヶ月点検以外） */}
        {!is24MonthInspection && (
          <Card className="mb-4 border border-slate-300 rounded-xl shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Camera className="h-5 w-5 shrink-0" />
                  診断写真撮影
                </span>
                <Badge variant={photoCount === totalPhotoPositions ? "default" : "secondary"} className="text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                  <span className="tabular-nums">{photoCount}</span>/<span className="tabular-nums">{totalPhotoPositions}</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 外観 */}
                <PhotoCaptureButton
                  position="front"
                  label={photoPositionLabels.front}
                  photoData={photos.front}
                  onCapture={handlePhotoCapture}
                  disabled={isSubmitting}
                />
                <PhotoCaptureButton
                  position="rear"
                  label={photoPositionLabels.rear}
                  photoData={photos.rear}
                  onCapture={handlePhotoCapture}
                  disabled={isSubmitting}
                />
                <PhotoCaptureButton
                  position="left"
                  label={photoPositionLabels.left}
                  photoData={photos.left}
                  onCapture={handlePhotoCapture}
                  disabled={isSubmitting}
                />
                <PhotoCaptureButton
                  position="right"
                  label={photoPositionLabels.right}
                  photoData={photos.right}
                  onCapture={handlePhotoCapture}
                  disabled={isSubmitting}
                />
                {/* エンジンルーム */}
                <PhotoCaptureButton
                  position="engine"
                  label={photoPositionLabels.engine}
                  photoData={photos.engine}
                  onCapture={handlePhotoCapture}
                  disabled={isSubmitting}
                />
                {/* 室内・内装 */}
                <PhotoCaptureButton
                  position="interior"
                  label={photoPositionLabels.interior}
                  photoData={photos.interior}
                  onCapture={handlePhotoCapture}
                  disabled={isSubmitting}
                />
                {/* 下回り・足回り */}
                <PhotoCaptureButton
                  position="undercarriage"
                  label={photoPositionLabels.undercarriage}
                  photoData={photos.undercarriage}
                  onCapture={handlePhotoCapture}
                  disabled={isSubmitting}
                />
                {/* ダッシュボード */}
                <PhotoCaptureButton
                  position="dashboard"
                  label={photoPositionLabels.dashboard}
                  photoData={photos.dashboard}
                  onCapture={handlePhotoCapture}
                  disabled={isSubmitting}
                />
                {/* 損傷箇所 */}
                <PhotoCaptureButton
                  position="damage"
                  label={photoPositionLabels.damage}
                  photoData={photos.damage}
                  onCapture={handlePhotoCapture}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* OBD診断結果セクション（12ヵ月点検の場合のみ） */}
        {is12MonthInspection && (
          <>
            <OBDDiagnosticResultSection
              result={obdDiagnosticResult}
              onUpload={handleOBDDiagnosticUpload}
              onRemove={handleOBDDiagnosticRemove}
              disabled={isSubmitting}
              className="mb-4"
            />
            {/* 拡張OBD診断結果セクション（改善提案 #4） */}
            <EnhancedOBDDiagnosticSection
              result={enhancedOBDDiagnosticResult}
              onChange={(result) => setEnhancedOBDDiagnosticResult(result)}
              disabled={isSubmitting}
              className="mb-4"
            />
          </>
        )}

        {/* 診断機結果セクション（修理・整備の場合のみ） */}
        {isRepair && (
          <>
            <OBDDiagnosticResultSection
              result={repairDiagnosticToolResult}
              onUpload={handleRepairDiagnosticToolUpload}
              onRemove={handleRepairDiagnosticToolRemove}
              disabled={isSubmitting}
              className="mb-4"
            />
            {/* 拡張OBD診断結果セクション（改善提案 #4） */}
            <EnhancedOBDDiagnosticSection
              result={enhancedOBDDiagnosticResult}
              onChange={(result) => setEnhancedOBDDiagnosticResult(result)}
              disabled={isSubmitting}
              className="mb-4"
            />
          </>
        )}

        {/* 診断チェックリスト */}
        {is24MonthInspection ? (
          /* 24ヶ月点検（車検）リデザイン版 */
          <div className="space-y-6 mb-4">
            {/* 点検時の総走行距離（ページの最初に独立したセクション） */}
            <Card className="border-slate-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2 dark:text-white">
                  <Gauge className="h-5 w-5 text-slate-600 shrink-0 dark:text-white" />
                  点検時の総走行距離
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Input
                    id="mileage"
                    type="number"
                    inputMode="numeric"
                    value={mileage !== null && mileage !== undefined ? mileage.toString() : ""}
                    onChange={(e) => handleMileageInputChange(e.target.value)}
                    onBlur={handleMileageBlur}
                    placeholder="走行距離を入力"
                    disabled={isUpdatingMileage || isSubmitting}
                    className="h-14 text-xl flex-1"
                  />
                  <span className="text-xl font-medium text-slate-700 dark:text-white">km / mi</span>
                </div>
                {mileage !== null && mileage !== undefined && (
                  <p className="text-base text-slate-700 mt-2 dark:text-white">
                    現在: {mileage.toLocaleString()} km / {Math.round(mileage * 0.621371).toLocaleString()} mi
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 点検項目 */}
            <Card className="border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-3xl font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                  <ClipboardList className="h-9 w-9 text-slate-600 shrink-0 dark:text-white" />
                  点検項目
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <InspectionRedesignTabs
                  items={inspectionItemsRedesign}
                  type="24month"
                  activeCategory={activeInspectionCategory || undefined}
                  onCategoryChange={(category) => {
                    setActiveInspectionCategory(
                      category as InspectionCategory12Month | InspectionCategory24Month
                    );
                  }}
                >
                  {(category) => {
                    const categoryItems = inspectionItemsRedesign.filter((item) => item.category === category);
                    const categories = getInspectionCategories("24month");
                    const categoryLabel = INSPECTION_CATEGORY_24MONTH_LABELS[category as InspectionCategory24Month];

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

            {/* 
              測定値記入欄は各点検項目のフロー内で入力するため削除
              - CO/HC濃度: 「CO、HCの濃度」項目の入力時に測定値を入力
              - タイヤの溝の深さ: 「タイヤの溝の深さ、異状摩耗」項目の入力時に測定値を入力
              - ブレーキパッド/ライニングの厚さ: 「ブレーキ・パッドの摩耗」項目の入力時に測定値を入力

              交換部品等はPhase 5（整備・完成検査）に移動
              理由: 受入点検では「発見」のみを記録し、実際の交換部品は作業時に記録する
            */}

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
              disabled={isSubmitting}
            />

            {/* 
              品質管理・最終検査はPhase 5（作業画面）に移動
              コンセプト: 完成検査は整備完了後に行うため、受入点検（Phase 2）では実施しない

              整備アドバイスはPhase 5（作業画面）に移動
              コンセプト: 整備アドバイスは整備作業完了後に提供するため、受入点検（Phase 2）では実施しない
            */}
          </div>
        ) : isInspection ? (
          /* 12ヶ月点検（従来版） */
          <div className="mb-4">
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
          </div>
        ) : isEngineOilChange ? (
          <div className="mb-4">
            <EngineOilInspectionView
              items={engineOilInspectionItems}
              onStatusChange={handleEngineOilStatusChange}
              onPhotoCapture={handleEngineOilPhotoCapture}
              onCommentChange={handleEngineOilCommentChange}
              photoDataMap={engineOilPhotoData}
              disabled={isSubmitting}
            />
          </div>
        ) : isTireReplacement ? (
          <div className="mb-4">
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
          </div>
        ) : isMaintenance ? (
          <div className="space-y-4 mb-4">
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
          <div className="space-y-4 mb-4">
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
          <div className="mb-4">
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
          </div>
        ) : isBodyPaint ? (
          <div className="mb-4">
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
          </div>
        ) : isRestore ? (
          <div className="space-y-4 mb-4">
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
            {/* レストア作業進捗セクション（改善提案 #4） */}
            <RestoreProgressSection
              progress={restoreProgress}
              onChange={(progress) => setRestoreProgress(progress)}
              disabled={isSubmitting}
              className="mb-4"
            />
          </div>
        ) : isOther ? (
          <div className="mb-4">
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
          </div>
        ) : isFaultDiagnosis ? (
          <div className="space-y-4 mb-4">
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
              errorLampInfo={errorLampInfo || undefined}
              notes={faultNotes}
              onNotesChange={setFaultNotes}
              disabled={isSubmitting}
            />
            {/* 拡張OBD診断結果セクション（改善提案 #4） */}
            <EnhancedOBDDiagnosticSection
              result={enhancedOBDDiagnosticResult}
              onChange={(result) => setEnhancedOBDDiagnosticResult(result)}
              disabled={isSubmitting}
            />
          </div>
        ) : (
          <Card className="mb-4 border border-slate-300 rounded-xl shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
                <span className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-slate-700 shrink-0" />
                  診断チェックリスト
                </span>
                <div className="flex gap-2">
                  {redCount > 0 && (
                    <Badge variant="destructive" className="text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"><span className="tabular-nums">{redCount}</span>件 要交換</Badge>
                  )}
                  <Badge variant={checkedCount === checkItems.length ? "default" : "secondary"} className="text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                    <span className="tabular-nums">{checkedCount}</span>/<span className="tabular-nums">{checkItems.length}</span>
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => {
                  const items = itemsByCategory[category] || [];
                  const isOpen = openCategories.has(category);
                  const hasIncomplete = hasIncompleteItems(category);
                  const isComplete = isCategoryComplete(category);

                  return (
                    <Collapsible
                      key={category}
                      open={isOpen}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between h-12 text-base font-medium text-slate-900 hover:bg-slate-100"
                          aria-label={`${category}カテゴリを${isOpen ? "閉じる" : "開く"}`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{category}</span>
                            {hasIncomplete && (
                              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-label="未入力項目あり" />
                            )}
                            {isComplete && (
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" aria-label="完了" />
                            )}
                            <Badge variant="secondary" className="text-base font-medium px-2 py-0.5">
                              {items.length}件
                            </Badge>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="divide-y divide-slate-100 pt-2">
                          {items.map((item) => (
                            <CheckItemRow
                              key={item.id}
                              item={item}
                              onStatusChange={handleStatusChange}
                              disabled={isSubmitting}
                            />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 品質管理・最終検査セクション（24ヶ月点検以外） */}
        {!is24MonthInspection && (
          <QualityInspectionSection
            inspection={qualityInspection}
            onChange={(inspection) => setQualityInspection(inspection)}
            disabled={isSubmitting}
            className="mb-4"
          />
        )}

        {/* メーカー問い合わせセクション（24ヶ月点検以外） */}
        {!is24MonthInspection && (
          <ManufacturerInquirySection
            inquiry={manufacturerInquiry}
            onChange={(inquiry) => setManufacturerInquiry(inquiry)}
            disabled={isSubmitting}
            className="mb-4"
          />
        )}

        {/* 作業メモセクション */}
        <Card className="mb-4 border border-slate-300 rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-3xl font-semibold text-slate-900 dark:text-white">
              <Notebook className="h-9 w-9 shrink-0 dark:text-white" />
              作業メモ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              // メモを取得
              const memosFromField26 = job.field26
                ? parseJobMemosFromField26(job.field26)
                : [];
              const memosFromJob = job.jobMemos || [];
              const allMemos = memosFromField26.length > 0 ? memosFromField26 : memosFromJob;
              const sortedMemos = [...allMemos].sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA; // 降順（新しい順）
              });
              const latestMemo = sortedMemos[0];

              return (
                <>
                  {latestMemo ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                      <div className="flex items-center gap-2 text-base text-slate-700 mb-1">
                        <span>{latestMemo.author}</span>
                        <span>•</span>
                        <span>
                          {new Date(latestMemo.createdAt).toLocaleString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Asia/Tokyo",
                          })}
                        </span>
                      </div>
                      <p className="text-base text-slate-800 line-clamp-2 whitespace-pre-wrap">
                        {latestMemo.content}
                      </p>
                    </div>
                  ) : (
                    <p className="text-base text-slate-700 text-center py-2">
                      メモがありません
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base font-medium"
                    onClick={() => setIsJobMemoDialogOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Notebook className="h-4 w-4 mr-2 shrink-0" />
                    メモを追加/編集
                    {allMemos.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap">
                        <span className="tabular-nums">{allMemos.length}</span>
                      </Badge>
                    )}
                  </Button>
                </>
              );
            })()}
          </CardContent>
        </Card>

        {/* 診断料金入力セクション（24ヶ月点検以外） */}
        {!is24MonthInspection && (
          <Card className="mb-4 border border-slate-300 rounded-xl shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Calculator className="h-5 w-5 text-orange-700 shrink-0" />
                診断料金（任意）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 診断時間（概算） */}
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5 text-slate-700 shrink-0" />
                  診断時間（概算）
                </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={diagnosisDuration || ""}
                  onChange={(e) => {
                    const duration = parseInt(e.target.value);
                    setDiagnosisDuration(isNaN(duration) ? null : duration);
                  }}
                  placeholder="分"
                  className="w-24"
                  disabled={isSubmitting}
                />
                <span className="text-base text-slate-700">分</span>
              </div>
              <p className="text-base text-slate-700">
                参考情報として記録します（厳密な時間計測不要）
              </p>
            </div>

            {/* 診断料金選択 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">診断料金</Label>
              <Select
                value={diagnosisFee === null ? "custom" : diagnosisFee.toString()}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setDiagnosisFee(null);
                  } else {
                    const fee = parseInt(value);
                    setDiagnosisFee(fee);
                  }
                }}
                disabled={isSubmitting || isRegularCustomer}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="診断料金を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">無料</SelectItem>
                  <SelectItem value="3000">¥3,000</SelectItem>
                  <SelectItem value="5000">¥5,000</SelectItem>
                  <SelectItem value="10000">¥10,000</SelectItem>
                  <SelectItem value="custom">その他（手動入力）</SelectItem>
                </SelectContent>
              </Select>

              {/* その他の場合の手動入力 */}
              {diagnosisFee === null && (
                <Input
                  type="number"
                  min="0"
                  value=""
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setDiagnosisFee(isNaN(value) ? null : value);
                  }}
                  placeholder="金額を入力（円）"
                  className="h-12"
                  disabled={isSubmitting}
                />
              )}

              {/* 常連顧客の場合の表示 */}
              {isRegularCustomer && (
                <div className="flex items-center gap-2 text-base text-green-700 bg-green-50 p-2 rounded-md">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>常連顧客のため自動で無料に設定されています（上書き可能）</span>
                </div>
              )}

              <p className="text-base text-slate-700">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 shrink-0 text-slate-700" />
                  注意: 見積画面でも変更可能です
                </span>
              </p>
            </div>

            {/* 診断担当者 */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <User className="h-5 w-5 text-slate-700 shrink-0" />
                診断担当者
              </Label>
              <Input
                type="text"
                value={diagnosisMechanic}
                onChange={(e) => setDiagnosisMechanic(e.target.value)}
                placeholder="診断担当者の名前を入力"
                className="h-12 text-base"
                disabled={isSubmitting}
              />
              <p className="text-base text-slate-700">
                診断を実施した整備士の名前を入力してください
              </p>
            </div>
          </CardContent>
        </Card>
        )}
      </main>

      {/* 完了ボタン（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-4">
          {/* プレビューボタン（左側） */}
          <Button
            onClick={handleOpenPreview}
            variant="outline"
            size="lg"
            className="flex-1 h-24 text-2xl font-medium gap-2"
            disabled={isSubmitting}
          >
            <Eye className="h-8 w-8 shrink-0" />
            プレビュー
          </Button>
          {/* 点検/診断完了ボタン（右側） */}
          <Button
            onClick={handleComplete}
            size="lg"
            className="flex-1 h-24 text-2xl font-medium gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-8 w-8 shrink-0" />
                {is24MonthInspection || is12MonthInspection ? "点検完了" : "診断完了"}
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

      {/* 診断料金入力ダイアログ */}
      <DiagnosisFeeDialog
        open={isDiagnosisFeeDialogOpen}
        onOpenChange={(open) => {
          setIsDiagnosisFeeDialogOpen(open);
          if (!open) {
            setPendingCompleteAction(null);
          }
        }}
        diagnosisFee={diagnosisFee}
        onDiagnosisFeeChange={setDiagnosisFee}
        diagnosisDuration={diagnosisDuration}
        onDiagnosisDurationChange={setDiagnosisDuration}
        isRegularCustomer={isRegularCustomer}
        onConfirm={() => {
          // 診断料金入力後、一時帰宅/入庫選択ダイアログを表示
          setIsDiagnosisFeeDialogOpen(false);
          setIsTemporaryReturnDialogOpen(true);
          setPendingTemporaryReturnAction(() => {
            if (pendingCompleteAction) {
              return pendingCompleteAction;
            }
            return () => { };
          });
          setPendingCompleteAction(null);
        }}
        disabled={isSubmitting}
      />

      {/* 一時帰宅/入庫選択ダイアログ */}
      <TemporaryReturnDialog
        open={isTemporaryReturnDialogOpen}
        onOpenChange={(open) => {
          setIsTemporaryReturnDialogOpen(open);
          if (!open) {
            setPendingTemporaryReturnAction(null);
          }
        }}
        isTemporaryReturn={isTemporaryReturn}
        onTemporaryReturnChange={setIsTemporaryReturn}
        reentryDateTime={reentryDateTime}
        onReentryDateTimeChange={setReentryDateTime}
        onConfirm={() => {
          if (pendingTemporaryReturnAction) {
            pendingTemporaryReturnAction();
            setPendingTemporaryReturnAction(null);
          }
        }}
        disabled={isSubmitting}
      />

      {/* 診断結果プレビューダイアログ（改善提案 #15） */}
      <DiagnosisPreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        job={job}
        diagnosisItems={
          is24MonthInspection
            ? inspectionItemsRedesign
                .filter((item) => item.status !== "none")
                .map((item, index) => ({
                  id: item.id,
                  name: item.label,
                  status: item.status === "good" ? "green" : item.status === "exchange" ? "red" : item.status,
                  comment: item.comment || null,
                  value: undefined,
                  index,
                  photoUrls: item.photoUrls || [],
                  videoUrls: item.videoUrls || [],
                  videoData: item.videoData || [],
                }))
            : isInspection
            ? inspectionItems.map((item, index) => ({
              id: item.id,
              name: item.name,
              status: item.status,
              comment: item.comment || null,
              value: item.measurementValue
                ? `${item.measurementValue}`
                : undefined,
              index, // プレビューからの編集用にindexを追加
            }))
            : checkItems.map((item, index) => ({
              id: item.id,
              name: item.name,
              status: item.status,
              comment: null,
              value: undefined,
              index, // プレビューからの編集用にindexを追加
            }))
        }
        photos={Object.values(photos)
          .filter((p) => p.file)
          .map((p, index) => ({
            id: `photo-${p.position}-${index}`,
            previewUrl: p.previewUrl || "",
            position: p.position,
          }))}
        onEdit={handleEditFromPreview}
        onSave={handleSaveFromPreview}
        onPhotosChange={(updatedPhotos) => {
          // 写真の順番を更新・削除処理
          const updatedPhotoData: Partial<Record<PhotoPosition, PhotoData>> = {};

          // updatedPhotosに含まれる写真のみを保持
          updatedPhotos.forEach((updatedPhoto) => {
            // 既存の写真データから該当するものを探す（previewUrlで一致）
            const existingPhoto = Object.values(photos).find(
              (p) => p.previewUrl === updatedPhoto.previewUrl
            );

            if (existingPhoto) {
              // 既存の写真データを保持（positionは変更しない）
              updatedPhotoData[existingPhoto.position] = existingPhoto;
            }
          });

          // すべての位置について、更新されたデータまたはデフォルト値を設定
          const finalPhotoData: Record<PhotoPosition, PhotoData> = {
            front: updatedPhotoData.front ?? { position: "front", file: null, previewUrl: null, isCompressing: false },
            rear: updatedPhotoData.rear ?? { position: "rear", file: null, previewUrl: null, isCompressing: false },
            left: updatedPhotoData.left ?? { position: "left", file: null, previewUrl: null, isCompressing: false },
            right: updatedPhotoData.right ?? { position: "right", file: null, previewUrl: null, isCompressing: false },
            engine: updatedPhotoData.engine ?? { position: "engine", file: null, previewUrl: null, isCompressing: false },
            interior: updatedPhotoData.interior ?? { position: "interior", file: null, previewUrl: null, isCompressing: false },
            undercarriage: updatedPhotoData.undercarriage ?? { position: "undercarriage", file: null, previewUrl: null, isCompressing: false },
            dashboard: updatedPhotoData.dashboard ?? { position: "dashboard", file: null, previewUrl: null, isCompressing: false },
            damage: updatedPhotoData.damage ?? { position: "damage", file: null, previewUrl: null, isCompressing: false },
          };

          // 状態を更新（削除された写真は自動的に除外される）
          setPhotos(finalPhotoData);
        }}
        // 24ヶ月点検リデザイン版の追加props
        is24MonthInspection={is24MonthInspection}
        inspectionMeasurements={inspectionMeasurements}
        inspectionParts={inspectionPartsData}
        customParts={customPartsData}
        qualityCheckData={qualityCheckData || undefined}
        maintenanceAdvice={maintenanceAdvice}
        additionalEstimateRequired={additionalEstimateRequired}
        additionalEstimateRecommended={additionalEstimateRecommended}
        additionalEstimateOptional={additionalEstimateOptional}
      />

      {/* 作業メモダイアログ */}
      <JobMemoDialog
        open={isJobMemoDialogOpen}
        onOpenChange={setIsJobMemoDialogOpen}
        job={job}
        onSuccess={async () => {
          // メモ更新後にジョブデータを再取得してUIを更新
          if (job) {
            await mutateJob();
          }
        }}
      />

      {/* 競合解決ダイアログ */}
      {conflictInfo && (
        <ConflictResolutionDialog
          open={isConflictDialogOpen}
          onOpenChange={setIsConflictDialogOpen}
          onReload={async () => {
            setIsConflictDialogOpen(false);
            await mutateJob();
            toast.info("最新のデータを読み込みました。再度保存してください。");
          }}
          onOverwrite={async () => {
            setIsConflictDialogOpen(false);
            // バージョン番号を無視して上書き保存
            try {
              // 現在の診断データを再構築
              const currentDiagnosisData = buildDiagnosisData();
              const photoData = Object.values(photos)
                .filter((p) => p.file)
                .map((p) => ({
                  position: p.position,
                  url: p.previewUrl || "",
                }));

              const saveResult = await saveDiagnosis(jobId, undefined, {
                items: currentDiagnosisData.items || [],
                photos: photoData,
                mileage: mileage !== null && mileage !== undefined ? mileage : undefined, // 更新された走行距離を反映
                version: null, // バージョンチェックをスキップ
                enhancedOBDDiagnosticResult: currentDiagnosisData.enhancedOBDDiagnosticResult || undefined,
                qualityInspection: currentDiagnosisData.qualityInspection || undefined,
                manufacturerInquiry: currentDiagnosisData.manufacturerInquiry || undefined,
                isComplete: false, // 競合解決時の上書き保存は一時保存として扱う（ステータス変更なし）
              });
              if (saveResult.success) {
                await mutateJob();
                toast.success("診断データを上書き保存しました");
              } else {
                throw new Error(saveResult.error?.message || "診断の保存に失敗しました");
              }
            } catch (error) {
              console.error("上書き保存エラー:", error);
              toast.error("上書き保存に失敗しました", {
                description: error instanceof Error ? error.message : "不明なエラーが発生しました",
              });
            }
          }}
          onCancel={() => {
            setIsConflictDialogOpen(false);
            setConflictInfo(null);
          }}
          currentVersion={conflictInfo.currentVersion}
          submittedVersion={conflictInfo.submittedVersion}
        />
      )}

    </div>
  );
}

export default function DiagnosisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700">読み込み中...</p>
        </div>
      </div>
    }>
      <DiagnosisPageContent />
    </Suspense>
  );
}
