/**
 * 診断結果プレビューダイアログ
 * 改善提案 #15: 診断結果のプレビュー機能
 * 
 * 機能:
 * - 診断結果を保存する前にプレビュー表示
 * - プレビュー画面から直接編集
 * - 確認項目の表示
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
import { Eye, Edit, CheckCircle2, AlertCircle, Wrench, ClipboardCheck, Gauge, Lightbulb, Camera, Video } from "lucide-react";
import { ZohoJob } from "@/types";
import { PhotoManager, PhotoItem } from "./photo-manager";
import Image from "next/image";
import { InspectionMeasurements, InspectionParts, CustomPartItem } from "@/types/inspection-redesign";
import { QualityCheckData } from "@/types/inspection-quality-check";
import { EstimateLineItem } from "@/types";
import { Calculator } from "lucide-react";

interface DiagnosisPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: ZohoJob | null;
  diagnosisItems: Array<{
    id: string;
    name: string;
    status?: string;
    comment?: string | null;
    value?: string;
    index?: number; // プレビューからの編集用
    photoUrls?: string[]; // 診断項目ごとの写真URL配列
    videoUrls?: string[]; // 診断項目ごとの動画URL配列
    videoData?: Array<{
      url: string;
      duration?: number;
      transcription?: string;
    }>; // 診断項目ごとの動画データ
  }>;
  photos: PhotoItem[];
  onEdit?: (itemIndex: number) => void;
  onSave?: () => void;
  onPhotosChange?: (photos: PhotoItem[]) => void;
  // 24ヶ月点検リデザイン版の追加props
  is24MonthInspection?: boolean;
  inspectionMeasurements?: InspectionMeasurements;
  inspectionParts?: InspectionParts;
  customParts?: CustomPartItem[];
  qualityCheckData?: QualityCheckData;
  maintenanceAdvice?: string;
  // 追加見積項目
  additionalEstimateRequired?: EstimateLineItem[];
  additionalEstimateRecommended?: EstimateLineItem[];
  additionalEstimateOptional?: EstimateLineItem[];
}

/**
 * 診断結果プレビューダイアログ
 */
