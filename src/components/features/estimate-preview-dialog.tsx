/**
 * 見積プレビューダイアログ
 * 改善提案: 見積結果のプレビュー機能
 * 
 * 機能:
 * - 見積結果を保存する前にプレビュー表示
 * - セクション別（必須/推奨/任意）の表示
 * - 合計金額の表示
 * - 写真・動画の紐付け確認
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, CheckCircle2, AlertCircle, ImageIcon, Video, Lock } from "lucide-react";
import { ZohoJob, EstimatePriority } from "@/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { DiagnosisPhoto, DiagnosisVideo } from "@/types";
import { LegalFees, convertLegalFeesToItems } from "@/lib/legal-fees";
import { calculateTax } from "@/lib/tax-calculation";

// EstimateLineItem型をexportして、見積画面から使用できるようにする
export type { EstimateLineItem as EstimatePreviewItem };

interface EstimateLineItem {
  id: string;
  name: string;
  partQuantity: number;
  partUnitPrice: number;
  laborCost: number;
  priority: EstimatePriority;
  linkedPhotoId: string | null;
  linkedVideoId: string | null;
  transcription: string | null;
}

interface EstimatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: ZohoJob | null;
  estimateItems: EstimateLineItem[];
  photos: DiagnosisPhoto[];
  videos: DiagnosisVideo[];
  onSave?: () => void;
  /** 法定費用（車検の場合のみ） */
  legalFees?: LegalFees | null;
  /** 税込/税抜表示（デフォルト: 税込） */
  isTaxIncluded?: boolean;
}

/**
 * 価格をフォーマット
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP").format(price);
}

/**
 * 見積項目行コンポーネント
 */
