"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { fetchJobById, fetchCustomerById, updateJobStatus } from "@/lib/api";
import { findVehicleMasterById } from "@/lib/google-sheets";
import { CoatingPreEstimateView } from "@/components/features/coating-pre-estimate-view";
import { CoatingType, CoatingOptionId } from "@/lib/coating-config";
import { generateMagicLink, sendLineNotification } from "@/lib/line-api";
import { ChevronLeft, Car, AlertCircle } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { ZohoJob, PreEstimateData } from "@/types";
import { savePreEstimateData, loadPreEstimateData } from "@/lib/pre-estimate-storage";

// =============================================================================
// Fetchers
// =============================================================================

async function jobFetcher(jobId: string): Promise<ZohoJob | null> {
  if (!jobId) return null;
  const result = await fetchJobById(jobId);
  return result.success && result.data ? result.data : null;
}

// =============================================================================
// Component
// =============================================================================

export default function CoatingPreEstimatePage() {
  const router = useRouter();
  const params = useParams();
  const jobId = useMemo(() => (params?.id ?? "") as string, [params]);

  // SWRでジョブデータを取得
  const {
    data: job,
    error: jobError,
    isLoading: isJobLoading,
    mutate: mutateJob,
  } = useSWR(jobId ? `job-${jobId}` : null, () => jobFetcher(jobId), {
    revalidateOnFocus: false,
  });

  // 車両IDを抽出（field6.nameから車両IDを抽出）
  const vehicleId = useMemo(() => {
    if (!job?.field6?.name) return null;
    // field6.nameの形式: "車両ID / 登録番号" または "車両ID"
    const parts = job.field6.name.split(" / ");
    return parts[0] || job.field6.name;
  }, [job]);

  // 車両マスタを取得（車両の寸法情報を取得するため）
  const {
    data: vehicleMaster,
    error: vehicleError,
    isLoading: isVehicleLoading,
  } = useSWR(
    vehicleId ? `vehicle-master-${vehicleId}` : null,
    async () => {
      if (!vehicleId) return null;
      try {
        return await findVehicleMasterById(vehicleId);
      } catch (error) {
        console.error("[Coating Pre-Estimate] 車両マスタ取得エラー:", error);
        return null;
      }
    },
    {
      revalidateOnFocus: false,
    }
  );

  // コーティング種類の状態管理
  const [selectedCoatingType, setSelectedCoatingType] = useState<CoatingType | null>(null);
  
  // オプション選択の状態管理
  const [selectedOptionIds, setSelectedOptionIds] = useState<CoatingOptionId[]>([]);

  // 基本コーティング金額（車両の寸法に応じて変動）
  // 注意: 現時点ではマスタデータから金額を取得する機能は未実装のため、参考価格を使用
  const baseCoatingPrice = useMemo(() => {
    // 将来的には、車両の寸法情報（vehicleMaster?.dimensions）に基づいて
    // マスタデータから金額を取得する機能を実装
    // 現時点では、選択されたコーティング種類の参考価格を使用
    return undefined; // CoatingPreEstimateViewで参考価格を使用
  }, [vehicleMaster, selectedCoatingType]);

  // 送信中フラグ
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 既存の事前見積データを読み込む
  useEffect(() => {
    if (!job) return;
    
    const loadExistingData = async () => {
      try {
        const existingData = await loadPreEstimateData(jobId, job);
        if (existingData) {
          // 既存データを復元
          setSelectedCoatingType(existingData.coatingType as CoatingType);
          setSelectedOptionIds(existingData.selectedOptions as CoatingOptionId[]);
        }
      } catch (error) {
        console.error("[Coating Pre-Estimate] 既存データ読み込みエラー:", error);
        // エラー時は続行（新規作成として扱う）
      }
    };
    
    loadExistingData();
  }, [job, jobId]);

  /**
   * 見積送信ハンドラ
   */
  const handleSendEstimate = async (estimate: {
    coatingType: CoatingType;
    basePrice: number;
    selectedOptions: CoatingOptionId[];
    optionsTotal: number;
    total: number;
    createdAt?: string;
  }) => {
    if (!job) {
      toast.error("ジョブ情報が取得できませんでした");
      return;
    }

    setIsSubmitting(true);

    try {
      // 事前見積データを保存
      const preEstimateData: PreEstimateData = {
        coatingType: estimate.coatingType,
        basePrice: estimate.basePrice,
        selectedOptions: estimate.selectedOptions,
        optionsTotal: estimate.optionsTotal,
        total: estimate.total,
        createdAt: estimate.createdAt || new Date().toISOString(),
        sentAt: new Date().toISOString(),
      };
      
      try {
        await savePreEstimateData(jobId, preEstimateData, job);
      } catch (error) {
        console.error("[Coating Pre-Estimate] 事前見積データ保存エラー:", error);
        // 保存失敗時も見積送信は継続
        toast.warning("見積は送信されましたが、データの保存に失敗しました");
      }

      // 顧客のLINE User IDを取得
      let lineUserId: string | undefined;
      if (job.field4?.id) {
        const customerResult = await fetchCustomerById(job.field4.id);
        if (customerResult.success && customerResult.data) {
          lineUserId = customerResult.data.Business_Messaging_Line_Id || undefined;
        }
      }

      // マジックリンクを生成
      let magicLinkUrl = "";
      try {
        const magicLinkResult = await generateMagicLink({
          jobId: job.id,
          workOrderId: undefined, // 事前見積の場合はworkOrderIdはundefined
          expiresIn: 7 * 24 * 60 * 60 * 1000, // 7日間有効
        });
        if (magicLinkResult.success && magicLinkResult.url) {
          magicLinkUrl = magicLinkResult.url;
        }
      } catch (error) {
        console.error("[Coating Pre-Estimate] マジックリンク生成エラー:", error);
        // マジックリンク生成失敗時も見積送信は継続
      }

      // LINE通知を送信
      if (lineUserId) {
        try {
          const customerName = job.field4?.name || "お客様";
          await sendLineNotification({
            type: "estimate_sent",
            jobId: job.id,
            lineUserId,
            data: {
              customerName,
              vehicleName: job.field6?.name ? (() => {
                const parts = job.field6.name.split(" / ");
                return parts[0] || job.field6.name;
              })() : "車両",
              licensePlate: job.field6?.name ? (() => {
                const parts = job.field6.name.split(" / ");
                return parts[1] || parts[0] || "";
              })() : "",
              serviceKind: "コーティング",
              magicLinkUrl,
            },
          });
        } catch (error) {
          console.error("[Coating Pre-Estimate] LINE通知送信エラー:", error);
          // LINE通知失敗時も見積送信は成功として扱う
          toast.warning("見積は送信されましたが、LINE通知の送信に失敗しました");
        }
      }

      // ステータスを「顧客承認待ち」に更新
      try {
        await updateJobStatus(job.id, "見積提示済み");
        await mutateJob();
      } catch (error) {
        console.error("[Coating Pre-Estimate] ステータス更新エラー:", error);
        // ステータス更新失敗時も見積送信は成功として扱う
      }

      toast.success("見積を送信しました");
      
      // 見積画面に遷移（またはトップページに戻る）
      router.push(`/admin/estimate/${job.id}`);
    } catch (error) {
      console.error("[Coating Pre-Estimate] 見積送信エラー:", error);
      toast.error("見積の送信に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ローディング状態
  if (isJobLoading || isVehicleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppHeader />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // エラー状態
  if (jobError || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppHeader />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>ジョブ情報の取得に失敗しました</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // コーティングでない場合のエラー
  const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  const isCoating = serviceKinds.includes("コーティング" as any);
  
  if (!isCoating) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppHeader />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>このジョブはコーティングではありません</p>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/admin/estimate/${job.id}`)}
              >
                見積画面に戻る
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/admin/estimate/${job.id}`}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5 shrink-0" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {job.field4?.name || "お客様"} {job.field6?.name ? (() => {
                const parts = job.field6.name.split(" / ");
                return parts[0] || job.field6.name;
              })() : "車両"} コーティング事前見積
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              入庫前に見積もりを提示し、顧客の承認を得てから入庫します
            </p>
          </div>
        </div>

        {/* 車両情報カード */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Car className="h-5 w-5 shrink-0" />
              車両情報
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-slate-600">登録番号</span>
              <span className="font-medium text-slate-900">
                {job.field6?.name ? (() => {
                  const parts = job.field6.name.split(" / ");
                  return parts[1] || parts[0] || "未設定";
                })() : "未設定"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-slate-600">車台番号</span>
              <span className="font-medium text-slate-900">
                {job.field6?.id || "未設定"}
              </span>
            </div>
            {vehicleMaster && (
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">車両の寸法</span>
                <span className="font-medium text-slate-900">
                  未設定（金額計算用）
                </span>
              </div>
            )}
            {!vehicleMaster && !isVehicleLoading && (
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600">車両の寸法</span>
                <span className="text-sm text-slate-500">
                  車両マスタから取得できませんでした（参考価格を使用）
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* コーティング事前見積ビュー */}
        <CoatingPreEstimateView
          selectedCoatingType={selectedCoatingType}
          onCoatingTypeChange={setSelectedCoatingType}
          selectedOptionIds={selectedOptionIds}
          onOptionChange={setSelectedOptionIds}
          baseCoatingPrice={baseCoatingPrice}
          onSendEstimate={handleSendEstimate}
          disabled={isSubmitting}
        />

        {/* 注意事項 */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900">注意事項</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>• 乾燥時間は数日かかります</p>
            <p>• 車両を預ける必要があります</p>
            <p>• 効果の持続期間は1年から3年です</p>
            <p>• 下地処理はコーティング費用に含まれます</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}





