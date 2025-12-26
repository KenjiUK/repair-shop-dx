"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { VideoCaptureButton, VideoData } from "./video-capture-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BodyPart,
  DamageType,
  DamageSeverity,
  BODY_PARTS,
  DAMAGE_TYPES,
  DAMAGE_SEVERITIES,
  OrderMethod,
  ORDER_METHODS,
} from "@/lib/body-paint-config";
import { Camera, Video, MessageSquare, Car, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// 型定義
// =============================================================================

export interface DamageLocation {
  /** 部位ID */
  id: string;
  /** 部位 */
  location: BodyPart;
  /** 損傷の種類 */
  type: DamageType;
  /** 損傷の程度 */
  severity: DamageSeverity;
  /** Before写真URLリスト */
  photoUrls?: string[];
  /** Before動画URL */
  videoUrl?: string;
  /** コメント */
  comment?: string;
}

export interface VendorEstimate {
  /** 外注先名 */
  vendorName: string;
  /** 見積もり項目（簡易版：テキスト入力） */
  estimateText?: string;
  /** 見積金額 */
  total?: number;
  /** 見積もり回答日時 */
  responseDate?: string;
  /** 備考 */
  note?: string;
}

// =============================================================================
// Props
// =============================================================================

interface BodyPaintDiagnosisViewProps {
  /** 損傷箇所リスト */
  damageLocations: DamageLocation[];
  /** 損傷箇所追加ハンドラ */
  onAddDamageLocation?: () => void;
  /** 損傷箇所削除ハンドラ */
  onRemoveDamageLocation?: (id: string) => void;
  /** 損傷箇所変更ハンドラ */
  onDamageLocationChange?: (id: string, location: Partial<DamageLocation>) => void;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (locationId: string, file: File) => void | Promise<void>;
  /** 動画撮影ハンドラ（音声認識テキスト付き） */
  onVideoCapture?: (locationId: string, file: File, transcription?: string) => void | Promise<void>;
  /** 写真データマップ */
  photoDataMap?: Record<string, PhotoData>;
  /** 動画データマップ */
  videoDataMap?: Record<string, VideoData>;
  /** 外注先への見積もり依頼方法 */
  estimateRequestMethod?: OrderMethod | null;
  /** 見積もり依頼方法変更ハンドラ */
  onEstimateRequestMethodChange?: (method: OrderMethod | null) => void;
  /** 外注先からの見積もり回答 */
  vendorEstimate?: VendorEstimate | null;
  /** 外注先見積もり回答変更ハンドラ */
  onVendorEstimateChange?: (estimate: VendorEstimate | null) => void;
  /** コメント */
  comments?: string;
  /** コメント変更ハンドラ */
  onCommentsChange?: (comments: string) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 初期状態の損傷箇所を取得
 */
export function createInitialDamageLocation(): DamageLocation {
  return {
    id: `damage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    location: "ボンネット",
    type: "板金・塗装",
    severity: "軽微",
    photoUrls: [],
    comment: "",
  };
}

// =============================================================================
// Component
// =============================================================================

export function BodyPaintDiagnosisView({
  damageLocations,
  onAddDamageLocation,
  onRemoveDamageLocation,
  onDamageLocationChange,
  onPhotoCapture,
  onVideoCapture,
  photoDataMap = {},
  videoDataMap = {},
  estimateRequestMethod,
  onEstimateRequestMethodChange,
  vendorEstimate,
  onVendorEstimateChange,
  comments,
  onCommentsChange,
  disabled = false,
}: BodyPaintDiagnosisViewProps) {
  return (
    <div className="space-y-4">
      {/* 損傷箇所の確認 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
            <span className="flex items-center gap-2">
              <Car className="h-5 w-5 shrink-0" />
              損傷箇所の確認
            </span>
            <Badge variant="secondary" className="text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap">
              <span className="tabular-nums">{damageLocations.length}</span>箇所
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 損傷箇所リスト */}
          <div className="space-y-3">
            {damageLocations.map((damage) => {
              const photoData = photoDataMap[damage.id] || {
                position: damage.id,
                file: null,
                previewUrl: null,
                isCompressing: false,
              };
              const videoData = videoDataMap[damage.id] || {
                position: damage.id,
                file: null,
                previewUrl: null,
                duration: 0,
                isProcessing: false,
              };

              return (
                <Card
                  key={damage.id}
                  className="border border-slate-300 rounded-xl shadow-md"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
                      <span>損傷箇所 #{damageLocations.indexOf(damage) + 1}</span>
                      {onRemoveDamageLocation && (
                        <Button
                          variant="ghost"
                          onClick={() => onRemoveDamageLocation(damage.id)}
                          disabled={disabled}
                          className="h-12 w-12 p-0 shrink-0"
                        >
                          <X className="h-4 w-4 shrink-0" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    {/* 部位選択 */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">部位</Label>
                    <Select
                      value={damage.location}
                      onValueChange={(value) => {
                        if (onDamageLocationChange) {
                          onDamageLocationChange(damage.id, {
                            location: value as BodyPart,
                          });
                        }
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BODY_PARTS.map((part) => (
                          <SelectItem key={part} value={part}>
                            {part}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    {/* 損傷の種類と程度 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">損傷の種類</Label>
                      <Select
                        value={damage.type}
                        onValueChange={(value) => {
                          if (onDamageLocationChange) {
                            onDamageLocationChange(damage.id, {
                              type: value as DamageType,
                            });
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAMAGE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">損傷の程度</Label>
                      <Select
                        value={damage.severity}
                        onValueChange={(value) => {
                          if (onDamageLocationChange) {
                            onDamageLocationChange(damage.id, {
                              severity: value as DamageSeverity,
                            });
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAMAGE_SEVERITIES.map((severity) => (
                            <SelectItem key={severity} value={severity}>
                              {severity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                    {/* Before写真撮影（必須） */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-700">
                        <Camera className="h-4 w-4 shrink-0" />
                        <span>Before写真（必須）</span>
                      </div>
                    <PhotoCaptureButton
                      position={damage.id}
                      label={`${damage.location}のBefore写真を撮影`}
                      photoData={photoData}
                      onCapture={async (position, file) => {
                        if (onPhotoCapture) {
                          await onPhotoCapture(damage.id, file);
                        }
                      }}
                      disabled={disabled}
                    />
                  </div>

                    {/* Before動画撮影（必須） */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-700">
                        <Video className="h-4 w-4 shrink-0" />
                        <span>Before動画（必須）</span>
                      </div>
                    <VideoCaptureButton
                      position={damage.id}
                      label={`${damage.location}のBefore動画を撮影（実況解説付き）`}
                      videoData={videoData}
                      enableTranscription={true}
                      onCapture={async (position, file, transcription) => {
                        if (onVideoCapture) {
                          await onVideoCapture(damage.id, file, transcription);
                        }
                      }}
                      disabled={disabled}
                    />
                  </div>

                    {/* コメント */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-700">
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span>コメント</span>
                      </div>
                    <Textarea
                      value={damage.comment || ""}
                      onChange={(e) => {
                        if (onDamageLocationChange) {
                          onDamageLocationChange(damage.id, {
                            comment: e.target.value,
                          });
                        }
                      }}
                      placeholder="コメントを入力..."
                      disabled={disabled}
                      rows={2}
                      className="text-base"
                    />
                      </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 損傷箇所追加ボタン */}
          {onAddDamageLocation && (
            <Button
              variant="outline"
              onClick={onAddDamageLocation}
              disabled={disabled}
              className="w-full h-12 text-base font-medium"
            >
              損傷箇所を追加
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 外注先への見積もり依頼 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FileText className="h-5 w-5 shrink-0" />
            外注先への見積もり依頼
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">見積もり依頼方法</Label>
            <Select
              value={estimateRequestMethod || ""}
              onValueChange={(value) => {
                if (onEstimateRequestMethodChange) {
                  onEstimateRequestMethodChange(value as OrderMethod);
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="見積もり依頼方法を選択" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-base text-slate-700">
              {estimateRequestMethod === "写真送付" &&
                "Before写真・動画を外注先に送付して見積もりを依頼"}
              {estimateRequestMethod === "持ち込み" &&
                "車両を持ち込んで外注先に見積もりを依頼"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 外注先からの見積もり回答 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FileText className="h-5 w-5 shrink-0" />
            外注先からの見積もり回答
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-base font-medium">外注先名</Label>
              <input
                type="text"
                value={vendorEstimate?.vendorName || ""}
                onChange={(e) => {
                  if (onVendorEstimateChange) {
                    onVendorEstimateChange({
                      ...vendorEstimate,
                      vendorName: e.target.value,
                    } as VendorEstimate);
                  }
                }}
                placeholder="外注先名を入力"
                disabled={disabled}
                className="w-full h-12 px-3 text-base border border-slate-300 rounded-md bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">見積もり内容</Label>
              <Textarea
                value={vendorEstimate?.estimateText || ""}
                onChange={(e) => {
                  if (onVendorEstimateChange) {
                    onVendorEstimateChange({
                      ...vendorEstimate,
                      estimateText: e.target.value,
                    } as VendorEstimate);
                  }
                }}
                placeholder="外注先からの見積もり内容を入力..."
                disabled={disabled}
                rows={6}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">見積金額</Label>
              <input
                type="number"
                value={vendorEstimate?.total || ""}
                onChange={(e) => {
                  if (onVendorEstimateChange) {
                    onVendorEstimateChange({
                      ...vendorEstimate,
                      total: e.target.value ? parseFloat(e.target.value) : undefined,
                    } as VendorEstimate);
                  }
                }}
                placeholder="見積金額を入力"
                disabled={disabled}
                className="w-full h-12 px-3 text-base border border-slate-300 rounded-md bg-white tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">見積もり回答日</Label>
              <input
                type="date"
                value={vendorEstimate?.responseDate || ""}
                onChange={(e) => {
                  if (onVendorEstimateChange) {
                    onVendorEstimateChange({
                      ...vendorEstimate,
                      responseDate: e.target.value,
                    } as VendorEstimate);
                  }
                }}
                disabled={disabled}
                className="w-full h-12 px-3 text-base border border-slate-300 rounded-md bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">備考</Label>
              <Textarea
                value={vendorEstimate?.note || ""}
                onChange={(e) => {
                  if (onVendorEstimateChange) {
                    onVendorEstimateChange({
                      ...vendorEstimate,
                      note: e.target.value,
                    } as VendorEstimate);
                  }
                }}
                placeholder="備考を入力..."
                disabled={disabled}
                rows={2}
                className="text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* コメント */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <MessageSquare className="h-5 w-5 shrink-0" />
            コメント（整備士の所見）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={comments || ""}
            onChange={(e) => {
              if (onCommentsChange) {
                onCommentsChange(e.target.value);
              }
            }}
            placeholder="コメントを入力..."
            disabled={disabled}
            rows={4}
            className="text-base"
          />
        </CardContent>
      </Card>
    </div>
  );
}









