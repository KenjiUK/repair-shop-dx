"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Activity, FileText as FileTextIcon, Wrench, Car, UserCheck, RotateCcw, Package, ShoppingCart, AlertTriangle } from "lucide-react";
import { ZohoJob } from "@/types";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef, useMemo } from "react";
import { getNumericalMasterConfig } from "@/lib/numerical-master-config";
import { isLongPartsProcurement } from "@/lib/parts-info-utils";

interface TodaySummaryCardProps {
  jobs: ZohoJob[];
  selectedStatus?: string;
  onStatusClick?: (status: string) => void;
}

/**
 * ステータス別の設定（色、アイコン、優先度）
 * 2025年ベストプラクティス: セマンティックカラーシステムに基づく
 * - Blue: 進行中・待機中
 * - Orange: 注意が必要
 * - Amber: 承認待ち・保留（外部依存）
 * - Indigo: 情報・管理業務
 * - Green: 完了・成功
 */
const statusConfig = {
  入庫待ち: {
    icon: Clock,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    priority: 1, // 最重要
  },
  診断待ち: {
    icon: Activity,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    priority: 1, // 最重要
  },
  見積作成待ち: {
    icon: FileTextIcon,
    color: "text-indigo-600", // 情報・管理業務として統一
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300", // border-indigo-200 → border-indigo-300 (視認性向上)
    priority: 2,
  },
  お客様承認待ち: {
    icon: UserCheck,
    color: "text-amber-700", // yellowより明確に区別（承認待ち・保留）
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    priority: 2,
  },
  作業待ち: {
    icon: Wrench,
    color: "text-orange-700", // 注意が必要として統一
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    priority: 2,
  },
  引渡待ち: {
    icon: Car,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    priority: 3,
  },
  // 改善提案 #3: 部品調達待ち案件の管理機能
  部品調達待ち: {
    icon: Package,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    priority: 2,
  },
  部品発注待ち: {
    icon: ShoppingCart,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    priority: 2,
  },
} as const;

/**
 * 本日の案件サマリーカード（視覚的強化版）
 */
