"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// Types
// =============================================================================

export interface BlogPhotoItem {
  /** 写真ID */
  id: string;
  /** 写真URL */
  url: string;
  /** 写真の種類（before/after/general） */
  type: "before" | "after" | "general";
  /** 写真の説明（オプション） */
  caption?: string;
  /** ファイルID（Google Drive） */
  fileId?: string;
}

export interface BlogPhotoSelectorProps {
  /** 写真リスト */
  photos: BlogPhotoItem[];
  /** 選択された写真IDのリスト */
  selectedPhotoIds: string[];
  /** 選択変更ハンドラ */
  onSelectionChange: (selectedIds: string[]) => void;
  /** 公開処理中フラグ */
  isPublishing?: boolean;
  /** 公開ハンドラ */
  onPublish?: (selectedPhotoIds: string[]) => Promise<void>;
  /** 無効化 */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function BlogPhotoSelector({
  photos,
  selectedPhotoIds,
  onSelectionChange,
  isPublishing = false,
  onPublish,
  disabled = false,
  className,
}: BlogPhotoSelectorProps) {
  const handleToggleSelect = (photoId: string) => {
    if (disabled || isPublishing) return;

    const isSelected = selectedPhotoIds.includes(photoId);
    if (isSelected) {
      onSelectionChange(selectedPhotoIds.filter((id) => id !== photoId));
    } else {
      onSelectionChange([...selectedPhotoIds, photoId]);
    }
  };

  const handleSelectAll = () => {
    if (disabled || isPublishing) return;
    onSelectionChange(photos.map((photo) => photo.id));
  };

  const handleDeselectAll = () => {
    if (disabled || isPublishing) return;
    onSelectionChange([]);
  };

  const handlePublish = async () => {
    if (!onPublish || selectedPhotoIds.length === 0) return;

    try {
      await onPublish(selectedPhotoIds);
      toast.success("ブログ用に公開しました", {
        description: `${selectedPhotoIds.length}枚の写真を公開しました`,
      });
      // 公開後は選択をクリア
      onSelectionChange([]);
    } catch (error) {
      console.error("ブログ用写真公開エラー:", error);
      toast.error("公開に失敗しました", {
        description: error instanceof Error ? error.message : "写真の公開に失敗しました",
      });
    }
  };

  const allSelected = photos.length > 0 && selectedPhotoIds.length === photos.length;
  const someSelected = selectedPhotoIds.length > 0 && !allSelected;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-5 w-5" />
            ブログ用写真の公開
          </CardTitle>
          <div className="flex items-center gap-2">
            {photos.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={allSelected ? handleDeselectAll : handleSelectAll}
                  disabled={disabled || isPublishing}
                  className="h-7 text-xs"
                >
                  {allSelected ? "すべて解除" : "すべて選択"}
                </Button>
                {selectedPhotoIds.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedPhotoIds.length}枚選択中
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {photos.length > 0 ? (
          <div className="space-y-4">
            {/* 写真グリッド */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => {
                const isSelected = selectedPhotoIds.includes(photo.id);
                return (
                  <div
                    key={photo.id}
                    className={cn(
                      "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-slate-200 hover:border-slate-300",
                      disabled || isPublishing ? "opacity-50 cursor-not-allowed" : ""
                    )}
                    onClick={() => handleToggleSelect(photo.id)}
                  >
                    {/* 写真 */}
                    <div className="aspect-square relative bg-slate-100">
                      <img
                        src={photo.url}
                        alt={photo.caption || "写真"}
                        className="w-full h-full object-cover"
                      />
                      {/* オーバーレイ */}
                      <div
                        className={cn(
                          "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors",
                          isSelected && "bg-primary/20"
                        )}
                      />
                      {/* チェックボックス */}
                      <div className="absolute top-2 left-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-white/80 text-slate-400 group-hover:bg-white"
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      {/* 種類バッジ */}
                      {photo.type !== "general" && (
                        <div className="absolute bottom-2 right-2">
                          <Badge
                            variant={photo.type === "before" ? "secondary" : "default"}
                            className="text-xs"
                          >
                            {photo.type === "before" ? "Before" : "After"}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {/* キャプション */}
                    {photo.caption && (
                      <div className="p-2 bg-white">
                        <p className="text-xs text-slate-600 truncate">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 公開ボタン */}
            {selectedPhotoIds.length > 0 && onPublish && (
              <div className="pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={disabled || isPublishing || selectedPhotoIds.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      公開中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      ブログ用に公開（{selectedPhotoIds.length}枚）
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">公開可能な写真がありません</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}















