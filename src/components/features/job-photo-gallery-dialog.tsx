"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { WorkOrder } from "@/types";
import { listBlogPhotosFromJobFolder, BlogPhotoInfo } from "@/lib/blog-photo-manager";
import useSWR from "swr";
import { getPhotoPositionLabel } from "@/lib/photo-position";

interface JobPhotoGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  workOrders?: WorkOrder[];
  customerName?: string;
  vehicleName?: string;
}

/**
 * JOBカードの写真ギャラリーダイアログ
 * 社内用写真（診断写真、作業写真）とブログ用写真を表示
 */
export function JobPhotoGalleryDialog({
  open,
  onOpenChange,
  jobId,
  workOrders = [],
  customerName,
  vehicleName,
}: JobPhotoGalleryDialogProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"internal" | "blog">("internal");

  // ブログ用写真を取得
  const { data: blogPhotos = [], isLoading: isLoadingBlogPhotos } = useSWR(
    open && jobId ? `blog-photos-${jobId}` : null,
    async () => {
      if (!jobId) return [];
      return await listBlogPhotosFromJobFolder(jobId);
    }
  );

  // 社内用写真を整理（診断写真 + 作業写真）
  const internalPhotos = useMemo(() => {
    const photos: Array<{
      id: string;
      url: string;
      type: "diagnosis" | "before" | "after" | "general";
      position?: string;
      label: string;
    }> = [];

    // 診断写真
    workOrders.forEach((wo) => {
      if (wo.diagnosis?.photos && Array.isArray(wo.diagnosis.photos)) {
        wo.diagnosis.photos.forEach((photo, index) => {
          photos.push({
            id: `diagnosis-${wo.id}-${index}`,
            url: photo.url,
            type: "diagnosis",
            position: photo.position,
            label: photo.position ? getPhotoPositionLabel(photo.position) : `診断写真 ${index + 1}`,
          });
        });
      }
    });

    // 作業写真
    workOrders.forEach((wo) => {
      if (wo.work?.records && Array.isArray(wo.work.records)) {
        wo.work.records.forEach((record, recordIndex) => {
          if (record.photos && Array.isArray(record.photos)) {
            record.photos.forEach((photo, photoIndex) => {
              const photoType = (photo.type as "before" | "after" | "general") || "general";
              photos.push({
                id: `work-${wo.id}-${recordIndex}-${photoIndex}`,
                url: photo.url,
                type: photoType,
                position: undefined,
                label: `${record.content || "作業"} (${photoType === "before" ? "作業前" : photoType === "after" ? "作業後" : "その他"})`,
              });
            });
          }
        });
      }
    });

    return photos;
  }, [workOrders]);

  // 現在表示中の写真リスト
  const currentPhotos = activeTab === "internal" ? internalPhotos : blogPhotos;
  const selectedPhoto = currentPhotos[selectedPhotoIndex];

  // 前の写真に移動
  const handlePrevious = () => {
    if (selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  // 次の写真に移動
  const handleNext = () => {
    if (selectedPhotoIndex < currentPhotos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  // タブ切り替え時に選択インデックスをリセット
  const handleTabChange = (value: string) => {
    setActiveTab(value as "internal" | "blog");
    setSelectedPhotoIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Camera className="h-5 w-5 shrink-0" />
            写真ギャラリー
          </DialogTitle>
          <DialogDescription className="text-base">
            {customerName && vehicleName
              ? `${customerName}様 - ${vehicleName}`
              : "写真一覧"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal" className="text-base font-medium">
              社内用写真 ({internalPhotos.length}枚)
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-base font-medium">
              ブログ用写真 ({isLoadingBlogPhotos ? "..." : blogPhotos.length}枚)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="flex-1 flex flex-col overflow-hidden mt-4">
            {internalPhotos.length > 0 ? (
              <>
                {/* メイン写真表示エリア */}
                <div className="relative flex-1 min-h-[400px] bg-slate-100 rounded-lg overflow-hidden border border-slate-300">
                  {selectedPhoto && activeTab === "internal" && (
                    <>
                      <Image
                        src={selectedPhoto.url}
                        alt={"label" in selectedPhoto ? selectedPhoto.label : ""}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 800px"
                        unoptimized
                      />
                      {/* 写真情報オーバーレイ */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-semibold">{"label" in selectedPhoto ? selectedPhoto.label : ""}</p>
                            {"type" in selectedPhoto && (
                              <Badge
                                variant={
                                  selectedPhoto.type === "diagnosis"
                                    ? "default"
                                    : selectedPhoto.type === "before"
                                    ? "secondary"
                                    : selectedPhoto.type === "after"
                                    ? "default"
                                    : "outline"
                                }
                                className="mt-1 text-base"
                              >
                                {selectedPhoto.type === "diagnosis"
                                  ? "診断写真"
                                  : selectedPhoto.type === "before"
                                  ? "作業前"
                                  : selectedPhoto.type === "after"
                                  ? "作業後"
                                  : "その他"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-base">
                            {selectedPhotoIndex + 1} / {currentPhotos.length}
                          </p>
                        </div>
                      </div>
                      {/* ナビゲーションボタン */}
                      {currentPhotos.length > 1 && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrevious}
                            disabled={selectedPhotoIndex === 0}
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/90 hover:bg-white"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            disabled={activeTab === "internal" ? selectedPhotoIndex === internalPhotos.length - 1 : selectedPhotoIndex === blogPhotos.length - 1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/90 hover:bg-white"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* サムネイル一覧 */}
                {internalPhotos.length > 1 && (
                  <ScrollArea className="mt-4 h-24">
                    <div className="flex gap-2 pb-2">
                      {internalPhotos.map((photo, index) => (
                        <button
                          key={photo.id}
                          onClick={() => setSelectedPhotoIndex(index)}
                          className={cn(
                            "relative w-24 h-24 rounded overflow-hidden border-2 transition-all shrink-0",
                            selectedPhotoIndex === index
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-slate-300 hover:border-slate-400"
                          )}
                        >
                          <Image
                            src={photo.url}
                            alt={photo.label}
                            fill
                            className="object-cover"
                            sizes="96px"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 py-12">
                <ImageIcon className="h-12 w-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium">社内用写真がありません</p>
                <p className="text-base mt-1">診断写真や作業写真がまだ撮影されていません。</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="blog" className="flex-1 flex flex-col overflow-hidden mt-4">
            {isLoadingBlogPhotos ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-base text-slate-600">ブログ用写真を読み込み中...</p>
                </div>
              </div>
            ) : blogPhotos.length > 0 ? (
              <>
                {/* メイン写真表示エリア */}
                <div className="relative flex-1 min-h-[400px] bg-slate-100 rounded-lg overflow-hidden border border-slate-300">
                  {selectedPhoto && (
                    <>
                      <Image
                        src={(selectedPhoto as BlogPhotoInfo).url}
                        alt={(selectedPhoto as BlogPhotoInfo).fileName}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 800px"
                        unoptimized
                      />
                      {/* 写真情報オーバーレイ */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-base font-semibold">
                              {(selectedPhoto as BlogPhotoInfo).fileName}
                            </p>
                            {(selectedPhoto as BlogPhotoInfo).metadata?.date && (
                              <p className="text-sm mt-1">
                                {(() => {
                                  const date = (selectedPhoto as BlogPhotoInfo).metadata?.date;
                                  if (!date || date.length !== 8) return "";
                                  return `${date.slice(0, 4)}年${date.slice(4, 6)}月${date.slice(6, 8)}日`;
                                })()}
                              </p>
                            )}
                          </div>
                          <p className="text-base">
                            {selectedPhotoIndex + 1} / {blogPhotos.length}
                          </p>
                        </div>
                      </div>
                      {/* ナビゲーションボタン */}
                      {blogPhotos.length > 1 && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrevious}
                            disabled={selectedPhotoIndex === 0}
                            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/90 hover:bg-white"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNext}
                            disabled={selectedPhotoIndex === blogPhotos.length - 1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/90 hover:bg-white"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* サムネイル一覧 */}
                {blogPhotos.length > 1 && (
                  <ScrollArea className="mt-4 h-24">
                    <div className="flex gap-2 pb-2">
                      {blogPhotos.map((photo, index) => (
                        <button
                          key={photo.fileId}
                          onClick={() => setSelectedPhotoIndex(index)}
                          className={cn(
                            "relative w-24 h-24 rounded overflow-hidden border-2 transition-all shrink-0",
                            selectedPhotoIndex === index
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-slate-300 hover:border-slate-400"
                          )}
                        >
                          <Image
                            src={photo.url}
                            alt={photo.fileName}
                            fill
                            className="object-cover"
                            sizes="96px"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 py-12">
                <ImageIcon className="h-12 w-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium">ブログ用写真がありません</p>
                <p className="text-base mt-1">ブログ用写真がまだ撮影されていません。</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            onClick={() => onOpenChange(false)}
            className="h-12 text-base font-medium"
          >
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



