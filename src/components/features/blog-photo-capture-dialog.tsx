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
import { PhotoCaptureButton, PhotoData } from "@/components/features/photo-capture-button";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadBlogPhotoTemporary } from "@/lib/blog-photo-manager";
import { compressImage, getImagePreviewUrl } from "@/lib/compress";
import { BLOG_PHOTO_POSITIONS } from "@/lib/photo-position";

// =============================================================================
// Types
// =============================================================================

export interface BlogPhotoCaptureDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** Job ID */
  jobId: string;
  /** 撮影完了コールバック */
  onComplete?: () => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ブログ用写真撮影ダイアログ
 * 
 * 受付時（フロントスタッフ）または診断時（メカニック）にブログ用写真を撮影するためのダイアログ
 */
export function BlogPhotoCaptureDialog({
  open,
  onOpenChange,
  jobId,
  onComplete,
}: BlogPhotoCaptureDialogProps) {
  const [photos, setPhotos] = useState<Record<string, PhotoData>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  // 撮影位置の定義（統一されたマッピングを使用）
  const photoPositions = BLOG_PHOTO_POSITIONS;

  /**
   * 写真撮影ハンドラ
   */
  const handlePhotoCapture = async (position: string, file: File) => {
    try {
      // 画像を圧縮
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      // 状態を更新
      setPhotos((prev) => ({
        ...prev,
        [position]: {
          position,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      toast.success("写真を撮影しました");
    } catch (error) {
      console.error("写真処理エラー:", error);
      toast.error("写真の処理に失敗しました");
    }
  };

  /**
   * 写真を削除
   */
  const handleRemovePhoto = (position: string) => {
    setPhotos((prev) => {
      const newPhotos = { ...prev };
      delete newPhotos[position];
      return newPhotos;
    });
    toast.success("写真を削除しました");
  };

  /**
   * すべての写真を保存
   */
  const handleSaveAll = async () => {
    const photoEntries = Object.entries(photos);
    if (photoEntries.length === 0) {
      toast.warning("撮影された写真がありません");
      return;
    }

    setIsUploading(true);
    setUploadedCount(0);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const [position, photoData] of photoEntries) {
        if (!photoData.file) continue;

        try {
          // ブログ用ファイル名は英語で保存（一時保存時も英語キーを使用）
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const fileName = `blog-photo_${position}_${timestamp}.jpg`;
          const result = await uploadBlogPhotoTemporary(
            jobId,
            photoData.file,
            fileName
          );

          if (result.success) {
            successCount++;
            setUploadedCount((prev) => prev + 1);
          } else {
            errorCount++;
            console.error(`写真のアップロードに失敗しました (${position}):`, result.error);
          }
        } catch (error) {
          errorCount++;
          console.error(`写真のアップロードエラー (${position}):`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount}枚の写真を保存しました`, {
          description: errorCount > 0 ? `${errorCount}枚の保存に失敗しました` : undefined,
        });
      } else {
        toast.error("写真の保存に失敗しました");
        return;
      }

      // 状態をリセット
      setPhotos({});
      setUploadedCount(0);
      onOpenChange(false);
      onComplete?.();
    } catch (error) {
      console.error("写真保存エラー:", error);
      toast.error("写真の保存に失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * ダイアログを閉じる
   */
  const handleClose = () => {
    if (isUploading) return;
    onOpenChange(false);
  };

  const photoCount = Object.keys(photos).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Camera className="h-5 w-5 shrink-0" />
            ブログ用写真を撮影
          </DialogTitle>
          <DialogDescription className="text-base">
            受付時に車両の写真を撮影します。作業完了後、ブログ用に公開することができます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 撮影案内 */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-base font-medium text-blue-900 dark:text-blue-100">
                  撮影時のご案内
                </p>
                <p className="text-base text-blue-800 dark:text-blue-200 mt-1">
                  スマートフォンを横向き（ランドスケープ）にして撮影してください。写真は自動的に3:2の比率に調整されます。
                </p>
              </div>
            </div>
          </div>
          {/* 撮影グリッド */}
          <div className="grid grid-cols-2 gap-4">
            {photoPositions.map(({ position, label }) => {
              const photoData = photos[position];
              return (
                <div key={position} className="space-y-2">
                  <PhotoCaptureButton
                    position={position}
                    label={label}
                    photoData={photoData}
                    onCapture={handlePhotoCapture}
                    disabled={isUploading}
                    size="default"
                  />
                  {photoData?.previewUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePhoto(position)}
                      disabled={isUploading}
                      className="w-full h-12 text-base"
                    >
                      <X className="h-4 w-4 mr-1 shrink-0" />
                      削除
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 撮影済み枚数 */}
          {photoCount > 0 && (
            <div className="text-center text-base text-slate-700">
              {photoCount}枚の写真を撮影しました
            </div>
          )}

          {/* 保存ボタン */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleSaveAll}
              disabled={isUploading || photoCount === 0}
              className="flex-1"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                  保存中... ({uploadedCount}/{photoCount})
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2 shrink-0" />
                  保存 ({photoCount}枚)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


