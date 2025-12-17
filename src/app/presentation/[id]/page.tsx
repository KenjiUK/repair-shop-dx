"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Car,
  Tag,
  Camera,
  FileText,
  LogOut,
  ArrowLeftRight,
  ChevronLeft,
  Check,
  User,
  Calendar,
  Download,
} from "lucide-react";
import Link from "next/link";

// =============================================================================
// Types
// =============================================================================

interface BeforeAfterPhoto {
  id: string;
  itemName: string;
  category: string;
  beforeUrl: string;
  afterUrl: string;
}

// =============================================================================
// Mock Data
// =============================================================================

const mockJobData = {
  id: "job-001",
  customerName: "田中 太郎",
  vehicleName: "BMW X3",
  licensePlate: "品川 300 あ 1234",
  tagId: "05",
  totalAmount: 59000,
  completedAt: "2024-12-17T16:30:00+09:00",
};

const mockPhotos: BeforeAfterPhoto[] = [
  {
    id: "photo-1",
    itemName: "エンジンオイル交換",
    category: "エンジン",
    beforeUrl: "https://placehold.co/600x400/1e293b/94a3b8?text=Oil+BEFORE",
    afterUrl: "https://placehold.co/600x400/22c55e/ffffff?text=Oil+AFTER+✓",
  },
  {
    id: "photo-2",
    itemName: "Fブレーキパッド交換",
    category: "ブレーキ",
    beforeUrl: "https://placehold.co/600x400/dc2626/ffffff?text=Brake+BEFORE+2mm",
    afterUrl: "https://placehold.co/600x400/22c55e/ffffff?text=Brake+AFTER+NEW",
  },
  {
    id: "photo-3",
    itemName: "タイヤローテーション",
    category: "足回り",
    beforeUrl: "https://placehold.co/600x400/ca8a04/ffffff?text=Tire+BEFORE",
    afterUrl: "https://placehold.co/600x400/22c55e/ffffff?text=Tire+AFTER+✓",
  },
  {
    id: "photo-4",
    itemName: "ワイパーゴム交換",
    category: "外装",
    beforeUrl: "https://placehold.co/600x400/64748b/ffffff?text=Wiper+BEFORE",
    afterUrl: "https://placehold.co/600x400/22c55e/ffffff?text=Wiper+AFTER+NEW",
  },
];

const mockWorkItems = [
  { name: "法定12ヶ月点検", price: 15000 },
  { name: "エンジンオイル交換", price: 5500 },
  { name: "Fブレーキパッド交換", price: 33000 },
  { name: "タイヤローテーション", price: 3300 },
  { name: "ワイパーゴム交換", price: 2200 },
];

// =============================================================================
// Helper Functions
// =============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP").format(price);
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =============================================================================
// Components
// =============================================================================

/**
 * Before/After比較カードコンポーネント
 */
