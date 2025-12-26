"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ZohoJob, CourtesyCar, ServiceKind } from "@/types";
import { TodayScheduleCard } from "./today-schedule-card";
import { TodaySummaryCard } from "./today-summary-card";
import { ServiceKindSummaryCard } from "./service-kind-summary-card";
import { MechanicSummaryCard } from "./mechanic-summary-card";
import { CourtesyCarInventoryCard } from "./courtesy-car-inventory-card";
import { LongTermProjectSummaryCard } from "./long-term-project-summary-card";
import { 
  Calendar, 
  FileText, 
  Package, 
  Users, 
  Car, 
  FolderKanban, 
  BarChart3,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface UnifiedSummaryCardProps {
  jobs: ZohoJob[];
  courtesyCars?: CourtesyCar[];
  isCourtesyCarsLoading?: boolean;
  courtesyCarsError?: Error | null;
  onRetryCourtesyCars?: () => void;
  selectedStatus?: string;
  selectedServiceKind?: ServiceKind | null;
  selectedMechanic?: string | null;
  onStatusClick?: (status: string) => void;
  onServiceKindClick?: (serviceKind: ServiceKind | null) => void;
  onMechanicClick?: (mechanicName: string | null) => void;
  onJobClick?: (jobId: string) => void;
  onScrollToProjects?: () => void;
}

/**
 * 統合サマリーカード
 * 全てのサマリー情報を1つのカード内でタブ切り替えで表示
 */
export function UnifiedSummaryCard({
  jobs,
  courtesyCars = [],
  isCourtesyCarsLoading = false,
  courtesyCarsError = null,
  onRetryCourtesyCars,
  selectedStatus,
  selectedServiceKind,
  selectedMechanic,
  onStatusClick,
  onServiceKindClick,
  onMechanicClick,
  onJobClick,
  onScrollToProjects,
}: UnifiedSummaryCardProps) {
  const [activeTab, setActiveTab] = useState<string>("schedule");

  // 各タブの件数を計算
  const scheduleCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inbound = jobs.filter((job) => {
      if (!job.field22) return false;
      const arrivalDate = new Date(job.field22);
      arrivalDate.setHours(0, 0, 0, 0);
      return (
        arrivalDate.getTime() === today.getTime() &&
        job.field5 !== "入庫済み" &&
        job.field5 !== "出庫済み"
      );
    }).length;
    const outbound = jobs.filter((job) => {
      if (job.field5 === "出庫済み" || job.field5 === "入庫待ち") return false;
      if (!job.field22) return false;
      const arrivalDate = new Date(job.field22);
      const estimatedDeparture = new Date(arrivalDate);
      estimatedDeparture.setHours(estimatedDeparture.getHours() + 4);
      const estimatedDepartureDate = new Date(estimatedDeparture);
      estimatedDepartureDate.setHours(0, 0, 0, 0);
      return estimatedDepartureDate.getTime() === today.getTime();
    }).length;
    return inbound + outbound;
  }, [jobs]);

  const workStatusCount = useMemo(() => {
    return jobs.filter((job) => 
      job.field5 !== "出庫済み" && job.field5 !== "入庫済み"
    ).length;
  }, [jobs]);

  const serviceKindCount = useMemo(() => {
    return jobs.length;
  }, [jobs]);

  const mechanicCount = useMemo(() => {
    const mechanics = new Set(
      jobs
        .map((job) => job.assignedMechanic)
        .filter((m): m is string => !!m)
    );
    return mechanics.size;
  }, [jobs]);

  const courtesyCarCount = courtesyCars.length;
  const longTermProjectCount = useMemo(() => {
    return jobs.filter((job) => {
      // 長期プロジェクトの判定ロジック（簡易版）
      return job.field5 === "作業待ち" || job.field5 === "見積作成待ち";
    }).length;
  }, [jobs]);

  return (
    <Card className="h-full flex flex-col border-slate-200 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-white shrink-0" />
          </div>
          サマリー
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <div className="px-6 pb-3">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-1 gap-1">
              <TabsTrigger 
                value="schedule" 
                className="flex flex-col items-center gap-1 py-2 text-base"
              >
                <Calendar className="h-4 w-4" />
                <span>入出庫予定</span>
                {scheduleCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-base">
                    {scheduleCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="work" 
                className="flex flex-col items-center gap-1 py-2 text-base"
              >
                <FileText className="h-4 w-4" />
                <span>作業状況</span>
                {workStatusCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-base">
                    {workStatusCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="service" 
                className="flex flex-col items-center gap-1 py-2 text-base"
              >
                <Package className="h-4 w-4" />
                <span>入庫区分</span>
                {serviceKindCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-base">
                    {serviceKindCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="mechanic" 
                className="flex flex-col items-center gap-1 py-2 text-base"
              >
                <Users className="h-4 w-4" />
                <span>整備士別</span>
                {mechanicCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-base">
                    {mechanicCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="courtesy" 
                className="flex flex-col items-center gap-1 py-2 text-base"
              >
                <Car className="h-4 w-4" />
                <span>代車在庫</span>
                {courtesyCarCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-base">
                    {courtesyCarCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="project" 
                className="flex flex-col items-center gap-1 py-2 text-base"
              >
                <FolderKanban className="h-4 w-4" />
                <span>長期プロジェクト</span>
                {longTermProjectCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-base">
                    {longTermProjectCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex flex-col items-center gap-1 py-2 text-base"
              >
                <BarChart3 className="h-4 w-4" />
                <span>業務分析</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 本日入出庫予定タブ */}
          <TabsContent value="schedule" className="flex-1 flex flex-col mt-0 px-6 pb-6">
            <TodayScheduleCard
              jobs={jobs}
              onJobClick={onJobClick}
            />
          </TabsContent>

          {/* 本日の作業状況タブ */}
          <TabsContent value="work" className="flex-1 flex flex-col mt-0 px-6 pb-6">
            <TodaySummaryCard
              jobs={jobs}
              selectedStatus={selectedStatus}
              onStatusClick={onStatusClick}
            />
          </TabsContent>

          {/* 入庫区分別タブ */}
          <TabsContent value="service" className="flex-1 flex flex-col mt-0 px-6 pb-6">
            <ServiceKindSummaryCard
              jobs={jobs}
              selectedServiceKind={selectedServiceKind}
              onServiceKindClick={onServiceKindClick}
            />
          </TabsContent>

          {/* 整備士別タブ */}
          <TabsContent value="mechanic" className="flex-1 flex flex-col mt-0 px-6 pb-6">
            <MechanicSummaryCard
              jobs={jobs}
              selectedMechanic={selectedMechanic}
              onMechanicClick={onMechanicClick}
            />
          </TabsContent>

          {/* 代車在庫タブ */}
          <TabsContent value="courtesy" className="flex-1 flex flex-col mt-0 px-6 pb-6">
            {isCourtesyCarsLoading ? (
              <Card className="border-slate-200 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Car className="h-5 w-5 text-slate-700 shrink-0" />
                    代車在庫
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : courtesyCarsError ? (
              <Card className="h-full flex flex-col border-red-300 bg-red-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-red-700">
                    <Car className="h-5 w-5 shrink-0" />
                    代車在庫
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-base text-red-700 mb-2">代車情報の取得に失敗しました</p>
                    {onRetryCourtesyCars && (
                      <Button
                        variant="outline"
                        onClick={onRetryCourtesyCars}
                        className="text-base"
                      >
                        再試行
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <CourtesyCarInventoryCard cars={courtesyCars} />
            )}
          </TabsContent>

          {/* 長期プロジェクトタブ */}
          <TabsContent value="project" className="flex-1 flex flex-col mt-0 px-6 pb-6">
            <LongTermProjectSummaryCard
              jobs={jobs}
              onScrollToProjects={onScrollToProjects}
            />
          </TabsContent>

          {/* 業務分析タブ */}
          <TabsContent value="analytics" className="flex-1 flex flex-col mt-0 px-6 pb-6">
            <Card className="border-slate-200 shadow-md h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-white shrink-0" />
                  </div>
                  業務分析
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <Link href="/manager/analytics" className="w-full">
                  <Button variant="outline" className="w-full justify-start h-12 text-base">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    月次・週次の業務量を分析
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

