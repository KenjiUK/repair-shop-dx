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
  Camera,
  FileText,
  LogOut,
  ChevronLeft,
  Check,
} from "lucide-react";
import Link from "next/link";
import { ComparisonCard } from "@/components/features/presentation-page/comparison-card";
import { CustomerInfoCard } from "@/components/features/presentation-page/customer-info-card";
import { WorkSummaryTab } from "@/components/features/presentation-page/work-summary-tab";
import { InvoiceTab } from "@/components/features/presentation-page/invoice-tab";

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
        <CustomerInfoCard
          customerName={mockJobData.customerName}
          vehicleName={mockJobData.vehicleName}
          tagId={mockJobData.tagId}
          completedAtText={formatDate(mockJobData.completedAt)}
        />

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
                <ComparisonCard
                  key={photo.id}
                  itemName={photo.itemName}
                  category={photo.category}
                  beforeUrl={photo.beforeUrl}
                  afterUrl={photo.afterUrl}
                />
              ))}
            </div>
          </TabsContent>

          {/* 作業内容サマリー */}
          <TabsContent value="summary">
            <WorkSummaryTab
              items={mockWorkItems}
              totalAmountText={formatPrice(mockJobData.totalAmount)}
            />
          </TabsContent>

          {/* 請求書 */}
          <TabsContent value="invoice">
            <InvoiceTab
              customerName={mockJobData.customerName}
              onShowInvoice={handleShowInvoice}
            />
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

