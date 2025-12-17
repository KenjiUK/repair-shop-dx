"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ZohoJob } from "@/types";
import { Car, Clock, User, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ISO8601の日時文字列から時刻を抽出 (HH:MM形式)
 */
function formatTime(isoString: string): string {
  if (!isoString) return "--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =============================================================================
// Props
// =============================================================================

interface JobCardProps {
  job: ZohoJob;
  onCheckIn: (job: ZohoJob) => void;
  isCheckingIn?: boolean; // ローディング状態を受け取れるように追加
}

// =============================================================================
// Component
// =============================================================================

export function JobCard({ job, onCheckIn, isCheckingIn = false }: JobCardProps) {
  const customerName = job.field4?.name ?? "未登録";
  const vehicleInfo = job.field6?.name ?? "車両未登録";
  const arrivalTime = formatTime(job.field22);
  const hasPreInput = !!job.field7; // 事前入力あり
  const hasWorkOrder = !!job.field; // 作業指示あり

  const handleCheckIn = () => {
    onCheckIn(job);
  };

  // ステータスに応じたアクションボタンを決定するロジック
  const renderActionButton = (className?: string) => {
    switch (job.field5) {
      // 1. 受付済み -> 診断へ
      case "入庫済み":
        return (
          <Button asChild variant="secondary" className={cn("bg-blue-100 text-blue-700 hover:bg-blue-200", className)}>
            <Link href={`/mechanic/diagnosis/${job.id}`}>
              🔧 診断開始
            </Link>
          </Button>
        );

      // 2. 診断完了 -> 見積作成へ
      case "見積作成待ち":
        return (
          <Button asChild className={cn("", className)}>
            <Link href={`/admin/estimate/${job.id}`}>
              📝 見積作成
            </Link>
          </Button>
        );

      // 3. 見積送信済み -> 顧客承認待ち
      case "見積提示済み":
        return (
          <div className={cn("flex flex-col items-end gap-1", className)}>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 py-1.5 px-3">
              ⏳ お客様承認待ち
            </Badge>
            <Link 
              href={`/customer/approval/${job.id}`} 
              className="text-xs text-muted-foreground underline hover:text-primary"
            >
              (Debug: お客様画面へ)
            </Link>
          </div>
        );

      // 4. 承認済み -> 作業開始へ
      case "作業待ち":
        return (
          <Button asChild variant="destructive" className={cn("", className)}>
            <Link href={`/mechanic/work/${job.id}`}>
              🛠️ 作業開始
            </Link>
          </Button>
        );

      // 5. 作業完了 -> プレゼン・出庫へ
      case "出庫待ち":
        return (
          <Button asChild variant="outline" className={cn("border-green-600 text-green-700 hover:bg-green-50", className)}>
            <Link href={`/presentation/${job.id}`}>
              🎁 出庫・プレゼン
            </Link>
          </Button>
        );

      // 6. 完了
      case "出庫済み":
        return (
          <div className={cn("flex flex-col items-end gap-1", className)}>
            <Badge variant="secondary" className="bg-gray-100 text-gray-500">
              ✅ 完了
            </Badge>
            <Link 
              href={`/customer/report/${job.id}`} 
              className="text-xs text-muted-foreground underline hover:text-primary"
            >
              (整備手帳を見る)
            </Link>
          </div>
        );

      // 0. 初期状態 (入庫待ちなど)
      default:
        return (
          <Button 
            onClick={handleCheckIn} 
            disabled={isCheckingIn}
            className={cn("", className)}
            size="lg" // PC版のサイズ継承
          >
            {isCheckingIn ? "処理中..." : "Check-in"}
          </Button>
        );
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        hasWorkOrder && "border-l-4 border-l-red-500"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* 顧客名 */}
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-slate-500 shrink-0" />
              <span className="truncate">{customerName}</span>
              {/* ステータスバッジ（補助表示） */}
              <Badge variant="outline" className="text-xs font-normal text-slate-400 ml-2">
                {job.field5}
              </Badge>
            </CardTitle>

            {/* 車両情報 */}
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
              <Car className="h-4 w-4 shrink-0" />
              <span className="truncate">{vehicleInfo}</span>
            </div>

            {/* 入庫予定時間 */}
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{arrivalTime} 入庫予定</span>
            </div>
          </div>

          {/* 右側アクションエリア (PC表示) */}
          <div className="hidden sm:block">
            {renderActionButton()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* バッジエリア */}
        <div className="flex flex-wrap gap-2 mb-3">
          {hasPreInput && (
            <Badge variant="secondary" className="gap-1">
              <FileText className="h-3 w-3" />
              📝 事前入力あり
            </Badge>
          )}
          {hasWorkOrder && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              ⚠ 作業指示あり
            </Badge>
          )}
        </div>

        {/* 作業指示の内容（ある場合のみ表示） */}
        {hasWorkOrder && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800 mb-3">
            <p className="font-medium mb-1">📋 作業指示:</p>
            <p>{job.field}</p>
          </div>
        )}

        {/* 事前入力の内容（作業指示がない場合のみ表示） */}
        {hasPreInput && !hasWorkOrder && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800 mb-3">
            <p className="font-medium mb-1">📝 お客様入力情報:</p>
            <p>{job.field7}</p>
          </div>
        )}

        {/* 下部アクションエリア (モバイル表示) */}
        <div className="sm:hidden mt-4">
          {renderActionButton("w-full")}
        </div>
      </CardContent>
    </Card>
  );
}