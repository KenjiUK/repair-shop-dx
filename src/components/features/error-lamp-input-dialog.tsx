"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorLampInfo, ErrorLampType, ERROR_LAMP_TYPES, ERROR_LAMP_TYPE_DISPLAY_NAMES } from "@/lib/error-lamp-types";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface ErrorLampInputDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** エラーランプ情報 */
  errorLampInfo?: ErrorLampInfo;
  /** 確定ハンドラ */
  onConfirm: (info: ErrorLampInfo) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ErrorLampInputDialog({
  open,
  onOpenChange,
  errorLampInfo,
  onConfirm,
  disabled = false,
}: ErrorLampInputDialogProps) {
  const [hasErrorLamp, setHasErrorLamp] = useState(errorLampInfo?.hasErrorLamp ?? false);
  const [selectedTypes, setSelectedTypes] = useState<ErrorLampType[]>(
    errorLampInfo?.lampTypes ?? []
  );
  const [otherDetails, setOtherDetails] = useState(errorLampInfo?.otherDetails ?? "");

  // 種類の選択/解除
  const handleTypeToggle = (type: ErrorLampType) => {
    if (disabled) return;
    
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // 確定
  const handleConfirm = () => {
    const info: ErrorLampInfo = {
      hasErrorLamp,
      lampTypes: hasErrorLamp ? selectedTypes : [],
      otherDetails: selectedTypes.includes("その他") ? otherDetails : undefined,
    };
    onConfirm(info);
    onOpenChange(false);
  };

  // キャンセル
  const handleCancel = () => {
    // 状態をリセット
    setHasErrorLamp(errorLampInfo?.hasErrorLamp ?? false);
    setSelectedTypes(errorLampInfo?.lampTypes ?? []);
    setOtherDetails(errorLampInfo?.otherDetails ?? "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            エラーランプ情報
          </DialogTitle>
          <DialogDescription>
            故障診断のため、エラーランプの有無と種類を入力してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* エラーランプの有無 */}
          <div className="space-y-2">
            <Label>エラーランプは点灯していますか？</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={hasErrorLamp ? "default" : "outline"}
                onClick={() => {
                  if (!disabled) {
                    setHasErrorLamp(true);
                  }
                }}
                disabled={disabled}
                className="flex-1"
              >
                点灯している
              </Button>
              <Button
                type="button"
                variant={!hasErrorLamp ? "default" : "outline"}
                onClick={() => {
                  if (!disabled) {
                    setHasErrorLamp(false);
                    setSelectedTypes([]);
                    setOtherDetails("");
                  }
                }}
                disabled={disabled}
                className="flex-1"
              >
                点灯していない
              </Button>
            </div>
          </div>

          {/* エラーランプの種類（点灯している場合のみ） */}
          {hasErrorLamp && (
            <div className="space-y-2">
              <Label>エラーランプの種類（複数選択可）</Label>
              <div className="grid grid-cols-2 gap-2">
                {ERROR_LAMP_TYPES.map((type) => (
                  <div
                    key={type}
                    className="flex items-center space-x-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleTypeToggle(type)}
                  >
                    <Checkbox
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => handleTypeToggle(type)}
                      disabled={disabled}
                    />
                    <Label className="text-sm font-normal cursor-pointer">
                      {ERROR_LAMP_TYPE_DISPLAY_NAMES[type]}
                    </Label>
                  </div>
                ))}
              </div>

              {/* その他の詳細入力 */}
              {selectedTypes.includes("その他") && (
                <div className="space-y-2">
                  <Label>その他の詳細</Label>
                  <Input
                    value={otherDetails}
                    onChange={(e) => {
                      if (!disabled) {
                        setOtherDetails(e.target.value);
                      }
                    }}
                    placeholder="エラーランプの詳細を入力..."
                    disabled={disabled}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={disabled}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={disabled || (hasErrorLamp && selectedTypes.length === 0)}
          >
            確定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}















