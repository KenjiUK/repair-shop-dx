"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotoCaptureButton, PhotoData } from "./photo-capture-button";
import {
  WorkPhase,
  PhaseStatus,
  PartStatus,
  WORK_PHASES,
  PHASE_STATUSES,
  PART_STATUSES,
  getPhaseOrder,
  getNextPhase,
  getPreviousPhase,
  canStartPhase,
  calculatePhaseExpectedDate,
} from "@/lib/restore-config";
import {
  Wrench,
  CheckCircle2,
  Clock,
  Package,
  Camera,
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { RestorePartItem } from "./restore-estimate-view";

// =============================================================================
// 型定義
// =============================================================================

export interface WorkPhaseData {
  /** フェーズID */
  id: string;
  /** フェーズ名 */
  name: WorkPhase;
  /** フェーズの状態 */
  status: PhaseStatus;
  /** フェーズの開始日 */
  startDate?: string;
  /** フェーズの完了日 */
  completionDate?: string;
  /** フェーズの予定開始日 */
  expectedStartDate?: string;
  /** フェーズの予定完了日 */
  expectedCompletionDate?: string;
  /** フェーズの進捗 */
  progress: number; // 0-100%
  /** フェーズの作業記録 */
  workRecords: WorkRecord[];
  /** フェーズで使用した部品 */
  usedParts: RestorePartItem[];
  /** マイルストーン（フェーズ完了） */
  isMilestone: boolean;
  /** 備考 */
  note?: string;
  /** 遅延フラグ */
  isDelayed?: boolean;
}

export interface WorkRecord {
  /** 記録ID */
  id: string;
  /** 作業日 */
  date: string;
  /** 作業内容 */
  content: string;
  /** 作業時間（分） */
  duration: number;
  /** 写真URLリスト */
  photoUrls: string[];
  /** コメント */
  comment?: string;
}

export interface RestoreWorkData {
  /** フェーズ管理 */
  phases: WorkPhaseData[];
  /** 全体の進捗 */
  overallProgress: number; // 0-100%
  /** 作業メモ */
  notes: string;
}

// =============================================================================
// Props
// =============================================================================

interface RestoreWorkViewProps {
  /** 作業データ */
  workData?: RestoreWorkData | null;
  /** 作業データ変更ハンドラ */
  onWorkDataChange?: (data: RestoreWorkData) => void;
  /** 部品リスト（見積から取得） */
  parts?: RestorePartItem[];
  /** 写真データマップ */
  photoDataMap?: Record<string, PhotoData>;
  /** 写真撮影ハンドラ */
  onPhotoCapture?: (position: string, file: File) => void | Promise<void>;
  /** 無効化 */
  disabled?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * 初期状態のフェーズデータを取得
 */
export function createInitialPhaseData(phaseName: WorkPhase): WorkPhaseData {
  return {
    id: `phase-${phaseName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: phaseName,
    status: "未開始",
    progress: 0,
    workRecords: [],
    usedParts: [],
    isMilestone: true,
    note: "",
  };
}

/**
 * 初期状態の作業記録を取得
 */
export function createInitialWorkRecord(): WorkRecord {
  return {
    id: `record-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString().split("T")[0],
    content: "",
    duration: 0,
    photoUrls: [],
    comment: "",
  };
}

/**
 * 全体の進捗を計算
 */
function calculateOverallProgress(phases: WorkPhaseData[]): number {
  if (phases.length === 0) return 0;
  const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
  return Math.round(totalProgress / phases.length);
}

// =============================================================================
// Component
// =============================================================================

export function RestoreWorkView({
  workData,
  onWorkDataChange,
  parts = [],
  photoDataMap = {},
  onPhotoCapture,
  disabled = false,
}: RestoreWorkViewProps) {
  const phases = workData?.phases || [];
  const overallProgress = workData?.overallProgress || 0;
  const notes = workData?.notes || "";

  // 初期化：フェーズが空の場合、デフォルトフェーズを作成
  useEffect(() => {
    if (phases.length === 0 && onWorkDataChange) {
      const initialPhases = WORK_PHASES.map((phaseName) =>
        createInitialPhaseData(phaseName)
      );
      onWorkDataChange({
        phases: initialPhases,
        overallProgress: 0,
        notes: "",
      });
    }
  }, [phases.length, onWorkDataChange]);

  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(
    phases.length > 0 ? phases[0].id : null
  );

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) || phases[0];

  /**
   * フェーズ状態変更ハンドラ
   */
  const handlePhaseStatusChange = (phaseId: string, status: PhaseStatus) => {
    if (!onWorkDataChange) return;
    const targetPhase = phases.find((p) => p.id === phaseId);
    if (!targetPhase) return;

    // フェーズ間の依存関係をチェック
    if (status === "作業中" && !canStartPhase(targetPhase.name, phases)) {
      const previousPhase = phases.find(
        (p) => p.name === getPreviousPhase(targetPhase.name)!
      );
      toast.error(
        `前のフェーズ「${previousPhase?.name || "前のフェーズ"}」を完了してから開始してください`
      );
      return;
    }

    const updatedPhases = phases.map((phase) => {
      if (phase.id === phaseId) {
        const updated = { ...phase, status };
        if (status === "作業中" && !updated.startDate) {
          updated.startDate = new Date().toISOString();
        }
        if (status === "完了") {
          updated.completionDate = new Date().toISOString();
          updated.progress = 100;

          // 次のフェーズを自動的に開始可能にする（オプション）
          const nextPhase = getNextPhase(phase.name);
          if (nextPhase) {
            const nextPhaseData = updatedPhases.find((p) => p.name === nextPhase);
            if (nextPhaseData && nextPhaseData.status === "未開始") {
              // 次のフェーズの予定開始日を設定
              nextPhaseData.expectedStartDate = new Date().toISOString();
            }
          }
        }
        return updated;
      }
      return phase;
    });

    // 遅延チェック
    const phasesWithDelay = updatedPhases.map((phase) => {
      if (
        phase.expectedCompletionDate &&
        phase.status !== "完了" &&
        new Date() > new Date(phase.expectedCompletionDate)
      ) {
        return { ...phase, isDelayed: true };
      }
      return { ...phase, isDelayed: false };
    });

    const newOverallProgress = calculateOverallProgress(phasesWithDelay);
    onWorkDataChange({
      phases: phasesWithDelay,
      overallProgress: newOverallProgress,
      notes: workData?.notes || "",
    });
  };

  /**
   * フェーズ進捗変更ハンドラ
   */
  const handlePhaseProgressChange = (phaseId: string, progress: number) => {
    if (!onWorkDataChange) return;
    const updatedPhases = phases.map((phase) =>
      phase.id === phaseId ? { ...phase, progress: Math.max(0, Math.min(100, progress)) } : phase
    );
    const newOverallProgress = calculateOverallProgress(updatedPhases);
    onWorkDataChange({
      phases: updatedPhases,
      overallProgress: newOverallProgress,
      notes: workData?.notes || "",
    });
  };

  /**
   * 作業記録追加ハンドラ
   */
  const handleAddWorkRecord = (phaseId: string) => {
    if (!onWorkDataChange) return;
    const newRecord = createInitialWorkRecord();
    const updatedPhases = phases.map((phase) =>
      phase.id === phaseId
        ? { ...phase, workRecords: [...phase.workRecords, newRecord] }
        : phase
    );
    onWorkDataChange({
      phases: updatedPhases,
      overallProgress: workData?.overallProgress || 0,
      notes: workData?.notes || "",
    });
  };

  /**
   * 作業記録削除ハンドラ
   */
  const handleRemoveWorkRecord = (phaseId: string, recordId: string) => {
    if (!onWorkDataChange) return;
    const updatedPhases = phases.map((phase) =>
      phase.id === phaseId
        ? {
            ...phase,
            workRecords: phase.workRecords.filter((r) => r.id !== recordId),
          }
        : phase
    );
    onWorkDataChange({
      phases: updatedPhases,
      overallProgress: workData?.overallProgress || 0,
      notes: workData?.notes || "",
    });
  };

  /**
   * 作業記録更新ハンドラ
   */
  const handleUpdateWorkRecord = (
    phaseId: string,
    recordId: string,
    updates: Partial<WorkRecord>
  ) => {
    if (!onWorkDataChange) return;
    const updatedPhases = phases.map((phase) =>
      phase.id === phaseId
        ? {
            ...phase,
            workRecords: phase.workRecords.map((r) =>
              r.id === recordId ? { ...r, ...updates } : r
            ),
          }
        : phase
    );
    onWorkDataChange({
      phases: updatedPhases,
      overallProgress: workData?.overallProgress || 0,
      notes: workData?.notes || "",
    });
  };

  /**
   * 作業メモ変更ハンドラ
   */
  const handleNotesChange = (newNotes: string) => {
    if (!onWorkDataChange) return;
    onWorkDataChange({
      phases: workData?.phases || [],
      overallProgress: workData?.overallProgress || 0,
      notes: newNotes,
    });
  };

  // マイルストーン（完了したフェーズ）の数
  const completedMilestones = phases.filter(
    (p) => p.isMilestone && p.status === "完了"
  ).length;
  const totalMilestones = phases.filter((p) => p.isMilestone).length;

  return (
    <div className="space-y-4">
      {/* 全体進捗表示 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 shrink-0" />
              全体進捗
            </span>
            <Badge variant="default" className="text-base px-3 py-1">
              {overallProgress}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-base">
              <span className="text-slate-700">全体進捗</span>
              <span className="font-medium text-slate-900">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
          <div className="flex items-center justify-between text-base">
            <span className="text-slate-800">マイルストーン</span>
            <span className="font-medium text-slate-900">
              {completedMilestones} / {totalMilestones} 完了
            </span>
          </div>
        </CardContent>
      </Card>

      {/* フェーズ管理 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Wrench className="h-5 w-5 shrink-0" />
            フェーズ管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedPhaseId || undefined}
            onValueChange={setSelectedPhaseId}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-7 mb-4 overflow-x-auto">
              {phases.map((phase) => {
                const canStart = canStartPhase(phase.name, phases);
                const isBlocked = phase.status === "未開始" && !canStart;
                return (
                  <TabsTrigger
                    key={phase.id}
                    value={phase.id}
                    className={`text-base min-w-[80px] ${isBlocked ? "opacity-50" : ""}`}
                    disabled={isBlocked}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px]">{phase.name}</span>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={
                            phase.status === "完了"
                              ? "default"
                              : phase.status === "作業中"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] px-1 py-0"
                        >
                          {phase.status}
                        </Badge>
                        {phase.isDelayed && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        {isBlocked && (
                          <AlertCircle className="h-4 w-4 text-slate-700" />
                        )}
                      </div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {phases.map((phase) => (
              <TabsContent key={phase.id} value={phase.id} className="space-y-4">
                {/* フェーズ情報 */}
                <div className="space-y-3">
                  {/* 遅延アラート */}
                  {phase.isDelayed && (
                    <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-base font-medium text-red-900">遅延中</p>
                        <p className="text-base text-red-800 mt-1">
                          予定完了日を過ぎています。進捗を確認してください。
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 依存関係の警告 */}
                  {phase.status === "未開始" && !canStartPhase(phase.name, phases) && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2"> {/* yellow → amber (40歳以上ユーザー向け、統一) */}
                      <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" /> {/* text-yellow-600 → text-amber-700 */}
                      <div className="flex-1">
                        <p className="text-base font-medium text-amber-900">開始不可</p> {/* text-yellow-900 → text-amber-900 */}
                        <p className="text-base text-amber-900 mt-1"> {/* text-yellow-800 → text-amber-900 (40歳以上ユーザー向け、コントラスト向上) */}
                          前のフェーズ「{getPreviousPhase(phase.name)}」を完了してから開始してください。
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-base">フェーズの状態</Label>
                      <Select
                        value={phase.status}
                        onValueChange={(value) =>
                          handlePhaseStatusChange(phase.id, value as PhaseStatus)
                        }
                        disabled={disabled || (phase.status === "未開始" && !canStartPhase(phase.name, phases))}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PHASE_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-base">進捗（%）</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={phase.progress}
                          onChange={(e) =>
                            handlePhaseProgressChange(
                              phase.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          disabled={disabled}
                          className="text-base"
                          min="0"
                          max="100"
                          step="1"
                        />
                        <Progress value={phase.progress} className="flex-1 h-2" />
                      </div>
                    </div>
                  </div>

                  {/* 日付情報 */}
                  <div className="grid grid-cols-2 gap-3">
                    {phase.startDate && (
                      <div className="space-y-2">
                        <Label className="text-base text-slate-800">開始日</Label>
                        <div className="flex items-center gap-2 text-base">
                          <Calendar className="h-4 w-4 text-slate-700" />
                          <span>
                            {new Date(phase.startDate).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                      </div>
                    )}
                    {phase.completionDate && (
                      <div className="space-y-2">
                        <Label className="text-base text-slate-800">完了日</Label>
                        <div className="flex items-center gap-2 text-base">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>
                            {new Date(phase.completionDate).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                      </div>
                    )}
                    {phase.expectedStartDate && (
                      <div className="space-y-2">
                        <Label className="text-base text-slate-800">予定開始日</Label>
                        <div className="flex items-center gap-2 text-base text-slate-700">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(phase.expectedStartDate).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                      </div>
                    )}
                    {phase.expectedCompletionDate && (
                      <div className="space-y-2">
                        <Label className="text-base text-slate-800">予定完了日</Label>
                        <div className="flex items-center gap-2 text-base text-slate-700">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(phase.expectedCompletionDate).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {phase.startDate && (
                    <div className="space-y-2">
                      <Label className="text-base text-slate-800">開始日</Label>
                      <p className="text-base font-medium text-slate-900">
                        {new Date(phase.startDate).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  )}

                  {phase.completionDate && (
                    <div className="space-y-2">
                      <Label className="text-base text-slate-800">完了日</Label>
                      <p className="text-base font-medium text-slate-900">
                        {new Date(phase.completionDate).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* 作業記録 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">作業記録</Label>
                    <Badge variant="secondary">
                      {phase.workRecords.length}件
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {phase.workRecords.map((record, index) => {
                      const photoData = photoDataMap[record.id] || {
                        position: record.id,
                        file: null,
                        previewUrl: null,
                        isCompressing: false,
                      };

                      return (
                        <div
                          key={record.id}
                          className="p-4 border border-slate-200 rounded-lg space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-900 text-base">
                              記録 #{index + 1}
                            </h4>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                handleRemoveWorkRecord(phase.id, record.id)
                              }
                              disabled={disabled}
                              className="h-6 w-6 p-0 text-slate-700 hover:text-red-600"
                            >
                              ×
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-base text-slate-800">作業日</Label>
                              <Input
                                type="date"
                                value={record.date}
                                onChange={(e) =>
                                  handleUpdateWorkRecord(phase.id, record.id, {
                                    date: e.target.value,
                                  })
                                }
                                disabled={disabled}
                                className="text-base"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-base text-slate-800">作業時間（分）</Label>
                              <Input
                                type="number"
                                value={record.duration}
                                onChange={(e) =>
                                  handleUpdateWorkRecord(phase.id, record.id, {
                                    duration: parseFloat(e.target.value) || 0,
                                  })
                                }
                                disabled={disabled}
                                className="text-base"
                                min="0"
                                step="1"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-base text-slate-800">作業内容</Label>
                            <Textarea
                              value={record.content}
                              onChange={(e) =>
                                handleUpdateWorkRecord(phase.id, record.id, {
                                  content: e.target.value,
                                })
                              }
                              placeholder="作業内容を入力..."
                              disabled={disabled}
                              rows={3}
                              className="text-base"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-base text-slate-800">
                              <Camera className="h-4 w-4" />
                              <span>作業中の写真</span>
                            </div>
                            <PhotoCaptureButton
                              position={record.id}
                              label="作業中の写真を撮影"
                              photoData={photoData}
                              onCapture={async (position, file) => {
                                if (onPhotoCapture) {
                                  await onPhotoCapture(position, file);
                                }
                              }}
                              disabled={disabled}
                            />
                            {record.photoUrls.length > 0 && (
                              <p className="text-base text-slate-700">
                                {record.photoUrls.length}枚の写真が撮影されています
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-base text-slate-800">コメント</Label>
                            <Textarea
                              value={record.comment || ""}
                              onChange={(e) =>
                                handleUpdateWorkRecord(phase.id, record.id, {
                                  comment: e.target.value,
                                })
                              }
                              placeholder="コメントを入力..."
                              disabled={disabled}
                              rows={2}
                              className="text-base"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleAddWorkRecord(phase.id)}
                    disabled={disabled}
                    className="w-full"
                  >
                    + 作業記録を追加
                  </Button>
                </div>

                <Separator />

                {/* 備考 */}
                <div className="space-y-2">
                  <Label className="text-base">備考</Label>
                  <Textarea
                    value={phase.note || ""}
                    onChange={(e) => {
                      if (!onWorkDataChange) return;
                      const updatedPhases = phases.map((p) =>
                        p.id === phase.id ? { ...p, note: e.target.value } : p
                      );
                      onWorkDataChange({
                        phases: updatedPhases,
                        overallProgress: workData?.overallProgress || 0,
                        notes: workData?.notes || "",
                      });
                    }}
                    placeholder="備考を入力..."
                    disabled={disabled}
                    rows={2}
                    className="text-base"
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* 部品の取り寄せ状況 */}
      {parts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Package className="h-5 w-5" />
              部品の取り寄せ状況
              <Badge variant="secondary" className="ml-2">
                {parts.length}件
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {parts.map((part) => {
              const isDelayed =
                part.status === "遅延" ||
                (part.expectedArrivalDate &&
                  new Date(part.expectedArrivalDate) < new Date() &&
                  part.status !== "到着済み");

              return (
                <div
                  key={part.id}
                  className={`p-3 border rounded-lg ${
                    isDelayed
                      ? "border-red-400 bg-red-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 text-base">
                      {part.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {isDelayed && (
                        <Badge variant="destructive" className="text-base">
                          遅延
                        </Badge>
                      )}
                      <Badge
                        variant={
                          part.status === "到着済み"
                            ? "default"
                            : part.status === "取り寄せ中"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-base"
                      >
                        {part.status}
                      </Badge>
                    </div>
                  </div>
                  {part.expectedArrivalDate && (
                    <p className="text-base text-slate-800">
                      到着予定日: {new Date(part.expectedArrivalDate).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                  {part.actualArrivalDate && (
                    <p className="text-base text-slate-800">
                      実際の到着日: {new Date(part.actualArrivalDate).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 作業メモ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5 shrink-0" />
            作業メモ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="作業メモを入力..."
            disabled={disabled}
            rows={4}
            className="text-base"
          />
        </CardContent>
      </Card>
    </div>
  );
}









