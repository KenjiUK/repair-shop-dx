"use client";

/**
 * 点検項目用写真撮影ボタンコンポーネント
 * 
 * 診断画面のPhotoCaptureButtonを参考に、点検項目用に最適化
 */

import { useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

// =============================================================================
// Types
// =============================================================================

interface InspectionPhotoButtonProps {
  /** 写真URL配列 */
  photoUrls: string[];
  /** 写真追加ハンドラ */
  onPhotoAdd: (file: File) => Promise<void>;
  /** 写真削除ハンドラ */
  onPhotoDelete: (index: number) => void;
  /** 無効化 */
  disabled?: boolean;
  /** 処理中フラグ */
  isProcessing?: boolean;
  /** 外部からinput要素を制御するためのref */
  inputRef?: React.RefObject<HTMLInputElement>;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 点検項目用写真撮影ボタン
 */
export function InspectionPhotoButton({
  photoUrls = [],
  onPhotoAdd,
  onPhotoDelete,
  disabled = false,
  isProcessing = false,
  inputRef: externalInputRef,
}: InspectionPhotoButtonProps) {
  const internalInputRef = useRef<HTMLInputElement>(null);
  // 外部からrefが渡された場合はそれを使用、なければ内部のrefを使用
  const inputRef = externalInputRef || internalInputRef;
  
  // 外部refと内部refを同期（useCallbackを使わず、直接refを使用）

  const handleClick = () => {
    if (disabled || isProcessing) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onPhotoAdd(file);
    }
    e.target.value = "";
  };

  const hasPhotos = photoUrls.length > 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* 既存の写真を表示 */}
      {photoUrls.map((url, index) => (
        <div key={index} className="relative group aspect-square">
          <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100">
            <Image
              src={url}
              alt={`写真 ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
            />
          </div>
          {/* 削除ボタン */}
          {!disabled && (
            <button
              onClick={() => onPhotoDelete(index)}
              disabled={disabled || isProcessing}
              className={cn(
                "absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white",
                "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-red-600 active:scale-95 shadow-lg z-10",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label="写真を削除"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {/* 写真追加ボタン（既存の写真と同じサイズ） */}
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={cn(
          "relative aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-50",
          "flex flex-col items-center justify-center gap-2",
          "hover:bg-slate-100 hover:border-slate-400 hover:border-solid transition-all",
          "active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          (disabled || isProcessing) && "opacity-50 cursor-not-allowed"
        )}
        aria-label="写真を追加"
      >
        <input
          ref={(node) => {
            // 内部refに設定
            if (internalInputRef) {
              (internalInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
            // 外部refにも設定
            if (externalInputRef && node) {
              (externalInputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
          }}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isProcessing}
        />
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
            <span className="text-sm text-slate-600">処理中...</span>
          </>
        ) : (
          <>
            <Camera className="h-5 w-5 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">
              写真を追加
            </span>
          </>
        )}
      </button>
    </div>
  );
}

