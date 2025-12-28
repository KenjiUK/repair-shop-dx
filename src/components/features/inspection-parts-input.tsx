"use client";

/**
 * 交換部品入力コンポーネント
 * 
 * 12ヶ月点検・24ヶ月点検で使用する交換部品の入力
 * デザインシステム準拠
 */

import * as React from "react";
import { InspectionParts } from "@/types/inspection-redesign";
import { CustomPartItem } from "@/types/inspection-parts-custom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Wrench } from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface InspectionPartsInputProps {
  /** 交換部品データ */
  parts: InspectionParts;
  /** 交換部品変更ハンドラ */
  onPartsChange: (parts: InspectionParts) => void;
  /** カスタム品目リスト */
  customItems?: CustomPartItem[];
  /** カスタム品目変更ハンドラ */
  onCustomItemsChange?: (items: CustomPartItem[]) => void;
  /** 点検タイプ */
  type: "12month" | "24month";
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 交換部品入力コンポーネント
 */
export function InspectionPartsInput({
  parts,
  onPartsChange,
  customItems = [],
  onCustomItemsChange,
  type,
  disabled = false,
}: InspectionPartsInputProps) {
  // 数値入力ハンドラ
  const handleNumberChange = (
    field: keyof InspectionParts,
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    onPartsChange({
      ...parts,
      [field]: numValue,
    });
  };

  // カスタム品目を追加
  const handleAddCustomItem = () => {
    if (!onCustomItemsChange) return;
    const newItem: CustomPartItem = {
      id: `custom-${Date.now()}`,
      name: "",
      quantity: 0,
    };
    onCustomItemsChange([...customItems, newItem]);
  };

  // カスタム品目を削除
  const handleRemoveCustomItem = (id: string) => {
    if (!onCustomItemsChange) return;
    onCustomItemsChange(customItems.filter((item) => item.id !== id));
  };

  // カスタム品目を更新
  const handleUpdateCustomItem = (id: string, updates: Partial<CustomPartItem>) => {
    if (!onCustomItemsChange) return;
    onCustomItemsChange(
      customItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // カスタム品目が必須のため、初期化時に1つ追加
  React.useEffect(() => {
    if (onCustomItemsChange && customItems.length === 0) {
      const newItem: CustomPartItem = {
        id: `custom-${Date.now()}`,
        name: "",
        quantity: 0,
      };
      onCustomItemsChange([newItem]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="border-slate-200 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-slate-600 shrink-0" />
          交換部品等
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* 自由記入形式：全てカスタム品目 */}
        {onCustomItemsChange && (
          <div className="space-y-4">
            {/* 品目一覧 */}
            {customItems.length > 0 && (
              <div className="space-y-3">
                {customItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-3 py-3 border-b border-slate-200 last:border-b-0"
                  >
                    <div className="flex-1">
                      <Input
                        id={`custom-name-${item.id}`}
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateCustomItem(item.id, { name: e.target.value })
                        }
                        placeholder="品名（例: エンジンオイル）"
                        disabled={disabled}
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        id={`custom-quantity-${item.id}`}
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.quantity || ""}
                        onChange={(e) =>
                          handleUpdateCustomItem(item.id, {
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="数量"
                        disabled={disabled}
                        className="h-12 text-base text-right"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCustomItem(item.id)}
                      disabled={disabled || customItems.length === 1}
                      className="h-12 w-12 text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 品目追加ボタン */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleAddCustomItem}
              disabled={disabled}
              className="w-full h-12 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-dashed border-slate-300"
            >
              <Plus className="h-5 w-5 mr-2" />
              品目を追加
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

