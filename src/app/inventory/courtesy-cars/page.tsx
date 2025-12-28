"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, CheckCircle2, Clock, AlertCircle, User, Calendar, FileText } from "lucide-react";
import { CourtesyCar, ZohoJob, ZohoCustomer } from "@/types";
import { cn } from "@/lib/utils";
import { fetchCustomerById, fetchTodayJobs, fetchAllCourtesyCars } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppHeader } from "@/components/layout/app-header";
import { useRouter } from "next/navigation";
import Link from "next/link";

type StatusFilter = "all" | "available" | "in_use" | "inspection";

/**
 * 代車管理画面
 */
export default function CourtesyCarsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedVehicleName, setSelectedVehicleName] = useState<string>("");

  // データ取得
  const { data: cars = [], isLoading: isCarsLoading } = useSWR<CourtesyCar[]>(
    "courtesy-cars",
    async () => {
      const result = await fetchAllCourtesyCars();
      return result.success && result.data ? result.data : [];
    }
  );

  const { data: jobs = [], isLoading: isJobsLoading } = useSWR<ZohoJob[]>(
    "today-jobs",
    async () => {
      const result = await fetchTodayJobs();
      return result.success && result.data ? result.data : [];
    }
  );

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
        return "bg-green-50 text-green-700 border-green-300";
      case "reserving":
        return "bg-green-50 text-green-700 border-green-300"; // reservingも空きとして表示
      case "in_use":
        return "bg-orange-50 text-orange-700 border-orange-300";
      case "inspection":
        return "bg-red-50 text-red-700 border-red-300";
      default:
        return "bg-slate-50 text-slate-700 border-slate-300";
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
        return Car;
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
        return "不明";
    }
  };

  // 選択された車両の詳細情報を取得
  const { data: currentCustomer, isLoading: isCustomerLoading } = useSWR<ZohoCustomer | null>(
    selectedCarId && selectedVehicleId
      ? `customer-${selectedVehicleId}`
      : null,
    async () => {
      if (!selectedCarId || !selectedVehicleId) return null;
      
      const car = cars.find((c) => c.carId === selectedCarId);
      if (!car?.jobId) return null;
      
      const job = jobs.find((j) => j.id === car.jobId);
      if (!job?.field4?.id) return null;
      
      const result = await fetchCustomerById(job.field4.id);
      return result.success && result.data ? result.data : null;
    }
  );

  const { data: vehicleMaster, isLoading: isVehicleMasterLoading } = useSWR(
    selectedVehicleId ? `vehicle-master-${selectedVehicleId}` : null,
    async () => {
      if (!selectedVehicleId) return null;
      
      try {
        const { findVehicleMasterById } = await import("@/lib/google-sheets");
        const result = await findVehicleMasterById(selectedVehicleId);
        return result || null;
      } catch (error) {
        console.error("Failed to fetch vehicle master:", error);
        return null;
      }
    }
  );

  if (isCarsLoading || isJobsLoading) {
    return (
      <div className="flex-1 bg-slate-50 overflow-auto">
        <AppHeader
          isTopPage={true}
          hideBrandOnScroll={false}
          maxWidthClassName="max-w-5xl"
        />
        <main className="max-w-5xl mx-auto px-4 py-6">
          <Skeleton className="h-[600px] w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 overflow-auto">
      <AppHeader
        isTopPage={true}
        hideBrandOnScroll={false}
        maxWidthClassName="max-w-5xl"
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* ページタイトル */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Car className="h-5 w-5 text-slate-600 shrink-0" />
            代車管理
          </h1>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border border-slate-300 rounded-xl shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-slate-600 mb-1">総数</p>
                  <p className="text-xl font-bold text-slate-900">{totalCount}</p>
                </div>
                <Car className="h-5 w-5 text-slate-600" strokeWidth={2.5} />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-slate-600 mb-1">空き</p>
                  <p className="text-xl font-bold text-green-600">{availableCount}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-slate-600 mb-1">使用中</p>
                  <p className="text-xl font-bold text-orange-600">{inUseCount}</p>
                </div>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-slate-600 mb-1">点検中</p>
                  <p className="text-xl font-bold text-red-600">{inspectionCount}</p>
                </div>
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルターと車両リスト */}
        <Card className="border border-slate-300 rounded-xl shadow">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-slate-600 shrink-0" />
              代車一覧
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ステータスフィルターボタン */}
            <div className="flex flex-wrap items-center gap-2">
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
            <div className="space-y-3">
              {filteredCars.length === 0 ? (
                <div className="text-center py-12">
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
      </main>

      {/* 車両詳細ダイアログ */}
      {selectedCarId && (
        <Dialog open={!!selectedCarId} onOpenChange={(open) => !open && setSelectedCarId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">代車詳細情報</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 代車基本情報 */}
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-3">代車基本情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-base text-slate-600 mb-1">代車ID</p>
                    <p className="text-base font-medium text-slate-900">{selectedCarId}</p>
                  </div>
                  <div>
                    <p className="text-base text-slate-600 mb-1">代車名</p>
                    <p className="text-base font-medium text-slate-900">{selectedVehicleName}</p>
                  </div>
                  {cars.find((c) => c.carId === selectedCarId)?.licensePlate && (
                    <div className="col-span-2">
                      <p className="text-base text-slate-600 mb-1">ナンバープレート</p>
                      <p className="text-base font-medium text-slate-900">
                        {cars.find((c) => c.carId === selectedCarId)?.licensePlate}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 現在の利用者情報 */}
              {cars.find((c) => c.carId === selectedCarId)?.status === "in_use" && (
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-3">現在の利用者情報</h3>
                  {isCustomerLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : currentCustomer ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-base text-slate-600 mb-1">顧客名</p>
                        <p className="text-base font-medium text-slate-900">
                          {currentCustomer.Last_Name ? `${currentCustomer.Last_Name}${currentCustomer.First_Name ? ` ${currentCustomer.First_Name}` : ""}` : "不明"}
                        </p>
                      </div>
                      <div>
                        <p className="text-base text-slate-600 mb-1">電話番号</p>
                        <p className="text-base font-medium text-slate-900">
                          {currentCustomer.Phone || currentCustomer.Mobile || "未登録"}
                        </p>
                      </div>
                      {cars.find((c) => c.carId === selectedCarId)?.rentedAt && (
                        <div className="col-span-2">
                          <p className="text-base text-slate-600 mb-1">貸出開始日時</p>
                          <p className="text-base font-medium text-slate-900">
                            {new Date(cars.find((c) => c.carId === selectedCarId)!.rentedAt!).toLocaleString("ja-JP", {
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
                    <p className="text-base text-slate-600">利用者情報を取得できませんでした</p>
                  )}
                </div>
              )}

              {/* 車両マスタ情報 */}
              {selectedVehicleId && (
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-3">車両マスタ情報</h3>
                  {isVehicleMasterLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : vehicleMaster ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <FileText className="h-5 w-5 shrink-0" />
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
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-base text-slate-600">車両マスタ情報を取得できませんでした</p>
                  )}
                </div>
              )}

              {/* 過去の利用履歴 */}
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-3">過去の利用履歴</h3>
                <p className="text-base text-slate-600">利用履歴機能は今後実装予定です</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

