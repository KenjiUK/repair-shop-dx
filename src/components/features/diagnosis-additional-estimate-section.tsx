"use client";

/**
 * 診断ページ用 追加見積入力セクション
 * 
 * 推奨整備と任意整備の項目を入力できるセクション
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { EstimateLineItem, EstimatePriority } from "@/types";
import { cleanNumericInput, parseNumericValue } from "@/lib/number-input";

// =============================================================================
// Constants
// =============================================================================

/**
 * サービス・品目マスタリスト
 */
const SERVICE_ITEM_MASTER = [
  "エンジンオイル交換（下抜き）",
  "クーラント交換",
  "バッテリー交換",
  "タイヤ交換作業（4本）",
  "ブレーキフルード交換",
  "ブレーキパッド交換",
  "ミッションオイル交換",
  "ATフルード交換作業",
];

// =============================================================================
// Props
// =============================================================================

interface DiagnosisAdditionalEstimateSectionProps {
  /** 今回絶対必要な項目（旧: 必須整備） */
  requiredItems?: EstimateLineItem[];
  /** やったほうがいい項目（旧: 推奨整備） */
  recommendedItems?: EstimateLineItem[];
  /** お客さん次第の項目（旧: 任意整備） */
  optionalItems?: EstimateLineItem[];
  /** 今回絶対必要項目更新ハンドラ */
  onRequiredItemsChange?: (items: EstimateLineItem[]) => void;
  /** やったほうがいい項目更新ハンドラ */
  onRecommendedItemsChange?: (items: EstimateLineItem[]) => void;
  /** お客さん次第項目更新ハンドラ */
  onOptionalItemsChange?: (items: EstimateLineItem[]) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function DiagnosisAdditionalEstimateSection({
  requiredItems,
  recommendedItems,
  optionalItems,
  onRequiredItemsChange,
  onRecommendedItemsChange,
  onOptionalItemsChange,
  disabled = false,
}: DiagnosisAdditionalEstimateSectionProps) {
  // 安全な配列を確保（undefined/nullの場合は空配列）
  const safeRequiredItems = requiredItems || [];
  const safeRecommendedItems = recommendedItems || [];
  const safeOptionalItems = optionalItems || [];

  // 項目追加ハンドラ
  const handleAddItem = (priority: EstimatePriority) => {
    const newItem: EstimateLineItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      partQuantity: 1,
      partUnitPrice: 0,
      laborCost: 0,
      priority,
      linkedPhotoId: null,
      linkedVideoId: null,
      transcription: null,
    };

    if (priority === "required") {
      onRequiredItemsChange?.([...safeRequiredItems, newItem]);
    } else if (priority === "recommended") {
      onRecommendedItemsChange?.([...safeRecommendedItems, newItem]);
    } else {
      onOptionalItemsChange?.([...safeOptionalItems, newItem]);
    }
  };

