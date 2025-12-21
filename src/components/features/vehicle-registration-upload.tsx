"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
// Component
// =============================================================================

export function VehicleRegistrationUpload({
  customerId,
  customerName,
  vehicleId,
  vehicleName,
  onUploadComplete,
}: VehicleRegistrationUploadProps) {
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
    if (!file) return;

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          車検証
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ファイル選択 */}
        {!file && !uploadedFileId && (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="vehicle-registration-upload"
            />
            <label htmlFor="vehicle-registration-upload">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                asChild
              >
                <span className="flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  車検証を選択
                </span>
              </Button>
            </label>
            <p className="text-sm text-slate-600">
              対応形式: 画像（JPG, PNG, WebP）、PDF
              <br />
              最大サイズ: 10MB
            </p>
          </div>
        )}

        {/* ファイルプレビュー */}
        {file && !uploadedFileId && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="車検証プレビュー"
                  className="w-32 h-32 object-contain rounded border"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-slate-200 rounded border">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-slate-600">{formatFileSize(file.size)}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFileRemove}
                  className="mt-2 h-7"
                >
                  <X className="h-3 w-3 mr-1" />
                  削除
                </Button>
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

            {/* アップロードボタン */}
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  アップロード中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  アップロード
                </>
              )}
            </Button>
          </div>
        )}

        {/* アップロード完了 */}
        {uploadedFileId && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                車検証をアップロードしました
              </p>
              <p className="text-xs text-green-700 mt-1">
                ファイルID: {uploadedFileId}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFileRemove}
              className="h-7"
            >
              再アップロード
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
















