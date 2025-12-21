"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LegalFees, convertLegalFeesToItems } from "@/lib/legal-fees";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface LegalFeesCardProps {
  /** 法定費用データ */
  legalFees: LegalFees;
  /** 無効化 */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function LegalFeesCard({
  legalFees,
  disabled = false,
  className,
}: LegalFeesCardProps) {
  const items = convertLegalFeesToItems(legalFees);

  return (
    <Card className={cn("bg-slate-50 border-slate-200", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-500" />
            法定費用（自動取得・編集不可）
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {item.name}
                  </span>
                  {item.description && (
                    <span className="text-xs text-slate-500">
                      ({item.description})
                    </span>
                  )}
                  {!item.required && (
                    <Badge variant="outline" className="text-xs">
                      任意
                    </Badge>
                  )}
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                ¥{item.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* 合計 */}
        <div className="pt-3 border-t-2 border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-slate-900">
              法定費用合計
            </span>
            <span className="text-lg font-bold text-slate-900">
              ¥{legalFees.total.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">※税込</p>
        </div>
      </CardContent>
    </Card>
  );
}















