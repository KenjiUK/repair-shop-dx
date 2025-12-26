"use client";

import React, { useState, useRef } from "react";
import { FileText, Upload, Download, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DriveFile } from "@/types";

// =============================================================================
// 型定義
// =============================================================================

export interface OBDDiagnosticResult {
  /** PDFファイルID（Google Drive） */
  fileId?: string;
  /** PDFファイル名 */
  fileName?: string;
  /** PDFファイルURL */
  fileUrl?: string;
  /** アップロード日時 */
  uploadedAt?: string; // ISO 8601
  /** ステータス */
  status?: "uploaded" | "pending" | "error";
}

export interface OBDDiagnosticResultSectionProps {
  /** OBD診断結果データ */
  result?: OBDDiagnosticResult;
  /** アップロード時のコールバック */
  onUpload: (file: File) => void | Promise<void>;
  /** 削除時のコールバック */
  onRemove?: () => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// コンポーネント
// =============================================================================

/**
 * OBD診断結果セクション（12ヶ月点検専用）
 *
 * 機能:
 * - OBD診断結果PDFのアップロード
 * - アップロード済みPDFの表示・ダウンロード
 * - ファイル形式検証（PDFのみ）
 * - ファイルサイズチェック（10MB制限）
 */
export function OBDDiagnosticResultSection({
  result,
  onUpload,
  onRemove,
  disabled = false,
  className,
}: OBDDiagnosticResultSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = () => {
    if (disabled || isUploading) {
      return;
    }
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // ファイルリセット
    e.target.value = "";

    // ファイル形式チェック（PDFのみ）
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("PDFファイルを選択してください");
      return;
    }

    // ファイルサイズチェック（10MB制限）
    if (file.size > 10 * 1024 * 1024) {
      alert("ファイルサイズが10MBを超えています");
      return;
    }

    setIsUploading(true);

    try {
      await onUpload(file);
    } catch (error) {
      console.error("OBD診断結果のアップロードエラー:", error);
      alert("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (result?.fileUrl) {
      window.open(result.fileUrl, "_blank");
    }
  };

  const handleRemove = () => {
    if (onRemove && confirm("OBD診断結果を削除しますか？")) {
      onRemove();
    }
  };

  const hasResult = !!result?.fileId || !!result?.fileUrl;

  return (
    <Card className={cn("border border-slate-300 rounded-xl shadow-md", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5 shrink-0" />
            OBD診断結果
          </span>
          {hasResult && (
            <Badge variant="default" className="bg-green-500 text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap">
              <CheckCircle2 className="h-4 w-4 mr-1.5 shrink-0" />
              アップロード済み
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        {hasResult ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-700 dark:text-red-400 shrink-0" />
                <div>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                    {result.fileName || "OBD診断結果.pdf"}
                  </p>
                  {result.uploadedAt && (
                    <p className="text-base text-slate-700 dark:text-slate-300">
                      アップロード日時: {new Date(result.uploadedAt).toLocaleString("ja-JP")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={disabled}
                className="flex-1 h-12 text-base font-medium"
              >
                <Download className="h-4 w-4 mr-2 shrink-0" />
                ダウンロード
              </Button>
              {onRemove && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  disabled={disabled}
                  className="text-red-700 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 h-12 text-base font-medium"
                >
                  <X className="h-4 w-4 mr-2 shrink-0" />
                  削除
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center">
              <FileText className="h-12 w-12 text-slate-700 dark:text-slate-300 mx-auto mb-2 shrink-0" />
              <p className="text-base text-slate-800 dark:text-slate-300 mb-1">
                OBD診断結果PDFをアップロード
              </p>
              <p className="text-base text-slate-700 dark:text-slate-300">
                最大10MB、PDF形式のみ
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleFileSelect}
              disabled={disabled || isUploading}
              className="w-full h-12 text-base font-medium"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin mr-2 shrink-0" />
                  アップロード中...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2 shrink-0" />
                  PDFファイルを選択
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
