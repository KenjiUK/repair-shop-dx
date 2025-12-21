"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Clipboard } from "lucide-react";
import { updateWorkOrder } from "@/lib/api";
import { toast } from "sonner";
import { ZohoJob } from "@/types";

// =============================================================================
// Props
// =============================================================================

interface WorkOrderDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態の変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** 対象のジョブ */
  job: ZohoJob | null;
  /** 保存成功時のコールバック */
  onSuccess?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function WorkOrderDialog({
  open,
  onOpenChange,
  job,
  onSuccess,
}: WorkOrderDialogProps) {
  const [workOrderText, setWorkOrderText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ジョブが変更されたら、作業指示の内容を初期化
  useEffect(() => {
    if (job) {
      setWorkOrderText(job.field || "");
    } else {
      setWorkOrderText("");
    }
  }, [job, open]);

  /**
   * 保存処理
   */
  const handleSave = async () => {
    if (!job) return;

    setIsSaving(true);

    try {
      const result = await updateWorkOrder(job.id, workOrderText.trim());

      if (result.success) {
        toast.success("作業指示を保存しました", {
          description: `${job.field4?.name ?? "案件"}様の作業指示を更新しました`,
        });

        // コールバックを実行
        if (onSuccess) {
          onSuccess();
        }

        // ダイアログを閉じる
        onOpenChange(false);
      } else {
        toast.error("作業指示の保存に失敗しました", {
          description: result.error?.message,
        });
      }
    } catch (error) {
      console.error("Work order update error:", error);
      toast.error("エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * キャンセル処理
   */
  const handleCancel = () => {
    // 変更を破棄して閉じる
    if (job) {
      setWorkOrderText(job.field || "");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clipboard className="h-5 w-5" />
            作業指示{job?.field ? "の編集" : "の追加"}
          </DialogTitle>
          <DialogDescription>
            {job?.field4?.name && (
              <span className="font-medium">{job.field4.name}様</span>
            )}
            {job?.field6?.name && (
              <span className="text-slate-500"> / {job.field6.name}</span>
            )}
            の作業指示を{job?.field ? "編集" : "追加"}します。
            <br />
            社内からの申し送り事項や特別な指示事項を入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="work-order-text">作業指示内容</Label>
            <Textarea
              id="work-order-text"
              placeholder="例：オイルフィルター在庫確認、ETCセットアップ、タイヤの空気圧調整など..."
              value={workOrderText}
              onChange={(e) => setWorkOrderText(e.target.value)}
              rows={8}
              className="resize-none"
              disabled={isSaving}
            />
            <p className="text-xs text-slate-500">
              複数行で入力できます。整備士が診断画面で確認します。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "保存する"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
