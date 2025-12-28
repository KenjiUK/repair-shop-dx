"use client";

/**
 * 12ヶ月点検 測定値入力コンポーネント
 * 
 * デザインシステム準拠
 */

import { InspectionMeasurements } from "@/types/inspection-redesign";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Ruler, Gauge } from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface InspectionMeasurementInputProps {
  /** 測定値データ */
  measurements: InspectionMeasurements;
  /** 測定値変更ハンドラ */
  onMeasurementsChange: (measurements: InspectionMeasurements) => void;
  /** 走行距離（km） */
  mileage?: number | null;
  /** 走行距離変更ハンドラ */
  onMileageChange?: (value: string) => void;
  /** 走行距離確定ハンドラ（blur時） */
  onMileageBlur?: () => void;
  /** 走行距離更新中フラグ */
  isUpdatingMileage?: boolean;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * 12ヶ月点検 測定値入力コンポーネント
 */
export function InspectionMeasurementInput({
  measurements,
  onMeasurementsChange,
  mileage,
  onMileageChange,
  onMileageBlur,
  isUpdatingMileage = false,
  disabled = false,
}: InspectionMeasurementInputProps) {
  // 数値入力ハンドラ
  const handleNumberChange = (
    field: keyof InspectionMeasurements,
    value: string
  ) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    onMeasurementsChange({
      ...measurements,
      [field]: numValue,
    });
  };

  return (
    <Card className="border-slate-200 shadow-md dark:border-slate-700 dark:bg-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <Ruler className="h-6 w-6 text-slate-600 shrink-0 dark:text-white" />
          測定値記入欄
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
        {/* 走行距離（オプション） */}
        {onMileageChange && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2 dark:text-white">
              <Gauge className="h-6 w-6 text-slate-600 shrink-0 dark:text-white" />
              点検時の総走行距離
            </h3>
            <div className="flex items-center gap-3">
              <Input
                id="mileage"
                type="number"
                inputMode="numeric"
                value={mileage !== null && mileage !== undefined ? mileage.toString() : ""}
                onChange={(e) => onMileageChange(e.target.value)}
                onBlur={onMileageBlur}
                placeholder="走行距離を入力"
                disabled={isUpdatingMileage || disabled}
                className="h-16 text-xl flex-1"
              />
              <span className="text-xl font-medium text-slate-600 dark:text-white">km / mi</span>
            </div>
            {mileage !== null && mileage !== undefined && (
              <p className="text-lg text-slate-600 dark:text-white">
                現在: {mileage.toLocaleString()} km / {Math.round(mileage * 0.621371).toLocaleString()} mi
              </p>
            )}
            <Separator />
          </div>
        )}

        {/* CO・HC濃度 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            排気ガス濃度
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="co" className="text-lg font-medium dark:text-white">
                CO濃度（%）
              </Label>
              <Input
                id="co"
                type="number"
                step="0.1"
                value={measurements.co ?? ""}
                onChange={(e) => handleNumberChange("co", e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hc" className="text-lg font-medium dark:text-white">
                HC濃度（ppm）
              </Label>
              <Input
                id="hc"
                type="number"
                step="1"
                value={measurements.hc ?? ""}
                onChange={(e) => handleNumberChange("hc", e.target.value)}
                placeholder="0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ブレーキパッド厚さ */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            ブレーキパッド、ライニングの厚さ（mm）
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brakeFrontLeft" className="text-lg font-medium dark:text-white">
                前輪 左
              </Label>
              <Input
                id="brakeFrontLeft"
                type="number"
                step="0.1"
                value={measurements.brakeFrontLeft ?? ""}
                onChange={(e) =>
                  handleNumberChange("brakeFrontLeft", e.target.value)
                }
                placeholder="0.0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="brakeFrontRight"
                className="text-lg font-medium dark:text-white"
              >
                前輪 右
              </Label>
              <Input
                id="brakeFrontRight"
                type="number"
                step="0.1"
                value={measurements.brakeFrontRight ?? ""}
                onChange={(e) =>
                  handleNumberChange("brakeFrontRight", e.target.value)
                }
                placeholder="0.0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brakeRearLeft" className="text-lg font-medium dark:text-white">
                後輪 左
              </Label>
              <Input
                id="brakeRearLeft"
                type="number"
                step="0.1"
                value={measurements.brakeRearLeft ?? ""}
                onChange={(e) =>
                  handleNumberChange("brakeRearLeft", e.target.value)
                }
                placeholder="0.0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brakeRearRight" className="text-lg font-medium dark:text-white">
                後輪 右
              </Label>
              <Input
                id="brakeRearRight"
                type="number"
                step="0.1"
                value={measurements.brakeRearRight ?? ""}
                onChange={(e) =>
                  handleNumberChange("brakeRearRight", e.target.value)
                }
                placeholder="0.0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* タイヤ溝の深さ */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            タイヤの溝の深さ（mm）
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tireFrontLeft" className="text-lg font-medium dark:text-white">
                前輪 左
              </Label>
              <Input
                id="tireFrontLeft"
                type="number"
                step="0.1"
                value={measurements.tireFrontLeft ?? ""}
                onChange={(e) =>
                  handleNumberChange("tireFrontLeft", e.target.value)
                }
                placeholder="0.0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tireFrontRight" className="text-lg font-medium dark:text-white">
                前輪 右
              </Label>
              <Input
                id="tireFrontRight"
                type="number"
                step="0.1"
                value={measurements.tireFrontRight ?? ""}
                onChange={(e) =>
                  handleNumberChange("tireFrontRight", e.target.value)
                }
                placeholder="0.0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tireRearLeft" className="text-lg font-medium dark:text-white">
                後輪 左
              </Label>
              <Input
                id="tireRearLeft"
                type="number"
                step="0.1"
                value={measurements.tireRearLeft ?? ""}
                onChange={(e) =>
                  handleNumberChange("tireRearLeft", e.target.value)
                }
                placeholder="0.0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tireRearRight" className="text-lg font-medium dark:text-white">
                後輪 右
              </Label>
              <Input
                id="tireRearRight"
                type="number"
                step="0.1"
                value={measurements.tireRearRight ?? ""}
                onChange={(e) =>
                  handleNumberChange("tireRearRight", e.target.value)
                }
                placeholder="0.0"
                disabled={disabled}
                className="h-16 text-xl"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


