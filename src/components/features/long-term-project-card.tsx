"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ZohoJob, ServiceKind, ZohoCustomer, CourtesyCar } from "@/types";
import {
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Truck,
  Sparkles,
  Paintbrush,
  ArrowRight,
  User,
  Car,
  Gauge,
  Tag,
  CarFront,
  Wrench,
  Star,
  Folder,
  Phone,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { fetchCustomerById } from "@/lib/api";
import { isImportantCustomer, toggleImportantCustomer } from "@/lib/important-customer-flag";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { toast } from "sonner";

// =============================================================================
// 型定義
// =============================================================================

export interface LongTermProjectData {
  /** ジョブID */
  jobId: string;
  /** 顧客名 */
  customerName: string;
  /** 車両名 */
  vehicleName: string;
  /** ナンバープレート */
  licensePlate?: string;
  /** 入庫区分 */
  serviceKind: ServiceKind;
  /** 進捗率（0-100%） */
  progress: number;
  /** 遅延フラグ */
  isDelayed: boolean;
  /** 開始日 */
  startDate?: string;
  /** 予定完了日 */
  expectedCompletionDate?: string;
  /** 現在のフェーズ/ステータス */
  currentPhase?: string;
  /** ジョブデータ */
  job: ZohoJob;
}

// =============================================================================
// Props
// =============================================================================

interface LongTermProjectCardProps {
  /** プロジェクトデータ */
  project: LongTermProjectData;
  /** クリックハンドラ */
  onClick?: () => void;
  /** 代車情報 */
  courtesyCars?: CourtesyCar[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * サービス種類に応じたアイコンを取得
 */
function getServiceIcon(serviceKind: ServiceKind) {
  switch (serviceKind) {
    case "レストア":
      return <Sparkles className="h-5 w-5" />;
    default:
      return <TrendingUp className="h-5 w-5" />;
  }
}

/**
 * サービス種類に応じた色を取得
 */
function getServiceColor(serviceKind: ServiceKind): string {
  switch (serviceKind) {
    case "レストア":
      return "text-purple-600";
    default:
      return "text-slate-600";
  }
}

/**
 * 進捗率に応じたバッジの色を取得
 */
function getProgressBadgeVariant(progress: number, isDelayed: boolean): "default" | "secondary" | "destructive" | "outline" {
  if (isDelayed) return "destructive";
  if (progress === 100) return "default";
  if (progress >= 50) return "secondary";
  return "outline";
}

/**
 * ISO8601の日時文字列から時刻を抽出 (HH:MM形式)
 */
function formatTime(isoString: string): string {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

/**
 * ステータスバッジのスタイルを取得
 */
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case "入庫待ち":
      return "bg-slate-100 text-slate-700 border-slate-300";
    case "入庫済み":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "見積作成待ち":
      return "bg-orange-100 text-orange-700 border-orange-300";
    case "見積提示済み":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "作業待ち":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "作業中":
      return "bg-cyan-100 text-cyan-700 border-cyan-300";
    case "出庫待ち":
      return "bg-violet-100 text-violet-700 border-violet-300";
    case "出庫済み":
      return "bg-gray-100 text-gray-500 border-gray-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

// =============================================================================
// Component
// =============================================================================

export function LongTermProjectCard({ project, onClick, courtesyCars = [] }: LongTermProjectCardProps) {
  const {
    jobId,
    customerName,
    vehicleName,
    licensePlate,
    serviceKind,
    progress,
    isDelayed,
    startDate,
    expectedCompletionDate,
    currentPhase,
    job,
  } = project;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const serviceIcon = getServiceIcon(serviceKind);
  const serviceColor = getServiceColor(serviceKind);

  // 顧客IDと車両IDを取得
  const customerId = job.field4?.id;
  const vehicleId = job.field6?.id;

  // 入庫日時の表示ロジック
  const isCheckedIn = job.field5 !== "入庫待ち";
  const arrivalTime = isCheckedIn && job.field22 ? formatTime(job.field22) : "00:00";
  const arrivalLabel = isCheckedIn ? "入庫日時" : "入庫予定";

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

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // ページ遷移開始時にbodyにdata属性を設定
      document.body.setAttribute("data-navigating", "true");
      startTransition(() => {
        router.push(`/mechanic/work/${jobId}`);
      });
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        isDelayed && "border-red-300 bg-red-50/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* 左側: 第1階層（最重要情報） */}
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <User className="h-5 w-5 text-slate-500 shrink-0" />
              <span className="truncate">{customerName}</span>
              
              {/* 重要な顧客フラグ（Starアイコン） */}
              {customerId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleImportant();
                  }}
                  className={cn(
                    "shrink-0 transition-all",
                    isImportant 
                      ? "text-yellow-500 hover:text-yellow-600" 
                      : "text-slate-300 hover:text-yellow-400"
                  )}
                  aria-label={isImportant ? "重要な顧客マークを解除" : "重要な顧客としてマーク"}
                  title={isImportant ? "重要な顧客" : "重要な顧客としてマーク"}
                >
                  <Star className={cn("h-5 w-5 transition-all", isImportant && "fill-current")} />
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
                  <Folder className="h-5 w-5" />
                </a>
              )}
              
              {/* ステータスバッジ（色分け） */}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-medium px-2.5 py-0.5 rounded-full",
                  getStatusBadgeStyle(job.field5)
                )}
              >
                {job.field5}
              </Badge>
            </CardTitle>

            {/* 第2階層（重要情報）: 車両情報、入庫区分、時間、タグ */}
            <div className="mt-2 space-y-1.5">
              {/* 車両情報 */}
              <div className="flex items-center gap-2 text-base font-medium text-slate-900 min-w-0">
                <Car className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="truncate min-w-0">{vehicleName}{licensePlate && ` / ${licensePlate}`}</span>
              </div>
              
              {/* 走行距離（表示可能な場合） */}
              {job.field10 && (
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <Gauge className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>走行距離: {job.field10.toLocaleString()}km</span>
                </div>
              )}

              {/* 入庫区分、時間、タグ（横並び） */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* 入庫区分 */}
                {serviceKind && (
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                    <span className={cn(serviceColor)}>{serviceIcon}</span>
                    <span className="whitespace-nowrap">{serviceKind}</span>
                  </Badge>
                )}

                {/* 時間 */}
                <div className="flex items-center gap-1.5 text-sm text-slate-700 shrink-0">
                  <Clock className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="whitespace-nowrap">{arrivalTime} {arrivalLabel === "入庫予定" ? "入庫予定" : "入庫"}</span>
                </div>

                {/* タグ */}
                {job.tagId && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 shrink-0">
                    <Tag className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="whitespace-nowrap">タグ {job.tagId}</span>
                  </div>
                )}
              </div>
              
              {/* 代車・担当整備士 */}
              {(courtesyCar || job.assignedMechanic) && (
                <div className="flex flex-wrap items-center gap-2">
                  {courtesyCar && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <CarFront className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>代車 {courtesyCar.name}</span>
                    </div>
                  )}
                  {job.assignedMechanic && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Wrench className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{job.assignedMechanic}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* 顧客の連絡先情報（携帯電話とメールアドレス） */}
               {customerData && customerData.Mobile && (
                <div className="flex flex-wrap items-center gap-2">
                  {customerData.Mobile && (
                    <a
                      href={`tel:${customerData.Mobile.replace(/[^\d+]/g, "")}`}
                      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHapticFeedback("light");
                      }}
                    >
                      <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{customerData.Mobile}</span>
                    </a>
                  )}
                  {/* メールアドレス - TODO: ZohoCustomer型にemailプロパティが追加されたら実装 */}
                </div>
              )}
            </div>
          </div>

          {/* 右側: 進捗率バッジ */}
          <Badge variant={getProgressBadgeVariant(progress, isDelayed)} className="shrink-0">
            {progress}%
            {isDelayed && (
              <AlertTriangle className="h-3 w-3 ml-1" />
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 進捗バー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>進捗</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 現在のフェーズ/ステータス */}
        {currentPhase && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>{currentPhase}</span>
          </div>
        )}

        {/* 日付情報 */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {startDate && (
            <div>
              <span className="text-slate-500">開始日</span>
              <p className="text-slate-900 font-medium mt-0.5">
                {new Date(startDate).toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
          {expectedCompletionDate && (
            <div>
              <span className="text-slate-500">予定完了日</span>
              <p
                className={cn(
                  "font-medium mt-0.5",
                  isDelayed ? "text-red-600" : "text-slate-900"
                )}
              >
                {new Date(expectedCompletionDate).toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={handleClick}
          disabled={isPending}
        >
          詳細を確認
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}









