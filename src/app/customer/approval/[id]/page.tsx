"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { EstimatePriority, EstimateItem, ApiResponse, WorkOrder } from "@/types";
import { toast } from "sonner";
import { fetchJobById, approveEstimate, rejectEstimate } from "@/lib/api";
import { updateWorkOrder } from "@/hooks/use-work-orders";
import { getCustomerIdFromMagicLink } from "@/lib/line-api";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/layout/app-header";
import { LegalFees, convertLegalFeesToItems } from "@/lib/legal-fees";
import {
  Car,
  Check,
  Lock,
  ImageIcon,
  ChevronRight,
  ShoppingCart,
  PartyPopper,
  MessageCircle,
  Phone,
  Loader2,
  Video,
  Play,
  X,
} from "lucide-react";
import { getBackHref } from "@/lib/navigation-history";

// =============================================================================
// Types
// =============================================================================

interface EstimateLineItem {
  id: string;
  name: string;
  price: number;
  priority: EstimatePriority;
  selected: boolean;
  photoUrl: string | null;
  videoUrl: string | null;
  transcription: string | null; // 実況解説テキスト（音声認識結果）
  comment: string | null;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 見積もりの有効期限をチェック
 */
function isEstimateExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt);
}

// モックデータは削除（実際の見積データを使用）

// =============================================================================
// Helper Functions
// =============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP").format(price);
}

function getPriorityLabel(priority: EstimatePriority): string {
  switch (priority) {
    case "required":
      return "必須";
    case "recommended":
      return "推奨";
    case "optional":
      return "任意";
  }
}

function getPriorityColor(priority: EstimatePriority): string {
  switch (priority) {
    case "required":
      return "bg-red-500";
    case "recommended":
      return "bg-amber-500";
    case "optional":
      return "bg-slate-500";
  }
}

// =============================================================================
// Components
// =============================================================================

/**
 * 見積項目カードコンポーネント（CitNOWスタイル）
 */
