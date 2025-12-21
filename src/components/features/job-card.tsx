"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZohoJob, CourtesyCar, ZohoCustomer, ZohoVehicle } from "@/types";
import { 
  Car, Clock, User, FileText, Tag, Wrench, Edit, Plus, Clipboard, 
  Activity, Key, CheckCircle2, Droplet, Circle, Sparkles, Zap, 
  Package, Shield, CarFront, Loader2, Paintbrush, MessageSquare, 
  Bell, Heart, Gauge, Star, ChevronDown, Info, Phone, ExternalLink, Folder, Mail,
  ShieldCheck, CalendarCheck, UserCheck
} from "lucide-react";
import Link from "next/link";
import { WorkOrderDialog } from "@/components/features/work-order-dialog";
import { VehicleDetailDialog } from "@/components/features/vehicle-detail-dialog";
import { CustomerDetailDialog } from "@/components/features/customer-detail-dialog";
import { fetchCustomerById, fetchVehicleById } from "@/lib/api";
import { hasChangeRequests } from "@/lib/customer-description-append";
import { markChangeRequestCompleted } from "@/lib/customer-update";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { toast } from "sonner";
import { isImportantCustomer, toggleImportantCustomer } from "@/lib/important-customer-flag";

// =============================================================================
// Helper Functions
// =============================================================================

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
 * アクション設定を取得
 * アイコン色・ボタン背景色ルール:
 * - 入庫待ち: グレー（初期状態）
 * - 入庫済み: 青（診断開始）
 * - 見積作成待ち: オレンジ（見積作成）
 * - 作業待ち: 緑（作業開始）
 * - 出庫待ち: 紫（引渡し）
 */
function getActionConfig(job: ZohoJob, onCheckIn: () => void) {
  switch (job.field5) {
    case "入庫待ち":
      return {
        label: "受付を開始",
        icon: Key,
        iconColor: "text-white",
        buttonBgColor: "bg-slate-600",
        buttonHoverColor: "hover:bg-slate-700",
        href: null,
        onClick: onCheckIn,
        priority: "high" as const,
      };
    case "入庫済み":
      return {
        label: "診断を開始",
        icon: Activity,
        iconColor: "text-white",
        buttonBgColor: "bg-blue-600",
        buttonHoverColor: "hover:bg-blue-700",
        href: `/mechanic/diagnosis/${job.id}`,
        priority: "high" as const,
      };
    case "見積作成待ち":
      return {
        label: "見積を開始",
        icon: FileText,
        iconColor: "text-white",
        buttonBgColor: "bg-orange-600",
        buttonHoverColor: "hover:bg-orange-700",
        href: `/admin/estimate/${job.id}`,
        priority: "high" as const,
      };
    case "作業待ち":
      return {
        label: "作業を開始",
        icon: Wrench,
        iconColor: "text-white",
        buttonBgColor: "bg-emerald-600",
        buttonHoverColor: "hover:bg-emerald-700",
        href: `/mechanic/work/${job.id}`,
        priority: "high" as const,
      };
    case "出庫待ち":
      return {
        label: "引渡しを開始",
        icon: Car,
        iconColor: "text-white",
        buttonBgColor: "bg-violet-600",
        buttonHoverColor: "hover:bg-violet-700",
        href: `/presentation/${job.id}`,
        priority: "medium" as const,
      };
    case "見積提示済み":
      return {
        label: null,
        icon: null,
        iconColor: null,
        buttonBgColor: null,
        buttonHoverColor: null,
        href: null,
        priority: "none" as const,
      };
    case "出庫済み":
      return {
        label: null,
        icon: null,
        iconColor: null,
        buttonBgColor: null,
        buttonHoverColor: null,
        href: null,
        priority: "none" as const,
      };
    default:
      return null;
  }
}

// =============================================================================
// Props
// =============================================================================

interface JobCardProps {
  job: ZohoJob;
  onCheckIn: (job: ZohoJob) => void;
  isCheckingIn?: boolean;
  courtesyCars?: CourtesyCar[];
}

// =============================================================================
// Component
// =============================================================================

