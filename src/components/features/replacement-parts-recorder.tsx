"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReplacementPart } from "@/lib/inspection-pdf-generator";

// =============================================================================
// Props
// =============================================================================

interface ReplacementPartsRecorderProps {
  /** 交換部品リスト */
  parts: ReplacementPart[];
  /** 部品追加ハンドラ */
  onAdd?: (part: ReplacementPart) => void;
  /** 部品更新ハンドラ */
  onUpdate?: (index: number, part: ReplacementPart) => void;
  /** 部品削除ハンドラ */
  onDelete?: (index: number) => void;
  /** 無効化 */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ReplacementPartsRecorder({
  parts,
  onAdd,
  onUpdate,
  onDelete,
  disabled = false,
  className,
}: ReplacementPartsRecorderProps) {
  const [newPartName, setNewPartName] = useState("");
  const [newPartQuantity, setNewPartQuantity] = useState("");
  const [newPartUnit, setNewPartUnit] = useState("個");

  // 部品追加
  const handleAdd = () => {
    if (!newPartName.trim()) {
      return;
    }

    const quantity = parseFloat(newPartQuantity) || 1;
    if (quantity <= 0) {
      return;
    }

    const newPart: ReplacementPart = {
      name: newPartName.trim(),
      quantity,
      unit: newPartUnit || "個",
    };

    if (onAdd) {
      onAdd(newPart);
    }

    // フォームをリセット
    setNewPartName("");
    setNewPartQuantity("");
    setNewPartUnit("個");
  };

  // 部品更新
  const handleUpdate = (index: number, field: keyof ReplacementPart, value: string | number) => {
    if (!onUpdate) return;

    const updatedPart = { ...parts[index], [field]: value };
    onUpdate(index, updatedPart);
  };

  // 部品削除
  const handleDelete = (index: number) => {
    if (onDelete) {
      onDelete(index);
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-5 w-5 text-slate-600" />
          交換部品記録
          {parts.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {parts.length}件
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 部品リスト */}
        {parts.length > 0 && (
          <div className="space-y-2">
            {parts.map((part, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input
                    value={part.name}
                    onChange={(e) => handleUpdate(index, "name", e.target.value)}
                    placeholder="部品名"
                    disabled={disabled}
                    className="text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={part.quantity}
                      onChange={(e) =>
                        handleUpdate(index, "quantity", parseFloat(e.target.value) || 0)
                      }
                      placeholder="数量"
                      disabled={disabled}
                      min="0"
                      step="0.1"
                      className="text-sm"
                    />
                    <Input
                      value={part.unit}
                      onChange={(e) => handleUpdate(index, "unit", e.target.value)}
                      placeholder="単位"
                      disabled={disabled}
                      className="w-16 text-sm"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(index)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* 部品追加フォーム */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <Input
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              placeholder="部品名を入力"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !disabled) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              className="flex-1 text-sm"
            />
            <Input
              type="number"
              value={newPartQuantity}
              onChange={(e) => setNewPartQuantity(e.target.value)}
              placeholder="数量"
              disabled={disabled}
              min="0"
              step="0.1"
              className="w-20 text-sm"
            />
            <Input
              value={newPartUnit}
              onChange={(e) => setNewPartUnit(e.target.value)}
              placeholder="単位"
              disabled={disabled}
              className="w-16 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              disabled={disabled || !newPartName.trim()}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              追加
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            実際に交換した部品を記録してください。Enterキーで追加できます。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}















