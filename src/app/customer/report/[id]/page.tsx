"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Car,
  Calendar,
  FileText,
  Download,
  Star,
  Wrench,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  ExternalLink,
  Shield,
  Heart,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface BeforeAfterItem {
  id: string;
  itemName: string;
  category: string;
  beforeUrl: string;
  afterUrl: string;
  beforeCaption: string;
  afterCaption: string;
}

interface WorkItem {
  name: string;
  price: number;
}

// =============================================================================
// Mock Data
// =============================================================================

const mockReportData = {
  reportId: "report-20241217-001",
  customerName: "田中 太郎",
  vehicleName: "BMW X3",
  licensePlate: "品川 300 あ 1234",
  completedAt: "2024年12月17日",
  nextInspectionDate: "2025年12月",
  mechanicName: "鈴木 一郎",
  mechanicTitle: "整備士",
  totalAmount: 59000,
  invoiceFileName: "田中様_請求書_20241217.pdf",
};

const mockBeforeAfterItems: BeforeAfterItem[] = [
  {
    id: "ba-1",
    itemName: "ブレーキパッド交換",
    category: "ブレーキ",
    beforeUrl: "https://placehold.co/600x400/dc2626/ffffff?text=残量+2mm",
    afterUrl: "https://placehold.co/600x400/22c55e/ffffff?text=新品交換済",
    beforeCaption: "摩耗したブレーキパッド（残り2mm）",
    afterCaption: "新品のブレーキパッドに交換",
  },
  {
    id: "ba-2",
    itemName: "エンジンオイル交換",
    category: "エンジン",
    beforeUrl: "https://placehold.co/600x400/78716c/ffffff?text=汚れたオイル",
    afterUrl: "https://placehold.co/600x400/22c55e/ffffff?text=新品オイル",
    beforeCaption: "5,000km走行後の汚れたオイル",
    afterCaption: "高品質エンジンオイルに交換",
  },
  {
    id: "ba-3",
    itemName: "タイヤローテーション",
    category: "足回り",
    beforeUrl: "https://placehold.co/600x400/ca8a04/ffffff?text=偏摩耗あり",
    afterUrl: "https://placehold.co/600x400/22c55e/ffffff?text=ローテーション完了",
    beforeCaption: "前輪に偏摩耗が見られる状態",
    afterCaption: "前後入れ替えで均等に摩耗するよう調整",
  },
  {
    id: "ba-4",
    itemName: "ワイパーゴム交換",
    category: "外装",
    beforeUrl: "https://placehold.co/600x400/64748b/ffffff?text=拭きムラあり",
    afterUrl: "https://placehold.co/600x400/22c55e/ffffff?text=新品交換済",
    beforeCaption: "劣化により拭きムラが発生",
    afterCaption: "新品ワイパーゴムでクリアな視界に",
  },
];

const mockWorkItems: WorkItem[] = [
  { name: "法定12ヶ月点検", price: 15000 },
  { name: "エンジンオイル交換", price: 5500 },
  { name: "Fブレーキパッド交換", price: 33000 },
  { name: "タイヤローテーション", price: 3300 },
  { name: "ワイパーゴム交換", price: 2200 },
];

const mockMechanicComment = `今回の点検・整備作業が完了いたしました。

特にブレーキパッドは残量が2mmと危険な状態でしたので、安全のため新品に交換させていただきました。これで安心してお乗りいただけます。

タイヤはまだ溝が残っておりますが、来年の車検時には交換時期になるかと思います。その際はお早めにご相談ください。

今後もお客様のカーライフを全力でサポートいたします。
何かございましたらお気軽にご連絡ください。`;

// =============================================================================
// Helper Functions
// =============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ja-JP").format(price);
}

// =============================================================================
// Components
// =============================================================================

/**
 * Before/After比較カードコンポーネント（スマホ最適化・縦並び）
 */
