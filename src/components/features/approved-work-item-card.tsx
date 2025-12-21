"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { CheckCircle2, Clock, Camera, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

// =============================================================================
// 型定義
// =============================================================================

export interface ApprovedWorkItem {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** カテゴリ */
  category?: string;
  /** 状態 */
  status: "pending" | "in_progress" | "completed";
  /** Before写真リスト */
  beforePhotos: PhotoData[];
  /** After写真リスト */
  afterPhotos: PhotoData[];
  /** コメント */
  comment?: string;
}

// =============================================================================
// Props
// =============================================================================

interface ApprovedWorkItemCardProps {
  /** 作業項目 */
  item: ApprovedWorkItem;
  /** Before写真撮影ハンドラ */
  onBeforePhotoCapture?: (itemId: string, file: File) => void | Promise<void>;
  /** After写真撮影ハンドラ */
  onAfterPhotoCapture?: (itemId: string, file: File) => void | Promise<void>;
  /** コメント変更ハンドラ */
  onCommentChange?: (itemId: string, comment: string) => void;
  /** 完了ハンドラ */
  onComplete?: (itemId: string) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ApprovedWorkItemCard({
  item,
  onBeforePhotoCapture,
  onAfterPhotoCapture,
  onCommentChange,
  onComplete,
  disabled = false,
}: ApprovedWorkItemCardProps) {
  const [showCommentInput, setShowCommentInput] = useState(!!item.comment);
  const [comment, setComment] = useState(item.comment || "");

  // Before写真撮影ハンドラ
  const handleBeforePhotoCapture = async (position: string, file: File) => {
    if (onBeforePhotoCapture) {
      await onBeforePhotoCapture(item.id, file);
    }
  };

  // After写真撮影ハンドラ
  const handleAfterPhotoCapture = async (position: string, file: File) => {
    if (onAfterPhotoCapture) {
      await onAfterPhotoCapture(item.id, file);
    }
  };

  // コメント保存ハンドラ
  const handleCommentSave = () => {
    if (onCommentChange) {
      onCommentChange(item.id, comment);
    }
    if (!comment.trim()) {
      setShowCommentInput(false);
    }
  };

  // 完了ハンドラ
  const handleComplete = () => {
    if (onComplete) {
      onComplete(item.id);
    }
  };

  const isCompleted = item.status === "completed";
  const isInProgress = item.status === "in_progress";

  return (
    <Card
      className={cn(
        "transition-all",
        isCompleted && "border-green-500 bg-green-50",
        isInProgress && "border-blue-500 bg-blue-50"
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : isInProgress ? (
              <Clock className="h-5 w-5 text-blue-600" />
            ) : (
              <Clock className="h-5 w-5 text-slate-400" />
            )}
            <span>{item.name}</span>
            {item.category && (
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
            )}
          </div>
          {!isCompleted && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleComplete}
              disabled={disabled}
            >
              完了
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Before/After写真セクション */}
        <div className="grid grid-cols-2 gap-4">
          {/* Before写真 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Before</span>
              <Badge variant="secondary" className="text-xs">
                {item.beforePhotos.length}枚
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {item.beforePhotos.map((photo, index) => (
                <div
                  key={index}
                  className="relative w-full aspect-square rounded border overflow-hidden"
                >
                  {photo.previewUrl && (
                    <img
                      src={photo.previewUrl}
                      alt={`Before ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
            <PhotoCaptureButton
              position={`${item.id}-before`}
              label="Before写真を追加"
              photoData={item.beforePhotos[item.beforePhotos.length - 1]}
              onCapture={handleBeforePhotoCapture}
              disabled={disabled}
              size="sm"
            />
          </div>

          {/* After写真 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">After</span>
              <Badge variant="secondary" className="text-xs">
                {item.afterPhotos.length}枚
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {item.afterPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="relative w-full aspect-square rounded border overflow-hidden"
                >
                  {photo.previewUrl && (
                    <img
                      src={photo.previewUrl}
                      alt={`After ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
              {item.afterPhotos.length === 0 && (
                <div className="col-span-2 flex items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded text-slate-400 text-sm">
                  未撮影
                </div>
              )}
            </div>
            <PhotoCaptureButton
              position={`${item.id}-after`}
              label="After写真を追加"
              photoData={item.afterPhotos[item.afterPhotos.length - 1]}
              onCapture={handleAfterPhotoCapture}
              disabled={disabled}
              size="sm"
            />
          </div>
        </div>

        {/* コメントセクション */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCommentInput(!showCommentInput)}
            disabled={disabled}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-3 w-3" />
            コメント
            {item.comment && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                1
              </Badge>
            )}
          </Button>
          {showCommentInput && (
            <div className="space-y-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onBlur={handleCommentSave}
                placeholder="コメントを入力..."
                disabled={disabled}
                rows={2}
                className="text-sm"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setComment("");
                    setShowCommentInput(false);
                    if (onCommentChange) {
                      onCommentChange(item.id, "");
                    }
                  }}
                  disabled={disabled}
                >
                  <X className="h-3 w-3 mr-1" />
                  クリア
                </Button>
              </div>
            </div>
          )}
          {item.comment && !showCommentInput && (
            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
              {item.comment}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}















