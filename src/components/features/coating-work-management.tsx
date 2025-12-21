"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Droplets, CalendarClock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface CoatingDryingProcess {
  /** 乾燥開始日時 */
  dryingStartAt?: string; // ISO 8601
  /** 乾燥完了予定日時 */
  dryingExpectedAt?: string; // ISO 8601
  /** 乾燥完了日時 */
  dryingCompletedAt?: string; // ISO 8601
  /** 乾燥状態 */
  status: "未開始" | "乾燥中" | "完了";
  /** 乾燥メモ */
  notes?: string;
}

export interface CoatingMaintenancePeriod {
  /** メンテナンス期間（年） */
  duration: number; // 1-3年
  /** 次回メンテナンス推奨日 */
  nextMaintenanceDate?: string; // ISO 8601
  /** メンテナンス方法の説明 */
  maintenanceInstructions?: string;
}

export interface CoatingWorkManagementProps {
  /** 乾燥プロセスデータ */
  dryingProcess?: CoatingDryingProcess;
  /** 乾燥プロセス変更ハンドラ */
  onDryingProcessChange?: (dryingProcess: CoatingDryingProcess) => void;
  /** メンテナンス期間データ */
  maintenancePeriod?: CoatingMaintenancePeriod;
  /** メンテナンス期間変更ハンドラ */
  onMaintenancePeriodChange?: (maintenancePeriod: CoatingMaintenancePeriod) => void;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function CoatingWorkManagement({
  dryingProcess,
  onDryingProcessChange,
  maintenancePeriod,
  onMaintenancePeriodChange,
  disabled = false,
}: CoatingWorkManagementProps) {
  // 乾燥プロセスの状態管理
  const [dryingStatus, setDryingStatus] = useState<CoatingDryingProcess["status"]>(
    dryingProcess?.status || "未開始"
  );
  const [dryingStartAt, setDryingStartAt] = useState(
    dryingProcess?.dryingStartAt ? new Date(dryingProcess.dryingStartAt).toISOString().slice(0, 16) : ""
  );
  const [dryingExpectedAt, setDryingExpectedAt] = useState(
    dryingProcess?.dryingExpectedAt ? new Date(dryingProcess.dryingExpectedAt).toISOString().slice(0, 16) : ""
  );
  const [dryingCompletedAt, setDryingCompletedAt] = useState(
    dryingProcess?.dryingCompletedAt ? new Date(dryingProcess.dryingCompletedAt).toISOString().slice(0, 16) : ""
  );
  const [dryingNotes, setDryingNotes] = useState(dryingProcess?.notes || "");

  // メンテナンス期間の状態管理
  const [maintenanceDuration, setMaintenanceDuration] = useState(
    maintenancePeriod?.duration || 1
  );
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState(
    maintenancePeriod?.nextMaintenanceDate ? new Date(maintenancePeriod.nextMaintenanceDate).toISOString().slice(0, 10) : ""
  );
  const [maintenanceInstructions, setMaintenanceInstructions] = useState(
    maintenancePeriod?.maintenanceInstructions || ""
  );

  /**
   * 乾燥開始ハンドラ
   */
  const handleStartDrying = () => {
    const now = new Date().toISOString();
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 3); // デフォルト: 3日後

    const newDryingProcess: CoatingDryingProcess = {
      dryingStartAt: now,
      dryingExpectedAt: expectedDate.toISOString(),
      status: "乾燥中",
      notes: dryingNotes,
    };

    setDryingStatus("乾燥中");
    setDryingStartAt(new Date(now).toISOString().slice(0, 16));
    setDryingExpectedAt(expectedDate.toISOString().slice(0, 16));
    onDryingProcessChange?.(newDryingProcess);
  };

  /**
   * 乾燥完了ハンドラ
   */
  const handleCompleteDrying = () => {
    const now = new Date().toISOString();

    const newDryingProcess: CoatingDryingProcess = {
      ...dryingProcess,
      dryingCompletedAt: now,
      status: "完了",
      notes: dryingNotes,
    };

    setDryingStatus("完了");
    setDryingCompletedAt(new Date(now).toISOString().slice(0, 16));
    onDryingProcessChange?.(newDryingProcess);
  };

  /**
   * 乾燥プロセス更新ハンドラ
   */
  const handleDryingProcessUpdate = () => {
    if (!onDryingProcessChange) return;

    const newDryingProcess: CoatingDryingProcess = {
      dryingStartAt: dryingStartAt ? new Date(dryingStartAt).toISOString() : undefined,
      dryingExpectedAt: dryingExpectedAt ? new Date(dryingExpectedAt).toISOString() : undefined,
      dryingCompletedAt: dryingCompletedAt ? new Date(dryingCompletedAt).toISOString() : undefined,
      status: dryingStatus,
      notes: dryingNotes,
    };

    onDryingProcessChange(newDryingProcess);
  };

  /**
   * メンテナンス期間更新ハンドラ
   */
  const handleMaintenancePeriodUpdate = () => {
    if (!onMaintenancePeriodChange) return;

    const newMaintenancePeriod: CoatingMaintenancePeriod = {
      duration: maintenanceDuration,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate).toISOString() : undefined,
      maintenanceInstructions,
    };

