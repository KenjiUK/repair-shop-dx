"use client";

import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ZohoJob, SmartTag, CourtesyCar, ServiceKind, WorkOrderStatus } from "@/types";
import { serializeWorkOrdersForZoho } from "@/lib/work-order-converter";
import { JobCard } from "@/components/features/job-card";
import { JobList, JobCardSkeleton } from "@/components/features/job-list";
import dynamic from "next/dynamic";
import { AnnouncementBanner } from "@/components/features/announcement-banner";
import { getActiveAnnouncements } from "@/lib/announcement-config";
import { CourtesyCarSelectDialog } from "@/components/features/courtesy-car-select-dialog";
import { MechanicSelectDialog } from "@/components/features/mechanic-select-dialog";
import { JobFilterDialog } from "@/components/features/job-filter-dialog";
import { TagSelectionDialog } from "@/components/features/tag-selection-dialog";

// 重いコンポーネントを動的インポート（Phase 10-2）
const TodayScheduleCard = dynamic(
  () => import("@/components/features/today-schedule-card").then(mod => mod.TodayScheduleCard),
  {
    ssr: true,
    loading: () => <Skeleton className="h-[400px] w-full" />,
  }
);
import {
  fetchTodayJobs,
  fetchAvailableTags,
  fetchAllTags,
  fetchAllCourtesyCars,
  checkIn,
  assignMechanic,
  unlinkTagFromJob,
} from "@/lib/api";
import { toast } from "sonner";
import { Car, Tag, Loader2, TrendingUp, X, FileText, AlertCircle, Calendar, CalendarCheck, Users, Package, ChevronDown, AlertTriangle, Activity, Wrench, ShieldCheck, Droplet, Circle, Zap, Sparkles, Paintbrush, Shield, Filter, Settings, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AppHeader } from "@/components/layout/app-header";
import { NotificationBell } from "@/components/features/notification-bell";
import { ErrorLampInputDialog } from "@/components/features/error-lamp-input-dialog";
import { ErrorLampInfo } from "@/lib/error-lamp-types";
import { extractLongTermProjects } from "@/lib/long-term-project-utils";
import { InspectionEntryChecklistDialog } from "@/components/features/inspection-entry-checklist-dialog";
import { parseInspectionChecklistFromField7, appendInspectionChecklistToField7 } from "@/lib/inspection-checklist-parser";
import { InspectionChecklist } from "@/types";
import { updateJobField7 } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { useOptimisticUpdate } from "@/hooks/use-optimistic-update";
import { useDebounce } from "@/hooks/use-debounce";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";
import { OfflineBanner, OnlineBanner } from "@/components/features/offline-banner";
import { SyncIndicator } from "@/components/features/sync-indicator";
import { fetchCustomerById } from "@/lib/api";
import { sendLineNotification } from "@/lib/line-api";
import { QrScanDialog } from "@/components/features/qr-scan-dialog";
import { addSearchHistory } from "@/lib/search-history";
import { withFetcherTiming } from "@/lib/api-timing";
import { usePageTiming } from "@/hooks/use-page-timing";
import { FilterState, applyFilters, resetFilters, getActiveFilterCount } from "@/lib/filter-utils";
import { isImportantCustomer } from "@/lib/important-customer-flag";
import { searchJobs } from "@/lib/search-utils";
import { parseWorkOrdersFromZoho } from "@/lib/work-order-converter";

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


// =============================================================================
// Main Page Component
// =============================================================================

