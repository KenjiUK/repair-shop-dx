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
import {
  Calculator,
  Calendar,
  Package,
  Plus,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PartsListInput, PartsListItem } from "./parts-list-input";
import { PartStatus, PART_STATUSES } from "@/lib/restore-config";

// =============================================================================
// 型定義
// =============================================================================

export interface RestoreEstimateItem {
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

export interface RestorePartItem extends PartsListItem {
  /** 取り寄せ状況 */
  status: PartStatus;
  /** 到着予定日 */
  expectedArrivalDate?: string;
  /** 実際の到着日 */
  actualArrivalDate?: string;
  /** 遅延アラート */
  isDelayed?: boolean;
}

export interface AdditionalWorkItem {
  /** 追加作業ID */
  id: string;
  /** 追加作業内容 */
  content: string;
  /** 追加費用 */
  additionalCost: number;
  /** 追加作業の承認日時 */
  approvedAt?: string;
  /** 追加作業の実施日時 */
  completedAt?: string;
  /** 備考 */
  note?: string;
}

export interface EstimateChange {
  /** 変更ID */
  id: string;
  /** 変更日時 */
  changedAt: string;
  /** 変更内容 */
  changeContent: string;
  /** 変更前の金額 */
  previousTotal: number;
  /** 変更後の金額 */
  newTotal: number;
  /** 変更理由 */
  reason: string;
}

export interface RestoreEstimateData {
  /** 見積もり項目 */
  items: RestoreEstimateItem[];
  /** 部品リスト */
  parts: RestorePartItem[];
  /** 合計金額 */
  total: number;
  /** 作業期間 */
  workDuration: string;
  /** 追加作業リスト */
  additionalWork: AdditionalWorkItem[];
  /** 見積もりの変更履歴 */
  changeHistory: EstimateChange[];
}

// =============================================================================
// Props
// =============================================================================

interface RestoreEstimateViewProps {
  /** 見積もりデータ */
  estimateData?: RestoreEstimateData | null;
  /** 見積もりデータ変更ハンドラ */
  onEstimateDataChange?: (data: RestoreEstimateData) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 初期状態の見積もり項目を取得
 */
export function createInitialEstimateItem(): RestoreEstimateItem {
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
 * 初期状態の部品項目を取得
 */
export function createInitialPartItem(): RestorePartItem {
  return {
    id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: "",
    quantity: 1,
    unitPrice: 0,
    status: "在庫あり",
    note: "",
  };
}

/**
 * 初期状態の追加作業項目を取得
 */
export function createInitialAdditionalWorkItem(): AdditionalWorkItem {
  return {
    id: `additional-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: "",
    additionalCost: 0,
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
  items: RestoreEstimateItem[],
  parts: RestorePartItem[],
  additionalWork: AdditionalWorkItem[]
): number {
  const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const partsTotal = parts.reduce(
    (sum, part) => sum + part.quantity * part.unitPrice,
    0
  );
  const additionalWorkTotal = additionalWork.reduce(
    (sum, work) => sum + work.additionalCost,
    0
  );
  return itemsTotal + partsTotal + additionalWorkTotal;
}

// =============================================================================
// Component
// =============================================================================

export function RestoreEstimateView({
  estimateData,
  onEstimateDataChange,
  disabled = false,
}: RestoreEstimateViewProps) {
  const items = estimateData?.items || [];
  const parts = estimateData?.parts || [];
  const additionalWork = estimateData?.additionalWork || [];
  const changeHistory = estimateData?.changeHistory || [];
  const total = estimateData?.total || 0;
  const workDuration = estimateData?.workDuration || "";

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
      parts: estimateData?.parts || [],
      total: calculateTotal(updatedItems, parts, additionalWork),
      workDuration: estimateData?.workDuration || "",
      additionalWork: estimateData?.additionalWork || [],
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
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
      parts: estimateData?.parts || [],
      total: calculateTotal(updatedItems, parts, additionalWork),
      workDuration: estimateData?.workDuration || "",
      additionalWork: estimateData?.additionalWork || [],
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
  };

  /**
   * 見積もり項目更新ハンドラ
   */
  const handleUpdateItem = (id: string, updates: Partial<RestoreEstimateItem>) => {
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
      parts: estimateData?.parts || [],
      total: calculateTotal(updatedItems, parts, additionalWork),
      workDuration: estimateData?.workDuration || "",
      additionalWork: estimateData?.additionalWork || [],
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
  };

  /**
   * 部品追加ハンドラ
   */
  const handleAddPart = (part: Omit<PartsListItem, "id">) => {
    if (!onEstimateDataChange) return;
    const newPart: RestorePartItem = {
      ...createInitialPartItem(),
      ...part,
    };
    const updatedParts = [...parts, newPart];
    onEstimateDataChange({
      ...estimateData,
      items: estimateData?.items || [],
      parts: updatedParts,
      total: calculateTotal(items, updatedParts, additionalWork),
      workDuration: estimateData?.workDuration || "",
      additionalWork: estimateData?.additionalWork || [],
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
  };

  /**
   * 部品更新ハンドラ
   */
  const handleUpdatePart = (id: string, updates: Partial<RestorePartItem>) => {
    if (!onEstimateDataChange) return;
    const updatedParts = parts.map((part) =>
      part.id === id ? { ...part, ...updates } : part
    );
    onEstimateDataChange({
      ...estimateData,
      items: estimateData?.items || [],
      parts: updatedParts,
      total: calculateTotal(items, updatedParts, additionalWork),
      workDuration: estimateData?.workDuration || "",
      additionalWork: estimateData?.additionalWork || [],
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
  };

  /**
   * 部品削除ハンドラ
   */
  const handleDeletePart = (id: string) => {
    if (!onEstimateDataChange) return;
    const updatedParts = parts.filter((part) => part.id !== id);
    onEstimateDataChange({
      ...estimateData,
      items: estimateData?.items || [],
      parts: updatedParts,
      total: calculateTotal(items, updatedParts, additionalWork),
      workDuration: estimateData?.workDuration || "",
      additionalWork: estimateData?.additionalWork || [],
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
  };

  /**
   * 追加作業追加ハンドラ
   */
  const handleAddAdditionalWork = () => {
    if (!onEstimateDataChange) return;
    const newWork = createInitialAdditionalWorkItem();
    const updatedAdditionalWork = [...additionalWork, newWork];
    onEstimateDataChange({
      ...estimateData,
      items: estimateData?.items || [],
      parts: estimateData?.parts || [],
      total: calculateTotal(items, parts, updatedAdditionalWork),
      workDuration: estimateData?.workDuration || "",
      additionalWork: updatedAdditionalWork,
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
  };

  /**
   * 追加作業削除ハンドラ
   */
  const handleRemoveAdditionalWork = (id: string) => {
    if (!onEstimateDataChange) return;
    const updatedAdditionalWork = additionalWork.filter((work) => work.id !== id);
    onEstimateDataChange({
      ...estimateData,
      items: estimateData?.items || [],
      parts: estimateData?.parts || [],
      total: calculateTotal(items, parts, updatedAdditionalWork),
      workDuration: estimateData?.workDuration || "",
      additionalWork: updatedAdditionalWork,
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
  };

  /**
   * 追加作業更新ハンドラ
   */
  const handleUpdateAdditionalWork = (
    id: string,
    updates: Partial<AdditionalWorkItem>
  ) => {
    if (!onEstimateDataChange) return;
    const updatedAdditionalWork = additionalWork.map((work) =>
      work.id === id ? { ...work, ...updates } : work
    );
    onEstimateDataChange({
      ...estimateData,
      items: estimateData?.items || [],
      parts: estimateData?.parts || [],
      total: calculateTotal(items, parts, updatedAdditionalWork),
      workDuration: estimateData?.workDuration || "",
      additionalWork: updatedAdditionalWork,
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
  };

  /**
   * 見積もり変更履歴追加ハンドラ
   */
  const handleAddEstimateChange = (
    changeContent: string,
    previousTotal: number,
    newTotal: number,
    reason: string
  ) => {
    if (!onEstimateDataChange) return;
    const newChange: EstimateChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      changedAt: new Date().toISOString(),
      changeContent,
      previousTotal,
      newTotal,
      reason,
    };
    const updatedHistory = [...changeHistory, newChange];
    onEstimateDataChange({
      ...estimateData,
      items: estimateData?.items || [],
      parts: estimateData?.parts || [],
      total: estimateData?.total || 0,
      workDuration: estimateData?.workDuration || "",
      additionalWork: estimateData?.additionalWork || [],
      changeHistory: updatedHistory,
    } as RestoreEstimateData);
  };

  /**
   * 作業期間変更ハンドラ
   */
  const handleWorkDurationChange = (duration: string) => {
    if (!onEstimateDataChange) return;
    onEstimateDataChange({
      ...estimateData,
      items: estimateData?.items || [],
      parts: estimateData?.parts || [],
      total: estimateData?.total || 0,
      workDuration: duration,
      additionalWork: estimateData?.additionalWork || [],
      changeHistory: estimateData?.changeHistory || [],
    } as RestoreEstimateData);
  };

  return (
    <div className="space-y-4">
      {/* 見積もり項目 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calculator className="h-5 w-5 shrink-0" />
            見積もり項目
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
                  <Label className="text-base text-slate-800">項目名</Label>
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      handleUpdateItem(item.id, { name: e.target.value })
                    }
                    placeholder="例: 修復費用、作業費用"
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

          <Button
            variant="outline"
            onClick={handleAddItem}
            disabled={disabled}
            className="w-full"
          >
            + 見積もり項目を追加
          </Button>
        </CardContent>
      </Card>

      {/* 部品リスト（取り寄せ管理付き） */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5 shrink-0" />
            部品リスト
            {parts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {parts.length}件
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {parts.map((part) => {
              const isDelayed =
                part.status === "遅延" ||
                (part.expectedArrivalDate &&
                  new Date(part.expectedArrivalDate) < new Date() &&
                  part.status !== "到着済み");

              return (
                <div
                  key={part.id}
                  className={`p-4 border rounded-lg space-y-3 ${
                    isDelayed
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900 text-base">
                      {part.name || "部品名未入力"}
                    </h4>
                    <div className="flex items-center gap-2">
                      {isDelayed && (
                        <Badge variant="destructive" className="text-base">
                          遅延
                        </Badge>
                      )}
                      <Badge
                        variant={
                          part.status === "到着済み"
                            ? "default"
                            : part.status === "取り寄せ中"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-base"
                      >
                        {part.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeletePart(part.id)}
                        disabled={disabled}
                        className="h-6 w-6 p-0 text-slate-700 hover:text-red-600"
                      >
                        ×
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-base text-slate-800">数量</Label>
                      <Input
                        type="number"
                        value={part.quantity}
                        onChange={(e) =>
                          handleUpdatePart(part.id, {
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
                        value={part.unitPrice}
                        onChange={(e) =>
                          handleUpdatePart(part.id, {
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
                        value={part.quantity * part.unitPrice}
                        disabled
                        className="text-base bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-base text-slate-800">
                        取り寄せ状況
                      </Label>
                      <Select
                        value={part.status}
                        onValueChange={(value) =>
                          handleUpdatePart(part.id, {
                            status: value as PartStatus,
                          })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PART_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base text-slate-800">
                        到着予定日
                      </Label>
                      <Input
                        type="date"
                        value={part.expectedArrivalDate || ""}
                        onChange={(e) =>
                          handleUpdatePart(part.id, {
                            expectedArrivalDate: e.target.value,
                          })
                        }
                        disabled={disabled}
                        className="text-base"
                      />
                    </div>
                  </div>

                  {part.actualArrivalDate && (
                    <div className="space-y-2">
                      <Label className="text-base text-slate-800">実際の到着日</Label>
                      <Input
                        type="date"
                        value={part.actualArrivalDate}
                        onChange={(e) =>
                          handleUpdatePart(part.id, {
                            actualArrivalDate: e.target.value,
                          })
                        }
                        disabled={disabled}
                        className="text-base"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-base text-slate-800">備考</Label>
                    <Textarea
                      value={part.note || ""}
                      onChange={(e) =>
                        handleUpdatePart(part.id, { note: e.target.value })
                      }
                      placeholder="備考を入力..."
                      disabled={disabled}
                      rows={2}
                      className="text-base"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => {
              const newPart = createInitialPartItem();
              handleAddPart({
                name: newPart.name,
                quantity: newPart.quantity,
                unitPrice: newPart.unitPrice,
                note: newPart.note,
              });
            }}
            disabled={disabled}
            className="w-full"
          >
            + 部品を追加
          </Button>
        </CardContent>
      </Card>

      {/* 追加作業管理 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Plus className="h-5 w-5 shrink-0" />
            追加作業管理（イレギュラー対応）
            {additionalWork.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {additionalWork.length}件
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {additionalWork.map((work, index) => (
              <div
                key={work.id}
                className="p-4 border border-amber-300 bg-amber-50 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-900 text-base">
                    追加作業 #{index + 1}
                  </h4>
                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveAdditionalWork(work.id)}
                    disabled={disabled}
                    className="h-6 w-6 p-0 text-slate-700 hover:text-red-600"
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-base text-slate-800">追加作業内容</Label>
                  <Textarea
                    value={work.content}
                    onChange={(e) =>
                      handleUpdateAdditionalWork(work.id, {
                        content: e.target.value,
                      })
                    }
                    placeholder="追加作業内容を入力..."
                    disabled={disabled}
                    rows={3}
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base text-slate-800">追加費用</Label>
                  <Input
                    type="number"
                    value={work.additionalCost}
                    onChange={(e) =>
                      handleUpdateAdditionalWork(work.id, {
                        additionalCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    disabled={disabled}
                    className="text-base"
                    min="0"
                    step="1"
                  />
                </div>

                {work.approvedAt && (
                  <div className="space-y-2">
                    <Label className="text-base text-slate-800">承認日時</Label>
                    <Input
                      type="datetime-local"
                      value={work.approvedAt}
                      onChange={(e) =>
                        handleUpdateAdditionalWork(work.id, {
                          approvedAt: e.target.value,
                        })
                      }
                      disabled={disabled}
                      className="text-base"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-base text-slate-800">備考</Label>
                  <Textarea
                    value={work.note || ""}
                    onChange={(e) =>
                      handleUpdateAdditionalWork(work.id, { note: e.target.value })
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
            onClick={handleAddAdditionalWork}
            disabled={disabled}
            className="w-full"
          >
            + 追加作業を追加
          </Button>
        </CardContent>
      </Card>

      {/* 見積もりの変更履歴 */}
      {changeHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <History className="h-5 w-5" />
              見積もりの変更履歴
              <Badge variant="secondary" className="ml-2">
                {changeHistory.length}件
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {changeHistory.map((change) => (
              <div
                key={change.id}
                className="p-3 border border-slate-200 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-slate-900">
                    {new Date(change.changedAt).toLocaleString("ja-JP")}
                  </span>
                  <Badge variant="outline" className="text-base">
                    ¥{change.previousTotal.toLocaleString()} → ¥
                    {change.newTotal.toLocaleString()}
                  </Badge>
                </div>
                <p className="text-base text-slate-800">{change.changeContent}</p>
                <p className="text-base text-slate-700">理由: {change.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 作業期間 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5 shrink-0" />
            作業期間
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base">作業期間</Label>
            <Input
              value={workDuration}
              onChange={(e) => handleWorkDurationChange(e.target.value)}
              placeholder="例: 3カ月、6カ月、1年など"
              disabled={disabled}
              className="text-base"
            />
            <p className="text-base text-slate-700">
              レストアの作業期間はかなり長期（数週間から数カ月、場合によっては数年）
            </p>
          </div>
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
            {additionalWork.length > 0 && (
              <div className="flex items-center justify-between text-base">
                <span className="text-slate-700">追加作業</span>
                <span className="font-medium text-slate-900">
                  ¥
                  {additionalWork
                    .reduce((sum, work) => sum + work.additionalCost, 0)
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









