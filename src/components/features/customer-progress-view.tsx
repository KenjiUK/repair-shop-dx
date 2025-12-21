"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ZohoJob, ServiceKind } from "@/types";
import {
  CheckCircle2,
  Clock,
  FileText,
  Wrench,
  Car,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// 型定義
// =============================================================================

export interface ProgressStep {
  /** ステップID */
  id: string;
  /** ステップ名 */
  name: string;
  /** ステップの状態 */
  status: "completed" | "current" | "pending";
  /** 完了日時 */
  completedAt?: string;
  /** 説明 */
  description?: string;
}

export interface CustomerProgressData {
  /** ジョブID */
  jobId: string;
  /** サービス種類 */
  serviceKind: ServiceKind | ServiceKind[];
  /** 現在のステータス */
  currentStatus: string;
  /** 進捗率（0-100%） */
  progress: number;
  /** ステップリスト */
  steps: ProgressStep[];
  /** 開始日 */
  startDate?: string;
  /** 予定完了日 */
  expectedCompletionDate?: string;
  /** 現在のフェーズ/作業内容 */
  currentPhase?: string;
}

// =============================================================================
// Props
// =============================================================================

interface CustomerProgressViewProps {
  /** ジョブデータ */
  job: ZohoJob;
  /** 進捗データ */
  progressData?: CustomerProgressData | null;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ジョブから進捗データを抽出
 */
export function extractCustomerProgressData(job: ZohoJob): CustomerProgressData {
  const status = job.field5 || "不明";
  const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
  const primaryServiceKind = serviceKinds[0] || job.serviceKind || "その他";

  // ステータスに基づいて進捗率を計算
  const progress = calculateProgressFromStatus(status);

  // ステップリストを生成
  const steps: ProgressStep[] = [
    {
      id: "reception",
      name: "入庫",
      status: status === "入庫待ち" ? "current" : ["入庫済み", "見積作成待ち", "見積提示済み", "作業待ち", "作業中", "出庫待ち", "出庫済み"].includes(status) ? "completed" : "pending",
      completedAt: status !== "入庫待ち" ? job.field22 : undefined,
      description: "車両の受付が完了しました",
    },
    {
      id: "diagnosis",
      name: "診断",
      status: ["見積作成待ち", "見積提示済み", "作業待ち", "作業中", "出庫待ち", "出庫済み"].includes(status) ? "completed" : status === "入庫済み" ? "current" : "pending",
      description: "車両の診断を実施中です",
    },
    {
      id: "estimate",
      name: "見積もり",
      status: ["見積提示済み", "作業待ち", "作業中", "出庫待ち", "出庫済み"].includes(status) ? "completed" : status === "見積作成待ち" ? "current" : "pending",
      description: "見積もりを作成中です",
    },
    {
      id: "approval",
      name: "承認",
      status: ["作業待ち", "作業中", "出庫待ち", "出庫済み"].includes(status) ? "completed" : status === "見積提示済み" ? "current" : "pending",
      description: "見積もりの承認をお待ちしています",
    },
    {
      id: "work",
      name: "作業",
      status: ["出庫待ち", "出庫済み"].includes(status) ? "completed" : "pending",
      description: "作業を実施中です",
    },
    {
      id: "delivery",
      name: "引渡",
      status: status === "出庫済み" ? "completed" : status === "出庫待ち" ? "current" : "pending",
      description: "引渡準備中です",
    },
  ];

  // 現在のフェーズを取得
  let currentPhase: string | undefined;
  if (status === "作業待ち" || status === "出庫待ち") {
    // 長期プロジェクトの場合、詳細なフェーズ情報を取得
    const workData = (job as any).workData;
    if (workData?.restoreWorkData) {
      const phases = workData.restoreWorkData.phases || [];
      const currentPhaseData = phases.find((p: any) => p.status === "作業中");
      currentPhase = currentPhaseData?.name || "作業中";
    } else if (workData?.bodyPaintOutsourcingInfo) {
      const progress = workData.bodyPaintOutsourcingInfo.progress || "発注済み";
      currentPhase = progress;
    } else {
      currentPhase = "作業中";
    }
  } else {
    currentPhase = status;
  }

  return {
    jobId: job.id,
    serviceKind: serviceKinds.length > 1 ? serviceKinds : primaryServiceKind,
    currentStatus: status,
    progress,
    steps,
    startDate: job.field22,
    currentPhase,
  };
}

/**
 * ステータスから進捗率を計算
 */
function calculateProgressFromStatus(status: string): number {
  switch (status) {
    case "入庫待ち":
      return 0;
    case "入庫済み":
      return 15;
    case "見積作成待ち":
      return 30;
    case "見積提示済み":
      return 40;
    case "作業待ち":
      return 50;
    case "作業中":
      return 70;
    case "出庫待ち":
      return 90;
    case "出庫済み":
      return 100;
    default:
      return 0;
  }
}

// =============================================================================
// Component
// =============================================================================

export function CustomerProgressView({
  job,
  progressData,
  disabled = false,
}: CustomerProgressViewProps) {
  const data = progressData || extractCustomerProgressData(job);
  const { progress, steps, currentPhase, startDate, expectedCompletionDate } = data;

  return (
    <div className="space-y-4">
      {/* 進捗サマリー */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              作業進捗
            </span>
            <Badge variant={progress === 100 ? "default" : "secondary"} className="text-base px-3 py-1">
              {progress}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">全体進捗</span>
              <span className="font-medium text-slate-900">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* 現在のフェーズ */}
          {currentPhase && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              <span>現在: {currentPhase}</span>
            </div>
          )}

          {/* 日付情報 */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {startDate && (
              <div>
                <span className="text-slate-500">開始日</span>
                <p className="text-slate-900 font-medium mt-0.5">
                  {new Date(startDate).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {expectedCompletionDate && (
              <div>
                <span className="text-slate-500">予定完了日</span>
                <p className="text-slate-900 font-medium mt-0.5">
                  {new Date(expectedCompletionDate).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ステップリスト */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">作業ステップ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id}>
                <div className="flex items-start gap-3">
                  {/* ステップアイコン */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                        step.status === "completed"
                          ? "bg-green-500 border-green-500 text-white"
                          : step.status === "current"
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-slate-100 border-slate-300 text-slate-400"
                      )}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : step.status === "current" ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 mt-2",
                          step.status === "completed" ? "bg-green-500" : "bg-slate-200"
                        )}
                        style={{ minHeight: "40px" }}
                      />
                    )}
                  </div>

                  {/* ステップ情報 */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className={cn(
                          "font-medium",
                          step.status === "completed"
                            ? "text-green-700"
                            : step.status === "current"
                            ? "text-blue-700"
                            : "text-slate-400"
                        )}
                      >
                        {step.name}
                      </h4>
                      {step.completedAt && (
                        <span className="text-xs text-slate-500">
                          {new Date(step.completedAt).toLocaleDateString("ja-JP", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    {step.description && (
                      <p className="text-sm text-slate-600">{step.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}









