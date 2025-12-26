"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Car, Tag, Calendar, User, Phone, Gauge, Wrench, Clock } from "lucide-react";

interface CustomerInfoCardProps {
  customerName: string;
  vehicleName: string;
  licensePlate?: string | null;
  tagId: string;
  mileage?: number | null;
  arrivalDateTime?: string | null;
  completedAtText: string;
  assignedMechanic?: string | null;
  customerPhone?: string | null;
}

/**
 * 日時をフォーマット
 */
function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * 走行距離をフォーマット
 */
function formatMileage(mileage: number | null | undefined): string {
  if (!mileage) return "";
  return new Intl.NumberFormat("ja-JP").format(mileage) + " km";
}

/**
 * 顧客・車両情報カードコンポーネント
 */
export function CustomerInfoCard({
  customerName,
  vehicleName,
  licensePlate,
  tagId,
  mileage,
  arrivalDateTime,
  completedAtText,
  assignedMechanic,
  customerPhone,
}: CustomerInfoCardProps) {
  const arrivalDateTimeText = formatDateTime(arrivalDateTime);

  return (
    <Card className="mb-6 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
      <CardContent className="py-6">
        <div className="space-y-4">
          {/* お客様情報 */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <User className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-base">お客様</p>
              <p className="text-2xl font-bold truncate">{customerName} 様</p>
              {customerPhone && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Phone className="h-4 w-4 text-white/70 shrink-0" />
                  <p className="text-base text-white/90">{customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* 車両情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/20">
            <div className="flex items-start gap-3">
              <Car className="h-5 w-5 text-white/70 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-base">車両</p>
                <p className="font-medium truncate">{vehicleName}</p>
                {licensePlate && (
                  <p className="text-base text-white/80 mt-0.5">{licensePlate}</p>
                )}
              </div>
            </div>

            {mileage && (
              <div className="flex items-start gap-3">
                <Gauge className="h-5 w-5 text-white/70 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-base">走行距離</p>
                  <p className="font-medium">{formatMileage(mileage)}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Tag className="h-5 w-5 text-white/70 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-base">タグ</p>
                <p className="font-medium">No.{tagId || "未設定"}</p>
              </div>
            </div>

            {arrivalDateTimeText && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-white/70 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-base">入庫日時</p>
                  <p className="font-medium text-base">{arrivalDateTimeText}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-white/70 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-base">完了日時</p>
                <p className="font-medium text-base">{completedAtText || "未設定"}</p>
              </div>
            </div>

            {assignedMechanic && (
              <div className="flex items-start gap-3">
                <Wrench className="h-5 w-5 text-white/70 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-base">担当整備士</p>
                  <p className="font-medium truncate">{assignedMechanic}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}








