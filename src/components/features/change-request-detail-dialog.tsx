"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, AlertCircle, Loader2, Bell } from "lucide-react";
import { ZohoCustomer } from "@/types";
import { fetchCustomerById } from "@/lib/api";
import { hasChangeRequests } from "@/lib/customer-description-append";
import useSWR from "swr";

interface ChangeRequestDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | undefined;
  customerName?: string;
  onMarkCompleted?: () => void;
  isMarkingCompleted?: boolean;
}

/**
 * 変更申請詳細ダイアログ
 * 顧客情報の変更申請の詳細を表示
 */
export function ChangeRequestDetailDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  onMarkCompleted,
  isMarkingCompleted = false,
}: ChangeRequestDetailDialogProps) {
  // モーダルが開いている時のみ顧客情報を取得
  const { data: customerResponse, isLoading, mutate } = useSWR(
    customerId && open ? `customer-${customerId}` : null,
    async () => {
      if (!customerId) return null;
      const result = await fetchCustomerById(customerId);
      return result.success ? result.data : null;
    },
    {
      revalidateOnFocus: false,
    }
  );

  const customer = customerResponse || null;

  // 変更申請の内容を抽出
  const changeRequests = useMemo(() => {
    if (!customer?.Description) return [];
    return customer.Description
      .split("\n")
      .filter((line) => line.trim().startsWith("【アプリ変更届】"))
      .map((line) => line.trim());
  }, [customer?.Description]);

  const hasRequests = useMemo(() => hasChangeRequests(customer?.Description || ""), [customer?.Description]);

  // 対応完了処理（成功時にモーダルを閉じる）
  const handleMarkCompleted = async () => {
    if (!onMarkCompleted) return;
    
    try {
      await onMarkCompleted();
      // データを再取得
      if (customerId) {
        await mutate();
      }
      // 成功時はモーダルを閉じる（onMarkCompleted内でエラーが発生しなかった場合）
      // エラー時はモーダルを開いたままにする
    } catch (error) {
      // エラーはonMarkCompleted内で処理されるため、ここでは何もしない
      console.error("対応完了処理エラー:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-rose-700">
            <Bell className="h-5 w-5 shrink-0" />
            顧客情報の変更申請
          </DialogTitle>
          <DialogDescription className="text-base text-slate-600">
            {customerName ? `${customerName}様からの変更申請` : "顧客情報の変更申請"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : hasRequests && changeRequests.length > 0 ? (
          <>
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-3">
                <Alert className="bg-rose-50 border-rose-200">
                  <AlertCircle className="h-4 w-4 text-rose-700" />
                  <AlertDescription className="text-rose-700 text-base">
                    以下の顧客情報の変更申請があります。内容を確認し、対応完了後、基幹システムを更新してください。
                  </AlertDescription>
                </Alert>

                <Card className="border-rose-200 bg-rose-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-rose-700">
                      <FileText className="h-4 w-4 shrink-0" />
                      変更申請内容
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {changeRequests.map((request, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white border border-rose-200 rounded-md text-base"
                        >
                          <p className="text-rose-700 font-mono text-base whitespace-pre-wrap break-words">
                            {request}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isMarkingCompleted}
                className="h-12 text-base font-medium"
              >
                閉じる
              </Button>
              {onMarkCompleted && (
                <Button
                  onClick={handleMarkCompleted}
                  disabled={isMarkingCompleted}
                  className="h-12 text-base font-medium bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isMarkingCompleted ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" />
                      処理中...
                    </>
                  ) : (
                    "対応完了としてマーク"
                  )}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 py-12">
            <FileText className="h-12 w-12 mb-4 text-slate-300" />
            <p className="text-lg font-medium">変更申請はありません</p>
            <p className="text-base mt-1">現在、顧客からの変更申請は検出されませんでした。</p>
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-6 h-12 text-base font-medium"
            >
              閉じる
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

