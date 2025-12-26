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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ZohoJob, ServiceKind } from "@/types";

// =============================================================================
// Props
// =============================================================================

interface AddWorkOrderDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態の変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** 対象のジョブ */
  job: ZohoJob | null;
  /** 既存の作業区分リスト（重複チェック用） */
  existingServiceKinds?: ServiceKind[];
  /** 保存成功時のコールバック */
  onSuccess?: () => void;
}

// =============================================================================
// 入庫区分リスト
// =============================================================================

const SERVICE_KINDS: ServiceKind[] = [
  "車検",
  "12ヵ月点検",
  "エンジンオイル交換",
  "タイヤ交換・ローテーション",
  "その他",
  "故障診断",
  "修理・整備",
  "チューニング",
  "パーツ取付",
  "コーティング",
  "レストア",
  "その他",
];

// =============================================================================
// Component
// =============================================================================

export function AddWorkOrderDialog({
  open,
  onOpenChange,
  job,
  existingServiceKinds = [],
  onSuccess,
}: AddWorkOrderDialogProps) {
  const [selectedServiceKind, setSelectedServiceKind] = useState<ServiceKind | "">("");
  const [isCreating, setIsCreating] = useState(false);

  // ダイアログが開かれたときに選択をリセット
  useEffect(() => {
    if (open) {
      setSelectedServiceKind("");
    }
  }, [open]);

  /**
   * 利用可能な作業区分を取得（既存の作業区分を除外）
   */
  const availableServiceKinds = SERVICE_KINDS.filter(
    (kind) => !existingServiceKinds.includes(kind)
  );

  /**
   * 作業を追加
   */
  const handleAdd = async () => {
    if (!job || !selectedServiceKind) return;

    setIsCreating(true);

    try {
      // API呼び出し
      const response = await fetch(`/api/jobs/${job.id}/work-orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceKind: selectedServiceKind,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("作業を追加しました", {
          description: `${selectedServiceKind}を追加しました`,
        });

        // コールバックを実行
        if (onSuccess) {
          onSuccess();
        }

        // ダイアログを閉じる
        onOpenChange(false);
      } else {
        toast.error("作業の追加に失敗しました", {
          description: result.error?.message || "不明なエラーが発生しました",
        });
      }
    } catch (error) {
      console.error("Work order creation error:", error);
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * キャンセル処理
   */
  const handleCancel = () => {
    setSelectedServiceKind("");
    onOpenChange(false);
  };

  // 利用可能な作業区分がない場合
  if (availableServiceKinds.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              作業を追加
            </DialogTitle>
            <DialogDescription>
              すべての作業区分が既に追加されています。
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            作業を追加
          </DialogTitle>
          <DialogDescription>
            {job?.field4?.name && (
              <span className="font-medium">{job.field4.name}様</span>
            )}
            {job?.field6?.name && (
              <span className="text-slate-700"> / {job.field6.name}</span>
            )}
            に新しい作業を追加します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="service-kind">作業区分</Label>
            <Select
              value={selectedServiceKind}
              onValueChange={(value) => setSelectedServiceKind(value as ServiceKind)}
              disabled={isCreating}
            >
              <SelectTrigger id="service-kind" className="h-12 text-base">
                <SelectValue placeholder="作業区分を選択してください" />
              </SelectTrigger>
              <SelectContent>
                {availableServiceKinds.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-base text-slate-700">
              追加する作業区分を選択してください。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
            キャンセル
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedServiceKind || isCreating}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                追加中...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                追加する
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
























