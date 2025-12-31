"use client";

import { use, useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BlogPhotoSelector, BlogPhotoItem } from "@/components/features/blog-photo-selector";
import { publishBlogPhotos, listBlogPhotosFromJobFolder } from "@/lib/blog-photo-manager";
import { CustomerProgressView } from "@/components/features/customer-progress-view";
import { fetchJobById, fetchVehicleById } from "@/lib/api";
import { useWorkOrders, updateWorkOrder } from "@/hooks/use-work-orders";
import { WorkOrder } from "@/types";
import { searchInvoicePdf, getOrCreateJobFolder } from "@/lib/google-drive";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car,
  Calendar,
  FileText,
  Download,
  Star,
  Wrench,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  ExternalLink,
  Shield,
  Heart,
  Video,
  Share2,
  Lock,
} from "lucide-react";
import { VideoCallDialog } from "@/components/features/video-call-dialog";
import { VideoShareDialog } from "@/components/features/video-share-dialog";

// =============================================================================
// Types
// =============================================================================

interface BeforeAfterItem {
  id: string;
  itemName: string;
  category: string;
  beforeUrl: string;
  afterUrl: string;
  beforeCaption: string;
  afterCaption: string;
}

interface WorkItem {
  name: string;
  price: number;
  priority?: "required" | "recommended" | "optional";
  serviceKind?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

// =============================================================================
// Helper Functions
// =============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP").format(price);
}

/**
 * 優先度ラベルを取得
 */
function getPriorityLabel(priority?: "required" | "recommended" | "optional"): string {
  switch (priority) {
    case "required":
      return "今回絶対必要";
    case "recommended":
      return "やったほうがいい";
    case "optional":
      return "お客さん次第";
    default:
      return "";
  }
}

/**
 * 優先度カラーを取得
 */
function getPriorityColor(priority?: "required" | "recommended" | "optional"): string {
  switch (priority) {
    case "required":
      return "bg-red-500";
    case "recommended":
      return "bg-amber-500";
    case "optional":
      return "bg-slate-500";
    default:
      return "bg-slate-300";
  }
}

// =============================================================================
// Components
// =============================================================================

/**
 * Before/After比較カードコンポーネント（スマホ最適化・縦並び）
 */
