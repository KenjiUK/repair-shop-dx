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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, FileText, Calendar, LogOut } from "lucide-react";
import { ZohoJob, InspectionChecklist } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface InspectionCheckoutChecklistDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** ダイアログの開閉ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** ジョブ情報 */
  job: ZohoJob | null;
  /** チェックリスト情報 */
  checklist: InspectionChecklist | null;
  /** チェックリストの変更ハンドラ */
  onChecklistChange: (checklist: InspectionChecklist) => void;
  /** 確定ボタンのクリックハンドラ */
  onConfirm: () => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function InspectionCheckoutChecklistDialog({
  open,
  onOpenChange,
  job,
  checklist,
  onChecklistChange,
  onConfirm,
  disabled = false,
}: InspectionCheckoutChecklistDialogProps) {
  const [localChecklist, setLocalChecklist] = useState<InspectionChecklist | null>(checklist);
  const [checkoutNote, setCheckoutNote] = useState<string>("");

  // ダイアログが開いたときに初期値を設定
  useEffect(() => {
    if (open && job) {
      if (checklist) {
        setLocalChecklist(checklist);
        setCheckoutNote(checklist.checkoutNote || "");
      } else {
        // 既存のチェックリストがない場合、入庫時の情報を保持して出庫時のみ初期化
        setLocalChecklist({
          jobId: job.id,
          entryItems: {
            vehicleRegistration: false,
            compulsoryInsurance: false,
            automobileTax: false,
            key: false,
            wheelLockNut: false,
            etcCard: false,
            valuables: false,
          },
          checkoutItems: {
            vehicleRegistration: false,
            inspectionRecord: false,
            compulsoryInsurance: false,
            recordBook: false,
            key: false,
            wheelLockNut: false,
            etcCardRemoved: false,
            wheelTightening: false,
          },
          entryNote: null,
          checkoutNote: null,
          entryCheckedAt: null,
          checkoutCheckedAt: null,
        });
        setCheckoutNote("");
      }
    }
  }, [open]); // openがtrueになったときのみ初期化するように修正（cascading renders防止）

  // チェック項目の変更
  const handleItemChange = (key: keyof InspectionChecklist["checkoutItems"], checked: boolean) => {
    if (!localChecklist) return;
    setLocalChecklist({
      ...localChecklist,
      checkoutItems: {
        ...localChecklist.checkoutItems,
        [key]: checked,
      },
    });
  };

  // 確定ボタンのクリック
  const handleConfirm = () => {
    if (!localChecklist || !job) return;
    
    const updatedChecklist: InspectionChecklist = {
      ...localChecklist,
      checkoutNote: checkoutNote.trim() || null,
      checkoutCheckedAt: new Date().toISOString(),
    };
    
    onChecklistChange(updatedChecklist);
    onConfirm();
    onOpenChange(false);
  };

  if (!job) return null;

  const customerName = job.field4?.name ?? "未登録";
  const vehicleInfo = job.field6?.name ?? "車両未登録";
  const checkoutDateTime = new Date().toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <LogOut className="h-5 w-5 text-green-700 shrink-0" />
            車検出庫チェックリスト
          </DialogTitle>
          <DialogDescription>
            出庫時の確認項目をチェックしてください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 顧客・車両情報 */}
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="flex items-center gap-2 text-base font-medium text-slate-900">
              <FileText className="h-4 w-4 text-slate-700 shrink-0" />
              {customerName}様
            </div>
            <div className="mt-1 text-base text-slate-800">{vehicleInfo}</div>
            <div className="mt-1 flex items-center gap-1.5 text-base text-slate-800">
              <Calendar className="h-4 w-4 shrink-0" /> {/* h-3.5 w-3.5 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠) */}
              出庫日時: {checkoutDateTime}
            </div>
          </div>

          {/* チェック項目 */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-green-700 shrink-0" />
              出庫時確認項目
            </Label>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="checkout-vehicleRegistration"
                  checked={localChecklist?.checkoutItems.vehicleRegistration || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("vehicleRegistration", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="checkout-vehicleRegistration" className="flex-1 cursor-pointer text-base">
                  車検証
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="checkout-inspectionRecord"
                  checked={localChecklist?.checkoutItems.inspectionRecord || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("inspectionRecord", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="checkout-inspectionRecord" className="flex-1 cursor-pointer text-base">
                  自動車検査証記録事項
                  <span className="text-base text-slate-700 ml-1">（プリントアウトしてお渡し）</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="checkout-compulsoryInsurance"
                  checked={localChecklist?.checkoutItems.compulsoryInsurance || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("compulsoryInsurance", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="checkout-compulsoryInsurance" className="flex-1 cursor-pointer text-base">
                  自賠責
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="checkout-recordBook"
                  checked={localChecklist?.checkoutItems.recordBook || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("recordBook", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="checkout-recordBook" className="flex-1 cursor-pointer text-base">
                  記録簿
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="checkout-key"
                  checked={localChecklist?.checkoutItems.key || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("key", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="checkout-key" className="flex-1 cursor-pointer text-base">
                  鍵
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="checkout-wheelLockNut"
                  checked={localChecklist?.checkoutItems.wheelLockNut || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("wheelLockNut", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="checkout-wheelLockNut" className="flex-1 cursor-pointer text-base">
                  ホイールロックナット（有れば）
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="checkout-etcCardRemoved"
                  checked={localChecklist?.checkoutItems.etcCardRemoved || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("etcCardRemoved", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="checkout-etcCardRemoved" className="flex-1 cursor-pointer text-base">
                  ETCカード抜き忘れ
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="checkout-wheelTightening"
                  checked={localChecklist?.checkoutItems.wheelTightening || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("wheelTightening", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="checkout-wheelTightening" className="flex-1 cursor-pointer text-base">
                  ホイール増し締め
                  <span className="text-base text-slate-700 ml-1">（お客様と確認）</span>
                </Label>
              </div>
            </div>
          </div>

          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="checkoutNote" className="text-base font-medium">
              備考
            </Label>
            <Textarea
              id="checkoutNote"
              value={checkoutNote}
              onChange={(e) => setCheckoutNote(e.target.value)}
              placeholder="備考があれば入力してください"
              className="min-h-20"
              disabled={disabled}
            />
          </div>
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
            disabled={disabled || !localChecklist}
            className="bg-green-600 hover:bg-green-700"
          >
            チェック完了
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}







