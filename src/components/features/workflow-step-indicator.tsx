"use client";

/**
 * ワークフロー・ステップ表示ウィジェット（改訂版）
 * 
 * JOBカードのステータス（field5）と連動し、実際のワークフローを正確に反映するコンポーネント
 * ヘッダーのrightAreaに配置して使用
 */

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Circle, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ZohoJob, ServiceKind } from "@/types";
import { UserRole } from "@/types/auth";
import { toast } from "sonner";

export interface WorkflowStepIndicatorProps {
  /** 現在のフェーズ（0-6） */
  currentPhase: number;
  /** ジョブデータ（ステータス判定用） */
  job?: ZohoJob | null;
  /** ジョブステータス（field5、jobがない場合に使用） */
  jobStatus?: string;
  /** 完了したフェーズのリスト（オプション、jobStatusから自動判定も可能） */
  completedPhases?: number[];
  /** スキップするフェーズのリスト（オプション、jobStatusから自動判定も可能） */
  skippedPhases?: number[];
  /** 除外するフェーズのリスト（例: [0, 4] - JOBカードに表示するため除外） */
  excludePhases?: number[];
  /** ユーザーロール */
  userRole?: UserRole;
  /** ジョブID（ナビゲーション用） */
  jobId?: string;
  /** 追加見積もりの有無（スキップ判定用） */
  hasAdditionalEstimate?: boolean;
  /** モバイル表示モード（デフォルト: false、trueの場合は常にコンパクト表示） */
  mobileMode?: boolean;
  /** ナビゲーション有効化 */
  enableNavigation?: boolean;
  /** 入庫区分（フェーズ名の動的変更用） */
  serviceKind?: ServiceKind;
}

/**
 * フェーズラベル（短縮版）のベース
 */
const PHASE_LABELS_SHORT_BASE: Record<number, string> = {
  0: "事前問診",
  1: "受付",
  2: "診断",
  3: "見積",
  4: "承認",
  5: "作業",
  6: "報告",
};

/**
 * フェーズラベル（フル版）のベース
 */
const PHASE_LABELS_FULL_BASE: Record<number, string> = {
  0: "事前チェックイン",
  1: "受付",
  2: "診断",
  3: "見積作成",
  4: "見積承認",
  5: "作業",
  6: "作業完了報告",
};

/**
 * 入庫区分に応じたフェーズラベルを取得
 */
function getPhaseLabels(serviceKind?: ServiceKind): { short: Record<number, string>; full: Record<number, string> } {
  const short = { ...PHASE_LABELS_SHORT_BASE };
  const full = { ...PHASE_LABELS_FULL_BASE };
  
  // 車検・12ヵ月点検の場合、フェーズ名を変更
  if (serviceKind === "車検" || serviceKind === "12ヵ月点検") {
    short[2] = "受入点検";
    full[2] = "受入点検";
    short[5] = "最終確認";
    full[5] = "最終確認";
  }
  
  return { short, full };
}

/**
 * 全フェーズのリスト
 */
const ALL_PHASES = [0, 1, 2, 3, 4, 5, 6] as const;

/**
 * フェーズとURLのマッピング
 */
const PHASE_ROUTES: Record<number, (jobId: string) => string> = {
  0: (jobId) => `/customer/pre-checkin/${jobId}`,
  1: (jobId) => `/?highlight=${jobId}`,
  2: (jobId) => `/mechanic/diagnosis/${jobId}`,
  3: (jobId) => `/admin/estimate/${jobId}`,
  4: (jobId) => `/customer/approval/${jobId}`,
  5: (jobId) => `/mechanic/work/${jobId}`,
  6: (jobId) => `/customer/report/${jobId}`,
};

/**
 * スキップされるフェーズを判定
 * 車検・12ヵ月点検で追加見積もりがない場合、Phase 3（見積）とPhase 4（承認）をスキップ
 */
