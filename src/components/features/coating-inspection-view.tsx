"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import { Camera, MessageSquare, Car } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// 型定義
// =============================================================================

export type BodyConditionStatus = "良好" | "軽微な傷" | "中程度の傷" | "深刻な傷" | "汚れあり" | "コーティング残存" | "unchecked";

export interface BodyConditionCheck {
  /** 箇所ID */
  id: string;
  /** 箇所名 */
  location: string;
  /** 状態 */
  condition: BodyConditionStatus;
  /** コメント */
  comment?: string;
  /** 写真URLリスト */
  photoUrls?: string[];
}

export interface ExistingCoatingInfo {
  /** 既存コーティングの種類 */
  type?: string;
  /** 施工日 */
  appliedDate?: string;
  /** 状態 */
  condition?: "良好" | "劣化" | "剥がれ" | "不明";
  /** 写真URLリスト */
  photoUrls?: string[];
}

// =============================================================================
// Props
// =============================================================================

interface CoatingInspectionViewProps {
  /** 車体の状態確認結果 */
  bodyConditions: BodyConditionCheck[];
  /** 状態変更ハンドラ */
  onBodyConditionChange?: (itemId: string, condition: BodyConditionStatus) => void;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (itemId: string, file: File) => void | Promise<void>;
  /** コメント変更ハンドラ */
  onCommentChange?: (itemId: string, comment: string) => void;
  /** 写真データマップ */
  photoDataMap?: Record<string, PhotoData>;
  /** 既存コーティング情報 */
  existingCoating?: ExistingCoatingInfo;
  /** 既存コーティング情報変更ハンドラ */
  onExistingCoatingChange?: (info: ExistingCoatingInfo) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getBodyConditionStatusText(status: BodyConditionStatus): string {
  const statusTexts: Record<BodyConditionStatus, string> = {
    良好: "良好",
    "軽微な傷": "軽微な傷",
    "中程度の傷": "中程度の傷",
    "深刻な傷": "深刻な傷",
    "汚れあり": "汚れあり",
    "コーティング残存": "コーティング残存",
    unchecked: "未チェック",
  };
  return statusTexts[status] || status;
}

/**
 * 初期状態の車体状態確認項目を取得
 */
export function getInitialBodyConditionChecks(): BodyConditionCheck[] {
  return [
    { id: "hood", location: "ボンネット", condition: "unchecked", photoUrls: [] },
    { id: "front-bumper", location: "フロントバンパー", condition: "unchecked", photoUrls: [] },
    { id: "front-left-door", location: "フロント左ドア", condition: "unchecked", photoUrls: [] },
    { id: "front-right-door", location: "フロント右ドア", condition: "unchecked", photoUrls: [] },
    { id: "rear-left-door", location: "リア左ドア", condition: "unchecked", photoUrls: [] },
    { id: "rear-right-door", location: "リア右ドア", condition: "unchecked", photoUrls: [] },
    { id: "rear-bumper", location: "リアバンパー", condition: "unchecked", photoUrls: [] },
    { id: "trunk", location: "トランク", condition: "unchecked", photoUrls: [] },
    { id: "roof", location: "ルーフ", condition: "unchecked", photoUrls: [] },
    { id: "left-fender", location: "左フェンダー", condition: "unchecked", photoUrls: [] },
    { id: "right-fender", location: "右フェンダー", condition: "unchecked", photoUrls: [] },
  ];
}

// =============================================================================
// Component
// =============================================================================

export function CoatingInspectionView({
  bodyConditions,
  onBodyConditionChange,
  onPhotoCapture,
  onCommentChange,
  photoDataMap = {},
  existingCoating,
  onExistingCoatingChange,
  disabled = false,
}: CoatingInspectionViewProps) {
  // 完了項目数を計算
  const completedCount = bodyConditions.filter(
    (item) => item.condition !== "unchecked"
  ).length;
  const totalCount = bodyConditions.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 状態選択肢
  const conditionOptions: BodyConditionStatus[] = [
    "良好",
    "軽微な傷",
    "中程度の傷",
    "深刻な傷",
    "汚れあり",
    "コーティング残存",
  ];

  return (
    <div className="space-y-4">
      {/* 車体の状態確認 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
            <span className="flex items-center gap-2">
              <Car className="h-5 w-5 shrink-0" />
              車体の状態確認
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

          {/* 車体箇所別の状態確認 */}
          <div className="space-y-3">
            {bodyConditions.map((item) => {
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
                      <span>{item.location}</span>
                      {item.condition !== "unchecked" && (
                        <Badge
                          variant={
                            item.condition === "良好"
                              ? "default"
                              : item.condition === "軽微な傷" || item.condition === "汚れあり"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap"
                        >
                          {getBodyConditionStatusText(item.condition)}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 状態選択 */}
                    <div className="flex flex-wrap gap-2">
                      {conditionOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            if (onBodyConditionChange) {
                              onBodyConditionChange(item.id, option);
                            }
                          }}
                          disabled={disabled}
                          className={cn(
                            "h-12 px-4 text-base font-medium rounded-md border transition-colors shrink-0",
                            item.condition === option
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
                            disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {getBodyConditionStatusText(option)}
                        </button>
                      ))}
                    </div>

                    {/* 写真撮影 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-700">
                        <Camera className="h-4 w-4 shrink-0" />
                        <span>写真（Before）</span>
                      </div>
                      <PhotoCaptureButton
                        position={item.id}
                        label={`${item.location}の写真を撮影`}
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
        </CardContent>
      </Card>

      {/* 既存コーティングの状態確認 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Car className="h-5 w-5 shrink-0" />
            既存コーティングの状態確認
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-base font-medium">既存コーティングの種類</Label>
              <Textarea
                value={existingCoating?.type || ""}
                onChange={(e) => {
                  if (onExistingCoatingChange) {
                    onExistingCoatingChange({
                      ...existingCoating,
                      type: e.target.value,
                    });
                  }
                }}
                placeholder="既存コーティングの種類を入力..."
                disabled={disabled}
                rows={2}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">施工日</Label>
              <input
                type="date"
                value={existingCoating?.appliedDate || ""}
                onChange={(e) => {
                  if (onExistingCoatingChange) {
                    onExistingCoatingChange({
                      ...existingCoating,
                      appliedDate: e.target.value,
                    });
                  }
                }}
                disabled={disabled}
                className="w-full h-12 px-3 text-base border border-slate-300 rounded-md bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">状態</Label>
              <div className="flex flex-wrap gap-2">
                {(["良好", "劣化", "剥がれ", "不明"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (onExistingCoatingChange) {
                        onExistingCoatingChange({
                          ...existingCoating,
                          condition: option,
                        });
                      }
                    }}
                    disabled={disabled}
                    className={cn(
                      "h-12 px-4 text-base font-medium rounded-md border transition-colors shrink-0",
                      existingCoating?.condition === option
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base font-medium">写真</Label>
              <PhotoCaptureButton
                position="existing-coating"
                label="既存コーティングの写真を撮影"
                photoData={
                  photoDataMap["existing-coating"] || {
                    position: "existing-coating",
                    file: null,
                    previewUrl: null,
                    isCompressing: false,
                  }
                }
                onCapture={async (position, file) => {
                  if (onPhotoCapture) {
                    await onPhotoCapture("existing-coating", file);
                  }
                }}
                disabled={disabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









