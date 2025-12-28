"use client";

import React from "react";
import { ZohoJob } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Car, User, Wrench, Clock, Tag, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateProgressFromStatus, getServiceKindIcon, estimateCompletionTime } from "@/lib/kanban-utils";
import { useRouter } from "next/navigation";
import { ManufacturerIcon } from "@/components/features/manufacturer-icon";
import useSWR from "swr";
import { fetchVehicleById } from "@/lib/api";

interface KanbanCardProps {
  job: ZohoJob;
  isDragging?: boolean;
}

/**
 * ステータスバッジのスタイルを取得（JOBカードと同じロジック）
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
      return "bg-slate-50 text-slate-700 border-slate-300";
    case "部品調達待ち":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "部品発注待ち":
      return "bg-orange-50 text-orange-700 border-orange-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

/**
 * 日時をフォーマット（MM/DD HH:MM形式）
 */
function formatDateTime(isoString: string | null | undefined): { date: string; time: string } {
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
 * サービス種類アイコンを取得（JOBカードと同じロジック）
 */
function getServiceKindIconComponent(serviceKind: string | null | undefined) {
  if (!serviceKind) return null;
  
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    車検: Car,
    "12ヵ月点検": Car,
    "修理・整備": Wrench,
    レストア: Car,
    チューニング: Car,
    コーティング: Car,
    "エンジンオイル交換": Car,
    "タイヤ交換・ローテーション": Car,
  };

  const IconComponent = iconMap[serviceKind];
  if (!IconComponent) return null;

  return <IconComponent className="h-4 w-4 text-slate-700" />;
}

/**
 * カンバンボード用車両カードコンポーネント
 * JOBカードのデザインを参考に、カンバンボード用に最適化
 */
export function KanbanCard({ job, isDragging = false }: KanbanCardProps) {
  const router = useRouter();

  // 車両情報
  const vehicleInfo = job.field6?.name ?? "車両未登録";
  const vehicleId = job.field6?.id;

  // 車両データを取得（ナンバープレート表示用）
  const { data: vehicleData } = useSWR(
    vehicleId ? `vehicle-${vehicleId}` : null,
    async () => {
      if (!vehicleId) return null;
      const result = await fetchVehicleById(vehicleId);
      return result.success ? result.data : null;
    }
  );

  const licensePlate = vehicleData?.field44 || vehicleData?.licensePlate || undefined;

  // 顧客名
  const customerName = job.field4?.name ?? "未登録";

  // 担当技術者
  const mechanicName = job.assignedMechanic || "未割り当て";

  // 作業内容
  const serviceKind = job.serviceKind;
  const serviceIcon = getServiceKindIcon(serviceKind);

  // ステータス
  const status = job.field5 || "不明";

  // 進捗率
  const progress = calculateProgressFromStatus(job.field5);

  // 入庫日時
  const arrivalDateTime = job.field22 ? formatDateTime(job.field22) : { date: "--/--", time: "--:--" };

  // 予定完了時刻
  const estimatedCompletion = estimateCompletionTime(job);
  const completionTimeStr = estimatedCompletion
    ? `${estimatedCompletion.getHours().toString().padStart(2, "0")}:${estimatedCompletion.getMinutes().toString().padStart(2, "0")}`
    : null;

  // カードクリックでジョブ詳細へ遷移
  const handleClick = () => {
    router.push(`/mechanic/work/${job.id}`);
  };

  return (
    <Card
      className={cn(
        "border border-slate-300 rounded-xl shadow-md cursor-pointer transition-all hover:shadow-lg bg-white",
        isDragging && "opacity-50"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* ヘッダー行: 顧客名 + ステータスバッジ */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <User className="h-5 w-5 text-slate-600 shrink-0" />
            <div className="text-base font-semibold text-slate-900 truncate">
              {customerName}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-base font-medium px-2.5 py-1 rounded-full shrink-0",
              getStatusBadgeStyle(status)
            )}
          >
            {status}
          </Badge>
        </div>

        {/* 車両情報行（ManufacturerIcon使用） */}
        <div className="flex items-center gap-2 min-w-0">
          <ManufacturerIcon vehicleName={vehicleInfo} className="h-5 w-5" fallbackClassName="h-5 w-5" />
          <div className="flex-1 min-w-0">
            <div className="text-base font-medium text-slate-900 truncate">
              {vehicleInfo}
            </div>
            {licensePlate && (
              <div className="text-base text-slate-600 mt-0.5">
                {licensePlate}
              </div>
            )}
          </div>
        </div>

        {/* 情報行（横並び、折り返し可能） */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* サービス種類バッジ */}
          {serviceKind && (
            <Badge
              variant="outline"
              className="bg-slate-100 text-slate-800 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
            >
              <span>{serviceIcon}</span>
              <span>{serviceKind}</span>
            </Badge>
          )}

          {/* 入庫日時 */}
          <div className="flex items-center gap-1.5 text-base text-slate-700">
            <Clock className="h-4 w-4 text-slate-500 shrink-0" />
            <span>{arrivalDateTime.date} {arrivalDateTime.time}</span>
          </div>

          {/* タグ */}
          {job.tagId && (
            <div className="flex items-center gap-1.5 text-base text-slate-700">
              <Tag className="h-4 w-4 text-slate-500 shrink-0" />
              <span>{job.tagId}</span>
            </div>
          )}

          {/* 担当整備士 */}
          <div className="flex items-center gap-1.5 text-base text-slate-700">
            <UserCog className="h-4 w-4 text-slate-500 shrink-0" />
            <span className={cn(mechanicName === "未割り当て" && "text-slate-500")}>
              {mechanicName}
            </span>
          </div>
        </div>

        {/* 予定完了時刻 */}
        {completionTimeStr && (
          <div className="flex items-center gap-2 text-base text-slate-700">
            <Clock className="h-4 w-4 text-slate-500 shrink-0" />
            <span>予定完了: {completionTimeStr}</span>
          </div>
        )}

        {/* ステータスバー */}
        <div className="space-y-1 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-base">
            <span className="text-slate-600">進捗</span>
            <span className="text-slate-700 font-medium tabular-nums">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2"
            indicatorClassName={
              progress >= 90
                ? "bg-green-500"
                : progress >= 50
                ? "bg-amber-500"
                : "bg-blue-500"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}


