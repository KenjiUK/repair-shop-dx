"use client";

/**
 * ワークフロー・フェーズ表示ウィジェット
 * 
 * 現在のフェーズ（Phase）を表示し、全体のワークフローを可視化するコンポーネント
 * ヘッダーのrightAreaに配置して使用
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Circle, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WorkflowPhaseIndicatorProps {
  /** 現在のフェーズ（0-6） */
  currentPhase: number;
  /** 完了したフェーズのリスト（例: [0, 1]） */
  completedPhases?: number[];
  /** スキップするフェーズのリスト（例: [3, 4] - 追加見積もりがない場合） */
  skippedPhases?: number[];
  /** 除外するフェーズのリスト（例: [0, 4] - JOBカードに表示するため除外） */
  excludePhases?: number[];
  /** モバイル表示モード（デフォルト: false、trueの場合は常にコンパクト表示） */
  mobileMode?: boolean;
  /** クリック時のハンドラ（詳細表示用、未指定の場合はモーダルを表示） */
  onClick?: () => void;
}

/**
 * フェーズラベル
 */
const PHASE_LABELS: Record<number, string> = {
  0: "事前チェックイン",
  1: "受付",
  2: "診断",
  3: "見積",
  4: "承認",
  5: "作業",
  6: "報告",
};

/**
 * 全フェーズのリスト
 */
const ALL_PHASES = [0, 1, 2, 3, 4, 5, 6] as const;

/**
 * ワークフロー・フェーズ表示ウィジェット
 */
export function WorkflowPhaseIndicator({
  currentPhase,
  completedPhases = [],
  skippedPhases = [],
  excludePhases = [],
  mobileMode = false,
  onClick,
}: WorkflowPhaseIndicatorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 表示するフェーズのリスト（除外フェーズを除く）
  const visiblePhases = ALL_PHASES.filter(phase => !excludePhases.includes(phase));
  const totalVisiblePhases = visiblePhases.length;
  const currentPhaseIndex: number = visiblePhases.indexOf(currentPhase as typeof visiblePhases[number]);
  const displayPhaseNumber = currentPhaseIndex >= 0 ? currentPhaseIndex + 1 : 1;

  // フェーズの状態を判定
  const getPhaseStatus = (phase: number): "active" | "completed" | "skipped" | "pending" => {
    if (phase === currentPhase) return "active";
    if (skippedPhases.includes(phase)) return "skipped";
    if (completedPhases.includes(phase)) return "completed";
    return "pending";
  };

  // クリックハンドラ
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsModalOpen(true);
    }
  };

  // ドット表示（デスクトップ用）
  const renderDots = () => {
    return (
      <div className="flex items-center gap-1">
        {visiblePhases.map((phase) => {
          const status = getPhaseStatus(phase);
          return (
            <div
              key={phase}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                status === "active" && "bg-blue-600",
                status === "completed" && "bg-slate-400",
                status === "skipped" && "border-2 border-dashed border-slate-300 bg-transparent",
                status === "pending" && "border-2 border-slate-300 bg-transparent"
              )}
              aria-label={`Phase ${phase}: ${PHASE_LABELS[phase]} - ${status === "active" ? "現在" : status === "completed" ? "完了" : status === "skipped" ? "スキップ" : "未完了"}`}
            />
          );
        })}
      </div>
    );
  };

  // モーダル表示（モバイル用の詳細表示）
  const renderModal = () => {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">ワークフロー進捗</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {ALL_PHASES.map((phase) => {
              // 除外フェーズは表示しない
              if (excludePhases.includes(phase)) return null;
              const status = getPhaseStatus(phase);
              return (
                <div
                  key={phase}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                    status === "active" && "bg-blue-50 border-blue-200",
                    status === "completed" && "bg-slate-50 border-slate-200",
                    status === "skipped" && "bg-slate-50 border-slate-200 border-dashed",
                    status === "pending" && "bg-white border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium text-slate-700">
                      Phase {phase}: {PHASE_LABELS[phase]}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {status === "active" && (
                      <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />
                    )}
                    {status === "completed" && (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                    {status === "skipped" && (
                      <Minus className="h-5 w-5 text-slate-300" />
                    )}
                    {status === "pending" && (
                      <Circle className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // モバイル表示（コンパクト）
  if (mobileMode) {
    return (
      <>
        <button
          onClick={handleClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors min-h-[48px]"
          aria-label="ワークフロー進捗を表示"
        >
          <span className="text-sm font-semibold text-slate-700 tabular-nums">
            Phase {displayPhaseNumber}/{totalVisiblePhases}
          </span>
        </button>
        {renderModal()}
      </>
    );
  }

  // デスクトップ表示（フル）
  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold text-slate-700 tabular-nums shrink-0">
          Phase {displayPhaseNumber}/{totalVisiblePhases}
        </span>
        {renderDots()}
      </div>
    </>
  );
}

