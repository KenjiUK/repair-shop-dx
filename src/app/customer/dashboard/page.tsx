"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ZohoJob, ServiceKind } from "@/types";
import { fetchJobById, fetchCustomerById, fetchJobsByCustomerId } from "@/lib/api";
import { getCustomerIdFromMagicLink } from "@/lib/line-api";
import {
  Car,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Download,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// SWR Fetcher Functions
// =============================================================================

/**
 * 顧客のジョブ一覧を取得するフェッチャー
 */
async function customerJobsFetcher(customerId: string): Promise<ZohoJob[]> {
  const result = await fetchJobsByCustomerId(customerId);
  if (!result.success) {
    throw new Error(result.error?.message ?? "データの取得に失敗しました");
  }
  return result.data || [];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ステータスに応じたバッジの色を取得
 */
function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "出庫済み":
      return "default";
    case "作業中":
    case "見積提示済み":
      return "secondary";
    case "入庫待ち":
    case "入庫済み":
      return "outline";
    default:
      return "outline";
  }
}

/**
 * ステータスに応じたアイコンを取得
 */
function getStatusIcon(status: string) {
  switch (status) {
    case "出庫済み":
      return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
    case "作業中":
      return <Clock className="h-4 w-4 text-blue-600 shrink-0" />;
    case "見積提示済み":
      return <FileText className="h-4 w-4 text-amber-600 shrink-0" />;
    default:
      return <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />;
  }
}

/**
 * サービス種類に応じたアイコンを取得
 */
function getServiceIcon(serviceKind: ServiceKind | undefined) {
  if (!serviceKind) return <Car className="h-4 w-4 shrink-0" />;
  // 簡易実装：主要なサービス種類のみ
  return <Car className="h-4 w-4 shrink-0" />;
}

/**
 * ジョブの進捗率を計算
 */
function calculateJobProgress(job: ZohoJob): number {
  const status = job.field5 || "";
  switch (status) {
    case "入庫待ち":
      return 0;
    case "入庫済み":
      return 10;
    case "見積作成待ち":
      return 20;
    case "見積提示済み":
      return 40;
    case "作業待ち":
      return 50;
    case "出庫待ち":
      return 90;
    case "出庫済み":
      return 100;
    default:
      return 0;
  }
}

/**
 * 車両情報を抽出
 */
function extractVehicleInfo(job: ZohoJob): { name: string; licensePlate?: string } {
  const vehicleInfo = typeof job.field6 === "string" ? job.field6 : (job.field6?.name || "");
  const parts = vehicleInfo ? vehicleInfo.split(" / ") : [];
  return {
    name: parts[0] || "車両未登録",
    licensePlate: parts[1] || undefined,
  };
}

// =============================================================================
// Components
// =============================================================================

/**
 * ジョブカードコンポーネント（顧客向け）
 */
