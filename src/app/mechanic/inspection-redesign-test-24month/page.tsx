"use client";

/**
 * 24ヶ月点検（車検） 再設計版 テストページ
 * 
 * 24ヶ月点検専用のテストページ
 */

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { CompactJobHeader } from "@/components/layout/compact-job-header";
import { InspectionRedesignTabs } from "@/components/features/inspection-redesign-tabs";
import { InspectionBottomSheetList } from "@/components/features/inspection-bottom-sheet-list";
import { InspectionMeasurementInput } from "@/components/features/inspection-measurement-input";
import { OBDDiagnosticUnifiedSection, OBDDiagnosticResult } from "@/components/features/obd-diagnostic-unified-section";
import { InspectionQualityCheckSection } from "@/components/features/inspection-quality-check-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getInspectionItems, getInspectionCategories } from "@/lib/inspection-items-redesign";
import { toast } from "sonner";
import { Gauge, Eye, Send, NotebookPen, Camera, MessageSquare, Activity, Lightbulb } from "lucide-react";
import {
  InspectionItemRedesign,
  InspectionStatus,
  InspectionCategory12Month,
  InspectionCategory24Month,
  InspectionMeasurements,
  InspectionParts,
  INSPECTION_CATEGORY_12MONTH_LABELS,
  INSPECTION_CATEGORY_24MONTH_LABELS,
} from "@/types/inspection-redesign";
import { QualityCheckData } from "@/types/inspection-quality-check";
import { BlogPhotoInfo } from "@/lib/blog-photo-manager";
import { ZohoJob } from "@/types";
import { CustomPartItem } from "@/types/inspection-parts-custom";
import Image from "next/image";

