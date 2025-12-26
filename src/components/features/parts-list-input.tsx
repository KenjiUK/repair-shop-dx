"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, CheckCircle2, Clock, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

/**
 * 部品の到着状況
 */
export type PartsArrivalStatus = "pending" | "ordered" | "arrived" | "stored" | "contacted";

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
  /** 発注先 */
  vendor?: string;
  /** 到着状況 */
  arrivalStatus?: PartsArrivalStatus;
  /** 到着日時 */
  arrivalDate?: string; // ISO8601
  /** 在庫場所 */
  storageLocation?: string;
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

  // 発注状況サマリー
  const partsSummary = useMemo(() => {
    const total = parts.length;
    const pending = parts.filter((p) => !p.arrivalStatus || p.arrivalStatus === "pending").length;
    const ordered = parts.filter((p) => p.arrivalStatus === "ordered").length;
    const arrived = parts.filter((p) => p.arrivalStatus === "arrived").length;
    const stored = parts.filter((p) => p.arrivalStatus === "stored").length;
    const allArrived = total > 0 && arrived + stored === total;
    
    return { total, pending, ordered, arrived, stored, allArrived };
  }, [parts]);

  // 到着状況の表示名を取得
  const getArrivalStatusLabel = (status?: PartsArrivalStatus): string => {
    switch (status) {
      case "ordered":
        return "発注済み";
      case "arrived":
        return "到着済み";
      case "stored":
        return "在庫済み";
      default:
        return "未発注";
    }
  };

  // 到着状況のバッジ色を取得
  const getArrivalStatusBadgeVariant = (status?: PartsArrivalStatus): "default" | "secondary" | "outline" => {
    switch (status) {
      case "ordered":
        return "secondary";
      case "arrived":
        return "default";
      case "stored":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="h-5 w-5 shrink-0" />
            部品リスト
            {parts.length > 0 && (
              <span className="text-base font-normal text-slate-700">
                ({parts.length}件)
              </span>
            )}
          </CardTitle>
          {/* 発注状況サマリー */}
          {parts.length > 0 && (
            <div className="flex items-center gap-2 text-base">
              {partsSummary.pending > 0 && (
                <Badge variant="outline" className="text-base">
                  未発注: {partsSummary.pending}
                </Badge>
              )}
              {partsSummary.ordered > 0 && (
                <Badge variant="secondary" className="text-base">
                  発注済み: {partsSummary.ordered}
                </Badge>
              )}
              {partsSummary.arrived > 0 && (
                <Badge variant="default" className="text-base bg-blue-500">
                  到着済み: {partsSummary.arrived}
                </Badge>
              )}
              {partsSummary.stored > 0 && (
                <Badge variant="default" className="text-base bg-green-500">
                  在庫済み: {partsSummary.stored}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 部品追加フォーム */}
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-base">部品名</Label>
                <Input
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="部品名を入力..."
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-base">数量</Label>
                <Input
                  type="number"
                  min="1"
                  value={newPartQuantity}
                  onChange={(e) => setNewPartQuantity(parseInt(e.target.value) || 1)}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-base">単価（円）</Label>
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
              className="w-full"
            >
              <Plus className="h-5 w-5 mr-1" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
              部品を追加
            </Button>
          </div>

          {/* 部品リスト */}
          {parts.length > 0 ? (
            <div className="space-y-3">
              {parts.map((part) => {
                const isArrived = part.arrivalStatus === "arrived" || part.arrivalStatus === "stored";
                const isStored = part.arrivalStatus === "stored";
                
                return (
                  <div
                    key={part.id}
                    className={cn(
                      "p-4 bg-white rounded-lg border",
                      isArrived ? "border-green-300 bg-green-50/30" : "border-slate-200"
                    )}
                  >
                    {/* 第1行: 基本情報 */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* 到着済みチェックボックス */}
                      <div className="pt-7">
                        <Checkbox
                          checked={isArrived}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // 到着済みに変更
                              onUpdate(part.id, {
                                arrivalStatus: "arrived",
                                arrivalDate: new Date().toISOString(),
                              });
                            } else {
                              // 未到着に戻す
                              onUpdate(part.id, {
                                arrivalStatus: "pending",
                                arrivalDate: undefined,
                                storageLocation: undefined,
                              });
                            }
                          }}
                          disabled={disabled}
                          className="h-5 w-5"
                        />
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-base text-slate-700">部品名</Label>
                          <Input
                            value={part.name}
                            onChange={(e) =>
                              onUpdate(part.id, { name: e.target.value })
                            }
                            disabled={disabled}
                            className="h-12 truncate"
                            title={part.name}
                          />
                        </div>
                        <div>
                          <Label className="text-base text-slate-700">数量</Label>
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
                            className="h-12"
                          />
                        </div>
                        <div>
                          <Label className="text-base text-slate-700">単価</Label>
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
                            className="h-12"
                          />
                        </div>
                        <div>
                          <Label className="text-base text-slate-700">小計</Label>
                          <div className="h-12 flex items-center px-3 bg-slate-50 rounded-md text-base font-medium">
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
                        className="h-12 w-12 text-slate-700 hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="h-5 w-5" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                      </Button>
                    </div>

                    {/* 第2行: 発注・到着情報 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                      {/* 発注先 */}
                      <div>
                        <Label className="text-base text-slate-700 flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          発注先
                        </Label>
                        <Input
                          value={part.vendor || ""}
                          onChange={(e) =>
                            onUpdate(part.id, { vendor: e.target.value || undefined })
                          }
                          placeholder="発注先を入力..."
                          disabled={disabled}
                          className="h-12 truncate"
                          title={part.vendor}
                        />
                      </div>
                      
                      {/* 到着状況 */}
                      <div>
                        <Label className="text-base text-slate-700 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          到着状況
                        </Label>
                        <div className="h-12 flex items-center">
                          <Badge
                            variant={getArrivalStatusBadgeVariant(part.arrivalStatus)}
                            className="text-base"
                          >
                            {getArrivalStatusLabel(part.arrivalStatus)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* 到着日時 */}
                      {isArrived && part.arrivalDate && (
                        <div>
                          <Label className="text-base text-slate-700 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            到着日時
                          </Label>
                          <div className="h-12 flex items-center px-3 bg-slate-50 rounded-md text-base text-slate-800">
                            {new Date(part.arrivalDate).toLocaleString("ja-JP", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* 在庫場所 */}
                      {isArrived && (
                        <div>
                          <Label className="text-base text-slate-700 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            在庫場所
                          </Label>
                          <Input
                            value={part.storageLocation || ""}
                            onChange={(e) => {
                              const location = e.target.value || undefined;
                              onUpdate(part.id, {
                                storageLocation: location,
                                // 在庫場所が入力されたら「在庫済み」に変更
                                arrivalStatus: location ? "stored" : "arrived",
                              });
                            }}
                            placeholder="在庫場所を入力..."
                            disabled={disabled}
                            className="h-12 truncate"
                            title={part.storageLocation}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 合計 */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-slate-800">
                    部品合計
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-700">
              <Package className="h-12 w-12 mx-auto mb-2 text-slate-300" />
              <p className="text-base">部品が登録されていません</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}























