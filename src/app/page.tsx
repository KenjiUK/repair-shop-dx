"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ZohoJob, SmartTag, CourtesyCar, ServiceKind } from "@/types";
import { JobCard } from "@/components/features/job-card";
import { TodaySummaryCard } from "@/components/features/today-summary-card";
import { CourtesyCarInventoryCard } from "@/components/features/courtesy-car-inventory-card";
import { ServiceKindSummaryCard } from "@/components/features/service-kind-summary-card";
import { LongTermProjectSummaryCard } from "@/components/features/long-term-project-summary-card";
import { SummaryCarousel } from "@/components/features/summary-carousel";
import { JobSearchBar } from "@/components/features/job-search-bar";
import { CourtesyCarSelectDialog } from "@/components/features/courtesy-car-select-dialog";
import { MechanicSelectDialog } from "@/components/features/mechanic-select-dialog";
import {
  fetchTodayJobs,
  fetchAvailableTags,
  fetchAllTags,
  fetchAllCourtesyCars,
  checkIn,
  assignMechanic,
} from "@/lib/api";
import { toast } from "sonner";
import { Car, Tag, Loader2, TrendingUp, BarChart3, X, Search, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/app-header";
import { ErrorLampInputDialog } from "@/components/features/error-lamp-input-dialog";
import { ErrorLampInfo } from "@/lib/error-lamp-types";
import { LongTermProjectCard } from "@/components/features/long-term-project-card";
import { extractLongTermProjects } from "@/lib/long-term-project-utils";
import { useRealtime } from "@/hooks/use-realtime";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { useOptimisticUpdate } from "@/hooks/use-optimistic-update";
import { useDebounce } from "@/hooks/use-debounce";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { OfflineBanner, OnlineBanner } from "@/components/features/offline-banner";
import { SyncIndicator } from "@/components/features/sync-indicator";
import { fetchCustomerById } from "@/lib/api";
import { sendLineNotification, generateMagicLink } from "@/lib/line-api";
import { createNotificationMessage } from "@/lib/line-templates";
import { QrScanDialog } from "@/components/features/qr-scan-dialog";
import { addSearchHistory, getSearchHistory, type SearchHistoryItem } from "@/lib/search-history";

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

/**
 * 全タグを取得するフェッチャー
 */
async function allTagsFetcher(): Promise<SmartTag[]> {
  const result = await fetchAllTags();
  if (!result.success) {
    throw new Error(result.error?.message ?? "タグの取得に失敗しました");
  }
  return result.data!;
}

/**
 * 全代車を取得するフェッチャー
 */
async function courtesyCarsFetcher(): Promise<CourtesyCar[]> {
  const result = await fetchAllCourtesyCars();
  if (!result.success) {
    throw new Error(result.error?.message ?? "代車の取得に失敗しました");
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

/**
 * ジョブリストコンポーネント
 */
function JobList({
  jobs,
  onCheckIn,
  courtesyCars,
}: {
  jobs: ZohoJob[];
  onCheckIn: (jobId: string) => void;
  courtesyCars: CourtesyCar[];
}) {
  return (
    <div
      id="jobs-section"
      className="space-y-4 scroll-mt-20"
      role="region"
      aria-label="ジョブリスト"
      aria-live="polite"
      aria-atomic="false"
      aria-describedby="jobs-section-description"
    >
      <div id="jobs-section-description" className="sr-only">
        {jobs.length}件のジョブが表示されています。
      </div>
      {jobs.map((job, index) => (
        <div
          key={job.id}
          id={index === 0 ? "first-job-card" : undefined}
        >
          <JobCard
            job={job}
            onCheckIn={() => onCheckIn(job.id)}
            courtesyCars={courtesyCars}
          />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function Home() {

  // SWRでデータ取得
  const {
    data: jobs,
    error: jobsError,
    isLoading: isJobsLoading,
    mutate: mutateJobs,
  } = useSWR("today-jobs", jobsFetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
    dedupingInterval: 1000, // 開発時は短縮
  });

  // リアルタイム更新（Server-Sent Events方式）
  useRealtime({
    onJobUpdated: (jobId, data) => {
      console.log("[Realtime] ジョブが更新されました:", jobId);
      // SWRキャッシュを再検証
      mutateJobs();
    },
    onJobCreated: (jobId, data) => {
      console.log("[Realtime] ジョブが作成されました:", jobId);
      mutateJobs();
    },
    onSyncRequired: () => {
      console.log("[Realtime] 同期が必要です");
      mutateJobs();
    },
  }, {
    // intervalMsは後方互換性のため残すが、SSEでは使用しない
    enabled: true,
  });

  // 自動同期（オフライン対応の強化）
  const { pendingCount, isSyncing, sync, refreshPendingCount } = useAutoSync({
    intervalMs: 30000, // 30秒ごと
    enabled: true,
  });

  // オプティミスティックUI更新
  const { mutate: optimisticMutate } = useOptimisticUpdate();

  const {
    data: availableTags,
    error: tagsError,
    isLoading: isTagsLoading,
    mutate: mutateTags,
  } = useSWR("available-tags", tagsFetcher, {
    revalidateOnFocus: false,
  });

  const {
    data: allTags,
    error: allTagsError,
    isLoading: isAllTagsLoading,
    mutate: mutateAllTags,
  } = useSWR("all-tags", allTagsFetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
  });

  const {
    data: courtesyCars,
    error: courtesyCarsError,
    isLoading: isCourtesyCarsLoading,
    mutate: mutateCourtesyCars,
  } = useSWR("courtesy-cars", courtesyCarsFetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: true,
  });

  // State管理
  const [selectedJob, setSelectedJob] = useState<ZohoJob | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isCourtesyCarDialogOpen, setIsCourtesyCarDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("すべて");
  const [isMechanicDialogOpen, setIsMechanicDialogOpen] = useState(false);
  const [isAssigningMechanic, setIsAssigningMechanic] = useState(false);
  const [isErrorLampDialogOpen, setIsErrorLampDialogOpen] = useState(false);
  const [errorLampInfo, setErrorLampInfo] = useState<ErrorLampInfo | undefined>();
  const [isQrScanDialogOpen, setIsQrScanDialogOpen] = useState(false);
  const [selectedServiceKind, setSelectedServiceKind] = useState<ServiceKind | null>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  // 検索クエリのデバウンス（300ms）
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  /**
   * Check-inボタンクリック時のハンドラ
   */
  const handleCheckIn = (job: ZohoJob) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  /**
   * タグ選択時のハンドラ
   * タグ選択後、故障診断の場合はエラーランプ入力ダイアログを表示、それ以外は代車選択ダイアログを表示
   */
  const handleTagSelect = (tagId: string) => {
    if (!selectedJob) return;
    
    setSelectedTagId(tagId);
    setIsDialogOpen(false); // タグ選択ダイアログを閉じる
    
    // 故障診断の場合はエラーランプ入力ダイアログを表示
    const serviceKinds = selectedJob.field_service_kinds || (selectedJob.serviceKind ? [selectedJob.serviceKind] : []);
    const isFaultDiagnosis = serviceKinds.includes("故障診断" as ServiceKind);
    
    if (isFaultDiagnosis) {
      setIsErrorLampDialogOpen(true);
    } else {
      setIsCourtesyCarDialogOpen(true); // 代車選択ダイアログを開く
    }
  };

  /**
   * エラーランプ情報確定時のハンドラ
   * エラーランプ情報確定後、代車選択ダイアログを表示
   */
  const handleErrorLampConfirm = (info: ErrorLampInfo) => {
    setErrorLampInfo(info);
    setIsErrorLampDialogOpen(false);
    setIsCourtesyCarDialogOpen(true); // 代車選択ダイアログを開く
  };

  /**
   * 代車選択時のハンドラ
   * 代車選択（または「代車不要」）後、チェックイン処理を実行
   */
  const handleCourtesyCarSelect = async (carId: string | null) => {
    if (!selectedJob || !selectedTagId) return;

    setIsCheckingIn(true);
    triggerHapticFeedback("medium"); // ハプティックフィードバック

    try {
      // エラーランプ情報をcheckIn APIに渡す（Zoho CRMのfield7に保存）
      // オプティミスティックUI更新：ジョブのステータスを即座に更新
      const optimisticJob: ZohoJob = {
        ...selectedJob,
        tagId: selectedTagId,
        field22: new Date().toISOString(),
        arrivalDateTime: new Date().toISOString(),
        field5: "入庫済み",
        stage: "入庫済み",
      };

      await optimisticMutate({
        cacheKey: "today-jobs",
        updateFn: async () => {
          const result = await checkIn(
            selectedJob.id,
            selectedTagId
          );
          if (!result.success) {
            throw new Error(result.error?.message || "チェックインに失敗しました");
          }
          
          // 入庫完了のLINE通知を送信
          try {
            const customer = await fetchCustomerById(selectedJob.field4?.id || "");
            if (customer.success && customer.data?.Business_Messaging_Line_Id) {
              const serviceKinds = selectedJob.field_service_kinds || (selectedJob.serviceKind ? [selectedJob.serviceKind] : []);
              const serviceKind = serviceKinds.length > 0 ? serviceKinds[0] : "その他";
              
              await sendLineNotification({
                lineUserId: customer.data.Business_Messaging_Line_Id || "",
                type: "check_in",
                jobId: selectedJob.id,
                data: {
                  customerName: selectedJob.field4?.name || "お客様",
                  vehicleName: selectedJob.field6?.name || "車両",
                  licensePlate: selectedJob.field6?.name ? selectedJob.field6.name.split(" / ")[1] || undefined : undefined,
                  serviceKind,
                },
              });
            }
          } catch (error) {
            console.warn("LINE通知送信エラー（チェックイン）:", error);
            // LINE通知の失敗はチェックイン処理を止めない
          }
          
          // 成功時は最新データを取得
          const updatedJobs = await fetchTodayJobs();
          return updatedJobs.data || [];
        },
        optimisticData: (currentJobs: ZohoJob[] | undefined) => {
          if (!currentJobs) return [];
          return currentJobs.map((job) =>
            job.id === selectedJob.id ? optimisticJob : job
          );
        },
        successMessage: "チェックイン完了",
        errorMessage: "チェックインに失敗しました",
        onSuccess: () => {
          triggerHapticFeedback("success"); // 成功時のハプティックフィードバック
          const carInfo = carId ? ` + 代車` : "";
          const lampInfo = errorLampInfo?.hasErrorLamp
            ? ` + エラーランプ: ${errorLampInfo.lampTypes.join(", ")}`
            : "";
          toast.success("チェックイン完了", {
            description: `${selectedJob.field4?.name}様 → タグ ${selectedTagId}${carInfo}${lampInfo}`,
          });
        },
        onError: () => {
          triggerHapticFeedback("error"); // エラー時のハプティックフィードバック
        },
      });

      // タグと代車のキャッシュも更新
      await mutateTags();
      await mutateAllTags();
      await mutateCourtesyCars();

      setIsCourtesyCarDialogOpen(false);
      setSelectedJob(null);
      setSelectedTagId(null);
      setErrorLampInfo(undefined);
    } catch (error) {
      console.error("Check-in error:", error);
      triggerHapticFeedback("error");
    } finally {
      setIsCheckingIn(false);
    }
  };

  /**
   * 代車不要ボタンクリック時のハンドラ
   */
  const handleSkipCourtesyCar = () => {
    handleCourtesyCarSelect(null);
  };

  /**
   * タグ選択ダイアログを閉じる
   */
  const handleDialogClose = (open: boolean) => {
    if (isCheckingIn) return; // 処理中は閉じない
    setIsDialogOpen(open);
    if (!open) {
      setSelectedJob(null);
      setSelectedTagId(null);
    }
  };

  /**
   * 代車選択ダイアログを閉じる
   */
  const handleCourtesyCarDialogClose = (open: boolean) => {
    if (isCheckingIn) return; // 処理中は閉じない
    setIsCourtesyCarDialogOpen(open);
    if (!open) {
      // 代車選択をキャンセルした場合、タグ選択ダイアログに戻る
      if (selectedTagId) {
        setIsDialogOpen(true);
      } else {
        setSelectedJob(null);
        setSelectedTagId(null);
      }
    }
  };

  /**
   * 診断開始時のハンドラ
   * 整備士選択モーダルを表示
   */
  const handleStartDiagnosis = (job: ZohoJob) => {
    setSelectedJob(job);
    setIsMechanicDialogOpen(true);
  };

  /**
   * 整備士選択時のハンドラ
   * 整備士を割り当ててから診断画面へ遷移
   */
  const handleMechanicSelect = async (mechanicName: string) => {
    if (!selectedJob) return;

    setIsAssigningMechanic(true);
    triggerHapticFeedback("medium"); // ハプティックフィードバック

    try {
      // オプティミスティックUI更新：ジョブの整備士を即座に更新
      const optimisticJob: ZohoJob = {
        ...selectedJob,
        assignedMechanic: mechanicName,
      };

      await optimisticMutate({
        cacheKey: "today-jobs",
        updateFn: async () => {
          const result = await assignMechanic(selectedJob.id, mechanicName);
          if (!result.success) {
            throw new Error(result.error?.message || "整備士の割り当てに失敗しました");
          }
          // 成功時は最新データを取得
          const updatedJobs = await fetchTodayJobs();
          return updatedJobs.data || [];
        },
        optimisticData: (currentJobs: ZohoJob[] | undefined) => {
          if (!currentJobs) return [];
          return currentJobs.map((job) =>
            job.id === selectedJob.id ? optimisticJob : job
          );
        },
        successMessage: "担当整備士を割り当てました",
        errorMessage: "整備士の割り当てに失敗しました",
        onSuccess: () => {
          triggerHapticFeedback("success"); // 成功時のハプティックフィードバック
          toast.success("担当整備士を割り当てました", {
            description: `${selectedJob.field4?.name}様 → ${mechanicName}`,
          });
          
          // 整備士名をlocalStorageに保存（診断画面での自動割り当て用）
          // 将来の認証システム実装時に削除
          try {
            localStorage.setItem("currentMechanic", mechanicName);
          } catch (error) {
            console.error("[Home] localStorage保存エラー:", error);
            // localStorage保存失敗時も続行（診断画面で再度選択可能）
          }
        },
        onError: () => {
          triggerHapticFeedback("error"); // エラー時のハプティックフィードバック
        },
      });

      // 診断画面へ遷移
      window.location.href = `/mechanic/diagnosis/${selectedJob.id}`;
    } catch (error) {
      console.error("Mechanic assignment error:", error);
      triggerHapticFeedback("error");
    } finally {
      setIsAssigningMechanic(false);
      setIsMechanicDialogOpen(false);
      setSelectedJob(null);
    }
  };

  /**
   * 整備士選択ダイアログを閉じる
   */
  const handleMechanicDialogClose = (open: boolean) => {
    if (isAssigningMechanic) return; // 処理中は閉じない
    setIsMechanicDialogOpen(open);
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
    await mutateAllTags();
    await mutateCourtesyCars();
    toast.success("データを更新しました");
  };

  /**
   * 検索・フィルターロジック
   */
  const filteredJobs = jobs?.filter((job) => {
    // ステータスフィルター
    if (selectedStatus !== "すべて") {
      const statusMap: Record<string, string> = {
        入庫待ち: "入庫待ち",
        診断待ち: "入庫済み",
        見積作成待ち: "見積作成待ち",
        作業待ち: "作業待ち",
        引渡待ち: "出庫待ち",
      };
      if (statusMap[selectedStatus] && job.field5 !== statusMap[selectedStatus]) {
        return false;
      }
    }

    // 入庫区分フィルター
    if (selectedServiceKind) {
      const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
      if (!serviceKinds.includes(selectedServiceKind)) {
        return false;
      }
    }

    // 検索フィルター（デバウンス済みクエリを使用）
    if (!debouncedSearchQuery.trim()) return true;

    const query = debouncedSearchQuery.toLowerCase();
    const customerName = job.field4?.name?.toLowerCase() ?? "";
    const vehicleName = job.field6?.name?.toLowerCase() ?? "";
    const tagId = job.tagId?.toLowerCase() ?? "";

    return (
      customerName.includes(query) ||
      vehicleName.includes(query) ||
      tagId.includes(query)
    );
  }) ?? [];

  // 長期プロジェクトを抽出（フィルタリング後のジョブから）
  const longTermProjects = useMemo(() => {
    if (!filteredJobs) return [];
    return extractLongTermProjects(filteredJobs);
  }, [filteredJobs]);

  // 時系列順にソート（入庫予定時間順）
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const timeA = a.field22 ? new Date(a.field22).getTime() : 0;
    const timeB = b.field22 ? new Date(b.field22).getTime() : 0;
    return timeA - timeB;
  });

  // ステータス別にグループ化
  const groupedJobs = sortedJobs.reduce((acc, job) => {
    const status = job.field5;
    if (!acc[status]) acc[status] = [];
    acc[status].push(job);
    return acc;
  }, {} as Record<string, ZohoJob[]>);

  // ステータスの表示順序
  const statusOrder = [
    "入庫待ち",
    "入庫済み",
    "見積作成待ち",
    "見積提示済み",
    "作業待ち",
    "出庫待ち",
    "出庫済み",
  ];

  // エラー状態
  if (jobsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-3 shrink-0" />
          <p className="text-red-600 font-semibold mb-2">データの取得に失敗しました</p>
          <Button onClick={() => mutateJobs()} className="gap-2">
            <Loader2 className="h-4 w-4 shrink-0" />
            再試行
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* スキップリンク（アクセシビリティ） */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        メインコンテンツへスキップ
      </a>

      {/* オフライン/オンラインバナー */}
      <OfflineBanner />
      <OnlineBanner />
      
      <AppHeader hideBrandOnScroll={false} />

      {/* メインコンテンツ */}
      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full" role="main" aria-label="メインコンテンツ">
        {/* 同期インジケーター（問題がある時だけ表示） */}
        {(isSyncing || pendingCount > 0) && (
          <div className="flex items-center justify-end gap-2 mb-4">
            <SyncIndicator
              status={isSyncing ? "syncing" : "pending"}
              pendingCount={pendingCount}
              onClick={pendingCount > 0 ? () => sync() : undefined}
            />
          </div>
        )}

        {/* サマリーセクション */}
        <div className="mb-6">
          {/* セクションタイトル */}
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-slate-600 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900">サマリー</h2>
          </div>

          {/* サマリーカード */}
          {isJobsLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              <Skeleton className="h-32 w-[calc(100vw-3rem)] sm:w-[320px] flex-shrink-0 snap-start" />
              <Skeleton className="h-32 w-[calc(100vw-3rem)] sm:w-[320px] flex-shrink-0 snap-start" />
              <Skeleton className="h-32 w-[calc(100vw-3rem)] sm:w-[320px] flex-shrink-0 snap-start" />
              <Skeleton className="h-32 w-[calc(100vw-3rem)] sm:w-[320px] flex-shrink-0 snap-start" />
            </div>
          ) : (
            <SummaryCarousel>
              {/* 1. 本日の状況 */}
              <TodaySummaryCard 
                jobs={jobs ?? []}
              />
              {/* 2. 入庫区分別 */}
              <ServiceKindSummaryCard
                jobs={jobs ?? []}
                onServiceKindClick={(serviceKind) => {
                  setSelectedServiceKind(serviceKind);
                  // フィルター適用時にスクロール（最初のカードが見える位置に）
                  setTimeout(() => {
                    const firstCard = document.getElementById("first-job-card");
                    if (firstCard) {
                      firstCard.scrollIntoView({ behavior: "smooth", block: "center" });
                    } else {
                      // フォールバック: jobs-sectionにスクロール
                      const jobsSection = document.getElementById("jobs-section");
                      if (jobsSection) {
                        jobsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }
                  }, 150);
                }}
              />
              {/* 3. 長期プロジェクト */}
              <LongTermProjectSummaryCard
                jobs={jobs ?? []}
                onScrollToProjects={() => {
                  // 長期プロジェクトセクションまでスクロール
                  const projectsSection = document.getElementById("long-term-projects");
                  if (projectsSection) {
                    projectsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              />
              {/* 4. 代車在庫 */}
              {isCourtesyCarsLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : courtesyCarsError ? (
                <Card className="h-full flex flex-col border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                      <Car className="h-4 w-4 shrink-0" />
                      代車在庫
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-red-600 mb-2">代車情報の取得に失敗しました</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => mutateCourtesyCars()}
                        className="text-xs"
                      >
                        再試行
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <CourtesyCarInventoryCard cars={courtesyCars ?? []} />
              )}
            </SummaryCarousel>
          )}
        </div>

        {/* 車両一覧セクション */}
        <div className="mb-6">
          {/* セクションタイトル */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900">車両一覧</h2>
              {!isJobsLoading && jobs && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                  {filteredJobs.length}件
                </Badge>
              )}
            </div>
            {!isJobsLoading && jobs && filteredJobs.length > 0 && (
              <span className="text-xs text-slate-500">
                全 {jobs.length} 件
                {searchQuery && (
                  <>
                    {" / "}
                    検索結果: {filteredJobs.length} 件
                  </>
                )}
              </span>
            )}
          </div>

          {/* 検索バー */}
          <div className="mb-4">
            <JobSearchBar
              value={searchQuery}
              onChange={(newValue) => {
                setSearchQuery(newValue);
                if (newValue.trim()) {
                  addSearchHistory(newValue);
                }
              }}
            />
          </div>

          {/* 車両一覧コンテンツ */}
          {/* ローディング状態 */}
          {isJobsLoading && (
            <div className="space-y-4">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          )}

          {/* ジョブカードリスト */}
          {!isJobsLoading && jobs && sortedJobs.length > 0 && (
            <JobList
              jobs={sortedJobs}
              onCheckIn={(jobId: string) => {
                const job = jobs?.find(j => j.id === jobId);
                if (job) {
                  handleCheckIn(job);
                }
              }}
              courtesyCars={courtesyCars ?? []}
            />
          )}

          {/* 空の場合の表示 */}
          {!isJobsLoading && (
            <>
              {jobs?.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">本日の入庫予定はありません</p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">該当する案件がありません</p>
                  <p className="text-sm text-slate-400 mt-2">
                    フィルター条件を変更してください
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* 長期プロジェクトセクション */}
        {longTermProjects.length > 0 && (
          <div id="long-term-projects" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 shrink-0" />
                長期プロジェクト
              </h2>
              <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {longTermProjects.length}件
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {longTermProjects.map((project) => (
                <LongTermProjectCard
                  key={project.jobId}
                  project={project}
                  courtesyCars={courtesyCars}
                  onClick={() => {
                    // 作業画面に遷移
                    window.location.href = `/mechanic/work/${project.jobId}`;
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="mt-auto py-6 text-center text-sm text-slate-400">
        <p className="mb-1">ワイエムワークス｜デジタルガレージ</p>
        <p>© YMWORKS. All rights reserved.</p>
      </footer>

      {/* タグ選択ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 shrink-0" />
              タグ紐付け: {selectedJob?.field4?.name ?? "---"} 様
            </DialogTitle>
            <DialogDescription>
              使用するスマートタグを選択してください
              <br />
              <span className="text-xs text-slate-500 mt-1 block">
                ※使用中のタグは選択できません
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* タグ選択グリッド（全タグ表示、使用済みはグレーアウト） */}
          {isAllTagsLoading ? (
            <div className="grid grid-cols-3 gap-3 py-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : allTagsError ? (
            <div className="py-4 text-center">
              <p className="text-sm text-red-600 mb-3">タグの取得に失敗しました</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutateAllTags()}
                className="text-xs"
              >
                再試行
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 py-4">
              {allTags?.map((tag) => {
                const isAvailable = tag.status === "available";
                const isInUse = tag.status === "in_use";
                const isClosed = tag.status === "closed";

                return (
                  <Button
                    key={tag.tagId}
                    variant={isAvailable ? "outline" : "ghost"}
                    size="lg"
                    className={cn(
                      "h-16 text-2xl font-bold transition-all duration-200 relative",
                      isAvailable &&
                        "hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:shadow-md border-2 border-slate-300",
                      isInUse &&
                        "opacity-50 cursor-not-allowed bg-slate-100 border border-slate-200",
                      isClosed &&
                        "opacity-30 cursor-not-allowed bg-slate-50 border border-slate-100"
                    )}
                    onClick={() => isAvailable && handleTagSelect(tag.tagId)}
                    disabled={isCheckingIn || !isAvailable}
                  >
                    {isCheckingIn && isAvailable ? (
                      <Loader2 className="h-6 w-6 animate-spin shrink-0" />
                    ) : (
                      <>
                        {tag.tagId}
                        {isInUse && (
                          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            使用中
                          </span>
                        )}
                        {isClosed && (
                          <span className="absolute -top-1 -right-1 bg-slate-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            閉鎖
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                );
              })}
              {allTags?.length === 0 && (
                <p className="col-span-3 text-center text-slate-500 py-4">
                  タグが登録されていません
                </p>
              )}
              {allTags && allTags.filter((t) => t.status === "available").length === 0 && (
                <p className="col-span-3 text-center text-orange-600 py-4 font-medium">
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
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>チェックイン処理中...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 代車選択ダイアログ */}
      <CourtesyCarSelectDialog
        open={isCourtesyCarDialogOpen}
        onOpenChange={handleCourtesyCarDialogClose}
        cars={courtesyCars}
        isLoading={isCourtesyCarsLoading}
        isProcessing={isCheckingIn}
        onSelect={handleCourtesyCarSelect}
        onSkip={handleSkipCourtesyCar}
      />

      {/* 整備士選択ダイアログ */}
      <MechanicSelectDialog
        open={isMechanicDialogOpen}
        onOpenChange={handleMechanicDialogClose}
        isLoading={false}
        isProcessing={isAssigningMechanic}
        onSelect={handleMechanicSelect}
      />

      {/* エラーランプ入力ダイアログ（故障診断の場合のみ） */}
      <ErrorLampInputDialog
        open={isErrorLampDialogOpen}
        onOpenChange={setIsErrorLampDialogOpen}
        errorLampInfo={errorLampInfo}
        onConfirm={handleErrorLampConfirm}
        disabled={isCheckingIn}
      />

      {/* QRコードスキャンダイアログ（シンプル版） */}
      <QrScanDialog
        open={isQrScanDialogOpen}
        onOpenChange={setIsQrScanDialogOpen}
        onScanSuccess={(scannedValue) => {
          // スキャン結果を検索バーに設定
          setSearchQuery(scannedValue);
          addSearchHistory(scannedValue);
        }}
      />
    </div>
  );
}
