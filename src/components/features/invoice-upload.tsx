"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Download,
  ExternalLink,
} from "lucide-react";
import { uploadFile, searchInvoicePdf } from "@/lib/google-drive";
import { DriveFile } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface InvoiceUploadProps {
  /** Job ID */
  jobId: string;
  /** JobフォルダID（Google Drive） */
  jobFolderId: string;
  /** 基幹システム連携ID（請求書ID） */
  baseSystemInvoiceId?: string | null;
  /** アップロード完了時のコールバック */
  onUploadComplete?: (file: DriveFile, baseSystemInvoiceId: string) => void;
  /** 基幹システム連携ID更新時のコールバック */
  onBaseSystemIdUpdate?: (baseSystemInvoiceId: string) => void;
  /** 既存の請求書PDF */
  existingInvoice?: DriveFile | null;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ファイル名が請求書PDFかどうかを検証
 * 「invoice」「seikyu」「請求書」のいずれかを含むかチェック
 */
function isValidInvoiceFileName(fileName: string): boolean {
  const lowerFileName = fileName.toLowerCase();
  return (
    lowerFileName.includes("invoice") ||
    lowerFileName.includes("seikyu") ||
    lowerFileName.includes("請求書")
  );
}

/**
 * PDFファイルかどうかを検証
 */
function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

// =============================================================================
// Components
// =============================================================================

/**
 * 請求書アップロードコンポーネント
 */
export function InvoiceUpload({
  jobId,
  jobFolderId,
  baseSystemInvoiceId,
  onUploadComplete,
  onBaseSystemIdUpdate,
  existingInvoice,
}: InvoiceUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<DriveFile | null>(
    existingInvoice || null
  );
  const [invoiceId, setInvoiceId] = useState<string>(baseSystemInvoiceId || "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイル選択ハンドラ
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setValidationError(null);
      return;
    }

    // PDFファイルかチェック
    if (!isPdfFile(file)) {
      setValidationError("PDFファイルを選択してください");
      setSelectedFile(null);
      return;
    }

    // ファイル名検証
    if (!isValidInvoiceFileName(file.name)) {
      setValidationError(
        "ファイル名に「invoice」「seikyu」「請求書」のいずれかを含めてください"
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setValidationError(null);
  };

  /**
   * アップロード処理
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("ファイルを選択してください");
      return;
    }

    // ファイル名検証（再確認）
    if (!isValidInvoiceFileName(selectedFile.name)) {
      toast.error(
        "ファイル名に「invoice」「seikyu」「請求書」のいずれかを含めてください"
      );
      return;
    }

    setIsUploading(true);
    setValidationError(null);

    try {
      // Google Driveにアップロード
      const uploaded = await uploadFile({
        fileData: selectedFile,
        parentFolderId: jobFolderId,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
      });

      setUploadedFile(uploaded);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // 基幹システム連携IDが入力されている場合、コールバックを呼び出す
      if (invoiceId.trim()) {
        if (onUploadComplete) {
          onUploadComplete(uploaded, invoiceId.trim());
        }
        if (onBaseSystemIdUpdate) {
          onBaseSystemIdUpdate(invoiceId.trim());
        }
      }

      toast.success("請求書PDFをアップロードしました", {
        description: uploaded.name,
      });
    } catch (error) {
      console.error("請求書アップロードエラー:", error);
      toast.error("アップロードに失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 基幹システム連携IDを保存
   */
  const handleSaveInvoiceId = () => {
    if (!invoiceId.trim()) {
      toast.error("基幹システム連携IDを入力してください");
      return;
    }

    if (onBaseSystemIdUpdate) {
      onBaseSystemIdUpdate(invoiceId.trim());
      toast.success("基幹システム連携IDを保存しました");
    }
  };

  /**
   * ファイルを削除
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadedFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * 既存の請求書PDFを表示
   */
  const handleViewInvoice = () => {
    if (uploadedFile?.webViewLink) {
      window.open(uploadedFile.webViewLink, "_blank");
    } else if (uploadedFile?.webContentLink) {
      window.open(uploadedFile.webContentLink, "_blank");
    } else {
      toast.error("請求書PDFのURLが取得できませんでした");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          請求書PDF管理
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基幹システム連携ID入力 */}
        <div className="space-y-2">
          <Label htmlFor="invoice-id">基幹システム連携ID（請求書ID）</Label>
          <div className="flex gap-2">
            <Input
              id="invoice-id"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="例: INV-2024-001"
              className="flex-1"
            />
            <Button
              onClick={handleSaveInvoiceId}
              variant="outline"
              size="sm"
              disabled={!invoiceId.trim()}
            >
              保存
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            基幹システム（スマートカーディーラー）で作成した請求書のIDを入力してください
          </p>
        </div>

        <Separator />

        {/* 既存の請求書PDF表示 */}
        {uploadedFile && (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-green-700">
                    アップロード済み
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={handleViewInvoice}
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleRemoveFile}
                  variant="ghost"
                  size="sm"
                  className="h-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ファイル選択 */}
        {!uploadedFile && (
          <div className="space-y-2">
            <Label htmlFor="invoice-file">請求書PDFファイル</Label>
            <div className="flex gap-2">
              <Input
                id="invoice-file"
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="flex-1"
                disabled={isUploading}
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || !!validationError}
                className="shrink-0"
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

            {/* バリデーションエラー表示 */}
            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* ファイル名要件の説明 */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-1">
                📋 ファイル名要件
              </p>
              <p className="text-xs text-blue-700">
                ファイル名に「invoice」「seikyu」「請求書」のいずれかを含めてください
              </p>
              <p className="text-xs text-blue-600 mt-1">
                例: 田中様_請求書_20241217.pdf, invoice_20241217.pdf, seikyu_20241217.pdf
              </p>
            </div>
          </div>
        )}

        {/* 基幹システムでの統合請求書作成手順 */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 mb-1">
                基幹システムでの統合請求書作成手順
              </p>
              <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside">
                <li>基幹システム（スマートカーディーラー）で統合請求書を作成・確定</li>
                <li>請求書をPDFで書き出し（ファイル名に「invoice」「seikyu」「請求書」を含める）</li>
                <li>上記の「請求書PDFファイル」からアップロード</li>
                <li>基幹システム連携ID（請求書ID）を入力して保存</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}









