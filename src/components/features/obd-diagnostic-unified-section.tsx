"use client";

/**
 * OBD診断結果 写真撮影セクション
 * 
 * 機能:
 * - 写真撮影
 * - 撮影した写真をPDFに変換して保存
 */

import { useState, useRef } from "react";
import { Camera, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PDFDocument } from "pdf-lib";
import { compressImage } from "@/lib/compress";
import Image from "next/image";
import { toast } from "sonner";

// =============================================================================
// 型定義
// =============================================================================

export interface OBDDiagnosticResult {
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  uploadedAt?: string;
  status?: "uploaded" | "pending" | "error";
}

export interface OBDDiagnosticUnifiedSectionProps {
  /** PDF結果（写真から生成されたPDF） */
  pdfResult?: OBDDiagnosticResult;
  /** PDF生成ハンドラ（写真ファイルを受け取り、PDFを生成） */
  onPdfUpload: (file: File) => void | Promise<void>;
  /** PDF削除ハンドラ */
  onPdfRemove?: () => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * 画像をPDFに変換
 */
async function convertImageToPdf(imageFile: File): Promise<File> {
  try {
    // 画像を圧縮
    const compressedImage = await compressImage(imageFile);
    
    // 画像をBase64に変換
    const imageDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressedImage);
    });

    // PDFドキュメントを作成
    const pdfDoc = await PDFDocument.create();
    
    // 画像を埋め込み
    let image;
    if (compressedImage.type === "image/png") {
      image = await pdfDoc.embedPng(imageDataUrl);
    } else {
      image = await pdfDoc.embedJpg(imageDataUrl);
    }

    // ページサイズを画像のアスペクト比に合わせる（A4サイズを基準）
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    
    // 画像のアスペクト比を計算
    const imageAspectRatio = image.width / image.height;
    const pageAspectRatio = pageWidth / pageHeight;
    
    let width, height;
    if (imageAspectRatio > pageAspectRatio) {
      // 画像が横長の場合
      width = pageWidth;
      height = pageWidth / imageAspectRatio;
    } else {
      // 画像が縦長の場合
      height = pageHeight;
      width = pageHeight * imageAspectRatio;
    }

    // ページを追加
    const page = pdfDoc.addPage([width, height]);
    
    // 画像を描画（中央配置）
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });

    // PDFをBlobに変換
    const pdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
    
    // Fileオブジェクトに変換
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const pdfFile = new File([pdfBlob], `obd-diagnostic-${timestamp}.pdf`, {
      type: "application/pdf",
    });

    return pdfFile;
  } catch (error) {
    console.error("画像をPDFに変換する際のエラー:", error);
    throw new Error("PDF変換に失敗しました");
  }
}

// =============================================================================
// メインコンポーネント
// =============================================================================

export function OBDDiagnosticUnifiedSection({
  pdfResult,
  onPdfUpload,
  onPdfRemove,
  disabled = false,
  className,
}: OBDDiagnosticUnifiedSectionProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    pdfResult?.fileUrl || null
  );

  // 写真ファイル選択
  const handlePhotoSelect = () => {
    if (disabled || isProcessing) return;
    photoInputRef.current?.click();
  };

  // 写真ファイル変更
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    // ファイル形式チェック
    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }

    setIsProcessing(true);

    try {
      // プレビュー用URLを作成
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // 画像をPDFに変換
      const pdfFile = await convertImageToPdf(file);

      // プレビューURLをクリーンアップ
      URL.revokeObjectURL(preview);

      // PDFのプレビューURLを作成
      const pdfPreview = URL.createObjectURL(pdfFile);
      setPreviewUrl(pdfPreview);

      // コールバック実行
      await onPdfUpload(pdfFile);

      toast.success("OBD診断結果をPDFに変換しました");
    } catch (error) {
      console.error("OBD診断結果の処理エラー:", error);
      toast.error("PDF変換に失敗しました");
      setPreviewUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // PDF削除
  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onPdfRemove?.();
    toast.success("OBD診断結果を削除しました");
  };

  const hasFile = pdfResult?.fileName || pdfResult?.fileUrl || previewUrl;

  return (
    <Card className={cn("border-slate-200 shadow-md dark:border-slate-700", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-3xl font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
          <FileText className="h-9 w-9 text-slate-600 shrink-0 dark:text-white" />
          OBD診断結果
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="hidden"
          disabled={disabled || isProcessing}
        />

        {hasFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 dark:text-green-400" />
                <div>
                  <p className="text-base font-medium text-green-800 dark:text-green-300">
                    {pdfResult?.fileName || "OBD診断結果PDF"}
                  </p>
                  {pdfResult?.uploadedAt && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {new Date(pdfResult.uploadedAt).toLocaleString("ja-JP")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(previewUrl, "_blank")}
                    className="h-14 text-base"
                    disabled={disabled}
                  >
                    <FileText className="h-5 w-5 mr-2 shrink-0" />
                    開く
                  </Button>
                )}
                {onPdfRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemove}
                    disabled={disabled}
                    className="h-14 w-14 text-base text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                  >
                    <X className="h-5 w-5 shrink-0" />
                  </Button>
                )}
              </div>
            </div>
            {previewUrl && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                <Image
                  src={previewUrl}
                  alt="OBD診断結果プレビュー"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {/* 写真追加ボタン（InspectionMediaButtonと同じスタイル） */}
            <button
              type="button"
              onClick={handlePhotoSelect}
              disabled={disabled || isProcessing}
              className={cn(
                "relative aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-50",
                "flex flex-col items-center justify-center gap-2",
                "hover:bg-slate-100 hover:border-slate-400 hover:border-solid transition-all",
                "dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:border-slate-500",
                "active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                (disabled || isProcessing) && "opacity-50 cursor-not-allowed"
              )}
              aria-label="OBD診断結果を撮影"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-slate-600 dark:text-white" />
                  <span className="text-base text-slate-600 dark:text-white">処理中...</span>
                </>
              ) : (
                <>
                  <Camera className="h-6 w-6 text-slate-600 dark:text-white" />
                  <span className="text-base font-medium text-slate-700 text-center px-2 dark:text-white">
                    写真を撮影
                  </span>
                  <span className="text-sm text-slate-500 text-center px-2 dark:text-white">
                    PDFに変換
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
