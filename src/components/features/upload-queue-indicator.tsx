"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle2, AlertCircle, X } from "lucide-react";
import { getPendingUploadQueue, UploadQueueEntry, processUploadQueue } from "@/lib/upload-queue";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface UploadQueueIndicatorProps {
  /** カスタムクラス */
  className?: string;
  /** 自動アップロードを有効にするか */
  autoUpload?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function UploadQueueIndicator({
  className,
  autoUpload = true,
}: UploadQueueIndicatorProps) {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // 未アップロードファイル数を更新
  const updatePendingCount = async () => {
    try {
      const pending = await getPendingUploadQueue();
      setPendingCount(pending.length);
    } catch (error) {
      console.error("未アップロードファイル数の取得に失敗しました:", error);
    }
  };

  // 定期的に未アップロードファイル数を更新
  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // 5秒ごと
    return () => clearInterval(interval);
  }, []);

  // オンライン復帰時に自動アップロード
  useEffect(() => {
    if (isOnline && autoUpload && pendingCount > 0 && !isUploading) {
      handleUpload();
    }
  }, [isOnline, autoUpload, pendingCount, isUploading]);

  // アップロード処理
  const handleUpload = async () => {
    if (!isOnline) {
      setLastError("オフライン状態ではアップロードできません");
      return;
    }

    setIsUploading(true);
    setLastError(null);

    try {
      const result = await processUploadQueue();
      await updatePendingCount();

      if (result.failed > 0) {
        setLastError(`${result.failed}件のアップロードに失敗しました`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLastError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // 未アップロードファイルがない場合は非表示
  if (pendingCount === 0 && !lastError) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border p-4 min-w-[280px]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {isUploading ? (
            <Upload className="h-5 w-5 text-blue-700 animate-pulse" />
          ) : lastError ? (
            <AlertCircle className="h-5 w-5 text-red-700" />
          ) : (
            <Upload className="h-5 w-5 text-amber-700" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-base font-medium">未アップロードファイル</p>
            {pendingCount > 0 && (
              <Badge variant="outline" className="bg-amber-50">
                {pendingCount}件
              </Badge>
            )}
          </div>
          {lastError && (
            <p className="text-base text-red-700 mb-2">{lastError}</p>
          )}
          {isUploading ? (
            <p className="text-base text-slate-700">アップロード中...</p>
          ) : pendingCount > 0 ? (
            <Button
              onClick={handleUpload}
              disabled={!isOnline}
              className="mt-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Upload className="h-4 w-4 mr-1" />
              アップロード
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-base text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>すべてアップロード済み</span>
            </div>
          )}
        </div>
        {!isUploading && (
          <button
            onClick={() => {
              setPendingCount(0);
              setLastError(null);
            }}
            className="p-1 rounded hover:bg-slate-100 transition-colors"
            aria-label="閉じる"
          >
            <X className="h-4 w-4 text-slate-700" />
          </button>
        )}
      </div>
    </div>
  );
}
























