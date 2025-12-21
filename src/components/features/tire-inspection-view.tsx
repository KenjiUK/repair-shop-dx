"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { TrafficLightButtonGroup, TrafficLightStatus } from "./traffic-light-button";
import {
  TireInspectionItem,
  getTireInspectionStatusText,
  getTireInspectionCategoryName,
  TireTreadDepth,
  TirePressure,
  RecommendedPressure,
  LEGAL_TREAD_DEPTH_THRESHOLD,
  RECOMMENDED_TREAD_DEPTH_THRESHOLD,
} from "@/lib/tire-inspection-items";
import { Camera, MessageSquare, Gauge, Ruler } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface TireInspectionViewProps {
  /** 検査項目リスト */
  items: TireInspectionItem[];
  /** 状態変更ハンドラ */
  onStatusChange?: (itemId: string, status: TireInspectionItem["status"]) => void;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (itemId: string, file: File) => void | Promise<void>;
  /** コメント変更ハンドラ */
  onCommentChange?: (itemId: string, comment: string) => void;
  /** 写真データマップ */
  photoDataMap?: Record<string, PhotoData>;
  /** タイヤ溝深さ測定値 */
  treadDepth?: TireTreadDepth;
  /** タイヤ溝深さ変更ハンドラ */
  onTreadDepthChange?: (treadDepth: TireTreadDepth) => void;
  /** 空気圧測定値 */
  pressure?: TirePressure;
  /** 空気圧変更ハンドラ */
  onPressureChange?: (pressure: TirePressure) => void;
  /** 推奨空気圧 */
  recommendedPressure?: RecommendedPressure;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * タイヤ溝深さの状態を判定
 */
function getTreadDepthStatus(depth: number | null): "ok" | "attention" | "replace" {
  if (depth === null) return "ok";
  if (depth < LEGAL_TREAD_DEPTH_THRESHOLD) return "replace";
  if (depth < RECOMMENDED_TREAD_DEPTH_THRESHOLD) return "attention";
  return "ok";
}

/**
 * 空気圧の状態を判定（推奨値との比較）
 */
function getPressureStatus(
  actual: number | null,
  recommended: number | null
): "ok" | "attention" {
  if (actual === null || recommended === null) return "ok";
  const diff = Math.abs(actual - recommended);
  const threshold = recommended * 0.1; // 10%の誤差を許容
  return diff > threshold ? "attention" : "ok";
}

// =============================================================================
// Component
// =============================================================================

export function TireInspectionView({
  items,
  onStatusChange,
  onPhotoCapture,
  onCommentChange,
  photoDataMap = {},
  treadDepth,
  onTreadDepthChange,
  pressure,
  onPressureChange,
  recommendedPressure,
  disabled = false,
}: TireInspectionViewProps) {
  // 完了項目数を計算
  const completedCount = items.filter((item) => item.status !== "unchecked").length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // カテゴリ別にグループ化
  const itemsByCategory = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<TireInspectionItem["category"], TireInspectionItem[]>
  );

  return (
    <div className="space-y-4">
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
              <h4 className="font-medium text-slate-900 text-sm">
                {getTireInspectionCategoryName(category as TireInspectionItem["category"])}
              </h4>
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
                              {getTireInspectionStatusText(item.status)}
                            </Badge>
                          )}
                        </div>
                        <TrafficLightButtonGroup
                          currentStatus={item.status as TrafficLightStatus}
                          onStatusChange={(status) => {
                            if (onStatusChange) {
                              onStatusChange(item.id, status as TireInspectionItem["status"]);
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

      {/* 測定値入力 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-5 w-5" />
            測定値入力
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* タイヤ溝深さ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-slate-600" />
              <Label className="text-sm font-medium">タイヤ溝深さ（mm）</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="tread-front-left" className="text-xs text-slate-600">
                  前左
                </Label>
                <Input
                  id="tread-front-left"
                  type="number"
                  step="0.1"
                  min="0"
                  value={treadDepth?.frontLeft ?? ""}
                  onChange={(e) => {
                    if (onTreadDepthChange) {
                      onTreadDepthChange({
                        ...treadDepth,
                        frontLeft: e.target.value ? parseFloat(e.target.value) : null,
                      } as TireTreadDepth);
                    }
                  }}
                  placeholder="mm"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
                {treadDepth?.frontLeft !== null && (
                  <p className="text-xs text-slate-500">
                    {treadDepth && getTreadDepthStatus(treadDepth.frontLeft) === "replace" && (
                      <span className="text-red-600">法定基準未満</span>
                    )}
                    {treadDepth && getTreadDepthStatus(treadDepth.frontLeft) === "attention" && (
                      <span className="text-amber-600">推奨基準未満</span>
                    )}
                    {treadDepth && getTreadDepthStatus(treadDepth.frontLeft) === "ok" && (
                      <span className="text-green-600">正常</span>
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="tread-front-right" className="text-xs text-slate-600">
                  前右
                </Label>
                <Input
                  id="tread-front-right"
                  type="number"
                  step="0.1"
                  min="0"
                  value={treadDepth?.frontRight ?? ""}
                  onChange={(e) => {
                    if (onTreadDepthChange) {
                      onTreadDepthChange({
                        ...treadDepth,
                        frontRight: e.target.value ? parseFloat(e.target.value) : null,
                      } as TireTreadDepth);
                    }
                  }}
                  placeholder="mm"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
                {treadDepth?.frontRight !== null && (
                  <p className="text-xs text-slate-500">
                    {treadDepth && getTreadDepthStatus(treadDepth.frontRight) === "replace" && (
                      <span className="text-red-600">法定基準未満</span>
                    )}
                    {treadDepth && getTreadDepthStatus(treadDepth.frontRight) === "attention" && (
                      <span className="text-amber-600">推奨基準未満</span>
                    )}
                    {treadDepth && getTreadDepthStatus(treadDepth.frontRight) === "ok" && (
                      <span className="text-green-600">正常</span>
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="tread-rear-left" className="text-xs text-slate-600">
                  後左
                </Label>
                <Input
                  id="tread-rear-left"
                  type="number"
                  step="0.1"
                  min="0"
                  value={treadDepth?.rearLeft ?? ""}
                  onChange={(e) => {
                    if (onTreadDepthChange) {
                      onTreadDepthChange({
                        ...treadDepth,
                        rearLeft: e.target.value ? parseFloat(e.target.value) : null,
                      } as TireTreadDepth);
                    }
                  }}
                  placeholder="mm"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
                {treadDepth?.rearLeft !== null && (
                  <p className="text-xs text-slate-500">
                    {treadDepth && getTreadDepthStatus(treadDepth.rearLeft) === "replace" && (
                      <span className="text-red-600">法定基準未満</span>
                    )}
                    {treadDepth && getTreadDepthStatus(treadDepth.rearLeft) === "attention" && (
                      <span className="text-amber-600">推奨基準未満</span>
                    )}
                    {treadDepth && getTreadDepthStatus(treadDepth.rearLeft) === "ok" && (
                      <span className="text-green-600">正常</span>
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="tread-rear-right" className="text-xs text-slate-600">
                  後右
                </Label>
                <Input
                  id="tread-rear-right"
                  type="number"
                  step="0.1"
                  min="0"
                  value={treadDepth?.rearRight ?? ""}
                  onChange={(e) => {
                    if (onTreadDepthChange) {
                      onTreadDepthChange({
                        ...treadDepth,
                        rearRight: e.target.value ? parseFloat(e.target.value) : null,
                      } as TireTreadDepth);
                    }
                  }}
                  placeholder="mm"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
                {treadDepth?.rearRight !== null && (
                  <p className="text-xs text-slate-500">
                    {treadDepth && getTreadDepthStatus(treadDepth.rearRight) === "replace" && (
                      <span className="text-red-600">法定基準未満</span>
                    )}
                    {treadDepth && getTreadDepthStatus(treadDepth.rearRight) === "attention" && (
                      <span className="text-amber-600">推奨基準未満</span>
                    )}
                    {treadDepth && getTreadDepthStatus(treadDepth.rearRight) === "ok" && (
                      <span className="text-green-600">正常</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              法定基準: {LEGAL_TREAD_DEPTH_THRESHOLD}mm以上 / 推奨基準: {RECOMMENDED_TREAD_DEPTH_THRESHOLD}mm以上
            </p>
          </div>

          {/* 空気圧 */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-slate-600" />
              <Label className="text-sm font-medium">空気圧（kPa）</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="pressure-front-left" className="text-xs text-slate-600">
                  前左
                </Label>
                <Input
                  id="pressure-front-left"
                  type="number"
                  step="1"
                  min="0"
                  value={pressure?.frontLeft ?? ""}
                  onChange={(e) => {
                    if (onPressureChange) {
                      onPressureChange({
                        ...pressure,
                        frontLeft: e.target.value ? parseFloat(e.target.value) : null,
                      } as TirePressure);
                    }
                  }}
                  placeholder="kPa"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
                {pressure?.frontLeft !== null && recommendedPressure?.front !== null && (
                  <p className="text-xs text-slate-500">
                    推奨: {recommendedPressure?.front}kPa /{" "}
                    {recommendedPressure && pressure && getPressureStatus(pressure.frontLeft, recommendedPressure.front) ===
                      "attention" && (
                      <span className="text-amber-600">要調整</span>
                    )}
                    {recommendedPressure && pressure && getPressureStatus(pressure.frontLeft, recommendedPressure.front) === "ok" && (
                      <span className="text-green-600">正常</span>
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="pressure-front-right" className="text-xs text-slate-600">
                  前右
                </Label>
                <Input
                  id="pressure-front-right"
                  type="number"
                  step="1"
                  min="0"
                  value={pressure?.frontRight ?? ""}
                  onChange={(e) => {
                    if (onPressureChange) {
                      onPressureChange({
                        ...pressure,
                        frontRight: e.target.value ? parseFloat(e.target.value) : null,
                      } as TirePressure);
                    }
                  }}
                  placeholder="kPa"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
                {pressure?.frontRight !== null && recommendedPressure?.front !== null && (
                  <p className="text-xs text-slate-500">
                    推奨: {recommendedPressure?.front}kPa /{" "}
                    {recommendedPressure && pressure && getPressureStatus(pressure.frontRight, recommendedPressure.front) ===
                      "attention" && (
                      <span className="text-amber-600">要調整</span>
                    )}
                    {recommendedPressure && pressure && getPressureStatus(pressure.frontRight, recommendedPressure.front) === "ok" && (
                      <span className="text-green-600">正常</span>
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="pressure-rear-left" className="text-xs text-slate-600">
                  後左
                </Label>
                <Input
                  id="pressure-rear-left"
                  type="number"
                  step="1"
                  min="0"
                  value={pressure?.rearLeft ?? ""}
                  onChange={(e) => {
                    if (onPressureChange) {
                      onPressureChange({
                        ...pressure,
                        rearLeft: e.target.value ? parseFloat(e.target.value) : null,
                      } as TirePressure);
                    }
                  }}
                  placeholder="kPa"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
                {pressure?.rearLeft !== null && recommendedPressure?.rear !== null && (
                  <p className="text-xs text-slate-500">
                    推奨: {recommendedPressure?.rear}kPa /{" "}
                    {recommendedPressure && pressure && getPressureStatus(pressure.rearLeft, recommendedPressure.rear) ===
                      "attention" && (
                      <span className="text-amber-600">要調整</span>
                    )}
                    {recommendedPressure && pressure && getPressureStatus(pressure.rearLeft, recommendedPressure.rear) === "ok" && (
                      <span className="text-green-600">正常</span>
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="pressure-rear-right" className="text-xs text-slate-600">
                  後右
                </Label>
                <Input
                  id="pressure-rear-right"
                  type="number"
                  step="1"
                  min="0"
                  value={pressure?.rearRight ?? ""}
                  onChange={(e) => {
                    if (onPressureChange) {
                      onPressureChange({
                        ...pressure,
                        rearRight: e.target.value ? parseFloat(e.target.value) : null,
                      } as TirePressure);
                    }
                  }}
                  placeholder="kPa"
                  disabled={disabled}
                  className="h-9 text-sm"
                />
                {pressure?.rearRight !== null && recommendedPressure?.rear !== null && (
                  <p className="text-xs text-slate-500">
                    推奨: {recommendedPressure?.rear}kPa /{" "}
                    {recommendedPressure && pressure && getPressureStatus(pressure.rearRight, recommendedPressure.rear) ===
                      "attention" && (
                      <span className="text-amber-600">要調整</span>
                    )}
                    {recommendedPressure && pressure && getPressureStatus(pressure.rearRight, recommendedPressure.rear) === "ok" && (
                      <span className="text-green-600">正常</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            {recommendedPressure && (
              <p className="text-xs text-slate-500">
                推奨空気圧: 前輪 {recommendedPressure?.front || "---"}kPa / 後輪{" "}
                {recommendedPressure?.rear || "---"}kPa
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