function ComparisonCard({ photo }: { photo: BeforeAfterPhoto }) {
  const [viewMode, setViewMode] = useState<"split" | "before" | "after">("split");

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{photo.itemName}</CardTitle>
            <Badge variant="outline" className="mt-1">{photo.category}</Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === "before" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("before")}
            >
              Before
            </Button>
            <Button
              variant={viewMode === "split" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("split")}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "after" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("after")}
            >
              After
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {viewMode === "split" ? (
          <div className="grid grid-cols-2 gap-1 p-2">
            <div className="relative">
              <img
                src={photo.beforeUrl}
                alt="Before"
                className="w-full aspect-[4/3] object-cover rounded"
              />
              <Badge className="absolute top-2 left-2 bg-slate-800">Before</Badge>
            </div>
            <div className="relative">
              <img
                src={photo.afterUrl}
                alt="After"
                className="w-full aspect-[4/3] object-cover rounded"
              />
              <Badge className="absolute top-2 left-2 bg-green-600">After</Badge>
            </div>
          </div>
        ) : (
          <div className="relative p-2">
            <img
              src={viewMode === "before" ? photo.beforeUrl : photo.afterUrl}
              alt={viewMode}
              className="w-full aspect-[4/3] object-cover rounded"
            />
            <Badge
              className={cn(
                "absolute top-4 left-4",
                viewMode === "before" ? "bg-slate-800" : "bg-green-600"
              )}
            >
              {viewMode === "before" ? "Before" : "After"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function PresentationPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("gallery");

  /**
   * 請求書PDF表示（モック）
   */
  const handleShowInvoice = () => {
    toast.info("請求書PDFを表示します", {
      description: `${mockJobData.customerName}様_請求書.pdf`,
    });
    // 実際の実装ではPDFビューアーを開く
  };

  /**
   * 出庫完了処理
   */
  const handleCheckout = () => {
    console.log("=== 出庫完了 ===");
    console.log("Job ID:", jobId);
    console.log("Tag ID:", mockJobData.tagId);

    toast.success(`タグ No.${mockJobData.tagId} の紐付けを解除しました`, {
      description: "出庫処理が完了しました",
    });

    setIsCheckoutDialogOpen(false);

    // 1.5秒後にトップへ戻る
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" />
                戻る
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  整備完了レポート
                </h1>
                <p className="text-sm text-slate-500">
                  {mockJobData.customerName}様へのご説明用
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => setIsCheckoutDialogOpen(true)}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              出庫完了
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* 顧客・車両情報カード */}
        <Card className="mb-6 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">お客様</p>
                  <p className="text-2xl font-bold">{mockJobData.customerName} 様</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="text-white/70">車両</p>
                    <p className="font-medium">{mockJobData.vehicleName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="text-white/70">タグ</p>
                    <p className="font-medium">No.{mockJobData.tagId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="text-white/70">完了日時</p>
                    <p className="font-medium">{formatDate(mockJobData.completedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* タブナビゲーション */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery" className="gap-2">
              <Camera className="h-4 w-4" />
              Before/After
            </TabsTrigger>
            <TabsTrigger value="summary" className="gap-2">
              <Check className="h-4 w-4" />
              作業内容
            </TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2">
              <FileText className="h-4 w-4" />
              請求書
            </TabsTrigger>
          </TabsList>

          {/* Before/Afterギャラリー */}
          <TabsContent value="gallery" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mockPhotos.map((photo) => (
                <ComparisonCard key={photo.id} photo={photo} />
              ))}
            </div>
          </TabsContent>

          {/* 作業内容サマリー */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  完了した作業
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockWorkItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-slate-800">{item.name}</span>
                      </div>
                      <span className="font-medium">¥{formatPrice(item.price)}</span>
                    </div>
                  ))}

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>合計（税込）</span>
                    <span className="text-primary">¥{formatPrice(mockJobData.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 請求書 */}
          <TabsContent value="invoice">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  請求書
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-slate-600 mb-4">
                  基幹システムで発行した請求書PDFを表示します
                </p>
                <Button onClick={handleShowInvoice} size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  📄 請求書PDFを表示
                </Button>
                <p className="text-sm text-slate-400 mt-4">
                  ファイル名: {mockJobData.customerName}様_請求書.pdf
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 出庫確認ダイアログ */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              出庫確認
            </DialogTitle>
            <DialogDescription>
              以下の内容で出庫処理を行います。よろしいですか？
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-500">お客様</span>
              <span className="font-medium">{mockJobData.customerName} 様</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-500">車両</span>
              <span className="font-medium">{mockJobData.vehicleName}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-500">タグNo.</span>
              <span className="font-medium">{mockJobData.tagId}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">請求金額</span>
              <span className="font-bold text-primary">¥{formatPrice(mockJobData.totalAmount)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCheckout} className="gap-2">
              <Check className="h-4 w-4" />
              出庫完了（タグ解除）
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

