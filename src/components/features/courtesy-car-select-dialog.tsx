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
import { Car, Loader2 } from "lucide-react";
import { CourtesyCar } from "@/types";

interface CourtesyCarSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cars: CourtesyCar[] | undefined;
  isLoading: boolean;
  isProcessing: boolean;
  onSelect: (carId: string | null) => void;
  onSkip: () => void;
}

/**
 * 代車選択ダイアログ
 * タグ選択後、代車が必要かどうかを確認し、必要なら選択する
 */
export function CourtesyCarSelectDialog({
  open,
  onOpenChange,
  cars,
  isLoading,
  isProcessing,
  onSelect,
  onSkip,
}: CourtesyCarSelectDialogProps) {
  const availableCars = cars?.filter((c) => c.status === "available") ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            代車の貸出
          </DialogTitle>
          <DialogDescription>
            代車が必要な場合は選択してください。不要な場合は「代車不要」をクリックしてください。
          </DialogDescription>
        </DialogHeader>

        {/* ローディング状態 */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <>
            {/* 利用可能な代車一覧 */}
            {availableCars.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 py-4">
                {availableCars.map((car) => (
                  <Button
                    key={car.carId}
                    variant="outline"
                    size="lg"
                    className="h-20 flex flex-col items-center justify-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => onSelect(car.carId)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Car className="h-5 w-5" />
                        <span className="text-sm font-semibold">{car.name}</span>
                        {car.licensePlate && (
                          <span className="text-xs text-muted-foreground">
                            {car.licensePlate}
                          </span>
                        )}
                      </>
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">
                <Car className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>利用可能な代車がありません</p>
              </div>
            )}

            {/* 代車不要ボタン */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={onSkip}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  "代車不要"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
