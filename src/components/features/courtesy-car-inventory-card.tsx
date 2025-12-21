"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car } from "lucide-react";
import { CourtesyCar } from "@/types";

interface CourtesyCarInventoryCardProps {
  cars: CourtesyCar[];
}

/**
 * 代車在庫カード
 */
export function CourtesyCarInventoryCard({
  cars,
}: CourtesyCarInventoryCardProps) {
  const availableCount = cars.filter((c) => c.status === "available").length;
  const inUseCount = cars.filter((c) => c.status === "in_use").length;
  const inspectionCount = cars.filter((c) => c.status === "inspection").length;
  const totalCount = cars.length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center">
            <Car className="h-3 w-3 text-white" />
          </div>
          代車
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">空き</span>
            <span className="text-base font-bold text-green-600">
              {availableCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">使用中</span>
            <span className="text-base font-bold text-orange-600">
              {inUseCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">点検中</span>
            <span className="text-base font-bold text-red-600">
              {inspectionCount}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-slate-100">
            <span className="text-sm text-slate-600">全</span>
            <span className="text-base font-bold text-slate-900">
              {totalCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
