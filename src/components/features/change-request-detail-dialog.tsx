"use client";

import { useMemo, useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, AlertCircle, Loader2, Bell, ExternalLink, CheckCircle2 } from "lucide-react";
import useSWR, { mutate } from "swr";
import { fetchPendingChangeRequests, markChangeRequestsCompleted, ChangeRequestLogEntry } from "@/lib/change-request-api";
import { toast } from "sonner";

interface ChangeRequestDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | undefined;
  customerName?: string;
  /** スマートカーディーラーの顧客ID（スプレッドシート検索用） */
  smartCarDealerCustomerId?: string;
}

/**
 * 変更申請詳細ダイアログ
 * スプレッドシートから未対応の変更申請を取得して表示
 */
export function ChangeRequestDetailDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  smartCarDealerCustomerId,
}: ChangeRequestDetailDialogProps) {
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);

  // スプレッドシートから未対応の変更申請を取得
  const { data: changeRequestsResponse, isLoading, mutate: mutateRequests } = useSWR(
    open && smartCarDealerCustomerId ? `change-requests-${smartCarDealerCustomerId}` : null,
    async () => {
      if (!smartCarDealerCustomerId) return null;
      const result = await fetchPendingChangeRequests(smartCarDealerCustomerId);
      return result.success ? result.data : null;
    },
    {
      revalidateOnFocus: false,
    }
  );

  const changeRequests = changeRequestsResponse || [];
  const hasRequests = changeRequests.length > 0;

  // スプレッドシートのURLを生成
  const spreadsheetUrl = useMemo(() => {
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_MASTER_DATA_ID || "";
    if (!spreadsheetId) return "";
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }, []);

  // 対応完了処理
  const handleMarkCompleted = async () => {
    if (changeRequests.length === 0) return;

    setIsMarkingCompleted(true);

    try {
      const requestIds = changeRequests.map((r) => r.申請ID);
      const result = await markChangeRequestsCompleted(requestIds);

      if (result.success) {
        toast.success("変更申請を対応完了にしました", {
          description: "スプレッドシートのステータスが「対応済み」に更新されました",
        });
        // 変更申請データをクリア（ラベルを消すため）
        await mutateRequests([], false);
        // 他のキャッシュも更新
        if (smartCarDealerCustomerId) {
          await mutate(`change-requests-${smartCarDealerCustomerId}`, [], false);
          await mutate(`change-requests-check-${smartCarDealerCustomerId}`, [], false);
        }
        // ダイアログを閉じる
        onOpenChange(false);
      } else {
        toast.error("対応完了処理に失敗しました", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("対応完了エラー:", error);
      toast.error("対応完了処理に失敗しました");
    } finally {
      setIsMarkingCompleted(false);
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
            {smartCarDealerCustomerId && (
              <span className="ml-2 text-slate-500">（顧客ID: {smartCarDealerCustomerId}）</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : hasRequests ? (
          <>
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-4">
                <Alert className="bg-rose-50 border-rose-200">
                  <AlertCircle className="h-4 w-4 text-rose-700" />
                  <AlertDescription className="text-rose-700 text-base">
                    以下の変更申請があります。スマートカーディーラーで更新後、「対応完了」ボタンを押してください。
                  </AlertDescription>
                </Alert>

                <Card className="border-rose-200 bg-rose-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-rose-700">
                      <FileText className="h-4 w-4 shrink-0" />
                      変更申請サマリー（{changeRequests.length}件）
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* カード形式で表示（見切れ防止） */}
                    {changeRequests.map((request, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white border border-rose-200 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-rose-800 text-base">
                            {request.変更項目}
                          </span>
                          <span className="text-sm text-slate-500">
                            {request.対象マスタ}
                            {request.車両ID && ` (${request.車両ID})`}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          <div className="text-sm">
                            <span className="text-slate-500">変更前: </span>
                            <span className="text-slate-700">{request.変更前 || "（未設定）"}</span>
                          </div>
                          <div className="text-base">
                            <span className="text-slate-500">変更後: </span>
                            <span className="text-slate-900 font-semibold">{request.変更後}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <p className="text-sm text-slate-500 pt-2">
                      申請日時: {changeRequests[0]?.申請日時 || "不明"}
                    </p>
                  </CardContent>
                </Card>

                {/* スプレッドシートリンク */}
                {spreadsheetUrl && (
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base font-medium border-slate-300 text-slate-700 hover:bg-slate-100"
                    onClick={() => window.open(spreadsheetUrl, "_blank")}
                  >
                    <FileText className="h-5 w-5 mr-2 shrink-0" />
                    変更申請ログ（スプレッドシート）を開く
                    <ExternalLink className="h-4 w-4 ml-2 shrink-0" />
                  </Button>
                )}
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
              <Button
                onClick={handleMarkCompleted}
                disabled={isMarkingCompleted}
                className="h-12 text-base font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isMarkingCompleted ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" />
                    処理中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2 shrink-0" />
                    対応完了としてマーク
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-600 py-12">
            <CheckCircle2 className="h-12 w-12 mb-4 text-emerald-400" />
            <p className="text-lg font-medium">未対応の変更申請はありません</p>
            <p className="text-base mt-1">現在、顧客からの未対応の変更申請はありません。</p>
            
            {spreadsheetUrl && (
              <Button
                variant="outline"
                className="mt-4 h-12 text-base font-medium"
                onClick={() => window.open(spreadsheetUrl, "_blank")}
              >
                <FileText className="h-5 w-5 mr-2 shrink-0" />
                変更申請ログを確認
                <ExternalLink className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            )}
            
            <Button
              onClick={() => onOpenChange(false)}
              className="mt-4 h-12 text-base font-medium"
            >
              閉じる
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
