"use client";

/**
 * 品質管理・最終検査セクション
 * 
 * 車検用の品質管理・最終検査項目を表示・入力するコンポーネント
 * シンプルなチェック形式（40歳以上ユーザー向け最適化）
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { QualityCheckItem, QualityCheckData } from "@/types/inspection-quality-check";
import { ClipboardCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface InspectionQualityCheckSectionProps {
  /** 品質管理・最終検査データ */
  data: QualityCheckData | null;
  /** 変更時のコールバック */
  onChange: (data: QualityCheckData) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * デフォルトの検査項目リスト（すべてチェックボックス形式）
 */
const DEFAULT_QUALITY_CHECK_ITEMS: Omit<QualityCheckItem, 'yesNo' | 'hasNot' | 'number' | 'passReview' | 'note'>[] = [
  // タイヤ・ホイール
  { id: 'tire-1', category: 'タイヤ・ホイール', name: 'ホイールナット締付トルク確認', method: 'yes_no' },
  { id: 'tire-2', category: 'タイヤ・ホイール', name: 'トルクレンチ使用確認', method: 'yes_no' },
  // ブレーキ
  { id: 'brake-1', category: 'ブレーキ', name: 'ブレーキ効き確認（試運転）', method: 'yes_no' },
  { id: 'brake-2', category: 'ブレーキ', name: '異音なし確認（試運転）', method: 'yes_no' },
  // 電装系
  { id: 'electrical-1', category: '電装系', name: '全灯火点灯確認', method: 'yes_no' },
  { id: 'electrical-2', category: '電装系', name: '警告灯消灯確認', method: 'yes_no' },
  // バッテリー
  { id: 'battery-1', category: 'バッテリー', name: '電圧・充電状態確認', method: 'yes_no' },
  // 足回り
  { id: 'suspension-1', category: '足回り', name: 'ステアリング・挙動確認', method: 'yes_no' },
  { id: 'suspension-2', category: '足回り', name: '足回り異音なし確認', method: 'yes_no' },
];

/**
 * 品質管理・最終検査セクション
 */
export function InspectionQualityCheckSection({
  data,
  onChange,
  disabled = false,
  className,
}: InspectionQualityCheckSectionProps) {
  // データがない場合はデフォルト項目で初期化
  const items = data?.items || DEFAULT_QUALITY_CHECK_ITEMS.map(item => ({
    ...item,
    yesNo: null,
    hasNot: null,
    number: null,
    passReview: null,
  }));

  /**
   * 項目を更新
   */
  const handleItemUpdate = (itemId: string, updates: Partial<QualityCheckItem>) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    onChange({
      items: updatedItems,
      inspectionDate: data?.inspectionDate,
      inspector: data?.inspector,
    });
  };

  /**
   * カテゴリごとにグループ化
   */
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, QualityCheckItem[]>);

  /**
   * チェックボックスのレンダリング（視認性向上版）
   */
  const renderCheckbox = (item: QualityCheckItem) => {
    const isChecked = item.yesNo === true;

    return (
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          handleItemUpdate(item.id, { yesNo: !isChecked });
        }}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded-lg border-2 transition-all",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500",
          isChecked
            ? "bg-green-600 border-green-600 text-white dark:bg-green-500 dark:border-green-500"
            : "bg-slate-50 border-slate-300 text-slate-400 hover:border-slate-400 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-checked={isChecked}
        role="checkbox"
        style={{ height: '72px', width: '72px' }}
      >
        <Check className={cn("h-9 w-9", isChecked ? "opacity-100" : "opacity-30")} />
      </button>
    );
  };

  return (
    <Card className={cn("border-slate-200 shadow-md hover:shadow-lg transition-shadow dark:border-slate-700 dark:bg-slate-800", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2 dark:text-white">
          <ClipboardCheck className="h-6 w-6 text-slate-600 shrink-0 dark:text-white" />
          品質管理・最終検査
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-2xl font-semibold text-slate-900 pb-2 border-b border-slate-200 dark:text-white dark:border-slate-700">
              {category}
            </h3>
            <div className="space-y-1">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 min-h-[84px] py-2 border-b border-slate-100 last:border-b-0 dark:border-slate-700"
                >
                  <Label className="text-2xl font-medium text-slate-700 flex-1 dark:text-white">
                    {item.name}
                  </Label>
                  <div className="flex-shrink-0">
                    {renderCheckbox(item)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
