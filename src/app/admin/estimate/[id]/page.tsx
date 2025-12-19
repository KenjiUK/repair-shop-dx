"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchJobById, createEstimate, updateJobStatus } from "@/lib/api";
import { toast } from "sonner";
import { EstimatePriority, ZohoJob } from "@/types";
import {
  Car,
  Tag,
  Camera,
  Plus,
  Trash2,
  Eye,
  ChevronLeft,
  AlertCircle,
  XCircle,
  Calculator,
  MessageCircle,
  Loader2,
  AlertOctagon,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { User } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface DiagnosisPhoto {
  id: string;
  position: string;
  label: string;
  url: string;
}

interface DiagnosisCheckItem {
  id: string;
  name: string;
  category: string;
  status: "yellow" | "red";
  comment?: string;
}

interface EstimateLineItem {
  id: string;
  name: string;
  price: number;
  priority: EstimatePriority;
  linkedPhotoId: string | null;
}

// =============================================================================
// SWR Fetcher
// =============================================================================

async function jobFetcher(jobId: string): Promise<ZohoJob> {
  const result = await fetchJobById(jobId);
  if (!result.success) {
    throw new Error(result.error?.message ?? "案件の取得に失敗しました");
  }
  return result.data!;
}

// =============================================================================
// Default/Fallback Data（診断データがない場合のフォールバック）
// =============================================================================

const defaultPhotos: DiagnosisPhoto[] = [
  { id: "photo-1", position: "front", label: "前方", url: "https://placehold.co/400x300/e2e8f0/64748b?text=Front" },
  { id: "photo-2", position: "rear", label: "後方", url: "https://placehold.co/400x300/e2e8f0/64748b?text=Rear" },
  { id: "photo-3", position: "left", label: "左側", url: "https://placehold.co/400x300/e2e8f0/64748b?text=Left" },
  { id: "photo-4", position: "right", label: "右側", url: "https://placehold.co/400x300/e2e8f0/64748b?text=Right" },
  { id: "photo-5", position: "detail-1", label: "ブレーキパッド", url: "https://placehold.co/400x300/fecaca/dc2626?text=Brake+Pad" },
  { id: "photo-6", position: "detail-2", label: "タイヤ溝", url: "https://placehold.co/400x300/fef08a/ca8a04?text=Tire" },
];

const defaultFlaggedItems: DiagnosisCheckItem[] = [
  { id: "brake-pad", name: "ブレーキパッド", category: "ブレーキ", status: "red", comment: "残量2mm。即交換推奨。" },
  { id: "tire-front", name: "タイヤ（前輪）", category: "足回り", status: "yellow", comment: "溝残り3mm。次回車検までに交換推奨。" },
  { id: "wiper", name: "ワイパーゴム", category: "外装", status: "yellow", comment: "拭きムラあり。" },
  { id: "battery", name: "バッテリー", category: "電装", status: "yellow", comment: "電圧やや低下。経過観察。" },
];

const defaultEstimateItems: EstimateLineItem[] = [
  { id: "est-1", name: "法定12ヶ月点検", price: 15000, priority: "required", linkedPhotoId: null },
  { id: "est-2", name: "エンジンオイル交換", price: 5500, priority: "required", linkedPhotoId: null },
  { id: "est-3", name: "Fブレーキパッド交換", price: 33000, priority: "recommended", linkedPhotoId: "photo-5" },
];

// =============================================================================
// Helper Functions
// =============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP").format(price);
}

