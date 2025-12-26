"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ZohoJob } from "@/types";
import { Grid, Clock, Activity, FileText, Wrench, Car } from "lucide-react";

interface StatusQuickFilterProps {
  selectedStatus: string;
  onSelect: (status: string) => void;
  jobs: ZohoJob[];
}

/**
 * ステータス別クイックフィルタ
 */
export function StatusQuickFilter({
  selectedStatus,
  onSelect,
  jobs,
}: StatusQuickFilterProps) {
  // ステータス別の件数を集計
  const statusCounts = {
    すべて: jobs.length,
    入庫待ち: jobs.filter((j) => j.field5 === "入庫待ち").length,
    診断待ち: jobs.filter((j) => j.field5 === "入庫済み").length,
    見積作成待ち: jobs.filter((j) => j.field5 === "見積作成待ち").length,
    作業待ち: jobs.filter((j) => j.field5 === "作業待ち").length,
    引渡待ち: jobs.filter((j) => j.field5 === "出庫待ち").length,
  };

  // ステータスとアイコンのマッピング（JobCardのアクションボタンと統一）
  const statusIcons = {
    すべて: Grid,
    入庫待ち: Clock,
    診断待ち: Activity,
    見積作成待ち: FileText,
    作業待ち: Wrench,
    引渡待ち: Car,
  };

  const statuses = [
    { key: "すべて", label: "すべて" },
    { key: "入庫待ち", label: "入庫待ち" },
    { key: "診断待ち", label: "診断待ち" },
    { key: "見積作成待ち", label: "見積作成待ち" },
    { key: "作業待ち", label: "作業待ち" },
    { key: "引渡待ち", label: "引渡待ち" },
  ] as const;

  return (
    <div className="relative mb-4">
      {/* 水平スクロール可能なフィルターリスト */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4">
        {statuses.map((status) => {
          const count = statusCounts[status.key as keyof typeof statusCounts];
          const isSelected = selectedStatus === status.key;
          const Icon = statusIcons[status.key as keyof typeof statusIcons];

          return (
            <Button
              key={status.key}
              variant={isSelected ? "default" : "outline"}
              onClick={() => onSelect(status.key)}
              className={cn(
                "flex items-center gap-1.5 shrink-0 snap-start",
                isSelected
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="break-words sm:whitespace-nowrap">{status.label}</span>
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-0.5 text-base shrink-0",
                    isSelected
                      ? "bg-slate-700 text-white"
                      : "bg-slate-100 text-slate-700"
                  )}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
      
      {/* スクロールインジケーター（右側のグラデーション） */}
      <div className="absolute right-0 top-0 bottom-2 w-8 pointer-events-none bg-gradient-to-l from-slate-50 to-transparent" />
    </div>
  );
}





















