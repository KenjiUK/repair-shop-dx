/**
 * 見積履歴の差分表示セクション
 * 
 * 見積履歴を「一覧」ではなく「差分」で表示する機能
 * - 見積 v1（事前）、v2（受入れ）、v3（作業中）を履歴として記録
 * - 差分表示: 追加・削除・金額差分・変更理由
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { History, Plus, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { EstimateLineItem } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// 型定義
// =============================================================================

export interface EstimateVersion {
  version: number;
  versionLabel: string; // "v1（事前）", "v2（受入れ）", "v3（作業中）"
  items: EstimateLineItem[];
  totalAmount: number;
  createdAt: string;
  changeReason?: string; // 変更理由（必須入力）
}

export interface EstimateHistoryDiff {
  fromVersion: number;
  toVersion: number;
  addedItems: EstimateLineItem[];
  removedItems: EstimateLineItem[];
  modifiedItems: Array<{
    item: EstimateLineItem;
    oldPrice: number;
    newPrice: number;
  }>;
  amountDiff: number;
  changeReason?: string;
}

export interface EstimateHistoryDiffSectionProps {
  /** ジョブID */
  jobId: string;
  /** ワークオーダーID */
  workOrderId?: string;
  /** 現在の見積項目 */
  currentEstimateItems: EstimateLineItem[];
  /** 見積履歴 */
  estimateHistory?: EstimateVersion[];
  /** 見積履歴を保存するコールバック */
  onSaveHistory?: (version: EstimateVersion) => Promise<void>;
  /** 無効化フラグ */
  disabled?: boolean;
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 見積項目の合計金額を計算
 */
function calculateTotalAmount(items: EstimateLineItem[]): number {
  return items.reduce((sum, item) => {
    const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
    const laborTotal = item.laborCost || 0;
    return sum + partTotal + laborTotal;
  }, 0);
}

/**
 * 見積履歴の差分を計算
 */
function calculateDiff(
  fromItems: EstimateLineItem[],
  toItems: EstimateLineItem[]
): EstimateHistoryDiff {
  const addedItems: EstimateLineItem[] = [];
  const removedItems: EstimateLineItem[] = [];
  const modifiedItems: Array<{
    item: EstimateLineItem;
    oldPrice: number;
    newPrice: number;
  }> = [];

  // 追加された項目を検出
  toItems.forEach((toItem) => {
    const fromItem = fromItems.find((item) => item.id === toItem.id);
    if (!fromItem) {
      addedItems.push(toItem);
    } else {
      // 価格が変更された項目を検出
      const fromPrice = (fromItem.partQuantity || 0) * (fromItem.partUnitPrice || 0) + (fromItem.laborCost || 0);
      const toPrice = (toItem.partQuantity || 0) * (toItem.partUnitPrice || 0) + (toItem.laborCost || 0);
      if (fromPrice !== toPrice) {
        modifiedItems.push({
          item: toItem,
          oldPrice: fromPrice,
          newPrice: toPrice,
        });
      }
    }
  });

  // 削除された項目を検出
  fromItems.forEach((fromItem) => {
    const toItem = toItems.find((item) => item.id === fromItem.id);
    if (!toItem) {
      removedItems.push(fromItem);
    }
  });

  const fromTotal = calculateTotalAmount(fromItems);
  const toTotal = calculateTotalAmount(toItems);
  const amountDiff = toTotal - fromTotal;

  return {
    fromVersion: 0, // 実際のバージョン番号は呼び出し側で設定
    toVersion: 0,
    addedItems,
    removedItems,
    modifiedItems,
    amountDiff,
  };
}

/**
 * 金額をフォーマット
 */
function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

/**
 * 日時をフォーマット
 */
