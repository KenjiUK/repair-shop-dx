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
} from "lucide-react";
import { ZohoCustomer } from "@/types";
import { fetchCustomerById } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import useSWR from "swr";

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
          <div className="py-8 text-center text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p>顧客情報の取得に失敗しました</p>
            <p className="text-sm text-slate-500 mt-2">
              {error instanceof Error ? error.message : "不明なエラーが発生しました"}
            </p>
          </div>
        ) : !customer ? (
          <div className="py-8 text-center text-slate-500">
            <User className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>顧客情報が見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">顧客ID</p>
                    <p className="text-sm font-medium text-slate-900">
                      {customer.ID1 || customer.customerId || "未登録"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">氏名</p>
                    <p className="text-sm font-medium text-slate-900">
                      {customer.Last_Name || customer.lastName || ""} {customer.First_Name || customer.firstName || ""}
                    </p>
                  </div>
                  {customer.Date_of_Birth || customer.dateOfBirth ? (
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        生年月日
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {customer.Date_of_Birth || customer.dateOfBirth}
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* 連絡先情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  連絡先情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  {/* 電話番号 */}
                  {customer.Phone || customer.phone ? (
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        電話番号
                      </p>
                      <button
                        onClick={() => handlePhoneClick(customer.Phone || customer.phone || "")}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {customer.Phone || customer.phone}
                      </button>
                    </div>
                  ) : null}

                  {/* 携帯電話 */}
                  {customer.Mobile || customer.mobile ? (
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        携帯電話
                      </p>
                      <button
                        onClick={() => handlePhoneClick(customer.Mobile || customer.mobile || "")}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {customer.Mobile || customer.mobile}
                      </button>
                    </div>
                  ) : null}

                  {/* メールアドレス */}
                  {customer.Email || customer.email ? (
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        メールアドレス
                      </p>
                      <button
                        onClick={() => handleEmailClick(customer.Email || customer.email || "")}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline break-all text-left"
                      >
                        {customer.Email || customer.email}
                      </button>
                    </div>
                  ) : null}

                  {/* LINE ID */}
                  {customer.Business_Messaging_Line_Id || customer.lineId ? (
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        LINE ID
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {customer.Business_Messaging_Line_Id || customer.lineId}
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* 住所情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  住所情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    住所
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatAddress()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}



