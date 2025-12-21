"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZohoJob } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { extractLongTermProjects } from "@/lib/long-term-project-utils";

interface LongTermProjectSummaryCardProps {
  jobs: ZohoJob[];
  onScrollToProjects?: () => void;
}

/**
 * 長期プロジェクトサマリーカード
 */
export function LongTermProjectSummaryCard({
  jobs,
  onScrollToProjects,
}: LongTermProjectSummaryCardProps) {
  // 長期プロジェクトを抽出
  const longTermProjects = extractLongTermProjects(jobs);

  // 統計を計算
  const totalCount = longTermProjects.length;
  const delayedCount = longTermProjects.filter((p) => p.isDelayed).length;
  const lowProgressCount = longTermProjects.filter((p) => p.progress < 50).length; // 進捗率50%未満
  const highProgressCount = longTermProjects.filter((p) => p.progress >= 75).length; // 進捗率75%以上（完了間近）

  return (
    <Card
      className={cn(
        "h-full flex flex-col transition-all duration-200",
        onScrollToProjects && "cursor-pointer hover:shadow-md"
      )}
      onClick={onScrollToProjects}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-lg">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="truncate">長期プロジェクト</span>
          </div>
          {totalCount > 0 && (
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-1 rounded-full shrink-0">
              {totalCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {/* 進行中件数 */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200">
            <span className="text-sm font-medium text-slate-700 min-w-0 flex-1 truncate">進行中</span>
            <span className="text-xl font-bold text-slate-900 tabular-nums shrink-0">
              {totalCount}件
            </span>
          </div>

          {/* 遅延件数（警告表示） */}
          {delayedCount > 0 && (
            <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-red-50 border-2 border-red-200">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <span className="text-sm font-medium text-red-700 truncate">遅延</span>
              </div>
              <Badge variant="destructive" className="text-sm font-bold shrink-0">
                {delayedCount}件
              </Badge>
            </div>
          )}

          {/* 進捗率50%未満 */}
          {totalCount > 0 && (
            <div className={cn(
              "flex items-center justify-between gap-2 p-2 rounded-md border",
              lowProgressCount > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-slate-50 border-slate-200"
            )}>
              <span className={cn(
                "text-sm font-medium min-w-0 flex-1 truncate",
                lowProgressCount > 0 ? "text-amber-700" : "text-slate-700"
              )}>
                進捗率50%未満
              </span>
              <span className={cn(
                "text-lg font-bold tabular-nums shrink-0",
                lowProgressCount > 0 ? "text-amber-900" : "text-slate-900"
              )}>
                {lowProgressCount}件
              </span>
            </div>
          )}

          {/* 進捗率75%以上 */}
          {totalCount > 0 && (
            <div className={cn(
              "flex items-center justify-between gap-2 p-2 rounded-md border",
              highProgressCount > 0
                ? "bg-green-50 border-green-200"
                : "bg-slate-50 border-slate-200"
            )}>
              <span className={cn(
                "text-sm font-medium min-w-0 flex-1 truncate",
                highProgressCount > 0 ? "text-green-700" : "text-slate-700"
              )}>
                進捗率75%以上
              </span>
              <span className={cn(
                "text-lg font-bold tabular-nums shrink-0",
                highProgressCount > 0 ? "text-green-900" : "text-slate-900"
              )}>
                {highProgressCount}件
              </span>
            </div>
          )}

          {/* 空の場合 */}
          {totalCount === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              長期プロジェクトはありません
            </p>
          )}
        </div>

        {/* フッター */}
        {totalCount > 0 && (
          <div className="flex items-center justify-center pt-3 mt-auto border-t border-slate-200">
            <span className="text-xs text-slate-500">クリックで詳細表示</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}





