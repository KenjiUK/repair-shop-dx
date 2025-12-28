"use client";

// Note: クライアントコンポーネントはデフォルトで動的レンダリングされるため、force-dynamicは不要

import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchJobById, createEstimate, updateJobStatus, updateJobBaseSystemId, fetchCustomerById, fetchAllCourtesyCars } from "@/lib/api";
import { generateMagicLink, sendLineNotification } from "@/lib/line-api";
import { sendEstimateEmail } from "@/lib/email-api";
import { searchInvoicePdf, getOrCreateJobFolder } from "@/lib/google-drive";
import { toast } from "sonner";
import { EstimatePriority, ZohoJob, ServiceKind, EstimateItem, DriveFile, DiagnosisItem, PartsInfo, PartItem, WorkOrder } from "@/types";
import { LegalFeesCard } from "@/components/features/legal-fees-card";
import { getLegalFees } from "@/lib/legal-fees";
import { addDiagnosisItemsToEstimate, addTireDiagnosisItemsToEstimate, addMaintenanceDiagnosisItemsToEstimate, addTuningPartsDiagnosisItemsToEstimate, addCoatingDiagnosisItemsToEstimate, convertInspectionRedesignToEstimateItems } from "@/lib/diagnosis-to-estimate";
import { InspectionItemRedesign } from "@/types/inspection-redesign";
import { VEHICLE_INSPECTION_ITEMS, InspectionItem } from "@/lib/inspection-items";
import { TireInspectionItem, getInitialTireInspectionItems } from "@/lib/tire-inspection-items";
import { MaintenanceInspectionItemState, getInitialMaintenanceInspectionItems } from "@/components/features/maintenance-inspection-view";
import { getMaintenanceMenuConfig, MaintenanceType } from "@/lib/maintenance-menu-config";
import { TuningPartsInspectionItem, getInitialTuningPartsInspectionItems } from "@/components/features/tuning-parts-inspection-view";
import { TuningPartsType } from "@/lib/tuning-parts-config";
import { BodyConditionCheck, getInitialBodyConditionChecks, BodyConditionStatus } from "@/components/features/coating-inspection-view";
import { OptionMenuSelector } from "@/components/features/option-menu-selector";
import { OptionMenuItem } from "@/types";
import { FaultDiagnosisEstimateView } from "@/components/features/fault-diagnosis-estimate-view";
import { calculateTax, getTaxRate } from "@/lib/tax-calculation";
import { downloadEstimatePdf } from "@/lib/pdf-generator";
import { OBDDiagnosticResult } from "@/components/features/obd-diagnostic-result-section";
import { PartsListInput, PartsListItem, PartsArrivalStatus } from "@/components/features/parts-list-input";
import { AudioInputButton, AudioData } from "@/components/features/audio-input-button";
import { useWorkOrders, updateWorkOrder, createWorkOrder } from "@/hooks/use-work-orders";
import { WorkOrderSelector } from "@/components/features/work-order-selector";
import { InvoiceUpload } from "@/components/features/invoice-upload";
import { BodyPaintEstimateView, BodyPaintEstimateData } from "@/components/features/body-paint-estimate-view";
import { VendorEstimate } from "@/components/features/body-paint-diagnosis-view";
import { RestoreEstimateView, RestoreEstimateData } from "@/components/features/restore-estimate-view";
import { OtherServiceEstimateView, OtherServiceEstimateData } from "@/components/features/other-service-estimate-view";
import { EstimateChangeHistorySection } from "@/components/features/estimate-change-history-section";
import { PhotoManager, PhotoItem } from "@/components/features/photo-manager";
import type { AdditionalEstimateItem } from "@/components/features/additional-estimate-view";
import dynamic from "next/dynamic";

