"use client";

/**
 * 測定値入力コンポーネント（インライン版）
 * ボトムシート内で使用する測定値入力フィールド
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InspectionMeasurements } from "@/types/inspection-redesign";
import { Ruler } from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface InspectionMeasurementInputInlineProps {
  /** 項目ID */
  itemId: string;
  /** 項目名 */
  itemLabel: string;
  /** 現在の測定値データ */
  measurements: InspectionMeasurements;
  /** 測定値変更ハンドラ */
  onMeasurementsChange: (measurements: InspectionMeasurements) => void;
  /** 確定ハンドラ */
  onConfirm: () => void;
  /** キャンセルハンドラ */
  onCancel: () => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * インライン測定値入力コンポーネント
 */
export function InspectionMeasurementInputInline({
  itemId,
  itemLabel,
  measurements,
  onMeasurementsChange,
  onConfirm,
  onCancel,
  disabled = false,
}: InspectionMeasurementInputInlineProps) {
  // ローカル状態（入力中）
  const [localMeasurements, setLocalMeasurements] = useState<Partial<InspectionMeasurements>>({});

  // 項目IDに基づいて、どの測定値を入力すべきか判定
  const getMeasurementType = () => {
    // CO/HC濃度: engine-room-014 (12ヶ月点検・24ヶ月点検共通)
    if (itemId === "engine-room-014") {
      return "coHc";
    }
    // タイヤの溝の深さ: running-003 (12ヶ月点検) または chassis-020 (24ヶ月点検)
    if (itemId === "running-003" || itemId === "chassis-020") {
      return "tire";
    }
    // ブレーキパッド/ライニングの厚さ: brake-002 (12ヶ月点検) または chassis-003 (24ヶ月点検)
    if (itemId === "brake-002" || itemId === "chassis-003") {
      return "brake";
    }
    return null;
  };

  const measurementType = getMeasurementType();

  // 初期値の設定
  useEffect(() => {
    if (measurementType === "coHc") {
      setLocalMeasurements({
        co: measurements.co,
        hc: measurements.hc,
      });
    } else if (measurementType === "tire") {
      setLocalMeasurements({
        tireFrontLeft: measurements.tireFrontLeft,
        tireFrontRight: measurements.tireFrontRight,
        tireRearLeft: measurements.tireRearLeft,
        tireRearRight: measurements.tireRearRight,
      });
    } else if (measurementType === "brake") {
      setLocalMeasurements({
        brakeFrontLeft: measurements.brakeFrontLeft,
        brakeFrontRight: measurements.brakeFrontRight,
        brakeRearLeft: measurements.brakeRearLeft,
        brakeRearRight: measurements.brakeRearRight,
      });
    }
  }, [itemId, measurementType, measurements]);

  // 数値入力ハンドラ
  const handleNumberChange = (field: keyof InspectionMeasurements, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setLocalMeasurements((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  // 確定ハンドラ
  const handleConfirm = () => {
    onMeasurementsChange({
      ...measurements,
      ...localMeasurements,
    });
    onConfirm();
  };

  // 測定値入力フィールドをレンダリング
  const renderInputFields = () => {
    if (measurementType === "coHc") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="co" className="text-base font-medium text-slate-700">
              CO濃度（%）
            </Label>
            <Input
              id="co"
              type="number"
              inputMode="decimal"
              value={localMeasurements.co !== undefined ? localMeasurements.co.toString() : ""}
              onChange={(e) => handleNumberChange("co", e.target.value)}
              placeholder="0.00"
              disabled={disabled}
              className="h-12 text-base mt-2"
            />
          </div>
          <div>
            <Label htmlFor="hc" className="text-base font-medium text-slate-700">
              HC濃度（ppm）
            </Label>
            <Input
              id="hc"
              type="number"
              inputMode="numeric"
              value={localMeasurements.hc !== undefined ? localMeasurements.hc.toString() : ""}
              onChange={(e) => handleNumberChange("hc", e.target.value)}
              placeholder="0"
              disabled={disabled}
              className="h-12 text-base mt-2"
            />
          </div>
        </div>
      );
    } else if (measurementType === "tire") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tireFrontLeft" className="text-base font-medium text-slate-700">
                前輪 左（mm）
              </Label>
              <Input
                id="tireFrontLeft"
                type="number"
                inputMode="decimal"
                value={localMeasurements.tireFrontLeft !== undefined ? localMeasurements.tireFrontLeft.toString() : ""}
                onChange={(e) => handleNumberChange("tireFrontLeft", e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="h-12 text-base mt-2"
              />
            </div>
            <div>
              <Label htmlFor="tireFrontRight" className="text-base font-medium text-slate-700">
                前輪 右（mm）
              </Label>
              <Input
                id="tireFrontRight"
                type="number"
                inputMode="decimal"
                value={localMeasurements.tireFrontRight !== undefined ? localMeasurements.tireFrontRight.toString() : ""}
                onChange={(e) => handleNumberChange("tireFrontRight", e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="h-12 text-base mt-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tireRearLeft" className="text-base font-medium text-slate-700">
                後輪 左（mm）
              </Label>
              <Input
                id="tireRearLeft"
                type="number"
                inputMode="decimal"
                value={localMeasurements.tireRearLeft !== undefined ? localMeasurements.tireRearLeft.toString() : ""}
                onChange={(e) => handleNumberChange("tireRearLeft", e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="h-12 text-base mt-2"
              />
            </div>
            <div>
              <Label htmlFor="tireRearRight" className="text-base font-medium text-slate-700">
                後輪 右（mm）
              </Label>
              <Input
                id="tireRearRight"
                type="number"
                inputMode="decimal"
                value={localMeasurements.tireRearRight !== undefined ? localMeasurements.tireRearRight.toString() : ""}
                onChange={(e) => handleNumberChange("tireRearRight", e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="h-12 text-base mt-2"
              />
            </div>
          </div>
        </div>
      );
    } else if (measurementType === "brake") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brakeFrontLeft" className="text-base font-medium text-slate-700">
                前輪 左（mm）
              </Label>
              <Input
                id="brakeFrontLeft"
                type="number"
                inputMode="decimal"
                value={localMeasurements.brakeFrontLeft !== undefined ? localMeasurements.brakeFrontLeft.toString() : ""}
                onChange={(e) => handleNumberChange("brakeFrontLeft", e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="h-12 text-base mt-2"
              />
            </div>
            <div>
              <Label htmlFor="brakeFrontRight" className="text-base font-medium text-slate-700">
                前輪 右（mm）
              </Label>
              <Input
                id="brakeFrontRight"
                type="number"
                inputMode="decimal"
                value={localMeasurements.brakeFrontRight !== undefined ? localMeasurements.brakeFrontRight.toString() : ""}
                onChange={(e) => handleNumberChange("brakeFrontRight", e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="h-12 text-base mt-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brakeRearLeft" className="text-base font-medium text-slate-700">
                後輪 左（mm）
              </Label>
              <Input
                id="brakeRearLeft"
                type="number"
                inputMode="decimal"
                value={localMeasurements.brakeRearLeft !== undefined ? localMeasurements.brakeRearLeft.toString() : ""}
                onChange={(e) => handleNumberChange("brakeRearLeft", e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="h-12 text-base mt-2"
              />
            </div>
            <div>
              <Label htmlFor="brakeRearRight" className="text-base font-medium text-slate-700">
                後輪 右（mm）
              </Label>
              <Input
                id="brakeRearRight"
                type="number"
                inputMode="decimal"
                value={localMeasurements.brakeRearRight !== undefined ? localMeasurements.brakeRearRight.toString() : ""}
                onChange={(e) => handleNumberChange("brakeRearRight", e.target.value)}
                placeholder="0.0"
                disabled={disabled}
                className="h-12 text-base mt-2"
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!measurementType) {
    return null;
  }

  return (
    <div className="space-y-4 pt-4 border-t border-slate-200">
      <div className="flex items-center gap-2">
        <Ruler className="h-5 w-5 text-slate-600 shrink-0" />
        <h3 className="text-lg font-semibold text-slate-900">測定値を入力</h3>
      </div>
      {renderInputFields()}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={disabled}
          className="flex-1 h-12 text-base"
        >
          キャンセル
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={disabled}
          className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
        >
          確定
        </Button>
      </div>
    </div>
  );
}