export function TodaySummaryCard({ jobs, selectedStatus, onStatusClick }: TodaySummaryCardProps) {
  // ステータス別の件数を集計
  const statusCounts = {
    入庫待ち: jobs.filter((j) => j.field5 === "入庫待ち").length,
    診断待ち: jobs.filter((j) => j.field5 === "入庫済み").length,
    見積作成待ち: jobs.filter((j) => j.field5 === "見積作成待ち").length,
    お客様承認待ち: jobs.filter((j) => j.field5 === "見積提示済み").length,
    作業待ち: jobs.filter((j) => j.field5 === "作業待ち").length,
    引渡待ち: jobs.filter((j) => j.field5 === "出庫待ち").length,
    // 改善提案 #3: 部品調達待ち案件の管理機能
    部品調達待ち: jobs.filter((j) => j.field5 === "部品調達待ち").length,
    部品発注待ち: jobs.filter((j) => j.field5 === "部品発注待ち").length,
  };
  
  // 再入庫予定の件数を集計
  const reentryCount = jobs.filter((j) => {
    const hasSecondBooking = !!j.ID_BookingId_2 || !!j.bookingId2;
    return j.field5 === "見積提示済み" && hasSecondBooking;
  }).length;

  // 完了案件数を集計（本日完了した案件: field5 = 出庫済み かつ field22 = 今日）
  const completedTodayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return jobs.filter((j) => {
      if (j.field5 !== "出庫済み") return false;
      if (!j.field22) return false;
      
      const arrivalDate = new Date(j.field22);
      arrivalDate.setHours(0, 0, 0, 0);
      return arrivalDate.getTime() === today.getTime();
    }).length;
  }, [jobs]);

  // 長期化承認待ちの件数を集計
  const longPendingApprovalCount = useMemo(() => {
    const config = getNumericalMasterConfig();
    const thresholdDays = config.thresholds.longPendingApprovalDays;
    const now = new Date();
    
    return jobs.filter((j) => {
      // 見積提示済みのステータス
      if (j.field5 !== "見積提示済み") return false;
      
      // field7から見積提示日時を取得
      if (!j.field7) return false;
      
      // 【見積提示】ISO 8601形式（YYYY-MM-DDTHH:mm:ss.sssZ）で記録されている
      const estimateSentMatch = j.field7.match(/【見積提示】(.+)/);
      if (!estimateSentMatch) return false;
      
      // 見積提示日時をパース（ISO 8601形式）
      const estimateSentDate = new Date(estimateSentMatch[1].trim());
      if (isNaN(estimateSentDate.getTime())) return false;
      
      // 経過日数を計算
      const diffTime = now.getTime() - estimateSentDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // 閾値以上経過しているか判定
      return diffDays >= thresholdDays;
    }).length;
  }, [jobs]);

  // 長期化部品調達の件数を集計
  const longPartsProcurementCount = useMemo(() => {
    const config = getNumericalMasterConfig();
    const thresholdDays = config.thresholds.longPartsProcurementDays;
    
    return jobs.filter((j) => {
      // 部品発注待ちまたは部品調達待ちのステータス
      if (j.field5 !== "部品発注待ち" && j.field5 !== "部品調達待ち") return false;
      
      // 部品情報が存在するか確認
      if (!j.partsInfo) return false;
      
      // 長期化しているか判定
      return isLongPartsProcurement(j.partsInfo, thresholdDays);
    }).length;
  }, [jobs]);

  // 合計を計算（基本ステータス + 完了案件数）
  const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0) + completedTodayCount;

  // アニメーション用の状態（数値の変化をスムーズに表示）
  const [animatedCounts, setAnimatedCounts] = useState(statusCounts);
  // 前回のstatusCountsを保持（無限ループ防止）
  const prevStatusCountsRef = useRef(statusCounts);

  useEffect(() => {
    // 前回の値と比較して、変化があった場合のみアニメーション
    const hasChanged = Object.keys(statusCounts).some((status) => {
      const key = status as keyof typeof statusCounts;
      return prevStatusCountsRef.current[key] !== statusCounts[key];
    });

    if (!hasChanged) {
      return; // 変化がない場合は何もしない
    }

    // 数値の変化をアニメーション
    const duration = 500; // 500ms
    const steps = 20;
    const stepDuration = duration / steps;
    const intervals: NodeJS.Timeout[] = [];

    Object.keys(statusCounts).forEach((status) => {
      const key = status as keyof typeof statusCounts;
      const targetValue = statusCounts[key];
      const startValue = animatedCounts[key];
      const difference = targetValue - startValue;

      if (Math.abs(difference) < 0.1) {
        // 変化がない場合は即座に更新（アニメーション不要）
        setAnimatedCounts((prev) => {
          if (prev[key] === targetValue) return prev; // 既に同じ値なら更新しない
          return { ...prev, [key]: targetValue };
        });
        return;
      }

      const increment = difference / steps;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        if (step >= steps) {
          setAnimatedCounts((prev) => ({ ...prev, [key]: targetValue }));
          clearInterval(interval);
        } else {
          setAnimatedCounts((prev) => {
            const newValue = Math.round(startValue + increment * step);
            // 前回の値と同じ場合は更新しない（無限ループ防止）
            if (prev[key] === newValue) return prev;
            return { ...prev, [key]: newValue };
          });
        }
      }, stepDuration);
      
      intervals.push(interval);
    });

    // 前回の値を更新
    prevStatusCountsRef.current = statusCounts;

    return () => {
      intervals.forEach((interval) => clearInterval(interval));
    };
  }, [statusCounts, animatedCounts]);

  // フィルター値の変換（表示名 → 実際のZoho CRMステータス値）
  // 表示名と実際のZoho CRMステータス値のマッピング
  const getFilterValue = (displayStatus: string): string => {
    const statusMap: Record<string, string> = {
      入庫待ち: "入庫待ち",
      診断待ち: "入庫済み", // 表示名「診断待ち」→ 実際のステータス「入庫済み」
      見積作成待ち: "見積作成待ち",
      お客様承認待ち: "見積提示済み", // 表示名「お客様承認待ち」→ 実際のステータス「見積提示済み」
      作業待ち: "作業待ち",
      引渡待ち: "出庫待ち", // 表示名「引渡待ち」→ 実際のステータス「出庫待ち」
      // 改善提案 #3: 部品調達待ち案件の管理機能
      部品調達待ち: "部品調達待ち",
      部品発注待ち: "部品発注待ち",
    };
    return statusMap[displayStatus] || displayStatus;
  };

  // 優先度順にソート（最重要を上に）
  const statuses = Object.keys(statusConfig).sort((a, b) => {
    const priorityA = statusConfig[a as keyof typeof statusConfig].priority;
    const priorityB = statusConfig[b as keyof typeof statusConfig].priority;
    return priorityA - priorityB;
  }) as Array<keyof typeof statusConfig>;

  // カードタイトルをクリックでフィルターリセット
  const handleTitleClick = () => {
    if (onStatusClick) {
      onStatusClick("すべて");
    }
  };

  return (
    <Card 
      className="h-full flex flex-col"
      role="region"
      aria-label="本日の作業状況サマリー"
      aria-describedby="today-summary-description"
    >
      <div id="today-summary-description" className="sr-only">
        本日の案件をステータス別に集計しています。各ステータスをクリックすると、該当する案件のみを表示できます。
      </div>
      <CardHeader className="pb-3">
        <CardTitle 
          className={cn(
            "flex items-center justify-between text-xl font-semibold", // text-lg → text-xl (40歳以上ユーザー向け、フォントサイズ拡大)
            onStatusClick && "cursor-pointer hover:opacity-80 transition-opacity"
          )}
          onClick={handleTitleClick}
          aria-label={onStatusClick ? "本日の作業状況（クリックでフィルターリセット）" : "本日の作業状況"}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white shrink-0" />
            </div>
            本日の作業状況
          </div>
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full">
            {totalCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          {statuses
            .filter((status) => animatedCounts[status] > 0) // 件数0の項目を非表示（改善: 視覚的ノイズ削減）
            .map((status) => {
            const config = statusConfig[status];
            const count = animatedCounts[status];
            const Icon = config.icon;
            const isPriority = config.priority === 1;
            const hasCount = count > 0;
            const filterValue = getFilterValue(status);
            // selectedStatusが「すべて」の場合は選択されていない
            // selectedStatusが実際のZoho CRMステータス値の場合、表示名に変換して比較
            const isSelected = selectedStatus !== "すべて" && (
              selectedStatus === filterValue ||
              (status === "お客様承認待ち" && selectedStatus === "見積提示済み")
            );

            return (
              <div
                key={status}
                onClick={() => {
                  if (onStatusClick && hasCount) {
                    // フィルター値（実際のZoho CRMステータス値）を渡す
                    onStatusClick(filterValue);
                  }
                }}
                role={onStatusClick && hasCount ? "button" : undefined}
                tabIndex={onStatusClick && hasCount ? 0 : undefined}
                aria-label={hasCount ? `${status}: ${count}件（クリックでフィルター）` : `${status}: ${count}件`}
                aria-pressed={isSelected && hasCount ? "true" : "false"}
                onKeyDown={(e) => {
                  if (onStatusClick && hasCount && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onStatusClick(filterValue);
                  }
                }}
                className={cn(
                  "flex items-center justify-between gap-2 p-3 rounded-md transition-all duration-200", // p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大)
                  // 基本スタイル（すべてのボタンで統一）
                  hasCount && "bg-slate-50",
                  hasCount && "border border-slate-200",
                  // 優先度によるスタイル
                  isPriority && hasCount && "shadow-sm",
                  // クリック可能な場合のホバー・フォーカススタイル
                  onStatusClick && hasCount && "cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                  // 選択状態のスタイル（サイズは変わらないようにborderの太さを統一）
                  isSelected && hasCount && "bg-slate-100 border border-slate-500 shadow-md ring-1 ring-slate-400"
                )}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className={cn("h-4 w-4 shrink-0", config.color, isSelected && "scale-110")} />
                  </div>
                  <span className={cn(
                    "text-base font-medium truncate",
                    isPriority ? "text-slate-900" : "text-slate-700",
                    isSelected && "font-semibold"
                  )}>
                    {status}
                  </span>
                </div>
                <span
                  className={cn(
                    "font-bold tabular-nums transition-all duration-200",
                    "text-xl", // すべてtext-xlに統一 (40歳以上ユーザー向け、フォントサイズ統一)
                    "text-slate-900",
                    isSelected && "text-slate-900 scale-110"
                  )}
                >
                  {count}
                </span>
              </div>
            );
          })}
          
          {/* 完了案件数（本日完了） */}
          {completedTodayCount > 0 && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (onStatusClick) {
                  onStatusClick("出庫済み");
                }
              }}
              onKeyDown={(e) => {
                if (onStatusClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onStatusClick("出庫済み");
                }
              }}
              aria-label={`完了案件数（本日）: ${completedTodayCount}件（クリックでフィルター）`}
              aria-pressed={selectedStatus === "出庫済み" ? "true" : "false"}
              className={cn(
                "flex items-center justify-between gap-2 p-3 rounded-md transition-all duration-200",
                "bg-green-50 border border-green-300",
                onStatusClick && "cursor-pointer hover:bg-green-100 hover:border-green-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                selectedStatus === "出庫済み" && "bg-green-100 border border-green-500 shadow-md ring-1 ring-green-400"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Car className={cn("h-4 w-4 shrink-0 text-green-700", selectedStatus === "出庫済み" && "scale-110")} />
                </div>
                <span className={cn(
                  "text-base font-medium truncate",
                  "text-slate-900",
                  selectedStatus === "出庫済み" && "font-semibold"
                )}>
                  完了案件数（本日）
                </span>
              </div>
              <span
                className={cn(
                  "font-bold tabular-nums transition-all duration-200",
                  "text-xl text-slate-900",
                  selectedStatus === "出庫済み" && "scale-110"
                )}
              >
                {completedTodayCount}
              </span>
            </div>
          )}

          {/* 長期化承認待ち */}
          {longPendingApprovalCount > 0 && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (onStatusClick) {
                  onStatusClick("長期化承認待ち");
                }
              }}
              onKeyDown={(e) => {
                if (onStatusClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onStatusClick("長期化承認待ち");
                }
              }}
              aria-label={`長期化承認待ち: ${longPendingApprovalCount}件（クリックでフィルター）`}
              aria-pressed={selectedStatus === "長期化承認待ち" ? "true" : "false"}
              className={cn(
                "flex items-center justify-between gap-2 p-3 rounded-md transition-all duration-200",
                "bg-amber-50 border border-amber-300",
                onStatusClick && "cursor-pointer hover:bg-amber-100 hover:border-amber-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
                selectedStatus === "長期化承認待ち" && "bg-amber-100 border border-amber-500 shadow-md ring-1 ring-amber-400"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className={cn("h-4 w-4 shrink-0 text-amber-700", selectedStatus === "長期化承認待ち" && "scale-110")} />
                </div>
                <span className={cn(
                  "text-base font-medium truncate",
                  "text-slate-900",
                  selectedStatus === "長期化承認待ち" && "font-semibold"
                )}>
                  長期化承認待ち
                </span>
              </div>
              <span
                className={cn(
                  "font-bold tabular-nums transition-all duration-200",
                  "text-xl text-slate-900",
                  selectedStatus === "長期化承認待ち" && "scale-110"
                )}
              >
                {longPendingApprovalCount}
              </span>
            </div>
          )}

          {/* 長期化部品調達 */}
          {longPartsProcurementCount > 0 && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (onStatusClick) {
                  onStatusClick("長期化部品調達");
                }
              }}
              onKeyDown={(e) => {
                if (onStatusClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onStatusClick("長期化部品調達");
                }
              }}
              aria-label={`長期化部品調達: ${longPartsProcurementCount}件（クリックでフィルター）`}
              aria-pressed={selectedStatus === "長期化部品調達" ? "true" : "false"}
              className={cn(
                "flex items-center justify-between gap-2 p-3 rounded-md transition-all duration-200",
                "bg-orange-50 border border-orange-300",
                onStatusClick && "cursor-pointer hover:bg-orange-100 hover:border-orange-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
                selectedStatus === "長期化部品調達" && "bg-orange-100 border border-orange-500 shadow-md ring-1 ring-orange-400"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className={cn("h-4 w-4 shrink-0 text-orange-700", selectedStatus === "長期化部品調達" && "scale-110")} />
                </div>
                <span className={cn(
                  "text-base font-medium truncate",
                  "text-slate-900",
                  selectedStatus === "長期化部品調達" && "font-semibold"
                )}>
                  長期化部品調達
                </span>
              </div>
              <span
                className={cn(
                  "font-bold tabular-nums transition-all duration-200",
                  "text-xl text-slate-900",
                  selectedStatus === "長期化部品調達" && "scale-110"
                )}
              >
                {longPartsProcurementCount}
              </span>
            </div>
          )}

          {/* 再入庫予定カード */}
          {reentryCount > 0 && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (onStatusClick) {
                  onStatusClick("再入庫予定");
                }
              }}
              onKeyDown={(e) => {
                if (onStatusClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onStatusClick("再入庫予定");
                }
              }}
              aria-label={`再入庫予定: ${reentryCount}件（クリックでフィルター）`}
              aria-pressed={selectedStatus === "再入庫予定" ? "true" : "false"}
              className={cn(
                "flex items-center justify-between gap-2 p-3 rounded-md transition-all duration-200", // p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大)
                "bg-blue-50 border border-blue-300",
                onStatusClick && "cursor-pointer hover:bg-blue-100 hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                selectedStatus === "再入庫予定" && "bg-blue-100 border border-blue-500 shadow-md ring-1 ring-blue-400"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <RotateCcw className={cn("h-4 w-4 shrink-0 text-blue-700", selectedStatus === "再入庫予定" && "scale-110")} />
                </div>
                <span className={cn(
                  "text-base font-medium truncate",
                  "text-slate-900",
                  selectedStatus === "再入庫予定" && "font-semibold"
                )}>
                  再入庫予定
                </span>
              </div>
              <span
                className={cn(
                  "font-bold tabular-nums transition-all duration-200",
                  "text-xl text-slate-900", // text-lg → text-xl (40歳以上ユーザー向け、フォントサイズ統一)
                  selectedStatus === "再入庫予定" && "scale-110"
                )}
              >
                {reentryCount}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
