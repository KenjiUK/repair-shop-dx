"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { compressImage, getImagePreviewUrl } from "@/lib/compress";
import { fetchJobById, saveDiagnosis, updateJobStatus } from "@/lib/api";
import { toast } from "sonner";
import { DiagnosisStatus, ZohoJob } from "@/types";
import {
  Camera,
  Car,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Send,
  Loader2,
  AlertOctagon,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Types
// =============================================================================

type PhotoPosition = "front" | "rear" | "left" | "right";

interface PhotoData {
  position: PhotoPosition;
  file: File | null;
  previewUrl: string | null;
  isCompressing: boolean;
}

interface CheckItem {
  id: string;
  name: string;
  category: string;
  status: DiagnosisStatus;
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
// Initial Data
// =============================================================================

const initialCheckItems: CheckItem[] = [
  { id: "tire-front", name: "タイヤ（前輪）", category: "足回り", status: "unchecked" },
  { id: "tire-rear", name: "タイヤ（後輪）", category: "足回り", status: "unchecked" },
  { id: "brake-pad", name: "ブレーキパッド", category: "ブレーキ", status: "unchecked" },
  { id: "brake-disc", name: "ブレーキディスク", category: "ブレーキ", status: "unchecked" },
  { id: "engine-oil", name: "エンジンオイル", category: "エンジン", status: "unchecked" },
  { id: "oil-filter", name: "オイルフィルター", category: "エンジン", status: "unchecked" },
  { id: "battery", name: "バッテリー", category: "電装", status: "unchecked" },
  { id: "wiper", name: "ワイパーゴム", category: "外装", status: "unchecked" },
  { id: "light", name: "ライト類", category: "電装", status: "unchecked" },
  { id: "coolant", name: "冷却水", category: "エンジン", status: "unchecked" },
];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 車両情報から表示用の車両名を抽出
 */
function extractVehicleName(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "車両未登録";
  // "BMW X3 / 品川 300 あ 1234" から "BMW X3" を抽出
  const parts = vehicleInfo.split(" / ");
  return parts[0] || vehicleInfo;
}

/**
 * 車両情報からナンバープレートを抽出
 */
function extractLicensePlate(vehicleInfo: string | undefined): string {
  if (!vehicleInfo) return "";
  // "BMW X3 / 品川 300 あ 1234" から "品川 300 あ 1234" を抽出
  const parts = vehicleInfo.split(" / ");
  return parts[1] || "";
}

// =============================================================================
// Components
// =============================================================================

/**
 * 撮影ボタンコンポーネント
 */
function PhotoCaptureButton({
  position,
  label,
  photoData,
  onCapture,
  disabled,
}: {
  position: PhotoPosition;
  label: string;
  photoData: PhotoData;
  onCapture: (position: PhotoPosition, file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(position, file);
    }
    e.target.value = "";
  };

  const hasPhoto = !!photoData.previewUrl;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={photoData.isCompressing || disabled}
        className={cn(
          "w-full h-24 rounded-xl border-2 border-dashed transition-all",
          "flex flex-col items-center justify-center gap-1",
          "active:scale-95",
          hasPhoto
            ? "border-green-500 bg-green-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
          (photoData.isCompressing || disabled) && "opacity-50 cursor-wait"
        )}
      >
        {photoData.isCompressing ? (
          <div className="flex flex-col items-center gap-1">
            <div className="animate-spin h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full" />
            <span className="text-xs text-slate-500">圧縮中...</span>
          </div>
        ) : hasPhoto ? (
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-green-700">{label}</span>
            <span className="text-xs text-green-600">撮影済み ✓</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Camera className="h-6 w-6 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">📸 {label}</span>
          </div>
        )}
      </button>

      {hasPhoto && (
        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-md">
          <img
            src={photoData.previewUrl!}
            alt={label}
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}

/**
 * 信号機ボタンコンポーネント
 */
function TrafficLightButton({
  status,
  currentStatus,
  onClick,
  disabled,
}: {
  status: DiagnosisStatus;
  currentStatus: DiagnosisStatus;
  onClick: () => void;
  disabled?: boolean;
}) {
  const isSelected = currentStatus === status;

  const config = {
    green: {
      icon: CheckCircle2,
      label: "OK",
      bgActive: "bg-green-500",
      bgInactive: "bg-green-100 hover:bg-green-200",
      textActive: "text-white",
      textInactive: "text-green-700",
    },
    yellow: {
      icon: AlertCircle,
      label: "注意",
      bgActive: "bg-yellow-500",
      bgInactive: "bg-yellow-100 hover:bg-yellow-200",
      textActive: "text-white",
      textInactive: "text-yellow-700",
    },
    red: {
      icon: XCircle,
      label: "要交換",
      bgActive: "bg-red-500",
      bgInactive: "bg-red-100 hover:bg-red-200",
      textActive: "text-white",
      textInactive: "text-red-700",
    },
    unchecked: {
      icon: AlertCircle,
      label: "",
      bgActive: "",
      bgInactive: "",
      textActive: "",
      textInactive: "",
    },
  };

  if (status === "unchecked") return null;

  const { icon: Icon, label, bgActive, bgInactive, textActive, textInactive } = config[status];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex-1 h-12 rounded-lg transition-all active:scale-95",
        "flex items-center justify-center gap-1",
        isSelected ? bgActive : bgInactive,
        isSelected ? textActive : textInactive,
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

/**
 * チェック項目コンポーネント
 */
function CheckItemRow({
  item,
  onStatusChange,
  disabled,
}: {
  item: CheckItem;
  onStatusChange: (id: string, status: DiagnosisStatus) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">{item.name}</p>
        <p className="text-xs text-slate-500">{item.category}</p>
      </div>
      <div className="flex gap-1">
        <TrafficLightButton
          status="green"
          currentStatus={item.status}
          onClick={() => onStatusChange(item.id, "green")}
          disabled={disabled}
        />
        <TrafficLightButton
          status="yellow"
          currentStatus={item.status}
          onClick={() => onStatusChange(item.id, "yellow")}
          disabled={disabled}
        />
        <TrafficLightButton
          status="red"
          currentStatus={item.status}
          onClick={() => onStatusChange(item.id, "red")}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/**
 * ヘッダースケルトン
 */
function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <Skeleton className="h-4 w-32 mb-2" />
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-12 w-full mt-2" />
      </div>
    </header>
  );
}

/**
 * エラー表示
 */
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
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

export default function DiagnosisPage() {
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

  // 写真データの状態管理
  const [photos, setPhotos] = useState<Record<PhotoPosition, PhotoData>>({
    front: { position: "front", file: null, previewUrl: null, isCompressing: false },
    rear: { position: "rear", file: null, previewUrl: null, isCompressing: false },
    left: { position: "left", file: null, previewUrl: null, isCompressing: false },
    right: { position: "right", file: null, previewUrl: null, isCompressing: false },
  });

  // チェックリストの状態管理
  const [checkItems, setCheckItems] = useState<CheckItem[]>(initialCheckItems);

  // 送信中フラグ
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 写真撮影ハンドラ
   */
  const handlePhotoCapture = async (position: PhotoPosition, file: File) => {
    setPhotos((prev) => ({
      ...prev,
      [position]: { ...prev[position], isCompressing: true },
    }));

    try {
      const compressedFile = await compressImage(file);
      const previewUrl = await getImagePreviewUrl(compressedFile);

      setPhotos((prev) => ({
        ...prev,
        [position]: {
          position,
          file: compressedFile,
          previewUrl,
          isCompressing: false,
        },
      }));

      toast.success(`${position === "front" ? "前" : position === "rear" ? "後" : position === "left" ? "左" : "右"}の写真を撮影しました`);
    } catch (error) {
      console.error("写真処理エラー:", error);
      setPhotos((prev) => ({
        ...prev,
        [position]: { ...prev[position], isCompressing: false },
      }));
      toast.error("写真の処理に失敗しました");
    }
  };

  /**
   * チェック項目ステータス変更ハンドラ
   */
  const handleStatusChange = (itemId: string, status: DiagnosisStatus) => {
    setCheckItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status } : item
      )
    );
  };

  /**
   * 診断完了ハンドラ
   */
  const handleComplete = async () => {
    if (!job) return;

    setIsSubmitting(true);

    try {
      // 写真データを整形
      const photoData = Object.values(photos)
        .filter((p) => p.file)
        .map((p) => ({
          position: p.position,
          url: p.previewUrl || "", // 実際はアップロード後のURLになる
        }));

      // 診断データを整形
      const diagnosisData = {
        items: checkItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          status: item.status,
          comment: null,
          evidencePhotoUrls: [],
          evidenceVideoUrl: null,
        })),
        photos: photoData,
        mileage: job.field10 || undefined,
      };

      // 診断結果を保存
      const saveResult = await saveDiagnosis(jobId, diagnosisData);

      if (!saveResult.success) {
        throw new Error(saveResult.error?.message || "診断の保存に失敗しました");
      }

      // ステータスを更新
      const statusResult = await updateJobStatus(jobId, "見積作成待ち");

      if (!statusResult.success) {
        throw new Error(statusResult.error?.message || "ステータスの更新に失敗しました");
      }

      // 成功
      toast.success("診断完了", {
        description: "フロントへ送信しました",
      });

      // トップページへ遷移
      router.push("/");
    } catch (error) {
      console.error("診断完了エラー:", error);
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "診断の送信に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <HeaderSkeleton />
        <main className="max-w-2xl mx-auto px-4 py-4 pb-32">
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-12 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
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

  // 車両情報を抽出
  const vehicleName = extractVehicleName(job.field6?.name);
  const licensePlate = extractLicensePlate(job.field6?.name);
  const tagId = job.tagId || "---";
  const details = job.field7 || job.details;
  const workOrder = job.field || job.workOrder;

  // 統計情報
  const photoCount = Object.values(photos).filter((p) => p.file).length;
  const checkedCount = checkItems.filter((item) => item.status !== "unchecked").length;
  const redCount = checkItems.filter((item) => item.status === "red").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* 戻るボタン */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            受付画面へ戻る
          </Link>

          {/* 車両情報 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Car className="h-5 w-5" />
                {vehicleName}
              </h1>
              <p className="text-sm text-slate-600">{licensePlate}</p>
            </div>
            <Badge variant="outline" className="gap-1 text-base px-3 py-1">
              <Tag className="h-4 w-4" />
              タグ {tagId}
            </Badge>
          </div>

          {/* アラート表示 */}
          {details && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-md p-2 text-sm text-blue-800">
              📝 {details}
            </div>
          )}
          {workOrder && (
            <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              {workOrder}
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-2xl mx-auto px-4 py-4 pb-32">
        {/* 撮影セクション */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                外観撮影
              </span>
              <Badge variant={photoCount === 4 ? "default" : "secondary"}>
                {photoCount}/4
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <PhotoCaptureButton
                position="front"
                label="前"
                photoData={photos.front}
                onCapture={handlePhotoCapture}
                disabled={isSubmitting}
              />
              <PhotoCaptureButton
                position="rear"
                label="後"
                photoData={photos.rear}
                onCapture={handlePhotoCapture}
                disabled={isSubmitting}
              />
              <PhotoCaptureButton
                position="left"
                label="左"
                photoData={photos.left}
                onCapture={handlePhotoCapture}
                disabled={isSubmitting}
              />
              <PhotoCaptureButton
                position="right"
                label="右"
                photoData={photos.right}
                onCapture={handlePhotoCapture}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* 診断チェックリスト */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>🔍 診断チェックリスト</span>
              <div className="flex gap-2">
                {redCount > 0 && (
                  <Badge variant="destructive">{redCount}件 要交換</Badge>
                )}
                <Badge variant={checkedCount === checkItems.length ? "default" : "secondary"}>
                  {checkedCount}/{checkItems.length}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {checkItems.map((item) => (
                <CheckItemRow
                  key={item.id}
                  item={item}
                  onStatusChange={handleStatusChange}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 完了ボタン（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleComplete}
            size="lg"
            className="w-full h-14 text-lg font-bold gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                送信中...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                診断完了（フロントへ送信）
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
