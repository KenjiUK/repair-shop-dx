"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZohoJob } from "@/types";
import { cn } from "@/lib/utils";
import { TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";
import { extractLongTermProjects } from "@/lib/long-term-project-utils";
import { LongTermProjectDetailDialog } from "@/components/features/long-term-project-detail-dialog";

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
  const [selectedProject, setSelectedProject] = useState<ZohoJob | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // 長期プロジェクトを抽出
  const longTermProjects = extractLongTermProjects(jobs);

  // 統計を計算
  const totalCount = longTermProjects.length;
  const delayedCount = longTermProjects.filter((p) => p.isDelayed).length;
  const lowProgressCount = longTermProjects.filter((p) => p.progress < 50).length; // 進捗率50%未満
  const highProgressCount = longTermProjects.filter((p) => p.progress >= 75).length; // 進捗率75%以上（完了間近）

  // 詳細ダイアログを開く
  const handleProjectClick = (project: typeof longTermProjects[0]) => {
    setSelectedProject(project.job);
    setIsDetailDialogOpen(true);
  };

  return (
    <Card
      className={cn(
        "h-full flex flex-col transition-all duration-200",
        onScrollToProjects && "cursor-pointer hover:shadow-md"
      )}
      onClick={onScrollToProjects}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2 text-xl font-semibold">
          {/* text-lg → text-xl (40歳以上ユーザー向け、フォントサイズ拡大) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-white shrink-0" />
            </div>
            <span className="truncate">長期プロジェクト</span>
          </div>
          {totalCount > 0 && (
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full shrink-0">
              {totalCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {/* 進行中件数 */}
          {/* p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大) */}
          <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-slate-50 border border-slate-200">
            <span className="text-base font-medium text-slate-800 min-w-0 flex-1 truncate">進行中</span>
            {/* 「件」を削除（他のカードと統一） */}
            <span className="text-xl font-bold text-slate-900 tabular-nums shrink-0">
              {totalCount}
            </span>
          </div>

          {/* 遅延件数（警告表示） */}
          {/* p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大) */}
          {delayedCount > 0 && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-red-50 border-2 border-red-300">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <AlertTriangle className="h-5 w-5 text-red-700 shrink-0" />
                <span className="text-base font-medium text-red-900 truncate">遅延</span>
              </div>
              {/* 「件」を削除（他のカードと統一） */}
              <Badge variant="destructive" className="text-base font-bold shrink-0">
                {delayedCount}
              </Badge>
            </div>
          )}

          {/* 進捗率50%未満 */}
          {/* p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大) */}
          {totalCount > 0 && (
            <div className={cn(
              "flex items-center justify-between gap-2 p-3 rounded-md border",
              lowProgressCount > 0
                ? "bg-amber-50 border-amber-300"
                : "bg-slate-50 border-slate-200"
            )}>
              <span className={cn(
                "text-base font-medium min-w-0 flex-1 truncate",
                lowProgressCount > 0 ? "text-amber-700" : "text-slate-700"
              )}>
                進捗率50%未満
              </span>
              {/* text-lg → text-xl (40歳以上ユーザー向け、フォントサイズ統一) */}
              {/* 「件」を削除（他のカードと統一） */}
              <span className={cn(
                "text-xl font-bold tabular-nums shrink-0",
                lowProgressCount > 0 ? "text-amber-900" : "text-slate-900"
              )}>
                {lowProgressCount}
              </span>
            </div>
          )}

          {/* 進捗率75%以上 */}
          {/* p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大) */}
          {totalCount > 0 && (
            <div className={cn(
              "flex items-center justify-between gap-2 p-3 rounded-md border",
              highProgressCount > 0
                ? "bg-green-50 border-green-300"
                : "bg-slate-50 border-slate-200"
            )}>
              <span className={cn(
                "text-base font-medium min-w-0 flex-1 truncate",
                highProgressCount > 0 ? "text-green-700" : "text-slate-700"
              )}>
                進捗率75%以上
              </span>
              {/* text-lg → text-xl (40歳以上ユーザー向け、フォントサイズ統一) */}
              {/* 「件」を削除（他のカードと統一） */}
              <span className={cn(
                "text-xl font-bold tabular-nums shrink-0",
                highProgressCount > 0 ? "text-green-900" : "text-slate-900"
              )}>
                {highProgressCount}
              </span>
            </div>
          )}

          {/* 空の場合 */}
          {/* 空データメッセージを統一 */}
          {totalCount === 0 && (
            <p className="text-base text-slate-700 text-center py-4">
              データがありません
            </p>
          )}

          {/* プロジェクトリスト（上位5件を表示） */}
          {totalCount > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              {longTermProjects.slice(0, 5).map((project) => (
                <div
                  key={project.jobId}
                  className={cn(
                    "flex items-center justify-between gap-2 p-3 rounded-md transition-all duration-200", // p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大)
                    "bg-slate-50 border border-slate-200",
                    "cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                  )}
                  onClick={() => handleProjectClick(project)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-slate-900 truncate">
                      {project.customerName}様
                    </div>
                    <div className="text-base text-slate-700 truncate">
                      {project.vehicleName}
                      {project.licensePlate && ` (${project.licensePlate})`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900 tabular-nums">
                        {project.progress}%
                      </div>
                      {project.isDelayed && (
                        <Badge variant="destructive" className="text-base mt-0.5">
                          遅延
                        </Badge>
                      )}
                    </div>
                    {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                    <ChevronRight className="h-5 w-5 text-slate-700" />
                  </div>
                </div>
              ))}
              {totalCount > 5 && (
                <div className="text-base text-slate-700 text-center pt-1">
                  他 {totalCount - 5}件...
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        {totalCount > 0 && (
          <div className="flex items-center justify-center pt-3 mt-auto border-t border-slate-200">
            <span className="text-base text-slate-700">クリックで詳細表示</span>
          </div>
        )}
      </CardContent>

      {/* 長期プロジェクト詳細情報ダイアログ（改善提案 #5） */}
      {selectedProject && (
        <LongTermProjectDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          job={selectedProject}
        />
      )}
    </Card>
  );
}