function generateId(): string {
  return `est-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function extractVehicleName(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "車両未登録";
  const parts = vehicleInfo.split(" / ");
  return parts[0] || vehicleInfo;
}

function extractLicensePlate(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "";
  const parts = vehicleInfo.split(" / ");
  return parts[1] || "";
}

// =============================================================================
// Components
// =============================================================================

/**
 * 写真カードコンポーネント
 */
function PhotoCard({ photo, isSelected, onClick }: {
  photo: DiagnosisPhoto;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-slate-300"
      )}
      onClick={onClick}
    >
      <img
        src={photo.url}
        alt={photo.label}
        className="w-full h-24 object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
        <p className="text-xs text-white truncate">{photo.label}</p>
      </div>
    </div>
  );
}

/**
 * 見積行コンポーネント
 */
function EstimateLineRow({
  item,
  photos,
  onUpdate,
  onDelete,
  canDelete,
  disabled,
}: {
  item: EstimateLineItem;
  photos: DiagnosisPhoto[];
  onUpdate: (id: string, updates: Partial<EstimateLineItem>) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 py-2">
      <div className="flex-1 min-w-0">
        <Input
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          placeholder="品名"
          className="h-9"
          disabled={disabled}
        />
      </div>

      <div className="w-28">
        <Input
          type="number"
          value={item.price}
          onChange={(e) => onUpdate(item.id, { price: parseInt(e.target.value) || 0 })}
          placeholder="金額"
          className="h-9 text-right"
          disabled={disabled}
        />
      </div>

      <div className="w-32">
        <Select
          value={item.linkedPhotoId || "none"}
          onValueChange={(value) => onUpdate(item.id, { linkedPhotoId: value === "none" ? null : value })}
          disabled={disabled}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="写真" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">なし</SelectItem>
            {photos.map((photo) => (
              <SelectItem key={photo.id} value={photo.id}>
                {photo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(item.id)}
        disabled={!canDelete || disabled}
        className="h-9 w-9 text-slate-400 hover:text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * 見積セクションコンポーネント
 */
function EstimateSection({
  title,
  priority,
  items,
  photos,
  onUpdate,
  onDelete,
  onAdd,
  badgeVariant,
  disabled,
}: {
  title: string;
  priority: EstimatePriority;
  items: EstimateLineItem[];
  photos: DiagnosisPhoto[];
  onUpdate: (id: string, updates: Partial<EstimateLineItem>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  badgeVariant: "default" | "secondary" | "outline";
  disabled?: boolean;
}) {
  const sectionItems = items.filter((item) => item.priority === priority);
  const sectionTotal = sectionItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={badgeVariant}>{title}</Badge>
          <span className="text-sm text-slate-500">
            {sectionItems.length}件
          </span>
        </div>
        <span className="text-sm font-medium">
          ¥{formatPrice(sectionTotal)}
        </span>
      </div>

      <div className="pl-2 border-l-2 border-slate-200">
        {sectionItems.map((item) => (
          <EstimateLineRow
            key={item.id}
            item={item}
            photos={photos}
            onUpdate={onUpdate}
            onDelete={onDelete}
            canDelete={priority !== "required" || sectionItems.length > 1}
            disabled={disabled}
          />
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          disabled={disabled}
          className="w-full justify-start text-slate-500 hover:text-slate-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          項目を追加
        </Button>
      </div>
    </div>
  );
}

/**
 * ヘッダースケルトン
 */
function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-12" />
            <Separator orientation="vertical" className="h-6" />
            <div>
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * コンテンツスケルトン
 */
function ContentSkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

/**
 * エラー表示
 */
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <AlertOctagon className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">エラー</h2>
          <p className="text-slate-600 mb-4">{message}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link href="/">トップへ戻る</Link>
            </Button>
            <Button onClick={onRetry}>再試行</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function EstimatePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // SWRでジョブデータを取得
  const {
    data: job,
    error: jobError,
    isLoading: isJobLoading,
    mutate: mutateJob,
  } = useSWR(jobId ? `job-${jobId}` : null, () => jobFetcher(jobId), {
    revalidateOnFocus: false,
  });

  // 見積項目の状態管理
  const [estimateItems, setEstimateItems] = useState<EstimateLineItem[]>(defaultEstimateItems);

  // 選択中の写真（プレビュー用）
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // 送信中フラグ
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 診断データ（jobから取得、なければフォールバック）
  // 実際のAPIでは job.diagnosis などから取得
  const photos = defaultPhotos;
  const flaggedItems = defaultFlaggedItems;

  /**
   * 項目を更新
   */
  const handleUpdateItem = (id: string, updates: Partial<EstimateLineItem>) => {
    setEstimateItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  /**
   * 項目を削除
   */
  const handleDeleteItem = (id: string) => {
    setEstimateItems((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * 項目を追加
   */
  const handleAddItem = (priority: EstimatePriority) => {
    const newItem: EstimateLineItem = {
      id: generateId(),
      name: "",
      price: 0,
      priority,
      linkedPhotoId: null,
    };
    setEstimateItems((prev) => [...prev, newItem]);
  };

  /**
   * プレビュー
   */
  const handlePreview = () => {
    console.log("=== 見積プレビュー ===");
    console.log("Job ID:", jobId);
    console.log("Items:", estimateItems);
    console.log("Total:", calculateTotal());
    toast.info("プレビュー機能は準備中です");
  };

  /**
   * LINE送信
   */
  const handleSendLine = async () => {
    if (!job) return;

    setIsSubmitting(true);

    try {
      // 見積データを整形
      const estimateData = estimateItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        selected: item.priority === "required" || item.priority === "recommended",
        linkedPhotoUrls: item.linkedPhotoId
          ? [photos.find((p) => p.id === item.linkedPhotoId)?.url || ""]
          : [],
        linkedVideoUrl: null,
        note: null,
      }));

      // 見積を保存
      const createResult = await createEstimate(jobId, estimateData);

      if (!createResult.success) {
        throw new Error(createResult.error?.message || "見積の作成に失敗しました");
      }

      // ステータスを更新（見積作成待ち → 作業待ち ではなく、見積提示済みに更新）
      // 注: JobStageに「見積提示済み」がないため「作業待ち」を使用
      const statusResult = await updateJobStatus(jobId, "作業待ち");

      if (!statusResult.success) {
        throw new Error(statusResult.error?.message || "ステータスの更新に失敗しました");
      }

      // 成功
      const customerName = job.field4?.name || "お客様";
      toast.success("見積もりを送信しました", {
        description: `${customerName}様へLINEで送信しました`,
      });

      // トップページへ遷移
      router.push("/");
    } catch (error) {
      console.error("見積送信エラー:", error);
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "見積の送信に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 合計金額を計算
   */
  const calculateTotal = () => {
    return estimateItems.reduce((sum, item) => sum + item.price, 0);
  };

  // エラー状態
  if (jobError) {
    return (
      <ErrorDisplay
        message={jobError.message || "案件が見つかりません"}
        onRetry={() => mutateJob()}
      />
    );
  }

  // ローディング状態
  if (isJobLoading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <HeaderSkeleton />
        <ContentSkeleton />
      </div>
    );
  }

  // データがない場合
  if (!job) {
    return (
      <ErrorDisplay
        message="案件が見つかりません"
        onRetry={() => mutateJob()}
      />
    );
  }

  // ジョブデータから情報を抽出
  const customerName = job.field4?.name || "未登録";
  const vehicleName = extractVehicleName(job.field6?.name);
  const licensePlate = extractLicensePlate(job.field6?.name);
  const tagId = job.tagId || "---";

  // セクション別合計
  const requiredTotal = estimateItems
    .filter((i) => i.priority === "required")
    .reduce((sum, i) => sum + i.price, 0);
  const recommendedTotal = estimateItems
    .filter((i) => i.priority === "recommended")
    .reduce((sum, i) => sum + i.price, 0);
  const optionalTotal = estimateItems
    .filter((i) => i.priority === "optional")
    .reduce((sum, i) => sum + i.price, 0);

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId);

  const estimateTitle = "見積作成";

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ヘッダー */}
      <AppHeader maxWidthClassName="max-w-7xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="h-6 w-6 sm:h-7 sm:w-7" />
                {estimateTitle}
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1 text-sm px-2.5 py-1 h-7 rounded-full text-slate-700 bg-slate-50"
                >
                  {job.field5 || "見積作成待ち"}
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1 text-sm px-2.5 py-1 h-7 rounded-full"
                >
                  <Tag className="h-3.5 w-3.5" />
                  タグ {tagId}
                </Badge>
              </div>
            </div>
            <p className="mt-1 text-sm sm:text-base text-slate-700 flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-500" />
              <span>{customerName} 様</span>
            </p>
            <p className="mt-1 text-sm sm:text-base text-slate-700 flex items-center gap-1.5">
              <Car className="h-4 w-4 text-slate-500" />
              <span>{vehicleName}</span>
              {licensePlate && <span className="text-slate-400 ml-1">/ {licensePlate}</span>}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm sm:text-base text-slate-600 hover:text-slate-900 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
            戻る
          </Link>
        </div>
      </AppHeader>

      {/* メインコンテンツ - 2カラムレイアウト */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ========== 左カラム: 診断結果ビュー ========== */}
          <div className="space-y-4">
            {/* 診断情報ヘッダー */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    診断結果
                  </span>
                  <span className="text-sm font-normal text-slate-500">
                    Job ID: {jobId}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-slate-600">
                  <p>{vehicleName} / {licensePlate}</p>
                  {job.field10 && (
                    <p className="mt-1">走行距離: {job.field10.toLocaleString()} km</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 撮影写真 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Camera className="h-5 w-5" />
                  撮影写真
                  <Badge variant="secondary">{photos.length}枚</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      isSelected={selectedPhotoId === photo.id}
                      onClick={() => setSelectedPhotoId(photo.id)}
                    />
                  ))}
                </div>

                {selectedPhoto && (
                  <div className="mt-4 p-2 bg-slate-50 rounded-lg">
                    <img
                      src={selectedPhoto.url}
                      alt={selectedPhoto.label}
                      className="w-full rounded-md"
                    />
                    <p className="text-sm text-center mt-2 text-slate-600">
                      {selectedPhoto.label}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 指摘項目 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5" />
                  指摘項目
                  <Badge variant="destructive">
                    {flaggedItems.filter((i) => i.status === "red").length}件 要交換
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {flaggedItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        item.status === "red"
                          ? "bg-red-50 border-red-200"
                          : "bg-yellow-50 border-yellow-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {item.status === "red" ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className={cn(
                          "font-medium",
                          item.status === "red" ? "text-red-800" : "text-yellow-800"
                        )}>
                          {item.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      {item.comment && (
                        <p className={cn(
                          "text-sm mt-1 ml-6",
                          item.status === "red" ? "text-red-700" : "text-yellow-700"
                        )}>
                          {item.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== 右カラム: 見積エディタ ========== */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-5 w-5" />
                  見積内容
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    <EstimateSection
                      title="必須整備"
                      priority="required"
                      items={estimateItems}
                      photos={photos}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onAdd={() => handleAddItem("required")}
                      badgeVariant="default"
                      disabled={isSubmitting}
                    />

                    <Separator />

                    <EstimateSection
                      title="推奨整備"
                      priority="recommended"
                      items={estimateItems}
                      photos={photos}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onAdd={() => handleAddItem("recommended")}
                      badgeVariant="secondary"
                      disabled={isSubmitting}
                    />

                    <Separator />

                    <EstimateSection
                      title="任意整備"
                      priority="optional"
                      items={estimateItems}
                      photos={photos}
                      onUpdate={handleUpdateItem}
                      onDelete={handleDeleteItem}
                      onAdd={() => handleAddItem("optional")}
                      badgeVariant="outline"
                      disabled={isSubmitting}
                    />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* 合計金額 */}
            <Card>
              <CardContent className="py-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">必須整備</span>
                    <span>¥{formatPrice(requiredTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">推奨整備</span>
                    <span>¥{formatPrice(recommendedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">任意整備</span>
                    <span>¥{formatPrice(optionalTotal)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>合計（税込）</span>
                    <span className="text-primary">¥{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* アクションボタン */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12"
                onClick={handlePreview}
                disabled={isSubmitting}
              >
                <Eye className="h-4 w-4 mr-2" />
                プレビュー
              </Button>
              <Button
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                onClick={handleSendLine}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    送信中...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    LINEで送信
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