const EstimateItemRow = ({
  item,
  getPhotoById,
  getVideoById,
}: {
  item: EstimateLineItem;
  getPhotoById: (photoId: string | null) => DiagnosisPhoto | null;
  getVideoById: (videoId: string | null) => DiagnosisVideo | null;
}) => {
  const partCost = (item.partQuantity || 0) * (item.partUnitPrice || 0);
  const itemTotal = partCost + (item.laborCost || 0);
  const photo = getPhotoById(item.linkedPhotoId);
  const video = getVideoById(item.linkedVideoId);

  return (
    <div className="p-3 border border-slate-200 rounded-lg space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-medium text-base text-slate-900 mb-1">{item.name}</div>
          {item.transcription && (
            <div className="text-base text-slate-600 italic mb-2">
              「{item.transcription}」
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-base">
        <div className="text-slate-600">数量: {item.partQuantity || 0}</div>
        <div className="text-slate-600">単価: ¥{formatPrice(item.partUnitPrice || 0)}</div>
        <div className="text-slate-600">部品代: ¥{formatPrice(partCost)}</div>
        <div className="text-slate-600">技術量: ¥{formatPrice(item.laborCost || 0)}</div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {photo && (
            <div className="flex items-center gap-1 text-base text-slate-500">
              <ImageIcon className="h-4 w-4" />
              <span>写真あり</span>
            </div>
          )}
          {video && (
            <div className="flex items-center gap-1 text-base text-slate-500">
              <Video className="h-4 w-4" />
              <span>動画あり</span>
            </div>
          )}
        </div>
        <div className="font-semibold text-base text-slate-900">
          小計: ¥{formatPrice(itemTotal)}
        </div>
      </div>
      {(photo || video) && (
        <div className="flex gap-2 pt-2">
          {photo && (
            <div className="relative w-24 h-24 rounded overflow-hidden border border-slate-200">
              <Image
                src={photo.previewUrl || photo.url}
                alt={item.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          {video && (
            <div className="relative w-24 h-24 rounded overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
              <Video className="h-8 w-8 text-slate-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * セクション表示コンポーネント
 */
const SectionPreview = ({
  title,
  items,
  total,
  badgeColor,
  getPhotoById,
  getVideoById,
}: {
  title: string;
  items: EstimateLineItem[];
  total: { partTotal: number; laborTotal: number; total: number };
  badgeColor: string;
  getPhotoById: (photoId: string | null) => DiagnosisPhoto | null;
  getVideoById: (videoId: string | null) => DiagnosisVideo | null;
}) => {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge className={cn(badgeColor, "text-white")}>{title}</Badge>
            <span className="text-base text-slate-600">({items.length}件)</span>
          </CardTitle>
          <div className="text-base text-slate-600">
            部品代: ¥{formatPrice(total.partTotal)} / 技術量: ¥{formatPrice(total.laborTotal)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <EstimateItemRow
              key={item.id}
              item={item}
              getPhotoById={getPhotoById}
              getVideoById={getVideoById}
            />
          ))}
          <div className="pt-2 border-t-2 border-slate-300">
            <div className="flex justify-end">
              <div className="font-bold text-base text-slate-900">
                セクション合計: ¥{formatPrice(total.total)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * 見積プレビューダイアログ
 */
export function EstimatePreviewDialog({
  open,
  onOpenChange,
  job,
  estimateItems,
  photos,
  videos,
  onSave,
  legalFees,
  isTaxIncluded = true,
}: EstimatePreviewDialogProps) {
  /**
   * 保存
   */
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    onOpenChange(false);
  };

  // セクション別に項目を分類
  const requiredItems = estimateItems.filter((item) => item.priority === "required");
  const recommendedItems = estimateItems.filter((item) => item.priority === "recommended");
  const optionalItems = estimateItems.filter((item) => item.priority === "optional");

  // セクション別の合計計算
  const calculateSectionTotal = (items: EstimateLineItem[]) => {
    const partTotal = items.reduce(
      (sum, item) => sum + (item.partQuantity || 0) * (item.partUnitPrice || 0),
      0
    );
    const laborTotal = items.reduce((sum, item) => sum + (item.laborCost || 0), 0);
    return { partTotal, laborTotal, total: partTotal + laborTotal };
  };

  const requiredTotal = calculateSectionTotal(requiredItems);
  const recommendedTotal = calculateSectionTotal(recommendedItems);
  const optionalTotal = calculateSectionTotal(optionalItems);

  // 全体の合計（追加見積項目のみ）
  const grandPartTotal = requiredTotal.partTotal + recommendedTotal.partTotal + optionalTotal.partTotal;
  const grandLaborTotal = requiredTotal.laborTotal + recommendedTotal.laborTotal + optionalTotal.laborTotal;
  const grandSubtotal = grandPartTotal + grandLaborTotal;
  
  // 法定費用を含めた合計（車検の場合）
  const legalFeesTotal = legalFees?.total || 0;
  const grandTotalWithLegalFees = grandSubtotal + legalFeesTotal;
  
  // 税計算
  const taxCalculation = calculateTax(grandSubtotal);
  const grandTotal = isTaxIncluded ? taxCalculation.total : grandSubtotal;
  const grandTotalWithLegalFeesAndTax = isTaxIncluded 
    ? calculateTax(grandTotalWithLegalFees).total 
    : grandTotalWithLegalFees;

  // 確認項目のチェック
  const hasEstimateItems = estimateItems.length > 0;
  const hasRequiredItems = requiredItems.length > 0;

  // 写真・動画をIDで検索
  const getPhotoById = (photoId: string | null) => {
    if (!photoId) return null;
    return photos.find((p) => p.id === photoId) || null;
  };

  const getVideoById = (videoId: string | null) => {
    if (!videoId) return null;
    return videos.find((v) => v.id === videoId) || null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            見積プレビュー
          </DialogTitle>
          <DialogDescription>
            保存前に内容を確認してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">お客様情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-base text-slate-700">お客様名:</span>
                  <span className="ml-2 font-medium">
                    {job?.field4?.name || "不明"}
                  </span>
                </div>
                <div>
                  <span className="text-base text-slate-700">車両情報:</span>
                  <span className="ml-2 font-medium">
                    {job?.field6?.name || "不明"}
                  </span>
                </div>
                {job?.field10 && (
                  <div>
                    <span className="text-base text-slate-700">走行距離:</span>
                    <span className="ml-2 font-medium">
                      {job.field10.toLocaleString()}km
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">確認項目</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hasEstimateItems && (
                  <div className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>見積項目が入力されています ({estimateItems.length}件)</span>
                  </div>
                )}
                {hasRequiredItems && (
                  <div className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>必須整備項目が含まれています ({requiredItems.length}件)</span>
                  </div>
                )}
                {!hasEstimateItems && (
                  <div className="flex items-center gap-2 text-base text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>見積項目が入力されていません</span>
                  </div>
                )}
                {!hasRequiredItems && (
                  <div className="flex items-center gap-2 text-base text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>必須整備項目が含まれていません</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 法定費用（車検の場合のみ） */}
          {legalFees && (
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lock className="h-4 w-4 text-slate-700 shrink-0" />
                  法定費用（自動取得・編集不可）
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
          )}

          {hasEstimateItems && (
            <div className="space-y-4">
              <SectionPreview
                title="Section A: 必須整備"
                items={requiredItems}
                total={requiredTotal}
                badgeColor="bg-red-600 hover:bg-red-700"
                getPhotoById={getPhotoById}
                getVideoById={getVideoById}
              />
              <SectionPreview
                title="Section B: 推奨整備"
                items={recommendedItems}
                total={recommendedTotal}
                badgeColor="bg-blue-600 hover:bg-blue-700"
                getPhotoById={getPhotoById}
                getVideoById={getVideoById}
              />
              <SectionPreview
                title="Section C: 任意整備"
                items={optionalItems}
                total={optionalTotal}
                badgeColor="bg-slate-500 hover:bg-slate-600"
                getPhotoById={getPhotoById}
                getVideoById={getVideoById}
              />
            </div>
          )}

          {hasEstimateItems && (
            <Card className="bg-slate-50 border-2 border-slate-300">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base text-slate-700">部品代合計:</span>
                    <span className="text-base font-medium text-slate-900">
                      ¥{formatPrice(grandPartTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-slate-700">技術量合計:</span>
                    <span className="text-base font-medium text-slate-900">
                      ¥{formatPrice(grandLaborTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-slate-700">追加見積小計{isTaxIncluded ? "（税抜）" : ""}:</span>
                    <span className="text-base font-medium text-slate-900">
                      ¥{formatPrice(grandSubtotal)}
                    </span>
                  </div>
                  {isTaxIncluded && (
                    <div className="flex justify-between items-center">
                      <span className="text-base text-slate-700">消費税（{taxCalculation.taxRate}%）:</span>
                      <span className="text-base font-medium text-slate-900">
                        ¥{formatPrice(taxCalculation.tax)}
                      </span>
                    </div>
                  )}
                  {legalFees && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-base text-slate-700">法定費用合計:</span>
                        <span className="text-base font-medium text-slate-900">
                          ¥{formatPrice(legalFeesTotal)}
                        </span>
                      </div>
                    </>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-900">
                      総合計{isTaxIncluded ? "（税込）" : "（税抜）"}:
                    </span>
                    <span className="text-2xl font-bold text-slate-900">
                      ¥{formatPrice(legalFees ? grandTotalWithLegalFeesAndTax : grandTotal)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          <Button onClick={handleSave} disabled={!hasEstimateItems || !hasRequiredItems}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
