/**
 * 品質管理・最終検査セクション
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 * 
 * 機能:
 * - 検査項目のチェックリスト形式での記録
 * - 検査結果の記録（合格/不合格/該当なし/保留）
 * - 不合格項目の不備内容記録
 * - 総合判定の記録
 * - 検査者名・検査日時の記録
 */

"use client";

import { useState } from "react";
import { Plus, X, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QualityInspection, QualityInspectionItem } from "@/types";
import { getCurrentMechanicName } from "@/lib/auth";

export interface QualityInspectionSectionProps {
  /** 品質管理・最終検査データ */
  inspection: QualityInspection | null;
  /** 変更時のコールバック */
  onChange: (inspection: QualityInspection) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * デフォルトの検査項目リスト
 */
const DEFAULT_INSPECTION_ITEMS: Omit<QualityInspectionItem, "id" | "result" | "notes" | "photos">[] = [
  { name: "エンジン始動確認", category: "エンジン" },
  { name: "エンジン異音確認", category: "エンジン" },
  { name: "ブレーキ効き具合", category: "ブレーキ" },
  { name: "ブレーキ異音確認", category: "ブレーキ" },
  { name: "ライト類点灯確認", category: "電装" },
  { name: "バッテリー電圧", category: "電装" },
  { name: "外装傷・汚れ", category: "外装" },
  { name: "塗装状態", category: "外装" },
  { name: "タイヤ空気圧", category: "足回り" },
  { name: "タイヤ溝深さ", category: "足回り" },
  { name: "サスペンション", category: "足回り" },
  { name: "ステアリング", category: "足回り" },
];

/**
 * 検査項目コンポーネント
 */
function InspectionItemRow({
  item,
  onUpdate,
  onRemove,
  disabled,
}: {
  item: QualityInspectionItem;
  onUpdate: (updates: Partial<QualityInspectionItem>) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const getResultBadgeVariant = (result: QualityInspectionItem["result"]) => {
    switch (result) {
      case "pass":
        return "default";
      case "fail":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getResultLabel = (result: QualityInspectionItem["result"]) => {
    switch (result) {
      case "pass":
        return "合格";
      case "fail":
        return "不合格";
      case "pending":
        return "保留";
      case "not_applicable":
        return "該当なし";
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-base font-medium text-slate-900">
                {item.category} - {item.name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={item.result}
                onValueChange={(value: QualityInspectionItem["result"]) =>
                  onUpdate({ result: value })
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-28 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">合格</SelectItem>
                  <SelectItem value="fail">不合格</SelectItem>
                  <SelectItem value="pending">保留</SelectItem>
                  <SelectItem value="not_applicable">該当なし</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant={getResultBadgeVariant(item.result)} className="text-base px-2 py-0.5">
                {getResultLabel(item.result)}
              </Badge>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" /> {/* h-3.5 w-3.5 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠) */}
                </Button>
              )}
            </div>
          </div>

          {(item.result === "fail" || item.result === "pending") && (
            <div>
              <Label className="text-base">不備内容・備考</Label>
              <Textarea
                value={item.notes || ""}
                onChange={(e) => onUpdate({ notes: e.target.value || null })}
                placeholder={
                  item.result === "fail"
                    ? "不備内容を入力してください"
                    : "保留理由を入力してください"
                }
                disabled={disabled}
                className="mt-1.5 text-base"
                rows={2}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 品質管理・最終検査セクション
 */
export function QualityInspectionSection({
  inspection,
  onChange,
  disabled = false,
  className,
}: QualityInspectionSectionProps) {
  // 初期データの作成
  const createInitialInspection = (): QualityInspection => {
    const inspectorName = getCurrentMechanicName() || "";
    return {
      items: DEFAULT_INSPECTION_ITEMS.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        ...item,
        result: "pending" as const,
        notes: null,
        photos: [],
      })),
      inspectionDate: new Date().toISOString(),
      inspector: inspectorName,
      overallResult: "pending",
      notes: null,
    };
  };

  const currentInspection = inspection || createInitialInspection();

  // 検査項目の追加
  const handleAddItem = () => {
    const newItem: QualityInspectionItem = {
      id: `item-${Date.now()}`,
      name: "",
      category: "その他",
      result: "pending",
      notes: null,
      photos: [],
    };

    onChange({
      ...currentInspection,
      items: [...currentInspection.items, newItem],
    });
  };

  // 検査項目の削除
  const handleRemoveItem = (itemId: string) => {
    onChange({
      ...currentInspection,
      items: currentInspection.items.filter((item) => item.id !== itemId),
    });
  };

  // 検査項目の更新
  const handleItemUpdate = (itemId: string, updates: Partial<QualityInspectionItem>) => {
    onChange({
      ...currentInspection,
      items: currentInspection.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  // 総合判定の更新
  const handleOverallResultChange = (value: QualityInspection["overallResult"]) => {
    onChange({
      ...currentInspection,
      overallResult: value,
    });
  };

  // 検査者名の更新
  const handleInspectorChange = (value: string) => {
    onChange({
      ...currentInspection,
      inspector: value,
    });
  };

  // 備考の更新
  const handleNotesChange = (value: string) => {
    onChange({
      ...currentInspection,
      notes: value || null,
    });
  };

  const getOverallResultBadgeVariant = (result: QualityInspection["overallResult"]) => {
    switch (result) {
      case "pass":
        return "default";
      case "fail":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getOverallResultLabel = (result: QualityInspection["overallResult"]) => {
    switch (result) {
      case "pass":
        return "合格";
      case "fail":
        return "不合格";
      case "pending":
        return "保留";
    }
  };

  const passCount = currentInspection.items.filter((item) => item.result === "pass").length;
  const failCount = currentInspection.items.filter((item) => item.result === "fail").length;
  const pendingCount = currentInspection.items.filter((item) => item.result === "pending").length;

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">品質管理・最終検査</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 検査者名・検査日時 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-base font-medium">検査者</Label>
              <Input
                value={currentInspection.inspector}
                onChange={(e) => handleInspectorChange(e.target.value)}
                placeholder="検査者名"
                disabled={disabled}
                className="mt-1.5 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-base font-medium">検査日時</Label>
              <Input
                type="datetime-local"
                value={
                  currentInspection.inspectionDate
                    ? new Date(currentInspection.inspectionDate).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  onChange({
                    ...currentInspection,
                    inspectionDate: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : new Date().toISOString(),
                  })
                }
                disabled={disabled}
                className="mt-1.5 h-12 text-base"
              />
            </div>
          </div>

          {/* 検査項目 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">検査項目</Label>
              {!disabled && (
                <Button
                  variant="outline"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> {/* h-3.5 w-3.5 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠) */}
                  項目を追加
                </Button>
              )}
            </div>

            {currentInspection.items.length === 0 ? (
              <div className="text-center py-8 text-base text-slate-700 border border-dashed rounded-lg">
                検査項目が登録されていません
                <br />
                「項目を追加」ボタンから検査項目を追加してください
              </div>
            ) : (
              <div className="space-y-3">
                {currentInspection.items.map((item) => (
                  <InspectionItemRow
                    key={item.id}
                    item={item}
                    onUpdate={(updates) => handleItemUpdate(item.id, updates)}
                    onRemove={() => handleRemoveItem(item.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
            )}

            {/* 検査結果サマリー */}
            {currentInspection.items.length > 0 && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4 text-base">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-700" />
                    <span className="text-slate-700">合格: {passCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-700" />
                    <span className="text-slate-700">不合格: {failCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-700" />
                    <span className="text-slate-700">保留: {pendingCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 総合判定 */}
          <div>
            <Label className="text-base font-medium">総合判定</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <Select
                value={currentInspection.overallResult}
                onValueChange={handleOverallResultChange}
                disabled={disabled}
              >
                <SelectTrigger className="h-12 text-base flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">合格</SelectItem>
                  <SelectItem value="fail">不合格</SelectItem>
                  <SelectItem value="pending">保留</SelectItem>
                </SelectContent>
              </Select>
              <Badge
                variant={getOverallResultBadgeVariant(currentInspection.overallResult)}
                className="text-base px-3 py-1"
              >
                {getOverallResultLabel(currentInspection.overallResult)}
              </Badge>
            </div>
          </div>

          {/* 備考 */}
          <div>
            <Label className="text-base font-medium">備考</Label>
            <Textarea
              value={currentInspection.notes || ""}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="備考を入力してください"
              disabled={disabled}
              className="mt-1.5 text-base"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




