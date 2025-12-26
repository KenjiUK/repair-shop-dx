"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LABOR_COST_MASTER, LaborCostMasterItem, searchLaborCostByName } from "@/lib/labor-cost-master";

/**
 * よく使う工賃マスタ（上部に表示）
 */
const FREQUENTLY_USED_IDS = [
  "engine-oil-change",
  "oil-filter-change",
  "brake-pad-front",
  "brake-pad-rear",
  "tire-change-4",
  "battery-change",
  "inspection-12month",
  "inspection-24month",
];

/**
 * 工賃マスタ選択コンポーネント（検索可能）
 */
export function LaborCostSelect({
  value,
  onSelect,
  disabled,
  className,
}: {
  value?: string | null;
  onSelect: (item: LaborCostMasterItem | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // 現在選択されているアイテム
  const selectedItem = value
    ? LABOR_COST_MASTER.find((item) => item.id === value)
    : null;

  // 検索結果をフィルタリング
  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return LABOR_COST_MASTER;
    }
    return searchLaborCostByName(searchQuery);
  }, [searchQuery]);

  // よく使う項目を取得
  const frequentlyUsedItems = React.useMemo(() => {
    return FREQUENTLY_USED_IDS.map((id) =>
      LABOR_COST_MASTER.find((item) => item.id === id)
    ).filter((item): item is LaborCostMasterItem => item !== undefined);
  }, []);

  // よく使う項目以外を取得
  const otherItems = React.useMemo(() => {
    const frequentlyUsedIdsSet = new Set(FREQUENTLY_USED_IDS);
    return filteredItems.filter((item) => !frequentlyUsedIdsSet.has(item.id));
  }, [filteredItems]);

  // カテゴリー別にグループ化
  const itemsByCategory = React.useMemo(() => {
    const categoryMap = new Map<string, LaborCostMasterItem[]>();
    otherItems.forEach((item) => {
      const category = item.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(item);
    });
    return categoryMap;
  }, [otherItems]);

  const handleSelect = (itemId: string | null) => {
    if (itemId === null) {
      onSelect(null);
      setOpen(false);
      return;
    }
    const item = LABOR_COST_MASTER.find((i) => i.id === itemId);
    if (item) {
      onSelect(item);
      setOpen(false);
      setSearchQuery("");
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("ja-JP").format(price);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-12 text-base justify-between", className)}
          disabled={disabled}
          aria-label="技術量を選択"
        >
          <span className="truncate">
            {selectedItem
              ? `${selectedItem.name} (¥${formatPrice(selectedItem.laborCost)})`
              : "技術量を選択..."}
          </span>
          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="検索..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-12 text-base"
          />
          <CommandList>
            <CommandEmpty className="text-base py-6 text-center text-slate-500">
              該当する項目が見つかりません
            </CommandEmpty>

            {/* よく使う項目 */}
            {!searchQuery && frequentlyUsedItems.length > 0 && (
              <CommandGroup heading="よく使う項目">
                {frequentlyUsedItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item.id)}
                    className="text-base h-12"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedItem?.id === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-base text-slate-600">
                        {item.category} · ¥{formatPrice(item.laborCost)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* カテゴリー別グループ */}
            {Array.from(itemsByCategory.entries()).map(([category, items]) => (
              <CommandGroup key={category} heading={category}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => handleSelect(item.id)}
                    className="text-base h-12"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selectedItem?.id === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-base text-slate-600">
                        ¥{formatPrice(item.laborCost)}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {/* 検索時は「なし」オプションを表示 */}
            {searchQuery && (
              <CommandGroup>
                <CommandItem
                  value="none"
                  onSelect={() => handleSelect(null)}
                  className="text-base h-12"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      !selectedItem ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="text-slate-600">なし</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

