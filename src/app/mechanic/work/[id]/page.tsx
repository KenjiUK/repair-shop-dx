"use client";

// Note: クライアントコンポーネントはデフォルトで動的レンダリングされるため、force-dynamicは不要

import { useState, useRef, useMemo, Suspense, useCallback } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { compressImage, getImagePreviewUrl } from "@/lib/compress";
import Image from "next/image";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { fetchCustomerById } from "@/lib/api";
import { sendLineNotification } from "@/lib/line-api";
import { ServiceKind } from "@/types";
import { ApprovedWorkItemCard, ApprovedWorkItem } from "@/components/features/approved-work-item-card";
import { WorkProgressBar } from "@/components/features/work-progress-bar";
import { useWorkOrders, updateWorkOrder, createWorkOrder } from "@/hooks/use-work-orders";
import { WorkOrderSelector } from "@/components/features/work-order-selector";
import { useAutoSave } from "@/hooks/use-auto-save";
import { SaveStatusIndicator } from "@/components/features/save-status-indicator";
import { ReplacementPart } from "@/lib/inspection-pdf-generator";
import useSWR from "swr";
import { fetchJobById, updateJobStatus, completeWork, fetchAllCourtesyCars } from "@/lib/api";
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
  Loader2,
  Notebook,
  AlertCircle,
  Eye,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { CompactJobHeader } from "@/components/layout/compact-job-header";
import { User, Printer } from "lucide-react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { VoiceInputButton } from "@/components/features/voice-input-button";

