"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { OBDDiagnosticResult } from "@/components/features/obd-diagnostic-result-section";
import { FileText, Download, Eye, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

export interface FaultDiagnosisEstimateViewProps {
  /** 原因説明 */
  causeExplanation?: string;
  /** 原因説明変更ハンドラ */
  onCauseExplanationChange?: (explanation: string) => void;
  /** 修理方法提案 */
  repairProposal?: string;
  /** 修理方法提案変更ハンドラ */
  onRepairProposalChange?: (proposal: string) => void;
  /** 診断機結果 */
  diagnosticToolResult?: OBDDiagnosticResult;
  /** 診断機結果PDF表示ハンドラ */
  onViewDiagnosticResult?: () => void;
  /** 診断機結果PDFダウンロードハンドラ */
  onDownloadDiagnosticResult?: () => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function FaultDiagnosisEstimateView({
  causeExplanation = "",
  onCauseExplanationChange,
  repairProposal = "",
  onRepairProposalChange,
  diagnosticToolResult,
  onViewDiagnosticResult,
  onDownloadDiagnosticResult,
  disabled = false,
}: FaultDiagnosisEstimateViewProps) {
  return (
    <div className="space-y-4">
      {/* 原因説明 */}
      {onCauseExplanationChange && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              原因説明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>診断結果に基づく原因の説明</Label>
              <Textarea
                value={causeExplanation}
                onChange={(e) => onCauseExplanationChange(e.target.value)}
                placeholder="診断結果から判明した原因を詳しく説明してください..."
                rows={6}
                disabled={disabled}
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                顧客に分かりやすく、技術的な内容を説明してください
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 修理方法提案 */}
      {onRepairProposalChange && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              修理方法提案
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>推奨される修理方法</Label>
              <Textarea
                value={repairProposal}
                onChange={(e) => onRepairProposalChange(e.target.value)}
                placeholder="推奨される修理方法を詳しく説明してください..."
                rows={6}
                disabled={disabled}
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                修理内容、必要な部品、作業時間、費用の目安などを記載してください
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 診断機結果PDF */}
      {diagnosticToolResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              診断機結果PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {diagnosticToolResult.fileName || "診断機結果.pdf"}
                    </p>
                    {diagnosticToolResult.uploadedAt && (
                      <p className="text-xs text-slate-500">
                        アップロード日時: {new Date(diagnosticToolResult.uploadedAt).toLocaleString("ja-JP")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onViewDiagnosticResult && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onViewDiagnosticResult}
                      disabled={disabled || !diagnosticToolResult.fileUrl}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      表示
                    </Button>
                  )}
                  {onDownloadDiagnosticResult && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onDownloadDiagnosticResult}
                      disabled={disabled || !diagnosticToolResult.fileUrl}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      ダウンロード
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}















