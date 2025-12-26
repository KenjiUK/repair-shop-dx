"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Copy, Check, ExternalLink, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// 型定義
// =============================================================================

export interface VideoShareDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** ダイアログを閉じる */
  onClose: () => void;
  /** 共有するビデオのURL */
  videoUrl: string;
  /** ビデオのタイトル */
  videoTitle?: string;
  /** ジョブID */
  jobId?: string;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// コンポーネント
// =============================================================================

/**
 * ビデオ共有ダイアログコンポーネント
 *
 * 機能:
 * - ビデオURLの表示
 * - URLのコピー機能
 * - 共有リンクの生成
 * - 外部リンクとして開く
 */
export function VideoShareDialog({
  open,
  onClose,
  videoUrl,
  videoTitle = "作業動画",
  jobId,
  className,
}: VideoShareDialogProps) {
  const [copied, setCopied] = useState(false);

  /**
   * URLをクリップボードにコピー
   */
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopied(true);
      toast.success("URLをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("コピーエラー:", error);
      toast.error("URLのコピーに失敗しました");
    }
  };

  /**
   * 外部リンクとして開く
   */
  const handleOpenExternal = () => {
    window.open(videoUrl, "_blank");
  };

  /**
   * LINEで共有（簡易実装）
   */
  const handleShareLine = () => {
    const text = encodeURIComponent(`${videoTitle}の動画\n${videoUrl}`);
    const lineUrl = `https://line.me/R/msg/text/?${text}`;
    window.open(lineUrl, "_blank");
    toast.success("LINEで共有する準備ができました");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-md", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            ビデオを共有
          </DialogTitle>
          <DialogDescription>
            {videoTitle}の共有リンク
            {jobId && ` (Job ID: ${jobId})`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ビデオプレビュー */}
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>

          {/* URL表示 */}
          <div className="space-y-2">
            <Label htmlFor="video-url">共有URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="video-url"
                value={videoUrl}
                readOnly
                className="font-mono text-base"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-700" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 共有方法 */}
          <div className="space-y-2">
            <Label>共有方法</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleOpenExternal}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                ブラウザで開く
              </Button>
              <Button
                variant="outline"
                onClick={handleShareLine}
                className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                <Share2 className="h-4 w-4" />
                LINEで共有
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}









