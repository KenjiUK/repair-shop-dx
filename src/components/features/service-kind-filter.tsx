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
 * 入庫区分フィルター
 */
export function ServiceKindFilter({
  selectedKind,
  onSelect,
}: ServiceKindFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedKind === "すべて" ? "default" : "outline"}
        size="sm"
        onClick={() => onSelect("すべて")}
        className={cn(
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
          size="sm"
          onClick={() => onSelect(kind)}
          className={cn(
            selectedKind === kind
              ? "bg-slate-900 hover:bg-slate-800 text-white"
              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
          )}
        >
          {kind}
        </Button>
      ))}
    </div>
  );
}
