"use client";

/**
 * 作業グループ一覧コンポーネント
 * 
 * 複合業務（車検+板金など）の各作業グループを表示し、
 * それぞれの進捗状況を管理する
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Wrench,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkOrder, WorkOrderStatus, ServiceKind } from "@/types";

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

/**
 * 追加可能な入庫区分リスト
 */
const AVAILABLE_SERVICE_KINDS: ServiceKind[] = [
  "車検",
  "12ヵ月点検",
  "修理・整備",
  "板金・塗装",
  "コーティング",
  "エンジンオイル交換",
  "タイヤ交換・ローテーション",
  "パーツ取付",
  "チューニング",
  "その他のメンテナンス",
  "故障診断",
  "レストア",
];

// =============================================================================
// Types
// =============================================================================

interface WorkOrderListProps {
  /** ワークオーダー一覧 */
  workOrders: WorkOrder[];
  /** 選択中のワークオーダーID */
  selectedWorkOrderId?: string | null;
  /** ワークオーダー選択時のハンドラ */
  onSelectWorkOrder?: (workOrderId: string) => void;
  /** ワークオーダー追加時のハンドラ */
  onAddWorkOrder?: (serviceKind: ServiceKind) => Promise<void>;
  /** 読み取り専用モード */
  readOnly?: boolean;
  /** コンパクト表示 */
  compact?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 全体ステータスを計算
 * 最も遅れている作業グループのステータスを返す
 */
export function calculateOverallStatus(workOrders: WorkOrder[]): {
  allCompleted: boolean;
  overallStatus: WorkOrderStatus;
  completedCount: number;
  totalCount: number;
} {
  if (workOrders.length === 0) {
    return {
      allCompleted: false,
      overallStatus: "未開始",
      completedCount: 0,
      totalCount: 0,
    };
  }

  const completedCount = workOrders.filter((wo) => wo.status === "完了").length;
  const allCompleted = completedCount === workOrders.length;

  // ステータスの優先順位（低い = 遅れている）
  const statusPriority: Record<WorkOrderStatus, number> = {
    "未開始": 0,
    "受入点検中": 1,
    "診断中": 2,
    "見積作成待ち": 3,
    "顧客承認待ち": 4,
    "作業待ち": 5,
    "外注調整中": 3, // 外注は内製と同じレベルで扱う
    "外注見積待ち": 4,
    "作業中": 6,
    "外注作業中": 6,
    "完了": 7,
  };

  // 最も遅れている（優先度が低い）ステータスを取得
  const overallStatus = workOrders.reduce((minStatus, wo) => {
    return statusPriority[wo.status] < statusPriority[minStatus]
      ? wo.status
      : minStatus;
  }, workOrders[0].status);

  return {
    allCompleted,
    overallStatus,
    completedCount,
    totalCount: workOrders.length,
  };
}

/**
 * 納車可能かどうかを判定
 */
export function canCheckout(workOrders: WorkOrder[]): boolean {
  if (workOrders.length === 0) return false;
  return workOrders.every((wo) => wo.status === "完了");
}

// =============================================================================
// Component
// =============================================================================

export function WorkOrderList({
  workOrders,
  selectedWorkOrderId,
  onSelectWorkOrder,
  onAddWorkOrder,
  readOnly = false,
  compact = false,
}: WorkOrderListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedServiceKind, setSelectedServiceKind] = useState<ServiceKind | "">("");
  const [isAdding, setIsAdding] = useState(false);

  // 全体ステータスを計算
  const { allCompleted, completedCount, totalCount } = calculateOverallStatus(workOrders);

  // 既に存在する入庫区分を除外
  const existingServiceKinds = workOrders.map((wo) => wo.serviceKind);
  const availableServiceKinds = AVAILABLE_SERVICE_KINDS.filter(
    (kind) => !existingServiceKinds.includes(kind)
  );

  // 作業グループ追加ハンドラ
  const handleAddWorkOrder = async () => {
    if (!selectedServiceKind || !onAddWorkOrder) return;

    setIsAdding(true);
    try {
      await onAddWorkOrder(selectedServiceKind);
      setIsAddDialogOpen(false);
      setSelectedServiceKind("");
    } finally {
      setIsAdding(false);
    }
  };

  // ワークオーダーがない場合
  if (workOrders.length === 0 && !onAddWorkOrder) {
    return null;
  }

  return (
    <Card className="border-slate-200 shadow-md dark:border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
            <Wrench className="h-6 w-6 text-slate-600 shrink-0 dark:text-white" strokeWidth={2.5} />
            作業グループ
            {totalCount > 0 && (
              <Badge
                variant="secondary"
                className={cn(
                  "ml-2 text-base",
                  allCompleted
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-700"
                )}
              >
                {completedCount}/{totalCount} 完了
              </Badge>
            )}
          </CardTitle>
          {!readOnly && onAddWorkOrder && availableServiceKinds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="h-10 text-base gap-1"
            >
              <Plus className="h-4 w-4" />
              追加
            </Button>
          )}
        </div>
        {allCompleted && totalCount > 0 && (
          <p className="text-base text-green-600 flex items-center gap-1 mt-1">
            <CheckCircle2 className="h-4 w-4" />
            すべての作業が完了しました。納車可能です。
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {workOrders.map((workOrder) => {
          const serviceConfig = SERVICE_KIND_CONFIG[workOrder.serviceKind] || {
            icon: <Wrench className="h-5 w-5" />,
            color: "bg-slate-600",
          };
          const statusConfig = STATUS_CONFIG[workOrder.status] || STATUS_CONFIG["未開始"];
          const isSelected = selectedWorkOrderId === workOrder.id;

          return (
            <button
              key={workOrder.id}
              type="button"
              onClick={() => onSelectWorkOrder?.(workOrder.id)}
              disabled={!onSelectWorkOrder}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                "hover:bg-slate-50 dark:hover:bg-slate-800",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-slate-200 dark:border-slate-700",
                onSelectWorkOrder ? "cursor-pointer" : "cursor-default",
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
                {!compact && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={cn("text-sm font-medium", statusConfig.color)}
                    >
                      <span className="mr-1">{statusConfig.icon}</span>
                      {statusConfig.label}
                    </Badge>
                  </div>
                )}
              </div>

              {/* ステータス（コンパクト時） */}
              {compact && (
                <Badge
                  variant="secondary"
                  className={cn("text-sm font-medium shrink-0", statusConfig.color)}
                >
                  {statusConfig.label}
                </Badge>
              )}

              {/* 矢印 */}
              {onSelectWorkOrder && (
                <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
              )}
            </button>
          );
        })}

        {/* ワークオーダーがない場合のプレースホルダー */}
        {workOrders.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <p className="text-base">作業グループがありません</p>
            {!readOnly && onAddWorkOrder && (
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(true)}
                className="mt-4 h-12 text-base gap-2"
              >
                <Plus className="h-5 w-5" />
                作業グループを追加
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* 作業グループ追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">作業グループを追加</DialogTitle>
            <DialogDescription className="text-base">
              追加する作業の種類を選択してください
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              value={selectedServiceKind}
              onValueChange={(value) => setSelectedServiceKind(value as ServiceKind)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="作業の種類を選択" />
              </SelectTrigger>
              <SelectContent>
                {availableServiceKinds.map((kind) => (
                  <SelectItem key={kind} value={kind} className="text-base py-3">
                    {kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="h-12 text-base"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddWorkOrder}
              disabled={!selectedServiceKind || isAdding}
              className="h-12 text-base"
            >
              {isAdding ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default WorkOrderList;

