"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CoatingType,
  CoatingOptionId,
  getCoatingTypeList,
  getCoatingTypeConfig,
  getCoatingOptionList,
  calculateOptionsTotal,
} from "@/lib/coating-config";
import { Sparkles, CheckCircle2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// =============================================================================
// Props
// =============================================================================

interface CoatingPreEstimateViewProps {
  /** 選択されたコーティング種類 */
  selectedCoatingType?: CoatingType | null;
  /** コーティング種類選択変更ハンドラ */
  onCoatingTypeChange?: (type: CoatingType | null) => void;
  /** 選択されたオプションIDリスト */
  selectedOptionIds?: CoatingOptionId[];
  /** オプション選択変更ハンドラ */
  onOptionChange?: (optionIds: CoatingOptionId[]) => void;
  /** 基本コーティング金額（車両の寸法に応じて変動） */
  baseCoatingPrice?: number;
  /** 見積送信ハンドラ */
  onSendEstimate?: (estimate: {
    coatingType: CoatingType;
    basePrice: number;
    selectedOptions: CoatingOptionId[];
    optionsTotal: number;
    total: number;
  }) => void | Promise<void>;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function CoatingPreEstimateView({
  selectedCoatingType,
  onCoatingTypeChange,
  selectedOptionIds = [],
  onOptionChange,
  baseCoatingPrice,
  onSendEstimate,
  disabled = false,
}: CoatingPreEstimateViewProps) {
  const coatingTypeList = getCoatingTypeList();
  const optionList = getCoatingOptionList();
  const selectedCoatingConfig = selectedCoatingType
    ? getCoatingTypeConfig(selectedCoatingType)
    : null;

  // 同時施工判定（基本コーティングとオプションを同じ入庫で実施する場合）
  const isSimultaneous = selectedCoatingType !== null && selectedOptionIds.length > 0;

  // 基本コーティング金額（車両の寸法に応じて変動、未指定の場合は参考価格を使用）
  const actualBasePrice = baseCoatingPrice || selectedCoatingConfig?.basePrice || 0;

  // オプション合計金額（同時施工の場合は10％割引）
  const optionsTotal = useMemo(() => {
    return calculateOptionsTotal(selectedOptionIds, isSimultaneous);
  }, [selectedOptionIds, isSimultaneous]);

  // 合計金額
  const totalPrice = actualBasePrice + optionsTotal;

  /**
   * オプション選択変更ハンドラ
   */
  const handleOptionToggle = (optionId: CoatingOptionId, checked: boolean) => {
    if (!onOptionChange) return;
    if (checked) {
      onOptionChange([...selectedOptionIds, optionId]);
    } else {
      onOptionChange(selectedOptionIds.filter((id) => id !== optionId));
    }
  };

  /**
   * 見積送信ハンドラ
   */
  const handleSendEstimate = () => {
    if (!selectedCoatingType || !onSendEstimate) return;
    onSendEstimate({
      coatingType: selectedCoatingType,
      basePrice: actualBasePrice,
      selectedOptions: selectedOptionIds,
      optionsTotal,
      total: totalPrice,
    });
  };

  return (
    <div className="space-y-4">
      {/* コーティング種類選択 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Sparkles className="h-5 w-5 shrink-0" />
            コーティング種類選択
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">
              コーティングの種類を選択
              <span className="text-red-600 ml-1">*</span>
            </Label>
            <RadioGroup
              value={selectedCoatingType || ""}
              onValueChange={(value) => {
                if (onCoatingTypeChange) {
                  onCoatingTypeChange(value ? (value as CoatingType) : null);
                }
              }}
              disabled={disabled}
            >
              {coatingTypeList.map((type) => {
                const config = getCoatingTypeConfig(type);
                return (
                  <div key={type} className="flex items-start space-x-3 p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                    <RadioGroupItem value={type} id={type} className="mt-0.5" />
                    <Label
                      htmlFor={type}
                      className="flex-1 cursor-pointer font-normal text-base"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 text-base">{type}</span>
                        {config && (
                          <span className="text-base text-slate-700 mt-1">
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

          {/* 選択されたコーティング種類の情報表示 */}
          {selectedCoatingConfig && (
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-slate-900">
                  {selectedCoatingConfig.name}
                </span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  ¥{actualBasePrice.toLocaleString()}
                  {baseCoatingPrice === undefined && (
                    <span className="text-base text-slate-600 ml-1 font-normal">（参考価格）</span>
                  )}
                </span>
              </div>
              {selectedCoatingConfig.description && (
                <p className="text-base text-slate-700 mt-2">
                  {selectedCoatingConfig.description}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* オプションサービス選択 */}
      <Card className="border border-slate-300 rounded-xl shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            オプションサービス
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {optionList.map((option) => {
              const isSelected = selectedOptionIds.includes(option.id);
              const optionPrice = isSimultaneous
                ? option.simultaneousPrice
                : option.regularPrice;
              const isDiscounted = isSimultaneous && isSelected;

              return (
                <div
                  key={option.id}
                  className="flex items-start space-x-3 p-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    id={option.id}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      handleOptionToggle(option.id, checked as boolean);
                    }}
                    disabled={disabled}
                    className="h-5 w-5 mt-0.5"
                  />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer font-normal text-base"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 text-base">
                          {option.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {isDiscounted && (
                            <Badge variant="secondary" className="text-base font-medium px-2.5 py-1 shrink-0 whitespace-nowrap">
                              10%割引
                            </Badge>
                          )}
                          <span className="text-base font-bold text-slate-900 tabular-nums">
                            ¥{optionPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {option.description && (
                        <span className="text-base text-slate-700 mt-1">
                          {option.description}
                        </span>
                      )}
                      {isDiscounted && (
                        <span className="text-base text-slate-600 mt-1 line-through tabular-nums">
                          通常価格: ¥{option.regularPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>

          {/* 同時施工割引の説明 */}
          {isSimultaneous && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-base text-amber-900 font-medium mb-1">
                    同時施工割引適用中
                  </p>
                  <p className="text-base text-amber-800">
                    基本コーティングと同時に実施するオプションサービスは10％割引が適用されます
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 見積金額表示 */}
      {(selectedCoatingType || selectedOptionIds.length > 0) && (
        <Card className="border border-slate-300 rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-slate-900">見積金額</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {selectedCoatingType && (
                <div className="flex items-center justify-between text-base">
                  <span className="text-base font-medium text-slate-700">基本コーティング</span>
                  <span className="text-base font-medium text-slate-900 tabular-nums">
                    ¥{actualBasePrice.toLocaleString()}
                  </span>
                </div>
              )}
              {selectedOptionIds.length > 0 && (
                <>
                  <Separator className="bg-slate-200" />
                  <div className="space-y-2">
                    {selectedOptionIds.map((optionId) => {
                      const option = getCoatingOptionList().find(
                        (o) => o.id === optionId
                      );
                      if (!option) return null;
                      const optionPrice = isSimultaneous
                        ? option.simultaneousPrice
                        : option.regularPrice;
                      return (
                        <div
                          key={optionId}
                          className="flex items-center justify-between text-base"
                        >
                          <span className="text-base font-medium text-slate-700">{option.name}</span>
                          <span className="text-base font-medium text-slate-900 tabular-nums">
                            ¥{optionPrice.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <Separator className="bg-slate-200" />
              <div className="flex items-center justify-between pt-1">
                <span className="text-lg font-bold text-slate-900">合計</span>
                <span className="text-2xl font-bold text-primary tabular-nums">
                  ¥{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 見積送信ボタン */}
            {onSendEstimate && selectedCoatingType && (
              <Button
                onClick={handleSendEstimate}
                disabled={disabled || !selectedCoatingType}
                className="w-full h-12 text-base font-medium"
              >
                見積を送信
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}









