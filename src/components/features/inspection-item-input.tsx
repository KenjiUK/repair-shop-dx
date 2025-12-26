"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TrafficLightButtonGroup, TrafficLightStatus } from "./traffic-light-button";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { VideoCaptureButton, VideoData } from "./video-capture-button";
import { InspectionItem, MeasurementDefinition } from "@/lib/inspection-items";
import { Camera, Video, MessageSquare, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// =============================================================================
// Props
// =============================================================================

interface InspectionItemInputProps {
  /** 検査項目 */
  item: InspectionItem;
  /** 状態変更ハンドラ */
  onStatusChange: (itemId: string, status: TrafficLightStatus) => void;
  /** 測定値変更ハンドラ */
  onMeasurementChange?: (itemId: string, value: number) => void;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (itemId: string, file: File) => void | Promise<void>;
  /** 動画撮影ハンドラ（音声認識テキスト付き） */
  onVideoCapture?: (itemId: string, file: File, transcription?: string) => void | Promise<void>;
  /** コメント変更ハンドラ */
  onCommentChange?: (itemId: string, comment: string) => void;
  /** 写真データ */
  photoData?: PhotoData;
  /** 動画データ */
  videoData?: VideoData;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function InspectionItemInput({
  item,
  onStatusChange,
  onMeasurementChange,
  onPhotoCapture,
  onVideoCapture,
  onCommentChange,
  photoData,
  videoData,
  disabled = false,
}: InspectionItemInputProps) {
  const [showCommentInput, setShowCommentInput] = useState(!!item.comment);
  const [comment, setComment] = useState(item.comment || "");
  const [measurementValue, setMeasurementValue] = useState<string>(
    item.measurementValue?.toString() || ""
  );

  // 利用可能な状態を決定（基本はOK/注意/要交換、必要に応じて調整/清掃/省略/該当なしを追加）
  const availableStatuses: TrafficLightStatus[] = item.measurement
    ? ["green", "yellow", "red", "adjust", "clean"]
    : ["green", "yellow", "red", "adjust", "clean", "skip", "not_applicable"];

  // 測定値入力ハンドラ
  const handleMeasurementChange = (value: string) => {
    setMeasurementValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && onMeasurementChange) {
      onMeasurementChange(item.id, numValue);
    }
  };

  // コメント保存ハンドラ
  const handleCommentSave = () => {
    if (onCommentChange) {
      onCommentChange(item.id, comment);
    }
    if (!comment.trim()) {
      setShowCommentInput(false);
    }
  };

  // 写真撮影ハンドラ
  const handlePhotoCapture = async (position: string, file: File) => {
    if (onPhotoCapture) {
      await onPhotoCapture(item.id, file);
    }
  };

  // 動画撮影ハンドラ（不具合時のみ、音声認識対応）
  const handleVideoCapture = async (position: string, file: File, transcription?: string) => {
    if (onVideoCapture && (item.status === "yellow" || item.status === "red")) {
      await onVideoCapture(item.id, file, transcription);
    }
  };

  // 測定値の警告判定
  const getMeasurementWarning = (
    value: number,
    measurement: MeasurementDefinition
  ): "ok" | "warning" | "critical" | null => {
    if (!measurement) return null;

    if (
      measurement.replacementThreshold !== undefined &&
      value <= measurement.replacementThreshold
    ) {
      return "critical";
    }
    if (
      measurement.warningThreshold !== undefined &&
      value <= measurement.warningThreshold
    ) {
      return "warning";
    }
    return "ok";
  };

  const measurementWarning =
    item.measurement && measurementValue
      ? getMeasurementWarning(parseFloat(measurementValue), item.measurement)
      : null;

  return (
      <Card id={`diagnosis-item-${item.id}`} className="border border-slate-300 rounded-xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center justify-between">
          <span>{item.name}</span>
          {item.skipRule && (
            <Badge variant="outline" className="ml-2 text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap">
              {item.skipRule}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状態選択ボタン */}
        <TrafficLightButtonGroup
          currentStatus={item.status as TrafficLightStatus}
          onStatusChange={(status) => onStatusChange(item.id, status)}
          availableStatuses={availableStatuses}
          disabled={disabled}
          size="md"
          showLabel={true}
        />

        {/* 測定値入力（測定が必要な場合） */}
        {item.measurement && (
          <div className="space-y-2">
            <label className="text-base font-medium text-slate-800">
              測定値
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={measurementValue}
                onChange={(e) => handleMeasurementChange(e.target.value)}
                placeholder="数値を入力"
                min={item.measurement?.min}
                max={item.measurement?.max}
                disabled={disabled}
                className={cn(
                  "flex-1",
                  measurementWarning === "critical" && "border-red-500",
                  measurementWarning === "warning" && "border-amber-500" // yellow → amber (40歳以上ユーザー向け、統一)
                )}
              />
              <span className="text-base text-slate-800 break-words sm:whitespace-nowrap">
                {item.measurement.unit}
              </span>
            </div>
            {item.measurement.recommended && (
              <p className="text-base text-slate-700">
                推奨値: {item.measurement.recommended}
                {item.measurement.unit}
              </p>
            )}
            {measurementWarning === "critical" && (
              <p className="text-base text-red-700 font-medium">
                ⚠️ 交換推奨（{item.measurement.replacementThreshold}
                {item.measurement.unit}以下）
              </p>
            )}
            {measurementWarning === "warning" && (
              <p className="text-base text-amber-900 font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                注意（{item.measurement.warningThreshold}
                {item.measurement.unit}以下）
              </p>
            )}
          </div>
        )}

        {/* 写真・動画・コメント */}
        <div className="flex flex-wrap gap-2">
          {/* 写真撮影ボタン */}
          <PhotoCaptureButton
            position={item.id}
            label="写真"
            photoData={photoData}
            onCapture={handlePhotoCapture}
            disabled={disabled}
          />

          {/* 動画撮影ボタン（不具合時のみ、最大15秒） */}
          {item.requiresVideo &&
            (item.status === "yellow" || item.status === "red") && (
              <VideoCaptureButton
                position={item.id}
                label="実況解説動画"
                videoData={videoData}
                enableTranscription={true}
                onCapture={handleVideoCapture}
                disabled={disabled}
                maxDuration={item.maxVideoDuration || 15}
              />
            )}

          {/* コメント入力ボタン */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCommentInput(!showCommentInput)}
            disabled={disabled}
            className="flex items-center gap-1.5 h-12 text-base font-medium"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            コメント
            {item.comment && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-base font-medium shrink-0 whitespace-nowrap">
                1
              </Badge>
            )}
          </Button>
        </div>

        {/* コメント入力エリア */}
        {showCommentInput && (
          <div className="space-y-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={handleCommentSave}
              placeholder="コメントを入力..."
              disabled={disabled}
              rows={2}
              className="text-base"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setComment("");
                  setShowCommentInput(false);
                  if (onCommentChange) {
                    onCommentChange(item.id, "");
                  }
                }}
                disabled={disabled}
                className="h-12 text-base font-medium"
              >
                <X className="h-4 w-4 mr-1.5 shrink-0" />
                クリア
              </Button>
            </div>
          </div>
        )}

        {/* 写真プレビュー */}
        {photoData?.previewUrl && (
          <div className="flex gap-2 flex-wrap">
            {photoData.previewUrl && (
              <div className="relative w-24 h-24 rounded border overflow-hidden">
                <Image
                  src={photoData.previewUrl}
                  alt="写真プレビュー"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
        )}

        {/* 動画プレビュー */}
        {videoData?.previewUrl && (
          <div className="relative w-full rounded border overflow-hidden">
            <video
              src={videoData.previewUrl}
              controls
              className="w-full max-h-48"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