// ダイアログコンポーネントを動的インポート（コード分割）
const PartsArrivalDialog = dynamic(
  () => import("@/components/features/parts-arrival-dialog").then(mod => ({ default: mod.PartsArrivalDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const AddWorkOrderDialog = dynamic(
  () => import("@/components/features/add-work-order-dialog").then(mod => ({ default: mod.AddWorkOrderDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const JobMemoDialog = dynamic(
  () => import("@/components/features/job-memo-dialog").then(mod => ({ default: mod.JobMemoDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const HistoricalEstimateDialog = dynamic(
  () => import("@/components/features/historical-estimate-dialog").then(mod => ({ default: mod.HistoricalEstimateDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const HistoricalJobDialog = dynamic(
  () => import("@/components/features/historical-job-dialog").then(mod => ({ default: mod.HistoricalJobDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const EstimateTemplateDialog = dynamic(
  () => import("@/components/features/estimate-template-dialog").then(mod => ({ default: mod.EstimateTemplateDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

const EstimatePreviewDialog = dynamic(
  () => import("@/components/features/estimate-preview-dialog").then(mod => ({ default: mod.EstimatePreviewDialog })),
  {
    loading: () => <Skeleton className="h-12 w-full" />,
    ssr: false
  }
);

// 型定義のみをインポート（ContactMethodなど）
import type { ContactMethod } from "@/components/features/parts-arrival-dialog";
import {
  Car,
  Tag,
  Camera,
  Video,
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
  Mic,
  ChevronDown,
  CheckCircle2,
  History,
  FileText,
  ExternalLink,
  Package,
  MessageSquare,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { CompactJobHeader } from "@/components/layout/compact-job-header";
import { User } from "lucide-react";
import { usePageTiming } from "@/hooks/use-page-timing";
import { setNavigationHistory, getBackHref, getPageTypeFromPath, saveCurrentPath } from "@/lib/navigation-history";
import { usePathname } from "next/navigation";
import { withFetcherTiming } from "@/lib/api-timing";
import Image from "next/image";
import { searchLaborCostByName, LaborCostMasterItem } from "@/lib/labor-cost-master";
import { PhotoPositionKey } from "@/lib/photo-position";
import { cleanNumericInput, parseNumericValue, validateNumericInput } from "@/lib/number-input";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ISO8601の日時文字列から時刻を抽出 (HH:MM形式)
 */
function formatTime(isoString: string): string {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

/**
 * ステータスバッジのスタイルを取得
 */
/**
 * ステータスバッジのスタイルを取得
 * セマンティックカラーシステムに基づく統一ルール
 */
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case "入庫待ち":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "入庫済み":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "見積作成待ち":
      return "bg-indigo-50 text-indigo-600 border-indigo-300";
    case "見積提示済み":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "作業待ち":
      return "bg-orange-50 text-orange-700 border-orange-300";
    case "出庫待ち":
      return "bg-green-50 text-green-700 border-green-300";
    case "出庫済み":
      return "bg-slate-50 text-slate-700 border-slate-300";
    case "部品調達待ち":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "部品発注待ち":
      return "bg-orange-50 text-orange-700 border-orange-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

// =============================================================================
// Types
// =============================================================================

interface DiagnosisPhoto {
  id: string;
  position: PhotoPositionKey | string; // PhotoPositionKey型または文字列（後方互換性のため）
  label: string;
  url: string;
}

interface DiagnosisVideo {
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
  name: string; // 作業内容・使用部品名等
  partQuantity: number; // 数量（部品・用品）
  partUnitPrice: number; // 単価（部品・用品）
  laborCost: number; // 技術量
  priority: EstimatePriority;
  linkedPhotoId: string | null;
  linkedVideoId: string | null;
  transcription: string | null; // 実況解説テキスト（音声認識結果）
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

/**
 * ジョブ取得フェッチャー（API応答時間計測付き）
 */
const jobFetcherWithTiming = (jobId: string) =>
  withFetcherTiming(() => jobFetcher(jobId), "fetchJobById", "estimate");

// =============================================================================
// Default/Fallback Data（診断データがない場合のフォールバック）
// =============================================================================

// 本番環境では空の配列を使用（ダミーデータは表示しない）
const defaultPhotos: DiagnosisPhoto[] = [];

const defaultFlaggedItems: DiagnosisCheckItem[] = [];

const defaultEstimateItems: EstimateLineItem[] = [];

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
      <Image
        src={photo.url}
        alt={photo.label}
        width={96}
        height={96}
        className="w-full h-24 object-cover"
        unoptimized
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
        <p className="text-base text-white truncate">{photo.label}</p>
      </div>
    </div>
  );
}

/**
 * 折りたたみ可能なセクションコンポーネント
 */
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Icon className="h-5 w-5 shrink-0" />
            {title}
            {badge && (
              <Badge variant="secondary" className="text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                {badge}
              </Badge>
            )}
          </CardTitle>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-slate-700 transition-transform shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </CardHeader>
      {isOpen && <CardContent>{children}</CardContent>}
    </Card>
  );
}

/**
 * 見積行コンポーネント（5列形式）
 */
function EstimateLineRow({
  item,
  photos,
  videos,
  onUpdate,
  onDelete,
  canDelete,
  disabled,
  onPhotoClick,
}: {
  item: EstimateLineItem;
  photos: DiagnosisPhoto[];
  videos: DiagnosisVideo[];
  onUpdate: (id: string, updates: Partial<EstimateLineItem>) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
  disabled?: boolean;
  onPhotoClick?: (photoUrl: string, itemName: string) => void;
}) {
  // サジェスト表示の状態
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // inputValueをitem.nameと同期
  useEffect(() => {
    setInputValue(item.name);
  }, [item.name]);

  // 部品代の計算（数量 × 単価）
  const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);

  // バリデーション: 負の数のチェック（IME対応）
  const validateAndUpdate = (field: 'partQuantity' | 'partUnitPrice' | 'laborCost', value: string) => {
    // 全角→半角変換とクリーンアップ
    const cleaned = cleanNumericInput(value);

    // バリデーション（負の数を許可しない、小数点はpartQuantityのみ許可）
    const validation = validateNumericInput(cleaned, {
      min: 0,
      allowNegative: false,
      allowDecimal: field === 'partQuantity', // 数量のみ小数点を許可
    });

    // バリデーションエラーの場合
    if (!validation.isValid) {
      toast.error("入力エラー", {
        description: validation.error || "正しい数値を入力してください",
      });
      return;
    }

    // 数値を取得（nullの場合は0）
    const numValue = validation.parsedValue ?? 0;

    // 更新
    if (field === 'partQuantity') {
      onUpdate(item.id, { partQuantity: numValue });
    } else if (field === 'partUnitPrice') {
      onUpdate(item.id, { partUnitPrice: Math.floor(numValue) }); // 単価は整数のみ
    } else {
      onUpdate(item.id, { laborCost: Math.floor(numValue) }); // 技術料は整数のみ
    }
  };

  // バリデーション: 部品代と技術料の両方が0の場合の警告表示フラグ
  const laborCost = item.laborCost || 0;
  const totalAmount = partTotal + laborCost;
  const isZeroAmount = totalAmount === 0 && item.name.trim() !== "";

  // サジェストのフィルタリング
  const filteredSuggestions = useMemo(() => {
    if (!inputValue || inputValue.length < 1) return [];
    return searchLaborCostByName(inputValue).slice(0, 8); // 最大8件
  }, [inputValue]);

  // サジェスト選択時のハンドラ
  const handleSuggestionSelect = (masterItem: LaborCostMasterItem) => {
    onUpdate(item.id, {
      name: masterItem.name,
      laborCost: masterItem.laborCost,
    });
    setShowSuggestions(false);
  };

  // 入力変更時のハンドラ
  const handleInputChange = (value: string) => {
    setInputValue(value);
    onUpdate(item.id, { name: value });
    setShowSuggestions(value.length > 0);
  };

  // 紐付けられている写真を検索
  const linkedPhoto = item.linkedPhotoId
    ? photos.find((photo) => photo.id === item.linkedPhotoId)
    : null;

  // 写真クリックハンドラ
  const handlePhotoClick = () => {
    if (linkedPhoto && onPhotoClick) {
      onPhotoClick(linkedPhoto.url, item.name || "見積項目");
    }
  };

  return (
    <>
      {/* モバイル時: シンプルなカード型レイアウト（sm以下） */}
      <div
        className="block sm:hidden border border-slate-200 rounded-lg p-4 mb-3 bg-white"
        role="row"
        aria-label={`見積項目: ${item.name || "未入力"}`}
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="作業内容を入力"
              className="h-12 text-base"
              disabled={disabled}
              aria-label="作業内容"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 text-base flex justify-between items-center"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <span className="truncate">{suggestion.name}</span>
                    <span className="text-slate-500 text-sm ml-2 shrink-0">¥{formatPrice(suggestion.laborCost)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            disabled={!canDelete || disabled}
            className="h-12 w-12 text-slate-500 hover:text-red-600 hover:bg-red-50 shrink-0"
            aria-label={`${item.name || "項目"}を削除`}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* 数量・単価・部品代 */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-sm text-slate-600 mb-1 block">数量</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={item.partQuantity || ""}
                onChange={(e) => validateAndUpdate('partQuantity', e.target.value)}
                placeholder="0"
                className="h-12 text-right text-base"
                disabled={disabled}
                aria-label="数量"
              />
            </div>
            <div className="relative">
              <Label className="text-sm text-slate-600 mb-1 block">単価</Label>
              <span className="absolute left-2 top-[calc(50%+10px)] -translate-y-1/2 text-slate-500 text-sm">¥</span>
              <Input
                type="text"
                inputMode="numeric"
                value={item.partUnitPrice ? formatPrice(item.partUnitPrice) : ""}
                onChange={(e) => validateAndUpdate('partUnitPrice', e.target.value)}
                placeholder="0"
                className="h-12 text-right text-base pl-5"
                disabled={disabled}
                aria-label="単価"
              />
            </div>
            <div>
              <Label className="text-sm text-slate-600 mb-1 block">部品代</Label>
              <div className="h-12 flex items-center justify-end px-3 border border-slate-200 rounded-md bg-slate-50">
                <span className="text-base text-slate-700 tabular-nums">
                  ¥{formatPrice(partTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* 技術料 */}
          <div className="relative">
            <Label className="text-sm text-slate-600 mb-1 block">技術料</Label>
            <span className="absolute left-3 top-[calc(50%+10px)] -translate-y-1/2 text-slate-500">¥</span>
            <Input
              type="text"
              inputMode="numeric"
              value={item.laborCost ? formatPrice(item.laborCost) : ""}
              onChange={(e) => validateAndUpdate('laborCost', e.target.value)}
              placeholder="0"
              className="h-12 text-right text-base pl-6"
              disabled={disabled}
              aria-label="技術料"
            />
          </div>
        </div>
      </div>

      {/* タブレット・PC時: グリッドレイアウト */}
      <div
        className="hidden sm:block"
        role="row"
        aria-label={`見積項目: ${item.name || "未入力"}`}
      >
        {/* タブレット時: シンプルなグリッド（mdのみ） */}
        <div className="hidden md:block lg:hidden">
          <div className="grid grid-cols-[1fr_100px_100px_100px_100px_48px] gap-4 items-center py-3 border-b border-slate-200">
            {/* 作業内容 */}
            <div className="flex items-center gap-2" role="gridcell">
              <div className="relative flex-1">
                <Input
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="作業内容を入力"
                  className="h-12 text-base"
                  disabled={disabled}
                  aria-label="作業内容"
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 text-base flex justify-between items-center"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <span className="truncate">{suggestion.name}</span>
                        <span className="text-slate-500 text-sm ml-2 shrink-0">¥{formatPrice(suggestion.laborCost)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {linkedPhoto && (
                <button
                  onClick={handlePhotoClick}
                  className="shrink-0 h-10 w-10 flex items-center justify-center text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                  aria-label={`${item.name || "見積項目"}の写真を確認`}
                  title="写真を確認"
                >
                  <ImageIcon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* 数量 */}
            <div role="gridcell">
              <Input
                type="text"
                inputMode="decimal"
                value={item.partQuantity || ""}
                onChange={(e) => {
                  const cleaned = cleanNumericInput(e.target.value);
                  const parsed = parseNumericValue(cleaned);
                  onUpdate(item.id, { partQuantity: parsed ?? 0 });
                }}
                placeholder="0"
                className="h-12 text-right text-base"
                disabled={disabled}
                aria-label="数量"
              />
            </div>

            {/* 単価 */}
            <div role="gridcell" className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
              <Input
                type="text"
                inputMode="numeric"
                value={item.partUnitPrice ? formatPrice(item.partUnitPrice) : ""}
                onChange={(e) => validateAndUpdate('partUnitPrice', e.target.value)}
                placeholder="0"
                className="h-12 text-right text-base pl-6"
                disabled={disabled}
                aria-label="単価"
              />
            </div>

            {/* 部品代（自動計算） */}
            <div className="h-12 flex items-center justify-end px-3 border border-slate-200 rounded-md bg-slate-50" role="gridcell">
              <span className="text-base text-slate-700 tabular-nums">
                ¥{formatPrice(partTotal)}
              </span>
            </div>

            {/* 技術料（直接入力可能） */}
            <div role="gridcell" className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
              <Input
                type="text"
                inputMode="numeric"
                value={item.laborCost ? formatPrice(item.laborCost) : ""}
                onChange={(e) => validateAndUpdate('laborCost', e.target.value)}
                placeholder="0"
                className="h-12 text-right text-base pl-6"
                disabled={disabled}
                aria-label="技術料"
              />
            </div>

            {/* 削除ボタン */}
            <div role="gridcell">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
                disabled={!canDelete || disabled}
                className="h-12 w-12 text-slate-500 hover:text-red-600 hover:bg-red-50"
                aria-label={`${item.name || "項目"}を削除`}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* PC時: シンプルなグリッドレイアウト（lg以上） */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_100px_100px_100px_100px_48px] gap-4 items-center py-3 border-b border-slate-200">
          {/* 作業内容・使用部品名等 */}
          <div className="flex items-center gap-2" role="gridcell">
            <div className="relative flex-1">
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="作業内容を入力"
                className="h-12 text-base"
                disabled={disabled}
                aria-label="作業内容・使用部品名等"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 text-base flex justify-between items-center"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <span className="truncate">{suggestion.name}</span>
                      <span className="text-slate-500 text-sm ml-2 shrink-0">¥{formatPrice(suggestion.laborCost)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {linkedPhoto && (
              <button
                onClick={handlePhotoClick}
                className="shrink-0 h-10 w-10 flex items-center justify-center text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                aria-label={`${item.name || "見積項目"}の写真を確認`}
                title="写真を確認"
              >
                <ImageIcon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* 数量 */}
          <div role="gridcell">
            <Input
              type="text"
              inputMode="decimal"
              value={item.partQuantity || ""}
              onChange={(e) => {
                const cleaned = cleanNumericInput(e.target.value);
                const parsed = parseNumericValue(cleaned);
                onUpdate(item.id, { partQuantity: parsed ?? 0 });
              }}
              placeholder="0"
              className="h-12 text-right text-base"
              disabled={disabled}
              aria-label="数量"
            />
          </div>

          {/* 単価 */}
          <div role="gridcell" className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
            <Input
              type="text"
              inputMode="numeric"
              value={item.partUnitPrice ? formatPrice(item.partUnitPrice) : ""}
              onChange={(e) => {
                const cleaned = cleanNumericInput(e.target.value);
                const parsed = parseNumericValue(cleaned);
                onUpdate(item.id, { partUnitPrice: parsed ? Math.floor(parsed) : 0 });
              }}
              placeholder="0"
              className="h-12 text-right text-base pl-6"
              disabled={disabled}
              aria-label="単価"
            />
          </div>

          {/* 部品代（自動計算） */}
          <div className="h-12 flex items-center justify-end px-3 border border-slate-200 rounded-md bg-slate-50" role="gridcell">
            <span className="text-base text-slate-700 tabular-nums">
              ¥{formatPrice(partTotal)}
            </span>
          </div>

          {/* 技術料（直接入力可能） */}
          <div role="gridcell" className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">¥</span>
            <Input
              type="text"
              inputMode="numeric"
              value={item.laborCost ? formatPrice(item.laborCost) : ""}
              onChange={(e) => validateAndUpdate('laborCost', e.target.value)}
              placeholder="0"
              className="h-12 text-right text-base pl-6"
              disabled={disabled}
              aria-label="技術料"
            />
          </div>

          {/* 削除ボタン */}
          <div role="gridcell">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item.id)}
              disabled={!canDelete || disabled}
              className="h-12 w-12 text-slate-500 hover:text-red-600 hover:bg-red-50"
              aria-label={`${item.name || "項目"}を削除`}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
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
  videos,
  onUpdate,
  onDelete,
  onAdd,
  badgeVariant,
  disabled,
  isTaxIncluded = true,
  onPhotoClick,
}: {
  title: string;
  priority: EstimatePriority;
  items: EstimateLineItem[];
  photos: DiagnosisPhoto[];
  videos: DiagnosisVideo[];
  onUpdate: (id: string, updates: Partial<EstimateLineItem>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  badgeVariant: "default" | "secondary" | "outline";
  disabled?: boolean;
  isTaxIncluded?: boolean;
  onPhotoClick?: (photoUrl: string, itemName: string) => void;
}) {
  const sectionItems = items.filter((item) => item.priority === priority);
  // 部品代合計
  const partTotal = sectionItems.reduce(
    (sum, item) => sum + (item.partQuantity || 0) * (item.partUnitPrice || 0),
    0
  );
  // 技術量合計
  const laborTotal = sectionItems.reduce((sum, item) => sum + (item.laborCost || 0), 0);
  // 税抜き合計
  const sectionSubtotal = partTotal + laborTotal;
  // 消費税計算
  const taxCalculation = calculateTax(sectionSubtotal);
  // 表示用の合計（税込/税抜に応じて切り替え）
  const sectionTotal = isTaxIncluded ? taxCalculation.total : sectionSubtotal;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge
          variant={badgeVariant}
          className={cn(
            "text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap text-white",
            priority === "required" && "bg-red-600 hover:bg-red-700 border-red-600",
            priority === "recommended" && "bg-emerald-600 hover:bg-emerald-700 border-emerald-600",
            priority === "optional" && "bg-slate-500 hover:bg-slate-600 border-slate-500"
          )}
        >
          {title}
        </Badge>
        <span className="text-base text-slate-700">
          {sectionItems.length}件
        </span>
      </div>

      <div className="mt-3">
        {/* テーブルヘッダー（項目がある場合のみタブレット・PC時に表示） */}
        {sectionItems.length > 0 && (
          <div className="hidden sm:block">
            {/* タブレット時: 横スクロール可能なグリッド（mdのみ） */}
            <div className="hidden md:block lg:hidden overflow-x-auto -mx-4 px-4">
              <div className="inline-grid grid-cols-[1fr_100px_100px_100px_100px_48px] gap-4 items-center py-2 border-b-2 border-slate-300 font-medium text-base text-slate-600 min-w-full">
                <div>作業内容</div>
                <div className="text-right">数量</div>
                <div className="text-right">単価</div>
                <div className="text-right">部品代</div>
                <div className="text-right">技術料</div>
                <div></div>
              </div>
            </div>
            {/* PC時: シンプルなグリッドヘッダー（lg以上） */}
            <div className="hidden lg:grid lg:grid-cols-[1fr_100px_100px_100px_100px_48px] gap-4 items-center py-2 border-b-2 border-slate-300 font-medium text-base text-slate-600">
              <div>作業内容</div>
              <div className="text-right">数量</div>
              <div className="text-right">単価</div>
              <div className="text-right">部品代</div>
              <div className="text-right">技術料</div>
              <div></div>
            </div>
          </div>
        )}

        {/* 見積項目行 */}
        {sectionItems.map((item) => (
          <EstimateLineRow
            key={item.id}
            item={item}
            photos={photos}
            videos={videos}
            onUpdate={onUpdate}
            onDelete={onDelete}
            canDelete={priority !== "required" || sectionItems.length > 1}
            disabled={disabled}
            onPhotoClick={onPhotoClick}
          />
        ))}

        {/* 項目を追加ボタン（2つ目以降は合計テーブルの上に表示） */}
        {sectionItems.length > 0 && (
          <Button
            variant="ghost"
            onClick={onAdd}
            disabled={disabled}
            className="w-full justify-start text-slate-700 hover:text-slate-900 h-12 text-base font-medium mt-2"
            aria-label={`${title}セクションに項目を追加`}
          >
            <Plus className="h-5 w-5 mr-1 shrink-0" aria-hidden="true" />
            項目を追加
          </Button>
        )}

        {/* 合計行 */}
        {sectionItems.length > 0 && (
          <>
            {/* モバイル時: カード型レイアウト */}
            <div className="block sm:hidden border border-slate-300 rounded-lg p-4 mt-3 bg-slate-50">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-base text-slate-700">部品代</span>
                  <span className="text-base font-medium text-slate-900 tabular-nums">¥{formatPrice(partTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base text-slate-700">技術料</span>
                  <span className="text-base font-medium text-slate-900 tabular-nums">¥{formatPrice(laborTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-base text-slate-700">小計{isTaxIncluded ? "（税抜）" : ""}</span>
                  <span className="text-base font-medium text-slate-900 tabular-nums">¥{formatPrice(sectionSubtotal)}</span>
                </div>
                {isTaxIncluded && (
                  <div className="flex justify-between">
                    <span className="text-base text-slate-700">消費税（{taxCalculation.taxRate}%）</span>
                    <span className="text-base font-medium text-slate-900 tabular-nums">¥{formatPrice(taxCalculation.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t-2 border-slate-300">
                  <span className="text-base font-bold text-slate-900">合計{isTaxIncluded ? "（税込）" : "（税抜）"}</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">¥{formatPrice(sectionTotal)}</span>
                </div>
              </div>
            </div>

            {/* タブレット・PC時: シンプルなレイアウト */}
            <div className="hidden sm:block mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-base text-slate-700">部品代</span>
                  <span className="text-base font-medium text-slate-900 tabular-nums">¥{formatPrice(partTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base text-slate-700">技術料</span>
                  <span className="text-base font-medium text-slate-900 tabular-nums">¥{formatPrice(laborTotal)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                  <span className="text-base text-slate-700">小計{isTaxIncluded ? "（税抜）" : ""}</span>
                  <span className="text-base font-medium text-slate-900 tabular-nums">¥{formatPrice(sectionSubtotal)}</span>
                </div>
                {isTaxIncluded && (
                  <div className="flex justify-between items-center">
                    <span className="text-base text-slate-700">消費税（{taxCalculation.taxRate}%）</span>
                    <span className="text-base font-medium text-slate-900 tabular-nums">¥{formatPrice(taxCalculation.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
                  <span className="text-lg font-bold text-slate-900">合計{isTaxIncluded ? "（税込）" : "（税抜）"}</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">¥{formatPrice(sectionTotal)}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 項目がない場合の追加ボタン */}
        {sectionItems.length === 0 && (
          <Button
            variant="ghost"
            onClick={onAdd}
            disabled={disabled}
            className="w-full justify-start text-slate-700 hover:text-slate-900 h-12 text-base font-medium"
            aria-label={`${title}セクションに項目を追加`}
          >
            <Plus className="h-5 w-5 mr-1 shrink-0" aria-hidden="true" />
            項目を追加
          </Button>
        )}
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
    <main className="max-w-4xl mx-auto px-4 py-6" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
      <div className="space-y-4">
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
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 overflow-auto">
      <Card className="w-full max-w-md" role="alert">
        <CardContent className="py-8 text-center">
          <AlertOctagon className="h-12 w-12 mx-auto text-red-600 mb-4 shrink-0" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">エラー</h2>
          <p className="text-slate-700 dark:text-white mb-4">{message}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link href="/" aria-label="トップページへ戻る">トップへ戻る</Link>
            </Button>
            <Button onClick={onRetry} aria-label="再試行">再試行</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

function EstimatePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  // Next.js 16対応: paramsをuseMemoでラップして列挙を防止
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = useMemo(() => (params?.id ?? "") as string, [params]);

  // URLパラメータからworkOrderIdを取得
  const workOrderId = useMemo(() => {
    const woId = searchParams?.get("workOrderId");
    return woId || null;
  }, [searchParams]);

  // ページ表示時間の計測
  usePageTiming("estimate", true);

  // SWRでジョブデータを取得（API応答時間を計測）
  const {
    data: job,
    error: jobError,
    isLoading: isJobLoading,
    mutate: mutateJob,
  } = useSWR(jobId ? `job-${jobId}` : null, jobId ? async () => {
    const fetcher = jobFetcherWithTiming(jobId);
    return await fetcher();
  } : null, {
    // グローバル設定を使用（swrGlobalConfig）
    // 初回アクセス時は必ずデータを取得する
    revalidateOnMount: true,
    // その他の設定はグローバル設定を継承
  });

  // ワークオーダーを取得
  const { workOrders, isLoading: isLoadingWorkOrders, mutate: mutateWorkOrders } = useWorkOrders(jobId);

  // 代車情報を取得（グローバルキャッシュを活用）
  const {
    data: courtesyCarsResponse,
  } = useSWR("courtesy-cars", async () => {
    const result = await fetchAllCourtesyCars();
    return result.success ? result.data : [];
  }, {
    // グローバル設定を使用（swrGlobalConfig）
    // 代車情報は頻繁に変更されないため、キャッシュを活用
    revalidateOnMount: false, // キャッシュがあれば再検証しない
    // その他の設定はグローバル設定を継承
  });
  const courtesyCars = courtesyCarsResponse || [];

  // 選択中のワークオーダーを取得
  const selectedWorkOrder = useMemo(() => {
    if (!workOrders || workOrders.length === 0) return null;
    if (workOrderId) {
      return workOrders.find((wo) => wo.id === workOrderId) || workOrders[0];
    }
    return workOrders[0]; // デフォルトは最初のワークオーダー
  }, [workOrders, workOrderId]);

  // ナビゲーション履歴を記録（ページ表示時に実行）
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = window.location.pathname + window.location.search;
    const currentPathname = window.location.pathname;

    // 前回保存されたパスを取得（sessionStorageから）
    let previousPath: string | null = null;
    try {
      previousPath = sessionStorage.getItem("repair-shop-current-path");
    } catch (error) {
      console.error("[Estimate] Failed to get previous path from sessionStorage:", error);
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
          console.log("[Estimate] Navigation history saved from sessionStorage:", { previousPath, referrerType });
        }
      } catch (error) {
        console.error("[Estimate] Failed to parse previous path:", error);
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
              console.log("[Estimate] Navigation history saved from referrer:", { referrerPath, referrerType });
            }
          } else {
            // 同じページへの遷移（リロードなど）は履歴を保持
            // 既存の履歴があればそのまま使用
          }
        }
      } catch (error) {
        console.error("[Estimate] Failed to record navigation history from referrer:", error);
      }
    }

    // 現在のパスを保存（次回のページ読み込み時に使用）
    saveCurrentPath(currentPathname, window.location.search);
  }, []);

  // 作業追加ダイアログの状態管理
  const [isAddWorkOrderDialogOpen, setIsAddWorkOrderDialogOpen] = useState(false);

  // 見積プレビューダイアログの状態管理
  const [isEstimatePreviewDialogOpen, setIsEstimatePreviewDialogOpen] = useState(false);

  // 基幹システム転記ダイアログの状態管理
  const [isBaseSystemCopyDialogOpen, setIsBaseSystemCopyDialogOpen] = useState(false);
  const [baseSystemItemsText, setBaseSystemItemsText] = useState("");
  const [baseSystemCopyMode, setBaseSystemCopyMode] = useState<"add" | "replace">("add");

  // 見積項目の状態管理
  // エンジンオイル交換の場合は初期状態で空（基本不要、イレギュラー時のみ追加）
  const [estimateItems, setEstimateItems] = useState<EstimateLineItem[]>([]);

  // 税込/税抜表示の切り替え（デフォルト: 税込）
  const [isTaxIncluded, setIsTaxIncluded] = useState(true);

  // サービス種類を取得
  const serviceKinds = useMemo(() => {
    if (!job) return [];
    return job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  }, [job]);

  // 選択中のワークオーダーのサービス種類を優先（複数作業管理の場合）
  const primaryServiceKind = useMemo(() => {
    if (selectedWorkOrder?.serviceKind) {
      return selectedWorkOrder.serviceKind as ServiceKind;
    }
    // ワークオーダーがない場合、serviceKindsの最初のものを使用
    return serviceKinds.length > 0 ? (serviceKinds[0] as ServiceKind) : undefined;
  }, [selectedWorkOrder, serviceKinds]);

  // デバッグログ（開発環境のみ）
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[見積画面] サービス種類判定:", {
        serviceKinds,
        primaryServiceKind,
        selectedWorkOrderId: selectedWorkOrder?.id,
        selectedWorkOrderServiceKind: selectedWorkOrder?.serviceKind,
      });
    }
  }, [serviceKinds, primaryServiceKind, selectedWorkOrder]);

  // エンジンオイル交換かどうかを判定
  const isEngineOilChange = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "エンジンオイル交換";
    }
    return serviceKinds.includes("エンジンオイル交換" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);

  // タイヤ交換・ローテーションかどうかを判定
  const isTireReplacement = useMemo(() => {
    return serviceKinds.includes("タイヤ交換・ローテーション" as ServiceKind);
  }, [serviceKinds]);

  // その他のメンテナンスかどうかを判定
  const isMaintenance = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "その他のメンテナンス";
    }
    return serviceKinds.includes("その他のメンテナンス" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);

  // チューニング・パーツ取付かどうかを判定
  const isTuningParts = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "チューニング" || primaryServiceKind === "パーツ取付";
    }
    return (
      serviceKinds.includes("チューニング" as ServiceKind) ||
      serviceKinds.includes("パーツ取付" as ServiceKind)
    );
  }, [primaryServiceKind, serviceKinds]);

  // コーティングかどうかを判定
  const isCoating = useMemo(() => {
    return serviceKinds.includes("コーティング" as ServiceKind);
  }, [serviceKinds]);

  // エンジンオイル交換でない場合のみデフォルト項目を設定
  // 注意: 実際の診断データがある場合は使用しない
  useEffect(() => {
    if (job && !isEngineOilChange && estimateItems.length === 0 && selectedWorkOrder?.diagnosis) {
      // 診断データがある場合は使用しない
      return;
    }
    if (job && !isEngineOilChange && estimateItems.length === 0 && !selectedWorkOrder?.diagnosis) {
      // 診断データがない場合のみデフォルト項目を設定
      setEstimateItems(defaultEstimateItems);
    }
  }, [job, isEngineOilChange, estimateItems.length, selectedWorkOrder]);

  // 選択中の写真（プレビュー用）
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // 写真表示Dialogの状態管理
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoDialogUrl, setPhotoDialogUrl] = useState<string>("");
  const [photoDialogTitle, setPhotoDialogTitle] = useState<string>("");

  // 写真クリックハンドラ
  const handleEstimateLinePhotoClick = (photoUrl: string, itemName: string) => {
    setPhotoDialogUrl(photoUrl);
    setPhotoDialogTitle(itemName);
    setPhotoDialogOpen(true);
  };

  // 送信中フラグ
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 故障診断用の状態管理
  const [causeExplanation, setCauseExplanation] = useState("");
  const [repairProposal, setRepairProposal] = useState("");
  const [diagnosticToolResult, setDiagnosticToolResult] = useState<OBDDiagnosticResult | undefined>();

  // 修理・整備用の状態管理
  const [partsList, setPartsList] = useState<PartsListItem[]>([]);
  const [audioData, setAudioData] = useState<AudioData | undefined>();
  const [isPartsProcurementWaiting, setIsPartsProcurementWaiting] = useState(false);

  // URL.createObjectURLで生成したURLのクリーンアップ
  useEffect(() => {
    return () => {
      // 音声のURLをクリーンアップ
      if (audioData?.audioUrl && audioData.audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(audioData.audioUrl);
      }
    };
  }, [audioData]);

  // 全部品到着時の連絡ダイアログの状態管理
  const [isPartsArrivalDialogOpen, setIsPartsArrivalDialogOpen] = useState(false);
  const [hasShownArrivalNotification, setHasShownArrivalNotification] = useState(false);

  // 診断料金管理の状態管理
  const [diagnosisFee, setDiagnosisFee] = useState<number | null>(null);
  const [diagnosisDuration, setDiagnosisDuration] = useState<number | null>(null);
  const [isDiagnosisFeePreDetermined, setIsDiagnosisFeePreDetermined] = useState(false);

  // メカニック承認の状態管理
  const [mechanicApproved, setMechanicApproved] = useState(false);

  // メモダイアログの状態
  const [isJobMemoDialogOpen, setIsJobMemoDialogOpen] = useState(false);
  const [isHistoricalEstimateDialogOpen, setIsHistoricalEstimateDialogOpen] = useState(false);
  const [isHistoricalJobDialogOpen, setIsHistoricalJobDialogOpen] = useState(false);
  const [isEstimateTemplateDialogOpen, setIsEstimateTemplateDialogOpen] = useState(false);
  const [mechanicApprover, setMechanicApprover] = useState<string>("");

  // サービス種類を判定（車検かどうか）
  const isInspection = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "車検" || primaryServiceKind === "12ヵ月点検";
    }
    return serviceKinds.includes("車検" as ServiceKind) || serviceKinds.includes("12ヵ月点検" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const is12MonthInspection = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "12ヵ月点検";
    }
    return serviceKinds.includes("12ヵ月点検" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const hasShakenSimultaneously = useMemo(() => {
    // 複数の入庫区分が設定されている場合、車検と12ヵ月点検の両方が含まれているか確認
    const hasShaken = primaryServiceKind === "車検" || serviceKinds.includes("車検" as ServiceKind);
    const has12Month = primaryServiceKind === "12ヵ月点検" || serviceKinds.includes("12ヵ月点検" as ServiceKind);
    return hasShaken && has12Month;
  }, [primaryServiceKind, serviceKinds, is12MonthInspection]);
  const isFaultDiagnosis = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "故障診断";
    }
    return serviceKinds.includes("故障診断" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isBodyPaint = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "板金・塗装";
    }
    return serviceKinds.includes("板金・塗装" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isRestore = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "レストア";
    }
    return serviceKinds.includes("レストア" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isRepair = useMemo(() => {
    if (primaryServiceKind) {
      return primaryServiceKind === "修理・整備";
    }
    return serviceKinds.includes("修理・整備" as ServiceKind);
  }, [primaryServiceKind, serviceKinds]);
  const isOther = useMemo(() => {
    return serviceKinds.includes("その他" as ServiceKind);
  }, [serviceKinds]);

  // 全部品到着時の自動処理
  useEffect(() => {
    if (!isRepair || partsList.length === 0) {
      setHasShownArrivalNotification(false);
      return;
    }

    // 全部品が到着済みかチェック（arrived または stored）
    const allArrived = partsList.every(
      (part) => part.arrivalStatus === "arrived" || part.arrivalStatus === "stored"
    );

    // 全部品が到着済みで、まだ通知を表示していない場合
    if (allArrived && !hasShownArrivalNotification) {
      // 通知を表示
      toast.success("全部品が到着しました", {
        description: "顧客への連絡を行ってください",
        duration: 5000,
      });

      // ダイアログを開く
      setIsPartsArrivalDialogOpen(true);
      setHasShownArrivalNotification(true);
    } else if (!allArrived) {
      // 全部品が到着していない場合は通知フラグをリセット
      setHasShownArrivalNotification(false);
    }
  }, [partsList, isRepair, hasShownArrivalNotification]);

  // 板金・塗装用の状態管理
  const [bodyPaintEstimateData, setBodyPaintEstimateData] = useState<BodyPaintEstimateData | null>(null);
  const [bodyPaintHasInsurance, setBodyPaintHasInsurance] = useState(false);
  const [bodyPaintInsuranceCompany, setBodyPaintInsuranceCompany] = useState("");

  // レストア用の状態管理
  const [restoreEstimateData, setRestoreEstimateData] = useState<RestoreEstimateData | null>(null);

  // その他用の状態管理
  const [otherEstimateData, setOtherEstimateData] = useState<OtherServiceEstimateData | null>(null);

  // 基幹システム明細IDの状態管理（各ワークオーダーごと）
  const [baseSystemItemId, setBaseSystemItemId] = useState<string>("");

  // 既存の請求書PDFの状態管理
  const [existingInvoice, setExistingInvoice] = useState<DriveFile | null>(null);

  // 法定費用の状態管理（車検の場合のみ）
  const [legalFees, setLegalFees] = useState<import("@/lib/legal-fees").LegalFees | null>(null);
  const [isLoadingLegalFees, setIsLoadingLegalFees] = useState(false);

  // 追加見積の状態管理（車検の場合のみ）
  const [additionalEstimateItems, setAdditionalEstimateItems] = useState<AdditionalEstimateItem[]>([]);
  const [manualAdditionalItems, setManualAdditionalItems] = useState<AdditionalEstimateItem[]>([]);

  // 法定費用を取得（車検の場合のみ）
  useEffect(() => {
    if (!job || !isInspection) return;

    const vehicleId = job.field6?.id; // 車両ID（実際の実装では適切なフィールドを使用）
    if (!vehicleId) return;

    setIsLoadingLegalFees(true);
    getLegalFees(vehicleId)
      .then((result) => {
        if (result.success && result.data) {
          setLegalFees(result.data);
        }
      })
      .catch((error) => {
        console.error("法定費用の取得エラー:", error);
        toast.error("法定費用の取得に失敗しました");
      })
      .finally(() => {
        setIsLoadingLegalFees(false);
      });
  }, [job, isInspection]);

  // 診断結果から見積項目を自動追加（車検の場合のみ、初回のみ）
  const [hasAutoAddedItems, setHasAutoAddedItems] = useState(false);
  useEffect(() => {
    if (!isInspection || !workOrders || workOrders.length === 0 || hasAutoAddedItems) return;

    // 車検のワークオーダーを取得
    const inspectionWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "車検" || wo.serviceKind === "12ヵ月点検"
    );

    if (!inspectionWorkOrder?.diagnosis?.items) return;

    const diagnosis = inspectionWorkOrder.diagnosis as any;
    
    // 24ヶ月点検リデザイン版かどうかを判定（statusが'good', 'exchange'などの場合）
    const is24MonthRedesign = diagnosis.items.some((item: any) => {
      const status = item.status as string;
      return status === 'good' || status === 'exchange' || status === 'repair' || status === 'adjust';
    });

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      let resultEstimateItems: EstimateItem[];
      
      if (is24MonthRedesign) {
        // 24ヶ月点検リデザイン版の処理
        const redesignItems: InspectionItemRedesign[] = diagnosis.items.map((item: DiagnosisItem) => ({
          id: item.id,
          label: item.name,
          category: item.category || 'other',
          status: item.status as InspectionItemRedesign['status'],
          comment: item.comment || undefined,
          photoUrls: item.evidencePhotoUrls || [],
          videoUrls: (item as any).evidenceVideoUrls || [],
          videoData: (item as any).videoData || [],
        }));
        
        // 問題があった項目（exchange, repair, adjust）のみを見積項目に変換
        const flaggedItems = convertInspectionRedesignToEstimateItems(redesignItems);
        
        // 既存の見積項目と重複チェックして追加
        const existingItems: EstimateItem[] = prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: (item.partQuantity || 0) * (item.partUnitPrice || 0) + (item.laborCost || 0),
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        }));
        
        const existingNames = new Set(existingItems.map(item => item.name));
        const newItems = flaggedItems.filter(item => !existingNames.has(item.name));
        resultEstimateItems = [...existingItems, ...newItems];
      } else {
        // 従来の処理
        const inspectionItems: InspectionItem[] = diagnosis.items.map((item: DiagnosisItem) => {
          const templateItem = VEHICLE_INSPECTION_ITEMS.find((t) => t.id === item.id);
          return {
            ...(templateItem || { id: item.id, name: item.name, category: "other" as const, status: "unchecked" }),
            status: item.status as InspectionItem["status"],
            comment: item.comment || undefined,
            photoUrls: item.evidencePhotoUrls,
            videoUrl: item.evidenceVideoUrl || undefined,
          };
        });
        
        resultEstimateItems = addDiagnosisItemsToEstimate(
          prev.map((item) => {
            const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
            const laborTotal = item.laborCost || 0;
            const totalPrice = partTotal + laborTotal;

            return {
              id: item.id,
              name: item.name,
              price: totalPrice,
              priority: item.priority,
              selected: true,
              linkedPhotoUrls: [],
              linkedVideoUrl: null,
              note: null,
            };
          }),
          inspectionItems
        );
      }

      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = resultEstimateItems.map((item) => {
        // 動画URLから動画IDを逆引き
        const linkedVideoId = item.linkedVideoUrl
          ? videos.find((v) => v.url === item.linkedVideoUrl)?.id || null
          : null;

        // 作業内容名から工賃マスタを検索して技術量を自動設定
        const laborCostItem = searchLaborCostByName(item.name);
        const laborCost = laborCostItem.length > 0
          ? laborCostItem[0].laborCost
          : (item.price || 0); // マスタにない場合は既存のpriceを使用（後方互換性）

        return {
          id: item.id,
          name: item.name,
          partQuantity: 0,
          partUnitPrice: 0,
          laborCost,
          priority: item.priority,
          linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0
            ? photos.find((p) => p.url === item.linkedPhotoUrls[0])?.id || null
            : null,
          linkedVideoId,
          transcription: item.transcription || null,
        };
      });

      if (newLineItems.length > prev.length) {
        setHasAutoAddedItems(true);
        // トーストIDを設定して重複を防ぐ
        const addedCount = newLineItems.length - prev.length;
        toast.success(
          is24MonthRedesign 
            ? `受入点検で発見された ${addedCount} 件の追加作業を見積に追加しました`
            : "診断結果から見積項目を自動追加しました",
          {
            id: "auto-add-inspection-items",
          }
        );
        
        // ワークオーダーに一時保存（詳細ボタンで確認できるようにするため）
        if (inspectionWorkOrder && newLineItems.length > prev.length) {
          // 非同期で保存（エラーは無視）
          (async () => {
            try {
              // photosとvideosを取得（useStateの現在の値を参照）
              const currentPhotos = photos;
              const currentVideos = videos;
              
              const estimateData: EstimateItem[] = newLineItems.map((item) => {
                const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
                const laborTotal = item.laborCost || 0;
                const totalPrice = partTotal + laborTotal;
                
                return {
                  id: item.id,
                  name: item.name,
                  price: totalPrice,
                  priority: item.priority,
                  selected: item.priority === "required" || item.priority === "recommended",
                  linkedPhotoUrls: item.linkedPhotoId
                    ? [currentPhotos.find((p: { id: string; url: string }) => p.id === item.linkedPhotoId)?.url || ""]
                    : [],
                  linkedVideoUrl: item.linkedVideoId
                    ? currentVideos.find((v: { id: string; url: string }) => v.id === item.linkedVideoId)?.url || null
                    : null,
                  transcription: item.transcription || null,
                  note: null,
                };
              });
              
              await createEstimate(jobId, inspectionWorkOrder.id, estimateData);
              await mutateWorkOrders();
            } catch (error) {
              console.warn("[見積] 自動追加項目の一時保存に失敗しました（無視）:", error);
            }
          })();
        }
        
        return newLineItems;
      }
      return prev;
    });
  }, [isInspection, workOrders, jobId, mutateWorkOrders]); // photosとvideosはuseStateなので依存配列に追加しない（無限ループを防ぐ）

  // 追加見積項目を生成（車検の場合のみ）
  const [hasGeneratedAdditionalItems, setHasGeneratedAdditionalItems] = useState(false);
  useEffect(() => {
    if (!isInspection || !workOrders || workOrders.length === 0 || hasGeneratedAdditionalItems) return;

    const inspectionWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "車検" || wo.serviceKind === "12ヵ月点検"
    );

    if (!inspectionWorkOrder?.diagnosis?.items) return;

    const diagnosis = inspectionWorkOrder.diagnosis as any;
    
    // 24ヶ月点検リデザイン版の場合のみ追加見積ビューを使用
    const is24MonthRedesign = diagnosis.items.some((item: any) => {
      const status = item.status as string;
      return status === 'good' || status === 'exchange' || status === 'repair' || status === 'adjust';
    });

    if (!is24MonthRedesign) return;

    // 交換・修理・調整の項目を抽出
    const flaggedItems = diagnosis.items.filter((item: any) => {
      const status = item.status as string;
      return status === 'exchange' || status === 'repair' || status === 'adjust';
    });

    if (flaggedItems.length === 0) return;

    const additionalItems = flaggedItems.map((item: any) => {
      const status = item.status as string;
      return {
        id: `additional-${item.id}`,
        name: item.name,
        status: status as "exchange" | "repair" | "adjust",
        // サンプルデータ: 写真が無い場合でもサンプル写真を表示（見た目確認用）
        photoUrls: item.evidencePhotoUrls && item.evidencePhotoUrls.length > 0 
          ? item.evidencePhotoUrls 
          : [
              "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
              "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop",
              "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop",
            ],
        videoUrls: item.evidenceVideoUrls || [],
        videoData: item.videoData || [],
        comment: item.comment || undefined,
        selected: status === 'exchange' || status === 'repair', // 交換・修理は自動選択
        partsCost: 0,
        laborCost: 0,
      };
    });

    setAdditionalEstimateItems(additionalItems);
    setHasGeneratedAdditionalItems(true);

    // 車検の場合は追加見積項目を直接見積項目に変換
    if (isInspection && additionalItems.length > 0) {
      const newEstimateItems: EstimateLineItem[] = additionalItems.map((item: AdditionalEstimateItem) => ({
        id: item.id,
        name: item.name,
        partQuantity: 1,
        partUnitPrice: 0,
        laborCost: 0,
        priority: item.status === 'adjust' ? 'recommended' as EstimatePriority : 'required' as EstimatePriority,
        linkedPhotoId: null,
        linkedVideoId: null,
        transcription: null,
      }));
      setEstimateItems(prev => {
        const existingNames = new Set(prev.map(i => i.name));
        const uniqueItems = newEstimateItems.filter(i => !existingNames.has(i.name));
        if (uniqueItems.length > 0) {
          return [...prev, ...uniqueItems];
        }
        return prev;
      });
    }

    // 診断データから追加見積項目（必須整備・推奨整備・任意整備）を読み込む
    if (isInspection && selectedWorkOrder?.diagnosis) {
      const diagnosis = selectedWorkOrder.diagnosis as any;
      
      // 必須整備項目を読み込む
      if (diagnosis.additionalEstimateRequired && Array.isArray(diagnosis.additionalEstimateRequired)) {
        const requiredItems: EstimateLineItem[] = diagnosis.additionalEstimateRequired.map((item: EstimateLineItem) => ({
          ...item,
          priority: 'required' as EstimatePriority,
        }));
        
        setEstimateItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueItems = requiredItems.filter(i => !existingIds.has(i.id));
          if (uniqueItems.length > 0) {
            return [...prev, ...uniqueItems];
          }
          return prev;
        });
      }

      // 推奨整備項目を読み込む
      if (diagnosis.additionalEstimateRecommended && Array.isArray(diagnosis.additionalEstimateRecommended)) {
        const recommendedItems: EstimateLineItem[] = diagnosis.additionalEstimateRecommended.map((item: EstimateLineItem) => ({
          ...item,
          priority: 'recommended' as EstimatePriority,
        }));
        
        setEstimateItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueItems = recommendedItems.filter(i => !existingIds.has(i.id));
          if (uniqueItems.length > 0) {
            return [...prev, ...uniqueItems];
          }
          return prev;
        });
      }

      // 任意整備項目を読み込む
      if (diagnosis.additionalEstimateOptional && Array.isArray(diagnosis.additionalEstimateOptional)) {
        const optionalItems: EstimateLineItem[] = diagnosis.additionalEstimateOptional.map((item: EstimateLineItem) => ({
          ...item,
          priority: 'optional' as EstimatePriority,
        }));
        
        setEstimateItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueItems = optionalItems.filter(i => !existingIds.has(i.id));
          if (uniqueItems.length > 0) {
            return [...prev, ...uniqueItems];
          }
          return prev;
        });
      }
    }
  }, [isInspection, workOrders, hasGeneratedAdditionalItems, selectedWorkOrder?.id, selectedWorkOrder?.diagnosis]);

  // 診断結果から見積項目を自動追加（タイヤ交換・ローテーションの場合のみ、初回のみ）
  const [hasAutoAddedTireItems, setHasAutoAddedTireItems] = useState(false);
  useEffect(() => {
    if (!isTireReplacement || !workOrders || workOrders.length === 0 || hasAutoAddedTireItems) return;

    // タイヤ交換・ローテーションのワークオーダーを取得
    const tireWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "タイヤ交換・ローテーション"
    );

    if (!tireWorkOrder?.diagnosis?.items) return;

    // 診断結果をタイヤ検査項目形式に変換
    const tireInspectionItems: TireInspectionItem[] = tireWorkOrder.diagnosis.items.map((item: DiagnosisItem) => {
      const templateItem = getInitialTireInspectionItems().find((t) => t.id === item.id);
      return {
        ...(templateItem || { id: item.id, name: item.name, category: "tire" as const, status: "unchecked" }),
        status: (item.status === "green" ? "ok" : item.status === "yellow" ? "attention" : item.status === "red" ? "replace" : "unchecked") as TireInspectionItem["status"],
        comment: item.comment || undefined,
        photoUrls: item.evidencePhotoUrls || [],
      };
    });

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      const estimateItems = addTireDiagnosisItemsToEstimate(
        prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: (item.partUnitPrice || 0) * (item.partQuantity || 0) + (item.laborCost || 0),
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        })),
        tireInspectionItems
      );

      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = estimateItems.map((item) => {
        // 動画URLから動画IDを逆引き
        const linkedVideoId = item.linkedVideoUrl
          ? videos.find((v) => v.url === item.linkedVideoUrl)?.id || null
          : null;

        // 作業内容名から工賃マスタを検索して技術量を自動設定
        const laborCostItem = searchLaborCostByName(item.name);
        const laborCost = laborCostItem.length > 0
          ? laborCostItem[0].laborCost
          : (item.price || 0); // マスタにない場合は既存のpriceを使用（後方互換性）

        return {
          id: item.id,
          name: item.name,
          partQuantity: 0,
          partUnitPrice: 0,
          laborCost,
          priority: item.priority,
          linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0
            ? photos.find((p) => p.url === item.linkedPhotoUrls[0])?.id || null
            : null,
          linkedVideoId,
          transcription: item.transcription || null,
        };
      });

      if (newLineItems.length > prev.length) {
        setHasAutoAddedTireItems(true);
        // トーストIDを設定して重複を防ぐ
        toast.success("診断結果から見積項目を自動追加しました", {
          id: "auto-add-tire-items",
        });
        return newLineItems;
      }
      return prev;
    });
  }, [isTireReplacement, workOrders]); // hasAutoAddedTireItemsを依存配列から削除

  // 診断結果から見積項目を自動追加（その他のメンテナンスの場合のみ、初回のみ）
  const [hasAutoAddedMaintenanceItems, setHasAutoAddedMaintenanceItems] = useState(false);
  useEffect(() => {
    if (!isMaintenance || !workOrders || workOrders.length === 0 || hasAutoAddedMaintenanceItems) return;

    // その他のメンテナンスのワークオーダーを取得
    const maintenanceWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "その他のメンテナンス"
    );

    if (!maintenanceWorkOrder?.diagnosis?.items) return;

    // 診断結果からメンテナンスメニューを特定（最初の項目のカテゴリから推測）
    // 実際の実装では、診断データにメンテナンスメニュー情報を含める必要がある
    // 現時点では、診断項目からメニューを推測するか、デフォルトメニューを使用
    const firstItem = maintenanceWorkOrder.diagnosis.items[0];
    if (!firstItem) return;

    // 診断結果をメンテナンス検査項目形式に変換
    // 注意: 実際の実装では、診断データにメンテナンスメニュー情報を含める必要がある
    // 現時点では、簡易実装として最初の項目のカテゴリからメニューを推測
    const maintenanceItems: MaintenanceInspectionItemState[] = maintenanceWorkOrder.diagnosis.items.map((item: DiagnosisItem) => ({
      id: item.id,
      name: item.name,
      category: item.category || "other",
      status: (item.status === "green" ? "ok" : item.status === "yellow" ? "attention" : item.status === "red" ? "replace" : "unchecked") as MaintenanceInspectionItemState["status"],
      comment: item.comment || undefined,
      photoUrls: item.evidencePhotoUrls || [],
    }));

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      const estimateItems = addMaintenanceDiagnosisItemsToEstimate(
        prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: (item.partUnitPrice || 0) * (item.partQuantity || 0) + (item.laborCost || 0),
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        })),
        maintenanceItems
      );

      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = estimateItems.map((item) => {
        // 動画URLから動画IDを逆引き
        const linkedVideoId = item.linkedVideoUrl
          ? videos.find((v) => v.url === item.linkedVideoUrl)?.id || null
          : null;

        // 作業内容名から工賃マスタを検索して技術量を自動設定
        const laborCostItem = searchLaborCostByName(item.name);
        const laborCost = laborCostItem.length > 0
          ? laborCostItem[0].laborCost
          : (item.price || 0); // マスタにない場合は既存のpriceを使用（後方互換性）

        return {
          id: item.id,
          name: item.name,
          partQuantity: 0,
          partUnitPrice: 0,
          laborCost,
          priority: item.priority,
          linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0
            ? photos.find((p) => p.url === item.linkedPhotoUrls[0])?.id || null
            : null,
          linkedVideoId,
          transcription: item.transcription || null,
        };
      });

      if (newLineItems.length > prev.length) {
        setHasAutoAddedMaintenanceItems(true);
        // トーストIDを設定して重複を防ぐ
        toast.success("診断結果から見積項目を自動追加しました", {
          id: "auto-add-maintenance-items",
        });
        return newLineItems;
      }
      return prev;
    });
  }, [isMaintenance, workOrders]); // hasAutoAddedMaintenanceItemsを依存配列から削除

  // 診断結果から見積項目を自動追加（チューニング・パーツ取付の場合のみ、初回のみ）
  const [hasAutoAddedTuningPartsItems, setHasAutoAddedTuningPartsItems] = useState(false);
  useEffect(() => {
    if (!isTuningParts || !workOrders || workOrders.length === 0 || hasAutoAddedTuningPartsItems) return;

    // チューニング・パーツ取付のワークオーダーを取得
    const tuningPartsWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "チューニング" || wo.serviceKind === "パーツ取付"
    );

    if (!tuningPartsWorkOrder?.diagnosis?.items) return;

    // 診断結果をチューニング・パーツ取付検査項目形式に変換
    // 注意: 実際の実装では、診断データにチューニング・パーツ取付の種類情報を含める必要がある
    // 現時点では、簡易実装として診断項目から推測
    const tuningPartsItems: TuningPartsInspectionItem[] = tuningPartsWorkOrder.diagnosis.items.map((item: DiagnosisItem) => ({
      id: item.id,
      name: item.name,
      category: item.category || "other",
      status: (item.status === "green" ? "ok" : item.status === "yellow" ? "attention" : item.status === "red" ? "replace" : "unchecked") as TuningPartsInspectionItem["status"],
      comment: item.comment || undefined,
      photoUrls: item.evidencePhotoUrls || [],
    }));

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      const estimateItems = addTuningPartsDiagnosisItemsToEstimate(
        prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: (item.partUnitPrice || 0) * (item.partQuantity || 0) + (item.laborCost || 0),
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        })),
        tuningPartsItems
      );

      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = estimateItems.map((item) => {
        // 動画URLから動画IDを逆引き
        const linkedVideoId = item.linkedVideoUrl
          ? videos.find((v) => v.url === item.linkedVideoUrl)?.id || null
          : null;

        // 作業内容名から工賃マスタを検索して技術量を自動設定
        const laborCostItem = searchLaborCostByName(item.name);
        const laborCost = laborCostItem.length > 0
          ? laborCostItem[0].laborCost
          : (item.price || 0); // マスタにない場合は既存のpriceを使用（後方互換性）

        return {
          id: item.id,
          name: item.name,
          partQuantity: 0,
          partUnitPrice: 0,
          laborCost,
          priority: item.priority,
          linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0
            ? photos.find((p) => p.url === item.linkedPhotoUrls[0])?.id || null
            : null,
          linkedVideoId,
          transcription: item.transcription || null,
        };
      });

      if (newLineItems.length > prev.length) {
        setHasAutoAddedTuningPartsItems(true);
        // トーストIDを設定して重複を防ぐ
        toast.success("診断結果から見積項目を自動追加しました", {
          id: "auto-add-tuning-parts-items",
        });
        return newLineItems;
      }
      return prev;
    });
  }, [isTuningParts, workOrders]); // hasAutoAddedTuningPartsItemsを依存配列から削除

  // 診断結果から見積項目を自動追加（コーティングの場合のみ、初回のみ）
  const [hasAutoAddedCoatingItems, setHasAutoAddedCoatingItems] = useState(false);
  useEffect(() => {
    if (!isCoating || !workOrders || workOrders.length === 0 || hasAutoAddedCoatingItems) return;

    // コーティングのワークオーダーを取得
    const coatingWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "コーティング"
    );

    if (!coatingWorkOrder?.diagnosis?.items) return;

    // 診断結果を車体状態確認形式に変換
    const bodyConditions: BodyConditionCheck[] = coatingWorkOrder.diagnosis.items.map((item: DiagnosisItem) => {
      // 診断項目のstatusから車体状態を推測
      let condition: BodyConditionStatus = "unchecked";
      if (item.status === "red") {
        condition = "深刻な傷";
      } else if (item.status === "yellow") {
        condition = "軽微な傷";
      } else if (item.status === "green") {
        condition = "良好";
      }

      return {
        id: item.id,
        location: item.name,
        condition,
        comment: item.comment || undefined,
        photoUrls: item.evidencePhotoUrls || [],
      };
    });

    // 診断結果から見積項目を追加
    setEstimateItems((prev) => {
      const estimateItems = addCoatingDiagnosisItemsToEstimate(
        prev.map((item) => ({
          id: item.id,
          name: item.name,
          price: (item.partUnitPrice || 0) * (item.partQuantity || 0) + (item.laborCost || 0),
          priority: item.priority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: null,
        })),
        bodyConditions
      );

      // EstimateItem[]をEstimateLineItem[]に変換
      const newLineItems: EstimateLineItem[] = estimateItems.map((item) => {
        // 動画URLから動画IDを逆引き
        const linkedVideoId = item.linkedVideoUrl
          ? videos.find((v) => v.url === item.linkedVideoUrl)?.id || null
          : null;

        // 作業内容名から工賃マスタを検索して技術量を自動設定
        const laborCostItem = searchLaborCostByName(item.name);
        const laborCost = laborCostItem.length > 0
          ? laborCostItem[0].laborCost
          : (item.price || 0); // マスタにない場合は既存のpriceを使用（後方互換性）

        return {
          id: item.id,
          name: item.name,
          partQuantity: 0,
          partUnitPrice: 0,
          laborCost,
          priority: item.priority,
          linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0
            ? photos.find((p) => p.url === item.linkedPhotoUrls[0])?.id || null
            : null,
          linkedVideoId,
          transcription: item.transcription || null,
        };
      });

      if (newLineItems.length > prev.length) {
        setHasAutoAddedCoatingItems(true);
        // トーストIDを設定して重複を防ぐ
        toast.success("診断結果から見積項目を自動追加しました", {
          id: "auto-add-coating-items",
        });
        return newLineItems;
      }
      return prev;
    });
  }, [isCoating, workOrders]); // hasAutoAddedCoatingItemsを依存配列から削除

  // オプションメニューの状態管理（12ヵ月点検の場合のみ）
  const [selectedOptionMenuIds, setSelectedOptionMenuIds] = useState<string[]>([]);

  // オプションメニューのモックデータ（実際の実装ではAPIから取得）
  const optionMenus: OptionMenuItem[] = [
    {
      id: "opt-1",
      name: "エンジンオイル交換",
      description: "高品質エンジンオイルに交換",
      originalPrice: 8000,
      discountedPrice: 7200,
      badge: { text: "人気", color: "green" },
      estimatedTime: "30分",
      category: "maintenance",
    },
    {
      id: "opt-2",
      name: "エアコンフィルター交換",
      description: "エアコンフィルターを新品に交換",
      originalPrice: 5000,
      discountedPrice: 4500,
      badge: { text: "推奨", color: "blue" },
      estimatedTime: "20分",
      category: "maintenance",
    },
    {
      id: "opt-3",
      name: "ブレーキフルード交換",
      description: "ブレーキフルードを新品に交換",
      originalPrice: 12000,
      discountedPrice: 10800,
      badge: { text: "安全", color: "green" },
      estimatedTime: "40分",
      category: "maintenance",
    },
    {
      id: "opt-4",
      name: "タイヤローテーション",
      description: "タイヤの位置を入れ替えて均等に摩耗",
      originalPrice: 3000,
      discountedPrice: 2700,
      badge: { text: "推奨", color: "blue" },
      estimatedTime: "30分",
      category: "maintenance",
    },
    {
      id: "opt-5",
      name: "バッテリー交換",
      description: "バッテリーを新品に交換",
      originalPrice: 15000,
      discountedPrice: 13500,
      badge: { text: "安全", color: "green" },
      estimatedTime: "30分",
      category: "maintenance",
    },
    {
      id: "opt-6",
      name: "ワイパーゴム交換",
      description: "ワイパーゴムを新品に交換",
      originalPrice: 4000,
      discountedPrice: 3600,
      badge: { text: "推奨", color: "blue" },
      estimatedTime: "20分",
      category: "maintenance",
    },
    {
      id: "opt-7",
      name: "エンジンルーム清掃",
      description: "エンジンルームを徹底清掃",
      originalPrice: 6000,
      discountedPrice: 5400,
      badge: { text: "オプション", color: "blue" },
      estimatedTime: "60分",
      category: "maintenance",
    },
    {
      id: "opt-8",
      name: "室内清掃",
      description: "車内を徹底清掃",
      originalPrice: 5000,
      discountedPrice: 4500,
      badge: { text: "オプション", color: "blue" },
      estimatedTime: "45分",
      category: "maintenance",
    },
  ];

  // オプションメニュー選択変更ハンドラ
  const handleOptionMenuSelectionChange = (menuId: string, selected: boolean) => {
    if (selected) {
      setSelectedOptionMenuIds((prev) => [...prev, menuId]);

      // 選択されたメニューを見積項目に追加
      const menu = optionMenus.find((m) => m.id === menuId);
      if (menu) {
        const newItem: EstimateLineItem = {
          id: `opt-${menuId}-${Date.now()}`,
          name: menu.name,
          partQuantity: 0,
          partUnitPrice: 0,
          laborCost: hasShakenSimultaneously ? menu.discountedPrice : menu.originalPrice,
          priority: "recommended",
          linkedPhotoId: null,
          linkedVideoId: null,
          transcription: null,
        };
        setEstimateItems((prev) => [...prev, newItem]);
        toast.success(`${menu.name}を見積項目に追加しました`);
      }
    } else {
      setSelectedOptionMenuIds((prev) => prev.filter((id) => id !== menuId));

      // 見積項目から削除
      setEstimateItems((prev) => prev.filter((item) => !item.id.startsWith(`opt-${menuId}-`)));
    }
  };

  // 診断写真の状態管理（削除・順番入れ替え機能のため）
  const initialPhotos = useMemo(() => {
    // 実際のデータがある場合はそれを使用
    const actualPhotos = selectedWorkOrder?.diagnosis?.photos;
    if (actualPhotos && Array.isArray(actualPhotos) && actualPhotos.length > 0) {
      return actualPhotos.map((photo: { position: string; url: string }, index: number) => ({
        id: `photo-${index}`,
        position: photo.position as PhotoPositionKey | string, // PhotoPositionKey型または文字列（後方互換性のため）
        label: photo.position,
        url: photo.url,
      }));
    }
    // 車検の場合、サンプルデータを追加（見た目確認用）
    // 実際のデータが空配列または存在しない場合にサンプルを表示
    if (isInspection) {
      return [
        {
          id: "sample-photo-1",
          position: "フロント" as PhotoPositionKey,
          label: "フロント",
          url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
        },
        {
          id: "sample-photo-2",
          position: "リア" as PhotoPositionKey,
          label: "リア",
          url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop",
        },
        {
          id: "sample-photo-3",
          position: "サイド" as PhotoPositionKey,
          label: "サイド",
          url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop",
        },
        {
          id: "sample-photo-4",
          position: "エンジンルーム" as PhotoPositionKey,
          label: "エンジンルーム",
          url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop",
        },
        {
          id: "sample-photo-5",
          position: "タイヤ" as PhotoPositionKey,
          label: "タイヤ",
          url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
        },
        {
          id: "sample-photo-6",
          position: "室内" as PhotoPositionKey,
          label: "室内",
          url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop",
        },
      ];
    }
    return defaultPhotos;
  }, [selectedWorkOrder, isInspection]);

  const [photos, setPhotos] = useState<DiagnosisPhoto[]>(initialPhotos);

  // selectedWorkOrderが変更されたときにphotosを更新
  useEffect(() => {
    // デバッグ: initialPhotosの内容を確認
    if (isInspection && initialPhotos.length > 0) {
      console.log("[Estimate] initialPhotos:", initialPhotos);
    }
    setPhotos(initialPhotos);
  }, [initialPhotos, isInspection]);

  // 診断動画の状態管理（evidenceVideoUrls配列に対応）
  const initialVideos = useMemo(() => {
    // 実際のデータがある場合はそれを使用
    const diagnosisItems = selectedWorkOrder?.diagnosis?.items;
    if (diagnosisItems && Array.isArray(diagnosisItems) && diagnosisItems.length > 0) {
      const videos: DiagnosisVideo[] = [];
      diagnosisItems.forEach((item: DiagnosisItem, index: number) => {
        // 後方互換性: evidenceVideoUrl（単一）もサポート
        if (item.evidenceVideoUrl) {
          videos.push({
            id: `video-${item.id}-${index}`,
            position: item.name,
            label: `${item.name} - メカニック解説`,
            url: item.evidenceVideoUrl,
          });
        }
        // 新規: evidenceVideoUrls（配列）をサポート
        const videoUrls = (item as any).evidenceVideoUrls || [];
        videoUrls.forEach((videoUrl: string, videoIndex: number) => {
          videos.push({
            id: `video-${item.id}-${index}-${videoIndex}`,
            position: item.name,
            label: `${item.name} - 動画 ${videoIndex + 1}`,
            url: videoUrl,
          });
        });
      });
      if (videos.length > 0) {
        return videos;
      }
    }
    // 車検の場合、サンプルデータを追加（見た目確認用）
    // 実際のデータが空配列または存在しない場合にサンプルを表示
    if (isInspection) {
      return [
        {
          id: "sample-video-1",
          position: "ブレーキパッド",
          label: "ブレーキパッド - メカニック解説",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        },
        {
          id: "sample-video-2",
          position: "エンジン異音",
          label: "エンジン異音 - メカニック解説",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        },
      ];
    }
    return [];
  }, [selectedWorkOrder, isInspection]);

  const [videos, setVideos] = useState<DiagnosisVideo[]>(initialVideos);

  // selectedWorkOrderが変更されたときにvideosを更新
  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  // 見積項目に紐付けられた写真を収集
  const linkedPhotos = useMemo(() => {
    const result: Array<{ itemName: string; photo: DiagnosisPhoto }> = [];
    estimateItems.forEach((item) => {
      if (item.linkedPhotoId) {
        const photo = photos.find((p) => p.id === item.linkedPhotoId);
        if (photo) {
          result.push({ itemName: item.name, photo });
        }
      }
    });
    return result;
  }, [estimateItems, photos]);

  // 見積項目に紐付けられた動画を収集
  const linkedVideos = useMemo(() => {
    const result: Array<{ itemName: string; video: DiagnosisVideo }> = [];
    estimateItems.forEach((item) => {
      if (item.linkedVideoId) {
        const video = videos.find((v) => v.id === item.linkedVideoId);
        if (video) {
          result.push({ itemName: item.name, video });
        }
      }
    });
    return result;
  }, [estimateItems, videos]);

  const flaggedItems = useMemo(() => {
    if (selectedWorkOrder?.diagnosis?.items && selectedWorkOrder.diagnosis.items.length > 0) {
      return selectedWorkOrder.diagnosis.items
        .filter((item: DiagnosisItem) => item.status !== "green" && item.status !== "unchecked")
        .map((item: DiagnosisItem) => {
          // statusは"yellow"または"red"のみ（フィルターでgreenとuncheckedを除外済み）
          const status: "yellow" | "red" = item.status === "yellow" || item.status === "red" ? item.status : "yellow";
          return {
            id: item.id,
            name: item.name,
            category: item.category,
            status,
            comment: item.comment || undefined,
          };
        });
    }
    return defaultFlaggedItems;
  }, [selectedWorkOrder]);

  // 選択中のワークオーダーのbaseSystemItemIdを取得・設定
  useEffect(() => {
    if (selectedWorkOrder?.baseSystemItemId) {
      setBaseSystemItemId(selectedWorkOrder.baseSystemItemId);
    } else {
      setBaseSystemItemId("");
    }
  }, [selectedWorkOrder]);

  /**
   * 基幹システムから見積項目を転記
   */
  const handleCopyFromBaseSystem = async () => {
    if (!baseSystemItemsText.trim()) {
      toast.error("転記する内容を入力してください");
      return;
    }

    setIsSubmitting(true);
    try {
      // 基幹システムのテキストをパース（CSV形式：品名,金額（税込））
      const lines = baseSystemItemsText.trim().split("\n").filter((line) => line.trim());
      const newItems: EstimateLineItem[] = [];

      for (const line of lines) {
        // CSV形式でパース：カンマ区切りで「品名,金額」を抽出
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // カンマで分割
        const parts = trimmedLine.split(",").map((p) => p.trim());

        if (parts.length >= 2) {
          const name = parts[0];
          // 金額部分から数値のみを抽出（カンマや円記号を除去）
          const priceStr = parts[1].replace(/[^\d]/g, "");
          const price = parseInt(priceStr) || 0;

          if (name && price > 0) {
            newItems.push({
              id: generateId(),
              name,
              partQuantity: 0,
              partUnitPrice: 0,
              laborCost: price,
              priority: "required",
              linkedPhotoId: null,
              linkedVideoId: null,
              transcription: null,
            });
          }
        } else if (parts.length === 1) {
          // カンマがない場合、スペース区切りで試行（後方互換性）
          const spaceParts = trimmedLine.split(/\s+/);
          if (spaceParts.length >= 2) {
            const name = spaceParts.slice(0, -1).join(" ");
            const priceStr = spaceParts[spaceParts.length - 1].replace(/[^\d]/g, "");
            const price = parseInt(priceStr) || 0;

            if (name && price > 0) {
              newItems.push({
                id: generateId(),
                name,
                partQuantity: 0,
                partUnitPrice: 0,
                laborCost: price,
                priority: "required",
                linkedPhotoId: null,
                linkedVideoId: null,
                transcription: null,
              });
            }
          }
        }
      }

      if (newItems.length === 0) {
        toast.error("有効な見積項目が見つかりませんでした", {
          description: "形式：品名,金額（税込）で入力してください",
        });
        return;
      }

      // 見積項目に追加または置き換え
      if (baseSystemCopyMode === "replace") {
        setEstimateItems(newItems);
        toast.success(`${newItems.length}件の見積項目に置き換えました`);
      } else {
        setEstimateItems((prev) => [...prev, ...newItems]);
        toast.success(`${newItems.length}件の見積項目を追加しました`);
      }

      setIsBaseSystemCopyDialogOpen(false);
      setBaseSystemItemsText("");
    } catch (error) {
      console.error("基幹システム転記エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "予期しないエラーが発生しました";
      // 関数名を取得するために、関数を再実行できるようにする
      const retryFunction = async () => {
        setIsSubmitting(true);
        try {
          // 同じ処理を再実行
          if (!baseSystemItemsText.trim()) {
            toast.error("転記する内容を入力してください");
            return;
          }
          // 処理を再実行（簡略化のため、ダイアログを再度開く）
          setIsBaseSystemCopyDialogOpen(true);
        } catch (retryError) {
          console.error("再試行エラー:", retryError);
        } finally {
          setIsSubmitting(false);
        }
      };
      toast.error("転記に失敗しました", {
        description: errorMessage,
        action: {
          label: "再試行",
          onClick: retryFunction,
        },
        duration: 10000, // リトライボタンを表示するため、表示時間を延長
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 既存の見積データを読み込む
  useEffect(() => {
    if (!selectedWorkOrder?.estimate) return;

    const estimate = selectedWorkOrder.estimate;

    // 見積項目を読み込む
    if (estimate.items && estimate.items.length > 0) {
      const lineItems: EstimateLineItem[] = estimate.items.map((item: EstimateItem) => {
        // 動画URLから動画IDを逆引き
        const linkedVideoId = item.linkedVideoUrl
          ? videos.find((v) => v.url === item.linkedVideoUrl)?.id || null
          : null;

        return {
          id: item.id,
          name: item.name,
          // 既存データはpriceを技術量として扱う（後方互換性）
          partQuantity: 0,
          partUnitPrice: 0,
          laborCost: item.price || 0,
          priority: item.priority,
          linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0
            ? photos.find((p) => p.url === item.linkedPhotoUrls[0])?.id || null
            : null,
          linkedVideoId,
          transcription: item.transcription || null,
        };
      });
      setEstimateItems(lineItems);
    }

    // 故障診断固有情報を読み込む
    if (estimate.faultDiagnosisInfo) {
      const faultInfo = estimate.faultDiagnosisInfo as {
        causeExplanation?: string;
        repairProposal?: string;
        diagnosticToolResultFileId?: string;
        diagnosticToolResultUrl?: string;
      };
      setCauseExplanation(faultInfo.causeExplanation || "");
      setRepairProposal(faultInfo.repairProposal || "");
      if (faultInfo.diagnosticToolResultFileId || faultInfo.diagnosticToolResultUrl) {
        setDiagnosticToolResult({
          fileId: faultInfo.diagnosticToolResultFileId,
          fileUrl: faultInfo.diagnosticToolResultUrl,
        });
      }
    }

    // 修理・整備固有情報を読み込む
    if (estimate.repairInfo) {
      const repairInfo = estimate.repairInfo as {
        audioUrl?: string;
        partsList?: Array<{
          id: string;
          name: string;
          quantity: number;
          unitPrice: number;
          note?: string;
          vendor?: string;
          arrivalStatus?: PartsArrivalStatus;
          arrivalDate?: string;
          storageLocation?: string;
        }>;
      };
      if (repairInfo.audioUrl) {
        setAudioData({
          audioUrl: repairInfo.audioUrl,
        });
      }
      // 部品リストを読み込む
      if (repairInfo.partsList && repairInfo.partsList.length > 0) {
        setPartsList(repairInfo.partsList.map((part) => ({
          id: part.id,
          name: part.name,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          note: part.note,
          vendor: part.vendor,
          arrivalStatus: part.arrivalStatus || "pending",
          arrivalDate: part.arrivalDate,
          storageLocation: part.storageLocation,
        })));
      }
    }

    // 診断料金情報を読み込む
    if (job && job.diagnosisFee !== undefined && job.diagnosisFee !== null) {
      setDiagnosisFee(job.diagnosisFee);
    }
    if (job && job.diagnosisDuration !== undefined && job.diagnosisDuration !== null) {
      setDiagnosisDuration(job.diagnosisDuration);
    }
    if (job && job.isDiagnosisFeePreDetermined !== undefined) {
      setIsDiagnosisFeePreDetermined(job.isDiagnosisFeePreDetermined);
    }

    // 板金・塗装固有情報を読み込む
    if (estimate.bodyPaintInfo) {
      const bodyPaintInfo = estimate.bodyPaintInfo as {
        hasInsurance?: boolean;
        insuranceCompany?: string;
        [key: string]: unknown;
      };
      setBodyPaintHasInsurance(bodyPaintInfo.hasInsurance || false);
      setBodyPaintInsuranceCompany(bodyPaintInfo.insuranceCompany || "");
      // bodyPaintEstimateDataは別途読み込む必要がある（見積項目から復元）
    }

    // レストア固有情報を読み込む
    if (estimate.restoreInfo) {
      // restoreEstimateDataは別途読み込む必要がある（見積項目から復元）
    }

    // その他固有情報を読み込む
    const estimateWithOtherInfo = estimate as { otherInfo?: OtherServiceEstimateData };
    if (estimateWithOtherInfo.otherInfo) {
      const otherInfo = estimateWithOtherInfo.otherInfo;
      setOtherEstimateData({
        items: otherInfo.items || [],
        parts: otherInfo.parts || [],
        total: otherInfo.total || 0,
      });
    }

    // 診断料金情報を読み込む（見積データから）
    const estimateWithDiagnosisFee = estimate as WorkOrder['estimate'] & {
      diagnosisFee?: number | null;
      diagnosisDuration?: number | null;
      isDiagnosisFeePreDetermined?: boolean;
    };
    if (estimateWithDiagnosisFee?.diagnosisFee !== undefined) {
      setDiagnosisFee(estimateWithDiagnosisFee.diagnosisFee);
    }
    if (estimateWithDiagnosisFee?.diagnosisDuration !== undefined) {
      setDiagnosisDuration(estimateWithDiagnosisFee.diagnosisDuration);
    }
    if (estimateWithDiagnosisFee?.isDiagnosisFeePreDetermined !== undefined) {
      setIsDiagnosisFeePreDetermined(estimateWithDiagnosisFee.isDiagnosisFeePreDetermined);
    }

    // メカニック承認情報を読み込む（ワークオーダーから優先、なければジョブから）
    if (selectedWorkOrder?.mechanicApproved !== undefined) {
      setMechanicApproved(selectedWorkOrder.mechanicApproved);
      setMechanicApprover(selectedWorkOrder.mechanicApprover || "");
    } else if (job && job.mechanicApproved !== undefined) {
      setMechanicApproved(job.mechanicApproved);
      setMechanicApprover(job.mechanicApprover || "");
    }
  }, [selectedWorkOrder, job]);

  // 故障診断の場合、診断結果から診断機結果を取得
  useEffect(() => {
    if (!isFaultDiagnosis || !workOrders || workOrders.length === 0) return;

    // 故障診断のワークオーダーを取得
    const faultDiagnosisWorkOrder = workOrders.find(
      (wo) => wo.serviceKind === "故障診断"
    );

    if (faultDiagnosisWorkOrder?.diagnosis) {
      // 診断機結果を取得
      const diagnosisWithToolResult = faultDiagnosisWorkOrder.diagnosis as WorkOrder['diagnosis'] & {
        diagnosticToolResult?: OBDDiagnosticResult;
      };
      if (diagnosisWithToolResult?.diagnosticToolResult) {
        setDiagnosticToolResult(diagnosisWithToolResult.diagnosticToolResult);
      }
    }
  }, [isFaultDiagnosis, workOrders]);

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
      partQuantity: 0,
      partUnitPrice: 0,
      laborCost: 0,
      priority,
      linkedPhotoId: null,
      linkedVideoId: null,
      transcription: null,
    };
    setEstimateItems((prev) => [...prev, newItem]);
  };

  /**
   * プレビュー
   */
  const handlePreview = () => {
    // エラーチェック：見積項目が1つ以上あるか確認
    if (estimateItems.length === 0) {
      toast.error("見積項目を追加してください", {
        description: "少なくとも1つの見積項目を追加してください",
      });
      return;
    }
    setIsEstimatePreviewDialogOpen(true);
  };

  /**
   * プレビューから保存
   */
  const handleSaveFromPreview = async () => {
    // handleSendLineを呼び出す（保存+LINE送信+マジックリンク生成）
    await handleSendLine();
  };

  /**
   * LINE送信
   */
  const handleSendLine = async () => {
    if (!job) return;

    // エラーチェック：見積項目が1つ以上あるか確認
    if (estimateItems.length === 0) {
      toast.error("見積項目を追加してください", {
        description: "少なくとも1つの見積項目を追加してください",
      });
      return;
    }

    // エラーチェック：見積項目に名前と金額が入力されているか確認
    const invalidItems = estimateItems.filter((item) => {
      const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
      const laborTotal = item.laborCost || 0;
      const total = partTotal + laborTotal;
      return !item.name.trim() || total <= 0;
    });
    if (invalidItems.length > 0) {
      toast.error("見積項目の入力が不正です", {
        description: "すべての見積項目に名前と金額（0円より大きい値）を入力してください",
      });
      return;
    }

    // エラーチェック：修理・整備の場合、部品リストが設定されているか確認
    if (isRepair && partsList.length === 0) {
      toast.warning("部品リストが空です", {
        description: "修理・整備の場合、部品リストを追加することを推奨します",
      });
      // 警告のみで続行可能
    }

    // エラーチェック：板金・塗装の場合、見積もり項目が設定されているか確認
    if (isBodyPaint && (!bodyPaintEstimateData || bodyPaintEstimateData.items.length === 0)) {
      toast.warning("板金・塗装の見積もり項目が空です", {
        description: "板金・塗装の場合、見積もり項目を追加することを推奨します",
      });
      // 警告のみで続行可能
    }

    setIsSubmitting(true);

    try {
      // ワークオーダーが存在しない場合は作成する（すべての分岐で使用）
      let targetWorkOrder = selectedWorkOrder;
      if (!targetWorkOrder) {
        // ワークオーダーが存在しない場合、作成する
        const serviceKindToUse = serviceKinds.length > 0 ? serviceKinds[0] : "その他";
        const createResult = await createWorkOrder(jobId, serviceKindToUse);
        if (!createResult.success || !createResult.data) {
          throw new Error(createResult.error?.message || "ワークオーダーの作成に失敗しました");
        }
        targetWorkOrder = createResult.data;
        // ワークオーダーリストを再取得（データが反映されるまで少し待機）
        await mutateWorkOrders();
        // データが反映されるまで少し待機（モックデータの場合、即座に反映されない可能性があるため）
        await new Promise((resolve) => setTimeout(resolve, 100));
        // 再度ワークオーダーリストを取得して、作成したワークオーダーを確認
        await mutateWorkOrders();
      }
      
      // 見積データを整形
      let estimateData: EstimateItem[] = estimateItems.map((item) => {
        const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
        const laborTotal = item.laborCost || 0;
        const totalPrice = partTotal + laborTotal;

        return {
          id: item.id,
          name: item.name,
          price: totalPrice,
          priority: item.priority,
          selected: item.priority === "required" || item.priority === "recommended",
          linkedPhotoUrls: item.linkedPhotoId
            ? [photos.find((p: { id: string; url: string }) => p.id === item.linkedPhotoId)?.url || ""]
            : [],
          linkedVideoUrl: item.linkedVideoId
            ? videos.find((v: { id: string; url: string }) => v.id === item.linkedVideoId)?.url || null
            : (null as string | null),
          transcription: item.transcription || null,
          note: null as string | null,
        };
      });

      // 故障診断の場合、原因説明と修理方法提案はEstimateDataのfaultDiagnosisInfoに保存される

      // 修理・整備の場合、部品リストを追加
      if (isRepair) {
        // 部品リストを見積項目に追加
        const partsEstimateItems: EstimateItem[] = partsList.map((part) => ({
          id: part.id,
          name: `${part.name} × ${part.quantity}`,
          price: part.quantity * part.unitPrice,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: part.note || null,
        }));

        // 既存の見積項目と部品リストを結合
        estimateData = [...estimateData, ...partsEstimateItems];

        // 音声データはEstimateDataのrepairInfoに保存される
      }

      // 板金・塗装の場合、見積もり項目を追加
      if (isBodyPaint && bodyPaintEstimateData) {
        // 板金・塗装の見積もり項目を見積項目に追加
        const bodyPaintEstimateItems = bodyPaintEstimateData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.amount,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: item.note || null,
        }));

        // 既存の見積項目と板金・塗装の見積もり項目を結合
        estimateData = [...estimateData, ...bodyPaintEstimateItems];

        // 作業期間、保険対応情報はEstimateDataのbodyPaintInfoに保存される
      }

      // レストアの場合、見積もり項目と部品リストを追加
      if (isRestore && restoreEstimateData) {
        // レストアの見積もり項目を見積項目に追加
        const restoreEstimateItems = restoreEstimateData.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.amount,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: item.note || null,
        }));

        // レストアの部品リストを見積項目に追加
        const restorePartsItems = restoreEstimateData.parts.map((part: any) => ({
          id: part.id,
          name: `${part.name} × ${part.quantity}`,
          price: part.quantity * part.unitPrice,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: part.note || null,
        }));

        // レストアの追加作業を見積項目に追加
        const restoreAdditionalWorkItems = restoreEstimateData.additionalWork.map(
          (work) => ({
            id: work.id,
            name: `[追加作業] ${work.content}`,
            price: work.additionalCost,
            priority: "required" as EstimatePriority,
            selected: true,
            linkedPhotoUrls: [],
            linkedVideoUrl: null,
            note: work.note || null,
          })
        );

        // 既存の見積項目とレストアの見積もり項目を結合
        estimateData = [
          ...estimateData,
          ...restoreEstimateItems,
          ...restorePartsItems,
          ...restoreAdditionalWorkItems,
        ];

        // 作業期間、見積もり変更履歴はEstimateDataのrestoreInfoに保存される
      }

      // その他の場合、見積もり項目と部品リストを追加
      if (isOther && otherEstimateData) {
        // その他の見積もり項目を見積項目に追加
        const otherEstimateItems = otherEstimateData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.amount,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: item.note || null,
        }));

        // その他の部品リストを見積項目に追加
        const otherPartsItems = (otherEstimateData.parts || []).map((part: any) => ({
          id: part.id,
          name: `${part.name} × ${part.quantity}`,
          price: part.quantity * part.unitPrice,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: part.note || null,
        }));

        // 既存の見積項目とその他の見積もり項目を結合
        estimateData = [
          ...estimateData,
          ...otherEstimateItems,
          ...otherPartsItems,
        ];
      }

      // 板金・塗装の場合、見積データを板金・塗装用の形式に変換
      if (isBodyPaint && bodyPaintEstimateData) {
        // 板金・塗装用の見積項目を見積データに追加
        const bodyPaintEstimateItems = bodyPaintEstimateData.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.amount,
          priority: "required" as EstimatePriority,
          selected: true,
          linkedPhotoUrls: [],
          linkedVideoUrl: null,
          note: item.note || null,
        }));

        // 既存の見積項目と板金・塗装用の見積項目を結合
        estimateData = [...estimateData, ...bodyPaintEstimateItems];

        // 板金・塗装用の追加情報（作業期間、保険対応など）はEstimateDataのbodyPaintInfoに保存される
      }

      // メカニック承認を保存
      if (selectedWorkOrder?.id) {
        await updateWorkOrder(jobId, selectedWorkOrder.id, {
          mechanicApproved: mechanicApproved || undefined,
          mechanicApprover: mechanicApprover.trim() || undefined,
          mechanicApprovedAt: mechanicApproved && mechanicApprover.trim() ? new Date().toISOString() : undefined,
        });
      }

      // 見積を保存（workOrderIdを含める）
      if (targetWorkOrder?.id) {
        // 複数作業管理対応：見積データを選択中のワークオーダーに保存
        // 小計、消費税、合計を計算
        const subtotal = estimateData.reduce((sum, item) => sum + item.price, 0);
        
        // 車検の場合、法定費用を含める
        const legalFeesTotal = (isInspection && legalFees) ? legalFees.total : 0;
        const subtotalWithLegalFees = subtotal + legalFeesTotal;
        
        const taxCalculation = calculateTax(subtotal); // 追加見積項目のみに課税
        const tax = taxCalculation.tax;
        const total = taxCalculation.total + legalFeesTotal; // 法定費用は税込なのでそのまま加算

        // サービス種類固有の情報を準備
        const estimateDataWithExtras: any = {
          items: estimateData,
          subtotal,
          tax,
          total,
          legalFees: isInspection && legalFees ? legalFees : undefined, // 法定費用を保存
          createdAt: new Date().toISOString(),
          // 故障診断固有情報
          faultDiagnosisInfo: isFaultDiagnosis ? {
            causeExplanation: causeExplanation.trim() || undefined,
            repairProposal: repairProposal.trim() || undefined,
            diagnosticToolResultUrl: diagnosticToolResult?.fileUrl || undefined,
            diagnosticToolResultFileId: diagnosticToolResult?.fileId || undefined,
          } : undefined,
          // 修理・整備固有情報
          repairInfo: isRepair ? {
            audioUrl: audioData?.audioUrl || undefined,
            partsList: partsList.map((part) => ({
              id: part.id,
              name: part.name,
              quantity: part.quantity,
              unitPrice: part.unitPrice,
              note: part.note,
              vendor: part.vendor,
              arrivalStatus: part.arrivalStatus,
              arrivalDate: part.arrivalDate,
              storageLocation: part.storageLocation,
            })),
          } : undefined,
          // 板金・塗装固有情報
          bodyPaintInfo: isBodyPaint && bodyPaintEstimateData ? {
            workDuration: bodyPaintEstimateData.workDuration,
            hasInsurance: bodyPaintHasInsurance,
            insuranceCompany: bodyPaintHasInsurance ? bodyPaintInsuranceCompany.trim() || undefined : undefined,
          } : undefined,
          // レストア固有情報
          restoreInfo: isRestore && restoreEstimateData ? {
            workDuration: restoreEstimateData.workDuration,
            changeHistory: restoreEstimateData.changeHistory.map((history: any) => ({
              changedAt: history.changedAt,
              description: history.description,
              previousTotal: history.previousTotal,
              newTotal: history.newTotal,
              reason: history.reason || undefined,
            })),
          } : undefined,
          // その他固有情報
          otherInfo: isOther && otherEstimateData ? {
            items: otherEstimateData.items,
            parts: otherEstimateData.parts || [],
            total: otherEstimateData.total,
          } : undefined,
        };

        // ワークオーダー更新をリトライ（作成直後は反映されていない可能性があるため）
        let updateResult;
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries) {
          updateResult = await updateWorkOrder(jobId, targetWorkOrder.id, {
            estimate: estimateDataWithExtras,
            baseSystemItemId: baseSystemItemId.trim() || undefined, // 基幹システム明細IDを保存
            status: "顧客承認待ち",
            // 診断料金情報も保存
            diagnosisFee: diagnosisFee !== null ? diagnosisFee : undefined,
            diagnosisDuration: diagnosisDuration !== null ? diagnosisDuration : undefined,
            isDiagnosisFeePreDetermined: isDiagnosisFeePreDetermined || undefined,
            // メカニック承認情報も保存
            mechanicApproved: mechanicApproved || undefined,
            mechanicApprover: mechanicApprover.trim() || undefined,
            mechanicApprovedAt: mechanicApproved && mechanicApprover.trim() ? new Date().toISOString() : undefined,
          });

          if (updateResult.success) {
            break;
          }

          // ワークオーダーが見つからない場合は、少し待ってから再試行
          if (updateResult.error?.code === "WORK_ORDER_NOT_FOUND" && retryCount < maxRetries - 1) {
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 200 * retryCount)); // 200ms, 400ms, 600ms
            // ワークオーダーリストを再取得
            await mutateWorkOrders();
            continue;
          }

          throw new Error(updateResult.error?.message || "見積の保存に失敗しました");
        }

        if (!updateResult || !updateResult.success) {
          throw new Error(updateResult?.error?.message || "見積の保存に失敗しました");
        }

        // ワークオーダーリストを再取得
        await mutateWorkOrders();

        // 部品調達待ちフラグの処理（複数作業の場合）
        if (isPartsProcurementWaiting && partsList.length > 0) {
          // PartsInfoを作成
          const partsInfo: PartsInfo = {
            parts: partsList.map((part): PartItem => {
              // PartsArrivalStatusをPartItemのstatusにマッピング
              let status: "not_ordered" | "ordered" | "shipping" | "arrived" = "not_ordered";
              if (part.arrivalStatus === "arrived") {
                status = "arrived";
              } else if (part.arrivalStatus === "ordered") {
                status = "ordered";
              } else if (part.arrivalStatus === "contacted") {
                status = "shipping";
              }

              return {
                id: part.id,
                name: part.name,
                partNumber: null, // PartsListItemにはpartNumberがないためnull
                quantity: part.quantity,
                unitPrice: part.unitPrice || null,
                supplier: part.vendor || null,
                orderDate: part.arrivalStatus === "arrived" ? new Date().toISOString() : null,
                expectedArrivalDate: part.arrivalDate || null,
                actualArrivalDate: part.arrivalStatus === "arrived" ? (part.arrivalDate || null) : null,
                status: status,
                storageLocation: part.storageLocation || null,
                vendor: part.vendor || null,
                arrivalStatus: undefined, // PartItemにはarrivalStatusがないためundefined
                arrivalDate: part.arrivalDate || null,
              };
            }),
            expectedArrivalDate: partsList.find((p) => p.arrivalDate)?.arrivalDate || null,
            procurementStatus: partsList.every((p) => p.arrivalStatus === "arrived") ? "arrived" :
              partsList.some((p) => p.arrivalStatus === "arrived") ? "shipping" :
                partsList.some((p) => p.arrivalStatus === "ordered" || p.arrivalStatus === "contacted") ? "ordered" : "not_ordered",
            lastUpdatedAt: new Date().toISOString(),
          };

          // field26にPartsInfoを保存（既存のjobMemosと統合）
          const { updateJobField26 } = await import("@/lib/api");
          const existingField26 = job?.field26 || "[]";
          let existingMemos: any[] = [];
          try {
            const parsed = JSON.parse(existingField26);
            if (Array.isArray(parsed)) {
              existingMemos = parsed;
            } else if (typeof parsed === "object" && parsed !== null && Array.isArray(parsed.jobMemos)) {
              existingMemos = parsed.jobMemos;
            }
          } catch (error) {
            // パースエラーは無視
          }

          // PartsInfoをJSON形式でfield26に保存（jobMemosと統合）
          const field26Data = {
            jobMemos: existingMemos,
            partsInfo: partsInfo,
          };

          await updateJobField26(jobId, JSON.stringify(field26Data));

          // ステータスを「部品調達待ち」に更新
          const statusResult = await updateJobStatus(jobId, "部品調達待ち");
          if (!statusResult.success) {
            throw new Error(statusResult.error?.message || "ステータスの更新に失敗しました");
          }
        }
      } else {
        // 単一作業の場合：既存のcreateEstimateを使用
        // 小計、消費税、合計を計算
        const subtotal = estimateData.reduce((sum, item) => sum + item.price, 0);
        const taxCalculation = calculateTax(subtotal);
        const tax = taxCalculation.tax;
        const total = taxCalculation.total;

        // サービス種類固有の情報を準備
        const estimateDataWithExtras: any = {
          items: estimateData,
          subtotal,
          tax,
          total,
          createdAt: new Date().toISOString(),
          // 故障診断固有情報
          faultDiagnosisInfo: isFaultDiagnosis ? {
            causeExplanation: causeExplanation.trim() || undefined,
            repairProposal: repairProposal.trim() || undefined,
            diagnosticToolResultUrl: diagnosticToolResult?.fileUrl || undefined,
            diagnosticToolResultFileId: diagnosticToolResult?.fileId || undefined,
          } : undefined,
          // 修理・整備固有情報
          repairInfo: isRepair ? {
            audioUrl: audioData?.audioUrl || undefined,
            partsList: partsList.map((part) => ({
              id: part.id,
              name: part.name,
              quantity: part.quantity,
              unitPrice: part.unitPrice,
              note: part.note,
              vendor: part.vendor,
              arrivalStatus: part.arrivalStatus,
              arrivalDate: part.arrivalDate,
              storageLocation: part.storageLocation,
            })),
          } : undefined,
          // 板金・塗装固有情報
          bodyPaintInfo: isBodyPaint && bodyPaintEstimateData ? {
            workDuration: bodyPaintEstimateData.workDuration,
            hasInsurance: bodyPaintHasInsurance,
            insuranceCompany: bodyPaintHasInsurance ? bodyPaintInsuranceCompany.trim() || undefined : undefined,
          } : undefined,
          // レストア固有情報
          restoreInfo: isRestore && restoreEstimateData ? {
            workDuration: restoreEstimateData.workDuration,
            changeHistory: restoreEstimateData.changeHistory.map((history: any) => ({
              changedAt: history.changedAt,
              description: history.description,
              previousTotal: history.previousTotal,
              newTotal: history.newTotal,
              reason: history.reason || undefined,
            })),
          } : undefined,
          // その他固有情報
          otherInfo: isOther && otherEstimateData ? {
            items: otherEstimateData.items,
            parts: otherEstimateData.parts || [],
            total: otherEstimateData.total,
          } : undefined,
        };

        // 後方互換性のため、workOrderIdはundefined（既にupdateWorkOrderで保存済み）
        const createResult = await createEstimate(jobId, undefined, estimateDataWithExtras.items);

        if (!createResult.success) {
          throw new Error(createResult.error?.message || "見積の作成に失敗しました");
        }

        // ワークオーダーのestimateフィールドを更新
        if (targetWorkOrder?.id) {
          try {
            await updateWorkOrder(jobId, targetWorkOrder.id, {
              estimate: {
                ...targetWorkOrder.estimate,
                items: estimateDataWithExtras.items,
                total: estimateDataWithExtras.items.reduce((sum: number, item: { price: number }) => sum + item.price, 0),
                createdAt: new Date().toISOString(),
              },
            });
            // ワークオーダーリストを再取得
            await mutateWorkOrders();
          } catch (error) {
            console.error("ワークオーダー更新エラー:", error);
            // エラーが発生しても見積作成処理は続行
            toast.warning("見積の作成は完了しましたが、ワークオーダーの更新に失敗しました");
          }
        }

        // 部品調達待ちフラグの処理
        if (isPartsProcurementWaiting && partsList.length > 0) {
          // PartsInfoを作成
          const partsInfo: PartsInfo = {
            parts: partsList.map((part): PartItem => {
              // PartsArrivalStatusをPartItemのstatusにマッピング
              let status: "not_ordered" | "ordered" | "shipping" | "arrived" = "not_ordered";
              if (part.arrivalStatus === "arrived") {
                status = "arrived";
              } else if (part.arrivalStatus === "ordered") {
                status = "ordered";
              } else if (part.arrivalStatus === "contacted") {
                status = "shipping";
              }

              return {
                id: part.id,
                name: part.name,
                partNumber: null, // PartsListItemにはpartNumberがないためnull
                quantity: part.quantity,
                unitPrice: part.unitPrice || null,
                supplier: part.vendor || null,
                orderDate: part.arrivalStatus === "arrived" ? new Date().toISOString() : null,
                expectedArrivalDate: part.arrivalDate || null,
                actualArrivalDate: part.arrivalStatus === "arrived" ? (part.arrivalDate || null) : null,
                status: status,
                storageLocation: part.storageLocation || null,
                vendor: part.vendor || null,
                arrivalStatus: undefined, // PartItemにはarrivalStatusがないためundefined
                arrivalDate: part.arrivalDate || null,
              };
            }),
            expectedArrivalDate: partsList.find((p) => p.arrivalDate)?.arrivalDate || null,
            procurementStatus: partsList.every((p) => p.arrivalStatus === "arrived") ? "arrived" :
              partsList.some((p) => p.arrivalStatus === "arrived") ? "shipping" :
                partsList.some((p) => p.arrivalStatus === "ordered" || p.arrivalStatus === "contacted") ? "ordered" : "not_ordered",
            lastUpdatedAt: new Date().toISOString(),
          };

          // field26にPartsInfoを保存（既存のjobMemosと統合）
          const { updateJobField26 } = await import("@/lib/api");
          const existingField26 = job?.field26 || "[]";
          let existingMemos: any[] = [];
          try {
            const parsed = JSON.parse(existingField26);
            if (Array.isArray(parsed)) {
              existingMemos = parsed;
            } else if (typeof parsed === "object" && parsed !== null && Array.isArray(parsed.jobMemos)) {
              existingMemos = parsed.jobMemos;
            }
          } catch (error) {
            // パースエラーは無視
          }

          // PartsInfoをJSON形式でfield26に保存（jobMemosと統合）
          const field26Data = {
            jobMemos: existingMemos,
            partsInfo: partsInfo,
          };

          await updateJobField26(jobId, JSON.stringify(field26Data));

          // ステータスを「部品調達待ち」に更新
          const statusResult = await updateJobStatus(jobId, "部品調達待ち");
          if (!statusResult.success) {
            throw new Error(statusResult.error?.message || "ステータスの更新に失敗しました");
          }
        } else {
          // ステータスを更新（見積作成待ち → 見積提示済み）
          // 見積提示日時をfield7に記録（長期化承認待ちの計算に使用）
          // ISO 8601形式で記録（パースしやすい形式）
          const estimateSentAt = new Date().toISOString();
          const estimateSentText = `【見積提示】${estimateSentAt}`;
          const currentField7 = job.field7 || "";
          const separator = currentField7 ? "\n\n" : "";
          const updatedField7 = `${currentField7}${separator}${estimateSentText}`;

          // field7を更新（見積提示日時を記録）
          const { updateJobField7 } = await import("@/lib/api");
          await updateJobField7(jobId, updatedField7);

          // ステータスを「見積提示済み」に更新
          const statusResult = await updateJobStatus(jobId, "見積提示済み");

          if (!statusResult.success) {
            throw new Error(statusResult.error?.message || "ステータスの更新に失敗しました");
          }
        }
      }

      // 通知送信（LINE + メール）
      try {
        // 顧客情報を取得（LINE User IDとメールアドレスを取得するため）
        const customerId = job.field4?.id;
        if (customerId) {
          // 顧客情報取得とマジックリンク生成を並列実行（パフォーマンス改善）
          const [customerResult, magicLinkResult] = await Promise.all([
            fetchCustomerById(customerId),
            generateMagicLink({
              jobId,
              workOrderId: targetWorkOrder?.id,
              expiresIn: 7 * 24 * 60 * 60, // 7日間
            }),
          ]);

          const customer = customerResult?.data;

          if (customer) {
            // LINE User IDとメールアドレスを取得
            const lineUserId = customer?.Business_Messaging_Line_Id || customer?.lineId;
            // TODO: Remove as any once type definition propagation is resolved.
            const customerEmail = (customer as any).Email || (customer as any).Secondary_Email;
            const customerName = job.field4?.name || "お客様";
            const vehicleName = job.field6?.name || "車両";
            const licensePlate = extractLicensePlate(job.field6?.name);
            const serviceKind = targetWorkOrder?.serviceKind || serviceKinds[0] || "作業";

            const magicLinkUrl = magicLinkResult.success && magicLinkResult.url ? magicLinkResult.url : null;

            // LINE通知送信とメール送信を並列実行（パフォーマンス改善）
            const notificationPromises: Promise<{ type: "line" | "email"; success: boolean }>[] = [];

            // LINE通知送信（LINE User IDがある場合）
            if (lineUserId && magicLinkUrl) {
              notificationPromises.push(
                sendLineNotification({
                  lineUserId,
                  type: "estimate_sent",
                  jobId,
                  data: {
                    customerName,
                    vehicleName,
                    licensePlate,
                    serviceKind,
                    magicLinkUrl,
                  },
                })
                  .then((result) => ({ type: "line" as const, success: result.success }))
                  .catch((error) => {
                    console.warn("LINE通知送信エラー:", error);
                    return { type: "line" as const, success: false };
                  })
              );
            }

            // メール送信（メールアドレスがある場合）
            if (customerEmail && magicLinkUrl) {
              notificationPromises.push(
                sendEstimateEmail({
                  customerId,
                  jobId,
                  workOrderId: selectedWorkOrder?.id,
                  estimateUrl: magicLinkUrl,
                })
                  .then((result) => ({ type: "email" as const, success: result.success }))
                  .catch((error) => {
                    console.warn("メール送信エラー:", error);
                    return { type: "email" as const, success: false };
                  })
              );
            }

            // 並列実行して結果を取得
            const notificationResults = await Promise.all(notificationPromises);
            const lineSent = notificationResults.find((r) => r.type === "line")?.success || false;
            const emailSent = notificationResults.find((r) => r.type === "email")?.success || false;

            // 送信結果を通知（トーストIDを設定して重複を防ぐ）
            if (lineSent && emailSent) {
              toast.success("見積もりを送信しました", {
                id: "estimate-sent",
                description: `${customerName}様へLINEとメールで送信しました`,
              });
            } else if (lineSent) {
              toast.success("見積もりを送信しました", {
                id: "estimate-sent",
                description: `${customerName}様へLINEで送信しました`,
              });
            } else if (emailSent) {
              toast.success("見積もりを送信しました", {
                id: "estimate-sent",
                description: `${customerName}様へメールで送信しました`,
              });
            } else {
              // どちらも送信できない場合
              if (!lineUserId && !customerEmail) {
                toast.success("見積もりを保存しました", {
                  id: "estimate-saved",
                  description: `${customerName}様のLINE IDとメールアドレスが登録されていないため、通知を送信できませんでした`,
                });
              } else if (!magicLinkUrl) {
                toast.warning("見積もりを保存しました", {
                  id: "estimate-saved-warning",
                  description: "マジックリンクの生成に失敗しましたが、見積もりは保存されています",
                });
              } else {
                toast.warning("見積もりを保存しました", {
                  id: "estimate-saved-warning",
                  description: "通知の送信に失敗しましたが、見積もりは保存されています",
                });
              }
            }
          } else {
            // 顧客情報取得失敗
            toast.success("見積もりを保存しました", {
              id: "estimate-saved",
              description: "顧客情報の取得に失敗したため、通知を送信できませんでした",
            });
          }
        } else {
          // 顧客IDがない場合
          toast.success("見積もりを保存しました", {
            id: "estimate-saved",
          });
        }
      } catch (notificationError) {
        // 通知エラーは見積保存の成功を妨げない
        console.error("通知送信エラー:", notificationError);
        const customerName = job.field4?.name || "お客様";
        toast.success("見積もりを保存しました", {
          description: "通知の送信に失敗しましたが、見積もりは保存されています",
        });
      }

      // トップページへ遷移
      router.push("/");
    } catch (error) {
      console.error("見積送信エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "見積の送信に失敗しました";
      toast.error("見積の送信に失敗しました", {
        description: errorMessage,
        action: {
          label: "再試行",
          onClick: () => {
            handleSendLine();
          },
        },
        duration: 10000, // リトライボタンを表示するため、表示時間を延長
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 合計金額を計算（診断料金の割引を含む）
   */
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const diagnosisFeeAmount = diagnosisFee || 0;

    // 作業項目がある場合、診断料金を割引
    const hasWorkItems = estimateItems.length > 0;
    const total = hasWorkItems ? subtotal - diagnosisFeeAmount : subtotal;

    return Math.max(0, total); // 負の値にならないように
  };

  /**
   * 小計を計算（診断料金割引前）
   */
  const calculateSubtotal = () => {
    return estimateItems.reduce((sum, item) => {
      const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
      const laborTotal = item.laborCost || 0;
      return sum + partTotal + laborTotal;
    }, 0);
  };

  /**
   * 全部品到着時の連絡送信ハンドラ
   */
  const handleSendPartsArrivalContact = async (method: ContactMethod, message: string) => {
    if (!job || !job.field4?.id) {
      toast.error("顧客情報が見つかりません");
      return;
    }

    try {
      // 顧客情報を取得
      const customerResult = await fetchCustomerById(job.field4.id);
      if (!customerResult.success || !customerResult.data) {
        toast.error("顧客情報の取得に失敗しました");
        return;
      }

      const customer = customerResult.data;

      if (method === "line") {
        // LINE通知を送信
        if (!customer.Business_Messaging_Line_Id) {
          toast.error("LINE IDが登録されていません");
          return;
        }

        // サービス種類を取得
        const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
        const serviceKind = serviceKinds.length > 0 ? serviceKinds[0] : "その他";

        await sendLineNotification({
          lineUserId: customer.Business_Messaging_Line_Id,
          type: "parts_arrived",
          jobId: job.id,
          data: {
            customerName: customerName,
            vehicleName: vehicleName,
            licensePlate: licensePlate,
            serviceKind,
            message, // カスタムメッセージを使用
            partsList: arrivedParts.map((p) => ({
              name: p.name,
              quantity: p.quantity,
            })),
          },
        });

        toast.success("LINE通知を送信しました", {
          description: `${customerName}様へ送信しました`,
        });
      }

      // 部品到着通知送信後、ワークオーダーのpartsListを更新
      const repairInfo = selectedWorkOrder?.estimate?.repairInfo as { partsList?: PartsListItem[] } | undefined;
      if (selectedWorkOrder?.id && repairInfo?.partsList) {
        try {
          const partsList = repairInfo.partsList;
          const updatedPartsList = partsList.map((part) => {
            // 到着した部品（arrivedPartsに含まれる）のarrivalStatusを「contacted」に更新
            const isArrived = arrivedParts.some((arrivedPart) => arrivedPart.id === part.id);
            if (isArrived && part.arrivalStatus === "arrived" || part.arrivalStatus === "stored") {
              return {
                ...part,
                arrivalStatus: "contacted" as const,
                arrivalDate: part.arrivalDate || new Date().toISOString(),
              };
            }
            return part;
          });

          await updateWorkOrder(jobId, selectedWorkOrder.id, {
            estimate: {
              ...selectedWorkOrder.estimate,
              repairInfo: {
                ...repairInfo,
                partsList: updatedPartsList,
              },
            },
          });
          // ワークオーダーリストを再取得
          await mutateWorkOrders();
          // ローカルのpartsListも更新
          setPartsList((prev) =>
            prev.map((part) => {
              const isArrived = arrivedParts.some((arrivedPart) => arrivedPart.id === part.id);
              if (isArrived && (part.arrivalStatus === "arrived" || part.arrivalStatus === "stored")) {
                return {
                  ...part,
                  arrivalStatus: "contacted" as const,
                  arrivalDate: part.arrivalDate || new Date().toISOString(),
                };
              }
              return part;
            })
          );
        } catch (error) {
          console.error("部品情報の更新エラー:", error);
          // エラーが発生しても通知送信処理は続行
          toast.warning("連絡の送信は完了しましたが、部品情報の更新に失敗しました");
        }
      }

      if (method === "email") {
        // メール送信（将来実装）
        toast.info("メール送信機能は今後実装予定です", {
          description: "メッセージ内容をコピーしてメール送信してください",
        });
      } else if (method === "phone") {
        // 電話連絡（手動）
        toast.info("電話連絡は手動でお願いします", {
          description: "メッセージ内容を参考に電話連絡してください",
        });
      }
    } catch (error) {
      console.error("連絡送信エラー:", error);
      const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました";
      toast.error("連絡の送信に失敗しました", {
        description: errorMessage,
        action: {
          label: "再試行",
          onClick: () => {
            // ダイアログを再度開く（ユーザーが再試行できるように）
            setIsPartsArrivalDialogOpen(true);
          },
        },
        duration: 10000, // リトライボタンを表示するため、表示時間を延長
      });
      throw error;
    }
  };

  // 到着した部品リストを取得
  const arrivedParts = useMemo(() => {
    return partsList.filter(
      (part) => part.arrivalStatus === "arrived" || part.arrivalStatus === "stored"
    );
  }, [partsList]);

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
      <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-auto">
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
    .reduce((sum, i) => {
      const partTotal = (i.partQuantity || 0) * (i.partUnitPrice || 0);
      const laborTotal = i.laborCost || 0;
      return sum + partTotal + laborTotal;
    }, 0);
  const recommendedTotal = estimateItems
    .filter((i) => i.priority === "recommended")
    .reduce((sum, i) => {
      const partTotal = (i.partQuantity || 0) * (i.partUnitPrice || 0);
      const laborTotal = i.laborCost || 0;
      return sum + partTotal + laborTotal;
    }, 0);
  const optionalTotal = estimateItems
    .filter((i) => i.priority === "optional")
    .reduce((sum, i) => {
      const partTotal = (i.partQuantity || 0) * (i.partUnitPrice || 0);
      const laborTotal = i.laborCost || 0;
      return sum + partTotal + laborTotal;
    }, 0);

  // 全体合計（税抜）
  const grandSubtotal = requiredTotal + recommendedTotal + optionalTotal;
  // 消費税計算
  const grandTaxCalculation = calculateTax(grandSubtotal);
  // 全体合計（税込/税抜に応じて切り替え）
  const grandTotal = isTaxIncluded ? grandTaxCalculation.total : grandSubtotal;

  const selectedPhoto = photos.find((p: DiagnosisPhoto) => p.id === selectedPhotoId);

  // 車検の場合は「追加見積」、それ以外は「見積作成」
  const estimateTitle = isInspection ? "追加見積" : "見積作成";

  // 現在の作業名を取得（選択中のワークオーダーから、またはserviceKindsから）
  const currentWorkOrderName = selectedWorkOrder?.serviceKind || (serviceKinds.length > 0 ? serviceKinds[0] : "見積");

  /**
   * ワークオーダー選択変更ハンドラ
   */
  const handleWorkOrderSelect = (woId: string | null) => {
    if (!woId) return;
    // URLパラメータを更新してワークオーダーを切り替え
    const url = new URL(window.location.href);
    url.searchParams.set("workOrderId", woId);
    router.push(url.pathname + url.search);
  };

  /**
   * 作業追加成功時のハンドラ
   */
  const handleAddWorkOrderSuccess = () => {
    mutateWorkOrders();
    mutateJob();
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 overflow-auto">
      {/* ヘッダー */}
      <AppHeader
        maxWidthClassName={isInspection ? "max-w-4xl" : "max-w-7xl"}
        backHref={getBackHref(jobId)}
        collapsibleOnMobile={true}
        collapsedCustomerName={customerName}
        collapsedVehicleName={vehicleName}
        collapsedLicensePlate={licensePlate}
        statusBadge={
          job ? (
            <Badge
              variant="outline"
              className={cn(
                "text-base font-medium px-2.5 py-0.5 rounded-full shrink-0",
                getStatusBadgeStyle(job.field5)
              )}
            >
              {job.field5}
            </Badge>
          ) : undefined
        }
      >
        {/* ページタイトル */}
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-slate-700 shrink-0" />
            {estimateTitle}
          </h1>
        </div>

        {/* 案件情報（JobCardの情報階層に基づく） */}
        <CompactJobHeader
          job={job}
          customerName={customerName}
          vehicleName={vehicleName}
          licensePlate={licensePlate}
          tagId={tagId !== "---" ? tagId : undefined}
          serviceKind={serviceKinds.length > 0 ? serviceKinds[0] : undefined}
          currentWorkOrderName={currentWorkOrderName}
          courtesyCars={courtesyCars}
        />

      </AppHeader>

      {/* メインコンテンツ - 2カラムレイアウト */}
      <main className={cn("mx-auto px-4 py-6 pb-32", isInspection ? "max-w-4xl" : "max-w-7xl")} style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
        {/* 見積却下理由の表示（field7に「【見積却下】」が含まれている場合のみ） */}
        {(() => {
          if (!job?.field7) return null;
          const lines = job.field7.split('\n');
          const rejectionLines = lines.filter(line => line.includes("【見積却下】"));
          if (rejectionLines.length === 0) return null;
          const rejectionDetails = rejectionLines.join('\n');
          return (
            <div className="mb-4 bg-red-50 border border-red-400 rounded-md p-3 text-base">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-red-600 shrink-0" />
                <p className="font-medium text-red-900">見積却下理由</p>
              </div>
              <p className="text-red-900 whitespace-pre-wrap break-words">{rejectionDetails}</p>
            </div>
          );
        })()}

        {/* 車検の場合は1カラム、それ以外は2カラム */}
        <div className={cn("gap-4", isInspection ? "flex flex-col" : "grid grid-cols-1 lg:grid-cols-2")}>
          {/* ========== 左カラム: 診断結果ビュー（車検以外）または受入検査写真（車検の場合） ========== */}
          <div className="space-y-4">
            {/* 診断メディアセクション（写真・動画） */}
            <CollapsibleSection
                title={isInspection ? "受入検査写真" : "診断メディア"}
                icon={Camera}
                defaultOpen={true}
                badge={`${photos.length}枚 ${videos.length > 0 ? `/ ${videos.length}本` : ''}`}
              >
                {/* 写真 */}
                {photos.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900 mb-2">写真 ({photos.length}枚)</h3>
                    {(() => {
                      // デバッグ: photosの内容を確認
                      const validPhotos = photos
                        .filter((photo) => photo.url && photo.url.trim() !== ""); // URLが空でないもののみフィルタリング
                      
                      if (isInspection && validPhotos.length === 0 && photos.length > 0) {
                        console.warn("[Estimate] photosにURLが空の項目があります:", photos);
                      }
                      
                      const photoItems = validPhotos.map((photo) => ({
                        id: photo.id,
                        previewUrl: photo.url,
                        position: photo.position,
                      }));
                      
                      if (isInspection && photoItems.length > 0) {
                        console.log("[Estimate] PhotoManagerに渡すphotos:", photoItems);
                      }
                      
                      return (
                        <PhotoManager
                          photos={photoItems}
                          onPhotosChange={async (updatedPhotos) => {
                        // PhotoItem[]をDiagnosisPhoto[]に変換
                        const updatedDiagnosisPhotos: DiagnosisPhoto[] = updatedPhotos.map((p, index) => {
                          // 既存のDiagnosisPhotoを探す
                          const existing = photos.find(
                            (dp) => dp.id === p.id || dp.url === p.previewUrl
                          );
                          return existing || {
                            id: p.id,
                            position: p.position || p.id,
                            label: p.position || p.id,
                            url: p.previewUrl,
                          };
                        });
                        setPhotos(updatedDiagnosisPhotos);

                        // ワークオーダーの診断写真を即座に更新
                        if (selectedWorkOrder?.id) {
                          try {
                            await updateWorkOrder(jobId, selectedWorkOrder.id, {
                              diagnosis: {
                                ...selectedWorkOrder.diagnosis,
                                photos: updatedPhotos.map((p) => ({
                                  position: p.position || p.id,
                                  url: p.previewUrl || "",
                                })),
                              },
                            });
                            // ワークオーダーリストを再取得
                            await mutateWorkOrders();
                          } catch (error) {
                            console.error("診断写真の更新エラー:", error);
                            toast.error("診断写真の更新に失敗しました");
                          }
                        }
                          }}
                          disabled={isSubmitting}
                          className="grid grid-cols-3 gap-2"
                        />
                      );
                    })()}

                    {selectedPhoto && (
                      <div className="mt-4 p-2 bg-slate-50 rounded-lg">
                        <div className="relative w-full aspect-video rounded-md overflow-hidden">
                          <Image
                            src={selectedPhoto.url}
                            alt={selectedPhoto.label}
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 768px"
                          />
                        </div>
                        <p className="text-base text-center mt-2 text-slate-800 truncate" title={selectedPhoto.label}>
                          {selectedPhoto.label}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 動画 */}
                {videos.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">動画 ({videos.length}本)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {videos.map((video) => (
                        <div
                          key={video.id}
                          className="relative aspect-video rounded-md overflow-hidden bg-slate-900 border border-slate-300 group hover:border-slate-400 transition-colors cursor-pointer"
                          onClick={() => window.open(video.url, "_blank")}
                        >
                          <video
                            src={video.url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 group-hover:bg-white transition-colors">
                              <Video className="h-6 w-6 text-slate-900" />
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-sm text-white truncate" title={video.label}>
                              {video.label}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {photos.length === 0 && videos.length === 0 && (
                  <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-300 rounded text-slate-700 text-base">
                    診断メディアがありません
                  </div>
                )}
              </CollapsibleSection>

            {/* オプションメニューセレクター（12ヵ月点検の場合のみ） */}
            {is12MonthInspection && (
              <OptionMenuSelector
                optionMenus={optionMenus}
                selectedMenuIds={selectedOptionMenuIds}
                onMenuSelectionChange={handleOptionMenuSelectionChange}
                simultaneousService={hasShakenSimultaneously ? "車検" : "12ヶ月点検"}
                disabled={isSubmitting}
              />
            )}

            {/* 故障診断用ビュー（故障診断の場合のみ） */}
            {isFaultDiagnosis && (
              <FaultDiagnosisEstimateView
                causeExplanation={causeExplanation}
                onCauseExplanationChange={setCauseExplanation}
                repairProposal={repairProposal}
                onRepairProposalChange={setRepairProposal}
                diagnosticToolResult={diagnosticToolResult}
                onViewDiagnosticResult={() => {
                  if (diagnosticToolResult?.fileUrl) {
                    window.open(diagnosticToolResult.fileUrl, "_blank");
                  }
                }}
                onDownloadDiagnosticResult={() => {
                  if (diagnosticToolResult?.fileUrl) {
                    const link = document.createElement("a");
                    link.href = diagnosticToolResult.fileUrl;
                    link.download = diagnosticToolResult.fileName || "診断機結果.pdf";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                disabled={isSubmitting}
              />
            )}

            {/* 板金・塗装用ビュー（板金・塗装の場合のみ） */}
            {isBodyPaint && (
              <BodyPaintEstimateView
                vendorEstimate={
                  (() => {
                    const jobWithDiagnosisData = job as ZohoJob & {
                      diagnosisData?: {
                        vendorEstimate?: VendorEstimate;
                      };
                    };
                    return jobWithDiagnosisData?.diagnosisData?.vendorEstimate || null;
                  })()
                }
                estimateData={bodyPaintEstimateData}
                onEstimateDataChange={setBodyPaintEstimateData}
                hasInsurance={bodyPaintHasInsurance}
                onHasInsuranceChange={setBodyPaintHasInsurance}
                insuranceCompany={bodyPaintInsuranceCompany}
                onInsuranceCompanyChange={setBodyPaintInsuranceCompany}
                disabled={isSubmitting}
              />
            )}

            {/* レストア用ビュー（レストアの場合のみ） */}
            {isRestore && (
              <RestoreEstimateView
                estimateData={restoreEstimateData}
                onEstimateDataChange={setRestoreEstimateData}
                disabled={isSubmitting}
              />
            )}

            {/* その他用ビュー（その他の場合のみ） */}
            {isOther && (
              <OtherServiceEstimateView
                estimateData={otherEstimateData}
                onEstimateDataChange={setOtherEstimateData}
                disabled={isSubmitting}
              />
            )}

            {/* 修理・整備用ビュー（修理・整備の場合のみ） */}
            {isRepair && (
              <div className="space-y-4">
                {/* 部品リスト */}
                <PartsListInput
                  parts={partsList}
                  onAdd={(part) => {
                    const newPart: PartsListItem = {
                      ...part,
                      id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    };
                    setPartsList((prev) => [...prev, newPart]);
                  }}
                  onUpdate={(id, updates) => {
                    setPartsList((prev) =>
                      prev.map((part) =>
                        part.id === id ? { ...part, ...updates } : part
                      )
                    );
                  }}
                  onDelete={(id) => {
                    setPartsList((prev) => prev.filter((part) => part.id !== id));
                  }}
                  disabled={isSubmitting}
                />

                {/* 部品調達待ちフラグ */}
                {partsList.length > 0 && (
                  <div className="flex items-center gap-2 p-3 border border-slate-200 rounded-md bg-slate-50">
                    <Checkbox
                      id="parts-procurement-waiting"
                      checked={isPartsProcurementWaiting}
                      onCheckedChange={(checked) => setIsPartsProcurementWaiting(checked === true)}
                      disabled={isSubmitting}
                      className="h-5 w-5"
                    />
                    <label
                      htmlFor="parts-procurement-waiting"
                      className="flex items-center gap-2 text-base font-medium text-slate-900 cursor-pointer"
                    >
                      <Package className="h-5 w-5 text-amber-600 shrink-0" />
                      部品調達待ちとしてマーク（部品到着後に作業を開始）
                    </label>
                  </div>
                )}

                {/* 音声入力 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                      <Mic className="h-5 w-5 shrink-0" />
                      音声入力
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AudioInputButton
                      position="estimate"
                      label="見積内容の音声入力"
                      audioData={audioData}
                      onStopRecording={async (position: string, audioBlob: Blob) => {
                        const audioUrl = URL.createObjectURL(audioBlob);
                        setAudioData({
                          position,
                          file: audioBlob,
                          audioUrl,
                          isProcessing: false,
                        });
                        toast.success("音声を録音しました");
                      }}
                      disabled={isSubmitting}
                    />
                    {audioData?.audioUrl && (
                      <div className="mt-3 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-base text-slate-800">録音済み</span>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setAudioData(undefined);
                            toast.success("音声を削除しました");
                          }}
                          disabled={isSubmitting}
                        >
                          削除
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 診断情報セクション（車検以外の場合のみ） */}
            {!isInspection && (
              <CollapsibleSection
                title="診断結果"
                icon={Car}
                defaultOpen={true}
                badge={jobId ? `Job ID: ${jobId}` : undefined}
              >
                <div className="text-base text-slate-800">
                  <p className="truncate">{vehicleName} / {licensePlate}</p>
                  {job.field10 && (
                    <p className="mt-1">走行距離: {job.field10.toLocaleString()} km</p>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* 指摘項目セクション（折りたたみ可能） */}
            <CollapsibleSection
              title="指摘項目"
              icon={AlertCircle}
              defaultOpen={true}
              badge={flaggedItems.filter((i: DiagnosisCheckItem) => i.status === "red").length > 0
                ? `${flaggedItems.filter((i: DiagnosisCheckItem) => i.status === "red").length}件 要交換`
                : undefined}
            >
              <div className="space-y-2">
                {flaggedItems.map((item: DiagnosisCheckItem) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      item.status === "red"
                        ? "bg-red-50 border-red-300"
                        : "bg-amber-50 border-amber-300" // yellow → amber (40歳以上ユーザー向け、統一)
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {item.status === "red" ? (
                        <XCircle className="h-5 w-5 text-red-700 shrink-0" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-amber-900 shrink-0" />
                      )}
                      {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                      <span className={cn(
                        "font-medium truncate flex-1 min-w-0",
                        item.status === "red" ? "text-red-800" : "text-amber-900" // text-yellow-800 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
                      )}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <Badge variant="outline" className="text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                        {item.category}
                      </Badge>
                    </div>
                    {item.comment && (
                      <p className={cn(
                        "text-base mt-1 ml-6 truncate",
                        item.status === "red" ? "text-red-700" : "text-amber-900" // text-yellow-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
                      )}
                        title={item.comment}
                      >
                        {item.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </div>

          {/* ========== 見積エディタ（車検は単独、それ以外は右カラム） ========== */}
          <div className="space-y-4">
            {/* 診断写真・動画セクション（見積項目に紐付けられたメディア） */}
            {(linkedPhotos.length > 0 || linkedVideos.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Camera className="h-5 w-5 shrink-0" />
                    診断写真・動画
                    <Badge variant="secondary" className="text-base font-medium px-2.5 py-0.5 rounded-full">
                      {linkedPhotos.length + linkedVideos.length}件
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 写真 */}
                    {linkedPhotos.map(({ itemName, photo }, index) => (
                      <div
                        key={`photo-${photo.id}-${index}`}
                        className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="relative aspect-video bg-slate-100">
                          <Image
                            src={photo.url}
                            alt={itemName}
                            fill
                            className="object-cover"
                            onClick={() => {
                              if (photo.url) {
                                window.open(photo.url, "_blank");
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Camera className="h-4 w-4 text-slate-600" />
                            <p className="text-sm font-medium text-slate-900 line-clamp-2">
                              {itemName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* 動画 */}
                    {linkedVideos.map(({ itemName, video }, index) => (
                      <div
                        key={`video-${video.id}-${index}`}
                        className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow"
                      >
                        <div className="relative aspect-video bg-slate-900">
                          <video
                            src={video.url}
                            controls
                            className="w-full h-full object-cover"
                            preload="metadata"
                          />
                        </div>
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Video className="h-4 w-4 text-slate-600" />
                            <p className="text-sm font-medium text-slate-900 line-clamp-2">
                              {itemName}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 見積内容カード */}
            <Card>
              <CardHeader className="pb-3 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Calculator className="h-5 w-5 shrink-0" />
                    見積内容
                    {isEngineOilChange && (
                      <Badge variant="outline" className="text-base font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                        基本不要（イレギュラー時のみ追加）
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    {job?.field4?.id && (
                      <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsHistoricalEstimateDialogOpen(true)}
                        className="flex items-center gap-2 shrink-0"
                        disabled={isSubmitting}
                      >
                        <History className="h-5 w-5 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                        <span className="hidden sm:inline">過去の見積を参照</span>
                        <span className="sm:hidden">過去見積</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsHistoricalJobDialogOpen(true)}
                        className="flex items-center gap-2 shrink-0"
                        disabled={isSubmitting}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">過去の案件を参照</span>
                        <span className="sm:hidden">過去案件</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEstimateTemplateDialogOpen(true)}
                        className="flex items-center gap-2 shrink-0"
                        disabled={isSubmitting}
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">テンプレート</span>
                        <span className="sm:hidden">テンプレ</span>
                      </Button>
                      <div className="hidden sm:block h-5 w-px bg-slate-300" />
                      </>
                    )}
                    {/* 税込/税抜トグル（一番右側に配置） */}
                    <button
                      type="button"
                      onClick={() => setIsTaxIncluded(!isTaxIncluded)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                      aria-label={isTaxIncluded ? "税抜表示に切り替え" : "税込表示に切り替え"}
                    >
                      <div className={cn(
                        "relative w-10 h-5 rounded-full transition-colors",
                        isTaxIncluded ? "bg-blue-600" : "bg-slate-300"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                          isTaxIncluded ? "translate-x-5" : "translate-x-0.5"
                        )} />
                      </div>
                      <span className="text-sm font-medium">{isTaxIncluded ? "税込" : "税抜"}</span>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEngineOilChange && estimateItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-700">
                    <p className="text-base mb-4">
                      エンジンオイル交換は基本作業のみのため、見積項目は通常不要です。
                    </p>
                    <p className="text-base text-slate-700 mb-4">
                      イレギュラーな部品交換が必要な場合のみ、下記の「項目を追加」ボタンから追加してください。
                    </p>
                    <div className="space-y-6 mt-6">
                      <EstimateSection
                        title="必須整備"
                        priority="required"
                        items={estimateItems}
                        photos={photos}
                        videos={videos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("required")}
                        badgeVariant="default"
                        disabled={isSubmitting}
                        isTaxIncluded={isTaxIncluded}
                        onPhotoClick={handleEstimateLinePhotoClick}
                      />
                      <Separator />
                      <EstimateSection
                        title="推奨整備"
                        priority="recommended"
                        items={estimateItems}
                        photos={photos}
                        videos={videos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("recommended")}
                        badgeVariant="secondary"
                        disabled={isSubmitting}
                        isTaxIncluded={isTaxIncluded}
                        onPhotoClick={handleEstimateLinePhotoClick}
                      />
                      <Separator />
                      <EstimateSection
                        title="任意整備"
                        priority="optional"
                        items={estimateItems}
                        photos={photos}
                        videos={videos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("optional")}
                        badgeVariant="outline"
                        disabled={isSubmitting}
                        isTaxIncluded={isTaxIncluded}
                        onPhotoClick={handleEstimateLinePhotoClick}
                      />
                    </div>
                  </div>
                ) : (
                  /* 車検の場合はスクロールなしで全表示、それ以外はScrollArea */
                  isInspection ? (
                    <div className="space-y-6">
                      <EstimateSection
                        title="必須整備"
                        priority="required"
                        items={estimateItems}
                        photos={photos}
                        videos={videos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("required")}
                        badgeVariant="default"
                        disabled={isSubmitting}
                        isTaxIncluded={isTaxIncluded}
                        onPhotoClick={handleEstimateLinePhotoClick}
                      />

                      <Separator />

                      <EstimateSection
                        title="推奨整備"
                        priority="recommended"
                        items={estimateItems}
                        photos={photos}
                        videos={videos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("recommended")}
                        badgeVariant="secondary"
                        disabled={isSubmitting}
                        isTaxIncluded={isTaxIncluded}
                        onPhotoClick={handleEstimateLinePhotoClick}
                      />

                      <Separator />

                      <EstimateSection
                        title="任意整備"
                        priority="optional"
                        items={estimateItems}
                        photos={photos}
                        videos={videos}
                        onUpdate={handleUpdateItem}
                        onDelete={handleDeleteItem}
                        onAdd={() => handleAddItem("optional")}
                        badgeVariant="outline"
                        disabled={isSubmitting}
                        isTaxIncluded={isTaxIncluded}
                        onPhotoClick={handleEstimateLinePhotoClick}
                      />
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-6">
                        <EstimateSection
                          title="必須整備"
                          priority="required"
                          items={estimateItems}
                          photos={photos}
                          videos={videos}
                          onUpdate={handleUpdateItem}
                          onDelete={handleDeleteItem}
                          onAdd={() => handleAddItem("required")}
                          badgeVariant="default"
                          disabled={isSubmitting}
                          isTaxIncluded={isTaxIncluded}
                          onPhotoClick={handleEstimateLinePhotoClick}
                        />

                        <Separator />

                        <EstimateSection
                          title="推奨整備"
                          priority="recommended"
                          items={estimateItems}
                          photos={photos}
                          videos={videos}
                          onUpdate={handleUpdateItem}
                          onDelete={handleDeleteItem}
                          onAdd={() => handleAddItem("recommended")}
                          badgeVariant="secondary"
                          disabled={isSubmitting}
                          isTaxIncluded={isTaxIncluded}
                          onPhotoClick={handleEstimateLinePhotoClick}
                        />

                        <Separator />

                        <EstimateSection
                          title="任意整備"
                          priority="optional"
                          items={estimateItems}
                          photos={photos}
                          videos={videos}
                          onUpdate={handleUpdateItem}
                          onDelete={handleDeleteItem}
                          onAdd={() => handleAddItem("optional")}
                          badgeVariant="outline"
                          disabled={isSubmitting}
                          isTaxIncluded={isTaxIncluded}
                          onPhotoClick={handleEstimateLinePhotoClick}
                        />
                      </div>
                    </ScrollArea>
                  )
                )}
              </CardContent>
            </Card>

            {/* 見積変更履歴セクション */}
            <EstimateChangeHistorySection
              jobId={jobId}
              customerName={customerName}
              currentEstimateItems={estimateItems.map((item) => {
                const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
                const laborTotal = item.laborCost || 0;
                const totalPrice = partTotal + laborTotal;
                return {
                  id: item.id,
                  name: item.name,
                  price: totalPrice,
                  priority: item.priority,
                  selected: false,
                  linkedPhotoUrls: [],
                  linkedVideoUrl: null,
                  note: null,
                };
              })}
              disabled={isSubmitting}
              onEstimateChange={async (newEstimateItems) => {
                // 見積項目を更新（EstimateItem[] → EstimateLineItem[]に変換）
                const updatedLineItems: EstimateLineItem[] = newEstimateItems.map((item) => ({
                  id: item.id,
                  name: item.name,
                  partQuantity: 0,
                  partUnitPrice: 0,
                  laborCost: item.price || 0, // EstimateItemのpriceをlaborCostとして設定
                  priority: item.priority,
                  linkedPhotoId: null,
                  linkedVideoId: item.linkedVideoUrl || null,
                  transcription: null,
                }));
                setEstimateItems(updatedLineItems);

                // ワークオーダーのestimate.itemsも更新
                if (selectedWorkOrder?.id) {
                  try {
                    await updateWorkOrder(jobId, selectedWorkOrder.id, {
                      estimate: {
                        ...selectedWorkOrder.estimate,
                        items: newEstimateItems,
                      },
                    });
                    // ワークオーダーリストを再取得
                    await mutateWorkOrders();
                  } catch (error) {
                    console.error("ワークオーダー更新エラー:", error);
                    toast.error("ワークオーダーの更新に失敗しました");
                  }
                }
              }}
            />

            {/* 診断料金セクション（車検以外の場合のみ） */}
            {!isInspection && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <Calculator className="h-5 w-5 shrink-0" />
                    診断料金
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 診断時間（概算） */}
                  {diagnosisDuration !== null && (
                    <div className="space-y-1">
                      <Label className="text-base text-slate-700">診断時間（概算）</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={diagnosisDuration || ""}
                          onChange={(e) => {
                            const cleaned = cleanNumericInput(e.target.value);
                            const parsed = parseNumericValue(cleaned);
                            setDiagnosisDuration(parsed ? Math.floor(parsed) : null);
                          }}
                          placeholder="分"
                          className="w-24 h-12"
                          disabled={isSubmitting}
                        />
                        <span className="text-base text-slate-800">分</span>
                      </div>
                    </div>
                  )}

                  {/* 診断料金選択 */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">診断料金</Label>
                    <Select
                      value={diagnosisFee?.toString() || "0"}
                      onValueChange={(value) => {
                        const fee = value === "custom" ? null : parseInt(value);
                        setDiagnosisFee(fee);
                      }}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="診断料金を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">無料</SelectItem>
                        <SelectItem value="3000">¥3,000</SelectItem>
                        <SelectItem value="5000">¥5,000</SelectItem>
                        <SelectItem value="10000">¥10,000</SelectItem>
                        <SelectItem value="custom">その他（手動入力）</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* その他の場合の手動入力 */}
                    {diagnosisFee === null && (
                      <Input
                        type="text"
                        inputMode="numeric"
                        value=""
                        onChange={(e) => {
                          const cleaned = cleanNumericInput(e.target.value);
                          const parsed = parseNumericValue(cleaned);
                          setDiagnosisFee(parsed ? Math.floor(parsed) : null);
                        }}
                        placeholder="金額を入力（円）"
                        className="h-12"
                        disabled={isSubmitting}
                      />
                    )}

                    {/* 事前に決まっている場合の表示 */}
                    {isDiagnosisFeePreDetermined && (
                      <div className="flex items-center gap-2 text-base text-amber-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>事前に決まっている診断料金（顧客承認済み）</span>
                      </div>
                    )}

                    {/* 作業実施時の割引表示 */}
                    {estimateItems.length > 0 && diagnosisFee && diagnosisFee > 0 && (
                      <div className="flex items-center gap-2 text-base text-blue-700 bg-blue-50 p-2 rounded-md">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>作業実施のため割引対象（合計金額から自動で差し引きます）</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 合計金額（車検以外の場合のみ） */}
            {!isInspection && (
              <Card>
                <CardContent className="py-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-base">
                      <span className="text-slate-700">必須整備</span>
                      <span>¥{formatPrice(requiredTotal)}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-slate-700">推奨整備</span>
                      <span>¥{formatPrice(recommendedTotal)}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-slate-700">任意整備</span>
                      <span>¥{formatPrice(optionalTotal)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base">
                      <span className="text-slate-700">小計</span>
                      <span>¥{formatPrice(calculateSubtotal())}</span>
                    </div>
                    {estimateItems.length > 0 && diagnosisFee && diagnosisFee > 0 && (
                      <div className="flex justify-between text-base text-blue-700">
                        <span>診断料割引</span>
                        <span>-¥{formatPrice(diagnosisFee)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>合計（税込）</span>
                      <span className="text-primary">¥{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 基幹システム連携セクション（車検以外の場合のみ） */}
            {!isInspection && (
              <Card className="mb-4 border-amber-300 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-amber-900">
                    <Calculator className="h-5 w-5 shrink-0" />
                    基幹システム連携
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-base text-amber-900">
                    <p className="mb-2 font-medium">手順：</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>基幹システムで見積を計算・作成</li>
                      <li>計算結果をWebアプリに転記（下記ボタンから）</li>
                      <li>転記後、必要に応じて項目を追加・修正</li>
                      <li>基幹システム明細IDを入力（オプション）</li>
                      <li>LINEで顧客へ送信</li>
                    </ol>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base border-amber-400 bg-white hover:bg-amber-100 text-amber-900"
                    onClick={() => setIsBaseSystemCopyDialogOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Calculator className="h-4 w-4 mr-2 shrink-0" />
                    基幹システムで見積作成
                  </Button>
                  <p className="text-base text-amber-900 mt-2">
                    ※ 基幹システムで計算後、結果をこの画面に転記してください
                  </p>

                  {/* 基幹システム明細ID入力（各ワークオーダーごと） */}
                  {selectedWorkOrder && (
                    <div className="pt-3 border-t border-amber-400">
                      <Label htmlFor="base-system-item-id" className="text-base text-amber-900">
                        基幹システム明細ID（この作業用）
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="base-system-item-id"
                          value={baseSystemItemId}
                          onChange={(e) => setBaseSystemItemId(e.target.value)}
                          placeholder="例: ITEM-2024-001"
                          className="flex-1 bg-white"
                          disabled={isSubmitting}
                        />
                        <Button
                          onClick={async () => {
                            if (!selectedWorkOrder?.id) return;
                            try {
                              const result = await updateWorkOrder(jobId, selectedWorkOrder.id, {
                                baseSystemItemId: baseSystemItemId.trim() || undefined,
                              });
                              if (result.success) {
                                await mutateWorkOrders();
                                toast.success("基幹システム明細IDを保存しました");
                              } else {
                                toast.error("保存に失敗しました", {
                                  description: result.error?.message,
                                });
                              }
                            } catch (error) {
                              console.error("基幹システム明細ID保存エラー:", error);
                              toast.error("保存に失敗しました");
                            }
                          }}
                          variant="outline"
                          disabled={!selectedWorkOrder?.id || isSubmitting}
                          className="shrink-0 bg-white"
                        >
                          保存
                        </Button>
                      </div>
                      <p className="text-base text-amber-700 mt-1">
                        基幹システムで作成した見積明細のIDを入力してください（請求書統合用）
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 請求書PDF管理（Phase 3: 請求書統合フロー） */}
            {job?.field19 && (() => {
              // Google DriveフォルダIDを抽出（URLから）
              const folderIdMatch = job.field19.match(/\/folders\/([a-zA-Z0-9_-]+)/);
              const folderId = folderIdMatch ? folderIdMatch[1] : job.field19.split("/").pop() || "";

              return (
                <InvoiceUpload
                  jobId={jobId}
                  jobFolderId={folderId}
                  baseSystemInvoiceId={job.field_base_system_id || undefined}
                  onBaseSystemIdUpdate={async (baseSystemInvoiceId) => {
                    // 基幹システム連携IDをZoho CRMに保存
                    const result = await updateJobBaseSystemId(jobId, baseSystemInvoiceId);
                    if (result.success) {
                      await mutateJob();
                      toast.success("基幹システム連携IDを保存しました");
                    } else {
                      toast.error("基幹システム連携IDの保存に失敗しました", {
                        description: result.error?.message,
                      });
                    }
                  }}
                  existingInvoice={existingInvoice}
                />
              );
            })()}

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* プレビューボタン */}
              <Button
                variant="outline"
                className="flex-1 h-12 text-base font-medium"
                onClick={handlePreview}
                disabled={isSubmitting}
              >
                <Eye className="h-5 w-5 mr-2 shrink-0" />
                プレビュー
              </Button>
              
              {/* 顧客に送信ボタン */}
              <Button
                className="flex-1 h-12 text-base font-medium bg-slate-900 text-white hover:bg-slate-800"
                onClick={handleSendLine}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" />
                    送信中...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-5 w-5 mr-2 shrink-0" />
                    顧客に送信
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* スティッキーフッター（セクション別合計 + 全体合計） */}
      {(() => {
        // セクション別合計を計算
        const requiredTotal = estimateItems
          .filter((i) => i.priority === "required")
          .reduce((sum, item) => sum + ((item.partQuantity || 0) * (item.partUnitPrice || 0) + (item.laborCost || 0)), 0);
        const recommendedTotal = estimateItems
          .filter((i) => i.priority === "recommended")
          .reduce((sum, item) => sum + ((item.partQuantity || 0) * (item.partUnitPrice || 0) + (item.laborCost || 0)), 0);
        const optionalTotal = estimateItems
          .filter((i) => i.priority === "optional")
          .reduce((sum, item) => sum + ((item.partQuantity || 0) * (item.partUnitPrice || 0) + (item.laborCost || 0)), 0);

        // 全体合計を計算
        const grandSubtotal = requiredTotal + recommendedTotal + optionalTotal;
        const grandTaxCalculation = calculateTax(grandSubtotal);
        const grandTotal = isTaxIncluded ? grandTaxCalculation.total : grandSubtotal;

        return (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 必須整備合計 */}
                <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start gap-2">
                  <span className="text-base text-slate-700">必須整備</span>
                  <span className="text-xl font-bold text-red-600 tabular-nums">
                    ¥{formatPrice(isTaxIncluded ? calculateTax(requiredTotal).total : requiredTotal)}
                  </span>
                </div>

                {/* 推奨整備合計 */}
                <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start gap-2">
                  <span className="text-base text-slate-700">推奨整備</span>
                  <span className="text-xl font-bold text-primary tabular-nums">
                    ¥{formatPrice(isTaxIncluded ? calculateTax(recommendedTotal).total : recommendedTotal)}
                  </span>
                </div>

                {/* 任意整備合計 */}
                <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start gap-2">
                  <span className="text-base text-slate-700">任意整備</span>
                  <span className="text-xl font-bold text-slate-700 tabular-nums">
                    ¥{formatPrice(isTaxIncluded ? calculateTax(optionalTotal).total : optionalTotal)}
                  </span>
                </div>

                {/* 全体合計 */}
                <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 md:border-0">
                  <span className="text-base font-medium text-slate-900">合計{isTaxIncluded ? "（税込）" : "（税抜）"}</span>
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    ¥{formatPrice(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 作業追加ダイアログ */}
      <AddWorkOrderDialog
        open={isAddWorkOrderDialogOpen}
        onOpenChange={setIsAddWorkOrderDialogOpen}
        job={job}
        existingServiceKinds={workOrders?.map((wo) => wo.serviceKind as ServiceKind) || serviceKinds}
        onSuccess={handleAddWorkOrderSuccess}
      />

      {/* 基幹システム転記ダイアログ */}
      <Dialog open={isBaseSystemCopyDialogOpen} onOpenChange={setIsBaseSystemCopyDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 shrink-0" />
              基幹システムから見積項目を転記
            </DialogTitle>
            <DialogDescription>
              基幹システムで計算した見積項目を転記してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="base-system-items">見積項目（CSV形式）</Label>
              <textarea
                id="base-system-items"
                className="w-full min-h-[200px] px-3 py-2 text-base border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono"
                placeholder="品名1,金額1&#10;品名2,金額2&#10;&#10;例：&#10;エンジンオイル交換,5500&#10;オイルフィルター交換,1100"
                value={baseSystemItemsText}
                onChange={(e) => setBaseSystemItemsText(e.target.value)}
              />
              <p className="text-base text-slate-700">
                形式：1行に1項目、カンマ区切りで「品名,金額（税込）」を入力してください
              </p>
            </div>
            <div className="space-y-2">
              <Label>転記モード</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="copy-mode"
                    value="add"
                    checked={baseSystemCopyMode === "add"}
                    onChange={() => setBaseSystemCopyMode("add")}
                    className="text-amber-700 focus:ring-amber-500"
                  />
                  <span className="text-base">既存項目に追加</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="copy-mode"
                    value="replace"
                    checked={baseSystemCopyMode === "replace"}
                    onChange={() => setBaseSystemCopyMode("replace")}
                    className="text-amber-700 focus:ring-amber-500"
                  />
                  <span className="text-base">既存項目を置き換え</span>
                </label>
              </div>
              <p className="text-base text-slate-700">
                {baseSystemCopyMode === "add"
                  ? "既存の見積項目に追加します"
                  : "既存の見積項目をすべて削除して、新しい項目に置き換えます"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsBaseSystemCopyDialogOpen(false);
                setBaseSystemItemsText("");
              }}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCopyFromBaseSystem}
              disabled={!baseSystemItemsText.trim() || isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                  転記中...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2 shrink-0" />
                  転記する
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 全部品到着時の連絡ダイアログ */}
      {isRepair && (
        <PartsArrivalDialog
          open={isPartsArrivalDialogOpen}
          onOpenChange={setIsPartsArrivalDialogOpen}
          customerName={customerName}
          vehicleName={vehicleName}
          arrivedParts={arrivedParts}
          onSendContact={handleSendPartsArrivalContact}
          bookingLink={undefined} // TODO: Zoho Bookings予約リンク生成機能を実装
        />
      )}

      {/* 作業メモダイアログ */}
      <JobMemoDialog
        open={isJobMemoDialogOpen}
        onOpenChange={setIsJobMemoDialogOpen}
        job={job}
        onSuccess={async () => {
          // メモ更新後にジョブデータを再取得
          await mutateJob();
        }}
      />

      {/* 過去の見積参照ダイアログ（改善提案 #6） */}
      {job?.field4?.id && (
        <HistoricalEstimateDialog
          open={isHistoricalEstimateDialogOpen}
          onOpenChange={setIsHistoricalEstimateDialogOpen}
          customerId={job.field4.id}
          onCopyItems={(items) => {
            // EstimateItem[]をEstimateLineItem[]に変換して追加
            const newLineItems: EstimateLineItem[] = items.map((item) => {
              // 作業内容名から工賃マスタを検索して技術量を自動設定
              const laborCostItem = searchLaborCostByName(item.name);
              const laborCost = laborCostItem.length > 0
                ? laborCostItem[0].laborCost
                : (item.price || 0);

              return {
                id: item.id,
                name: item.name,
                partQuantity: 0,
                partUnitPrice: 0,
                laborCost,
                priority: item.priority,
                linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
                linkedVideoId: null,
                transcription: null,
              };
            });

            setEstimateItems((prev) => [...prev, ...newLineItems]);
          }}
        />
      )}

      {/* 過去の案件参照ダイアログ（改善提案 #6） */}
      {job?.field4?.id && (
        <HistoricalJobDialog
          open={isHistoricalJobDialogOpen}
          onOpenChange={setIsHistoricalJobDialogOpen}
          customerId={job.field4.id}
        />
      )}

      {/* 見積テンプレートダイアログ */}
      <EstimateTemplateDialog
        open={isEstimateTemplateDialogOpen}
        onOpenChange={setIsEstimateTemplateDialogOpen}
        currentItems={estimateItems.map((item) => {
          const partTotal = (item.partQuantity || 0) * (item.partUnitPrice || 0);
          const laborTotal = item.laborCost || 0;
          const totalPrice = partTotal + laborTotal;
          return {
            id: item.id,
            name: item.name,
            price: totalPrice,
            priority: item.priority,
            selected: false,
            linkedPhotoUrls: item.linkedPhotoId ? [item.linkedPhotoId] : [],
            linkedVideoUrl: item.linkedVideoId || null,
            note: null,
          };
        })}
        onLoadTemplate={(items) => {
          // EstimateItem[]をEstimateLineItem[]に変換して追加
          const newLineItems: EstimateLineItem[] = items.map((item) => ({
            id: item.id,
            name: item.name,
            partQuantity: 0,
            partUnitPrice: 0,
            laborCost: item.price || 0, // 既存のpriceをlaborCostとして設定
            priority: item.priority,
            linkedPhotoId: item.linkedPhotoUrls && item.linkedPhotoUrls.length > 0 ? item.linkedPhotoUrls[0] : null,
            linkedVideoId: item.linkedVideoUrl || null,
            transcription: null,
          }));

          setEstimateItems((prev) => [...prev, ...newLineItems]);
        }}
      />

      {/* 写真表示Dialog（見積明細行の写真アイコンから開く） */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">{photoDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-slate-900">
            {photoDialogUrl && (
              <Image
                src={photoDialogUrl}
                alt={photoDialogTitle}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 1024px"
                unoptimized
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* スティッキーフッター（セクション別合計 + 全体合計） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg z-40">
        <div className={cn("mx-auto px-4 py-4", isInspection ? "max-w-4xl" : "max-w-7xl")}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 必須整備合計 */}
            <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start gap-2">
              <span className="text-base text-slate-700 dark:text-white">必須整備</span>
              <span className="text-xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                ¥{formatPrice(isTaxIncluded ? calculateTax(requiredTotal).total : requiredTotal)}
              </span>
            </div>

            {/* 推奨整備合計 */}
            <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start gap-2">
              <span className="text-base text-slate-700 dark:text-white">推奨整備</span>
              <span className="text-xl font-bold text-primary tabular-nums">
                ¥{formatPrice(isTaxIncluded ? calculateTax(recommendedTotal).total : recommendedTotal)}
              </span>
            </div>

            {/* 任意整備合計 */}
            <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start gap-2">
              <span className="text-base text-slate-700 dark:text-white">任意整備</span>
              <span className="text-xl font-bold text-slate-700 dark:text-white tabular-nums">
                ¥{formatPrice(isTaxIncluded ? calculateTax(optionalTotal).total : optionalTotal)}
              </span>
            </div>

            {/* 全体合計 */}
            <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700 md:border-0">
              <span className="text-base font-medium text-slate-900 dark:text-white">合計{isTaxIncluded ? "（税込）" : "（税抜）"}</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                ¥{formatPrice(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 見積プレビューダイアログ */}
      <EstimatePreviewDialog
        open={isEstimatePreviewDialogOpen}
        onOpenChange={setIsEstimatePreviewDialogOpen}
        job={job || null}
        estimateItems={estimateItems}
        photos={photos}
        videos={videos}
        onSave={handleSaveFromPreview}
        legalFees={isInspection ? legalFees : undefined}
        isTaxIncluded={isTaxIncluded}
      />
    </div>
  );
}

export default function EstimatePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-auto">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-700">読み込み中...</p>
        </div>
      </div>
    }>
      <EstimatePageContent />
    </Suspense>
  );
}
