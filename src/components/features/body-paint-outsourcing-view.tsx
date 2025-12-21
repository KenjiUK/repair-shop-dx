"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import {
  OrderMethod,
  OutsourcingProgress,
  ORDER_METHODS,
  OUTSOURCING_PROGRESSES,
} from "@/lib/body-paint-config";
import {
  Package,
  Calendar,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Camera,
  MessageSquare,
  Truck,
  TrendingUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

// =============================================================================
// 型定義
// =============================================================================

export interface OutsourcingInfo {
  /** 外注先名 */
  vendorName: string;
  /** 発注日時 */
  orderDate?: string;
  /** 発注方法 */
  orderMethod: OrderMethod;
  /** 預け日時 */
  deliveryDate?: string;
  /** 作業進捗状況 */
  progress: OutsourcingProgress;
  /** 作業進捗率（0-100%） */
  progressPercentage?: number;
  /** 作業完了日時 */
  completionDate?: string;
  /** 引き取り日時 */
  pickupDate?: string;
  /** 予定完了日 */
  expectedCompletionDate?: string;
  /** 遅延フラグ */
  isDelayed?: boolean;
}

export interface QualityCheckItem {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** 確認結果 */
  result: "合格" | "要修正" | "不適合";
  /** コメント */
  comment?: string;
}

export interface QualityCheckData {
  /** 品質確認結果 */
  result?: "合格" | "要修正" | "返品";
  /** 確認項目 */
  checkItems: QualityCheckItem[];
  /** After写真URLリスト */
  afterPhotoUrls: string[];
  /** コメント */
  comments?: string;
}

// =============================================================================
// Props
// =============================================================================

interface BodyPaintOutsourcingViewProps {
  /** 外注情報 */
  outsourcingInfo?: OutsourcingInfo | null;
  /** 外注情報変更ハンドラ */
  onOutsourcingInfoChange?: (info: OutsourcingInfo) => void;
  /** 作業期間（月） */
  workDuration?: number;
  /** 品質確認データ */
  qualityCheckData?: QualityCheckData | null;
  /** 品質確認データ変更ハンドラ */
  onQualityCheckDataChange?: (data: QualityCheckData) => void;
  /** 写真データマップ */
  photoDataMap?: Record<string, PhotoData>;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (position: string, file: File) => void | Promise<void>;
  /** 発注ボタンクリックハンドラ */
  onOrderClick?: () => void | Promise<void>;
  /** 作業完了連絡受付ハンドラ */
  onCompletionNoticeClick?: () => void | Promise<void>;
  /** 引き取りボタンクリックハンドラ */
  onPickupClick?: () => void | Promise<void>;
  /** 品質確認完了ハンドラ */
  onQualityCheckComplete?: () => void | Promise<void>;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 初期状態の品質確認項目を取得
 */
export function createInitialQualityCheckItem(): QualityCheckItem {
  return {
    id: `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: "",
    result: "合格",
    comment: "",
  };
}

/**
 * 品質確認項目のデフォルトリスト
 */
export const DEFAULT_QUALITY_CHECK_ITEMS: Omit<QualityCheckItem, "id">[] = [
  { name: "板金の仕上がり", result: "合格", comment: "" },
  { name: "塗装の仕上がり", result: "合格", comment: "" },
  { name: "色の一致", result: "合格", comment: "" },
  { name: "表面の傷・汚れ", result: "合格", comment: "" },
  { name: "部品の取り付け", result: "合格", comment: "" },
];

// =============================================================================
// Component
// =============================================================================

export function BodyPaintOutsourcingView({
  outsourcingInfo,
  onOutsourcingInfoChange,
  workDuration = 1,
  qualityCheckData,
  onQualityCheckDataChange,
  photoDataMap = {},
  onPhotoCapture,
  onOrderClick,
  onCompletionNoticeClick,
  onPickupClick,
  onQualityCheckComplete,
  disabled = false,
}: BodyPaintOutsourcingViewProps) {
  const progress = outsourcingInfo?.progress || "発注済み";
  const isOrdered = progress !== "発注済み";
  const isInProgress = progress === "作業中";
  const isCompleted = progress === "作業完了";
  const isPickedUp = progress === "引き取り済み";

  /**
   * 進捗率を計算
   */
  const calculateProgressPercentage = (): number => {
    if (!outsourcingInfo) return 0;
    if (progress === "発注済み") return 25;
    if (progress === "作業中") return 50;
    if (progress === "作業完了") return 75;
    if (progress === "引き取り済み") return 100;
    return outsourcingInfo.progressPercentage || 0;
  };

  /**
   * 遅延チェック
   */
  const checkDelay = (): boolean => {
    if (!outsourcingInfo?.expectedCompletionDate) return false;
    if (progress === "引き取り済み" || progress === "作業完了") return false;
    const expectedDate = new Date(outsourcingInfo.expectedCompletionDate);
    const today = new Date();
    return today > expectedDate;
  };

  const progressPercentage = calculateProgressPercentage();
  const isDelayed = checkDelay();

  /**
   * 外注先名変更ハンドラ
   */
  const handleVendorNameChange = (vendorName: string) => {
    if (!onOutsourcingInfoChange || !outsourcingInfo) return;
    onOutsourcingInfoChange({
      ...outsourcingInfo,
      vendorName,
    });
  };

  /**
   * 発注方法変更ハンドラ
   */
  const handleOrderMethodChange = (orderMethod: OrderMethod) => {
    if (!onOutsourcingInfoChange || !outsourcingInfo) return;
    onOutsourcingInfoChange({
      ...outsourcingInfo,
      orderMethod,
    });
  };

  /**
   * 品質確認項目追加ハンドラ
   */
  const handleAddQualityCheckItem = () => {
    if (!onQualityCheckDataChange) return;
    const newItem = createInitialQualityCheckItem();
    const updatedItems = [
      ...(qualityCheckData?.checkItems || []),
      newItem,
    ];
    onQualityCheckDataChange({
      ...qualityCheckData,
      checkItems: updatedItems,
      afterPhotoUrls: qualityCheckData?.afterPhotoUrls || [],
      comments: qualityCheckData?.comments || "",
    } as QualityCheckData);
  };

  /**
   * 品質確認項目削除ハンドラ
   */
  const handleRemoveQualityCheckItem = (id: string) => {
    if (!onQualityCheckDataChange) return;
    const updatedItems = (qualityCheckData?.checkItems || []).filter(
      (item) => item.id !== id
    );
    onQualityCheckDataChange({
      ...qualityCheckData,
      checkItems: updatedItems,
      afterPhotoUrls: qualityCheckData?.afterPhotoUrls || [],
      comments: qualityCheckData?.comments || "",
    } as QualityCheckData);
  };

  /**
   * 品質確認項目更新ハンドラ
   */
  const handleUpdateQualityCheckItem = (
    id: string,
    updates: Partial<QualityCheckItem>
  ) => {
    if (!onQualityCheckDataChange) return;
    const updatedItems = (qualityCheckData?.checkItems || []).map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    onQualityCheckDataChange({
      ...qualityCheckData,
      checkItems: updatedItems,
      afterPhotoUrls: qualityCheckData?.afterPhotoUrls || [],
      comments: qualityCheckData?.comments || "",
    } as QualityCheckData);
  };

  return (
    <div className="space-y-4">
      {/* 外注発注セクション */}
      {!isOrdered && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5" />
              外注先への発注
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">外注先名</Label>
                <Input
                  value={outsourcingInfo?.vendorName || ""}
                  onChange={(e) => handleVendorNameChange(e.target.value)}
                  placeholder="外注先名を入力"
                  disabled={disabled}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">発注方法</Label>
                <Select
                  value={outsourcingInfo?.orderMethod || ""}
                  onValueChange={(value) =>
                    handleOrderMethodChange(value as OrderMethod)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="発注方法を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {outsourcingInfo?.orderMethod === "写真送付" &&
                    "Before写真・動画を外注先に送付して発注"}
                  {outsourcingInfo?.orderMethod === "持ち込み" &&
                    "車両を持ち込んで外注先に発注"}
                </p>
              </div>
            </div>
            <Button
              onClick={async () => {
                if (onOrderClick) {
                  await onOrderClick();
                }
                // 発注時に予定完了日を設定
                if (onOutsourcingInfoChange && outsourcingInfo) {
                  const orderDate = new Date().toISOString();
                  const expectedCompletionDate = new Date(orderDate);
                  expectedCompletionDate.setMonth(expectedCompletionDate.getMonth() + workDuration);
                  onOutsourcingInfoChange({
                    ...outsourcingInfo,
                    orderDate,
                    expectedCompletionDate: expectedCompletionDate.toISOString(),
                    progress: "発注済み",
                    progressPercentage: 25,
                  });
                }
              }}
              disabled={
                disabled ||
                !outsourcingInfo?.vendorName ||
                !outsourcingInfo?.orderMethod
              }
              className="w-full"
            >
              発注する
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 外注作業管理セクション */}
      {isOrdered && !isPickedUp && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                外注作業管理
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    progress === "作業完了"
                      ? "default"
                      : progress === "作業中"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {progress}
                </Badge>
                {isDelayed && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    遅延
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 遅延アラート */}
            {isDelayed && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">作業が遅延しています</p>
                  <p className="text-xs text-red-700 mt-1">
                    予定完了日（{outsourcingInfo?.expectedCompletionDate ? new Date(outsourcingInfo.expectedCompletionDate).toLocaleDateString("ja-JP") : "-"}）を過ぎています。
                    外注先に進捗を確認してください。
                  </p>
                </div>
              </div>
            )}

            {/* 進捗表示 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  作業進捗
                </span>
                <span className="font-medium text-slate-900">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600">外注先名</Label>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {outsourcingInfo?.vendorName || "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">発注方法</Label>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {outsourcingInfo?.orderMethod || "-"}
                  </p>
                </div>
              </div>
              {outsourcingInfo?.orderDate && (
                <div>
                  <Label className="text-xs text-slate-600">発注日時</Label>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {outsourcingInfo.orderDate}
                  </p>
                </div>
              )}
              {outsourcingInfo?.deliveryDate && (
                <div>
                  <Label className="text-xs text-slate-600">預け日時</Label>
                  <p className="text-sm font-medium text-slate-900 mt-1">
                    {outsourcingInfo.deliveryDate}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-xs text-slate-600">作業期間</Label>
                <p className="text-sm font-medium text-slate-900 mt-1">
                  {workDuration}カ月（予定）
                </p>
              </div>
            </div>

            {isInProgress && (
              <Button
                variant="outline"
                onClick={async () => {
                  if (onCompletionNoticeClick) {
                    await onCompletionNoticeClick();
                  }
                  // 作業完了時に進捗率を更新
                  if (onOutsourcingInfoChange && outsourcingInfo) {
                    onOutsourcingInfoChange({
                      ...outsourcingInfo,
                      progress: "作業完了",
                      completionDate: new Date().toISOString(),
                      progressPercentage: 75,
                    });
                  }
                }}
                disabled={disabled}
                className="w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                作業完了連絡を受ける
              </Button>
            )}

            {isCompleted && (
              <Button
                onClick={async () => {
                  if (onPickupClick) {
                    await onPickupClick();
                  }
                  // 引き取り時に進捗率を更新
                  if (onOutsourcingInfoChange && outsourcingInfo) {
                    onOutsourcingInfoChange({
                      ...outsourcingInfo,
                      progress: "引き取り済み",
                      pickupDate: new Date().toISOString(),
                      progressPercentage: 100,
                    });
                  }
                }}
                disabled={disabled}
                className="w-full"
              >
                <Truck className="h-4 w-4 mr-2" />
                引き取る
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 引き取り・品質確認セクション */}
      {isCompleted && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5" />
              引き取り・品質確認
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 品質確認チェックリスト */}
            <div className="space-y-3">
              <Label className="text-sm">品質確認チェックリスト</Label>
              {(qualityCheckData?.checkItems || []).map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 border border-slate-200 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {item.name || `項目 #${index + 1}`}
                    </Label>
                    <Select
                      value={item.result}
                      onValueChange={(value) =>
                        handleUpdateQualityCheckItem(item.id, {
                          result: value as "合格" | "要修正" | "不適合",
                        })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="合格">合格</SelectItem>
                        <SelectItem value="要修正">要修正</SelectItem>
                        <SelectItem value="不適合">不適合</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={item.comment || ""}
                    onChange={(e) =>
                      handleUpdateQualityCheckItem(item.id, {
                        comment: e.target.value,
                      })
                    }
                    placeholder="コメントを入力..."
                    disabled={disabled}
                    rows={2}
                    className="text-xs"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddQualityCheckItem}
                disabled={disabled}
                className="w-full"
              >
                + 確認項目を追加
              </Button>
            </div>

            <Separator />

            {/* After写真撮影（必須） */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Camera className="h-4 w-4" />
                <Label>After写真（必須）</Label>
              </div>
              <PhotoCaptureButton
                position="after"
                label="After写真を撮影"
                photoData={photoDataMap["after"] || {
                  position: "after",
                  file: null,
                  previewUrl: null,
                  isCompressing: false,
                }}
                onCapture={async (position, file) => {
                  if (onPhotoCapture) {
                    await onPhotoCapture(position, file);
                  }
                }}
                disabled={disabled}
                size="sm"
              />
              {(qualityCheckData?.afterPhotoUrls || []).length > 0 && (
                <p className="text-xs text-slate-500">
                  {(qualityCheckData?.afterPhotoUrls || []).length}枚の写真が撮影されています
                </p>
              )}
            </div>

            <Separator />

            {/* コメント */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4" />
                <Label>コメント</Label>
              </div>
              <Textarea
                value={qualityCheckData?.comments || ""}
                onChange={(e) => {
                  if (onQualityCheckDataChange) {
                    onQualityCheckDataChange({
                      ...qualityCheckData,
                      checkItems: qualityCheckData?.checkItems || [],
                      afterPhotoUrls: qualityCheckData?.afterPhotoUrls || [],
                      comments: e.target.value,
                    } as QualityCheckData);
                  }
                }}
                placeholder="コメントを入力..."
                disabled={disabled}
                rows={3}
                className="text-sm"
              />
            </div>

            {/* 品質確認完了ボタン */}
            <Button
              onClick={onQualityCheckComplete}
              disabled={
                disabled ||
                (qualityCheckData?.afterPhotoUrls || []).length === 0
              }
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              品質確認完了
            </Button>
            {(qualityCheckData?.afterPhotoUrls || []).length === 0 && (
              <p className="text-xs text-red-500 text-center">
                After写真の撮影が必須です
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}









