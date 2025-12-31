"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ZohoJob, ServiceKind, CourtesyCar } from "@/types";
import { ManufacturerIcon } from "@/components/features/manufacturer-icon";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Paintbrush,
  ArrowRight,
  User,
  Car,
  Tag,
  CarFront,
  Wrench,
  Star,
  Folder,
  MessageSquare,
  NotebookPen,
  Bell,
  Edit,
  ChevronDown,
  Loader2,
  Plus,
  Camera,
  UserCog,
  FileText,
  Printer,
  Notebook,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { isImportantCustomer, toggleImportantCustomer } from "@/lib/important-customer-flag";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { toast } from "sonner";
import { LongTermProjectDetailDialog } from "@/components/features/long-term-project-detail-dialog";
import { WorkOrderDialog } from "@/components/features/work-order-dialog";
import { ChangeRequestDetailDialog } from "@/components/features/change-request-detail-dialog";
import { JobPhotoGalleryDialog } from "@/components/features/job-photo-gallery-dialog";
import { VehicleDetailDialog } from "@/components/features/vehicle-detail-dialog";
import { fetchCustomerById, updateJobTag, fetchAllTags } from "@/lib/api";
import { BlogPhotoCaptureDialog } from "@/components/features/blog-photo-capture-dialog";
import { fetchPendingChangeRequests } from "@/lib/change-request-api";
import { SmartTag } from "@/types";
import { mutate } from "swr";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { generateWorkOrderPDF, createWorkOrderPDFDataFromJob } from "@/lib/work-order-pdf-generator";
import { parseJobMemosFromField26 } from "@/lib/job-memo-parser";

// =============================================================================
// 型定義
// =============================================================================

export interface LongTermProjectData {
  /** ジョブID */
  jobId: string;
  /** 顧客名 */
  customerName: string;
  /** 車両名 */
  vehicleName: string;
  /** ナンバープレート */
  licensePlate?: string;
  /** 入庫区分 */
  serviceKind: ServiceKind;
  /** 進捗率（0-100%） */
  progress: number;
  /** 遅延フラグ */
  isDelayed: boolean;
  /** 開始日 */
  startDate?: string;
  /** 予定完了日 */
  expectedCompletionDate?: string;
  /** 現在のフェーズ/ステータス */
  currentPhase?: string;
  /** ジョブデータ */
  job: ZohoJob;
}

// =============================================================================
// Props
// =============================================================================

