"use client";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {MECHANICS.map((mechanic) => (
              <Button
                key={mechanic.id}
                variant="outline"
                size="lg"
                className="h-16 text-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => onSelect(mechanic.name)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  mechanic.name
                )}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
