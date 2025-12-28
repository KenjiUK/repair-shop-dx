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
import { Car, Loader2 } from "lucide-react";
import { CourtesyCar } from "@/types";
import { cn } from "@/lib/utils";

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
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  // 配列でない場合のエラーハンドリング
  const safeCars = Array.isArray(cars) ? cars : [];
  // 利用可能な代車: available または reserving ステータス（checkIn APIと整合性を保つ）
  const availableCars = safeCars.filter((c) => c.status === "available" || c.status === "reserving");

  // ダイアログが閉じられたら選択状態をリセット
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedCarId(null);
      setIsSkipping(false);
    }
    onOpenChange(newOpen);
  };

  const handleSelect = (carId: string) => {
    if (isProcessing) return;
    setSelectedCarId(carId);
    setIsSkipping(false);
    onSelect(carId);
  };

  const handleSkip = () => {
    if (isProcessing) return;
    setSelectedCarId(null);
    setIsSkipping(true);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
                {availableCars.map((car) => {
                  const isSelected = selectedCarId === car.carId;
                  const isProcessingThis = isProcessing && isSelected;

                  return (
                    <Button
                      key={car.carId}
                      variant="outline"
                      className={cn(
                        "w-full h-auto min-h-[88px] flex flex-col items-center justify-center gap-1.5 px-2 py-3 transition-all",
                        isProcessingThis
                          ? "bg-primary/10 border-primary cursor-wait"
                          : "hover:bg-primary hover:text-primary-foreground",
                        isProcessing && !isSelected && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleSelect(car.carId)}
                      disabled={isProcessing && !isSelected}
                    >
                      {isProcessingThis ? (
                        <div className="flex flex-col items-center gap-1">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-base">処理中...</span>
                        </div>
                      ) : (
                        <>
                          <Car className="h-5 w-5 shrink-0" />
                          <span
                            className="w-full text-base font-semibold text-center overflow-hidden text-ellipsis whitespace-nowrap px-1"
                            title={car.name}
                          >
                            {car.name}
                          </span>
                          {car.licensePlate && (
                            <span className="w-full text-sm text-slate-700 text-center overflow-hidden text-ellipsis whitespace-nowrap px-1">
                              {car.licensePlate}
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-700">
                <Car className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>利用可能な代車がありません</p>
              </div>
            )}

            {/* 代車不要ボタン */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className={cn(
                  "w-full transition-all",
                  isSkipping && isProcessing && "bg-primary/10 border-primary cursor-wait"
                )}
                onClick={handleSkip}
                disabled={isProcessing && !isSkipping}
              >
                {isSkipping && isProcessing ? (
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








