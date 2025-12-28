"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users, Clock } from "lucide-react";
import { ZohoJob } from "@/types";
import { fetchTodayJobs } from "@/lib/api";
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/features/kanban-column";
import { KanbanCard } from "@/components/features/kanban-card";
import {
  groupJobsByColumn,
  KANBAN_COLUMNS,
  calculateMechanicWorkload,
  KanbanColumnType,
} from "@/lib/kanban-utils";

/**
 * 作業指示・進捗管理画面（カンバンボード）
 */
export default function KanbanPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  // ジョブデータを取得
  const { data: jobs = [], isLoading, error } = useSWR<ZohoJob[]>(
    "kanban-jobs",
    async () => {
      const result = await fetchTodayJobs();
      return result.success && result.data ? result.data : [];
    }
  );

  // ジョブを列ごとに分類
  const jobsByColumn = useMemo(() => {
    return groupJobsByColumn(jobs);
  }, [jobs]);

  // 技術者リストを取得
  const mechanics = useMemo(() => {
    const mechanicSet = new Set<string>();
    jobs.forEach((job) => {
      if (job.assignedMechanic) {
        mechanicSet.add(job.assignedMechanic);
      }
    });
    return Array.from(mechanicSet).sort();
  }, [jobs]);

  // 技術者稼働状況を計算
  const mechanicWorkloads = useMemo(() => {
    return mechanics.map((mechanic) =>
      calculateMechanicWorkload(jobs, mechanic)
    );
  }, [mechanics, jobs]);

  // ドラッグ終了時の処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const jobId = active.id as string;
    const targetColumnId = over.id as KanbanColumnType;

    // 列が変わった場合のみ処理（同じ列内での移動は無視）
    const sourceColumn = Object.entries(jobsByColumn).find(([, jobs]) =>
      jobs.some((j) => j.id === jobId)
    )?.[0] as KanbanColumnType | undefined;

    if (sourceColumn === targetColumnId) return;

    // 列間の移動は現在の実装ではステータス変更を伴わない
    // 将来的には、列の移動に応じてステータスを更新する機能を追加可能
    // TODO: 列間の移動に応じたステータス更新機能を実装
  };

  // ドラッグ開始時の処理
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };

  // アクティブなジョブを取得
  const activeJob = activeId ? jobs.find((j) => j.id === activeId) : null;

  if (error) {
    return (
      <div className="flex-1 bg-slate-50 overflow-auto">
        <AppHeader isTopPage={true} hideBrandOnScroll={false} />
        <main className="max-w-7xl mx-auto px-4 py-6" style={{ paddingTop: 'calc(var(--header-height, 80px) + 1.5rem)' }}>
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-600" />
              <p className="text-base text-red-700 font-semibold">
                データの取得に失敗しました
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 overflow-auto">
      <AppHeader
        isTopPage={true}
        hideBrandOnScroll={false}
        maxWidthClassName="max-w-7xl"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ページタイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-600 shrink-0" />
            作業指示・進捗管理
          </h1>
        </div>

        {/* カンバンボード */}
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {KANBAN_COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                columnId={column.id}
                title={column.title}
                jobs={jobsByColumn[column.id]}
                count={jobsByColumn[column.id].length}
              />
            ))}
          </div>

          {/* ドラッグ中のオーバーレイ */}
          <DragOverlay>
            {activeJob && <KanbanCard job={activeJob} isDragging={true} />}
          </DragOverlay>
        </DndContext>

        {/* 技術者稼働状況 */}
        {mechanicWorkloads.length > 0 && (
          <Card className="border border-slate-300 rounded-xl shadow-md mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                <Users className="h-5 w-5 shrink-0" />
                技術者稼働状況
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mechanicWorkloads.map((workload) => (
                  <Card
                    key={workload.mechanicName}
                    className="border border-slate-200 rounded-lg"
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="text-base font-semibold text-slate-900">
                        {workload.mechanicName}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-base">
                          <span className="text-slate-600">稼働率</span>
                          <span className="text-slate-900 font-medium">
                            {workload.utilizationRate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-base">
                          <span className="text-slate-600">空き時間</span>
                          <span className="text-slate-900 font-medium">
                            {Math.round(workload.freeTime / 60)}時間
                            {workload.freeTime % 60 > 0 &&
                              ` ${workload.freeTime % 60}分`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-base">
                          <span className="text-slate-600">担当案件数</span>
                          <span className="text-slate-900 font-medium">
                            {workload.totalJobs}件
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-base">
                          <span className="text-slate-600">作業中</span>
                          <span className="text-slate-900 font-medium">
                            {workload.workingJobs}件
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[600px] w-full" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

