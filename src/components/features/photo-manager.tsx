/**
 * 写真管理コンポーネント
 * 改善提案 #14: 写真管理機能の強化
 * 
 * 機能:
 * - 写真の削除
 * - 写真の順番入れ替え（ドラッグ&ドロップ）
 * - 削除確認ダイアログ
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface PhotoItem {
  id: string;
  previewUrl: string;
  position?: string;
}

interface PhotoManagerProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  onDelete?: (photoId: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * 写真管理コンポーネント
 */
export function PhotoManager({
  photos,
  onPhotosChange,
  onDelete,
  className,
  disabled = false,
}: PhotoManagerProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  /**
   * 写真削除ハンドラ
   */
  const handleDeleteClick = (photo: PhotoItem) => {
    setSelectedPhoto(photo);
    setIsDeleteDialogOpen(true);
  };

  /**
   * 写真削除確認
   */
  const handleDeleteConfirm = () => {
    if (!selectedPhoto) return;

    const updatedPhotos = photos.filter((p) => p.id !== selectedPhoto.id);
    onPhotosChange(updatedPhotos);

    if (onDelete) {
      onDelete(selectedPhoto.id);
    }

    toast.success("写真を削除しました");
    setIsDeleteDialogOpen(false);
    setSelectedPhoto(null);
  };

  /**
   * ドラッグ開始
   */
  const handleDragStart = (index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
  };

  /**
   * ドラッグオーバー
   */
  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled || draggedIndex === null) return;
    e.preventDefault();
    setDragOverIndex(index);
  };

  /**
   * ドラッグ終了
   */
  const handleDragEnd = () => {
    if (draggedIndex === null || dragOverIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (draggedIndex !== dragOverIndex) {
      const updatedPhotos = [...photos];
      const [removed] = updatedPhotos.splice(draggedIndex, 1);
      updatedPhotos.splice(dragOverIndex, 0, removed);
      onPhotosChange(updatedPhotos);
      toast.success("写真の順番を変更しました");
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 有効な写真のみをフィルタリング（previewUrlが存在するもの）
  const validPhotos = photos.filter((photo) => photo.previewUrl && photo.previewUrl.trim() !== "");

  if (validPhotos.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn("grid grid-cols-3 gap-2", className)}>
        {validPhotos.map((photo, index) => (
          <div
            key={photo.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative group cursor-move aspect-square rounded overflow-hidden bg-slate-200",
              draggedIndex === index && "opacity-50",
              dragOverIndex === index && "ring-2 ring-blue-500",
              disabled && "cursor-not-allowed"
            )}
          >
            <Image
              src={photo.previewUrl}
              alt={`写真 ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
              loading="lazy"
              quality={75}
              unoptimized
            />
            <div className="absolute top-1 left-1 bg-black/50 text-white text-base px-1 rounded">
              {index + 1}
            </div>
            {!disabled && (
              <>
                <div className="absolute top-1 right-1 flex items-center gap-1">
                  <GripVertical className="h-4 w-4 text-white bg-black/50 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={() => handleDeleteClick(photo)}
                    className="p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="写真を削除"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>写真を削除</DialogTitle>
            <DialogDescription>
              この写真を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>

          {selectedPhoto && (
            <div className="flex justify-center py-4">
              <div className="relative w-full h-48">
                <Image
                  src={selectedPhoto.previewUrl}
                  alt="削除する写真"
                  fill
                  className="object-contain rounded"
                  unoptimized
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