function getSkippedPhases(
  job: ZohoJob | null | undefined,
  hasAdditionalEstimate: boolean = true
): number[] {
  if (!job) return [];
  
  const serviceKind = job.serviceKind || (job.field_service_kinds && job.field_service_kinds[0]);
  const isInspection = serviceKind === "車検" || serviceKind === "12ヵ月点検";
  
  if (isInspection && !hasAdditionalEstimate) {
    return [3, 4]; // 見積・承認をスキップ
  }
  
  return [];
}

/**
 * ステータス（field5）からフェーズの状態を判定
 */
function getPhaseStatusFromJobStatus(
  phase: number,
  jobStatus: string | undefined,
  skippedPhases: number[] = []
): "active" | "completed" | "skipped" | "pending" {
  if (!jobStatus) return "pending";
  
  // スキップされたフェーズ
  if (skippedPhases.includes(phase)) {
    return "skipped";
  }
  
  // Phase 0: 事前チェックイン
  if (phase === 0) {
    // field7に「【事前入力】」が含まれている場合、またはfield22（入庫日時）が設定されている場合
    // ここではjobStatusから判定できないため、completedPhasesに依存
    return "pending";
  }
  
  // Phase 1: 受付
  if (phase === 1) {
    if (jobStatus === "入庫待ち") return "active";
    if (["入庫済み", "見積作成待ち", "見積提示済み", "作業待ち", "出庫待ち", "出庫済み"].includes(jobStatus)) {
      return "completed";
    }
    return "pending";
  }
  
  // Phase 2: 診断
  if (phase === 2) {
    if (jobStatus === "入庫済み") return "active";
    if (["見積作成待ち", "見積提示済み", "作業待ち", "出庫待ち", "出庫済み"].includes(jobStatus)) {
      return "completed";
    }
    return "pending";
  }
  
  // Phase 3: 見積
  if (phase === 3) {
    if (jobStatus === "見積作成待ち") return "active";
    if (["見積提示済み", "作業待ち", "出庫待ち", "出庫済み"].includes(jobStatus)) {
      return "completed";
    }
    return "pending";
  }
  
  // Phase 4: 承認
  if (phase === 4) {
    if (jobStatus === "見積提示済み") return "active";
    if (["作業待ち", "出庫待ち", "出庫済み"].includes(jobStatus)) {
      return "completed";
    }
    return "pending";
  }
  
  // Phase 5: 作業
  if (phase === 5) {
    if (jobStatus === "作業待ち") return "active";
    if (["出庫待ち", "出庫済み"].includes(jobStatus)) {
      return "completed";
    }
    return "pending";
  }
  
  // Phase 6: 報告
  if (phase === 6) {
    if (jobStatus === "出庫待ち") return "active";
    if (jobStatus === "出庫済み") {
      return "completed";
    }
    return "pending";
  }
  
  return "pending";
}

/**
 * ユーザーロール別の表示フェーズを取得
 */
function getVisiblePhases(userRole: UserRole | undefined, excludePhases: number[] = []): number[] {
  const allPhases = [...ALL_PHASES];
  let visible = allPhases.filter(p => !excludePhases.includes(p));
  
  if (userRole === "mechanic") {
    // 整備士: 診断（Phase 2）と作業（Phase 5）のみ
    visible = visible.filter(p => p === 2 || p === 5);
  } else if (userRole === "customer") {
    // 顧客: 事前問診（Phase 0）、承認（Phase 4）、報告（Phase 6）のみ
    visible = visible.filter(p => p === 0 || p === 4 || p === 6);
  }
  // サービスフロント（front）と管理者（admin）は全フェーズ表示
  
  return visible;
}

/**
 * ナビゲーション権限チェック
 */
function canNavigateToPhase(phase: number, userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  
  if (userRole === "mechanic") {
    return phase === 2 || phase === 5;
  } else if (userRole === "customer") {
    return phase === 0 || phase === 4 || phase === 6;
  }
  return true; // サービスフロントと管理者は全フェーズにアクセス可能
}

