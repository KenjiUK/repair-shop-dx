/**
 * フィードバック入力ダイアログ
 * テスト版専用機能
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeedbackForm } from "./feedback-form";
import {
  FeedbackCategory,
  FeedbackUrgency,
  getPageInfo,
  getBrowserInfo,
  getUserName,
} from "@/lib/feedback-utils";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    category: FeedbackCategory;
    content: string;
    urgency: FeedbackUrgency;
  }) => {
    setIsSubmitting(true);

    try {
      // 画面情報を取得
      const pageInfo = getPageInfo();
      const browserInfo = getBrowserInfo();
      const userName = getUserName();

      // APIに送信
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          ...pageInfo,
          ...browserInfo,
          userName,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "送信に失敗しました");
      }

      toast.success("フィードバックを送信しました", {
        description: "ご協力ありがとうございます",
      });

      // フォームをリセットしてダイアログを閉じる
      onOpenChange(false);
    } catch (error) {
      console.error("[Feedback] Submit error:", error);
      toast.error("送信に失敗しました", {
        description:
          error instanceof Error
            ? error.message
            : "しばらくしてから再度お試しください",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            フィードバックを送信
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 現在の画面情報を表示 */}
          <div className="p-3 bg-slate-50 rounded-lg text-base text-slate-800">
            <div className="font-medium mb-1">現在の画面情報</div>
            <div>{getPageInfo().pageName}</div>
            <div className="text-base text-slate-700 mt-1">
              {getPageInfo().pathname}
            </div>
          </div>

          <FeedbackForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}



