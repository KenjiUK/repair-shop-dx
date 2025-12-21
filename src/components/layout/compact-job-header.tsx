"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { User, Car, Clock, Tag, ChevronLeft, Wrench, FileText, Star, Folder, CarFront } from "lucide-react";
import { ZohoJob } from "@/types";
import { cn } from "@/lib/utils";
import { CustomerDetailDialog } from "@/components/features/customer-detail-dialog";
import { VehicleDetailDialog } from "@/components/features/vehicle-detail-dialog";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { isImportantCustomer, toggleImportantCustomer } from "@/lib/important-customer-flag";
import { toast } from "sonner";
import { CourtesyCar } from "@/types";

interface CompactJobHeaderProps {
  /** 案件情報 */
  job: ZohoJob;
  /** 顧客名 */
  customerName: string;
  /** 車両情報 */
  vehicleName: string;
  /** ナンバープレート（オプション） */
  licensePlate?: string;
  /** タグID */
  tagId?: string;
  /** 入庫区分（サービス種別） */
  serviceKind?: string;
  /** 現在の作業名（作業ページ・診断ページ用） */
  currentWorkOrderName?: string;
  /** 担当整備士 */
  assignedMechanic?: string;
  /** 戻るボタンのリンク先（デフォルト: "/"） */
  backHref?: string;
  /** カスタムクラス */
  className?: string;
  /** 代車情報（オプション） */
  courtesyCars?: CourtesyCar[];
}

/**
 * ISO8601の日時文字列から日付と時刻を抽出 (MM/DD HH:MM形式)
 */
function formatDateTime(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: "--/--", time: "--:--" };
  const date = new Date(isoString);
  const dateStr = date.toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  const timeStr = date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  return { date: dateStr, time: timeStr };
}

/**
 * ステータスバッジのスタイルを取得
 */
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case "入庫待ち":
    case "見積作成待ち":
    case "作業待ち":
      return "bg-red-50 text-red-700 border-red-200";
    case "入庫済み":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "見積提示済み":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "出庫済み":
      return "bg-gray-50 text-gray-500 border-gray-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

/**
 * コンパクトな案件ヘッダー
 * TOPページ以外のページで使用する、必要最低限の情報を表示するヘッダー
 * JobCardの情報階層をベースに設計
 * 
 * 情報階層:
 * - 第1階層: 顧客名 + 重要な顧客フラグ + お客様共有フォルダ + ステータスバッジ + 戻るボタン
 * - 第2階層: 車両情報、入庫区分、時間（横並び、モバイルでは折り返し）
 * - 第3階層: 現在の作業、担当整備士、代車、タグ（該当する場合のみ）
 */