function HomeContent() {
  // ページ表示時間の計測
  usePageTiming("home", true);

  // メモリリーク防止: タイマーIDを保持するref
  const scrollTimersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMountedRef = useRef(true);

  // アンマウント時にタイマーをクリーンアップ
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      scrollTimersRef.current.forEach((timer) => clearTimeout(timer));
      scrollTimersRef.current.clear();
    };
  }, []);

  // お知らせバナーの設定
  const activeAnnouncements = useMemo(() => getActiveAnnouncements(), []);

  // SWRでデータ取得（API応答時間を計測）
  // オフライン対応: revalidateOnFocus: false、revalidateOnReconnect: trueを設定
  // SWRはデフォルトでキャッシュを保持するため、前回のデータは即座に表示される
  const {
    data: jobs,
    error: jobsError,
    isLoading: isJobsLoading,
    isValidating: isJobsValidating,
    mutate: mutateJobs,
  } = useSWR("today-jobs", withFetcherTiming(jobsFetcher, "fetchTodayJobs", "home"), {
    // グローバル設定を使用（swrGlobalConfig）
    // 必要に応じて個別設定で上書き可能
    revalidateOnMount: true, // 初回のみ再検証
    // その他の設定はグローバル設定を継承
  });

  // 開発環境用：車検と12ヶ月点検のサンプルJOBカードを追加
  const jobsWithSamples = useMemo(() => {
    if (process.env.NODE_ENV !== "development" || !jobs) return jobs;

    const sampleJobs: ZohoJob[] = [
      {
        id: "sample-shaken-001",
        field4: { id: "customer-001", name: "山田太郎" },
        field6: { id: "vehicle-001", name: "トヨタ プリウス / 品川 300 あ 1234" },
        field5: "作業待ち",
        stage: "作業待ち",
        field22: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2時間前に入庫
        arrivalDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        serviceKind: "車検",
        field_service_kinds: ["車検"],
        tagId: "T01",
        assignedMechanic: "中村",
        field: null,
        workOrder: null,
        field7: null,
        field10: 50000,
        mileage: 50000,
        field13: null,
        field19: null,
        field12: null,
        ID_BookingId: "booking-sample-shaken-001",
        bookingId: "booking-sample-shaken-001",
        field_work_orders: serializeWorkOrdersForZoho([
          {
            id: "wo-sample-shaken-001",
            jobId: "sample-shaken-001",
            serviceKind: "車検" as ServiceKind,
            status: "作業待ち" as WorkOrderStatus,
            diagnosis: {
              items: [],
              photos: [],
              startedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5時間前に診断開始
            },
            estimate: {
              items: [],
            },
            work: null,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
        ]),
      },
      {
        id: "sample-12month-001",
        field4: { id: "customer-002", name: "佐藤花子" },
        field6: { id: "vehicle-002", name: "ホンダ N-BOX / 世田谷 500 さ 5678" },
        field5: "出庫待ち",
        stage: "出庫待ち",
        field22: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4時間前に入庫
        arrivalDateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        serviceKind: "12ヵ月点検",
        field_service_kinds: ["12ヵ月点検"],
        tagId: "T02",
        assignedMechanic: "中村",
        field: null,
        workOrder: null,
        field7: null,
        field10: 30000,
        mileage: 30000,
        field13: null,
        field19: null,
        field12: null,
        ID_BookingId: "booking-sample-12month-001",
        bookingId: "booking-sample-12month-001",
        field_work_orders: serializeWorkOrdersForZoho([
          {
            id: "wo-sample-12month-001",
            jobId: "sample-12month-001",
            serviceKind: "12ヵ月点検" as ServiceKind,
            status: "完了" as WorkOrderStatus,
            diagnosis: {
              items: [],
              photos: [],
              startedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), // 3.5時間前に診断開始
            },
            estimate: {
              items: [],
            },
            work: {
              startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2時間前に作業開始
              completedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分前に作業完了
            },
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          },
        ]),
      },
    ];

    return [...sampleJobs, ...jobs];
  }, [jobs]);

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
  const { pendingCount, isSyncing, sync } = useAutoSync({
    intervalMs: 30000, // 30秒ごと
    enabled: true,
  });

  // オプティミスティックUI更新
  const { mutate: optimisticMutate } = useOptimisticUpdate();

  const {
    data: availableTags,
    mutate: mutateTags,
  } = useSWR("available-tags", withFetcherTiming(tagsFetcher, "fetchAvailableTags", "home"), {
    // グローバル設定を使用（swrGlobalConfig）
    // タグ情報は頻繁に変更されるため、初回のみ再検証
    revalidateOnMount: true, // 初回のみ再検証
    // その他の設定はグローバル設定を継承（revalidateOnFocus: false, revalidateOnReconnect: true）
  });

  const {
    data: allTags,
    error: allTagsError,
    isLoading: isAllTagsLoading,
    mutate: mutateAllTags,
  } = useSWR("all-tags", withFetcherTiming(allTagsFetcher, "fetchAllTags", "home"), {
    // グローバル設定を使用（swrGlobalConfig）
    // タグ情報は頻繁に変更されるため、初回のみ再検証
    revalidateOnMount: true, // 初回のみ再検証
    // その他の設定はグローバル設定を継承（revalidateOnFocus: false, revalidateOnReconnect: true）
  });

  const {
    data: courtesyCars,
    isLoading: isCourtesyCarsLoading,
    mutate: mutateCourtesyCars,
  } = useSWR("courtesy-cars", withFetcherTiming(courtesyCarsFetcher, "fetchAllCourtesyCars", "home"), {
    // グローバル設定を使用（swrGlobalConfig）
    // 代車情報は頻繁に変更されるため、初回のみ再検証
    revalidateOnMount: true, // 初回マウント時にデータを取得
    // その他の設定はグローバル設定を継承（revalidateOnFocus: false, revalidateOnReconnect: true）
  });

  // State管理
  const [selectedJob, setSelectedJob] = useState<ZohoJob | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isCourtesyCarDialogOpen, setIsCourtesyCarDialogOpen] = useState(false);
  // タグ使用中エラー時の確認ダイアログ
  const [isTagInUseDialogOpen, setIsTagInUseDialogOpen] = useState(false);
  const [tagInUseError, setTagInUseError] = useState<{ tagId: string; message: string } | null>(null);
  // フィルター状態管理（改善提案 #1: フィルター機能の強化）
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    serviceKind: [],
    mechanic: [],
    isUrgent: null,
    isImportant: null,
    partsProcurement: null,
    longPendingApproval: null,
    longPartsProcurement: null,
  });


  const [isMechanicDialogOpen, setIsMechanicDialogOpen] = useState(false);
  const [isAssigningMechanic, setIsAssigningMechanic] = useState(false);
  const [isErrorLampDialogOpen, setIsErrorLampDialogOpen] = useState(false);
  const [errorLampInfo, setErrorLampInfo] = useState<ErrorLampInfo | undefined>();
  const [isQrScanDialogOpen, setIsQrScanDialogOpen] = useState(false);
  const [isInspectionEntryChecklistDialogOpen, setIsInspectionEntryChecklistDialogOpen] = useState(false);
  const [inspectionChecklist, setInspectionChecklist] = useState<InspectionChecklist | null>(null);

  // トップページ改善機能の状態管理
  const [sortOption, setSortOption] = useState<"arrivalTime" | "arrivalTimeDesc" | "bookingTime" | "status">("arrivalTime");

  // フィルターモーダルの状態管理
  const [filterModalType, setFilterModalType] = useState<"status" | "serviceKind" | "mechanic" | "additional" | null>(null);

  // Phase 2: サマリーカードは常に展開（UIUXベストプラクティス: サマリーカードは「一目で状況を把握する」ためのもの）
  // 展開操作が必要な時点で既にUXが悪いため、すべてのカードを常に展開

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
  const handleTagSelect = async (tagId: string) => {
    if (!selectedJob) return;

    setSelectedTagId(tagId);
    setIsDialogOpen(false); // タグ選択ダイアログを閉じる

    // 故障診断の場合はエラーランプ入力ダイアログを表示
    const serviceKinds = selectedJob.field_service_kinds || (selectedJob.serviceKind ? [selectedJob.serviceKind] : []);
    const isFaultDiagnosis = serviceKinds.includes("故障診断" as ServiceKind);

    if (isFaultDiagnosis) {
      setIsErrorLampDialogOpen(true);
    } else {
      // 代車選択ダイアログを開く（代車データは既にキャッシュされているため、再取得不要）
      setIsCourtesyCarDialogOpen(true);
    }
  };

  /**
   * 緊急対応フラグのリセット
   */
  const resetUrgentFlag = () => {
    setIsUrgent(false);
  };

  /**
   * エラーランプ情報確定時のハンドラ
   * エラーランプ情報確定後、代車選択ダイアログを表示
   */
  const handleErrorLampConfirm = async (info: ErrorLampInfo) => {
    setErrorLampInfo(info);
    setIsErrorLampDialogOpen(false);
    // 代車選択ダイアログを開く（代車データは既にキャッシュされているため、再取得不要）
    setIsCourtesyCarDialogOpen(true);
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
            selectedTagId,
            carId,
            isUrgent
          );
          if (!result.success) {
            // TAG_IN_USEエラーの場合、確認ダイアログを表示
            if (result.error?.code === "TAG_IN_USE") {
              setTagInUseError({
                tagId: selectedTagId,
                message: result.error.message || "タグは既に使用中です",
              });
              setIsTagInUseDialogOpen(true);
              // エラーをthrowせず、ダイアログで処理を継続
              return [];
            }
            throw new Error(result.error?.message || "チェックインに失敗しました");
          }

          // checkIn APIの結果から直接更新されたジョブを返す（fetchTodayJobs()を呼ばない）
          // オプティミスティック更新で既にUIは更新されているため、サーバーからの応答で上書きする
          const currentJobs = jobs || [];
          return currentJobs
            .map((job) =>
              job.id === selectedJob.id && result.data?.job ? result.data.job : job
            )
            .filter((job): job is ZohoJob => job !== undefined);
        },
        optimisticData: (currentJobs: ZohoJob[] | undefined) => {
          if (!currentJobs) return [];
          return currentJobs.map((job) =>
            job.id === selectedJob.id ? optimisticJob : job
          );
        },
        errorMessage: "チェックインに失敗しました",
        onSuccess: async () => {
          triggerHapticFeedback("success"); // 成功時のハプティックフィードバック
          const carInfo = carId ? ` + 代車` : "";
          const lampInfo = errorLampInfo?.hasErrorLamp
            ? ` + エラーランプ: ${errorLampInfo.lampTypes.join(", ")}`
            : "";
          // Dialogが閉じられた後にトーストを表示（グレーアウトと重ならないように）
          setTimeout(() => {
            toast.success("チェックイン完了", {
              id: "checkin-complete",
              description: `${selectedJob.field4?.name}様 → タグ ${selectedTagId}${carInfo}${lampInfo}`,
            });
          }, 300); // Dialogのアニメーション完了を待つ（300ms）

          // SWRキャッシュを再検証（最新データを取得、ただし非同期で実行してチェックイン処理をブロックしない）
          mutateJobs(undefined, { revalidate: true }).catch((error) => {
            console.warn("ジョブデータの再検証エラー:", error);
            // 再検証の失敗はチェックイン処理を止めない
          });

          // LINE通知を非同期で送信（チェックイン処理をブロックしない）
          (async () => {
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
          })();

          // Google Driveフォルダを作成してfield19を更新（フォールバック: field19がnullの場合のみ）
          if (!selectedJob.field19 && selectedJob.field4?.id && selectedJob.field6?.id && selectedJob.field22) {
            (async () => {
              try {
                const jobDate = new Date(selectedJob.field22).toISOString().slice(0, 10).replace(/-/g, "");
                const { createJobFolderAction } = await import("@/app/actions/drive");
                const { updateJobField19 } = await import("@/lib/api");
                
                const folderResult = await createJobFolderAction(
                  selectedJob.id,
                  jobDate,
                  selectedJob.ID_BookingId || selectedJob.bookingId || selectedJob.id,
                  selectedJob.field4?.id || "",
                  selectedJob.field4?.name || "顧客",
                  selectedJob.field6?.id || "",
                  selectedJob.field6?.name || "車両"
                );
                
                if (folderResult.success && folderResult.url) {
                  const updateResult = await updateJobField19(selectedJob.id, folderResult.url);
                  if (updateResult.success) {
                    console.log("[Check-in] Google Driveフォルダを作成し、field19を更新しました:", folderResult.url);
                    // ジョブデータを再取得してfield19を反映
                    mutateJobs(undefined, { revalidate: true }).catch((error) => {
                      console.warn("ジョブデータの再検証エラー（field19更新後）:", error);
                    });
                  } else {
                    console.warn("[Check-in] field19の更新に失敗しました:", updateResult.error?.message);
                  }
                } else {
                  console.warn("[Check-in] フォルダ作成に失敗しました:", folderResult.error);
                }
              } catch (error) {
                console.error("[Check-in] フォルダ作成・更新エラー:", error);
                // エラーが発生しても処理は続行（フォルダがなくても他の処理は可能）
              }
            })();
          }
        },
        onError: () => {
          triggerHapticFeedback("error"); // エラー時のハプティックフィードバック
        },
      });

      // タグと代車のキャッシュを並列で更新（パフォーマンス改善）
      await Promise.all([
        mutateTags(),
        mutateAllTags(),
        mutateCourtesyCars(),
      ]);

      setIsCourtesyCarDialogOpen(false);
      setErrorLampInfo(undefined);
      resetUrgentFlag(); // 緊急対応フラグをリセット

      // 車検・12ヵ月点検の場合、チェックリストダイアログを表示
      const serviceKinds = selectedJob.field_service_kinds || (selectedJob.serviceKind ? [selectedJob.serviceKind] : []);
      const isInspection = serviceKinds.includes("車検" as ServiceKind) || serviceKinds.includes("12ヵ月点検" as ServiceKind);

      if (isInspection) {
        // 既存のチェックリストを読み込む
        const existingChecklist = parseInspectionChecklistFromField7(selectedJob.field7, selectedJob.id);
        setInspectionChecklist(existingChecklist);
        setIsInspectionEntryChecklistDialogOpen(true);
      } else {
        setSelectedJob(null);
        setSelectedTagId(null);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      triggerHapticFeedback("error");
      setSelectedJob(null);
      setSelectedTagId(null);
    } finally {
      setIsCheckingIn(false);
    }
  };

  /**
   * タグ使用中エラー時の確認ダイアログで「解除する」を選択した場合のハンドラ
   */
  const handleUnlinkTagAndRetryCheckIn = async () => {
    if (!tagInUseError || !selectedJob || !selectedTagId) return;

    try {
      setIsCheckingIn(true);

      // 既存のタグ紐付けを解除
      const unlinkResult = await unlinkTagFromJob(tagInUseError.tagId);
      if (!unlinkResult.success) {
        throw new Error(unlinkResult.error?.message || "タグの解除に失敗しました");
      }

      toast.success("タグを解除しました", {
        description: `タグ ${tagInUseError.tagId} の紐付けを解除しました`,
      });

      // タグのキャッシュを並列で更新（パフォーマンス改善）
      await Promise.all([
        mutateTags(),
        mutateAllTags(),
        mutateJobs(),
      ]);

      // ダイアログを閉じる
      setIsTagInUseDialogOpen(false);
      const savedTagId = selectedTagId;
      const savedJob = selectedJob;
      const savedCarId = null; // 代車は既に選択済みの可能性があるが、簡易的にnullにする
      const savedIsUrgent = isUrgent;
      setTagInUseError(null);

      // チェックインを再実行（handleCourtesyCarSelectのロジックを再実行）
      // 簡易的に、代車選択をスキップしてチェックイン処理を直接実行
      const optimisticJob: ZohoJob = {
        ...savedJob,
        tagId: savedTagId,
        field22: new Date().toISOString(),
        arrivalDateTime: new Date().toISOString(),
        field5: "入庫済み",
        stage: "入庫済み",
      };

      await optimisticMutate({
        cacheKey: "today-jobs",
        updateFn: async () => {
          const result = await checkIn(
            savedJob.id,
            savedTagId,
            savedCarId,
            savedIsUrgent
          );
          if (!result.success) {
            throw new Error(result.error?.message || "チェックインに失敗しました");
          }

          // checkIn APIの結果から直接更新されたジョブを返す（fetchTodayJobs()を呼ばない）
          const currentJobs = jobs || [];
          return currentJobs
            .map((job) =>
              job.id === savedJob.id && result.data?.job ? result.data.job : job
            )
            .filter((job): job is ZohoJob => job !== undefined);
        },
        optimisticData: (currentJobs: ZohoJob[] | undefined) => {
          if (!currentJobs) return [];
          return currentJobs.map((job) =>
            job.id === savedJob.id ? optimisticJob : job
          );
        },
        errorMessage: "チェックインに失敗しました",
        onSuccess: async () => {
          triggerHapticFeedback("success");
          toast.success("チェックイン完了", {
            description: `${savedJob.field4?.name}様 → タグ ${savedTagId}`,
          });

          // SWRキャッシュを再検証（最新データを取得、ただし非同期で実行してチェックイン処理をブロックしない）
          mutateJobs(undefined, { revalidate: true }).catch((error) => {
            console.warn("ジョブデータの再検証エラー:", error);
            // 再検証の失敗はチェックイン処理を止めない
          });

          // LINE通知を非同期で送信（チェックイン処理をブロックしない）
          (async () => {
            try {
              const customer = await fetchCustomerById(savedJob.field4?.id || "");
              if (customer.success && customer.data?.Business_Messaging_Line_Id) {
                const serviceKinds = savedJob.field_service_kinds || (savedJob.serviceKind ? [savedJob.serviceKind] : []);
                const serviceKind = serviceKinds.length > 0 ? serviceKinds[0] : "その他";

                await sendLineNotification({
                  lineUserId: customer.data.Business_Messaging_Line_Id || "",
                  type: "check_in",
                  jobId: savedJob.id,
                  data: {
                    customerName: savedJob.field4?.name || "お客様",
                    vehicleName: savedJob.field6?.name || "車両",
                    licensePlate: savedJob.field6?.name ? savedJob.field6.name.split(" / ")[1] || undefined : undefined,
                    serviceKind,
                  },
                });
              }
            } catch (error) {
              console.warn("LINE通知送信エラー（チェックイン）:", error);
            }
          })();

          // Google Driveフォルダを作成してfield19を更新（フォールバック: field19がnullの場合のみ）
          if (!savedJob.field19 && savedJob.field4?.id && savedJob.field6?.id && savedJob.field22) {
            (async () => {
              try {
                const jobDate = new Date(savedJob.field22).toISOString().slice(0, 10).replace(/-/g, "");
                const { createJobFolderAction } = await import("@/app/actions/drive");
                const { updateJobField19 } = await import("@/lib/api");
                
                const folderResult = await createJobFolderAction(
                  savedJob.id,
                  jobDate,
                  savedJob.ID_BookingId || savedJob.bookingId || savedJob.id,
                  savedJob.field4?.id || "",
                  savedJob.field4?.name || "顧客",
                  savedJob.field6?.id || "",
                  savedJob.field6?.name || "車両"
                );
                
                if (folderResult.success && folderResult.url) {
                  const updateResult = await updateJobField19(savedJob.id, folderResult.url);
                  if (updateResult.success) {
                    console.log("[Check-in Retry] Google Driveフォルダを作成し、field19を更新しました:", folderResult.url);
                    // ジョブデータを再取得してfield19を反映
                    mutateJobs(undefined, { revalidate: true }).catch((error) => {
                      console.warn("ジョブデータの再検証エラー（field19更新後）:", error);
                    });
                  } else {
                    console.warn("[Check-in Retry] field19の更新に失敗しました:", updateResult.error?.message);
                  }
                } else {
                  console.warn("[Check-in Retry] フォルダ作成に失敗しました:", folderResult.error);
                }
              } catch (error) {
                console.error("[Check-in Retry] フォルダ作成・更新エラー:", error);
                // エラーが発生しても処理は続行（フォルダがなくても他の処理は可能）
              }
            })();
          }
        },
        onError: () => {
          triggerHapticFeedback("error");
        },
      });

      // キャッシュを並列で更新（パフォーマンス改善）
      await Promise.all([
        mutateTags(),
        mutateAllTags(),
        mutateCourtesyCars(),
        mutateJobs(),
      ]);

      setSelectedJob(null);
      setSelectedTagId(null);
    } catch (error) {
      console.error("Tag unlink error:", error);
      triggerHapticFeedback("error");
      toast.error("タグの解除に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  /**
   * 車検チェックリスト確定時のハンドラ
   */
  const handleInspectionChecklistConfirm = async () => {
    if (!selectedJob || !inspectionChecklist) return;

    try {
      // field7にチェックリスト情報を保存
      const updatedField7 = appendInspectionChecklistToField7(selectedJob.field7, inspectionChecklist);
      await updateJobField7(selectedJob.id, updatedField7);

      toast.success("チェックリストを保存しました");
      setIsInspectionEntryChecklistDialogOpen(false);
      setSelectedJob(null);
      setSelectedTagId(null);
      setInspectionChecklist(null);
    } catch (error) {
      console.error("Checklist save error:", error);
      const errorMessage = error instanceof Error ? error.message : "チェックリストの保存に失敗しました";
      toast.error("チェックリストの保存に失敗しました", {
        description: errorMessage,
        action: {
          label: "再試行",
          onClick: () => {
            handleInspectionChecklistConfirm();
          },
        },
        duration: 10000, // リトライボタンを表示するため、表示時間を延長
      });
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
      resetUrgentFlag(); // 緊急対応フラグをリセット
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
          // assignMechanic APIの結果から直接更新されたジョブを返す（fetchTodayJobs()を呼ばない）
          const currentJobs = jobs || [];
          return currentJobs.map((job) =>
            job.id === selectedJob.id && result.data ? result.data : job
          );
        },
        optimisticData: (currentJobs: ZohoJob[] | undefined) => {
          if (!currentJobs) return [];
          return currentJobs.map((job) =>
            job.id === selectedJob.id ? optimisticJob : job
          );
        },
        errorMessage: "整備士の割り当てに失敗しました",
        onSuccess: () => {
          triggerHapticFeedback("success"); // 成功時のハプティックフィードバック
          toast.success("担当整備士を割り当てました", {
            description: `${selectedJob.field4?.name}様 → ${mechanicName}`,
          });

          // SWRキャッシュを再検証（最新データを取得、ただし非同期で実行して処理をブロックしない）
          mutateJobs(undefined, { revalidate: true }).catch((error) => {
            console.warn("ジョブデータの再検証エラー:", error);
            // 再検証の失敗は処理を止めない
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
   * 検索・フィルターロジック（改善提案 #1, #2）
   * 
   * フィルターの優先順位:
   * 1. 複数フィルターの同時適用（FilterState）
   * 2. 検索フィルター（debouncedSearchQuery）- 改善提案 #2で強化
   */
  const filteredJobs = useMemo(() => {
    const sourceJobs = jobsWithSamples || jobs;
    if (!sourceJobs) return [];

    // TOPページ（入庫車両管理）では、デフォルトで出庫済みを除外
    // フィルターで「出庫済み」が選択されている場合のみ表示
    let filtered = sourceJobs;
    if (filters.status.length === 0 || !filters.status.includes("出庫済み")) {
      filtered = filtered.filter(job => job.field5 !== "出庫済み");
    }

    // 複数フィルターを適用（改善提案 #1）
    filtered = applyFilters(filtered, filters);

    // 検索フィルターを適用（改善提案 #2: 検索機能の実装）
    // TOPページではアクティブな案件のみを検索対象とする
    if (debouncedSearchQuery.trim()) {
      filtered = searchJobs(filtered, debouncedSearchQuery);
    }

    return filtered;
  }, [jobsWithSamples, jobs, filters, debouncedSearchQuery]);

  // 長期プロジェクトを抽出（フィルタリング後のジョブから）
  const longTermProjects = useMemo(() => {
    if (!filteredJobs) return [];
    return extractLongTermProjects(filteredJobs);
  }, [filteredJobs]);

  // WorkOrderのパース結果をメモ化（パフォーマンス改善）
  const workOrdersCache = useMemo(() => {
    const cache = new Map<string, ReturnType<typeof parseWorkOrdersFromZoho>>();
    filteredJobs.forEach((job) => {
      if (job.field_work_orders && !cache.has(job.id)) {
        try {
          cache.set(job.id, parseWorkOrdersFromZoho(job.field_work_orders));
        } catch (error) {
          console.warn(`[WorkOrder Cache] パースエラー (jobId: ${job.id}):`, error);
          cache.set(job.id, []);
        }
      }
    });
    return cache;
  }, [filteredJobs]);

  // 優先度を計算する関数（メモ化）
  const getJobPriority = useCallback((job: ZohoJob): number => {
    let priority = 0;
    // 緊急対応案件は優先度高
    if (job.isUrgent || job.field7?.includes("【緊急対応】")) {
      priority += 100;
    }
    // VIP顧客は優先度高
    const customerId = job.field4?.id;
    if (customerId && isImportantCustomer(customerId)) {
      priority += 50;
    }
    // ステータスに応じた優先度
    if (job.field5 === "見積作成待ち") {
      priority += 30;
    } else if (job.field5 === "作業待ち") {
      priority += 20;
    } else if (job.field5 === "入庫済み") {
      priority += 10;
    }

    // 複合作業の場合、遅れているWorkOrderを考慮
    const workOrders = workOrdersCache.get(job.id);
    if (workOrders && workOrders.length > 0) {
      const now = new Date();

      // 遅れているWorkOrderがある場合、優先度を上げる
      const delayedWorkOrders = workOrders.filter((wo) => {
        // 診断中で開始から2時間以上経過
        if (wo.status === "診断中" && wo.diagnosis?.startedAt) {
          const startTime = new Date(wo.diagnosis.startedAt);
          const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          return hoursElapsed >= 2;
        }

        // 作業中で開始から4時間以上経過
        if (wo.status === "作業中" && wo.work?.startedAt) {
          const startTime = new Date(wo.work.startedAt);
          const hoursElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          return hoursElapsed >= 4;
        }

        return false;
      });

      if (delayedWorkOrders.length > 0) {
        priority += 15; // 遅れているWorkOrderがある場合、優先度を上げる
      }
    }

    return priority;
  }, [workOrdersCache]);

  // 並び替えと優先表示
  const sortedJobs = useMemo(() => {
    const jobsWithPriority = filteredJobs.map((job) => ({
      job,
      priority: getJobPriority(job),
    }));

    // 優先度順にソート（優先度が高い順）
    jobsWithPriority.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // 優先度が高い順
      }

      // 優先度が同じ場合は、選択した並び替えオプションに従う
      // 複合作業の場合、WorkOrderの開始時間を考慮するヘルパー関数
      const getEarliestStartTime = (job: ZohoJob): number => {
        const arrivalTime = job.field22 ? new Date(job.field22).getTime() : 0;

        // WorkOrderがある場合、最も早く開始されたWorkOrderの開始時間を取得
        const workOrders = workOrdersCache.get(job.id);
        if (workOrders && workOrders.length > 0) {
          const startTimes = workOrders
            .map((wo) => {
              const diagnosisStart = wo.diagnosis?.startedAt
                ? new Date(wo.diagnosis.startedAt).getTime()
                : null;
              const workStart = wo.work?.startedAt
                ? new Date(wo.work.startedAt).getTime()
                : null;
              return diagnosisStart || workStart || null;
            })
            .filter((time): time is number => time !== null);

          if (startTimes.length > 0) {
            return Math.min(...startTimes);
          }
        }

        return arrivalTime;
      };

      switch (sortOption) {
        case "arrivalTime":
          // 入庫時間順（古い順）
          // 複合作業の場合、最も早く開始されたWorkOrderの開始時間を考慮
          const timeA = getEarliestStartTime(a.job);
          const timeB = getEarliestStartTime(b.job);
          return timeA - timeB;
        case "arrivalTimeDesc":
          // 入庫時間順（新しい順）
          // 複合作業の場合、最も早く開始されたWorkOrderの開始時間を考慮
          const timeADesc = getEarliestStartTime(a.job);
          const timeBDesc = getEarliestStartTime(b.job);
          return timeBDesc - timeADesc;
        case "bookingTime":
          // 予約時間順（field22を使用、予約時間がない場合は入庫時間を使用）
          const bookingTimeA = a.job.field22 ? new Date(a.job.field22).getTime() : 0;
          const bookingTimeB = b.job.field22 ? new Date(b.job.field22).getTime() : 0;
          return bookingTimeA - bookingTimeB;
        case "status":
          // ステータス順（ステータスの優先順位でソート）
          const statusOrder: Record<string, number> = {
            "入庫待ち": 1,
            "入庫済み": 2,
            "診断待ち": 3,
            "見積作成待ち": 4,
            "見積提示済み": 5,
            "お客様承認待ち": 6,
            "作業待ち": 7,
            "出庫待ち": 8,
            "出庫済み": 9,
          };
          const statusA = statusOrder[a.job.field5] || 999;
          const statusB = statusOrder[b.job.field5] || 999;
          return statusA - statusB;
        default:
          return 0;
      }
    });

    return jobsWithPriority.map((item) => item.job);
  }, [filteredJobs, sortOption, getJobPriority, workOrdersCache]);

  // 明日の作業予定を抽出
  const tomorrowJobs = useMemo(() => {
    if (!jobs) return [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    return jobs.filter((job) => {
      if (!job.field22) return false;
      const jobDate = new Date(job.field22);
      return jobDate >= tomorrow && jobDate <= tomorrowEnd;
    });
  }, [jobs]);

  // 作業進捗を計算（ステータスに基づく）

  // エラー状態
  if (jobsError) {
    return (
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center overflow-auto">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-600 mb-3 shrink-0" />
          <p className="text-red-700 font-semibold mb-2">データの取得に失敗しました</p>
          <Button onClick={() => mutateJobs()} className="gap-2">
            <Loader2 className="h-5 w-5 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、ボタン内アイコン拡大) */}
            再試行
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="flex-1 bg-slate-50 flex flex-col overflow-x-hidden">
      {/* スキップリンク（アクセシビリティ） */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:shadow-lg" // focus:bg-blue-600 → focus:bg-primary (40歳以上ユーザー向け、統一)
      >
        メインコンテンツへスキップ
      </a>

      {/* オフライン/オンラインバナー */}
      <OfflineBanner />
      <OnlineBanner />

      {/* お知らせバナー（全画面幅、ヘッダーの上に固定表示） */}
      {activeAnnouncements.length > 0 && (
        <>
          {activeAnnouncements.map((announcement) => (
            <AnnouncementBanner
              key={announcement.id}
              id={announcement.id}
              message={announcement.message}
              backgroundColor={announcement.backgroundColor}
              textColor={announcement.textColor}
            />
          ))}
        </>
      )}

      <AppHeader
        hideBrandOnScroll={false}
        searchQuery={searchQuery}
        onSearchChange={(newValue) => {
          setSearchQuery(newValue);
          if (newValue.trim()) {
            addSearchHistory(newValue);
          }
        }}
        searchJobs={jobs ?? []}
        onScanClick={() => setIsQrScanDialogOpen(true)}
        onSuggestionSelect={(suggestion) => {
          setSearchQuery(suggestion.value);
          addSearchHistory(suggestion.value);
        }}
        rightArea={
          <NotificationBell jobs={jobs ?? []} refreshInterval={60000} />
        }
      />

      {/* メインコンテンツ */}
      <main id="main-content" className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full" style={{ paddingTop: 'calc(var(--header-height, 80px) + 1.5rem)' }} role="main" aria-label="メインコンテンツ">
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

        {/* 本日入出庫予定カード（最重要、最上部に配置） */}
        <div className="mb-6">
          {/* 初回ロード時のみスケルトンを表示 */}
          {isJobsLoading && !jobs ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="relative">
              {/* 再検証中は更新中であることを示す */}
              {isJobsValidating && jobs && (
                <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                  <span className="text-xs text-slate-600">更新中...</span>
                </div>
              )}
              <TodayScheduleCard
                jobs={jobs ?? []}
                onJobClick={(jobId) => {
                // 該当ジョブがフィルター結果に含まれているか確認
                const targetJob = filteredJobs.find(j => j.id === jobId);

                if (!targetJob) {
                  // フィルターが適用されている場合、フィルターを解除してからスクロール
                  const hasActiveFilters = getActiveFilterCount(filters) > 0 || searchQuery.trim();

                  if (hasActiveFilters) {
                    // フィルターを一時的に解除
                    setFilters(resetFilters());
                    setSearchQuery("");

                    // フィルター解除後にスクロール
                    const timer1 = setTimeout(() => {
                      if (!isMountedRef.current) return;
                      const jobCard = document.getElementById(`job-card-${jobId}`);
                      if (jobCard) {
                        jobCard.scrollIntoView({ behavior: "smooth", block: "center" });
                        // ハイライト効果（デザインシステム仕様に準拠：角丸に合わせたring、primary色を使用）
                        jobCard.classList.add("ring-2", "ring-primary", "ring-offset-0", "rounded-xl", "transition-all", "duration-300");
                        const timer2 = setTimeout(() => {
                          if (!isMountedRef.current) return;
                          jobCard.classList.remove("ring-2", "ring-primary", "ring-offset-0", "rounded-xl", "transition-all", "duration-300");
                          scrollTimersRef.current.delete(timer2);
                        }, 2000);
                        scrollTimersRef.current.add(timer2);
                      }
                      scrollTimersRef.current.delete(timer1);
                    }, 300);
                    scrollTimersRef.current.add(timer1);
                  } else {
                    // フィルターが適用されていない場合は通常のスクロール
                    const timer = setTimeout(() => {
                      if (!isMountedRef.current) return;
                      const jobCard = document.getElementById(`job-card-${jobId}`);
                      if (jobCard) {
                        jobCard.scrollIntoView({ behavior: "smooth", block: "center" });
                      } else {
                        const jobsSection = document.getElementById("jobs-section");
                        if (jobsSection) {
                          jobsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }
                      scrollTimersRef.current.delete(timer);
                    }, 150);
                    scrollTimersRef.current.add(timer);
                  }
                } else {
                  // フィルター結果に含まれている場合は通常のスクロール
                  const timer1 = setTimeout(() => {
                    if (!isMountedRef.current) return;
                    const jobCard = document.getElementById(`job-card-${jobId}`);
                    if (jobCard) {
                      jobCard.scrollIntoView({ behavior: "smooth", block: "center" });
                      // ハイライト効果（デザインシステム仕様に準拠：角丸に合わせたring、primary色を使用）
                      jobCard.classList.add("ring-2", "ring-primary", "ring-offset-0", "rounded-xl", "transition-all", "duration-300");
                      const timer2 = setTimeout(() => {
                        if (!isMountedRef.current) return;
                        jobCard.classList.remove("ring-2", "ring-primary", "ring-offset-0", "rounded-xl", "transition-all", "duration-300");
                        scrollTimersRef.current.delete(timer2);
                      }, 2000);
                      scrollTimersRef.current.add(timer2);
                    }
                    scrollTimersRef.current.delete(timer1);
                  }, 150);
                  scrollTimersRef.current.add(timer1);
                }
              }}
            />
            </div>
          )}
        </div>

        {/* 入庫車両管理セクション */}
        <div className="mb-6">
          {/* セクションタイトル */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600 shrink-0" strokeWidth={2.5} />
              <h2 className="text-xl font-bold text-slate-900">入庫管理一覧</h2>
              {jobs && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                  {filteredJobs.length}件
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {jobs && (
                <span className="text-base text-slate-700">
                  {getActiveFilterCount(filters) > 0 || searchQuery.trim() ? (
                    <>
                      全 {jobs.length} 件中 <span className="font-semibold text-slate-900">{filteredJobs.length} 件</span> 表示
                    </>
                  ) : (
                    <>全 {jobs.length} 件</>
                  )}
                </span>
              )}
              {/* フィルターが適用されている場合、クリアボタンを表示 */}
              {(getActiveFilterCount(filters) > 0 || searchQuery.trim() || sortOption !== "arrivalTime") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilters(resetFilters());
                    setSearchQuery("");
                    setSortOption("arrivalTime");
                  }}
                  className="gap-1"
                >
                  <X className="h-5 w-5 shrink-0" />
                  フィルター解除
                </Button>
              )}
            </div>
          </div>

          {/* フィルター */}
          <div className="mb-6">
            {/* フィルターボタン */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-5 w-5 text-slate-600 shrink-0" />
              {/* ステータスフィルターボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterModalType("status");
                }}
                className={cn(
                  "flex items-center gap-2 border rounded-md px-3 py-1.5 h-10 text-base font-medium transition-colors",
                  filters.status.length > 0
                    ? "bg-blue-50 border-blue-500 text-blue-900 hover:bg-blue-100"
                    : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                )}
              >
                <span>ステータス</span>
                {filters.status.length > 0 && (
                  <>
                    <span className="text-base text-blue-700">
                      ({filters.status.length})
                    </span>
                  </>
                )}
                <ChevronDown className="h-4 w-4 shrink-0" />
                {filters.status.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters((prev) => ({ ...prev, status: [] }));
                    }}
                    className="ml-1 -mr-1 p-0.5 rounded hover:bg-blue-200 transition-colors"
                  >
                    <X className="h-4 w-4 text-blue-700" />
                  </button>
                )}
              </button>

              {/* 入庫区分フィルターボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterModalType("serviceKind");
                }}
                className={cn(
                  "flex items-center gap-2 border rounded-md px-3 py-1.5 h-10 text-base font-medium transition-colors",
                  filters.serviceKind.length > 0
                    ? "bg-orange-50 border-orange-500 text-orange-900 hover:bg-orange-100"
                    : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                )}
              >
                <span>入庫区分</span>
                {filters.serviceKind.length > 0 && (
                  <>
                    <span className="text-base text-orange-700">
                      ({filters.serviceKind.length})
                    </span>
                  </>
                )}
                <ChevronDown className="h-4 w-4 shrink-0" />
                {filters.serviceKind.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters((prev) => ({ ...prev, serviceKind: [] }));
                    }}
                    className="ml-1 -mr-1 p-0.5 rounded hover:bg-orange-200 transition-colors"
                  >
                    <X className="h-4 w-4 text-orange-700" />
                  </button>
                )}
              </button>

              {/* 整備士フィルターボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterModalType("mechanic");
                }}
                className={cn(
                  "flex items-center gap-2 border rounded-md px-3 py-1.5 h-10 text-base font-medium transition-colors",
                  filters.mechanic.length > 0
                    ? "bg-amber-50 border-amber-500 text-amber-900 hover:bg-amber-100"
                    : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                )}
              >
                <span>担当整備士</span>
                {filters.mechanic.length > 0 && (
                  <>
                    <span className="text-base text-amber-700">
                      ({filters.mechanic.length})
                    </span>
                  </>
                )}
                <ChevronDown className="h-4 w-4 shrink-0" />
                {filters.mechanic.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters((prev) => ({ ...prev, mechanic: [] }));
                    }}
                    className="ml-1 -mr-1 p-0.5 rounded hover:bg-amber-200 transition-colors"
                  >
                    <X className="h-4 w-4 text-amber-700" />
                  </button>
                )}
              </button>

              {/* 特殊条件フィルターボタン */}
              {(() => {
                const additionalCount = [filters.isUrgent === true, filters.isImportant === true, filters.longPartsProcurement === true].filter(Boolean).length;
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilterModalType("additional");
                    }}
                    className={cn(
                      "flex items-center gap-2 border rounded-md px-3 py-1.5 h-10 text-base font-medium transition-colors",
                      additionalCount > 0
                        ? "bg-rose-50 border-rose-500 text-rose-900 hover:bg-rose-100"
                        : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <span>特殊条件</span>
                    {additionalCount > 0 && (
                      <>
                        <span className="text-base text-rose-700">
                          ({additionalCount})
                        </span>
                      </>
                    )}
                    <ChevronDown className="h-4 w-4 shrink-0" />
                    {additionalCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters((prev) => ({
                            ...prev,
                            isUrgent: null,
                            isImportant: null,
                            longPartsProcurement: null,
                          }));
                        }}
                        className="ml-1 -mr-1 p-0.5 rounded hover:bg-rose-200 transition-colors"
                      >
                        <X className="h-4 w-4 text-rose-700" />
                      </button>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>


          {/* 並び替え機能 */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* 並び替えセレクト */}
            <div className="flex items-center gap-2 ml-auto">
              <Label htmlFor="sort-option" className="text-base text-slate-800">
                並び替え:
              </Label>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as typeof sortOption)}>
                <SelectTrigger id="sort-option" className="w-full sm:w-auto min-w-[220px] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arrivalTime">入庫時間順（古い順）</SelectItem>
                  <SelectItem value="arrivalTimeDesc">入庫時間順（新しい順）</SelectItem>
                  <SelectItem value="bookingTime">予約時間順</SelectItem>
                  <SelectItem value="status">ステータス順</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 件数表示 */}
          {jobs && (
            <div className="mb-4 text-base text-slate-800">
              {getActiveFilterCount(filters) === 0 && !searchQuery.trim()
                ? `全 ${jobs.length}件`
                : `検索結果: ${sortedJobs.length}件`}
            </div>
          )}

          {/* 入庫車両管理コンテンツ */}
          {/* 初回ロード時のみスケルトンを表示 */}
          {isJobsLoading && !jobs ? (
            <div className="space-y-4">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : (
            <>
              {/* ジョブカードリスト */}
              {jobs && sortedJobs.length > 0 && (
                <div className="relative">
                  {/* 再検証中は更新中であることを示す */}
                  {isJobsValidating && (
                    <div className="absolute top-0 right-0 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 shadow-sm mb-4">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                      <span className="text-xs text-slate-600">更新中...</span>
                    </div>
                  )}
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
                </div>
              )}

              {/* 空の場合の表示 */}
              {jobs && (
                <>
                  {jobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Car className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-700">本日の入庫予定はありません</p>
                    </div>
                  ) : sortedJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Car className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                      <p className="text-base font-medium text-slate-900">該当する案件がありません</p>
                      <p className="text-base text-slate-700 mt-2">
                        フィルター条件を変更してください
                      </p>
                      {(getActiveFilterCount(filters) > 0 || searchQuery.trim()) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFilters(resetFilters());
                            setSearchQuery("");
                          }}
                          className="mt-4 gap-2"
                        >
                          <X className="h-5 w-5 shrink-0" />
                          フィルターを解除
                        </Button>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>

        {/* 明日の作業予定セクション */}
        {tomorrowJobs.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 shrink-0" />
                明日の作業予定
              </h2>
              <Badge variant="secondary" className="text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {tomorrowJobs.length}件
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tomorrowJobs.map((job) => (
                <Card key={job.id} className="border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900 truncate">
                            {job.field4?.name ?? "未登録"}様
                          </p>
                          <Badge variant="outline" className="text-base shrink-0">
                            {job.field5}
                          </Badge>
                        </div>
                        <p className="text-base text-slate-800 truncate mb-2">
                          {job.field6?.name ?? "車両未登録"}
                        </p>
                        {job.assignedMechanic && (
                          <p className="text-base text-slate-700 flex items-center gap-1">
                            <Users className="h-5 w-5 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                            担当: {job.assignedMechanic}
                          </p>
                        )}
                        {job.field22 && (
                          <p className="text-base text-slate-700 mt-1">
                            入庫予定: {new Date(job.field22).toLocaleString("ja-JP", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 長期プロジェクトセクション */}
        {longTermProjects.length > 0 && (
          <div id="long-term-projects" className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 shrink-0" />
                長期プロジェクト
              </h2>
              <Badge variant="secondary" className="text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {longTermProjects.length}件
              </Badge>
            </div>
            <div className="space-y-4">
              {longTermProjects.map((project) => (
                <JobCard
                  key={project.jobId}
                  job={project.job}
                  onCheckIn={handleCheckIn}
                  isCheckingIn={isCheckingIn}
                  courtesyCars={courtesyCars ?? []}
                />
              ))}
            </div>
          </div>
        )}
      </main>


      {/* タグ選択ダイアログ */}
      <TagSelectionDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        selectedJob={selectedJob}
        allTags={allTags}
        jobs={jobs}
        isLoading={isAllTagsLoading}
        error={allTagsError}
        onRetry={() => mutateAllTags()}
        selectedTagId={selectedTagId}
        onTagSelect={handleTagSelect}
        isProcessing={isCheckingIn}
        isUrgent={isUrgent}
        onUrgentChange={setIsUrgent}
      />

      {/* フィルターモーダル */}
      <JobFilterDialog
        open={filterModalType !== null}
        onOpenChange={(open) => !open && setFilterModalType(null)}
        filterModalType={filterModalType}
        setFilterModalType={setFilterModalType}
        jobs={jobs ?? []}
        filters={filters}
        setFilters={setFilters}
      />

      {/* フッター */}
      <footer className="mt-auto py-6 text-center text-base text-slate-700">

        <p className="mb-1">ワイエムワークス｜デジタルガレージ</p>
        <p>© YMWORKS. All rights reserved.</p>
      </footer>

      {/* タグ使用中エラー確認ダイアログ */}
      <Dialog open={isTagInUseDialogOpen} onOpenChange={setIsTagInUseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              タグ使用中エラー
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-slate-700">
              タグ {tagInUseError?.tagId} は既に使用中です。
              <br />
              既存の紐付けを解除して、新しいジョブに紐付けますか？
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsTagInUseDialogOpen(false);
                setTagInUseError(null);
              }}
              className="flex-1 h-12 text-base"
              disabled={isCheckingIn}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleUnlinkTagAndRetryCheckIn}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
              disabled={isCheckingIn}
            >
              {isCheckingIn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                  処理中...
                </>
              ) : (
                "解除して続行"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 代車選択ダイアログ */}
      <CourtesyCarSelectDialog
        open={isCourtesyCarDialogOpen}
        onOpenChange={handleCourtesyCarDialogClose}
        cars={Array.isArray(courtesyCars) ? courtesyCars : undefined}
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

      {/* 車検入庫時チェックリストダイアログ */}
      <InspectionEntryChecklistDialog
        open={isInspectionEntryChecklistDialogOpen}
        onOpenChange={(open) => {
          setIsInspectionEntryChecklistDialogOpen(open);
          if (!open) {
            setSelectedJob(null);
            setSelectedTagId(null);
            setInspectionChecklist(null);
          }
        }}
        job={selectedJob}
        checklist={inspectionChecklist}
        onChecklistChange={setInspectionChecklist}
        onConfirm={handleInspectionChecklistConfirm}
        disabled={isCheckingIn}
      />

    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
