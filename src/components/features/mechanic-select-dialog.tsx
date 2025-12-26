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
import { Skeleton } from "@/components/ui/skeleton";
import { User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MechanicSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  isProcessing: boolean;
  onSelect: (mechanicName: string) => void;
}

/**
 * 整備士選択ダイアログ
 * 診断開始時に担当整備士を選択する
 */
const MECHANICS = [
  { id: "mechanic-001", name: "中村" },
  { id: "mechanic-002", name: "永見" },
  { id: "mechanic-003", name: "谷口" },
  { id: "mechanic-004", name: "岡島" },
];

export function MechanicSelectDialog({
  open,
  onOpenChange,
  isLoading,
  isProcessing,
  onSelect,
}: MechanicSelectDialogProps) {
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);

  // ダイアログが閉じられたら選択状態をリセット
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMechanicId(null);
    }
    onOpenChange(newOpen);
  };

  const handleSelect = (mechanicId: string, mechanicName: string) => {
    if (isProcessing) return;
    setSelectedMechanicId(mechanicId);
    onSelect(mechanicName);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            担当整備士の選択
          </DialogTitle>
          <DialogDescription>
            診断を担当する整備士を選択してください
          </DialogDescription>
        </DialogHeader>

        {/* ローディング状態 */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 py-4">
            {MECHANICS.map((mechanic) => {
              const isSelected = selectedMechanicId === mechanic.id;
              const isProcessingThis = isProcessing && isSelected;

              return (
                <Button
                  key={mechanic.id}
                  variant="outline"
                  className={cn(
                    "h-16 text-lg font-semibold transition-all",
                    isProcessingThis
                      ? "bg-primary/10 border-primary cursor-wait"
                      : "hover:bg-primary hover:text-primary-foreground",
                    isProcessing && !isSelected && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleSelect(mechanic.id, mechanic.name)}
                  disabled={isProcessing && !isSelected}
                >
                  {isProcessingThis ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-base">処理中...</span>
                    </div>
                  ) : (
                    mechanic.name
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}








