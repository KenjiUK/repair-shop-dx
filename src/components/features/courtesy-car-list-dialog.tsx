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
import { 
  Car, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  FileText,
} from "lucide-react";
import { CourtesyCar } from "@/types";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { VehicleDetailDialog } from "./vehicle-detail-dialog";
import { useState } from "react";

interface CourtesyCarListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cars: CourtesyCar[];
  status: "available" | "in_use" | "inspection";
  statusLabel: string;
}

/**
 * 代車一覧ダイアログ
 * 指定されたステータスの代車一覧を表示
 */
export function CourtesyCarListDialog({
  open,
  onOpenChange,
  cars,
  status,
  statusLabel,
}: CourtesyCarListDialogProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleName, setSelectedVehicleName] = useState<string>("");
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

  // 指定されたステータスの車両をフィルタリング
  const filteredCars = cars.filter((car) => car.status === status);

  // ステータスバッジのスタイルを取得
  const getStatusBadgeStyle = (carStatus: string) => {
    switch (carStatus) {
      case "available":
        return "bg-green-50 text-green-700 border-green-200";
      case "in_use":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "inspection":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  // ステータスアイコンを取得
  const getStatusIcon = (carStatus: string) => {
    switch (carStatus) {
      case "available":
        return CheckCircle2;
      case "in_use":
        return Clock;
      case "inspection":
        return AlertCircle;
      default:
        return Car;
    }
  };

  // 車両詳細を開く（ナンバープレートから車両マスタを検索）
  const handleCarClick = async (car: CourtesyCar) => {
    triggerHapticFeedback("light");
    
    // ナンバープレートがある場合、車両マスタから検索を試みる
    if (car.licensePlate) {
      try {
        // 車両マスタを取得して、ナンバープレートで検索
        const { fetchVehicleMaster } = await import("@/lib/google-sheets");
        const response = await fetchVehicleMaster();
        // responseはSheetsApiResponse<MasterVehicle>型で、dataプロパティに配列がある
        const vehicles = response.data || [];
        const matchedVehicle = vehicles.find((v) => {
          if (!v.登録番号連結) return false;
          // ナンバープレートの正規化（空白やハイフンを除去）
          const normalizePlate = (plate: string) => 
            plate.replace(/[\s-]/g, "").toUpperCase();
          return normalizePlate(v.登録番号連結) === normalizePlate(car.licensePlate || "");
        });
        
        if (matchedVehicle) {
          setSelectedVehicleId(matchedVehicle.車両ID);
          setSelectedVehicleName(car.name);
          setIsVehicleDialogOpen(true);
        } else {
          // 車両マスタが見つからない場合は、代車情報のみを表示
          // ナンバープレートはあるが、車両マスタに登録されていない場合
          console.log("車両マスタが見つかりませんでした:", car.licensePlate);
          // 代車情報のみを表示する場合は、ここで別の処理を追加可能
        }
      } catch (error) {
        console.error("車両マスタの検索に失敗しました:", error);
        // エラーが発生した場合でも、代車情報は表示されているので問題なし
      }
    } else {
      // ナンバープレートがない場合は、代車情報のみを表示
      // 現在のダイアログで既に表示されているので、追加の処理は不要
      console.log("ナンバープレートが登録されていません:", car.carId);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              代車一覧 - {statusLabel}
            </DialogTitle>
            <DialogDescription>
              {filteredCars.length}台の代車が{statusLabel}です
            </DialogDescription>
          </DialogHeader>

          {filteredCars.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Car className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>{statusLabel}の代車はありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCars.map((car) => {
                const StatusIcon = getStatusIcon(car.status);
                return (
                  <Card
                    key={car.carId}
                    className={cn(
                      "transition-all cursor-pointer hover:shadow-md",
                      "border-slate-200"
                    )}
                    onClick={() => handleCarClick(car)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Car className="h-4 w-4 text-slate-600" />
                          {car.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-medium",
                            getStatusBadgeStyle(car.status)
                          )}
                        >
                          <span className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusLabel}
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">代車ID</p>
                          <p className="text-sm font-medium text-slate-900">
                            {car.carId}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">車名</p>
                          <p className="text-sm font-medium text-slate-900">
                            {car.name}
                          </p>
                        </div>
                        {car.licensePlate && (
                          <div className="col-span-2">
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              ナンバープレート
                            </p>
                            <p className="text-sm font-medium text-slate-900">
                              {car.licensePlate}
                            </p>
                          </div>
                        )}
                        {car.jobId && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              紐付け中の案件ID
                            </p>
                            <p className="text-sm font-medium text-slate-900">
                              {car.jobId}
                            </p>
                          </div>
                        )}
                        {car.rentedAt && (
                          <div>
                            <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              貸出開始日時
                            </p>
                            <p className="text-sm font-medium text-slate-900">
                              {new Date(car.rentedAt).toLocaleString("ja-JP", {
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
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 車両詳細ダイアログ */}
      <VehicleDetailDialog
        open={isVehicleDialogOpen}
        onOpenChange={setIsVehicleDialogOpen}
        vehicleId={selectedVehicleId}
        vehicleName={selectedVehicleName}
        courtesyCars={cars}
      />
    </>
  );
}

