"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, Sparkles, Paintbrush, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ZohoJob, ServiceKind, CourtesyCar } from "@/types";
import { cn } from "@/lib/utils";
import { fetchAllLongTermProjectJobs, fetchAllCourtesyCars } from "@/lib/api";
import { AppHeader } from "@/components/layout/app-header";
import { LongTermProjectData } from "@/components/features/long-term-project-card";
import { extractLongTermProjects } from "@/lib/long-term-project-utils";
import { JobCard } from "@/components/features/job-card";

type ServiceFilter = "all" | "レストア" | "板金・塗装";
type DelayFilter = "all" | "delayed" | "on_time";

/**
 * 長期プロジェクト管理画面
 */
export default function LongTermProjectsPage() {
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [delayFilter, setDelayFilter] = useState<DelayFilter>("all");

  // データ取得（長期プロジェクト管理では、過去30日以内の長期プロジェクトを取得）
  const { data: jobs = [], isLoading: isJobsLoading } = useSWR<ZohoJob[]>(
    "all-long-term-projects",
    async () => {
      const result = await fetchAllLongTermProjectJobs();
      return result.success && result.data ? result.data : [];
    }
  );

  const { data: courtesyCars = [], isLoading: isCarsLoading } = useSWR<CourtesyCar[]>(
    "courtesy-cars",
    async () => {
      const result = await fetchAllCourtesyCars();
      return result.success && result.data ? result.data : [];
    }
  );

  // 長期プロジェクトを抽出
  const allProjects = useMemo(() => {
    return extractLongTermProjects(jobs);
  }, [jobs]);

  // フィルタリングされたプロジェクトリスト
  const filteredProjects = useMemo(() => {
    let filtered = allProjects;

    // サービス種類でフィルタリング
    if (serviceFilter !== "all") {
      filtered = filtered.filter((p) => p.serviceKind === serviceFilter);
    }

    // 遅延でフィルタリング
    if (delayFilter === "delayed") {
      filtered = filtered.filter((p) => p.isDelayed);
    } else if (delayFilter === "on_time") {
      filtered = filtered.filter((p) => !p.isDelayed);
    }

    return filtered;
  }, [allProjects, serviceFilter, delayFilter]);

  // サマリー統計
  const totalCount = allProjects.length;
  const restoreCount = allProjects.filter((p) => p.serviceKind === "レストア").length;
  const bodyPaintCount = allProjects.filter((p) => p.serviceKind === "板金・塗装").length;
  const delayedCount = allProjects.filter((p) => p.isDelayed).length;
  const onTimeCount = allProjects.filter((p) => !p.isDelayed).length;

  if (isJobsLoading || isCarsLoading) {
    return (
      <div className="flex-1 bg-slate-50 overflow-auto">
        <AppHeader
          isTopPage={true}
          hideBrandOnScroll={false}
          maxWidthClassName="max-w-5xl"
        />
        <main className="max-w-5xl mx-auto px-4 py-6">
          <Skeleton className="h-[600px] w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 overflow-auto">
      <AppHeader
        isTopPage={true}
        hideBrandOnScroll={false}
        maxWidthClassName="max-w-5xl"
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* ページタイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-slate-600 shrink-0" />
            長期プロジェクト管理
          </h1>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border border-slate-300 rounded-xl shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-slate-600 mb-1">総数</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{totalCount}</p>
                </div>
                <FolderKanban className="h-5 w-5 text-slate-600 shrink-0" strokeWidth={2.5} />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-slate-600 mb-1">レストア</p>
                  <p className="text-lg font-bold text-violet-600 tabular-nums">{restoreCount}</p>
                </div>
                <Sparkles className="h-5 w-5 text-violet-600 shrink-0" strokeWidth={2.5} />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-slate-600 mb-1">板金・塗装</p>
                  <p className="text-lg font-bold text-orange-600 tabular-nums">{bodyPaintCount}</p>
                </div>
                <Paintbrush className="h-5 w-5 text-orange-600 shrink-0" strokeWidth={2.5} />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow-md hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base text-slate-600 mb-1">遅延</p>
                  <p className="text-lg font-bold text-red-600 tabular-nums">{delayedCount}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" strokeWidth={2.5} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルターとプロジェクトリスト */}
        <Card className="border border-slate-300 rounded-xl shadow-md hover:shadow-lg transition-all">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-slate-600 shrink-0" />
              プロジェクト一覧
              {filteredProjects.length > 0 && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                  {filteredProjects.length}件
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* フィルターボタン */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* サービス種類フィルター */}
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-base text-slate-600 font-medium">サービス種類:</span>
                <Button
                  variant={serviceFilter === "all" ? "default" : "outline"}
                  onClick={() => setServiceFilter("all")}
                  className={cn(
                    "h-12 text-base font-medium",
                    serviceFilter === "all" && "bg-slate-600 hover:bg-slate-700 text-white"
                  )}
                >
                  すべて
                </Button>
                <Button
                  variant={serviceFilter === "レストア" ? "default" : "outline"}
                  onClick={() => setServiceFilter("レストア")}
                  className={cn(
                    "h-12 text-base font-medium",
                    serviceFilter === "レストア" && "bg-violet-600 hover:bg-violet-700 text-white"
                  )}
                >
                  <Sparkles className="h-4 w-4 shrink-0 mr-1.5" />
                  レストア
                  {restoreCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-base font-medium px-2.5 py-1 rounded-full">
                      {restoreCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={serviceFilter === "板金・塗装" ? "default" : "outline"}
                  onClick={() => setServiceFilter("板金・塗装")}
                  className={cn(
                    "h-12 text-base font-medium",
                    serviceFilter === "板金・塗装" && "bg-orange-600 hover:bg-orange-700 text-white"
                  )}
                >
                  <Paintbrush className="h-4 w-4 shrink-0 mr-1.5" />
                  板金・塗装
                  {bodyPaintCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-base font-medium px-2.5 py-1 rounded-full">
                      {bodyPaintCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* 遅延フィルター */}
              <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                <span className="text-base text-slate-600 font-medium">進捗状況:</span>
                <Button
                  variant={delayFilter === "all" ? "default" : "outline"}
                  onClick={() => setDelayFilter("all")}
                  className={cn(
                    "h-12 text-base font-medium",
                    delayFilter === "all" && "bg-slate-600 hover:bg-slate-700 text-white"
                  )}
                >
                  すべて
                </Button>
                <Button
                  variant={delayFilter === "delayed" ? "default" : "outline"}
                  onClick={() => setDelayFilter("delayed")}
                  className={cn(
                    "h-12 text-base font-medium",
                    delayFilter === "delayed" && "bg-red-600 hover:bg-red-700 text-white"
                  )}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mr-1.5" />
                  遅延
                  {delayedCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-base font-medium px-2.5 py-1 rounded-full">
                      {delayedCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={delayFilter === "on_time" ? "default" : "outline"}
                  onClick={() => setDelayFilter("on_time")}
                  className={cn(
                    "h-12 text-base font-medium",
                    delayFilter === "on_time" && "bg-green-600 hover:bg-green-700 text-white"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 mr-1.5" />
                  順調
                  {onTimeCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-base font-medium px-2.5 py-1 rounded-full">
                      {onTimeCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* プロジェクトリスト */}
            {filteredProjects.length === 0 ? (
              <div className="py-12 text-center">
                <FolderKanban className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-base text-slate-600">
                  {allProjects.length === 0
                    ? "長期プロジェクトはありません"
                    : "該当するプロジェクトがありません"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <JobCard
                    key={project.jobId}
                    job={project.job}
                    onCheckIn={() => {}}
                    isCheckingIn={false}
                    courtesyCars={courtesyCars}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

