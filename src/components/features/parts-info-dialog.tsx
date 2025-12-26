/**
 * 部品情報管理ダイアログ
 * 改善提案 #3: 部品調達待ち案件の管理機能
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Package } from "lucide-react";
import { PartsInfo, PartItem } from "@/types";
import {
  createInitialPartsInfo,
  createInitialPartItem,
} from "@/lib/parts-info-utils";
import { cn } from "@/lib/utils";

interface PartsInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partsInfo: PartsInfo | null;
  onSave: (partsInfo: PartsInfo) => void;
  jobId: string;
}

export function PartsInfoDialog({
  open,
  onOpenChange,
  partsInfo: initialPartsInfo,
  onSave,
  jobId,
}: PartsInfoDialogProps) {
  const [partsInfo, setPartsInfo] = useState<PartsInfo>(
    initialPartsInfo || createInitialPartsInfo()
  );

  // 初期値が変更されたときに更新
  useEffect(() => {
    if (initialPartsInfo) {
      setPartsInfo(initialPartsInfo);
    } else {
      setPartsInfo(createInitialPartsInfo());
    }
  }, [initialPartsInfo, open]);

  const handleAddPart = () => {
    const newPart = createInitialPartItem();
    setPartsInfo((prev) => ({
      ...prev,
      parts: [...prev.parts, newPart],
    }));
  };

  const handleRemovePart = (partId: string) => {
    setPartsInfo((prev) => ({
      ...prev,
      parts: prev.parts.filter((p) => p.id !== partId),
    }));
  };

  const handleUpdatePart = (partId: string, updates: Partial<PartItem>) => {
    setPartsInfo((prev) => ({
      ...prev,
      parts: prev.parts.map((p) =>
        p.id === partId ? { ...p, ...updates } : p
      ),
    }));
  };

  const handleSave = () => {
    // バリデーション
    const hasEmptyParts = partsInfo.parts.some(
      (p) => !p.name.trim() || p.quantity <= 0
    );
    
    if (hasEmptyParts) {
      // 空の部品を削除
      const validParts = partsInfo.parts.filter(
        (p) => p.name.trim() && p.quantity > 0
      );
      
      setPartsInfo((prev) => ({
        ...prev,
        parts: validParts,
      }));
      
      onSave({
        ...partsInfo,
        parts: validParts,
      });
    } else {
      onSave(partsInfo);
    }
    
    onOpenChange(false);
  };

  const getStatusLabel = (status: PartItem["status"]): string => {
    switch (status) {
      case "not_ordered":
        return "未発注";
      case "ordered":
        return "発注済み";
      case "shipping":
        return "配送中";
      case "arrived":
        return "到着済み";
      default:
        return "不明";
    }
  };

  const getStatusColor = (status: PartItem["status"]): string => {
    switch (status) {
      case "not_ordered":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "ordered":
        return "bg-blue-100 text-blue-700 border-blue-400";
      case "shipping":
        return "bg-amber-100 text-amber-900 border-amber-400"; // yellow → amber, text-amber-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
      case "arrived":
        return "bg-green-100 text-green-700 border-green-400";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            部品調達情報
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 部品リスト */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              部品リスト
            </Label>
            <div className="space-y-3">
              {partsInfo.parts.map((part, index) => (
                <div
                  key={part.id}
                  className="p-4 border rounded-lg bg-slate-50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* 部品名 */}
                      <div>
                        <Label className="text-base text-slate-800">部品名 *</Label>
                        <Input
                          value={part.name}
                          onChange={(e) =>
                            handleUpdatePart(part.id, { name: e.target.value })
                          }
                          placeholder="部品名"
                          className="mt-1"
                        />
                      </div>

                      {/* 部品番号 */}
                      <div>
                        <Label className="text-base text-slate-800">部品番号</Label>
                        <Input
                          value={part.partNumber || ""}
                          onChange={(e) =>
                            handleUpdatePart(part.id, {
                              partNumber: e.target.value || null,
                            })
                          }
                          placeholder="部品番号"
                          className="mt-1"
                        />
                      </div>

                      {/* 数量 */}
                      <div>
                        <Label className="text-base text-slate-800">数量 *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) =>
                            handleUpdatePart(part.id, {
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          className="mt-1"
                        />
                      </div>

                      {/* 単価 */}
                      <div>
                        <Label className="text-base text-slate-800">単価（円）</Label>
                        <Input
                          type="number"
                          min="0"
                          value={part.unitPrice || ""}
                          onChange={(e) =>
                            handleUpdatePart(part.id, {
                              unitPrice: e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            })
                          }
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>

                      {/* サプライヤー */}
                      <div>
                        <Label className="text-base text-slate-800">サプライヤー</Label>
                        <Input
                          value={part.supplier || ""}
                          onChange={(e) =>
                            handleUpdatePart(part.id, {
                              supplier: e.target.value || null,
                            })
                          }
                          placeholder="発注先"
                          className="mt-1"
                        />
                      </div>

                      {/* 発注日 */}
                      <div>
                        <Label className="text-base text-slate-800">発注日</Label>
                        <Input
                          type="date"
                          value={
                            part.orderDate
                              ? new Date(part.orderDate).toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdatePart(part.id, {
                              orderDate: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : null,
                            })
                          }
                          className="mt-1"
                        />
                      </div>

                      {/* 到着予定日 */}
                      <div>
                        <Label className="text-base text-slate-800">到着予定日</Label>
                        <Input
                          type="date"
                          value={
                            part.expectedArrivalDate
                              ? new Date(part.expectedArrivalDate)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdatePart(part.id, {
                              expectedArrivalDate: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : null,
                            })
                          }
                          className="mt-1"
                        />
                      </div>

                      {/* ステータス */}
                      <div>
                        <Label className="text-base text-slate-800">ステータス</Label>
                        <Select
                          value={part.status}
                          onValueChange={(value: PartItem["status"]) =>
                            handleUpdatePart(part.id, { status: value })
                          }
                        >
                          <SelectTrigger className="mt-1 h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_ordered">未発注</SelectItem>
                            <SelectItem value="ordered">発注済み</SelectItem>
                            <SelectItem value="shipping">配送中</SelectItem>
                            <SelectItem value="arrived">到着済み</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 削除ボタン */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePart(part.id)}
                      className="ml-2 shrink-0"
                    >
                      <X className="h-5 w-5" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                    </Button>
                  </div>

                  {/* ステータスバッジ */}
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-1 rounded text-base font-medium border",
                        getStatusColor(part.status)
                      )}
                    >
                      {getStatusLabel(part.status)}
                    </span>
                    {part.actualArrivalDate && (
                      <span className="text-base text-slate-700">
                        到着日:{" "}
                        {new Date(part.actualArrivalDate).toLocaleDateString(
                          "ja-JP"
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {partsInfo.parts.length === 0 && (
                <div className="text-center py-8 text-slate-700">
                  部品が登録されていません
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleAddPart}
                className="w-full mt-2"
              >
                <Plus className="h-5 w-5 mr-2" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                部品を追加
              </Button>
            </div>
          </div>

          {/* 到着予定日（全体） */}
          <div>
            <Label className="text-base font-semibold mb-2 block">
              到着予定日（全体）
            </Label>
            <Input
              type="date"
              value={
                partsInfo.expectedArrivalDate
                  ? new Date(partsInfo.expectedArrivalDate)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setPartsInfo((prev) => ({
                  ...prev,
                  expectedArrivalDate: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                }))
              }
            />
          </div>

          {/* 調達状況 */}
          <div>
            <Label className="text-base font-semibold mb-2 block">
              調達状況
            </Label>
            <Select
              value={partsInfo.procurementStatus}
              onValueChange={(value: PartsInfo["procurementStatus"]) =>
                setPartsInfo((prev) => ({
                  ...prev,
                  procurementStatus: value,
                }))
              }
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_ordered">未発注</SelectItem>
                <SelectItem value="ordered">発注済み</SelectItem>
                <SelectItem value="shipping">配送中</SelectItem>
                <SelectItem value="arrived">到着済み</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

