"use client";

import { useState, useEffect, memo, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ZohoJob, CourtesyCar, ZohoCustomer, ZohoVehicle, WorkOrderStatus } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Car, Clock, User, FileText, Tag, Wrench, Edit, Plus, NotebookPen, UserCog,
  Activity, Key, CheckCircle2, Droplet, Circle, Sparkles, Zap,
  Package, Shield, CarFront, Loader2, Paintbrush, MessageSquare,
  Bell, Heart, Gauge, Star, Info, Phone, ExternalLink, Folder, Mail,
  ShieldCheck, CalendarCheck, UserCheck, Settings, Camera, AlertTriangle, Printer, Notebook, ChevronDown, ChevronRight, Flag, Calendar
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { WorkOrderDialog } from "@/components/features/work-order-dialog";
import { AddWorkOrderDialog } from "@/components/features/add-work-order-dialog";
import { VehicleDetailDialog } from "@/components/features/vehicle-detail-dialog";
import { CustomerDetailDialog } from "@/components/features/customer-detail-dialog";
import { CourtesyCarSelectDialog } from "@/components/features/courtesy-car-select-dialog";
import { ManufacturerIcon } from "@/components/features/manufacturer-icon";
import { ChangeRequestDetailDialog } from "@/components/features/change-request-detail-dialog";
import { JobPhotoGalleryDialog } from "@/components/features/job-photo-gallery-dialog";
import { BlogPhotoCaptureDialog } from "@/components/features/blog-photo-capture-dialog";
import { listBlogPhotosFromJobFolder, BlogPhotoInfo } from "@/lib/blog-photo-manager";
import { MechanicSelectDialog } from "@/components/features/mechanic-select-dialog";
import { assignMechanic } from "@/lib/api";
import { fetchCustomerById, fetchVehicleById, updateJobTag, fetchAllTags, updateJobCourtesyCar, fetchAllCourtesyCars } from "@/lib/api";
import { SmartTag } from "@/types";
import { fetchPendingChangeRequests } from "@/lib/change-request-api";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { toast } from "sonner";
import { isImportantCustomer, toggleImportantCustomer } from "@/lib/important-customer-flag";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { generateWorkOrderPDF, createWorkOrderPDFDataFromJob } from "@/lib/work-order-pdf-generator";
import { parseJobMemosFromField26 } from "@/lib/job-memo-parser";
import { generateMagicLink } from "@/lib/line-api";
import { WorkOrderCard } from "@/components/features/work-order-card";
import {
  isLongTermProject,
  extractLongTermProjectData,
  isLongTermWorkOrder,
  extractLongTermProgressFromWorkOrder,
  hasLongTermWorkOrder
} from "@/lib/long-term-project-utils";
import { LongTermProjectDetailDialog } from "@/components/features/long-term-project-detail-dialog";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";
import { WorkOrder, EstimateItem } from "@/types";
import { QRCodeSVG } from "qrcode.react";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 作業オーダーごとに承認済み作業内容を取得
 * 優先順位: workOrder.estimate?.items（承認済み項目） > job.field13（後方互換性）
 */
function getApprovedWorkItemsForWorkOrder(
  workOrder: WorkOrder,
  job: ZohoJob
): { items: Array<{ name: string; price: number }>; source: "estimate" | "legacy" } | null {
  // 将来的な実装: workOrder.estimate?.itemsから承認済み項目を抽出
  if (workOrder.estimate?.items && Array.isArray(workOrder.estimate.items)) {
    const approvedItems = workOrder.estimate.items.filter(
      (item: EstimateItem) => item.approved !== false && item.selected !== false
    );

    if (approvedItems.length > 0) {
      return {
        items: approvedItems.map((item: EstimateItem) => ({
          name: item.name,
          price: item.price,
        })),
        source: "estimate",
      };
    }
  }

  // 後方互換性: job.field13から取得（単一作業の場合のみ）
  // 複合業務の場合は、job.field13には全作業の承認済み項目が含まれる可能性があるため、
  // 作業オーダーのserviceKindに一致する項目のみを抽出
  if (job.field13) {
    const lines = job.field13.split("\n");
    const items: Array<{ name: string; price: number }> = [];

    for (const line of lines) {
      // 行を解析して作業項目名と価格を抽出
      const match = line.match(/^(.+?)\s+¥?([\d,]+)$/);
      if (match) {
        items.push({
          name: match[1].trim(),
          price: parseInt(match[2].replace(/,/g, ""), 10),
        });
      }
    }

    if (items.length > 0) {
      return {
        items,
        source: "legacy",
      };
    }
  }

  return null;
}

/**
 * ISO8601の日時文字列から日付と時刻を抽出 (MM/DD HH:MM形式)
 */
function formatDateTime(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: "--/--", time: "--:--" };
  const date = new Date(isoString);
  const dateStr = date.toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  const timeStr = date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  return { date: dateStr, time: timeStr };
}

/**
 * ステータスバッジのスタイルを取得
 * セマンティックカラーシステムに基づく統一ルール
 * - Blue: 進行中・待機中（入庫待ち、入庫済み）
 * - Orange: 注意が必要・作業待ち（診断待ち、作業待ち、部品発注待ち）
 * - Amber: 承認待ち・保留（見積提示済み、部品調達待ち）
 * - Indigo: 情報・管理業務（見積作成待ち）
 * - Green: 完了・成功（出庫待ち）
 * - Slate: 完了・非アクティブ（出庫済み）
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

/**
 * 受付状態をチェック（共通ロジック）
 */
function isCheckInRequired(job: ZohoJob): boolean {
  return job.field5 === "入庫待ち" || !job.field5;
}

/**
 * アクション設定を取得
 * アイコン色・ボタン背景色ルール:
 * - 入庫待ち: グレー（初期状態）
 * - 入庫済み: 青（診断開始）
 * - 見積作成待ち: オレンジ（見積作成）
 * - 作業待ち: 緑（作業開始）
 * - 出庫待ち: 紫（引渡し）
 */
function getActionConfig(job: ZohoJob, onCheckIn: () => void) {
  if (!job.field5) {
    // field5が未定義の場合、入庫待ちとして扱う
    return {
      label: "受付を開始",
      icon: Key,
      iconColor: "text-white",
      buttonBgColor: "bg-slate-600",
      buttonHoverColor: "hover:bg-slate-700",
      href: null,
      onClick: onCheckIn,
      priority: "high" as const,
      disabled: false,
    };
  }

  switch (job.field5) {
    case "入庫待ち":
      return {
        label: "受付を開始",
        icon: Key,
        iconColor: "text-white",
        buttonBgColor: "bg-slate-600",
        buttonHoverColor: "hover:bg-slate-700",
        href: null,
        onClick: onCheckIn,
        priority: "high" as const,
        disabled: false,
      };
    case "入庫済み":
      // 車検・12ヵ月点検の場合は「受入点検を開始」、その他は「診断を開始」
      // 注意: 案件カードは車両単位なので、実際の診断開始は作業カードで行う
      // ここでは「引渡しを開始」をdisabled状態で表示（次のステップを示す）
      return {
        label: "引渡しを開始",
        icon: Car,
        iconColor: "text-white",
        buttonBgColor: "bg-slate-400",
        buttonHoverColor: "hover:bg-slate-400",
        href: null,
        priority: "medium" as const,
        disabled: true, // disabled状態で表示
      };
    case "見積作成待ち":
      // 案件カードは車両単位なので、「見積を開始」は作業カードで行う
      // ここでは「引渡しを開始」をdisabled状態で表示（次のステップを示す）
      return {
        label: "引渡しを開始",
        icon: Car,
        iconColor: "text-white",
        buttonBgColor: "bg-slate-400",
        buttonHoverColor: "hover:bg-slate-400",
        href: null,
        priority: "medium" as const,
        disabled: true, // disabled状態で表示
      };
    case "作業待ち":
      // 案件カードは車両単位なので、「作業を開始」は作業カードに表示される
      // ここでは「引渡しを開始」をdisabled状態で表示（次のステップを示す）
      return {
        label: "引渡しを開始",
        icon: Car,
        iconColor: "text-white",
        buttonBgColor: "bg-slate-400",
        buttonHoverColor: "hover:bg-slate-400",
        href: null,
        priority: "medium" as const,
        disabled: true, // disabled状態で表示
      };
    case "出庫待ち":
      return {
        label: "引渡しを開始",
        icon: Car,
        iconColor: "text-white",
        buttonBgColor: "bg-blue-600",
        buttonHoverColor: "hover:bg-blue-700",
        href: `/presentation/${job.id}`,
        priority: "medium" as const,
        disabled: false,
      };
    case "見積提示済み":
    case "部品調達待ち":
    case "部品発注待ち":
      // 受付完了後、出庫待ちになるまでの間は「引渡しを開始」をdisabled状態で表示
      // これにより、ユーザーは次のステップ（引渡し）を常に確認できる
      return {
        label: "引渡しを開始",
        icon: Car,
        iconColor: "text-white",
        buttonBgColor: "bg-slate-400",
        buttonHoverColor: "hover:bg-slate-400",
        href: null,
        priority: "medium" as const,
        disabled: true, // disabled状態で表示
      };
    case "出庫済み":
      // 出庫済みの場合はボタンを表示しない（完了済み）
      return {
        label: null,
        icon: null,
        iconColor: null,
        buttonBgColor: null,
        buttonHoverColor: null,
        href: null,
        priority: "none" as const,
      };
    default:
      // 予期しないステータスの場合、入庫待ちとして扱う
      return {
        label: "受付を開始",
        icon: Key,
        iconColor: "text-white",
        buttonBgColor: "bg-slate-600",
        buttonHoverColor: "hover:bg-slate-700",
        href: null,
        onClick: onCheckIn,
        priority: "high" as const,
        disabled: false,
      };
  }
}

