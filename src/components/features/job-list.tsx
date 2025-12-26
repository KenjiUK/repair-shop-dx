"use client";

import { memo } from "react";
import { ZohoJob, CourtesyCar } from "@/types";
import { JobCard } from "@/components/features/job-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ジョブカードのスケルトン
 */
export function JobCardSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-24 hidden sm:block" />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex gap-2 mb-3">
                    <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full mt-4 sm:hidden" />
            </CardContent>
        </Card>
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
