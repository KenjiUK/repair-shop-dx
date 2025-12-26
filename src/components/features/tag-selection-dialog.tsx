"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Tag, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZohoJob, SmartTag } from "@/types";

interface TagSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedJob: ZohoJob | null;
    allTags: SmartTag[] | undefined;
    jobs: ZohoJob[] | undefined;
    isLoading: boolean;
    error: any;
    onRetry: () => void;
    selectedTagId: string | null;
    onTagSelect: (tagId: string) => void;
    isProcessing: boolean;
    isUrgent: boolean;
    onUrgentChange: (checked: boolean) => void;
}

export function TagSelectionDialog({
    open,
    onOpenChange,
    selectedJob,
    allTags,
    jobs,
    isLoading,
    error,
    onRetry,
    selectedTagId,
    onTagSelect,
    isProcessing,
    isUrgent,
    onUrgentChange,
}: TagSelectionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 shrink-0" />
                        タグ紐付け: {selectedJob?.field4?.name ?? "---"} 様
                    </DialogTitle>
                    <DialogDescription>
                        使用するスマートタグを選択してください
                        <br />
                        <span className="text-base text-slate-700 mt-1 block">
                            ※使用中のタグは選択できません
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {/* タグ選択グリッド（全タグ表示、使用済みはグレーアウト） */}
                {isLoading ? (
                    <div className="grid grid-cols-3 gap-3 py-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                            <Skeleton key={i} className="h-16" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="py-4 text-center">
                        <p className="text-base text-red-700 mb-3">タグの取得に失敗しました</p>
                        <Button
                            variant="outline"
                            size="default"
                            onClick={onRetry}
                        >
                            再試行
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3 py-4">
                        {allTags?.map((tag) => {
                            const isAvailable = tag.status === "available";
                            const isInUse = tag.status === "in_use";
                            const isClosed = tag.status === "closed";
                            const isSelected = selectedTagId === tag.tagId;
                            const isProcessingThis = isProcessing && isSelected && isAvailable;

                            // 使用中のタグの場合、ジョブ情報を取得
                            const linkedJob = isInUse && tag.jobId ? jobs?.find((j) => j.id === tag.jobId) : null;
                            const customerName = linkedJob?.field4?.name || "";
                            const vehicleName = linkedJob?.field6?.name ? linkedJob.field6.name.split(" / ")[0] : "";
                            const displayText = customerName && vehicleName ? `${customerName} / ${vehicleName}` : customerName || vehicleName || "";

                            return (
                                <div key={tag.tagId} className="flex flex-col gap-1">
                                    <Button
                                        variant={isAvailable ? "outline" : "ghost"}
                                        size="lg"
                                        className={cn(
                                            "h-16 text-2xl font-bold transition-all duration-200 relative",
                                            isAvailable &&
                                            "hover:bg-primary hover:text-primary-foreground hover:scale-105 hover:shadow-md border-2 border-slate-300",
                                            isInUse &&
                                            "opacity-50 cursor-not-allowed bg-slate-100 border border-slate-200",
                                            isClosed &&
                                            "opacity-30 cursor-not-allowed bg-slate-50 border border-slate-100",
                                            isProcessingThis &&
                                            "bg-primary/10 border-primary cursor-wait",
                                            isProcessing && !isSelected && isAvailable &&
                                            "opacity-50 cursor-not-allowed"
                                        )}
                                        onClick={() => isAvailable && onTagSelect(tag.tagId)}
                                        disabled={isProcessing || !isAvailable}
                                        title={isInUse && displayText ? `使用中: ${displayText}` : undefined}
                                    >
                                        {isProcessingThis ? (
                                            <Loader2 className="h-6 w-6 animate-spin shrink-0" />
                                        ) : (
                                            <>
                                                {tag.tagId}
                                                {isInUse && (
                                                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                        使用中
                                                    </span>
                                                )}
                                                {isClosed && (
                                                    <span className="absolute -top-1 -right-1 bg-slate-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                        閉鎖
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </Button>
                                    {/* 使用中のタグの場合、顧客名と車両名を表示 */}
                                    {isInUse && displayText && (
                                        <div className="text-[10px] text-slate-700 text-center truncate px-1" title={displayText}>
                                            {displayText}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {allTags?.length === 0 && (
                            <p className="col-span-3 text-center text-slate-700 py-4">
                                タグが登録されていません
                            </p>
                        )}
                        {allTags && allTags.filter((t) => t.status === "available").length === 0 && (
                            <p className="col-span-3 text-center text-orange-700 py-4 font-medium">
                                利用可能なタグがありません
                            </p>
                        )}
                    </div>
                )}

                {/* 選択中の案件情報 */}
                {selectedJob && (
                    <div className="space-y-3">
                        <div className="bg-slate-50 rounded-md p-3 text-base">
                            <p className="text-slate-700">
                                <span className="font-medium">車両:</span>{" "}
                                {selectedJob.field6?.name ?? "未登録"}
                            </p>
                        </div>

                        {/* 緊急対応フラグ */}
                        <div className="flex items-center gap-2 p-3 border border-slate-200 rounded-md">
                            <Checkbox
                                id="urgent-flag"
                                checked={isUrgent}
                                onCheckedChange={(checked) => onUrgentChange(checked === true)}
                                disabled={isProcessing}
                                className="h-5 w-5"
                            />
                            <label
                                htmlFor="urgent-flag"
                                className="flex items-center gap-2 text-base font-medium text-slate-900 cursor-pointer"
                            >
                                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                                緊急対応案件としてマーク
                            </label>
                        </div>
                    </div>
                )}

                {/* 処理中の表示 */}
                {isProcessing && (
                    <div className="flex items-center justify-center gap-2 py-2 text-base text-slate-700">
                        <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                        <span>チェックイン処理中...</span>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
