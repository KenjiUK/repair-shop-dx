"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { TrafficLightButtonGroup, TrafficLightStatus } from "./traffic-light-button";
import {
  MaintenanceType,
  MaintenanceMenuConfig,
  getMaintenanceMenuConfig,
} from "@/lib/maintenance-menu-config";
import { Camera, MessageSquare, Gauge } from "lucide-react";

// =============================================================================
// 型定義
// =============================================================================

export type MaintenanceInspectionStatus = "ok" | "attention" | "replace" | "unchecked";

export interface MaintenanceInspectionItemState {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** カテゴリ */
  category: string;
  /** 状態 */
  status: MaintenanceInspectionStatus;
  /** コメント */
  comment?: string;
  /** 写真URLリスト */
  photoUrls?: string[];
}

// =============================================================================
// Props
// =============================================================================

interface MaintenanceInspectionViewProps {
  /** 選択されたメニュー */
  selectedMenu: MaintenanceType | null;
  /** 検査項目の状態 */
  inspectionItems: MaintenanceInspectionItemState[];
  /** 状態変更ハンドラ */
  onStatusChange?: (itemId: string, status: MaintenanceInspectionStatus) => void;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (itemId: string, file: File) => void | Promise<void>;
  /** コメント変更ハンドラ */
  onCommentChange?: (itemId: string, comment: string) => void;
  /** 写真データマップ */
  photoDataMap?: Record<string, PhotoData>;
  /** 測定値 */
  measurements?: Record<string, number | null>;
  /** 測定値変更ハンドラ */
  onMeasurementChange?: (fieldId: string, value: number | null) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getMaintenanceInspectionStatusText(status: MaintenanceInspectionStatus): string {
  const statusTexts: Record<MaintenanceInspectionStatus, string> = {
    ok: "OK",
    attention: "注意",
    replace: "要交換",
    unchecked: "未チェック",
  };
  return statusTexts[status] || status;
}

/**
 * 初期状態の検査項目を取得
 */
export function getInitialMaintenanceInspectionItems(
  menuConfig: MaintenanceMenuConfig | null
): MaintenanceInspectionItemState[] {
  if (!menuConfig) return [];
  return menuConfig.inspectionItems.map((item) => ({
    ...item,
    status: "unchecked" as MaintenanceInspectionStatus,
    photoUrls: [],
  }));
}

// =============================================================================
// Component
// =============================================================================

export function MaintenanceInspectionView({
  selectedMenu,
  inspectionItems,
  onStatusChange,
  onPhotoCapture,
  onCommentChange,
  photoDataMap = {},
  measurements = {},
  onMeasurementChange,
  disabled = false,
}: MaintenanceInspectionViewProps) {
  const menuConfig = selectedMenu ? getMaintenanceMenuConfig(selectedMenu) : null;

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
    {} as Record<string, MaintenanceInspectionItemState[]>
  );

  if (!selectedMenu || !menuConfig) {
    return (
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardContent className="py-8 text-center text-base text-slate-700">
          メンテナンスメニューを選択してください
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 簡易検査項目 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5 shrink-0" />
              簡易検査項目
            </span>
            <Badge variant={completedCount === totalCount ? "default" : "secondary"} className="text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap">
              <span className="tabular-nums">{completedCount}</span> / <span className="tabular-nums">{totalCount}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 進捗バー */}
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-base">
                  <span className="font-medium text-slate-700">進捗</span>
                  <span className="text-slate-700 font-medium tabular-nums">{percentage}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* カテゴリ別に表示 */}
          {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-medium text-slate-900 text-base">{category}</h4>
              <div className="space-y-3 pl-4 border-l-2 border-slate-200">
                {categoryItems.map((item) => {
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
                          <span>{item.name}</span>
                          {item.status !== "unchecked" && (
                            <Badge
                              variant={
                                item.status === "ok"
                                  ? "default"
                                  : item.status === "attention"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap"
                            >
                              {getMaintenanceInspectionStatusText(item.status)}
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 状態選択 */}
                        <TrafficLightButtonGroup
                          currentStatus={item.status as TrafficLightStatus}
                          onStatusChange={(status) => {
                            if (onStatusChange) {
                              onStatusChange(item.id, status as MaintenanceInspectionStatus);
                            }
                          }}
                          availableStatuses={["green", "yellow", "red"]}
                          disabled={disabled}
                          showLabel={true}
                          size="md"
                        />

                        {/* 写真撮影 */}
                        {menuConfig.requiresPhoto && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-base font-medium text-slate-700">
                              <Camera className="h-4 w-4 shrink-0" />
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
                            />
                          </div>
                        )}

                        {/* コメント */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-base font-medium text-slate-700">
                            <MessageSquare className="h-4 w-4 shrink-0" />
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
                            className="text-base"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 測定値入力 */}
      {menuConfig.measurementFields.length > 0 && (
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <Gauge className="h-5 w-5 shrink-0" />
              測定値入力
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuConfig.measurementFields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <Label htmlFor={`measurement-${field.id}`} className="text-base font-medium text-slate-700">
                    {field.name}
                    {field.unit && <span className="text-slate-700 ml-1">({field.unit})</span>}
                  </Label>
                  <Input
                    id={`measurement-${field.id}`}
                    type="number"
                    step="0.1"
                    value={measurements[field.id] ?? ""}
                    onChange={(e) => {
                      if (onMeasurementChange) {
                        onMeasurementChange(
                          field.id,
                          e.target.value ? parseFloat(e.target.value) : null
                        );
                      }
                    }}
                    placeholder={`${field.name}を入力`}
                    disabled={disabled}
                    className="h-12 text-base"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}









