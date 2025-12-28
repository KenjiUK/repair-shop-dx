"use client";

/**
 * 追加見積ビュー
 * 
 * 車検の受入点検で発見された追加作業のみを表示するシンプルなビュー
 * - 受入点検で「交換」「修理」「調整」と判定された項目を自動生成
 * - Before写真を表示
 * - 金額入力
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Wrench,
  Settings,
  Camera,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// =============================================================================
// 型定義
// =============================================================================

export interface AdditionalEstimateItem {
  id: string;
  name: string;
  status: "exchange" | "repair" | "adjust";
  photoUrls?: string[];
  comment?: string;
  /** 見積に含めるか */
  selected: boolean;
  /** 部品代 */
  partsCost: number;
  /** 工賃 */
  laborCost: number;
}

export interface AdditionalEstimateViewProps {
  /** 受入点検で発見された項目 */
  items: AdditionalEstimateItem[];
  /** 項目変更ハンドラ */
  onItemsChange: (items: AdditionalEstimateItem[]) => void;
  /** 手動追加項目 */
  manualItems: AdditionalEstimateItem[];
  /** 手動追加項目変更ハンドラ */
  onManualItemsChange: (items: AdditionalEstimateItem[]) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// ヘルパー関数
// =============================================================================

const getStatusBadge = (status: "exchange" | "repair" | "adjust") => {
  switch (status) {
    case "exchange":
      return (
        <Badge variant="destructive" className="text-sm">
          <AlertTriangle className="h-3 w-3 mr-1" />
          要交換
        </Badge>
      );
    case "repair":
      return (
        <Badge variant="default" className="bg-orange-500 text-sm">
          <Wrench className="h-3 w-3 mr-1" />
          要修理
        </Badge>
      );
    case "adjust":
      return (
        <Badge variant="secondary" className="text-sm">
          <Settings className="h-3 w-3 mr-1" />
          要調整
        </Badge>
      );
  }
};

// =============================================================================
// コンポーネント
// =============================================================================

export function AdditionalEstimateView({
  items,
  onItemsChange,
  manualItems,
  onManualItemsChange,
  disabled = false,
}: AdditionalEstimateViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 項目の選択切り替え
  const handleToggleSelect = (itemId: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, selected: !item.selected } : item
    );
    onItemsChange(updatedItems);
  };

  // 部品代変更
  const handlePartsCostChange = (itemId: string, value: number) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, partsCost: value } : item
    );
    onItemsChange(updatedItems);
  };

  // 工賃変更
  const handleLaborCostChange = (itemId: string, value: number) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, laborCost: value } : item
    );
    onItemsChange(updatedItems);
  };

  // 展開/折りたたみ
  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // 手動項目追加
  const handleAddManualItem = () => {
    const newItem: AdditionalEstimateItem = {
      id: `manual-${Date.now()}`,
      name: "",
      status: "repair",
      selected: true,
      partsCost: 0,
      laborCost: 0,
    };
    onManualItemsChange([...manualItems, newItem]);
  };

  // 手動項目削除
  const handleRemoveManualItem = (itemId: string) => {
    const updatedItems = manualItems.filter((item) => item.id !== itemId);
    onManualItemsChange(updatedItems);
  };

  // 手動項目名変更
  const handleManualItemNameChange = (itemId: string, name: string) => {
    const updatedItems = manualItems.map((item) =>
      item.id === itemId ? { ...item, name } : item
    );
    onManualItemsChange(updatedItems);
  };

  // 手動項目部品代変更
  const handleManualPartsCostChange = (itemId: string, value: number) => {
    const updatedItems = manualItems.map((item) =>
      item.id === itemId ? { ...item, partsCost: value } : item
    );
    onManualItemsChange(updatedItems);
  };

  // 手動項目工賃変更
  const handleManualLaborCostChange = (itemId: string, value: number) => {
    const updatedItems = manualItems.map((item) =>
      item.id === itemId ? { ...item, laborCost: value } : item
    );
    onManualItemsChange(updatedItems);
  };

  // 合計計算
  const selectedItems = [...items, ...manualItems].filter((item) => item.selected);
  const totalPartsCost = selectedItems.reduce((sum, item) => sum + item.partsCost, 0);
  const totalLaborCost = selectedItems.reduce((sum, item) => sum + item.laborCost, 0);
  const totalCost = totalPartsCost + totalLaborCost;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">追加作業見積</h2>
          <p className="text-sm text-slate-500 mt-1">
            受入点検で発見された {items.length} 件の追加作業
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">選択中: {selectedItems.length} 件</p>
          <p className="text-2xl font-bold text-slate-900">
            ¥{totalCost.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 追加作業リスト（受入点検から自動生成） */}
      {items.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500">
              受入点検で追加作業が見つかりませんでした
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const itemTotal = item.partsCost + item.laborCost;

            return (
              <Card
                key={item.id}
                className={cn(
                  "border transition-all",
                  item.selected
                    ? "border-blue-300 bg-blue-50/50"
                    : "border-slate-200 opacity-60"
                )}
              >
                <CardContent className="p-4">
                  {/* メイン行 */}
                  <div className="flex items-start gap-3">
                    {/* チェックボックス */}
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => handleToggleSelect(item.id)}
                      disabled={disabled}
                      className="mt-1 h-5 w-5"
                    />

                    {/* コンテンツ */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-base text-slate-900">
                            {item.name}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <span className="text-lg font-semibold text-slate-900 shrink-0">
                          ¥{itemTotal.toLocaleString()}
                        </span>
                      </div>

                      {/* 写真プレビュー */}
                      {item.photoUrls && item.photoUrls.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Camera className="h-4 w-4 text-slate-400" />
                          <div className="flex gap-1">
                            {item.photoUrls.slice(0, 3).map((url, index) => (
                              <div
                                key={index}
                                className="relative h-10 w-10 rounded overflow-hidden border border-slate-200"
                              >
                                <Image
                                  src={url}
                                  alt={`${item.name} 写真${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            {item.photoUrls.length > 3 && (
                              <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                                +{item.photoUrls.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* コメント */}
                      {item.comment && (
                        <p className="text-sm text-slate-500 mt-1">{item.comment}</p>
                      )}

                      {/* 展開/折りたたみボタン */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(item.id)}
                        className="mt-2 -ml-2 text-slate-500"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            金額入力を閉じる
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            金額を入力
                          </>
                        )}
                      </Button>

                      {/* 金額入力（展開時） */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm text-slate-500">部品代</Label>
                              <Input
                                type="number"
                                min={0}
                                value={item.partsCost || ""}
                                onChange={(e) =>
                                  handlePartsCostChange(
                                    item.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                disabled={disabled}
                                className="mt-1"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-slate-500">工賃</Label>
                              <Input
                                type="number"
                                min={0}
                                value={item.laborCost || ""}
                                onChange={(e) =>
                                  handleLaborCostChange(
                                    item.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                disabled={disabled}
                                className="mt-1"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 手動追加項目 */}
      {manualItems.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-base font-medium text-slate-700 mb-3">手動追加項目</h3>
            <div className="space-y-3">
              {manualItems.map((item) => (
                <Card key={item.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label className="text-sm text-slate-500">作業内容</Label>
                          <Input
                            value={item.name}
                            onChange={(e) =>
                              handleManualItemNameChange(item.id, e.target.value)
                            }
                            disabled={disabled}
                            placeholder="作業内容を入力"
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-sm text-slate-500">部品代</Label>
                            <Input
                              type="number"
                              min={0}
                              value={item.partsCost || ""}
                              onChange={(e) =>
                                handleManualPartsCostChange(
                                  item.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={disabled}
                              className="mt-1"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-slate-500">工賃</Label>
                            <Input
                              type="number"
                              min={0}
                              value={item.laborCost || ""}
                              onChange={(e) =>
                                handleManualLaborCostChange(
                                  item.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={disabled}
                              className="mt-1"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveManualItem(item.id)}
                        disabled={disabled}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 追加ボタン */}
      <Button
        variant="outline"
        onClick={handleAddManualItem}
        disabled={disabled}
        className="w-full border-dashed border-2 h-12"
      >
        <Plus className="h-4 w-4 mr-2" />
        作業を追加
      </Button>

      {/* 合計 */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">部品代 合計</span>
              <span className="font-medium">¥{totalPartsCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">工賃 合計</span>
              <span className="font-medium">¥{totalLaborCost.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-medium text-slate-700">追加作業 合計</span>
              <span className="font-bold text-slate-900">
                ¥{totalCost.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




