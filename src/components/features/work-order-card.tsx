"use client";

/**
 * 作業カードコンポーネント（ジョブカード内で使用）
 * 
 * 各作業の情報を表示し、「診断を開始」ボタンを提供
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  User,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkOrder, WorkOrderStatus, ServiceKind } from "@/types";
import { useRouter } from "next/navigation";

// =============================================================================
// Constants
// =============================================================================

/**
 * 入庫区分ごとのアイコンと色
 */
const SERVICE_KIND_CONFIG: Record<ServiceKind, { icon: React.ReactNode; color: string }> = {
  "車検": { icon: <Wrench className="h-5 w-5" />, color: "bg-blue-600" },
  "修理・整備": { icon: <Wrench className="h-5 w-5" />, color: "bg-amber-600" },
  "レストア": { icon: <Wrench className="h-5 w-5" />, color: "bg-purple-600" },
  "チューニング": { icon: <Wrench className="h-5 w-5" />, color: "bg-red-600" },
  "板金・塗装": { icon: <Wrench className="h-5 w-5" />, color: "bg-orange-600" },
  "パーツ取付": { icon: <Wrench className="h-5 w-5" />, color: "bg-teal-600" },
  "コーティング": { icon: <Wrench className="h-5 w-5" />, color: "bg-cyan-600" },
  "その他のメンテナンス": { icon: <Wrench className="h-5 w-5" />, color: "bg-slate-600" },
  "その他": { icon: <Wrench className="h-5 w-5" />, color: "bg-slate-600" },
  "12ヵ月点検": { icon: <Wrench className="h-5 w-5" />, color: "bg-green-600" },
  "エンジンオイル交換": { icon: <Wrench className="h-5 w-5" />, color: "bg-yellow-600" },
  "タイヤ交換・ローテーション": { icon: <Wrench className="h-5 w-5" />, color: "bg-indigo-600" },
  "故障診断": { icon: <AlertCircle className="h-5 w-5" />, color: "bg-rose-600" },
};

/**
 * ステータスの表示設定
 */
const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  "未開始": { label: "未開始", color: "bg-slate-100 text-slate-700", icon: <Clock className="h-4 w-4" /> },
  "受入点検中": { label: "受入点検中", color: "bg-blue-100 text-blue-700", icon: <Wrench className="h-4 w-4" /> },
  "診断中": { label: "診断中", color: "bg-blue-100 text-blue-700", icon: <Wrench className="h-4 w-4" /> },
  "見積作成待ち": { label: "見積作成待ち", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-4 w-4" /> },
  "顧客承認待ち": { label: "お客様承認待ち", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-4 w-4" /> },
  "作業待ち": { label: "作業待ち", color: "bg-slate-100 text-slate-700", icon: <Clock className="h-4 w-4" /> },
  "作業中": { label: "作業中", color: "bg-blue-100 text-blue-700", icon: <Wrench className="h-4 w-4" /> },
  "外注調整中": { label: "外注先調整中", color: "bg-purple-100 text-purple-700", icon: <Truck className="h-4 w-4" /> },
  "外注見積待ち": { label: "外注見積待ち", color: "bg-purple-100 text-purple-700", icon: <Clock className="h-4 w-4" /> },
  "外注作業中": { label: "外注作業中", color: "bg-purple-100 text-purple-700", icon: <Truck className="h-4 w-4" /> },
  "完了": { label: "完了", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-4 w-4" /> },
};

// =============================================================================
// Types
// =============================================================================

interface WorkOrderCardProps {
  /** ワークオーダー */
  workOrder: WorkOrder;
  /** ジョブID */
  jobId: string;
  /** ステータスに応じたアクションボタンのラベル */
  actionLabel?: string;
  /** クリック時のハンドラ（指定しない場合は診断画面に遷移） */
  onActionClick?: (workOrderId: string) => void;
  /** コンパクト表示 */
  compact?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function WorkOrderCard({
  workOrder,
  jobId,
  actionLabel,
  onActionClick,
  compact = false,
}: WorkOrderCardProps) {
  const router = useRouter();

  const serviceConfig = SERVICE_KIND_CONFIG[workOrder.serviceKind] || {
    icon: <Wrench className="h-5 w-5" />,
    color: "bg-slate-600",
  };
  const statusConfig = STATUS_CONFIG[workOrder.status] || STATUS_CONFIG["未開始"];

  // アクションボタンのラベルを決定
  const getActionLabel = () => {
    if (actionLabel) return actionLabel;
    
    // ステータスに応じたラベル
    switch (workOrder.status) {
      case "未開始":
      case "受入点検中":
      case "診断中":
        return "診断を開始";
      case "見積作成待ち":
      case "顧客承認待ち":
        return "見積を確認";
      case "作業待ち":
      case "作業中":
        return "作業を開始";
      case "外注調整中":
      case "外注見積待ち":
      case "外注作業中":
        return "外注状況を確認";
      case "完了":
        return "完了報告を確認";
      default:
        return "詳細を確認";
    }
  };

  // アクションボタンのクリックハンドラ
  const handleActionClick = () => {
    if (onActionClick) {
      onActionClick(workOrder.id);
    } else {
      // ステータスに応じた遷移先を決定
      if (workOrder.status === "作業待ち" || workOrder.status === "作業中") {
        router.push(`/mechanic/work/${jobId}?workOrder=${workOrder.id}`);
      } else if (workOrder.status === "見積作成待ち" || workOrder.status === "顧客承認待ち") {
        // 見積関連の場合は見積画面に遷移（将来実装）
        router.push(`/admin/estimate/${jobId}?workOrder=${workOrder.id}`);
      } else {
        // 診断画面に遷移
        router.push(`/mechanic/diagnosis/${jobId}?workOrder=${workOrder.id}`);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700",
        "border-slate-200 dark:border-slate-700",
        compact ? "p-2" : "p-3"
      )}
    >
      {/* アイコン */}
      <div
        className={cn(
          "flex items-center justify-center rounded-lg text-white shrink-0",
          serviceConfig.color,
          compact ? "w-10 h-10" : "w-12 h-12"
        )}
      >
        {serviceConfig.icon}
      </div>

      {/* コンテンツ */}
      <div className="flex-1 text-left min-w-0">
        <p className={cn(
          "font-medium text-slate-900 dark:text-white truncate",
          compact ? "text-base" : "text-lg"
        )}>
          {workOrder.serviceKind}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="secondary"
            className={cn("text-sm font-medium", statusConfig.color)}
          >
            <span className="mr-1">{statusConfig.icon}</span>
            {statusConfig.label}
          </Badge>
          {workOrder.diagnosis?.mechanicName && (
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
              <User className="h-3 w-3" />
              <span>{workOrder.diagnosis.mechanicName}</span>
            </div>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <Button
        onClick={handleActionClick}
        className={cn(
          "h-10 text-base font-medium gap-2",
          compact ? "h-8 text-sm" : "h-10 text-base"
        )}
        variant="default"
      >
        {getActionLabel()}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

