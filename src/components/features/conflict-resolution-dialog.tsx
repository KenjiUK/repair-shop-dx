"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Conflict, ConflictResolution, resolveConflictWithLocal, resolveConflictWithServer, resolveConflictWithMerge, defaultMergeStrategy } from "@/lib/conflict-detection";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface ConflictResolutionDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態の変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** コンフリクト情報 */
  conflict: Conflict | null;
  /** 解決ハンドラ */
  onResolve: (resolution: ConflictResolution, resolvedData: unknown) => void;
}

// =============================================================================
// Component
// =============================================================================

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflict,
  onResolve,
}: ConflictResolutionDialogProps) {
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution | null>(null);

  if (!conflict) {
    return null;
  }

  const handleResolve = (resolution: ConflictResolution) => {
    let resolvedData: unknown;

    switch (resolution) {
      case "local":
        resolvedData = resolveConflictWithLocal(conflict).resolvedData;
        break;
      case "server":
        resolvedData = resolveConflictWithServer(conflict).resolvedData;
        break;
      case "merge":
        resolvedData = resolveConflictWithMerge(conflict, defaultMergeStrategy).resolvedData;
        break;
    }

    onResolve(resolution, resolvedData);
    setSelectedResolution(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            データの競合が検出されました
          </DialogTitle>
          <DialogDescription>
            {conflict.dataType}（ID: {conflict.dataId}）で、ローカルとサーバーのデータに差異があります。
            <br />
            どちらのデータを優先するか選択してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 競合フィールド一覧 */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-900 mb-2">
              競合しているフィールド:
            </p>
            <div className="flex flex-wrap gap-2">
              {conflict.conflictedFields.map((field) => (
                <Badge key={field} variant="outline" className="bg-white">
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          {/* 解決方法の選択 */}
          <div className="space-y-3">
            <p className="text-sm font-medium">解決方法を選択:</p>

            {/* ローカル優先 */}
            <button
              onClick={() => setSelectedResolution("local")}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-colors",
                selectedResolution === "local"
                  ? "border-amber-600 bg-amber-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {selectedResolution === "local" ? (
                    <CheckCircle2 className="h-5 w-5 text-amber-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">ローカルのデータを優先</p>
                  <p className="text-sm text-slate-600 mt-1">
                    オフライン中に変更した内容を保持します
                  </p>
                </div>
              </div>
            </button>

            {/* サーバー優先 */}
            <button
              onClick={() => setSelectedResolution("server")}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-colors",
                selectedResolution === "server"
                  ? "border-amber-600 bg-amber-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {selectedResolution === "server" ? (
                    <CheckCircle2 className="h-5 w-5 text-amber-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">サーバーのデータを優先</p>
                  <p className="text-sm text-slate-600 mt-1">
                    サーバー側の最新データを使用します
                  </p>
                </div>
              </div>
            </button>

            {/* マージ */}
            <button
              onClick={() => setSelectedResolution("merge")}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-colors",
                selectedResolution === "merge"
                  ? "border-amber-600 bg-amber-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {selectedResolution === "merge" ? (
                    <CheckCircle2 className="h-5 w-5 text-amber-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">マージ（統合）</p>
                  <p className="text-sm text-slate-600 mt-1">
                    両方のデータを統合します（ローカル優先）
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* データ比較（オプション） */}
          <details className="mt-4">
            <summary className="text-sm font-medium cursor-pointer text-slate-700">
              データの詳細を表示
            </summary>
            <div className="mt-2 space-y-2">
              <div className="p-3 bg-slate-50 rounded border">
                <p className="text-xs font-medium text-slate-600 mb-1">ローカルデータ:</p>
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(conflict.localData, null, 2)}
                </pre>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <p className="text-xs font-medium text-slate-600 mb-1">サーバーデータ:</p>
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(conflict.serverData, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            onClick={() => selectedResolution && handleResolve(selectedResolution)}
            disabled={!selectedResolution}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            解決する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
















