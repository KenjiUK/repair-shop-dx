"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZohoJob, ServiceKind } from "@/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Activity,
  Wrench,
  Droplet,
  Circle,
  Sparkles,
  Zap,
  Package,
  Shield,
  Paintbrush,
  CarFront,
  FileText,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";

interface ServiceKindSummaryCardProps {
  jobs: ZohoJob[];
  selectedServiceKind?: ServiceKind | null;
  onServiceKindClick?: (serviceKind: ServiceKind | null) => void;
}

/**
 * 入庫区分別の設定（アイコン、色、表示名）
 * 2025年ベストプラクティス: カテゴリー色システム（ステータス色とは分離）
 * - Cyan: 点検・検査系
 * - Emerald: メンテナンス系
 * - Orange: 修理・整備系
 * - Rose: 診断・トラブル系
 * - Violet: カスタマイズ・特殊作業系
 * - Slate: その他
 */
const serviceKindConfig: Record<
  ServiceKind,
  { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }
> = {
  車検: {
    icon: ShieldCheck,
    color: "text-cyan-600", // 点検系
    bgColor: "bg-cyan-50",
    label: "車検",
  },
  "12ヵ月点検": {
    icon: CalendarCheck,
    color: "text-cyan-600", // 点検系
    bgColor: "bg-cyan-50",
    label: "12ヵ月点検",
  },
  エンジンオイル交換: {
    icon: Droplet,
    color: "text-emerald-600", // メンテナンス系
    bgColor: "bg-emerald-50",
    label: "オイル交換",
  },
  "タイヤ交換・ローテーション": {
    icon: Circle,
    color: "text-emerald-600", // メンテナンス系
    bgColor: "bg-emerald-50",
    label: "タイヤ",
  },
  故障診断: {
    icon: Activity,
    color: "text-rose-600", // 診断・トラブル系
    bgColor: "bg-rose-50",
    label: "故障診断",
  },
  "修理・整備": {
    icon: Wrench,
    color: "text-orange-700", // 修理・整備系
    bgColor: "bg-orange-50",
    label: "修理・整備",
  },
  チューニング: {
    icon: Zap,
    color: "text-violet-700", // カスタマイズ系
    bgColor: "bg-violet-50",
    label: "チューニング",
  },
  パーツ取付: {
    icon: Package,
    color: "text-violet-700", // カスタマイズ系
    bgColor: "bg-violet-50",
    label: "パーツ取付",
  },
  コーティング: {
    icon: Shield,
    color: "text-violet-700", // カスタマイズ系
    bgColor: "bg-violet-50",
    label: "コーティング",
  },
  レストア: {
    icon: Sparkles,
    color: "text-violet-700", // カスタマイズ系
    bgColor: "bg-violet-50",
    label: "レストア",
  },
  その他: {
    icon: FileText,
    color: "text-slate-700", // その他
    bgColor: "bg-slate-50",
    label: "その他",
  },
  "板金・塗装": {
    icon: Paintbrush,
    color: "text-violet-700", // カスタマイズ系
    bgColor: "bg-violet-50",
    label: "板金・塗装",
  },
  "その他のメンテナンス": {
    icon: Wrench,
    color: "text-slate-700", // その他（メンテナンス作業であることを明確化）
    bgColor: "bg-slate-50",
    label: "その他のメンテナンス",
  },
};

/**
 * 入庫区分別サマリーカード
 */
