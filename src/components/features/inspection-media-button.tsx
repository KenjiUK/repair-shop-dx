"use client";

/**
 * 点検項目用メディア（写真・動画）撮影ボタンコンポーネント
 * 
 * DESIGN_SYSTEM.md準拠:
 * - ボタンサイズ: h-12 (48px)
 * - フォントサイズ: text-base (16px)
 * - アイコンサイズ: h-5 w-5 (20px)
 * - タッチターゲット: 最小48px × 48px
 */

import { useRef, useState } from "react";
import { Camera, Video, X, Loader2, FileImage, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";

// =============================================================================
// Types
// =============================================================================

interface InspectionMediaButtonProps {
  /** 写真URL配列 */
  photoUrls: string[];
  /** 動画URL配列 */
  videoUrls?: string[];
  /** 動画データ（メタデータ用） */
  videoData?: Array<{
    url: string;
    duration?: number; // 秒
    transcription?: string; // 音声認識テキスト
  }>;
  /** 写真追加ハンドラ */
  onPhotoAdd: (file: File) => Promise<void>;
  /** 動画追加ハンドラ */
  onVideoAdd?: (file: File) => Promise<void>;
  /** 写真削除ハンドラ */
  onPhotoDelete: (index: number) => void;
  /** 動画削除ハンドラ */
  onVideoDelete?: (index: number) => void;
  /** 無効化 */
  disabled?: boolean;
  /** 処理中フラグ */
  isProcessing?: boolean;
  /** 外部からinput要素を制御するためのref（写真用） */
  photoInputRef?: React.RefObject<HTMLInputElement>;
  /** 動画の最大録画時間（秒） */
  maxVideoDuration?: number;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 点検項目用メディア（写真・動画）撮影ボタン
 */
export function InspectionMediaButton({
  photoUrls = [],
  videoUrls = [],
  videoData = [],
  onPhotoAdd,
  onVideoAdd,
  onPhotoDelete,
  onVideoDelete,
  disabled = false,
  isProcessing = false,
  photoInputRef: externalPhotoInputRef,
  maxVideoDuration = 15,
}: InspectionMediaButtonProps) {
  const [isMediaSheetOpen, setIsMediaSheetOpen] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  
  const internalPhotoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = externalPhotoInputRef || internalPhotoInputRef;

  // 写真と動画を統合したメディアリスト
  const mediaItems = [
    ...photoUrls.map((url, index) => ({
      type: 'photo' as const,
      url,
      index,
    })),
    ...videoUrls.map((url, index) => ({
      type: 'video' as const,
      url,
      index,
      duration: videoData[index]?.duration,
    })),
  ].sort((a, b) => {
    // 写真を先に、動画を後に表示
    if (a.type === 'photo' && b.type === 'video') return -1;
    if (a.type === 'video' && b.type === 'photo') return 1;
    return 0;
  });

  const handleMediaAddClick = () => {
    if (disabled || isProcessing) return;
    setIsMediaSheetOpen(true);
  };

  const handlePhotoCapture = async (position: string, file: File) => {
    setIsPhotoProcessing(true);
    try {
      await onPhotoAdd(file);
      setIsMediaSheetOpen(false);
    } catch (error) {
      console.error("写真追加エラー:", error);
    } finally {
      setIsPhotoProcessing(false);
    }
  };

  const handleVideoCapture = async (position: string, file: File, transcription?: string) => {
    if (!onVideoAdd) return;
    
    setIsVideoProcessing(true);
    try {
      await onVideoAdd(file);
      setIsMediaSheetOpen(false);
    } catch (error) {
      console.error("動画追加エラー:", error);
    } finally {
      setIsVideoProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    e.target.value = "";

    if (file.type.startsWith("image/")) {
      await handlePhotoCapture("file", file);
    } else if (file.type.startsWith("video/")) {
      if (onVideoAdd) {
        await handleVideoCapture("file", file);
      }
    }
  };

  const hasMedia = mediaItems.length > 0;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {/* 既存のメディアを表示 */}
        {mediaItems.map((item, displayIndex) => (
          <div key={`${item.type}-${item.index}`} className="relative group aspect-square">
            <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
              {item.type === 'photo' ? (
                <Image
                  src={item.url}
                  alt={`写真 ${item.index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
              ) : (
                <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                  <Video className="h-8 w-8 text-white" />
                  {item.duration && (
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, "0")}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* 削除ボタン */}
            {!disabled && (
              <button
                onClick={() => {
                  if (item.type === 'photo') {
                    onPhotoDelete(item.index);
                  } else if (onVideoDelete) {
                    onVideoDelete(item.index);
                  }
                }}
                disabled={disabled || isProcessing}
                className={cn(
                  "absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white",
                  "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                  "hover:bg-red-600 active:scale-95 shadow-lg z-10",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-label={`${item.type === 'photo' ? '写真' : '動画'}を削除`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {/* メディアタイプアイコン（左上） */}
            <div className="absolute top-1 left-1 bg-black/70 rounded px-1.5 py-0.5">
              {item.type === 'photo' ? (
                <Camera className="h-3 w-3 text-white" />
              ) : (
                <Video className="h-3 w-3 text-white" />
              )}
            </div>
          </div>
        ))}

        {/* メディア追加ボタン（既存のメディアと同じサイズ） */}
        <button
          onClick={handleMediaAddClick}
          disabled={disabled || isProcessing}
          className={cn(
            "relative aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-50",
            "flex flex-col items-center justify-center gap-2",
            "hover:bg-slate-100 hover:border-slate-400 hover:border-solid transition-all",
            "dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:border-slate-500",
            "active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
            (disabled || isProcessing) && "opacity-50 cursor-not-allowed"
          )}
          aria-label="メディアを追加"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-slate-600 dark:text-white" />
              <span className="text-base text-slate-600 dark:text-white">処理中...</span>
            </>
          ) : (
            <>
              <Plus className="h-6 w-6 text-slate-600 dark:text-white" />
              <span className="text-base font-medium text-slate-700 text-center dark:text-white">
                写真や動画を追加
              </span>
            </>
          )}
        </button>
      </div>

      {/* メディア選択シート - DESIGN_SYSTEM.md準拠（40歳以上ユーザー向け最適化） */}
      <Sheet open={isMediaSheetOpen} onOpenChange={setIsMediaSheetOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] p-0 rounded-t-2xl dark:bg-slate-900 dark:border-slate-700">
          <SheetHeader className="px-4 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
            <SheetTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              メディアを追加
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-600 mt-1.5 dark:text-white">
              写真または動画を選択してください
            </SheetDescription>
          </SheetHeader>
          
          <div className="px-4 py-4 pb-6 space-y-3 dark:bg-slate-900">
            {/* 写真を撮影 - プライマリアクション（青系） */}
            <Button
              type="button"
              onClick={() => {
                photoInputRef.current?.click();
              }}
              disabled={disabled || isPhotoProcessing}
              className="w-full h-16 text-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPhotoProcessing ? (
                <>
                  <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <Camera className="h-6 w-6 mr-2" />
                  写真を撮影
                </>
              )}
            </Button>
            <input
              ref={(node) => {
                if (internalPhotoInputRef) {
                  (internalPhotoInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
                }
                if (externalPhotoInputRef && node) {
                  (externalPhotoInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
                }
              }}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
              disabled={disabled || isPhotoProcessing}
            />

            {/* 動画・ファイル選択 - セカンダリアクション */}
            <div className={cn(
              "grid gap-3",
              onVideoAdd ? "grid-cols-2" : "grid-cols-1"
            )}>
              {/* 動画を録画 */}
              {onVideoAdd && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "video/*";
                    input.capture = "environment";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      setIsVideoProcessing(true);
                      try {
                        await handleVideoCapture("file", file);
                      } finally {
                        setIsVideoProcessing(false);
                      }
                    };
                    input.click();
                  }}
                  disabled={disabled || isVideoProcessing}
                  className="h-16 text-base font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                >
                  {isVideoProcessing ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <Video className="h-6 w-6 mr-2" />
                      動画を録画
                    </>
                  )}
                </Button>
              )}

              {/* ファイルから選択 */}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*,video/*";
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    
                    if (file.type.startsWith("image/")) {
                      await handlePhotoCapture("file", file);
                    } else if (file.type.startsWith("video/") && onVideoAdd) {
                      await handleVideoCapture("file", file);
                    }
                  };
                  input.click();
                }}
                disabled={disabled || isPhotoProcessing || isVideoProcessing}
                className="h-16 text-base font-semibold border-2 border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
              >
                <FileImage className="h-6 w-6 mr-2" />
                ファイルから選択
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

