/**
 * 過去の案件参照ダイアログ
 * 改善提案 #6: 過去の見積・案件の参照機能
 *
 * 機能:
 * - 過去の案件を検索・表示
 * - 過去の案件詳細を表示
 * - 過去の案件情報を参照
 */

"use client";

import { useState, useMemo } from "react";
import { History, Search, Calendar, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HistoricalJob, JobStage } from "@/types";
import { fetchHistoricalJobsByCustomerId } from "@/lib/api";
import useSWR from "swr";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface HistoricalJobDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** 開閉状態の変更ハンドラ */
  onOpenChange: (open: boolean) => void;
  /** 顧客ID */
  customerId: string | null;
}

/**
 * 日付をフォーマット
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "不明";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * ステータスのバッジスタイルを取得
 */
/**
 * ステータスバッジのスタイルを取得
 * セマンティックカラーシステムに基づく統一ルール
 */
function getStatusBadgeStyle(status: JobStage): string {
  switch (status) {
    case "入庫待ち":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "入庫済み":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "見積作成待ち":
      return "bg-indigo-50 text-indigo-600 border-indigo-300";
    case "見積提示済み":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "作業待ち":
      return "bg-orange-50 text-orange-700 border-orange-300";
    case "出庫待ち":
      return "bg-green-50 text-green-700 border-green-300";
    case "出庫済み":
      return "bg-slate-50 text-slate-700 border-slate-300";
    case "部品調達待ち":
      return "bg-amber-50 text-amber-700 border-amber-300";
    case "部品発注待ち":
      return "bg-orange-50 text-orange-700 border-orange-300";
    case "入庫済み":
      return "bg-blue-50 text-blue-700 border-blue-300";
    case "見積提示済み":
      return "bg-amber-50 text-amber-900 border-amber-300"; // yellow → amber, text-amber-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
    case "出庫済み":
      return "bg-slate-50 text-slate-700 border-slate-300"; // text-slate-600 → text-slate-700, border-slate-200 → border-slate-300 (40歳以上ユーザー向け、コントラスト向上)
    default:
      return "bg-slate-100 text-slate-700 border-slate-300";
  }
}

/**
 * 過去の案件参照ダイアログ
 */
export function HistoricalJobDialog({
  open,
  onOpenChange,
  customerId,
}: HistoricalJobDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "cancelled"
  >("all");

  // 過去の案件を取得
  const { data: jobsData, isLoading } = useSWR(
    customerId && open
      ? `historical-jobs-${customerId}-${statusFilter}-${searchQuery}`
      : null,
    () =>
      fetchHistoricalJobsByCustomerId(customerId!, {
        statusFilter,
        searchQuery: searchQuery || undefined,
      }),
    {
      revalidateOnFocus: false,
    }
  );

  const jobs = jobsData?.data || [];

  // フィルタリングされた案件リスト
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    
    const query = searchQuery.toLowerCase();
    return jobs.filter(
      (job) =>
        job.customerName.toLowerCase().includes(query) ||
        job.vehicleName.toLowerCase().includes(query)
    );
  }, [jobs, searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            過去の案件を参照
          </DialogTitle>
          <DialogDescription>
            同じお客様の過去の案件を参照できます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 検索・フィルター */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-700" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="お客様名、車両情報で検索"
                className="pl-10"
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => {
                if (value === "all" || value === "completed" || value === "cancelled") {
                  setStatusFilter(value);
                }
              }}
            >
              <SelectTrigger className="w-48 h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="completed">完了済み</SelectItem>
                <SelectItem value="cancelled">キャンセル</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 過去の案件リスト */}
          {isLoading ? (
            <div className="text-center py-8 text-slate-700">
              読み込み中...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-8 text-slate-700">
              過去の案件が見つかりませんでした
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">
                            {job.customerName}様
                          </div>
                          <div className="text-base text-slate-700">
                            {job.vehicleName}
                          </div>
                          <div className="text-base text-slate-700 mt-1 flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {job.createdAt ? formatDate(job.createdAt) : "---"}
                            </div>
                            {job.arrivalDateTime && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                入庫: {job.arrivalDateTime ? formatDate(job.arrivalDateTime) : "---"}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={cn(getStatusBadgeStyle(job.status))}
                          >
                            {job.status}
                          </Badge>
                          <Link
                            href={`/admin/estimate/${job.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="text-blue-700 hover:text-blue-900 flex items-center gap-1 text-base"
                          >
                            <ExternalLink className="h-5 w-5" /> {/* h-4 w-4 → h-5 w-5 (40歳以上ユーザー向け、アイコンサイズ拡大) */}
                            詳細
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

