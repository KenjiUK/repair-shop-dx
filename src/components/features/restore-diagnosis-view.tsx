"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RestoreType,
  RestoreContent,
  RestoreSeverity,
  ConditionStatus,
  RestoreBodyPart,
  RESTORE_TYPES,
  RESTORE_CONTENTS,
  RESTORE_SEVERITIES,
  CONDITION_STATUSES,
  RESTORE_BODY_PARTS,
} from "@/lib/restore-config";
import { Camera, MessageSquare, Car, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// 型定義
// =============================================================================

export interface ConditionCheck {
  /** 項目ID */
  id: string;
  /** 箇所 */
  location: RestoreBodyPart;
  /** 状態 */
  condition: ConditionStatus;
  /** 写真URLリスト */
  photoUrls?: string[];
  /** コメント */
  comment?: string;
}

export interface RestoreLocation {
  /** 項目ID */
  id: string;
  /** 部位 */
  location: RestoreBodyPart;
  /** 修復内容 */
  restoreType: RestoreContent;
  /** 修復の程度 */
  severity: RestoreSeverity;
  /** Before写真URLリスト */
  photoUrls?: string[];
  /** コメント */
  comment?: string;
}

// =============================================================================
// Props
// =============================================================================

interface RestoreDiagnosisViewProps {
  /** レストアの種類 */
  restoreType?: RestoreType | null;
  /** レストアの種類変更ハンドラ */
  onRestoreTypeChange?: (type: RestoreType | null) => void;
  /** 現状確認結果リスト */
  conditionChecks: ConditionCheck[];
  /** 現状確認結果追加ハンドラ */
  onAddConditionCheck?: () => void;
  /** 現状確認結果削除ハンドラ */
  onRemoveConditionCheck?: (id: string) => void;
  /** 現状確認結果変更ハンドラ */
  onConditionCheckChange?: (id: string, check: Partial<ConditionCheck>) => void;
  /** 修復箇所リスト */
  restoreLocations: RestoreLocation[];
  /** 修復箇所追加ハンドラ */
  onAddRestoreLocation?: () => void;
  /** 修復箇所削除ハンドラ */
  onRemoveRestoreLocation?: (id: string) => void;
  /** 修復箇所変更ハンドラ */
  onRestoreLocationChange?: (id: string, location: Partial<RestoreLocation>) => void;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (itemId: string, file: File) => void | Promise<void>;
  /** 写真データマップ */
  photoDataMap?: Record<string, PhotoData>;
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
 * 初期状態の現状確認結果を取得
 */
export function createInitialConditionCheck(): ConditionCheck {
  return {
    id: `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    location: "エンジン",
    condition: "良好",
    photoUrls: [],
    comment: "",
  };
}

/**
 * 初期状態の修復箇所を取得
 */
export function createInitialRestoreLocation(): RestoreLocation {
  return {
    id: `restore-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    location: "エンジン",
    restoreType: "修復",
    severity: "軽微",
    photoUrls: [],
    comment: "",
  };
}

// =============================================================================
// Component
// =============================================================================

export function RestoreDiagnosisView({
  restoreType,
  onRestoreTypeChange,
  conditionChecks,
  onAddConditionCheck,
  onRemoveConditionCheck,
  onConditionCheckChange,
  restoreLocations,
  onAddRestoreLocation,
  onRemoveRestoreLocation,
  onRestoreLocationChange,
  onPhotoCapture,
  photoDataMap = {},
  comments,
  onCommentsChange,
  disabled = false,
}: RestoreDiagnosisViewProps) {
  return (
    <div className="space-y-4">
      {/* レストアの種類選択 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Wrench className="h-5 w-5 shrink-0" />
            レストアの種類
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">
              レストアの種類を選択
              <span className="text-red-600 ml-1">*</span>
            </Label>
            <Select
              value={restoreType || ""}
              onValueChange={(value) => {
                if (onRestoreTypeChange) {
                  onRestoreTypeChange(value ? (value as RestoreType) : null);
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="レストアの種類を選択" />
              </SelectTrigger>
              <SelectContent>
                {RESTORE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-base text-slate-700">
              {restoreType === "フルレストア" &&
                "古い車をゼロから完全に修復・復元"}
              {restoreType === "部分レストア" &&
                "シートだけなど、特定の箇所のみを修復・復元"}
              {restoreType === "その他" && "その他のレストア"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 現状確認 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
            <span className="flex items-center gap-2">
              <Car className="h-5 w-5 shrink-0" />
              現状確認
            </span>
            <Badge variant="secondary" className="text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap">
              <span className="tabular-nums">{conditionChecks.length}</span>箇所
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {conditionChecks.map((check) => {
              const photoData = photoDataMap[check.id] || {
                position: check.id,
                file: null,
                previewUrl: null,
                isCompressing: false,
              };

              return (
                <Card
                  key={check.id}
                  className="border border-slate-300 rounded-xl shadow-md"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
                      <span>確認箇所 #{conditionChecks.indexOf(check) + 1}</span>
                      {onRemoveConditionCheck && (
                        <Button
                          variant="ghost"
                          onClick={() => onRemoveConditionCheck(check.id)}
                          disabled={disabled}
                          className="h-12 w-12 p-0 shrink-0"
                        >
                          <X className="h-4 w-4 shrink-0" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 箇所選択 */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">箇所</Label>
                    <Select
                      value={check.location}
                      onValueChange={(value) => {
                        if (onConditionCheckChange) {
                          onConditionCheckChange(check.id, {
                            location: value as RestoreBodyPart,
                          });
                        }
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESTORE_BODY_PARTS.map((part) => (
                          <SelectItem key={part} value={part}>
                            {part}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    {/* 状態選択 */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">状態</Label>
                    <Select
                      value={check.condition}
                      onValueChange={(value) => {
                        if (onConditionCheckChange) {
                          onConditionCheckChange(check.id, {
                            condition: value as ConditionStatus,
                          });
                        }
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    {/* 写真撮影（任意） */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-700">
                        <Camera className="h-4 w-4 shrink-0" />
                        <span>写真（任意）</span>
                      </div>
                    <PhotoCaptureButton
                      position={check.id}
                      label={`${check.location}の写真を撮影`}
                      photoData={photoData}
                      onCapture={async (position, file) => {
                        if (onPhotoCapture) {
                          await onPhotoCapture(check.id, file);
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
                        value={check.comment || ""}
                        onChange={(e) => {
                          if (onConditionCheckChange) {
                            onConditionCheckChange(check.id, {
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

          {/* 現状確認追加ボタン */}
          {onAddConditionCheck && (
            <Button
              variant="outline"
              onClick={onAddConditionCheck}
              disabled={disabled}
              className="w-full h-12 text-base font-medium"
            >
              確認箇所を追加
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 修復箇所の確認 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
            <span className="flex items-center gap-2">
              <Wrench className="h-5 w-5 shrink-0" />
              修復箇所の確認
            </span>
            <Badge variant="secondary" className="text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap">
              <span className="tabular-nums">{restoreLocations.length}</span>箇所
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {restoreLocations.map((location) => {
              const photoData = photoDataMap[location.id] || {
                position: location.id,
                file: null,
                previewUrl: null,
                isCompressing: false,
              };

              return (
                <Card
                  key={location.id}
                  className="border border-slate-300 rounded-xl shadow-md"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
                      <span>修復箇所 #{restoreLocations.indexOf(location) + 1}</span>
                      {onRemoveRestoreLocation && (
                        <Button
                          variant="ghost"
                          onClick={() => onRemoveRestoreLocation(location.id)}
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
                      value={location.location}
                      onValueChange={(value) => {
                        if (onRestoreLocationChange) {
                          onRestoreLocationChange(location.id, {
                            location: value as RestoreBodyPart,
                          });
                        }
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESTORE_BODY_PARTS.map((part) => (
                          <SelectItem key={part} value={part}>
                            {part}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    {/* 修復内容と程度 */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">修復内容</Label>
                      <Select
                        value={location.restoreType}
                        onValueChange={(value) => {
                          if (onRestoreLocationChange) {
                            onRestoreLocationChange(location.id, {
                              restoreType: value as RestoreContent,
                            });
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RESTORE_CONTENTS.map((content) => (
                            <SelectItem key={content} value={content}>
                              {content}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-slate-700">修復の程度</Label>
                      <Select
                        value={location.severity}
                        onValueChange={(value) => {
                          if (onRestoreLocationChange) {
                            onRestoreLocationChange(location.id, {
                              severity: value as RestoreSeverity,
                            });
                          }
                        }}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RESTORE_SEVERITIES.map((severity) => (
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
                      position={location.id}
                      label={`${location.location}のBefore写真を撮影`}
                      photoData={photoData}
                      onCapture={async (position, file) => {
                        if (onPhotoCapture) {
                          await onPhotoCapture(location.id, file);
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
                        value={location.comment || ""}
                        onChange={(e) => {
                          if (onRestoreLocationChange) {
                            onRestoreLocationChange(location.id, {
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

          {/* 修復箇所追加ボタン */}
          {onAddRestoreLocation && (
            <Button
              variant="outline"
              onClick={onAddRestoreLocation}
              disabled={disabled}
              className="w-full h-12 text-base font-medium"
            >
              修復箇所を追加
            </Button>
          )}
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









