"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Car, 
  Calendar, 
  Gauge, 
  FileText, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { MasterVehicle, CourtesyCar } from "@/types";
import { findVehicleMasterById } from "@/lib/google-sheets";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import useSWR from "swr";

interface VehicleDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string | null;
  vehicleName?: string;
  courtesyCars?: CourtesyCar[];
  reportedMileage?: number | null;
}

/**
 * 車両詳細ダイアログ
 * 車両マスタと代車情報を表示
 */
export function VehicleDetailDialog({
  open,
  onOpenChange,
  vehicleId,
  vehicleName,
  courtesyCars = [],
  reportedMileage,
}: VehicleDetailDialogProps) {
  const [courtesyCar, setCourtesyCar] = useState<CourtesyCar | null>(null);

  // 車両マスタを取得
  const { data: vehicleMaster, error, isLoading } = useSWR(
    vehicleId && open ? `vehicle-master-${vehicleId}` : null,
    async () => {
      if (!vehicleId) return null;
      return await findVehicleMasterById(vehicleId);
    }
  );

  // 代車情報を検索（ナンバープレートまたは車両IDで一致するものを探す）
  useEffect(() => {
    if (!vehicleMaster || !Array.isArray(courtesyCars) || !courtesyCars.length) {
      // 次のレンダリングサイクルで状態を更新
      const updateTimer = setTimeout(() => {
        setCourtesyCar(null);
      }, 0);
      return () => clearTimeout(updateTimer);
    }

    // ナンバープレートで一致する代車を探す
    const matchedCar = courtesyCars.find((car) => {
      if (car.licensePlate && vehicleMaster.登録番号連結) {
        // ナンバープレートの正規化（空白やハイフンを除去）
        const normalizePlate = (plate: string) => 
          plate.replace(/[\s-]/g, "").toUpperCase();
        return normalizePlate(car.licensePlate) === normalizePlate(vehicleMaster.登録番号連結);
      }
      return false;
    });

    // 次のレンダリングサイクルで状態を更新
    const updateTimer = setTimeout(() => {
      setCourtesyCar(matchedCar || null);
    }, 0);
    
    return () => clearTimeout(updateTimer);
  }, [vehicleMaster, courtesyCars]);

  // ステータスバッジのスタイルを取得
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-50 text-green-700 border-green-300";
      case "in_use":
        return "bg-orange-50 text-orange-700 border-orange-300";
      case "inspection":
        return "bg-red-50 text-red-700 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  // ステータスラベルを取得
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "空き";
      case "in_use":
        return "使用中";
      case "inspection":
        return "点検中";
      default:
        return status;
    }
  };

  // ステータスアイコンを取得
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return CheckCircle2;
      case "in_use":
        return Clock;
      case "inspection":
        return AlertCircle;
      default:
        return XCircle;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            車両詳細情報
          </DialogTitle>
          <DialogDescription>
            {vehicleName || "車両情報を表示しています"}
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
            <p>車両情報の取得に失敗しました</p>
            <p className="text-base text-slate-700 mt-2">
              {error instanceof Error ? error.message : "不明なエラーが発生しました"}
            </p>
          </div>
        ) : !vehicleMaster ? (
          <div className="py-8 text-center text-slate-700">
            <Car className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>車両情報が見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 車両マスタ情報 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                  車両マスタ情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-base text-slate-700 mb-1">車両ID</p>
                    <p className="text-base font-medium text-slate-900">
                      {vehicleMaster.車両ID}
                    </p>
                  </div>
                  <div>
                    <p className="text-base text-slate-700 mb-1">顧客ID</p>
                    <p className="text-base font-medium text-slate-900">
                      {vehicleMaster.顧客ID}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-base text-slate-700 mb-1">車名</p>
                    <p className="text-base font-medium text-slate-900">
                      {vehicleMaster.車名}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-base text-slate-700 mb-1">型式</p>
                    <p className="text-base font-medium text-slate-900">
                      {vehicleMaster.型式}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-base text-slate-700 mb-1 flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      登録番号（ナンバープレート）
                    </p>
                    <p className="text-base font-medium text-slate-900">
                      {vehicleMaster.登録番号連結 || "未登録"}
                    </p>
                  </div>
                  {vehicleMaster.車検有効期限 && (
                    <div>
                      <p className="text-base text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        車検有効期限
                      </p>
                      <p className="text-base font-medium text-slate-900">
                        {vehicleMaster.車検有効期限}
                      </p>
                    </div>
                  )}
                  {vehicleMaster.次回点検日 && (
                    <div>
                      <p className="text-base text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        次回点検日
                      </p>
                      <p className="text-base font-medium text-slate-900">
                        {vehicleMaster.次回点検日}
                      </p>
                    </div>
                  )}
                  {/* 走行距離セクション */}
                  {(reportedMileage !== null && reportedMileage !== undefined) ? (
                    <div className="col-span-2 space-y-2 pt-2 border-t border-slate-200">
                      <p className="text-base text-slate-700 mb-2 flex items-center gap-1">
                        <Gauge className="h-4 w-4" />
                        走行距離
                      </p>
                      {reportedMileage !== null && reportedMileage !== undefined && (
                        <div className="mb-2">
                          <p className="text-base text-slate-700 mb-1">
                            顧客申告（直近）
                          </p>
                          <p className="text-base font-medium text-slate-900">
                            {reportedMileage.toLocaleString()} km
                          </p>
                        </div>
                      )}
                      {/* TODO: MasterVehicle型に走行距離プロパティが追加されたら実装 */}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* 代車情報（該当する場合） */}
            {courtesyCar ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Car className="h-5 w-5 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                    代車情報
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-auto text-base font-medium",
                        getStatusBadgeStyle(courtesyCar.status)
                      )}
                    >
                      {(() => {
                        const Icon = getStatusIcon(courtesyCar.status);
                        return (
                          <span className="flex items-center gap-1">
                            <Icon className="h-4 w-4" />
                            {getStatusLabel(courtesyCar.status)}
                          </span>
                        );
                      })()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-base text-slate-700 mb-1">代車ID</p>
                      <p className="text-base font-medium text-slate-900">
                        {courtesyCar.carId}
                      </p>
                    </div>
                    <div>
                      <p className="text-base text-slate-700 mb-1">車名</p>
                      <p className="text-base font-medium text-slate-900">
                        {courtesyCar.name}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-base text-slate-700 mb-1">ナンバープレート</p>
                      <p className="text-base font-medium text-slate-900">
                        {courtesyCar.licensePlate || "未登録"}
                      </p>
                    </div>
                    {courtesyCar.jobId && (
                      <div>
                        <p className="text-base text-slate-700 mb-1">紐付け中の案件ID</p>
                        <p className="text-base font-medium text-slate-900">
                          {courtesyCar.jobId}
                        </p>
                      </div>
                    )}
                    {courtesyCar.rentedAt && (
                      <div>
                        <p className="text-base text-slate-700 mb-1">貸出開始日時</p>
                        <p className="text-base font-medium text-slate-900">
                          {new Date(courtesyCar.rentedAt).toLocaleString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-50">
                <CardContent className="py-4">
                  <p className="text-base text-slate-700 text-center">
                    この車両は代車として登録されていません
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





