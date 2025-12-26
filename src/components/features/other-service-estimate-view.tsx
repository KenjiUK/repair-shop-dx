"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, Plus, Package, X } from "lucide-react";
import { PartsListInput, PartsListItem } from "./parts-list-input";

// =============================================================================
// 型定義
// =============================================================================

export interface CustomEstimateItem {
  /** 項目ID */
  id: string;
  /** 項目名（自由入力） */
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

export interface OtherServiceEstimateData {
  /** 見積もり項目（カスタマイズ可能） */
  items: CustomEstimateItem[];
  /** 部品リスト（必要に応じて） */
  parts?: PartsListItem[];
  /** 合計金額 */
  total: number;
}

// =============================================================================
// Props
// =============================================================================

interface OtherServiceEstimateViewProps {
  /** 見積もりデータ */
  estimateData?: OtherServiceEstimateData | null;
  /** 見積もりデータ変更ハンドラ */
  onEstimateDataChange?: (data: OtherServiceEstimateData) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 初期状態の見積もり項目を取得
 */
export function createInitialCustomEstimateItem(): CustomEstimateItem {
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
function calculateTotal(
  items: CustomEstimateItem[],
  parts: PartsListItem[] = []
): number {
  const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const partsTotal = parts.reduce(
    (sum, part) => sum + part.quantity * part.unitPrice,
    0
  );
  return itemsTotal + partsTotal;
}

// =============================================================================
// Component
// =============================================================================

export function OtherServiceEstimateView({
  estimateData,
  onEstimateDataChange,
  disabled = false,
}: OtherServiceEstimateViewProps) {
  const items = estimateData?.items || [];
  const parts = estimateData?.parts || [];
  const total = estimateData?.total || 0;

  /**
   * 見積もり項目追加ハンドラ
   */
  const handleAddItem = () => {
    if (!onEstimateDataChange) return;
    const newItem = createInitialCustomEstimateItem();
    const updatedItems = [...items, newItem];
    onEstimateDataChange({
      items: updatedItems,
      parts: estimateData?.parts || [],
      total: calculateTotal(updatedItems, parts),
    });
  };

  /**
   * 見積もり項目削除ハンドラ
   */
  const handleRemoveItem = (id: string) => {
    if (!onEstimateDataChange) return;
    const updatedItems = items.filter((item) => item.id !== id);
    onEstimateDataChange({
      items: updatedItems,
      parts: estimateData?.parts || [],
      total: calculateTotal(updatedItems, parts),
    });
  };

  /**
   * 見積もり項目更新ハンドラ
   */
  const handleUpdateItem = (id: string, updates: Partial<CustomEstimateItem>) => {
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
      items: updatedItems,
      parts: estimateData?.parts || [],
      total: calculateTotal(updatedItems, parts),
    });
  };

  /**
   * 部品追加ハンドラ
   */
  const handleAddPart = (part: Omit<PartsListItem, "id">) => {
    if (!onEstimateDataChange) return;
    const newPart: PartsListItem = {
      id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...part,
    };
    const updatedParts = [...parts, newPart];
    onEstimateDataChange({
      items: estimateData?.items || [],
      parts: updatedParts,
      total: calculateTotal(items, updatedParts),
    });
  };

  /**
   * 部品更新ハンドラ
   */
  const handleUpdatePart = (id: string, updates: Partial<PartsListItem>) => {
    if (!onEstimateDataChange) return;
    const updatedParts = parts.map((part) =>
      part.id === id ? { ...part, ...updates } : part
    );
    onEstimateDataChange({
      items: estimateData?.items || [],
      parts: updatedParts,
      total: calculateTotal(items, updatedParts),
    });
  };

  /**
   * 部品削除ハンドラ
   */
  const handleDeletePart = (id: string) => {
    if (!onEstimateDataChange) return;
    const updatedParts = parts.filter((part) => part.id !== id);
    onEstimateDataChange({
      items: estimateData?.items || [],
      parts: updatedParts,
      total: calculateTotal(items, updatedParts),
    });
  };

  return (
    <div className="space-y-4">
      {/* 見積もり項目（カスタマイズ可能） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calculator className="h-5 w-5 shrink-0" />
            見積もり項目
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {items.length}件
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <Label className="text-base text-slate-700">項目名</Label>
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { name: e.target.value })
                    }
                    placeholder="見積項目名を入力"
                    disabled={disabled}
                    className="text-base"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-base text-slate-700">数量</Label>
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
                    <Label className="text-base text-slate-700">単価</Label>
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
                    <Label className="text-base text-slate-700">金額</Label>
                    <Input
                      type="number"
                      value={item.amount}
                      disabled
                      className="text-base bg-slate-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-base text-slate-700">備考</Label>
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

          <Button
            variant="outline"
            onClick={handleAddItem}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            見積もり項目を追加
          </Button>
        </CardContent>
      </Card>

      {/* 部品リスト（必要に応じて） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5" />
            部品リスト（任意）
            {parts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {parts.length}件
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PartsListInput
            parts={parts}
            onAdd={handleAddPart}
            onUpdate={handleUpdatePart}
            onDelete={handleDeletePart}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* 合計金額 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">見積金額</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {items.length > 0 && (
              <div className="flex items-center justify-between text-base">
                <span className="text-slate-700">見積もり項目</span>
                <span className="font-medium text-slate-900">
                  ¥
                  {items
                    .reduce((sum, item) => sum + item.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
            )}
            {parts.length > 0 && (
              <div className="flex items-center justify-between text-base">
                <span className="text-slate-700">部品</span>
                <span className="font-medium text-slate-900">
                  ¥
                  {parts
                    .reduce(
                      (sum, part) => sum + part.quantity * part.unitPrice,
                      0
                    )
                    .toLocaleString()}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-slate-900">合計</span>
              <span className="text-xl font-bold text-slate-900">
                ¥{total.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









