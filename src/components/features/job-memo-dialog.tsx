"use client";

import { useState, useEffect, useMemo } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Notebook, Edit, Trash2, Plus, FileText } from "lucide-react";
import { 
  addJobMemo, 
  updateJobMemo, 
  deleteJobMemo,
  fetchJobById 
} from "@/lib/api";
import { getCurrentMechanicName } from "@/lib/auth";
import { toast } from "sonner";
import { ZohoJob, JobMemo } from "@/types";
import { parseJobMemosFromField26, createNewJobMemo } from "@/lib/job-memo-parser";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface JobMemoDialogProps {
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

export function JobMemoDialog({
  open,
  onOpenChange,
  job,
  onSuccess,
}: JobMemoDialogProps) {
  const [memos, setMemos] = useState<JobMemo[]>([]);
  const [newMemoContent, setNewMemoContent] = useState("");
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // ジョブが変更されたら、メモ一覧を初期化
  useEffect(() => {
    if (job && open) {
      // field26からメモを取得、なければjobMemosから取得
      const memosFromField26 = job.field26 
        ? parseJobMemosFromField26(job.field26)
        : [];
      const memosFromJob = job.jobMemos || [];
      const allMemos = memosFromField26.length > 0 ? memosFromField26 : memosFromJob;
      setMemos(allMemos);
      setNewMemoContent("");
      setEditingMemoId(null);
      setEditingContent("");
    }
  }, [job, open]);

  // メモを時系列でソート（新しいメモが上に）
  const sortedMemos = useMemo(() => {
    return [...memos].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // 降順（新しい順）
    });
  }, [memos]);

  /**
   * 新しいメモを追加
   */
  const handleAddMemo = async () => {
    if (!job || !newMemoContent.trim()) return;

    const currentMechanic = getCurrentMechanicName();
    if (!currentMechanic) {
      toast.error("整備士名が取得できませんでした");
      return;
    }

    setIsSaving(true);

    try {
      const newMemo = createNewJobMemo(job.id, newMemoContent.trim(), currentMechanic);
      const result = await addJobMemo(job.id, newMemo);

      if (result.success && result.data) {
        // メモ一覧を更新
        const updatedMemos = result.data.jobMemos || [];
        setMemos(updatedMemos);
        setNewMemoContent("");
        toast.success("メモを追加しました");
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error("メモの追加に失敗しました", {
          description: result.error?.message,
        });
      }
    } catch (error) {
      console.error("Add memo error:", error);
      toast.error("エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * メモの編集を開始
   */
  const handleStartEdit = (memo: JobMemo) => {
    setEditingMemoId(memo.id);
    setEditingContent(memo.content);
  };

  /**
   * メモの編集をキャンセル
   */
  const handleCancelEdit = () => {
    setEditingMemoId(null);
    setEditingContent("");
  };

  /**
   * メモを更新
   */
  const handleUpdateMemo = async (memoId: string) => {
    if (!job || !editingContent.trim()) return;

    setIsSaving(true);

    try {
      const result = await updateJobMemo(job.id, memoId, editingContent.trim());

      if (result.success && result.data) {
        // メモ一覧を更新
        const updatedMemos = result.data.jobMemos || [];
        setMemos(updatedMemos);
        setEditingMemoId(null);
        setEditingContent("");
        toast.success("メモを更新しました");
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error("メモの更新に失敗しました", {
          description: result.error?.message,
        });
      }
    } catch (error) {
      console.error("Update memo error:", error);
      toast.error("エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * メモを削除
   */
  const handleDeleteMemo = async (memoId: string) => {
    if (!job) return;

    if (!confirm("このメモを削除しますか？")) {
      return;
    }

    setIsDeleting(memoId);

    try {
      const result = await deleteJobMemo(job.id, memoId);

      if (result.success && result.data) {
        // メモ一覧を更新
        const updatedMemos = result.data.jobMemos || [];
        setMemos(updatedMemos);
        toast.success("メモを削除しました");
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error("メモの削除に失敗しました", {
          description: result.error?.message,
        });
      }
    } catch (error) {
      console.error("Delete memo error:", error);
      toast.error("エラーが発生しました");
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * 日時をフォーマット
   */
  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    });
  };

  const customerName = job?.field4?.name ?? "未登録";
  const vehicleName = job?.field6?.name ?? "車両未登録";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Notebook className="h-5 w-5 shrink-0" />
            作業メモ
          </DialogTitle>
          <DialogDescription>
            {customerName} 様 / {vehicleName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* メモ一覧 */}
          <div className="flex-1 min-h-0 mb-4">
            <Label className="text-base font-medium mb-2 block flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-700" />
              メモ一覧
            </Label>
            {sortedMemos.length > 0 ? (
              <ScrollArea className="h-full border rounded-md p-4">
                <div className="space-y-4">
                  {sortedMemos.map((memo) => (
                    <div
                      key={memo.id}
                      className="bg-slate-50 border border-slate-200 rounded-md p-3"
                    >
                      {editingMemoId === memo.id ? (
                        // 編集モード
                        <div className="space-y-2">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            placeholder="メモを入力..."
                            className="min-h-[100px]"
                            disabled={isSaving}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="default"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                            >
                              キャンセル
                            </Button>
                            <Button
                              size="default"
                              onClick={() => handleUpdateMemo(memo.id)}
                              disabled={isSaving || !editingContent.trim()}
                            >
                              {isSaving ? (
                                <>
                                  <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" />
                                  保存中...
                                </>
                              ) : (
                                "保存"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // 表示モード
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-base text-slate-700 mb-1">
                                <span>{memo.author}</span>
                                <span>•</span>
                                <span>{formatDateTime(memo.createdAt)}</span>
                                {memo.updatedAt && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-700">（編集済み）</span>
                                  </>
                                )}
                              </div>
                              <p className="text-base text-slate-800 whitespace-pre-wrap">
                                {memo.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(memo)}
                                title="編集"
                                className="h-12 w-12"
                              >
                                <Edit className="h-5 w-5 shrink-0" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteMemo(memo.id)}
                                disabled={isDeleting === memo.id}
                                className="h-12 w-12 text-red-700 hover:text-red-800 hover:bg-red-50"
                                title="削除"
                              >
                                {isDeleting === memo.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                                ) : (
                                  <Trash2 className="h-5 w-5 shrink-0" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="border rounded-md p-8 text-center text-slate-700">
                <Notebook className="h-8 w-8 mx-auto mb-2 text-slate-700" />
                <p>メモがありません</p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* 新しいメモを追加 */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-700" />
              新しいメモを追加
            </Label>
            <Textarea
              value={newMemoContent}
              onChange={(e) => setNewMemoContent(e.target.value)}
              placeholder="メモを入力..."
              className="min-h-[100px]"
              disabled={isSaving}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                閉じる
              </Button>
              <Button
                onClick={handleAddMemo}
                disabled={isSaving || !newMemoContent.trim()}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 shrink-0" />
                    追加
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}