function formatDateTime(dateString: string): string {
  if (!dateString) return "不明";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// =============================================================================
// コンポーネント
// =============================================================================

/**
 * 見積履歴の差分表示セクション
 */
export function EstimateHistoryDiffSection({
  jobId,
  workOrderId,
  currentEstimateItems,
  estimateHistory = [],
  onSaveHistory,
  disabled = false,
}: EstimateHistoryDiffSectionProps) {
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isAddVersionDialogOpen, setIsAddVersionDialogOpen] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(new Set());

  // 見積履歴をバージョン順にソート
  const sortedHistory = useMemo(() => {
    return [...estimateHistory].sort((a, b) => a.version - b.version);
  }, [estimateHistory]);

  // 現在の見積を最新バージョンとして扱う
  const currentVersion: EstimateVersion | null = useMemo(() => {
    if (sortedHistory.length === 0) return null;
    const latest = sortedHistory[sortedHistory.length - 1];
    const currentTotal = calculateTotalAmount(currentEstimateItems);
    const latestTotal = calculateTotalAmount(latest.items);
    
    // 現在の見積が最新バージョンと異なる場合、新しいバージョンとして扱う
    if (currentTotal !== latestTotal || currentEstimateItems.length !== latest.items.length) {
      return {
        version: latest.version + 1,
        versionLabel: `v${latest.version + 1}（作業中）`,
        items: currentEstimateItems,
        totalAmount: currentTotal,
        createdAt: new Date().toISOString(),
      };
    }
    return latest;
  }, [sortedHistory, currentEstimateItems]);

  // バージョンの展開/折りたたみ
  const toggleVersion = (version: number) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  // 新しいバージョンを追加
  const handleAddVersion = async () => {
    if (!changeReason.trim()) {
      toast.error("変更理由を入力してください");
      return;
    }

    if (!onSaveHistory || !currentVersion) {
      toast.error("見積履歴の保存に失敗しました");
      return;
    }

    try {
      await onSaveHistory({
        ...currentVersion,
        changeReason: changeReason.trim(),
      });
      setChangeReason("");
      setIsAddVersionDialogOpen(false);
      toast.success("見積履歴を保存しました");
    } catch (error) {
      console.error("見積履歴保存エラー:", error);
      toast.error("見積履歴の保存に失敗しました", {
        description: error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  // 差分を計算（前のバージョンとの差分）
  const getVersionDiff = (version: number): EstimateHistoryDiff | null => {
    const versionIndex = sortedHistory.findIndex((v) => v.version === version);
    if (versionIndex === 0) return null; // 最初のバージョンは差分なし
    if (versionIndex === -1) return null;

    const fromVersion = sortedHistory[versionIndex - 1];
    const toVersion = sortedHistory[versionIndex];

    const diff = calculateDiff(fromVersion.items, toVersion.items);
    return {
      ...diff,
      fromVersion: fromVersion.version,
      toVersion: toVersion.version,
      changeReason: toVersion.changeReason,
    };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <History className="h-5 w-5 shrink-0" />
              見積履歴
            </CardTitle>
            {onSaveHistory && currentVersion && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddVersionDialogOpen(true)}
                disabled={disabled}
                className="h-10 text-base"
              >
                <Plus className="h-4 w-4 mr-1" />
                履歴を保存
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedHistory.length === 0 ? (
            <div className="text-center py-4 text-slate-700 text-base">
              見積履歴がありません
            </div>
          ) : (
            <div className="space-y-4">
              {sortedHistory.map((version, index) => {
                const diff = index > 0 ? getVersionDiff(version.version) : null;
                const isExpanded = expandedVersions.has(version.version);

                return (
                  <div key={version.version} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-base font-medium px-3 py-1">
                          {version.versionLabel}
                        </Badge>
                        <span className="text-base text-slate-700">
                          {formatDateTime(version.createdAt)}
                        </span>
                        <span className="text-base font-medium text-slate-900">
                          {formatPrice(version.totalAmount)}
                        </span>
                      </div>
                      {diff && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVersion(version.version)}
                          className="h-8 text-base"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              差分を閉じる
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              差分を表示
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {diff && isExpanded && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="space-y-3">
                          {/* 金額差分 */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-300">
                            <span className="text-base font-medium text-slate-900">金額差分</span>
                            <span
                              className={cn(
                                "text-lg font-bold",
                                diff.amountDiff > 0
                                  ? "text-red-600"
                                  : diff.amountDiff < 0
                                  ? "text-blue-600"
                                  : "text-slate-700"
                              )}
                            >
                              {diff.amountDiff > 0 ? "+" : ""}
                              {formatPrice(diff.amountDiff)}
                            </span>
                          </div>

                          {/* 追加された項目 */}
                          {diff.addedItems.length > 0 && (
                            <div>
                              <div className="text-base font-medium text-slate-900 mb-2 flex items-center gap-2">
                                <ArrowUp className="h-4 w-4 text-green-600" />
                                追加された項目
                              </div>
                              <div className="space-y-1">
                                {diff.addedItems.map((item) => {
                                  const itemTotal =
                                    (item.partQuantity || 0) * (item.partUnitPrice || 0) +
                                    (item.laborCost || 0);
                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between text-base py-1 px-2 bg-green-50 rounded"
                                    >
                                      <span className="text-green-800">{item.name}</span>
                                      <span className="font-medium text-green-800">
                                        +{formatPrice(itemTotal)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 削除された項目 */}
                          {diff.removedItems.length > 0 && (
                            <div>
                              <div className="text-base font-medium text-slate-900 mb-2 flex items-center gap-2">
                                <ArrowDown className="h-4 w-4 text-red-600" />
                                削除された項目
                              </div>
                              <div className="space-y-1">
                                {diff.removedItems.map((item) => {
                                  const itemTotal =
                                    (item.partQuantity || 0) * (item.partUnitPrice || 0) +
                                    (item.laborCost || 0);
                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between text-base py-1 px-2 bg-red-50 rounded"
                                    >
                                      <span className="text-red-800">{item.name}</span>
                                      <span className="font-medium text-red-800">
                                        -{formatPrice(itemTotal)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 変更された項目 */}
                          {diff.modifiedItems.length > 0 && (
                            <div>
                              <div className="text-base font-medium text-slate-900 mb-2 flex items-center gap-2">
                                <Minus className="h-4 w-4 text-amber-600" />
                                変更された項目
                              </div>
                              <div className="space-y-1">
                                {diff.modifiedItems.map((modified) => (
                                  <div
                                    key={modified.item.id}
                                    className="flex items-center justify-between text-base py-1 px-2 bg-amber-50 rounded"
                                  >
                                    <span className="text-amber-800">{modified.item.name}</span>
                                    <span className="font-medium text-amber-800">
                                      {formatPrice(modified.oldPrice)} → {formatPrice(modified.newPrice)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 変更理由 */}
                          {diff.changeReason && (
                            <div className="pt-2 border-t border-slate-300">
                              <div className="text-base font-medium text-slate-900 mb-1">
                                変更理由
                              </div>
                              <div className="text-base text-slate-700">{diff.changeReason}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 見積履歴保存ダイアログ */}
      <Dialog open={isAddVersionDialogOpen} onOpenChange={setIsAddVersionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>見積履歴を保存</DialogTitle>
            <DialogDescription>
              現在の見積を履歴として保存します。変更理由を入力してください。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">変更理由（必須）</Label>
              <Textarea
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="例: 受入れ点検で発見、作業中に発見など"
                rows={4}
                disabled={disabled}
                className="mt-2 text-base"
              />
            </div>

            {currentVersion && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-base text-slate-700">
                  <div className="font-medium mb-1">保存する見積情報</div>
                  <div>バージョン: {currentVersion.versionLabel}</div>
                  <div>項目数: {currentVersion.items.length}件</div>
                  <div>合計金額: {formatPrice(currentVersion.totalAmount)}</div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddVersionDialogOpen(false);
                setChangeReason("");
              }}
              disabled={disabled}
            >
              キャンセル
            </Button>
            <Button onClick={handleAddVersion} disabled={disabled || !changeReason.trim()}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

