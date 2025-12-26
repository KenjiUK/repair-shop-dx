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
import { Eye, Edit, CheckCircle2, AlertCircle } from "lucide-react";
import { ZohoJob } from "@/types";
import { PhotoManager, PhotoItem } from "./photo-manager";
import Image from "next/image";

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
  }>;
  photos: PhotoItem[];
  onEdit?: (itemIndex: number) => void;
  onSave?: () => void;
  onPhotosChange?: (photos: PhotoItem[]) => void;
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
            診断結果のプレビュー
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



