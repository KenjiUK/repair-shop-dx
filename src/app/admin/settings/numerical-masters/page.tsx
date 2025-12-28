"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  getNumericalMasterConfig, 
  saveNumericalMasterConfig, 
  resetNumericalMasterConfig,
  DEFAULT_NUMERICAL_MASTER_CONFIG,
  type NumericalMasterConfig 
} from "@/lib/numerical-master-config";
import { AppHeader } from "@/components/layout/app-header";
import { Settings, Save, RotateCcw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * 数値マスター管理画面
 */
export default function NumericalMastersPage() {
  const [config, setConfig] = useState<NumericalMasterConfig>(DEFAULT_NUMERICAL_MASTER_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // 設定を読み込み
  useEffect(() => {
    const loadedConfig = getNumericalMasterConfig();
    setConfig(loadedConfig);
    setIsLoading(false);
  }, []);

  // 設定値の変更ハンドラ
  const handleThresholdChange = (path: string, value: number) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      const keys = path.split(".");
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      setHasChanges(true);
      return newConfig;
    });
  };

  // 保存
  const handleSave = () => {
    try {
      saveNumericalMasterConfig(config);
      setHasChanges(false);
      toast.success("設定を保存しました");
    } catch (error) {
      toast.error("設定の保存に失敗しました");
    }
  };

  // リセット
  const handleReset = () => {
    if (confirm("設定をデフォルト値にリセットしますか？")) {
      resetNumericalMasterConfig();
      setConfig(DEFAULT_NUMERICAL_MASTER_CONFIG);
      setHasChanges(false);
      toast.success("設定をリセットしました");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-base text-slate-700">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader
        isTopPage={true}
        hideBrandOnScroll={false}
        maxWidthClassName="max-w-5xl"
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* ページタイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-600 shrink-0" />
            数値マスター管理
          </h1>
        </div>
        {/* 保存・リセットボタン */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span className="text-base font-medium">未保存の変更があります</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="gap-2 h-12 text-base font-medium"
            >
              <RotateCcw className="h-5 w-5 shrink-0" />
              リセット
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="gap-2 h-12 text-base font-medium"
            >
              <Save className="h-5 w-5 shrink-0" />
              保存
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 閾値設定 */}
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">閾値設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 長期化承認待ち */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="longPendingApprovalDays" className="text-base font-medium text-slate-900">
                    長期化承認待ちの閾値（日数）
                  </Label>
                  <Input
                    id="longPendingApprovalDays"
                    type="number"
                    min="1"
                    value={config.thresholds.longPendingApprovalDays}
                    onChange={(e) => handleThresholdChange("thresholds.longPendingApprovalDays", Number(e.target.value))}
                    className="mt-1.5 h-12 text-base"
                  />
                  <p className="text-base text-slate-700 mt-1.5">
                    見積提示後、この日数以上経過した案件を「長期化承認待ち」として表示します
                  </p>
                </div>

                {/* 長期化部品調達 */}
                <div>
                  <Label htmlFor="longPartsProcurementDays" className="text-base font-medium text-slate-900">
                    長期化部品調達の閾値（日数）
                  </Label>
                  <Input
                    id="longPartsProcurementDays"
                    type="number"
                    min="1"
                    value={config.thresholds.longPartsProcurementDays}
                    onChange={(e) => handleThresholdChange("thresholds.longPartsProcurementDays", Number(e.target.value))}
                    className="mt-1.5 h-12 text-base"
                  />
                  <p className="text-base text-slate-700 mt-1.5">
                    部品発注後、この日数以上経過した案件を「長期化部品調達」として表示します
                  </p>
                </div>
              </div>

              <Separator />

              {/* 緊急案件の閾値 */}
              <div>
                <Label className="text-base font-medium text-slate-900 mb-3 block">緊急案件の閾値（時間）</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="urgentJobHoursHigh" className="text-base font-medium text-slate-900">
                      高緊急度の閾値（時間）
                    </Label>
                    <Input
                      id="urgentJobHoursHigh"
                      type="number"
                      min="0"
                      step="0.5"
                      value={config.thresholds.urgentJobHours.high}
                      onChange={(e) => handleThresholdChange("thresholds.urgentJobHours.high", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                    <p className="text-base text-slate-700 mt-1.5">
                      この時間以上経過した案件を「高緊急度」として表示します
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="urgentJobHoursMedium" className="text-base font-medium text-slate-900">
                      中緊急度の閾値（時間）
                    </Label>
                    <Input
                      id="urgentJobHoursMedium"
                      type="number"
                      min="0"
                      step="0.5"
                      value={config.thresholds.urgentJobHours.medium}
                      onChange={(e) => handleThresholdChange("thresholds.urgentJobHours.medium", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                    <p className="text-base text-slate-700 mt-1.5">
                      この時間以上経過した案件を「中緊急度」として表示します
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* タイヤ検査の閾値 */}
              <div>
                <Label className="text-base font-medium text-slate-900 mb-3 block">タイヤ検査の閾値（mm）</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tireLegalThreshold" className="text-base font-medium text-slate-900">
                      法定基準（mm）
                    </Label>
                    <Input
                      id="tireLegalThreshold"
                      type="number"
                      min="0"
                      step="0.1"
                      value={config.thresholds.tireInspection.legalThreshold}
                      onChange={(e) => handleThresholdChange("thresholds.tireInspection.legalThreshold", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                    <p className="text-base text-slate-700 mt-1.5">
                      この値未満のタイヤは「交換必要」として表示します
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="tireRecommendedThreshold" className="text-base font-medium text-slate-900">
                      推奨基準（mm）
                    </Label>
                    <Input
                      id="tireRecommendedThreshold"
                      type="number"
                      min="0"
                      step="0.1"
                      value={config.thresholds.tireInspection.recommendedThreshold}
                      onChange={(e) => handleThresholdChange("thresholds.tireInspection.recommendedThreshold", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                    <p className="text-base text-slate-700 mt-1.5">
                      この値未満のタイヤは「注意」として表示します
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 時間設定 */}
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">時間設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="estimatedDepartureHours" className="text-base font-medium text-slate-900">
                  出庫予定時間の推定（時間）
                </Label>
                <Input
                  id="estimatedDepartureHours"
                  type="number"
                  min="1"
                  value={config.timeSettings.estimatedDepartureHours}
                  onChange={(e) => handleThresholdChange("timeSettings.estimatedDepartureHours", Number(e.target.value))}
                  className="mt-1.5 h-12 text-base"
                />
                <p className="text-base text-slate-700 mt-1.5">
                  入庫からこの時間後を出庫予定時間として表示します
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 料金設定 */}
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">料金設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* コーティング料金 */}
              <div>
                <Label className="text-base font-medium text-slate-900 mb-3 block">コーティング料金（円）</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="coatingHighMoseCoatEdge" className="text-base font-medium text-slate-900">
                      ハイモースコート エッジ
                    </Label>
                    <Input
                      id="coatingHighMoseCoatEdge"
                      type="number"
                      min="0"
                      value={config.pricing.coating.highMoseCoatEdge}
                      onChange={(e) => handleThresholdChange("pricing.coating.highMoseCoatEdge", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coatingHighMoseCoatGlow" className="text-base font-medium text-slate-900">
                      ハイモースコート グロウ
                    </Label>
                    <Input
                      id="coatingHighMoseCoatGlow"
                      type="number"
                      min="0"
                      value={config.pricing.coating.highMoseCoatGlow}
                      onChange={(e) => handleThresholdChange("pricing.coating.highMoseCoatGlow", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coatingGuardGraze" className="text-base font-medium text-slate-900">
                      ガードグレイズ
                    </Label>
                    <Input
                      id="coatingGuardGraze"
                      type="number"
                      min="0"
                      value={config.pricing.coating.guardGraze}
                      onChange={(e) => handleThresholdChange("pricing.coating.guardGraze", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* コーティングオプション料金 */}
              <div>
                <Label className="text-base font-medium text-slate-900 mb-3 block">コーティングオプション料金（円）</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coatingOptionWheelCoating" className="text-base font-medium text-slate-900">
                      ホイールコーティング（4本セット）
                    </Label>
                    <Input
                      id="coatingOptionWheelCoating"
                      type="number"
                      min="0"
                      value={config.pricing.coatingOptions.wheelCoating}
                      onChange={(e) => handleThresholdChange("pricing.coatingOptions.wheelCoating", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coatingOptionWindowWaterRepellent" className="text-base font-medium text-slate-900">
                      ウィンドウ撥水（フロント三面）
                    </Label>
                    <Input
                      id="coatingOptionWindowWaterRepellent"
                      type="number"
                      min="0"
                      value={config.pricing.coatingOptions.windowWaterRepellent}
                      onChange={(e) => handleThresholdChange("pricing.coatingOptions.windowWaterRepellent", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coatingOptionHeadlightPolish" className="text-base font-medium text-slate-900">
                      ヘッドライト研磨・クリアコート（左右2個）
                    </Label>
                    <Input
                      id="coatingOptionHeadlightPolish"
                      type="number"
                      min="0"
                      value={config.pricing.coatingOptions.headlightPolish}
                      onChange={(e) => handleThresholdChange("pricing.coatingOptions.headlightPolish", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coatingOptionInteriorCleaning" className="text-base font-medium text-slate-900">
                      インテリアクリーニング
                    </Label>
                    <Input
                      id="coatingOptionInteriorCleaning"
                      type="number"
                      min="0"
                      value={config.pricing.coatingOptions.interiorCleaning}
                      onChange={(e) => handleThresholdChange("pricing.coatingOptions.interiorCleaning", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coatingOptionBumperCoat" className="text-base font-medium text-slate-900">
                      バンパーコート（1本）
                    </Label>
                    <Input
                      id="coatingOptionBumperCoat"
                      type="number"
                      min="0"
                      value={config.pricing.coatingOptions.bumperCoat}
                      onChange={(e) => handleThresholdChange("pricing.coatingOptions.bumperCoat", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coatingOptionWindowFilm" className="text-base font-medium text-slate-900">
                      ウィンドウフィルム（1面）
                    </Label>
                    <Input
                      id="coatingOptionWindowFilm"
                      type="number"
                      min="0"
                      value={config.pricing.coatingOptions.windowFilm}
                      onChange={(e) => handleThresholdChange("pricing.coatingOptions.windowFilm", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coatingOptionConvertibleTopCoating" className="text-base font-medium text-slate-900">
                      幌コーティング
                    </Label>
                    <Input
                      id="coatingOptionConvertibleTopCoating"
                      type="number"
                      min="0"
                      value={config.pricing.coatingOptions.convertibleTopCoating}
                      onChange={(e) => handleThresholdChange("pricing.coatingOptions.convertibleTopCoating", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="simultaneousDiscountRate" className="text-base font-medium text-slate-900">
                      同時施工割引率（%）
                    </Label>
                    <Input
                      id="simultaneousDiscountRate"
                      type="number"
                      min="0"
                      max="100"
                      value={config.pricing.simultaneousDiscountRate}
                      onChange={(e) => handleThresholdChange("pricing.simultaneousDiscountRate", Number(e.target.value))}
                      className="mt-1.5 h-12 text-base"
                    />
                    <p className="text-base text-slate-700 mt-1.5">
                      同時施工時の割引率（例: 10 = 10%割引）
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* メンテナンスメニューの所要時間 */}
          <Card className="border border-slate-300 rounded-xl shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">メンテナンスメニューの所要時間（分）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(config.maintenanceDurations).map(([menuName, duration]) => (
                  <div key={menuName}>
                    <Label htmlFor={`maintenance-${menuName}`} className="text-base font-medium text-slate-900">
                      {menuName}
                    </Label>
                    <Input
                      id={`maintenance-${menuName}`}
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => {
                        setConfig((prev) => {
                          const newConfig = { ...prev };
                          newConfig.maintenanceDurations[menuName] = Number(e.target.value);
                          setHasChanges(true);
                          return newConfig;
                        });
                      }}
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

