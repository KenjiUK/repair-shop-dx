"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { ZohoCustomer } from "@/types";
import { fetchCustomerById } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { hasChangeRequests, removeChangeRequestsFromDescription } from "@/lib/customer-description-append";
import { markChangeRequestCompleted } from "@/lib/customer-update";

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  customerName?: string;
}

/**
 * 顧客詳細ダイアログ
 * 顧客の連絡先情報を表示
 */
export function CustomerDetailDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
}: CustomerDetailDialogProps) {
  // 顧客情報を取得
  const { data: customerResponse, error, isLoading } = useSWR(
    customerId && open ? `customer-${customerId}` : null,
    async () => {
      if (!customerId) return null;
      return await fetchCustomerById(customerId);
    }
  );

  const customer = customerResponse?.data || null;

  // 変更申請があるかチェック
  const hasChangeRequest = customer ? hasChangeRequests(customer.Description) : false;

  // 変更対応完了処理中フラグ
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);

  // SWRのmutate関数を取得（データ再取得用）
  const { mutate: mutateCustomer } = useSWR(
    customerId && open ? `customer-${customerId}` : null,
    async () => {
      if (!customerId) return null;
      return await fetchCustomerById(customerId);
    }
  );

  // 変更対応完了処理
  const handleMarkChangeRequestCompleted = async () => {
    if (!customerId || !customer) return;

    setIsMarkingCompleted(true);
    try {
      const result = await markChangeRequestCompleted(customerId);
      if (result.success) {
        toast.success("変更申請を対応完了としてマークしました", {
          description: "基幹システムを更新してください",
        });
        // データを再取得
        mutateCustomer();
      } else {
        toast.error("対応完了処理に失敗しました", {
          description: result.error?.message,
        });
      }
    } catch (error) {
      console.error("変更対応完了エラー:", error);
      toast.error("対応完了処理に失敗しました");
    } finally {
      setIsMarkingCompleted(false);
    }
  };

  // 住所を整形
  const formatAddress = () => {
    if (!customer) return "未登録";
    const parts = [
      customer.Mailing_Street || customer.mailingStreet,
      customer.field4 || customer.addressNumber,
      customer.field6 || customer.buildingName,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "未登録";
  };

  // 電話番号をクリック可能にする
  const handlePhoneClick = (phone: string) => {
    window.location.href = `tel:${phone.replace(/[-\s]/g, "")}`;
  };

  // メールアドレスをクリック可能にする
  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // 変更申請の内容を抽出
  const getChangeRequests = () => {
    if (!customer?.Description) return [];
    return customer.Description
      .split("\n")
      .filter((line) => line.trim().startsWith("【アプリ変更届】"))
      .map((line) => line.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            顧客詳細情報
          </DialogTitle>
          <DialogDescription>
            {customerName || "顧客情報を表示しています"}
          </DialogDescription>
        </DialogHeader>

        {/* ローディング状態 */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p>顧客情報の取得に失敗しました</p>
            <p className="text-base text-slate-700 mt-2">
              {error instanceof Error ? error.message : "不明なエラーが発生しました"}
            </p>
          </div>
        ) : !customer ? (
          <div className="py-8 text-center text-slate-700">
            <User className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>顧客情報が見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 基本情報 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-base text-slate-700 mb-1">顧客ID</p>
                    <p className="text-base font-medium text-slate-900">
                      {customer.ID1 || customer.customerId || "未登録"}
                    </p>
                  </div>
                  <div>
                    <p className="text-base text-slate-700 mb-1">氏名</p>
                    <p className="text-base font-medium text-slate-900">
                      {customer.Last_Name || customer.lastName || ""} {customer.First_Name || customer.firstName || ""}
                    </p>
                  </div>
                  {customer.Date_of_Birth || customer.dateOfBirth ? (
                    <div>
                      <p className="text-base text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        生年月日
                      </p>
                      <p className="text-base font-medium text-slate-900">
                        {customer.Date_of_Birth || customer.dateOfBirth}
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* 連絡先情報 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                  連絡先情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  {/* 電話番号 */}
                  {customer.Phone || customer.phone ? (
                    <div>
                      <p className="text-base text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        電話番号
                      </p>
                      <button
                        onClick={() => handlePhoneClick(customer.Phone || customer.phone || "")}
                        className="text-base font-medium text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        {customer.Phone || customer.phone}
                      </button>
                    </div>
                  ) : null}

                  {/* 携帯電話 */}
                  {customer.Mobile || customer.mobile ? (
                    <div>
                      <p className="text-base text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        携帯電話
                      </p>
                      <button
                        onClick={() => handlePhoneClick(customer.Mobile || customer.mobile || "")}
                        className="text-base font-medium text-blue-700 hover:text-blue-800 hover:underline"
                      >
                        {customer.Mobile || customer.mobile}
                      </button>
                    </div>
                  ) : null}

                  {/* メールアドレス */}
                  {/* メールアドレス - TODO: ZohoCustomer型にemailプロパティが追加されたら実装 */}

                  {/* LINE ID */}
                  {customer.Business_Messaging_Line_Id || customer.lineId ? (
                    <div>
                      <p className="text-base text-slate-700 mb-1 flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        LINE ID
                      </p>
                      <p className="text-base font-medium text-slate-900">
                        {customer.Business_Messaging_Line_Id || customer.lineId}
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* 住所情報 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                  住所情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-base text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    住所
                  </p>
                  <p className="text-base font-medium text-slate-900">
                    {formatAddress()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 変更申請セクション（変更申請がある場合のみ表示） */}
            {hasChangeRequest && (
              <Card className="border-rose-200 bg-rose-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-rose-700">
                    <FileText className="h-4 w-4 shrink-0" />
                    変更申請
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert className="bg-rose-50 border-rose-200">
                    <AlertCircle className="h-4 w-4 text-rose-700" />
                    <AlertDescription className="text-rose-700">
                      顧客情報の変更申請があります。対応完了後、基幹システムを更新してください。
                    </AlertDescription>
                  </Alert>

                  {/* 変更申請の内容を表示 */}
                  <div className="space-y-2">
                    {getChangeRequests().map((request, index) => (
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

                  <Separator className="my-3" />

                  {/* 変更対応完了ボタン */}
                  <Button
                    onClick={handleMarkChangeRequestCompleted}
                    disabled={isMarkingCompleted}
                    variant="outline"
                    className="w-full bg-white border-amber-400 text-amber-700 hover:bg-amber-100"
                  >
                    {isMarkingCompleted ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                        処理中...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
                        変更対応完了
                      </>
                    )}
                  </Button>
                  <p className="text-base text-amber-800 mt-2">
                    ※ 基幹システムを更新した後、このボタンを押してください
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 備考セクション（Descriptionがある場合のみ表示） */}
            {customer?.Description && !hasChangeRequest && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    備考
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-slate-900 whitespace-pre-wrap break-words">
                    {customer.Description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



