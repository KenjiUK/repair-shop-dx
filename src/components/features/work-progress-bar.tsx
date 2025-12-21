"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// =============================================================================
// Props
// =============================================================================

interface WorkProgressBarProps {
  /** 完了項目数 */
  completed: number;
  /** 全項目数 */
  total: number;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function WorkProgressBar({
  completed,
  total,
  className,
}: WorkProgressBarProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 進捗バーの色を決定
  const progressColor =
    percentage >= 80
      ? "bg-green-500"
      : percentage >= 50
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              {completed} / {total}項目完了
            </span>
            <span className="text-slate-600">{percentage}%</span>
          </div>
          <Progress
            value={percentage}
            className="h-2"
            indicatorClassName={progressColor}
          />
        </div>
      </CardContent>
    </Card>
  );
}















