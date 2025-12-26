/**
 * 長期プロジェクト詳細情報ダイアログ
 * 改善提案 #5: 詳細情報の表示機能の強化
 * 
 * 機能:
 * - 長期プロジェクトの進捗率の詳細表示
 * - 各工程の進捗状況の表示
 * - 予定終了日と実際の終了予測日の表示
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ZohoJob, RestoreProgress } from "@/types";
import { TrendingUp, Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { parsePartsInfoFromField26 } from "@/lib/parts-info-utils";

interface LongTermProjectDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: ZohoJob;
}

/**
 * 日付をフォーマット
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "未設定";
  try {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "無効な日付";
  }
}

/**
 * 長期プロジェクト詳細情報ダイアログ
 */
export function LongTermProjectDetailDialog({
  open,
  onOpenChange,
  job,
}: LongTermProjectDetailDialogProps) {
  // レストア作業進捗を取得（workDataから）
  // 注意: ZohoJob型にはworkDataフィールドが定義されていないが、
  // 実際のデータではWorkOrderのwork.restoreWorkDataが含まれる可能性がある
  // 型安全性のため、型ガードを使用して安全にアクセス
  const workData = 'workData' in job ? (job as ZohoJob & { workData?: { restoreWorkData?: RestoreProgress } }).workData : undefined;
  const restoreWorkData = workData?.restoreWorkData;
  const restoreProgress: RestoreProgress | undefined = restoreWorkData && 
    typeof restoreWorkData === 'object' && 
    'overallProgress' in restoreWorkData ? restoreWorkData : undefined;

  // 進捗率を計算
  const overallProgress = restoreProgress?.overallProgress || 0;
  const phases = restoreProgress?.phases || [];

  // 開始日と予定終了日を取得
  const startDate = phases.find((p) => p.startDate)?.startDate || null;
  const expectedEndDate =
    restoreProgress?.phases
      ?.map((p) => p.expectedEndDate)
      .filter((d): d is string => !!d)
      .sort()
      .reverse()[0] || null;

  // 遅延チェック
  const isDelayed =
    expectedEndDate && new Date() > new Date(expectedEndDate) && overallProgress < 100;

  // 顧客名と車両名
  const customerName = job.field4?.name || "顧客未登録";
  const vehicleInfo = typeof job.field6 === "string" ? job.field6 : job.field6?.name || "";
  const vehicleParts = vehicleInfo ? vehicleInfo.split(" / ") : [];
  const vehicleName = vehicleParts[0] || "車両未登録";
  const licensePlate = vehicleParts[1] || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {customerName}様 - {vehicleName}
            {licensePlate && ` (${licensePlate})`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 進捗率サマリー */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">進捗率サマリー</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-medium text-slate-800">全体の進捗率</span>
                  <div className="flex items-center gap-2">
                    {isDelayed && (
                      <Badge variant="destructive" className="text-base">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        遅延
                      </Badge>
                    )}
                    <span className="text-2xl font-bold text-slate-900">{overallProgress}%</span>
                  </div>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <div className="text-base text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    開始日
                  </div>
                  <div className="text-base font-medium text-slate-900">
                    {formatDate(startDate)}
                  </div>
                </div>
                <div>
                  <div className="text-base text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    予定終了日
                  </div>
                  <div className="text-base font-medium text-slate-900">
                    {formatDate(expectedEndDate)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 各工程の進捗 */}
          {phases.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">各工程の進捗</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phases.map((phase) => {
                    const getStatusBadgeVariant = (status: typeof phase.status) => {
                      switch (status) {
                        case "completed":
                          return "default";
                        case "in_progress":
                          return "secondary";
                        default:
                          return "outline";
                      }
                    };

                    const getStatusLabel = (status: typeof phase.status) => {
                      switch (status) {
                        case "not_started":
                          return "未開始";
                        case "in_progress":
                          return "進行中";
                        case "completed":
                          return "完了";
                      }
                    };

                    return (
                      <div key={phase.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-medium text-slate-900">
                            {phase.name || "工程名未設定"}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(phase.status)} className="text-base">
                              {getStatusLabel(phase.status)}
                            </Badge>
                            <span className="text-base font-bold text-slate-900 w-12 text-right">
                              {phase.progress}%
                            </span>
                          </div>
                        </div>
                        <Progress value={phase.progress} className="h-2" />
                        {phase.expectedEndDate && (
                          <div className="text-base text-slate-700 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            予定終了日: {formatDate(phase.expectedEndDate)}
                          </div>
                        )}
                        {phase.notes && (
                          <div className="text-base text-slate-800 mt-1 p-2 bg-slate-50 rounded">
                            {phase.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-base text-slate-700">
                  工程情報が登録されていません
                </div>
              </CardContent>
            </Card>
          )}

          {/* プロジェクト情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">プロジェクト情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-base">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">ステータス</span>
                  <Badge variant="outline">{job.field5 || "不明"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">入庫区分</span>
                  <span className="font-medium text-slate-900">
                    {job.serviceKind || job.field_service_kinds?.[0] || "未設定"}
                  </span>
                </div>
                {job.assignedMechanic && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">担当整備士</span>
                    <span className="font-medium text-slate-900">{job.assignedMechanic}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}




