/**
 * 過去の見積参照ダイアログ
 * 改善提案 #6: 過去の見積・案件の参照機能
 *
 * 機能:
 * - 過去の見積を検索・表示
 * - 過去の見積詳細を表示
 * - 過去の見積から項目をコピー
 */

"use client";

import { useState, useMemo } from "react";
import { History, Copy, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { HistoricalEstimate, EstimateItem } from "@/types";
import { fetchHistoricalEstimatesByCustomerId } from "@/lib/api";
import useSWR from "swr";

export interface HistoricalEstimateDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態の変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** 顧客ID */
  customerId: string | null;
  /** 見積項目をコピーするコールバック */
  onCopyItems: (items: EstimateItem[]) => void;
}

/**
 * 日付をフォーマット
 */
function formatDate(dateString: string): string {
  if (!dateString) return "不明";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * 過去の見積参照ダイアログ
 */
export function HistoricalEstimateDialog({
  open,
  onOpenChange,
  customerId,
  onCopyItems,
}: HistoricalEstimateDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<
    "all" | "last_month" | "last_3_months" | "last_6_months" | "last_year"
  >("all");
  const [selectedEstimate, setSelectedEstimate] =
    useState<HistoricalEstimate | null>(null);

  // 過去の見積を取得
  const { data: estimatesData, isLoading } = useSWR(
    customerId && open
      ? `historical-estimates-${customerId}-${dateRange}-${searchQuery}`
      : null,
    () =>
      fetchHistoricalEstimatesByCustomerId(customerId!, {
        dateRange,
        searchQuery: searchQuery || undefined,
      }),
    {
      revalidateOnFocus: false,
    }
  );

  const estimates = estimatesData?.data || [];

  // 見積項目をコピー
  const handleCopyItems = (estimate: HistoricalEstimate) => {
    const itemsToCopy: EstimateItem[] = estimate.items.map((item) => ({
      ...item,
      id: `est-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 新しいIDを生成
      selected: false, // コピー時は未選択状態
    }));

    onCopyItems(itemsToCopy);
    toast.success("見積項目をコピーしました", {
      description: `${itemsToCopy.length}項目`,
    });
    onOpenChange(false);
  };

  // すべての項目をコピー
  const handleCopyAllItems = (estimate: HistoricalEstimate) => {
    handleCopyItems(estimate);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              過去の見積を参照
            </DialogTitle>
            <DialogDescription>
              同じお客様の過去の見積を参照し、項目をコピーできます
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 検索・フィルター */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-700" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="お客様名、車両情報で検索"
                  className="pl-10"
                />
              </div>
              <Select 
                value={dateRange} 
                onValueChange={(value) => {
                  if (value === "all" || value === "last_month" || value === "last_3_months" || value === "last_6_months" || value === "last_year") {
                    setDateRange(value);
                  }
                }}
              >
                <SelectTrigger className="w-48 h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="last_month">過去1ヶ月</SelectItem>
                  <SelectItem value="last_3_months">過去3ヶ月</SelectItem>
                  <SelectItem value="last_6_months">過去6ヶ月</SelectItem>
                  <SelectItem value="last_year">過去1年</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 過去の見積リスト */}
            {isLoading ? (
              <div className="text-center py-8 text-slate-700">
                読み込み中...
              </div>
            ) : estimates.length === 0 ? (
              <div className="text-center py-8 text-slate-700">
                過去の見積が見つかりませんでした
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {estimates.map((estimate) => (
                    <Card
                      key={estimate.id}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => setSelectedEstimate(estimate)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {estimate.customerName}様
                            </div>
                            <div className="text-base text-slate-700">
                              {estimate.vehicleName}
                            </div>
                            <div className="text-base text-slate-700 mt-1 flex items-center gap-1">
                              <Calendar className="h-4 w-4" /> {/* h-3 w-3 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠) */}
                              {formatDate(estimate.createdAt)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              ¥{estimate.totalAmount.toLocaleString()}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {estimate.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 見積詳細表示ダイアログ */}
      {selectedEstimate && (
        <Dialog
          open={!!selectedEstimate}
          onOpenChange={(open) => !open && setSelectedEstimate(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedEstimate.customerName}様 - {selectedEstimate.vehicleName}
              </DialogTitle>
              <DialogDescription>
                {formatDate(selectedEstimate.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4">
                {/* 見積項目 */}
                <div>
                  <Label>見積項目</Label>
                  <div className="space-y-2 mt-2">
                    {selectedEstimate.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          {item.note && (
                            <div className="text-base text-slate-700 mt-1">
                              {item.note}
                            </div>
                          )}
                        </div>
                        <div className="text-right mr-4">
                          <div className="font-bold">
                            ¥{item.price.toLocaleString()}
                          </div>
                          <div className="text-base text-slate-700">
                            数量: 1
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyItems({
                              ...selectedEstimate,
                              items: [item],
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 合計金額 */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded">
                  <span className="font-medium">合計金額</span>
                  <span className="text-2xl font-bold">
                    ¥{selectedEstimate.totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* コピーボタン */}
                <Button
                  onClick={() => handleCopyAllItems(selectedEstimate)}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  すべての項目をコピー
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}