export function DiagnosisPreviewDialog({
  open,
  onOpenChange,
  job,
  diagnosisItems,
  photos,
  onEdit,
  onSave,
  onPhotosChange,
  // 24ヶ月点検リデザイン版
  is24MonthInspection = false,
  inspectionMeasurements,
  inspectionParts,
  customParts,
  qualityCheckData,
  maintenanceAdvice,
  additionalEstimateRequired,
  additionalEstimateRecommended,
  additionalEstimateOptional,
}: DiagnosisPreviewDialogProps) {
  /**
   * プレビュー画面から編集
   */
  const handleEditFromPreview = (itemIndex: number) => {
    onOpenChange(false);
    if (onEdit) {
      // 少し遅延させてから編集画面にスクロール
      setTimeout(() => {
        onEdit(itemIndex);
      }, 100);
    }
  };

  /**
   * 保存
   */
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
    onOpenChange(false);
  };

  // 確認項目のチェック
  const hasDiagnosisItems = diagnosisItems.length > 0;
  const hasPhotos = photos.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {is24MonthInspection ? "受入点検結果のプレビュー" : "診断結果のプレビュー"}
          </DialogTitle>
          <DialogDescription>
            保存前に内容を確認してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* お客様情報 */}
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

          {/* 確認項目 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">確認項目</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hasDiagnosisItems && (
                  <div className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>診断項目が入力されています ({diagnosisItems.length}件)</span>
                  </div>
                )}
                {hasPhotos && (
                  <div className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>写真が添付されています ({photos.length}枚)</span>
                  </div>
                )}
                {!hasDiagnosisItems && (
                  <div className="flex items-center gap-2 text-base text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>診断項目が入力されていません</span>
                  </div>
                )}
                {!hasPhotos && (
                  <div className="flex items-center gap-2 text-base text-slate-700">
                    <AlertCircle className="h-5 w-5" />
                    <span>写真が添付されていません</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 診断結果 */}
          {hasDiagnosisItems && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">診断結果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {diagnosisItems.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium mb-1">{item.name}</div>
                          {item.status && (
                            <Badge
                              variant={
                                item.status === "green" ||
                                item.status === "ok"
                                  ? "default"
                                  : item.status === "yellow" ||
                                    item.status === "attention"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="mb-2"
                            >
                              {item.status === "green" || item.status === "ok"
                                ? "正常"
                                : item.status === "yellow" ||
                                  item.status === "attention"
                                ? "要確認"
                                : "要対応"}
                            </Badge>
                          )}
                          {(item.comment || item.value) && (
                            <div className="text-base text-slate-700 mt-1">
                              {item.comment || item.value}
                            </div>
                          )}
                          {/* 診断項目ごとの写真・動画 */}
                          {((item.photoUrls && item.photoUrls.length > 0) || (item.videoUrls && item.videoUrls.length > 0)) && (
                            <div className="mt-3 space-y-2">
                              {/* 写真 */}
                              {item.photoUrls && item.photoUrls.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2 text-sm text-slate-600">
                                    <Camera className="h-4 w-4" />
                                    <span>写真 ({item.photoUrls.length}枚)</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {item.photoUrls.map((photoUrl, photoIndex) => (
                                      <div key={photoIndex} className="relative aspect-square rounded overflow-hidden border border-slate-200">
                                        <Image
                                          src={photoUrl}
                                          alt={`${item.name}の写真 ${photoIndex + 1}`}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 768px) 33vw, 100px"
                                          unoptimized
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* 動画 */}
                              {item.videoUrls && item.videoUrls.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2 text-sm text-slate-600">
                                    <Video className="h-4 w-4" />
                                    <span>動画 ({item.videoUrls.length}本)</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {item.videoUrls.map((videoUrl, videoIndex) => {
                                      const videoInfo = item.videoData?.[videoIndex];
                                      return (
                                        <div key={videoIndex} className="relative aspect-square rounded overflow-hidden border border-slate-200 bg-slate-900">
                                          <video
                                            src={videoUrl}
                                            className="w-full h-full object-cover"
                                            controls
                                            preload="metadata"
                                          />
                                          {videoInfo?.duration && (
                                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                              {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, "0")}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {onEdit && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const itemIndex = item.index !== undefined ? item.index : diagnosisItems.findIndex(di => di.id === item.id);
                              handleEditFromPreview(itemIndex);
                            }}
                            className="shrink-0"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            編集
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 写真 */}
          {hasPhotos && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  写真 ({photos.length}枚)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {onPhotosChange ? (
                  <PhotoManager
                    photos={photos}
                    onPhotosChange={onPhotosChange}
                    disabled={false}
                  />
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                      <div key={photo.id} className="relative w-full h-24 rounded overflow-hidden">
                        <Image
                          src={photo.previewUrl}
                          alt={`写真 ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 24ヶ月点検リデザイン版の追加情報 */}
          {is24MonthInspection && (
            <>
              {/* 測定値 */}
              {inspectionMeasurements && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      測定値
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {inspectionMeasurements.coConcentration && (
                        <div>
                          <span className="text-slate-600">CO濃度:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.coConcentration}%</span>
                        </div>
                      )}
                      {inspectionMeasurements.hcConcentration && (
                        <div>
                          <span className="text-slate-600">HC濃度:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.hcConcentration}ppm</span>
                        </div>
                      )}
                      {inspectionMeasurements.brakePadFrontLeft && (
                        <div>
                          <span className="text-slate-600">ブレーキパッド前左:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.brakePadFrontLeft}mm</span>
                        </div>
                      )}
                      {inspectionMeasurements.brakePadFrontRight && (
                        <div>
                          <span className="text-slate-600">ブレーキパッド前右:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.brakePadFrontRight}mm</span>
                        </div>
                      )}
                      {inspectionMeasurements.brakePadRearLeft && (
                        <div>
                          <span className="text-slate-600">ブレーキパッド後左:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.brakePadRearLeft}mm</span>
                        </div>
                      )}
                      {inspectionMeasurements.brakePadRearRight && (
                        <div>
                          <span className="text-slate-600">ブレーキパッド後右:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.brakePadRearRight}mm</span>
                        </div>
                      )}
                      {inspectionMeasurements.tireDepthFrontLeft && (
                        <div>
                          <span className="text-slate-600">タイヤ溝前左:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.tireDepthFrontLeft}mm</span>
                        </div>
                      )}
                      {inspectionMeasurements.tireDepthFrontRight && (
                        <div>
                          <span className="text-slate-600">タイヤ溝前右:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.tireDepthFrontRight}mm</span>
                        </div>
                      )}
                      {inspectionMeasurements.tireDepthRearLeft && (
                        <div>
                          <span className="text-slate-600">タイヤ溝後左:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.tireDepthRearLeft}mm</span>
                        </div>
                      )}
                      {inspectionMeasurements.tireDepthRearRight && (
                        <div>
                          <span className="text-slate-600">タイヤ溝後右:</span>
                          <span className="ml-2 font-medium">{inspectionMeasurements.tireDepthRearRight}mm</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 交換部品 */}
              {((inspectionParts && Object.values(inspectionParts).some(v => v)) || (customParts && customParts.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      交換部品等
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {inspectionParts?.engineOil && (
                        <div className="flex justify-between">
                          <span>エンジンオイル</span>
                          <span className="font-medium">{inspectionParts.engineOil}L</span>
                        </div>
                      )}
                      {inspectionParts?.oilFilter && (
                        <div className="flex justify-between">
                          <span>オイルフィルター</span>
                          <span className="font-medium">{inspectionParts.oilFilter}個</span>
                        </div>
                      )}
                      {inspectionParts?.llc && (
                        <div className="flex justify-between">
                          <span>LLC</span>
                          <span className="font-medium">{inspectionParts.llc}L</span>
                        </div>
                      )}
                      {inspectionParts?.brakeFluid && (
                        <div className="flex justify-between">
                          <span>ブレーキフルード</span>
                          <span className="font-medium">{inspectionParts.brakeFluid}L</span>
                        </div>
                      )}
                      {inspectionParts?.wiperRubber && (
                        <div className="flex justify-between">
                          <span>ワイパーゴム</span>
                          <span className="font-medium">{inspectionParts.wiperRubber}個</span>
                        </div>
                      )}
                      {inspectionParts?.cleanAirFilter && (
                        <div className="flex justify-between">
                          <span>クリーンエアフィルター</span>
                          <span className="font-medium">{inspectionParts.cleanAirFilter}個</span>
                        </div>
                      )}
                      {customParts && customParts.map((part, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{part.name}</span>
                          <span className="font-medium">{part.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 品質管理・最終検査 */}
              {qualityCheckData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      品質管理・最終検査
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {qualityCheckData.tireWheel?.wheelNutTorque && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>ホイールナット締付トルク</span>
                        </div>
                      )}
                      {qualityCheckData.tireWheel?.torqueWrenchUsed && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>トルクレンチ使用確認</span>
                        </div>
                      )}
                      {qualityCheckData.brake?.brakeEffect && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>ブレーキ効き（試運転）</span>
                        </div>
                      )}
                      {qualityCheckData.brake?.noAbnormalNoise && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>異音なし（試運転）</span>
                        </div>
                      )}
                      {qualityCheckData.electrical?.allLightsOn && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>全灯火点灯</span>
                        </div>
                      )}
                      {qualityCheckData.electrical?.warningLightsOff && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>警告灯消灯</span>
                        </div>
                      )}
                      {qualityCheckData.battery?.voltageOk && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>電圧・充電状態</span>
                        </div>
                      )}
                      {qualityCheckData.suspension?.steeringBehavior && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>ステアリング・挙動</span>
                        </div>
                      )}
                      {qualityCheckData.suspension?.noSuspensionNoise && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>足回り異音なし</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 整備アドバイス */}
              {maintenanceAdvice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      整備アドバイス
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{maintenanceAdvice}</p>
                  </CardContent>
                </Card>
              )}

              {/* 追加見積内容 */}
              {((additionalEstimateRequired && additionalEstimateRequired.length > 0) ||
                (additionalEstimateRecommended && additionalEstimateRecommended.length > 0) ||
                (additionalEstimateOptional && additionalEstimateOptional.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      追加見積内容
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 必須整備 */}
                      {additionalEstimateRequired && additionalEstimateRequired.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-red-600 text-white">必須整備</Badge>
                            <span className="text-sm text-slate-600">{additionalEstimateRequired.length}件</span>
                          </div>
                          <div className="space-y-2">
                            {additionalEstimateRequired.map((item) => (
                              <div key={item.id} className="p-3 border rounded-lg bg-slate-50">
                                <div className="font-medium text-sm mb-1">{item.name || "未入力"}</div>
                                <div className="text-xs text-slate-600 space-y-1">
                                  {item.partQuantity > 0 && item.partUnitPrice > 0 && (
                                    <div>数量: {item.partQuantity} × 単価: ¥{item.partUnitPrice.toLocaleString()} = 部品代: ¥{(item.partQuantity * item.partUnitPrice).toLocaleString()}</div>
                                  )}
                                  {item.laborCost > 0 && (
                                    <div>技術料: ¥{item.laborCost.toLocaleString()}</div>
                                  )}
                                  {(item.partQuantity * item.partUnitPrice + item.laborCost) > 0 && (
                                    <div className="font-medium text-slate-900">合計: ¥{((item.partQuantity * item.partUnitPrice) + item.laborCost).toLocaleString()}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 推奨整備 */}
                      {additionalEstimateRecommended && additionalEstimateRecommended.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-emerald-600 text-white">推奨整備</Badge>
                            <span className="text-sm text-slate-600">{additionalEstimateRecommended.length}件</span>
                          </div>
                          <div className="space-y-2">
                            {additionalEstimateRecommended.map((item) => (
                              <div key={item.id} className="p-3 border rounded-lg bg-slate-50">
                                <div className="font-medium text-sm mb-1">{item.name || "未入力"}</div>
                                <div className="text-xs text-slate-600 space-y-1">
                                  {item.partQuantity > 0 && item.partUnitPrice > 0 && (
                                    <div>数量: {item.partQuantity} × 単価: ¥{item.partUnitPrice.toLocaleString()} = 部品代: ¥{(item.partQuantity * item.partUnitPrice).toLocaleString()}</div>
                                  )}
                                  {item.laborCost > 0 && (
                                    <div>技術料: ¥{item.laborCost.toLocaleString()}</div>
                                  )}
                                  {(item.partQuantity * item.partUnitPrice + item.laborCost) > 0 && (
                                    <div className="font-medium text-slate-900">合計: ¥{((item.partQuantity * item.partUnitPrice) + item.laborCost).toLocaleString()}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 任意整備 */}
                      {additionalEstimateOptional && additionalEstimateOptional.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-slate-500 text-white">任意整備</Badge>
                            <span className="text-sm text-slate-600">{additionalEstimateOptional.length}件</span>
                          </div>
                          <div className="space-y-2">
                            {additionalEstimateOptional.map((item) => (
                              <div key={item.id} className="p-3 border rounded-lg bg-slate-50">
                                <div className="font-medium text-sm mb-1">{item.name || "未入力"}</div>
                                <div className="text-xs text-slate-600 space-y-1">
                                  {item.partQuantity > 0 && item.partUnitPrice > 0 && (
                                    <div>数量: {item.partQuantity} × 単価: ¥{item.partUnitPrice.toLocaleString()} = 部品代: ¥{(item.partQuantity * item.partUnitPrice).toLocaleString()}</div>
                                  )}
                                  {item.laborCost > 0 && (
                                    <div>技術料: ¥{item.laborCost.toLocaleString()}</div>
                                  )}
                                  {(item.partQuantity * item.partUnitPrice + item.laborCost) > 0 && (
                                    <div className="font-medium text-slate-900">合計: ¥{((item.partQuantity * item.partUnitPrice) + item.laborCost).toLocaleString()}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
          <Button onClick={handleSave} disabled={!hasDiagnosisItems}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



