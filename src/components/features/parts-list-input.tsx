"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Package } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface PartsListItem {
  /** 部品ID */
  id: string;
  /** 部品名 */
  name: string;
  /** 数量 */
  quantity: number;
  /** 単価 */
  unitPrice: number;
  /** メモ */
  note?: string;
}

// =============================================================================
// Props
// =============================================================================

export interface PartsListInputProps {
  /** 部品リスト */
  parts: PartsListItem[];
  /** 部品追加ハンドラ */
  onAdd: (part: Omit<PartsListItem, "id">) => void;
  /** 部品更新ハンドラ */
  onUpdate: (id: string, updates: Partial<PartsListItem>) => void;
  /** 部品削除ハンドラ */
  onDelete: (id: string) => void;
  /** 無効化 */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PartsListInput({
  parts,
  onAdd,
  onUpdate,
  onDelete,
  disabled = false,
  className,
}: PartsListInputProps) {
  const [newPartName, setNewPartName] = useState("");
  const [newPartQuantity, setNewPartQuantity] = useState(1);
  const [newPartUnitPrice, setNewPartUnitPrice] = useState(0);

  const handleAdd = () => {
    if (!newPartName.trim()) return;

    onAdd({
      name: newPartName.trim(),
      quantity: newPartQuantity,
      unitPrice: newPartUnitPrice,
    });

    setNewPartName("");
    setNewPartQuantity(1);
    setNewPartUnitPrice(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const totalAmount = parts.reduce(
    (sum, part) => sum + part.quantity * part.unitPrice,
    0
  );

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-5 w-5" />
          部品リスト
          {parts.length > 0 && (
            <span className="text-sm font-normal text-slate-500">
              ({parts.length}件)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 部品追加フォーム */}
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">部品名</Label>
                <Input
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="部品名を入力..."
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">数量</Label>
                <Input
                  type="number"
                  min="1"
                  value={newPartQuantity}
                  onChange={(e) => setNewPartQuantity(parseInt(e.target.value) || 1)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">単価（円）</Label>
                <Input
                  type="number"
                  min="0"
                  value={newPartUnitPrice}
                  onChange={(e) => setNewPartUnitPrice(parseInt(e.target.value) || 0)}
                  disabled={disabled}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleAdd}
              disabled={disabled || !newPartName.trim()}
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              部品を追加
            </Button>
          </div>

          {/* 部品リスト */}
          {parts.length > 0 ? (
            <div className="space-y-2">
              {parts.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs text-slate-500">部品名</Label>
                      <Input
                        value={part.name}
                        onChange={(e) =>
                          onUpdate(part.id, { name: e.target.value })
                        }
                        disabled={disabled}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">数量</Label>
                      <Input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) =>
                          onUpdate(part.id, {
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                        disabled={disabled}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">単価</Label>
                      <Input
                        type="number"
                        min="0"
                        value={part.unitPrice}
                        onChange={(e) =>
                          onUpdate(part.id, {
                            unitPrice: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={disabled}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">小計</Label>
                      <div className="h-9 flex items-center px-3 bg-slate-50 rounded-md text-sm font-medium">
                        ¥{(part.quantity * part.unitPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(part.id)}
                    disabled={disabled}
                    className="h-9 w-9 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* 合計 */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    部品合計
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">部品が登録されていません</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}















