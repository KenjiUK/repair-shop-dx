"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
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
import { EstimatePriority, EstimateItem } from "@/types";
import { toast } from "sonner";
import { fetchJobById, approveEstimate } from "@/lib/api";
import { useWorkOrders } from "@/hooks/use-work-orders";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";

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

const initialItems: EstimateLineItem[] = [
  // 必須整備（松）
  {
    id: "est-1",
    name: "法定12ヶ月点検",
    price: 15000,
    priority: "required",
    selected: true,
    photoUrl: null,
    comment: null,
  },
  {
    id: "est-2",
    name: "エンジンオイル交換",
    price: 5500,
    priority: "required",
    selected: true,
    photoUrl: null,
    comment: "前回交換から5,000km経過",
  },
  // 推奨整備（竹）
  {
    id: "est-3",
    name: "Fブレーキパッド交換",
    price: 33000,
    priority: "recommended",
    selected: true,
    photoUrl: "https://placehold.co/600x400/fecaca/dc2626?text=Brake+Pad+2mm",
    comment: "残量2mm。安全のため交換を強くお勧めします。",
  },
  {
    id: "est-4",
    name: "タイヤローテーション",
    price: 3300,
    priority: "recommended",
    selected: true,
    photoUrl: "https://placehold.co/600x400/fef08a/ca8a04?text=Tire+Wear",
    comment: "前輪の偏摩耗を防ぐため推奨します。",
  },
  {
    id: "est-5",
    name: "ワイパーゴム交換",
    price: 2200,
    priority: "recommended",
    selected: true,
    photoUrl: null,
    comment: "拭きムラが発生しています。",
  },
  // 任意整備（梅）
  {
    id: "est-6",
    name: "エアコンフィルター交換",
    price: 4400,
    priority: "optional",
    selected: false,
    photoUrl: null,
    comment: "花粉シーズン前の交換がおすすめです。",
  },
  {
    id: "est-7",
    name: "ボディコーティング",
    price: 22000,
    priority: "optional",
    selected: false,
    photoUrl: null,
    comment: "ツヤと撥水効果が約6ヶ月持続します。",
  },
];

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
      return "bg-slate-400";
  }
}

// =============================================================================
// Components
// =============================================================================

/**
 * 見積項目カードコンポーネント
 */
function EstimateItemCard({
  item,
  onToggle,
  onPhotoClick,
}: {
  item: EstimateLineItem;
  onToggle: (id: string) => void;
  onPhotoClick: (url: string, name: string) => void;
}) {
  const isLocked = item.priority === "required";

  return (
    <Card
      className={cn(
        "transition-all",
        item.selected ? "border-primary/50 bg-white" : "border-slate-200 bg-slate-50 opacity-70"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* チェックボックス */}
          <div className="pt-0.5">
            {isLocked ? (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-white">
                <Lock className="h-3 w-3 shrink-0" />
              </div>
            ) : (
              <Checkbox
                checked={item.selected}
                onCheckedChange={() => onToggle(item.id)}
                className="h-5 w-5"
              />
            )}
          </div>

          {/* コンテンツ */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  item.selected ? "text-slate-900" : "text-slate-500 line-through"
                )}>
                  {item.name}
                </p>
                {item.comment && (
                  <p className="text-sm text-slate-500 mt-1">{item.comment}</p>
                )}
              </div>
              <p className={cn(
                "font-bold whitespace-nowrap",
                item.selected ? "text-slate-900" : "text-slate-400"
              )}>
                ¥{formatPrice(item.price)}
              </p>
            </div>

            {/* 写真サムネイル */}
            {item.photoUrl && (
              <button
                onClick={() => onPhotoClick(item.photoUrl!, item.name)}
                className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <div className="relative w-16 h-12 rounded overflow-hidden border border-slate-200">
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  写真を確認
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </span>
              </button>
            )}
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
        <div className={cn("w-1 h-6 rounded-full", getPriorityColor(priority))} />
        <div>
          <p className="font-bold text-slate-800">{getPriorityLabel(priority)}整備</p>
          <p className="text-xs text-slate-500">{descriptions[priority]}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-slate-500">{count}件</p>
        <p className="font-medium">¥{formatPrice(total)}</p>
      </div>
    </div>
  );
}

/**
 * 完了画面コンポーネント
 */
