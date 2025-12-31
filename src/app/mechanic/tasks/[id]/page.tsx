"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { fetchJobById } from "@/lib/api";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Wrench, AlertCircle, ArrowLeft, ShieldCheck, CalendarCheck, Droplet, Circle, Settings, Activity, Zap, Package, Shield, Sparkles, Paintbrush, FileText, Calendar, UserCog, ChevronRight } from "lucide-react";
import { BlogPhotoCaptureDialog } from "@/components/features/blog-photo-capture-dialog";
import { ServiceKind } from "@/types";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/app-header";
import { ManufacturerIcon } from "@/components/features/manufacturer-icon";
import { listBlogPhotosFromJobFolder, BlogPhotoInfo } from "@/lib/blog-photo-manager";
import Image from "next/image";
import { triggerHapticFeedback } from "@/lib/haptic-feedback";

// サービス種類ごとのアイコン設定
function getServiceKindIcon(serviceKind: ServiceKind): React.ReactNode {
    switch (serviceKind) {
        case "車検":
            return <ShieldCheck className="h-5 w-5 text-cyan-600" strokeWidth={2.5} />;
        case "12ヵ月点検":
            return <CalendarCheck className="h-5 w-5 text-cyan-600" strokeWidth={2.5} />;
        case "エンジンオイル交換":
            return <Droplet className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />;
        case "タイヤ交換・ローテーション":
            return <Circle className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />;
        case "その他のメンテナンス":
            return <Settings className="h-5 w-5 text-slate-700" strokeWidth={2.5} />;
        case "故障診断":
            return <Activity className="h-5 w-5 text-rose-600" strokeWidth={2.5} />;
        case "修理・整備":
            return <Wrench className="h-5 w-5 text-orange-700" strokeWidth={2.5} />;
        case "チューニング":
            return <Zap className="h-5 w-5 text-violet-700" strokeWidth={2.5} />;
        case "パーツ取付":
            return <Package className="h-5 w-5 text-violet-700" strokeWidth={2.5} />;
        case "コーティング":
            return <Shield className="h-5 w-5 text-violet-700" strokeWidth={2.5} />;
        case "レストア":
            return <Sparkles className="h-5 w-5 text-violet-700" strokeWidth={2.5} />;
        case "板金・塗装":
            return <Paintbrush className="h-5 w-5 text-violet-700" strokeWidth={2.5} />;
        case "その他":
            return <FileText className="h-5 w-5 text-slate-700" strokeWidth={2.5} />;
        default:
            return <FileText className="h-5 w-5 text-slate-700" strokeWidth={2.5} />;
    }
}

