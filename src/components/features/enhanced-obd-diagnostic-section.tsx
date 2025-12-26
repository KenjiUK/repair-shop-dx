/**
 * 拡張OBD診断結果セクション
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 * 
 * 機能:
 * - エラーコードの詳細記録
 * - 診断ツール名の記録
 * - エラーコードの重要度・ステータス管理
 * - 対処法の記録
 * - 関連写真の添付
 */

"use client";

import { useState } from "react";
import { Plus, X, AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ErrorCode, EnhancedOBDDiagnosticResult } from "@/types";

export interface EnhancedOBDDiagnosticSectionProps {
  /** OBD診断結果データ */
  result: EnhancedOBDDiagnosticResult | null;
  /** 変更時のコールバック */
  onChange: (result: EnhancedOBDDiagnosticResult) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * エラーコード項目コンポーネント
 */
function ErrorCodeItem({
  errorCode,
  index,
  onUpdate,
  onRemove,
  disabled,
}: {
  errorCode: ErrorCode;
  index: number;
  onUpdate: (updates: Partial<ErrorCode>) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const getSeverityColor = (severity: ErrorCode["severity"]) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700 border-red-400";
      case "medium":
        return "bg-amber-100 text-amber-900 border-amber-400"; // yellow → amber, text-amber-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-400";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getStatusColor = (status: ErrorCode["status"]) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-700 border-green-400";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-400";
      case "active":
        return "bg-red-100 text-red-700 border-red-400";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getSeverityLabel = (severity: ErrorCode["severity"]) => {
    switch (severity) {
      case "high":
        return "高";
      case "medium":
        return "中";
      case "low":
        return "低";
      default:
        return "不明";
    }
  };

  const getStatusLabel = (status: ErrorCode["status"]) => {
    switch (status) {
      case "resolved":
        return "解決済み";
      case "pending":
        return "対応中";
      case "active":
        return "未対応";
      default:
        return "不明";
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* エラーコード */}
          <div>
            <Label className="text-base text-slate-800">エラーコード *</Label>
            <Input
              value={errorCode.code}
              onChange={(e) => onUpdate({ code: e.target.value.toUpperCase() })}
              placeholder="P0301"
              className="mt-1 h-12 text-base font-mono"
              disabled={disabled}
            />
          </div>

          {/* 重要度 */}
          <div>
            <Label className="text-base text-slate-800">重要度</Label>
            <Select
              value={errorCode.severity}
              onValueChange={(value: ErrorCode["severity"]) => onUpdate({ severity: value })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1 h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">低</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="high">高</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 説明 */}
          <div className="md:col-span-2">
            <Label className="text-base text-slate-800">説明</Label>
            <Input
              value={errorCode.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value || null })}
              placeholder="エラーコードの説明を入力"
              className="mt-1 h-12 text-base"
              disabled={disabled}
            />
          </div>

          {/* ステータス */}
          <div>
            <Label className="text-base text-slate-800">ステータス</Label>
            <Select
              value={errorCode.status}
              onValueChange={(value: ErrorCode["status"]) => onUpdate({ status: value })}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1 h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">未対応</SelectItem>
                <SelectItem value="pending">対応中</SelectItem>
                <SelectItem value="resolved">解決済み</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 対処法 */}
          <div className="md:col-span-2">
            <Label className="text-base text-slate-800">対処法</Label>
            <Textarea
              value={errorCode.resolution || ""}
              onChange={(e) => onUpdate({ resolution: e.target.value || null })}
              placeholder="対処法を入力"
              className="mt-1 min-h-[60px] text-base"
              disabled={disabled}
            />
          </div>
        </div>

        {/* 削除ボタン */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          className="shrink-0 h-12 w-12 text-red-700 hover:text-red-800 hover:bg-red-50"
        >
          <X className="h-5 w-5 shrink-0" />
        </Button>
      </div>

      {/* ステータスバッジ */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className={cn("text-base", getSeverityColor(errorCode.severity))}
        >
          {getSeverityLabel(errorCode.severity)}
        </Badge>
        <Badge
          variant="outline"
          className={cn("text-base", getStatusColor(errorCode.status))}
        >
          {getStatusLabel(errorCode.status)}
        </Badge>
      </div>
    </div>
  );
}

/**
 * 拡張OBD診断結果セクション
 */
export function EnhancedOBDDiagnosticSection({
  result,
  onChange,
  disabled = false,
  className,
}: EnhancedOBDDiagnosticSectionProps) {
  const [localResult, setLocalResult] = useState<EnhancedOBDDiagnosticResult>(
    result || {
      errorCodes: [],
      diagnosticDate: new Date().toISOString(),
      diagnosticTool: null,
      notes: null,
    }
  );

  // ローカル状態を更新して親に通知
  const updateResult = (updates: Partial<EnhancedOBDDiagnosticResult>) => {
    const updated = { ...localResult, ...updates };
    setLocalResult(updated);
    onChange(updated);
  };

  // エラーコードを追加
  const handleAddErrorCode = () => {
    const newErrorCode: ErrorCode = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code: "",
      description: null,
      severity: "medium",
      status: "active",
      resolution: null,
      photos: [],
    };
    updateResult({
      errorCodes: [...localResult.errorCodes, newErrorCode],
    });
  };

  // エラーコードをIDで検索して更新
  const handleUpdateErrorCodeById = (id: string, updates: Partial<ErrorCode>) => {
    const updatedCodes = localResult.errorCodes.map((code) =>
      (code.id || "") === id ? { ...code, ...updates } : code
    );
    updateResult({ errorCodes: updatedCodes });
  };

  // エラーコードをIDで削除
  const handleRemoveErrorCodeById = (id: string) => {
    const updatedCodes = localResult.errorCodes.filter(
      (code) => (code.id || "") !== id
    );
    updateResult({ errorCodes: updatedCodes });
  };


  return (
    <Card className={cn("border border-slate-300 rounded-xl shadow-md", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <FileText className="h-5 w-5 shrink-0" />
          OBD診断結果（詳細）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 診断ツール */}
        <div>
          <Label className="text-base font-medium">診断ツール</Label>
          <Input
            value={localResult.diagnosticTool || ""}
            onChange={(e) =>
              updateResult({ diagnosticTool: e.target.value || null })
            }
            placeholder="診断ツール名（例: OBD-II Scanner）"
            className="mt-1 h-12 text-base"
            disabled={disabled}
          />
        </div>

        {/* 診断日時 */}
        <div>
          <Label className="text-base font-medium">診断日時</Label>
          <Input
            type="datetime-local"
            value={
              localResult.diagnosticDate
                ? new Date(localResult.diagnosticDate)
                    .toISOString()
                    .slice(0, 16)
                : ""
            }
            onChange={(e) =>
              updateResult({
                diagnosticDate: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : new Date().toISOString(),
              })
            }
            className="mt-1 h-12 text-base"
            disabled={disabled}
          />
        </div>

        {/* エラーコードリスト */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">エラーコード</Label>
            <Badge variant="secondary" className="text-base">
              {localResult.errorCodes.length}件
            </Badge>
          </div>
          <div className="space-y-3">
            {localResult.errorCodes.map((errorCode, index) => {
              const codeId = errorCode.id || `error-${index}`;
              return (
                <ErrorCodeItem
                  key={codeId}
                  errorCode={errorCode}
                  index={index}
                  onUpdate={(updates) => handleUpdateErrorCodeById(codeId, updates)}
                  onRemove={() => handleRemoveErrorCodeById(codeId)}
                  disabled={disabled}
                />
              );
            })}
            {localResult.errorCodes.length === 0 && (
              <div className="text-center py-8 text-slate-700 text-base">
                エラーコードが登録されていません
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleAddErrorCode}
              disabled={disabled}
              className="w-full h-12 text-base font-medium"
            >
              <Plus className="h-5 w-5 mr-2 shrink-0" />
              エラーコードを追加
            </Button>
          </div>
        </div>

        {/* 備考 */}
        <div>
          <Label className="text-base font-medium">備考</Label>
          <Textarea
            value={localResult.notes || ""}
            onChange={(e) => updateResult({ notes: e.target.value || null })}
            placeholder="その他の診断結果やメモを入力"
            className="mt-1 min-h-[80px] text-base"
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}




