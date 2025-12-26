"use client";

import { WorkOrder, ServiceKind } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface WorkOrderSelectorProps {
  /** ワークオーダーリスト */
  workOrders: WorkOrder[];
  /** 選択中のワークオーダーID */
  selectedWorkOrderId: string | null;
  /** 選択変更ハンドラ */
  onSelect: (workOrderId: string | null) => void;
  /** 作業追加ボタンのクリックハンドラ */
  onAddWorkOrder?: () => void;
  /** 作業追加ボタンを表示するか */
  showAddButton?: boolean;
}

// =============================================================================
// ステータスバッジの色
// =============================================================================

function getStatusBadgeVariant(status: WorkOrder["status"]): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "未開始":
      return "outline";
    case "診断中":
      return "default";
    case "見積作成待ち":
      return "secondary";
    case "顧客承認待ち":
      return "secondary";
    case "作業待ち":
      return "default";
    case "作業中":
      return "default";
    case "完了":
      return "secondary";
    default:
      return "outline";
  }
}

// =============================================================================
// Component
// =============================================================================

export function WorkOrderSelector({
  workOrders,
  selectedWorkOrderId,
  onSelect,
  onAddWorkOrder,
  showAddButton = true,
}: WorkOrderSelectorProps) {
  // ワークオーダーがない場合
  if (workOrders.length === 0) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-slate-50">
        <p className="text-base text-slate-700">作業が登録されていません</p>
        {showAddButton && onAddWorkOrder && (
          <Button
            variant="outline"
            onClick={onAddWorkOrder}
            className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            作業を追加
          </Button>
        )}
      </div>
    );
  }

  // タブ形式で表示
  return (
    <div className="space-y-2">
      <Tabs
        value={selectedWorkOrderId || undefined}
        onValueChange={(value) => onSelect(value || null)}
        className="w-full"
      >
        <div className="flex items-center justify-between gap-4 mb-2">
          <TabsList className="flex-wrap h-auto p-1 bg-slate-100">
            {workOrders.map((workOrder) => (
              <TabsTrigger
                key={workOrder.id}
                value={workOrder.id}
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <span className="mr-2">{workOrder.serviceKind}</span>
                <Badge
                  variant={getStatusBadgeVariant(workOrder.status)}
                  className="ml-1"
                >
                  {workOrder.status}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {showAddButton && onAddWorkOrder && (
            <Button
              variant="outline"
              onClick={onAddWorkOrder}
              className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              作業を追加
            </Button>
          )}
        </div>
      </Tabs>

      {/* 選択中のワークオーダー情報（オプション） */}
      {selectedWorkOrderId && (
        <div className="p-3 bg-slate-50 rounded-lg border">
          {(() => {
            const selectedWorkOrder = workOrders.find(
              (wo) => wo.id === selectedWorkOrderId
            );
            if (!selectedWorkOrder) return null;

            return (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium">{selectedWorkOrder.serviceKind}</p>
                  <p className="text-base text-slate-700 mt-1">
                    ステータス: {selectedWorkOrder.status}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedWorkOrder.status)}>
                  {selectedWorkOrder.status}
                </Badge>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
























