/**
 * 整備士詳細情報ダイアログ
 * 改善提案 #5: 詳細情報の表示機能の強化
 * 
 * 機能:
 * - 各整備士の作業量の詳細表示
 * - 作業負荷の表示
 * - 担当案件リストの表示
 * - スキルレベルの表示（将来の拡張）
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ZohoJob, MechanicSkill } from "@/types";
import { Users, Briefcase, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMechanicSkill } from "@/lib/mechanic-skill-storage";

interface MechanicDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mechanicName: string;
  jobs: ZohoJob[];
}

/**
 * 整備士の作業負荷を判定
 */
function getWorkloadLevel(jobCount: number): "high" | "medium" | "low" {
  if (jobCount >= 8) return "high";
  if (jobCount >= 4) return "medium";
  return "low";
}

/**
 * 整備士詳細情報ダイアログ
 */
export function MechanicDetailDialog({
  open,
  onOpenChange,
  mechanicName,
  jobs,
}: MechanicDetailDialogProps) {
  const [mechanicSkill, setMechanicSkill] = useState<MechanicSkill | null>(null);

  // 整備士の案件をフィルター
  const mechanicJobs = jobs.filter(
    (job) => job.assignedMechanic === mechanicName
  );

  // スキル情報を取得
  useEffect(() => {
    if (open && mechanicName) {
      const skill = getMechanicSkill(mechanicName);
      setMechanicSkill(skill);
    }
  }, [open, mechanicName]);

  // 統計を計算
  const totalJobs = mechanicJobs.length;
  const inProgressJobs = mechanicJobs.filter(
    (job) =>
      job.field5 === "見積作成待ち" ||
      job.field5 === "作業待ち" ||
      job.field5 === "部品調達待ち" ||
      job.field5 === "部品発注待ち"
  ).length;
  const completedTodayJobs = mechanicJobs.filter((job) => {
    // 今日完了した案件をカウント（簡易実装）
    if (job.field5 === "出庫待ち" || job.field5 === "出庫済み") {
      return true;
    }
    return false;
  }).length;

  const workload = getWorkloadLevel(totalJobs);

  // ステータス別の件数を集計
  const statusCounts = mechanicJobs.reduce((acc, job) => {
    const status = job.field5 || "不明";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {mechanicName}の詳細情報
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 作業量サマリー */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">作業量サマリー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-base text-slate-700 mb-1">総案件数</div>
                  <div className="text-2xl font-bold text-slate-900">{totalJobs}</div>
                </div>
                <div>
                  <div className="text-base text-slate-700 mb-1">進行中</div>
                  <div className="text-2xl font-bold text-blue-700">{inProgressJobs}</div>
                </div>
                <div>
                  <div className="text-base text-slate-700 mb-1">完了済み（今日）</div>
                  <div className="text-2xl font-bold text-green-700">{completedTodayJobs}</div>
                </div>
                <div>
                  <div className="text-base text-slate-700 mb-1">作業負荷</div>
                  <div className="mt-1">
                    <Badge
                      variant={
                        workload === "high"
                          ? "destructive"
                          : workload === "medium"
                          ? "default"
                          : "secondary"
                      }
                      className="text-base"
                    >
                      {workload === "high" ? "高" : workload === "medium" ? "中" : "低"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ステータス別の件数 */}
          {Object.keys(statusCounts).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">ステータス別の件数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(statusCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-200"
                      >
                        <span className="text-base text-slate-800">{status}</span>
                        <Badge variant="outline" className="font-bold">
                          {count}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* スキルレベル（改善提案 #5） */}
          {mechanicSkill && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">スキルレベル</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 全体のスキルレベル */}
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-slate-800">全体のスキルレベル</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all" // bg-blue-600 → bg-primary (40歳以上ユーザー向け、統一)
                          style={{ width: `${mechanicSkill.overallLevel}%` }}
                        />
                      </div>
                      <span className="text-base font-medium w-12 text-right text-slate-900">
                        {mechanicSkill.overallLevel}%
                      </span>
                    </div>
                  </div>

                  {/* 各カテゴリーのスキルレベル */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    {mechanicSkill.skills.map((skill) => (
                      <div key={skill.category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="text-base font-medium text-slate-900">{skill.category}</span>
                            <div className="text-base text-slate-700 mt-0.5">
                              経験: {skill.experience}年
                              {skill.certifications.length > 0 && (
                                <span className="ml-2">
                                  ({skill.certifications.join(", ")})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all" // bg-blue-600 → bg-primary (40歳以上ユーザー向け、統一)
                                style={{ width: `${skill.level}%` }}
                              />
                            </div>
                            <span className="text-base font-medium w-10 text-right text-slate-900">
                              {skill.level}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 担当案件リスト */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">担当案件</CardTitle>
            </CardHeader>
            <CardContent>
              {mechanicJobs.length === 0 ? (
                <div className="text-center py-8 text-base text-slate-700">
                  担当案件がありません
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mechanicJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {job.field4?.name || "顧客名未登録"}様
                        </div>
                        <div className="text-base text-slate-700 truncate mt-0.5">
                          {job.field6?.name || "車両未登録"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-base",
                            job.field5 === "作業待ち" && "bg-blue-50 text-blue-700 border-blue-300",
                            job.field5 === "見積作成待ち" && "bg-amber-50 text-amber-900 border-amber-300", // yellow → amber, text-amber-700 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上)
                            job.field5 === "部品調達待ち" && "bg-amber-50 text-amber-700 border-amber-300",
                            job.field5 === "部品発注待ち" && "bg-orange-50 text-orange-700 border-orange-300"
                          )}
                        >
                          {job.field5 || "不明"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}




