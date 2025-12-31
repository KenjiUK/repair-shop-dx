"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Camera,
  FileText,
  LogOut,
  Check,
  Car,
  AlertTriangle,
} from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { ComparisonCard } from "@/components/features/presentation-page/comparison-card";
import { CustomerInfoCard } from "@/components/features/presentation-page/customer-info-card";
import { WorkSummaryTab } from "@/components/features/presentation-page/work-summary-tab";
import { InvoiceTab } from "@/components/features/presentation-page/invoice-tab";
import { updateJob } from "@/lib/zoho-api-client";
import { useWorkOrders, updateWorkOrder } from "@/hooks/use-work-orders";
import useSWR, { mutate } from "swr";
import { fetchJobById, updateJobField7, checkOut, fetchAllCourtesyCars } from "@/lib/api";
import { InspectionCheckoutChecklistDialog } from "@/components/features/inspection-checkout-checklist-dialog";
import { parseInspectionChecklistFromField7, appendInspectionChecklistToField7 } from "@/lib/inspection-checklist-parser";
import { InspectionChecklist, ServiceKind } from "@/types";
import { setNavigationHistory, getBackHref, getPageTypeFromPath, saveCurrentPath } from "@/lib/navigation-history";
import { useEffect } from "react";
import { WorkOrderList, canCheckout as checkWorkOrdersCompleted } from "@/components/features/work-order-list";

// =============================================================================
// Types
// =============================================================================

