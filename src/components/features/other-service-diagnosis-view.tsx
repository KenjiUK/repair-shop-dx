"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { Camera, MessageSquare, Plus, X } from "lucide-react";

// =============================================================================
// 型定義
// =============================================================================

export interface CustomDiagnosisItem {
  /** 項目ID */
  id: string;
  /** 項目名（自由入力） */
  name: string;
  /** 状態（自由入力） */
  condition: string;
  /** 写真URLリスト */
  photoUrls?: string[];
  /** コメント */
  comment?: string;
}

// =============================================================================
// Props
// =============================================================================

interface OtherServiceDiagnosisViewProps {
  /** 診断項目リスト */
  diagnosisItems: CustomDiagnosisItem[];
  /** 診断項目追加ハンドラ */
  onAddDiagnosisItem?: () => void;
  /** 診断項目削除ハンドラ */
  onRemoveDiagnosisItem?: (id: string) => void;
  /** 診断項目変更ハンドラ */
  onDiagnosisItemChange?: (id: string, item: Partial<CustomDiagnosisItem>) => void;
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
 * 初期状態の診断項目を取得
 */
export function createInitialCustomDiagnosisItem(): CustomDiagnosisItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: "",
    condition: "",
    photoUrls: [],
    comment: "",
  };
}

// =============================================================================
// Component
// =============================================================================

export function OtherServiceDiagnosisView({
  diagnosisItems,
  onAddDiagnosisItem,
  onRemoveDiagnosisItem,
  onDiagnosisItemChange,
  onPhotoCapture,
  photoDataMap = {},
  comments,
  onCommentsChange,
  disabled = false,
}: OtherServiceDiagnosisViewProps) {
  return (
    <div className="space-y-4">
      {/* 診断項目（カスタマイズ可能） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              診断項目
            </span>
            <Badge variant="secondary">{diagnosisItems.length}項目</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {diagnosisItems.map((item, index) => {
              const photoData = photoDataMap[item.id] || {
                position: item.id,
                file: null,
                previewUrl: null,
                isCompressing: false,
              };

              return (
                <div
                  key={item.id}
                  className="p-4 border border-slate-200 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900 text-sm">
                      項目 #{index + 1}
                    </h4>
                    {onRemoveDiagnosisItem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveDiagnosisItem(item.id)}
                        disabled={disabled}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">項目名</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => {
                        if (onDiagnosisItemChange) {
                          onDiagnosisItemChange(item.id, { name: e.target.value });
                        }
                      }}
                      placeholder="診断項目名を入力"
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">状態</Label>
                    <Input
                      value={item.condition}
                      onChange={(e) => {
                        if (onDiagnosisItemChange) {
                          onDiagnosisItemChange(item.id, {
                            condition: e.target.value,
                          });
                        }
                      }}
                      placeholder="状態を入力（例: 良好、要修理、異常ありなど）"
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>

                  {/* 写真撮影（任意） */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Camera className="h-3.5 w-3.5" />
                      <span>写真（任意）</span>
                    </div>
                    <PhotoCaptureButton
                      position={item.id}
                      label={`${item.name || "項目"}の写真を撮影`}
                      photoData={photoData}
                      onCapture={async (position, file) => {
                        if (onPhotoCapture) {
                          await onPhotoCapture(item.id, file);
                        }
                      }}
                      disabled={disabled}
                      size="sm"
                    />
                  </div>

                  {/* コメント */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>コメント</span>
                    </div>
                    <Textarea
                      value={item.comment || ""}
                      onChange={(e) => {
                        if (onDiagnosisItemChange) {
                          onDiagnosisItemChange(item.id, {
                            comment: e.target.value,
                          });
                        }
                      }}
                      placeholder="コメントを入力..."
                      disabled={disabled}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 診断項目追加ボタン */}
          {onAddDiagnosisItem && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddDiagnosisItem}
              disabled={disabled}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              診断項目を追加
            </Button>
          )}
        </CardContent>
      </Card>

      {/* コメント */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5" />
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
            className="text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}