export function CompactJobHeader({
  job,
  customerName,
  vehicleName,
  licensePlate,
  tagId,
  serviceKind,
  currentWorkOrderName,
  assignedMechanic,
  backHref = "/",
  className,
  courtesyCars = [],
}: CompactJobHeaderProps) {
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  
  // 顧客IDを取得
  const customerId = job.field4?.id || null;
  
  // 車両IDを取得
  const vehicleId = job.field6?.id || null;
  
  // 重要な顧客フラグ
  const [isImportant, setIsImportant] = useState(false);
  
  useEffect(() => {
    if (customerId) {
      setIsImportant(isImportantCustomer(customerId));
    }
  }, [customerId]);
  
  // 重要な顧客フラグのトグル
  const handleToggleImportant = () => {
    if (!customerId) return;
    triggerHapticFeedback("medium");
    const newState = toggleImportantCustomer(customerId);
    setIsImportant(newState);
    triggerHapticFeedback(newState ? "success" : "light");
    toast.success(newState ? "重要な顧客としてマークしました" : "重要な顧客マークを解除しました");
  };
  
  // 代車情報を取得
  const courtesyCar = courtesyCars.find(car => car.jobId === job.id);
  
  // 入庫日時の表示ロジック（JobCardと同じ）
  const isCheckedIn = job.field5 !== "入庫待ち";
  const arrivalDateTime = isCheckedIn && job.field22 ? formatDateTime(job.field22) : { date: "--/--", time: "00:00" };
  const arrivalLabel = isCheckedIn ? "入庫" : "入庫予定";

  // 入庫区分バッジと現在の作業名が重複するかチェック
  const isWorkOrderDuplicated = serviceKind && currentWorkOrderName && 
    serviceKind === currentWorkOrderName;

  // 第3階層に表示する要素があるかチェック（代車情報も追加）
  const hasThirdTier = (currentWorkOrderName && !isWorkOrderDuplicated) || assignedMechanic || tagId || courtesyCar;

  return (
    <>
      <div className={cn("space-y-1.5", className)}>
        {/* 第1階層: 顧客名 + 重要な顧客フラグ + お客様共有フォルダ + ステータスバッジ + 戻るボタン */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500 shrink-0" />
            <button
              onClick={() => {
                if (customerId) {
                  triggerHapticFeedback("light");
                  setIsCustomerDialogOpen(true);
                }
              }}
              className={cn(
                "text-sm sm:text-base font-semibold text-slate-900 truncate text-left",
                customerId && "hover:text-blue-600 transition-colors cursor-pointer"
              )}
              title={customerId ? "顧客詳細を表示" : undefined}
              disabled={!customerId}
            >
              {customerName}
            </button>
            
            {/* 重要な顧客フラグ（Starアイコン） */}
            {customerId && (
              <button
                onClick={handleToggleImportant}
                className={cn(
                  "shrink-0 transition-all",
                  isImportant 
                    ? "text-yellow-500 hover:text-yellow-600" 
                    : "text-slate-300 hover:text-yellow-400"
                )}
                aria-label={isImportant ? "重要な顧客マークを解除" : "重要な顧客としてマーク"}
                title={isImportant ? "重要な顧客" : "重要な顧客としてマーク"}
              >
                <Star className={cn("h-4 w-4 transition-all", isImportant && "fill-current")} />
              </button>
            )}
            
            {/* お客様共有フォルダ（Starアイコンの右） */}
            {job.field19 && (
              <a
                href={job.field19}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-slate-500 hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHapticFeedback("light");
                }}
                title="お客様共有フォルダを開く"
                aria-label="お客様共有フォルダ"
              >
                <Folder className="h-4 w-4" />
              </a>
            )}
            
            {/* ステータスバッジ */}
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0",
                getStatusBadgeStyle(job.field5)
              )}
            >
              {job.field5}
            </Badge>
          </div>

          {/* 右側: 戻るボタン */}
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 shrink-0 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">戻る</span>
          </Link>
        </div>

        {/* 第2階層: 車両情報、入庫区分、時間（横並び、モバイルでは折り返し） */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* 車両情報（クリック可能） */}
          <button
            onClick={() => {
              if (vehicleId) {
                triggerHapticFeedback("light");
                setIsVehicleDialogOpen(true);
              }
            }}
            className={cn(
              "flex items-center gap-1.5 min-w-0 text-left",
              vehicleId && "hover:text-blue-600 transition-colors cursor-pointer"
            )}
            title={vehicleId ? "車両詳細を表示" : undefined}
            disabled={!vehicleId}
          >
            <Car className="h-4 w-4 text-slate-500 shrink-0" />
            <span className="text-sm text-slate-700 break-words">
              {vehicleName}
              {licensePlate && <span className="text-slate-400 ml-1">/ {licensePlate}</span>}
            </span>
          </button>

        {/* 入庫区分 */}
        {serviceKind && (
          <Badge 
            variant="outline" 
            className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
          >
            <span className="whitespace-nowrap">{serviceKind}</span>
          </Badge>
        )}

        {/* 入庫日時 */}
        <div className="flex items-center gap-1.5 text-sm text-slate-700 shrink-0">
          <Clock className="h-4 w-4 text-slate-500 shrink-0" />
          <span className="whitespace-nowrap">
            {arrivalDateTime.date} {arrivalDateTime.time} {arrivalLabel}
          </span>
        </div>
        </div>

        {/* 第3階層: 現在の作業、担当整備士、代車、タグ（該当する場合のみ） */}
        {hasThirdTier && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* 現在の作業（入庫区分バッジと重複しない場合のみ表示） */}
            {currentWorkOrderName && !isWorkOrderDuplicated && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 shrink-0">
                <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="break-words">{currentWorkOrderName}</span>
              </div>
            )}

            {/* 担当整備士 */}
            {assignedMechanic && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 shrink-0">
                <Wrench className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="break-words">{assignedMechanic}</span>
              </div>
            )}
            
            {/* 代車 */}
            {courtesyCar && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600 shrink-0">
                <CarFront className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="whitespace-nowrap">代車 {courtesyCar.name}</span>
              </div>
            )}

            {/* タグ（第3階層、重要度が低いため最後に配置） */}
            {tagId && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 shrink-0">
                <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="whitespace-nowrap">タグ {tagId}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 顧客詳細ダイアログ */}
      <CustomerDetailDialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        customerId={customerId}
        customerName={customerName}
      />

      {/* 車両詳細ダイアログ */}
      <VehicleDetailDialog
        open={isVehicleDialogOpen}
        onOpenChange={setIsVehicleDialogOpen}
        vehicleId={vehicleId}
        vehicleName={vehicleName}
        courtesyCars={courtesyCars}
        reportedMileage={job.field10 || null}
      />
    </>
  );
}




