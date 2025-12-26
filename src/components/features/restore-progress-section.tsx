/**
 * レストア作業進捗セクション
 * 改善提案 #4: 輸入車整備工場特有の診断・作業記録機能の強化
 * 
 * 機能:
 * - 全体の進捗率の記録（0-100%）
 * - 各工程の進捗管理
 * - 工程の追加・削除
 * - 各工程の進捗率・ステータス管理
 * - 予定終了日の記録
 */

"use client";

import { useState } from "react";
import { Plus, X, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
import { RestoreProgress, RestorePhase } from "@/types";

export interface RestoreProgressSectionProps {
  /** レストア作業進捗データ */
  progress: RestoreProgress | null;
  /** 変更時のコールバック */
  onChange: (progress: RestoreProgress) => void;
  /** 無効化フラグ */
  disabled?: boolean;
  /** カスタムクラス名 */
  className?: string;
}

/**
 * 工程項目コンポーネント
 */
function PhaseItem({
  phase,
  onUpdate,
  onRemove,
  disabled,
}: {
  phase: RestorePhase;
  onUpdate: (updates: Partial<RestorePhase>) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const getStatusBadgeVariant = (status: RestorePhase["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: RestorePhase["status"]) => {
    switch (status) {
      case "not_started":
        return "未開始";
      case "in_progress":
        return "進行中";
      case "completed":
        return "完了";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{phase.name || "工程名未設定"}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(phase.status)}>
              {getStatusLabel(phase.status)}
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
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-base">工程名</Label>
          <Input
            value={phase.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="例: エンジン分解"
            disabled={disabled}
            className="mt-1.5 h-12 text-base"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base">進捗率</Label>
            <span className="text-lg font-bold text-slate-900">{phase.progress}%</span>
          </div>
          <Slider
            value={[phase.progress]}
            onValueChange={(value) => onUpdate({ progress: value[0] })}
            max={100}
            step={1}
            disabled={disabled}
            className="w-full"
          />
        </div>

        <div>
          <Label className="text-base">ステータス</Label>
          <Select
            value={phase.status}
            onValueChange={(value: RestorePhase["status"]) => onUpdate({ status: value })}
            disabled={disabled}
          >
            <SelectTrigger className="mt-1.5 h-12 text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">未開始</SelectItem>
              <SelectItem value="in_progress">進行中</SelectItem>
              <SelectItem value="completed">完了</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base">開始日</Label>
            <Input
              type="date"
              value={phase.startDate ? new Date(phase.startDate).toISOString().split("T")[0] : ""}
              onChange={(e) =>
                onUpdate({
                  startDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
              disabled={disabled}
              className="mt-1.5 h-12 text-base"
            />
          </div>

          <div>
            <Label className="text-base">予定終了日</Label>
            <Input
              type="date"
              value={
                phase.expectedEndDate
                  ? new Date(phase.expectedEndDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                onUpdate({
                  expectedEndDate: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
              disabled={disabled}
              className="mt-1.5 h-12 text-base"
            />
          </div>
        </div>

        {phase.expectedEndDate && (
          <div className="text-base text-slate-700 flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            予定終了日: {new Date(phase.expectedEndDate).toLocaleDateString("ja-JP")}
          </div>
        )}

        <div>
          <Label className="text-base">備考</Label>
          <Textarea
            value={phase.notes || ""}
            onChange={(e) => onUpdate({ notes: e.target.value || null })}
            placeholder="備考を入力"
            disabled={disabled}
            className="mt-1.5 text-base"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * レストア作業進捗セクション
 */
export function RestoreProgressSection({
  progress,
  onChange,
  disabled = false,
  className,
}: RestoreProgressSectionProps) {
  // 初期データの作成
  const createInitialProgress = (): RestoreProgress => {
    return {
      overallProgress: 0,
      phases: [],
      lastUpdatedAt: new Date().toISOString(),
    };
  };

  const currentProgress = progress || createInitialProgress();

  // 全体進捗率の更新
  const handleOverallProgressChange = (value: number[]) => {
    onChange({
      ...currentProgress,
      overallProgress: value[0],
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  // 工程の追加
  const handleAddPhase = () => {
    const newPhase: RestorePhase = {
      id: `phase-${Date.now()}`,
      name: "",
      progress: 0,
      status: "not_started",
      startDate: null,
      expectedEndDate: null,
      actualEndDate: null,
      notes: null,
    };

    onChange({
      ...currentProgress,
      phases: [...currentProgress.phases, newPhase],
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  // 工程の削除
  const handleRemovePhase = (phaseId: string) => {
    onChange({
      ...currentProgress,
      phases: currentProgress.phases.filter((p) => p.id !== phaseId),
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  // 工程の更新
  const handlePhaseUpdate = (phaseId: string, updates: Partial<RestorePhase>) => {
    onChange({
      ...currentProgress,
      phases: currentProgress.phases.map((p) =>
        p.id === phaseId ? { ...p, ...updates } : p
      ),
      lastUpdatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">レストア作業進捗</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 全体の進捗率 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-medium">全体の進捗率</Label>
              <span className="text-2xl font-bold text-slate-900">
                {currentProgress.overallProgress}%
              </span>
            </div>
            <Slider
              value={[currentProgress.overallProgress]}
              onValueChange={handleOverallProgressChange}
              max={100}
              step={1}
              disabled={disabled}
              className="w-full"
            />
          </div>

          {/* 各工程の進捗 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">各工程の進捗</Label>
              {!disabled && (
                <Button
                  variant="outline"
                  onClick={handleAddPhase}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> {/* h-3.5 w-3.5 → h-4 w-4 (40歳以上ユーザー向け、DESIGN_SYSTEM.md準拠) */}
                  工程を追加
                </Button>
              )}
            </div>

            {currentProgress.phases.length === 0 ? (
              <div className="text-center py-8 text-base text-slate-700 border border-dashed rounded-lg">
                工程が登録されていません
                <br />
                「工程を追加」ボタンから工程を追加してください
              </div>
            ) : (
              <div className="space-y-3">
                {currentProgress.phases.map((phase) => (
                  <PhaseItem
                    key={phase.id}
                    phase={phase}
                    onUpdate={(updates) => handlePhaseUpdate(phase.id, updates)}
                    onRemove={() => handleRemovePhase(phase.id)}
                    disabled={disabled}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 最終更新日時 */}
          {currentProgress.lastUpdatedAt && (
            <div className="text-base text-slate-700 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              最終更新: {new Date(currentProgress.lastUpdatedAt).toLocaleString("ja-JP")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




