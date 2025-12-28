"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, CheckCircle2, Clock, AlertCircle, User, Calendar } from "lucide-react";
import { CourtesyCar, ZohoJob, ZohoCustomer } from "@/types";
import { cn } from "@/lib/utils";
import { VehicleDetailDialog } from "./vehicle-detail-dialog";
import { fetchCustomerById } from "@/lib/api";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText } from "lucide-react";

interface CourtesyCarInventoryCardProps {
  cars: CourtesyCar[];
  jobs?: ZohoJob[];
}

type StatusFilter = "all" | "available" | "in_use" | "inspection";

/**
 * 代車在庫カード（改善版）
 * - ステータスボタンでフィルタリング
 * - 車両クリックで車両マスタ情報表示
 * - 過去の利用者情報表示
 */
export function CourtesyCarInventoryCard({
  cars,
  jobs = [],
}: CourtesyCarInventoryCardProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleName, setSelectedVehicleName] = useState<string>("");

  // フィルタリングされた車両リスト（reservingも空きとして扱う）
  const filteredCars = useMemo(() => {
    if (statusFilter === "all") return cars;
    if (statusFilter === "available") {
      // availableフィルターの場合、reservingも含める
      return cars.filter((c) => c.status === "available" || c.status === "reserving");
    }
    return cars.filter((c) => c.status === statusFilter);
  }, [cars, statusFilter]);

  // ステータス別の件数（reservingも空きとして扱う）
  const availableCount = cars.filter((c) => c.status === "available" || c.status === "reserving").length;
  const inUseCount = cars.filter((c) => c.status === "in_use").length;
  const inspectionCount = cars.filter((c) => c.status === "inspection").length;
  const totalCount = cars.length;

  // 車両をクリックした時の処理
  const handleCarClick = async (car: CourtesyCar) => {
    // ジョブから車両情報を取得（使用中の場合）
    if (car.jobId) {
      const job = jobs.find((j) => j.id === car.jobId);
      if (job?.field6?.id) {
        setSelectedVehicleId(job.field6.id);
        setSelectedVehicleName(job.field6.name || car.name);
        setSelectedCarId(car.carId);
        return;
      }
    }
    
    // ナンバープレートから車両マスタを検索
    if (car.licensePlate) {
      try {
        const { fetchVehicleMaster } = await import("@/lib/google-sheets");
        const result = await fetchVehicleMaster();
        if (result.data) {
          // ナンバープレートの正規化（空白やハイフンを除去）
          const normalizePlate = (plate: string) => 
            plate.replace(/[\s-]/g, "").toUpperCase();
          
          const matchedVehicle = result.data.find((v) => {
            if (v.登録番号連結 && car.licensePlate) {
              return normalizePlate(v.登録番号連結) === normalizePlate(car.licensePlate);
            }
            return false;
          });
          
          if (matchedVehicle) {
            setSelectedVehicleId(matchedVehicle.車両ID);
            setSelectedVehicleName(matchedVehicle.車名 || car.name);
            setSelectedCarId(car.carId);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to search vehicle master:", error);
      }
    }
    
    // 車両マスタが見つからない場合
    setSelectedVehicleId(null);
    setSelectedVehicleName(car.name);
    setSelectedCarId(car.carId);
  };

  // ステータスバッジのスタイルを取得
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-50 text-green-900 border-green-300";
      case "reserving":
        return "bg-green-50 text-green-900 border-green-300"; // reservingも空きとして表示
      case "in_use":
        return "bg-orange-50 text-orange-900 border-orange-300";
      case "inspection":
        return "bg-red-50 text-red-900 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  // ステータスラベルを取得
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "空き";
      case "reserving":
        return "空き"; // reservingも空きとして表示
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
      case "reserving":
        return CheckCircle2; // reservingも空きとして表示
      case "in_use":
        return Clock;
      case "inspection":
        return AlertCircle;
      default:
        return Car;
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-xl font-bold">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-slate-600 shrink-0" />
              代車在庫
            </div>
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full">
              {totalCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* ステータスボタン */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "h-10 text-base",
                statusFilter === "all" && "bg-slate-600 hover:bg-slate-700 text-white"
              )}
            >
              すべて
              <Badge variant="secondary" className="ml-1 text-base font-medium px-2 py-0.5 rounded-full">
                {totalCount}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === "available" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("available")}
              className={cn(
                "h-10 text-base",
                statusFilter === "available" && "bg-green-600 hover:bg-green-700 text-white"
              )}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              空き
              <Badge variant="secondary" className="ml-1 text-base font-medium px-2 py-0.5 rounded-full">
                {availableCount}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === "in_use" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("in_use")}
              className={cn(
                "h-10 text-base",
                statusFilter === "in_use" && "bg-orange-600 hover:bg-orange-700 text-white"
              )}
            >
              <Clock className="h-4 w-4 shrink-0" />
              使用中
              <Badge variant="secondary" className="ml-1 text-base font-medium px-2 py-0.5 rounded-full">
                {inUseCount}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === "inspection" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("inspection")}
              className={cn(
                "h-10 text-base",
                statusFilter === "inspection" && "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              点検中
              <Badge variant="secondary" className="ml-1 text-base font-medium px-2 py-0.5 rounded-full">
                {inspectionCount}
              </Badge>
            </Button>
          </div>

          {/* 車両リスト */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {filteredCars.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-base text-slate-700">
                  {statusFilter === "all" ? "代車が登録されていません" : `${getStatusLabel(statusFilter)}の代車はありません`}
                </p>
              </div>
            ) : (
              filteredCars.map((car) => {
                const StatusIcon = getStatusIcon(car.status);
                const job = car.jobId ? jobs.find((j) => j.id === car.jobId) : null;
                
                return (
                  <Card
                    key={car.carId}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all duration-200",
                      (car.status === "available" || car.status === "reserving") && "border-green-300 bg-green-50/50",
                      car.status === "in_use" && "border-orange-300 bg-orange-50/50",
                      car.status === "inspection" && "border-red-300 bg-red-50/50"
                    )}
                    onClick={() => handleCarClick(car)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Car className="h-4 w-4 shrink-0" />
                          {car.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={cn(
                              "text-base font-medium px-2.5 py-0.5 rounded-full",
                            getStatusBadgeStyle(car.status)
                          )}
                        >
                          <StatusIcon className="h-4 w-4 shrink-0 mr-1" />
                          {getStatusLabel(car.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-base text-slate-600 mb-1">代車ID</p>
                          <p className="text-base font-medium text-slate-900">
                            {car.carId}
                          </p>
                        </div>
                        <div>
                          <p className="text-base text-slate-600 mb-1">ナンバープレート</p>
                          <p className="text-base font-medium text-slate-900">
                            {car.licensePlate || "未登録"}
                          </p>
                        </div>
                        {car.jobId && job && (
                          <>
                            <div className="col-span-2">
                              <p className="text-base text-slate-600 mb-1 flex items-center gap-1">
                                <User className="h-4 w-4 shrink-0" />
                                現在の利用者
                              </p>
                              <p className="text-base font-medium text-slate-900">
                                {job.field4?.name || "不明"}
                              </p>
                            </div>
                            {car.rentedAt && (
                              <div className="col-span-2">
                                <p className="text-base text-slate-600 mb-1 flex items-center gap-1">
                                  <Calendar className="h-4 w-4 shrink-0" />
                                  貸出開始日時
                                </p>
                                <p className="text-base font-medium text-slate-900">
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
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 代車詳細ダイアログ */}
      {selectedCarId && (
        <CourtesyCarDetailDialog
          carId={selectedCarId}
          vehicleId={selectedVehicleId}
          vehicleName={selectedVehicleName}
          cars={cars}
          jobs={jobs}
          onClose={() => {
            setSelectedCarId(null);
            setSelectedVehicleId(null);
            setSelectedVehicleName("");
          }}
        />
      )}
    </>
  );
}

/**
 * 代車詳細ダイアログ（車両マスタ情報 + 利用履歴）
 */
interface CourtesyCarDetailDialogProps {
  carId: string;
  vehicleId: string | null;
  vehicleName: string;
  cars: CourtesyCar[];
  jobs: ZohoJob[];
  onClose: () => void;
}

function CourtesyCarDetailDialog({
  carId,
  vehicleId,
  vehicleName,
  cars,
  jobs,
  onClose,
}: CourtesyCarDetailDialogProps) {
  const car = cars.find((c) => c.carId === carId);
  const currentJob = car?.jobId ? jobs.find((j) => j.id === car.jobId) : null;

  // 車両マスタを取得
  const { data: vehicleMaster, error: vehicleError, isLoading: isVehicleLoading } = useSWR(
    vehicleId ? `vehicle-master-${vehicleId}` : null,
    async () => {
      if (!vehicleId) return null;
      const { findVehicleMasterById } = await import("@/lib/google-sheets");
      return await findVehicleMasterById(vehicleId);
    }
  );

  // 過去の利用履歴を取得（jobIdが設定されている過去のジョブ）
  // 実際の実装では、代車の利用履歴を管理するテーブルから取得
  // ここでは簡易的に、過去にこの代車が使用されていた可能性のあるジョブを検索
  const rentalHistory = useMemo<ZohoJob[]>(() => {
    if (!car) return [];
    
    // 現在のジョブ以外で、この代車IDが使用されていたジョブを検索
    // 実際の実装では、代車利用履歴テーブルから取得
    // 簡易実装: 過去のジョブで、代車が使用されていた可能性があるもの
    // 現在は空配列を返す（将来の実装用）
    return [];
  }, [car, jobs]);

  // 現在の利用者情報を取得
  const { data: currentCustomer, isLoading: isCustomerLoading } = useSWR(
    currentJob?.field4?.id ? `customer-${currentJob.field4.id}` : null,
    async () => {
      if (!currentJob?.field4?.id) return null;
      const result = await fetchCustomerById(currentJob.field4.id);
      return result.success ? result.data : null;
    }
  );

  // ステータスバッジのスタイルを取得
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-50 text-green-900 border-green-300";
      case "reserving":
        return "bg-green-50 text-green-900 border-green-300"; // reservingも空きとして表示
      case "in_use":
        return "bg-orange-50 text-orange-900 border-orange-300";
      case "inspection":
        return "bg-red-50 text-red-900 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  // ステータスラベルを取得
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "空き";
      case "reserving":
        return "空き"; // reservingも空きとして表示
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
      case "reserving":
        return CheckCircle2; // reservingも空きとして表示
      case "in_use":
        return Clock;
      case "inspection":
        return AlertCircle;
      default:
        return Car;
    }
  };

  if (!car) return null;

  const StatusIcon = getStatusIcon(car.status);

  return (
    <Dialog open={!!carId} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 shrink-0" />
            代車詳細情報
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 代車基本情報 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Car className="h-5 w-5 shrink-0" />
                代車情報
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-auto text-base font-medium px-2.5 py-0.5 rounded-full",
                    getStatusBadgeStyle(car.status)
                  )}
                >
                  <StatusIcon className="h-4 w-4 shrink-0 mr-1" />
                  {getStatusLabel(car.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-base text-slate-600 mb-1">代車ID</p>
                  <p className="text-base font-medium text-slate-900">
                    {car.carId}
                  </p>
                </div>
                <div>
                  <p className="text-base text-slate-600 mb-1">車名</p>
                  <p className="text-base font-medium text-slate-900">
                    {car.name}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-base text-slate-600 mb-1">ナンバープレート</p>
                  <p className="text-base font-medium text-slate-900">
                    {car.licensePlate || "未登録"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 車両マスタ情報（該当する場合） */}
          {vehicleId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 shrink-0" />
                  車両マスタ情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isVehicleLoading ? (
                  <Skeleton className="h-32" />
                ) : vehicleError ? (
                  <p className="text-base text-slate-700">車両マスタ情報の取得に失敗しました</p>
                ) : vehicleMaster ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-base text-slate-600 mb-1">車両ID</p>
                      <p className="text-base font-medium text-slate-900">
                        {vehicleMaster.車両ID}
                      </p>
                    </div>
                    <div>
                      <p className="text-base text-slate-600 mb-1">顧客ID</p>
                      <p className="text-base font-medium text-slate-900">
                        {vehicleMaster.顧客ID}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-base text-slate-600 mb-1">車名</p>
                      <p className="text-base font-medium text-slate-900">
                        {vehicleMaster.車名}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-base text-slate-600 mb-1">型式</p>
                      <p className="text-base font-medium text-slate-900">
                        {vehicleMaster.型式}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-base text-slate-600 mb-1 flex items-center gap-1">
                        <Car className="h-4 w-4 shrink-0" />
                        登録番号（ナンバープレート）
                      </p>
                      <p className="text-base font-medium text-slate-900">
                        {vehicleMaster.登録番号連結 || "未登録"}
                      </p>
                    </div>
                    {vehicleMaster.車検有効期限 && (
                      <div>
                        <p className="text-base text-slate-600 mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4 shrink-0" />
                          車検有効期限
                        </p>
                        <p className="text-base font-medium text-slate-900">
                          {vehicleMaster.車検有効期限}
                        </p>
                      </div>
                    )}
                    {vehicleMaster.次回点検日 && (
                      <div>
                        <p className="text-base text-slate-600 mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4 shrink-0" />
                          次回点検日
                        </p>
                        <p className="text-base font-medium text-slate-900">
                          {vehicleMaster.次回点検日}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-base text-slate-700">車両マスタ情報が見つかりませんでした</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 現在の利用者情報 */}
          {currentJob && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5 shrink-0" />
                  現在の利用者情報
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCustomerLoading ? (
                  <Skeleton className="h-20" />
                ) : currentCustomer ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-base text-slate-600 mb-1">顧客名</p>
                      <p className="text-base font-medium text-slate-900">
                        {currentCustomer.Last_Name || "不明"}
                      </p>
                    </div>
                    <div>
                      <p className="text-base text-slate-600 mb-1">電話番号</p>
                      <p className="text-base font-medium text-slate-900">
                        {currentCustomer.Phone || currentCustomer.Mobile || "未登録"}
                      </p>
                    </div>
                    {car.rentedAt && (
                      <div className="col-span-2">
                        <p className="text-base text-slate-600 mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4 shrink-0" />
                          貸出開始日時
                        </p>
                        <p className="text-base font-medium text-slate-900">
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
                ) : (
                  <p className="text-base text-slate-700">利用者情報を取得できませんでした</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 過去の利用履歴 */}
          {rentalHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 shrink-0" />
                  過去の利用履歴
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rentalHistory.map((job) => (
                    <div key={job.id} className="p-3 rounded-md bg-slate-50 border border-slate-200">
                      <p className="text-base font-medium text-slate-900">
                        {job.field4?.name || "不明"}
                      </p>
                      <p className="text-base text-slate-600 mt-1">
                        {job.field22 ? new Date(job.field22).toLocaleDateString("ja-JP") : "日付不明"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
