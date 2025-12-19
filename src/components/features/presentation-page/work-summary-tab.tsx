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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          完了した作業
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-slate-800">{item.name}</span>
              </div>
              <span className="font-medium">¥{formatPrice(item.price)}</span>
            </div>
          ))}

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-lg font-bold">
            <span>合計（税込）</span>
            <span className="text-primary">¥{totalAmountText}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