export function ServiceKindSummaryCard({
  jobs,
  selectedServiceKind,
  onServiceKindClick,
}: ServiceKindSummaryCardProps) {
  // 入庫区分別の件数を集計
  const serviceKindCounts = jobs.reduce((acc, job) => {
    const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
    serviceKinds.forEach((kind) => {
      acc[kind] = (acc[kind] || 0) + 1;
    });
    return acc;
  }, {} as Record<ServiceKind, number>);

  // 件数が多い順にソート（上位6件を表示）
  const sortedServiceKinds = Object.entries(serviceKindCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6) as Array<[ServiceKind, number]>;

  // 合計を計算
  const totalCount = Object.values(serviceKindCounts).reduce((sum, count) => sum + count, 0);

  // カードタイトルをクリックでフィルターリセット
  const handleTitleClick = () => {
    if (onServiceKindClick) {
      onServiceKindClick(null); // フィルターリセット
    }
  };

  return (
    <Card 
      className="h-full flex flex-col"
      role="region"
      aria-label="入庫区分別サマリー"
      aria-describedby="service-kind-summary-description"
    >
      <div id="service-kind-summary-description" className="sr-only">
        入庫区分別に案件を集計しています。各入庫区分をクリックすると、該当する案件のみを表示できます。
      </div>
      <CardHeader className="pb-3">
        <CardTitle 
          className={cn(
            "flex items-center justify-between text-xl font-semibold", // text-lg → text-xl (40歳以上ユーザー向け、フォントサイズ拡大)
            onServiceKindClick && "cursor-pointer hover:opacity-80 transition-opacity"
          )}
          onClick={handleTitleClick}
          aria-label={onServiceKindClick ? "入庫区分別（クリックでフィルターリセット）" : "入庫区分別"}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white shrink-0" />
            </div>
            入庫区分別
          </div>
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full">
            {totalCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-2 flex-1">
          {/* 「すべて」ボタン */}
          {onServiceKindClick && (
            <div
              role="button"
              tabIndex={0}
              aria-label="すべての入庫区分を表示（クリックでフィルターリセット）"
              aria-pressed={selectedServiceKind === null ? "true" : "false"}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onServiceKindClick(null);
                }
              }}
              className={cn(
                "flex items-center justify-between gap-2 p-3 rounded-md transition-all duration-200", // p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大)
                "bg-slate-50 border border-slate-200",
                "cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                // 「すべて」選択時のスタイル（他のボタンとは異なる強調）
                selectedServiceKind === null && "bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-400"
              )}
              onClick={() => {
                onServiceKindClick(null);
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                  selectedServiceKind === null ? "bg-blue-100" : "bg-slate-100"
                )}>
                  <FileText className={cn(
                    "h-4 w-4 shrink-0",
                    selectedServiceKind === null ? "text-blue-700" : "text-slate-700",
                    selectedServiceKind === null && "scale-110"
                  )} />
                </div>
                <span className={cn(
                  "text-base font-medium truncate",
                  selectedServiceKind === null ? "text-blue-700 font-semibold" : "text-slate-700"
                )}>
                  すべて
                </span>
              </div>
              <span className={cn(
                "font-bold tabular-nums text-xl shrink-0",
                selectedServiceKind === null ? "text-blue-900 scale-110" : "text-slate-900"
              )}>
                {totalCount}
              </span>
            </div>
          )}
          
          {sortedServiceKinds.length === 0 ? (
            <p className="text-base text-slate-700 text-center py-4">データがありません</p>
          ) : (
            sortedServiceKinds.map(([serviceKind, count]) => {
              const config = serviceKindConfig[serviceKind];
              if (!config) return null;

              const Icon = config.icon;
              const isSelected = selectedServiceKind === serviceKind;

              return (
                <div
                  key={serviceKind}
                  role={onServiceKindClick && count > 0 ? "button" : undefined}
                  tabIndex={onServiceKindClick && count > 0 ? 0 : undefined}
                  aria-label={count > 0 ? `${config.label}: ${count}件（クリックでフィルター）` : `${config.label}: ${count}件`}
                  aria-pressed={isSelected && count > 0 ? "true" : "false"}
                  onKeyDown={(e) => {
                    if (onServiceKindClick && count > 0 && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onServiceKindClick(serviceKind);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between gap-2 p-3 rounded-md transition-all duration-200", // p-2 → p-3 (40歳以上ユーザー向け、タッチターゲットサイズ拡大)
                    // 基本スタイル（すべてのボタンで統一）
                    count > 0 && "bg-slate-50 border border-slate-200",
                    // 「すべて」が選択されている場合、他のボタンを視覚的に無効化
                    selectedServiceKind === null && count > 0 && "opacity-50 cursor-not-allowed",
                    // クリック可能な場合のホバー・フォーカススタイル（「すべて」選択時は無効）
                    onServiceKindClick && count > 0 && selectedServiceKind !== null && "cursor-pointer hover:bg-slate-100 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                    // 選択状態のスタイル（サイズは変わらないようにborderの太さを統一）
                    isSelected && count > 0 && "bg-slate-100 border border-slate-500 shadow-md ring-1 ring-slate-400"
                  )}
                  onClick={() => {
                    if (onServiceKindClick && count > 0) {
                      // 既に選択されている場合はリセット（nullを渡す）、そうでなければ選択
                      onServiceKindClick(isSelected ? null : serviceKind);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className={cn("h-4 w-4 shrink-0", config.color, isSelected && "scale-110")} />
                    </div>
                    <span className={cn(
                      "text-base font-medium text-slate-800 truncate",
                      isSelected && "font-semibold"
                    )}>
                      {config.label}
                    </span>
                  </div>
                  <span className={cn(
                    "font-bold tabular-nums text-xl text-slate-900 shrink-0",
                    isSelected && "scale-110"
                  )}>
                    {count}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}





