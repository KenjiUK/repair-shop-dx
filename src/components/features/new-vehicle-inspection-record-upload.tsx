"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { uploadNewVehicleInspectionRecord } from "@/lib/new-vehicle-inspection-record-upload";
import { validateFile, formatFileSize } from "@/lib/file-validation";
import { ErrorMessage } from "./error-message";
import { ErrorCategory } from "@/lib/error-handling";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface NewVehicleInspectionRecordUploadProps {
  /** 顧客ID */
  customerId: string;
  /** 顧客名 */
  customerName: string;
  /** 車両名（新規車両名） */
  vehicleName: string;
  /** アップロード完了時のコールバック */
  onUploadComplete?: (fileId: string) => void;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function NewVehicleInspectionRecordUpload({
  customerId,
  customerName,
  vehicleName,
  onUploadComplete,
  className,
}: NewVehicleInspectionRecordUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル選択ハンドラ
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // ファイルバリデーション
    const validation = validateFile(selectedFile, ["image", "pdf"]);
    if (!validation.valid) {
      setUploadError(validation.error || "ファイルの形式が不正です");
      return;
    }

    setFile(selectedFile);
    setUploadError(null);
    setUploadedFileId(null);

    // プレビューを生成（画像の場合）
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  };

  /**
   * ファイル削除ハンドラ
   */
  const handleFileRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setUploadedFileId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * アップロードハンドラ
   */
  const handleUpload = async () => {
    if (!file || !vehicleName) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadNewVehicleInspectionRecord(
        file,
        customerId,
        customerName,
        vehicleName
      );

      if (result.success && result.data) {
        setUploadedFileId(result.data.id);
        toast.success("自動車検査証記録事項をアップロードしました");
        onUploadComplete?.(result.data.id);
      } else {
        setUploadError(result.error?.message || "アップロードに失敗しました");
        toast.error(result.error?.message || "アップロードに失敗しました");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "アップロード中にエラーが発生しました";
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* ファイル選択 */}
      {!file && !uploadedFileId && (
        <div className="space-y-2">
          <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <Upload className="h-6 w-6 text-slate-700 mb-1 shrink-0" />
            <span className="text-base text-slate-800">ファイルを選択</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="new-vehicle-inspection-record-upload"
            />
          </label>
          <p className="text-base text-slate-600">
            対応形式: 画像（JPG, PNG, WebP）、PDF / 最大サイズ: 10MB
          </p>
        </div>
      )}

      {/* プレビュー */}
      {file && !uploadedFileId && (
        <div className="space-y-2">
          {previewUrl ? (
            <div className="relative aspect-video border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
              <Image
                src={previewUrl}
                alt="自動車検査証記録事項プレビュー"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={handleFileRemove}
                className="absolute top-2 right-2 h-10 w-10"
              >
                <X className="h-5 w-5 shrink-0" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 border border-slate-300 rounded-xl bg-slate-50">
              <FileText className="h-8 w-8 text-slate-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-slate-900 truncate">
                  {file.name}
                </p>
                <p className="text-sm text-slate-600">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={handleFileRemove}
                className="h-10 w-10 shrink-0"
              >
                <X className="h-5 w-5 shrink-0" />
              </Button>
            </div>
          )}

          {/* エラーメッセージ */}
          {uploadError && (
            <ErrorMessage
              code={undefined}
              message={uploadError}
              category={ErrorCategory.CLIENT_ERROR}
            />
          )}

          {/* アップロードボタン */}
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full h-12 text-base font-medium"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin shrink-0" />
                アップロード中...
              </>
            ) : (
              "アップロード"
            )}
          </Button>
        </div>
      )}

      {/* アップロード完了 */}
      {uploadedFileId && (
        <div className="flex items-center gap-3 p-4 border border-green-300 rounded-xl bg-green-50">
          <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-green-900">
              アップロード完了
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