export default function InspectionRedesign24MonthTestPage() {
  const type = "24month" as const;
  const [items, setItems] = useState<InspectionItemRedesign[]>(() => {
    // 日常点検はデータソースから既に除外されている
    return getInspectionItems("24month");
  });
  const [activeCategory, setActiveCategory] = useState<
    InspectionCategory12Month | InspectionCategory24Month | undefined
  >(undefined);
  const [measurements, setMeasurements] = useState<InspectionMeasurements>({});
  const [parts, setParts] = useState<InspectionParts>({});
  const [customParts, setCustomParts] = useState<CustomPartItem[]>([]);
  const [mileage, setMileage] = useState<number | null>(null);
  
  // OBD診断結果
  const [obdDiagnosticResult, setObdDiagnosticResult] = useState<OBDDiagnosticResult | undefined>();
  
  // 品質管理・最終検査
  const [qualityCheckData, setQualityCheckData] = useState<QualityCheckData | null>(null);
  
  // 作業メモ
  const [workMemo, setWorkMemo] = useState<string>("");
  // 整備アドバイス
  const [maintenanceAdvice, setMaintenanceAdvice] = useState<string>("");
  
  // ブログ撮影用写真（テスト用のモックデータ）
  const [blogPhotos, setBlogPhotos] = useState<BlogPhotoInfo[]>([]);
  
  // プレビュー表示フラグ
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // テスト用のジョブデータ（モック）
  const mockJob: ZohoJob = {
    id: "test-job-001",
    field22: new Date().toISOString(),
    field5: "作業待ち" as const,
    field4: { id: "customer-001", name: "山田太郎" },
    field6: { id: "vehicle-001", name: "プリウス" },
    field: null,
    field7: null,
    field10: mileage || null,
    field13: null,
    field19: null,
    field26: null,
    ID_BookingId: null,
    field12: null,
    tagId: null,
    serviceKind: "車検",
    assignedMechanic: "テスト整備士",
    version: 1,
  };

  // テスト用の車両情報
  const vehicleName = "プリウス";
  const licensePlate = "品川 500 さ 1234";
  const customerName = "山田太郎";
  const diagnosisTitle = "24ヶ月点検（車検）診断";

  // タイプが変更されたら項目リストとアクティブカテゴリを更新
  useEffect(() => {
    // 24ヶ月点検では日常点検はデータソースから既に除外されている
    setItems(getInspectionItems(type));
    const categories = getInspectionCategories(type);
    if (categories[0]) {
      setActiveCategory(categories[0] as InspectionCategory12Month | InspectionCategory24Month);
    }
  }, [type]);

  // ステータス変更ハンドラ（テスト用）
  const handleStatusChange = (itemId: string, status: InspectionStatus, skipAutoAdvance?: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
  };

  // 写真追加ハンドラ（テスト用）
  const handlePhotoAdd = async (itemId: string, file: File) => {
    // テスト用: ファイルをプレビューURLに変換して保存
    const url = URL.createObjectURL(file);
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, photoUrls: [...(item.photoUrls || []), url] }
          : item
      )
    );
    toast.success("写真を追加しました（テスト）");
  };

  // 写真削除ハンドラ（テスト用）
  const handlePhotoDelete = (itemId: string, index: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              photoUrls: (item.photoUrls || []).filter((_, i) => i !== index),
            }
          : item
      )
    );
    toast.success("写真を削除しました");
  };

  // OBD診断結果PDF生成ハンドラ（写真からPDFに変換されたファイルを受け取る）
  const handleOBDPdfUpload = async (file: File) => {
    // テスト用: ファイルを処理
    const fileUrl = URL.createObjectURL(file);
    setObdDiagnosticResult({
      fileName: file.name,
      fileUrl: fileUrl,
      uploadedAt: new Date().toISOString(),
      status: "uploaded",
    });
  };

  // OBD診断結果PDF削除ハンドラ
  const handleOBDPdfRemove = () => {
    if (obdDiagnosticResult?.fileUrl) {
      URL.revokeObjectURL(obdDiagnosticResult.fileUrl);
    }
    setObdDiagnosticResult(undefined);
  };

  // 次のセクションへ遷移
  const handleNextSection = () => {
    if (!activeCategory) return;
    const categories = getInspectionCategories(type);
    const currentIndex = categories.indexOf(activeCategory);
    if (currentIndex >= 0 && currentIndex < categories.length - 1) {
      setActiveCategory(categories[currentIndex + 1] as InspectionCategory24Month);
    }
  };

  // プレビューハンドラ
  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  // 点検完了ハンドラ
  const handleComplete = () => {
    toast.success("点検を完了しました（テスト）");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー（本番と同じ） */}
      <AppHeader
        maxWidthClassName="max-w-4xl"
        collapsibleOnMobile={true}
        backHref="/"
        collapsedCustomerName={customerName}
        collapsedVehicleName={vehicleName}
        collapsedLicensePlate={licensePlate}
        pageTitle={diagnosisTitle}
        pageTitleIcon={<Activity className="h-6 w-6 text-slate-700 shrink-0" />}
      >
        {/* ページタイトル */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-slate-700 shrink-0" />
            {diagnosisTitle}
          </h1>
        </div>

        {/* 案件情報 */}
        <CompactJobHeader
          job={mockJob}
          customerName={customerName}
          vehicleName={vehicleName}
          licensePlate={licensePlate}
          serviceKind="車検"
          assignedMechanic={mockJob.assignedMechanic || undefined}
        />
      </AppHeader>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-32" style={{ paddingTop: 'calc(var(--header-height, 176px) + 1.5rem)' }}>
        <div className="space-y-6">
          {/* 走行距離入力欄（独立セクション） */}
          <Card className="border-slate-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Gauge className="h-6 w-6 text-slate-600 shrink-0" />
                走行距離
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <Input
                  id="mileage-input"
                  type="number"
                  inputMode="numeric"
                  value={mileage !== null && mileage !== undefined ? mileage.toString() : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setMileage(null);
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setMileage(numValue);
                      }
                    }
                  }}
                  placeholder="走行距離を入力（km）"
                  className="h-14 text-xl"
                />
                {mileage !== null && mileage !== undefined && (
                  <p className="text-lg text-slate-600">
                    現在: {mileage.toLocaleString()} km / {Math.round(mileage * 0.621371).toLocaleString()} mi
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ブログ撮影用写真 */}
          {blogPhotos.length > 0 && (
            <Card className="border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Camera className="h-6 w-6 text-slate-600 shrink-0" />
                  ブログ撮影用写真
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {blogPhotos.map((photo, index) => (
                    <div key={photo.fileId} className="relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 bg-slate-100">
                      <Image
                        src={photo.url}
                        alt={photo.fileName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 200px"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 点検項目等のセクション */}
          <InspectionRedesignTabs
            items={items}
            type={type}
            activeCategory={activeCategory || undefined}
            onCategoryChange={(category) => {
              setActiveCategory(
                category as InspectionCategory12Month | InspectionCategory24Month
              );
            }}
          >
            {(category) => {
              const categoryItems = items.filter((item) => item.category === category);
              const categories = getInspectionCategories(type);
              const categoryLabel =
                type === "12month"
                  ? INSPECTION_CATEGORY_12MONTH_LABELS[
                      category as InspectionCategory12Month
                    ]
                  : INSPECTION_CATEGORY_24MONTH_LABELS[
                      category as InspectionCategory24Month
                    ];

              return (
                <Card className="border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl font-semibold">
                      {categoryLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <InspectionBottomSheetList
                      items={categoryItems}
                      activeCategory={categoryLabel}
                      onStatusChange={handleStatusChange}
                      onPhotoAdd={handlePhotoAdd}
                      onPhotoDelete={handlePhotoDelete}
                      onNextSection={handleNextSection}
                      currentSection={categoryLabel}
                      totalSections={categories.length}
                      disabled={false}
                    />
                  </CardContent>
                </Card>
              );
            }}
          </InspectionRedesignTabs>

          {/* 測定値入力欄 */}
          <InspectionMeasurementInput
            measurements={measurements}
            onMeasurementsChange={setMeasurements}
            disabled={false}
          />

          {/* 交換部品等はPhase 5（整備・完成検査）に移動 */}

          {/* OBD診断結果（統合） */}
          <OBDDiagnosticUnifiedSection
            pdfResult={obdDiagnosticResult}
            onPdfUpload={handleOBDPdfUpload}
            onPdfRemove={handleOBDPdfRemove}
            disabled={false}
          />

          {/* 品質管理・最終検査 */}
          <InspectionQualityCheckSection
            data={qualityCheckData}
            onChange={setQualityCheckData}
            disabled={false}
          />

          {/* 作業メモ */}
          <Card className="border-slate-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <NotebookPen className="h-6 w-6 text-slate-600 shrink-0" />
                作業メモ
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                value={workMemo}
                onChange={(e) => setWorkMemo(e.target.value)}
                placeholder="作業メモを入力してください"
                className="text-lg min-h-[140px]"
                rows={5}
              />
            </CardContent>
          </Card>

          {/* 整備アドバイス */}
          <Card className="border-slate-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-slate-600 shrink-0" />
                整備アドバイス
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-start gap-2">
                <Textarea
                  value={maintenanceAdvice}
                  onChange={(e) => setMaintenanceAdvice(e.target.value)}
                  placeholder="整備アドバイスを入力してください"
                  className="text-lg flex-1 resize-none"
                  rows={1}
                />
                <VoiceInputButton
                  onTranscript={(text) => setMaintenanceAdvice(text)}
                  currentValue={maintenanceAdvice}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* プレビューと点検完了ボタン */}
          <div className="flex gap-4 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={handlePreview}
              className="flex-1 h-14 text-xl font-medium gap-2"
            >
              <Eye className="h-6 w-6 shrink-0" />
              プレビュー
            </Button>
            <Button
              onClick={handleComplete}
              className="flex-1 h-14 text-xl font-medium gap-2"
            >
              <Send className="h-6 w-6 shrink-0" />
              点検完了
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