function BeforeAfterCard({ item }: { item: BeforeAfterItem }) {
  return (
    <Card className="overflow-hidden border border-slate-300 rounded-xl shadow-md">
      <CardHeader className="pb-3 bg-slate-50">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">{item.category}</Badge>
          <CardTitle className="text-lg font-semibold text-slate-900">{item.itemName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* 作業前 */}
        {item.beforeUrl && (
          <div className="relative aspect-[3/2]">
            <Image
              src={item.beforeUrl}
              alt="作業前"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
            <Badge className="absolute top-3 left-3 bg-slate-800/90 text-base font-medium px-2.5 py-1">作業前</Badge>
            {item.beforeCaption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-base">{item.beforeCaption}</p>
              </div>
            )}
          </div>
        )}

        {/* 矢印 */}
        {(item.beforeUrl || item.afterUrl) && (
          <div className="flex items-center justify-center py-2 bg-slate-100">
            <div className="flex items-center gap-2 text-slate-700">
              <ArrowRight className="h-5 w-5 shrink-0" />
              <span className="text-base font-medium">交換・整備</span>
              <ArrowRight className="h-5 w-5 shrink-0" />
            </div>
          </div>
        )}

        {/* 作業後 */}
        {item.afterUrl && (
          <div className="relative aspect-[3/2]">
            <Image
              src={item.afterUrl}
              alt="作業後"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
            <Badge className="absolute top-3 left-3 bg-green-600 text-base font-medium px-2.5 py-1">作業後 ✓</Badge>
            {item.afterCaption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-base">{item.afterCaption}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 整備士コメント吹き出しコンポーネント
 */
function MechanicCommentBubble({
  mechanicName,
  comment,
}: {
  mechanicName: string;
  comment: string;
}) {
  return (
    <div className="flex gap-3">
      {/* アバター */}
      <div className="shrink-0">
        <Avatar className="w-12 h-12 border-2 border-primary">
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {mechanicName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 吹き出し */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-slate-800">{mechanicName}</span>
          <Badge variant="secondary" className="text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">整備士</Badge>
        </div>
        <div className="relative bg-slate-100 rounded-2xl rounded-tl-none p-4">
          {/* 吹き出しの三角 */}
          <div className="absolute -left-2 top-0 w-0 h-0 border-t-[12px] border-t-slate-100 border-l-[12px] border-l-transparent" />
          <p className="text-slate-800 text-base whitespace-pre-line leading-relaxed">
            {comment}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function CustomerReportPage() {
  // Next.js 16対応: paramsは既に同期的に値を返す
  const params = useParams();
  const reportId = useMemo(() => (params?.id ?? "") as string, [params]);

  // SWRでジョブデータを取得
  const {
    data: jobResult,
    error: jobError,
    isLoading: isJobLoading,
  } = useSWR(reportId ? `job-${reportId}` : null, reportId ? () => fetchJobById(reportId) : null, {
    revalidateOnFocus: false,
  });

  const job = jobResult?.data;

  // ワークオーダーを取得
  const { workOrders, isLoading: isLoadingWorkOrders, mutate: mutateWorkOrders } = useWorkOrders(reportId);

  // 顧客情報と車両情報を取得
  const customerName = job?.field4?.name || "お客様";
  const vehicleName = job?.field6?.name || "車両";
  const licensePlate = job?.field6?.name ? job.field6.name.split(" / ")[1] || "" : "";
  
  // 車両情報を取得（車検有効期限のため）
  const vehicleId = job?.field6?.id;
  const {
    data: vehicleResult,
    error: vehicleError,
  } = useSWR(
    vehicleId ? `vehicle-${vehicleId}` : null,
    vehicleId ? () => fetchVehicleById(vehicleId) : null,
    {
      revalidateOnFocus: false,
    }
  );
  
  const vehicle = vehicleResult?.data;
  const inspectionExpiryDate = vehicle?.field7 || null; // 車検有効期限

  // ブログ用写真選択の状態管理
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [existingInvoice, setExistingInvoice] = useState<{ url: string; fileName: string } | null>(null);
  const [isVideoShareOpen, setIsVideoShareOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>("");
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>("");

  // 実際のデータからBefore/After写真リストを生成
  const beforeAfterItems: BeforeAfterItem[] = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return [];

    const items: BeforeAfterItem[] = [];
    
    // すべてのワークオーダーから作業データを取得
    workOrders.forEach((workOrder) => {
      if (workOrder.work?.records) {
        (workOrder.work.records as Array<{ photos?: Array<{ type: string; url: string; fileId?: string }>; content?: string }>).forEach((record, index) => {
          if (record.photos && record.photos.length > 0) {
            // Before/After写真を分類
            const beforePhotos = record.photos.filter((p) => p.type === "before");
            const afterPhotos = record.photos.filter((p) => p.type === "after");

            // Before写真がある場合
            if (beforePhotos.length > 0) {
              beforePhotos.forEach((beforePhoto, photoIndex) => {
                const afterPhoto = afterPhotos[photoIndex] || null;
                items.push({
                  id: `${workOrder.id}-${index}-${photoIndex}`,
                  itemName: record.content || `${workOrder.serviceKind}作業`,
                  category: workOrder.serviceKind,
                  beforeUrl: beforePhoto.url,
                  afterUrl: afterPhoto?.url || "",
                  beforeCaption: `作業前: ${record.content || ""}`,
                  afterCaption: afterPhoto ? `作業後: ${record.content || ""}` : "",
                });
              });
            } else if (afterPhotos.length > 0) {
              // After写真のみの場合
              afterPhotos.forEach((afterPhoto, photoIndex) => {
                items.push({
                  id: `${workOrder.id}-${index}-after-${photoIndex}`,
                  itemName: record.content || `${workOrder.serviceKind}作業`,
                  category: workOrder.serviceKind,
                  beforeUrl: "",
                  afterUrl: afterPhoto.url,
                  beforeCaption: "",
                  afterCaption: `作業後: ${record.content || ""}`,
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
  const workItems: WorkItem[] = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return [];

    const items: WorkItem[] = [];
    
    // すべてのワークオーダーから見積データを取得
    workOrders.forEach((workOrder) => {
      if (workOrder.estimate?.items) {
        workOrder.estimate.items.forEach((item) => {
          items.push({
            name: item.name,
            price: item.price,
            priority: item.priority,
            serviceKind: workOrder.serviceKind,
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

  // 車検・12ヵ月点検かどうかを判定
  const isInspection = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return false;
    return workOrders.some((wo) => wo.serviceKind === "車検" || wo.serviceKind === "12ヵ月点検");
  }, [workOrders]);

  // 箱①・②・③別の作業項目を分類
  const requiredItems = workItems.filter((item) => item.priority === "required");
  const recommendedItems = workItems.filter((item) => item.priority === "recommended");
  const optionalItems = workItems.filter((item) => item.priority === "optional");
  const itemsWithoutPriority = workItems.filter((item) => !item.priority);

  // 独立作業（複数のワークオーダー）をグループ化
  const workItemsByServiceKind = useMemo(() => {
    const grouped: Record<string, WorkItem[]> = {};
    workItems.forEach((item) => {
      const key = item.serviceKind || "その他";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  }, [workItems]);

  // 整備士コメントを取得（作業データから）
  const mechanicComment = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return "";

    // 最初のワークオーダーの作業データから整備士コメントを取得
    const firstWorkOrder = workOrders[0];
    if (firstWorkOrder.work?.records && firstWorkOrder.work.records.length > 0) {
      // 最後の作業記録をコメントとして使用
      const lastRecord = firstWorkOrder.work.records[firstWorkOrder.work.records.length - 1] as { content?: string };
      return lastRecord.content || "";
    }

    return "";
  }, [workOrders]);

  // 整備士名を取得
  const mechanicName = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return "整備士";

    const firstWorkOrder = workOrders[0];
    return firstWorkOrder.work?.mechanicName || job?.assignedMechanic || "整備士";
  }, [workOrders, job]);

  // 完了日時を取得
  const completedAt = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return null;

    const firstWorkOrder = workOrders[0];
    return firstWorkOrder.work?.completedAt || null;
  }, [workOrders]);

  // ジョブフォルダ内の一時保存されたブログ用写真を取得
  const { data: temporaryBlogPhotos } = useSWR(
    reportId ? `temporary-blog-photos-${reportId}` : null,
    async () => {
      if (!reportId) return [];
      return await listBlogPhotosFromJobFolder(reportId);
    }
  );

  // ブログ用写真リストを生成（Before/After写真 + 受付時に撮影した写真）
  const blogPhotos: BlogPhotoItem[] = useMemo(() => {
    const photos: BlogPhotoItem[] = [];
    
    // すべてのワークオーダーから作業データを取得して写真のファイルIDを取得
    workOrders?.forEach((workOrder) => {
      if (workOrder.work?.records) {
        (workOrder.work.records as Array<{ photos?: Array<{ type: string; url: string; fileId?: string }>; content?: string }>).forEach((record, recordIndex) => {
          if (record.photos && record.photos.length > 0) {
            record.photos.forEach((photo, photoIndex) => {
              const itemId = `${workOrder.id}-${recordIndex}-${photoIndex}`;
              const itemName = record.content || `${workOrder.serviceKind}作業`;
              
              photos.push({
                id: `${itemId}-${photo.type}`,
                url: photo.url,
                type: photo.type as "before" | "after" | "general",
                caption: `${itemName} (${photo.type === "before" ? "Before" : "After"})`,
                fileId: photo.fileId, // ファイルIDを設定
              });
            });
          }
        });
      }
    });

    // 重複を除去（同じファイルIDの写真が複数ある場合）
    const uniquePhotos = photos.filter((photo, index, self) =>
      index === self.findIndex((p) => p.fileId === photo.fileId && p.fileId)
    );

    return uniquePhotos;
  }, [workOrders, temporaryBlogPhotos]);

  // 作業動画リストを生成（診断データから）
  const workVideos = useMemo(() => {
    const videos: Array<{ id: string; url: string; title: string; position: string }> = [];
    
    // すべてのワークオーダーから診断データを取得して動画を取得
    workOrders?.forEach((workOrder) => {
      const diagnosisVideos = workOrder.diagnosis?.videos as Array<{ url: string; type?: string; position?: string }> | undefined;
      if (diagnosisVideos && diagnosisVideos.length > 0) {
        diagnosisVideos.forEach((video, videoIndex) => {
          videos.push({
            id: `${workOrder.id}-video-${videoIndex}`,
            url: video.url,
            title: `${workOrder.serviceKind}作業動画`,
            position: video.position || "general",
          });
        });
      }
    });

    return videos;
  }, [workOrders]);

  // 請求書PDFを取得
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!job) return;

      try {
        // 顧客情報と車両情報を取得
        const customerId = job.field4?.ID1 || job.field4?.id || "";
        const customerName = job.field4?.Last_Name || job.field4?.name || "顧客";
        const vehicleId = job.field6?.Name || job.field6?.id || "";
        const vehicleName = job.field6?.Name || "車両";
        const jobDate = job.field22 ? new Date(job.field22).toISOString().split("T")[0].replace(/-/g, "") : new Date().toISOString().split("T")[0].replace(/-/g, "");

        // Jobフォルダを取得
        const jobFolder = await getOrCreateJobFolder(
          customerId,
          customerName,
          vehicleId,
          vehicleName,
          reportId,
          jobDate
        );

        // 請求書PDFを検索
        const invoiceFile = await searchInvoicePdf(jobFolder.id);
        if (invoiceFile) {
          setExistingInvoice({
            url: invoiceFile.webViewLink || invoiceFile.webContentLink || "",
            fileName: invoiceFile.name,
          });
        }
      } catch (error) {
        console.error("請求書PDF取得エラー:", error);
        // エラーは無視（請求書がない場合もある）
      }
    };

    if (job) {
      fetchInvoice();
    }
  }, [job, reportId]);

  /**
   * 請求書PDF表示・ダウンロード
   */
  const handleShowInvoice = async () => {
    try {
      if (!existingInvoice) {
        toast.error("請求書PDFが見つかりません");
        return;
      }

      // 新しいタブでPDFを表示
      window.open(existingInvoice.url, "_blank");
      toast.success("請求書PDFを表示しました");
    } catch (error) {
      console.error("請求書表示エラー:", error);
      toast.error("請求書の表示に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
    }
  };

  /**
   * Googleレビュー
   */
  const handleGoogleReview = () => {
    window.open('https://g.page/r/CSXeoOUFHHupEBM/review', '_blank');
    toast.success("Googleマップが開きます", {
      description: "レビューのご協力ありがとうございます！",
    });
  };

  /**
   * ブログ用写真を公開
   */
  const handlePublishBlogPhotos = async (selectedIds: string[]) => {
    setIsPublishing(true);
    try {
      // 選択された写真の情報を取得
      const selectedPhotos = blogPhotos.filter((photo) => selectedIds.includes(photo.id));
      
      // 作業日を取得（YYYYMMDD形式）
      const workDate = completedAt 
        ? new Date(completedAt).toISOString().split("T")[0].replace(/-/g, "")
        : new Date().toISOString().split("T")[0].replace(/-/g, "");
      
      // 車両情報からメーカーを抽出（簡易実装）
      const manufacturer = vehicleName.split(" ")[0]; // 例: "BMW X3" → "BMW"
      
      // Before/Afterタイプを判定
      const hasBefore = selectedPhotos.some((p) => p.type === "before");
      const hasAfter = selectedPhotos.some((p) => p.type === "after");
      const beforeAfterType: "before" | "after" | "both" | undefined =
        hasBefore && hasAfter ? "both" : hasBefore ? "before" : hasAfter ? "after" : undefined;

      // サービス種類を取得（最初のワークオーダーから）
      const serviceKind = workOrders && workOrders.length > 0 
        ? workOrders[0].serviceKind 
        : "その他";

      // ファイルIDを取得（fileIdがない場合はスキップ）
      const photoFileIds = selectedPhotos
        .map((p) => p.fileId)
        .filter((fileId): fileId is string => !!fileId); // ファイルIDが存在するもののみ

      if (photoFileIds.length === 0) {
        toast.error("選択された写真にファイルIDがありません", {
          description: "写真がGoogle Driveに保存されていない可能性があります",
        });
        return;
      }

      // ブログ用写真を公開
      const result = await publishBlogPhotos({
        jobId: reportId,
        photoFileIds,
        vehicle: {
          name: vehicleName,
          manufacturer,
        },
        serviceKind,
        workDate,
        beforeAfterType,
      });

      if (!result.success) {
        throw new Error(result.error?.message || "写真の公開に失敗しました");
      }

      // ワークオーダーのblogPhotosを更新
      if (workOrders && workOrders.length > 0) {
        try {
          // 最初のワークオーダーを更新（複数ワークオーダーの場合は最初のもののみ）
          const firstWorkOrder = workOrders[0];
          const updatedBlogPhotos = selectedPhotos.map((photo) => ({
            fileId: photo.fileId || "",
            url: photo.url || "", // beforeUrl/afterUrlではなくurlプロパティを使用
            type: photo.type,
            publishedAt: new Date().toISOString(),
            published: true,
          }));
          
          await updateWorkOrder(reportId, firstWorkOrder.id, {
            blogPhotos: [
              ...((firstWorkOrder as WorkOrder & { blogPhotos?: Array<{ fileId: string; url: string; type: string; publishedAt: string; published: boolean }> }).blogPhotos || []),
              ...updatedBlogPhotos,
            ],
          } as Partial<WorkOrder> & { blogPhotos: Array<{ fileId: string; url: string; type: string; publishedAt: string; published: boolean }> });
          // ワークオーダーリストを再取得
          await mutateWorkOrders();
        } catch (error) {
          console.error("ワークオーダー更新エラー:", error);
          // エラーが発生しても公開処理は続行
          toast.warning("写真の公開は完了しましたが、ワークオーダーの更新に失敗しました");
        }
      }

      toast.success("ブログ用に公開しました", {
        description: `${selectedIds.length}枚の写真を公開しました`,
      });

      // 選択をクリア
      setSelectedPhotoIds([]);
    } catch (error) {
      console.error("ブログ用写真公開エラー:", error);
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  // ローディング中
  if (isJobLoading || isLoadingWorkOrders) {
    return (
      <div className="min-h-screen bg-slate-50">
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

  // エラーまたはデータがない場合
  if (!job || !workOrders || workOrders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-5xl mx-4 border border-slate-300 rounded-xl shadow-md">
          <CardContent className="py-8 text-center">
            <p className="text-base text-slate-700 mb-4">データが見つかりませんでした</p>
            <p className="text-base text-slate-700">作業が完了していないか、データが存在しない可能性があります。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 完了日時のフォーマット
  const completedAtFormatted = completedAt
    ? new Date(completedAt).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "未設定";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-5">
          {/* タイトル */}
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-slate-700 shrink-0" />
            <h1 className="text-xl font-bold text-slate-900">
              整備完了報告書
            </h1>
          </div>
          <p className="text-base text-slate-700 mb-4">デジタル整備手帳</p>

          {/* 車両情報 */}
          <Card className="bg-gradient-to-r from-slate-800 to-slate-700">
            <CardContent className="py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-base">お客様</p>
                  <p className="text-xl font-bold">{customerName} 様</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-base">車両</p>
                  <p className="font-medium">{vehicleName}</p>
                  {licensePlate && (
                    <p className="text-base text-white/80">{licensePlate}</p>
                  )}
                </div>
              </div>

              <Separator className="my-3 bg-white/20" />

              <div className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/70 shrink-0" />
                  <span>整備完了日: {completedAtFormatted}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-white/70 shrink-0" />
                  <span>担当: {mechanicName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* 作業内容と料金 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-slate-700 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900">作業内容と料金</h2>
          </div>

          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="py-4">
              <div className="space-y-2">
                {workItems.length > 0 ? (
                  <>
                    {/* 箱①: 今回絶対必要（車検の場合のみ表示） */}
                    {isInspection && requiredItems.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-2 pt-2">
                          <div className={cn("w-1 h-6 rounded-full shrink-0", getPriorityColor("required"))} />
                          <p className="text-base font-bold text-slate-900">今回絶対必要</p>
                        </div>
                        {requiredItems.map((item, index) => (
                          <div
                            key={`required-${index}`}
                            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 pl-4"
                          >
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-slate-600 shrink-0" />
                              <span className="text-base text-slate-700">{item.name}</span>
                            </div>
                            <span className="text-base font-medium tabular-nums">¥{formatPrice(item.price)}</span>
                          </div>
                        ))}
                        {(recommendedItems.length > 0 || optionalItems.length > 0 || itemsWithoutPriority.length > 0) && (
                          <Separator className="my-3" />
                        )}
                      </>
                    )}

                    {/* 箱②: やったほうがいい（車検の場合のみ表示） */}
                    {isInspection && recommendedItems.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-1 h-6 rounded-full shrink-0", getPriorityColor("recommended"))} />
                          <p className="text-base font-bold text-slate-900">やったほうがいい</p>
                        </div>
                        {recommendedItems.map((item, index) => (
                          <div
                            key={`recommended-${index}`}
                            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 pl-4"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              <span className="text-base text-slate-700">{item.name}</span>
                            </div>
                            <span className="text-base font-medium tabular-nums">¥{formatPrice(item.price)}</span>
                          </div>
                        ))}
                        {(optionalItems.length > 0 || itemsWithoutPriority.length > 0) && (
                          <Separator className="my-3" />
                        )}
                      </>
                    )}

                    {/* 箱③: お客さん次第（車検の場合のみ表示） */}
                    {isInspection && optionalItems.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-1 h-6 rounded-full shrink-0", getPriorityColor("optional"))} />
                          <p className="text-base font-bold text-slate-900">お客さん次第</p>
                        </div>
                        {optionalItems.map((item, index) => (
                          <div
                            key={`optional-${index}`}
                            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 pl-4"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              <span className="text-base text-slate-700">{item.name}</span>
                            </div>
                            <span className="text-base font-medium tabular-nums">¥{formatPrice(item.price)}</span>
                          </div>
                        ))}
                        {itemsWithoutPriority.length > 0 && (
                          <Separator className="my-3" />
                        )}
                      </>
                    )}

                    {/* 優先度がない項目（独立作業など） */}
                    {itemsWithoutPriority.length > 0 && (
                      <>
                        {isInspection && (requiredItems.length > 0 || recommendedItems.length > 0 || optionalItems.length > 0) && (
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-base font-bold text-slate-900">その他の作業</p>
                          </div>
                        )}
                        {itemsWithoutPriority.map((item, index) => (
                          <div
                            key={`no-priority-${index}`}
                            className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 pl-4"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              <span className="text-base text-slate-700">{item.name}</span>
                              {item.serviceKind && (
                                <Badge variant="outline" className="text-xs">
                                  {item.serviceKind}
                                </Badge>
                              )}
                            </div>
                            <span className="text-base font-medium tabular-nums">¥{formatPrice(item.price)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {/* 車検以外の場合はすべての項目を通常表示 */}
                    {!isInspection && workItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                          <span className="text-base text-slate-700">{item.name}</span>
                          {item.serviceKind && (
                            <Badge variant="outline" className="text-xs">
                              {item.serviceKind}
                            </Badge>
                          )}
                        </div>
                        <span className="text-base font-medium tabular-nums">¥{formatPrice(item.price)}</span>
                      </div>
                    ))}

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between text-lg">
                      <span className="font-bold text-slate-900">合計（税込）</span>
                      <span className="font-bold text-primary tabular-nums">
                        ¥{formatPrice(totalAmount)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-base text-slate-700 py-4">作業項目がありません</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 請求書PDFボタン */}
          {existingInvoice ? (
            <>
              <Button
                onClick={handleShowInvoice}
                variant="outline"
                className="w-full mt-4 h-12 text-base font-medium gap-2"
                aria-label="請求書PDFを表示"
              >
                <Download className="h-5 w-5 shrink-0" aria-hidden="true" />
                <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
                請求書PDFを表示
              </Button>
              <p className="text-base text-center text-slate-700 mt-2">
                {existingInvoice.fileName}
              </p>
            </>
          ) : (
            <p className="text-base text-center text-slate-700 mt-4">
              請求書PDFはまだ生成されていません
            </p>
          )}
        </section>

        <Separator />

        {/* 作業動画セクション */}
        {workVideos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Video className="h-5 w-5 text-slate-700 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900">作業動画</h2>
            </div>
            <div className="space-y-3">
              {workVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden border border-slate-300 rounded-xl shadow-md">
                  <CardContent className="p-0">
                    <div className="relative aspect-video bg-slate-900">
                      <video
                        src={video.url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-base font-medium text-slate-800 mb-2">{video.title}</p>
                      <Button
                        onClick={() => {
                          setSelectedVideoUrl(video.url);
                          setSelectedVideoTitle(video.title);
                          setIsVideoShareOpen(true);
                        }}
                        variant="outline"
                        className="w-full h-12 text-base font-medium gap-2"
                        aria-label={`${video.title}の動画を共有`}
                      >
                        <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        動画を共有
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {workVideos.length > 0 && <Separator />}

        {/* ビデオ通話セクション */}
        <section>
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-xl shadow-md">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-base font-bold text-blue-900 mb-1">ビデオ通話でご質問</p>
                  <p className="text-base text-blue-800">
                    作業内容について、ビデオ通話で直接ご説明いたします
                  </p>
                </div>
                <Button
                  onClick={() => setIsVideoCallOpen(true)}
                  className="bg-primary hover:bg-primary/90 text-white h-12 text-base font-medium gap-2 shrink-0"
                  aria-label="ビデオ通話を開始"
                >
                  <Video className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ビデオ通話を開始
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* 整備前後の写真 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-700 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900">整備前後の写真</h2>
          </div>
          <div className="space-y-4">
            {beforeAfterItems.length > 0 ? (
              beforeAfterItems.map((item) => (
                <BeforeAfterCard key={item.id} item={item} />
              ))
            ) : (
              <Card className="border border-slate-300 rounded-xl shadow-md">
                <CardContent className="py-8 text-center">
                  <p className="text-base text-slate-700">作業前後の写真はありません</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <Separator />

        {/* メカニックからのコメント */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-slate-700 shrink-0" />
            <h2 className="text-xl font-bold text-slate-900">整備士からのメッセージ</h2>
          </div>

          {mechanicComment ? (
            <MechanicCommentBubble
              mechanicName={mechanicName}
              comment={mechanicComment}
            />
          ) : (
            <Card className="border border-slate-300 rounded-xl shadow-md">
              <CardContent className="py-8 text-center">
                <p className="text-base text-slate-700">整備士からのメッセージはありません</p>
              </CardContent>
            </Card>
          )}
        </section>

        <Separator />

        {/* 次回点検案内 */}
        {inspectionExpiryDate && (
          <section>
            <Card className="bg-blue-50 border border-blue-300 rounded-xl shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-blue-900">
                  <Calendar className="h-5 w-5 shrink-0" />
                  次回点検案内
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-base text-blue-900">
                    車検有効期限: <span className="font-semibold tabular-nums">{new Date(inspectionExpiryDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </p>
                  {(() => {
                    const expiryDate = new Date(inspectionExpiryDate);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntilExpiry < 0) {
                      return (
                        <p className="text-base text-red-700 font-medium">
                          ⚠️ 車検が期限切れです。早急に更新をお願いします。
                        </p>
                      );
                    } else if (daysUntilExpiry <= 30) {
                      return (
                        <p className="text-base text-amber-900 font-medium">
                          ⚠️ 車検有効期限まであと<span className="tabular-nums">{daysUntilExpiry}</span>日です。更新をご検討ください。
                        </p>
                      );
                    } else if (daysUntilExpiry <= 90) {
                      return (
                        <p className="text-base text-blue-800">
                          車検有効期限まであと<span className="tabular-nums">{daysUntilExpiry}</span>日です。
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 作業履歴セクション */}
        {job && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-slate-900">作業履歴</h2>
            </div>
            <CustomerProgressView job={job} />
          </section>
        )}

        <Separator />

        {/* ブログ用写真公開 */}
        <section>
          <BlogPhotoSelector
            photos={blogPhotos}
            selectedPhotoIds={selectedPhotoIds}
            onSelectionChange={setSelectedPhotoIds}
            isPublishing={isPublishing}
            onPublish={handlePublishBlogPhotos}
            disabled={false}
          />
        </section>

        <Separator />

        {/* Googleレビューボタン */}
        <section className="pt-4">
          <Card className="bg-gradient-to-r from-amber-50 to-amber-50 border border-amber-300 rounded-xl shadow-md overflow-hidden">
            <CardContent className="py-6 text-center">
              <div className="flex justify-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-6 w-6 text-amber-500 fill-amber-500 shrink-0"
                  />
                ))}
              </div>
              <p className="text-base text-slate-700 mb-1">
                サービスはいかがでしたか？
              </p>
              <p className="text-base text-slate-700 mb-4">
                お客様の声が私たちの励みになります
              </p>
              <Button
                onClick={handleGoogleReview}
                className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-amber-500 to-amber-500 hover:from-amber-600 hover:to-amber-600 text-white shadow-lg"
                aria-label="Googleでレビューを書く（新しいウィンドウで開く）"
              >
                <Star className="h-5 w-5 shrink-0" aria-hidden="true" />
                Googleでレビューを書く
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* お客様アンケート */}
        <section className="pt-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-xl shadow-md overflow-hidden">
            <CardContent className="py-6 text-center">
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                お客様アンケート
              </h3>
              <p className="text-base text-blue-800 mb-1 font-medium">
                アンケートご回答で500円分QUOカードプレゼント
              </p>
              <p className="text-base text-blue-700 mb-4">
                ※所要時間：約1分
              </p>
              <Button
                onClick={() => {
                  window.open("https://tally.so/r/mVapBN", "_blank");
                }}
                className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                aria-label="アンケートに回答する（新しいウィンドウで開く）"
              >
                <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
                アンケートに回答する
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* フッター */}
        <footer className="pt-6 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-700 mb-2">
            <Heart className="h-4 w-4 shrink-0" />
            <span className="text-base">YM Works Auto Service</span>
          </div>
          <p className="text-base text-slate-700">
            このページはお客様専用のデジタル整備手帳です
          </p>
          <p className="text-base text-slate-700 mt-1">
            Report ID: {reportId}
          </p>
        </footer>
      </main>

      {/* ビデオ通話ダイアログ */}
      <VideoCallDialog
        open={isVideoCallOpen}
        onClose={() => setIsVideoCallOpen(false)}
        participantName={job?.field4?.name || "整備士"}
        jobId={reportId}
      />

      {/* ビデオ共有ダイアログ */}
      <VideoShareDialog
        open={isVideoShareOpen}
        onClose={() => {
          setIsVideoShareOpen(false);
          setSelectedVideoUrl("");
          setSelectedVideoTitle("");
        }}
        videoUrl={selectedVideoUrl}
        videoTitle={selectedVideoTitle}
        jobId={reportId}
      />
    </div>
  );
}

