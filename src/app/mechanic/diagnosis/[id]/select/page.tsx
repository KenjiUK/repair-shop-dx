"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, Suspense } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/app-header";
import { SaveStatusIndicator } from "@/components/features/save-status-indicator";
import { fetchJobById } from "@/lib/api";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { WorkOrder, WorkOrderStatus, ServiceKind } from "@/types";
import {
  Wrench,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// =============================================================================
// Constants
// =============================================================================

/**
 * 入庫区分ごとのアイコンと色
 */
const SERVICE_KIND_CONFIG: Record<ServiceKind, { icon: React.ReactNode; color: string }> = {
  "車検": { icon: <Wrench className="h-5 w-5" />, color: "bg-blue-600" },
  "修理・整備": { icon: <Wrench className="h-5 w-5" />, color: "bg-amber-600" },
  "レストア": { icon: <Wrench className="h-5 w-5" />, color: "bg-purple-600" },
  "チューニング": { icon: <Wrench className="h-5 w-5" />, color: "bg-red-600" },
  "板金・塗装": { icon: <Wrench className="h-5 w-5" />, color: "bg-orange-600" },
  "パーツ取付": { icon: <Wrench className="h-5 w-5" />, color: "bg-teal-600" },
  "コーティング": { icon: <Wrench className="h-5 w-5" />, color: "bg-cyan-600" },
  "その他のメンテナンス": { icon: <Wrench className="h-5 w-5" />, color: "bg-slate-600" },
  "12ヵ月点検": { icon: <Wrench className="h-5 w-5" />, color: "bg-green-600" },
  "エンジンオイル交換": { icon: <Wrench className="h-5 w-5" />, color: "bg-yellow-600" },
  "タイヤ交換・ローテーション": { icon: <Wrench className="h-5 w-5" />, color: "bg-indigo-600" },
  "故障診断": { icon: <AlertCircle className="h-5 w-5" />, color: "bg-rose-600" },
};

/**
 * ステータスの表示設定
 */
const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  "未開始": { label: "未開始", color: "bg-slate-100 text-slate-700", icon: <Clock className="h-4 w-4" /> },
  "受入点検中": { label: "受入点検中", color: "bg-blue-100 text-blue-700", icon: <Wrench className="h-4 w-4" /> },
  "診断中": { label: "診断中", color: "bg-blue-100 text-blue-700", icon: <Wrench className="h-4 w-4" /> },
  "見積作成待ち": { label: "見積作成待ち", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-4 w-4" /> },
  "顧客承認待ち": { label: "お客様承認待ち", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-4 w-4" /> },
  "作業待ち": { label: "作業待ち", color: "bg-slate-100 text-slate-700", icon: <Clock className="h-4 w-4" /> },
  "作業中": { label: "作業中", color: "bg-blue-100 text-blue-700", icon: <Wrench className="h-4 w-4" /> },
  "外注調整中": { label: "外注先調整中", color: "bg-purple-100 text-purple-700", icon: <Truck className="h-4 w-4" /> },
  "外注見積待ち": { label: "外注見積待ち", color: "bg-purple-100 text-purple-700", icon: <Clock className="h-4 w-4" /> },
  "外注作業中": { label: "外注作業中", color: "bg-purple-100 text-purple-700", icon: <Truck className="h-4 w-4" /> },
  "完了": { label: "完了", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-4 w-4" /> },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ジョブ情報を取得するフェッチャー
 */
const jobFetcher = async (jobId: string) => {
  const result = await fetchJobById(jobId);
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "ジョブの取得に失敗しました");
  }
  return result.data;
};

// =============================================================================
// Components
// =============================================================================

/**
 * ローディングスケルトン
 */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppHeader
        title="作業を選択"
        backHref="/"
        rightArea={<SaveStatusIndicator status="idle" />}
      />
      <main className="max-w-4xl mx-auto px-4 py-6" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="border-slate-200 shadow-md">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

/**
 * エラー表示
 */
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md" role="alert">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-4 shrink-0" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">エラー</h2>
          <p className="text-slate-700 mb-4">{message}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <a href="/" aria-label="トップページへ戻る">トップへ戻る</a>
            </Button>
            <Button onClick={onRetry} aria-label="再試行">再試行</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 作業グループ選択ページ
 */
function WorkOrderSelectPageContent() {
  const router = useRouter();
  const params = useParams();
  const jobId = useMemo(() => (params?.id ?? "") as string, [params]);

  // ジョブ情報を取得
  const {
    data: job,
    error: jobError,
    isLoading: isJobLoading,
    mutate: mutateJob,
  } = useSWR(jobId ? `job-${jobId}` : null, jobId ? () => jobFetcher(jobId) : null, {
    revalidateOnMount: true,
  });

  // ワークオーダーを取得
  const { workOrders, isLoading: isLoadingWorkOrders, mutate: mutateWorkOrders } = useWorkOrders(jobId);

  // エラー状態
  if (jobError) {
    return (
      <ErrorDisplay
        message={jobError.message || "データの取得に失敗しました"}
        onRetry={() => {
          mutateJob();
          mutateWorkOrders();
        }}
      />
    );
  }

  // ローディング状態
  if (isJobLoading || isLoadingWorkOrders || !job) {
    return <LoadingSkeleton />;
  }

  // ワークオーダーが1つ以下の場合は、直接診断画面にリダイレクト
  if (workOrders.length <= 1) {
    router.replace(`/mechanic/diagnosis/${jobId}`);
    return <LoadingSkeleton />;
  }

  // 顧客名と車両情報を取得
  const customerName = job.field4?.name || "顧客名不明";
  const vehicleName = job.field6?.name || "車両情報不明";

  // 作業グループ選択ハンドラ
  const handleSelectWorkOrder = (workOrderId: string) => {
    router.push(`/mechanic/diagnosis/${jobId}?workOrder=${workOrderId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AppHeader
        title="作業を選択"
        backHref="/"
        rightArea={<SaveStatusIndicator status="idle" />}
      />
      <main className="max-w-4xl mx-auto px-4 py-6" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
        {/* ジョブ情報 */}
        <Card className="mb-6 border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              案件情報
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-base text-slate-700 dark:text-slate-300">
                <span className="font-medium">顧客:</span> {customerName}
              </p>
              <p className="text-base text-slate-700 dark:text-slate-300">
                <span className="font-medium">車両:</span> {vehicleName}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 作業グループ一覧 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            作業を選択してください
          </h2>
          {workOrders.map((workOrder) => {
            const serviceConfig = SERVICE_KIND_CONFIG[workOrder.serviceKind] || {
              icon: <Wrench className="h-5 w-5" />,
              color: "bg-slate-600",
            };
            const statusConfig = STATUS_CONFIG[workOrder.status] || STATUS_CONFIG["未開始"];

            return (
              <Card
                key={workOrder.id}
                className="border-slate-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectWorkOrder(workOrder.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* アイコン */}
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-lg text-white shrink-0",
                        serviceConfig.color,
                        "w-16 h-16"
                      )}
                    >
                      {serviceConfig.icon}
                    </div>

                    {/* コンテンツ */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {workOrder.serviceKind}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className={cn("text-base font-medium", statusConfig.color)}
                        >
                          <span className="mr-1">{statusConfig.icon}</span>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      {workOrder.diagnosis?.mechanicName && (
                        <p className="text-base text-slate-600 dark:text-slate-400">
                          担当: {workOrder.diagnosis.mechanicName}
                        </p>
                      )}
                    </div>

                    {/* 矢印 */}
                    <ChevronRight className="h-6 w-6 text-slate-400 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/**
 * メインページコンポーネント
 */
export default function WorkOrderSelectPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <WorkOrderSelectPageContent />
    </Suspense>
  );
}

