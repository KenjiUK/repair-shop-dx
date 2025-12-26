"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReload: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
  currentVersion: number;
  submittedVersion: number;
}

/**
 * 競合解決ダイアログ
 * データが他のユーザーによって更新された場合に表示される
 */
export function ConflictResolutionDialog({
  open,
  onOpenChange,
  onReload,
  onOverwrite,
  onCancel,
  currentVersion,
  submittedVersion,
}: ConflictResolutionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            データの競合が検知されました
          </DialogTitle>
          <DialogDescription className="text-base text-slate-700 mt-2">
            このデータは他のユーザーによって更新されています。
            <br />
            現在のバージョン: {currentVersion}
            <br />
            送信されたバージョン: {submittedVersion}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-base text-slate-800">
            以下のいずれかの操作を選択してください：
          </p>
          <ul className="mt-3 space-y-2 text-base text-slate-700 list-disc list-inside">
            <li>
              <strong>最新データを読み込む</strong>: 最新のデータを取得して、再度編集してください
            </li>
            <li>
              <strong>上書き保存</strong>: 現在の編集内容で上書き保存します（他のユーザーの変更が失われる可能性があります）
            </li>
            <li>
              <strong>キャンセル</strong>: 保存をキャンセルします
            </li>
          </ul>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-12 text-base"
          >
            <X className="h-5 w-5 mr-2 shrink-0" />
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={onOverwrite}
            className="flex-1 h-12 text-base"
          >
            上書き保存
          </Button>
          <Button
            onClick={onReload}
            className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-5 w-5 mr-2 shrink-0" />
            最新データを読み込む
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

