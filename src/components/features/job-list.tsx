"use client";

import { memo } from "react";
import { ZohoJob, CourtesyCar } from "@/types";
import { JobCard } from "@/components/features/job-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ジョブカードのスケルトン
 * 実際のJobCardのレイアウトに合わせて作成（最新の2セクション構造に対応）
 */
export function JobCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
            {/* 上部セクション: 車両画像 + 顧客情報 + 右上アクション */}
            <div className="flex border-b border-slate-200 lg:flex-row flex-col lg:items-stretch">
                {/* 写真セクション - 固定幅（横長16:9のアスペクト比） */}
                <div className="w-full lg:w-[240px] flex-shrink-0 relative bg-slate-200 aspect-[16/9]">
                    <Skeleton className="w-full h-full" />
                </div>

                {/* メインセクション - 可変幅 */}
                <div className="flex-1 p-4 lg:p-5 flex flex-col gap-2.5 relative">
                    {/* 右上アイコンボタン */}
                    <div className="absolute top-4 right-4 z-10 flex gap-1">
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-6 w-6 rounded" />
                        <Skeleton className="h-6 w-6 rounded" />
                    </div>

                    {/* ヘッダー行（顧客名） */}
                    <div className="flex items-center gap-2.5 pr-20">
                        <Skeleton className="h-7 w-32" />
                    </div>

                    {/* 車両情報行 */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-5 w-48" />
                    </div>

                    {/* 情報行 - 入庫カテゴリバッジ */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <Skeleton className="h-7 w-24 rounded-full" />
                        <Skeleton className="h-7 w-20 rounded-full" />
                    </div>

                    {/* 情報行 - 時間、タグ、代車など */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                    </div>

                    {/* ボタン行 */}
                    <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-100 flex-wrap">
                        <Skeleton className="h-9 w-32 rounded-md" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                </div>

                {/* セパレーター - メインコンテンツとアクションセクションの間 */}
                <div className="hidden lg:flex items-center shrink-0">
                    <div className="w-px h-full bg-slate-200"></div>
                </div>

                {/* アクションセクション - 固定幅200px */}
                <div className="w-full lg:w-[200px] flex-shrink-0 p-4 border-t lg:border-t-0 flex flex-col gap-3 pt-16">
                    <Skeleton className="h-12 w-[200px] rounded-lg" />
                </div>
            </div>

            {/* 下部セクション: 作業一覧（折りたたみ可能） */}
            <div className="border-t border-slate-200 bg-slate-50">
                {/* 作業一覧ボタン（折りたたみ可能） */}
                <div className="bg-white border-b border-slate-200">
                    <Skeleton className="h-14 w-full" />
                </div>
            </div>
        </div>
    );
}

/**
 * ジョブリストコンポーネント（メモ化）
 */
export const JobList = memo(function JobList({
    jobs,
    onCheckIn,
    courtesyCars,
}: {
    jobs: ZohoJob[];
    onCheckIn: (jobId: string) => void;
    courtesyCars: CourtesyCar[];
}) {
    return (
        <div
            id="jobs-section"
            className="space-y-4 scroll-mt-20"
            role="region"
            aria-label="ジョブリスト"
            aria-live="polite"
            aria-atomic="false"
            aria-describedby="jobs-section-description"
        >
            <div id="jobs-section-description" className="sr-only">
                {jobs.length}件のジョブが表示されています。
            </div>
            {jobs.map((job) => (
                <div
                    key={job.id}
                    id={`job-card-${job.id}`}
                    data-job-id={job.id}
                    className="rounded-xl"
                >
                    <JobCard
                        job={job}
                        onCheckIn={(job) => onCheckIn(job.id)}
                        courtesyCars={courtesyCars}
                    />
                </div>
            ))}
        </div>
    );
});
JobList.displayName = "JobList";
