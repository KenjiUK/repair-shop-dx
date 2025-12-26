"use client";

import React, { useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { compressImage, addWatermark, convertToAspectRatio32, saveImageToLocal } from "@/lib/compress";

// =============================================================================
// 型定義
// =============================================================================

export type PhotoPosition = "front" | "rear" | "left" | "right" | "detail" | "before" | "after" | string;

export interface PhotoData {
  position?: PhotoPosition;
  file?: File;
  previewUrl?: string;
  isCompressing?: boolean;
  error?: string;
}

export interface PhotoCaptureButtonProps {
  /** 撮影位置 */
  position: PhotoPosition;
  /** ラベル（表示名） */
  label: string;
  /** 写真データ */
  photoData?: PhotoData;
  /** 撮影時のコールバック */
  onCapture: (position: PhotoPosition, file: File) => void | Promise<void>;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
  /** サイズ */
  size?: "sm" | "default" | "lg";
  /** カメラモード（environment: 背面カメラ, user: 前面カメラ） */
  cameraMode?: "environment" | "user";
}

// =============================================================================
// コンポーネント
// =============================================================================

/**
 * 写真撮影ボタンコンポーネント
 *
 * 機能:
 * - カメラ起動（モバイル対応）
 * - 画像自動圧縮（500KB以下）
 * - プレビュー表示
 * - ローディング状態表示
 */
export function PhotoCaptureButton({
  position,
  label,
  photoData,
  onCapture,
  disabled = false,
  className,
  size = "default",
  cameraMode = "environment",
}: PhotoCaptureButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = () => {
    if (disabled || isProcessing || photoData?.isCompressing) {
      return;
    }
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // ファイルリセット（同じファイルを再度選択できるように）
    e.target.value = "";

    // ファイル形式チェック
    if (!file.type.startsWith("image/")) {
      console.error("画像ファイルを選択してください");
      return;
    }

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      console.error("ファイルサイズが5MBを超えています");
      return;
    }

    setIsProcessing(true);

    try {
      // 処理フロー: アスペクト比変換 → ウォーターマーク合成 → 画像圧縮
      const aspect32File = await convertToAspectRatio32(file);
      const watermarkedFile = await addWatermark(aspect32File);
      const compressedFile = await compressImage(watermarkedFile);

      // ローカル端末に保存
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const localFileName = `${position}_${timestamp}.jpg`;
        await saveImageToLocal(compressedFile, localFileName);
      } catch (localSaveError) {
        // ローカル保存のエラーは無視（処理は続行）
        console.warn("ローカル保存に失敗しました（処理は続行されます）:", localSaveError);
      }

      // コールバック実行
      await onCapture(position, compressedFile);
    } catch (error) {
      console.error("写真処理エラー:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasPhoto = !!photoData?.previewUrl;
  const isCompressing = photoData?.isCompressing || isProcessing;

  const sizeClasses = {
    sm: "h-16 text-base",
    default: "h-24 text-base",
    lg: "h-32 text-base",
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={cameraMode}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isCompressing}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isCompressing || disabled}
        className={cn(
          "w-full rounded-xl border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center gap-1",
          "active:scale-95",
          sizeClasses[size],
          hasPhoto
            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
            : "border-slate-300 bg-slate-50 hover:border-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800",
          (isCompressing || disabled) && "opacity-50 cursor-wait"
        )}
      >
        {isCompressing ? (
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="h-6 w-6 animate-spin text-slate-700" />
            <span className="text-base text-slate-700">圧縮中...</span>
          </div>
        ) : hasPhoto ? (
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-6 w-6 text-green-700 dark:text-green-400" />
            <span className="font-medium text-green-700 dark:text-green-300">{label}</span>
            <span className="text-base text-green-700 dark:text-green-500">撮影済み ✓</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Camera className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
          </div>
        )}
      </button>

      {hasPhoto && photoData?.previewUrl && (
        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-lg overflow-hidden border-2 border-white dark:border-slate-800 shadow-md">
          <Image
            src={photoData.previewUrl}
            alt={label}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