export default function MechanicTaskSelectPage() {
    const router = useRouter();
    const params = useParams();
    const jobId = useMemo(() => (params?.id ?? "") as string, [params]);

    const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

    // ジョブ情報を取得
    const { data: job, isLoading: isJobLoading } = useSWR(
        jobId ? `job-${jobId}` : null,
        async () => {
            const result = await fetchJobById(jobId);
            if (!result.success) throw new Error(result.error?.message);
            return result.data;
        }
    );

    // ワークオーダーを取得
    const { workOrders, isLoading: isWorkOrdersLoading } = useWorkOrders(jobId);

    // ブログ用写真を取得
    const { data: blogPhotos = [] } = useSWR(
        jobId ? `blog-photos-tasks-${jobId}` : null,
        async () => {
            if (!jobId) return [];
            return await listBlogPhotosFromJobFolder(jobId);
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // ブログ用写真から位置情報を抽出
    const blogPhotosWithPosition = useMemo(() => {
        return blogPhotos.map((photo: BlogPhotoInfo) => {
            const fileName = photo.fileName.toLowerCase();
            let position: string | undefined;

            if (fileName.includes("front") || fileName.includes("前面") || fileName.includes("00_")) {
                position = "front";
            } else if (fileName.includes("rear") || fileName.includes("後面") || fileName.includes("01_")) {
                position = "rear";
            } else if (fileName.includes("left") || fileName.includes("左側") || fileName.includes("02_")) {
                position = "left";
            } else if (fileName.includes("right") || fileName.includes("右側") || fileName.includes("03_")) {
                position = "right";
            }

            return {
                ...photo,
                position,
            };
        });
    }, [blogPhotos]);

    // 最初の写真を取得
    const firstPhoto = useMemo(() => {
        if (blogPhotosWithPosition.length > 0) {
            const frontPhoto = blogPhotosWithPosition.find((p) => p.position === "front");
            if (frontPhoto) return frontPhoto.url;

            const rearPhoto = blogPhotosWithPosition.find((p) => p.position === "rear");
            if (rearPhoto) return rearPhoto.url;

            const leftPhoto = blogPhotosWithPosition.find((p) => p.position === "left");
            if (leftPhoto) return leftPhoto.url;

            const rightPhoto = blogPhotosWithPosition.find((p) => p.position === "right");
            if (rightPhoto) return rightPhoto.url;

            return blogPhotosWithPosition[0].url;
        }
        return null;
    }, [blogPhotosWithPosition]);

    // 写真の総数を計算
    const photoCount = useMemo(() => {
        let count = 0;
        count += blogPhotos.length;
        if (workOrders && workOrders.length > 0) {
            workOrders.forEach((wo) => {
                if (wo.diagnosis?.photos && Array.isArray(wo.diagnosis.photos)) {
                    count += wo.diagnosis.photos.length;
                }
                if (wo.work?.records && Array.isArray(wo.work.records)) {
                    wo.work.records.forEach((record: any) => {
                        if (record.photos && Array.isArray(record.photos)) {
                            count += record.photos.length;
                        }
                    });
                }
            });
        }
        return count;
    }, [blogPhotos, workOrders]);

    // 車両名を取得
    const vehicleName = useMemo(() => {
        if (typeof job?.field6 === 'object' && job.field6 !== null) {
            return job.field6.name;
        }
        return (job?.field6 as unknown as string) || "車両情報なし";
    }, [job?.field6]);

    // 顧客名を取得
    const customerName = useMemo(() => {
        return job?.field4?.name || "顧客名なし";
    }, [job?.field4?.name]);

    // ローディング状態
    if (isJobLoading || isWorkOrdersLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
                <AppHeader />
                <main className="container max-w-4xl mx-auto p-4 space-y-4 pt-20">
                    <Skeleton className="h-40 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </main>
            </div>
        );
    }

    // ワークオーダーが存在しない場合
    if (!workOrders || workOrders.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
                <AppHeader pageTitle="作業選択" backHref="/" />
                <main className="container max-w-4xl mx-auto p-4 pt-20 flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="h-8 w-8 text-slate-400" aria-hidden="true" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">作業が見つかりません</h2>
                        <p className="text-base text-slate-500">この案件には登録された作業がありません。</p>
                        <Button variant="outline" className="h-14 text-base" onClick={() => router.push("/")} aria-label="トップページへ戻る">
                            <ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />
                            戻る
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    // ナビゲーション処理
    const handleTaskSelect = (workOrder: any) => {
        triggerHapticFeedback("light");
        if (workOrder.serviceKind === "車検" || workOrder.serviceKind === "12ヵ月点検") {
            router.push(`/mechanic/diagnosis/${jobId}?workOrderId=${workOrder.id}`);
        } else {
            router.push(`/mechanic/work/${jobId}?workOrderId=${workOrder.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <AppHeader pageTitle="作業を開始" backHref="/" />

            <main className="container max-w-4xl mx-auto p-4 space-y-4 pt-20">
                {/* 案件情報カード */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:shadow-lg">
                    {/* 上部セクション: 車両画像 + 顧客情報 */}
                    <div className="flex border-b border-slate-200 lg:flex-row flex-col lg:items-stretch">
                        {/* 写真セクション */}
                        <div className="w-full lg:w-[240px] flex-shrink-0 relative bg-slate-200 aspect-[16/9]">
                            {firstPhoto ? (
                                <div className="relative w-full h-full group">
                                    <button
                                        onClick={() => {
                                            triggerHapticFeedback("light");
                                            setIsPhotoDialogOpen(true);
                                        }}
                                        className="relative w-full h-full cursor-pointer"
                                        aria-label="ブログ用写真を撮影"
                                        title="ブログ用写真を撮影"
                                    >
                                        <Image
                                            src={firstPhoto}
                                            alt="車両写真"
                                            fill
                                            className="object-cover transition-opacity"
                                            unoptimized
                                        />
                                        {photoCount > 0 && (
                                            <div className="absolute top-2.5 left-2.5 bg-black/50 text-white px-2 py-1 rounded text-base font-medium flex items-center gap-1 z-10">
                                                <Camera className="h-4 w-4" />
                                                {photoCount}枚
                                            </div>
                                        )}
                                    </button>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-2 flex items-center gap-2">
                                            <Camera className="h-5 w-5 text-slate-700" />
                                            <span className="text-base font-medium text-slate-700">写真を追加</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-full group">
                                    <button
                                        onClick={() => {
                                            triggerHapticFeedback("light");
                                            setIsPhotoDialogOpen(true);
                                        }}
                                        className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-300 hover:bg-slate-400 transition-colors cursor-pointer"
                                        aria-label="ブログ用写真を撮影"
                                        title="ブログ用写真を撮影"
                                    >
                                        <ManufacturerIcon vehicleName={vehicleName} className="h-10 w-10 mb-2" fallbackClassName="h-10 w-10" />
                                        <span className="text-base font-medium text-center text-slate-700 leading-snug group-hover:text-slate-900 transition-colors">
                                            {vehicleName}
                                        </span>
                                    </button>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-2 flex items-center gap-2">
                                            <Camera className="h-5 w-5 text-slate-700" />
                                            <span className="text-base font-medium text-slate-700">写真を追加</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* メインセクション */}
                        <div className="flex-1 p-4 lg:p-5 flex flex-col gap-3">
                            {/* 顧客名 */}
                            <h2 className="text-lg font-semibold text-slate-900 text-left truncate">
                                {customerName}
                            </h2>

                            {/* 車両情報 */}
                            <div className="flex items-center gap-2 text-base font-medium text-slate-900 min-w-0">
                                <ManufacturerIcon vehicleName={vehicleName} className="h-5 w-5" fallbackClassName="h-5 w-5" />
                                <span className="break-words min-w-0">{vehicleName}</span>
                            </div>

                            {/* サービス種類バッジ */}
                            {workOrders && workOrders.length > 0 && (
                                <div className="flex items-center gap-3 flex-wrap">
                                    {Array.from(new Set(workOrders.map(wo => wo.serviceKind))).map((serviceKind, index) => {
                                        const icon = getServiceKindIcon(serviceKind as ServiceKind);
                                        return (
                                            <Badge
                                                key={`${serviceKind}-${index}`}
                                                variant="outline"
                                                className="bg-slate-100 text-slate-800 border-slate-300 text-base font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-2"
                                            >
                                                <span aria-hidden="true">{icon}</span>
                                                <span>{serviceKind}</span>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 作業リスト */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {/* ヘッダー */}
                    <div className="border-b border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between h-16 px-4 lg:px-5">
                            <div className="flex items-center gap-3">
                                <Wrench className="h-6 w-6 text-slate-700 shrink-0" />
                                <span className="text-lg font-semibold text-slate-900">作業を選択</span>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-base font-semibold px-3 py-1">
                                    {workOrders.length}件
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* 作業カード一覧 */}
                    <div className="p-4 lg:p-5 max-h-[600px] overflow-y-auto space-y-3">
                        {workOrders.map((workOrder) => {
                            const serviceKind = workOrder.serviceKind as ServiceKind;
                            const icon = getServiceKindIcon(serviceKind);

                            // 開始日を取得
                            const startedAt = workOrder.diagnosis?.startedAt || workOrder.work?.startedAt;
                            const startDate = startedAt ? new Date(startedAt) : null;
                            const dateString = startDate ? startDate.toLocaleDateString("ja-JP", {
                                month: "2-digit",
                                day: "2-digit",
                            }) : null;

                            // 整備士名を取得
                            const mechanicName = workOrder.diagnosis?.mechanicName || workOrder.work?.mechanicName || job?.assignedMechanic || null;

                            return (
                                <div
                                    key={workOrder.id}
                                    className="p-4 rounded-lg border bg-white hover:bg-slate-50 transition-colors cursor-pointer border-slate-200"
                                    onClick={() => handleTaskSelect(workOrder)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${serviceKind}の作業を開始`}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleTaskSelect(workOrder);
                                        }
                                    }}
                                >
                                    {/* グリッドレイアウト */}
                                    <div className="grid grid-cols-[auto_auto_auto_auto_1fr_auto] gap-4 items-center">
                                        {/* 作業名 */}
                                        <div className="flex items-center gap-2 w-[140px] shrink-0">
                                            {icon}
                                            <p className="text-base font-semibold text-slate-900 whitespace-nowrap truncate">
                                                {serviceKind}
                                            </p>
                                        </div>

                                        {/* ステータス */}
                                        <div className="flex items-center w-[110px] shrink-0">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-base font-medium px-3 py-1.5 rounded-full whitespace-nowrap w-full justify-center",
                                                    workOrder.status === "作業中" ? "bg-blue-100 text-blue-700 border-blue-300" :
                                                    workOrder.status === "診断中" ? "bg-blue-100 text-blue-700 border-blue-300" :
                                                    workOrder.status === "完了" ? "bg-green-100 text-green-700 border-green-300" :
                                                    "bg-slate-100 text-slate-700 border-slate-300"
                                                )}
                                            >
                                                {workOrder.status}
                                            </Badge>
                                        </div>

                                        {/* 開始日 */}
                                        <div className="flex items-center gap-2 w-[130px] shrink-0">
                                            {dateString ? (
                                                <div className="flex items-center gap-2 text-base text-slate-600">
                                                    <Calendar className="h-5 w-5 text-slate-500 shrink-0" />
                                                    <span className="whitespace-nowrap">{dateString}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-base text-slate-400">
                                                    <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
                                                    <span className="whitespace-nowrap">--</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 整備士情報 */}
                                        <div className="flex items-center w-[150px] shrink-0 min-w-0">
                                            {mechanicName ? (
                                                <div className="flex items-center gap-2 text-base text-slate-600 w-full min-w-0">
                                                    <UserCog className="h-5 w-5 text-slate-500 shrink-0" />
                                                    <span className="truncate whitespace-nowrap">{mechanicName}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-base text-slate-400 w-full">
                                                    <UserCog className="h-5 w-5 text-slate-400 shrink-0" />
                                                    <span className="whitespace-nowrap">未割り当て</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* スペーサー */}
                                        <div className="flex-1"></div>

                                        {/* アクションボタン */}
                                        <div className="flex items-center justify-end shrink-0">
                                            <Button
                                                className="h-14 px-6 text-base font-semibold flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTaskSelect(workOrder);
                                                }}
                                            >
                                                <Wrench className="h-5 w-5" />
                                                作業を開始
                                                <ChevronRight className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <BlogPhotoCaptureDialog
                open={isPhotoDialogOpen}
                onOpenChange={setIsPhotoDialogOpen}
                jobId={jobId}
                onComplete={() => {
                    mutate(`blog-photos-tasks-${jobId}`);
                }}
            />
        </div>
    );
}
