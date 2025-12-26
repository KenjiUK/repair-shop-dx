"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VendorEstimate } from "./body-paint-diagnosis-view";
import { FileText, Calculator, Calendar, Shield, AlertTriangle } from "lucide-react";

// =============================================================================
// 型定義
// =============================================================================

export interface EstimateItem {
  /** 項目ID */
  id: string;
  /** 項目名 */
  name: string;
  /** 数量 */
  quantity: number;
  /** 単価 */
  unitPrice: number;
  /** 金額 */
  amount: number;
  /** 備考 */
  note?: string;
}

export interface BodyPaintEstimateData {
  /** 見積もり項目 */
  items: EstimateItem[];
  /** 合計金額 */
  total: number;
  /** 作業期間（月） */
  workDuration: number; // 1-3カ月
  /** 保険対応の有無 */
  hasInsurance: boolean;
  /** 保険会社名（保険対応の場合） */
  insuranceCompany?: string;
  /** 保険承認日 */
  insuranceApprovalDate?: string;
}

// =============================================================================
// Props
// =============================================================================

interface BodyPaintEstimateViewProps {
  /** 外注先からの見積もり回答 */
  vendorEstimate?: VendorEstimate | null;
  /** 見積もりデータ */
  estimateData?: BodyPaintEstimateData | null;
  /** 見積もりデータ変更ハンドラ */
  onEstimateDataChange?: (data: BodyPaintEstimateData) => void;
  /** 保険対応の有無 */
  hasInsurance?: boolean;
  /** 保険対応変更ハンドラ */
  onHasInsuranceChange?: (hasInsurance: boolean) => void;
  /** 保険会社名 */
  insuranceCompany?: string;
  /** 保険会社名変更ハンドラ */
  onInsuranceCompanyChange?: (company: string) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 初期状態の見積もり項目を取得
 */
export function createInitialEstimateItem(): EstimateItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    note: "",
  };
}

/**
 * 見積もり項目の金額を計算
 */
function calculateItemAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

/**
 * 見積もり合計金額を計算
 */
