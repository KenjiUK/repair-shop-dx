"use client";

import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { uploadVehicleRegistration } from "@/lib/vehicle-registration-upload";
import { validateFile, formatFileSize } from "@/lib/file-validation";
import { ErrorMessage } from "./error-message";
import { ErrorCategory } from "@/lib/error-handling";
import { toast } from "sonner";

// =============================================================================
// Props
// =============================================================================

interface VehicleRegistrationUploadProps {
  /** 顧客ID */
  customerId: string;
  /** 顧客名 */
  customerName: string;
  /** 車両ID */
  vehicleId: string;
  /** 車両名 */
  vehicleName: string;
  /** アップロード完了時のコールバック */
  onUploadComplete?: (fileId: string) => void;
}

// =============================================================================
// Ref Interface
// =============================================================================

export interface VehicleRegistrationUploadRef {
  upload: () => Promise<boolean>;
  hasFile: () => boolean;
}

// =============================================================================
// Component
// =============================================================================

export const VehicleRegistrationUpload = forwardRef<
  VehicleRegistrationUploadRef,
  VehicleRegistrationUploadProps
>(({
  customerId,
  customerName,
  vehicleId,
  vehicleName,
  onUploadComplete,
}, ref) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル選択ハンドラ（選択のみ、アップロードはしない）
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
   * アップロード処理（外部から呼び出し可能）
   */
  const upload = async (): Promise<boolean> => {
    if (!file) {
      return true; // ファイルが選択されていない場合は成功として扱う
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await uploadVehicleRegistration(
        file,
        customerId,
        customerName,
        vehicleId,
        vehicleName
      );

      if (result.success && result.data) {
        setUploadedFileId(result.data.id);
        toast.success("車検証をアップロードしました");
        onUploadComplete?.(result.data.id);
        return true;
      } else {
        setUploadError(result.error?.message || "アップロードに失敗しました");
        toast.error(result.error?.message || "アップロードに失敗しました");
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "アップロード中にエラーが発生しました";
      setUploadError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * ファイルが選択されているかチェック
   */
  const hasFile = (): boolean => {
    return file !== null;
  };

  // 親コンポーネントから呼び出せるメソッドを公開
  useImperativeHandle(ref, () => ({
    upload,
    hasFile,
  }));

  return (
    <div className="space-y-4">
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
                id="vehicle-registration-upload"
              />
            </label>
            <p className="text-base text-slate-600">
              対応形式: 画像（JPG, PNG, WebP）、PDF / 最大サイズ: 10MB
            </p>
          </div>
        )}

        {/* ファイルプレビュー */}
        {file && !uploadedFileId && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border">
              {previewUrl ? (
                <div className="relative w-32 h-32 rounded border overflow-hidden">
                  <Image
                    src={previewUrl}
                    alt="車検証プレビュー"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-slate-200 rounded border">
                  <FileText className="h-8 w-8 text-slate-700" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium truncate">{file.name}</p>
                <p className="text-base text-slate-700">{formatFileSize(file.size)}</p>
                {isUploading ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                    <span className="text-base text-slate-600">アップロード中...</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleFileRemove}
                    className="mt-2 h-7"
                  >
                    <X className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                )}
              </div>
            </div>

            {/* エラーメッセージ */}
            {uploadError && (
              <ErrorMessage
                code={undefined}
                message={uploadError}
                category={ErrorCategory.CLIENT_ERROR}
              />
            )}
          </div>
        )}

        {/* アップロード完了 */}
        {uploadedFileId && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-300">
            <CheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-base font-medium text-green-900">
                車検証をアップロードしました
              </p>
              <p className="text-base text-green-800 mt-1">
                ファイルID: {uploadedFileId}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={handleFileRemove}
            >
              再アップロード
            </Button>
          </div>
        )}
    </div>
  );
});

VehicleRegistrationUpload.displayName = "VehicleRegistrationUpload";
