/**
 * ワークフロー・ステップ表示ウィジェット
 */
export function WorkflowStepIndicator({
  currentPhase,
  job,
  jobStatus,
  completedPhases: providedCompletedPhases,
  skippedPhases: providedSkippedPhases,
  excludePhases = [],
  userRole,
  jobId,
  hasAdditionalEstimate = true,
  mobileMode = false,
  enableNavigation = true,
  serviceKind: providedServiceKind,
}: WorkflowStepIndicatorProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 入庫区分を判定（propsで指定されていない場合、jobから取得）
  const serviceKind = useMemo(() => {
    if (providedServiceKind) return providedServiceKind;
    if (!job) return undefined;
    
    const serviceKinds = job.field_service_kinds || (job.serviceKind ? [job.serviceKind] : []);
    return serviceKinds.length > 0 ? (serviceKinds[0] as ServiceKind) : undefined;
  }, [providedServiceKind, job]);
  
  // 入庫区分に応じたフェーズラベルを取得
  const phaseLabels = useMemo(() => {
    return getPhaseLabels(serviceKind);
  }, [serviceKind]);
  
  const PHASE_LABELS_SHORT = phaseLabels.short;
  const PHASE_LABELS_FULL = phaseLabels.full;

  // ジョブステータスの取得
  const actualJobStatus = useMemo(() => {
    return jobStatus || job?.field5 || undefined;
  }, [jobStatus, job?.field5]);

  // スキップフェーズの判定
  const skippedPhases = useMemo(() => {
    if (providedSkippedPhases) return providedSkippedPhases;
    return getSkippedPhases(job, hasAdditionalEstimate);
  }, [providedSkippedPhases, job, hasAdditionalEstimate]);

  // 完了フェーズの判定（ステータスから自動判定）
  const completedPhases = useMemo(() => {
    if (providedCompletedPhases) return providedCompletedPhases;
    
    if (!actualJobStatus) return [];
    
    const phases: number[] = [];
    
    // Phase 0: 事前チェックイン（job.field7またはjob.field22から判定）
    if (job?.field7 || job?.field22) {
      phases.push(0);
    }
    
    // Phase 1: 受付
    if (actualJobStatus !== "入庫待ち") {
      phases.push(1);
    }
    
    // Phase 2: 診断
    if (["見積作成待ち", "見積提示済み", "作業待ち", "出庫待ち", "出庫済み"].includes(actualJobStatus)) {
      phases.push(2);
    }
    
    // Phase 3: 見積（スキップされていない場合）
    if (!skippedPhases.includes(3) && ["見積提示済み", "作業待ち", "出庫待ち", "出庫済み"].includes(actualJobStatus)) {
      phases.push(3);
    }
    
    // Phase 4: 承認（スキップされていない場合）
    if (!skippedPhases.includes(4) && ["作業待ち", "出庫待ち", "出庫済み"].includes(actualJobStatus)) {
      phases.push(4);
    }
    
    // Phase 5: 作業
    if (["出庫待ち", "出庫済み"].includes(actualJobStatus)) {
      phases.push(5);
    }
    
    // Phase 6: 報告
    if (actualJobStatus === "出庫済み") {
      phases.push(6);
    }
    
    return phases;
  }, [providedCompletedPhases, actualJobStatus, job, skippedPhases]);

  // 表示するフェーズのリスト（スキップされたフェーズを除外）
  const visiblePhases = useMemo(() => {
    const phases = getVisiblePhases(userRole, excludePhases);
    // スキップされたフェーズを除外
    return phases.filter(phase => !skippedPhases.includes(phase));
  }, [userRole, excludePhases, skippedPhases]);

  // 現在のフェーズのインデックス
  const currentPhaseIndex = useMemo(() => {
    return visiblePhases.indexOf(currentPhase);
  }, [visiblePhases, currentPhase]);

  // フェーズの状態を判定
  const getPhaseStatus = useCallback((phase: number): "active" | "completed" | "skipped" | "pending" => {
    if (phase === currentPhase) return "active";
    if (skippedPhases.includes(phase)) return "skipped";
    if (completedPhases.includes(phase)) return "completed";
    return "pending";
  }, [currentPhase, skippedPhases, completedPhases]);

  // 前のフェーズに移動（スキップを考慮、visiblePhasesから既にスキップされたフェーズは除外済み）
  const handlePreviousPhase = () => {
    if (currentPhaseIndex > 0) {
      const previousPhase = visiblePhases[currentPhaseIndex - 1];
      if (canNavigateToPhase(previousPhase, userRole) && jobId) {
        router.push(PHASE_ROUTES[previousPhase](jobId));
      } else {
        toast.info("このフェーズにアクセスする権限がありません");
      }
    }
  };

  // 次のフェーズに移動（スキップを考慮、visiblePhasesから既にスキップされたフェーズは除外済み）
  const handleNextPhase = () => {
    if (currentPhaseIndex < visiblePhases.length - 1) {
      const nextPhase = visiblePhases[currentPhaseIndex + 1];
      // 次のフェーズに移動するには、権限があることとjobIdが必要
      // 現在のフェーズが完了しているか、または現在のフェーズがアクティブな場合は移動可能
      if (canNavigateToPhase(nextPhase, userRole) && jobId) {
        // 現在のフェーズが完了しているか、または現在のフェーズがアクティブな場合は移動可能
        const canMove = completedPhases.includes(currentPhase) || getPhaseStatus(currentPhase) === "active";
        if (canMove) {
          router.push(PHASE_ROUTES[nextPhase](jobId));
        } else {
          toast.info("このフェーズにアクセスするには、現在のフェーズを完了してください");
        }
      } else {
        toast.info("このフェーズにアクセスする権限がありません");
      }
    }
  };

  // 特定のフェーズに移動
  const handlePhaseClick = (phase: number) => {
    if (canNavigateToPhase(phase, userRole) && jobId) {
      const status = getPhaseStatus(phase);
      if (status === "completed" || status === "active") {
        router.push(PHASE_ROUTES[phase](jobId));
      } else if (status === "skipped") {
        toast.info("このフェーズはスキップされました");
      } else {
        toast.info("このフェーズはまだ完了していません");
      }
    } else {
      toast.info("このフェーズにアクセスする権限がありません");
    }
  };

  // 前へボタンの有効化判定
  const canNavigateToPrevious = useMemo(() => {
    if (currentPhaseIndex <= 0) return false;
    const previousPhase = visiblePhases[currentPhaseIndex - 1];
    return canNavigateToPhase(previousPhase, userRole) && !!jobId;
  }, [currentPhaseIndex, visiblePhases, userRole, jobId]);

  // 次へボタンの有効化判定
  const canNavigateToNext = useMemo(() => {
    if (currentPhaseIndex >= visiblePhases.length - 1) return false;
    const nextPhase = visiblePhases[currentPhaseIndex + 1];
    // 現在のフェーズが完了しているか、または現在のフェーズがアクティブな場合は移動可能
    const currentStatus = getPhaseStatus(currentPhase);
    const canMove = completedPhases.includes(currentPhase) || currentStatus === "active";
    return canNavigateToPhase(nextPhase, userRole) && canMove && !!jobId;
  }, [currentPhaseIndex, visiblePhases, userRole, completedPhases, currentPhase, jobId, getPhaseStatus]);

  // 前のフェーズのラベル
  const previousPhaseLabel = useMemo(() => {
    if (currentPhaseIndex > 0) {
      return PHASE_LABELS_SHORT[visiblePhases[currentPhaseIndex - 1]];
    }
    return "";
  }, [currentPhaseIndex, visiblePhases]);

  // 次のフェーズのラベル
  const nextPhaseLabel = useMemo(() => {
    if (currentPhaseIndex < visiblePhases.length - 1) {
      return PHASE_LABELS_SHORT[visiblePhases[currentPhaseIndex + 1]];
    }
    return "";
  }, [currentPhaseIndex, visiblePhases]);

  // デスクトップ表示（ステップカード形式）
  const renderDesktopSteps = () => {
    return (
      <div className="flex items-center gap-2 w-full">
        {visiblePhases.map((phase, index) => {
          const status = getPhaseStatus(phase);
          const isClickable = canNavigateToPhase(phase, userRole) && 
                             (status === "completed" || status === "active");
          
          return (
            <div key={phase} className="flex-1 flex flex-col">
              {/* 接続線 */}
              {index > 0 && (
                <div className={cn(
                  "h-0.5 mb-2 transition-colors",
                  completedPhases.includes(visiblePhases[index - 1]) 
                    ? "bg-slate-400" 
                    : "bg-slate-200"
                )} />
              )}
              
              {/* ステップカード */}
              <button
                onClick={() => isClickable && handlePhaseClick(phase)}
                disabled={!isClickable}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all",
                  "min-h-[80px] flex flex-col items-center justify-center gap-2",
                  status === "active" && "border-blue-600 bg-blue-50",
                  status === "completed" && "border-slate-400 bg-slate-50",
                  status === "pending" && "border-slate-300 bg-white",
                  status === "skipped" && "border-dashed border-slate-300 bg-slate-50",
                  isClickable && "cursor-pointer hover:shadow-md",
                  !isClickable && "cursor-default"
                )}
              >
                {/* アイコン */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  status === "active" && "bg-blue-600 text-white",
                  status === "completed" && "bg-slate-400 text-white",
                  status === "pending" && "border-2 border-slate-300 bg-white",
                  status === "skipped" && "border-2 border-dashed border-slate-300 bg-white"
                )}>
                  {status === "completed" && <Check className="h-5 w-5" />}
                  {status === "active" && <Circle className="h-5 w-5 fill-current" />}
                  {status === "pending" && <Circle className="h-5 w-5" />}
                  {status === "skipped" && <Minus className="h-5 w-5" />}
                </div>
                
                {/* フェーズ名 */}
                <span className={cn(
                  "text-base font-semibold",
                  status === "active" && "text-blue-700",
                  status === "completed" && "text-slate-700",
                  status === "pending" && "text-slate-500",
                  status === "skipped" && "text-slate-400"
                )}>
                  {PHASE_LABELS_SHORT[phase]}
                </span>
                
                {/* ステータス */}
                <span className={cn(
                  "text-sm",
                  status === "active" && "text-blue-600",
                  status === "completed" && "text-slate-600",
                  status === "pending" && "text-slate-400",
                  status === "skipped" && "text-slate-300"
                )}>
                  {status === "active" && "作業中"}
                  {status === "completed" && "完了済み"}
                  {status === "pending" && "未完了"}
                  {status === "skipped" && "スキップ"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // モバイル表示（コンパクト）
  const renderMobileSteps = () => {
    return (
      <div className="w-full space-y-3">
        {/* 現在のフェーズ表示 */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-semibold text-slate-900">
              {PHASE_LABELS_SHORT[currentPhase]}
            </span>
            <span className="text-base text-slate-600 ml-2">
              ({currentPhaseIndex + 1}/{visiblePhases.length})
            </span>
          </div>
        </div>
        
        {/* 進捗バー */}
        <Progress 
          value={(currentPhaseIndex + 1) / visiblePhases.length * 100} 
          className="h-2"
        />
        
        {/* コンパクトなステップ表示（横スクロール） */}
        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 pb-2">
            {visiblePhases.map((phase) => {
              const status = getPhaseStatus(phase);
              const isClickable = canNavigateToPhase(phase, userRole) && 
                                 (status === "completed" || status === "active");
              
              return (
                <button
                  key={phase}
                  onClick={() => isClickable && handlePhaseClick(phase)}
                  className={cn(
                    "px-4 py-2 rounded-lg border-2 shrink-0 transition-all",
                    "min-h-[48px] flex items-center gap-2",
                    status === "active" && "border-blue-600 bg-blue-50",
                    status === "completed" && "border-slate-400 bg-slate-50",
                    status === "pending" && "border-slate-300 bg-white",
                    status === "skipped" && "border-dashed border-slate-300 bg-slate-50"
                  )}
                >
                  {status === "completed" && <Check className="h-4 w-4 text-slate-600 shrink-0" />}
                  {status === "active" && <Circle className="h-4 w-4 text-blue-600 fill-blue-600 shrink-0" />}
                  {status === "pending" && <Circle className="h-4 w-4 text-slate-300 shrink-0" />}
                  {status === "skipped" && <Minus className="h-4 w-4 text-slate-300 shrink-0" />}
                  <span className="text-base font-medium text-slate-700">
                    {PHASE_LABELS_SHORT[phase]}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // モバイル表示（コンパクト）
  if (mobileMode) {
    return (
      <div className="w-full">
        {renderMobileSteps()}
        {enableNavigation && (
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              onClick={handlePreviousPhase}
              disabled={!canNavigateToPrevious}
              className="flex-1 h-12 text-base"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              前へ
            </Button>
            <Button
              variant="outline"
              onClick={handleNextPhase}
              disabled={!canNavigateToNext}
              className="flex-1 h-12 text-base"
            >
              次へ
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // デスクトップ表示（コンパクト - ヘッダー用）
  // 戻るボタンは左側にあるため、右側のrightAreaに配置されるワークフローインジケーターは
  // コンパクトな表示で、戻るボタンと競合しない
  return (
    <div className="flex items-center gap-2">
      {/* 現在のフェーズ表示 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700 tabular-nums shrink-0 whitespace-nowrap">
          {PHASE_LABELS_SHORT[currentPhase]}
        </span>
        <span className="text-xs text-slate-500 tabular-nums shrink-0">
          ({currentPhaseIndex + 1}/{visiblePhases.length})
        </span>
        {/* ステップドット表示 */}
        <div className="flex items-center gap-1">
          {visiblePhases.map((phase) => {
            const status = getPhaseStatus(phase);
            return (
              <button
                key={phase}
                onClick={() => handlePhaseClick(phase)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  status === "active" && "bg-blue-600 ring-2 ring-blue-200",
                  status === "completed" && "bg-slate-400",
                  status === "skipped" && "border-2 border-dashed border-slate-300 bg-transparent",
                  status === "pending" && "border-2 border-slate-300 bg-transparent",
                  (status === "completed" || status === "active") && canNavigateToPhase(phase, userRole) && "cursor-pointer hover:scale-125"
                )}
                aria-label={`Phase ${phase}: ${PHASE_LABELS_SHORT[phase]} - ${status === "active" ? "現在" : status === "completed" ? "完了" : status === "skipped" ? "スキップ" : "未完了"}`}
                title={`${PHASE_LABELS_SHORT[phase]} - ${status === "active" ? "作業中" : status === "completed" ? "完了済み" : status === "skipped" ? "スキップ" : "未完了"}`}
              />
            );
          })}
        </div>
      </div>
      {/* ナビゲーションボタン（オプション、戻るボタンと区別するため小さめに） */}
      {enableNavigation && (
        <div className="flex items-center gap-0.5 border-l border-slate-200 pl-2 ml-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousPhase}
            disabled={!canNavigateToPrevious}
            className="h-7 w-7 p-0"
            title={`前へ: ${previousPhaseLabel}`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextPhase}
            disabled={!canNavigateToNext}
            className="h-7 w-7 p-0"
            title={`次へ: ${nextPhaseLabel}`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