function CustomerJobCard({ job }: { job: ZohoJob }) {
  const status = job.field5 || "不明";
  const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  const primaryServiceKind = serviceKinds[0] || job.serviceKind || "その他";
  const vehicleInfo = extractVehicleInfo(job);
  const progress = calculateJobProgress(job);
  const hasEstimate = status === "見積提示済み" || status === "作業待ち" || status === "出庫待ち" || status === "出庫済み";
  const hasReport = status === "出庫済み";

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getServiceIcon(primaryServiceKind as ServiceKind)}
              <CardTitle className="text-lg font-semibold text-slate-900">{primaryServiceKind}</CardTitle>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-900">{vehicleInfo.name}</p>
              {vehicleInfo.licensePlate && (
                <p className="text-xs text-slate-500">{vehicleInfo.licensePlate}</p>
              )}
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(status)} className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
            {status}
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

        {/* 日付情報 */}
        {job.field22 && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              {new Date(job.field22).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col gap-2 pt-2">
          {hasEstimate && (
            <Link href={`/customer/approval/${job.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2 shrink-0" />
                見積もりを確認
                <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </Link>
          )}
          {hasReport && (
            <Link href={`/customer/report/${job.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <FileText className="h-4 w-4 mr-2 shrink-0" />
                作業完了報告を確認
                <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </Link>
          )}
          {!hasEstimate && !hasReport && (
            <Link 
              href={`/presentation/${job.id}`} 
              prefetch={true}
              onClick={() => {
                document.body.setAttribute("data-navigating", "true");
              }}
            >
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2 shrink-0" />
                詳細を確認
                <ArrowRight className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

function CustomerDashboardContent() {
  const searchParams = useSearchParams();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoadingCustomerId, setIsLoadingCustomerId] = useState(true);

  // 顧客IDを取得（URLパラメータまたはマジックリンクトークンから）
  useEffect(() => {
    const loadCustomerId = async () => {
      setIsLoadingCustomerId(true);
      
      try {
        // 1. URLパラメータから顧客IDを取得
        const customerIdParam = searchParams.get("customerId");
        if (customerIdParam) {
          setCustomerId(customerIdParam);
          setIsLoadingCustomerId(false);
          return;
        }

        // 2. マジックリンクトークンから顧客IDを取得
        const token = searchParams.get("token");
        if (token) {
          const id = await getCustomerIdFromMagicLink(token);
          if (id) {
            setCustomerId(id);
            setIsLoadingCustomerId(false);
            return;
          }
        }

        // 3. どちらも取得できない場合はエラー
        setCustomerId(null);
        setIsLoadingCustomerId(false);
      } catch (error) {
        console.error("[Customer Dashboard] 顧客ID取得エラー:", error);
        setCustomerId(null);
        setIsLoadingCustomerId(false);
      }
    };

    loadCustomerId();
  }, [searchParams]);

  // SWRでデータ取得
  const {
    data: customer,
    error: customerError,
    isLoading: isCustomerLoading,
  } = useSWR(customerId ? `customer-${customerId}` : null, customerId ? () => fetchCustomerById(customerId) : null, {
    revalidateOnFocus: false,
  });

  const {
    data: jobs,
    error: jobsError,
    isLoading: isJobsLoading,
  } = useSWR(customerId ? `customer-jobs-${customerId}` : null, customerId ? () => customerJobsFetcher(customerId) : null, {
    revalidateOnFocus: false,
  });

  // ステータス別にフィルタリング
  const [selectedTab, setSelectedTab] = useState<string>("すべて");

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    if (selectedTab === "すべて") return jobs;
    return jobs.filter((job) => job.field5 === selectedTab);
  }, [jobs, selectedTab]);

  // ステータス別の集計
  const statusCounts = useMemo(() => {
    if (!jobs) return {};
    const counts: Record<string, number> = {};
    jobs.forEach((job) => {
      const status = job.field5 || "不明";
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  // 顧客IDが取得できない場合
  if (!isLoadingCustomerId && !customerId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">顧客IDを取得できませんでした</p>
          <p className="text-sm text-slate-600">
            URLパラメータまたはマジックリンクトークンが必要です
          </p>
        </div>
      </div>
    );
  }

  // ローディング状態（顧客ID取得中）
  if (isLoadingCustomerId || !customerId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  // エラー状態
  if (customerError || jobsError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">データの取得に失敗しました</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {isCustomerLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              `${customer?.data?.Last_Name || "顧客"}様のダッシュボード`
            )}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ご依頼いただいた作業の進捗を確認できます
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">進行中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600 shrink-0" />
                <span className="text-2xl font-bold text-slate-900">
                  {statusCounts["作業中"] || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">見積待ち</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                <span className="text-2xl font-bold text-slate-900">
                  {statusCounts["見積提示済み"] || 0}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">完了</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <span className="text-2xl font-bold text-slate-900">
                  {statusCounts["出庫済み"] || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ステータスタブ */}
        {!isJobsLoading && jobs && jobs.length > 0 && (
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="すべて">すべて</TabsTrigger>
              <TabsTrigger value="見積提示済み">見積待ち</TabsTrigger>
              <TabsTrigger value="作業中">作業中</TabsTrigger>
              <TabsTrigger value="出庫待ち">出庫待ち</TabsTrigger>
              <TabsTrigger value="出庫済み">完了</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* ジョブリスト */}
        {isJobsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-12 w-12 mx-auto text-slate-300 mb-4 shrink-0" />
            <p className="text-slate-500">
              {selectedTab === "すべて" ? "作業履歴がありません" : "該当する作業がありません"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <CustomerJobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    }>
      <CustomerDashboardContent />
    </Suspense>
  );
}









