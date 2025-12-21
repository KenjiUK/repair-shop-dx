"use client";

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchJobById, createEstimate, updateJobStatus, updateJobBaseSystemId, fetchCustomerById, fetchAllCourtesyCars } from "@/lib/api";
import { generateMagicLink, sendLineNotification } from "@/lib/line-api";
import { searchInvoicePdf, getOrCreateJobFolder } from "@/lib/google-drive";
import { toast } from "sonner";
import { EstimatePriority, ZohoJob, ServiceKind, EstimateItem, DriveFile, DiagnosisItem } from "@/types";
import { LegalFeesCard } from "@/components/features/legal-fees-card";
import { getLegalFees } from "@/lib/legal-fees";
import { addDiagnosisItemsToEstimate, addTireDiagnosisItemsToEstimate, addMaintenanceDiagnosisItemsToEstimate, addTuningPartsDiagnosisItemsToEstimate, addCoatingDiagnosisItemsToEstimate } from "@/lib/diagnosis-to-estimate";
import { VEHICLE_INSPECTION_ITEMS, InspectionItem } from "@/lib/inspection-items";
import { TireInspectionItem, getInitialTireInspectionItems } from "@/lib/tire-inspection-items";
import { MaintenanceInspectionItemState, getInitialMaintenanceInspectionItems } from "@/components/features/maintenance-inspection-view";
import { getMaintenanceMenuConfig, MaintenanceType } from "@/lib/maintenance-menu-config";
import { TuningPartsInspectionItem, getInitialTuningPartsInspectionItems } from "@/components/features/tuning-parts-inspection-view";
import { TuningPartsType } from "@/lib/tuning-parts-config";
import { BodyConditionCheck, getInitialBodyConditionChecks, BodyConditionStatus } from "@/components/features/coating-inspection-view";
import { OptionMenuSelector } from "@/components/features/option-menu-selector";
import { OptionMenuItem } from "@/types";
import { FaultDiagnosisEstimateView } from "@/components/features/fault-diagnosis-estimate-view";
import { OBDDiagnosticResult } from "@/components/features/obd-diagnostic-result-section";
import { PartsListInput, PartsListItem } from "@/components/features/parts-list-input";
import { AudioInputButton, AudioData } from "@/components/features/audio-input-button";
import { useWorkOrders, updateWorkOrder } from "@/hooks/use-work-orders";
import { WorkOrderSelector } from "@/components/features/work-order-selector";
import { AddWorkOrderDialog } from "@/components/features/add-work-order-dialog";
import { InvoiceUpload } from "@/components/features/invoice-upload";
import { BodyPaintEstimateView, BodyPaintEstimateData } from "@/components/features/body-paint-estimate-view";
import { VendorEstimate } from "@/components/features/body-paint-diagnosis-view";
import { RestoreEstimateView, RestoreEstimateData } from "@/components/features/restore-estimate-view";
import { OtherServiceEstimateView, OtherServiceEstimateData } from "@/components/features/other-service-estimate-view";
import {
  Car,
  Tag,
  Camera,
  Plus,
  Trash2,
  Eye,
  ChevronLeft,
  AlertCircle,
  XCircle,
  Calculator,
  MessageCircle,
  Loader2,
  AlertOctagon,
  Mic,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { CompactJobHeader } from "@/components/layout/compact-job-header";
import { User } from "lucide-react";

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

// =============================================================================
// Types
// =============================================================================

interface DiagnosisPhoto {
  id: string;
  position: string;
  label: string;
  url: string;
}

interface DiagnosisCheckItem {
  id: string;
  name: string;
  category: string;
  status: "yellow" | "red";
  comment?: string;
}

interface EstimateLineItem {
  id: string;
  name: string;
  price: number;
  priority: EstimatePriority;
  linkedPhotoId: string | null;
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
// Default/Fallback Data（診断データがない場合のフォールバック）
// =============================================================================

const defaultPhotos: DiagnosisPhoto[] = [
  { id: "photo-1", position: "front", label: "前方", url: "https://placehold.co/400x300/e2e8f0/64748b?text=Front" },
  { id: "photo-2", position: "rear", label: "後方", url: "https://placehold.co/400x300/e2e8f0/64748b?text=Rear" },
  { id: "photo-3", position: "left", label: "左側", url: "https://placehold.co/400x300/e2e8f0/64748b?text=Left" },
  { id: "photo-4", position: "right", label: "右側", url: "https://placehold.co/400x300/e2e8f0/64748b?text=Right" },
  { id: "photo-5", position: "detail-1", label: "ブレーキパッド", url: "https://placehold.co/400x300/fecaca/dc2626?text=Brake+Pad" },
  { id: "photo-6", position: "detail-2", label: "タイヤ溝", url: "https://placehold.co/400x300/fef08a/ca8a04?text=Tire" },
];

const defaultFlaggedItems: DiagnosisCheckItem[] = [
  { id: "brake-pad", name: "ブレーキパッド", category: "ブレーキ", status: "red", comment: "残量2mm。即交換推奨。" },
  { id: "tire-front", name: "タイヤ（前輪）", category: "足回り", status: "yellow", comment: "溝残り3mm。次回車検までに交換推奨。" },
  { id: "wiper", name: "ワイパーゴム", category: "外装", status: "yellow", comment: "拭きムラあり。" },
  { id: "battery", name: "バッテリー", category: "電装", status: "yellow", comment: "電圧やや低下。経過観察。" },
];

const defaultEstimateItems: EstimateLineItem[] = [
  { id: "est-1", name: "法定12ヶ月点検", price: 15000, priority: "required", linkedPhotoId: null },
  { id: "est-2", name: "エンジンオイル交換", price: 5500, priority: "required", linkedPhotoId: null },
  { id: "est-3", name: "Fブレーキパッド交換", price: 33000, priority: "recommended", linkedPhotoId: "photo-5" },
];

// =============================================================================
// Helper Functions
// =============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP").format(price);
}

function generateId(): string {
  return `est-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function extractVehicleName(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "車両未登録";
  const parts = vehicleInfo.split(" / ");
  return parts[0] || vehicleInfo;
}

function extractLicensePlate(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "";
  const parts = vehicleInfo.split(" / ");
  return parts[1] || "";
}

// =============================================================================
// Components
// =============================================================================

/**
 * 写真カードコンポーネント
 */
function PhotoCard({ photo, isSelected, onClick }: {
  photo: DiagnosisPhoto;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-slate-300"
      )}
      onClick={onClick}
    >
      <img
        src={photo.url}
        alt={photo.label}
        className="w-full h-24 object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
        <p className="text-xs text-white truncate">{photo.label}</p>
      </div>
    </div>
  );
}

/**
 * 見積行コンポーネント
 */
function EstimateLineRow({
  item,
  photos,
  onUpdate,
  onDelete,
  canDelete,
  disabled,
}: {
  item: EstimateLineItem;
  photos: DiagnosisPhoto[];
  onUpdate: (id: string, updates: Partial<EstimateLineItem>) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 py-2">
      <div className="flex-1 min-w-0">
        <Input
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          placeholder="品名"
          className="h-9"
          disabled={disabled}
        />
      </div>

      <div className="w-28">
        <Input
          type="number"
          value={item.price}
          onChange={(e) => onUpdate(item.id, { price: parseInt(e.target.value) || 0 })}
          placeholder="金額"
          className="h-9 text-right"
          disabled={disabled}
        />
      </div>

      <div className="w-32">
        <Select
          value={item.linkedPhotoId || "none"}
          onValueChange={(value) => onUpdate(item.id, { linkedPhotoId: value === "none" ? null : value })}
          disabled={disabled}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="写真" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">なし</SelectItem>
            {photos.map((photo) => (
              <SelectItem key={photo.id} value={photo.id}>
                {photo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id)}
        disabled={!canDelete || disabled}
        className="h-9 w-9 text-slate-400 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * 見積セクションコンポーネント
 */
function EstimateSection({
  title,
  priority,
  items,
  photos,
  onUpdate,
  onDelete,
  onAdd,
  badgeVariant,
  disabled,
}: {
  title: string;
  priority: EstimatePriority;
  items: EstimateLineItem[];
  photos: DiagnosisPhoto[];
  onUpdate: (id: string, updates: Partial<EstimateLineItem>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  badgeVariant: "default" | "secondary" | "outline";
  disabled?: boolean;
}) {
  const sectionItems = items.filter((item) => item.priority === priority);
  const sectionTotal = sectionItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant} className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">{title}</Badge>
          <span className="text-sm text-slate-500">
            {sectionItems.length}件
          </span>
        </div>
        <span className="text-sm font-medium">
          ¥{formatPrice(sectionTotal)}
        </span>
      </div>

      <div className="pl-2 border-l-2 border-slate-200">
        {sectionItems.map((item) => (
          <EstimateLineRow
            key={item.id}
            item={item}
            photos={photos}
            onUpdate={onUpdate}
            onDelete={onDelete}
            canDelete={priority !== "required" || sectionItems.length > 1}
            disabled={disabled}
          />
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          disabled={disabled}
          className="w-full justify-start text-slate-500 hover:text-slate-700"
        >
          <Plus className="h-4 w-4 mr-1 shrink-0" />
          項目を追加
        </Button>
      </div>
    </div>
  );
}

/**
 * ヘッダースケルトン
 */
function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-12" />
            <Separator orientation="vertical" className="h-6" />
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * コンテンツスケルトン
 */
function ContentSkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
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

export default function EstimatePage() {
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
  });

  // ワークオーダーを取得
  const { workOrders, isLoading: isLoadingWorkOrders, mutate: mutateWorkOrders } = useWorkOrders(jobId);
  
  // 代車情報を取得
  const {
    data: courtesyCarsResponse,
  } = useSWR("courtesy-cars", async () => {
    const result = await fetchAllCourtesyCars();
    return result.success ? result.data : [];
  });
  const courtesyCars = courtesyCarsResponse || [];

  // 選択中のワークオーダーを取得
  const selectedWorkOrder = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return null;
    if (workOrderId) {
      return workOrders.find((wo) => wo.id === workOrderId) || workOrders[0];
    }
    return workOrders[0]; // デフォルトは最初のワークオーダー
  }, [workOrders, workOrderId]);

  // 作業追加ダイアログの状態管理
  const [isAddWorkOrderDialogOpen, setIsAddWorkOrderDialogOpen] = useState(false);

  // 基幹システム転記ダイアログの状態管理
  const [isBaseSystemCopyDialogOpen, setIsBaseSystemCopyDialogOpen] = useState(false);
  const [baseSystemItemsText, setBaseSystemItemsText] = useState("");
  const [baseSystemCopyMode, setBaseSystemCopyMode] = useState<"add" | "replace">("add");

  // 見積項目の状態管理
  // エンジンオイル交換の場合は初期状態で空（基本不要、イレギュラー時のみ追加）
  const [estimateItems, setEstimateItems] = useState<EstimateLineItem[]>([]);
  
  // サービス種類を取得
  const serviceKinds = useMemo(() => {
    if (!job) return [];
    return job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  }, [job]);

  // エンジンオイル交換かどうかを判定
  const isEngineOilChange = useMemo(() => {
    return serviceKinds.includes("エンジンオイル交換" as ServiceKind);
  }, [serviceKinds]);

  // タイヤ交換・ローテーションかどうかを判定
  const isTireReplacement = useMemo(() => {
    return serviceKinds.includes("タイヤ交換・ローテーション" as ServiceKind);
  }, [serviceKinds]);

  // その他のメンテナンスかどうかを判定
  const isMaintenance = useMemo(() => {
    return serviceKinds.includes("その他" as ServiceKind);
  }, [serviceKinds]);

  // チューニング・パーツ取付かどうかを判定
  const isTuningParts = useMemo(() => {
    return (
      serviceKinds.includes("チューニング" as ServiceKind) ||
      serviceKinds.includes("パーツ取付" as ServiceKind)
    );
  }, [serviceKinds]);

  // コーティングかどうかを判定
  const isCoating = useMemo(() => {
    return serviceKinds.includes("コーティング" as ServiceKind);
  }, [serviceKinds]);
  
  // エンジンオイル交換でない場合のみデフォルト項目を設定
  // 注意: 実際の診断データがある場合は使用しない
  useEffect(() => {
    if (job && !isEngineOilChange && estimateItems.length === 0 && selectedWorkOrder?.diagnosis) {
      // 診断データがある場合は使用しない
      return;
    }
    if (job && !isEngineOilChange && estimateItems.length === 0 && !selectedWorkOrder?.diagnosis) {
      // 診断データがない場合のみデフォルト項目を設定
      setEstimateItems(defaultEstimateItems);
    }
  }, [job, isEngineOilChange, estimateItems.length, selectedWorkOrder]);

  // 選択中の写真（プレビュー用）
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // 送信中フラグ
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 故障診断用の状態管理
  const [causeExplanation, setCauseExplanation] = useState("");
  const [repairProposal, setRepairProposal] = useState("");
  const [diagnosticToolResult, setDiagnosticToolResult] = useState<OBDDiagnosticResult | undefined>();

  // 修理・整備用の状態管理
  const [partsList, setPartsList] = useState<PartsListItem[]>([]);
  const [audioData, setAudioData] = useState<AudioData | undefined>();

  // 板金・塗装用の状態管理
  const [bodyPaintEstimateData, setBodyPaintEstimateData] = useState<BodyPaintEstimateData | null>(null);
  const [bodyPaintHasInsurance, setBodyPaintHasInsurance] = useState(false);
  const [bodyPaintInsuranceCompany, setBodyPaintInsuranceCompany] = useState("");

  // レストア用の状態管理
  const [restoreEstimateData, setRestoreEstimateData] = useState<RestoreEstimateData | null>(null);

  // その他用の状態管理
  const [otherEstimateData, setOtherEstimateData] = useState<OtherServiceEstimateData | null>(null);

  // 基幹システム明細IDの状態管理（各ワークオーダーごと）
  const [baseSystemItemId, setBaseSystemItemId] = useState<string>("");

  // 既存の請求書PDFの状態管理
  const [existingInvoice, setExistingInvoice] = useState<DriveFile | null>(null);

  // サービス種類を判定（車検かどうか）
  const isInspection = useMemo(() => {
    return serviceKinds.includes("車検" as ServiceKind) || serviceKinds.includes("12ヵ月点検" as ServiceKind);
  }, [serviceKinds]);
  const is12MonthInspection = useMemo(() => {
    return serviceKinds.includes("12ヵ月点検" as ServiceKind);
  }, [serviceKinds]);
  const hasShakenSimultaneously = useMemo(() => {
    return serviceKinds.includes("車検" as ServiceKind) && is12MonthInspection;
  }, [serviceKinds, is12MonthInspection]);
  const isFaultDiagnosis = useMemo(() => {
    return serviceKinds.includes("故障診断" as ServiceKind);
  }, [serviceKinds]);
  const isBodyPaint = useMemo(() => {
    return serviceKinds.includes("板金・塗装" as ServiceKind);
  }, [serviceKinds]);
  const isRestore = useMemo(() => {
    return serviceKinds.includes("レストア" as ServiceKind);
  }, [serviceKinds]);
  const isRepair = useMemo(() => {
    return serviceKinds.includes("修理・整備" as ServiceKind);
  }, [serviceKinds]);
  const isOther = useMemo(() => {
    return serviceKinds.includes("その他" as ServiceKind);
  }, [serviceKinds]);

  // 法定費用の状態管理（車検の場合のみ）
  const [legalFees, setLegalFees] = useState<import("@/lib/legal-fees").LegalFees | null>(null);
  const [isLoadingLegalFees, setIsLoadingLegalFees] = useState(false);

  // 法定費用を取得（車検の場合のみ）
  useEffect(() => {
    if (!job || !isInspection) return;

    const vehicleId = job.field6?.id; // 車両ID（実際の実装では適切なフィールドを使用）
    if (!vehicleId) return;

    setIsLoadingLegalFees(true);
    getLegalFees(vehicleId)
      .then((result) => {
        if (result.success && result.data) {
          setLegalFees(result.data);
        }
      })
      .catch((error) => {
        console.error("法定費用の取得エラー:", error);
        toast.error("法定費用の取得に失敗しました");
      })
      .finally(() => {
        setIsLoadingLegalFees(false);
      });
  }, [job, isInspection]);

  // 診断結果から見積項目を自動追加（車検の場合のみ、初回のみ）
  const [hasAutoAddedItems, setHasAutoAddedItems] = useState(false);
  useEffect(() => {
    if (!isInspection || !workOrders || workOrders.length === 0 || hasAutoAddedItems) return;

    // 車検のワークオーダーを取得
    const inspectionWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "車検" || wo.serviceKind === "12ヵ月点検"
    );

    if (!inspectionWorkOrder?.diagnosis?.items) return;

    // 診断結果を検査項目形式に変換
    const inspectionItems: InspectionItem[] = inspectionWorkOrder.diagnosis.items.map((item: DiagnosisItem) => {
      const templateItem = VEHICLE_INSPECTION_ITEMS.find((t) => t.id === item.id);
      return {
        ...(templateItem || { id: item.id, name: item.name, category: "other" as const, status: "unchecked" }),
        status: item.status as InspectionItem["status"],
        comment: item.comment || undefined,
        photoUrls: item.evidencePhotoUrls,
        videoUrl: item.evidenceVideoUrl || undefined,
      };
    });

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      const estimateItems = addDiagnosisItemsToEstimate(
        prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        })),
        inspectionItems
      );
      
      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = estimateItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
      }));
      
      if (newLineItems.length > prev.length) {
        setHasAutoAddedItems(true);
        toast.success("診断結果から見積項目を自動追加しました");
        return newLineItems;
      }
      return prev;
    });
  }, [isInspection, workOrders, hasAutoAddedItems]);

  // 診断結果から見積項目を自動追加（タイヤ交換・ローテーションの場合のみ、初回のみ）
  const [hasAutoAddedTireItems, setHasAutoAddedTireItems] = useState(false);
  useEffect(() => {
    if (!isTireReplacement || !workOrders || workOrders.length === 0 || hasAutoAddedTireItems) return;

    // タイヤ交換・ローテーションのワークオーダーを取得
    const tireWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "タイヤ交換・ローテーション"
    );

    if (!tireWorkOrder?.diagnosis?.items) return;

    // 診断結果をタイヤ検査項目形式に変換
    const tireInspectionItems: TireInspectionItem[] = tireWorkOrder.diagnosis.items.map((item: DiagnosisItem) => {
      const templateItem = getInitialTireInspectionItems().find((t) => t.id === item.id);
      return {
        ...(templateItem || { id: item.id, name: item.name, category: "tire" as const, status: "unchecked" }),
        status: (item.status === "green" ? "ok" : item.status === "yellow" ? "attention" : item.status === "red" ? "replace" : "unchecked") as TireInspectionItem["status"],
        comment: item.comment || undefined,
        photoUrls: item.evidencePhotoUrls || [],
      };
    });

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      const estimateItems = addTireDiagnosisItemsToEstimate(
        prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        })),
        tireInspectionItems
      );
      
      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = estimateItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
      }));
      
      if (newLineItems.length > prev.length) {
        setHasAutoAddedTireItems(true);
        toast.success("診断結果から見積項目を自動追加しました");
        return newLineItems;
      }
      return prev;
    });
  }, [isTireReplacement, workOrders, hasAutoAddedTireItems]);

  // 診断結果から見積項目を自動追加（その他のメンテナンスの場合のみ、初回のみ）
  const [hasAutoAddedMaintenanceItems, setHasAutoAddedMaintenanceItems] = useState(false);
  useEffect(() => {
    if (!isMaintenance || !workOrders || workOrders.length === 0 || hasAutoAddedMaintenanceItems) return;

    // その他のメンテナンスのワークオーダーを取得
    const maintenanceWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "その他"
    );

    if (!maintenanceWorkOrder?.diagnosis?.items) return;

    // 診断結果からメンテナンスメニューを特定（最初の項目のカテゴリから推測）
    // 実際の実装では、診断データにメンテナンスメニュー情報を含める必要がある
    // 現時点では、診断項目からメニューを推測するか、デフォルトメニューを使用
    const firstItem = maintenanceWorkOrder.diagnosis.items[0];
    if (!firstItem) return;

    // 診断結果をメンテナンス検査項目形式に変換
    // 注意: 実際の実装では、診断データにメンテナンスメニュー情報を含める必要がある
    // 現時点では、簡易実装として最初の項目のカテゴリからメニューを推測
    const maintenanceItems: MaintenanceInspectionItemState[] = maintenanceWorkOrder.diagnosis.items.map((item: DiagnosisItem) => ({
      id: item.id,
      name: item.name,
      category: item.category || "other",
      status: (item.status === "green" ? "ok" : item.status === "yellow" ? "attention" : item.status === "red" ? "replace" : "unchecked") as MaintenanceInspectionItemState["status"],
      comment: item.comment || undefined,
      photoUrls: item.evidencePhotoUrls || [],
    }));

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      const estimateItems = addMaintenanceDiagnosisItemsToEstimate(
        prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        })),
        maintenanceItems
      );
      
      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = estimateItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
      }));
      
      if (newLineItems.length > prev.length) {
        setHasAutoAddedMaintenanceItems(true);
        toast.success("診断結果から見積項目を自動追加しました");
        return newLineItems;
      }
      return prev;
    });
  }, [isMaintenance, workOrders, hasAutoAddedMaintenanceItems]);

  // 診断結果から見積項目を自動追加（チューニング・パーツ取付の場合のみ、初回のみ）
  const [hasAutoAddedTuningPartsItems, setHasAutoAddedTuningPartsItems] = useState(false);
  useEffect(() => {
    if (!isTuningParts || !workOrders || workOrders.length === 0 || hasAutoAddedTuningPartsItems) return;

    // チューニング・パーツ取付のワークオーダーを取得
    const tuningPartsWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "チューニング" || wo.serviceKind === "パーツ取付"
    );

    if (!tuningPartsWorkOrder?.diagnosis?.items) return;

    // 診断結果をチューニング・パーツ取付検査項目形式に変換
    // 注意: 実際の実装では、診断データにチューニング・パーツ取付の種類情報を含める必要がある
    // 現時点では、簡易実装として診断項目から推測
    const tuningPartsItems: TuningPartsInspectionItem[] = tuningPartsWorkOrder.diagnosis.items.map((item: DiagnosisItem) => ({
      id: item.id,
      name: item.name,
      category: item.category || "other",
      status: (item.status === "green" ? "ok" : item.status === "yellow" ? "attention" : item.status === "red" ? "replace" : "unchecked") as TuningPartsInspectionItem["status"],
      comment: item.comment || undefined,
      photoUrls: item.evidencePhotoUrls || [],
    }));

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      const estimateItems = addTuningPartsDiagnosisItemsToEstimate(
        prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        })),
        tuningPartsItems
      );
      
      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = estimateItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
      }));
      
      if (newLineItems.length > prev.length) {
        setHasAutoAddedTuningPartsItems(true);
        toast.success("診断結果から見積項目を自動追加しました");
        return newLineItems;
      }
      return prev;
    });
  }, [isTuningParts, workOrders, hasAutoAddedTuningPartsItems]);

  // 診断結果から見積項目を自動追加（コーティングの場合のみ、初回のみ）
  const [hasAutoAddedCoatingItems, setHasAutoAddedCoatingItems] = useState(false);
  useEffect(() => {
    if (!isCoating || !workOrders || workOrders.length === 0 || hasAutoAddedCoatingItems) return;

    // コーティングのワークオーダーを取得
    const coatingWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "コーティング"
    );

    if (!coatingWorkOrder?.diagnosis?.items) return;

    // 診断結果を車体状態確認形式に変換
    const bodyConditions: BodyConditionCheck[] = coatingWorkOrder.diagnosis.items.map((item: DiagnosisItem) => {
      // 診断項目のstatusから車体状態を推測
      let condition: BodyConditionStatus = "unchecked";
      if (item.status === "red") {
        condition = "深刻な傷";
      } else if (item.status === "yellow") {
        condition = "軽微な傷";
      } else if (item.status === "green") {
        condition = "良好";
      }

      return {
        id: item.id,
        location: item.name,
        condition,
        comment: item.comment || undefined,
        photoUrls: item.evidencePhotoUrls || [],
      };
    });

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      const estimateItems = addCoatingDiagnosisItemsToEstimate(
        prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        })),
        bodyConditions
      );
      
      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = estimateItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
      }));
      
      if (newLineItems.length > prev.length) {
        setHasAutoAddedCoatingItems(true);
        toast.success("診断結果から見積項目を自動追加しました");
        return newLineItems;
      }
      return prev;
    });
  }, [isCoating, workOrders, hasAutoAddedCoatingItems]);

  // オプションメニューの状態管理（12ヵ月点検の場合のみ）
  const [selectedOptionMenuIds, setSelectedOptionMenuIds] = useState<string[]>([]);
  
  // オプションメニューのモックデータ（実際の実装ではAPIから取得）
  const optionMenus: OptionMenuItem[] = [
    {
      id: "opt-1",
      name: "エンジンオイル交換",
      description: "高品質エンジンオイルに交換",
      originalPrice: 8000,
      discountedPrice: 7200,
      badge: { text: "人気", color: "green" },
      estimatedTime: "30分",
      category: "maintenance",
    },
    {
      id: "opt-2",
      name: "エアコンフィルター交換",
      description: "エアコンフィルターを新品に交換",
      originalPrice: 5000,
      discountedPrice: 4500,
      badge: { text: "推奨", color: "blue" },
      estimatedTime: "20分",
      category: "maintenance",
    },
    {
      id: "opt-3",
      name: "ブレーキフルード交換",
      description: "ブレーキフルードを新品に交換",
      originalPrice: 12000,
      discountedPrice: 10800,
      badge: { text: "安全", color: "green" },
      estimatedTime: "40分",
      category: "maintenance",
    },
    {
      id: "opt-4",
      name: "タイヤローテーション",
      description: "タイヤの位置を入れ替えて均等に摩耗",
      originalPrice: 3000,
      discountedPrice: 2700,
      badge: { text: "推奨", color: "blue" },
      estimatedTime: "30分",
      category: "maintenance",
    },
    {
      id: "opt-5",
      name: "バッテリー交換",
      description: "バッテリーを新品に交換",
      originalPrice: 15000,
      discountedPrice: 13500,
      badge: { text: "安全", color: "green" },
      estimatedTime: "30分",
      category: "maintenance",
    },
    {
      id: "opt-6",
      name: "ワイパーゴム交換",
      description: "ワイパーゴムを新品に交換",
      originalPrice: 4000,
      discountedPrice: 3600,
      badge: { text: "推奨", color: "blue" },
      estimatedTime: "20分",
      category: "maintenance",
    },
    {
      id: "opt-7",
      name: "エンジンルーム清掃",
      description: "エンジンルームを徹底清掃",
      originalPrice: 6000,
      discountedPrice: 5400,
      badge: { text: "オプション", color: "blue" },
      estimatedTime: "60分",
      category: "maintenance",
    },
    {
      id: "opt-8",
      name: "室内清掃",
      description: "車内を徹底清掃",
      originalPrice: 5000,
      discountedPrice: 4500,
      badge: { text: "オプション", color: "blue" },
      estimatedTime: "45分",
      category: "maintenance",
    },
  ];

  // オプションメニュー選択変更ハンドラ
  const handleOptionMenuSelectionChange = (menuId: string, selected: boolean) => {
    if (selected) {
      setSelectedOptionMenuIds((prev) => [...prev, menuId]);
      
      // 選択されたメニューを見積項目に追加
      const menu = optionMenus.find((m) => m.id === menuId);
      if (menu) {
        const newItem: EstimateLineItem = {
          id: `opt-${menuId}-${Date.now()}`,
          name: menu.name,
          price: hasShakenSimultaneously ? menu.discountedPrice : menu.originalPrice,
          priority: "recommended",
          linkedPhotoId: null,
        };
        setEstimateItems((prev) => [...prev, newItem]);
        toast.success(`${menu.name}を見積項目に追加しました`);
      }
    } else {
      setSelectedOptionMenuIds((prev) => prev.filter((id) => id !== menuId));
      
      // 見積項目から削除
      setEstimateItems((prev) => prev.filter((item) => !item.id.startsWith(`opt-${menuId}-`)));
    }
  };

  // 診断データ（ワークオーダーから取得、なければフォールバック）
  const photos = useMemo(() => {
    if (selectedWorkOrder?.diagnosis?.photos && selectedWorkOrder.diagnosis.photos.length > 0) {
      return selectedWorkOrder.diagnosis.photos.map((photo: { position: string; url: string }, index: number) => ({
        id: `photo-${index}`,
        position: photo.position as any,
        label: photo.position,
        url: photo.url,
      }));
    }
    return defaultPhotos;
  }, [selectedWorkOrder]);

  const flaggedItems = useMemo(() => {
    if (selectedWorkOrder?.diagnosis?.items && selectedWorkOrder.diagnosis.items.length > 0) {
      return selectedWorkOrder.diagnosis.items
        .filter((item: DiagnosisItem) => item.status !== "green" && item.status !== "unchecked")
        .map((item: DiagnosisItem) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          status: item.status as any,
          comment: item.comment || undefined,
        }));
    }
    return defaultFlaggedItems;
  }, [selectedWorkOrder]);

  // 選択中のワークオーダーのbaseSystemItemIdを取得・設定
  useEffect(() => {
    if (selectedWorkOrder?.baseSystemItemId) {
      setBaseSystemItemId(selectedWorkOrder.baseSystemItemId);
    } else {
      setBaseSystemItemId("");
    }
  }, [selectedWorkOrder]);

  /**
   * 基幹システムから見積項目を転記
   */
  const handleCopyFromBaseSystem = async () => {
    if (!baseSystemItemsText.trim()) {
      toast.error("転記する内容を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      // 基幹システムのテキストをパース（CSV形式：品名,金額（税込））
      const lines = baseSystemItemsText.trim().split("\n").filter((line) => line.trim());
      const newItems: EstimateLineItem[] = [];

      for (const line of lines) {
        // CSV形式でパース：カンマ区切りで「品名,金額」を抽出
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // カンマで分割
        const parts = trimmedLine.split(",").map((p) => p.trim());
        
        if (parts.length >= 2) {
          const name = parts[0];
          // 金額部分から数値のみを抽出（カンマや円記号を除去）
          const priceStr = parts[1].replace(/[^\d]/g, "");
          const price = parseInt(priceStr) || 0;

          if (name && price > 0) {
            newItems.push({
              id: generateId(),
              name,
              price,
              priority: "required",
              linkedPhotoId: null,
            });
          }
        } else if (parts.length === 1) {
          // カンマがない場合、スペース区切りで試行（後方互換性）
          const spaceParts = trimmedLine.split(/\s+/);
          if (spaceParts.length >= 2) {
            const name = spaceParts.slice(0, -1).join(" ");
            const priceStr = spaceParts[spaceParts.length - 1].replace(/[^\d]/g, "");
            const price = parseInt(priceStr) || 0;

            if (name && price > 0) {
              newItems.push({
                id: generateId(),
                name,
                price,
                priority: "required",
                linkedPhotoId: null,
              });
            }
          }
        }
      }

      if (newItems.length === 0) {
        toast.error("有効な見積項目が見つかりませんでした", {
          description: "形式：品名,金額（税込）で入力してください",
        });
        return;
      }

      // 見積項目に追加または置き換え
      if (baseSystemCopyMode === "replace") {
        setEstimateItems(newItems);
        toast.success(`${newItems.length}件の見積項目に置き換えました`);
      } else {
        setEstimateItems((prev) => [...prev, ...newItems]);
        toast.success(`${newItems.length}件の見積項目を追加しました`);
      }

      setIsBaseSystemCopyDialogOpen(false);
      setBaseSystemItemsText("");
    } catch (error) {
      console.error("基幹システム転記エラー:", error);
      toast.error("転記に失敗しました", {
        description: error instanceof Error ? error.message : "予期しないエラーが発生しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 既存の見積データを読み込む
  useEffect(() => {
    if (!selectedWorkOrder?.estimate) return;

    const estimate = selectedWorkOrder.estimate;
    
    // 見積項目を読み込む
    if (estimate.items && estimate.items.length > 0) {
      const lineItems: EstimateLineItem[] = estimate.items.map((item: EstimateItem) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
      }));
      setEstimateItems(lineItems);
    }

    // 故障診断固有情報を読み込む
    if (estimate.faultDiagnosisInfo) {
      const faultInfo = estimate.faultDiagnosisInfo as {
        causeExplanation?: string;
        repairProposal?: string;
        diagnosticToolResultFileId?: string;
        diagnosticToolResultUrl?: string;
      };
      setCauseExplanation(faultInfo.causeExplanation || "");
      setRepairProposal(faultInfo.repairProposal || "");
      if (faultInfo.diagnosticToolResultFileId || faultInfo.diagnosticToolResultUrl) {
        setDiagnosticToolResult({
          fileId: faultInfo.diagnosticToolResultFileId,
          fileUrl: faultInfo.diagnosticToolResultUrl,
        });
      }
    }

    // 修理・整備固有情報を読み込む
    if (estimate.repairInfo) {
      const repairInfo = estimate.repairInfo as { audioUrl?: string };
      if (repairInfo.audioUrl) {
        setAudioData({
          audioUrl: repairInfo.audioUrl,
        });
      }
    }

    // 板金・塗装固有情報を読み込む
    if (estimate.bodyPaintInfo) {
      const bodyPaintInfo = estimate.bodyPaintInfo as {
        hasInsurance?: boolean;
        insuranceCompany?: string;
        [key: string]: unknown;
      };
      setBodyPaintHasInsurance(bodyPaintInfo.hasInsurance || false);
      setBodyPaintInsuranceCompany(bodyPaintInfo.insuranceCompany || "");
      // bodyPaintEstimateDataは別途読み込む必要がある（見積項目から復元）
    }

    // レストア固有情報を読み込む
    if (estimate.restoreInfo) {
      // restoreEstimateDataは別途読み込む必要がある（見積項目から復元）
    }
  }, [selectedWorkOrder]);

  // 故障診断の場合、診断結果から診断機結果を取得
  useEffect(() => {
    if (!isFaultDiagnosis || !workOrders || workOrders.length === 0) return;

    // 故障診断のワークオーダーを取得
    const faultDiagnosisWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "故障診断"
    );

    if (faultDiagnosisWorkOrder?.diagnosis) {
      // 診断機結果を取得
      const diagnosticResult = (faultDiagnosisWorkOrder.diagnosis as any).diagnosticToolResult;
      if (diagnosticResult) {
        setDiagnosticToolResult(diagnosticResult);
      }
    }
  }, [isFaultDiagnosis, workOrders]);

  /**
   * 項目を更新
   */
  const handleUpdateItem = (id: string, updates: Partial<EstimateLineItem>) => {
    setEstimateItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  /**
   * 項目を削除
   */
  const handleDeleteItem = (id: string) => {
    setEstimateItems((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * 項目を追加
   */
  const handleAddItem = (priority: EstimatePriority) => {
    const newItem: EstimateLineItem = {
      id: generateId(),
      name: "",
      price: 0,
      priority,
      linkedPhotoId: null,
    };
    setEstimateItems((prev) => [...prev, newItem]);
  };

  /**
   * プレビュー
   */
  const handlePreview = () => {
    console.log("=== 見積プレビュー ===");
    console.log("Job ID:", jobId);
    console.log("Items:", estimateItems);
    console.log("Total:", calculateTotal());
    toast.info("プレビュー機能は準備中です");
  };

  /**
   * LINE送信
   */
  const handleSendLine = async () => {
    if (!job) return;

    setIsSubmitting(true);

    try {
      // 見積データを整形
      let estimateData: EstimateItem[] = estimateItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        selected: item.priority === "required" || item.priority === "recommended",
        linkedPhotoUrls: item.linkedPhotoId
          ? [photos.find((p: { id: string; url: string }) => p.id === item.linkedPhotoId)?.url || ""]
          : [],
        linkedVideoUrl: null as string | null,
        note: null as string | null,
      }));

      // 故障診断の場合、原因説明と修理方法提案はEstimateDataのfaultDiagnosisInfoに保存される

      // 修理・整備の場合、部品リストを追加
      if (isRepair) {
        // 部品リストを見積項目に追加
        const partsEstimateItems: EstimateItem[] = partsList.map((part) => ({
          id: part.id,
          name: `${part.name} × ${part.quantity}`,
          price: part.quantity * part.unitPrice,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: part.note || null,
        }));
        
        // 既存の見積項目と部品リストを結合
        estimateData = [...estimateData, ...partsEstimateItems];
        
        // 音声データはEstimateDataのrepairInfoに保存される
      }

      // 板金・塗装の場合、見積もり項目を追加
      if (isBodyPaint && bodyPaintEstimateData) {
        // 板金・塗装の見積もり項目を見積項目に追加
        const bodyPaintEstimateItems = bodyPaintEstimateData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.amount,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: item.note || null,
        }));
        
        // 既存の見積項目と板金・塗装の見積もり項目を結合
        estimateData = [...estimateData, ...bodyPaintEstimateItems];
        
        // 作業期間、保険対応情報はEstimateDataのbodyPaintInfoに保存される
      }

      // レストアの場合、見積もり項目と部品リストを追加
      if (isRestore && restoreEstimateData) {
        // レストアの見積もり項目を見積項目に追加
        const restoreEstimateItems = restoreEstimateData.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.amount,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: item.note || null,
        }));

        // レストアの部品リストを見積項目に追加
        const restorePartsItems = restoreEstimateData.parts.map((part: any) => ({
          id: part.id,
          name: `${part.name} × ${part.quantity}`,
          price: part.quantity * part.unitPrice,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: part.note || null,
        }));

        // レストアの追加作業を見積項目に追加
        const restoreAdditionalWorkItems = restoreEstimateData.additionalWork.map(
          (work) => ({
            id: work.id,
            name: `[追加作業] ${work.content}`,
            price: work.additionalCost,
            priority: "required" as EstimatePriority,
            selected: true,
            linkedPhotoUrls: [],
            linkedVideoUrl: null,
            note: work.note || null,
          })
        );

        // 既存の見積項目とレストアの見積もり項目を結合
        estimateData = [
          ...estimateData,
          ...restoreEstimateItems,
          ...restorePartsItems,
          ...restoreAdditionalWorkItems,
        ];

        // 作業期間、見積もり変更履歴はEstimateDataのrestoreInfoに保存される
      }

      // その他の場合、見積もり項目と部品リストを追加
      if (isOther && otherEstimateData) {
        // その他の見積もり項目を見積項目に追加
        const otherEstimateItems = otherEstimateData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.amount,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: item.note || null,
        }));

        // その他の部品リストを見積項目に追加
        const otherPartsItems = (otherEstimateData.parts || []).map((part: any) => ({
          id: part.id,
          name: `${part.name} × ${part.quantity}`,
          price: part.quantity * part.unitPrice,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: part.note || null,
        }));

        // 既存の見積項目とその他の見積もり項目を結合
        estimateData = [
          ...estimateData,
          ...otherEstimateItems,
          ...otherPartsItems,
        ];
      }

      // 板金・塗装の場合、見積データを板金・塗装用の形式に変換
      if (isBodyPaint && bodyPaintEstimateData) {
        // 板金・塗装用の見積項目を見積データに追加
        const bodyPaintEstimateItems = bodyPaintEstimateData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.amount,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: item.note || null,
        }));
        
        // 既存の見積項目と板金・塗装用の見積項目を結合
        estimateData = [...estimateData, ...bodyPaintEstimateItems];
        
        // 板金・塗装用の追加情報（作業期間、保険対応など）はEstimateDataのbodyPaintInfoに保存される
      }

      // 見積を保存（workOrderIdを含める）
      if (selectedWorkOrder?.id) {
        // 複数作業管理対応：見積データを選択中のワークオーダーに保存
        // 小計、消費税、合計を計算
        const subtotal = estimateData.reduce((sum, item) => sum + item.price, 0);
        const tax = Math.floor(subtotal * 0.1); // 消費税10%
        const total = subtotal + tax;
        
        // サービス種類固有の情報を準備
        const estimateDataWithExtras: any = {
          items: estimateData,
          subtotal,
          tax,
          total,
          createdAt: new Date().toISOString(),
          // 故障診断固有情報
          faultDiagnosisInfo: isFaultDiagnosis ? {
            causeExplanation: causeExplanation.trim() || undefined,
            repairProposal: repairProposal.trim() || undefined,
            diagnosticToolResultUrl: diagnosticToolResult?.fileUrl || undefined,
            diagnosticToolResultFileId: diagnosticToolResult?.fileId || undefined,
          } : undefined,
          // 修理・整備固有情報
          repairInfo: isRepair ? {
            audioUrl: audioData?.audioUrl || undefined,
          } : undefined,
          // 板金・塗装固有情報
          bodyPaintInfo: isBodyPaint && bodyPaintEstimateData ? {
            workDuration: bodyPaintEstimateData.workDuration,
            hasInsurance: bodyPaintHasInsurance,
            insuranceCompany: bodyPaintHasInsurance ? bodyPaintInsuranceCompany.trim() || undefined : undefined,
          } : undefined,
          // レストア固有情報
          restoreInfo: isRestore && restoreEstimateData ? {
            workDuration: restoreEstimateData.workDuration,
            changeHistory: restoreEstimateData.changeHistory.map((history: any) => ({
              changedAt: history.changedAt,
              description: history.description,
              previousTotal: history.previousTotal,
              newTotal: history.newTotal,
              reason: history.reason || undefined,
            })),
          } : undefined,
        };

        const updateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
          estimate: estimateDataWithExtras,
          baseSystemItemId: baseSystemItemId.trim() || undefined, // 基幹システム明細IDを保存
          status: "顧客承認待ち",
        });
        
        if (!updateResult.success) {
          throw new Error(updateResult.error?.message || "見積の保存に失敗しました");
        }
        
        // ワークオーダーリストを再取得
        await mutateWorkOrders();
      } else {
        // 単一作業の場合：既存のcreateEstimateを使用
        // 小計、消費税、合計を計算
        const subtotal = estimateData.reduce((sum, item) => sum + item.price, 0);
        const tax = Math.floor(subtotal * 0.1); // 消費税10%
        const total = subtotal + tax;
        
        // サービス種類固有の情報を準備
        const estimateDataWithExtras: any = {
          items: estimateData,
          subtotal,
          tax,
          total,
          createdAt: new Date().toISOString(),
          // 故障診断固有情報
          faultDiagnosisInfo: isFaultDiagnosis ? {
            causeExplanation: causeExplanation.trim() || undefined,
            repairProposal: repairProposal.trim() || undefined,
            diagnosticToolResultUrl: diagnosticToolResult?.fileUrl || undefined,
            diagnosticToolResultFileId: diagnosticToolResult?.fileId || undefined,
          } : undefined,
          // 修理・整備固有情報
          repairInfo: isRepair ? {
            audioUrl: audioData?.audioUrl || undefined,
          } : undefined,
          // 板金・塗装固有情報
          bodyPaintInfo: isBodyPaint && bodyPaintEstimateData ? {
            workDuration: bodyPaintEstimateData.workDuration,
            hasInsurance: bodyPaintHasInsurance,
            insuranceCompany: bodyPaintHasInsurance ? bodyPaintInsuranceCompany.trim() || undefined : undefined,
          } : undefined,
          // レストア固有情報
          restoreInfo: isRestore && restoreEstimateData ? {
            workDuration: restoreEstimateData.workDuration,
            changeHistory: restoreEstimateData.changeHistory.map((history: any) => ({
              changedAt: history.changedAt,
              description: history.description,
              previousTotal: history.previousTotal,
              newTotal: history.newTotal,
              reason: history.reason || undefined,
            })),
          } : undefined,
        };
        
        const createResult = await createEstimate(jobId, estimateDataWithExtras.items);

        if (!createResult.success) {
          throw new Error(createResult.error?.message || "見積の作成に失敗しました");
        }

        // ステータスを更新（見積作成待ち → 作業待ち ではなく、見積提示済みに更新）
        // 注: JobStageに「見積提示済み」がないため「作業待ち」を使用
        const statusResult = await updateJobStatus(jobId, "作業待ち");
        
        if (!statusResult.success) {
          throw new Error(statusResult.error?.message || "ステータスの更新に失敗しました");
        }
      }

      // LINE通知を送信
      try {
        // 顧客情報を取得（LINE User IDを取得するため）
        const customerId = job.field4?.id;
        if (customerId) {
          const customerResult = await fetchCustomerById(customerId);
          const customer = customerResult?.data;

          // LINE User IDを取得
          const lineUserId = customer?.Business_Messaging_Line_Id || customer?.lineId;
          
          if (lineUserId) {
            // マジックリンクを生成
            const magicLinkResult = await generateMagicLink({
              jobId,
              workOrderId: selectedWorkOrder?.id,
              expiresIn: 7 * 24 * 60 * 60, // 7日間
            });

            if (magicLinkResult.success && magicLinkResult.url) {
              // 顧客情報と車両情報を取得
              const customerName = job.field4?.name || "お客様";
              const vehicleName = job.field6?.name || "車両";
              const licensePlate = extractLicensePlate(job.field6?.name);
              const serviceKind = selectedWorkOrder?.serviceKind || serviceKinds[0] || "作業";

              // LINE通知を送信
              const notificationResult = await sendLineNotification({
                lineUserId,
                type: "estimate_sent",
                jobId,
                data: {
                  customerName,
                  vehicleName,
                  licensePlate,
                  serviceKind,
                  magicLinkUrl: magicLinkResult.url,
                },
              });

              if (notificationResult.success) {
                toast.success("見積もりを送信しました", {
                  description: `${customerName}様へLINEで送信しました`,
                });
              } else {
                // 通知送信に失敗しても見積保存は成功しているので警告のみ
                toast.warning("見積もりを保存しました", {
                  description: "LINE通知の送信に失敗しましたが、見積もりは保存されています",
                });
              }
            } else {
              // マジックリンク生成に失敗しても見積保存は成功しているので警告のみ
              toast.warning("見積もりを保存しました", {
                description: "マジックリンクの生成に失敗しましたが、見積もりは保存されています",
              });
            }
          } else {
            // LINE User IDがない場合
            const customerName = job.field4?.name || "お客様";
            toast.success("見積もりを保存しました", {
              description: `${customerName}様のLINE IDが登録されていないため、通知を送信できませんでした`,
            });
          }
        } else {
          // 顧客IDがない場合
          toast.success("見積もりを保存しました");
        }
      } catch (lineError) {
        // LINE通知エラーは見積保存の成功を妨げない
        console.error("LINE通知エラー:", lineError);
        const customerName = job.field4?.name || "お客様";
        toast.success("見積もりを保存しました", {
          description: "LINE通知の送信に失敗しましたが、見積もりは保存されています",
        });
      }

      // トップページへ遷移
      router.push("/");
    } catch (error) {
      console.error("見積送信エラー:", error);
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "見積の送信に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 合計金額を計算
   */
  const calculateTotal = () => {
    return estimateItems.reduce((sum, item) => sum + item.price, 0);
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
        <ContentSkeleton />
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

  // ジョブデータから情報を抽出
  const customerName = job.field4?.name || "未登録";
  const vehicleName = extractVehicleName(job.field6?.name);
  const licensePlate = extractLicensePlate(job.field6?.name);
  const tagId = job.tagId || "---";

  // セクション別合計
  const requiredTotal = estimateItems
    .filter((i) => i.priority === "required")
    .reduce((sum, i) => sum + i.price, 0);
  const recommendedTotal = estimateItems
    .filter((i) => i.priority === "recommended")
    .reduce((sum, i) => sum + i.price, 0);
  const optionalTotal = estimateItems
    .filter((i) => i.priority === "optional")
    .reduce((sum, i) => sum + i.price, 0);

  const selectedPhoto = photos.find((p: DiagnosisPhoto) => p.id === selectedPhotoId);

  const estimateTitle = "見積作成";
  
  // 現在の作業名を取得（選択中のワークオーダーから、またはserviceKindsから）
  const currentWorkOrderName = selectedWorkOrder?.serviceKind || (serviceKinds.length > 0 ? serviceKinds[0] : "見積");

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <AppHeader maxWidthClassName="max-w-7xl">
        {/* ページタイトル */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-slate-600 shrink-0" />
            {estimateTitle}
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
          backHref="/"
          courtesyCars={courtesyCars}
        />
      </AppHeader>

      {/* メインコンテンツ - 2カラムレイアウト */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ========== 左カラム: 診断結果ビュー ========== */}
          <div className="space-y-4">
            {/* 法定費用カード（車検の場合のみ） */}
            {isInspection && (
              <LegalFeesCard
                legalFees={legalFees || {
                  inspection: 0,
                  weightTax: 0,
                  liabilityInsurance: 0,
                  stampDuty: 0,
                  total: 0,
                }}
                disabled={isLoadingLegalFees}
              />
            )}

            {/* オプションメニューセレクター（12ヵ月点検の場合のみ） */}
            {is12MonthInspection && (
              <OptionMenuSelector
                optionMenus={optionMenus}
                selectedMenuIds={selectedOptionMenuIds}
                onMenuSelectionChange={handleOptionMenuSelectionChange}
                simultaneousService={hasShakenSimultaneously ? "車検" : "12ヶ月点検"}
                disabled={isSubmitting}
              />
            )}

            {/* 故障診断用ビュー（故障診断の場合のみ） */}
            {isFaultDiagnosis && (
              <FaultDiagnosisEstimateView
                causeExplanation={causeExplanation}
                onCauseExplanationChange={setCauseExplanation}
                repairProposal={repairProposal}
                onRepairProposalChange={setRepairProposal}
                diagnosticToolResult={diagnosticToolResult}
                onViewDiagnosticResult={() => {
                  if (diagnosticToolResult?.fileUrl) {
                    window.open(diagnosticToolResult.fileUrl, "_blank");
                  }
                }}
                onDownloadDiagnosticResult={() => {
                  if (diagnosticToolResult?.fileUrl) {
                    const link = document.createElement("a");
                    link.href = diagnosticToolResult.fileUrl;
                    link.download = diagnosticToolResult.fileName || "診断機結果.pdf";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                disabled={isSubmitting}
              />
            )}

            {/* 板金・塗装用ビュー（板金・塗装の場合のみ） */}
            {isBodyPaint && (
              <BodyPaintEstimateView
                vendorEstimate={
                  (job as any)?.diagnosisData?.vendorEstimate
                    ? ((job as any).diagnosisData.vendorEstimate as VendorEstimate)
                    : null
                }
                estimateData={bodyPaintEstimateData}
                onEstimateDataChange={setBodyPaintEstimateData}
                hasInsurance={bodyPaintHasInsurance}
                onHasInsuranceChange={setBodyPaintHasInsurance}
                insuranceCompany={bodyPaintInsuranceCompany}
                onInsuranceCompanyChange={setBodyPaintInsuranceCompany}
                disabled={isSubmitting}
              />
            )}

            {/* 修理・整備用ビュー（修理・整備の場合のみ） */}
            {isRepair && (
              <div className="space-y-4">
                {/* 部品リスト */}
                <PartsListInput
                  parts={partsList}
                  onAdd={(part) => {
                    const newPart: PartsListItem = {
                      ...part,
                      id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    };
                    setPartsList((prev) => [...prev, newPart]);
                  }}
                  onUpdate={(id, updates) => {
                    setPartsList((prev) =>
                      prev.map((part) =>
                        part.id === id ? { ...part, ...updates } : part
                      )
                    );
                  }}
                  onDelete={(id) => {
                    setPartsList((prev) => prev.filter((part) => part.id !== id));
                  }}
                  disabled={isSubmitting}
                />

                {/* 音声入力 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <Mic className="h-5 w-5 shrink-0" />
                      音声入力
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AudioInputButton
                      position="estimate"
                      label="見積内容の音声入力"
                      audioData={audioData}
                      onStopRecording={async (position: string, audioBlob: Blob) => {
                        const audioUrl = URL.createObjectURL(audioBlob);
                        setAudioData({
                          position,
                          file: audioBlob,
                          audioUrl,
                          isProcessing: false,
                        });
                        toast.success("音声を録音しました");
                      }}
                      disabled={isSubmitting}
                    />
                    {audioData?.audioUrl && (
                      <div className="mt-3 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">録音済み</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAudioData(undefined);
                            toast.success("音声を削除しました");
                          }}
                          disabled={isSubmitting}
                        >
                          削除
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 診断情報ヘッダー */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
                  <span className="flex items-center gap-2">
                    <Car className="h-5 w-5 shrink-0" />
                    診断結果
                  </span>
                  <span className="text-sm font-normal text-slate-500">
                    Job ID: {jobId}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-slate-600">
                  <p>{vehicleName} / {licensePlate}</p>
                  {job.field10 && (
                    <p className="mt-1">走行距離: {job.field10.toLocaleString()} km</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 撮影写真 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Camera className="h-5 w-5 shrink-0" />
                  撮影写真
                  <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">{photos.length}枚</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo: DiagnosisPhoto) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      isSelected={selectedPhotoId === photo.id}
                      onClick={() => setSelectedPhotoId(photo.id)}
                    />
                  ))}
                </div>

                {selectedPhoto && (
                  <div className="mt-4 p-2 bg-slate-50 rounded-lg">
                    <img
                      src={selectedPhoto.url}
                      alt={selectedPhoto.label}
                      className="w-full rounded-md"
                    />
                    <p className="text-sm text-center mt-2 text-slate-600">
                      {selectedPhoto.label}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 指摘項目 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  指摘項目
                  <Badge variant="destructive" className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                    {flaggedItems.filter((i: DiagnosisCheckItem) => i.status === "red").length}件 要交換
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {flaggedItems.map((item: DiagnosisCheckItem) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        item.status === "red"
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {item.status === "red" ? (
                          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
                        )}
                        <span className={cn(
                          "font-medium",
                          item.status === "red" ? "text-red-800" : "text-yellow-800"
                        )}>
                          {item.name}
                        </span>
                        <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                          {item.category}
                        </Badge>
                      </div>
                      {item.comment && (
                        <p className={cn(
                          "text-sm mt-1 ml-6",
                          item.status === "red" ? "text-red-700" : "text-yellow-700"
                        )}>
                          {item.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== 右カラム: 見積エディタ ========== */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Calculator className="h-5 w-5 shrink-0" />
                  見積内容
                  {isEngineOilChange && (
                    <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                      基本不要（イレギュラー時のみ追加）
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEngineOilChange && estimateItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    <p className="text-sm mb-4">
                      エンジンオイル交換は基本作業のみのため、見積項目は通常不要です。
                    </p>
                    <p className="text-xs text-slate-400 mb-4">
                      イレギュラーな部品交換が必要な場合のみ、下記の「項目を追加」ボタンから追加してください。
                    </p>
                    <div className="space-y-6 mt-6">
                      <EstimateSection
                        title="必須整備"
                        priority="required"
                        items={estimateItems}
                        photos={photos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("required")}
                        badgeVariant="default"
                        disabled={isSubmitting}
                      />
                      <Separator />
                      <EstimateSection
                        title="推奨整備"
                        priority="recommended"
                        items={estimateItems}
                        photos={photos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("recommended")}
                        badgeVariant="secondary"
                        disabled={isSubmitting}
                      />
                      <Separator />
                      <EstimateSection
                        title="任意整備"
                        priority="optional"
                        items={estimateItems}
                        photos={photos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("optional")}
                        badgeVariant="outline"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-6">
                      <EstimateSection
                        title="必須整備"
                        priority="required"
                        items={estimateItems}
                        photos={photos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("required")}
                        badgeVariant="default"
                        disabled={isSubmitting}
                      />

                      <Separator />

                      <EstimateSection
                        title="推奨整備"
                        priority="recommended"
                        items={estimateItems}
                        photos={photos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("recommended")}
                        badgeVariant="secondary"
                        disabled={isSubmitting}
                      />

                      <Separator />

                      <EstimateSection
                        title="任意整備"
                        priority="optional"
                        items={estimateItems}
                        photos={photos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("optional")}
                        badgeVariant="outline"
                        disabled={isSubmitting}
                      />
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* 合計金額 */}
            <Card>
              <CardContent className="py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">必須整備</span>
                    <span>¥{formatPrice(requiredTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">推奨整備</span>
                    <span>¥{formatPrice(recommendedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">任意整備</span>
                    <span>¥{formatPrice(optionalTotal)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>合計（税込）</span>
                    <span className="text-primary">¥{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 基幹システム連携セクション */}
            <Card className="mb-4 border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-amber-900">
                  <Calculator className="h-5 w-5 shrink-0" />
                  基幹システム連携
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-amber-800">
                  <p className="mb-2 font-medium">手順：</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>基幹システムで見積を計算・作成</li>
                    <li>計算結果をWebアプリに転記（下記ボタンから）</li>
                    <li>転記後、必要に応じて項目を追加・修正</li>
                    <li>基幹システム明細IDを入力（オプション）</li>
                    <li>LINEで顧客へ送信</li>
                  </ol>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-10 border-amber-300 bg-white hover:bg-amber-100 text-amber-900"
                  onClick={() => setIsBaseSystemCopyDialogOpen(true)}
                  disabled={isSubmitting}
                >
                  <Calculator className="h-4 w-4 mr-2 shrink-0" />
                  基幹システムで見積作成
                </Button>
                <p className="text-xs text-amber-700 mt-2">
                  ※ 基幹システムで計算後、結果をこの画面に転記してください
                </p>

                {/* 基幹システム明細ID入力（各ワークオーダーごと） */}
                {selectedWorkOrder && (
                  <div className="pt-3 border-t border-amber-300">
                    <Label htmlFor="base-system-item-id" className="text-sm text-amber-900">
                      基幹システム明細ID（この作業用）
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="base-system-item-id"
                        value={baseSystemItemId}
                        onChange={(e) => setBaseSystemItemId(e.target.value)}
                        placeholder="例: ITEM-2024-001"
                        className="flex-1 bg-white"
                        disabled={isSubmitting}
                      />
                      <Button
                        onClick={async () => {
                          if (!selectedWorkOrder?.id) return;
                          try {
                            const result = await updateWorkOrder(jobId, selectedWorkOrder.id, {
                              baseSystemItemId: baseSystemItemId.trim() || undefined,
                            });
                            if (result.success) {
                              await mutateWorkOrders();
                              toast.success("基幹システム明細IDを保存しました");
                            } else {
                              toast.error("保存に失敗しました", {
                                description: result.error?.message,
                              });
                            }
                          } catch (error) {
                            console.error("基幹システム明細ID保存エラー:", error);
                            toast.error("保存に失敗しました");
                          }
                        }}
                        variant="outline"
                        size="sm"
                        disabled={!selectedWorkOrder?.id || isSubmitting}
                        className="shrink-0 bg-white"
                      >
                        保存
                      </Button>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      基幹システムで作成した見積明細のIDを入力してください（請求書統合用）
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 請求書PDF管理（Phase 3: 請求書統合フロー） */}
            {job?.field19 && (() => {
              // Google DriveフォルダIDを抽出（URLから）
              const folderIdMatch = job.field19.match(/\/folders\/([a-zA-Z0-9_-]+)/);
              const folderId = folderIdMatch ? folderIdMatch[1] : job.field19.split("/").pop() || "";
              
              return (
                <InvoiceUpload
                  jobId={jobId}
                  jobFolderId={folderId}
                  baseSystemInvoiceId={job.field_base_system_id || undefined}
                  onBaseSystemIdUpdate={async (baseSystemInvoiceId) => {
                    // 基幹システム連携IDをZoho CRMに保存
                    const result = await updateJobBaseSystemId(jobId, baseSystemInvoiceId);
                    if (result.success) {
                      await mutateJob();
                      toast.success("基幹システム連携IDを保存しました");
                    } else {
                      toast.error("基幹システム連携IDの保存に失敗しました", {
                        description: result.error?.message,
                      });
                    }
                  }}
                  existingInvoice={existingInvoice}
                />
              );
            })()}

            {/* アクションボタン */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={handlePreview}
                disabled={isSubmitting}
              >
                <Eye className="h-4 w-4 mr-2 shrink-0" />
                プレビュー
              </Button>
              <Button
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                onClick={handleSendLine}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                    送信中...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2 shrink-0" />
                    LINEで送信
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* 作業追加ダイアログ */}
      <AddWorkOrderDialog
        open={isAddWorkOrderDialogOpen}
        onOpenChange={setIsAddWorkOrderDialogOpen}
        job={job}
        existingServiceKinds={workOrders?.map((wo) => wo.serviceKind as ServiceKind) || serviceKinds}
        onSuccess={handleAddWorkOrderSuccess}
      />

      {/* 基幹システム転記ダイアログ */}
      <Dialog open={isBaseSystemCopyDialogOpen} onOpenChange={setIsBaseSystemCopyDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 shrink-0" />
              基幹システムから見積項目を転記
            </DialogTitle>
            <DialogDescription>
              基幹システムで計算した見積項目を転記してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="base-system-items">見積項目（CSV形式）</Label>
              <textarea
                id="base-system-items"
                className="w-full min-h-[200px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
                placeholder="品名1,金額1&#10;品名2,金額2&#10;&#10;例：&#10;エンジンオイル交換,5500&#10;オイルフィルター交換,1100"
                value={baseSystemItemsText}
                onChange={(e) => setBaseSystemItemsText(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                形式：1行に1項目、カンマ区切りで「品名,金額（税込）」を入力してください
              </p>
            </div>
            <div className="space-y-2">
              <Label>転記モード</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="copy-mode"
                    value="add"
                    checked={baseSystemCopyMode === "add"}
                    onChange={() => setBaseSystemCopyMode("add")}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm">既存項目に追加</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="copy-mode"
                    value="replace"
                    checked={baseSystemCopyMode === "replace"}
                    onChange={() => setBaseSystemCopyMode("replace")}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm">既存項目を置き換え</span>
                </label>
              </div>
              <p className="text-xs text-slate-500">
                {baseSystemCopyMode === "add"
                  ? "既存の見積項目に追加します"
                  : "既存の見積項目をすべて削除して、新しい項目に置き換えます"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsBaseSystemCopyDialogOpen(false);
                setBaseSystemItemsText("");
              }}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCopyFromBaseSystem}
              disabled={!baseSystemItemsText.trim() || isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                  転記中...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2 shrink-0" />
                  転記する
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