function EstimateItemCard({
  item,
  onToggle,
  onPhotoClick,
  onVideoClick,
}: {
  item: EstimateLineItem;
  onToggle: (id: string) => void;
  onPhotoClick: (url: string, name: string) => void;
  onVideoClick: (url: string, name: string) => void;
}) {
  const isLocked = item.priority === "required";

  return (
    <Card
      className={cn(
        "border border-slate-300 rounded-xl shadow-md transition-all",
        item.selected ? "bg-white" : "bg-slate-50 opacity-70"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* チェックボックス */}
          <div className="pt-0.5">
            {isLocked ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white shrink-0">
                <Lock className="h-4 w-4 shrink-0" />
              </div>
            ) : (
              <Checkbox
                checked={item.selected}
                onCheckedChange={() => onToggle(item.id)}
                className="h-6 w-6 shrink-0"
              />
            )}
          </div>

          {/* コンテンツ */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-base font-medium truncate",
                  item.selected ? "text-slate-900" : "text-slate-700 line-through"
                )}
                  title={item.name}
                >
                  {item.name}
                </p>
                {item.comment && (
                  <p className="text-base text-slate-700 mt-1">{item.comment}</p>
                )}
              </div>
              <p className={cn(
                "text-base font-bold whitespace-nowrap tabular-nums",
                item.selected ? "text-slate-900" : "text-slate-700"
              )}>
                ¥{formatPrice(item.price)}
              </p>
            </div>

            {/* メディア（動画・写真）ボタン */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {item.videoUrl && (
                <button
                  onClick={() => onVideoClick(item.videoUrl!, item.name)}
                  className="flex items-center gap-2 px-4 py-2 h-12 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-base font-medium"
                  aria-label={`${item.name}の動画を見る`}
                >
                  <Play className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>動画を見る</span>
                </button>
              )}
              {item.photoUrl && (
                <button
                  onClick={() => onPhotoClick(item.photoUrl!, item.name)}
                  className="flex items-center gap-2 text-base font-medium text-slate-900 hover:text-blue-700 transition-colors"
                  aria-label={`${item.name}の写真を確認`}
                >
                  <div className="relative w-16 h-12 rounded-md overflow-hidden border border-slate-300 shrink-0">
                    <Image
                      src={item.photoUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    写真を確認
                    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * セクションヘッダーコンポーネント
 */
function SectionHeader({
  priority,
  count,
  total,
}: {
  priority: EstimatePriority;
  count: number;
  total: number;
}) {
  const descriptions = {
    required: "車検・点検に必要な整備です",
    recommended: "メカニックが推奨する整備です",
    optional: "ご希望に応じてお選びください",
  };

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={cn("w-1 h-6 rounded-full shrink-0", getPriorityColor(priority))} />
        <div>
          <p className="text-lg font-bold text-slate-900">{getPriorityLabel(priority)}整備</p>
          <p className="text-base text-slate-700">{descriptions[priority]}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-base text-slate-700 tabular-nums">{count}件</p>
        <p className="text-base font-bold text-slate-900 tabular-nums">¥{formatPrice(total)}</p>
      </div>
    </div>
  );
}

/**
 * 完了画面コンポーネント
 */
function ThankYouScreen({ customerName }: { customerName: string }) {
  return (
    <div className="flex-1 bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6 text-center overflow-auto">
      <div className="animate-bounce mb-6">
        <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
          <Check className="h-12 w-12 text-white shrink-0" />
        </div>
      </div>

      <PartyPopper className="h-16 w-16 text-amber-600 mb-4 shrink-0" />

      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        ご依頼ありがとうございます！
      </h1>

      <p className="text-base text-slate-700 mb-6">
        {customerName}様のご注文を承りました。<br />
        作業完了次第、ご連絡いたします。
      </p>

      <Card className="w-full max-w-sm border border-slate-300 rounded-xl shadow-md">
        <CardContent className="p-6">
          <p className="text-base font-medium text-slate-900 mb-4">ご不明点がございましたら</p>
          <div className="space-y-3">
            <Button variant="outline" className="w-full h-12 justify-start gap-2 text-base font-medium">
              <Phone className="h-4 w-4 shrink-0" />
              お電話でのお問い合わせ
            </Button>
            <Button variant="outline" className="w-full h-12 justify-start gap-2 text-base font-medium text-green-700 border-green-300 hover:bg-green-50">
              <MessageCircle className="h-4 w-4 shrink-0" />
              LINEでお問い合わせ
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-base text-slate-700 mt-8">
        このページは閉じても大丈夫です
      </p>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function CustomerApprovalPage() {
  // Next.js 16対応: paramsをuseMemoでラップして列挙を防止
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = useMemo(() => (params?.id ?? "") as string, [params]);
  
  // URLパラメータからworkOrderIdを取得（追加見積の場合）
  const workOrderId = useMemo(() => {
    return searchParams?.get("workOrderId") || null;
  }, [searchParams]);

  // URLパラメータからtokenを取得（マジックリンク認証用）
  const token = useMemo(() => {
    return searchParams?.get("token") || null;
  }, [searchParams]);

  // Jobデータを取得
  const { data: jobResult, isLoading: isJobLoading } = useSWR(
    jobId ? `job-${jobId}` : null,
    async () => {
      if (!jobId) return null;
      return await fetchJobById(jobId);
    }
  );

  const job = jobResult?.data;

  // マジックリンクトークンの検証（tokenが指定されている場合）
  const [isTokenValidating, setIsTokenValidating] = useState(false);
  const [tokenValidationError, setTokenValidationError] = useState<string | null>(null);
  
  useEffect(() => {
    if (token && jobId) {
      setIsTokenValidating(true);
      getCustomerIdFromMagicLink(token)
        .then((customerId) => {
          if (!customerId) {
            setTokenValidationError("マジックリンクの有効期限が切れているか、無効なリンクです");
          } else {
            // トークンが有効な場合、エラーをクリア
            setTokenValidationError(null);
          }
        })
        .catch((error) => {
          console.error("[Approval] マジックリンクトークン検証エラー:", error);
          setTokenValidationError("マジックリンクの検証に失敗しました");
        })
        .finally(() => {
          setIsTokenValidating(false);
        });
    }
  }, [token, jobId]);

  // ワークオーダーを取得（顧客承認ページでは常に最新データを取得）
  const { data: workOrdersResponse, error: workOrdersError, isLoading: isLoadingWorkOrders, mutate: mutateWorkOrders } = useSWR<ApiResponse<WorkOrder[]>>(
    jobId ? `/api/jobs/${jobId}/work-orders` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch work orders: ${response.statusText}`);
      }
      return response.json();
    },
    {
      revalidateOnMount: true, // 常に最新データを取得
      revalidateOnFocus: true, // フォーカス時も再検証
      dedupingInterval: 0, // キャッシュを無効化
    }
  );
  
  const workOrdersList = workOrdersResponse?.success ? workOrdersResponse.data : [];
  
  // デバッグ: ワークオーダー取得エラーをログ出力
  useEffect(() => {
    if (workOrdersError) {
      console.error("[Approval] ワークオーダー取得エラー:", workOrdersError);
    }
    if (workOrdersList && workOrdersList.length === 0 && !isLoadingWorkOrders) {
      console.warn("[Approval] ワークオーダーが0件です。jobId:", jobId);
    }
  }, [workOrdersError, workOrdersList, isLoadingWorkOrders, jobId]);
  
  // workOrderIdが指定されている場合はそのワークオーダーを選択、そうでない場合は最初のワークオーダーを選択
  const selectedWorkOrder = useMemo(() => {
    if (!workOrdersList || workOrdersList.length === 0) return null;
    if (workOrderId) {
      return workOrdersList.find((wo) => wo.id === workOrderId) || workOrdersList[0];
    }
    return workOrdersList[0];
  }, [workOrdersList, workOrderId]);

  // 見積データを取得
  // workOrderIdが指定されている場合はそのワークオーダーから、そうでない場合は見積がある最初のワークオーダーから取得
  const estimateData = useMemo(() => {
    if (!workOrdersList || workOrdersList.length === 0) return null;
    
    // workOrderIdが指定されている場合はそのワークオーダーから取得
    if (workOrderId) {
      const wo = workOrdersList.find((wo) => wo.id === workOrderId);
      if (wo?.estimate && wo.estimate.items && wo.estimate.items.length > 0) {
        return wo.estimate;
      }
    }
    
    // 見積がある最初のワークオーダーから取得
    const woWithEstimate = workOrdersList.find((wo) => wo.estimate && wo.estimate.items && wo.estimate.items.length > 0);
    if (woWithEstimate?.estimate) {
      return woWithEstimate.estimate;
    }
    
    // 見積データが見つからない場合は、最初のワークオーダーの見積データを返す（後方互換性のため）
    return workOrdersList[0]?.estimate || null;
  }, [workOrdersList, workOrderId]);
  
  // 法定費用を取得（車検の場合）
  const legalFees: LegalFees | null = estimateData?.legalFees || null;

  // 顧客情報と車両情報を取得
  const customerName = job?.field4?.name || "お客様";
  const customerId = job?.field4?.id || null;
  const vehicleName = job?.field6?.name || "車両";
  const licensePlate = job?.field6?.name ? job.field6.name.split(" / ")[1] || "" : "";

  // 顧客ダッシュボードへのリンク（フォールバック用）
  const dashboardHref = customerId ? `/customer/dashboard?customerId=${customerId}` : "/";
  
  // 戻る先のURL（ナビゲーション履歴を優先、なければダッシュボード）
  const backHref = useMemo(() => {
    const historyBackHref = getBackHref(jobId);
    // 履歴がない、またはトップページに戻る場合は、ダッシュボードに戻る
    return historyBackHref === "/" ? dashboardHref : historyBackHref;
  }, [jobId, dashboardHref]);

  // 状態管理
  const [items, setItems] = useState<EstimateLineItem[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [lightboxVideo, setLightboxVideo] = useState<{ url: string; name: string } | null>(null);
  const [mainVideoUrl, setMainVideoUrl] = useState<string | null>(null);
  const [mainVideoTitle, setMainVideoTitle] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [displayTotal, setDisplayTotal] = useState(0);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // 見積データをEstimateLineItem形式に変換
  useEffect(() => {
    if (estimateData && estimateData.items) {
      const convertedItems: EstimateLineItem[] = estimateData.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        selected: item.approved !== false && item.selected !== false, // approvedまたはselectedがfalseでない場合は選択状態
        photoUrl: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
        videoUrl: item.linkedVideoUrl || null,
        transcription: item.transcription || null,
        comment: item.note || null,
      }));
      setItems(convertedItems);

      // メイン動画を設定（推奨項目で最初に動画があるもの、または必須項目で最初に動画があるもの）
      const recommendedWithVideo = convertedItems.find(
        (item) => item.priority === "recommended" && item.videoUrl && item.selected
      );
      const requiredWithVideo = convertedItems.find(
        (item) => item.priority === "required" && item.videoUrl
      );
      const mainVideo = recommendedWithVideo || requiredWithVideo;

      if (mainVideo && mainVideo.videoUrl) {
        setMainVideoUrl(mainVideo.videoUrl);
        setMainVideoTitle(mainVideo.name);
      }
    } else if (!isJobLoading && !isLoadingWorkOrders && !estimateData) {
      // 見積データがない場合は空の配列を設定
      setItems([]);
    }
  }, [estimateData, isJobLoading, isLoadingWorkOrders]);

  // 合計金額を計算（法定費用を含む）
  const calculateTotal = () => {
    const itemsTotal = items.filter((item) => item.selected).reduce((sum, item) => sum + item.price, 0);
    const legalFeesTotal = legalFees?.total || 0;
    return itemsTotal + legalFeesTotal;
  };

  // 表示用合計のアニメーション
  useEffect(() => {
    const targetTotal = calculateTotal();
    const duration = 300;
    const steps = 20;
    const increment = (targetTotal - displayTotal) / steps;

    if (Math.abs(targetTotal - displayTotal) < 100) {
      setDisplayTotal(targetTotal);
      return;
    }

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayTotal(targetTotal);
        clearInterval(timer);
      } else {
        setDisplayTotal((prev) => Math.round(prev + increment));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [items]);

  // 初期表示時に合計を設定
  useEffect(() => {
    setDisplayTotal(calculateTotal());
  }, []);

  /**
   * 項目のON/OFF切り替え
   */
  const handleToggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  /**
   * 写真のLightbox表示
   */
  const handlePhotoClick = (url: string, name: string) => {
    setLightboxImage({ url, name });
  };

  /**
   * 動画のLightbox表示
   */
  const handleVideoClick = (url: string, name: string) => {
    setLightboxVideo({ url, name });
  };

  /**
   * 見積却下
   */
  const handleReject = async () => {
    if (!jobId) {
      toast.error("ジョブIDが取得できませんでした");
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error("却下理由を入力してください");
      return;
    }

    setIsRejecting(true);
    try {
      const result = await rejectEstimate(jobId, rejectionReason.trim());

      if (result.success) {
        toast.success("見積を却下しました", {
          description: "事務員が却下理由を確認し、見積を再作成します",
        });
        setIsRejectDialogOpen(false);
        setRejectionReason("");
        setIsCompleted(true);
      } else {
        throw new Error(result.error?.message || "却下処理に失敗しました");
      }
    } catch (error) {
      console.error("却下エラー:", error);
      toast.error("却下処理に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  /**
   * 注文確定（見積もり承認）
   */
  const handleOrder = async () => {
    if (!jobId) {
      toast.error("ジョブIDが取得できませんでした");
      return;
    }

    const selectedItems = items.filter((i) => i.selected);

    if (selectedItems.length === 0) {
      toast.error("少なくとも1つの項目を選択してください");
      return;
    }

    setIsApproving(true);
    try {
      // 全項目を含むEstimateItem配列を作成（approvedフラグを設定）
      const allEstimateItems: EstimateItem[] = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        selected: item.selected, // 選択状態を保持
        approved: item.selected, // 選択されている項目は承認、選択されていない項目は非承認
        linkedPhotoUrls: item.photoUrl ? [item.photoUrl] : [],
        linkedVideoUrl: item.videoUrl || null,
        note: item.comment || null,
      }));

      // 承認APIを呼び出す（全項目を含む配列を渡す）
      // workOrderIdが指定されている場合はワークオーダーに保存
      const result = await approveEstimate(jobId, selectedWorkOrder?.id, allEstimateItems);

      if (result.success) {
        // ワークオーダーのestimate.itemsを更新（全項目を含めてapprovedフラグを設定）
        if (selectedWorkOrder?.id) {
          try {
            await updateWorkOrder(jobId, selectedWorkOrder.id, {
              estimate: {
                ...selectedWorkOrder.estimate,
                items: allEstimateItems, // 全項目を含めて保存
              },
            });
            // ワークオーダーリストを再取得
            await mutateWorkOrders();
          } catch (error) {
            console.error("ワークオーダー更新エラー:", error);
            // エラーが発生しても承認処理は続行（ジョブステータスは更新済み）
            toast.warning("見積の承認は完了しましたが、ワークオーダーの更新に失敗しました");
          }
        }

        // 承認完了の通知
        toast.success("見積もりを承認しました", {
          description: `${selectedItems.length}項目、合計¥${formatPrice(calculateTotal())}`,
        });

        setIsCompleted(true);
      } else {
        throw new Error(result.error?.message || "承認処理に失敗しました");
      }
    } catch (error) {
      console.error("承認エラー:", error);
      toast.error("承認処理に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
    } finally {
      setIsApproving(false);
    }
  };

  // セクション別の計算
  const requiredItems = items.filter((i) => i.priority === "required");
  const recommendedItems = items.filter((i) => i.priority === "recommended");
  const optionalItems = items.filter((i) => i.priority === "optional");

  const requiredTotal = requiredItems.filter((i) => i.selected).reduce((s, i) => s + i.price, 0);
  const recommendedTotal = recommendedItems.filter((i) => i.selected).reduce((s, i) => s + i.price, 0);
  const optionalTotal = optionalItems.filter((i) => i.selected).reduce((s, i) => s + i.price, 0);

  // 有効期限チェック（見積データから取得、デフォルトは7日間）
  const expiresAt = estimateData?.expiresAt && typeof estimateData.expiresAt === "string"
    ? new Date(estimateData.expiresAt).toISOString()
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7日後
  const isExpired = isEstimateExpired(expiresAt);

  // マジックリンクトークン検証中
  if (isTokenValidating) {
    return (
      <div className="flex-1 bg-slate-50 pb-32 flex items-center justify-center overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600 mx-auto mb-4" />
          <p className="text-base text-slate-700">認証を確認しています...</p>
        </div>
      </div>
    );
  }

  // マジックリンクトークン検証エラー
  if (tokenValidationError) {
    return (
      <div className="flex-1 bg-slate-50 pb-32 flex items-center justify-center overflow-auto">
        <Card className="max-w-5xl mx-4">
          <CardContent className="py-8 text-center">
            <p className="text-slate-700 mb-4">{tokenValidationError}</p>
            <p className="text-base text-slate-700">メールに記載されたリンクを再度ご確認ください。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ローディング中
  if (isJobLoading || isLoadingWorkOrders) {
    return (
      <div className="flex-1 bg-slate-50 pb-32 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-32 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // エラーまたは見積データがない場合
  if (!job || !estimateData || !estimateData.items || estimateData.items.length === 0) {
    // workOrderIdが指定されているが、ワークオーダーが見つからない場合
    if (workOrderId && (!workOrdersList || workOrdersList.length === 0 || !selectedWorkOrder)) {
      return (
        <div className="flex-1 bg-slate-50 pb-32 flex items-center justify-center overflow-auto">
          <Card className="max-w-5xl mx-4">
            <CardContent className="py-8 text-center">
              <p className="text-slate-700 mb-4">指定された作業が見つかりませんでした</p>
              <p className="text-base text-slate-700">作業ID: {workOrderId}</p>
              <p className="text-base text-slate-700 mt-2">見積が作成されていないか、既に承認済みの可能性があります。</p>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // デバッグ情報を表示
    const debugInfo = {
      hasWorkOrders: workOrdersList && workOrdersList.length > 0,
      workOrdersCount: workOrdersList?.length || 0,
      workOrderId: workOrderId || "なし",
      selectedWorkOrderId: selectedWorkOrder?.id || "なし",
      hasEstimate: selectedWorkOrder?.estimate ? "あり" : "なし",
      estimateItemsCount: selectedWorkOrder?.estimate?.items?.length || 0,
      allWorkOrdersEstimate: workOrdersList?.map((wo) => ({
        id: wo.id,
        hasEstimate: wo.estimate ? "あり" : "なし",
        itemsCount: wo.estimate?.items?.length || 0,
      })) || [],
    };
    
    return (
      <div className="flex-1 bg-slate-50 pb-32 flex items-center justify-center overflow-auto">
        <Card className="max-w-5xl mx-4">
          <CardContent className="py-8 text-center">
            <p className="text-slate-700 mb-4">見積データが見つかりませんでした</p>
            <p className="text-base text-slate-700">見積が作成されていないか、既に承認済みの可能性があります。</p>
            {workOrderId && (
              <p className="text-base text-slate-600 mt-2">作業ID: {workOrderId}</p>
            )}
            {/* デバッグ情報（開発環境のみ） */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-4 p-4 bg-slate-100 rounded-lg text-left text-sm">
                <p className="font-semibold mb-2">デバッグ情報:</p>
                <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 完了画面
  if (isCompleted) {
    return <ThankYouScreen customerName={customerName} />;
  }

  return (
    <div className="flex-1 bg-slate-50 pb-32 overflow-auto">
      <AppHeader
        maxWidthClassName="max-w-5xl"
        backHref={backHref}
        rightArea={
          isExpired && (
            <Badge variant="destructive" className="text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
              有効期限切れ
            </Badge>
          )
        }
      >
        <div>
          <p className="text-base text-slate-700 mb-2">お見積り</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {customerName} 様
          </h1>
          <div className="flex items-center gap-2 mt-1 text-base text-slate-800">
            <Car className="h-4 w-4 shrink-0" />
            <span>{vehicleName}</span>
            {licensePlate && (
              <>
                <span className="text-slate-300">|</span>
                <span>{licensePlate}</span>
              </>
            )}
          </div>
          {!isExpired && estimateData?.expiresAt && typeof estimateData.expiresAt === "string" ? (
            <p className="text-base text-slate-700 mt-2">
              有効期限: {new Date(estimateData.expiresAt as string).toLocaleDateString("ja-JP")}
            </p>
          ) : null}
        </div>
      </AppHeader>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* CitNOWスタイル: 上部に動画プレイヤー */}
        {mainVideoUrl && (
          <section className="mb-6">
            <Card className="border border-slate-300 rounded-xl shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-slate-900">
                  <video
                    src={mainVideoUrl}
                    controls
                    className="w-full h-full"
                    playsInline
                  />
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1.5 rounded-md text-base font-medium">
                    メカニックの解説動画
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-300">
                  <p className="text-base font-medium text-slate-900">{mainVideoTitle}</p>
                  <p className="text-base text-slate-700 mt-1">
                    メカニックが実際の車両を確認しながら、必要な整備内容を説明しています
                  </p>
                  {/* 実況解説テキスト（音声認識結果） */}
                  {items.find((item) => item.videoUrl === mainVideoUrl)?.transcription && (
                    <div className="mt-3 p-4 bg-white rounded-lg border border-slate-300">
                      <p className="text-base font-medium text-slate-900 mb-2">📝 メカニックの実況解説</p>
                      <p className="text-base text-slate-700 leading-relaxed">
                        {items.find((item) => item.videoUrl === mainVideoUrl)?.transcription}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 診断結果セクション */}
        {selectedWorkOrder?.diagnosis && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 shrink-0" />
              診断結果
            </h2>
            <Card className="border border-slate-300 rounded-xl shadow-md">
              <CardContent className="p-4 space-y-4">
                {/* 走行距離 */}
                {selectedWorkOrder.diagnosis.mileage && (
                  <div className="pb-3 border-b border-slate-200">
                    <p className="text-base font-medium text-slate-900">走行距離</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {selectedWorkOrder.diagnosis.mileage.toLocaleString()}km
                    </p>
                  </div>
                )}
                
                {/* 診断項目のサマリー */}
                {selectedWorkOrder.diagnosis.items && selectedWorkOrder.diagnosis.items.length > 0 && (
                  <div>
                    <p className="text-base font-medium text-slate-900 mb-3">確認項目</p>
                    <div className="space-y-2">
                      {selectedWorkOrder.diagnosis.items.map((item) => {
                        const statusConfig = {
                          green: { label: "OK", variant: "default" as const, color: "text-green-700" },
                          yellow: { label: "注意", variant: "secondary" as const, color: "text-amber-700" },
                          red: { label: "要交換", variant: "destructive" as const, color: "text-red-700" },
                        };
                        const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.green;
                        
                        return (
                          <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <Badge variant={config.variant} className="text-base font-medium shrink-0">
                              {config.label}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-slate-900">{item.name}</p>
                              {item.comment && (
                                <p className="text-base text-slate-700 mt-1">{item.comment}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* 受入点検写真ギャラリー（車検の場合） */}
        {selectedWorkOrder?.diagnosis?.photos && selectedWorkOrder.diagnosis.photos.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 shrink-0" />
              受入点検写真
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {selectedWorkOrder.diagnosis.photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => handlePhotoClick(photo.url, photo.position)}
                  className="relative aspect-square rounded-lg overflow-hidden border border-slate-300 hover:border-blue-500 transition-colors group"
                  aria-label={`${photo.position}の写真を確認`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.position}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-2 py-1.5 text-base font-medium">
                    {photo.position === "engine-room" ? "エンジンルーム" :
                     photo.position === "tire" ? "タイヤ" :
                     photo.position === "air-filter" ? "エアコンフィルター" :
                     photo.position === "front" ? "フロント" :
                     photo.position === "rear" ? "リア" :
                     photo.position === "side" ? "サイド" :
                     photo.position === "interior" ? "室内" :
                     photo.position === "undercarriage" ? "下回り" :
                     photo.position}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <Separator className="my-6" />

        {/* ショッピングリスト（見積項目） */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 shrink-0" />
            ご確認いただく項目
          </h2>
        </div>

        {/* 法定費用セクション（車検の場合のみ） */}
        {legalFees && (
          <>
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-5 w-5 text-slate-700 shrink-0" />
                <h2 className="text-xl font-bold text-slate-900">法定費用（自動取得・編集不可）</h2>
              </div>
              <Card className="bg-slate-50 border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    {convertLegalFeesToItems(legalFees).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-medium text-slate-800">
                              {item.name}
                            </span>
                            {item.description && (
                              <span className="text-base text-slate-700">
                                ({item.description})
                              </span>
                            )}
                            {!item.required && (
                              <Badge variant="outline" className="text-base">
                                任意
                              </Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-base font-semibold text-slate-900">
                          ¥{formatPrice(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-3 border-t-2 border-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-slate-900">
                        法定費用合計
                      </span>
                      <span className="text-lg font-bold text-slate-900">
                        ¥{formatPrice(legalFees.total)}
                      </span>
                    </div>
                    <p className="text-base text-slate-700 mt-1">※税込</p>
                  </div>
                </CardContent>
              </Card>
            </section>
            <Separator className="my-6" />
          </>
        )}

        {/* 必須整備セクション */}
        <section className="mb-6">
          <SectionHeader
            priority="required"
            count={requiredItems.length}
            total={requiredTotal}
          />
          <div className="space-y-3">
            {requiredItems.map((item) => (
              <EstimateItemCard
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onPhotoClick={handlePhotoClick}
                onVideoClick={handleVideoClick}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-base text-slate-700">
            <Lock className="h-4 w-4 shrink-0" />
            <span>必須項目は変更できません</span>
          </div>
        </section>

        <Separator className="my-6" />

        {/* 推奨整備セクション */}
        <section className="mb-6">
          <SectionHeader
            priority="recommended"
            count={recommendedItems.filter((i) => i.selected).length}
            total={recommendedTotal}
          />
          <div className="space-y-3">
            {recommendedItems.map((item) => (
              <EstimateItemCard
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onPhotoClick={handlePhotoClick}
                onVideoClick={handleVideoClick}
              />
            ))}
          </div>
        </section>

        <Separator className="my-6" />

        {/* 任意整備セクション */}
        <section className="mb-6">
          <SectionHeader
            priority="optional"
            count={optionalItems.filter((i) => i.selected).length}
            total={optionalTotal}
          />
          <div className="space-y-3">
            {optionalItems.map((item) => (
              <EstimateItemCard
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onPhotoClick={handlePhotoClick}
                onVideoClick={handleVideoClick}
              />
            ))}
          </div>
        </section>
      </main>

      {/* スティッキーフッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {/* 合計金額 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium text-slate-900">合計（税込）</span>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              ¥{formatPrice(displayTotal)}
            </span>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(true)}
              size="lg"
              className="flex-1 h-12 text-base font-medium gap-2 border-red-300 text-red-700 hover:bg-red-50"
              disabled={isExpired || isApproving || isRejecting}
              aria-label="見積を却下"
            >
              <X className="h-5 w-5 shrink-0" aria-hidden="true" />
              見積を却下
            </Button>
            <Button
              onClick={handleOrder}
              size="lg"
              className="flex-1 h-12 text-base font-bold gap-2 bg-slate-900 hover:bg-slate-800 text-white"
              disabled={items.filter((i) => i.selected).length === 0 || isExpired || isApproving || isRejecting}
              aria-label={isExpired ? "有効期限切れ" : "この内容で作業を依頼する"}
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden="true" />
                  処理中...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {isExpired ? "有効期限切れ" : "この内容で作業を依頼する"}
                </>
              )}
            </Button>
          </div>

          <p className="text-base text-center text-slate-700 mt-2">
            このボタンを押すと、選択した内容で作業を依頼します
          </p>
          {items.filter((i) => i.selected).length === 0 && (
            <p className="text-base text-center text-red-700 mt-1">
              少なくとも1つの項目を選択してください
            </p>
          )}
        </div>
      </div>

      {/* 写真Lightboxダイアログ */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg p-2">
          <DialogTitle className="sr-only">
            {lightboxImage?.name || "写真"}
          </DialogTitle>
          {lightboxImage && (
            <div>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <Image
                  src={lightboxImage.url}
                  alt={lightboxImage.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
              <p className="text-center text-base text-slate-800 mt-2">
                {lightboxImage.name}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 動画Lightboxダイアログ */}
      <Dialog open={!!lightboxVideo} onOpenChange={() => setLightboxVideo(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl p-2">
          <DialogTitle className="sr-only">
            {lightboxVideo?.name || "動画"}
          </DialogTitle>
          {lightboxVideo && (
            <div>
              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <video
                  src={lightboxVideo.url}
                  controls
                  className="w-full h-full"
                  playsInline
                  autoPlay
                />
              </div>
              <p className="text-center text-base text-slate-800 mt-2">
                {lightboxVideo.name}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 見積却下ダイアログ */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="text-xl font-bold text-slate-900">
            見積を却下
          </DialogTitle>
          <div className="space-y-4 py-4">
            <p className="text-base text-slate-700">
              見積を却下する理由を入力してください。事務員が確認し、見積を再作成します。
            </p>
            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="text-base font-medium text-slate-900">
                却下理由 <span className="text-red-600">*</span>
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="例: 金額が予算を超えているため、一部の項目を削減して再見積をお願いします"
                className="w-full min-h-[120px] px-3 py-2 text-base border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                disabled={isRejecting}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
              }}
              disabled={isRejecting}
              className="h-12 text-base"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isRejecting}
              className="h-12 text-base bg-red-600 hover:bg-red-700 text-white"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" />
                  処理中...
                </>
              ) : (
                "却下する"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

