"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceInputButtonProps {
  /** 音声入力の結果を反映するコールバック */
  onTranscript: (text: string) => void;
  /** 現在のテキスト値（既存のテキストに追加する場合に使用） */
  currentValue?: string;
  /** 無効化 */
  disabled?: boolean;
  /** カスタムクラス */
  className?: string;
  /** 言語設定（デフォルト: "ja-JP"） */
  language?: string;
}

/**
 * YouTube風のマイク入力ボタンコンポーネント
 * Web Speech APIを使用して音声入力を実装
 */
export function VoiceInputButton({
  onTranscript,
  currentValue = "",
  disabled = false,
  className,
  language = "ja-JP",
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Web Speech APIのサポート確認
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  // 音声認識の開始
  const startListening = () => {
    if (!isSupported) {
      toast.error("お使いのブラウザでは音声入力に対応していません");
      return;
    }

    if (disabled) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = language;
      recognition.continuous = true; // 連続認識
      recognition.interimResults = true; // 中間結果も取得

      // 認識結果の処理
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // 最終結果がある場合、既存のテキストに追加
        if (finalTranscript) {
          const newText = currentValue 
            ? `${currentValue}${currentValue.endsWith("。") || currentValue.endsWith(".") ? "" : " "}${finalTranscript}`
            : finalTranscript;
          onTranscript(newText);
        }
      };

      // エラーハンドリング
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        
        if (event.error === "no-speech") {
          toast.info("音声が検出されませんでした");
        } else if (event.error === "audio-capture") {
          toast.error("マイクへのアクセスができません");
        } else if (event.error === "not-allowed") {
          toast.error("マイクの使用が許可されていません");
        } else {
          toast.error(`音声認識エラー: ${event.error}`);
        }
        
        setIsListening(false);
      };

      // 認識終了時の処理
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      
      toast.success("音声入力を開始しました", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      toast.error("音声認識の開始に失敗しました");
      setIsListening(false);
    }
  };

  // 音声認識の停止
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    toast.info("音声入力を停止しました", {
      duration: 2000,
    });
  };

  // ボタンのクリック処理
  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // コンポーネントのアンマウント時に音声認識を停止
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!isSupported) {
    return null; // サポートされていない場合は何も表示しない
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "h-16 w-16 shrink-0 rounded-full flex items-center justify-center transition-all",
        "border-2 shadow-sm",
        isListening 
          ? "bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-md dark:bg-red-600 dark:hover:bg-red-700 dark:border-red-700" 
          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer",
        className
      )}
      aria-label={isListening ? "音声入力を停止" : "音声入力を開始"}
      title={isListening ? "音声入力を停止" : "音声入力を開始"}
    >
      {isListening ? (
        <MicOff className="h-7 w-7" />
      ) : (
        <Mic className="h-7 w-7" />
      )}
    </button>
  );
}

// Web Speech APIの型定義
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

