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
import { Sparkles, CheckCircle2 } from "lucide-react";
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5" />
            コーティング種類選択
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              コーティングの種類を選択
              <span className="text-red-500 ml-1">*</span>
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
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={type} />
                    <Label
                      htmlFor={type}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{type}</span>
                        {config && (
                          <span className="text-xs text-slate-600">
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
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">
                  {selectedCoatingConfig.name}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  ¥{actualBasePrice.toLocaleString()}
                  {baseCoatingPrice === undefined && (
                    <span className="text-xs text-slate-500 ml-1">（参考価格）</span>
                  )}
                </span>
              </div>
              {selectedCoatingConfig.description && (
                <p className="text-xs text-slate-600 mt-1">
                  {selectedCoatingConfig.description}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* オプションサービス選択 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5" />
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
                  className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    id={option.id}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      handleOptionToggle(option.id, checked as boolean);
                    }}
                    disabled={disabled}
                  />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">
                          {option.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {isDiscounted && (
                            <Badge variant="secondary" className="text-xs">
                              10%割引
                            </Badge>
                          )}
                          <span className="text-sm font-bold text-slate-900">
                            ¥{optionPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {option.description && (
                        <span className="text-xs text-slate-600 mt-1">
                          {option.description}
                        </span>
                      )}
                      {isDiscounted && (
                        <span className="text-xs text-slate-500 mt-1 line-through">
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
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 font-medium mb-1">
                💡 同時施工割引適用中
              </p>
              <p className="text-xs text-amber-700">
                基本コーティングと同時に実施するオプションサービスは10％割引が適用されます
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 見積金額表示 */}
      {(selectedCoatingType || selectedOptionIds.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">見積金額</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {selectedCoatingType && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">基本コーティング</span>
                  <span className="font-medium text-slate-900">
                    ¥{actualBasePrice.toLocaleString()}
                  </span>
                </div>
              )}
              {selectedOptionIds.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1">
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
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-slate-600">{option.name}</span>
                          <span className="font-medium text-slate-900">
                            ¥{optionPrice.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-slate-900">合計</span>
                <span className="text-xl font-bold text-slate-900">
                  ¥{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 見積送信ボタン */}
            {onSendEstimate && selectedCoatingType && (
              <Button
                onClick={handleSendEstimate}
                disabled={disabled || !selectedCoatingType}
                className="w-full"
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









