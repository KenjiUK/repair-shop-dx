"use client";

import React, { useRef, useState, useEffect } from "react";
import { Mic, MicOff, Loader2, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// 型定義
// =============================================================================

export type AudioPosition = "diagnosis" | "work" | "comment" | string;

export interface AudioData {
  position?: AudioPosition;
  file?: Blob;
  audioUrl?: string;
  isRecording?: boolean;
  isProcessing?: boolean;
  duration?: number; // 秒
  error?: string;
  transcript?: string; // 音声認識結果（将来の実装）
}

export interface AudioInputButtonProps {
  /** 録音位置 */
  position: AudioPosition;
  /** ラベル（表示名） */
  label: string;
  /** 音声データ */
  audioData?: AudioData;
  /** 録音開始時のコールバック */
  onStartRecording?: (position: AudioPosition) => void;
  /** 録音停止時のコールバック */
  onStopRecording: (position: AudioPosition, audioBlob: Blob) => void | Promise<void>;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
  /** 最大録音時間（秒） */
  maxDuration?: number; // デフォルト: 60秒
}

// =============================================================================
// コンポーネント
// =============================================================================

/**
 * 音声入力ボタンコンポーネント
 *
 * 機能:
 * - 音声録音（ブラウザのMediaRecorder APIを使用）
 * - 最大録音時間制限
 * - 録音中の視覚的フィードバック
 * - 録音済み音声の再生
 * - 音声認識（将来の実装: OpenAI Whisper API等）
 */
export function AudioInputButton({
  position,
  label,
  audioData,
  onStartRecording,
  onStopRecording,
  disabled = false,
  className,
  maxDuration = 60,
}: AudioInputButtonProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 録音時間のタイマー
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            handleStopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, maxDuration]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const handleStartRecording = async () => {
    if (disabled || isRecording || audioData?.isRecording) {
      return;
    }

    try {
      // マイクへのアクセスを要求
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // MediaRecorderを作成
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // ストリームを停止
        stream.getTracks().forEach((track) => track.stop());

        // 音声Blobを作成
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        setIsProcessing(true);

        try {
          await onStopRecording(position, audioBlob);
        } catch (error) {
          console.error("音声処理エラー:", error);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      onStartRecording?.(position);
    } catch (error) {
      console.error("マイクアクセスエラー:", error);
      alert("マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePlayAudio = () => {
    if (audioData?.audioUrl && audioRef.current) {
      audioRef.current.play();
    }
  };

  const hasAudio = !!audioData?.audioUrl;
  const isRecordingState = isRecording || audioData?.isRecording;
  const isProcessingState = isProcessing || audioData?.isProcessing;

  return (
    <div className={cn("relative", className)}>
      <audio ref={audioRef} src={audioData?.audioUrl} className="hidden" />
      <button
        type="button"
        onClick={isRecordingState ? handleStopRecording : handleStartRecording}
        disabled={isProcessingState || disabled}
        className={cn(
          "w-full h-24 rounded-xl border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center gap-1",
          "active:scale-95",
          hasAudio
            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
            : isRecordingState
            ? "border-red-500 bg-red-50 dark:bg-red-950/20 animate-pulse"
            : "border-slate-300 bg-slate-50 hover:border-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:bg-slate-800",
          (isProcessingState || disabled) && "opacity-50 cursor-wait"
        )}
      >
        {isProcessingState ? (
          <div className="flex flex-col items-center gap-1">
            <Loader2 className="h-6 w-6 animate-spin text-slate-700" />
            <span className="text-base text-slate-700">処理中...</span>
          </div>
        ) : isRecordingState ? (
          <div className="flex flex-col items-center gap-1">
            <div className="relative">
              <Mic className="h-6 w-6 text-red-700 dark:text-red-400 animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            </div>
            <span className="text-base font-medium text-red-700 dark:text-red-300">
              🎤 録音中...
            </span>
            <span className="text-base text-red-700 dark:text-red-500">
              {recordingTime}秒 / {maxDuration}秒
            </span>
          </div>
        ) : hasAudio ? (
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-6 w-6 text-purple-700 dark:text-purple-400" />
            <span className="text-base font-medium text-purple-700 dark:text-purple-300">
              {label}
            </span>
            <span className="text-base text-purple-700 dark:text-purple-500">録音済み ✓</span>
            {audioData?.duration && (
              <span className="text-base text-purple-700 dark:text-purple-500">
                {Math.round(audioData.duration)}秒
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Mic className="h-6 w-6 text-slate-700 dark:text-slate-300" />
            <span className="text-base font-medium text-slate-800 dark:text-slate-300">
              🎤 {label}
            </span>
            <span className="text-base text-slate-700 dark:text-slate-300">
              タップで録音開始
            </span>
          </div>
        )}
      </button>

      {hasAudio && audioData?.audioUrl && (
        <div className="absolute -top-2 -right-2 flex gap-1">
          <button
            type="button"
            onClick={handlePlayAudio}
            className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md hover:bg-purple-600 transition-colors"
            title="再生"
          >
            <span className="text-base">▶</span>
          </button>
        </div>
      )}
    </div>
  );
}