// =============================================================================
// Props
// =============================================================================

interface JobCardProps {
  job: ZohoJob;
  onCheckIn: (job: ZohoJob) => void;
  isCheckingIn?: boolean;
  courtesyCars?: CourtesyCar[];
}

// =============================================================================
// Component
// =============================================================================

export const JobCard = memo(function JobCard({ job, onCheckIn, isCheckingIn = false, courtesyCars = [] }: JobCardProps) {
  const router = useRouter();
  const customerName = job.field4?.name ?? "未登録";
  const vehicleInfo = job.field6?.name ?? "車両未登録";
  const customerId = job.field4?.id;
  const vehicleId = job.field6?.id;

  // 入庫日時の表示ロジック
  const isCheckedIn = job.field5 !== "入庫待ち";
  const arrivalDateTime = isCheckedIn && job.field22 ? formatDateTime(job.field22) : { date: "--/--", time: "00:00" };
  const arrivalLabel = isCheckedIn ? "入庫日時" : "入庫予定";

  // 事前入力情報があるかチェック（field7に「【事前入力】」が含まれている場合）
  const hasPreInput = !!(job.field7 && job.field7.includes("【事前入力】"));
  const hasWorkOrder = !!job.field;

  // 代車情報を取得（配列でない場合のエラーハンドリング）
  const safeCourtesyCars = Array.isArray(courtesyCars) ? courtesyCars : [];
  const courtesyCar = safeCourtesyCars.find(car => car.jobId === job.id);

  // 顧客情報を取得
  const { data: customerData } = useSWR(
    customerId ? `customer-${customerId}` : null,
    async () => {
      if (!customerId) return null;
      const result = await fetchCustomerById(customerId);
      return result.success ? result.data : null;
    }
  );

  // 車両情報を取得（ナンバープレート表示用）
  const { data: vehicleData } = useSWR(
    vehicleId ? `vehicle-${vehicleId}` : null,
    async () => {
      if (!vehicleId) return null;
      const result = await fetchVehicleById(vehicleId);
      return result.success ? result.data : null;
    }
  );

  // 代車データを取得（すべてのフックを条件分岐の前に配置）
  const { data: allCourtesyCars, isLoading: isCourtesyCarsLoading } = useSWR(
    "courtesy-cars",
    async () => {
      const result = await fetchAllCourtesyCars();
      return result.success && result.data ? result.data : [];
    }
  );

  // ワークオーダーを取得（写真数の計算用）
  const { workOrders: fetchedWorkOrders, mutate: mutateWorkOrders } = useWorkOrders(job.id);

  // 単発作業の場合、workOrdersが存在しない場合はjob.serviceKindから作成
  const workOrders = useMemo(() => {
    if (fetchedWorkOrders && fetchedWorkOrders.length > 0) {
      return fetchedWorkOrders;
    }
    // 単発作業の場合、job.serviceKindからworkOrderを作成
    if (job.serviceKind && (!job.field_service_kinds || job.field_service_kinds.length === 1)) {
      return [{
        id: `wo-${job.id}-single`,
        jobId: job.id,
        serviceKind: job.serviceKind,
        status: (() => {
          switch (job.field5) {
            case "入庫待ち":
            case undefined:
            case null:
              return "未開始" as WorkOrderStatus;
            case "入庫済み":
              return "診断中" as WorkOrderStatus;
            case "見積作成待ち":
              return "見積作成待ち" as WorkOrderStatus;
            case "見積提示済み":
              return "顧客承認待ち" as WorkOrderStatus;
            case "作業待ち":
              return "作業待ち" as WorkOrderStatus;
            case "出庫待ち":
              return "完了" as WorkOrderStatus;
            default:
              return "未開始" as WorkOrderStatus;
          }
        })(),
        diagnosis: null,
        estimate: null,
        work: null,
        vendor: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }
    return [];
  }, [fetchedWorkOrders, job.id, job.serviceKind, job.field_service_kinds, job.field5]);

  // 見積があるワークオーダーを特定（マジックリンク生成用）
  const workOrderWithEstimate = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return null;
    // 見積がある最初のワークオーダーを返す
    return workOrders.find((wo) => wo.estimate && wo.estimate.items && wo.estimate.items.length > 0) || null;
  }, [workOrders]);

  // 長期プロジェクト判定と進捗データ取得（作業オーダー単位）
  // 複合業務対応: 作業オーダー単位で判定
  const longTermWorkOrders = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return [];
    return workOrders.filter(wo => isLongTermWorkOrder(wo));
  }, [workOrders]);

  // 単一の長期プロジェクト作業オーダーの場合のみ、ジョブ全体の進捗情報を表示
  const isSingleLongTermProject = useMemo(() => {
    return longTermWorkOrders.length === 1 && workOrders.length === 1;
  }, [longTermWorkOrders.length, workOrders.length]);

  // ジョブ全体の進捗データ（単一の長期プロジェクトの場合のみ使用）
  const longTermProjectData = useMemo(() => {
    if (!isSingleLongTermProject || !longTermWorkOrders[0]) return null;
    const progressData = extractLongTermProgressFromWorkOrder(longTermWorkOrders[0]);
    if (!progressData) return null;

    // 車両情報を抽出
    const vehicleInfo = typeof job.field6 === "string" ? job.field6 : (job.field6?.name || "");
    const vehicleParts = vehicleInfo ? vehicleInfo.split(" / ") : [];
    const vehicleName = vehicleParts[0] || "車両未登録";
    const licensePlate = vehicleParts[1] || undefined;

    return {
      jobId: job.id,
      customerName: job.field4?.name || "顧客未登録",
      vehicleName,
      licensePlate,
      serviceKind: longTermWorkOrders[0].serviceKind,
      progress: progressData.progress,
      isDelayed: progressData.isDelayed,
      startDate: progressData.startDate,
      expectedCompletionDate: progressData.expectedCompletionDate,
      currentPhase: progressData.currentPhase,
      job,
    };
  }, [isSingleLongTermProject, longTermWorkOrders, job]);

  // 見積承認リンクのクリックハンドラ（マジックリンク生成）
  const [isGeneratingMagicLink, setIsGeneratingMagicLink] = useState(false);
  const handleEstimateApprovalClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    triggerHapticFeedback("light");

    if (isGeneratingMagicLink) return;

    setIsGeneratingMagicLink(true);
    try {
      const result = await generateMagicLink({
        jobId: job.id,
        workOrderId: workOrderWithEstimate?.id,
        expiresIn: 7 * 24 * 60 * 60, // 7日間
      });

      if (result.success && result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("マジックリンクの生成に失敗しました", {
          description: result.error?.message || "見積承認ページにアクセスできません",
        });
      }
    } catch (error) {
      console.error("マジックリンク生成エラー:", error);
      toast.error("マジックリンクの生成に失敗しました");
    } finally {
      setIsGeneratingMagicLink(false);
    }
  };

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

  // 車両名とナンバープレートを抽出
  const { vehicleName, licensePlate } = useMemo(() => {
    if (!vehicleInfo || vehicleInfo === "車両未登録") {
      return { vehicleName: "車両未登録", licensePlate: undefined };
    }
    const parts = vehicleInfo.split(" / ");
    return {
      vehicleName: parts[0] || vehicleInfo,
      licensePlate: parts[1] || undefined,
    };
  }, [vehicleInfo]);

  // サンプル画像のマッピング（車両名に基づいて画像を選択）
  const getSamplePhotoUrl = (vehicleName: string): string | null => {
    const vehicleNameLower = vehicleName.toLowerCase();
    // より具体的な条件からチェック（順序が重要）
    // Peugeot 307 SW（307を先にチェック）
    if (vehicleNameLower.includes("307")) {
      return "/sample-vehicles/251027-peugeot-307sw.jpg";
    }
    // Peugeot 2008
    if (vehicleNameLower.includes("2008")) {
      return "/sample-vehicles/251018-peugeot-2008.jpg";
    }
    // Lancia Delta Integrale
    if (vehicleNameLower.includes("ランチア") || vehicleNameLower.includes("lancia")) {
      return "/sample-vehicles/250424-lancia-delta-integrale-ev2.jpg";
    }
    // Toyota Yaris GRMN
    if (vehicleNameLower.includes("ヤリス") || vehicleNameLower.includes("yaris")) {
      return "/sample-vehicles/251018-toyota-yaris-grmn.jpg";
    }
    // Ford Mustang
    if (vehicleNameLower.includes("マスタング") || vehicleNameLower.includes("mustang")) {
      return "/sample-vehicles/250918-ford-mustang-v8-gt.jpg";
    }
    // BMW 1 Series
    if (vehicleNameLower.includes("bmw") || vehicleNameLower.includes("ビーエムダブリュー")) {
      return "/sample-vehicles/251019-bmw-116i.jpg";
    }
    // Citroën Saxo
    if (vehicleNameLower.includes("シトロエン") || vehicleNameLower.includes("saxo")) {
      return "/sample-vehicles/251021-citroen-saxo-vts.jpg";
    }
    return null;
  };

  // ブログ用写真を取得
  const { data: blogPhotos = [] } = useSWR(
    job.id ? `blog-photos-card-${job.id}` : null,
    async () => {
      if (!job.id) return [];
      return await listBlogPhotosFromJobFolder(job.id);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // ブログ用写真から位置情報を抽出（ファイル名から）
  const blogPhotosWithPosition = useMemo(() => {
    return blogPhotos.map((photo) => {
      // ファイル名から位置情報を抽出
      const fileName = photo.fileName.toLowerCase();
      let position: string | undefined;

      // ファイル名に位置情報が含まれているか確認
      if (fileName.includes("front") || fileName.includes("前面") || fileName.includes("00_")) {
        position = "front";
      } else if (fileName.includes("rear") || fileName.includes("後面") || fileName.includes("01_")) {
        position = "rear";
      } else if (fileName.includes("left") || fileName.includes("左側面") || fileName.includes("02_")) {
        position = "left";
      } else if (fileName.includes("right") || fileName.includes("右側面") || fileName.includes("03_")) {
        position = "right";
      } else if (fileName.includes("engine") || fileName.includes("エンジン") || fileName.includes("04_")) {
        position = "engine";
      } else if (fileName.includes("interior") || fileName.includes("内装") || fileName.includes("05_")) {
        position = "interior";
      }

      return {
        ...photo,
        position,
      };
    });
  }, [blogPhotos]);

  // 最初の写真を取得（ブログ用写真を優先、優先順位: 前面 > 後面 > 左側面 > 右側面 > その他）
  const firstPhoto = useMemo(() => {
    // 優先順位1: ブログ用写真（前面を最優先）
    if (blogPhotosWithPosition.length > 0) {
      const frontPhoto = blogPhotosWithPosition.find((p) => p.position === "front");
      if (frontPhoto) return frontPhoto.url;

      const rearPhoto = blogPhotosWithPosition.find((p) => p.position === "rear");
      if (rearPhoto) return rearPhoto.url;

      const leftPhoto = blogPhotosWithPosition.find((p) => p.position === "left");
      if (leftPhoto) return leftPhoto.url;

      const rightPhoto = blogPhotosWithPosition.find((p) => p.position === "right");
      if (rightPhoto) return rightPhoto.url;

      // 位置情報がない場合は最初の写真
      return blogPhotosWithPosition[0].url;
    }

    // 優先順位2: 社内用写真（診断写真、作業写真）
    if (workOrders && workOrders.length > 0) {
      // 診断写真
      for (const wo of workOrders) {
        if (wo.diagnosis?.photos && Array.isArray(wo.diagnosis.photos) && wo.diagnosis.photos.length > 0) {
          return wo.diagnosis.photos[0].url;
        }
      }

      // 作業写真（before > after > general）
      for (const wo of workOrders) {
        if (wo.work?.records && Array.isArray(wo.work.records)) {
          for (const record of wo.work.records) {
            if (record.photos && Array.isArray(record.photos) && record.photos.length > 0) {
              const beforePhoto = record.photos.find((p: any) => p.type === "before");
              if (beforePhoto) return beforePhoto.url;
              const afterPhoto = record.photos.find((p: any) => p.type === "after");
              if (afterPhoto) return afterPhoto.url;
              return record.photos[0].url;
            }
          }
        }
      }
    }

    // 写真がない場合、サンプル画像を返す（開発環境のみ）
    return getSamplePhotoUrl(vehicleName);
  }, [blogPhotosWithPosition, workOrders, vehicleName]);


  // 写真の総数を計算（ブログ用写真 + 社内用写真の合計）
  const photoCount = useMemo(() => {
    let count = 0;

    // ブログ用写真
    count += blogPhotosWithPosition.length;

    // 社内用写真（診断写真と作業写真）
    if (workOrders && workOrders.length > 0) {
      workOrders.forEach((wo) => {
        // 診断写真
        if (wo.diagnosis?.photos && Array.isArray(wo.diagnosis.photos)) {
          count += wo.diagnosis.photos.length;
        }
        // 作業写真
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
  }, [blogPhotosWithPosition, workOrders]);

  // 重要な顧客フラグ
  const [isImportant, setIsImportant] = useState(false);

  useEffect(() => {
    if (customerId) {
      setIsImportant(isImportantCustomer(customerId));
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

  // PDF生成中フラグ
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // 受付メモダイアログの状態
  const [isWorkOrderDialogOpen, setIsWorkOrderDialogOpen] = useState(false);

  // 作業追加ダイアログの状態
  const [isAddWorkOrderDialogOpen, setIsAddWorkOrderDialogOpen] = useState(false);

  // 作業メモモーダルの状態
  const [isWorkMemoModalOpen, setIsWorkMemoModalOpen] = useState(false);

  // 長期プロジェクト進捗詳細ダイアログの状態
  const [isLongTermProjectDetailDialogOpen, setIsLongTermProjectDetailDialogOpen] = useState(false);

  // タグ変更ダイアログの状態
  const [isTagChangeDialogOpen, setIsTagChangeDialogOpen] = useState(false);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);
  const [selectedNewTagId, setSelectedNewTagId] = useState<string | null>(null);

  // 作業カード一覧の展開状態

  // 車両詳細ダイアログの状態
  const [isVehicleDetailDialogOpen, setIsVehicleDetailDialogOpen] = useState(false);

  // 顧客詳細ダイアログの状態
  const [isCustomerDetailDialogOpen, setIsCustomerDetailDialogOpen] = useState(false);

  // 写真ギャラリーダイアログの状態
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  // ブログ用写真撮影ダイアログの状態
  const [isBlogPhotoCaptureDialogOpen, setIsBlogPhotoCaptureDialogOpen] = useState(false);
  // 整備士選択ダイアログの状態
  const [isMechanicSelectDialogOpen, setIsMechanicSelectDialogOpen] = useState(false);
  const [isAssigningMechanic, setIsAssigningMechanic] = useState(false);

  // 代車変更ダイアログの状態
  const [isCourtesyCarChangeDialogOpen, setIsCourtesyCarChangeDialogOpen] = useState(false);
  const [isChangingCourtesyCar, setIsChangingCourtesyCar] = useState(false);

  // 代車変更ハンドラ
  const handleCourtesyCarChange = async (newCarId: string | null) => {
    if (isChangingCourtesyCar) return;

    try {
      setIsChangingCourtesyCar(true);
      triggerHapticFeedback("medium");
      const result = await updateJobCourtesyCar(job.id, newCarId);
      if (!result.success) {
        toast.error(result.error?.message || "代車の変更に失敗しました");
        return;
      }

      // 成功メッセージ
      if (newCarId) {
        const newCar = allCourtesyCars?.find(c => c.carId === newCarId);
        toast.success(`代車を${newCar?.name || "選択した代車"}に変更しました`);
      } else {
        toast.success("代車を解除しました");
      }

      // データを再取得
      mutate("today-jobs");
      mutate("courtesy-cars");
      setIsCourtesyCarChangeDialogOpen(false);
    } catch (error) {
      console.error("代車変更エラー:", error);
      toast.error("代車の変更に失敗しました");
    } finally {
      setIsChangingCourtesyCar(false);
    }
  };

  const handleSkipCourtesyCar = async () => {
    await handleCourtesyCarChange(null);
  };

  // 詳細情報の折りたたみ状態
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const handleCheckIn = () => {
    onCheckIn(job);
  };

  const handleOpenWorkOrderDialog = () => {
    setIsWorkOrderDialogOpen(true);
  };

  /**
   * 作業指示書PDF出力
   */
  const handlePrintWorkOrder = async () => {
    if (!job) return;

    setIsGeneratingPDF(true);
    triggerHapticFeedback("medium");

    try {
      // 代車情報を取得（配列チェックを追加）
      const courtesyCar = safeCourtesyCars.find(car => car.jobId === job.id);

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

  const handleWorkOrderSuccess = async () => {
    // SWRキャッシュを再検証（ページ全体のリロードを避ける）
    await mutate("today-jobs");
    await mutate("all-jobs");
    await mutate(`job-${job.id}`);
    // JobCard内のjobデータも更新するため、親コンポーネントに通知
    // 親コンポーネントでmutateJobsが呼ばれる想定
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

  // アクション設定を取得
  const actionConfig = getActionConfig(job, handleCheckIn);

  // 単体作業の場合は、現在のUIを維持（複合作業の場合は作業カード一覧を表示）
  const finalHref = useMemo(() => {
    if (!actionConfig.href) return actionConfig.href;

    // 複合作業の場合は、作業カード一覧を展開するため、hrefはそのまま（展開ボタンで表示）
    // 単体作業の場合は、従来通り直接診断画面に遷移
    return actionConfig.href;
  }, [actionConfig.href]);

  // 承認済み作業内容のモーダル表示用の状態（作業オーダーIDを保持）
  const [selectedWorkOrderIdForApprovedItems, setSelectedWorkOrderIdForApprovedItems] = useState<string | null>(null);

  // 作業メモがあるかチェック
  const jobMemos = parseJobMemosFromField26(job.field26);
  const hasWorkMemo = jobMemos.length > 0;
  const latestWorkMemo = jobMemos.length > 0 ? jobMemos[0] : null;

  // 詳細情報があるかチェック
  const hasDetails = hasPreInput || hasWorkOrder || hasChangeRequest || hasWorkMemo;

  // 入庫区分アイコンを取得（serviceKindを引数として受け取る版）
  const getServiceKindIconForServiceKind = (serviceKind: string) => {
    switch (serviceKind) {
      case "車検":
        return <ShieldCheck className="h-4 w-4 text-cyan-600" strokeWidth={2.5} />;
      case "12ヵ月点検":
        return <CalendarCheck className="h-4 w-4 text-cyan-600" strokeWidth={2.5} />;
      case "エンジンオイル交換":
        return <Droplet className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />;
      case "タイヤ交換・ローテーション":
        return <Circle className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />;
      case "その他のメンテナンス":
        return <Settings className="h-4 w-4 text-slate-700" strokeWidth={2.5} />;
      case "故障診断":
        return <Activity className="h-4 w-4 text-rose-600" strokeWidth={2.5} />;
      case "修理・整備":
        return <Wrench className="h-4 w-4 text-orange-700" strokeWidth={2.5} />;
      case "チューニング":
        return <Zap className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
      case "パーツ取付":
        return <Package className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
      case "コーティング":
        return <Shield className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
      case "レストア":
        return <Sparkles className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
      case "板金・塗装":
        return <Paintbrush className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
      case "その他":
        return <FileText className="h-4 w-4 text-slate-700" strokeWidth={2.5} />;
      default:
        return <FileText className="h-4 w-4 text-slate-700" strokeWidth={2.5} />;
    }
  };

  // 入庫区分アイコンを取得（後方互換性のため、job.serviceKindを使用）
  const getServiceKindIcon = () => {
    if (!job.serviceKind) {
      return <FileText className="h-4 w-4 text-slate-700" strokeWidth={2.5} />;
    }
    return getServiceKindIconForServiceKind(job.serviceKind);
  };

  // 承認済み作業内容のモーダル表示用の状態
  const [isApprovedWorkItemsModalOpen, setIsApprovedWorkItemsModalOpen] = useState(false);
  const [isWorkOrderMemoModalOpen, setIsWorkOrderMemoModalOpen] = useState(false);
  const [isPreInputModalOpen, setIsPreInputModalOpen] = useState(false);
  const [isChangeRequestDetailOpen, setIsChangeRequestDetailOpen] = useState(false);

  return (
    <>
      {/* ジョブカード全体 - 2つのセクションに分割 */}
      <div
        className={cn(
          "bg-white rounded-xl border mb-4 overflow-hidden transition-all hover:shadow-lg relative",
          // 複合業務の場合、長期プロジェクトの作業オーダーが遅延しているかチェック
          (() => {
            if (longTermWorkOrders.length === 0) return false;
            return longTermWorkOrders.some(wo => {
              const progressData = extractLongTermProgressFromWorkOrder(wo);
              return progressData?.isDelayed || false;
            });
          })()
            ? "border-red-400 bg-red-50/50 hover:border-red-500"
            : "border-slate-200 hover:border-slate-300"
        )}
        role="article"
        aria-label={`案件: ${customerName} - ${vehicleInfo}`}
      >
        {/* 右上アイコンボタン - カードの右上に固定（ボタンの上） */}
        <div className="absolute top-4 right-4 z-10 flex gap-1">
          {/* 作業指示書印刷ボタン（作業指示または申し送り事項がある場合のみ表示） */}
          {(hasWorkOrder || hasPreInput) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrintWorkOrder();
              }}
              disabled={isGeneratingPDF}
              className="p-1.5 transition-all hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
          {job.field19 && (
            <a
              href={job.field19}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 transition-all hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              onClick={(e) => {
                e.stopPropagation();
                triggerHapticFeedback("light");
              }}
              title="Google Driveフォルダを開く"
            >
              <Folder className="h-4.5 w-4.5" />
            </a>
          )}
          {customerId && (
            <button
              onClick={handleToggleImportant}
              className={cn(
                "p-1.5 transition-all hover:bg-slate-100",
                isImportant ? "text-red-500 hover:text-red-600" : "text-slate-400 hover:text-slate-600"
              )}
              aria-label={isImportant ? "注意フラグを解除" : "注意フラグを設定"}
              title={isImportant ? "注意フラグを解除" : "注意フラグを設定"}
            >
              <Flag className={cn("h-4.5 w-4.5", isImportant && "fill-current")} />
            </button>
          )}
        </div>

        {/* 上部セクション: 車両画像 + 顧客情報 + 右上アクション */}
        <div className="flex border-b border-slate-200 lg:flex-row flex-col lg:items-stretch">
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
                    setIsCustomerDetailDialogOpen(true);
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

            {/* 情報行 - 入庫カテゴリ */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* サービス種類バッジ（複数の場合はすべて表示） */}
              {(() => {
                // workOrdersから最新のserviceKindsを計算（オプティミスティック更新に対応）
                const serviceKindsFromWorkOrders = workOrders && workOrders.length > 0
                  ? Array.from(new Set(workOrders.map(wo => wo.serviceKind)))
                  : [];

                // 優先順位: workOrders > job.field_service_kinds > job.serviceKind
                const displayServiceKinds = serviceKindsFromWorkOrders.length > 0
                  ? serviceKindsFromWorkOrders
                  : (job.field_service_kinds && job.field_service_kinds.length > 0
                    ? job.field_service_kinds
                    : (job.serviceKind ? [job.serviceKind] : []));

                return displayServiceKinds.length > 0 ? (
                  displayServiceKinds.map((serviceKind, index) => {
                    const icon = getServiceKindIconForServiceKind(serviceKind);
                    return (
                      <Badge
                        key={`${serviceKind}-${index}`}
                        variant="outline"
                        className="bg-slate-100 text-slate-800 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                      >
                        <span>{icon}</span>
                        <span>{serviceKind}</span>
                      </Badge>
                    );
                  })
                ) : null;
              })()}
            </div>

            {/* 情報行 - 時間、タグ、整備士、代車など */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* 入庫日時（クリック不可） */}
              <div className="flex items-center gap-1.5 text-base text-slate-700 cursor-default">
                <Clock className="h-4 w-4 text-slate-500" />
                {arrivalDateTime.date} {arrivalDateTime.time}
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


              {/* 代車（クリック可能：変更可能） */}
              {courtesyCar && (
                <button
                  onClick={() => {
                    triggerHapticFeedback("light");
                    setIsCourtesyCarChangeDialogOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-base text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
                  aria-label="代車を変更"
                  title="代車を変更する（クリック）"
                >
                  <CarFront className="h-4 w-4 text-slate-500" />
                  代車 {courtesyCar.name}
                </button>
              )}
            </div>


            {/* ボタン行 */}
            <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-100 flex-wrap">
              {/* お客様入力情報ボタン */}
              {hasPreInput && (
                <button
                  onClick={() => setIsPreInputModalOpen(true)}
                  className="bg-blue-50 text-blue-900 border border-blue-400 text-base font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                  title="お客様入力情報"
                >
                  <MessageSquare className="h-5 w-5 shrink-0 text-blue-600" />
                  <span className="whitespace-nowrap">お客様入力情報</span>
                </button>
              )}


              {/* 受付メモボタン */}
              {hasWorkOrder && (
                <button
                  onClick={() => setIsWorkOrderMemoModalOpen(true)}
                  className="bg-amber-50 text-amber-900 border border-amber-400 text-base font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer shrink-0 dark:bg-slate-800 dark:text-white dark:border-amber-400 dark:hover:bg-slate-700"
                  title="受付メモ"
                >
                  <NotebookPen className="h-5 w-5 shrink-0 text-amber-600" />
                  <span className="whitespace-nowrap">受付メモ</span>
                </button>
              )}

              {/* 作業メモボタン */}
              {hasWorkMemo && latestWorkMemo && (
                <button
                  onClick={() => setIsWorkMemoModalOpen(true)}
                  className="bg-purple-50 text-purple-900 border border-purple-400 text-base font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-purple-100 transition-colors cursor-pointer shrink-0"
                  title="作業メモ"
                >
                  <Notebook className="h-5 w-5 shrink-0 text-purple-600" />
                  <span className="whitespace-nowrap">作業メモ</span>
                </button>
              )}

              {/* 変更申請ありボタン */}
              {hasChangeRequest && (
                <button
                  onClick={() => {
                    triggerHapticFeedback("light");
                    setIsChangeRequestDetailOpen(true);
                  }}
                  className="bg-rose-50 text-rose-900 border border-rose-400 text-base font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                  title="変更申請詳細を表示"
                >
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                  <span className="whitespace-nowrap">変更申請あり</span>
                </button>
              )}

              {/* 受付メモを追加ボタン */}
              {!hasWorkOrder && (
                <button
                  onClick={handleOpenWorkOrderDialog}
                  className="flex items-center gap-1.5 text-base text-slate-500 hover:text-slate-700 bg-none border-none cursor-pointer px-2.5 py-1 rounded-md transition-all hover:bg-slate-100 shrink-0"
                  title="受付メモを追加"
                >
                  <Plus className="h-5 w-5 shrink-0 text-slate-500" />
                  <span className="whitespace-nowrap">受付メモを追加</span>
                </button>
              )}
            </div>

          </div>

          {/* セパレーター - メインコンテンツとアクションセクションの間 */}
          <div className="hidden lg:flex items-center shrink-0">
            <div className="w-px h-full bg-slate-200"></div>
          </div>

          {/* アクションセクション - 固定幅200px（常に表示してレイアウトを維持） */}
          <div className="w-full lg:w-[200px] flex-shrink-0 p-4 border-t lg:border-t-0 flex flex-col gap-3 pt-16">
            {/* 作業進捗表示 */}
            {workOrders && workOrders.length > 0 && (() => {
              // 進捗率を計算
              const calculateProgress = (): { percentage: number; completed: number; total: number } => {
                const total = workOrders.length;
                if (total === 0) return { percentage: 0, completed: 0, total: 0 };

                // 各ワークオーダーの進捗率を計算
                const progressMap: Record<WorkOrderStatus, number> = {
                  "未開始": 0,
                  "受入点検中": 20,
                  "診断中": 20,
                  "見積作成待ち": 40,
                  "顧客承認待ち": 60,
                  "作業待ち": 80,
                  "作業中": 80,
                  "外注調整中": 20,
                  "外注見積待ち": 40,
                  "外注作業中": 80,
                  "完了": 100,
                };

                const totalProgress = workOrders.reduce((sum, wo) => {
                  return sum + (progressMap[wo.status] || 0);
                }, 0);

                const averageProgress = Math.round(totalProgress / total);
                const completed = workOrders.filter(wo => wo.status === "完了").length;

                return {
                  percentage: averageProgress,
                  completed,
                  total,
                };
              };

              const progress = calculateProgress();

              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">作業進捗</span>
                    <span className="text-xs font-semibold text-slate-900">
                      {progress.completed}/{progress.total}完了
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        progress.percentage === 100
                          ? "bg-green-500"
                          : progress.percentage >= 80
                            ? "bg-blue-500"
                            : progress.percentage >= 60
                              ? "bg-amber-500"
                              : progress.percentage >= 40
                                ? "bg-blue-400"
                                : "bg-slate-400"
                      )}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-xs font-semibold text-slate-700">
                      {progress.percentage}%
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* アクションボタン（車両単位の操作のみ: 受付開始、引き渡し） */}
            {/* 表示条件: 受付待ち、出庫待ち、または受付完了後（引渡しを開始をdisabled状態で表示） */}
            {actionConfig && 
             actionConfig.priority !== "none" && 
             actionConfig.label && 
             (actionConfig.priority === "high" || actionConfig.priority === "medium") ? (
              finalHref && !actionConfig.disabled ? (
                <Button
                  asChild
                  className={cn("h-12 w-full text-white text-sm font-semibold", actionConfig.buttonBgColor, actionConfig.buttonHoverColor)}
                >
                  <Link
                    href={finalHref}
                    prefetch={true}
                    onClick={() => {
                      document.body.setAttribute("data-navigating", "true");
                    }}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <actionConfig.icon className={cn("h-4.5 w-4.5", actionConfig.iconColor)} />
                    {actionConfig.label}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={actionConfig.onClick || undefined}
                  disabled={actionConfig.disabled || isCheckingIn}
                  className={cn(
                    "h-12 w-full text-white text-sm font-semibold",
                    actionConfig.buttonBgColor,
                    actionConfig.disabled ? "cursor-not-allowed opacity-60" : actionConfig.buttonHoverColor
                  )}
                  aria-label={actionConfig.label || "アクションを実行"}
                  title={actionConfig.disabled ? "作業完了後に操作できます" : undefined}
                >
                  {isCheckingIn ? (
                    "処理中..."
                  ) : (
                    <>
                      <actionConfig.icon className={cn("h-4.5 w-4.5", actionConfig.iconColor)} />
                      {actionConfig.label}
                      {!actionConfig.disabled && <ChevronRight className="h-4 w-4" />}
                    </>
                  )}
                </Button>
              )
            ) : null}
          </div>
        </div>

        {/* 下部セクション: 作業カード一覧（折りたたみ可能、デフォルトで閉じる） */}
        {(workOrders && workOrders.length > 0) && (
          <div className="border-t border-slate-200 bg-slate-50">
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-14 text-base font-semibold hover:bg-slate-100 bg-white border-b border-slate-200 rounded-none px-4 lg:px-5 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHapticFeedback("light");
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <Wrench className="h-5 w-5 text-slate-700 shrink-0" />
                    <span className="text-slate-900">作業一覧</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-sm font-semibold px-2.5 py-0.5">
                      {workOrders.length}件
                    </Badge>
                  </span>
                  <ChevronDown className="h-5 w-5 text-slate-600 transition-transform duration-200 data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 lg:p-5 max-h-[400px] overflow-y-auto space-y-2">
                  {workOrders.map((workOrder) => {
                    // 長期プロジェクトの進捗データを取得
                    const longTermProgress = isLongTermWorkOrder(workOrder)
                      ? extractLongTermProgressFromWorkOrder(workOrder)
                      : null;

                    // 受付未完了または受付処理中の場合、カードをグレーアウト
                    const isCheckInRequiredForWorkOrder = isCheckInRequired(job);
                    const isWorkOrderCardDisabled = isCheckInRequiredForWorkOrder || isCheckingIn;

                    return (
                      <div
                        key={workOrder.id}
                        className={cn(
                          "p-3 rounded-lg border bg-white transition-colors relative",
                          isWorkOrderCardDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-slate-50",
                          longTermProgress?.isDelayed
                            ? "border-red-300 bg-red-50/30"
                            : "border-slate-200"
                        )}
                      >
                        {/* ステータスバッジ - モバイルでは右上（デスクトップでは非表示） */}
                        <div className="absolute top-3 right-3 z-10 lg:hidden">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-sm font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                              workOrder.status === "作業中" ? "bg-blue-100 text-blue-700 border-blue-300" :
                                workOrder.status === "診断中" ? "bg-blue-100 text-blue-700 border-blue-300" :
                                  workOrder.status === "外注調整中" ? "bg-purple-100 text-purple-700 border-purple-300" :
                                    workOrder.status === "外注見積待ち" ? "bg-purple-100 text-purple-700 border-purple-300" :
                                      workOrder.status === "外注作業中" ? "bg-purple-100 text-purple-700 border-purple-300" :
                                        workOrder.status === "完了" ? "bg-green-100 text-green-700 border-green-300" :
                                          "bg-slate-100 text-slate-700 border-slate-300"
                            )}
                          >
                            {workOrder.status}
                          </Badge>
                        </div>

                        {/* レスポンシブレイアウト: モバイルでは縦並び、デスクトップでは横並び */}
                        <div className="flex flex-col lg:grid lg:grid-cols-[auto_auto_auto_auto_auto_auto_200px] gap-3 lg:items-center pr-20 lg:pr-0">
                          {/* 作業名 - モバイルでは全幅、デスクトップでは固定幅 */}
                          <div className="flex items-center gap-1.5 w-full lg:w-[120px] shrink-0">
                            {getServiceKindIconForServiceKind(workOrder.serviceKind)}
                            <p className="text-base font-semibold text-slate-900 whitespace-nowrap truncate">
                              {workOrder.serviceKind}
                            </p>
                          </div>

                          {/* ステータス - デスクトップではグリッド内に表示（モバイルでは非表示） */}
                          <div className="hidden lg:flex items-center w-[100px] shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-sm font-medium px-2 py-0.5 rounded-full whitespace-nowrap justify-center",
                                workOrder.status === "作業中" ? "bg-blue-100 text-blue-700 border-blue-300" :
                                  workOrder.status === "診断中" ? "bg-blue-100 text-blue-700 border-blue-300" :
                                    workOrder.status === "外注調整中" ? "bg-purple-100 text-purple-700 border-purple-300" :
                                      workOrder.status === "外注見積待ち" ? "bg-purple-100 text-purple-700 border-purple-300" :
                                        workOrder.status === "外注作業中" ? "bg-purple-100 text-purple-700 border-purple-300" :
                                          workOrder.status === "完了" ? "bg-green-100 text-green-700 border-green-300" :
                                            "bg-slate-100 text-slate-700 border-slate-300"
                              )}
                            >
                              {workOrder.status}
                            </Badge>
                          </div>

                          {/* 開始日 - モバイルでは全幅、デスクトップでは固定幅 */}
                          <div className="flex items-center gap-1.5 w-full lg:w-[120px] shrink-0">
                            {(() => {
                              // 開始日を取得（診断開始 or 作業開始）
                              const startedAt = workOrder.diagnosis?.startedAt || workOrder.work?.startedAt;
                              if (!startedAt) {
                                return (
                                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span className="whitespace-nowrap">開始日: --</span>
                                  </div>
                                );
                              }

                              const startDate = new Date(startedAt);
                              const dateString = startDate.toLocaleDateString("ja-JP", {
                                month: "2-digit",
                                day: "2-digit",
                              });

                              return (
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                  <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                                  <span className="whitespace-nowrap">開始日: {dateString}</span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* 整備士情報（クリック可能） - モバイルでは全幅、デスクトップでは固定幅 */}
                          <div className="flex items-center w-full lg:w-[140px] shrink-0 min-w-0">
                            {(() => {
                              // 優先順位: 診断担当者 > 作業担当者 > ジョブ全体の担当整備士
                              if (workOrder.diagnosis?.mechanicName) {
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      triggerHapticFeedback("light");
                                      setIsMechanicSelectDialogOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer w-full min-w-0"
                                    title="整備士を変更"
                                  >
                                    <UserCog className="h-4 w-4 text-slate-500 shrink-0" />
                                    <span className="truncate whitespace-nowrap">{workOrder.diagnosis.mechanicName}</span>
                                  </button>
                                );
                              }
                              if (workOrder.work?.mechanicName) {
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      triggerHapticFeedback("light");
                                      setIsMechanicSelectDialogOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer w-full min-w-0"
                                    title="整備士を変更"
                                  >
                                    <UserCog className="h-4 w-4 text-slate-500 shrink-0" />
                                    <span className="truncate whitespace-nowrap">{workOrder.work.mechanicName}</span>
                                  </button>
                                );
                              }
                              if (job.assignedMechanic) {
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      triggerHapticFeedback("light");
                                      setIsMechanicSelectDialogOpen(true);
                                    }}
                                    className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors cursor-pointer w-full min-w-0"
                                    title="整備士を変更"
                                  >
                                    <UserCog className="h-4 w-4 text-slate-500 shrink-0" />
                                    <span className="truncate whitespace-nowrap">{job.assignedMechanic}</span>
                                  </button>
                                );
                              }
                              if (workOrder.vendor) {
                                return (
                                  <div className="flex items-center gap-1.5 text-sm text-slate-600 w-full min-w-0">
                                    <Package className="h-4 w-4 text-slate-500 shrink-0" />
                                    <span className="truncate whitespace-nowrap">{workOrder.vendor.name}</span>
                                  </div>
                                );
                              }
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHapticFeedback("light");
                                    setIsMechanicSelectDialogOpen(true);
                                  }}
                                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer w-full"
                                  title="整備士を割り当て"
                                >
                                  <UserCog className="h-4 w-4 text-slate-400 shrink-0" />
                                  <span className="whitespace-nowrap">未割り当て</span>
                                </button>
                              );
                            })()}
                          </div>

                          {/* 承認済み作業内容ボタン - 作業オーダーごとに表示（条件付き） */}
                          {(() => {
                            const approvedWorkItems = getApprovedWorkItemsForWorkOrder(workOrder, job);
                            const hasApprovedWorkItems = approvedWorkItems !== null && approvedWorkItems.items.length > 0;
                            const shouldShowApprovedWorkItems = hasApprovedWorkItems && (
                              workOrder.status === "見積作成待ち" ||
                              workOrder.status === "顧客承認待ち" ||
                              workOrder.status === "作業待ち" ||
                              workOrder.status === "作業中" ||
                              workOrder.status === "完了"
                            );

                            if (!shouldShowApprovedWorkItems) {
                              return <div className="w-full lg:w-[160px] shrink-0"></div>; // スペーサー
                            }

                            return (
                              <div className="w-full lg:w-[160px] shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHapticFeedback("light");
                                    setSelectedWorkOrderIdForApprovedItems(workOrder.id);
                                    setIsApprovedWorkItemsModalOpen(true);
                                  }}
                                  className="bg-green-50 text-green-900 border border-green-400 text-sm font-medium px-2.5 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-green-100 transition-colors cursor-pointer w-full justify-center"
                                  title="承認済み作業内容"
                                >
                                  <Wrench className="h-4 w-4 shrink-0 text-green-600" />
                                  <span className="whitespace-nowrap">承認済み作業内容</span>
                                </button>
                              </div>
                            );
                          })()}

                          {/* セパレーター - 承認済み作業内容ボタンとアクションボタンの間 */}
                          <div className="hidden lg:flex items-stretch shrink-0 self-stretch">
                            <div className="w-px bg-slate-200"></div>
                          </div>

                          {/* アクションボタン - モバイルでは全幅、デスクトップでは固定幅 */}
                          <div className="flex flex-col items-center w-full lg:w-[200px] shrink-0 gap-2">
                            {/* 進捗情報（アクションボタンの上に表示） */}
                            {(() => {
                              // 長期プロジェクトの場合は詳細な進捗情報を表示
                              if (longTermProgress) {
                                return (
                                  <div className="w-full space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-medium text-slate-600">作業進捗</span>
                                      <span className="text-xs font-semibold text-slate-900">
                                        {longTermProgress.progress}%
                                      </span>
                                    </div>
                                    <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={cn(
                                          "h-full rounded-full transition-all duration-300",
                                          longTermProgress.progress === 100
                                            ? "bg-green-500"
                                            : longTermProgress.progress >= 80
                                              ? "bg-blue-500"
                                              : longTermProgress.progress >= 60
                                                ? "bg-amber-500"
                                                : longTermProgress.progress >= 40
                                                  ? "bg-blue-400"
                                                  : "bg-slate-400"
                                        )}
                                        style={{ width: `${longTermProgress.progress}%` }}
                                      />
                                    </div>
                                    {longTermProgress.isDelayed && (
                                      <div className="flex items-center justify-end">
                                        <Badge variant="destructive" className="text-xs">
                                          遅延
                                        </Badge>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                                      {longTermProgress.currentPhase && (
                                        <span>現在: {longTermProgress.currentPhase}</span>
                                      )}
                                      {longTermProgress.startDate && (
                                        <span>
                                          開始: {new Date(longTermProgress.startDate).toLocaleDateString("ja-JP")}
                                        </span>
                                      )}
                                      {longTermProgress.expectedCompletionDate && (
                                        <span>
                                          予定完了: {new Date(longTermProgress.expectedCompletionDate).toLocaleDateString("ja-JP")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              // 通常の作業オーダーの場合は、ステータスベースの進捗率を表示
                              const progressMap: Record<WorkOrderStatus, number> = {
                                "未開始": 0,
                                "受入点検中": 20,
                                "診断中": 20,
                                "見積作成待ち": 40,
                                "顧客承認待ち": 60,
                                "作業待ち": 80,
                                "作業中": 80,
                                "外注調整中": 20,
                                "外注見積待ち": 40,
                                "外注作業中": 80,
                                "完了": 100,
                              };

                              const progressPercentage = progressMap[workOrder.status] || 0;

                              return (
                                <div className="w-full space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-600">作業進捗</span>
                                    <span className="text-xs font-semibold text-slate-900">
                                      {progressPercentage}%
                                    </span>
                                  </div>
                                  <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        progressPercentage === 100
                                          ? "bg-green-500"
                                          : progressPercentage >= 80
                                            ? "bg-blue-500"
                                            : progressPercentage >= 60
                                              ? "bg-amber-500"
                                              : progressPercentage >= 40
                                                ? "bg-blue-400"
                                                : "bg-slate-400"
                                      )}
                                      style={{ width: `${progressPercentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}

                            {/* アクションボタン */}
                            {(() => {
                              // 受付未完了または受付処理中の場合、アクションボタンを無効化
                              const isCheckInRequiredForAction = isCheckInRequired(job);
                              const isActionDisabled = isCheckInRequiredForAction || isCheckingIn;

                              // 車検・12ヵ月点検の場合は「受入点検を開始」、その他は「診断を開始」
                              const isInspection = workOrder.serviceKind === "車検" || workOrder.serviceKind === "12ヵ月点検";

                              const getActionConfig = () => {
                                switch (workOrder.status) {
                                  case "未開始":
                                  case "受入点検中":
                                    return {
                                      label: isInspection ? "受入点検を開始" : "診断を開始",
                                      icon: Activity,
                                      buttonBgColor: "bg-primary",
                                      buttonHoverColor: "hover:bg-primary/90",
                                    };
                                  case "診断中":
                                    return {
                                      label: isInspection ? "受入点検を続ける" : "診断を続ける",
                                      icon: Activity,
                                      buttonBgColor: "bg-primary",
                                      buttonHoverColor: "hover:bg-primary/90",
                                    };
                                  case "見積作成待ち":
                                  case "顧客承認待ち":
                                    return {
                                      label: "見積を確認",
                                      icon: FileText,
                                      buttonBgColor: "bg-orange-600",
                                      buttonHoverColor: "hover:bg-orange-700",
                                    };
                                  case "作業待ち":
                                  case "作業中":
                                    return {
                                      label: "作業を開始",
                                      icon: Wrench,
                                      buttonBgColor: "bg-emerald-600",
                                      buttonHoverColor: "hover:bg-emerald-700",
                                    };
                                  case "外注調整中":
                                  case "外注見積待ち":
                                  case "外注作業中":
                                    return {
                                      label: "外注状況を確認",
                                      icon: Package,
                                      buttonBgColor: "bg-purple-600",
                                      buttonHoverColor: "hover:bg-purple-700",
                                    };
                                  case "完了":
                                    return {
                                      label: "完了報告を確認",
                                      icon: CheckCircle2,
                                      buttonBgColor: "bg-green-600",
                                      buttonHoverColor: "hover:bg-green-700",
                                    };
                                  default:
                                    return {
                                      label: "詳細を確認",
                                      icon: Info,
                                      buttonBgColor: "bg-slate-600",
                                      buttonHoverColor: "hover:bg-slate-700",
                                    };
                                }
                              };

                              const actionConfig = getActionConfig();

                              const handleActionClick = () => {
                                if (workOrder.status === "作業待ち" || workOrder.status === "作業中") {
                                  router.push(`/mechanic/work/${job.id}?workOrder=${workOrder.id}`);
                                } else if (workOrder.status === "見積作成待ち" || workOrder.status === "顧客承認待ち") {
                                  router.push(`/admin/estimate/${job.id}?workOrder=${workOrder.id}`);
                                } else {
                                  router.push(`/mechanic/diagnosis/${job.id}?workOrder=${workOrder.id}`);
                                }
                              };

                              return (
                                <Button
                                  onClick={(e) => {
                                    if (isActionDisabled) return;
                                    e.stopPropagation();
                                    triggerHapticFeedback("light");
                                    handleActionClick();
                                  }}
                                  disabled={isActionDisabled}
                                  className={cn(
                                    "h-12 w-full lg:w-[200px] text-white text-sm font-semibold flex items-center justify-center gap-1.5 shrink-0",
                                    isActionDisabled
                                      ? "bg-slate-400 cursor-not-allowed opacity-50"
                                      : cn(actionConfig.buttonBgColor, actionConfig.buttonHoverColor)
                                  )}
                                  title={isActionDisabled ? (isCheckInRequiredForAction ? "受付完了後に操作できます" : "受付処理中です") : actionConfig.label}
                                  aria-label={isActionDisabled ? (isCheckInRequiredForAction ? "受付完了後に操作できます" : "受付処理中です") : actionConfig.label}
                                >
                                  {isCheckingIn ? (
                                    <>
                                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                                      受付処理中...
                                    </>
                                  ) : (
                                    <>
                                      <actionConfig.icon className="h-4.5 w-4.5" />
                                      {actionConfig.label}
                                      <ChevronRight className="h-4 w-4" />
                                    </>
                                  )}
                                </Button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 作業を追加ボタン */}
                  <div className="pt-2 mt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHapticFeedback("light");
                        setIsAddWorkOrderDialogOpen(true);
                      }}
                      className="flex items-center gap-1.5 text-base text-slate-500 hover:text-slate-700 bg-none border-none cursor-pointer px-2.5 py-1 rounded-md transition-all hover:bg-slate-100"
                      title="作業を追加"
                    >
                      <Plus className="h-5 w-5 shrink-0 text-slate-500" />
                      <span className="whitespace-nowrap">作業を追加</span>
                    </button>
                  </div>

                  {/* 顧客向けリンク（作業一覧の下部） */}
                  <div className="space-y-2 pt-3 mt-3 border-t border-slate-200">
                    <div className="flex items-center gap-3 text-base text-slate-500">
                      <span className="text-slate-400">顧客向け:</span>
                      <a
                        href={`/customer/pre-checkin/${job.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline inline-flex items-center gap-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback("light");
                        }}
                      >
                        事前問診
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <a
                        href="#"
                        onClick={handleEstimateApprovalClick}
                        className={cn(
                          "hover:text-blue-600 hover:underline inline-flex items-center gap-1 transition-colors",
                          isGeneratingMagicLink && "opacity-50 cursor-wait"
                        )}
                      >
                        {isGeneratingMagicLink ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            見積承認
                            <ExternalLink className="h-4 w-4" />
                          </>
                        )}
                      </a>
                    </div>

                    {/* 整備士向けリンク */}
                    <div className="flex items-center gap-3 text-base text-slate-500">
                      <span className="text-slate-400">整備士向け:</span>
                      <a
                        href={`/mechanic/diagnosis/${job.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline inline-flex items-center gap-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback("light");
                        }}
                      >
                        診断ページ
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <a
                        href={`/mechanic/work/${job.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline inline-flex items-center gap-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback("light");
                        }}
                      >
                        作業ページ
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <a
                        href={`/mechanic/tasks/${job.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 hover:underline inline-flex items-center gap-1 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHapticFeedback("light");
                        }}
                      >
                        作業選択ページ
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>

                    {/* デバッグ: タグ用QRコード（整備士向け - 印刷用） */}
                    {job.tagId && (
                      <div className="pt-4 mt-4 border-t border-slate-300">
                        <div className="text-base font-semibold text-slate-700 mb-3">
                          デバッグ: タグ用QRコード（印刷用）
                        </div>
                        <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 max-w-xs mx-auto">
                          <div className="text-base font-medium text-slate-700">タグID: {job.tagId}</div>
                          <QRCodeSVG
                            value={job.tagId}
                            size={200}
                            level="M"
                            includeMargin={true}
                          />
                          <div className="text-sm text-slate-500 text-center">
                            このQRコードをタグ（キーホルダー）に印刷して貼り付けてください
                          </div>
                          <div className="text-xs text-slate-400 text-center mt-2 space-y-1">
                            <div>• タグIDは固定（例: {job.tagId}）で、入庫から出庫まで同じタグを使用</div>
                            <div>• QRコードをスキャンすると、現在の案件の適切な画面に遷移します</div>
                            <div>• タグは再利用可能（別のお客様に割り振り可能）</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* お客様入力情報モーダル */}
      <Dialog open={isPreInputModalOpen} onOpenChange={setIsPreInputModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold text-blue-700">
              <MessageSquare className="h-5 w-5" strokeWidth={2.5} />
              お客様入力情報
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            {job.field7 ? (
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                {job.field7}
              </p>
            ) : (
              <p className="text-base text-slate-700">お客様入力情報がありません</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsPreInputModalOpen(false)}
              className="h-12 text-base font-medium"
            >
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 承認済み作業内容モーダル（作業オーダーごと） */}
      <Dialog open={isApprovedWorkItemsModalOpen} onOpenChange={setIsApprovedWorkItemsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold text-green-700">
              <Wrench className="h-5 w-5" strokeWidth={2.5} />
              承認済み作業内容
              {selectedWorkOrderIdForApprovedItems && workOrders.find(wo => wo.id === selectedWorkOrderIdForApprovedItems) && (
                <span className="text-sm font-normal text-slate-600 ml-2">
                  ({workOrders.find(wo => wo.id === selectedWorkOrderIdForApprovedItems)?.serviceKind})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            {(() => {
              if (!selectedWorkOrderIdForApprovedItems) {
                return <p className="text-base text-slate-700">作業オーダーが選択されていません</p>;
              }

              const selectedWorkOrder = workOrders.find(wo => wo.id === selectedWorkOrderIdForApprovedItems);
              if (!selectedWorkOrder) {
                return <p className="text-base text-slate-700">作業オーダーが見つかりません</p>;
              }

              const approvedWorkItems = getApprovedWorkItemsForWorkOrder(selectedWorkOrder, job);

              if (!approvedWorkItems || approvedWorkItems.items.length === 0) {
                return <p className="text-base text-slate-700">承認済み作業内容がありません</p>;
              }

              const totalPrice = approvedWorkItems.items.reduce((sum, item) => sum + item.price, 0);

              return (
                <div className="space-y-3">
                  {approvedWorkItems.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-base py-3 border-b border-slate-100 last:border-b-0">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        ¥{item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-base font-semibold pt-3 border-t border-slate-200 mt-3">
                    <span className="text-slate-900">合計</span>
                    <span className="text-slate-900 tabular-nums">¥{totalPrice.toLocaleString()}</span>
                  </div>
                  {approvedWorkItems.source === "legacy" && (
                    <p className="text-xs text-slate-500 mt-2">
                      ※ 旧形式のデータから取得しています
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* 受付メモモーダル */}
      <Dialog open={isWorkOrderMemoModalOpen} onOpenChange={setIsWorkOrderMemoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold text-amber-700">
              <NotebookPen className="h-5 w-5" strokeWidth={2.5} />
              受付メモ
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            {job.field ? (() => {
              const parseWorkOrder = (text: string | null): { author: string; content: string } => {
                if (!text) return { author: "", content: "" };
                const match = text.match(/^\[(.+?)\]\s*([\s\S]*)$/);
                if (match) {
                  return { author: match[1], content: match[2] };
                }
                return { author: "", content: text };
              };
              const parsed = parseWorkOrder(job.field);
              return (
                <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {parsed.content}
                </p>
              );
            })() : (
              <p className="text-base text-slate-700">受付メモがありません</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsWorkOrderMemoModalOpen(false)}
              className="h-12 text-base font-medium"
            >
              閉じる
            </Button>
            <Button
              onClick={() => {
                setIsWorkOrderMemoModalOpen(false);
                handleOpenWorkOrderDialog();
              }}
              className="h-12 text-base font-medium bg-amber-700 hover:bg-amber-900 text-white"
            >
              編集する
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 作業メモモーダル */}
      <Dialog open={isWorkMemoModalOpen} onOpenChange={setIsWorkMemoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold text-purple-700">
              <Notebook className="h-5 w-5" strokeWidth={2.5} />
              作業メモ
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            {jobMemos.length > 0 ? (
              <div className="space-y-4">
                {jobMemos.map((memo) => (
                  <div key={memo.id} className="border-b border-slate-200 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 text-base text-slate-700 mb-2">
                      <span className="font-medium">{memo.author}</span>
                      <span>•</span>
                      <span>
                        {new Date(memo.createdAt).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Tokyo",
                        })}
                      </span>
                    </div>
                    <p className="text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {memo.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-slate-700">作業メモがありません</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsWorkMemoModalOpen(false)}
              className="h-12 text-base font-medium"
            >
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 既存のダイアログ（WorkOrderDialog、VehicleDetailDialog、CustomerDetailDialog、TagChangeDialog） */}
      <WorkOrderDialog
        open={isWorkOrderDialogOpen}
        onOpenChange={setIsWorkOrderDialogOpen}
        job={job}
        onSuccess={handleWorkOrderSuccess}
      />

      {/* 作業追加ダイアログ */}
      <AddWorkOrderDialog
        open={isAddWorkOrderDialogOpen}
        onOpenChange={setIsAddWorkOrderDialogOpen}
        job={job}
        existingServiceKinds={workOrders?.map(wo => wo.serviceKind) || []}
        onSuccess={async (newWorkOrder) => {
          console.log("[JobCard] 作業追加成功、オプティミスティック更新を実行:", newWorkOrder);

          if (!newWorkOrder) {
            console.warn("[JobCard] newWorkOrderがundefinedです");
            // フォールバック: 通常の再検証を実行
            await mutateWorkOrders(undefined, { revalidate: true });
            await mutate("today-jobs", undefined, { revalidate: true });
            return;
          }

          // オプティミスティック更新: 即座にUIを更新
          // workOrdersを即座に更新
          const currentData = await mutateWorkOrders(
            (current) => {
              if (!current || !current.success) {
                // 現在のデータがない場合、新しいworkOrderのみを含む配列を返す
                return { success: true, data: [newWorkOrder] };
              }
              // 既存のworkOrdersに新しいworkOrderを追加（重複チェック）
              const existingIds = new Set((current.data || []).map(wo => wo.id));
              if (existingIds.has(newWorkOrder.id)) {
                // 既に存在する場合は更新しない
                return current;
              }
              return {
                success: true,
                data: [...(current.data || []), newWorkOrder],
              };
            },
            {
              optimisticData: (current) => {
                if (!current || !current.success) {
                  return { success: true, data: [newWorkOrder] };
                }
                const existingIds = new Set((current.data || []).map(wo => wo.id));
                if (existingIds.has(newWorkOrder.id)) {
                  return current;
                }
                return {
                  success: true,
                  data: [...(current.data || []), newWorkOrder],
                };
              },
              populateCache: true,
              revalidate: true, // バックグラウンドで再検証
            }
          );

          console.log("[JobCard] workOrdersオプティミスティック更新完了:", currentData);

          // jobオブジェクトのfield_service_kindsも更新
          const updatedServiceKinds = Array.from(
            new Set([
              ...(job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : [])),
              newWorkOrder.serviceKind,
            ])
          );

          // jobオブジェクトを更新（オプティミスティック更新）
          await mutate(`job-${job.id}`, {
            ...job,
            field_service_kinds: updatedServiceKinds,
          }, {
            revalidate: true,
          });

          // バックグラウンドでworkOrdersのみを再検証（ページ再読み込みなし）
          // 注意: mutate("today-jobs")やmutate("all-jobs")は呼ばない（ページ全体の再レンダリングを防ぐため）
          // オプティミスティック更新で既にUIは更新されているため、バックグラウンドでサーバー側のデータと同期するだけ
          setTimeout(() => {
            mutateWorkOrders(undefined, { revalidate: true });
          }, 500);

          console.log("[JobCard] オプティミスティック更新完了");
        }}
      />

      {/* 車両詳細ダイアログ */}
      <VehicleDetailDialog
        open={isVehicleDetailDialogOpen}
        onOpenChange={setIsVehicleDetailDialogOpen}
        vehicleId={vehicleId || null}
        vehicleName={vehicleInfo}
        courtesyCars={safeCourtesyCars}
        reportedMileage={job.field10 || null}
      />

      {/* 顧客詳細ダイアログ */}
      <CustomerDetailDialog
        open={isCustomerDetailDialogOpen}
        onOpenChange={setIsCustomerDetailDialogOpen}
        customerId={customerId || null}
        customerName={customerName}
      />


      {/* 整備士選択ダイアログ */}
      <MechanicSelectDialog
        open={isMechanicSelectDialogOpen}
        onOpenChange={setIsMechanicSelectDialogOpen}
        isLoading={false}
        isProcessing={isAssigningMechanic}
        onSelect={async (mechanicName) => {
          setIsAssigningMechanic(true);
          try {
            const result = await assignMechanic(job.id, mechanicName);
            if (result.success) {
              toast.success("整備士を変更しました");
              // データを再取得
              mutate(`job-${job.id}`);
              mutate("today-jobs");
              mutate("all-jobs");
              setIsMechanicSelectDialogOpen(false);
            } else {
              toast.error("整備士の変更に失敗しました", {
                description: result.error?.message,
              });
            }
          } catch (error) {
            console.error("整備士変更エラー:", error);
            toast.error("エラーが発生しました");
          } finally {
            setIsAssigningMechanic(false);
          }
        }}
      />

      {/* 代車変更ダイアログ */}
      {/* 変更申請詳細モーダル */}
      <ChangeRequestDetailDialog
        open={isChangeRequestDetailOpen}
        onOpenChange={setIsChangeRequestDetailOpen}
        customerId={customerId}
        customerName={customerName}
        smartCarDealerCustomerId={customerData?.ID1 || customerId}
      />

      <CourtesyCarSelectDialog
        open={isCourtesyCarChangeDialogOpen}
        onOpenChange={setIsCourtesyCarChangeDialogOpen}
        cars={allCourtesyCars}
        isLoading={isCourtesyCarsLoading}
        isProcessing={isChangingCourtesyCar}
        onSelect={handleCourtesyCarChange}
        onSkip={handleSkipCourtesyCar}
      />

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

      {/* 長期プロジェクト進捗詳細ダイアログ */}
      {isSingleLongTermProject && (
        <LongTermProjectDetailDialog
          open={isLongTermProjectDetailDialogOpen}
          onOpenChange={setIsLongTermProjectDetailDialogOpen}
          job={job}
        />
      )}

      {/* 写真ギャラリーダイアログ */}
      <JobPhotoGalleryDialog
        open={isPhotoGalleryOpen}
        onOpenChange={setIsPhotoGalleryOpen}
        jobId={job.id}
        workOrders={workOrders}
        customerName={customerName}
        vehicleName={vehicleName}
      />

      {/* タグ変更ダイアログ */}
      <Dialog open={isTagChangeDialogOpen} onOpenChange={setIsTagChangeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 shrink-0" />
              タグ変更: {job.field4?.name ?? "---"} 様
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
            >
              キャンセル
            </Button>
            <Button
              onClick={handleTagUpdate}
              disabled={isUpdatingTag || !selectedNewTagId || selectedNewTagId === job.tagId}
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
    </>
  );
})

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

JobCard.displayName = "JobCard";
