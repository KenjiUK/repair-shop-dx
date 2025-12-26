"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";

interface WorkSummaryTabProps {
  items: Array<{ name: string; price: number }>;
  totalAmountText: string;
}

/**
 * 作業内容サマリータブコンポーネント
 */
export function WorkSummaryTab({ items, totalAmountText }: WorkSummaryTabProps) {
  function formatPrice(price: number): string {
    return new Intl.NumberFormat("ja-JP").format(price);
  }

  return (
    <Card className="border border-slate-300 rounded-xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Check className="h-5 w-5 text-green-700 shrink-0" />
          完了した作業
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-green-700" />
                </div>
                <span className="text-base text-slate-900">{item.name}</span>
              </div>
              <span className="text-base font-medium text-slate-900 tabular-nums">¥{formatPrice(item.price)}</span>
            </div>
          ))}

          <Separator className="my-4 bg-slate-200" />

          <div className="flex items-center justify-between pt-1">
            <span className="text-lg font-bold text-slate-900">合計（税込）</span>
            <span className="text-2xl font-bold text-primary tabular-nums">¥{totalAmountText}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}








