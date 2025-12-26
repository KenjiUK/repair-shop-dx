"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  TuningPartsType,
  getTuningPartsTypeList,
  getTuningPartsTypeConfig,
} from "@/lib/tuning-parts-config";
import { Wrench } from "lucide-react";

// =============================================================================
// Props
// =============================================================================

interface TuningPartsTypeSelectorProps {
  /** 選択された種類 */
  selectedType?: TuningPartsType | null;
  /** 種類選択変更ハンドラ */
  onTypeChange?: (type: TuningPartsType | null) => void;
  /** 無効化 */
  disabled?: boolean;
  /** 必須か */
  required?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function TuningPartsTypeSelector({
  selectedType,
  onTypeChange,
  disabled = false,
  required = false,
}: TuningPartsTypeSelectorProps) {
  const typeList = getTuningPartsTypeList();
  const selectedConfig = selectedType ? getTuningPartsTypeConfig(selectedType) : null;

  return (
    <Card className="border border-slate-300 rounded-xl shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Wrench className="h-5 w-5 shrink-0" />
          種類選択
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-medium">
            種類を選択
            {required && <span className="text-red-600 ml-1">*</span>}
          </Label>
          <RadioGroup
            value={selectedType || ""}
            onValueChange={(value) => {
              if (onTypeChange) {
                onTypeChange(value ? (value as TuningPartsType) : null);
              }
            }}
            disabled={disabled}
          >
            {typeList.map((type) => {
              const config = getTuningPartsTypeConfig(type);
              return (
                <div key={type} className="flex items-center space-x-2">
                  <RadioGroupItem value={type} id={type} />
                  <Label
                    htmlFor={type}
                    className="flex-1 cursor-pointer font-normal text-base"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-base">{type}</span>
                      {config && (
                        <span className="text-base text-slate-700">
                          {config.description}
                        </span>
                      )}
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* 選択された種類の情報表示 */}
        {selectedConfig && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-base font-medium text-slate-900">
                {selectedConfig.name}
              </span>
            </div>
            <div className="text-base text-slate-700">
              <p>{selectedConfig.description}</p>
              {selectedConfig.inspectionCategories.length > 0 && (
                <p className="mt-1">
                  検査カテゴリ: {selectedConfig.inspectionCategories.join("、")}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}









