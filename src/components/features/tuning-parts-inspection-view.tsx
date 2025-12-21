"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { TrafficLightButtonGroup, TrafficLightStatus } from "./traffic-light-button";
import { TuningPartsType } from "@/lib/tuning-parts-config";
import { Camera, MessageSquare } from "lucide-react";

// =============================================================================
// 型定義
// =============================================================================

export type TuningPartsInspectionStatus = "ok" | "attention" | "replace" | "unchecked";

export interface TuningPartsInspectionItem {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** カテゴリ */
  category: string;
  /** 状態 */
  status: TuningPartsInspectionStatus;
  /** コメント */
  comment?: string;
  /** 写真URLリスト */
  photoUrls?: string[];
}

// =============================================================================
// Props
// =============================================================================

interface TuningPartsInspectionViewProps {
  /** 選択された種類 */
  selectedType: TuningPartsType | null;
  /** カスタム内容の説明 */
  customDescription?: string;
  /** カスタム内容変更ハンドラ */
  onCustomDescriptionChange?: (description: string) => void;
  /** 検査項目の状態 */
  inspectionItems: TuningPartsInspectionItem[];
  /** 状態変更ハンドラ */
  onStatusChange?: (itemId: string, status: TuningPartsInspectionStatus) => void;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (itemId: string, file: File) => void | Promise<void>;
  /** コメント変更ハンドラ */
  onCommentChange?: (itemId: string, comment: string) => void;
  /** 写真データマップ */
  photoDataMap?: Record<string, PhotoData>;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getTuningPartsInspectionStatusText(status: TuningPartsInspectionStatus): string {
  const statusTexts: Record<TuningPartsInspectionStatus, string> = {
    ok: "OK",
    attention: "注意",
    replace: "要対応",
    unchecked: "未チェック",
  };
  return statusTexts[status] || status;
}

/**
 * 初期状態の検査項目を取得（カスタム内容に応じて動的に生成）
 */
export function getInitialTuningPartsInspectionItems(
  selectedType: TuningPartsType | null,
  customDescription?: string
): TuningPartsInspectionItem[] {
  if (!selectedType) return [];

  // カスタム内容から検査項目を推測（簡易版）
  // 実際の実装では、カスタム内容を解析して適切な検査項目を生成
  const baseItems: Omit<TuningPartsInspectionItem, "status" | "comment" | "photoUrls">[] = [];

  if (selectedType === "チューニング") {
    baseItems.push(
      { id: "tuning-1", name: "カスタム箇所の確認", category: "カスタム" },
      { id: "tuning-2", name: "関連箇所の点検", category: "点検" },
      { id: "tuning-3", name: "取り付け可能か確認", category: "確認" }
    );
  } else if (selectedType === "パーツ取り付け") {
    baseItems.push(
      { id: "parts-1", name: "取り付け箇所の確認", category: "取り付け" },
      { id: "parts-2", name: "関連箇所の点検", category: "点検" },
      { id: "parts-3", name: "取り付け可能か確認", category: "確認" }
    );
  }

  return baseItems.map((item) => ({
    ...item,
    status: "unchecked" as TuningPartsInspectionStatus,
    photoUrls: [],
  }));
}

// =============================================================================
// Component
// =============================================================================

export function TuningPartsInspectionView({
  selectedType,
  customDescription,
  onCustomDescriptionChange,
  inspectionItems,
  onStatusChange,
  onPhotoCapture,
  onCommentChange,
  photoDataMap = {},
  disabled = false,
}: TuningPartsInspectionViewProps) {
  // 完了項目数を計算
  const completedCount = inspectionItems.filter((item) => item.status !== "unchecked").length;
  const totalCount = inspectionItems.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // カテゴリ別にグループ化
  const itemsByCategory = inspectionItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, TuningPartsInspectionItem[]>
  );

  if (!selectedType) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">
          種類を選択してください
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* カスタム内容の説明 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5" />
            カスタム内容
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={customDescription || ""}
            onChange={(e) => {
              if (onCustomDescriptionChange) {
                onCustomDescriptionChange(e.target.value);
              }
            }}
            placeholder="カスタム内容を入力してください..."
            disabled={disabled}
            rows={4}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* 簡易検査項目 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              簡易検査項目
            </span>
            <Badge variant={completedCount === totalCount ? "default" : "secondary"}>
              {completedCount} / {totalCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 進捗バー */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">進捗</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* カテゴリ別に表示 */}
          {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-slate-900 text-sm">{category}</h4>
              <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                {categoryItems.map((item) => {
                  const photoData = photoDataMap[item.id] || {
                    position: item.id,
                    file: null,
                    previewUrl: null,
                    isCompressing: false,
                  };

                  return (
                    <div
                      key={item.id}
                      className="p-3 border border-slate-200 rounded-lg space-y-2"
                    >
                      {/* 項目名と状態選択 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-slate-900 text-sm">{item.name}</h5>
                          {item.status !== "unchecked" && (
                            <Badge
                              variant={
                                item.status === "ok"
                                  ? "default"
                                  : item.status === "attention"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {getTuningPartsInspectionStatusText(item.status)}
                            </Badge>
                          )}
                        </div>
                        <TrafficLightButtonGroup
                          currentStatus={item.status as TrafficLightStatus}
                          onStatusChange={(status) => {
                            if (onStatusChange) {
                              onStatusChange(item.id, status as TuningPartsInspectionStatus);
                            }
                          }}
                          availableStatuses={["green", "yellow", "red"]}
                          disabled={disabled}
                          size="sm"
                          showLabel={true}
                        />
                      </div>

                      {/* 写真撮影 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Camera className="h-3.5 w-3.5" />
                          <span>写真（Before）</span>
                        </div>
                        <PhotoCaptureButton
                          position={item.id}
                          label={`${item.name}の写真を撮影`}
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
                            if (onCommentChange) {
                              onCommentChange(item.id, e.target.value);
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
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}









