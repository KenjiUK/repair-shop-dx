"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { TrafficLightButtonGroup, TrafficLightStatus } from "./traffic-light-button";
import {
  EngineOilInspectionItem,
  getEngineOilInspectionStatusText,
} from "@/lib/engine-oil-inspection-items";
import { Camera, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface EngineOilInspectionViewProps {
  /** 検査項目リスト */
  items: EngineOilInspectionItem[];
  /** 状態変更ハンドラ */
  onStatusChange?: (itemId: string, status: EngineOilInspectionItem["status"]) => void;
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
// Component
// =============================================================================

export function EngineOilInspectionView({
  items,
  onStatusChange,
  onPhotoCapture,
  onCommentChange,
  photoDataMap = {},
  disabled = false,
}: EngineOilInspectionViewProps) {
  // 完了項目数を計算
  const completedCount = items.filter((item) => item.status !== "unchecked").length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
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

        {/* 検査項目リスト */}
        <div className="space-y-4">
          {items.map((item) => {
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
                {/* 項目名と状態選択 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">{item.name}</h4>
                    {item.status !== "unchecked" && (
                      <Badge
                        variant={
                          item.status === "ok"
                            ? "default"
                            : item.status === "attention"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {getEngineOilInspectionStatusText(item.status)}
                      </Badge>
                    )}
                  </div>
                  <TrafficLightButtonGroup
                    currentStatus={item.status as TrafficLightStatus}
                    onStatusChange={(status) => {
                      if (onStatusChange) {
                        onStatusChange(item.id, status as EngineOilInspectionItem["status"]);
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
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Camera className="h-4 w-4" />
                    <span>写真</span>
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
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MessageSquare className="h-4 w-4" />
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
                    className="text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}















