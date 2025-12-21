"use client";

import { useState, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { compressImage, getImagePreviewUrl } from "@/lib/compress";
import { toast } from "sonner";
import { fetchCustomerById } from "@/lib/api";
import { sendLineNotification } from "@/lib/line-api";
import { ServiceKind } from "@/types";
import { ApprovedWorkItemCard, ApprovedWorkItem } from "@/components/features/approved-work-item-card";
import { WorkProgressBar } from "@/components/features/work-progress-bar";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { WorkOrderSelector } from "@/components/features/work-order-selector";
import { AddWorkOrderDialog } from "@/components/features/add-work-order-dialog";
import { ReplacementPart } from "@/lib/inspection-pdf-generator";
import useSWR from "swr";
import { fetchJobById, updateJobStatus, completeWork, fetchAllCourtesyCars } from "@/lib/api";
import { updateWorkOrder } from "@/hooks/use-work-orders";
import { ZohoJob } from "@/types";
import { completeInspectionDelivery, InspectionRecordData } from "@/lib/inspection-delivery";
import { VEHICLE_INSPECTION_ITEMS, InspectionItem } from "@/lib/inspection-items";
import { useEffect } from "react";
import { PhotoData } from "@/components/features/photo-capture-button";
import {
  BodyPaintOutsourcingView,
  OutsourcingInfo,
  QualityCheckData,
  createInitialQualityCheckItem,
  DEFAULT_QUALITY_CHECK_ITEMS,
} from "@/components/features/body-paint-outsourcing-view";
import { OrderMethod, OutsourcingProgress } from "@/lib/body-paint-config";
import {
  RestoreWorkView,
  RestoreWorkData,
  createInitialPhaseData,
} from "@/components/features/restore-work-view";
import { RestorePartItem } from "@/components/features/restore-estimate-view";
import {
  CoatingWorkManagement,
  CoatingDryingProcess,
  CoatingMaintenancePeriod,
} from "@/components/features/coating-work-management";
import {
  Car,
  Tag,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Wrench,
  AlertTriangle,
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

interface WorkItem {
  id: string;
  name: string;
  category: string;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  afterFile: File | null;
  isCompleted: boolean;
  isCapturing: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

const initialWorkItems: WorkItem[] = [
  {
    id: "work-1",
    name: "法定12ヶ月点検",
    category: "点検",
    beforePhotoUrl: null,
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-2",
    name: "エンジンオイル交換",
    category: "エンジン",
    beforePhotoUrl: "https://placehold.co/400x300/e2e8f0/64748b?text=Oil+Before",
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-3",
    name: "Fブレーキパッド交換",
    category: "ブレーキ",
    beforePhotoUrl: "https://placehold.co/400x300/fecaca/dc2626?text=Brake+Before",
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-4",
    name: "タイヤローテーション",
    category: "足回り",
    beforePhotoUrl: "https://placehold.co/400x300/fef08a/ca8a04?text=Tire+Before",
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-5",
    name: "ワイパーゴム交換",
    category: "外装",
    beforePhotoUrl: null,
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
];

// =============================================================================
// Components
// =============================================================================

/**
 * 作業項目カードコンポーネント
 */
function WorkItemCard({
  item,
  onCapture,
  onComplete,
}: {
  item: WorkItem;
  onCapture: (id: string, file: File) => void;
  onComplete: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(item.id, file);
    }
    e.target.value = "";
  };

  return (
    <Card
      className={cn(
        "transition-all",
        item.isCompleted && "border-green-500 bg-green-50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 完了チェック */}
          <div className="pt-1">
            {item.isCompleted ? (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-white shrink-0" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
            )}
          </div>

          {/* コンテンツ */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={cn(
                "font-medium",
                item.isCompleted ? "text-green-700" : "text-slate-900"
              )}>
                {item.name}
              </p>
              <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {item.category}
              </Badge>
            </div>

            {/* Before写真（あれば） */}
            {item.beforePhotoUrl && (
              <div className="mt-2 mb-3">
                <p className="text-xs text-slate-500 mb-1">Before:</p>
                <img
                  src={item.beforePhotoUrl}
                  alt="Before"
                  className="w-24 h-18 object-cover rounded border"
                />
              </div>
            )}

            {/* After写真プレビュー（撮影済みの場合） */}
            {item.afterPhotoUrl && (
              <div className="mt-2 mb-3">
                <p className="text-xs text-green-600 mb-1">✓ After:</p>
                <img
                  src={item.afterPhotoUrl}
                  alt="After"
                  className="w-24 h-18 object-cover rounded border border-green-300"
                />
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex gap-2 mt-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* 撮影ボタン */}
              <Button
                variant={item.afterPhotoUrl ? "outline" : "default"}
                size="sm"
                onClick={handleCameraClick}
                disabled={item.isCapturing || item.isCompleted}
                className="flex-1 h-12"
              >
                {item.isCapturing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    圧縮中...
                  </div>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-1" />
                    {item.afterPhotoUrl ? "再撮影" : "📸 完了撮影"}
                  </>
                )}
              </Button>

              {/* 完了ボタン */}
              {item.afterPhotoUrl && !item.isCompleted && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onComplete(item.id)}
                  className="h-12 bg-green-100 text-green-700 hover:bg-green-200"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1 shrink-0" />
                  完了
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * スワイプ完了ボタンコンポーネント
 */
function SwipeToCompleteButton({
  onComplete,
  disabled,
}: {
  onComplete: () => void;
  disabled: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    if (disabled) return;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left - 40;
    const maxWidth = rect.width - 80;
    const newProgress = Math.max(0, Math.min(1, offsetX / maxWidth));
    setProgress(newProgress);

    if (newProgress >= 0.95) {
      setProgress(1);
      setIsDragging(false);
      onComplete();
    }
  };

  const handleEnd = () => {
    if (progress < 0.95) {
      setProgress(0);
    }
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-16 rounded-full overflow-hidden transition-colors",
        disabled
          ? "bg-slate-200 cursor-not-allowed"
          : "bg-gradient-to-r from-green-500 to-green-600 cursor-pointer"
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
    >
      {/* 背景テキスト */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "font-bold",
          disabled ? "text-slate-400" : "text-white/80"
        )}>
          {disabled ? "全項目を完了してください" : "→ スワイプで作業完了"}
        </span>
      </div>

      {/* 進捗バー */}
      <div
        className="absolute top-0 left-0 h-full bg-green-700/50 transition-all"
        style={{ width: `${progress * 100}%` }}
      />

      {/* スライダーノブ */}
      <div
        className={cn(
          "absolute top-1 left-1 h-14 w-14 rounded-full flex items-center justify-center transition-transform",
          disabled ? "bg-slate-300" : "bg-white shadow-lg"
        )}
        style={{ transform: `translateX(${progress * (containerRef.current?.offsetWidth || 300 - 80)}px)` }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {progress >= 0.95 ? (
          <Check className={cn("h-6 w-6", disabled ? "text-slate-400" : "text-green-600")} />
        ) : (
          <Wrench className={cn("h-6 w-6", disabled ? "text-slate-400" : "text-green-600")} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

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
// Main Page Component
// =============================================================================

export default function MechanicWorkPage() {
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

  // サービス種類を判定（車検かどうか）
  const serviceKinds = job?.field_service_kinds || (job?.serviceKind ? [job.serviceKind] : []);
  const isInspection = serviceKinds.includes("車検" as ServiceKind) || serviceKinds.includes("12ヵ月点検" as ServiceKind);
  const isTireReplacement = serviceKinds.includes("タイヤ交換・ローテーション" as ServiceKind);
  const isMaintenance = serviceKinds.includes("その他" as ServiceKind);
  const isTuningParts = (
    serviceKinds.includes("チューニング" as ServiceKind) ||
    serviceKinds.includes("パーツ取付" as ServiceKind)
  );
  const isCoating = serviceKinds.includes("コーティング" as ServiceKind);
  const isBodyPaint = serviceKinds.includes("板金・塗装" as ServiceKind);
  const isRestore = serviceKinds.includes("レストア" as ServiceKind);
  const isOther = serviceKinds.includes("その他" as ServiceKind);
  const isFaultDiagnosis = serviceKinds.includes("故障診断" as ServiceKind);
  const isRepair = serviceKinds.includes("修理・整備" as ServiceKind);

  // 承認された作業項目の状態管理（車検の場合）
  const [approvedWorkItems, setApprovedWorkItems] = useState<ApprovedWorkItem[]>([]);
  
  // 交換部品の状態管理（車検の場合）
  const [replacementParts, setReplacementParts] = useState<ReplacementPart[]>([]);

  // 既存のWorkItem形式の状態管理（非車検の場合）
  const [workItems, setWorkItems] = useState<WorkItem[]>(initialWorkItems);

  // 板金・塗装用の状態管理
  const [bodyPaintOutsourcingInfo, setBodyPaintOutsourcingInfo] = useState<OutsourcingInfo | null>(null);
  const [bodyPaintQualityCheckData, setBodyPaintQualityCheckData] = useState<QualityCheckData | null>(null);
  const [bodyPaintPhotoData, setBodyPaintPhotoData] = useState<Record<string, PhotoData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // レストア用の状態管理
  const [restoreWorkData, setRestoreWorkData] = useState<RestoreWorkData | null>(null);
  const [restoreWorkPhotoData, setRestoreWorkPhotoData] = useState<Record<string, PhotoData>>({});

  // コーティング用の状態管理
  const [coatingDryingProcess, setCoatingDryingProcess] = useState<CoatingDryingProcess | undefined>(
    selectedWorkOrder?.work?.coatingInfo?.dryingProcess
  );
  const [coatingMaintenancePeriod, setCoatingMaintenancePeriod] = useState<CoatingMaintenancePeriod | undefined>(
    selectedWorkOrder?.work?.coatingInfo?.maintenancePeriod
  );

  // コーティング用：既存データの読み込み
  useEffect(() => {
    if (isCoating && selectedWorkOrder?.work?.coatingInfo) {
      setCoatingDryingProcess(selectedWorkOrder.work.coatingInfo.dryingProcess);
      setCoatingMaintenancePeriod(selectedWorkOrder.work.coatingInfo.maintenancePeriod);
    } else if (isCoating && !selectedWorkOrder?.work?.coatingInfo) {
      // 初期化（既存データがない場合）
      setCoatingDryingProcess({
        status: "未開始",
      });
      setCoatingMaintenancePeriod({
        duration: 1,
      });
    }
  }, [isCoating, selectedWorkOrder]);

  // 板金・塗装用：品質確認項目の初期化
  useEffect(() => {
    if (isBodyPaint && (!bodyPaintQualityCheckData || bodyPaintQualityCheckData.checkItems.length === 0)) {
      const initialItems = DEFAULT_QUALITY_CHECK_ITEMS.map((item) => ({
        ...createInitialQualityCheckItem(),
        ...item,
      }));
      setBodyPaintQualityCheckData({
        checkItems: initialItems,
        afterPhotoUrls: [],
        comments: "",
      });
    }
  }, [isBodyPaint]);

  /**
   * 写真撮影ハンドラ
   */
  const handleCapture = async (itemId: string, file: File) => {
    // 圧縮中フラグをON
    setWorkItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isCapturing: true } : item
      )
    );

    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setWorkItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                afterFile: compressedFile,
                afterPhotoUrl: previewUrl,
                isCapturing: false,
              }
            : item
        )
      );

      toast.success("写真を撮影しました", {
        description: `${(compressedFile.size / 1024).toFixed(0)}KB に圧縮済み`,
      });
    } catch (error) {
      console.error("撮影エラー:", error);
      setWorkItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isCapturing: false } : item
        )
      );
      toast.error("撮影に失敗しました");
    }
  };

  /**
   * 項目完了ハンドラ
   */
  const handleItemComplete = (itemId: string) => {
    setWorkItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isCompleted: true } : item
      )
    );
    toast.success("項目を完了しました");
  };

  /**
   * 全作業完了ハンドラ
   */
  const handleAllComplete = async () => {
    if (!job) return;

    try {
      if (isInspection) {
        // 車検・12ヵ月点検の場合：分解整備記録簿PDFを生成してGoogle Driveに保存
        // 複数作業管理対応：選択中のワークオーダーを使用、または該当するワークオーダーを検索
        const inspectionWorkOrder = selectedWorkOrder && 
          (selectedWorkOrder.serviceKind === "車検" || selectedWorkOrder.serviceKind === "12ヵ月点検")
          ? selectedWorkOrder
          : workOrders?.find(
              (wo) => wo.serviceKind === "車検" || wo.serviceKind === "12ヵ月点検"
            );

        if (!inspectionWorkOrder?.diagnosis?.items) {
          toast.error("診断データが見つかりません");
          return;
        }

        // 検査項目を取得
        const inspectionItems: InspectionItem[] = inspectionWorkOrder.diagnosis.items.map((item) => {
          const templateItem = VEHICLE_INSPECTION_ITEMS.find((t) => t.id === item.id);
          return {
            ...(templateItem || { id: item.id, name: item.name, category: "other" as const, status: "unchecked" }),
            status: item.status as InspectionItem["status"],
            comment: item.comment || undefined,
            photoUrls: item.evidencePhotoUrls,
            videoUrl: item.evidenceVideoUrl || undefined,
          };
        });

        // 車両情報を取得
        const vehicleName = extractVehicleName(job.field6?.name);
        const licensePlate = extractLicensePlate(job.field6?.name);
        const customerName = job.field4?.name || "未登録";

        // 分解整備記録簿データを準備
        const recordData: InspectionRecordData = {
          vehicle: {
            ownerName: customerName,
            vehicleName,
            licensePlate,
            chassisNumber: undefined,
            firstRegistrationYear: undefined,
            engineType: undefined,
          },
          inspectionItems,
          replacementParts,
          mechanicName: job.assignedMechanic || "未設定",
          mileage: job.field10 || 0,
          inspectionDate: new Date().toISOString(),
        };

        // 引渡処理を実行
        const deliveryResult = await completeInspectionDelivery(
          jobId,
          recordData,
          job.field4?.id || "",
          customerName,
          job.field6?.id || "",
          vehicleName
        );

        if (!deliveryResult.success) {
          throw new Error(deliveryResult.error?.message || "引渡処理に失敗しました");
        }

        // 作業データを保存（workOrderIdを含める）
        if (selectedWorkOrder?.id && inspectionWorkOrder?.id === selectedWorkOrder.id) {
          // 複数作業管理対応：作業データを選択中のワークオーダーに保存
          const workData = {
            records: [{
              time: new Date().toISOString(),
              content: "分解整備記録簿を生成",
              photos: [],
            }],
            completedAt: new Date().toISOString(),
            mechanicName: job.assignedMechanic || undefined,
          };

          const updateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
            work: workData,
            status: "完了",
          });
          
          if (!updateResult.success) {
            throw new Error(updateResult.error?.message || "作業の保存に失敗しました");
          }
          
          // ワークオーダーリストを再取得
          await mutateWorkOrders();
        } else {
          // 単一作業の場合：既存の処理を実行
          // ステータスを更新
          await updateJobStatus(jobId, "出庫待ち");
        }

        toast.success("作業が完了しました！", {
          description: selectedWorkOrder?.id 
            ? "作業データを保存しました"
            : "分解整備記録簿を生成してGoogle Driveに保存しました",
        });
      } else if (isFaultDiagnosis) {
        // 故障診断の場合：承認された作業項目の完了処理
        const completedItems = approvedWorkItems
          .filter((i) => i.status === "completed")
          .map((i) => i.id);
        
        const afterPhotos = approvedWorkItems
          .filter((i) => i.afterPhotos.length > 0)
          .flatMap((i) =>
            i.afterPhotos.map((photo) => ({
              itemId: i.id,
              url: photo.previewUrl || "",
            }))
          );

        // 作業データを保存（workOrderIdを含める）
        if (selectedWorkOrder?.id && selectedWorkOrder.serviceKind === "故障診断") {
          // 複数作業管理対応：作業データを選択中のワークオーダーに保存
          const workData = {
            records: completedItems.map((itemId) => {
              const item = approvedWorkItems.find((i) => i.id === itemId);
              return {
                time: new Date().toISOString(),
                content: item?.name || "",
                photos: item?.afterPhotos.map((photo) => ({
                  type: "after" as const,
                  url: photo.previewUrl || "",
                })) || [],
              };
            }),
            completedAt: new Date().toISOString(),
            mechanicName: job.assignedMechanic || undefined,
          };

          const updateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
            work: workData,
            status: "完了",
          });
          
          if (!updateResult.success) {
            throw new Error(updateResult.error?.message || "作業の保存に失敗しました");
          }
          
          // ワークオーダーリストを再取得
          await mutateWorkOrders();
        } else {
          // 単一作業の場合：既存の処理を実行
          await completeWork(jobId, {
            completedItems,
            afterPhotos,
          });

          // ステータスを更新
          await updateJobStatus(jobId, "出庫待ち");
        }

        toast.success("作業が完了しました！", {
          description: selectedWorkOrder?.id 
            ? "作業データを保存しました"
            : "フロントに通知を送信しました",
        });
      } else if (isRepair) {
        // 修理・整備の場合：承認された作業項目の完了処理
        const completedItems = approvedWorkItems
          .filter((i) => i.status === "completed")
          .map((i) => i.id);
        
        const afterPhotos = approvedWorkItems
          .filter((i) => i.afterPhotos.length > 0)
          .flatMap((i) =>
            i.afterPhotos.map((photo) => ({
              itemId: i.id,
              url: photo.previewUrl || "",
            }))
          );

        // 作業データを保存（workOrderIdを含める）
        if (selectedWorkOrder?.id && selectedWorkOrder.serviceKind === "修理・整備") {
          // 複数作業管理対応：作業データを選択中のワークオーダーに保存
          const workData = {
            records: completedItems.map((itemId) => {
              const item = approvedWorkItems.find((i) => i.id === itemId);
              return {
                time: new Date().toISOString(),
                content: item?.name || "",
                photos: item?.afterPhotos.map((photo) => ({
                  type: "after" as const,
                  url: photo.previewUrl || "",
                })) || [],
              };
            }),
            completedAt: new Date().toISOString(),
            mechanicName: job.assignedMechanic || undefined,
          };

          const updateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
            work: workData,
            status: "完了",
          });
          
          if (!updateResult.success) {
            throw new Error(updateResult.error?.message || "作業の保存に失敗しました");
          }
          
          // ワークオーダーリストを再取得
          await mutateWorkOrders();
        } else {
          // 単一作業の場合：既存の処理を実行
          await completeWork(jobId, {
            completedItems,
            afterPhotos,
          });

          // ステータスを更新
          await updateJobStatus(jobId, "出庫待ち");
        }

        // 作業完了のLINE通知を送信
        try {
          const customer = await fetchCustomerById(job.field4?.id || "");
          if (customer.success && customer.data?.lineUserId) {
            const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
            const serviceKind = serviceKinds.length > 0 ? serviceKinds[0] : "その他";
            
            await sendLineNotification({
              lineUserId: customer.data.lineUserId,
              type: "work_complete",
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
          console.warn("LINE通知送信エラー（作業完了）:", error);
          // LINE通知の失敗は作業完了処理を止めない
        }

        toast.success("作業が完了しました！", {
          description: selectedWorkOrder?.id 
            ? "作業データを保存しました"
            : "フロントに通知を送信しました",
        });
      } else if (isTireReplacement || isMaintenance || isTuningParts || isCoating) {
        // タイヤ交換・ローテーション・その他のメンテナンス・チューニング・パーツ取付・コーティングの場合：承認された作業項目の完了処理
        const completedItems = approvedWorkItems
          .filter((i) => i.status === "completed")
          .map((i) => i.id);
        
        const afterPhotos = approvedWorkItems
          .filter((i) => i.afterPhotos.length > 0)
          .flatMap((i) =>
            i.afterPhotos.map((photo) => ({
              itemId: i.id,
              url: photo.previewUrl || "",
            }))
          );

        if (selectedWorkOrder?.id) {
          // 複数作業管理対応：作業データを選択中のワークオーダーに保存
          const workData = {
            records: approvedWorkItems.map((item) => ({
              time: new Date().toISOString(),
              content: item.name,
              photos: [
                ...item.beforePhotos.map((p) => ({ type: "before" as const, url: p.previewUrl || "", fileId: undefined })),
                ...item.afterPhotos.map((p) => ({ type: "after" as const, url: p.previewUrl || "", fileId: undefined })),
              ],
            })),
            completedAt: new Date().toISOString(),
            mechanicName: job.assignedMechanic || undefined,
            // コーティング固有情報
            coatingInfo: isCoating ? {
              dryingProcess: coatingDryingProcess,
              maintenancePeriod: coatingMaintenancePeriod,
            } : undefined,
          };

          const updateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
            work: workData,
            status: "完了",
          });
          
          if (!updateResult.success) {
            throw new Error(updateResult.error?.message || "作業の保存に失敗しました");
          }
          
          // ワークオーダーリストを再取得
          await mutateWorkOrders();
        } else {
          // 単一作業の場合：既存の処理を実行
          await completeWork(jobId, {
            completedItems,
            afterPhotos,
          });
          
          // ステータスを更新
          await updateJobStatus(jobId, "出庫待ち");
        }

        toast.success("作業が完了しました！", {
          description: selectedWorkOrder?.id
            ? "作業データを保存しました"
            : "フロントに通知を送信しました",
        });
      } else {
        // その他の場合：既存の処理
        console.log("=== 作業完了 ===");
        console.log("Job ID:", jobId);
        console.log("Completed Items:", workItems.filter((i) => i.isCompleted).map((i) => i.name));

        await completeWork(jobId, {
          completedItems: workItems.filter((i) => i.isCompleted).map((i) => i.id),
          afterPhotos: workItems
            .filter((i) => i.afterPhotoUrl)
            .map((i) => ({ itemId: i.id, url: i.afterPhotoUrl! })),
        });

        // 作業完了のLINE通知を送信
        try {
          const customer = await fetchCustomerById(job.field4?.id || "");
          if (customer.success && customer.data?.lineUserId) {
            const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
            const serviceKind = serviceKinds.length > 0 ? serviceKinds[0] : "その他";
            
            await sendLineNotification({
              lineUserId: customer.data.lineUserId,
              type: "work_complete",
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
          console.warn("LINE通知送信エラー（作業完了）:", error);
          // LINE通知の失敗は作業完了処理を止めない
        }

        toast.success("作業が完了しました！", {
          description: "フロントに通知を送信しました",
        });
      }

      // 1.5秒後にトップへ戻る
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("作業完了エラー:", error);
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "作業完了処理に失敗しました",
      });
    }
  };

  // 承認された作業項目を取得（車検・故障診断・修理・整備の場合）
  useEffect(() => {
    if ((!isInspection && !isFaultDiagnosis && !isRepair) || !workOrders || workOrders.length === 0) return;
    
    // 車検の場合は車検のワークオーダー、故障診断の場合は故障診断のワークオーダー、修理・整備の場合は修理・整備のワークオーダーを取得
    const targetWorkOrder = workOrders.find(
      (wo) => 
        (isInspection && (wo.serviceKind === "車検" || wo.serviceKind === "12ヵ月点検")) ||
        (isFaultDiagnosis && wo.serviceKind === "故障診断") ||
        (isRepair && wo.serviceKind === "修理・整備")
    );
    
    if (!targetWorkOrder?.estimate?.items) return;
    
    // 承認された項目（selected: true）を作業項目に変換
    const approvedItems = targetWorkOrder.estimate.items
      .filter((item) => item.selected)
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: "その他",
        status: "pending" as const,
        beforePhotos: [],
        afterPhotos: [],
        comment: item.note || undefined,
      }));
    
    setApprovedWorkItems(approvedItems);
  }, [isInspection, isFaultDiagnosis, isRepair, workOrders, selectedWorkOrder]);

  // 統計
  const completedCount = isInspection || isFaultDiagnosis || isRepair || isTireReplacement || isMaintenance || isTuningParts || isCoating || isBodyPaint || isRestore || isOther
    ? (isTireReplacement || isMaintenance || isTuningParts || isCoating || isBodyPaint || isRestore || isOther ? workItems.filter((i) => i.isCompleted).length : approvedWorkItems.filter((i) => i.status === "completed").length)
    : workItems.filter((i) => i.isCompleted).length;
  const totalCount = isInspection || isFaultDiagnosis || isRepair || isTireReplacement || isMaintenance || isTuningParts || isCoating || isBodyPaint || isRestore || isOther
    ? (isTireReplacement || isMaintenance || isTuningParts || isCoating || isBodyPaint || isRestore || isOther ? workItems.length : approvedWorkItems.length)
    : workItems.length;
  const allCompleted = completedCount === totalCount;

  // 作業タイトルを決定
  const workTitle = (() => {
    // 複数作業管理の場合、選択中のワークオーダーから取得
    if (selectedWorkOrder?.serviceKind) {
      const serviceKind = selectedWorkOrder.serviceKind;
      if (serviceKind === "車検") {
        return "車検作業";
      } else if (serviceKind === "12ヵ月点検") {
        return "12ヵ月点検作業";
      } else if (serviceKind === "エンジンオイル交換") {
        return "エンジンオイル交換作業";
      } else if (serviceKind === "タイヤ交換・ローテーション") {
        return "タイヤ交換・ローテーション作業";
      } else if (serviceKind === "その他") {
        return "その他のメンテナンス作業";
      } else if (serviceKind === "チューニング" || serviceKind === "パーツ取付") {
        return "チューニング・パーツ取付作業";
      } else if (serviceKind === "コーティング") {
        return "コーティング作業";
      } else if (serviceKind === "板金・塗装") {
        return "板金・塗装作業";
      } else if (serviceKind === "レストア") {
        return "レストア作業";
      } else if (serviceKind === "その他") {
        return "その他作業";
      } else if (serviceKind === "故障診断") {
        return "故障診断作業";
      } else if (serviceKind === "修理・整備") {
        return "修理・整備作業";
      } else {
        return `${serviceKind}作業`;
      }
    }
    // 単一作業の場合
    if (serviceKinds.includes("車検" as ServiceKind)) {
      return "車検作業";
    } else if (serviceKinds.includes("12ヵ月点検" as ServiceKind)) {
      return "12ヵ月点検作業";
    } else if (serviceKinds.includes("エンジンオイル交換" as ServiceKind)) {
      return "エンジンオイル交換作業";
    } else if (serviceKinds.includes("タイヤ交換・ローテーション" as ServiceKind)) {
      return "タイヤ交換・ローテーション作業";
    } else if (serviceKinds.includes("その他" as ServiceKind)) {
      return "その他のメンテナンス作業";
    } else if (
      serviceKinds.includes("チューニング" as ServiceKind) ||
      serviceKinds.includes("パーツ取付" as ServiceKind)
    ) {
      return "チューニング・パーツ取付作業";
    } else if (serviceKinds.includes("コーティング" as ServiceKind)) {
      return "コーティング作業";
    } else if (serviceKinds.includes("板金・塗装" as ServiceKind)) {
      return "板金・塗装作業";
    } else if (serviceKinds.includes("レストア" as ServiceKind)) {
      return "レストア作業";
    } else if (serviceKinds.includes("その他" as ServiceKind)) {
      return "その他作業";
    } else if (serviceKinds.includes("故障診断" as ServiceKind)) {
      return "故障診断作業";
    } else if (serviceKinds.includes("修理・整備" as ServiceKind)) {
      return "修理・整備作業";
    } else {
      return "作業";
    }
  })();

  // 現在の作業名を取得（選択中のワークオーダーから、またはserviceKindsから）
  const currentWorkOrderName = selectedWorkOrder?.serviceKind || (serviceKinds.length > 0 ? serviceKinds[0] : "作業");

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

  // データが読み込まれるまでモックデータを使用しない
  const vehicleName = job?.field6?.name ? extractVehicleName(job.field6.name) : (isJobLoading ? "読み込み中..." : "車両未登録");
  const licensePlate = job?.field6?.name ? extractLicensePlate(job.field6.name) : "";
  const customerName = job?.field4?.name || (isJobLoading ? "読み込み中..." : "未登録");
  const tagId = job?.tagId || null;

  // ヘルパー関数
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

  // ローディング状態: ジョブデータが読み込まれるまで表示しない
  if (isJobLoading || !job) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader maxWidthClassName="max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-200 animate-pulse rounded" />
            <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
          </div>
        </AppHeader>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="h-32 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-32 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-32 bg-slate-200 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ヘッダー */}
      <AppHeader maxWidthClassName="max-w-2xl">
        {/* ページタイトル */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-slate-600 shrink-0" />
            {workTitle}
          </h1>
        </div>
        
        {/* 案件情報（JobCardの情報階層に基づく） */}
        <CompactJobHeader
          job={job}
          customerName={customerName}
          vehicleName={vehicleName}
          licensePlate={licensePlate}
          tagId={tagId || undefined}
          serviceKind={serviceKinds.length > 0 ? serviceKinds[0] : undefined}
          currentWorkOrderName={currentWorkOrderName}
          assignedMechanic={job?.assignedMechanic}
          backHref="/"
          courtesyCars={courtesyCars}
        />
      </AppHeader>

      {/* ワークオーダー選択UI（複数作業がある場合のみ表示） */}
      {workOrders && workOrders.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
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
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* 進捗表示 */}
        {isInspection || isFaultDiagnosis || isRepair ? (
          <WorkProgressBar
            completed={completedCount}
            total={totalCount}
            className="mb-4"
          />
        ) : (
          <Card className="mb-4">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">作業進捗</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">
                    {completedCount} / {totalCount}
                  </span>
                  <Badge variant={allCompleted ? "default" : "secondary"} className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                    {allCompleted ? "完了" : "作業中"}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 注意事項 */}
        {!isBodyPaint && !isRestore && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">各作業後に証拠写真を撮影してください</p>
              <p className="text-amber-700">新品と旧品を並べて撮影するとわかりやすいです</p>
            </div>
          </div>
        )}

        {/* レストア用：作業管理ビュー */}
        {isRestore && (
          <div className="mb-4">
            <RestoreWorkView
              workData={restoreWorkData}
              onWorkDataChange={setRestoreWorkData}
              parts={
                (job as any)?.estimateData?.parts
                  ? ((job as any).estimateData.parts as RestorePartItem[])
                  : []
              }
              photoDataMap={restoreWorkPhotoData}
              onPhotoCapture={async (position, file) => {
                try {
                  const compressedFile = await compressImage(file);
                  const previewUrl = await getImagePreviewUrl(compressedFile);

                  setRestoreWorkPhotoData((prev) => ({
                    ...prev,
                    [position]: {
                      position,
                      file: compressedFile,
                      previewUrl,
                      isCompressing: false,
                    },
                  }));

                  // 作業記録の写真URLを更新
                  if (restoreWorkData) {
                    const updatedPhases = restoreWorkData.phases.map((phase) => ({
                      ...phase,
                      workRecords: phase.workRecords.map((record) =>
                        record.id === position
                          ? {
                              ...record,
                              photoUrls: [...(record.photoUrls || []), previewUrl],
                            }
                          : record
                      ),
                    }));
                    setRestoreWorkData({
                      ...restoreWorkData,
                      phases: updatedPhases,
                    });
                  }

                  toast.success("作業中の写真を撮影しました");
                } catch (error) {
                  console.error("写真撮影エラー:", error);
                  toast.error("写真の撮影に失敗しました");
                }
              }}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* 板金・塗装用：外注管理ビュー */}
        {isBodyPaint && (
          <div className="mb-4">
            <BodyPaintOutsourcingView
              outsourcingInfo={bodyPaintOutsourcingInfo}
              onOutsourcingInfoChange={setBodyPaintOutsourcingInfo}
              workDuration={(job as any)?.estimateData?.workDuration || 1}
              qualityCheckData={bodyPaintQualityCheckData}
              onQualityCheckDataChange={setBodyPaintQualityCheckData}
              photoDataMap={bodyPaintPhotoData}
              onPhotoCapture={async (position, file) => {
                try {
                  const compressedFile = await compressImage(file);
                  const previewUrl = await getImagePreviewUrl(compressedFile);

                  setBodyPaintPhotoData((prev) => ({
                    ...prev,
                    [position]: {
                      position,
                      file: compressedFile,
                      previewUrl,
                      isCompressing: false,
                    },
                  }));

                  setBodyPaintQualityCheckData((prev) => ({
                    ...prev,
                    checkItems: prev?.checkItems || [],
                    afterPhotoUrls: [
                      ...(prev?.afterPhotoUrls || []),
                      previewUrl,
                    ],
                    comments: prev?.comments || "",
                  } as QualityCheckData));

                  toast.success("After写真を撮影しました");
                } catch (error) {
                  console.error("写真撮影エラー:", error);
                  toast.error("写真の撮影に失敗しました");
                }
              }}
              onOrderClick={async () => {
                if (!bodyPaintOutsourcingInfo?.vendorName || !bodyPaintOutsourcingInfo?.orderMethod) {
                  toast.error("外注先名と発注方法を入力してください");
                  return;
                }
                setBodyPaintOutsourcingInfo((prev) => ({
                  ...prev!,
                  progress: "作業中",
                  orderDate: new Date().toISOString(),
                  deliveryDate: new Date().toISOString(),
                }));
                toast.success("外注先に発注しました");
              }}
              onCompletionNoticeClick={async () => {
                setBodyPaintOutsourcingInfo((prev) => ({
                  ...prev!,
                  progress: "作業完了",
                  completionDate: new Date().toISOString(),
                }));
                toast.success("作業完了連絡を受付けました");
              }}
              onPickupClick={async () => {
                setBodyPaintOutsourcingInfo((prev) => ({
                  ...prev!,
                  progress: "引き取り済み",
                  pickupDate: new Date().toISOString(),
                }));
                toast.success("引き取りを記録しました");
              }}
              onQualityCheckComplete={async () => {
                if ((bodyPaintQualityCheckData?.afterPhotoUrls || []).length === 0) {
                  toast.error("After写真を撮影してください");
                  return;
                }
                toast.success("品質確認が完了しました");
              }}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* コーティング用：乾燥プロセス管理・メンテナンス期間管理 */}
        {isCoating && (
          <CoatingWorkManagement
            dryingProcess={coatingDryingProcess}
            onDryingProcessChange={setCoatingDryingProcess}
            maintenancePeriod={coatingMaintenancePeriod}
            onMaintenancePeriodChange={setCoatingMaintenancePeriod}
            disabled={isSubmitting}
          />
        )}

        {/* 作業項目リスト */}
        {!isRestore && (
          <div className="space-y-3">
            {isInspection || isFaultDiagnosis || isRepair || isTireReplacement || isMaintenance || isTuningParts || isCoating ? (
            // 車検・故障診断・修理・整備・タイヤ交換・ローテーション・その他のメンテナンス用：承認された作業項目カード
            approvedWorkItems.length > 0 ? (
              approvedWorkItems.map((item) => (
                <ApprovedWorkItemCard
                  key={item.id}
                  item={item}
                  onBeforePhotoCapture={async (itemId, file) => {
                    // Before写真を保存
                    try {
                      const compressedFile = await compressImage(file);
                      const previewUrl = await getImagePreviewUrl(compressedFile);
                      
                      setApprovedWorkItems((prev) =>
                        prev.map((item) =>
                          item.id === itemId
                            ? {
                                ...item,
                                beforePhotos: [
                                  ...item.beforePhotos,
                                  {
                                    position: itemId,
                                    file: compressedFile,
                                    previewUrl,
                                    isCompressing: false,
                                  },
                                ],
                              }
                            : item
                        )
                      );
                      
                      toast.success("Before写真を撮影しました");
                    } catch (error) {
                      console.error("Before写真撮影エラー:", error);
                      toast.error("写真の撮影に失敗しました");
                    }
                  }}
                  onAfterPhotoCapture={async (itemId, file) => {
                    // After写真を保存
                    try {
                      const compressedFile = await compressImage(file);
                      const previewUrl = await getImagePreviewUrl(compressedFile);
                      
                      setApprovedWorkItems((prev) =>
                        prev.map((item) =>
                          item.id === itemId
                            ? {
                                ...item,
                                afterPhotos: [
                                  ...item.afterPhotos,
                                  {
                                    position: itemId,
                                    file: compressedFile,
                                    previewUrl,
                                    isCompressing: false,
                                  },
                                ],
                              }
                            : item
                        )
                      );
                      
                      toast.success("After写真を撮影しました");
                    } catch (error) {
                      console.error("After写真撮影エラー:", error);
                      toast.error("写真の撮影に失敗しました");
                    }
                  }}
                  onCommentChange={(itemId, comment) => {
                    setApprovedWorkItems((prev) =>
                      prev.map((item) =>
                        item.id === itemId ? { ...item, comment } : item
                      )
                    );
                  }}
                  onComplete={(itemId) => {
                    setApprovedWorkItems((prev) =>
                      prev.map((item) =>
                        item.id === itemId
                          ? { ...item, status: "completed" }
                          : item
                      )
                    );
                    toast.success("項目を完了しました");
                  }}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-slate-500">
                  承認された作業項目がありません
                </CardContent>
              </Card>
            )
          ) : (
            // その他用：既存のWorkItemCard
            workItems.map((item) => (
              <WorkItemCard
                key={item.id}
                item={item}
                onCapture={handleCapture}
                onComplete={handleItemComplete}
              />
            ))
          )}
          </div>
        )}
      </main>

      {/* 完了ボタン（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <SwipeToCompleteButton
            onComplete={handleAllComplete}
            disabled={!allCompleted}
          />
        </div>
      </div>

      {/* 作業追加ダイアログ */}
      <AddWorkOrderDialog
        open={isAddWorkOrderDialogOpen}
        onOpenChange={setIsAddWorkOrderDialogOpen}
        job={job || null}
        existingServiceKinds={workOrders?.map((wo) => wo.serviceKind as ServiceKind) || serviceKinds}
        onSuccess={handleAddWorkOrderSuccess}
      />
    </div>
  );
}