function BeforeAfterCard({ item }: { item: BeforeAfterItem }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-slate-50">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{item.category}</Badge>
          <CardTitle className="text-base">{item.itemName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Before */}
        <div className="relative">
          <img
            src={item.beforeUrl}
            alt="Before"
            className="w-full aspect-[3/2] object-cover"
          />
          <Badge className="absolute top-3 left-3 bg-slate-800/90">Before</Badge>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-sm">{item.beforeCaption}</p>
          </div>
        </div>

        {/* 矢印 */}
        <div className="flex items-center justify-center py-2 bg-slate-100">
          <div className="flex items-center gap-2 text-slate-500">
            <ArrowRight className="h-5 w-5" />
            <span className="text-sm font-medium">交換・整備</span>
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>

        {/* After */}
        <div className="relative">
          <img
            src={item.afterUrl}
            alt="After"
            className="w-full aspect-[3/2] object-cover"
          />
          <Badge className="absolute top-3 left-3 bg-green-600">After ✓</Badge>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-white text-sm">{item.afterCaption}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 整備士コメント吹き出しコンポーネント
 */
function MechanicCommentBubble({
  mechanicName,
  comment,
}: {
  mechanicName: string;
  comment: string;
}) {
  return (
    <div className="flex gap-3">
      {/* アバター */}
      <div className="shrink-0">
        <Avatar className="w-12 h-12 border-2 border-primary">
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {mechanicName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* 吹き出し */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-slate-800">{mechanicName}</span>
          <Badge variant="secondary" className="text-xs">整備士</Badge>
        </div>
        <div className="relative bg-slate-100 rounded-2xl rounded-tl-none p-4">
          {/* 吹き出しの三角 */}
          <div className="absolute -left-2 top-0 w-0 h-0 border-t-[12px] border-t-slate-100 border-l-[12px] border-l-transparent" />
          <p className="text-slate-700 text-sm whitespace-pre-line leading-relaxed">
            {comment}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function CustomerReportPage() {
  const params = useParams();
  const reportId = params.id as string;

  /**
   * 請求書PDF表示（モック）
   */
  const handleShowInvoice = () => {
    toast.info("請求書PDFを表示します", {
      description: mockReportData.invoiceFileName,
    });
  };

  /**
   * Googleレビュー
   */
  const handleGoogleReview = () => {
    toast.success("Googleマップが開きます", {
      description: "レビューのご協力ありがとうございます！",
    });
    // 実際の実装ではGoogle Maps URLを開く
    // window.open('https://g.page/r/xxx/review', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5">
          {/* タイトル */}
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold text-slate-900">
              整備完了報告書
            </h1>
          </div>
          <p className="text-sm text-slate-500 mb-4">デジタル整備手帳</p>

          {/* 車両情報 */}
          <Card className="bg-gradient-to-r from-slate-800 to-slate-700">
            <CardContent className="py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">お客様</p>
                  <p className="text-xl font-bold">{mockReportData.customerName} 様</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-sm">車両</p>
                  <p className="font-medium">{mockReportData.vehicleName}</p>
                  <p className="text-sm text-white/70">{mockReportData.licensePlate}</p>
                </div>
              </div>

              <Separator className="my-3 bg-white/20" />

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/70" />
                  <span>整備完了日: {mockReportData.completedAt}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-white/70" />
                  <span>担当: {mockReportData.mechanicName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Before/Afterギャラリー */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">整備内容（Before/After）</h2>
          </div>
          <div className="space-y-4">
            {mockBeforeAfterItems.map((item) => (
              <BeforeAfterCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <Separator />

        {/* 実施内容・請求情報 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">実施内容・ご請求</h2>
          </div>

          <Card>
            <CardContent className="py-4">
              <div className="space-y-2">
                {mockWorkItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-slate-700">{item.name}</span>
                    </div>
                    <span className="font-medium">¥{formatPrice(item.price)}</span>
                  </div>
                ))}

                <Separator className="my-3" />

                <div className="flex items-center justify-between text-lg">
                  <span className="font-bold">合計（税込）</span>
                  <span className="font-bold text-primary">
                    ¥{formatPrice(mockReportData.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 請求書PDFボタン */}
          <Button
            onClick={handleShowInvoice}
            variant="outline"
            size="lg"
            className="w-full mt-4 h-14 text-base gap-2"
          >
            <Download className="h-5 w-5" />
            📄 請求書PDFを表示
          </Button>
          <p className="text-xs text-center text-slate-400 mt-2">
            {mockReportData.invoiceFileName}
          </p>
        </section>

        <Separator />

        {/* メカニックからのコメント */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">整備士からのメッセージ</h2>
          </div>

          <MechanicCommentBubble
            mechanicName={mockReportData.mechanicName}
            comment={mockMechanicComment}
          />
        </section>

        <Separator />

        {/* 次回点検案内 */}
        <section>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-900">次回車検予定</p>
                  <p className="text-blue-700">{mockReportData.nextInspectionDate}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    時期が近づきましたらご案内いたします
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Googleレビューボタン */}
        <section className="pt-4">
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 overflow-hidden">
            <CardContent className="py-6 text-center">
              <div className="flex justify-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-7 w-7 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <p className="text-slate-700 mb-1">
                サービスはいかがでしたか？
              </p>
              <p className="text-sm text-slate-500 mb-4">
                お客様の声が私たちの励みになります
              </p>
              <Button
                onClick={handleGoogleReview}
                size="lg"
                className="w-full h-14 text-base font-bold gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg"
              >
                <Star className="h-5 w-5" />
                Googleでレビューを書く
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* フッター */}
        <footer className="pt-6 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
            <Heart className="h-4 w-4" />
            <span className="text-sm">YM Works Auto Service</span>
          </div>
          <p className="text-xs text-slate-400">
            このページはお客様専用のデジタル整備手帳です
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Report ID: {reportId}
          </p>
        </footer>
      </main>
    </div>
  );
}

