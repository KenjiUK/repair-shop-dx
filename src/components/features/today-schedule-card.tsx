"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZohoJob } from "@/types";
import { cn } from "@/lib/utils";
import { Calendar, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface TodayScheduleCardProps {
  jobs: ZohoJob[];
  onJobClick?: (jobId: string) => void;
}

/**
 * 本日入出庫予定カード
 */
export function TodayScheduleCard({
  jobs,
  onJobClick,
}: TodayScheduleCardProps) {
  // 展開状態を管理（デフォルトは折りたたみ）
  const [isExpanded, setIsExpanded] = useState(false);
  
  // デフォルト表示件数
  const DEFAULT_DISPLAY_COUNT = 3;
  // 本日の入庫予定を抽出
  const todayArrivals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return jobs
      .filter((job) => {
        if (!job.field22) return false;
        const arrivalDate = new Date(job.field22);
        arrivalDate.setHours(0, 0, 0, 0);
        
        // 本日のデータで、かつ未入庫のもの
        return (
          arrivalDate.getTime() === today.getTime() &&
          job.field5 !== "入庫済み" &&
          job.field5 !== "出庫済み"
        );
      })
      .map((job) => {
        const arrivalDate = job.field22 ? new Date(job.field22) : null;
        return {
          job,
          scheduledTime: arrivalDate,
          isDelayed: arrivalDate ? arrivalDate.getTime() < Date.now() : false,
        };
      })
      .sort((a, b) => {
        if (!a.scheduledTime || !b.scheduledTime) return 0;
        return a.scheduledTime.getTime() - b.scheduledTime.getTime();
      });
  }, [jobs]);

  // 本日の出庫予定を抽出（作業完了見込み）
  const todayDepartures = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return jobs
      .filter((job) => {
        // 入庫済みで、出庫済みでないもの
        if (job.field5 === "出庫済み") return false;
        if (job.field5 === "入庫待ち") return false;
        
        // 入庫日時から推定（設定値から取得）
        if (!job.field22) return false;
        const arrivalDate = new Date(job.field22);
        const estimatedDeparture = new Date(arrivalDate);
        
        // 設定値から出庫予定時間の推定値を取得
        let estimatedHours = 4; // デフォルト: 4時間
        try {
          const { getNumericalMasterConfig } = require("@/lib/numerical-master-config");
          const config = getNumericalMasterConfig();
          estimatedHours = config.timeSettings.estimatedDepartureHours;
        } catch {
          // フォールバック: デフォルト値を使用
        }
        
        estimatedDeparture.setHours(estimatedDeparture.getHours() + estimatedHours);
        
        const estimatedDepartureDate = new Date(estimatedDeparture);
        estimatedDepartureDate.setHours(0, 0, 0, 0);
        
        return estimatedDepartureDate.getTime() === today.getTime();
      })
      .map((job) => {
        const arrivalDate = job.field22 ? new Date(job.field22) : null;
        
        // 設定値から出庫予定時間の推定値を取得
        let estimatedHours = 4; // デフォルト: 4時間
        try {
          const { getNumericalMasterConfig } = require("@/lib/numerical-master-config");
          const config = getNumericalMasterConfig();
          estimatedHours = config.timeSettings.estimatedDepartureHours;
        } catch {
          // フォールバック: デフォルト値を使用
        }
        
        const estimatedDeparture = arrivalDate
          ? new Date(arrivalDate.getTime() + estimatedHours * 60 * 60 * 1000)
          : null;
        return {
          job,
          scheduledTime: estimatedDeparture,
          isDelayed: estimatedDeparture ? estimatedDeparture.getTime() < Date.now() : false,
        };
      })
      .sort((a, b) => {
        if (!a.scheduledTime || !b.scheduledTime) return 0;
        return a.scheduledTime.getTime() - b.scheduledTime.getTime();
      });
  }, [jobs]);

  // 統合されたスケジュールリスト（入庫と出庫を時系列で並べる）
  const allSchedules = useMemo(() => {
    const schedules = [
      ...todayArrivals.map((item) => ({ ...item, type: "inbound" as const })),
      ...todayDepartures.map((item) => ({ ...item, type: "outbound" as const })),
    ];
    
    return schedules.sort((a, b) => {
      if (!a.scheduledTime || !b.scheduledTime) return 0;
      return a.scheduledTime.getTime() - b.scheduledTime.getTime();
    });
  }, [todayArrivals, todayDepartures]);

  const totalCount = allSchedules.length;
  
  // 表示するスケジュール（デフォルトは最初の3件、展開時は全て）
  const displayedSchedules = isExpanded 
    ? allSchedules 
    : allSchedules.slice(0, DEFAULT_DISPLAY_COUNT);
  
  // 残りの件数
  const remainingCount = totalCount - displayedSchedules.length;

  // 時刻をフォーマット（HH:mm）
  const formatTime = (date: Date | null): string => {
    if (!date) return "";
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // 顧客名を取得
  const getCustomerName = (job: ZohoJob): string => {
    if (job.field4?.name) {
      return job.field4.name;
    }
    if (job.field4?.id) {
      return "顧客情報なし";
    }
    return "未設定";
  };

  // 車両名を取得
  const getVehicleName = (job: ZohoJob): string => {
    if (job.field6?.name) {
      return job.field6.name;
    }
    return "車両情報なし";
  };

  return (
    <div
      className="h-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:shadow-lg hover:border-slate-300"
      role="region"
      aria-label="本日入出庫予定"
    >
      <div className="p-4 lg:p-5 pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-700 shrink-0" />
            <h3 className="text-lg font-semibold text-slate-900">本日入出庫予定</h3>
          </div>
          {totalCount > 0 && (
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full">
              {totalCount}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col p-4 lg:p-5 pt-4">
        {totalCount === 0 ? (
          <p className="text-base text-slate-700 text-center py-4">
            本日の入出庫予定はありません
          </p>
        ) : (
          <>
            <div className="space-y-2.5 flex-1">
              {displayedSchedules.map(({ job, scheduledTime, isDelayed, type }) => {
              const isInbound = type === "inbound";
              const isCompleted = isInbound ? job.field5 === "入庫済み" : job.field5 === "出庫済み";
              
              return (
                <div
                  key={`${type}-${job.id}`}
                  className={cn(
                    "p-3 lg:p-4 rounded-lg border transition-all duration-200",
                    onJobClick && "cursor-pointer hover:bg-slate-50 hover:border-slate-400 hover:shadow-md",
                    // 通常時: ニュートラルな色
                    !isDelayed && "bg-slate-50 border-slate-200",
                    // 遅延時: 警告色（入庫=赤、出庫=amber）
                    isDelayed && (isInbound ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-300")
                  )}
                  onClick={() => {
                    if (onJobClick) {
                      onJobClick(job.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={cn(
                            "text-base font-semibold tabular-nums",
                            isDelayed 
                              ? (isInbound ? "text-red-700" : "text-amber-700")
                              : "text-slate-900"
                          )}>
                            {formatTime(scheduledTime)}
                          </span>
                          {isDelayed && (
                            <AlertCircle className={cn("h-4 w-4 shrink-0", isInbound ? "text-red-700" : "text-amber-700")} />
                          )}
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-base font-medium px-2.5 py-1 rounded-full",
                              isDelayed
                                ? (isInbound ? "bg-red-100 text-red-700 border-red-300" : "bg-amber-100 text-amber-700 border-amber-300")
                                : (isInbound ? "bg-blue-50 text-blue-700 border-blue-300" : "bg-green-50 text-green-700 border-green-300")
                            )}
                          >
                            {isInbound ? "入庫" : "出庫"}
                          </Badge>
                        </div>
                        <div className="text-base font-semibold text-slate-900 truncate mb-0.5">
                          {getCustomerName(job)}様
                        </div>
                        <div className="text-base text-slate-700 truncate">
                          {getVehicleName(job)}
                        </div>
                      </div>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-slate-500 shrink-0" />
                    )}
                  </div>
                </div>
              );
              })}
            </div>
            
            {/* もっと見る/閉じるボタン */}
            {(remainingCount > 0 || isExpanded) && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full h-12 text-base font-medium flex items-center justify-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-5 w-5 shrink-0" />
                      閉じる
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-5 w-5 shrink-0" />
                      もっと見る（残り{remainingCount}件）
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