function calculateTotal(items: EstimateItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

// =============================================================================
// Component
// =============================================================================

export function BodyPaintEstimateView({
  vendorEstimate,
  estimateData,
  onEstimateDataChange,
  hasInsurance = false,
  onHasInsuranceChange,
  insuranceCompany,
  onInsuranceCompanyChange,
  disabled = false,
}: BodyPaintEstimateViewProps) {
  const items = estimateData?.items || [];
  const total = estimateData?.total || 0;
  const workDuration = estimateData?.workDuration || 1;

  /**
   * 見積もり項目追加ハンドラ
   */
  const handleAddItem = () => {
    if (!onEstimateDataChange) return;
    const newItem = createInitialEstimateItem();
    const updatedItems = [...items, newItem];
    onEstimateDataChange({
      ...estimateData,
      items: updatedItems,
      total: calculateTotal(updatedItems),
      workDuration: estimateData?.workDuration || 1,
      hasInsurance: estimateData?.hasInsurance || false,
    } as BodyPaintEstimateData);
  };

  /**
   * 見積もり項目削除ハンドラ
   */
  const handleRemoveItem = (id: string) => {
    if (!onEstimateDataChange) return;
    const updatedItems = items.filter((item) => item.id !== id);
    onEstimateDataChange({
      ...estimateData,
      items: updatedItems,
      total: calculateTotal(updatedItems),
      workDuration: estimateData?.workDuration || 1,
      hasInsurance: estimateData?.hasInsurance || false,
    } as BodyPaintEstimateData);
  };

  /**
   * 見積もり項目更新ハンドラ
   */
  const handleUpdateItem = (id: string, updates: Partial<EstimateItem>) => {
    if (!onEstimateDataChange) return;
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // 数量または単価が変更された場合、金額を再計算
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          updated.amount = calculateItemAmount(updated.quantity, updated.unitPrice);
        }
        return updated;
      }
      return item;
    });
    onEstimateDataChange({
      ...estimateData,
      items: updatedItems,
      total: calculateTotal(updatedItems),
      workDuration: estimateData?.workDuration || 1,
      hasInsurance: estimateData?.hasInsurance || false,
    } as BodyPaintEstimateData);
  };

  /**
   * 作業期間変更ハンドラ
   */
  const handleWorkDurationChange = (duration: number) => {
    if (!onEstimateDataChange) return;
    onEstimateDataChange({
      ...estimateData,
      items: estimateData?.items || [],
      total: estimateData?.total || 0,
      workDuration: duration,
      hasInsurance: estimateData?.hasInsurance || false,
    } as BodyPaintEstimateData);
  };

  return (
    <div className="space-y-4">
      {/* 外注先からの見積もり回答表示 */}
      {vendorEstimate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-5 w-5 shrink-0" />
              外注先からの見積もり回答
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base text-slate-800">外注先名</Label>
                <p className="text-base font-medium text-slate-900 mt-1">
                  {vendorEstimate.vendorName || "-"}
                </p>
              </div>
              {vendorEstimate.total && (
                <div>
                  <Label className="text-base text-slate-800">見積金額</Label>
                  <p className="text-base font-medium text-slate-900 mt-1">
                    ¥{vendorEstimate.total.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {vendorEstimate.estimateText && (
              <div>
                <Label className="text-base text-slate-800">見積もり内容</Label>
                <div className="mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-base text-slate-800 whitespace-pre-wrap">
                    {vendorEstimate.estimateText}
                  </p>
                </div>
              </div>
            )}
            {vendorEstimate.responseDate && (
              <div>
                <Label className="text-base text-slate-800">見積もり回答日</Label>
                <p className="text-base font-medium text-slate-900 mt-1">
                  {vendorEstimate.responseDate}
                </p>
              </div>
            )}
            {vendorEstimate.note && (
              <div>
                <Label className="text-base text-slate-800">備考</Label>
                <p className="text-base text-slate-800 mt-1">{vendorEstimate.note}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 自社見積もり作成 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calculator className="h-5 w-5" />
            自社見積もり作成
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 見積もり項目リスト */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 border border-slate-200 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 text-base">
                    項目 #{index + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={disabled || items.length <= 1}
                    className="h-6 w-6 p-0 text-slate-700 hover:text-red-600"
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-base text-slate-800">項目名</Label>
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { name: e.target.value })
                    }
                    placeholder="例: 板金費用、塗装費用、部品費用"
                    disabled={disabled}
                    className="text-base"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-base text-slate-800">数量</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateItem(item.id, {
                          quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={disabled}
                      className="text-base"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base text-slate-800">単価</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleUpdateItem(item.id, {
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={disabled}
                      className="text-base"
                      min="0"
                      step="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base text-slate-800">金額</Label>
                    <Input
                      type="number"
                      value={item.amount}
                      disabled
                      className="text-base bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base text-slate-800">備考</Label>
                  <Textarea
                    value={item.note || ""}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { note: e.target.value })
                    }
                    placeholder="備考を入力..."
                    disabled={disabled}
                    rows={2}
                    className="text-base"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 見積もり項目追加ボタン */}
          <Button
            variant="outline"
            onClick={handleAddItem}
            disabled={disabled}
            className="w-full"
          >
            + 見積もり項目を追加
          </Button>

          <Separator />

          {/* 合計金額 */}
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-slate-900">合計金額</span>
            <span className="text-xl font-bold text-slate-900">
              ¥{total.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 作業期間 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" />
            作業期間
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base">作業期間（月）</Label>
            <Select
              value={workDuration.toString()}
              onValueChange={(value) => handleWorkDurationChange(parseInt(value))}
              disabled={disabled}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1カ月</SelectItem>
                <SelectItem value="2">2カ月</SelectItem>
                <SelectItem value="3">3カ月</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-base text-slate-700">
              外注先での作業期間は1カ月から3カ月（損傷の程度による）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 保険対応 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Shield className="h-5 w-5" />
            保険対応
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="has-insurance"
                checked={hasInsurance}
                onChange={(e) => {
                  if (onHasInsuranceChange) {
                    onHasInsuranceChange(e.target.checked);
                  }
                }}
                disabled={disabled}
                className="h-4 w-4 rounded border-slate-300"
              />
              <Label htmlFor="has-insurance" className="text-base cursor-pointer">
                保険対応あり
              </Label>
            </div>

            {hasInsurance && (
              <div className="space-y-2 pl-6">
                <Label className="text-base">保険会社名</Label>
                <Input
                  value={insuranceCompany || ""}
                  onChange={(e) => {
                    if (onInsuranceCompanyChange) {
                      onInsuranceCompanyChange(e.target.value);
                    }
                  }}
                  placeholder="保険会社名を入力"
                  disabled={disabled}
                  className="text-base"
                />
              </div>
            )}
          </div>

          {hasInsurance && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-base text-amber-900 font-medium mb-1">
                    保険対応の場合
                  </p>
                  <p className="text-base text-amber-800">
                    保険会社への見積もり提出と承認が必要です
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}









