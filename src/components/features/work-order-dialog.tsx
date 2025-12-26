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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, NotebookPen } from "lucide-react";
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
  const [authorName, setAuthorName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  /**
   * メモから記入者名とメモ内容を抽出
   */
  const parseWorkOrder = (text: string | null): { author: string; content: string } => {
    if (!text) return { author: "", content: "" };
    
    // 形式: [記入者名] メモ内容
    const match = text.match(/^\[(.+?)\]\s*([\s\S]*)$/);
    if (match) {
      return { author: match[1], content: match[2] };
    }
    
    return { author: "", content: text };
  };

  /**
   * メモ内容と記入者名を結合して保存形式に変換
   */
  const formatWorkOrder = (content: string, author: string): string => {
    const trimmedContent = content.trim();
    const trimmedAuthor = author.trim();
    
    if (!trimmedContent) return "";
    
    if (trimmedAuthor) {
      return `[${trimmedAuthor}] ${trimmedContent}`;
    }
    
    return trimmedContent;
  };

  // ジョブが変更されたら、受付メモの内容を初期化
  useEffect(() => {
    if (job && job.field) {
      const parsed = parseWorkOrder(job.field);
      setWorkOrderText(parsed.content);
      setAuthorName(parsed.author);
    } else {
      setWorkOrderText("");
      setAuthorName("");
    }
  }, [job, open]);

  /**
   * 保存処理
   */
  const handleSave = async () => {
    if (!job) return;

    setIsSaving(true);

    try {
      const formattedText = formatWorkOrder(workOrderText, authorName);
      const result = await updateWorkOrder(job.id, formattedText);

      if (result.success) {
        toast.success("受付メモを保存しました", {
          description: `${job.field4?.name ?? "案件"}様の受付メモを更新しました`,
        });

        // コールバックを実行
        if (onSuccess) {
          onSuccess();
        }

        // ダイアログを閉じる
        onOpenChange(false);
      } else {
        toast.error("受付メモの保存に失敗しました", {
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
    if (job && job.field) {
      const parsed = parseWorkOrder(job.field);
      setWorkOrderText(parsed.content);
      setAuthorName(parsed.author);
    } else {
      setWorkOrderText("");
      setAuthorName("");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5" />
            受付メモ{job?.field ? "の編集" : "の追加"}
          </DialogTitle>
          <DialogDescription>
            {job?.field4?.name && (
              <span className="font-medium">{job.field4.name}様</span>
            )}
            {job?.field6?.name && (
              <span className="text-slate-700"> / {job.field6.name}</span>
            )}
            の受付メモを{job?.field ? "編集" : "追加"}します。
            <br />
            受付スタッフからの申し送り事項や特別な指示事項を入力してください。この内容は作業指示書PDFに含まれます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="work-order-text">受付メモ内容</Label>
            <Textarea
              id="work-order-text"
              placeholder="例：車検のため代車必要（コンパクトカー希望）、前回点検から1年経過、オイルフィルター在庫確認など..."
              value={workOrderText}
              onChange={(e) => setWorkOrderText(e.target.value)}
              rows={8}
              className="resize-none text-base"
              disabled={isSaving}
            />
            <p className="text-base text-slate-700">
              複数行で入力できます。この内容は作業指示書PDFに含まれ、整備士が診断・作業前に確認します。
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="author-name">記入者名（任意）</Label>
            <Input
              id="author-name"
              type="text"
              placeholder="例：山田太郎"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              disabled={isSaving}
              className="text-base"
            />
            <p className="text-base text-slate-700">
              メモを残した人物の名前を入力できます。メカニックが詳細を確認したい場合に連絡先として使用されます。
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
            className="bg-orange-600 hover:bg-orange-700 text-white"
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








