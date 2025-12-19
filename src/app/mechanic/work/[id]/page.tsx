"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { compressImage, getImagePreviewUrl } from "@/lib/compress";
import { toast } from "sonner";
import {
  Car,
  Tag,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { User } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface WorkItem {
  id: string;
  name: string;
  category: string;
  beforePhotoUrl: string | null;
  afterPhotoUrl: string | null;
  afterFile: File | null;
  isCompleted: boolean;
  isCapturing: boolean;
}

// =============================================================================
// Mock Data - 承認済み項目のみ（Phase 4の結果）
// =============================================================================

const mockJobData = {
  id: "job-001",
  customerName: "田中 太郎",
  vehicleName: "BMW X3",
  licensePlate: "品川 300 あ 1234",
  tagId: "05",
};

const initialWorkItems: WorkItem[] = [
  {
    id: "work-1",
    name: "法定12ヶ月点検",
    category: "点検",
    beforePhotoUrl: null,
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-2",
    name: "エンジンオイル交換",
    category: "エンジン",
    beforePhotoUrl: "https://placehold.co/400x300/e2e8f0/64748b?text=Oil+Before",
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-3",
    name: "Fブレーキパッド交換",
    category: "ブレーキ",
    beforePhotoUrl: "https://placehold.co/400x300/fecaca/dc2626?text=Brake+Before",
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-4",
    name: "タイヤローテーション",
    category: "足回り",
    beforePhotoUrl: "https://placehold.co/400x300/fef08a/ca8a04?text=Tire+Before",
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
  {
    id: "work-5",
    name: "ワイパーゴム交換",
    category: "外装",
    beforePhotoUrl: null,
    afterPhotoUrl: null,
    afterFile: null,
    isCompleted: false,
    isCapturing: false,
  },
];

// =============================================================================
// Components
// =============================================================================

/**
 * 作業項目カードコンポーネント
 */
function WorkItemCard({
  item,
  onCapture,
  onComplete,
}: {
  item: WorkItem;
  onCapture: (id: string, file: File) => void;
  onComplete: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(item.id, file);
    }
    e.target.value = "";
  };

  return (
    <Card
      className={cn(
        "transition-all",
        item.isCompleted && "border-green-500 bg-green-50"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 完了チェック */}
          <div className="pt-1">
            {item.isCompleted ? (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
            )}
          </div>

          {/* コンテンツ */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className={cn(
                "font-medium",
                item.isCompleted ? "text-green-700" : "text-slate-900"
              )}>
                {item.name}
              </p>
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
            </div>

            {/* Before写真（あれば） */}
            {item.beforePhotoUrl && (
              <div className="mt-2 mb-3">
                <p className="text-xs text-slate-500 mb-1">Before:</p>
                <img
                  src={item.beforePhotoUrl}
                  alt="Before"
                  className="w-24 h-18 object-cover rounded border"
                />
              </div>
            )}

            {/* After写真プレビュー（撮影済みの場合） */}
            {item.afterPhotoUrl && (
              <div className="mt-2 mb-3">
                <p className="text-xs text-green-600 mb-1">✓ After:</p>
                <img
                  src={item.afterPhotoUrl}
                  alt="After"
                  className="w-24 h-18 object-cover rounded border border-green-300"
                />
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex gap-2 mt-3">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* 撮影ボタン */}
              <Button
                variant={item.afterPhotoUrl ? "outline" : "default"}
                size="sm"
                onClick={handleCameraClick}
                disabled={item.isCapturing || item.isCompleted}
                className="flex-1 h-12"
              >
                {item.isCapturing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    圧縮中...
                  </div>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-1" />
                    {item.afterPhotoUrl ? "再撮影" : "📸 完了撮影"}
                  </>
                )}
              </Button>

              {/* 完了ボタン */}
              {item.afterPhotoUrl && !item.isCompleted && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onComplete(item.id)}
                  className="h-12 bg-green-100 text-green-700 hover:bg-green-200"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  完了
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * スワイプ完了ボタンコンポーネント
 */
function SwipeToCompleteButton({
  onComplete,
  disabled,
}: {
  onComplete: () => void;
  disabled: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    if (disabled) return;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || disabled || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left - 40;
    const maxWidth = rect.width - 80;
    const newProgress = Math.max(0, Math.min(1, offsetX / maxWidth));
    setProgress(newProgress);

    if (newProgress >= 0.95) {
      setProgress(1);
      setIsDragging(false);
      onComplete();
    }
  };

  const handleEnd = () => {
    if (progress < 0.95) {
      setProgress(0);
    }
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-16 rounded-full overflow-hidden transition-colors",
        disabled
          ? "bg-slate-200 cursor-not-allowed"
          : "bg-gradient-to-r from-green-500 to-green-600 cursor-pointer"
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleEnd}
    >
      {/* 背景テキスト */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          "font-bold",
          disabled ? "text-slate-400" : "text-white/80"
        )}>
          {disabled ? "全項目を完了してください" : "→ スワイプで作業完了"}
        </span>
      </div>

      {/* 進捗バー */}
      <div
        className="absolute top-0 left-0 h-full bg-green-700/50 transition-all"
        style={{ width: `${progress * 100}%` }}
      />

      {/* スライダーノブ */}
      <div
        className={cn(
          "absolute top-1 left-1 h-14 w-14 rounded-full flex items-center justify-center transition-transform",
          disabled ? "bg-slate-300" : "bg-white shadow-lg"
        )}
        style={{ transform: `translateX(${progress * (containerRef.current?.offsetWidth || 300 - 80)}px)` }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {progress >= 0.95 ? (
          <Check className={cn("h-6 w-6", disabled ? "text-slate-400" : "text-green-600")} />
        ) : (
          <Wrench className={cn("h-6 w-6", disabled ? "text-slate-400" : "text-green-600")} />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function MechanicWorkPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [workItems, setWorkItems] = useState<WorkItem[]>(initialWorkItems);

  /**
   * 写真撮影ハンドラ
   */
  const handleCapture = async (itemId: string, file: File) => {
    // 圧縮中フラグをON
    setWorkItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isCapturing: true } : item
      )
    );

    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setWorkItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                afterFile: compressedFile,
                afterPhotoUrl: previewUrl,
                isCapturing: false,
              }
            : item
        )
      );

      toast.success("写真を撮影しました", {
        description: `${(compressedFile.size / 1024).toFixed(0)}KB に圧縮済み`,
      });
    } catch (error) {
      console.error("撮影エラー:", error);
      setWorkItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isCapturing: false } : item
        )
      );
      toast.error("撮影に失敗しました");
    }
  };

  /**
   * 項目完了ハンドラ
   */
  const handleItemComplete = (itemId: string) => {
    setWorkItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isCompleted: true } : item
      )
    );
    toast.success("項目を完了しました");
  };

  /**
   * 全作業完了ハンドラ
   */
  const handleAllComplete = () => {
    console.log("=== 作業完了 ===");
    console.log("Job ID:", jobId);
    console.log("Completed Items:", workItems.filter((i) => i.isCompleted).map((i) => i.name));

    toast.success("作業が完了しました！", {
      description: "フロントに通知を送信しました",
    });

    // 1.5秒後にトップへ戻る
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  // 統計
  const completedCount = workItems.filter((i) => i.isCompleted).length;
  const totalCount = workItems.length;
  const allCompleted = completedCount === totalCount;

  const workTitle = "作業";
  const vehicleName = mockJobData.vehicleName;
  const licensePlate = mockJobData.licensePlate;
  const customerName = mockJobData.customerName;
  const tagId = mockJobData.tagId;

  return (
    <div className="min-h-screen bg-slate-100 pb-32">
      {/* ヘッダー */}
      <AppHeader maxWidthClassName="max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                {workTitle}
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-1 text-sm px-2.5 py-1 h-7 rounded-full text-slate-700 bg-slate-50"
                >
                  作業待ち
                </Badge>
                <Badge variant="outline" className="gap-1 text-sm px-2.5 py-1 h-7 rounded-full">
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

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* 進捗表示 */}
        <Card className="mb-4">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">作業進捗</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">
                  {completedCount} / {totalCount}
                </span>
                <Badge variant={allCompleted ? "default" : "secondary"}>
                  {allCompleted ? "完了" : "作業中"}
                </Badge>
              </div>
            </div>
            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 注意事項 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">各作業後に証拠写真を撮影してください</p>
            <p className="text-amber-700">新品と旧品を並べて撮影するとわかりやすいです</p>
          </div>
        </div>

        {/* 作業項目リスト */}
        <div className="space-y-3">
          {workItems.map((item) => (
            <WorkItemCard
              key={item.id}
              item={item}
              onCapture={handleCapture}
              onComplete={handleItemComplete}
            />
          ))}
        </div>
      </main>

      {/* 完了ボタン（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <SwipeToCompleteButton
            onComplete={handleAllComplete}
            disabled={!allCompleted}
          />
        </div>
      </div>
    </div>
  );
}

