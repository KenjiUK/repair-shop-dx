"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZohoJob } from "@/types";
import { cn } from "@/lib/utils";
import { Users, ChevronRight } from "lucide-react";
import { MechanicDetailDialog } from "@/components/features/mechanic-detail-dialog";

interface MechanicSummaryCardProps {
  jobs: ZohoJob[];
  selectedMechanic?: string | null;
  onMechanicClick?: (mechanicName: string | null) => void;
}

/**
 * 整備士別サマリーカード（改善: フィルター機能追加）
 */
export function MechanicSummaryCard({ 
  jobs, 
  selectedMechanic: externalSelectedMechanic,
  onMechanicClick 
}: MechanicSummaryCardProps) {
  const [selectedMechanic, setSelectedMechanic] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // 外部から選択状態が渡されている場合はそれを使用、そうでなければ内部状態を使用
  const selectedMechanicName = externalSelectedMechanic !== undefined ? externalSelectedMechanic : selectedMechanic;

  // 整備士別の件数を集計
  const mechanicCounts = jobs.reduce((acc, job) => {
    const mechanicName = job.assignedMechanic || "未割り当て";
    acc[mechanicName] = (acc[mechanicName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 件数が多い順にソート（上位6件を表示）
  const sortedMechanics = Object.entries(mechanicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  // 合計を計算
  const totalCount = Object.values(mechanicCounts).reduce((sum, count) => sum + count, 0);

  // 詳細ダイアログを開く
  const handleMechanicClick = (mechanicName: string) => {
    if (mechanicName === "未割り当て") return; // 未割り当てはクリック不可
    setSelectedMechanic(mechanicName);
    setIsDetailDialogOpen(true);
  };

  return (
    <Card 
      className="h-full flex flex-col"
      role="region"
      aria-label="整備士別サマリー"
      aria-describedby="mechanic-summary-description"
    >
      <div id="mechanic-summary-description" className="sr-only">
        整備士別に案件を集計しています。
      </div>
      <CardHeader className="pb-3">
        <CardTitle 
          className={cn(
            "flex items-center justify-between text-xl font-semibold", // text-lg → text-xl (40歳以上ユーザー向け、フォントサイズ拡大)
            onMechanicClick && "cursor-pointer hover:opacity-80 transition-opacity"
          )}
          onClick={() => {
            if (onMechanicClick) {
              onMechanicClick(null); // カードタイトルクリックでフィルターリセット
            }
          }}
          aria-label={onMechanicClick ? "整備士別（クリックでフィルターリセット）" : "整備士別"}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-white shrink-0" />
            </div>
            整備士別
          </div>
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full">
            {totalCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          {sortedMechanics.length === 0 ? (
            <p className="text-base text-slate-700 text-center py-4">データがありません</p>
          ) : (
            sortedMechanics.map(([mechanicName, count]) => {
              const isClickable = mechanicName !== "未割り当て";
              const isSelected = selectedMechanicName === mechanicName;
              const isFilterMode = onMechanicClick !== undefined;
              
              return (
                <div
                  key={mechanicName}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  aria-label={isClickable ? `${mechanicName}: ${count}件${isFilterMode ? "（クリックでフィルター）" : "（クリックで詳細表示）"}` : `${mechanicName}: ${count}件`}
                  aria-pressed={isSelected && isFilterMode ? "true" : "false"}
                  onKeyDown={(e) => {
                    if (isClickable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      if (isFilterMode && onMechanicClick) {
                        // フィルターモード: 既に選択されている場合はリセット、そうでなければ選択
                        onMechanicClick(isSelected ? null : mechanicName);
                      } else {
                        // 詳細表示モード
                        handleMechanicClick(mechanicName);
                      }
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between gap-2 p-3 rounded-md transition-all duration-200", // p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大)
                    "bg-slate-50 border border-slate-200",
                    isClickable && "cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                    // 選択状態のスタイル（フィルターモード時）
                    isSelected && isFilterMode && "bg-slate-100 border border-slate-500 shadow-md ring-1 ring-slate-400",
                    // 未割り当てのスタイル
                    !isClickable && "opacity-60"
                  )}
                  onClick={() => {
                    if (isClickable) {
                      if (isFilterMode && onMechanicClick) {
                        // フィルターモード: 既に選択されている場合はリセット、そうでなければ選択
                        onMechanicClick(isSelected ? null : mechanicName);
                      } else {
                        // 詳細表示モード
                        handleMechanicClick(mechanicName);
                      }
                    }
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 shrink-0 text-slate-700" />
                    </div>
                    <span className={cn(
                      "text-base font-medium text-slate-800 truncate",
                      isSelected && isFilterMode && "font-semibold"
                    )}>
                      {mechanicName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold tabular-nums text-xl text-slate-900">
                      {count}
                    </span>
                    {isClickable && (
                      <ChevronRight className="h-5 w-5 text-slate-700" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* 整備士詳細情報ダイアログ（改善提案 #5） */}
      {selectedMechanic && (
        <MechanicDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          mechanicName={selectedMechanic}
          jobs={jobs}
        />
      )}
    </Card>
  );
}



