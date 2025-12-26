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
import { cn } from "@/lib/utils";

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
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 shrink-0" />
              診断項目
            </span>
            <Badge variant="secondary" className="text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap">
              <span className="tabular-nums">{diagnosisItems.length}</span>項目
            </Badge>
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
                <Card
                  key={item.id}
                  className="border border-slate-300 rounded-xl shadow-md"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-900">
                      <span>項目 #{index + 1}</span>
                      {onRemoveDiagnosisItem && (
                        <Button
                          variant="ghost"
                          onClick={() => onRemoveDiagnosisItem(item.id)}
                          disabled={disabled}
                          className="h-12 w-12 p-0 shrink-0"
                        >
                          <X className="h-4 w-4 shrink-0" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">項目名</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => {
                          if (onDiagnosisItemChange) {
                            onDiagnosisItemChange(item.id, { name: e.target.value });
                          }
                        }}
                        placeholder="診断項目名を入力"
                        disabled={disabled}
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-base font-medium text-slate-700">状態</Label>
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
                        className="h-12 text-base"
                      />
                    </div>

                    {/* 写真撮影（任意） */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-700">
                        <Camera className="h-4 w-4 shrink-0" />
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
                      />
                    </div>

                    {/* コメント */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-700">
                        <MessageSquare className="h-4 w-4 shrink-0" />
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
                        className="text-base"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 診断項目追加ボタン */}
          {onAddDiagnosisItem && (
            <Button
              variant="outline"
              onClick={onAddDiagnosisItem}
              disabled={disabled}
              className="w-full h-12 text-base font-medium"
            >
              <Plus className="h-4 w-4 mr-2 shrink-0" />
              診断項目を追加
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