function ThankYouScreen({ customerName }: { customerName: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-bounce mb-6">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="h-10 w-10 text-white" />
        </div>
      </div>

      <PartyPopper className="h-12 w-12 text-amber-500 mb-4" />

      <h1 className="text-xl font-bold text-slate-900 mb-2">
        ご依頼ありがとうございます！
      </h1>

      <p className="text-slate-600 mb-6">
        {customerName}様のご注文を承りました。<br />
        作業完了次第、ご連絡いたします。
      </p>

      <Card className="w-full max-w-sm">
        <CardContent className="p-4">
          <p className="text-sm text-slate-500 mb-3">ご不明点がございましたら</p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              お電話でのお問い合わせ
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 text-green-600 border-green-200 hover:bg-green-50">
              <MessageCircle className="h-4 w-4 shrink-0" />
              LINEでお問い合わせ
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400 mt-8">
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
  const jobId = useMemo(() => (params?.id ?? "") as string, [params]);

  // Jobデータを取得
  const { data: jobResult, isLoading: isJobLoading } = useSWR(
    jobId ? `job-${jobId}` : null,
    async () => {
      if (!jobId) return null;
      return await fetchJobById(jobId);
    }
  );

  const job = jobResult?.data;

  // ワークオーダーを取得（最初のワークオーダーから見積データを取得）
  const { workOrders, isLoading: isLoadingWorkOrders } = useWorkOrders(jobId);
  const selectedWorkOrder = workOrders && workOrders.length > 0 ? workOrders[0] : null;

  // 見積データを取得
  const estimateData = selectedWorkOrder?.estimate;
  
  // 顧客情報と車両情報を取得
  const customerName = job?.field4?.name || "お客様";
  const vehicleName = job?.field6?.name || "車両";
  const licensePlate = job?.field6?.name ? job.field6.name.split(" / ")[1] || "" : "";

  // 状態管理
  const [items, setItems] = useState<EstimateLineItem[]>([]);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [displayTotal, setDisplayTotal] = useState(0);
  const [isApproving, setIsApproving] = useState(false);

  // 見積データをEstimateLineItem形式に変換
  useEffect(() => {
    if (estimateData && estimateData.items) {
      const convertedItems: EstimateLineItem[] = estimateData.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        selected: true, // デフォルトで選択状態
        photoUrl: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
        comment: item.note || null,
      }));
      setItems(convertedItems);
    } else if (!isJobLoading && !isLoadingWorkOrders && !estimateData) {
      // 見積データがない場合は空の配列を設定
      setItems([]);
    }
  }, [estimateData, isJobLoading, isLoadingWorkOrders]);

  // 合計金額を計算
  const calculateTotal = () => {
    return items.filter((item) => item.selected).reduce((sum, item) => sum + item.price, 0);
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
      // EstimateItem形式に変換
      const estimateItems: EstimateItem[] = selectedItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        priority: item.priority,
        selected: true,
        linkedPhotoUrls: item.photoUrl ? [item.photoUrl] : [],
        linkedVideoUrl: null,
        note: item.comment || null,
      }));

      // 承認APIを呼び出す
      const result = await approveEstimate(jobId, estimateItems);
      
      if (result.success) {
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

  // ローディング中
  if (isJobLoading || isLoadingWorkOrders) {
    return (
      <div className="min-h-screen bg-slate-50 pb-32">
        <div className="max-w-lg mx-auto px-4 py-8">
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
    return (
      <div className="min-h-screen bg-slate-50 pb-32 flex items-center justify-center">
        <Card className="max-w-lg mx-4">
          <CardContent className="py-8 text-center">
            <p className="text-slate-600 mb-4">見積データが見つかりませんでした</p>
            <p className="text-sm text-slate-500">見積が作成されていないか、既に承認済みの可能性があります。</p>
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
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">お見積り</p>
            {isExpired && (
              <Badge variant="destructive" className="text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                有効期限切れ
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {customerName} 様
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
            <Car className="h-4 w-4 shrink-0" />
            <span>{vehicleName}</span>
            {licensePlate && (
              <>
                <span className="text-slate-300">|</span>
                <span>{licensePlate}</span>
              </>
            )}
          </div>
          {!isExpired && estimateData?.expiresAt && (
            <p className="text-xs text-slate-500 mt-2">
              有効期限: {new Date(estimateData.expiresAt).toLocaleDateString("ja-JP")}
            </p>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-lg mx-auto px-4 py-6">
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
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Lock className="h-3 w-3 shrink-0" />
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
              />
            ))}
          </div>
        </section>
      </main>

      {/* スティッキーフッター */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          {/* 合計金額 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-600">合計（税込）</span>
            <span className="text-xl font-bold text-primary">
              ¥{formatPrice(displayTotal)}
            </span>
          </div>

          {/* 注文ボタン */}
          <Button
            onClick={handleOrder}
            size="lg"
            className="w-full h-14 text-lg font-bold gap-2 bg-primary hover:bg-primary/90"
            disabled={items.filter((i) => i.selected).length === 0 || isExpired || isApproving}
          >
            {isApproving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                処理中...
              </>
            ) : (
              <>
                <ShoppingCart className="h-5 w-5 shrink-0" />
                {isExpired ? "有効期限切れ" : "この内容で作業を依頼する"}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-slate-400 mt-2">
            ボタンを押すと注文が確定します
          </p>
          {items.filter((i) => i.selected).length === 0 && (
            <p className="text-xs text-center text-red-500 mt-1">
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
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="w-full rounded-lg"
              />
              <p className="text-center text-sm text-slate-600 mt-2">
                {lightboxImage.name}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

