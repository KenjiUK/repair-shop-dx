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
import { ClipboardCheck, FileText, Calendar } from "lucide-react";
import { ZohoJob, InspectionChecklist } from "@/types";

// =============================================================================
// Types
// =============================================================================

export interface InspectionEntryChecklistDialogProps {
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

export function InspectionEntryChecklistDialog({
  open,
  onOpenChange,
  job,
  checklist,
  onChecklistChange,
  onConfirm,
  disabled = false,
}: InspectionEntryChecklistDialogProps) {
  const [localChecklist, setLocalChecklist] = useState<InspectionChecklist | null>(checklist);
  const [entryNote, setEntryNote] = useState<string>("");

  // ダイアログが開いたときに初期値を設定
  useEffect(() => {
    if (open && job) {
      if (checklist) {
        setLocalChecklist(checklist);
        setEntryNote(checklist.entryNote || "");
      } else {
        // 新規作成
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
        setEntryNote("");
      }
    }
  }, [open]); // openがtrueになったときのみ初期化するように修正（cascading renders防止）

  // チェック項目の変更
  const handleItemChange = (key: keyof InspectionChecklist["entryItems"], checked: boolean) => {
    if (!localChecklist) return;
    setLocalChecklist({
      ...localChecklist,
      entryItems: {
        ...localChecklist.entryItems,
        [key]: checked,
      },
    });
  };

  // 確定ボタンのクリック
  const handleConfirm = () => {
    if (!localChecklist || !job) return;
    
    const updatedChecklist: InspectionChecklist = {
      ...localChecklist,
      entryNote: entryNote.trim() || null,
      entryCheckedAt: new Date().toISOString(),
    };
    
    onChecklistChange(updatedChecklist);
    onConfirm();
    onOpenChange(false);
  };

  if (!job) return null;

  const customerName = job.field4?.name ?? "未登録";
  const vehicleInfo = job.field6?.name ?? "車両未登録";
  const arrivalDateTime = job.field22 
    ? new Date(job.field22).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--/-- --:--";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ClipboardCheck className="h-5 w-5 text-blue-700 shrink-0" />
            車検入庫チェックリスト
          </DialogTitle>
          <DialogDescription className="text-base text-slate-700">
            入庫時の確認項目をチェックしてください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 顧客・車両情報 */}
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="flex items-center gap-2 text-base font-medium text-slate-900">
              <FileText className="h-5 w-5 text-slate-700 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
              {customerName}様
            </div>
            <div className="mt-1 text-base text-slate-800">{vehicleInfo}</div>
            <div className="mt-1 flex items-center gap-1.5 text-base text-slate-800">
              <Calendar className="h-4 w-4 shrink-0" />
              入庫日時: {arrivalDateTime}
            </div>
          </div>

          {/* チェック項目 */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-700 shrink-0" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
              入庫時確認項目
            </Label>
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="vehicleRegistration"
                  checked={localChecklist?.entryItems.vehicleRegistration || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("vehicleRegistration", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="vehicleRegistration" className="flex-1 cursor-pointer text-base">
                  車検証
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="compulsoryInsurance"
                  checked={localChecklist?.entryItems.compulsoryInsurance || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("compulsoryInsurance", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="compulsoryInsurance" className="flex-1 cursor-pointer text-base">
                  自賠責
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="automobileTax"
                  checked={localChecklist?.entryItems.automobileTax || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("automobileTax", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="automobileTax" className="flex-1 cursor-pointer text-base">
                  自動車税
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="key"
                  checked={localChecklist?.entryItems.key || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("key", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="key" className="flex-1 cursor-pointer text-base">
                  鍵
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="wheelLockNut"
                  checked={localChecklist?.entryItems.wheelLockNut || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("wheelLockNut", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="wheelLockNut" className="flex-1 cursor-pointer text-base">
                  ホイールロックナット（有れば）
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="etcCard"
                  checked={localChecklist?.entryItems.etcCard || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("etcCard", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="etcCard" className="flex-1 cursor-pointer text-base">
                  車内ETCカード
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2.5 border rounded-md hover:bg-slate-50">
                <Checkbox
                  id="valuables"
                  checked={localChecklist?.entryItems.valuables || false}
                  onCheckedChange={(checked) => 
                    handleItemChange("valuables", checked === true)
                  }
                  disabled={disabled}
                />
                <Label htmlFor="valuables" className="flex-1 cursor-pointer text-base">
                  車内貴重品
                </Label>
              </div>
            </div>
          </div>

          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="entryNote" className="text-base font-medium">
              備考
            </Label>
            <Textarea
              id="entryNote"
              value={entryNote}
              onChange={(e) => setEntryNote(e.target.value)}
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
            className="h-12 text-base font-medium"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={disabled || !localChecklist}
            className="h-12 text-base font-medium bg-primary hover:bg-primary/90"
          >
            チェック完了
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}







