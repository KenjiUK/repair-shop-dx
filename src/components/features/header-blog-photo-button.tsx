"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { BlogPhotoCaptureDialog } from "@/components/features/blog-photo-capture-dialog";
import { listBlogPhotosFromJobFolder } from "@/lib/blog-photo-manager";
import { cn } from "@/lib/utils";

interface HeaderBlogPhotoButtonProps {
    jobId: string;
}

export function HeaderBlogPhotoButton({ jobId }: HeaderBlogPhotoButtonProps) {
    const [hasPhotos, setHasPhotos] = useState<boolean | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // ブログ用写真の存在チェック
    useEffect(() => {
        const checkPhotos = async () => {
            if (!jobId) return;
            try {
                const photos = await listBlogPhotosFromJobFolder(jobId);
                setHasPhotos(photos.length > 0);
            } catch (error) {
                console.error("ブログ用写真の確認に失敗しました:", error);
                // エラー時はボタンを表示しない（安全側に倒す）
                setHasPhotos(true);
            }
        };

        checkPhotos();
    }, [jobId, isDialogOpen]); // ダイアログが閉じた後にも再チェック

    // スクロール検知
    useEffect(() => {
        const handleScroll = () => {
            // 少しでもスクロールしたら隠す (ヘッダーが縮小し始めるタイミングに合わせる)
            const scrolled = window.scrollY > 10;
            setIsScrolled(scrolled);
        };

        // 初期チェック
        handleScroll();

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // 判定中、既に写真がある、またはスクロールされている場合は何も表示しない
    if (hasPhotos === null || hasPhotos || isScrolled) {
        return null;
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className={cn(
                    "h-9 text-xs font-medium bg-white/50 backdrop-blur-sm border-slate-300 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700",
                    "transition-all duration-300 animate-in fade-in slide-in-from-top-1"
                )}
            >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                ブログ用写真を撮影
            </Button>

            <BlogPhotoCaptureDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                jobId={jobId}
                onComplete={() => {
                    // 撮影完了後に再チェック（useEffectが発火するはずだが、念のため）
                    setHasPhotos(true);
                }}
            />
        </>
    );
}
