"use client";

import { Button } from "@/components/ui/button";
import { ServiceKind } from "@/types";
import { cn } from "@/lib/utils";

interface ServiceKindFilterProps {
  selectedKind: ServiceKind | "すべて";
  onSelect: (kind: ServiceKind | "すべて") => void;
}

const SERVICE_KINDS: ServiceKind[] = [
  "車検",
  "修理・整備",
  "レストア",
  "チューニング",
  "パーツ取付",
  "コーティング",
  "12ヵ月点検",
  "エンジンオイル交換",
  "タイヤ交換・ローテーション",
  "故障診断",
  "その他",
];

/**
 * 入庫区分フィルター（水平スクロール対応）
 */
export function ServiceKindFilter({
  selectedKind,
  onSelect,
}: ServiceKindFilterProps) {
  return (
    <div className="relative mb-4">
      {/* 水平スクロール可能なフィルターリスト */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4">
        <Button
          variant={selectedKind === "すべて" ? "default" : "outline"}
          onClick={() => onSelect("すべて")}
          className={cn(
            "shrink-0 snap-start whitespace-nowrap",
            selectedKind === "すべて"
              ? "bg-slate-900 hover:bg-slate-800 text-white"
              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
          )}
        >
          すべて
        </Button>
        {SERVICE_KINDS.map((kind) => (
          <Button
            key={kind}
            variant={selectedKind === kind ? "default" : "outline"}
            onClick={() => onSelect(kind)}
            className={cn(
              "shrink-0 snap-start whitespace-nowrap",
              selectedKind === kind
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
            )}
          >
            {kind}
          </Button>
        ))}
      </div>
      
      {/* スクロールインジケーター（右側のグラデーション） */}
      <div className="absolute right-0 top-0 bottom-2 w-8 pointer-events-none bg-gradient-to-l from-slate-50 to-transparent" />
    </div>
  );
}