  // 項目更新ハンドラ
  const handleUpdateItem = (id: string, updates: Partial<EstimateLineItem>, priority: EstimatePriority) => {
    if (priority === "required") {
      onRequiredItemsChange?.(
        safeRequiredItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    } else if (priority === "recommended") {
      onRecommendedItemsChange?.(
        safeRecommendedItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    } else {
      onOptionalItemsChange?.(
        safeOptionalItems.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    }
  };

  // 項目削除ハンドラ
  const handleDeleteItem = (id: string, priority: EstimatePriority) => {
    if (priority === "required") {
      onRequiredItemsChange?.(safeRequiredItems.filter((item) => item.id !== id));
    } else if (priority === "recommended") {
      onRecommendedItemsChange?.(safeRecommendedItems.filter((item) => item.id !== id));
    } else {
      onOptionalItemsChange?.(safeOptionalItems.filter((item) => item.id !== id));
    }
  };

  return (
    <Card className="border-slate-200 shadow-md hover:shadow-lg transition-shadow dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-3xl font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
          <Calculator className="h-9 w-9 text-slate-600 shrink-0 dark:text-white" />
          車検外提案（車検とは切り分けて説明した方が分かりやすい内容）
        </CardTitle>
        <p className="text-2xl text-slate-700 mt-2 dark:text-slate-300">
          車検とは関係ない、車検とは切り分けて説明した方が分かりやすい内容を記録してください。
          <br />
          点検項目で発見された問題（車検の説明の中でそのまま伝えられる内容）は、点検項目のステータスで記録してください。
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 今回絶対必要セクション（旧: 必須整備） */}
        <EstimateSubSection
          title="今回絶対必要"
          priority="required"
          items={safeRequiredItems}
          onAdd={() => handleAddItem("required")}
          onUpdate={(id, updates) => handleUpdateItem(id, updates, "required")}
          onDelete={(id) => handleDeleteItem(id, "required")}
          disabled={disabled}
        />

        {/* やったほうがいいセクション（旧: 推奨整備） */}
        <EstimateSubSection
          title="やったほうがいい"
          priority="recommended"
          items={safeRecommendedItems}
          onAdd={() => handleAddItem("recommended")}
          onUpdate={(id, updates) => handleUpdateItem(id, updates, "recommended")}
          onDelete={(id) => handleDeleteItem(id, "recommended")}
          disabled={disabled}
        />

        {/* お客さん次第セクション（旧: 任意整備） */}
        <EstimateSubSection
          title="お客さん次第"
          priority="optional"
          items={safeOptionalItems}
          onAdd={() => handleAddItem("optional")}
          onUpdate={(id, updates) => handleUpdateItem(id, updates, "optional")}
          onDelete={(id) => handleDeleteItem(id, "optional")}
          disabled={disabled}
        />
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Sub Components
// =============================================================================

/**
 * 見積サブセクション
 * 
 * 優先度別の作業項目を表示・編集するサブセクション
 * 車検外提案（箱③）: 車検とは切り分けて説明した方が分かりやすい内容
 * - 今回絶対必要（required）: 車検とは関係ないが、今回の整備で必須の作業
 * - やったほうがいい（recommended）: 車検とは関係ないが、整備士として推奨する作業
 * - お客さん次第（optional）: 車検とは関係ないが、お客様の判断に委ねる作業
 */
function EstimateSubSection({
  title,
  priority,
  items,
  onAdd,
  onUpdate,
  onDelete,
  disabled,
}: {
  title: string;
  priority: EstimatePriority;
  items: EstimateLineItem[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<EstimateLineItem>) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}) {
  // itemsがundefinedの場合は空配列を使用
  const safeItems = items || [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge
          variant="default"
          className={cn(
            "text-2xl font-medium px-3 py-1 rounded-full shrink-0 whitespace-nowrap text-white",
            priority === "required" && "bg-red-600 hover:bg-red-700 border-red-600",
            priority === "recommended" && "bg-emerald-600 hover:bg-emerald-700 border-emerald-600",
            priority === "optional" && "bg-slate-500 hover:bg-slate-600 border-slate-500"
          )}
        >
          {title}
        </Badge>
        <span className="text-2xl text-slate-700 dark:text-white">
          {safeItems.length}件
        </span>
      </div>

      <div className="mt-3">
        {/* テーブルヘッダー（項目がある場合のみ表示） */}
        {safeItems.length > 0 && (
          <div className="hidden sm:grid sm:grid-cols-[1fr_100px_56px] gap-4 items-center py-2 border-b-2 border-slate-300 font-medium text-2xl text-slate-600 dark:border-slate-600 dark:text-white">
            <div>サービス・品目</div>
            <div className="text-right">数量</div>
            <div></div>
          </div>
        )}

        {/* 見積項目行 */}
        {safeItems.map((item) => (
          <EstimateLineRowSimple
            key={item.id}
            item={item}
            onUpdate={onUpdate}
            onDelete={onDelete}
            disabled={disabled}
          />
        ))}

        {/* 項目を追加ボタン（2つ目以降は合計テーブルの上に表示） */}
        {safeItems.length > 0 && (
          <Button
            variant="ghost"
            onClick={onAdd}
            disabled={disabled}
            className="w-full justify-start text-slate-700 hover:text-slate-900 h-20 text-2xl font-medium mt-2 dark:text-white dark:hover:text-slate-200"
            aria-label={`${title}セクションに項目を追加`}
          >
            <Plus className="h-8 w-8 mr-1 shrink-0" aria-hidden="true" />
            項目を追加
          </Button>
        )}


        {/* 項目がない場合の追加ボタン */}
        {safeItems.length === 0 && (
          <Button
            variant="ghost"
            onClick={onAdd}
            disabled={disabled}
            className="w-full justify-start text-slate-700 hover:text-slate-900 h-20 text-2xl font-medium dark:text-white dark:hover:text-slate-200"
            aria-label={`${title}セクションに項目を追加`}
          >
            <Plus className="h-8 w-8 mr-1 shrink-0" aria-hidden="true" />
            項目を追加
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 見積項目行（シンプル版）
 */
function EstimateLineRowSimple({
  item,
  onUpdate,
  onDelete,
  disabled,
}: {
  item: EstimateLineItem;
  onUpdate: (id: string, updates: Partial<EstimateLineItem>) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState(item.name);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // inputValueをitem.nameと同期
  useMemo(() => {
    setInputValue(item.name);
  }, [item.name]);

  // サジェストのフィルタリング（入力値がない場合は全件表示、入力値がある場合は部分一致でフィルタリング）
  const filteredSuggestions = useMemo(() => {
    if (!inputValue || inputValue.trim().length === 0) {
      return SERVICE_ITEM_MASTER;
    }
    return SERVICE_ITEM_MASTER.filter((service) =>
      service.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue]);

  // サジェスト選択時のハンドラ
  const handleSuggestionSelect = (serviceName: string) => {
    setInputValue(serviceName);
    onUpdate(item.id, { name: serviceName });
    setShowSuggestions(false);
  };

  // 入力変更時のハンドラ
  const handleInputChange = (value: string) => {
    setInputValue(value);
    onUpdate(item.id, { name: value });
    setShowSuggestions(true); // 入力中は常にサジェストを表示
  };

  return (
    <>
      {/* モバイル時: カード型レイアウト */}
      <div className="block sm:hidden space-y-3 p-4 border border-slate-200 rounded-lg bg-card mb-3 dark:border-slate-700">
        <div className="space-y-3">
          {/* サービス・品目 */}
          <div className="relative">
            <label className="text-xl text-slate-600 mb-1 block dark:text-white">サービス・品目</label>
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="サービス・品目を入力"
              className="h-20 text-2xl"
              disabled={disabled}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto dark:border-slate-700">
                {filteredSuggestions.map((service, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-slate-100 text-xl flex items-center dark:text-white dark:hover:bg-slate-700"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSuggestionSelect(service)}
                  >
                    <span>{service}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 数量 */}
          <div>
            <label className="text-xl text-slate-600 mb-1 block dark:text-white">数量</label>
            <Input
              type="text"
              inputMode="decimal"
              value={item.partQuantity || ""}
              onChange={(e) => {
                const cleaned = cleanNumericInput(e.target.value);
                const parsed = parseNumericValue(cleaned);
                onUpdate(item.id, { partQuantity: parsed ?? 0 });
              }}
              placeholder="0"
              className="h-20 text-right text-2xl"
              disabled={disabled}
            />
          </div>

          {/* 削除ボタン */}
          <Button
            variant="ghost"
            onClick={() => onDelete(item.id)}
            disabled={disabled}
            className="w-full h-20 text-2xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-white dark:hover:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-8 w-8 mr-2" />
            削除
          </Button>
        </div>
      </div>

      {/* タブレット・PC時: グリッドレイアウト */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_100px_56px] gap-4 items-center py-3 border-b border-slate-200 dark:border-slate-700">
        {/* サービス・品目 */}
        <div className="relative flex-1">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="サービス・品目を入力"
            className="h-20 text-2xl"
            disabled={disabled}
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto">
              {filteredSuggestions.map((service, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-slate-100 text-xl flex items-center"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionSelect(service)}
                >
                  <span>{service}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 数量 */}
        <div>
          <Input
            type="text"
            inputMode="decimal"
            value={item.partQuantity || ""}
            onChange={(e) => {
              const cleaned = cleanNumericInput(e.target.value);
              const parsed = parseNumericValue(cleaned);
              onUpdate(item.id, { partQuantity: parsed ?? 0 });
            }}
            placeholder="0"
            className="h-20 text-right text-2xl"
            disabled={disabled}
          />
        </div>

        {/* 削除ボタン */}
        <div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            disabled={disabled}
            className="h-14 w-14 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-white dark:hover:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </>
  );
}

