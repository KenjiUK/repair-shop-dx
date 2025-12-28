"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { User, Car, Clock, Tag, Wrench, FileText, Star, Folder, CarFront, AlertTriangle, UserCog, ShieldCheck, CalendarCheck, Droplet, Circle, Settings, Activity, Zap, Package, Shield, Sparkles, Paintbrush, ExternalLink } from "lucide-react";
import { ZohoJob, ServiceKind } from "@/types";
import { cn } from "@/lib/utils";
import { CustomerDetailDialog } from "@/components/features/customer-detail-dialog";
import { VehicleDetailDialog } from "@/components/features/vehicle-detail-dialog";
import { ManufacturerIcon } from "@/components/features/manufacturer-icon";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { isImportantCustomer, toggleImportantCustomer } from "@/lib/important-customer-flag";
import { toast } from "sonner";
import { CourtesyCar } from "@/types";
import { MechanicSelectDialog } from "@/components/features/mechanic-select-dialog";
import { CourtesyCarSelectDialog } from "@/components/features/courtesy-car-select-dialog";
import { assignMechanic, updateJobCourtesyCar, fetchAllCourtesyCars } from "@/lib/api";
import useSWR from "swr";
import { mutate } from "swr";

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
  /** タグIDを表示するか（デフォルト: false、引き渡しページなどで必要） */
  showTagId?: boolean;
  /** 入庫区分（サービス種別） */
  serviceKind?: string;
  /** 現在の作業名（作業ページ・診断ページ用） */
  currentWorkOrderName?: string;
  /** 担当整備士 */
  assignedMechanic?: string;
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
/**
 * ステータスバッジのスタイルを取得
 * セマンティックカラーシステムに基づく統一ルール
 */
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case "入庫待ち":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "入庫済み":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "見積作成待ち":
      return "bg-indigo-50 text-indigo-600 border-indigo-300";
    case "見積提示済み":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "作業待ち":
      return "bg-orange-50 text-orange-700 border-orange-300";
    case "出庫待ち":
      return "bg-green-50 text-green-700 border-green-300";
    case "出庫済み":
      return "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600";
    case "部品調達待ち":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "部品発注待ち":
      return "bg-orange-50 text-orange-700 border-orange-300";
    case "入庫済み":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "見積提示済み":
      return "bg-amber-50 text-amber-900 border-amber-300"; // yellow → amber, text-amber-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
    case "出庫済み":
      return "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600"; // text-slate-600 → text-slate-700, border-slate-200 → border-slate-300 (40歳以上ユーザー向け、コントラスト向上)
    default:
      return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-600 dark:text-white dark:border-slate-500";
  }
}

/**
 * サービス種類に応じたアイコンを取得（JOBカードと同じ）
 */