interface BeforeAfterPhoto {
  id: string;
  itemName: string;
  category: string;
  beforeUrl: string;
  afterUrl: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 車両情報から車両名を抽出
 */
function extractVehicleName(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "車両未登録";
  const parts = vehicleInfo.split(" / ");
  return parts[0] || vehicleInfo;
}

/**
 * 車両情報からナンバープレートを抽出
 */
function extractLicensePlate(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "";
  const parts = vehicleInfo.split(" / ");
  return parts[1] || "";
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP").format(price);
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function PresentationPage() {
  const router = useRouter();
  // Next.js 16対応: paramsは既に同期的に値を返す
  const params = useParams();
  const jobId = useMemo(() => (params?.id ?? "") as string, [params]);

  // SWRでジョブデータを取得
  const {
    data: jobResult,
    error: jobError,
    isLoading: isJobLoading,
    mutate: mutateJob,
  } = useSWR(jobId ? `job-${jobId}` : null, jobId ? async () => {
    const result = await fetchJobById(jobId);
    if (!result.success) {
      throw new Error(result.error?.message ?? "案件の取得に失敗しました");
    }
    return result;
  } : null, {
    revalidateOnFocus: false,
    revalidateOnMount: true, // 初回アクセス時は必ずデータを取得する
  });

  const job = jobResult?.data;

  // ワークオーダーを取得
  const { workOrders, isLoading: isLoadingWorkOrders } = useWorkOrders(jobId);

  // 代車リストを取得（代車返却確認用）
  const {
    data: courtesyCarsResult,
    isLoading: isCourtesyCarsLoading,
  } = useSWR("courtesy-cars", async () => {
    const result = await fetchAllCourtesyCars();
    return result.success && result.data ? result.data : [];
  }, {
    revalidateOnFocus: false,
  });

  const courtesyCars = Array.isArray(courtesyCarsResult) ? courtesyCarsResult : [];

  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isCourtesyCarReturnDialogOpen, setIsCourtesyCarReturnDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [isInspectionCheckoutChecklistDialogOpen, setIsInspectionCheckoutChecklistDialogOpen] = useState(false);
  const [inspectionChecklist, setInspectionChecklist] = useState<InspectionChecklist | null>(null);

  // ナビゲーション履歴を記録
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname + window.location.search;
    const currentPathname = window.location.pathname;

    // 前回保存されたパスを取得（sessionStorageから）
    let previousPath: string | null = null;
    try {
      previousPath = sessionStorage.getItem("repair-shop-current-path");
    } catch (error) {
      console.error("[Presentation] Failed to get previous path from sessionStorage:", error);
    }

    // リファラー（遷移元）を取得（フォールバック用）
    const referrer = document.referrer;

    // 前回保存されたパスがある場合、それを優先して使用
    if (previousPath && previousPath !== currentPath) {
      try {
        const previousUrl = new URL(previousPath, window.location.origin);
        const previousPathname = previousUrl.pathname;
        const referrerType = getPageTypeFromPath(previousPathname);
        
        // 履歴を記録（前の画面のパスとタイプを記録）
        setNavigationHistory(previousPath, referrerType);
        
        if (process.env.NODE_ENV === "development") {
          console.log("[Presentation] Navigation history saved from sessionStorage:", { previousPath, referrerType });
        }
      } catch (error) {
        console.error("[Presentation] Failed to parse previous path:", error);
        // エラーが発生した場合は、document.referrerを使用
        previousPath = null;
      }
    }

    // 前回保存されたパスがない場合、document.referrerを使用（フォールバック）
    if (!previousPath && referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const currentOrigin = window.location.origin;

        // 同じオリジンのみ記録（外部サイトからの遷移は無視）
        if (referrerUrl.origin === currentOrigin) {
          const referrerPath = referrerUrl.pathname + referrerUrl.search;
          const referrerType = getPageTypeFromPath(referrerUrl.pathname);

          // 現在のページと同じページへの遷移は記録しない（リロードなど）
          if (referrerPath !== currentPath) {
            // 履歴を記録（前の画面のパスとタイプを記録）
            setNavigationHistory(referrerPath, referrerType);
            
            if (process.env.NODE_ENV === "development") {
              console.log("[Presentation] Navigation history saved from referrer:", { referrerPath, referrerType });
            }
          }
        }
      } catch (error) {
        console.error("[Presentation] Failed to record navigation history from referrer:", error);
      }
    }

    // 現在のパスを保存（次回のページ読み込み時に使用）
    saveCurrentPath(currentPathname, window.location.search);
  }, []);

  // 顧客情報と車両情報を取得
  const customerName = job?.field4?.name || (isJobLoading ? "読み込み中..." : "未登録");
  const vehicleInfo = job?.field6?.name || "";
  const vehicleName = extractVehicleName(vehicleInfo);
  const licensePlate = extractLicensePlate(vehicleInfo);
  const tagId = job?.tagId || null;
  const mileage = job?.field10 || null;
  const arrivalDateTime = job?.field22 || null;
  const assignedMechanic = job?.assignedMechanic || null;
  const customerPhone = null; // field4はZohoLookup型のため、顧客情報は別途取得が必要

  // Before/After写真を生成（ワークオーダーから）
  const photos: BeforeAfterPhoto[] = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return [];

    const items: BeforeAfterPhoto[] = [];
    
    workOrders.forEach((workOrder) => {
      if (workOrder.work?.records) {
        (workOrder.work.records as Array<{ photos?: Array<{ type: string; url: string; fileId?: string }>; content?: string }>).forEach((record, index) => {
          if (record.photos && record.photos.length > 0) {
            const beforePhotos = record.photos.filter((p) => p.type === "before");
            const afterPhotos = record.photos.filter((p) => p.type === "after");

            if (beforePhotos.length > 0) {
              beforePhotos.forEach((beforePhoto, photoIndex) => {
                const afterPhoto = afterPhotos[photoIndex] || null;
                items.push({
                  id: `${workOrder.id}-${index}-${photoIndex}`,
                  itemName: record.content || `${workOrder.serviceKind}作業`,
                  category: workOrder.serviceKind,
                  beforeUrl: beforePhoto.url,
                  afterUrl: afterPhoto?.url || "",
                });
              });
            } else if (afterPhotos.length > 0) {
              afterPhotos.forEach((afterPhoto, photoIndex) => {
                items.push({
                  id: `${workOrder.id}-${index}-after-${photoIndex}`,
                  itemName: record.content || `${workOrder.serviceKind}作業`,
                  category: workOrder.serviceKind,
                  beforeUrl: "",
                  afterUrl: afterPhoto.url,
                });
              });
            }
          }
        });
      }
    });

    return items;
  }, [workOrders]);

  // 作業項目リストを生成（見積データから）
  const workItems = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return [];

    const items: Array<{ name: string; price: number }> = [];
    
    workOrders.forEach((workOrder) => {
      if (workOrder.estimate?.items) {
        workOrder.estimate.items.forEach((item) => {
          items.push({
            name: item.name,
            price: item.price,
          });
        });
      }
    });

    return items;
  }, [workOrders]);

  // 合計金額を計算
  const totalAmount = useMemo(() => {
    return workItems.reduce((sum, item) => sum + item.price, 0);
  }, [workItems]);

  // 完了日時を取得
  const completedAt = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return null;
    
    // 最初のワークオーダーの作業完了日時を取得
    const firstWorkOrder = workOrders[0];
    if (firstWorkOrder.work?.completedAt) {
      return firstWorkOrder.work.completedAt;
    }
    
    return job?.field22 || new Date().toISOString();
  }, [workOrders, job]);

  /**
   * 請求書PDF表示
   */
  const handleShowInvoice = () => {
    toast.info("請求書PDFを表示します", {
      description: `${customerName}様_請求書.pdf`,
    });
    // 実際の実装ではPDFビューアーを開く
  };

  // 納車可能かどうかを判定（全作業グループが完了している場合のみ）
  const canCheckoutNow = useMemo(() => {
    // ワークオーダーがない場合（従来の単一作業）は常に納車可能
    if (!workOrders || workOrders.length === 0) return true;
    // 複合業務の場合は全作業グループが完了している必要がある
    return checkWorkOrdersCompleted(workOrders);
  }, [workOrders]);

  /**
   * 出庫完了処理
   */
  const handleCheckout = async () => {
    if (!job) return;

    // 複合業務で未完了の作業グループがある場合は警告
    if (!canCheckoutNow) {
      toast.error("納車できません", {
        description: "すべての作業グループが完了していません",
      });
      return;
    }

    // 代車が紐付けられているかどうかを確認（配列チェックを追加）
    const linkedCourtesyCar = Array.isArray(courtesyCars) ? courtesyCars.find((car) => car.jobId === jobId) : undefined;
    
    if (linkedCourtesyCar) {
      // 代車が紐付けられている場合、確認ダイアログを表示
      setIsCheckoutDialogOpen(false);
      setIsCourtesyCarReturnDialogOpen(true);
      return;
    }

    // 代車が紐付けられていない場合、通常の出庫処理を実行
    await executeCheckout();
  };

  /**
   * 出庫処理を実行（代車返却含む）
   */
  const executeCheckout = async (returnCourtesyCar: boolean = true) => {
    if (!job) return;

    // 車検の場合、チェックリストダイアログを表示
    const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
    const isInspection = serviceKinds.includes("車検" as ServiceKind);
    
    if (isInspection) {
      // 既存のチェックリストを読み込む
      const existingChecklist = parseInspectionChecklistFromField7(job.field7, job.id);
      setInspectionChecklist(existingChecklist);
      setIsCourtesyCarReturnDialogOpen(false);
      setIsInspectionCheckoutChecklistDialogOpen(true);
    } else {
      // 車検以外の場合は通常の出庫処理
      try {
        // 出庫完了処理を実行（代車返却オプションを指定）
        const result = await checkOut(jobId, { returnCourtesyCar });
        
        if (!result.success) {
          throw new Error(result.error?.message || "出庫処理に失敗しました");
        }

        // SWRキャッシュを更新
        await mutateJob();
        // トップページのジョブリストも更新
        await mutate("today-jobs");
        // 代車リストも更新
        await mutate("courtesy-cars");

        toast.success(tagId ? `タグ No.${tagId} の紐付けを解除しました` : "出庫処理が完了しました", {
          description: "ステータスを「出庫済み」に更新しました",
        });

        setIsCheckoutDialogOpen(false);
        setIsCourtesyCarReturnDialogOpen(false);

        // 1.5秒後にトップへ戻る
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } catch (error) {
        console.error("Checkout error:", error);
        toast.error("出庫処理に失敗しました", {
          description: error instanceof Error ? error.message : "エラーが発生しました",
        });
      }
    }
  };
  
  /**
   * 車検チェックリスト確定時のハンドラ
   */
  const handleInspectionCheckoutChecklistConfirm = async () => {
    if (!job || !inspectionChecklist) return;
    
    try {
      // field7にチェックリスト情報を保存
      const updatedField7 = appendInspectionChecklistToField7(job.field7, inspectionChecklist);
      await updateJobField7(job.id, updatedField7);
      
      toast.success("チェックリストを保存しました");
      
      // 出庫完了処理を実行（代車返却を含む）
      const result = await checkOut(jobId, { returnCourtesyCar: true });
      
      if (!result.success) {
        throw new Error(result.error?.message || "出庫処理に失敗しました");
      }

      // SWRキャッシュを更新
      await mutateJob();
      // トップページのジョブリストも更新
      await mutate("today-jobs");
      // 代車リストも更新
      await mutate("courtesy-cars");

      toast.success(tagId ? `タグ No.${tagId} の紐付けを解除しました` : "出庫処理が完了しました", {
        description: "ステータスを「出庫済み」に更新しました",
      });

      setIsInspectionCheckoutChecklistDialogOpen(false);
      setInspectionChecklist(null);

      // 1.5秒後にトップへ戻る
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      console.error("Checklist save error:", error);
      toast.error("出庫処理に失敗しました", {
        description: error instanceof Error ? error.message : "エラーが発生しました",
      });
    }
  };

  // ローディング状態
  if (isJobLoading || !job) {
    return (
      <div className="flex-1 bg-slate-50 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
            <div className="h-32 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-64 bg-slate-200 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 overflow-auto">
      <AppHeader 
        maxWidthClassName="max-w-5xl"
        collapsibleOnMobile={true}
        backHref={getBackHref(jobId)}
        collapsedCustomerName={customerName}
        collapsedVehicleName={vehicleName}
        collapsedLicensePlate={licensePlate}
        rightArea={
          <Button
            variant="destructive"
            onClick={() => setIsCheckoutDialogOpen(true)}
            className="gap-2 h-12 text-base font-medium"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            出庫完了
          </Button>
        }
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Car className="h-5 w-5 text-slate-700 shrink-0" />
            整備完了レポート
          </h1>
          <p className="text-base text-slate-700">
            {customerName}様へのご説明用
          </p>
        </div>
      </AppHeader>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-6" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
        {/* 顧客・車両情報カード */}
        <CustomerInfoCard
          customerName={customerName}
          vehicleName={vehicleName}
          licensePlate={licensePlate}
          tagId={tagId || ""}
          mileage={mileage}
          arrivalDateTime={arrivalDateTime}
          completedAtText={completedAt ? formatDate(completedAt) : ""}
          assignedMechanic={assignedMechanic}
          customerPhone={customerPhone}
        />

        {/* 作業グループ一覧（複合業務の場合のみ表示） */}
        {workOrders && workOrders.length > 1 && (
          <div className="mt-6">
            <WorkOrderList
              workOrders={workOrders}
              readOnly={true}
              compact={true}
            />
          </div>
        )}

        {/* タブナビゲーション */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary" className="gap-2 text-base">
              <Check className="h-5 w-5 shrink-0" />
              作業内容
            </TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2 text-base">
              <FileText className="h-5 w-5 shrink-0" />
              請求書
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2 text-base">
              <Camera className="h-5 w-5 shrink-0" />
              作業前後
            </TabsTrigger>
          </TabsList>

          {/* 作業内容サマリー */}
          <TabsContent value="summary">
            <WorkSummaryTab
              items={workItems}
              totalAmountText={formatPrice(totalAmount)}
            />
          </TabsContent>

          {/* 請求書 */}
          <TabsContent value="invoice">
            <InvoiceTab
              customerName={customerName}
              onShowInvoice={handleShowInvoice}
            />
          </TabsContent>

          {/* 作業前後の写真 */}
          <TabsContent value="gallery" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {photos.map((photo) => (
                <ComparisonCard
                  key={photo.id}
                  itemName={photo.itemName}
                  category={photo.category}
                  beforeUrl={photo.beforeUrl}
                  afterUrl={photo.afterUrl}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* 出庫確認ダイアログ */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <LogOut className="h-5 w-5 shrink-0" />
              出庫確認
            </DialogTitle>
            <DialogDescription className="text-base">
              以下の内容で出庫処理を行います。よろしいですか？
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-base font-medium text-slate-700">お客様</span>
              <span className="text-base font-medium text-slate-900">{customerName} 様</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span className="text-base font-medium text-slate-700">車両</span>
              <span className="text-base font-medium text-slate-900">{vehicleName}</span>
            </div>
            {tagId && (
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-base font-medium text-slate-700">タグNo.</span>
                <span className="text-base font-medium text-slate-900">{tagId}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-base font-medium text-slate-700">請求金額</span>
              <span className="text-lg font-bold text-primary tabular-nums">¥{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)} className="h-12 text-base font-medium">
              キャンセル
            </Button>
            <Button onClick={handleCheckout} className="gap-2 h-12 text-base font-medium">
              <Check className="h-5 w-5 shrink-0" />
              出庫完了（タグ解除）
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 代車返却確認ダイアログ */}
      <Dialog open={isCourtesyCarReturnDialogOpen} onOpenChange={setIsCourtesyCarReturnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              代車返却確認
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-slate-700">
              この案件には代車が紐付けられています。
              <br />
              出庫処理と同時に代車を返却しますか？
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsCourtesyCarReturnDialogOpen(false);
                setIsCheckoutDialogOpen(true);
              }}
              className="flex-1 h-12 text-base"
            >
              キャンセル
            </Button>
            <Button
              onClick={() => executeCheckout(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
            >
              返却して出庫
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 車検出庫時チェックリストダイアログ */}
      <InspectionCheckoutChecklistDialog
        open={isInspectionCheckoutChecklistDialogOpen}
        onOpenChange={(open) => {
          setIsInspectionCheckoutChecklistDialogOpen(open);
          if (!open) {
            setInspectionChecklist(null);
          }
        }}
        job={job}
        checklist={inspectionChecklist}
        onChecklistChange={setInspectionChecklist}
        onConfirm={handleInspectionCheckoutChecklistConfirm}
        disabled={false}
      />
    </div>
  );
}

