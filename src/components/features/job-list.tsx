"use client";

import { memo } from "react";
import { ZohoJob, CourtesyCar } from "@/types";
import { JobCard } from "@/components/features/job-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ジョブカードのスケルトン
 * 実際のJobCardのレイアウトに合わせて作成
 */
export function JobCardSkeleton() {
    return (
        <div className="flex bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden lg:flex-row flex-col">
            {/* 写真セクション - 固定幅（横長16:9のアスペクト比） */}
            <div className="w-full lg:w-[240px] flex-shrink-0 relative bg-slate-200 aspect-[16/9]">
                <Skeleton className="w-full h-full" />
            </div>

            {/* メインセクション - 可変幅 */}
            <div className="flex-1 p-4 lg:p-5 flex flex-col gap-2.5">
                {/* ヘッダー行 */}
                <div className="flex items-center gap-2.5">
                    <Skeleton className="h-7 w-32" />
                    <div className="flex gap-1">
                        <Skeleton className="h-6 w-6 rounded-md" />
                        <Skeleton className="h-6 w-6 rounded-md" />
                    </div>
                    <div className="ml-auto">
                        <Skeleton className="h-7 w-20 rounded-full" />
                    </div>
                </div>

                {/* 車両情報行 */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-48" />
                </div>

                {/* 情報行 */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                </div>

                {/* 詳細情報セクション */}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Skeleton className="h-6 w-28 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>

                {/* アクションボタン（モバイル用） */}
                <div className="mt-2 sm:hidden">
                    <Skeleton className="h-12 w-full rounded-lg" />
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
