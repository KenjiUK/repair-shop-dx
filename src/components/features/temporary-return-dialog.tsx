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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Home, Car, Calendar, Clock } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export interface TemporaryReturnDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** ダイアログの開閉ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** 一時帰宅かどうか */
  isTemporaryReturn: boolean | null;
  /** 一時帰宅の変更ハンドラ */
  onTemporaryReturnChange: (isTemporaryReturn: boolean) => void;
  /** 再入庫予定日時 */
  reentryDateTime: string | null;
  /** 再入庫予定日時の変更ハンドラ */
  onReentryDateTimeChange: (dateTime: string | null) => void;
  /** 確定ボタンのクリックハンドラ */
  onConfirm: () => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function TemporaryReturnDialog({
  open,
  onOpenChange,
  isTemporaryReturn,
  onTemporaryReturnChange,
  reentryDateTime,
  onReentryDateTimeChange,
  onConfirm,
  disabled = false,
}: TemporaryReturnDialogProps) {
  const [localIsTemporaryReturn, setLocalIsTemporaryReturn] = useState<boolean | null>(isTemporaryReturn);
  const [localReentryDate, setLocalReentryDate] = useState<string>("");
  const [localReentryTime, setLocalReentryTime] = useState<string>("");

  // ダイアログが開いたときに初期値を設定
  useEffect(() => {
    if (open) {
      setLocalIsTemporaryReturn(isTemporaryReturn);
      if (reentryDateTime) {
        const date = new Date(reentryDateTime);
        setLocalReentryDate(date.toISOString().split("T")[0]);
        setLocalReentryTime(date.toTimeString().slice(0, 5));
      } else {
        // デフォルト: 明日の10:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setLocalReentryDate(tomorrow.toISOString().split("T")[0]);
        setLocalReentryTime("10:00");
      }
    }
  }, [open, isTemporaryReturn, reentryDateTime]);

  // 確定ボタンのクリック
  const handleConfirm = () => {
    if (localIsTemporaryReturn === null) {
      // 選択されていない場合は入庫をデフォルトとする
      onTemporaryReturnChange(false);
      onReentryDateTimeChange(null);
    } else if (localIsTemporaryReturn) {
      // 一時帰宅の場合、再入庫予定日時を設定
      if (localReentryDate && localReentryTime) {
        const dateTime = new Date(`${localReentryDate}T${localReentryTime}:00`);
        onReentryDateTimeChange(dateTime.toISOString());
      } else {
        onReentryDateTimeChange(null);
      }
    } else {
      // 入庫の場合
      onReentryDateTimeChange(null);
    }
    onTemporaryReturnChange(localIsTemporaryReturn ?? false);
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Home className="h-5 w-5 text-orange-700 shrink-0" />
            診断後の処理
          </DialogTitle>
          <DialogDescription>
            診断完了後の処理を選択してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 一時帰宅/入庫の選択 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">処理方法</Label>
            <RadioGroup
              value={localIsTemporaryReturn === null ? "" : localIsTemporaryReturn ? "temporary" : "stay"}
              onValueChange={(value) => {
                setLocalIsTemporaryReturn(value === "temporary" ? true : value === "stay" ? false : null);
              }}
              disabled={disabled}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer">
                <RadioGroupItem value="temporary" id="temporary" />
                <Label htmlFor="temporary" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-blue-700 shrink-0" />
                    <div>
                      <div className="font-medium">一時帰宅</div>
                      <div className="text-base text-slate-700">顧客が車を持ち帰り、後日再入庫</div>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-slate-50 cursor-pointer">
                <RadioGroupItem value="stay" id="stay" />
                <Label htmlFor="stay" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-green-700 shrink-0" />
                    <div>
                      <div className="font-medium">入庫</div>
                      <div className="text-base text-slate-700">車をそのまま入庫</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 再入庫予定日時（一時帰宅の場合のみ表示） */}
          {localIsTemporaryReturn && (
            <div className="space-y-3 p-3 bg-blue-50 rounded-md border border-blue-300">
              <Label className="text-base font-medium text-blue-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0" />
                再入庫予定日時
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="reentry-date" className="text-base text-blue-900">
                    日付
                  </Label>
                  <Input
                    id="reentry-date"
                    type="date"
                    value={localReentryDate}
                    onChange={(e) => setLocalReentryDate(e.target.value)}
                    className="h-12 bg-white"
                    disabled={disabled}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reentry-time" className="text-base text-blue-900 flex items-center gap-1">
                    <Clock className="h-4 w-4 shrink-0" /> {/* h-3 w-3 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠) */}
                    時刻
                  </Label>
                  <Input
                    id="reentry-time"
                    type="time"
                    value={localReentryTime}
                    onChange={(e) => setLocalReentryTime(e.target.value)}
                    className="h-12 bg-white"
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={disabled}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={disabled || localIsTemporaryReturn === null}
            className="bg-orange-600 hover:bg-orange-700"
          >
            確定
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}