interface LongTermProjectCardProps {
  /** プロジェクトデータ */
  project: LongTermProjectData;
  /** クリックハンドラ */
  onClick?: () => void;
  /** 代車情報 */
  courtesyCars?: CourtesyCar[];
  /** 詳細表示ボタンの表示（改善提案 #5） */
  showDetailButton?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * サービス種類に応じたアイコンを取得
 */
function getServiceIcon(serviceKind: ServiceKind) {
  switch (serviceKind) {
    case "レストア":
      return <Sparkles className="h-4 w-4 shrink-0" />;
    case "板金・塗装":
      return <Paintbrush className="h-4 w-4 shrink-0" />;
    default:
      return <TrendingUp className="h-4 w-4 shrink-0" />;
  }
}

/**
 * サービス種類に応じた色を取得
 */
function getServiceColor(serviceKind: ServiceKind): string {
  switch (serviceKind) {
    case "レストア":
      return "text-violet-600";
    case "板金・塗装":
      return "text-orange-600";
    default:
      return "text-slate-700";
  }
}

/**
 * 進捗率に応じたバッジの色を取得
 */
function getProgressBadgeVariant(progress: number, isDelayed: boolean): "default" | "secondary" | "destructive" | "outline" {
  if (isDelayed) return "destructive";
  if (progress === 100) return "default";
  if (progress >= 50) return "secondary";
  return "outline";
}

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
      return "bg-slate-100 text-slate-700 border-slate-300";
    case "入庫済み":
      return "bg-blue-100 text-blue-700 border-blue-400";
    case "見積作成待ち":
      return "bg-orange-100 text-orange-700 border-orange-400";
    case "見積提示済み":
      return "bg-amber-100 text-amber-900 border-amber-400"; // yellow → amber, text-amber-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
    case "作業待ち":
      return "bg-emerald-100 text-emerald-700 border-emerald-400";
    case "作業中":
      return "bg-cyan-100 text-cyan-700 border-cyan-400";
    case "出庫待ち":
      return "bg-violet-100 text-violet-700 border-violet-400";
    case "出庫済み":
      return "bg-slate-100 text-slate-700 border-slate-300"; // text-slate-600 → text-slate-700 (40歳以上ユーザー向け、コントラスト向上)
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

// =============================================================================
// Component
// =============================================================================

export function LongTermProjectCard({ project, onClick, courtesyCars = [], showDetailButton = true }: LongTermProjectCardProps) {
  const {
    jobId,
    customerName,
    vehicleName,
    licensePlate,
    serviceKind,
    progress,
    isDelayed,
    startDate,
    expectedCompletionDate,
    currentPhase,
    job,
  } = project;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const serviceIcon = getServiceIcon(serviceKind);
  const serviceColor = getServiceColor(serviceKind);

  // 顧客IDと車両IDを取得
  const customerId = job.field4?.id;
  const vehicleId = job.field6?.id;

  // ワークオーダーを取得（写真取得用）
  const { workOrders } = useWorkOrders(job.id);

  // サンプル画像のマッピング（車両名に基づいて画像を選択）
  const getSamplePhotoUrl = (vehicleName: string): string | null => {
    const vehicleNameLower = vehicleName.toLowerCase();
    if (vehicleNameLower.includes("307")) {
      return "/sample-vehicles/251027-peugeot-307sw.jpg";
    }
    if (vehicleNameLower.includes("2008")) {
      return "/sample-vehicles/251018-peugeot-2008.jpg";
    }
    if (vehicleNameLower.includes("ランチア") || vehicleNameLower.includes("lancia")) {
      return "/sample-vehicles/250424-lancia-delta-integrale-ev2.jpg";
    }
    if (vehicleNameLower.includes("ヤリス") || vehicleNameLower.includes("yaris")) {
      return "/sample-vehicles/251018-toyota-yaris-grmn.jpg";
    }
    if (vehicleNameLower.includes("マスタング") || vehicleNameLower.includes("mustang")) {
      return "/sample-vehicles/250918-ford-mustang-v8-gt.jpg";
    }
    if (vehicleNameLower.includes("bmw") || vehicleNameLower.includes("ビーエムダブリュー")) {
      return "/sample-vehicles/251019-bmw-116i.jpg";
    }
    if (vehicleNameLower.includes("シトロエン") || vehicleNameLower.includes("saxo")) {
      return "/sample-vehicles/251021-citroen-saxo-vts.jpg";
    }
    return null;
  };

  // 最初の写真を取得
  const firstPhoto = useMemo(() => {
    if (workOrders && workOrders.length > 0) {
      for (const wo of workOrders) {
        if (wo.diagnosis?.photos && Array.isArray(wo.diagnosis.photos) && wo.diagnosis.photos.length > 0) {
          return wo.diagnosis.photos[0].url;
        }
      }
      for (const wo of workOrders) {
        if (wo.work?.records && Array.isArray(wo.work.records)) {
          for (const record of wo.work.records) {
            if (record.photos && Array.isArray(record.photos) && record.photos.length > 0) {
              const beforePhoto = record.photos.find((p: any) => p.type === "before");
              if (beforePhoto) return beforePhoto.url;
              return record.photos[0].url;
            }
          }
        }
      }
    }
    return getSamplePhotoUrl(vehicleName);
  }, [workOrders, vehicleName]);

  // 写真の総数を計算
  const photoCount = useMemo(() => {
    let count = 0;
    if (workOrders && workOrders.length > 0) {
      workOrders.forEach((wo) => {
        if (wo.diagnosis?.photos && Array.isArray(wo.diagnosis.photos)) {
          count += wo.diagnosis.photos.length;
        }
        if (wo.work?.records && Array.isArray(wo.work.records)) {
          wo.work.records.forEach((record: any) => {
            if (record.photos && Array.isArray(record.photos)) {
              count += record.photos.length;
            }
          });
        }
      });
    }
    return count;
  }, [workOrders]);

  // 入庫日時の表示ロジック
  const isCheckedIn = job.field5 !== "入庫待ち";
  const arrivalTime = isCheckedIn && job.field22 ? formatTime(job.field22) : "00:00";
  const arrivalLabel = isCheckedIn ? "入庫日時" : "入庫予定";

  // 代車情報を取得（配列チェックを追加）
  const courtesyCar = Array.isArray(courtesyCars) ? courtesyCars.find(car => car.jobId === job.id) : undefined;

  // お客様入力情報と受付メモのチェック
  const hasPreInput = !!job.field7;
  const hasWorkOrder = !!job.field;

  // 顧客情報を取得（変更申請チェック用）
  const { data: customerData } = useSWR(
    customerId ? `customer-${customerId}` : null,
    async () => {
      if (!customerId) return null;
      const result = await fetchCustomerById(customerId);
      return result.success ? result.data : null;
    }
  );

  // 変更申請があるかチェック（スプレッドシートから取得）
  const smartCarDealerCustomerId = customerData?.ID1 || customerId;
  const { data: changeRequestsData } = useSWR(
    smartCarDealerCustomerId ? `change-requests-check-${smartCarDealerCustomerId}` : null,
    async () => {
      if (!smartCarDealerCustomerId) return null;
      const result = await fetchPendingChangeRequests(smartCarDealerCustomerId);
      return result.success ? result.data : null;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分間は重複リクエストを防止
    }
  );
  const hasChangeRequest = changeRequestsData && changeRequestsData.length > 0;

  // 承認済み作業内容があるかチェック
  const hasApprovedWorkItems = job.field13 && (job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "出庫待ち" || job.field5 === "出庫済み");

  // 詳細情報があるかチェック
  const hasDetails = hasPreInput || hasWorkOrder || hasChangeRequest || hasApprovedWorkItems;

  // 受付メモダイアログの状態
  const [isWorkOrderDialogOpen, setIsWorkOrderDialogOpen] = useState(false);

  // タグ変更ダイアログの状態
  const [isTagChangeDialogOpen, setIsTagChangeDialogOpen] = useState(false);
  // 変更申請詳細ダイアログの状態
  const [isChangeRequestDetailOpen, setIsChangeRequestDetailOpen] = useState(false);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  const [selectedNewTagId, setSelectedNewTagId] = useState<string | null>(null);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [isVehicleDetailDialogOpen, setIsVehicleDetailDialogOpen] = useState(false);

  // 詳細情報の折りたたみ状態
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  // ブログ用写真撮影ダイアログの状態
  const [isBlogPhotoCaptureDialogOpen, setIsBlogPhotoCaptureDialogOpen] = useState(false);

  // 重要な顧客フラグ
  const [isImportant, setIsImportant] = useState(false);

  // PDF生成中フラグ
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (customerId) {
      const important = isImportantCustomer(customerId);
      setIsImportant(important);
    } else {
      setIsImportant(false);
    }
  }, [customerId]);

  // 重要な顧客フラグのトグル
  const handleToggleImportant = () => {
    if (!customerId) return;
    triggerHapticFeedback("medium");
    const newState = toggleImportantCustomer(customerId);
    setIsImportant(newState);
    triggerHapticFeedback(newState ? "success" : "light");
    toast.success(newState ? "重要な顧客としてマークしました" : "重要な顧客マークを解除しました");
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // ページ遷移開始時にbodyにdata属性を設定
      document.body.setAttribute("data-navigating", "true");
      startTransition(() => {
        router.push(`/mechanic/work/${jobId}`);
      });
    }
  };

  const handleOpenWorkOrderDialog = () => {
    setIsWorkOrderDialogOpen(true);
  };

  const handleWorkOrderSuccess = () => {
    window.location.reload();
  };

  /**
   * タグ更新ハンドラ
   */
  const handleTagUpdate = async () => {
    if (!selectedNewTagId || !job.tagId || selectedNewTagId === job.tagId) return;

    setIsUpdatingTag(true);
    triggerHapticFeedback("medium");

    try {
      const result = await updateJobTag(job.id, selectedNewTagId);
      if (!result.success) {
        throw new Error(result.error?.message || "タグの変更に失敗しました");
      }

      toast.success("タグを変更しました", {
        description: `タグ ${job.tagId} → ${selectedNewTagId}`,
      });

      // データを再取得
      await mutate("today-jobs");
      await mutate("all-jobs");
      await mutate("all-tags");

      setIsTagChangeDialogOpen(false);
      setSelectedNewTagId(null);
    } catch (error) {
      console.error("Tag update error:", error);
      const errorMessage = error instanceof Error ? error.message : "タグの変更に失敗しました";
      toast.error("タグの変更に失敗しました", {
        description: errorMessage,
        action: {
          label: "再試行",
          onClick: handleTagUpdate,
        },
        duration: 10000,
      });
    } finally {
      setIsUpdatingTag(false);
    }
  };

  const vehicleInfo = `${vehicleName}${licensePlate ? ` / ${licensePlate}` : ""}`;

  /**
   * 作業指示書PDF出力
   */
  const handlePrintWorkOrder = async () => {
    if (!job) return;

    setIsGeneratingPDF(true);
    triggerHapticFeedback("medium");

    try {
      // 代車情報を取得（配列チェックを追加）
      const courtesyCarForPDF = Array.isArray(courtesyCars) ? courtesyCars.find(car => car.jobId === job.id) : undefined;

      // ジョブ情報からPDFデータを生成（新しい情報を含める）
      const pdfData = await createWorkOrderPDFDataFromJob({
        ...job,
        field10: job.field10 || null,
        tagId: job.tagId || null,
        field13: job.field13 || null,
        courtesyCar: courtesyCarForPDF ? {
          name: courtesyCarForPDF.name,
          licensePlate: courtesyCarForPDF.licensePlate || undefined,
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

  return (
    <>
      {/* 横並びFlexboxレイアウト（JOBカードと同じ構造） */}
      <div
        className={cn(
          "flex bg-white rounded-xl border mb-4 overflow-hidden transition-all hover:shadow-lg hover:border-slate-300 lg:flex-row flex-col",
          isDelayed ? "border-red-400 bg-red-50/50" : "border-slate-200"
        )}
        role="article"
        aria-label={`長期プロジェクト: ${customerName} - ${vehicleInfo}`}
      >
        {/* 写真セクション - 固定幅（横長16:9のアスペクト比） */}
        <div className="w-full lg:w-[240px] flex-shrink-0 relative bg-slate-200 aspect-[16/9]">
          {firstPhoto ? (
            <>
              {/* 写真がある場合：写真を表示（クリック可能：ブログ用写真撮影ダイアログを開く） */}
              <div className="relative w-full h-full group">
                <button
                  onClick={() => {
                    triggerHapticFeedback("light");
                    setIsBlogPhotoCaptureDialogOpen(true);
                  }}
                  className="relative w-full h-full cursor-pointer"
                  aria-label="ブログ用写真を撮影"
                  title="ブログ用写真を撮影"
                >
                  <Image
                    src={firstPhoto}
                    alt="車両写真"
                    fill
                    className="object-cover transition-opacity"
                    unoptimized
                  />
                  {/* 写真枚数バッジ */}
                  {photoCount > 0 && (
                    <div className="absolute top-2.5 left-2.5 bg-black/50 text-white px-2 py-1 rounded text-base font-medium flex items-center gap-1 z-10">
                      <Camera className="h-4 w-4" />
                      {photoCount}枚
                    </div>
                  )}
                </button>
                {/* ホバー時のオーバーレイ（写真を追加することを示す） */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-slate-700" />
                    <span className="text-base font-medium text-slate-700">写真を追加</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 写真がない場合：グレー背景に車両名を表示（クリック可能：ブログ用写真撮影ダイアログを開く） */}
              <div className="relative w-full h-full group">
                <button
                  onClick={() => {
                    triggerHapticFeedback("light");
                    setIsBlogPhotoCaptureDialogOpen(true);
                  }}
                  className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-300 hover:bg-slate-400 transition-colors cursor-pointer"
                  aria-label="ブログ用写真を撮影"
                  title="ブログ用写真を撮影"
                >
                  <ManufacturerIcon vehicleName={vehicleName} className="h-10 w-10 mb-2" fallbackClassName="h-10 w-10" />
                  <span className="text-base font-medium text-center text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                    {vehicleName}
                  </span>
                </button>
                {/* ホバー時のオーバーレイ（写真を追加することを示す） */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-slate-700" />
                    <span className="text-base font-medium text-slate-700">写真を追加</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* メインセクション - 可変幅 */}
        <div className="flex-1 p-4 lg:p-5 flex flex-col gap-2.5">
          {/* ヘッダー行 */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (customerId) {
                  triggerHapticFeedback("light");
                }
              }}
              className={cn(
                "text-lg font-semibold text-slate-900 text-left truncate transition-all",
                customerId ? "cursor-pointer" : "cursor-default"
              )}
              title={customerId ? "顧客詳細を表示" : undefined}
              disabled={!customerId}
              aria-label={customerId ? "顧客詳細を表示" : undefined}
            >
              {customerName}
            </button>
            {/* アイコンボタン */}
            <div className="flex gap-1">
              {customerId && (
                <button
                  onClick={handleToggleImportant}
                  className="p-1.5 rounded-md transition-all hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  aria-label={isImportant ? "重要な顧客マークを解除" : "重要な顧客としてマーク"}
                >
                  <Star className={cn("h-4.5 w-4.5", isImportant && "fill-current text-amber-500")} />
                </button>
              )}
              {job.field19 && (
                <a
                  href={job.field19}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md transition-all hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHapticFeedback("light");
                  }}
                  title="Google Driveフォルダを開く"
                >
                  <Folder className="h-4.5 w-4.5" />
                </a>
              )}
              {/* 作業指示書印刷ボタン（作業指示または申し送り事項がある場合のみ表示） */}
              {(hasWorkOrder || hasPreInput) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrintWorkOrder();
                  }}
                  disabled={isGeneratingPDF}
                  className="p-1.5 rounded-md transition-all hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="作業指示書を印刷"
                  title="作業指示書を印刷"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Printer className="h-4.5 w-4.5" />
                  )}
                </button>
              )}
            </div>
            {/* ステータスバッジ（右寄せ） */}
            <div className="ml-auto">
              <Badge
                variant="outline"
                className={cn(
                  "text-base font-medium px-2.5 py-1 rounded-full",
                  getStatusBadgeStyle(job.field5)
                )}
              >
                {job.field5}
              </Badge>
            </div>
          </div>

          {/* 車両情報行（名前の下に表示） */}
          <button
            onClick={() => {
              triggerHapticFeedback("light");
              setIsVehicleDetailDialogOpen(true);
            }}
            className="flex items-center gap-2 text-base font-medium text-slate-900 min-w-0 cursor-pointer text-left transition-all"
            title="車両詳細を表示"
            aria-label="車両詳細を表示"
          >
            <ManufacturerIcon vehicleName={vehicleName} className="h-5 w-5" fallbackClassName="h-5 w-5" />
            <span className="break-words min-w-0">{vehicleInfo}</span>
          </button>

          {/* 情報行 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* サービス種類バッジ */}
            {serviceKind && (
              <Badge
                variant="outline"
                className="bg-slate-100 text-slate-800 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
              >
                <span className={cn(serviceColor)}>{serviceIcon}</span>
                <span>{serviceKind}</span>
              </Badge>
            )}

            {/* 入庫日時（クリック不可） */}
            <div className="flex items-center gap-1.5 text-base text-slate-700 cursor-default">
              <Clock className="h-4 w-4 text-slate-500" />
              {arrivalTime} {arrivalLabel === "入庫予定" ? "入庫予定" : "入庫"}
            </div>

            {/* タグ */}
            {job.tagId && (
              <button
                onClick={() => setIsTagChangeDialogOpen(true)}
                className="flex items-center gap-1.5 text-base text-slate-700 cursor-pointer transition-all"
                title="タグを変更"
                aria-label="タグを変更"
              >
                <Tag className="h-4 w-4 text-slate-500" />
                {job.tagId}
              </button>
            )}

            {/* 担当整備士（クリック不可） */}
            {job.assignedMechanic && (
              <div className="flex items-center gap-1.5 text-base text-slate-700 cursor-default">
                <UserCog className="h-4 w-4 text-slate-500" />
                {job.assignedMechanic}
              </div>
            )}

            {/* 代車（クリック不可） */}
            {courtesyCar && (
              <div className="flex items-center gap-1.5 text-base text-slate-700 cursor-default">
                <CarFront className="h-4 w-4 text-slate-500" />
                代車 {courtesyCar.name}
              </div>
            )}
          </div>

          {/* ボタン行 */}
          <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-100 flex-wrap">
            {/* お客様入力情報ボタン */}
            {hasPreInput && (
              <button
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="bg-blue-50 text-blue-900 border border-blue-400 text-base font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                title="お客様入力情報"
              >
                <MessageSquare className="h-5 w-5 shrink-0 text-blue-600" />
                <span className="whitespace-nowrap">お客様入力情報</span>
              </button>
            )}

            {/* 承認済み作業内容ボタン */}
            {hasApprovedWorkItems && (
              <button
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="bg-green-50 text-green-900 border border-green-400 text-base font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-green-100 transition-colors cursor-pointer shrink-0"
                title="承認済み作業内容"
              >
                <Wrench className="h-5 w-5 shrink-0 text-green-600" />
                <span className="whitespace-nowrap">承認済み作業内容</span>
              </button>
            )}

            {/* 受付メモボタン */}
            {hasWorkOrder && (
              <button
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="bg-amber-50 text-amber-900 border border-amber-400 text-base font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer shrink-0 dark:bg-slate-800 dark:text-white dark:border-amber-400 dark:hover:bg-slate-700"
                title="受付メモ"
              >
                <NotebookPen className="h-5 w-5 shrink-0 text-amber-600" />
                <span className="whitespace-nowrap">受付メモ</span>
              </button>
            )}

            {/* 変更申請ボタン */}
            {hasChangeRequest && (
              <button
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="bg-amber-50 text-amber-900 border border-amber-400 text-base font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer shrink-0 dark:bg-slate-800 dark:text-white dark:border-amber-400 dark:hover:bg-slate-700"
                title="変更申請あり"
              >
                <Bell className="h-5 w-5 shrink-0 text-amber-600" />
                <span className="whitespace-nowrap">変更申請あり</span>
              </button>
            )}

            <div className="flex-1" />

            {/* 受付メモを追加するボタン */}
            {!hasWorkOrder && (
              <button
                onClick={handleOpenWorkOrderDialog}
                className="flex items-center gap-1.5 text-base text-slate-500 hover:text-slate-700 bg-none border-none cursor-pointer px-3 py-3 rounded-md transition-all hover:bg-slate-100"
              >
                <Plus className="h-4 w-4" />
                受付メモを追加する
              </button>
            )}
          </div>

          {/* 進捗・日付・アクションボタン行（メインセクション内に統合） */}
          <div className="flex items-center gap-3 pt-1.5 border-t border-slate-100 flex-wrap">
            {/* 進捗バー */}
            <div className="flex items-center gap-2">
              <span className="text-base text-slate-700">進捗:</span>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-2 w-24" />
                <span className="text-base font-medium text-slate-900">{progress}%</span>
              </div>
            </div>

            {/* 現在のフェーズ/ステータス */}
            {currentPhase && (
              <div className="flex items-center gap-1.5 text-base text-slate-700">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>{currentPhase}</span>
              </div>
            )}

            {/* 日付情報 */}
            {startDate && (
              <div className="flex items-center gap-1.5 text-base text-slate-700">
                <span>開始日:</span>
                <span className="font-medium text-slate-900">
                  {new Date(startDate).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {expectedCompletionDate && (
              <div className="flex items-center gap-1.5 text-base text-slate-700">
                <span>予定完了日:</span>
                <span
                  className={cn(
                    "font-medium",
                    isDelayed ? "text-red-700" : "text-slate-900"
                  )}
                >
                  {new Date(expectedCompletionDate).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            <div className="flex-1" />

            {/* アクションボタン */}
            <div className="flex items-center gap-2">
              {showDetailButton && (
                <Button
                  variant="outline"
                  className="h-12 text-base font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDetailDialogOpen(true);
                  }}
                >
                  進捗詳細
                </Button>
              )}
              <Button
                variant="default"
                className="h-12 text-base font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                disabled={isPending}
              >
                作業画面へ
                <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 詳細情報の折りたたみ部分（メインセクションの下に表示） */}
      {hasDetails && isDetailsExpanded && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
          <div className="space-y-3">
            {/* お客様入力情報 */}
            {hasPreInput && (
              <div className="bg-blue-50 border border-blue-400 rounded-md p-3 text-base">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="font-medium text-blue-900">お客様入力情報</p>
                </div>
                <p className="text-blue-900 whitespace-pre-wrap">{job.field7}</p>
              </div>
            )}

            {/* 受付メモ */}
            {hasWorkOrder && (() => {
              // メモから記入者名とメモ内容を抽出
              const parseWorkOrder = (text: string | null): { author: string; content: string } => {
                if (!text) return { author: "", content: "" };

                // 形式: [記入者名] メモ内容
                const match = text.match(/^\[(.+?)\]\s*([\s\S]*)$/);
                if (match) {
                  return { author: match[1], content: match[2] };
                }

                return { author: "", content: text };
              };

              const parsed = parseWorkOrder(job.field);

              return (
                <div className="bg-amber-50 border border-amber-400 rounded-md p-3 text-base dark:bg-slate-800 dark:border-amber-400 dark:text-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <NotebookPen className="h-5 w-5 text-amber-600 shrink-0" />
                      <p className="font-medium text-amber-900 dark:text-white">受付メモ</p>
                      {parsed.author && (
                        <span className="text-base text-amber-700 font-medium dark:text-white">
                          （記入者: {parsed.author}）
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenWorkOrderDialog();
                      }}
                      className="text-base text-amber-700 hover:text-amber-900 underline flex items-center gap-1 dark:text-white dark:hover:text-amber-400"
                    >
                      <Edit className="h-5 w-5 shrink-0" />
                      編集する
                    </button>
                  </div>
                  <p className="text-amber-900 whitespace-pre-wrap dark:text-white">{parsed.content}</p>
                </div>
              );
            })()}

            {/* 変更申請 */}
            {hasChangeRequest && customerId && (
              <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-base">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className="h-5 w-5 text-rose-600 shrink-0" />
                  <p className="font-medium text-rose-700">変更申請あり</p>
                </div>
                <p className="text-base text-rose-700 mb-2">
                  顧客情報の変更申請があります。対応完了後、基幹システムを更新してください。
                </p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHapticFeedback("light");
                    setIsChangeRequestDetailOpen(true);
                  }}
                  variant="outline"
                  className="w-full h-12 text-base font-medium bg-white border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  詳細を見る
                </Button>
              </div>
            )}

            {/* 作業内容（承認済み見積明細） */}
            {job.field13 && (job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "出庫待ち" || job.field5 === "出庫済み") && (
              <div className="bg-green-50 border border-green-400 rounded-md p-3 text-base">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-5 w-5 text-green-600 shrink-0" />
                  <p className="font-medium text-green-900">承認済み作業内容</p>
                </div>
                <p className="text-green-900 whitespace-pre-wrap">{job.field13}</p>
              </div>
            )}

            {/* 作業メモ */}
            {(() => {
              const jobMemos = parseJobMemosFromField26(job.field26);
              const latestWorkMemo = jobMemos.length > 0 ? jobMemos[0] : null;

              if (!latestWorkMemo) return null;

              return (
                <div className="bg-purple-50 border border-purple-400 rounded-md p-3 text-base">
                  <div className="flex items-center gap-2 mb-2">
                    <Notebook className="h-5 w-5 text-purple-600 shrink-0" />
                    <p className="font-medium text-purple-900">作業メモ</p>
                    {jobMemos.length > 1 && (
                      <span className="text-base text-purple-700 font-medium">
                        （他 {jobMemos.length - 1} 件）
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-base text-purple-700 mb-2">
                    <span>{latestWorkMemo.author}</span>
                    <span>•</span>
                    <span>
                      {new Date(latestWorkMemo.createdAt).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Tokyo",
                      })}
                    </span>
                  </div>
                  <p className="text-purple-900 whitespace-pre-wrap line-clamp-3">
                    {latestWorkMemo.content}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* タグ変更ダイアログ */}
      <Dialog open={isTagChangeDialogOpen} onOpenChange={setIsTagChangeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 shrink-0" />
              タグ変更: {customerName} 様
            </DialogTitle>
            <DialogDescription>
              使用するスマートタグを選択してください
              <br />
              <span className="text-base text-slate-700 mt-1 block">
                ※使用中のタグは選択できません（現在のタグを除く）
              </span>
            </DialogDescription>
          </DialogHeader>

          <TagSelectGrid
            currentTagId={job.tagId}
            selectedTagId={selectedNewTagId}
            onTagSelect={setSelectedNewTagId}
            disabled={isUpdatingTag}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsTagChangeDialogOpen(false);
                setSelectedNewTagId(null);
              }}
              disabled={isUpdatingTag}
              className="h-12 text-base font-medium"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleTagUpdate}
              disabled={isUpdatingTag || !selectedNewTagId || selectedNewTagId === job.tagId}
              className="h-12 text-base font-medium"
            >
              {isUpdatingTag ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" />
                  変更中...
                </>
              ) : (
                "変更する"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 変更申請詳細モーダル */}
      <ChangeRequestDetailDialog
        open={isChangeRequestDetailOpen}
        onOpenChange={setIsChangeRequestDetailOpen}
        customerId={customerId}
        customerName={project.customerName}
        smartCarDealerCustomerId={customerData?.ID1 || customerId}
      />

      {/* 写真ギャラリーダイアログ */}
      <JobPhotoGalleryDialog
        open={isPhotoGalleryOpen}
        onOpenChange={setIsPhotoGalleryOpen}
        jobId={job.id}
        workOrders={workOrders}
        customerName={project.customerName}
        vehicleName={vehicleName}
      />

      {/* 車両詳細ダイアログ */}
      <VehicleDetailDialog
        open={isVehicleDetailDialogOpen}
        onOpenChange={setIsVehicleDetailDialogOpen}
        vehicleId={vehicleId || null}
        vehicleName={vehicleName}
      />

      {/* 受付メモダイアログ */}
      <WorkOrderDialog
        open={isWorkOrderDialogOpen}
        onOpenChange={setIsWorkOrderDialogOpen}
        job={job}
        onSuccess={handleWorkOrderSuccess}
      />

      {/* 長期プロジェクト詳細情報ダイアログ */}
      {showDetailButton && (
        <LongTermProjectDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          job={job}
        />
      )}

      {/* ブログ用写真撮影ダイアログ */}
      <BlogPhotoCaptureDialog
        open={isBlogPhotoCaptureDialogOpen}
        onOpenChange={setIsBlogPhotoCaptureDialogOpen}
        jobId={job.id}
        onComplete={() => {
          // 撮影完了後の処理（必要に応じてデータを再取得）
          mutate(`job-${job.id}`);
          mutate(`blog-photos-card-${job.id}`);
        }}
      />
    </>
  );
}

// =============================================================================
// TagSelectGrid Component
// =============================================================================

interface TagSelectGridProps {
  currentTagId: string | null | undefined;
  selectedTagId: string | null;
  onTagSelect: (tagId: string) => void;
  disabled?: boolean;
}

function TagSelectGrid({ currentTagId, selectedTagId, onTagSelect, disabled }: TagSelectGridProps) {
  const { data: allTags, isLoading, error, mutate } = useSWR<SmartTag[]>(
    "all-tags",
    async () => {
      const result = await fetchAllTags();
      return result.success && result.data ? result.data : [];
    }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 py-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-base text-red-700 mb-3">タグの取得に失敗しました</p>
        <Button
          variant="outline"
          size="default"
          onClick={() => mutate()}
          className="h-12 text-base font-medium"
        >
          再試行
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 py-4">
      {allTags?.map((tag) => {
        const isAvailable = tag.status === "available" || (tag.status === "in_use" && tag.tagId === currentTagId);
        const isInUse = tag.status === "in_use" && tag.tagId !== currentTagId;
        const isClosed = tag.status === "closed";
        const isSelected = selectedTagId === tag.tagId;
        const isCurrentTag = tag.tagId === currentTagId;

        return (
          <div key={tag.tagId} className="flex flex-col gap-1">
            <Button
              variant={isAvailable ? "outline" : "ghost"}
              size="lg"
              className={cn(
                "h-16 text-2xl font-bold transition-all duration-200 relative",
                isAvailable &&
                "hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:shadow-md border-2 border-slate-300",
                isInUse &&
                "opacity-50 cursor-not-allowed bg-slate-100 border border-slate-200",
                isClosed &&
                "opacity-30 cursor-not-allowed bg-slate-50 border border-slate-100",
                isSelected && isAvailable &&
                "bg-primary text-primary-foreground border-primary",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => isAvailable && !disabled && onTagSelect(tag.tagId)}
              disabled={disabled || !isAvailable}
            >
              {tag.tagId}
              {isCurrentTag && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  現在
                </span>
              )}
              {isInUse && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  使用中
                </span>
              )}
              {isClosed && (
                <span className="absolute -top-1 -right-1 bg-slate-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  閉鎖
                </span>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}









