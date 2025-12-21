"use client";

import React, { useRef, useState } from "react";
import { Video, CheckCircle2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// 型定義
// =============================================================================

export type VideoPosition = "diagnosis" | "work" | "evidence" | string;

export interface VideoData {
  position?: VideoPosition;
  file?: File;
  previewUrl?: string;
  isProcessing?: boolean;
  error?: string;
  duration?: number; // 秒
}

export interface VideoCaptureButtonProps {
  /** 撮影位置 */
  position: VideoPosition;
  /** ラベル（表示名） */
  label: string;
  /** 動画データ */
  videoData?: VideoData;
  /** 撮影時のコールバック */
  onCapture: (position: VideoPosition, file: File) => void | Promise<void>;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
  /** 最大録画時間（秒） */
  maxDuration?: number; // デフォルト: 15秒
  /** 最大ファイルサイズ（MB） */
  maxSizeMB?: number; // デフォルト: 10MB
  /** カメラモード（environment: 背面カメラ, user: 前面カメラ） */
  cameraMode?: "environment" | "user";
  /** 録画中のコールバック（リアルタイム録画用） */
  onRecording?: (isRecording: boolean) => void;
  /** 録画完了時のコールバック（Blobを返す） */
  onRecordComplete?: (position: VideoPosition, blob: Blob) => void | Promise<void>;
}

// =============================================================================
// コンポーネント
// =============================================================================

/**
 * 動画撮影ボタンコンポーネント
 *
 * 機能:
 * - カメラ起動（モバイル対応）
 * - 最大録画時間制限（デフォルト: 15秒）
 * - ファイルサイズチェック（デフォルト: 10MB）
 * - プレビュー表示
 * - ローディング状態表示
 */
export function VideoCaptureButton({
  position,
  label,
  videoData,
  onCapture,
  disabled = false,
  className,
  maxDuration = 15,
  maxSizeMB = 10,
  cameraMode = "environment",
  onRecording,
  onRecordComplete,
}: VideoCaptureButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const handleClick = () => {
    if (disabled || isProcessing || videoData?.isProcessing) {
      return;
    }
    inputRef.current?.click();
  };

  /**
   * リアルタイム録画を開始
   */
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraMode },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });

      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        // ファイルサイズチェック
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (blob.size > maxSizeBytes) {
          toast.error(`ファイルサイズが${maxSizeMB}MBを超えています`);
          return;
        }

        // ストリームを停止
        stream.getTracks().forEach((track) => track.stop());

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // コールバック実行
        if (onRecordComplete) {
          setIsProcessing(true);
          try {
            await onRecordComplete(position, blob);
          } catch (error) {
            console.error("録画完了処理エラー:", error);
          } finally {
            setIsProcessing(false);
          }
        }

        // Fileオブジェクトに変換してonCaptureも呼び出す
        const file = new File([blob], `video-${position}-${Date.now()}.webm`, {
          type: "video/webm",
        });
        await onCapture(position, file);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      onRecording?.(true);

      // 録画時間のカウント
      const timer = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            handleStopRecording();
            clearInterval(timer);
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error("録画開始エラー:", error);
      toast.error("カメラへのアクセスに失敗しました");
    }
  };

  /**
   * リアルタイム録画を停止
   */
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecording?.(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // ファイルリセット
    e.target.value = "";

    // ファイル形式チェック
    if (!file.type.startsWith("video/")) {
      console.error("動画ファイルを選択してください");
      return;
    }

    // ファイルサイズチェック
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      console.error(`ファイルサイズが${maxSizeMB}MBを超えています`);
      return;
    }

    setIsProcessing(true);

    try {
      // コールバック実行
      await onCapture(position, file);
    } catch (error) {
      console.error("動画処理エラー:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasVideo = !!videoData?.previewUrl;
  const isProcessingState = videoData?.isProcessing || isProcessing;

  const handleButtonClick = () => {
    if (isRecording) {
      handleStopRecording();
    } else if (onRecordComplete) {
      // リアルタイム録画モード
      handleStartRecording();
    } else {
      // ファイル選択モード
      handleClick();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture={cameraMode}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isProcessingState || isRecording}
      />
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isProcessingState || disabled}
        className={cn(
          "w-full h-24 rounded-xl border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center gap-1",
          "active:scale-95",
          hasVideo
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800",
          (isProcessingState || disabled) && "opacity-50 cursor-wait"
        )}
      >
        {isRecording ? (
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse" />
              <div className="absolute inset-0 w-6 h-6 rounded-full border-2 border-red-600 animate-ping" />
            </div>
            <span className="text-sm font-medium text-red-700">録画中</span>
            <span className="text-xs text-red-600">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, "0")} / {Math.floor(maxDuration / 60)}:{(maxDuration % 60).toString().padStart(2, "0")}
            </span>
          </div>
        ) : isProcessingState ? (
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            <span className="text-xs text-slate-500">処理中...</span>
          </div>
        ) : hasVideo ? (
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{label}</span>
            <span className="text-xs text-blue-600 dark:text-blue-400">録画済み ✓</span>
            {videoData?.duration && (
              <span className="text-xs text-blue-500 dark:text-blue-400">
                {Math.round(videoData.duration)}秒
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Video className="h-6 w-6 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              🎥 {label}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              最大{maxDuration}秒
            </span>
          </div>
        )}
      </button>

      {hasVideo && videoData?.previewUrl && (
        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-lg overflow-hidden border-2 border-white dark:border-slate-800 shadow-md bg-slate-900 flex items-center justify-center">
          <Video className="h-6 w-6 text-white" />
        </div>
      )}
    </div>
  );
}
