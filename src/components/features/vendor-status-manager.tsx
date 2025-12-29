"use client";

import { useState } from "react";
import { WorkOrder, WorkOrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Phone, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface VendorStatusManagerProps {
  /** ワークオーダー */
  workOrder: WorkOrder;
  /** ステータス更新ハンドラ */
  onStatusUpdate: (workOrderId: string, status: WorkOrderStatus, vendor?: WorkOrder["vendor"]) => Promise<void>;
  /** 読み取り専用モード */
  readOnly?: boolean;
}

// =============================================================================
// ステータスバッジの色
// =============================================================================

function getStatusBadgeVariant(status: WorkOrderStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "外注調整中":
      return "outline";
    case "外注見積待ち":
      return "secondary";
    case "外注作業中":
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

export function VendorStatusManager({
  workOrder,
  onStatusUpdate,
  readOnly = false,
}: VendorStatusManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [vendorName, setVendorName] = useState(workOrder.vendor?.name || "");
  const [vendorContact, setVendorContact] = useState(workOrder.vendor?.contact || "");
  const [vendorNotes, setVendorNotes] = useState(workOrder.vendor?.notes || "");

  // 外注関連のステータスかどうか
  const isVendorStatus = workOrder.status === "外注調整中" || 
                         workOrder.status === "外注見積待ち" || 
                         workOrder.status === "外注作業中";

  // 外注作業でない場合は表示しない
  if (!isVendorStatus && !workOrder.vendor) {
    return null;
  }

  /**
   * ステータス更新
   */
  const handleStatusUpdate = async (newStatus: WorkOrderStatus) => {
    if (readOnly) return;

    setIsUpdating(true);
    try {
      const vendor = workOrder.vendor || (vendorName ? {
        name: vendorName,
        contact: vendorContact || undefined,
        notes: vendorNotes || undefined,
      } : undefined);

      await onStatusUpdate(workOrder.id, newStatus, vendor);
      setIsDialogOpen(false);
      toast.success("ステータスを更新しました");
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("ステータスの更新に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 外注先情報を更新
   */
  const handleVendorInfoUpdate = async () => {
    if (readOnly || !vendorName.trim()) {
      toast.error("外注先名を入力してください");
      return;
    }

    setIsUpdating(true);
    try {
      const vendor = {
        name: vendorName.trim(),
        contact: vendorContact.trim() || undefined,
        notes: vendorNotes.trim() || undefined,
        estimateReceivedAt: workOrder.vendor?.estimateReceivedAt || undefined,
        workCompletedAt: workOrder.vendor?.workCompletedAt || undefined,
      };

      await onStatusUpdate(workOrder.id, workOrder.status, vendor);
      setIsDialogOpen(false);
      toast.success("外注先情報を更新しました");
    } catch (error) {
      console.error("Vendor info update error:", error);
      toast.error("外注先情報の更新に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 外注先からの見積受領を記録
   */
  const handleEstimateReceived = async () => {
    if (readOnly) return;

    setIsUpdating(true);
    try {
      const vendor = {
        name: workOrder.vendor?.name || vendorName || "外注先",
        contact: workOrder.vendor?.contact || vendorContact || undefined,
        notes: workOrder.vendor?.notes || vendorNotes || undefined,
        estimateReceivedAt: new Date().toISOString(),
        workCompletedAt: workOrder.vendor?.workCompletedAt || undefined,
      };

      await onStatusUpdate(workOrder.id, "外注見積待ち", vendor);
      toast.success("外注先からの見積を受領しました");
    } catch (error) {
      console.error("Estimate received error:", error);
      toast.error("見積受領の記録に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 外注先からの作業完了報告を記録
   */
  const handleWorkCompleted = async () => {
    if (readOnly) return;

    setIsUpdating(true);
    try {
      const vendor = {
        name: workOrder.vendor?.name || vendorName || "外注先",
        contact: workOrder.vendor?.contact || vendorContact || undefined,
        notes: workOrder.vendor?.notes || vendorNotes || undefined,
        estimateReceivedAt: workOrder.vendor?.estimateReceivedAt || undefined,
        workCompletedAt: new Date().toISOString(),
      };

      await onStatusUpdate(workOrder.id, "完了", vendor);
      toast.success("外注先からの作業完了報告を受領しました");
    } catch (error) {
      console.error("Work completed error:", error);
      toast.error("作業完了報告の記録に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border border-slate-300 rounded-xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
          <span className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-700 shrink-0" />
            外注先管理
          </span>
          <Badge
            variant={getStatusBadgeVariant(workOrder.status)}
            className="text-base font-medium px-2.5 py-1 rounded-full"
          >
            {workOrder.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 外注先情報 */}
        {workOrder.vendor && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-600 shrink-0" />
              <span className="text-base font-medium text-slate-900">{workOrder.vendor.name}</span>
            </div>
            {workOrder.vendor.contact && (
              <div className="flex items-center gap-2 text-base text-slate-700">
                <Phone className="h-4 w-4 text-slate-600 shrink-0" />
                <span>{workOrder.vendor.contact}</span>
              </div>
            )}
            {workOrder.vendor.estimateReceivedAt && (
              <div className="flex items-center gap-2 text-base text-slate-700">
                <Calendar className="h-4 w-4 text-slate-600 shrink-0" />
                <span>見積受領: {new Date(workOrder.vendor.estimateReceivedAt).toLocaleString("ja-JP")}</span>
              </div>
            )}
            {workOrder.vendor.workCompletedAt && (
              <div className="flex items-center gap-2 text-base text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-slate-600 shrink-0" />
                <span>作業完了報告: {new Date(workOrder.vendor.workCompletedAt).toLocaleString("ja-JP")}</span>
              </div>
            )}
            {workOrder.vendor.notes && (
              <div className="text-base text-slate-700 mt-2 p-2 bg-slate-50 rounded-md">
                <p className="whitespace-pre-wrap">{workOrder.vendor.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* アクションボタン */}
        {!readOnly && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="w-full h-12 text-base"
            >
              外注先情報を{workOrder.vendor ? "編集" : "登録"}
            </Button>

            {workOrder.status === "外注調整中" && (
              <Button
                onClick={handleEstimateReceived}
                disabled={isUpdating || !workOrder.vendor?.name}
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    外注先からの見積を受領
                  </>
                )}
              </Button>
            )}

            {workOrder.status === "外注作業中" && (
              <Button
                onClick={handleWorkCompleted}
                disabled={isUpdating}
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    外注先からの作業完了報告を受領
                  </>
                )}
              </Button>
            )}

            {/* ステータス手動更新 */}
            {workOrder.status !== "完了" && (
              <div className="flex gap-2">
                {workOrder.status === "外注調整中" && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("外注見積待ち")}
                    disabled={isUpdating}
                    className="flex-1 h-12 text-base"
                  >
                    見積待ちに更新
                  </Button>
                )}
                {workOrder.status === "外注見積待ち" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("外注調整中")}
                      disabled={isUpdating}
                      className="flex-1 h-12 text-base"
                    >
                      調整中に戻す
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("外注作業中")}
                      disabled={isUpdating}
                      className="flex-1 h-12 text-base"
                    >
                      作業中に更新
                  </Button>
                  </>
                )}
                {workOrder.status === "外注作業中" && (
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("完了")}
                    disabled={isUpdating}
                    className="flex-1 h-12 text-base"
                  >
                    完了に更新
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* 外注先情報編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              外注先情報{workOrder.vendor ? "編集" : "登録"}
            </DialogTitle>
            <DialogDescription>
              外注先の情報を入力してください
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-name" className="text-base">
                外注先名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vendor-name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="例: 〇〇板金工業"
                className="h-12 text-base"
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-contact" className="text-base">
                連絡先
              </Label>
              <Input
                id="vendor-contact"
                value={vendorContact}
                onChange={(e) => setVendorContact(e.target.value)}
                placeholder="例: 03-1234-5678"
                className="h-12 text-base"
                disabled={isUpdating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-notes" className="text-base">
                備考
              </Label>
              <Textarea
                id="vendor-notes"
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
                placeholder="外注先に関する備考を入力してください"
                className="text-base min-h-[100px]"
                disabled={isUpdating}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isUpdating}
              className="h-12 text-base"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleVendorInfoUpdate}
              disabled={isUpdating || !vendorName.trim()}
              className="h-12 text-base bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

