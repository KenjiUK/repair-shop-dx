"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  ChevronLeft,
  Check,
} from "lucide-react";
import Link from "next/link";
import { ComparisonCard } from "@/components/features/presentation-page/comparison-card";
import { CustomerInfoCard } from "@/components/features/presentation-page/customer-info-card";
import { WorkSummaryTab } from "@/components/features/presentation-page/work-summary-tab";
import { InvoiceTab } from "@/components/features/presentation-page/invoice-tab";
import { uploadFile, getOrCreateJobFolder } from "@/lib/google-drive";
import { updateJob } from "@/lib/zoho-api-client";
import { useWorkOrders, updateWorkOrder } from "@/hooks/use-work-orders";
import useSWR from "swr";
import { fetchJobById } from "@/lib/api";

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
  // Next.js 16対応: paramsをuseMemoでラップして列挙を防止
  const params = useParams();
  const jobId = useMemo(() => (params?.id ?? "") as string, [params]);

  // SWRでジョブデータを取得
  const {
    data: jobResult,
    error: jobError,
    isLoading: isJobLoading,
  } = useSWR(jobId ? `job-${jobId}` : null, () => fetchJobById(jobId), {
    revalidateOnFocus: false,
  });

  const job = jobResult?.data;

  // ワークオーダーを取得
  const { workOrders, isLoading: isLoadingWorkOrders } = useWorkOrders(jobId);

  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("gallery");

  // 顧客情報と車両情報を取得
  const customerName = job?.field4?.name || (isJobLoading ? "読み込み中..." : "未登録");
  const vehicleInfo = job?.field6?.name || "";
  const vehicleName = extractVehicleName(vehicleInfo);
  const licensePlate = extractLicensePlate(vehicleInfo);
  const tagId = job?.tagId || null;

  // Before/After写真を生成（ワークオーダーから）
  const photos: BeforeAfterPhoto[] = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return [];

    const items: BeforeAfterPhoto[] = [];
    
    workOrders.forEach((workOrder) => {
      if (workOrder.work?.records) {
        workOrder.work.records.forEach((record, index) => {
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

  /**
   * 出庫完了処理
   */
  const handleCheckout = () => {
    if (!job) return;

    console.log("=== 出庫完了 ===");
    console.log("Job ID:", jobId);
    console.log("Tag ID:", tagId);

    toast.success(tagId ? `タグ No.${tagId} の紐付けを解除しました` : "出庫処理が完了しました", {
      description: "出庫処理が完了しました",
    });

    setIsCheckoutDialogOpen(false);

    // 1.5秒後にトップへ戻る
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  // ローディング状態
  if (isJobLoading || !job) {
    return (
      <div className="min-h-screen bg-slate-50">
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
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                戻る
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  整備完了レポート
                </h1>
                <p className="text-sm text-slate-600">
                  {mockJobData.customerName}様へのご説明用
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => setIsCheckoutDialogOpen(true)}
              className="gap-2"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              出庫完了
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* 顧客・車両情報カード */}
        <CustomerInfoCard
          customerName={customerName}
          vehicleName={vehicleName}
          tagId={tagId || ""}
          completedAtText={completedAt ? formatDate(completedAt) : ""}
        />

        {/* タブナビゲーション */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery" className="gap-2">
              <Camera className="h-4 w-4 shrink-0" />
              Before/After
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <Check className="h-4 w-4 shrink-0" />
              作業内容
            </TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2">
              <FileText className="h-4 w-4" />
              請求書
            </TabsTrigger>
          </TabsList>

          {/* Before/Afterギャラリー */}
          <TabsContent value="gallery" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mockPhotos.map((photo) => (
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

          {/* 作業内容サマリー */}
          <TabsContent value="summary">
            <WorkSummaryTab
              items={mockWorkItems}
              totalAmountText={formatPrice(mockJobData.totalAmount)}
            />
          </TabsContent>

          {/* 請求書 */}
          <TabsContent value="invoice">
            <InvoiceTab
              customerName={mockJobData.customerName}
              onShowInvoice={handleShowInvoice}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* 出庫確認ダイアログ */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 shrink-0" />
              出庫確認
            </DialogTitle>
            <DialogDescription>
              以下の内容で出庫処理を行います。よろしいですか？
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-500">お客様</span>
              <span className="font-medium">{customerName} 様</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-500">車両</span>
              <span className="font-medium">{vehicleName}</span>
            </div>
            {tagId && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-slate-500">タグNo.</span>
                <span className="font-medium">{tagId}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-slate-500">請求金額</span>
              <span className="font-bold text-primary">¥{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCheckout} className="gap-2">
              <Check className="h-4 w-4 shrink-0" />
              出庫完了（タグ解除）
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

