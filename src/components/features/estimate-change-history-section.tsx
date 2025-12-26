/**
 * 見積変更履歴セクション
 * 改善提案 #10: 見積変更依頼の履歴管理機能
 *
 * 機能:
 * - 見積変更依頼の記録
 * - 見積変更履歴の表示
 * - 見積変更依頼の承認・却下
 */

"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, User, FileText, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  EstimateChangeRequest,
  EstimateItem,
} from "@/types";
import {
  getEstimateChangeRequests,
  saveEstimateChangeRequest,
  generateChangeRequestId,
  getCurrentUser,
} from "@/lib/estimate-change-storage";
import { cn } from "@/lib/utils";

export interface EstimateChangeHistorySectionProps {
  /** ジョブID */
  jobId: string;
  /** 顧客名 */
  customerName: string;
  /** 現在の見積項目 */
  currentEstimateItems: EstimateItem[];
  /** 無効化フラグ */
  disabled?: boolean;
  /** 見積変更時のコールバック */
  onEstimateChange?: (newEstimateItems: EstimateItem[]) => void;
}

/**
 * 依頼タイプのラベルを取得
 */
function getRequestTypeLabel(
  type: EstimateChangeRequest["requestType"]
): string {
  switch (type) {
    case "add":
      return "項目追加";
    case "remove":
      return "項目削除";
    case "modify":
      return "項目変更";
    case "price_change":
      return "価格変更";
    default:
      return "その他";
  }
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
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * 見積変更履歴セクション
 */
export function EstimateChangeHistorySection({
  jobId,
  customerName,
  currentEstimateItems,
  disabled = false,
  onEstimateChange,
}: EstimateChangeHistorySectionProps) {
  const [changeRequests, setChangeRequests] = useState<EstimateChangeRequest[]>([]);
  const [isChangeRequestDialogOpen, setIsChangeRequestDialogOpen] = useState(false);
  const [isChangeRequestDetailOpen, setIsChangeRequestDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EstimateChangeRequest | null>(null);
  const [requestType, setRequestType] = useState<EstimateChangeRequest["requestType"]>("add");
  const [requestContent, setRequestContent] = useState("");

  // 変更依頼を読み込み
  useEffect(() => {
    setChangeRequests(getEstimateChangeRequests(jobId));
  }, [jobId]);

  // 変更依頼を記録
  const handleSaveChangeRequest = () => {
    if (!requestContent.trim()) {
      toast.error("依頼内容を入力してください");
      return;
    }

    // 依頼タイプに応じて、依頼された見積項目を推測
    // 簡易実装: 依頼内容から項目名を抽出し、現在の見積項目と照合
    let requestedEstimate: EstimateItem[] = [];
    
    if (requestType === "remove") {
      // 削除の場合: 依頼内容に記載された項目名に一致する項目を削除
      const requestLower = requestContent.toLowerCase();
      requestedEstimate = currentEstimateItems
        .filter((item) => !requestLower.includes(item.name.toLowerCase()))
        .map((item) => ({ ...item }));
    } else if (requestType === "add") {
      // 追加の場合: 現在の見積項目に加えて、依頼内容から推測される項目を追加
      requestedEstimate = currentEstimateItems.map((item) => ({ ...item }));
      
      // 依頼内容から項目名と金額を抽出（簡易実装）
      // パターン1: 「項目名 ¥金額」形式
      const pricePattern = /([^¥\n]+?)\s*¥?\s*([\d,]+)/g;
      let match;
      while ((match = pricePattern.exec(requestContent)) !== null) {
        const itemName = match[1].trim();
        const priceStr = match[2].replace(/,/g, "");
        const price = parseInt(priceStr) || 0;
        
        if (itemName && price > 0) {
          // 既存の項目と重複していないか確認
          const exists = requestedEstimate.some((item) => item.name === itemName);
          if (!exists) {
            requestedEstimate.push({
              id: `new-${Date.now()}-${requestedEstimate.length}`,
              name: itemName,
              price,
              priority: "optional" as const,
              selected: false,
              linkedPhotoUrls: [],
              linkedVideoUrl: null,
              note: null,
            });
          }
        }
      }
      
      // パターン2: 改行区切りで項目名のみ（金額は0として追加）
      if (requestedEstimate.length === currentEstimateItems.length) {
        const lines = requestContent.split("\n").filter((line) => line.trim());
        lines.forEach((line) => {
          const trimmed = line.trim();
          // 既存の項目名と一致するか確認
          const exists = currentEstimateItems.some((item) => item.name === trimmed);
          if (!exists && trimmed.length > 0) {
            requestedEstimate.push({
              id: `new-${Date.now()}-${requestedEstimate.length}`,
              name: trimmed,
              price: 0, // 金額は後で設定
              priority: "optional" as const,
              selected: false,
              linkedPhotoUrls: [],
              linkedVideoUrl: null,
              note: null,
            });
          }
        });
      }
    } else if (requestType === "modify") {
      // 変更の場合: 依頼内容から変更内容を抽出して反映
      requestedEstimate = currentEstimateItems.map((item) => {
        // 依頼内容に項目名が含まれている場合、その項目を変更対象とする
        const requestLower = requestContent.toLowerCase();
        if (requestLower.includes(item.name.toLowerCase())) {
          // 変更後の項目名を抽出（「項目名 → 新しい項目名」形式）
          const modifyPattern = new RegExp(`${item.name}\\s*[→→]\\s*([^\\n]+)`, "i");
          const modifyMatch = requestContent.match(modifyPattern);
          if (modifyMatch && modifyMatch[1]) {
            return {
              ...item,
              name: modifyMatch[1].trim(),
            };
          }
        }
        return { ...item };
      });
    } else if (requestType === "price_change") {
      // 価格変更の場合: 依頼内容から変更する項目と新しい価格を抽出して反映
      requestedEstimate = currentEstimateItems.map((item) => {
        // 依頼内容に項目名が含まれている場合、その項目の価格を変更対象とする
        const requestLower = requestContent.toLowerCase();
        if (requestLower.includes(item.name.toLowerCase())) {
          // 価格を抽出（「項目名 ¥金額」または「項目名 金額円」形式）
          const pricePattern = new RegExp(`${item.name}[^\\d]*¥?\\s*([\\d,]+)`, "i");
          const priceMatch = requestContent.match(pricePattern);
          if (priceMatch && priceMatch[1]) {
            const priceStr = priceMatch[1].replace(/,/g, "");
            const newPrice = parseInt(priceStr) || item.price;
            return {
              ...item,
              price: newPrice,
            };
          }
        }
        return { ...item };
      });
    } else {
      // その他の場合: 現在の見積項目をそのまま保持
      requestedEstimate = currentEstimateItems.map((item) => ({ ...item }));
    }

    const request: EstimateChangeRequest = {
      id: generateChangeRequestId(),
      jobId,
      requestDate: new Date().toISOString(),
      requestedBy: customerName,
      requestType: requestType,
      requestContent: requestContent.trim(),
      originalEstimate: currentEstimateItems.map((item) => ({ ...item })),
      requestedEstimate: requestedEstimate,
      status: "pending",
      responseDate: null,
      responseContent: null,
      handledBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveEstimateChangeRequest(request);
    setChangeRequests(getEstimateChangeRequests(jobId));
    setIsChangeRequestDialogOpen(false);
    setRequestContent("");
    setRequestType("add");
    toast.success("見積変更依頼を記録しました");
  };

  // 変更依頼を承認
  const handleApproveChangeRequest = (request: EstimateChangeRequest) => {
    const updated: EstimateChangeRequest = {
      ...request,
      status: "approved",
      responseDate: new Date().toISOString(),
      responseContent: "承認しました",
      handledBy: getCurrentUser(),
      updatedAt: new Date().toISOString(),
    };

    saveEstimateChangeRequest(updated);
    setChangeRequests(getEstimateChangeRequests(jobId));
    
    // 見積データを更新（承認された見積項目を反映）
    if (onEstimateChange && request.requestedEstimate) {
      onEstimateChange(request.requestedEstimate);
    }
    
    toast.success("見積変更依頼を承認しました");
  };

  // 変更依頼を却下
  const handleRejectChangeRequest = (request: EstimateChangeRequest) => {
    const updated: EstimateChangeRequest = {
      ...request,
      status: "rejected",
      responseDate: new Date().toISOString(),
      responseContent: "却下しました",
      handledBy: getCurrentUser(),
      updatedAt: new Date().toISOString(),
    };

    saveEstimateChangeRequest(updated);
    setChangeRequests(getEstimateChangeRequests(jobId));
    toast.success("見積変更依頼を却下しました");
  };

  // 変更依頼の詳細を表示
  const handleViewChangeRequestDetails = (request: EstimateChangeRequest) => {
    setSelectedRequest(request);
    setIsChangeRequestDetailOpen(true);
  };

  // 見積項目の差分を計算
  const getEstimateDiff = (
    original: EstimateItem[],
    requested: EstimateItem[]
  ): Array<{
    type: "added" | "removed" | "modified";
    item: EstimateItem;
    oldPrice?: number;
    newPrice?: number;
  }> => {
    const diff: Array<{
      type: "added" | "removed" | "modified";
      item: EstimateItem;
      oldPrice?: number;
      newPrice?: number;
    }> = [];

    // 追加された項目
    requested.forEach((reqItem) => {
      const originalItem = original.find((orig) => orig.id === reqItem.id);
      if (!originalItem) {
        diff.push({ type: "added", item: reqItem });
      } else if (originalItem.price !== reqItem.price) {
        diff.push({
          type: "modified",
          item: reqItem,
          oldPrice: originalItem.price,
          newPrice: reqItem.price,
        });
      }
    });

    // 削除された項目
    original.forEach((origItem) => {
      const requestedItem = requested.find((req) => req.id === origItem.id);
      if (!requestedItem) {
        diff.push({ type: "removed", item: origItem });
      }
    });

    return diff;
  };

  // 価格をフォーマット
  const formatPrice = (price: number): string => {
    return `¥${price.toLocaleString()}`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            見積変更履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 見積変更依頼の追加 */}
            <Button
              variant="outline"
              onClick={() => setIsChangeRequestDialogOpen(true)}
              className="w-full"
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              見積変更依頼を記録
            </Button>

            {/* 見積変更履歴リスト */}
            {changeRequests.length === 0 ? (
              <div className="text-center py-4 text-slate-700 text-base">
                見積変更履歴がありません
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {changeRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(request.requestDate)} - {request.requestedBy}様
                              </div>
                              <div className="text-base text-slate-700 mt-1">
                                {getRequestTypeLabel(request.requestType)}
                              </div>
                            </div>
                            <Badge
                              variant={
                                request.status === "approved"
                                  ? "default"
                                  : request.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {request.status === "pending"
                                ? "対応待ち"
                                : request.status === "approved"
                                ? "承認済み"
                                : "却下"}
                            </Badge>
                          </div>

                          <div className="text-base">
                            <div className="font-medium">依頼内容:</div>
                            <div className="text-slate-700 mt-1">
                              {request.requestContent}
                            </div>
                          </div>

                          {request.responseContent && (
                            <div className="text-base">
                              <div className="font-medium">対応内容:</div>
                              <div className="text-slate-700 mt-1">
                                {request.responseContent}
                              </div>
                              {request.handledBy && (
                                <div className="text-base text-slate-700 mt-1">
                                  対応者: {request.handledBy}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => handleViewChangeRequestDetails(request)}
                              disabled={disabled}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              詳細を表示
                            </Button>
                            {request.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() => handleApproveChangeRequest(request)}
                                  disabled={disabled}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  承認
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleRejectChangeRequest(request)}
                                  disabled={disabled}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  却下
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 見積変更依頼記録ダイアログ */}
      <Dialog open={isChangeRequestDialogOpen} onOpenChange={setIsChangeRequestDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>見積変更依頼を記録</DialogTitle>
            <DialogDescription>
              お客様からの見積変更依頼を記録します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>依頼タイプ</Label>
              <Select
                value={requestType}
                onValueChange={(value) =>
                  setRequestType(value as EstimateChangeRequest["requestType"])
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">項目追加</SelectItem>
                  <SelectItem value="remove">項目削除</SelectItem>
                  <SelectItem value="modify">項目変更</SelectItem>
                  <SelectItem value="price_change">価格変更</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>依頼内容</Label>
              <Textarea
                value={requestContent}
                onChange={(e) => setRequestContent(e.target.value)}
                placeholder="見積変更依頼の内容を入力"
                rows={4}
                disabled={disabled}
              />
            </div>

            <div className="text-base text-slate-700">
              現在の見積項目数: {currentEstimateItems.length}項目
            </div>

            {/* 依頼タイプに応じた説明 */}
            {requestType === "add" && (
              <div className="p-3 bg-blue-50 border border-blue-400 rounded text-base text-blue-900">
                項目追加の場合、依頼内容に追加したい項目名と金額を記載してください。
              </div>
            )}
            {requestType === "remove" && (
              <div className="p-3 bg-amber-50 border border-amber-400 rounded text-base text-amber-900">
                項目削除の場合、依頼内容に削除したい項目名を記載してください。
              </div>
            )}
            {requestType === "modify" && (
              <div className="p-3 bg-purple-50 border border-purple-400 rounded text-base text-purple-900">
                項目変更の場合、依頼内容に変更したい項目名と変更内容を記載してください。
              </div>
            )}
            {requestType === "price_change" && (
              <div className="p-3 bg-green-50 border border-green-400 rounded text-base text-green-900">
                価格変更の場合、依頼内容に変更したい項目名と新しい金額を記載してください。
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsChangeRequestDialogOpen(false);
                setRequestContent("");
                setRequestType("add");
              }}
              disabled={disabled}
            >
              キャンセル
            </Button>
            <Button onClick={handleSaveChangeRequest} disabled={disabled}>
              記録
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 見積変更履歴詳細表示ダイアログ */}
      {selectedRequest && (
        <Dialog open={isChangeRequestDetailOpen} onOpenChange={setIsChangeRequestDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {formatDate(selectedRequest.requestDate)} - {selectedRequest.requestedBy}様
              </DialogTitle>
              <DialogDescription>
                {getRequestTypeLabel(selectedRequest.requestType)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* 基本情報 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">ステータス</Label>
                  <Badge
                    variant={
                      selectedRequest.status === "approved"
                        ? "default"
                        : selectedRequest.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {selectedRequest.status === "pending"
                      ? "対応待ち"
                      : selectedRequest.status === "approved"
                      ? "承認済み"
                      : "却下"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-base font-medium">依頼内容</Label>
                  <p className="text-base text-slate-800 mt-1">{selectedRequest.requestContent}</p>
                </div>
                {selectedRequest.responseContent && (
                  <div>
                    <Label className="text-base font-medium">対応内容</Label>
                    <p className="text-base text-slate-800 mt-1">{selectedRequest.responseContent}</p>
                    {selectedRequest.handledBy && (
                      <p className="text-base text-slate-700 mt-1">対応者: {selectedRequest.handledBy}</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* 変更前後の比較 */}
              {(selectedRequest.originalEstimate.length > 0 || selectedRequest.requestedEstimate.length > 0) && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base font-medium mb-2 block">変更前</Label>
                      <div className="p-3 bg-slate-50 border rounded space-y-2 max-h-64 overflow-y-auto">
                        {selectedRequest.originalEstimate.length === 0 ? (
                          <p className="text-base text-slate-700">見積項目なし</p>
                        ) : (
                          selectedRequest.originalEstimate.map((item, index) => (
                            <div
                              key={item.id || index}
                              className="flex items-center justify-between text-base py-1"
                            >
                              <span className="truncate flex-1">{item.name}</span>
                              <span className="ml-2 font-medium shrink-0">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-base text-slate-700 mt-1">
                        合計: {formatPrice(
                          selectedRequest.originalEstimate.reduce((sum, item) => sum + item.price, 0)
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-base font-medium mb-2 block">変更後（依頼内容）</Label>
                      <div className="p-3 bg-blue-50 border border-blue-300 rounded space-y-2 max-h-64 overflow-y-auto">
                        {selectedRequest.requestedEstimate.length === 0 ? (
                          <p className="text-base text-slate-700">見積項目なし</p>
                        ) : (
                          selectedRequest.requestedEstimate.map((item, index) => (
                            <div
                              key={item.id || index}
                              className="flex items-center justify-between text-base py-1"
                            >
                              <span className="truncate flex-1">{item.name}</span>
                              <span className="ml-2 font-medium shrink-0">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-base text-slate-700 mt-1">
                        合計: {formatPrice(
                          selectedRequest.requestedEstimate.reduce((sum, item) => sum + item.price, 0)
                        )}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* 変更の差分表示 */}
                  <div>
                    <Label className="text-base font-medium mb-2 block">変更の差分</Label>
                    <div className="p-3 bg-slate-50 border rounded space-y-1 max-h-64 overflow-y-auto">
                      {(() => {
                        const diff = getEstimateDiff(
                          selectedRequest.originalEstimate,
                          selectedRequest.requestedEstimate
                        );
                        if (diff.length === 0) {
                          return <p className="text-base text-slate-700">変更なし</p>;
                        }
                        return diff.map((d, index) => (
                          <div key={index} className="text-base py-1">
                            {d.type === "added" && (
                              <div className="text-green-700 font-medium">
                                + {d.item.name} ({formatPrice(d.item.price)})
                              </div>
                            )}
                            {d.type === "removed" && (
                              <div className="text-red-700 font-medium">
                                - {d.item.name} ({formatPrice(d.item.price)})
                              </div>
                            )}
                            {d.type === "modified" && d.oldPrice !== undefined && d.newPrice !== undefined && (
                              <div className="text-slate-700">
                                {d.item.name}: {formatPrice(d.oldPrice)} → {formatPrice(d.newPrice)}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangeRequestDetailOpen(false)}>
                閉じる
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}




