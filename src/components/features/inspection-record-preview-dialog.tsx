/**
 * 点検記録簿プレビューダイアログ
 * 
 * 点検記録簿PDFをプレビュー表示する機能
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Download, Loader2 } from "lucide-react";
import { InspectionRecordData } from "@/lib/inspection-pdf-generator";
import { InspectionTemplateType } from "@/lib/inspection-template-pdf-generator";

interface InspectionRecordPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordData: InspectionRecordData | null;
  templateType: InspectionTemplateType;
  onDownload?: () => void;
}

/**
 * 点検記録簿プレビューダイアログ
 */
export function InspectionRecordPreviewDialog({
  open,
  onOpenChange,
  recordData,
  templateType,
  onDownload,
}: InspectionRecordPreviewDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDFを生成してプレビュー用URLを作成
  useEffect(() => {
    if (!open || !recordData) {
      setPdfUrl(null);
      return;
    }

    const generatePreview = async () => {
      setIsGenerating(true);
      setError(null);

      try {
        const { generateInspectionTemplatePDF } = await import("@/lib/inspection-template-pdf-generator");
        const pdfResult = await generateInspectionTemplatePDF(recordData, templateType);

        if (!pdfResult.success || !pdfResult.data) {
          throw new Error(pdfResult.error?.message || "PDFの生成に失敗しました");
        }

        // Blob URLを作成
        const url = URL.createObjectURL(pdfResult.data);
        setPdfUrl(url);
      } catch (err) {
        console.error("PDFプレビュー生成エラー:", err);
        setError(err instanceof Error ? err.message : "PDFの生成に失敗しました");
      } finally {
        setIsGenerating(false);
      }
    };

    generatePreview();

    // クリーンアップ
    return () => {
      // pdfUrlはstateなので、クリーンアップ時には最新の値を使用
      setPdfUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return null;
      });
    };
  }, [open, recordData, templateType]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
            <Eye className="h-6 w-6" />
            点検記録簿プレビュー
          </DialogTitle>
          <DialogDescription className="text-base">
            点検記録簿の内容を確認してください
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg bg-slate-50">
          {isGenerating ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-slate-600" />
                <p className="text-base text-slate-700">PDFを生成中...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-base text-red-600 font-medium">エラーが発生しました</p>
                <p className="text-sm text-slate-600 mt-2">{error}</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full min-h-[600px] border-0"
              title="点検記録簿プレビュー"
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-base text-slate-600">データを読み込んでいます...</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-12 text-base"
          >
            閉じる
          </Button>
          {pdfUrl && (
            <Button
              onClick={handleDownload}
              className="h-12 text-base"
            >
              <Download className="h-5 w-5 mr-2" />
              ダウンロード
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

