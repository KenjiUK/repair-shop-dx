"use client";

import { cn } from "@/lib/utils";
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveStatusIndicatorProps {
  /** 保存状態 */
  status: 'idle' | 'saving' | 'saved' | 'error';
  /** 未保存の変更があるか */
  hasUnsavedChanges?: boolean;
  /** 手動保存関数 */
  onSave?: () => Promise<void>;
  /** 保存ボタンを表示するか */
  showSaveButton?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 保存状態インジケーター
 * 
 * 表示状態:
 * - idle: 何も表示しない（変更がない場合）
 * - saving: 「保存中...」
 * - saved: 「保存済み」（3秒後に消える）
 * - error: 「保存失敗」
 */
export function SaveStatusIndicator({
  status,
  hasUnsavedChanges = false,
  onSave,
  showSaveButton = true,
  className,
}: SaveStatusIndicatorProps) {
  // 変更がない場合は何も表示しない
  if (status === 'idle' && !hasUnsavedChanges) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {status === 'saving' && (
        <div className="flex items-center gap-2 text-base text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>保存中...</span>
        </div>
      )}

      {status === 'saved' && (
        <div className="flex items-center gap-2 text-base text-green-600">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>保存済み</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-base text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>保存失敗</span>
        </div>
      )}

      {hasUnsavedChanges && status !== 'saving' && showSaveButton && onSave && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className="h-12 text-base"
        >
          <Save className="h-4 w-4 mr-1 shrink-0" />
          下書き保存
        </Button>
      )}
    </div>
  );
}


