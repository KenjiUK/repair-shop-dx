"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { PhotoManager, PhotoItem } from "./photo-manager";
import { CheckCircle2, Clock, Camera, MessageSquare, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  /** 担当者名（工程ごとの担当者） */
  mechanicName?: string | null;
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
  /** Before写真変更ハンドラ（削除・順番入れ替え） */
  onBeforePhotosChange?: (itemId: string, photos: PhotoData[]) => void;
  /** After写真変更ハンドラ（削除・順番入れ替え） */
  onAfterPhotosChange?: (itemId: string, photos: PhotoData[]) => void;
  /** コメント変更ハンドラ */
  onCommentChange?: (itemId: string, comment: string) => void;
  /** 担当者変更ハンドラ */
  onMechanicChange?: (itemId: string, mechanicName: string) => void;
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
  onBeforePhotosChange,
  onAfterPhotosChange,
  onCommentChange,
  onMechanicChange,
  onComplete,
  disabled = false,
}: ApprovedWorkItemCardProps) {
  const [showCommentInput, setShowCommentInput] = useState(!!item.comment);
  const [comment, setComment] = useState(item.comment || "");
  const [mechanicName, setMechanicName] = useState(item.mechanicName || "");

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
        <CardTitle className="flex items-center justify-between text-lg font-semibold">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0" />
            ) : isInProgress ? (
              <Clock className="h-5 w-5 text-blue-700 shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-slate-700 shrink-0" />
            )}
            <span>{item.name}</span>
            {item.category && (
              <Badge variant="outline" className="text-base">
                {item.category}
              </Badge>
            )}
          </div>
          {!isCompleted && (
            <Button
              type="button"
              variant="outline"
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
              <span className="text-base font-medium text-slate-800">Before</span>
              <Badge variant="secondary" className="text-base">
                {item.beforePhotos.length}枚
              </Badge>
            </div>
            {item.beforePhotos.length > 0 ? (
              <PhotoManager
                photos={item.beforePhotos.map((photo, index) => ({
                  id: photo.position || `before-${index}`,
                  previewUrl: photo.previewUrl || "",
                  position: photo.position,
                }))}
                onPhotosChange={(updatedPhotos) => {
                  if (onBeforePhotosChange) {
                    // PhotoItem[]をPhotoData[]に変換
                    const photoData: PhotoData[] = updatedPhotos.map((p) => {
                      // 既存のPhotoDataを探す
                      const existing = item.beforePhotos.find(
                        (bp) => bp.position === p.position || bp.previewUrl === p.previewUrl
                      );
                      return existing || {
                        position: p.position || p.id,
                        previewUrl: p.previewUrl,
                        file: undefined,
                        isCompressing: false,
                      };
                    });
                    onBeforePhotosChange(item.id, photoData);
                  }
                }}
                disabled={disabled}
                className="grid grid-cols-2 gap-2"
              />
            ) : (
              <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded text-slate-700 text-base">
                未撮影
              </div>
            )}
            <PhotoCaptureButton
              position={`${item.id}-before`}
              label="Before写真を追加"
              photoData={item.beforePhotos[item.beforePhotos.length - 1]}
              onCapture={handleBeforePhotoCapture}
              disabled={disabled}
            />
          </div>

          {/* After写真 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-slate-800">After</span>
              <Badge variant="secondary" className="text-base">
                {item.afterPhotos.length}枚
              </Badge>
            </div>
            {item.afterPhotos.length > 0 ? (
              <PhotoManager
                photos={item.afterPhotos.map((photo, index) => ({
                  id: photo.position || `after-${index}`,
                  previewUrl: photo.previewUrl || "",
                  position: photo.position,
                }))}
                onPhotosChange={(updatedPhotos) => {
                  if (onAfterPhotosChange) {
                    // PhotoItem[]をPhotoData[]に変換
                    const photoData: PhotoData[] = updatedPhotos.map((p) => {
                      // 既存のPhotoDataを探す
                      const existing = item.afterPhotos.find(
                        (ap) => ap.position === p.position || ap.previewUrl === p.previewUrl
                      );
                      return existing || {
                        position: p.position || p.id,
                        previewUrl: p.previewUrl,
                        file: undefined,
                        isCompressing: false,
                      };
                    });
                    onAfterPhotosChange(item.id, photoData);
                  }
                }}
                disabled={disabled}
                className="grid grid-cols-2 gap-2"
              />
            ) : (
              <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded text-slate-700 text-base">
                未撮影
              </div>
            )}
            <PhotoCaptureButton
              position={`${item.id}-after`}
              label="After写真を追加"
              photoData={item.afterPhotos[item.afterPhotos.length - 1]}
              onCapture={handleAfterPhotoCapture}
              disabled={disabled}
            />
          </div>
        </div>

        {/* 担当者セクション */}
        <div className="space-y-2">
          <Label className="text-base font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-slate-700 shrink-0" />
            担当者
          </Label>
          <Input
            type="text"
            value={mechanicName}
            onChange={(e) => {
              setMechanicName(e.target.value);
              if (onMechanicChange) {
                onMechanicChange(item.id, e.target.value);
              }
            }}
            onBlur={() => {
              if (onMechanicChange) {
                onMechanicChange(item.id, mechanicName);
              }
            }}
            placeholder="担当者の名前を入力"
            className="h-12 text-base"
            disabled={disabled}
          />
          <p className="text-base text-slate-600">
            この作業項目を実施した整備士の名前を入力してください
          </p>
        </div>

        {/* コメントセクション */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCommentInput(!showCommentInput)}
            disabled={disabled}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-4 w-4" />
            コメント
            {item.comment && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-base">
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
                className="text-base"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setComment("");
                    setShowCommentInput(false);
                    if (onCommentChange) {
                      onCommentChange(item.id, "");
                    }
                  }}
                  disabled={disabled}
                >
                  <X className="h-4 w-4 mr-1" />
                  クリア
                </Button>
              </div>
            </div>
          )}
          {item.comment && !showCommentInput && (
            <p className="text-base text-slate-800 bg-slate-50 p-2 rounded">
              {item.comment}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}























