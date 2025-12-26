/**
 * フィードバック入力フォーム
 * テスト版専用機能
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  FeedbackCategory,
  FeedbackUrgency,
  getCategoryLabel,
  getUrgencyLabel,
} from "@/lib/feedback-utils";
import { Loader2 } from "lucide-react";

interface FeedbackFormProps {
  onSubmit: (data: {
    category: FeedbackCategory;
    content: string;
    urgency: FeedbackUrgency;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function FeedbackForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FeedbackFormProps) {
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [content, setContent] = useState("");
  const [urgency, setUrgency] = useState<FeedbackUrgency>("medium");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !content.trim()) {
      return;
    }

    await onSubmit({
      category: category as FeedbackCategory,
      content: content.trim(),
      urgency,
    });
  };

  const categories: FeedbackCategory[] = [
    "bug",
    "uiux",
    "feature",
    "question",
    "positive",
    "other",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* カテゴリ選択 */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">カテゴリ *</Label>
        <RadioGroup
          value={category}
          onValueChange={(value) => setCategory(value as FeedbackCategory)}
          className="grid grid-cols-2 gap-3"
        >
          {categories.map((cat) => (
            <div key={cat} className="flex items-center space-x-2">
              <RadioGroupItem value={cat} id={cat} />
              <Label
                htmlFor={cat}
                className="text-base font-normal cursor-pointer flex-1"
              >
                {getCategoryLabel(cat)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* フィードバック内容 */}
      <div className="space-y-2">
        <Label htmlFor="content" className="text-base font-semibold">
          フィードバック内容 *
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="具体的な内容を入力してください..."
          rows={5}
          maxLength={500}
          className="resize-none"
          disabled={isSubmitting}
        />
        <div className="text-base text-slate-700 text-right">
          {content.length} / 500
        </div>
      </div>

      {/* 緊急度 */}
      <div className="space-y-2">
        <Label htmlFor="urgency" className="text-base font-semibold">
          緊急度
        </Label>
        <Select
          value={urgency}
          onValueChange={(value) => setUrgency(value as FeedbackUrgency)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="urgency" className="h-12 text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">{getUrgencyLabel("low")}</SelectItem>
            <SelectItem value="medium">{getUrgencyLabel("medium")}</SelectItem>
            <SelectItem value="high">{getUrgencyLabel("high")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ボタン */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          disabled={!category || !content.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              送信中...
            </>
          ) : (
            "送信"
          )}
        </Button>
      </div>
    </form>
  );
}



