"use client";

import React from "react";
import { Gift, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { OptionMenuItem } from "@/types";

// =============================================================================
// 型定義
// =============================================================================

export interface OptionMenuSelectorProps {
  /** オプションメニューリスト */
  optionMenus: OptionMenuItem[];
  /** 選択済みメニューIDリスト */
  selectedMenuIds: string[];
  /** 選択変更時のコールバック */
  onMenuSelectionChange: (menuId: string, selected: boolean) => void;
  /** 同時実施するサービス種類（車検 or 12ヶ月点検） */
  simultaneousService: "車検" | "12ヶ月点検";
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// コンポーネント
// =============================================================================

/**
 * オプションメニュー選択コンポーネント（12ヶ月点検専用）
 *
 * 機能:
 * - 8種類のオプションメニューを一覧表示
 * - 同時実施で10%割引を適用
 * - チェックボックスで選択/解除
 * - 割引前価格と割引後価格を併記
 * - リアルタイムで合計金額を更新
 */
export function OptionMenuSelector({
  optionMenus,
  selectedMenuIds,
  onMenuSelectionChange,
  simultaneousService,
  disabled = false,
  className,
}: OptionMenuSelectorProps) {
  const handleToggle = (menuId: string) => {
    if (disabled) {
      return;
    }
    const isSelected = selectedMenuIds.includes(menuId);
    onMenuSelectionChange(menuId, !isSelected);
  };

  const selectedMenus = optionMenus.filter((menu) =>
    selectedMenuIds.includes(menu.id)
  );
  const totalDiscountedPrice = selectedMenus.reduce(
    (sum, menu) => sum + menu.discountedPrice,
    0
  );
  const totalDiscount = selectedMenus.reduce(
    (sum, menu) => sum + (menu.originalPrice - menu.discountedPrice),
    0
  );

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-5 w-5 text-orange-500" />
            オプションメニュー
            <Badge variant="default" className="bg-orange-500 text-white">
              {simultaneousService}と同時実施で10%割引
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {optionMenus.map((menu) => {
            const isSelected = selectedMenuIds.includes(menu.id);

            return (
              <div
                key={menu.id}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all cursor-pointer",
                  isSelected
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleToggle(menu.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(menu.id)}
                    disabled={disabled}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {menu.name}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {menu.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <>
                              <span className="text-xs text-slate-400 line-through">
                                ¥{menu.originalPrice.toLocaleString()}
                              </span>
                              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                ¥{menu.discountedPrice.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              ¥{menu.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            割引: ¥
                            {(menu.originalPrice - menu.discountedPrice).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          menu.badge?.color === "green"
                            ? "border-green-500 text-green-700 dark:text-green-400"
                            : "border-blue-500 text-blue-700 dark:text-blue-400"
                        )}
                      >
                        {menu.badge?.text}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        {menu.estimatedTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {selectedMenus.length > 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  選択済みオプション合計
                </span>
                <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                  ¥{totalDiscountedPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>割引額合計</span>
                <span className="font-medium text-orange-600 dark:text-orange-400">
                  -¥{totalDiscount.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
