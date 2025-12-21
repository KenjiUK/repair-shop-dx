"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ZohoJob } from "@/types";

interface TodaySummaryCardProps {
  jobs: ZohoJob[];
}

/**
 * 本日の案件サマリーカード
 */
export function TodaySummaryCard({ jobs }: TodaySummaryCardProps) {
  // ステータス別の件数を集計
  const statusCounts = {
    入庫待ち: jobs.filter((j) => j.field5 === "入庫待ち").length,
    診断待ち: jobs.filter((j) => j.field5 === "入庫済み").length,
    見積作成待ち: jobs.filter((j) => j.field5 === "見積作成待ち").length,
    お客様承認待ち: jobs.filter((j) => j.field5 === "見積提示済み").length,
    作業待ち: jobs.filter((j) => j.field5 === "作業待ち").length,
    引渡待ち: jobs.filter((j) => j.field5 === "出庫待ち").length,
  };

  // 合計を計算
  const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
            <FileText className="h-3 w-3 text-white" />
          </div>
          本日の状況
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3 flex-1">
          {/* 左列 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">入庫待ち</span>
              <span className="text-base font-bold text-slate-900">
                {statusCounts.入庫待ち}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">見積作成待ち</span>
              <span className="text-base font-bold text-slate-900">
                {statusCounts.見積作成待ち}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">作業待ち</span>
              <span className="text-base font-bold text-slate-900">
                {statusCounts.作業待ち}
              </span>
            </div>
          </div>

          {/* 右列 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">診断待ち</span>
              <span className="text-base font-bold text-slate-900">
                {statusCounts.診断待ち}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">お客様承認待ち</span>
              <span className="text-base font-bold text-slate-900">
                {statusCounts.お客様承認待ち}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">引渡待ち</span>
              <span className="text-base font-bold text-slate-900">
                {statusCounts.引渡待ち}
              </span>
            </div>
          </div>
        </div>
        
        {/* 合計表示 */}
        <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-slate-100">
          <span className="text-sm text-slate-600">全</span>
          <span className="text-base font-bold text-slate-900">
            {totalCount}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