export function JobCard({ job, onCheckIn, isCheckingIn = false, courtesyCars = [] }: JobCardProps) {
  const customerName = job.field4?.name ?? "未登録";
  const vehicleInfo = job.field6?.name ?? "車両未登録";
  const customerId = job.field4?.id;
  const vehicleId = job.field6?.id;
  
  // 入庫日時の表示ロジック
  const isCheckedIn = job.field5 !== "入庫待ち";
  const arrivalDateTime = isCheckedIn && job.field22 ? formatDateTime(job.field22) : { date: "--/--", time: "00:00" };
  const arrivalLabel = isCheckedIn ? "入庫日時" : "入庫予定";
  
  const hasPreInput = !!job.field7;
  const hasWorkOrder = !!job.field;
  
  // 代車情報を取得
  const courtesyCar = courtesyCars.find(car => car.jobId === job.id);
  
  // 顧客情報を取得
  const { data: customerData } = useSWR(
    customerId ? `customer-${customerId}` : null,
    async () => {
      if (!customerId) return null;
      const result = await fetchCustomerById(customerId);
      return result.success ? result.data : null;
    }
  );
  
  // 車両情報を取得（ナンバープレート表示用）
  const { data: vehicleData } = useSWR(
    vehicleId ? `vehicle-${vehicleId}` : null,
    async () => {
      if (!vehicleId) return null;
      const result = await fetchVehicleById(vehicleId);
      return result.success ? result.data : null;
    }
  );
  
  // 変更申請があるかチェック
  const hasChangeRequest = customerData ? hasChangeRequests(customerData.Description) : false;
  
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
  
  // 変更対応完了処理中フラグ
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);
  
  // 作業指示ダイアログの状態
  const [isWorkOrderDialogOpen, setIsWorkOrderDialogOpen] = useState(false);
  
  // 車両詳細ダイアログの状態
  const [isVehicleDetailDialogOpen, setIsVehicleDetailDialogOpen] = useState(false);
  
  // 顧客詳細ダイアログの状態
  const [isCustomerDetailDialogOpen, setIsCustomerDetailDialogOpen] = useState(false);
  
  // 詳細情報の折りたたみ状態
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  
  const handleCheckIn = () => {
    onCheckIn(job);
  };

  const handleOpenWorkOrderDialog = () => {
    setIsWorkOrderDialogOpen(true);
  };

  const handleWorkOrderSuccess = () => {
    window.location.reload();
  };

  /**
   * 変更対応完了処理
   */
  const handleMarkChangeRequestCompleted = async () => {
    if (!customerId || !customerData) return;

    setIsMarkingCompleted(true);
    triggerHapticFeedback("medium");

    try {
      const result = await markChangeRequestCompleted(customerId);
      if (result.success) {
        triggerHapticFeedback("success");
        toast.success("変更申請を対応完了としてマークしました");
        window.location.reload();
      } else {
        triggerHapticFeedback("error");
        toast.error("対応完了処理に失敗しました", {
          description: result.error?.message,
        });
      }
    } catch (error) {
      console.error("変更対応完了エラー:", error);
      triggerHapticFeedback("error");
      toast.error("対応完了処理に失敗しました");
    } finally {
      setIsMarkingCompleted(false);
    }
  };

  // アクション設定を取得
  const actionConfig = getActionConfig(job, handleCheckIn);
  
  // 承認済み作業内容があるかチェック
  const hasApprovedWorkItems = job.field13 && (job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "作業中" || job.field5 === "出庫待ち" || job.field5 === "出庫済み");
  
  // 詳細情報があるかチェック
  const hasDetails = hasPreInput || hasWorkOrder || hasChangeRequest || hasApprovedWorkItems;

  // 入庫区分アイコンを取得
  const getServiceKindIcon = () => {
    switch (job.serviceKind) {
      case "車検":
        return <ShieldCheck className="h-3.5 w-3.5 text-cyan-600" />;
      case "12ヵ月点検":
        return <CalendarCheck className="h-3.5 w-3.5 text-cyan-600" />;
      case "修理・整備":
        return <Wrench className="h-3.5 w-3.5 text-orange-600" />;
      case "故障診断":
        return <Activity className="h-3.5 w-3.5 text-rose-600" />;
      case "エンジンオイル交換":
        return <Droplet className="h-3.5 w-3.5 text-emerald-600" />;
      case "タイヤ交換・ローテーション":
        return <Circle className="h-3.5 w-3.5 text-emerald-600" />;
      case "その他のメンテナンス":
        return <Wrench className="h-3.5 w-3.5 text-emerald-600" />;
      case "レストア":
        return <Sparkles className="h-3.5 w-3.5 text-violet-600" />;
      case "チューニング":
      case "チューニング・パーツ取付":
        return <Zap className="h-3.5 w-3.5 text-violet-600" />;
      case "パーツ取付":
        return <Package className="h-3.5 w-3.5 text-violet-600" />;
      case "コーティング":
        return <Shield className="h-3.5 w-3.5 text-violet-600" />;
      case "板金・塗装":
        return <Paintbrush className="h-3.5 w-3.5 text-orange-600" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-600" />;
    }
  };

  return (
    <Card 
      className="transition-all shadow-md hover:shadow-lg border-slate-200"
      role="article"
      aria-label={`案件: ${customerName} - ${vehicleInfo}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* 左側: 第1階層（最重要情報） */}
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <User className="h-5 w-5 text-slate-500 shrink-0" />
              <button
                onClick={() => {
                  if (customerId) {
                    triggerHapticFeedback("light");
                    setIsCustomerDetailDialogOpen(true);
                  }
                }}
                className={cn(
                  "truncate text-left",
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
                  <Star className={cn("h-5 w-5 transition-all shrink-0", isImportant && "fill-current")} />
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
                  <Folder className="h-5 w-5 shrink-0" />
                </a>
              )}
              
              {/* ステータスバッジ（色分け） */}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap",
                  getStatusBadgeStyle(job.field5)
                )}
              >
                {job.field5}
              </Badge>
            </CardTitle>

            {/* 2行目: 車両とナンバー */}
            <div className="mt-2">
              <button
                onClick={() => {
                  triggerHapticFeedback("light");
                  setIsVehicleDetailDialogOpen(true);
                }}
                className="flex items-center gap-2 text-base font-medium text-slate-900 min-w-0 hover:text-blue-600 transition-colors text-left w-full"
                title="車両詳細を表示"
                aria-label={`車両詳細を表示: ${vehicleInfo}`}
              >
                <Car className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="break-words min-w-0">{vehicleInfo}</span>
              </button>
            </div>

            {/* 3行目: 入庫区分バッジ＋時間（時間を目立たせる） */}
            <div className="mt-2 flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* 入庫区分 */}
              {job.serviceKind && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                  {getServiceKindIcon()}
                  <span className="whitespace-nowrap">{job.serviceKind}</span>
                </Badge>
              )}

              {/* 入庫日時 */}
              <div className="flex items-center gap-1.5 text-sm text-slate-700 shrink-0">
                <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="whitespace-nowrap">
                  {arrivalDateTime.date} {arrivalDateTime.time} {arrivalLabel === "入庫予定" ? "入庫予定" : "入庫"}
                </span>
              </div>
            </div>

            {/* 4行目: タグ、代車、整備士 */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* タグ */}
              {job.tagId && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600 shrink-0">
                  <Tag className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="whitespace-nowrap">タグ {job.tagId}</span>
                </div>
              )}
              
              {/* 代車 */}
              {courtesyCar && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600 shrink-0">
                  <CarFront className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="whitespace-nowrap">代車 {courtesyCar.name}</span>
                </div>
              )}
              
              {/* 担当整備士 */}
              {job.assignedMechanic && (
                <div className="flex items-center gap-1.5 text-sm text-slate-600 shrink-0">
                  <Wrench className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span className="whitespace-nowrap">{job.assignedMechanic}</span>
                </div>
              )}
            </div>
          </div>

          {/* 右側: プライマリアクション（PC表示） */}
          <div className="hidden sm:block">
            {actionConfig && actionConfig.priority !== "none" && (
              <>
                {actionConfig.priority === "high" ? (
                  // プライマリアクション（大きく、ステージ別の色）
                  actionConfig.href ? (
                    <Button 
                      asChild 
                      className={cn("text-white h-12", actionConfig.buttonBgColor, actionConfig.buttonHoverColor)}
                    >
                      <Link 
                        href={actionConfig.href}
                        prefetch={true}
                        onClick={() => {
                          document.body.setAttribute("data-navigating", "true");
                        }}
                        className="flex items-center gap-2"
                      >
                        <actionConfig.icon className={cn("h-5 w-5", actionConfig.iconColor)} />
                        {actionConfig.label}
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      onClick={actionConfig.onClick}
                      disabled={isCheckingIn}
                      className={cn("text-white h-12", actionConfig.buttonBgColor, actionConfig.buttonHoverColor)}
                    >
                      {isCheckingIn ? (
                        "処理中..."
                      ) : (
                        <>
                          <actionConfig.icon className={cn("h-5 w-5", actionConfig.iconColor)} />
                          {actionConfig.label}
                        </>
                      )}
                    </Button>
                  )
                ) : actionConfig.priority === "medium" ? (
                  // セカンダリアクション（標準、ステージ別の色）
                  actionConfig.href ? (
                    <Button 
                      asChild 
                      className={cn("text-white h-10", actionConfig.buttonBgColor, actionConfig.buttonHoverColor)}
                    >
                      <Link 
                        href={actionConfig.href}
                        prefetch={false}
                        className="flex items-center gap-2"
                      >
                        <actionConfig.icon className={cn("h-4 w-4", actionConfig.iconColor)} />
                        {actionConfig.label}
                      </Link>
                    </Button>
                  ) : null
                ) : null}
              </>
            )}
            
            {/* 見積提示済み・出庫済みの場合はバッジ表示 */}
            {job.field5 === "見積提示済み" && (
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 py-1.5 px-3">
                  ⏳ お客様承認待ち
                </Badge>
                <Link 
                  href={`/customer/approval/${job.id}`} 
                  className="text-xs text-muted-foreground underline hover:text-primary"
                >
                  (Debug: お客様画面へ)
                </Link>
              </div>
            )}
            
            {job.field5 === "出庫済み" && (
              <div className="flex flex-col items-end gap-1">
                <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                  ✅ 完了
                </Badge>
                <Link 
                  href={`/customer/report/${job.id}`} 
                  className="text-xs text-muted-foreground underline hover:text-primary"
                >
                  (整備手帳を見る)
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 第3階層: 詳細情報（折りたたみ可能） */}
        {hasDetails && (
          <div className="mt-3">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
              <button
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                aria-label={isDetailsExpanded ? "詳細情報を折りたたむ" : "詳細情報を展開する"}
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", isDetailsExpanded && "rotate-180")} />
              </button>
              
              {/* 詳細情報バッジ（アイコン＋コメント形式、最大3つ、クリック可能） */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {hasPreInput && (
                  <button
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                    title="お客様入力情報"
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">お客様入力情報</span>
                  </button>
                )}
                {hasWorkOrder && (
                  <button
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
                    title="作業指示"
                  >
                    <Clipboard className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">作業指示</span>
                  </button>
                )}
                {hasChangeRequest && (
                  <button
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
                    title="変更申請あり"
                  >
                    <Bell className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">変更申請あり</span>
                  </button>
                )}
                {hasApprovedWorkItems && (
                  <button
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                    title="承認済み作業内容"
                  >
                    <Wrench className="h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">承認済み作業内容</span>
                  </button>
                )}
              </div>
            </div>
            
            {isDetailsExpanded && (
              <div className="space-y-3 mt-3">
                {/* お客様入力情報 */}
                {hasPreInput && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="font-medium text-blue-700">お客様入力情報</p>
                    </div>
                    <p className="text-blue-700 whitespace-pre-wrap">{job.field7}</p>
                  </div>
                )}
                
                {/* 作業指示 */}
                {hasWorkOrder && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center">
                          <Clipboard className="h-3.5 w-3.5 text-white" />
                        </div>
                        <p className="font-medium text-amber-900">作業指示</p>
                      </div>
                      <button
                        onClick={handleOpenWorkOrderDialog}
                        className="text-xs text-amber-600 hover:text-amber-800 underline flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        編集する
                      </button>
                    </div>
                    <p className="text-amber-800 whitespace-pre-wrap">{job.field}</p>
                  </div>
                )}
                
                {/* 変更申請 */}
                {hasChangeRequest && customerId && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center shrink-0">
                          <Bell className="h-3.5 w-3.5 text-white" />
                        </div>
                        <p className="font-medium text-amber-700">変更申請あり</p>
                      </div>
                      <Button
                        onClick={handleMarkChangeRequestCompleted}
                        disabled={isMarkingCompleted}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
                      >
                        {isMarkingCompleted ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            処理中...
                          </>
                        ) : (
                          "対応完了"
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                      顧客情報の変更申請があります。対応完了後、基幹システムを更新してください。
                    </p>
                  </div>
                )}
                
                {/* 作業内容（承認済み見積明細） */}
                {job.field13 && (job.field5 === "見積提示済み" || job.field5 === "作業待ち" || job.field5 === "作業中" || job.field5 === "出庫待ち" || job.field5 === "出庫済み") && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Wrench className="h-3.5 w-3.5 text-white" />
                      </div>
                      <p className="font-medium text-blue-900">承認済み作業内容</p>
                    </div>
                    <p className="text-blue-800 whitespace-pre-wrap">{job.field13}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 作業指示を追加する（作業指示がない場合のみ表示） */}
        {!hasWorkOrder && (
          <div className="flex justify-end mt-3">
            <button
              onClick={handleOpenWorkOrderDialog}
              className="text-xs text-slate-500 hover:text-slate-700 underline flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              作業指示を追加する
            </button>
          </div>
        )}
        
        {/* モバイル用アクションボタン */}
        <div className="sm:hidden mt-4">
          {actionConfig && actionConfig.priority !== "none" && (
            <>
              {actionConfig.priority === "high" ? (
                actionConfig.href ? (
                  <Button 
                    asChild 
                    className={cn("text-white h-12 w-full", actionConfig.buttonBgColor, actionConfig.buttonHoverColor)}
                  >
                    <Link 
                      href={actionConfig.href}
                      prefetch={true}
                      onClick={() => {
                        document.body.setAttribute("data-navigating", "true");
                      }}
                      className="flex items-center justify-center gap-2"
                    >
                      <actionConfig.icon className={cn("h-5 w-5", actionConfig.iconColor)} />
                      {actionConfig.label}
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    onClick={actionConfig.onClick}
                    disabled={isCheckingIn}
                    className={cn("text-white h-12 w-full", actionConfig.buttonBgColor, actionConfig.buttonHoverColor)}
                  >
                    {isCheckingIn ? (
                      "処理中..."
                    ) : (
                      <>
                        <actionConfig.icon className={cn("h-5 w-5", actionConfig.iconColor)} />
                        {actionConfig.label}
                      </>
                    )}
                  </Button>
                )
              ) : actionConfig.priority === "medium" ? (
                actionConfig.href ? (
                  <Button 
                    asChild 
                    className={cn("text-white h-10 w-full", actionConfig.buttonBgColor, actionConfig.buttonHoverColor)}
                  >
                    <Link 
                      href={actionConfig.href}
                      prefetch={false}
                      className="flex items-center justify-center gap-2"
                    >
                      <actionConfig.icon className={cn("h-4 w-4", actionConfig.iconColor)} />
                      {actionConfig.label}
                    </Link>
                  </Button>
                ) : null
              ) : null}
            </>
          )}
          
          {/* 見積提示済み・出庫済みの場合はバッジ表示 */}
          {job.field5 === "見積提示済み" && (
            <div className="flex flex-col items-center gap-1">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 py-1.5 px-3 flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                お客様承認待ち
              </Badge>
              <Link 
                href={`/customer/approval/${job.id}`} 
                className="text-xs text-muted-foreground underline hover:text-primary"
              >
                (Debug: お客様画面へ)
              </Link>
            </div>
          )}
          
          {job.field5 === "出庫済み" && (
            <div className="flex flex-col items-center gap-1">
              <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                ✅ 完了
              </Badge>
              <Link 
                href={`/customer/report/${job.id}`} 
                className="text-xs text-muted-foreground underline hover:text-primary"
              >
                (整備手帳を見る)
              </Link>
            </div>
          )}
        </div>
      </CardContent>

      <WorkOrderDialog
        open={isWorkOrderDialogOpen}
        onOpenChange={setIsWorkOrderDialogOpen}
        job={job}
        onSuccess={handleWorkOrderSuccess}
      />

      {/* 車両詳細ダイアログ */}
      <VehicleDetailDialog
        open={isVehicleDetailDialogOpen}
        onOpenChange={setIsVehicleDetailDialogOpen}
        vehicleId={vehicleId || null}
        vehicleName={vehicleInfo}
        courtesyCars={courtesyCars}
        reportedMileage={job.field10 || null}
      />

      {/* 顧客詳細ダイアログ */}
      <CustomerDetailDialog
        open={isCustomerDetailDialogOpen}
        onOpenChange={setIsCustomerDetailDialogOpen}
        customerId={customerId || null}
        customerName={customerName}
      />
    </Card>
  );
}
