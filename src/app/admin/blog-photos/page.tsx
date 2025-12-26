"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageIcon, Calendar, FolderOpen, Car, Wrench, Filter, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/layout/app-header";
import { BlogPhotoCategory, BlogPhotoInfo } from "@/lib/blog-photo-manager";
import { Label } from "@/components/ui/label";

/**
 * ブログ写真一覧取得のためのフェッチャー
 */
async function fetchBlogPhotos(params: {
  category?: BlogPhotoCategory;
  folderPath?: string;
}): Promise<BlogPhotoInfo[]> {
  const searchParams = new URLSearchParams();
  if (params.category) {
    searchParams.append("category", params.category);
  }
  if (params.folderPath) {
    searchParams.append("folderPath", params.folderPath);
  }

  const response = await fetch(`/api/blog-photos?${searchParams.toString()}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || "ブログ写真の取得に失敗しました");
  }

  return result.data || [];
}

/**
 * ブログ写真管理画面
 */
export default function BlogPhotosPage() {
  const [selectedCategory, setSelectedCategory] = useState<BlogPhotoCategory | "all">("all");
  const [selectedPhoto, setSelectedPhoto] = useState<BlogPhotoInfo | null>(null);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

  // データ取得
  const { data: photos = [], isLoading } = useSWR<BlogPhotoInfo[]>(
    ["blog-photos", selectedCategory === "all" ? undefined : selectedCategory],
    () => fetchBlogPhotos({
      category: selectedCategory === "all" ? undefined : selectedCategory,
    })
  );

  // フィルタリングされた写真リスト
  const filteredPhotos = useMemo(() => {
    return photos.sort((a, b) => {
      // 作成日時で降順ソート（新しい順）
      return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
    });
  }, [photos]);

  // 統計情報
  const stats = useMemo(() => {
    const totalCount = photos.length;
    const byDateCount = photos.filter((p) => p.category === "by-date").length;
    const byServiceCount = photos.filter((p) => p.category === "by-service").length;
    const byVehicleTypeCount = photos.filter((p) => p.category === "by-vehicle-type").length;
    const beforeAfterCount = photos.filter((p) => p.category === "before-after").length;

    return {
      totalCount,
      byDateCount,
      byServiceCount,
      byVehicleTypeCount,
      beforeAfterCount,
    };
  }, [photos]);

  // 写真をクリック
  const handlePhotoClick = (photo: BlogPhotoInfo) => {
    setSelectedPhoto(photo);
    setIsPhotoDialogOpen(true);
  };

  // 日付フォーマット
  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}年${month}月${day}日`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppHeader
          isTopPage={true}
          hideBrandOnScroll={false}
        />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Skeleton className="h-[600px] w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        isTopPage={true}
        hideBrandOnScroll={false}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* ページタイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-slate-600 shrink-0" />
            ブログ写真管理
          </h1>
          <p className="text-base text-slate-700 mt-2">
            公開済みのブログ用写真を一覧表示・管理します
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-slate-700 mb-1">総数</p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums">{stats.totalCount}</p>
                </div>
                <ImageIcon className="h-5 w-5 text-slate-600 shrink-0" strokeWidth={2.5} />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-slate-700 mb-1">日付別</p>
                  <p className="text-2xl font-bold text-blue-600 tabular-nums">{stats.byDateCount}</p>
                </div>
                <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-slate-700 mb-1">作業種類別</p>
                  <p className="text-2xl font-bold text-green-600 tabular-nums">{stats.byServiceCount}</p>
                </div>
                <Wrench className="h-5 w-5 text-green-600 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-slate-700 mb-1">車種別</p>
                  <p className="text-2xl font-bold text-orange-600 tabular-nums">{stats.byVehicleTypeCount}</p>
                </div>
                <Car className="h-5 w-5 text-orange-600 shrink-0" />
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-slate-700 mb-1">Before/After</p>
                  <p className="text-2xl font-bold text-violet-600 tabular-nums">{stats.beforeAfterCount}</p>
                </div>
                <FolderOpen className="h-5 w-5 text-violet-600 shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルター */}
        <Card className="border border-slate-300 rounded-xl shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-600 shrink-0" />
              フィルター
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="category-filter" className="text-base text-slate-700 font-medium">
                  カテゴリ:
                </Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value as BlogPhotoCategory | "all")}
                >
                  <SelectTrigger id="category-filter" className="w-48 h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="by-date">日付別</SelectItem>
                    <SelectItem value="by-service">作業種類別</SelectItem>
                    <SelectItem value="by-vehicle-type">車種別</SelectItem>
                    <SelectItem value="before-after">Before/After</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedCategory !== "all" && (
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCategory("all")}
                  className="gap-1 h-12 text-base font-medium"
                >
                  <X className="h-5 w-5 shrink-0" />
                  フィルターをクリア
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 写真一覧 */}
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-slate-600 shrink-0" />
              写真一覧
              {filteredPhotos.length > 0 && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-base font-medium px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap tabular-nums">
                  {filteredPhotos.length}件
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPhotos.length === 0 ? (
              <div className="py-12 text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-base text-slate-700">
                  {selectedCategory === "all"
                    ? "公開済みのブログ写真がありません"
                    : "該当する写真がありません"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.fileId}
                    className="group cursor-pointer"
                    onClick={() => handlePhotoClick(photo)}
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-slate-400 transition-colors bg-slate-100">
                      <Image
                        src={photo.url}
                        alt={photo.fileName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 200px"
                      />
                      {/* オーバーレイ */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {/* カテゴリバッジ */}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-base font-medium px-2.5 py-1 rounded-full",
                            photo.category === "by-date" && "bg-blue-100 text-blue-700 border-blue-300",
                            photo.category === "by-service" && "bg-green-100 text-green-700 border-green-300",
                            photo.category === "by-vehicle-type" && "bg-orange-100 text-orange-700 border-orange-300",
                            photo.category === "before-after" && "bg-violet-100 text-violet-700 border-violet-300"
                          )}
                        >
                          {photo.category === "by-date" && "日付別"}
                          {photo.category === "by-service" && "作業種類"}
                          {photo.category === "by-vehicle-type" && "車種別"}
                          {photo.category === "before-after" && "Before/After"}
                        </Badge>
                      </div>
                      {/* Before/Afterタイプバッジ */}
                      {photo.metadata?.type && photo.metadata.type !== "general" && (
                        <div className="absolute bottom-2 left-2">
                          <Badge
                            variant={photo.metadata.type === "before" ? "secondary" : "default"}
                            className="text-base font-medium px-2.5 py-1 rounded-full"
                          >
                            {photo.metadata.type === "before" ? "Before" : "After"}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {/* ファイル名 */}
                    <p className="mt-2 text-base text-slate-700 truncate">
                      {photo.fileName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 写真詳細ダイアログ */}
        <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                写真詳細
              </DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <div className="space-y-4">
                {/* 画像 */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-300">
                  <Image
                    src={selectedPhoto.url}
                    alt={selectedPhoto.fileName}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
                {/* 情報 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-medium text-slate-700">ファイル名</Label>
                    <p className="text-base text-slate-900 font-medium mt-1">
                      {selectedPhoto.fileName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-base font-medium text-slate-700">カテゴリ</Label>
                    <p className="text-base text-slate-900 font-medium mt-1">
                      {selectedPhoto.category === "by-date" && "日付別"}
                      {selectedPhoto.category === "by-service" && "作業種類別"}
                      {selectedPhoto.category === "by-vehicle-type" && "車種別"}
                      {selectedPhoto.category === "before-after" && "Before/After"}
                    </p>
                  </div>
                  {selectedPhoto.metadata?.date && (
                    <div>
                      <Label className="text-base font-medium text-slate-700">撮影日</Label>
                      <p className="text-base text-slate-900 font-medium mt-1">
                        {formatDate(selectedPhoto.metadata.date)}
                      </p>
                    </div>
                  )}
                  {selectedPhoto.metadata?.vehicleName && (
                    <div>
                      <Label className="text-base font-medium text-slate-700">車種</Label>
                      <p className="text-base text-slate-900 font-medium mt-1">
                        {selectedPhoto.metadata.vehicleName}
                      </p>
                    </div>
                  )}
                  {selectedPhoto.metadata?.serviceKind && (
                    <div>
                      <Label className="text-base font-medium text-slate-700">作業種類</Label>
                      <p className="text-base text-slate-900 font-medium mt-1">
                        {selectedPhoto.metadata.serviceKind}
                      </p>
                    </div>
                  )}
                  {selectedPhoto.metadata?.type && (
                    <div>
                      <Label className="text-base font-medium text-slate-700">種類</Label>
                      <p className="text-base text-slate-900 font-medium mt-1">
                        {selectedPhoto.metadata.type === "before" && "Before"}
                        {selectedPhoto.metadata.type === "after" && "After"}
                        {selectedPhoto.metadata.type === "general" && "General"}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-base font-medium text-slate-700">フォルダパス</Label>
                    <p className="text-base text-slate-900 font-medium mt-1 break-all">
                      {selectedPhoto.folderPath}
                    </p>
                  </div>
                  <div>
                    <Label className="text-base font-medium text-slate-700">作成日時</Label>
                    <p className="text-base text-slate-900 font-medium mt-1">
                      {new Date(selectedPhoto.createdTime).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}


