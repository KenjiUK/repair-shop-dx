"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Clock, AlertCircle, FileText } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface DiagnosisFeeDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** ダイアログの開閉ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** 診断料金 */
  diagnosisFee: number | null;
  /** 診断料金の変更ハンドラ */
  onDiagnosisFeeChange: (fee: number | null) => void;
  /** 診断時間（分） */
  diagnosisDuration: number | null;
  /** 診断時間の変更ハンドラ */
  onDiagnosisDurationChange: (duration: number | null) => void;
  /** 常連顧客かどうか */
  isRegularCustomer?: boolean;
  /** 確定ボタンのクリックハンドラ */
  onConfirm: () => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function DiagnosisFeeDialog({
  open,
  onOpenChange,
  diagnosisFee,
  onDiagnosisFeeChange,
  diagnosisDuration,
  onDiagnosisDurationChange,
  isRegularCustomer = false,
  onConfirm,
  disabled = false,
}: DiagnosisFeeDialogProps) {
  const [localFee, setLocalFee] = useState<number | null>(diagnosisFee);
  const [localDuration, setLocalDuration] = useState<number | null>(diagnosisDuration);
  const [customFee, setCustomFee] = useState<string>("");

  // ダイアログが開いたときに初期値を設定
  useEffect(() => {
    if (!open) return;
    
    // 次のレンダリングサイクルで状態を更新
    const updateTimer = setTimeout(() => {
      // 常連顧客の場合は自動で¥0に設定
      if (isRegularCustomer && diagnosisFee === null) {
        setLocalFee(0);
        onDiagnosisFeeChange(0);
      } else {
        setLocalFee(diagnosisFee);
      }
      setLocalDuration(diagnosisDuration);
      setCustomFee("");
    }, 0);
    
    return () => clearTimeout(updateTimer);
  }, [open, diagnosisFee, diagnosisDuration, isRegularCustomer, onDiagnosisFeeChange]);

  // 診断料金の選択肢が変更されたとき
  const handleFeeSelectChange = (value: string) => {
    if (value === "custom") {
      setLocalFee(null);
      onDiagnosisFeeChange(null);
    } else {
      const fee = parseInt(value);
      setLocalFee(fee);
      onDiagnosisFeeChange(fee);
      setCustomFee("");
    }
  };

  // カスタム料金の入力
  const handleCustomFeeChange = (value: string) => {
    setCustomFee(value);
    const fee = parseInt(value);
    if (!isNaN(fee) && fee >= 0) {
      setLocalFee(fee);
      onDiagnosisFeeChange(fee);
    } else {
      setLocalFee(null);
      onDiagnosisFeeChange(null);
    }
  };

  // 確定ボタンのクリック
  const handleConfirm = () => {
    onDiagnosisFeeChange(localFee);
    onDiagnosisDurationChange(localDuration);
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calculator className="h-5 w-5 text-orange-700 shrink-0" />
            診断料金（任意）
          </DialogTitle>
          <DialogDescription>
            診断料金を入力してください。見積画面でも変更可能です。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 診断時間（概算） */}
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-700 shrink-0" />
              診断時間（概算）
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={localDuration || ""}
                onChange={(e) => {
                  const duration = parseInt(e.target.value);
                  setLocalDuration(isNaN(duration) ? null : duration);
                  onDiagnosisDurationChange(isNaN(duration) ? null : duration);
                }}
                placeholder="分"
                className="w-24 h-12"
                disabled={disabled}
              />
              <span className="text-base text-slate-700">分</span>
            </div>
            <p className="text-base text-slate-700">
              参考情報として記録します（厳密な時間計測不要）
            </p>
          </div>

          {/* 診断料金選択 */}
          <div className="space-y-2">
            <Label className="text-base font-medium">診断料金</Label>
            <Select
              value={localFee === null ? "custom" : localFee.toString()}
              onValueChange={handleFeeSelectChange}
              disabled={disabled || isRegularCustomer}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="診断料金を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">無料</SelectItem>
                <SelectItem value="3000">¥3,000</SelectItem>
                <SelectItem value="5000">¥5,000</SelectItem>
                <SelectItem value="10000">¥10,000</SelectItem>
                <SelectItem value="custom">その他（手動入力）</SelectItem>
              </SelectContent>
            </Select>
            
            {/* その他の場合の手動入力 */}
            {localFee === null && (
              <Input
                type="number"
                min="0"
                value={customFee}
                onChange={(e) => handleCustomFeeChange(e.target.value)}
                placeholder="金額を入力（円）"
                className="h-12"
                disabled={disabled}
              />
            )}
            
            {/* 常連顧客の場合の表示 */}
            {isRegularCustomer && (
              <div className="flex items-center gap-2 text-base text-green-700 bg-green-50 p-2 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>常連顧客のため自動で無料に設定されています（上書き可能）</span>
              </div>
            )}
            
            <p className="text-base text-slate-700">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-slate-700" /> {/* h-3.5 w-3.5 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠) */}
                注意: 見積画面でも変更可能です
              </span>
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={disabled}
          >
            スキップ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={disabled}
            className="bg-orange-600 hover:bg-orange-700"
          >
            確定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}