function getServiceKindIcon(serviceKind?: string) {
  if (!serviceKind) return null;
  switch (serviceKind) {
    case "車検":
      return <ShieldCheck className="h-4 w-4 text-cyan-600" strokeWidth={2.5} />;
    case "12ヵ月点検":
      return <CalendarCheck className="h-4 w-4 text-cyan-600" strokeWidth={2.5} />;
    case "エンジンオイル交換":
      return <Droplet className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />;
    case "タイヤ交換・ローテーション":
      return <Circle className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />;
    case "その他のメンテナンス":
      return <Settings className="h-4 w-4 text-slate-700 dark:text-white" strokeWidth={2.5} />;
    case "故障診断":
      return <Activity className="h-4 w-4 text-rose-600" strokeWidth={2.5} />;
    case "修理・整備":
      return <Wrench className="h-4 w-4 text-orange-700" strokeWidth={2.5} />;
    case "チューニング":
      return <Zap className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
    case "パーツ取付":
      return <Package className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
    case "コーティング":
      return <Shield className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
    case "レストア":
      return <Sparkles className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
    case "板金・塗装":
      return <Paintbrush className="h-4 w-4 text-violet-700" strokeWidth={2.5} />;
    case "その他":
      return <FileText className="h-4 w-4 text-slate-700 dark:text-white" strokeWidth={2.5} />;
    default:
      return <FileText className="h-4 w-4 text-slate-700 dark:text-white" strokeWidth={2.5} />;
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
  showTagId = false,
  serviceKind,
  currentWorkOrderName,
  assignedMechanic,
  className,
  courtesyCars = [],
}: CompactJobHeaderProps) {
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isMechanicSelectDialogOpen, setIsMechanicSelectDialogOpen] = useState(false);
  const [isAssigningMechanic, setIsAssigningMechanic] = useState(false);
  const [isCourtesyCarChangeDialogOpen, setIsCourtesyCarChangeDialogOpen] = useState(false);
  const [isChangingCourtesyCar, setIsChangingCourtesyCar] = useState(false);
  
  // 顧客IDを取得
  const customerId = job.field4?.id || null;
  
  // 車両IDを取得
  const vehicleId = job.field6?.id || null;
  
  // 重要な顧客フラグ
  const [isImportant, setIsImportant] = useState(false);
  
  // 代車一覧を取得
  const { data: allCourtesyCars = [], isLoading: isCourtesyCarsLoading } = useSWR(
    "all-courtesy-cars",
    fetchAllCourtesyCars
  );
  
  useEffect(() => {
    if (!customerId) return;
    
    // 次のレンダリングサイクルで状態を更新
    const updateTimer = setTimeout(() => {
      setIsImportant(isImportantCustomer(customerId));
    }, 0);
    
    return () => clearTimeout(updateTimer);
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
  
  // 代車情報を取得（配列チェックを追加）
  const courtesyCar = Array.isArray(courtesyCars) ? courtesyCars.find(car => car.jobId === job.id) : undefined;
  
  // 入庫日時の表示ロジック（JobCardと同じ）
  const isCheckedIn = job.field5 !== "入庫待ち";
  const arrivalDateTime = isCheckedIn && job.field22 ? formatDateTime(job.field22) : { date: "--/--", time: "00:00" };
  const arrivalLabel = isCheckedIn ? "入庫" : "入庫予定";

  // 入庫区分バッジと現在の作業名が重複するかチェック
  const isWorkOrderDuplicated = serviceKind && currentWorkOrderName && 
    serviceKind === currentWorkOrderName;

  // 第3階層に表示する要素があるかチェック（代車情報も追加、タグIDは showTagId が true の場合のみ）
  const hasThirdTier = (currentWorkOrderName && !isWorkOrderDuplicated) || assignedMechanic || (showTagId && tagId) || courtesyCar;

  return (
    <>
      <div className={cn("space-y-1.5", className)}>
        {/* 第1階層: 顧客名 + 重要な顧客フラグ + お客様共有フォルダ + ステータスバッジ */}
        <div className="flex items-center gap-2 sm:gap-3">
          <User className="h-4 w-4 text-slate-700 shrink-0 dark:text-white" />
          <button
            onClick={() => {
              if (customerId) {
                triggerHapticFeedback("light");
                setIsCustomerDialogOpen(true);
              }
            }}
            className={cn(
              "text-base sm:text-lg font-semibold text-slate-900 truncate text-left dark:text-white",
              customerId && "hover:text-blue-700 transition-colors cursor-pointer dark:hover:text-blue-400"
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
                  ? "text-amber-700 hover:text-amber-900" // yellow → amber, text-amber-600 → text-amber-700 (40歳以上ユーザー向け、コントラスト向上)
                  : "text-slate-300 hover:text-amber-500" // yellow → amber
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
              className="shrink-0 text-slate-700 hover:text-blue-700 transition-colors dark:text-white dark:hover:text-blue-400"
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
          
          {/* 緊急対応バッジ */}
          {job.isUrgent && (
            <Badge 
              variant="outline" 
              className="bg-red-50 text-red-700 border-red-300 text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap flex items-center gap-1"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              緊急
            </Badge>
          )}
          
          {/* ステータスバッジ */}
          <Badge
            variant="outline"
            className={cn(
              "text-base font-medium px-2.5 py-0.5 rounded-full shrink-0",
              getStatusBadgeStyle(job.field5)
            )}
          >
            {job.field5}
          </Badge>
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
              vehicleId && "hover:text-blue-700 transition-colors cursor-pointer"
            )}
            title={vehicleId ? "車両詳細を表示" : undefined}
            disabled={!vehicleId}
          >
            <ManufacturerIcon vehicleName={vehicleName} className="h-4 w-4" fallbackClassName="h-4 w-4" />
            <span className="text-base text-slate-800 break-words dark:text-white">
              {vehicleName}
              {licensePlate && <span className="text-slate-700 ml-1 dark:text-white">/ {licensePlate}</span>}
            </span>
          </button>

        {/* 入庫区分（JOBカードと同じアイコン付き） */}
        {serviceKind && (
          <Badge 
            variant="outline" 
            className="bg-slate-100 text-slate-800 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full shrink-0 inline-flex items-center gap-1.5 dark:bg-slate-700 dark:text-white dark:border-slate-600"
          >
            {getServiceKindIcon(serviceKind)}
            <span className="whitespace-nowrap">{serviceKind}</span>
          </Badge>
        )}

        {/* 入庫日時 */}
        <div className="flex items-center gap-1.5 text-base text-slate-800 shrink-0 dark:text-white">
          <Clock className="h-4 w-4 text-slate-700 shrink-0 dark:text-white" />
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
              <div className="flex items-center gap-1.5 text-base text-slate-800 shrink-0 dark:text-white">
                <FileText className="h-4 w-4 text-slate-700 shrink-0 dark:text-white" />
                <span className="break-words">{currentWorkOrderName}</span>
              </div>
            )}

            {/* 担当整備士（クリック可能：変更可能） */}
            {assignedMechanic && (
              <button
                onClick={() => {
                  triggerHapticFeedback("light");
                  setIsMechanicSelectDialogOpen(true);
                }}
                className="flex items-center gap-1.5 text-base text-slate-800 shrink-0 cursor-pointer transition-colors dark:text-white"
                title="整備士を変更"
                aria-label="整備士を変更"
              >
                <UserCog className="h-4 w-4 text-slate-700 shrink-0 dark:text-white" />
                <span className="break-words">{assignedMechanic}</span>
              </button>
            )}
            {/* 整備士が未割り当ての場合もクリック可能 */}
            {!assignedMechanic && (
              <button
                onClick={() => {
                  triggerHapticFeedback("light");
                  setIsMechanicSelectDialogOpen(true);
                }}
                className="flex items-center gap-1.5 text-base text-slate-500 shrink-0 cursor-pointer transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                title="整備士を割り当て"
                aria-label="整備士を割り当て"
              >
                <UserCog className="h-4 w-4 text-slate-400 shrink-0" />
                <span>未割り当て</span>
              </button>
            )}
            
            {/* 代車（クリック可能：変更可能） */}
            {courtesyCar && (
              <button
                onClick={() => {
                  triggerHapticFeedback("light");
                  setIsCourtesyCarChangeDialogOpen(true);
                }}
                className="flex items-center gap-1.5 text-base text-slate-800 shrink-0 cursor-pointer transition-colors dark:text-white"
                title="代車を変更"
                aria-label="代車を変更"
              >
                <CarFront className="h-4 w-4 text-slate-700 shrink-0 dark:text-white" />
                <span className="whitespace-nowrap">代車 {courtesyCar.name}</span>
              </button>
            )}

            {/* タグ（第3階層、重要度が低いため最後に配置、showTagId が true の場合のみ表示） */}
            {showTagId && tagId && (
              <div className="flex items-center gap-1.5 text-base text-slate-700 shrink-0 dark:text-white">
                <Tag className="h-4 w-4 text-slate-700 shrink-0 dark:text-white" />
                <span className="whitespace-nowrap">{tagId}</span>
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

      {/* 整備士選択ダイアログ */}
      <MechanicSelectDialog
        open={isMechanicSelectDialogOpen}
        onOpenChange={setIsMechanicSelectDialogOpen}
        isLoading={false}
        isProcessing={isAssigningMechanic}
        onSelect={async (mechanicName) => {
          setIsAssigningMechanic(true);
          try {
            const result = await assignMechanic(job.id, mechanicName);
            if (result.success) {
              toast.success("整備士を変更しました");
              // データを再取得
              mutate(`job-${job.id}`);
              mutate("today-jobs");
              mutate("all-jobs");
              setIsMechanicSelectDialogOpen(false);
            } else {
              toast.error("整備士の変更に失敗しました", {
                description: result.error?.message,
              });
            }
          } catch (error) {
            console.error("整備士変更エラー:", error);
            toast.error("エラーが発生しました");
          } finally {
            setIsAssigningMechanic(false);
          }
        }}
      />

      {/* 代車変更ダイアログ */}
      <CourtesyCarSelectDialog
        open={isCourtesyCarChangeDialogOpen}
        onOpenChange={setIsCourtesyCarChangeDialogOpen}
        cars={allCourtesyCars}
        isLoading={isCourtesyCarsLoading}
        isProcessing={isChangingCourtesyCar}
        onSelect={async (carId) => {
          setIsChangingCourtesyCar(true);
          try {
            const result = await updateJobCourtesyCar(job.id, carId);
            if (result.success) {
              toast.success("代車を変更しました");
              // データを再取得
              mutate(`job-${job.id}`);
              mutate("today-jobs");
              mutate("all-jobs");
              setIsCourtesyCarChangeDialogOpen(false);
            } else {
              toast.error("代車の変更に失敗しました", {
                description: result.error?.message,
              });
            }
          } catch (error) {
            console.error("代車変更エラー:", error);
            toast.error("エラーが発生しました");
          } finally {
            setIsChangingCourtesyCar(false);
          }
        }}
        onSkip={async () => {
          setIsChangingCourtesyCar(true);
          try {
            const result = await updateJobCourtesyCar(job.id, null);
            if (result.success) {
              toast.success("代車を解除しました");
              // データを再取得
              mutate(`job-${job.id}`);
              mutate("today-jobs");
              mutate("all-jobs");
              setIsCourtesyCarChangeDialogOpen(false);
            } else {
              toast.error("代車の解除に失敗しました", {
                description: result.error?.message,
              });
            }
          } catch (error) {
            console.error("代車解除エラー:", error);
            toast.error("エラーが発生しました");
          } finally {
            setIsChangingCourtesyCar(false);
          }
        }}
      />
    </>
  );
}




