"use client";

import { useState } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ZohoJob, SmartTag } from "@/types";
import { JobCard } from "@/components/features/job-card";
import { fetchTodayJobs, fetchAvailableTags, checkIn } from "@/lib/api";
import { toast } from "sonner";
import { Car, Tag, Loader2, RefreshCw } from "lucide-react";

// =============================================================================
// SWR Fetcher Functions
// =============================================================================

/**
 * 今日のジョブを取得するフェッチャー
 */
async function jobsFetcher(): Promise<ZohoJob[]> {
  const result = await fetchTodayJobs();
  if (!result.success) {
    throw new Error(result.error?.message ?? "データの取得に失敗しました");
  }
  return result.data!;
}

/**
 * 利用可能なタグを取得するフェッチャー
 */
async function tagsFetcher(): Promise<SmartTag[]> {
  const result = await fetchAvailableTags();
  if (!result.success) {
    throw new Error(result.error?.message ?? "タグの取得に失敗しました");
  }
  return result.data!;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 今日の日付を「YYYY年MM月DD日（曜日）」形式で返す
 */
function getTodayFormatted(): string {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return today.toLocaleDateString("ja-JP", options);
}

// =============================================================================
// Skeleton Components
// =============================================================================

/**
 * ジョブカードのスケルトン
 */
function JobCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-24 hidden sm:block" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full mt-4 sm:hidden" />
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function Home() {
  const todayDate = getTodayFormatted();

  // SWRでデータ取得
  const {
    data: jobs,
    error: jobsError,
    isLoading: isJobsLoading,
    mutate: mutateJobs,
  } = useSWR("today-jobs", jobsFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  const {
    data: availableTags,
    error: tagsError,
    isLoading: isTagsLoading,
    mutate: mutateTags,
  } = useSWR("available-tags", tagsFetcher, {
    revalidateOnFocus: false,
  });

  // State管理
  const [selectedJob, setSelectedJob] = useState<ZohoJob | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  /**
   * Check-inボタンクリック時のハンドラ
   */
  const handleCheckIn = (job: ZohoJob) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  /**
   * タグ選択時のハンドラ
   */
  const handleTagSelect = async (tagId: string) => {
    if (!selectedJob) return;

    setIsCheckingIn(true);

    try {
      const result = await checkIn(selectedJob.id, tagId);

      if (result.success) {
        toast.success("チェックイン完了", {
          description: `${selectedJob.field4?.name}様 → タグ ${tagId}`,
        });

        // SWRのキャッシュを更新してリストを再取得
        await mutateJobs();
        await mutateTags();

        setIsDialogOpen(false);
        setSelectedJob(null);
      } else {
        toast.error("チェックインに失敗しました", {
          description: result.error?.message,
        });
      }
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error("エラーが発生しました");
    } finally {
      setIsCheckingIn(false);
    }
  };

  /**
   * ダイアログを閉じる
   */
  const handleDialogClose = (open: boolean) => {
    if (isCheckingIn) return; // 処理中は閉じない
    setIsDialogOpen(open);
    if (!open) {
      setSelectedJob(null);
    }
  };

  /**
   * 手動リフレッシュ
   */
  const handleRefresh = async () => {
    toast.info("データを更新中...");
    await mutateJobs();
    await mutateTags();
    toast.success("データを更新しました");
  };

  // エラー状態
  if (jobsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">データの取得に失敗しました</p>
          <Button onClick={() => mutateJobs()}>再試行</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                🔧 Repair Shop DX
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                整備工場業務管理システム
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isJobsLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isJobsLoading ? "animate-spin" : ""}`} />
              </Button>
              <Badge variant="outline" className="hidden sm:flex">
                Phase 1: 受付
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* タイトルセクション */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
            📅 本日の入庫予定
          </h2>
          <p className="text-sm text-slate-500 mt-1">{todayDate}</p>
          {isJobsLoading ? (
            <Skeleton className="h-5 w-16 mt-2" />
          ) : (
            <p className="text-sm text-slate-600 mt-2">
              全 <span className="font-bold text-slate-900">{jobs?.length ?? 0}</span> 件
            </p>
          )}
        </div>

        {/* ローディング状態 */}
        {isJobsLoading && (
          <div className="space-y-4">
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        )}

        {/* ジョブカードリスト */}
        {!isJobsLoading && jobs && (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onCheckIn={handleCheckIn} />
            ))}
          </div>
        )}

        {/* 空の場合の表示 */}
        {!isJobsLoading && jobs?.length === 0 && (
          <div className="text-center py-12">
            <Car className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">本日の入庫予定はありません</p>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="mt-auto py-6 text-center text-sm text-slate-400">
        <p>Repair Shop DX Platform v0.1.0</p>
      </footer>

      {/* タグ選択ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              タグ紐付け: {selectedJob?.field4?.name ?? "---"} 様
            </DialogTitle>
            <DialogDescription>
              使用するスマートタグを選択してください
            </DialogDescription>
          </DialogHeader>

          {/* タグ選択グリッド */}
          {isTagsLoading ? (
            <div className="grid grid-cols-3 gap-3 py-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : tagsError ? (
            <div className="py-4 text-center text-red-500">
              タグの取得に失敗しました
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 py-4">
              {availableTags?.map((tag) => (
                <Button
                  key={tag.tagId}
                  variant="outline"
                  size="lg"
                  className="h-16 text-2xl font-bold hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleTagSelect(tag.tagId)}
                  disabled={isCheckingIn}
                >
                  {isCheckingIn ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    tag.tagId
                  )}
                </Button>
              ))}
              {availableTags?.length === 0 && (
                <p className="col-span-3 text-center text-slate-500 py-4">
                  利用可能なタグがありません
                </p>
              )}
            </div>
          )}

          {/* 選択中の案件情報 */}
          {selectedJob && (
            <div className="bg-slate-50 rounded-md p-3 text-sm">
              <p className="text-slate-600">
                <span className="font-medium">車両:</span>{" "}
                {selectedJob.field6?.name ?? "未登録"}
              </p>
            </div>
          )}

          {/* 処理中の表示 */}
          {isCheckingIn && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>チェックイン処理中...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