    onMaintenancePeriodChange(newMaintenancePeriod);
  };

  /**
   * 次回メンテナンス推奨日を自動計算
   */
  const calculateNextMaintenanceDate = (duration: number) => {
    const today = new Date();
    const nextDate = new Date();
    nextDate.setFullYear(today.getFullYear() + duration);
    setNextMaintenanceDate(nextDate.toISOString().slice(0, 10));
    handleMaintenancePeriodUpdate();
  };

  return (
    <div className="space-y-6">
      {/* 乾燥プロセス管理 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-5 w-5" />
            乾燥プロセス管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 乾燥状態 */}
          <div className="flex items-center justify-between">
            <Label>乾燥状態</Label>
            <Badge
              variant={
                dryingStatus === "完了"
                  ? "default"
                  : dryingStatus === "乾燥中"
                  ? "secondary"
                  : "outline"
              }
            >
              {dryingStatus}
            </Badge>
          </div>

          {/* 乾燥開始日時 */}
          {dryingStatus !== "未開始" && (
            <div className="space-y-2">
              <Label htmlFor="drying-start-at">乾燥開始日時</Label>
              <Input
                id="drying-start-at"
                type="datetime-local"
                value={dryingStartAt}
                onChange={(e) => {
                  setDryingStartAt(e.target.value);
                  handleDryingProcessUpdate();
                }}
                disabled={disabled}
              />
            </div>
          )}

          {/* 乾燥完了予定日時 */}
          {dryingStatus === "乾燥中" && (
            <div className="space-y-2">
              <Label htmlFor="drying-expected-at">乾燥完了予定日時</Label>
              <Input
                id="drying-expected-at"
                type="datetime-local"
                value={dryingExpectedAt}
                onChange={(e) => {
                  setDryingExpectedAt(e.target.value);
                  handleDryingProcessUpdate();
                }}
                disabled={disabled}
              />
              {dryingExpectedAt && new Date(dryingExpectedAt) < new Date() && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>予定完了日を過ぎています</span>
                </div>
              )}
            </div>
          )}

          {/* 乾燥完了日時 */}
          {dryingStatus === "完了" && (
            <div className="space-y-2">
              <Label htmlFor="drying-completed-at">乾燥完了日時</Label>
              <Input
                id="drying-completed-at"
                type="datetime-local"
                value={dryingCompletedAt}
                onChange={(e) => {
                  setDryingCompletedAt(e.target.value);
                  handleDryingProcessUpdate();
                }}
                disabled={disabled}
              />
            </div>
          )}

          {/* 乾燥メモ */}
          <div className="space-y-2">
            <Label htmlFor="drying-notes">乾燥メモ</Label>
            <Textarea
              id="drying-notes"
              value={dryingNotes}
              onChange={(e) => {
                setDryingNotes(e.target.value);
                handleDryingProcessUpdate();
              }}
              placeholder="乾燥に関する注意事項やメモを入力"
              disabled={disabled}
              rows={3}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            {dryingStatus === "未開始" && (
              <Button
                onClick={handleStartDrying}
                disabled={disabled}
                className="flex-1"
              >
                乾燥開始
              </Button>
            )}
            {dryingStatus === "乾燥中" && (
              <Button
                onClick={handleCompleteDrying}
                disabled={disabled}
                className="flex-1"
                variant="default"
              >
                乾燥完了
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* メンテナンス期間管理 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-5 w-5" />
            メンテナンス期間管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* メンテナンス期間（年） */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-duration">メンテナンス期間（年）</Label>
            <div className="flex items-center gap-2">
              <Input
                id="maintenance-duration"
                type="number"
                min={1}
                max={3}
                value={maintenanceDuration}
                onChange={(e) => {
                  const duration = parseInt(e.target.value, 10);
                  if (duration >= 1 && duration <= 3) {
                    setMaintenanceDuration(duration);
                    calculateNextMaintenanceDate(duration);
                  }
                }}
                disabled={disabled}
                className="w-24"
              />
              <span className="text-sm text-slate-600">年（1-3年）</span>
            </div>
          </div>

          {/* 次回メンテナンス推奨日 */}
          <div className="space-y-2">
            <Label htmlFor="next-maintenance-date">次回メンテナンス推奨日</Label>
            <Input
              id="next-maintenance-date"
              type="date"
              value={nextMaintenanceDate}
              onChange={(e) => {
                setNextMaintenanceDate(e.target.value);
                handleMaintenancePeriodUpdate();
              }}
              disabled={disabled}
            />
            {nextMaintenanceDate && new Date(nextMaintenanceDate) < new Date() && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>推奨日を過ぎています</span>
              </div>
            )}
          </div>

          {/* メンテナンス方法の説明 */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-instructions">メンテナンス方法の説明</Label>
            <Textarea
              id="maintenance-instructions"
              value={maintenanceInstructions}
              onChange={(e) => {
                setMaintenanceInstructions(e.target.value);
                handleMaintenancePeriodUpdate();
              }}
              placeholder="コーティング後のメンテナンス方法を入力（例: 洗車方法、ワックス使用の可否など）"
              disabled={disabled}
              rows={4}
            />
          </div>

          {/* 注意事項 */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 font-medium mb-1">
              ⚠️ メンテナンス期間について
            </p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>効果の持続期間は1年から3年です</li>
              <li>次回メンテナンス推奨日を設定してください</li>
              <li>引渡時に顧客にメンテナンス方法を説明してください</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