// ダイアログコンポーネントを動的インポート（コード分割）
const AddWorkOrderDialog = dynamic(
  () => import("@/components/features/add-work-order-dialog").then(mod => ({ default: mod.AddWorkOrderDialog })),
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
import { parseJobMemosFromField26 } from "@/lib/job-memo-parser";
import { usePageTiming } from "@/hooks/use-page-timing";
import { withFetcherTiming } from "@/lib/api-timing";
import {
  InspectionWorkView,
  AcceptanceInspectionData,
  FinalInspectionData,
  QualityCheckData as InspectionQualityCheckData,
  ReplacementPartItem,
} from "@/components/features/inspection-work-view";
import { getOrCreateWorkOrderFolder, uploadFile } from "@/lib/google-drive";
import { setNavigationHistory, getPageTypeFromPath, saveCurrentPath } from "@/lib/navigation-history";

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
    beforePhotoUrl: null,
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-3",
    name: "Fブレーキパッド交換",
    category: "ブレーキ",
    beforePhotoUrl: null,
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-4",
    name: "タイヤローテーション",
    category: "足回り",
    beforePhotoUrl: null,
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
                <Check className="h-5 w-5 text-white shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
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
                item.isCompleted ? "text-green-700 dark:text-green-400" : "text-slate-900 dark:text-white"
              )}>
                {item.name}
              </p>
              <Badge variant="outline" className="text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {item.category}
              </Badge>
            </div>

            {/* Before写真（あれば） */}
            {item.beforePhotoUrl && (
              <div className="mt-2 mb-3">
                <p className="text-base text-slate-700 dark:text-white mb-1">Before:</p>
                <div className="relative w-24 h-18 rounded border overflow-hidden">
                  <Image
                    src={item.beforePhotoUrl}
                    alt="Before"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              </div>
            )}

            {/* After写真プレビュー（撮影済みの場合） */}
            {item.afterPhotoUrl && (
              <div className="mt-2 mb-3">
                <p className="text-base text-green-700 dark:text-green-400 mb-1">✓ After:</p>
                <div className="relative w-24 h-18 rounded border border-green-400 overflow-hidden">
                  <Image
                    src={item.afterPhotoUrl}
                    alt="After"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
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
                size="default"
                onClick={handleCameraClick}
                disabled={item.isCapturing || item.isCompleted}
                className="flex-1"
                aria-label={item.afterPhotoUrl ? `${item.name}の再撮影` : `${item.name}の完了撮影`}
              >
                {item.isCapturing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" aria-hidden="true" />
                    圧縮中...
                  </div>
                ) : (
                  <>
                    <Camera className="h-5 w-5 mr-1 shrink-0" aria-hidden="true" />
                    {item.afterPhotoUrl ? "再撮影" : "完了撮影"}
                  </>
                )}
              </Button>

              {/* 完了ボタン */}
              {item.afterPhotoUrl && !item.isCompleted && (
                <Button
                  variant="secondary"
                  size="default"
                  onClick={() => onComplete(item.id)}
                  className="bg-green-100 text-green-700 hover:bg-green-200"
                  aria-label={`${item.name}を完了`}
                >
                  <CheckCircle2 className="h-5 w-5 mr-1 shrink-0" aria-hidden="true" />
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
 * 作業完了ボタンコンポーネント（改善提案 #7）
 * 明確なボタンUIと確認ダイアログで誤操作を防止
 */
function WorkCompleteButton({
  onComplete,
  disabled,
  completedCount,
  totalCount,
  isAllWorkOrdersCompleted = false,
}: {
  onComplete: () => void;
  disabled: boolean;
  completedCount: number;
  totalCount: number;
  isAllWorkOrdersCompleted?: boolean;
}) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    triggerHapticFeedback("medium");
    setShowConfirmDialog(true);
  };

  const handleConfirm = () => {
    triggerHapticFeedback("success");
    onComplete();
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled}
        size="lg"
        className={cn(
          "w-full h-16 text-lg font-bold transition-all shadow-lg",
          disabled
            ? "bg-slate-200 text-slate-700 cursor-not-allowed hover:bg-slate-200"
            : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-xl"
        )}
        aria-label={disabled ? `全項目を完了してください（${completedCount}/${totalCount}）` : "全作業を完了する"}
      >
        <div className="flex items-center justify-center gap-3">
          {disabled ? (
            <>
              <AlertCircle className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span className="break-words sm:whitespace-nowrap">
                全項目を完了してください ({completedCount}/{totalCount})
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
              <span className="break-words sm:whitespace-nowrap">作業を完了する</span>
            </>
          )}
        </div>
      </Button>

      {/* 確認ダイアログ */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              作業完了の確認
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              {isAllWorkOrdersCompleted
                ? "全作業を完了しますか？作業を完了すると、ステータスが「出庫待ち」に変更されます。"
                : "すべての作業項目が完了していますか？作業を完了すると、ステータスが「出庫待ち」に変更されます。"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 h-12 text-base"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12 text-base"
            >
              <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
              完了する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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

/**
 * ジョブ取得フェッチャー（API応答時間計測付き）
 */
const jobFetcherWithTiming = (jobId: string) =>
  withFetcherTiming(() => jobFetcher(jobId), "fetchJobById", "work");

// =============================================================================
// Main Page Component
// =============================================================================

function MechanicWorkPageContent() {
  const router = useRouter();
  const pathname = usePathname();
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
  usePageTiming("work", true);

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
      console.error("[Work] Failed to get previous path from sessionStorage:", error);
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
          console.log("[Work] Navigation history saved from sessionStorage:", { previousPath, referrerType });
        }
      } catch (error) {
        console.error("[Work] Failed to parse previous path:", error);
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
              console.log("[Work] Navigation history saved from referrer:", { referrerPath, referrerType });
            }
          } else {
            // 同じページへの遷移（リロードなど）は履歴を保持
            // 既存の履歴があればそのまま使用
          }
        }
      } catch (error) {
        console.error("[Work] Failed to record navigation history from referrer:", error);
      }
    }

    // 現在のパスを保存（次回のページ読み込み時に使用）
    saveCurrentPath(currentPathname, window.location.search);
  }, [jobId]); // jobIdが変更された時のみ実行（ページ遷移時）

  // ワークオーダーを取得
  const { workOrders, isLoading: isLoadingWorkOrders, mutate: mutateWorkOrders } = useWorkOrders(jobId);

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

  // PDF生成中フラグ
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // 作業メモダイアログの状態
  const [isJobMemoDialogOpen, setIsJobMemoDialogOpen] = useState(false);

  // サービス種類を判定
  const serviceKinds = job?.field_service_kinds || (job?.serviceKind ? [job.serviceKind] : []);

  // 選択中のワークオーダーのサービス種類を優先（複数作業管理の場合）
  const primaryServiceKind = useMemo(() => {
    if (selectedWorkOrder?.serviceKind) {
      return selectedWorkOrder.serviceKind as ServiceKind;
    }
    // ワークオーダーがない場合、serviceKindsの最初のものを使用
    return serviceKinds.length > 0 ? (serviceKinds[0] as ServiceKind) : undefined;
  }, [selectedWorkOrder, serviceKinds]);

  // デバッグログ（開発環境のみ）
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[作業画面] サービス種類判定:", {
        serviceKinds,
        primaryServiceKind,
        selectedWorkOrderId: selectedWorkOrder?.id,
        selectedWorkOrderServiceKind: selectedWorkOrder?.serviceKind,
      });
    }
  }, [serviceKinds, primaryServiceKind, selectedWorkOrder]);

  const isInspection = useMemo(() => {
    // 選択中のワークオーダーのサービス種類を優先
    if (primaryServiceKind) {
      return primaryServiceKind === "車検" || primaryServiceKind === "12ヵ月点検";
    }
    // フォールバック：serviceKindsから判定
    return serviceKinds.includes("車検" as ServiceKind) || serviceKinds.includes("12ヵ月点検" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);

  // 24ヶ月点検（車検）フラグ
  const is24MonthInspection = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "車検";
    }
    return serviceKinds.includes("車検" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);

  // 12ヶ月点検フラグ
  const is12MonthInspection = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "12ヵ月点検";
    }
    return serviceKinds.includes("12ヵ月点検" as ServiceKind);
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

  // 承認された作業項目の状態管理（車検の場合）
  const [approvedWorkItems, setApprovedWorkItems] = useState<ApprovedWorkItem[]>([]);
  // 無限ループを防ぐため、前の値を保持
  const approvedWorkItemsRef = useRef<ApprovedWorkItem[]>([]);

  // ========================================
  // 法定点検作業用の状態管理（Phase 5: 整備・完成検査）
  // ========================================
  // 受入点検データ（Phase 2からの引き継ぎ）
  const [acceptanceData, setAcceptanceData] = useState<AcceptanceInspectionData | undefined>(undefined);
  // 完成検査データ（テスター値）
  const [finalInspectionData, setFinalInspectionData] = useState<FinalInspectionData>({});
  // 品質管理・最終検査データ
  const [inspectionQualityCheckData, setInspectionQualityCheckData] = useState<InspectionQualityCheckData>({});
  
  // 交換部品等（Phase 5で入力）
  const [replacementParts, setReplacementParts] = useState<ReplacementPartItem[]>([]);

  // 整備アドバイス（Phase 2からの引き継ぎ、Phase 5で編集）
  const [maintenanceAdvice, setMaintenanceAdvice] = useState<string>("");

  // 既存のWorkItem形式の状態管理（非車検の場合）
  // 注意: 現在はすべてのサービス種類で承認された作業項目を使用するため、workItemsは使用されていません
  // ただし、後方互換性のために残しています
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

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
    selectedWorkOrder?.work?.coatingInfo?.dryingProcess as CoatingDryingProcess | undefined
  );
  const [coatingMaintenancePeriod, setCoatingMaintenancePeriod] = useState<CoatingMaintenancePeriod | undefined>(
    selectedWorkOrder?.work?.coatingInfo?.maintenancePeriod as CoatingMaintenancePeriod | undefined
  );

  // コーティング用：既存データの読み込み
  useEffect(() => {
    if (isCoating && selectedWorkOrder?.work?.coatingInfo) {
      setCoatingDryingProcess(selectedWorkOrder.work.coatingInfo.dryingProcess as CoatingDryingProcess | undefined);
      setCoatingMaintenancePeriod(selectedWorkOrder.work.coatingInfo.maintenancePeriod as CoatingMaintenancePeriod | undefined);
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

  // 法定点検用：受入点検データの読み込み（Phase 2からの引き継ぎ）
  useEffect(() => {
    if ((isInspection || is12MonthInspection) && selectedWorkOrder?.diagnosis) {
      const diagnosis = selectedWorkOrder.diagnosis as any;
      const data: AcceptanceInspectionData = {
        items: diagnosis.items?.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          status: item.status,
          comment: item.comment,
        })) || [],
        measurements: diagnosis.inspectionMeasurements,
      };
      setAcceptanceData(data);
      // 整備アドバイスを読み込み
      if (diagnosis.maintenanceAdvice) {
        setMaintenanceAdvice(diagnosis.maintenanceAdvice);
      }
    }
  }, [isInspection, is12MonthInspection, selectedWorkOrder]);

  // 法定点検用：診断画面から引き継いだ作業データの読み込み（追加見積もりがない場合）
  useEffect(() => {
    if ((isInspection || is12MonthInspection) && selectedWorkOrder?.work) {
      const work = selectedWorkOrder.work as any;
      // 交換部品等を読み込み
      if (work.replacementParts && work.replacementParts.length > 0 && replacementParts.length === 0) {
        setReplacementParts(work.replacementParts);
      }
      // 測定値を読み込み（finalInspectionDataに反映）
      if (work.measurements && Object.keys(work.measurements).length > 0 && Object.keys(finalInspectionData).length === 0) {
        setFinalInspectionData(work.measurements);
      }
      // 品質管理・最終検査を読み込み
      if (work.qualityCheck && Object.keys(work.qualityCheck).length > 0 && Object.keys(inspectionQualityCheckData).length === 0) {
        setInspectionQualityCheckData(work.qualityCheck);
      }
      // 作業メモを読み込み
      if (work.memo && !maintenanceAdvice) {
        setMaintenanceAdvice(work.memo);
      }
    }
  }, [isInspection, is12MonthInspection, selectedWorkOrder, replacementParts.length, finalInspectionData, inspectionQualityCheckData, maintenanceAdvice]);

  // 法定点検用：承認済み作業項目から交換部品を自動生成
  useEffect(() => {
    if ((isInspection || is12MonthInspection) && acceptanceData?.items && replacementParts.length === 0) {
      // 「交換」ステータスの項目から自動生成
      const exchangeItems = acceptanceData.items.filter(
        (item) => item.status === "exchange"
      );
      
      if (exchangeItems.length > 0) {
        const autoGeneratedParts: ReplacementPartItem[] = exchangeItems.map((item) => ({
          id: `auto-${item.id}`,
          name: item.name,
          quantity: 1,
          unit: "個",
          isAutoGenerated: true,
        }));
        setReplacementParts(autoGeneratedParts);
      }
    }
  }, [isInspection, is12MonthInspection, acceptanceData, replacementParts.length]);

  /**
   * 分解整備記録簿PDF出力（テンプレートPDF使用）
   */
  const handlePrintInspectionRecord = async () => {
    if (!job || !selectedWorkOrder) return;

    const isInspectionWork = selectedWorkOrder.serviceKind === "車検" || selectedWorkOrder.serviceKind === "12ヵ月点検";
    if (!isInspectionWork) return;

    setIsGeneratingPDF(true);
    triggerHapticFeedback("medium");

    try {
      if (!selectedWorkOrder?.diagnosis?.items) {
        toast.error("診断データが見つかりません");
        return;
      }

      // 検査項目を取得
      const inspectionItems: InspectionItem[] = selectedWorkOrder.diagnosis.items.map((item) => {
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

      // 24ヶ月点検リデザイン版の測定値データを取得
      const diagnosisMeasurements = (selectedWorkOrder.diagnosis as any)?.inspectionMeasurements;
      const diagnosisInspectionParts = (selectedWorkOrder.diagnosis as any)?.inspectionParts;
      const diagnosisCustomParts = (selectedWorkOrder.diagnosis as any)?.customParts;

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
        replacementParts: [
          // 24ヶ月点検リデザイン版の交換部品データを変換
          ...(diagnosisInspectionParts?.engineOil ? [{ name: "エンジンオイル", quantity: diagnosisInspectionParts.engineOil, unit: "L" }] : []),
          ...(diagnosisInspectionParts?.oilFilter ? [{ name: "オイルフィルター", quantity: diagnosisInspectionParts.oilFilter, unit: "個" }] : []),
          ...(diagnosisInspectionParts?.llc ? [{ name: "LLC", quantity: diagnosisInspectionParts.llc, unit: "L" }] : []),
          ...(diagnosisInspectionParts?.brakeFluid ? [{ name: "ブレーキフルード", quantity: diagnosisInspectionParts.brakeFluid, unit: "L" }] : []),
          ...(diagnosisInspectionParts?.wiperRubber ? [{ name: "ワイパーゴム", quantity: diagnosisInspectionParts.wiperRubber, unit: "個" }] : []),
          ...(diagnosisInspectionParts?.cleanAirFilter ? [{ name: "クリーンエアフィルター", quantity: diagnosisInspectionParts.cleanAirFilter, unit: "個" }] : []),
          // カスタム部品
          ...(diagnosisCustomParts || []).map((part: { name: string; quantity: string }) => ({
            name: part.name,
            quantity: parseFloat(part.quantity) || 1,
            unit: "",
          })),
        ],
        mechanicName: job.assignedMechanic || "未設定",
        mileage: job.field10 || null, // 顧客申告の走行距離（無ければnull、空欄になる）
        inspectionDate: new Date().toISOString(),
        // 24ヶ月点検リデザイン版の測定値データ
        measurements: diagnosisMeasurements ? {
          coConcentration: diagnosisMeasurements.coConcentration,
          hcConcentration: diagnosisMeasurements.hcConcentration,
          brakePadFrontLeft: diagnosisMeasurements.brakePadFrontLeft,
          brakePadFrontRight: diagnosisMeasurements.brakePadFrontRight,
          brakePadRearLeft: diagnosisMeasurements.brakePadRearLeft,
          brakePadRearRight: diagnosisMeasurements.brakePadRearRight,
          tireDepthFrontLeft: diagnosisMeasurements.tireDepthFrontLeft,
          tireDepthFrontRight: diagnosisMeasurements.tireDepthFrontRight,
          tireDepthRearLeft: diagnosisMeasurements.tireDepthRearLeft,
          tireDepthRearRight: diagnosisMeasurements.tireDepthRearRight,
        } : undefined,
      };

      // テンプレートタイプを判定（12ヶ月点検か24ヶ月点検か）
      const templateType: "12month" | "24month" =
        selectedWorkOrder.serviceKind === "12ヵ月点検" ? "12month" : "24month";

      // PDFテンプレートを生成
      const { generateInspectionTemplatePDF } = await import("@/lib/inspection-template-pdf-generator");
      const pdfResult = await generateInspectionTemplatePDF(recordData, templateType);

      if (!pdfResult.success || !pdfResult.data) {
        throw new Error(pdfResult.error?.message || "PDFの生成に失敗しました");
      }

      // PDFをダウンロード
      const pdfBlob = pdfResult.data;
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `分解整備記録簿_${new Date().toISOString().split("T")[0].replace(/-/g, "")}_${vehicleName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("分解整備記録簿をダウンロードしました", {
        description: "PDFファイルを印刷してください",
      });
    } catch (error) {
      console.error("分解整備記録簿PDF出力エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "PDFの出力に失敗しました";
      toast.error("PDFの出力に失敗しました", {
        description: errorMessage,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };


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
   * 現在の作業データを構築する関数（途中保存用）
   */
  const buildWorkData = useCallback((): any => {
    if (!job) return null;

    // ワークオーダーがない場合は下書き保存しない
    if (!selectedWorkOrder?.id) return null;

    // サービス種類に応じて作業データを構築
    if (isInspection) {
      // 車検・12ヵ月点検の場合：作業データは分解整備記録簿生成時にのみ保存されるため、途中保存は不要
      return null;
    } else if (isFaultDiagnosis || isRepair) {
      // 故障診断・修理・整備の場合：承認された作業項目から作業データを構築
      const completedItems = approvedWorkItems.filter((i) => i.status === "completed").map((i) => i.id);

      const workData = {
        records: approvedWorkItems.map((item) => ({
          time: new Date().toISOString(),
          content: item.name,
          photos: [
            ...item.beforePhotos.map((p) => ({ type: "before" as const, url: p.previewUrl || "", fileId: undefined })),
            ...item.afterPhotos.map((p) => ({ type: "after" as const, url: p.previewUrl || "", fileId: undefined })),
          ],
          comment: item.comment || undefined,
          mechanicName: item.mechanicName || null,
        })),
        mechanicName: job.assignedMechanic || undefined,
      };

      return workData;
    } else if (isTireReplacement || isMaintenance || isTuningParts || isCoating) {
      // タイヤ交換・ローテーション・その他のメンテナンス・チューニング・パーツ取付・コーティングの場合
      const workData = {
        records: approvedWorkItems.map((item) => ({
          time: new Date().toISOString(),
          content: item.name,
          photos: [
            ...item.beforePhotos.map((p) => ({ type: "before" as const, url: p.previewUrl || "", fileId: undefined })),
            ...item.afterPhotos.map((p) => ({ type: "after" as const, url: p.previewUrl || "", fileId: undefined })),
          ],
          mechanicName: item.mechanicName || null,
        })),
        mechanicName: job.assignedMechanic || undefined,
        // コーティング固有情報
        coatingInfo: isCoating && (coatingDryingProcess || coatingMaintenancePeriod) ? {
          dryingProcess: coatingDryingProcess,
          maintenancePeriod: coatingMaintenancePeriod,
        } : undefined,
      };

      return workData;
    } else if (isBodyPaint) {
      // 板金・塗装の場合：外注情報と品質確認データを含む
      const workData = {
        records: [],
        mechanicName: job.assignedMechanic || undefined,
        bodyPaintInfo: {
          outsourcingInfo: bodyPaintOutsourcingInfo,
          qualityCheckData: bodyPaintQualityCheckData,
        },
      };

      return workData;
    } else if (isRestore) {
      // レストアの場合：作業進捗データを含む
      const workData = {
        records: [],
        mechanicName: job.assignedMechanic || undefined,
        restoreWorkData: restoreWorkData,
      };

      return workData;
    } else {
      // その他の場合：承認された作業項目から作業データを構築
      const workData = {
        records: approvedWorkItems
          .filter((i) => i.status === "completed")
          .map((item) => ({
            time: new Date().toISOString(),
            content: item.name,
            photos: [
              ...item.beforePhotos.map((p) => ({ type: "before" as const, url: p.previewUrl || "", fileId: undefined })),
              ...item.afterPhotos.map((p) => ({ type: "after" as const, url: p.previewUrl || "", fileId: undefined })),
            ],
            comment: item.comment || undefined,
            mechanicName: item.mechanicName || null,
          })),
        mechanicName: job.assignedMechanic || undefined,
      };

      return workData;
    }
  }, [
    job,
    selectedWorkOrder?.id,
    isInspection,
    isFaultDiagnosis,
    isRepair,
    approvedWorkItems,
    isTireReplacement,
    isMaintenance,
    isTuningParts,
    isCoating,
    coatingDryingProcess,
    coatingMaintenancePeriod,
    isBodyPaint,
    bodyPaintOutsourcingInfo,
    bodyPaintQualityCheckData,
    isRestore,
    restoreWorkData,
    workItems,
  ]);

  /**
   * 作業データを下書き保存する関数
   */
  const saveDraftWork = useCallback(async (workData: any) => {
    if (!job || !workData || !selectedWorkOrder?.id) return;

    const updateResult = await updateWorkOrder(jobId, selectedWorkOrder.id, {
      work: workData,
      // ステータスは変更しない（下書き保存）
    });

    if (!updateResult.success) {
      throw new Error(updateResult.error?.message || "下書き保存に失敗しました");
    }

    // ワークオーダーリストを再取得
    await mutateWorkOrders();
  }, [job, jobId, selectedWorkOrder?.id, mutateWorkOrders]);

  /**
   * 自動保存フック
   * 作業データのスナップショットを作成し、変更を検知して自動保存
   */
  const workDataSnapshot = useMemo(() => {
    return buildWorkData();
  }, [
    job,
    selectedWorkOrder?.id,
    isInspection,
    isFaultDiagnosis,
    isRepair,
    approvedWorkItems,
    isTireReplacement,
    isMaintenance,
    isTuningParts,
    isCoating,
    coatingDryingProcess,
    coatingMaintenancePeriod,
    isBodyPaint,
    bodyPaintOutsourcingInfo,
    bodyPaintQualityCheckData,
    isRestore,
    restoreWorkData,
    workItems,
  ]);

  const { saveStatus, saveManually, hasUnsavedChanges } = useAutoSave({
    data: workDataSnapshot,
    onSave: saveDraftWork,
    debounceMs: 2000,
    disabled: !selectedWorkOrder?.id || !job, // ワークオーダーがない場合は無効化
    onSaveSuccess: () => {
      // 保存成功時のトースト通知
      toast.success("保存しました");
    },
    onSaveError: (error) => {
      console.error("作業データの下書き保存エラー:", error);
      // 保存失敗時のトースト通知
      toast.error("保存に失敗しました", {
        description: error.message || "エラーが発生しました",
      });
    },
  });

  /**
   * 全作業完了ハンドラ
   */
  const handleAllComplete = async () => {
    if (!job) return;

    // エラーチェック：作業項目が1つ以上あるか確認
    // 板金・塗装とレストアの場合は、外注管理ビュー/レストア作業ビュー内で完了チェックが行われるため、別処理
    if (isBodyPaint) {
      // 板金・塗装の場合：品質確認が完了しているか確認
      if (!bodyPaintQualityCheckData || (bodyPaintQualityCheckData.afterPhotoUrls || []).length === 0) {
        toast.error("品質確認を完了してください", {
          description: "After写真を撮影して品質確認を完了してください",
        });
        return;
      }
    } else if (isRestore) {
      // レストアの場合：作業進捗が設定されているか確認
      if (!restoreWorkData || restoreWorkData.phases.length === 0) {
        toast.error("作業進捗を設定してください", {
          description: "レストア作業の進捗を設定してください",
        });
        return;
      }
    } else if (isInspection || isFaultDiagnosis || isRepair || isTireReplacement || isMaintenance || isTuningParts || isCoating || isOther) {
      // 24ヶ月点検（車検）で追加見積もりがない場合、作業項目がなくても完了可能
      const is24MonthInspectionWithoutWorkItems = 
        isInspection && 
        selectedWorkOrder?.serviceKind === "車検" && 
        approvedWorkItems.length === 0;
      
      if (!is24MonthInspectionWithoutWorkItems) {
        // 通常の場合は作業項目が必要
        const hasApprovedItems = approvedWorkItems.length > 0;
        if (!hasApprovedItems) {
          toast.error("作業項目がありません", {
            description: "見積もりが承認されていないか、作業項目が設定されていません",
          });
          return;
        }

        // エラーチェック：作業項目が1つ以上完了しているか確認
        const completedCount = approvedWorkItems.filter((i) => i.status === "completed").length;
        if (completedCount === 0) {
          toast.error("作業項目を完了してください", {
            description: "少なくとも1つの作業項目を完了してください",
          });
          return;
        }
      }
    }

    setIsSubmitting(true);
    let hasError = false;
    let errorMessage = "";

    try {
      // 選択中のワークオーダーのサービス種類を優先して判定
      const currentServiceKind = primaryServiceKind || (serviceKinds.length > 0 ? serviceKinds[0] : undefined);
      const shouldGenerateRecordBook = currentServiceKind === "車検" || currentServiceKind === "12ヵ月点検";

      // デバッグログ（開発環境のみ）
      if (process.env.NODE_ENV === "development") {
        console.log("[作業画面] 分解整備記録簿生成判定:", {
          currentServiceKind,
          shouldGenerateRecordBook,
          isInspection,
          selectedWorkOrderId: selectedWorkOrder?.id,
          selectedWorkOrderServiceKind: selectedWorkOrder?.serviceKind,
        });
      }

      if (shouldGenerateRecordBook) {
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
          mileage: job.field10 || null, // 顧客申告の走行距離（無ければnull、空欄になる）
          inspectionDate: new Date().toISOString(),
        };

        // テンプレートタイプを判定（12ヶ月点検か24ヶ月点検か）
        const templateType: "12month" | "24month" =
          inspectionWorkOrder.serviceKind === "12ヵ月点検" ? "12month" : "24month";

        // 引渡処理を実行（テンプレートPDFを使用）
        const deliveryResult = await completeInspectionDelivery(
          jobId,
          recordData,
          job.field4?.id || "",
          customerName,
          job.field6?.id || "",
          vehicleName,
          true, // useTemplate: テンプレートPDFを使用
          templateType
        );

        if (!deliveryResult.success) {
          throw new Error(deliveryResult.error?.message || "引渡処理に失敗しました");
        }

        // 作業データを保存（workOrderIdを含める）
        if (selectedWorkOrder?.id && inspectionWorkOrder?.id === selectedWorkOrder.id) {
          // 複数作業管理対応：作業データを選択中のワークオーダーに保存
          // 診断画面から引き継いだデータ（交換部品、測定値、品質管理など）を取得
          const existingWorkData = selectedWorkOrder.work as any;
          const workData = {
            records: approvedWorkItems.length > 0 ? approvedWorkItems
              .filter((i) => i.status === "completed")
              .map((i) => ({
                time: new Date().toISOString(),
                content: i.name,
                photos: [],
              })) : [{
              time: new Date().toISOString(),
              content: "分解整備記録簿を生成",
              photos: [],
            }],
            completedAt: new Date().toISOString(),
            mechanicName: job.assignedMechanic || undefined,
            // 診断画面から引き継いだデータを保存
            replacementParts: replacementParts.length > 0 ? replacementParts : existingWorkData?.replacementParts,
            measurements: finalInspectionData && Object.keys(finalInspectionData).length > 0 ? finalInspectionData : existingWorkData?.measurements,
            qualityCheck: inspectionQualityCheckData && Object.keys(inspectionQualityCheckData).length > 0 ? inspectionQualityCheckData : existingWorkData?.qualityCheck,
            memo: maintenanceAdvice || existingWorkData?.memo,
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
          // 単一作業の場合：ワークオーダーを作成してからworkデータを保存
          const serviceKindForWorkOrder = primaryServiceKind || serviceKinds[0] || "故障診断";

          // ワークオーダーを作成
          const createResult = await createWorkOrder(jobId, serviceKindForWorkOrder);
          if (!createResult.success || !createResult.data) {
            throw new Error(createResult.error?.message || "ワークオーダーの作成に失敗しました");
          }

          const newWorkOrder = createResult.data;

          // 作業データを保存
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

          const updateResult = await updateWorkOrder(jobId, newWorkOrder.id, {
            work: workData,
            status: "完了",
          });

          if (!updateResult.success) {
            throw new Error(updateResult.error?.message || "作業の保存に失敗しました");
          }

          // ワークオーダーリストを再取得
          await mutateWorkOrders();

          // ステータスを更新
          await updateJobStatus(jobId, "出庫待ち");
        }

        toast.success("作業が完了しました！", {
          description: selectedWorkOrder?.id
            ? "作業データを保存しました"
            : "作業データを保存しました",
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
          // 単一作業の場合：ワークオーダーを作成してからworkデータを保存
          const serviceKindForWorkOrder = primaryServiceKind || serviceKinds[0] || "修理・整備";

          // ワークオーダーを作成
          const createResult = await createWorkOrder(jobId, serviceKindForWorkOrder);
          if (!createResult.success || !createResult.data) {
            throw new Error(createResult.error?.message || "ワークオーダーの作成に失敗しました");
          }

          const newWorkOrder = createResult.data;

          // 作業データを保存
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

          const updateResult = await updateWorkOrder(jobId, newWorkOrder.id, {
            work: workData,
            status: "完了",
          });

          if (!updateResult.success) {
            throw new Error(updateResult.error?.message || "作業の保存に失敗しました");
          }

          // ワークオーダーリストを再取得
          await mutateWorkOrders();

          // ステータス更新と顧客情報取得を並列実行（パフォーマンス改善）
          const [statusResult, customerResult] = await Promise.all([
            updateJobStatus(jobId, "出庫待ち"),
            fetchCustomerById(job.field4?.id || ""),
          ]);

          // 作業完了のLINE通知を送信
          if (customerResult.success && customerResult.data?.Business_Messaging_Line_Id) {
            try {
              const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
              const serviceKind = serviceKinds.length > 0 ? serviceKinds[0] : "その他";

              await sendLineNotification({
                lineUserId: customerResult.data.Business_Messaging_Line_Id || "",
                type: "work_complete",
                jobId,
                data: {
                  customerName: job.field4?.name || "お客様",
                  vehicleName: job.field6?.name || "車両",
                  licensePlate: job.field6?.name ? job.field6.name.split(" / ")[1] || undefined : undefined,
                  serviceKind,
                },
              });
            } catch (error) {
              console.warn("LINE通知送信エラー（作業完了）:", error);
              // LINE通知の失敗は作業完了処理を止めない
            }
          }
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
              mechanicName: item.mechanicName || null,
            })),
            completedAt: new Date().toISOString(),
            mechanicName: job.assignedMechanic || undefined,
            // コーティング固有情報
            coatingInfo: isCoating && (coatingDryingProcess || coatingMaintenancePeriod) ? {
              dryingProcess: JSON.stringify(coatingDryingProcess) as unknown as string,
              maintenancePeriod: JSON.stringify(coatingMaintenancePeriod) as unknown as string,
            } : undefined,
          } as {
            records: Array<{ time: string; content: string; photos: Array<{ type: "before" | "after"; url: string; fileId?: string }>; mechanicName?: string | null }>;
            completedAt: string;
            mechanicName?: string;
            coatingInfo?: { [key: string]: unknown; dryingProcess?: string; maintenancePeriod?: string };
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
          // 単一作業の場合：ワークオーダーを作成してからworkデータを保存
          const serviceKindForWorkOrder = primaryServiceKind || serviceKinds[0] || "その他";

          // ワークオーダーを作成
          const createResult = await createWorkOrder(jobId, serviceKindForWorkOrder);
          if (!createResult.success || !createResult.data) {
            throw new Error(createResult.error?.message || "ワークオーダーの作成に失敗しました");
          }

          const newWorkOrder = createResult.data;

          // 作業データを保存
          const workData = {
            records: approvedWorkItems.map((item) => ({
              time: new Date().toISOString(),
              content: item.name,
              photos: [
                ...item.beforePhotos.map((p) => ({ type: "before" as const, url: p.previewUrl || "", fileId: undefined })),
                ...item.afterPhotos.map((p) => ({ type: "after" as const, url: p.previewUrl || "", fileId: undefined })),
              ],
              mechanicName: item.mechanicName || null,
            })),
            completedAt: new Date().toISOString(),
            mechanicName: job.assignedMechanic || undefined,
            // コーティング固有情報
            coatingInfo: isCoating && (coatingDryingProcess || coatingMaintenancePeriod) ? {
              dryingProcess: JSON.stringify(coatingDryingProcess) as unknown as string,
              maintenancePeriod: JSON.stringify(coatingMaintenancePeriod) as unknown as string,
            } : undefined,
          } as {
            records: Array<{ time: string; content: string; photos: Array<{ type: "before" | "after"; url: string; fileId?: string }>; mechanicName?: string | null }>;
            completedAt: string;
            mechanicName?: string;
            coatingInfo?: { [key: string]: unknown; dryingProcess?: string; maintenancePeriod?: string };
          };

          const updateResult = await updateWorkOrder(jobId, newWorkOrder.id, {
            work: workData,
            status: "完了",
          });

          if (!updateResult.success) {
            throw new Error(updateResult.error?.message || "作業の保存に失敗しました");
          }

          // ワークオーダーリストを再取得
          await mutateWorkOrders();

          // ステータスを更新
          await updateJobStatus(jobId, "出庫待ち");
        }

        toast.success("作業が完了しました！", {
          description: selectedWorkOrder?.id
            ? "作業データを保存しました"
            : "作業データを保存しました",
        });
      } else {
        // その他の場合：承認された作業項目から完了処理
        const completedItems = approvedWorkItems
          .filter((i) => i.status === "completed")
          .map((i) => i.id);

        console.log("=== 作業完了 ===");
        console.log("Job ID:", jobId);
        console.log("Completed Items:", approvedWorkItems.filter((i) => i.status === "completed").map((i) => i.name));

        // ワークオーダーを作成してからworkデータを保存
        const serviceKindForWorkOrder = primaryServiceKind || serviceKinds[0] || "その他";

        // ワークオーダーを作成
        const createResult = await createWorkOrder(jobId, serviceKindForWorkOrder);
        if (!createResult.success || !createResult.data) {
          throw new Error(createResult.error?.message || "ワークオーダーの作成に失敗しました");
        }

        const newWorkOrder = createResult.data;

        // 作業データを保存
        const workData = {
          records: approvedWorkItems
            .filter((i) => i.status === "completed")
            .map((item) => ({
              time: new Date().toISOString(),
              content: item.name,
              photos: [
                ...item.beforePhotos.map((p) => ({ type: "before" as const, url: p.previewUrl || "", fileId: undefined })),
                ...item.afterPhotos.map((p) => ({ type: "after" as const, url: p.previewUrl || "", fileId: undefined })),
              ],
              mechanicName: item.mechanicName || null,
            })),
          completedAt: new Date().toISOString(),
          mechanicName: job.assignedMechanic || undefined,
        };

        const updateResult = await updateWorkOrder(jobId, newWorkOrder.id, {
          work: workData,
          status: "完了",
        });

        if (!updateResult.success) {
          throw new Error(updateResult.error?.message || "作業の保存に失敗しました");
        }

        // ワークオーダーリストを再取得
        await mutateWorkOrders();

        // ステータス更新と顧客情報取得を並列実行（パフォーマンス改善）
        const [statusResult, customerResult] = await Promise.all([
          updateJobStatus(jobId, "出庫待ち"),
          fetchCustomerById(job.field4?.id || ""),
        ]);

        // 作業完了のLINE通知を送信
        if (customerResult.success && customerResult.data?.Business_Messaging_Line_Id) {
          try {
            const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
            const serviceKind = serviceKinds.length > 0 ? serviceKinds[0] : "その他";

            await sendLineNotification({
              lineUserId: customerResult.data.Business_Messaging_Line_Id || "",
              type: "work_complete",
              jobId,
              data: {
                customerName: job.field4?.name || "お客様",
                vehicleName: job.field6?.name || "車両",
                licensePlate: job.field6?.name ? job.field6.name.split(" / ")[1] || undefined : undefined,
                serviceKind,
              },
            });
          } catch (error) {
            console.warn("LINE通知送信エラー（作業完了）:", error);
            // LINE通知の失敗は作業完了処理を止めない
          }
        }

        toast.success("作業が完了しました！", {
          description: "フロントに通知を送信しました",
        });
      }

      // 1.5秒後にトップへ戻る（メモリリーク防止: コンポーネントがマウントされている場合のみ実行）
      const redirectTimer = setTimeout(() => {
        router.push("/");
      }, 1500);

      // クリーンアップ関数を返す（コンポーネントがアンマウントされた場合、タイマーをクリア）
      // 注意: この関数は非同期処理内にあるため、useEffectのクリーンアップ関数として使用できない
      // そのため、コンポーネントのマウント状態を追跡する必要がある
      // ただし、router.pushはNext.jsが管理するため、通常は問題ない
    } catch (error) {
      console.error("作業完了エラー:", error);
      hasError = true;
      errorMessage = error instanceof Error ? error.message : "作業完了処理に失敗しました";
      toast.error("作業完了処理に失敗しました", {
        description: errorMessage,
        action: {
          label: "再試行",
          onClick: () => {
            handleAllComplete();
          },
        },
        duration: 10000, // リトライボタンを表示するため、表示時間を延長
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 承認された作業項目を取得（車検・故障診断・修理・整備・タイヤ交換・ローテーション・その他のメンテナンス・チューニング・コーティングの場合）
  // 板金・塗装とレストアの場合は、外注管理ビュー/レストア作業ビューを使用するため、承認された作業項目は使用しない
  useEffect(() => {
    // 板金・塗装とレストアの場合はスキップ
    if (isBodyPaint || isRestore) {
      // 値が実際に変更された場合のみ更新（無限ループを防ぐ）
      if (approvedWorkItems.length > 0) {
        setApprovedWorkItems([]);
      }
      return;
    }

    // 承認された作業項目を使用するサービス種類の場合のみ処理
    // 「その他」のサービス種類の場合も、承認された作業項目を表示する
    if (!isInspection && !isFaultDiagnosis && !isRepair && !isTireReplacement && !isMaintenance && !isTuningParts && !isCoating && !isOther) {
      return;
    }

    if (!workOrders || workOrders.length === 0) return;

    // 選択中のワークオーダーから承認された作業項目を取得
    const targetWorkOrder = selectedWorkOrder || workOrders[0];

    if (!targetWorkOrder?.estimate?.items) {
      // 値が実際に変更された場合のみ更新（無限ループを防ぐ）
      if (approvedWorkItems.length > 0) {
        setApprovedWorkItems([]);
      }
      return;
    }

    // 承認された項目（selected: true）を作業項目に変換
    const approvedItems = targetWorkOrder.estimate.items
      .filter((item) => item.selected)
      .map((item) => {
        // 診断データからBefore写真を取得
        // 見積項目のlinkedPhotoUrlsから診断写真を取得
        const beforePhotos: PhotoData[] = [];
        if (item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0) {
          item.linkedPhotoUrls.forEach((photoUrl) => {
            beforePhotos.push({
              previewUrl: photoUrl,
              file: undefined, // undefinedに変更
              position: "front",
            });
          });
        }

        // 診断データからも写真を取得（診断項目のevidencePhotoUrls）
        if (targetWorkOrder.diagnosis?.items) {
          const diagnosisItem = targetWorkOrder.diagnosis.items.find(
            (di) => di.id === item.id || di.name === item.name
          );
          if (diagnosisItem?.evidencePhotoUrls && diagnosisItem.evidencePhotoUrls.length > 0) {
            diagnosisItem.evidencePhotoUrls.forEach((photoUrl) => {
              // 既に追加されていない場合のみ追加
              if (!beforePhotos.some((p) => p.previewUrl === photoUrl)) {
                beforePhotos.push({
                  previewUrl: photoUrl,
                  file: undefined, // undefinedに変更
                  position: "front",
                });
              }
            });
          }
        }

        return {
          id: item.id,
          name: item.name,
          category: "その他",
          status: "pending" as const,
          beforePhotos,
          afterPhotos: [],
          comment: item.note || undefined,
          mechanicName: null,
        };
      });

    // 既存の作業記録から担当者情報と写真を復元
    if (targetWorkOrder.work?.records && Array.isArray(targetWorkOrder.work.records)) {
      targetWorkOrder.work.records.forEach((record: any) => {
        const item = approvedItems.find((i) => i.id === record.content || i.name === record.content);
        if (item) {
          if (record.mechanicName) {
            item.mechanicName = record.mechanicName;
          }
          // 作業記録のBefore写真を復元
          if (record.photos && Array.isArray(record.photos)) {
            const beforePhotosFromRecord = record.photos
              .filter((p: any) => p.type === "before")
              .map((p: any) => ({
                previewUrl: p.url,
                file: null,
                position: "front",
              }));
            // 既存のbeforePhotosとマージ（重複を避ける）
            beforePhotosFromRecord.forEach((photo: PhotoData) => {
              if (!item.beforePhotos.some((p) => p.previewUrl === photo.previewUrl)) {
                item.beforePhotos.push(photo);
              }
            });
            // After写真も復元
            const afterPhotosFromRecord = record.photos
              .filter((p: any) => p.type === "after")
              .map((p: any) => ({
                previewUrl: p.url,
                file: null,
                position: "front",
              }));
            item.afterPhotos = afterPhotosFromRecord;
          }
        }
      });
    }

    // 値が実際に変更された場合のみ更新（無限ループを防ぐ）
    // 配列の内容を比較（浅い比較）
    const prevItems = approvedWorkItemsRef.current;
    const hasChanged = approvedItems.length !== prevItems.length ||
      approvedItems.some((item, index) => {
        const existingItem = prevItems[index];
        return !existingItem ||
          item.id !== existingItem.id ||
          item.name !== existingItem.name ||
          item.status !== existingItem.status ||
          item.beforePhotos.length !== existingItem.beforePhotos.length ||
          item.afterPhotos.length !== existingItem.afterPhotos.length;
      });
    
    if (hasChanged) {
      approvedWorkItemsRef.current = approvedItems;
      setApprovedWorkItems(approvedItems);
    }
  }, [isInspection, isFaultDiagnosis, isRepair, isTireReplacement, isMaintenance, isTuningParts, isCoating, isOther, isBodyPaint, isRestore, workOrders, selectedWorkOrder]);

  // 統計
  // 板金・塗装とレストアの場合は、外注管理ビュー/レストア作業ビュー内で進捗管理されるため、通常の作業項目リストの進捗は使用しない
  // すべてのサービス種類（板金・塗装とレストアを除く）で承認された作業項目を使用
  const completedCount = isBodyPaint || isRestore
    ? 0 // 板金・塗装とレストアの場合は進捗表示を非表示にするため0を返す
    : approvedWorkItems.filter((i) => i.status === "completed").length;
  const totalCount = isBodyPaint || isRestore
    ? 0 // 板金・塗装とレストアの場合は進捗表示を非表示にするため0を返す
    : approvedWorkItems.length;
  const allCompleted = totalCount > 0 ? completedCount === totalCount : false;

  // 全ワークオーダーが完了しているかの判定（6-3. completeWork APIの設計課題（B4））
  const isAllWorkOrdersCompleted = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return false;
    // 全てのワークオーダーが「完了」ステータスかどうかを判定
    return workOrders.every((wo) => wo.status === "完了");
  }, [workOrders]);

  // 作業タイトルを決定（コンセプトに基づき「整備・完成検査」に変更）
  const workTitle = (() => {
    // 複数作業管理の場合、選択中のワークオーダーから取得
    if (selectedWorkOrder?.serviceKind) {
      const serviceKind = selectedWorkOrder.serviceKind;
      if (serviceKind === "車検") {
        return "整備・完成検査（車検）";
      } else if (serviceKind === "12ヵ月点検") {
        return "整備・完成検査（12ヵ月点検）";
      } else if (serviceKind === "エンジンオイル交換") {
        return "エンジンオイル交換作業";
      } else if (serviceKind === "タイヤ交換・ローテーション") {
        return "タイヤ交換・ローテーション作業";
      } else if (serviceKind === "その他のメンテナンス") {
        return "その他のメンテナンス作業";
      } else if (serviceKind === "チューニング" || serviceKind === "パーツ取付") {
        return "チューニング・パーツ取付作業";
      } else if (serviceKind === "コーティング") {
        return "コーティング作業";
      } else if (serviceKind === "レストア") {
        return "レストア作業";
      } else if (serviceKind === "修理・整備") {
        return "修理・整備作業";
      } else if (serviceKind === "故障診断") {
        return "故障診断作業";
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
    } else if (serviceKinds.includes("その他のメンテナンス" as ServiceKind)) {
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

  // ワークフロー・フェーズ表示用の判定
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
    
    // Phase 2（診断）: field5が「入庫済み」以上の場合（診断は入庫済みの状態で実施される）
    if (job.field5 && (job.field5 === "入庫済み" || job.field5 === "見積作成待ち" || job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "出庫待ち" || job.field5 === "出庫済み")) {
      phases.push(2);
    }
    
    // Phase 3（見積）: field5が「見積作成待ち」以上の場合
    if (job.field5 && (job.field5 === "見積作成待ち" || job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "出庫待ち" || job.field5 === "出庫済み")) {
      phases.push(3);
    }
    
    // Phase 4（承認）: field5が「見積提示済み」以上の場合（見積提示済みは顧客承認待ちの状態）
    if (job.field5 && (job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "出庫待ち" || job.field5 === "出庫済み")) {
      phases.push(4);
    }
    
    // Phase 5（作業）: 現在のページ（作業ページ）にいる場合、完了はしない（アクティブ）
    
    // Phase 6（報告）: field5が「出庫待ち」以上の場合
    if (job.field5 && (job.field5 === "出庫待ち" || job.field5 === "出庫済み")) {
      phases.push(6);
    }
    
    return phases;
  }, [job]);

  // エラー状態のチェック（すべてのHooksの後に配置）
  if (jobError) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-900">
        <AppHeader maxWidthClassName="max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-200 animate-pulse rounded" />
            <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
          </div>
        </AppHeader>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">エラーが発生しました</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-white mb-4">{jobError.message || "ジョブデータの取得に失敗しました"}</p>
              <Button onClick={() => mutateJob()}>再試行</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ローディング状態: ジョブデータまたはワークオーダーデータが読み込まれるまで表示しない
  if (isJobLoading || isLoadingWorkOrders || !job) {
    return (
      <div className="flex-1 bg-slate-50 dark:bg-slate-900">
        <AppHeader maxWidthClassName="max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-200 animate-pulse rounded" />
            <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
          </div>
        </AppHeader>
        <div className="max-w-4xl mx-auto px-4 py-6">
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
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 pb-32">
      {/* ヘッダー */}
      <AppHeader
        maxWidthClassName="max-w-4xl"
        backHref="/"
        hideBrandOnScroll={true}
        scrollThreshold={30}
        collapsibleOnMobile={true}
        hasUnsavedChanges={hasUnsavedChanges}
        collapsedCustomerName={customerName}
        collapsedVehicleName={vehicleName}
        collapsedLicensePlate={licensePlate}
        rightArea={
          selectedWorkOrder?.id && (
            <SaveStatusIndicator
              status={saveStatus}
              hasUnsavedChanges={hasUnsavedChanges}
              onSave={saveManually}
              showSaveButton={true}
            />
          )
        }
      >
        {/* ページタイトル */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="h-5 w-5 text-slate-700 dark:text-white shrink-0" />
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
          assignedMechanic={job?.assignedMechanic || undefined}
          courtesyCars={courtesyCars}
        />

        {/* 分解整備記録簿PDF出力ボタン（車検・12ヶ月点検の場合のみ） */}
        {selectedWorkOrder &&
          (selectedWorkOrder.serviceKind === "車検" || selectedWorkOrder.serviceKind === "12ヵ月点検") && (
            <div className="mt-2 flex justify-end">
              <Button
                variant="outline"
                onClick={handlePrintInspectionRecord}
                disabled={isGeneratingPDF}
                className="gap-2"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Printer className="h-5 w-5 shrink-0" />
                    分解整備記録簿を印刷
                  </>
                )}
              </Button>
            </div>
          )}

        {/* 顧客向けレポート画面プレビュー（作業完了済みの場合のみ） */}
        {job && (job.field5 === "出庫待ち" || job.field5 === "出庫済み") && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                const reportUrl = `/customer/report/${jobId}`;
                window.open(reportUrl, "_blank");
              }}
              className="gap-2"
            >
              <Eye className="h-5 w-5 shrink-0" />
              顧客向けレポート画面をプレビュー
              <ExternalLink className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        )}
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
      <main className="max-w-4xl mx-auto px-4 py-6" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
        {/* 注意事項 */}
        {!isBodyPaint && !isRestore && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-base text-amber-900">
              <p className="font-medium">各作業後に証拠写真を撮影してください</p>
              <p className="text-amber-700">新品と旧品を並べて撮影するとわかりやすいです</p>
            </div>
          </div>
        )}

        {/* 進捗表示 */}
        {!isBodyPaint && !isRestore && (isInspection || isFaultDiagnosis || isRepair) ? (
          <WorkProgressBar
            completed={completedCount}
            total={totalCount}
            className="mb-4"
          />
        ) : !isBodyPaint && !isRestore ? (
          <Card className="mb-4 border border-slate-300 rounded-xl shadow-md">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-base text-slate-800 dark:text-white">作業進捗</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {completedCount} / {totalCount}
                  </span>
                  <Badge variant={allCompleted ? "default" : "secondary"} className="text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                    {allCompleted ? "完了" : "作業中"}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* ========================================== */}
        {/* 法定点検用：整備・完成検査ビュー（Phase 5） */}
        {/* ========================================== */}
        {(isInspection || is12MonthInspection) && (
          <div className="mb-6">
            <InspectionWorkView
              acceptanceData={acceptanceData}
              approvedWorkItems={approvedWorkItems.map(item => ({
                id: item.id,
                name: item.name,
                isCompleted: item.status === "completed",
                beforeValue: acceptanceData?.measurements?.brakePadFrontLeft,
                afterValue: undefined,
              }))}
              onApprovedWorkItemsChange={(items) => {
                setApprovedWorkItems(items.map(item => {
                  const existingItem = approvedWorkItems.find(i => i.id === item.id);
                  return {
                    id: item.id,
                    name: item.name,
                    status: item.isCompleted ? "completed" : "pending",
                    isCompleted: item.isCompleted,
                    beforePhotos: existingItem?.beforePhotos || [],
                    afterPhotos: existingItem?.afterPhotos || [],
                    category: existingItem?.category,
                    comment: existingItem?.comment,
                    mechanicName: existingItem?.mechanicName,
                    beforePhotoUrl: null,
                    afterPhotoUrl: null,
                    isCapturing: false,
                  };
                }));
              }}
              finalInspectionData={finalInspectionData}
              onFinalInspectionDataChange={setFinalInspectionData}
              qualityCheckData={inspectionQualityCheckData}
              onQualityCheckDataChange={setInspectionQualityCheckData}
              replacementParts={replacementParts}
              onReplacementPartsChange={setReplacementParts}
              disabled={isSubmitting}
              isShaken={isInspection && selectedWorkOrder?.serviceKind === "車検"}
            />

            {/* 整備アドバイス */}
            <Card className="mt-4 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-slate-600 shrink-0" />
                  整備アドバイス
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start gap-2">
                  <Textarea
                    value={maintenanceAdvice}
                    onChange={(e) => setMaintenanceAdvice(e.target.value)}
                    placeholder="整備アドバイスを入力してください"
                    className="text-base flex-1 resize-none"
                    rows={1}
                    disabled={isSubmitting}
                  />
                  <VoiceInputButton
                    onTranscript={(text) => setMaintenanceAdvice(text)}
                    currentValue={maintenanceAdvice}
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* レストア用：作業管理ビュー */}
        {isRestore && (
          <div className="mb-4">
            <RestoreWorkView
              workData={restoreWorkData}
              onWorkDataChange={setRestoreWorkData}
              parts={
                (selectedWorkOrder?.estimate as { parts?: RestorePartItem[] })?.parts || []
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
              workDuration={
                (selectedWorkOrder?.estimate as { workDuration?: number })?.workDuration || 1
              }
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
        {!isRestore && !isBodyPaint && (
          <div className="space-y-3">
            {isInspection || isFaultDiagnosis || isRepair || isTireReplacement || isMaintenance || isTuningParts || isCoating || isOther ? (
              // 車検・故障診断・修理・整備・タイヤ交換・ローテーション・その他のメンテナンス・チューニング・コーティング・その他用：承認された作業項目カード
              approvedWorkItems.length > 0 ? (
                approvedWorkItems.map((item) => (
                  <ApprovedWorkItemCard
                    key={item.id}
                    item={item}
                    onBeforePhotoCapture={async (itemId, file) => {
                      // Before写真を保存
                      try {
                        if (!job || !selectedWorkOrder?.id) {
                          toast.error("ジョブ情報またはワークオーダー情報が不足しています");
                          return;
                        }

                        const compressedFile = await compressImage(file);
                        const previewUrl = await getImagePreviewUrl(compressedFile);

                        // 顧客情報と車両情報を取得
                        const customerId = job.field4?.ID1 || job.field4?.id || "";
                        const customerName = job.field4?.Last_Name || job.field4?.name || "顧客";
                        const vehicleId = job.field6?.Name || job.field6?.id || "";
                        const vehicleName = job.field6?.Name || "車両";
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

                        // Google Driveに写真をアップロード
                        const uploadedFile = await uploadFile({
                          fileData: compressedFile,
                          fileName: `before-${itemId}-${Date.now()}.jpg`,
                          parentFolderId: workOrderFolder.id,
                          mimeType: "image/jpeg",
                        });

                        const uploadedUrl = uploadedFile.webViewLink || uploadedFile.id;

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
                                    previewUrl: uploadedUrl,
                                    isCompressing: false,
                                  },
                                ],
                              }
                              : item
                          )
                        );

                        // ワークオーダーの作業データを即座に更新
                        if (selectedWorkOrder?.id && selectedWorkOrder.work?.records) {
                          try {
                            const updatedRecords = selectedWorkOrder.work.records.map((record: any) => {
                              // contentがitemIdと一致するレコードを更新
                              if (record.content === itemId) {
                                // 既存のAfter写真を保持
                                const afterPhotos = record.photos?.filter((p: any) => p.type === "after") || [];
                                return {
                                  ...record,
                                  photos: [
                                    ...(record.photos?.filter((p: any) => p.type === "before") || []),
                                    {
                                      type: "before",
                                      url: uploadedUrl,
                                      fileId: uploadedFile.id,
                                    },
                                    ...afterPhotos,
                                  ],
                                };
                              }
                              return record;
                            });

                            // レコードが存在しない場合は新規作成
                            const hasRecord = updatedRecords.some((r: any) => r.content === itemId);
                            if (!hasRecord) {
                              updatedRecords.push({
                                time: new Date().toISOString(),
                                content: itemId,
                                photos: [
                                  {
                                    type: "before",
                                    url: uploadedUrl,
                                    fileId: uploadedFile.id,
                                  },
                                ],
                              });
                            }

                            await updateWorkOrder(jobId, selectedWorkOrder.id, {
                              work: {
                                ...selectedWorkOrder.work,
                                records: updatedRecords,
                              },
                            });
                            // ワークオーダーリストを再取得
                            await mutateWorkOrders();
                          } catch (error) {
                            console.error("Before写真のワークオーダー更新エラー:", error);
                            // エラーが発生してもアップロード処理は続行
                          }
                        }

                        toast.success("Before写真をアップロードしました");
                      } catch (error) {
                        console.error("Before写真アップロードエラー:", error);
                        toast.error("写真のアップロードに失敗しました");
                      }
                    }}
                    onAfterPhotoCapture={async (itemId, file) => {
                      // After写真を保存
                      try {
                        if (!job || !selectedWorkOrder?.id) {
                          toast.error("ジョブ情報またはワークオーダー情報が不足しています");
                          return;
                        }

                        const compressedFile = await compressImage(file);
                        const previewUrl = await getImagePreviewUrl(compressedFile);

                        // 顧客情報と車両情報を取得
                        const customerId = job.field4?.ID1 || job.field4?.id || "";
                        const customerName = job.field4?.Last_Name || job.field4?.name || "顧客";
                        const vehicleId = job.field6?.Name || job.field6?.id || "";
                        const vehicleName = job.field6?.Name || "車両";
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

                        // Google Driveに写真をアップロード
                        const uploadedFile = await uploadFile({
                          fileData: compressedFile,
                          fileName: `after-${itemId}-${Date.now()}.jpg`,
                          parentFolderId: workOrderFolder.id,
                          mimeType: "image/jpeg",
                        });

                        const uploadedUrl = uploadedFile.webViewLink || uploadedFile.id;

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
                                    previewUrl: uploadedUrl,
                                    isCompressing: false,
                                  },
                                ],
                              }
                              : item
                          )
                        );

                        // ワークオーダーの作業データを即座に更新
                        if (selectedWorkOrder?.id && selectedWorkOrder.work?.records) {
                          try {
                            const updatedRecords = selectedWorkOrder.work.records.map((record: any) => {
                              // contentがitemIdと一致するレコードを更新
                              if (record.content === itemId) {
                                // 既存のBefore写真を保持
                                const beforePhotos = record.photos?.filter((p: any) => p.type === "before") || [];
                                return {
                                  ...record,
                                  photos: [
                                    ...beforePhotos,
                                    ...(record.photos?.filter((p: any) => p.type === "after") || []),
                                    {
                                      type: "after",
                                      url: uploadedUrl,
                                      fileId: uploadedFile.id,
                                    },
                                  ],
                                };
                              }
                              return record;
                            });

                            // レコードが存在しない場合は新規作成
                            const hasRecord = updatedRecords.some((r: any) => r.content === itemId);
                            if (!hasRecord) {
                              updatedRecords.push({
                                time: new Date().toISOString(),
                                content: itemId,
                                photos: [
                                  {
                                    type: "after",
                                    url: uploadedUrl,
                                    fileId: uploadedFile.id,
                                  },
                                ],
                              });
                            }

                            await updateWorkOrder(jobId, selectedWorkOrder.id, {
                              work: {
                                ...selectedWorkOrder.work,
                                records: updatedRecords,
                              },
                            });
                            // ワークオーダーリストを再取得
                            await mutateWorkOrders();
                          } catch (error) {
                            console.error("After写真のワークオーダー更新エラー:", error);
                            // エラーが発生してもアップロード処理は続行
                          }
                        }

                        toast.success("After写真をアップロードしました");
                      } catch (error) {
                        console.error("After写真アップロードエラー:", error);
                        toast.error("写真のアップロードに失敗しました");
                      }
                    }}
                    onBeforePhotosChange={async (itemId, photos) => {
                      // Before写真の削除・順番入れ替え
                      setApprovedWorkItems((prev) =>
                        prev.map((item) =>
                          item.id === itemId
                            ? { ...item, beforePhotos: photos }
                            : item
                        )
                      );

                      // ワークオーダーの作業データを即座に更新
                      if (selectedWorkOrder?.id && selectedWorkOrder.work?.records) {
                        try {
                          const updatedRecords = selectedWorkOrder.work.records.map((record: any) => {
                            // contentがitemIdと一致するレコードを更新
                            if (record.content === itemId) {
                              // 既存のAfter写真を保持
                              const afterPhotos = record.photos?.filter((p: any) => p.type === "after") || [];
                              return {
                                ...record,
                                photos: [
                                  ...photos.map((p) => ({
                                    type: "before",
                                    url: p.previewUrl || "",
                                    fileId: undefined,
                                  })),
                                  ...afterPhotos,
                                ],
                              };
                            }
                            return record;
                          });

                          await updateWorkOrder(jobId, selectedWorkOrder.id, {
                            work: {
                              ...selectedWorkOrder.work,
                              records: updatedRecords,
                            },
                          });
                          // ワークオーダーリストを再取得
                          await mutateWorkOrders();
                        } catch (error) {
                          console.error("Before写真の更新エラー:", error);
                          toast.error("Before写真の更新に失敗しました");
                        }
                      }
                    }}
                    onAfterPhotosChange={async (itemId, photos) => {
                      // After写真の削除・順番入れ替え
                      setApprovedWorkItems((prev) =>
                        prev.map((item) =>
                          item.id === itemId
                            ? { ...item, afterPhotos: photos }
                            : item
                        )
                      );

                      // ワークオーダーの作業データを即座に更新
                      if (selectedWorkOrder?.id && selectedWorkOrder.work?.records) {
                        try {
                          const updatedRecords = selectedWorkOrder.work.records.map((record: any) => {
                            // contentがitemIdと一致するレコードを更新
                            if (record.content === itemId) {
                              // 既存のBefore写真を保持
                              const beforePhotos = record.photos?.filter((p: any) => p.type === "before") || [];
                              return {
                                ...record,
                                photos: [
                                  ...beforePhotos,
                                  ...photos.map((p) => ({
                                    type: "after",
                                    url: p.previewUrl || "",
                                    fileId: undefined,
                                  })),
                                ],
                              };
                            }
                            return record;
                          });

                          await updateWorkOrder(jobId, selectedWorkOrder.id, {
                            work: {
                              ...selectedWorkOrder.work,
                              records: updatedRecords,
                            },
                          });
                          // ワークオーダーリストを再取得
                          await mutateWorkOrders();
                        } catch (error) {
                          console.error("After写真の更新エラー:", error);
                          toast.error("After写真の更新に失敗しました");
                        }
                      }
                    }}
                    onCommentChange={async (itemId, comment) => {
                      setApprovedWorkItems((prev) =>
                        prev.map((item) =>
                          item.id === itemId ? { ...item, comment } : item
                        )
                      );

                      // ワークオーダーの作業データを即座に更新
                      if (selectedWorkOrder?.id && selectedWorkOrder.work?.records) {
                        try {
                          const updatedRecords = selectedWorkOrder.work.records.map((record: any) => {
                            // contentがitemIdと一致するレコードを更新
                            if (record.content === itemId) {
                              return {
                                ...record,
                                comment: comment,
                              };
                            }
                            return record;
                          });

                          await updateWorkOrder(jobId, selectedWorkOrder.id, {
                            work: {
                              ...selectedWorkOrder.work,
                              records: updatedRecords,
                            },
                          });
                          // ワークオーダーリストを再取得
                          await mutateWorkOrders();
                        } catch (error) {
                          console.error("コメントのワークオーダー更新エラー:", error);
                          // エラーが発生してもコメント変更処理は続行
                        }
                      }
                    }}
                    onMechanicChange={async (itemId, mechanicName) => {
                      setApprovedWorkItems((prev) =>
                        prev.map((item) =>
                          item.id === itemId ? { ...item, mechanicName } : item
                        )
                      );

                      // ワークオーダーの作業データを即座に更新
                      if (selectedWorkOrder?.id && selectedWorkOrder.work?.records) {
                        try {
                          const updatedRecords = selectedWorkOrder.work.records.map((record: any) => {
                            // contentがitemIdと一致するレコードを更新
                            if (record.content === itemId) {
                              return {
                                ...record,
                                mechanicName: mechanicName || null,
                              };
                            }
                            return record;
                          });

                          await updateWorkOrder(jobId, selectedWorkOrder.id, {
                            work: {
                              ...selectedWorkOrder.work,
                              records: updatedRecords,
                            },
                          });
                          // ワークオーダーリストを再取得
                          await mutateWorkOrders();
                        } catch (error) {
                          console.error("担当者のワークオーダー更新エラー:", error);
                          // エラーが発生しても担当者変更処理は続行
                        }
                      }
                    }}
                    onComplete={async (itemId) => {
                      setApprovedWorkItems((prev) =>
                        prev.map((item) =>
                          item.id === itemId
                            ? { ...item, status: "completed" }
                            : item
                        )
                      );

                      // ワークオーダーの作業データを即座に更新
                      if (selectedWorkOrder?.id && selectedWorkOrder.work?.records) {
                        try {
                          const updatedRecords = selectedWorkOrder.work.records.map((record: any) => {
                            // contentがitemIdと一致するレコードを更新
                            if (record.content === itemId) {
                              return {
                                ...record,
                                completed: true,
                                completedAt: new Date().toISOString(),
                              };
                            }
                            return record;
                          });

                          // レコードが存在しない場合は新規作成
                          const hasRecord = updatedRecords.some((r: any) => r.content === itemId);
                          if (!hasRecord) {
                            const item = approvedWorkItems.find((i) => i.id === itemId);
                            updatedRecords.push({
                              time: new Date().toISOString(),
                              content: itemId,
                              photos: [
                                ...(item?.beforePhotos.map((p) => ({
                                  type: "before" as const,
                                  url: p.previewUrl || "",
                                  fileId: undefined,
                                })) || []),
                                ...(item?.afterPhotos.map((p) => ({
                                  type: "after" as const,
                                  url: p.previewUrl || "",
                                  fileId: undefined,
                                })) || []),
                              ],
                              completed: true,
                              completedAt: new Date().toISOString(),
                            });
                          }

                          await updateWorkOrder(jobId, selectedWorkOrder.id, {
                            work: {
                              ...selectedWorkOrder.work,
                              records: updatedRecords,
                            },
                          });
                          // ワークオーダーリストを再取得
                          await mutateWorkOrders();
                        } catch (error) {
                          console.error("作業項目完了のワークオーダー更新エラー:", error);
                          // エラーが発生しても完了処理は続行
                        }
                      }

                      toast.success("項目を完了しました");
                    }}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-slate-700 dark:text-white">
                    承認された作業項目がありません
                  </CardContent>
                </Card>
              )
            ) : null}
          </div>
        )}

        {/* 作業メモセクション */}
        <Card className="mt-4 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <Notebook className="h-5 w-5 shrink-0 dark:text-white" />
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
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3">
                      <div className="flex items-center gap-2 text-base text-slate-700 dark:text-white mb-1">
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
                      <p className="text-base text-slate-800 dark:text-white line-clamp-2 whitespace-pre-wrap">
                        {latestMemo.content}
                      </p>
                    </div>
                  ) : (
                    <p className="text-base text-slate-700 dark:text-white text-center py-2">
                      メモがありません
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsJobMemoDialogOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Notebook className="h-5 w-5 mr-2 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                    メモを表示/編集
                    {allMemos.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {allMemos.length}
                      </Badge>
                    )}
                  </Button>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </main>

      {/* 完了ボタン（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-lg z-10">
        <div className="max-w-4xl mx-auto">
          <WorkCompleteButton
            onComplete={handleAllComplete}
            disabled={!allCompleted}
            completedCount={completedCount}
            totalCount={totalCount}
            isAllWorkOrdersCompleted={isAllWorkOrdersCompleted}
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

      {/* 作業メモダイアログ */}
      <JobMemoDialog
        open={isJobMemoDialogOpen}
        onOpenChange={setIsJobMemoDialogOpen}
        job={job}
        onSuccess={async () => {
          // メモ更新後にジョブデータを再取得
          if (job) {
            const result = await fetchJobById(job.id);
            if (result.success && result.data) {
              // SWRキャッシュを更新（親コンポーネントでmutateする必要がある場合）
              // ここでは単純にダイアログを閉じるだけ
            }
          }
        }}
      />
    </div>
  );
}

export default function MechanicWorkPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-auto">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700">読み込み中...</p>
        </div>
      </div>
    }>
      <MechanicWorkPageContent />
    </Suspense>
  );
}

